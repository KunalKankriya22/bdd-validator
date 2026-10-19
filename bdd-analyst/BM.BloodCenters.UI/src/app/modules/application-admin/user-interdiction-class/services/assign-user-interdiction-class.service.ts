import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  AssignUserInterdictionClassModel,
  AssignUserInterdictionClassParamsDto,
  UserInterdictionClassPanelState,
  AssignUserInterdictionClassDto,
  UserOption,
  InterdictionClassOption
} from '../models/assign-user-interdiction-class.model';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';

interface ReturnResult<T> {
  success?: boolean;
  message?: string;
  error?: string;
  statusCode?: number;
  data?: T[];
  item?: T;
  total?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AssignUserInterdictionClassService {
  private readonly apiService = inject(ApiService);
  private readonly http = inject(HttpClient);

  private panelStateSubject = new BehaviorSubject<UserInterdictionClassPanelState>({
    isOpen: false,
    mode: 'add'
  });

  panelState$ = this.panelStateSubject.asObservable();

  /**
   * Get Assign User Interdiction Class table data with pagination
   * @param take - Number of records to fetch
   * @param skip - Number of records to skip
   * @param params - Filter and search parameters (includes InterClass, EffectiveDate, TerminationDate, SearchKeyword, Sort)
   * @returns Observable with table data and total count
   */
  getAssignUserInterdictionClass(
    take: number,
    skip: number,
    params: AssignUserInterdictionClassParamsDto
  ): Observable<{ data: AssignUserInterdictionClassModel[]; totalRecords: number }> {
    const endpoint = API.APPLICATION_ADMIN.ASSIGN_USER_INTERDICTION_CLASS(take, skip);

    return this.apiService.post<ReturnResult<AssignUserInterdictionClassModel>>(endpoint, params).pipe(
      map(response => ({
        data: response.data || [],
        totalRecords: response.total || 0
      })),
      catchError(error => {
        console.error('Error fetching assign user interdiction class data:', error);
        return throwError(() => error);
      })
    );
  }


  /**
   * Get users list for dropdown
   * @returns Observable with user options
   */
  getUsers(): Observable<UserOption[]> {
    const endpoint = API.APPLICATION_ADMIN.GET_USERS;

    return this.apiService.get<any[]>(endpoint).pipe(
      map(users => {
        // API returns array directly, not wrapped in ReturnResult
        if (!Array.isArray(users)) {
          console.warn('Expected array but got:', users);
          return [];
        }
        // Map API response to UserOption with displayName
        return users.map((user: any) => ({
          userId: user.userId,
          userName: user.userName,
          displayName: `${user.userId} - ${user.userName}`
        }));
      }),
      catchError(error => {
        console.error('Error fetching users:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get interdiction classes for dropdown
   * @returns Observable with interdiction class options
   */
  getInterdictionClasses(): Observable<InterdictionClassOption[]> {
    const endpoint = API.APPLICATION_ADMIN.GET_INTERDICTION_CLASSES;

    return this.apiService.get<InterdictionClassOption[]>(endpoint).pipe(
      map(classes => {
        // API returns array directly, not wrapped in ReturnResult
        if (!Array.isArray(classes)) {
          console.warn('Expected array but got:', classes);
          return [];
        }
        return classes;
      }),
      catchError(error => {
        console.error('Error fetching interdiction classes:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get interdiction class details by code
   * @param classCode - The interdiction class code
   * @returns Observable with class description
   */
  getInterdictionClassByCode(classCode: string): Observable<{ code: string; description: string }> {
    const endpoint = API.APPLICATION_ADMIN.GET_INTERDICTION_CLASS_BY_CODE(classCode);

    return this.http.get<{ code: string; description: string }>(endpoint).pipe(
      catchError(error => {
        console.error('Error fetching interdiction class details:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get User Interdiction Class by ID (for edit modal)
   * @param userId - User ID
   * @param interClass - Interdiction Class Code
   * @returns Observable with user interdiction class details
   */
  getUserInterdictionClassById(userId: string, interClass: string): Observable<AssignUserInterdictionClassModel> {
    const endpoint = API.APPLICATION_ADMIN.GET_USER_INTERDICTION_CLASS_BY_ID(userId, interClass);

    return this.apiService.get<ReturnResult<AssignUserInterdictionClassModel>>(endpoint).pipe(
      map(response => {
        if (response.data && response.data.length > 0) {
          return response.data[0];
        }
        throw new Error('User interdiction class record not found');
      }),
      catchError(error => {
        console.error('Error fetching user interdiction class by ID:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Add new User Interdiction Class
   * @param dto - User interdiction class data
   * @returns Observable with result
   */
  addUserInterdictionClass(dto: AssignUserInterdictionClassDto): Observable<ReturnResult<AssignUserInterdictionClassModel>> {
    const endpoint = API.APPLICATION_ADMIN.CREATE_USER_INTERDICTION_CLASS;

    return this.apiService.post<ReturnResult<AssignUserInterdictionClassModel>>(endpoint, dto).pipe(
      catchError(error => {
        console.error('Error adding user interdiction class:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update existing User Interdiction Class
   * @param userId - User ID
   * @param interClass - Interdiction Class Code
   * @param dto - User interdiction class data (effectiveDate and terminationDate)
   * @returns Observable with result
   */
  updateUserInterdictionClass(
    userId: string,
    interClass: string,
    dto: { effectiveDate: string | null; terminationDate?: string | null }
  ): Observable<ReturnResult<AssignUserInterdictionClassModel>> {
    const endpoint = API.APPLICATION_ADMIN.UPDATE_USER_INTERDICTION_CLASS(userId, interClass);

    return this.apiService.put<ReturnResult<AssignUserInterdictionClassModel>>(endpoint, dto).pipe(
      catchError(error => {
        console.error('Error updating user interdiction class:', error);
        return throwError(() => error);
      })
    );
  }
}
