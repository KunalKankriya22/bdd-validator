// ========================================
// DTOs for Release Returned Product Quarantine
// Generated from API documentation: imiretrl-api-documentation.md
// ========================================

/**
 * Return Advice Header Response DTO
 * BE Endpoint: GET /release-returned-product-quarantine/return-advices/{returnAdviceId}
 * BE DTO: ReturnAdviceHeaderDto
 */
export interface ReturnAdviceHeaderDto {
  returnAdviceId: string;
  customerName: string | null;
  returnUserId: string | null;
  returnDate: string | null; // ISO 8601 date string
  adviceStatus: string | null;
  unmovedItemCount: number;
}

/**
 * Return Item Response DTO
 * BE Endpoint: GET /release-returned-product-quarantine/return-items
 * BE Model: ReturnItem
 */
export interface ReturnItemDto {
  returnAdviceId: string;
  unitId: string;
  displayUnitId: string | null;
  checkDigit: string | null;
  collDate: string; // BE: CollDate
  productCode: string;
  aliquot: string;
  expDate: string | null; // BE: ExpDate
  bloodType: string | null; // BE: BloodType
  aboDescription: string | null; // BE: AboDescription
  productType: string | null;
  inventoryClass: string | null;
  returnReasonCode: string | null;
  returnReasonDescription: string | null;
  locationId: string | null;
  moveDate: string | null;
  warehouseId: string | null;
}

/**
 * Reject Code Response DTO
 * Endpoint: GET /reject-codes
 */
export interface RejectCodeDto {
  code: string;
  description: string;
}

/**
 * Validation Request DTO
 * Endpoint: POST /validate
 */
export interface ValidateProductRequestDto {
  unitId: string;
  collDate: string; // ISO 8601 date string
  productCode: string;
  aliquot: string;
  returnAdviceId: string;
  restockFlag: string; // 'Y' or 'N'
  warehouseId: string;
  deviceNumber: string;
}

/**
 * Validation Response DTO
 * Endpoint: POST /validate
 */
export interface ValidationDetailsDto {
  isExpired: boolean;
  hasUnitInterdiction: boolean;
  hasComponentInterdiction: boolean;
  isOnDiscard: boolean;
  isSpecialProduct: boolean;
}

export interface ValidateProductResponseDto {
  isValid: boolean;
  validationDetails: ValidationDetailsDto;
}

/**
 * Process Return Item Request DTO (Single Item)
 * Used in ProcessReturnItemsRequestDto.items array
 */
export interface ProcessReturnItemRequestDto {
  unitId: string;
  collDate: string; // ISO 8601 date string
  productCode: string;
  aliquot: string;
  returnAdviceId: string;
  restockFlag: string; // 'Y' = Restock, 'N' = Discard
  warehouseId?: string; // Required if restockFlag = 'Y'
  deviceType?: string; // Required if restockFlag = 'Y'
  deviceNumber?: string; // Required if restockFlag = 'Y'
  rackNumber?: string; // Required if restockFlag = 'Y' and deviceType != 'N'
  shelfNumber?: string; // Optional
  trayId?: string; // Optional
  rejectCode?: string; // Required if restockFlag = 'N'
  confirmOverLocation?: string; // 'Y' or 'N' - Optional
}

/**
 * Process Return Items Request DTO (Batch)
 * Endpoint: POST /process
 */
export interface ProcessReturnItemsRequestDto {
  returnAdviceId: string;
  items: ProcessReturnItemRequestDto[];
}

/**
 * Processed Item Result DTO
 */
export interface ProcessedItemResultDto {
  unitId: string;
  action: 'RESTOCK' | 'DISCARD';
  success: boolean;
  locationId?: string;
  errorCode?: string;
  errorMessage?: string;
}

/**
 * Process Return Items Response DTO
 * Endpoint: POST /process
 */
export interface ProcessReturnItemsResponseDto {
  totalProcessed: number;
  restockedCount: number;
  discardedCount: number;
  failedCount: number;
  processedItems: ProcessedItemResultDto[];
}

/**
 * Return Item Query Parameters DTO
 * Endpoint: GET /return-items
 */
export interface ReturnItemQueryDto {
  take: number;
  skip: number;
  returnAdviceId?: string;
  unitId?: string;
  productCode?: string;
  warehouseId?: string;
  onlyUnmoved?: boolean; // Default: true
}

// ========================================
// UI-Specific Models (For Component State)
// ========================================

/**
 * Return Item Row for Data Grid
 * Extends ReturnItemDto with UI-specific fields
 */
export interface ReturnItemRow extends ReturnItemDto {
  // User selections
  selectRestock: 'Y' | 'N' | null;
  selectedWarehouseId: string | null;
  selectedDeviceType: string | null;
  selectedDeviceNumber: string | null;
  selectedRackNumber: string | null;
  selectedShelfNumber: string | null;
  selectedTrayId: string | null;
  selectedRejectCode: string | null;

  // Validation states
  isValidForRestock: boolean;
  validationError: string | null;
  isProcessing: boolean;

  // Touched states for validation
  deviceNumberTouched?: boolean;
  rackNumberTouched?: boolean;
  rejectCodeTouched?: boolean;

  // Alias for template compatibility
  bloodTypeCode?: string | null;
}

/**
 * Dropdown Option Models
 */
export interface ReturnAdviceOption {
  returnAdviceId: string;
  displayText: string; // For autocomplete display
}

export interface WarehouseOption {
  warehouseId: string;
  warehouseName: string;
}

export interface DeviceTypeOption {
  deviceType: string;
  description: string;
}

export interface DeviceOption {
  deviceNumber: string;
  deviceType: string;
  description: string;
}

export interface RackOption {
  rackNumber: string;
  description: string;
}

export interface ShelfOption {
  shelfNumber: string;
  description: string;
}

export interface TrayOption {
  trayNumber: string;
  shelfNumber: string;
  description: string;
  isFull: string;
}

/**
 * API Error Response
 */
export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  errorCode: string;
  errorResponse: {
    errorCode: string;
    error: string;
  };
}

/**
 * API Success Response Wrapper
 * Matches BE ReturnResult<T>
 */
export interface ApiResponse<T> {
  success: boolean | null;
  statusCode: number | null;
  message: string | null;
  data: T;
  total?: number;
  totalCount?: number;
  error?: string;
  errorCode?: string;
}

/**
 * Error Code Mapping
 * Based on API documentation error codes
 */
export const ERROR_CODES: Record<string, string> = {
  '5712': 'Return advice not found or has no unmoved items',
  '0318': 'Value must be Y or N',
  '4002': 'Restock flag must be Y or N',
  '3701': 'Product is expired',
  '3722': 'Unit interdicted',
  '5311': 'Product is placed on discard',
  '3721': 'Component interdicted',
  '9930': 'Special products cannot be restocked',
  '0339': 'Invalid reject code',
  '0350': 'Invalid warehouse',
  '0361': 'Invalid storage device',
  '7308': 'Invalid rack',
  '0341': 'Invalid tray number',
  '0360': 'Tray not found or incompatible',
  '0700': 'Invalid scan length',
  '0600': 'Commit failed',
  '0000': 'Success'
};
