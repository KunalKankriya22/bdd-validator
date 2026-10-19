import { Injectable, inject } from '@angular/core';
import { HttpContext } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import { SKIP_ERROR_TOAST } from 'src/app/core/constants/http-context.constants';
import {
  ValidateCheckinUnitRequestDto,
  ValidateCheckinUnitResponseDto,
  ValidateCheckinProductRequestDto,
  ValidateCheckinProductResponseDto,
  CheckinRequestDto,
  CheckinResponseDto,
  CheckinHistoryResponseDto,
  ReturnResult,
} from '../models/lab-warehouse-check-in.model';

/**
 * Lab Warehouse Check-In API Service
 * Handles all API calls for the Lab Warehouse Check-In module
 */
@Injectable({
  providedIn: 'root',
})
export class LabWarehouseCheckInApiService {
  private readonly apiService = inject(ApiService);

  /**
   * Validate a unit for check-in
   * First step in the check-in process
   * @param request Unit validation request
   * @returns Observable of unit validation response
   */
  validateUnit(request: ValidateCheckinUnitRequestDto): Observable<ValidateCheckinUnitResponseDto> {
    const url = API.LAB_WAREHOUSE_CHECKIN.VALIDATE_UNIT;
    return this.apiService.post<ReturnResult<ValidateCheckinUnitResponseDto>>(url, request, {
      context: new HttpContext().set(SKIP_ERROR_TOAST, true)
    }).pipe(
      map((response) => response.item),
      catchError((error) => throwError(() => error))
    );
  }

  /**
   * Validate a product/component for check-in
   * Second step in the check-in process
   * @param request Product validation request
   * @returns Observable of product validation response
   */
  validateProduct(request: ValidateCheckinProductRequestDto): Observable<ValidateCheckinProductResponseDto> {
    const url = API.LAB_WAREHOUSE_CHECKIN.VALIDATE_PRODUCT;
    return this.apiService.post<ReturnResult<ValidateCheckinProductResponseDto>>(url, request).pipe(
      map((response) => response.item),
      catchError((error) => throwError(() => error))
    );
  }

  /**
   * Perform warehouse check-in
   * Final step - executes the actual check-in operation
   * @param request Check-in request
   * @returns Observable of check-in response
   */
  checkin(request: CheckinRequestDto): Observable<CheckinResponseDto> {
    const url = API.LAB_WAREHOUSE_CHECKIN.CHECKIN;
    return this.apiService.post<ReturnResult<CheckinResponseDto>>(url, request).pipe(
      map((response) => response.item),
      catchError((error) => throwError(() => error))
    );
  }

  /**
   * Get check-in history
   * Retrieve historical check-in records
   * @param date Optional date filter (YYYY-MM-DD format)
   * @returns Observable of check-in history
   */
  getHistory(date?: string): Observable<CheckinHistoryResponseDto> {
    const url = API.LAB_WAREHOUSE_CHECKIN.HISTORY(date);
    return this.apiService.get<ReturnResult<CheckinHistoryResponseDto>>(url).pipe(
      map((response) => response.item),
      catchError((error) => throwError(() => error))
    );
  }
}
