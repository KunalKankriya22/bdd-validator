import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { API } from '@core/constants/api.constants';
import {
  ReleaseType,
  UnitGridItem,
  UnitReason,
  RejectCode,
  StorageDevice,
  StorageRack,
  StorageTray,
  SaveReleaseRequest,
  SaveReleaseResponse,
  ProductCodeLovItem,
  RemoveReasonsRequest,
  RemoveReasonsResponse,
  ApiResponse,
  ApiSingleResponse
} from '../models/release-quarantine.model';

/**
 * API Service for Release Product Quarantine feature
 * Implements all 8 endpoints from KT documentation
 */
@Injectable({
  providedIn: 'root'
})
export class ReleaseQuarantineApiService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}${API.RELEASE_PRODUCT_QUARANTINE.BASE}`;

  /**
   * 1. GET /release-product-quarantine/release-types
   * Populate the "Quarantine Release Type" dropdown
   */
  getReleaseTypes(): Observable<ReleaseType[]> {
    const url = `${this.baseUrl}${API.RELEASE_PRODUCT_QUARANTINE.GET_RELEASE_TYPES}`;

    return this.http.get<ApiResponse<ReleaseType>>(url).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error('Failed to load release types:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * GET /release-product-quarantine/product-codes/{unitId}
   * Product code LOV for a validated unit
   */
  getProductCodes(unitId: string, releaseType: string, codeScheme: string = 'I'): Observable<ProductCodeLovItem[]> {
    const url = `${this.baseUrl}${API.RELEASE_PRODUCT_QUARANTINE.GET_PRODUCT_CODES(unitId)}`;
    const params = new HttpParams()
      .set('releaseType', releaseType)
      .set('codeScheme', codeScheme);

    return this.http.get<ApiResponse<ProductCodeLovItem>>(url, { params }).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error(`Failed to load product codes for unit ${unitId}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * 2. GET /release-product-quarantine/units/{releaseType}
   * Load the grid with all quarantined/returned units
   */
  getUnits(releaseType: string): Observable<{ data: UnitGridItem[]; total: number }> {
    const url = `${this.baseUrl}${API.RELEASE_PRODUCT_QUARANTINE.GET_UNITS(releaseType)}`;

    return this.http.get<ApiResponse<UnitGridItem>>(url).pipe(
      map(response => ({
        data: response.data || [],
        total: response.total || response.data?.length || 0
      })),
      catchError(error => {
        console.error(`Failed to load units for release type ${releaseType}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * 3. GET /release-product-quarantine/unit-reasons
   * Load the quarantine/return reasons for the selected unit
   * Query params: releaseType, unitId, productCode, aliquot
   */
  getUnitReasons(
    releaseType: string,
    unitId: string,
    productCode: string,
    aliquot: string
  ): Observable<UnitReason[]> {
    const url = `${this.baseUrl}${API.RELEASE_PRODUCT_QUARANTINE.GET_UNIT_REASONS}`;

    let params = new HttpParams()
      .set('releaseType', releaseType)
      .set('unitId', unitId)
      .set('productCode', productCode)
      .set('aliquot', aliquot);

    return this.http.get<ApiResponse<UnitReason>>(url, { params }).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error(`Failed to load reasons for ${unitId}/${productCode}/${aliquot}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * 4. GET /release-product-quarantine/reject-codes
   * Pre-load reject codes for the discard path (cache locally)
   */
  getRejectCodes(): Observable<RejectCode[]> {
    const url = `${this.baseUrl}${API.RELEASE_PRODUCT_QUARANTINE.GET_REJECT_CODES}`;

    return this.http.get<ApiResponse<RejectCode>>(url).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error('Failed to load reject codes:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * 5. GET /release-product-quarantine/storage/devices
   * Get available storage devices for the product type
   * Query param: productType (from grid row's hidden productType field)
   */
  getStorageDevices(productType: string): Observable<StorageDevice[]> {
    const url = `${this.baseUrl}${API.RELEASE_PRODUCT_QUARANTINE.GET_STORAGE_DEVICES}`;

    let params = new HttpParams().set('productType', productType);

    return this.http.get<ApiResponse<StorageDevice>>(url, { params }).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error(`Failed to load storage devices for product type ${productType}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * 6. GET /release-product-quarantine/storage/racks
   * Get available racks after device selected
   * Query params: deviceType, deviceNumber, productType, bloodType, storageClass (= inventoryClass)
   */
  getStorageRacks(
    deviceType: string,
    deviceNumber: string,
    productType: string,
    bloodType: string,
    storageClass: string
  ): Observable<StorageRack[]> {
    const url = `${this.baseUrl}${API.RELEASE_PRODUCT_QUARANTINE.GET_STORAGE_RACKS}`;

    let params = new HttpParams()
      .set('deviceType', deviceType)
      .set('deviceNumber', deviceNumber)
      .set('productType', productType)
      .set('bloodType', bloodType)
      .set('storageClass', storageClass);

    return this.http.get<ApiResponse<StorageRack>>(url, { params }).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error('Failed to load storage racks:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * 7. GET /release-product-quarantine/storage/trays
   * Get available trays after rack selected
   * Query params: deviceType, deviceNumber, rackNumber, productType, bloodType
   */
  getStorageTrays(
    deviceType: string,
    deviceNumber: string,
    rackNumber: string,
    productType: string,
    bloodType: string,
    storageClass: string
  ): Observable<StorageTray[]> {
    const url = `${this.baseUrl}${API.RELEASE_PRODUCT_QUARANTINE.GET_STORAGE_TRAYS}`;

    let params = new HttpParams()
      .set('deviceType', deviceType)
      .set('deviceNumber', deviceNumber)
      .set('rackNumber', rackNumber)
      .set('productType', productType)
      .set('bloodType', bloodType)
      .set('storageClass', storageClass);

    return this.http.get<ApiResponse<StorageTray>>(url, { params }).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error('Failed to load storage trays:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * 8. POST /release-product-quarantine/save
   * Process one unit — restock or discard
   */
  save(request: SaveReleaseRequest): Observable<SaveReleaseResponse> {
    const url = `${this.baseUrl}${API.RELEASE_PRODUCT_QUARANTINE.SAVE}`;

    return this.http.post<ApiSingleResponse<SaveReleaseResponse>>(url, request).pipe(
      map(response => {
        if (response.item) {
          return response.item;
        }
        throw new Error('No response data returned from save operation');
      }),
      catchError(error => {
        console.error('Failed to save release:', error);
        return throwError(() => error);
      })
    );
  }

  removeReasons(request: RemoveReasonsRequest): Observable<RemoveReasonsResponse> {
    const url = `${this.baseUrl}${API.RELEASE_PRODUCT_QUARANTINE.REMOVE_REASONS}`;

    return this.http.post<ApiSingleResponse<RemoveReasonsResponse>>(url, request).pipe(
      map(response => {
        if (response.item) {
          return response.item;
        }
        throw new Error('No response data returned from remove reasons operation');
      }),
      catchError(error => {
        console.error('Failed to remove reasons:', error);
        return throwError(() => error);
      })
    );
  }
}
