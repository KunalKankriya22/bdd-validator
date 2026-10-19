import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  ReturnReasonsModel,
  ReturnReasonsParamsDto,
  ReturnReasonsDto,
  UpdateReturnReasonsDto,
  LocationTypeModel,
  ChargeCodeModel
} from '../models/return-reasons.model';
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
export class ReturnReasonsService {
  private readonly apiService = inject(ApiService);

  /**
   * Get Return Reasons table data with pagination
   * POST /api/v1/admin/return-reasons/{take}/{skip}
   * @param take - Number of records to fetch
   * @param skip - Number of records to skip
   * @param params - Filter and search parameters
   * @returns Observable with table data and total count
   */
  getReturnReasons(
    take: number,
    skip: number,
    params: ReturnReasonsParamsDto
  ): Observable<{ data: ReturnReasonsModel[]; totalRecords: number }> {
    const endpoint = API.APPLICATION_ADMIN.RETURN_REASONS(take, skip);
    

    return this.apiService.post<ReturnResult<ReturnReasonsModel>>(endpoint, params).pipe(
      map(response => ({
        data: response.data || [],
        totalRecords: response.total || 0
      })),
      catchError(error => {
        console.error('Error fetching return reasons data:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get single Return Reasons record by chapterId and code
   * GET /api/v1/admin/return-reasons/{chapterId}/{code}
   * @param chapterId - Chapter ID
   * @param code - Return reason code
   * @returns Observable with single record
   */
  getReturnReasonById(chapterId: string, code: string): Observable<ReturnResult<ReturnReasonsModel>> {
    const endpoint = API.APPLICATION_ADMIN.RETURN_REASONS_GET_BY_ID(chapterId, code);

    return this.apiService.get<ReturnResult<ReturnReasonsModel>>(endpoint).pipe(
      catchError(error => {
        console.error('Error fetching return reason by ID:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get location types for add/edit form dropdowns
   * GET /api/v1/admin/return-reasons/location-types
   * @returns Observable with list of location types
   */
  getLocationTypes(): Observable<ReturnResult<LocationTypeModel>> {
    const endpoint = API.APPLICATION_ADMIN.RETURN_REASONS_LOCATION_TYPES;

    return this.apiService.get<ReturnResult<LocationTypeModel>>(endpoint).pipe(
      catchError(error => {
        console.error('Error fetching location types:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get charge codes (fee codes) for add/edit form dropdowns
   * GET /api/v1/admin/return-reasons/charge-codes
   * @param excludeCode - Optional charge code to exclude from the results
   * @returns Observable with list of charge codes
   */
  getChargeCodes(excludeCode?: string): Observable<ReturnResult<ChargeCodeModel>> {
    const endpoint = API.APPLICATION_ADMIN.RETURN_REASONS_CHARGE_CODES(excludeCode);

    return this.apiService.get<ReturnResult<ChargeCodeModel>>(endpoint).pipe(
      catchError(error => {
        console.error('Error fetching charge codes:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Add new Return Reasons record
   * POST /api/v1/admin/return-reasons
   * @param data - Return Reasons data
   * @returns Observable with result
   */
  addReturnReasons(data: ReturnReasonsDto): Observable<ReturnResult<ReturnReasonsModel>> {
    const endpoint = API.APPLICATION_ADMIN.RETURN_REASONS_ADD_EDIT;

    return this.apiService.post<ReturnResult<ReturnReasonsModel>>(endpoint, data).pipe(
      catchError(error => {
        console.error('Error adding return reasons:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update existing Return Reasons record
   * PUT /api/v1/admin/return-reasons
   * @param data - Return Reasons data
   * @returns Observable with result
   */
  updateReturnReasons(data: UpdateReturnReasonsDto): Observable<ReturnResult<ReturnReasonsModel>> {
    const endpoint = API.APPLICATION_ADMIN.RETURN_REASONS_ADD_EDIT;

    return this.apiService.put<ReturnResult<ReturnReasonsModel>>(endpoint, data).pipe(
      catchError(error => {
        console.error('Error updating return reasons:', error);
        return throwError(() => error);
      })
    );
  }
}
