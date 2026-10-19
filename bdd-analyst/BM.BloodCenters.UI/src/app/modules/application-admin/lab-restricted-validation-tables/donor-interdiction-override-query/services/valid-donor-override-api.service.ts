import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { LoggingService } from '@shared/services/logging.service';
import { API } from '../../../../../core/constants/api.constants';
import { DonorInterdictionOverrideQueryModel } from '../models/donor-interdiction-override-query.model';

/**
 * API Response structure
 */
export interface ValidDonorOverrideApiResponse {
  success: boolean;
  data: DonorInterdictionOverrideQueryModel[];
  message?: string;
  total?: number;
}

/**
 * Query DTO for API request
 */
export interface ValidDonorOverrideQueryDto {
  donorDecisionCode?: string | null;
  productType?: string | null;
  interCode?: string | null;
  interType?: string | null;
  searchKeyword?: string | null;
  sort?: string | null;
  effectiveDateFrom?: string | null;
  effectiveDateTo?: string | null;
  terminationDateFrom?: string | null;
  terminationDateTo?: string | null;
}

/**
 * Lookup DTO for dropdown options
 */
export interface LookupDto {
  code: string;
  description: string;
}

/**
 * Lookup API Response structure
 */
export interface LookupApiResponse {
  success: boolean;
  data: LookupDto[];
  message?: string;
  total?: number;
}

/**
 * Service for managing Valid Donor Override API operations
 */
@Injectable({
  providedIn: 'root',
})
export class ValidDonorOverrideApiService {
  private apiService = inject(ApiService);
  private loggingService = inject(LoggingService);

  /**
   * Get valid donor overrides with pagination and filtering
   * POST /api/v1/donor-interdiction/valid-donor-overrides/{take}/{skip}
   *
   * @param take - Number of records to take
   * @param skip - Number of records to skip
   * @param queryDto - Filter parameters
   * @returns Observable of valid donor overrides with total count
   */
  getValidDonorOverrides(
    take: number,
    skip: number,
    queryDto: ValidDonorOverrideQueryDto
  ): Observable<{ data: DonorInterdictionOverrideQueryModel[]; total: number }> {
    const endpoint = API.DONOR_INTERDICTION.VALID_DONOR_OVERRIDES(take, skip);

    this.loggingService.log('Fetching valid donor overrides', { take, skip, queryDto });

    return this.apiService
      .post<ValidDonorOverrideApiResponse>(endpoint, queryDto)
      .pipe(
        map((response) => {
          if (!response.success) {
            throw new Error(response.message || 'Failed to fetch valid donor overrides');
          }

          // Parse dates from string to Date objects
          const parsedData = response.data.map((item) => ({
            ...item,
            effDate: item.effDate ? new Date(item.effDate) : null,
            termDate: item.termDate ? new Date(item.termDate) : null,
          }));

          this.loggingService.log('Successfully fetched valid donor overrides', {
            count: parsedData.length,
            total: response.total,
          });

          return {
            data: parsedData,
            total: response.total || 0,
          };
        }),
        catchError((error) => {
          this.loggingService.error('Error fetching valid donor overrides', error);

          return throwError(() => error);
        })
      );
  }

  /**
   * Get lookup options for Cue dropdown
   * GET /api/v1/donor-interdiction/valid-donor-overrides/lookup/cue
   *
   * @returns Observable of cue lookup options
   */
  getLookupCue(): Observable<LookupDto[]> {
    const endpoint = API.DONOR_INTERDICTION.LOOKUP_CUE;

    this.loggingService.log('Fetching lookup cue options');

    return this.apiService
      .get<LookupApiResponse>(endpoint)
      .pipe(
        map((response) => {
          if (!response.success) {
            throw new Error(response.message || 'Failed to fetch lookup cue options');
          }

          this.loggingService.log('Successfully fetched lookup cue options', {
            count: response.data.length,
          });

          return response.data;
        }),
        catchError((error) => {
          this.loggingService.error('Error fetching lookup cue options', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get lookup options for Type dropdown
   * GET /api/v1/donor-interdiction/valid-donor-overrides/lookup/type
   *
   * @returns Observable of type lookup options
   */
  getLookupType(): Observable<LookupDto[]> {
    const endpoint = API.DONOR_INTERDICTION.LOOKUP_TYPE;

    this.loggingService.log('Fetching lookup type options');

    return this.apiService
      .get<LookupApiResponse>(endpoint)
      .pipe(
        map((response) => {
          if (!response.success) {
            throw new Error(response.message || 'Failed to fetch lookup type options');
          }

          this.loggingService.log('Successfully fetched lookup type options', {
            count: response.data.length,
          });

          return response.data;
        }),
        catchError((error) => {
          this.loggingService.error('Error fetching lookup type options', error);
          return throwError(() => error);
        })
      );
  }
}
