/**
 * Response from POST /release-component-interdictions/validate-unit
 */
export interface ValidateUnitResponseDto {
  unitId: string;
  collDate: string | null;
  availableCollectionDates: string[];
  isValid: boolean;
}

/**
 * Response item from POST /release-component-interdictions/valid-products
 */
export interface ValidProductDto {
  productCode: string;
  productDesc: string | null;
}

/**
 * Response item from POST /release-component-interdictions/interdictions
 */
export interface ComponentInterdictionDto {
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

/**
 * Request body for POST /release-component-interdictions/release
 */
export interface ReleaseInterdictionsRequestDto {
  unitId: string;
  collDate: string;
  productCode: string;
  interCodes: string[];
}

/**
 * Standard API response wrapper matching ReturnResult<T> from the .NET API
 */
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
