/**
 * Attribute Service Code Model
 * Based on API documentation: sfiattr-api-documentation.md
 * Form: SFIATTR (Enter Attribute Service Codes)
 * Mnemonic: LTRCNFWS
 */

/**
 * AttributeServiceCodeDto - Response model from API
 * All fields from VALID_ATTRIBUTES table
 */
export interface AttributeServiceCodeDto {
  attribGroup: string;              // Attribute group code (PK 1/2) - READ ONLY
  attribCode: string;                // Attribute code (PK 2/2) - READ ONLY
  attribDesc: string;                // Attribute description - READ ONLY
  attribCustom: string | null;       // Customer attribute flag (Y/N) - READ ONLY
  normalStockFlag: string | null;    // Normal stock flag (Y/N) - READ ONLY
  price: number | null;              // Price for the attribute - EDITABLE
  serviceCode: string | null;        // Service code for billing (max 8 chars) - EDITABLE
  creditFlag: string | null;         // Credit flag (Y/N) - EDITABLE
  lastModifiedDate: string | null;   // Last modification timestamp (audit) - READ ONLY
  programId: string | null;          // Program identifier (audit) - READ ONLY
}

/**
 * UpdateAttributeServiceCodeDto - Request model for UPDATE endpoint
 * Only price, serviceCode, creditFlag can be modified
 */
export interface UpdateAttributeServiceCodeDto {
  price?: number | null;             // Price (0 to 9999999999.99)
  serviceCode?: string | null;       // Service code (max 8 chars, uppercase)
  creditFlag?: string | null;        // Credit flag (max 1 char, uppercase, Y/N)
}

/**
 * AttributeServiceCodeQueryDto - Request model for filtering/searching
 */
export interface AttributeServiceCodeQueryDto {
  attributeGroup?: string | null;    // Filter by attribute group (recommended)
  searchKeyword?: string | null;     // Search across code and description
  sortColumn?: string | null;        // Column to sort by (AttribGroup, AttribCode, AttribDesc, Price, ServiceCode)
  sortOrder?: string | null;         // ASC or DESC
  filterPrice?: string | null;       // Filter by price
  filterServiceCode?: string | null; // Filter by service code
}

/**
 * AttributeGroupDropdownDto - Response model for groups dropdown
 */
export interface AttributeGroupDropdownDto {
  code: string;                      // Attribute group code
  description: string;               // Attribute group description
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  total?: number;
}

/**
 * Extended model for UI with unique row ID for table expansion
 */
export interface AttributeServiceCodeModel extends AttributeServiceCodeDto {
  uniqueRowId?: string;              // Unique identifier for row expansion tracking
}
