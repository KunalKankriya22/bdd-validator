import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../../../shared/services/api.service';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';

export interface ApiResponse<T> {
  data: T;
  message: string;
  statusCode: number;
  success: boolean;
  total?: number;
}

export interface MasterCode {
  id: string;
  codeType: string;
  code: string;
  description: string;
  effDate: Date;
  termDate: Date | null;
  status: string;
  isActive: boolean;
  changeControlFlag: string;
  lastModifiedDate?: Date;
}

export interface CodeType {
  code: string;
  codeType: string;
  description: string;
  effDate: Date;
  termDate: Date | null;
  insertDate?: Date;
  insertUser?: string;
  auditKey?: number;
  status?: string;
  numberalValue?: number;
  sequence1?: number;
  sequence2?: number;
  sequence3?: number;
  changeControlFlag?: string;
  lastModifiedDate?: Date;
}

export interface MasterCodeFilter {
  code?: string;
  codeType?: string;
  searchKeyword?: string;
  effectiveDate?: Date;
  terminationDate?: Date;
  effectiveDatePeriod?: 'BEFORE' | 'AFTER';
  terminationDatePeriod?: 'BEFORE' | 'AFTER';
  sort?: 'A' | 'D';
}

export interface CodeTypeFilter {
  code?: string;
  codeType?: string;
  searchKeyword?: string;
  effectiveDate?: Date;
  terminationDate?: Date;
  effectiveDatePeriod?: 'BEFORE' | 'AFTER';
  terminationDatePeriod?: 'BEFORE' | 'AFTER';
  sort?: 'A' | 'D';
}

export interface CreateCodeTypeRequest {
  codeType: string;
  description: string;
  effectiveDate: Date | string;
  terminationDate?: Date | string | null;
  changeControlFlag: string;
  loggedInUserName: string;
  chapterId: string;
}

export interface CreateCodeRequest {
  codeType: string;
  code: string;
  description: string;
  effectiveDate: Date | string;
  terminationDate?: Date | string | null;
  sequence1?: number;
  sequence2?: number;
  sequence3?: number;
  numericalValue?: number;
  codeBehavior?: string;
  changeControlFlag: string;
  loggedInUserName: string;
  chapterId: string;
}

export interface CodeTypeResponse {
  codeType: string;
  description: string;
  termDate: Date | null;
  items: CodeType[];
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class DonorMasterCodesService {
  private apiUrl = '/api/v1/donor-master-codes';
  private apiUrl1 = '/api/v1/donor-master-code-types';

  constructor(private apiService: ApiService) {}

  /**
   * Get all master codes with pagination, search, and sorting
   * @param take - number of records to take
   * @param skip - number of records to skip
   * @param filter - filter options
   */
  getMasterCodes(take: number = 10, skip: number = 0, filter?: MasterCodeFilter): Observable<{data: MasterCode[]; total: number}> {
    const url = `${this.apiUrl}/${take}/${skip}`;
    const requestBody = filter ? {
      ...filter,
      effectiveDate: DateFieldValidationUtility.serializeDateForApi(filter.effectiveDate ?? null),
      terminationDate: DateFieldValidationUtility.serializeDateForApi(filter.terminationDate ?? null),
    } : {};
    return this.apiService.post<ApiResponse<MasterCode[]>>(url, requestBody).pipe(
      map(response => ({
        data: response.data || [],
        total: response.total || 0
      }))
    );
  }

  /**
   * Get master codes by CodeType with pagination, search, and sorting
   * @param codeType - code type to filter by
   * @param take - number of records to take
   * @param skip - number of records to skip
   * @param filter - filter options
   */
  getMasterCodesByType(codeType: string, take: number = 10, skip: number = 0, filter?: CodeTypeFilter): Observable<CodeTypeResponse> {
    const url = `${this.apiUrl}/${codeType}/${take}/${skip}`;
    const requestBody = filter ? {
      ...filter,
      effectiveDate: DateFieldValidationUtility.serializeDateForApi(filter.effectiveDate ?? null),
      terminationDate: DateFieldValidationUtility.serializeDateForApi(filter.terminationDate ?? null),
    } : {};
    return this.apiService.post<CodeTypeResponse>(url, requestBody).pipe(
      map(response => ({
        codeType: response.codeType,
        description: response.description,
        termDate: response.termDate,
        items: response.items || [],
        total: response.total || 0
      }))
    );
  }

  /**
   * Get master codes by Code with pagination, search, and sorting
   * @param code - code to filter by (query parameter)
   * @param take - number of records to take
   * @param skip - number of records to skip
   * @param filter - filter options
   */
  getMasterCodesByCode(code: string, take: number = 25, skip: number = 0, filter?: CodeTypeFilter): Observable<ApiResponse<CodeType[]>> {
    const url = `${this.apiUrl}/by-code/${take}/${skip}?code=${encodeURIComponent(code)}`;
    const requestBody = {
      searchKeyword: filter?.searchKeyword || '',
      effectiveDate: DateFieldValidationUtility.serializeDateForApi(filter?.effectiveDate ?? null),
      terminationDate: DateFieldValidationUtility.serializeDateForApi(filter?.terminationDate ?? null),
      effectiveDatePeriod: filter?.effectiveDatePeriod || 'AFTER',
      terminationDatePeriod: filter?.terminationDatePeriod || 'BEFORE',
      sort: filter?.sort
    };
    return this.apiService.post<ApiResponse<CodeType[]>>(url, requestBody);
  }

  /**
   * Get master code by id
   */
  getMasterCodeById(id: string): Observable<MasterCode> {
    return this.apiService.get<MasterCode>(`${this.apiUrl}/${id}`);
  }

  /**
   * Create a new master code type
   * POST /api/v1/donor-master-code-types
   */
  createMasterCode(code: CreateCodeTypeRequest): Observable<ApiResponse<CodeType>> {
    return this.apiService.post<ApiResponse<CodeType>>(this.apiUrl1, code);
  }

  /**
   * Create a new code (within a code type)
   * POST /api/v1/donor-master-codes
   */
  createCode(code: CreateCodeRequest): Observable<ApiResponse<CodeType>> {
    return this.apiService.post<ApiResponse<CodeType>>(this.apiUrl, code);
  }

  /**
   * Update an existing master code type (Edit Code Type - from master codes grid)
   * PUT /api/v1/donor-master-code-types/{codeType}/{code}
   * @param codeType - the code type
   * @param code - the code
   * @param updateData - the update data (description, effectiveDate, terminationDate, chapterId, loggedInUserName)
   */
  updateMasterCode(codeType: string, code: string, updateData: any): Observable<any> {
    const url = `${this.apiUrl1}/${encodeURIComponent(codeType)}/${encodeURIComponent(code)}`;
    return this.apiService.put<any>(url, updateData);
  }

  /**
   * Update an existing code (Edit Code - from view button -> edit icon in row)
   * PUT /api/v1/donor-master-codes/{codeType}/{code}
   * @param codeType - the code type
   * @param code - the code
   * @param updateData - the update data (description, effectiveDate, terminationDate, sequence1, sequence2, sequence3, numericalValue, chapterId, loggedInUserName)
   */
  updateCode(codeType: string, code: string, updateData: any): Observable<any> {
    const url = `${this.apiUrl}/${encodeURIComponent(codeType)}/${encodeURIComponent(code)}`;
    return this.apiService.put<any>(url, updateData);
  }

   createCodeType(code: CodeType): Observable<CodeType> {
    return this.apiService.post<CodeType>(this.apiUrl, code);
  }

  /**
   * Update an existing master code
   */
  updateCodeType(id: string, code: CodeType): Observable<CodeType> {
    return this.apiService.put<CodeType>(`${this.apiUrl}/${id}`, code);
  }


  /**
   * Get code types by code
   */
  getCodeTypesByCode(code: string): Observable<MasterCode[]> {
    return this.apiService.get<MasterCode[]>(`${this.apiUrl}/${code}/code-types`);
  }

}