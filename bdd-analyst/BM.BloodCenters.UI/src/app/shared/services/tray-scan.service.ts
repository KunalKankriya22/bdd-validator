import { Injectable, inject } from '@angular/core';
import { HttpContext } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';

import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';
import { SKIP_ERROR_TOAST } from '@core/constants/http-context.constants';
import { LabelScanApiResponse } from '@shared/services/donor-lib-label-scan.service';

export interface TrayNumberScanResult {
  trayNumber: string | null;
}

@Injectable({ providedIn: 'root' })
export class TrayScanService {
  private readonly apiService = inject(ApiService);
  private readonly skipToastContext = { context: new HttpContext().set(SKIP_ERROR_TOAST, true) };

  private handleError(err: any): Observable<LabelScanApiResponse<TrayNumberScanResult>> {
    const errorBody = err?.error;
    return new Observable(observer => {
      observer.next({
        success: false,
        message: errorBody?.message || errorBody?.error || err?.message || 'Validation failed',
        statusCode: err?.status || 500,
        errorCode: errorBody?.errorCode || errorBody?.errorResponse?.errorCode || null,
        item: null,
        errorResponse: errorBody?.errorResponse || {
          errorCode: errorBody?.errorCode || '',
          error: errorBody?.message || 'Validation failed'
        }
      });
      observer.complete();
    });
  }

  validateTrayScan(scanValue: string): Observable<LabelScanApiResponse<TrayNumberScanResult>> {
    return this.apiService.post<LabelScanApiResponse<TrayNumberScanResult>>(
      API.SHARED_SCAN.VALIDATE_TRAY_SCAN,
      { scanValue },
      this.skipToastContext
    ).pipe(catchError(err => this.handleError(err)));
  }
}
