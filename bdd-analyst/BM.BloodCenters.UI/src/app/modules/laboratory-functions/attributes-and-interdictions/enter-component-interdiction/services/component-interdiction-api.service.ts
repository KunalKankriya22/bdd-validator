import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../../../environments/environment';
import { API } from '@core/constants/api.constants';
import {
  ValidateUnitRequest,
  ValidateUnitResponse,
  ValidateProductRequest,
  ValidateProductResponse,
  InterdictionOption,
  CreateComponentInterdictionRequest,
  ComponentInterdictionDto,
  ApiResponse
} from '../models/component-interdiction.model';

/**
 * API Service for Component Interdiction operations
 *
 * Provides methods to:
 * - Validate unit IDs (barcode or manual entry)
 * - Validate product codes (barcode or manual entry)
 * - Get valid interdiction codes for a component
 * - Create new component interdictions
 */
@Injectable({
  providedIn: 'root'
})
export class ComponentInterdictionApiService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Validate a scanned or manually entered unit ID
   *
   * POST /component-interdiction/validate-unit
   *
   * @param request Unit validation request
   * @returns Observable of validated unit response
   *
   * Error Codes:
   * - 0063: Unit not found
   * - 0230: Invalid request (missing required fields)
   */
  validateUnit(request: ValidateUnitRequest): Observable<ValidateUnitResponse> {
    return this.http.post<ApiResponse<ValidateUnitResponse>>(
      `${this.baseUrl}${API.COMPONENT_INTERDICTION.VALIDATE_UNIT}`,
      request
    ).pipe(
      map(response => {
        if (!response.success || !response.item) {
          throw new Error(response.message || 'Unit validation failed');
        }
        return response.item;
      }),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Validate a scanned or manually entered product code
   *
   * POST /component-interdiction/validate-product
   *
   * @param request Product validation request
   * @returns Observable of validated product response
   *
   * Error Codes:
   * - 1205: Invalid product code for this unit
   * - 0230: Invalid request (missing required fields)
   */
  validateProduct(request: ValidateProductRequest): Observable<ValidateProductResponse> {
    return this.http.post<ApiResponse<ValidateProductResponse>>(
      `${this.baseUrl}${API.COMPONENT_INTERDICTION.VALIDATE_PRODUCT}`,
      request
    ).pipe(
      map(response => {
        if (!response.success || !response.item) {
          throw new Error(response.message || 'Product validation failed');
        }
        return response.item;
      }),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Get list of valid product codes for a unit
   *
   * GET /api/v1/component-interdiction/valid-products
   *
   * @param unitId Unit identifier
   * @param collectionDate Collection date (ISO 8601)
   * @param barcodeScheme Barcode scheme ("Codabar" or "Code128")
   * @returns Observable of array of product options
   *
   * Response format:
   * {
   *   productCode: "E0350",
   *   productDescription: "RBC LEUKOCYTES REDUCED"
   * }
   */
  getValidProducts(
    unitId: string,
    collectionDate: string,
    barcodeScheme: string
  ): Observable<Array<{productCode: string; productDescription: string}>> {
    const params = new HttpParams()
      .set('unitId', unitId)
      .set('collectionDate', collectionDate)
      .set('barcodeScheme', barcodeScheme);

    return this.http.get<ApiResponse<Array<{productCode: string; productDescription: string}>>>(
      `${this.baseUrl}${API.COMPONENT_INTERDICTION.GET_PRODUCTS}`,
      { params }
    ).pipe(
      map(response => {
        if (!response.success || (!response.data && !response.item)) {
          throw new Error(response.message || 'Failed to load product codes');
        }
        return response.data || response.item || [];
      }),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Get list of valid interdiction codes for a specific component
   *
   * GET /component-interdiction/valid-interdictions
   *
   * Filtered by:
   * - User authorization (USER_INTERDICTION_CLASS)
   * - Interdiction type ('N' or 'H' only)
   * - Effective date range
   * - Not already applied to this component
   *
   * @param unitId Unit identifier
   * @param collectionDate Collection date (ISO 8601)
   * @param productCode Product code
   * @returns Observable of array of valid interdiction options
   *
   * Error Codes:
   * - 400: Missing required parameters
   * - 401: User ID not found in context
   */
  getValidInterdictions(
    unitId: string,
    collectionDate: string,
    productCode: string
  ): Observable<InterdictionOption[]> {
    const params = new HttpParams()
      .set('unitId', unitId)
      .set('collectionDate', collectionDate)
      .set('productCode', productCode);

    return this.http.get<ApiResponse<InterdictionOption[]>>(
      `${this.baseUrl}${API.COMPONENT_INTERDICTION.VALID_INTERDICTIONS}`,
      { params }
    ).pipe(
      map(response => {
        if (!response.success || (!response.data && !response.item)) {
          throw new Error(response.message || 'Failed to load interdiction codes');
        }
        return response.data || response.item || [];
      }),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Get existing interdictions for a specific unit
   *
   * GET /api/v1/component-interdiction?unitId={unitId}
   *
   * @param unitId Unit identifier
   * @returns Observable of array of component interdictions
   *
   * Response format:
   * {
   *   unitId: "W123417070471-F",
   *   productCode: "E0385V00",
   *   productDescription: "RED BLOOD CELLS AS/4",
   *   interdictionCode: "Hold",
   *   interdictionDescription: "Quarantine Until Resolved",
   *   interdictionType: "Hold"
   * }
   */
  getInterdictionsByUnit(unitId: string): Observable<ComponentInterdictionDto[]> {
    const params = new HttpParams().set('unitId', unitId);

    return this.http.get<ApiResponse<ComponentInterdictionDto[]>>(
      `${this.baseUrl}${API.COMPONENT_INTERDICTION.GET_BY_UNIT}`,
      { params }
    ).pipe(
      map(response => {
        if (!response.success || (!response.data && !response.item)) {
          throw new Error(response.message || 'Failed to load interdictions');
        }
        return response.data || response.item || [];
      }),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Create a new component interdiction
   *
   * POST /component-interdiction
   *
   * @param request Create interdiction request
   * @returns Observable of created interdiction DTO
   *
   * Success Code:
   * - 8010: Record successfully added
   *
   * Error Codes:
   * - 0063: Unit not found
   * - 0230: Record not saved (validation failed)
   * - 1185: Invalid interdiction code (inactive, already applied, or not authorized)
   * - 409: Conflict (duplicate record)
   */
  createInterdiction(request: CreateComponentInterdictionRequest): Observable<ComponentInterdictionDto> {
    return this.http.post<ApiResponse<ComponentInterdictionDto>>(
      `${this.baseUrl}${API.COMPONENT_INTERDICTION.CREATE}`,
      request
    ).pipe(
      map(response => {
        if (!response.success || !response.item) {
          throw new Error(response.message || 'Failed to create interdiction');
        }
        return response.item;
      }),
      catchError(error => throwError(() => error))
    );
  }
}
