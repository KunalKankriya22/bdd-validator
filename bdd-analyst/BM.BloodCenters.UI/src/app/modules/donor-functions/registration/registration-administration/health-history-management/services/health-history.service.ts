import { Injectable, inject } from '@angular/core';
import { HttpContext } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import { SKIP_ERROR_TOAST } from 'src/app/core/constants/http-context.constants';
import {
  HHQuestionModel,
  HHQuestionSearchParams,
  GenderDropdownOption,
  InterdictionCodeOption,
  ReturnResult,
  HHResponseModel,
  HHResponseSearchParams,
  HHResponseCommentModel,
  PeriodTypeOption,
  HHTemplateModel,
  HHTemplateDetailModel,
  HHTemplateQuestionDto,
  HHTemplateSearchParams,
  DropdownOption,
  QuestionDropdownOption,
  PaginatedResponse,
  TemplateListItem
} from '../models/health-history.model';

@Injectable({
  providedIn: 'root'
})
export class HealthHistoryService {
  private readonly apiService = inject(ApiService);

  // ==================== HH QUESTIONS API ====================

  searchQuestions(
    params: HHQuestionSearchParams
  ): Observable<{ data: HHQuestionModel[]; totalRecords: number; message?: string }> {
    const endpoint = API.HEALTH_HISTORY_QUESTIONS.SEARCH;
    return this.apiService.post<ReturnResult<HHQuestionModel>>(endpoint, params).pipe(
      map(response => ({
        data: response.data || [],
        totalRecords: response.total || 0,
        message: response.message
      })),
      catchError(error => {
        const errorBody = error?.error;
        if (errorBody?.statusCode === 404 || error?.status === 404) {
          return of({
            data: [] as HHQuestionModel[],
            totalRecords: 0,
            message: errorBody?.message || 'No health history questions found.'
          });
        }
        console.error('Error searching health history questions:', error);
        return throwError(() => error);
      })
    );
  }

  getQuestionByCode(questionCode: string): Observable<HHQuestionModel> {
    const endpoint = API.HEALTH_HISTORY_QUESTIONS.GET_BY_CODE(questionCode);
    return this.apiService.get<ReturnResult<HHQuestionModel>>(endpoint).pipe(
      map(response => response.item || (response.data && response.data[0])!),
      catchError(error => {
        console.error('Error fetching question by code:', error);
        return throwError(() => error);
      })
    );
  }

  createQuestion(question: HHQuestionModel): Observable<ReturnResult<HHQuestionModel>> {
    const endpoint = API.HEALTH_HISTORY_QUESTIONS.CREATE;
    return this.apiService.post<ReturnResult<HHQuestionModel>>(endpoint, question, {
      context: new HttpContext().set(SKIP_ERROR_TOAST, [409])
    }).pipe(
      catchError(error => {
        if (error?.status === 409 || error?.error?.statusCode === 409) {
          console.error('Duplicate entry detected:', error);
          return throwError(() => ({
            ...error,
            isDuplicate: true,
            message: error?.error?.message || 'Duplicate entry: This question code already exists.'
          }));
        }
        console.error('Error creating question:', error);
        return throwError(() => error);
      })
    );
  }

  updateQuestion(questionCode: string, question: HHQuestionModel): Observable<ReturnResult<HHQuestionModel>> {
    const endpoint = API.HEALTH_HISTORY_QUESTIONS.UPDATE(questionCode);
    return this.apiService.put<ReturnResult<HHQuestionModel>>(endpoint, question, {
      context: new HttpContext().set(SKIP_ERROR_TOAST, [409])
    }).pipe(
      catchError(error => {
        if (error?.status === 409 || error?.error?.statusCode === 409) {
          console.error('Duplicate entry detected:', error);
          return throwError(() => ({
            ...error,
            isDuplicate: true,
            message: error?.error?.message || 'Duplicate entry: This question already exists.'
          }));
        }
        console.error('Error updating question:', error);
        return throwError(() => error);
      })
    );
  }

  getGenderDropdown(): Observable<GenderDropdownOption[]> {
    const endpoint = API.HEALTH_HISTORY_QUESTIONS.GENDER_DROPDOWN;
    return this.apiService.get<ReturnResult<GenderDropdownOption>>(endpoint).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error('Error fetching gender dropdown:', error);
        return throwError(() => error);
      })
    );
  }

  getInterdictionCodes(): Observable<InterdictionCodeOption[]> {
    const endpoint = API.HEALTH_HISTORY_QUESTIONS.INTERDICTION_CODES;
    return this.apiService.get<ReturnResult<InterdictionCodeOption>>(endpoint).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error('Error fetching interdiction codes:', error);
        return throwError(() => error);
      })
    );
  }

  // ==================== HH RESPONSES (ANSWERS) API ====================

  searchAnswers(
    take: number,
    skip: number,
    params: HHResponseSearchParams
  ): Observable<ReturnResult<HHResponseModel>> {
    const endpoint = API.HEALTH_HISTORY_ANSWERS.SEARCH(take, skip);
    return this.apiService.post<ReturnResult<HHResponseModel>>(endpoint, params).pipe(
      catchError(error => {
        console.error('Error searching health history answers:', error);
        return throwError(() => error);
      })
    );
  }

  getAnswerByCode(questionCode: string, answerCode: string): Observable<HHResponseModel> {
    const endpoint = API.HEALTH_HISTORY_ANSWERS.GET_BY_CODE(questionCode, answerCode);
    return this.apiService.get<ReturnResult<HHResponseModel>>(endpoint).pipe(
      map(response => response.item || (response.data && response.data[0])!),
      catchError(error => {
        console.error('Error fetching answer by code:', error);
        return throwError(() => error);
      })
    );
  }

  createAnswer(answer: HHResponseModel): Observable<ReturnResult<HHResponseModel>> {
    const endpoint = API.HEALTH_HISTORY_ANSWERS.CREATE;
    return this.apiService.post<ReturnResult<HHResponseModel>>(endpoint, answer).pipe(
      catchError(error => {
        console.error('Error creating answer:', error);
        return throwError(() => error);
      })
    );
  }

  updateAnswer(questionCode: string, answerCode: string, answer: HHResponseModel): Observable<ReturnResult<HHResponseModel>> {
    const endpoint = API.HEALTH_HISTORY_ANSWERS.UPDATE(questionCode, answerCode);
    return this.apiService.put<ReturnResult<HHResponseModel>>(endpoint, answer).pipe(
      catchError(error => {
        console.error('Error updating answer:', error);
        return throwError(() => error);
      })
    );
  }

  getGroupCodes(questionCode?: string, responseCode?: string): Observable<DropdownOption[]> {
    let endpoint = API.HEALTH_HISTORY_ANSWERS.GROUP_CODES;
    const params: string[] = [];
    if (questionCode) params.push(`questionCode=${encodeURIComponent(questionCode)}`);
    if (responseCode) params.push(`responseCode=${encodeURIComponent(responseCode)}`);
    if (params.length > 0) endpoint += `?${params.join('&')}`;

    return this.apiService.get<ReturnResult<DropdownOption>>(endpoint).pipe(
      map(response => response?.data || []),
      catchError(error => {
        console.error('Error fetching group codes:', error);
        return throwError(() => error);
      })
    );
  }

  getPeriodTypes(): Observable<PeriodTypeOption[]> {
    const endpoint = API.HEALTH_HISTORY_ANSWERS.PERIOD_TYPES;
    return this.apiService.get<ReturnResult<PeriodTypeOption>>(endpoint).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error('Error fetching period types:', error);
        return throwError(() => error);
      })
    );
  }

  // ==================== HH RESPONSE COMMENTS ====================

  getResponseComments(questionCode: string, answerCode: string, responseCode: string): Observable<HHResponseCommentModel[]> {
    const endpoint = API.HEALTH_HISTORY_ANSWERS.COMMENTS(questionCode, answerCode, responseCode);
    return this.apiService.get<ReturnResult<HHResponseCommentModel>>(endpoint).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error('Error fetching response comments:', error);
        return throwError(() => error);
      })
    );
  }

  createResponseComment(questionCode: string, answerCode: string, responseCode: string, comment: HHResponseCommentModel): Observable<ReturnResult<HHResponseCommentModel>> {
    const endpoint = API.HEALTH_HISTORY_ANSWERS.COMMENTS(questionCode, answerCode, responseCode);
    return this.apiService.post<ReturnResult<HHResponseCommentModel>>(endpoint, comment).pipe(
      catchError(error => {
        console.error('Error creating response comment:', error);
        return throwError(() => error);
      })
    );
  }

  updateResponseComment(questionCode: string, answerCode: string, responseCode: string, commentCode: string, comment: HHResponseCommentModel): Observable<ReturnResult<HHResponseCommentModel>> {
    const endpoint = API.HEALTH_HISTORY_ANSWERS.COMMENT_BY_CODE(questionCode, answerCode, responseCode, commentCode);
    return this.apiService.put<ReturnResult<HHResponseCommentModel>>(endpoint, comment).pipe(
      catchError(error => {
        console.error('Error updating response comment:', error);
        return throwError(() => error);
      })
    );
  }

  // ==================== HH TEMPLATES API ====================

  searchTemplates(
    take: number,
    skip: number,
    params?: HHTemplateSearchParams
  ): Observable<PaginatedResponse<HHTemplateQuestionDto>> {
    const endpoint = API.HEALTH_HISTORY_TEMPLATES.SEARCH(take, skip);
    return this.apiService.post<ReturnResult<HHTemplateQuestionDto>>(endpoint, params || {}).pipe(
      map(response => ({
        data: response.data || [],
        totalRecords: response.total || 0
      })),
      catchError(error => {
        console.error('Error searching health history templates:', error);
        return throwError(() => error);
      })
    );
  }

  getTemplateQuestions(templateId: string, includeTerminated = false): Observable<HHTemplateQuestionDto[]> {
    let endpoint = API.HEALTH_HISTORY_TEMPLATES.GET_BY_TEMPLATE(templateId);
    if (includeTerminated) {
      endpoint += '?includeTerminated=true';
    }
    return this.apiService.get<ReturnResult<HHTemplateQuestionDto>>(endpoint).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error('Error fetching template questions:', error);
        return throwError(() => error);
      })
    );
  }

  getTemplateQuestionByKey(donationType: string, questionCode: string, templateId: string): Observable<HHTemplateQuestionDto> {
    const endpoint = API.HEALTH_HISTORY_TEMPLATES.GET_BY_KEY(donationType, questionCode, templateId);
    return this.apiService.get<ReturnResult<HHTemplateQuestionDto>>(endpoint).pipe(
      map(response => response.item || (response.data && response.data[0])!),
      catchError(error => {
        console.error('Error fetching template question:', error);
        return throwError(() => error);
      })
    );
  }

  createTemplateQuestion(question: HHTemplateQuestionDto): Observable<ReturnResult<HHTemplateQuestionDto>> {
    const endpoint = API.HEALTH_HISTORY_TEMPLATES.CREATE;
    return this.apiService.post<ReturnResult<HHTemplateQuestionDto>>(endpoint, question, {
      context: new HttpContext().set(SKIP_ERROR_TOAST, [409])
    }).pipe(
      catchError(error => throwError(() => error))
    );
  }

  updateTemplateQuestion(donationType: string, questionCode: string, templateId: string, question: HHTemplateQuestionDto): Observable<ReturnResult<HHTemplateQuestionDto>> {
    const endpoint = API.HEALTH_HISTORY_TEMPLATES.UPDATE(donationType, questionCode, templateId);
    return this.apiService.put<ReturnResult<HHTemplateQuestionDto>>(endpoint, question).pipe(
      catchError(error => {
        console.error('Error updating template question:', error);
        return throwError(() => error);
      })
    );
  }

  deleteTemplateQuestion(donationType: string, questionCode: string, templateId: string): Observable<ReturnResult<void>> {
    const endpoint = API.HEALTH_HISTORY_TEMPLATES.DELETE(donationType, questionCode, templateId);
    return this.apiService.delete<ReturnResult<void>>(endpoint).pipe(
      catchError(error => {
        console.error('Error deleting template question:', error);
        return throwError(() => error);
      })
    );
  }

  getAvailableQuestionsForTemplate(): Observable<QuestionDropdownOption[]> {
    const endpoint = API.HEALTH_HISTORY_TEMPLATES.AVAILABLE_QUESTIONS;
    return this.apiService.get<ReturnResult<QuestionDropdownOption>>(endpoint).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error('Error fetching available questions for template:', error);
        return throwError(() => error);
      })
    );
  }

  getDonationTypes(): Observable<DropdownOption[]> {
    const endpoint = API.HEALTH_HISTORY_TEMPLATES.DONATION_TYPES;
    return this.apiService.get<ReturnResult<DropdownOption>>(endpoint).pipe(
      map(response => response.data || []),
      catchError(error => throwError(() => error))
    );
  }

  generateTemplateId(): Observable<string> {
    return this.apiService.get<ReturnResult<string>>(API.HEALTH_HISTORY_TEMPLATES.GENERATE_ID).pipe(
      map(response => {
        const data = response.data;
        if (typeof data === 'string') return data;
        if (Array.isArray(data) && data.length > 0) return String(data[0]);
        return '';
      }),
      catchError(error => throwError(() => error))
    );
  }

  updateTemplateTermDate(templateId: string, donationType: string, termDate: string): Observable<ReturnResult<void>> {
    const endpoint = API.HEALTH_HISTORY_TEMPLATES.UPDATE_TERM_DATE(templateId);
    return this.apiService.put<ReturnResult<void>>(endpoint, { donationType, termDate }).pipe(
      catchError(error => {
        console.error('Error updating template termination date:', error);
        return throwError(() => error);
      })
    );
  }

  getTemplatesByDonationType(donationType: string): Observable<TemplateListItem[]> {
    return this.apiService.get<ReturnResult<TemplateListItem>>(
      API.HEALTH_HISTORY_TEMPLATES.TEMPLATES_BY_DONATION_TYPE(donationType)
    ).pipe(
      map(response => response.data || []),
      catchError(error => throwError(() => error))
    );
  }
}
