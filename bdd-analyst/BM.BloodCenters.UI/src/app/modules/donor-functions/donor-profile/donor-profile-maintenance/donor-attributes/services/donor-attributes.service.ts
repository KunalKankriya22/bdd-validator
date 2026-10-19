import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, map, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import moment from 'moment';

import { environment } from '../../../../../../../environments/environment';
import { API } from '../../../../../../core/constants/api.constants';
import { HeaderService } from '../../../../../../shared/services/header.service';
import { LoginService } from '../../../../../../shared/services/login.service';
import {
  DonorDemographics,
  DonorInterdiction,
  PropertyLookup,
  DonorAttributeResponse,
  AttributesWithFlag,
  BulkUpsertRequest,
  BulkUpsertResponse
} from '../models/donor-attributes.model';

@Injectable({ providedIn: 'root' })
export class DonorAttributesService {
  private readonly http = inject(HttpClient);
  private readonly headerService = inject(HeaderService);
  private readonly loginService = inject(LoginService);

  getDonorDemographics(donorId: string): Observable<DonorDemographics> {
    return this.http
      .get<DonorAttributeResponse<DonorDemographics>>(
        `${environment.apiUrl}${API.DONOR_FUNCTIONS.DONOR_ATTRIBUTES.GET_DONOR_DEMOGRAPHICS(donorId)}`
      )
      .pipe(
        map((response) => {
          if (response.success) {
            const raw = response.item ?? response.data;
            const record = Array.isArray(raw) ? raw[0] : raw;
            if (record?.header) {
              const nameParts = (record.header.name || '').split(',').map((s: string) => s.trim());
              return {
                donorId: record.donorId,
                lastName: nameParts[0] || '',
                firstName: nameParts[1] || '',
                dateOfBirth: record.header.dateOfBirth,
                gender: record.header.sex,
                bloodType: record.header.abo
              } as DonorDemographics;
            }
            return record as DonorDemographics;
          }
          throw new Error(response.message || 'Failed to load donor demographics');
        }),
        catchError(this.handleError)
      );
  }

  getAllAttributes(donorId: string): Observable<DonorInterdiction[]> {
    return this.http
      .get<DonorAttributeResponse<any>>(
        `${environment.apiUrl}${API.DONOR_FUNCTIONS.DONOR_ATTRIBUTES.GET_ALL_ATTRIBUTES(donorId)}`
      )
      .pipe(
        map((response) => {
          if (response.success) {
            return this.flattenData(response.data);
          }
          throw new Error(response.message || 'Failed to load attributes');
        }),
        catchError(this.handleError)
      );
  }

  getActiveAttributes(donorId: string): Observable<AttributesWithFlag> {
    return this.http
      .get<DonorAttributeResponse<any>>(
        `${environment.apiUrl}${API.DONOR_FUNCTIONS.DONOR_ATTRIBUTES.GET_ACTIVE_ATTRIBUTES(donorId)}`
      )
      .pipe(
        map((response) => {
          if (response.success) {
            const attributes = this.flattenData(response.data);
            const hasOther = typeof response.hasOtherAttributes === 'boolean'
              ? response.hasOtherAttributes
              : attributes.length > 0;
            return { attributes, hasOtherAttributes: hasOther };
          }
          throw new Error(response.message || 'Failed to load active attributes');
        }),
        catchError(this.handleError)
      );
  }

  getTerminatedAttributes(donorId: string): Observable<DonorInterdiction[]> {
    return this.getAllAttributes(donorId).pipe(
      map((attrs) => attrs.filter((a) => !a.isActive))
    );
  }

  getValidProperties(): Observable<PropertyLookup[]> {
    return this.http
      .get<DonorAttributeResponse<any>>(
        `${environment.apiUrl}${API.DONOR_FUNCTIONS.DONOR_ATTRIBUTES.GET_VALID_PROPERTIES}`
      )
      .pipe(
        map((response) => {
          if (response.success) {
            return this.flattenData(response.data) as PropertyLookup[];
          }
          throw new Error(response.message || 'Failed to load valid properties');
        }),
        catchError(this.handleError)
      );
  }

  addAttribute(donorId: string, attribute: Partial<DonorInterdiction>): Observable<DonorInterdiction> {
    const request = {
      donorId,
      interCode: attribute.interCode!,
      effDate: this.formatDateForApi(attribute.effDate!),
      termDate: attribute.termDate ? this.formatDateForApi(attribute.termDate) : null,
      interType: attribute.interType || null
    };

    return this.http
      .post<DonorAttributeResponse<DonorInterdiction>>(
        `${environment.apiUrl}${API.DONOR_FUNCTIONS.DONOR_ATTRIBUTES.ADD_ATTRIBUTE}`,
        request
      )
      .pipe(
        map((response) => {
          if (response.success) {
            return response.item ?? response.data;
          }
          throw new Error(response.message || 'Failed to add attribute');
        }),
        catchError(this.handleError)
      );
  }

  updateAttribute(
    donorId: string,
    interCode: string,
    effDate: string,
    attribute: Partial<DonorInterdiction>
  ): Observable<DonorInterdiction> {
    const request = {
      effDate: this.formatDateForApi(effDate),
      termDate: attribute.termDate ? this.formatDateForApi(attribute.termDate) : null
    };

    return this.http
      .put<DonorAttributeResponse<DonorInterdiction>>(
        `${environment.apiUrl}${API.DONOR_FUNCTIONS.DONOR_ATTRIBUTES.UPDATE_ATTRIBUTE(donorId, interCode)}`,
        request
      )
      .pipe(
        map((response) => {
          if (response.success) {
            return response.item ?? response.data;
          }
          throw new Error(response.message || 'Failed to update attribute');
        }),
        catchError(this.handleError)
      );
  }

  terminateAttribute(
    donorId: string,
    interCode: string,
    effDate: string,
    termDate: string
  ): Observable<DonorInterdiction> {
    const request = {
      termDate: this.formatDateForApi(termDate)
    };

    return this.http
      .put<DonorAttributeResponse<DonorInterdiction>>(
        `${environment.apiUrl}${API.DONOR_FUNCTIONS.DONOR_ATTRIBUTES.TERMINATE_ATTRIBUTE(donorId, interCode)}`,
        request
      )
      .pipe(
        map((response) => {
          if (response.success) {
            return response.item ?? response.data;
          }
          throw new Error(response.message || 'Failed to terminate attribute');
        }),
        catchError(this.handleError)
      );
  }

  bulkUpsert(donorId: string, request: BulkUpsertRequest): Observable<BulkUpsertResponse> {
    return this.http
      .post<BulkUpsertResponse>(
        `${environment.apiUrl}${API.DONOR_FUNCTIONS.DONOR_ATTRIBUTES.BULK_UPSERT(donorId)}`,
        request
      )
      .pipe(catchError(this.handleError));
  }

  private flattenData(data: any): any[] {
    try {
      if (!data) return [];
      if (Array.isArray(data) && data.length > 0 && Array.isArray(data[0])) {
        return data.flat();
      }
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  private formatDateForApi(date: string | Date): string {
    return moment(date).format('YYYY-MM-DD');
  }

  private handleError = (error: HttpErrorResponse): Observable<never> => {
    let errorMessage = 'An unknown error occurred';
    if (error?.error?.message) {
      errorMessage = error.error.message;
    } else if (error?.status === 400) {
      errorMessage = 'Validation failed';
    } else if (error?.status === 404) {
      errorMessage = 'Resource not found';
    } else if (error?.status === 500) {
      errorMessage = 'Server error occurred';
    } else if (error?.message) {
      errorMessage = error.message;
    }
    return throwError(() => new Error(errorMessage));
  };
}
