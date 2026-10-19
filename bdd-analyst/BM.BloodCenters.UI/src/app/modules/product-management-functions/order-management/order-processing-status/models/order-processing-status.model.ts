/**
 * Order Processing Status Models
 * Generated from API Documentation: order-processing-status-api-documentation.md
 * Base URL: /api/order-processing-status
 */

/**
 * OrderStatusDto - Individual order details
 * Maps to API response structure for each order
 */
export interface OrderStatusDto {
  /** Unique order number */
  orderNo: string;
  /** Order classification: ST=STAT, AS=ASAP, RE=Routine, SO=Standing */
  orderClass: string;
  /** Current order status code (AL, BO, CA, CL, HO, OP, OR, PE, PI, PK) */
  orderStatus: string;
  /** Order creation timestamp (ISO 8601 format) */
  insertDate: string;
  /** Chapter identifier */
  chapterId: string;
  /** Age of order in hours */
  orderAge: number;
}

/**
 * OrderProcessingStatusResponseDto - Grouped orders by type
 * Maps to API response data structure
 */
export interface OrderProcessingStatusResponseDto {
  /** List of STAT orders (may be empty) */
  statOrders: OrderStatusDto[];
  /** List of ASAP orders (may be empty) */
  asapOrders: OrderStatusDto[];
  /** List of Routine orders (may be empty) */
  routineOrders: OrderStatusDto[];
  /** List of Standing orders (may be empty) */
  standingOrders: OrderStatusDto[];
  /** Total count of STAT orders matching criteria */
  statCount: number;
  /** Total count of ASAP orders matching criteria */
  asapCount: number;
  /** Total count of Routine orders matching criteria */
  routineCount: number;
  /** Total count of Standing orders matching criteria */
  standingCount: number;
}

/**
 * OrderProcessingStatusQueryDto - Filter parameters for API request
 * Maps to query parameters for GET /api/order-processing-status
 */
export interface OrderProcessingStatusQueryDto {
  /** Order age in hours (filters orders with ORDER_AGE >= specified value) */
  age?: number;
  /** Filter by order status code (e.g., "OP", "PE", "AL") */
  orderStatus?: string;
  /** Start date for order range (inclusive) - ISO format YYYY-MM-DD */
  fromDate?: string;
  /** End date for order range (inclusive) - ISO format YYYY-MM-DD */
  toDate?: string;
  /** Number of records to return per order type (pagination) - Default: 10, Max: 100 */
  take: number;
  /** Number of records to skip per order type (pagination) - Default: 0 */
  skip: number;
}

/**
 * OrderStatusCodeDto - Lookup data for order status codes
 * Maps to API response from GET /api/order-processing-status/status-codes
 */
export interface OrderStatusCodeDto {
  /** Status code (2-3 characters) - e.g., "AL", "OP", "PE" */
  code: string;
  /** Human-readable description - e.g., "Allocated", "Open", "Pending" */
  codeDesc: string;
}

/**
 * OrderFilters - UI filter state (maps to query params)
 * Used for component state management
 */
export interface OrderFilters {
  /** Age filter in hours */
  age?: number;
  /** Order status code filter */
  orderStatus?: string;
  /** From date (DD-MMM-YYYY format for display, YYYY-MM-DD for API) */
  fromDate?: Date | null;
  /** To date (DD-MMM-YYYY format for display, YYYY-MM-DD for API) */
  toDate?: Date | null;
}

/**
 * Order Type Enum - For tab navigation
 */
export enum OrderType {
  STAT = 0,
  ASAP = 1,
  ROUTINE = 2,
  STANDING = 3
}

/**
 * Order Class Constants
 */
export const ORDER_CLASS = {
  STAT: 'ST',
  ASAP: 'AS',
  ROUTINE: 'RE',
  STANDING: 'SO'
} as const;

/**
 * Default pending status codes
 * These are the statuses considered "pending" by the API
 */
export const DEFAULT_PENDING_STATUSES = ['AL', 'BO', 'HO', 'OP', 'OR', 'PE', 'PI', 'PK'] as const;

/**
 * Status Badge Colors (from Figma)
 */
export const STATUS_COLORS: Record<string, string> = {
  OR: 'teal',
  AL: 'teal',
  PE: 'teal',
  BO: 'orange',
  HO: 'orange',
  CA: 'red',
  CL: 'red',
  PI: 'blue',
  PK: 'blue',
  OP: 'gray'
};

/**
 * Pagination defaults
 */
export const PAGINATION_DEFAULTS = {
  TAKE: 999,
  SKIP: 0,
  MAX_TAKE: 999
} as const;

export interface OrderDetailDto {
  orderNo: string;
  chapterId: string;
  customerId: string;
  customerName: string;
  orderType: string;
  orderClass: string;
  orderedBy?: string;
  contractId?: string;
  orderMode?: string;
  consigneeId: string;
  payeeId: string;
  estArrivalTime?: string;
  orderStatus: string;
  insertDate: string;
  insertUserId: string;
  lastActivityDate: string;
  items: OrderItemDto[];
}

export interface OrderItemDto {
  orderNo: string;
  itemNo: number;
  productType: string;
  productTypeDesc?: string;
  bloodType: string;
  bloodTypeDesc?: string;
  tier: number;
  requiredQty: number;
  unitPrice?: number;
  itemStatus: string;
  allocatedQty: number;
  shippedQty: number;
  canceledQty?: number;
}

export interface OrderNoteDto {
  noteId: number;
  note: string;
}

export interface OrderAuditTrailDto {
  actionFunction: string;
  actionDate: string;
  userName: string;
}

export interface OrderedAntigenItem {
  itemNo: number;
  antigenId: string;
  unitPrice?: number;
  resultStatus?: string;
}

export interface OrderedAttributeItem {
  itemNo: number;
  attribGroup: string;
  attribCode: string;
  unitPrice?: number;
}

export interface ShippedProduct {
  unitId: string;
  prodCode: string;
  collDate?: string;
  abo?: string;
  expDate?: string;
  boxId?: string;
  price?: number;
}

export interface ShippedAntigen {
  unitId: string;
  prodCode: string;
  testId: string;
  price?: number;
}

export interface ShippedAttribute {
  unitId: string;
  prodCode: string;
  attributeCode: string;
  attributeDesc?: string;
  price?: number;
}

export interface OrderChargesSummary {
  products: ShippedProduct[];
  antigens: ShippedAntigen[];
  attributes: ShippedAttribute[];
}
