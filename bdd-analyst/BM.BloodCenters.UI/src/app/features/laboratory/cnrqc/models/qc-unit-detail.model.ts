/**
 * Test result DTO
 */
export interface QcTestResult {
  /** Sequence number */
  sequence: number;

  /** Test ID */
  testId: string;

  /** Result value */
  result: string;

  /** Description */
  description: string;

  /** Interim result */
  interimResult?: string | null;

  /** True if result is reactive */
  isReactive: boolean;
}

/**
 * QC Unit detail DTO
 * Represents detailed information for a specific unit (right panel)
 */
export interface QcUnitDetail {
  /** Unit identifier */
  unitId: string;

  /** Check digit */
  checkDigit?: string | null;

  /** Batch ID */
  batchId?: string | null;

  /** Profile Set ID */
  profileSetId?: string | null;

  /** Chapter ID */
  chapterId?: string | null;

  /** Test Series ID */
  testSeriesId?: string | null;

  /** Test ID */
  testId?: string | null;

  /** Test results */
  testResults: QcTestResult[];

  /** True if unit has warning */
  hasWarning: boolean;
}
