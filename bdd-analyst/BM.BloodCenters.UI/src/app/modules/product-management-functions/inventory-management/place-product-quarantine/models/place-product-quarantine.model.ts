export interface PlaceQuarantineRequestDto {
  unitId: string;
  productCode: string;
  aliquot: string | null;
  quarantineReasonCode: string;
}

export interface UnitInfoDto {
  aboDescription: string | null;
  expirationDate: string | null;
  bloodType: string | null;
}

export interface QuarantineReasonDto {
  code: string;
  description: string;
}

export interface QuarantineProductCodeDto {
  code: string;
  description: string;
}

export interface QuarantinedProductRow {
  unitId: string;
  productCode: string;
  productDescription: string;
  aliquot: string;
  reasonCode: string;
  reasonDescription: string;
  aboRh: string;
  expirationDate: string;
}

export interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  error?: string;
  errorCode?: string;
  statusCode?: number;
  data?: T[];
  item?: T;
  total?: number;
  errorResponse?: {
    errorCode: string;
    error: string;
  };
}

export const ERROR_CODES = {
  UNIT_NOT_CHECKED_IN: '0314',
  INVALID_COLLECTION_DATE: '0307',
  INVALID_PRODUCT_CODE: '0309',
  INVALID_ALIQUOT: '0313',
  PRODUCT_NOT_AVAILABLE: '1727',
  DUPLICATE_QUARANTINE_REASON: '5900',
  INVALID_REASON_CODE: '0339',
} as const;

export const ERROR_MESSAGES: Record<string, string> = {
  [ERROR_CODES.UNIT_NOT_CHECKED_IN]: 'Unit ID not checked in',
  [ERROR_CODES.INVALID_COLLECTION_DATE]: 'Invalid collection date',
  [ERROR_CODES.INVALID_PRODUCT_CODE]: 'Invalid product code',
  [ERROR_CODES.INVALID_ALIQUOT]: 'Invalid aliquot number',
  [ERROR_CODES.PRODUCT_NOT_AVAILABLE]: 'Product not available for quarantine',
  [ERROR_CODES.DUPLICATE_QUARANTINE_REASON]: 'Product quarantined with this reason',
  [ERROR_CODES.INVALID_REASON_CODE]: 'Invalid quarantine reason code',
};
