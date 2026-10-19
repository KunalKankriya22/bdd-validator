// Main DTO matching backend SpecialDriveModel
export interface SpecialDriveDto {
  // Main drive fields (from backend)
  driveId: string;
  chapterId: string;
  driveDate: string | Date;
  dayOfWeek?: string;
  driveType: string;  // F=Fixed, I=Inside, C=Coach
  driveTypeDescription?: string;
  driveCategory: string;
  driveCategoryDescription?: string;
  status: string;  // CNFRM, HOLD, CANCL
  locationId?: string;
  locationName?: string;
  recruiterId?: string;
  recruiterName?: string;
  sponsorName?: string;
  scheduleStartTime?: string;
  scheduleEndTime?: string;
  noteId?: string;
  programId: string;
  insertDate?: string | Date;
  insertUser?: string;
  lastModifiedDate?: string | Date;
  lastModifiedUser?: string;
  auditKey?: number;

  // Master-detail children (loaded separately or with drive)
  sponsors?: DriveSponsorDto[];
  resources?: DriveResourceDto[];
  notes?: DriveNoteDto[];
  employees?: DriveEmployeeDto[];
}

// Drive Sponsor DTO
export interface DriveSponsorDto {
  driveId: string;
  chapterId: string;
  sponsorId: string;
  sponsorName?: string;
  projectedShow: number;
  projectedDraw: number;
  projDeferralRate?: number;
  primaryFlag?: string;  // 'Y' = primary sponsor, 'N' = secondary
  contactId?: string;
  programId?: string;
}

// Drive Resource DTO
export interface DriveResourceDto {
  driveId: string;
  chapterId: string;
  resourceCode: string;
  resourceDescription?: string;
  numberRequired: number; // Changed from numberReqd to match API response
  sortSeq?: number;
  programId?: string;
  insertDate?: string | Date;
  insertUser?: string;
  auditKey?: number;
}

// Drive Note DTO
export interface DriveNoteDto {
  noteId: string;
  noteSequence: number;
  note: string;
  insertDate?: string | Date;
  insertUser?: string;
  insertUserName?: string;
  localInsertDate?: string | Date;
  chapterId?: string;
  programId?: string;
}

// Drive Employee DTO
export interface DriveEmployeeDto {
  driveId: string;
  chapterId: string;
  employeeId: string;
  employeeName?: string;
}

// Request DTOs for API calls

export interface CreateSpecialDriveRequest {
  chapterId: string;
  driveDate: string;
  driveType: string;
  driveCategory: string;
  locationId?: string;
  recruiterId?: string;
  scheduleStartTime?: string;
  scheduleEndTime?: string;
  status?: string;
  sponsors: DriveSponsorDto[];
  resources?: DriveResourceDto[];
  notes?: { note: string; insertUser?: string; insertUserName?: string; insertDate?: string }[];
}

export interface UpdateSpecialDriveRequest extends CreateSpecialDriveRequest {
  driveId: string;
  auditKey: number;
}

export interface RecreateSpecialDriveRequest {
  sourceDriveId: string;
  newDriveDate: string;
  chapterId: string;
}

export interface SpecialDriveSearchRequest {
  chapterId?: string;
  status?: string;
  driveId?: string;
  sponsorId?: string;
  driveType?: string;
  driveCategory?: string;
  recruiterId?: string;
  locationId?: string;
  driveDateFrom?: string;
  driveDateTo?: string;
  futureOnly?: boolean;
  pastOnly?: boolean;
  searchText?: string;
  sortColumn?: string;  // Column name: "DRIVE_DATE", "DRIVE_ID", etc.
  sortOrder?: 'ASC' | 'DESC';  // Sort direction
}

// Lookup DTOs

export interface DriveCategoryLookup {
  code: string;
  description: string;
}

export interface DriveIdLookup {
  driveId: string;
  driveDate?: string;
  sponsorName?: string;
  driveType?: string;
}

export interface ResourceLookup {
  code: string;
  description: string;
  boxNumber?: number;
}

export interface SponsorLookup {
  sponsorId: string;
  name: string;
}

export interface LocationLookup {
  locationId: string;
  locationName: string;
  locationType?: string;
}

export interface RecruiterLookup {
  employeeId: string;
  employeeName: string;
  employeeClassDescription?: string;
}

export interface CancelCodeLookup {
  code: string;
  description: string;
}

// API Response wrapper (backend uses ReturnResult<T>)
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  error?: string;
  statusCode: number;
  data?: T[];
  item?: T;
  total?: number;
}

// Legacy interface for backward compatibility with existing component
// TODO: Gradually migrate to SpecialDriveDto
export interface SpecialDrive {
  driveDate: string;
  driveId: string;
  sponsorName: string;
  projectedShow: number;
  projectedDraw: number;
  type: string;
  category: string;
  facilityAssigned: string;
  recruiter: string;

  // Expanded row details
  primaryFlag: string;
  time: string;
  staffRequired: number;
  v: string;
  c: string;
}
