export interface ProductTypeItem {
  productTypeCode: string;
  productTypeDesc: string;
  weightRequired: string;
  attribFlag: string;
}

export interface AttributeItem {
  attribCode: string;
  attribDesc: string;
  interCode?: string;
}

export interface CatalogNumberItem {
  catalogNumber: string;
}

export interface UnitValidationResult {
  unitId: string;
  collDate: string;
  buc: number;
  bagCode?: string;
  bagCount: number;
  addOnBags: number;
  lotNumber?: string;
  catalogNumber?: string;
  bleedStartTime?: string;
  bleedEndTime?: string;
  contractId?: string;
  proc?: string;
  presentComponents: number;
  totalComponents: number;
  canAddComponent: boolean;
}

export interface ProductDeterminationResult {
  productCode?: string;
  productDesc?: string;
  productShortName?: string;
  specificGravity?: number;
  isMultiple: boolean;
  productOptions?: ProductCodeOption[];
  timeLimitWarning?: string;
  labelPrintRequired?: boolean;
  cmvStatus?: string;
}

export interface ProductCodeOption {
  productCode: string;
  productDesc?: string;
  productShortName?: string;
  specificGravity?: number;
}

export interface ComponentRow {
  unitId: string;
  buc: number;
  catalogNumber: string;
  productCode: string;
  productDesc?: string;
  productType?: string;
  verifyProduct?: string;
  volume?: number;
  weight?: number;
  anticoagVolume?: number;
  insertDats?: string;
  componentPrefix?: string;
}

export interface ComponentCreateRequest {
  unitId: string;
  collectionDate: string;
  productTypeCode: string;
  productCode: string;
  catalogNumber: string;
  attribCode?: string;
  bagsUsed?: number;
  volume?: number;
  componentWeight?: number;
  verifyProductCode?: string;
  anticoagVolume?: number;
}

export interface ComponentCreateResponseData {
  UnitId: string;
  ProductCode: string;
  CatalogNumber: string;
  Buc?: number;
  Weight?: number;
  Volume?: number;
  AnticoagVolume?: number;
  ExpiryDate?: string;
  ComponentPrefix?: string;
  CmvStatus?: string;
}

export interface ReprintLabelRequest {
  unitId: string;
  productCode: string;
  productType: string;
  collDate: string;
}

export interface ReprintLabelResponseData {
  unitId: string;
  productCode: string;
  productDesc?: string;
  productType: string;
  collDate: string;
  expiryDate?: string;
  cmvStatus?: string;
  preprintedLabel: boolean;
  timeLimitWarning?: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T[];
  total?: number;
  errorCode?: string;
  errorResponse?: {
    errorCode: string;
    error: string;
  };
}
