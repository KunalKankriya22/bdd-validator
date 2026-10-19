/**
 * Product Attribute Models
 * Used for Product Type Attributes (ISBT/Codabar) feature
 * JIRA: MLT-14237
 */

/**
 * Main Product Attribute model
 */
export interface ProductAttribute {
  productType: string;
  attribGroup: string;
  attribCode: string;
  attribCodeDesc: string;
  labelFlag: string;
  lifeSpanInd: string;
  lifeSpan: string;
  effDate: Date | string;
  termDate: Date | string | null;
  newProductType?: string | null;
  lastModifiedDate: Date | string;
  auditKey: number;
  programId: string;
}

/**
 * DTO for creating a new product attribute
 */
export interface CreateProductAttributeDto {
  productType: string;
  attribGroup: string;
  attribCode: string;
  labelFlag: string | null;
  lifeSpanInd: string | null;
  lifeSpan: string | null;
  effDate: string;
  termDate: string | null;
  newProductType: string | null;
}

/**
 * DTO for updating an existing product attribute
 */
export interface UpdateProductAttributeDto {
  labelFlag?: string | null;
  lifeSpanInd?: string | null;
  lifeSpan?: string | null;
  effDate?: string;
  termDate?: string | null;
  newProductType?: string | null;
}

/**
 * API query parameters for searching/filtering product attributes
 */
export interface ProductAttributeParamsDto {
  productType?: string;
  attribGroup?: string;
  attribCode?: string;
  labelFlag?: string;
  lifeSpanInd?: string;
  effDatePeriod?: string;
  effDate?: import('moment').Moment | string | null;
  termDatePeriod?: string;
  termDate?: import('moment').Moment | string | null;
  searchKeyword?: string;
  sortColumn?: string;
  sortOrder?: string;
}

/**
 * Filter values for the filter panel
 */
export interface ProductAttributeFilterValue {
  productType?: string;
  attribGroup?: string;
  attribCode?: string;
  labelFlag?: string;
  lifeSpanInd?: string;
  effDatePeriod?: string | null;
  effDate?: import('moment').Moment | string | null;
  termDatePeriod?: string | null;
  termDate?: import('moment').Moment | string | null;
}

/**
 * Dropdown option for Product Type
 */
export interface ProductTypeDropdown {
  productType: string;
  productTypeDesc: string;
}

/**
 * Dropdown option for Attribute Group
 */
export interface AttributeGroupDropdown {
  code: string;
  codeDesc: string;
}

/**
 * Dropdown option for Attribute Code
 */
export interface AttributeCodeDropdown {
  attribCode: string;
  attribDesc: string;
}

/**
 * Generic lookup type for filter dropdowns
 */
export interface LookUp {
  key: string;
  value: string;
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  total?: number;
  statusCode: number;
  message: string;
}

/**
 * Error response from API
 */
export interface ApiErrorResponse {
  success: boolean;
  errorCode?: string;
  error?: {
    errorCode: string;
    errorDescription: string;
  };
  statusCode: number;
  message?: string;
}

/**
 * Form data for add/edit panel
 */
export interface ProductAttributeFormData {
  productType: string;
  attribGroup: string;
  attribCode: string;
  attribCodeDesc: string;
  labelFlag: string;
  lifeSpanInd: string;
  lifeSpan: string;
  effDate: string;
  termDate: string | null;
  newProductType: string | null;
}

/**
 * Options for Label Flag dropdown (Yes/No)
 */
export interface LabelFlagOption {
  value: string;
  label: string;
}

/**
 * Options for Life Span Indicator dropdown (H/D/Y)
 */
export interface LifeSpanIndicatorOption {
  value: string;
  label: string;
}
