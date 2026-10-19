import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { HttpParams } from '@angular/common/http';
import {
  DefineMaxDonationsModel,
  DefineMaxDonationsParamsDto,
  DefineMaxDonationsDto,
  UpdateDefineMaxDonationsDto,
  DonationTypeDropdown,
  ProcedureGroupDropdown
} from '../models/define-max-donations.model';
import { ApiService } from '@shared/services/api.service';
import { LoginService } from '@shared/services/login.service';
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

@Injectable({
  providedIn: 'root'
})
export class DefineMaxDonationsService {
  private readonly apiService = inject(ApiService);
  private readonly loginService = inject(LoginService);

  /**
   * Get Define Max Donations list with pagination, sorting, and filtering
   * POST /api/v1/define-max-donations/{take}/{skip}
   * @param take - Number of records to fetch
   * @param skip - Number of records to skip
   * @param params - Filter and search parameters
   * @returns Observable with table data and total count
   */
  getDefineMaxDonations(
    take: number,
    skip: number,
    params: DefineMaxDonationsParamsDto
  ): Observable<{ data: DefineMaxDonationsModel[]; totalRecords: number }> {
    const endpoint = API.APPLICATION_ADMIN.DEFINE_MAX_DONATIONS(take, skip);

    return this.apiService.post<ReturnResult<DefineMaxDonationsModel>>(endpoint, params).pipe(
      map(response => ({
        data: response.data || [],
        totalRecords: response.total || 0
      })),
      catchError(error => {
        console.error('Error fetching define max donations data:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Add new max donation configuration
   * POST /api/v1/define-max-donations
   * @param payload - Max donation data to add
   * @returns Observable with API response
   *
   * Note: The API requires loggedInUserName as query parameter.
   * Example: POST /api/v1/define-max-donations?loggedInUserName=SYSTEM
   */
  addMaxDonation(payload: DefineMaxDonationsDto): Observable<any> {
    const endpoint = API.APPLICATION_ADMIN.ADD_MAX_DONATION;

    // Get logged in username
    const loggedInUserName = this.loginService.getStoredUsername();

    // Create query parameters (required by API specification)
    const params = new HttpParams().set('loggedInUserName', loggedInUserName);

    return this.apiService.post<any>(endpoint, payload, { params }).pipe(
      catchError(error => {
        console.error('Error adding max donation:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update existing max donation configuration
   * PUT /api/v1/define-max-donations
   * @param payload - Updated max donation data
   * @returns Observable with API response
   */
  updateMaxDonation(payload: UpdateDefineMaxDonationsDto): Observable<any> {
    const endpoint = API.APPLICATION_ADMIN.UPDATE_MAX_DONATION;

    return this.apiService.put<any>(endpoint, payload).pipe(
      catchError(error => {
        console.error('Error updating max donation:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get donation types for dropdown
   * GET /api/v1/define-max-donations/donation-types
   * @returns Observable with donation types array
   */
  getDonationTypes(): Observable<DonationTypeDropdown[]> {
    const endpoint = API.APPLICATION_ADMIN.MAX_DONATIONS_DONATION_TYPES;

    return this.apiService.get<ReturnResult<DonationTypeDropdown>>(endpoint).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error('Error fetching donation types:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get donation types for filter dropdown
   * GET /api/v1/define-max-donations/donation-types-filter
   * @returns Observable with donation types array for filter panel
   */
  getDonationTypesFilter(): Observable<DonationTypeDropdown[]> {
    const endpoint = API.APPLICATION_ADMIN.MAX_DONATIONS_DONATION_TYPES_FILTER;

    return this.apiService.get<ReturnResult<DonationTypeDropdown>>(endpoint).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error('Error fetching donation types filter:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get procedure groups for dropdown
   * GET /api/v1/define-max-donations/procedure-groups
   * @returns Observable with procedure groups array
   */
  getProcedureGroups(): Observable<ProcedureGroupDropdown[]> {
    const endpoint = API.APPLICATION_ADMIN.MAX_DONATIONS_PROCEDURE_GROUPS;

    return this.apiService.get<ReturnResult<ProcedureGroupDropdown>>(endpoint).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error('Error fetching procedure groups:', error);
        return throwError(() => error);
      })
    );
  }
}
