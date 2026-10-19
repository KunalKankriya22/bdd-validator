import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  ProductTypePrioritizationModel,
  ProductTypePrioritizationListRequestDto,
  ProductTypePrioritizationCreateDto,
  ProductTypePrioritizationUpdateDto,
  ReturnResult,
  LookupItem
} from '../models/product-type-prioritization.model';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';

@Injectable({
  providedIn: 'root'
})
export class ProductTypePrioritizationService {
  private readonly apiService = inject(ApiService);

  /**
   * Get Product Type Prioritization table data with filters
   * POST /lbl-product-type-config/list
   * No pagination in URL - returns all filtered records.
   */
  getProductTypePrioritizations(
    params: ProductTypePrioritizationListRequestDto
  ): Observable<{ data: ProductTypePrioritizationModel[]; totalRecords: number }> {
    const endpoint = API.APPLICATION_ADMIN.LABELING_CONFIGURATION.PRODUCT_TYPE_LIST;

    return this.apiService.post<ReturnResult<ProductTypePrioritizationModel>>(endpoint, params).pipe(
      map(response => ({
        data: response.data || [],
        totalRecords: response.total || 0
      })),
      catchError(error => {
        console.error('Error fetching product type prioritization data:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get Product Type dropdown values
   * GET /lbl-product-type-config/lookups/product-types
   * Response is a plain array: [{ code, description }]
   */
  getProductTypeLookups(): Observable<LookupItem[]> {
    const endpoint = API.APPLICATION_ADMIN.LABELING_CONFIGURATION.PRODUCT_TYPE_LOOKUP_TYPES;

    return this.apiService.get<LookupItem[]>(endpoint).pipe(
      map(response => Array.isArray(response) ? response : []),
      catchError(error => {
        console.error('Error fetching product type lookups:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get Barcode dropdown values
   * GET /lbl-product-type-config/lookups/barcodes
   * Response is a plain array: [{ code, description }]
   */
  getBarcodeLookups(): Observable<LookupItem[]> {
    const endpoint = API.APPLICATION_ADMIN.LABELING_CONFIGURATION.PRODUCT_TYPE_LOOKUP_BARCODES;

    return this.apiService.get<LookupItem[]>(endpoint).pipe(
      map(response => Array.isArray(response) ? response : []),
      catchError(error => {
        console.error('Error fetching barcode lookups:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get the current max priority for a product type
   * GET /lbl-product-type-config/{productType}/max-priority
   */
  getMaxPriority(productType: string): Observable<{ maxPriority: number }> {
    const endpoint = API.APPLICATION_ADMIN.LABELING_CONFIGURATION.PRODUCT_TYPE_MAX_PRIORITY(productType);

    return this.apiService.get<{ maxPriority: number }>(endpoint).pipe(
      catchError(error => {
        console.error('Error fetching max priority:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Check if a priority sequence is already taken for a product type
   * GET /lbl-product-type-config/{productType}/check-priority/{prioritySeq}
   */
  checkPriorityConflict(
    productType: string,
    prioritySeq: number,
    excludeBarcodeValue?: string
  ): Observable<{ conflict: boolean; barcodeValue?: string }> {
    let endpoint = API.APPLICATION_ADMIN.LABELING_CONFIGURATION.PRODUCT_TYPE_CHECK_PRIORITY(productType, prioritySeq);
    if (excludeBarcodeValue) {
      endpoint += `?excludeBarcodeValue=${encodeURIComponent(excludeBarcodeValue)}`;
    }

    return this.apiService.get<{ conflict: boolean; barcodeValue?: string }>(endpoint).pipe(
      catchError(error => {
        console.error('Error checking priority conflict:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Create a new Product Type Prioritization
   * POST /lbl-product-type-config
   */
  createProductTypePrioritization(data: ProductTypePrioritizationCreateDto): Observable<ReturnResult<ProductTypePrioritizationModel>> {
    const endpoint = API.APPLICATION_ADMIN.LABELING_CONFIGURATION.PRODUCT_TYPE_ADD;

    return this.apiService.post<ReturnResult<ProductTypePrioritizationModel>>(endpoint, data).pipe(
      catchError(error => {
        console.error('Error creating product type prioritization:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update an existing Product Type Prioritization
   * PUT /lbl-product-type-config/{productType}/{barcodeValue}
   * Body contains only editable fields: prioritySeq, effDate, termDate
   */
  updateProductTypePrioritization(
    productType: string,
    barcodeValue: string,
    data: ProductTypePrioritizationUpdateDto
  ): Observable<ReturnResult<ProductTypePrioritizationModel>> {
    const endpoint = API.APPLICATION_ADMIN.LABELING_CONFIGURATION.PRODUCT_TYPE_UPDATE(productType, barcodeValue);

    return this.apiService.put<ReturnResult<ProductTypePrioritizationModel>>(endpoint, data).pipe(
      catchError(error => {
        console.error('Error updating product type prioritization:', error);
        return throwError(() => error);
      })
    );
  }
}
