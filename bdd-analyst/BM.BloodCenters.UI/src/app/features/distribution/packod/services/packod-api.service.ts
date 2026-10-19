import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API } from '@core/constants/api.constants';
import {
  ConsigneeDropdownDto,
  OrderLookupModel,
  OpenBoxLookupModel,
  ProductCodeLookupModel,
  AliquotLookupModel,
  BloodTypeLookupModel,
  DiscardProductDto,
  DiscardProductsParamsDto,
  PackProductRequestDto,
  BoxContentItemDto,
  CloseBoxRequestDto,
  CreateNewBoxRequestDto
} from '../models';

interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  totalCount?: number;
}

interface ProductTypeLookupModel {
  productType: string;
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class PackodApiService {
  private readonly http = inject(HttpClient);
  private readonly base = API.PACK_INV_REJECTS_TO_SALVAGE;

  getConsignees(searchText?: string): Observable<ConsigneeDropdownDto[]> {
    let params = new HttpParams();
    if (searchText) params = params.set('searchText', searchText);
    return this.http.get<ApiResponse<ConsigneeDropdownDto[]>>(this.base.CONSIGNEES, { params }).pipe(
      map(r => r.data)
    );
  }

  getOrders(customerId: string, consigneeId: string): Observable<OrderLookupModel[]> {
    const params = new HttpParams().set('customerId', customerId).set('consigneeId', consigneeId);
    return this.http.get<ApiResponse<OrderLookupModel[]>>(this.base.ORDERS, { params }).pipe(
      map(r => r.data)
    );
  }

  getProductTypes(customerId: string, consigneeId: string): Observable<ProductTypeLookupModel[]> {
    const params = new HttpParams().set('customerId', customerId).set('consigneeId', consigneeId);
    return this.http.get<ApiResponse<ProductTypeLookupModel[]>>(this.base.PRODUCT_TYPES, { params }).pipe(
      map(r => r.data)
    );
  }

  getOpenBoxes(consigneeId: string, productType?: string): Observable<OpenBoxLookupModel[]> {
    let params = new HttpParams().set('consigneeId', consigneeId);
    if (productType) params = params.set('productType', productType);
    return this.http.get<ApiResponse<OpenBoxLookupModel[]>>(this.base.OPEN_BOXES, { params }).pipe(
      map(r => r.data)
    );
  }

  getProductCodes(unitId: string, customerId: string, consigneeId: string, codeScheme: string): Observable<ProductCodeLookupModel[]> {
    const params = new HttpParams()
      .set('unitId', unitId)
      .set('customerId', customerId)
      .set('consigneeId', consigneeId)
      .set('codeScheme', codeScheme);
    return this.http.get<ApiResponse<ProductCodeLookupModel[]>>(this.base.PRODUCT_CODES, { params }).pipe(
      map(r => r.data)
    );
  }

  getAliquots(unitId: string, productCode: string): Observable<AliquotLookupModel[]> {
    const params = new HttpParams().set('unitId', unitId).set('productCode', productCode);
    return this.http.get<ApiResponse<AliquotLookupModel[]>>(this.base.ALIQUOTS, { params }).pipe(
      map(r => r.data)
    );
  }

  getBloodTypes(unitId: string, productCode: string, codeScheme: string): Observable<BloodTypeLookupModel[]> {
    const params = new HttpParams()
      .set('unitId', unitId)
      .set('productCode', productCode)
      .set('codeScheme', codeScheme);
    return this.http.get<ApiResponse<BloodTypeLookupModel[]>>(this.base.BLOOD_TYPES, { params }).pipe(
      map(r => r.data)
    );
  }

  getDiscardProducts(take: number, skip: number, params: DiscardProductsParamsDto): Observable<{ data: DiscardProductDto[]; totalCount: number }> {
    return this.http.post<ApiResponse<DiscardProductDto[]>>(this.base.DISCARD_PRODUCTS(take, skip), params).pipe(
      map(r => ({ data: r.data, totalCount: r.totalCount || 0 }))
    );
  }

  getBoxContents(boxId: string): Observable<BoxContentItemDto[]> {
    return this.http.get<ApiResponse<BoxContentItemDto[]>>(this.base.BOX_CONTENTS(boxId)).pipe(
      map(r => r.data)
    );
  }

  packProduct(request: PackProductRequestDto): Observable<DiscardProductDto> {
    return this.http.post<ApiResponse<DiscardProductDto>>(this.base.PACK_PRODUCT, request).pipe(
      map(r => r.data)
    );
  }

  closeBox(request: CloseBoxRequestDto): Observable<boolean> {
    return this.http.post<ApiResponse<boolean>>(this.base.CLOSE_BOX, request).pipe(
      map(r => r.data)
    );
  }

  createNewBox(request: CreateNewBoxRequestDto): Observable<{ message: string }> {
    return this.http.post<ApiResponse<boolean>>(this.base.CREATE_NEW_BOX, request).pipe(
      map(r => ({ message: r.message }))
    );
  }
}
