/**
 * Donor Communications Models
 * Based on API documentation for /donor-communications endpoints
 */

export interface DonorCommunication {
  donorId: string;
  sequenceNumber: number; // Auto-generated primary key component
  chapterId: string;
  comDate: string; // ISO date string
  comType: string;
  comTypeDesc?: string;
  comCode: string;
  comCodeDesc?: string;
  comDesc?: string; // Comments
  targetDate?: string; // ISO date string
  actionCode?: string;
  actionCodeDesc?: string;
  actionDate?: string; // ISO date string
  letterId?: string;
  insertDate: string; // ISO date string
  insertUser: string;
  userName?: string;
  // Additional fields from query endpoint
  name?: string;     // Donor name
  dob?: string;      // Date of birth
  sex?: string;      // Sex
  abo?: string;      // ABO blood type
}

export interface CreateDonorCommunicationDto {
  donorId: string;
  comDate: string; // ISO date string
  comType: string;
  comCode: string;
  comDesc?: string;
  actionCode?: string;
  targetDate?: string; // ISO date string
  actionDate?: string; // ISO date string
  letterId?: string;
}

export interface UpdateDonorCommunicationDto {
  comDesc?: string;
  actionCode?: string;
  targetDate?: string;
  actionDate?: string;
}

export interface CommunicationType {
  code: string;
  description: string;
}

export interface CommunicationCode {
  code: string;
  description: string;
}

export interface ActionCode {
  code: string;
  description: string;
  targetDays?: number;
}

export interface CommunicationLetter {
  letterId: string;
  letterCode?: string;
  letterTitle?: string;
  letterDate: string; // ISO date string
  authorizedBy?: string;
  comments?: string;
  letterText?: string;
}

export interface LetterCode {
  code: string;
  description: string;
  versionNumber?: string;
  versionDate?: string; // ISO date string
  letterText?: string;
}

/**
 * Donor header information for display
 */
export interface DonorHeader {
  name: string;
  dateOfBirth?: string; // ISO date string
  sex?: string;
  abo?: string;
}

/**
 * Dialog data interfaces
 */

export interface DonorCommunicationsDialogData {
  donorId: string;
  donorName?: string;
  dob?: string;
  sex?: string;
  abo?: string;
}

export interface AddCommunicationDialogData {
  mode: 'new' | 'details';
  donorId: string;
  communication?: DonorCommunication;
}

export interface ViewLettersDialogData {
  donorId: string;
}

export interface SendLetterDialogData {
  donorId: string;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}
