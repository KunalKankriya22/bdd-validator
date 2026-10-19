import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from '../../../../core/constants/api.constants';
import {
  UnitValidationDto,
  UnitProductDto,
  ProductHistoryDto,
  ApiResponse,
} from '../models/unit-product-history.model';

/**
 * Service for Unit and Product History API operations
 * Endpoints: /api/unit-product-history
 */
@Injectable({
  providedIn: 'root',
})
export class UnitProductHistoryService {
  private readonly apiService = inject(ApiService);

  /**
   * Validates a unit ID and retrieves its collection date
   * Endpoint: GET /api/unit-product-history/validate/{unitId}
   *
   * @param unitId - Blood unit identifier (max 16 chars)
   * @returns Observable with unit validation data
   */
  validateUnit(unitId: string): Observable<UnitValidationDto> {
    if (!unitId || unitId.trim().length === 0) {
      return throwError(() => new Error('Unit ID is required'));
    }

    if (unitId.length > 16) {
      return throwError(() => new Error('Unit ID cannot exceed 16 characters'));
    }

    return this.apiService
      .get<ApiResponse<UnitValidationDto[]>>(
        API.INVENTORY_MANAGEMENT.UNIT_PRODUCT_HISTORY.VALIDATE(unitId.trim())
      )
      .pipe(
        map((response) => {
          if (!response.success || !response.data || response.data.length === 0) {
            throw new Error(response.message || 'Failed to validate unit');
          }
          return response.data[0];
        }),
        catchError((error) => {
          console.error('Error validating unit:', error);
          const message = error?.error?.message || error?.message || 'Unit not found or has no collection date';
          return throwError(() => new Error(message));
        })
      );
  }

  /**
   * Retrieves all products created from a specific unit
   * Endpoint: GET /api/unit-product-history/units/{unitId}/products
   *
   * @param unitId - Blood unit identifier
   * @param collectionDate - Collection date in yyyy-MM-dd format
   * @returns Observable with array of products
   */
  getProducts(unitId: string, collectionDate: string): Observable<UnitProductDto[]> {
    if (!unitId || !collectionDate) {
      return throwError(() => new Error('Unit ID and collection date are required'));
    }

    return this.apiService
      .get<ApiResponse<UnitProductDto[]>>(
        API.INVENTORY_MANAGEMENT.UNIT_PRODUCT_HISTORY.PRODUCTS(unitId.trim(), collectionDate)
      )
      .pipe(
        map((response) => {
          if (!response.success) {
            throw new Error(response.message || 'Failed to retrieve products');
          }
          return response.data || [];
        }),
        catchError((error) => {
          console.error('Error fetching products:', error);
          const message = error?.error?.message || error?.message || 'Failed to retrieve products';
          return throwError(() => new Error(message));
        })
      );
  }

  /**
   * Retrieves the complete chronological history for a specific product
   * Endpoint: GET /api/unit-product-history/units/{unitId}/products/{productCode}/{aliquot}/history
   *
   * @param unitId - Blood unit identifier
   * @param productCode - Product type code (max 8 chars)
   * @param aliquot - Aliquot number (max 4 chars)
   * @param collectionDate - Collection date in yyyy-MM-dd format
   * @returns Observable with array of history records
   */
  getProductHistory(
    unitId: string,
    productCode: string,
    aliquot: string,
    collectionDate: string
  ): Observable<ProductHistoryDto[]> {
    if (!unitId || !productCode || !aliquot || !collectionDate) {
      return throwError(() => new Error('All parameters are required to fetch product history'));
    }

    return this.apiService
      .get<ApiResponse<ProductHistoryDto[]>>(
        API.INVENTORY_MANAGEMENT.UNIT_PRODUCT_HISTORY.HISTORY(
          unitId.trim(),
          productCode.trim(),
          aliquot.trim(),
          collectionDate
        )
      )
      .pipe(
        map((response) => {
          if (!response.success) {
            throw new Error(response.message || 'Failed to retrieve product history');
          }
          return response.data || [];
        }),
        catchError((error) => {
          console.error('Error fetching product history:', error);
          const message = error?.error?.message || error?.message || 'Product has no history';
          return throwError(() => new Error(message));
        })
      );
  }
}
