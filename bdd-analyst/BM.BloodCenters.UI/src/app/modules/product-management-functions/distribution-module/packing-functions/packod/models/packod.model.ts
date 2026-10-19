export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message?: string;
  data?: T;
  total?: number;
}

export interface DiscardProductDto {
  unitId: string;
  productCode: string | null;
  productType: string | null;
  bloodType: string | null;
  aboDesc: string | null;
  productDesc: string | null;
  aliquot: string | null;
  expDate: string | null;
  collDate: string | null;
  productStatus: string;
  boxId: string | null;
  pickSlipId: string | null;
  chkDigit: string | null;
}

export interface DiscardProductQueryDto {
  productType?: string | null;
  searchKeyword?: string | null;
  sortColumn?: string | null;
  sortOrder?: string | null;
}

export interface ConsigneeDto {
  consigneeId: string;
  name: string | null;
  address: string | null;
  customerId: string | null;
  customerType: string | null;
}

export interface ProductTypeLookupDto {
  productType: string;
  productTypeDesc: string | null;
}

export interface OpenBoxDto {
  boxId: string;
  productCount: number;
  createdDate: string | null;
}

export interface AddProductToBoxRequestDto {
  unitId: string;
  productCode: string;
  aliquot?: string | null;
  bloodType?: string | null;
  expDate?: string | null;
  boxId: string;
  consigneeId?: string | null;
  orderNo?: string | null;
  productType?: string | null;
}

export interface CloseBoxRequestDto {
  boxId?: string;
  qcFlag?: string;
  allProperlyPacked: boolean;
}

export interface CloseBoxResponseDto {
  boxId: string;
  closedDate?: string;
}

export interface ProductCodeLookupDto {
  productCode: string;
  productDesc: string | null;
}

export interface BloodTypeLookupDto {
  bloodType: string;
  aboDesc: string | null;
  expDate: string | null;
}

export interface OrderLookupDto {
  orderNo: string;
}

export interface PackProductResponse {
  boxId: string;
  orderNo: string;
  pickSlipId: string;
}

export type SortColumn = 'UnitId' | 'ProductCode' | 'ExpDate';
export type SortOrder = 'ASC' | 'DESC';
