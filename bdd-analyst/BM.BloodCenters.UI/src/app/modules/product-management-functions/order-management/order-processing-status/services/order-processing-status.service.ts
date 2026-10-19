import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';
import {
  OrderProcessingStatusResponseDto,
  OrderProcessingStatusQueryDto,
  OrderStatusCodeDto,
  OrderDetailDto,
  OrderNoteDto,
  OrderAuditTrailDto,
  OrderedAntigenItem,
  OrderedAttributeItem,
  OrderChargesSummary
} from '../models/order-processing-status.model';

/**
 * Standard API Response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  statusCode?: number;
  errorCode?: string;
  total?: number;
}

/**
 * Order Processing Status Service
 * Handles API calls for order processing status queries
 *
 * Endpoints:
 * - GET /api/order-processing-status - Get orders grouped by type with filters
 * - GET /api/order-processing-status/status-codes - Get order status codes
 */
@Injectable({ providedIn: 'root' })
export class OrderProcessingStatusService {
  private readonly apiService = inject(ApiService);

  /**
   * Get order processing status with optional filters
   * Returns orders grouped by type (STAT, ASAP, Routine, Standing)
   *
   * @param query - Filter parameters
   * @returns Observable of OrderProcessingStatusResponseDto
   */
  getOrderProcessingStatus(
    query: OrderProcessingStatusQueryDto
  ): Observable<OrderProcessingStatusResponseDto> {
    let params = new HttpParams()
      .set('take', query.take.toString())
      .set('skip', query.skip.toString());

    // Add optional filter parameters
    if (query.age !== undefined && query.age !== null) {
      params = params.set('age', query.age.toString());
    }

    if (query.orderStatus) {
      params = params.set('orderStatus', query.orderStatus);
    }

    if (query.fromDate) {
      params = params.set('fromDate', query.fromDate);
    }

    if (query.toDate) {
      params = params.set('toDate', query.toDate);
    }

    return this.apiService
      .get<ApiResponse<OrderProcessingStatusResponseDto[]>>(
        API.ORDER_PROCESSING_STATUS.GET_ORDERS,
        { params }
      )
      .pipe(
        map(response => {
          // API returns array with single item, extract the first element
          if (response.data && response.data.length > 0) {
            return response.data[0];
          }
          // Return empty structure if no data
          return {
            statOrders: [],
            asapOrders: [],
            routineOrders: [],
            standingOrders: [],
            statCount: 0,
            asapCount: 0,
            routineCount: 0,
            standingCount: 0
          };
        })
      );
  }

  /**
   * Get all valid order status codes
   * Used for populating dropdown filters and validation
   *
   * @returns Observable of OrderStatusCodeDto array
   */
  getOrderStatusCodes(): Observable<OrderStatusCodeDto[]> {
    return this.apiService
      .get<ApiResponse<OrderStatusCodeDto[]>>(
        API.ORDER_PROCESSING_STATUS.GET_STATUS_CODES
      )
      .pipe(
        map(response => response.data || [])
      );
  }

  getOrderDetail(orderNo: string): Observable<OrderDetailDto | null> {
    return this.apiService
      .get<ApiResponse<OrderDetailDto[]>>(
        API.ORDER_MANAGEMENT.GET_ORDER(orderNo)
      )
      .pipe(
        map(response => (response.data && response.data.length > 0) ? response.data[0] : null)
      );
  }

  getOrderNotes(orderNo: string): Observable<OrderNoteDto | null> {
    return this.apiService
      .get<ApiResponse<OrderNoteDto[]>>(
        API.ORDER_MANAGEMENT.GET_ORDER_NOTES(orderNo)
      )
      .pipe(
        map(response => (response.data && response.data.length > 0) ? response.data[0] : null)
      );
  }

  getAuditTrail(orderNo: string): Observable<OrderAuditTrailDto[]> {
    return this.apiService
      .get<ApiResponse<OrderAuditTrailDto[]>>(
        API.ORDER_MANAGEMENT.GET_AUDIT_TRAIL(orderNo)
      )
      .pipe(
        map(response => response.data || [])
      );
  }

  getOrderedAntigens(orderNo: string): Observable<OrderedAntigenItem[]> {
    return this.apiService
      .get<any>(API.ORDER_CHARGES.ORDERED_ANTIGENS(orderNo))
      .pipe(map(response => {
        if (Array.isArray(response)) return response;
        if (response?.data && Array.isArray(response.data)) return response.data;
        return [];
      }));
  }

  getOrderedAttributes(orderNo: string): Observable<OrderedAttributeItem[]> {
    return this.apiService
      .get<any>(API.ORDER_CHARGES.ORDERED_ATTRIBUTES(orderNo))
      .pipe(map(response => {
        if (Array.isArray(response)) return response;
        if (response?.data && Array.isArray(response.data)) return response.data;
        return [];
      }));
  }

  getOrderCharges(orderNo: string): Observable<OrderChargesSummary | null> {
    return this.apiService
      .get<any>(API.ORDER_CHARGES.GET_ORDER_CHARGES(orderNo))
      .pipe(
        map(response => {
          const items = Array.isArray(response) ? response : response?.data;
          if (items && Array.isArray(items) && items.length > 0) return items[0];
          return null;
        })
      );
  }
}
