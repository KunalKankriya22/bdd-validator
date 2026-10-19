import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import moment from 'moment';

import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  TemplateLinkModel,
  TemplateLinkApiRecord,
  TemplateLinkSavePayload,
  CategoryCode,
  CategoryValue,
  TemplateLinkApiResponse
} from '../models/template-link.model';

/**
 * TemplateLinkService
 * Handles all API operations for template links
 */
@Injectable({
  providedIn: 'root'
})
export class TemplateLinkService {

  constructor(private apiService: ApiService) {}

  /**
   * Get all links for a specific template
   */
  getTemplateLinks(chapterId: string, templateId: string): Observable<TemplateLinkModel[]> {
    return this.apiService
      .get<TemplateLinkApiResponse<TemplateLinkApiRecord>>(
        API.DONOR_FUNCTIONS.TEMPLATE_LINK.GET_LINKS(chapterId, templateId)
      )
      .pipe(
        map(response => {
          if (response && response.data) {
            return response.data.map(link => this.transformLink(link));
          }
          return [];
        })
      );
  }

  /**
   * Create a new template link
   */
  createTemplateLink(
    chapterId: string,
    templateId: string,
    payload: TemplateLinkSavePayload
  ): Observable<TemplateLinkApiResponse<unknown>> {
    return this.apiService.post<TemplateLinkApiResponse<unknown>>(
      API.DONOR_FUNCTIONS.TEMPLATE_LINK.CREATE_LINK(chapterId, templateId),
      payload
    );
  }

  /**
   * Update an existing template link
   * @param chapterId - Chapter ID
   * @param templateId - Template ID
   * @param payload - Update payload containing old values (WHERE) and new values (SET)
   */
  updateTemplateLink(
    chapterId: string,
    templateId: string,
    payload: TemplateLinkSavePayload
  ): Observable<TemplateLinkApiResponse<unknown>> {
    return this.apiService.put<TemplateLinkApiResponse<unknown>>(
      API.DONOR_FUNCTIONS.TEMPLATE_LINK.UPDATE_LINK(chapterId, templateId),
      payload
    );
  }

  /**
   * Get category codes dropdown
   */
  getCategoryCodes(): Observable<CategoryCode[]> {
    return this.apiService
      .get<TemplateLinkApiResponse<CategoryCode>>(
        API.DONOR_FUNCTIONS.TEMPLATE_LINK.CATEGORY_CODES
      )
      .pipe(
        map(response => {
          if (response && response.data) {
            return response.data;
          }
          return [];
        })
      );
  }

  /**
   * Get category values for a specific category code
   */
  getCategoryValues(categoryCode: string): Observable<CategoryValue[]> {
    return this.apiService
      .get<TemplateLinkApiResponse<CategoryValue>>(
        API.DONOR_FUNCTIONS.TEMPLATE_LINK.CATEGORY_VALUES(categoryCode)
      )
      .pipe(
        map(response => {
          if (response && response.data) {
            return response.data;
          }
          return [];
        })
      );
  }

  /**
   * Map GET links API row (survey* / linkedTemplateId) to UI model (groupId / categoryCode / …)
   */
  private transformLink(raw: TemplateLinkApiRecord): TemplateLinkModel {
    const groupId = raw.surveyGroupId ?? raw.groupId ?? '';
    const categoryCode = raw.surveyCategoryCode ?? raw.categoryCode ?? '';
    const categoryValues = raw.surveyCategoryValues ?? raw.categoryValues ?? '';
    const templateId = raw.linkedTemplateId ?? raw.templateId ?? '';

    return {
      templateId,
      groupId,
      categoryCode,
      categoryValues,
      effDate: raw.effDate ?? '',
      termDate: raw.termDate ?? null,
      lastModified: raw.lastModified,
      chapterId: raw.chapterId ?? '',
      categoryValuesArray: this.parseCategoryValues(categoryValues)
    };
  }

  /**
   * Parse comma-separated category values into array
   */
  private parseCategoryValues(values: string): CategoryValue[] {
    if (!values) return [];

    return values.split(',').map(code => ({
      code: code.trim(),
      description: code.trim() // Will be enriched from dropdown data if needed
    }));
  }

  /**
   * Format date to DD-MMM-YYYY for display
   */
  formatDate(date: string | Date | null | undefined): string {
    if (!date) return '-';
    return moment(date).format('DD-MMM-YYYY').toUpperCase();
  }

  /**
   * Format date/time for API (ISO 8601, e.g. 2026-04-07T17:55:33.992Z).
   * Accepts native Date or Moment (chapter-aware datepicker uses Moment).
   */
  formatDateTimeIso(date: Date | moment.Moment | null): string | null {
    if (!date) return null;
    return moment(date).toISOString();
  }

  /**
   * Convert category values array to comma-separated string
   */
  categoryValuesToString(values: string[]): string {
    return values.filter(v => v).join(',');
  }
}
