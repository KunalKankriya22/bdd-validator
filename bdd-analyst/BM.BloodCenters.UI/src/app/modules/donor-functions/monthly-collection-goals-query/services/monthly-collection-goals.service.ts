import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { HeaderService } from '@shared/services/header.service';
import {
  GoalTypeLookup,
  CustodianLookup,
  SearchTabResponse,
  MonthDetailResponse,
  GoalDetail,
  SummaryTabResponse,
  SearchQueryRequest,
  MonthDetailRequest,
  SummaryQueryRequest,
  SummaryTabType
} from '../models/monthly-collection-goals.model';

// API response wrapper interfaces
interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data: T;
  total?: number;
  errorResponse?: {
    errorCode: string;
    error: string;
  };
}

// API response types for donation/procedure type summaries
interface DonationTypeSummaryItem {
  custodianId: string;
  custodianName: string;
  donationTypeCode: string;
  donationTypeDescription: string;
  january: number;
  february: number;
  march: number;
  april: number;
  may: number;
  june: number;
  july: number;
  august: number;
  september: number;
  october: number;
  november: number;
  december: number;
  total: number;
}

interface ProcedureTypeSummaryItem {
  custodianId: string;
  custodianName: string;
  procedureTypeCode: string;
  procedureTypeDescription: string;
  january: number;
  february: number;
  march: number;
  april: number;
  may: number;
  june: number;
  july: number;
  august: number;
  september: number;
  october: number;
  november: number;
  december: number;
  total: number;
}

interface TerritorySummaryItem {
  territoryId: string;
  territoryShortName: string;
  territoryName: string;
  january: number;
  february: number;
  march: number;
  april: number;
  may: number;
  june: number;
  july: number;
  august: number;
  september: number;
  october: number;
  november: number;
  december: number;
  total: number;
}

interface FixedSiteSummaryItem {
  siteId: string;
  siteName: string;
  january: number;
  february: number;
  march: number;
  april: number;
  may: number;
  june: number;
  july: number;
  august: number;
  september: number;
  october: number;
  november: number;
  december: number;
  total: number;
}

interface YearRangeItem {
  minYear: number;
  maxYear: number;
}

const API_ENDPOINTS = {
  GOAL_TYPES: '/api/v1/monthly-collection-goals/lookups/goal-types',
  CUSTODIANS: (goalType: string, chapterId: string) => `/api/v1/monthly-collection-goals/lookups/custodians/${goalType}?chapterId=${chapterId}`,
  YEAR_RANGE: '/api/v1/monthly-collection-goals/lookups/year-range',
  SEARCH: '/api/v1/monthly-collection-goals/summary',
  MONTH_DETAILS: (month: number, pageSize: number, offset: number) => `/api/v1/monthly-collection-goals/details/${month}/${pageSize}/${offset}`,
  BY_DONATION_TYPE: (year: number, chapterId: string) => `/api/v1/monthly-collection-goals/by-donation-type/${year}?chapterId=${chapterId}`,
  BY_PROCEDURE_TYPE: (year: number, chapterId: string) => `/api/v1/monthly-collection-goals/by-procedure-type/${year}?chapterId=${chapterId}`,
  TERRITORIES: (year: number, chapterId: string) => `/api/v1/monthly-collection-goals/territories/${year}?chapterId=${chapterId}`,
  FIXED_SITES: (year: number, chapterId: string) => `/api/v1/monthly-collection-goals/fixed-sites/${year}?chapterId=${chapterId}`,
};

@Injectable({
  providedIn: 'root'
})
export class MonthlyCollectionGoalsService {
  private readonly apiService = inject(ApiService);
  private readonly headerService = inject(HeaderService);

  /**
   * Get available goal types from lookup
   * Maps to VALID_MASTER_CODES where code_type = 'GOALS'
   */
  getGoalTypes(): Observable<GoalTypeLookup[]> {
    return this.apiService.get<ApiResponse<GoalTypeLookup[]>>(API_ENDPOINTS.GOAL_TYPES).pipe(
      map(response => response?.data || [])
    );
  }

  /**
   * Get custodians based on goal type
   * Different sources based on goal type (see FMB analysis)
   */
  getCustodians(goalType: string): Observable<CustodianLookup[]> {
    const chapterId = this.headerService.getCurrentChapterId();
    return this.apiService.get<ApiResponse<CustodianLookup[]>>(API_ENDPOINTS.CUSTODIANS(goalType, chapterId)).pipe(
      map(response => response?.data || [])
    );
  }

  /**
   * Search for goals - returns monthly summary for left panel
   */
  searchGoals(request: SearchQueryRequest): Observable<SearchTabResponse> {
    const chapterId = this.headerService.getCurrentChapterId();
    const requestWithChapter = { ...request, chapterId };
    return this.apiService.post<ApiResponse<SearchTabResponse[]>>(API_ENDPOINTS.SEARCH, requestWithChapter).pipe(
      map(response => {
        const data = response?.data;
        if (Array.isArray(data) && data.length > 0) {
          return data[0];
        }
        return { goalType: '', goalTypeDescription: '', year: String(request.year), custodianId: '', custodianName: '', monthlySummaries: [], grandTotal: 0 };
      })
    );
  }

  /**
   * Get details for a specific month - for right panel
   * Endpoint: POST /api/v1/monthly-collection-goals/details/{month}/{pageSize}/{offset}
   * Body: { goalType, year, custodianId, chapterId }
   */
  getMonthDetails(request: MonthDetailRequest, pageSize = 100, offset = 0): Observable<MonthDetailResponse> {
    const chapterId = this.headerService.getCurrentChapterId();
    const url = API_ENDPOINTS.MONTH_DETAILS(request.month, pageSize, offset);
    const body = {
      goalType: request.goalType,
      year: request.year,
      custodianId: request.custodianId,
      chapterId
    };
    return this.apiService.post<ApiResponse<GoalDetail[]>>(url, body).pipe(
      map(response => ({
        monthName: '',
        details: response?.data || []
      }))
    );
  }

  /**
   * Get summary by donation type
   */
  getByDonationType(request: SummaryQueryRequest): Observable<SummaryTabResponse> {
    const chapterId = this.headerService.getCurrentChapterId();
    return this.apiService.get<ApiResponse<DonationTypeSummaryItem[]>>(API_ENDPOINTS.BY_DONATION_TYPE(request.year, chapterId)).pipe(
      map(response => {
        const data = response?.data || [];
        return this.mapToSummaryResponse(data, 'custodianId', 'custodianName');
      })
    );
  }

  /**
   * Get summary by procedure type
   */
  getByProcedureType(request: SummaryQueryRequest): Observable<SummaryTabResponse> {
    const chapterId = this.headerService.getCurrentChapterId();
    return this.apiService.get<ApiResponse<ProcedureTypeSummaryItem[]>>(API_ENDPOINTS.BY_PROCEDURE_TYPE(request.year, chapterId)).pipe(
      map(response => {
        const data = response?.data || [];
        return this.mapToSummaryResponse(data, 'custodianId', 'custodianName');
      })
    );
  }

  /**
   * Get summary by territories
   */
  getTerritories(request: SummaryQueryRequest): Observable<SummaryTabResponse> {
    const chapterId = this.headerService.getCurrentChapterId();
    return this.apiService.get<ApiResponse<TerritorySummaryItem[]>>(API_ENDPOINTS.TERRITORIES(request.year, chapterId)).pipe(
      map(response => {
        const data = response?.data || [];
        return this.mapToSummaryResponse(data, 'territoryId', 'territoryShortName');
      })
    );
  }

  /**
   * Get summary by fixed sites
   */
  getFixedSites(request: SummaryQueryRequest): Observable<SummaryTabResponse> {
    const chapterId = this.headerService.getCurrentChapterId();
    return this.apiService.get<ApiResponse<FixedSiteSummaryItem[]>>(API_ENDPOINTS.FIXED_SITES(request.year, chapterId)).pipe(
      map(response => {
        const data = response?.data || [];
        return this.mapToSummaryResponse(data, 'siteId', 'siteName');
      })
    );
  }

  /**
   * Get year range from API and generate year options
   */
  getYearRange(): Observable<number[]> {
    return this.apiService.get<ApiResponse<YearRangeItem[]>>(API_ENDPOINTS.YEAR_RANGE).pipe(
      map(response => {
        const data = response?.data;
        if (Array.isArray(data) && data.length > 0) {
          const { minYear, maxYear } = data[0];
          const years: number[] = [];
          for (let i = minYear; i <= maxYear; i++) {
            years.push(i);
          }
          return years;
        }
        // Fallback to current year if API returns empty
        return [new Date().getFullYear()];
      })
    );
  }

  private getEmptySummaryResponse(): SummaryTabResponse {
    return {
      rows: [],
      totals: {
        goalsFor: 'Total',
        january: 0, february: 0, march: 0, april: 0, may: 0, june: 0,
        july: 0, august: 0, september: 0, october: 0, november: 0, december: 0,
        total: 0
      },
      grandTotal: 0
    };
  }

  private mapToSummaryResponse<T extends { january: number; february: number; march: number; april: number; may: number; june: number; july: number; august: number; september: number; october: number; november: number; december: number; total: number }>(
    data: T[],
    codeField: keyof T,
    descriptionField: keyof T
  ): SummaryTabResponse {
    if (!Array.isArray(data) || data.length === 0) {
      return this.getEmptySummaryResponse();
    }

    const rows = data.map(item => ({
      goalsFor: String(item[descriptionField] || ''),
      goalsForId: String(item[codeField] || ''),
      january: item.january || 0,
      february: item.february || 0,
      march: item.march || 0,
      april: item.april || 0,
      may: item.may || 0,
      june: item.june || 0,
      july: item.july || 0,
      august: item.august || 0,
      september: item.september || 0,
      october: item.october || 0,
      november: item.november || 0,
      december: item.december || 0,
      total: item.total || 0
    }));

    const totals = {
      goalsFor: 'Total',
      january: rows.reduce((sum, r) => sum + r.january, 0),
      february: rows.reduce((sum, r) => sum + r.february, 0),
      march: rows.reduce((sum, r) => sum + r.march, 0),
      april: rows.reduce((sum, r) => sum + r.april, 0),
      may: rows.reduce((sum, r) => sum + r.may, 0),
      june: rows.reduce((sum, r) => sum + r.june, 0),
      july: rows.reduce((sum, r) => sum + r.july, 0),
      august: rows.reduce((sum, r) => sum + r.august, 0),
      september: rows.reduce((sum, r) => sum + r.september, 0),
      october: rows.reduce((sum, r) => sum + r.october, 0),
      november: rows.reduce((sum, r) => sum + r.november, 0),
      december: rows.reduce((sum, r) => sum + r.december, 0),
      total: rows.reduce((sum, r) => sum + r.total, 0)
    };

    return {
      rows,
      totals,
      grandTotal: totals.total
    };
  }
}
