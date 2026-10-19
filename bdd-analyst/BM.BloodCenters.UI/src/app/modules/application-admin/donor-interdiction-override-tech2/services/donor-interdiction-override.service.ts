import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from '../../../../shared/services/api.service';
import { API } from '../../../../core/constants/api.constants';
import {
  DonorInterdictionOverrideModel,
  DonorInterdictionOverrideParamsDto,
  VerifyInterdictionRequest,
  VerifyInterdictionResponse
} from '../models/donor-interdiction-override.model';

interface SearchResponse {
  data: DonorInterdictionOverrideModel[];
  totalCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class DonorInterdictionOverrideService {
  constructor(private apiService: ApiService) {}

  /**
   * Search/filter/sort donor interdiction overrides.
   *
   * This is the primary API that handles:
   * - Pagination (skip, take)
   * - Filtering (donorDecisionCode, interType, dates, etc.)
   * - Searching (searchText)
   * - Sorting (sortColumn, sortOrder)
   *
   * Used for both:
   * 1. Populating filter dropdown options (load with take: 100, extract unique values)
   * 2. Loading table data with filters applied (load with user's pagination settings)
   */
  getDonorInterdictionOverrides(
    params: DonorInterdictionOverrideParamsDto
  ): Observable<{ data: DonorInterdictionOverrideModel[]; totalRecords: number }> {
    return this.apiService
      .post<SearchResponse>(API.APPLICATION_ADMIN.DONOR_INTERDICTION_OVERRIDE_TECH2.SEARCH, params)
      .pipe(
        map(response => ({
          data: response.data || [],
          totalRecords: response.totalCount || 0
        })),
        catchError(error => throwError(() => error))
      );
  }

  /**
   * Verify selected donor interdiction overrides.
   *
   * Marks the specified records as verified by Tech 2.
   */
  verifyInterdictions(request: VerifyInterdictionRequest): Observable<VerifyInterdictionResponse> {
    return this.apiService
      .post<VerifyInterdictionResponse>(API.APPLICATION_ADMIN.DONOR_INTERDICTION_OVERRIDE_TECH2.VERIFY, request)
      .pipe(
        catchError(error => throwError(() => error))
      );
  }
}
