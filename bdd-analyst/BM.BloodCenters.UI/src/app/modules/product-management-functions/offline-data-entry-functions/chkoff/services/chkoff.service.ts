import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { API } from '@core/constants/api.constants';
import {
  ReturnResult,
  ProductCheckInDto,
  CheckInResultDto,
  UnitValidationDto,
  InventoryClassDto,
  AliquotDto,
  ProductCodeDto,
  AboTypeDto,
  WarehouseDto,
  StorageDeviceDto,
  RackDto,
  TrayDto
} from '../models/chkoff.model';

/**
 * Service for Offline Product Check-In feature
 * Handles all API calls related to checking in products from laboratory
 * JIRA: MLT-14047
 */
@Injectable({
  providedIn: 'root'
})
export class ChkOffService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  /**
   * Get active inventory classes for dropdown (RE/SP/AD)
   * GET /api/v1/offline-product-checkin/inventory-classes
   */
  getInventoryClasses(): Observable<InventoryClassDto[]> {
    const url = `${this.baseUrl}${API.OFFLINE_PRODUCT_CHECKIN.INVENTORY_CLASSES}`;
    return this.http.get<ReturnResult<InventoryClassDto>>(url).pipe(
      map(response => response.data || []),
      catchError(error => throwError(() => error))
    );
  }

  getProductCodes(unitId: string): Observable<ProductCodeDto[]> {
    const url = `${this.baseUrl}${API.OFFLINE_PRODUCT_CHECKIN.PRODUCT_CODES(unitId)}`;
    return this.http.get<ReturnResult<ProductCodeDto>>(url).pipe(
      map(response => response.data || []),
      catchError(error => throwError(() => error))
    );
  }

  getAboTypes(unitId: string, productCode: string, aliquot: string): Observable<AboTypeDto[]> {
    const url = `${this.baseUrl}${API.OFFLINE_PRODUCT_CHECKIN.ABO_TYPES(unitId, productCode, aliquot)}`;
    return this.http.get<ReturnResult<AboTypeDto>>(url).pipe(
      map(response => response.data || []),
      catchError(error => throwError(() => error))
    );
  }

  getAliquots(unitId: string, productCode: string): Observable<AliquotDto[]> {
    const url = `${this.baseUrl}${API.OFFLINE_PRODUCT_CHECKIN.ALIQUOTS(unitId, productCode)}`;
    return this.http.get<ReturnResult<AliquotDto>>(url).pipe(
      map(response => response.data || []),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Validate a unit ID and return unit details (collection date, chapter)
   * GET /api/v1/offline-product-checkin/validate-unit/{unitId}
   *
   * @param unitId - Unit identifier to validate
   * @returns UnitValidationDto with isValid flag and message
   */
  validateUnit(unitId: string): Observable<UnitValidationDto> {
    const url = `${this.baseUrl}${API.OFFLINE_PRODUCT_CHECKIN.VALIDATE_UNIT(unitId)}`;
    return this.http.get<ReturnResult<UnitValidationDto>>(url).pipe(
      map(response => {
        // API returns item for single record, not data array
        if (response.item) {
          return response.item;
        }
        // Fallback to data array if item not present
        if (response.data && response.data.length > 0) {
          return response.data[0];
        }
        // Return error result if no data
        return {
          unitId,
          collDate: null,
          chapterId: null,
          isValid: false,
          message: response.message || 'Unit not found'
        };
      }),
      catchError(error => {
        // Return validation failure instead of throwing
        return throwError(() => ({
          unitId,
          collDate: null,
          chapterId: null,
          isValid: false,
          message: error.error?.message || 'Unit validation failed'
        }));
      })
    );
  }

  /**
   * Check in a product from laboratory into distribution inventory
   * POST /api/v1/offline-product-checkin/checkin
   *
   * @param payload - ProductCheckInDto with all required fields
   * @returns CheckInResultDto with warnings array (non-blocking)
   */
  checkInProduct(payload: ProductCheckInDto): Observable<ReturnResult<CheckInResultDto>> {
    const url = `${this.baseUrl}${API.OFFLINE_PRODUCT_CHECKIN.CHECKIN}`;
    return this.http.post<ReturnResult<CheckInResultDto>>(url, payload).pipe(
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Get available warehouses
   * GET /api/v1/offline-product-checkin/warehouses
   */
  getWarehouses(): Observable<WarehouseDto[]> {
    const url = `${this.baseUrl}${API.OFFLINE_PRODUCT_CHECKIN.WAREHOUSES}`;
    return this.http.get<ReturnResult<WarehouseDto>>(url).pipe(
      map(response => response.data || []),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Get storage devices for a warehouse
   * GET /api/v1/offline-product-checkin/devices/{warehouseId}
   */
  getDevices(warehouseId: string, productType?: string): Observable<StorageDeviceDto[]> {
    const url = `${this.baseUrl}${API.OFFLINE_PRODUCT_CHECKIN.DEVICES(warehouseId, productType)}`;
    return this.http.get<ReturnResult<StorageDeviceDto>>(url).pipe(
      map(response => response.data || []),
      catchError(error => throwError(() => error))
    );
  }

  getRacks(warehouseId: string, deviceNumber: string, deviceType?: string, productType?: string, bloodType?: string): Observable<RackDto[]> {
    const url = `${this.baseUrl}${API.OFFLINE_PRODUCT_CHECKIN.RACKS(warehouseId, deviceNumber, deviceType, productType, bloodType)}`;
    return this.http.get<ReturnResult<RackDto>>(url).pipe(
      map(response => response.data || []),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Get trays for a warehouse/device/rack combination
   * GET /api/v1/offline-product-checkin/trays/{warehouseId}/{deviceNumber}/{rackNumber}
   */
  getTrays(warehouseId: string, deviceNumber: string, rackNumber: string): Observable<TrayDto[]> {
    const url = `${this.baseUrl}${API.OFFLINE_PRODUCT_CHECKIN.TRAYS(warehouseId, deviceNumber, rackNumber)}`;
    return this.http.get<ReturnResult<TrayDto>>(url).pipe(
      map(response => response.data || []),
      catchError(error => throwError(() => error))
    );
  }
}
