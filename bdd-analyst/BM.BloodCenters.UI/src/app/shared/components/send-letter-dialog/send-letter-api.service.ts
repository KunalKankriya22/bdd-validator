import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from '../../../core/constants/api.constants';
import {
  CommunicationCode,
  LetterListItem,
  LetterDetail,
  GenerateLetterRequest,
  GenerateLetterResponse,
  SaveLetterRequest,
  SaveLetterResponse,
} from './send-letter-dialog.model';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data: T[] | null;
  error: string | null;
  total: number;
}

@Injectable({ providedIn: 'root' })
export class SendLetterApiService {
  private apiService = inject(ApiService);

  getCommunicationTypes(): Observable<CommunicationCode[]> {
    return this.apiService
      .get<ApiResponse<CommunicationCode>>(API.COMMON_LETTER.COMMUNICATION_TYPES)
      .pipe(
        map((response) => response.data ?? []),
        catchError((error) => throwError(() => error))
      );
  }

  getCommunicationCodes(commType: string): Observable<CommunicationCode[]> {
    return this.apiService
      .get<ApiResponse<CommunicationCode>>(API.COMMON_LETTER.COMMUNICATION_CODES(commType))
      .pipe(
        map((response) => response.data ?? []),
        catchError((error) => throwError(() => error))
      );
  }

  getLettersList(): Observable<LetterListItem[]> {
    return this.apiService
      .get<ApiResponse<LetterListItem>>(API.COMMON_LETTER.LETTERS_LIST)
      .pipe(
        map((response) => response.data ?? []),
        catchError((error) => throwError(() => error))
      );
  }

  getLetterDetail(letterCode: string): Observable<LetterDetail | null> {
    return this.apiService
      .get<ApiResponse<LetterDetail>>(API.COMMON_LETTER.LETTER_DETAIL(letterCode))
      .pipe(
        map((response) => (response.data && response.data.length > 0 ? response.data[0] : null)),
        catchError((error) => throwError(() => error))
      );
  }

  generateLetter(request: GenerateLetterRequest): Observable<GenerateLetterResponse> {
    return this.apiService
      .post<ApiResponse<GenerateLetterResponse>>(API.COMMON_LETTER.GENERATE, request)
      .pipe(
        map((response) => {
          if (!response.success || !response.data || response.data.length === 0) {
            throw new Error(response.message || 'Failed to generate letter');
          }
          return response.data[0];
        }),
        catchError((error) => throwError(() => error))
      );
  }

  saveLetter(request: SaveLetterRequest): Observable<SaveLetterResponse> {
    return this.apiService
      .post<ApiResponse<SaveLetterResponse>>(API.COMMON_LETTER.SAVE, request)
      .pipe(
        map((response) => {
          if (!response.success || !response.data || response.data.length === 0) {
            throw new Error(response.message || 'Failed to save letter');
          }
          return response.data[0];
        }),
        catchError((error) => throwError(() => error))
      );
  }
}
