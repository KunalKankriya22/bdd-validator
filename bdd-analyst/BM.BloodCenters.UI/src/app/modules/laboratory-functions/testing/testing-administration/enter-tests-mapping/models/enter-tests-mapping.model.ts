export interface ContractDropdownItem {
  contractId: string;
  company: string;
}

export interface TestDropdownItem {
  testGroup: string | null;
  testId: string;
  testDesc: string;
}

export interface TestMappingRow {
  testId: string;
  testDesc: string | null;
  cbcTestId: string | null;
  effDate: string | null;
  termDate: string | null;
  modifiedDate: string | null;
}

export interface TestMappingSaveRequest {
  contractId: string;
  rows: TestMappingRowPayload[];
}

export interface TestMappingRowPayload {
  testId: string;
  cbcTestId: string | null;
  effDate: string | null;
  termDate: string | null;
}

export interface SaveResponse {
  status: string;
  message: string;
  warnings: WarningItem[];
}

export interface WarningItem {
  code: string;
  message: string;
}
