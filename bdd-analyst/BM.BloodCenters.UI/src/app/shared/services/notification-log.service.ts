import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from '../../core/constants/api.constants';
import {
  DonorCommunication,
  DonorInfo,
  LookupItem,
  LetterDetails,
  AddDropdownValues,
  NotificationLogApiResponse,
  CreateCommunicationRequest,
} from '../models/notification-log.interface';

@Injectable({
  providedIn: 'root'
})
export class NotificationLogService {
  private readonly apiService = inject(ApiService);

  /**
   * Get donor info by donorId
   */
  getDonorInfo(donorId: string): Observable<DonorInfo | null> {
    return this.apiService.get<NotificationLogApiResponse<DonorInfo>>(
      API.DONOR_FUNCTIONS.NOTIFICATION_LOG.GET_DONOR_INFO(donorId)
    ).pipe(
      map(response => response?.data?.[0] ?? null),
      catchError(error => {
        console.error('Failed to load donor info:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get communication types for a donor
   */
  getCommunicationTypes(donorId: string): Observable<LookupItem[]> {
    return this.apiService.get<NotificationLogApiResponse<LookupItem>>(
      API.DONOR_FUNCTIONS.NOTIFICATION_LOG.GET_COMMUNICATION_TYPES(donorId)
    ).pipe(
      map(response => response?.data ?? []),
      catchError(error => {
        console.error('Failed to load communication types:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get communication codes for selected type
   */
  getCommunicationCodes(donorId: string, comType: string): Observable<LookupItem[]> {
    return this.apiService.get<NotificationLogApiResponse<LookupItem>>(
      API.DONOR_FUNCTIONS.NOTIFICATION_LOG.GET_COMMUNICATION_CODES(donorId, comType)
    ).pipe(
      map(response => response?.data ?? []),
      catchError(error => {
        console.error('Failed to load communication codes:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get notification logs by donorId, comType, and comCode
   * If comType and comCode are not provided, returns all notification logs
   */
  getNotificationLogs(donorId: string, comType?: string, comCode?: string): Observable<DonorCommunication[]> {
    return this.apiService.get<NotificationLogApiResponse<DonorCommunication>>(
      API.DONOR_FUNCTIONS.NOTIFICATION_LOG.GET_NOTIFICATION_LOGS(donorId, comType, comCode)
    ).pipe(
      map(response => response?.data ?? []),
      catchError(error => {
        console.error('Failed to load notification logs:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get letter details by donorId and letterSeqNo
   */
  getLetterDetails(donorId: string, letterSeqNo: string): Observable<LetterDetails | null> {
    return this.apiService.get<NotificationLogApiResponse<LetterDetails>>(
      API.DONOR_FUNCTIONS.NOTIFICATION_LOG.GET_LETTER_DETAILS(donorId, letterSeqNo)
    ).pipe(
      map(response => response?.data?.[0] ?? null),
      catchError(error => {
        console.error('Failed to load letter details:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Reprint a notification letter
   *
   * Backend behavior:
   * 1. Updates DONOR_LETTERS table (LAST_REPRINTED_BY = current user, LAST_REPRINTED_ON = SYSDATE)
   * 2. Re-fetches the full letter details with timezone-converted dates
   * 3. Returns updated NotificationLogsLetterModel
   *
   * @param donorId - Donor ID (route param)
   * @param letterSeqNo - Letter sequence number (route param)
   * @returns Observable<LetterDetails | null> with updated reprint metadata
   *
   * API Endpoint: POST /api/v1/donors/notification-logs/{donorId}/letter/{letterSeqNo}/reprint
   * Request: Empty POST (no body) - ChapterId and UserId from auth headers
   * Response: ReturnResult<NotificationLogsLetterModel> with updated reprintBy, reprintName, reprintOn
   *
   * Error Cases:
   * - 404: Letter not found - "No letter found to reprint."
   * - 500: Internal server error
   */
  reprintLetter(donorId: string, letterSeqNo: string): Observable<LetterDetails | null> {
    return this.apiService.post<NotificationLogApiResponse<LetterDetails>>(
      API.DONOR_FUNCTIONS.NOTIFICATION_LOG.REPRINT_LETTER(donorId, letterSeqNo),
      {} // Empty body - backend derives ChapterId and UserId from MultiAuth headers
    ).pipe(
      map(response => response?.data?.[0] ?? null),
      catchError(error => {
        console.error('Failed to reprint letter:', error);
        return throwError(() => error);
      })
    );
  }

  // ============================================
  // STUB METHODS - API endpoints not yet provided
  // These are needed for communication-dialog but don't have real API endpoints yet
  // ============================================

  /**
   * Get all dropdown values for add mode (communication types, staff list, action codes)
   */
  getAddDropdownValues(): Observable<AddDropdownValues> {
    return this.apiService.get<AddDropdownValues>(
      API.DONOR_FUNCTIONS.NOTIFICATION_LOG.GET_ADD_DROPDOWN_VALUES
    ).pipe(
      catchError(error => {
        console.error('Failed to load add dropdown values:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get communication codes for add mode by communication type
   */
  getAddCommunicationCodes(comType: string): Observable<LookupItem[]> {
    return this.apiService.get<NotificationLogApiResponse<LookupItem>>(
      API.DONOR_FUNCTIONS.NOTIFICATION_LOG.GET_ADD_COMMUNICATION_CODES(comType)
    ).pipe(
      map(response => response?.data ?? []),
      catchError(error => {
        console.error('Failed to load add communication codes:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Create new communication
   */
  createCommunication(donorId: string, request: CreateCommunicationRequest): Observable<DonorCommunication | null> {
    return this.apiService.post<NotificationLogApiResponse<DonorCommunication>>(
      API.DONOR_FUNCTIONS.NOTIFICATION_LOG.CREATE_COMMUNICATION(donorId),
      request
    ).pipe(
      map(response => response?.data?.[0] ?? null),
      catchError(error => {
        console.error('Failed to create communication:', error);
        return throwError(() => error);
      })
    );
  }


}
