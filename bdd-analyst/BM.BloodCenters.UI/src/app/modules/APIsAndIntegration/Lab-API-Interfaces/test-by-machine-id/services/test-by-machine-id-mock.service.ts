import { Injectable } from '@angular/core';
import { Observable, of, delay, throwError } from 'rxjs';
import {
  InstrumentIdOption,
  InstrumentTestIdOption,
  LifeTrackTestOption,
  TestByMachineIdResponse,
  TestByMachineIdParamsDto,
  TestByMachineIdBulkUpsertDto,
  SaveResponse
} from '../models/test-by-machine-id.model';
import {
  MOCK_INSTRUMENT_IDS,
  MOCK_INSTRUMENT_TEST_IDS,
  MOCK_TEST_OPTIONS,
  getMockTestDataResponse,
  MOCK_SCENARIOS
} from './test-by-machine-id-mock-data';

/**
 * Mock service for Test by Machine ID
 * This service simulates API calls with mock data for testing
 *
 * Configuration:
 * - Set SIMULATE_DELAY to add realistic API delay
 * - Set SIMULATE_ERROR to test error handling
 * - Set SCENARIO to test different data scenarios
 */
@Injectable({
  providedIn: 'root'
})
export class TestByMachineIdMockService {
  // Configuration flags
  private readonly SIMULATE_DELAY = 800; // milliseconds
  private readonly SIMULATE_ERROR = false; // Set to true to test error handling
  private readonly SCENARIO: 'EMPTY' | 'STANDARD' | 'SINGLE_ROW' = 'STANDARD';

  constructor() {}

  /**
   * Get all available instrument IDs
   */
  getInstrumentIds(): Observable<InstrumentIdOption[]> {
    if (this.SIMULATE_ERROR) {
      return throwError(() => new Error('Failed to load instrument IDs'));
    }
    return of(MOCK_INSTRUMENT_IDS).pipe(delay(this.SIMULATE_DELAY));
  }

  /**
   * Get all available instrument test IDs
   */
  getInstrumentTestIds(): Observable<InstrumentTestIdOption[]> {
    if (this.SIMULATE_ERROR) {
      return throwError(() => new Error('Failed to load instrument test IDs'));
    }
    return of(MOCK_INSTRUMENT_TEST_IDS).pipe(delay(this.SIMULATE_DELAY));
  }

  /**
   * Retrieve test data by instrument ID and test ID
   */
  getTestData(params: TestByMachineIdParamsDto): Observable<TestByMachineIdResponse> {
    if (this.SIMULATE_ERROR) {
      return throwError(() => new Error('Failed to retrieve test data'));
    }

    // Return data based on selected scenario
    let response: TestByMachineIdResponse;

    switch (this.SCENARIO) {
      case 'EMPTY':
        response = MOCK_SCENARIOS['EMPTY'];
        break;
      case 'SINGLE_ROW':
        response = MOCK_SCENARIOS['SINGLE_ROW'];
        break;
      case 'STANDARD':
      default:
        response = getMockTestDataResponse(
          params.instrumentId || 'S201',
          params.testId || 'MPX'
        );
        break;
    }

    return of(response).pipe(delay(this.SIMULATE_DELAY));
  }

  /**
   * Save bulk test data (both instrument tests and application scheduling tests)
   */
  saveBulkTestData(dto: TestByMachineIdBulkUpsertDto): Observable<SaveResponse> {
    if (this.SIMULATE_ERROR) {
      return throwError(() => new Error('Failed to save test data'));
    }

    console.log('Mock save called with data:', dto);

    const response: SaveResponse = {
      success: true,
      message: 'Test data saved successfully',
      data: {
        instrumentTestsUpdated: dto.InstrumentTests?.length || 0,
        applicationTestsUpdated: dto.ApplicationSchedulingTests?.length || 0
      }
    };

    return of(response).pipe(delay(this.SIMULATE_DELAY));
  }

  /**
   * Get dropdown options for test fields
   */
  getTestOptions(): Observable<{ tests: LifeTrackTestOption[]; results: string[] }> {
    if (this.SIMULATE_ERROR) {
      return throwError(() => new Error('Failed to load test options'));
    }
    return of(MOCK_TEST_OPTIONS).pipe(delay(this.SIMULATE_DELAY));
  }
}
