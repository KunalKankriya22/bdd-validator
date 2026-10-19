import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { HttpParams } from '@angular/common/http';
import {
  DriveLocation,
  DriveLocationSearchParams,
  DriveLocationResponse
} from '../models/maintain-drive-location.model';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';

@Injectable({
  providedIn: 'root'
})
export class MaintainDriveLocationService {
  private readonly apiService = inject(ApiService);

  /**
   * Search drive locations with pagination, sorting, and filtering
   * POST /api/v1/drive-locations/search/{take}/{skip}
   * @param take - Number of records to fetch
   * @param skip - Number of records to skip
   * @param params - Search and filter parameters
   * @returns Observable with drive locations and total count
   */
  searchDriveLocations(
    take: number,
    skip: number,
    params: DriveLocationSearchParams
  ): Observable<{ data: DriveLocation[]; totalRecords: number }> {
    const endpoint = API.RECRUITMENT.MAINTAIN_DRIVE_LOCATION.SEARCH(take, skip);

    return this.apiService.post<DriveLocationResponse>(endpoint, params).pipe(
      map(response => ({
        data: response.data || [],
        totalRecords: response.total || 0
      })),
      catchError(error => {
        console.error('Error fetching drive locations:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get drive location details by location ID and chapter ID
   * GET /api/v1/drive-locations/{locationId}/{chapterId}
   * @param locationId - Location ID
   * @param chapterId - Chapter ID
   * @returns Observable with drive location details including address and notes
   */
  getDriveLocationDetails(locationId: string, chapterId: string): Observable<any> {
    const endpoint = API.RECRUITMENT.MAINTAIN_DRIVE_LOCATION.GET_DETAILS(locationId, chapterId);

    return this.apiService.get<any>(endpoint).pipe(
      map(response => response?.item || response),
      catchError(error => {
        console.error('Error fetching drive location details:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get notes for a location by location ID and chapter ID
   * GET /api/v1/drive-locations/{locationId}/{chapterId}/notes
   * @param locationId - Location ID
   * @param chapterId - Chapter ID
   * @returns Observable with notes array
   */
  getLocationNotes(locationId: string, chapterId: string): Observable<any[]> {
    const endpoint = API.RECRUITMENT.MAINTAIN_DRIVE_LOCATION.GET_NOTES(locationId, chapterId);

    return this.apiService.get<any>(endpoint).pipe(
      map(response => response?.item || []),
      catchError(error => {
        console.error('Error fetching location notes:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Add or update a drive location (upsert)
   * POST /api/v1/drive-locations/upsert
   * @param payload - Drive location data
   * @returns Observable with success response
   */
  upsertDriveLocation(payload: any): Observable<any> {
    const endpoint = API.RECRUITMENT.MAINTAIN_DRIVE_LOCATION.UPSERT;

    return this.apiService.post(endpoint, payload).pipe(
      catchError(error => {
        console.error('Error saving drive location:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get location type lookup
   * GET /api/v1/drive-locations/lookups/location-type?chapterId={chapterId}&search={search}
   * @param chapterId - Chapter ID
   * @param search - Search term
   * @returns Observable with location type options
   */
  getLocationTypeLookup(chapterId: string, search: string = ''): Observable<any[]> {
    const endpoint = API.RECRUITMENT.MAINTAIN_DRIVE_LOCATION.LOOKUPS.LOCATION_TYPE;

    let httpParams = new HttpParams().set('chapterId', chapterId);
    if (search) {
      httpParams = httpParams.set('search', search);
    }

    return this.apiService.get<any>(endpoint, { params: httpParams }).pipe(
      map(response => response?.item || response?.data || []),
      catchError(error => {
        console.error('Error fetching location type lookup:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get location ID lookup based on location type
   * GET /api/v1/drive-locations/lookups/location/{chapterId}/{locationType}?search={search}
   * @param chapterId - Chapter ID
   * @param locationType - Location Type code
   * @param search - Search term (defaults to empty string to get all results)
   * @returns Observable with location ID options
   */
  getLocationLookup(chapterId: string, locationType: string, search: string = ''): Observable<any[]> {
    const endpoint = API.RECRUITMENT.MAINTAIN_DRIVE_LOCATION.LOOKUPS.LOCATION(chapterId, locationType);

    const httpParams = new HttpParams().set('search', search);

    return this.apiService.get<any>(endpoint, { params: httpParams }).pipe(
      map(response => response?.item || response?.data || []),
      catchError(error => {
        console.error('Error fetching location lookup:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get sponsor lookup
   * GET /api/v1/drive-locations/lookups/sponsor/{chapterId}
   * @param chapterId - Chapter ID
   * @returns Observable with sponsor options
   */
  getSponsorLookup(chapterId: string): Observable<any[]> {
    const endpoint = API.RECRUITMENT.MAINTAIN_DRIVE_LOCATION.LOOKUPS.SPONSOR(chapterId);

    return this.apiService.get<any>(endpoint).pipe(
      map(response => response?.item || response?.data || []),
      catchError(error => {
        console.error('Error fetching sponsor lookup:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get hospital lookup
   * GET /api/v1/drive-locations/lookups/hospital/{chapterId}
   * @param chapterId - Chapter ID
   * @returns Observable with hospital options
   */
  getHospitalLookup(chapterId: string): Observable<any[]> {
    const endpoint = API.RECRUITMENT.MAINTAIN_DRIVE_LOCATION.LOOKUPS.HOSPITAL(chapterId);

    return this.apiService.get<any>(endpoint).pipe(
      map(response => response?.item || response?.data || []),
      catchError(error => {
        console.error('Error fetching hospital lookup:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get staff lookup (Donor Ctr Mnr)
   * GET /api/v1/drive-locations/lookups/staff/{chapterId}
   * @param chapterId - Chapter ID
   * @returns Observable with staff options
   */
  getStaffLookup(chapterId: string): Observable<any[]> {
    const endpoint = API.RECRUITMENT.MAINTAIN_DRIVE_LOCATION.LOOKUPS.STAFF(chapterId);

    return this.apiService.get<any>(endpoint).pipe(
      map(response => response?.item || response?.data || []),
      catchError(error => {
        console.error('Error fetching staff lookup:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get facility lookup (Staff Facility)
   * GET /api/v1/drive-locations/lookups/facility?chapterId={chapterId}
   * @param chapterId - Chapter ID
   * @returns Observable with facility options
   */
  getFacilityLookup(chapterId: string): Observable<any[]> {
    const endpoint = API.RECRUITMENT.MAINTAIN_DRIVE_LOCATION.LOOKUPS.FACILITY;
    const httpParams = new HttpParams().set('chapterId', chapterId);

    return this.apiService.get<any>(endpoint, { params: httpParams }).pipe(
      map(response => response?.item || response?.data || []),
      catchError(error => {
        console.error('Error fetching facility lookup:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get city, state, and county by zip code
   * GET /api/v1/drive-locations/lookups/city-state/{zipCode}
   * @param zipCode - Zip Code
   * @returns Observable with city, state, county, and mapsco data
   */
  getCityStateByZipCode(zipCode: string): Observable<any> {
    const endpoint = API.RECRUITMENT.MAINTAIN_DRIVE_LOCATION.LOOKUPS.CITY_STATE_BY_ZIP(zipCode);

    return this.apiService.get<any>(endpoint).pipe(
      map(response => response?.item || response?.data || response),
      catchError(error => {
        console.error('Error fetching city/state by zip code:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get countries lookup for international address
   * GET /api/v1/sponsor-contacts/countries
   * @returns Observable with country options (code and description)
   */
  getCountries(): Observable<Array<{ code: string; description: string }>> {
    const endpoint = API.INTERNATIONAL_ADDRESS.COUNTRIES;

    return this.apiService.get<any>(endpoint).pipe(
      map(response => response?.data || response?.Data || []),
      catchError(error => {
        console.error('Error fetching countries:', error);
        return throwError(() => error);
      })
    );
  }
}
