import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';
import {
  SpecialDriveDto,
  CreateSpecialDriveRequest,
  UpdateSpecialDriveRequest,
  RecreateSpecialDriveRequest,
  SpecialDriveSearchRequest,
  DriveCategoryLookup,
  DriveIdLookup,
  ResourceLookup,
  SponsorLookup,
  LocationLookup,
  RecruiterLookup,
  CancelCodeLookup,
  ApiResponse
} from '../models/special-drive.model';

@Injectable({
  providedIn: 'root'
})
export class SpecialDriveService {
  private readonly apiService = inject(ApiService);

  searchDrives(
    take: number,
    skip: number,
    request: SpecialDriveSearchRequest
  ): Observable<{ data: SpecialDriveDto[]; total: number }> {
    return this.apiService
      .post<ApiResponse<SpecialDriveDto>>(API.RECRUITMENT.SPECIAL_DRIVES.SEARCH(take, skip), request)
      .pipe(
        map(response => ({
          data: response.data || [],
          total: response.total || 0,
        })),
        catchError(error => throwError(() => error))
      );
  }

  getDriveById(driveId: string, _chapterId: string): Observable<SpecialDriveDto> {
    return this.apiService
      .get<ApiResponse<SpecialDriveDto>>(API.RECRUITMENT.SPECIAL_DRIVES.GET_BY_ID(driveId))
      .pipe(
        map(response => response.item!),
        catchError(error => throwError(() => error))
      );
  }

  createDrive(request: CreateSpecialDriveRequest): Observable<ApiResponse<SpecialDriveDto>> {
    return this.apiService
      .post<ApiResponse<SpecialDriveDto>>(API.RECRUITMENT.SPECIAL_DRIVES.CREATE, request)
      .pipe(catchError(error => throwError(() => error)));
  }

  updateDrive(request: UpdateSpecialDriveRequest): Observable<ApiResponse<SpecialDriveDto>> {
    return this.apiService
      .put<ApiResponse<SpecialDriveDto>>(
        API.RECRUITMENT.SPECIAL_DRIVES.UPDATE(request.driveId),
        request
      )
      .pipe(catchError(error => throwError(() => error)));
  }

  deleteDrive(driveId: string, _chapterId?: string, cancelReasonCode?: string, cancelReason?: string): Observable<ApiResponse<void>> {
    return this.apiService
      .delete<ApiResponse<void>>(API.RECRUITMENT.SPECIAL_DRIVES.DELETE(driveId), {
        body: { cancelReasonCode, cancelReason }
      })
      .pipe(catchError(error => throwError(() => error)));
  }

  recreateDrive(request: RecreateSpecialDriveRequest): Observable<ApiResponse<SpecialDriveDto>> {
    return this.apiService
      .post<ApiResponse<SpecialDriveDto>>(API.RECRUITMENT.SPECIAL_DRIVES.RECREATE, request)
      .pipe(catchError(error => throwError(() => error)));
  }

  getDriveIds(chapterId: string): Observable<DriveIdLookup[]> {
    return this.apiService
      .get<ApiResponse<DriveIdLookup>>(API.RECRUITMENT.SPECIAL_DRIVES.LOOKUPS.DRIVE_IDS(chapterId))
      .pipe(
        map(response => response.data || []),
        catchError(error => throwError(() => error))
      );
  }

  getDriveCategories(): Observable<DriveCategoryLookup[]> {
    return this.apiService
      .get<ApiResponse<DriveCategoryLookup>>(API.RECRUITMENT.SPECIAL_DRIVES.LOOKUPS.DRIVE_CATEGORIES)
      .pipe(
        map(response => response.data || []),
        catchError(error => throwError(() => error))
      );
  }

  getResources(chapterId: string): Observable<ResourceLookup[]> {
    return this.apiService
      .get<ApiResponse<ResourceLookup>>(API.RECRUITMENT.SPECIAL_DRIVES.LOOKUPS.RESOURCES(chapterId))
      .pipe(
        map(response => response.data || []),
        catchError(error => throwError(() => error))
      );
  }

  getSponsors(chapterId: string, searchText = '', take = 100, skip = 0): Observable<SponsorLookup[]> {
    return this.apiService
      .post<ApiResponse<SponsorLookup>>(
        API.RECRUITMENT.SPECIAL_DRIVES.LOOKUPS.SPONSORS(take, skip),
        { chapterId, searchText }
      )
      .pipe(
        map(response => response.data || []),
        catchError(error => throwError(() => error))
      );
  }

  getLocations(chapterId: string): Observable<LocationLookup[]> {
    return this.apiService
      .get<ApiResponse<LocationLookup>>(API.RECRUITMENT.SPECIAL_DRIVES.LOOKUPS.LOCATIONS(chapterId))
      .pipe(
        map(response => response.data || []),
        catchError(error => throwError(() => error))
      );
  }

  getRecruiters(chapterId: string): Observable<RecruiterLookup[]> {
    return this.apiService
      .get<ApiResponse<RecruiterLookup>>(API.RECRUITMENT.SPECIAL_DRIVES.LOOKUPS.RECRUITERS(chapterId))
      .pipe(
        map(response => response.data || []),
        catchError(error => throwError(() => error))
      );
  }

  getCancelCodes(): Observable<CancelCodeLookup[]> {
    return this.apiService
      .get<ApiResponse<CancelCodeLookup>>(API.RECRUITMENT.SPECIAL_DRIVES.LOOKUPS.CANCEL_CODES)
      .pipe(
        map(response => response.data || []),
        catchError(error => throwError(() => error))
      );
  }
}
