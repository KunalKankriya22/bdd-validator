export interface DriveSheetPrintStatusModel {
  driveId: string;
  driveDate: string | Date;
  sponsorName: string;
  status: string;
  lastModifiedDate: string | Date | null;
  lastModifiedUser: string;
  driveSheetDate: string | Date | null;
  sponsorId?: string;
}

export interface DriveSheetPrintStatusRequest {
  fromDate: string;
  toDate: string;
  driveType: string;
  chapterId: string;
}

export interface DriveSheetPrintStatusResponse {
  success: boolean;
  data: DriveSheetPrintStatusModel[];
  total: number;
  message?: string;
}

export interface DriveTypeOption {
  value: string;
  description: string;
}

export const DRIVE_TYPE_OPTIONS: DriveTypeOption[] = [
  { value: 'DNP', description: 'Drives not printed at all' },
  { value: 'DMNP', description: 'Drives modified not printed' },
  { value: 'DMAP', description: 'Drives modified and printed' }
];

export interface DriveSheetPrintStatusFilter {
  status?: string;
  driveDate?: string;
  search?: string;
}

export interface FilterChip {
  key: string;
  label: string;
  value: string;
}

export interface StatusOption {
  value: string;
  label: string;
}

export const STATUS_OPTIONS: StatusOption[] = [
  { value: 'CNFRM', label: 'Confirm' },
  { value: 'HOLD', label: 'Hold' },
  { value: 'CANCL', label: 'Cancel' }
];
