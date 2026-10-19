/**
 * DonorInterdictionOverrideQueryModel
 * Matches backend response model for Valid Donor Override Query
 */
export interface DonorInterdictionOverrideQueryModel {
  donorDecisionCode?: string;
  decisionDesc?: string;
  productType?: string;
  productTypeDesc?: string;
  attribGroup?: string;
  attribCode?: string;
  interCode?: string;
  interDesc?: string;
  interType?: string;
  overrideDesc?: string;
  effDate?: Date | null;
  termDate?: Date | null;
}

/**
 * Request DTO for fetching Valid Donor Override Query data
 * Parameter names match backend expected field names
 */
export interface DonorInterdictionOverrideQueryParamsDto {
  SearchKeyword?: string;
  DonorDecisionCode?: string;
  InterType?: string;
  EffectiveDatePeriod?: string;
  EffectiveDate?: string;
  TerminationDatePeriod?: string;
  TerminationDate?: string;
  Sort?: string;
}

export type SortDirection = 'A' | 'D' | 'default';

/**
 * Filter Form Value Interface
 * Represents the structure of the filter panel form
 */
export interface DonorInterdictionOverrideFilterValue {
  cue: string | null;
  type: string | null;
  effectiveDatePeriod: string | null;
  effectiveDate: Date | null;
  terminationDatePeriod: string | null;
  terminationDate: Date | null;
}

/**
 * Filter LOV Model - matches backend filter dropdown response
 */
export interface DonorInterdictionOverrideFilterLov {
  donorDecisionCodes?: string[];
  types?: string[];
}
