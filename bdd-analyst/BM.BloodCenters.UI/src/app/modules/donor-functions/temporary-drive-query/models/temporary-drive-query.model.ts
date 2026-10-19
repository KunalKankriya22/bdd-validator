/**
 * Temporary Drive Query Models
 * Based on FMB Analysis: DRQTEMPD
 */

/**
 * Temporary drive record displayed in data table
 * Maps to TEMP_DRIVES + TEMP_DRIVE_SPONSORS blocks in FMB
 */
export interface TemporaryDrive {
  tempdrId: string;                // TEMP_DRIVES.TEMPDR_ID (VARCHAR2 10)
  driveDate: string;               // TEMP_DRIVES.DRIVE_DATE
  status: string | null;           // TEMP_DRIVES.STATUS: U=Used, D=Deleted, null=Pending
  sponsorName: string | null;      // Derived: SPONSORS.NAME via TEMP_DRIVE_SPONSORS
  recruiterName: string | null;    // Derived: EMPLOYEES last_name, first_name
  projectedShow: number | null;    // TEMP_DRIVE_SPONSORS.PROJECTED_SHOW
  projectedDraw: number | null;    // TEMP_DRIVE_SPONSORS.PROJECTED_DRAW
  projectedDeferralPct: number | null; // Calculated: ROUND((show-draw)*100/show)
  deleteUser: string | null;       // TEMP_DRIVES.DELETE_USER
  deleteDate: string | null;       // TEMP_DRIVES.DELETE_DATE
  sponsorId: string | null;        // TEMP_DRIVE_SPONSORS.SPONSOR_ID (for search/detail)
}

/**
 * Detail record for Overview Details side panel
 * Displayed when a table row is selected
 */
export interface TemporaryDriveDetail {
  sponsorId: string | null;
  sponsorName: string | null;
  contactId: string | null;
  contactName: string | null;
  locationId: string | null;
  locationName: string | null;
  reasonId: string | null;         // TEMP_DRIVES.PENDING_REASON
  reasonName: string | null;       // VALID_MASTER_CODES code_type='TRDRV' (may be null)
  category: string | null;         // TEMP_DRIVES.DRIVE_CATEGORY
  driveType: string | null;        // Derived: VALID_MASTER_CODES code_type='DRVTY'
  territoryId: string | null;
  territoryName: string | null;    // VALID_TERRITORIES.TERRITORY_SHORT_NAME
  startTime: string | null;        // TEMP_DRIVES.SCHEDULE_START_TIME (timezone-converted)
  endTime: string | null;          // TEMP_DRIVES.SCHEDULE_END_TIME (timezone-converted)
}

/**
 * Filter panel filter values
 */
export interface TemporaryDriveFilterValue {
  status: string | null;           // U/D/N filter in panel
  recruiterName: string | null;    // Recruiter name text filter
  sponsorName: string | null;      // Sponsor name text filter
}

/**
 * Filter request parameters for API
 */
export interface TemporaryDriveQueryRequest {
  fromDate: string;                // Required, YYYY-MM-DD
  toDate: string;                  // Required, YYYY-MM-DD
  recruiterId?: string;            // Optional recruiter filter
  status?: string;                 // Optional: U, N, D
  sponsorId?: string;              // Optional sponsor filter
}

/**
 * Recruiter lookup option for dropdown
 */
export interface RecruiterOption {
  staffNo: string;
  name: string;
}

/**
 * Sponsor lookup option for dropdown
 */
export interface SponsorOption {
  sponsorId: string;
  name: string;
}

/**
 * Status option for dropdown
 */
export interface StatusOption {
  code: string;
  description: string;
}

/**
 * Filter panel distinct name option (from actual data, not master tables)
 */
export interface FilterNameOption {
  name: string;
}
