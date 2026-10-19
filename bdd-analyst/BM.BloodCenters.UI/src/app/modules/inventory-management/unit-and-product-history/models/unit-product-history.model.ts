/**
 * API Response Models for Unit and Product History
 * Based on API Documentation: /api/unit-product-history
 */

/**
 * Standard API Response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data: T;
  totalCount?: number;
  errorCode?: string;
  errorResponse?: ErrorResponse;
}

/**
 * Error response structure
 */
export interface ErrorResponse {
  errorCode: string;
  error: string;
}

/**
 * Unit Validation DTO
 * Endpoint: GET /api/unit-product-history/validate/{unitId}
 */
export interface UnitValidationDto {
  unitId: string;
  collectionDate: string; // yyyy-MM-dd format
  source: string; // "COMPONENTS" or "PRODUCT_HISTORY"
}

/**
 * Unit Product DTO
 * Endpoint: GET /api/unit-product-history/units/{unitId}/products
 */
export interface UnitProductDto {
  unitId: string;
  productCode: string; // max 8 chars
  aliquot: string; // max 4 chars
  aboCodeDesc: string;
  expDate: string | null; // ISO 8601 datetime
  productStatus: string; // "Available", "Shipped", "Delivered", etc.
  inventoryClass: string; // "AV", "SH", "DL", etc.
  disposition: string;
  orderNumber: string | null;
  boxId: string | null;
}

/**
 * Product History DTO
 * Endpoint: GET /api/unit-product-history/units/{unitId}/products/{productCode}/{aliquot}/history
 */
export interface ProductHistoryDto {
  statusDescription: string; // e.g., "Component Production - Create Product"
  statusInd: string; // Status code: "AV", "AL", "PK", "SH", "DL", "RT", etc.
  fromDate: string; // ISO 8601 datetime
  personName: string; // User who performed the action
  destination: string; // Location ID, Order Number, Return ID, etc.
  inventoryClass: string; // Inventory class code
  customerName: string | null; // Customer name for shipped products
  consigneeName: string | null; // Consignee name for shipped products
}

/**
 * Table row for products grid display
 * Combines productCode + aliquot for display
 */
export interface ProductTableRow extends UnitProductDto {
  product: string; // Computed: productCode + aliquot
  formattedExpDate: string; // Formatted: DD-MMM-YYYY HH:MM
  statusBadgeClass: string; // CSS class for status badge
}

/**
 * Table row for history dialog display
 */
export interface HistoryTableRow extends ProductHistoryDto {
  formattedDate: string; // Formatted: DD-MMM-YYYY HH:MM
  statusBadgeClass: string; // CSS class for status badge
  statusDisplayName: string; // Human-readable status name
  locationId: string; // Extracted from destination
  customer: string; // Extracted from destination if applicable
  consignee: string; // Extracted from destination if applicable
}

/**
 * Status badge configuration
 */
export interface StatusBadge {
  status: string;
  class: string; // CSS class for styling
  color: string; // Material color
}

/**
 * Error code mapping
 */
export const ERROR_CODES = {
  UNIT_NOT_FOUND: '0312',
  NO_HISTORY: '5326',
  NO_PRODUCT_MADE: '5327',
  INVALID_SCAN_LENGTH: '0700',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
} as const;

/**
 * Status indicator reference from API documentation
 */
export const STATUS_INDICATORS = {
  AL: { code: 'AL', description: 'Allocated', priority: 1 },
  PK: { code: 'PK', description: 'Packed', priority: 2 },
  XR: { code: 'XR', description: 'Crossmatch', priority: 3 },
  SH: { code: 'SH', description: 'Shipped', priority: 4 },
  DL: { code: 'DL', description: 'Delivered', priority: 5 },
  RT: { code: 'RT', description: 'Returned', priority: 6 },
  QU: { code: 'QU', description: 'Quarantine', priority: 7 },
  RP: { code: 'RP', description: 'Reprocessed', priority: 8 },
  OD: { code: 'OD', description: 'Outdated', priority: 9 },
  DI: { code: 'DI', description: 'Discarded', priority: 10 },
  IL: { code: 'IL', description: 'In Lab', priority: 11 },
  CK: { code: 'CK', description: 'Checked/Rejected', priority: 12 },
  AV: { code: 'AV', description: 'Available', priority: 13 },
} as const;

/**
 * Status badge color mapping
 */
export const STATUS_BADGE_COLORS: Record<string, string> = {
  'Available': 'primary', // Blue
  'Delivered': 'accent', // Green
  'Shipped': 'primary',
  'Allocated': 'warn',
  'Packed': 'primary',
  'Returned': 'warn',
  'Discarded': 'warn',
  'Quarantine': 'warn',
  'Outdated': 'warn',
  'In Lab': 'primary',
  'Work Order': 'warn',
  'Crossmatch': 'primary',
  'Reprocessed': 'primary',
  'Checked': 'warn',
};

/**
 * Data for Product History Dialog
 */
export interface ProductHistoryDialogData {
  unitId: string;
  productCode: string;
  aliquot: string;
  collectionDate: string;
  product: string; // Combined display name
  shipmentNumber?: string; // Order number if available
  historyRecords?: ProductHistoryDto[];
}
