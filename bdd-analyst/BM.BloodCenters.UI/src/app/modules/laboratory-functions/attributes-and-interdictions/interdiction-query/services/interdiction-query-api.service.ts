import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../../../environments/environment';
import { API } from '@core/constants/api.constants';
import {
  InterdictionQueryRequest,
  InterdictionQueryResponse,
  ProductCodeOption,
  ApiResponse
} from '../models/interdiction-query.model';

/**
 * API Service for Laboratory Interdiction Query operations (CPQINTAL / LINTQ)
 *
 * This is a READ-ONLY query service that retrieves:
 * - Unit Interdictions
 * - Component Interdictions
 * - Unit Attributes
 * - Component Attributes
 *
 * Based on Jira ticket MLT-13080
 */
@Injectable({
  providedIn: 'root'
})
export class InterdictionQueryApiService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Query interdictions and attributes for a unit
   *
   * POST /interdiction-query
   *
   * @param request Query parameters (unitId required, productCode optional, collectionDate optional)
   * @returns Observable of all interdictions and attributes
   *
   * Request Body (InterdictionQueryRequestDto):
   * - UnitId: Unit identifier (required, 12-13 characters with check digit)
   * - ProductCode: Product code filter (optional, filters component data)
   * - CollectionDate: Collection date filter (optional, uses current date if null)
   *
   * Response (InterdictionQueryResponseDto):
   * - UnitId: The queried unit ID
   * - CollectionDate: Collection date used for the query
   * - IsArchived: Whether the unit is archived
   * - UnitInterdictions: Array of unit-level interdictions
   * - ComponentInterdictions: Array of component-level interdictions
   * - UnitAttributes: Array of unit-level attributes
   * - ComponentAttributes: Array of component-level attributes
   *
   * Backend validates:
   * - Request body is present
   * - Chapter ID is in user context
   * - Unit ID is valid
   * - Product code is valid (if provided)
   */
  queryInterdictions(request: InterdictionQueryRequest): Observable<InterdictionQueryResponse> {
    const body = {
      unitId: request.unitId,
      productCode: request.productCode || null,
      collectionDate: request.collectionDate ?? null
    };

    return this.http.post<ApiResponse<InterdictionQueryResponse>>(
      `${this.baseUrl}${API.LAB_INTERDICTION_QUERY.QUERY}`,
      body
    ).pipe(
      map(response => {
        if (!response.success || (!response.data && !response.item)) {
          throw new Error(response.message || 'Failed to load interdiction data');
        }
        return response.data || response.item!;
      }),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Get valid product codes for a unit
   *
   * Shared endpoint used across multiple Laboratory screens:
   * - Enter Component Attributes (Attributes & Interdictions)
   * - Enter Component Attributes (Component Production)
   * - Interdiction Query
   *
   * GET /api/v1/component-attributes/products/{unitId}/{collDate}?codeScheme=I
   *
   * @param unitId Unit identifier (12-13 characters with check digit)
   * @param collDate Collection date (ISO format or date string)
   * @returns Observable of product code options with descriptions
   */
  getProductsForUnit(unitId: string, collDate: string): Observable<ProductCodeOption[]> {
    // Default to ISBT code scheme ('I')
    // Backend removed code scheme filter per MLT-13081 to support all schemes
    const codeScheme = 'I';

    // Format date as ISO datetime if not already formatted
    const dateTime = collDate.includes('T') ? collDate : `${collDate}T00:00:00`;

    const url = API.LAB_INTERDICTION_QUERY.GET_PRODUCTS(unitId, dateTime, codeScheme);

    return this.http.get<ApiResponse<ProductCodeOption[]>>(url).pipe(
      map(response => {
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Failed to load product codes');
        }
        return response.data;
      }),
      catchError(error => throwError(() => error))
    );
  }
}
