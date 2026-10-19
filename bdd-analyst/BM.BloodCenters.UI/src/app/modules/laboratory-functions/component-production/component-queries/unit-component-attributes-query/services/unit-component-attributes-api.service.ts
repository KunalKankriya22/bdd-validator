import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  CpqUnitValidationResponseDto,
  CpqQueryAttributesResponseDto,
  ApiResponse,
  UnitComponentAttributesQueryParams,
  ProductCodeLovDto,
  CpqUnitAttributeQueryDto,
  CpqComponentAttributeQueryDto,
  UnitAttributesFilterOptionsDto,
  ComponentAttributesFilterOptionsDto,
  PaginatedApiResponse,
  UnitAttributeDto,
  ComponentAttributeDto,
} from '../models/unit-component-attributes.interface';

@Injectable({
  providedIn: 'root',
})
export class UnitComponentAttributesApiService {
  private readonly apiService = inject(ApiService);

  validateUnit(unitId: string): Observable<ApiResponse<CpqUnitValidationResponseDto>> {
    const url = API.UNIT_COMPONENT_ATTRIBUTES.VALIDATE_UNIT(unitId);
    return this.apiService
      .get<ApiResponse<CpqUnitValidationResponseDto>>(url)
      .pipe(catchError((error) => throwError(() => error)));
  }

  queryAttributes(
    params: UnitComponentAttributesQueryParams
  ): Observable<ApiResponse<CpqQueryAttributesResponseDto>> {
    const url = API.UNIT_COMPONENT_ATTRIBUTES.QUERY(
      params.unitId,
      params.collDate,
      params.codeScheme,
      params.productCode
    );
    return this.apiService
      .get<ApiResponse<CpqQueryAttributesResponseDto>>(url)
      .pipe(catchError((error) => throwError(() => error)));
  }

  getProductCodes(
    unitId: string,
    collDate: string,
    codeScheme: string
  ): Observable<ApiResponse<ProductCodeLovDto[]>> {
    const url = API.UNIT_COMPONENT_ATTRIBUTES.PRODUCT_CODES(unitId, collDate, codeScheme);
    return this.apiService
      .get<ApiResponse<ProductCodeLovDto[]>>(url)
      .pipe(catchError((error) => throwError(() => error)));
  }

  /**
   * Get paginated unit attributes with server-side filtering, sorting, searching
   */
  getUnitAttributesPaginated(
    take: number,
    skip: number,
    queryDto: CpqUnitAttributeQueryDto
  ): Observable<PaginatedApiResponse<UnitAttributeDto[]>> {
    const url = API.UNIT_COMPONENT_ATTRIBUTES.UNIT_ATTRIBUTES(take, skip);
    return this.apiService
      .post<PaginatedApiResponse<UnitAttributeDto[]>>(url, queryDto)
      .pipe(catchError((error) => throwError(() => error)));
  }

  /**
   * Get filter options for unit attributes (dropdowns)
   */
  getUnitAttributesFilterOptions(
    unitId: string,
    collDate: string,
    codeScheme: string
  ): Observable<ApiResponse<UnitAttributesFilterOptionsDto>> {
    const url = API.UNIT_COMPONENT_ATTRIBUTES.UNIT_ATTRIBUTES_FILTER_OPTIONS(
      unitId,
      collDate,
      codeScheme
    );
    return this.apiService
      .get<ApiResponse<UnitAttributesFilterOptionsDto>>(url)
      .pipe(catchError((error) => throwError(() => error)));
  }

  /**
   * Get paginated component attributes with server-side filtering, sorting, searching
   */
  getComponentAttributesPaginated(
    take: number,
    skip: number,
    queryDto: CpqComponentAttributeQueryDto
  ): Observable<PaginatedApiResponse<ComponentAttributeDto[]>> {
    const url = API.UNIT_COMPONENT_ATTRIBUTES.COMPONENT_ATTRIBUTES(take, skip);
    return this.apiService
      .post<PaginatedApiResponse<ComponentAttributeDto[]>>(url, queryDto)
      .pipe(catchError((error) => throwError(() => error)));
  }

  /**
   * Get filter options for component attributes (dropdowns)
   */
  getComponentAttributesFilterOptions(
    unitId: string,
    collDate: string,
    codeScheme: string,
    productCode?: string
  ): Observable<ApiResponse<ComponentAttributesFilterOptionsDto>> {
    const url = API.UNIT_COMPONENT_ATTRIBUTES.COMPONENT_ATTRIBUTES_FILTER_OPTIONS(
      unitId,
      collDate,
      codeScheme,
      productCode
    );
    return this.apiService
      .get<ApiResponse<ComponentAttributesFilterOptionsDto>>(url)
      .pipe(catchError((error) => throwError(() => error)));
  }
}
