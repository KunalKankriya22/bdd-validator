import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { HeaderService } from '@shared/services/header.service';
import { LoginService } from '@shared/services/login.service';
import { API } from '../../../../../../core/constants/api.constants';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import {
  ApiResponse,
  DriveDetailsQueryFilters,
  DriveDetailsQueryParams,
  DriveDetailsQueryResponse,
  DriveDetailsModel,
  DriveNote,
  LocationNote,
  DriveChecklistItem,
  DriveResourcesResponse,
  PickupScheduleItem,
  DriveSuppliesResponse,
  DriveProceduresResponse
} from '../models/drive-details-query.model';

@Injectable({
  providedIn: 'root'
})
export class DriveDetailsQueryService {
  private readonly apiService = inject(ApiService);
  private readonly headerService = inject(HeaderService);
  private readonly loginService = inject(LoginService);

  /**
   * Get filter dropdown data (Select options, Sponsors, Drives)
   * GET /api/v1/drive-details-query/filters
   */
  getFilters(): Observable<DriveDetailsQueryFilters> {
    const chapterId = this.headerService.chapterId();
    let params = new HttpParams();

    if (chapterId) {
      params = params.set('chapterId', chapterId);
    }

    return this.apiService
      .get<ApiResponse<DriveDetailsQueryFilters>>(
        API.RECRUITMENT.DRIVE_DETAILS_QUERY.FILTERS,
        { params }
      )
      .pipe(
        map(response => response.item || {
          selectOptions: [],
          sponsors: [],
          drives: []
        }),
        catchError(error => {
          console.error('Error fetching drive details query filters:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get drive details with notes
   * POST /api/v1/drive-details-query
   */
  getDriveDetails(params: DriveDetailsQueryParams): Observable<DriveDetailsQueryResponse> {
    const chapterId = this.headerService.chapterId();
    const userName = this.loginService.getStoredUsername();

    const requestBody: DriveDetailsQueryParams = {
      ...params,
      chapterId: chapterId || undefined,
      loggedInUserName: userName || undefined,
      // Serialize date if provided
      driveDate: params.driveDate
        ? DateFieldValidationUtility.serializeDateForApi(new Date(params.driveDate)) || undefined
        : undefined
    };

    return this.apiService
      .post<ApiResponse<DriveDetailsQueryResponse>>(
        API.RECRUITMENT.DRIVE_DETAILS_QUERY.GET_DETAILS,
        requestBody
      )
      .pipe(
        map(response => {
          const item = response.item;
          return {
            driveDetails: item?.driveDetails || null,
            notes: item?.notes || []
          };
        }),
        catchError(error => {
          if (error.status === 404) {
            return of({ driveDetails: null, notes: [] });
          }
          console.error('Error fetching drive details:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get location notes for a drive
   * GET /api/v1/drive-details-query/location-notes
   */
  getLocationNotes(driveId: string): Observable<LocationNote[]> {
    const chapterId = this.headerService.chapterId();
    let params = new HttpParams();

    params = params.set('driveId', driveId);
    if (chapterId) {
      params = params.set('chapterId', chapterId);
    }

    return this.apiService
      .get<ApiResponse<LocationNote>>(
        API.RECRUITMENT.DRIVE_DETAILS_QUERY.LOCATION_NOTES,
        { params }
      )
      .pipe(
        map(response => response.data || []),
        catchError(error => {
          console.error('Error fetching location notes:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get drive checklist items
   * GET /api/v1/drive-details-query/checklist
   */
  getDriveChecklist(driveId: string): Observable<DriveChecklistItem[]> {
    const chapterId = this.headerService.chapterId();
    let params = new HttpParams();

    params = params.set('driveId', driveId);
    if (chapterId) {
      params = params.set('chapterId', chapterId);
    }

    return this.apiService
      .get<ApiResponse<DriveChecklistItem>>(
        API.RECRUITMENT.DRIVE_DETAILS_QUERY.CHECKLIST,
        { params }
      )
      .pipe(
        map(response => response.data || []),
        catchError(error => {
          console.error('Error fetching drive checklist:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get drive resources (estimated, scheduled staff, actual staff)
   * GET /api/v1/drive-details-query/resources
   */
  getDriveResources(driveId: string, scheduleId?: string): Observable<DriveResourcesResponse> {
    const chapterId = this.headerService.chapterId();
    let params = new HttpParams();

    params = params.set('driveId', driveId);
    if (chapterId) {
      params = params.set('chapterId', chapterId);
    }
    if (scheduleId) {
      params = params.set('scheduleId', scheduleId);
    }

    return this.apiService
      .get<ApiResponse<DriveResourcesResponse>>(
        API.RECRUITMENT.DRIVE_DETAILS_QUERY.RESOURCES,
        { params }
      )
      .pipe(
        map(response => response.item || {
          estimatedResources: [],
          scheduledStaff: [],
          actualStaff: []
        }),
        catchError(error => {
          console.error('Error fetching drive resources:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get pickup schedule for a drive
   * GET /api/v1/drive-details-query/pickup-schedule
   */
  getPickupSchedule(driveId: string): Observable<PickupScheduleItem[]> {
    const chapterId = this.headerService.chapterId();
    let params = new HttpParams();

    params = params.set('driveId', driveId);
    if (chapterId) {
      params = params.set('chapterId', chapterId);
    }

    return this.apiService
      .get<ApiResponse<PickupScheduleItem>>(
        API.RECRUITMENT.DRIVE_DETAILS_QUERY.PICKUP_SCHEDULE,
        { params }
      )
      .pipe(
        map(response => response.data || []),
        catchError(error => {
          console.error('Error fetching pickup schedule:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get drive supplies (campaign items and bags)
   * GET /api/v1/drive-details-query/supplies
   */
  getDriveSupplies(driveId: string): Observable<DriveSuppliesResponse> {
    const chapterId = this.headerService.chapterId();
    let params = new HttpParams();

    params = params.set('driveId', driveId);
    if (chapterId) {
      params = params.set('chapterId', chapterId);
    }

    return this.apiService
      .get<ApiResponse<DriveSuppliesResponse>>(
        API.RECRUITMENT.DRIVE_DETAILS_QUERY.SUPPLIES,
        { params }
      )
      .pipe(
        map(response => response.item || {
          campaignId: null,
          campaignName: null,
          campaignItems: [],
          bags: []
        }),
        catchError(error => {
          console.error('Error fetching drive supplies:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get drive procedures (scheduled and actual)
   * GET /api/v1/drive-details-query/procedures
   */
  getDriveProcedures(driveId: string): Observable<DriveProceduresResponse> {
    const chapterId = this.headerService.chapterId();
    let params = new HttpParams();

    params = params.set('driveId', driveId);
    if (chapterId) {
      params = params.set('chapterId', chapterId);
    }

    return this.apiService
      .get<ApiResponse<DriveProceduresResponse>>(
        API.RECRUITMENT.DRIVE_DETAILS_QUERY.PROCEDURES,
        { params }
      )
      .pipe(
        map(response => response.item || {
          scheduled: [],
          actual: []
        }),
        catchError(error => {
          console.error('Error fetching drive procedures:', error);
          return throwError(() => error);
        })
      );
  }
}
