/**
 * Template Link Models and Interfaces
 * Generated for MLT-9709: Link Template functionality
 */

/**
 * Raw row from GET .../links (API field names)
 */
export interface TemplateLinkApiRecord {
  surveyGroupId?: string;
  surveyCategoryCode?: string;
  surveyCategoryValues?: string;
  linkedTemplateId?: string;
  effDate?: string | null;
  termDate?: string | null;
  /** Legacy / alternate names (if API varies) */
  groupId?: string;
  categoryCode?: string;
  categoryValues?: string;
  templateId?: string;
  chapterId?: string;
  lastModified?: string;
}

/**
 * TemplateLinkModel
 * Represents a single template link record (normalized for UI)
 */
export interface TemplateLinkModel {
  templateId: string;
  groupId: string;
  categoryCode: string;
  categoryCodeDescription?: string;
  categoryValues: string; // Comma-separated values (e.g., "RETD,PROC,DFLT")
  categoryValuesArray?: CategoryValue[]; // Parsed array for display
  effDate: string | Date;
  termDate?: string | Date | null;
  lastModified?: string;
  chapterId: string;
}

/**
 * CategoryCode
 * Dropdown option for category codes
 */
export interface CategoryCode {
  code: string;
  description: string;
}

/**
 * CategoryValue
 * Individual category value with code and description
 */
export interface CategoryValue {
  code: string;
  description: string;
  selected?: boolean;
}

/**
 * POST/PUT body for template links.
 * Only business data - metadata fields are set by BE controller from headers.
 * chapterId and templateId are in the URL path.
 *
 * For CREATE (POST):
 * - surveyGroupId, surveyCategoryCode, surveyCategoryValues, effDate, termDate
 * - newSurveyGroupId and newSurveyCategoryCode are optional (not used for create)
 *
 * For UPDATE (PUT):
 * - surveyGroupId and surveyCategoryCode = old/current values (WHERE clause)
 * - newSurveyGroupId and newSurveyCategoryCode = new values (SET clause)
 * - surveyCategoryValues, effDate, termDate = new values
 */
export interface TemplateLinkSavePayload {
  surveyGroupId: string;
  surveyCategoryCode: string;
  newSurveyGroupId?: string;
  newSurveyCategoryCode?: string;
  surveyCategoryValues: string;
  effDate: string | null;
  termDate: string | null;
}

/** @deprecated Use TemplateLinkSavePayload */
export type CreateTemplateLinkDto = TemplateLinkSavePayload;

/** @deprecated Use TemplateLinkSavePayload */
export type UpdateTemplateLinkDto = TemplateLinkSavePayload;

/**
 * Dropdown response from API
 */
export interface TemplateLinkDropdowns {
  categoryCodes?: CategoryCode[];
  categoryValues?: CategoryValue[];
}

/**
 * API Response wrapper
 */
export interface TemplateLinkApiResponse<T> {
  success: boolean;
  statusCode?: number;
  message: string;
  data: T[];
  total?: number;
  totalRecords?: number;
  error?: string | null;
  errorCode?: string;
  errorResponse?: { errorCode?: string; error?: string };
}

/**
 * Form value for add/edit dialog
 */
export interface TemplateLinkFormValue {
  groupId: string;
  categoryCode: string | null;
  categoryValues: string[];
  effDate: Date | null;
  termDate: Date | null;
}

/**
 * Dialog data interface
 */
export interface TemplateLinkDialogData {
  mode: 'add' | 'edit';
  templateId: string;
  link?: TemplateLinkModel;
}

/**
 * Dialog result interface
 */
export interface TemplateLinkDialogResult {
  action: 'save' | 'saveAndCreateAnother' | 'cancel';
  mode?: 'add' | 'edit';
  data?: TemplateLinkSavePayload;
}
