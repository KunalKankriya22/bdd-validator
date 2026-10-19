import { Moment } from 'moment';

/**
 * Response model for GET /notation-codes
 * Response from API - dates are in GMT, formatted as ISO DateTime
 */
export interface NotationCode {
  notationCode: string;           // Max 10 chars
  notationDesc: string;            // Max 240 chars
  notationType: 'S' | 'R';          // S=Sample, R=Result
  testId: string | null;           // Max 10 chars (required for R type)
  shortDesc: string | null;        // Max 30 chars (required for R type, maps to "Notation Header" in UI)
  effDate: string;                 // ISO DateTime in GMT
  termDate: string | null;         // ISO DateTime in GMT or null
  insertDate: string;              // ISO DateTime in GMT
  insertUser: string;              // Max 6 chars
  programId: string;               // Max 8 chars (VCONFCFG)
  auditKey: number;                // Unique record identifier
}

/**
 * Request model for POST /notation-codes (Create)
 */
export interface CreateNotationCodeDto {
  notationCode: string;            // Required: alphanumeric + underscore, max 10 chars, unique
  notationType: 'S' | 'R';          // Required: S or R
  testId: string | null;           // Conditional: required for R, null for S, must exist in database
  shortDesc: string | null;        // Conditional: required for R, null for S, max 30 chars
  notationDesc: string;            // Required: max 1000 chars, not empty
  effDate: string;                 // Required: ISO date YYYY-MM-DD, cannot be in past (create only)
  termDate?: string | null;        // Optional: ISO date YYYY-MM-DD, must be >= effDate, not in past
}

/**
 * Request model for PUT /notation-codes/{notationCode} (Update)
 */
export interface UpdateNotationCodeDto {
  notationType: 'S' | 'R';          // Required: S or R
  testId: string | null;           // Conditional: required for R, null for S
  shortDesc: string | null;        // Conditional: required for R, null for S, max 30 chars
  notationDesc: string;            // Required: max 1000 chars, not empty
  effDate: string;                 // Required: ISO date YYYY-MM-DD
  termDate?: string | null;        // Optional: ISO date YYYY-MM-DD, must be >= effDate, not in past
}

/**
 * Request model for POST /notation-codes/{take}/{skip} (Search with filters)
 */
export interface NotationCodeQueryDto {
  notationCode?: string | null;    // Optional: filter by notation code (partial match)
  notationType?: string | null;    // Optional: filter by type (S/R/F)
  searchKeyword?: string | null;   // Optional: search across multiple fields
  sortColumn?: string | null;      // Optional: column to sort by (NotationCode, NotationType, NotationDesc)
  sortOrder?: string | null;       // Optional: ASC or DESC
}

/**
 * Standard API response wrapper
 */
export interface ApiResponseWrapper<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data: T;
  total?: number;
}

/**
 * Validation error response (with error code)
 */
export interface ValidationErrorResponse {
  success: false;
  statusCode: 400;
  errorCode: string;
  errorResponse: {
    errorCode: string;
    error: string;
  };
}

/**
 * UI Table model (for data table display)
 * Dates are formatted as DD-MMM-YYYY for display
 */
export interface NotationCodeTableModel {
  notationCodeValue: string;
  notationType: 'S' | 'R';
  testId: string | null;
  shortDesc: string | null;
  notationDesc: string;
  effDate: string;                 // Formatted as DD-MMM-YYYY
  termDate: string | null;         // Formatted as DD-MMM-YYYY or null
  auditKey: number;
}

/**
 * Form value model for Add/Edit dialog
 * Uses Moment for date handling in forms
 */
export interface NotationCodeFormValue {
  notationCode: string | null;      // Disabled in edit mode
  notationType: string | null;      // S, R, or F
  testId: string | null;            // Conditional based on type
  shortDesc: string | null;         // Conditional based on type (Notation Header in UI)
  notationDesc: string | null;      // Required
  effDate: Moment | null;           // Required
  termDate: Moment | null;          // Optional
}

/**
 * Filter value model for filter panel
 */
export interface NotationCodeFilterValue {
  notationCode?: string | null;
  notationType?: string | null;
}

/**
 * Lookup models for dropdowns
 */
export interface LookUp {
  key: string;
  value: string;
}

/**
 * Notation Type lookup for dropdown (add/edit form)
 */
export const NOTATION_TYPE_LOOKUP: LookUp[] = [
  { key: 'S', value: 'S - Sample' },
  { key: 'R', value: 'R - Result' }
];

/**
 * Notation Type filter options for filter bar (show code only, description shown separately)
 */
export const NOTATION_TYPE_FILTER_OPTIONS: LookUp[] = [
  { key: 'S', value: 'S' },
  { key: 'R', value: 'R' }
];

/**
 * Notation Type display map (for table column formatting)
 */
export const NOTATION_TYPE_DISPLAY: { [key: string]: string } = {
  'S': 'S - Sample',
  'R': 'R - Result'
};

/**
 * Notation Type description map (for "Type of Code Description" field in filter bar)
 */
export const NOTATION_TYPE_DESCRIPTION: { [key: string]: string } = {
  'S': 'Sample Notations',
  'R': 'Result Notations'
};

/**
 * Valid Test lookup model for TEST_ID autocomplete
 */
export interface ValidTestLookup {
  testId: string;
  testGroup: string | null;
  testDesc: string | null;
}

export interface NotationCodeLookupItem {
  notationCode: string;
  notationDesc: string;
}

