import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { ApiService } from '../../../../shared/services/api.service';
import { API } from '../../../../core/constants/api.constants';
import {
  VoidedTestSearchDto,
  VoidedTestListDto,
  VoidedUnitLovDto,
  VerifyUnitResponseDto,
} from '../models/voided-tests-by-unit-id-query.model';

interface ReturnResultResponse<T> {
  success?: boolean;
  message?: string;
  statusCode?: number;
  data?: T[];
  item?: T;
  total?: number;
}

@Injectable({
  providedIn: 'root',
})
export class VoidedTestsByUnitIdQueryService {
  private readonly apiService = inject(ApiService);

  verifyUnit(
    unitId: string
  ): Observable<ReturnResultResponse<VerifyUnitResponseDto>> {
    return this.apiService
      .post<ReturnResultResponse<VerifyUnitResponseDto>>(
        API.TEST_VOID_BY_UNIT_ID.VERIFY_UNIT,
        { unitId }
      )
      .pipe(catchError((error) => throwError(() => error)));
  }

  getVoidedTests(
    take: number,
    skip: number,
    params: VoidedTestSearchDto
  ): Observable<{ data: VoidedTestListDto[]; total: number }> {
    const endpoint = API.TEST_VOID_BY_UNIT_ID.GET_LIST(take, skip);

    return this.apiService
      .post<ReturnResultResponse<VoidedTestListDto>>(endpoint, params)
      .pipe(
        map((response) => ({
          data: response?.data || [],
          total: response?.total || 0,
        })),
        catchError((error) => throwError(() => error))
      );
  }

  getVoidedUnitsLov(): Observable<VoidedUnitLovDto[]> {
    return this.apiService
      .get<ReturnResultResponse<VoidedUnitLovDto>>(
        API.TEST_VOID_BY_UNIT_ID.VOIDED_UNITS
      )
      .pipe(
        map((response) => response?.data || []),
        catchError((error) => throwError(() => error))
      );
  }
}
