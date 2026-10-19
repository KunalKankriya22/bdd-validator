// Models for Convert Component into Spiked Bag (ISBT) - FRICON2

export interface ProcessCode {
  processCode: string;
  processCodeDesc: string;
}

export interface ProductType {
  productType: string;
  description: string;
}

export interface AttributeGroup {
  attribGroup: string;
  description: string;
}

export interface AttributeCode {
  attribCode: string;
  description: string;
}

export interface CatalogNumber {
  catalogNumber: string;
  lotNumber?: string;
}

export interface ProductCodeOption {
  productCode: string;
  productDesc: string;
  productShortName?: string;
  componentPrefix?: string;
  productType?: string;
}

export interface Product {
  productCode: string;
  productDesc: string;
  componentPrefix: string;
  productType: string;
}

export interface UnitValidationResponse {
  success: boolean;
  message: string;
  collectionDate: string;
  productCode: string;
  productDesc: string;
  attributeGroup?: string;
  attributeCode?: string;
  suitabilityCheckDate?: string;
}

/**
 * Request for deriving new product code - FRICON2 exact match
 * Calls Del_Attribute.Add_Attribute package
 * ChapterId is automatically retrieved from HTTP request context on the backend
 */
export interface DeriveProductRequest {
  oldProductCode: string;    // Full product code e.g., "RBCAS001"
  processCode: string;       // REQUIRED: Process code e.g., "SPIKE" (for tracking/logging)
  productType: string;       // REQUIRED: Product type e.g., "RBC"
  attributeType: string;     // REQUIRED: Attribute code e.g., "SPIKE" (passed as P_ATTRIBUTE_TO_ADD)
}

/**
 * Response from deriving product code - FRICON2 exact match
 * Returns either single product or multiple options for user selection
 */
export interface DeriveProductResponse {
  success: boolean;
  newProductCode?: string;           // Complete new product code (if single match)
  newProductDesc?: string;           // Product description
  productDesc?: string;              // Alias for newProductDesc (backward compatibility)
  productFormula?: string;           // Formula from Del_Attribute.Add_Attribute
  hasMultipleMatches: boolean;       // True if multiple products found
  isMultiple?: boolean;              // Alias for hasMultipleMatches (backward compatibility)
  multipleProducts?: ProductOption[]; // Options for user selection
  productOptions?: ProductOption[];  // Alias for multipleProducts (backward compatibility)
  errorMessage?: string;             // Error message if failed
}

/**
 * Product option for multiple match selection
 */
export interface ProductOption {
  productCode: string;          // Base product code (5 chars)
  productDesc: string;          // Product description
  productFormula: string;       // Product formula
  modifierCode?: string;        // Modifier code if applicable
  completeProductCode: string;  // Complete code with suffix
}

export interface VerifyProductRequest {
  unitId: string;
  newProductCode: string;
  chapterId?: string;
}

export interface ConvertComponentRequest {
  unitId: string;
  oldProductCode: string;
  newProductCode: string;
  processCode: string;
  processDate: string;
  attributeGroup: string;
  attributeCode: string;
  catalogNumber: string;
  verifyProductCode?: string;
  chapterId?: string;
  userId?: string;
}

export interface ConvertComponentResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data?: ComponentData[];
}

export interface ComponentData {
  unitId: string;
  productCode: string;
  catalogNumber: string;
  processDateTime: string;
  attributeGroup: string;
  attributeType: string;
  newProduct: string;
}

export interface ConversionHistoryRow {
  unitId: string;
  productCode: string;
  processDateTime: string;
  attributeGroup: string;
  attributeType: string;
  newProduct: string;
  catalogNumber: string;
  verifyProduct: string;
}

export interface ReprintLabelRequest {
  unitId: string;
  productCode: string;
  chapterId?: string;
}

/**
 * Response from FR_VPRODUCT_PROCESSES query
 * Auto-populates Attribute Group, Code, and Suitability Check Date
 */
export interface ProductProcessAttributeResponse {
  success: boolean;
  statusCode: number;
  message: string;
  errorCode?: string;
  item: ProductProcessAttribute | null;
}

export interface ProductProcessAttribute {
  attributeGroup: string;
  attributeGroupDesc: string;
  attributeCode: string;
  attributeCodeDesc: string;
  attributeType: string; // Always 'C' for conversion
  suitabilityCheckDate: string | null;
  oldProductCode: string;
  processCode: string;
}

/**
 * Response from catalog number validation
 * Matches FRICON2 CATALOG_NUMBER.VALIDATE_FIELD trigger
 */
export interface CatalogValidationResponse {
  success: boolean;
  message: string;
  catalogNumber?: string;
  isValid: boolean;
}

/**
 * Attribute group for product dropdown
 * FRICON2 - Attribute Group dropdown
 */
export interface AttributeGroupForProduct {
  code: string;
  codeDesc: string;
}

/**
 * Attribute type for product and group dropdown
 * FRICON2 - Attribute Type dropdown
 */
export interface AttributeTypeForProduct {
  attribCode: string;
  attribDesc: string;
}
