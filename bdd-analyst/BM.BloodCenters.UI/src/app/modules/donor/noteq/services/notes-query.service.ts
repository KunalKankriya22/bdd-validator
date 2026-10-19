/**
 * Notes Query Service
 * Handles API communication for the Notes by Date Range Query feature
 * JIRA: MLT-11886
 * Mnemonic: NOTEQ
 */

import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  NotesQueryRequestDto,
  NotesQueryResponseDto,
  ApiResponse,
  UsersLovRequestDto,
  ProgramsLovRequestDto,
  UserLovItemDto,
  ProgramLovItemDto,
  DataResponse
} from '../models/notes-query.model';

@Injectable({
  providedIn: 'root'
})
export class NotesQueryService {
  private readonly apiService = inject(ApiService);

  /**
   * Search notes by date range with optional filters
   * POST /api/v1/notes-query/search
   *
   * @param request - NotesQueryRequestDto with search criteria
   * @returns Observable of NotesQueryResponseDto
   */
  searchNotes(request: NotesQueryRequestDto): Observable<NotesQueryResponseDto> {
    return this.apiService.post<ApiResponse<NotesQueryResponseDto>>(
      API.NOTES_QUERY.SEARCH,
      request
    ).pipe(
      map(response => {
        if (response.success && response.item) {
          return response.item;
        }
        // Handle case where success=true but no data (empty results)
        return {
          notes: [],
          userCounts: [],
          programCounts: [],
          totalNotes: 0,
          totalCount: 0
        };
      }),
      catchError(error => {
        console.error('Error searching notes:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get users LOV for the dropdown (filtered by date range)
   * POST /api/v1/notes-query/users
   */
  getUsers(request: UsersLovRequestDto): Observable<UserLovItemDto[]> {
    return this.apiService.post<DataResponse<UserLovItemDto>>(
      API.NOTES_QUERY.USERS,
      request
    ).pipe(
      map(response => response.data ?? []),
      catchError(error => {
        console.error('Error loading users LOV:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get programs LOV for the dropdown (filtered by date range and optional user)
   * POST /api/v1/notes-query/programs
   */
  getPrograms(request: ProgramsLovRequestDto): Observable<ProgramLovItemDto[]> {
    return this.apiService.post<DataResponse<ProgramLovItemDto>>(
      API.NOTES_QUERY.PROGRAMS,
      request
    ).pipe(
      map(response => response.data ?? []),
      catchError(error => {
        console.error('Error loading programs LOV:', error);
        return throwError(() => error);
      })
    );
  }
}
