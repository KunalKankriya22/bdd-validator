import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError, retry } from 'rxjs/operators';
import moment from 'moment';
import { ApiService } from '@shared/services/api.service';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { API } from '../../../../../../core/constants/api.constants';
import {
  LetterView,
  LetterCodeOption,
  TemplateVariable,
  CreateLetterDto,
  ReviseLetterDto,
  LetterFilterCriteria,
  SendEmailRequest,
  PreviewLetterResponse,
  ApiResponse,
  ValidLetterApiResponse
} from '../models/notification-letter.model';

/**
 * Service for managing notification letters
 * Handles API communication, data transformation, and error handling
 * Uses ApiService for automatic chapter/warehouse header injection
 */
@Injectable({
  providedIn: 'root'
})
export class NotificationLettersService {
  private readonly apiService = inject(ApiService);

  /**
   * Get notification letters based on filter criteria
   * Separates current versions from history
   * Uses POST endpoint with pagination
   */
  getLetters(filter: LetterFilterCriteria, take: number = 100, skip: number = 0): Observable<LetterView[]> {
    const endpoint = API.DONOR_FUNCTIONS.NOTIFICATION_LETTERS.LIST(take, skip);

    // Build request body with filter criteria
    // Chapter/warehouse headers are automatically added by ApiService interceptor
    const body: any = {
      searchKeyword: filter.letterCode || '',
      letterCode: filter.letterCode || '',
      documentType: '',
      showTerminated: filter.showTerminated || false,
      effectiveDate: null,
      effectiveDatePeriod: '',
      terminationDate: null,
      terminationDatePeriod: '',
      sort: 'A'
    };

    return this.apiService
      .post<ApiResponse<ValidLetterApiResponse[]>>(endpoint, body)
      .pipe(
        retry(1),
        map(response => {
          const data = response.data || [];
          // Step 1: Map flat API response to nested LetterView structure
          const mappedLetters = data.map(apiLetter => this.mapApiResponseToLetterView(apiLetter));
          // Step 2: Transform dates from API format to UI format
          return mappedLetters.map(letter => this.transformLetterDates(letter));
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Get available letter codes for dropdown
   * Chapter/warehouse headers are automatically added by ApiService interceptor
   */
  getLetterCodes(): Observable<LetterCodeOption[]> {
    const endpoint = API.DONOR_FUNCTIONS.NOTIFICATION_LETTERS.FILTERS;

    return this.apiService
      .get<ApiResponse<Array<{ letterCodes: string[] }>>>(endpoint)
      .pipe(
        map(response => {
          // API returns { data: [{ letterCodes: ["09.18", "10.05", ...] }] }
          const letterCodes = response.data?.[0]?.letterCodes || [];

          // Map string array to LetterCodeOption objects
          return letterCodes.map(code => ({
            code: code,
            description: '' // Description will be fetched when letter is selected
          }));
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Get allowed template variables
   * Chapter/warehouse headers are automatically added by ApiService interceptor
   */
   getTemplateVariables(): Observable<TemplateVariable[]> {
    const endpoint = API.DONOR_FUNCTIONS.NOTIFICATION_LETTERS.TEMPLATE_VARIABLES;

    return this.apiService
      .get<ApiResponse<any[]>>(endpoint)
      .pipe(
        map(response => {
          const data = response.data || [];
          // Explicitly create plain array to avoid Signal wrapping
          const variables = [...data].map(item => ({
            name: this.extractVariableName(item.variable),
            placeholder: item.variable,
            description: item.description || '',
            example: item.example || '',
            dataType: item.category || ''
          }));

          return [...variables];
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Extract variable name from placeholder (remove && delimiters)
   * Example: "&&CurrentDate&&" -> "CurrentDate"
   */
  private extractVariableName(placeholder: string): string {
    if (!placeholder) return '';
    return placeholder.replace(/&&/g, '').trim();
  }

  /**
   * Create a new letter
   * Chapter/warehouse headers are automatically added by ApiService interceptor
   */
  createLetter(dto: CreateLetterDto): Observable<LetterView> {
    const endpoint = API.DONOR_FUNCTIONS.NOTIFICATION_LETTERS.CREATE;

    // DTO is already formatted correctly by component
    return this.apiService
      .post<ApiResponse<LetterView>>(endpoint, dto)
      .pipe(
        map(response => this.transformLetterDates(response.data)),
        catchError(this.handleError)
      );
  }

  /**
   * Revise an existing letter (create new version)
   * Chapter/warehouse headers are automatically added by ApiService interceptor
   */
  reviseLetter(dto: ReviseLetterDto): Observable<LetterView> {
    const endpoint = API.DONOR_FUNCTIONS.NOTIFICATION_LETTERS.REVISE;

    // DTO already matches API structure (ReviseValidLetterDto)
    return this.apiService
      .post<ApiResponse<ValidLetterApiResponse>>(endpoint, dto)
      .pipe(
        map(response => {
          if (!response.data) return {} as LetterView;
          return this.transformLetterDates(this.mapApiResponseToLetterView(response.data));
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Get letter details (all versions for a letter code)
   * Returns the newest version (first in array, ordered by versionNo DESC)
   * Chapter/warehouse headers are automatically added by ApiService interceptor
   */
  getLetterDetail(letterCode: string, documentType: string = 'N', versionNo?: number): Observable<LetterView> {
    const endpoint = API.DONOR_FUNCTIONS.NOTIFICATION_LETTERS.DETAIL(letterCode, documentType);

    return this.apiService
      .get<ApiResponse<ValidLetterApiResponse[]>>(endpoint)
      .pipe(
        map(response => {
          const data = response.data || [];
          if (data.length === 0) {
            throw new Error('Letter not found');
          }
          if (versionNo !== undefined) {
            const match = data.find(d => d.versionNo === versionNo);
            if (match) {
              return this.mapApiResponseToLetterView(match);
            }
          }
          return this.mapApiResponseToLetterView(data[0]);
        }),
        map(letter => this.transformLetterDates(letter)),
        catchError(this.handleError)
      );
  }

  /**
   * Preview letter with formatted HTML
   * Chapter/warehouse headers are automatically added by ApiService interceptor
   */
  previewLetter(letterCode: string, versionNo: number, documentType: string = 'N'): Observable<LetterView> {
    const endpoint = API.DONOR_FUNCTIONS.NOTIFICATION_LETTERS.PREVIEW(letterCode, versionNo, documentType);

    return this.apiService
      .get<ApiResponse<ValidLetterApiResponse[]>>(endpoint)
      .pipe(
        map(response => {
          const data = response.data || [];
          if (data.length === 0) {
            throw new Error('Letter version not found');
          }
          // Return the first item (should only be one version in preview)
          const letterData = data[0];
          return this.mapApiResponseToLetterView(letterData);
        }),
        map(letter => this.transformLetterDates(letter)),
        catchError(this.handleError)
      );
  }

  /**
   * Send email preview
   * Chapter/warehouse headers are automatically added by ApiService interceptor
   */
  sendEmailPreview(request: SendEmailRequest): Observable<void> {
    const endpoint = API.DONOR_FUNCTIONS.NOTIFICATION_LETTERS.SEND_PREVIEW;

    return this.apiService
      .post<ApiResponse<void>>(endpoint, request)
      .pipe(
        map(() => undefined),
        catchError(this.handleError)
      );
  }

  /**
   * Map flat API response to nested LetterView structure
   * The API returns a flat object, but the component expects nested currentVersion
   */
  private mapApiResponseToLetterView(apiResponse: ValidLetterApiResponse): LetterView {
    // Determine if current version based on terminationDate vs chapter date
    // Current if: no termination date OR termination date > chapter's today (strict >)
    // History if: termination date IS NOT NULL AND termination date <= chapter's today
    const chapterToday = DateFieldValidationUtility.getMinDate();
    const isCurrent = !apiResponse.terminationDate ||
                      moment(apiResponse.terminationDate).isAfter(chapterToday, 'day');

    return {
      letterCode: apiResponse.letterCode,
      title: apiResponse.letterTitle,
      description: apiResponse.letterTitle,  // Use title as description
      fileName: `${apiResponse.letterCode}_v${apiResponse.versionNo}.html`,
      currentVersion: {
        letterId: apiResponse.letterId,
        letterCode: apiResponse.letterCode,
        versionNo: apiResponse.versionNo,
        effectiveDate: apiResponse.effectiveDate,  // Will be formatted by transformLetterDates
        terminationDate: apiResponse.terminationDate || undefined,
        letterMessage: apiResponse.letterContent || '',  // letterContent from detail endpoint, empty in list
        isCurrent: isCurrent,
        createdDate: apiResponse.versionDate,
        modifiedDate: apiResponse.modificationDate
      }
    };
  }

  /**
   * Transform letter dates from API format (YYYY-MM-DD) to UI format (DD-MMM-YYYY)
   */
  private transformLetterDates(letter: LetterView): LetterView {
    if (letter.currentVersion) {
      letter.currentVersion = {
        ...letter.currentVersion,
        effectiveDate: this.formatDateForUI(letter.currentVersion.effectiveDate),
        terminationDate: letter.currentVersion.terminationDate
          ? this.formatDateForUI(letter.currentVersion.terminationDate)
          : undefined,
        createdDate: this.formatDateForUI(letter.currentVersion.createdDate)
      };
    }

    if (letter.versionHistory) {
      letter.versionHistory = letter.versionHistory.map(version => ({
        ...version,
        effectiveDate: this.formatDateForUI(version.effectiveDate),
        terminationDate: version.terminationDate
          ? this.formatDateForUI(version.terminationDate)
          : undefined
      }));
    }

    return letter;
  }

  /**
   * Transform DTO dates from UI format to API format before sending
   */
  private transformDtoToApi<T extends CreateLetterDto | ReviseLetterDto>(dto: T): T {
    return {
      ...dto,
      effectiveDate: this.formatDateForApi(dto.effectiveDate),
      terminationDate: dto.terminationDate
        ? this.formatDateForApi(dto.terminationDate)
        : undefined
    };
  }

  /**
   * Format date from API (YYYY-MM-DD) to UI (DD-MMM-YYYY uppercase)
   */
  formatDateForUI(value: string | null | undefined): string {
    if (!value || !value.trim()) {
      return '';
    }
    const m = moment(value);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : value;
  }

  /**
   * Format date from UI (DD-MMM-YYYY or Date object) to API (YYYY-MM-DD)
   */
  formatDateForApi(value: string | Date | null | undefined): string {
    if (!value) {
      return '';
    }
    const m = moment(value);
    return m.isValid() ? m.format('YYYY-MM-DD') : '';
  }

  /**
   * Submit preview report for a letter version
   * Backend handles PARM_ID generation, parameter building, and report queue submission
   * userId and chapterId are extracted from request headers by ApiService interceptor
   */
  submitPreviewReport(letterId: string): Observable<PreviewLetterResponse> {
    const endpoint = API.DONOR_FUNCTIONS.NOTIFICATION_LETTERS.REPORT_PREVIEW(letterId);

    return this.apiService
      .get<any>(endpoint)
      .pipe(
        map(response => response.data || response.item || response),
        catchError(this.handleError)
      );
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: any): Observable<never> {
    console.error('NotificationLettersService error:', error);

    let errorMessage = 'An error occurred while processing your request.';

    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.error?.errors && error.error.errors.length > 0) {
      errorMessage = error.error.errors.join(', ');
    } else if (error.message) {
      errorMessage = error.message;
    }

    return throwError(() => new Error(errorMessage));
  }
}
