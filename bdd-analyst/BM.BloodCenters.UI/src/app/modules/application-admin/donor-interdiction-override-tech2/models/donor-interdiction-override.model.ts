export interface DonorInterdictionOverrideModel {
  audit_Key: number;
  donorDecisionCode: string;
  decisionDesc: string;
  productType: string;
  prodTypeDesc: string;
  attribGroup: string;
  attribCode: string;
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

export interface DonorInterdictionOverrideFilterValue {
  donorDecisionCode?: string;
  donorDecisionCodeDisplay?: string;
  interType?: string;
  interTypeDisplay?: string;
  effectiveDate?: string;
  terminationDate?: string;
  periodEffDate?: string;
  periodTermDate?: string;
}

export interface DonorInterdictionOverrideParamsDto {
  donorDecisionCode?: string;
  interType?: string;
  effectiveDate?: string;
  terminationDate?: string;
  searchText?: string;
  sortOrder?: string;
  sortColumn?: string;
  // Backend property names for period filters (Before/After)
  periodEffDate?: string;
  periodTermDate?: string;
  skip?: number;
  take?: number;
}

export interface VerifyInterdictionRequest {
  auditKeys: number[];
  userId?: string;
}

export interface VerifyInterdictionResponse {
  success: boolean;
  verifiedCount: number;
  errors: string[];
  verifiedAuditKeys: number[];
  failedAuditKeys: number[];
}

