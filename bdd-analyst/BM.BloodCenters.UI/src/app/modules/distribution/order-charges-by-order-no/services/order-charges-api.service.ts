import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';
import {
  OrderChargesSummary,
  OrderTypeDto,
  OrderListItemDto,
  AuditTrailItem,
  OrderedProduct,
  OrderNote,
  OrderedAntigenItem,
  OrderedAttributeItem
} from '../models/order-charges.model';

@Injectable({ providedIn: 'root' })
export class OrderChargesApiService {
  private apiService = inject(ApiService);

  getOrderCharges(orderNo: string): Observable<OrderChargesSummary> {
    if (!orderNo || orderNo.trim() === '') {
      return throwError(() => new Error('OrderNo is required'));
    }

    return this.apiService.get<any>(API.ORDER_CHARGES.GET_ORDER_CHARGES(orderNo)).pipe(
      map((response) => {
        if (!response.success) {
          throw new Error(response.message || 'Failed to retrieve order charges');
        }
        const data = Array.isArray(response.data) ? response.data[0] : response.data;
        return data as OrderChargesSummary;
      }),
      catchError((error) => {
        console.error('Error fetching order charges:', error);
        return throwError(() => error);
      })
    );
  }

  getOrderTypes(): Observable<OrderTypeDto[]> {
    return this.apiService.get<any>(API.ORDER_CHARGES.ORDER_TYPES).pipe(
      map((response) => {
        if (!response.success) {
          throw new Error(response.message || 'Failed to retrieve order types');
        }
        return (response.data || []) as OrderTypeDto[];
      }),
      catchError((error) => {
        console.error('Error fetching order types:', error);
        return throwError(() => error);
      })
    );
  }

  getOrders(orderType?: string | null): Observable<OrderListItemDto[]> {
    const endpoint = orderType && orderType.trim() !== ''
      ? API.ORDER_CHARGES.ORDERS_BY_TYPE(orderType)
      : API.ORDER_CHARGES.ORDERS;

    return this.apiService.get<any>(endpoint).pipe(
      map((response) => {
        if (!response.success) {
          throw new Error(response.message || 'Failed to retrieve orders');
        }
        return (response.data || []) as OrderListItemDto[];
      }),
      catchError((error) => {
        console.error('Error fetching orders:', error);
        return throwError(() => error);
      })
    );
  }

  getOrderedProducts(orderNo: string): Observable<OrderedProduct[]> {
    return this.apiService.get<any>(API.ORDER_MANAGEMENT.GET_ORDER_ITEMS(orderNo)).pipe(
      map((response) => {
        if (!response.success) {
          throw new Error(response.message || 'Failed to retrieve ordered products');
        }
        return (Array.isArray(response.data) ? response.data : []) as OrderedProduct[];
      }),
      catchError((error) => {
        console.error('Error fetching ordered products:', error);
        return throwError(() => error);
      })
    );
  }

  getOrderNotes(orderNo: string): Observable<OrderNote | null> {
    return this.apiService.get<any>(API.ORDER_MANAGEMENT.GET_ORDER_NOTES(orderNo)).pipe(
      map((response) => {
        if (!response.success) return null;
        const data = Array.isArray(response.data) ? response.data[0] : response.data;
        return (data || null) as OrderNote | null;
      }),
      catchError((error) => {
        console.error('Error fetching order notes:', error);
        return throwError(() => error);
      })
    );
  }

  getAuditTrail(orderNo: string): Observable<AuditTrailItem[]> {
    return this.apiService.get<any>(API.ORDER_CHARGES.AUDIT_TRAIL(orderNo)).pipe(
      map((response) => {
        if (!response.success) {
          throw new Error(response.message || 'Failed to retrieve audit trail');
        }
        return (Array.isArray(response.data) ? response.data : []) as AuditTrailItem[];
      }),
      catchError((error) => {
        console.error('Error fetching audit trail:', error);
        return throwError(() => error);
      })
    );
  }

  getOrderedAntigens(orderNo: string): Observable<OrderedAntigenItem[]> {
    return this.apiService.get<any>(API.ORDER_CHARGES.ORDERED_ANTIGENS(orderNo)).pipe(
      map((response) => (Array.isArray(response.data) ? response.data : []) as OrderedAntigenItem[]),
      catchError((error) => {
        console.error('Error fetching ordered antigens:', error);
        return throwError(() => error);
      })
    );
  }

  getOrderedAttributes(orderNo: string): Observable<OrderedAttributeItem[]> {
    return this.apiService.get<any>(API.ORDER_CHARGES.ORDERED_ATTRIBUTES(orderNo)).pipe(
      map((response) => (Array.isArray(response.data) ? response.data : []) as OrderedAttributeItem[]),
      catchError((error) => {
        console.error('Error fetching ordered attributes:', error);
        return throwError(() => error);
      })
    );
  }
}
