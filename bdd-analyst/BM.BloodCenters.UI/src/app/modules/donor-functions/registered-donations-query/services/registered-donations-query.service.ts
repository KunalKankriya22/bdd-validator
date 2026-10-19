import { Injectable, inject } from '@angular/core';
import { HttpContext, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  DonationQueryResult,
  DonationQueryRequest,
  DriveOption,
  UserOption,
  SetOption,
  UnitValidationApiResponse,
  PhlebotomyDetailsDto,
} from '../models/registered-donations-query.model';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import { SKIP_ERROR_TOAST } from 'src/app/core/constants/http-context.constants';

interface ReturnResult<T> {
  success?: boolean;
  message?: string;
  error?: string;
  errorCode?: string;
  statusCode?: number;
  data?: T[];
  item?: T;
  total?: number;
}

@Injectable({
  providedIn: 'root'
})
export class RegisteredDonationsQueryService {
  private readonly apiService = inject(ApiService);

  searchDonations(
    params: DonationQueryRequest
  ): Observable<{ data: DonationQueryResult[]; totalRecords: number }> {
    const endpoint = API.DONOR_FUNCTIONS.REGISTERED_DONATIONS_QUERY;

    return this.apiService.post<ReturnResult<DonationQueryResult>>(endpoint, params).pipe(
      map(response => ({
        data: response.data || [],
        totalRecords: response.total || 0
      })),
      catchError(error => throwError(() => error))
    );
  }

  getDrivesDropdown(
    driveDateFrom?: string | null,
    driveDateTo?: string | null
  ): Observable<{ data: DriveOption[] }> {
    const endpoint = API.DONOR_FUNCTIONS.REGISTERED_DONATIONS_QUERY_DRIVES;
    let params = new HttpParams();
    if (driveDateFrom) params = params.set('driveDateFrom', driveDateFrom);
    if (driveDateTo) params = params.set('driveDateTo', driveDateTo);

    return this.apiService.get<ReturnResult<DriveOption>>(endpoint, { params }).pipe(
      map(response => ({
        data: response.data || []
      })),
      catchError(error => throwError(() => error))
    );
  }

  getUsersDropdown(
    driveDateFrom?: string | null,
    driveDateTo?: string | null
  ): Observable<{ data: UserOption[] }> {
    const endpoint = API.DONOR_FUNCTIONS.REGISTERED_DONATIONS_QUERY_USERS;
    let params = new HttpParams();
    if (driveDateFrom) params = params.set('driveDateFrom', driveDateFrom);
    if (driveDateTo) params = params.set('driveDateTo', driveDateTo);

    return this.apiService.get<ReturnResult<UserOption>>(endpoint, { params }).pipe(
      map(response => ({
        data: response.data || []
      })),
      catchError(error => throwError(() => error))
    );
  }

  getSetsDropdown(
    driveDateFrom?: string | null,
    driveDateTo?: string | null
  ): Observable<{ data: SetOption[] }> {
    const endpoint = API.DONOR_FUNCTIONS.REGISTERED_DONATIONS_QUERY_SETS;
    let params = new HttpParams();
    if (driveDateFrom) params = params.set('driveDateFrom', driveDateFrom);
    if (driveDateTo) params = params.set('driveDateTo', driveDateTo);

    return this.apiService.get<ReturnResult<SetOption>>(endpoint, { params }).pipe(
      map(response => ({
        data: response.data || []
      })),
      catchError(error => throwError(() => error))
    );
  }

  getLovLimit(): Observable<number> {
    const endpoint = API.DONOR_FUNCTIONS.REGISTERED_DONATIONS_QUERY_LOV_LIMIT;

    return this.apiService.get<{ item?: number }>(endpoint).pipe(
      map(response => response.item || 21),
      catchError(() => of(21))
    );
  }

  validateUnitId(unitId: string, validateFfValue: string): Observable<UnitValidationApiResponse> {
    const endpoint = API.APPLICATION_ADMIN.DONOR_LIB_VALIDATE_UNIT;
    return this.apiService.post<UnitValidationApiResponse>(endpoint, { unitId, validateFfValue }, {
      context: new HttpContext().set(SKIP_ERROR_TOAST, true)
    });
  }

  getPhlebotomyDetails(transactionId: string): Observable<PhlebotomyDetailsDto> {
    const endpoint = API.DONOR_FUNCTIONS.REGISTERED_DONATIONS_QUERY_PHLEBOTOMY_DETAILS(transactionId);
    return this.apiService.get<ReturnResult<PhlebotomyDetailsDto>>(endpoint).pipe(
      map(response => {
        if (!response.success || !response.item) {
          throw new Error(response.message || 'Phlebotomy details not found');
        }
        return response.item;
      }),
      catchError(error => throwError(() => error))
    );
  }
}
