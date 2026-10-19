/**
 * Contract Profile Test Query - Data Models
 *
 * JIRA: MLT-13695
 * FMB File: rgqtests
 * Mnemonic: RGPROFQ
 *
 * Technical Documentation:
 * BM.BloodCenters.API/Src/BM.BloodCenters.API/RGQTESTS_FMB_Technical_Analysis.md
 *
 * These interfaces map to DTOs from the API:
 * BM.BloodCenters.API/Src/BM.BloodCenters.API/Modules/LaboratoryQueries/DTOs/
 *
 * Database Tables Referenced:
 * - CONTRACTS: Contract master data
 * - RGT_CONTRACT_CHAPTERS: Chapter-to-contract mapping (security)
 * - RGT_CONTRACT_PROFILE: Profile set definitions
 * - CONTRACT_TESTS_IMAGE: Active contract test configurations
 * - VALID_TESTS: Test master data
 */

/**
 * Contract lookup option for searchable dropdown
 * Maps to ContractLookupDto from API
 */
export interface ContractOption {
  contractId: string;
  company: string;
  centerId?: string;
}

/**
 * Profile Set lookup option for searchable dropdown
 * Maps to ProfileSetLookupDto from API
 */
export interface ProfileSetOption {
  profileSetId: string;
  profileDesc?: string;  // Primary, Secondary, or Confirmatory
  maxProfileSeqNo?: number;
}

/**
 * Profile Set validation response
 * Maps to ValidateProfileSetResponseDto from API
 */
export interface ProfileSetValidationResult {
  isValid: boolean;
  profileDesc?: string;
  maxProfileSeqNo?: number;
  errorCode?: string;
  errorMessage?: string;
}

/**
 * Contract Profile Test record for display in table
 * Maps to ContractProfileTestDto from API
 */
export interface ContractProfileTest {
  testId: string;
  testDesc?: string;
  profileSeqNo: number;
  effDate?: string;
  termDate?: string;
  stopLabelFlag?: string;
  isActiveProfile: boolean;
}

/**
 * Request DTO for querying contract profile tests
 * Maps to ContractProfileTestQueryDto from API
 */
export interface ContractProfileTestQueryRequest {
  contractId: string;
  profileSetId: string;
  profileSeqNo?: number | null;
  take: number;
  skip: number;
  sortColumn?: string;
  sortDirection?: string;
}

/**
 * API response wrapper for contract profile tests
 */
export interface ContractProfileTestQueryResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: ContractProfileTest[];
  totalCount: number;
}

/**
 * API response wrapper for contract lookup
 */
export interface ContractLookupResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: ContractOption[];
}

/**
 * API response wrapper for profile set lookup
 */
export interface ProfileSetLookupResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: ProfileSetOption[];
}

/**
 * Request DTO for profile set validation
 */
export interface ValidateProfileSetRequest {
  contractId: string;
  profileSetId: string;
}

/**
 * API response wrapper for profile set validation
 */
export interface ValidateProfileSetResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: ProfileSetValidationResult;
}
