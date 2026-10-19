import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';
import {
  CommLetterView,
  CommLetterCodeOption,
  CommLetterFilterCriteria,
  CreateCommLetterDto,
  ReviseCommLetterDto,
  ApiResponse,
  PreviewLetterResponse,
} from '../models/communication-letter.model';

@Injectable({ providedIn: 'root' })
export class CommunicationLettersService {
  constructor(private apiService: ApiService) {}

  getLetterCodes(): Observable<CommLetterCodeOption[]> {
    return this.apiService
      .get<ApiResponse<CommLetterCodeOption[]>>(`${API.COMMUNICATION_LETTERS.LOOKUP}?documentType=N`)
      .pipe(map((r) => r.data || []));
  }

  getLetters(criteria: CommLetterFilterCriteria): Observable<CommLetterView[]> {
    const url = API.COMMUNICATION_LETTERS.LIST(1000, 0);
    const body = {
      letterCode: criteria.letterCode || null,
      showTerminated: criteria.showTerminated === 'Yes',
    };
    return this.apiService
      .post<ApiResponse<CommLetterView[]>>(url, body)
      .pipe(map((r) => r.data || []));
  }

  getLetterContent(letterId: string): Observable<CommLetterView> {
    const url = API.COMMUNICATION_LETTERS.CONTENT(letterId);
    return this.apiService
      .get<ApiResponse<CommLetterView>>(url)
      .pipe(map((r) => r.data));
  }

  createLetter(dto: CreateCommLetterDto): Observable<CommLetterView> {
    return this.apiService
      .post<ApiResponse<CommLetterView>>(API.COMMUNICATION_LETTERS.CREATE, dto)
      .pipe(map((r) => r.data));
  }

  reviseLetter(letterId: string, dto: ReviseCommLetterDto): Observable<CommLetterView> {
    const url = API.COMMUNICATION_LETTERS.REVISE(letterId);
    return this.apiService
      .post<ApiResponse<CommLetterView>>(url, dto)
      .pipe(map((r) => r.data));
  }

  previewLetter(letterId: string): Observable<PreviewLetterResponse> {
    const url = API.COMMUNICATION_LETTERS.PREVIEW(letterId);
    return this.apiService
      .get<ApiResponse<PreviewLetterResponse>>(url)
      .pipe(map((r) => r.data));
  }

  getLetterHistory(letterCode: string): Observable<CommLetterView[]> {
    const url = API.COMMUNICATION_LETTERS.HISTORY(letterCode);
    return this.apiService
      .get<ApiResponse<CommLetterView[]>>(url)
      .pipe(map((r) => r.data || []));
  }

}
