import { Injectable, inject } from '@angular/core';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  MultipleDriveSelectionLookups,
  MultipleDriveFilterRequest,
  DriveRecord,
  LookupsResponse,
  DriveSearchResponse
} from '../models/multiple-drive-selection-query.model';
import { ApiService } from '@shared/services/api.service';
import { HeaderService } from '@shared/services/header.service';
import { API } from '../../../../../../core/constants/api.constants';

@Injectable({
  providedIn: 'root'
})
export class MultipleDriveSelectionQueryService {
  private readonly apiService = inject(ApiService);
  private readonly headerService = inject(HeaderService);

  /**
   * Get lookup data for all filter dropdowns
   * GET /api/v1/multiple-drive-selection-query/lookups/{chapterId}
   * @returns Observable with lookup options
   */
  getLookups(): Observable<MultipleDriveSelectionLookups> {
    const chapterId = this.headerService.chapterId();
    const endpoint = API.DONOR_FUNCTIONS.MULTIPLE_DRIVE_SELECTION_LOOKUPS(chapterId);

    return this.apiService.get<LookupsResponse>(endpoint).pipe(
      map(response => response?.item || this.getEmptyLookups()),
      catchError(error => {
        console.error('Error fetching multiple drive selection lookups:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Search drives with filters and pagination
   * POST /api/v1/multiple-drive-selection-query/{chapterId}/{take}/{skip}
   * @param take - Page size
   * @param skip - Number of records to skip
   * @param filters - Filter criteria
   * @returns Observable with drive records and total count
   */
  searchDrives(
    take: number,
    skip: number,
    filters: MultipleDriveFilterRequest
  ): Observable<{ data: DriveRecord[]; total: number }> {
    const chapterId = this.headerService.chapterId();
    const endpoint = API.DONOR_FUNCTIONS.MULTIPLE_DRIVE_SELECTION_QUERY(chapterId, take, skip);

    // Clean up undefined/null values from filters
    const cleanedFilters = this.cleanFilterRequest(filters);

    return this.apiService.post<DriveSearchResponse>(endpoint, cleanedFilters).pipe(
      map(response => ({
        data: response?.data || [],
        total: response?.total || 0
      })),
      catchError(error => {
        // Handle 404 as empty result when API indicates success
        if (error.status === 404 && error.error?.success === true) {
          return of({ data: [], total: 0 });
        }

        console.error('Error searching drives:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Clean filter request by removing undefined/null values
   * @param filters - Raw filter object
   * @returns Cleaned filter object
   */
  private cleanFilterRequest(filters: MultipleDriveFilterRequest): MultipleDriveFilterRequest {
    const cleaned: Partial<MultipleDriveFilterRequest> = {};

    Object.keys(filters).forEach((key) => {
      const value = filters[key as keyof MultipleDriveFilterRequest];

      // Keep required fields (fromDate, toDate)
      if (key === 'fromDate' || key === 'toDate') {
        cleaned[key as keyof MultipleDriveFilterRequest] = value as any;
        return;
      }

      // Skip undefined, null, empty strings, and empty arrays
      if (
        value !== undefined &&
        value !== null &&
        value !== '' &&
        !(Array.isArray(value) && value.length === 0)
      ) {
        cleaned[key as keyof MultipleDriveFilterRequest] = value as any;
      }
    });

    return cleaned as MultipleDriveFilterRequest;
  }

  /**
   * Get empty lookups structure
   * @returns Empty lookups object
   */
  private getEmptyLookups(): MultipleDriveSelectionLookups {
    return {
      select: [],
      facility: [],
      status: [],
      sponsors: [],
      zipCode: [],
      sponsorCategory: [],
      territory: [],
      procedure: [],
      driveCategory: [],
      fixedDrive: []
    };
  }
}
