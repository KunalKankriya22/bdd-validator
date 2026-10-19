import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import {
  ServiceHistoryModel,
  ServiceHistoryParamsDto,
  ServiceHistoryResponse,
  EquipmentTypeLookup,
  EquipmentIdLookup,
  EquipmentReferenceLookup
} from '../models/service-history-query.model';
import { API } from '@core/constants/api.constants';

/**
 * Service History Query Service
 * Handles all API calls for equipment service history
 */
@Injectable()
export class ServiceHistoryQueryService {
  constructor(private http: HttpClient) {}

  /**
   * Get service history records with filters
   * @param params - Filter parameters
   * @returns Observable of ServiceHistoryResponse
   */
  getServiceHistory(
    params: ServiceHistoryParamsDto
  ): Observable<ServiceHistoryResponse> {
    return this.http
      .post<ServiceHistoryResponse>(
        API.SERVICE_HISTORY_QUERY.GET_SERVICE_HISTORY,
        params
      )
      .pipe(
        map((response) => ({
          success: response.success,
          message: response.message,
          statusCode: response.statusCode,
          data: response.data || [],
          total: response.total || 0
        })),
        catchError((error) => {
          console.error('Error fetching service history:', error);
          throw error;
        })
      );
  }

  /**
   * Get equipment types for dropdown/LOV
   * @returns Observable of EquipmentTypeLookup array
   */
  getEquipmentTypes(): Observable<EquipmentTypeLookup[]> {
    return this.http
      .get<{ success: boolean; message: string; statusCode: number; data: EquipmentTypeLookup[] }>(
        API.SERVICE_HISTORY_QUERY.EQUIPMENT_TYPES
      )
      .pipe(
        map((response) => response.data || []),
        catchError((error) => {
          console.error('Error fetching equipment types:', error);
          return of([]);
        })
      );
  }

  /**
   * Get equipment IDs for a specific equipment type
   * @param equipmentType - Equipment type code
   * @returns Observable of EquipmentIdLookup array
   */
  getEquipmentIds(equipmentType: string): Observable<EquipmentIdLookup[]> {
    return this.http
      .get<{ success: boolean; message: string; statusCode: number; data: EquipmentIdLookup[] }>(
        API.SERVICE_HISTORY_QUERY.EQUIPMENT_IDS(equipmentType)
      )
      .pipe(
        map((response) => response.data || []),
        catchError((error) => {
          console.error('Error fetching equipment IDs:', error);
          return of([]);
        })
      );
  }

  /**
   * Get equipment references for a specific equipment type and ID
   * @param equipmentType - Equipment type code
   * @param equipmentId - Equipment ID
   * @returns Observable of EquipmentReferenceLookup array
   */
  getEquipmentReferences(
    equipmentType: string,
    equipmentId: string
  ): Observable<EquipmentReferenceLookup[]> {
    return this.http
      .get<{ success: boolean; message: string; statusCode: number; data: EquipmentReferenceLookup[] }>(
        API.SERVICE_HISTORY_QUERY.EQUIPMENT_REFERENCES(equipmentType, equipmentId)
      )
      .pipe(
        map((response) => response.data || []),
        catchError((error) => {
          console.error('Error fetching equipment references:', error);
          return of([]);
        })
      );
  }

  /**
   * Validate equipment type exists
   * @param equipmentType - Equipment type code
   * @returns Observable with validation result
   */
  validateEquipmentType(equipmentType: string): Observable<{ success: boolean; message?: string; data?: any }> {
    const params = { equipmentType };
    return this.http
      .get<{ success: boolean; message?: string; data?: any }>(
        API.SERVICE_HISTORY_QUERY.VALIDATE_EQUIPMENT_TYPE,
        { params }
      )
      .pipe(
        catchError((error) => {
          console.error('Error validating equipment type:', error);
          return of({ success: false, message: error.error?.message || 'Validation failed' });
        })
      );
  }

  /**
   * Validate equipment exists for given type and ID
   * @param equipmentType - Equipment type code
   * @param equipmentId - Equipment ID
   * @returns Observable with validation result
   */
  validateEquipment(equipmentType: string, equipmentId: string): Observable<{ success: boolean; message?: string; data?: any }> {
    const params = { equipmentType, equipmentId };
    return this.http
      .get<{ success: boolean; message?: string; data?: any }>(
        API.SERVICE_HISTORY_QUERY.VALIDATE_EQUIPMENT,
        { params }
      )
      .pipe(
        catchError((error) => {
          console.error('Error validating equipment:', error);
          return of({ success: false, message: error.error?.message || 'Validation failed' });
        })
      );
  }

  /**
   * Validate equipment reference exists
   * @param equipmentType - Equipment type code
   * @param equipmentId - Equipment ID
   * @param equipmentReference - Equipment reference
   * @returns Observable with validation result
   */
  validateEquipmentReference(
    equipmentType: string,
    equipmentId: string,
    equipmentReference: string
  ): Observable<{ success: boolean; message?: string; data?: any }> {
    const params = { equipmentType, equipmentId, equipmentReference };
    return this.http
      .get<{ success: boolean; message?: string; data?: any }>(
        API.SERVICE_HISTORY_QUERY.VALIDATE_EQUIPMENT_REFERENCE,
        { params }
      )
      .pipe(
        catchError((error) => {
          console.error('Error validating equipment reference:', error);
          return of({ success: false, message: error.error?.message || 'Validation failed' });
        })
      );
  }
}
