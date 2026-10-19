import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, catchError, throwError } from 'rxjs';
import { HttpContext } from '@angular/common/http';

import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import { SKIP_ERROR_TOAST } from 'src/app/core/constants/http-context.constants';

const SILENT = { context: new HttpContext().set(SKIP_ERROR_TOAST, true) };

import {
  CollectionStatisticsRequest,
  CollectionStatisticsResponse,
  DateDetailRequest,
  DateDetailResponse,
  UnitsRequest,
  UnitRowDto,
  GoalsRequest,
  GoalRowDto,
  ApiResponse,
  DonationTypeLookup,
  ProcedureCodeLookup,
} from '@shared/models/collection-statistics.model';

@Injectable({ providedIn: 'root' })
export class CollectionStatisticsService {
  private readonly apiService = inject(ApiService);

  // ── Report ────────────────────────────────────────────────────────────────

  getReport(request: CollectionStatisticsRequest): Observable<CollectionStatisticsResponse> {
    return this.apiService
      .post<ApiResponse<CollectionStatisticsResponse>>(
        API.DONOR_FUNCTIONS.COLLECTION_STATISTICS.REPORT,
        request,
        SILENT,
      )
      .pipe(
        map((response) => {
          if (!response.success) {
            throw new Error(response.message || 'Failed to retrieve collection statistics');
          }
          return response.data;
        }),
        catchError((error) => throwError(() => error)),
      );
  }

  // ── Date Detail (VENI + Deferrals) ────────────────────────────────────────

  getDateDetail(request: DateDetailRequest): Observable<DateDetailResponse> {
    return this.apiService
      .post<ApiResponse<DateDetailResponse>>(
        API.DONOR_FUNCTIONS.COLLECTION_STATISTICS.DATE_DETAIL,
        request,
        SILENT,
      )
      .pipe(
        map((response) => {
          if (!response.success) {
            throw new Error(response.message || 'Failed to retrieve date detail');
          }
          return response.data;
        }),
        catchError((error) => throwError(() => error)),
      );
  }

  // ── Units ─────────────────────────────────────────────────────────────────

  getUnits(request: UnitsRequest): Observable<UnitRowDto[]> {
    return this.apiService
      .post<ApiResponse<UnitRowDto[]>>(
        API.DONOR_FUNCTIONS.COLLECTION_STATISTICS.UNITS,
        request,
        SILENT,
      )
      .pipe(
        map((response) => {
          if (!response.success) {
            throw new Error(response.message || 'Failed to retrieve units');
          }
          return response.data || [];
        }),
        catchError((error) => throwError(() => error)),
      );
  }

  // ── Goals ─────────────────────────────────────────────────────────────────

  getGoals(request: GoalsRequest): Observable<GoalRowDto[]> {
    return this.apiService
      .post<ApiResponse<GoalRowDto[]>>(
        API.DONOR_FUNCTIONS.COLLECTION_STATISTICS.GOALS,
        request,
        SILENT,
      )
      .pipe(
        map((response) => {
          if (!response.success) {
            throw new Error(response.message || 'Failed to retrieve goals');
          }
          return response.data || [];
        }),
        catchError((error) => throwError(() => error)),
      );
  }

  // ── LOVs ──────────────────────────────────────────────────────────────────

  getDonationTypes(): Observable<DonationTypeLookup[]> {
    return this.apiService
      .get<ApiResponse<{ code: string; description: string }[]>>(
        API.DONOR_FUNCTIONS.COLLECTION_STATISTICS.DONATION_TYPES,
        SILENT,
      )
      .pipe(
        map((response) => {
          if (!response.success) {
            throw new Error(response.message || 'Failed to load donation types');
          }
          return (response.data || []).map((dt) => ({
            code: dt.code,
            description: dt.description,
          }));
        }),
        catchError((error) => throwError(() => error)),
      );
  }

  getProcedureCodes(): Observable<ProcedureCodeLookup[]> {
    return this.apiService
      .get<ApiResponse<{ code: string; description: string }[]>>(
        API.DONOR_FUNCTIONS.COLLECTION_STATISTICS.PROCEDURE_CODES,
        SILENT,
      )
      .pipe(
        map((response) => {
          if (!response.success) {
            throw new Error(response.message || 'Failed to load procedure codes');
          }
          return (response.data || []).map((pc) => ({
            code: pc.code,
            description: pc.description,
          }));
        }),
        catchError((error) => throwError(() => error)),
      );
  }

  loadLovs(): Observable<{ donationTypes: DonationTypeLookup[]; procedureCodes: ProcedureCodeLookup[] }> {
    return forkJoin({
      donationTypes: this.getDonationTypes(),
      procedureCodes: this.getProcedureCodes(),
    });
  }
}
