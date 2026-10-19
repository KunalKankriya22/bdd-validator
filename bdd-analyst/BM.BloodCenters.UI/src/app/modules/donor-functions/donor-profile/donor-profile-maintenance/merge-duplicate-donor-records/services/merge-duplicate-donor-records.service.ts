import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  BatchLookupModel,
  BatchSearchDto,
  BatchRetrieveResponseModel,
  MergeDonorRequest,
  ResolveDonorRequest,
  MergeDonorResultModel,
  MergePreviewRequest,
  MergePreviewResponse,
  ReturnResult
} from '../models/merge-duplicate-donor-records.model';

@Injectable({
  providedIn: 'root'
})
export class MergeDuplicateDonorRecordsService {
  private readonly apiService = inject(ApiService);

  /**
   * Search duplicate sets for dropdown LOV
   * POST /api/v1/donor-merge/duplicate-sets/{take}/{skip}
   */
  searchBatchesLov(
    take: number,
    skip: number,
    params: BatchSearchDto
  ): Observable<{ data: BatchLookupModel[]; total: number }> {
    const endpoint = API.DONOR_PROFILE.MERGE_DUPLICATE_DONORS.DUPLICATE_SETS(take, skip);

    return this.apiService.post<ReturnResult<BatchLookupModel>>(endpoint, params).pipe(
      map(response => ({
        data: response?.data || [],
        total: response?.total || 0
      })),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Retrieve merge set with donors and investigation status
   * GET /api/merge-sets/{setId}
   */
  retrieveBatch(params: BatchSearchDto): Observable<BatchRetrieveResponseModel | null> {
    const setId = params.setId || '';
    const endpoint = API.DONOR_PROFILE.MERGE_DUPLICATE_DONORS.GET_SET(setId);

    return this.apiService.get<ReturnResult<BatchRetrieveResponseModel>>(endpoint).pipe(
      map(response => response?.item || response?.data?.[0] || null),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Preview merge of two donors
   * POST /api/v1/donor-merge/preview
   */
  previewMerge(request: MergePreviewRequest): Observable<ReturnResult<MergePreviewResponse>> {
    const endpoint = API.DONOR_PROFILE.MERGE_DUPLICATE_DONORS.PREVIEW;

    return this.apiService.post<ReturnResult<MergePreviewResponse>>(endpoint, request).pipe(
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Merge duplicate donors
   * POST /api/v1/donor-merge/merge
   */
  mergeDonors(request: MergeDonorRequest): Observable<ReturnResult<MergeDonorResultModel>> {
    const endpoint = API.DONOR_PROFILE.MERGE_DUPLICATE_DONORS.MERGE;

    return this.apiService.post<ReturnResult<MergeDonorResultModel>>(endpoint, request).pipe(
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Resolve duplicate donors
   * POST /api/v1/donor-merge/resolve
   */
  resolveDonors(request: ResolveDonorRequest): Observable<ReturnResult<any>> {
    const endpoint = API.DONOR_PROFILE.MERGE_DUPLICATE_DONORS.RESOLVE;

    return this.apiService.post<ReturnResult<any>>(endpoint, request).pipe(
      catchError(error => throwError(() => error))
    );
  }
}