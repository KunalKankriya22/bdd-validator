export interface ProcessCodeDto {
  processCode: string;
  processCodeDesc: string;
}

export interface ValidateUnitRequestDto {
  unitId: string;
  processCode: string;
}

export interface ValidateUnitResponseDto {
  unitId: string;
  collDate: string;
  isValid: boolean;
}

export interface ProductDto {
  productCode: string;
  productDesc: string;
}

export interface AliquotDto {
  componentPrefix: string;
}

export interface GetProductsRequestDto {
  unitId: string;
  collDate: string;
  chapterId: string;
  processCode: string;
}

export interface GetAliquotsRequestDto {
  unitId: string;
  collDate: string;
  chapterId: string;
  processCode: string;
  productCode: string;
}

export interface ReleaseComponentRequestDto {
  unitId: string;
  collDate: string;
  chapterId: string;
  processCode: string;
  productCode: string;
  componentPrefix: string;
}

export interface ReleaseComponentResponseDto {
  success: boolean;
  message: string;
  warningMessage: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data: T;
  errorCode?: string;
  errorResponse?: {
    errorCode: string;
    error: string;
  };
}

export interface ReleasedEntry {
  unitId: string;
  product: string;
  productDesc: string;
}
