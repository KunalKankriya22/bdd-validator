/**
 * RecoveredPlasmaTestModel
 * Matches backend LblPlasmaTestsConfig entity
 * Table: LBL_PLASMA_TESTS_CONFIG
 * PK: testId (single)
 */
export interface RecoveredPlasmaTestModel {
  testId?: string;
  effDate?: string | null;
  termDate?: string | null;
  auditKey?: number | null;
  insertDate?: string | null;
  insertUser?: string | null;
  programId?: string | null;
}

/**
 * Request body for POST /lbl-plasma-tests-config/list
 * All fields optional - pass null/omit to skip filter
 */
export interface RecoveredPlasmaTestListBody {
  testId?: string | null;
  effDateAfter?: string | null;
  effDateBefore?: string | null;
  termDateAfter?: string | null;
  termDateBefore?: string | null;
  searchKeyword?: string | null;
  sort?: string | null;
}

/**
 * Filter Form Value Interface
 * Represents the structure of the filter panel form
 */
export interface RecoveredPlasmaTestFilterValue {
  effectiveDatePeriod: string | null;
  effectiveDate: any | null;
  terminationDatePeriod: string | null;
  terminationDate: any | null;
}

/**
 * Lookup item from GET /lbl-barcode-config/lookups/test-ids
 * Response is a plain array: [{ code, description }]
 */
export interface LookupItem {
  code: string;
  description: string | null;
}

/**
 * DTO for creating a new Plasma Tests Config record
 * POST /lbl-plasma-tests-config
 */
export interface RecoveredPlasmaTestCreateDto {
  testId: string;
  effDate?: string | null;
  termDate?: string | null;
  loggedInUserName?: string;
}

/**
 * DTO for updating an existing Plasma Tests Config record
 * PUT /lbl-plasma-tests-config/{testId}
 * Only editable fields in body (no PK)
 */
export interface RecoveredPlasmaTestUpdateDto {
  effDate?: string | null;
  termDate?: string | null;
}
