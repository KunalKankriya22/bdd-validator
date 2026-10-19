/**
 * Value Style enum — maps backend codes to FE constants
 */
export enum ValueStyle {
  S = 'S',   // Single
  R = 'R',   // Range
  M = 'M',   // Multiple
  X = 'X'    // Mixed
}

/**
 * Display labels for Value Style codes
 */
export const VALUE_STYLE_LABELS: Record<string, string> = {
  'S': 'Single',
  'R': 'Range',
  'M': 'Multiple',
  'X': 'Mixed'
};

/**
 * Value Style dropdown options for forms/filters
 */
export const VALUE_STYLE_OPTIONS = [
  { value: ValueStyle.S, label: 'Single' },
  { value: ValueStyle.R, label: 'Range' },
  { value: ValueStyle.M, label: 'Multiple' },
  { value: ValueStyle.X, label: 'Mixed' }
];

/**
 * Date filter period type
 */
export type DatePeriod = 'BEFORE' | 'AFTER';

/**
 * ValidOperator — matches BE response item exactly
 */
export interface ValidOperator {
  operator: string;
  description: string | null;
  valueStyle: string;           // S, R, M, X
  effectiveDate: string;        // ISO UTC e.g. "2026-02-12T00:00:00Z"
  terminationDate: string | null;
}

/**
 * Request body for list endpoint (POST /api/v1/valid-operators/{take}/{skip})
 * All fields optional
 */
export interface ValidOperatorFilter {
  searchKeyword?: string;
  valueStyle?: string;                    // S, R, M, X
  effectiveDate?: string;                 // ISO date
  effectiveDatePeriod?: DatePeriod;
  terminationDate?: string;
  terminationDatePeriod?: DatePeriod;
  sort?: string;                          // "operator_asc", "effectiveDate_desc"
}

/**
 * List response wrapper from BE
 */
export interface ValidOperatorListResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: ValidOperator[];
  total: number;
}

/**
 * Request body for adding a new operator (POST /api/v1/valid-operators)
 */
export interface CreateValidOperator {
  operator: string;             // required, max 10
  description?: string;         // optional, max 100
  valueStyle: string;           // required, one of: S, R, M, X
  effectiveDate: string;        // required, calendar date, must be >= today (UTC)
  terminationDate?: string;     // optional, calendar date, must be >= effectiveDate
}

/**
 * Request body for updating an operator (PUT /api/v1/valid-operators/{operatorCode})
 * Operator is in URL, not body
 */
export interface UpdateValidOperator {
  operator?: string;            // optional, allows PK rename
  description?: string;         // optional, max 100
  valueStyle: string;           // required, one of: S, R, M, X
  effectiveDate: string;        // required, calendar date
  terminationDate?: string;     // optional, calendar date, must be >= effectiveDate
}

/**
 * Filter panel form value interface
 */
export interface ValidOperatorFilterValue {
  valueStyle: string | null;
  effectiveDate: string | null;
  effectiveDatePeriod: DatePeriod | null;
  terminationDate: string | null;
  terminationDatePeriod: DatePeriod | null;
}
