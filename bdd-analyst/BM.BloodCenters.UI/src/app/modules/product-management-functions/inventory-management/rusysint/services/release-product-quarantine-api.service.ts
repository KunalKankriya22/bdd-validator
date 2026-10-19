import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { API } from '@core/constants/api.constants';
import {
  QuarantineType,
  QuarantineProduct,
  QuarantineReason,
  StorageLocation,
  QuarantineProductQueryDto,
  ReleaseProductRequestDto,
  ReleaseProductResponse,
  ApiResponse,
  ApiSingleResponse
} from '../models/release-product-quarantine.model';

/**
 * API Service for Release Product Quarantine feature
 * Implements all 7 endpoints from API documentation
 */
@Injectable({
  providedIn: 'root'
})
export class ReleaseProductQuarantineApiService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}${API.RELEASE_PRODUCT_QUARANTINE.BASE}`;

  /**
   * 1. GET /release-product-quarantine/quarantine-types
   * Retrieve list of available quarantine types (QU = Quarantine, RT = Returns)
   */
  getQuarantineTypes(): Observable<QuarantineType[]> {
    const url = `${this.baseUrl}${API.RELEASE_PRODUCT_QUARANTINE.QUARANTINE_TYPES}`;

    return this.http.get<ApiResponse<QuarantineType>>(url).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error('Failed to load quarantine types:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * 2. POST /release-product-quarantine/products
   * Retrieve paginated list of quarantine products or return items with optional filtering
   */
  getQuarantineProducts(
    query: QuarantineProductQueryDto
  ): Observable<{ data: QuarantineProduct[]; total: number }> {
    const url = `${this.baseUrl}${API.RELEASE_PRODUCT_QUARANTINE.PRODUCTS}`;

    return this.http.post<ApiResponse<QuarantineProduct>>(url, query).pipe(
      map(response => ({
        data: response.data || [],
        total: response.totalCount || response.data?.length || 0
      })),
      catchError(error => {
        console.error('Failed to load quarantine products:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * 3. GET /release-product-quarantine/products/{unitId}/{productCode}/{aliquot}
   * Retrieve single quarantine product by unique identifier
   */
  getQuarantineProduct(
    unitId: string,
    productCode: string,
    aliquot: string
  ): Observable<QuarantineProduct | null> {
    const url = `${this.baseUrl}${API.RELEASE_PRODUCT_QUARANTINE.PRODUCT_BY_ID(unitId, productCode, aliquot)}`;

    return this.http.get<ApiResponse<QuarantineProduct>>(url).pipe(
      map(response => response.data?.[0] || null),
      catchError(error => {
        console.error(`Failed to load product ${unitId}/${productCode}/${aliquot}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * 4. GET /release-product-quarantine/products/{unitId}/{productCode}/{aliquot}/reasons
   * Retrieve all quarantine reasons associated with a product
   */
  getQuarantineReasons(
    unitId: string,
    productCode: string,
    aliquot: string
  ): Observable<QuarantineReason[]> {
    const url = `${this.baseUrl}${API.RELEASE_PRODUCT_QUARANTINE.REASONS(unitId, productCode, aliquot)}`;

    return this.http.get<ApiResponse<QuarantineReason>>(url).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error(`Failed to load reasons for ${unitId}/${productCode}/${aliquot}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * 5. GET /release-product-quarantine/locations?warehouseId={warehouseId}&productType={productType}&bloodType={bloodType}
   * Retrieve available storage locations for restocking products
   */
  getStorageLocations(
    warehouseId: string,
    productType?: string | null,
    bloodType?: string | null
  ): Observable<StorageLocation[]> {
    const url = `${this.baseUrl}${API.RELEASE_PRODUCT_QUARANTINE.LOCATIONS}`;

    let params = new HttpParams().set('warehouseId', warehouseId);

    if (productType) {
      params = params.set('productType', productType);
    }

    if (bloodType) {
      params = params.set('bloodType', bloodType);
    }

    return this.http.get<ApiResponse<StorageLocation>>(url, { params }).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error('Failed to load storage locations:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * 6. POST /release-product-quarantine/release
   * Release product from quarantine or restock returned product
   * Supports both restock (RestockFlag="Y") and reject (RestockFlag="N") operations
   */
  releaseProduct(request: ReleaseProductRequestDto): Observable<ReleaseProductResponse> {
    const url = `${this.baseUrl}${API.RELEASE_PRODUCT_QUARANTINE.RELEASE}`;

    return this.http.post<ApiResponse<ReleaseProductResponse>>(url, request).pipe(
      map(response => {
        if (response.data && response.data.length > 0) {
          return response.data[0];
        }
        throw new Error('No response data returned from release operation');
      }),
      catchError(error => {
        console.error('Failed to release product:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * 7. DELETE /release-product-quarantine/products/{unitId}/{productCode}/{aliquot}/reasons/{reasonCode}
   * Remove a specific quarantine reason from a product
   */
  removeQuarantineReason(
    unitId: string,
    productCode: string,
    aliquot: string,
    reasonCode: string
  ): Observable<boolean> {
    const url = `${this.baseUrl}${API.RELEASE_PRODUCT_QUARANTINE.REMOVE_REASON(unitId, productCode, aliquot, reasonCode)}`;

    return this.http.delete<ApiSingleResponse<boolean>>(url).pipe(
      map(response => response.item === true),
      catchError(error => {
        console.error(`Failed to remove reason ${reasonCode} from ${unitId}/${productCode}/${aliquot}:`, error);
        return throwError(() => error);
      })
    );
  }
}
