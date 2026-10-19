import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { HttpParams } from '@angular/common/http';

import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';

import {
  ApiResponse,
  UnitValidationResponseDto,
  RejectableProductDto,
  ComponentForRejectionDto,
  RejectReasonDto,
  CatalogNumberDto,
  AboLabelDto,
  ValidateProductCodeResponseDto,
  RejectComponentRequestDto,
  RejectComponentResponseDto,
  ReprintLabelRequestDto,
  ReprintLabelResponseDto
} from '../models/reject-unit-component.model';

@Injectable({
  providedIn: 'root'
})
export class RejectUnitComponentService {
  private readonly apiService = inject(ApiService);

  /**
   * Validate unit is eligible for rejection.
   * GET /api/reject-component/validate-unit/{unitId}
   * ChapterId & WarehouseId sent via X-ChapterId / X-WareHouseId headers (auth interceptor).
   */
  validateUnit(unitId: string): Observable<UnitValidationResponseDto> {
    const endpoint = API.REJECT_COMPONENT.VALIDATE_UNIT(unitId);

    return this.apiService.get<ApiResponse<UnitValidationResponseDto>>(endpoint).pipe(
      map(response => {
        if (response.data?.length > 0) {
          return response.data[0];
        }
        throw new Error('No validation data returned');
      }),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Get available product codes for the unit (LOV dropdown, includes "NONE" for empty bags).
   * GET /api/reject-component/product-codes/{unitId}
   */
  getProductCodes(unitId: string): Observable<RejectableProductDto[]> {
    const endpoint = API.REJECT_COMPONENT.PRODUCT_CODES(unitId);

    return this.apiService.get<ApiResponse<RejectableProductDto>>(endpoint).pipe(
      map(response => response.data || []),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Get components available for rejection for a specific product.
   * GET /api/reject-component/components/{unitId}/{productCode}
   */
  getComponents(unitId: string, productCode: string): Observable<ComponentForRejectionDto[]> {
    const endpoint = API.REJECT_COMPONENT.COMPONENTS(unitId, productCode);

    return this.apiService.get<ApiResponse<ComponentForRejectionDto>>(endpoint).pipe(
      map(response => response.data || []),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Get active rejection reason codes (excludes biohazard interdiction codes).
   * GET /api/reject-component/rejection-reasons
   */
  getRejectionReasons(): Observable<RejectReasonDto[]> {
    const endpoint = API.REJECT_COMPONENT.REJECTION_REASONS;

    return this.apiService.get<ApiResponse<RejectReasonDto>>(endpoint).pipe(
      map(response => response.data || []),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Get valid catalog numbers for unit/product type.
   * GET /api/reject-component/catalog-numbers/{unitId}?productType=X
   */
  getCatalogNumbers(unitId: string, productType?: string, productCode?: string): Observable<CatalogNumberDto[]> {
    const endpoint = API.REJECT_COMPONENT.CATALOG_NUMBERS(unitId);
    let params = new HttpParams();
    if (productType) {
      params = params.set('productType', productType);
    }
    if (productCode) {
      params = params.set('productCode', productCode);
    }

    return this.apiService.get<ApiResponse<CatalogNumberDto>>(endpoint, { params }).pipe(
      map(response => response.data || []),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Reject a component.
   * POST /api/reject-component/reject
   */
  rejectComponent(request: RejectComponentRequestDto): Observable<RejectComponentResponseDto> {
    const endpoint = API.REJECT_COMPONENT.REJECT;

    return this.apiService.post<RejectComponentResponseDto>(endpoint, request).pipe(
      map(response => {
        if (response.success) {
          return response;
        }
        throw new Error(response.errorResponse?.error || response.message || 'Rejection failed');
      }),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Reprint rejection label.
   * POST /api/v1/components-made-from-unit/reprint-label
   * Uses the existing CMFU reprint-label endpoint which generates label data.
   */
  validateProductCode(unitId: string, productCode: string): Observable<ValidateProductCodeResponseDto> {
    const endpoint = API.REJECT_COMPONENT.VALIDATE_PRODUCT(unitId, productCode);
    return this.apiService.get<ApiResponse<ValidateProductCodeResponseDto>>(endpoint).pipe(
      map(response => {
        if (response.data?.length > 0) return response.data[0];
        throw new Error('No product validation data returned');
      }),
      catchError(error => throwError(() => error))
    );
  }

  getAboLabels(codeScheme: string): Observable<AboLabelDto[]> {
    const endpoint = API.REJECT_COMPONENT.ABO_LABELS;
    let params = new HttpParams().set('codeScheme', codeScheme);

    return this.apiService.get<ApiResponse<AboLabelDto>>(endpoint, { params }).pipe(
      map(response => response.data || []),
      catchError(error => throwError(() => error))
    );
  }

  reprintLabel(request: ReprintLabelRequestDto): Observable<ReprintLabelResponseDto> {
    const endpoint = API.REJECT_COMPONENT.REPRINT_LABEL;

    return this.apiService.post<ApiResponse<ReprintLabelResponseDto>>(endpoint, request).pipe(
      map(response => {
        if (response.data?.length > 0) {
          return response.data[0];
        }
        throw new Error('No label data returned');
      }),
      catchError(error => throwError(() => error))
    );
  }
}
