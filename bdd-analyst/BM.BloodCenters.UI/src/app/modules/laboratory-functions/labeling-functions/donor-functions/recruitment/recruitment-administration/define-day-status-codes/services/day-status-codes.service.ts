import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  DayStatusCodeModel,
  DayStatusCodeParamsDto,
  DayStatusCodesResponse,
  DayStatusFilterLov,
  ResourceCodeOption,
  StatusCodeOption,
  AddDayStatusCodeDto,
  UpdateDayStatusCodeDto
} from '../models/day-status-codes.model';

@Injectable({
  providedIn: 'root'
})
export class DayStatusCodesService {
  private readonly apiService = inject(ApiService);

  /**
   * Get paginated day status codes with filters
   * POST /api/v1/recruitment/define-day-status-codes/{take}/{skip}
   */
  getDayStatusCodes(
    take: number,
    skip: number,
    params: DayStatusCodeParamsDto
  ): Observable<{ data: DayStatusCodeModel[]; total: number }> {
    const endpoint = API.RECRUITMENT.DAY_STATUS_CODES(take, skip);

    return this.apiService.post<DayStatusCodesResponse>(endpoint, params).pipe(
      map(response => ({
        data: response?.data || [],
        total: response?.total || 0
      })),
      catchError(error => {
        console.error('Error fetching day status codes:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get filter dropdown options (resource codes and status codes)
   * GET /api/v1/recruitment/define-day-status-codes/filter
   * Returns: { resourceCodes: string[], statusCodes: string[] }
   */
  getDayStatusFilters(): Observable<DayStatusFilterLov> {
    return this.apiService.get<{ resourceCodes: string[]; statusCodes: string[] }>(API.RECRUITMENT.DAY_STATUS_CODES_FILTERS).pipe(
      map(response => ({
        resourceCodes: (response?.resourceCodes || []).map(code => ({ resourceCode: code })),
        statusCodes: (response?.statusCodes || []).map(code => ({ status: code }))
      })),
      catchError(error => {
        console.error('Error fetching day status filters:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Add new day status code
   * POST /api/v1/recruitment/define-day-status-codes
   */
  addDayStatusCode(data: AddDayStatusCodeDto): Observable<any> {
    return this.apiService.post(API.RECRUITMENT.ADD_DAY_STATUS_CODE, data).pipe(
      catchError(error => {
        console.error('Error adding day status code:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update existing day status code
   * PUT /api/v1/recruitment/define-day-status-codes
   */
  updateDayStatusCode(data: UpdateDayStatusCodeDto): Observable<any> {
    return this.apiService.put(API.RECRUITMENT.UPDATE_DAY_STATUS_CODE, data).pipe(
      catchError(error => {
        console.error('Error updating day status code:', error);
        return throwError(() => error);
      })
    );
  }
}
