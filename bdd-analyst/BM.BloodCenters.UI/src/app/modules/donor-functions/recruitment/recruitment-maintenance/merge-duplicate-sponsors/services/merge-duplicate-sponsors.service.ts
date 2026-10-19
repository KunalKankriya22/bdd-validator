import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  SponsorLookupModel,
  SponsorSearchDto,
  DuplicateSponsorModel,
  SponsorDriveModel,
  MergeSponsorRequest,
  DuplicateSponsorMergeResultModel,
  ReturnResult
} from '../models/merge-duplicate-sponsors.model';

@Injectable({
  providedIn: 'root'
})
export class MergeDuplicateSponsorsService {
  private readonly apiService = inject(ApiService);

  /**
   * Search sponsors for dropdown LOV
   * POST /api/v1/duplicate-sponsor-merge/sponsors-lov/{take}/{skip}
   */
  searchSponsorsLov(
    take: number,
    skip: number,
    params: SponsorSearchDto
  ): Observable<{ data: SponsorLookupModel[]; total: number }> {
    const endpoint = API.RECRUITMENT.MERGE_DUPLICATE_SPONSORS.SPONSORS_LOV(take, skip);

    return this.apiService.post<ReturnResult<SponsorLookupModel>>(endpoint, params).pipe(
      map(response => ({
        data: response?.data || [],
        total: response?.total || 0
      })),
      catchError(error => {
        console.error('Error searching sponsors:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Retrieve duplicate sponsor details for comparison
   * POST /api/v1/duplicate-sponsor-merge/retrieve
   */
  retrieveSponsors(params: SponsorSearchDto): Observable<DuplicateSponsorModel[]> {
    const endpoint = API.RECRUITMENT.MERGE_DUPLICATE_SPONSORS.RETRIEVE;

    return this.apiService.post<ReturnResult<DuplicateSponsorModel>>(endpoint, params).pipe(
      map(response => response?.data || []),
      catchError(error => {
        console.error('Error retrieving sponsor details:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get drives for a specific sponsor
   * GET /api/v1/duplicate-sponsor-merge/drives/{sponsorId}
   */
  getSponsorDrives(sponsorId: string): Observable<SponsorDriveModel[]> {
    const endpoint = API.RECRUITMENT.MERGE_DUPLICATE_SPONSORS.DRIVES(sponsorId);

    return this.apiService.get<ReturnResult<SponsorDriveModel>>(endpoint).pipe(
      map(response => response?.data || []),
      catchError(error => {
        console.error('Error fetching sponsor drives:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Merge duplicate sponsors
   * POST /api/v1/duplicate-sponsor-merge/merge
   */
  mergeSponsors(request: MergeSponsorRequest): Observable<ReturnResult<DuplicateSponsorMergeResultModel>> {
    const endpoint = API.RECRUITMENT.MERGE_DUPLICATE_SPONSORS.MERGE;

    return this.apiService.post<ReturnResult<DuplicateSponsorMergeResultModel>>(endpoint, request).pipe(
      catchError(error => {
        console.error('Error merging sponsors:', error);
        return throwError(() => error);
      })
    );
  }
}
