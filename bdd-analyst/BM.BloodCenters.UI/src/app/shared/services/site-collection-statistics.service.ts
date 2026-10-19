import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { API } from '../../core/constants/api.constants';

interface SiteApiResponse<T> {
  data: T;
  totalActualDraws?: number;
  totalActualDeferrals?: number;
}
import {
  SiteStatisticsQueryParams,
  SiteStatisticsSummaryDto,
  DonationBreakdownQueryParams,
  DonationBreakdownDto,
  UnitDetailsQueryParams,
  UnitDetailDto,
  GoalsQueryParams,
  GoalComparisonDto,
  SiteDropdownDto,
} from '@shared/models/site-collection-statistics.model';

/**
 * Service for Site Collection Statistics API
 *
 * Provides read-only access to site collection statistics for blood donation drives.
 *
 * API Documentation: site-collection-statistics-api-documentation.md
 * JIRA Ticket: MLT-10976
 */
@Injectable({
  providedIn: 'root'
})
export class SiteCollectionStatisticsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}${API.DONOR_FUNCTIONS.SITE_COLLECTION_STATISTICS.BASE}`;

  /**
   * Get site statistics aggregated by site and date within a date range
   *
   * @param params Query parameters with startDate, endDate, and optional siteId
   * @returns Observable of site statistics summary with totals
   *
   * Error Codes:
   * - 0080: Field must be entered (missing startDate or endDate)
   * - 7023: End date cannot be before start date
   * - 11273: Site ID not found
   */
  getSiteStatistics(params: SiteStatisticsQueryParams): Observable<SiteStatisticsSummaryDto> {
    let httpParams = new HttpParams()
      .set('startDate', params.startDate)
      .set('endDate', params.endDate);

    if (params.siteId) {
      httpParams = httpParams.set('siteId', params.siteId);
    }

    return this.http.get<SiteStatisticsSummaryDto>(this.baseUrl, { params: httpParams }).pipe(
      map(response => ({
        ...response,
        data: response.data || [],
        totalActualDraws: response.totalActualDraws ?? 0,
        totalActualDeferrals: response.totalActualDeferrals ?? 0,
      }))
    );
  }

  /**
   * Get donation counts broken down by donation type and procedure code
   *
   * @param params Query parameters with siteId and collectionDate
   * @returns Observable of donation breakdown array
   */
  getDonationBreakdown(params: DonationBreakdownQueryParams): Observable<DonationBreakdownDto[]> {
    const httpParams = new HttpParams()
      .set('siteId', params.siteId)
      .set('collectionDate', params.collectionDate);

    return this.http.get<SiteApiResponse<DonationBreakdownDto[]>>(
      `${environment.apiUrl}${API.DONOR_FUNCTIONS.SITE_COLLECTION_STATISTICS.DONATION_BREAKDOWN}`,
      { params: httpParams }
    ).pipe(
      map(response => response.data || [])
    );
  }

  /**
   * Get unit-level donation details with venipuncture attributes
   *
   * @param params Query parameters with siteId, collectionDate, and optional filters
   * @returns Observable of unit detail array
   */
  getUnitDetails(params: UnitDetailsQueryParams): Observable<UnitDetailDto[]> {
    let httpParams = new HttpParams()
      .set('siteId', params.siteId)
      .set('collectionDate', params.collectionDate);

    if (params.donationType) {
      httpParams = httpParams.set('donationType', params.donationType);
    }

    if (params.procedureCode) {
      httpParams = httpParams.set('procedureCode', params.procedureCode);
    }

    return this.http.get<SiteApiResponse<UnitDetailDto[]>>(
      `${environment.apiUrl}${API.DONOR_FUNCTIONS.SITE_COLLECTION_STATISTICS.UNIT_DETAILS}`,
      { params: httpParams }
    ).pipe(
      map(response => response.data || [])
    );
  }

  /**
   * Get goal comparison data for a specific site and date
   *
   * @param params Query parameters with siteId and collectionDate
   * @returns Observable of goal comparison array
   */
  getGoals(params: GoalsQueryParams): Observable<GoalComparisonDto[]> {
    const httpParams = new HttpParams()
      .set('siteId', params.siteId)
      .set('collectionDate', params.collectionDate);

    return this.http.get<SiteApiResponse<GoalComparisonDto[]>>(
      `${environment.apiUrl}${API.DONOR_FUNCTIONS.SITE_COLLECTION_STATISTICS.GOALS}`,
      { params: httpParams }
    ).pipe(
      map(response => response.data || [])
    );
  }

  /**
   * Get list of active sites for dropdown selection (LOV)
   *
   * @returns Observable of site dropdown array
   *
   * Note: Chapter ID is automatically determined from user context
   */
  getSites(): Observable<SiteDropdownDto[]> {
    return this.http.get<SiteApiResponse<SiteDropdownDto[]>>(
      `${environment.apiUrl}${API.DONOR_FUNCTIONS.SITE_COLLECTION_STATISTICS.SITES}`
    ).pipe(
      map(response => response.data || [])
    );
  }
}
