export interface LicensedProduct {
  productCode: string;
  productDescription: string; // Mapped from productDesc in service
  productDesc?: string; // Original field name from backend
  chapterId: string;
  osokFlag: string;
  effDate: Date | string;
  termDate: Date | string | null;
  insertUser?: string;
  insertDate?: Date | string;
}

export interface Chapter {
  chapterId: string;
  chapterName: string;
}

export interface ValidProduct {
  productCode: string;
  productDesc: string;
}

export interface LicensedProductsResponse {
  data: LicensedProduct[];
  total: number;
}

export interface LicensedProductRequest {
  productCode: string;
  chapterId: string;
  osokFlag: string;
  effDate: string;
  termDate?: string | null;
}

export interface LicensedProductParamsDto {
  searchKeyword?: string;
  sortColumn?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface AddEditLicensedProductDialogData {
  mode: 'add' | 'edit';
  product?: LicensedProduct;
  chapterId: string;
  validProducts?: ValidProduct[];
}

/**
 * Backend DTO for licensed products API response
 */
export interface LicensedProductDto {
  productCode: string;
  productDesc: string;
  chapterId: string;
  osokFlag: string;
  effDate: string;
  termDate: string | null;
  insertUser?: string;
  insertDate?: string;
}

/**
 * Backend DTO for licensed products list API response
 */
export interface LicensedProductsApiResponse {
  item: LicensedProductDto[];
  total: number;
}
