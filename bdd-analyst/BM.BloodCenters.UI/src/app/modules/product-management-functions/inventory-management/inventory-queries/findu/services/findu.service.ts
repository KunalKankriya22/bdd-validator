import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ApiService } from '@shared/services/api.service';
import {
  UnitProductDto,
  UnitProductQueryDto,
  ProductTypeLookupDto,
  AttributeGroupLookupDto,
  AttributeLookupDto,
  BloodTypeLookupDto,
  ApiResponse
} from '../models/findu.models';
import { API } from '@core/constants/api.constants';

/**
 * Service for Find Units and Products (FINDU) API operations
 */
@Injectable({
  providedIn: 'root'
})
export class FinduService {
  constructor(private apiService: ApiService) {}

  /**
   * Search units and products with filters and pagination
   * @param queryDto Search filters and pagination parameters
   * @returns Observable of search results with total count
   */
  searchUnits(
    queryDto: UnitProductQueryDto
  ): Observable<{ data: UnitProductDto[]; total: number }> {
    return this.apiService
      .post<ApiResponse<UnitProductDto[]>>(API.FIND_UNITS_PRODUCTS.SEARCH, queryDto)
      .pipe(
        map(response => ({
          data: response.data || [],
          total: response.totalCount || 0
        }))
      );
  }

  /**
   * Get product types for dropdown (LOV)
   * @returns Observable of product type options
   */
  getProductTypes(): Observable<ProductTypeLookupDto[]> {
    return this.apiService
      .get<ApiResponse<ProductTypeLookupDto[]>>(API.FIND_UNITS_PRODUCTS.PRODUCT_TYPES)
      .pipe(map(response => response.data || []));
  }

  getAttributeGroups(): Observable<AttributeGroupLookupDto[]> {
    return this.apiService
      .get<ApiResponse<AttributeGroupLookupDto[]>>(API.FIND_UNITS_PRODUCTS.ATTRIBUTE_GROUPS)
      .pipe(map(response => response.data || []));
  }

  getAttributes(attributeGroup: string | null): Observable<AttributeLookupDto[]> {
    const endpoint = attributeGroup
      ? `${API.FIND_UNITS_PRODUCTS.ATTRIBUTES}?attributeGroup=${encodeURIComponent(attributeGroup)}`
      : API.FIND_UNITS_PRODUCTS.ATTRIBUTES;
    return this.apiService
      .get<ApiResponse<AttributeLookupDto[]>>(endpoint)
      .pipe(map(response => response.data || []));
  }

  /**
   * Get blood types for dropdown (LOV)
   * @returns Observable of blood type options
   */
  getBloodTypes(): Observable<BloodTypeLookupDto[]> {
    return this.apiService
      .get<ApiResponse<BloodTypeLookupDto[]>>(API.FIND_UNITS_PRODUCTS.BLOOD_TYPES)
      .pipe(map(response => response.data || []));
  }
}
