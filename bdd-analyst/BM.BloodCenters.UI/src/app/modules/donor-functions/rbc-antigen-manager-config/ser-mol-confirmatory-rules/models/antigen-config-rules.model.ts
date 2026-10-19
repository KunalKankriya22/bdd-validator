export interface AntigenConfigRuleDetail {
  ruleId: number;
  testType: 'SER' | 'MOL';
  testId: string;
  licApproveFlag: string;
  noOfTests: number;
  effDate: string | null;
  termDate: string | null;
  insertDate?: string;
  insertUser?: string;
  programId?: string;
  auditKey?: number;
  primaryRuleId?: number;
  antigenCode?: string;
}

export interface AntigenConfigRule {
  primaryRuleId: number;
  antigenCode: string;
  antigenGroup: string;
  labelingAntigenCode: string;
  noOfUnits: number;
  effDate: string | null;
  termDate: string | null;
  programId?: string;
  chapterId?: string;
  auditKey?: number;
  details: AntigenConfigRuleDetail[];
  expanded?: boolean;
}

export interface AntigenConfigRulesSearchRequest {
  antigenGroup: string | null;
  antigenCode: string | null;
  showTerminated: 'Y' | 'N';
  chapterLocalDate?: string | null;
  searchText?: string | null;
  sortColumn?: string | null;
  sortDirection?: string | null;
}

export interface AntigenConfigRulesSearchResponse {
  success: boolean;
  message: string;
  error: string | null;
  errorCode: string | null;
  statusCode: number;
  data: AntigenConfigRule[];
  item: null;
  total: number;
}

export interface AntigenConfigRuleCreateRequest {
  primaryRuleId: number;
  antigenCode: string;
  antigenGroup: string;
  labelingAntigenCode: string;
  noOfUnits: number;
  effDate: string;
  termDate: string | null;
  details: AntigenConfigRuleDetailCreateRequest[];
}

export interface AntigenConfigRuleDetailCreateRequest {
  ruleId: number;
  testType: 'SER' | 'MOL';
  testId: string;
  licApproveFlag: string;
  noOfTests: number;
  effDate: string;
  termDate: string | null;
}

export interface AntigenConfigRuleUpdateRequest {
  primaryRuleId: number;
  termDate: string | null;
  details: null;
}

export interface ApiResponse {
  success: boolean;
  message: string;
  error: string | null;
  errorCode: string | null;
  statusCode: number;
  data: null;
  item: null;
  total: null;
}

export interface LookupValue {
  value: string;
  description?: string;
}

export interface TestIdOption {
  value: string;
  description?: string;
}

export interface LookupResponse {
  success: boolean;
  data: LookupValue[];
  total: number;
}

export interface FilterOption {
  antigenGroup: string;
  antigenCode: string;
}

export interface FilterOptionsResponse {
  success: boolean;
  data: FilterOption[];
  total: number;
}

export const TEST_TYPE_DISPLAY: Record<string, string> = {
  SER: 'Serological',
  MOL: 'Molecular',
};

export const LIC_APPROVE_FLAG_DISPLAY: Record<string, string> = {
  L: 'Licensed',
  U: 'Unlicensed',
  A: 'Approved',
};

export const SER_LIC_OPTIONS = [
  { value: 'L', label: 'L - Licensed' },
  { value: 'U', label: 'U - Unlicensed' },
];

export const MOL_LIC_OPTIONS = [
  { value: 'A', label: 'A - Approved' },
  { value: 'U', label: 'U - Unlicensed' },
];
