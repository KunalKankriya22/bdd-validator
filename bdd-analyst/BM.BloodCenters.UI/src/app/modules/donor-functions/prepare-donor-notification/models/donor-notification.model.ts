export type SearchType = 'Pending' | 'InterCD' | 'LetterID' | 'DonorID' | 'UnitID' | 'Reinst' | 'All';

export type NotificationStatus =
  | 'AUTNO'
  | 'NOLET'
  | 'AUTHZ'
  | 'AUTCM'
  | 'NOTFY'
  | 'CMBLT'
  | null;

export interface SearchTypeOption {
  value: SearchType;
  label: string;
  requiresCode: boolean;
  codePlaceholder?: string;
  codeDescriptionLabel?: string;
}

export interface DonorNotificationSearchResult {
  donorId: string;
  donorName: string;
  lastDonationType: string;
  lastProcCode: string;
  lastUnitId: string;
  lastDonationDate: string;
  interCode: string;
  interEffDate: string;
  unitId: string;
  letterSeqNo: string | null;
  letterId: string | null;
  notificationStatus: NotificationStatus;
  chapterId: string;
  otherInterdictionCount: number;
}

export interface DonorDetailsDto {
  donorId: string;
  workPhone: string | null;
  homePhone: string | null;
  mobilePhone: string | null;
  address: string | null;
  preferredContactFlag: string | null;
}

export interface SearchDonorNotificationRequestDto {
  searchType: SearchType;
  code?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  includeNotified?: 'Y' | 'N';
  exclusive?: 'Y' | 'N';
  notificationStatus?: string | null;
  sortColumn?: string | null;
  sortOrder?: string | null;
}

export interface SearchDonorNotificationResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: DonorNotificationSearchResult[];
  total: number;
}

export type DonorNotificationRowAction =
  | 'send-letter'
  | 'mark-no-letter'
  | 'communication-log'
  | 'interdictions'
  | 'test-results'
  | 'attributes'
  | 'demographics';

export interface MarkNoLetterRequestDto {
  donorId: string;
  interCode: string;
  unitId?: string | null;
  userComment: string;
  mode: 'USER';
}

export interface ApiSuccessResponse {
  success: boolean;
  statusCode: number;
  message: string;
}

export interface LovCodeDto {
  code: string;
  description: string;
}
