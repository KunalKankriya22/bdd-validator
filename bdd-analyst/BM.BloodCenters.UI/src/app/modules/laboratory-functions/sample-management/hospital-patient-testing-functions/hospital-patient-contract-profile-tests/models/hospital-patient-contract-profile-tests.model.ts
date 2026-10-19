import { Moment } from 'moment';

// ============================================================================
// API RESPONSE MODELS (Match Backend DTOs)
// ============================================================================

/**
 * Standard API response wrapper
 */
export interface ReturnResult<T> {
  success: boolean;
  data?: T[];
  item?: T;
  total?: number;
  message: string;
  statusCode: number;
}

/**
 * Contract Test response from API
 * Maps to ContractTest C# model
 */
export interface ContractTest {
  contractId: string;
  chapterId: string;
  testId: string;
  profileSetId: string;
  testDesc: string | null;
  stopLabelFlag: 'Y' | 'N';
  effDate: string; // ISO 8601 format from backend
  termDate: string | null; // ISO 8601 format from backend
  lastModifiedDate: string; // ISO 8601 format from backend
  programId: string;
}

/**
 * Test dropdown item
 * Maps to TestDropdownDto C# model
 */
export interface TestDropdownDto {
  testId: string;
  testDesc: string;
  testGroup: string | null;
}

/**
 * Contract dropdown item (simple)
 * Maps to ContractDropdownDto C# model
 * Used by GET /missing-tubes-query/contracts
 */
export interface ContractDropdownDto {
  contractId: string;
  company: string;
}

/**
 * Contract lookup item (with details)
 * Maps to ContractLookupDto C# model
 * Used by GET /regional-tubes/contracts
 */
export interface ContractLookupDto {
  contractId: string;
  company: string | null;
  centerId: string | null;
  noOfDuplicates: number | null;
  effDate: string | null; // ISO 8601
  termDate: string | null; // ISO 8601
}

// ============================================================================
// REQUEST MODELS (Sent to Backend)
// ============================================================================

/**
 * Query parameters for paginated search
 * Maps to ContractTestQueryDto C# model
 */
export interface ContractTestQueryDto {
  take?: number;
  skip?: number;
  chapterId?: string; // Auto-populated by backend
  chapterLocalDate?: string; // Auto-populated by backend
  testId?: string;
  stopLabelFlag?: 'Y' | 'N';
  searchKeyword?: string;
  sortColumn?: 'TestId' | 'EffDate' | 'TermDate';
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * Create contract test request
 * Maps to CreateContractTestRequestDto C# model
 */
export interface CreateContractTestRequest {
  contractId: string;
  testId: string;
  stopLabelFlag: 'Y' | 'N';
  effDate: string; // ISO 8601 format
  termDate?: string; // ISO 8601 format
}

/**
 * Update contract test request
 * Maps to UpdateContractTestRequestDto C# model
 * Note: contractId and testId are immutable after creation
 */
export interface UpdateContractTestRequest {
  stopLabelFlag: 'Y' | 'N';
  effDate: string; // ISO 8601 format
  termDate?: string; // ISO 8601 format
}

// ============================================================================
// FRONTEND MODELS (UI Display & Forms)
// ============================================================================

/**
 * Table model for displaying contract profile tests
 */
export interface ContractProfileTestTableModel {
  contractId: string;
  chapterId: string;
  testId: string;
  profileSetId: string;
  testDesc: string;
  stopLabelFlag: 'Y' | 'N';
  effDate: string; // DD-MMM-YYYY format for display
  termDate: string | null; // DD-MMM-YYYY format for display
  lastModifiedDate: string; // DD-MMM-YYYY format for display
  programId: string;
}

/**
 * Form value model for add/edit panel
 */
export interface ContractProfileTestFormValue {
  testId: string;
  testDesc: string;
  stopLabelFlag: 'Y' | 'N' | null;
  effDate: Moment | null;
  termDate: Moment | null;
}

// ============================================================================
// LOOKUP MODELS
// ============================================================================

/**
 * Generic lookup model
 */
export interface LookUp {
  key: string;
  value: string;
}

/**
 * Lookup with description
 */
export interface LookUpWithDescription {
  key: string;
  value: string;
  description: string;
}

/**
 * Contract lookup model for UI display
 */
export interface ContractLookup {
  contractId: string;
  description: string; // Maps to 'company' from API
}
