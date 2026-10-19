import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../../../../../environments/environment';
import { API } from '@core/constants/api.constants';
import {
  ValidateUnitRequestDto,
  ValidateUnitResponseDto,
  RecordFirstSeparationRequestDto,
  RecordSecondSeparationRequestDto,
  SeparationTimesOfflineDto,
  CentrifugeDto,
  ApiResponse,
} from '../models/separation-times-offline.model';

/**
 * API Service for Separation Times Offline
 * Handles all HTTP requests for offline separation time recording
 */
@Injectable({ providedIn: 'root' })
export class SeparationTimesOfflineApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}${API.SEPARATION_TIMES_OFFLINE.BASE}`;

  /**
   * Validate unit eligibility for separation time recording
   * POST /api/separation-times-offline/validate-unit
   */
  validateUnit(unitId: string): Observable<ValidateUnitResponseDto> {
    const request: ValidateUnitRequestDto = { unitId };
    return this.http
      .post<ApiResponse<ValidateUnitResponseDto>>(
        `${this.baseUrl}${API.SEPARATION_TIMES_OFFLINE.VALIDATE_UNIT}`,
        request
      )
      .pipe(map((response) => response.item!));
  }

  /**
   * Get active centrifuges for current chapter
   * GET /api/separation-times-offline/centrifuges
   */
  getCentrifuges(): Observable<CentrifugeDto[]> {
    return this.http
      .get<ApiResponse<CentrifugeDto>>(
        `${this.baseUrl}${API.SEPARATION_TIMES_OFFLINE.CENTRIFUGES}`
      )
      .pipe(map((response) => response.data || []));
  }

  /**
   * Record first separation time
   * POST /api/separation-times-offline/first-separation
   */
  recordFirstSeparation(
    request: RecordFirstSeparationRequestDto
  ): Observable<SeparationTimesOfflineDto> {
    return this.http
      .post<ApiResponse<SeparationTimesOfflineDto>>(
        `${this.baseUrl}${API.SEPARATION_TIMES_OFFLINE.RECORD_FIRST}`,
        request
      )
      .pipe(map((response) => response.item!));
  }

  /**
   * Record second separation time
   * POST /api/separation-times-offline/second-separation
   */
  recordSecondSeparation(
    request: RecordSecondSeparationRequestDto
  ): Observable<SeparationTimesOfflineDto> {
    return this.http
      .post<ApiResponse<SeparationTimesOfflineDto>>(
        `${this.baseUrl}${API.SEPARATION_TIMES_OFFLINE.RECORD_SECOND}`,
        request
      )
      .pipe(map((response) => response.item!));
  }

  /**
   * Get separation details for a specific unit
   * GET /api/separation-times-offline/{unitId}
   */
  getSeparationDetails(unitId: string): Observable<SeparationTimesOfflineDto> {
    return this.http
      .get<ApiResponse<SeparationTimesOfflineDto>>(
        `${this.baseUrl}/${encodeURIComponent(unitId)}`
      )
      .pipe(map((response) => response.item!));
  }
}
