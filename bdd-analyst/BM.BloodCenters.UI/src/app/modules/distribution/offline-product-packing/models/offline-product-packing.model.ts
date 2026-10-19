/**
 * Offline Product Packing - Data Models
 * Based on API Documentation: MLT-14147
 * Generated from: offline-product-packing-api-documentation.md
 */

/**
 * Standard API Response Wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T[];
  item?: T;
  totalCount?: number;
  total?: number;
  error?: string;
  errorCode?: string;
  errorResponse?: {
    errorCode: string;
    error: string;
  };
}

/**
 * Order Packing Query Request DTO
 * Used for filtering/searching orders available for packing
 */
export interface OrderPackingQueryDto {
  orderNo?: string;       // Max 14 chars - Filter by order number
  customerId?: string;    // Max 10 chars - Filter by customer ID
  orderStatus?: string;   // Must be OR/AL/BO - Filter by order status
  orderClass?: string;    // Max 2 chars - Filter by order class
  searchKeyword?: string; // Search across order no, customer, ordered by
  sortColumn?: string;    // Column to sort by (OrderNo/OrderStatus/CustomerId/FirstShipDate)
  sortOrder?: string;     // Sort direction (ASC/DESC)
}

/**
 * Order Packing DTO - List Response
 * Represents an order available for packing
 */
export interface OrderPackingDto {
  orderNo: string;              // Order number (max 14 chars)
  chapterId: string;            // Chapter identifier (4 chars)
  customerId: string | null;    // Customer identifier (max 10 chars)
  consigneeId: string | null;   // Consignee identifier (max 10 chars)
  orderType: string | null;     // Order type code (max 2 chars)
  orderStatus: string | null;   // Order status (OR/AL/BO)
  orderClass: string | null;    // Order class code (max 2 chars)
  orderedBy: string | null;     // Person who placed order (max 50 chars)
  firstShipDate: string | null; // First shipment date (ISO 8601)
  orderClassDesc: string | null;    // Order class description (from lookup)
  consigneeAddress: string | null;  // Formatted consignee address
  remoteCustomer: string | null;    // Remote customer flag (Y/N)
}

/**
 * Order Packing Detail DTO - Detail Response with Line Items
 * Extends OrderPackingDto with items array
 */
export interface OrderPackingDetailDto extends OrderPackingDto {
  suggestedBoxType?: string | null;  // Auto-suggested box type from first item's product type
  items: OrderItemPackingDto[];  // Order line items
}

/**
 * Order Item Packing DTO - Line Item
 * Represents a single line item in an order
 */
export interface OrderItemPackingDto {
  itemNo: number;                   // Line item number
  productType: string | null;       // Product type code (max 4 chars)
  bloodType: string | null;         // ABO blood type (max 3 chars)
  requiredQty: number | null;       // Quantity required
  canceledQty: number | null;       // Quantity canceled
  systemCancelQty: number | null;   // System canceled quantity
  actualRequiredQty: number | null; // Calculated: required - canceled - system_canceled
  itemStatus: string | null;        // Item status (OR/AL/BO)
  tier: number | null;              // Priority tier (1-9)
  subOk: string | null;             // Substitution allowed (Y/N)
  productTypeDesc: string | null;   // Product type description (from lookup)
  aboDesc: string | null;           // ABO description (from lookup)
  itemStatusDesc: string | null;    // Item status description (from lookup)
  attributes: string | null;        // Item attributes (formatted)
}

/**
 * Packed Product DTO
 * Represents a product that has been packed into a box
 * NOTE: This is a frontend model - API endpoints for packing operations are not yet documented
 */
export interface PackedProductDto {
  lineItemNo: number;           // Line item number from order
  unitId: string;               // Unit identifier
  displayUnitId?: string;       // Unit ID with check digit (from API)
  productCode: string;          // Product code
  aboRh: string;                // ABO/Rh blood type
  expirationDate: string;       // Expiration date (DD-MMM-YYYY)
  expirationTime: string;       // Expiration time (HH:MM)
  boxId: string;                // Box identifier
  qualityCheck: boolean;        // Quality check passed
}

/**
 * Box Creation Request DTO
 * Endpoint: POST /api/v1/offline-packing/box/create
 */
export interface CreateBoxRequestDto {
  orderNo: string;              // Order number
  boxType: string;              // Box type code (e.g., 'SM', 'MD', 'LG') from VSERV_MASTER
  productGrouping: string;      // Product grouping for the box (e.g., 'BL', 'PL')
  closeCurrentBox: boolean;     // Close current open box before creating new one
  packedDate?: string;          // Date/time packing was done (ISO format YYYY-MM-DDTHH:mm:00)
}

/**
 * Box Creation Response DTO
 * Endpoint: POST /api/v1/offline-packing/box/create
 */
export interface CreateBoxResponseDto {
  boxId: string;                // Generated box ID (with prefix "BX")
  boxStatus: string;            // Box status (e.g., 'OP' for open)
  message: string;              // Result message
}

/**
 * Order Status Codes
 */
export enum OrderStatus {
  ORDERED = 'OR',
  ALLOCATED = 'AL',
  BACK_ORDERED = 'BO'
}

/**
 * Item Status Codes
 */
export enum ItemStatus {
  ORDERED = 'OR',
  ALLOCATED = 'AL',
  BACK_ORDERED = 'BO'
}

/**
 * Sort Column Options
 */
export enum SortColumn {
  ORDER_NO = 'OrderNo',
  ORDER_STATUS = 'OrderStatus',
  CUSTOMER_ID = 'CustomerId',
  FIRST_SHIP_DATE = 'FirstShipDate'
}

/**
 * Sort Order Options
 */
export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC'
}

/**
 * Box Type Lookup DTO
 * Used for dropdown options from VSERV_MASTER with CODE_TYPE = 'BOXTP'
 */
export interface BoxTypeLookupDto {
  value: string;   // Box type code
  label: string;   // Box type description (max 30 chars)
}

/**
 * Pick Slip Lookup DTO
 * Used for Pick Slip ID dropdown in Offline Product Packing
 * Endpoint: GET /api/v1/offline-packing/lookups/pick-slips?orderNo={orderNo}
 */
export interface PickSlipLookupDto {
  pickSlipId: string;         // Pick slip identifier (e.g., "PA17-00130048")
  orderNo: string;            // Associated order number (max 14 chars)
  customerId: string | null;  // Customer ID (max 10 chars)
  createdDate: string | null; // Creation date (ISO 8601)
  status: string | null;      // Status code (OP/CL)
  statusDesc: string | null;  // Status description
}

/**
 * Pack Product Request DTO
 * Endpoint: POST /api/v1/offline-packing/pack
 */
export interface PackProductRequest {
  orderNo: string;
  boxId: string;
  unitId: string;
  productCode: string;
  itemNo: number;
  aliquot?: string;
  bloodType?: string;
  expirationDate?: string;
  packedDate?: string;
  pickSlipId?: string;
  qcPassed: boolean;
  substituteConfirmed?: boolean;
}

/**
 * Quarantine Product Request DTO
 * Endpoint: POST /api/v1/offline-packing/quarantine
 */
export interface QuarantineProductRequest {
  orderNo: string;
  unitId: string;
  productCode: string;
  aliquot?: string;
  reason: string;
}

/**
 * Close Box Request DTO
 * Endpoint: POST /api/v1/offline-packing/box/close
 */
export interface CloseBoxRequest {
  boxId: string;
  orderNo: string;
  allProperlyPacked: boolean;
}

/**
 * Pack Status Response DTO
 * Endpoint: GET /api/v1/offline-packing/pack-status/{orderNo}
 */
export interface PackStatusResponse {
  packedProducts: PackStatusProduct[];
  allocatedProducts: PackStatusProduct[];
}

/**
 * Pack Status Product - item within PackStatusResponse
 */
export interface PackStatusProduct {
  unitId: string;
  displayUnitId?: string;
  itemNo?: number;
  productCode: string;
  bloodType?: string;
  productType?: string;
  aboDesc?: string;
  productDesc?: string;
  expirationDate?: string;
  boxId?: string;
}

/**
 * Box Contents Item DTO
 * Endpoint: GET /api/v1/offline-packing/box-contents/{boxId}
 */
export interface BoxContentsItem {
  unitId: string;
  displayUnitId?: string;
  expirationDate?: string;
  productType?: string;
  productCode: string;
  aboDesc?: string;
}

/**
 * Pack Product Response DTO
 * Returned from POST /api/v1/offline-packing/pack
 */
export interface PackProductResponse {
  orderNo: string;
  unitId: string;
  productCode: string;
  boxId: string;
  status: string;
  packedDate?: string;
  packedBy?: string;
  orderStatus?: string;
  warnings?: string[];
}

/**
 * Quarantine Product Response DTO
 * Returned from POST /api/v1/offline-packing/quarantine
 */
export interface QuarantineProductResponse {
  unitId: string;
  productCode: string;
  status: string;
  quarantinedDate?: string;
  quarantinedBy?: string;
}
