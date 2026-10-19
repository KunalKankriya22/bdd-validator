import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, timer, of } from 'rxjs';
import { switchMap, takeWhile, last, catchError } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';
import {
  OutdatesSearchRequest,
  OutdatesSummaryItem,
  OutdatesDetailRequest,
  OutdatesDetailItem,
  InventoryClassOption,
  CommitOutdatesRequest,
  CommitOutdatesResponse
} from '../models/generate-outdates-picklist.model';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  item?: T;
  message?: string;
  statusCode?: number;
  errorCode?: string;
  totalCount?: number;
}

@Injectable({ providedIn: 'root' })
export class GenerateOutdatesPicklistService {
  private readonly apiService = inject(ApiService);

  getSummary(request: OutdatesSearchRequest): Observable<ApiResponse<OutdatesSummaryItem[]>> {
    return this.apiService.post<ApiResponse<OutdatesSummaryItem[]>>(
      API.GENERATE_OUTDATES_PICKLIST.SUMMARY,
      request
    );
  }

  getDetails(request: OutdatesDetailRequest, take = 100, skip = 0): Observable<ApiResponse<OutdatesDetailItem[]>> {
    let params = new HttpParams()
      .set('outDate', request.outdateAsOf)
      .set('productType', request.productType)
      .set('take', take.toString())
      .set('skip', skip.toString())
      .set('sortColumn', request.sortColumn ?? 'unitId')
      .set('sortOrder', request.sortOrder ?? 'ASC');

    if (request.bloodType) {
      params = params.set('bloodType', request.bloodType);
    }

    if (request.inventoryClass) {
      params = params.set('inventoryClass', request.inventoryClass);
    }

    return this.apiService.post<ApiResponse<OutdatesDetailItem[]>>(
      API.GENERATE_OUTDATES_PICKLIST.DETAILS,
      null,
      { params }
    );
  }

  getInventoryClasses(): Observable<ApiResponse<InventoryClassOption[]>> {
    return this.apiService.get<ApiResponse<InventoryClassOption[]>>(
      API.GENERATE_OUTDATES_PICKLIST.INVENTORY_CLASSES
    );
  }

  commitOutdates(request: CommitOutdatesRequest): Observable<ApiResponse<CommitOutdatesResponse>> {
    return this.apiService.post<ApiResponse<CommitOutdatesResponse>>(
      API.GENERATE_OUTDATES_PICKLIST.COMMIT,
      request
    );
  }

  getReportStatus(reportName: string, parmId: string): Observable<ApiResponse<any>> {
    return this.apiService.get<ApiResponse<any>>(
      API.REPORTS.REPORT_STATUS(reportName, parmId)
    );
  }

  getReportUrl(parmId: string, reportName: string, userName: string): Observable<ApiResponse<any>> {
    return this.apiService.post<ApiResponse<any>>(
      '/api/v1/user-utilities/report-action/perform',
      { parmId, reportName, userName, action: 'R' }
    );
  }

  pollReportUntilComplete(reportName: string, parmId: string, maxAttempts = 20): Observable<any> {
    let attempts = 0;
    return timer(0, 3000).pipe(
      switchMap(() => {
        attempts++;
        return this.getReportStatus(reportName, parmId).pipe(
          catchError(() => of({ item: { statusCode: attempts >= maxAttempts ? 'F' : 'S' } }))
        );
      }),
      takeWhile(response => {
        const status = response?.item?.statusCode;
        return status !== 'C' && status !== 'F' && attempts < maxAttempts;
      }, true),
      last()
    );
  }
}
