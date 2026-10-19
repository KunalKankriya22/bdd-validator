/**
 * Donors by Events Query - TypeScript Models
 * Generated from API Documentation
 * Base URL: /api/donor-search
 */

/**
 * Search type option
 */
export interface SearchTypeOption {
  code: string;
  description: string;
}

/**
 * Request DTO for donor search
 */
export interface DonorSearchRequestDto {
  searchType: string;
  startDate: Date | null;
  endDate: Date | null;
  code?: string | null;
  chapterId?: string | null;
  driveId?: string | null;
  includePinMailed?: boolean;
  take?: number;
  skip?: number;
  sortColumn?: string;
  sortDirection?: 'ASC' | 'DESC';
}

/**
 * Response DTO for donor search result
 */
export interface DonorSearchResultDto {
  donorId: string;
  donorName: string;
  ssn: string | null;
  dateOfBirth: Date | null;
  dobDay: string | null;
  gender: string | null;
  bloodType: string | null;
  totalDonations: number | null;
  totalCredits: number | null;
  totalGallons: number | null;
  lastDonationDate: Date | null;
  lastUnitId: string | null;
  homePhoneNo: string | null;
  dayPhoneNo: string | null;
  mobilePhone: string | null;
  donorAddress: string | null;
}

/**
 * Value code option for dropdown (Complaint, Request, Action, DonCorr)
 */
export interface ValueCodeOption {
  code: string;
  description: string;
}

/**
 * Drive LOV option for FirstTimeFixed dropdown
 */
export interface DriveLovOption {
  driveId: string;
  description: string;
  driveDate?: string | null;
  sponsorName?: string | null;
}

/**
 * API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T[];
  total?: number;
  errorResponse?: ErrorResponse;
}

/**
 * Error response structure
 */
export interface ErrorResponse {
  errorCode: string;
  error: string;
}

/**
 * Search types response — camelCase (Atlas framework serializes to camelCase)
 */
export interface SearchTypesResponse {
  success: boolean;
  data: SearchTypeOption[];
  message: string;
}

/**
 * Search type codes enum
 */
export enum SearchType {
  Action = 'Action',
  Complaint = 'Complaint',
  DonCorr = 'DonCorr',
  Request = 'Request',
  Reaction = 'Reaction',
  Credits = 'Credits',
  Units = 'Units',
  GallonDonors = 'GallonDonors',
  DOBYR = 'DOBYR',
  FirstTimeFixed = 'FirstTimeFixed'
}

/**
 * Search type configuration for validation rules
 */
export interface SearchTypeConfig {
  requiresCode: boolean;
  codeOptional: boolean;
  requiresNumericCode: boolean;
  requiresDriveId: boolean;
}

/**
 * Search type validation rules map
 */
export const SEARCH_TYPE_RULES: Record<string, SearchTypeConfig> = {
  [SearchType.Action]: {
    requiresCode: false,
    codeOptional: true,
    requiresNumericCode: false,
    requiresDriveId: false
  },
  [SearchType.Units]: {
    requiresCode: true,
    codeOptional: false,
    requiresNumericCode: true,
    requiresDriveId: false
  },
  [SearchType.Credits]: {
    requiresCode: true,
    codeOptional: false,
    requiresNumericCode: true,
    requiresDriveId: false
  },
  [SearchType.GallonDonors]: {
    requiresCode: true,
    codeOptional: false,
    requiresNumericCode: true,
    requiresDriveId: false
  },
  [SearchType.Reaction]: {
    requiresCode: true,
    codeOptional: false,
    requiresNumericCode: false,
    requiresDriveId: false
  },
  [SearchType.Complaint]: {
    requiresCode: false,
    codeOptional: true,
    requiresNumericCode: false,
    requiresDriveId: false
  },
  [SearchType.DonCorr]: {
    requiresCode: true,
    codeOptional: false,
    requiresNumericCode: false,
    requiresDriveId: false
  },
  [SearchType.Request]: {
    requiresCode: true,
    codeOptional: false,
    requiresNumericCode: false,
    requiresDriveId: false
  },
  [SearchType.DOBYR]: {
    requiresCode: false,
    codeOptional: false,
    requiresNumericCode: false,
    requiresDriveId: false
  },
  [SearchType.FirstTimeFixed]: {
    requiresCode: false,
    codeOptional: false,
    requiresNumericCode: false,
    requiresDriveId: true
  }
};
