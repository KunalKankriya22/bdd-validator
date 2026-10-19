// Parent Sponsor Lookup for dropdown
export interface ParentSponsorLookup {
  sponsorId: string;
  sponsorName: string;
}

// Parent Sponsor Info with address
export interface ParentSponsorInfo {
  sponsorId: string;
  sponsorName: string;
  address?: string;
  phone?: string;
}

// Constituent Sponsor (simple mode)
export interface ConstituentSponsor {
  constituentSponsor: string;
  sponsorId: string;
  recruiter?: string;
}

// Constituent Sponsor with statistics (detailed mode)
export interface ConstituentSponsorStatistics extends ConstituentSponsor {
  donorBase: number;
  drives: number;
  historicalPenetration: number;
  actualDraw: number;
  /** DEFRT value from VALID_PARAMETERS (user-configured). Same value for ALL sponsors. */
  historicalProjDeferrals: number;
}

// Totals for footer (from Backend - ALL records, not per-page)
export interface ConstituentSponsorTotals {
  totalSponsors: number;
  totalDonorBase: number;
  totalDrives: number;
  totalHistoricalPenetration: number;
  totalActualDraw: number;
  /** DEFRT value from VALID_PARAMETERS (user-configured). Same value as individual sponsors. */
  totalHistoricalProjDeferrals: number;
}

// API Response structure
export interface ConstituentSponsorsResponse<T> {
  data: T[];
  total: number;
  totals?: ConstituentSponsorTotals;
}

// Query Request
// Note: month is not sent to API - it's a UI-only field that calculates fromDate/toDate
// This matches the original Oracle Forms behavior where Month dropdown auto-populated date fields
export interface ParentSponsorQueryRequest {
  parentSponsorId: string;
  showDriveData: number; // 0 = No, 1 = Yes (matches backend enum)
  fromDate?: string;
  toDate?: string;
  sortDirection?: string; // Sorting is always by sponsor name
  chapterId?: string;
  loggedInUserName?: string;
}

// Month Filter Enum (matches backend)
export enum MonthFilter {
  None = 0,
  January = 1,
  February = 2,
  March = 3,
  April = 4,
  May = 5,
  June = 6,
  July = 7,
  August = 8,
  September = 9,
  October = 10,
  November = 11,
  December = 12,
  Yearly = 13
}

// Show Drive Data Enum (matches backend)
export enum ShowDriveDataOption {
  No = 0,
  Yes = 1
}

// Month dropdown options
export const MONTH_OPTIONS: { value: MonthFilter; label: string }[] = [
  { value: MonthFilter.None, label: 'None' },
  { value: MonthFilter.January, label: 'January' },
  { value: MonthFilter.February, label: 'February' },
  { value: MonthFilter.March, label: 'March' },
  { value: MonthFilter.April, label: 'April' },
  { value: MonthFilter.May, label: 'May' },
  { value: MonthFilter.June, label: 'June' },
  { value: MonthFilter.July, label: 'July' },
  { value: MonthFilter.August, label: 'August' },
  { value: MonthFilter.September, label: 'September' },
  { value: MonthFilter.October, label: 'October' },
  { value: MonthFilter.November, label: 'November' },
  { value: MonthFilter.December, label: 'December' },
  { value: MonthFilter.Yearly, label: 'Yearly' }
];

// Show Drive Data dropdown options
export const SHOW_DRIVE_DATA_OPTIONS: { value: ShowDriveDataOption; label: string }[] = [
  { value: ShowDriveDataOption.No, label: 'No' },
  { value: ShowDriveDataOption.Yes, label: 'Yes' }
];

// API Response wrapper
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  statusCode: number;
  data?: T[];
  item?: T;
  total?: number;
}
