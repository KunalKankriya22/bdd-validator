import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';
import {
  CustomerOrderSearchRequest,
  CustomerOrderDto,
  CustomerLookupDto,
  OrderItemDetailDto,
  ApiResponse,
  DropdownOption,
} from '../models/ocq.model';

@Injectable({
  providedIn: 'root',
})
export class OcqService {
  private readonly apiService = inject(ApiService);

  search(request: CustomerOrderSearchRequest): Observable<CustomerOrderDto[]> {
    return this.apiService
      .post<ApiResponse<CustomerOrderDto[]>>(API.CUSTOMER_ORDERS_QUERY.SEARCH, request)
      .pipe(map((response) => response.data || []));
  }

  getOrderItemDetail(orderNo: string, itemNo: number): Observable<OrderItemDetailDto> {
    return this.apiService
      .get<ApiResponse<OrderItemDetailDto>>(API.CUSTOMER_ORDERS_QUERY.ITEM_DETAIL(orderNo, itemNo))
      .pipe(map((response) => response.data));
  }

  getAllCustomers(): Observable<CustomerLookupDto[]> {
    return this.apiService
      .get<ApiResponse<CustomerLookupDto[]>>(API.CUSTOMER_ORDERS_QUERY.CUSTOMERS(''))
      .pipe(
        map((response) => response.data || []),
        catchError(() => of([]))
      );
  }

  getPriorityOptions(): Observable<DropdownOption[]> {
    return this.getLookups('ORCLS');
  }

  getOrderTypeOptions(): Observable<DropdownOption[]> {
    return this.getLookups('ORTYP');
  }

  getOrderStatusOptions(): Observable<DropdownOption[]> {
    return this.getLookups('ORSTS');
  }

  private getLookups(codeType: string): Observable<DropdownOption[]> {
    return this.apiService
      .get<ApiResponse<DropdownOption[]>>(API.CUSTOMER_ORDERS_QUERY.LOOKUPS(codeType))
      .pipe(
        map((response) => response.data || []),
        catchError(() => of([]))
      );
  }
}
