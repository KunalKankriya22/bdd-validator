import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';

/**
 * API Response wrapper from backend
 */
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
 * Master Code List Item (used in main list view)
 * The 'code' field contains the actual code value (MASTR, ADI, etc.)
 */
export interface MasterCodeListItem {
  code: string;  // The actual code value (mapped from backend's codeType)
  codeType?: string;  // Kept for backward compatibility
  description: string;
  changeControlFlag: string | null;
  numericalValue: number | null;
  sequence1: number | null;
  sequence2: number | null;
  sequence3: number | null;
  effDate: Date | null;
  termDate: Date | null;
  lastModifiedDate: Date | null;
  auditKey: number | null;

  // Calculated fields (not from API)
  status: string;
  isActive: boolean;
}

/**
 * Master Code Detail (used in code-type detail view)
 * Includes both 'codeType' AND 'code' fields
 */
export interface MasterCodeDetail {
  codeType: string;
  code: string;
  description: string;
  changeControlFlag: string;
  numericalValue: number | null;
  sequence1: number | null;
  sequence2: number | null;
  sequence3: number | null;
  effDate: Date | null;
  termDate: Date | null;
  lastModifiedDate: Date | null;
  auditKey: number | null;
  
  // Calculated fields (not from API)
  status: string;
  isActive: boolean;
}

/**
 * Filter for master codes list
 */
export interface MasterCodeFilter {
  searchKeyword?: string;
  effectiveDate?: Date;
  terminationDate?: Date;
  effectiveDatePeriod?: 'BEFORE' | 'AFTER';
  terminationDatePeriod?: 'BEFORE' | 'AFTER';
  sort?: 'A' | 'D';
}

/**
 * Filter for code-type detail view
 */
export interface CodeTypeFilter {
  searchKeyword?: string;
  effectiveDate?: Date | string;
  terminationDate?: Date | string;
  effectiveDatePeriod?: 'BEFORE' | 'AFTER';
  terminationDatePeriod?: 'BEFORE' | 'AFTER';
  sort?: 'A' | 'D';
  code?: string;
}

@Injectable({
  providedIn: 'root'
})
export class LabMasterCodesService {
  private readonly apiService = inject(ApiService);

  /**
   * Format date to YYYY-MM-DD format without timezone conversion
   * @param date Date object
   * @returns Date string in YYYY-MM-DD format
   */
  private formatDateOnly(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Get all master codes with pagination, search, and sorting
   * @param take - number of records to take
   * @param skip - number of records to skip
   * @param filter - filter options
   * @returns Observable with data array and total count
   */
  getMasterCodes(
    take: number = 10,
    skip: number = 0,
    filter?: MasterCodeFilter
  ): Observable<{ data: MasterCodeListItem[], total: number }> {
    const endpoint = API.LAB_MASTER_CODES.GET_ALL(take, skip);

    // Format dates properly
    const apiFilter: any = {};
    if (filter) {
      if (filter.searchKeyword) {
        apiFilter.searchKeyword = filter.searchKeyword;
      }
      if (filter.effectiveDate) {
        apiFilter.effectiveDate = DateFieldValidationUtility.serializeDateForApi(filter.effectiveDate);
      }
      if (filter.terminationDate) {
        apiFilter.terminationDate = DateFieldValidationUtility.serializeDateForApi(filter.terminationDate);
      }
      if (filter.effectiveDatePeriod) {
        apiFilter.effectiveDatePeriod = filter.effectiveDatePeriod;
      }
      if (filter.terminationDatePeriod) {
        apiFilter.terminationDatePeriod = filter.terminationDatePeriod;
      }
      if (filter.sort) {
        apiFilter.sort = filter.sort;
      }
    }

    return this.apiService.post<ReturnResult<any>>(endpoint, apiFilter).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message || 'Error loading lab master codes');
        }
        const mapped = (response.data || []).map(item => ({
          code: item.code,
          codeType: item.codeType,
          description: item.codeDesc,
          changeControlFlag: item.changeControlFlag ?? null,
          numericalValue: null,
          sequence1: null,
          sequence2: item.sequence2 ?? null,
          sequence3: item.sequence3 ?? null,
          effDate: item.effDate,
          termDate: item.termDate ?? null,
          lastModifiedDate: item.lastModifiedDate ?? null,
          auditKey: item.auditKey,
          status: '',
          isActive: true
        }));
        return {
          data: mapped,
          total: response.total || 0
        };
      }),
      catchError(error => {
        console.error('Error fetching lab master codes:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get master codes by CodeType with pagination, search, and sorting
   * @param codeType - code type to filter by (passed in URL path and request body)
   * @param take - number of records to take
   * @param skip - number of records to skip
   * @param filter - filter options
   * @returns Observable with data array and total count
   */
  getLabMasterCodesByType(
    codeType: string,
    take: number = 10,
    skip: number = 0,
    filter?: CodeTypeFilter
  ): Observable<{ data: MasterCodeDetail[], total: number }> {
    const endpoint = API.LAB_MASTER_CODES.GET_BY_CODE_TYPE(codeType, take, skip);

    // Build request payload - include code field
    const apiFilter: any = {
      code: codeType
    };

    if (filter) {
      // Only include non-null/undefined/empty values
      if (filter.searchKeyword && filter.searchKeyword.trim() !== '') {
        apiFilter.searchKeyword = filter.searchKeyword;
      }
      if (filter.effectiveDate) {
        apiFilter.effectiveDate = typeof filter.effectiveDate === 'string'
          ? filter.effectiveDate
          : DateFieldValidationUtility.serializeDateForApi(filter.effectiveDate);
      }
      if (filter.terminationDate) {
        apiFilter.terminationDate = typeof filter.terminationDate === 'string'
          ? filter.terminationDate
          : DateFieldValidationUtility.serializeDateForApi(filter.terminationDate);
      }
      if (filter.effectiveDatePeriod && filter.effectiveDatePeriod.trim() !== '') {
        apiFilter.effectiveDatePeriod = filter.effectiveDatePeriod;
      }
      if (filter.terminationDatePeriod && filter.terminationDatePeriod.trim() !== '') {
        apiFilter.terminationDatePeriod = filter.terminationDatePeriod;
      }
      if (filter.sort && filter.sort.trim() !== '') {
        apiFilter.sort = filter.sort;
      }
    }

    console.log('API Request Endpoint:', endpoint);
    console.log('API Request Payload:', JSON.stringify(apiFilter, null, 2));

    return this.apiService.post<any>(endpoint, apiFilter).pipe(
      map((response: any) => {
        console.log('API Response:', response);

        // Extract items and total from response
        const items = response.items || [];
        const total = response.total || 0;

        // Map backend response to frontend model
        const mapped = items.map((item: any) => ({
          codeType: item.codeType,
          code: item.code,
          description: item.codeDesc,
          effDate: item.effDate,
          termDate: item.termDate ?? null,
          lastModifiedDate: item.lastModifiedDate ?? null,
          auditKey: item.auditKey,
          changeControlFlag: item.changeControlFlag ?? null,
          numericalValue: item.numericalValue ?? null,
          sequence1: item.sequence1 ?? null,
          sequence2: item.sequence2 ?? null,
          sequence3: item.sequence3 ?? null,
          status: '',
          isActive: true
        }));

        return {
          data: mapped,
          total: total
        };
      }),
      catchError(error => {
        console.error('Error fetching lab master codes by type:', error);
        return throwError(() => error);
      })
    );
  }

  // Note: CRUD operations (create, update, delete) are not implemented yet
  // They will be added when Add/Edit dialog is implemented
}
