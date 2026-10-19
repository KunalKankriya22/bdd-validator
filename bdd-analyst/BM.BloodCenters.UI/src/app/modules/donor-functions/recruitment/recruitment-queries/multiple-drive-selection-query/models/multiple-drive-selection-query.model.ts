/**
 * Multiple Drive Selection Query Models
 * Models for filtering and displaying drive records
 */

/**
 * Lookup option for dropdowns
 */
export interface LookupOption {
  code: string;
  description: string;
}

/**
 * Lookup data for all filter dropdowns
 */
export interface MultipleDriveSelectionLookups {
  select: LookupOption[];
  facility: LookupOption[];
  status: LookupOption[];
  sponsors: LookupOption[];
  zipCode: LookupOption[];
  sponsorCategory: LookupOption[];
  territory: LookupOption[];
  procedure: LookupOption[];
  driveCategory: LookupOption[];
  fixedDrive: LookupOption[];
}

/**
 * Filter request payload for searching drives
 */
export interface MultipleDriveFilterRequest {
  searchKeyword?: string;
  sort?: string;
  select?: string[]; // Column visibility
  fromDate: string; // ISO 8601 format
  toDate: string;
  facility?: string[];
  status?: string[];
  sponsors?: string[];
  zipCode?: string[];
  sponsorCategory?: string;
  territory?: string[];
  procedure?: string;
  driveCategory?: string[];
  fixedDrive?: string;
  minimumProjectDraw?: number;
  maximumProjectDraw?: number;
  minimumTravelTime?: number;
  maximumTravelTime?: number;
  minimumDriveDurationHour?: number;
  minimumDriveDurationMinute?: number;
  maximumDriveDurationHour?: number;
  maximumDriveDurationMinute?: number;
  minimumDriveStartTimeEnterTime?: string;
  minimumDriveStartTimeAMorPM?: string;
  maximumDriveStartTimeEnterTime?: string;
  maximumDriveStartTimeAMorPM?: string;
}

/**
 * Drive record from search results
 */
export interface DriveRecord {
  driveDate?: Date;
  driveId?: string;
  pgy?: string;
  sponsorName?: string;
  travel?: string;
  duration?: string;
  status?: string;
  recruiter?: string;
  projectedShow?: number;
  projectedDraw?: number;
}

/**
 * API response wrapper for lookups
 */
export interface LookupsResponse {
  success: boolean;
  statusCode: number;
  item: MultipleDriveSelectionLookups;
  data: null;
  total: null;
}

/**
 * API response wrapper for drive search
 */
export interface DriveSearchResponse {
  success: boolean;
  message: string;
  error: string | null;
  errorCode: string | null;
  statusCode: number;
  data: DriveRecord[];
  item: null;
  total: number;
}
