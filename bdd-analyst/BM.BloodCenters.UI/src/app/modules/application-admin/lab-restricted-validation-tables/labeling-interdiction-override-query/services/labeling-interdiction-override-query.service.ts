import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  LabelingInterdictionOverrideQueryModel,
  LabelingInterdictionOverrideQueryParamsDto,
  LabelingInterdictionOverrideFilterLov
} from '../models/labeling-interdiction-override-query.model';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';

interface ReturnResult<T> {
  success?: boolean;
  message?: string;
  error?: string;
  statusCode?: number;
  data?: T[];
  item?: T;
  total?: number;
}

interface DropdownResponse {
  item?: LabelingInterdictionOverrideFilterLov;
  data?: LabelingInterdictionOverrideFilterLov[];
}

interface FilterDropdownOption {
  key: string;
  value: string;
}

interface FilterDropdownData {
  CueOptions?: FilterDropdownOption[];
  cueOptions?: FilterDropdownOption[];
  TypeOptions?: FilterDropdownOption[];
  typeOptions?: FilterDropdownOption[];
}

interface FilterDropdownResponse {
  data?: FilterDropdownData[];
  Data?: FilterDropdownData[];
}

@Injectable({
  providedIn: 'root'
})
export class LabelingInterdictionOverrideQueryService {
  private readonly apiService = inject(ApiService);

  /**
   * Get Labeling Interdiction Override Query table data with pagination
   * POST /api/v1/admin/labeling-interdiction-override-query/{take}/{skip}
   */
  getLabelingInterdictionOverrideQuery(
    take: number,
    skip: number,
    params: LabelingInterdictionOverrideQueryParamsDto
  ): Observable<{ data: LabelingInterdictionOverrideQueryModel[]; totalRecords: number }> {
    const endpoint = API.APPLICATION_ADMIN.LABELING_INTERDICTION_OVERRIDE_QUERY(take, skip);

    return this.apiService.post<ReturnResult<LabelingInterdictionOverrideQueryModel>>(endpoint, params).pipe(
      map(response => ({
        data: response.data || [],
        totalRecords: response.total || 0
      })),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Get filter dropdown values (LOV) for add/edit panel
   * GET /api/v1/labeling-interdiction-override/dropdowns
   */
  getLabelingInterdictionOverrideQueryFilters(): Observable<LabelingInterdictionOverrideFilterLov> {
    const endpoint = API.APPLICATION_ADMIN.LABELING_INTERDICTION_OVERRIDE_DROPDOWNS;

    return this.apiService.get<DropdownResponse>(endpoint).pipe(
      map(response => this.extractDropdownData(response)),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Get filter dropdown values (Cue + Type from actual data table)
   * GET /api/v1/labeling-interdiction-override/filter-dropdown
   */
  getFilterDropdown(): Observable<{ cueOptions: FilterDropdownOption[]; typeOptions: FilterDropdownOption[] }> {
    const endpoint = API.APPLICATION_ADMIN.LABELING_INTERDICTION_OVERRIDE_FILTER_DROPDOWN;

    return this.apiService.get<FilterDropdownResponse>(endpoint).pipe(
      map(response => {
        const data = response?.data?.[0] || response?.Data?.[0] || {};
        return {
          cueOptions: data.CueOptions || data.cueOptions || [],
          typeOptions: data.TypeOptions || data.typeOptions || []
        };
      }),
      catchError(error => throwError(() => error))
    );
  }

  private extractDropdownData(response: DropdownResponse): LabelingInterdictionOverrideFilterLov {
    if (response?.item) {
      return response.item;
    }
    if (response?.data && Array.isArray(response.data) && response.data.length > 0) {
      return response.data[0];
    }
    return {} as LabelingInterdictionOverrideFilterLov;
  }
}
