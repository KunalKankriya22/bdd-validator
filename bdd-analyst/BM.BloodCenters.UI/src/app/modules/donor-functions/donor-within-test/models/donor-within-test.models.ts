/**
 * Models and interfaces for Donor Within Test (DPWDNTST)
 * Donation History - Test Results Dialog
 */

/**
 * Dialog input data
 */
export interface DonorWithinTestDialogData {
  donorId: string;
  donorName: string;
  dob: string;
  sex: string;
  abo: string;
  accessLevel?: string;
}

/**
 * Donor header info from backend (ABO as description, not code)
 */
export interface DonorWithinTestHeaderDto {
  name: string;
  dateOfBirth: string | null;
  sex: string | null;
  abo: string | null;
}

/**
 * Access level response from GET /donor-within-test/access-level
 */
export interface AccessLevelResponse {
  accessLevel: number;
}

/**
 * Donation record returned from API
 */
export interface DonationRecordDto {
  unitId: string;
  displayUnitId: string;
  collDate: string;
  donorId: string;
}

/**
 * Test result returned from API
 */
export interface TestResultDto {
  testId: string;
  resultCode: string | null;
  reactive: string | null;
  testType: string | null;
  absorbance: string | null;
}

/**
 * Wrapper for test results response including visibility flags
 */
export interface TestResultsResponse {
  data: TestResultDto[];
  hasHiddenTests: boolean;
  hasValidTests: boolean;
}

/**
 * Confirmatory test returned from API
 */
export interface ConfirmatoryTestDto {
  unitId: string;
  collDate: string;
  testId: string;
  testDesc: string | null;
  resultCode: string | null;
  chapterId: string;
  testType: string | null;
}

/**
 * API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errorCode?: string | null;
}

/**
 * Pagination parameters for donations query
 */
export interface DonationQueryParams {
  take?: number;
  skip?: number;
  sortOrder?: string;
}
