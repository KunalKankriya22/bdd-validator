/**
 * Physical Findings Template Models
 * Based on API Specification for /physical-findings-templates
 */

/**
 * Template status enum matching API specification
 */
export type TemplateStatus = 'ACTIVE' | 'INACTIVE' | 'FUTURE';

/**
 * Main template record from API response
 * Matches GET /{take}/{skip} response data
 */
export interface PhysicalFindingsTemplateModel {
  chapterId: string;
  templateId: string;
  donationType: string;
  donationTypeDescription: string;
  procedureCode: string | null;
  procedureCodeDescription: string | null;
  physicalCode: string;
  physicalCodeDescription: string;
  dataType: string;                    // C, D, N
  boxNumber: number;
  sortSequence: number;
  effDate: Date | string;              // API returns effDate
  termDate: Date | string | null;      // API returns termDate
  status: TemplateStatus;
  programId: string;
  insertDate: Date | string;
  insertUser: string;
  auditKey: number;

  // Aliased properties for component compatibility
  effectiveDate?: Date | string;
  terminationDate?: Date | string | null;
}

/**
 * Physical finding record within a template
 */
export interface PhysicalFindingRecord {
  sequence: number;
  physicalCode: string;
  codeDescription: string;
  boxNumber: number | null;
  dataType?: string;
  effectiveDate?: Date | string;
  terminationDate?: Date | string | null;
  isSelected?: boolean;
  auditKey?: number;
}

/**
 * Available physical code from GET /physical-codes
 */
export interface AvailablePhysicalCode {
  physicalCode: string;
  description: string;
  boxNumber: number | null;
  dataType?: string;
  effectiveDate?: Date | string;
  terminationDate?: Date | string | null;
}

/**
 * DTO for creating a new template
 * Matches POST / request body
 */
export interface CreatePhysicalFindingsTemplateDto {
  donationType: string;                // Required, max 5 chars
  procedureCode: string | null;        // Optional, max 5 chars
  effectiveDate: Date | string;        // Required (mapped to effDate in API)
  terminationDate?: Date | string | null; // Optional (mapped to termDate in API)
  physicalCodes: PhysicalCodeEntry[];  // Required, min 1 item
  resolveOverlaps?: boolean;
}

/**
 * Physical code entry for template creation/update
 */
export interface PhysicalCodeEntry {
  physicalCode: string;               // Required, max 5 chars
  sortSequence: number;               // Optional
  dataType?: string;                  // Optional - C, D, N
  auditKey?: number;                  // Required for update
}

/**
 * DTO for updating termination date (single template)
 * Matches PATCH /{templateId}/term-date request
 */
export interface UpdateTerminationDateDto {
  templateIds: string[];              // Template IDs to update
  donationType: string;
  procedureCode: string | null;
  terminationDate: Date | string;     // mapped to termDate in API
}

/**
 * Item for batch termination date update
 */
export interface BatchTermDateItem {
  templateId: string;
  donationType: string;
  procedureCode: string | null;
  termDate: string;                   // ISO date string format
}

/**
 * DTO for batch updating termination dates
 * Matches PATCH /batch/term-date request
 */
export interface BatchUpdateTerminationDateDto {
  chapterId: string;
  items: BatchTermDateItem[];
}

/**
 * DTO for updating a single template
 * Matches PUT /{templateId} request body
 */
export interface UpdatePhysicalFindingsTemplateDto {
  templateId: string;
  donationType: string;                // Required, max 5 chars
  procedureCode: string | null;        // Optional, max 5 chars
  effectiveDate?: Date | string;       // Included for FUTURE templates (mapped to effDate)
  terminationDate?: Date | string | null; // Optional (mapped to termDate)
  physicalCodes: PhysicalCodeEntry[];  // Optional, with auditKey for update
  resolveOverlaps?: boolean;
}

/**
 * Query parameters for fetching templates
 * Matches POST /{take}/{skip} request body
 */
export interface PhysicalFindingsTemplateQueryParams {
  donationType?: string;
  procedureCode?: string;
  templateId?: string;
  physicalCode?: string;
  status?: TemplateStatus;             // ACTIVE, INACTIVE, FUTURE
  showInactive?: boolean;              // When true, include terminated records
  searchKeyword?: string;              // Maps to searchText in API
  sort?: 'ASC' | 'DESC';               // Maps to sortDirection (ASC/DESC)
  sortColumn?: string;
  effectiveDateBefore?: string;        // ISO date string for filtering effective date before
  effectiveDateAfter?: string;         // ISO date string for filtering effective date after
  terminationDateBefore?: string;      // ISO date string for filtering termination date before
  terminationDateAfter?: string;       // ISO date string for filtering termination date after
}

/**
 * Filter values for the filter panel
 */
export interface PhysicalFindingsTemplateFilterValue {
  showInactive?: boolean;
  donationType: string | null;
  procedureCode: string | null;
  effectiveDatePeriod: string | null;
  effectiveDate: Date | string | null;
  terminationDatePeriod: string | null;
  terminationDate: Date | string | null;
}

/**
 * Dropdown option for LOVs
 */
export interface DropdownOption {
  key: string;                        // description
  value: string;                      // code
}

/**
 * Filter dropdown data from API
 */
export interface PhysicalFindingsTemplateFilterDropdowns {
  donationTypes: DropdownOption[];
  procedureCodes: DropdownOption[];
}

/**
 * Add panel dropdown data from API
 */
export interface PhysicalFindingsTemplateAddDropdowns {
  donationTypes: DropdownOption[];
  procedureCodes?: DropdownOption[];
  physicalCodes?: AvailablePhysicalCode[];
}

/**
 * Template list item for dropdown (LOV)
 * Matches GET /templates response
 */
export interface TemplateListItem {
  templateId: string;
  donationType: string;
  procedureCode: string | null;
  status: TemplateStatus;
  effDate: Date | string;
  termDate: Date | string | null;
}

/**
 * Template details response when retrieving
 * Matches GET /{templateId} response
 */
export interface PhysicalFindingsTemplateDetails {
  success: boolean;
  data: PhysicalFindingsTemplateModel[];
  statusCode: number;
  // Computed/aliased fields for component
  templateId?: string;
  donationType?: string;
  donationTypeDescription?: string;
  procedureCode?: string | null;
  procedureCodeDescription?: string | null;
  effectiveDate?: Date | string;
  terminationDate?: Date | string | null;
  status?: TemplateStatus;
  physicalFindings?: PhysicalFindingRecord[];
}

/**
 * API response wrapper
 * Matches POST /{take}/{skip} response
 */
export interface PhysicalFindingsTemplateResponse {
  success: boolean;
  data: PhysicalFindingsTemplateModel[];
  total: number;
  statusCode: number;
  // Aliased for component compatibility
  totalRecords?: number;
}

/**
 * Physical codes response wrapper
 * Matches GET /physical-codes response
 */
export interface AvailablePhysicalCodesResponse {
  success: boolean;
  data: { code: string; description: string; boxNumber?: number; dataType?: string }[];
  statusCode: number;
}

/**
 * Create template response
 * Matches POST / response
 */
export interface CreateTemplateResponse {
  success: boolean;
  item: PhysicalFindingsTemplateModel;
  message: string;
  statusCode: number;
}

/**
 * Generic update/delete response
 */
export interface ApiActionResponse {
  success: boolean;
  message: string;
  statusCode: number;
}

/**
 * Error response format
 */
export interface ApiErrorResponse {
  success: false;
  errorCode: string;
  error: string;
  message: string;
  statusCode: number;
}
