import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { delay, map } from 'rxjs/operators';

/**
 * Mock service for testing bulk processing without a real backend
 *
 * This service intercepts bulk processing API calls and simulates
 * backend behavior with configurable delays, failures, and responses.
 *
 * USAGE:
 *
 * 1. In your module, provide this instead of HttpClient for testing:
 *    providers: [
 *      { provide: HttpClient, useClass: BulkProcessorMockService }
 *    ]
 *
 * 2. Or inject it directly:
 *    constructor(private mockService: BulkProcessorMockService) {}
 *
 * 3. Configure behavior:
 *    this.mockService.configure({
 *      successRate: 0.9, // 90% success rate
 *      responseDelay: 500 // 500ms delay per batch
 *    });
 */
@Injectable({
  providedIn: 'root'
})
export class BulkProcessorMockService {

  // Configuration
  private config = {
    // Success rate (0.0 - 1.0)
    successRate: 1.0,

    // Base delay in milliseconds
    responseDelay: 300,

    // Random delay variation (0.0 - 1.0)
    // 0 = fixed delay, 1 = delay can vary from 0 to 2x baseDelay
    delayVariation: 0.3,

    // Simulate network errors
    networkErrorRate: 0.0,

    // Simulate validation errors
    validationErrorRate: 0.0,

    // Simulate server errors
    serverErrorRate: 0.0,

    // Track processed batches for idempotency
    enableIdempotency: true,

    // Verbose logging
    verbose: true
  };

  // Store processed batches (jobId_batchNumber -> result)
  private processedBatches = new Map<string, any>();

  // Statistics
  private stats = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    totalDelay: 0
  };

  constructor() {
  }

  /**
   * Configure mock service behavior
   */
  configure(config: Partial<typeof this.config>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Reset statistics and processed batches
   */
  reset(): void {
    this.processedBatches.clear();
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalDelay: 0
    };
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      averageDelay: this.stats.totalRequests > 0
        ? this.stats.totalDelay / this.stats.totalRequests
        : 0,
      successRate: this.stats.totalRequests > 0
        ? this.stats.successfulRequests / this.stats.totalRequests
        : 0
    };
  }

  /**
   * Mock HTTP POST method
   *
   * This simulates the HttpClient.post() method used by BulkProcessorService
   */
  post<T>(url: string, body: any, options?: any): Observable<T> {
    this.stats.totalRequests++;

    const { jobId, batchNumber, totalBatches, records } = body;

    // Check idempotency
    if (this.config.enableIdempotency) {
      const batchKey = `${jobId}_${batchNumber}`;
      const cachedResult = this.processedBatches.get(batchKey);

      if (cachedResult) {
        return of(cachedResult).pipe(
          delay(50) // Small delay for cached response
        );
      }
    }

    // Calculate delay with variation
    const baseDelay = this.config.responseDelay;
    const variation = this.config.delayVariation;
    const randomFactor = 1 + (Math.random() * 2 - 1) * variation;
    const actualDelay = Math.max(0, baseDelay * randomFactor);

    this.stats.totalDelay += actualDelay;

    // Determine if this request should fail
    const shouldFail = this.shouldSimulateFailure();

    if (shouldFail.fail) {
      this.stats.failedRequests++;
      const errorType = shouldFail.type || 'general';

      return of(null).pipe(
        delay(actualDelay),
        map(() => {
          throw this.createError(errorType, batchNumber);
        })
      );
    }

    // Simulate processing records
    const result = this.processRecords(records, batchNumber);

    // Cache result for idempotency
    if (this.config.enableIdempotency) {
      const batchKey = `${jobId}_${batchNumber}`;
      this.processedBatches.set(batchKey, result);
    }

    this.stats.successfulRequests++;

    return of(result as T).pipe(
      delay(actualDelay)
    );
  }

  /**
   * Determine if request should fail and what type of failure
   */
  private shouldSimulateFailure(): { fail: boolean; type?: string } {
    const random = Math.random();

    // Check network error
    if (random < this.config.networkErrorRate) {
      return { fail: true, type: 'network' };
    }

    // Check validation error
    if (random < this.config.networkErrorRate + this.config.validationErrorRate) {
      return { fail: true, type: 'validation' };
    }

    // Check server error
    if (random < this.config.networkErrorRate + this.config.validationErrorRate + this.config.serverErrorRate) {
      return { fail: true, type: 'server' };
    }

    // Check general failure based on success rate
    if (random > this.config.successRate) {
      return { fail: true, type: 'general' };
    }

    return { fail: false };
  }

  /**
   * Create error based on type
   */
  private createError(type: string, batchNumber: number): any {
    type ErrorType = 'network' | 'validation' | 'server' | 'general';

    const errors: Record<ErrorType, any> = {
      network: {
        status: 0,
        statusText: 'Unknown Error',
        message: 'Network error: Unable to connect to server',
        error: { message: 'Network failure' }
      },
      validation: {
        status: 400,
        statusText: 'Bad Request',
        message: 'Validation error: Invalid record data',
        error: {
          message: 'Validation failed',
          details: [`Record at index ${Math.floor(Math.random() * 10)} is invalid`]
        }
      },
      server: {
        status: 500,
        statusText: 'Internal Server Error',
        message: 'Server error: Unable to process request',
        error: { message: 'Internal server error' }
      },
      general: {
        status: 503,
        statusText: 'Service Unavailable',
        message: 'Service temporarily unavailable',
        error: { message: 'Service unavailable' }
      }
    };

    return errors[type as ErrorType] || errors.general;
  }

  /**
   * Simulate processing records
   */
  private processRecords(records: any[], batchNumber: number): any {
    // Simulate some records might fail individually
    const processedRecords = records.map((record, index) => {
      const recordSuccess = Math.random() > 0.05; // 95% success rate per record

      return {
        recordId: record.id || `record-${index}`,
        success: recordSuccess,
        error: recordSuccess ? null : 'Record processing failed'
      };
    });

    const successCount = processedRecords.filter(r => r.success).length;
    const failCount = processedRecords.filter(r => !r.success).length;

    return {
      success: true,
      batchNumber,
      processedCount: successCount,
      failedCount: failCount,
      records: processedRecords,
      timestamp: new Date().toISOString()
    };
  }

}

/**
 * Testing scenarios helper
 *
 * Provides pre-configured scenarios for common test cases
 */
export class BulkProcessingTestScenarios {

  /**
   * Scenario 1: Perfect conditions (100% success, fast)
   */
  static perfect(mockService: BulkProcessorMockService): void {
    mockService.configure({
      successRate: 1.0,
      responseDelay: 100,
      networkErrorRate: 0,
      validationErrorRate: 0,
      serverErrorRate: 0,
      verbose: true
    });
  }

  /**
   * Scenario 2: Slow network (100% success, slow)
   */
  static slowNetwork(mockService: BulkProcessorMockService): void {
    mockService.configure({
      successRate: 1.0,
      responseDelay: 2000,
      delayVariation: 0.5,
      networkErrorRate: 0,
      validationErrorRate: 0,
      serverErrorRate: 0,
      verbose: true
    });
  }

  /**
   * Scenario 3: Unreliable network (70% success, transient errors)
   */
  static unreliableNetwork(mockService: BulkProcessorMockService): void {
    mockService.configure({
      successRate: 0.7,
      responseDelay: 500,
      delayVariation: 0.8,
      networkErrorRate: 0.2,
      validationErrorRate: 0.05,
      serverErrorRate: 0.05,
      verbose: true
    });
  }

  /**
   * Scenario 4: Server errors (50% success, mostly server errors)
   */
  static serverErrors(mockService: BulkProcessorMockService): void {
    mockService.configure({
      successRate: 0.5,
      responseDelay: 800,
      networkErrorRate: 0,
      validationErrorRate: 0.1,
      serverErrorRate: 0.4,
      verbose: true
    });
  }

  /**
   * Scenario 5: Validation errors (80% success, mostly validation errors)
   */
  static validationErrors(mockService: BulkProcessorMockService): void {
    mockService.configure({
      successRate: 0.8,
      responseDelay: 300,
      networkErrorRate: 0,
      validationErrorRate: 0.2,
      serverErrorRate: 0,
      verbose: true
    });
  }

  /**
   * Scenario 6: Realistic production (95% success, mixed errors)
   */
  static realistic(mockService: BulkProcessorMockService): void {
    mockService.configure({
      successRate: 0.95,
      responseDelay: 400,
      delayVariation: 0.3,
      networkErrorRate: 0.02,
      validationErrorRate: 0.02,
      serverErrorRate: 0.01,
      verbose: true
    });
  }

  /**
   * Scenario 7: Stress test (Fast responses for load testing)
   */
  static stressTest(mockService: BulkProcessorMockService): void {
    mockService.configure({
      successRate: 1.0,
      responseDelay: 10,
      delayVariation: 0.1,
      networkErrorRate: 0,
      validationErrorRate: 0,
      serverErrorRate: 0,
      verbose: false // Disable verbose for performance
    });
  }
}

/**
 * Example usage in component:
 *
 * export class TestComponent {
 *   constructor(
 *     private bulkProcessor: BulkProcessorService,
 *     private mockService: BulkProcessorMockService
 *   ) {}
 *
 *   testPerfectScenario() {
 *     BulkProcessingTestScenarios.perfect(this.mockService);
 *     this.runBulkProcessing();
 *   }
 *
 *   testUnreliableNetwork() {
 *     BulkProcessingTestScenarios.unreliableNetwork(this.mockService);
 *     this.runBulkProcessing();
 *   }
 *
 *   runBulkProcessing() {
 *     const records = this.generateTestRecords(500);
 *
 *     // Mock service will intercept the HTTP call
 *     this.bulkProcessor
 *       .processBulk(records, '/api/test', { batchSize: 50 })
 *       .subscribe({
 *         complete: () => {
 *           const stats = this.mockService.getStats();
 *           // Handle processing complete
 *         }
 *       });
 *   }
 * }
 */
