/**
 * Contract dropdown item DTO
 */
export interface ContractDropdownItem {
  /** Contract ID */
  contractId: string;

  /** Company name */
  companyName: string;
}

/**
 * Batch dropdown item DTO
 */
export interface BatchDropdownItem {
  /** Batch ID */
  batchId: string;

  /** True if batch is in use */
  isInUse: boolean;
}

/**
 * Test Series dropdown item DTO
 */
export interface TestSeriesDropdownItem {
  /** Test Series ID */
  testSeriesId: string;

  /** Description */
  description: string;
}

/**
 * Test dropdown item DTO
 */
export interface TestDropdownItem {
  /** Test ID */
  testId: string;

  /** Test description */
  testDescription: string;
}
