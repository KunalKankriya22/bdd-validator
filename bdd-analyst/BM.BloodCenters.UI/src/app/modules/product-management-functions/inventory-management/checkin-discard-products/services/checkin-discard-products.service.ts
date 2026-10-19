import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { SKIP_ERROR_TOAST } from '@core/constants/http-context.constants';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { API } from '@core/constants/api.constants';
import {
  ApiResponse,
  DiscardUnitVerifyResponse,
  ProductCodeItem,
  AboTypeResponse,
  LocationDefaultsResponse,
  DeviceItem,
  RackItem,
  TrayItem,
  CheckinProductRequest,
  CheckedInProduct
} from '../models/checkin-discard-products.model';

@Injectable({
  providedIn: 'root'
})
export class CheckinDiscardProductsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  verifyDiscardUnit(unitId: string): Observable<ApiResponse<DiscardUnitVerifyResponse>> {
    return this.http.post<ApiResponse<DiscardUnitVerifyResponse>>(
      `${this.baseUrl}${API.CHECKIN_DISCARD_PRODUCTS.VERIFY_DISCARD_UNIT}`,
      { unitId }
    );
  }

  getProductCodes(unitId: string, collDate: string): Observable<ApiResponse<ProductCodeItem[]>> {
    const params = new HttpParams()
      .set('unitId', unitId)
      .set('collDate', collDate);

    return this.http.get<ApiResponse<ProductCodeItem[]>>(
      `${this.baseUrl}${API.CHECKIN_DISCARD_PRODUCTS.PRODUCT_CODES}`,
      { params }
    );
  }

  getAboTypes(unitId: string, collDate: string, productCode: string): Observable<ApiResponse<AboTypeResponse>> {
    const params = new HttpParams()
      .set('unitId', unitId)
      .set('collDate', collDate)
      .set('productCode', productCode);

    return this.http.get<ApiResponse<AboTypeResponse>>(
      `${this.baseUrl}${API.CHECKIN_DISCARD_PRODUCTS.ABO_TYPES}`,
      { params }
    );
  }

  getLocationDefaults(
    productType: string, bloodType: string, unitId: string,
    collDate: string, productCode: string, aliquot: string
  ): Observable<ApiResponse<LocationDefaultsResponse>> {
    const params = new HttpParams()
      .set('productType', productType)
      .set('bloodType', bloodType)
      .set('unitId', unitId)
      .set('collDate', collDate)
      .set('productCode', productCode)
      .set('aliquot', aliquot);

    return this.http.get<ApiResponse<LocationDefaultsResponse>>(
      `${this.baseUrl}${API.CHECKIN_DISCARD_PRODUCTS.LOCATION_DEFAULTS}`,
      { params }
    );
  }

  getDevices(warehouseId: string, productType: string): Observable<ApiResponse<DeviceItem[]>> {
    const params = new HttpParams()
      .set('warehouseId', warehouseId)
      .set('productType', productType);

    return this.http.get<ApiResponse<DeviceItem[]>>(
      `${this.baseUrl}${API.CHECKIN_DISCARD_PRODUCTS.DEVICES}`,
      { params }
    );
  }

  getRacks(
    warehouseId: string, deviceType: string, deviceNumber: string,
    storageClass: string, productType: string, bloodType: string
  ): Observable<ApiResponse<RackItem[]>> {
    const params = new HttpParams()
      .set('warehouseId', warehouseId)
      .set('deviceType', deviceType)
      .set('deviceNumber', deviceNumber)
      .set('storageClass', storageClass)
      .set('productType', productType)
      .set('bloodType', bloodType);

    return this.http.get<ApiResponse<RackItem[]>>(
      `${this.baseUrl}${API.CHECKIN_DISCARD_PRODUCTS.RACKS}`,
      { params }
    );
  }

  getTrays(
    warehouseId: string, deviceType: string, deviceNumber: string, rackNumber: string
  ): Observable<ApiResponse<TrayItem[]>> {
    const params = new HttpParams()
      .set('warehouseId', warehouseId)
      .set('deviceType', deviceType)
      .set('deviceNumber', deviceNumber)
      .set('rackNumber', rackNumber);

    return this.http.get<ApiResponse<TrayItem[]>>(
      `${this.baseUrl}${API.CHECKIN_DISCARD_PRODUCTS.TRAYS}`,
      { params }
    );
  }

  checkinProduct(request: CheckinProductRequest): Observable<ApiResponse<CheckedInProduct>> {
    return this.http.post<ApiResponse<CheckedInProduct>>(
      `${this.baseUrl}${API.CHECKIN_DISCARD_PRODUCTS.CHECKIN}`,
      request,
      { context: new HttpContext().set(SKIP_ERROR_TOAST, true) }
    );
  }
}
