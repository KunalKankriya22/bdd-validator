import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';

import {
  ResetUnderExtractDto,
  ResetUnderExtractGetResponse,
  ResetUnderExtractRequestDto,
  ResetUnderExtractResetResponse,
} from '../models/reset-under-extract.model';

/**
 * Service for Reset Under Extract Flag operations
 * API Documentation: MLT-13548-api-documentation.md
 * Base URL: /api/v1/reset-under-extract
 */
@Injectable({ providedIn: 'root' })
export class ResetUnderExtractService {
  private readonly apiService = inject(ApiService);

  /**
   * Get all eligible records for reset
   * Records eligible when under_extract_flag='Y' and insert_dats > 1 hour old
   *
   * Endpoint: GET /reset-under-extract
   *
   * @returns Observable of eligible records with total count
   */
  getEligibleRecords(): Observable<ResetUnderExtractGetResponse> {
    return this.apiService
      .get<ResetUnderExtractGetResponse>(API.RESET_UNDER_EXTRACT.GET_ELIGIBLE)
      .pipe(
        map((response) => ({
          success: response.success,
          statusCode: response.statusCode,
          message: response.message,
          data: response.data || [],
          totalCount: response.totalCount || 0,
        }))
      );
  }

  /**
   * Reset under_extract_flag to 'N' for selected records
   *
   * Endpoint: POST /reset-under-extract/reset
   *
   * @param request Request containing items to reset
   * @returns Observable of reset operation results
   */
  resetFlags(request: ResetUnderExtractRequestDto): Observable<ResetUnderExtractResetResponse> {
    return this.apiService
      .post<ResetUnderExtractResetResponse>(
        API.RESET_UNDER_EXTRACT.RESET,
        request
      )
      .pipe(
        map((response) => ({
          success: response.success,
          message: response.message,
          statusCode: response.statusCode,
          data: {
            successCount: response.data?.successCount || 0,
            skippedCount: response.data?.skippedCount || 0,
            totalProcessed: response.data?.totalProcessed || 0,
          },
        }))
      );
  }
}
