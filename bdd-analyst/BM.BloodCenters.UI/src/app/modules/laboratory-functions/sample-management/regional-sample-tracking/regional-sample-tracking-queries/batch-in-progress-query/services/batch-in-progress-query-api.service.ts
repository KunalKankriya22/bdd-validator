import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API } from '@core/constants/api.constants';
import {
  ReturnResult,
  BatchInProgressDto,
  UnitInProgressDto,
  ContractDto,
  BatchLookupDto,
  BatchInProgressQueryDto,
  UnitTestResultDto,
  UnitInterdictionDto,
  UnitTestBaseDto,
  HoldingTestDto,
} from '../models/batch-in-progress-query.model';

/**
 * API Service for Batch In-Progress Query
 * Mnemonic: BIPQ
 * JIRA: MLT-13593, MLT-13595
 *
 * Endpoints:
 * 1. POST /api/v1/batch-in-progress-query/search - Search batches with filters
 * 2. GET /api/v1/batch-in-progress-query/{batchId}/units - Get units for batch
 * 3. GET /api/v1/batch-in-progress-query/contracts - Get contracts dropdown
 * 4. GET /api/v1/batch-in-progress-query/batches-lookup - Get batches for lookup
 */
@Injectable({ providedIn: 'root' })
export class BatchInProgressQueryApiService {
  private readonly http = inject(HttpClient);

  /**
   * Get active regional contracts for dropdown
   * GET /api/v1/batch-in-progress-query/contracts
   */
  getContracts(): Observable<ReturnResult<ContractDto[]>> {
    return this.http.get<ReturnResult<ContractDto[]>>(
      API.BATCH_IN_PROGRESS_QUERY.CONTRACTS,
    );
  }

  /**
   * Get valid batches for lookup based on contract
   * GET /api/v1/batch-in-progress-query/batches-lookup?contractId={contractId}
   */
  getBatchesLookup(contractId: string): Observable<ReturnResult<BatchLookupDto[]>> {
    const params = new HttpParams().set('contractId', contractId);
    return this.http.get<ReturnResult<BatchLookupDto[]>>(
      API.BATCH_IN_PROGRESS_QUERY.BATCHES_LOOKUP,
      { params },
    );
  }

  /**
   * Search for batches in progress with filters and pagination
   * POST /api/v1/batch-in-progress-query/search
   */
  searchBatches(
    query: BatchInProgressQueryDto,
  ): Observable<ReturnResult<BatchInProgressDto[]>> {
    return this.http.post<ReturnResult<BatchInProgressDto[]>>(
      API.BATCH_IN_PROGRESS_QUERY.SEARCH,
      query,
    );
  }

  /**
   * Get units for a specific batch with detailed test results
   * GET /api/v1/batch-in-progress-query/{batchId}/units?contractId={contractId}&includeNoTestResults={Y/N}&queryMode={A/E}
   */
  getUnitsForBatch(
    batchId: string,
    contractId: string,
    includeNoTestResults = 'Y',
    queryMode = 'A',
  ): Observable<ReturnResult<UnitInProgressDto[]>> {
    const params = new HttpParams()
      .set('contractId', contractId)
      .set('includeNoTestResults', includeNoTestResults)
      .set('queryMode', queryMode);

    return this.http.get<ReturnResult<UnitInProgressDto[]>>(
      API.BATCH_IN_PROGRESS_QUERY.UNITS(batchId),
      { params },
    );
  }

  /**
   * Get test results (UTRS) for a specific unit
   * GET /api/v1/batch-in-progress-query/units/{unitId}/test-results?chapterId={chapterId}
   */
  getUnitTestResults(unitId: string, chapterId: string): Observable<ReturnResult<UnitTestResultDto[]>> {
    const params = new HttpParams().set('chapterId', chapterId);
    return this.http.get<ReturnResult<UnitTestResultDto[]>>(
      API.BATCH_IN_PROGRESS_QUERY.UNIT_TEST_RESULTS(unitId),
      { params },
    );
  }

  /**
   * Get interdictions for a specific unit
   * GET /api/v1/batch-in-progress-query/units/{unitId}/interdictions?chapterId={chapterId}&collDate={date}
   */
  getUnitInterdictions(
    unitId: string,
    chapterId: string,
    collDate?: string,
  ): Observable<ReturnResult<UnitInterdictionDto[]>> {
    let params = new HttpParams().set('chapterId', chapterId);
    if (collDate) {
      params = params.set('collDate', collDate);
    }
    return this.http.get<ReturnResult<UnitInterdictionDto[]>>(
      API.BATCH_IN_PROGRESS_QUERY.UNIT_INTERDICTIONS(unitId),
      { params },
    );
  }

  /**
   * Get unscheduled/holding tests for a specific unit
   * GET /api/v1/batch-in-progress-query/units/{unitId}/holding-tests?chapterId={chapterId}&collDate={date}
   */
  getUnitHoldingTests(
    unitId: string,
    chapterId: string,
    collDate?: string,
  ): Observable<ReturnResult<{
    unscheduledTests: UnitTestBaseDto[];
    holdingTests: HoldingTestDto[];
  }>> {
    let params = new HttpParams().set('chapterId', chapterId);
    if (collDate) {
      params = params.set('collDate', collDate);
    }
    return this.http.get<ReturnResult<{
      unscheduledTests: UnitTestBaseDto[];
      holdingTests: HoldingTestDto[];
    }>>(
      API.BATCH_IN_PROGRESS_QUERY.UNIT_HOLDING_TESTS(unitId),
      { params },
    );
  }

  /**
   * Get active chapters for multi-select dropdown
   * GET /api/v1/batch-in-progress-query/chapters
   */
  getChapters(): Observable<ReturnResult<any[]>> {
    return this.http.get<ReturnResult<any[]>>(
      API.BATCH_IN_PROGRESS_QUERY.CHAPTERS,
    );
  }

  /**
   * Search contracts by contract ID or company name
   * GET /api/v1/batch-in-progress-query/contracts/search?searchTerm={term}
   */
  searchContracts(searchTerm?: string): Observable<ReturnResult<ContractDto[]>> {
    let params = new HttpParams();
    if (searchTerm) {
      params = params.set('searchTerm', searchTerm);
    }
    return this.http.get<ReturnResult<ContractDto[]>>(
      API.BATCH_IN_PROGRESS_QUERY.CONTRACTS_SEARCH,
      { params },
    );
  }
}
