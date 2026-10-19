/**
 * Pheresis Count Models
 * MLT-13041: Enter Pheresis Count
 */

/**
 * Component requiring count entry
 */
export interface PheresisCountComponentDto {
  /** Unit ID */
  unitId: string;

  /** Collection date (ISO format from API) */
  collDate: string;

  /** Product code */
  productCode: string;

  /** Component prefix */
  componentPrefix: string | null;

  /** Current component count (null if not entered) */
  componentCount: number | null;

  /** Whether component is labeled (Y/N) */
  componentLabeled: string;

  /** Product description */
  productDescription: string;
}

/**
 * Request to update component count
 */
export interface UpdateComponentCountRequestDto {
  /** Unit ID */
  unitId: string;

  /** Collection date (ISO format) */
  collDate: string;

  /** Product code */
  productCode: string;

  /** New component count (0-999) */
  componentCount: number | null;
}

/**
 * Generic API response wrapper
 */
export interface ReturnResult<T> {
  success: boolean;
  data?: T;
  message?: string;
  errorCode?: string;
}

/**
 * Paged API response with total count
 */
export interface PagedResult<T> {
  data: T[];
  total: number;
}

/**
 * UI model for component row with editable count
 */
export interface PheresisCountRow {
  /** Unit ID */
  unitId: string;

  /** Raw collection date (ISO format for API calls) */
  collDate: string;

  /** Product code */
  productCode: string;

  /** Product description */
  productDescription: string;

  /** Collection date (formatted DD-MMM-YYYY for display) */
  collectionDateDisplay: string;

  /** Current cell count (editable) */
  cellCount: number | null;

  /** Whether component is labeled (prevents editing) */
  isLabeled: boolean;

  /** Whether this row is currently being saved */
  saving?: boolean;

  /** Error message for this row */
  error?: string;

  /** Original count value for reset */
  originalCount: number | null;
}
