import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';
import {
  PlaceGroupInterdictionRequestDto,
  PlaceGroupInterdictionResultDto,
  ValidInterdictionDto,
  AffectedUnitsDto,
  DriveDto,
  BatchDto,
  CollectionDateDto,
  LotNumberDto,
  ApiResponse,
  ControlMode,
} from '../models/group-interdiction.model';

/**
 * API Service for Place Group Interdiction or Hold
 * JIRA: MLT-12686
 * Mnemonic: EGRPINT
 */
@Injectable({
  providedIn: 'root',
})
export class GroupInterdictionApiService {
  private readonly apiService = inject(ApiService);

  /**
   * Place one or more interdiction codes on a group of units
   * POST /api/v1/group-interdiction/place
   * @param request PlaceGroupInterdictionRequestDto
   * @returns Observable of PlaceGroupInterdictionResultDto
   */
  placeInterdictions(
    request: PlaceGroupInterdictionRequestDto,
  ): Observable<PlaceGroupInterdictionResultDto> {
    return this.apiService
      .post<ApiResponse<PlaceGroupInterdictionResultDto>>(API.GROUP_INTERDICTION.PLACE, request)
      .pipe(
        map((response) => response?.item as PlaceGroupInterdictionResultDto),
        catchError((error) => {
          console.error('Error placing interdictions:', error);
          return throwError(() => error);
        }),
      );
  }

  /**
   * Get list of active interdiction codes (type N or H)
   * GET /api/v1/group-interdiction/interdictions/active
   * @returns Observable of ValidInterdictionDto array
   */
  getActiveInterdictions(): Observable<ValidInterdictionDto[]> {
    return this.apiService.get<ValidInterdictionDto[]>(API.GROUP_INTERDICTION.ACTIVE_INTERDICTIONS).pipe(
      map((response) => response || []),
      catchError((error) => {
        console.error('Error fetching active interdictions:', error);
        return throwError(() => error);
      }),
    );
  }

  /**
   * Preview which units will be affected by interdiction placement
   * GET /api/v1/group-interdiction/preview?controlMode={mode}&selectionValue={value}
   * @param controlMode Control mode (DRIVE, BATCH, etc.)
   * @param selectionValue Selection value based on control mode
   * @returns Observable of AffectedUnitsDto array
   */
  previewAffectedUnits(controlMode: ControlMode, selectionValue: string): Observable<AffectedUnitsDto[]> {
    const url = `${API.GROUP_INTERDICTION.PREVIEW}?controlMode=${encodeURIComponent(controlMode)}&selectionValue=${encodeURIComponent(selectionValue)}`;
    return this.apiService.get<AffectedUnitsDto[]>(url).pipe(
      map((response) => response || []),
      catchError((error) => {
        console.error('Error previewing affected units:', error);
        return throwError(() => error);
      }),
    );
  }

  /**
   * Get list of drives that have associated units (for dropdown)
   * GET /api/v1/group-interdiction/dropdown/drives
   * @returns Observable of DriveDto array
   */
  getDrives(): Observable<DriveDto[]> {
    return this.apiService.get<DriveDto[]>(API.GROUP_INTERDICTION.DROPDOWN_DRIVES).pipe(
      map((response) => response || []),
      catchError((error) => {
        console.error('Error fetching drives:', error);
        return throwError(() => error);
      }),
    );
  }

  /**
   * Get list of batches with units (last 21 days) for dropdown
   * GET /api/v1/group-interdiction/dropdown/batches
   * @returns Observable of BatchDto array
   */
  getBatches(): Observable<BatchDto[]> {
    return this.apiService.get<BatchDto[]>(API.GROUP_INTERDICTION.DROPDOWN_BATCHES).pipe(
      map((response) => response || []),
      catchError((error) => {
        console.error('Error fetching batches:', error);
        return throwError(() => error);
      }),
    );
  }

  /**
   * Get list of collection dates with units (last 21 days) for dropdown
   * GET /api/v1/group-interdiction/dropdown/collection-dates
   * @returns Observable of CollectionDateDto array
   */
  getCollectionDates(): Observable<CollectionDateDto[]> {
    return this.apiService.get<CollectionDateDto[]>(API.GROUP_INTERDICTION.DROPDOWN_COLLECTION_DATES).pipe(
      map((response) => response || []),
      catchError((error) => {
        console.error('Error fetching collection dates:', error);
        return throwError(() => error);
      }),
    );
  }

  /**
   * Get list of lot numbers with units (last 21 days) for dropdown
   * GET /api/v1/group-interdiction/dropdown/lot-numbers
   * @returns Observable of LotNumberDto array
   */
  getLotNumbers(): Observable<LotNumberDto[]> {
    return this.apiService.get<LotNumberDto[]>(API.GROUP_INTERDICTION.DROPDOWN_LOT_NUMBERS).pipe(
      map((response) => response || []),
      catchError((error) => {
        console.error('Error fetching lot numbers:', error);
        return throwError(() => error);
      }),
    );
  }
}
