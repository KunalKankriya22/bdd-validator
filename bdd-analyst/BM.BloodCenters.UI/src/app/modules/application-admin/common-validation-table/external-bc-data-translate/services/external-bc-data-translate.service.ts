import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import {
  ExternalBcDataTranslateModel,
  ExternalBcDataTranslateParamsDto,
  ExternalBcDataTranslateDto,
  UpdateExternalBcDataTranslateDto,
  ExternalBcDataTranslateDropdownsResponse,
  CodeDescriptionOption,
  SourceCodeDescriptionResponse
} from '../models/external-bc-data-translate.model';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';

interface ReturnResult<T> {
  data?: T[];
  total?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ExternalBcDataTranslateService {
  private readonly apiService = inject(ApiService);

  /**
   * Get External BC Data Translate list with pagination, sorting, and filtering
   * POST /api/v1/external-data-translate/search-sort-filter/{take}/{skip}/{sourceId}/{targetId}
   * @param take - Number of records to fetch
   * @param skip - Number of records to skip
   * @param sourceId - Source ID filter
   * @param targetId - Target ID filter
   * @param params - Filter and search parameters
   * @returns Observable with table data and total count
   */
  getExternalBcDataTranslate(
    take: number,
    skip: number,
    sourceId: string,
    targetId: string,
    params: ExternalBcDataTranslateParamsDto
  ): Observable<{ data: ExternalBcDataTranslateModel[]; totalRecords: number }> {
    const endpoint = API.APPLICATION_ADMIN.EXTERNAL_BC_DATA_TRANSLATE(take, skip, sourceId, targetId);

    return this.apiService.post<ReturnResult<ExternalBcDataTranslateModel>>(endpoint, params).pipe(
      map(response => ({
        data: response.data || [],
        totalRecords: response.total || 0
      })),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Get dropdown options for source/target IDs and code types (for Add/Edit panel)
   * Returns ALL valid values from VALID_MASTER_CODES
   * GET /api/v1/external-data-translate/dropdowns
   * @returns Observable with dropdown options
   */
  getDropdowns(): Observable<ExternalBcDataTranslateDropdownsResponse> {
    const endpoint = API.APPLICATION_ADMIN.EXTERNAL_BC_DATA_TRANSLATE_DROPDOWNS;

    return this.apiService.get<ExternalBcDataTranslateDropdownsResponse>(endpoint).pipe(
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Get filter-specific dropdown options (for Filter panel)
   * Returns ONLY source/target code types present in IDP_CONV_REF_VALUES
   * Filtered by currently selected Source ID and Target ID to show only relevant data
   * GET /api/v1/external-data-translate/filter-dropdowns/{sourceId}/{targetId}
   * @param sourceId - Currently selected Source ID (use 'ALL' if none selected)
   * @param targetId - Currently selected Target ID
   * @returns Observable with filter dropdown options
   */
  getFilterDropdowns(sourceId: string, targetId: string): Observable<ExternalBcDataTranslateDropdownsResponse> {
    const endpoint = API.APPLICATION_ADMIN.EXTERNAL_BC_DATA_TRANSLATE_FILTER_DROPDOWNS(sourceId, targetId);

    return this.apiService.get<ExternalBcDataTranslateDropdownsResponse>(endpoint).pipe(
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Get source code description by code
   * GET /api/v1/external-data-translate/source-code-description/{code}
   * @param code - Source code type
   * @returns Observable with code description
   */
  getSourceCodeDescription(code: string): Observable<string> {
    const endpoint = API.APPLICATION_ADMIN.EXTERNAL_BC_DATA_TRANSLATE_SOURCE_CODE_DESCRIPTION(code);

    return this.apiService.get<SourceCodeDescriptionResponse>(endpoint).pipe(
      map(response => response.item?.description || ''),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Get target values filtered by target code type
   * GET /api/v1/external-data-translate/target-values/{targetCodeType}
   * @param targetCodeType - Target code type to filter by
   * @returns Observable with filtered target values as code-description pairs
   */
  getTargetValuesByCodeType(targetCodeType: string): Observable<CodeDescriptionOption[]> {
    const endpoint = API.APPLICATION_ADMIN.EXTERNAL_BC_DATA_TRANSLATE_TARGET_VALUES_BY_CODE_TYPE(targetCodeType);

    return this.apiService.get<{ data: { value: string; description: string }[] }>(endpoint).pipe(
      map(response => (response.data || []).map(item => ({
        code: item.value || '',
        description: item.description || ''
      }))),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Add new conversion code
   * POST /api/v1/external-data-translate
   * @param payload - Conversion code data to add
   * @returns Observable with API response
   */
  addConversionCode(payload: ExternalBcDataTranslateDto): Observable<any> {
    const endpoint = API.APPLICATION_ADMIN.ADD_EXTERNAL_BC_DATA_TRANSLATE;

    return this.apiService.post<any>(endpoint, payload).pipe(
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Update existing conversion code
   * PUT /api/v1/external-data-translate
   * @param payload - Updated conversion code data
   * @returns Observable with API response
   */
  updateConversionCode(payload: UpdateExternalBcDataTranslateDto): Observable<any> {
    const endpoint = API.APPLICATION_ADMIN.UPDATE_EXTERNAL_BC_DATA_TRANSLATE;

    return this.apiService.put<any>(endpoint, payload).pipe(
      catchError(error => throwError(() => error))
    );
  }
}
