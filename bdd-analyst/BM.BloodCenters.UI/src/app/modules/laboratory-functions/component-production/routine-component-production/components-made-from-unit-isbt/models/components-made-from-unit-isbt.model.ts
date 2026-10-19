export interface ProductTypeItem {
  productTypeCode: string;
  productTypeDesc: string;
  weightRequired: string;
  attribFlag: string;
}

export interface AttributeItem {
  attribCode: string;
  attribDesc: string;
}

export interface CatalogNumberItem {
  catalogNumber: string;
}


export interface UnitValidationResult {
  collDate: string;
  bagCode?: string;
  bagCount: number;
  addOnBags: number;
  lotNumber?: string;
  catalogNumber?: string;
  bleedStartTime?: string;
  bleedEndTime?: string;
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
  catalogNumber: string;
  productCode: string;
  productDesc?: string;
  productType?: string;
  verifyProduct?: string;
  weight?: number;
  volume?: number;
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
  componentWeight?: number;
  verifyProductCode?: string;
}

export interface ComponentCreateResponseData {
  UnitId: string;
  ProductCode: string;
  CatalogNumber: string;
  Weight?: number;
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
