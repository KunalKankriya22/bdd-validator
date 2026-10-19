import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import moment from 'moment';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  Question,
  Answer,
  SurveyQuestionResponseDto,
  CreateSurveyQuestionDto,
  UpdateSurveyQuestionDto,
  SurveyAnswerResponseDto,
  SaveSurveyAnswerDto,
  GENDER_MAP,
  GENDER_REVERSE_MAP,
  RESPONSE_TYPE_MAP,
  RESPONSE_TYPE_REVERSE_MAP,
  GenderFrontend,
  GenderBackend,
  ResponseTypeFrontend,
  ResponseTypeBackend
} from '../models/qa-library.models';

/**
 * API Service for Q&A Library
 * Integrates with backend /api/v1/donor-survey-manager endpoints
 */
@Injectable({
  providedIn: 'root'
})
export class QaLibraryApiService {
  constructor(private apiService: ApiService) {}

  // ============================================================================
  // QUESTION ENDPOINTS
  // ============================================================================

  /**
   * GET /api/v1/donor-survey-manager/questions
   * Get all questions (client-side filtering)
   */
  getQuestions(): Observable<Question[]> {
    return this.apiService
      .get<any>(API.DONOR_FUNCTIONS.DONOR_SURVEY_MANAGER.QUESTIONS)
      .pipe(
        map(response => {
          // Extract data from response wrapper
          const rawData = response.data || response.Data || response || [];
          const dtos: SurveyQuestionResponseDto[] = Array.isArray(rawData) ? rawData : [];
          return dtos.map(dto => this.mapQuestionFromDto(dto));
        }),
        catchError(error => this.handleError(error))
      );
  }

  /**
   * POST /api/v1/donor-survey-manager/questions
   * Create new question
   */
  createQuestion(question: Question): Observable<void> {
    const dto = this.mapQuestionToCreateDto(question);
    return this.apiService
      .post<void>(API.DONOR_FUNCTIONS.DONOR_SURVEY_MANAGER.QUESTIONS, dto)
      .pipe(catchError(error => this.handleError(error)));
  }

  /**
   * PUT /api/v1/donor-survey-manager/questions/{questionCode}
   * Update existing question
   */
  updateQuestion(questionCode: string, question: Question): Observable<void> {
    const dto = this.mapQuestionToUpdateDto(question);
    console.log('Updating question:', questionCode);
    console.log('Update DTO being sent:', dto);
    console.log('API endpoint:', API.DONOR_FUNCTIONS.DONOR_SURVEY_MANAGER.QUESTION_BY_CODE(questionCode));
    return this.apiService
      .put<void>(API.DONOR_FUNCTIONS.DONOR_SURVEY_MANAGER.QUESTION_BY_CODE(questionCode), dto)
      .pipe(catchError(error => this.handleError(error)));
  }

  // ============================================================================
  // ANSWER ENDPOINTS
  // ============================================================================

  /**
   * GET /api/v1/donor-survey-manager/questions/{questionCode}/answers
   * Get answers for a specific question
   */
  getAnswers(questionCode: string): Observable<Answer[]> {
    return this.apiService
      .get<any>(API.DONOR_FUNCTIONS.DONOR_SURVEY_MANAGER.ANSWERS(questionCode))
      .pipe(
        map(response => {
          console.log('Raw API Response:', response);
          // Extract data from response wrapper
          const rawData = response.data || response.Data || response || [];
          console.log('Extracted rawData:', rawData);
          const dtos: SurveyAnswerResponseDto[] = Array.isArray(rawData) ? rawData : [];
          const mappedAnswers = dtos.map(dto => this.mapAnswerFromDto(dto));
          console.log('Mapped Answers:', mappedAnswers);
          return mappedAnswers;
        }),
        catchError(error => this.handleError(error))
      );
  }

  /**
   * PUT /api/v1/donor-survey-manager/questions/{questionCode}/answers
   * Save answers for a question (batch upsert + auto-delete unreferenced)
   */
  saveAnswers(questionCode: string, answers: Answer[]): Observable<void> {
    const dtos = answers.map(answer => this.mapAnswerToDto(answer));
    return this.apiService
      .put<void>(API.DONOR_FUNCTIONS.DONOR_SURVEY_MANAGER.ANSWERS(questionCode), dtos)
      .pipe(catchError(error => this.handleError(error)));
  }

  // ============================================================================
  // DATA MAPPING HELPERS
  // ============================================================================

  /**
   * Map backend DTO to frontend Question model
   */
  private mapQuestionFromDto(dto: SurveyQuestionResponseDto): Question {
    return {
      questionCode: dto.questionCode,
      questionText: dto.questionDesc,
      sex: this.mapGenderFromBackend(dto.gender),
      responseType: this.mapResponseTypeFromBackend(dto.responseType),
      effectiveDate: dto.effDate ? new Date(dto.effDate) : null,
      terminationDate: dto.termDate ? new Date(dto.termDate) : null,
      isEditable: dto.isEditable === 1,
      answerOptions: [],  // Loaded separately via getAnswers()
      commentConfig: null
    };
  }

  /**
   * Map frontend Question to CreateSurveyQuestionDto
   */
  private mapQuestionToCreateDto(question: Question): CreateSurveyQuestionDto {
    return {
      questionCode: question.questionCode,
      questionDesc: question.questionText,
      typeOfSurvey: null,
      gender: this.mapGenderToBackend(question.sex),
      responseType: this.mapResponseTypeToBackend(question.responseType),
      effDate: this.formatDateForApi(question.effectiveDate),
      termDate: question.terminationDate ? this.formatDateForApi(question.terminationDate) : null
    };
  }

  /**
   * Map frontend Question to UpdateSurveyQuestionDto
   */
  private mapQuestionToUpdateDto(question: Question): UpdateSurveyQuestionDto {
    return {
      questionDesc: question.questionText,
      gender: this.mapGenderToBackend(question.sex),
      responseType: this.mapResponseTypeToBackend(question.responseType),
      effDate: this.formatDateForApi(question.effectiveDate),
      termDate: question.terminationDate ? this.formatDateForApi(question.terminationDate) : null
    };
  }

  /**
   * Map backend DTO to frontend Answer model
   */
  private mapAnswerFromDto(dto: SurveyAnswerResponseDto): Answer {
    return {
      sequence: dto.displaySeq ?? 0,
      answerCode: dto.answerCode,
      answerCodeDescription: dto.answerDesc,
      effectiveDate: dto.effDate ? new Date(dto.effDate) : null,
      terminationDate: dto.termDate ? new Date(dto.termDate) : null,
      // All answers from backend are existing rows (auditKey > 0)
      // Frontend uses: auditKey === 0 for NEW rows (can delete), auditKey > 0 for EXISTING rows (cannot delete)
      auditKey: 1,
      // Map isEditable: 1 = editable (true), 0 = locked (false)
      isEditable: dto.isEditable === 1,
      errors: {}
    };
  }

  /**
   * Map frontend Answer to SaveSurveyAnswerDto
   */
  private mapAnswerToDto(answer: Answer): SaveSurveyAnswerDto {
    return {
      answerCode: answer.answerCode,
      answerDesc: answer.answerCodeDescription,
      displaySeq: answer.sequence,
      effDate: this.formatDateForApi(answer.effectiveDate),
      termDate: answer.terminationDate ? this.formatDateForApi(answer.terminationDate) : null
    };
  }

  // ============================================================================
  // ENUM MAPPERS
  // ============================================================================

  private mapGenderFromBackend(gender: GenderBackend): GenderFrontend {
    return GENDER_REVERSE_MAP[gender] || 'ALL';
  }

  private mapGenderToBackend(gender: GenderFrontend): GenderBackend {
    // Handle empty string (initial state)
    if (gender === '') return 'A';  // Default to ALL when empty
    return GENDER_MAP[gender] || 'A';
  }

  private mapResponseTypeFromBackend(responseType: ResponseTypeBackend): ResponseTypeFrontend {
    return RESPONSE_TYPE_REVERSE_MAP[responseType] || 'Single';
  }

  private mapResponseTypeToBackend(responseType: ResponseTypeFrontend): ResponseTypeBackend {
    // Handle empty string (optional field)
    if (responseType === '') return 'S';  // Default to Single when empty
    return RESPONSE_TYPE_MAP[responseType] || 'S';
  }

  // ============================================================================
  // DATE HELPERS
  // ============================================================================

  /**
   * Format Date/Moment object to YYYY-MM-DD string for API (no timezone conversion)
   * Uses moment to avoid UTC conversion issues with toISOString()
   *
   * Example:
   * - User selects: 08-APR-2026 (midnight local time)
   * - Sends to API: "2026-04-08" (no timezone offset applied)
   * - Backend handles timezone conversion on its side
   */
  private formatDateForApi(date: Date | null): string {
    if (!date) return '';

    const momentDate = moment.isMoment(date) ? date : moment(date);
    return momentDate.format('YYYY-MM-DD');
  }

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  /**
   * Handle HTTP errors with specific error messages
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage: string;

    if (error.error instanceof ErrorEvent) {
      // Client-side or network error
      errorMessage = error.error.message || 'Network error occurred';
    } else {
      // Server-side error - check for business error codes first
      const errorCode = error.error?.errorCode || error.error?.errorResponse?.errorCode;
      const serverMessage = error.error?.message || error.error?.Message;

      // Business validation error codes
      const businessErrors: { [key: string]: string } = {
        '17030': 'This question cannot be modified because it is being used in a survey template',
        '16097': 'This question cannot be modified because it has associated answers',
        '0319': 'A question with this code already exists',
        '17006': 'Invalid gender selection',
        '1910': 'Invalid response type selection',
        '11304': 'Special characters are not allowed',
        '16084': 'This answer is locked and cannot be modified',
        '17018': 'This template is locked and cannot be modified',
        '1707': 'Display sequence must be a positive number',
        '16106': 'Duplicate display sequence or access configuration detected'
      };

      if (errorCode && businessErrors[errorCode]) {
        errorMessage = businessErrors[errorCode];
      } else {
        // HTTP status-based errors
        switch (error.status) {
          case 400:
            errorMessage = serverMessage || 'Invalid request';
            break;
          case 404:
            errorMessage = serverMessage || 'Resource not found';
            break;
          case 409:
            errorMessage = serverMessage || 'Resource already exists';
            break;
          case 500:
            errorMessage = serverMessage || 'Internal server error';
            break;
          default:
            errorMessage = serverMessage || `HTTP error code ${error.status}`;
            break;
        }
      }
    }

    console.error('QA Library API Error:', errorMessage, error);

    return throwError(() => ({ ...error, message: errorMessage }));
  }
}
