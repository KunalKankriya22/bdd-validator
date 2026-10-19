import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import {
  CustomerDebitCreditQueryDto,
  CustomerDebitCreditQueryFilterDto,
  ApiResponse,
  LovOption
} from '../models/debit-credit-query.model';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';

/**
 * Service for Customer Debit/Credit Query API operations
 * READ-ONLY service - no create/update/delete operations
 */
@Injectable({
  providedIn: 'root'
})
export class DebitCreditQueryService {
  private readonly apiService = inject(ApiService);

  /**
   * Get paginated list of customer debit/credit records with filtering
   * @param take Number of records to return (1-100)
   * @param skip Number of records to skip for pagination
   * @param filterDto Filter criteria
   * @returns Observable with data and total count
   */
  getDebitCreditRecords(
    take: number,
    skip: number,
    filterDto: CustomerDebitCreditQueryFilterDto
  ): Observable<{ data: CustomerDebitCreditQueryDto[]; totalRecords: number }> {
    return this.apiService
      .post<ApiResponse<CustomerDebitCreditQueryDto>>(
        API.CUSTOMER_DEBIT_CREDIT_QUERY.GET_PAGINATED(take, skip),
        filterDto
      )
      .pipe(
        map(res => ({
          data: res.data ?? [],
          totalRecords: res.totalCount ?? 0
        }))
      );
  }

  /**
   * Get a single customer debit/credit record by Advice ID
   * @param adviceId The Advice ID to retrieve
   * @returns Observable with single record
   */
  getByAdviceId(adviceId: string): Observable<CustomerDebitCreditQueryDto | null> {
    return this.apiService
      .get<ApiResponse<CustomerDebitCreditQueryDto>>(
        API.CUSTOMER_DEBIT_CREDIT_QUERY.GET_BY_ID(adviceId)
      )
      .pipe(
        map(res => {
          if (res.data && res.data.length > 0) {
            return res.data[0];
          }
          return null;
        })
      );
  }

  /**
   * Get customer LOV (List of Values) for dropdown
   * @returns Observable with customer options
   */
  getCustomerLov(): Observable<LovOption[]> {
    return this.apiService
      .get<ApiResponse<{ customerId: string; name: string }>>(API.CUSTOMER_DEBIT_CREDIT_QUERY.CUSTOMER_LOV)
      .pipe(
        map(res => (res.data ?? []).map(item => ({
          code: item.customerId,
          description: item.name
        })))
      );
  }

  /**
   * Search customer LOV with search term
   * @param searchTerm Search term to filter customers by ID or name
   * @returns Observable with filtered customer options
   */
  searchCustomerLov(searchTerm: string): Observable<LovOption[]> {
    return this.apiService
      .get<ApiResponse<LovOption>>(API.CUSTOMER_DEBIT_CREDIT_QUERY.CUSTOMER_LOV_SEARCH(searchTerm))
      .pipe(
        map(res => res.data ?? [])
      );
  }

  /**
   * Get order numbers LOV for a specific customer
   * @param customerId Customer ID to get order numbers for
   * @returns Observable with order number options (includes date)
   */
  getOrderNoLov(customerId: string): Observable<LovOption[]> {
    return this.apiService
      .get<ApiResponse<{ orderNo: string; localInsDate: string }>>(API.CUSTOMER_DEBIT_CREDIT_QUERY.ORDER_NO_LOV(customerId))
      .pipe(
        map(res => (res.data ?? []).map(item => ({
          code: item.orderNo,
          description: item.localInsDate ? this.formatDateForDisplay(item.localInsDate) : ''
        })))
      );
  }

  /**
   * Format date string to DD-MMM-YYYY format
   */
  private formatDateForDisplay(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;

    const day = String(date.getDate()).padStart(2, '0');
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
  }

  /**
   * Get advice IDs LOV for a specific customer
   * @param customerId Customer ID to get advice IDs for
   * @returns Observable with advice ID options
   */
  getAdviceIdLov(customerId: string): Observable<LovOption[]> {
    return this.apiService
      .get<ApiResponse<{ adviceId: string; insertDate: string }>>(API.CUSTOMER_DEBIT_CREDIT_QUERY.ADVICE_ID_LOV(customerId))
      .pipe(
        map(res => (res.data ?? []).map(item => ({
          code: item.adviceId,
          description: item.adviceId
        })))
      );
  }

  /**
   * Get advice IDs LOV for a specific customer and order number
   * @param customerId Customer ID to get advice IDs for
   * @param orderNo Order number to filter advice IDs by
   * @returns Observable with advice ID options filtered by order
   */
  getAdviceIdByOrderLov(customerId: string, orderNo: string): Observable<LovOption[]> {
    return this.apiService
      .get<ApiResponse<{ adviceId: string; insertDate: string }>>(API.CUSTOMER_DEBIT_CREDIT_QUERY.ADVICE_ID_BY_ORDER_LOV(customerId, orderNo))
      .pipe(
        map(res => (res.data ?? []).map(item => ({
          code: item.adviceId,
          description: item.adviceId
        })))
      );
  }
}
