// API Request DTOs

export interface ChangeAttributeRequestDto {
  unitId: string;
  attributeCode: string;
  productType: string;
  attributeGroup?: string;
  oldProductCode?: string | null;
  newProductCode?: string | null;
  catalogNumber?: string | null;
  processDate?: string | null;
  collectionDate?: string | null;
  expirationDate?: string | null;
  changeReason?: string;
}

export interface ChangeProductCodeRequestDto {
  unitId: string;
  oldProductCode: string;
  newProductCode: string;
  productType: string;
  changeReason?: string;
}

// API Response DTOs

export interface UnitValidationResultDto {
  isValid: boolean;
  isModifiable: boolean;
  unitId: string | null;
  productType: string | null;
  productCode: string | null;
  productShortName: string | null;
  currentWarehouse: string | null;
  chapterId: string | null;
  collectionDate: string | null;
  componentInsertDate: string | null;
  bagId: string | null;
  hasInterdiction: boolean;
  interdictionReason: string | null;
  labelPrintRequired: boolean;
  errorCode: string | null;
  errorMessage: string | null;
}

export interface ValidAttributeDto {
  attributeCode: string;
  attributeDescription: string;
  attributeType: string; // M (Modifier), C (Conversion), or A (Add-only)
  attributeGroup: string;
  productType: string;
  unitSchemeType: string;
  catalogNumberEnabled: boolean;
  exclusivityFlag: string | null;
}

export interface ProductTypeDto {
  productType: string;
  description: string;
  effDate: string;
  termDate: string | null;
  isActive: boolean;
}

export interface ChangeAttributeResponseDto {
  success: boolean;
  unitId: string;
  message: string;
  auditId: string | null;
  errorCode: string | null;
  newExpiryDate?: string | null;
}

export interface ChangeProductCodeResponseDto {
  success: boolean;
  unitId: string;
  message: string;
  auditId: string | null;
  errorCode: string | null;
}

export interface ReprintLabelRequestDto {
  unitId: string;
  productCode: string;
  productType: string;
  oldProductCode: string;
  attributeGroup?: string;
  attributeCode?: string;
  processDate?: string | null;
  collectionDate?: string | null;
}

export interface ReprintLabelResponseDto {
  success: boolean;
  unitId: string;
  message: string;
  errorCode: string | null;
}

// Component Internal Models

export interface ComponentChangeEntry {
  unitId: string;
  productCode: string;
  derivedProductCode: string;
  shortName: string;
  processDate: string;
  catalogNumber: string;
  verifyProduct: string;
  expiryDate: string;
}

export interface ProductCodeOption {
  code: string;
  description: string;
}

export interface CatalogNumberOption {
  catalogNumber: string;
  description: string;
}

// Derive Product Code DTOs

export interface DeriveProductCodeRequestDto {
  unitId: string;
  oldProductCode: string;
  attributeCode: string;
  productType: string;
}

export interface DeriveProductCodeResponseDto {
  success: boolean;
  newProductCode: string | null;
  message: string | null;
}

// Generic API Response wrapper

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  statusCode?: number;
  data?: T;
  item?: T;
  total?: number;
  errorCode?: string;
  errorResponse?: {
    errorCode?: string;
    error?: string;
  };
}
