import { Injectable, inject } from '@angular/core';
import { HttpContext } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';
import { SKIP_ERROR_TOAST } from '@core/constants/http-context.constants';
import {
  ApiResponse,
  DiscardProductDto,
  DiscardProductQueryDto,
  AddProductToBoxRequestDto,
  CloseBoxRequestDto,
  CloseBoxResponseDto,
  ConsigneeDto,
  ProductTypeLookupDto,
  OpenBoxDto,
  ProductCodeLookupDto,
  BloodTypeLookupDto,
  OrderLookupDto,
  PackProductResponse,
} from '../models/packod.model';

const SKIP = { context: new HttpContext().set(SKIP_ERROR_TOAST, true) };

@Injectable({ providedIn: 'root' })
export class PackodApiService {
  private readonly apiService = inject(ApiService);

  getAvailableProducts(
    take: number,
    skip: number,
    query: DiscardProductQueryDto
  ): Observable<ApiResponse<DiscardProductDto[]>> {
    return this.apiService
      .post<ApiResponse<DiscardProductDto[]>>(
        API.PACK_INV_REJECTS.PRODUCTS(take, skip),
        query,
        SKIP
      )
      .pipe(
        map((res) => ({
          ...res,
          success: res.success ?? res.statusCode === 200,
          data: res.data ?? [],
          total: res.total ?? 0,
        }))
      );
  }

  getConsignees(): Observable<ApiResponse<ConsigneeDto[]>> {
    return this.apiService
      .get<ApiResponse<ConsigneeDto[]>>(
        API.PACK_INV_REJECTS.CONSIGNEES,
        SKIP
      )
      .pipe(
        map((res) => ({
          ...res,
          success: res.success ?? res.statusCode === 200,
          data: res.data ?? [],
        }))
      );
  }

  getOrders(consigneeId: string, customerId: string): Observable<ApiResponse<OrderLookupDto[]>> {
    return this.apiService
      .get<ApiResponse<OrderLookupDto[]>>(
        `${API.PACK_INV_REJECTS.ORDERS}?consigneeId=${encodeURIComponent(consigneeId)}&customerId=${encodeURIComponent(customerId)}`,
        SKIP
      )
      .pipe(
        map((res) => ({
          ...res,
          success: res.success ?? res.statusCode === 200,
          data: res.data ?? [],
        }))
      );
  }

  getProductTypes(consigneeId: string, customerId: string): Observable<ApiResponse<ProductTypeLookupDto[]>> {
    return this.apiService
      .get<ApiResponse<ProductTypeLookupDto[]>>(
        `${API.PACK_INV_REJECTS.PRODUCT_TYPES}?consigneeId=${encodeURIComponent(consigneeId)}&customerId=${encodeURIComponent(customerId)}`,
        SKIP
      )
      .pipe(
        map((res) => ({
          ...res,
          success: res.success ?? res.statusCode === 200,
          data: res.data ?? [],
        }))
      );
  }

  getBoxes(consigneeId: string, productType?: string, warehouseId?: string): Observable<ApiResponse<OpenBoxDto[]>> {
    let url = `${API.PACK_INV_REJECTS.OPEN_BOXES}?consigneeId=${encodeURIComponent(consigneeId)}`;
    if (productType) url += `&productType=${encodeURIComponent(productType)}`;
    if (warehouseId) url += `&warehouseId=${encodeURIComponent(warehouseId)}`;
    return this.apiService
      .get<ApiResponse<OpenBoxDto[]>>(url, SKIP)
      .pipe(
        map((res) => ({
          ...res,
          success: res.success ?? res.statusCode === 200,
          data: res.data ?? [],
        }))
      );
  }

  getBoxContents(boxId: string): Observable<ApiResponse<DiscardProductDto[]>> {
    return this.apiService
      .get<ApiResponse<DiscardProductDto[]>>(
        API.PACK_INV_REJECTS.BOX_CONTENTS(boxId),
        SKIP
      )
      .pipe(
        map((res) => ({
          ...res,
          success: res.success ?? res.statusCode === 200,
          data: res.data ?? [],
          total: res.total ?? 0,
        }))
      );
  }

  addProductToBox(dto: AddProductToBoxRequestDto): Observable<ApiResponse<PackProductResponse>> {
    return this.apiService.post<ApiResponse<PackProductResponse>>(
      API.PACK_INV_REJECTS.ADD_PRODUCT,
      dto
    );
  }

  closeBox(boxId: string, dto: CloseBoxRequestDto): Observable<ApiResponse<CloseBoxResponseDto>> {
    return this.apiService.put<ApiResponse<CloseBoxResponseDto>>(
      API.PACK_INV_REJECTS.CLOSE_BOX(boxId),
      dto
    );
  }

  getCheckDigit(unitId: string): Observable<ApiResponse<string>> {
    return this.apiService
      .get<ApiResponse<string>>(
        API.PACK_INV_REJECTS.CHECK_DIGIT(unitId),
        SKIP
      )
      .pipe(map((res) => ({ ...res, success: res.success ?? res.statusCode === 200 })));
  }

  getProductCodesForUnit(
    unitId: string,
    customerId?: string,
    consigneeId?: string
  ): Observable<ApiResponse<ProductCodeLookupDto[]>> {
    return this.apiService
      .get<ApiResponse<ProductCodeLookupDto[]>>(
        API.PACK_INV_REJECTS.PRODUCT_CODES(unitId, customerId, consigneeId),
        SKIP
      )
      .pipe(map((res) => ({ ...res, success: res.success ?? res.statusCode === 200, data: res.data ?? [] })));
  }

  getBloodTypesForProduct(
    unitId: string,
    productCode: string
  ): Observable<ApiResponse<BloodTypeLookupDto[]>> {
    return this.apiService
      .get<ApiResponse<BloodTypeLookupDto[]>>(
        API.PACK_INV_REJECTS.BLOOD_TYPES(unitId, productCode),
        SKIP
      )
      .pipe(map((res) => ({ ...res, success: res.success ?? res.statusCode === 200, data: res.data ?? [] })));
  }

  unpackProduct(dto: { unitId: string; productCode: string; aliquot: string | null; expDate: string | null }): Observable<ApiResponse<any>> {
    return this.apiService.post<ApiResponse<any>>(API.PACK_INV_REJECTS.UNPACK, dto);
  }
}
