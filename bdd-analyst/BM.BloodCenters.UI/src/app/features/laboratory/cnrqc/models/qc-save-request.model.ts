/**
 * Unit QC flag item for save request
 */
export interface UnitQcFlag {
  /** Unit identifier */
  unitId: string;

  /** QC flag - Y/N */
  qcFlag: string;

  /** QC reason */
  qcReason: string | null;
}

/**
 * Request DTO for saving QC flags
 */
export interface SaveQcFlagsRequest {
  /** Session ID */
  sessionId: string;

  /** Array of unit QC flags to save */
  unitQcFlags: UnitQcFlag[];

  /** Confirm partial reconciliation flag */
  confirmPartialReconciliation: boolean;
}
