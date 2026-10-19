import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import {
  ProductServiceCodeDto,
  ProductServiceCodeQueryDto,
  UpdateProductServiceCodeDto,
  ProductCodeLOV,
  InventoryProductTypeLOV,
  ProductionProductTypeLOV,
  ServiceCodeLOV
} from '../models/enter-product-service-codes.model';

export interface ApiResponse<T> {
  data: T[];
  totalCount: number;
  success: boolean;
  message?: string;
  statusCode?: number;
}

@Injectable({
  providedIn: 'root'
})
export class EnterProductServiceCodesApiService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/v1/distributions`;

  /**
   * Search/filter products with pagination
   * POST /v1/api/distributions/{take}/{skip}
   */
  getProductServiceCodes(
    query: ProductServiceCodeQueryDto,
    take: number,
    skip: number
  ): Observable<{ data: ProductServiceCodeDto[]; total: number }> {
    const url = `${this.baseUrl}/${take}/${skip}`;

    return this.http.post<ApiResponse<ProductServiceCodeDto>>(url, query).pipe(
      map(response => ({
        data: response.data || [],
        total: response.totalCount || response.data?.length || 0
      })),
      catchError(error => {
        console.error('Failed to load product service codes:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get single product by code
   * GET /v1/api/distributions/{productCode}
   */
  getProductServiceCode(productCode: string): Observable<ProductServiceCodeDto | null> {
    const url = `${this.baseUrl}/${productCode}`;

    return this.http.get<ApiResponse<ProductServiceCodeDto>>(url).pipe(
      map(response => response.data?.[0] || null),
      catchError(error => {
        console.error(`Failed to load product ${productCode}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update service code and/or price
   * PUT /v1/api/distributions/{productCode}
   */
  updateProductServiceCode(
    productCode: string,
    dto: UpdateProductServiceCodeDto
  ): Observable<void> {
    const url = `${this.baseUrl}/${productCode}`;

    return this.http.put<ApiResponse<void>>(url, dto).pipe(
      map(() => void 0),
      catchError(error => {
        console.error(`Failed to update product ${productCode}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get inventory product types LOV
   * GET /v1/api/distributions/inventory-product-types
   */
  getInventoryProductTypes(): Observable<InventoryProductTypeLOV[]> {
    const url = `${this.baseUrl}/inventory-product-types`;

    return this.http.get<ApiResponse<InventoryProductTypeLOV>>(url).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error('Failed to load inventory product types:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get production product types LOV
   * GET /v1/api/distributions/production-product-types
   */
  getProductionProductTypes(): Observable<ProductionProductTypeLOV[]> {
    const url = `${this.baseUrl}/production-product-types`;

    return this.http.get<ApiResponse<ProductionProductTypeLOV>>(url).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error('Failed to load production product types:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get product codes LOV
   * GET /v1/api/distributions/product-codes
   */
  getProductCodes(): Observable<ProductCodeLOV[]> {
    const url = `${this.baseUrl}/product-codes`;

    return this.http.get<ApiResponse<ProductCodeLOV>>(url).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error('Failed to load product codes:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get service codes LOV
   * GET /v1/api/distributions/service-codes
   */
  getServiceCodes(): Observable<ServiceCodeLOV[]> {
    const url = `${this.baseUrl}/service-codes`;

    return this.http.get<ApiResponse<ServiceCodeLOV>>(url).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error('Failed to load service codes:', error);
        return throwError(() => error);
      })
    );
  }
}
