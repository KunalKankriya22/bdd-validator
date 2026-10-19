/**
 * Offline Product Check-In Models
 * Based on API Documentation: offline-product-checkin-api-documentation.md
 * JIRA: MLT-14047
 */

/**
 * Standard API response wrapper (ReturnResult pattern)
 */
export interface ReturnResult<T> {
  success: boolean;
  message: string;
  data?: T[];
  item?: T;
  statusCode?: number;
  totalCount?: number;
  errorCode?: string;
}

/**
 * Request DTO for checking in a product
 * POST /api/offline-product-checkin/checkin
 */
export interface ProductCheckInDto {
  /** Inventory class (RE/SP/AD) - Required, max 2 chars */
  inventoryClass: string;

  /** When product was received - Required, ISO datetime, not in future */
  receivedDate: string;

  /** Unit identifier - Required, max 15 chars */
  unitId: string;

  /** Product code - Required, max 8 chars */
  productCode: string;

  /** Component prefix / Aliquot - CRITICAL for data integrity, Required, max 2 chars */
  aliquot: string;

  /** ABO/Rh decision - Required, max 4 chars, cannot be BIO/HOLD/NFT */
  bloodType: string;

  /** Expiration date - Required, must be >= receivedDate */
  expirationDate: string;

  /** Expiration time - Optional, HH:mm:ss format */
  expirationTime?: string;

  /** Warehouse identifier - Optional, max 1 char */
  warehouseId?: string;

  /** Device type - Optional, max 1 char (e.g., "C", "R"). Included in LOCATION_ID per legacy SRVLIB */
  deviceType?: string;

  /** Storage device number - Optional */
  deviceNumber?: string;

  /** Rack number - Optional */
  rackNumber?: string;

  /** Shelf number - Optional */
  shelfNumber?: string;

  /** Tray identifier - Optional */
  trayId?: string;

  /** Tray overflow confirmation - Optional, 'Y' or 'N' */
  trayOverflowConfirmation?: string;
}

/**
 * Response DTO for successful check-in
 * Returned by POST /api/offline-product-checkin/checkin
 */
export interface CheckInResultDto {
  /** Unit identifier */
  unitId: string;

  /** Display unit ID with check digit */
  displayUnitId: string | null;

  /** Product code */
  productCode: string;

  /** Aliquot / Component prefix */
  aliquot: string;

  /** Non-blocking warning messages (e.g., interdictions, quarantine) */
  warnings: string[];
}

/**
 * Response DTO for checked-in product (active product record)
 * Returned by GET and POST list endpoints
 */
export interface ActiveProductDto {
  /** Unit identifier */
  unitId: string;

  /** Display unit ID with check digit */
  displayUnitId: string | null;

  /** Collection date */
  collDate: string | null;

  /** Product code */
  productCode: string;

  /** Component prefix / Aliquot */
  aliquot: string;

  /** Blood type code */
  bloodType: string;

  /** Blood type description (e.g., "O Positive") */
  bloodTypeDescription: string | null;

  /** Expiration date with time */
  expDate: string;

  /** Warehouse identifier */
  warehouseId: string | null;

  /** Warehouse description */
  warehouseDescription: string | null;

  /** Device number (parsed from LOCATION_ID) */
  deviceNumber: string | null;

  /** Rack number (parsed from LOCATION_ID) */
  rackNumber: string | null;

  /** Tray ID (parsed from LOCATION_ID) */
  trayId: string | null;

  /** Inventory class (RE/SP/AD) */
  inventoryClass: string;

  /** Check-in timestamp */
  insertDate: string | null;
}

/**
 * Request DTO for filtering/searching checked-in products
 * Used in POST /api/offline-product-checkin/{take}/{skip}
 */
export interface ActiveProductQueryDto {
  /** Filter by unit ID - Optional */
  unitId?: string;

  /** Filter by product code - Optional */
  productCode?: string;

  /** Filter by inventory class (RE/SP/AD) - Optional */
  inventoryClass?: string;

  /** Filter by blood type - Optional */
  bloodType?: string;

  /** Filter by warehouse - Optional */
  warehouseId?: string;

  /** Filter from insert date - Optional */
  fromDate?: string;

  /** Filter to insert date - Optional */
  toDate?: string;

  /** Search keyword across unit ID, product code - Optional */
  searchKeyword?: string;

  /** Column to sort by - Optional */
  sortColumn?: string;

  /** Sort order (ASC or DESC) - Optional */
  sortOrder?: string;
}

/**
 * Response DTO for unit validation
 * GET /api/offline-product-checkin/validate-unit/{unitId}
 */
export interface UnitValidationDto {
  /** Unit identifier */
  unitId: string;

  /** Collection date - null if unit not found */
  collDate: string | null;

  /** Chapter ID - null if unit not found */
  chapterId: string | null;

  /** Validation result */
  isValid: boolean;

  /** Validation message */
  message: string;
}

/**
 * Response DTO for inventory class lookup
 * GET /api/offline-product-checkin/inventory-classes
 */
export interface AliquotDto {
  aliquot: string;
}

export interface ProductCodeDto {
  productCode: string;
  productType: string | null;
  storageProductType: string | null;
  poolProductCode: string;
  lifeSpan: number;
  lifeSpanInd: string | null;
}

export interface AboTypeDto {
  aboCode: string;
  aboDescription: string | null;
}

export interface InventoryClassDto {
  /** Inventory class code (RE/SP/AD) */
  code: string;

  /** Code description */
  codeDesc: string;

  /** Effective date */
  effDate: string;

  /** Termination date - null if still active */
  termDate: string | null;
}

/**
 * Error response structure from API
 */
export interface ErrorResponse {
  success: false;
  statusCode: number;
  errorCode: string;
  message: string;
}

/**
 * Warning code constants (non-blocking)
 */
export enum WarningCode {
  /** Component interdicted */
  ComponentInterdicted = '1724',

  /** Unit interdicted */
  UnitInterdicted = '1725',

  /** Product placed on quarantine */
  ProductQuarantined = '3728',

  /** Product is already discarded */
  ProductDiscarded = '6300'
}

/**
 * Warehouse lookup DTO
 * GET /api/v1/offline-product-checkin/warehouses
 */
export interface WarehouseDto {
  /** Warehouse identifier */
  warehouseId: string;

  /** Warehouse description */
  warehouseDesc: string;
}

/**
 * Storage device lookup DTO
 * GET /api/v1/offline-product-checkin/devices/{warehouseId}
 */
export interface StorageDeviceDto {
  /** Device number */
  deviceNumber: string;

  /** Device type */
  deviceType: string;

  /** Device description */
  deviceDesc: string;
}

/**
 * Rack lookup DTO
 * GET /api/v1/offline-product-checkin/racks/{warehouseId}/{deviceNumber}
 */
export interface RackDto {
  /** Rack number */
  rackNumber: string;

  /** Rack description */
  rackDesc: string;
}

/**
 * Tray lookup DTO
 * GET /api/v1/offline-product-checkin/trays/{warehouseId}/{deviceNumber}/{rackNumber}
 */
export interface TrayDto {
  /** Tray identifier */
  trayId: string;

  /** Maximum capacity */
  maxCapacity: number;

  /** Current count of items in tray */
  currentCount: number;
}

/**
 * Error code constants (blocking)
 */
export enum ErrorCode {
  /** Inventory class code not valid (must be RE, SP, or AD) */
  InvalidInventoryClass = '5307',

  /** Date cannot be in the future */
  FutureDate = '0503',

  /** Unit not found in system for this chapter */
  UnitNotFound = '0312',

  /** Product already exists in active products */
  DuplicateProduct = '5322',

  /** No component with status Lab-ready found */
  NoLabReadyComponent = '5327',

  /** Component prefix not found with lab-ready status */
  InvalidAliquot = '0313',

  /** Restricted blood type — cannot check in */
  RestrictedBloodType = '5325',

  /** Product checked in after expiration date */
  ProductExpired = '3701',

  /** Confirmation field must be Y or N */
  InvalidConfirmation = '0318',

  /** Tray ID not found */
  TrayNotFound = '0341'
}
