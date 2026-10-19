/**
 * HLA/RBC Request Query Models
 *
 * These interfaces define the data structures for HLA/RBC request queries,
 * matching the API contract from HlaRbcRequestQueryController.
 */

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  total?: number;
  data?: T[];
  error?: string;
  errorCode?: string;
}

// ============================================================================
// Request List (GET /hla-rbc-request-query)
// ============================================================================

export interface RequestListParams {
  searchText?: string;
  status?: string;
  fromDate?: string; // YYYY-MM-DD
  toDate?: string; // YYYY-MM-DD
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface RequestListItem {
  requestId: string;
  patientName: string;
  patientId: string;
  hospitalName: string;
  status: 'OPEN' | 'CLOSE';
  insertDate: string; // "2026-05-15 10:30:00"
  requestType: string; // "HLA" | "RBC" | "HLA PHENO" | etc.
}

// ============================================================================
// Request Details (GET /hla-rbc-request-query/{requestId})
// ============================================================================

export interface ExpectedTransfusionDate {
  date: string; // "05-20-2026"
  quantity: number;
}

export interface RequestDetails {
  requestId: string;
  patientName: string;
  patientId: string;
  hospital: string;
  requestType: string;
  donorCount: number;
  unitCount: number;
  lastSearchDateTime: string | null; // "2026-05-15 09:30:00"
  expectedTransfusionDates: ExpectedTransfusionDate[];
  unitRequest: 'Y' | 'N' | null;
  exactMatch: 'Y' | 'N' | null;
  status: 'OPEN' | 'CLOSE';
  hlaPheno: string | null;
  hlaAnti: string | null;
  rbcAnti: string | null;
  rbcPheno: string | null;
}

// ============================================================================
// Matched Donors (POST /hla-rbc-request-query/{requestId}/donors)
// ============================================================================

export interface DonorFilterParams {
  grades?: string; // Comma-separated: "A,B,C"
  maxGradeLevel?: number;
  sortBy?: 'grade' | 'gradeLevel';
  sortOrder?: 'ASC' | 'DESC';
}

export interface MatchedDonor {
  donorId: string;
  lastName: string;
  firstName: string;
  gender: string;
  grade: string;
  gradeLevel: number;
  pattern: string;
  bloodType: string;
  antigens: string;
  cmvStatus: string;
  selected: boolean;
}

// ============================================================================
// Matched Units (POST /hla-rbc-request-query/{requestId}/units)
// ============================================================================

export interface UnitFilterParams {
  grades?: string; // Comma-separated: "A,B,C"
  maxGradeLevel?: number;
  sortBy?: 'grade' | 'gradeLevel' | 'unitId';
  sortOrder?: 'ASC' | 'DESC';
  pattern?: string;
  abo?: string;
  antigens?: string;
}

export interface MatchedUnit {
  unitId: string;
  collectionDate: string; // "05-10-2026"
  donorId: string;
  grade: string;
  gradeLevel: number;
  match: string; // "EXACT" | "PARTIAL"
  bloodType: string;
  antigenString: string;
  warehouseCode: string;
  inventoryClass: string;
  productType: string;
  cmvStatus: string;
  selected?: boolean; // For UI selection
}

// ============================================================================
// UI-Specific Models
// ============================================================================

export type TabType = 'donors' | 'units';

export interface FilterValue {
  showGradeThrough?: string;
  grades?: string[]; // Array of grade codes
  level?: number;
  pattern?: string;
  abo?: string;
  antigens?: string;
}

export interface HLAPhenotypeDisplay {
  a1: string | number | null;
  a2: string | number | null;
  b1: string | number | null;
  b2: string | number | null;
}

export interface HLAAntibodiesDisplay {
  locus: string | null;
  antigen: string | null;
}

export interface RBCAntibodiesDisplay {
  antibody: string | null;
}

export interface RBCPhenotypeDisplay {
  antigen: string | null;
  testResult: string | null;
}

// Patient antigen/antibody data from Enter HLA RBC Request API
export interface PatientDetailResponse {
  patId: string;
  patLastName: string;
  patFirstName: string;
  sex: string | null;
  dob: string | null;
  aboType: string | null;
  status: string | null;
  comments: string | null;
  hlaAntigens: PatientHlaAntigens | null;
  hlaAntibodies: PatientHlaAntibody[] | null;
  rbcAntibodies: PatientRbcAntibody[] | null;
  rbcAntigens: PatientRbcAntigen[] | null;
}

export interface PatientHlaAntigens {
  a1: string | null;
  a2: string | null;
  b1: string | null;
  b2: string | null;
}

export interface PatientHlaAntibody {
  locus: string;
  epitopeId: string;
}

export interface PatientRbcAntibody {
  testId: string;
}

export interface PatientRbcAntigen {
  testId: string;
  resultCode: string | null;
}

export interface ScheduledDatesDisplay {
  targetDate: string | null;
  units: number | null;
}

export interface RequestDetailsDisplay {
  requestId: string;
  patientName: string;
  hospital: string;
  matchType: string;
  lastSearch: string | null;
  inventorySearch: boolean;
  exactMatch: boolean;
  hlaPhenoEnabled: boolean;
  hlaAntiEnabled: boolean;
  rbcAntiEnabled: boolean;
  rbcPhenoEnabled: boolean;
  hlaPheno: HLAPhenotypeDisplay | null;
  hlaAntiList: HLAAntibodiesDisplay[];
  rbcAntiList: RBCAntibodiesDisplay[];
  rbcPhenoList: RBCPhenotypeDisplay[];
  scheduledDates: ScheduledDatesDisplay[];
  status: 'OPEN' | 'CLOSE';
}

// ============================================================================
// List Generation Dialog Models
// ============================================================================

export type CallListStatus = 'ACTIVE' | 'CANCELLED' | 'RELEASED' | 'SCHEDULED' | 'SUBMITEXEC' | 'TOBROWSER';

export interface CreateCallListRequest {
  listName: string; // Required, max 50 chars
  listStatus?: string; // Optional, max 10 chars. Valid values: ACTIVE, CANCELLED, RELEASED, SCHEDULED, SUBMITEXEC, TOBROWSER
  shelfLife?: string; // Optional, yyyy-MM-dd format, must be >= today
  comments?: string; // Optional, max 240 chars
  selectedDonorIds: string[]; // Required, at least 1
}

export interface CreateCallListResult {
  listId: string;
  listSeq: number;
  donorsAdded: number;
}
