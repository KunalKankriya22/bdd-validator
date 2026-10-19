/**
 * Patient search result from API
 */
export interface PatientSearchResult {
  patId: string;
  patLastName: string;
  patFirstName: string;
  dob?: string; // ISO date string
  sex: string;
  surgId: string;
  surgDate: string; // ISO date string
  dateNeededBy?: string; // ISO date string
  shipToAddress: string;
  status: string; // 'A' = Active, 'I' = Inactive
  chapterId: string;
  auditKey: number;
}

/**
 * Patient model for UI display
 */
export interface PatientModel {
  patientId: string;
  patientName: string;
  dateOfBirth: string;
  sex: string;
  surgeryDate: string;
  neededBy: string;
  shipTo: string;
  status: 'Active' | 'Closed';
  surgId: string;
  phoneNumber?: string;
}

/**
 * Patient detail from API
 */
export interface PatientDetail {
  patId: string;
  patLastName: string;
  patFirstName: string;
  dateOfBirth?: string;
  sex: string;
  surgId: string;
  surgDate: string;
  surgeryDay: string;
  patTypeDescription: string;
  phoneNumber?: string;
}

/**
 * Search query DTO for API
 */
export interface PatientSearchQuery {
  SearchKeyword?: string | null;
  Status?: 'A' | 'I' | 'B' | null; // A=Active, I=Inactive, B=Both
  ShipTo?: string | null;
  SurgDate?: string | null; // yyyy-MM-dd
  SurgDatePeriod?: 'BEFORE' | 'AFTER' | null;
  NeededByDate?: string | null; // yyyy-MM-dd
  NeededByPeriod?: 'BEFORE' | 'AFTER' | null;
}

/**
 * Query parameters for patient search and filter (UI state)
 */
export interface PatientQueryParams {
  chapterId?: string;
  searchText?: string;
  status?: string;
  shipTo?: string;
  surgeryDate?: string;
  surgeryDatePeriod?: 'BEFORE' | 'AFTER';
  neededByDate?: string;
  neededByDatePeriod?: 'BEFORE' | 'AFTER';
  sortColumn?: string;
  sortOrder?: string;
}

/**
 * API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data?: T[];
  item?: T;
  total?: number;
  errorResponse: {
    errorCode: string;
    error: string;
  };
}

/**
 * API response for patient list
 */
export interface PatientListResponse {
  data: PatientModel[];
  totalCount: number;
}

/**
 * Ship location lookup option
 */
export interface ShipLocationOption {
  value: string;
  label: string;
}
