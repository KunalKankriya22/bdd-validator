/**
 * Interdiction Query Models
 *
 * DTOs and interfaces for Interdiction Query functionality (CPQINTAL / LINTQ)
 * Based on Jira Ticket: MLT-13080
 *
 * This is a READ-ONLY query screen that displays:
 * - Unit Interdictions
 * - Component Interdictions
 * - Unit Attributes
 * - Component Attributes
 */

// ===== REQUEST DTOs =====

/**
 * Request DTO for querying interdictions and attributes
 */
export interface InterdictionQueryRequest {
  unitId: string;              // Required - Max 13 chars
  productCode?: string;        // Optional - Max 9 chars - filters component data
  collectionDate?: string;     // Optional - ISO date string; backend uses current date if null
}

// ===== RESPONSE DTOs =====

/**
 * Main response DTO containing all interdiction and attribute data
 * Matches backend: InterdictionQueryResponseDto
 */
export interface InterdictionQueryResponse {
  unitId: string;                      // Backend: UnitId
  collectionDate: string;              // Backend: CollectionDate (DateTime)
  isArchived: boolean;                 // Backend: IsArchived
  unitInterdictions: UnitInterdiction[];     // Backend: UnitInterdictions
  componentInterdictions: ComponentInterdiction[];  // Backend: ComponentInterdictions
  unitAttributes: UnitAttribute[];     // Backend: UnitAttributes
  componentAttributes: ComponentAttribute[];  // Backend: ComponentAttributes
}

/**
 * Unit Interdiction DTO
 * Matches backend: UnitInterdictionDto
 */
export interface UnitInterdiction {
  interCode: string;                   // Backend: InterCode
  interDesc: string | null;            // Backend: InterDesc
  interType: string | null;            // Backend: InterType
  insertDats: string;                  // Backend: InsertDats (DateTime)
  interUserId: string | null;          // Backend: InterUserId
}

/**
 * Component Interdiction DTO
 * Matches backend: ComponentInterdictionDto
 */
export interface ComponentInterdiction {
  productCode: string;                 // Backend: ProductCode
  interCode: string;                   // Backend: InterCode
  interDesc: string | null;            // Backend: InterDesc
  interType: string | null;            // Backend: InterType
  insertDats: string;                  // Backend: InsertDats (DateTime)
  interUserId: string | null;          // Backend: InterUserId
}

/**
 * Unit Attribute DTO
 * Matches backend: UnitAttributeDto
 */
export interface UnitAttribute {
  attribGroup: string;                 // Backend: AttribGroup
  attribCode: string;                  // Backend: AttribCode
  attribDesc: string | null;           // Backend: AttribDesc
  insertDats: string;                  // Backend: InsertDats (DateTime)
  insertUserId: string | null;         // Backend: InsertUserId
}

/**
 * Component Attribute DTO
 * Matches backend: ComponentAttributeDto
 */
export interface ComponentAttribute {
  productCode: string;                 // Backend: ProductCode
  attribCode: string;                  // Backend: AttribCode
  attribDesc: string | null;           // Backend: AttribDesc
  attribGroup: string | null;          // Backend: AttribGroup
  insertDats: string;                  // Backend: InsertDats (DateTime)
  insertUserId: string | null;         // Backend: InsertUserId
}

/**
 * Product code option for the dropdown
 * Returned from /component-attributes/products endpoint
 */
export interface ProductCodeOption {
  productCode: string;
  productDesc: string;
  productType?: string;
  expiryDate?: string;
  componentStatus?: string;
}

// ===== API RESPONSE WRAPPER =====

/**
 * Standard API Response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  errorCode?: string;
  item?: T;
  data?: T;
  errorResponse?: {
    errorCode: string;
    error: string;
  };
}

// ===== TABLE MODELS =====

/**
 * Table row model for Unit Interdictions
 */
export interface UnitInterdictionTableRow {
  codeAndDescription: string;          // interdictionCode + interdictionDescription combined
  code: string;                        // interdictionCode (for search/sort)
  description: string;                 // interdictionDescription (for search/sort)
  type: string;                        // interdictionType
  timeStamp: string;                   // insertDate (formatted)
  user: string;                        // userId
}

/**
 * Table row model for Component Interdictions
 */
export interface ComponentInterdictionTableRow {
  productCode: string;                 // productCode
  code: string;                        // interdictionCode
  description: string;                 // interdictionDescription
  type: string;                        // interdictionType
  timeStamp: string;                   // insertDate (formatted)
  user: string;                        // userId
}

/**
 * Table row model for Unit Attributes (in modal)
 */
export interface UnitAttributeTableRow {
  attributeCode: string;
  description: string;                 // attributeDescription
  group: string;                       // attributeGroup
  timeStamp: string;                   // insertDate (formatted)
  user: string;                        // userId
}

/**
 * Table row model for Component Attributes (in modal)
 */
export interface ComponentAttributeTableRow {
  productCode: string;
  attributeCode: string;
  description: string;                 // attributeDescription
  group: string;                       // attributeGroup
  timeStamp: string;                   // insertDate (formatted)
  user: string;                        // userId
}

// ===== FORM STATE =====

/**
 * Component form state
 */
export interface InterdictionQueryFormState {
  unitId: string;
  productCode: string;
  productDescription: string;          // Read-only display field

  // State flags
  hasData: boolean;
  activeTab: 'unit' | 'component';
}

// ===== VALIDATION CONSTANTS =====

/**
 * Field length constraints from database schema
 */
export const FIELD_LENGTHS = {
  UNIT_ID: 13,
  CHAPTER_ID: 5,
  PRODUCT_CODE: 9,
  INTERDICTION_CODE: 6,
  ATTRIBUTE_CODE: 6,
  ATTRIBUTE_GROUP: 10,
  USER_ID: 6
};

// ===== ERROR CODE MAPPING =====

/**
 * Error code to user-friendly message mapping
 */
export const ERROR_MESSAGES: { [key: string]: string } = {
  '0063': 'Unit not found in database',
  '0230': 'Invalid request - validation failed',
  '400': 'Bad request - missing required parameters',
  '401': 'Unauthorized - user ID not found',
  '404': 'Data not found',
  '500': 'Internal server error'
};

/**
 * Get user-friendly error message from error code
 */
export function getErrorMessage(errorCode: string): string {
  return ERROR_MESSAGES[errorCode] || `An error occurred (Code: ${errorCode})`;
}
