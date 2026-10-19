/**
 * Model interfaces for Tubes Check-In Query (RGTUBEQ)
 */

// Standard API response wrapper
export interface ReturnResult<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data: T | null;
  errorCode?: string | null;
  errorResponse?: {
    errorCode: string;
    error: string;
  } | null;
}

// Contract dropdown option (matches ContractDropdownDto from backend)
export interface ContractOption {
  contractId: string;
  company: string;
}

// Batch dropdown option (matches TubesCheckinBatchDropdownDto from backend)
export interface BatchOption {
  batchId: string;
  checkinDate?: string;
}

// Tube check-in record (matches TubesCheckinQueryResultDto from backend)
export interface TubeCheckinRecord {
  unitId: string;
  cbcUnitId?: string | null;
  checkDigit?: string | null;
  batchId?: string | null;
  checkinDate?: string | null;
  red1Flag?: string | null;
  red2Flag?: string | null;
  purple1Flag?: string | null;
  purple2Flag?: string | null;
  profileSetId?: string | null;
  profileSeqNo?: number | null;
  tubeProfileSetId?: string | null;
}

// Profile set option
export interface ProfileSetOption {
  profileSetId: string;
  profileDesc?: string;
  profileType?: string;
  termDate?: string | null;
}

// Profile test (matches backend response from API docs)
export interface ProfileTest {
  testId: string;
  testDesc?: string;
}

// Additional test (matches AdditionalTestDto from backend)
export interface AdditionalTest {
  testId: string;
  testDesc?: string;
}

// Main query response data (matches TubesCheckinQuerySummaryDto from backend)
export interface TubesCheckinQueryResponse {
  tubes: TubeCheckinRecord[];
  totalCount: number;
  unitCount: number;
  companyName?: string | null;
  centerId?: string | null;
  contractId: string;
  batchId?: string | null;
  profileSetId?: string | null;
}
