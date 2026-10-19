import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { API } from '../../../../../core/constants/api.constants';
import { ApiService } from '../../../../../shared/services/api.service';
import {
  AlternateIdDonorGrade,
  AlternateIdForm,
  AlternateIdApiResponse,
  AlternateIdCreateRequest,
  AlternateIdUpdateRequest,
} from '../models/alternate-id.model';
import { DateFieldValidationUtility } from '../../../../../shared/components/DateFieldUtility/date-field-validation.utility';

/**
 * Service for managing Alternate ID Configuration API operations
 * Handles API calls for alternate ID donor grade configurations
 */
@Injectable({
  providedIn: 'root',
})
export class AlternateIdApiService {
  private apiService = inject(ApiService);

  /**
   * Convert AlternateIdForm to API request format for CREATE
   */
  private toCreateRequest(form: AlternateIdForm): AlternateIdCreateRequest {
    return {
      keyDataGrade: form.keyDataGrade,
      altidMatchType: form.altidMatchType,
      finalGrade: form.finalGrade,
      effDate: form.effDate,
      termDate: form.termDate || undefined,
    };
  }

  /**
   * Convert AlternateIdForm to API request format for UPDATE
   */
  private toUpdateRequest(auditKey: number, form: AlternateIdForm): AlternateIdUpdateRequest {
    return {
      auditKey,
      keyDataGrade: form.keyDataGrade,
      altidMatchType: form.altidMatchType,
      finalGrade: form.finalGrade,
      effDate: form.effDate,
      termDate: form.termDate || undefined,
    };
  }

  /**
   * Convert API response to AlternateIdDonorGrade
   */
  private fromApiResponse(apiData: any): AlternateIdDonorGrade {
    return {
      keyDataGrade: apiData.keyDataGrade,
      altidMatchType: apiData.altidMatchType,
      finalGrade: apiData.finalGrade,
      effDate: new Date(apiData.effDate),
      termDate: apiData.termDate
        ? new Date(apiData.termDate)
        : undefined,
      programId: apiData.programId || 'VDIALTID',
      insertDate: new Date(apiData.insertDate),
      insertUser: apiData.insertUser,
      auditKey: apiData.auditKey,
    };
  }

  /**
   * Get all Alternate ID Configuration records
   * POST /alt-id-donor-grades/{take}/{skip}
   */
  getAll(
    take: number = 1000,
    skip: number = 0
  ): Observable<AlternateIdDonorGrade[]> {
    const endpoint = API.ALTERNATE_ID_CONFIG.GET_ALL(take, skip);

    return this.apiService
      .post<AlternateIdApiResponse>(endpoint, {})
      .pipe(
        map((response) => {
          if (!response.success) {
            throw new Error(
              response.message || 'Failed to fetch alternate ID configurations'
            );
          }

          return (response.data || []).map((item) =>
            this.fromApiResponse(item)
          );
        }),
        catchError((error) => {
          console.error('Error fetching Alternate ID Configurations:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get a specific Alternate ID Configuration by audit key
   * GET /alt-id-donor-grades/{auditKey}
   */
  getByAuditKey(
    auditKey: number
  ): Observable<AlternateIdDonorGrade | undefined> {
    const endpoint = API.ALTERNATE_ID_CONFIG.GET_BY_AUDIT_KEY(auditKey);

    return this.apiService.get<AlternateIdApiResponse>(endpoint).pipe(
      map((response) => {
        if (!response.success || !response.item) {
          return undefined;
        }

        return this.fromApiResponse(response.item);
      }),
      catchError((error) => {
        if (error.status === 404) {
          return throwError(() => ({
            status: 404,
            error: { message: 'Record not found' },
          }));
        }
        console.error('Error fetching Alternate ID Configuration:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Create a new Alternate ID Configuration record
   * POST /alt-id-donor-grades
   */
  create(form: AlternateIdForm): Observable<AlternateIdDonorGrade> {
    const requestBody = this.toCreateRequest(form);

    return this.apiService
      .post<AlternateIdApiResponse>(
        API.ALTERNATE_ID_CONFIG.CREATE,
        requestBody
      )
      .pipe(
        map((response) => {
          if (!response.success) {
            throw new Error(
              response.message ||
                response.errorResponse?.error ||
                'Failed to create alternate ID configuration'
            );
          }

          if (response.item) {
            return this.fromApiResponse(response.item);
          }

          return {
            keyDataGrade: form.keyDataGrade,
            altidMatchType: form.altidMatchType,
            finalGrade: form.finalGrade,
            effDate: new Date(form.effDate),
            termDate: form.termDate ? new Date(form.termDate) : undefined,
            programId: 'VDIALTID',
            insertDate: DateFieldValidationUtility.getChapterLocalDateForInsert(),
            insertUser: 'CURRENT_USER',
            auditKey: 0,
          };
        }),
        catchError((error) => {
          console.error('Error creating Alternate ID Configuration:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Update an existing Alternate ID Configuration record
   * PUT /alt-id-donor-grades
   */
  update(
    auditKey: number,
    form: AlternateIdForm
  ): Observable<AlternateIdDonorGrade> {
    const requestBody = this.toUpdateRequest(auditKey, form);

    return this.apiService
      .put<AlternateIdApiResponse>(API.ALTERNATE_ID_CONFIG.UPDATE, requestBody)
      .pipe(
        map((response) => {
          if (!response.success) {
            throw new Error(
              response.message ||
                response.errorResponse?.error ||
                'Failed to update alternate ID configuration'
            );
          }

          if (response.item) {
            return this.fromApiResponse(response.item);
          }

          return {
            keyDataGrade: form.keyDataGrade,
            altidMatchType: form.altidMatchType,
            finalGrade: form.finalGrade,
            effDate: new Date(form.effDate),
            termDate: form.termDate ? new Date(form.termDate) : undefined,
            programId: 'VDIALTID',
            insertDate: DateFieldValidationUtility.getChapterLocalDateForInsert(),
            insertUser: 'CURRENT_USER',
            auditKey,
          };
        }),
        catchError((error) => {
          if (error.status === 404) {
            return throwError(() => ({
              status: 404,
              error: { message: 'Record not found' },
            }));
          }

          console.error('Error updating Alternate ID Configuration:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Delete an Alternate ID Configuration record
   * DELETE /alt-id-donor-grades/{auditKey}
   */
  delete(auditKey: number): Observable<void> {
    const endpoint = API.ALTERNATE_ID_CONFIG.DELETE(auditKey);

    return this.apiService.delete<AlternateIdApiResponse>(endpoint).pipe(
      map((response) => {
        if (!response.success) {
          throw new Error(
            response.message || 'Failed to delete alternate ID configuration'
          );
        }
        return void 0;
      }),
      catchError((error) => {
        if (error.status === 404) {
          return throwError(() => ({
            status: 404,
            error: { message: 'Record not found' },
          }));
        }
        console.error('Error deleting Alternate ID Configuration:', error);
        return throwError(() => error);
      })
    );
  }
}
