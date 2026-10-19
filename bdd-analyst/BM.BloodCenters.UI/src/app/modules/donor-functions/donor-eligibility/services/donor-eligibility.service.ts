import { Injectable, inject } from '@angular/core';
import { Observable, map, catchError, throwError } from 'rxjs';

import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';

import {
  ReturnResult,
  DonorBasicInfoResponse,
  DonationType,
  DonationTypeResponse,
  ProcedureCodeResponse,
  CheckEligibilityRequest,
  EligibilityCheckResult,
  DonorInterdiction
} from '../models/donor-eligibility.model';

@Injectable({
  providedIn: 'root'
})
export class DonorEligibilityService {
  private readonly apiService = inject(ApiService);

  getDonationTypes(): Observable<DonationType[]> {
    return this.apiService
      .get<ReturnResult<DonationTypeResponse>>(API.DONOR_FUNCTIONS.DONOR_ELIGIBILITY.DONATION_TYPES)
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.message || 'Failed to load donation types');
          }
          return (response.data || []).map(dt => ({
            code: dt.donationType,
            description: dt.description
          }));
        }),
        catchError(error => {
          const message = error?.error?.message || error?.message || 'Failed to load donation types';
          return throwError(() => new Error(message));
        })
      );
  }

  getProcedureCodes(donationType: string): Observable<ProcedureCodeResponse[]> {
    return this.apiService
      .get<ReturnResult<ProcedureCodeResponse>>(API.DONOR_FUNCTIONS.DONOR_ELIGIBILITY.PROCEDURE_CODES(donationType))
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.message || 'Failed to load procedure codes');
          }
          return response.data || [];
        }),
        catchError(error => {
          const message = error?.error?.message || error?.message || 'Failed to load procedure codes';
          return throwError(() => new Error(message));
        })
      );
  }

  checkEligibility(request: CheckEligibilityRequest): Observable<EligibilityCheckResult> {
    return this.apiService
      .post<ReturnResult<EligibilityCheckResult>>(API.DONOR_FUNCTIONS.DONOR_ELIGIBILITY.CHECK, request)
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.message || 'Failed to check eligibility');
          }
          return response.item ?? response.data?.[0] ?? {
            eligStatus: 'N',
            deferralDate: null,
            interType: null,
            deferralReason: null
          };
        }),
        catchError(error => {
          const message = error?.error?.message || error?.message || 'Failed to check eligibility';
          return throwError(() => new Error(message));
        })
      );
  }

  getInterdictions(donorId: string): Observable<DonorInterdiction[]> {
    return this.apiService
      .get<ReturnResult<DonorInterdiction>>(API.DONOR_FUNCTIONS.DONOR_ELIGIBILITY.INTERDICTIONS(donorId))
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.message || 'Failed to load interdictions');
          }
          return response.data || [];
        }),
        catchError(error => {
          const message = error?.error?.message || error?.message || 'Failed to load interdictions';
          return throwError(() => new Error(message));
        })
      );
  }

  getDonorInfo(donorId: string): Observable<DonorBasicInfoResponse> {
    return this.apiService
      .get<ReturnResult<DonorBasicInfoResponse>>(API.DONOR_FUNCTIONS.DONOR_ELIGIBILITY.DONOR_INFO(donorId))
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.message || 'Failed to load donor info');
          }
          return response.item ?? response.data?.[0] ?? {
            donorId,
            lastName: '',
            firstName: '',
            dateOfBirth: null,
            gender: null,
            bloodType: null,
            chapterId: '',
            donorWeight: null
          } as DonorBasicInfoResponse;
        }),
        catchError(error => {
          const message = error?.error?.message || error?.message || 'Failed to load donor info';
          return throwError(() => new Error(message));
        })
      );
  }
}
