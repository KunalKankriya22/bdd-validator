import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../../../../environments/environment';
import { API } from '@core/constants/api.constants';
import {
  ValidInterdiction,
  UnitExistsCheck,
  CreateUnitInterdictionDto,
  UnitInterdictionResponse,
  ApiResponse
} from '../models/add-interdiction.model';

/**
 * Service for Add Interdiction for Units Not Checked API
 * Handles all API calls for checking units and adding interdictions
 */
@Injectable({
  providedIn: 'root'
})
export class AddInterdictionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  /**
   * Check if a unit already exists (has been checked in)
   * GET /api/v1/unit-interdictions/check-unit-exists/{unitId}
   *
   * @param unitId Blood unit identifier (max 15 characters)
   * @returns Observable<UnitExistsCheck>
   */
  checkUnitExists(unitId: string): Observable<UnitExistsCheck> {
    const url = `${this.baseUrl}${API.UNIT_INTERDICTION.CHECK_UNIT_EXISTS(unitId)}`;
    return this.http.get<ApiResponse<UnitExistsCheck>>(url).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.message || 'Failed to check unit existence');
      })
    );
  }

  /**
   * Get valid interdictions (LOV) for a specific unit
   * GET /api/v1/unit-interdictions/valid-interdictions/{unitId}
   *
   * Returns active interdictions (type N/H) that user has access to
   * and that are not already applied to this unit
   *
   * @param unitId Blood unit identifier (max 15 characters)
   * @returns Observable<ValidInterdiction[]>
   */
  getValidInterdictions(unitId: string): Observable<ValidInterdiction[]> {
    const url = `${this.baseUrl}${API.UNIT_INTERDICTION.VALID_INTERDICTIONS(unitId)}`;
    return this.http.get<ApiResponse<ValidInterdiction[]>>(url).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        return [];
      })
    );
  }

  /**
   * Add interdiction to a unit that has not been checked in yet
   * POST /api/v1/unit-interdictions/add-not-checked
   *
   * @param request CreateUnitInterdictionDto with unitId and interCode
   * @returns Observable<ApiResponse<UnitInterdictionResponse>>
   */
  addInterdiction(request: CreateUnitInterdictionDto): Observable<ApiResponse<UnitInterdictionResponse>> {
    const url = `${this.baseUrl}${API.UNIT_INTERDICTION.ADD_NOT_CHECKED}`;
    return this.http.post<ApiResponse<UnitInterdictionResponse>>(url, request);
  }
}
