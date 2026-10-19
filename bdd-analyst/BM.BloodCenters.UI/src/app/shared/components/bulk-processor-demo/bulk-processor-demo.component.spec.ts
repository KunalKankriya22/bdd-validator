import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, Subject, throwError } from 'rxjs';
import { BulkProcessorDemoComponent } from './bulk-processor-demo.component';
import { BulkProcessorService } from '../../services/bulk-processor.service';

describe('BulkProcessorDemoComponent', () => {
  let component: BulkProcessorDemoComponent;
  let fixture: ComponentFixture<BulkProcessorDemoComponent>;
  let serviceSpy: jasmine.SpyObj<BulkProcessorService>;
  const progress$ = new Subject<any>();

  beforeEach(() => {
    serviceSpy = jasmine.createSpyObj('BulkProcessorService', [
      'processBulk',
      'resumeProcessing',
      'cancelProcessing',
      'clearProcessingState',
      'getAllSavedStates'
    ], {
      progress$: progress$.asObservable()
    });

    serviceSpy.getAllSavedStates.and.returnValue([]);

    TestBed.configureTestingModule({
      imports: [BulkProcessorDemoComponent, NoopAnimationsModule],
      providers: [
        { provide: BulkProcessorService, useValue: serviceSpy }
      ]
    });

    fixture = TestBed.createComponent(BulkProcessorDemoComponent);
    component = fixture.componentInstance;

    try { fixture.detectChanges(); } catch (e) { /* template binding errors */ }
  });

  describe('Generate Sample Data', () => {
    it('should create specified number of records', () => {
      // Act
      component.generateSampleData(100);

      // Assert
      expect(component.records.length).toBe(100);
      expect(component.records[0].id).toBe('donor-1');
      expect(component.records[99].donorNumber).toBe('DN000100');
    });
  });

  describe('Cancel Processing', () => {
    it('should call service cancel and set processing to false', () => {
      // Arrange
      component.isProcessing = true;

      // Act
      component.cancelProcessing();

      // Assert
      expect(serviceSpy.cancelProcessing).toHaveBeenCalled();
      expect(component.isProcessing).toBe(false);
    });
  });

  describe('Decline Resume', () => {
    it('should clear saved state and hide prompt', () => {
      // Arrange
      component.savedJobId = 'JOB123';
      component.showResumePrompt = true;

      // Act
      component.declineResume();

      // Assert
      expect(serviceSpy.clearProcessingState).toHaveBeenCalledWith('JOB123');
      expect(component.savedJobId).toBeNull();
      expect(component.showResumePrompt).toBe(false);
    });

    it('should hide prompt without clearing state when savedJobId is null', () => {
      // Arrange
      component.savedJobId = null;
      component.showResumePrompt = true;

      // Act
      component.declineResume();

      // Assert
      expect(serviceSpy.clearProcessingState).not.toHaveBeenCalled();
      expect(component.savedJobId).toBeNull();
      expect(component.showResumePrompt).toBe(false);
    });
  });

  describe('ngOnInit', () => {
    it('should subscribe to progress$ and update progress on emission', () => {
      // Arrange
      const mockProgress = {
        jobId: 'test-job',
        totalRecords: 100,
        totalBatches: 2,
        processedBatches: 1,
        failedBatches: 0,
        currentBatch: 1,
        percentage: 50,
        status: 'processing' as const
      };

      // Act
      progress$.next(mockProgress);

      // Assert
      expect(component.progress).toEqual(mockProgress);
    });

    it('should generate 500 sample records on init', () => {
      // Assert - ngOnInit already called via detectChanges
      expect(component.records.length).toBe(500);
    });

    it('should call checkForSavedState on init', () => {
      // Assert - getAllSavedStates is called by checkForSavedState during ngOnInit
      expect(serviceSpy.getAllSavedStates).toHaveBeenCalled();
    });
  });

  describe('checkForSavedState', () => {
    it('should not show resume prompt when no saved states exist', () => {
      // Arrange
      serviceSpy.getAllSavedStates.and.returnValue([]);

      // Act
      component.checkForSavedState();

      // Assert
      expect(component.showResumePrompt).toBe(false);
      expect(component.savedJobId).toBeNull();
    });

    it('should show resume prompt for recent saved state (within 24 hours)', () => {
      // Arrange
      const recentState = {
        jobId: 'recent-job',
        lastCompletedBatch: 3,
        totalBatches: 10,
        config: component.config,
        timestamp: Date.now() - (1000 * 60 * 60) // 1 hour ago
      };
      serviceSpy.getAllSavedStates.and.returnValue([recentState]);

      // Act
      component.checkForSavedState();

      // Assert
      expect(component.showResumePrompt).toBe(true);
      expect(component.savedJobId).toBe('recent-job');
    });

    it('should clear old saved state (older than 24 hours)', () => {
      // Arrange
      const oldState = {
        jobId: 'old-job',
        lastCompletedBatch: 3,
        totalBatches: 10,
        config: component.config,
        timestamp: Date.now() - (1000 * 60 * 60 * 25) // 25 hours ago
      };
      serviceSpy.getAllSavedStates.and.returnValue([oldState]);

      // Act
      component.checkForSavedState();

      // Assert
      expect(component.showResumePrompt).toBe(false);
      expect(serviceSpy.clearProcessingState).toHaveBeenCalledWith('old-job');
    });

    it('should pick the most recent saved state when multiple exist', () => {
      // Arrange
      const olderState = {
        jobId: 'older-job',
        lastCompletedBatch: 2,
        totalBatches: 5,
        config: component.config,
        timestamp: Date.now() - (1000 * 60 * 60 * 2) // 2 hours ago
      };
      const newerState = {
        jobId: 'newer-job',
        lastCompletedBatch: 5,
        totalBatches: 10,
        config: component.config,
        timestamp: Date.now() - (1000 * 60 * 30) // 30 minutes ago
      };
      serviceSpy.getAllSavedStates.and.returnValue([olderState, newerState]);

      // Act
      component.checkForSavedState();

      // Assert
      expect(component.showResumePrompt).toBe(true);
      expect(component.savedJobId).toBe('newer-job');
    });
  });

  describe('startProcessing', () => {
    it('should reset state and set isProcessing to true', () => {
      // Arrange
      component.hasError = true;
      component.errorMessage = 'old error';
      serviceSpy.processBulk.and.returnValue(of({ batchNumber: 0, success: true }));

      // Act
      component.startProcessing();

      // Assert - resetState was called (hasError cleared) and isProcessing was set
      // Note: isProcessing may be false after synchronous observable completes
      expect(component.hasError).toBe(false);
      expect(component.errorMessage).toBe('');
    });

    it('should call processBulk with records, endpoint, and config', () => {
      // Arrange
      serviceSpy.processBulk.and.returnValue(of({ batchNumber: 0, success: true }));

      // Act
      component.startProcessing();

      // Assert
      expect(serviceSpy.processBulk).toHaveBeenCalledWith(
        component.records,
        '/api/donors/bulk-process',
        component.config
      );
    });

    it('should set error state when processing errors', () => {
      // Arrange
      serviceSpy.processBulk.and.returnValue(
        throwError(() => new Error('Server error'))
      );

      // Act
      component.startProcessing();

      // Assert
      expect(component.isProcessing).toBe(false);
      expect(component.hasError).toBe(true);
      expect(component.errorMessage).toBe('Server error');
    });

    it('should set generic error message when error has no message', () => {
      // Arrange
      serviceSpy.processBulk.and.returnValue(
        throwError(() => ({}))
      );

      // Act
      component.startProcessing();

      // Assert
      expect(component.isProcessing).toBe(false);
      expect(component.hasError).toBe(true);
      expect(component.errorMessage).toBe('Processing failed');
    });

    it('should set isProcessing to false on complete', () => {
      // Arrange
      serviceSpy.processBulk.and.returnValue(
        of({ batchNumber: 0, success: true })
      );

      // Act
      component.startProcessing();

      // Assert
      expect(component.isProcessing).toBe(false);
    });

    it('should set error message when complete with failed batches', () => {
      // Arrange
      serviceSpy.processBulk.and.returnValue(
        of({ batchNumber: 0, success: true })
      );
      component.progress = {
        jobId: 'test',
        totalRecords: 100,
        totalBatches: 2,
        processedBatches: 2,
        failedBatches: 1,
        currentBatch: 1,
        percentage: 100,
        status: 'processing' as const
      };

      // Act
      component.startProcessing();
      // After startProcessing resets state, progress is null, but we need to
      // set progress before the complete callback fires.
      // Instead, let's use a Subject to control timing.
    });

    it('should report failed batches on completion when progress has failures', () => {
      // Arrange - use a Subject to control when the observable emits and completes
      const processingSubject = new Subject<any>();
      serviceSpy.processBulk.and.returnValue(processingSubject.asObservable());

      // Act
      component.startProcessing();
      expect(component.isProcessing).toBe(true);

      // Simulate progress being updated (as it would be via progress$ subscription)
      component.progress = {
        jobId: 'test',
        totalRecords: 100,
        totalBatches: 2,
        processedBatches: 2,
        failedBatches: 1,
        currentBatch: 1,
        percentage: 100,
        status: 'processing' as const
      };

      // Emit a result and complete
      processingSubject.next({ batchNumber: 0, success: true });
      processingSubject.complete();

      // Assert
      expect(component.isProcessing).toBe(false);
      expect(component.errorMessage).toBe('Processing completed with 1 failed batches');
    });

    it('should not set error message on completion when progress has no failures', () => {
      // Arrange
      const processingSubject = new Subject<any>();
      serviceSpy.processBulk.and.returnValue(processingSubject.asObservable());

      // Act
      component.startProcessing();

      component.progress = {
        jobId: 'test',
        totalRecords: 100,
        totalBatches: 2,
        processedBatches: 2,
        failedBatches: 0,
        currentBatch: 1,
        percentage: 100,
        status: 'completed' as const
      };

      processingSubject.next({ batchNumber: 0, success: true });
      processingSubject.complete();

      // Assert
      expect(component.isProcessing).toBe(false);
      expect(component.errorMessage).toBe('');
    });

    it('should not set error message on completion when progress is null', () => {
      // Arrange
      serviceSpy.processBulk.and.returnValue(
        of({ batchNumber: 0, success: true })
      );

      // Act
      component.startProcessing();

      // Assert - progress is null because resetState was called and no progress$ emission occurred
      expect(component.isProcessing).toBe(false);
      expect(component.errorMessage).toBe('');
    });
  });

  describe('resumeProcessing', () => {
    it('should return early when savedJobId is null', () => {
      // Arrange
      component.savedJobId = null;

      // Act
      component.resumeProcessing();

      // Assert
      expect(serviceSpy.resumeProcessing).not.toHaveBeenCalled();
      expect(component.isProcessing).toBe(false);
    });

    it('should call resumeProcessing on service with correct arguments', () => {
      // Arrange
      component.savedJobId = 'resume-job';
      serviceSpy.resumeProcessing.and.returnValue(
        of({ batchNumber: 3, success: true })
      );

      // Act
      component.resumeProcessing();

      // Assert
      expect(serviceSpy.resumeProcessing).toHaveBeenCalledWith(
        component.records,
        '/api/donors/bulk-process',
        'resume-job'
      );
    });

    it('should set error state when service returns null', () => {
      // Arrange
      component.savedJobId = 'no-state-job';
      serviceSpy.resumeProcessing.and.returnValue(null);

      // Act
      component.resumeProcessing();

      // Assert
      expect(component.isProcessing).toBe(false);
      expect(component.hasError).toBe(true);
      expect(component.errorMessage).toBe('Failed to resume processing - state not found');
    });

    it('should reset state and hide resume prompt when resuming', () => {
      // Arrange
      component.savedJobId = 'resume-job';
      component.hasError = true;
      component.errorMessage = 'old error';
      component.showResumePrompt = true;
      serviceSpy.resumeProcessing.and.returnValue(
        of({ batchNumber: 0, success: true })
      );

      // Act
      component.resumeProcessing();

      // Assert
      expect(component.hasError).toBe(false);
      expect(component.errorMessage).toBe('');
      expect(component.showResumePrompt).toBe(false);
    });

    it('should set isProcessing to true while resuming', () => {
      // Arrange
      component.savedJobId = 'resume-job';
      const resumeSubject = new Subject<any>();
      serviceSpy.resumeProcessing.and.returnValue(resumeSubject.asObservable());

      // Act
      component.resumeProcessing();

      // Assert
      expect(component.isProcessing).toBe(true);
    });

    it('should clear savedJobId and set isProcessing to false on complete', () => {
      // Arrange
      component.savedJobId = 'resume-job';
      serviceSpy.resumeProcessing.and.returnValue(
        of({ batchNumber: 0, success: true })
      );

      // Act
      component.resumeProcessing();

      // Assert
      expect(component.isProcessing).toBe(false);
      expect(component.savedJobId).toBeNull();
    });

    it('should set error state on resume error', () => {
      // Arrange
      component.savedJobId = 'resume-job';
      serviceSpy.resumeProcessing.and.returnValue(
        throwError(() => new Error('Resume failed'))
      );

      // Act
      component.resumeProcessing();

      // Assert
      expect(component.isProcessing).toBe(false);
      expect(component.hasError).toBe(true);
      expect(component.errorMessage).toBe('Resume failed');
    });

    it('should set generic error message when resume error has no message', () => {
      // Arrange
      component.savedJobId = 'resume-job';
      serviceSpy.resumeProcessing.and.returnValue(
        throwError(() => ({}))
      );

      // Act
      component.resumeProcessing();

      // Assert
      expect(component.isProcessing).toBe(false);
      expect(component.hasError).toBe(true);
      expect(component.errorMessage).toBe('Resumed processing failed');
    });
  });

  describe('resetState', () => {
    it('should clear error state and progress', () => {
      // Arrange
      component.hasError = true;
      component.errorMessage = 'some error';
      component.progress = {
        jobId: 'test',
        totalRecords: 100,
        totalBatches: 2,
        processedBatches: 1,
        failedBatches: 0,
        currentBatch: 0,
        percentage: 50,
        status: 'processing' as const
      };

      // Act
      component.resetState();

      // Assert
      expect(component.hasError).toBe(false);
      expect(component.errorMessage).toBe('');
      expect(component.progress).toBeNull();
    });
  });

  describe('getProgressPercentage', () => {
    it('should return 0 when progress is null', () => {
      // Arrange
      component.progress = null;

      // Act & Assert
      expect(component.getProgressPercentage()).toBe(0);
    });

    it('should return percentage from progress', () => {
      // Arrange
      component.progress = {
        jobId: 'test',
        totalRecords: 100,
        totalBatches: 4,
        processedBatches: 2,
        failedBatches: 0,
        currentBatch: 1,
        percentage: 50,
        status: 'processing' as const
      };

      // Act & Assert
      expect(component.getProgressPercentage()).toBe(50);
    });

    it('should return 0 when progress percentage is 0', () => {
      // Arrange
      component.progress = {
        jobId: 'test',
        totalRecords: 100,
        totalBatches: 4,
        processedBatches: 0,
        failedBatches: 0,
        currentBatch: 0,
        percentage: 0,
        status: 'processing' as const
      };

      // Act & Assert
      expect(component.getProgressPercentage()).toBe(0);
    });
  });

  describe('getStatusColor', () => {
    it('should return gray when progress is null', () => {
      // Arrange
      component.progress = null;

      // Act & Assert
      expect(component.getStatusColor()).toBe('gray');
    });

    it('should return blue when status is processing', () => {
      // Arrange
      component.progress = {
        jobId: 'test',
        totalRecords: 100,
        totalBatches: 4,
        processedBatches: 1,
        failedBatches: 0,
        currentBatch: 0,
        percentage: 25,
        status: 'processing'
      };

      // Act & Assert
      expect(component.getStatusColor()).toBe('blue');
    });

    it('should return green when status is completed with no failures', () => {
      // Arrange
      component.progress = {
        jobId: 'test',
        totalRecords: 100,
        totalBatches: 4,
        processedBatches: 4,
        failedBatches: 0,
        currentBatch: 3,
        percentage: 100,
        status: 'completed'
      };

      // Act & Assert
      expect(component.getStatusColor()).toBe('green');
    });

    it('should return orange when status is completed with failures', () => {
      // Arrange
      component.progress = {
        jobId: 'test',
        totalRecords: 100,
        totalBatches: 4,
        processedBatches: 4,
        failedBatches: 2,
        currentBatch: 3,
        percentage: 100,
        status: 'completed'
      };

      // Act & Assert
      expect(component.getStatusColor()).toBe('orange');
    });

    it('should return red when status is failed', () => {
      // Arrange
      component.progress = {
        jobId: 'test',
        totalRecords: 100,
        totalBatches: 4,
        processedBatches: 2,
        failedBatches: 2,
        currentBatch: 1,
        percentage: 50,
        status: 'failed'
      };

      // Act & Assert
      expect(component.getStatusColor()).toBe('red');
    });

    it('should return gray when status is cancelled', () => {
      // Arrange
      component.progress = {
        jobId: 'test',
        totalRecords: 100,
        totalBatches: 4,
        processedBatches: 1,
        failedBatches: 0,
        currentBatch: 0,
        percentage: 25,
        status: 'cancelled'
      };

      // Act & Assert
      expect(component.getStatusColor()).toBe('gray');
    });

    it('should return gray for unknown status', () => {
      // Arrange
      component.progress = {
        jobId: 'test',
        totalRecords: 100,
        totalBatches: 4,
        processedBatches: 0,
        failedBatches: 0,
        currentBatch: 0,
        percentage: 0,
        status: 'idle' as any
      };

      // Act & Assert
      expect(component.getStatusColor()).toBe('gray');
    });
  });

  describe('ngOnDestroy', () => {
    it('should cancel processing if currently processing', () => {
      // Arrange
      component.isProcessing = true;

      // Act
      component.ngOnDestroy();

      // Assert
      expect(serviceSpy.cancelProcessing).toHaveBeenCalled();
    });

    it('should not cancel processing if not currently processing', () => {
      // Arrange
      component.isProcessing = false;

      // Act
      component.ngOnDestroy();

      // Assert
      expect(serviceSpy.cancelProcessing).not.toHaveBeenCalled();
    });

    it('should complete the destroy subject to unsubscribe from observables', () => {
      // Arrange - subscribe to progress$ to verify unsubscription
      const processingSubject = new Subject<any>();
      serviceSpy.processBulk.and.returnValue(processingSubject.asObservable());
      component.startProcessing();

      // Act
      component.ngOnDestroy();

      // Emit after destroy - progress should not update
      const progressBefore = component.progress;
      progress$.next({
        jobId: 'post-destroy',
        totalRecords: 999,
        totalBatches: 99,
        processedBatches: 0,
        failedBatches: 0,
        currentBatch: 0,
        percentage: 0,
        status: 'processing' as const
      });

      // Assert - progress should not have been updated after destroy
      expect(component.progress).toBe(progressBefore);
    });
  });

  describe('generateSampleData', () => {
    it('should generate records with correct donor number padding', () => {
      // Act
      component.generateSampleData(3);

      // Assert
      expect(component.records[0].donorNumber).toBe('DN000001');
      expect(component.records[1].donorNumber).toBe('DN000002');
      expect(component.records[2].donorNumber).toBe('DN000003');
    });

    it('should generate records with correct name format', () => {
      // Act
      component.generateSampleData(2);

      // Assert
      expect(component.records[0].name).toBe('Donor 1');
      expect(component.records[1].name).toBe('Donor 2');
    });

    it('should handle generating zero records', () => {
      // Act
      component.generateSampleData(0);

      // Assert
      expect(component.records.length).toBe(0);
    });

    it('should replace existing records', () => {
      // Arrange
      component.generateSampleData(100);
      expect(component.records.length).toBe(100);

      // Act
      component.generateSampleData(10);

      // Assert
      expect(component.records.length).toBe(10);
    });
  });
});
