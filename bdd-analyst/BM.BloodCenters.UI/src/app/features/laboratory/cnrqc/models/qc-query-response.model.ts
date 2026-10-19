import { QcUnitListItem } from './qc-unit-list-item.model';

/**
 * Summary statistics DTO
 */
export interface SummaryStats {
  /** Total number of units */
  totalUnits: number;

  /** Number of skipped units */
  skippedUnits: number;

  /** Number of units with no result */
  noResultUnits: number;

  /** Number of SQC units */
  sqcUnits: number;
}

/**
 * Response DTO for query QC units endpoint
 */
export interface QueryQcUnitsResponse {
  /** Session ID for subsequent requests */
  sessionId: string;

  /** List of QC units */
  units: QcUnitListItem[];

  /** Summary statistics */
  summaryStats: SummaryStats;
}
