import { Moment } from 'moment';

/**
 * Response model for GET /valid-abo-pooled-sld
 * Dates are formatted as "dd-MMM-yyyy" (e.g., "01-Jan-2025")
 */
export interface ValidAboPooledSldDto {
  opos: string;              // "Y" or "N"
  oneg: string;              // "Y" or "N"
  apos: string;              // "Y" or "N"
  aneg: string;              // "Y" or "N"
  bpos: string;              // "Y" or "N"
  bneg: string;              // "Y" or "N"
  abpos: string;             // "Y" or "N"
  abneg: string;             // "Y" or "N"
  unitSchemeType: string;    // "I" (Individual) or "C" (Combined)
  rhLabelFlag: string;       // "Y" or "N"
  poolSld: string;           // Max 4 chars
  poolSldDesc: string;       // Description from VALID_ABO_VALUES
  effDate: string;           // "dd-MMM-yyyy" format
  termDate: string;          // "dd-MMM-yyyy" format or empty string
  auditKey: string;          // Unique record identifier
}

/**
 * Request model for POST /valid-abo-pooled-sld
 */
export interface CreateValidAboPooledSldDto {
  opos?: string | null;      // "Y" or "N", defaults to "N"
  oneg?: string | null;      // "Y" or "N", defaults to "N"
  apos?: string | null;      // "Y" or "N", defaults to "N"
  aneg?: string | null;      // "Y" or "N", defaults to "N"
  bpos?: string | null;      // "Y" or "N", defaults to "N"
  bneg?: string | null;      // "Y" or "N", defaults to "N"
  abpos?: string | null;     // "Y" or "N", defaults to "N"
  abneg?: string | null;     // "Y" or "N", defaults to "N"
  unitSchemeType: string;    // Required: "I" or "C"
  rhLabelFlag: string;       // Required: "Y" or "N"
  poolSld: string;           // Required: max 4, must exist in VALID_ABO_VALUES
  effDate?: string | null;   // Required: ISO DateTime, cannot be in past
  termDate?: string | null;  // ISO DateTime, must be >= effDate
}

/**
 * Request model for PUT /valid-abo-pooled-sld/{auditKey}
 */
export interface UpdateValidAboPooledSldDto {
  opos?: string | null;      // "Y" or "N", defaults to "N"
  oneg?: string | null;      // "Y" or "N", defaults to "N"
  apos?: string | null;      // "Y" or "N", defaults to "N"
  aneg?: string | null;      // "Y" or "N", defaults to "N"
  bpos?: string | null;      // "Y" or "N", defaults to "N"
  bneg?: string | null;      // "Y" or "N", defaults to "N"
  abpos?: string | null;     // "Y" or "N", defaults to "N"
  abneg?: string | null;     // "Y" or "N", defaults to "N"
  unitSchemeType: string;    // Required: "I" or "C"
  rhLabelFlag: string;       // Required: "Y" or "N"
  poolSld: string;           // Required: Pool SLD code
  poolSldDesc: string;       // Required: Pool SLD description
  effDate?: string | null;   // Required: ISO DateTime, no past restriction
  termDate?: string | null;  // ISO DateTime, must be >= effDate
}

/**
 * Response model for GET /valid-abo-pooled-sld/pool-sld-lookup
 */
export interface PoolSldLookupDto {
  aboLabel: string;          // Pool SLD code value
  aboShortName: string;      // Pool SLD description
}

/**
 * Request model for POST /valid-abo-pooled-sld/{take}/{skip}
 * All fields are optional for filtering
 */
export interface SearchValidAboPooledSldRequest {
  poolSld?: string | null;           // Filter by exact Pool SLD code
  poolSldDesc?: string | null;       // Filter by Pool SLD Description
  unitSchemeType?: string | null;    // Filter by Unit Scheme Type ("I" or "C")
  rhLabelFlag?: string | null;       // Filter by RH Label Flag ("Y" or "N")
  searchItem?: string | null;        // Free-text search across Pool SLD, Pool SLD Description, and Unit Scheme Type
  sortDirection?: string | null;     // "ASC" (default) or "DESC" — sorts by Pool SLD
  // Blood type filters
  opos?: string | null;              // Filter by O Positive flag ("Y" or "N")
  oneg?: string | null;              // Filter by O Negative flag ("Y" or "N")
  apos?: string | null;              // Filter by A Positive flag ("Y" or "N")
  aneg?: string | null;              // Filter by A Negative flag ("Y" or "N")
  bpos?: string | null;              // Filter by B Positive flag ("Y" or "N")
  bneg?: string | null;              // Filter by B Negative flag ("Y" or "N")
  abpos?: string | null;             // Filter by AB Positive flag ("Y" or "N")
  abneg?: string | null;             // Filter by AB Negative flag ("Y" or "N")
  // Date range filters (ISO DateTime format)
  effDateFrom?: string | null;       // Filter EFF_DATE >= value
  effDateTo?: string | null;         // Filter EFF_DATE <= value
  termDateFrom?: string | null;      // Filter TERM_DATE >= value (NULL term dates included)
  termDateTo?: string | null;        // Filter TERM_DATE <= value (NULL term dates excluded)
}

/**
 * Standard API response wrapper
 */
export interface ApiResponseWrapper<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data: T;
  total?: number;  // Total record count for paginated responses
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
 * Duplicate conflict error response
 */
export interface DuplicateErrorResponse {
  success: false;
  statusCode: 409;
  errorCode: '0069';
  errorResponse: {
    errorCode: '0069';
    error: string;
  };
}

/**
 * Custom validation error (no error code)
 */
export interface CustomValidationErrorResponse {
  success: false;
  statusCode: 400;
  errorResponse: {
    error: string;
  };
}

/**
 * UI Table model (same as ValidAboPooledSldDto, used for clarity in components)
 */
export interface PoolAboValueTableModel {
  opos: string;
  oneg: string;
  apos: string;
  aneg: string;
  bpos: string;
  bneg: string;
  abpos: string;
  abneg: string;
  unitSchemeType: string;
  rhLabelFlag: string;
  poolSld: string;
  poolSldDesc: string;
  effDate: string;
  termDate: string;
  auditKey: string;
}

/**
 * Form value model for Add/Edit dialog
 */
export interface PoolAboValueFormValue {
  opos: string | null;       // "Y" or "N"
  oneg: string | null;       // "Y" or "N"
  apos: string | null;       // "Y" or "N"
  aneg: string | null;       // "Y" or "N"
  bpos: string | null;       // "Y" or "N"
  bneg: string | null;       // "Y" or "N"
  abpos: string | null;      // "Y" or "N"
  abneg: string | null;      // "Y" or "N"
  unitSchemeType: string | null;
  rhLabelFlag: string | null;
  poolSld: string | null;
  poolSldDesc: string | null;
  effDate: Moment | null;
  termDate: Moment | null;
}

/**
 * Filter value model for filter panel
 */
export interface PoolAboValueFilterValue {
  poolSld?: string | null;
  unitSchemeType?: string | null;
  rhLabelFlag?: string | null;
  poolSldDesc?: string | null;
  opos?: string | null;
  oneg?: string | null;
  apos?: string | null;
  aneg?: string | null;
  bpos?: string | null;
  bneg?: string | null;
  abpos?: string | null;
  abneg?: string | null;
  effDatePeriod?: 'before' | 'after' | null;
  effDate?: string | null;
  termDatePeriod?: 'before' | 'after' | null;
  termDate?: string | null;
}

/**
 * Lookup models for dropdowns
 */
export interface LookUp {
  key: string;
  value: string;
}

export interface LookUpWithDescription {
  key: string;
  value: string;
  description: string;
}
