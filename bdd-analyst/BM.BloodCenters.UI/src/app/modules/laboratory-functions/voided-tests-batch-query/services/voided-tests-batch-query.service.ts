import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { ApiService } from '../../../../shared/services/api.service';
import { API } from '../../../../core/constants/api.constants';
import {
  BatchIdLookupDto,
  TestIdLookupDto,
  VoidedTestSearchDto,
  VoidedTestResultDto,
  VoidedTestsApiResponse,
} from '../models/voided-tests-batch-query.model';

@Injectable({ providedIn: 'root' })
export class VoidedTestsBatchQueryService {
  private readonly apiService = inject(ApiService);

  getBatchIds(): Observable<BatchIdLookupDto[]> {
    return this.apiService
      .get<VoidedTestsApiResponse<BatchIdLookupDto>>(API.VOIDED_TESTS_BATCH_QUERY.BATCH_IDS)
      .pipe(
        map((response) => response?.data || []),
        catchError((error) => throwError(() => error))
      );
  }

  getTestIds(tbId: string): Observable<TestIdLookupDto[]> {
    return this.apiService
      .get<VoidedTestsApiResponse<TestIdLookupDto>>(API.VOIDED_TESTS_BATCH_QUERY.TEST_IDS(tbId))
      .pipe(
        map((response) => response?.data || []),
        catchError((error) => throwError(() => error))
      );
  }

  search(dto: VoidedTestSearchDto): Observable<VoidedTestResultDto[]> {
    return this.apiService
      .post<VoidedTestsApiResponse<VoidedTestResultDto>>(API.VOIDED_TESTS_BATCH_QUERY.SEARCH, dto)
      .pipe(
        map((response) => response?.data || []),
        catchError((error) => throwError(() => error))
      );
  }
}
