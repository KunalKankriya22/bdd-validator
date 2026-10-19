import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from '../../../core/constants/api.constants';
import {
  NotificationLetterDto,
  DonorInfoDto,
  LetterDropdownDto,
  LetterTemplateDto,
  AuthorizeLetterRequestDto,
  AuthorizeLetterResponseDto,
  RejectLetterRequestDto,
  RejectLetterResponseDto,
  UpdateLetterTextRequestDto,
  UpdateLetterTextResponseDto,
  SaveLetterRequestDto,
  SaveLetterResponseDto,
} from './authorize-notification-letter-dialog.model';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data: T | T[] | null;
  error: string | null;
  totalCount?: number;
}

@Injectable({ providedIn: 'root' })
export class AuthorizeNotificationLetterApiService {
  private apiService = inject(ApiService);

  // Get donor info using NotificationLetter endpoint
  // Endpoint: GET /notification-letter/{donorId}/donor-info?unitId={unitId}
  getDonorInfo(donorId: string, unitId?: string): Observable<DonorInfoDto | null> {
    let url = API.NOTIFICATION_LETTER.GET_DONOR_INFO(donorId);
    if (unitId) {
      url += `?unitId=${encodeURIComponent(unitId)}`;
    }
    return this.apiService
      .get<ApiResponse<DonorInfoDto>>(url)
      .pipe(
        map((response) => {
          if (response.data && !Array.isArray(response.data)) {
            return response.data;
          }
          if (response.data && Array.isArray(response.data) && response.data.length > 0) {
            return response.data[0];
          }
          return null;
        }),
        catchError((error) => {
          // Handle 404 - Donor not found
          if (error.status === 404) {
            return throwError(() => new Error(`Donor ID ${donorId} not found in database`));
          }
          // Handle other errors
          return throwError(() => new Error(error.message || 'Failed to load donor information'));
        })
      );
  }

  // Get dropdown values for adding notification letter
  // Endpoint: GET /notification-letter/letters-dropdown?category={category}
  getLettersDropdown(category?: string): Observable<LetterDropdownDto[]> {
    let url = API.NOTIFICATION_LETTER.GET_LETTERS_DROPDOWN;
    if (category) {
      url += `?category=${encodeURIComponent(category)}`;
    }
    return this.apiService
      .get<ApiResponse<LetterDropdownDto>>(url)
      .pipe(
        map((response) => {
          if (response.data && Array.isArray(response.data)) {
            return response.data;
          }
          return [];
        }),
        catchError((error) => throwError(() => error))
      );
  }

  // Get letter template text by letter ID and letter code
  // Backend endpoint: GET /notification-letter/letter-template/{letterId}/{letterCode}
  // Returns: ReturnResult<LetterTemplateDto> with letterTemplate property
  getLetterTemplate(letterId: string, letterCode: string): Observable<LetterTemplateDto | null> {
    return this.apiService
      .get<ApiResponse<LetterTemplateDto>>(API.NOTIFICATION_LETTER.GET_LETTER_TEMPLATE(letterId, letterCode))
      .pipe(
        map((response) => {
          if (response.data && !Array.isArray(response.data)) {
            return response.data;
          }
          if (response.data && Array.isArray(response.data) && response.data.length > 0) {
            return response.data[0];
          }
          return null;
        }),
        catchError((error) => {
          // Handle 404 - Template not found
          if (error.status === 404) {
            return throwError(() => new Error(`Letter template not found for letter code ${letterCode}`));
          }
          // Handle other errors
          return throwError(() => new Error(error.message || 'Failed to load letter template'));
        })
      );
  }

  // Get existing letter details (if letterSeqNo provided)
  // Endpoint: GET /api/v1/notification-letter/{donorId}/{letterSeqNo}
  getLetterDetails(donorId: string, letterSeqNo: string): Observable<NotificationLetterDto | null> {
    return this.apiService
      .get<ApiResponse<NotificationLetterDto>>(API.NOTIFICATION_LETTER.GET_LETTER(donorId, letterSeqNo))
      .pipe(
        map((response) => {
          if (response.data && !Array.isArray(response.data)) {
            return response.data;
          }
          if (response.data && Array.isArray(response.data) && response.data.length > 0) {
            return response.data[0];
          }
          return null;
        }),
        catchError((error) => {
          // Handle 404 - Letter not found
          if (error.status === 404) {
            return throwError(() => new Error(`Letter ${letterSeqNo} not found for donor ${donorId}`));
          }
          // Handle other errors
          return throwError(() => new Error(error.message || 'Failed to load letter details'));
        })
      );
  }

  // Get existing letter for donor from DONOR_LETTERS and DONOR_LETTER_TEXT tables
  // This checks if the donor already has a notification letter (with LTL or LSQ sequence)
  // Endpoint: GET /api/v1/notification-letter/{donorId}/existing-letter
  getExistingLetterForDonor(donorId: string): Observable<NotificationLetterDto | null> {
    return this.apiService
      .get<ApiResponse<NotificationLetterDto>>(API.NOTIFICATION_LETTER.GET_EXISTING_LETTER(donorId))
      .pipe(
        map((response) => {
          if (response.data && !Array.isArray(response.data)) {
            return response.data;
          }
          if (response.data && Array.isArray(response.data) && response.data.length > 0) {
            return response.data[0];
          }
          return null;
        }),
        catchError((error) => {
          // Handle 404 - No existing letter found (this is normal, not an error)
          if (error.status === 404) {
            return throwError(() => null);
          }
          // Handle other errors
          return throwError(() => new Error(error.message || 'Failed to check for existing letter'));
        })
      );
  }

  // Save/Create new notification letter
  saveLetter(donorId: string, request: SaveLetterRequestDto): Observable<SaveLetterResponseDto> {
    return this.apiService
      .post<ApiResponse<SaveLetterResponseDto>>(API.NOTIFICATION_LETTER.SAVE, request)
      .pipe(
        map((response) => {
          if (!response.success || !response.data) {
            throw new Error(response.message || 'Failed to save notification letter');
          }
          if (Array.isArray(response.data)) {
            if (response.data.length === 0) {
              throw new Error('No data returned from save');
            }
            return response.data[0];
          }
          return response.data;
        }),
        catchError((error) => throwError(() => error))
      );
  }

  authorizeLetter(request: AuthorizeLetterRequestDto): Observable<AuthorizeLetterResponseDto> {
    return this.apiService
      .post<ApiResponse<AuthorizeLetterResponseDto>>(API.NOTIFICATION_LETTER.AUTHORIZE, request)
      .pipe(
        map((response) => {
          if (!response.success || !response.data) {
            throw new Error(response.message || 'Failed to authorize notification letter');
          }
          if (Array.isArray(response.data)) {
            if (response.data.length === 0) {
              throw new Error('No data returned from authorization');
            }
            return response.data[0];
          }
          return response.data;
        }),
        catchError((error) => throwError(() => error))
      );
  }

  rejectLetter(request: RejectLetterRequestDto): Observable<RejectLetterResponseDto> {
    return this.apiService
      .post<ApiResponse<RejectLetterResponseDto>>(API.NOTIFICATION_LETTER.REJECT, request)
      .pipe(
        map((response) => {
          if (!response.success || !response.data) {
            throw new Error(response.message || 'Failed to reject notification letter');
          }
          if (Array.isArray(response.data)) {
            if (response.data.length === 0) {
              throw new Error('No data returned from rejection');
            }
            return response.data[0];
          }
          return response.data;
        }),
        catchError((error) => throwError(() => error))
      );
  }

  updateLetterText(
    donorId: string,
    letterSeqNo: string,
    request: UpdateLetterTextRequestDto
  ): Observable<UpdateLetterTextResponseDto> {
    return this.apiService
      .put<ApiResponse<UpdateLetterTextResponseDto>>(
        API.NOTIFICATION_LETTER.UPDATE_TEXT(donorId, letterSeqNo),
        request
      )
      .pipe(
        map((response) => {
          if (!response.success || !response.data) {
            throw new Error(response.message || 'Failed to update letter text');
          }
          if (Array.isArray(response.data)) {
            if (response.data.length === 0) {
              throw new Error('No data returned from update');
            }
            return response.data[0];
          }
          return response.data;
        }),
        catchError((error) => throwError(() => error))
      );
  }
}
