import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { API } from '@core/constants/api.constants';
import {
  WorksheetDto,
  TestDto,
  TestBandDto,
  PendingUnitDto,
  VerifyResultsRequestDto,
  ApiResponse,
  BandResultLookupDto,
  ValidResultDto,
  TestTypeMetadataDto,
  CombinationResultDto,
  ValidateCombinationRequestDto,
  TestTypeDto,
  ControlValueDto,
  AdditionalBandDto,
  NoteResponseDto,
  CreateNoteRequestDto,
  CheckExistingResultDto,
  ClearVerificationRequestDto,
  SaveOtherBandsRequestDto,
} from '../models/verify-test-observations-tech2.model';

/**
 * API Service for Verify Test Observations: Tech 2
 * Handles all API calls for dual-technician test verification workflow
 *
 * Base URL: /api/v1/verify-test-observations-tech2
 * JIRA: MLT-12688
 * Form: TEIBNDR2
 */
@Injectable({ providedIn: 'root' })
export class VerifyTestObservationsTech2ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}${API.VERIFY_TEST_OBSERVATIONS_TECH2.BASE}`;

  /**
   * Get worksheets with pending units for Tech 2 verification
   * GET /verify-test-observations-tech2/worksheets
   *
   * @param testingLabCode - Testing laboratory code (e.g., "LAB01")
   * @returns Observable of worksheets array
   *
   * Error Codes:
   * - 400: Testing Lab Code is required
   */
  getWorksheets(): Observable<WorksheetDto[]> {
    const url = `${this.baseUrl}/worksheets`;

    return this.http.get<ApiResponse<WorksheetDto[]>>(url).pipe(
      map(response => response.data || [])
    );
  }

  /**
   * Get tests for a worksheet that have units pending Tech 2 verification
   * GET /verify-test-observations-tech2/tests/{tbId}
   *
   * @param tbId - Test Batch ID (Worksheet ID) - max 14 chars
   * @returns Observable of tests array
   *
   * Error Codes:
   * - 400: TB_ID is required
   */
  getTests(tbId: string): Observable<TestDto[]> {
    const url = `${this.baseUrl}/tests/${encodeURIComponent(tbId)}`;

    return this.http.get<ApiResponse<TestDto[]>>(url).pipe(
      map(response => response.data || [])
    );
  }

  /**
   * Get test bands for a specific test and type
   * These define the dynamic columns for result entry
   * GET /verify-test-observations-tech2/test-bands/{testId}/{testType}
   *
   * @param testId - Test identifier - max 10 chars
   * @param testType - Test type code - max 5 chars
   * @returns Observable of test bands array
   *
   * Error Codes:
   * - 400: Test ID is required
   */
  getTestBands(testId: string, testType: string): Observable<TestBandDto[]> {
    const url = `${this.baseUrl}/test-bands/${encodeURIComponent(testId)}/${encodeURIComponent(testType)}`;

    return this.http.get<ApiResponse<TestBandDto[]>>(url).pipe(
      map(response => response.data || [])
    );
  }

  /**
   * Get units pending Tech 2 verification for a specific test within a worksheet
   * GET /verify-test-observations-tech2/pending-units/{tbId}/{testId}
   *
   * @param tbId - Test Batch ID - max 14 chars
   * @param testId - Test identifier - max 10 chars
   * @returns Observable of pending units array
   *
   * Error Codes:
   * - 400: TB_ID is required
   */
  getPendingUnits(tbId: string, testId: string): Observable<PendingUnitDto[]> {
    const url = `${this.baseUrl}/pending-units/${encodeURIComponent(tbId)}/${encodeURIComponent(testId)}`;

    return this.http.get<ApiResponse<PendingUnitDto[]>>(url).pipe(
      map(response => response.data || [])
    );
  }

  /**
   * Verify (save) Tech 2 results for a unit
   * POST /verify-test-observations-tech2/verify
   *
   * @param request - Verify results request with band results
   * @returns Observable of success response
   *
   * Business Rules:
   * - Tech 2 user MUST be different from Tech 1 user
   * - At least one band result must be provided
   *
   * Error Codes:
   * - 400: Validation error (missing field, no band results, same technician)
   * - 404: No pending units (1233), Invalid test (5010), Already verified
   */
  verifyResults(request: VerifyResultsRequestDto): Observable<ApiResponse<void>> {
    const url = `${this.baseUrl}/verify`;
    return this.http.post<ApiResponse<void>>(url, request);
  }

  getBandResults(testId: string): Observable<BandResultLookupDto[]> {
    const url = `${this.baseUrl}/band-results/${encodeURIComponent(testId)}`;
    return this.http.get<ApiResponse<BandResultLookupDto[]>>(url).pipe(
      map(response => response.data || [])
    );
  }

  getValidResults(testId: string): Observable<ValidResultDto[]> {
    const url = `${this.baseUrl}/valid-results/${encodeURIComponent(testId)}`;
    return this.http.get<ApiResponse<ValidResultDto[]>>(url).pipe(
      map(response => response.data || [])
    );
  }

  getTestTypeMetadata(testId: string, testType: string): Observable<TestTypeMetadataDto> {
    const url = `${this.baseUrl}/test-type-metadata/${encodeURIComponent(testId)}/${encodeURIComponent(testType)}`;
    return this.http.get<ApiResponse<TestTypeMetadataDto>>(url).pipe(
      map(response => response.data!)
    );
  }

  validateCombination(request: ValidateCombinationRequestDto): Observable<CombinationResultDto> {
    const url = `${this.baseUrl}/validate-combination`;
    return this.http.post<ApiResponse<CombinationResultDto>>(url, request).pipe(
      map(response => response.data!)
    );
  }

  getTestTypes(testId: string): Observable<TestTypeDto[]> {
    const url = `${this.baseUrl}/test-types/${encodeURIComponent(testId)}`;
    return this.http.get<ApiResponse<TestTypeDto[]>>(url).pipe(
      map(response => response.data || [])
    );
  }

  getControlValues(testId: string): Observable<ControlValueDto[]> {
    const url = `${this.baseUrl}/control-values/${encodeURIComponent(testId)}`;
    return this.http.get<ApiResponse<ControlValueDto[]>>(url).pipe(
      map(response => response.data || [])
    );
  }

  getOtherBands(tbId: string, testId: string, unitId: string, tbSeqNo: number): Observable<AdditionalBandDto[]> {
    const url = `${this.baseUrl}/other-bands/${encodeURIComponent(tbId)}/${encodeURIComponent(testId)}/${encodeURIComponent(unitId)}`;
    const params = new HttpParams().set('tbSeqNo', tbSeqNo.toString());
    return this.http.get<ApiResponse<AdditionalBandDto[]>>(url, { params }).pipe(
      map(response => response.data || [])
    );
  }

  getNotes(tbId: string, testId: string, unitId: string, tbSeqNo: number): Observable<NoteResponseDto[]> {
    const url = `${this.baseUrl}/notes/${encodeURIComponent(tbId)}/${encodeURIComponent(testId)}/${encodeURIComponent(unitId)}`;
    const params = new HttpParams().set('tbSeqNo', tbSeqNo.toString());
    return this.http.get<ApiResponse<NoteResponseDto[]>>(url, { params }).pipe(
      map(response => response.data || [])
    );
  }

  createNote(request: CreateNoteRequestDto): Observable<number> {
    const url = `${this.baseUrl}/notes`;
    return this.http.post<ApiResponse<number>>(url, request).pipe(
      map(response => response.data!)
    );
  }

  updateNote(noteId: number, request: CreateNoteRequestDto): Observable<void> {
    const url = `${this.baseUrl}/notes/${noteId}`;
    return this.http.put<ApiResponse<void>>(url, request).pipe(
      map(() => undefined)
    );
  }

  deleteNote(noteId: number): Observable<void> {
    const url = `${this.baseUrl}/notes/${noteId}`;
    return this.http.delete<ApiResponse<void>>(url).pipe(
      map(() => undefined)
    );
  }

  checkExisting(tbId: string, testId: string, unitId: string, tbSeqNo: number): Observable<CheckExistingResultDto> {
    const url = `${this.baseUrl}/check-existing/${encodeURIComponent(tbId)}/${encodeURIComponent(testId)}/${encodeURIComponent(unitId)}`;
    const params = new HttpParams().set('tbSeqNo', tbSeqNo.toString());
    return this.http.get<ApiResponse<CheckExistingResultDto>>(url, { params }).pipe(
      map(response => response.data!)
    );
  }

  clearVerification(request: ClearVerificationRequestDto): Observable<ApiResponse<void>> {
    const url = `${this.baseUrl}/clear-verification`;
    return this.http.post<ApiResponse<void>>(url, request);
  }

  saveOtherBands(request: SaveOtherBandsRequestDto): Observable<ApiResponse<void>> {
    const url = `${this.baseUrl}/other-bands`;
    return this.http.post<ApiResponse<void>>(url, request);
  }

  deleteOtherBands(tbId: string, testId: string, unitId: string, tbSeqNo: number): Observable<void> {
    const url = `${this.baseUrl}/other-bands/${encodeURIComponent(tbId)}/${encodeURIComponent(testId)}/${encodeURIComponent(unitId)}/${tbSeqNo}`;
    return this.http.delete<ApiResponse<void>>(url).pipe(
      map(() => undefined)
    );
  }
}
