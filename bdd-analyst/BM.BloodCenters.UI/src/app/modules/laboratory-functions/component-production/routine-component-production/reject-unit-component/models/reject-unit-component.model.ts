/**
 * Models for Reject Unit/Component Feature
 * JIRA: MLT-13008
 * Form: CPIREJ
 * Mnemonic: REJECT
 *
 * Endpoints: /api/reject-component/*
 * Headers: X-ChapterId, X-WareHouseId (set automatically by auth interceptor)
 */

// ── Standard API Response ──

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T[];
  total?: number;
}

// ── GET /reject-component/validate-unit/{unitId} ──

export interface UnitValidationResponseDto {
  unitId: string;
  collDate: string;
  chapterId: string;
  warehouseId: string | null;
  catalogNumber: string | null;
  abo: string | null;
  isPheresisUnit: boolean;
  isBioHazard: boolean;
  codeScheme: string;
  rejectableComponentsCount: number;
  unusedBagsCount: number;
  rejectableProducts: RejectableProductDto[];
}

// ── GET /reject-component/product-codes/{unitId} ──

export interface RejectableProductDto {
  productCode: string;
  productDescription: string;
  productType: string;
  componentPrefix: string;
  bagId: string;
}

// ── GET /reject-component/components/{unitId}/{productCode} ──

export interface ComponentForRejectionDto {
  unitId: string;
  collDate: string;
  productCode: string;
  productDescription: string | null;
  componentPrefix: string;
  rejectReasonCode: string | null;
  rejectReasonDescription: string | null;
  isRejected: boolean;
  catalogNumber: string | null;
}

// ── GET /reject-component/rejection-reasons ──

export interface RejectReasonDto {
  code: string;
  description: string;
  interdictionCode: string | null;
}

// ── GET /reject-component/catalog-numbers/{unitId}?productType=X ──

export interface CatalogNumberDto {
  catalogNumber: string;
}

// ── GET /reject-component/validate-product/{unitId}/{productCode} ──

export interface ValidateProductCodeResponseDto {
  productCode: string;
  productDescription: string;
  productType: string;
  pheresisFlag: string;
  isValid: boolean;
  errorCode: string | null;
  errorMessage: string | null;
}

// ── GET /reject-component/abo-labels?codeScheme=C ──

export interface AboLabelDto {
  aboLabel: string;
  aboShortName: string;
}

// ── POST /reject-component/reject ──

export interface RejectComponentRequestDto {
  unitId: string;
  collDate: string;
  chapterId: string;
  productCode: string;
  componentPrefix: string;
  rejectReasonCode: string;
  catalogNumber: string;
  warehouseId: string;
  isNewProduct: boolean;
  systemLabelDecision: string | null;
}

export interface RejectComponentResponseDto {
  success: boolean;
  message: string;
  statusCode: number;
  item: boolean;
  errorResponse: {
    errorCode: string;
    error: string;
  };
}

// ── POST /components-made-from-unit/reprint-label ──

export interface ReprintLabelRequestDto {
  unitId: string;
  productCode: string;
  productType: string;
  collDate: string;
}

export interface ReprintLabelResponseDto {
  unitId: string;
  productCode: string;
  productDesc: string | null;
  productType: string | null;
  collDate: string;
  expiryDate: string | null;
  cmvStatus: string | null;
  preprintedLabel: boolean;
  timeLimitWarning: string | null;
}

// ── UI Display Models ──

export interface RejectedComponentDisplay {
  unitId: string;
  productCode: string;
  rejectReasonCode: string;
  catalogNumber: string;
  verifyProduct: string;
  verifyUnitId: string;
  label: string;
}
