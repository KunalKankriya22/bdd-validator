import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SKIP_ERROR_TOAST } from '@core/constants/http-context.constants';
import {
  UnitData,
  RetrieveComponentHoldsRequest,
  RetrieveComponentHoldsResponse,
  ReleaseHoldsRequest,
  ReleaseHoldsResponse,
  ProductOption
} from '../models/component-hold.model';
import { API } from '@core/constants/api.constants';

/**
 * API Service for Release Component Hold operations
 * MLT-13694: Release Component Hold functionality
 *
 * Backend Controller: ReleaseComponentHoldController.cs
 * FMB Module: CPICHOLD
 */
@Injectable({
  providedIn: 'root'
})
export class ComponentHoldApiService {
  private http = inject(HttpClient);

  /**
   * Validate Unit ID and retrieve collection date
   *
   * Maps to: POST /release-component-hold/validate-unit
   * Controller: ReleaseComponentHoldController.ValidateUnit
   * FMB Trigger: CTRL_BLK_2.UNIT_ID.VALIDATE_FIELD
   *
   * @param unitId - The unit ID to validate
   * @returns Observable<UnitData> - Unit validation data with collection date
   */
  validateUnit(unitId: string): Observable<UnitData> {
    return this.http.post<{
      success: boolean;
      message: string;
      statusCode: number;
      data: {
        unitId: string;
        collectionDate: string;
        chapterId: string;
        checkDigit: string | null;
      };
    }>(API.RELEASE_COMPONENT_HOLD.VALIDATE_UNIT, { unitId }).pipe(
      map(response => {
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Failed to validate unit');
        }

        // After validating unit, we need to get products with holds
        // This will be populated separately via getProductsWithHolds
        return {
          unitId: response.data.unitId,
          collectionDate: response.data.collectionDate,
          chapterId: response.data.chapterId, // Set from backend response
          availableProducts: [] // Will be populated by separate call
        };
      })
    );
  }

  /**
   * Get list of products with holds for a unit
   *
   * Maps to: POST /release-component-hold/products-with-holds
   * Controller: ReleaseComponentHoldController.GetProductsWithHolds
   * FMB: CTRL_BLK_2_PRODUCT_COD_LOV0 RecordGroup
   *
   * @param unitId - Unit ID
   * @param collectionDate - Collection date from validation
   * @returns Observable<ProductOption[]> - List of products with holds
   */
  getProductsWithHolds(unitId: string, collectionDate: string): Observable<ProductOption[]> {
    return this.http.post<{
      success: boolean;
      message: string;
      statusCode: number;
      data: Array<{
        productCode: string;
        productDesc: string;
      }>;
    }>(API.RELEASE_COMPONENT_HOLD.PRODUCTS_WITH_HOLDS, {
      unitId,
      collectionDate
    }).pipe(
      map(response => {
        if (!response.success || !response.data) {
          return [];
        }

        return response.data.map(p => ({
          productCode: p.productCode,
          productDescription: p.productDesc
        }));
      })
    );
  }

  /**
   * Retrieve component holds for a specific unit and product
   *
   * Maps to: POST /release-component-hold/holds
   * Controller: ReleaseComponentHoldController.GetHolds
   * FMB Block: COMPONENT_INTERDICTIONS query
   *
   * Note: chapterId is populated from user context by backend (not sent in request)
   *
   * @param request - Request containing unit ID, collection date, and product code
   * @returns Observable<RetrieveComponentHoldsResponse> - List of holds for the component
   */
  retrieveComponentHolds(request: RetrieveComponentHoldsRequest): Observable<RetrieveComponentHoldsResponse> {
    return this.http.post<{
      success: boolean;
      message: string;
      statusCode: number;
      data: Array<{
        interCode: string;
        interDesc: string;
      }>;
    }>(API.RELEASE_COMPONENT_HOLD.GET_HOLDS, {
      unitId: request.unitId,
      collectionDate: request.collectionDate,
      productCode: request.productCode,
      searchKeyword: request.searchKeyword
      // chapterId is NOT sent - backend gets it from user context
    }).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message || 'Failed to retrieve holds');
        }

        // Ensure data is always an array (handle null/undefined)
        const data = response.data || [];

        return {
          unitId: request.unitId,
          collectionDate: request.collectionDate,
          chapterId: request.chapterId,
          productCode: request.productCode,
          productDescription: '', // Not returned by backend - will be set from dropdown
          holds: data.map(h => ({
            interdictionCode: h.interCode,
            interdictionDescription: h.interDesc
          }))
        };
      })
    );
  }

  /**
   * Release selected holds from a component (DELETE operation)
   *
   * Maps to: DELETE /release-component-hold/release
   * Controller: ReleaseComponentHoldController.ReleaseHolds
   * FMB Trigger: KEY-COMMIT (DELETE from COMPONENT_INTERDICTIONS)
   *
   * @param request - Request containing unit info and selected interdiction codes to release
   * @returns Observable<ReleaseHoldsResponse> - Result of the release operation
   */
  releaseHolds(request: ReleaseHoldsRequest): Observable<ReleaseHoldsResponse> {
    return this.http.request<{
      success: boolean;
      message: string;
      statusCode: number;
      errorCode?: string;
      data: {
        holdsReleased: number;
      };
    }>('DELETE', API.RELEASE_COMPONENT_HOLD.RELEASE, {
      body: {
        unitId: request.unitId,
        collectionDate: request.collectionDate,
        productCode: request.productCode,
        interCodes: request.interdictionCodes
      },
      context: new HttpContext().set(SKIP_ERROR_TOAST, true) // Skip interceptor error toast
    }).pipe(
      map(response => {
        if (!response.success) {
          // Create error object with both errorCode and message
          const error: any = new Error(response.message || 'Failed to release holds');
          error.errorCode = response.errorCode;
          throw error;
        }

        // Success case - return clean response without error codes
        return {
          success: true,
          message: 'Hold(s) released successfully', // Use clean success message, ignore backend message/errorCode
          releasedCount: response.data.holdsReleased
        };
      })
    );
  }
}
