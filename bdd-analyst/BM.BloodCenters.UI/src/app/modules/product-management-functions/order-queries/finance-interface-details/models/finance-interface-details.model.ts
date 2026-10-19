export interface ReturnResult<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data?: T[];
  item?: T;
  total?: number;
  errorCode?: string;
  errorResponse?: { errorCode: string; error: string };
}

export interface FinanceInterfaceSearchRequest {
  orderNo: string;
  insertDateUtc: string;
}

export interface OrderLookupDto {
  orderNo: string;
  customerName: string;
  insertDate: string;
}

export interface InsertDateLookupDto {
  insertDateDisplay: string;
  insertDateUtc: string;
  insertDateLocal: string;
}

export interface FinanceInterfaceHeaderDto {
  recordType: string;
  fiCompanyNo: string;
  orderNo: string;
  arAccount: string;
  invDesc: string;
  insertDate: string;
  orderDate: string;
  shipDate: string;
  interfaceDate: string;
}

export interface FinanceInterfaceDetailDto {
  recordType: string;
  fiCompanyNo: string;
  orderNo: string;
  arAccount: string;
  itemId: string;
  tranType: string;
  insertDate: string;
  shipDate: string;
  interfaceDate: string;
  orderQty: number | null;
  shipQty: number | null;
  stdPrice: number;
  returnAdviceId: string;
  priceSchedule: string;
  text1: string;
  text2: string;
  lineDesc1: string;
  lineDesc2: string;
}

export interface FinanceInterfaceResponseDto {
  header: FinanceInterfaceHeaderDto | null;
  details: FinanceInterfaceDetailDto[];
  totalDetailCount: number;
  customerName: string;
}
