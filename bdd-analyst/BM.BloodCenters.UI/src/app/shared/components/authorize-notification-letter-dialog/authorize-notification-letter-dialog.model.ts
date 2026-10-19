export type NotificationLetterMode = 'USER' | 'SUPER';

export interface AuthorizeNotificationLetterDialogData {
  donorId: string;
  letterSeqNo?: string;
  donationType?: string;
  procedureCode?: string;
  interCode?: string;
  unitId?: string;
  lastDonationDate?: string;
  mode: NotificationLetterMode;
}

export interface AuthorizeNotificationLetterResult {
  authorized: boolean;
  rejected: boolean;
}

export interface NotificationLetterDto {
  donorId: string;
  letterSeqNo: string;
  letterId: string;
  letterCode: string;
  letterText: string;
  letterTitle: string;
  authorizationStatus?: string;
  authorizationDate?: string;
  authorizationUser?: string;
  rejectionDate?: string;
  rejectionUser?: string;
  rejectionReason?: string;
  isModified: boolean;
  donorInfo?: DonorInfoDto;
}

export interface DonorInfoDto {
  donorId: string;
  name: string;
  dateOfBirth?: string;
  sex?: string;
  aboType?: string;
  address?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  homePhone?: string;
  workPhone?: string;
  donationType?: string;
  procedureCode?: string;
  salutation?: string;
  lastDonationDate?: string;
  signature?: string;
}

/**
 * Letter dropdown item from VALID_NOTIFIC_LETTERS table
 * Backend Column Mapping:
 * - letterId -> LETTER_ID (10 chars) - Primary key identifier
 * - letterCode -> LETTER_CODE (10 chars) - Letter code (displayed to user)
 * - letterTitle -> LETTER_TITLE (100 chars) - Letter title
 * - letterCategory -> DOCUMENT_TYPE (1 char) - Letter category
 * - donationType -> DONATION_TYPE - Donation type (e.g. AL, WB)
 * - interCode -> INTER_CODE - Interdiction code (e.g. HBV, HCV)
 *
 * Note: The same letterId can appear multiple times with different
 * donationType/interCode combinations. Results are ordered by letterId, donationType.
 */
export interface LetterDropdownDto {
  /** Letter ID (primary key) - maps to LETTER_ID column */
  letterId: string;
  /** Letter code - maps to LETTER_CODE column */
  letterCode: string;
  /** Letter title - maps to LETTER_TITLE column */
  letterTitle: string;
  /** Letter category - maps to DOCUMENT_TYPE column */
  letterCategory?: string;
  /** Donation type (e.g. AL, WB) - maps to DONATION_TYPE column */
  donationType?: string;
  /** Interdiction code (e.g. HBV, HCV) - maps to INTER_CODE column */
  interCode?: string;
}

export interface AuthorizeLetterRequestDto {
  donorId: string;
  letterSeqNo: string;
  donationsViewed: boolean;
  interdictionsViewed: boolean;
  comments?: string;
}

export interface AuthorizeLetterResponseDto {
  donorId: string;
  letterSeqNo: string;
  authorizationStatus: string;
  authorizationDate: string;
  authorizationUser: string;
}

export interface RejectLetterRequestDto {
  donorId: string;
  letterSeqNo: string;
  rejectionReason?: string;
}

export interface RejectLetterResponseDto {
  donorId: string;
  letterSeqNo: string;
  authorizationStatus: string;
  rejectionDate: string;
  rejectionUser: string;
  rejectionReason?: string;
}

export interface SaveLetterRequestDto {
  donorId: string;
  letterCode: string;
  letterText: string;
  donationsViewed: boolean;
  interdictionsViewed: boolean;
  modifyInd: 'Y' | 'N';  // Y = modified from template, N = not modified
  interCode?: string;
  unitId?: string;
}

export interface SaveLetterResponseDto {
  donorId: string;
  letterSeqNo: string;
  chapterId: string;
  insertDate: string;
  insertUser: string;
  programId: string;
}

export interface UpdateLetterTextRequestDto {
  letterText: string;
}

export interface UpdateLetterTextResponseDto {
  donorId: string;
  letterSeqNo: string;
  letterText: string;
  isModified: boolean;
}

/**
 * Letter template from VALID_LETTERS table
 * Backend Column Mapping:
 * - letterId -> LETTER_ID (10 chars) - Primary key identifier
 * - letterCode -> LETTER_CODE (10 chars) - Letter code
 * - letterTitle -> LETTER_TITLE (100 chars) - Letter title
 * - letterTemplate -> LETTER_CONTENT (CLOB) - Actual letter template text content
 * - letterCategory -> DOCUMENT_TYPE (1 char) - Letter category
 */
export interface LetterTemplateDto {
  /** Letter ID (primary key) - maps to LETTER_ID column */
  letterId: string;
  /** Letter code - maps to LETTER_CODE column */
  letterCode: string;
  /** Letter title - maps to LETTER_TITLE column */
  letterTitle: string;
  /** Letter template text - maps to LETTER_CONTENT CLOB column */
  letterTemplate: string;
  /** Letter category - maps to DOCUMENT_TYPE column */
  letterCategory?: string;
}
