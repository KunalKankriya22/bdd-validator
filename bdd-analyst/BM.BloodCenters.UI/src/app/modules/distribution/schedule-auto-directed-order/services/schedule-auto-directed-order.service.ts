import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';
import {
  ReturnResult,
  AvailableUnit,
  CustomerInfo,
  ConsigneeInfo,
  ScheduleOrderResponse,
  AvailableUnitsQuery,
  CreateOrderRequest,
  CustomerLookup,
  ConsigneeLookup,
} from '../models/schedule-auto-directed-order.model';

@Injectable({
  providedIn: 'root',
})
export class ScheduleAutoDirectedOrderService {
  private readonly apiService = inject(ApiService);

  getCustomerInfo(customerId: string): Observable<ReturnResult<CustomerInfo>> {
    return this.apiService.get<ReturnResult<CustomerInfo>>(
      API.SCHEDULE_AUTO_DIRECTED_ORDER.CUSTOMER(customerId)
    );
  }

  getConsigneeInfo(consigneeId: string): Observable<ReturnResult<ConsigneeInfo>> {
    return this.apiService.get<ReturnResult<ConsigneeInfo>>(
      API.SCHEDULE_AUTO_DIRECTED_ORDER.CONSIGNEE(consigneeId)
    );
  }

  getAvailableUnits(query: AvailableUnitsQuery): Observable<ReturnResult<AvailableUnit>> {
    return this.apiService.post<ReturnResult<AvailableUnit>>(
      API.SCHEDULE_AUTO_DIRECTED_ORDER.AVAILABLE_UNITS,
      query
    );
  }

  createOrder(request: CreateOrderRequest): Observable<ReturnResult<ScheduleOrderResponse>> {
    return this.apiService.post<ReturnResult<ScheduleOrderResponse>>(
      API.SCHEDULE_AUTO_DIRECTED_ORDER.CREATE,
      request
    );
  }

  getCustomersLookup(): Observable<ReturnResult<CustomerLookup>> {
    return this.apiService.get<ReturnResult<CustomerLookup>>(
      API.SCHEDULE_AUTO_DIRECTED_ORDER.CUSTOMERS_LOOKUP
    );
  }

  getConsigneesLookup(customerId: string): Observable<ReturnResult<ConsigneeLookup>> {
    return this.apiService.get<ReturnResult<ConsigneeLookup>>(
      API.SCHEDULE_AUTO_DIRECTED_ORDER.CONSIGNEES_LOOKUP(customerId)
    );
  }
}
