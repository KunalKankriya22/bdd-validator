import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import {
  ReleaseTestResultSearchRequest,
  ReleaseTestResultSearchResponse,
  AutoDetermineQcFlagRequest,
  AutoDetermineQcFlagResponse,
  ReleaseTestResultsRequest,
  ReleaseTestResultsResponse,
  ApiResponse,
  ContractOption,
  BatchOption,
  TestResult,
  TestSeriesOption,
  TestOption,
  CollectionDayLegendItem,
  SampleAgeConfig,
  ReleaseTestResultUnit
} from '../models/release-test-results.models';

export interface ReleaseTestResultsState {
  formValues: { contractId: string; contractIdDescription: string; batchId: string };
  searchResults: ReleaseTestResultSearchResponse | null;
  unitsData: ReleaseTestResultUnit[];
  selectedUnit: ReleaseTestResultUnit | null;
  selectedUnitIndex: number;
  testResults: TestResult[];
  showSidePanel: boolean;
  sortColumn: string;
  sortDirection: 'ASC' | 'DESC';
  contractOptions: ContractOption[];
  batchOptions: BatchOption[];
  legendData: CollectionDayLegendItem[];
  sampleAgeConfig: SampleAgeConfig[];
  reconciled: boolean;
}

/**
 * Service for Release Test Results operations
 * Handles API calls to backend release-test-results controller
 * API Documentation: /api/laboratory/release-test-results
 */
@Injectable({
  providedIn: 'root'
})
export class ReleaseTestResultsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/v1/laboratory/release-test-results`;

  private _savedState: ReleaseTestResultsState | null = null;

  get savedState(): ReleaseTestResultsState | null { return this._savedState; }
  saveState(state: ReleaseTestResultsState): void { this._savedState = state; }
  clearState(): void { this._savedState = null; }

  /**
   * Search for units available for QC test release
   * @param request Search criteria (contract ID, optional batch ID, sort options)
   * @returns Observable<ReleaseTestResultSearchResponse>
   *
   * API Endpoint: POST /laboratory/release-test-results/search
   * Success Response: HTTP 200 with search results
   * Not Found Response: HTTP 404 (Error code: 0085)
   * Validation Error: HTTP 400 (Error code: 1147 - Invalid contract)
   */
  searchUnits(request: ReleaseTestResultSearchRequest): Observable<ReleaseTestResultSearchResponse> {
    const url = `${this.baseUrl}/search`;
    return this.http.post<ApiResponse<ReleaseTestResultSearchResponse>>(url, request).pipe(
      map(response => {
        if (response.data && response.data.length > 0) {
          return { ...response.data[0], message: response.message };
        }
        // Return empty response structure if no data
        return {
          contractId: request.contractId || '',
          company: '',
          contractType: '',
          resultsMethod: null,
          batchId: request.batchId || null,
          units: [],
          totalUnits: 0,
          unitsToRelease: 0,
          skippedUnits: 0,
          sqcReasonUnits: 0,
          batchOnHold: false,
          batchSkipped: false,
          message: response.message
        };
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Auto-determine QC flags and serum/plasma indicators for units
   * Business Logic:
   * - If RedTubeFlag='Y' OR RedTube2Flag='Y': QcTestFlag='Y', SerumPlasmaInd='S' (Serum)
   * - Else if PurpleTubeFlag='Y': QcTestFlag='Y', SerumPlasmaInd='P' (Plasma)
   * - Else: QcTestFlag='N', SerumPlasmaInd=null
   *
   * @param request Units to process
   * @returns Observable<AutoDetermineQcFlagResponse>
   *
   * API Endpoint: POST /laboratory/release-test-results/auto-determine-qc-flags
   * Success Response: HTTP 200 with determined flags
   */
  autoDetermineQcFlags(request: AutoDetermineQcFlagRequest): Observable<AutoDetermineQcFlagResponse> {
    const url = `${this.baseUrl}/auto-determine-qc-flags`;
    return this.http.post<ApiResponse<AutoDetermineQcFlagResponse>>(url, request).pipe(
      map(response => {
        if (response.data && response.data.length > 0) {
          return { ...response.data[0], message: response.message };
        }
        return { units: [], totalProcessed: 0, message: response.message };
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Release QC test results for units
   * Validates each unit, updates QC test dates, marks interim results as final
   *
   * @param request Units to release with contract/batch info
   * @returns Observable<ReleaseTestResultsResponse>
   *
   * API Endpoint: POST /laboratory/release-test-results/release
   * Success Response: HTTP 200 with release results
   * Validation Errors:
   * - HTTP 400 (Error code: 1191 - Batch on hold)
   * - HTTP 400 (Error code: 1192 - Batch skipped)
   *
   * performCommit flag:
   * - true: Commits changes to database
   * - false: Validation only mode (no changes)
   */
  releaseTestResults(request: ReleaseTestResultsRequest): Observable<ReleaseTestResultsResponse> {
    const url = `${this.baseUrl}/release`;
    return this.http.post<ApiResponse<ReleaseTestResultsResponse>>(url, request).pipe(
      map(response => {
        if (response.data && response.data.length > 0) {
          return { ...response.data[0], message: response.message };
        }
        return {
          unitsReleased: 0,
          unitsSkipped: 0,
          releasedUnitIds: [],
          skippedUnitIds: [],
          allUnitsReleased: false,
          message: response.message
        };
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Get contract options for dropdown (LOV - List of Values)
   *
   * @returns Observable<ContractOption[]>
   *
   * API Endpoint: GET /laboratory/release-test-results/contracts
   * Success Response: HTTP 200 with contract options
   */
  getContractOptions(): Observable<ContractOption[]> {
    const url = `${this.baseUrl}/contracts`;
    return this.http.get<ApiResponse<ContractOption>>(url).pipe(
      map(response => response.data || []),
      catchError(this.handleError)
    );
  }

  /**
   * Get batch options for dropdown filtered by contract (LOV - List of Values)
   *
   * @param contractId Contract ID to filter batches
   * @returns Observable<BatchOption[]>
   *
   * API Endpoint: GET /laboratory/release-test-results/batches/{contractId}
   * Success Response: HTTP 200 with batch options
   */
  getBatchOptions(contractId: string): Observable<BatchOption[]> {
    const url = `${this.baseUrl}/batches/${encodeURIComponent(contractId)}`;
    return this.http.get<ApiResponse<BatchOption>>(url).pipe(
      map(response => response.data || []),
      catchError(this.handleError)
    );
  }

  /**
   * Get test results for a specific unit (for side panel display)
   *
   * @param unitId Unit identifier
   * @param collDate Collection date (YYYY-MM-DD)
   * @returns Observable<TestResult[]>
   *
   * API Endpoint: GET /laboratory/release-test-results/test-results/{unitId}?collDate={collDate}
   * Success Response: HTTP 200 with test results
   */
  getUnitTestResults(unitId: string, collDate: string): Observable<TestResult[]> {
    const url = `${this.baseUrl}/test-results/${encodeURIComponent(unitId)}?collDate=${encodeURIComponent(collDate)}`;
    return this.http.get<ApiResponse<TestResult>>(url).pipe(
      map(response => response.data || []),
      catchError(this.handleError)
    );
  }

  /**
   * Get test series dropdown options
   */
  getTestSeries(): Observable<TestSeriesOption[]> {
    const url = `${this.baseUrl}/test-series`;
    return this.http.get<ApiResponse<TestSeriesOption>>(url).pipe(
      map(response => response.data || []),
      catchError(this.handleError)
    );
  }

  /**
   * Get tests dropdown options
   */
  getTests(): Observable<TestOption[]> {
    const url = `${this.baseUrl}/tests`;
    return this.http.get<ApiResponse<TestOption>>(url).pipe(
      map(response => response.data || []),
      catchError(this.handleError)
    );
  }

  /**
   * Get collection day legend from Master Codes
   */
  getCollectionDayLegend(): Observable<CollectionDayLegendItem[]> {
    const url = `${this.baseUrl}/collection-day-legend`;
    return this.http.get<ApiResponse<CollectionDayLegendItem>>(url).pipe(
      map(response => response.data || []),
      catchError(this.handleError)
    );
  }

  /**
   * Get sample age configuration for dynamic collection date color coding
   */
  getSampleAgeConfig(): Observable<SampleAgeConfig[]> {
    const url = `${this.baseUrl}/sample-age-config`;
    return this.http.get<ApiResponse<SampleAgeConfig>>(url).pipe(
      map(response => response.data || []),
      catchError(this.handleError)
    );
  }

  /**
   * Submit report print job for a unit
   * @param unitId Unit identifier
   * @returns Observable with job ID
   */
  submitReport(unitId: string): Observable<any> {
    const url = `${this.baseUrl}/report`;
    return this.http.post<any>(url, { unitId }).pipe(
      map(response => response.item),
      catchError(this.handleError)
    );
  }

  /**
   * Handle HTTP errors
   * Extracts error message and code from API response
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred';
    let errorCode = 'UNKNOWN';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      if (error.error && error.error.message) {
        errorMessage = error.error.message;
        errorCode = error.error.errorCode || 'UNKNOWN';
      } else {
        errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
      }
    }

    console.error('ReleaseTestResultsService error:', { errorMessage, errorCode, error });
    return throwError(() => ({ message: errorMessage, code: errorCode, originalError: error }));
  }
}
