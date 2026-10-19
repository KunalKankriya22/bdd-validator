import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  Consignee,
  Order,
  ProductType,
  DiscardType,
  Box,
  TestId,
  BoxContent,
  AvailableProduct,
  AvailableProductsRequest,
  UnitProduct,
  PackProductRequest,
  PackProductResponse,
  ApiResponse,
} from '../models/pack-lab-discards.model';

@Injectable({
  providedIn: 'root',
})
export class PackLabDiscardsService {
  private readonly apiService = inject(ApiService);

  private extractArray<T>(response: any): T[] {
    if (Array.isArray(response)) return response as T[];
    if (Array.isArray(response?.data?.data)) return response.data.data as T[];
    if (Array.isArray(response?.data)) return response.data as T[];
    return [] as T[];
  }

  getConsignees(discardOption: string = 'DI'): Observable<Consignee[]> {
    const params = new HttpParams().set('discardOption', discardOption);
    return this.apiService
      .get<any>(API.PACK_LAB_DISCARDS.CONSIGNEES, { params })
      .pipe(map((res) => this.extractArray<Consignee>(res)));
  }

  getOrders(consigneeId: string): Observable<Order[]> {
    return this.apiService
      .get<any>(API.PACK_LAB_DISCARDS.ORDERS(consigneeId))
      .pipe(map((res) => this.extractArray<Order>(res)));
  }

  getProductTypes(): Observable<ProductType[]> {
    return this.apiService
      .get<any>(API.PACK_LAB_DISCARDS.PRODUCT_TYPES)
      .pipe(map((res) => this.extractArray<ProductType>(res)));
  }

  getDiscardTypes(): Observable<DiscardType[]> {
    return this.apiService
      .get<any>(API.PACK_LAB_DISCARDS.DISCARD_TYPES)
      .pipe(map((res) => this.extractArray<DiscardType>(res)));
  }

  getBoxes(consigneeId: string): Observable<Box[]> {
    return this.apiService
      .get<any>(API.PACK_LAB_DISCARDS.BOXES(consigneeId))
      .pipe(map((res) => this.extractArray<Box>(res)));
  }

  getTestIds(): Observable<TestId[]> {
    return this.apiService
      .get<any>(API.PACK_LAB_DISCARDS.TEST_IDS)
      .pipe(map((res) => this.extractArray<TestId>(res)));
  }

  getBoxContents(boxId: string): Observable<BoxContent[]> {
    return this.apiService
      .get<any>(API.PACK_LAB_DISCARDS.BOX_CONTENTS(boxId))
      .pipe(map((res) => this.extractArray<BoxContent>(res)));
  }

  getUnitProducts(
    unitId: string,
    productType?: string,
    discardType?: string,
    consigneeId?: string,
  ): Observable<UnitProduct[]> {
    const params: Record<string, string> = {};
    if (productType) params['productType'] = productType;
    if (discardType) params['discardType'] = discardType;
    if (consigneeId) params['consigneeId'] = consigneeId;

    return this.apiService
      .get<any>(API.PACK_LAB_DISCARDS.UNIT_PRODUCTS(unitId), { params: new HttpParams({ fromObject: params }) })
      .pipe(map((res) => this.extractArray<UnitProduct>(res)));
  }

  getAvailableProducts(request: AvailableProductsRequest): Observable<AvailableProduct[]> {
    return this.apiService
      .post<any>(
        API.PACK_LAB_DISCARDS.AVAILABLE_PRODUCTS,
        request
      )
      .pipe(map((res) => this.extractArray<AvailableProduct>(res)));
  }

  packProduct(request: PackProductRequest): Observable<ApiResponse<PackProductResponse>> {
    return this.apiService
      .post<any>(API.PACK_LAB_DISCARDS.PACK, request)
      .pipe(map((res) => this.extractResponse<PackProductResponse>(res)));
  }

  closeBox(boxId: string, confirmation: 'Y' | 'N'): Observable<ApiResponse<boolean>> {
    return this.apiService
      .post<any>(API.PACK_LAB_DISCARDS.CLOSE_BOX(boxId), { confirmation })
      .pipe(map((res) => this.extractResponse<boolean>(res)));
  }

  unpackProduct(unitId: string, productCode: string, aliquot?: string): Observable<ApiResponse<boolean>> {
    return this.apiService
      .delete<any>(API.PACK_LAB_DISCARDS.UNPACK(unitId, productCode, aliquot || undefined))
      .pipe(map((res) => this.extractResponse<boolean>(res)));
  }

  private extractResponse<T>(response: any): ApiResponse<T> {
    if (response?.data !== undefined && 'success' in response) return response as ApiResponse<T>;
    return {
      success: response?.success ?? true,
      statusCode: response?.statusCode ?? 200,
      message: response?.message || 'Success',
      data: (response?.data ?? response?.item ?? response) as T,
      errorCode: response?.errorCode,
      errorResponse: response?.errorResponse,
    };
  }
}
