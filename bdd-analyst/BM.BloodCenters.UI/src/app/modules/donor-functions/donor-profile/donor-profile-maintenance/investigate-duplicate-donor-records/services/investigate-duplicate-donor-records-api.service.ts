import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError, timeout } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';
import {
  InvestigateBatch,
  InvestigateBatchDetails,
  InvestigateDonor,
  DuplicateSetQuery,
  DuplicateSet,
  UpdateReviewRequest,
  UpdateMergeFlagRequest,
  UpdateSetStatusRequest,
  ResolveSetResult,
  StatusCode,
  ReturnResult,
  BatchStatus,
  EMPTY_REVIEW_CATEGORY,
  EMPTY_MATCH_FLAGS
} from '../models/investigate-duplicate-donor-records.model';

@Injectable({
  providedIn: 'root'
})
export class InvestigateDuplicateDonorRecordsApiService {
  private readonly apiService = inject(ApiService);
  private readonly endpoints = API.DONOR_FUNCTIONS.INVESTIGATE_DUPLICATE_DONOR;

  private extractErrorMessage(error: any, fallback: string): string {
    return error?.error?.errorResponse?.error
      || error?.error?.message
      || fallback;
  }

  getDuplicateSets(query: DuplicateSetQuery): Observable<InvestigateBatch[]> {
    return this.apiService.post<ReturnResult<DuplicateSet>>(this.endpoints.GET_SETS, query).pipe(
      timeout(30000),
      map(response => this.transformSets(response.data || [])),
      catchError(error => {
        let displayMessage = 'Failed to load batches';
        if (error?.name === 'TimeoutError') {
          displayMessage = 'Request timed out. Please check if the backend server is running.';
        } else if (error?.status === 0) {
          displayMessage = 'Cannot connect to server. Please check if the backend is running and CORS is configured.';
        } else {
          displayMessage = this.extractErrorMessage(error, 'Failed to load batches');
        }

        return throwError(() => ({
          ...error,
          displayMessage
        }));
      })
    );
  }

  private transformSets(sets: DuplicateSet[]): InvestigateBatch[] {
    return sets.map(set => ({
      batchId: set.setId || '',
      setStatusCode: (set.setStatusCode || 'PENDG') as BatchStatus,
      foundOn: set.insertDate || '',
      source: set.source || '',
      programId: set.programId || '',
      duplicateCount: set.duplicateCount || 0,
      reviewProgress: set.reviewProgress || {
        demographics: 0,
        keydata: 0,
        interdictions: 0,
        donations: 0,
        attributes: 0
      }
    }));
  }

  getPotentialDuplicates(setId: string): Observable<InvestigateBatchDetails> {
    const endpoint = this.endpoints.GET_POTENTIAL_DUPLICATES(setId);

    return this.apiService.get<{ success: boolean; message: string; statusCode: number; data: any[] }>(endpoint, {}).pipe(
      timeout(30000),
      map(response => this.transformBatchDetails(setId, response.data || [])),
      catchError(error => {
        return throwError(() => ({
          ...error,
          displayMessage: this.extractErrorMessage(error, 'Failed to load batch details')
        }));
      })
    );
  }

  private transformBatchDetails(setId: string, records: any[]): InvestigateBatchDetails {
    if (records.length === 0) {
      return {
        batch: {
          batchId: setId,
          setStatusCode: 'PENDG',
          foundOn: '',
          source: '',
          programId: '',
          duplicateCount: 0,
          reviewProgress: { demographics: 0, keydata: 0, interdictions: 0, donations: 0, attributes: 0 }
        },
        donors: []
      };
    }

    const firstRecord = records[0];

    const batch: InvestigateBatch = {
      batchId: setId,
      setStatusCode: (firstRecord.setStatusCode || 'PENDG') as BatchStatus,
      foundOn: firstRecord.insertDate || '',
      source: firstRecord.source || '',
      programId: firstRecord.programId || '',
      duplicateCount: records.length,
      reviewProgress: firstRecord.reviewProgress || { demographics: 0, keydata: 0, interdictions: 0, donations: 0, attributes: 0 }
    };

    const donors: InvestigateDonor[] = records.map((r: any) => this.transformDonor(r));

    return { batch, donors };
  }

  private transformDonor(record: any): InvestigateDonor {
    return {
      donorId: record.donorId || '',
      setId: record.setId || '',
      setStatusCode: record.setStatusCode || '',
      mergeFlag: record.mergeFlag || '',
      name: record.donorName || '',
      dateOfBirth: record.dateOfBirth || '',
      gender: record.gender || '',
      address: record.address || null,
      altAddress: record.altAddress || null,
      workPhone: record.workPhone || null,
      homePhone: record.homePhone || null,
      demographics: record.demographics ?? { ...EMPTY_REVIEW_CATEGORY },
      keydata: record.keydata ?? { ...EMPTY_REVIEW_CATEGORY },
      interdictions: record.interdictions ?? { ...EMPTY_REVIEW_CATEGORY },
      donations: record.donations ?? { ...EMPTY_REVIEW_CATEGORY },
      attributes: record.attributes ?? { ...EMPTY_REVIEW_CATEGORY },
      matchFlags: record.matchFlags ?? { ...EMPTY_MATCH_FLAGS },
      resolveUser: record.resolveUser || null,
      resolveUserName: record.resolveUserName || null,
      resolveDate: record.resolveDate || null,
      programId: record.programId || '',
      chapterId: record.chapterId || ''
    };
  }

  updateReviewCategory(setId: string, donorId: string, request: UpdateReviewRequest): Observable<ReturnResult<any>> {
    const endpoint = this.endpoints.UPDATE_REVIEW(setId, donorId);

    return this.apiService.put<ReturnResult<any>>(endpoint, request).pipe(
      catchError(error => {
        return throwError(() => ({
          ...error,
          displayMessage: this.extractErrorMessage(error, 'Failed to update review status')
        }));
      })
    );
  }

  updateMergeFlag(setId: string, donorId: string, request: UpdateMergeFlagRequest): Observable<ReturnResult<any>> {
    const endpoint = this.endpoints.UPDATE_MERGE_FLAG(setId, donorId);

    return this.apiService.put<ReturnResult<any>>(endpoint, request).pipe(
      catchError(error => {
        return throwError(() => ({
          ...error,
          displayMessage: this.extractErrorMessage(error, 'Failed to update merge flag')
        }));
      })
    );
  }

  updateSetStatus(setId: string, request: UpdateSetStatusRequest): Observable<ReturnResult<any>> {
    const endpoint = this.endpoints.UPDATE_STATUS(setId);

    return this.apiService.put<ReturnResult<any>>(endpoint, request).pipe(
      catchError(error => {
        return throwError(() => ({
          ...error,
          displayMessage: this.extractErrorMessage(error, 'Failed to update set status')
        }));
      })
    );
  }

  resolveSet(setId: string): Observable<ReturnResult<ResolveSetResult>> {
    const endpoint = this.endpoints.RESOLVE(setId);

    return this.apiService.post<ReturnResult<ResolveSetResult>>(endpoint, {}).pipe(
      catchError(error => {
        return throwError(() => ({
          ...error,
          displayMessage: this.extractErrorMessage(error, 'Failed to resolve duplicate set')
        }));
      })
    );
  }

  getStatusCodes(): Observable<StatusCode[]> {
    return this.apiService.get<{ success: boolean; message: string; statusCode: number; data: StatusCode[] }>(
      this.endpoints.STATUS_CODES, {}
    ).pipe(
      map(response => response.data || []),
      catchError(() => {
        return of([]);
      })
    );
  }

  createSet(): Observable<ReturnResult<{ setId: string }>> {
    return this.apiService.post<ReturnResult<{ setId: string }>>(this.endpoints.CREATE_SET, {}).pipe(
      catchError(error => {
        return throwError(() => ({
          ...error,
          displayMessage: this.extractErrorMessage(error, 'Failed to create new set')
        }));
      })
    );
  }

  addDonorToSet(setId: string, request: { donorId: string }): Observable<ReturnResult<any>> {
    const endpoint = this.endpoints.ADD_DONOR_TO_SET(setId);
    return this.apiService.post<ReturnResult<any>>(endpoint, request).pipe(
      catchError(error => {
        return throwError(() => ({
          ...error,
          displayMessage: this.extractErrorMessage(error, 'Failed to add donor to set')
        }));
      })
    );
  }
}
