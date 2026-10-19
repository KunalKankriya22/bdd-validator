import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  SpecialProcessingQueryRequestDto,
  SpecialProcessingQueryResultDto,
  ApiResponse
} from '../models/special-processing-query.interface';

/**
 * API Service for Special Processing Query
 * Handles API communication for querying special processing data
 *
 * @JIRA MLT-13166
 * @Backend MLT-13167
 */
@Injectable({
  providedIn: 'root',
})
export class SpecialProcessingQueryApiService {
  private readonly apiService = inject(ApiService);

  /**
   * Search for special processing data by unit ID
   * POST /api/v1/special-processing-query/search
   *
   * @param request Request containing unitId
   * @returns Observable with special processing query result
   *
   * @error 0210 - Unit not found
   * @error 0063 - Collection date not present
   * @error 2331 - No SP records
   */
  search(
    request: SpecialProcessingQueryRequestDto
  ): Observable<ApiResponse<SpecialProcessingQueryResultDto>> {
    const url = API.SPECIAL_PROCESSING_QUERY.SEARCH;

    return this.apiService
      .post<ApiResponse<SpecialProcessingQueryResultDto>>(url, request)
      .pipe(
        catchError((error) => {
          console.error('Special Processing Query search failed:', error);
          return throwError(() => error);
        })
      );
  }
}
