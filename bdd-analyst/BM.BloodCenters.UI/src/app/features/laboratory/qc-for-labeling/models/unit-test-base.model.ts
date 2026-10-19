/**
 * Unit Test Base DTO - represents the base test definition for a unit
 * Mapped from UNIT_TEST_BASE table
 * API: GET /api/lab-qc/summary
 */
export interface UnitTestBaseDto {
  /** Unit ID */
  unitId: string;

  /** Collection Date */
  collDate: string;

  /** Chapter ID */
  chapterId: string;

  /** Test ID */
  testId: string;

  /** Test Sequence Number */
  testSeqNo: number;

  /** Test Description */
  testDescription: string | null;

  /** Test Type (REQUIRED, OPTIONAL, etc.) */
  testType: string | null;

  /** Required Flag (Y/N) */
  requiredFlag: string | null;

  /** Cancel Flag (null = active, 'Y' = cancelled) */
  cancelFlag: string | null;
}
