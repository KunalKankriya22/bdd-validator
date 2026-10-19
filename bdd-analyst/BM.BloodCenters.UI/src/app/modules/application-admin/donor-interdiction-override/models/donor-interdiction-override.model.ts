/**
 * DonorInterdictionOverrideModel
 * Matches backend API response for table row data
 */
export interface DonorInterdictionOverrideModel {
  donorDecisionCode?: string;
  decisionDesc?: string;
  productType?: string;
  productTypeDesc?: string;
  attributeGroup?: string;
  attributeCode?: string;
  interCode?: string;
  interDesc?: string;
  interType?: string;
  overrideDesc?: string;
  effDate?: Date | null;
  termDate?: Date | null;
  lastModifiedDate?: Date | null;
  programId?: string;
}

/**
 * Request DTO for fetching Donor Interdiction Override data
 * Matches backend API filter params
 */
export interface DonorInterdictionOverrideSearchParamsDto {
  searchKeyword?: string;
  donorDecisionCode?: string;
  productType?: string;
  interCode?: string;
  interType?: string;
  effectiveDateBefore?: string;
  effectiveDateAfter?: string;
  terminationDateBefore?: string;
  terminationDateAfter?: string;
  sort?: string;
}

/**
 * Filter Form Value Interface
 * Represents the structure of the filter panel form
 */
export interface DonorInterdictionOverrideFilterValue {
  donorDecisionCode: string | null;
  donorDecisionCodeDisplay?: string | null;
  interType: string | null;
  interTypeDisplay?: string | null;
  effectiveDatePeriod: string | null;
  effectiveDate: string | null;
  terminationDatePeriod: string | null;
  terminationDate: string | null;
}

/**
 * Dropdown response from GET /donor-interdiction-override/dropdowns
 */
export interface DonorInterdictionOverrideDropdowns {
  donorDecisionCodes?: { code: string; description: string }[];
  productTypes?: { code: string; description: string }[];
  attributeGroups?: { code: string; description: string }[];
  attributeCodes?: { code: string; description: string }[];
  interCodes?: { code: string; description: string }[];
  interTypes?: { code: string; description: string }[];
}

/**
 * DTO for creating a new Donor Interdiction Override record
 * Matches backend DonorInterdictionOverrideCreateDto
 * Note: API uses attribGroup/attribCode field names
 */
export interface DonorInterdictionOverrideCreateDto {
  donorDecisionCode: string;
  productType: string;
  attribGroup: string;
  attribCode: string;
  interCode: string;
  interType: string;
  overrideDesc: string;
  effDate: string;
  termDate?: string | null;
  insertUser?: string | null;
}

/**
 * DTO for updating an existing Donor Interdiction Override record
 * Matches backend DonorInterdictionOverrideUpdateDto
 * Uses composite key to identify the record
 * Note: API uses attribGroup/attribCode field names
 */
export interface DonorInterdictionOverrideUpdateDto {
  donorDecisionCode: string;
  productType: string;
  attribGroup: string;
  attribCode: string;
  interCode: string;
  interType: string;
  overrideDesc: string;
  effDate: string;
  termDate?: string | null;
  insertUser?: string | null;
  originalDonorDecisionCode?: string;
  originalProductType?: string;
  originalInterCode?: string;
}

/**
 * InterType mapping constants
 * Backend stores single character, frontend displays full form
 */
export const INTER_TYPE_MAP: Record<string, string> = {
  'N': 'No effect on product suitability',
  'H': 'Quarantine all products from donor',
  'C': 'Discard products from unit causing interdiction',
  'Q': 'Quarantine all products from unit causing interdiction',
  'A': 'Discard all products from donor',
  'I': 'Discard products between effective and termination dates'
};

/**
 * Get display label for InterType (e.g., "N - No effect on product suitability")
 */
export function getInterTypeDisplay(code: string): string {
  const name = INTER_TYPE_MAP[code];
  return name ? `${code} - ${name}` : code;
}

/**
 * Get InterType code from display label (e.g., "N - No effect..." -> "N")
 */
export function getInterTypeCode(display: string): string {
  if (display && display.includes(' - ')) {
    return display.split(' - ')[0];
  }
  return display;
}
