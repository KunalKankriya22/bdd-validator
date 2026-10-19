export interface PrinterConfigResponse {
  configured: boolean;
  printerId?: string;
  printerName?: string;
  labelProgram?: string;
  printerHost?: string;
  printerPort?: string;
  agPrinterId?: string;
  agPrinterName?: string;
  agPrinterHost?: string;
  agPrinterPort?: string;
}

export interface ChapterConfigResponse {
  chapterId: string;
  unitScheme?: string;
  qcReqdFlag?: string;
  nursingFlag?: string;
  chapterName?: string;
}

export interface ValidateUnitResponse {
  unitId: string;
  collDate: string;
  contractId?: string;
  contractType?: string;
  donorDecisionCode?: string;
  isReagent: boolean;
  components: ComponentDto[];
  interdictions: InterdictionDto[];
  attributes: AttributeDto[];
}

export interface ComponentDto {
  productCode: string;
  productDescription: string;
  componentPrefix: string;
  componentStatus: string;
  systemLabelDecision: string | null;
  bagsUsed: number;
}

export interface ProcessLabelResponse {
  labelDecision: string;
  labelDecisionDisplay: string;
  rhDisplay: string;
  intendedUse: string;
  identifierCode: string;
  testedAboCode: string;
  testedAboDescription: string;
  expiryDate: string | null;
  expiryDateDisplay: string | null;
  productType: string;
  specialTestingCode: string | null;
  barcodeValue: string | null;
  labelProductCode: string | null;
  isWarning: boolean;
  warningMessage: string | null;
  warningCode: string | null;
  doubleScanReqd: boolean;
  secondLabelDecision: string | null;
  secondLabelDecisionDisplay: string | null;
  secondRhDisplay: string | null;
  secondIntendedUse: string | null;
  donorDecisionCode: string | null;
  holdReasons: HoldReasonDto[];
  interdictions: InterdictionDto[];
  attributes: AttributeDto[];
}

export interface HoldReasonDto {
  holdCode: string;
  holdDescription: string;
  holdCategory: string;
}

export interface InterdictionDto {
  interCode?: string;
  interDescription: string;
  interType?: string;
  productCode?: string;
}

export interface AttributeDto {
  attribGroup?: string;
  attribCode?: string;
  attribDescription: string;
  showOnLabel?: string;
}

export interface ValidateUnitRequest {
  unitId: string;
  isAntigenMode: boolean;
}

export interface ProcessLabelRequest {
  unitId: string;
  collDate: string;
  productCode: string;
  componentPrefix: string;
  antigenSelections: null;
  agPrinterId?: string;
  overrides: string[] | null;
}

export interface ConfirmVerificationRequest {
  unitId: string;
  collDate: string;
  productCode: string;
  componentPrefix: string;
  labelDecision: string;
  expiryDate: string | null;
  identifierCode: string;
  testedAboCode: string | null;
  isMfgProduct: boolean;
}

export interface ReprintRequest {
  unitId: string;
  collDate: string;
  productCode: string;
  componentPrefix: string;
  labelDecision: string;
}

export interface BloodTypeDisplay {
  labelDecision: string;
  labelDecisionDisplay: string;
  rhDisplay: string;
  intendedUse: string;
}

export interface LovOption {
  code: string;
  description: string;
}

export interface AbandonedLabelRequest {
  unitId: string;
  collDate: string;
  productCode: string;
  componentPrefix: string;
  errorCode: string;
}

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message?: string;
  item?: T;
  data?: T;
  errorCode?: string;
  errorResponse?: {
    errorCode: string;
    error: string;
    message: string;
  };
}
