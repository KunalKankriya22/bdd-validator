/**
 * LabelingInterdictionOverrideQueryModel
 * Matches backend response model for Labeling Interdiction Override Query
 */
export interface LabelingInterdictionOverrideQueryModel {
  donorDecisionCode?: string;
  decisionDesc?: string;
  productType?: string;
  productTypeDesc?: string;
  interCode?: string;
  interDesc?: string;
  interType?: string;
  overrideDesc?: string;
  effDate?: Date | null;
  termDate?: Date | null;
}

/**
 * Request DTO for fetching Labeling Interdiction Override Query data
 * Parameter names match backend expected field names
 */
export interface LabelingInterdictionOverrideQueryParamsDto {
  SearchKeyword?: string;
  DonorDecisionCode?: string;
  InterType?: string;
  EffectivePeriod?: string;
  EffectiveDate?: string;
  TerminationPeriod?: string;
  TerminationDate?: string;
  Sort?: string;
}

export type SortDirection = 'A' | 'D' | 'default';

/**
 * Filter Form Value Interface
 * Represents the structure of the filter panel form
 */
export interface LabelingInterdictionOverrideFilterValue {
  cue: string | null;
  cueDisplay?: string | null;
  type: string | null;
  typeDisplay?: string | null;
  effectiveDatePeriod: string | null;
  effectiveDate: Date | null;
  terminationDatePeriod: string | null;
  terminationDate: Date | null;
}

/**
 * Filter LOV Model - matches backend filter dropdown response
 */
export interface LabelingInterdictionOverrideFilterLov {
  donorDecisionCodes?: { code: string; description: string }[];
  productTypes?: { code: string; description: string }[];
  interCodes?: { code: string; description: string }[];
  interTypes?: { code: string; description: string }[];
}
