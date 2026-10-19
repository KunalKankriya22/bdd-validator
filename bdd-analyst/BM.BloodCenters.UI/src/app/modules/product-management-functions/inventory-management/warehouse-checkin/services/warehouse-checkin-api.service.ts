import { Injectable, inject } from '@angular/core';
import { HttpContext, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import { SKIP_ERROR_TOAST } from 'src/app/core/constants/http-context.constants';
import {
  WarehouseCheckInRequestDto,
  WarehouseCheckInResponseDto,
  ValidateAllRequestDto,
  ValidateAllResponseDto,
  LocationLookupOption,
  LocationLookupParams,
  LocationLookupResponseItem,
  UnitProductDto,
  ApiResponse,
} from '../models/warehouse-checkin.model';

@Injectable({
  providedIn: 'root',
})
export class WarehouseCheckInApiService {
  private readonly apiService = inject(ApiService);

  validateAll(request: ValidateAllRequestDto): Observable<ValidateAllResponseDto> {
    const url = API.WAREHOUSE_CHECKIN.VALIDATE_ALL;
    return this.apiService.post<ApiResponse<ValidateAllResponseDto>>(url, request, {
      context: new HttpContext().set(SKIP_ERROR_TOAST, true)
    }).pipe(
      map((response) => response.data[0]),
      catchError((error) => throwError(() => error))
    );
  }

  getLocationLookup(params?: LocationLookupParams): Observable<LocationLookupOption[]> {
    const url = API.WAREHOUSE_CHECKIN.LOCATION_LOOKUP;
    let httpParams = new HttpParams();
    if (params?.chapterId)    httpParams = httpParams.set('chapterId',    params.chapterId);
    if (params?.productCode)  httpParams = httpParams.set('productCode',  params.productCode);
    if (params?.productType)  httpParams = httpParams.set('productType',  params.productType);
    if (params?.warehouseId)  httpParams = httpParams.set('warehouseId',  params.warehouseId);
    if (params?.deviceNumber) httpParams = httpParams.set('deviceNumber', params.deviceNumber);
    if (params?.deviceType)   httpParams = httpParams.set('deviceType',   params.deviceType);
    if (params?.storageClass) httpParams = httpParams.set('storageClass', params.storageClass);
    if (params?.bloodType)    httpParams = httpParams.set('bloodType',    params.bloodType);
    if (params?.rackNumber)   httpParams = httpParams.set('rackNumber',   params.rackNumber);

    return this.apiService.get<ApiResponse<LocationLookupResponseItem>>(url, { params: httpParams }).pipe(
      map((response) => {
        const raw = response.data?.[0]?.options ?? [];
        return raw.map((o): LocationLookupOption => ({
          value: o.code,
          label: o.description,
          itemCount:    o.itemCount,
          trayCapacity: o.trayCapacity,
          deviceType:   o.deviceType,
          storageClass: o.storageClass,
          bloodType:   o.bloodType,
        }));
      }),
      catchError((error) => throwError(() => error))
    );
  }

  checkIn(request: WarehouseCheckInRequestDto): Observable<WarehouseCheckInResponseDto> {
    const url = API.WAREHOUSE_CHECKIN.CHECK_IN;
    return this.apiService.post<ApiResponse<WarehouseCheckInResponseDto>>(url, request, {
      context: new HttpContext().set(SKIP_ERROR_TOAST, true)
    }).pipe(
      map((response) => response.data[0]),
      catchError((error) => throwError(() => error))
    );
  }

  getChapterWarehouses(chapterId: string): Observable<{ warehouseId: string; warehouseName: string }[]> {
    const url = API.CHAPTER.WAREHOUSES(chapterId);
    return this.apiService.get<{ warehouseId: string; warehouseName: string }[]>(url, {
      context: new HttpContext().set(SKIP_ERROR_TOAST, true)
    }).pipe(
      catchError(() => of([]))
    );
  }

  getUnitProducts(unitId: string): Observable<UnitProductDto[]> {
    const url = API.WAREHOUSE_CHECKIN.UNIT_PRODUCTS(unitId);
    return this.apiService.get<ApiResponse<UnitProductDto>>(url, {
      context: new HttpContext().set(SKIP_ERROR_TOAST, true)
    }).pipe(
      map((response) => response.data ?? []),
      catchError((error) => throwError(() => error))
    );
  }
}
