/**
 * TypeScript interfaces for Delivered Shipments feature
 * Generated from API documentation: MLT-14099
 * Base URL: /api/delivered-shipments
 */

/**
 * Primary response model for shipment data
 */
export interface DeliveredShipmentDto {
  /** Shipment identifier (max 14 chars) */
  shipmentNo: string;

  /** Date and time shipment was received (ISO 8601) */
  receiptDate: string | null;

  /** Carrier description (e.g., "FedEx", "UPS") */
  carrier: string;

  /** Customer/consignee name */
  consigneeName: string;

  /** Concatenated address (includes address1, address2, address3) */
  address: string;

  /** City */
  city: string;

  /** State description (not code) */
  state: string;

  /** Zip/postal code */
  zip: string;

  /** Country */
  country: string;

  /** Order type description */
  orderType: string;

  /** Order class/priority description */
  orderClass: string;

  /** Total number of boxes in shipment */
  totalBoxes: number;

  /** Person who received shipment (max 50 chars) */
  receivedBy: string | null;

  /** Tracking number (max 30 chars) */
  trackingNo: string | null;

  /** Flight number (max 6 chars) */
  flightNo: string | null;

  /** Shipment notes/comments (max 240 chars) */
  note: string | null;

  /** List of products in the shipment */
  products: ShipmentProductDto[];
}

/**
 * Product information within a shipment
 */
export interface ShipmentProductDto {
  /** Box containing the product (max 10 chars) */
  boxId: string;

  /** Unit identifier (max 15 chars) */
  unitId: string;

  /** Computed check digit (max 2 chars) */
  checkDigit: string | null;

  /** Collection date (ISO 8601) */
  collDate: string;

  /** Product code (max 8 chars) */
  productCode: string;

  /** Product description (max 254 chars) */
  productDesc: string | null;

  /** Component prefix/aliquot (max 2 chars) */
  aliquot: string;

  /** ABO/Rh blood type (max 4 chars, e.g., "O+") */
  bloodType: string;

  /** Blood type description (max 20 chars) */
  bloodTypeDesc: string | null;

  /** Expiration date (ISO 8601) */
  expDate: string;

  /** Pick slip identifier (max 13 chars) */
  pickSlipId: string;

  /** Product type code (max 5 chars) */
  productType: string;
}

/**
 * Search criteria for filtering shipments
 * Used in POST /delivered-shipments/{take}/{skip}
 */
export interface DeliveredShipmentQueryDto {
  /** Exact shipment number match */
  shipmentNo?: string;

  /** Filter shipments containing this box */
  boxId?: string;

  /** Filter by consignee ID */
  consigneeId?: string;

  /** Receipt date from (inclusive) */
  fromDate?: string;

  /** Receipt date to (inclusive) */
  toDate?: string;

  /** Column to sort by: ShipmentNo, ReceiptDate, ConsigneeName */
  sortColumn?: string;

  /** Sort direction: ASC or DESC */
  sortOrder?: 'ASC' | 'DESC';

  /** Number of records (set by path parameter) */
  take?: number;

  /** Skip count (set by path parameter) */
  skip?: number;
}

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T | null;
  total?: number;
}

/**
 * Shipment number option for dropdown
 */
export interface ShipmentNumberOption {
  shipmentNo: string;
  receiptDate: string | null;
  consigneeName: string | null;
}

/**
 * Box ID option for dropdown
 */
export interface BoxIdOption {
  boxId: string;
}

/**
 * Pick slip item for dialog display
 */
export interface PickSlipItem {
  pickSlipId: string;
}
