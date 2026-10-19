import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  ProcessCodeDto,
  ProductTypeDto,
  ProductCodeDto,
  EligibleProductDto,
  UnitEligibilityDto,
  ComponentDetailDto,
  SpecialProcessResultDto,
  ValidateUnitRequestDto,
  AssignSpecialProcessRequestDto,
  ApiResponse,
} from '../models/verify-component-suitability.model';

/**
 * API Service for Verify Component Suitability feature
 * Handles all HTTP operations for special process assignment
 *
 * Base URL: /api/verify-component-suitability
 * JIRA: MLT-13129
 */
@Injectable({
  providedIn: 'root',
})
export class VerifyComponentSuitabilityApiService {
  private readonly apiService = inject(ApiService);

  /**
   * Get active process codes for the dropdown
   * Endpoint: GET /verify-component-suitability/process-codes
   *
   * @returns Observable of process code array
   */
  getProcessCodes(): Observable<ProcessCodeDto[]> {
    return this.apiService
      .get<ApiResponse<ProcessCodeDto[]>>(API.VERIFY_COMPONENT_SUITABILITY.PROCESS_CODES)
      .pipe(
        map((response) => response?.data || []),
        catchError((error) => throwError(() => error))
      );
  }

  /**
   * Get distinct product types for the dropdown
   * Endpoint: GET /verify-component-suitability/product-types
   *
   * @returns Observable of product type array
   */
  getProductTypes(): Observable<ProductTypeDto[]> {
    return this.apiService
      .get<ApiResponse<ProductTypeDto[]>>(API.VERIFY_COMPONENT_SUITABILITY.PRODUCT_TYPES)
      .pipe(
        map((response) => response?.data || []),
        catchError((error) => throwError(() => error))
      );
  }

  getProductCodes(productType: string): Observable<ProductCodeDto[]> {
    return this.apiService
      .get<ApiResponse<ProductCodeDto[]>>(API.VERIFY_COMPONENT_SUITABILITY.PRODUCT_CODES(productType))
      .pipe(
        map((response) => response?.data || []),
        catchError((error) => throwError(() => error))
      );
  }

  /**
   * Get eligible product codes for a specific unit and process
   * Endpoint: GET /verify-component-suitability/eligible-products
   *
   * @param unitId Unit ID to check (max 15 chars)
   * @param processCode Selected process code (max 5 chars)
   * @returns Observable of eligible product array
   */
  getEligibleProducts(unitId: string, processCode: string): Observable<EligibleProductDto[]> {
    const url = API.VERIFY_COMPONENT_SUITABILITY.ELIGIBLE_PRODUCTS(unitId, processCode);
    return this.apiService
      .get<ApiResponse<EligibleProductDto[]>>(url)
      .pipe(
        map((response) => response?.data || []),
        catchError((error) => throwError(() => error))
      );
  }

  /**
   * Validate unit eligibility for the selected process
   * Endpoint: POST /verify-component-suitability/validate-unit
   *
   * @param request Validate unit request DTO
   * @returns Observable of unit eligibility DTO
   */
  validateUnit(request: ValidateUnitRequestDto): Observable<ApiResponse<UnitEligibilityDto>> {
    return this.apiService
      .post<ApiResponse<UnitEligibilityDto>>(
        API.VERIFY_COMPONENT_SUITABILITY.VALIDATE_UNIT,
        request
      )
      .pipe(catchError((error) => throwError(() => error)));
  }

  validateProduct(
    unitId: string,
    productCode: string,
    processCode: string,
    componentPrefix?: string
  ): Observable<ApiResponse<ComponentDetailDto>> {
    const url = API.VERIFY_COMPONENT_SUITABILITY.VALIDATE_PRODUCT(
      unitId,
      productCode,
      processCode,
      componentPrefix
    );
    return this.apiService
      .post<ApiResponse<ComponentDetailDto>>(url, {})
      .pipe(catchError((error) => throwError(() => error)));
  }

  /**
   * Assign a special process to a component
   * Endpoint: POST /verify-component-suitability/assign
   *
   * @param request Assign special process request DTO
   * @returns Observable of special process result DTO
   */
  assignSpecialProcess(
    request: AssignSpecialProcessRequestDto
  ): Observable<ApiResponse<SpecialProcessResultDto>> {
    return this.apiService
      .post<ApiResponse<SpecialProcessResultDto>>(
        API.VERIFY_COMPONENT_SUITABILITY.ASSIGN,
        request
      )
      .pipe(catchError((error) => throwError(() => error)));
  }

  /**
   * Batch assign multiple components
   * Calls the assign endpoint for each component sequentially
   *
   * @param requests Array of assign requests
   * @returns Observable of results array with success/error status
   */
  assignBatch(
    requests: AssignSpecialProcessRequestDto[]
  ): Observable<Array<{ request: AssignSpecialProcessRequestDto; success: boolean; error?: string; data?: SpecialProcessResultDto }>> {
    return new Observable((observer) => {
      const results: Array<{ request: AssignSpecialProcessRequestDto; success: boolean; error?: string; data?: SpecialProcessResultDto }> = [];
      let completed = 0;

      if (requests.length === 0) {
        observer.next(results);
        observer.complete();
        return;
      }

      requests.forEach((request) => {
        this.assignSpecialProcess(request).subscribe({
          next: (response) => {
            results.push({
              request,
              success: true,
              data: response.data,
            });
            completed++;
            if (completed === requests.length) {
              observer.next(results);
              observer.complete();
            }
          },
          error: (error) => {
            results.push({
              request,
              success: false,
              error: error?.error?.message || error?.message || 'Unknown error',
            });
            completed++;
            if (completed === requests.length) {
              observer.next(results);
              observer.complete();
            }
          },
        });
      });
    });
  }
}
