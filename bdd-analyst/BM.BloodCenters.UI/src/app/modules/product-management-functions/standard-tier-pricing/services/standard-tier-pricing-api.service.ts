import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { environment } from 'src/environments/environment';
import { API } from '@core/constants/api.constants';
import {
  StandardTierPricingDto,
  ProductTypeDto,
  StandardTierPricingQueryDto,
  CreateStandardTierPricingDto,
  UpdateStandardTierPricingDto,
  ApiSuccessResponse,
  ApiErrorResponse,
  StandardTierPricingErrorMessages
} from '../models/standard-tier-pricing.model';

/**
 * Standard Tier Pricing API Service
 *
 * Manages all HTTP operations for the Standard Tier Pricing module.
 * All endpoints are derived from the API documentation (MLT-14180).
 *
 * Base URL: /api/v1/standard-tier-pricing
 */
@Injectable({ providedIn: 'root' })
export class StandardTierPricingApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}${API.STANDARD_TIER_PRICING.BASE}`;

  /**
   * Get Active Products
   * GET /api/v1/standard-tier-pricing/products
   *
   * Retrieves list of active product types for dropdown/LOV selection.
   *
   * @returns Observable<ProductTypeDto[]> List of active products
   */
  getActiveProducts(): Observable<ProductTypeDto[]> {
    const url = `${environment.apiUrl}${API.STANDARD_TIER_PRICING.PRODUCTS}`;

    return this.http.get<ApiSuccessResponse<ProductTypeDto[]>>(url).pipe(
      map(response => response.data || []),
      catchError(this.handleError)
    );
  }

  /**
   * Get All Tiers / Filter
   * POST /api/v1/standard-tier-pricing/{take}/{skip}
   *
   * Retrieves paginated list of pricing tiers with optional filtering.
   *
   * @param take Number of records to return (max 100)
   * @param skip Number of records to skip for pagination
   * @param queryDto Filter and sort criteria
   * @returns Observable with data array and totalCount
   */
  searchTiers(
    take: number,
    skip: number,
    queryDto: StandardTierPricingQueryDto
  ): Observable<{ data: StandardTierPricingDto[]; totalCount: number }> {
    const url = `${environment.apiUrl}${API.STANDARD_TIER_PRICING.SEARCH(take, skip)}`;

    return this.http.post<ApiSuccessResponse<StandardTierPricingDto[]>>(url, queryDto).pipe(
      map(response => ({
        data: response.data || [],
        totalCount: response.totalCount || 0
      })),
      catchError(this.handleError)
    );
  }

  /**
   * Get Tier By ID
   * GET /api/v1/standard-tier-pricing/{productType}/{tier}
   *
   * Retrieves a single pricing tier by product type and tier number.
   *
   * @param productType Product type code (max 5 chars)
   * @param tier Tier number
   * @returns Observable<StandardTierPricingDto> Tier details
   */
  getTierById(productType: string, tier: number): Observable<StandardTierPricingDto> {
    const url = `${environment.apiUrl}${API.STANDARD_TIER_PRICING.GET_BY_ID(productType, tier)}`;

    return this.http.get<ApiSuccessResponse<StandardTierPricingDto>>(url).pipe(
      map(response => {
        if (!response.data) {
          throw new Error('Tier not found');
        }
        return response.data;
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Create Tier
   * POST /api/v1/standard-tier-pricing
   *
   * Creates a new pricing tier for a product.
   *
   * Validation:
   * - productType: Max 5 chars, must exist in VSERV_PRODUCT_TYPES
   * - tier: Positive number, unique for product
   * - fromDay: > 0, < lifeSpan, < toDay, no overlap
   * - toDay: <= lifeSpan, >= fromDay, no overlap
   * - effDate: Not in past (YYYY-MM-DD format)
   * - termDate: >= effDate (YYYY-MM-DD format)
   *
   * @param dto Create tier DTO
   * @returns Observable<any> Success response
   */
  createTier(dto: CreateStandardTierPricingDto): Observable<any> {
    const url = `${environment.apiUrl}${API.STANDARD_TIER_PRICING.CREATE}`;

    return this.http.post<ApiSuccessResponse<any>>(url, dto).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Update Tier
   * PUT /api/v1/standard-tier-pricing/{productType}/{tier}
   *
   * Updates an existing pricing tier.
   *
   * **CASCADE EFFECT**: When standard tier day ranges (fromDay, toDay) are updated,
   * all customer-specific pricing for this tier is automatically updated.
   *
   * @param productType Product type code
   * @param tier Tier number
   * @param dto Update tier DTO
   * @returns Observable<any> Success response
   */
  updateTier(productType: string, tier: number, dto: UpdateStandardTierPricingDto): Observable<any> {
    const url = `${environment.apiUrl}${API.STANDARD_TIER_PRICING.UPDATE(productType, tier)}`;

    return this.http.put<ApiSuccessResponse<any>>(url, dto).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Delete Tier
   * DELETE /api/v1/standard-tier-pricing/{productType}/{tier}
   *
   * Soft deletes a tier by setting its termination date to current chapter local date.
   *
   * @param productType Product type code
   * @param tier Tier number
   * @returns Observable<any> Success response
   */
  deleteTier(productType: string, tier: number): Observable<any> {
    const url = `${environment.apiUrl}${API.STANDARD_TIER_PRICING.DELETE(productType, tier)}`;

    return this.http.delete<ApiSuccessResponse<any>>(url).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Error handler for HTTP operations
   *
   * Maps API error codes to user-friendly messages.
   *
   * @param error HttpErrorResponse from API
   * @returns Observable that throws formatted error message
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unexpected error occurred. Please try again.';
    let errorCode = '';

    if (error.error && typeof error.error === 'object') {
      const apiError = error.error as ApiErrorResponse;

      if (apiError.errorResponse?.errorCode) {
        errorCode = apiError.errorResponse.errorCode;
        errorMessage = StandardTierPricingErrorMessages[errorCode] || apiError.errorResponse.error || errorMessage;
      } else if (apiError.errorCode) {
        errorCode = apiError.errorCode;
        errorMessage = StandardTierPricingErrorMessages[errorCode] || errorMessage;
      } else if (apiError.errorResponse?.error) {
        errorMessage = apiError.errorResponse.error;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }

    const displayMessage = errorCode ? `Error ${errorCode}: ${errorMessage}` : errorMessage;
    return throwError(() => new Error(displayMessage));
  }
}
