export interface ProcessCodeDto {
  processCode: string;
  processCodeDesc: string;
}

export interface UnitDetailsDto {
  unitId: string;
  collectionDate: string;
  expirationDate: string;
  chapterId: string;
}

export interface ComponentEligibilityDto {
  componentPrefix: string;
  productCode: string;
  componentStatus: string;
  rejectReasonCode: string | null;
  systemLabelDecision: string | null;
  aboRh: string | null;
  expiryDate: string | null;
  productDescription: string | null;
}

export interface VerifyComponentSuitabilityRequest {
  processCode: string;
  unitId: string;
  componentPrefix?: string;
  processDats?: string;
  patientId?: string;
  overriddenWarnings?: string[];
}

export interface VerifyComponentSuitabilityResponse {
  unitId: string;
  processCode: string;
  componentPrefix: string | null;
  processTimestamp: string | null;
  verificationSuccess: boolean;
  message: string | null;
  status?: string;
  warnings?: WarningDto[];
}

export interface WarningDto {
  code: string;
  message: string;
}

export interface VerifyComponentSuitabilityApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  errorCode?: string;
  errorResponse?: {
    errorCode: string;
    error: string;
  };
}

export interface VerifiedEntry {
  unitId: string;
  product: string;
  aboRh: string;
  expirationDate: string;
  processDate: string;
}
