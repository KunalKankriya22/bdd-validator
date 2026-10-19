import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import moment from 'moment';
import {
  ProductStorageListDto,
  ProductStorageApiDto,
  ProductStorageQueryDto,
  CreateProductStorageDto,
  UpdateProductStorageDto,
  LovOption,
  ReturnResult,
  SaveResult
} from '../models/product-storage-definition.model';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';

/** Raw shapes returned by the new API dropdown endpoints */
interface ProductTypeRaw { productType: string; productTypeDesc: string; }
interface WarehouseRaw { warehouseId: string; codeDesc: string; }
interface DeviceTypeRaw { code: string; codeDesc: string; }
interface DeviceNumberRaw { deviceNumber: string; deviceDescription: string; }

@Injectable({
  providedIn: 'root'
})
export class ProductStorageDefinitionService {
  private readonly apiService = inject(ApiService);

  // ─── List ──────────────────────────────────────────────────────────────────

  getProductStorageList(
    take: number,
    skip: number,
    queryDto: ProductStorageQueryDto
  ): Observable<{ data: ProductStorageListDto[]; totalRecords: number }> {
    return this.apiService
      .post<ReturnResult<ProductStorageApiDto>>(API.PRODUCT_STORAGE_DEFINITION.LIST(take, skip), queryDto)
      .pipe(
        map(res => ({
          data: (res.data ?? []).map(item => this.mapApiDtoToListDto(item)),
          totalRecords: res.totalCount ?? res.total ?? 0
        }))
      );
  }

  // ─── Create ────────────────────────────────────────────────────────────────

  createProductStorage(dto: CreateProductStorageDto): Observable<SaveResult> {
    return this.apiService.post(API.PRODUCT_STORAGE_DEFINITION.CREATE, dto);
  }

  // ─── Update ────────────────────────────────────────────────────────────────

  updateProductStorage(
    productType: string,
    warehouseId: string,
    deviceType: string,
    deviceNumber: string,
    dto: UpdateProductStorageDto
  ): Observable<SaveResult> {
    return this.apiService.put(
      API.PRODUCT_STORAGE_DEFINITION.UPDATE(productType, warehouseId, deviceType, deviceNumber),
      dto
    );
  }

  // ─── Delete (soft) ─────────────────────────────────────────────────────────

  deleteProductStorage(
    productType: string,
    warehouseId: string,
    deviceType: string,
    deviceNumber: string
  ): Observable<SaveResult> {
    return this.apiService.delete(
      API.PRODUCT_STORAGE_DEFINITION.DELETE(productType, warehouseId, deviceType, deviceNumber)
    );
  }

  // ─── Dropdowns ─────────────────────────────────────────────────────────────

  getProductTypeLov(): Observable<ReturnResult<LovOption>> {
    return this.apiService
      .get<ReturnResult<ProductTypeRaw>>(API.PRODUCT_STORAGE_DEFINITION.PRODUCT_TYPE_LOV)
      .pipe(map(res => ({
        ...res,
        data: (res.data ?? []).map(d => ({ code: d.productType, description: d.productTypeDesc }))
      })));
  }

  getWarehouseLov(): Observable<ReturnResult<LovOption>> {
    return this.apiService
      .get<ReturnResult<WarehouseRaw>>(API.PRODUCT_STORAGE_DEFINITION.WAREHOUSE_LOV)
      .pipe(map(res => ({
        ...res,
        data: (res.data ?? []).map(d => ({ code: d.warehouseId, description: d.codeDesc }))
      })));
  }

  getDeviceTypeLov(): Observable<ReturnResult<LovOption>> {
    return this.apiService
      .get<ReturnResult<DeviceTypeRaw>>(API.PRODUCT_STORAGE_DEFINITION.DEVICE_TYPE_LOV)
      .pipe(map(res => ({
        ...res,
        data: (res.data ?? []).map(d => ({ code: d.code, description: d.codeDesc }))
      })));
  }

  getDeviceNumbersLov(warehouseId: string, deviceType: string): Observable<ReturnResult<LovOption>> {
    const params = new HttpParams().set('warehouseId', warehouseId).set('deviceType', deviceType);
    return this.apiService
      .get<ReturnResult<DeviceNumberRaw>>(API.PRODUCT_STORAGE_DEFINITION.DEVICE_NUMBERS_LOV, { params })
      .pipe(map(res => ({
        ...res,
        data: (res.data ?? []).map(d => ({ code: d.deviceNumber, description: d.deviceDescription }))
      })));
  }

  // ─── Filter dropdowns (reuse main LOV endpoints) ───────────────────────────

  getFilterProductTypes(): Observable<ReturnResult<LovOption>> {
    return this.getProductTypeLov();
  }

  getFilterWarehouseCodes(): Observable<ReturnResult<LovOption>> {
    return this.getWarehouseLov();
  }

  getFilterDeviceTypes(): Observable<ReturnResult<LovOption>> {
    return this.getDeviceTypeLov();
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private mapApiDtoToListDto(item: ProductStorageApiDto): ProductStorageListDto {
    return {
      productType: item.productType,
      warehouseId: item.warehouseId,
      warehouseDescription: item.warehouseDesc ?? '',
      deviceType: item.deviceType,
      deviceDescription: item.deviceDescription ?? item.deviceDesc ?? '',
      number: item.deviceNumber,
      trayCapacity: String(item.trayCapacity ?? ''),
      effectiveDate: this.formatApiDate(item.effectiveDate) ?? '',
      terminationDate: this.formatApiDate(item.termDate),
      lastModifiedDate: this.formatApiDateTime(item.lastModifiedDate)
    };
  }

  private formatApiDate(dateStr: string | null | undefined): string | null {
    if (!dateStr) return null;
    const m = moment(dateStr);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : null;
  }

  private formatApiDateTime(dateStr: string | null | undefined): string | null {
    if (!dateStr) return null;
    const m = moment(dateStr);
    return m.isValid() ? m.format('DD-MMM-YYYY hh:mm A').toUpperCase() : null;
  }
}
