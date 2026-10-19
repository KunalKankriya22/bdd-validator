import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { ApiService } from '@shared/services/api.service';
import { API } from '../../../../core/constants/api.constants';
import {
  CheckInBatchDto,
  CheckInBatchQueryParams,
  UpdateCheckInBatchRequest,
  BatchCommentDto,
  BatchCommentApiResponse,
  BatchCommentSingleApiResponse,
  CreateBatchCommentRequest,
  UpdateBatchCommentRequest,
  ProductTypeOption,
  CheckInUserOption,
  ReturnResult,
} from '../models/modify-check-in-batch.model';

@Injectable({ providedIn: 'root' })
export class ModifyCheckInBatchApiService {
  private readonly apiService = inject(ApiService);

  getCheckInBatches(
    take: number,
    skip: number,
    params: CheckInBatchQueryParams = {}
  ): Observable<{ data: CheckInBatchDto[]; total: number }> {
    return this.apiService
      .post<ReturnResult<CheckInBatchDto>>(
        API.CHECK_IN_BATCH_DATA.LIST(take, skip),
        params
      )
      .pipe(
        map((res) => ({
          data: res.data ?? [],
          total: res.total ?? 0,
        })),
        catchError((error) => {
          console.error('getCheckInBatches failed:', error);
          return throwError(() => error);
        })
      );
  }

  getProductTypes(): Observable<ProductTypeOption[]> {
    return this.apiService
      .get<ReturnResult<ProductTypeOption>>(API.CHECK_IN_BATCH_DATA.PRODUCT_TYPES)
      .pipe(
        map((res) => res.data ?? []),
        catchError((error) => {
          console.error('getProductTypes failed:', error);
          return throwError(() => error);
        })
      );
  }

  getProductTypeFilters(): Observable<ProductTypeOption[]> {
    return this.apiService
      .get<ReturnResult<ProductTypeOption>>(API.CHECK_IN_BATCH_DATA.PRODUCT_TYPE_FILTERS)
      .pipe(
        map((res) => res.data ?? []),
        catchError((error) => {
          console.error('getProductTypeFilters failed:', error);
          return throwError(() => error);
        })
      );
  }

  getCheckinUsers(): Observable<CheckInUserOption[]> {
    return this.apiService
      .get<ReturnResult<CheckInUserOption>>(API.CHECK_IN_BATCH_DATA.CHECKIN_USERS)
      .pipe(
        map((res) => res.data ?? []),
        catchError((error) => {
          console.error('getCheckinUsers failed:', error);
          return throwError(() => error);
        })
      );
  }

  // TODO: Implement when backend update endpoint is available
  updateCheckInBatch(
    batchId: string,
    data: UpdateCheckInBatchRequest
  ): Observable<void> {
    return this.apiService.put<void>(API.MODIFY_CHECK_IN_BATCH.UPDATE(batchId), data).pipe(
      catchError((error) => {
        console.error('updateCheckInBatch failed:', error);
        return throwError(() => error);
      })
    );
  }

  getBatchComments(batchId: string): Observable<BatchCommentDto[]> {
    return this.apiService.get<BatchCommentApiResponse>(
      API.MODIFY_CHECK_IN_BATCH.COMMENTS.LIST(batchId)
    ).pipe(
      map((res) => res.data ?? []),
      catchError((error) => {
        console.error('getBatchComments failed:', error);
        return throwError(() => error);
      })
    );
  }

  createBatchComment(
    batchId: string,
    data: CreateBatchCommentRequest
  ): Observable<BatchCommentDto> {
    return this.apiService.post<BatchCommentSingleApiResponse>(
      API.MODIFY_CHECK_IN_BATCH.COMMENTS.CREATE(batchId),
      data
    ).pipe(
      map((res) => res.data),
      catchError((error) => {
        console.error('createBatchComment failed:', error);
        return throwError(() => error);
      })
    );
  }

  updateBatchComment(
    batchId: string,
    auditKey: string,
    data: UpdateBatchCommentRequest
  ): Observable<void> {
    return this.apiService.put<void>(
      API.MODIFY_CHECK_IN_BATCH.COMMENTS.UPDATE(batchId, auditKey),
      data
    ).pipe(
      catchError((error) => {
        console.error('updateBatchComment failed:', error);
        return throwError(() => error);
      })
    );
  }

  deleteBatchComment(batchId: string, auditKey: string): Observable<void> {
    return this.apiService.delete<void>(
      API.MODIFY_CHECK_IN_BATCH.COMMENTS.DELETE(batchId, auditKey)
    ).pipe(
      catchError((error) => {
        console.error('deleteBatchComment failed:', error);
        return throwError(() => error);
      })
    );
  }
}
