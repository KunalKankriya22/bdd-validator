/**
 * CRYO Production API Models
 * Based on API documentation: entrycryoproductioncontroller.md
 */

/**
 * Create CRYO Separation DTO (Entry operation) - UPDATED
 */
export interface CreateCryoProductionDto {
  // Required fields
  unitId: string; // Unit ID
  workflowMode: 'separation' | 'freeze'; // ✅ NEW - Required workflow indicator

  // Separation workflow fields (required if workflowMode = 'separation')
  separationType?: 'SECOND' | 'THIRD'; // ✅ NEW - Required for separation
  oldProductCode?: string; // Old/Destined product code
  newProductCode?: string; // New product code
  verifyProductCode?: string; // ✅ NEW - For product code verification (error 9728)
  thawMethod?: string; // Thaw method code
  thawTemperature?: number; // Thaw temperature (decimal)
  centrifugeScan?: string; // 'M' for manual or 'C***C' barcode
  centrifugeId?: string; // Centrifuge ID (parsed from scan)
  sepDateTime?: string; // Separation date-time (ISO 8601 GMT)
  catalogNo?: string; // Catalog number

  // Freeze workflow fields (required if workflowMode = 'freeze')
  freezeTime?: string; // Freeze time (ISO 8601 GMT)
  cryoOkFlag?: string; // Cryo OK flag ('Y'/'N')
}

/**
 * Update CRYO Production DTO (Offline/Freeze operation) - UPDATED
 */
export interface UpdateCryoProductionDto {
  workflowMode?: 'separation' | 'freeze'; // ✅ NEW - Workflow indicator

  // Separation update fields
  thawMethod?: string;
  thawTemperature?: number;
  centrifugeId?: string;
  sepDateTime?: string;
  catalogNo?: string;

  // Freeze update fields
  freezeTime?: string; // If provided with cryoOkFlag → triggers freeze logic
  cryoOkFlag?: string; // Cryo OK flag ('Y'/'N')
}

/**
 * CRYO Production Response DTO
 */
export interface CryoProductionDto {
  unitId: string;
  collDate: string; // ISO 8601 format
  oldProductCode: string;
  oldProductDesc: string;
  newProductCode: string;
  newProductDesc: string;
  thawMethod: string | null;
  thawMethodDesc: string | null;
  thawTemperature: number | null;
  sepDateTime: string | null; // ISO 8601 format
  freezeTime: string | null; // ISO 8601 format
  cryoOkFlag: string | null; // 'Y' or 'N'
  rejectReasonCode: string | null;
  catalogNo: string | null;
  sepInd: number;
  insertDate: string; // ISO 8601 format
  insertUser: string;
}

/**
 * CRYO Production Query/Filter DTO
 */
export interface CryoProductionQueryDto {
  unitId?: string | null;
  oldProductCode?: string | null;
  newProductCode?: string | null;
  thawMethod?: string | null;
  cryoOkFlag?: string | null;
  collDateFrom?: string | null; // ISO 8601 format
  collDateTo?: string | null; // ISO 8601 format
  sepDateTimeFrom?: string | null; // ISO 8601 format
  sepDateTimeTo?: string | null; // ISO 8601 format
  searchKeyword?: string | null;
  sortColumn?: string | null;
  sortOrder?: string | null; // 'ASC' or 'DESC'
}

/**
 * Thaw Method LOV DTO
 */
export interface ThawMethodDto {
  thawMethod: string;
  methodDesc: string;
  minTemp: number;
  maxTemp: number;
  effDate: string;
}

/**
 * Centrifuge LOV DTO
 */
export interface CentrifugeLookupDto {
  equipId: string;
  serialNumber: string | null;
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data?: T;
  totalCount?: number;
  errorCode?: string;
}

/**
 * Validation Error DTO
 */
export interface ValidationError {
  errorCode: string;
  message: string;
  field?: string;
}

/**
 * Unit Validation Result DTO (UPDATED)
 */
export interface UnitValidationResultDto {
  isValid: boolean;
  workflowMode: 'separation' | 'freeze'; // ✅ NEW - Backend determines workflow

  // Common fields
  collDate?: string; // Collection date (ISO 8601)
  chapterId?: string; // Chapter ID

  // Separation workflow fields
  oldProductCode?: string; // Old/Destined product code (DUFFP)
  oldProductDesc?: string; // ✅ NEW - Old product description
  catalogNumber?: string; // Catalog number
  separationType?: 'SECOND' | 'THIRD'; // ✅ ENHANCED - Which separation
  bagCode?: string; // ✅ NEW - Bag code
  anticoagulant?: string; // ✅ NEW - Anticoagulant code
  volume?: number; // ✅ NEW - Volume

  // Freeze workflow fields
  hasFreeze: boolean; // true if freeze time already entered
  thawMethod?: string; // Thaw method (if freeze exists)
  thawMethodDesc?: string; // ✅ NEW - Thaw method description
  thawTemperature?: number; // Thaw temp (if freeze exists)
  newProductCode?: string; // New product (if freeze exists)
  newProductDesc?: string; // ✅ NEW - New product description
  sepTime?: string; // Separation time (if freeze exists)
  worksheetInsertDate?: string; // ✅ NEW - For CRWS validation

  // Validation errors and warnings
  validationErrors: ValidationError[]; // Empty if valid
  validationWarnings?: ValidationError[]; // Non-blocking warnings (e.g., interdiction 9789)
}

/**
 * Unit Validation Request DTO (UPDATED)
 */
export interface UnitValidationRequestDto {
  unitId: string;
  workflowMode?: 'separation' | 'freeze'; // ✅ NEW - Workflow indicator
  processCode?: string; // Optional - Process code
  productCode?: string; // Optional - Product code
}

/**
 * Auto-Select Product Request DTO (UPDATED)
 */
export interface AutoSelectProductRequestDto {
  unitId: string; // Required - Unit ID
  collDate: string; // Required - Collection date (ISO 8601)
  oldProductCode: string; // Required - Old product code
  catalogNumber: string; // Required - Catalog number
  antiCode?: string; // Optional - Anticoagulant code
  volumeModified?: number; // Optional - Modified volume
  calculateIntendedUse?: boolean; // ✅ NEW - Default true
}

/**
 * Auto-Select Product Response DTO (UPDATED)
 */
export interface AutoSelectProductResponseDto {
  newProductCode?: string; // Final product with intended use
  baseProductCode?: string; // ✅ NEW - Base product (5 chars)
  intendedUse?: string; // ✅ NEW - Intended use code (6th position)
  productDescription?: string; // Product description
  productShortName?: string; // ✅ NEW - Short name
  autoSelected: boolean; // true if auto-selected, false if manual selection needed
  productOptions: ProductVariantDto[]; // List of options (if matchCount > 1)
  matchCount: number; // 0, 1, or >1
  requiresVerification: boolean; // ✅ NEW - true if LBLPRINT='Y'

  // ✅ NEW - Error handling (commit eaf7a3f)
  errorCode?: string; // Error code when auto-select fails (9732, 9935)
  errorMessage?: string; // Error message when auto-select fails

  // Legacy fields for backward compatibility
  selectedProductCode?: string;
  selectedProductDesc?: string;
  matchReason?: string;
}

/**
 * Catalog Number LOV DTO
 */
export interface CatalogNumberLovDto {
  catalogNumber: string;
}

/**
 * Old Product LOV DTO
 */
export interface OldProductLovDto {
  productCode: string;
  productDesc: string;
}

/**
 * Product Code Option (for dropdowns)
 */
export interface ProductCodeOption {
  code: string;
  description: string;
}

/**
 * Temperature Range DTO
 */
export interface CryoTemperatureRangeDto {
  minTemp: number;
  maxTemp: number;
}

/**
 * Freeze Time Range DTO
 */
export interface CryoFreezeTimeRangeDto {
  minWsFreezeTime: number; // Min minutes from whole blood to freeze
  maxWsFreezeTime: number; // Max minutes from whole blood to freeze (8 hours)
  minSepFreezeTime: number; // Min minutes from separation to freeze
  maxSepFreezeTime: number; // Max minutes from separation to freeze (1 hour)
}

/**
 * Reprint Label Request DTO
 */
export interface ReprintLabelRequestDto {
  unitId: string;
  productCode: string;
  copies?: number;
}

/**
 * Intended Use Response DTO
 */
export interface IntendedUseResponseDto {
  intendedUse: string;
  intendedUseDesc: string;
}

/**
 * Product Variant DTO
 */
export interface ProductVariantDto {
  productCode: string;
  productDesc: string;
  antiCode: string | null;
  volume: number | null;
}

/**
 * ✅ NEW - Centrifuge Validation Response
 */
export interface CentrifugeValidationDto {
  isValid: boolean;
  centrifugeId?: string; // Parsed from scan
  description?: string;
  status?: string;
  isOnHold: boolean; // true if CENT interdiction should be placed
  errorCode?: string;
  errorMessage?: string;
}

/**
 * ✅ NEW - Temperature Validation Response
 */
export interface TemperatureValidationDto {
  isValid: boolean;
  minTemp: number;
  maxTemp: number;
  actualTemp: number;
  isOutOfRange: boolean; // true if CRTE interdiction should be placed
  errorCode?: string;
  errorMessage?: string;
}

/**
 * ✅ NEW - Freeze Time Validation Response
 */
export interface FreezeTimeValidationDto {
  isValid: boolean;
  freezeTime: string;
  sepTime: string;
  worksheetTime: string;
  sepToFreezeHours: number;
  worksheetToFreezeHours: number;
  minSepFreezeTime: number;
  maxSepFreezeTime: number;
  minWsFreezeTime: number;
  maxWsFreezeTime: number;
  crwsInterdiction: boolean; // true if CRWS interdiction needed
  crseInterdiction: boolean; // true if CRSE interdiction needed
  errorCode?: string;
  errorMessage?: string;
}

/**
 * ✅ NEW - Slow Bleed Interdiction Check Request/Response
 */
export interface CheckBlInterdictionRequestDto {
  unitId: string;
  newProductCode: string;
}

export interface CheckBlInterdictionResponseDto {
  blInterdictionPlaced: boolean;
  interdictionCode?: string; // BLFA or BLHO
  errorCode?: string;
  errorMessage?: string;
}

/**
 * ✅ NEW - Add-On Bags Update Request/Response
 */
export interface UpdateAddOnBagsRequestDto {
  unitId: string;
  oldProductCode: string;
  newProductCode: string;
  collDate: string;
}

export interface UpdateAddOnBagsResponseDto {
  rowsUpdated: number;
}

/**
 * ✅ NEW - Catalog Number Validation Request/Response
 */
export interface ValidateCatalogNumberRequestDto {
  unitId: string;
  catalogNumber: string;
}

export interface ValidateCatalogNumberResponseDto {
  isValid: boolean;
  errorCode?: string;
  errorMessage?: string;
}

/**
 * ✅ NEW - New Product Code Validation Request/Response
 */
export interface ValidateNewProductRequestDto {
  newProductCode: string;
}

export interface ValidateNewProductResponseDto {
  isValid: boolean;
  errorCode?: string;
  errorMessage?: string;
}
