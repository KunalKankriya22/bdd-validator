import { Injectable, inject } from '@angular/core';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  DriveCategoryRuleModel,
  DriveCategoryRuleQueryDto,
  CreateDriveCategoryRuleRequestDto,
  UpdateDriveCategoryRuleRequestDto,
  DriveCategoryRuleCategoryDto,
  ApiResponse
} from '../models/drive-category-rules.model';
import { ApiService } from '@shared/services/api.service';
import { HeaderService } from '@shared/services/header.service';

@Injectable({
  providedIn: 'root'
})
export class DriveCategoryRulesService {
  private readonly apiService = inject(ApiService);
  private readonly headerService = inject(HeaderService);
  private readonly BASE_URL = '/api/v1/drive-category-rules';

  /**
   * Get drive category rules data with pagination
   * POST /api/drive-category-rules/{take}/{skip}
   * @param take - Number of records to fetch
   * @param skip - Number of records to skip
   * @param query - Filter and search parameters
   * @returns Observable with table data and total count
   */
  getDriveCategoryRules(
    take: number,
    skip: number,
    query: DriveCategoryRuleQueryDto
  ): Observable<{ data: DriveCategoryRuleModel[]; totalRecords: number }> {
    const endpoint = `${this.BASE_URL}/${take}/${skip}`;
    const requestBody = { ...query, chapterId: this.headerService.getCurrentChapterId() };
    return this.apiService.post<ApiResponse<DriveCategoryRuleModel>>(
      endpoint,
      requestBody
    ).pipe(
      map(response => ({
        data: response.data || [],
        totalRecords: response.total || 0
      })),
      catchError(error => {
        // Handle 404 as empty result when API indicates success
        if (error.status === 404 && error.error?.success === true) {
          return of({
            data: [],
            totalRecords: 0
          });
        }

        console.error('Error fetching drive category rules data:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get single drive category rule by ID and category
   * GET /api/drive-category-rules/{ruleId}/{driveCategory}
   * @param ruleId - Rule ID
   * @param driveCategory - Drive Category
   * @returns Observable with rule data
   */
  getDriveCategoryRule(ruleId: string, driveCategory: string): Observable<DriveCategoryRuleModel> {
    const endpoint = `${this.BASE_URL}/${ruleId}/${driveCategory}`;
    return this.apiService.get<ApiResponse<DriveCategoryRuleModel>>(endpoint).pipe(
      map(response => response.data && response.data.length > 0 ? response.data[0] : {} as DriveCategoryRuleModel),
      catchError(error => {
        console.error('Error fetching drive category rule:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Create new drive category rule
   * POST /api/drive-category-rules
   * @param data - Drive category rule data
   * @returns Observable with result
   */
  createDriveCategoryRule(data: CreateDriveCategoryRuleRequestDto): Observable<ApiResponse<string>> {
    const endpoint = this.BASE_URL;
    const requestBody = { ...data, chapterId: this.headerService.getCurrentChapterId() };
    return this.apiService.post<ApiResponse<string>>(endpoint, requestBody).pipe(
      catchError(error => {
        console.error('Error creating drive category rule:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update existing drive category rule
   * PUT /api/drive-category-rules/{ruleId}/{driveCategory}
   * @param ruleId - Rule ID
   * @param driveCategory - Drive Category
   * @param data - Drive category rule data
   * @returns Observable with result
   */
  updateDriveCategoryRule(
    ruleId: string,
    driveCategory: string,
    data: UpdateDriveCategoryRuleRequestDto
  ): Observable<ApiResponse<string>> {
    const endpoint = `${this.BASE_URL}/${ruleId}/${driveCategory}`;
    const requestBody = { ...data, chapterId: this.headerService.getCurrentChapterId() };
    return this.apiService.put<ApiResponse<string>>(endpoint, requestBody).pipe(
      catchError(error => {
        console.error('Error updating drive category rule:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get next available Rule ID
   * GET /api/drive-category-rules/generate-rule-id
   * @returns Observable with next rule ID
   */
  getNextRuleId(): Observable<string> {
    const endpoint = `${this.BASE_URL}/generate-rule-id`;
    return this.apiService.get<{ ruleId: string }>(endpoint).pipe(
      map(response => response.ruleId || ''),
      catchError(error => {
        console.error('Error fetching next rule ID:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get category dropdown options
   * GET /api/drive-category-rules/categories
   * @returns Observable with category options
   */
  getCategories(): Observable<DriveCategoryRuleCategoryDto[]> {
    const endpoint = `${this.BASE_URL}/categories`;
    return this.apiService.get<{ data: DriveCategoryRuleCategoryDto[] }>(endpoint).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error('Error fetching categories:', error);
        return throwError(() => error);
      })
    );
  }
}
