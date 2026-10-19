/**
 * TypeScript models for SDD Worksheet Units (Delete Units from SDD Worksheet)
 * Based on API documentation: sdd-worksheet-units-api-documentation.md
 */

/**
 * Response DTO for worksheet lookup
 * Used in GET /sdd-worksheet-units/worksheets
 */
export interface SddWorksheetLookupDto {
  /** SDD Worksheet identifier (max 15 chars) */
  sdcWsNumber: string;
  /** Formatted count of units (e.g., "5 Units") */
  unitCount: string;
}

/**
 * Response DTO for worksheet units
 * Used in GET /sdd-worksheet-units/{worksheetId}
 */
export interface SddWorksheetUnitDto {
  /** Unit identifier (up to 15 chars) */
  unitId: string;
  /** Collection date formatted as DD-MON-YYYY (nullable) */
  collDate: string | null;
  /** Check digit for validation (2 chars, nullable) */
  chkDigit: string | null;
  /** SDD Worksheet identifier */
  sdcWsNumber: string;
}

/**
 * Request DTO for deleting units
 * Used in DELETE /sdd-worksheet-units
 */
export interface DeleteSddWorksheetUnitsRequestDto {
  /** SDD Worksheet identifier (max 15 chars, required) */
  sdcWsNumber: string;
  /** List of unit IDs to delete (at least one required) */
  unitIds: string[];
}

/**
 * Response DTO for delete operation
 */
export interface DeleteSddWorksheetUnitsResponseDto {
  /** Number of units successfully deleted */
  deletedCount: number;
  /** Worksheet identifier */
  worksheetId: string;
}

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data?: T;
  item?: T;
  total?: number;
  errorCode?: string | null;
  errorResponse?: {
    errorCode: string | null;
    error: string;
  };
}
