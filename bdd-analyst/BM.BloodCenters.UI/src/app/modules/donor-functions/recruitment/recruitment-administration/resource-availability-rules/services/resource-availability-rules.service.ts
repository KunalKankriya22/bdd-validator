import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import {
  ResourceAvailabilityRuleModel,
  ValidResourceModel,
  ResourceAvailabilitySummaryModel,
  ResourceAvailabilityRulesParamsDto,
  CreateResourceAvailabilityRuleDto,
  UpdateResourceAvailabilityRuleDto,
  WeekDayModel
} from '../models/resource-availability-rules.model';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';

interface ReturnResult<T> {
  success: boolean;
  message: string;
  error: string | null;
  statusCode: number;
  data: T[] | null;
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class ResourceAvailabilityRulesService {
  private readonly apiService = inject(ApiService);

  /**
   * Get resource availability rules for a specific resource
   * @param params Query parameters including chapterId, resourceCode, and showTerminated
   * @returns Observable of resource availability rules
   */
  getResourceAvailabilityRules(
    params: ResourceAvailabilityRulesParamsDto
  ): Observable<{ data: ResourceAvailabilityRuleModel[]; totalRecords: number }> {
    return this.apiService
      .post<ReturnResult<ResourceAvailabilityRuleModel>>(
        API.RESOURCE_AVAILABILITY.DETAILS,
        params
      )
      .pipe(
        map(res => ({
          data: res.data ?? [],
          totalRecords: res.total ?? 0
        }))
      );
  }

  /**
   * Get all valid resources for LOV
   * @returns Observable of valid resources
   */
  getValidResources(): Observable<ValidResourceModel[]> {
    return this.apiService
      .get<ReturnResult<ValidResourceModel>>(
        API.RESOURCE_AVAILABILITY.VALID_RESOURCES
      )
      .pipe(map(res => res.data ?? []));
  }

  /**
   * Get resource availability summary by day of week for all resources
   * @param chapterId Chapter identifier (optional query parameter)
   * @returns Observable of resource availability summary
   */
  getResourceAvailabilitySummary(
    chapterId?: string
  ): Observable<ResourceAvailabilitySummaryModel[]> {
    const url = chapterId
      ? `${API.RESOURCE_AVAILABILITY.ACTIVE_RESOURCES_SUMMARY}?chapterId=${encodeURIComponent(chapterId)}`
      : API.RESOURCE_AVAILABILITY.ACTIVE_RESOURCES_SUMMARY;

    return this.apiService
      .get<ReturnResult<ResourceAvailabilitySummaryModel>>(url)
      .pipe(map(res => res.data ?? []));
  }

  /**
   * Create a new resource availability rule
   * @param payload Resource availability rule data
   * @returns Observable of the created rule
   */
  createResourceAvailabilityRule(
    payload: CreateResourceAvailabilityRuleDto
  ): Observable<ReturnResult<ResourceAvailabilityRuleModel>> {
    return this.apiService.post(
      API.RESOURCE_AVAILABILITY.INSERT,
      payload
    );
  }

  /**
   * Update an existing resource availability rule
   * @param payload Updated resource availability rule data
   * @returns Observable of the updated rule
   */
  updateResourceAvailabilityRule(
    payload: UpdateResourceAvailabilityRuleDto
  ): Observable<ReturnResult<ResourceAvailabilityRuleModel>> {
    return this.apiService.put(
      API.RESOURCE_AVAILABILITY.UPDATE,
      payload
    );
  }

  /**
   * Get list of valid week days from API
   * @returns Observable of week day codes
   */
  getWeekDays(): Observable<string[]> {
    return this.apiService
      .get<any>(
        API.RESOURCE_AVAILABILITY.WEEK_DAYS_DROPDOWN
      )
      .pipe(
        map(res => {
          // Handle different possible response structures
          let weekDaysData: any[] = [];

          if (res?.data) {
            // Standard ReturnResult format with lowercase 'data'
            weekDaysData = Array.isArray(res.data) ? res.data : [];
          } else if (res?.Data) {
            // Capital D format
            weekDaysData = Array.isArray(res.Data) ? res.Data : [];
          } else if (Array.isArray(res)) {
            // Direct array response
            weekDaysData = res;
          } else {
            return [];
          }

          // Extract codes from the array
          const codes = weekDaysData.map(day => {
            if (typeof day === 'string') {
              // If it's just a string array
              return day;
            }
            // Handle object with different property names
            return day.weekDayCode || day.code || day.Code || day.value || day.Value || '';
          }).filter(code => code !== '');

          return codes;
        })
      );
  }

  /**
   * Get full week day objects from API (for displaying descriptions)
   * @returns Observable of week day objects
   */
  getWeekDayObjects(): Observable<WeekDayModel[]> {
    return this.apiService
      .get<any>(
        API.RESOURCE_AVAILABILITY.WEEK_DAYS_DROPDOWN
      )
      .pipe(
        map(res => {
          // Handle different possible response structures
          if (res?.data && Array.isArray(res.data)) {
            return res.data;
          } else if (res?.Data && Array.isArray(res.Data)) {
            return res.Data;
          } else if (Array.isArray(res)) {
            return res;
          }

          return [];
        })
      );
  }
}
