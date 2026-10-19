import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { ApiService } from '../../../../shared/services/api.service';
import { API } from '../../../../core/constants/api.constants';
import {
  ActiveUser,
  ActiveUsersResponse,
  MenuItemsFilterRequest,
  MenuItemsResponse,
  MenuUsersResponse,
  MenuFilterDataResponse,
  AccessClassesFilterRequest,
  AccessClassesResponse,
  AccessClassesFilterDataResponse,
  AccessClassUsersResponse,
  AssociatedInterdictionsResponse,
  GroupDetailsResponse,
  UserClassOptionDto,
  UserClassOptionsResponse,
} from '../models/user-access-api.model';

@Injectable({
  providedIn: 'root'
})
export class UserAccessService {
  private apiService = inject(ApiService);

  // Cache for filter data
  private menuFilterDataCache: MenuFilterDataResponse | null = null;

  /**
   * GET - Retrieve active users for searchable dropdown
   * GET /api/v1/system-users/active-users
   */
  getActiveUsers(): Observable<ActiveUser[]> {
    return this.apiService
      .get<ActiveUsersResponse>(API.SYSTEM_ADMIN.USER_ACCESS.ACTIVE_USERS)
      .pipe(
        map(response => response.data || []),
        catchError(error => throwError(() => error))
      );
  }

  /**
   * Get menu items for a specific user with optional filtering
   * POST /api/v1/system-users/{userId}/menu-items/{take}/{skip}
   *
   * @param userId - User ID to query
   * @param take - Number of records to retrieve
   * @param skip - Number of records to skip
   * @param filters - Optional filter parameters (searchKeyword, menuTitle, program, effectiveDate, etc.)
   * @returns Observable with menu items data and total count
   */
  getUserMenuItems(
    userId: string,
    take: number,
    skip: number,
    filters?: MenuItemsFilterRequest
  ): Observable<MenuItemsResponse> {
    const endpoint = API.SYSTEM_ADMIN.USER_ACCESS.MENU_ITEMS(userId, take, skip);

    // Create request body with filters (empty object if no filters provided)
    const requestBody = filters || {};

    return this.apiService.post<MenuItemsResponse>(endpoint, requestBody).pipe(
      tap(response => {
        console.log(`Fetched ${response.total || 0} menu items for user ${userId}`);
      }),
      catchError(error => {
        console.error('Error fetching user menu items:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get all users who have access to a specific menu item (excluding current user)
   * GET /api/v1/system-users/menu-items/{mnemonic}/users/{userId}/{take}/{skip}
   *
   * @param mnemonic - Menu item mnemonic
   * @param userId - Current user ID (will be excluded from results)
   * @param take - Number of records to retrieve
   * @param skip - Number of records to skip
   * @returns Observable with list of users who have access to this menu
   */
  getMenuUsers(mnemonic: string, userId: string, take: number, skip: number): Observable<MenuUsersResponse> {
    const endpoint = API.SYSTEM_ADMIN.USER_ACCESS.MENU_USERS(mnemonic, userId, take, skip);

    return this.apiService.get<MenuUsersResponse>(endpoint).pipe(
      tap(response => {
        console.log(`Fetched ${response.total || 0} users for menu ${mnemonic}`);
      }),
      catchError(error => {
        console.error('Error fetching menu users:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get distinct lists of Menu Titles and Programs for filter dropdowns (with caching)
   * GET /api/system-users/menu-items/filters
   *
   * @returns Observable with filter data (menuTitle and program arrays)
   */
  getMenuFilterData(): Observable<MenuFilterDataResponse> {
    // Return cached data if available
    if (this.menuFilterDataCache) {
      console.log('Returning cached menu filter data');
      return new Observable(observer => {
        observer.next(this.menuFilterDataCache!);
        observer.complete();
      });
    }

    // Fetch from API and cache the result
    const endpoint = API.SYSTEM_ADMIN.USER_ACCESS.MENU_FILTERS;

    return this.apiService.get<MenuFilterDataResponse>(endpoint).pipe(
      tap(response => {
        // Cache the data for future use
        this.menuFilterDataCache = response;
        console.log('Cached menu filter data');
      }),
      catchError(error => {
        console.error('Error fetching menu filter data:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Clear the cached filter data
   * Call this if you need to force a refresh of the filter data
   */
  clearFilterCache(): void {
    this.menuFilterDataCache = null;
    console.log('Menu filter cache cleared');
  }

  /**
   * Get access classes for a specific user with optional filtering
   * POST /api/v1/system-users/{userId}/interdictions/{take}/{skip}
   *
   * @param userId - User ID to query
   * @param take - Number of records to retrieve
   * @param skip - Number of records to skip
   * @param filters - Optional filter parameters (searchKeyword, class, effectiveDate, etc.)
   * @returns Observable with access classes data and total count
   */
  getUserAccessClasses(
    userId: string,
    take: number,
    skip: number,
    filters?: AccessClassesFilterRequest
  ): Observable<AccessClassesResponse> {
    const endpoint = API.SYSTEM_ADMIN.USER_ACCESS.ACCESS_CLASSES(userId, take, skip);

    // Create request body with filters (empty object if no filters provided)
    const requestBody = filters || {};

    return this.apiService.post<AccessClassesResponse>(endpoint, requestBody).pipe(
      tap(response => {
        console.log(`Fetched ${response.total || 0} access classes for user ${userId}`);
      }),
      catchError(error => {
        console.error('Error fetching user access classes:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get distinct list of Access Classes for filter dropdowns
   * GET /api/v1/system-users/interdictions/filters
   *
   * @returns Observable with filter data (class array)
   */
  getAccessClassesFilterData(): Observable<AccessClassesFilterDataResponse> {
    const endpoint = API.SYSTEM_ADMIN.USER_ACCESS.ACCESS_CLASSES_FILTERS;

    return this.apiService.get<AccessClassesFilterDataResponse>(endpoint).pipe(
      tap(response => {
        console.log('Fetched access classes filter data');
      }),
      catchError(error => {
        console.error('Error fetching access classes filter data:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get access classes assigned to a specific user (for filter dropdown)
   * GET /api/v1/define-user-access/user-classes?userId={userId}
   */
  getUserClassOptions(userId: string): Observable<UserClassOptionDto[]> {
    const endpoint = API.SYSTEM_ADMIN.DEFINE_USER_ACCESS.USER_CLASSES(userId);

    return this.apiService.get<UserClassOptionsResponse>(endpoint).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error('Error fetching user class options:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get all users who belong to a specific access class (excluding current user)
   * POST /api/v1/system-users/{userId}/interdictions/{accessClass}/users/{take}/{skip}
   *
   * @param userId - Current user ID (will be excluded from results)
   * @param accessClass - Access class code
   * @param take - Number of records to retrieve
   * @param skip - Number of records to skip
   * @returns Observable with list of users in this access class
   */
  getAccessClassUsers(userId: string, accessClass: string, take: number, skip: number): Observable<AccessClassUsersResponse> {
    const endpoint = API.SYSTEM_ADMIN.USER_ACCESS.ACCESS_CLASSES_USERS(userId, accessClass, take, skip);

    return this.apiService.post<AccessClassUsersResponse>(endpoint, {}).pipe(
      tap(response => {
        console.log(`Fetched ${response.total || 0} users for access class ${accessClass}`);
      }),
      catchError(error => {
        console.error('Error fetching access class users:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get all interdictions associated with a specific access class
   * POST /api/v1/system-users/interdictions/{accessClass}/associated/{take}/{skip}
   *
   * @param accessClass - Access class code
   * @param take - Number of records to retrieve
   * @param skip - Number of records to skip
   * @returns Observable with list of associated interdictions
   */
  getAssociatedInterdictions(accessClass: string, take: number, skip: number): Observable<AssociatedInterdictionsResponse> {
    const endpoint = API.SYSTEM_ADMIN.USER_ACCESS.ACCESS_CLASSES_INTERDICTIONS(accessClass, take, skip);

    return this.apiService.post<AssociatedInterdictionsResponse>(endpoint, {}).pipe(
      tap(response => {
        console.log(`Fetched ${response.total || 0} interdictions for access class ${accessClass}`);
      }),
      catchError(error => {
        console.error('Error fetching associated interdictions:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get group details for a specific user
   * GET /api/v1/system-users/group-details/{userId}
   *
   * @param userId - User ID to query
   * @returns Observable with user group details
   */
  getUserGroupDetails(userId: string): Observable<GroupDetailsResponse> {
    const endpoint = API.SYSTEM_ADMIN.USER_ACCESS.GROUP_DETAILS(userId);

    return this.apiService.get<GroupDetailsResponse>(endpoint).pipe(
      tap(response => {
        console.log(`Fetched group details for user ${userId}`);
      }),
      catchError(error => {
        console.error('Error fetching user group details:', error);
        return throwError(() => error);
      })
    );
  }

  // ============================================================================
  // Helper Methods for Date Formatting
  // ============================================================================

  /**
   * Format date from ISO string to DD-MMM-YYYY format
   * @param dateStr - ISO date string (e.g., "2024-01-15T00:00:00Z")
   * @returns Formatted date string (e.g., "15-JAN-2024")
   */
  formatDate(dateStr: string | null): string {
    if (!dateStr || dateStr === 'null') {
      return '-';
    }

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return '-';
    }

    const day = String(date.getDate()).padStart(2, '0');
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  /**
   * Parse date to ISO format
   * @param dateStr - Date string
   * @returns ISO formatted date string, or empty string if date is invalid
   */
  parseDateToISO(dateStr: string): string {
    if (!dateStr) {
      return '';
    }

    const date = new Date(dateStr);

    // Validate the parsed date
    if (isNaN(date.getTime())) {
      console.warn(`Invalid date string provided to parseDateToISO: "${dateStr}"`);
      return '';
    }

    return date.toISOString();
  }

  /**
   * Format date from DD-MMM-YYYY to ISO format for API requests
   * @param dateStr - Date string in DD-MMM-YYYY format (e.g., "15-JAN-2024")
   * @returns ISO formatted date string (e.g., "2024-01-15T00:00:00Z")
   */
  formatDateForAPI(dateStr: string): string {
    if (!dateStr || dateStr === '-') {
      return '';
    }

    // Parse DD-MMM-YYYY format
    const parts = dateStr.split('-');
    if (parts.length !== 3) {
      return '';
    }

    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const monthIndex = monthNames.indexOf(parts[1].toUpperCase());

    if (monthIndex === -1) {
      return '';
    }

    const date = new Date(parseInt(parts[2]), monthIndex, parseInt(parts[0]));
    return date.toISOString();
  }
}
