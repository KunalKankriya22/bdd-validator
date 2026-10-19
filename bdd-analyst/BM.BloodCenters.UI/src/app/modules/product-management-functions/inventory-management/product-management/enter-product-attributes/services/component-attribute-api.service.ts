import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../../../../../../environments/environment';
import { API } from '@core/constants/api.constants';
import {
  ComponentAttributeDto,
  CreateComponentAttributeRequestDto,
  ComponentAttributeQueryDto,
  ValidateUnitRequestDto,
  ValidateUnitResponseDto,
  ApiResponse,
  ProductDto,
  AttributeGroupDto,
  AttributeCodeDto,
} from '../models/component-attribute.model';
import { HeaderService } from '@shared/services/header.service';

/**
 * Component Attribute API Service
 * Handles all API calls for Enter Product Attributes (VADDTST)
 * Base URL: /api/component-attributes
 */
@Injectable({ providedIn: 'root' })
export class ComponentAttributeApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}`;
  private readonly headerService = inject(HeaderService);

  /**
   * Get all component attributes with pagination, filtering, sorting
   * POST /component-attributes/{take}/{skip}
   */
  getAll(
    take: number,
    skip: number,
    query?: ComponentAttributeQueryDto
  ): Observable<ApiResponse<ComponentAttributeDto[]>> {
    const url = `${this.baseUrl}${API.COMPONENT_ATTRIBUTES.GET_ALL(take, skip)}`;
    return this.http.post<ApiResponse<ComponentAttributeDto[]>>(url, query || {});
  }

  /**
   * Get component attribute by composite key
   * GET /component-attributes/{unitId}/{collDate}/{productCode}/{attribGroup}/{attribCode}
   */
  getById(
    unitId: string,
    collDate: string,
    productCode: string,
    attribGroup: string,
    attribCode: string
  ): Observable<ApiResponse<ComponentAttributeDto>> {
    const url = `${this.baseUrl}${API.COMPONENT_ATTRIBUTES.GET_BY_ID(
      unitId,
      collDate,
      productCode,
      attribGroup,
      attribCode
    )}`;
    return this.http.get<ApiResponse<ComponentAttributeDto>>(url);
  }

  /**
   * Create component attribute
   * POST /component-attributes
   */
  create(dto: CreateComponentAttributeRequestDto): Observable<ApiResponse<ComponentAttributeDto>> {
    const url = `${this.baseUrl}${API.COMPONENT_ATTRIBUTES.CREATE}`;
    return this.http.post<ApiResponse<ComponentAttributeDto>>(url, dto);
  }

  /**
   * Delete component attribute by composite key
   * DELETE /component-attributes/{unitId}/{collDate}/{productCode}/{attribGroup}/{attribCode}
   */
  delete(
    unitId: string,
    collDate: string,
    productCode: string,
    attribGroup: string,
    attribCode: string
  ): Observable<ApiResponse<boolean>> {
    const url = `${this.baseUrl}${API.COMPONENT_ATTRIBUTES.DELETE(
      unitId,
      collDate,
      productCode,
      attribGroup,
      attribCode
    )}`;
    return this.http.delete<ApiResponse<boolean>>(url);
  }

  /**
   * Validate unit ID and check for active components
   * POST /component-attributes/validate-unit
   */
  validateUnit(dto: ValidateUnitRequestDto): Observable<ApiResponse<ValidateUnitResponseDto>> {
    const url = `${this.baseUrl}${API.COMPONENT_ATTRIBUTES.VALIDATE_UNIT}`;
    return this.http.post<any>(url, dto).pipe(
      map(res => ({
        ...res,
        // backend returns data as List<T> (array) — unwrap to single object
        data: Array.isArray(res.data) ? (res.data[0] ?? null) : res.data,
      }))
    );
  }

  /**
   * Get products for a unit
   * GET /api/v1/component-attributes/product-codes?unitId=&chapterId=
   */
  getProductsForUnit(unitId: string, collDate: string): Observable<ProductDto[]> {
    const url = `${this.baseUrl}${API.COMPONENT_ATTRIBUTES.GET_PRODUCT_CODES(unitId, collDate)}`;
    return this.http.get<ApiResponse<ProductDto[]>>(url).pipe(
      map((response) => {
        if (!response.success || !response.data) {
          return [];
        }
        return response.data.map((item: any) => ({
          productCode: item.productCode,
          productDescription: item.productDesc ?? item.productDescription ?? item.productCode,
        }));
      })
    );
  }

  /**
   * Get attribute groups from database, filtered by productCode
   * GET /api/v1/component-attributes/attribute-groups?productCode=
   */
  getAttributeGroups(productCode: string, codeScheme?: string): Observable<AttributeGroupDto[]> {
    const url = `${this.baseUrl}${API.COMPONENT_ATTRIBUTES.GET_ATTRIBUTE_GROUPS(productCode, codeScheme)}`;
    return this.http.get<ApiResponse<AttributeGroupDto[]>>(url).pipe(
      map((response) => {
        if (!response.success || !response.data) {
          return [];
        }
        return response.data;
      })
    );
  }

  /**
   * Get attribute codes filtered by group from database
   * GET /api/v1/component-attributes/attribute-codes/{attribGroup}?unitId=&productCode=&codeScheme=
   */
  getAttributeCodes(attribGroup: string, unitId: string, productCode: string, codeScheme?: string): Observable<AttributeCodeDto[]> {
    const url = `${this.baseUrl}${API.COMPONENT_ATTRIBUTES.GET_ATTRIBUTE_CODES(attribGroup, unitId, productCode, codeScheme)}`;
    return this.http.get<ApiResponse<AttributeCodeDto[]>>(url).pipe(
      map((response) => {
        if (!response.success || !response.data) {
          return [];
        }
        return response.data;
      })
    );
  }
}
