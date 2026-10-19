import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';

import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  ApiResponse,
  ApiSingleResponse,
  BloodProductCreditDto,
  CreateBloodProductCreditDto,
  CustomerLovOption,
  ReasonCodeOption,
  UpdateBloodProductCreditDto,
  ValidateUnitResponseDto,
} from '../models/blood-product-credit.model';

/** Extract the human-readable message from an API error response. */
function apiError(err: any, fallback: string): Observable<never> {
  const message: string =
    err?.error?.message ||
    err?.error?.error ||
    err?.message ||
    fallback;
  return throwError(() => new Error(message));
}

@Injectable({ providedIn: 'root' })
export class BloodProductCreditService {
  private readonly apiService = inject(ApiService);

  /** GET /blood-product-credit/customers */
  getCustomers(): Observable<CustomerLovOption[]> {
    return this.apiService
      .get<ApiResponse<CustomerLovOption>>(API.BLOOD_PRODUCT_CREDIT.CUSTOMERS)
      .pipe(map(res => res.data ?? []));
  }

  /** GET /blood-product-credit/reason-codes */
  getReasonCodes(): Observable<ReasonCodeOption[]> {
    return this.apiService
      .get<ApiResponse<ReasonCodeOption>>(API.BLOOD_PRODUCT_CREDIT.REASON_CODES)
      .pipe(map(res => res.data ?? []));
  }

  /** GET /blood-product-credit/validate-unit/{unitId}?customerId=... */
  validateUnit(unitId: string, customerId: string): Observable<ValidateUnitResponseDto> {
    const params = new HttpParams().set('customerId', customerId);
    return this.apiService
      .get<ApiSingleResponse<ValidateUnitResponseDto>>(
        API.BLOOD_PRODUCT_CREDIT.VALIDATE_UNIT(unitId),
        { params }
      )
      .pipe(
        map(res => {
          if (!res.success || !res.data) {
            throw new Error(res.error || 'Unit not found or not eligible');
          }
          return res.data;
        }),
        catchError(err => apiError(err, 'Unit not found or not eligible'))
      );
  }

  /** GET /blood-product-credit?customerId=...&tranType=...&skip=...&take=...&sortColumn=...&sortOrder=... */
  getAll(
    customerId: string,
    tranType: string,
    skip = 0,
    take = 10,
    sortColumn?: string,
    sortOrder?: string,
  ): Observable<{ data: BloodProductCreditDto[]; totalCount: number }> {
    let params = new HttpParams()
      .set('customerId', customerId)
      .set('tranType', tranType)
      .set('skip', skip.toString())
      .set('take', take.toString());
    if (sortColumn) params = params.set('sortColumn', sortColumn);
    if (sortOrder)  params = params.set('sortOrder', sortOrder);

    return this.apiService
      .get<ApiResponse<BloodProductCreditDto>>(API.BLOOD_PRODUCT_CREDIT.BASE, { params })
      .pipe(
        map(res => ({ data: res.data ?? [], totalCount: res.totalCount ?? 0 })),
        catchError(err => apiError(err, 'Failed to load records'))
      );
  }

  /** POST /blood-product-credit */
  create(request: CreateBloodProductCreditDto): Observable<BloodProductCreditDto> {
    return this.apiService
      .post<ApiResponse<BloodProductCreditDto>>(API.BLOOD_PRODUCT_CREDIT.BASE, request)
      .pipe(
        map(res => {
          const item = res.data?.[0];
          if (!item) throw new Error(res.error || 'Failed to create record');
          return item;
        }),
        catchError(err => apiError(err, 'Failed to create record'))
      );
  }

  /** PUT /blood-product-credit/{unitId} */
  update(unitId: string, request: UpdateBloodProductCreditDto): Observable<void> {
    return this.apiService
      .put<ApiResponse<void>>(API.BLOOD_PRODUCT_CREDIT.BY_UNIT_ID(unitId), request)
      .pipe(
        map(() => undefined),
        catchError(err => apiError(err, 'Failed to update record'))
      );
  }

  /** DELETE /blood-product-credit/{unitId} */
  delete(unitId: string): Observable<void> {
    return this.apiService
      .delete<ApiResponse<void>>(API.BLOOD_PRODUCT_CREDIT.BY_UNIT_ID(unitId))
      .pipe(
        map(() => undefined),
        catchError(err => apiError(err, 'Failed to delete record'))
      );
  }

  /** GET /blood-product-credit/{unitId}/notes */
  getNote(unitId: string): Observable<string | null> {
    return this.apiService
      .get<ApiSingleResponse<{ noteText: string }>>(API.BLOOD_PRODUCT_CREDIT.NOTES(unitId))
      .pipe(
        map(res => res.data?.noteText ?? null),
        catchError(() => throwError(() => new Error('Failed to load note')))
      );
  }

  /** POST /blood-product-credit/{unitId}/notes — API expects { noteText: string } */
  addNote(unitId: string, note: string): Observable<void> {
    return this.apiService
      .post<ApiResponse<void>>(API.BLOOD_PRODUCT_CREDIT.NOTES(unitId), { noteText: note })
      .pipe(
        map(() => undefined),
        catchError(err => apiError(err, 'Failed to save note'))
      );
  }

  /** GET /blood-product-credit/{unitId}/product-history */
  getProductHistory(unitId: string): Observable<BloodProductCreditDto[]> {
    return this.apiService
      .get<ApiResponse<BloodProductCreditDto>>(API.BLOOD_PRODUCT_CREDIT.PRODUCT_HISTORY(unitId))
      .pipe(
        map(res => res.data ?? []),
        catchError(err => apiError(err, 'Failed to load product history'))
      );
  }
}
