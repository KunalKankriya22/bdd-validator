import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';
import {
  ConsigneeDto,
  CreateConsigneeDto,
  UpdateConsigneeDto,
  ConsigneeQueryDto,
  ZoneLookup,
  StateLookup
} from '../models/consignee.model';

interface ReturnResult<T> {
  success?: boolean;
  message?: string;
  error?: string;
  errorCode?: string;
  statusCode?: number;
  data?: T[];
  item?: T;
  total?: number;
}

@Injectable({ providedIn: 'root' })
export class ConsigneeApiService {
  private readonly apiService = inject(ApiService);

  /**
   * Get list of consignees for a customer with optional filtering
   */
  getConsigneesByCustomer(
    customerId: string,
    query: ConsigneeQueryDto = {}
  ): Observable<{ data: ConsigneeDto[]; total: number }> {
    return this.apiService
      .post<ReturnResult<ConsigneeDto>>(API.CONSIGNEE.LIST(customerId), query)
      .pipe(
        map(response => ({
          data: response.data || [],
          total: response.total || 0
        })),
        catchError(error => {
          console.error('Error loading consignees:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get a single consignee by customer ID and consignee ID
   */
  getConsigneeById(
    customerId: string,
    consigneeId: string
  ): Observable<ConsigneeDto | null> {
    return this.apiService
      .get<ReturnResult<ConsigneeDto>>(API.CONSIGNEE.GET_BY_ID(customerId, consigneeId))
      .pipe(
        map(response => response.data?.[0] || response.item || null),
        catchError(error => {
          console.error('Error loading consignee:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Create a new consignee
   */
  createConsignee(dto: CreateConsigneeDto): Observable<ReturnResult<{ consigneeId: string }>> {
    return this.apiService
      .post<ReturnResult<{ consigneeId: string }>>(API.CONSIGNEE.CREATE, dto)
      .pipe(
        catchError(error => {
          console.error('Error creating consignee:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Update an existing consignee
   */
  updateConsignee(
    customerId: string,
    consigneeId: string,
    dto: UpdateConsigneeDto
  ): Observable<ReturnResult<void>> {
    return this.apiService
      .put<ReturnResult<void>>(API.CONSIGNEE.UPDATE(customerId, consigneeId), dto)
      .pipe(
        catchError(error => {
          console.error('Error updating consignee:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Soft delete a consignee (sets TERM_DATE to current chapter local date)
   */
  deleteConsignee(
    customerId: string,
    consigneeId: string
  ): Observable<ReturnResult<boolean>> {
    return this.apiService
      .delete<ReturnResult<boolean>>(API.CONSIGNEE.DELETE(customerId, consigneeId))
      .pipe(
        catchError(error => {
          console.error('Error deleting consignee:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get active zones for dropdown
   */
  getZones(): Observable<ZoneLookup[]> {
    return this.apiService
      .get<ReturnResult<ZoneLookup>>(API.CONSIGNEE.LOOKUP_ZONES)
      .pipe(
        map(response => {
          // Handle both wrapped (ReturnResult) and unwrapped array responses
          if (Array.isArray(response)) {
            return response;
          }
          return response?.data || [];
        }),
        catchError(error => {
          console.error('Error loading zones:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get active states for dropdown
   * Uses customer-profile states endpoint which is already implemented
   */
  getStates(): Observable<StateLookup[]> {
    return this.apiService
      .get<StateLookup[]>(API.CUSTOMER_PROFILE.STATES)
      .pipe(
        catchError(error => {
          console.error('Error loading states:', error);
          return throwError(() => error);
        })
      );
  }
}
