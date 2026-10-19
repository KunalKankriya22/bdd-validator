export type SearchType =
  | 'All'
  | 'InterCD'
  | 'LetterID'
  | 'DonorID'
  | 'UnitID'
  | 'Pending'
  | 'Auth'
  | 'Reinst';

export type NotificationStatus =
  | 'AUTNO'
  | 'NOLET'
  | 'AUTHZ'
  | 'AUTCM'
  | 'NOTFY'
  | 'CMBLT'
  | 'REJECT'
  | null;

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

export interface DonorNotificationSearchResult {
  donorId: string;
  donorName: string;
  lastDonationType: string | null;
  lastProcCode: string | null;
  lastUnitId: string | null;
  lastDonationDate: string | null;
  interCode: string | null;
  interEffDate: string | null;
  unitId: string | null;
  letterSeqNo: string | null;
  letterId: string | null;
  notificationStatus: NotificationStatus;
  chapterId: string;
  otherInterdictionCount: number;
}

export interface AuthorizeDonorDetailsDto {
  donorId: string;
  workPhone: string | null;
  homePhone: string | null;
  mobilePhone: string | null;
  address: string | null;
  preferredContactFlag: string | null;
}

export interface SearchDonorNotificationResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: DonorNotificationSearchResult[];
  total: number;
}

export interface MarkNoLetterRequestDto {
  donorId: string;
  interCode: string;
  unitId?: string | null;
  userComment: string;
  mode?: 'USER' | 'SUPER';
}

export interface ApproveNoLetterRequestDto {
  donorId: string;
  interCode: string;
  unitId?: string | null;
  supervisorComment: string;
}

export interface DonorCommunicationDto {
  donorId: string;
  donorName: string;
  chapterId: string;
  comCode: string;
  comDate: string;
  comType: string;
  comDesc: string;
  programId: string | null;
  insertUser: string;
  insertDate: string;
}

export interface DonorCommunicationsResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: DonorCommunicationDto[];
  totalCount: number;
}

export interface ApiSuccessResponse {
  success: boolean;
  statusCode: number;
  message: string;
}

export type DonorNotificationRowAction =
  | 'authorize-letter'
  | 'mark-no-letter'
  | 'communication-log'
  | 'interdictions'
  | 'test-results'
  | 'attributes'
  | 'demographics';

export interface DonorNotificationFilters {
  searchType: SearchType;
  code?: string;
  startDate?: Date | null;
  endDate?: Date | null;
  includeNotified: boolean;
}

export interface PaginationState {
  pageIndex: number;
  pageSize: number;
  totalRecords: number;
}

export interface SearchTypeOption {
  value: SearchType;
  label: string;
  requiresCode: boolean;
  codePlaceholder?: string;
  codeDescriptionLabel?: string;
}

export interface LovCodeDto {
  code: string;
  description: string;
}
