/**
 * TypeScript interfaces for Release Product Quarantine API
 * Based on KT document: ReleaseProductQuarantine-FE-KT.md
 */

// ========== Lookup / Dropdown Models ==========

/**
 * Release Type lookup (IT or RT)
 * Used for "Quarantine Release Type" dropdown
 */
export interface ReleaseType {
  code: string; // "IT" or "RT"
  description: string; // "Internal Quarantines" or "Returns"
}

/**
 * Reject Code lookup
 * Pre-loaded for discard path
 */
export interface RejectCode {
  code: string;
  description: string;
}

/**
 * Unit Reason
 * Reasons why a unit is in quarantine/return
 */
export interface UnitReason {
  reasonCode: string;
  reasonDescription: string;
}

/**
 * Storage Device
 */
export interface StorageDevice {
  deviceType: string; // "F", "R", "N" etc.
  deviceNumber: string;
  description: string;
}

/**
 * Storage Rack
 */
export interface StorageRack {
  rackNumber: string;
  description: string;
}

/**
 * Storage Tray
 */
export interface StorageTray {
  trayNumber: string;
  shelfNumber: string; // informational only
  description: string;
  isFull: string; // "Y" or "N"
}

/**
 * Product Code LOV item
 */
export interface ProductCodeLovItem {
  productCode: string;
  productDesc: string;
}

// ========== Grid Data Model ==========

/**
 * Unit Grid Item (for table display)
 * Represents a unit in the grid after selecting release type
 */
export interface UnitGridItem {
  unitId: string;
  displayUnitId: string | null; // formatted for display (ISBT with check digit, Codabar as-is)
  productCode: string;
  aliquot: string; // hidden field
  aboRh: string;
  expirationDate: string; // ISO datetime
  locationId: string | null;
  status: string | null; // null | "I" | "D"
  isExpired: string; // "Y" | "N" - hidden
  collDate: string; // ISO datetime - hidden
  bloodType: string; // hidden
  productType: string; // hidden
  inventoryClass: string; // hidden - maps to storageClass for rack lookup
  osokFlag: string | null; // hidden - needed for RT restock save
}

// Alias for backward compatibility
export type QuarantineTableItem = UnitGridItem;

// ========== Request DTOs ==========

/**
 * Save Release Request DTO
 * POST /release-product-quarantine/save
 */
export interface SaveReleaseRequest {
  releaseType: string; // "IT" | "RT"
  unitId: string;
  productCode: string;
  aliquot: string;
  selectedReasonCodes: string[]; // IT: all reason codes | RT: can be empty
  restock: boolean;
  deviceType?: string | null; // only when restock=true
  deviceNumber?: string | null; // only when restock=true
  rackNumber?: string | null; // only when restock=true
  trayNumber?: string | null; // only when restock=true
  rejectCode?: string | null; // only when restock=false
  codeScheme?: string | null; // "I" (ISBT) or "C" (Codabar)
  overrides: string[]; // empty on first call, codes on retry
}

// Alias for backward compatibility
export type ReleaseQuarantineProductDto = SaveReleaseRequest;

// ========== Response DTOs ==========

/**
 * Save Release Response
 * Response from POST /save
 */
export interface SaveReleaseResponse {
  status: 'OK' | 'WARNING';
  unitStatus?: 'I' | 'D'; // only when status='OK'
  locationId?: string; // only when restock=true + status='OK'
  warnings: Warning[];
}

/**
 * Warning
 * Warning item in save response
 */
export interface Warning {
  code: string; // "3722", "3721", "9930", "TRAY_FULL"
  message: string;
}

// ========== Standard API Response Wrappers ==========

/**
 * Standard API response wrapper for array data
 */
export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message?: string;
  data: T[];
  total?: number;
  errorCode?: string;
  errorResponse?: {
    errorCode: string;
    error: string;
  };
}

/**
 * Single item API response
 */
export interface ApiSingleResponse<T> {
  success: boolean;
  statusCode: number;
  message?: string;
  item?: T;
  errorCode?: string;
  errorResponse?: {
    errorCode: string;
    error: string;
  };
}

// Alias for backward compatibility
export type ReleaseQuarantineApiResponse<T> = ApiSingleResponse<T>;

// For product info - keeping for backward compatibility
export interface QuarantineProductInfoDto {
  unitId: string;
  productCode: string;
  aliquot?: string | null;
  productType?: string | null;
  collectionDate?: string | null;
  expirationDate?: string | null;
  aboCode?: string | null;
  aboRh?: string | null;
  isExpired: boolean;
  locationId?: string | null;
  status?: string | null;
  reasons: UnitReason[];
}

export const HARD_ERROR_CODES = new Set(['3722', '3721', '9930']);

export interface QuarantineTypeDto {
  code: string;
  description: string;
}

export interface QuarantineReasonDto {
  reasonCode: string;
  reasonDescription: string;
}

export interface RemoveReasonsRequest {
  unitId: string;
  productCode: string;
  aliquot: string;
  reasonCodes: string[];
}

export interface RemoveReasonsResponse {
  removedCount: number;
  remainingReasons: UnitReason[];
}
