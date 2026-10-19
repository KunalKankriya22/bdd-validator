import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { HttpContext } from '@angular/common/http';
import { ApiService } from '../../../../../../shared/services/api.service';
import { API } from '../../../../../../core/constants/api.constants';
import { SKIP_ERROR_TOAST } from '../../../../../../core/constants/http-context.constants';
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
import { mapResourceArray, mapSponsorArray, mapNoteArray } from '../utils/case-mapper.utils';

@Injectable({
  providedIn: 'root'
})
export class SpecialDriveService {
  private readonly apiService = inject(ApiService);

  /**
   * Search drives with pagination and filters
   * @param take Number of records to retrieve (max: 500)
   * @param skip Number of records to skip
   * @param request Search criteria
   * @returns Observable with data and total count
   */
  searchDrives(
    take: number,
    skip: number,
    request: SpecialDriveSearchRequest
  ): Observable<{ data: SpecialDriveDto[]; total: number }> {
    // Validate and sanitize pagination parameters
    const safeTake = Math.min(Math.max(1, take), 500);
    const safeSkip = Math.max(0, skip);

    // Validate request object
    if (!request) {
      return throwError(() => ({
        message: 'Search request is required',
        code: 'INVALID_REQUEST'
      }));
    }

    return this.apiService
      .post<ApiResponse<SpecialDriveDto>>(
        API.RECRUITMENT.SPECIAL_DRIVES.SEARCH(safeTake, safeSkip),
        request
      )
      .pipe(
        map(response => {
          if (!response) {
            throw new Error('No response received from server');
          }
          return {
            data: response.data || [],
            total: response.total || 0
          };
        }),
        catchError(error => {
          const errorMessage = error?.error?.message
            || error?.message
            || 'Failed to search drives. Please try again.';

          console.error('Error searching drives:', {
            take: safeTake,
            skip: safeSkip,
            request,
            error
          });

          return throwError(() => ({
            message: errorMessage,
            code: error?.error?.code || 'DRIVE_SEARCH_ERROR',
            originalError: error
          }));
        })
      );
  }

  /**
   * Get single drive by ID with all children (sponsors, resources, notes, employees)
   * @param driveId Drive ID
   * @param chapterId Chapter ID (required by backend)
   * @returns Observable of SpecialDriveDto
   * @throws Error if driveId or chapterId is empty or drive not found
   */
  getDriveById(driveId: string, chapterId: string): Observable<SpecialDriveDto> {
    if (!driveId?.trim()) {
      return throwError(() => ({
        message: 'Drive ID is required',
        code: 'INVALID_DRIVE_ID'
      }));
    }

    if (!chapterId?.trim()) {
      return throwError(() => ({
        message: 'Chapter ID is required',
        code: 'INVALID_CHAPTER_ID'
      }));
    }

    // Add chapterId as query parameter
    const url = `${API.RECRUITMENT.SPECIAL_DRIVES.GET_BY_ID(driveId.trim())}?chapterId=${encodeURIComponent(chapterId.trim())}`;

    return this.apiService
      .get<ApiResponse<SpecialDriveDto>>(url)
      .pipe(
        map(response => {
          if (!response) {
            throw new Error('No response received from server');
          }
          // Handle both camelCase and PascalCase responses from backend
          // Backend may return either 'item' or 'Item'
          const responseAny = response as any;
          const item = response.item ?? responseAny.Item;
          if (!item) {
            throw new Error(`Drive with ID ${driveId} not found`);
          }
          // Map PascalCase properties to camelCase for child collections using type-safe utilities
          // Backend may return PascalCase properties, so we need to check both cases
          const itemAny = item as any;
          item.resources = mapResourceArray(itemAny.Resources ?? item.resources);
          item.sponsors = mapSponsorArray(itemAny.Sponsors ?? item.sponsors);
          item.notes = mapNoteArray(itemAny.Notes ?? item.notes);
          return item;
        }),
        catchError(error => {
          console.error('Error loading drive by ID:', {
            driveId,
            chapterId,
            error
          });

          // Return raw error to maintain standard error structure
          return throwError(() => error);
        })
      );
  }

  /**
   * Create new drive
   * @param request Drive creation request
   * @returns Observable of ApiResponse with created drive
   * @throws Error if request is invalid
   */
  createDrive(request: CreateSpecialDriveRequest): Observable<ApiResponse<SpecialDriveDto>> {
    // Validate required fields
    if (!request) {
      return throwError(() => ({
        message: 'Drive creation request is required',
        code: 'INVALID_REQUEST'
      }));
    }

    if (!request.chapterId?.trim()) {
      return throwError(() => ({
        message: 'Chapter ID is required',
        code: 'INVALID_CHAPTER_ID'
      }));
    }

    if (!request.driveDate) {
      return throwError(() => ({
        message: 'Drive date is required',
        code: 'INVALID_DRIVE_DATE'
      }));
    }

    if (!request.sponsors || request.sponsors.length === 0) {
      return throwError(() => ({
        message: 'At least one sponsor is required',
        code: 'INVALID_SPONSORS'
      }));
    }

    // Map to backend DTO format (PascalCase)
    const backendRequest = {
      ChapterId: request.chapterId,
      DriveDate: request.driveDate,
      DriveType: request.driveType,
      DriveCategory: request.driveCategory,
      LocationId: request.locationId,
      RecruiterId: request.recruiterId,
      ScheduleStartTime: request.scheduleStartTime,
      ScheduleEndTime: request.scheduleEndTime,
      Status: request.status,
      Sponsors: request.sponsors?.map(s => ({
        SponsorId: s.sponsorId,
        ProjectedShow: s.projectedShow,
        ProjDeferralRate: s.projDeferralRate ?? s.projectedDraw ?? 0,
        ContactId: s.contactId
      })) || [],
      Resources: request.resources?.map((r, index) => ({
        ResourceCode: r.resourceCode,
        NumberRequired: r.numberRequired,
        SortSeq: r.sortSeq ?? index + 1
      })),
      Notes: request.notes?.map(n => ({
        Note: n.note,
        InsertUser: n.insertUser,
        InsertUserName: n.insertUserName,
        InsertDate: n.insertDate
      }))
    };

    return this.apiService
      .post<ApiResponse<SpecialDriveDto>>(
        API.RECRUITMENT.SPECIAL_DRIVES.CREATE,
        backendRequest,
        { context: new HttpContext().set(SKIP_ERROR_TOAST, true) }
      )
      .pipe(
        catchError(error => {
          const errorCode = error?.error?.errorCode || error?.error?.errorResponse?.errorCode;
          const baseMessage = error?.error?.errorResponse?.error
            || error?.error?.error
            || error?.error?.message
            || error?.message
            || 'Failed to create drive. Please try again.';
          const errorMessage = errorCode ? `Error ${errorCode}: ${baseMessage}` : baseMessage;

          console.error('Error creating drive:', { request, error });

          return throwError(() => ({
            message: errorMessage,
            code: errorCode || error?.error?.code || 'DRIVE_CREATE_ERROR',
            originalError: error
          }));
        })
      );
  }

  /**
   * Update existing drive
   * @param request Drive update request
   * @returns Observable of ApiResponse with updated drive
   * @throws Error if request is invalid
   */
  updateDrive(request: UpdateSpecialDriveRequest): Observable<ApiResponse<SpecialDriveDto>> {
    // Validate required fields
    if (!request) {
      return throwError(() => ({
        message: 'Drive update request is required',
        code: 'INVALID_REQUEST'
      }));
    }

    if (!request.driveId?.trim()) {
      return throwError(() => ({
        message: 'Drive ID is required',
        code: 'INVALID_DRIVE_ID'
      }));
    }

    if (!request.chapterId?.trim()) {
      return throwError(() => ({
        message: 'Chapter ID is required',
        code: 'INVALID_CHAPTER_ID'
      }));
    }

    if (request.auditKey === undefined || request.auditKey === null) {
      return throwError(() => ({
        message: 'Audit key is required for updates',
        code: 'INVALID_AUDIT_KEY'
      }));
    }

    // Map to backend DTO format (PascalCase)
    const backendRequest = {
      DriveId: request.driveId,
      ChapterId: request.chapterId,
      DriveDate: request.driveDate,
      DriveType: request.driveType,
      DriveCategory: request.driveCategory,
      LocationId: request.locationId,
      RecruiterId: request.recruiterId,
      ScheduleStartTime: request.scheduleStartTime,
      ScheduleEndTime: request.scheduleEndTime,
      Status: request.status,
      AuditKey: request.auditKey,
      Sponsors: request.sponsors?.map(s => ({
        SponsorId: s.sponsorId,
        ProjectedShow: s.projectedShow,
        ProjDeferralRate: s.projDeferralRate ?? s.projectedDraw ?? 0,
        ContactId: s.contactId
      })) || [],
      Resources: request.resources?.map((r, index) => ({
        ResourceCode: r.resourceCode,
        NumberRequired: r.numberRequired,
        SortSeq: r.sortSeq ?? index + 1
      })),
      Notes: request.notes?.map(n => ({
        Note: n.note,
        InsertUser: n.insertUser,
        InsertUserName: n.insertUserName,
        InsertDate: n.insertDate
      }))
    };

    return this.apiService
      .put<ApiResponse<SpecialDriveDto>>(
        API.RECRUITMENT.SPECIAL_DRIVES.UPDATE(request.driveId.trim()),
        backendRequest,
        { context: new HttpContext().set(SKIP_ERROR_TOAST, true) }
      )
      .pipe(
        catchError(error => {
          const errorCode = error?.error?.errorCode || error?.error?.errorResponse?.errorCode;
          const baseMessage = error?.error?.errorResponse?.error
            || error?.error?.error
            || error?.error?.message
            || error?.message
            || 'Failed to update drive. Please try again.';
          const errorMessage = errorCode ? `Error ${errorCode}: ${baseMessage}` : baseMessage;

          console.error('Error updating drive:', { driveId: request.driveId, error });

          return throwError(() => ({
            message: errorMessage,
            code: errorCode || error?.error?.code || 'DRIVE_UPDATE_ERROR',
            originalError: error
          }));
        })
      );
  }

  /**
   * Delete drive (soft delete - sets status to CANCL)
   * @param driveId Drive ID (required)
   * @param chapterId Chapter ID (optional - API will use UserContext header or default to "001")
   * @param cancelReasonCode Cancel reason code (optional)
   * @param cancelReason Cancel reason text (optional)
   * @returns Observable of ApiResponse
   * @throws Error if driveId is empty
   */
  deleteDrive(driveId: string, chapterId?: string, cancelReasonCode?: string, cancelReason?: string): Observable<ApiResponse<void>> {
    if (!driveId?.trim()) {
      return throwError(() => ({
        message: 'Drive ID is required',
        code: 'INVALID_DRIVE_ID'
      }));
    }

    // Build query params for chapterId and cancel reason
    // ChapterId is optional - API will use UserContext header or fallback to "001"
    const params: Record<string, string> = {};

    // Only include chapterId if provided and not empty
    if (chapterId?.trim()) {
      params['chapterId'] = chapterId.trim();
    }

    if (cancelReasonCode?.trim()) {
      params['cancelReasonCode'] = cancelReasonCode.trim();
    }
    if (cancelReason?.trim()) {
      params['cancelReason'] = cancelReason.trim();
    }

    return this.apiService
      .delete<ApiResponse<void>>(
        API.RECRUITMENT.SPECIAL_DRIVES.DELETE(driveId.trim()),
        { params } as any
      )
      .pipe(
        catchError(error => {
          console.error('Error cancelling drive:', {
            driveId,
            chapterId,
            cancelReasonCode,
            cancelReason,
            error
          });

          // Return raw error to maintain standard error structure
          return throwError(() => error);
        })
      );
  }

  /**
   * Recreate drive from template (Inside/Coach drives only)
   * @param request Recreate request with source drive ID and new date
   * @returns Observable of ApiResponse with recreated drive
   * @throws Error if request is invalid
   */
  recreateDrive(request: RecreateSpecialDriveRequest): Observable<ApiResponse<SpecialDriveDto>> {
    // Validate required fields
    if (!request) {
      return throwError(() => ({
        message: 'Recreate drive request is required',
        code: 'INVALID_REQUEST'
      }));
    }

    if (!request.sourceDriveId?.trim()) {
      return throwError(() => ({
        message: 'Source Drive ID is required',
        code: 'INVALID_SOURCE_DRIVE_ID'
      }));
    }

    if (!request.newDriveDate) {
      return throwError(() => ({
        message: 'New drive date is required',
        code: 'INVALID_DRIVE_DATE'
      }));
    }

    if (!request.chapterId?.trim()) {
      return throwError(() => ({
        message: 'Chapter ID is required',
        code: 'INVALID_CHAPTER_ID'
      }));
    }

    // Map to backend DTO format (PascalCase)
    const backendRequest = {
      SourceDriveId: request.sourceDriveId,
      DriveDate: request.newDriveDate,
      ChapterId: request.chapterId
    };

    return this.apiService
      .post<ApiResponse<SpecialDriveDto>>(
        API.RECRUITMENT.SPECIAL_DRIVES.RECREATE,
        backendRequest
      )
      .pipe(
        catchError(error => {
          const errorMessage = error?.error?.message
            || error?.message
            || 'Failed to recreate drive. Please try again.';

          console.error('Error recreating drive:', {
            request,
            error
          });

          return throwError(() => ({
            message: errorMessage,
            code: error?.error?.code || 'DRIVE_RECREATE_ERROR',
            originalError: error
          }));
        })
      );
  }

  // --- Lookup Methods ---

  /**
   * Get drive IDs for filter dropdown
   * @param chapterId - Chapter ID to filter drives
   * @returns Observable of drive ID lookup array
   */
  getDriveIds(chapterId: string): Observable<DriveIdLookup[]> {
    if (!chapterId?.trim()) {
      return throwError(() => ({
        message: 'Chapter ID is required to load drive IDs',
        code: 'INVALID_CHAPTER_ID'
      }));
    }

    const url = `${API.RECRUITMENT.SPECIAL_DRIVES.LOOKUPS.DRIVE_IDS(chapterId.trim())}`;

    return this.apiService
      .get<ApiResponse<DriveIdLookup>>(url)
      .pipe(
        map(response => {
          if (!response) {
            throw new Error('No response received from server');
          }
          return response.data || [];
        }),
        catchError(error => {
          const errorMessage = error?.error?.message
            || error?.message
            || 'Failed to load drive IDs. Please try again.';

          console.error('Error loading drive IDs:', error);

          return throwError(() => ({
            message: errorMessage,
            code: error?.error?.code || 'DRIVE_ID_LOAD_ERROR',
            originalError: error
          }));
        })
      );
  }

  /**
   * Get drive categories (DRCAT codes from VALID_MASTER_CODES)
   * @returns Observable of drive category lookup array
   */
  getDriveCategories(): Observable<DriveCategoryLookup[]> {
    return this.apiService
      .get<ApiResponse<DriveCategoryLookup>>(
        API.RECRUITMENT.SPECIAL_DRIVES.LOOKUPS.DRIVE_CATEGORIES
      )
      .pipe(
        map(response => {
          if (!response) {
            throw new Error('No response received from server');
          }
          return response.data || [];
        }),
        catchError(error => {
          const errorMessage = error?.error?.message
            || error?.message
            || 'Failed to load drive categories. Please try again.';

          console.error('Error loading drive categories:', error);

          return throwError(() => ({
            message: errorMessage,
            code: error?.error?.code || 'CATEGORY_LOAD_ERROR',
            originalError: error
          }));
        })
      );
  }

  /**
   * Get valid resources (from VALID_RESOURCES table)
   * @param chapterId - Chapter ID to filter resources
   * @returns Observable of resource lookup array
   */
  getResources(chapterId: string): Observable<ResourceLookup[]> {
    if (!chapterId?.trim()) {
      return throwError(() => ({
        message: 'Chapter ID is required to load resources',
        code: 'INVALID_CHAPTER_ID'
      }));
    }

    return this.apiService
      .get<ApiResponse<ResourceLookup>>(
        API.RECRUITMENT.SPECIAL_DRIVES.LOOKUPS.RESOURCES(chapterId.trim())
      )
      .pipe(
        map(response => {
          if (!response) {
            throw new Error('No response received from server');
          }
          return response.data || [];
        }),
        catchError(error => {
          const errorMessage = error?.error?.message
            || error?.message
            || 'Failed to load resources. Please try again.';

          console.error('Error loading resources:', error);

          return throwError(() => ({
            message: errorMessage,
            code: error?.error?.code || 'RESOURCE_LOAD_ERROR',
            originalError: error
          }));
        })
      );
  }

  /**
   * Get active sponsors for chapter
   * @param chapterId Chapter ID
   * @param searchText Optional search text (min 3 chars)
   * @param take Number of records to retrieve (default: 100, max: 500)
   * @param skip Number of records to skip (default: 0)
   * @returns Observable of sponsor lookup array
   * @throws Error if chapterId is empty or searchText is invalid
   */
  getSponsors(
    chapterId: string,
    searchText: string = '',
    take: number = 100,
    skip: number = 0
  ): Observable<SponsorLookup[]> {
    // Validation
    if (!chapterId?.trim()) {
      return throwError(() => ({
        message: 'Chapter ID is required',
        code: 'INVALID_CHAPTER_ID'
      }));
    }

    if (searchText && searchText.trim().length > 0 && searchText.trim().length < 3) {
      return throwError(() => ({
        message: 'Search text must be at least 3 characters',
        code: 'INVALID_SEARCH_TEXT'
      }));
    }

    // Enforce maximum take value to prevent performance issues
    const safeTake = Math.min(Math.max(1, take), 500);
    const safeSkip = Math.max(0, skip);

    return this.apiService
      .post<ApiResponse<SponsorLookup>>(
        API.RECRUITMENT.SPECIAL_DRIVES.LOOKUPS.SPONSORS(safeTake, safeSkip),
        {
          ChapterId: chapterId.trim(),
          SearchText: searchText.trim()
        }
      )
      .pipe(
        map(response => {
          if (!response) {
            throw new Error('No response received from server');
          }
          return response.data || [];
        }),
        catchError(error => {
          const errorMessage = error?.error?.message
            || error?.message
            || 'Failed to load sponsors. Please try again.';

          console.error('Error loading sponsors:', {
            chapterId,
            searchText,
            take: safeTake,
            skip: safeSkip,
            error
          });

          return throwError(() => ({
            message: errorMessage,
            code: error?.error?.code || 'SPONSOR_LOAD_ERROR',
            originalError: error
          }));
        })
      );
  }

  /**
   * Get locations for chapter
   * @param chapterId Chapter ID
   * @returns Observable of location lookup array
   * @throws Error if chapterId is empty
   */
  getLocations(chapterId: string): Observable<LocationLookup[]> {
    if (!chapterId?.trim()) {
      return throwError(() => ({
        message: 'Chapter ID is required',
        code: 'INVALID_CHAPTER_ID'
      }));
    }

    return this.apiService
      .get<ApiResponse<LocationLookup>>(
        API.RECRUITMENT.SPECIAL_DRIVES.LOOKUPS.LOCATIONS(chapterId.trim())
      )
      .pipe(
        map(response => {
          if (!response) {
            throw new Error('No response received from server');
          }
          return response.data || [];
        }),
        catchError(error => {
          const errorMessage = error?.error?.message
            || error?.message
            || 'Failed to load locations. Please try again.';

          console.error('Error loading locations:', {
            chapterId,
            error
          });

          return throwError(() => ({
            message: errorMessage,
            code: error?.error?.code || 'LOCATION_LOAD_ERROR',
            originalError: error
          }));
        })
      );
  }

  /**
   * Get recruiters (employees with RECRT class) for chapter
   * @param chapterId Chapter ID
   * @returns Observable of recruiter lookup array
   * @throws Error if chapterId is empty
   */
  getRecruiters(chapterId: string): Observable<RecruiterLookup[]> {
    if (!chapterId?.trim()) {
      return throwError(() => ({
        message: 'Chapter ID is required',
        code: 'INVALID_CHAPTER_ID'
      }));
    }

    return this.apiService
      .get<ApiResponse<RecruiterLookup>>(
        API.RECRUITMENT.SPECIAL_DRIVES.LOOKUPS.RECRUITERS(chapterId.trim())
      )
      .pipe(
        map(response => {
          if (!response) {
            throw new Error('No response received from server');
          }
          return response.data || [];
        }),
        catchError(error => {
          const errorMessage = error?.error?.message
            || error?.message
            || 'Failed to load recruiters. Please try again.';

          console.error('Error loading recruiters:', {
            chapterId,
            error
          });

          return throwError(() => ({
            message: errorMessage,
            code: error?.error?.code || 'RECRUITER_LOAD_ERROR',
            originalError: error
          }));
        })
      );
  }

  /**
   * Get default deferral rate from VALID_PARAMETERS (DEFRT) for the user's chapter.
   * ChapterId is retrieved from UserContext (X-ChapterId header).
   * @returns Observable of the default deferral rate as a number
   */
  getDefaultDeferralRate(): Observable<number> {
    return this.apiService
      .get<ApiResponse<number>>(API.RECRUITMENT.SPECIAL_DRIVES.LOOKUPS.DEFAULT_DEFERRAL_RATE)
      .pipe(
        map(response => {
          if (!response) {
            throw new Error('No response received from server');
          }
          return response.item ?? 18;
        }),
        catchError(error => {
          console.error('Error loading default deferral rate:', error);
          return throwError(() => ({
            message: error?.error?.message || error?.message || 'Failed to load default deferral rate.',
            code: error?.error?.code || 'DEFAULT_DEFERRAL_RATE_ERROR',
            originalError: error
          }));
        })
      );
  }

  /**
   * Get SPDR_LIMIT parameter value from VALID_PARAMETERS.
   * Determines how many days in the past a drive date is allowed (error 11019).
   * ChapterId is retrieved from UserContext (X-ChapterId header).
   * @returns Observable of the SPDR_LIMIT as a number (defaults to 0 if not found)
   */
  getSpdrLimit(): Observable<number> {
    return this.apiService
      .get<ApiResponse<number>>(API.RECRUITMENT.SPECIAL_DRIVES.LOOKUPS.SPDR_LIMIT)
      .pipe(
        map(response => {
          if (!response) {
            throw new Error('No response received from server');
          }
          return response.item ?? 0;
        }),
        catchError(error => {
          console.error('Error loading SPDR_LIMIT:', error);
          return throwError(() => ({
            message: error?.error?.message || error?.message || 'Failed to load SPDR limit.',
            code: error?.error?.code || 'SPDR_LIMIT_LOAD_ERROR',
            originalError: error
          }));
        })
      );
  }

  /**
   * Get cancel reason codes for drive cancellation
   * ChapterId is retrieved from UserContext (X-ChapterId header)
   * @returns Observable of cancel code lookup array
   */
  cancelDrive(driveId: string, cancelReasonCode?: string, cancelReason?: string): Observable<ApiResponse<any>> {
    if (!driveId || !driveId.trim()) {
      return throwError(() => ({ message: 'Drive ID is required for cancellation.' }));
    }
    return this.apiService
      .post<ApiResponse<any>>(
        API.RECRUITMENT.CANCEL_DRIVES.CANCEL(driveId.trim()),
        {
          cancelReasonCode: cancelReasonCode || '',
          cancelReason: cancelReason || '',
          confirmCancellation: true
        }
      )
      .pipe(
        map(response => {
          if (!response) {
            throw new Error('No response received from server');
          }
          return response;
        }),
        catchError(error => {
          return throwError(() => ({
            message: error?.error?.message || error?.message || 'Failed to cancel drive.',
            code: error?.error?.code || 'CANCEL_DRIVE_ERROR',
            originalError: error
          }));
        })
      );
  }

  getCancelCodes(): Observable<CancelCodeLookup[]> {
    return this.apiService
      .get<ApiResponse<CancelCodeLookup>>(
        API.RECRUITMENT.SPECIAL_DRIVES.LOOKUPS.CANCEL_CODES
      )
      .pipe(
        map(response => {
          if (!response) {
            throw new Error('No response received from server');
          }
          return response.data || [];
        }),
        catchError(error => {
          const errorMessage = error?.error?.message
            || error?.message
            || 'Failed to load cancel codes. Please try again.';

          console.error('Error loading cancel codes:', error);

          return throwError(() => ({
            message: errorMessage,
            code: error?.error?.code || 'CANCEL_CODE_LOAD_ERROR',
            originalError: error
          }));
        })
      );
  }
}
