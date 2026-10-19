import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { HeaderService } from '@shared/services/header.service';
import { LoginService } from '@shared/services/login.service';
import { API } from '../../../../../../core/constants/api.constants';
import {
  SponsorLookup,
  SponsorDetails,
  SponsorDrive,
  DriveSearchRequest,
  SponsorDriveSearchResponse,
  SponsorDriveTotals,
  SponsorInstruction,
  ApiResponse
} from '../models/drives-by-sponsor-query.model';

@Injectable({
  providedIn: 'root'
})
export class DrivesBySponsorQueryService {
  private readonly apiService = inject(ApiService);
  private readonly headerService = inject(HeaderService);
  private readonly loginService = inject(LoginService);

  /**
   * Get sponsor details by ID
   */
  getSponsorDetails(sponsorId: string): Observable<SponsorDetails> {
    return this.apiService
      .get<ApiResponse<SponsorDetails>>(
        API.RECRUITMENT.SPONSOR_DRIVES.SPONSOR_DETAILS(sponsorId)
      )
      .pipe(
        map(response => response.item as SponsorDetails),
        catchError(error => {
          console.error('Error fetching sponsor details:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get sponsors for LOV dropdown
   */
  getSponsorsLookup(searchText?: string): Observable<SponsorLookup[]> {
    const chapterId = this.headerService.chapterId();
    let params = new HttpParams();

    if (chapterId) {
      params = params.set('chapterId', chapterId);
    }
    if (searchText) {
      params = params.set('searchText', searchText);
    }

    return this.apiService
      .get<ApiResponse<SponsorLookup>>(
        API.RECRUITMENT.SPONSOR_DRIVES.SPONSORS_LOOKUP,
        { params }
      )
      .pipe(
        map(response => response.data || []),
        catchError(error => {
          console.error('Error fetching sponsors:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Search sponsor drives with pagination
   * Returns totals for ALL records (calculated by backend)
   */
  searchSponsorDrives(
    take: number,
    skip: number,
    request: Partial<DriveSearchRequest>
  ): Observable<{ drives: SponsorDrive[]; total: number; totals: SponsorDriveTotals }> {
    const chapterId = this.headerService.chapterId();
    const userName = this.loginService.getStoredUsername();

    const requestBody: DriveSearchRequest = {
      sponsorId: request.sponsorId || '',
      status: request.status || 'CNFRM',
      fromDate: request.fromDate,
      toDate: request.toDate,
      sort: request.sort !== undefined ? request.sort : null,
      loggedInUserName: userName || '',
      chapterId: chapterId || ''
    };

    return this.apiService
      .post<ApiResponse<SponsorDriveSearchResponse>>(
        API.RECRUITMENT.SPONSOR_DRIVES.SEARCH(take, skip),
        requestBody
      )
      .pipe(
        map(response => {
          const item = response.item as SponsorDriveSearchResponse;
          return {
            drives: item?.drives || [],
            total: item?.totalRecords || response.total || 0,
            totals: {
              totalRecords: item?.totalRecords || 0,
              totalProjectedShow: item?.totalProjectedShow || 0,
              totalProjectedDraw: item?.totalProjectedDraw || 0,
              totalActualCredits: item?.totalActualCredits || 0,
              totalActualDraw: item?.totalActualDraw || 0,
              totalDeferralCount: item?.totalDeferralCount || 0,
              otherCredits: item?.otherCredits || 0,
              otherDraws: item?.otherDraws || 0
            }
          };
        })
      );
  }

  /**
   * Get sponsor instructions by sponsor ID
   */
  getSponsorInstructions(sponsorId: string): Observable<SponsorInstruction[]> {
    return this.apiService
      .get<ApiResponse<SponsorInstruction>>(
        API.RECRUITMENT.SPONSOR_DRIVES.SPONSOR_INSTRUCTIONS(sponsorId)
      )
      .pipe(
        map(response => response.data || []),
        catchError(error => {
          console.error('Error fetching sponsor instructions:', error);
          return of([]);
        })
      );
  }
}
