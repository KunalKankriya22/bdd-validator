// ─── Grid / CRUD DTOs ────────────────────────────────────────────────────────

export interface CheckInFromLabDto {
  unitId: string;
  collDate: string;
  productCode: string;
  aliquot: string;
  bloodType: string;
  expDate: string;
  productType: string;
  inventoryClass: string;
  stockState: string;
  locationId: string;
  insertDate: string;
}

export interface CheckInFromLabQueryDto {
  unitId?: string | null;
  productCode?: string | null;
  bloodType?: string | null;
  inventoryClass?: string | null;
  stockState?: string | null;
  searchKeyword?: string | null;
  sortColumn?: string | null;
  sortOrder?: string | null;
}

export interface CreateCheckInFromLabDto {
  unitId: string;
  productCode: string;
  aliquot: string;
  bloodType: string;
  productType?: string | null;
  expDate?: string | null;
  inventoryClass: string;
  locationId?: string | null;
  warehouseId?: string | null;
  osokFlag?: string | null;
  importFlag?: string | null;
  receiveDate?: string | null;
}

export interface UpdateCheckInFromLabDto {
  locationId?: string | null;
  warehouseId?: string | null;
  stockState?: string | null;
}

export interface CheckInFromLabListResponse {
  data: CheckInFromLabDto[];
  total: number;
}

// ─── Validation Request / Response DTOs ──────────────────────────────────────

export interface ValidateUnitRequestDto {
  unitId: string;
}

export interface ValidateUnitResponseDto {
  unitId: string;
  collDate: string;
  groupSiteId: string | null;
  contractType: string | null;
  driveId: string | null;
  osokFlag: string;
  importFlag: string;
}

export interface ValidateProductRequestDto {
  unitId: string;
  productCode: string;
  aliquot?: string | null;
  collDate: string;
}

export interface ValidateProductResponseDto {
  productCode: string;
  invProductType: string | null;
  isPoolProduct: boolean;
  autoExpiryDate: string | null;
  componentStatus: string | null;
  expiryDate: string | null;
  isLicensed: string | null;
}

export interface ValidateReceiveDateRequestDto {
  receiveDate: string;
}

export interface ValidateReceiveDateResponseDto {
  isValid: boolean;
  maxAllowedDate: string;
  chapterLocalDate: string;
}

export interface ValidateAboRequestDto {
  unitId: string;
  productCode: string;
  aliquot?: string | null;
  bloodType: string;
  collDate: string;
}

export interface ValidateAboResponseDto {
  isValid: boolean;
  aboDescription: string | null;
  isPoolProduct: boolean;
  systemLabelDecision: string | null;
}

export interface ValidateComponentRequestDto {
  unitId: string;
  productCode: string;
  aliquot?: string | null;
  collDate: string;
}

export interface ValidateComponentResponseDto {
  isCleared: boolean;
  interdictionType: string | null;
  interdictionCode: string | null;
}

export interface ValidateExpiryRequestDto {
  unitId: string;
  productCode: string;
  aliquot?: string | null;
  collDate: string;
  expDate: string | null;
}

export interface ValidateExpiryResponseDto {
  isValid: boolean;
  componentExpiryDate: string | null;
  enteredExpiryDate: string | null;
  chapterLocalDate: string;
}

export interface ValidateLocationRequestDto {
  warehouseId: string;
  deviceId?: string | null;
  rackId?: string | null;
  trayId?: string | null;
  bloodType?: string | null;
}

export interface ValidateLocationResponseDto {
  isValid: boolean;
  locationId: string;
  availableCapacity: number;
}

// ─── Lookup / Dropdown DTOs ───────────────────────────────────────────────────

export interface InventoryClassDto {
  code: string;
  description: string;
}

export interface WarehouseDto {
  warehouseId: string;
  warehouseName: string;
}

export interface StorageDeviceDto {
  deviceId: string;
  deviceName: string | null;
}

export interface StorageRackDto {
  rackId: string;
  rackName: string | null;
}

export interface StorageTrayDto {
  trayId: string;
  trayName: string | null;
  capacity: number;
  used: number;
  available: number;
}

export interface UnitProductDto {
  productCode: string;
  productType: string | null;
  componentStatus: string | null;
}

export interface UnitAliquotDto {
  aliquot: string;
  componentStatus: string | null;
}

export interface AboTypeDto {
  aboCode: string;
  aboDescription: string;
}

export interface BaseAboValueDto {
  aboValue: string;
  baseAboValue: string | null;
}

// ─── Generic API wrapper ──────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data: T;
  total?: number;
}
