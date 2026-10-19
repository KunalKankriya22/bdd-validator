export interface LabInterdictionOverrideModel {
  auditKey: number;
  donorDecisionCode: string;
  decisionDesc: string;
  productType: string;
  prodTypeDesc: string;
  interCode: string;
  interDescription: string;
  interType: string;
  overrideDesc: string;
  effDate: string;
  termDate?: string;
  lastModifiedDate?: string;
  programId?: string;
  moveDate?: string;
  user?: string;
  choose?: string;
}

export interface DropdownOption {
  key: string;
  value: string;
}

export interface LabInterdictionFilterDropdownData {
  cueOptions: DropdownOption[];
  typeOptions: DropdownOption[];
}

export interface LabInterdictionOverrideFilterValue {
  donorDecisionCode?: string | null;
  donorDecisionCodeDisplay?: string | null;
  interType?: string | null;
  interTypeDisplay?: string | null;
  effectiveDate?: string | null;
  effectiveDatePeriod?: string | null;
  terminationDate?: string | null;
  terminationDatePeriod?: string | null;
}

export interface LabInterdictionOverrideParamsDto {
  donorDecisionCode?: string | null;
  interType?: string | null;
  effectiveDate?: string | null;
  effectiveDatePeriod?: string | null;
  terminationDate?: string | null;
  terminationDatePeriod?: string | null;
  searchText?: string;
  sortOrder?: string;
  sortColumn?: string;
  skip?: number;
  take?: number;
}

export interface VerifyInterdictionRequest {
  auditKeys: number[];
}

export interface VerifyInterdictionResponse {
  success: boolean;
  verifiedCount: number;
  errors: string[];
  verifiedAuditKeys: number[];
  failedAuditKeys: number[];
}
