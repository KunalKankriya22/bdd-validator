import { Injectable, inject } from '@angular/core';
import { HttpContext, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';
import { SKIP_ERROR_TOAST } from '@core/constants/http-context.constants';
import {
  ReturnResult,
  FilterOptionsResponse,
  FilterOptionsParams,
  TestResultData,
  CreateTestResultRequest,
  UpdateTestResultRequest,
  SaveResultsRequest,
  SaveResultsResponse,
  UnitValidationResponse,
  SearchCriteria
} from '../models';

/**
 * API Service for First Tech Test Result
 * Handles all HTTP calls to the First Tech Test Result API endpoints
 */
@Injectable({
  providedIn: 'root'
})
export class FirstTechTestResultApiService {
  private readonly apiService = inject(ApiService);

  /**
   * GET /api/v1/first-tech-test-result/filter-options
   * Gets all dropdown options (combined endpoint - kept for backward compatibility)
   */
  getFilterOptions(params?: FilterOptionsParams): Observable<ReturnResult<FilterOptionsResponse>> {
    let httpParams = new HttpParams();

    if (params?.tbId) {
      httpParams = httpParams.set('tbId', params.tbId);
    }
    if (params?.testId) {
      httpParams = httpParams.set('testId', params.testId);
    }
    if (params?.antigenFlag) {
      httpParams = httpParams.set('antigenFlag', params.antigenFlag);
    }

    return this.apiService.get<ReturnResult<FilterOptionsResponse>>(
      API.LABORATORY_FUNCTIONS.FIRST_TECH_TEST_RESULT.FILTER_OPTIONS,
      { params: httpParams }
    );
  }

  /**
   * GET /api/v1/first-tech-test-result/tb-ws-options
   * Gets TB/WS dropdown options only
   *
   * Oracle Forms LOV: TEST_BATCH_LOV (Record Group: TEST_BATCH_RG)
   * Display Columns: TB_ID, INSERT_DATS (MM-DD-YYYY), TEST_ID
   * Return Columns: TB_ID, TEST_ID, TEST_KIT_ID (from TEST_BATCH_DET)
   *
   * Filters:
   * - Last 21 days only
   * - User's testing lab code
   * - Excludes reconciled batches (reconcile_flag != 'Y')
   * - Excludes antigen group tests (ANTGR)
   * - Excludes band result tests
   * - Only batches with pending units (temp_result_1 is null)
   */
  getTbWsOptions(): Observable<ReturnResult<{ tbId: string; insertDate: string; testId: string; testKitId?: string }[]>> {
    return this.apiService.get<ReturnResult<{ tbId: string; insertDate: string; testId: string; testKitId?: string }[]>>(
      API.LABORATORY_FUNCTIONS.FIRST_TECH_TEST_RESULT.TB_WS_OPTIONS
    );
  }

  /**
   * GET /api/v1/first-tech-test-result/test-id-options?tbId={optional}
   * Gets Test ID dropdown options only
   *
   * Oracle Forms LOV: TEST_ID_LOV (Dynamic - switches between 2 Record Groups)
   *
   * Context 1 - New Batch Mode (tbId is null):
   *   Record Group: TEST_ID_RG
   *   Shows: All valid tests not in WSNGR/ANTGR groups, not band tests
   *
   * Context 2 - Existing Batch Mode (tbId is provided):
   *   Record Group: TEST_ID2_RG
   *   Shows: Only tests with pending results in holding_tests for the selected batch
   *   WHERE EXISTS (holding_tests with temp_result_1 is null and result_status_1 is null)
   *
   * Display Columns: TEST_ID, TEST_DESC
   * Return Columns: TEST_ID, TEST_DESC (also returns: NO_OF_TECH, ANTIGEN_FLAG, AUTO_SCHEDULE)
   */
  getTestIdOptions(tbId?: string): Observable<ReturnResult<{ testId: string; testDesc: string; noOfTech: number; antigenFlag: string; autoSchedule: string }[]>> {
    let httpParams = new HttpParams();
    if (tbId) {
      httpParams = httpParams.set('tbId', tbId);
    }

    return this.apiService.get<ReturnResult<{ testId: string; testDesc: string; noOfTech: number; antigenFlag: string; autoSchedule: string }[]>>(
      API.LABORATORY_FUNCTIONS.FIRST_TECH_TEST_RESULT.TEST_ID_OPTIONS,
      { params: httpParams }
    );
  }

  /**
   * GET /api/v1/first-tech-test-result/test-kit-options?testId={optional}
   * Gets Test Kit dropdown options only
   *
   * Oracle Forms LOV: TEST_KIT_LOV (Record Group: TEST_KIT_RG)
   * Oracle SQL: WHERE NVL(qc_expiry_date, sysdate) >= sysdate
   *
   * Display Columns: TEST_KIT_ID, QC_EXPIRY_DATE
   * Return Columns: TEST_KIT_ID
   *
   * Filters (ALL IN LOV QUERY):
   * - Filtered by test_id
   * - Filtered by chapter_id
   * - ✅ Expiry filter: NVL(qc_expiry_date, chapterLocalDate + 1) >= chapterLocalDate (MATCHES Oracle Forms)
   * - Testing lab code filter
   *
   * API SQL: FirstTechTestResult-test-kits-dropdown.sql
   */
  getTestKitOptions(testId?: string): Observable<ReturnResult<{ testKitId: string; testId: string; qcExpiryDate?: string }[]>> {
    let httpParams = new HttpParams();
    if (testId) {
      httpParams = httpParams.set('testId', testId);
    }

    return this.apiService.get<ReturnResult<{ testKitId: string; testId: string; qcExpiryDate?: string }[]>>(
      API.LABORATORY_FUNCTIONS.FIRST_TECH_TEST_RESULT.TEST_KIT_OPTIONS,
      { params: httpParams }
    );
  }

  /**
   * POST /api/v1/first-tech-test-result/{take}/{skip}
   * Retrieves test results with pagination and filtering
   */
  getTestResults(criteria: SearchCriteria): Observable<ReturnResult<TestResultData[]>> {
    const take = criteria.take || 1000;
    const skip = criteria.skip || 0;

    const body = {
      tbId: criteria.tbId || null,
      testId: criteria.testId || null,
      unitId: criteria.unitId || null,
      resultCode: criteria.resultCode || null,
      chapterId: null // Will be set by backend from user context
    };

    return this.apiService.post<ReturnResult<TestResultData[]>>(
      `${API.LABORATORY_FUNCTIONS.FIRST_TECH_TEST_RESULT.BASE}/${take}/${skip}`,
      body
    );
  }

  /**
   * GET /api/v1/first-tech-test-result/{tbId}/{testId}/{tbSeqNo}
   * Retrieves a single test result by composite key
   */
  getTestResult(tbId: string, testId: string, tbSeqNo: number): Observable<ReturnResult<TestResultData>> {
    return this.apiService.get<ReturnResult<TestResultData>>(
      `${API.LABORATORY_FUNCTIONS.FIRST_TECH_TEST_RESULT.BASE}/${tbId}/${testId}/${tbSeqNo}`
    );
  }

  /**
   * POST /api/v1/first-tech-test-result
   * Creates a new test result in HOLDING_TESTS
   */
  createTestResult(request: CreateTestResultRequest): Observable<ReturnResult<{ tbId: string; testId: string; tbSeqNo: number }>> {
    return this.apiService.post<ReturnResult<{ tbId: string; testId: string; tbSeqNo: number }>>(
      API.LABORATORY_FUNCTIONS.FIRST_TECH_TEST_RESULT.BASE,
      request
    );
  }

  /**
   * PUT /api/v1/first-tech-test-result/{tbId}/{testId}/{tbSeqNo}
   * Updates an existing test result
   */
  updateTestResult(
    tbId: string,
    testId: string,
    tbSeqNo: number,
    request: UpdateTestResultRequest
  ): Observable<ReturnResult<void>> {
    return this.apiService.put<ReturnResult<void>>(
      `${API.LABORATORY_FUNCTIONS.FIRST_TECH_TEST_RESULT.BASE}/${tbId}/${testId}/${tbSeqNo}`,
      request
    );
  }

  /**
   * DELETE /api/v1/first-tech-test-result/{tbId}/{testId}/{tbSeqNo}
   * Deletes a test result from HOLDING_TESTS
   */
  deleteTestResult(tbId: string, testId: string, tbSeqNo: number): Observable<ReturnResult<void>> {
    return this.apiService.delete<ReturnResult<void>>(
      `${API.LABORATORY_FUNCTIONS.FIRST_TECH_TEST_RESULT.BASE}/${tbId}/${testId}/${tbSeqNo}`
    );
  }

  /**
   * GET /api/v1/first-tech-test-result/result-codes/{testId}?antigenFlag={optional}
   * Gets valid result codes for a specific test
   *
   * Oracle Forms LOV: UNIT_TEST_B_TEMP_RESULT_LOV2 (Record Group: UNIT_TEST_B_TEMP_RESULT_LOV2)
   * Display Columns: RESULT_STATUS, CODE_DESC
   * Return Columns: RESULT_STATUS → TEMP_RESULT_1, CODE_DESC → S_RESULT_CODE_DESC_1
   *
   * Context-Sensitive Behavior:
   * - If antigenFlag = 'Y': Returns results with plate_seq = 'I' (Initial/Antigen plate)
   * - If antigenFlag = 'N': Returns results with plate_seq = 'R' (Regular plate)
   *
   * Filters:
   * - Excludes auto-only results (auto_only != 'Y') - manual entry only
   * - Filtered by test_id
   * - Only shows currently effective codes (active date range check on both tables)
   * - code_type = 'RESUL'
   */
  getResultCodes(testId: string, antigenFlag?: string): Observable<ReturnResult<{ resultCode: string; resultDesc: string }[]>> {
    let httpParams = new HttpParams();

    if (antigenFlag) {
      httpParams = httpParams.set('antigenFlag', antigenFlag);
    }

    return this.apiService.get<ReturnResult<{ resultCode: string; resultDesc: string }[]>>(
      API.LABORATORY_FUNCTIONS.FIRST_TECH_TEST_RESULT.RESULT_CODES(testId),
      { params: httpParams }
    );
  }

  /**
   * POST /api/v1/first-tech-test-result/save
   * Saves/commits test results with full FMB COMMIT_PROC business logic
   */
  saveResults(request: SaveResultsRequest): Observable<SaveResultsResponse> {
    return this.apiService.post<SaveResultsResponse>(
      `${API.LABORATORY_FUNCTIONS.FIRST_TECH_TEST_RESULT.BASE}/save`,
      request,
      { context: new HttpContext().set(SKIP_ERROR_TOAST, true) }
    );
  }

  /**
   * GET /api/v1/first-tech-test-result/validate-unit/{unitId}
   * Validates a unit ID and returns unit details with contract/chapter validation
   */
  validateUnit(unitId: string): Observable<UnitValidationResponse> {
    return this.apiService.get<UnitValidationResponse>(
      `${API.LABORATORY_FUNCTIONS.FIRST_TECH_TEST_RESULT.BASE}/validate-unit/${unitId}`,
      { context: new HttpContext().set(SKIP_ERROR_TOAST, true) }
    );
  }

  /**
   * GET /api/v1/first-tech-test-result/validate-batch/{tbId}
   * Validates a test batch ID has pending results
   */
  validateBatch(tbId: string): Observable<ReturnResult<void>> {
    return this.apiService.get<ReturnResult<void>>(
      `${API.LABORATORY_FUNCTIONS.FIRST_TECH_TEST_RESULT.BASE}/validate-batch/${tbId}`,
      { context: new HttpContext().set(SKIP_ERROR_TOAST, true) }
    );
  }
}
