/**
 * Models for Regenerate Electronic Plasma File feature
 * API Documentation: regenerate-plasma-file-api-documentation.md
 * JIRA: MLT-14005
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
}

/**
 * Pending Shipment (for dropdown)
 * Endpoint: GET /plasma-file-regeneration/pending-shipments
 */
export interface PendingShipment {
  shipmentNo: string;
  consigneeId: string;
  consigneeName: string;
  customerId: string;
  shipmentDate: string;
  shipmentStatus: string;
  shipmentType: string;
  chapterId: string;
}

/**
 * Shipment Details (full details)
 * Endpoint: GET /plasma-file-regeneration/shipment/{shipmentNo}
 */
export interface RegeneratePlasmaFileShipmentDto {
  shipmentNo: string;
  consigneeId: string;
  consigneeName: string;
  customerId: string;
  address1: string | null;
  address2: string | null;
  address3: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string | null;
  zone: string | null;
  carrier: string | null;
  carrierDescription: string | null;
  trackNo: string | null;
  flightNo: string | null;
  shipmentDate: string;
  shipmentStatus: string;
  shipmentType: string;
  plasmaFileType: string | null;
  chapterId: string;
}

/**
 * Request DTO for regenerating plasma file
 * Endpoint: POST /plasma-file-regeneration/regenerate
 */
export interface RegeneratePlasmaFileRequestDto {
  shipmentNo: string;      // Required, max 14 chars
  trackNo: string;         // Required, max 30 chars (DB: SHIPMENTS.TRACK_NO VARCHAR2(30))
  flightNo?: string;       // Optional, max 6 chars (DB: SHIPMENTS.FLIGHT_NO VARCHAR2(6))
  carrier?: string;        // Optional, max 5 chars (DB: SHIPMENTS.CARRIER VARCHAR2(5))
}

/**
 * Response DTO for regeneration result
 * Endpoint: POST /plasma-file-regeneration/regenerate
 */
export interface RegeneratePlasmaFileResponseDto {
  success: boolean;
  message: string;
  shipmentNo: string;
  fileType: string;
  fileName: string;
  statusCode: string;
}

/**
 * Carrier lookup
 * Endpoint: GET /plasma-file-regeneration/carriers
 */
export interface PlasmaFileCarrierDto {
  code: string;
  codeDesc: string;
}

/**
 * Error response model
 */
export interface RegeneratePlasmaFileErrorResponse {
  success: false;
  message: string;
  shipmentNo?: string;
  statusCode: string;
  fileType?: string;
}
