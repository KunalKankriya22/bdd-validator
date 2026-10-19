import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { LoginService } from '@shared/services/login.service';
import { ApiService } from '@shared/services/api.service';
import { API } from '../../../../../../core/constants/api.constants';
import {
  UserAccount,
  AccessClassOption,
  AccessLevelOption,
  UserDropdownOption,
  AddAccessClassRequest,
  UpdateAccessClassRequest,
  AttachedUser,
  ApiResponse,
  LabUserAccessDetailsResponse
} from '../models/lab-user-access.model';

@Injectable({
  providedIn: 'root'
})
export class LabUserAccessService {
  private readonly apiService = inject(ApiService);
  private readonly loginService = inject(LoginService);

  /**
   * Get all user accounts
   */
  getUserAccounts(): Observable<UserAccount[]> {
    return this.apiService.get<UserAccount[]>(API.SYSTEM_ADMIN.LAB_USER_ACCESS.GET_USER_ACCOUNTS);
  }

  /**
   * Get user access classes by user ID
   */
  getLabUserAccessDetails(
    userId: string,
    sortDirection?: 'ASC' | 'DESC'
  ): Observable<LabUserAccessDetailsResponse> {
    let params = new HttpParams()
      .set('userId', userId);

    if (sortDirection) {
      params = params.set('sortDirection', sortDirection);
    }

    return this.apiService.get<LabUserAccessDetailsResponse>(
      API.SYSTEM_ADMIN.LAB_USER_ACCESS.GET_DETAILS,
      { params }
    );
  }

  /**
   * Get access class options for dropdown
   * @param chapterId - Optional chapter ID for timezone-aware date filtering
   */
  getAccessClassOptions(chapterId?: string): Observable<AccessClassOption[]> {
    let params = new HttpParams();
    if (chapterId) {
      params = params.set('chapterId', chapterId);
    }

    return this.apiService
      .get<ApiResponse<{ code: string; codeDesc: string }[]>>(
        API.SYSTEM_ADMIN.LAB_USER_ACCESS.ACCESS_CLASSES_DROPDOWN,
        { params }
      )
      .pipe(
        map((response) =>
          (response.data || []).map((item) => ({
            code: item.code,
            description: item.codeDesc
          }))
        )
      );
  }

  /**
   * Add access class to user
   * @param payload - Access class details (sent in request body)
   * @param chapterId - Chapter ID (sent as query parameter per API specification)
   */
  addUserAccessClass(payload: AddAccessClassRequest, chapterId: string): Observable<ApiResponse> {
    const loggedInUserName = this.loginService.getStoredUsername();

    const params = new HttpParams()
      .set('loggedInUserName', loggedInUserName)
      .set('chapterId', chapterId);

    return this.apiService.post<ApiResponse>(
      API.SYSTEM_ADMIN.LAB_USER_ACCESS.INSERT,
      payload,
      { params }
    );
  }

  /**
   * Update user access class
   */
  updateUserAccessClass(
    accessClass: string,
    payload: UpdateAccessClassRequest,
    chapterId: string
  ): Observable<ApiResponse> {
    const loggedInUserName = this.loginService.getStoredUsername();
    const params = new HttpParams()
      .set('loggedInUserName', loggedInUserName)
      .set('chapterId', chapterId);

    return this.apiService.put<ApiResponse>(
      API.SYSTEM_ADMIN.LAB_USER_ACCESS.UPDATE(accessClass),
      payload,
      { params }
    );
  }

  /**
   * Get users dropdown for searchable user ID select
   */
  getUsersDropdown(): Observable<UserDropdownOption[]> {
    return this.apiService
      .get<ApiResponse<UserDropdownOption[]>>(API.SYSTEM_ADMIN.LAB_USER_ACCESS.USERS_DROPDOWN)
      .pipe(map((response) => response.data || []));
  }

  /**
   * Get access level options for dropdown (dynamic per chapter)
   * @param chapterId - Optional chapter ID to resolve VIEW_LIMIT
   */
  getAccessLevelOptions(chapterId?: string): Observable<AccessLevelOption[]> {
    let params = new HttpParams();
    if (chapterId) {
      params = params.set('chapterId', chapterId);
    }

    return this.apiService
      .get<ApiResponse<AccessLevelOption[]>>(
        API.SYSTEM_ADMIN.LAB_USER_ACCESS.ACCESS_LEVEL_DROPDOWN,
        { params }
      )
      .pipe(map((response) => response.data || []));
  }

  /**
   * Get attached users for a specific access class, scoped to the logged-in user's chapter
   */
  getAttachedUsers(accessClass: string, chapterId: string): Observable<AttachedUser[]> {
    const params = new HttpParams().set('chapterId', chapterId);
    return this.apiService
      .get<ApiResponse<AttachedUser[]>>(
        API.SYSTEM_ADMIN.LAB_USER_ACCESS.ATTACHED_USERS(accessClass),
        { params }
      )
      .pipe(map((response) => response.data));
  }
}
