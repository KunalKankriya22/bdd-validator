export interface ReturnResult<T> {
  success?: boolean;
  message?: string;
  error?: string;
  errorCode?: string;
  statusCode?: number;
  data?: T[];
  item?: T;
  total?: number;
}

export interface CustomerConsigneeProductDetailsDto {
  customerId: string;
  customerName?: string;
  consigneeId?: string;
  consigneeName?: string;
  productType?: string;
  productTypeDescription?: string;
  productCode?: string;
  productCodeDescription?: string;
  effDate: string;
  termDate: string | null;
  chapterId?: string;
  insertDate?: string;
  insertUser?: string;
  programId?: string;
}

export interface CustomerConsigneeProductQueryDto {
  customerId?: string | null;
  consigneeId?: string | null;
  productType?: string | null;
  productCode?: string | null;
  effectivePeriod?: string | null;
  effectiveDate?: string | null;
  terminationPeriod?: string | null;
  terminationDate?: string | null;
  searchKeyword?: string | null;
  sortColumn?: string;
  sortOrder?: string;
}

export interface CreateCustomerConsigneeProductRequestDto {
  customerId: string;
  consigneeId: string | null;
  productType: string | null;
  productCode: string | null;
  effDate: string;
  termDate: string | null;
}

export interface UpdateCustomerConsigneeProductRequestDto {
  productType: string | null;
  productCode: string | null;
  effDate: string;
  termDate: string | null;
}

export interface FilterValue {
  effectivePeriod?: string | null;
  effectiveDate?: string | null;
  terminationPeriod?: string | null;
  terminationDate?: string | null;
}

export interface CustomerLOV {
  customerId: string;
  name: string;
}

export interface ConsigneeLOV {
  consigneeId: string;
  name: string;
}

export interface ProductCodeLOV {
  productCode: string;
  description: string;
}

export interface ProductTypeLOV {
  productType: string;
  description: string;
}
