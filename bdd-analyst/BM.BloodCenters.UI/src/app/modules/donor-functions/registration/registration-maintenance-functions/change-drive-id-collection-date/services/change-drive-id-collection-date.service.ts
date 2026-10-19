import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { Observable, throwError, catchError, map } from 'rxjs';
import { SKIP_ERROR_TOAST } from 'src/app/core/constants/http-context.constants';
import { environment } from '../../../../../../../environments/environment';
import { API } from '../../../../../../core/constants/api.constants';
import {
  BatchInfo,
  DriveOption,
  DonationTypeOption,
  ProcedureCodeOption,
  RetrieveResponse,
  UpdateDriveRequest,
  ValidateRequest,
  ValidateResponse,
  ApiResponse,
  UpdteDrivParam
} from '../models/change-drive-id-collection-date.model';

@Injectable({
  providedIn: 'root'
})
export class ChangeDriveIdCollectionDateService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  getBatches(take: number, skip: number, chapterId: string): Observable<ApiResponse<{ items: BatchInfo[]; total: number }>> {
    const url = `${this.baseUrl}${API.DONOR_FUNCTIONS.CHANGE_DRIVE.BATCHES(take, skip)}`;
    const params = new HttpParams().set('chapterId', chapterId);
    return this.http.get<ApiResponse<{ items: BatchInfo[]; total: number }>>(url, { params }).pipe(
      catchError(error => {
        console.error('Error fetching batches:', error);
        return throwError(() => error);
      })
    );
  }

  getBatchBySetId(setId: string, chapterId: string): Observable<ApiResponse<RetrieveResponse>> {
    const url = `${this.baseUrl}${API.DONOR_FUNCTIONS.CHANGE_DRIVE.BATCH_BY_SET_ID(setId)}`;
    const params = new HttpParams().set('chapterId', chapterId);
    return this.http.get<ApiResponse<RetrieveResponse>>(url, { params }).pipe(
      catchError(error => {
        console.error('Error fetching batch by setId:', error);
        return throwError(() => error);
      })
    );
  }

  getByUnitId(unitId: string, chapterId: string): Observable<RetrieveResponse> {
    const url = `${this.baseUrl}${API.DONOR_FUNCTIONS.CHANGE_DRIVE.BY_UNIT_ID(unitId)}`;
    const params = new HttpParams().set('chapterId', chapterId);
    return this.http.get<RetrieveResponse>(url, {
      params,
      context: new HttpContext().set(SKIP_ERROR_TOAST, true)
    }).pipe(
      catchError(error => {
        console.error('Error fetching by unitId:', error);
        return throwError(() => error);
      })
    );
  }

  getByDeferralId(deferralId: string, chapterId: string): Observable<RetrieveResponse> {
    const url = `${this.baseUrl}${API.DONOR_FUNCTIONS.CHANGE_DRIVE.BY_DEFERRAL_ID(deferralId)}`;
    const params = new HttpParams().set('chapterId', chapterId);
    return this.http.get<RetrieveResponse>(url, {
      params,
      context: new HttpContext().set(SKIP_ERROR_TOAST, true)
    }).pipe(
      catchError(error => {
        console.error('Error fetching by deferralId:', error);
        return throwError(() => error);
      })
    );
  }

  getByDriveId(driveId: string, chapterId: string): Observable<RetrieveResponse> {
    const url = `${this.baseUrl}${API.DONOR_FUNCTIONS.CHANGE_DRIVE.BY_DRIVE_ID(driveId)}`;
    const params = new HttpParams().set('chapterId', chapterId);
    return this.http.get<RetrieveResponse>(url, { params }).pipe(
      catchError(error => {
        console.error('Error fetching by driveId:', error);
        return throwError(() => error);
      })
    );
  }

  getDrivesByDate(driveDate: string, chapterId: string): Observable<ApiResponse<DriveOption[]>> {
    const url = `${this.baseUrl}${API.DONOR_FUNCTIONS.CHANGE_DRIVE.DRIVES_BY_DATE(driveDate)}`;
    const params = new HttpParams().set('chapterId', chapterId);
    return this.http.get<ApiResponse<DriveOption[]>>(url, { params }).pipe(
      catchError(error => {
        console.error('Error fetching drives by date:', error);
        return throwError(() => error);
      })
    );
  }

  getUpdteDrivParam(): Observable<ApiResponse<UpdteDrivParam>> {
    const url = `${this.baseUrl}${API.DONOR_FUNCTIONS.CHANGE_DRIVE.UPDTE_DRIV_PARAM}`;
    return this.http.get<ApiResponse<UpdteDrivParam>>(url).pipe(
      catchError(error => {
        console.error('Error fetching UPDTE_DRIV param:', error);
        return throwError(() => error);
      })
    );
  }

  validateChange(request: ValidateRequest): Observable<ApiResponse<ValidateResponse>> {
    const url = `${this.baseUrl}${API.DONOR_FUNCTIONS.CHANGE_DRIVE.VALIDATE}`;
    return this.http.post<ApiResponse<ValidateResponse>>(url, request).pipe(
      catchError(error => {
        console.error('Error validating change:', error);
        return throwError(() => error);
      })
    );
  }

  updateDrive(request: UpdateDriveRequest): Observable<ApiResponse<{ message: string; updatedCount: number }>> {
    const url = `${this.baseUrl}${API.DONOR_FUNCTIONS.CHANGE_DRIVE.UPDATE}`;
    return this.http.put<ApiResponse<{ message: string; updatedCount: number }>>(url, request).pipe(
      catchError(error => {
        console.error('Error updating drive:', error);
        return throwError(() => error);
      })
    );
  }

  validateUnitId(unitId: string): Observable<{ success: boolean; message: string; errorCode: string | null; item: { parsedUnitId: string } | null }> {
    const url = `${this.baseUrl}${API.APPLICATION_ADMIN.DONOR_LIB_VALIDATE_UNIT}`;
    return this.http.post<{ success: boolean; message: string; errorCode: string | null; item: { parsedUnitId: string } | null }>(
      url,
      { unitId, validateFfValue: 'DONOR' },
      { context: new HttpContext().set(SKIP_ERROR_TOAST, true) }
    ).pipe(
      catchError(error => {
        console.error('Error validating unit ID:', error);
        return throwError(() => error);
      })
    );
  }

  getDonationTypes(): Observable<DonationTypeOption[]> {
    const url = `${this.baseUrl}${API.DONOR_FUNCTIONS.CHANGE_DRIVE.DONATION_TYPES}`;
    return this.http.get<ApiResponse<DonationTypeOption[]>>(url).pipe(
      map(response => (response.data || []).map(item => ({
        ...item,
        code: (item.code || '').toUpperCase().trim()
      }))),
      catchError(error => {
        console.error('Error fetching donation types:', error);
        return throwError(() => error);
      })
    );
  }

  getProcedureCodes(): Observable<ProcedureCodeOption[]> {
    const url = `${this.baseUrl}${API.DONOR_FUNCTIONS.CHANGE_DRIVE.PROCEDURE_CODES}`;
    return this.http.get<ApiResponse<ProcedureCodeOption[]>>(url).pipe(
      map(response => (response.data || []).map(item => ({
        ...item,
        code: (item.code || '').toUpperCase().trim()
      }))),
      catchError(error => {
        console.error('Error fetching procedure codes:', error);
        return throwError(() => error);
      })
    );
  }
}
