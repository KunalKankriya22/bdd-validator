/**
 * Models for Pack Inv Rejects to Salvage (DSIPKOD)
 * Generated from API Documentation
 */

/**
 * Discard Product DTO
 * Represents a product in the discard_products table
 */
export interface DiscardProductDto {
  unitId: string;
  productCode: string;
  aliquot: string;
  chapterId: string;
  bloodType: string | null;
  productType: string | null;
  productStatus: string | null;
  collDate: string | null;
  expDate: string | null;
  boxId: string | null;
  warehouseId: string | null;
  discardType: string | null;
  chkDigit: string | null;
  productDesc: string | null;
  aboDesc: string | null;
}

/**
 * Query DTO for filtering discard products
 */
export interface PackInvRejectsQueryDto {
  consigneeId?: string | null;
  orderId?: string | null;
  productType?: string | null;
  boxId?: string | null;
  productStatus?: string | null;
  discardType?: string | null;
  searchKeyword?: string | null;
  sortColumn?: string | null;
  sortOrder?: string | null;
}

/**
 * Consignee List of Values DTO
 */
export interface ConsigneeLovDto {
  consigneeId: string;
  customerId: string;
  customerType: string;
  customerName: string;
  shortName: string;
  address: string;
  city: string;
  state: string;
  fullAddress: string;
}

/**
 * Order List of Values DTO
 */
export interface OrderLovDto {
  orderNo: string;
  customerId: string;
  consigneeId: string;
  orderType: string;
  orderClass: string;
  orderStatus: string;
}

/**
 * Product Type List of Values DTO
 */
export interface ProductTypeLovDto {
  productType: string;
  description: string;
}

/**
 * Product Code List of Values DTO
 */
export interface ProductCodeLovDto {
  productCode: string;
  shortName: string;
}

/**
 * Blood Type List of Values DTO
 */
export interface BloodTypeLovDto {
  aboDesc: string;
}

/**
 * Box List of Values DTO
 */
export interface BoxLovDto {
  boxId: string;
  discardId: string;
  boxStatus: string;
  productCount: number;
}

/**
 * Validate Unit Response DTO
 */
export interface ValidateUnitResponseDto {
  isValid: boolean;
  errorMessage?: string | null;
}

/**
 * Validate Consignee Request DTO
 */
export interface ValidateConsigneeRequestDto {
  consigneeId: string;
  rejectOption: string;
}

/**
 * Validate Consignee Response DTO
 */
export interface ValidateConsigneeResponseDto {
  consigneeId: string;
  customerId: string;
  customerType: string;
  fullAddress: string;
  hasContract: boolean;
}

/**
 * Validate Product Request DTO
 */
export interface ValidateProductRequestDto {
  unitId: string;
  productCode: string;
  aliquot: string;
  bloodType: string;
  expDate: string;
}

/**
 * Product Key for Packing
 */
export interface ProductKeyDto {
  unitId: string;
  productCode: string;
  aliquot: string;
  expDate: string;
}

/**
 * Pack Products Request DTO
 */
export interface PackProductsRequestDto {
  boxId: string;
  productKeys: ProductKeyDto[];
}

/**
 * Pack Products Response DTO
 */
export interface PackProductsResponseDto {
  boxId: string;
  packedCount: number;
  failedCount: number;
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  total?: number;
  totalCount?: number;
}

/**
 * Error Response
 */
export interface ErrorResponse {
  success: false;
  statusCode: number;
  errorCode: string;
  errorResponse: {
    errorCode: string;
    error: string;
  };
}

/**
 * Close Box Request DTO
 */
export interface CloseBoxDto {
  boxId: string;
  allProperlyPacked?: boolean;
}

/**
 * Create New Box Request DTO
 */
export interface CreateNewBoxDto {
  currentBoxId: string | null;
  closeCurrentBox: boolean;
  allProductsProperlyPacked: boolean;
  consigneeId: string;
}

/**
 * Create New Box Response DTO
 */
export interface CreateNewBoxResponseDto {
  boxId: string;
}

/**
 * Reject Option enum
 */
export enum RejectOption {
  ALL = 'ALL',
  RD = 'RD',
  DI = 'DI',
  LC = 'LC'
}
