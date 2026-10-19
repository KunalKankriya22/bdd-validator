import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';
import {
  ComponentPrefixItem,
  ComponentWeightUnitDetailsResponse,
  ProductOption,
  UpdateComponentWeightRequestDto,
  UpdateComponentWeightResponseDto,
} from '../models/modify-component-weight.model';

/**
 * Generic API response wrapper
 */
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T[] | null;
  statusCode?: number;
  total?: number;
}

/**
 * API Service for Modify Component Weight feature
 * Integrates with ModifyComponentWeightController endpoints
 */
@Injectable({ providedIn: 'root' })
export class ModifyComponentWeightApiService {
  private apiService = inject(ApiService);

  /**
   * Get unit details with components for weight modification
   * GET /api/v1/component-weight/units/{unitId}
   */
  getUnitDetails(unitId: string, chapterId: string): Observable<ComponentWeightUnitDetailsResponse> {
    const url = API.MODIFY_COMPONENT_WEIGHT.GET_UNIT_DETAILS(unitId, chapterId);
    return this.apiService.get<ApiResponse<ComponentWeightUnitDetailsResponse>>(url).pipe(
      map((response) => {
        if (!response.success || !response.data || response.data.length === 0) {
          throw new Error(response.message || 'Unit not found');
        }
        return response.data[0];
      })
    );
  }

  /**
   * Get valid products for a unit
   * GET /api/v1/component-weight/components/{unitId}/products
   */
  getValidProducts(
    unitId: string,
    collDate: string,
    chapterId: string,
    codeScheme: 'I' | 'C' = 'I'
  ): Observable<ProductOption[]> {
    const url = API.MODIFY_COMPONENT_WEIGHT.GET_VALID_PRODUCTS(unitId, collDate, chapterId, codeScheme);
    return this.apiService.get<any>(url).pipe(
      map((response) => {
        // Handle different response formats
        // Case 1: Direct array response
        if (Array.isArray(response)) {
          return response as ProductOption[];
        }

        // Case 2: Wrapped with data array (nested array: data[0] contains the actual array)
        if (response?.data && Array.isArray(response.data)) {
          if (response.data.length > 0 && Array.isArray(response.data[0])) {
            return response.data[0] as ProductOption[];
          }
          return response.data as ProductOption[];
        }

        // Case 3: Success flag with data
        if (response?.success && response?.data) {
          return Array.isArray(response.data) ? response.data : [response.data];
        }

        return [];
      })
    );
  }

  /**
   * Get available component prefixes for Codabar units (LOV)
   * GET /api/v1/component-weight/component-prefixes
   */
  getComponentPrefixes(
    unitId: string,
    collDate: string,
    productCode: string,
    codeScheme: string,
  ): Observable<ComponentPrefixItem[]> {
    const url = API.MODIFY_COMPONENT_WEIGHT.GET_COMPONENT_PREFIXES(unitId, collDate, productCode, codeScheme);
    return this.apiService.get<ComponentPrefixItem[]>(url).pipe(
      map((response) => (Array.isArray(response) ? response : [])),
    );
  }

  /**
   * Update component weight and anticoagulant volume
   * PUT /api/v1/component-weight/update
   */
  updateComponentWeight(
    request: UpdateComponentWeightRequestDto
  ): Observable<UpdateComponentWeightResponseDto> {
    const url = API.MODIFY_COMPONENT_WEIGHT.UPDATE;
    return this.apiService.put<ApiResponse<UpdateComponentWeightResponseDto>>(url, request).pipe(
      map((response) => {
        if (!response.success) {
          throw new Error(response.message || 'Update failed');
        }
        return response.data?.[0] || {
          success: response.success,
          message: response.message || '',
          interdictionApplied: false,
        };
      })
    );
  }
}
