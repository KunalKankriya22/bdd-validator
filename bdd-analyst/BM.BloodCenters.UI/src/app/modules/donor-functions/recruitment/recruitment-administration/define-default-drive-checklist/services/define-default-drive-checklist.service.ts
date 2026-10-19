import { Injectable, inject } from '@angular/core';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { HttpHeaders } from '@angular/common/http';
import {
  DefineDefaultDriveChecklistModel,
  DriveChecklistParamsDto,
  DriveChecklistFilterLov,
  DriveChecklistAddDropdownLov,
  DriveChecklistDto,
  UpdateDriveChecklistDto,
  ApiResponse
} from '../models/define-default-drive-checklist.model';
import { ApiService } from '@shared/services/api.service';
import { HeaderService } from '@shared/services/header.service';

@Injectable({
  providedIn: 'root'
})
export class DefineDefaultDriveChecklistService {
  private readonly apiService = inject(ApiService);
  private readonly headerService = inject(HeaderService);
  private readonly BASE_URL = '/api/v1/donor/drive-checklist';

  /**
   * Get HTTP headers with chapterId
   */
  private getHeaders(): HttpHeaders {
    const chapterId = this.headerService.chapterId();
    return new HttpHeaders({
      'X-Chapter-Id': chapterId
    });
  }

  /**
   * Get drive checklist data with pagination
   * POST /api/v1/donor/drive-checklist/{take}/{skip}
   * @param take - Number of records to fetch
   * @param skip - Number of records to skip
   * @param params - Filter and search parameters
   * @returns Observable with table data and total count
   */
  getDriveChecklist(
    take: number,
    skip: number,
    params: DriveChecklistParamsDto
  ): Observable<{ data: DefineDefaultDriveChecklistModel[]; totalRecords: number }> {
    const endpoint = `${this.BASE_URL}/${take}/${skip}`;
    return this.apiService.post<ApiResponse<DefineDefaultDriveChecklistModel>>(
      endpoint,
      params,
      { headers: this.getHeaders() }
    ).pipe(
      map(response => ({
        data: response.data || [],
        totalRecords: response.total || 0
      })),
      catchError(error => {
        // Handle 404 as empty result when API indicates success
        // API returns 404 with success=true when no records match the filter
        if (error.status === 404 && error.error?.success === true) {
          return of({
            data: [],
            totalRecords: 0
          });
        }

        console.error('Error fetching drive checklist data:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get filter dropdown values (LOV)
   * GET /api/v1/donor/drive-checklist/filter-dropdown
   * @returns Observable with filter options
   */
  getDriveChecklistFilters(): Observable<DriveChecklistFilterLov> {
    const endpoint = `${this.BASE_URL}/filter-dropdown`;
    return this.apiService.get<ApiResponse<DriveChecklistFilterLov>>(
      endpoint,
      { headers: this.getHeaders() }
    ).pipe(
      map(response => response.data && response.data.length > 0 ? response.data[0] : {}),
      catchError(error => {
        console.error('Error fetching drive checklist filters:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get add dropdown values (LOV)
   * GET /api/v1/donor/drive-checklist/add-dropdown
   * @returns Observable with add dropdown options
   */
  getDriveChecklistAddDropdowns(): Observable<DriveChecklistAddDropdownLov> {
    const endpoint = `${this.BASE_URL}/add-dropdown`;
    return this.apiService.get<ApiResponse<DriveChecklistAddDropdownLov>>(
      endpoint,
      { headers: this.getHeaders() }
    ).pipe(
      map(response => response.data && response.data.length > 0 ? response.data[0] : {}),
      catchError(error => {
        console.error('Error fetching drive checklist add dropdowns:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Add new drive checklist item
   * POST /api/v1/donor/drive-checklist
   * @param data - Drive checklist data
   * @returns Observable with result
   */
  addDriveChecklist(data: DriveChecklistDto): Observable<ApiResponse<string>> {
    const endpoint = this.BASE_URL;
    return this.apiService.post<ApiResponse<string>>(
      endpoint,
      data,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Error adding drive checklist item:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update existing drive checklist item
   * PUT /api/v1/donor/drive-checklist
   * @param data - Drive checklist data
   * @returns Observable with result
   */
  updateDriveChecklist(data: UpdateDriveChecklistDto): Observable<ApiResponse<string>> {
    const endpoint = this.BASE_URL;
    return this.apiService.put<ApiResponse<string>>(
      endpoint,
      data,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Error updating drive checklist item:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Delete drive checklist item
   * DELETE /api/v1/donor/drive-checklist/{actionCode}/{chapterId}
   * @param actionCode - Action code of the item to delete
   * @param chapterId - Chapter ID of the item to delete
   * @returns Observable with result
   */
  deleteDriveChecklist(actionCode: string, chapterId: string): Observable<ApiResponse<string>> {
    const endpoint = `${this.BASE_URL}/${actionCode}/${chapterId}`;
    return this.apiService.delete<ApiResponse<string>>(
      endpoint,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Error deleting drive checklist item:', error);
        return throwError(() => error);
      })
    );
  }
}
