import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../../../../../../environments/environment';
import { API } from '@core/constants/api.constants';
import {
  RecordFreezeStartTimeDto,
  FreezeStartTimeResponseDto,
  EligibleComponentDto,
  UnitBleedInfoDto,
  ApiResponse
} from '../models/freeze-start-times.model';

/**
 * Service for Freeze Start Times (Offline) operations
 * Handles recording freeze start times, retrieving eligible components, and unit bleed info
 */
@Injectable({
  providedIn: 'root'
})
export class FreezeStartTimesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}${API.FREEZE_START_TIMES.BASE}`;

  /**
   * Record freeze start time for a blood component
   * POST /api/v1/freeze-start-times
   * @param request Record freeze start time request DTO
   * @returns Observable of freeze start time response
   */
  recordFreezeStartTime(request: RecordFreezeStartTimeDto): Observable<FreezeStartTimeResponseDto> {
    return this.http
      .post<ApiResponse<FreezeStartTimeResponseDto>>(this.baseUrl, request)
      .pipe(
        map(response => {
          if (response.data && response.data.length > 0) {
            return response.data[0];
          }
          throw new Error(response.message || 'Failed to record freeze start time');
        })
      );
  }

  /**
   * Get list of eligible components for freeze time entry on a unit
   * GET /api/v1/freeze-start-times/eligible-components/{unitId}
   * @param unitId Unit/donation identifier
   * @returns Observable of eligible components array
   */
  getEligibleComponents(unitId: string): Observable<EligibleComponentDto[]> {
    const url = `${environment.apiUrl}${API.FREEZE_START_TIMES.ELIGIBLE_COMPONENTS(unitId)}`;
    return this.http
      .get<any>(url)
      .pipe(
        map(response => {
          if (!response.data || response.total === 0) return [];
          const first = response.data[0];
          // Nested: data: [[{...}, {...}]] → extract inner array
          if (Array.isArray(first)) {
            return first as EligibleComponentDto[];
          }
          // Flat: data: [{...}, {...}] → use data directly
          if (first && first.productCode) {
            return response.data as EligibleComponentDto[];
          }
          return [];
        })
      );
  }

  /**
   * Get unit bleed information
   * GET /api/v1/freeze-start-times/unit-info/{unitId}
   * @param unitId Unit/donation identifier
   * @returns Observable of unit bleed info
   */
  getUnitBleedInfo(unitId: string): Observable<UnitBleedInfoDto> {
    const url = `${environment.apiUrl}${API.FREEZE_START_TIMES.UNIT_INFO(unitId)}`;
    return this.http
      .get<ApiResponse<UnitBleedInfoDto>>(url)
      .pipe(
        map(response => {
          if (response.data && response.data.length > 0) {
            return response.data[0];
          }
          throw new Error(response.message || 'Unit bleed information not found');
        })
      );
  }
}
