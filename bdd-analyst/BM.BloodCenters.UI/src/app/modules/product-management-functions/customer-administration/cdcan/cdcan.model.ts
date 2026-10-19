/**
 * TypeScript interfaces and DTOs for Cancel Debit/Credit Advice
 * Generated from API documentation: cancel-debit-credit-advice-api-documentation.md
 */

/**
 * Customer Debit/Credit Advice DTO (Response)
 * Represents a single advice record from CUSTOMER_DBCR_ADJUST table
 */
export interface CustomerDbcrAdjustDto {
  adviceId: string;
  chapterId: string;
  customerId: string;
  customerName: string | null;
  tranType: string;
  tranTypeDesc: string | null;
  reasonCode: string;
  reasonDesc: string | null;
  requestDate: string | null;
  requestedBy: string | null;
  orderNo: string | null;
  serviceCode: string | null;
  serviceCodeDesc: string | null;
  productCode: string | null;
  aliquot: string | null;
  unitId: string | null;
  quantity: number | null;
  amount: number | null;
  insertUserId: string;
  insertUserName: string | null;
  insertDate: string;
  noteId: number | null;
  note1: string | null;
  note2: string | null;
  note3: string | null;
  patientName: string | null;
  errorCorrectFlag: string | null;
  errorCorrectUser: string | null;
  errorCorrectDate: string | null;
}

/**
 * Query DTO for filtering advice records (Request)
 */
export interface CustomerDbcrAdjustQueryDto {
  customerId?: string | null;
  adviceId?: string | null;
  tranType?: string | null;
  orderNo?: string | null;
  fromDate?: string | null;
  toDate?: string | null;
  searchKeyword?: string | null;
  sortColumn?: string | null;
  sortOrder?: string | null;
}

/**
 * Cancel Advice Request DTO
 */
export interface CancelAdviceRequestDto {
  adviceId: string;
  confirmation: 'Y' | 'N';
}

/**
 * Customer dropdown list of values
 */
export interface CustomerLOV {
  customerId: string;
  customerName: string;
}

/**
 * Advice dropdown list of values
 */
export interface AdviceLOV {
  adviceId: string;
  displayText: string;
  insertDate?: string;
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message?: string;
  data?: T;
  item?: T;
  total?: number;
  errorCode?: string;
  errorResponse?: {
    errorCode: string;
    error: string;
  };
}
