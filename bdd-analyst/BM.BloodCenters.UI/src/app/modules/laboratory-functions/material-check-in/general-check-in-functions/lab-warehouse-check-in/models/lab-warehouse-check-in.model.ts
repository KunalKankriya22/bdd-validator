/**
 * Lab Warehouse Check-In Models
 * DTOs and interfaces for the Lab Warehouse Check-In module
 */

// ==================== Request DTOs ====================

/**
 * Request DTO for validating a unit for check-in
 */
export interface ValidateCheckinUnitRequestDto {
  unitId: string;
  overrides: string[];
}

/**
 * Request DTO for validating a product/component for check-in
 */
export interface ValidateCheckinProductRequestDto {
  unitId: string;
  productCode: string;
  aliquot: string;
  collDate: Date | string;
  temperature?: number;
  batchId?: string;
  overrides: string[];
}

/**
 * Request DTO for performing check-in operation
 */
export interface CheckinRequestDto {
  unitId: string;
  collDate: Date | string;
  productCode?: string;
  aliquot?: string;
  temperature?: number;
  batchId?: string;
  hasComponents: boolean;
  needsNitb: boolean;
  needsCmtInterdiction: boolean;
  otherAliquotsPending: boolean;
  confirmedOverrides: string[];
}

// ==================== Response DTOs ====================

/**
 * Product information DTO
 */
export interface ProductInfoDto {
  productCode: string;
  aliquot: string;
  productDesc: string;
}

/**
 * Warning DTO
 */
export interface WarningDto {
  code: string;
  message: string;
}

/**
 * Response DTO for unit validation
 */
export interface ValidateCheckinUnitResponseDto {
  status: 'OK' | 'WARNING' | 'ERROR';
  collDate?: Date | string;
  hasComponents: boolean;
  batchId?: string;
  needsNitb: boolean;
  products: ProductInfoDto[];
  warnings: WarningDto[];
}

/**
 * Response DTO for product validation
 */
export interface ValidateCheckinProductResponseDto {
  status: 'OK' | 'WARNING';
  productDescription: string;
  temperatureOk: boolean;
  needsCmtInterdiction: boolean;
  needsNitb: boolean;
  otherAliquotsPending: boolean;
  warnings: WarningDto[];
}

/**
 * Response DTO for check-in operation
 */
export interface CheckinResponseDto {
  success: boolean;
  batchReconciled: boolean;
  message: string;
}

/**
 * Response DTO for check-in history
 */
export interface CheckinHistoryResponseDto {
  items: CheckinHistoryItemDto[];
  totalCount: number;
}

/**
 * Check-in history item DTO
 */
export interface CheckinHistoryItemDto {
  sequence: number;
  unitId: string;
  displayUnitId?: string;
  collDate?: Date | string;
  productCode?: string;
  productDesc?: string;
}

// ==================== UI Models ====================

/**
 * Component table row for UI display
 */
export interface ComponentTableRow extends ProductInfoDto {
  sequence: number;
  unitId: string; // Unit ID with aliquot suffix (e.g., "W123418031301-Z")
  collDate: Date | string;
  selected: boolean;
  validated: boolean;
  productValidation?: ValidateCheckinProductResponseDto;
}

/**
 * API Response wrapper (ReturnResult from backend)
 */
export interface ReturnResult<T> {
  success: boolean;
  statusCode: number;
  message?: string;
  item: T;
  error?: string;
}

/**
 * @deprecated Use ReturnResult instead
 */
export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  error?: string;
}
