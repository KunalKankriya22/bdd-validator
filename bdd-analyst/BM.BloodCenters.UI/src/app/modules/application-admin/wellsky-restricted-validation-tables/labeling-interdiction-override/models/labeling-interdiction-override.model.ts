import moment from 'moment';

/**
 * LabelingInterdictionOverrideModel
 * Matches backend model for table row data
 */
export interface LabelingInterdictionOverrideModel {
  donorDecisionCode?: string;
  donorDecisionDescription?: string;
  productType?: string;
  productTypeDescription?: string;
  interCode?: string;
  interDescription?: string;
  interType?: string;
  overrideDescription?: string;
  effectiveDate?: Date | null;
  terminationDate?: Date | null;
  lastModifiedDate?: Date | null;
}

/**
 * Request DTO for fetching Labeling Interdiction Override data
 * Matches backend LabelingInterdictionOverrideSearchSortFilterDto
 */
export interface LabelingInterdictionOverrideSearchParamsDto {
  SearchKeyword?: string;
  DonorDecisionCode?: string;
  ProductType?: string;
  InterCode?: string;
  InterDescription?: string;
  InterType?: string;
  EffectivePeriod?: string;
  EffectiveDate?: string | null;
  TerminationPeriod?: string;
  TerminationDate?: string | null;
  Sort?: string;
}

/**
 * Filter Form Value Interface
 * Represents the structure of the filter panel form
 */
export interface LabelingInterdictionOverrideFilterValue {
  donorDecisionCode: string | null;
  donorDecisionCodeDisplay?: string | null;
  interType: string | null;
  interTypeDisplay?: string | null;
  effectiveDatePeriod: string | null;
  effectiveDate: moment.Moment | null;
  terminationDatePeriod: string | null;
  terminationDate: moment.Moment | null;
}

/**
 * Dropdown response from GET /labeling-interdiction-override/dropdowns
 */
export interface LabelingInterdictionOverrideDropdowns {
  donorDecisionCodes?: { code: string; description: string }[];
  productTypes?: { code: string; description: string }[];
  interCodes?: { code: string; description: string }[];
  interTypes?: { code: string; description: string }[];
}

/**
 * DTO for creating a new Labeling Interdiction Override record
 * Matches backend LabelingInterdictionOverrideCreateDto
 */
export interface LabelingInterdictionOverrideCreateDto {
  donorDecisionCode: string;
  productType: string;
  interCode: string;
  interType: string;
  overrideDescription: string;
  effectiveDate: string;
  terminationDate?: string | null;
  userId?: string;
}

/**
 * DTO for updating an existing Labeling Interdiction Override record
 * Matches backend LabelingInterdictionOverrideUpdateDto
 * Uses composite key (donorDecisionCode, productType, interCode) to identify the record
 */
export interface LabelingInterdictionOverrideUpdateDto {
  donorDecisionCode: string;
  productType: string;
  interCode: string;
  interType: string;
  overrideDescription: string;
  effectiveDate: string;
  terminationDate?: string | null;
  userId?: string;
}

/**
 * InterType mapping constants
 * Backend stores single character, frontend displays full form
 */
export const INTER_TYPE_MAP: Record<string, string> = {
  'N': 'NFT',
  'B': 'Bio',
  'H': 'Hold',
  'I': 'Initial'
};

/**
 * Get display label for InterType (e.g., "NFT")
 */
export function getInterTypeDisplay(code: string): string {
  return INTER_TYPE_MAP[code] || code;
}

/**
 * Get InterType code from display label (e.g., "NFT" -> "N")
 */
export function getInterTypeCode(display: string): string {
  if (display && display.includes(' - ')) {
    return display.split(' - ')[0];
  }
  return display;
}
