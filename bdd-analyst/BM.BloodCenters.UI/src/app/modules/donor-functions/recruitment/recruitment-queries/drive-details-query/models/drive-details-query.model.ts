/**
 * Drive Details Query Models
 * Based on DriveDetailsQueryController API endpoints
 */

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  statusCode?: number;
  message?: string;
  error?: string;
  data?: T[];
  item?: T;
  total?: number;
}

// ============ FILTERS ============

/** Select dropdown option (All/Past/Future drives) */
export interface DriveSelectionOption {
  value: string;
  label: string;
}

/** Sponsor lookup item for dropdown */
export interface DriveFilterSponsor {
  sponsorId: string;
  name: string;
}

/** Drive lookup item for dropdown */
export interface DriveLookup {
  driveId: string;
  driveDate: string | null;
}

/** Response from GET /api/v1/drive-details-query/filters */
export interface DriveDetailsQueryFilters {
  selectOptions: DriveSelectionOption[];
  sponsors: DriveFilterSponsor[];
  drives: DriveLookup[];
}

// ============ DRIVE DETAILS ============

/** Request params for POST /api/v1/drive-details-query */
export interface DriveDetailsQueryParams {
  select?: string;       // A = All, P = Past, F = Future
  sponsorId?: string;
  driveDate?: string;    // YYYY-MM-DD format
  driveId?: string;
  chapterId?: string;
  loggedInUserName?: string;
}

/** Drive details model */
export interface DriveDetailsModel {
  // Recruitment & Classification Details
  recruiterId: string | null;
  recruiterName: string | null;
  driveCoordinator: string | null;
  phoneNumber: string | null;
  status: string | null;
  category: string | null;
  type: string | null;
  sponsorCategory: string | null;
  territory: string | null;
  licensedDrive: string | null;

  // Location Information
  location: string | null;
  address: string | null;
  distance: number | null;
  direction: string | null;
  facility: string | null;
  lastPeriod: string | null;
  lastModified: string | null;

  // Drive Analysis
  projectedShow: number | null;
  actualShow: number | null;
  projectedDraw: number | null;
  actualDraw: number | null;
  projectedDeferral: number | null;
  actualDeferral: number | null;
  scheduleStartTime: string | null;
  actualStartTime: string | null;
  scheduleEndTime: string | null;
  actualEndTime: string | null;
  scheduleSetupBreakdown: number | null;
  actualSetupBreakdown: number | null;
  projectedTravelTime: string | null;
  actualTravelTime: string | null;
  projectedCpu: number | null;
  actualCpu: number | null;

  // Resources
  projectedResources: number | null;
  actualResources: number | null;

  // Identifiers
  driveId: string | null;
  chapterId: string | null;
  sponsorId: string | null;
  sponsorName: string | null;
  driveDate: string | null;
  locationId: string | null;
  scheduleId: string | null;
}

/** Drive note model */
export interface DriveNote {
  userId: string | null;
  userName: string | null;
  notes: string | null;
  noteSequence: number | null;
  insertDate: string | null;
}

/** Response from POST /api/v1/drive-details-query */
export interface DriveDetailsQueryResponse {
  driveDetails: DriveDetailsModel | null;
  notes: DriveNote[];
}

// ============ LOCATION NOTES ============

/** Location note model */
export interface LocationNote {
  locationId: string | null;
  locationName: string | null;
  userId: string | null;
  userName: string | null;
  notes: string | null;
  noteSequence: number | null;
  insertDate: string | null;
}

/** Response from GET /api/v1/drive-details-query/location-notes */
export interface LocationNotesResponse {
  data: LocationNote[];
}

// ============ CHECKLIST ============

/** Drive checklist item - from DRIVE_CHECKLISTS table */
export interface DriveChecklistItem {
  action: string | null;
  description: string | null;
  targetDate: string | null;
  user: string | null;
  actionDate: string | null;
  actionBy: string | null;
}

// ============ RESOURCES ============

/** Estimated resource item - from DRIVE_ESTIMATED_RESOURCES */
export interface DriveEstimatedResource {
  resource: string | null;
  estimate: number | null;
  actual: number | null;
}

/** Scheduled staff item - from STAFF_SCHEDULE_DETAILS */
export interface DriveScheduledStaff {
  scheduledStaff: string | null;
  scheduledStaffName: string | null;
  job: string | null;
  jobDescription: string | null;
  teamLeaderPhone: string | null;
  teamLeaderPager: string | null;
}

/** Actual staff item - from DRIVE_EMPLOYEES */
export interface DriveActualStaff {
  actualStaff: string | null;
  actualStaffName: string | null;
  job: string | null;
  jobDescription: string | null;
}

/** Response from GET /api/v1/drive-details-query/resources */
export interface DriveResourcesResponse {
  estimatedResources: DriveEstimatedResource[];
  scheduledStaff: DriveScheduledStaff[];
  actualStaff: DriveActualStaff[];
}

// ============ PICKUP SCHEDULE ============

/** Pickup schedule item - from PICKUP_SCHEDULE */
export interface PickupScheduleItem {
  courier: string | null;
  time: string | null;
  driver: string | null;
}

// ============ SUPPLIES ============

/** Campaign item - from DRIVE_CAMPAIGN_ITEMS */
export interface CampaignItem {
  item: string | null;
  description: string | null;
  qty: number | null;
}

/** Drive bag item - from DRIVE_BAGS */
export interface DriveBagItem {
  bag: string | null;
  description: string | null;
  qty: number | null;
  aboDesc: string | null;
}

/** Response from GET /api/v1/drive-details-query/supplies */
export interface DriveSuppliesResponse {
  campaignId: string | null;
  campaignName: string | null;
  campaignItems: CampaignItem[];
  bags: DriveBagItem[];
}

// ============ PROCEDURES ============

/** Procedure item - from DRIVE_PROCEDURES or DONATIONS */
export interface DriveProcedureItem {
  procedure: string | null;
  procedureDescription: string | null;
  don: string | null;
  donDescription: string | null;
  draw: number | null;
}

/** Response from GET /api/v1/drive-details-query/procedures */
export interface DriveProceduresResponse {
  scheduled: DriveProcedureItem[];
  actual: DriveProcedureItem[];
}
