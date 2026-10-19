import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import {
  DefineProcedureExclusionsModel,
  DefineProcedureExclusionsParamsDto,
  DefineProcedureExclusionsDto,
  UpdateDefineProcedureExclusionsDto,
  DefineProcedureExclusionsFilterLov
} from '../models/define-procedure-exclusions.model';
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
export class DefineProcedureExclusionsService {
  private readonly apiService = inject(ApiService);

  /**
   * Get Define Procedure Exclusions list with pagination, sorting, and filtering
   * POST /api/v1/admin/procedure-exclusion/{take}/{skip}
   * @param take - Number of records to fetch
   * @param skip - Number of records to skip
   * @param params - Filter and search parameters
   * @returns Observable with table data and total count
   */
  getDefineProcedureExclusions(
    take: number,
    skip: number,
    params: DefineProcedureExclusionsParamsDto
  ): Observable<{ data: DefineProcedureExclusionsModel[]; totalRecords: number }> {
    const endpoint = API.APPLICATION_ADMIN.DEFINE_PROCEDURE_EXCLUSIONS(take, skip);

    return this.apiService.post<ReturnResult<DefineProcedureExclusionsModel>>(endpoint, params).pipe(
      map(response => ({
        data: response.data || [],
        totalRecords: response.total || 0
      })),
      catchError(error => {
        console.error('Error fetching define procedure exclusions data:', error);
        throw error;
      })
    );
  }

  /**
   * Get filter options for procedure exclusions
   * GET /api/v1/admin/procedure-exclusion/filters
   * @returns Observable with filter LOV data
   */
  getProcedureExclusionsFilters(): Observable<ReturnResult<DefineProcedureExclusionsFilterLov>> {
    const endpoint = API.APPLICATION_ADMIN.PROCEDURE_EXCLUSION_FILTERS;

    return this.apiService.get<ReturnResult<DefineProcedureExclusionsFilterLov>>(endpoint).pipe(
      catchError(error => {
        console.error('Error fetching procedure exclusion filters:', error);
        throw error;
      })
    );
  }

  /**
   * Add new procedure exclusion
   * POST /api/v1/admin/procedure-exclusion
   * @param payload - Procedure exclusion data
   * @returns Observable with response
   */
  addProcedureExclusion(payload: DefineProcedureExclusionsDto): Observable<any> {
    const endpoint = API.APPLICATION_ADMIN.PROCEDURE_EXCLUSION_CREATE;

    return this.apiService.post<any>(endpoint, payload).pipe(
      catchError(error => {
        console.error('Error adding procedure exclusion:', error);
        throw error;
      })
    );
  }

  /**
   * Update existing procedure exclusion
   * PUT /api/v1/admin/procedure-exclusion
   * @param payload - Updated procedure exclusion data
   * @returns Observable with response
   */
  updateProcedureExclusion(payload: UpdateDefineProcedureExclusionsDto): Observable<any> {
    const endpoint = API.APPLICATION_ADMIN.PROCEDURE_EXCLUSION_UPDATE;

    return this.apiService.put<any>(endpoint, payload).pipe(
      catchError(error => {
        console.error('Error updating procedure exclusion:', error);
        throw error;
      })
    );
  }

  /**
   * Get lookups for add/edit dropdowns (donation types, procedure codes, interdiction codes)
   * GET /api/v1/admin/procedure-exclusion/lookups
   */
  getLookups(): Observable<ReturnResult<DefineProcedureExclusionsFilterLov>> {
    const endpoint = API.APPLICATION_ADMIN.PROCEDURE_EXCLUSION_LOOKUPS;

    return this.apiService.get<ReturnResult<DefineProcedureExclusionsFilterLov>>(endpoint).pipe(
      catchError(error => {
        console.error('Error fetching procedure exclusion lookups:', error);
        throw error;
      })
    );
  }

  /**
   * Get procedure codes filtered by donation type (cascading lookup)
   * GET /api/v1/admin/procedure-exclusion/procedure-codes/{donationType}
   */
  getProcedureCodesByDonationType(donationType: string): Observable<ReturnResult<{ key: string; value: string }>> {
    const endpoint = API.APPLICATION_ADMIN.PROCEDURE_EXCLUSION_PROCEDURE_CODES(donationType);

    return this.apiService.get<ReturnResult<{ key: string; value: string }>>(endpoint).pipe(
      catchError(error => {
        console.error('Error fetching procedure codes by donation type:', error);
        return throwError(() => error);
      })
    );
  }

}
