import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  PrePrintedProductLabelModel,
  PrePrintedProductLabelCreateDto,
  PrePrintedProductLabelUpdateDto,
  PrePrintedProductLabelQueryParamsDto,
  PrePrintedProductLabelResponseDto,
  FilterDropdownResponse,
  AddDropdownResponse,
  ProductCodeItem
} from '../models/pre-printed-product-labels.model';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  item: T;
  message?: string;
  error?: string;
  statusCode?: number;
  total?: number;
  errorResponse?: {
    errorCode: string;
    error: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class PrePrintedProductLabelsApiService {
  private readonly apiService = inject(ApiService);

  getPrePrintedProductLabels(
    take: number,
    skip: number,
    params: PrePrintedProductLabelQueryParamsDto
  ): Observable<PrePrintedProductLabelResponseDto> {
    const url = API.PRE_PRINTED_PRODUCT_LABELS.LIST(take, skip);
    const payload: Record<string, unknown> = {};

    if (params.catalogNumber) payload['catalogNumber'] = params.catalogNumber;
    if (params.productType) payload['productType'] = params.productType;
    if (params.bagCode) payload['bagCode'] = params.bagCode;
    if (params.faceLabel) payload['faceLabel'] = params.faceLabel;
    if (params.searchKeyword) payload['searchKeyword'] = params.searchKeyword;
    if (params.effDate) payload['effDateFrom'] = params.effDate;
    if (params.effDatePeriod) payload['effDatePeriod'] = params.effDatePeriod;
    if (params.termDate) payload['termDateFrom'] = params.termDate;
    if (params.termDatePeriod) payload['termDatePeriod'] = params.termDatePeriod;
    if (params.sortColumn) payload['sortColumn'] = params.sortColumn;
    if (params.sortOrder) payload['sortOrder'] = params.sortOrder;

    return this.apiService
      .post<ApiResponse<PrePrintedProductLabelModel[]>>(url, payload)
      .pipe(
        map((response) => {
          const data = response?.data || [];
          const totalCount = response?.total ?? data.length;
          return { data, totalCount };
        }),
        catchError((error) => throwError(() => error))
      );
  }

  getPrePrintedProductLabelById(
    catalogNumber: string,
    productType: string
  ): Observable<PrePrintedProductLabelModel> {
    const url = API.PRE_PRINTED_PRODUCT_LABELS.GET_BY_ID(catalogNumber, productType);
    return this.apiService
      .get<ApiResponse<PrePrintedProductLabelModel>>(url)
      .pipe(
        map((response) => response.item || response.data),
        catchError((error) => throwError(() => error))
      );
  }

  createPrePrintedProductLabel(
    dto: PrePrintedProductLabelCreateDto
  ): Observable<ApiResponse<PrePrintedProductLabelModel>> {
    return this.apiService
      .post<ApiResponse<PrePrintedProductLabelModel>>(
        API.PRE_PRINTED_PRODUCT_LABELS.CREATE,
        dto
      )
      .pipe(catchError((error) => throwError(() => error)));
  }

  updatePrePrintedProductLabel(
    catalogNumber: string,
    productType: string,
    dto: PrePrintedProductLabelUpdateDto
  ): Observable<ApiResponse<PrePrintedProductLabelModel>> {
    const url = API.PRE_PRINTED_PRODUCT_LABELS.UPDATE(catalogNumber, productType);
    return this.apiService
      .put<ApiResponse<PrePrintedProductLabelModel>>(url, dto)
      .pipe(catchError((error) => throwError(() => error)));
  }

  getFilterDropdown(): Observable<FilterDropdownResponse> {
    return this.apiService
      .get<ApiResponse<FilterDropdownResponse>>(API.PRE_PRINTED_PRODUCT_LABELS.FILTER_DROPDOWN)
      .pipe(
        map((response) => {
          const data = response?.item || response?.data;
          return data || { catalogNumbers: [], productTypes: [], bagCodes: [], faceLabels: [] };
        }),
        catchError((error) => throwError(() => error))
      );
  }

  getAddDropdown(): Observable<AddDropdownResponse> {
    return this.apiService
      .get<ApiResponse<AddDropdownResponse>>(API.PRE_PRINTED_PRODUCT_LABELS.ADD_DROPDOWN)
      .pipe(
        map((response) => {
          const data = response?.item || response?.data;
          return data || { catalogNumbers: [], productTypes: [], bagCodes: [] };
        }),
        catchError((error) => throwError(() => error))
      );
  }

  getProductCodes(productType: string): Observable<ProductCodeItem[]> {
    const url = API.PRE_PRINTED_PRODUCT_LABELS.PRODUCT_CODES(productType);
    return this.apiService
      .get<any>(url)
      .pipe(
        map((response) => {
          const data = response?.data;
          if (Array.isArray(data) && data.length > 0) {
            if (data[0]?.productCodes) {
              return data[0].productCodes;
            }
            if (data[0]?.key) {
              return data;
            }
          }
          const item = response?.item;
          if (Array.isArray(item)) {
            return item;
          }
          if (item?.productCodes) {
            return item.productCodes;
          }
          return [];
        }),
        catchError(() => of([]))
      );
  }
}
