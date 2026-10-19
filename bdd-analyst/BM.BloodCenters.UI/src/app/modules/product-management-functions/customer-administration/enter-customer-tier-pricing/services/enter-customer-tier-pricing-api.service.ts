import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  CustomerTierPricingDto,
  CustomerLOV,
  ProductTypeLOV,
  DropdownValuesResponse,
  CreateCustomerTierPricingRequest,
  UpdateCustomerTierPricingDto,
  CustomerTierPricingFilterRequest
} from '../models/enter-customer-tier-pricing.model';

interface DropdownValuesApiResponse {
  customers: { customerId: string; customerName: string; phoneNo?: string }[];
  productTypes: {
    productType: string;
    description: string;
    lifeSpan: number;
    lifeSpanIndicator: string;
    standardPrice: number;
    standardTiers: {
      customer: string;
      tier: number;
      minimumAge: number;
      maximumAge: number;
      tierDay: number;
      unitPrice: number;
      effectiveDate: string;
      terminationDate: string | null;
    }[];
  }[];
}

interface GetPricingApiResponse {
  success: boolean;
  data: CustomerTierPricingDto[];
  total: number;
}

interface SaveApiResponse {
  success: boolean;
  message: string;
  total: number;
}

@Injectable({ providedIn: 'root' })
export class EnterCustomerTierPricingApiService {
  private readonly apiService = inject(ApiService);

  getDropdownValues(): Observable<DropdownValuesResponse> {
    return this.apiService
      .get<DropdownValuesApiResponse>(API.ENTER_CUSTOMER_TIER_PRICING.DROPDOWN_VALUES)
      .pipe(
        map(response => ({
          customers: response.customers.map((c): CustomerLOV => ({
            customerId: c.customerId,
            customerName: c.customerName,
            phoneNo: c.phoneNo
          })),
          productTypes: response.productTypes.map((pt): ProductTypeLOV => ({
            productTypeId: pt.productType,
            productTypeDesc: pt.description,
            lifeSpan: pt.lifeSpan,
            lifeSpanIndicator: pt.lifeSpanIndicator,
            standardPrice: pt.standardPrice,
            standardTiers: pt.standardTiers
          }))
        })),
        catchError(error => throwError(() => error))
      );
  }

  getCustomerTierPricing(
    customerId: string,
    productType: string
  ): Observable<{ data: CustomerTierPricingDto[]; total: number }> {
    return this.apiService
      .get<GetPricingApiResponse>(API.ENTER_CUSTOMER_TIER_PRICING.GET(customerId, productType))
      .pipe(
        map(response => ({
          data: response.data || [],
          total: response.total || 0
        })),
        catchError(error => throwError(() => error))
      );
  }

  searchCustomerTierPricing(
    customerId: string,
    productType: string,
    filters: CustomerTierPricingFilterRequest
  ): Observable<{ data: CustomerTierPricingDto[]; total: number }> {
    return this.apiService
      .post<GetPricingApiResponse>(API.ENTER_CUSTOMER_TIER_PRICING.SEARCH(customerId, productType), filters)
      .pipe(
        map(response => ({
          data: response.data || [],
          total: response.total || 0
        })),
        catchError(error => throwError(() => error))
      );
  }

  createCustomerTierPricing(dto: CreateCustomerTierPricingRequest): Observable<SaveApiResponse> {
    return this.apiService
      .post<SaveApiResponse>(API.ENTER_CUSTOMER_TIER_PRICING.CREATE, dto)
      .pipe(
        catchError(error => throwError(() => error))
      );
  }

  updateCustomerTierPricing(
    customerId: string,
    productType: string,
    tier: number,
    dto: UpdateCustomerTierPricingDto
  ): Observable<SaveApiResponse> {
    return this.apiService
      .put<SaveApiResponse>(API.ENTER_CUSTOMER_TIER_PRICING.UPDATE(customerId, productType, tier), dto)
      .pipe(
        catchError(error => throwError(() => error))
      );
  }

  deleteCustomerTierPricing(
    customerId: string,
    productType: string,
    tier: number
  ): Observable<SaveApiResponse> {
    return this.apiService
      .delete<SaveApiResponse>(API.ENTER_CUSTOMER_TIER_PRICING.DELETE(customerId, productType, tier))
      .pipe(
        catchError(error => throwError(() => error))
      );
  }
}
