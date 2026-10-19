import { Injectable, inject } from '@angular/core';
import { Observable, throwError, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import {
  DefineProcedureGroupsModel,
  DefineProcedureGroupsParamsDto,
  DefineProcedureGroupsDto,
  UpdateDefineProcedureGroupsDto,
  DefineProcedureGroupsFilterLov,
  ProcedureGroupLookup,
  ProcedureCodeLookup,
  CreditCountLookup,
  UserContext
} from '../models/define-procedure-groups.model';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';

interface ReturnResult<T> {
  success?: boolean;
  message?: string;
  error?: string;
  statusCode?: number;
  data?: T[];
  item?: T;
  total?: number;
}

@Injectable({
  providedIn: 'root'
})
export class DefineProcedureGroupsService {
  private readonly apiService = inject(ApiService);

  // Cache for lookup data
  private procedureGroupsCache: ProcedureGroupLookup[] | null = null;
  private procedureCodesCache: ProcedureCodeLookup[] | null = null;
  private creditCountsCache: CreditCountLookup[] | null = null;

  /**
   * Get Define Procedure Groups list with pagination, sorting, and filtering
   * POST /api/v1/api/procedure-groups/{take}/{skip}
   * @param take - Number of records to fetch
   * @param skip - Number of records to skip
   * @param params - Filter and search parameters
   * @returns Observable with table data and total count
   */
  getDefineProcedureGroups(
    take: number,
    skip: number,
    params: DefineProcedureGroupsParamsDto
  ): Observable<{ data: DefineProcedureGroupsModel[]; totalRecords: number }> {
    const endpoint = API.APPLICATION_ADMIN.DEFINE_PROCEDURE_GROUPS(take, skip);

    return this.apiService.post<ReturnResult<DefineProcedureGroupsModel>>(endpoint, params).pipe(
      map(response => ({
        data: response.data || [],
        totalRecords: response.total || 0
      })),
      catchError(error => {
        console.error('Error fetching define procedure groups data:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get filter options for procedure groups
   * GET /api/v1/api/procedure-groups/filters
   * @returns Observable with filter LOV data
   */
  getProcedureGroupFilters(): Observable<ReturnResult<DefineProcedureGroupsFilterLov>> {
    const endpoint = API.APPLICATION_ADMIN.PROCEDURE_GROUP_FILTERS;

    return this.apiService.get<ReturnResult<DefineProcedureGroupsFilterLov>>(endpoint).pipe(
      catchError(error => {
        console.error('Error fetching procedure group filters:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get user context for procedure groups
   * GET /api/v1/api/procedure-groups/user/context/{userId}
   * @param userId - User ID
   * @returns Observable with user context data
   */
  getUserContext(userId: string): Observable<UserContext> {
    const endpoint = API.APPLICATION_ADMIN.PROCEDURE_GROUP_USER_CONTEXT(userId);

    return this.apiService.get<UserContext>(endpoint).pipe(
      catchError(error => {
        console.error('Error fetching user context:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Add new procedure group
   * POST /api/v1/api/procedure-groups
   * @param payload - Procedure group data
   * @returns Observable with response
   */
  addProcedureGroup(payload: DefineProcedureGroupsDto): Observable<any> {
    const endpoint = API.APPLICATION_ADMIN.PROCEDURE_GROUP;

    return this.apiService.post<any>(endpoint, payload).pipe(
      catchError(error => {
        console.error('Error adding procedure group:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update existing procedure group
   * PUT /api/v1/api/procedure-groups/{procedureGroup}/{procedureCode}/{effectiveDate}
   * @param procedureGroup - Procedure group code
   * @param procedureCode - Procedure code
   * @param effectiveDate - Effective date (YYYY-MM-DD format)
   * @param payload - Updated procedure group data
   * @returns Observable with response
   */
  updateProcedureGroup(
    procedureGroup: string,
    procedureCode: string,
    effectiveDate: string,
    payload: UpdateDefineProcedureGroupsDto
  ): Observable<any> {
    const endpoint = API.APPLICATION_ADMIN.PROCEDURE_GROUP_UPDATE(procedureGroup, procedureCode, effectiveDate);

    return this.apiService.put<any>(endpoint, payload).pipe(
      catchError(error => {
        console.error('Error updating procedure group:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get procedure groups lookup for filter dropdown (with caching)
   * GET /api/v1/api/procedure-groups/lookups/procedure-groups
   * @returns Observable with procedure groups list
   */
  getProcedureGroupsLookup(): Observable<ReturnResult<ProcedureGroupLookup>> {
    // Return cached data if available
    if (this.procedureGroupsCache) {
      console.log('Returning cached procedure groups');
      return of({
        success: true,
        data: this.procedureGroupsCache,
        total: this.procedureGroupsCache.length
      });
    }

    // Fetch from API and cache the result
    const endpoint = API.APPLICATION_ADMIN.PROCEDURE_GROUP_LOOKUPS.PROCEDURE_GROUPS;

    return this.apiService.get<ReturnResult<ProcedureGroupLookup>>(endpoint).pipe(
      tap(response => {
        // Cache the data for future use
        if (response.data) {
          this.procedureGroupsCache = response.data;
          console.log('Cached procedure groups:', this.procedureGroupsCache.length, 'items');
        }
      }),
      catchError(error => {
        console.error('Error fetching procedure groups lookup:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get procedure codes lookup for filter dropdown (with caching)
   * GET /api/v1/api/procedure-groups/lookups/procedure-codes
   * @returns Observable with procedure codes list
   */
  getProcedureCodesLookup(): Observable<ReturnResult<ProcedureCodeLookup>> {
    // Return cached data if available
    if (this.procedureCodesCache) {
      console.log('Returning cached procedure codes');
      return of({
        success: true,
        data: this.procedureCodesCache,
        total: this.procedureCodesCache.length
      });
    }

    // Fetch from API and cache the result
    const endpoint = API.APPLICATION_ADMIN.PROCEDURE_GROUP_LOOKUPS.PROCEDURE_CODES;

    return this.apiService.get<ReturnResult<ProcedureCodeLookup>>(endpoint).pipe(
      tap(response => {
        // Cache the data for future use
        if (response.data) {
          this.procedureCodesCache = response.data;
          console.log('Cached procedure codes:', this.procedureCodesCache.length, 'items');
        }
      }),
      catchError(error => {
        console.error('Error fetching procedure codes lookup:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get credit counts lookup for filter dropdown (with caching)
   * GET /api/v1/api/procedure-groups/lookups/credit-counts
   * @returns Observable with credit counts list
   */
  getCreditCountsLookup(): Observable<ReturnResult<CreditCountLookup>> {
    // Return cached data if available
    if (this.creditCountsCache) {
      console.log('Returning cached credit counts');
      return of({
        success: true,
        data: this.creditCountsCache,
        total: this.creditCountsCache.length
      });
    }

    // Fetch from API and cache the result
    const endpoint = API.APPLICATION_ADMIN.PROCEDURE_GROUP_LOOKUPS.CREDIT_COUNTS;

    return this.apiService.get<ReturnResult<CreditCountLookup>>(endpoint).pipe(
      tap(response => {
        // Cache the data for future use
        if (response.data) {
          this.creditCountsCache = response.data;
          console.log('Cached credit counts:', this.creditCountsCache.length, 'items');
        }
      }),
      catchError(error => {
        console.error('Error fetching credit counts lookup:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get procedure groups filter lookup (distinct values from existing records, no caching)
   * GET /api/v1/procedure-groups/filters/procedure-groups
   * @returns Observable with procedure groups that have existing records
   */
  getProcedureGroupsFilterLookup(): Observable<ReturnResult<ProcedureGroupLookup>> {
    const endpoint = API.APPLICATION_ADMIN.PROCEDURE_GROUP_FILTER_LOOKUPS.PROCEDURE_GROUPS;

    return this.apiService.get<ReturnResult<ProcedureGroupLookup>>(endpoint).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Get procedure codes filter lookup (distinct values from existing records, no caching)
   * GET /api/v1/procedure-groups/filters/procedure-codes
   * @returns Observable with procedure codes that have existing records
   */
  getProcedureCodesFilterLookup(): Observable<ReturnResult<ProcedureCodeLookup>> {
    const endpoint = API.APPLICATION_ADMIN.PROCEDURE_GROUP_FILTER_LOOKUPS.PROCEDURE_CODES;

    return this.apiService.get<ReturnResult<ProcedureCodeLookup>>(endpoint).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Clear all cached lookup data
   * Call this if you need to force a refresh of the lookup data
   */
  clearLookupCache(): void {
    this.procedureGroupsCache = null;
    this.procedureCodesCache = null;
    this.creditCountsCache = null;
  }
}
