import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { API } from '@core/constants/api.constants';
import {
  ProductCodesResponse,
  ProductCodeRequest,
  ProductCodeParamsDto,
  ProductCodeApiResponse,
  ProductCodeDto,
  ProductTypeLookup,
  ProductClassLookup,
  ModifierLookup,
  InventoryClassLookup,
  ProductAttributesResponse,
  ProductAttribute,
  ProductCode,
  SingleProductApiResponse,
  ApiResponse,
  LookupItemsResponse
} from '../models/product-codes.model';

@Injectable({
  providedIn: 'root'
})
export class ProductCodesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/v1/valid-products`;

  /**
   * Get product codes with pagination and filtering
   * Backend: POST /valid-products/{take}/{skip} with body
   */
  getProductCodes(
    pageSize: number,
    skip: number,
    params?: ProductCodeParamsDto
  ): Observable<ProductCodesResponse> {
    const body = {
      searchKeyword: params?.searchKeyword || null,
      sortColumn: params?.sortColumn || null,
      sortOrder: params?.sortOrder || null,
      productType: params?.productType || null,
      productClass: params?.productClass || null,
      effectiveDate: params?.effectiveDate || null,
      effectivePeriod: params?.effectivePeriod || null,
      terminationDate: params?.terminationDate || null,
      terminationPeriod: params?.terminationPeriod || null
    };

    return this.http.post<ProductCodeApiResponse>(`${this.baseUrl}/${pageSize}/${skip}`, body).pipe(
      map(response => ({
        data: response.data?.map((item: ProductCodeDto) => ({
          ...item,
          effDate: item.effDate ? new Date(item.effDate) : undefined,
          termDate: item.termDate ? new Date(item.termDate) : null,
          lastModifiedDate: item.lastModifiedDate ? new Date(item.lastModifiedDate) : undefined
        })) || [],
        total: response.total || 0
      }))
    );
  }

  /**
   * Get single product code by ID
   * Backend: GET /valid-products/{productCode}
   */
  getProductCodeById(productCode: string): Observable<ProductCode | null> {
    return this.http.get<SingleProductApiResponse>(`${this.baseUrl}/${productCode}`).pipe(
      map(response => {
        if (response.data && response.data.length > 0) {
          const item = response.data[0];
          return {
            ...item,
            effDate: item.effDate ? new Date(item.effDate) : undefined,
            termDate: item.termDate ? new Date(item.termDate) : null,
            lastModifiedDate: item.lastModifiedDate ? new Date(item.lastModifiedDate) : undefined
          };
        }
        return null;
      })
    );
  }

  /**
   * Create new product code
   * Backend: POST /valid-products
   */
  createProductCode(request: ProductCodeRequest): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(this.baseUrl, request);
  }

  /**
   * Update existing product code
   * Backend: PUT /valid-products/{productCode}
   */
  updateProductCode(productCode: string, request: ProductCodeRequest): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.baseUrl}/${productCode}`, request);
  }

  /**
   * Delete product code (soft delete - sets TERM_DATE)
   * Backend: DELETE /valid-products/{productCode}
   */
  deleteProductCode(productCode: string): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.baseUrl}/${productCode}`);
  }

  /**
   * Get product attributes for view mode
   * Backend: GET /valid-products/{productCode}/attributes
   */
  getProductAttributes(productCode: string): Observable<ProductAttribute[]> {
    return this.http.get<ProductAttributesResponse>(`${this.baseUrl}/${productCode}/attributes`).pipe(
      map(response => response.data || [])
    );
  }

  /**
   * Get product types for dropdown
   * Backend: GET /api/v1/lab/product-types/lov
   */
  getProductTypes(): Observable<ProductTypeLookup[]> {
    return this.http.get<LookupItemsResponse<ProductTypeLookup>>(`${environment.apiUrl}${API.COMPONENT_PRODUCTION.PRODUCT_CODES.PRODUCT_TYPES_LOV}`).pipe(
      map(response => response.data || [])
    );
  }

  /**
   * Get product classes for dropdown
   * Backend: GET /api/v1/lab/product-types/product-classes
   */
  getProductClasses(): Observable<ProductClassLookup[]> {
    return this.http.get<LookupItemsResponse<ProductClassLookup>>(`${environment.apiUrl}${API.COMPONENT_PRODUCTION.PRODUCT_CODES.PRODUCT_CLASSES}`).pipe(
      map(response => response.data || [])
    );
  }

  /**
   * Get modifiers for dropdown
   * Backend: GET /api/v1/lab/product-types/modifiers
   */
  getModifiers(): Observable<ModifierLookup[]> {
    return this.http.get<LookupItemsResponse<ModifierLookup>>(`${environment.apiUrl}${API.COMPONENT_PRODUCTION.PRODUCT_CODES.MODIFIERS}`).pipe(
      map(response => response.data || [])
    );
  }

  /**
   * Get inventory classes for dropdown
   * Backend: GET /api/v1/lab/product-types/inventory-classes
   */
  getInventoryClasses(): Observable<InventoryClassLookup[]> {
    return this.http.get<LookupItemsResponse<InventoryClassLookup>>(`${environment.apiUrl}${API.COMPONENT_PRODUCTION.PRODUCT_CODES.INVENTORY_CLASSES}`).pipe(
      map(response => response.data || [])
    );
  }

  /**
   * Validate product formula
   * Backend: POST /api/v1/valid-products/validate-formula
   */
  validateFormula(productFormula: string | null): Observable<{ success: boolean; error?: string; errorCode?: string }> {
    return this.http.post<any>(`${this.baseUrl}/validate-formula`, {
      productFormula: productFormula?.trim() || null
    }).pipe(
      map(response => ({ success: response.success === true })),
      catchError(error => {
        return of({
          success: false,
          error: error.error?.error || error.error?.message || 'Invalid formula',
          errorCode: error.error?.errorCode
        });
      })
    );
  }
}
