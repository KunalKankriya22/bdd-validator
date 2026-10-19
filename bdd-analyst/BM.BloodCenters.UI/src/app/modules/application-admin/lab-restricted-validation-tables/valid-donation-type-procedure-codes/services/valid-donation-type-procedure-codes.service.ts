import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import {
  ValidDonationTypeProcedureCodesModel,
  ValidDonationTypeProcedureCodesParamsDto,
  ValidDonationTypeProcedureCodesDto,
  UpdateValidDonationTypeProcedureCodesDto,
  AttributeCodeDropdown,
  ValidDonProcAttributeFiltersResponse
} from '../models/valid-donation-type-procedure-codes.model';
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

@Injectable({
  providedIn: 'root'
})
export class ValidDonationTypeProcedureCodesService {
  private readonly apiService = inject(ApiService);

  /**
   * Get Valid Donation Type/Procedure Codes list with pagination, sorting, and filtering
   * POST /api/v1/admin/valid-don-proc-attributes/{take}/{skip}
   * @param take - Number of records to fetch
   * @param skip - Number of records to skip
   * @param params - Filter and search parameters
   * @returns Observable with table data and total count
   */
  getValidDonationTypeProcedureCodes(
    take: number,
    skip: number,
    params: ValidDonationTypeProcedureCodesParamsDto
  ): Observable<{ data: ValidDonationTypeProcedureCodesModel[]; totalRecords: number }> {
    const endpoint = API.APPLICATION_ADMIN.VALID_DONATION_TYPE_PROCEDURE_CODES(take, skip);

    return this.apiService.post<ReturnResult<ValidDonationTypeProcedureCodesModel>>(endpoint, params).pipe(
      map(response => ({
        data: response.data || [],
        totalRecords: response.total || 0
      })),
      catchError(error => {
        console.error('Error fetching valid donation type/procedure codes data:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Add new attribute mapping
   * POST /api/v1/admin/valid-don-proc-attributes
   * @param payload - Attribute mapping data to add
   * @returns Observable with API response
   */
  addAttributeMapping(payload: ValidDonationTypeProcedureCodesDto): Observable<any> {
    const endpoint = API.APPLICATION_ADMIN.ADD_ATTRIBUTE_MAPPING;

    return this.apiService.post<any>(endpoint, payload).pipe(
      catchError(error => {
        console.error('Error adding attribute mapping:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update existing attribute mapping
   * PUT /api/v1/admin/valid-don-proc-attributes
   * @param payload - Updated attribute mapping data
   * @returns Observable with API response
   */
  updateAttributeMapping(payload: UpdateValidDonationTypeProcedureCodesDto): Observable<any> {
    const endpoint = API.APPLICATION_ADMIN.UPDATE_ATTRIBUTE_MAPPING;

    return this.apiService.put<any>(endpoint, payload).pipe(
      catchError(error => {
        console.error('Error updating attribute mapping:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get filter options for all dropdowns
   * GET /api/v1/admin/valid-don-proc-attribute-filters
   * @returns Observable with filter options for donation types, procedure codes, and attribute groups
   */
  getFilterOptions(): Observable<ValidDonProcAttributeFiltersResponse> {
    const endpoint = API.APPLICATION_ADMIN.VALID_DON_PROC_ATTRIBUTE_FILTERS;

    return this.apiService.get<ReturnResult<ValidDonProcAttributeFiltersResponse>>(endpoint).pipe(
      map(response => {
        // The response has data as an array with one object containing all filter options
        if (response.data && response.data.length > 0) {
          return response.data[0];
        }
        // Return empty arrays if no data
        return {
          donationTypes: [],
          procedureCodes: [],
          attribGroups: [],
          attribCodes: []
        };
      }),
      catchError(error => {
        console.error('Error fetching filter options:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get attribute codes for dropdown
   * GET /api/v1/admin/valid-don-proc-attributes/attribute-codes
   * @returns Observable with attribute codes array
   */
  getAttributeCodes(): Observable<AttributeCodeDropdown[]> {
    const endpoint = API.APPLICATION_ADMIN.ATTRIBUTE_MAPPING_ATTRIBUTE_CODES;

    return this.apiService.get<ReturnResult<AttributeCodeDropdown>>(endpoint).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error('Error fetching attribute codes:', error);
        return throwError(() => error);
      })
    );
  }
}
