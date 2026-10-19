/**
 * Hospital Return Item Models
 * Based on API documentation: hospital-return-item-api-documentation.md
 * JIRA: MLT-14068
 * Form: IMIRETN
 */

/**
 * Hospital Return Item DTO
 * Represents a single hospital return item
 */
export interface HospitalReturnItemDto {
  unitId: string;
  checkDigit?: string;
  productCode?: string;
  aliquot?: string;
  aboRh?: string;
  expDate?: string; // ISO datetime
  returnReasonCode?: string;
  returnReasonDescription?: string;
  locationId?: string;
  returnAdviceId: string;
  chapterId?: string;
  collDate?: string; // Date string (YYYY-MM-DD)
  insertDate?: string; // ISO datetime
  customerId?: string;
  programId?: string;
  crDbInd?: string; // CR or DB
  moveDate?: string; // Date string (YYYY-MM-DD)
}

/**
 * Query DTO for filtering and searching hospital return items
 * Used with POST /lab/hospital-returns/items/{take}/{skip}
 */
export interface HospitalReturnItemQueryDto {
  returnAdviceId?: string;
  unitId?: string;
  productCode?: string;
  returnReasonCode?: string;
  customerId?: string;
  collDateFrom?: string;
  collDateTo?: string;
  searchKeyword?: string;
  sortColumn?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface DropdownOption {
  value: string;
  label: string;
}

export interface ReturnCodeOption extends DropdownOption {
  destination?: string;
  creditNoCredit?: string;
}

/**
 * Create Hospital Return Item DTO
 * Used with POST /lab/hospital-returns/items
 */
export interface CreateHospitalReturnItemDto {
  unitId: string; // Required, max 15 chars
  returnAdviceId: string; // Required, max 13 chars
  productCode?: string; // Max 8 chars
  aliquot?: string;
  expDate?: string; // ISO datetime
  returnReasonCode?: string; // Max 5 chars
  locationId?: string; // Max 17 chars
  collDate?: string; // Date string (YYYY-MM-DD)
  customerId?: string; // Max 10 chars
  crDbInd?: string; // CR or DB
  moveDate?: string; // Date string (YYYY-MM-DD)
}

/**
 * Update Hospital Return Item DTO
 * Used with PUT /lab/hospital-returns/items/{unitId}/{returnAdviceId}
 */
export interface UpdateHospitalReturnItemDto {
  productCode?: string; // Max 8 chars
  aliquot?: string;
  expDate?: string; // ISO datetime
  returnReasonCode?: string; // Max 5 chars
  locationId?: string; // Max 17 chars
  collDate?: string; // Date string (YYYY-MM-DD)
  customerId?: string; // Max 10 chars
  crDbInd?: string; // CR or DB
  moveDate?: string; // Date string (YYYY-MM-DD)
}

/**
 * API Response wrapper
 */
export interface HospitalReturnItemApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T[];
  total?: number;
  returnAdviceId?: string;
}

/**
 * Error response structure
 */
export interface HospitalReturnItemErrorResponse {
  success: boolean;
  statusCode: number;
  errorCode?: string;
  message: string;
  errorResponse?: {
    errorCode: string;
    error: string;
  };
}

/**
 * BE response types for dropdown/LOV endpoints
 */
export interface OpenReturnAdviceResult {
  returnAdviceId: string;
  consigneeId?: string;
  returnDate?: string;
}

export interface ReturnAdviceDetail {
  returnAdviceId: string;
  chapterId?: string;
  consigneeId?: string;
  customerId?: string;
  customerName?: string;
  returnDate?: string;
  returnUserId?: string;
  returnedBy?: string;
  adviceStatus?: string;
}

export interface CustomerSearchResult {
  customerId: string;
  customerName?: string;
  customerType?: string;
}

export interface ReturnReasonListResult {
  code: string;
  codeDescription?: string;
  destination?: string;
  creditNoCredit?: string;
  enforce?: string;
}

export interface ProductCodeListResult {
  productCode: string;
  productDescription?: string;
}

export interface BloodTypeListResult {
  aboCode: string;
  aboDescription?: string;
}

export interface ContactListResult {
  returnedBy: string;
}

/**
 * Scan Product - POST /lab/hospital-returns/items/scan-product
 */
export interface ScanProductRequest {
  scannedUnitId: string;
  returnAdviceId?: string;
  customerId?: string;
}

export interface ScanProductResult {
  unitId: string;
  checkDigit?: string;
  codeScheme?: string;
  entryMode?: string;
  productCode?: string;
  productCodeDesc?: string;
  aliquot?: string;
  collDate?: string;
  expDate?: string;
  bloodType?: string;
  customerId?: string;
  customerName?: string;
  customerType?: string;
  inventoryClass?: string;
  stockState?: string;
  shipmentNo?: string;
  orderDate?: string;
  returnAdviceCustomerId?: string;
  returnAdviceCustomerName?: string;
  returnAdviceCustomerType?: string;
  customerMismatch: boolean;
}

/**
 * Evaluate Return - POST /lab/hospital-returns/items/evaluate-return
 */
export interface EvaluateReturnRequest {
  unitId: string;
  returnAdviceId?: string;
  returnReasonCode: string;
  productCode?: string;
  aliquot?: string;
  collDate?: string;
  expDate?: string;
  bloodType?: string;
  customerId?: string;
  customerType?: string;
  inventoryClass?: string;
  returnedFromCustomerId?: string;
  returnedFromCustomerType?: string;
}

export interface EvaluateReturnResult {
  creditDecision: string;
  routingDecision: string;
  locationId: string;
  moveDate?: string;
  isExpired: boolean;
  isBiohazard: boolean;
  isDirectedDonor: boolean;
  feeCode1?: string;
  feeCode2?: string;
  warnings: string[];
}

/**
 * Commit Return - POST /lab/hospital-returns/items/commit-return
 */
export interface CommitReturnRequest {
  unitId: string;
  returnAdviceId?: string;
  productCode?: string;
  aliquot?: string;
  collDate?: string;
  expDate?: string;
  bloodType?: string;
  customerId?: string;
  checkDigit?: string;
  codeScheme?: string;
  returnReasonCode: string;
  creditDecision: string;
  routingDecision: string;
  locationId: string;
  moveDate?: string;
  visuallyChecked: boolean;
  shipmentNo?: string;
}

export interface CommitReturnResult {
  unitId: string;
  returnAdviceId: string;
  creditDecision: string;
  routingDecision: string;
  locationId: string;
  returnItemInserted: boolean;
  shippedProductUpdated: boolean;
  pickSlipProductUpdated: boolean;
  activeProductInserted: boolean;
  discardProductInserted: boolean;
}

/**
 * Printer list result from GET /lab/hospital-returns/advices/printers
 */
export interface PrinterResult {
  printerId: string;
  printerDescription?: string;
}

/**
 * Return Advice query DTO for POST /lab/hospital-returns/advices/{take}/{skip}
 */
export interface ReturnAdviceQueryDto {
  returnAdviceId?: string;
  customerId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  sortColumn?: string;
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * Create Return Advice request for POST /lab/hospital-returns/advices
 */
export interface CreateReturnAdviceDto {
  consigneeId?: string;
  customerId?: string;
  returnedBy?: string;
}

/**
 * Update Return Advice request for PUT /lab/hospital-returns/advices/{returnAdviceId}
 */
export interface UpdateReturnAdviceDto {
  consigneeId?: string;
  returnedBy?: string;
}

/**
 * Close Return Advice request for PUT /lab/hospital-returns/advices/{id}/close
 */
export interface CloseReturnAdviceRequest {
  printerId: string;
  printPickSlip: boolean;
}

/**
 * CR/DB Indicator options
 */
export const CR_DB_OPTIONS = [
  { value: 'CR', label: 'CR' },
  { value: 'DB', label: 'DB' },
] as const;

/**
 * Table column definitions for display
 */
export interface HospitalReturnItemTableColumn {
  key: keyof HospitalReturnItemDto;
  label: string;
  sortable: boolean;
}

export const HOSPITAL_RETURN_ITEM_COLUMNS: HospitalReturnItemTableColumn[] = [
  { key: 'unitId', label: 'Unit ID', sortable: true },
  { key: 'returnAdviceId', label: 'Return Advice ID', sortable: true },
  { key: 'productCode', label: 'Product Code', sortable: true },
  { key: 'collDate', label: 'Collection Date', sortable: true },
  { key: 'expDate', label: 'Expiration Date', sortable: true },
  { key: 'returnReasonCode', label: 'Return Reason', sortable: true },
  { key: 'customerId', label: 'Customer ID', sortable: true },
  { key: 'locationId', label: 'Location ID', sortable: true },
  { key: 'crDbInd', label: 'CR/DB', sortable: false },
];
