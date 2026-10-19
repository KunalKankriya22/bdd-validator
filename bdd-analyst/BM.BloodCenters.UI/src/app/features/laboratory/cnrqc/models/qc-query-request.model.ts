/**
 * Request DTO for querying QC units
 * Supports two filter modes: All Results or Contract/Batch
 */
export interface QueryQcUnitsRequest {
  /**
   * All Results mode filter - "Y" or "N"
   * Mutually exclusive with contractId
   */
  allResults?: string | null;

  /**
   * Test Series ID filter
   * Used with All Results mode
   */
  testSeriesId?: string | null;

  /**
   * Test ID filter
   * Used with All Results mode
   */
  testId?: string | null;

  /**
   * Contract ID filter
   * Mutually exclusive with allResults
   * Required in Contract/Batch mode
   */
  contractId?: string | null;

  /**
   * Batch ID filter
   * Used with contractId in Contract/Batch mode
   */
  batchId?: string | null;
}
