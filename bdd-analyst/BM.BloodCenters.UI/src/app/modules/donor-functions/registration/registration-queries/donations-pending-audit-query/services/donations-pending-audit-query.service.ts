import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  DonationsPendingAuditDto,
  DonationsPendingAuditQueryDto,
  DonationsPendingAuditSearchResponse,
  DonationsPendingAuditApiResponse,
  DriveOption,
  DonationTypeOption,
  ProcedureCodeOption,
  ReturnResult
} from '../models/donations-pending-audit-query.model';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';

@Injectable({
  providedIn: 'root'
})
export class DonationsPendingAuditQueryService {
  private readonly apiService = inject(ApiService);

  searchDonationsPendingAudit(
    params: DonationsPendingAuditQueryDto
  ): Observable<DonationsPendingAuditApiResponse> {
    const endpoint = API.DONOR_FUNCTIONS.DONATIONS_PENDING_AUDIT.SEARCH;

    return this.apiService.post<DonationsPendingAuditApiResponse>(endpoint, params).pipe(
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
    const endpoint = API.DONOR_FUNCTIONS.DONATIONS_PENDING_AUDIT.DRIVES_DROPDOWN;
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
