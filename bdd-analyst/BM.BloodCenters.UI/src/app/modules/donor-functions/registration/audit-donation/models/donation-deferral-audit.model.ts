/**
 * Donation/Deferral Audit Details Models
 * Based on API documentation: donation-deferral-audit-api-documentation.md
 *
 * These models are used for the read-only DRWAUDIT overlay drawer component
 * that displays comprehensive audit details for donation/deferral transactions.
 */

// API Response Wrapper (reusing existing pattern)
export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
}

/**
 * Main DTO for donation/deferral audit details
 * Returned by GET /api/donation-deferral-audit/{transactionId}
 */
export interface DonationDeferralAuditDto {
  /** Unique donation/deferral transaction identifier */
  transactionId: string;

  /** Unit ID */
  unitId: string | null;

  /** Deferral ID */
  deferralId: string | null;

  /** Donor signature flag (Y/N) */
  signatureFlag: string | null;

  /** Type of donation (WB=Whole Blood, AP=Apheresis, etc.) */
  donationType: string | null;

  /** Procedure code for the donation */
  procedureCode: string | null;

  /** Date/time of audit (converted to chapter local timezone) */
  auditDate: Date | null;

  /** Name of user who performed the audit (Last, First format) */
  auditUserName: string | null;

  /** Indicates if abbreviated donor health questionnaire was used */
  isAbbreviatedDhq: boolean;

  /** List of health history questionnaire responses (may be empty array) */
  healthHistory: HealthHistoryItemDto[];

  /** List of physical examination findings (may be empty array) */
  physicalFindings: PhysicalFindingItemDto[];
}

/**
 * Health History Questionnaire Item
 * Represents a single health history question and response
 */
export interface HealthHistoryItemDto {
  /** Health history question code */
  questionCode: string | null;

  /** Display sequence number for ordering */
  questionSequence: string | null;

  /** Donor's response (Y/N or free text) */
  response: string | null;

  /** Code for the selected answer */
  answerCode: string | null;

  /** Description of the answer */
  answerDescription: string | null;

  /** Start date for condition/medication */
  startDate: Date | null;

  /** End date for condition/medication */
  endDate: Date | null;

  /** Interdiction code if applicable */
  interCode: string | null;

  /** Date of incident/exposure */
  incidentDate: Date | null;

  /** Deferral expiration date */
  deferralThruDate: Date | null;

  /** Number of periods for deferral */
  deferralPeriod: number | null;

  /** Type of period (D=Days, M=Months, Y=Years) */
  periodType: string | null;

  /** Additional comments */
  comments: string | null;
}

/**
 * Physical Examination Finding Item
 * Represents a single physical examination result
 */
export interface PhysicalFindingItemDto {
  /** Physical examination code (BP, TEMP, PULSE, etc.) */
  physicalCode: string | null;

  /** Description of the physical examination */
  codeDescription: string | null;

  /** Measured value or result */
  physicalValue: string | null;

  /** Interdiction code if value is out of range */
  interCode: string | null;

  /** Description of interdiction */
  interDescription: string | null;

  /** Additional comments about the finding */
  comments: string | null;
}

/**
 * Dialog Data Interface
 * Used to pass data when opening the drawer dialog
 */
export interface DonationDeferralAuditDrawerData {
  /** Transaction ID to fetch audit details for */
  transactionId: string;
}
