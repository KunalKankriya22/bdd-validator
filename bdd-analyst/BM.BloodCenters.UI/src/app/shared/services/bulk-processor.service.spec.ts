import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import {
  BulkProcessorService,
  BatchResult,
  ProcessingProgress,
  BulkProcessingConfig,
} from './bulk-processor.service';

describe('BulkProcessorService', () => {
  let service: BulkProcessorService;
  let httpMock: HttpTestingController;

  const API = '/api/process';

  const baseConfig: BulkProcessingConfig = {
    batchSize: 2,
    maxRetries: 0,
    retryDelayMs: 100,
    stopOnFailure: true,
    enableResume: false,
    yieldBetweenBatches: true,
    yieldDelayMs: 0,
    concurrency: 1,
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [BulkProcessorService],
    });
    service = TestBed.inject(BulkProcessorService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  // ── localStorage methods ──────────────────────────────────────────

  describe('getProcessingState', () => {
    it('returns null when no state exists for the given jobId', () => {
      const result = service.getProcessingState('nonexistent');

      expect(result).toBeNull();
    });

    it('returns parsed state from localStorage', () => {
      const state = {
        jobId: 'job-1',
        lastCompletedBatch: 2,
        totalBatches: 5,
        config: baseConfig,
        timestamp: 1000,
      };
      localStorage.setItem('bulk_processing_job-1', JSON.stringify(state));

      const result = service.getProcessingState('job-1');

      expect(result).toEqual(state);
    });

    it('returns null when localStorage throws an error', () => {
      const original = localStorage.getItem;
      localStorage.getItem = () => { throw new Error('access denied'); };

      const result = service.getProcessingState('job-1');

      localStorage.getItem = original;
      expect(result).toBeNull();
    });
  });

  describe('clearProcessingState', () => {
    it('removes stored state from localStorage', () => {
      localStorage.setItem('bulk_processing_job-1', '{}');

      service.clearProcessingState('job-1');

      expect(localStorage.getItem('bulk_processing_job-1')).toBeNull();
    });

    it('handles localStorage error silently', () => {
      const original = localStorage.removeItem;
      localStorage.removeItem = () => { throw new Error('error'); };

      expect(() => service.clearProcessingState('job-1')).not.toThrow();

      localStorage.removeItem = original;
    });
  });

  describe('getAllSavedStates', () => {
    it('returns empty array when no states are saved', () => {
      const result = service.getAllSavedStates();

      expect(result).toEqual([]);
    });

    it('returns only states with the bulk_processing_ prefix', () => {
      const state1 = { jobId: 'a', lastCompletedBatch: 0, totalBatches: 1, config: baseConfig, timestamp: 1 };
      const state2 = { jobId: 'b', lastCompletedBatch: 1, totalBatches: 3, config: baseConfig, timestamp: 2 };
      localStorage.setItem('bulk_processing_a', JSON.stringify(state1));
      localStorage.setItem('bulk_processing_b', JSON.stringify(state2));
      localStorage.setItem('unrelated_key', 'data');

      const result = service.getAllSavedStates();

      expect(result.length).toBe(2);
      expect(result).toContainEqual(jasmine.objectContaining({ jobId: 'a' }));
      expect(result).toContainEqual(jasmine.objectContaining({ jobId: 'b' }));
    });

    it('handles localStorage error silently', () => {
      localStorage.setItem('bulk_processing_x', '{invalid json');

      const result = service.getAllSavedStates();

      expect(result).toEqual([]);
    });
  });

  // ── currentProcessingProgress ─────────────────────────────────────

  describe('currentProcessingProgress', () => {
    it('returns null before any processing has started', () => {
      expect(service.currentProcessingProgress).toBeNull();
    });
  });

  // ── processBulk ───────────────────────────────────────────────────

  describe('processBulk', () => {

    describe('batch creation', () => {
      it.each([
        { records: [1, 2, 3, 4], batchSize: 2, expectedBatches: 2, label: 'even division' },
        { records: [1, 2, 3, 4, 5], batchSize: 2, expectedBatches: 3, label: 'partial last batch' },
        { records: [1], batchSize: 2, expectedBatches: 1, label: 'single record' },
        { records: [1, 2, 3, 4, 5, 6], batchSize: 3, expectedBatches: 2, label: 'larger batch size' },
      ])('creates $expectedBatches batches for $label ($records.length records, batchSize $batchSize)',
        fakeAsync(({ records, batchSize, expectedBatches }) => {
          const results: BatchResult[] = [];

          service.processBulk(records, API, { ...baseConfig, batchSize }).subscribe(r => results.push(r));

          tick(0);
          for (let i = 0; i < expectedBatches; i++) {
            httpMock.expectOne(API).flush({});
          }
          tick(0);

          expect(results.length).toBe(expectedBatches);
        })
      );

      it('handles empty records array without making HTTP calls', fakeAsync(() => {
        const progressUpdates: ProcessingProgress[] = [];
        service.progress$.subscribe(p => progressUpdates.push({ ...p }));

        service.processBulk([], API, baseConfig).subscribe();

        tick(0);

        httpMock.expectNone(API);
        const final = progressUpdates[progressUpdates.length - 1];
        expect(final.status).toBe('completed');
        expect(final.totalBatches).toBe(0);
      }));
    });

    describe('payload', () => {
      it('sends correct payload per batch including jobId and records', fakeAsync(() => {
        service.processBulk(['a', 'b', 'c'], API, { ...baseConfig, batchSize: 2 }, 'my-job').subscribe();

        tick(0);

        const req0 = httpMock.expectOne(API);
        expect(req0.request.body).toEqual(jasmine.objectContaining({
          jobId: 'my-job',
          batchNumber: 0,
          totalBatches: 2,
          records: ['a', 'b'],
        }));
        req0.flush({});

        const req1 = httpMock.expectOne(API);
        expect(req1.request.body).toEqual(jasmine.objectContaining({
          batchNumber: 1,
          records: ['c'],
        }));
        req1.flush({});

        tick(0);
      }));

      it('maps successful HTTP response to BatchResult with response data', fakeAsync(() => {
        const results: BatchResult[] = [];
        const responseData = { id: 1, status: 'processed' };

        service.processBulk([1], API, { ...baseConfig, batchSize: 1 }).subscribe(r => results.push(r));

        tick(0);
        httpMock.expectOne(API).flush(responseData);
        tick(0);

        expect(results[0]).toEqual(jasmine.objectContaining({
          batchNumber: 0,
          success: true,
          response: responseData,
        }));
      }));
    });

    describe('progress tracking', () => {
      it('initializes progress with correct values', fakeAsync(() => {
        const progressUpdates: ProcessingProgress[] = [];
        service.progress$.subscribe(p => progressUpdates.push({ ...p }));

        service.processBulk([1, 2, 3, 4], API, { ...baseConfig, batchSize: 2 }, 'j1').subscribe();

        const initial = progressUpdates[0];
        expect(initial.jobId).toBe('j1');
        expect(initial.totalRecords).toBe(4);
        expect(initial.totalBatches).toBe(2);
        expect(initial.processedBatches).toBe(0);
        expect(initial.failedBatches).toBe(0);
        expect(initial.percentage).toBe(0);
        expect(initial.status).toBe('processing');

        tick(0);
        httpMock.expectOne(API).flush({});
        httpMock.expectOne(API).flush({});
        tick(0);
      }));

      it('updates percentage as batches complete', fakeAsync(() => {
        const progressUpdates: ProcessingProgress[] = [];
        service.progress$.subscribe(p => progressUpdates.push({ ...p }));

        service.processBulk([1, 2, 3, 4], API, { ...baseConfig, batchSize: 2 }, 'j1').subscribe();

        tick(0);
        httpMock.expectOne(API).flush({});

        const afterBatch0 = progressUpdates.find(p => p.processedBatches === 1);
        expect(afterBatch0!.percentage).toBe(50);

        httpMock.expectOne(API).flush({});

        const afterBatch1 = progressUpdates.find(p => p.processedBatches === 2);
        expect(afterBatch1!.percentage).toBe(100);

        tick(0);
      }));

      it('uses provided jobId in progress', fakeAsync(() => {
        service.processBulk([1], API, { ...baseConfig, batchSize: 1 }, 'custom-id').subscribe();

        expect(service.currentProcessingProgress!.jobId).toBe('custom-id');

        tick(0);
        httpMock.expectOne(API).flush({});
        tick(0);
      }));

      it('generates a jobId when none is provided', fakeAsync(() => {
        service.processBulk([1], API, { ...baseConfig, batchSize: 1 }).subscribe();

        const jobId = service.currentProcessingProgress!.jobId;
        expect(jobId).toBeTruthy();
        expect(jobId.length).toBeGreaterThan(0);

        tick(0);
        httpMock.expectOne(API).flush({});
        tick(0);
      }));

      it('sets initial percentage based on resume startBatch', fakeAsync(() => {
        const progressUpdates: ProcessingProgress[] = [];
        service.progress$.subscribe(p => progressUpdates.push({ ...p }));

        service.processBulk([1, 2, 3, 4, 5, 6], API, { ...baseConfig, batchSize: 2 }, 'rp', 2).subscribe();

        const initial = progressUpdates[0];
        expect(initial.processedBatches).toBe(2);
        expect(initial.percentage).toBeCloseTo(66.67, 0);

        tick(0);
        httpMock.expectOne(API).flush({});
        tick(0);
      }));
    });

    describe('completion', () => {
      it('sets status to completed when all batches succeed', fakeAsync(() => {
        const progressUpdates: ProcessingProgress[] = [];
        service.progress$.subscribe(p => progressUpdates.push({ ...p }));

        service.processBulk([1, 2], API, { ...baseConfig, batchSize: 2 }).subscribe();

        tick(0);
        httpMock.expectOne(API).flush({});
        tick(0);

        const final = progressUpdates[progressUpdates.length - 1];
        expect(final.status).toBe('completed');
      }));

      it('sets status to failed when batches fail with stopOnFailure false', fakeAsync(() => {
        const progressUpdates: ProcessingProgress[] = [];
        service.progress$.subscribe(p => progressUpdates.push({ ...p }));

        service.processBulk([1, 2, 3, 4], API, {
          ...baseConfig,
          batchSize: 2,
          stopOnFailure: false,
        }).subscribe();

        tick(0);
        httpMock.expectOne(API).flush('error', { status: 500, statusText: 'Server Error' });
        httpMock.expectOne(API).flush({});
        tick(0);

        const final = progressUpdates[progressUpdates.length - 1];
        expect(final.status).toBe('failed');
        expect(final.failedBatches).toBe(1);
      }));

      it('clears stored state on successful completion when enableResume is true', fakeAsync(() => {
        service.processBulk([1, 2], API, {
          ...baseConfig,
          enableResume: true,
          batchSize: 2,
        }, 'clear-job').subscribe();

        expect(localStorage.getItem('bulk_processing_clear-job')).toBeTruthy();

        tick(0);
        httpMock.expectOne(API).flush({});
        tick(0);

        expect(localStorage.getItem('bulk_processing_clear-job')).toBeNull();
      }));

      it('does not clear stored state when processing has failures', fakeAsync(() => {
        service.processBulk([1, 2, 3, 4], API, {
          ...baseConfig,
          enableResume: true,
          batchSize: 2,
          stopOnFailure: false,
        }, 'fail-job').subscribe();

        tick(0);
        httpMock.expectOne(API).flush('err', { status: 500, statusText: 'Error' });
        httpMock.expectOne(API).flush({});
        tick(0);

        expect(localStorage.getItem('bulk_processing_fail-job')).toBeTruthy();
      }));
    });

    describe('error handling', () => {
      it('stops processing on first failure when stopOnFailure is true', fakeAsync(() => {
        let error: any;

        service.processBulk([1, 2, 3, 4], API, {
          ...baseConfig,
          batchSize: 2,
          stopOnFailure: true,
        }).subscribe({ error: e => error = e });

        tick(0);
        httpMock.expectOne(API).flush('fail', { status: 500, statusText: 'Error' });
        tick(0);

        expect(error).toBeTruthy();
        httpMock.expectNone(API);
      }));

      it('continues processing after failure when stopOnFailure is false', fakeAsync(() => {
        const results: BatchResult[] = [];

        service.processBulk([1, 2, 3, 4], API, {
          ...baseConfig,
          batchSize: 2,
          stopOnFailure: false,
        }).subscribe(r => results.push(r));

        tick(0);
        httpMock.expectOne(API).flush('err', { status: 500, statusText: 'Error' });
        httpMock.expectOne(API).flush({ ok: true });
        tick(0);

        expect(results.length).toBe(2);
        expect(results[0].success).toBe(false);
        expect(results[1].success).toBe(true);
      }));

      it('increments failedBatches count on each failed batch', fakeAsync(() => {
        service.processBulk([1, 2, 3, 4, 5, 6], API, {
          ...baseConfig,
          batchSize: 2,
          stopOnFailure: false,
        }).subscribe();

        tick(0);
        httpMock.expectOne(API).flush({});
        httpMock.expectOne(API).flush('err', { status: 500, statusText: 'Error' });
        httpMock.expectOne(API).flush('err', { status: 500, statusText: 'Error' });
        tick(0);

        const progress = service.currentProcessingProgress!;
        expect(progress.failedBatches).toBe(2);
        expect(progress.processedBatches).toBe(3);
      }));
    });

    describe('retry logic', () => {
      it('retries a failed batch and succeeds on retry', fakeAsync(() => {
        const results: BatchResult[] = [];

        service.processBulk([1, 2], API, {
          ...baseConfig,
          batchSize: 2,
          maxRetries: 1,
          retryDelayMs: 100,
        }).subscribe(r => results.push(r));

        tick(0);

        httpMock.expectOne(API).flush('fail', { status: 500, statusText: 'Error' });

        tick(100);
        httpMock.expectOne(API).flush({ data: 'ok' });
        tick(0);

        expect(results.length).toBe(1);
        expect(results[0].success).toBe(true);
      }));

      it('applies exponential backoff between retries', fakeAsync(() => {
        service.processBulk([1], API, {
          ...baseConfig,
          batchSize: 1,
          maxRetries: 2,
          retryDelayMs: 100,
          stopOnFailure: false,
        }).subscribe();

        tick(0);

        httpMock.expectOne(API).flush('fail', { status: 500, statusText: 'Error' });

        tick(100);
        httpMock.expectOne(API).flush('fail', { status: 500, statusText: 'Error' });

        tick(200);
        httpMock.expectOne(API).flush({ ok: true });
        tick(0);
      }));

      it('reports failure after all retries are exhausted with stopOnFailure false', fakeAsync(() => {
        const results: BatchResult[] = [];

        service.processBulk([1], API, {
          ...baseConfig,
          batchSize: 1,
          maxRetries: 1,
          retryDelayMs: 100,
          stopOnFailure: false,
        }).subscribe(r => results.push(r));

        tick(0);

        httpMock.expectOne(API).flush('fail', { status: 500, statusText: 'Error' });

        tick(100);
        httpMock.expectOne(API).flush('fail', { status: 500, statusText: 'Error' });
        tick(0);

        expect(results.length).toBe(1);
        expect(results[0].success).toBe(false);
        expect(results[0].error).toBeTruthy();
      }));
    });

    describe('resume state persistence', () => {
      it('saves initial processing state when enableResume is true', fakeAsync(() => {
        service.processBulk([1, 2], API, {
          ...baseConfig,
          enableResume: true,
          batchSize: 2,
        }, 'save-job').subscribe();

        const savedState = JSON.parse(localStorage.getItem('bulk_processing_save-job')!);
        expect(savedState.jobId).toBe('save-job');
        expect(savedState.lastCompletedBatch).toBe(-1);
        expect(savedState.totalBatches).toBe(1);

        tick(0);
        httpMock.expectOne(API).flush({});
        tick(0);
      }));

      it('does not save state when enableResume is false', fakeAsync(() => {
        service.processBulk([1, 2], API, {
          ...baseConfig,
          enableResume: false,
          batchSize: 2,
        }, 'no-save').subscribe();

        expect(localStorage.getItem('bulk_processing_no-save')).toBeNull();

        tick(0);
        httpMock.expectOne(API).flush({});
        tick(0);
      }));

      it('updates stored batch progress on successful batch', fakeAsync(() => {
        service.processBulk([1, 2, 3, 4, 5, 6], API, {
          ...baseConfig,
          enableResume: true,
          batchSize: 2,
          stopOnFailure: false,
        }, 'progress-job').subscribe();

        tick(0);
        httpMock.expectOne(API).flush({});

        const raw = localStorage.getItem('bulk_processing_progress-job');
        expect(raw).toBeTruthy();
        expect(JSON.parse(raw!).lastCompletedBatch).toBe(0);

        httpMock.expectOne(API).flush({});
        httpMock.expectOne(API).flush({});
        tick(0);
      }));

      it('handles localStorage.setItem error during save silently', fakeAsync(() => {
        const original = localStorage.setItem;
        localStorage.setItem = () => { throw new Error('quota exceeded'); };

        service.processBulk([1, 2], API, {
          ...baseConfig,
          enableResume: true,
          batchSize: 2,
        }, 'err-save').subscribe();

        tick(0);
        httpMock.expectOne(API).flush({});
        tick(0);

        localStorage.setItem = original;
        expect(service.currentProcessingProgress!.status).toBe('completed');
      }));
    });

    describe('resume from batch', () => {
      it('starts processing from the specified batch number', fakeAsync(() => {
        const results: BatchResult[] = [];

        service.processBulk([1, 2, 3, 4, 5, 6], API, {
          ...baseConfig,
          batchSize: 2,
        }, 'resume', 1).subscribe(r => results.push(r));

        tick(0);

        const req1 = httpMock.expectOne(API);
        expect(req1.request.body.batchNumber).toBe(1);
        req1.flush({});

        const req2 = httpMock.expectOne(API);
        expect(req2.request.body.batchNumber).toBe(2);
        req2.flush({});

        tick(0);

        expect(results.length).toBe(2);
      }));
    });

    describe('yielding configuration', () => {
      it('skips timer delay when yieldBetweenBatches is false', fakeAsync(() => {
        const results: BatchResult[] = [];

        service.processBulk([1, 2], API, {
          ...baseConfig,
          batchSize: 1,
          yieldBetweenBatches: false,
          yieldDelayMs: 50,
        }).subscribe(r => results.push(r));

        tick(0);
        httpMock.expectOne(API).flush({});
        httpMock.expectOne(API).flush({});
        tick(0);

        // Results arrive immediately without needing extra tick(50) for each
        expect(results.length).toBe(2);
      }));

      it('applies timer delay when yieldDelayMs is greater than zero', fakeAsync(() => {
        const results: BatchResult[] = [];

        service.processBulk([1, 2], API, {
          ...baseConfig,
          batchSize: 1,
          yieldBetweenBatches: true,
          yieldDelayMs: 50,
        }).subscribe(r => results.push(r));

        tick(0);
        httpMock.expectOne(API).flush({});
        httpMock.expectOne(API).flush({});

        expect(results.length).toBe(0);

        tick(50);
        expect(results.length).toBe(1);

        tick(50);
        expect(results.length).toBe(2);
      }));
    });

    describe('concurrency', () => {
      it('processes batches concurrently when concurrency is greater than 1', fakeAsync(() => {
        const results: BatchResult[] = [];

        service.processBulk([1, 2, 3, 4], API, {
          ...baseConfig,
          batchSize: 2,
          concurrency: 2,
        }).subscribe(r => results.push(r));

        tick(0);

        const reqs = httpMock.match(API);
        expect(reqs.length).toBe(2);

        reqs[0].flush({});
        reqs[1].flush({});
        tick(0);

        expect(results.length).toBe(2);
      }));
    });
  });

  // ── progress$ ─────────────────────────────────────────────────────

  describe('progress$', () => {
    it('returns an observable that emits progress updates', fakeAsync(() => {
      const updates: ProcessingProgress[] = [];
      service.progress$.subscribe(p => updates.push({ ...p }));

      service.processBulk([1, 2], API, { ...baseConfig, batchSize: 2 }, 'obs-test').subscribe();

      tick(0);
      httpMock.expectOne(API).flush({});
      tick(0);

      expect(updates.length).toBeGreaterThan(0);
      expect(updates[0].jobId).toBe('obs-test');
    }));
  });

  // ── cancelProcessing ──────────────────────────────────────────────

  describe('cancelProcessing', () => {
    it('does not throw and does not emit progress when no processing is active', () => {
      const updates: ProcessingProgress[] = [];
      service.progress$.subscribe(p => updates.push({ ...p }));

      expect(() => service.cancelProcessing()).not.toThrow();

      expect(updates.length).toBe(0);
    });

    it('sets status to cancelled and emits progress update', fakeAsync(() => {
      const progressUpdates: ProcessingProgress[] = [];
      service.progress$.subscribe(p => progressUpdates.push({ ...p }));

      service.processBulk([1, 2, 3, 4], API, { ...baseConfig, batchSize: 2 }).subscribe();

      service.cancelProcessing();
      tick(0);

      const cancelled = progressUpdates.find(p => p.status === 'cancelled');
      expect(cancelled).toBeTruthy();

      httpMock.expectNone(API);
    }));

    it('stops batch processing mid-stream', fakeAsync(() => {
      const results: BatchResult[] = [];

      service.processBulk([1, 2, 3, 4], API, { ...baseConfig, batchSize: 2 }).subscribe(r => results.push(r));

      tick(0);
      httpMock.expectOne(API).flush({});

      service.cancelProcessing();
      httpMock.match(API);
      tick(0);

      expect(results.length).toBe(1);
      expect(results[0].batchNumber).toBe(0);
    }));
  });

  // ── ngOnDestroy ────────────────────────────────────────────────────

  describe('ngOnDestroy', () => {
    it('cancels in-flight processing and completes progress$ observable', fakeAsync(() => {
      const results: BatchResult[] = [];
      let progressCompleted = false;

      service.progress$.subscribe({
        complete: () => progressCompleted = true,
      });

      service.processBulk([1, 2, 3, 4], API, { ...baseConfig, batchSize: 2 }).subscribe(r => results.push(r));

      tick(0);
      httpMock.expectOne(API).flush({});

      service.ngOnDestroy();
      httpMock.match(API); // drain any pending requests
      tick(0);

      // Processing was stopped and progress$ completed
      expect(results.length).toBe(1);
      expect(progressCompleted).toBe(true);
    }));

    it('completes progress$ even when no processing was active', () => {
      let progressCompleted = false;
      service.progress$.subscribe({ complete: () => progressCompleted = true });

      service.ngOnDestroy();

      expect(progressCompleted).toBe(true);
    });
  });

  // ── resumeProcessing ──────────────────────────────────────────────

  describe('resumeProcessing', () => {
    it('returns null when no saved state exists for the jobId', () => {
      const result = service.resumeProcessing([1, 2, 3], API, 'unknown');

      expect(result).toBeNull();
    });

    it('resets cancelSubject so processing works after a prior cancellation', fakeAsync(() => {
      // First: start and cancel
      service.processBulk([1, 2], API, { ...baseConfig, batchSize: 2 }, 'first-run').subscribe();
      service.cancelProcessing();
      tick(0);
      httpMock.match(API); // drain any pending

      // Second: save state and resume
      const savedState = {
        jobId: 'cancel-resume',
        lastCompletedBatch: 0,
        totalBatches: 2,
        config: { ...baseConfig, batchSize: 2, enableResume: true } as BulkProcessingConfig,
        timestamp: Date.now(),
      };
      localStorage.setItem('bulk_processing_cancel-resume', JSON.stringify(savedState));

      const results: BatchResult[] = [];
      const obs = service.resumeProcessing([1, 2, 3, 4], API, 'cancel-resume');
      expect(obs).not.toBeNull();
      obs!.subscribe(r => results.push(r));

      tick(0);
      httpMock.expectOne(API).flush({});
      tick(0);

      expect(results.length).toBe(1);
      expect(results[0].success).toBe(true);
    }));

    it('resumes processing from the batch after lastCompletedBatch', fakeAsync(() => {
      const savedState = {
        jobId: 'resume-test',
        lastCompletedBatch: 1,
        totalBatches: 3,
        config: { ...baseConfig, batchSize: 2, enableResume: true } as BulkProcessingConfig,
        timestamp: Date.now(),
      };
      localStorage.setItem('bulk_processing_resume-test', JSON.stringify(savedState));

      const results: BatchResult[] = [];
      const obs = service.resumeProcessing([1, 2, 3, 4, 5, 6], API, 'resume-test');

      expect(obs).not.toBeNull();
      obs!.subscribe(r => results.push(r));

      tick(0);

      const req = httpMock.expectOne(API);
      expect(req.request.body.batchNumber).toBe(2);
      req.flush({});

      tick(0);

      expect(results.length).toBe(1);
      expect(results[0].batchNumber).toBe(2);
    }));
  });
});
