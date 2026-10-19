import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';
import {
  ReturnAdviceHeaderDto,
  ReturnItemDto,
  RejectCodeDto,
  ProcessReturnItemsRequestDto,
  ProcessReturnItemsResponseDto,
  ApiResponse,
  DeviceOption,
  RackOption,
  TrayOption
} from '../models/release-returned-product-quarantine.model';

/**
 * API Service for Release Returned Product Quarantine
 *
 * BE API Route: /release-returned-product-quarantine
 * Endpoints:
 *   - GET /return-advices/{returnAdviceId}?warehouseId=xxx - Get header
 *   - GET /return-items?take=10&skip=0&returnAdviceId=xxx - Get items
 *   - GET /reject-codes - Get reject codes
 *   - POST /validate - Validate product
 *   - POST /process - Process items (restock/discard)
 *
 * Storage dropdowns use existing release-product-quarantine APIs
 */
@Injectable({
  providedIn: 'root'
})
export class ReleaseReturnedProductQuarantineService {
  private readonly apiService = inject(ApiService);

  /**
   * Get return advice header information
   * BE Endpoint: GET /api/v1/release-returned-product-quarantine/return-advices/{returnAdviceId}
   */
  getReturnAdviceHeader(returnAdviceId: string, warehouseId: string = ''): Observable<ReturnAdviceHeaderDto> {
    const endpoint = API.RELEASE_RETURNED_PRODUCT_QUARANTINE.HEADER(returnAdviceId, warehouseId);
    return this.apiService
      .get<ApiResponse<ReturnAdviceHeaderDto>>(endpoint)
      .pipe(
        map((response) => response.data ?? ({} as ReturnAdviceHeaderDto)),
        catchError(error => {
          console.error('Error fetching return advice header:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get return items for a return advice
   * BE Endpoint: GET /api/v1/release-returned-product-quarantine/return-items
   */
  getReturnItems(
    returnAdviceId: string,
    warehouseId: string = '',
    take: number = 100,
    skip: number = 0
  ): Observable<{ items: ReturnItemDto[]; totalCount: number }> {
    let url = `/api/v1/release-returned-product-quarantine/return-items?take=${take}&skip=${skip}`;
    if (returnAdviceId) url += `&returnAdviceId=${encodeURIComponent(returnAdviceId)}`;
    if (warehouseId) url += `&warehouseId=${encodeURIComponent(warehouseId)}`;

    return this.apiService
      .get<ApiResponse<ReturnItemDto[]>>(url)
      .pipe(
        map((response) => ({
          items: response.data ?? [],
          totalCount: response.totalCount ?? response.total ?? 0
        })),
        catchError(error => {
          console.error('Error fetching return items:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get valid reject codes for discarding products
   * BE Endpoint: GET /api/v1/release-returned-product-quarantine/reject-codes
   */
  getRejectCodes(): Observable<RejectCodeDto[]> {
    const endpoint = API.RELEASE_RETURNED_PRODUCT_QUARANTINE.REJECT_CODES;
    return this.apiService
      .get<ApiResponse<RejectCodeDto[]>>(endpoint)
      .pipe(
        map((response) => response.data ?? []),
        catchError(error => {
          console.error('Error fetching reject codes:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Validate a product for restocking
   * BE Endpoint: POST /api/v1/release-returned-product-quarantine/validate
   */
  validateProductForRestock(request: ProcessReturnItemsRequestDto): Observable<{ isValid: boolean }> {
    const endpoint = API.RELEASE_RETURNED_PRODUCT_QUARANTINE.VALIDATE;
    return this.apiService
      .post<ApiResponse<{ isValid: boolean }>>(endpoint, request)
      .pipe(
        map((response) => response.data ?? { isValid: false }),
        catchError(error => {
          console.error('Error validating product:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Process return items (restock or discard)
   * BE Endpoint: POST /api/v1/release-returned-product-quarantine/process
   */
  processReturnItems(request: ProcessReturnItemsRequestDto): Observable<ProcessReturnItemsResponseDto> {
    const endpoint = API.RELEASE_RETURNED_PRODUCT_QUARANTINE.PROCESS;
    return this.apiService
      .post<ApiResponse<ProcessReturnItemsResponseDto>>(endpoint, request)
      .pipe(
        map((response) => response.data ?? { totalProcessed: 0, restockedCount: 0, discardedCount: 0, failedCount: 0 }),
        catchError(error => {
          console.error('Error processing return items:', error);
          return throwError(() => error);
        })
      );
  }

  // ========================================
  // Storage Dropdown Services
  // Uses existing release-product-quarantine APIs
  // ========================================

  /**
   * Get storage devices for a product type
   * BE Endpoint: GET /api/v1/release-product-quarantine/storage/devices?productType=xxx
   */
  getDevices(productType: string): Observable<DeviceOption[]> {
    const url = `${API.RELEASE_PRODUCT_QUARANTINE.BASE}${API.RELEASE_PRODUCT_QUARANTINE.GET_STORAGE_DEVICES}?productType=${encodeURIComponent(productType)}`;
    return this.apiService
      .get<ApiResponse<DeviceOption[]>>(url)
      .pipe(
        map((response) => response.data ?? []),
        catchError(error => {
          console.error('Error fetching storage devices:', error);
          return of([]);
        })
      );
  }

  /**
   * Get storage racks for a device
   * BE Endpoint: GET /api/v1/release-product-quarantine/storage/racks
   */
  getRacks(
    deviceType: string,
    deviceNumber: string,
    productType: string,
    bloodType: string,
    storageClass: string
  ): Observable<RackOption[]> {
    const params = new URLSearchParams({
      deviceType,
      deviceNumber,
      productType,
      bloodType,
      storageClass
    });
    const url = `${API.RELEASE_PRODUCT_QUARANTINE.BASE}${API.RELEASE_PRODUCT_QUARANTINE.GET_STORAGE_RACKS}?${params.toString()}`;
    return this.apiService
      .get<ApiResponse<RackOption[]>>(url)
      .pipe(
        map((response) => response.data ?? []),
        catchError(error => {
          console.error('Error fetching storage racks:', error);
          return of([]);
        })
      );
  }

  /**
   * Get storage trays for a rack
   * BE Endpoint: GET /api/v1/release-product-quarantine/storage/trays
   */
  getTrays(
    deviceType: string,
    deviceNumber: string,
    rackNumber: string,
    productType: string,
    bloodType: string,
    storageClass: string
  ): Observable<TrayOption[]> {
    const params = new URLSearchParams({
      deviceType,
      deviceNumber,
      rackNumber,
      productType,
      bloodType,
      storageClass
    });
    const url = `${API.RELEASE_PRODUCT_QUARANTINE.BASE}${API.RELEASE_PRODUCT_QUARANTINE.GET_STORAGE_TRAYS}?${params.toString()}`;
    return this.apiService
      .get<ApiResponse<TrayOption[]>>(url)
      .pipe(
        map((response) => response.data ?? []),
        catchError(error => {
          console.error('Error fetching storage trays:', error);
          return of([]);
        })
      );
  }

  /**
   * Search return advices for dropdown (LOV)
   * BE Endpoint: GET /api/v1/release-returned-product-quarantine/return-advices?searchTerm=xxx&warehouseId=xxx
   */
  searchReturnAdvices(searchTerm: string = '', warehouseId: string = ''): Observable<ReturnAdviceLookupDto[]> {
    let url = '/api/v1/release-returned-product-quarantine/return-advices';
    const params: string[] = [];
    if (searchTerm) params.push(`searchTerm=${encodeURIComponent(searchTerm)}`);
    if (warehouseId) params.push(`warehouseId=${encodeURIComponent(warehouseId)}`);
    if (params.length > 0) url += '?' + params.join('&');

    return this.apiService
      .get<ApiResponse<ReturnAdviceLookupDto[]>>(url)
      .pipe(
        map((response) => response.data ?? []),
        catchError(error => {
          console.error('Error searching return advices:', error);
          return of([]);
        })
      );
  }
}

export interface ReturnAdviceLookupDto {
  returnAdviceId: string;
  customerName?: string;
  unmovedItemCount: number;
}
