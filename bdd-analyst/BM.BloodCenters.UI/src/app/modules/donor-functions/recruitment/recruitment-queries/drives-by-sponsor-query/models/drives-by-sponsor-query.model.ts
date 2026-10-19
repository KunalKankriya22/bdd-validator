/**
 * Models for Drives by Sponsor Query (MRQRECDR) feature
 */

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data?: T[];
  item?: T;
  total: number;
  errorResponse: {
    errorCode: string;
    error: string;
  };
}

/**
 * Sponsor Lookup - Dropdown options
 */
export interface SponsorLookup {
  code: string;
  description: string;
}

/**
 * Sponsor Details - Detailed sponsor information
 */
export interface SponsorDetails {
  sponsorId: string;
  name: string;
  address: string;
  phone: string;
  lob: string;
  lobDescription: string;
  category: string;
  categoryDescription: string;
  territoryId: string;
  territoryName: string;
  employeeBase: number;
  penetration: string;
  effDate: string;
  sponsorRating: string;
  defaultLocationId: string;
  chapterId: string;
  sponsorDetails: string;
}

/**
 * Sponsor Drive - Main table row data
 */
export interface SponsorDrive {
  driveId: string;
  driveDate: string;
  driveType: string;
  locationDescription: string;
  status: string;
  projectedShow: number;
  projectedDraw: number;
  actualCredits: number;
  actualDraw: number;
  deferralCount: number;
  deferralPercentage: number;
  scheduleStartTime: string;
  scheduleEndTime: string;
}

/**
 * Drive Search Request payload
 */
export interface DriveSearchRequest {
  sponsorId: string;
  status: string;
  fromDate?: string;
  toDate?: string;
  sort?: 'A' | 'D' | null;
  loggedInUserName: string;
  chapterId: string;
}

/**
 * Sponsor Drive Search Response with pagination and totals
 */
export interface SponsorDriveSearchResponse {
  drives: SponsorDrive[];
  skip: number;
  take: number;
  totalRecords: number;
  totalProjectedShow: number;
  totalProjectedDraw: number;
  totalActualCredits: number;
  totalActualDraw: number;
  totalDeferralCount: number;
  otherCredits: number;
  otherDraws: number;
}

/**
 * Totals for footer row (calculated by backend for ALL records)
 */
export interface SponsorDriveTotals {
  totalRecords: number;
  totalProjectedShow: number;
  totalProjectedDraw: number;
  totalActualCredits: number;
  totalActualDraw: number;
  totalDeferralCount: number;
  otherCredits: number;
  otherDraws: number;
}

/**
 * Drive Status options
 */
export interface DriveStatusOption {
  value: string;
  label: string;
  description: string;
}

/**
 * Drive status constants
 */
export const DRIVE_STATUS_OPTIONS: DriveStatusOption[] = [
  { value: 'CNFRM', label: 'Confirmed', description: 'Confirmed drives' },
  { value: 'CANCL', label: 'Cancelled', description: 'Cancelled drives' },
  { value: 'HOLD', label: 'Hold', description: 'Drives on hold' },
  { value: 'R', label: 'Rollover', description: 'Rollover drives' }
];

/**
 * Sponsor Instruction - Instructions/preferences for a sponsor
 */
export interface SponsorInstruction {
  instruction: string;
  values?: string;
  effectiveDate?: string;
  terminationDate?: string;
}
