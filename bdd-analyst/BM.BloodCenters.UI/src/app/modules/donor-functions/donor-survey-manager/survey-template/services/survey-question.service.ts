import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  SurveyQuestionModel,
  TemplateQuestionModel,
  AssignQuestionsDto,
  UpdateQuestionSequenceDto,
  QuestionAnswerModel
} from '../models/survey-question.model';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import { HeaderService } from '@shared/services/header.service';

interface ReturnResult<T> {
  success?: boolean;
  message?: string;
  error?: string;
  statusCode?: number;
  data?: T[];
  total?: number;
}

interface ApiQuestionResponse {
  chapterId: string;
  questionCode: string;
  questionDesc: string;
  gender: string;
  responseType: string;
  effDate: string;
  termDate?: string;
  isEditable: number;
}

/**
 * SurveyQuestionService
 * Handles all API operations for Survey Questions (Q&A Library)
 */
@Injectable({
  providedIn: 'root'
})
export class SurveyQuestionService {
  private readonly apiService = inject(ApiService);
  private readonly headerService = inject(HeaderService);

  /**
   * Get all survey questions from Q&A Library
   * GET /api/v1/donor-survey-manager/valid-questions
   */
  getAllQuestions(): Observable<SurveyQuestionModel[]> {
    const endpoint = API.DONOR_FUNCTIONS.SURVEY_QUESTIONS.GET_ALL;

    return this.apiService.get<ReturnResult<ApiQuestionResponse>>(endpoint).pipe(
      map(response => {
        const apiData = response.data || [];
        return apiData.map(item => ({
          questionId: item.questionCode,
          description: item.questionDesc,
          sex: this.mapGenderToSex(item.gender),
          parentQuestionId: null,
          parentQuestionAnswer: null,
          flag: null,
          chapterId: item.chapterId,
          responseType: item.responseType,
          isActive: true,
          lastModified: item.effDate,
          termDate: item.termDate
        }));
      }),
      catchError(error => throwError(() => error))
    );
  }

  private mapGenderToSex(gender: string): 'Male' | 'Female' | 'All' | null {
    switch (gender?.toUpperCase()) {
      case 'M':
        return 'Male';
      case 'F':
        return 'Female';
      case 'A':
        return 'All';
      default:
        return 'All';
    }
  }

  /**
   * Get a specific question by ID
   * GET /api/v1/donor-survey-manager/questions/{questionId}
   */
  getQuestionById(questionId: string): Observable<SurveyQuestionModel | null> {
    const endpoint = API.DONOR_FUNCTIONS.SURVEY_QUESTIONS.GET_BY_ID(questionId);

    return this.apiService.get<ReturnResult<SurveyQuestionModel>>(endpoint).pipe(
      map(response => response.data && response.data.length > 0 ? response.data[0] : null),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Get questions assigned to a specific template
   * GET /api/v1/donor-survey-manager/templates/{templateId}/{chapterId}/questions
   */
  getAssignedQuestions(templateId: string): Observable<TemplateQuestionModel[]> {
    const chapterId = this.headerService.chapterId();
    const endpoint = API.DONOR_FUNCTIONS.TEMPLATE_QUESTIONS.GET_ASSIGNED(templateId, chapterId);

    return this.apiService.get<ReturnResult<TemplateQuestionModel>>(endpoint).pipe(
      map(response => response.data || []),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Assign questions to a template
   * POST /api/v1/donor-survey-manager/templates/{templateId}/{chapterId}/questions
   */
  assignQuestions(data: AssignQuestionsDto): Observable<{ success: boolean; message: string }> {
    const endpoint = API.DONOR_FUNCTIONS.TEMPLATE_QUESTIONS.ASSIGN_QUESTIONS(
      data.templateId,
      data.chapterId
    );

    return this.apiService.post<ReturnResult<any>>(endpoint, data).pipe(
      map(response => ({
        success: response.success || false,
        message: response.message || 'Questions assigned successfully'
      })),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Update question sequence for a template
   * PUT /api/v1/donor-survey-manager/templates/{templateId}/{chapterId}/questions/sequence
   */
  updateQuestionSequence(data: UpdateQuestionSequenceDto): Observable<{ success: boolean; message: string }> {
    const endpoint = API.DONOR_FUNCTIONS.TEMPLATE_QUESTIONS.UPDATE_SEQUENCE(
      data.templateId,
      data.chapterId
    );

    return this.apiService.put<ReturnResult<any>>(endpoint, data).pipe(
      map(response => ({
        success: response.success || false,
        message: response.message || 'Sequence updated successfully'
      })),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Create a new survey question
   * POST /api/v1/donor-survey-manager/questions
   */
  createQuestion(data: any): Observable<{ success: boolean; message: string }> {
    const endpoint = API.DONOR_FUNCTIONS.SURVEY_QUESTIONS.CREATE;

    return this.apiService.post<ReturnResult<any>>(endpoint, data).pipe(
      map(response => ({
        success: response.success || false,
        message: response.message || 'Question created successfully'
      })),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Update an existing survey question
   * PUT /api/v1/donor-survey-manager/questions
   */
  updateQuestion(data: any): Observable<{ success: boolean; message: string }> {
    const endpoint = API.DONOR_FUNCTIONS.SURVEY_QUESTIONS.UPDATE;

    return this.apiService.put<ReturnResult<any>>(endpoint, data).pipe(
      map(response => ({
        success: response.success || false,
        message: response.message || 'Question updated successfully'
      })),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Get answers for a specific question
   * GET /api/v1/donor-survey-manager/questions/{questionCode}/valid-answers
   */
  getQuestionAnswers(questionCode: string): Observable<QuestionAnswerModel[]> {
    const endpoint = API.DONOR_FUNCTIONS.SURVEY_QUESTIONS.GET_ANSWERS(questionCode);

    return this.apiService.get<ReturnResult<QuestionAnswerModel>>(endpoint).pipe(
      map(response => response.data || []),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Delete a survey question
   * DELETE /api/v1/donor-survey-manager/questions/{questionId}/{chapterId}
   */
  deleteQuestion(questionId: string): Observable<{ success: boolean; message: string }> {
    const chapterId = this.headerService.chapterId();
    const endpoint = API.DONOR_FUNCTIONS.SURVEY_QUESTIONS.DELETE(questionId, chapterId);

    return this.apiService.delete<ReturnResult<any>>(endpoint).pipe(
      map(response => ({
        success: response.success || false,
        message: response.message || 'Question deleted successfully'
      })),
      catchError(error => throwError(() => error))
    );
  }
}
