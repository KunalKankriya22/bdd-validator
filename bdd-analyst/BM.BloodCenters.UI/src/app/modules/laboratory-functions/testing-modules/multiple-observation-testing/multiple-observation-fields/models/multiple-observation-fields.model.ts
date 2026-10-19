// ── API DTOs ──────────────────────────────────────────────────────

export interface MofTestDto {
  testId: string;
  testDesc: string;
}

export interface MofTestTypeDto {
  testType: string;
  testTypeDesc: string;
}

export interface MofBandDto {
  testId: string;
  testType: string;
  bandSeq: number;
  bandName: string;
  effDate: string;
  termDate: string | null;
  lastModifiedDate: string | null;
}

export interface MofBandCreateDto {
  testId: string;
  testType: string;
  bandName: string;
  effDate: string;
  termDate: string | null;
}

export interface MofBandUpdateDto {
  bandName: string;
  effDate: string;
  termDate: string | null;
}

export interface MofResequenceDto {
  testId: string;
  testType: string;
  bandSequences: { oldBandSeq: number; newBandSeq: number }[];
}

// ── API response wrappers ────────────────────────────────────────

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

export type MofTestsApiResponse = ApiOuterResponse<MofTestDto[]>;
export type MofTestTypesApiResponse = ApiOuterResponse<MofTestTypeDto[]>;
export type MofBandsApiResponse = ApiOuterResponse<MofBandDto[]>;
export type MofBandApiResponse = ApiOuterResponse<MofBandDto>;

// ── UI models ────────────────────────────────────────────────────

export interface MofTestItem {
  testId: string;
  description: string;
}

export interface MofBandRow {
  bandSeq: number;
  bandName: string;
  effDate: string;
  termDate: string | null;
  lastModifiedDate: string | null;
  isNew: boolean;
}
