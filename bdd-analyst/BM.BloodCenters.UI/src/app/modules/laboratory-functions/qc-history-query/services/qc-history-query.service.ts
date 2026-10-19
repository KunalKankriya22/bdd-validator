import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import {
  QcHistoryQueryDto,
  QcHistoryDto,
  QcHistoryApiResponse,
  EquipmentTypeDropdownDto,
  EquipmentIdDropdownDto,
  EquipmentRefDropdownDto,
  QcStatusDropdownDto,
} from '../models/qc-history-query.model';
import { API } from '../../../../core/constants/api.constants';

@Injectable({ providedIn: 'root' })
export class QcHistoryQueryService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  getList(
    take: number,
    skip: number,
    queryDto: QcHistoryQueryDto
  ): Observable<{ data: QcHistoryDto[]; totalRecords: number }> {
    const url = `${this.baseUrl}${API.QC_HISTORY_QUERY.LIST(take, skip)}`;
    return this.http
      .post<QcHistoryApiResponse<QcHistoryDto>>(url, queryDto)
      .pipe(
        map((response) => ({
          data: response.data || [],
          totalRecords: response.total || 0,
        })),
        catchError((error) => throwError(() => error))
      );
  }

  getEquipmentTypes(): Observable<EquipmentTypeDropdownDto[]> {
    const url = `${this.baseUrl}${API.QC_HISTORY_QUERY.EQUIPMENT_TYPES}`;
    return this.http
      .get<QcHistoryApiResponse<EquipmentTypeDropdownDto>>(url)
      .pipe(
        map((response) => response.data || []),
        catchError(() => throwError(() => new Error('Failed to load equipment types')))
      );
  }

  getEquipmentIds(
    equipmentType: string
  ): Observable<EquipmentIdDropdownDto[]> {
    const url = `${this.baseUrl}${API.QC_HISTORY_QUERY.EQUIPMENT_IDS(equipmentType)}`;
    return this.http
      .get<QcHistoryApiResponse<EquipmentIdDropdownDto>>(url)
      .pipe(
        map((response) => response.data || []),
        catchError(() => throwError(() => new Error('Failed to load equipment IDs')))
      );
  }

  getEquipmentReferences(
    equipmentType: string,
    equipmentId: string
  ): Observable<EquipmentRefDropdownDto[]> {
    const url = `${this.baseUrl}${API.QC_HISTORY_QUERY.EQUIPMENT_REFERENCES(equipmentType, equipmentId)}`;
    return this.http
      .get<QcHistoryApiResponse<EquipmentRefDropdownDto>>(url)
      .pipe(
        map((response) => response.data || []),
        catchError(() => throwError(() => new Error('Failed to load equipment references')))
      );
  }

  getQcStatuses(): Observable<QcStatusDropdownDto[]> {
    const url = `${this.baseUrl}${API.QC_HISTORY_QUERY.QC_STATUSES}`;
    return this.http
      .get<QcHistoryApiResponse<QcStatusDropdownDto>>(url)
      .pipe(
        map((response) => response.data || []),
        catchError(() => throwError(() => new Error('Failed to load QC statuses')))
      );
  }
}
