export interface ValidateUnitRequest {
  unitId: string;
  labelType: string;
  codeScheme?: string;
}

export interface ValidateUnitResponse {
  unitId: string;
  collDate: string | null;
  donorDecisionCode: string | null;
  systemLabelDecision: string | null;
  contractId: string | null;
  codeScheme: string | null;
  components: UnitComponent[] | null;
}

export interface UnitComponent {
  productCode: string;
  productDescription: string | null;
  componentPrefix: string | null;
  componentStatus: string | null;
}

export interface ProcessLabelRequest {
  unitId: string;
  labelType: string;
  productCode: string;
  overrides: string[] | null;
}

export interface ProcessLabelResponse {
  unitId: string;
  collDate: string | null;
  productCode: string | null;
  productDescription: string | null;
  productType: string | null;
  label: string | null;
  expiryDate: string | null;
  rejectReasonCode: string | null;
  identifierCode: string | null;
  codeScheme: string | null;
  lifeSpanInd: string | null;
  specialTestingCode: string | null;
  requiresSpecialTesting: boolean;
  isMfProduct: boolean;
  status: 'OK' | 'WARNING';
  warnings: WarningDto[];
}

export interface WarningDto {
  code: string;
  message: string;
}

export interface VerifyLabelRequest {
  unitId: string;
  productCode: string;
  labelType: string;
  expectedLabel: string | null;
  expectedExpiryDate: string | null;
  expectedCollDate: string | null;
  expectedSpecialTestingCode: string | null;
  identifierCode: string | null;
  codeScheme: string | null;
  scannedUnitId: string | null;
  scannedAbo: string | null;
  scannedProductCode: string | null;
  scannedExpirationDate: string | null;
  scannedCollectionDate: string | null;
  scannedSpecialTestingCode: string | null;
}

export interface VerifyLabelResponse {
  unitIdMatch: boolean;
  aboMatch: boolean;
  productCodeMatch: boolean;
  dateMatch: boolean;
  specialTestingMatch: boolean;
  verificationComplete: boolean;
  requiresSpecialTesting: boolean;
  dateFieldType: string | null;
  mismatchErrorCode: string | null;
  mismatchField: string | null;
}

export interface LabelTypeOption {
  code: string;
  description: string;
}

export interface PrinterConfigResponse {
  configured: boolean;
  printerId?: string;
  printerName?: string;
  labelProgram?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message?: string;
  item?: T;
  data?: T[];
  errorCode?: string;
  errorResponse?: { errorCode: string; error: string };
}

export type ScreenPhase = 'ready' | 'unit-validated' | 'labeled' | 'verifying';
