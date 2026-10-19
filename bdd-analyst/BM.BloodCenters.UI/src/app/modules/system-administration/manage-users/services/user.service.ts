import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from '../../../../shared/services/api.service';
import { API } from '../../../../core/constants/api.constants';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import moment from 'moment';
import {
  ChapterLookup,
  WarehouseLookup,
  LabCodeLookup,
  PrinterCodeLookup,
  GroupLookup,
  AccessLevelLookup,
  CreateUserRequest,
  UpdateUserRequest,
  UserDetailsResponse,
  UserGroupDetails,
  UserChapterDetail,
  ApiResponse
} from '../models/service.model';
@Injectable({
  providedIn: 'root'
})
export class UserApiService {
  private apiService = inject(ApiService);

  /**
   * Get chapters lookup data
   * GET /api/v1/chapters/lookup
   */
  getChapters(chapterId?: string): Observable<ChapterLookup[]> {
    const base = API.SYSTEM_ADMIN.MANAGE_USERS.ADD_NEW_USER.CHAPTER_LOOKUP;
    const endpoint = chapterId ? `${base}?chapterId=${encodeURIComponent(chapterId)}` : base;
    return this.apiService.get<ChapterLookup[]>(endpoint).pipe(
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Get warehouses lookup data
   * GET /api/v1/system-users/GetWarehouses
   */
  getWarehouses(chapterId?: string): Observable<WarehouseLookup[]> {
    const base = API.SYSTEM_ADMIN.MANAGE_USERS.ADD_NEW_USER.WAREHOUSE_LOOKUP;
    const endpoint = chapterId ? `${base}?chapterId=${encodeURIComponent(chapterId)}` : base;
    return this.apiService.get<WarehouseLookup[]>(endpoint).pipe(
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Get lab codes lookup data
   * GET /api/v1/system-users/GetLabCodes
   */
  getLabCodes(chapterId?: string): Observable<LabCodeLookup[]> {
    const base = API.SYSTEM_ADMIN.MANAGE_USERS.ADD_NEW_USER.LABCODE_LOOKUP;
    const endpoint = chapterId ? `${base}?chapterId=${encodeURIComponent(chapterId)}` : base;
    return this.apiService.get<LabCodeLookup[]>(endpoint).pipe(
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Get printer codes lookup data
   * GET /api/v1/system-users/GetPrinterCodes
   */
  getPrinterCodes(): Observable<PrinterCodeLookup[]> {
    const endpoint = API.SYSTEM_ADMIN.MANAGE_USERS.ADD_NEW_USER.PRINTER_LOOKUP;
    return this.apiService.get<PrinterCodeLookup[]>(endpoint).pipe(
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Get groups lookup data
   * GET /api/v1/groups
   */
  getGroups(): Observable<GroupLookup[]> {
    const endpoint = API.SYSTEM_ADMIN.MANAGE_USERS.ADD_NEW_USER.GROUP_LOOKUP;
    return this.apiService.get<GroupLookup[]>(endpoint).pipe(
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Get access levels lookup data
   * GET /api/v1/system-users/GetAccessLevels
   */
  getAccessLevels(): Observable<AccessLevelLookup[]> {
    const endpoint = API.SYSTEM_ADMIN.MANAGE_USERS.ADD_NEW_USER.ACCESS_LEVEL_LOOKUP;
    return this.apiService.get<AccessLevelLookup[]>(endpoint).pipe(
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Create a new system user
   * POST /api/v1/system-users/create-system-user
   */
  createUser(request: CreateUserRequest): Observable<ApiResponse<any>> {
    const endpoint = API.SYSTEM_ADMIN.MANAGE_USERS.ADD_NEW_USER.CREATEUSER;
    return this.apiService.post<ApiResponse<any>>(endpoint, request)
      .pipe(
        map(response => {
          // Check for both success and isSuccess properties
          const isSuccessful = response.success || response.isSuccess;
          if (!isSuccessful) {
            throw new Error(response.message || 'Failed to create user');
          }
          return response;
        }),
        catchError(error => throwError(() => error))
      );
  }

  /**
   * Get user details by ID
   * GET /api/v1/system-users/{userId}
   */
  getUser(userId: string): Observable<UserDetailsResponse> {
    const endpoint = API.SYSTEM_ADMIN.MANAGE_USERS.GET_USER(userId);
    return this.apiService.get<UserDetailsResponse>(endpoint).pipe(
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Get user group details
   * GET /api/v1/system-users/group-details/{userId}
   */
  getUserGroupDetails(userId: string): Observable<UserGroupDetails> {
    const endpoint = API.SYSTEM_ADMIN.MANAGE_USERS.GET_USER_GROUP(userId);
    return this.apiService.get<UserGroupDetails>(endpoint).pipe(
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Get user chapters
   * GET /api/v1/system-users/{userId}/chapters
   */
  getUserChapters(userId: string): Observable<UserChapterDetail[]> {
    const endpoint = API.SYSTEM_ADMIN.MANAGE_USERS.GET_USER_CHAPTERS(userId);
    return this.apiService.get<UserChapterDetail[]>(endpoint).pipe(
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Update an existing system user
   * PUT /api/v1/system-users/{userId}
   */
  updateUser(userId: string, request: UpdateUserRequest): Observable<ApiResponse<any>> {
    const endpoint = API.SYSTEM_ADMIN.MANAGE_USERS.UPDATE_USER(userId);
    return this.apiService.put<ApiResponse<any>>(endpoint, request).pipe(
      map(response => {
        const isSuccessful = response.success || response.isSuccess;
        if (!isSuccessful) {
          throw new Error(response.message || 'Failed to update user');
        }
        return response;
      }),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Helper method to format Date to YYYY-MM-DD string
   */
  formatDateToISO(date: Date | null | undefined): string | undefined {
    if (!date) return undefined;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Helper method to parse date string to YYYY-MM-DD format using DateFieldUtility
   * Handles DD-MMM-YYYY format (e.g., "15-APR-2026" → "2026-04-15")
   */
  parseDateToISO(dateStr: string): string {
    if (!dateStr) return '';

    // Try to parse the date string using moment
    // Supports DD-MMM-YYYY, ISO format, and other standard formats
    const momentDate = moment(dateStr, ['DD-MMM-YYYY', 'YYYY-MM-DD', 'DD/MM/YYYY'], true);

    if (momentDate.isValid()) {
      // Use DateFieldUtility to serialize to API format
      return DateFieldValidationUtility.serializeDateForApi(momentDate) || '';
    }

    // Fallback: return original string if parsing fails
    return dateStr;
  }
}