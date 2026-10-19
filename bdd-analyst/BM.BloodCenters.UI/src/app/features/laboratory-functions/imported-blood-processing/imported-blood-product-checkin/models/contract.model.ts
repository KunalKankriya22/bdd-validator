/**
 * Contract and Product Models
 * Based on API guide: IMCHKIN-API-Integration-Guide
 */

/**
 * Contract LOV DTO - from GET /lov/contracts
 */
export interface ContractLovDto {
  contractId: string;
  company: string;
  barCodeProtocol?: string;
}

/**
 * Product type LOV DTO - from GET /lov/product-types
 */
export interface ProductTypeLovDto {
  productType: string;
  productTypeDesc: string;
}

/**
 * Contract tests DTO - from GET /contracts/{contractId}/tests
 */
export interface ContractTestDto {
  testId: string;
  profileSetId: string;
  effDate: string;
  termDate: string | null;
}

/**
 * ABO label dropdown DTO - from GET /lov/abo-values
 */
export interface AboLabelDropdownDto {
  code: string;
  description: string;
}

/**
 * @deprecated Use ContractLovDto. Kept for any legacy references.
 */
export interface ContractDropdownDto {
  contractId: string;
  description: string;
}

/**
 * @deprecated No longer used.
 */
export interface ProductCodeDropdownDto {
  productCode: string;
  description: string;
}
