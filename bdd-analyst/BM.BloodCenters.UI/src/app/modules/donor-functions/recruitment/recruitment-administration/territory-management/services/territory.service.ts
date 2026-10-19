import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  TerritoryModel,
  TerritoryParamsDto,
  TerritoryDto,
  TerritoryUpdateDto,
  TerritoryFilterOptions,
  LookupItem
} from '../models/territory.model';
import { ApiService } from '@shared/services/api.service';

interface ReturnResult<T> {
  success?: boolean;
  message?: string;
  error?: string;
  statusCode?: number;
  data?: T[];
  item?: T;
  total?: number;
}

interface FilterOptionsResponse {
  success?: boolean;
  message?: string;
  statusCode?: number;
  item?: {
    groups?: LookupItem[];
    types?: LookupItem[];
  };
  data?: {
    groups?: LookupItem[];
    types?: LookupItem[];
  };
  errorResponse?: {
    errorCode?: string;
    error?: string;
  };
}

interface ApiSuccessResponse {
  success?: boolean;
  message?: string;
  statusCode?: number;
}

@Injectable({
  providedIn: 'root'
})
export class TerritoryService {
  private readonly apiService = inject(ApiService);

  /**
   * Get territories with pagination, sorting, and filtering
   * POST /api/v1/territories/search-sort-filter/{take}/{skip}
   */
  getTerritories(
    take: number,
    skip: number,
    params: TerritoryParamsDto
  ): Observable<{ data: TerritoryModel[]; totalRecords: number }> {
    const endpoint = `/api/v1/territories/search-sort-filter/${take}/${skip}`;


    return this.apiService.post<ReturnResult<TerritoryModel>>(endpoint, params).pipe(
      map(response => ({
        data: response.data || [],
        totalRecords: response.total || 0
      }))
    );
  }

  /**
   * Create a new territory
   * POST /api/v1/territories
   */
  addTerritory(payload: TerritoryDto): Observable<ApiSuccessResponse> {
    const endpoint = '/api/v1/territories';

    return this.apiService.post<ApiSuccessResponse>(endpoint, payload);
  }

  /**
   * Update an existing territory
   * PUT /api/v1/territories
   */
  updateTerritory(payload: TerritoryUpdateDto): Observable<ApiSuccessResponse> {
    const endpoint = '/api/v1/territories';

    return this.apiService.put<ApiSuccessResponse>(endpoint, payload);
  }

  /**
   * Get filter/dropdown options (territory groups and types)
   * GET /api/v1/territories/filter-options
   */
  getFilterOptions(): Observable<TerritoryFilterOptions> {
    const endpoint = `/api/v1/territories/filter-options`;


    return this.apiService.get<FilterOptionsResponse>(endpoint).pipe(
      map(response => {

        // API returns data as an array, access first element
        const dataItem = Array.isArray(response.data) && response.data.length > 0
          ? response.data[0]
          : response.data;

        return {
          groups: dataItem?.groups || [],
          types: dataItem?.types || []
        };
      })
    );
  }

}
