import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  Observable,
  Subject,
  from,
  of,
  throwError,
  asyncScheduler,
  timer,
} from 'rxjs';
import {
  concatMap,
  takeUntil,
  catchError,
  tap,
  finalize,
  observeOn,
  mergeMap,
  take,
  retry,
} from 'rxjs/operators';
/**
 * Generate a UUID v4
 * Native implementation - no external dependencies needed
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Represents a single batch to be processed
 */
export interface ProcessingBatch<T> {
  batchNumber: number;
  records: T[];
  totalBatches: number;
}

/**
 * Configuration for bulk processing
 */
export interface BulkProcessingConfig {
  batchSize: number; // Number of records per batch
  maxRetries: number; // Number of retries per batch (default: 3)
  retryDelayMs: number; // Delay between retries in milliseconds (default: 1000)
  stopOnFailure: boolean; // Stop processing if a batch fails (default: true)
  enableResume: boolean; // Enable resume from localStorage (default: true)
  yieldBetweenBatches: boolean; // Introduce macrotask yielding (default: true)
  yieldDelayMs: number; // Delay for yielding (default: 0, use asyncScheduler)
  concurrency: number; // Number of concurrent batches (default: 1 for serial)
}

/**
 * Progress information for the current bulk processing operation
 */
export interface ProcessingProgress {
  jobId: string;
  totalRecords: number;
  totalBatches: number;
  processedBatches: number;
  failedBatches: number;
  currentBatch: number;
  percentage: number;
  status: 'idle' | 'processing' | 'paused' | 'completed' | 'failed' | 'cancelled';
}

/**
 * Result of a batch processing operation
 */
export interface BatchResult {
  batchNumber: number;
  success: boolean;
  error?: any;
  response?: any;
}

/**
 * Stored state for resumable processing
 */
interface ProcessingState {
  jobId: string;
  lastCompletedBatch: number;
  totalBatches: number;
  config: BulkProcessingConfig;
  timestamp: number;
}

/**
 * Production-grade bulk processing service with the following features:
 * - Configurable batch processing with serial or concurrent execution
 * - UI-responsive processing using macrotask queue yielding
 * - Cancellation support with proper cleanup
 * - Resume capability using localStorage
 * - Retry logic with exponential backoff
 * - Progress tracking and reporting
 *
 * KEY DESIGN DECISIONS:
 *
 * 1. MICROTASK vs MACROTASK:
 *    - Promises (RxJS operators) execute in the MICROTASK queue
 *    - Microtasks run BEFORE the browser can render
 *    - Processing many batches with only Promises can freeze the UI
 *    - Solution: Introduce MACROTASK yielding (setTimeout, asyncScheduler)
 *    - Macrotasks allow the browser to render between batches
 *
 * 2. SERIAL EXECUTION (concatMap):
 *    - Ensures batches are processed in order
 *    - Prevents overwhelming the backend
 *    - Easier to track progress and resume
 *
 * 3. CANCELLATION:
 *    - Uses takeUntil with a Subject for clean unsubscription
 *    - Cancels all in-flight and pending operations
 *    - Proper cleanup prevents memory leaks
 *
 * 4. RESUME:
 *    - Stores progress in localStorage
 *    - Can resume from last successful batch
 *    - Prevents data reprocessing on failures
 */
@Injectable({
  providedIn: 'root',
})
export class BulkProcessorService implements OnDestroy {
  private readonly STORAGE_KEY_PREFIX = 'bulk_processing_';

  // Subject to trigger cancellation of ongoing processing
  private cancelSubject$ = new Subject<void>();

  // Subject to emit progress updates
  private progressSubject$ = new Subject<ProcessingProgress>();

  // Current processing state
  private currentProgress: ProcessingProgress | null = null;

  // Default configuration
  private readonly defaultConfig: BulkProcessingConfig = {
    batchSize: 50,
    maxRetries: 3,
    retryDelayMs: 1000,
    stopOnFailure: true,
    enableResume: true,
    yieldBetweenBatches: true,
    yieldDelayMs: 0, // 0 = use asyncScheduler, >0 = use setTimeout with delay
    concurrency: 1, // Serial by default
  };

  constructor(private http: HttpClient) {}

  /**
   * Get observable for progress updates
   */
  get progress$(): Observable<ProcessingProgress> {
    return this.progressSubject$.asObservable();
  }

  /**
   * Get current progress snapshot
   */
  get currentProcessingProgress(): ProcessingProgress | null {
    return this.currentProgress;
  }

  /**
   * Start bulk processing operation
   *
   * @param records - Array of records to process
   * @param apiEndpoint - API endpoint for batch processing
   * @param config - Processing configuration
   * @param jobId - Optional job ID (generated if not provided)
   * @param resumeFromBatch - Optional batch number to resume from
   * @returns Observable that completes when all batches are processed
   */
  processBulk<T, R>(
    records: T[],
    apiEndpoint: string,
    config: Partial<BulkProcessingConfig> = {},
    jobId?: string,
    resumeFromBatch?: number
  ): Observable<BatchResult> {
    // Merge with default config
    const finalConfig: BulkProcessingConfig = { ...this.defaultConfig, ...config };

    // Generate or use provided jobId
    const processJobId = jobId || generateUUID();

    // Calculate batches
    const batches = this.createBatches(records, finalConfig.batchSize);
    const totalBatches = batches.length;

    // Determine starting batch (for resume)
    const startBatch = resumeFromBatch !== undefined ? resumeFromBatch : 0;
    const batchesToProcess = batches.slice(startBatch);

    // Initialize progress
    this.initializeProgress(processJobId, records.length, totalBatches, startBatch);

    // Save state if resume is enabled
    if (finalConfig.enableResume) {
      this.saveProcessingState(processJobId, startBatch - 1, totalBatches, finalConfig);
    }

    /**
     * CORE PROCESSING LOGIC:
     *
     * 1. from(batchesToProcess) - Creates an observable from the array of batches
     * 2. observeOn(asyncScheduler) - CRITICAL for UI responsiveness
     *    - Moves batch emissions to the MACROTASK queue
     *    - Allows browser to render between batch emissions
     *    - Prevents UI freezing even with hundreds of batches
     *
     * 3. concatMap vs mergeMap:
     *    - concurrency === 1: Use concatMap for strict serial execution
     *    - concurrency > 1: Use mergeMap for controlled parallelism
     *
     * 4. Yielding strategy:
     *    - If yieldBetweenBatches is true, introduce additional yielding
     *    - Uses setTimeout (macrotask) to ensure browser can paint
     *    - This is the KEY to preventing UI blocking
     *
     * 5. takeUntil(cancelSubject$) - Handles cancellation
     *    - Unsubscribes from all pending and in-flight operations
     *    - Clean and memory-leak-free cancellation
     */

    const processingOperator = finalConfig.concurrency === 1 ? concatMap : mergeMap;
    const concurrency = finalConfig.concurrency === 1 ? undefined : finalConfig.concurrency;

    return from(batchesToProcess).pipe(
      // MACROTASK YIELDING: Move to macrotask queue to allow rendering
      observeOn(asyncScheduler),

      // Process each batch (serial or parallel based on config)
      processingOperator(
        (batch) => this.processSingleBatch(batch, processJobId, apiEndpoint, finalConfig),
        concurrency
      ),

      // Additional yielding between batches if configured
      concatMap((result) => {
        if (finalConfig.yieldBetweenBatches && finalConfig.yieldDelayMs > 0) {
          // Use timer to introduce macrotask delay
          return timer(finalConfig.yieldDelayMs).pipe(
            take(1),
            concatMap(() => of(result))
          );
        }
        return of(result);
      }),

      // Update progress after each batch
      tap((result) => this.updateProgress(result)),

      // Handle cancellation
      takeUntil(this.cancelSubject$),

      // Cleanup on completion or error
      finalize(() => this.handleCompletion(processJobId, finalConfig))
    );
  }

  /**
   * Process a single batch with retry logic
   *
   * RETRY STRATEGY:
   * - Uses retryWhen for custom retry logic
   * - Implements exponential backoff
   * - Limits retry attempts
   * - Handles errors gracefully based on config
   */
  private processSingleBatch<T, R>(
    batch: ProcessingBatch<T>,
    jobId: string,
    apiEndpoint: string,
    config: BulkProcessingConfig
  ): Observable<BatchResult> {
    const payload = {
      jobId,
      batchNumber: batch.batchNumber,
      totalBatches: batch.totalBatches,
      records: batch.records,
    };

    return this.http.post<R>(apiEndpoint, payload).pipe(
      // Retry logic with exponential backoff
      retry({
        count: config.maxRetries,
        delay: (error, retryCount) => {
          // Exponential backoff: delay increases with each retry
          const delayTime = config.retryDelayMs * Math.pow(2, retryCount - 1);

          return timer(delayTime);
        }
      }),

      // Map successful response to BatchResult
      concatMap((response) =>
        of({
          batchNumber: batch.batchNumber,
          success: true,
          response,
        })
      ),

      // Handle errors after all retries exhausted
      catchError((error) => {
        const failureResult: BatchResult = {
          batchNumber: batch.batchNumber,
          success: false,
          error,
        };

        // If stopOnFailure is true, propagate the error
        if (config.stopOnFailure) {
          return throwError(() => error);
        }

        // Otherwise, return the failure result and continue
        return of(failureResult);
      })
    );
  }

  /**
   * Create batches from records array
   */
  private createBatches<T>(records: T[], batchSize: number): ProcessingBatch<T>[] {
    const batches: ProcessingBatch<T>[] = [];
    const totalBatches = Math.ceil(records.length / batchSize);

    for (let i = 0; i < records.length; i += batchSize) {
      const batchRecords = records.slice(i, i + batchSize);
      batches.push({
        batchNumber: Math.floor(i / batchSize),
        records: batchRecords,
        totalBatches,
      });
    }

    return batches;
  }

  /**
   * Initialize progress tracking
   */
  private initializeProgress(
    jobId: string,
    totalRecords: number,
    totalBatches: number,
    startBatch: number
  ): void {
    this.currentProgress = {
      jobId,
      totalRecords,
      totalBatches,
      processedBatches: startBatch,
      failedBatches: 0,
      currentBatch: startBatch,
      percentage: startBatch > 0 ? (startBatch / totalBatches) * 100 : 0,
      status: 'processing',
    };

    this.progressSubject$.next(this.currentProgress);
  }

  /**
   * Update progress after each batch
   */
  private updateProgress(result: BatchResult): void {
    if (!this.currentProgress) return;

    this.currentProgress.currentBatch = result.batchNumber;
    this.currentProgress.processedBatches++;

    if (!result.success) {
      this.currentProgress.failedBatches++;
    }

    this.currentProgress.percentage =
      (this.currentProgress.processedBatches / this.currentProgress.totalBatches) * 100;

    this.progressSubject$.next(this.currentProgress);

    // Update stored state
    if (result.success) {
      this.updateStoredBatchProgress(this.currentProgress.jobId, result.batchNumber);
    }
  }

  /**
   * Handle completion of processing
   */
  private handleCompletion(jobId: string, config: BulkProcessingConfig): void {
    if (!this.currentProgress) return;

    // Determine final status
    if (this.currentProgress.processedBatches === this.currentProgress.totalBatches) {
      this.currentProgress.status = this.currentProgress.failedBatches > 0 ? 'failed' : 'completed';
    } else {
      this.currentProgress.status = 'cancelled';
    }

    this.progressSubject$.next(this.currentProgress);

    // Clear stored state if completed successfully
    if (this.currentProgress.status === 'completed' && config.enableResume) {
      this.clearProcessingState(jobId);
    }
  }

  /**
   * Cancel ongoing processing
   *
   * CANCELLATION MECHANISM:
   * - Emits on cancelSubject$
   * - takeUntil operator unsubscribes from all pending operations
   * - In-flight HTTP requests may complete but results are ignored
   * - For immediate cancellation of HTTP, use AbortController (optional enhancement)
   */
  cancelProcessing(): void {
    this.cancelSubject$.next();

    if (this.currentProgress) {
      this.currentProgress.status = 'cancelled';
      this.progressSubject$.next(this.currentProgress);
    }
  }

  /**
   * Resume processing from saved state
   *
   * RESUME MECHANISM:
   * - Retrieves last completed batch from localStorage
   * - Restarts processing from next batch
   * - Prevents reprocessing of successful batches
   * - Requires backend idempotency for safety
   */
  resumeProcessing<T, R>(
    records: T[],
    apiEndpoint: string,
    jobId: string
  ): Observable<BatchResult> | null {
    const state = this.getProcessingState(jobId);

    if (!state) {
      return null;
    }

    // Reset cancel subject for new processing run
    this.cancelSubject$ = new Subject<void>();

    return this.processBulk(
      records,
      apiEndpoint,
      state.config,
      jobId,
      state.lastCompletedBatch + 1
    );
  }

  /**
   * Save processing state to localStorage
   */
  private saveProcessingState(
    jobId: string,
    lastCompletedBatch: number,
    totalBatches: number,
    config: BulkProcessingConfig
  ): void {
    const state: ProcessingState = {
      jobId,
      lastCompletedBatch,
      totalBatches,
      config,
      timestamp: Date.now(),
    };

    try {
      localStorage.setItem(
        `${this.STORAGE_KEY_PREFIX}${jobId}`,
        JSON.stringify(state)
      );
    } catch (error) {
      // Failed to save processing state
    }
  }

  /**
   * Update stored batch progress
   */
  private updateStoredBatchProgress(jobId: string, lastCompletedBatch: number): void {
    const state = this.getProcessingState(jobId);
    if (state) {
      state.lastCompletedBatch = lastCompletedBatch;
      state.timestamp = Date.now();

      try {
        localStorage.setItem(
          `${this.STORAGE_KEY_PREFIX}${jobId}`,
          JSON.stringify(state)
        );
      } catch (error) {
        // Failed to update processing state
      }
    }
  }

  /**
   * Retrieve processing state from localStorage
   */
  getProcessingState(jobId: string): ProcessingState | null {
    try {
      const stateJson = localStorage.getItem(`${this.STORAGE_KEY_PREFIX}${jobId}`);
      if (stateJson) {
        return JSON.parse(stateJson);
      }
    } catch (error) {
      // Failed to retrieve processing state
    }
    return null;
  }

  /**
   * Clear processing state from localStorage
   */
  clearProcessingState(jobId: string): void {
    try {
      localStorage.removeItem(`${this.STORAGE_KEY_PREFIX}${jobId}`);
    } catch (error) {
      // Failed to clear processing state
    }
  }

  /**
   * Get all saved processing states (for recovery UI)
   */
  getAllSavedStates(): ProcessingState[] {
    const states: ProcessingState[] = [];

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.STORAGE_KEY_PREFIX)) {
          const stateJson = localStorage.getItem(key);
          if (stateJson) {
            states.push(JSON.parse(stateJson));
          }
        }
      }
    } catch (error) {
      // Failed to retrieve saved states
    }

    return states;
  }

  /**
   * Cleanup on service destruction
   */
  ngOnDestroy(): void {
    this.cancelSubject$.next();
    this.cancelSubject$.complete();
    this.progressSubject$.complete();
  }
}
