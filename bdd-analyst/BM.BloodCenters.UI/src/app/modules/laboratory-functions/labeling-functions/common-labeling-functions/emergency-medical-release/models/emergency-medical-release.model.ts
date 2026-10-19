export interface ComponentDetailsDto {
  unitId: string;
  collDate: string;
  productCode: string;
  componentPrefix: string | null;
  systemLabelDecision: string | null;
  componentStatus: string | null;
  testedAbo: string | null;
  productCodeDesc: string | null;
  aboDescription: string | null;
  expiryDate: string | null;
  bleedStartTime: string | null;
  warehouseId: string | null;
  labelDats: string | null;
  labelUserId: string | null;
  calculatedExpiryDate: string | null;
  isReagentDonation: boolean;
  testedAboFromUtrs: string | null;
  testedAboDescription: string | null;
  bagCode: string | null;
}

export interface AboValueDto {
  aboLabel: string;
  aboShortName: string;
  testedAboCode: string;
  identifierCode: string;
  effDate: string;
  termDate: string | null;
}

export interface OverrideCodeDto {
  overrideCode: string;
  description: string;
  effDate: string;
  termDate: string | null;
}

export interface EmergencyProductDto {
  productCode: string;
  productDesc: string;
}

export interface EmergencyReleaseRequestDto {
  unitId: string;
  productCode: string;
  componentPrefix: string | null;
  abo: string;
  overrideCode: string;
  note: string | null;
  codeScheme: string | null;
  actualExpiryDate: string | null;
  bleedStartTime: string | null;
  expiryDate128: string | null;
  verifyUnitId: string | null;
  verifyProductCode: string | null;
  verifyExpiryDate: string | null;
}

export interface TestWarningDto {
  testId: string;
  testDesc: string | null;
  warningType: string;
  message: string;
}

export interface EmergencyReleaseResponseDto {
  unitId: string;
  productCode: string;
  componentPrefix: string | null;
  oldLabelDecision: string;
  newLabelDecision: string;
  overrideCode: string;
  overrideDats: string;
  overrideUserId: string;
  success: boolean;
  message: string;
  warnings: TestWarningDto[] | null;
  hasWarnings: boolean;
  isReagentDonation: boolean;
  hasInTransitInterdiction: boolean;
}

export interface ProcessEmergencyLabelRequestDto {
  unitId: string;
  productCode: string;
  componentPrefix: string | null;
  codeScheme: string | null;
  printerCode: string | null;
  overrides: string[];
}

export interface ValidationWarningDto {
  code: string;
  message: string;
}

export interface ProcessEmergencyLabelResponseDto {
  status: string;
  testedAbo: string | null;
  testedAboDescription: string | null;
  emergencyAboLabel: string | null;
  calculatedExpiryDate: string | null;
  bagCode: string | null;
  isReagentDonation: boolean;
  hasInTransitInterdiction: boolean;
  warnings: TestWarningDto[];
  validationWarnings: ValidationWarningDto[];
  hasWarnings: boolean;
  labelPrinted: boolean;
}

export interface EmergencyAbandonedLabelRequestDto {
  unitId: string;
  collDate: string | null;
  productCode: string | null;
  componentPrefix: string | null;
  errorCode: string | null;
}

export interface EmergencyMedicalReleaseApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  statusCode: number;
  errorCode?: string;
  errorResponse?: {
    errorCode: string;
    error: string;
  };
}
