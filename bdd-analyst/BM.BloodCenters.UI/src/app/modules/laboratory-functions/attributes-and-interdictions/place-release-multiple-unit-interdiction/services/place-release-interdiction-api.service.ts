import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API } from '@core/constants/api.constants';
import {
  ApiResponse,
  InterdictionCodeDto,
  UnitEntryDto,
  UnitInterdictionValidateUnitResponseDto,
  UnitInterdictionRequestDto,
  UnitInterdictionResultDto,
  UnitValidationRequest,
  InterdictionCodeValidationRequest,
} from '../models/place-release-interdiction.model';

/**
 * API Service for Place/Release Multiple Unit Interdiction (CPIMUINT)
 * JIRA: MLT-13197
 * Mnemonic: UNTINT2
 * Base URL: /unit-interdiction
 */
@Injectable({
  providedIn: 'root',
})
export class PlaceReleaseInterdictionApiService {
  private readonly http = inject(HttpClient);

  /**
   * Get available actions (PLACE/RELEASE) for the current user
   * GET /unit-interdiction/actions
   */
  getActions(): Observable<string[]> {
    return this.http
      .get<ApiResponse<string[]>>(API.PLACE_RELEASE_MULTIPLE_UNIT_INTERDICTION.GET_ACTIONS)
      .pipe(map((response) => response.data));
  }

  /**
   * Get all valid interdiction codes available to the user
   * GET /unit-interdiction/interdiction-codes
   */
  getInterdictionCodes(): Observable<InterdictionCodeDto[]> {
    return this.http
      .get<ApiResponse<InterdictionCodeDto[]>>(
        API.PLACE_RELEASE_MULTIPLE_UNIT_INTERDICTION.GET_INTERDICTION_CODES
      )
      .pipe(map((response) => response.data));
  }

  /**
   * Validate a single unit ID
   * POST /unit-interdiction/validate-unit
   */
  validateUnit(unitId: string): Observable<UnitInterdictionValidateUnitResponseDto> {
    const request: UnitValidationRequest = { unitId };
    return this.http
      .post<ApiResponse<UnitInterdictionValidateUnitResponseDto>>(
        API.PLACE_RELEASE_MULTIPLE_UNIT_INTERDICTION.VALIDATE_UNIT,
        request
      )
      .pipe(map((response) => response.data));
  }

  /**
   * Validate an interdiction code
   * POST /unit-interdiction/validate-interdiction-code
   */
  validateInterdictionCode(interCode: string): Observable<InterdictionCodeDto> {
    const request: InterdictionCodeValidationRequest = { interCode };
    return this.http
      .post<ApiResponse<InterdictionCodeDto>>(
        API.PLACE_RELEASE_MULTIPLE_UNIT_INTERDICTION.VALIDATE_INTERDICTION_CODE,
        request
      )
      .pipe(map((response) => response.data));
  }

  /**
   * Place interdictions on multiple units
   * POST /unit-interdiction/place
   */
  placeInterdictions(
    interCodes: string[],
    units: UnitEntryDto[]
  ): Observable<UnitInterdictionResultDto> {
    const request: UnitInterdictionRequestDto = {
      action: 'PLACE',
      interCodes,
      units,
    };
    return this.http
      .post<ApiResponse<UnitInterdictionResultDto>>(
        API.PLACE_RELEASE_MULTIPLE_UNIT_INTERDICTION.PLACE,
        request
      )
      .pipe(map((response) => response.data));
  }

  /**
   * Release interdictions from multiple units
   * POST /unit-interdiction/release
   */
  releaseInterdictions(
    interCodes: string[],
    units: UnitEntryDto[]
  ): Observable<UnitInterdictionResultDto> {
    const request: UnitInterdictionRequestDto = {
      action: 'RELEASE',
      interCodes,
      units,
    };
    return this.http
      .post<ApiResponse<UnitInterdictionResultDto>>(
        API.PLACE_RELEASE_MULTIPLE_UNIT_INTERDICTION.RELEASE,
        request
      )
      .pipe(map((response) => response.data));
  }

  /**
   * Get units that currently have the specified interdiction codes
   * POST /unit-interdiction/units-for-release
   * Used in RELEASE mode to pre-populate units
   */
  getUnitsForRelease(interCodes: string[]): Observable<UnitEntryDto[]> {
    return this.http
      .post<ApiResponse<UnitEntryDto[]>>(
        API.PLACE_RELEASE_MULTIPLE_UNIT_INTERDICTION.UNITS_FOR_RELEASE,
        interCodes
      )
      .pipe(map((response) => response.data));
  }
}
