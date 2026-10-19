export interface ReturnResult<T> {
  success?: boolean;
  message?: string;
  error?: string;
  errorCode?: string;
  statusCode?: number;
  data?: T[];
  item?: T;
  total?: number;
  errorResponse?: {
    errorCode?: string;
    error?: string;
  };
}

export interface PayeeCustomerDto {
  customerId: string;
  chapterId: string;
  customerType: string;
  name: string;
  shortName: string;
  alphaKey: string;
  address1: string;
  address2?: string | null;
  address3?: string | null;
  city: string;
  state?: string | null;
  zip: string;
  country?: string | null;
  phoneNo?: string | null;
  phoneExt?: string | null;
  faxNo?: string | null;
  telexNo?: string | null;
  intPhone?: string | null;
  zone?: string | null;
  zoneDescription?: string | null;
  outOfState?: string | null;
  intFlag: string;
  codFlag: string;
  effDate: string;
  termDate?: string | null;
  lastModifiedDate?: string | null;
  customerTypeDesc?: string | null;
}

export interface CreatePayeeCustomerRequestDto {
  name: string;
  shortName: string;
  alphaKey: string;
  address1: string;
  address2?: string | null;
  address3?: string | null;
  city: string;
  state?: string | null;
  zip: string;
  country?: string | null;
  phoneNo?: string | null;
  phoneExt?: string | null;
  faxNo?: string | null;
  telexNo?: string | null;
  intPhone?: string | null;
  zone?: string | null;
  outOfState?: string | null;
  intFlag: string;
  effDate: string;
  termDate?: string | null;
}

export interface UpdatePayeeCustomerRequestDto {
  name: string;
  shortName: string;
  alphaKey: string;
  address1: string;
  address2?: string | null;
  address3?: string | null;
  city: string;
  state?: string | null;
  zip: string;
  country?: string | null;
  phoneNo?: string | null;
  phoneExt?: string | null;
  faxNo?: string | null;
  telexNo?: string | null;
  intPhone?: string | null;
  zone?: string | null;
  outOfState?: string | null;
  intFlag: string;
  effDate: string;
  termDate?: string | null;
}

export interface PayeeCustomerQueryDto {
  customerId?: string | null;
  name?: string | null;
  shortName?: string | null;
  alphaKey?: string | null;
  state?: string | null;
  city?: string | null;
  intFlag?: string | null;
  effDateFrom?: string | null;
  effDateTo?: string | null;
  searchKeyword?: string | null;
  sortColumn?: string | null;
  sortOrder?: string | null;
  includeTerminated?: boolean;
}

export const PAYEE_CONSTRAINTS = {
  NAME: { MAX_LENGTH: 50 },
  SHORT_NAME: { MAX_LENGTH: 15 },
  ALPHA_KEY: { MAX_LENGTH: 10 },
  ADDRESS_1: { MAX_LENGTH: 50 },
  ADDRESS_2: { MAX_LENGTH: 50 },
  ADDRESS_3: { MAX_LENGTH: 50 },
  CITY: { MAX_LENGTH: 75 },
  STATE: { MAX_LENGTH: 2 },
  ZIP: { MAX_LENGTH: 15 },
  COUNTRY: { MAX_LENGTH: 50, DEFAULT: 'USA' },
  PHONE_NO: { MAX_LENGTH: 12 },
  PHONE_EXT: { MAX_LENGTH: 5 },
  FAX_NO: { MAX_LENGTH: 12 },
  TELEX_NO: { MAX_LENGTH: 20 },
  INT_PHONE: { MAX_LENGTH: 20 },
} as const;
