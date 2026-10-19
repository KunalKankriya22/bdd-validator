import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';
import {
  CustomerProductTierPricingQueryDto,
  CustomerProductTierPricingDto,
  CustomerProductSummaryDto,
  ApiResponse,
} from '../models/customer-product-tier-pricing.model';

@Injectable({ providedIn: 'root' })
export class CustomerProductTierPricingApiService {
  private readonly apiService = inject(ApiService);

  /**
   * Get customer-product summaries for master table
   * POST /api/v1/customer-product-tier-pricing/customers
   */
  getCustomerProductSummaries(
    query: CustomerProductTierPricingQueryDto
  ): Observable<{ data: CustomerProductSummaryDto[]; total: number }> {
    return this.apiService
      .post<ApiResponse<CustomerProductSummaryDto>>(
        API.CUSTOMER_PRODUCT_TIER_PRICING.CUSTOMERS,
        query
      )
      .pipe(
        map((res) => ({
          data: res.data ?? [],
          total: res.total ?? 0,
        })),
        catchError((error) => {
          return throwError(() => error);
        })
      );
  }

  /**
   * Get pricing tiers for a specific customer-product combination
   * GET /api/v1/customer-product-tier-pricing/customers/{customerId}/products/{productType}/tiers
   */
  getTiersByCustomerAndProduct(
    customerId: string,
    productType: string
  ): Observable<CustomerProductTierPricingDto[]> {
    return this.apiService
      .get<ApiResponse<CustomerProductTierPricingDto>>(
        API.CUSTOMER_PRODUCT_TIER_PRICING.TIERS(customerId, productType)
      )
      .pipe(
        map((res) => res.data ?? []),
        catchError((error) => {
          return throwError(() => error);
        })
      );
  }
}
