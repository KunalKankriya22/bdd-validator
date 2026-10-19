import { Injectable, inject } from '@angular/core';
import { Observable, throwError, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { HttpContext } from '@angular/common/http';
import {
  DonorRbcAgQueryDto,
  DonorRbcAgQueryResponse,
  UpdateGenotypeDto,
  UpdateGenotypeResponse,
  UpdateExcludeFlagDto,
  UpdateExcludeFlagResponse,
  ExcludeUnitsDto,
  CmvHbsItemDto,
  CmvHbsResponse,
  CheckAccessResponse
} from '../models/donor-rbc-ag-query.model';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import { SKIP_ERROR_TOAST } from 'src/app/core/constants/http-context.constants';

@Injectable({
  providedIn: 'root'
})
export class DonorRbcAgQueryService {
  private readonly apiService = inject(ApiService);

  /**
   * Get complete donor RBC antigen query information
   * GET /api/donor-rbc-ag-query/{donorId}
   * @param donorId - Unique donor identifier (max 10 characters)
   * @returns Observable with complete donor antigen data
   */
  getDonorRbcAgQuery(donorId: string): Observable<DonorRbcAgQueryDto> {
    const endpoint = API.DONOR_FUNCTIONS.DONOR_RBC_AG_QUERY.GET_BY_DONOR_ID(donorId);

    return this.apiService.get<DonorRbcAgQueryResponse>(endpoint).pipe(
      map(response => response.item),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Get donor RBC antigen query filtered by specific antigen
   * GET /api/donor-rbc-ag-query/{donorId}/antigen/{antigenCode}
   * @param donorId - Unique donor identifier
   * @param antigenCode - Antigen code to filter by (e.g., K, E, c, Fya)
   * @returns Observable with donor data filtered to specific antigen
   */
  getDonorRbcAgQueryByAntigen(
    donorId: string,
    antigenCode: string
  ): Observable<DonorRbcAgQueryDto> {
    const endpoint = API.DONOR_FUNCTIONS.DONOR_RBC_AG_QUERY.GET_BY_ANTIGEN(donorId, antigenCode);

    return this.apiService.get<DonorRbcAgQueryResponse>(endpoint).pipe(
      map(response => response.item),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Update donor genotype information
   * PUT /api/v1/donor-rbc-ag-query/genotype
   * @param payload - Genotype update data (donorId and genoType)
   * @returns Observable with API response
   */
  updateGenotype(payload: UpdateGenotypeDto): Observable<UpdateGenotypeResponse> {
    const endpoint = API.DONOR_FUNCTIONS.DONOR_RBC_AG_QUERY.UPDATE_GENOTYPE;

    return this.apiService.put<UpdateGenotypeResponse>(endpoint, payload).pipe(
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Bulk update exclude flags for multiple unit tests
   * PUT /api/v1/donor-rbc-ag-query/exclude-flag
   * @param payload - Array of exclude flag updates
   * @returns Observable with API response
   */
  bulkUpdateExcludeFlag(payload: UpdateExcludeFlagDto[]): Observable<UpdateExcludeFlagResponse> {
    const endpoint = API.DONOR_FUNCTIONS.DONOR_RBC_AG_QUERY.UPDATE_EXCLUDE_FLAG;

    return this.apiService.put<UpdateExcludeFlagResponse>(endpoint, payload).pipe(
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Update exclude flags for selected units
   * TODO: API endpoint not documented - update once available
   * Expected: PUT /api/donor-rbc-ag-query/{donorId}/antigen/{antigenCode}/exclude-units
   * @param payload - Exclude units data
   * @returns Observable with API response
   */
  excludeUnits(payload: ExcludeUnitsDto): Observable<any> {
    // TODO: Replace with actual endpoint when API is available
    console.warn('excludeUnits API endpoint not yet implemented');
    return throwError(() => new Error('API endpoint not available'));

    // Expected implementation:
    // const endpoint = API.DONOR_FUNCTIONS.DONOR_RBC_AG_QUERY.EXCLUDE_UNITS(
    //   payload.donorId,
    //   payload.antigenCode
    // );
    // return this.apiService.put(endpoint, payload).pipe(
    //   catchError(error => throwError(() => error))
    // );
  }

  /**
   * Check AGXCL access for the current user
   * GET /api/v1/donor-rbc-ag-query/check-access
   * @returns Observable with boolean indicating if user has AGXCL access
   */
  checkAccess(): Observable<boolean> {
    const endpoint = API.DONOR_FUNCTIONS.DONOR_RBC_AG_QUERY.CHECK_ACCESS;

    return this.apiService.get<CheckAccessResponse>(endpoint).pipe(
      map(response => response.item === true),
      catchError(() => of(false))
    );
  }

  /**
   * Get CMV and HbS data by unit ID
   * GET /api/v1/donor-rbc-ag-query/cmv-hbs/{unitId}
   * @param unitId - Unit identifier (can be empty string)
   * @returns Observable with CMV and HbS test items array
   */
  getCmvHbs(unitId: string): Observable<CmvHbsItemDto[]> {
    const endpoint = API.DONOR_FUNCTIONS.DONOR_RBC_AG_QUERY.GET_CMV_HBS(unitId);

    // Skip error toast for this API - silent handling for missing CMV/HbS data
    const context = new HttpContext().set(SKIP_ERROR_TOAST, true);

    return this.apiService.get<CmvHbsResponse>(endpoint, { context }).pipe(
      map(response => response.item),
      catchError(error => {
        // Return empty array if API fails (silent handling for 404/missing data)
        return of([]);
      })
    );
  }
}
