import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { API } from 'src/app/core/constants/api.constants';
import { ApiService } from '@shared/services/api.service';
import { HeaderService } from '@shared/services/header.service';
import { convertUTCToTimezone } from '@shared/date/timezone.util';
import {
  GradedDonorsQueryParams,
  GradedDonationsQueryResponse,
  GradedDonorsQueryResponse,
  UnitHoldsQueryResponse,
  DonorHoldsQueryResponse,
  NewGradedDonationsApiResponse,
  GradedDonationRecord,
  GradedDonorRecord,
  UnitHoldsQueryRequest,
  DonorHoldsQueryRequest
} from '../models/graded-donors-query.model';
import moment from 'moment';

/**
 * Graded Donors Query Service
 *
 * Provides API methods for querying graded donations and graded donors
 */
@Injectable({
  providedIn: 'root'
})
export class GradedDonorsQueryService {
  private apiService = inject(ApiService);
  private headerService = inject(HeaderService);

  /**
   * Query graded donations (RAW API response with nested gradedDonors)
   * Use this when you need to extract BOTH donations and donors from a single API call
   * @param params Query parameters matching backend GradedDonorsQueryParamDto
   * @returns Observable of raw API response with nested gradedDonors
   */
  queryGradedDonationsRaw(params: GradedDonorsQueryParams): Observable<NewGradedDonationsApiResponse> {
    const requestBody = this.buildRequestBody(params);

    return this.apiService.post<NewGradedDonationsApiResponse>(API.DONOR_FUNCTIONS.GRADED_DONORS_QUERY.SEARCH, requestBody)
      .pipe(
        catchError(error => {
          return throwError(() => error);
        })
      );
  }

  /**
   * Query graded donations
   * @param params Query parameters matching backend GradedDonorsQueryParamDto
   * @returns Observable of graded donation records
   */
  queryGradedDonations(params: GradedDonorsQueryParams): Observable<GradedDonationsQueryResponse> {
    const requestBody = this.buildRequestBody(params);

    return this.apiService.post<NewGradedDonationsApiResponse>(API.DONOR_FUNCTIONS.GRADED_DONORS_QUERY.SEARCH, requestBody)
      .pipe(
        map(newResponse => {
          // Transform new API response to old UI format
          const mappedData: GradedDonationRecord[] = (newResponse.data || []).map(donation => ({
            unitDeferId: donation.unitIdWithCheckDigit || donation.unitId,
            lastName: donation.lastName,
            firstName: donation.firstName,
            dateOfBirth: this.formatDateForDisplay(donation.dateOfBirth),
            sex: donation.gender || '',
            status: donation.activeFlag === 'Y' ? 'Active' : 'Inactive',
            insertDate: this.formatDateTimeForDisplay(donation.insertDate),
            insertUser: donation.insertUser || '',
            transactionId: donation.transactionId,
            donorId: donation.gradedDonors?.[0]?.donorId,
            driveId: undefined
          }));

          return {
            success: newResponse.success,
            statusCode: newResponse.statusCode,
            message: newResponse.message,
            error: newResponse.error,
            data: mappedData,
            total: newResponse.total || 0
          };
        }),
        catchError(error => {
          return throwError(() => error);
        })
      );
  }

  /**
   * Query graded donors
   * @param params Query parameters matching backend GradedDonorsQueryParamDto
   * @returns Observable of graded donor records
   */
  queryGradedDonors(params: GradedDonorsQueryParams): Observable<GradedDonorsQueryResponse> {
    const requestBody = this.buildRequestBody(params);

    return this.apiService.post<NewGradedDonationsApiResponse>(API.DONOR_FUNCTIONS.GRADED_DONORS_QUERY.SEARCH, requestBody)
      .pipe(
        map(newResponse => {
          // Extract and flatten nested gradedDonors array to old UI format
          const flattenedDonors: GradedDonorRecord[] = [];

          (newResponse.data || []).forEach(donation => {
            donation.gradedDonors?.forEach(donor => {
              flattenedDonors.push({
                donorId: donor.donorId,
                matchGrade: donor.grade?.toString() || '',
                dgmLocation: donor.dgmId.toString(),
                lastName: donor.lastName || '',
                firstName: donor.firstName || '',
                dateOfBirth: this.formatDateForDisplay(donor.dateOfBirth),
                sex: donor.gender || '',
                mergeFlag: donor.potentialDuplicateFlag || '',
                unitDeferId: donation.unitIdWithCheckDigit || donation.unitId
              });
            });
          });

          // For graded donors: total is count of flattened donors, not donations
          // Note: Server-side pagination doesn't work well with nested data structure
          // Backend paginates donations, but UI displays flattened donors
          return {
            success: newResponse.success,
            statusCode: newResponse.statusCode,
            message: newResponse.message,
            error: newResponse.error,
            data: flattenedDonors,
            total: flattenedDonors.length
          };
        }),
        catchError(error => {
          return throwError(() => error);
        })
      );
  }

  /**
   * Query unit holds for a specific unit/deferral
   * @param transactionId Transaction ID (required by backend)
   * @param chapterId Current chapter ID (not used - kept for interface compatibility)
   * @param userId Current user ID (not used - kept for interface compatibility)
   * @returns Observable of unit hold records
   */
  queryUnitHolds(transactionId: string, chapterId: string, userId: string): Observable<UnitHoldsQueryResponse> {
    const requestBody: UnitHoldsQueryRequest = {
      transactionId
    };

    return this.apiService.post<any>(
      API.DONOR_FUNCTIONS.GRADED_DONORS_QUERY.UNIT_HOLDS,
      requestBody
    ).pipe(
      map(response => {
        // Map API response fields to UI model
        if (response.data) {
          response.data = response.data.map((hold: any) => ({
            type: hold.interType || '',
            code: hold.interCode || '',
            description: hold.description || '',
            entryDate: this.formatDateTimeForDisplay(hold.entryDate),
            terminationDate: hold.releaseDate ? this.formatDateForDisplay(hold.releaseDate) : undefined
          }));
        }
        return response;
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Query donor holds for a specific donor
   * @param donorId Donor ID (required by backend)
   * @param chapterId Current chapter ID (not used - kept for interface compatibility)
   * @param userId Current user ID (not used - kept for interface compatibility)
   * @returns Observable of donor hold records
   */
  queryDonorHolds(donorId: string, chapterId: string, userId: string): Observable<DonorHoldsQueryResponse> {
    const requestBody: DonorHoldsQueryRequest = {
      donorId
    };

    return this.apiService.post<any>(
      API.DONOR_FUNCTIONS.GRADED_DONORS_QUERY.DONOR_HOLDS,
      requestBody
    ).pipe(
      map(response => {
        // Map API response fields to UI model
        if (response.data) {
          response.data = response.data.map((hold: any) => ({
            type: hold.interType || '',
            code: hold.interCode || '',
            description: hold.description || '',
            unitId: hold.unitId || '-',
            entryDate: this.formatDateTimeForDisplay(hold.entryDate),
            effectiveDate: hold.effDate ? this.formatDateForDisplay(hold.effDate) : '-',
            terminationDate: hold.releaseDate ? this.formatDateForDisplay(hold.releaseDate) : undefined
          }));
        }
        return response;
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Get last names list of values for autocomplete
   * @returns Observable of last names array
   */
  getLastNamesLov(): Observable<string[]> {
    return this.apiService.get<any>(API.DONOR_FUNCTIONS.GRADED_DONORS_QUERY.LAST_NAMES_LOV)
      .pipe(
        map(response => {
          const data = response.data || [];
          let lastNames: string[] = [];

          // Handle if data is array of objects or array of strings
          if (data.length > 0 && typeof data[0] === 'object') {
            // Extract the string value from objects and filter out empty values
            lastNames = data
              .map((item: any) => item.lastName || item.name || item.value || '')
              .filter((name: string) => name && name.trim() !== '');
          } else {
            lastNames = data.filter((name: string) => name && name.trim() !== '');
          }

          return lastNames;
        }),
        catchError(() => {
          // Backend endpoint not implemented yet - return empty array
          return throwError(() => new Error('LOV endpoint not available'));
        })
      );
  }

  /**
   * Get unit IDs list of values for autocomplete
   * @returns Observable of unit IDs with last names array
   */
  getUnitIdsLov(): Observable<{ unitId: string; lastName: string; displayValue: string }[]> {
    return this.apiService.get<any>(API.DONOR_FUNCTIONS.GRADED_DONORS_QUERY.UNIT_IDS_LOV)
      .pipe(
        map(response => {
          const data = response.data || [];
          let unitIdsWithNames: { unitId: string; lastName: string; displayValue: string }[] = [];

          // Handle if data is array of objects with unitId and lastName
          if (data.length > 0 && typeof data[0] === 'object') {
            unitIdsWithNames = data
              .filter((item: any) => item.unitId && item.unitId.trim() !== '')
              .map((item: any) => {
                const unitId = item.unitId || '';
                const lastName = item.lastName || '';
                const displayValue = lastName ? `${unitId} - ${lastName}` : unitId;
                return { unitId, lastName, displayValue };
              });
          }

          return unitIdsWithNames;
        }),
        catchError(() => {
          // Backend endpoint not implemented yet - return empty array
          return throwError(() => new Error('LOV endpoint not available'));
        })
      );
  }

  /**
   * Build POST body matching backend GradedDonorsQueryParamDto (camelCase JSON).
   * Only include non-null/non-undefined fields in the request body.
   */
  private buildRequestBody(params: GradedDonorsQueryParams): Record<string, string | number | null> {
    // Backend expects ALL fields present with PascalCase naming - null values bypass SQL WHERE clauses
    const unitDeferralId = params.unitId?.trim() || null;

    return {
      LastName: params.lastName?.trim() || null,
      EffectiveUnitId: unitDeferralId,
      UnitDeferId: unitDeferralId,
      FromDate: params.fromDate ? this.formatDateForApi(params.fromDate) : null,
      ToDate: params.toDate ? this.formatDateForApi(params.toDate) : null,
      Take: params.take ?? null,
      Skip: params.skip ?? null,
      SortBy: params.sortBy || null,
      SortOrder: params.sortOrder || null
    };
  }

  /**
   * Format Date object for API (YYYY-MM-DD)
   * @param date Date object
   * @returns Formatted date string for API
   */
  private formatDateForApi(date: Date): string {
    const m = moment(date);
    return m.isValid() ? m.format('YYYY-MM-DD') : '';
  }

  /**
   * Format date for display (DD-MMM-YYYY)
   * @param date Date string in YYYY-MM-DD format
   * @returns Formatted date string
   */
  private formatDateForDisplay(date: string | null | undefined): string {
    if (!date) return '';
    const m = moment(date, 'YYYY-MM-DD');
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : '';
  }

  /**
   * Format datetime for display (DD-MMM-YYYY HH:mm) in chapter timezone
   * @param datetime ISO/UTC datetime string
   * @returns Formatted datetime string in chapter local time
   */
  private formatDateTimeForDisplay(datetime: string | null | undefined): string {
    if (!datetime) return '';
    const timezone = this.headerService.getCurrentChapterTimezone() || 'UTC';
    const converted = convertUTCToTimezone(datetime, timezone);
    const m = moment(converted);
    return m.isValid() ? m.format('DD-MMM-YYYY HH:mm').toUpperCase() : '';
  }
}
