import { Injectable, inject } from '@angular/core';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  OrderClassCodesModel,
  OrderClassCodesParamsDto,
  OrderClassCodesDto,
  UpdateOrderClassCodesDto
} from '../models/order-class-codes.model';
import { ApiService } from '@shared/services/api.service';
import { HeaderService } from '@shared/services/header.service';
import { API } from 'src/app/core/constants/api.constants';

interface ReturnResult<T> {
  success?: boolean;
  message?: string;
  error?: string;
  statusCode?: number;
  data?: T[];
  item?: T;
  total?: number;
}

@Injectable({
  providedIn: 'root'
})
export class OrderClassCodesService {
  private readonly apiService = inject(ApiService);
  private readonly headerService = inject(HeaderService);

  /**
   * Get Order Class Codes table data with pagination
   * POST /api/v1/admin/order-class/{chapterId}/{take}/{skip}
   * @param take - Number of records to fetch
   * @param skip - Number of records to skip
   * @param params - Filter and search parameters
   * @returns Observable with table data and total count
   */
  getOrderClassCodes(
    take: number,
    skip: number,
    params: OrderClassCodesParamsDto
  ): Observable<{ data: OrderClassCodesModel[]; totalRecords: number }> {
    const chapterId = this.headerService.chapterId() ?? '';
    const endpoint = API.APPLICATION_ADMIN.ORDER_CLASS_CODES(chapterId, take, skip);

    return this.apiService.post<ReturnResult<OrderClassCodesModel>>(endpoint, params).pipe(
      map(response => ({
        data: response.data || [],
        totalRecords: response.total || 0
      })),
      catchError(error => {
        // Handle 404 with total: 0 as "no records found" (not an error)
        if (error.status === 404 || (error.error?.statusCode === 404 && error.error?.total === 0)) {
          return of({
            data: [],
            totalRecords: 0
          });
        }
        console.error('Error fetching order class codes data:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get priority options for dropdown (0-99)
   * @returns Array of priority options
   */
  getPriorityOptions(): number[] {
    return Array.from({ length: 100 }, (_, i) => i);
  }

  /**
   * Add new Order Class Code
    * POST /api/v1/admin/order-class
   * @param data - Order class code data
   * @returns Observable with result
   */
  addOrderClassCode(data: OrderClassCodesDto): Observable<ReturnResult<OrderClassCodesModel>> {
    const endpoint = API.APPLICATION_ADMIN.ORDER_CLASS_CODES_ADD_EDIT;

    return this.apiService.post<ReturnResult<OrderClassCodesModel>>(endpoint, data).pipe(
      catchError(error => {
        console.error('Error adding order class code:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update existing Order Class Code
    * PUT /api/v1/admin/order-class
   * @param data - Order class code data
   * @returns Observable with result
   */
  updateOrderClassCode(data: UpdateOrderClassCodesDto): Observable<ReturnResult<OrderClassCodesModel>> {
    const endpoint = API.APPLICATION_ADMIN.ORDER_CLASS_CODES_ADD_EDIT;

    return this.apiService.put<ReturnResult<OrderClassCodesModel>>(endpoint, data).pipe(
      catchError(error => {
        console.error('Error updating order class code:', error);
        return throwError(() => error);
      })
    );
  }
}
