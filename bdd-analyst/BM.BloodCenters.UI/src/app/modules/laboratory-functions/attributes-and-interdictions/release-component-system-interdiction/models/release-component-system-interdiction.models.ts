export interface ValidateUnitResponseDto {
  unitId: string;
  collDate: string | null;
  availableCollectionDates: string[];
  isValid: boolean;
}

export interface ValidProductDto {
  productCode: string;
  productDesc: string | null;
}

export interface ComponentSystemInterdictionDto {
  unitId: string;
  collDate: string;
  productCode: string;
  interCode: string;
  interDesc: string | null;
  interType: string | null;
  interTypeDesc: string | null;
  chapterId: string;
  insertDate: string;
  insertUser: string;
}

export interface ReleaseSystemInterdictionsRequestDto {
  unitId: string;
  collDate: string;
  productCode: string;
  interCodes: string[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  item?: T;
  total?: number;
  error?: string;
  errorCode?: string | null;
  errorResponse?: {
    errorCode: string;
    error: string;
  } | null;
}
