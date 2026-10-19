/**
 * Warehouse Check-In Models
 * DTOs and interfaces for the Warehouse Check-In module
 */

// ==================== Request DTOs ====================

export interface WarehouseCheckInRequestDto {
  unitId: string;
  productCode: string;
  aliquot?: string;
  checkDigit?: string;
  locationId?: string;
  trayId?: string;
  receiveTemp?: number;
  quarantineFlag?: boolean;
}

export interface ValidateUnitRequestDto {
  unitId: string;
  productCode: string;
}

export interface ValidateTemperatureRequestDto {
  temperature: number;
  productCode: string;
}

export interface ValidateAllRequestDto {
  unitId: string;
  productCode: string;
  aliquot?: string;
  temperature?: number | null;
}

export interface ValidateAllResponseDto {
  isValid: boolean;
  errorCode?: string | null;
  errorMessage?: string | null;
  collectionDate?: string | null;
  expirationDate?: string | null;
  productClass?: string | null;
  currentWarehouse?: string | null;
  stockState?: string | null;
  batchId?: string | null;
  batchStatus?: string | null;
  destinationWarehouse?: string | null;
  tempInRange: boolean;
  minTemp?: number | null;
  maxTemp?: number | null;
  warnings: ValidationWarning[];
}

// ==================== Response DTOs ====================

export interface WarehouseCheckInResponseDto {
  unitId: string;
  productCode: string;
  stockState: string; // 'AV' = Available, 'QU' = Quarantine
  batchId: string | null;
  locationId: string;
  receiveDate: string; // ISO 8601 DateTime
  receiveUser: string;
  success: boolean;
  batchReconciled: boolean;
  tempOutOfRange?: boolean;
  warningCode?: string;    // e.g. '9928'
  warningMessage?: string;
  message: string;
}

export interface ProductCodeOption {
  productCode: string;
  productDesc?: string;
}

export interface UnitProductDto {
  productCode: string;
  aliquot: string;
  collDate: string;
  expDate: string;
  productType: string;
  inventoryClass: string;
  warehouseId: string;
  bloodType: string;
  storageClass: string;
}

export interface ValidationWarning {
  code: string;
  message: string;
}

export interface ValidateUnitResponseDto {
  isValid: boolean;
  currentWarehouse: string | null;
  stockState: string | null;
  batchId: string | null;
  batchStatus: string | null;
  destinationWarehouse: string | null;
  collectionDate: string | null; // ISO 8601 DateTime
  expirationDate?: string | null; // ISO 8601 DateTime
  productClass?: string | null;
  errorCode?: string | null;
  warningCode?: string | null;   // 9925 or 9926 — allows commit but unit goes QU
  warningMessage?: string | null;
  warnings?: ValidationWarning[]; // 9936, INTERDICT — show banners, never block
  errorMessage: string | null;
  products?: ProductCodeOption[];
}

export interface ValidateTemperatureResponseDto {
  isInRange: boolean;
  minTemp?: number | null;
  maxTemp?: number | null;
}

export interface BatchStatusResponseDto {
  batchId: string;
  batchStatus: string; // 'OPEN', 'TRANS', 'RECON'
  toWarehouse: string;
  fromWarehouse: string;
  totalUnits: number;
  receivedUnits: number;
  remainingUnits: number;
  reconDate: string | null; // ISO 8601 DateTime
  reconUser: string | null;
}

// ==================== Location Lookup ====================

// Raw shape returned by the API inside data[0].options
export interface LocationLookupRawOption {
  code: string;
  description: string;
  itemCount?: number;
  trayCapacity?: number;
  deviceType?: string;
  storageClass?: string;
  bloodType?: string;
}

// Raw shape of data[0]
export interface LocationLookupResponseItem {
  level: string;
  options: LocationLookupRawOption[];
}

// Normalised shape used by the component
export interface LocationLookupOption {
  value: string;
  label: string;
  itemCount?: number;
  trayCapacity?: number;
  // Device-level metadata carried forward into rack/tray calls
  deviceType?: string;
  storageClass?: string;
  bloodType?: string;
}

export interface LocationLookupParams {
  chapterId?: string;
  productCode?: string;
  productType?: string;
  warehouseId?: string;
  deviceNumber?: string;
  deviceType?: string;
  storageClass?: string;
  bloodType?: string;
  rackNumber?: string;
}

// ==================== API Response Wrappers ====================

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message?: string;
  data: T[];
  errorCode?: string;
  errorResponse?: {
    errorCode: string;
    error: string;
  };
}

// ==================== UI Models ====================

export interface CheckedInUnitRow {
  unitId: string;
  collectionDate: string;
  product: string;
  aliquot: string;
  expirationDate: string;
  class: string;
  warehouseId: string;
  deviceNumber: string;
  rackNumber: string;
  trayNumber: string;
  sequence: number;
}

export interface WarehouseCheckInFormData {
  checkInTemp: number;
  unitId: string;
  productCode: string;
  deviceNumber: string;
  rackNumber: string;
  trayNumber: string;
}

export interface UnitValidationInfo {
  collectionDate: string;
  expirationDate: string;
  class: string;
  warehouseId: string;
  productType?: string;
  isValid: boolean;
  errorMessage?: string;
}

// ==================== Error / Warning Codes ====================

export enum WarehouseCheckInErrorCode {
  UNIT_NOT_FOUND = '0313',
  INVALID_TRAY = '0341',
  TRAY_INCOMPATIBLE = '0360',
  INVALID_WAREHOUSE = '0350',
  WRONG_DESTINATION_WAREHOUSE = '9923',
  UNIT_NOT_IN_TRANSFER = '9925',
  UNIT_ALREADY_AT_WAREHOUSE = '9926',
  BATCH_STILL_OPEN = '9927',
  TEMP_OUT_OF_RANGE = '9928',
  NO_RACK_CONFIG = '7308',
  UNIT_ALREADY_QUARANTINED = '3728',
}

export const ERROR_CODE_MESSAGES: Record<string, string> = {
  '3728': 'Unit is already in quarantine',
  '0313': 'Unit not found in active products',
  '0341': 'Invalid tray',
  '0360': 'Tray incompatible with this product type or blood type',
  '0350': 'Invalid warehouse',
  '9923': 'Unit batch is destined for a different warehouse',
  '9925': 'Unit has no associated warehouse transfer batch — unit will be quarantined',
  '9926': 'Unit is already located at this warehouse — unit will be quarantined',
  '9927': 'Batch is still open — contact the sending warehouse to release the batch',
  '9928': 'Temperature out of range — unit will be quarantined',
  '9936': 'Verify inventory class before proceeding',
  '7308': 'No rack available for this warehouse/device/product configuration',
  'INTERDICT': 'Active interdiction on this unit — verify with supervisor before proceeding',
};

// Codes that allow commit but cause unit to go QU
export const WARNING_CODES = new Set(['9925', '9926', '9928']);
// Codes shown as informational banners (never block commit)
export const INFO_WARNING_CODES = new Set(['9936', 'INTERDICT']);
