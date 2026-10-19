import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  ValidFilterModel,
  ValidFilterCreateDto,
  ValidFilterUpdateDto,
  ValidFilterQueryParamsDto,
  ValidFilterResponseDto,
  FilterDropdownResponse,
  AddDropdownResponse
} from '../models/valid-filters.model';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  statusCode?: number;
  totalCount?: number;
  errorResponse?: { errorCode: string; error: string };
}

@Injectable({
  providedIn: 'root',
})
export class ValidFiltersApiService {
  private readonly apiService = inject(ApiService);

  getValidFilters(
    take: number,
    skip: number,
    params: ValidFilterQueryParamsDto
  ): Observable<ValidFilterResponseDto> {
    const url = API.VALID_FILTERS.LIST(take, skip);
    const payload: Record<string, unknown> = {};

    if (params.vendorName) payload['vendorName'] = params.vendorName;
    if (params.catalogNumber) payload['catalogNumber'] = params.catalogNumber;
    if (params.productType) payload['productType'] = params.productType;
    if (params.numberOfDays != null) payload['numberOfDays'] = params.numberOfDays;
    if (params.sortColumn) payload['sortColumn'] = params.sortColumn;
    if (params.sortOrder) payload['sortOrder'] = params.sortOrder;

    return this.apiService
      .post<ApiResponse<ValidFilterModel[]>>(url, payload)
      .pipe(
        map((response) => {
          const data = response?.data || [];
          const totalCount = response?.totalCount ?? data.length;
          return { data, totalCount };
        }),
        catchError((error) => throwError(() => error))
      );
  }

  getValidFilterById(
    catalogNumber: string,
    vendorName?: string,
    productType?: string
  ): Observable<ValidFilterModel> {
    let url = API.VALID_FILTERS.GET_BY_ID(catalogNumber);
    const queryParams: string[] = [];
    if (vendorName) queryParams.push(`vendorName=${encodeURIComponent(vendorName)}`);
    if (productType) queryParams.push(`productType=${encodeURIComponent(productType)}`);
    if (queryParams.length > 0) url += `?${queryParams.join('&')}`;

    return this.apiService
      .get<ApiResponse<ValidFilterModel>>(url)
      .pipe(
        map((response) => response.data),
        catchError((error) => throwError(() => error))
      );
  }

  createValidFilter(
    dto: ValidFilterCreateDto
  ): Observable<ApiResponse<ValidFilterModel>> {
    return this.apiService
      .post<ApiResponse<ValidFilterModel>>(
        API.VALID_FILTERS.CREATE,
        dto
      )
      .pipe(catchError((error) => throwError(() => error)));
  }

  updateValidFilter(
    catalogNumber: string,
    dto: ValidFilterUpdateDto,
    origProductType?: string
  ): Observable<ApiResponse<ValidFilterModel>> {
    let url = API.VALID_FILTERS.UPDATE(catalogNumber);
    if (origProductType) {
      url += `?origProductType=${encodeURIComponent(origProductType)}`;
    }
    return this.apiService
      .put<ApiResponse<ValidFilterModel>>(url, dto)
      .pipe(catchError((error) => throwError(() => error)));
  }

  getFilterDropdown(searchKeyword?: string): Observable<FilterDropdownResponse> {
    let url = API.VALID_FILTERS.FILTER_DROPDOWN;
    if (searchKeyword) {
      url += `?searchKeyword=${encodeURIComponent(searchKeyword)}`;
    }
    return this.apiService
      .get<ApiResponse<FilterDropdownResponse>>(url)
      .pipe(
        map((response) => response?.data || { manufacturerNames: [], catalogs: [], productTypes: [] }),
        catchError((error) => throwError(() => error))
      );
  }

  getAddDropdown(): Observable<AddDropdownResponse> {
    return this.apiService
      .get<ApiResponse<AddDropdownResponse>>(API.VALID_FILTERS.ADD_DROPDOWN)
      .pipe(
        map((response) => response?.data || { catalogs: [], productTypes: [] }),
        catchError((error) => throwError(() => error))
      );
  }
}
