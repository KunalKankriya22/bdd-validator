/**
 * Response wrapper for API calls
 */
export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T[] | null;
  totalCount: number;
}

/**
 * Customer Debit/Credit Query DTO (Response Model)
 * Maps to LAB.CUSTOMER_DBCR_ADJUST table
 */
export interface CustomerDebitCreditQueryDto {
  adviceId: string;
  insertDate: string;
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
  insertUserId: string;
  insertUserName: string | null;
  amount: number | null;
  errorCorrectFlag: string | null;
  errorCorrectDate: string | null;
  errorCorrectUser: string | null;
  errorCorrectName: string | null;
  patientName: string | null;
  note1: string | null;
  customerId: string;
  chapterId: string;
  noteId: number | null;
}

/**
 * Filter DTO for querying customer debit/credit records
 */
export interface CustomerDebitCreditQueryFilterDto {
  adviceId?: string | null;
  customerId?: string | null;
  orderNo?: string | null;
  tranType?: string | null;
  reasonCode?: string | null;
  serviceCode?: string | null;
  productCode?: string | null;
  unitId?: string | null;
  insertDateFrom?: string | null;
  insertDateTo?: string | null;
  requestDateFrom?: string | null;
  requestDateTo?: string | null;
  requestedBy?: string | null;
  insertUserId?: string | null;
  errorCorrectFlag?: string | null;
  searchKeyword?: string | null;
}

/**
 * List of Values option for dropdowns
 */
export interface LovOption {
  code: string;
  description: string;
}

/**
 * Customer LOV with additional description field
 */
export interface CustomerLovOption extends LovOption {
  customerId: string;
  customerDescription: string;
}
