/**
 * Ship Products Models
 * Generated from API Documentation: MLT-14109
 * Database Table: DIST.SHIPMENTS
 */

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  total?: number;
  errorCode?: string;
  errorResponse?: {
    errorCode: string;
    error: string;
  };
}

/**
 * Shipment DTO - Response model
 * Represents shipment data returned from API
 */
export interface ShipmentDto {
  shipmentNo: string;
  chapterId: string;
  consigneeId: string;
  consigneeName: string | null;
  address1: string | null;
  address2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country?: string | null;
  shipmentDate: string; // ISO DateTime
  shipmentStatus: string;
  shippedByUserId: string;
  shipmentType: string;
  carrier: string | null;
  carrierDescription: string | null;
  trackNo: string | null;
  flightNo: string | null;
  invoicePrintedDate: string | null; // ISO DateTime
  programId: string | null;
}

/**
 * Create Shipment DTO - Request model for creating new shipment
 */
export interface CreateShipmentDto {
  shipmentNo?: string | null; // Auto-generated if null
  consigneeId: string; // Required: Max 10 chars, must exist
  carrier?: string | null; // Optional: Max 5 chars, must be active
  trackNo: string; // Required: Max 30 chars
  flightNo?: string | null; // Optional: Max 6 chars
  shipmentType?: string; // Optional: Default "RE"
  shipmentStatus?: string; // Optional: Default "OP"
}

/**
 * Update Shipment DTO - Request model for updating existing shipment
 */
export interface UpdateShipmentDto {
  carrier?: string | null; // Optional: Max 5 chars, must be active
  trackNo: string; // Required: Max 30 chars
  flightNo?: string | null; // Optional: Max 6 chars
  shipmentStatus?: string | null; // Optional
}

/**
 * Shipment Query DTO - Request model for filtering/searching shipments
 */
export interface ShipmentQueryDto {
  shipmentNo?: string | null;
  consigneeId?: string | null;
  shipmentStatus?: string | null;
  shipmentType?: string | null;
  carrier?: string | null;
  shippedByUserId?: string | null;
  fromDate?: string | null; // YYYY-MM-DD format
  toDate?: string | null; // YYYY-MM-DD format
  searchKeyword?: string | null;
  sortColumn?: string | null;
  sortOrder?: 'ASC' | 'DESC' | null;
}

/**
 * Box DTO - Represents a box/container in a shipment
 * Note: Box data structure inferred from Figma screenshots
 * TODO: Verify with actual Box API endpoint when available
 */
export interface BoxDto {
  boxId: string;
  shipmentNo: string;
  boxType: string;
  boxTypeDescription?: string;
  packedBy: string;
  packedByName?: string;
  packedDate: string; // ISO DateTime
  productCount?: number;
}

/**
 * Box Product DTO - Represents a product in a box
 * From "View Shipped Boxes" dialog in Figma
 * TODO: Verify with actual Box Contents API endpoint when available
 */
export interface BoxProductDto {
  boxId: string;
  productCode: string;
  productDescription?: string;
  orderedAboRh: string;
  count: number;
  unitId?: string;
}

export interface ShipmentChargeDto {
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

export interface CreateShipmentChargeRequestDto {
  chargeCode: string;
  quantity: number;
}

export interface ChargeCodeLookup {
  chargeCode: string;
  chargeCodeDesc: string;
  charge: number;
  chargeCodeType: string;
  crDbDesc: string;
  shipFlag: string;
}

export interface ShipmentChargesDialogData {
  shipmentNo: string;
  consigneeId: string;
  consigneeName: string;
  finalizeOnSave?: boolean;
  boxCount?: number;
  packListPrinterId?: string | null;
}

/**
 * Consignee in Zone DTO - Represents consignee in same delivery zone
 * From "View Consignees in Same Zone" dialog
 * TODO: Verify with actual Consignees in Zone API endpoint when available
 */
export interface ConsigneeInZoneDto {
  consigneeId: string;
  consigneeName: string;
  address1: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  zone: string | null;
  orderClass: string | null;
  orderStatus: string | null;
}

/**
 * Packed box available for shipment (from packed-boxes-for-consignee endpoint)
 */
export interface PackedBoxLookupDto {
  boxId: string;
  orderNo?: string;
  orderClass?: string;
  boxType?: string;
  boxTypeDescription?: string;
  insertDate?: string;
  estArrivalTime?: string;
}

/**
 * Pending shipment data collected from dialog before the shipment is created in the API
 */
export interface PendingShipmentData {
  consigneeId: string;
  consigneeName?: string;
  address1?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  carrier: string | null;
  carrierDescription?: string;
  trackNo: string;
  flightNo: string | null;
}

/**
 * List of Values (LOV) option for dropdowns
 */
export interface LovOption {
  value: string;
  label: string;
  description?: string;
}

/**
 * Field length constraints from database
 * Database Table: DIST.SHIPMENTS
 */
export const SHIPMENT_FIELD_LENGTHS = {
  SHIPMENT_NO: 14,
  CONSIGNEE_ID: 10,
  CARRIER: 5,
  TRACK_NO: 30,
  FLIGHT_NO: 6,
  SHIPMENT_TYPE: 2,
  SHIPMENT_STATUS: 2,
} as const;

/**
 * Validation error codes from API documentation
 */
export const SHIPMENT_ERROR_CODES = {
  INVALID_CONSIGNEE: '1300',
  TRACK_NUMBER_REQUIRED: '0080',
  INVALID_CARRIER: '4307',
  SHIPMENT_NOT_FOUND: '4306',
  SHIPMENT_NOT_AVAILABLE: '4003',
} as const;

/**
 * Shipment status codes
 */
export const SHIPMENT_STATUS = {
  OPEN: 'OP',
  CLOSED: 'CL',
  INVOICED: 'IN',
} as const;

/**
 * Shipment type codes
 */
export const SHIPMENT_TYPE = {
  REGULAR: 'RE',
} as const;

export interface ValidateBoxScanRequest {
  barcode: string;
}

export interface ValidateBoxScanResponse {
  boxId: string;
  isValid: boolean;
  errorMessage?: string;
}
