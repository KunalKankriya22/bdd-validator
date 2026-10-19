import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';
import {
  SearchDrivesQueryDto,
  CancelDriveRequestDto,
  DriveForCancellationDto,
  DriveCancellationDetailsDto,
  DriveLookupDto,
  CancelReasonCodeDto,
  CancelDriveResultDto,
  CancelDriveApiResponse,
} from '../models/cancel-drive.model';

@Injectable({ providedIn: 'root' })
export class CancelDriveService {
  private readonly apiService = inject(ApiService);

  searchDrives(query: SearchDrivesQueryDto): Observable<{ data: DriveForCancellationDto[]; total: number }> {
    return this.apiService
      .post<CancelDriveApiResponse<DriveForCancellationDto[]>>(
        API.RECRUITMENT.CANCEL_DRIVES.SEARCH,
        query
      )
      .pipe(
        map(response => ({
          data: response.data || [],
          total: response.totalCount ?? response.total ?? 0,
        })),
        catchError(error => throwError(() => error))
      );
  }

  getDriveDetails(driveId: string): Observable<DriveCancellationDetailsDto> {
    if (!driveId?.trim()) {
      return throwError(() => ({ message: 'Drive ID is required' }));
    }
    return this.apiService
      .get<CancelDriveApiResponse<DriveCancellationDetailsDto>>(
        API.RECRUITMENT.CANCEL_DRIVES.GET_BY_ID(driveId.trim())
      )
      .pipe(
        map(response => response.data),
        catchError(error => throwError(() => error))
      );
  }

  getCancelReasonCodes(): Observable<CancelReasonCodeDto[]> {
    return this.apiService
      .get<CancelDriveApiResponse<CancelReasonCodeDto[]>>(
        API.RECRUITMENT.CANCEL_DRIVES.LOOKUPS.CANCEL_REASON_CODES
      )
      .pipe(
        map(response => response.data || []),
        catchError(error => throwError(() => error))
      );
  }

  getDrivesLookup(driveId?: string, driveDate?: string): Observable<DriveLookupDto[]> {
    const params: Record<string, string> = {};
    if (driveId) params['driveId'] = driveId;
    if (driveDate) params['driveDate'] = driveDate;
    const query = Object.keys(params).length
      ? '?' + new URLSearchParams(params).toString()
      : '';
    return this.apiService
      .get<CancelDriveApiResponse<DriveLookupDto[]>>(
        `${API.RECRUITMENT.CANCEL_DRIVES.LOOKUPS.DRIVES_LOOKUP}${query}`
      )
      .pipe(
        map(response => {
          const raw: any[] = response.data || [];
          return raw.map((item: any) => ({
            driveId: item.driveId ?? item.DriveId ?? '',
            driveDate: item.driveDate ?? item.DriveDate,
            sponsorName: item.sponsorName ?? item.SponsorName,
          }));
        }),
        catchError(error => throwError(() => error))
      );
  }

  cancelDrive(driveId: string, request: CancelDriveRequestDto): Observable<CancelDriveResultDto> {
    if (!driveId?.trim()) {
      return throwError(() => ({ message: 'Drive ID is required' }));
    }
    return this.apiService
      .post<CancelDriveApiResponse<CancelDriveResultDto>>(
        API.RECRUITMENT.CANCEL_DRIVES.CANCEL(driveId.trim()),
        request
      )
      .pipe(
        map(response => response.data),
        catchError(error => throwError(() => error))
      );
  }
}
