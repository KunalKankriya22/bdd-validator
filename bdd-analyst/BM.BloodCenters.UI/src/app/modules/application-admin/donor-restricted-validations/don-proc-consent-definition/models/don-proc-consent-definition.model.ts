/**
 * DonProcConsentDefinitionModel
 * Represents the Donation/Procedure Consent Definition display model
 */
export interface DonProcConsentDefinitionModel {
  donationType?: string;
  procedureCode?: string;
  consentCode?: string;
  consentDescription?: string;
  effectiveDate?: Date | null;
  terminationDate?: Date | null;
}

/**
 * Request DTO for fetching Donation/Procedure Consent Definition data
 */
export interface DonProcConsentDefinitionParamsDto {
  ChapterId?: string;
  SearchKeyword?: string;
  DonationType?: string;
  ProcedureCode?: string;
  ConsentCode?: string;
  EffectiveDatePeriod?: string;
  EffectiveDate?: string;
  TerminationDatePeriod?: string;
  TerminationDate?: string;
  Sort?: string;
}

export type SortDirection = 'A' | 'D' | 'default';

export interface SortConfig {
  column: string;
  direction: SortDirection;
}

export interface PaginationConfig {
  pageIndex: number;
  pageSize: number;
  pageSizeOptions: number[];
  totalRecords: number;
}

/**
 * Filter Form Value Interface
 * Represents the structure of the filter panel form
 */
export interface DonProcConsentDefinitionFilterValue {
  donationType: string | null;
  procedureCode: string | null;
  consentCode: string | null;
  effectiveDatePeriod: string | null;
  effectiveDate: string | null;
  terminationDatePeriod: string | null;
  terminationDate: string | null;
}

/**
 * Filter LOV Model - dropdown options for filters
 */
export interface DonProcConsentDefinitionFilterLov {
  donationType?: string[];
  procedureCode?: string[];
  consentCode?: string[];
}

/**
 * DTO for adding new Consent Definition record
 */
export interface DonProcConsentDefinitionDto {
  donationType: string;
  procedureCode: string;
  consentCode: string;
  effectiveDate: string | null;
  terminationDate: string | null;
  chapterId: string;
}

/**
 * DTO for updating existing Consent Definition record
 * Requires current values to identify the record and new values to update
 */
export interface UpdateDonProcConsentDefinitionDto {
  // Current values (to identify the record)
  currentDonationType: string;
  currentProcedureCode: string;
  currentConsentCode: string;
  currentEffectiveDate: string;

  // New values (all fields)
  donationType: string;
  procedureCode: string;
  effectiveDate: string | null;
  terminationDate: string | null;
  chapterId: string;
  consentCode: string;
  consentDescription: string;
}
