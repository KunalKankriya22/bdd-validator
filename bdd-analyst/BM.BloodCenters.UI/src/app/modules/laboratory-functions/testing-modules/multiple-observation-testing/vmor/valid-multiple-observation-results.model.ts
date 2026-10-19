// ── API DTOs ──────────────────────────────────────────────────────

export interface VmorTestDto {
  testId: string;
  testDesc: string;
}

export interface VmorBandResultDto {
  testId: string;
  result: string;
  resultDesc: string;
  resultSeq: number;
}

export interface VmorSaveRequestDto {
  testId: string;
  bandResults: { result: string; resultDesc: string }[];
}

// Outer API response wrapper
interface ApiInnerResponse<T> {
  success: boolean;
  error: null | string;
  statusCode: number;
  message: string;
  data: T;
  total: number;
}

interface ApiOuterResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data: ApiInnerResponse<T>;
}

export type VmorTestsApiResponse = ApiOuterResponse<VmorTestDto[]>;
export type VmorBandResultsApiResponse = ApiOuterResponse<VmorBandResultDto[]>;
export type VmorSaveApiResponse = ApiOuterResponse<VmorBandResultDto[]>;

// ── UI model ──────────────────────────────────────────────────────

export interface VmorTestItem {
  testId: string;
  description: string;
}

export interface VmorRow {
  sequence: number;
  result: string;
  description: string;
}
