import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  SurveyTemplateModel,
  SurveyTemplateAddDropdownLov,
  SurveyTemplateDto,
  UpdateSurveyTemplateDto,
} from '../models/survey-template.model';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import { HeaderService } from '@shared/services/header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { HttpContext } from '@angular/common/http';
import { SKIP_ERROR_TOAST } from 'src/app/core/constants/http-context.constants';
import moment from 'moment';

interface ReturnResult<T> {
  success?: boolean;
  message?: string;
  error?: string;
  statusCode?: number;
  data?: T[];
  total?: number;
}

/** Raw API row shape — status is computed FE-side from dates */
interface SurveyTemplateApiRow {
  templateId: string;
  chapterId: string;
  typeOfSurvey: string;
  effDate: string;
  termDate?: string | null;
  surveyTypeDescription?: string;
  questionCount?: number;
  isEditable?: number;
}

/**
 * SurveyTemplateService
 * Handles all API operations for Survey Template management
 * Backend endpoints: /api/v1/donor-survey-manager/templates
 */
@Injectable({
  providedIn: 'root'
})
export class SurveyTemplateService {
  private readonly apiService = inject(ApiService);
  private readonly headerService = inject(HeaderService);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);

  /**
   * Get all survey templates (client-side filtering)
   * GET /api/v1/donor-survey-manager/templates
   */
  getSurveyTemplates(): Observable<SurveyTemplateModel[]> {
    const endpoint = API.DONOR_FUNCTIONS.SURVEY_TEMPLATE.GET_ALL;

    return this.apiService.get<ReturnResult<SurveyTemplateApiRow>>(endpoint).pipe(
      map(response => (response.data || []).map(row => this.mapApiRowToModel(row))),
      catchError(error => throwError(() => error))
    );
  }

  private mapApiRowToModel(row: SurveyTemplateApiRow): SurveyTemplateModel {
    return {
      templateId: row.templateId,
      chapterId: row.chapterId,
      typeOfSurvey: row.typeOfSurvey,
      surveyTypeDescription: row.surveyTypeDescription ?? row.typeOfSurvey,
      effDate: row.effDate,
      termDate: row.termDate ?? null,
      templateStatus: this.computeStatus(row.effDate, row.termDate ?? null),
      questionCount: row.questionCount,
      isEditable: row.isEditable
    };
  }

  private computeStatus(effDate: string, termDate: string | null): 'Active' | 'Inactive' | 'Future' {
    const today = this.chapterTimezoneService.getChapterLocalDate();
    const eff = moment(effDate).startOf('day');
    const term = termDate ? moment(termDate).startOf('day') : null;

    if (eff.isAfter(today) && (term === null || term.isSameOrAfter(eff))) {
      return 'Future';
    }
    if (eff.isSameOrBefore(today) && (term === null || term.isAfter(today))) {
      return 'Active';
    }
    return 'Inactive';
  }

  /**
   * Get a specific template with its questions
   * GET /api/v1/donor-survey-manager/templates/{chapterId}/{templateId}
   */
  getSurveyTemplateById(chapterId: string, templateId: string): Observable<any[]> {
    const endpoint = API.DONOR_FUNCTIONS.SURVEY_TEMPLATE.GET_BY_ID(chapterId, templateId);

    return this.apiService.get<ReturnResult<any>>(endpoint).pipe(
      map(response => response.data || []),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Get survey types
   * GET /api/v1/donor-survey-manager/survey-types
   */
  getSurveyTypes(): Observable<Array<{ code: string; description: string }>> {
    const endpoint = API.DONOR_FUNCTIONS.SURVEY_TEMPLATE.SURVEY_TYPES;

    return this.apiService.get<ReturnResult<{ code: string; description: string }>>(endpoint).pipe(
      map(response => response.data || []),
      catchError(() => throwError(() => []))
    );
  }

  /**
   * Get add dropdown options (survey types and next template ID)
   * GET /api/v1/donor-survey-manager/templates/add-dropdown
   * ChapterId is sent automatically via X-ChapterId header by authInterceptor
   */
  getSurveyTemplateAddDropdowns(): Observable<SurveyTemplateAddDropdownLov> {
    const endpoint = API.DONOR_FUNCTIONS.SURVEY_TEMPLATE.ADD_DROPDOWN;

    return this.apiService.get<SurveyTemplateAddDropdownLov>(endpoint).pipe(
      map(response => response || { surveyTypes: [], nextTemplateId: '' }),
      catchError(() => throwError(() => ({ surveyTypes: [], nextTemplateId: '' })))
    );
  }

  /**
   * Add a new survey template
   * POST /api/v1/donor-survey-manager/templates
   */
  addSurveyTemplate(data: SurveyTemplateDto): Observable<{ success: boolean; message: string }> {
    const endpoint = API.DONOR_FUNCTIONS.SURVEY_TEMPLATE.CREATE;

    return this.apiService.post<ReturnResult<unknown>>(endpoint, data, {
      context: new HttpContext().set(SKIP_ERROR_TOAST, [409])
    }).pipe(
      map(response => ({
        success: response.success || false,
        message: response.message || ''
      })),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Update an existing survey template
   * PUT /api/v1/donor-survey-manager/templates/{chapterId}/{templateId}
   */
  updateSurveyTemplate(data: UpdateSurveyTemplateDto): Observable<{ success: boolean; message: string }> {
    const endpoint = API.DONOR_FUNCTIONS.SURVEY_TEMPLATE.UPDATE(data.chapterId, data.templateId);

    return this.apiService.put<ReturnResult<unknown>>(endpoint, data, {
      context: new HttpContext().set(SKIP_ERROR_TOAST, [409])
    }).pipe(
      map(response => ({
        success: response.success || false,
        message: response.message || ''
      })),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Delete a survey template
   * DELETE /api/v1/donor-survey-manager/templates/{templateId}/{chapterId}
   */
  deleteSurveyTemplate(templateId: string): Observable<{ success: boolean; message: string }> {
    const chapterId = this.headerService.chapterId();
    const endpoint = API.DONOR_FUNCTIONS.SURVEY_TEMPLATE.DELETE(templateId, chapterId);

    return this.apiService.delete<ReturnResult<unknown>>(endpoint).pipe(
      map(response => ({
        success: response.success || false,
        message: response.message || ''
      })),
      catchError(error => throwError(() => error))
    );
  }
}
