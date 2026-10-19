/**
 * List response item — matches BE field names exactly
 */
export interface BarCodeTranslation {
  machineCode: string;          // "00", "01", ..., "99"
  eyeReadTrns: string;          // " C", "E2", max 2 chars
  effDate: string;              // ISO UTC "2016-09-22T00:00:00Z"
  termDate: string | null;      // ISO UTC or null
  lastModified: string;         // ISO UTC — shown in Edit panel header
}

/**
 * Request body for list POST (all optional)
 */
export interface BarCodeTranslationFilter {
  searchKeyword?: string;
  machineCode?: string;         // Exact match
  eyeReadTrns?: string;         // Exact match
  effDateAfter?: string;        // ISO date
  effDateBefore?: string;       // ISO date
  termDateAfter?: string;       // ISO date
  termDateBefore?: string;      // ISO date
  sort?: string;                // "machineCode_asc", "effDate_desc" etc.
}

/**
 * Filter panel form value
 */
export interface BarCodeTranslationFilterValue {
  machineCode: string | null;
  eyeReadTrns: string | null;
  effDate: string | null;
  effDatePeriod: 'BEFORE' | 'AFTER' | null;
  termDate: string | null;
  termDatePeriod: 'BEFORE' | 'AFTER' | null;
}
