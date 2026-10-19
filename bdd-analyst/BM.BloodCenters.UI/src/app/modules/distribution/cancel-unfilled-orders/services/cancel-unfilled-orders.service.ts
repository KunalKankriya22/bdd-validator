import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpParams } from '@angular/common/http';

import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';
import {
  OrderSearchCriteriaDto,
  OrderDetailDto,
  CancelOrderRequestDto,
  CancelOrderResponseDto,
  EligibleOrderLovDto,
  OrderTypeLookupDto,
  OrderClassLookupDto,
  OrderItemAttributeDto,
  ReturnResult
} from '../models/cancel-unfilled-orders.model';

@Injectable({
  providedIn: 'root'
})
export class CancelUnfilledOrdersService {
  private readonly apiService = inject(ApiService);

  searchEligibleOrders(criteria: OrderSearchCriteriaDto): Observable<OrderDetailDto[]> {
    let params = new HttpParams();

    if (criteria.hoursOld !== undefined && criteria.hoursOld !== null) {
      params = params.set('hoursOld', criteria.hoursOld.toString());
    }

    if (criteria.orderNo) {
      params = params.set('orderNo', criteria.orderNo.trim());
    }

    return this.apiService
      .get<ReturnResult<OrderDetailDto>>(API.CANCEL_UNFILLED_ORDERS.SEARCH, { params })
      .pipe(
        map(response => response.data as unknown as OrderDetailDto[] ?? [])
      );
  }

  getEligibleOrdersLov(hoursOld?: number): Observable<EligibleOrderLovDto[]> {
    let params = new HttpParams();
    if (hoursOld !== undefined && hoursOld !== null) {
      params = params.set('hoursOld', hoursOld.toString());
    }
    return this.apiService
      .get<ReturnResult<EligibleOrderLovDto>>(API.CANCEL_UNFILLED_ORDERS.LOV, { params })
      .pipe(
        map(response => response.data as unknown as EligibleOrderLovDto[] ?? [])
      );
  }

  getOrderTypes(): Observable<OrderTypeLookupDto[]> {
    return this.apiService
      .get<ReturnResult<OrderTypeLookupDto>>(API.CANCEL_UNFILLED_ORDERS.ORDER_TYPES)
      .pipe(
        map(response => response.data as unknown as OrderTypeLookupDto[] ?? [])
      );
  }

  getOrderClasses(): Observable<OrderClassLookupDto[]> {
    return this.apiService
      .get<ReturnResult<OrderClassLookupDto>>(API.CANCEL_UNFILLED_ORDERS.ORDER_CLASSES)
      .pipe(
        map(response => response.data as unknown as OrderClassLookupDto[] ?? [])
      );
  }

  getOrderDetails(orderNo: string): Observable<OrderDetailDto> {
    return this.apiService
      .get<ReturnResult<OrderDetailDto>>(API.CANCEL_UNFILLED_ORDERS.GET_DETAILS(orderNo))
      .pipe(
        map(response => response.item!)
      );
  }

  getItemAttributes(orderNo: string, itemNo: number): Observable<OrderItemAttributeDto[]> {
    return this.apiService
      .get<ReturnResult<OrderItemAttributeDto>>(API.CANCEL_UNFILLED_ORDERS.ITEM_ATTRIBUTES(orderNo, itemNo))
      .pipe(
        map(response => response.data as unknown as OrderItemAttributeDto[] ?? [])
      );
  }

  cancelUnfilledOrder(orderNo: string, request: CancelOrderRequestDto): Observable<CancelOrderResponseDto> {
    return this.apiService
      .post<ReturnResult<CancelOrderResponseDto>>(
        API.CANCEL_UNFILLED_ORDERS.CANCEL(orderNo),
        request
      )
      .pipe(
        map(response => response.item!)
      );
  }
}
