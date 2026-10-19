/**
 * Model for Find Donor Block (Program Rules)
 */

/**
 * API Response from GET /configure-find-donor-program
 */
export interface ProgramRuleApiResponse {
  programId: string;
  programName: string;
  allowCreate: string; // "Y" or "N"
  gradingLevel: string;
  allowNew?: string; // "Y", "N", or "O" (Optional)
  allowSelect?: string; // "Y", "N", or "O" (Optional)
  allowHold?: string; // "Y", "N", or "O" (Optional)
  selectAllowedLevels?: string;
  newAllowedLevel?: string;
  selectAllowedMultilevel?: string;
  flag1?: string; // "Y" or "N"
  flag2?: string; // "Y" or "N"
  flag3?: string; // "Y" or "N"
  flag4?: string; // "Y" or "N"
  multipleSelection?: string;
  updateKeyInfo?: string;
  enforcePassword?: string; // "Y", "N", or "O"
  effDate?: string;
}

/**
 * Main model for Program Rule record (UI Model)
 */
export interface FindDonorBlockModel {
  programName: string;
  createNewDonor: boolean;
  gradeLevel: string;
  newAllowed: boolean | string; // Can be boolean or "Optional"
  newAllowedGrade: string;
  selectAllowed: boolean | string; // Can be boolean or "Optional"
  selectAllowedGrade: string;
  selectMultipleGrade: string | number;
  holdAllowed: boolean | string; // Can be boolean or "Optional"
  flag1?: string | boolean;
  flag2?: string | boolean;
  flag3?: string | boolean;
  flag4?: string | boolean;
  lastModifiedDate?: string;
  lastModifiedBy?: string;
  multipleSelection?: string;
  updateKeyInfo?: string;
  enforcePassword?: string;
}

/**
 * DTO for adding new program rule (API Request)
 */
export interface AddProgramRuleDto {
  programName: string;
  allowCreate: string; // "Y" or "N"
  multipleSelection?: string; // "Y" or "N"
  gradingLevel: string;
  updateKeyInfo?: string; // "Y" or "N"
  allowNew?: string; // "Y", "N", or "O"
  allowSelect?: string; // "Y", "N", or "O"
  allowHold?: string; // "Y", "N", or "O"
  flag1?: string; // "Y" or "N"
  flag2?: string; // "Y" or "N"
  flag3?: string; // "Y" or "N"
  flag4?: string; // "Y" or "N"
  selectAllowedLevels?: string;
  newAllowedLevel?: string;
  selectAllowedMultilevel?: string;
  enforcePassword?: string; // "Y", "N", or "O"
}

/**
 * DTO for updating program rule (API Request)
 */
export interface UpdateProgramRuleDto {
  programName?: string;
  allowCreate?: string; // "Y" or "N"
  multipleSelection?: string | null;
  gradingLevel?: string;
  updateKeyInfo?: string | null;
  allowNew?: string | null; // "Y", "N", or "O"
  allowSelect?: string | null; // "Y", "N", or "O"
  allowHold?: string | null; // "Y", "N", or "O"
  flag1?: string | null; // "Y" or "N"
  flag2?: string | null; // "Y" or "N"
  flag3?: string | null; // "Y" or "N"
  flag4?: string | null; // "Y" or "N"
  selectAllowedLevels?: string | null;
  newAllowedLevel?: string | null;
  selectAllowedMultilevel?: string | null;
  enforcePassword?: string | null; // "Y", "N", or "O"
}

/**
 * Filter values for program rules
 */
export interface ProgramRuleFilterValue {
  programName?: string | null;
  createNewDonor?: boolean | null;
  newAllowed?: boolean | null;
  selectAllowed?: boolean | null;
  holdAllowed?: boolean | null;
}

/**
 * Filter LOV (List of Values) for dropdowns
 */
export interface ProgramRuleFilterLov {
  programNames?: Array<{ key: string; value: string }>;
}

/**
 * Add dropdown LOV
 */
export interface ProgramRuleAddDropdownLov {
  gradeLevels?: Array<{ key: string; value: string }>;
}

/**
 * Form data structure
 */
export interface ProgramRuleFormData {
  programName: string;
  createNewDonor: boolean;
  gradeLevel: string;
  newAllowed: boolean;
  newAllowedGrade: string;
  selectAllowed: boolean;
  selectAllowedGrade: string;
  selectMultipleGrade: boolean;
  holdAllowed: boolean;
  flag1?: string;
  flag2?: string;
  flag3?: string;
  flag4?: string;
}

/**
 * Field Configuration for a program rule
 */
export interface FieldConfiguration {
  programName: string;
  createNewDonor: boolean;
  gradeLevel: string;
  newAllowed: boolean;
  newAllowedGrade: string;
  selectAllowed: boolean;
  selectAllowedGrade: string;
  selectMultipleGrade: boolean;
  holdAllowed: boolean;
  flag1?: string;
  flag2?: string;
  flag3?: string;
  flag4?: string;
  lastModifiedDate?: string;
  lastModifiedBy?: string;
}

/**
 * Field Configuration API Response
 */
export interface FieldConfigurationApiResponse {
  programId: string;
  programName: string;
  fieldName: string;
  required: string; // "Y" or "N"
  noOfEntries: number;
  functionCheck: string; // "Y" or "N"
  protectedEntry?: string; // "Y" or "N"
  effDate?: string;
}

/**
 * Field Configuration Entry Model (UI Model)
 */
export interface FieldConfigurationEntry {
  fieldName: string;
  required: boolean;
  numberOfEntries: number;
  functionCheck: boolean;
  protectedEntry: boolean;
}

/**
 * Field Configuration Entry Row (for table with edit mode)
 */
export interface FieldConfigurationRow extends FieldConfigurationEntry {
  isEditMode?: boolean;
  isNewRow?: boolean;
  isDeleting?: boolean;
  originalFieldName?: string; // Store original field name for updates
  fieldNameTouched?: boolean; // Track if field name has been touched
  numberOfEntriesTouched?: boolean; // Track if number of entries has been touched
}

/**
 * Field Configuration Add/Update DTO (API Request)
 */
export interface FieldConfigurationDto {
  fieldName: string;
  required: string; // "Y" or "N"
  noOfEntries: number;
  functionCheck: string; // "Y" or "N"
  protectedEntry?: string; // "Y" or "N"
}

/**
 * Program ID option from GET /api/v1/system-users/program-ids
 */
export interface ProgramIdOption {
  programId: string;
  applId: string;
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data: T;
  total: number;
  error: any;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  totalRecords: number;
}
