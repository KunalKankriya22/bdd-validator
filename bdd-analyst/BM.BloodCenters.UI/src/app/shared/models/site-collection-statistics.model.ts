// ── Site Collection Statistics Models ────────────────────────────────────────
// Generated from API documentation: site-collection-statistics-api-documentation.md
// JIRA Ticket: MLT-10976
// Base URL: /api/site-collection-statistics

// ── Request Models ───────────────────────────────────────────────────────────

/**
 * Query parameters for fetching site statistics
 */
export interface SiteStatisticsQueryParams {
  startDate: string;  // Format: YYYY-MM-DD
  endDate: string;    // Format: YYYY-MM-DD
  siteId?: string;    // Optional site ID filter (null = all sites)
}

/**
 * Query parameters for donation breakdown
 */
export interface DonationBreakdownQueryParams {
  siteId: string;
  collectionDate: string;  // Format: YYYY-MM-DD
}

/**
 * Query parameters for unit details
 */
export interface UnitDetailsQueryParams {
  siteId: string;
  collectionDate: string;  // Format: YYYY-MM-DD
  donationType?: string;   // Optional filter
  procedureCode?: string;  // Optional filter
}

/**
 * Query parameters for goals
 */
export interface GoalsQueryParams {
  siteId: string;
  collectionDate: string;  // Format: YYYY-MM-DD
}

// ── Response Models ──────────────────────────────────────────────────────────

/**
 * Individual site statistics record
 */
export interface SiteStatisticsDto {
  siteId: string;
  locationName: string;
  collectionDate: string;  // ISO DateTime
  actualDraws: number;
  actualDeferrals: number;
}

/**
 * Site statistics summary response (wraps the list + totals)
 */
export interface SiteStatisticsSummaryDto {
  data: SiteStatisticsDto[];
  totalActualDraws: number;
  totalActualDeferrals: number;
}

/**
 * Donation breakdown by type and procedure
 */
export interface DonationBreakdownDto {
  donationType: string;
  procedureCode: string;
  count: number;
}

/**
 * Venipuncture attributes for a unit
 */
export interface VenipunctureAttributesDto {
  difficultStick: string | null;    // "Y" or null (Code: 01)
  doubleStick: string | null;       // "Y" or null (Code: 02)
  od: string | null;                // "Y" or null (Code: 03)
  qns: string | null;               // "Y" or null (Code: 04)
  nb: string | null;                // "Y" or null (Code: 05)
  nuc: string | null;               // "Y" or null (Code: 06)
  rbcsNotReturned: string | null;   // "Y" or null (Code: 07)
  qnsLessThan175: string | null;    // "Y" or null (Code: 08)
}

/**
 * Unit detail with venipuncture attributes
 */
export interface UnitDetailDto {
  unitId: string | null;            // Null for deferrals
  displayUnitId: string;            // With check digit or "Deferral"
  collectionDate: string;           // ISO DateTime
  donationType: string;
  procedureCode: string;
  attributes: VenipunctureAttributesDto;
}

/**
 * Goal comparison data
 */
export interface GoalComparisonDto {
  donationType: string;
  donationTypeDescription: string;
  procedureCode: string;
  procedureCodeDescription: string;
  goalCount: number;
}

/**
 * Site dropdown item (LOV)
 */
export interface SiteDropdownDto {
  siteId: string;
  locationName: string;
}

// ── UI-Specific Models ───────────────────────────────────────────────────────

/**
 * Dialog configuration data
 */
export interface SiteCollectionStatisticsDialogData {
  // Optional initial filters
  siteId?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Filter form values
 */
export interface SiteCollectionStatisticsFilters {
  siteId: string | null;
  fromDate: Date | null;
  toDate: Date | null;
}

/**
 * Venipuncture attribute column definition for UI table
 */
export interface VenipunctureColumn {
  code: string;           // "01", "02", etc.
  key: keyof VenipunctureAttributesDto;
  label: string;
  description: string;
}

// ── Constants ────────────────────────────────────────────────────────────────

/**
 * Venipuncture attribute column definitions
 */
export const VENIPUNCTURE_COLUMNS: VenipunctureColumn[] = [
  { code: '01', key: 'difficultStick', label: '01', description: 'Difficult stick encountered' },
  { code: '02', key: 'doubleStick', label: '02', description: 'Double stick required' },
  { code: '03', key: 'od', label: '03', description: 'OD (Overdraw/Other Difficulty)' },
  { code: '04', key: 'qns', label: '04', description: 'QNS (Quantity Not Sufficient)' },
  { code: '05', key: 'nb', label: '05', description: 'NB (No Bleed)' },
  { code: '06', key: 'nuc', label: '06', description: 'NUC (Not Used/Collected)' },
  { code: '07', key: 'rbcsNotReturned', label: '07', description: 'RBCs not returned' },
  { code: '08', key: 'qnsLessThan175', label: '08', description: 'QNS less than 175ml' },
];

/**
 * Error codes from API documentation
 */
export enum SiteCollectionStatisticsErrorCode {
  FIELD_REQUIRED = '0080',           // Field must be entered
  END_DATE_BEFORE_START = '7023',    // End date cannot be before start date
  START_DATE_AFTER_END = '7029',     // Start date cannot be after end date
  NO_RECORDS_FOUND = '9188',         // No records found (informational)
  SITE_NOT_FOUND = '11273',          // Site ID not found
}

/**
 * Error messages map
 */
export const SITE_COLLECTION_STATISTICS_ERROR_MESSAGES: Record<string, string> = {
  [SiteCollectionStatisticsErrorCode.FIELD_REQUIRED]: 'Field must be entered',
  [SiteCollectionStatisticsErrorCode.END_DATE_BEFORE_START]: 'End date cannot be before start date',
  [SiteCollectionStatisticsErrorCode.START_DATE_AFTER_END]: 'Start date cannot be after end date',
  [SiteCollectionStatisticsErrorCode.NO_RECORDS_FOUND]: 'No records found',
  [SiteCollectionStatisticsErrorCode.SITE_NOT_FOUND]: 'Site ID not found',
};
