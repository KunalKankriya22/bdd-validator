import { Injectable, inject } from '@angular/core';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { HttpHeaders, HttpParams } from '@angular/common/http';
import {
  EquipmentQcDataRequest,
  EquipmentQcDataResponse,
  EquipmentType,
  QcType,
  ReviewRequired,
  QcPeriodOption,
  Units,
  SaveEquipmentQcDataRequest,
  ReturnResult
} from '../models/equipment-qc-data.model';
import { ApiService } from '@shared/services/api.service';
import { HeaderService } from '@shared/services/header.service';
import { API } from '../../../../core/constants/api.constants';

@Injectable({ providedIn: 'root' })
export class EquipmentQcDataService {
  private readonly apiService = inject(ApiService);
  private readonly headerService = inject(HeaderService);

  private getHeaders(): HttpHeaders {
    const chapterId = this.headerService.chapterId();
    return new HttpHeaders({
      'X-Chapter-Id': chapterId,
    });
  }

  getEquipmentTypes(): Observable<EquipmentType[]> {
    return this.apiService
      .get<ReturnResult<EquipmentType[]>>(API.EQUIPMENT_QC.LOOKUPS.EQUIPMENT_TYPES, {
        headers: this.getHeaders(),
      })
      .pipe(
        map((response) => response.data || []),
        catchError(() => of([]))
      );
  }

  getQcTypes(): Observable<QcType[]> {
    return this.apiService
      .get<ReturnResult<QcType[]>>(API.EQUIPMENT_QC.LOOKUPS.QC_TYPES, {
        headers: this.getHeaders(),
      })
      .pipe(
        map((response) => response.data || []),
        catchError(() => of([]))
      );
  }

  getReviewRequired(): Observable<ReviewRequired[]> {
    return this.apiService
      .get<ReturnResult<ReviewRequired[]>>(API.EQUIPMENT_QC.LOOKUPS.REVIEW_REQUIRED, {
        headers: this.getHeaders(),
      })
      .pipe(
        map((response) => response.data || []),
        catchError(() => of([]))
      );
  }

  getQcPerformedEvery(): Observable<QcPeriodOption[]> {
    return this.apiService
      .get<ReturnResult<QcPeriodOption[]>>(API.EQUIPMENT_QC.LOOKUPS.QC_PERFORMED_EVERY, {
        headers: this.getHeaders(),
      })
      .pipe(
        map((response) => response.data || []),
        catchError(() => of([]))
      );
  }

  getUnits(): Observable<Units[]> {
    return this.apiService
      .get<ReturnResult<Units[]>>(API.EQUIPMENT_QC.LOOKUPS.UNITS, {
        headers: this.getHeaders(),
      })
      .pipe(
        map((response) => response.data || []),
        catchError(() => of([]))
      );
  }

  retrieveEquipmentQcData(request: EquipmentQcDataRequest): Observable<EquipmentQcDataResponse> {
    return this.apiService
      .post<ReturnResult<EquipmentQcDataResponse>>(API.EQUIPMENT_QC.RETRIEVE, request, {
        headers: this.getHeaders(),
      })
      .pipe(
        map((response) => response.item),
        catchError((error) => throwError(() => error))
      );
  }

  saveEquipmentQcData(request: SaveEquipmentQcDataRequest): Observable<boolean> {
    return this.apiService
      .post<ReturnResult<boolean>>(API.EQUIPMENT_QC.SAVE, request, {
        headers: this.getHeaders(),
      })
      .pipe(
        map((response) => response.success),
        catchError((error) => throwError(() => error))
      );
  }

  deleteEquipmentQcRow(seqNo: string, equipmentType: string, qcType: string): Observable<boolean> {
    return this.apiService
      .delete<ReturnResult<boolean>>(API.EQUIPMENT_QC.DELETE(seqNo), {
        params: new HttpParams().set('equipmentType', equipmentType).set('qcType', qcType),
        headers: this.getHeaders(),
      })
      .pipe(
        map((response) => response.success),
        catchError((error) => throwError(() => error))
      );
  }
}
