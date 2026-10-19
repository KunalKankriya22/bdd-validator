/**
 * Monthly Collection Goals Query - Data Models
 * Based on MRQBCGOL Oracle Forms analysis
 */

// Lookup Models
export interface GoalTypeLookup {
  code: string;        // VARCHAR2(5) - INGOL, TRGOL, STGOL, etc.
  description: string; // VARCHAR2(50)
}

export interface CustodianLookup {
  custodianId: string;  // VARCHAR2(10)
  custodianName: string;         // VARCHAR2(100)
}

// Search Tab Models
export interface MonthlyGoalSummary {
  month: string;       // Month name (January-December)
  monthNumber: string; // "01"-"12"
  goalCount: number;   // Goal count for the month
}

export interface GoalDetail {
  goalId: string;                    // VARCHAR2(10)
  goalType: string;                  // VARCHAR2(5)
  goalCustodian: string;             // VARCHAR2(10)
  goalMmyy: string;                  // MMYYYY format
  donationType: string;              // VARCHAR2(5)
  donationTypeDescription: string;   // VARCHAR2(50)
  procedureCode: string;             // VARCHAR2(5)
  procedureCodeDescription: string;  // VARCHAR2(50)
  bloodType: string;                 // VARCHAR2(5)
  bloodTypeDescription: string;      // VARCHAR2(50)
  goalCount: number;
  chapterId?: string;
  programId?: string;
}

export interface SearchTabResponse {
  goalType: string;
  goalTypeDescription: string;  // e.g., "Recruiter"
  year: string;
  custodianId: string;
  custodianName: string;
  monthlySummaries: MonthlyGoalSummary[];
  grandTotal: number;
}

export interface MonthDetailResponse {
  monthName: string;
  details: GoalDetail[];
}

// Summary Tab Models (By Donation Type, By Procedure Type, Territories, Fixed Sites)
export interface MonthlySummaryRow {
  goalsFor: string;     // Category name (donation type, procedure, territory, or site name)
  goalsForId?: string;  // Optional ID for the category
  january: number;
  february: number;
  march: number;
  april: number;
  may: number;
  june: number;
  july: number;
  august: number;
  september: number;
  october: number;
  november: number;
  december: number;
  total: number;
}

export interface SummaryTabResponse {
  rows: MonthlySummaryRow[];
  totals: MonthlySummaryRow;      // Row totals
  grandTotal: number;
}

// Request DTOs
export interface SearchQueryRequest {
  goalType: string;      // Required, VARCHAR2(5)
  custodianId: string;   // Required, VARCHAR2(10)
  year: number;          // Required, YYYY format
}

export interface MonthDetailRequest {
  goalType: string;
  custodianId: string;
  year: string;          // YYYY format as string
  month: number;         // 1-12
}

export interface SummaryQueryRequest {
  year: number;
}

// Tab Configuration
export type SummaryTabType = 'donation-type' | 'procedure-type' | 'territories' | 'fixed-sites';

export const SUMMARY_TAB_CONFIG: Record<SummaryTabType, { label: string; goalsForHeader: string }> = {
  'donation-type': {
    label: 'By Donation Type',
    goalsForHeader: 'Goals For'
  },
  'procedure-type': {
    label: 'By Procedure Type',
    goalsForHeader: 'Goals For'
  },
  'territories': {
    label: 'Territories',
    goalsForHeader: 'Goals For'
  },
  'fixed-sites': {
    label: 'Fixed Sites',
    goalsForHeader: 'Goals For'
  }
};

// Month names constant
export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
] as const;

export const MONTH_ABBREVIATIONS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
] as const;
