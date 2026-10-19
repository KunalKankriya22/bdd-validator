/**
 * Models for Discard Empty Bags Component
 * Migrated from Oracle Forms CPIDISCA (DISMTBAG)
 */

/**
 * Reject Reason DTO from backend
 */
export interface RejectReasonDto {
  code: string;
  description: string;
}

/**
 * Unit validation result for discard empty bags
 * Early validation checks unit existence and bag availability
 */
export interface UnitDiscardValidationDto {
  isValid: boolean;
  unitId: string;
  collectionDate?: string;
  hasBagsAvailable: boolean;
  availableCatalogCount: number;
  errorCode?: string;
  errorMessage?: string;
}

/**
 * Discard Bag Request DTO
 */
export interface DiscardBagRequestDto {
  unitId: string;
  catalogNumber: string;
  rejectReasonCode: string;
}

/**
 * Discard Bag Response DTO from backend
 */
export interface DiscardBagResponseDto {
  unitId: string;
  collectionDate: string;
  componentPrefix: number;
  catalogNumber: string;
  rejectReasonCode: string;
  componentStatus: string;
}

/**
 * Standard API Response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T[];
  total?: number;
}

/**
 * Display model for discarded bags table
 */
export interface DiscardedBagDisplay {
  unitId: string;
  rejectReasonCode: string;
  rejectReasonDescription: string;
  catalogNumber: string;
  collectionDate: string;
  timestamp: Date;
}
