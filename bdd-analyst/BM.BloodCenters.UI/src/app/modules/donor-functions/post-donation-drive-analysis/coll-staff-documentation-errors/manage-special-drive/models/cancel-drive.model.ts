export interface SearchDrivesQueryDto {
  driveId?: string;
  driveDate?: string;
  sponsorName?: string;
  locationId?: string;
  sortOrder?: 'ASC' | 'DESC';
  take: number;
  skip: number;
}

export interface CancelDriveRequestDto {
  cancelReasonCode: string;
  cancelReason: string;
  confirmCancellation: boolean;
}

export interface DriveForCancellationDto {
  driveId: string;
  driveDate: string;
  sponsorName?: string;
  locationName?: string;
  status: string;
  programId?: string;
}

export interface DriveSponsorDto {
  sponsorId: string;
  sponsorName?: string;
  contactId?: string;
  contactName?: string;
  projectedShow?: number;
  projectedDraw?: number;
}

export interface DriveCancellationDetailsDto {
  driveId: string;
  driveDate: string;
  status: string;
  locationId?: string;
  locationName?: string;
  recruiterId?: string;
  recruiterName?: string;
  driveType?: string;
  driveTypeDesc?: string;
  driveCategory?: string;
  driveCategoryDesc?: string;
  openDriveInd?: string;
  scheduleStartTime?: string;
  scheduleEndTime?: string;
  scheduleStupBkdownTime?: string;
  sponsors: DriveSponsorDto[];
  totalProjectedShow: number;
  totalProjectedDraw: number;
  canBeCancelled: boolean;
  hasPiggybackGroups: boolean;
}

export interface DriveLookupDto {
  driveId: string;
  driveDate?: string;
  sponsorName?: string;
}

export interface CancelReasonCodeDto {
  code: string;
  description: string;
}

export interface CancelDriveResultDto {
  driveId: string;
  cancelUser: string;
  cancelDate: string;
  status: string;
  staffScheduleDetailsDeleted: number;
  driveVehiclesDeleted: number;
  alertCreated: boolean;
}

export interface CancelDriveApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  statusCode: number;
  total?: number;
  totalCount?: number;
  errorCode?: string;
  errorResponse?: unknown;
}
