export interface TemporaryDrive {
  driveDate: string;
  temporaryDriveId: string;
  sponsorId: string;
  sponsorName: string;
  projectedShow: number;
  projectedDraw: number;
  type: string;
  category: string;
  contactPerson: string;
  recruiter?: string;
  location?: string;
  time?: string;
  // Resource requirements from TEMP_DRIVES table
  staffReqd?: number;
  vanReqd?: number;
  coachReqd?: number;
  bedReqd?: number;
  projectedCost?: number;
  // Generated Drive ID from BC_ID_GENERATOR package
  suggestedDriveId?: string;
}

export interface DriveDetails {
  driveId: string;
  driveDate: Date | null;
  driveType: string;
  category: string;
  openDrive: string;
  recruiterId: string;
  recruiterName: string;
  contactName: string;
}

export interface SponsorProjection {
  sponsorId: string;
  sponsorName: string;
  locationId: string;
  locationName: string;
  projectedDraw: number;
  projectedShow: number;
  deferralPercent: number;
  territoryId: string;
  territory: string;
}

export interface DriveDateTime {
  startDate: Date | null;
  startTime: string;
  endDate: Date | null;
  endTime: string;
  setupBreakdown: number;
  travelTime: number;
}

export interface ResourceCalculation {
  resource: string;
  number: number;
}

export interface StaffSchedule {
  name: string;
  selected: boolean;
}

export interface SuitableDate {
  date: string;
  dayOfWeek: string;
}

export interface CreateDriveRequest {
  temporaryDriveId?: string;
  driveDetails: DriveDetails;
  sponsorProjection: SponsorProjection;
  dateTime: DriveDateTime;
  resources: ResourceCalculation[];
  staffSchedule: StaffSchedule[];
  notes: string[]; // Array of notes
  chapterId: string;
}

export interface CreateDriveResponse {
  success: boolean;
  message: string;
  driveId?: string;
  resources?: DriveEstimatedResource[];
}

export interface PastDrive {
  driveId: string;
  driveDate: string;
  projectedShow: number;
  projectedDraw: number;
  locationName: string;
  actualShow: number;
  actualDraw: number;
  deferralPercentage: number;
}

export interface CalculateStaffRequest {
  projectedShow: number;
  driveDate: string;
  scheduleStartTime: string;
  scheduleEndDate: string;
  scheduleEndTime: string;
  efficiencyRange?: number;
}

export interface CalculateStaffResponse {
  staffRequired: number;
  totalHours: number;
  efficiencyRange: number;
  projectedShow: number;
}

export interface DriveEstimatedResource {
  resourceCode: string;
  resourceDesc: string;
  resourceType?: string;
  numberReqd: number;
  sortSeq?: number;
}

export interface CentralNote {
  note?: string;
  noteId: string;
  noteSequence: number;
  insertUser: string;
  insertDate?: string;
  programId: string;
  chapterId: string;
}

export interface CreateNoteRequest {
  note: string;
  chapterId: string;
}
