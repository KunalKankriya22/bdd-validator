// Response DTOs (from API)

export interface ShipDiscardSalvageShipmentDto {
  shipmentNo: string;          // Unique shipment identifier (14 chars)
  chapterId: string;           // Chapter identifier (4 chars)
  consigneeId: string;         // Consignee/discard destination ID (10 chars)
  consigneeName: string;       // Consignee name
  address1?: string;           // Address line 1
  address2?: string;           // Address lines 2 & 3 combined
  city?: string;               // City
  state?: string;              // State code (2 chars)
  zip?: string;                // Zip/postal code
  country?: string;            // Country
  shipmentDate: string;        // Date shipment created (ISO DateTime)
  shipmentStatus: string;      // Status: 'OP' (Open), 'CL' (Closed)
  carrier?: string;            // Carrier code (5 chars)
  carrierDescription?: string; // Carrier name/description
  trackingNo?: string;         // Tracking number (30 chars)
  flightNo?: string;           // Flight number (6 chars)
  boxCount: number;            // Number of boxes in shipment
  invoicePrintedDate?: string; // Date packing list printed (ISO DateTime)
}

/**
 * Box DTO - returned from POST /shipments/{shipmentNo}/boxes and GET /consignees/{consigneeId}/boxes
 */
export interface BoxDto {
  boxId: string;              // Box identifier (10 chars)
  boxStatus: string;          // Status: 'CL' (Closed), 'OP' (Open)
  boxType?: string;           // Box type code
  boxTypeDescription?: string; // Box type description
  packedByUserId?: string;    // User who packed the box
  packedByUserName?: string;  // Packed by user name (formatted)
  packedDate?: string;        // Date box was packed (ISO DateTime)
}

// ===========================
// Request DTOs (to API)
// ===========================

/**
 * Create Shipment Request - POST /api/ship-discard-salvage/shipments
 */
export interface CreateShipDiscardSalvageShipmentRequestDto {
  consigneeId: string;  // Max 10 chars, required - Must have boxes available
  carrier: string;      // Max 5 chars, required - Must be active carrier
  trackingNo: string;   // Max 30 chars, required
  flightNo?: string;    // Max 6 chars, optional
}

/**
 * Add Box to Shipment Request - POST /api/ship-discard-salvage/shipments/{shipmentNo}/boxes
 */
export interface AddBoxToShipmentRequestDto {
  boxId: string;  // Max 10 chars, required - Must exist, closed, belong to consignee
}

// ===========================
// API Response Wrappers
// ===========================

/**
 * Standard API response wrapper for list data
 */
export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T[];
  totalCount?: number;
}

/**
 * Standard API response wrapper for single item
 */
export interface ApiSingleResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T[];
}

/**
 * Standard error response from API
 */
export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  errorCode?: string;
  errorResponse?: {
    errorCode: string;
    error: string;
  };
  message?: string;
}

// ===========================
// Frontend Models (transformed from DTOs)
// ===========================

/**
 * Shipment model for frontend use
 */
export interface ShipDiscardSalvageShipment {
  shipmentNo: string;
  chapterId: string;
  consigneeId: string;
  consigneeName: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  shipmentDate: Date;
  shipmentStatus: 'OP' | 'CL';
  carrier: string;
  carrierDescription: string;
  trackingNo: string;
  flightNo: string;
  boxCount: number;
  invoicePrintedDate: Date | null;
  // UI-specific fields
  fullAddress: string;  // Computed: address1, address2, city, state, zip
}

/**
 * Box model for frontend use
 */
export interface ShipDiscardSalvageBox {
  boxId: string;
  boxStatus: string;
  boxType: string;
  boxTypeDescription: string;
  packedByUserId: string;
  packedByUserName: string;
  packedDate: Date | null;
}

// ===========================
// Dropdown/Lookup Models
// ===========================

/**
 * Consignee lookup item for dropdown
 */
export interface ConsigneeLookup {
  consigneeId: string;
  consigneeName: string;
  description: string;  // Formatted: "ID - Name"
  address1?: string;
  state?: string;
  country?: string;
}

/**
 * Carrier lookup item for dropdown
 */
export interface CarrierLookup {
  carrierCode: string;
  carrierName: string;
  description: string;  // Formatted: "Code - Name"
  isActive: boolean;
}

/**
 * Shipment number lookup item for dropdown
 */
export interface ShipmentNumberLookup {
  shipmentNo: string;
  consigneeName: string;
  description: string;  // Formatted: "ShipmentNo - ConsigneeName"
}

// ===========================
// Dialog Models
// ===========================

export interface ShipmentChargesDialogData {
  shipmentNo: string;
  consigneeId: string;
  consigneeName: string;
  finalizeOnSave?: boolean;
  boxCount?: number;
}

/**
 * Shipment Charge Item - from API GET /shipments/{shipmentNo}/charges
 */
export interface ShipmentCharge {
  chargeCode: string;
  description: string;
  quantity: number;
  price: number;
  amount: number;
  crDbInd: string;
  crDbDesc: string;
  orderNo: string;
  shipmentNo: string;
  deletableFlag: string;
  isNew?: boolean;
}

/**
 * Charge code lookup - from API GET /charge-codes
 */
export interface ChargeCodeLookup {
  chargeCode: string;
  chargeCodeDesc: string;
  charge: number;
  chargeCodeType: string;
  crDbDesc: string;
  shipFlag: string;
}

/**
 * Credit/Debit type - from API GET /credit-debit-types
 */
export interface CreditDebitType {
  code: string;
  codeDesc: string;
}

/**
 * Request to add a charge to a shipment
 */
export interface CreateShipmentChargeRequestDto {
  chargeCode: string;
  quantity: number;
}

/**
 * View Consignees Dialog Data
 */
export interface ViewConsigneesDialogData {
  shipmentNo: string;
  consigneeId: string;
}

/**
 * Consignee in Same Zone - from API GET /consignees/{consigneeId}/zone-peers
 */
export interface ConsigneeInSameZone {
  consigneeId: string;
  consigneeName: string;
  orderClass?: string;
  orderStatus?: string;
  orderStatusDesc?: string;
}

/**
 * View Shipped Boxes Dialog Data
 */
export interface ViewShippedBoxesDialogData {
  shipmentNo: string;
  boxes: ShipDiscardSalvageBox[];
}

/**
 * Shipped Box Product - from API GET /shipments/{shipmentNo}/products
 */
export interface ShippedBoxProduct {
  boxId: string;
  productCode: string;
  orderedAboRh: string;
  count: number;
}

// ===========================
// Error Code Mappings
// ===========================

/**
 * Error code to user-friendly message mapping
 */
export const ERROR_MESSAGES: Record<string, string> = {
  '0334': 'Box not found in warehouse',
  '4002': 'Invalid value (must be Y or N)',
  '4003': 'Shipment not open or already invoiced',
  '4004': 'Box does not belong to this consignee',
  '4013': 'Box must be closed before shipping',
  '4201': 'Invalid box ID format',
  '4306': 'Shipment not found or not type DI (discard)',
  '4307': 'Carrier not found or not active',
  '4309': 'No boxes found for this consignee',
};

// ===========================
// Filter/Search Models
// ===========================

/**
 * Search filter for shipments
 */
export interface ShipmentSearchFilter {
  shipmentNo?: string;
  consigneeId?: string;
}

// ===========================
// Form Models
// ===========================

/**
 * Form data for creating a new shipment
 */
export interface ShipmentFormData {
  consigneeId: string;
  carrier: string;
  trackingNo: string;
  flightNo: string;
}

/**
 * Form data for adding a box
 */
export interface BoxFormData {
  boxId: string;
}
