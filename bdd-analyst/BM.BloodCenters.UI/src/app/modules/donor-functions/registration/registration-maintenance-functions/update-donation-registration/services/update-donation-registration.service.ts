import { Injectable, inject } from '@angular/core';
import { HttpContext, HttpParams } from '@angular/common/http';
import { Observable, map, catchError, throwError } from 'rxjs';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import { SKIP_ERROR_TOAST } from 'src/app/core/constants/http-context.constants';
import { UpdateDonationRetrieveResponse, UpdateDonationSaveRequest } from '../models/update-donation-registration.model';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data: T;
  total: number;
  item?: T;
  errorResponse?: { errorCode: string; error: string };
}

export interface DonationInterdictionDto {
  transactionId: string;
  donorId?: string;
  interCode: string;
  interDesc?: string;
  interType?: string;
  programId?: string;
  insertDate?: string;
  insertUser?: string;
  auditKey?: number;
}

@Injectable({
  providedIn: 'root',
})
export class UpdateDonationRegistrationService {
  private readonly apiService = inject(ApiService);

  retrieveByUnitId(
    unitId: string,
    collectionDate: string
  ): Observable<ApiResponse<UpdateDonationRetrieveResponse>> {
    const params = new HttpParams().set('collDate', collectionDate);
    return this.apiService
      .get<ApiResponse<UpdateDonationRetrieveResponse>>(
        API.REGISTER_DONATION.GET_BY_UNIT(unitId),
        { params, context: new HttpContext().set(SKIP_ERROR_TOAST, true) }
      )
      .pipe(
        catchError((error) => {
          console.error('UpdateDonationRegistrationService.retrieveByUnitId failed:', error);
          return throwError(() => error);
        })
      );
  }

  updateDonation(
    transactionId: string,
    request: UpdateDonationSaveRequest
  ): Observable<ApiResponse<UpdateDonationRetrieveResponse>> {
    return this.apiService
      .put<ApiResponse<UpdateDonationRetrieveResponse>>(
        API.REGISTER_DONATION.UPDATE_DONATION(transactionId),
        request,
        { context: new HttpContext().set(SKIP_ERROR_TOAST, true) }
      )
      .pipe(
        catchError((error) => {
          console.error('UpdateDonationRegistrationService.updateDonation failed:', error);
          return throwError(() => error);
        })
      );
  }

  getInterdictions(transactionId: string): Observable<DonationInterdictionDto[]> {
    return this.apiService
      .get<ApiResponse<DonationInterdictionDto[]>>(
        API.DONOR_FUNCTIONS.UPDATE_DEFERRAL.GET_INTERDICTIONS(transactionId)
      )
      .pipe(
        map((res) => res.data ?? []),
        catchError((error) => {
          console.error('UpdateDonationRegistrationService.getInterdictions failed:', error);
          return throwError(() => error);
        })
      );
  }

}
