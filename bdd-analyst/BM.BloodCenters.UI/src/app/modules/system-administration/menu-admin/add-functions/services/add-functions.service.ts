import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../environments/environment';

export interface AddFunction {
  fcnId: string;
  fcnIcon: string;
  fcnUrl: string;
  execName: string;
  fcnType: string;
  fcnScope: string;
  p1Name: string;
  p2Name: string;
  p3Name: string;
  remarks: string;
}

export interface AddFunctionsResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: AddFunction[];
  total: number;
}

export interface AddFunctionsFilter {
  searchKeyword?: string;
  functionType?: string;
  scope?: string;
  sortColumn?: string;
  sortDirection?: string;
}

export interface AddFunctionsFiltersResponse {
  functionTypes: string[];
  functionScopes: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AddFunctionsService {
  private readonly baseUrl = environment.apiUrl;
  private readonly endpoint = '/api/v1/system-admin/add-functions';

  constructor(private http: HttpClient) {}

  /**
   * Get filter options for function types and scopes
   * @returns Observable of AddFunctionsFiltersResponse
   */
  getFilters(): Observable<AddFunctionsFiltersResponse> {
    return this.http.get<AddFunctionsFiltersResponse>(`${this.baseUrl}${this.endpoint}/filters`);
  }

  /**
   * Get add functions with pagination and filters
   * @param skip - Number of records to skip
   * @param take - Number of records to take
   * @param filter - Optional filter criteria
   * @returns Observable of AddFunctionsResponse
   */
  getAddFunctions(
    skip: number = 0,
    take: number = 10,
    filter?: AddFunctionsFilter
  ): Observable<AddFunctionsResponse> {
    let params = new HttpParams()
      .set('Skip', skip.toString())
      .set('Take', take.toString());

    // Add filter parameters as query params
    if (filter?.searchKeyword) {
      params = params.set('SearchKeyword', filter.searchKeyword);
    }
    if (filter?.functionType) {
      params = params.set('FcnType', filter.functionType);
    }
    if (filter?.scope) {
      params = params.set('FcnScope', filter.scope);
    }
    if (filter?.sortColumn) {
      params = params.set('SortColumn', filter.sortColumn);
    }
    if (filter?.sortDirection) {
      params = params.set('Sort', filter.sortDirection);
    }

    return this.http.get<AddFunctionsResponse>(`${this.baseUrl}${this.endpoint}`, { params });
  }

  /**
   * Create a new add function
   * @param functionData - The function data to create
   * @returns Observable of the created function
   */
  createAddFunction(functionData: Partial<AddFunction>): Observable<any> {
    return this.http.post(`${this.baseUrl}${this.endpoint}`, functionData);
  }

  /**
   * Update an existing add function
   * @param functionData - The function data to update
   * @returns Observable of the updated function
   */
  updateAddFunction(functionData: AddFunction): Observable<any> {
    return this.http.put(`${this.baseUrl}${this.endpoint}`, functionData);
  }

  /**
   * Delete an add function
   * @param executableName - The executable name of the function to delete
   * @returns Observable of the deletion result
   */
  deleteAddFunction(executableName: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}${this.endpoint}/${executableName}`);
  }
}
