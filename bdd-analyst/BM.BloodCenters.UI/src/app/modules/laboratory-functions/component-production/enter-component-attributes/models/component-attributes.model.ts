/**
 * TypeScript models and DTOs for Component Attributes
 * Generated from API documentation: component-attributes-api-documentation.md
 */

// ===========================
// Request DTOs
// ===========================

/**
 * Request DTO for adding a component attribute
 * POST /component-attributes
 */
export interface AddComponentAttributeRequestDto {
  /** Unit identifier (max 15 chars) */
  unitId: string;
  /** Collection date */
  collDate: string;
  /** Product code (max 8 chars) */
  productCode: string;
  /** Attribute group (max 5 chars) */
  attribGroup: string;
  /** Attribute code (max 4 chars) */
  attribCode: string;
  /** Process date (required if attribute has life span) */
  procDate?: string;
}

// ===========================
// Response DTOs
// ===========================

/**
 * Component attribute DTO (response)
 */
export interface ComponentAttributeDto {
  /** Unit identifier */
  unitId: string;
  /** Collection date */
  collDate: string;
  /** Chapter identifier */
  chapterId: string;
  /** Product code */
  productCode: string;
  /** Attribute group */
  attribGroup: string;
  /** Attribute code */
  attribCode: string;
  /** Attribute description */
  attribDesc?: string;
  /** Process date/time */
  procDate?: string;
  /** Insert timestamp */
  insertDate: string;
  /** User who inserted */
  insertUser: string;
  /** Program identifier */
  programId?: string;
  /** Original expiry date */
  expiryDate?: string;
  /** Calculated expiry date (after life span applied) */
  newExpiryDate?: string;
  /** Product description */
  productDesc?: string;
  /** Product type (RBC, PLT, FFP, etc.) */
  productType?: string;
  /** Associated interdiction code */
  interCode?: string;
}

/**
 * Component product DTO (LOV response)
 * GET /component-attributes/products/{unitId}/{collDate}
 */
export interface ComponentProductDto {
  /** Product code */
  productCode: string;
  /** Product description */
  productDesc: string;
  /** Product type (RBC, PLT, FFP, etc.) */
  productType: string;
  /** Expiry date */
  expiryDate?: string;
  /** Component status */
  componentStatus: string;
}

/**
 * Attribute group DTO (LOV response)
 * GET /component-attributes/attribute-groups/{productType}
 */
export interface AttributeGroupDto {
  /** Group code */
  code: string;
  /** Group description */
  codeDesc: string;
}

/**
 * Attribute code DTO (LOV response)
 * GET /component-attributes/attribute-codes/{productType}/{attribGroup}
 */
export interface AttributeCodeDto {
  /** Attribute code */
  attribCode: string;
  /** Attribute description */
  attribDesc: string;
  /** Associated interdiction code */
  interCode?: string;
  /** Status flag */
  statusFlag?: string;
  /** Stop label flag (Y/N) */
  stopLabelFlag?: string;
  /** Life span value */
  lifeSpan?: number;
  /** Life span indicator (D=Days, Y=Years, H=Hours) */
  lifeSpanInd?: string;
}

// ===========================
// API Response Wrappers
// ===========================

/**
 * Standard API success response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  item?: T;
  total?: number;
}

/**
 * Standard API error response
 */
export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  errorCode: string;
  message: string;
  errorResponse: {
    errorCode: string;
    error: string;
  };
}

// ===========================
// Error Code Mappings
// ===========================

/**
 * Component Attributes error codes and their user-friendly messages
 */
export const COMPONENT_ATTRIBUTES_ERROR_MESSAGES: Record<string, string> = {
  '0063': 'Unit not found. Please verify the Unit ID.',
  '0131': 'No valid components found for this unit.',
  '0210': 'Component status must be "Lab" to add attributes.',
  '0231': 'Cannot add attributes to pooled products.',
  '1205': 'Product not found for this unit.',
  '1110': 'Invalid attribute group for this product type.',
  '9759': 'Attribute type must be "A" (Attribute).',
  '1100': 'Attribute code not found.',
  '0030': 'This attribute is already assigned to the component.',
  '0035': 'Attribute not valid for this product.',
  '8060': 'Process date cannot be before collection date.',
  '8030': 'Process date cannot be in the future.',
};

/**
 * Get user-friendly error message from error code
 */
export function getErrorMessage(errorCode: string): string {
  return COMPONENT_ATTRIBUTES_ERROR_MESSAGES[errorCode] || 'An unexpected error occurred. Please try again.';
}
