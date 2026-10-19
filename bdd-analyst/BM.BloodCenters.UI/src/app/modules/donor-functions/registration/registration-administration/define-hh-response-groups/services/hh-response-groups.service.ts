import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpHeaders } from '@angular/common/http';
import {
  HHResponseGroupModel,
  HHResponseParamsDto,
  HHResponseFilterLov,
  HHResponseAddDropdownLov,
  HHQuestionModel,
  HHResponseGroupCreateDto,
  HHResponseGroupUpdateDto,
  ApiResponse
} from '../models/hh-response-groups.model';
import { ApiService } from '@shared/services/api.service';
import { HeaderService } from '@shared/services/header.service';

/**
 * Service for HH Response Groups
 * Integrates with backend API endpoints
 */
@Injectable({
  providedIn: 'root'
})
export class HHResponseGroupsService {
  private readonly apiService = inject(ApiService);
  private readonly headerService = inject(HeaderService);
  private readonly BASE_URL = '/api/v1/donor/hh-response-groups';
  private readonly QUESTIONS_URL = '/api/v1/donor/hh-questions';


  /**
   * Get HTTP headers with chapterId
   */
  private getHeaders(): HttpHeaders {
    const chapterId = this.headerService.chapterId();
    return new HttpHeaders({
      'X-Chapter-Id': chapterId
    });
  }

  /**
   * Get HH Response Groups with pagination and filters
   * POST /api/v1/donor/hh-response-groups/{take}/{skip}
   * @param take - Number of records to fetch
   * @param skip - Number of records to skip
   * @param params - Filter and search parameters
   * @returns Observable with table data and total count
   */
  getResponseGroups(
    take: number,
    skip: number,
    params: HHResponseParamsDto
  ): Observable<{ data: HHResponseGroupModel[]; totalRecords: number }> {
    const url = `${this.BASE_URL}/${take}/${skip}`;
    const headers = this.getHeaders();

    return this.apiService.post<ApiResponse<HHResponseGroupModel>>(url, params, { headers }).pipe(
      map(response => ({
        data: response.data || [],
        totalRecords: response.total || 0
      }))
    );
  }

  /**
   * Get filter dropdown values (LOV)
   * GET /api/v1/donor/hh-response-groups/filter-dropdown
   * @returns Observable with filter options
   */
  getFilterDropdowns(): Observable<HHResponseFilterLov> {
    const url = `${this.BASE_URL}/filter-dropdown`;
    const headers = this.getHeaders();

    return this.apiService.get<any>(url, { headers }).pipe(
      map(response => {
        // Extract data from wrapper - nested as data: [[{actual data}]]
        const actualData = response?.data?.[0] || {};
        return actualData;
      })
    );
  }

  /**
   * Get add/edit dropdown values (LOV)
   * GET /api/v1/donor/hh-response-groups/add-dropdown
   * @returns Observable with add dropdown options
   */
  getAddDropdowns(): Observable<HHResponseAddDropdownLov> {
    const url = `${this.BASE_URL}/add-dropdown`;
    const headers = this.getHeaders();

    return this.apiService.get<any>(url, { headers }).pipe(
      map(response => {
        // Extract data from wrapper - nested as data: [[{actual data}]]
        const actualData = response?.data?.[0] || {};
        return actualData;
      })
    );
  }

  /**
   * Get list of health history questions for sidebar
   * GET /api/v1/donor/hh-questions/list?limit=10
   * @param limit - Maximum number of questions to retrieve (default: 10)
   * @returns Observable with question list
   */
  getQuestionsList(responseCode?: string): Observable<HHQuestionModel[]> {
    let url = `${this.QUESTIONS_URL}/list`;
    if (responseCode) {
      url += `?responseCode=${encodeURIComponent(responseCode)}`;
    }
    const headers = this.getHeaders();

    return this.apiService.get<any>(url, { headers }).pipe(
      map(response => {
        // Extract data from wrapper - it's nested as data: [[{questions}]]
        const actualData = response?.data?.[0] || [];
        // Return as array
        return Array.isArray(actualData) ? actualData : [];
      })
    );
  }

  /**
   * Add new HH Response Group
   * POST /api/v1/donor/hh-response-groups
   * @param data - Response group data
   * @returns Observable with result
   */
  addResponseGroup(data: HHResponseGroupCreateDto): Observable<ApiResponse<string>> {
    const url = this.BASE_URL;
    const headers = this.getHeaders();

    return this.apiService.post<ApiResponse<string>>(url, data, { headers });
  }

  /**
   * Update existing HH Response Group
   * PUT /api/v1/donor/hh-response-groups
   * @param data - Response group data
   * @returns Observable with result
   */
  updateResponseGroup(data: HHResponseGroupUpdateDto): Observable<ApiResponse<string>> {
    const url = this.BASE_URL;
    const headers = this.getHeaders();

    return this.apiService.put<ApiResponse<string>>(url, data, { headers });
  }

  /**
   * Delete HH Response Group
   * DELETE /api/v1/donor/hh-response-groups/{groupCode}/{chapterId}
   * @param groupCode - Group code to delete
   * @param chapterId - Chapter ID
   * @returns Observable with result
   */
  deleteResponseGroup(groupCode: string, chapterId: string): Observable<ApiResponse<string>> {
    const url = `${this.BASE_URL}/${groupCode}/${chapterId}`;
    const headers = this.getHeaders();

    return this.apiService.delete<ApiResponse<string>>(url, { headers });
  }
}
