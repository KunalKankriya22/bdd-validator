export interface ProductType {
  code: string;
  description: string;
}

export interface SpProductModel {
  processCode: string;
  processDesc: string;
  productCode: string;
  productDesc: string;
  attribGroup: string | null;
  attribGroupDesc: string | null;
  attribCode: string | null;
  attribCodeDesc: string | null;
  effDate: string;
  termDate: string | null;
  lastModifiedDate: string | null;
  programId: string | null;
}

export interface SpProductQueryParamsDto {
  processCode?: string | null;
  productCode?: string | null;
  attribGroup?: string | null;
  attribCode?: string | null;
  searchKeyword?: string | null;
  sortColumn?: string | null;
  sortOrder?: string | null;
}

export interface SpProductFormValue {
  processCode?: string;
  productCode: string;
  attribGroup: string;
  attribCode: string;
  effDate: any;
  termDate: any;
}

export interface SpProductCreateDto {
  processCode: string;
  productCode: string;
  attribGroup: string | null;
  attribCode: string | null;
  effDate: string;
  termDate: string | null;
}

export interface SpProductUpdateDto {
  attribGroup?: string | null;
  attribCode?: string | null;
  effDate: string;
  termDate: string | null;
}

export interface ReturnResult<T> {
  success?: boolean;
  message?: string;
  statusCode?: number;
  total?: number;
  data?: T[];
}

export interface LookUp {
  code: string;
  name: string;
}

export interface LookUpWithDescription {
  code: string;
  name: string;
  description: string;
}

export interface ProductCodeDropdownItem {
  productCode: string;
  productDesc: string;
}

export interface AttribCodeDropdownItem {
  attribCode: string;
  attribDesc: string;
}
