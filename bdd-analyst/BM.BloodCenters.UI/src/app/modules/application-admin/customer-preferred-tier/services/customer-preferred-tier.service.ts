import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  CustomerPreferredTierModel,
  CustomerPreferredTierQueryDto,
  CreateCustomerPreferredTierRequestDto,
  UpdateCustomerPreferredTierRequestDto,
  CustomerDropdownDto,
  ProductTypeDropdownDto,
  PricingTierDropdownDto
} from '../models/customer-preferred-tier.model';
import { ApiService } from '@shared/services/api.service';
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
export class CustomerPreferredTierService {
  private readonly apiService = inject(ApiService);

  /**
   * Get Customer Preferred Tier table data with filtering
   * POST /api/customer-preferred-tiers
   * @param params - Filter and search parameters
   * @returns Observable with table data and total count
   */
  getAll(
    params: CustomerPreferredTierQueryDto
  ): Observable<{ data: CustomerPreferredTierModel[]; totalRecords: number }> {
    const endpoint = API.APPLICATION_ADMIN.CUSTOMER_PREFERRED_TIER.GET_ALL;

    return this.apiService.post<ReturnResult<CustomerPreferredTierModel>>(endpoint, params).pipe(
      map(response => ({
        data: response.data || [],
        totalRecords: response.total || 0
      })),
      catchError(error => {
        console.error('Error fetching customer preferred tier data:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get single customer preferred tier by composite key
   * GET /api/customer-preferred-tiers/{customerId}/{productType}
   * @param customerId - Customer identifier
   * @param productType - Product type code
   * @returns Observable with single record
   */
  getById(customerId: string, productType: string): Observable<CustomerPreferredTierModel | null> {
    const endpoint = API.APPLICATION_ADMIN.CUSTOMER_PREFERRED_TIER.GET_BY_ID(customerId, productType);

    return this.apiService.get<ReturnResult<CustomerPreferredTierModel>>(endpoint).pipe(
      map(response => (response.data && response.data.length > 0) ? response.data[0] : null),
      catchError(error => {
        console.error('Error fetching customer preferred tier by ID:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Create new customer preferred tier assignment
   * POST /api/customer-preferred-tiers/{customerId}
   * @param customerId - Customer identifier
   * @param data - Create request DTO
   * @returns Observable with result
   */
  create(customerId: string, data: CreateCustomerPreferredTierRequestDto): Observable<ReturnResult<CustomerPreferredTierModel>> {
    const endpoint = API.APPLICATION_ADMIN.CUSTOMER_PREFERRED_TIER.CREATE(customerId);

    return this.apiService.post<ReturnResult<CustomerPreferredTierModel>>(endpoint, data).pipe(
      catchError(error => {
        console.error('Error creating customer preferred tier:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update existing customer preferred tier assignment
   * PUT /api/customer-preferred-tiers/{customerId}/{productType}
   * @param customerId - Customer identifier
   * @param productType - Product type code
   * @param data - Update request DTO
   * @returns Observable with result
   */
  update(
    customerId: string,
    productType: string,
    data: UpdateCustomerPreferredTierRequestDto
  ): Observable<ReturnResult<CustomerPreferredTierModel>> {
    const endpoint = API.APPLICATION_ADMIN.CUSTOMER_PREFERRED_TIER.UPDATE(customerId, productType);

    return this.apiService.put<ReturnResult<CustomerPreferredTierModel>>(endpoint, data).pipe(
      catchError(error => {
        console.error('Error updating customer preferred tier:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Delete customer preferred tier assignment (hard delete)
   * DELETE /api/customer-preferred-tiers/{customerId}/{productType}
   * @param customerId - Customer identifier
   * @param productType - Product type code
   * @returns Observable with boolean result
   */
  delete(customerId: string, productType: string): Observable<boolean> {
    const endpoint = API.APPLICATION_ADMIN.CUSTOMER_PREFERRED_TIER.DELETE(customerId, productType);

    return this.apiService.delete<ReturnResult<boolean>>(endpoint).pipe(
      map(response => (response.data && response.data.length > 0) ? response.data[0] : false),
      catchError(error => {
        console.error('Error deleting customer preferred tier:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get customers dropdown for filters and forms
   * GET /api/customer-preferred-tiers/dropdowns/customers
   * @param searchKeyword - Optional search filter
   * @returns Observable with customer dropdown list
   */
  getCustomersDropdown(searchKeyword?: string): Observable<CustomerDropdownDto[]> {
    const endpoint = API.APPLICATION_ADMIN.CUSTOMER_PREFERRED_TIER.DROPDOWN_CUSTOMERS;
    const options = searchKeyword
      ? { params: new HttpParams().set('searchKeyword', searchKeyword) }
      : undefined;

    return this.apiService.get<ReturnResult<CustomerDropdownDto>>(endpoint, options).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error('Error fetching customers dropdown:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get product types dropdown for filters and forms
   * GET /api/customer-preferred-tiers/dropdowns/product-types
   * @returns Observable with product type dropdown list
   */
  getProductTypesDropdown(): Observable<ProductTypeDropdownDto[]> {
    const endpoint = API.APPLICATION_ADMIN.CUSTOMER_PREFERRED_TIER.DROPDOWN_PRODUCT_TYPES;

    return this.apiService.get<ReturnResult<ProductTypeDropdownDto>>(endpoint).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error('Error fetching product types dropdown:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get distinct product types that exist in customer_preferred_tiers for filter dropdown
   * GET /api/customer-preferred-tiers/dropdowns/filter-product-types?customerId=X
   * @param customerId - Customer ID
   * @returns Observable with product types already in the table
   */
  getFilterProductTypes(customerId: string): Observable<ProductTypeDropdownDto[]> {
    const endpoint = API.APPLICATION_ADMIN.CUSTOMER_PREFERRED_TIER.DROPDOWN_FILTER_PRODUCT_TYPES;
    const httpParams = new HttpParams().set('customerId', customerId);

    return this.apiService.get<ReturnResult<ProductTypeDropdownDto>>(endpoint, { params: httpParams }).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error('Error fetching filter product types:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get pricing tiers dropdown for a specific product type and customer
   * GET /api/customer-preferred-tiers/dropdowns/pricing-tiers?productType=X&customerId=Y
   * @param productType - Product type code (required)
   * @param customerId - Customer ID (optional, uses STANDARD if not provided)
   * @returns Observable with pricing tier dropdown list
   */
  getPricingTiersDropdown(productType: string, customerId?: string): Observable<PricingTierDropdownDto[]> {
    const endpoint = API.APPLICATION_ADMIN.CUSTOMER_PREFERRED_TIER.DROPDOWN_PRICING_TIERS;
    let httpParams = new HttpParams().set('productType', productType);
    if (customerId) {
      httpParams = httpParams.set('customerId', customerId);
    }

    return this.apiService.get<ReturnResult<PricingTierDropdownDto>>(endpoint, { params: httpParams }).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error('Error fetching pricing tiers dropdown:', error);
        return throwError(() => error);
      })
    );
  }
}
