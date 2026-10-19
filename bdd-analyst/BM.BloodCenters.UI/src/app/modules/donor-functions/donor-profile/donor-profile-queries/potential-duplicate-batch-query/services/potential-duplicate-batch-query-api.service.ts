import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, of, throwError, timeout } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { ApiService } from '@shared/services/api.service';
import {
  PotentialDuplicateBatch,
  BatchDetails,
  CheckDonorRequest,
  ResolveDuplicateRequest,
  BatchStatus,
  DuplicatePair,
  DuplicateDonor,
  LastNameOption,
  SetIdOption,
  UpdateSetStatusRequest,
  CreateSetRequest,
  EMPTY_REVIEW_CATEGORY,
  EMPTY_MATCH_FLAGS
} from '../models/potential-duplicate-batch-query.model';

@Injectable({
  providedIn: 'root'
})
export class PotentialDuplicateBatchQueryApiService {
  private readonly apiService = inject(ApiService);
  private readonly baseUrl = '/api/v1/potential-duplicate-query';

  /**
   * GET /potential-duplicate-query?setStatusCode=...
   */
  getBatches(status?: BatchStatus): Observable<PotentialDuplicateBatch[]> {
    const endpoint = this.baseUrl;

    let params = new HttpParams();
    if (status) {
      params = params.set('setStatusCode', status);
    }

    return this.apiService.get<{ data: any[] }>(endpoint, { params }).pipe(
      timeout(30000),
      map(response => this.groupIntoBatches(response.data || [])),
      catchError(error => {
        let displayMessage = 'Failed to load batches';
        if (error?.name === 'TimeoutError') {
          displayMessage = 'Request timed out. Please check if the backend server is running.';
        } else if (error?.status === 0) {
          displayMessage = 'Cannot connect to server. Please check if the backend is running and CORS is configured.';
        } else {
          displayMessage = error?.error?.message || 'Failed to load batches';
        }

        return throwError(() => ({
          ...error,
          displayMessage
        }));
      })
    );
  }

  private groupIntoBatches(records: any[]): PotentialDuplicateBatch[] {
    const batchMap = new Map<string, any[]>();

    records.forEach(record => {
      const setId = record.setId;
      if (!batchMap.has(setId)) {
        batchMap.set(setId, []);
      }
      batchMap.get(setId)!.push(record);
    });

    return Array.from(batchMap.entries()).map(([setId, records]) => {
      const firstRecord = records[0];
      const status = (firstRecord.setStatusCode || 'PENDG') as BatchStatus;
      return {
        batchId: setId,
        status,
        foundOn: firstRecord.insertDate || '',
        donorCount: records.length
      };
    });
  }

  /**
   * GET /potential-duplicate-query?setId={batchId}
   */
  getBatchDetails(batchId: string): Observable<BatchDetails> {
    const endpoint = this.baseUrl;
    const params = new HttpParams().set('setId', batchId);

    return this.apiService.get<{ data: any[] }>(endpoint, { params }).pipe(
      map(response => this.transformToBatchDetails(batchId, response.data || [])),
      catchError(error => {
        return throwError(() => ({
          ...error,
          displayMessage: error?.error?.message || 'Failed to load batch details'
        }));
      })
    );
  }

  private transformToBatchDetails(batchId: string, records: any[]): BatchDetails {
    if (records.length === 0) {
      return {
        batch: { batchId, status: 'PENDG', foundOn: '', donorCount: 0 },
        donors: [],
        duplicatePairs: [],
        totalPairs: 0
      };
    }

    const firstRecord = records[0];
    const batch: PotentialDuplicateBatch = {
      batchId,
      status: (firstRecord.setStatusCode || 'PENDG') as BatchStatus,
      foundOn: firstRecord.insertDate || '',
      donorCount: records.length
    };

    const donors: DuplicateDonor[] = records.map(r => this.transformToDonor(r));

    const pairs: DuplicatePair[] = [];
    const primaryRecords = records.filter(r => r.mergeFlag === 'PRIMR');
    const secondaryRecords = records.filter(r => r.mergeFlag === 'SECON');

    for (let i = 0; i < Math.min(primaryRecords.length, secondaryRecords.length); i++) {
      pairs.push({
        pairId: `${batchId}-${i + 1}`,
        batchId,
        primaryDonor: this.transformToDonor(primaryRecords[i]),
        secondaryDonor: this.transformToDonor(secondaryRecords[i])
      });
    }

    return {
      batch,
      donors,
      duplicatePairs: pairs,
      totalPairs: pairs.length
    };
  }

  private transformToDonor(record: any): DuplicateDonor {
    return {
      donorId: record.donorId || '',
      setId: record.setId || '',
      name: record.donorName || '',
      dateOfBirth: record.dateOfBirth || '',
      ssn: record.ssn || null,
      sex: record.gender || '',
      mergeFlag: record.mergeFlag || '',
      address: record.address || null,
      workPhone: record.workPhone || null,
      homePhone: record.homePhone || null,
      mobilePhone: record.mobilePhone || null,
      resolvedByUser: record.resolveUserName || null,
      resolvedByUserName: record.resolveUserName || null,
      dateResolved: record.resolveDate || null,
      programId: record.programId || '',
      chapterId: record.chapterId || null,
      transactionId: record.transactionId || null,
      comments: record.comments || null,
      insertDate: record.insertDate || null,
      insertUser: record.insertUser || null,
      demographics: record.demographics ?? { ...EMPTY_REVIEW_CATEGORY },
      keydata: record.keydata ?? { ...EMPTY_REVIEW_CATEGORY },
      interdictions: record.interdictions ?? { ...EMPTY_REVIEW_CATEGORY },
      donations: record.donations ?? { ...EMPTY_REVIEW_CATEGORY },
      attributes: record.attributes ?? { ...EMPTY_REVIEW_CATEGORY },
      matchFlags: record.matchFlags ?? { ...EMPTY_MATCH_FLAGS }
    };
  }

  /**
   * PUT /potential-duplicate-query/{setId}/{donorId}
   */
  checkDonor(request: CheckDonorRequest): Observable<{ success: boolean }> {
    const endpoint = `${this.baseUrl}/${request.batchId}/${request.donorId}`;

    const updateDto = {
      demographicsCheck: request.sectionsChecked.includes('demographics') ? 'Y' : 'N',
      keydataCheck: request.sectionsChecked.includes('keydata') ? 'Y' : 'N',
      interdictionsCheck: request.sectionsChecked.includes('interdictions') ? 'Y' : 'N',
      donationsCheck: request.sectionsChecked.includes('donations') ? 'Y' : 'N',
      attributesCheck: request.sectionsChecked.includes('attributes') ? 'Y' : 'N'
    };

    return this.apiService.put<{ success: boolean }>(endpoint, updateDto).pipe(
      catchError(error => {
        return throwError(() => ({
          ...error,
          displayMessage: error?.error?.message || 'Failed to check donor'
        }));
      })
    );
  }

  /**
   * PUT /potential-duplicate-query/{setId}/resolve
   */
  resolveDuplicate(request: ResolveDuplicateRequest): Observable<{ success: boolean }> {
    const endpoint = `${this.baseUrl}/${request.batchId}/resolve`;

    return this.apiService.put<{ success: boolean }>(endpoint, {}).pipe(
      catchError(error => {
        return throwError(() => ({
          ...error,
          displayMessage: error?.error?.message || 'Failed to resolve duplicate'
        }));
      })
    );
  }

  /**
   * GET /potential-duplicate-query/lovs/last-names?setStatusCode=...&filter=...
   */
  getLastNames(filter?: string, setStatusCode?: BatchStatus): Observable<LastNameOption[]> {
    const endpoint = `${this.baseUrl}/lovs/last-names`;

    let params = new HttpParams();
    if (filter) {
      params = params.set('filter', filter);
    }
    if (setStatusCode) {
      params = params.set('setStatusCode', setStatusCode);
    }

    return this.apiService.get<{ data: any[] }>(endpoint, { params }).pipe(
      map(response => {
        const data = response.data || [];
        return data.map((item: any) => ({
          lastName: item.lastName || item.LastName || '',
          setId: item.setId || '',
          foundOn: item.foundOn || null,
          setStatusCode: item.setStatusCode || '',
          source: item.source || null
        }));
      }),
      catchError(() => {
        return of([]);
      })
    );
  }

  /**
   * GET /potential-duplicate-query/lovs/set-ids?setStatusCode=...&filter=...
   */
  getSetIds(filter?: string, setStatusCode?: BatchStatus): Observable<SetIdOption[]> {
    const endpoint = `${this.baseUrl}/lovs/set-ids`;

    let params = new HttpParams();
    if (filter) {
      params = params.set('filter', filter);
    }
    if (setStatusCode) {
      params = params.set('setStatusCode', setStatusCode);
    }

    return this.apiService.get<{ data: any[] }>(endpoint, { params }).pipe(
      map(response => {
        const data = response.data || [];
        return data.map((item: any) => ({
          setId: item.setId || '',
          setStatusCode: item.setStatusCode || null,
          insertDate: item.insertDate || null,
          donorCount: item.donorCount || 0,
          source: item.source || null
        }));
      }),
      catchError(() => {
        return of([]);
      })
    );
  }

  /**
   * GET /potential-duplicate-query/merge-statuses?setId=...&donorId=...
   */
  getMergeStatuses(setId?: string, donorId?: string): Observable<Array<{ code: string; description: string }>> {
    const endpoint = `${this.baseUrl}/merge-statuses`;

    let params = new HttpParams();
    if (setId) {
      params = params.set('setId', setId);
    }
    if (donorId) {
      params = params.set('donorId', donorId);
    }

    return this.apiService.get<{ data: any[] }>(endpoint, { params }).pipe(
      map(response => response.data || []),
      catchError(() => {
        return of([]);
      })
    );
  }

  /**
   * PUT /potential-duplicate-query/{setId}/status
   */
  updateSetStatus(setId: string, request: UpdateSetStatusRequest): Observable<{ success: boolean }> {
    const endpoint = `${this.baseUrl}/${setId}/status`;

    return this.apiService.put<{ success: boolean }>(endpoint, request).pipe(
      catchError(error => {
        return throwError(() => ({
          ...error,
          displayMessage: error?.error?.message || 'Failed to change set status'
        }));
      })
    );
  }

  /**
   * POST /potential-duplicate-query
   */
  createSet(request: CreateSetRequest): Observable<{ success: boolean; setId?: string }> {
    const endpoint = this.baseUrl;

    return this.apiService.post<{ success: boolean; setId?: string }>(endpoint, request).pipe(
      catchError(error => {
        return throwError(() => ({
          ...error,
          displayMessage: error?.error?.message || 'Failed to create duplicate set'
        }));
      })
    );
  }

  /**
   * PUT /potential-duplicate-query/{setId}/{donorId} — update merge flag
   */
  updateMergeFlag(setId: string, donorId: string, mergeFlag: string): Observable<{ success: boolean }> {
    const endpoint = `${this.baseUrl}/${setId}/${donorId}/merge-flag`;

    return this.apiService.put<{ success: boolean }>(endpoint, { mergeFlag }).pipe(
      catchError(error => {
        return throwError(() => ({
          ...error,
          displayMessage: error?.error?.message || 'Failed to update merge flag'
        }));
      })
    );
  }
}
