/**
 * Donor Attributes (DPWPROPR) - Models
 * Manages donor interdiction properties/attributes
 */

/**
 * Donor demographics for header display
 */
export interface DonorDemographics {
  donorId: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: string;
  ssn?: string;
  bloodType?: string;
  gender: string;
}

/**
 * Donor Interdiction (Property/Attribute)
 * Maps to DONOR_INTERDICTIONS table
 */
export interface DonorInterdiction {
  donorId: string;
  interCode: string;
  interDesc?: string;
  effDate: string;
  chapterId: string;
  interType?: string;
  termDate?: string | null;
  releaseDate?: string | null;
  insertUser?: string;
  insertDate?: string;
  programId?: string;
  isActive?: boolean;
  auditKey?: number | null;
  // UI-only fields
  isNew?: boolean;
  isEditing?: boolean;
  originalEffDate?: string;
}

export interface BulkUpsertRecord {
  auditKey: number | null;
  interCode: string;
  effDate: string;
  termDate: string | null;
  interType: string | null;
}

export interface BulkUpsertRequest {
  records: BulkUpsertRecord[];
}

export interface BulkUpsertError {
  recordIndex: number;
  donorId: string;
  interCode: string;
  errorMessage: string;
}

export interface BulkUpsertResponse {
  totalRecords: number;
  createdCount: number;
  updatedCount: number;
  failureCount: number;
  successCount: number;
  errors: BulkUpsertError[];
  success: boolean;
  message: string | null;
  errorCode: string | null;
}

/**
 * Property lookup item (from interdiction master)
 */
export interface PropertyLookup {
  interCode: string;
  interDesc: string;
  interType?: string;
  viewLevel?: number;
  accessClass?: string;
}

/**
 * User access information for filtering properties
 */
export interface UserAccessInfo {
  accessClass: string;
  interLevel: number;
  validAccessClasses: string[];
}

/**
 * Request to add a new donor attribute
 */
export interface AddDonorAttributeRequest {
  donorId: string;
  interCode: string;
  effDate: string;
  chapterId: string;
  interType?: string;
  loggedInUserName?: string;
  warehouseId?: string;
  warehouseName?: string;
}

/**
 * Request to update an existing donor attribute
 */
export interface UpdateDonorAttributeRequest {
  donorId: string;
  interCode: string;
  effDate: string;
  termDate?: string | null;
  chapterId: string;
  interType?: string;
  loggedInUserName?: string;
  warehouseId?: string;
  warehouseName?: string;
}

/**
 * Request to terminate a donor attribute
 */
export interface TerminateDonorAttributeRequest {
  donorId: string;
  interCode: string;
  effDate: string;
  termDate: string;
  releaseDate: string;
  loggedInUserName?: string;
  chapterId: string;
  warehouseId?: string;
  warehouseName?: string;
}

/**
 * API Response wrapper
 */
export interface DonorAttributeResponse<T = any> {
  success: boolean;
  message: string;
  statusCode: number;
  data: T;
  item?: T;
  error?: string | null;
  errorCode?: string | null;
  total?: number | null;
  hasOtherAttributes?: boolean;
  errorResponse?: {
    errorCode: string | null;
    error: string | null;
  };
}

export interface AttributesWithFlag {
  attributes: DonorInterdiction[];
  hasOtherAttributes: boolean;
}

/**
 * Configuration for multi-chapter support
 */
export interface MultiChapterConfig {
  isMultiChapter: boolean;
  defaultChapterId: string;
}

/**
 * Access validation result
 */
export interface AccessValidationResult {
  hasAccess: boolean;
  reason?: string;
  errorCode?: string;
}
