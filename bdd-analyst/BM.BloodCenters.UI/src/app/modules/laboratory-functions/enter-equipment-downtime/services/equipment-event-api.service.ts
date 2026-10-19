import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  EquipmentEventDto,
  CreateEquipmentEventRequestDto,
  UpdateEquipmentEventRequestDto,
  EquipmentEventQueryDto,
  LookupItem,
  EquipmentItem
} from '../models/equipment-event.model';

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = any> {
  success?: boolean;
  message?: string;
  error?: string;
  statusCode?: number;
  data?: T;
  totalCount?: number;
  total?: number;
  errorResponse?: {
    errorCode: string;
    error: string;
  };
}

/**
 * Equipment Event API Service
 * Handles all HTTP operations for equipment downtime and service events
 * Based on API Documentation: MLT-12631
 */
@Injectable({
  providedIn: 'root'
})
export class EquipmentEventApiService {
  private readonly apiService = inject(ApiService);

  /**
   * Get a single equipment event by event reference
   * @param eventReference - Unique event identifier
   * @returns Observable with EquipmentEventDto
   */
  getEventById(eventReference: string): Observable<ApiResponse> {
    const endpoint = API.EQUIPMENT_EVENTS.BY_ID(eventReference);

    return this.apiService.get<ApiResponse>(endpoint).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Get all events for a specific equipment unit
   * @param equipReference - Equipment reference number
   * @returns Observable with array of EquipmentEventDto
   */
  getEventsByEquipment(equipReference: string): Observable<{ data: EquipmentEventDto[]; totalCount: number }> {
    const endpoint = API.EQUIPMENT_EVENTS.BY_EQUIPMENT(equipReference);

    return this.apiService.get<ApiResponse<EquipmentEventDto[]>>(endpoint).pipe(
      map(response => ({
        data: response.data || [],
        totalCount: response.totalCount || response.total || 0
      })),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Create a new equipment event
   * @param dto - Create request DTO
   * @returns Observable with created event reference
   */
  createEvent(dto: CreateEquipmentEventRequestDto): Observable<ApiResponse> {
    const endpoint = API.EQUIPMENT_EVENTS.CREATE;

    return this.apiService.post<ApiResponse>(endpoint, dto).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Update an existing equipment event
   * @param eventReference - Event identifier to update
   * @param dto - Update request DTO
   * @returns Observable with ApiResponse
   */
  updateEvent(eventReference: string, dto: UpdateEquipmentEventRequestDto): Observable<ApiResponse> {
    const endpoint = API.EQUIPMENT_EVENTS.UPDATE(eventReference);

    return this.apiService.put<ApiResponse>(endpoint, dto).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Delete an equipment event (soft delete)
   * @param eventReference - Event identifier to delete
   * @returns Observable with ApiResponse
   */
  deleteEvent(eventReference: string): Observable<ApiResponse> {
    const endpoint = API.EQUIPMENT_EVENTS.DELETE(eventReference);

    return this.apiService.delete<ApiResponse>(endpoint).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Search/filter equipment events with pagination
   * @param take - Number of records to retrieve
   * @param skip - Number of records to skip
   * @param queryParams - Query parameters for filtering and sorting
   * @returns Observable with data and totalRecords
   */
  searchEvents(
    take: number,
    skip: number,
    queryParams: EquipmentEventQueryDto
  ): Observable<{ data: EquipmentEventDto[]; totalRecords: number }> {
    const endpoint = API.EQUIPMENT_EVENTS.SEARCH(take, skip);

    return this.apiService.post<ApiResponse<EquipmentEventDto[]>>(endpoint, queryParams).pipe(
      map(response => ({
        data: response.data || [],
        totalRecords: response.totalCount || response.total || 0
      })),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  // =========================================================================
  // LOV Endpoints - Gap fix for MLT-12631
  // Maps to legacy Oracle Forms LOVs
  // =========================================================================

  /**
   * Get all equipment types for dropdown
   * Maps to legacy LOV: CTRL_BLK_1_EQUIPMENT_T_LOV0
   * @returns Observable with array of LookupItem
   */
  getEquipmentTypes(): Observable<LookupItem[]> {
    const endpoint = API.EQUIPMENT_EVENTS.EQUIPMENT_TYPES;

    return this.apiService.get<ApiResponse<LookupItem[]>>(endpoint).pipe(
      map(response => response.data || []),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Get equipment list filtered by equipment type
   * Maps to legacy LOV: CTRL_BLK_1_EQUIPMENT_ID_1
   * @param equipmentType - Equipment type code
   * @returns Observable with array of EquipmentItem
   */
  getEquipmentList(equipmentType: string): Observable<EquipmentItem[]> {
    const endpoint = API.EQUIPMENT_EVENTS.EQUIPMENT_LIST(equipmentType);

    return this.apiService.get<ApiResponse<EquipmentItem[]>>(endpoint).pipe(
      map(response => response.data || []),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Get all downtime codes for dropdown
   * Maps to legacy LOV: EQUIP_EVENT_DOWNTIME_CO_LOV4
   * @returns Observable with array of LookupItem
   */
  getDowntimeCodes(): Observable<LookupItem[]> {
    const endpoint = API.EQUIPMENT_EVENTS.DOWNTIME_CODES;

    return this.apiService.get<ApiResponse<LookupItem[]>>(endpoint).pipe(
      map(response => response.data || []),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Get all service codes for dropdown
   * Maps to legacy LOV: EQUIP_EVENT_SERVICE_COD_LOV5
   * @returns Observable with array of LookupItem
   */
  getServiceCodes(): Observable<LookupItem[]> {
    const endpoint = API.EQUIPMENT_EVENTS.SERVICE_CODES;

    return this.apiService.get<ApiResponse<LookupItem[]>>(endpoint).pipe(
      map(response => response.data || []),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }
}
