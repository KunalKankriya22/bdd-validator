import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API } from '@core/constants/api.constants';
import { environment } from 'src/environments/environment';
import type {
  ApiResponse,
  SpecialDonationStatusQueryDto,
  SpecialDonationStatusResponseDto,
  SpecialUnitDto,
  ShipLocationLookupDto,
  PatientLookupDto,
  UnitIdLookupDto,
  SurgIdLookupDto,
} from '../models/special-donation-status.models';

/**
 * Service for Special Donation Status Query
 * Based on API documentation: SpecialDonationStatusQuery.md
 *
 * Endpoints:
 * - POST /special-donation-status/query - Query special donation status
 * - GET /special-donation-status/{unitId} - Get unit details by unit ID
 * - GET /special-donation-status/lookups/ship-locations - Get ship locations
 * - GET /special-donation-status/lookups/patients - Get patients
 * - GET /special-donation-status/lookups/unit-ids - Get unit IDs
 * - GET /special-donation-status/lookups/surg-ids - Get surgery IDs
 */
@Injectable({
  providedIn: 'root',
})
export class SpecialDonationStatusService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  /**
   * Query special donation status based on search criteria
   * @param query Search criteria
   * @returns Observable of SpecialDonationStatusResponseDto
   */
  querySpecialDonationStatus(
    query: SpecialDonationStatusQueryDto
  ): Observable<SpecialDonationStatusResponseDto> {
    return this.http.post<ApiResponse<SpecialDonationStatusResponseDto[]>>(
      `${this.baseUrl}${API.SPECIAL_DONATION_STATUS.QUERY}`,
      query
    ).pipe(
      map(response => response.data?.[0] || { specialUnits: [], totalRecordsFound: 0 })
    );
  }

  /**
   * Get detailed unit information by unit ID
   * @param unitId Unit ID (base, without check digit)
   * @returns Observable of SpecialUnitDto
   */
  getUnitDetails(unitId: string): Observable<SpecialUnitDto> {
    return this.http.get<ApiResponse<SpecialUnitDto>>(
      `${this.baseUrl}${API.SPECIAL_DONATION_STATUS.GET_UNIT_DETAILS(unitId)}`
    ).pipe(
      map(response => response.data)
    );
  }

  /**
   * Get ship locations for dropdown with optional search term
   * @param searchTerm Optional partial match search on ship ID or description
   * @returns Observable of ship locations array
   */
  getShipLocationsLookup(searchTerm?: string): Observable<ShipLocationLookupDto[]> {
    let params = new HttpParams();
    if (searchTerm) {
      params = params.set('searchTerm', searchTerm);
    }

    return this.http.get<ApiResponse<ShipLocationLookupDto[]>>(
      `${this.baseUrl}${API.SPECIAL_DONATION_STATUS.LOOKUPS.SHIP_LOCATIONS}`,
      { params }
    ).pipe(
      map(response => response.data || [])
    );
  }

  /**
   * Get patients for dropdown with optional search term
   * Gap Analysis Fix #2: Added date filtering
   * @param fromDate Optional from date filter (YYYY-MM-DD format)
   * @param toDate Optional to date filter (YYYY-MM-DD format)
   * @param searchTerm Optional partial match search on patient ID or name
   * @returns Observable of patients array
   */
  getPatientsLookup(fromDate?: string, toDate?: string, searchTerm?: string): Observable<PatientLookupDto[]> {
    let params = new HttpParams();
    if (fromDate) {
      params = params.set('fromDate', fromDate);
    }
    if (toDate) {
      params = params.set('toDate', toDate);
    }
    if (searchTerm) {
      params = params.set('searchTerm', searchTerm);
    }

    return this.http.get<ApiResponse<PatientLookupDto[]>>(
      `${this.baseUrl}${API.SPECIAL_DONATION_STATUS.LOOKUPS.PATIENTS}`,
      { params }
    ).pipe(
      map(response => response.data || [])
    );
  }

  /**
   * Get unit IDs for dropdown with optional search term
   * Gap Analysis Fix #3: Added date and patient filtering
   * @param fromDate Optional from date filter (YYYY-MM-DD format)
   * @param toDate Optional to date filter (YYYY-MM-DD format)
   * @param patId Optional patient ID filter
   * @param searchTerm Optional partial match search on unit ID
   * @returns Observable of unit IDs array
   */
  getUnitIdsLookup(fromDate?: string, toDate?: string, patId?: string, searchTerm?: string): Observable<UnitIdLookupDto[]> {
    let params = new HttpParams();
    if (fromDate) {
      params = params.set('fromDate', fromDate);
    }
    if (toDate) {
      params = params.set('toDate', toDate);
    }
    if (patId) {
      params = params.set('patId', patId);
    }
    if (searchTerm) {
      params = params.set('searchTerm', searchTerm);
    }

    return this.http.get<ApiResponse<UnitIdLookupDto[]>>(
      `${this.baseUrl}${API.SPECIAL_DONATION_STATUS.LOOKUPS.UNIT_IDS}`,
      { params }
    ).pipe(
      map(response => response.data || [])
    );
  }

  /**
   * Get surgery IDs for dropdown with optional search term
   * Gap Analysis Fix #4: Added patient filtering
   * @param patId Optional patient ID filter
   * @param searchTerm Optional partial match search on surgery ID
   * @returns Observable of surgery IDs array
   */
  getSurgIdsLookup(patId?: string, searchTerm?: string): Observable<SurgIdLookupDto[]> {
    let params = new HttpParams();
    if (patId) {
      params = params.set('patId', patId);
    }
    if (searchTerm) {
      params = params.set('searchTerm', searchTerm);
    }

    return this.http.get<ApiResponse<SurgIdLookupDto[]>>(
      `${this.baseUrl}${API.SPECIAL_DONATION_STATUS.LOOKUPS.SURG_IDS}`,
      { params }
    ).pipe(
      map(response => response.data || [])
    );
  }
}
