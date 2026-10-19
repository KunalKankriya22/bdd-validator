export interface ApiItemResponse<T> {
  success: boolean;
  message?: string;
  statusCode?: number;
  item: T;
  errorCode?: string;
  errorResponse?: { errorCode: string; error: string };
}

export interface ApiItemArrayResponse<T> {
  success: boolean;
  message?: string;
  statusCode?: number;
  item: T[];
  errorCode?: string;
  errorResponse?: { errorCode: string; error: string };
}

export interface ApiDataArrayResponse<T> {
  success: boolean;
  message?: string;
  statusCode?: number;
  data: T[];
  total?: number;
  errorCode?: string;
  errorResponse?: { errorCode: string; error: string };
}

export interface ValidateUnitDto {
  unitId: string;
  collDate: string;
  chapterId: string;
  codeScheme: 'I' | 'C';
}

export interface ProductForUnitDto {
  productCode: string;
  productDescription: string;
}

export interface AliquotDto {
  aliquot: string;
}

export interface ComponentFreezeDetailsDto {
  unitId: string;
  productCode: string;
  productDescription: string;
  aliquot: string;
  collDate: string;
  freezeStartTime: string | null;
  bleedStartTime: string | null;
  bleedEndTime: string | null;
  chapterId: string;
  parmValue: string | null;
}

export interface UpdateFreezeStartTimeRequestDto {
  unitId: string;
  productCode: string;
  aliquot: string;
  collDate: string;
  freezeStartTime: string;
}

export interface UpdateFreezeStartTimeResponseDto {
  unitId: string;
  productCode: string;
  aliquot: string;
  collDate: string;
  productDescription: string;
  freezeStartTime: string;
  cmtiGenerated: boolean;
  warning: string | null;
}

export interface FreezeStartTimeEntry {
  unitId: string;
  collectionDate: string;
  productCode: string;
  productDescription: string;
  freezeStartDateTime: string;
  aliquot: string;
}

export enum FreezeStartTimeErrorCode {
  UNIT_NOT_FOUND = '0210',
  INVALID_PRODUCT = '0376',
  FUTURE_TIME = '0380',
  BEFORE_BLEED_END = '0381',
  NO_FREEZE_RECORD = '0382',
  NO_FRZ_RECORD = '2119',
}

export const FREEZE_ERROR_MESSAGES: Record<string, string> = {
  [FreezeStartTimeErrorCode.UNIT_NOT_FOUND]: 'Unit not found or initial check-in not done',
  [FreezeStartTimeErrorCode.INVALID_PRODUCT]: 'Invalid product code for this unit',
  [FreezeStartTimeErrorCode.FUTURE_TIME]: 'Freeze start time cannot be in the future',
  [FreezeStartTimeErrorCode.BEFORE_BLEED_END]: 'Freeze start time cannot be before bleed end time',
  [FreezeStartTimeErrorCode.NO_FREEZE_RECORD]: 'No freeze record found for this component',
  [FreezeStartTimeErrorCode.NO_FRZ_RECORD]: 'No FRZ record found for this unit/product',
};
