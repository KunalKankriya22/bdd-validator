import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  BulkProcessorService,
  ProcessingProgress,
  BatchResult,
  BulkProcessingConfig,
} from '../../services/bulk-processor.service';

/**
 * Example record interface - replace with your actual data model
 */
interface DonorRecord {
  id: string;
  name: string;
  donorNumber: string;
  // ... other fields
}

/**
 * Demo component showing how to use BulkProcessorService
 *
 * KEY PATTERNS DEMONSTRATED:
 *
 * 1. LIFECYCLE MANAGEMENT:
 *    - Uses takeUntil with destroySubject$ for clean unsubscription
 *    - Cancels processing on component destroy
 *    - Prevents memory leaks
 *
 * 2. PROGRESS TRACKING:
 *    - Subscribes to progress$ observable
 *    - Updates UI with real-time progress
 *    - Shows percentage, batch counts, status
 *
 * 3. ERROR HANDLING:
 *    - Handles errors from processing observable
 *    - Shows user-friendly error messages
 *    - Allows retry on failure
 *
 * 4. RESUME CAPABILITY:
 *    - Checks for saved state on init
 *    - Offers to resume incomplete operations
 *    - Clears state on completion
 */
@Component({
  selector: 'app-bulk-processor-demo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bulk-processor-demo.component.html',
  styleUrls: ['./bulk-processor-demo.component.scss'],
})
export class BulkProcessorDemoComponent implements OnInit, OnDestroy {
  // Subject for managing subscriptions - CRITICAL for preventing memory leaks
  private destroySubject$ = new Subject<void>();

  // Expose Math for template use
  Math = Math;

  // Current processing progress
  progress: ProcessingProgress | null = null;

  // Processing state flags
  isProcessing = false;
  hasError = false;
  errorMessage = '';
  showResumePrompt = false;
  savedJobId: string | null = null;

  // Configuration
  config: BulkProcessingConfig = {
    batchSize: 50,
    maxRetries: 3,
    retryDelayMs: 1000,
    stopOnFailure: false, // Continue processing even if some batches fail
    enableResume: true,
    yieldBetweenBatches: true,
    yieldDelayMs: 0, // Use asyncScheduler
    concurrency: 1, // Serial processing
  };

  // Sample data - in real app, this would come from API or user input
  records: DonorRecord[] = [];

  constructor(private bulkProcessorService: BulkProcessorService) {}

  ngOnInit(): void {
    // Subscribe to progress updates
    this.bulkProcessorService.progress$
      .pipe(takeUntil(this.destroySubject$))
      .subscribe((progress) => {
        this.progress = progress;
      });

    // Check for saved state (for resume functionality)
    this.checkForSavedState();

    // Generate sample data for demo
    this.generateSampleData(500);
  }

  /**
   * Check if there's a saved processing state that can be resumed
   */
  checkForSavedState(): void {
    const savedStates = this.bulkProcessorService.getAllSavedStates();

    if (savedStates.length > 0) {
      // For demo, take the most recent one
      const mostRecent = savedStates.sort((a, b) => b.timestamp - a.timestamp)[0];

      // Check if it's not too old (e.g., within last 24 hours)
      const ageInHours = (Date.now() - mostRecent.timestamp) / (1000 * 60 * 60);

      if (ageInHours < 24) {
        this.showResumePrompt = true;
        this.savedJobId = mostRecent.jobId;
      } else {
        // Clear old state
        this.bulkProcessorService.clearProcessingState(mostRecent.jobId);
      }
    }
  }

  /**
   * Generate sample data for demo purposes
   */
  generateSampleData(count: number): void {
    this.records = Array.from({ length: count }, (_, i) => ({
      id: `donor-${i + 1}`,
      name: `Donor ${i + 1}`,
      donorNumber: `DN${String(i + 1).padStart(6, '0')}`,
    }));
  }

  /**
   * Start bulk processing
   *
   * EXECUTION FLOW:
   * 1. Calls bulkProcessorService.processBulk()
   * 2. Subscribes to the returned observable
   * 3. Each emission represents a completed batch
   * 4. Progress is tracked via progress$ observable
   * 5. On complete, all batches are processed
   * 6. On error, processing stops (if stopOnFailure is true)
   * 7. takeUntil ensures cleanup on component destroy
   */
  startProcessing(): void {
    this.resetState();
    this.isProcessing = true;

    const apiEndpoint = '/api/donors/bulk-process'; // Replace with actual endpoint

    this.bulkProcessorService
      .processBulk<DonorRecord, any>(this.records, apiEndpoint, this.config)
      .pipe(
        // CRITICAL: takeUntil ensures all subscriptions are cleaned up
        // when component is destroyed, preventing memory leaks and
        // unwanted background processing
        takeUntil(this.destroySubject$)
      )
      .subscribe({
        next: (result: BatchResult) => {
          // Each batch completion
        },
        error: (error) => {
          // Processing stopped due to error
          this.isProcessing = false;
          this.hasError = true;
          this.errorMessage = error.message || 'Processing failed';
        },
        complete: () => {
          // All batches processed
          this.isProcessing = false;

          if (this.progress) {
            if (this.progress.failedBatches > 0) {
              this.errorMessage = `Processing completed with ${this.progress.failedBatches} failed batches`;
            }
          }
        },
      });
  }

  /**
   * Resume processing from saved state
   */
  resumeProcessing(): void {
    if (!this.savedJobId) {
      return;
    }

    this.resetState();
    this.isProcessing = true;
    this.showResumePrompt = false;

    const apiEndpoint = '/api/donors/bulk-process'; // Replace with actual endpoint

    const resume$ = this.bulkProcessorService.resumeProcessing<DonorRecord, any>(
      this.records,
      apiEndpoint,
      this.savedJobId
    );

    if (!resume$) {
      this.isProcessing = false;
      this.hasError = true;
      this.errorMessage = 'Failed to resume processing - state not found';
      return;
    }

    resume$.pipe(takeUntil(this.destroySubject$)).subscribe({
      next: (result: BatchResult) => {
        // Batch completed (resumed)
      },
      error: (error) => {
        this.isProcessing = false;
        this.hasError = true;
        this.errorMessage = error.message || 'Resumed processing failed';
      },
      complete: () => {
        this.isProcessing = false;
        this.savedJobId = null;
      },
    });
  }

  /**
   * Decline resuming and start fresh
   */
  declineResume(): void {
    if (this.savedJobId) {
      this.bulkProcessorService.clearProcessingState(this.savedJobId);
      this.savedJobId = null;
    }
    this.showResumePrompt = false;
  }

  /**
   * Cancel ongoing processing
   *
   * CANCELLATION FLOW:
   * 1. Calls bulkProcessorService.cancelProcessing()
   * 2. Service emits on cancelSubject$
   * 3. takeUntil operator in processing pipeline unsubscribes
   * 4. All pending batches are cancelled
   * 5. In-flight HTTP requests may complete but are ignored
   *
   * NOTE: For immediate HTTP cancellation, backend can implement
   * AbortController or timeout mechanisms
   */
  cancelProcessing(): void {
    this.bulkProcessorService.cancelProcessing();
    this.isProcessing = false;
  }

  /**
   * Reset component state
   */
  resetState(): void {
    this.hasError = false;
    this.errorMessage = '';
    this.progress = null;
  }

  /**
   * Get progress percentage for display
   */
  getProgressPercentage(): number {
    return this.progress?.percentage || 0;
  }

  /**
   * Get status color for UI
   */
  getStatusColor(): string {
    if (!this.progress) return 'gray';

    switch (this.progress.status) {
      case 'processing':
        return 'blue';
      case 'completed':
        return this.progress.failedBatches > 0 ? 'orange' : 'green';
      case 'failed':
        return 'red';
      case 'cancelled':
        return 'gray';
      default:
        return 'gray';
    }
  }

  /**
   * CRITICAL: Component cleanup
   *
   * This is where we prevent memory leaks and cancel ongoing operations:
   *
   * 1. Cancel any in-progress bulk processing
   *    - Prevents background processing after navigation
   *    - Stops unnecessary API calls
   *
   * 2. Emit on destroySubject$ to trigger all takeUntil operators
   *    - Unsubscribes from progress$ observable
   *    - Unsubscribes from processing observable
   *    - Clean and automatic - no manual subscription tracking needed
   *
   * 3. Complete the destroy subject
   *    - Frees up resources
   *    - Best practice for Subject cleanup
   *
   * WHY THIS MATTERS:
   * - Without this, processing would continue after user navigates away
   * - Subscriptions would leak memory
   * - Background API calls would waste resources
   * - User might see unexpected behavior on navigation back
   */
  ngOnDestroy(): void {
    // Cancel any ongoing processing
    if (this.isProcessing) {
      this.bulkProcessorService.cancelProcessing();
    }

    // Trigger all takeUntil operators to unsubscribe
    this.destroySubject$.next();
    this.destroySubject$.complete();
  }
}
