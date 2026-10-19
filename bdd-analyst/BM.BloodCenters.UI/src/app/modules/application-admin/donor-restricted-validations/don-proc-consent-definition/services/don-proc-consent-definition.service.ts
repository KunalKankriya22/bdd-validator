import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  DonProcConsentDefinitionModel,
  DonProcConsentDefinitionParamsDto,
  DonProcConsentDefinitionFilterLov,
  DonProcConsentDefinitionDto,
  UpdateDonProcConsentDefinitionDto
} from '../models/don-proc-consent-definition.model';
import { ApiService } from '@shared/services/api.service';

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
export class DonProcConsentDefinitionService {
  private readonly apiService = inject(ApiService);

  /**
   * Get Donation/Procedure Consent Definition table data with pagination
   * POST /api/v1/admin/donation-procedure-consent/{take}/{skip}
   * @param take - Number of records to fetch
   * @param skip - Number of records to skip
   * @param params - Filter and search parameters
   * @returns Observable with table data and total count
   */
  getConsentDefinitions(
    take: number,
    skip: number,
    params: DonProcConsentDefinitionParamsDto
  ): Observable<{ data: DonProcConsentDefinitionModel[]; totalRecords: number }> {
    const endpoint = `/api/v1/admin/donation-procedure-consent/${take}/${skip}`;

    return this.apiService.post<ReturnResult<DonProcConsentDefinitionModel>>(endpoint, params).pipe(
      map(response => ({
        data: response.data || [],
        totalRecords: response.total || 0
      })),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Get filter dropdown values (LOV)
   * GET /api/v1/admin/donation-procedure-consent-filters
   * @param chapterId - Chapter ID to filter data
   * @returns Observable with filter options
   */
  getConsentDefinitionFilters(chapterId?: string): Observable<ReturnResult<DonProcConsentDefinitionFilterLov>> {
    const endpoint = '/api/v1/admin/donation-procedure-consent-filters';
    let options;

    if (chapterId) {
      const params = new HttpParams().set('chapterId', chapterId);
      options = { params };
    }

    return this.apiService.get<ReturnResult<DonProcConsentDefinitionFilterLov>>(endpoint, options).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Get create/edit form dropdown data (donation types and consent codes)
   * GET /api/v1/admin/donation-procedure-consent/create-data
   * @returns Observable with donation types and consent codes
   */
  getCreateData(chapterId?: string): Observable<ReturnResult<{
    donationTypes: { donationType: string; description: string }[];
    consentCodes: { consentCode: string; consentDescription: string; versionNo: string }[];
  }>> {
    const endpoint = '/api/v1/admin/donation-procedure-consent/create-data';
    let options;

    if (chapterId) {
      const params = new HttpParams().set('chapterId', chapterId);
      options = { params };
    }

    return this.apiService.get<ReturnResult<{
      donationTypes: { donationType: string; description: string }[];
      consentCodes: { consentCode: string; consentDescription: string; versionNo: string }[];
    }>>(endpoint, options).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Get procedure codes for a specific donation type
   * GET /api/v1/admin/donation-procedure-consent/procedure-codes/{donationType}
   * @param donationType - The donation type to get procedure codes for
   * @returns Observable with list of procedure codes
   */
  getProcedureCodesByDonationType(donationType: string, chapterId?: string): Observable<ReturnResult<string>> {
    const endpoint = `/api/v1/admin/donation-procedure-consent/procedure-codes/${encodeURIComponent(donationType)}`;
    let options;

    if (chapterId) {
      const params = new HttpParams().set('chapterId', chapterId);
      options = { params };
    }

    return this.apiService.get<ReturnResult<string>>(endpoint, options).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Add new Consent Definition
   * POST /api/v1/admin/donation-procedure-consent-definition
   * @param data - Consent definition data (DonProcConsentDefinitionDto)
   * @returns Observable with result
   */
  addConsentDefinition(data: DonProcConsentDefinitionDto): Observable<ReturnResult<DonProcConsentDefinitionModel>> {
    const endpoint = '/api/v1/admin/donation-procedure-consent';

    return this.apiService.post<ReturnResult<DonProcConsentDefinitionModel>>(endpoint, data).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Update existing Consent Definition
   * PUT /api/v1/admin/donation-procedure-consent
   * @param data - Consent definition data (UpdateDonProcConsentDefinitionDto)
   * @returns Observable with result
   */
  updateConsentDefinition(data: UpdateDonProcConsentDefinitionDto): Observable<ReturnResult<DonProcConsentDefinitionModel>> {
    const endpoint = '/api/v1/admin/donation-procedure-consent';

    return this.apiService.put<ReturnResult<DonProcConsentDefinitionModel>>(endpoint, data).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }
}
