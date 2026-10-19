/**
 * QC Unit list item DTO
 * Represents a unit row in the main table
 */
export interface QcUnitListItem {
  /** Unit identifier */
  unitId: string;

  /** Check digit (e.g., "L") */
  checkDigit?: string | null;

  /** Tube check-in status - "Yes" if BAG_CHECK_IN_DATS exists, "No" otherwise */
  tubeCheckIn?: string | null;

  /** Collection date */
  collectionDate?: string | null;

  /** QC reason - "OK" or issue description */
  reason?: string | null;

  /** QC flag - Y/N */
  qcFlag?: string | null;

  /** Red tube 1 flag */
  redTube1?: string | null;

  /** Red tube 2 flag */
  redTube2?: string | null;

  /** Purple tube 1 flag */
  purpleTube1?: string | null;

  /** Purple tube 2 flag */
  purpleTube2?: string | null;

  /** Days since collection (for color coding) */
  daysSinceCollection?: number | null;

  /** Collection date color code (WHITE/YELLOW/GREEN/RED/BLUE) */
  collectionDateColor?: string | null;

  /** True if reason != "OK" */
  hasWarning: boolean;
}

/**
 * Collection date color legend mapping
 */
export enum CollectionDateColor {
  WHITE = 'WHITE',   // 0-2 days
  YELLOW = 'YELLOW', // 3-4 days
  GREEN = 'GREEN',   // 5 days
  RED = 'RED',       // 6-7 days
  BLUE = 'BLUE'      // 8+ days
}
