import { Injectable, inject } from '@angular/core';
import { Observable, throwError, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import {
  OrderChargeModel,
  OrderChargeApiModel,
  OrderChargesApiResponse,
  OrderChargeCreateDto,
  OrderChargeUpdateDto,
  OrderChargesRequestParams,
  ServiceCodeDropdownOption,
  ChargeTypeLovOption,
  FilterServiceCodesApiResponse,
  ChargeTypeLovApiResponse,
  ApiResponse
} from '../models/define-order-charges.model';

/**
 * Service for Define Order Charges CRUD operations
 * Handles API communication and data transformation
 */
@Injectable({ providedIn: 'root' })
export class DefineOrderChargesService {
  // Service methods for order charges management
  private apiService = inject(ApiService);

  // API base URL as per documentation
  private readonly baseUrl = '/api/v1/order-charges';

  /**
   * Transform API model to frontend model
   * API already returns dates in dd-MMM-yyyy format, convert month to uppercase
   */
  private transformApiModel(apiModel: OrderChargeApiModel): OrderChargeModel {
    return {
      serviceCode: apiModel.chargeCode,
      serviceCodeDescription: apiModel.chargeCodeDesc,
      charge: apiModel.charge,
      modifyCharge: apiModel.editCharge === 'Y' ? 'Yes' : apiModel.editCharge === 'N' ? 'No' : 'No',
      chargeType: apiModel.chargeCodeTypeDesc,  // Use description ('Debit' or 'Credit')
      // shipFlag can be Y/N or null - map to Y/N/S/B format
      shipmentCharge: (apiModel.shipFlag || 'N') as 'Y' | 'N' | 'S' | 'B',
      orderNumber: apiModel.crNcr === 'Y' ? 'Yes' : apiModel.crNcr === 'N' ? 'No' : 'No',
      effectiveDate: this.uppercaseMonth(apiModel.effectiveDate),
      targetDate: this.uppercaseMonth(apiModel.terminationDate),
      lastModifiedDate: this.uppercaseMonth(apiModel.lastModifiedDate)
    };
  }

  /**
   * Convert month in date string to uppercase
   * Format: dd-MMM-yyyy (e.g., "01-Jan-2024" -> "01-JAN-2024")
   */
  private uppercaseMonth(dateString: string | null | undefined): string {
    if (!dateString) return '';

    const parts = dateString.split('-');
    if (parts.length === 3) {
      parts[1] = parts[1].toUpperCase();
      return parts.join('-');
    }

    return dateString;
  }

  /**
   * Build request body from filter parameters
   */
  private buildRequestBody(params?: OrderChargesRequestParams): any {
    const body: any = {};

    if (!params) return body;

    // Only include fields that are not null/undefined
    if (params.searchKeyword) {
      body.searchKeyword = params.searchKeyword;
    }

    if (params.filterServiceCode) {
      body.filterServiceCode = params.filterServiceCode;
    }

    if (params.sortColumn) {
      body.sortColumn = params.sortColumn;
      body.sortOrder = params.sortOrder || 'ASC';
    }

    if (params.filterEffectiveDateAfter) {
      body.filterEffectiveDateAfter = params.filterEffectiveDateAfter;
    }

    if (params.filterEffectiveDateBefore) {
      body.filterEffectiveDateBefore = params.filterEffectiveDateBefore;
    }

    if (params.filterTermDateAfter) {
      body.filterTermDateAfter = params.filterTermDateAfter;
    }

    if (params.filterTermDateBefore) {
      body.filterTermDateBefore = params.filterTermDateBefore;
    }

    return body;
  }

  /**
   * Get paginated list of order charges with optional filters
   * POST /api/v1/order-charges/{take}/{skip}
   */
  getOrderCharges(
    take: number,
    skip: number,
    params?: OrderChargesRequestParams
  ): Observable<{ data: OrderChargeModel[]; totalRecords: number }> {
    const endpoint = `${this.baseUrl}/${take}/${skip}`;
    const requestBody = this.buildRequestBody(params);

    return this.apiService.post<OrderChargesApiResponse>(endpoint, requestBody).pipe(
      map((response) => {
        const transformedData = (response.data || []).map(item =>
          this.transformApiModel(item)
        );

        return {
          data: transformedData,
          totalRecords: response.total || 0
        };
      }),
      catchError((error) => {
        console.error('Error fetching order charges:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Create a new order charge
   * POST /api/v1/order-charges
   */
  addOrderCharge(request: OrderChargeCreateDto): Observable<ApiResponse<any>> {
    const endpoint = `${this.baseUrl}`;

    return this.apiService.post<any>(endpoint, request).pipe(
      map(response => ({
        success: response.success,
        message: response.message,
        data: response.item || response.data
      })),
      catchError((error) => {
        console.error('Error creating order charge:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update an existing order charge
   * PUT /api/v1/order-charges
   * Uses originalChargeCode to identify the record
   */
  updateOrderCharge(request: OrderChargeUpdateDto): Observable<ApiResponse<any>> {
    const endpoint = `${this.baseUrl}`;

    return this.apiService.put<any>(endpoint, request).pipe(
      map(response => ({
        success: response.success,
        message: response.message,
        data: response.item || response.data
      })),
      catchError((error) => {
        console.error('Error updating order charge:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Check if service code already exists (not in API spec - frontend only validation)
   * Backend validates on save - actual validation error code 0319 will be returned
   */
  checkDuplicateServiceCode(serviceCode: string, chapterId: string): Observable<boolean> {
    // Backend validates on save - return false (no duplicate) to skip FE validation
    return of(false);
  }

  /**
   * Validate billing code (not in API spec - validation happens on backend save)
   * Backend validates on save - actual validation error code 0247 will be returned
   */
  validateBillingCode(billingCode: string): Observable<boolean> {
    // Backend validates on save - return true (valid) to skip FE validation
    return of(true);
  }

  /**
   * Get charge type LOV for Add/Edit form dropdown
   * GET /api/v1/order-charges/charge-type-lov
   */
  getChargeTypeLov(): Observable<ChargeTypeLovOption[]> {
    const endpoint = `${this.baseUrl}/charge-type-lov`;

    return this.apiService.get<ChargeTypeLovApiResponse>(endpoint).pipe(
      map((response) => response.data || []),
      catchError((error) => {
        console.error('Error fetching charge type LOV:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get service codes for filter panel dropdown
   * GET /api/v1/order-charges/filter/service-codes
   */
  getFilterServiceCodes(): Observable<ServiceCodeDropdownOption[]> {
    const endpoint = `${this.baseUrl}/filter/service-codes`;

    return this.apiService.get<FilterServiceCodesApiResponse>(endpoint).pipe(
      map((response) => response.data || []),
      catchError((error) => {
        console.error('Error fetching filter service codes:', error);
        return throwError(() => error);
      })
    );
  }
}
