/**
 * Define Order Charges - Data Models
 *
 * This file contains all TypeScript interfaces and types for the Define Order Charges module.
 * Models are based on Figma design (MLT-13101) and API contract requirements.
 * Updated: 2026-05-21 - Added shipmentCharge support for Y/N/S/B values
 */

/**
 * Frontend display model for Order Charge (camelCase)
 * Used in the UI table and forms
 */
export interface OrderChargeModel {
  serviceCode: string;
  serviceCodeDescription: string;
  charge: number;
  modifyCharge: 'Yes' | 'No';
  chargeType: string;  // 'Debit' or 'Credit' - from API chargeCodeTypeDesc
  shipmentCharge: 'Y' | 'N' | 'S' | 'B';  // Y=Entry at shipment, N=No, S=Default, B=Box
  orderNumber: 'Yes' | 'No';
  effectiveDate: string;  // DD-MMM-YYYY format for display
  targetDate?: string | null;  // DD-MMM-YYYY format for display
  lastModifiedDate?: string;
}

/**
 * API response model for Order Charge (camelCase as per API doc)
 * Matches backend DTO structure from /api/v1/order-charges
 */
export interface OrderChargeApiModel {
  chargeCode: string;
  chargeCodeDesc: string;
  charge: number;
  editCharge: string | null;  // 'Y' or 'N' or null
  chargeCodeType: string;  // 'DB' or 'CR'
  chargeCodeTypeDesc: string;  // 'Debit' or 'Credit'
  shipFlag: string | null;  // 'Y' or 'N' or null
  crNcr: string | null;  // 'Y' or 'N' or null
  serviceCode: string;  // always = chargeCode
  effectiveDate: string;  // dd-MMM-yyyy format
  terminationDate: string | null;  // dd-MMM-yyyy format
  lastModifiedDate?: string;  // dd-MMM-yyyy hh:mm tt format
}

/**
 * API response structure for paginated list
 */
export interface OrderChargesApiResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: OrderChargeApiModel[];
  total: number;
}

/**
 * DTO for creating a new order charge (POST request)
 */
export interface OrderChargeCreateDto {
  chargeCode: string;
  chargeCodeDesc: string;
  charge: number;
  editCharge: 'Y' | 'N';
  chargeCodeType: 'DB' | 'CR';  // DB = Debit, CR = Credit
  shipFlag: 'Y' | 'N' | null;
  crNcr: 'Y' | 'N' | null;
  effectiveDate: string;  // YYYY-MM-DD format
  terminationDate?: string | null;  // YYYY-MM-DD format
}

/**
 * DTO for updating an existing order charge (PUT request)
 * originalChargeCode identifies the record to update
 */
export interface OrderChargeUpdateDto {
  chargeCode: string;
  originalChargeCode: string;  // REQUIRED - identifies the record to update
  chargeCodeDesc: string;
  charge: number;
  editCharge: 'Y' | 'N';
  chargeCodeType: 'DB' | 'CR';
  shipFlag: 'Y' | 'N' | null;
  crNcr: 'Y' | 'N' | null;
  effectiveDate: string;  // YYYY-MM-DD format
  terminationDate?: string | null;  // YYYY-MM-DD format
}

/**
 * Filter form values (what the user enters in the filter panel)
 */
export interface OrderChargesFilterFormValue {
  serviceCode?: string | null;
  effectiveDate?: string | null;  // YYYY-MM-DD format
  effectiveDatePeriod?: 'AFTER' | 'BEFORE' | null;
  terminationDate?: string | null;  // YYYY-MM-DD format
  terminationDatePeriod?: 'AFTER' | 'BEFORE' | null;
}

/**
 * Request parameters for API calls (filters, pagination, sorting)
 * Sent in POST body to /api/v1/order-charges/{take}/{skip}
 */
export interface OrderChargesRequestParams {
  searchKeyword?: string | null;  // Search by chargeCode + chargeCodeDesc
  sortColumn?: string | null;  // Column name to sort by
  sortOrder?: string | null;  // 'ASC' or 'DESC'
  filterServiceCode?: string | null;  // Filter by specific service code
  filterEffectiveDateAfter?: string | null;  // YYYY-MM-DD format
  filterEffectiveDateBefore?: string | null;  // YYYY-MM-DD format
  filterTermDateAfter?: string | null;  // YYYY-MM-DD format
  filterTermDateBefore?: string | null;  // YYYY-MM-DD format
}

/**
 * Dropdown options for filters
 */
export interface ServiceCodeDropdownOption {
  code: string;
  description: string;
}

/**
 * Charge Type LOV option
 */
export interface ChargeTypeLovOption {
  code: string;  // 'CR' or 'DB'
  description: string;  // 'Credit' or 'Debit'
}

/**
 * API response for filter service codes
 */
export interface FilterServiceCodesApiResponse {
  success: boolean;
  data: ServiceCodeDropdownOption[];
  total: number;
}

/**
 * API response for charge type LOV
 */
export interface ChargeTypeLovApiResponse {
  success: boolean;
  data: ChargeTypeLovOption[];
  total: number;
}

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
  errors?: string[];
}
