/**
 * Models for Place/Release Multiple Unit Interdiction (CPIMUINT)
 * JIRA: MLT-13197
 * Mnemonic: UNTINT2
 * Aligned with backend DTOs from /unit-interdiction API
 */

export type ActionType = 'PLACE' | 'RELEASE';

// Standard API Response Wrapper
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data: T;
}

// Interdiction Code DTO
export interface InterdictionCodeDto {
  interCode: string;        // Code (e.g., "AIDSDFRR")
  interType: string;        // Type: "D" (Donor), "U" (Unit), or "C" (Component)
  interDesc: string;        // Description
}

// Unit Entry DTO
export interface UnitEntryDto {
  unitId: string;
  collDate?: Date | string | null;
}

// Unit Validation Response DTO
export interface UnitInterdictionValidateUnitResponseDto {
  unitId: string;
  collDate?: Date | string | null;
  checkDigit?: string | null;
}

// Place/Release Request DTO
export interface UnitInterdictionRequestDto {
  action: string;              // "PLACE" or "RELEASE"
  interCodes: string[];        // Array of interdiction codes
  units: UnitEntryDto[];       // Array of units
}

// Place/Release Result DTO
export interface UnitInterdictionResultDto {
  processedCount: number;      // Number of interdictions placed/released
  skippedCount: number;        // Number that failed
  errors: string[];            // Error messages for skipped items
}

// Interdiction Code Validation Request
export interface InterdictionCodeValidationRequest {
  interCode: string;
}

// Unit Validation Request
export interface UnitValidationRequest {
  unitId: string;
}

// UI-specific models
export interface InterdictionRecord extends InterdictionCodeDto {}

export interface UnitRecord extends UnitInterdictionValidateUnitResponseDto {
  collectionDate?: Date | string | null;
}
