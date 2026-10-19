import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  AntigenPricingMatrixModel,
  AntigenPricingMatrixCreateDto,
  AntigenPricingMatrixUpdateDto,
  AntigenPricingMatrixQueryParamsDto,
  AntigenPricingMatrixResponseDto
} from '../models/antigen-pricing-matrix.model';
import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  totalCount?: number;
  error?: string | null;
  errorCode?: string | null;
  errorResponse?: { errorCode?: string | null; error?: string | null } | null;
}

@Injectable({
  providedIn: 'root',
})
export class AntigenPricingMatrixApiService {
  private apiService = inject(ApiService);

  /**
   * Map API response field names to model field names
   * API uses: serviceCode, antigenQty, stdPrice, antigenDesc, effDate, termDate
   * Model uses: code, quantity, price, description, effDate, termDate
   */
  private mapApiResponseToModel(apiItem: any): AntigenPricingMatrixModel {
    return {
      code: apiItem.serviceCode,
      quantity: apiItem.antigenQty,
      price: apiItem.stdPrice,
      description: apiItem.antigenDesc,
      effDate: apiItem.effDate,
      termDate: apiItem.termDate,
      modificationDate: apiItem.lastModifiedDate
    };
  }

  /**
   * Get All Records (List with Filtering & Pagination)
   * Endpoint: POST /antigen-pricing-matrix/{take}/{skip}
   * @param take - Number of records to retrieve (page size)
   * @param skip - Number of records to skip (for pagination)
   * @param params - Query parameters for filtering
   * @returns Observable of AntigenPricingMatrixResponseDto
   */
  getAntigenPricingMatrix(
    take: number,
    skip: number,
    params: AntigenPricingMatrixQueryParamsDto
  ): Observable<AntigenPricingMatrixResponseDto> {
    const endpoint = API.ANTIGEN_PRICING_MATRIX.LIST(take, skip);

    // Build request body based on API spec
    const requestBody: Record<string, unknown> = {};

    if (params.searchKeyword) {
      requestBody['searchKeyword'] = params.searchKeyword;
    }

    if (params.serviceCode) {
      requestBody['serviceCode'] = params.serviceCode;
    }

    if (params.antigenQty !== undefined && params.antigenQty !== null) {
      requestBody['antigenQty'] = params.antigenQty;
    }

    if (params.effDatePeriod) {
      requestBody['effDatePeriod'] = params.effDatePeriod;
    }

    if (params.effDate) {
      requestBody['effDate'] = params.effDate;
    }

    if (params.termDatePeriod) {
      requestBody['termDatePeriod'] = params.termDatePeriod;
    }

    if (params.termDate) {
      requestBody['termDate'] = params.termDate;
    }

    if (params.sortColumn) {
      requestBody['sortColumn'] = params.sortColumn;
    }

    if (params.sortOrder) {
      requestBody['sortOrder'] = params.sortOrder;
    }

    return this.apiService.post<ApiResponse<any[]>>(endpoint, requestBody).pipe(
      map(response => ({
        data: (response.data || []).map(item => this.mapApiResponseToModel(item)),
        totalCount: response.totalCount || 0
      }))
    );
  }

  /**
   * Get Single Record by Composite Key
   * Endpoint: GET /antigen-pricing-matrix/{serviceCode}/{antigenQty}/{effDate}
   * @param serviceCode - Service code
   * @param antigenQty - Antigen quantity
   * @param effDate - Effective date (ISO format)
   * @returns Observable of single record
   */
  getAntigenPricingMatrixById(
    serviceCode: string,
    antigenQty: number,
    effDate: string
  ): Observable<ApiResponse<AntigenPricingMatrixModel>> {
    const endpoint = `/api/v1/antigen-pricing-matrix/${encodeURIComponent(serviceCode)}/${antigenQty}/${encodeURIComponent(effDate)}`;

    return this.apiService.get<ApiResponse<any>>(endpoint).pipe(
      map(response => ({
        success: response.success,
        statusCode: response.statusCode,
        message: response.message,
        data: response.data ? this.mapApiResponseToModel(response.data) : undefined
      }))
    );
  }

  /**
   * Create New Record
   * Endpoint: POST /antigen-pricing-matrix
   * @param dto - Create DTO
   * @returns Observable of API response
   */
  createAntigenPricingMatrix(
    dto: AntigenPricingMatrixCreateDto
  ): Observable<ApiResponse<{ serviceCode: string; antigenQty: number }>> {
    const endpoint = API.ANTIGEN_PRICING_MATRIX.CREATE;

    // Map frontend DTO to API request format
    const requestBody = {
      serviceCode: dto.code,
      antigenQty: dto.quantity,
      stdPrice: dto.price,
      antigenDesc: dto.description,
      effDate: dto.effDate,
      termDate: dto.termDate || undefined
    };

    return this.apiService.post<ApiResponse<{ serviceCode: string; antigenQty: number }>>(
      endpoint,
      requestBody
    );
  }

  /**
   * Update Existing Record
   * Endpoint: PUT /antigen-pricing-matrix/{serviceCode}/{oldAntigenQty}/{oldEffDate}
   * @param serviceCode - Original service code
   * @param oldAntigenQty - Original antigen quantity
   * @param oldEffDate - Original effective date
   * @param dto - Update DTO
   * @returns Observable of API response
   */
  updateAntigenPricingMatrix(
    serviceCode: string,
    oldAntigenQty: number,
    oldEffDate: string,
    dto: AntigenPricingMatrixUpdateDto
  ): Observable<ApiResponse<{ serviceCode: string; antigenQty: number }>> {
    const endpoint = `/api/v1/antigen-pricing-matrix/${encodeURIComponent(serviceCode)}/${oldAntigenQty}/${encodeURIComponent(oldEffDate)}`;

    // Map frontend DTO to API request format
    const requestBody = {
      serviceCode: dto.code,
      antigenQty: dto.quantity,
      stdPrice: dto.price,
      antigenDesc: dto.description,
      effDate: dto.effDate,
      termDate: dto.termDate || undefined
    };

    return this.apiService.put<ApiResponse<{ serviceCode: string; antigenQty: number }>>(
      endpoint,
      requestBody
    );
  }

  /**
   * Get Filter Dropdown Values
   * Endpoint: GET /antigen-pricing-matrix/filter-dropdown
   * @returns Observable of service codes array
   */
  getFilterDropdownValues(): Observable<string[]> {
    const endpoint = API.ANTIGEN_PRICING_MATRIX.FILTER_DROPDOWN;
    return this.apiService.get<ApiResponse<string[]>>(endpoint).pipe(
      map(response => response.data || [])
    );
  }

}
