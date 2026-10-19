import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { TemporaryDrive, CreateDriveRequest, CreateDriveResponse, PastDrive, CalculateStaffRequest, CalculateStaffResponse, DriveEstimatedResource, CentralNote, CreateNoteRequest } from '../models/temporary-drive.model';
import { TemporaryDriveFilterValue } from '../models/temporary-drive-filter.model';
import { ApiService } from '@shared/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class TemporaryDriveService {
  private readonly apiService = inject(ApiService);

  /**
   * Get all temporary drives for a chapter with pagination and filters
   * Backend endpoint: GET /api/v1/donor-recruitment/drives/temp/{take}/{skip}
   * @param take - Number of records to fetch
   * @param skip - Number of records to skip (pageIndex × pageSize)
   * @param chapterId - Chapter ID
   * @param filters - Optional filter criteria
   * @returns Observable with data array and total count
   */
  getTemporaryDrives(
    take: number,
    skip: number,
    chapterId: string,
    filters?: TemporaryDriveFilterValue | null
  ): Observable<{ data: TemporaryDrive[]; totalRecords: number }> {
    let params = new HttpParams().set('chapterId', chapterId);

    // Add optional filter parameters
    if (filters?.driveDate) {
      params = params.set('driveDate', filters.driveDate.toISOString());
    }
    if (filters?.sponsorId) {
      params = params.set('sponsorId', filters.sponsorId);
    }
    if (filters?.driveType) {
      params = params.set('driveType', filters.driveType);
    }
    if (filters?.driveCategory) {
      params = params.set('driveCategory', filters.driveCategory);
    }

    return this.apiService.get<any>(`/api/v1/donor-recruitment/drives/temp/${take}/${skip}`, {
      params
    }).pipe(
      map(response => {
        // Backend returns: { success, statusCode, message, data: TempDrive[], total }
        const data = response.data && Array.isArray(response.data)
          ? response.data.map((item: any) => this.mapBackendToUI(item))
          : [];
        const totalRecords = response.total || 0;

        return { data, totalRecords };
      })
    );
  }

  /**
   * Get single temporary drive by ID
   * Backend endpoint: GET /api/v1/donor-recruitment/drives/temp/{tempdrId}
   * Backend returns TempDriveDto directly (not wrapped in { data: ... })
   */
  getTemporaryDriveById(temporaryDriveId: string): Observable<TemporaryDrive | null> {
    return this.apiService.get<any>(`/api/v1/donor-recruitment/drives/temp/${temporaryDriveId}`).pipe(
      map(response => {
        // Backend controller returns Ok(result) directly, not wrapped in { data: result }
        if (response) {
          return this.mapBackendToUI(response);
        }
        return null;
      })
    );
  }

  /**
   * Confirm temporary drive (convert to permanent drive)
   * Backend endpoint: POST /api/v1/donor-recruitment/drives/temp/{tempdrId}/confirm?chapterId={chapterId}
   * Backend returns: { driveId, message, resources, notes } all in one response
   */
  createDriveFromTemporary(request: CreateDriveRequest): Observable<CreateDriveResponse> {
    const tempdrId = request.temporaryDriveId || '';
    const payload = {
      driveId: request.driveDetails.driveId,
      status: 'CNFRM',
      // Include form data for required fields
      locationId: request.sponsorProjection.locationId,
      recruiterId: request.driveDetails.recruiterId,
      driveCategory: request.driveDetails.category,
      driveType: request.driveDetails.driveType,
      // Include notes array to save with the drive
      notes: request.notes && request.notes.length > 0 ? request.notes : null
    };

    return this.apiService.post<any>(
      `/api/v1/donor-recruitment/drives/temp/${tempdrId}/confirm`,
      payload,
      { params: new HttpParams().set('chapterId', request.chapterId || '') }
    ).pipe(
      map(response => ({
        success: true,
        message: response.message || 'Drive created successfully',
        driveId: response.driveId,
        resources: response.resources || []
      }))
    );
  }

  /**
   * Map backend TempDrive model to UI TemporaryDrive model
   */
  private mapBackendToUI(backend: any): TemporaryDrive {
    return {
      driveDate: backend.driveDate || backend.DRIVE_DATE,
      temporaryDriveId: backend.tempdrId || backend.TEMPDR_ID,
      sponsorId: backend.sponsorId || '',
      sponsorName: backend.sponsorName || '',
      projectedShow: backend.projectedShow || 0,
      projectedDraw: backend.projectedDraw || 0,
      type: backend.driveType || backend.DRIVE_TYPE || 'Mobile',
      category: backend.driveCategory || backend.DRIVE_CATEGORY || '',
      contactPerson: backend.contactPerson || '',
      recruiter: backend.recruiter || backend.RECRUITER || '',
      location: backend.location || backend.LOCATION || '',
      time: this.formatTime(backend.scheduleStartTime || backend.SCHEDULE_START_TIME,
                           backend.scheduleEndTime || backend.SCHEDULE_END_TIME),
      // Resource requirements
      staffReqd: backend.staffReqd || backend.STAFF_REQD || 0,
      vanReqd: backend.vanReqd || backend.VAN_REQD || 0,
      coachReqd: backend.coachReqd || backend.COACH_REQD || 0,
      bedReqd: backend.bedReqd || backend.BED_REQD || 0,
      // Generated Drive ID from BC_ID_GENERATOR package
      suggestedDriveId: backend.suggestedDriveId || backend.SuggestedDriveId
    };
  }

  /**
   * Format start and end time for display
   */
  private formatTime(startTime?: string, endTime?: string): string {
    if (!startTime && !endTime) return '';
    const start = startTime || '00:00';
    const end = endTime || '00:00';
    return `${start}–${end}`;
  }

  /**
   * Remove (soft delete) a temporary drive
   * Backend endpoint: DELETE /api/v1/donor-recruitment/drives/temp/{tempdrId}?chapterId={chapterId}
   */
  removeDrive(temporaryDriveId: string, chapterId: string): Observable<{ success: boolean; message: string }> {
    return this.apiService.delete<any>(
      `/api/v1/donor-recruitment/drives/temp/${temporaryDriveId}`,
      { params: new HttpParams().set('chapterId', chapterId) }
    ).pipe(
      map(response => ({
        success: true,
        message: response.message || 'Temporary drive removed successfully'
      }))
    );
  }

  /**
   * Get suitable dates for scheduling drives
   * Backend endpoint: GET /donor-recruitment/drives/suitable-dates?fromDate={date}&toDate={date}&chapterId={id}
   * Note: Backend returns empty array until resource calculation is implemented
   */
  getSuitableDates(fromDate: string, toDate: string, chapterId: string): Observable<any[]> {
    return this.apiService.get<any[]>(
      '/api/v1/donor-recruitment/drives/suitable-dates',
      {
        params: new HttpParams()
          .set('fromDate', fromDate)
          .set('toDate', toDate)
          .set('chapterId', chapterId)
      }
    ).pipe(
      map(response => {
        if (!response) return [];
        // Map backend PascalCase to frontend camelCase
        return response.map((item: any) => ({
          date: item.dateStr || item.DateStr,
          dayOfWeek: item.dayOfWeek || item.DayOfWeek,
          status: item.status || item.Status,
          isSuitable: item.isSuitable || item.IsSuitable
        }));
      })
    );
  }

  /**
   * Get past drives for a sponsor (last 3 confirmed drives)
   * Backend endpoint: GET /api/v1/donor-recruitment/drives/past-drives?sponsorId={id}&chapterId={id}
   */
  getPastDrives(sponsorId: string, chapterId: string): Observable<PastDrive[]> {
    return this.apiService.get<any>('/api/v1/donor-recruitment/drives/past-drives', {
      params: new HttpParams()
        .set('sponsorId', sponsorId)
        .set('chapterId', chapterId)
    }).pipe(
      map(response => {
        // Backend returns: { message, data: PastDrive[] }
        if (response && response.data && Array.isArray(response.data)) {
          // Map backend PascalCase to frontend camelCase
          return response.data.map((item: any) => ({
            driveId: item.driveId || item.DriveId,
            driveDate: item.driveDate || item.DriveDate,
            projectedShow: item.projectedShow || item.ProjectedShow || 0,
            projectedDraw: item.projectedDraw || item.ProjectedDraw || 0,
            locationName: item.locationName || item.LocationName || '',
            actualShow: item.actualShow || item.ActualShow || 0,
            actualDraw: item.actualDraw || item.ActualDraw || 0,
            deferralPercentage: item.deferralPercentage || item.DeferralPercentage || 0
          }));
        }
        return [];
      })
    );
  }

  /**
   * Calculate staff requirements based on projected show and drive duration
   * Backend endpoint: POST /api/v1/donor-recruitment/drives/calculate-staff
   */
  calculateStaff(request: CalculateStaffRequest): Observable<CalculateStaffResponse> {
    return this.apiService.post<any>(
      '/api/v1/donor-recruitment/drives/calculate-staff',
      request
    ).pipe(
      map(response => {
        // Backend returns: { success, statusCode, message, data: CalculateStaffResponse }
        if (response && response.data) {
          return response.data;
        }
        return response;
      })
    );
  }

  /**
   * Get drive estimated resources
   * Backend endpoint: GET /api/v1/donor-recruitment/drives/{driveId}/resources?chapterId={chapterId}
   */
  getDriveEstimatedResources(driveId: string, chapterId: string): Observable<DriveEstimatedResource[]> {
    return this.apiService.get<any>(
      `/api/v1/donor-recruitment/drives/${driveId}/resources`,
      { params: new HttpParams().set('chapterId', chapterId) }
    ).pipe(
      map(response => {
        // Backend returns: { success, statusCode, message, data: DriveEstimatedResource[] }
        if (response && response.data && Array.isArray(response.data)) {
          return response.data;
        }
        return [];
      })
    );
  }

  /**
   * Get all notes for a drive
   * Backend endpoint: GET /api/v1/donor-recruitment/drives/{driveId}/notes?chapterId={chapterId}
   */
  getDriveNotes(driveId: string, chapterId: string): Observable<CentralNote[]> {
    return this.apiService.get<any>(
      `/api/v1/donor-recruitment/drives/${driveId}/notes`,
      { params: new HttpParams().set('chapterId', chapterId) }
    ).pipe(
      map(response => {
        // Backend returns: { message, data: CentralNote[] }
        if (response && response.data && Array.isArray(response.data)) {
          return response.data;
        }
        return [];
      })
    );
  }

  /**
   * Create a new note for a drive
   * Backend endpoint: POST /api/v1/donor-recruitment/drives/{driveId}/notes
   */
  createDriveNote(driveId: string, request: CreateNoteRequest): Observable<any> {
    return this.apiService.post<any>(
      `/api/v1/donor-recruitment/drives/${driveId}/notes`,
      request
    ).pipe(
      map(response => {
        // Backend returns: { message }
        return response;
      })
    );
  }
}
