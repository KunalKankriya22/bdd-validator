/**
 * Special Unit (Link Unit to Special Donation) - TypeScript Models
 * Based on API Reference: SpecialUnit-API-Reference.md
 */

// ========== Request DTOs ==========

/**
 * Query DTO for GET ALL endpoint
 * POST /special-units/{take}/{skip}
 */
export interface SpecialUnitQueryDto {
  patId: string | null;
  surgId: string | null;
  status: 'A' | 'I' | 'B' | null;
  searchKeyword: string | null;
  sortColumn: string | null;
  sortOrder: 'ASC' | 'DESC' | null;
  surgeryDate: string | null;
  surgeryDatePeriod: 'BEFORE' | 'AFTER' | null;
  neededByDate: string | null;
  neededByDatePeriod: 'BEFORE' | 'AFTER' | null;
}

/**
 * Validate Unit Request DTO
 * POST /special-units/validate-unit
 */
export interface ValidateUnitRequestDto {
  unitId: string;
  chapterId: string;
}

/**
 * Validate Scan Unit Request DTO
 * POST /special-units/validate-scan-unit
 */
export interface ValidateScanUnitRequestDto {
  unitId: string;
  patId: string;
  surgId: string;
  seqNo: number;
}

/**
 * Validate Scan Unit Response DTO
 * POST /special-units/validate-scan-unit
 */
export interface ValidateScanUnitResponseDto {
  isRegistered: boolean;
  collectionDate: string | null;
  collectionDateSource: 'DONATIONS' | null;
  donorId: string | null;
  donorName: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  isValid: boolean;
  hasWarnings: boolean;
  warnings: LinkUnitWarning[];
  errorCode: string | null;
  errorMessage: string | null;
}

/**
 * Link Unit Request DTO
 * POST /special-units/link
 */
export interface LinkUnitRequestDto {
  patId: string;
  surgId: string;
  seqNo: number;
  unitId: string;
  collDate: string; // ISO date string
  consigneeId: string | null;
  shipDate: string | null;
  overrideWarnings: boolean;
}

// ========== Response DTOs ==========

/**
 * Main Grid List Item DTO
 * Response from GET ALL
 */
export interface SpecialUnitListItemDto {
  patId: string;
  surgId: string;
  patientName: string; // "LastName, FirstName"
  dob: string; // ISO date string
  sex: string;
  surgeryDate: string; // ISO date string
  dateNeededBy: string; // ISO date string
  shipTo: string;
  status: 'A' | 'I'; // A=Active, I=Inactive
  patTypeDesc?: string;
}

/**
 * Linked Unit DTO
 * Response from GET /special-units/linked-units/{patId}/{surgId}
 */
export interface SpecialUnit {
  patId: string;
  surgId: string;
  seqNo: number;
  chapterId: string;
  unitId: string;
  displayUnitId: string | null;
  collDate: string; // ISO date string
  consigneeId: string | null;
  shipDate: string | null;
  programId: string;
  insertDate: string; // ISO date string
  insertUser: string;
}

/**
 * Directed Donor DTO (for LOV/dropdown)
 * Response from GET /special-units/donors/{patId}/{surgId}
 */
export interface DirectedDonorDto {
  patId: string;
  surgId: string;
  seqNo: number;
  lastName: string;
  firstName: string;
  phone: string | null;
  intlPhone: string | null;
}

/**
 * Directed Donor Detail DTO
 * Response from GET /special-units/donors/{patId}/{surgId}/{seqNo}
 */
export interface DirectedDonorDetailDto {
  patId: string;
  surgId: string;
  seqNo: number;
  lastName: string;
  firstName: string;
  contactAreaCode: string | null;
  contactPhoneNo: string | null;
  intlContactPhoneNo: string | null;
  prodType1: string | null;
  prodType2: string | null;
  prodType3: string | null;
}

/**
 * Validate Unit Response DTO
 * Response from POST /special-units/validate-unit
 */
export interface ValidateUnitResponseDto {
  isRegistered: boolean;
  collectionDate: string | null; // ISO date string, latest date auto-selected
  collectionDateSource: 'DONATIONS' | null;
  hasMultipleDates: boolean;
  availableDates: string[] | null; // ISO date strings
  message: string;
}

/**
 * Donor Demographics DTO
 * Response from GET /special-units/donor-demographics/{unitId}/{collDate}
 */
export interface DonorDemographicsDto {
  donorId: string;
  donorName: string; // "LastName, FirstName"
  lastName: string;
  firstName: string;
  dateOfBirth: string; // ISO date string
  gender: string;
}

/**
 * Link Unit Warning
 */
export interface LinkUnitWarning {
  warningCode: 'SAME_PATIENT_UNIT' | 'DIFFERENT_DONOR_UNIT' | 'DONOR_NOT_ASSOCIATED' | 'UNREGISTERED_UNIT';
  message: string;
}

/**
 * Link Unit Validation Response (for warnings)
 */
export interface LinkUnitValidationResponseDto {
  isValid: boolean;
  hasWarnings: boolean;
  warnings: LinkUnitWarning[];
}

// ========== Generic API Response Wrappers ==========

/**
 * Generic API Response
 */
export interface ReturnResult<T> {
  success: boolean;
  message: string | null;
  error: string | null;
  errorCode: string | null;
  statusCode: number;
  data?: T[]; // For list endpoints
  item?: T; // For single item endpoints
  total?: number; // For paginated endpoints
}

// ========== UI Models (for backward compatibility) ==========

/**
 * Special Donor model for UI
 */
export interface SpecialDonorModel {
  donorNumber: number;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  internationalPhone?: string;
  prodType1?: string;
  prodType2?: string;
  prodType3?: string;
  // Additional fields from donor demographics
  donorId?: string;
  donorName?: string;
  dateOfBirth?: string;
  sex?: string;
  collectionDate?: string;
  status?: 'Collected' | 'Pending';
  unitId?: string;
}

/**
 * Donor Selection model for UI (for dropdown)
 */
export interface DonorSelectionModel {
  donorNumber: number;
  displayName: string;
  firstName: string;
  lastName: string;
}

/**
 * Linked Unit model for UI
 */
export interface LinkedUnitModel {
  unitId: string;
  displayUnitId?: string;
  collectionDate: string;
  seqNo: number;
  consigneeId?: string | null;
  shipDate?: string | null;
}

/**
 * Create Directed Donor Request (UI)
 */
export interface CreateDonorRequest {
  patId: string;
  surgId: string;
  firstName: string;
  lastName: string;
  contactAreaCode?: string | null;
  contactPhoneNo?: string | null;
  intlContactPhoneNo?: string | null;
}

/**
 * Link Unit Request (UI)
 */
export interface LinkUnitRequest {
  patientId: string;
  surgId: string;
  seqNo: number;
  unitId: string;
  collectionDate: string;
  consigneeId?: string | null;
  shipDate?: string | null;
  overrideWarnings?: boolean;
}

/**
 * Unlink Unit Request (UI)
 */
export interface UnlinkUnitRequest {
  patientId: string;
  surgId: string;
  seqNo: number;
  unitId: string;
  collectionDate: string;
}

/**
 * API response for link/unlink operations
 */
export interface LinkUnitResponse {
  success: boolean;
  message: string;
  statusCode: number;
  item?: LinkUnitValidationResponseDto | boolean;
}
