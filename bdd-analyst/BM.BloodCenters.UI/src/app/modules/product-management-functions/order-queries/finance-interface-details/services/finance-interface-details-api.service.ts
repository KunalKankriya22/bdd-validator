import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API } from '@core/constants/api.constants';
import {
  ReturnResult,
  OrderLookupDto,
  InsertDateLookupDto,
  FinanceInterfaceResponseDto,
  FinanceInterfaceSearchRequest,
} from '../models/finance-interface-details.model';

@Injectable({ providedIn: 'root' })
export class FinanceInterfaceDetailsApiService {
  private readonly http = inject(HttpClient);

  getOrders(): Observable<ReturnResult<OrderLookupDto>> {
    return this.http.get<ReturnResult<OrderLookupDto>>(
      API.FINANCE_INTERFACE_DETAILS.ORDERS,
    );
  }

  getInsertDates(orderNo: string): Observable<ReturnResult<InsertDateLookupDto>> {
    return this.http.get<ReturnResult<InsertDateLookupDto>>(
      API.FINANCE_INTERFACE_DETAILS.INSERT_DATES(orderNo),
    );
  }

  search(request: FinanceInterfaceSearchRequest): Observable<ReturnResult<FinanceInterfaceResponseDto>> {
    return this.http.post<ReturnResult<FinanceInterfaceResponseDto>>(
      API.FINANCE_INTERFACE_DETAILS.SEARCH,
      request,
    );
  }
}
