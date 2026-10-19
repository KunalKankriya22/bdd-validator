export interface Consignee {
  consigneeId: string;
  customerId: string;
  consigneeName: string;
  shortName: string;
  address1: string;
  city: string;
  state: string;
}

export interface Order {
  orderNo: string;
  orderType: string;
  orderStatus: string;
  insertDate: string;
}

export interface ProductType {
  productType: string;
  productDesc: string;
}

export interface DiscardType {
  discardType: string;
  discardTypeDesc: string;
}

export interface Box {
  boxId: string;
  boxStatus: string;
  consigneeId: string;
}

export interface TestId {
  testId: string;
  testDesc: string;
  testGroup: string;
}

export interface BoxContent {
  unitId: string;
  collDate: string;
  productType: string;
  productCode: string;
  aliquot: string | null;
  bloodType: string;
  aboDesc: string;
  productDesc: string;
  expDate: string;
  productStatus: string;
  discardType: string;
  boxId: string;
}

export interface AvailableProduct {
  unitId: string;
  collDate: string;
  productType: string;
  productCode: string;
  systemLabelDecision: string;
  aboDesc: string;
  productDesc: string;
}

export interface UnitProduct {
  unitId: string;
  productCode: string;
  productDesc: string;
  productType: string;
  componentPrefix: string;
  systemLabelDecision: string;
  aboDesc: string;
  collDate: string;
}

export interface AvailableProductsRequest {
  productType?: string;
  discardType?: string;
}

export interface PackProductRequest {
  consigneeId: string;
  orderNo?: string;
  productType?: string;
  discardType: string;
  boxId?: string;
  unitId: string;
  productCode: string;
  bloodType: string;
  aliquot?: string;
  testIds?: string[];
  isManualEntry?: boolean;
  barcodeScheme?: string;
}

export interface UnpackProductRequest {
  unitId: string;
  productCode: string;
  boxId: string;
}

export interface CloseBoxRequest {
  confirmation: 'Y' | 'N';
}

export interface PackProductResponse {
  boxId: string;
  pickSlipId: string;
  orderNo: string;
  unitId: string;
  productCode: string;
  message: string;
}

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  totalCount?: number;
  errorCode?: string;
  errorResponse?: {
    errorCode: string;
    error: string;
  };
}

export enum PackLabDiscardsErrorCode {
  INVALID_BLOOD_TYPE = '0300',
  INVALID_CUSTOMER = '0302',
  INVALID_ORDER = '0306',
  INVALID_COLLECTION_DATE = '0307',
  INVALID_PRODUCT_CODE = '0309',
  INVALID_UNIT_ID = '0312',
  INVALID_ALIQUOT = '0313',
  CONFIRMATION_REQUIRED = '0318',
  INVALID_PRODUCT_TYPE = '0322',
  INVALID_BOX = '0334',
  INVALID_SCAN_LENGTH = '0700',
  INVALID_CONSIGNEE = '1300',
  INVALID_TEST_ID = '3308',
  RESTRICTED_PRODUCT_TYPE = '3314',
  PRODUCT_ALREADY_PACKED = '3704',
  NOT_BIO_NOR_NFT = '5309',
  INVALID_DISCARD_TYPE = '5313',
  CODE128_LENGTH_ERROR = '9803',
  CODABAR_LENGTH_ERROR = '9804',
}

export const ERROR_MESSAGES: Record<string, string> = {
  [PackLabDiscardsErrorCode.INVALID_BLOOD_TYPE]: 'Invalid blood type',
  [PackLabDiscardsErrorCode.INVALID_CUSTOMER]: 'Invalid customer',
  [PackLabDiscardsErrorCode.INVALID_ORDER]: 'Invalid order',
  [PackLabDiscardsErrorCode.INVALID_COLLECTION_DATE]: 'Invalid collection date',
  [PackLabDiscardsErrorCode.INVALID_PRODUCT_CODE]: 'Invalid product code',
  [PackLabDiscardsErrorCode.INVALID_UNIT_ID]: 'Invalid unit ID',
  [PackLabDiscardsErrorCode.INVALID_ALIQUOT]: 'Invalid aliquot number',
  [PackLabDiscardsErrorCode.CONFIRMATION_REQUIRED]: 'Y or N must be entered',
  [PackLabDiscardsErrorCode.INVALID_PRODUCT_TYPE]: 'Invalid product type',
  [PackLabDiscardsErrorCode.INVALID_BOX]: 'Invalid box',
  [PackLabDiscardsErrorCode.INVALID_SCAN_LENGTH]: 'Invalid scan length',
  [PackLabDiscardsErrorCode.INVALID_CONSIGNEE]: 'Invalid consignee',
  [PackLabDiscardsErrorCode.INVALID_TEST_ID]: 'Invalid test ID',
  [PackLabDiscardsErrorCode.RESTRICTED_PRODUCT_TYPE]: 'Restricted product type',
  [PackLabDiscardsErrorCode.PRODUCT_ALREADY_PACKED]: 'Product already packed',
  [PackLabDiscardsErrorCode.NOT_BIO_NOR_NFT]: 'Not BIO nor NFT',
  [PackLabDiscardsErrorCode.INVALID_DISCARD_TYPE]: 'Invalid discard type',
  [PackLabDiscardsErrorCode.CODE128_LENGTH_ERROR]: 'For Code128, product code length should be 8',
  [PackLabDiscardsErrorCode.CODABAR_LENGTH_ERROR]: 'For Codabar, product code length should be 5',
};

export enum BarcodeScheme {
  CODE128 = 'CODE128',
  CODABAR = 'CODABAR',
}

export const BARCODE_SCHEME_LENGTHS: Record<string, number> = {
  [BarcodeScheme.CODE128]: 8,
  [BarcodeScheme.CODABAR]: 5,
};

export interface PackedProduct {
  unitId: string;
  productCode: string;
  aliquot?: string;
  productDesc: string;
  orderedAboRh: string;
  boxId: string;
}
