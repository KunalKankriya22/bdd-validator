/**
 * TypeScript models and DTOs for Offline Product Shipment functionality
 * Based on API documentation: offline-product-shipment-api-documentation.md
 */

// ==================== API Response DTOs ====================

/**
 * Offline Product Shipment Charge Response DTO
 * Represents a charge associated with a shipment order (ORDER_CHARGES table)
 */
export interface OfflineProductShipmentChargeDto {
  shipmentNo: string;
  orderNo: string;
  chargeCode: string | null;
  chargeCodeDesc: string | null;
  amount: number | null;
  crDbInd: string | null;
  crDbDesc: string | null;
  chapterId: string;
  quantity: number | null;
  isNew?: boolean;
}

// ==================== API Request DTOs ====================

/**
 * Create Offline Product Shipment Charge Request DTO
 */
export interface CreateOfflineProductShipmentChargeDto {
  shipmentNo: string; // Required, max 14 characters
  orderNo: string; // Required, max 14 characters
  chargeCode?: string; // Optional, max 5 characters (corrected per DB)
  amount?: number; // Optional, must be positive (DB column: AMOUNT)
  crDbInd?: string;
  quantity?: number;
}

export interface UpdateOfflineProductShipmentChargeDto {
  chargeCode?: string;
  amount?: number;
  crDbInd?: 'C' | 'D'; // Credit or Debit
  quantity?: number; // positive integer
}

/**
 * Query/Filter DTO for fetching charges
 */
export interface OfflineProductShipmentQueryDto {
  shipmentNo?: string;
  orderNo?: string;
  chargeCode?: string;
  crDbInd?: 'C' | 'D';
  searchKeyword?: string;
  sortColumn?: string;
  sortOrder?: 'ASC' | 'DESC';
}

// ==================== UI Models ====================

export interface ShipmentHeaderDto {
  shipmentNo: string;
  consigneeId?: string;
  shipmentDate?: string | Date;
  shipmentStatus?: string;
  shipmentType?: string;
  carrier?: string;
  carrierDesc?: string;
  trackNo?: string;
  flightNo?: string;
  consigneeName?: string;
  address1?: string;
  address2?: string;
  address3?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  zone?: string;
}

export interface CreateShipmentHeaderDto {
  shipmentNo?: string;
  consigneeId: string;
  shipmentDate: Date;
  carrier?: string;
  trackNo?: string;
  flightNo?: string;
}

export interface BoxDataDto {
  boxId: string;
  boxType?: string;
  packedBy?: string;
  packedDate?: Date;
  orderNo?: string;
  orderClass?: string;
}

export interface ProductInBoxDto {
  boxId: string;
  productCode?: string;
  aboRhDesc?: string;
  productCount: number;
}

export interface ConsigneeInZoneDto {
  consigneeId: string;
  name?: string;
  orderClass?: string;
  orderStatus?: string;
  orderStatusDesc?: string;
}

export interface BoxValidateRequestDto {
  boxId: string;
  consigneeId: string;
  shipmentDate: string | Date;
}

export interface BoxValidationResultDto {
  isValid: boolean;
  errorCode?: string;
  errorMessage?: string;
  boxStatus?: string;
  packedDate?: Date;
  boxType?: string;
  packedBy?: string;
}

export interface CompleteBoxEntryRequestDto {
  shipmentNo?: string;
  consigneeId: string;
  shipmentDate: string | Date;
  carrier?: string;
  trackNo?: string;
  flightNo?: string;
  boxId: string;
}

export interface CompleteBoxEntryResponseDto {
  shipmentNo: string;
  success: boolean;
  message?: string;
}

// ==================== Lookup DTOs ====================

export interface ShipmentNumberLookupDto {
  shipmentNo: string;
  consigneeId?: string;
  consigneeName?: string;
  shipmentDate?: string | Date;
}

export interface ConsigneeLookupDto {
  consigneeId: string;
  name?: string;
  zone?: string;
  orderClass?: string;
  orderPriority?: number;
}

export interface ConsigneeDetailDto {
  consigneeId: string;
  name?: string;
  address1?: string;
  address2?: string;
  address3?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  zone?: string;
}

export interface CarrierLookupDto {
  code: string;
  codeDesc?: string;
}

export interface PrinterLookupDto {
  code: string;
  codeDesc?: string;
}

export interface ChargeCodeLookupDto {
  chargeCode: string;
  chargeCodeDesc?: string;
  charge?: number;
  chargeCodeType?: string;
  crDbDesc?: string;
  shipFlag?: string;
}


// ==================== Column Definitions ====================

/**
 * Column definition for Box List data table
 */
export interface BoxListColumn {
  key: 'boxId' | 'type' | 'packedBy' | 'packedDate';
  label: string;
  sortable?: boolean;
  width?: string;
}

/**
 * Column definition for Products In Box data table
 */
export interface ProductsInBoxColumn {
  key: 'boxId' | 'productCode' | 'aboRh' | 'numberOfProducts';
  label: string;
  sortable?: boolean;
  width?: string;
}

/**
 * Column definition for Consignees In Zone data table
 */
export interface ConsigneesInZoneColumn {
  key: 'consignee' | 'name' | 'orderType' | 'status';
  label: string;
  sortable?: boolean;
  width?: string;
}

/**
 * Column definition for Shipment Charges data table
 */
export interface ShipmentChargesColumn {
  key: 'charge' | 'description' | 'quantity' | 'price' | 'creditDebit' | 'actions';
  label: string;
  sortable?: boolean;
  width?: string;
}

// ==================== API Response Wrapper ====================

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  errors?: string[];
}

// ==================== Print Pack List Response ====================

/**
 * Print Pack List Response DTO
 * TODO: Backend implementation pending
 */
export interface PrintPackListResponseDto {
  shipmentNo: string;
  success: boolean;
  message: string;
}

export interface PackListPrintConfirmationResult {
  print: boolean;
  printerId?: string;
}

export interface FinalizeShipmentResponseDto {
  shipmentNo: string;
  success: boolean;
  message?: string;
}
