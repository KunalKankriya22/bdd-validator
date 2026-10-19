import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  DefineDurationBetweenProceduresModel,
  DefineDurationBetweenProceduresParamsDto,
  DefineDurationBetweenProceduresFilterLov,
  DefineDurationBetweenProceduresDto,
  UpdateDefineDurationBetweenProceduresDto,
  DonationType,
  ProcedureCode
} from '../models/define-duration-between-procedures.model';
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
export class DefineDurationBetweenProceduresService {
  private readonly apiService = inject(ApiService);

  /**
   * Get Define Duration Between Procedures table data with pagination
   * GET /api/v1/define-duration/valid-eligible-procedures/{take}/{skip}
   * @param take - Number of records to fetch
   * @param skip - Number of records to skip
   * @param params - Filter and search parameters
   * @returns Observable with table data and total count
   */
  getDefineDurationBetweenProcedures(
    take: number,
    skip: number,
    params: DefineDurationBetweenProceduresParamsDto
  ): Observable<{ data: DefineDurationBetweenProceduresModel[]; totalRecords: number }> {
    const endpoint = API.APPLICATION_ADMIN.DEFINE_DURATION_BETWEEN_PROCEDURES(take, skip);

    return this.apiService.post<ReturnResult<DefineDurationBetweenProceduresModel>>(endpoint, params).pipe(
      map(response => ({
        data: response.data || [],
        totalRecords: response.total || 0
      })),
      catchError(error => {
        console.error('Error fetching define duration between procedures data:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get filter dropdown values (LOV)
   * @returns Observable with filter options
   */
  getDefineDurationFilters(): Observable<ReturnResult<DefineDurationBetweenProceduresFilterLov>> {
    const endpoint = API.APPLICATION_ADMIN.DEFINE_DURATION_BETWEEN_PROCEDURES_FILTERS;

    return this.apiService.get<ReturnResult<DefineDurationBetweenProceduresFilterLov>>(endpoint).pipe(
      catchError(error => {
        console.error('Error fetching define duration filters:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get donation types for dropdowns
   * GET /api/v1/define-duration/lookups/donation-types
   * @returns Observable with list of donation types
   */
  getDonationTypes(): Observable<ReturnResult<DonationType>> {
    const endpoint = API.APPLICATION_ADMIN.DEFINE_DURATION_LOOKUPS.DONATION_TYPES;

    return this.apiService.get<ReturnResult<DonationType>>(endpoint).pipe(
      catchError(error => {
        console.error('Error fetching donation types:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get procedure codes for dropdowns
   * GET /api/v1/define-duration/lookups/procedure-codes
   * @returns Observable with list of procedure codes
   */
  getProcedureCodes(): Observable<ReturnResult<ProcedureCode>> {
    const endpoint = API.APPLICATION_ADMIN.DEFINE_DURATION_LOOKUPS.PROCEDURE_CODES;

    return this.apiService.get<ReturnResult<ProcedureCode>>(endpoint).pipe(
      catchError(error => {
        console.error('Error fetching procedure codes:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Add new Define Duration Between Procedures
   * POST /api/v1/define-duration/valid-eligible-procedures
   * @param data - Define duration data
   * @returns Observable with result
   */
  addDefineDuration(data: DefineDurationBetweenProceduresDto): Observable<ReturnResult<DefineDurationBetweenProceduresModel>> {
    const endpoint = API.APPLICATION_ADMIN.DEFINE_DURATION_BETWEEN_PROCEDURES_CRUD;

    return this.apiService.post<ReturnResult<DefineDurationBetweenProceduresModel>>(endpoint, data).pipe(
      catchError(error => {
        console.error('Error adding define duration:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update existing Define Duration Between Procedures
   * PUT /api/v1/define-duration/valid-eligible-procedures
   * @param data - Define duration data
   * @returns Observable with result
   */
  updateDefineDuration(data: UpdateDefineDurationBetweenProceduresDto): Observable<ReturnResult<DefineDurationBetweenProceduresModel>> {
    const endpoint = API.APPLICATION_ADMIN.DEFINE_DURATION_BETWEEN_PROCEDURES_CRUD;

    return this.apiService.put<ReturnResult<DefineDurationBetweenProceduresModel>>(endpoint, data).pipe(
      catchError(error => {
        console.error('Error updating define duration:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Delete Define Duration Between Procedures
   * DELETE /api/v1/define-duration/valid-eligible-procedures
   * @param currDonationType - Current donation type
   * @param procedureCode - Procedure code
   * @param prevProcedureCode - Previous procedure code
   * @param effectiveDate - Effective date
   * @returns Observable with result
   */
  deleteDefineDuration(
    currDonationType: string,
    procedureCode: string,
    prevProcedureCode: string,
    effectiveDate: string
  ): Observable<ReturnResult<any>> {
    const endpoint = `${API.APPLICATION_ADMIN.DEFINE_DURATION_BETWEEN_PROCEDURES_CRUD}?currDonationType=${currDonationType}&procedureCode=${procedureCode}&prevProcedureCode=${prevProcedureCode}&effectiveDate=${effectiveDate}`;

    return this.apiService.delete<ReturnResult<any>>(endpoint).pipe(
      catchError(error => {
        console.error('Error deleting define duration:', error);
        return throwError(() => error);
      })
    );
  }
}
