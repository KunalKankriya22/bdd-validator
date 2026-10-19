/**
 * TypeScript models for Unit & Donor Tested Antigen Query (ANTQL)
 * Base URL: /api/v1/unit-tested-antigens
 * Base URL: /api/v1/unit-tested-antigens
 */

/**
 * Request DTO for querying tested antigens
 */
export interface UnitTestedAntigensQueryRequest {
  unitId: string;
}

/**
 * Combined response containing all test results from three data sources
 * Maps to C# DTO: UnitTestedAntigensQueryResponseDto
 */
export interface UnitDonorTestedAntigenResponse {
  unitId: string;
  collectionDate: string | null;
  hasResults: boolean;
  scheduledTests: ScheduledTest[];
  unscheduledTests: UnscheduledTest[];
  donorTests: DonorTest[];
}

/**
 * Scheduled test result from UTRS table
 * Maps to C# DTO: ScheduledTestDto
 */
export interface ScheduledTest {
  testId: string;
  testSeqNo: number | null;
  resultDescription: string;
  resultDateTime: string | null;
  testBatchId: string | null;
  technician: string | null;
  source: string; // Always "Sched"
}

/**
 * Unscheduled test result from UNIT_TEST_BASE table
 * Maps to C# DTO: UnscheduledTestDto
 */
export interface UnscheduledTest {
  testId: string;
  testSeqNo: number | null;
  resultDescription: string;
  resultDateTime: string | null;
  testBatchId: string | null;
  technician: string | null;
  source: string; // Always "Unsched"
}

/**
 * Donor test result from DONOR_TESTED_UNITS table
 * Maps to C# DTO: DonorTestDto
 */
export interface DonorTest {
  testId: string;
  resultDescription: string;
  insertDateTime: string | null;
  isConfirmed: boolean;
  source: string; // Always "Donor"
}

/**
 * Backend API Response wrapper - ReturnResult<T>
 * Maps to C# class: ReturnResult<UnitTestedAntigensQueryResponseDto>
 */
export interface UnitTestedAntigensApiResponse {
  success: boolean | null;
  message?: string | null;
  error?: string | null;
  errorCode?: string | null;
  statusCode?: number | null;
  data?: UnitDonorTestedAntigenResponse[] | null;  // Backend returns List<T> in Data
  item?: UnitDonorTestedAntigenResponse | null;     // Backend also returns single object in Item
  total?: number | null;
  returnAdviceId?: string | null;
  errorResponse?: {
    errorCode?: string;
    error?: string;
    fieldErrors?: any;
  } | null;
}

/**
 * @deprecated Use ScheduledTest instead
 */
export interface UtrsTestResult extends ScheduledTest {}

/**
 * @deprecated Use UnscheduledTest instead
 */
export interface UnitTestBaseResult extends UnscheduledTest {}

/**
 * @deprecated Use DonorTest instead
 */
export interface DonorTestedUnitsResult extends DonorTest {}

/**
 * @deprecated Use UnitTestedAntigensApiResponse instead
 */
export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  total?: number;
}

/**
 * Table column configuration for DataTable component
 */
export interface AntqlTableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
}

/**
 * Error state for the component
 */
export interface AntqlErrorState {
  hasError: boolean;
  message: string;
  isUnitNotFound: boolean;
  isNoResults: boolean;
}
