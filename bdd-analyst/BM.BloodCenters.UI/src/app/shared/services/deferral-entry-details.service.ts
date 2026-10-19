import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { API } from '../../core/constants/api.constants';
import { environment } from '../../../environments/environment';
import {
  DeferralEntryDetailsDto,
  DeferralEntryDetailsQueryDto,
  DeferralEntryDetailsResponse,
  DeferralEntryDetailsListResponse,
} from '@shared/models/deferral-entry-details.model';

/**
 * Service for managing Deferral Entry Details (DRWDEFRL)
 * Provides read-only access to deferral entry information
 *
 * API Base URL: /api/deferral-entry-details
 * Module: Donor
 */
@Injectable({
  providedIn: 'root',
})
export class DeferralEntryDetailsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  /**
   * Get all deferral entry details with optional filtering, searching, and sorting
   *
   * @param take - Number of records to return (max 100)
   * @param skip - Number of records to skip for pagination
   * @param query - Optional query/filter parameters
   * @returns Observable of DeferralEntryDetailsDto array with total count
   */
  getAll(
    take: number,
    skip: number,
    query?: DeferralEntryDetailsQueryDto
  ): Observable<{ data: DeferralEntryDetailsDto[]; total: number }> {
    const url = `${this.baseUrl}${API.RECRUITMENT.DEFERRAL_ENTRY_DETAILS.GET_ALL(take, skip)}`;

    return this.http.post<DeferralEntryDetailsListResponse>(url, query || {}).pipe(
      map((response) => ({
        data: response.data || [],
        total: response.total || 0,
      }))
    );
  }

  /**
   * Get a single deferral entry by its composite key (Donor ID + Drive Date)
   *
   * @param donorId - Donor identifier (max 10 characters)
   * @param driveDate - Drive/donation date (format: yyyy-MM-dd)
   * @returns Observable of DeferralEntryDetailsDto
   */
  getByCompositeKey(
    donorId: string,
    driveDate: string
  ): Observable<DeferralEntryDetailsDto> {
    const url = `${this.baseUrl}${API.RECRUITMENT.DEFERRAL_ENTRY_DETAILS.GET_BY_COMPOSITE_KEY(donorId, driveDate)}`;

    return this.http.get<DeferralEntryDetailsResponse>(url).pipe(
      map((response) => response.data)
    );
  }

  /**
   * Get all deferral entries for a specific donor with pagination
   *
   * @param donorId - Donor identifier (max 10 characters)
   * @param take - Number of records to return (max 100)
   * @param skip - Number of records to skip for pagination
   * @returns Observable of DeferralEntryDetailsDto array with total count
   */
  getByDonorId(
    donorId: string,
    take: number,
    skip: number
  ): Observable<{ data: DeferralEntryDetailsDto[]; total: number }> {
    const url = `${this.baseUrl}${API.RECRUITMENT.DEFERRAL_ENTRY_DETAILS.GET_BY_DONOR(donorId, take, skip)}`;

    return this.http.get<DeferralEntryDetailsListResponse>(url).pipe(
      map((response) => ({
        data: response.data || [],
        total: response.total || 0,
      }))
    );
  }
}
