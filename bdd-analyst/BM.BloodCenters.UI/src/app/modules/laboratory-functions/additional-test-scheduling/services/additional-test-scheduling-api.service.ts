import { Injectable, inject } from '@angular/core';
import { Observable, map, catchError, throwError } from 'rxjs';
import { HttpContext } from '@angular/common/http';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import { SKIP_ERROR_TOAST } from 'src/app/core/constants/http-context.constants';
import {
  ValidTestDto,
  TestGroupDto,
  SampleTypeDto,
  ValidateUnitResponseDto,
  ExistingTestsRequestDto,
  ExistingTestDto,
  ScheduleTestRequestDto,
  ScheduleTestResponseDto,
  TestSchedulingQueryDto,
  ApiResponse,
  MasterCodeDto,
  SccStatusResponseDto,
  SccSampleTypeRequestDto,
  SccOverrideRequestDto,
  SccUpdateResponseDto
} from '../models/additional-test-scheduling.model';

@Injectable({
  providedIn: 'root'
})
export class AdditionalTestSchedulingApiService {
  private readonly apiService = inject(ApiService);

  getValidTests(
    take: number,
    skip: number,
    queryDto: TestSchedulingQueryDto = {}
  ): Observable<{ data: ValidTestDto[]; totalCount: number }> {
    const url = API.ADDITIONAL_TEST_SCHEDULING.GET_TESTS(take, skip);
    const body = {
      searchKeyword: queryDto.searchKeyword || null,
      testGroup: queryDto.testGroup || null,
      sampleType: queryDto.sampleType || null,
      sortColumn: queryDto.sortColumn || null,
      sortOrder: queryDto.sortOrder || null,
      screenMode: queryDto.screenMode || 'CNFRM'
    };
    return this.apiService
      .post<ApiResponse<ValidTestDto[]>>(url, body)
      .pipe(
        map((response) => ({
          data: response.data || [],
          totalCount: response.totalCount || 0
        })),
        catchError(this.handleError)
      );
  }

  getTestById(testId: string): Observable<ValidTestDto> {
    return this.apiService
      .get<ApiResponse<ValidTestDto>>(API.ADDITIONAL_TEST_SCHEDULING.GET_TEST_BY_ID(testId))
      .pipe(
        map((response) => {
          if (!response.data) throw new Error('Test not found');
          return response.data;
        }),
        catchError(this.handleError)
      );
  }

  getTestGroups(screenMode: 'DTL' | 'CNFRM' = 'CNFRM'): Observable<TestGroupDto[]> {
    return this.apiService
      .get<ApiResponse<TestGroupDto[]>>(API.ADDITIONAL_TEST_SCHEDULING.GET_TEST_GROUPS(screenMode))
      .pipe(
        map((response) => response.data || []),
        catchError(this.handleError)
      );
  }

  getSampleTypes(): Observable<SampleTypeDto[]> {
    return this.apiService
      .get<ApiResponse<SampleTypeDto[]>>(API.ADDITIONAL_TEST_SCHEDULING.GET_SAMPLE_TYPES)
      .pipe(
        map((response) => response.data || []),
        catchError(this.handleError)
      );
  }

  getMasterCodes(codeType: string, chapterId?: string): Observable<MasterCodeDto[]> {
    return this.apiService
      .get<ApiResponse<MasterCodeDto[]>>(API.ADDITIONAL_TEST_SCHEDULING.GET_MASTER_CODES(codeType, chapterId))
      .pipe(
        map((response) => response.data || []),
        catchError(this.handleError)
      );
  }

  validateUnit(unitId: string): Observable<ValidateUnitResponseDto> {
    const context = new HttpContext().set(SKIP_ERROR_TOAST, true);
    return this.apiService
      .post<ApiResponse<ValidateUnitResponseDto>>(
        API.ADDITIONAL_TEST_SCHEDULING.VALIDATE_UNIT,
        { unitId },
        { context }
      )
      .pipe(
        map((response) => {
          if (!response.success || !response.data) {
            throw { message: response.message, status: response.statusCode, errorCode: response.errorCode };
          }
          return response.data;
        }),
        catchError((error) => throwError(() => error))
      );
  }

  getExistingTests(unitId: string, chapterId: string, testIds: string[]): Observable<ExistingTestDto[]> {
    const body: ExistingTestsRequestDto = { unitId, chapterId, testIds };
    const context = new HttpContext().set(SKIP_ERROR_TOAST, true);
    return this.apiService
      .post<ApiResponse<ExistingTestDto[]>>(
        API.ADDITIONAL_TEST_SCHEDULING.GET_EXISTING_TESTS,
        body,
        { context }
      )
      .pipe(
        map((response) => response.data || []),
        catchError(this.handleError)
      );
  }

  scheduleTest(
    unitId: string,
    chapterId: string,
    testId: string,
    testBatchId?: string | null
  ): Observable<ScheduleTestResponseDto> {
    const body: ScheduleTestRequestDto = { unitId, chapterId, testId, testBatchId };
    const context = new HttpContext().set(SKIP_ERROR_TOAST, true);
    return this.apiService
      .post<ApiResponse<ScheduleTestResponseDto[]>>(
        API.ADDITIONAL_TEST_SCHEDULING.SCHEDULE,
        body,
        { context }
      )
      .pipe(
        map((response) => {
          if (!response.success) {
            throw { message: response.message, status: response.statusCode };
          }
          return response.data?.[0] ?? { scheduled: false, message: response.message };
        }),
        catchError((error) => throwError(() => error))
      );
  }

  getSccStatus(unitId: string, chapterId: string): Observable<SccStatusResponseDto> {
    const context = new HttpContext().set(SKIP_ERROR_TOAST, true);
    return this.apiService
      .post<ApiResponse<SccStatusResponseDto>>(
        API.ADDITIONAL_TEST_SCHEDULING.SCC_STATUS,
        { unitId, chapterId },
        { context }
      )
      .pipe(
        map((response) => response.data || { sccRecords: [] }),
        catchError(this.handleError)
      );
  }

  updateSccSampleType(dto: SccSampleTypeRequestDto): Observable<SccUpdateResponseDto> {
    const context = new HttpContext().set(SKIP_ERROR_TOAST, true);
    return this.apiService
      .post<ApiResponse<SccUpdateResponseDto>>(
        API.ADDITIONAL_TEST_SCHEDULING.SCC_SAMPLE_TYPE,
        dto,
        { context }
      )
      .pipe(
        map((response) => response.data || { success: false, message: response.message }),
        catchError(this.handleError)
      );
  }

  submitSccOverride(dto: SccOverrideRequestDto): Observable<SccUpdateResponseDto> {
    const context = new HttpContext().set(SKIP_ERROR_TOAST, true);
    return this.apiService
      .post<ApiResponse<SccUpdateResponseDto>>(
        API.ADDITIONAL_TEST_SCHEDULING.SCC_OVERRIDE,
        dto,
        { context }
      )
      .pipe(
        map((response) => response.data || { success: false, message: response.message }),
        catchError((error) => throwError(() => error))
      );
  }

  private handleError(error: any): Observable<never> {
    const message = error?.error?.message || error?.message || 'An unknown error occurred';
    return throwError(() => new Error(message));
  }
}
