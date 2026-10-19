export type GroupMode = 'DRIVE' | 'COLL';

export interface GroupModeOption {
  code: GroupMode;
  description: string;
}

export interface GroupInterdictionLookupDto {
  code: string;
  description: string;
  extraValue?: string;
  driveDate?: string;
}

export interface DonationUnit {
  unitId: string;
  displayUnitId: string;
  driveId: string;
  collDate: string;
  setId: string;
  transactionId: string;
}

export interface DonationsResponse {
  donations: DonationUnit[];
  totalDonors: number;
}

export interface ValidInterdiction {
  interCode: string;
  interDesc: string;
  effDate: string;
  termDate: string;
  viewLevel: number;
}

export interface SelectableInterdiction {
  interCode: string;
  interDesc: string;
  effDate: string;
  termDate: string;
  viewLevel: number;
  selected: boolean;
}

export interface SelectInterdictionsPanelState {
  selectedTypeCode: string;
  selectedTypeDescription: string;
  searchText: string;
  selections: SelectableInterdiction[];
}

export interface GroupDonorRecord {
  donorId: string;
  name: string;
}

export interface SelectInterdictionsDialogData {
  existingCodes: string[];
}

export interface SelectInterdictionsDialogResult {
  selectedInterdictions: SelectableInterdiction[];
}

export interface RemoveInterdictionDialogData {
  interdictionCode?: string;
  interdictionDescription?: string;
  context?: 'donor' | 'donation';
}

export interface RemoveInterdictionDialogResult {
  confirmed: boolean;
  reasonCode: string;
  reasonDescription: string;
  comments?: string;
}

export interface GroupInterdictionParams {
  groupMode: string;
  groupValue: string;
}

export interface PlaceInterdictionRequest {
  groupMode: string;
  groupValue: string;
  interCodes: string[];
  commit: boolean;
}

export interface RemoveInterdictionRequest {
  groupMode: string;
  groupValue: string;
  interCodes: string[];
  termReason: string;
  commit: boolean;
}

export interface PlaceResultItem {
  unitId: string;
  interCode: string;
  status: string;
  success: boolean;
}

export interface PlaceInterdictionResponse {
  results: PlaceResultItem[];
  successCount: number;
  failureCount: number;
  totalUnits: number;
  totalInterCodes: number;
  committed: boolean;
}

export interface RemoveInterdictionResponse {
  results: PlaceResultItem[];
  successCount: number;
  failureCount: number;
  totalUnits: number;
  totalInterCodes: number;
  committed: boolean;
}

export interface ReturnResult<T> {
  success?: boolean;
  message?: string;
  error?: string;
  statusCode?: number;
  data?: T[];
  item?: T;
  total?: number;
}

export const GROUP_MODE_OPTIONS: GroupModeOption[] = [
  { code: 'DRIVE', description: 'Drive ID' },
  { code: 'COLL', description: 'Collection Date' }
];

// Donor Group Interdictions (Donors Tab)

export interface DonorRecord {
  donorId: string;
  donorName: string;
  unitId?: string;
  transactionId?: string;
  driveId?: string;
  collDate?: string;
  groupId?: string;
}

export interface DonorsResponse {
  donors: DonorRecord[];
  totalDonors: number;
}

export interface DonorGroupInterdictionParams {
  groupMode: string;
  groupValue: string;
  deferralChoice?: string;
}

export interface PlaceDonorInterdictionRequest {
  groupMode: string;
  groupValue: string;
  deferralChoice?: string;
  interCodes: string[];
  comments?: string;
  effectiveDate?: string;  // Format: YYYY-MM-DD
  userId?: string;
  programName?: string;
}

export interface RemoveDonorInterdictionRequest {
  groupMode: string;
  groupValue: string;
  deferralChoice?: string;
  interCodes: string[];
  termReason: string;
  comments?: string;
  termDate?: string;  // Format: YYYY-MM-DD
  userId?: string;
  programName?: string;
}

export interface DonorInterdictionResultItem {
  donorId: string;
  interCode: string;
  status?: string;
  errorMessage?: string;
  success?: boolean;
}

export interface DonorInterdictionResponse {
  results: DonorInterdictionResultItem[];
  successCount: number;
  failureCount: number;
  totalDonors: number;
  totalInterCodes: number;
}

export type DeferralChoice = 'D' | 'N' | 'B';

export interface DeferralChoiceOption {
  code: DeferralChoice;
  description: string;
}

export const DEFERRAL_CHOICE_OPTIONS: DeferralChoiceOption[] = [
  { code: 'D', description: 'Deferred' },
  { code: 'N', description: 'Not Deferred' },
  { code: 'B', description: 'Both' }
];

// Comment Models

export interface DonorGroupInterdictionComment {
  donorId: string;
  interCode: string;
  interType: string;
  comments: string | null;
  centralNote: string | null;
  insertDate: string;
  insertUser: string;
  effDate: string;
  termDate: string | null;
  groupMode: string;
  groupValue: string;
}

export interface DonorGroupInterdictionCommentQuery {
  groupMode: string;
  groupValue: string;
  interCode: string;
}

export interface AddDonorGroupInterdictionCommentRequest {
  groupMode: string;
  groupValue: string;
  interCode: string;
  comment: string;
  insertDate: string;
}
