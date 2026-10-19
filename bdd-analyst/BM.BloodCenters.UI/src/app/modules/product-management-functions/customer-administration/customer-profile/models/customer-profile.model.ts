/**
 * Customer Profile Models and DTOs
 * Based on Customer Profile API Documentation
 * JIRA: MLT-14094
 */

/**
 * Customer Profile DTO - Response model
 */
export interface CustomerProfileDto {
  customerId: string;
  chapterId: string;
  name: string;
  customerType: string;
  customerTypeDesc?: string;
  shortName: string;
  alphaKey?: string | null;
  intFlag?: string;
  address1: string;
  address2?: string | null;
  address3?: string | null;
  city: string;
  state?: string | null;
  zip: string;
  country: string;
  phoneNo?: string | null;
  phoneExt?: string | null;
  faxNo?: string | null;
  intPhone?: string | null;
  telexNo?: string | null;
  codFlag: string;
  returnAcceptedFlag: string;
  arAccount: string;
  fiPriceSchNo?: string | null;
  priceChangeFlag?: string | null;
  ednGenFlag?: string | null;
  plasmaFileType?: string | null;
  phApprFlag?: string | null;
  insApprFlag?: string | null;
  effDate: string;
  termDate?: string | null;
  lastModifiedDate?: string | null;
  payeeId?: string | null;
  customerTypeDescription?: string | null;
  payeeName?: string | null;
  consigneeCount?: number;
  contactCount?: number;
}

/**
 * Create Customer Profile Request DTO
 */
export interface CreateCustomerProfileRequestDto {
  customerId: string;
  name: string;
  customerType: string;
  shortName: string;
  alphaKey?: string | null;
  intFlag?: string;
  address1: string;
  address2?: string | null;
  address3?: string | null;
  city: string;
  state?: string | null;
  zip: string;
  country: string;
  phoneNo?: string | null;
  phoneExt?: string | null;
  faxNo?: string | null;
  intPhone?: string | null;
  telexNo?: string | null;
  codFlag: string;
  returnAcceptedFlag: string;
  arAccount: string;
  fiPriceSchNo?: string | null;
  priceChangeFlag?: string | null;
  ednGenFlag?: string | null;
  plasmaFileType?: string | null;
  phApprFlag?: string | null;
  insApprFlag?: string | null;
  effDate: string;
  termDate?: string | null;
  payeeId?: string | null;
}

/**
 * Update Customer Profile Request DTO
 * Same as Create except customerId comes from route parameter
 */
export interface UpdateCustomerProfileRequestDto {
  name: string;
  customerType: string;
  shortName: string;
  alphaKey?: string | null;
  intFlag?: string;
  address1: string;
  address2?: string | null;
  address3?: string | null;
  city: string;
  state?: string | null;
  zip: string;
  country: string;
  phoneNo?: string | null;
  phoneExt?: string | null;
  faxNo?: string | null;
  intPhone?: string | null;
  telexNo?: string | null;
  codFlag: string;
  returnAcceptedFlag: string;
  arAccount: string;
  fiPriceSchNo?: string | null;
  priceChangeFlag?: string | null;
  ednGenFlag?: string | null;
  plasmaFileType?: string | null;
  phApprFlag?: string | null;
  insApprFlag?: string | null;
  effDate: string;
  termDate?: string | null;
  payeeId?: string | null;
}

/**
 * Customer Profile Query DTO - for list/filter operations
 */
export interface CustomerProfileQueryDto {
  customerId?: string;
  customerType?: string;
  name?: string;
  shortName?: string;
  city?: string;
  state?: string;
  includeTerminated?: boolean;
  effDateAfter?: string;
  effDateBefore?: string;
  termDateAfter?: string;
  termDateBefore?: string;
  searchKeyword?: string;
  sortColumn?: string;
  sortOrder?: string;
}

/**
 * Customer Type Lookup DTO
 */
export interface CustomerTypeDto {
  code: string;
  description: string;
  source?: string;
}

/**
 * State Code Lookup DTO
 */
export interface StateCodeDto {
  code: string;
  description: string;
}

/**
 * Payee Lookup DTO
 */
export interface PayeeDto {
  customerId: string;
  name: string;
}

/**
 * Plasma File Type Lookup DTO
 */
export interface PlasmaFileTypeDto {
  code: string;
  description: string;
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  totalCount?: number;
  total?: number;
}

/**
 * API Error Response
 */
export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  errorCode?: string;
  message: string;
  errorResponse?: {
    errorCode: string;
    error: string;
  };
}

/**
 * Field validation constraints from API documentation
 */
export const CUSTOMER_PROFILE_CONSTRAINTS = {
  CUSTOMER_ID: { MAX_LENGTH: 10, REQUIRED: true },
  NAME: { MAX_LENGTH: 50, REQUIRED: true },
  CUSTOMER_TYPE: { MAX_LENGTH: 2, REQUIRED: true },
  SHORT_NAME: { MAX_LENGTH: 15, REQUIRED: true },
  ALPHA_KEY: { MAX_LENGTH: 10, REQUIRED: false },
  INT_FLAG: { MAX_LENGTH: 1, REQUIRED: false, VALUES: ['Y', 'N'] },
  ADDRESS1: { MAX_LENGTH: 50, REQUIRED: true },
  ADDRESS2: { MAX_LENGTH: 50, REQUIRED: false },
  ADDRESS3: { MAX_LENGTH: 50, REQUIRED: false },
  CITY: { MAX_LENGTH: 75, REQUIRED: true },
  STATE: { MAX_LENGTH: 2, REQUIRED: false }, // Conditional: required if intFlag != 'Y'
  ZIP: { MAX_LENGTH: 15, REQUIRED: true },
  COUNTRY: { MAX_LENGTH: 50, REQUIRED: true, DEFAULT: 'USA' },
  PHONE_NO: { MAX_LENGTH: 20, REQUIRED: false },
  PHONE_EXT: { MAX_LENGTH: 5, REQUIRED: false },
  FAX_NO: { MAX_LENGTH: 20, REQUIRED: false },
  INT_PHONE: { MAX_LENGTH: 20, REQUIRED: false },
  TELEX_NO: { MAX_LENGTH: 20, REQUIRED: false },
  COD_FLAG: { MAX_LENGTH: 1, REQUIRED: true, VALUES: ['Y', 'N'] },
  RETURN_ACCEPTED_FLAG: { MAX_LENGTH: 1, REQUIRED: true, VALUES: ['Y', 'N', 'Q'] },
  AR_ACCOUNT: { MAX_LENGTH: 20, REQUIRED: true },
  FI_PRICE_SCH_NO: { MAX_LENGTH: 2, REQUIRED: false, NUMERIC: true },
  PRICE_CHANGE_FLAG: { MAX_LENGTH: 1, REQUIRED: false, VALUES: ['Y', 'N'] },
  EDN_GEN_FLAG: { MAX_LENGTH: 1, REQUIRED: false, VALUES: ['Y', 'N'] },
  PLASMA_FILE_TYPE: { MAX_LENGTH: 10, REQUIRED: false },
  PH_APPR_FLAG: { MAX_LENGTH: 1, REQUIRED: false, VALUES: ['Y', 'N'] },
  INS_APPR_FLAG: { MAX_LENGTH: 1, REQUIRED: false, VALUES: ['Y', 'N'] },
  EFF_DATE: { REQUIRED: true, FUTURE_ONLY: true },
  TERM_DATE: { REQUIRED: false },
  PAYEE_ID: { MAX_LENGTH: 10, REQUIRED: false },
} as const;

/**
 * Error codes from API documentation
 */
export const CUSTOMER_PROFILE_ERROR_CODES = {
  REQUIRED_FIELD: '0201',
  YN_FLAG_INVALID: '0318',
  INVALID_NUMBER: '0241',
  INVALID_CUSTOMER_TYPE: '0349',
  INVALID_STATE_CODE: '7304',
  PAYEE_NOT_FOUND: '0338',
  EFF_DATE_IN_PAST: '0501',
  TERM_DATE_BEFORE_EFF: '4503',
  INVALID_RETURN_ACCEPTED_FLAG: '7201',
  INVALID_PLASMA_FILE_TYPE: '1521',
} as const;
