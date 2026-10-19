import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  DefineResourceMasterListModel,
  DefineResourceMasterListParamsDto,
  DefineResourceMasterListDto,
  UpdateDefineResourceMasterListDto
} from '../models/define-resource-master-list.model';
import { ApiService } from '@shared/services/api.service';
// TODO: Uncomment when API constants are added
// import { API } from 'src/app/core/constants/api.constants';

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
    resourceTypes?: string[];
    criticalIndicators?: string[];
  };
  errorResponse?: {
    errorCode?: string;
    error?: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class DefineResourceMasterListService {
  private readonly apiService = inject(ApiService);

  /**
   * Get Define Resource Master List with pagination, sorting, and filtering
   * POST /api/v1/resource-master-list/search-sort-filter/{take}/{skip}
   * @param take - Number of records to fetch
   * @param skip - Number of records to skip
   * @param params - Filter and search parameters
   * @returns Observable with table data and total count
   */
  getDefineResourceMasterList(
    take: number,
    skip: number,
    params: DefineResourceMasterListParamsDto
  ): Observable<{ data: DefineResourceMasterListModel[]; totalRecords: number }> {
    const endpoint = `/api/v1/resource-master-list/search-sort-filter/${take}/${skip}`;

    return this.apiService.post<ReturnResult<DefineResourceMasterListModel>>(endpoint, params).pipe(
      map(response => ({
        data: response.data || [],
        totalRecords: response.total || 0
      }))
    );
  }

  /**
   * Add new resource code
   * POST /api/v1/resource-master-list
   * @param payload - Resource code data to add
   * @returns Observable with API response
   */
  addResourceCode(payload: DefineResourceMasterListDto): Observable<any> {
    const endpoint = '/api/v1/resource-master-list';

    return this.apiService.post<any>(endpoint, payload);
  }

  /**
   * Update existing resource code
   * PUT /api/v1/resource-master-list
   * @param payload - Updated resource code data
   * @returns Observable with API response
   */
  updateResourceCode(payload: UpdateDefineResourceMasterListDto): Observable<any> {
    const endpoint = '/api/v1/resource-master-list';

    return this.apiService.put<any>(endpoint, payload);
  }

  /**
   * Get filter options for dropdowns
   * GET /api/v1/resource-master-list/filter-options
   * @returns Observable with resource types and critical indicators
   */
  getFilterOptions(): Observable<{ resourceTypes: string[]; criticalIndicators: string[] }> {
    const endpoint = '/api/v1/resource-master-list/filter-options';

    return this.apiService.get<FilterOptionsResponse>(endpoint).pipe(
      map(response => ({
        resourceTypes: response.item?.resourceTypes || [],
        criticalIndicators: response.item?.criticalIndicators || []
      }))
    );
  }
}
