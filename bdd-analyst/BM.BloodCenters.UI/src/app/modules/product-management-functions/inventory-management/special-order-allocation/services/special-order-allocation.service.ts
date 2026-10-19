import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from 'src/environments/environment';
import { API } from '@core/constants/api.constants';
import {
  ApiResponse,
  SpecialOrderAllocationDto,
  SpecialOrderAllocationQueryDto,
  CreateSpecialOrderAllocationRequestDto,
  UpdateSpecialOrderAllocationRequestDto,
  OrderItemDto,
  OrderHeaderDto,
  PickSlipLookupDto,
  OrderLookupDto,
  AllocatedUnitDto,
  OrderItemAntigenDto,
  OrderItemAttributeDto,
  MatchingProductApiDto,
  MatchingProductsQueryApiDto,
  AllocateUnitsRequestApiDto,
  InventorySummaryApiDto,
  InventoryTierDetailApiDto,
  UnitAntigenAttributeDto
} from '../models/special-order-allocation.model';

@Injectable({
  providedIn: 'root'
})
export class SpecialOrderAllocationService {
  private readonly http = inject(HttpClient);

  getAllocations(
    take: number,
    skip: number,
    filters?: SpecialOrderAllocationQueryDto
  ): Observable<ApiResponse<SpecialOrderAllocationDto>> {
    const url = `${environment.apiUrl}${API.SPECIAL_ORDER_ALLOCATION.SEARCH(take, skip)}`;
    return this.http.post<ApiResponse<SpecialOrderAllocationDto>>(url, filters || {});
  }

  getAllocationById(
    pickSlipId: string,
    itemNo: number,
    unitId: string
  ): Observable<SpecialOrderAllocationDto | null> {
    const url = `${environment.apiUrl}${API.SPECIAL_ORDER_ALLOCATION.GET_BY_ID(pickSlipId, itemNo, unitId)}`;
    return this.http.get<ApiResponse<SpecialOrderAllocationDto>>(url).pipe(
      map(response => response.success && response.data?.length > 0 ? response.data[0] : null)
    );
  }

  getOrderItems(
    orderNo: string,
    take: number,
    skip: number
  ): Observable<ApiResponse<OrderItemDto>> {
    const url = `${environment.apiUrl}${API.SPECIAL_ORDER_ALLOCATION.ORDER_ITEMS(orderNo, take, skip)}`;
    return this.http.get<ApiResponse<OrderItemDto>>(url);
  }

  createAllocation(
    request: CreateSpecialOrderAllocationRequestDto
  ): Observable<ApiResponse<any>> {
    const url = `${environment.apiUrl}${API.SPECIAL_ORDER_ALLOCATION.CREATE}`;
    return this.http.post<ApiResponse<any>>(url, request);
  }

  updateAllocation(
    pickSlipId: string,
    itemNo: number,
    unitId: string,
    request: UpdateSpecialOrderAllocationRequestDto
  ): Observable<ApiResponse<any>> {
    const url = `${environment.apiUrl}${API.SPECIAL_ORDER_ALLOCATION.UPDATE(pickSlipId, itemNo, unitId)}`;
    return this.http.put<ApiResponse<any>>(url, request);
  }

  deleteAllocation(
    pickSlipId: string,
    itemNo: number,
    unitId: string,
    orderNo: string
  ): Observable<boolean> {
    const url = `${environment.apiUrl}${API.SPECIAL_ORDER_ALLOCATION.DELETE(pickSlipId, itemNo, unitId, orderNo)}`;
    return this.http.delete<ApiResponse<boolean>>(url).pipe(
      map(response => response.success && response.data?.length > 0 ? response.data[0] : false)
    );
  }

  getOrderHeader(orderNo: string): Observable<OrderHeaderDto | null> {
    const url = `${environment.apiUrl}${API.SPECIAL_ORDER_ALLOCATION.ORDER_HEADER(orderNo)}`;
    return this.http.get<ApiResponse<OrderHeaderDto>>(url).pipe(
      map(response => response.success && response.data?.length > 0 ? response.data[0] : null)
    );
  }

  getPickSlips(orderNo: string): Observable<PickSlipLookupDto[]> {
    const url = `${environment.apiUrl}${API.SPECIAL_ORDER_ALLOCATION.PICK_SLIPS(orderNo)}`;
    return this.http.get<ApiResponse<PickSlipLookupDto>>(url).pipe(
      map(response => response.success && response.data ? response.data : [])
    );
  }

  getOrdersByType(orderType: string): Observable<OrderLookupDto[]> {
    const url = `${environment.apiUrl}${API.SPECIAL_ORDER_ALLOCATION.LOOKUP_ORDERS(orderType)}`;
    return this.http.get<ApiResponse<OrderLookupDto>>(url).pipe(
      map(response => response.success && response.data ? response.data : [])
    );
  }

  getAllocatedUnits(orderNo: string, itemNo: number): Observable<AllocatedUnitDto[]> {
    const url = `${environment.apiUrl}${API.SPECIAL_ORDER_ALLOCATION.ALLOCATED_UNITS(orderNo, itemNo)}`;
    return this.http.get<ApiResponse<AllocatedUnitDto>>(url).pipe(
      map(response => response.success && response.data ? response.data : [])
    );
  }

  getOrderItemAntigens(orderNo: string, itemNo: number): Observable<OrderItemAntigenDto[]> {
    const url = `${environment.apiUrl}${API.SPECIAL_ORDER_ALLOCATION.ORDER_ITEM_ANTIGENS(orderNo, itemNo)}`;
    return this.http.get<ApiResponse<OrderItemAntigenDto>>(url).pipe(
      map(response => response.success && response.data ? response.data : [])
    );
  }

  getOrderItemAttributes(orderNo: string, itemNo: number): Observable<OrderItemAttributeDto[]> {
    const url = `${environment.apiUrl}${API.SPECIAL_ORDER_ALLOCATION.ORDER_ITEM_ATTRIBUTES(orderNo, itemNo)}`;
    return this.http.get<ApiResponse<OrderItemAttributeDto>>(url).pipe(
      map(response => response.success && response.data ? response.data : [])
    );
  }

  getInventorySummary(
    productType: string,
    bloodType: string
  ): Observable<InventorySummaryApiDto | null> {
    const url = `${environment.apiUrl}${API.SPECIAL_ORDER_ALLOCATION.INVENTORY_LEVELS(productType, bloodType)}`;
    return this.http.get<any>(url).pipe(
      map(response => response.success && response.item ? response.item : null)
    );
  }

  getMatchingProducts(query: MatchingProductsQueryApiDto): Observable<ApiResponse<MatchingProductApiDto>> {
    const url = `${environment.apiUrl}${API.SPECIAL_ORDER_ALLOCATION.MATCHING_PRODUCTS}`;
    return this.http.post<ApiResponse<MatchingProductApiDto>>(url, query);
  }

  allocateUnits(request: AllocateUnitsRequestApiDto): Observable<ApiResponse<any>> {
    const url = `${environment.apiUrl}${API.SPECIAL_ORDER_ALLOCATION.ALLOCATE_UNITS}`;
    return this.http.post<ApiResponse<any>>(url, request);
  }

  placeBackOrder(orderNo: string, itemNo: number): Observable<ApiResponse<any>> {
    const url = `${environment.apiUrl}${API.SPECIAL_ORDER_ALLOCATION.BACK_ORDER(orderNo, itemNo)}`;
    return this.http.post<ApiResponse<any>>(url, {});
  }

  getUnitAntigensAndAttributes(unitId: string, collDate: string, productCode: string): Observable<UnitAntigenAttributeDto> {
    const url = `${environment.apiUrl}${API.SPECIAL_ORDER_ALLOCATION.UNIT_ANTIGENS_ATTRIBUTES(unitId, collDate, productCode)}`;
    return this.http.get<any>(url).pipe(
      map(response => response.success && response.item ? response.item : { antigens: [], attributes: [] })
    );
  }
}
