/**
 * TypeScript models for Donor RBC Antigen Query
 * Generated from API Documentation: MLT-10945
 * Base URL: /api/donor-rbc-ag-query
 */

/**
 * Main response object containing donor information and all antigen test data
 */
export interface DonorRbcAgQueryDto {
  donorId: string;
  fullName: string | null;
  dateOfBirth: string | null;
  bloodType: string | null;
  gender: string | null;
  ethnicGroup: string | null;
  ethnicGroupDescription: string | null;
  genotype: string | null;
  cmvResult: string | null;
  hgbSResult: string | null;
  antigenTests: AntigenTestHeaderDto[];
}

/**
 * Antigen test header containing result and confirmation information
 */
export interface AntigenTestHeaderDto {
  donorId: string;
  antigenCode: string;
  resultCode: string | null;
  confirmFlag: string | null;
  confirmDate: string | null;
  primaryRuleId: number | null;
  resultPending: number;
  serologicalTests: AntigenTestDetailDto[];
  molecularTests: AntigenTestDetailDto[];
  rules: AntigenRuleDto[];
  insertDate: string;
  insertUser: string;
  programId: string | null;
}

/**
 * Detailed test information for serological or molecular tests
 */
export interface AntigenTestDetailDto {
  donorId: string;
  antigenCode: string;
  testType: string;
  testSeqNo: number;
  unitId: string | null;
  testId: string | null;
  collDate: string | null;
  testResult: string | null;
  confirmStatus: string | null;
  licensedFlag: string | null;
  excludeFlag: string | null;
  testDate: string | null;
  insertDate: string;
  insertUser: string;
  programId: string | null;
}

/**
 * Configuration rule defining test requirements
 */
export interface AntigenRuleDto {
  primaryRuleId: number;
  antigenCode: string;
  ruleId: number;
  testType: string | null;
  testId: string | null;
  licApproveFlag: string | null;
  noOfTests: number | null;
  effDate: string | null;
  termDate: string | null;
  insertDate: string;
  insertUser: string;
  programId: string | null;
  auditKey: number;
}

/**
 * API response wrapper for donor RBC antigen query
 */
export interface DonorRbcAgQueryResponse {
  success: boolean;
  statusCode: number;
  message: string;
  item: DonorRbcAgQueryDto;
}

/**
 * Update genotype request DTO
 * PUT /api/v1/donor-rbc-ag-query/genotype
 */
export interface UpdateGenotypeDto {
  donorId: string;
  genoType: string;
}

/**
 * Update genotype response DTO
 */
export interface UpdateGenotypeResponse {
  success: boolean;
  item: boolean;
  message: string;
  statusCode: number;
}

/**
 * Update exclude flag request DTO
 * PUT /api/v1/donor-rbc-ag-query/exclude-flag
 */
export interface UpdateExcludeFlagDto {
  donorId: string;
  antigenCode: string;
  unitId: string;
  testId: string;
  testType: string;
  testSeqNo: number;
  excludeFlag: 'Y' | 'N';
}

/**
 * Update exclude flag response DTO
 */
export interface UpdateExcludeFlagResponse {
  success: boolean;
  item: boolean;
  message: string;
  statusCode: number;
}

/**
 * Exclude units DTO
 * TODO: API endpoint not documented - add once available
 */
export interface ExcludeUnitsDto {
  donorId: string;
  antigenCode: string;
  serologicalTestsToExclude: TestExclusionItem[];
  molecularTestsToExclude: TestExclusionItem[];
  loggedInUserName?: string;
  chapterId?: string;
  warehouseId?: string;
  warehouseName?: string;
}

/**
 * Test exclusion item
 */
export interface TestExclusionItem {
  unitId: string;
  testSeqNo: number;
  excludeFlag: 'Y' | 'N';
}

/**
 * API response wrapper for check-access
 */
export interface CheckAccessResponse {
  success: boolean;
  statusCode: number;
  message: string;
  item: boolean;
}

/**
 * CMV/HbS test item
 */
export interface CmvHbsItemDto {
  unitId: string;
  testId: string;
  resultCode: string | null;
  parameterCode?: string;
  parameterValue?: string;
}

/**
 * API response wrapper for CMV and HbS
 */
export interface CmvHbsResponse {
  success: boolean;
  statusCode: number;
  message: string;
  item: CmvHbsItemDto[];
}

/**
 * Result code display mapping
 */
export const RESULT_CODE_DISPLAY: Record<string, { label: string; color: string; icon?: string }> = {
  '+': { label: 'POS', color: 'success', icon: 'add_circle' },
  '-': { label: 'NEG', color: 'default', icon: 'remove_circle' },
  '?': { label: 'DIS', color: 'warn', icon: 'warning' },
  'D': { label: 'DIS', color: 'warn', icon: 'warning' }
};

/**
 * Confirm flag display mapping
 */
export const CONFIRM_FLAG_DISPLAY: Record<string, { label: string; icon: string }> = {
  'Y': { label: 'Yes', icon: 'check_circle' },
  'N': { label: 'No', icon: 'cancel' }
};

/**
 * Test type display mapping
 */
export const TEST_TYPE_DISPLAY: Record<string, string> = {
  'SER': 'Serological',
  'MOL': 'Molecular'
};

/**
 * Licensed flag display mapping
 */
export const LICENSED_FLAG_DISPLAY: Record<string, string> = {
  'L': 'Licensed',
  'U': 'Unlicensed',
  'A': 'Approved'
};
