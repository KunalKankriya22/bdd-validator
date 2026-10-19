import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { HeaderService } from '@shared/services/header.service';
import { LoginService } from '@shared/services/login.service';
import { API } from '../../../../../../core/constants/api.constants';
import {
  ParentSponsorLookup,
  ParentSponsorInfo,
  ConstituentSponsor,
  ConstituentSponsorStatistics,
  ConstituentSponsorsResponse,
  ParentSponsorQueryRequest,
  ApiResponse
} from '../models/parent-sponsor-query.model';

@Injectable({
  providedIn: 'root'
})
export class ParentSponsorQueryService {
  private readonly apiService = inject(ApiService);
  private readonly headerService = inject(HeaderService);
  private readonly loginService = inject(LoginService);

  /**
   * Get parent sponsors for LOV dropdown
   */
  getParentSponsorsLookup(searchText?: string): Observable<ParentSponsorLookup[]> {
    const chapterId = this.headerService.chapterId();
    let params = new HttpParams();

    if (chapterId) {
      params = params.set('chapterId', chapterId);
    }
    if (searchText) {
      params = params.set('searchText', searchText);
    }

    return this.apiService
      .get<ApiResponse<ParentSponsorLookup>>(
        API.RECRUITMENT.PARENT_SPONSOR_QUERY.PARENT_SPONSORS_LOOKUP,
        { params }
      )
      .pipe(
        map(response => response.data || []),
        catchError(error => {
          console.error('Error fetching parent sponsors:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get parent sponsor info with address
   */
  getParentSponsorInfo(sponsorId: string): Observable<ParentSponsorInfo | null> {
    const chapterId = this.headerService.chapterId();
    let params = new HttpParams();

    if (chapterId) {
      params = params.set('chapterId', chapterId);
    }

    return this.apiService
      .get<ApiResponse<ParentSponsorInfo>>(
        API.RECRUITMENT.PARENT_SPONSOR_QUERY.PARENT_INFO(sponsorId),
        { params }
      )
      .pipe(
        map(response => response.item || null),
        catchError(error => {
          if (error.status === 404) {
            return of(null);
          }
          console.error('Error fetching parent sponsor info:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get constituent sponsors with optional statistics
   * Returns totals for ALL records (calculated by backend, not per-page)
   */
  getConstituentSponsors(
    take: number,
    skip: number,
    request: ParentSponsorQueryRequest
  ): Observable<ConstituentSponsorsResponse<ConstituentSponsor | ConstituentSponsorStatistics>> {
    const chapterId = this.headerService.chapterId();
    const userName = this.loginService.getStoredUsername();

    const requestBody: ParentSponsorQueryRequest = {
      ...request,
      chapterId: chapterId || undefined,
      loggedInUserName: userName || undefined
    };

    return this.apiService
      .post<ApiResponse<ConstituentSponsorsResponse<ConstituentSponsor | ConstituentSponsorStatistics>>>(
        API.RECRUITMENT.PARENT_SPONSOR_QUERY.CONSTITUENT_SPONSORS(take, skip),
        requestBody
      )
      .pipe(
        map(response => {
          const item = response.item as ConstituentSponsorsResponse<ConstituentSponsor | ConstituentSponsorStatistics>;
          return {
            data: item?.data || [],
            total: item?.total || response.total || 0,
            totals: item?.totals || undefined
          };
        }),
        catchError(error => {
          // 404 with success=true means no data found
          if (error.status === 404 && error.error?.success === true) {
            return of({ data: [], total: 0, totals: undefined });
          }
          console.error('Error fetching constituent sponsors:', error);
          return throwError(() => error);
        })
      );
  }
}
