import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { API } from '@core/constants/api.constants';
import {
  ApiResponse,
  TestBatchDto,
  CreateTestBatchRequestDto,
  UpdateTestBatchRequestDto,
  AddTestRequestDto,
  AddUnitRequestDto,
  TestKitDto,
  TestOptionDto,
  TestBatchOptionDto,
  LabCodeOptionDto,
} from './wks.models';

/**
 * Service for Test Batch/Worksheet operations
 * Mnemonic: WKS
 * Base URL: /api/v1/test-batch
 */
@Injectable({
  providedIn: 'root',
})
export class WksService {
  private readonly http = inject(HttpClient);

  /**
   * Retrieve a test batch by ID
   * GET /api/v1/test-batch/{tbId}
   */
  getTestBatch(tbId: string): Observable<TestBatchDto> {
    const url = `${environment.apiUrl}${API.TEST_BATCH.GET(tbId)}`;
    return this.http
      .get<ApiResponse<TestBatchDto>>(url)
      .pipe(
        map((response) => {
          // Handle both .data and .item response formats
          if (response.item) return response.item;
          if (Array.isArray(response.data)) return response.data[0];
          return response.data as TestBatchDto;
        })
      );
  }

  /**
   * Create a new test batch
   * POST /api/v1/test-batch
   */
  createTestBatch(request: CreateTestBatchRequestDto): Observable<TestBatchDto> {
    const url = `${environment.apiUrl}${API.TEST_BATCH.CREATE}`;
    return this.http
      .post<ApiResponse<TestBatchDto>>(url, request)
      .pipe(
        map((response) => {
          if (response.item) return response.item;
          if (Array.isArray(response.data)) return response.data[0];
          return response.data as TestBatchDto;
        })
      );
  }

  /**
   * Update an existing test batch
   * PUT /api/v1/test-batch/{tbId}
   */
  updateTestBatch(tbId: string, request: UpdateTestBatchRequestDto): Observable<TestBatchDto> {
    const url = `${environment.apiUrl}${API.TEST_BATCH.UPDATE(tbId)}`;
    return this.http
      .put<ApiResponse<TestBatchDto>>(url, request)
      .pipe(
        map((response) => {
          if (response.item) return response.item;
          if (Array.isArray(response.data)) return response.data[0];
          return response.data as TestBatchDto;
        })
      );
  }

  /**
   * Add a test to an existing batch
   * POST /api/v1/test-batch/{tbId}/tests
   */
  addTestToBatch(tbId: string, request: AddTestRequestDto): Observable<boolean> {
    const url = `${environment.apiUrl}${API.TEST_BATCH.ADD_TEST(tbId)}`;
    return this.http
      .post<ApiResponse<boolean>>(url, request)
      .pipe(
        map((response) => {
          if (response.item !== undefined) return response.item;
          if (Array.isArray(response.data)) return response.data[0];
          return response.data as boolean;
        })
      );
  }

  /**
   * Add a unit to an existing batch
   * POST /api/v1/test-batch/{tbId}/units
   */
  addUnitToBatch(tbId: string, request: AddUnitRequestDto): Observable<boolean> {
    const url = `${environment.apiUrl}${API.TEST_BATCH.ADD_UNIT(tbId)}`;
    return this.http
      .post<ApiResponse<boolean>>(url, request)
      .pipe(
        map((response) => {
          if (response.item !== undefined) return response.item;
          if (Array.isArray(response.data)) return response.data[0];
          return response.data as boolean;
        })
      );
  }

  /**
   * Remove a test from a batch
   * DELETE /api/v1/test-batch/{tbId}/tests/{testId}
   */
  removeTestFromBatch(tbId: string, testId: string): Observable<boolean> {
    const url = `${environment.apiUrl}${API.TEST_BATCH.REMOVE_TEST(tbId, testId)}`;
    return this.http
      .delete<ApiResponse<boolean>>(url)
      .pipe(map(() => true));
  }

  /**
   * Remove a unit from a batch
   * DELETE /api/v1/test-batch/{tbId}/units/{unitId}
   */
  removeUnitFromBatch(tbId: string, unitId: string): Observable<boolean> {
    const url = `${environment.apiUrl}${API.TEST_BATCH.REMOVE_UNIT(tbId, unitId)}`;
    return this.http
      .delete<ApiResponse<boolean>>(url)
      .pipe(map(() => true));
  }

  /**
   * Get available test batches (LOV)
   * This endpoint should be added to API constants if available
   */
  getTestBatches(): Observable<TestBatchOptionDto[]> {
    const url = `${environment.apiUrl}${API.TEST_BATCH.LIST}`;
    return this.http
      .get<ApiResponse<TestBatchOptionDto[]>>(url)
      .pipe(
        map((response) => (response.data as TestBatchOptionDto[]) ?? [])
      );
  }

  /**
   * Get available tests (LOV)
   */
  getAvailableTests(): Observable<TestOptionDto[]> {
    const url = `${environment.apiUrl}${API.TEST_BATCH.AVAILABLE_TESTS}`;
    return this.http
      .get<ApiResponse<TestOptionDto[]>>(url)
      .pipe(
        map((response) => (response.data as TestOptionDto[]) ?? [])
      );
  }

  /**
   * Get available test kits for a specific test
   */
  getTestKits(testId: string): Observable<TestKitDto[]> {
    const url = `${environment.apiUrl}${API.TEST_BATCH.TEST_KITS(testId)}`;
    return this.http
      .get<ApiResponse<TestKitDto[]>>(url)
      .pipe(
        map((response) => (response.data as TestKitDto[]) ?? [])
      );
  }

  /**
   * Get available lab codes (LOV)
   */
  getLabCodes(): Observable<LabCodeOptionDto[]> {
    const url = `${environment.apiUrl}${API.TEST_BATCH.LAB_CODES}`;
    return this.http
      .get<ApiResponse<LabCodeOptionDto[]>>(url)
      .pipe(
        map((response) => (response.data as LabCodeOptionDto[]) ?? [])
      );
  }
}
