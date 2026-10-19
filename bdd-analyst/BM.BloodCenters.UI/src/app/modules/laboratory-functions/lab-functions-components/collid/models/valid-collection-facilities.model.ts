/**
 * Valid Collection Facilities - TypeScript Interfaces and DTOs
 * Generated from API Documentation: valid-collection-facilities-api-documentation.md
 * JIRA Ticket: MLT-12657
 * Mnemonic: COLLID
 */

// ============================================================================
// Response DTOs
// ============================================================================

/**
 * Main entity DTO returned by GET and POST (list) endpoints
 */
export interface ValidCollectionFacilityDto {
  chapterId: string; // Max 4 chars
  contractId: string; // Max 9 chars
  collId: string; // Exactly 5 chars
  collName: string; // Max 101 chars (validated at 100)
  collIdHead: string | null; // Max 40 chars
  intFlag: string; // 'Y' or 'N'
  collAddress1: string | null; // Max 40 chars
  collAddress2: string | null; // Max 40 chars
  collAddress3: string | null; // Max 40 chars
  city: string; // Max 75 chars
  state: string; // Max 5 chars
  stateCode: string | null; // Max 20 chars (state description)
  zip: string | null; // Max 15 chars
  country: string | null; // Max 15 chars
  intPhoneNumber: string | null; // Max 15 chars
  registrationNo: string; // Max 40 chars
  licenceNo: string; // Max 40 chars
  licenceAddress1: string | null; // Max 40 chars
  licenceAddress2: string | null; // Max 40 chars
  licenceAddress3: string | null; // Max 40 chars
  licenceCity: string; // Max 75 chars
  licenceState: string; // Max 5 chars
  licenceZip: string | null; // Max 15 chars
  licenceCountry: string | null; // Max 15 chars
  phoneNo: string | null; // Max 13 chars
  faxNo: string | null; // Max 15 chars
  effDate: string; // ISO DateTime
  termDate: string | null; // ISO DateTime (nullable)
  lastModifiedDate: string | null; // ISO DateTime (nullable)
  contractType: string | null; // Max 2 chars
  contractName: string | null; // Max 300 chars
}

/**
 * API Response wrapper for single record
 */
export interface ValidCollectionFacilityResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: ValidCollectionFacilityDto;
}

/**
 * API Response wrapper for list/paginated results
 */
export interface ValidCollectionFacilitiesListResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: ValidCollectionFacilityDto[];
  totalCount: number;
}

// ============================================================================
// Request DTOs
// ============================================================================

/**
 * Query DTO for POST /valid-collection-facilities/{take}/{skip}
 */
export interface ValidCollectionFacilityQueryDto {
  chapterId?: string; // Filter by chapter ID
  contractId?: string; // Filter by contract ID
  collId?: string; // Filter by collection ID
  state?: string; // Filter by state code
  city?: string; // Filter by city (partial match)
  fromDate?: string; // Filter from effective date (YYYY-MM-DD)
  toDate?: string; // Filter to effective date (YYYY-MM-DD)
  searchKeyword?: string; // Search across name, city, state fields
  sortColumn?: string; // Column to sort by (CollId, CollName, City, State, EffDate)
  sortOrder?: 'ASC' | 'DESC'; // Sort order
}

/**
 * Create DTO for POST /valid-collection-facilities
 */
export interface CreateValidCollectionFacilityRequestDto {
  chapterId: string; // Required, max 4 chars
  contractId: string; // Required, max 9 chars, must exist
  collId: string; // Required, exactly 5 chars, not all numeric
  collName: string; // Required, max 100 chars (when no pipe)
  collIdHead?: string | null; // Optional, max 40 chars
  intFlag?: string; // Optional, 'Y' or 'N'
  collAddress1?: string | null; // Optional, max 40 chars
  collAddress2?: string | null; // Optional, max 40 chars
  collAddress3?: string | null; // Optional, max 40 chars
  city: string; // Required, max 75 chars
  state: string; // Required, max 5 chars, must exist in MASTER_CODES
  zip?: string | null; // Optional, max 15 chars
  country?: string | null; // Optional, max 15 chars
  intPhoneNumber?: string | null; // Optional, max 15 chars
  registrationNo: string; // Required, max 40 chars
  licenceNo: string; // Required, max 40 chars
  licenceAddress1?: string | null; // Optional, max 40 chars
  licenceAddress2?: string | null; // Optional, max 40 chars
  licenceAddress3?: string | null; // Optional, max 40 chars
  licenceCity: string; // Required, max 75 chars
  licenceState: string; // Required, max 5 chars
  licenceZip?: string | null; // Optional, max 15 chars
  licenceCountry?: string | null; // Optional, max 15 chars
  phoneNo?: string | null; // Optional, max 13 chars
  faxNo?: string | null; // Optional, max 15 chars
  effDate: string; // Required, cannot be in past for new records (YYYY-MM-DD)
  termDate?: string | null; // Optional, must be >= effDate (YYYY-MM-DD)
}

/**
 * Update DTO for PUT /valid-collection-facilities/{chapterId}/{contractId}/{collId}
 */
export interface UpdateValidCollectionFacilityRequestDto {
  collName: string; // Max 100 chars
  collIdHead?: string | null; // Max 40 chars
  intFlag?: string; // 'Y' or 'N'
  collAddress1?: string | null; // Max 40 chars
  collAddress2?: string | null; // Max 40 chars
  collAddress3?: string | null; // Max 40 chars
  city: string; // Max 75 chars
  state: string; // Max 5 chars
  zip?: string | null; // Max 15 chars
  country?: string | null; // Max 15 chars
  intPhoneNumber?: string | null; // Max 15 chars
  registrationNo: string; // Max 40 chars
  licenceNo: string; // Max 40 chars
  licenceAddress1?: string | null; // Max 40 chars
  licenceAddress2?: string | null; // Max 40 chars
  licenceAddress3?: string | null; // Max 40 chars
  licenceCity: string; // Max 75 chars
  licenceState: string; // Max 5 chars
  licenceZip?: string | null; // Max 15 chars
  licenceCountry?: string | null; // Max 15 chars
  phoneNo?: string | null; // Max 13 chars
  faxNo?: string | null; // Max 15 chars
  effDate: string; // YYYY-MM-DD
  termDate?: string | null; // YYYY-MM-DD
}

/**
 * Create response DTO
 */
export interface CreateValidCollectionFacilityResponseDto {
  success: boolean;
  message: string;
  statusCode: number;
  data: Array<{
    chapterId: string;
    contractId: string;
    collId: string;
  }>;
}

/**
 * Standard update/delete response
 */
export interface StandardApiResponse {
  success: boolean;
  message: string;
  statusCode: number;
}

// ============================================================================
// Error Response DTOs
// ============================================================================

/**
 * API Error Response structure
 */
export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  errorCode?: string;
  errorResponse?: {
    errorCode: string;
    error: string;
  };
  message?: string;
}

/**
 * Known error codes from API documentation
 */
export enum ValidCollectionFacilityErrorCode {
  CONTRACT_NOT_FOUND = '1147', // Contract not found or is inactive
  INVALID_STATE = '5008', // Invalid state code
  EFFECTIVE_DATE_PAST = '8044', // Effective date cannot be in the past
  TERM_DATE_INVALID = '8045', // Term date must be >= effective date
  COLL_ID_ALL_NUMERIC = '9712', // Collection ID must not be all numeric
  FIELD_LENGTH_EXCEEDED = '0109', // Field length exceeds maximum (100 characters)
}

// ============================================================================
// UI-specific Models
// ============================================================================

/**
 * Dropdown option interface for Contract selection
 */
export interface ContractOption {
  contractId: string;
  contractName: string;
  contractType: string;
  contractTypeDesc: string;
}

/**
 * Dropdown option interface for Collection ID selection
 */
export interface CollectionIdOption {
  collId: string;
  collName: string;
}

/**
 * Dropdown option interface for State selection
 */
export interface StateOption {
  code: string;
  description: string;
}

export interface CountryOption {
  code: string;
  description: string;
}

/**
 * Association Warning Dialog Data
 * Used when a Collection ID is associated with other contracts
 */
export interface AssociationWarningData {
  collId: string;
  associations: Array<{
    contractId: string;
    companyName: string;
  }>;
}

/**
 * Form model for component internal state
 */
export interface CollectionFacilityFormModel {
  // Search filters
  contractId: string;
  contractType: string; // Readonly, auto-populated
  collId: string;

  // Collection Details
  collName: string;
  collIdHead: string;

  // Collection Contact Information
  international: boolean;
  collAddress1: string;
  collAddress2: string;
  collAddress3: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  intPhoneNumber: string;

  // License Details
  registrationNo: string;
  licenceNo: string;
  licenceAddress1: string;
  licenceAddress2: string;
  licenceAddress3: string;
  licenceCity: string;
  licenceState: string;
  licenceZip: string;
  licenceCountry: string;
  phoneNo: string;
  faxNo: string;
  effDate: Date | null;
  termDate: Date | null;
}
