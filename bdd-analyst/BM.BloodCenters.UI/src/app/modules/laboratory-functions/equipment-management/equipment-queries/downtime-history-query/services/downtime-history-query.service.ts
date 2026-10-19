import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { API } from '@core/constants/api.constants';
import {
  DowntimeHistoryModel,
  DowntimeHistoryResponse,
  DowntimeHistoryParamsDto,
  EquipmentTypeLookup,
  EquipmentIdLookup,
  EquipmentReferenceLookup
} from '../models/downtime-history-query.model';

@Injectable()
export class DowntimeHistoryQueryService {
  constructor(private http: HttpClient) {}

  /**
   * Get list of equipment types that have downtime events
   * Maps to CTRL_BLK_1_EQUIPMENT_T_LOV0 record group in Oracle Forms
   */
  getEquipmentTypes(): Observable<EquipmentTypeLookup[]> {
    return this.http
      .get<{ success: boolean; message: string; statusCode: number; data: EquipmentTypeLookup[] }>(
        API.DOWNTIME_HISTORY_QUERY.EQUIPMENT_TYPES
      )
      .pipe(
        map(response => response.data || []),
        catchError(this.handleError)
      );
  }

  /**
   * Get equipment IDs for selected equipment type
   * Maps to CTRL_BLK_1_EQUIPMENT_I_LOV1 record group in Oracle Forms
   */
  getEquipmentIds(equipmentType: string): Observable<EquipmentIdLookup[]> {
    return this.http
      .get<{ success: boolean; message: string; statusCode: number; data: any[] }>(
        API.DOWNTIME_HISTORY_QUERY.EQUIPMENT_BY_TYPE(equipmentType)
      )
      .pipe(
        map(response => {
          const data = response.data || [];
          // Transform backend response to dropdown format
          return data.map(item => ({
            code: item.equipId,
            description: `${item.equipId} - ${item.equipReference || ''}`
          }));
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Get equipment references for selected type and ID
   * Maps to CTRL_BLK_1_EQUIPMENT_R_LOV2 record group in Oracle Forms
   */
  getEquipmentReferences(equipmentType: string, equipmentId: string): Observable<EquipmentReferenceLookup[]> {
    const params = new HttpParams()
      .set('equipmentType', equipmentType)
      .set('equipmentId', equipmentId);

    return this.http
      .get<{ success: boolean; message: string; statusCode: number; data: any[] }>(
        API.DOWNTIME_HISTORY_QUERY.EQUIPMENT_REFERENCES,
        { params }
      )
      .pipe(
        map(response => {
          const data = response.data || [];
          // Transform backend response to dropdown format
          return data.map(item => ({
            code: item.equipReference,
            description: item.equipReference || ''
          }));
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Get downtime history based on filter criteria
   * Maps to DISPLAY_DATA block query in Oracle Forms
   *
   * Backend query structure from Oracle Forms WhereClause:
   * - Filter by equipment_reference (from equipment table join)
   * - Where equipment_event.downtime_code is not null
   * - Filter by start date: trunc(startDate) <= equipment_event.downtime_start
   * - Filter by end date: endDate >= trunc(equipment_event.downtime_start)
   * - Order by: equipment_event.equip_reference, equipment_event.downtime_code,
   *             equipment_event.downtime_start desc
   */
  getDowntimeHistory(params: DowntimeHistoryParamsDto, take: number = 1000, skip: number = 0): Observable<DowntimeHistoryResponse> {
    return this.http
      .post<DowntimeHistoryResponse>(API.DOWNTIME_HISTORY_QUERY.GET_DOWNTIME_HISTORY(take, skip), params)
      .pipe(
        map(response => {
          if (response && response.success) {
            return response;
          }
          return {
            success: false,
            message: response?.message || 'Failed to retrieve downtime history',
            data: [],
            total: 0
          };
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: any): Observable<never> {
    console.error('DowntimeHistoryQueryService error:', error);
    return throwError(() => error);
  }
}
