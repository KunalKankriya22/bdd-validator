import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API } from '@core/constants/api.constants';
import {
  ReturnResult,
  OrderSearchResultDto,
  OrderHistoryDto,
  OrderNoteDto,
  OrderedAttributesAntigensDto,
  ShippedProductsDto,
  ShippedAttributesAntigensDto,
} from '../models/order-history-single-order.model';

@Injectable({ providedIn: 'root' })
export class OrderHistorySingleOrderApiService {
  private readonly http = inject(HttpClient);

  searchOrders(q?: string): Observable<ReturnResult<OrderSearchResultDto[]>> {
    let params = new HttpParams();
    if (q) {
      params = params.set('q', q);
    }
    return this.http.get<ReturnResult<OrderSearchResultDto[]>>(
      API.ORDER_HISTORY.SEARCH,
      { params },
    );
  }

  getOrderHistory(orderNo: string): Observable<ReturnResult<OrderHistoryDto>> {
    return this.http.get<ReturnResult<OrderHistoryDto>>(
      API.ORDER_HISTORY.GET(orderNo),
    );
  }

  getItemNotes(orderNo: string, itemNo: number): Observable<ReturnResult<OrderNoteDto[]>> {
    return this.http.get<ReturnResult<OrderNoteDto[]>>(
      API.ORDER_HISTORY.ITEM_NOTES(orderNo, itemNo),
    );
  }

  getOrderedAttributesAntigens(orderNo: string, itemNo: number): Observable<ReturnResult<OrderedAttributesAntigensDto>> {
    return this.http.get<ReturnResult<OrderedAttributesAntigensDto>>(
      API.ORDER_HISTORY.ITEM_ATTRIBUTES_ANTIGENS(orderNo, itemNo),
    );
  }

  getShippedProducts(orderNo: string): Observable<ReturnResult<ShippedProductsDto>> {
    return this.http.get<ReturnResult<ShippedProductsDto>>(
      API.ORDER_HISTORY.SHIPPED_PRODUCTS(orderNo),
    );
  }

  getShippedAttributesAntigens(orderNo: string): Observable<ReturnResult<ShippedAttributesAntigensDto>> {
    return this.http.get<ReturnResult<ShippedAttributesAntigensDto>>(
      API.ORDER_HISTORY.SHIPPED_ATTRIBUTES_ANTIGENS(orderNo),
    );
  }
}
