/**
 * Attach Donor Models
 * Models for the Attach Donor feature (DRUREHLD)
 * Based on API documentation from MLT-10498
 */

/**
 * Graded Donor DTO
 * Represents a potential donor match with mismatch indicators
 */
export interface GradedDonorDto {
  transactionId: string;
  donorId: string;
  dgmId: number | null;
  grade: number | null;
  potentialDuplicateFlag: string | null; // S=Selected, D=Duplicate, F=False Duplicate
  lastName: string;
  firstName: string;
  dateOfBirth: string | null;
  gender: string | null;
  chapterId: string;
  programId: string | null;
  lastNameMismatch: boolean;
  firstNameMismatch: boolean;
  dateOfBirthMismatch: boolean;
  genderMismatch: boolean;
}

/**
 * Graded Donation DTO
 * Represents the transaction details from GRADED_DONATIONS table
 */
export interface GradedDonationDto {
  transactionId: string;
  unitId: string | null;
  lastName: string | null;
  firstName: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  chapterId: string;
  activeFlag: string | null;
  programId: string | null;
  collectionDate?: string | null;
  enteredBy?: string | null;
}

/**
 * Select Donor Request DTO
 * Request body for POST /api/v1/attach-donor/select-donor
 */
export interface SelectDonorRequestDto {
  transactionId: string;
  donorId: string;
  selectedBy: string;
  chapterId: string;
  confirmationScan?: string;
}

/**
 * Mark Duplicate Request DTO
 * Request body for POST /api/v1/attach-donor/mark-duplicates
 */
export interface MarkDuplicateRequestDto {
  primaryDonorId: string;
  duplicateDonorIds: string[];
  transactionId: string;
  chapterId: string;
}

/**
 * Mark False Duplicate Request DTO
 * Request body for POST /api/v1/attach-donor/mark-false-duplicate
 */
export interface MarkFalseDuplicateRequestDto {
  donorId: string;
  transactionId: string;
  comments: string;
  chapterId: string;
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data?: T;
  errorCode?: string | null;
  errorResponse?: {
    errorCode: string | null;
    error: string;
  };
}

/**
 * Select Donor Response Data
 */
export interface SelectDonorResponseData {
  transactionId: string;
  donorId: string;
}

/**
 * Mark Duplicates Response Data
 */
export interface MarkDuplicatesResponseData {
  transactionId: string;
  donorCount: number;
}

/**
 * Donor search criteria for Find Donor dialog
 */
export interface DonorSearchCriteria {
  scanId?: string;
  donorId?: string;
  type?: string;
  alternateId?: string;
  lastName?: string;
  dateOfBirth?: string;
  sex?: string;
  firstName?: string;
}

/**
 * Donor search result (for Find Donor dialog table)
 */
export interface DonorSearchResult {
  donorId: string;
  lastName: string;
  firstName: string;
  dateOfBirth: string | null;
  sex: string | null;
  alternateId: string | null;
}

/**
 * Entry OK dropdown options
 */
export type EntryOkOption = 'Y' | 'N';

/**
 * Resolved status type
 */
export type ResolvedStatus = 'Not Resolved' | 'Resolved';

/**
 * Transaction type (Donation/Deferral)
 */
export type TransactionType = 'Donation' | 'Deferral';

export interface AddGradedDonorRequestDto {
  transactionId: string;
  donorId: string;
}

export interface AttachDonorContext {
  transactionId: string;
  unitId: string | null;
  transactionType: TransactionType;
  timestamp: number;
}
