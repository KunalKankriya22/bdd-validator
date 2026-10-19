import { Injectable, inject } from '@angular/core';
import { HttpContext, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import { SKIP_ERROR_TOAST } from 'src/app/core/constants/http-context.constants';
import {
  ApiResponse,
  CheckInFromLabDto,
  CheckInFromLabListResponse,
  CheckInFromLabQueryDto,
  CreateCheckInFromLabDto,
  UpdateCheckInFromLabDto,
  ValidateUnitRequestDto,
  ValidateUnitResponseDto,
  ValidateProductRequestDto,
  ValidateProductResponseDto,
  ValidateReceiveDateRequestDto,
  ValidateReceiveDateResponseDto,
  ValidateAboRequestDto,
  ValidateAboResponseDto,
  ValidateComponentRequestDto,
  ValidateComponentResponseDto,
  ValidateExpiryRequestDto,
  ValidateExpiryResponseDto,
  ValidateLocationRequestDto,
  ValidateLocationResponseDto,
  InventoryClassDto,
  WarehouseDto,
  StorageDeviceDto,
  StorageRackDto,
  StorageTrayDto,
  UnitProductDto,
  UnitAliquotDto,
  AboTypeDto,
  BaseAboValueDto,
} from './check-in-from-lab.model';

const SKIP = { context: new HttpContext().set(SKIP_ERROR_TOAST, true) };

@Injectable({ providedIn: 'root' })
export class CheckInFromLabService {
  private readonly apiService = inject(ApiService);

  // ─── CRUD ──────────────────────────────────────────────────────────────────

  getList(
    take: number,
    skip: number,
    query: CheckInFromLabQueryDto
  ): Observable<CheckInFromLabListResponse> {
    return this.apiService
      .post<ApiResponse<CheckInFromLabDto[]>>(API.CHECK_IN_FROM_LAB.LIST(take, skip), query, SKIP)
      .pipe(map((res) => ({ data: res.data ?? [], total: res.total ?? 0 })));
  }

  getByKey(unitId: string, productCode: string, aliquot: string): Observable<CheckInFromLabDto> {
    return this.apiService
      .get<ApiResponse<CheckInFromLabDto>>(
        API.CHECK_IN_FROM_LAB.GET_BY_KEY(unitId, productCode, aliquot),
        SKIP
      )
      .pipe(map((res) => res.data));
  }

  checkIn(dto: CreateCheckInFromLabDto): Observable<ApiResponse<CheckInFromLabDto>> {
    return this.apiService.post<ApiResponse<CheckInFromLabDto>>(API.CHECK_IN_FROM_LAB.CREATE, dto);
  }

  update(
    unitId: string,
    productCode: string,
    aliquot: string,
    dto: UpdateCheckInFromLabDto
  ): Observable<ApiResponse<CheckInFromLabDto>> {
    return this.apiService.put<ApiResponse<CheckInFromLabDto>>(
      API.CHECK_IN_FROM_LAB.UPDATE(unitId, productCode, aliquot),
      dto
    );
  }

  // ─── Validations ───────────────────────────────────────────────────────────

  validateUnit(dto: ValidateUnitRequestDto): Observable<ApiResponse<ValidateUnitResponseDto>> {
    return this.apiService
      .post<any>(API.CHECK_IN_FROM_LAB.VALIDATE_UNIT, dto, SKIP)
      .pipe(map((res) => this.normalizeResponse<ValidateUnitResponseDto>(res)));
  }

  validateProduct(
    dto: ValidateProductRequestDto
  ): Observable<ApiResponse<ValidateProductResponseDto>> {
    return this.apiService
      .post<any>(API.CHECK_IN_FROM_LAB.VALIDATE_PRODUCT, dto, SKIP)
      .pipe(map((res) => this.normalizeResponse<ValidateProductResponseDto>(res)));
  }

  validateReceiveDate(
    dto: ValidateReceiveDateRequestDto
  ): Observable<ApiResponse<ValidateReceiveDateResponseDto>> {
    return this.apiService
      .post<any>(API.CHECK_IN_FROM_LAB.VALIDATE_RECEIVE_DATE, dto, SKIP)
      .pipe(map((res) => this.normalizeResponse<ValidateReceiveDateResponseDto>(res)));
  }

  validateAbo(dto: ValidateAboRequestDto): Observable<ApiResponse<ValidateAboResponseDto>> {
    return this.apiService
      .post<any>(API.CHECK_IN_FROM_LAB.VALIDATE_ABO, dto, SKIP)
      .pipe(map((res) => this.normalizeResponse<ValidateAboResponseDto>(res)));
  }

  validateComponent(
    dto: ValidateComponentRequestDto
  ): Observable<ApiResponse<ValidateComponentResponseDto>> {
    return this.apiService
      .post<any>(API.CHECK_IN_FROM_LAB.VALIDATE_COMPONENT, dto, SKIP)
      .pipe(map((res) => this.normalizeResponse<ValidateComponentResponseDto>(res)));
  }

  validateExpiry(
    dto: ValidateExpiryRequestDto
  ): Observable<ApiResponse<ValidateExpiryResponseDto>> {
    return this.apiService
      .post<any>(API.CHECK_IN_FROM_LAB.VALIDATE_EXPIRY, dto, SKIP)
      .pipe(map((res) => this.normalizeResponse<ValidateExpiryResponseDto>(res)));
  }

  validateLocation(
    dto: ValidateLocationRequestDto
  ): Observable<ApiResponse<ValidateLocationResponseDto>> {
    return this.apiService
      .post<any>(API.CHECK_IN_FROM_LAB.VALIDATE_LOCATION, dto, SKIP)
      .pipe(map((res) => this.normalizeResponse<ValidateLocationResponseDto>(res)));
  }

  private normalizeResponse<T>(res: any): ApiResponse<T> {
    return {
      ...res,
      success: res.success ?? (res.statusCode === 200 && !res.errorResponse?.errorCode),
      data: res.data ?? res.item ?? null,
    } as ApiResponse<T>;
  }

  // ─── Lookup / Dropdown ─────────────────────────────────────────────────────

  getInventoryClasses(): Observable<InventoryClassDto[]> {
    return this.apiService
      .get<any>(API.CHECK_IN_FROM_LAB.INVENTORY_CLASSES, SKIP)
      .pipe(map((res) => this.normalizeArray<InventoryClassDto>(res)));
  }

  getWarehouses(): Observable<WarehouseDto[]> {
    return this.apiService
      .get<any>(API.CHECK_IN_FROM_LAB.WAREHOUSES, SKIP)
      .pipe(map((res) => this.normalizeArray<WarehouseDto>(res)));
  }

  getDevices(warehouseId: string): Observable<StorageDeviceDto[]> {
    return this.apiService
      .get<any>(API.CHECK_IN_FROM_LAB.DEVICES(warehouseId), SKIP)
      .pipe(map((res) => this.normalizeArray<StorageDeviceDto>(res)));
  }

  getRacks(
    warehouseId: string,
    deviceId: string,
    storageClass: string,
    productType: string,
    bloodType: string
  ): Observable<StorageRackDto[]> {
    const params = new HttpParams()
      .set('storageClass', storageClass)
      .set('productType', productType)
      .set('bloodType', bloodType);
    return this.apiService
      .get<any>(API.CHECK_IN_FROM_LAB.RACKS(warehouseId, deviceId), { ...SKIP, params })
      .pipe(map((res) => this.normalizeArray<StorageRackDto>(res)));
  }

  getTrays(
    warehouseId: string,
    deviceId: string,
    rackId: string,
    storageClass?: string,
    productType?: string,
    bloodType?: string,
  ): Observable<StorageTrayDto[]> {
    let params = new HttpParams();
    if (storageClass) params = params.set('storageClass', storageClass);
    if (productType) params = params.set('productType', productType);
    if (bloodType) params = params.set('bloodType', bloodType);
    return this.apiService
      .get<any>(API.CHECK_IN_FROM_LAB.TRAYS(warehouseId, deviceId, rackId), { ...SKIP, params })
      .pipe(map((res) => this.normalizeArray<StorageTrayDto>(res)));
  }

  getProducts(unitId: string, collDate: string): Observable<UnitProductDto[]> {
    const params = new HttpParams().set('collDate', collDate);
    return this.apiService
      .get<any>(API.CHECK_IN_FROM_LAB.PRODUCTS(unitId), { ...SKIP, params })
      .pipe(map((res) => this.normalizeArray<UnitProductDto>(res)));
  }

  getAliquots(unitId: string, productCode: string, collDate: string): Observable<UnitAliquotDto[]> {
    const params = new HttpParams().set('collDate', collDate);
    return this.apiService
      .get<any>(API.CHECK_IN_FROM_LAB.ALIQUOTS(unitId, productCode), { ...SKIP, params })
      .pipe(map((res) => this.normalizeArray<UnitAliquotDto>(res)));
  }

  getAboTypes(query?: {
    aboOnly?: string;
    identifierCode?: string;
    unitSchemeType?: string;
    unitId?: string;
    productCode?: string;
    collDate?: string;
  }): Observable<AboTypeDto[]> {
    let params = new HttpParams();
    if (query?.aboOnly) params = params.set('aboOnly', query.aboOnly);
    if (query?.identifierCode) params = params.set('identifierCode', query.identifierCode);
    if (query?.unitSchemeType) params = params.set('unitSchemeType', query.unitSchemeType);
    if (query?.unitId) params = params.set('unitId', query.unitId);
    if (query?.productCode) params = params.set('productCode', query.productCode);
    if (query?.collDate) params = params.set('collDate', query.collDate);
    return this.apiService
      .get<any>(API.CHECK_IN_FROM_LAB.ABO_TYPES, { ...SKIP, params })
      .pipe(map((res) => this.normalizeArray<AboTypeDto>(res)));
  }

  getBaseAboValue(aboValue: string): Observable<BaseAboValueDto> {
    return this.apiService
      .get<any>(API.CHECK_IN_FROM_LAB.BASE_ABO_VALUE(aboValue), SKIP)
      .pipe(map((res) => (res.data ?? res.item ?? null) as BaseAboValueDto));
  }

  private normalizeArray<T>(res: any): T[] {
    const list = res.data ?? res.item ?? res.items ?? [];
    return Array.isArray(list) ? list : [];
  }
}
