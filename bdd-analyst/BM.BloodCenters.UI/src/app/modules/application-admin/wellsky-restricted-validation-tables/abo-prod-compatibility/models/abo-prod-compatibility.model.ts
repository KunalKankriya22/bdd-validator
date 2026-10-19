/**
 * ABO-Prod-compatibility Data Models
 * Represents ABO and product type compatibility configurations
 */

/**
 * Main display model for ABO-Prod-compatibility records
 */
export interface ABOProdCompatibilityModel {
  productType?: string;
  productDescription?: string;
  requestABO?: string;
  requestABODesc?: string;
  requestABODisplay?: string;
  compatibleABO?: string;
  compatibleABODesc?: string;
  compatibleABODisplay?: string;
  effectiveDate?: Date | null;
  terminationDate?: Date | null;
  modificationDate?: Date | null;
}

/**
 * Request parameters for fetching ABO-Prod-compatibility data
 */
export interface ABOProdCompatibilityParamsDto {
  SearchKeyword?: string;
  InventoryProductType?: string;
  EffectiveDateAfter?: string | null; // format: YYYY-MM-DD
  EffectiveDateBefore?: string | null; // format: YYYY-MM-DD
  TerminationDateAfter?: string | null; // format: YYYY-MM-DD
  TerminationDateBefore?: string | null; // format: YYYY-MM-DD
  Sort?: string;
}

/**
 * Internal filter value structure
 */
export interface ABOProdCompatibilityFilterValue {
  inventoryProductType: string | null;
  effectiveDateAfter: string | null; // format: YYYY-MM-DD
  effectiveDateBefore: string | null; // format: YYYY-MM-DD
  terminationDateAfter: string | null; // format: YYYY-MM-DD
  terminationDateBefore: string | null; // format: YYYY-MM-DD
}

/**
 * DTO for adding new ABO-Prod-compatibility records
 */
export interface ABOProdCompatibilityDto {
  inventoryProductType: string;
  requestedABO: string;
  compatibleABO: string;
  effectiveDate: string; // format: YYYY-MM-DD
  terminationDate?: string | null; // format: YYYY-MM-DD
}

/**
 * DTO for updating existing ABO-Prod-compatibility records
 * Includes current values to identify the record
 */
export interface UpdateABOProdCompatibilityDto {
  // Current values (for identification)
  currentInventoryProductType: string;
  currentRequestedABO: string;
  currentCompatibleABO: string;
  currentEffectiveDate: string; // format: YYYY-MM-DD

  // New values
  newCompatibleABO: string;
  newEffectiveDate?: string | null; // format: YYYY-MM-DD
  newTerminationDate?: string | null; // format: YYYY-MM-DD
}

/**
 * Filter options structure returned from API
 * Actual API returns just an array of product type strings
 */
export interface ABOProdCompatibilityFilterOption {
  productType: string;
  description?: string;
}

/**
 * Dropdown options for form fields
 * Actual API response structure
 */
export interface ABOProdCompatibilityDropdownOptions {
  productTypes?: Array<{ productType: string; description: string }>; // Array of product type objects
  aboCodes?: Array<{ key: string; value: string }>; // Array of ABO code objects
}

/**
 * ABO Code option for dropdowns
 */
export interface ABOCodeOption {
  key: string;
  value: string;
}

/**
 * Dropdown API Response Structure
 * Extends the standard wrapped response to include direct properties for backward compatibility
 */
export interface DropdownApiResponse extends ABOProdCompatibilityDropdownOptions {
  success?: boolean;
  message?: string;
  error?: string;
  statusCode?: number;
  item?: ABOProdCompatibilityDropdownOptions;
  data?: ABOProdCompatibilityDropdownOptions[];
  total?: number;
}
