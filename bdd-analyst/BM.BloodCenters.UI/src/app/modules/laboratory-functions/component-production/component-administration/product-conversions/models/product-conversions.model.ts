export interface ProductConversionModel {
  sourceProductCode: string;
  sourceProductDesc: string | null;
  targetProductCode: string;
  targetProductDesc: string | null;
  effDate: string;
  termDate: string | null;
  lastModifiedDate: string | null;
  programId: string | null;
}

export interface ProductDropdownDto {
  productCode: string;
  productDesc: string | null;
  productType: string | null;
  unitSchemeType: string | null;
}

export interface ProductConversionQueryDto {
  sourceProductCode?: string | null;
  targetProductCode?: string | null;
  effDateFrom?: string | null;
  effDateTo?: string | null;
  searchKeyword?: string | null;
  sortColumn?: string | null;
  sortOrder?: string | null;
}

export interface CreateProductConversionDto {
  sourceProductCode: string;
  targetProductCode: string;
  effDate: string | null;
  termDate: string | null;
}

export interface UpdateProductConversionDto {
  effDate: string | null;
  termDate: string | null;
}

export interface ReturnResult<T> {
  success?: boolean;
  message?: string;
  statusCode?: number;
  data?: T[];
  total?: number;
}

export interface ApiResponse {
  success: boolean;
  message: string;
  statusCode: number;
}
