import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  InterdictionQueryParams,
  InterdictionQueryResponse,
  InterdictionCode,
  InterdictionType,
  DonationType,
  MultipleInterdictionItem,
  DonorInfo,
  LovResponse,
  OtherHoldsRequest,
  OtherHoldsResult,
  DonorAddressResult,
} from '../models/interdiction-query.model';

/**
 * Service for Query by Interdictions & Holds functionality
 * Handles all API interactions for interdiction/hold queries
 *
 * Based on Oracle Forms DPQUTINT procedures:
 * - POPULATE_DON_CURSOR
 * - QUERY_VALID_INTERDICTIONS
 * - POPULATE_SELECTION
 */
@Injectable({
  providedIn: 'root',
})
export class InterdictionQueryService {
  private apiService = inject(ApiService);

  /**
   * Query interdictions/holds based on filter criteria
   * Queries both donor_interdictions and donation_interdictions tables
   * Maps to POST /api/v1/donor-interdictions/search
   *
   * @param params Query parameters including filters and user context
   * @returns Observable of query results
   */
  queryInterdictions(
    params: InterdictionQueryParams
  ): Observable<InterdictionQueryResponse> {
    return this.apiService
      .post<any>(API.DONOR_FUNCTIONS.QUERY_INTERDICTIONS_HOLDS.SEARCH, params)
      .pipe(
        map((response) => {
          // API returns ReturnResult<InterdictionQuerySearchResponseDto>
          // Response structure: { success, message, statusCode, item: { results, operation, totalRecords } }
          const data = response.item || response.data || response.Data;
          const results = data?.results || data?.Results || [];
          const totalRecords = data?.totalRecords || data?.TotalRecords || 0;
          const operation = data?.operation || data?.Operation || '-';

          console.log('[InterdictionQueryService] API Response:', response);
          console.log('[InterdictionQueryService] Parsed results:', results.length, 'records');

          if (totalRecords > 700) {
            console.warn(
              `Query returned ${totalRecords} records, exceeding limit of 700`
            );
          }

          return {
            success: response.success ?? response.Success ?? true,
            message: response.message || response.Message,
            totalRecords: totalRecords,
            results: results,
            data: {
              results: results,
              operation: operation,
              totalRecords: totalRecords
            }
          };
        }),
        catchError((error) => {
          console.error('Error querying interdictions:', error);
          return of({
            success: false,
            message: error.message || 'Failed to query interdictions',
            totalRecords: 0,
            results: []
          });
        })
      );
  }

  /**
   * Query donor-level interdictions/holds
   * Queries DONOR_INTERDICTIONS table only (not donation-level)
   * Maps to POST /api/v1/donor-interdictions/search-donors
   * Based on Oracle Forms DPQDINTR (Query Donors by Interdiction Code)
   *
   * @param params Query parameters including filters and user context
   * @returns Observable of donor query results
   */
  queryDonorInterdictions(
    params: InterdictionQueryParams
  ): Observable<InterdictionQueryResponse> {
    return this.apiService
      .post<any>(API.DONOR_FUNCTIONS.QUERY_INTERDICTIONS_HOLDS.SEARCH_DONORS, params)
      .pipe(
        map((response) => {
          const data = response.item || response.data || response.Data;
          const results = data?.results || data?.Results || [];
          const totalRecords = data?.totalRecords || data?.TotalRecords || 0;
          const operation = data?.operation || data?.Operation || '-';

          console.log('[InterdictionQueryService] Donor Query API Response:', response);
          console.log('[InterdictionQueryService] Donor records:', results.length);

          if (totalRecords > 700) {
            console.warn(
              `Donor query returned ${totalRecords} records, exceeding limit of 700`
            );
          }

          return {
            success: response.success ?? response.Success ?? true,
            message: response.message || response.Message,
            totalRecords: totalRecords,
            results: results,
            data: {
              results: results,
              operation: operation,
              totalRecords: totalRecords
            }
          };
        }),
        catchError((error) => {
          console.error('Error querying donor interdictions:', error);
          return of({
            success: false,
            message: error.message || 'Failed to query donor interdictions',
            totalRecords: 0,
            results: []
          });
        })
      );
  }

  /**
   * Get valid interdiction codes for LOV (List of Values)
   * Filters based on user access permissions
   * Maps to GET /api/v1/donor-interdictions/lookups/inter-codes
   *
   * @returns Observable of valid interdiction codes
   */
  getValidInterdictionCodes(): Observable<LovResponse<InterdictionCode>> {
    const endpoint = API.DONOR_FUNCTIONS.QUERY_INTERDICTIONS_HOLDS.INTER_CODES_LOOKUP;

    console.log('[InterdictionQueryService] Calling API:', endpoint);

    return this.apiService
      .get<LovResponse<InterdictionCode>>(endpoint)
      .pipe(
        map((response) => {
          console.log('[InterdictionQueryService] API response:', response);
          return response;
        }),
        catchError((error) => {
          console.error('[InterdictionQueryService] Error fetching valid interdiction codes:', error);
          return of({ data: [], success: false, message: error.message });
        })
      );
  }

  /**
   * Get interdiction codes filtered by option type (Interdiction, Hold, or Release)
   * Calls GET /api/v1/donor-interdictions/lookups/inter-codes?option={option}
   * Backend: InterdictionQueryController.GetInterCodesLookupAsync (line 114-146)
   *
   * @param option - The option type: 'Interdiction', 'Hold', or 'Release'
   * @param interType - Optional interdiction type filter
   * @returns Observable of interdiction codes
   */
  getInterdictionCodes(option: string, interType?: string): Observable<InterdictionCode[]> {
    const endpoint = API.DONOR_FUNCTIONS.QUERY_INTERDICTIONS_HOLDS.INTER_CODES_LOOKUP;

    let httpParams = new HttpParams().set('option', option);
    if (interType) {
      httpParams = httpParams.set('interType', interType);
    }

    console.log('[InterdictionQueryService] Fetching interdiction codes for option:', option, 'interType:', interType);

    return this.apiService
      .get<LovResponse<InterdictionCode>>(endpoint, { params: httpParams })
      .pipe(
        map((response) => {
          console.log('[InterdictionQueryService] Interdiction codes response:', response);
          return response.data || [];
        }),
        catchError((error) => {
          console.error('[InterdictionQueryService] Error fetching interdiction codes:', error);
          return of([]);
        })
      );
  }

  /**
   * Get valid interdiction types for LOV
   * Used in multiple interdiction selection dialog
   * Maps to GET /api/v1/donor-interdictions/lookups/inter-types
   *
   * @returns Observable of valid interdiction types
   */
  getValidInterdictionTypes(): Observable<LovResponse<InterdictionType>> {
    return this.apiService
      .get<LovResponse<InterdictionType>>(
        API.DONOR_FUNCTIONS.QUERY_INTERDICTIONS_HOLDS.INTER_TYPES_LOOKUP
      )
      .pipe(
        catchError((error) => {
          console.error('Error fetching valid interdiction types:', error);
          return of({ data: [], success: false, message: error.message });
        })
      );
  }

  /**
   * Get valid donation types for filter LOV
   * Maps to POST /api/v1/donor-interdictions/lookups/donation-types
   * Requires query context to return relevant donation types
   * Accepts same request body as search endpoint
   *
   * @param params Full query parameters (same as search endpoint)
   * @returns Observable of valid donation types
   */
  getValidDonationTypes(params: InterdictionQueryParams): Observable<LovResponse<DonationType>> {
    return this.apiService
      .post<LovResponse<DonationType>>(
        API.DONOR_FUNCTIONS.QUERY_INTERDICTIONS_HOLDS.DONATION_TYPES_LOOKUP,
        params
      )
      .pipe(
        map((response) => {
          console.log('[InterdictionQueryService] Donation types response:', response);
          return response;
        }),
        catchError((error) => {
          console.error('[InterdictionQueryService] Error fetching valid donation types:', error);
          return of({ data: [], success: false, message: error.message });
        })
      );
  }

  /**
   * Get interdiction codes filtered by interdiction type
   * Used in multi-select interdictions dialog RETRIEVE operation
   * Maps to Oracle Forms QUERY_VALID_INTERDICTIONS procedure
   * Calls GET /api/v1/donor-interdictions/lookups/inter-codes?type={interType}&description={description}
   *
   * @param interType - Interdiction type code (e.g., 'INTER', 'HOLD')
   * @param description - Optional description filter (partial match)
   * @returns Observable of interdiction codes
   */
  getInterdictionCodesByType(
    interType: string,
    description?: string
  ): Observable<InterdictionCode[]> {
    const endpoint = API.DONOR_FUNCTIONS.QUERY_INTERDICTIONS_HOLDS.INTER_CODES_LOOKUP;

    let httpParams = new HttpParams().set('interType', interType);
    if (description) {
      httpParams = httpParams.set('description', description);
    }

    console.log('[InterdictionQueryService] Fetching codes by type:', interType, 'description:', description);

    return this.apiService
      .get<LovResponse<InterdictionCode>>(endpoint, { params: httpParams })
      .pipe(
        map((response) => {
          console.log('[InterdictionQueryService] Codes by type response:', response);
          return response.data || [];
        }),
        catchError((error) => {
          console.error('[InterdictionQueryService] Error fetching codes by type:', error);
          return of([]);
        })
      );
  }

  /**
   * Get interdictions available for multiple selection
   * Uses the inter-codes lookup and converts to MultipleInterdictionItem format
   *
   * @returns Observable of available interdictions
   */
  getMultipleSelectionInterdictions(): Observable<LovResponse<MultipleInterdictionItem>> {
    return this.getValidInterdictionCodes().pipe(
      map((response) => {
        if (response.success && response.data) {
          const items: MultipleInterdictionItem[] = response.data.map((code) => ({
            interCode: code.code,
            description: code.description,
            type: '',
            effDate: new Date(),
            termDate: null,
            selected: false,
          }));
          return {
            ...response,
            data: items,
          };
        }
        return {
          data: [],
          success: false,
          message: response.message || 'Failed to fetch interdiction codes',
        };
      }),
      catchError((error) => {
        console.error('Error fetching multiple selection interdictions:', error);
        return of({ data: [], success: false, message: error.message });
      })
    );
  }

  /**
   * Get donor information by donor ID
   * Used for "Donor Information" context menu action
   *
   * @param donorId Donor ID to fetch
   * @returns Observable of donor information
   */
  getDonorInfo(donorId: string): Observable<DonorInfo | null> {
    return this.apiService
      .get<DonorInfo>(API.DONOR_FUNCTIONS.QUERY_INTERDICTIONS_HOLDS.DONOR_INFO(donorId))
      .pipe(
        catchError((error) => {
          console.error('Error fetching donor info:', error);
          return of(null);
        })
      );
  }

  /**
   * Get other holds for a specific transaction
   * Maps to POST /api/v1/donor-interdictions/other-holds
   */
  getOtherHolds(request: OtherHoldsRequest): Observable<OtherHoldsResult[]> {
    return this.apiService
      .post<any>(API.DONOR_FUNCTIONS.QUERY_INTERDICTIONS_HOLDS.OTHER_HOLDS, request)
      .pipe(
        map((response) => response.data || []),
        catchError((error) => {
          console.error('[InterdictionQueryService] Error fetching other holds:', error);
          return of([]);
        })
      );
  }

  /**
   * Get donor address details
   * Maps to GET /api/v1/donor-interdictions/donor-address/{donorId}
   */
  getDonorAddress(donorId: string): Observable<DonorAddressResult | null> {
    return this.apiService
      .get<any>(API.DONOR_FUNCTIONS.QUERY_INTERDICTIONS_HOLDS.DONOR_ADDRESS(donorId))
      .pipe(
        map((response) => response.item || null),
        catchError((error) => {
          console.error('[InterdictionQueryService] Error fetching donor address:', error);
          return of(null);
        })
      );
  }

}
