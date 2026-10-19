/**
 * FastTrak Web Configuration Models
 */

import { Moment } from 'moment';

export interface DonorResponseConfiguration {
  onlineResponsesFlag: boolean;
  multiLanguageFlag: boolean;
  effectiveDate: Moment | null;
  terminationDate: Moment | null;
  auditKey: number | null;
}

export interface ValidHHResource {
  code: string;
  locationLink: string;
  description: string;
  effectiveDate: string;
  terminationDate: string | null;
}

export interface AddValidHHResourceRequest {
  codeType: 'Q' | 'O';
  code: string;
  locationLink: string;
  description: string;
  effectiveDate: string;           // ISO 8601 format (YYYY-MM-DD)
  terminationDate?: string | null; // ISO 8601 format (YYYY-MM-DD)
}

export interface UpdateValidHHResourceRequest {
  currentCode: string;
  currentLocationLink: string;
  currentEffectiveDate: string;    // ISO 8601 format (YYYY-MM-DD)
  locationLink: string;
  description: string;
  effectiveDate: string;           // ISO 8601 format (YYYY-MM-DD)
  terminationDate: string | null;  // ISO 8601 format (YYYY-MM-DD)
}

export interface CodeLookup {
  code: string;
  description: string;
}

/**
 * API Response Models
 */

// GET /donors/fastrack-web-configuration/donor-response-configuration
export interface DonorResponseConfigurationApiResponse {
  applId: string;
  donorResponseFlag: 'Y' | 'N';
  multiLangaugeFlag: 'Y' | 'N';
  effectiveDate: string; // ISO 8601 format
  terminationDate: string | null; // ISO 8601 format
  auditKey: number;
}

// GET /donors/fastrack-web-configuration/resource-configuration
export interface ResourceConfigurationApiResponse {
  o: CodeLookup[]; // 'Other' type codes
  q: CodeLookup[]; // 'Question' type codes
}

// POST /donors/fastrack-web-configuration/ValidHHResourceConfig
export interface RetrieveValidHHResourceConfigRequest {
  codeType: 'Q' | 'O';
  code: string;
  sort?: string;
}

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  error?: string | null;
  errorCode?: string | null;
  statusCode: number;
  data: T[] | null;
  item?: T | null;
  total: number;
}

// POST /donors/fastrack-web-configuration/donor-response-configuration
export interface SaveDonorResponseConfigRequest {
  donorResponseFlag: 'Y' | 'N';
  multiLangaugeFlag: 'Y' | 'N';
  effectiveDate: string;      // ISO 8601 format (YYYY-MM-DD)
  terminationDate?: string | null; // ISO 8601 format (YYYY-MM-DD)
  auditKey?: number | null;
}
