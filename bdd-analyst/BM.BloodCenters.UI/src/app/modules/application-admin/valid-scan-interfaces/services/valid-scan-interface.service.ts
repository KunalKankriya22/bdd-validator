import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  ValidScanInterfaceModel,
  ValidScanInterfaceParamsDto,
  ValidScanInterfaceDto,
  ValidScanInterfaceUpdateDto
} from '../models/valid-scan-interface.model';
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
export class ValidScanInterfaceService {
  private readonly apiService = inject(ApiService);

  /**
   * Get Valid Scan Interface table data
   * @param params - Filter and search parameters including sort
   * @returns Observable with table data and total count
   */
  getValidScanInterfaces(
    params: ValidScanInterfaceParamsDto
  ): Observable<{ data: ValidScanInterfaceModel[]; totalRecords: number }> {
    const endpoint = API.APPLICATION_ADMIN.VALID_SCAN_INTERFACES;

    // Build query parameters using HttpParams
    let httpParams = new HttpParams();

    if (params.sort) {
      httpParams = httpParams.set('sort', params.sort);
    }
    if (params.searchKeyword) {
      httpParams = httpParams.set('searchKeyword', params.searchKeyword);
    }
    if (params.scanType) {
      httpParams = httpParams.set('scanType', params.scanType);
    }
    if (params.effectiveDate) {
      httpParams = httpParams.set('effectiveDate', params.effectiveDate);
    }
    if (params.effectiveDatePeriod) {
      httpParams = httpParams.set('effectiveDatePeriod', params.effectiveDatePeriod);
    }
    if (params.terminationDate) {
      httpParams = httpParams.set('terminationDate', params.terminationDate);
    }
    if (params.terminationDatePeriod) {
      httpParams = httpParams.set('terminationDatePeriod', params.terminationDatePeriod);
    }

    return this.apiService.get<ReturnResult<ValidScanInterfaceModel>>(endpoint, { params: httpParams }).pipe(
      map(response => ({
        data: response.data || [],
        totalRecords: response.total || 0
      })),
      catchError(error => {
        console.error('Error fetching valid scan interfaces:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Add new Valid Scan Interface
   * @param dto - Valid scan interface data
   * @returns Observable with result
   */
  addValidScanInterface(dto: ValidScanInterfaceDto): Observable<ReturnResult<ValidScanInterfaceModel>> {
    const endpoint = API.APPLICATION_ADMIN.CREATE_VALID_SCAN_INTERFACE;

    return this.apiService.post<ReturnResult<ValidScanInterfaceModel>>(endpoint, dto).pipe(
      catchError(error => {
        console.error('Error adding valid scan interface:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update existing Valid Scan Interface
   * @param dto - Valid scan interface update data (includes originalScanType)
   * @returns Observable with result
   */
  updateValidScanInterface(
    dto: ValidScanInterfaceUpdateDto
  ): Observable<ReturnResult<ValidScanInterfaceModel>> {
    const endpoint = API.APPLICATION_ADMIN.UPDATE_VALID_SCAN_INTERFACE;

    return this.apiService.put<ReturnResult<ValidScanInterfaceModel>>(endpoint, dto).pipe(
      catchError(error => {
        console.error('Error updating valid scan interface:', error);
        return throwError(() => error);
      })
    );
  }

  getScanTypeLookup(effectiveDate: string): Observable<string[]> {
    const endpoint = API.APPLICATION_ADMIN.SCAN_TYPE_LOOKUP;
    let httpParams = new HttpParams();
    if (effectiveDate) {
      httpParams = httpParams.set('effectiveDate', effectiveDate);
    }

    return this.apiService.get<ReturnResult<{ key: string; value: string }>>(endpoint, { params: httpParams }).pipe(
      map(response => (response.data || []).map(item => item.value)),
      catchError(error => {
        console.error('Error fetching scan type lookup:', error);
        return throwError(() => error);
      })
    );
  }
}
