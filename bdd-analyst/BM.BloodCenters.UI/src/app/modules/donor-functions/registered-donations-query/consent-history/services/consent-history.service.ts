import { Injectable, inject } from '@angular/core';
import { HttpContext, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { SKIP_ERROR_TOAST } from '../../../../../core/constants/http-context.constants';
import { API } from '../../../../../core/constants/api.constants';
import {
  ConsentHistoryDto,
  ConsentHistoryDetailDto,
  ConsentHistoryQueryDto,
  ConsentHistoryDonorInfoDto,
  ReturnResult,
} from '../models/consent-history.model';

@Injectable({
  providedIn: 'root',
})
export class ConsentHistoryService {
  private readonly apiService = inject(ApiService);

  queryConsentHistory(
    query: ConsentHistoryQueryDto
  ): Observable<{ data: ConsentHistoryDto[]; total: number; message?: string }> {
    return this.apiService
      .post<ReturnResult<ConsentHistoryDto>>(API.CONSENT_HISTORY.BASE, query)
      .pipe(
        map((response) => ({
          data: response.data || [],
          total: response.total || 0,
          message: response.message,
        })),
        catchError((error) => {
          console.error('Error querying consent history:', error);
          return throwError(() => error);
        })
      );
  }

  getConsentDetail(
    donorId: string,
    transactionId: string,
    letterId: string
  ): Observable<ConsentHistoryDetailDto | null> {
    return this.apiService
      .get<{ success: boolean; data: ConsentHistoryDetailDto; message: string }>(
        API.CONSENT_HISTORY.DETAIL(donorId, transactionId, letterId)
      )
      .pipe(
        map((response) => response.data),
        catchError((error) => {
          console.error('Error fetching consent detail:', error);
          return throwError(() => error);
        })
      );
  }

  getSignatureUrl(
    donorId: string,
    transactionId: string,
    letterId: string,
    type: 'donor' | 'witness'
  ): string {
    return API.CONSENT_HISTORY.SIGNATURE(donorId, transactionId, letterId, type);
  }

  getSignature(
    donorId: string,
    transactionId: string,
    letterId: string,
    type: 'donor' | 'witness'
  ): Observable<Blob> {
    const url = API.CONSENT_HISTORY.SIGNATURE(donorId, transactionId, letterId, type);
    return this.apiService
      .get<Blob>(url, {
        responseType: 'blob' as any,
        context: new HttpContext().set(SKIP_ERROR_TOAST, true),
      })
      .pipe(
        catchError((error) => {
          return throwError(() => error);
        })
      );
  }

  getDonorInfo(
    donorId: string
  ): Observable<ConsentHistoryDonorInfoDto | null> {
    return this.apiService
      .get<ReturnResult<ConsentHistoryDonorInfoDto>>(API.CONSENT_HISTORY.DONOR_INFO(donorId))
      .pipe(
        map((response) => response.data?.[0] ?? null),
        catchError((error) => {
          console.error('Error fetching donor info:', error);
          return throwError(() => error);
        })
      );
  }
}
