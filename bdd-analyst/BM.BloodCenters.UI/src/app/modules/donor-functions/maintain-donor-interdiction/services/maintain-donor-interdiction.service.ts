import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from '../../../../shared/services/api.service';
import { API } from '../../../../core/constants/api.constants';
import {
  DonorDetails,
  DonorInterdiction,
  ValidInterdictionCode,
  CollectionDate,
  TerminationReason,
  PlaceInterdictionRequest,
  ReleaseInterdictionRequest,
  TerminateInterdictionRequest,
} from '../models/maintain-donor-interdiction.models';

@Injectable({ providedIn: 'root' })
export class MaintainDonorInterdictionService {
  constructor(private apiService: ApiService) {}

  getDonorDetails(donorId: string): Observable<DonorDetails> {
    return this.apiService
      .get<{ item?: DonorDetails }>(API.MAINTAIN_DONOR_INTERDICTION.DONOR_DETAILS(donorId))
      .pipe(
        map((res) => res?.item || (res as unknown as DonorDetails)),
        catchError((err) => throwError(() => err)),
      );
  }

  getInterdictions(
    donorId: string,
    showTerminated = false,
    userId?: string,
    originated?: string,
    groupMode?: string,
    groupId?: string,
    search?: string,
    effectiveDatePeriod?: string,
    effectiveDate?: string,
    terminationDatePeriod?: string,
    terminationDate?: string,
  ): Observable<DonorInterdiction[]> {
    let params = new HttpParams().set('showTerminated', showTerminated.toString());
    if (userId) params = params.set('userId', userId);
    if (originated) params = params.set('originated', originated);
    if (groupMode) params = params.set('groupMode', groupMode);
    if (groupId) params = params.set('groupId', groupId);
    if (search) params = params.set('search', search);
    if (effectiveDatePeriod) params = params.set('effectiveDatePeriod', effectiveDatePeriod);
    if (effectiveDate) params = params.set('effectiveDate', effectiveDate);
    if (terminationDatePeriod) params = params.set('terminationDatePeriod', terminationDatePeriod);
    if (terminationDate) params = params.set('terminationDate', terminationDate);

    return this.apiService
      .get<{ data?: DonorInterdiction[] }>(API.MAINTAIN_DONOR_INTERDICTION.INTERDICTIONS(donorId), { params })
      .pipe(
        map((res) => res?.data || []),
        catchError((err) => throwError(() => err)),
      );
  }

  getValidCodes(): Observable<ValidInterdictionCode[]> {
    return this.apiService
      .get<{ data?: ValidInterdictionCode[] }>(API.MAINTAIN_DONOR_INTERDICTION.VALID_CODES)
      .pipe(
        map((res) => res?.data || []),
        catchError((err) => throwError(() => err)),
      );
  }

  getCollectionDates(donorId: string, unitId: string): Observable<CollectionDate[]> {
    return this.apiService
      .get<{ data?: CollectionDate[] }>(API.MAINTAIN_DONOR_INTERDICTION.COLLECTION_DATES(donorId, unitId))
      .pipe(
        map((res) => res?.data || []),
        catchError((err) => throwError(() => err)),
      );
  }

  placeInterdiction(request: PlaceInterdictionRequest): Observable<void> {
    return this.apiService
      .post<void>(API.MAINTAIN_DONOR_INTERDICTION.PLACE(request.donorId), request)
      .pipe(catchError((err) => throwError(() => err)));
  }

  releaseInterdiction(request: ReleaseInterdictionRequest): Observable<void> {
    return this.apiService
      .put<void>(API.MAINTAIN_DONOR_INTERDICTION.RELEASE(request.donorId), request)
      .pipe(catchError((err) => throwError(() => err)));
  }

  terminateInterdiction(request: TerminateInterdictionRequest): Observable<void> {
    return this.apiService
      .put<void>(API.MAINTAIN_DONOR_INTERDICTION.TERMINATE(request.donorId), request)
      .pipe(catchError((err) => throwError(() => err)));
  }

  getTerminationReasons(): Observable<TerminationReason[]> {
    return this.apiService
      .get<{ data?: TerminationReason[] }>(API.MAINTAIN_DONOR_INTERDICTION.TERMINATION_REASONS)
      .pipe(
        map((res) => res?.data || []),
        catchError((err) => throwError(() => err)),
      );
  }
}
