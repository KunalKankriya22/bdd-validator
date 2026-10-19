export interface ProductType {
  productTypeCode: string;
  productTypeDesc: string;
  productClass: string;
  productGroupName: string;
  productGroupIdentifier: string;
  aboOnly: string;
  attribFlag: string;
  weightRequired: string;
  effDate: Date | string;
  termDate: Date | string | null;
  lastModifiedDate: Date | string;
  auditKey: number;
  programId: string;
}

export interface CreateProductTypeDto {
  productTypeCode: string;
  productTypeDesc: string;
  productClass: string | null;
  productGroupName: string;
  productGroupIdentifier: string | null;
  aboOnly: string | null;
  attribFlag: string | null;
  weightRequired: string | null;
  effDate: string;
  termDate: string | null;
}

export interface UpdateProductTypeDto {
  productTypeDesc: string;
  productClass?: string | null;
  productGroupName: string;
  productGroupIdentifier?: string | null;
  aboOnly?: string | null;
  attribFlag?: string | null;
  weightRequired?: string | null;
  effDate: string;
  termDate?: string | null;
}

export interface ProductTypeQueryDto {
  productTypeCode?: string;
  productClass?: string;
  searchKeyword?: string;
  aboOnly?: string;
  attribFlag?: string;
  weightRequired?: string;
  effDateFrom?: string;
  effDateTo?: string;
  termDateFrom?: string;
  termDateTo?: string;
  sortColumn?: string;
  sortOrder?: string;
}

export interface ProductTypeFilterValue {
  productTypeCode?: string;
  productClass?: string;
  aboOnly?: string;
  attribFlag?: string;
  weightRequired?: string;
  effDatePeriod?: 'After' | 'Before';
  effDate?: string | Date | null;
  termDatePeriod?: 'After' | 'Before';
  termDate?: string | Date | null;
}

export interface ProductTypeDropdownOption {
  productTypeCode: string;
  productTypeDesc: string;
}

export interface ProductClassDropdown {
  code: string;
  codeDesc: string;
}

export interface ProductTypeFilterOptions {
  productClasses: ProductClassDropdown[];
}

export interface YesNoOption {
  value: string;
  label: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  total?: number;
  statusCode: number;
  message: string;
}
