import { TestBed } from '@angular/core/testing';
import { BulkProcessorMockService, BulkProcessingTestScenarios } from './bulk-processor-mock.service';

describe('BulkProcessorMockService', () => {
  let service: BulkProcessorMockService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BulkProcessorMockService]
    });

    service = TestBed.inject(BulkProcessorMockService);
    service.configure({
      successRate: 1.0,
      responseDelay: 0,
      delayVariation: 0,
      networkErrorRate: 0,
      validationErrorRate: 0,
      serverErrorRate: 0,
      verbose: false
    });
  });

  describe('Configuration', () => {
    it('should merge partial config with defaults', () => {
      service.configure({ responseDelay: 100 });
      const stats = service.getStats();
      expect(stats).toBeDefined();
    });
  });

  describe('Reset', () => {
    it('should clear statistics and processed batches', (done) => {
      const body = { jobId: 'j1', batchNumber: 1, totalBatches: 1, records: [{ id: '1' }] };

      service.post('http://api/bulk', body).subscribe(() => {
        expect(service.getStats().totalRequests).toBe(1);
        service.reset();
        expect(service.getStats().totalRequests).toBe(0);
        done();
      });
    });
  });

  describe('Post - Success Path', () => {
    it('should return processed result with batch metadata', (done) => {
      const body = {
        jobId: 'job-1',
        batchNumber: 1,
        totalBatches: 1,
        records: [{ id: 'rec-1' }, { id: 'rec-2' }]
      };

      service.post<any>('http://api/bulk', body).subscribe((result) => {
        expect(result.success).toBe(true);
        expect(result.batchNumber).toBe(1);
        expect(result.records.length).toBe(2);
        expect(result.timestamp).toBeDefined();
        done();
      });
    });
  });

  describe('Idempotency', () => {
    it('should return cached result for repeated batch key', (done) => {
      service.configure({ enableIdempotency: true });
      const body = {
        jobId: 'job-idem',
        batchNumber: 1,
        totalBatches: 1,
        records: [{ id: 'rec-1' }]
      };

      service.post<any>('http://api/bulk', body).subscribe((firstResult) => {
        service.post<any>('http://api/bulk', body).subscribe((secondResult) => {
          expect(secondResult).toEqual(firstResult);
          done();
        });
      });
    });

    it('should not cache when idempotency is disabled', (done) => {
      service.configure({ enableIdempotency: false });
      const body = {
        jobId: 'job-no-idem',
        batchNumber: 1,
        totalBatches: 1,
        records: [{ id: 'rec-1' }]
      };

      service.post<any>('http://api/bulk', body).subscribe(() => {
        expect(service.getStats().totalRequests).toBe(1);
        service.post<any>('http://api/bulk', body).subscribe(() => {
          expect(service.getStats().totalRequests).toBe(2);
          done();
        });
      });
    });
  });

  describe('Failure Simulation', () => {
    it('should simulate network error when networkErrorRate is 1', (done) => {
      service.configure({ networkErrorRate: 1.0, successRate: 1.0 });
      const body = { jobId: 'j-net', batchNumber: 1, totalBatches: 1, records: [{ id: '1' }] };

      service.post<any>('http://api/bulk', body).subscribe({
        error: (err: any) => {
          expect(err.status).toBe(0);
          expect(service.getStats().failedRequests).toBe(1);
          done();
        }
      });
    });

    it('should simulate validation error when validationErrorRate is 1', (done) => {
      service.configure({ networkErrorRate: 0, validationErrorRate: 1.0, successRate: 1.0 });
      const body = { jobId: 'j-val', batchNumber: 1, totalBatches: 1, records: [{ id: '1' }] };

      service.post<any>('http://api/bulk', body).subscribe({
        error: (err: any) => {
          expect(err.status).toBe(400);
          expect(err.error.details).toBeDefined();
          done();
        }
      });
    });

    it('should simulate server error when serverErrorRate is 1', (done) => {
      service.configure({ networkErrorRate: 0, validationErrorRate: 0, serverErrorRate: 1.0, successRate: 1.0 });
      const body = { jobId: 'j-srv', batchNumber: 1, totalBatches: 1, records: [{ id: '1' }] };

      service.post<any>('http://api/bulk', body).subscribe({
        error: (err: any) => {
          expect(err.status).toBe(500);
          done();
        }
      });
    });

    it('should simulate general failure when successRate is 0', (done) => {
      service.configure({
        networkErrorRate: 0,
        validationErrorRate: 0,
        serverErrorRate: 0,
        successRate: 0
      });
      const body = { jobId: 'j-gen', batchNumber: 1, totalBatches: 1, records: [{ id: '1' }] };

      service.post<any>('http://api/bulk', body).subscribe({
        error: (err: any) => {
          expect(err.status).toBe(503);
          done();
        }
      });
    });
  });

  describe('Statistics', () => {
    it('should track total, successful, and failed request counts', (done) => {
      const body = { jobId: 'j-stats', batchNumber: 1, totalBatches: 1, records: [{ id: '1' }] };

      service.post('http://api/bulk', body).subscribe(() => {
        const stats = service.getStats();
        expect(stats.totalRequests).toBe(1);
        expect(stats.successfulRequests).toBe(1);
        expect(stats.successRate).toBe(1);
        expect(stats.averageDelay).toBeDefined();
        done();
      });
    });

    it('should compute zero averages when no requests made', () => {
      const stats = service.getStats();
      expect(stats.averageDelay).toBe(0);
      expect(stats.successRate).toBe(0);
    });
  });

  describe('Test Scenarios', () => {
    it.each([
      ['perfect', BulkProcessingTestScenarios.perfect],
      ['slowNetwork', BulkProcessingTestScenarios.slowNetwork],
      ['unreliableNetwork', BulkProcessingTestScenarios.unreliableNetwork],
      ['serverErrors', BulkProcessingTestScenarios.serverErrors],
      ['validationErrors', BulkProcessingTestScenarios.validationErrors],
      ['realistic', BulkProcessingTestScenarios.realistic],
      ['stressTest', BulkProcessingTestScenarios.stressTest],
    ])('should configure %s scenario without error', (_, configureFn) => {
      expect(() => configureFn(service)).not.toThrow();
    });
  });
});
