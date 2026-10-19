import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import {
  DefineDonationTypesModel,
  DefineDonationTypesParamsDto,
  DefineDonationTypesDto,
  UpdateDefineDonationTypesDto
} from '../models/define-donation-types.model';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';

interface ReturnResult<T> {
  success?: boolean;
  message?: string;
  error?: string;
  statusCode?: number;
  data?: T[];
  item?: T;
  total?: number;
}

/**
 * Donation Type Code dropdown item (matches backend DonationTypeCodeDropdownDto)
 */
export interface DonationTypeCodeDropdownDto {
  donationTypeCode: string;
}

/**
 * Sequence dropdown item (matches backend SequenceDropdownDto)
 */
export interface SequenceDropdownDto {
  sequence: number | null;
}

/**
 * API Response structure (matches backend DonationTypeFilterDropdownValues)
 */
export interface DonationTypeFilterDropdownValues {
  donationTypeCodes: DonationTypeCodeDropdownDto[];
  sequences: SequenceDropdownDto[];
}

/**
 * Mapped response for component use
 */
export interface DonationTypeFiltersResponse {
  donationTypeCodes: string[];
  sequences: number[];
}

@Injectable({
  providedIn: 'root'
})
export class DefineDonationTypesService {
  private readonly apiService = inject(ApiService);

  /**
   * Get Define Donation Types list with pagination, sorting, and filtering
   * POST /api/v1/donation-types/{take}/{skip}
   * @param take - Number of records to fetch
   * @param skip - Number of records to skip
   * @param params - Filter and search parameters
   * @returns Observable with table data and total count
   */
  getDefineDonationTypes(
    take: number,
    skip: number,
    params: DefineDonationTypesParamsDto
  ): Observable<{ data: DefineDonationTypesModel[]; totalRecords: number }> {
    const endpoint = API.APPLICATION_ADMIN.DEFINE_DONATION_TYPES(take, skip);

    return this.apiService.post<ReturnResult<DefineDonationTypesModel>>(endpoint, params).pipe(
      map(response => ({
        data: response.data || [],
        totalRecords: response.total || 0
      })),
      catchError(error => {
        console.error('Error fetching define donation types data:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Add new donation type
   * POST /api/v1/donation-types
   * @param payload - Donation type data to add
   * @returns Observable with API response
   */
  addDonationType(payload: DefineDonationTypesDto): Observable<any> {
    const endpoint = API.APPLICATION_ADMIN.ADD_DONATION_TYPE;

    return this.apiService.post<any>(endpoint, payload).pipe(
      catchError(error => {
        console.error('Error adding donation type:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update existing donation type
   * PUT /api/v1/donation-types
   * @param payload - Updated donation type data
   * @returns Observable with API response
   */
  updateDonationType(payload: UpdateDefineDonationTypesDto): Observable<any> {
    const endpoint = API.APPLICATION_ADMIN.UPDATE_DONATION_TYPE;

    return this.apiService.put<any>(endpoint, payload).pipe(
      catchError(error => {
        console.error('Error updating donation type:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get donation type filters (donation type codes and sequences)
   * GET /api/v1/donation-types/donation-type-filters
   * @returns Observable of donation type codes and sequences
   */
  getDonationTypeFilters(): Observable<DonationTypeFiltersResponse> {
    const endpoint = API.APPLICATION_ADMIN.DONATION_TYPE_FILTERS;

    return this.apiService.get<DonationTypeFilterDropdownValues>(endpoint).pipe(
      map((response) => {
        // Extract donation type codes from the response
        const donationTypeCodes = (response.donationTypeCodes || [])
          .map((item: DonationTypeCodeDropdownDto) => item.donationTypeCode)
          .filter((code: string) => code && code.trim() !== '');

        // Extract sequences from the response
        const sequences = (response.sequences || [])
          .map((item: SequenceDropdownDto) => item.sequence)
          .filter((seq): seq is number => seq !== null && seq !== undefined);

        return {
          donationTypeCodes,
          sequences
        };
      }),
      catchError((error) => {
        console.error('Error fetching donation type filters:', error);
        return throwError(() => error);
      })
    );
  }
}
