import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API } from '@core/constants/api.constants';
import {
  ReturnResult,
  OrderSearchResultDto,
  OrderChargesHeaderDto,
  ServiceCodeDto,
  CrDbIndicatorDto,
  OrderChargeDto,
  AddChargeRequest,
  UpdateChargeRequest,
  OrderItemDto,
  ItemAttributesAntigensDto,
} from '../models/enter-order-charges.model';

@Injectable({ providedIn: 'root' })
export class EnterOrderChargesApiService {
  private readonly http = inject(HttpClient);

  getOrders(q?: string): Observable<ReturnResult<OrderSearchResultDto[]>> {
    let params = new HttpParams();
    if (q) {
      params = params.set('q', q);
    }
    return this.http.get<ReturnResult<OrderSearchResultDto[]>>(
      API.ENTER_ORDER_CHARGES.ORDERS,
      { params },
    );
  }

  getOrderCharges(orderNo: string): Observable<ReturnResult<OrderChargesHeaderDto>> {
    return this.http.get<ReturnResult<OrderChargesHeaderDto>>(
      API.ENTER_ORDER_CHARGES.GET(orderNo),
    );
  }

  getServiceCodes(): Observable<ReturnResult<ServiceCodeDto[]>> {
    return this.http.get<ReturnResult<ServiceCodeDto[]>>(
      API.ENTER_ORDER_CHARGES.SERVICE_CODES,
    );
  }

  getCrDbIndicators(): Observable<ReturnResult<CrDbIndicatorDto[]>> {
    return this.http.get<ReturnResult<CrDbIndicatorDto[]>>(
      API.ENTER_ORDER_CHARGES.CRDB_INDICATORS,
    );
  }

  addCharge(orderNo: string, charge: AddChargeRequest): Observable<ReturnResult<OrderChargeDto>> {
    const apiRequest = {
      OrderNo: orderNo,
      ChargeCode: charge.serviceCode,
      CrDbInd: charge.creditDebit,
      Quantity: charge.quantity,
      Amount: charge.amount,
    };

    return this.http.post<ReturnResult<OrderChargeDto>>(
      API.ENTER_ORDER_CHARGES.ADD_CHARGE,
      apiRequest,
    );
  }

  updateCharge(charge: UpdateChargeRequest): Observable<ReturnResult<OrderChargeDto>> {
    const apiRequest = {
      rowId: charge.rowId,
      chargeCode: charge.serviceCode,
      crDbInd: charge.creditDebit,
      quantity: charge.quantity,
      amount: charge.amount,
    };

    return this.http.put<ReturnResult<OrderChargeDto>>(
      API.ENTER_ORDER_CHARGES.UPDATE_CHARGE,
      apiRequest,
    );
  }

  deleteCharge(rowId: string): Observable<ReturnResult<boolean>> {
    return this.http.delete<ReturnResult<boolean>>(
      API.ENTER_ORDER_CHARGES.DELETE_CHARGE(rowId),
    );
  }

  getOrderItems(orderNo: string): Observable<ReturnResult<OrderItemDto[]>> {
    return this.http.get<ReturnResult<OrderItemDto[]>>(
      API.ENTER_ORDER_CHARGES.ORDER_ITEMS(orderNo),
    );
  }

  getItemAttributesAntigens(orderNo: string): Observable<ReturnResult<ItemAttributesAntigensDto>> {
    return this.http.get<ReturnResult<ItemAttributesAntigensDto>>(
      API.ENTER_ORDER_CHARGES.ITEM_ATTRIBUTES_ANTIGENS(orderNo),
    );
  }
}
