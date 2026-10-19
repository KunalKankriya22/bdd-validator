import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  ApiResponseWrapper,
  TestIdOption,
  TestKitDetailDto,
  ReagentDetailDto,
  ReagentLovDto,
  TestGroupDto,
  CreateTestKitRequest,
  UpdateTestKitRequest,
} from '../models/reagent-kit-no-pre-qualification.model';

@Injectable({
  providedIn: 'root',
})
export class ReagentKitNoPreQualificationService {
  private readonly apiService = inject(ApiService);

  getValidTests(): Observable<TestIdOption[]> {
    return this.apiService
      .get<ApiResponseWrapper<any[]>>(API.REAGENT_KIT_NO_PRE_QUAL.GET_VALID_TESTS)
      .pipe(
        map((response) => {
          const items = response?.data || [];
          return items.map((item: any) => ({
            testId: item.testId,
            testDescription: item.testDescription || item.testDesc || '',
          }));
        }),
        catchError((error) => throwError(() => error))
      );
  }

  getTestKits(testId: string, showExpired: string): Observable<TestKitDetailDto[]> {
    const url = `${API.REAGENT_KIT_NO_PRE_QUAL.GET_TEST_KITS}?testId=${encodeURIComponent(testId)}&showExpired=${encodeURIComponent(showExpired)}`;
    return this.apiService
      .get<ApiResponseWrapper<TestKitDetailDto[]>>(url)
      .pipe(
        map((response) => response?.data || []),
        catchError((error) => throwError(() => error))
      );
  }

  getReagents(testKitId: string, testId: string): Observable<ReagentDetailDto[]> {
    const url = `${API.REAGENT_KIT_NO_PRE_QUAL.GET_REAGENTS(testKitId)}?testId=${encodeURIComponent(testId)}`;
    return this.apiService
      .get<ApiResponseWrapper<any[]>>(url)
      .pipe(
        map((response) => {
          const items = response?.data || [];
          return items.map((item: any) => ({
            reagentType: item.reagentType || '',
            reagentName: item.reagentName || item.reagentDescription || item.name || '',
            supplierCode: item.supplierCode || item.supplier || '',
            lotNumber: item.lotNumber || item.lotNo || '',
            expiryDate: item.expiryDate || item.expirationDate || null,
            reagentCode: item.reagentCode || '',
          }));
        }),
        catchError((error) => throwError(() => error))
      );
  }

  getReagentLov(testId: string, reagentType: string): Observable<ReagentLovDto[]> {
    const url = `${API.REAGENT_KIT_NO_PRE_QUAL.GET_REAGENT_LOV}?testId=${encodeURIComponent(testId)}&reagentType=${encodeURIComponent(reagentType)}`;
    return this.apiService
      .get<ApiResponseWrapper<ReagentLovDto[]>>(url)
      .pipe(
        map((response) => response?.data || []),
        catchError((error) => throwError(() => error))
      );
  }

  getTestGroup(testId: string): Observable<TestGroupDto> {
    return this.apiService
      .get<ApiResponseWrapper<TestGroupDto>>(API.REAGENT_KIT_NO_PRE_QUAL.GET_TEST_GROUP(testId))
      .pipe(
        map((response) => {
          const data = response?.data || (response as any)?.item;
          return data || { isAgMag: false };
        }),
        catchError((error) => throwError(() => error))
      );
  }

  createTestKit(request: CreateTestKitRequest): Observable<TestKitDetailDto> {
    return this.apiService
      .post<ApiResponseWrapper<TestKitDetailDto>>(API.REAGENT_KIT_NO_PRE_QUAL.CREATE_TEST_KIT, request)
      .pipe(
        map((response) => response?.data || (response as any)?.item),
        catchError((error) => throwError(() => error))
      );
  }

  updateTestKit(testKitId: string, request: UpdateTestKitRequest): Observable<ApiResponseWrapper<any>> {
    return this.apiService
      .put<ApiResponseWrapper<any>>(API.REAGENT_KIT_NO_PRE_QUAL.UPDATE_TEST_KIT(testKitId), request)
      .pipe(
        catchError((error) => throwError(() => error))
      );
  }
}
