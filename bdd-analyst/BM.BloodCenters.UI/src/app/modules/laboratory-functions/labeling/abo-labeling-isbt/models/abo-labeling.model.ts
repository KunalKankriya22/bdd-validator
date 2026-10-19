/**
 * TypeScript interfaces and DTOs for ABO Labeling ISBT
 * Generated from API Documentation: abo-labeling-isbt-api-documentation.md
 * Base URL: /api/v1/laboratory/abo-labeling
 */

// ============================================================================
// REQUEST DTOs
// ============================================================================

export interface ValidateUnitRequestDto {
  scannedUnitId: string;
  entryMode?: string | null;
  chapterId?: string | null;
}

export interface ValidateProductRequestDto {
  scannedProductCode: string;
  unitId?: string | null;
  entryMode?: string | null;
  chapterId?: string | null;
}

export interface ValidateBarcodeRequestDto {
  scannedBarcode: string;
  barcodeFormat: '128' | 'CODE128' | 'CODABAR';
  fieldType?: string | null;
}

export interface GenerateLabelRequestDto {
  unitId: string;
  productCode: string;
  componentPrefix?: string | null;
  expiryDate128?: string | null;
  expiryDateCodabar?: string | null;
  aboType: string;
  rhType?: string | null;
  chapterId?: string | null;
}

// ============================================================================
// RESPONSE DTOs
// ============================================================================

export interface ValidateUnitResultDto {
  isValid: boolean;
  unitId: string;
  checkDigit?: string | null;
  collectionDate?: string | null;
  chapterId?: string | null;
  errorMessage?: string | null;
  errorCode?: string | null;
}

export interface ValidateProductResultDto {
  isValid: boolean;
  productCode: string;
  productDescription?: string | null;
  componentPrefix?: string | null;
  aboOnly: boolean;
  productFormula?: string | null;
  errorMessage?: string | null;
  errorCode?: string | null;
}

export interface ValidateBarcodeResultDto {
  isValid: boolean;
  parsedValue: string;
  detectedFormat: string;
  parsedDate?: string | null;
  formatMetadata?: string | null;
  errorMessage?: string | null;
  errorCode?: string | null;
}

export interface GenerateLabelResultDto {
  success: boolean;
  labelLines: string[];
  unitIdWithCheckDigit: string;
  productCode: string;
  productDescription?: string | null;
  collectionDate?: string | null;
  expiryDate128?: string | null;
  expiryDateCodabar?: string | null;
  aboType: string;
  rhType?: string | null;
  errorMessage?: string | null;
  errorCode?: string | null;
}

export interface LabelFormatDto {
  formatCode: string;
  formatName: string;
  description: string;
  isActive: boolean;
  dateFormatMask?: string | null;
}

// ============================================================================
// COMPONENT MODELS (Frontend-specific)
// ============================================================================

export interface PrinterInfo {
  id: string;
  name: string;
  description: string;
  isSelected: boolean;
}

export interface ProcessingFacility {
  name: string;
  address: string;
}

export interface AboDisplayData {
  aboType: string;
  rhType: string;
  displayText: string;
  defaultUseStatus: string;
}

export interface UnitData {
  unitId: string;
  checkDigit?: string;
  collectionDate?: string;
  productCode?: string;
  productDescription?: string;
}

export interface ScanData {
  scanUnitAbo?: string;
  unitId?: string;
  abo?: string;
  aboDescription?: string;
  scanProductExp?: string;
  productCode?: string;
  expirationDate?: string;
  specialTesting?: string;
  testedAbo?: string;
  testedAboDescription?: string;
}

export interface InterdictionMessage {
  code: string;
  message: string;
}

export interface ProductAttribute {
  code: string;
  description: string;
}

// ============================================================================
// FORM DATA MODELS
// ============================================================================

export interface AboLabelingFormData {
  unitId: string;
  collectionDate?: string;
  productCode: string;
  productDescription?: string;
  scanUnitAbo: string;
  scannedUnitId: string;
  aboCode: string;
  aboDescription?: string;
  scanProductExp: string;
  scannedProductCode: string;
  expirationDate: string;
  specialTesting: string;
  testedAbo?: string;
  testedAboDescription?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const ABO_TYPES = [
  { code: 'A', description: 'A Pos Regular' },
  { code: 'B', description: 'B Pos Regular' },
  { code: 'AB', description: 'AB Pos Regular' },
  { code: 'O', description: 'O Pos Regular' },
] as const;

export const RH_TYPES = [
  { code: 'POS', description: 'POSITIVE' },
  { code: 'NEG', description: 'NEGATIVE' },
] as const;

export const BARCODE_FORMATS = [
  { code: '128', name: 'Code 128' },
  { code: 'CODE128', name: 'Code 128' },
  { code: 'CODABAR', name: 'Codabar' },
] as const;
