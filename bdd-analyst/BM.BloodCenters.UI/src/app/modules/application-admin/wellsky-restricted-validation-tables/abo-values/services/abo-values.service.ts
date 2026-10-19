import { Injectable, inject } from '@angular/core';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  AboValuesModel,
  AboValuesParamsDto,
  AboValuesFilterLov,
  AboValuesDropdowns,
  AboValuesDto,
  UpdateAboValuesDto
} from '../models/abo-values.model';
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
export class AboValuesService {
  private readonly apiService = inject(ApiService);

  /**
   * Get ABO Values table data with pagination
   * POST /api/v1/admin/abo-values/{take}/{skip}
   * @param take - Number of records to fetch
   * @param skip - Number of records to skip
   * @param params - Filter and search parameters
   * @returns Observable with table data and total count
   */
  getAboValues(
    take: number,
    skip: number,
    params: AboValuesParamsDto
  ): Observable<{ data: AboValuesModel[]; totalRecords: number }> {
    const endpoint = API.APPLICATION_ADMIN.ABO_VALUES(take, skip);

    return this.apiService.post<ReturnResult<AboValuesModel>>(endpoint, params).pipe(
      map(response => ({
        data: response.data || [],
        totalRecords: response.total || 0
      })),
      catchError(error => {
        // Handle 404 with total: 0 as "no records found" (not an error)
        if (error.status === 404 || (error.error?.statusCode === 404 && error.error?.total === 0)) {
          return of({
            data: [],
            totalRecords: 0
          });
        }
        console.error('Error fetching ABO values data:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get filter dropdown values (LOV)
   * GET /api/v1/admin/abo-values-filters
   * @returns Observable with filter options
   */
  getAboValuesFilters(): Observable<ReturnResult<AboValuesFilterLov>> {
    const endpoint = API.APPLICATION_ADMIN.ABO_VALUES_FILTERS;

    return this.apiService.get<ReturnResult<AboValuesFilterLov>>(endpoint).pipe(
      catchError(error => {
        console.error('Error fetching ABO values filters:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get dropdown options for add/edit form
   * GET /api/v1/admin/abo-values-dropdowns
   * @returns Observable with dropdown options
   */
  getAboValuesDropdowns(): Observable<ReturnResult<AboValuesDropdowns>> {
    const endpoint = API.APPLICATION_ADMIN.ABO_VALUES_DROPDOWNS;

    return this.apiService.get<ReturnResult<AboValuesDropdowns>>(endpoint).pipe(
      catchError(error => {
        console.error('Error fetching ABO values dropdowns:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Add new ABO Values record
   * POST /api/v1/admin/abo-values
   * @param data - ABO Values data (AboValuesDto)
   * @returns Observable with result
   */
  addAboValues(data: AboValuesDto): Observable<ReturnResult<AboValuesModel>> {
    const endpoint = API.APPLICATION_ADMIN.ABO_VALUES_ADD_EDIT;

    return this.apiService.post<ReturnResult<AboValuesModel>>(endpoint, data).pipe(
      catchError(error => {
        console.error('Error adding ABO values:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update existing ABO Values record
   * PUT /api/v1/admin/abo-values
   * @param data - ABO Values data (UpdateAboValuesDto)
   * @returns Observable with result
   */
  updateAboValues(data: UpdateAboValuesDto): Observable<ReturnResult<AboValuesModel>> {
    const endpoint = API.APPLICATION_ADMIN.ABO_VALUES_ADD_EDIT;

    return this.apiService.put<ReturnResult<AboValuesModel>>(endpoint, data).pipe(
      catchError(error => {
        console.error('Error updating ABO values:', error);
        return throwError(() => error);
      })
    );
  }
}
