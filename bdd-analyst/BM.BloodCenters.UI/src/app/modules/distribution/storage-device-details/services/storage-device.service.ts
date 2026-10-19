import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import {
  StorageDeviceListDto,
  StorageDeviceQueryDto,
  CreateStorageDeviceDto,
  UpdateStorageDeviceDto,
  LovOption,
  ReturnResult,
  SaveResult
} from '../models/storage-device.model';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';

@Injectable({
  providedIn: 'root'
})
export class StorageDeviceService {
  private readonly apiService = inject(ApiService);

  getStorageDevices(
    take: number,
    skip: number,
    queryDto: StorageDeviceQueryDto
  ): Observable<{ data: StorageDeviceListDto[]; totalRecords: number }> {
    return this.apiService
      .post<ReturnResult<StorageDeviceListDto>>(API.STORAGE_DEVICE.LIST(take, skip), queryDto)
      .pipe(
        map(res => ({
          data: res.data ?? [],
          totalRecords: res.total ?? 0
        }))
      );
  }

  createStorageDevice(dto: CreateStorageDeviceDto): Observable<SaveResult> {
    return this.apiService.post(API.STORAGE_DEVICE.CREATE, dto);
  }

  updateStorageDevice(dto: UpdateStorageDeviceDto): Observable<SaveResult> {
    return this.apiService.put(API.STORAGE_DEVICE.UPDATE, dto);
  }

  getWarehouseLov(): Observable<ReturnResult<LovOption>> {
    return this.apiService.get(API.STORAGE_DEVICE.WAREHOUSE_LOV);
  }

  getDeviceTypeLov(): Observable<ReturnResult<LovOption>> {
    return this.apiService.get(API.STORAGE_DEVICE.DEVICE_TYPE_LOV);
  }

  getDeviceStatusLov(): Observable<ReturnResult<LovOption>> {
    return this.apiService.get(API.STORAGE_DEVICE.DEVICE_STATUS_LOV);
  }

  getFilterDeviceTypes(warehouseId: string): Observable<ReturnResult<LovOption>> {
    return this.apiService.get(API.STORAGE_DEVICE.FILTER_DEVICE_TYPES(warehouseId));
  }

  getFilterStatusCodes(warehouseId: string): Observable<ReturnResult<LovOption>> {
    return this.apiService.get(API.STORAGE_DEVICE.FILTER_STATUS_CODES(warehouseId));
  }
}
