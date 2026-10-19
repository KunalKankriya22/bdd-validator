/**
 * Alternate ID Donor Grade - Database entity
 */
export interface AlternateIdDonorGrade {
  keyDataGrade: string;
  altidMatchType: string;
  finalGrade: string;
  effDate: Date;
  termDate?: Date;
  programId: string;
  insertDate: Date;
  insertUser: string;
  auditKey: number;
}

/**
 * Alternate ID Form - DTO for add/edit operations
 */
export interface AlternateIdForm {
  keyDataGrade: string;
  altidMatchType: string;
  finalGrade: string;
  effDate: string;
  termDate?: string;
}

/**
 * Search/Filter parameters
 */
export interface AlternateIdSearchParams {
  keyDataGrade?: string;
  altidMatchType?: string;
  finalGrade?: string;
  effDatePeriod?: 'After' | 'Before';
  effDate?: Date;
  termDatePeriod?: 'After' | 'Before';
  termDate?: Date;
  searchText?: string;
}

/**
 * Dropdown option interface
 */
export interface DropdownOption {
  value: string;
  label: string;
}

/**
 * API Response structure matching backend ReturnResult<T>
 */
export interface AlternateIdApiResponse {
  success: boolean;
  message?: string;
  statusCode?: number;
  errorCode?: string;
  data?: AlternateIdDonorGrade[];
  item?: AlternateIdDonorGrade;
  total?: number;
  error?: string;
  errorResponse?: {
    errorCode?: string;
    error?: string;
  };
}

/**
 * API Request for Create operations
 */
export interface AlternateIdCreateRequest {
  keyDataGrade: string;
  altidMatchType: string;
  finalGrade: string;
  effDate: string; // ISO date string
  termDate?: string; // ISO date string
}

/**
 * API Request for Update operations
 */
export interface AlternateIdUpdateRequest {
  auditKey: number;
  keyDataGrade: string;
  altidMatchType: string;
  finalGrade: string;
  effDate: string; // ISO date string
  termDate?: string; // ISO date string
}

/**
 * Query DTO for filtering/searching (sent as POST body)
 */
export interface AlternateIdQueryDto {
  searchText?: string;
  keyDataGrade?: string;
  altidMatchType?: string;
  finalGrade?: string;
  showTerminated?: boolean;
  effDate?: string;
  effDatePeriod?: string;
  termDate?: string;
  termDatePeriod?: string;
  sortDirection?: string;
}

/**
 * Static dropdown options (grades 1-9)
 */
export const KEY_GRADE_OPTIONS: DropdownOption[] = [
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
  { value: '4', label: '4' },
  { value: '5', label: '5' },
  { value: '6', label: '6' },
  { value: '7', label: '7' },
  { value: '8', label: '8' },
  { value: '9', label: '9' },
];

export const ALTID_MATCH_TYPE_OPTIONS: DropdownOption[] = [
  { value: 'DIFF', label: 'Different' },
  { value: 'SAME', label: 'Same' },
  { value: 'SIMM', label: 'Similar' },
];

export const FINAL_GRADE_OPTIONS: DropdownOption[] = [
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
  { value: '4', label: '4' },
  { value: '5', label: '5' },
  { value: '6', label: '6' },
  { value: '7', label: '7' },
  { value: '8', label: '8' },
  { value: '9', label: '9' },
];
