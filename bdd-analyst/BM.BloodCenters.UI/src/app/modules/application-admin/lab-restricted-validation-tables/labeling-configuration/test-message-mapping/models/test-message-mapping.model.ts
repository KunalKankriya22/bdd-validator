/**
 * TestMessageMappingModel
 * Matches backend LABELING_TEST_MESSAGE_MAP entity
 * Table: LABELING_TEST_MESSAGE_MAP
 * PK: ltTestId + resultCode + displyTestId (composite)
 */
export interface TestMessageMappingModel {
  ltTestId?: string;
  resultCode?: string;
  displyTestId?: string;
  antibodyFlag?: string | null;
  messageDesc?: string;
  effDate?: string | null;
  termDate?: string | null;
  auditKey?: number | null;
  insertDate?: string | null;
  insertUser?: string | null;
  programId?: string | null;
}

/**
 * Request body for POST /labeling-test-message-map/list
 * All fields optional - pass null/omit to skip filter
 */
export interface TestMessageMappingListBody {
  ltTestId?: string | null;
  resultCode?: string | null;
  displyTestId?: string | null;
  antibodyFlag?: string | null;
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
export interface TestMessageMappingFilterValue {
  resultCode: string | null;
  antibodyFlag: string | null;
  effectiveDatePeriod: string | null;
  effectiveDate: any | null;
  terminationDatePeriod: string | null;
  terminationDate: any | null;
}

/**
 * Lookup item from GET /labeling-test-message-map/lookups/result-codes
 * Response is a plain array: [{ code, description }]
 */
export interface LookupItem {
  code: string;
  description: string | null;
}

/**
 * DTO for creating a new Test Message Mapping record
 * POST /labeling-test-message-map
 */
export interface TestMessageMappingCreateDto {
  ltTestId: string;
  resultCode: string;
  displyTestId: string;
  antibodyFlag?: string | null;
  messageDesc?: string | null;
  effDate: string;
  termDate?: string | null;
  loggedInUserName?: string;
}

/**
 * DTO for updating an existing Test Message Mapping record
 * PUT /labeling-test-message-map/{ltTestId}/{resultCode}/{displyTestId}
 * ltTestId is passed via route only; resultCode and displyTestId are in both route and body
 */
export interface TestMessageMappingUpdateDto {
  resultCode: string;
  displyTestId: string;
  antibodyFlag?: string | null;
  messageDesc?: string | null;
  effDate: string;
  termDate?: string | null;
}
