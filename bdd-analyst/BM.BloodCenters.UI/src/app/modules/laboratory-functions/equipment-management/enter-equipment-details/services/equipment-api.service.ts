import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  EquipmentDto,
  CreateEquipmentRequestDto,
  UpdateEquipmentRequestDto,
  EquipmentQueryDto,
  ApiResponse,
  DropdownOption
} from '../models/equipment.models';

@Injectable({
  providedIn: 'root'
})
export class EquipmentApiService {
  private readonly apiService = inject(ApiService);

  /**
   * Paginated equipment list with optional filter body.
   * Maps to: POST /equipment/{take}/{skip}
   */
  getAll(take: number, skip: number, query?: EquipmentQueryDto): Observable<ApiResponse<EquipmentDto[]>> {
    const endpoint = API.EQUIPMENT.GET_ALL(take, skip);
    return this.apiService.post<ApiResponse<EquipmentDto[]>>(endpoint, query ?? {}).pipe(
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Single equipment record by composite key.
   * Maps to: GET /equipment/{equipType}/{equipId}/{equipReference}
   */
  getByKey(equipType: string, equipId: string, equipReference: string): Observable<ApiResponse<EquipmentDto>> {
    const endpoint = API.EQUIPMENT.GET_BY_KEY(equipType, equipId, equipReference);
    return this.apiService.get<ApiResponse<EquipmentDto>>(endpoint).pipe(
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Create new equipment record.
   * Maps to: POST /equipment
   * Response: { success, statusCode, message, item: { equipReference } }
   */
  create(request: CreateEquipmentRequestDto): Observable<ApiResponse<{ equipReference: string }>> {
    return this.apiService.post<ApiResponse<{ equipReference: string }>>(API.EQUIPMENT.CREATE, request).pipe(
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Update existing equipment record.
   * Maps to: PUT /equipment/{equipType}/{equipId}/{equipReference}
   */
  update(
    equipType: string,
    equipId: string,
    equipReference: string,
    request: UpdateEquipmentRequestDto
  ): Observable<ApiResponse> {
    const endpoint = API.EQUIPMENT.UPDATE(equipType, equipId, equipReference);
    return this.apiService.put<ApiResponse>(endpoint, request).pipe(
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Soft-delete equipment record (sets OUT_SERVICE_DATE, STATUS=OUT).
   * Maps to: DELETE /equipment/{equipType}/{equipId}/{equipReference}
   */
  delete(equipType: string, equipId: string, equipReference: string): Observable<ApiResponse> {
    const endpoint = API.EQUIPMENT.DELETE(equipType, equipId, equipReference);
    return this.apiService.delete<ApiResponse>(endpoint).pipe(
      catchError(error => throwError(() => error))
    );
  }

  // =========================================================================
  // Lookup / LOV helpers
  // Types and IDs use the equipment-events LOV endpoints (shared with event entry screen).
  // Statuses use /equipment-query/statuses (includes all equipment status codes).
  // Locations use the shared lookups API as no dedicated endpoint exists yet.
  // =========================================================================

  /**
   * Equipment types dropdown.
   * Maps to: GET /api/v1/equipment/types
   * Returns equip_master_codes WHERE code_type = 'EQUIP', active only, scoped to chapter.
   */
  getEquipmentTypes(): Observable<DropdownOption[]> {
    return this.apiService.get<ApiResponse<{ code: string; description: string }[]>>(
      API.EQUIPMENT.TYPES
    ).pipe(
      map(response => (response.data ?? []).map(item => ({
        value: item.code,
        label: item.code,
        description: item.description
      }))),
      catchError(() => of([]))
    );
  }

  /**
   * Equipment IDs dropdown filtered by type.
   * Maps to: GET /api/v1/equipment/ids/{equipType}
   * Returns DISTINCT EQUIP_ID values for this chapter and type (SQL: SELECT DISTINCT EQUIP_ID FROM EQUIPMENT).
   */
  getEquipmentIds(equipType: string): Observable<DropdownOption[]> {
    return this.apiService.get<ApiResponse<{ equipId: string; description?: string }[]>>(
      API.EQUIPMENT.IDS(equipType)
    ).pipe(
      map(response => (response.data ?? []).map(item => ({
        value: item.equipId,
        label: item.equipId,
        description: item.description
      }))),
      catchError(() => of([]))
    );
  }

  /**
   * Equipment locations dropdown.
   * GET /api/v1/equipment/locations — equip_master_codes WHERE code_type='LOCAT', active for chapter local date.
   */
  getLocations(): Observable<DropdownOption[]> {
    return this.apiService.get<any>(API.EQUIPMENT.LOCATIONS).pipe(
      map(response => (response?.data ?? []).map((item: any) => ({
        value: item.code as string,
        label: item.code as string,
        description: item.description as string
      }))),
      catchError(() => of([]))
    );
  }

  /**
   * Equipment statuses dropdown.
   * GET /api/v1/equipment/statuses — equip_master_codes WHERE code_type='STATS', active for chapter local date.
   */
  getStatuses(): Observable<DropdownOption[]> {
    return this.apiService.get<any>(API.EQUIPMENT.STATUSES).pipe(
      map(response => (response?.data ?? []).map((item: any) => ({
        value: item.code as string,
        label: item.code as string,
        description: item.description as string
      }))),
      catchError(() => of([]))
    );
  }
}
