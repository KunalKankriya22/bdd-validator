import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from '../../../../../core/constants/api.constants';
import {
  DefineUserAccessListDto,
  ApiResponse,
  AccessClassDropdownDto,
  UserDropdownOption,
  OverlappingInterdictionDto,
  AssignUserAccessDto,
  UpdateUserAccessDto
} from '../models/user-access.model';

@Injectable({
  providedIn: 'root'
})
export class UserAccessService {
  private readonly apiService = inject(ApiService);

  /**
   * GET - Retrieve user access classes by user ID
   * @param userId - The user ID to search for
   * @param sortDir - Sort direction: 'ASC' or 'DESC' (default: 'ASC')
   * @returns Observable with user access classes data
   */
  getUserAccessClasses(
    userId: string,
    sortDir: 'ASC' | 'DESC' = 'ASC'
  ): Observable<DefineUserAccessListDto[]> {
    const params = new HttpParams()
      .set('userId', userId.trim())
      .set('sortDir', sortDir);

    return this.apiService
      .get<ApiResponse<DefineUserAccessListDto[]>>(API.SYSTEM_ADMIN.DEFINE_USER_ACCESS.GET_ALL, { params })
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error('Error fetching user access classes:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * GET - Retrieve users dropdown for searchable user ID select
   */
  getUsersDropdown(): Observable<UserDropdownOption[]> {
    return this.apiService
      .get<ApiResponse<UserDropdownOption[]>>(API.SYSTEM_ADMIN.DEFINE_USER_ACCESS.USERS_DROPDOWN)
      .pipe(
        map(response => response.data || []),
        catchError(error => throwError(() => error))
      );
  }

  /**
   * GET - Retrieve active access classes for dropdown
   * @returns Observable with active access classes
   */
  getActiveAccessClasses(): Observable<ApiResponse<AccessClassDropdownDto[]>> {
    return this.apiService.get<ApiResponse<AccessClassDropdownDto[]>>(
      API.SYSTEM_ADMIN.DEFINE_USER_ACCESS.ACCESS_CLASSES
    ).pipe(
      catchError(error => {
        console.error('Error fetching active access classes:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * POST - Assign an access class to a user
   * @param dto - The assignment data
   * @param loggedInUserName - The logged-in user's name
   * @param chapterId - The chapter ID
   * @returns Observable with result
   */
  assignAccessClass(
    dto: AssignUserAccessDto,
    loggedInUserName: string,
    chapterId: string
  ): Observable<ApiResponse<object>> {
    const params = new HttpParams()
      .set('loggedInUserName', loggedInUserName)
      .set('chapterId', chapterId);

    return this.apiService.post<ApiResponse<object>>(
      API.SYSTEM_ADMIN.DEFINE_USER_ACCESS.ASSIGN,
      dto,
      { params }
    ).pipe(
      catchError(error => {
        console.error('Error assigning access class:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * PUT - Update an existing user access class assignment
   * @param userId - The user ID
   * @param accessClass - The access class code
   * @param dto - The update data
   * @returns Observable with result
   */
  updateAccessClass(
    userId: string,
    accessClass: string,
    dto: UpdateUserAccessDto
  ): Observable<ApiResponse<object>> {
    return this.apiService.put<ApiResponse<object>>(
      API.SYSTEM_ADMIN.DEFINE_USER_ACCESS.UPDATE(userId, accessClass),
      dto
    ).pipe(
      catchError(error => {
        console.error('Error updating access class:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * GET - Retrieve overlapping interdictions for a user
   */
  getOverlappingInterdictions(userId: string): Observable<OverlappingInterdictionDto[]> {
    return this.apiService
      .get<ApiResponse<OverlappingInterdictionDto[]>>(
        API.SYSTEM_ADMIN.DEFINE_USER_ACCESS.OVERLAPPING_INTERDICTIONS(userId)
      )
      .pipe(
        map(response => response.data || []),
        catchError(error => {
          console.error('Error fetching overlapping interdictions:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * GET - Retrieve access level limit from donor interdictions API
   * @returns Observable with the maximum access level value
   */
  getAccessLevelLimit(): Observable<number> {
    return this.apiService
      .get<any>('/api/v1/donor-interdictions/view-limit')
      .pipe(
        map(response => {
          // Handle both possible response formats
          const limitStr = response.item?.Viewlimit ?? response.item?.viewlimit ?? response.data?.viewlimit ?? '0';
          return parseInt(limitStr, 10) || 0;
        }),
        catchError(error => {
          console.error('Error fetching access level limit:', error);
          return throwError(() => error);
        })
      );
  }
}
