import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';

/**
 * API Response wrapper from backend
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data: T[];
  total: number;
}

/**
 * Master Code List Item (used in main list view)
 * Does NOT include 'code' field - only has codeType
 */
export interface MasterCodeListItem {
  codeType: string;
  description: string;
  changeControlFlag: string;
  numericalValue: number | null;
  sequence1: number | null;
  sequence2: number | null;
  sequence3: number | null;
  effDate: Date | null;
  termDate: Date | null;
  lastModifiedDate: Date;
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
  numberalValue: number | null;
  numericalValue: number | null;
  sequence1: number | null;
  sequence2: number | null;
  sequence3: number | null;
  effDate: Date | null;
  termDate: Date | null;
  lastModifiedDate: Date;
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
  effectiveDate?: Date;
  terminationDate?: Date;
  effectiveDatePeriod?: 'BEFORE' | 'AFTER';
  terminationDatePeriod?: 'BEFORE' | 'AFTER';
  sort?: 'A' | 'D';
}

/**
 * Create Master Code Type Request (for parent code type)
 */
export interface CreateMasterCodeTypeRequest {
  codeType: string;
  description: string;
  effectiveDate: string;
  terminationDate?: string | null;
  changeControlFlag?: string;
}

/**
 * Update Master Code Type Request (for parent code type)
 */
export interface UpdateMasterCodeTypeRequest {
  description: string;
  effectiveDate: string;
  terminationDate?: string | null;
  numericalValue?: number;
  codeBehavior?: string;
  modificationDate?: Date;
}

/**
 * Create Individual Code Request (for codes within a code type)
 */
export interface CreateCodeRequest {
  codeType: string;
  code: string;
  description: string;
  effectiveDate: string;
  terminationDate?: string | null;
  sequence1?: number;
  sequence2?: number;
  sequence3?: number;
  numericalValue?: number;
  changeControlFlag?: string;
}

/**
 * Update Individual Code Request (for codes within a code type)
 */
export interface UpdateCodeRequest {
  codeType: string;
  code: string;
  description: string;
  effectiveDate: string;
  terminationDate?: string | null;
  sequence1?: number;
  sequence2?: number;
  sequence3?: number;
  NumericValue?: number;
}

@Injectable({
  providedIn: 'root'
})
export class DistributionMasterCodesService {
  private apiUrl = `${environment.apiUrl}/api/v1/distribution-master-codes`;
  private apiUrlCodeTypes = `${environment.apiUrl}/api/v1/distribution-master-code-types`;

  constructor(
    private http: HttpClient
  ) {}

  /**
   * Get all master codes with pagination, search, and sorting
   * @param take - number of records to take
   * @param skip - number of records to skip
   * @param filter - filter options
   * @returns Observable with data array and total count
   */
  getMasterCodes(chapterId: string, take: number = 10, skip: number = 0, filter?: MasterCodeFilter): Observable<{ data: MasterCodeListItem[], total: number }> {
    const url = `${this.apiUrl}/GetDistributionMasterCodes/${chapterId}/${take}/${skip}`;
    
    return this.http.post<ApiResponse<MasterCodeListItem>>(url, filter || {}).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message || 'Error loading distribution master codes');
        }
        return {
          data: response.data || [],
          total: response.total || 0
        };
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Get master codes by CodeType with pagination, search, and sorting
   * @param codeType - code type to filter by
   * @param take - number of records to take
   * @param skip - number of records to skip
   * @param filter - filter options
   * @returns Observable with data array and total count
   */
  getDistributionMasterCodesByType(codeType: string, take: number = 10, skip: number = 0, filter?: CodeTypeFilter): Observable<{ data: MasterCodeDetail[], total: number }> {
    const url = `${this.apiUrl}/${codeType}/${take}/${skip}`;
    
    return this.http.post<ApiResponse<MasterCodeDetail>>(url, filter || {}).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message || 'Error loading distribution master codes');
        }
        const mappedData = (response.data || []).map(item => ({
          ...item,
          numericalValue: item.numberalValue ?? item.numericalValue ?? null
        }));
        return {
          data: mappedData,
          total: response.total || 0
        };
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Create a new master code type (parent level)
   * @param codeTypeData - the code type data to create
   * @returns Observable of the created master code type
   */
  createMasterCodeType(chapterId: string, codeTypeData: CreateMasterCodeTypeRequest): Observable<any> {
    const url = `${this.apiUrl}/AddDistributionMasterCode/${chapterId}`;
    return this.http.post<any>(url, codeTypeData).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Update an existing master code type (parent level)
   * @param codeType - the code type to update
   * @param updateData - the update data
   * @returns Observable of the updated master code type
   */
  updateMasterCodeType(chapterId: string, codeType: string, updateData: UpdateMasterCodeTypeRequest): Observable<any> {
    const url = `${this.apiUrl}/UpdateDistributionMasterCode/${chapterId}/${codeType}`;

    return this.http.put<any>(url, updateData).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Create a new individual code within a code type
   * @param codeData - the code data to create
   * @returns Observable of the created code
   */
  createCode(codeData: CreateCodeRequest): Observable<MasterCodeDetail> {
    return this.http.post<MasterCodeDetail>(this.apiUrl, codeData).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Update an existing individual code within a code type
   * @param codeType - the code type
   * @param code - the code
   * @param updateData - the update data
   * @returns Observable of the updated code
   */
  updateCode(codeType: string, code: string, updateData: UpdateCodeRequest): Observable<MasterCodeDetail> {
    const url = `${this.apiUrl}/${codeType}/${code}`;

    return this.http.put<MasterCodeDetail>(url, updateData).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }
}