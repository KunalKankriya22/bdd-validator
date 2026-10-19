import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { API } from '@core/constants/api.constants';
import {
  ApiResponse,
  PickSlipDto,
  PickSlipProductDto,
  PickSlipQueryDto,
  RestockProductRequestDto,
  RestockResponseDto,
  StorageDeviceDto,
  StorageRackDto,
  StorageTrayDto
} from '../models/restock-unshipped-products.model';

/**
 * Service for Restock Unshipped Products API operations
 * Based on API documentation: restock-unshipped-product-api-documentation.md
 */
@Injectable({
  providedIn: 'root'
})
export class RestockUnshippedProductsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  /**
   * Get pick slips with restockable products (status = 'RP')
   * @param criteria Filter criteria for pick slips
   * @param take Number of records to return (max 100)
   * @param skip Number of records to skip for pagination
   * @returns Observable of paginated pick slips
   */
  getPickSlips(
    criteria: PickSlipQueryDto,
    take: number = 100,
    skip: number = 0
  ): Observable<ApiResponse<PickSlipDto[]>> {
    const url = `${this.baseUrl}${API.RESTOCK_UNSHIPPED_PRODUCTS.GET_PICK_SLIPS}/${take}/${skip}`;
    return this.http.post<ApiResponse<PickSlipDto[]>>(url, criteria);
  }

  /**
   * Get products for a specific pick slip that have status 'RP' (Removed/Picked)
   * @param pickSlipId Pick slip identifier
   * @param chapterId Chapter ID (optional, uses user context if not provided)
   * @param take Number of records to return (max 100)
   * @param skip Number of records to skip for pagination
   * @returns Observable of pick slip products
   */
  getPickSlipProducts(
    pickSlipId: string,
    chapterId?: string,
    take: number = 100,
    skip: number = 0
  ): Observable<ApiResponse<PickSlipProductDto[]>> {
    let params = new HttpParams();
    if (chapterId) {
      params = params.set('chapterId', chapterId);
    }

    const url = `${this.baseUrl}${API.RESTOCK_UNSHIPPED_PRODUCTS.GET_PICK_SLIP_PRODUCTS(pickSlipId, take, skip)}`;
    return this.http.get<ApiResponse<PickSlipProductDto[]>>(url, { params });
  }

  /**
   * Restock selected products back to inventory
   * Updates ACTIVE_PRODUCTS table (stock_state='AV', location) and
   * PICK_SLIP_PRODUCTS table (product_status='RS')
   * @param request Restock request with pick slip ID and products
   * @returns Observable of restock response
   */
  restockProducts(
    request: RestockProductRequestDto
  ): Observable<ApiResponse<RestockResponseDto>> {
    const url = `${this.baseUrl}${API.RESTOCK_UNSHIPPED_PRODUCTS.RESTOCK_PRODUCTS}`;
    return this.http.post<ApiResponse<RestockResponseDto>>(url, request);
  }

  getStorageDevices(
    warehouseId: string,
    productType: string,
    chapterId?: string
  ): Observable<ApiResponse<StorageDeviceDto[]>> {
    let params = new HttpParams()
      .set('warehouseId', warehouseId)
      .set('productType', productType);
    if (chapterId) {
      params = params.set('chapterId', chapterId);
    }
    const url = `${this.baseUrl}${API.RESTOCK_UNSHIPPED_PRODUCTS.GET_STORAGE_DEVICES}`;
    return this.http.get<ApiResponse<StorageDeviceDto[]>>(url, { params });
  }

  getStorageRacks(
    warehouseId: string,
    deviceType: string,
    deviceNumber: string,
    productType: string,
    bloodType: string,
    chapterId?: string,
    storageClass: string = 'RE'
  ): Observable<ApiResponse<StorageRackDto[]>> {
    let params = new HttpParams()
      .set('warehouseId', warehouseId)
      .set('deviceType', deviceType)
      .set('deviceNumber', deviceNumber)
      .set('productType', productType)
      .set('bloodType', bloodType)
      .set('storageClass', storageClass);
    if (chapterId) {
      params = params.set('chapterId', chapterId);
    }
    const url = `${this.baseUrl}${API.RESTOCK_UNSHIPPED_PRODUCTS.GET_STORAGE_RACKS}`;
    return this.http.get<ApiResponse<StorageRackDto[]>>(url, { params });
  }

  getStorageTrays(
    warehouseId: string,
    deviceType: string,
    deviceNumber: string,
    rackNumber: string,
    productType: string,
    bloodType: string,
    chapterId?: string,
    mixProduct: string = 'N',
    mixAbo: string = 'N',
    shipAnyRh: string = 'N',
    unitSchemeType: string = 'C'
  ): Observable<ApiResponse<StorageTrayDto[]>> {
    let params = new HttpParams()
      .set('warehouseId', warehouseId)
      .set('deviceType', deviceType)
      .set('deviceNumber', deviceNumber)
      .set('rackNumber', rackNumber)
      .set('productType', productType)
      .set('bloodType', bloodType)
      .set('mixProduct', mixProduct)
      .set('mixAbo', mixAbo)
      .set('shipAnyRh', shipAnyRh)
      .set('unitSchemeType', unitSchemeType);
    if (chapterId) {
      params = params.set('chapterId', chapterId);
    }
    const url = `${this.baseUrl}${API.RESTOCK_UNSHIPPED_PRODUCTS.GET_STORAGE_TRAYS}`;
    return this.http.get<ApiResponse<StorageTrayDto[]>>(url, { params });
  }
}
