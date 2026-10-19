import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  DeferralsPendingAuditDto,
  DeferralsPendingAuditQueryDto,
  DeferralsPendingAuditSearchResponse,
  DeferralsPendingAuditApiResponse,
  DriveOption,
  DonationTypeOption,
  ProcedureCodeOption,
  ReturnResult
} from '../models/deferrals-pending-audit-query.model';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';

@Injectable({
  providedIn: 'root'
})
export class DeferralsPendingAuditQueryService {
  private readonly apiService = inject(ApiService);

  searchDeferralsPendingAudit(
    params: DeferralsPendingAuditQueryDto
  ): Observable<DeferralsPendingAuditApiResponse> {
    const endpoint = API.DONOR_FUNCTIONS.DEFERRALS_PENDING_AUDIT.SEARCH;

    return this.apiService.post<DeferralsPendingAuditApiResponse>(endpoint, params).pipe(
      map(response => ({
        success: response.success,
        message: response.message,
        statusCode: response.statusCode,
        data: {
          resp: response.data?.resp || [],
          donationType: response.data?.donationType || [],
          procedureCode: response.data?.procedureCode || []
        },
        totalCount: response.totalCount || 0
      })),
      catchError(error => throwError(() => error))
    );
  }

  getDrivesDropdown(
    fromDate?: string | null,
    toDate?: string | null
  ): Observable<{ data: DriveOption[] }> {
    const endpoint = API.DONOR_FUNCTIONS.DEFERRALS_PENDING_AUDIT.DRIVES_DROPDOWN;
    let params = new HttpParams();
    if (fromDate) params = params.set('fromDate', fromDate);
    if (toDate) params = params.set('toDate', toDate);

    return this.apiService.get<ReturnResult<DriveOption>>(endpoint, { params }).pipe(
      map(response => ({
        data: response.data || []
      })),
      catchError(error => throwError(() => error))
    );
  }
}
