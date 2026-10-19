import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  GroupSitesModel,
  GroupSitesParamsDto,
  GroupSitesFilterLov,
  GroupSitesDto,
  UpdateGroupSitesDto,
  ChapterLookup
} from '../models/group-sites.model';
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
export class GroupSitesService {
  private readonly apiService = inject(ApiService);

  /**
   * Get Group/Sites table data with pagination
   * POST /api/v1/admin/group-sites/{take}/{skip}
   */
  getGroupSites(
    take: number,
    skip: number,
    params: GroupSitesParamsDto
  ): Observable<{ data: GroupSitesModel[]; totalRecords: number }> {
    const endpoint = API.APPLICATION_ADMIN.GROUP_SITES(take, skip);

    return this.apiService.post<ReturnResult<GroupSitesModel>>(endpoint, params).pipe(
      map(response => ({
        data: response.data || [],
        totalRecords: response.total || 0
      })),
      catchError(error => {
        console.error('Error fetching group/sites data:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get filter dropdown values (LOV)
   * GET /api/v1/admin/group-sites-filters
   */
  getGroupSitesFilters(): Observable<ReturnResult<GroupSitesFilterLov>> {
    const endpoint = API.APPLICATION_ADMIN.GROUP_SITES_FILTERS;

    return this.apiService.get<ReturnResult<GroupSitesFilterLov>>(endpoint).pipe(
      catchError(error => {
        console.error('Error fetching group/sites filters:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get chapter IDs for dropdowns
   * GET /api/v1/chapters/lookup
   * Returns a plain array, not wrapped in ReturnResult
   */
  getChapterIds(): Observable<ChapterLookup[]> {
    return this.apiService.get<ChapterLookup[]>('/api/v1/chapters/lookup').pipe(
      catchError(error => {
        console.error('Error fetching chapter IDs:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get active chapter IDs for add/edit dropdown
   * GET /api/v1/chapters/active/lookup
   * Backend filters chapters to show only currently active ones with timezone awareness
   */
  getActiveChapterIds(): Observable<ChapterLookup[]> {
    return this.apiService.get<ChapterLookup[]>(API.CHAPTER.ACTIVE_LOOKUP).pipe(
      catchError(error => {
        console.error('Error fetching active chapter IDs:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Add new Group/Site
   * POST /api/v1/admin/group-sites
   */
  addGroupSite(data: GroupSitesDto): Observable<ReturnResult<GroupSitesModel>> {
    const endpoint = API.APPLICATION_ADMIN.GROUP_SITES_ADD_EDIT;
    return this.apiService.post<ReturnResult<GroupSitesModel>>(endpoint, data).pipe(
      catchError(error => {
        console.error('Error adding group/site:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update existing Group/Site
   * PUT /api/v1/admin/group-sites
   */
  updateGroupSite(data: UpdateGroupSitesDto): Observable<ReturnResult<GroupSitesModel>> {
    const endpoint = API.APPLICATION_ADMIN.GROUP_SITES_ADD_EDIT;
    return this.apiService.put<ReturnResult<GroupSitesModel>>(endpoint, data).pipe(
      catchError(error => {
        console.error('Error updating group/site:', error);
        return throwError(() => error);
      })
    );
  }
}
