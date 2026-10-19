/**
 * API response wrapper (list endpoints)
 */
export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T[] | null;
  totalCount: number;
  error?: string;
  errorResponse?: { errorCode: string; error: string };
}

/**
 * Generic LOV option — shape returned by customers dropdown:
 * { code, description }
 */
export interface LovOption {
  code: string;
  description: string;
}

/**
 * Customer LOV option — API returns { code, description }
 */
export type CustomerLovOption = LovOption;

/**
 * Reason code LOV option — API returns { reasonCode, reasonDescription, tranType }
 */
export interface ReasonCodeOption {
  reasonCode: string;
  reasonDescription: string;
  tranType: string;
}

/**
 * Product code option used in the dropdown list after unit validation
 */
export interface ProductCodeOption {
  productCode: string;
  productDescription: string;
}

/**
 * Validate unit response DTO — data is a single object, not an array
 * Endpoint: GET /blood-product-credit/validate-unit/{unitId}?customerId=...
 */
export interface ValidateUnitResponseDto {
  unitId: string;
  productCode: string;
  aliquot: string | null;
  bloodType: string | null;
  collectionDate: string | null;
  shippedDate: string | null;
  expirationDate: string | null;
  stockState: string | null;
  customerId: string;
  orderNo: string | null;
}

/**
 * Single-item API response wrapper (validate-unit returns data as object, not array)
 */
export interface ApiSingleResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T | null;
  error?: string;
  errorResponse?: { errorCode: string; error: string };
}

/**
 * Blood Product Credit record DTO (response)
 * Maps to CUSTOMER_DBCR_ADJUST table
 */
export interface BloodProductCreditDto {
  unitId: string;
  productCode: string | null;
  requestedBy: string | null;
  requestDate: string | null;
  reasonCode: string | null;
  reasonDescription: string | null;
  tranType: string | null;
  customerId: string;
  aliquot: string | null;
  amount: number | null;
  noteId: number | null;
}

/**
 * Create request DTO
 */
export interface CreateBloodProductCreditDto {
  customerId: string;
  tranType: string;
  unitId: string;
  productCode: string | null;
  requestedBy: string | null;
  requestDate: string | null;
  reasonCode: string | null;
  aliquot: string | null;
  amount: number | null;
  orderNo: string | null;
}

/**
 * Update request DTO — unitId is the route param, not in the body
 */
export interface UpdateBloodProductCreditDto {
  productCode: string | null;
  reasonCode: string | null;
  tranType: string | null;
  requestedBy: string | null;
  requestDate: string | null;
  amount: number | null;
  aliquot: string | null;
}

/**
 * Tran type static options — DB stores 'CR' (Credit) / 'DB' (Debit), MaxLength=2 per FMB
 */
export const TRAN_TYPE_OPTIONS: LovOption[] = [
  { code: 'CR', description: 'Credit' },
  { code: 'DB', description: 'Debit' },
];
