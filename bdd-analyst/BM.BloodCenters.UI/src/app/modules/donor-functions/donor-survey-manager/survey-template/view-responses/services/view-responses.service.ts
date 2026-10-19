import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { HttpParams } from '@angular/common/http';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import { ResponseSummary, ResponseDonor, ResponseComment } from '../models/view-responses.model';

interface ReturnResult<T> {
  success?: boolean;
  message?: string;
  error?: string;
  statusCode?: number;
  data?: T[];
  total?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ViewResponsesService {
  private readonly apiService = inject(ApiService);

  getResponseSummary(chapterId: string, templateId: string): Observable<{ data: ResponseSummary[] }> {
    const endpoint = API.DONOR_FUNCTIONS.DONOR_SURVEY_MANAGER.RESPONSES(chapterId, templateId);
    return this.apiService.get<ReturnResult<ResponseSummary>>(endpoint).pipe(
      map(response => ({
        data: response.data || []
      })),
      catchError(error => throwError(() => error))
    );
  }

  getResponseDonors(
    chapterId: string,
    templateId: string,
    questionCode: string,
    answerCode: string
  ): Observable<{ data: ResponseDonor[] }> {
    const endpoint = API.DONOR_FUNCTIONS.DONOR_SURVEY_MANAGER.RESPONSE_DONORS(chapterId, templateId);
    const params = new HttpParams()
      .set('questionCode', questionCode)
      .set('answerCode', answerCode);

    return this.apiService.get<ReturnResult<ResponseDonor>>(endpoint, { params }).pipe(
      map(response => ({
        data: response.data || []
      })),
      catchError(error => throwError(() => error))
    );
  }

  getResponseComments(
    chapterId: string,
    templateId: string,
    questionCode: string
  ): Observable<{ data: ResponseComment[] }> {
    const endpoint = API.DONOR_FUNCTIONS.DONOR_SURVEY_MANAGER.RESPONSE_COMMENTS(chapterId, templateId);
    const params = new HttpParams().set('questionCode', questionCode);

    return this.apiService.get<ReturnResult<ResponseComment>>(endpoint, { params }).pipe(
      map(response => ({
        data: response.data || []
      })),
      catchError(error => throwError(() => error))
    );
  }
}
