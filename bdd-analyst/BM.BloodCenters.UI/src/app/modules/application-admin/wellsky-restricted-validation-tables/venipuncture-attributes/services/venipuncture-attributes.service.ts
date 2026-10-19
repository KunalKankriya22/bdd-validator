import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  VenipunctureAttributesModel,
  VenipunctureAttributesParamsDto,
  VenipunctureAttributesFilterLov,
  VenipunctureAttributesDto,
  UpdateVenipunctureAttributesDto
} from '../models/venipuncture-attributes.model';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import { LoginService } from '@shared/services/login.service';

interface ReturnResult<T> {
  success?: boolean;
  message?: string;
  error?: string;
  statusCode?: number;
  data?: T[];
  item?: T;
  total?: number;
}

interface VenipunctureAttributesApiResponse {
  group?: string;
  code?: string;
  description?: string;
  effDate?: string | Date | null;
  termDate?: string | Date | null;
  insertDate?: string | Date | null;
  lastModifiedDate?: string | Date | null;
}

@Injectable({
  providedIn: 'root'
})
export class VenipunctureAttributesService {
  private readonly apiService = inject(ApiService);
  private readonly loginService = inject(LoginService);

  /**
   * Get Venipuncture Attributes table data with pagination
   * POST /api/v1/venipuncture-attributes/{take}/{skip}
   * @param take - Number of records to fetch
   * @param skip - Number of records to skip
   * @param params - Filter and search parameters
   * @returns Observable with table data and total count
   */
  getVenipunctureAttributes(
    take: number,
    skip: number,
    params: VenipunctureAttributesParamsDto
  ): Observable<{ data: VenipunctureAttributesModel[]; totalRecords: number }> {
    const endpoint = API.APPLICATION_ADMIN.VENIPUNCTURE_ATTRIBUTES(take, skip);

    return this.apiService.post<ReturnResult<VenipunctureAttributesApiResponse>>(endpoint, params).pipe(
      map(response => {
        const mappedData: VenipunctureAttributesModel[] = (response.data || []).map(item => ({
          group: item.group,
          code: item.code,
          description: item.description,
          effectiveDate: item.effDate ? new Date(item.effDate) : null,
          terminationDate: item.termDate ? new Date(item.termDate) : null
        }));

        return {
          data: mappedData,
          totalRecords: response.total || response.data?.length || 0
        };
      }),
      catchError(error => {
        console.error('Error fetching venipuncture attributes data:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get filter dropdown values (LOV)
   * GET /api/v1/venipuncture-attributes/codes
   * @returns Observable with filter options
   */
  getVenipunctureAttributesFilters(): Observable<ReturnResult<VenipunctureAttributesFilterLov>> {
    const endpoint = API.APPLICATION_ADMIN.VENIPUNCTURE_ATTRIBUTES_FILTERS;

    return this.apiService.get<{ success: boolean; message: string; data: { code: string }[] }>(endpoint).pipe(
      map(response => {
        // Extract code values from the array of objects
        const codes = response.data?.map(item => item.code) || [];

        return {
          success: response.success,
          message: response.message,
          data: [{ code: codes }]
        };
      }),
      catchError(error => {
        console.error('Error fetching venipuncture attributes filters:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get single Venipuncture Attribute by Group and Code
   * GET /api/v1/venipuncture-attributes/{Group}/{Code}
   * @param group - Group code
   * @param code - Attribute code
   * @returns Observable with venipuncture attribute data
   */
  getVenipunctureAttributeByGroupAndCode(group: string, code: string): Observable<VenipunctureAttributesModel> {
    const endpoint = API.APPLICATION_ADMIN.VENIPUNCTURE_ATTRIBUTES_GET(group, code);

    return this.apiService.get<VenipunctureAttributesApiResponse>(endpoint).pipe(
      map(response => ({
        group: response.group || group, // Use group from response if available, otherwise use parameter
        code: response.code,
        description: response.description,
        effectiveDate: response.effDate ? new Date(response.effDate) : null,
        terminationDate: response.termDate ? new Date(response.termDate) : null,
        lastModifiedDate: response.lastModifiedDate ? new Date(response.lastModifiedDate) : null
      })),
      catchError(error => {
        console.error('Error fetching venipuncture attribute:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Add new Venipuncture Attribute
   * POST /api/v1/venipuncture-attributes
   * @param data - Venipuncture attribute data
   * @returns Observable with result
   */
  addVenipunctureAttribute(data: VenipunctureAttributesDto): Observable<ReturnResult<VenipunctureAttributesModel>> {
    const endpoint = API.APPLICATION_ADMIN.VENIPUNCTURE_ATTRIBUTES_ADD;

    // Get current user from cookie
    const currentUser = this.loginService.getStoredUsername() || 'DONSYS';

    // Format dates to DD-MMM-YYYY format
    const payload = {
      group: data.group,
      code: data.code,
      description: data.description,
      effectiveDate: this.formatDateForApi(data.effectiveDate),
      terminationDate: data.terminationDate ? this.formatDateForApi(data.terminationDate) : null,
      insertUser: currentUser
    };

    return this.apiService.post<ReturnResult<VenipunctureAttributesModel>>(endpoint, payload).pipe(
      catchError(error => {
        console.error('Error adding venipuncture attribute:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update existing Venipuncture Attribute
   * PUT /api/v1/venipuncture-attributes/{Group}/{Code}
   * @param data - Venipuncture attribute data
   * @returns Observable with result
   */
  updateVenipunctureAttribute(data: UpdateVenipunctureAttributesDto): Observable<ReturnResult<VenipunctureAttributesModel>> {
    const endpoint = API.APPLICATION_ADMIN.VENIPUNCTURE_ATTRIBUTES_UPDATE(data.currentGroup, data.currentCode);

    // Format dates to DD-MMM-YYYY format
    const payload = {
      group: data.group,
      code: data.code,
      description: data.description,
      effectiveDate: this.formatDateForApi(data.effectiveDate),
      terminationDate: data.terminationDate ? this.formatDateForApi(data.terminationDate) : null
    };

    return this.apiService.put<ReturnResult<VenipunctureAttributesModel>>(endpoint, payload).pipe(
      catchError(error => {
        console.error('Error updating venipuncture attribute:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get group dropdown values
   * GET /api/v1/venipuncture-attributes/groups
   * @returns Observable with group options
   */
  getVenipunctureAttributesGroups(): Observable<{ groupName: string; groupDesc: string }[]> {
    const endpoint = API.APPLICATION_ADMIN.VENIPUNCTURE_ATTRIBUTES_GROUPS;

    return this.apiService.get<{ success: boolean; message: string; data: { groupName: string; groupDesc: string }[]; total: number }>(endpoint).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error('Error fetching venipuncture attributes groups:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Format date to DD-MMM-YYYY format (e.g., "12-Feb-2025")
   * @param date - Date object or null
   * @returns Formatted date string or null
   */
  private formatDateForApi(date: Date | null | undefined): string | null {
    if (!date) return null;

    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[d.getMonth()];
    const year = d.getFullYear();

    return `${day}-${month}-${year}`;
  }
}
