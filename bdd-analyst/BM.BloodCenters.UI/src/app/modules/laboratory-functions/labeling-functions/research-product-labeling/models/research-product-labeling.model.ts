export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data: T;
  total?: number;
}

// ── Validate Unit ──

export interface ValidateUnitResponse {
  unitId: string;
  catalogNumber: string | null;
  collectionDate: string | null;
  chapterId: string | null;
  isValid: boolean;
  errorMessage: string | null;
  collDate: string;
  hasComponents: boolean;
  componentCount: number;
}

// ── Validate Product ──

export interface ValidateProductRequest {
  unitId: string;
  productCode: string;
  collectionDate: string;
  chapterId?: string | null;
  warehouseId?: string | null;
}

export interface ValidateProductResponse {
  productCode: string;
  catalogNumber: string | null;
  componentStatus: string | null;
  isValid: boolean;
  isLabeled: boolean;
  errorMessage: string | null;
}

// ── Research Types ──

export interface ResearchTypeDto {
  code: string;
  description: string;
}

// ── Research Products ──

export interface ResearchProductDto {
  productCode: string;
  productDesc: string;
  productType: string | null;
  unitSchemeType: string | null;
}

// ── Labeled Products (Original Product Code LOV) ──

export interface LabeledProductDto {
  productCode: string;
  productDesc: string | null;
}

// ── Validate Research Product ──

export interface ValidateResearchProductRequest {
  unitId: string;
  productCode: string;
  researchProductCode: string;
  collectionDate: string;
  catalogNumber?: string | null;
  chapterId?: string | null;
  warehouseId?: string | null;
}

// ── Catalog Numbers (Bag LOV) ──

export interface CatalogNumberDto {
  catalogNumber: string;
}

// ── Validate Catalog ──

export interface ValidateCatalogRequest {
  unitId: string;
  productCode: string;
  catalogNumber: string;
  productType?: string | null;
  chapterId?: string | null;
  warehouseId?: string | null;
}

// ── Biohazard Check ──

export interface BiohazardCheckRequest {
  unitId: string;
  collectionDate: string;
  productCode?: string | null;
  chapterId?: string | null;
}

export interface BiohazardCheckResponse {
  hasBiohazard: boolean;
  interdictionCode: string | null;
  interdictionType: string | null;
}

// ── Calculate Expiry ──

export interface CalculateExpiryRequest {
  unitId: string;
  collectionDate: string;
  productCode: string;
  productType?: string | null;
  chapterId?: string | null;
}

export interface CalculateExpiryResponse {
  expirationDate: string | null;
  lifeSpan: number | null;
  lifeSpanIndicator: string | null;
  source: string | null;
}

// ── Label Preview ──

export interface LabelPreviewRequest {
  unitId: string;
  productCode: string;
  researchTypeCode?: string | null;
  researchProductCode?: string | null;
  collectionDate: string;
  chapterId?: string | null;
}

export interface LabelPreviewResponse {
  line1: string;
  line2: string;
  line3: string | null;
  line4: string;
  testMessage: string | null;
  isTestMessageTooLong: boolean;
}

// ── Generate Label ──

export interface GenerateLabelRequest {
  unitId: string;
  productCode: string;
  researchTypeCode: string;
  researchProductCode?: string | null;
  collectionDate: string;
  catalogNumber?: string | null;
}

// ── Complete Relabeling ──

export interface CompleteRelabelingRequest {
  unitId: string;
  collectionDate: string;
  productCode?: string | null;
  researchProductCode: string;
  researchTypeCode: string;
  catalogNumber?: string | null;
  expirationDate: string;
  chapterId?: string | null;
}

export interface CompleteRelabelingResponse {
  success: boolean;
  message: string | null;
  unitId: string | null;
  researchProductCode: string | null;
}

// ── Chapter Config ──

export interface ChapterConfigDto {
  unitScheme: string | null;
  qcLabelFlag: string | null;
  nursingFlag: string | null;
}
