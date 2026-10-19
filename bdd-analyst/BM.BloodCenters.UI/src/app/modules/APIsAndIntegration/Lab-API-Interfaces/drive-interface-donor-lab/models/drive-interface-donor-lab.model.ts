export interface DriveInterfaceItem {
  sequence: number;
  driveId: string;
  driveDate: string;
}

export interface TransferByOption {
  code: string;
  description: string;
}

export interface DriveInterfaceFilters {
  chapterId: string;
  filterType: string;
  driveId: string;
  startDate: Date | null;
  endDate: Date | null;
  sortSequence?: string;
}

export interface TransferProcessStatus {
  status: 'idle' | 'processing' | 'success' | 'error';
  processStartTime?: Date;
  processEndTime?: Date;
  message?: string;
  currentDrive?: number;
  totalDrives?: number;
  processDuration?: string;
}

export interface ErrorResponse {
  errorCode: string;
  error: string;
}

export interface DriveInterfaceResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data?: DriveInterfaceItem[];
  total?: number;
  errorResponse?: ErrorResponse;
}

export interface TransferResponse {
  success: boolean;
  message: string;
  processStartTime?: string;
  processEndTime?: string;
}
