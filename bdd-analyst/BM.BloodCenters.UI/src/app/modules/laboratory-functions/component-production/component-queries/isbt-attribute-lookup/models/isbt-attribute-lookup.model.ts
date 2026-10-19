/**
 * ISBT Attribute DTO - represents an ISBT attribute code entry
 */
export interface IsbtAttributeDto {
  attribGroup: string;
  attribCode: string;
  oldAttribCode: string | null;
  attribDesc: string;
  effDate: string; // Formatted as DD-MMM-YYYY
  termDate: string; // Formatted as DD-MMM-YYYY or empty
}

/**
 * ISBT Attribute Group DTO - represents an ISBT attribute group with description
 */
export interface IsbtAttributeGroupDto {
  code: string;
  description: string;
  oldGroup: string | null;
}

/**
 * Product Formula DTO - represents product formula details
 */
export interface ProductFormulaDto {
  productCode: string;
  productClass: string;
  modifierCode: string;
  productFormula: string;
  oldProductFormula: string | null;
}

/**
 * Product LOV Option - for dropdown
 */
export interface ProductLovOption {
  productCode: string;
  description?: string;
}

/**
 * Attribute Group LOV Option - for dropdown
 */
export interface AttributeGroupLovOption {
  code: string;          // Maps from backend Code
  description: string;   // Maps from backend Description
}

/**
 * Attribute Code LOV Option - for dropdown
 */
export interface AttributeCodeLovOption {
  attribCode: string;    // Maps from backend AttribCode
  attribDesc: string;    // Maps from backend AttribDesc
}

/**
 * Search Query Parameters
 * FMB: cpqalook_fmb.xml - ATTRIBUTES block
 * Query: WHERE ATTRIB_GROUP = :ctrl_block_1.attrib_group ORDER BY ATTRIB_CODE
 */
export interface IsbtAttributeSearchParams {
  attribGroup?: string;
  oldGroup?: string;
  attribCode?: string;
  oldAttribCode?: string;
  // FMB does NOT use unitSchemeType in main query (only in LOV dropdowns)
}

/**
 * Code mapping result DTO - for code-to-code cross-reference
 */
export interface CodeMappingResultDto {
  attribCode: string | null;
  oldAttribCode: string | null;
  attribDesc: string | null;
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data: T;
  total?: number;
  oracleErrorCode?: string;
}
