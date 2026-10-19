import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import {
  UserDriveAccessDto,
  DriveListItemDto,
  DriveDetailDto,
  SetDriveContextDto,
  ApiResponse
} from '../models/set-drive-date-id.model';
import { ApiService } from '@shared/services/api.service'; 
import { API } from 'src/app/core/constants/api.constants'; 

/**
 * Service for Set Drive Date and ID functionality
 * API Base: /api/v1/set-drive-date-and-id
 */
@Injectable({
  providedIn: 'root'
})
export class SetDriveDateIdService {
  private readonly apiService = inject(ApiService);

  /**
   * Get user drive access permissions and allowed date range
   * Endpoint: GET /api/v1/set-drive-date-and-id/user-access
   *
   * @returns UserDriveAccessDto with date range and DRVBK access flag
   */
  getUserDriveAccess(): Observable<ApiResponse<UserDriveAccessDto>> {
    return this.apiService.get<ApiResponse<UserDriveAccessDto>>(
      API.DONOR_FUNCTIONS.SET_DRIVE_DATE_AND_ID.USER_ACCESS
    ).pipe(
      catchError(error => {
        console.error('getUserDriveAccess failed:', error);
        throw error;
      })
    );
  }

  /**
   * Get drives for a specific date
   * Endpoint: GET /api/v1/set-drive-date-and-id/drives?driveDate={date}
   *
   * @param driveDate Date to retrieve drives for (YYYY-MM-DD format)
   * @returns List of confirmed drives for the date
   */
  getDrivesForDate(driveDate: string): Observable<ApiResponse<DriveListItemDto[]>> {
    const params = new HttpParams().set('driveDate', driveDate);

    return this.apiService.get<ApiResponse<DriveListItemDto[]>>(
      API.DONOR_FUNCTIONS.SET_DRIVE_DATE_AND_ID.DRIVES,
      { params }
    ).pipe(
      catchError(error => {
        console.error('getDrivesForDate failed:', error);
        throw error;
      })
    );
  }

  /**
   * Validate and set drive context
   * Endpoint: POST /api/v1/set-drive-date-and-id/validate
   *
   * @param dto Drive date and ID to set as context
   * @returns Drive details if validation succeeds
   */
  validateDriveContext(dto: SetDriveContextDto): Observable<ApiResponse<DriveDetailDto>> {
    return this.apiService.post<ApiResponse<DriveDetailDto>>(
      API.DONOR_FUNCTIONS.SET_DRIVE_DATE_AND_ID.VALIDATE,
      dto
    ).pipe(
      catchError(error => {
        console.error('validateDriveContext failed:', error);
        throw error;
      })
    );
  }
}
