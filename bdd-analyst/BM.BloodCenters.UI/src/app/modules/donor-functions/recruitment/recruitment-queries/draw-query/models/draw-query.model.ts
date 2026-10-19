/**
 * Models for Draw Query (DRAWQ) feature
 */

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data: T[];
  total: number;
  errorResponse: {
    errorCode: string;
    error: string;
  };
}

/**
 * Drive Projection Summary - Main table row data
 */
export interface DriveProjectionSummary {
  driveDate: string;
  driveDay: string;
  numberOfDrives: number;
  projectedShow: number;
  projectedDraw: number;
  goal: number;
  actualDraw: number;
  actualDeferral: number;
  prelab: number;
  rnft: number;
  veni03: number;
  veni04: number;
  veni05: number;
  veni06: number;
  veni07: number;
  projectedDeferral: number;
  deferralPercent: number;
  actualDeferralPercent: number;
  veniTotal: number;
}

/**
 * Drive Details - Dialog data for specific date
 */
export interface DriveDetail {
  driveId: string;
  driveDate: string;
  sponsorId: string;
  sponsorName: string;
  driveTimes: string;
  recruiterId: string;
  recruiterName: string;
  projectedDraw: number;
  driveType: string;
  driveTypeDescription: string;
  facilityCode: string;
  staffRequired: number;
  vanRequired: number;
  coachRequired: number;
  locationId: string;
}

/**
 * Donation Type Lookup
 */
export interface DonationType {
  code: string;
  description: string;
}

/**
 * Request payload for drive projections query
 */
export interface DriveProjectionRequest {
  fromDate: string;
  toDate: string;
  driveType?: string;
  loggedInUserName: string;
  donationType?: string;
  chapterId: string;
}

/**
 * Drive Type options
 */
export interface DriveTypeOption {
  code: string;
  description: string;
}

/**
 * Chapter filter option
 */
export interface ChapterOption {
  chapterId: string;
  chapterName: string;
}
