import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';
import {
  AttributeConfigDto,
  FunctionNameOption,
  LabProductTypeOption,
  AttributeClassOption,
  AttributeCodeOption,
  ModifierOption,
  SaveAttributeConfigRequest,
} from '../models/attribute-configurator.model';

interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T[];
  error: string | null;
  total: number;
}

interface DropdownResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T[];
  error: string | null;
}

interface BackendAttributeConfig {
  chapterId: string;
  productType: string;
  productTypeDesc: string | null;
  attribClass: string | null;
  attribCode: string | null;
  attribModifier: string | null;
  effDate: string;
  termDate?: string | null;
  fcnName: string | null;
  modifiedDate: string | null;
  lastModifiedBy: string;
  insertDate: string;
  insertUser: string;
}

/**
 * API error response structure for business logic errors (success: false)
 */
interface ApiErrorResponse {
  success: false;
  errorCode?: string;
  error?: string;
  message?: string;
  statusCode?: number;
  errorResponse?: {
    errorCode?: string;
    error?: string;
  };
}

interface ApiSuccessResult {
  success: true;
  message: string;
  data: AttributeConfigDto | null;
}

type CreateUpdateResult = ApiSuccessResult | ApiErrorResponse;

@Injectable({
  providedIn: 'root'
})
export class AttributeConfiguratorService {
  private readonly apiService = inject(ApiService);

  /**
   * Transforms backend response to frontend model
   */
  private transformBackendToFrontend(backendItem: BackendAttributeConfig): AttributeConfigDto {
    return {
      chapterId: backendItem.chapterId,
      functionName: backendItem.fcnName ?? '',
      labProductType: backendItem.productType,
      productDescription: backendItem.productTypeDesc ?? '',
      attributeClass: backendItem.attribClass,
      attributeCode: backendItem.attribCode,
      modifier: backendItem.attribModifier,
      effectiveDate: backendItem.effDate,
      terminationDate: backendItem.termDate || null,
      insertUser: backendItem.insertUser,
      insertDate: backendItem.insertDate,
      lastModifiedBy: backendItem.lastModifiedBy,
      modifiedDate: backendItem.modifiedDate
    };
  }

  /**
   * Get all attribute configurations with pagination and filters
   */
  getAttributeConfigurations(
    functionName: string,
    take: number = 25,
    skip: number = 0,
    searchKeyword?: string
  ): Observable<{ data: AttributeConfigDto[]; total: number }> {
    const payload: { fcnName: string; searchKeyword?: string } = {
      fcnName: functionName
    };

    if (searchKeyword && searchKeyword.trim()) {
      payload.searchKeyword = searchKeyword.trim();
    }

    return this.apiService.post<ApiResponse<BackendAttributeConfig>>(
      API.ATTRIBUTE_CONFIG.LIST(take, skip),
      payload
    ).pipe(
      map(response => ({
        data: (response.data || []).map(item => this.transformBackendToFrontend(item)),
        total: response.total || 0
      })),
      catchError(() => of({ data: [], total: 0 }))
    );
  }

  /**
   * Get attribute configuration by ID
   */
  getById(
    chapterId: string,
    productType: string,
    fcnName: string,
    attribClass?: string,
    attribCode?: string
  ): Observable<AttributeConfigDto | null> {
    return this.apiService.get<ApiResponse<BackendAttributeConfig>>(
      API.ATTRIBUTE_CONFIG.GET_BY_ID(chapterId, productType, fcnName, attribClass, attribCode)
    ).pipe(
      map(response => {
        const item = response.data && response.data.length > 0 ? response.data[0] : null;
        return item ? this.transformBackendToFrontend(item) : null;
      }),
      catchError(() => of(null))
    );
  }

  /**
   * Create new attribute configuration
   */
  create(data: SaveAttributeConfigRequest): Observable<CreateUpdateResult> {
    const payload = {
      productType: data.labProductType,
      fcnName: data.functionName,
      attribClass: data.attributeClass,
      attribCode: data.attributeCode,
      attribModifier: data.modifier,
      effDate: data.effectiveDate,
      termDate: data.terminationDate || null
    };

    return this.apiService.post<ApiResponse<BackendAttributeConfig> | ApiErrorResponse>(
      API.ATTRIBUTE_CONFIG.CREATE,
      payload
    ).pipe(
      map(response => {
        if (response?.success === false) {
          return response as ApiErrorResponse;
        }
        const successResp = response as ApiResponse<BackendAttributeConfig>;
        const item = successResp.data?.length > 0 ? successResp.data[0] : null;
        return {
          success: true as const,
          message: successResp.message || 'Record created successfully.',
          data: item ? this.transformBackendToFrontend(item) : null,
        };
      })
    );
  }

  /**
   * Update existing attribute configuration
   * ChapterId is taken from X-ChapterId header (user context), not from request body
   */
  update(
    productType: string,
    fcnName: string,
    data: SaveAttributeConfigRequest,
    attribClass?: string,
    attribCode?: string
  ): Observable<CreateUpdateResult> {
    // Format dates as ISO strings with time
    const formatDateWithTime = (dateStr: string | null): string | null => {
      if (!dateStr) return null;
      // If date already has time component, return as is
      if (dateStr.includes('T')) return dateStr;
      // Otherwise append time component
      return `${dateStr}T00:00:00`;
    };

    const payload = {
      originalProductType: productType,
      originalFcnName: fcnName,
      originalAttribClass: attribClass || '',
      originalAttribCode: attribCode || '',
      productType: data.labProductType,
      fcnName: data.functionName,
      attribClass: data.attributeClass,
      attribCode: data.attributeCode,
      attribModifier: data.modifier || '',
      effDate: formatDateWithTime(data.effectiveDate),
      termDate: formatDateWithTime(data.terminationDate)
    };

    return this.apiService.put<ApiResponse<BackendAttributeConfig> | ApiErrorResponse>(
      API.ATTRIBUTE_CONFIG.UPDATE,
      payload
    ).pipe(
      map(response => {
        if (response?.success === false) {
          return response as ApiErrorResponse;
        }
        const successResp = response as ApiResponse<BackendAttributeConfig>;
        const item = successResp.data?.length > 0 ? successResp.data[0] : null;
        return {
          success: true as const,
          message: successResp.message || 'Record updated successfully.',
          data: item ? this.transformBackendToFrontend(item) : null,
        };
      })
    );
  }

  /**
   * Get function names dropdown
   */
  getFunctionNames(): Observable<FunctionNameOption[]> {
    return this.apiService.get<DropdownResponse<FunctionNameOption>>(
      API.ATTRIBUTE_CONFIG.FUNCTION_NAMES
    ).pipe(
      map(response => response.data || []),
      catchError(() => of([]))
    );
  }

  /**
   * Get lab product types dropdown
   */
  getLabProductTypes(): Observable<LabProductTypeOption[]> {
    return this.apiService.get<DropdownResponse<LabProductTypeOption>>(
      API.ATTRIBUTE_CONFIG.PRODUCT_TYPES
    ).pipe(
      map(response => response.data || []),
      catchError(() => of([]))
    );
  }

  /**
   * Get attribute classes dropdown
   */
  getAttributeClasses(): Observable<AttributeClassOption[]> {
    return this.apiService.get<DropdownResponse<AttributeClassOption>>(
      API.ATTRIBUTE_CONFIG.ATTRIBUTE_CLASSES
    ).pipe(
      map(response => response.data || []),
      catchError(() => of([]))
    );
  }

  /**
   * Get attribute codes dropdown
   */
  getAttributeCodes(): Observable<AttributeCodeOption[]> {
    return this.apiService.get<DropdownResponse<AttributeCodeOption>>(
      API.ATTRIBUTE_CONFIG.ATTRIBUTE_CODES
    ).pipe(
      map(response => response.data || []),
      catchError(() => of([]))
    );
  }

  /**
   * Get modifiers dropdown
   */
  getModifiers(): Observable<ModifierOption[]> {
    return this.apiService.get<DropdownResponse<ModifierOption>>(
      API.ATTRIBUTE_CONFIG.ATTRIBUTE_MODIFIERS
    ).pipe(
      map(response => response.data || []),
      catchError(() => of([]))
    );
  }
}
