import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { ApiService } from '@shared/services/api.service';
import { API } from '../../../../../../core/constants/api.constants';
import {
  CheckInBatchDto,
  CheckInBatchListResponse,
  CheckInBatchQueryParams,
  UpdateCheckInBatchRequest,
  BatchCommentDto,
  CreateBatchCommentRequest,
  UpdateBatchCommentRequest,
  CheckInBatchDropdownResponse,
} from '../models/modify-check-in-batch.model';

@Injectable({ providedIn: 'root' })
export class ModifyCheckInBatchApiService {
  private readonly apiService = inject(ApiService);

  /**
   * Get list of check-in batches with pagination and filtering
   */
  getCheckInBatches(
    take: number,
    skip: number,
    params: CheckInBatchQueryParams = {}
  ): Observable<CheckInBatchListResponse> {
    // TODO: Update with actual API endpoint when available
    const url = API.MODIFY_CHECK_IN_BATCH.LIST(take, skip);

    const queryParams = this.buildQueryParams(params);
    const fullUrl = queryParams ? `${url}?${queryParams}` : url;

    return this.apiService.get<CheckInBatchListResponse>(fullUrl).pipe(
      catchError((error) => {
        console.error('getCheckInBatches failed:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get single check-in batch by ID
   */
  getCheckInBatchById(batchId: string): Observable<CheckInBatchDto> {
    return this.apiService.get<CheckInBatchDto>(API.MODIFY_CHECK_IN_BATCH.GET_BY_ID(batchId)).pipe(
      catchError((error) => {
        console.error('getCheckInBatchById failed:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update check-in batch details
   */
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

  /**
   * Get dropdown options for filters and forms
   */
  getDropdownOptions(): Observable<CheckInBatchDropdownResponse> {
    return this.apiService.get<CheckInBatchDropdownResponse>(API.MODIFY_CHECK_IN_BATCH.DROPDOWN_OPTIONS).pipe(
      catchError((error) => {
        console.error('getDropdownOptions failed:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get comments for a batch
   */
  getBatchComments(batchId: string): Observable<BatchCommentDto[]> {
    return this.apiService.get<BatchCommentDto[]>(API.MODIFY_CHECK_IN_BATCH.COMMENTS.LIST(batchId)).pipe(
      catchError((error) => {
        console.error('getBatchComments failed:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Add comment to batch
   */
  createBatchComment(
    batchId: string,
    data: CreateBatchCommentRequest
  ): Observable<BatchCommentDto> {
    return this.apiService.post<BatchCommentDto>(
      API.MODIFY_CHECK_IN_BATCH.COMMENTS.CREATE(batchId),
      data
    ).pipe(
      catchError((error) => {
        console.error('createBatchComment failed:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update comment
   */
  updateBatchComment(
    batchId: string,
    commentId: string,
    data: UpdateBatchCommentRequest
  ): Observable<void> {
    return this.apiService.put<void>(
      API.MODIFY_CHECK_IN_BATCH.COMMENTS.UPDATE(batchId, commentId),
      data
    ).pipe(
      catchError((error) => {
        console.error('updateBatchComment failed:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Delete comment
   */
  deleteBatchComment(batchId: string, commentId: string): Observable<void> {
    return this.apiService.delete<void>(
      API.MODIFY_CHECK_IN_BATCH.COMMENTS.DELETE(batchId, commentId)
    ).pipe(
      catchError((error) => {
        console.error('deleteBatchComment failed:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Build query string from parameters
   */
  private buildQueryParams(params: CheckInBatchQueryParams): string {
    const queryParts: string[] = [];

    if (params.searchKeyword) queryParts.push(`searchKeyword=${encodeURIComponent(params.searchKeyword)}`);
    if (params.productType) queryParts.push(`productType=${encodeURIComponent(params.productType)}`);
    if (params.checkInUserId) queryParts.push(`checkInUserId=${encodeURIComponent(params.checkInUserId)}`);

    if (params.shippedDatePeriod && params.shippedDate) {
      queryParts.push(`shippedDatePeriod=${params.shippedDatePeriod}`);
      queryParts.push(`shippedDate=${params.shippedDate}`);
    }

    if (params.receivedDatePeriod && params.receivedDate) {
      queryParts.push(`receivedDatePeriod=${params.receivedDatePeriod}`);
      queryParts.push(`receivedDate=${params.receivedDate}`);
    }

    if (params.qcDatePeriod && params.qcDate) {
      queryParts.push(`qcDatePeriod=${params.qcDatePeriod}`);
      queryParts.push(`qcDate=${params.qcDate}`);
    }

    if (params.batchDatePeriod && params.batchDate) {
      queryParts.push(`batchDatePeriod=${params.batchDatePeriod}`);
      queryParts.push(`batchDate=${params.batchDate}`);
    }

    if (params.sortColumn) queryParts.push(`sortColumn=${encodeURIComponent(params.sortColumn)}`);
    if (params.sortOrder) queryParts.push(`sortOrder=${params.sortOrder}`);

    return queryParts.join('&');
  }
}
