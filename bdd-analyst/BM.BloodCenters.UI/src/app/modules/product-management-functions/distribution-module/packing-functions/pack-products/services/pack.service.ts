import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API } from '@core/constants/api.constants';
import { SKIP_ERROR_TOAST } from '@core/constants/http-context.constants';

// Shared lookup DTO (matches offline-packing lookups)
export interface LookupOption { value: string; label: string; }

import {
  ApiResponse,
  OrderDetailDto,
  OrderItemDto,
  OrderSearchDto,
  PickSlipDto,
  CreateBoxRequestDto,
  PackedProductDto,
  BoxContentsDto,
  BoxTypeDto,
  PackStatusItemDto,
  PackProductRequestDto,
  QuarantineProductRequestDto,
  UnpackProductRequestDto,
  ValidateUnitRequestDto,
  ActiveBoxDto,
} from '../models/pack.models';

// Creates a fresh HttpContext per call — matches pattern in other services
const skip = () => ({ context: new HttpContext().set(SKIP_ERROR_TOAST, true) });

@Injectable({ providedIn: 'root' })
export class PackService {
  private readonly http = inject(HttpClient);

  // ── Orders ──────────────────────────────────────────────────────────────────

  getAllOrders(): Observable<ApiResponse<OrderSearchDto[]>> {
    return this.http.get<ApiResponse<OrderSearchDto[]>>(API.PACK_PRODUCTS.ORDERS, skip());
  }

  searchOrders(searchTerm?: string): Observable<ApiResponse<OrderSearchDto[]>> {
    let params = new HttpParams();
    if (searchTerm) params = params.set('search', searchTerm);
    return this.http.get<ApiResponse<OrderSearchDto[]>>(API.PACK_PRODUCTS.ORDERS_SEARCH, { ...skip(), params });
  }

  getOrderDetails(orderNo: string): Observable<ApiResponse<OrderDetailDto>> {
    return this.http.get<ApiResponse<OrderDetailDto>>(API.PACK_PRODUCTS.ORDER_DETAILS(orderNo), skip());
  }

  getOrderItems(orderNo: string): Observable<ApiResponse<OrderItemDto[]>> {
    return this.http.get<ApiResponse<OrderItemDto[]>>(API.PACK_PRODUCTS.ORDER_ITEMS(orderNo), skip());
  }

  getPickSlipsForOrder(orderNo: string): Observable<ApiResponse<PickSlipDto[]>> {
    return this.http.get<ApiResponse<PickSlipDto[]>>(API.PACK_PRODUCTS.ORDER_PICK_SLIPS(orderNo), skip());
  }

  // ── Boxes ────────────────────────────────────────────────────────────────────

  getActiveBoxes(): Observable<ApiResponse<ActiveBoxDto[]>> {
    return this.http.get<ApiResponse<ActiveBoxDto[]>>(API.PACK_PRODUCTS.ACTIVE_BOXES, skip());
  }

  getBoxTypes(): Observable<ApiResponse<BoxTypeDto[]>> {
    return this.http.get<ApiResponse<BoxTypeDto[]>>(API.PACK_PRODUCTS.BOX_TYPES, skip());
  }

  createBox(request: CreateBoxRequestDto): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(API.PACK_PRODUCTS.CREATE_BOX, request, skip());
  }

  closeBox(boxId: string): Observable<ApiResponse<boolean>> {
    return this.http.put<ApiResponse<boolean>>(API.PACK_PRODUCTS.CLOSE_BOX(boxId), {}, skip());
  }

  getBoxContents(boxId: string): Observable<ApiResponse<BoxContentsDto>> {
    return this.http.get<ApiResponse<BoxContentsDto>>(API.PACK_PRODUCTS.BOX_CONTENTS(boxId), skip());
  }

  // ── Packing ──────────────────────────────────────────────────────────────────

  packProduct(request: PackProductRequestDto): Observable<ApiResponse<boolean> & { pickSlipId?: string }> {
    return this.http.post<ApiResponse<boolean> & { pickSlipId?: string }>(API.PACK_PRODUCTS.PACK, request, skip());
  }

  unpackProduct(request: UnpackProductRequestDto): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(API.PACK_PRODUCTS.UNPACK, request, skip());
  }

  quarantineProduct(request: QuarantineProductRequestDto): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(API.PACK_PRODUCTS.QUARANTINE, request, skip());
  }

  getPackedProducts(pickSlipId: string): Observable<ApiResponse<PackedProductDto[]>> {
    return this.http.get<ApiResponse<PackedProductDto[]>>(API.PACK_PRODUCTS.PACKED_PRODUCTS(pickSlipId), skip());
  }

  getPackStatus(pickSlipId: string): Observable<ApiResponse<PackStatusItemDto[]>> {
    return this.http.get<ApiResponse<PackStatusItemDto[]>>(API.PACK_PRODUCTS.PACK_STATUS(pickSlipId), skip());
  }

  // ── Expiry date validation ────────────────────────────────────────────────────

  validateExpiry(request: { unitId: string; productCode: string; aliquot?: string; expiryDate: string; warehouseId?: string }): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(API.PACK_PRODUCTS.VALIDATE_EXPIRY, request, skip());
  }

  // ── Lookups (cascade: Unit → Product Codes → Aliquots → Blood Types) ─────────

  getProductCodes(unitId: string): Observable<LookupOption[]> {
    return this.http.get<LookupOption[]>(API.OFFLINE_PRODUCT_PACKING.PRODUCT_CODES(unitId), skip());
  }

  getAliquots(unitId: string, productCode: string): Observable<LookupOption[]> {
    return this.http.get<LookupOption[]>(API.OFFLINE_PRODUCT_PACKING.ALIQUOTS(unitId, productCode), skip());
  }

  getBloodTypes(unitId: string, productCode: string): Observable<LookupOption[]> {
    return this.http.get<LookupOption[]>(API.OFFLINE_PRODUCT_PACKING.BLOOD_TYPES(unitId, productCode), skip());
  }

  getUnitExpiry(unitId: string, productCode: string, aliquot: string): Observable<{ success: boolean; data: string | null }> {
    const params = new HttpParams().set('productCode', productCode).set('aliquot', aliquot);
    return this.http.get<{ success: boolean; data: string | null }>(API.PACK_PRODUCTS.UNIT_EXPIRY(unitId), { ...skip(), params });
  }

  // ── Validation ───────────────────────────────────────────────────────────────

  validateUnit(request: ValidateUnitRequestDto): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(API.PACK_PRODUCTS.VALIDATE_UNIT, request, skip());
  }
}
