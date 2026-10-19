import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  DrivesModel,
  DrivesParamsDto,
  DrivesFilterLov,
  AddDriveRecordDto,
  UpdateDriveRecordDto,
  ChapterLookup,
  GroupSite,
  Drive,
  DriveType
} from '../models/drives.model';
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
export class DrivesService {
  private readonly apiService = inject(ApiService);

  /**
   * Get Drives table data with pagination
   * POST /api/v1/drives/details/{take}/{skip}
   * @param pageNumber - Page number (1-indexed)
   * @param pageSize - Number of records per page
   * @param params - Filter and search parameters
   * @returns Observable with table data and total count
   */
  getDrives(
    pageNumber: number,
    pageSize: number,
    params: DrivesParamsDto
  ): Observable<{ data: DrivesModel[]; totalRecords: number }> {
    const take = pageSize;
    const skip = (pageNumber - 1) * pageSize;
    const endpoint = API.APPLICATION_ADMIN.DRIVES(take, skip);

    const requestBody: any = {
      searchKeyword: params.searchKeyword || null,
      chapterId: params.chapterId || null,
      fromDate: params.fromDate || null,
      toDate: params.toDate || null,
      driveType: params.type || null,
      driveId: params.driveId || null,
      siteId: params.siteId || null,
      scheduleDate: params.scheduleDate || null,
      schedulePeriod: params.schedulePeriod || null,
      sort: params.Sort || null
    };

    return this.apiService.post<ReturnResult<DrivesModel>>(endpoint, requestBody).pipe(
      map(response => {
        return {
          data: response?.data || [],
          totalRecords: response?.total || 0
        };
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Get filter dropdown values (LOV)
   * GET /api/v1/admin/drives-filters
   * @returns Observable with filter options
   */
  getDrivesFilters(): Observable<ReturnResult<DrivesFilterLov>> {
    const endpoint = API.APPLICATION_ADMIN.DRIVES_FILTERS;

    return this.apiService.get<ReturnResult<DrivesFilterLov>>(endpoint).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Get chapter lookup for dropdowns
   * GET /api/v1/chapters
   * @returns Observable with list of chapters
   */
  getChapterLookup(): Observable<{ data: ChapterLookup[] }> {
    const endpoint = API.APPLICATION_ADMIN.DRIVES_CHAPTER_LOOKUP;

    return this.apiService.get<ChapterLookup[]>(endpoint).pipe(
      map(response => ({
        data: response || []
      })),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Get type options for dropdown
   * GET /api/v1/admin/drives/types
   * @returns Observable with list of drive types
   */
  getTypeOptions(): Observable<ReturnResult<string>> {
    const endpoint = API.APPLICATION_ADMIN.DRIVES_TYPES;

    return this.apiService.get<ReturnResult<string>>(endpoint).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Get group site options for dropdown (used by add-edit component)
   * GET /api/v1/drives/group-sites
   * @param chapterId - Chapter ID to filter group sites
   * @returns Observable with list of group sites
   */
  getGroupSites(chapterId?: string): Observable<{ data: GroupSite[]; total: number }> {
    let endpoint: string = API.APPLICATION_ADMIN.DRIVES_GROUP_SITES;

    // Add chapter ID filter parameter
    if (chapterId) {
      endpoint = `${endpoint}?chapterId=${encodeURIComponent(chapterId)}`;
    }

    return this.apiService.get<GroupSite[]>(endpoint).pipe(
      map(response => {
        // Handle both array response and paginated response
        if (Array.isArray(response)) {
          return {
            data: response || [],
            total: response.length
          };
        }
        // If API returns paginated format
        return {
          data: (response as any)?.data || response || [],
          total: (response as any)?.total || 0
        };
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Get group site options for filter panel with date range
   * POST /api/v1/drives/group-sites-filtered-by-drives
   * @param params - Filter parameters (chapterId, fromDate, toDate)
   * @returns Observable with list of group sites
   */
  getGroupSitesForFilter(params: DrivesParamsDto): Observable<{ data: GroupSite[]; total: number }> {
    const endpoint = API.APPLICATION_ADMIN.DRIVES_GROUP_SITES_FILTER;

    const requestBody: any = {
      chapterId: params.chapterId || null,
      fromDate: params.fromDate || null,
      toDate: params.toDate || null
    };

    return this.apiService.post<ReturnResult<GroupSite>>(endpoint, requestBody).pipe(
      map(response => {
        return {
          data: response?.data || [],
          total: response?.total || 0
        };
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Get drive options for filter panel with date range
   * POST /api/v1/drives/drives-filtered  // Replace with your actual API endpoint
   * @param params - Filter parameters (chapterId, fromDate, toDate)
   * @returns Observable with list of drives
   */
  getDriveTypesForFilter(params: DrivesParamsDto): Observable<{ data: DriveType[]; total: number }> {
    const endpoint = API.APPLICATION_ADMIN.DRIVES_TYPES_FILTER;

    const requestBody: Pick<DrivesParamsDto, 'chapterId' | 'fromDate' | 'toDate'> = {
      chapterId: params.chapterId || null,
      fromDate: params.fromDate || null,
      toDate: params.toDate || null
    };

    return this.apiService.post<ReturnResult<DriveType>>(endpoint, requestBody).pipe(
      map(response => {
        return {
          data: response?.data || [],
          total: response?.total || 0
        };
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  getDrivesForFilter(params: DrivesParamsDto): Observable<{ data: Drive[]; total: number }> {
    const endpoint = API.APPLICATION_ADMIN.DRIVES_FILTER; // You will need to add this to api.constants.ts

    const requestBody: any = {
      chapterId: params.chapterId || null,
      fromDate: params.fromDate || null,
      toDate: params.toDate || null
    };

    return this.apiService.post<ReturnResult<Drive>>(endpoint, requestBody).pipe(
      map(response => {
        return {
          data: response?.data || [],
          total: response?.total || 0
        };
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Get group site details by ID to fetch description
   * GET /api/v1/drives/group-sites/{groupSiteId}
   * @param groupSiteId - The group site ID
   * @returns Observable with group site details
   */
  getGroupSiteById(groupSiteId: string): Observable<GroupSite> {
    const endpoint = API.APPLICATION_ADMIN.DRIVES_GROUP_SITE_BY_ID(groupSiteId);

    return this.apiService.get<GroupSite>(endpoint).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Add new Drive Record
   * POST /api/v1/drives/insert
   * @param data - Drive record data
   * @returns Observable with result
   */
  addDriveRecord(data: AddDriveRecordDto): Observable<any> {
    const endpoint = API.APPLICATION_ADMIN.DRIVES_INSERT;

    return this.apiService.post<any>(endpoint, data).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Update existing Drive Record
   * PUT /api/v1/drives/update
   * @param data - Drive record data
   * @returns Observable with result
   */
  updateDriveRecord(data: UpdateDriveRecordDto): Observable<any> {
    const endpoint = API.APPLICATION_ADMIN.DRIVES_UPDATE;

    return this.apiService.put<any>(endpoint, data).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }
}
