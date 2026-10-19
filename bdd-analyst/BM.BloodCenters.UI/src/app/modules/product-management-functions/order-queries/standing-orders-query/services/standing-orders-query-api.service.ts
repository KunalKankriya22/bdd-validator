import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API } from '@core/constants/api.constants';
import {
  ApiResponse,
  StandingOrderDto,
  StandingOrderItemDto,
  StandingOrderSearchRequest,
  WeekDayLookup,
  CustomerTypeLookup,
  CustomerLookup,
} from '../models/standing-orders-query.model';

@Injectable({ providedIn: 'root' })
export class StandingOrdersQueryApiService {
  private readonly http = inject(HttpClient);

  searchOrders(request: StandingOrderSearchRequest): Observable<ApiResponse<StandingOrderDto>> {
    return this.http.post<ApiResponse<StandingOrderDto>>(
      API.STANDING_ORDER_QUERY.SEARCH,
      request,
    );
  }

  getOrderItems(contractId: string, consigneeId: string, weekDay: string): Observable<ApiResponse<StandingOrderItemDto>> {
    return this.http.get<ApiResponse<StandingOrderItemDto>>(
      API.STANDING_ORDER_QUERY.ITEMS(contractId, consigneeId, weekDay),
    );
  }

  getWeekDays(): Observable<ApiResponse<WeekDayLookup>> {
    return this.http.get<ApiResponse<WeekDayLookup>>(
      API.STANDING_ORDER_QUERY.LOOKUPS.WEEKDAYS,
    );
  }

  getCustomerTypes(): Observable<ApiResponse<CustomerTypeLookup>> {
    return this.http.get<ApiResponse<CustomerTypeLookup>>(
      API.STANDING_ORDER_QUERY.LOOKUPS.CUSTOMER_TYPES,
    );
  }

  getCustomers(customerType?: string): Observable<ApiResponse<CustomerLookup>> {
    let params = new HttpParams();
    if (customerType) {
      params = params.set('customerType', customerType);
    }
    return this.http.get<ApiResponse<CustomerLookup>>(
      API.STANDING_ORDER_QUERY.LOOKUPS.CUSTOMERS,
      { params },
    );
  }
}
