import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  InterdictionUpgradeMatrixModel,
  InterdictionUpgradeMatrixParamsDto,
  InterdictionUpgradeMatrixFilterLov,
  InterdictionUpgradeMatrixDto,
  UpdateInterdictionUpgradeMatrixDto
} from '../models/interdiction-upgrade-matrix.model';
import { ApiService } from '@shared/services/api.service';
import { LoginService } from '@shared/services/login.service';
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
export class InterdictionUpgradeMatrixService {
  private readonly apiService = inject(ApiService);
  private readonly loginService = inject(LoginService);

  /**
   * Get Interdiction Upgrade Matrix table data with pagination
   * POST /api/v1/admin/interdiction-upgrade-matrix/{take}/{skip}
   * @param take - Number of records to fetch
   * @param skip - Number of records to skip
   * @param params - Filter and search parameters
   * @returns Observable with table data and total count
   */
  getInterdictionUpgradeMatrix(
    take: number,
    skip: number,
    params: InterdictionUpgradeMatrixParamsDto
  ): Observable<{ data: InterdictionUpgradeMatrixModel[]; totalRecords: number }> {
    const endpoint = API.APPLICATION_ADMIN.INTERDICTION_UPGRADE_MATRIX(take, skip);

    return this.apiService.post<ReturnResult<InterdictionUpgradeMatrixModel>>(endpoint, params).pipe(
      map(response => ({
        data: response.data || [],
        totalRecords: response.total || 0
      })),
      catchError(error => {
        console.error('Error fetching interdiction upgrade matrix data:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get filter dropdown values (LOV)
   * GET /api/v1/admin/interdiction-upgrade-matrix-filters
   * @returns Observable with filter options
   */
  getInterdictionUpgradeMatrixFilters(): Observable<ReturnResult<InterdictionUpgradeMatrixFilterLov>> {
    const endpoint = API.APPLICATION_ADMIN.INTERDICTION_UPGRADE_MATRIX_FILTERS;

    return this.apiService.get<ReturnResult<InterdictionUpgradeMatrixFilterLov>>(endpoint).pipe(
      catchError(error => {
        console.error('Error fetching interdiction upgrade matrix filters:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get interdiction codes for add/edit form dropdowns
   * GET /api/v1/admin/interdiction-codes
   * @returns Observable with list of interdiction codes
   */
  getInterdictionCodes(): Observable<ReturnResult<string>> {
    const endpoint = API.APPLICATION_ADMIN.INTERDICTION_CODES;

    return this.apiService.get<ReturnResult<string>>(endpoint).pipe(
      catchError(error => {
        console.error('Error fetching interdiction codes:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Add new Interdiction Upgrade
   * POST /api/v1/admin/interdiction-upgrade-matrix
   * @param data - Interdiction upgrade data (InterdictionUpgradeMatrixDto)
   * @returns Observable with result
   */
  addInterdictionUpgrade(data: InterdictionUpgradeMatrixDto): Observable<ReturnResult<InterdictionUpgradeMatrixModel>> {
    const endpoint = API.APPLICATION_ADMIN.INTERDICTION_UPGRADE_MATRIX_ADD_EDIT;
    const loggedInUserName = this.loginService.getStoredUsername();

    const params = new HttpParams()
      .set('loggedInUserName', loggedInUserName);

    return this.apiService.post<ReturnResult<InterdictionUpgradeMatrixModel>>(endpoint, data, { params }).pipe(
      catchError(error => {
        console.error('Error adding interdiction upgrade:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update existing Interdiction Upgrade
   * PUT /api/v1/admin/interdiction-upgrade-matrix
   * @param data - Interdiction upgrade data (UpdateInterdictionUpgradeMatrixDto)
   * @returns Observable with result
   */
  updateInterdictionUpgrade(data: UpdateInterdictionUpgradeMatrixDto): Observable<ReturnResult<InterdictionUpgradeMatrixModel>> {
    const endpoint = API.APPLICATION_ADMIN.INTERDICTION_UPGRADE_MATRIX_ADD_EDIT;

    return this.apiService.put<ReturnResult<InterdictionUpgradeMatrixModel>>(endpoint, data).pipe(
      catchError(error => {
        console.error('Error updating interdiction upgrade:', error);
        return throwError(() => error);
      })
    );
  }
}
