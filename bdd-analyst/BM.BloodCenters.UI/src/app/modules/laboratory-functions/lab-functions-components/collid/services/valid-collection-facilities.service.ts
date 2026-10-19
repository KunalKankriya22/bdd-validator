import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { environment } from '../../../../../../environments/environment';
import { API } from '@core/constants/api.constants';
import {
  ValidCollectionFacilityDto,
  ValidCollectionFacilityResponse,
  ValidCollectionFacilitiesListResponse,
  ValidCollectionFacilityQueryDto,
  CreateValidCollectionFacilityRequestDto,
  UpdateValidCollectionFacilityRequestDto,
  CreateValidCollectionFacilityResponseDto,
  StandardApiResponse,
  ContractOption,
  StateOption,
  CountryOption,
} from '../models/valid-collection-facilities.model';

/**
 * Service for Valid Collection Facilities API operations
 * Base URL: /api/valid-collection-facilities
 * JIRA Ticket: MLT-12657
 */
@Injectable({
  providedIn: 'root',
})
export class ValidCollectionFacilitiesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}${API.LABORATORY.VALID_COLLECTION_FACILITIES.BASE}`;

  /**
   * Get paginated list of valid collection facilities with optional filtering
   * Endpoint: POST /api/valid-collection-facilities/{take}/{skip}
   *
   * @param take Number of records to return (max 100)
   * @param skip Number of records to skip for pagination
   * @param filters Optional query filters
   * @returns Observable of paginated facility list
   */
  getValidCollectionFacilities(
    take: number,
    skip: number,
    filters?: ValidCollectionFacilityQueryDto
  ): Observable<ValidCollectionFacilitiesListResponse> {
    const url = `${this.baseUrl}/${take}/${skip}`;
    const body = filters || {};

    return this.http.post<ValidCollectionFacilitiesListResponse>(url, body);
  }

  /**
   * Get a single valid collection facility by composite key
   * Endpoint: GET /api/valid-collection-facilities/{chapterId}/{contractId}/{collId}
   *
   * @param chapterId Chapter identifier (4 chars)
   * @param contractId Contract identifier (9 chars)
   * @param collId Collection ID (5 chars)
   * @returns Observable of single facility record
   */
  getValidCollectionFacilityById(
    chapterId: string,
    contractId: string,
    collId: string
  ): Observable<ValidCollectionFacilityDto> {
    const url = `${this.baseUrl}/${encodeURIComponent(chapterId)}/${encodeURIComponent(
      contractId
    )}/${encodeURIComponent(collId)}`;

    return this.http.get<ValidCollectionFacilityResponse>(url).pipe(map((response) => response.data));
  }

  /**
   * Create a new valid collection facility
   * Endpoint: POST /api/valid-collection-facilities
   *
   * @param facility Facility data to create
   * @returns Observable of create response with composite key
   */
  createValidCollectionFacility(
    facility: CreateValidCollectionFacilityRequestDto
  ): Observable<CreateValidCollectionFacilityResponseDto> {
    return this.http.post<CreateValidCollectionFacilityResponseDto>(this.baseUrl, facility);
  }

  /**
   * Update an existing valid collection facility
   * Endpoint: PUT /api/valid-collection-facilities/{chapterId}/{contractId}/{collId}
   *
   * @param chapterId Chapter identifier
   * @param contractId Contract identifier
   * @param collId Collection ID
   * @param facility Updated facility data
   * @returns Observable of standard API response
   */
  updateValidCollectionFacility(
    chapterId: string,
    contractId: string,
    collId: string,
    facility: UpdateValidCollectionFacilityRequestDto
  ): Observable<StandardApiResponse> {
    const url = `${this.baseUrl}/${encodeURIComponent(chapterId)}/${encodeURIComponent(
      contractId
    )}/${encodeURIComponent(collId)}`;

    return this.http.put<StandardApiResponse>(url, facility);
  }

  /**
   * Soft delete a valid collection facility (sets TERM_DATE to current date)
   * Endpoint: DELETE /api/valid-collection-facilities/{chapterId}/{contractId}/{collId}
   *
   * @param chapterId Chapter identifier
   * @param contractId Contract identifier
   * @param collId Collection ID
   * @returns Observable of standard API response
   */
  deleteValidCollectionFacility(
    chapterId: string,
    contractId: string,
    collId: string
  ): Observable<StandardApiResponse> {
    const url = `${this.baseUrl}/${encodeURIComponent(chapterId)}/${encodeURIComponent(
      contractId
    )}/${encodeURIComponent(collId)}`;

    return this.http.delete<StandardApiResponse>(url);
  }

  /**
   * Check if a Collection ID is associated with other contracts
   * This method queries the facility list filtered by collId to find associations
   *
   * @param chapterId Current chapter ID
   * @param collId Collection ID to check
   * @param excludeContractId Contract ID to exclude from results (current contract)
   * @returns Observable of associated facilities
   */
  checkCollectionIdAssociations(
    chapterId: string,
    collId: string,
    excludeContractId?: string
  ): Observable<ValidCollectionFacilityDto[]> {
    const filters: ValidCollectionFacilityQueryDto = {
      chapterId,
      collId,
    };

    return this.getValidCollectionFacilities(100, 0, filters).pipe(
      map((response) => {
        // Filter out the current contract if provided
        if (excludeContractId) {
          return response.data.filter((facility) => facility.contractId !== excludeContractId);
        }
        return response.data;
      })
    );
  }

  // ============================================================================
  // Lookup/Dropdown Data Methods
  // ============================================================================

  /**
   * Get active contracts for the chapter (dropdown)
   * Endpoint: GET /api/valid-collection-facilities/contracts
   */
  getContractOptions(chapterId: string): Observable<ContractOption[]> {
    const url = `${environment.apiUrl}${API.LABORATORY.VALID_COLLECTION_FACILITIES.CONTRACTS}`;

    return this.http.get<any>(url).pipe(
      map((response: any) => {
        const data = Array.isArray(response) ? response : response.data || [];
        return data.map((c: any) => ({
          contractId: c.contractId,
          contractName: c.contractName || c.company || '',
          contractType: c.contractType || '',
          contractTypeDesc: c.codeDesc || c.contractTypeDesc || c.contractTypeName || '',
        }));
      }),
      catchError((error) => {
        console.error('Error fetching contracts:', error);
        return of([]);
      })
    );
  }

  /**
   * Get available collection IDs for a specific contract
   * Uses the POST endpoint to filter by contractId
   *
   * @param chapterId Chapter ID
   * @param contractId Contract ID to filter by
   * @returns Observable of collection ID options
   */
  getCollectionIdOptions(chapterId: string, contractId: string): Observable<ValidCollectionFacilityDto[]> {
    const filters: ValidCollectionFacilityQueryDto = {
      chapterId,
      contractId,
    };

    return this.getValidCollectionFacilities(100, 0, filters).pipe(map((response) => response.data));
  }

  /**
   * Get available states for dropdown
   * GAP FIX: Connect to existing states lookup API endpoint
   *
   * @returns Observable of state options
   */
  getStateOptions(): Observable<StateOption[]> {
    // GAP FIX: Use existing states lookup from API.CHAPTER.STATES_LOOKUP
    const url = `${environment.apiUrl}${API.CHAPTER.STATES_LOOKUP}`;

    return this.http.get<any[]>(url).pipe(
      map((response: any) => {
        // Handle both array response and wrapped response { data: [] }
        const data = Array.isArray(response) ? response : response.data || [];
        return data.map((s: any) => ({
          code: s.code || s.stateCode || s.state,
          description: s.description || s.stateName || s.name || s.code
        }));
      }),
      catchError((error) => {
        console.error('Error fetching states:', error);
        return of([]);
      })
    );
  }

  /**
   * GAP FIX: Get facility by license number for auto-population
   * Used to auto-populate license address fields when a license number is entered
   *
   * @param chapterId Chapter ID
   * @param licenceNo License number to search for
   * @returns Observable of matching facility (first match) or null
   */
  getByLicenceNo(chapterId: string, licenceNo: string): Observable<ValidCollectionFacilityDto | null> {
    if (!licenceNo) {
      return of(null);
    }

    const filters: ValidCollectionFacilityQueryDto = {
      chapterId,
      // Use searchKeyword to find records with this license number
      searchKeyword: licenceNo
    };

    return this.getValidCollectionFacilities(10, 0, filters).pipe(
      map((response) => {
        // Find first matching record with exact licence number match
        const match = response.data.find(f =>
          f.licenceNo?.toLowerCase() === licenceNo.toLowerCase()
        );
        return match || null;
      }),
      catchError((error) => {
        console.error('Error fetching facility by licence number:', error);
        return of(null);
      })
    );
  }

  getCountryOptions(): Observable<CountryOption[]> {
    const url = `${environment.apiUrl}/api/v1/chapters/countries/lookup`;

    return this.http.get<any[]>(url).pipe(
      map((response: any) => {
        const data = Array.isArray(response) ? response : response.data || [];
        return data.map((c: any) => ({
          code: c.code || c.country,
          description: c.description || c.countryName || c.code
        }));
      }),
      catchError((error) => {
        console.error('Error fetching countries:', error);
        return of([]);
      })
    );
  }
}
