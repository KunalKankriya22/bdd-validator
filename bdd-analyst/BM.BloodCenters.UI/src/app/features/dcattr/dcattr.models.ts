/**
 * Models for Delete Component Attributes feature
 * Field names must match API JSON response (camelCase of C# DTO properties)
 */

/**
 * Request DTO for validating a unit
 */
export interface ValidateDeleteUnitRequestDto {
  unitId: string;
}

/**
 * Response DTO from unit validation
 */
export interface ValidateDeleteUnitResponseDto {
  collectionDate: string;
}

/**
 * Request DTO for previewing new product code
 */
export interface PreviewProductCodeRequestDto {
  unitId: string;
  collDate: string;
  productCode: string;
  attribCode: string;
  codeScheme: string;
}

/**
 * Response DTO from preview new product code
 */
export interface PreviewProductCodeResponseDto {
  newProductCode: string;
  newProductDescription: string;
}

/**
 * Request DTO for deleting an attribute
 */
export interface DeleteAttributeRequestDto {
  unitId: string;
  collDate: string;
  oldProductCode: string;
  attribCode: string;
  newProdCode: string;
  verifyProdCode: string;
  codeScheme: string;
}

/**
 * Response DTO from delete attribute
 */
export interface DeleteAttributeResponseDto {
  newProductCode: string;
  expiryDate?: string;
}

/**
 * DTO for a deletable attribute - matches API DeletableAttributeDto
 */
export interface DeletableAttributeDto {
  attribCode: string;
  attribDesc: string;
  attribType: string;
  attribGroup?: string;
}

/**
 * Request DTO for reprinting label
 */
export interface ReprintLabelRequestDto {
  unitId: string;
  collDate: string;
  newProductCode: string;
}

/**
 * DTO for product code dropdown options
 */
export interface ProductCodeDto {
  productCode: string;
  productShortName: string;
  productType: string;
}

/**
 * DTO for product attribute log entry - matches API ProductAttributeLogDto
 */
export interface ProductAttributeLogDto {
  oldProductCode: string;
  attribCode: string;
  newProductCode: string;
  attribDate: string;
  insertDate: string;
}

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  statusCode: number;
  data?: T;
  total?: number;
  errorCode?: string;
  error?: string;
  errorResponse?: {
    errorCode: string;
    error: string;
  };
}

/**
 * Session log entry for a deleted attribute
 */
export interface DeletedEntry {
  unitId: string;
  productCode: string;
  productDescription: string;
  attribCode: string;
  attribDescription: string;
  newProductCode: string;
  newProductDescription: string;
  verifyProduct: string;
}
