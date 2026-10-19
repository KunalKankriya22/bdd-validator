import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  SearchDonorNotificationRequestDto,
  SearchDonorNotificationResponse,
  DonorNotificationSearchResult,
  AuthorizeDonorDetailsDto,
  MarkNoLetterRequestDto,
  ApproveNoLetterRequestDto,
  DonorCommunicationsResponse,
  DonorCommunicationDto,
  ApiSuccessResponse,
  LovCodeDto
} from '../models/authorize-donor-notification.model';

@Injectable({
  providedIn: 'root'
})
export class AuthorizeDonorNotificationService {
  private readonly apiService = inject(ApiService);

  searchDonors(
    take: number,
    skip: number,
    searchParams: SearchDonorNotificationRequestDto
  ): Observable<{ data: DonorNotificationSearchResult[]; total: number }> {
    const endpoint = API.DONOR_FUNCTIONS.AUTHORIZE_DONOR_NOTIFICATION.SEARCH(take, skip);

    return this.apiService.post<SearchDonorNotificationResponse>(endpoint, searchParams).pipe(
      map(response => ({
        data: response.data || [],
        total: response.total ?? (response as any).Total ?? 0
      })),
      catchError(error => throwError(() => error))
    );
  }

  getDonorDetails(donorId: string): Observable<AuthorizeDonorDetailsDto> {
    const endpoint = API.DONOR_FUNCTIONS.AUTHORIZE_DONOR_NOTIFICATION.GET_DONOR_DETAILS(donorId);

    return this.apiService.get<AuthorizeDonorDetailsDto>(endpoint).pipe(
      catchError(error => throwError(() => error))
    );
  }

  getDonorCommunications(donorId: string): Observable<DonorCommunicationDto[]> {
    const endpoint = API.DONOR_FUNCTIONS.AUTHORIZE_DONOR_NOTIFICATION.GET_COMMUNICATIONS(donorId);

    return this.apiService.get<DonorCommunicationsResponse>(endpoint).pipe(
      map(response => response.data || []),
      catchError(error => throwError(() => error))
    );
  }

  markNoLetter(payload: MarkNoLetterRequestDto): Observable<ApiSuccessResponse> {
    const endpoint = API.DONOR_FUNCTIONS.AUTHORIZE_DONOR_NOTIFICATION.MARK_NO_LETTER;

    return this.apiService.post<ApiSuccessResponse>(endpoint, payload).pipe(
      catchError(error => throwError(() => error))
    );
  }

  approveNoLetter(payload: ApproveNoLetterRequestDto): Observable<ApiSuccessResponse> {
    const endpoint = API.DONOR_FUNCTIONS.AUTHORIZE_DONOR_NOTIFICATION.APPROVE_NO_LETTER;

    return this.apiService.put<ApiSuccessResponse>(endpoint, payload).pipe(
      catchError(error => throwError(() => error))
    );
  }

  getCodeDescription(searchType: string, code: string): Observable<string> {
    const endpoint = API.DONOR_FUNCTIONS.AUTHORIZE_DONOR_NOTIFICATION.GET_CODE_DESCRIPTION(searchType, code);

    return this.apiService.get<{ message: string }>(endpoint).pipe(
      map(response => response.message || ''),
      catchError(error => throwError(() => error))
    );
  }

  rejectNoLetter(
    donorId: string,
    interCode: string,
    unitId?: string | null
  ): Observable<ApiSuccessResponse> {
    let endpoint = API.DONOR_FUNCTIONS.AUTHORIZE_DONOR_NOTIFICATION.REJECT_NO_LETTER(donorId, interCode);

    if (unitId) {
      endpoint = `${endpoint}?unitId=${encodeURIComponent(unitId)}`;
    }

    return this.apiService.delete<ApiSuccessResponse>(endpoint).pipe(
      catchError(error => throwError(() => error))
    );
  }

  getLovLimit(): Observable<number> {
    const endpoint = API.DONOR_FUNCTIONS.AUTHORIZE_DONOR_NOTIFICATION.GET_LOV_LIMIT;

    return this.apiService.get<{ message: string }>(endpoint).pipe(
      map(response => parseInt(response.message, 10) || 21),
      catchError(() => of(21))
    );
  }

  getLovCodes(searchType: string): Observable<LovCodeDto[]> {
    const endpoint = API.DONOR_FUNCTIONS.AUTHORIZE_DONOR_NOTIFICATION.GET_LOV_CODES(searchType);

    return this.apiService.get<{ data: LovCodeDto[] }>(endpoint).pipe(
      map(response => response.data || []),
      catchError(() => of([]))
    );
  }

  checkUnitExists(unitId: string): Observable<boolean> {
    const endpoint = API.DONOR_FUNCTIONS.AUTHORIZE_DONOR_NOTIFICATION.CHECK_UNIT_EXISTS(unitId);

    return this.apiService.get<{ success: boolean }>(endpoint).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }
}
