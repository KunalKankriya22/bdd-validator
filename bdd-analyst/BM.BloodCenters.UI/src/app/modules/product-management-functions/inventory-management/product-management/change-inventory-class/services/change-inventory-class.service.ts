import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { HttpContext } from '@angular/common/http';
import { ApiService } from '@shared/services/api.service';
import { SKIP_ERROR_TOAST } from 'src/app/core/constants/http-context.constants';
import { API } from 'src/app/core/constants/api.constants';
import {
  ChangeInventoryClassProductDto,
  ChangeInventoryClassRequestDto,
  ChangeInventoryClassApiResponse,
  WarehouseDto,
  DeviceDto,
  RackDto,
  TrayDto,
  InventoryClassDto,
} from '../models/change-inventory-class.model';

@Injectable({
  providedIn: 'root',
})
export class ChangeInventoryClassService {
  private readonly apiService = inject(ApiService);

  getProducts(unitId: string, codeScheme: string = 'I'): Observable<ChangeInventoryClassProductDto[]> {
    return this.apiService
      .get<ChangeInventoryClassApiResponse<ChangeInventoryClassProductDto[]>>(
        `${API.CHANGE_INVENTORY_CLASS.GET_PRODUCT(unitId)}?codeScheme=${encodeURIComponent(codeScheme)}`,
        { context: new HttpContext().set(SKIP_ERROR_TOAST, true) },
      )
      .pipe(
        map((response) => response.data || response.item || []),
        catchError((error) => {
          console.error('Error fetching product details:', error);
          return throwError(() => error);
        }),
      );
  }

  getWarehouses(): Observable<WarehouseDto[]> {
    return this.apiService
      .get<ChangeInventoryClassApiResponse<WarehouseDto[]>>(
        API.CHECK_IN_FROM_LAB.WAREHOUSES,
      )
      .pipe(
        map((response) => response?.data || []),
        catchError((error) => {
          console.error('Error fetching warehouses:', error);
          return throwError(() => error);
        }),
      );
  }

  getDevices(warehouseId: string, productType?: string): Observable<DeviceDto[]> {
    const params = productType ? `?productType=${encodeURIComponent(productType)}` : '';
    return this.apiService
      .get<ChangeInventoryClassApiResponse<DeviceDto[]>>(
        `${API.CHANGE_INVENTORY_CLASS.DEVICES(warehouseId)}${params}`,
      )
      .pipe(
        map((response) => response?.data || []),
        catchError((error) => {
          console.error('Error fetching devices:', error);
          return throwError(() => error);
        }),
      );
  }

  getRacks(warehouseId: string, deviceType: string, deviceNumber: string,
           newClass?: string, productType?: string, bloodType?: string): Observable<RackDto[]> {
    const params = new URLSearchParams();
    if (newClass) params.set('newClass', newClass);
    if (productType) params.set('productType', productType);
    if (bloodType) params.set('bloodType', bloodType);
    const queryString = params.toString();
    const url = queryString
      ? `${API.CHANGE_INVENTORY_CLASS.RACKS(warehouseId, deviceType, deviceNumber)}?${queryString}`
      : API.CHANGE_INVENTORY_CLASS.RACKS(warehouseId, deviceType, deviceNumber);
    return this.apiService
      .get<ChangeInventoryClassApiResponse<RackDto[]>>(url)
      .pipe(
        map((response) => response?.data || []),
        catchError((error) => {
          console.error('Error fetching racks:', error);
          return throwError(() => error);
        }),
      );
  }

  getTrays(warehouseId: string, deviceType: string, deviceNumber: string, rackNumber: string,
           productType?: string, bloodType?: string, codeScheme?: string): Observable<TrayDto[]> {
    const params = new URLSearchParams();
    if (productType) params.set('productType', productType);
    if (bloodType) params.set('bloodType', bloodType);
    if (codeScheme) params.set('codeScheme', codeScheme);
    const queryString = params.toString();
    const url = queryString
      ? `${API.CHANGE_INVENTORY_CLASS.TRAYS(warehouseId, deviceType, deviceNumber, rackNumber)}?${queryString}`
      : API.CHANGE_INVENTORY_CLASS.TRAYS(warehouseId, deviceType, deviceNumber, rackNumber);
    return this.apiService
      .get<ChangeInventoryClassApiResponse<TrayDto[]>>(url)
      .pipe(
        map((response) => response?.data || []),
        catchError((error) => {
          console.error('Error fetching trays:', error);
          return throwError(() => error);
        }),
      );
  }

  getInventoryClasses(): Observable<InventoryClassDto[]> {
    return this.apiService
      .get<ChangeInventoryClassApiResponse<InventoryClassDto[]>>(
        API.CHANGE_INVENTORY_CLASS.INVENTORY_CLASSES,
      )
      .pipe(
        map((response) => response?.data || response?.item || []),
        catchError((error) => {
          console.error('Error fetching inventory classes:', error);
          return throwError(() => error);
        }),
      );
  }

  preCheckInterdiction(
    unitId: string,
    productCode: string,
    aliquot: string,
    collDate: string,
  ): Observable<ChangeInventoryClassApiResponse<any>> {
    return this.apiService
      .post<ChangeInventoryClassApiResponse<any>>(
        API.CHANGE_INVENTORY_CLASS.PRE_CHECK,
        { unitId, productCode, aliquot, collDate },
        { context: new HttpContext().set(SKIP_ERROR_TOAST, true) },
      )
      .pipe(
        catchError((error) => {
          console.error('Error during pre-check:', error);
          return throwError(() => error);
        }),
      );
  }

  changeInventoryClass(
    unitId: string,
    request: ChangeInventoryClassRequestDto,
  ): Observable<ChangeInventoryClassApiResponse<any>> {
    return this.apiService
      .put<ChangeInventoryClassApiResponse<any>>(
        API.CHANGE_INVENTORY_CLASS.UPDATE(unitId),
        request,
        { context: new HttpContext().set(SKIP_ERROR_TOAST, true) },
      )
      .pipe(
        catchError((error) => {
          console.error('Error changing inventory class:', error);
          return throwError(() => error);
        }),
      );
  }
}
