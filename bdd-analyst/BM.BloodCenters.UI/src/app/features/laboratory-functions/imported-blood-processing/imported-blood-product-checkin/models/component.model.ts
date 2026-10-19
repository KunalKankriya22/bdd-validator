/**
 * Imported Blood Component Models
 * Based on API documentation: imported-blood-checkin-api-documentation.md
 */

/**
 * Component creation request DTO
 */
export interface CreateComponentDto {
  unitId: string; // Unit identifier (not empty, unique)
  productCode: string; // Product code (not empty, ISBT 128 format if protocol=8)
  batchId: string; // Batch identifier (not empty, must exist)
  contractId: string; // Contract identifier (not empty)
  osUnitId: string; // Original source unit ID (not empty)
  barcodeProtocol: string; // Barcode protocol from contract (8/X/I=ISBT, C=Codabar, A=Alpha, N=Numeric)
  systemLabelDecision?: 'Y' | 'N'; // System label decision
  expiryDate?: string; // ISO 8601 date string
  collDate?: string; // Collection date (ISO 8601 date string)
  productLabel?: string; // Product label
  licenseFlag?: 'Y' | 'N'; // License flag
  abo?: string; // ABO blood type: A, B, AB, O, U
  rh?: string; // Rh factor: +, -, U
  allowExpiredProduct?: boolean; // Allow expired product to be stored as NFT
}

/**
 * Component response model
 */
export interface ComponentResponse {
  unitId: string;
  productCode: string;
  batchId: string;
  componentStatus: string; // Default: 'L' (Lab)
  expiryDate?: string;
  collDate?: string;
  osUnitId?: string;
  displayUnitId?: string;
  displayOsUnitId?: string;
  aboRh?: string; // ABO/Rh blood type
  systemLabelDecision?: string; // ABO code (e.g., '06', '62')
  productLabel?: string;
  hasAttributes?: boolean; // true if component has attributes in component_attributes table
}

/**
 * Component display model for grid
 */
export interface ComponentGridItem {
  externalUnitId: string; // osUnitId
  internalUnitId: string; // unitId
  productCode: string;
  abo?: string;
  label?: string;
  expirationDate?: string;
  attributes?: string; // Comma-separated attribute codes
}

/**
 * Component status update DTO
 */
export interface UpdateComponentStatusDto {
  status: 'A' | 'L' | 'I'; // Available, Lab, Issued
}
