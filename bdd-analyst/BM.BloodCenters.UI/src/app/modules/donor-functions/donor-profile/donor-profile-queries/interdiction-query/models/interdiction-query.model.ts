/**
 * Core data model for Interdiction Query from API
 */
export interface InterdictionQueryModel {
  donorInterdictionCode?: string;
  codeMeaning?: string;
  effectiveDate?: string | Date | null;
  terminationDate?: string | Date | null;
  unitId?: string;
  reasonForInterdiction?: string;
  userInactiveClass?: string;
  chapterId?: string;
  warehouseId?: string;
}

/**
 * API Response wrapper
 */
export interface InterdictionQueryResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: InterdictionQueryModel[];
  total: number;
}

/**
 * API request parameters for list endpoint
 * Used for filtering and searching
 */
export interface InterdictionQueryParamsDto {
  searchKeyword?: string;
  donorInterdictionCode?: string;
  effectiveDate?: string;      // Format: YYYY-MM-DD
  effectivePeriod?: string;    // "Before" | "After"
  terminationDate?: string;    // Format: YYYY-MM-DD
  terminationPeriod?: string;  // "Before" | "After"
  unitId?: string;
  userInactiveClass?: string;
}

/**
 * Filter form values
 * Represents the structure of the filter panel form
 */
export interface InterdictionQueryFilterValue {
  donorInterdictionCode: string | null;
  effectivePeriod: string | null;
  effectiveDate: Date | null;
  terminationPeriod: string | null;
  terminationDate: Date | null;
  unitId: string | null;
  userInactiveClass: string | null;
}

/**
 * DTO for adding interdictions (AND selection)
 * Matches API contract for POST /api/v1/donor-interdiction-query/add-and
 */
export interface AddInterdictionsAndDto {
  donorInterdictionCodes: string[];  // Selected interdiction codes
  effectiveDate: string;             // ISO date string (YYYY-MM-DD)
  terminationDate?: string;          // ISO date string (optional)
  unitId: string;                    // 7 or 15 characters
  reasonForInterdiction?: string;    // Optional reason
  userInactiveClass: string;         // Selected class
}

/**
 * DTO for adding interdictions (OR selection)
 * Matches API contract for POST /api/v1/donor-interdiction-query/add-or
 */
export interface AddInterdictionsOrDto {
  donorInterdictionCodes: string[];  // Selected interdiction codes
  effectiveDate: string;             // ISO date string (YYYY-MM-DD)
  terminationDate?: string;          // ISO date string (optional)
  unitId: string;                    // 7 or 15 characters
  reasonForInterdiction?: string;    // Optional reason
  userInactiveClass: string;         // Selected class
}

/**
 * User Inactive Class lookup item
 */
export interface UserInactiveClass {
  userInactiveClass: string;
}

/**
 * Donor Interdiction Code lookup item
 */
export interface DonorInterdictionCode {
  donorInterdictionCode: string;
  codeMeaning?: string;
}

/**
 * Other Holds data model
 * Matches backend OtherHoldsResultDto from API
 */
export interface OtherHold {
  interCode?: string;                    // InterCode - Hold Code
  interDesc?: string;                    // InterDesc - Description
  originatedFrom?: string;               // OriginatedFrom - Origin
  reasonCode?: string;                   // ReasonCode - Reason Code
  effDate?: string | Date | null;       // EffDate - Effective Date
  termDate?: string | Date | null;      // TermDate - Termination Date
}

/**
 * Multi-select dialog data
 */
export interface MultiSelectInterdictionsDialogData {
  mode: 'AND' | 'OR';
  selectedCodes?: string[];
  selectedInterType?: { code: string; description: string };
  availableInterdictionTypes?: { code: string; description: string }[];
}

/**
 * Multi-select dialog result
 */
export interface MultiSelectInterdictionsDialogResult {
  success: boolean;
  selectedInterdictions?: SelectableInterdiction[];
  logicalOperation?: 'AND' | 'OR';
  selectedCodes?: string[];
  selectedInterType?: { code: string; description: string };
  displayString?: string;
}

/**
 * Filter form for query section (multi-select dialog)
 */
export interface InterdictionFilterForm {
  interdictionType: string | null;
  description: string | null;
  logicalOperation: 'AND' | 'OR';
}

/**
 * Selectable interdiction row for multi-select table
 */
export interface SelectableInterdiction {
  selected: boolean;
  interdictionCode: string;
  description: string;
  effectiveDate: string;
  terminationDate: string;
}

/**
 * Other Holds dialog data
 */
export interface OtherHoldsDialogData {
  unitId: string;
}

/**
 * Query Parameters for Retrieve action
 */
export interface InterdictionQueryParams {
  option: 'Interdiction' | 'Hold';
  code: string;
  fromCollectionDate?: string;
  toCollectionDate?: string;
}

/**
 * Donation Record (Donations Tab)
 */
export interface DonationRecord {
  transactionId: string;      // Transaction ID for querying other holds
  unitId: string;
  collectionDate: string;
  driveId?: string;
  donationType: string;
  procedureCode: string;
  interdiction: string;
  effectiveDate: string;
  terminationDate: string;
  releaseDate?: string;
  releaseUser?: string;
  origin: string;
  reason: string;
  // Expandable row details
  interdictionType: string;
  interdictionCustody: string;
  donorId: string;
  name: string;
  dateOfBirth: string;
  gender: string;
}

/**
 * Donor Record (Donors Tab) - Used by parent shared query panel
 */
export interface DonorRecord {
  transactionId: string;      // Transaction ID for querying other holds
  unitId: string;
  collectionDate: string;
  driveId: string;
  effectiveDate: string;
  terminationDate: string;
}

/**
 * Flat API response item for Donor tab query.
 * Each record represents one donor-interdiction combination.
 * Frontend groups by donorId to build left panel list + right panel details.
 */
export interface DonorQueryResultItem {
  donorId: string;
  lastName: string;
  firstName: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  internationalAddress: string;
  phoneHome: string;
  phoneBusiness: string;
  email: string;
  interCode: string;
  origin: string;
  reason: string;
  effectiveDate: string;
  terminationDate: string;
  mode: string;
  gpValue: string;
}

/**
 * Grouped donor for left panel list
 */
export interface DonorListItem {
  donorId: string;
  lastName: string;
  firstName: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  internationalAddress: string;
  phoneHome: string;
  phoneBusiness: string;
  email: string;
  intlHomePhone: string;
  intlWorkPhone: string;
  interdictions: DonorInterdictionRow[];
}

/**
 * Interdiction detail row for right panel table
 */
export interface DonorInterdictionRow {
  interCode: string;
  origin: string;
  reason: string;
  effectiveDate: string;
  terminationDate: string;
  mode: string;
  gpValue: string;
}

/**
 * Filter values for Donations tab
 */
export interface DonationsFilterValue {
  donationType: string | null;
  showReleased: boolean | null;
  effectivePeriod: string | null;
  effectiveDate: Date | null;
  terminationPeriod: string | null;
  terminationDate: Date | null;
  unitId?: string | null;
}

/**
 * Filter values for Donors tab
 * Based on Oracle Forms DPQUTINT - simpler than Donations filter
 */
export interface DonorsFilterValue {
  showTerminated: boolean;
  sex: string;
}
