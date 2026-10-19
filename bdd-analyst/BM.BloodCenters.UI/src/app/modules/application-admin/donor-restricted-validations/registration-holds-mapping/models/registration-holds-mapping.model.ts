/**
 * Model for Registration Holds Mapping
 */
export interface RegistrationHoldsMappingModel {
  id?: number;
  interdictionReason: string;
  code: string;
  description: string;
  effectiveDate: Date | null;
  terminationDate: Date | null;
  modificationDate: Date | null;
  createdBy?: string;
  createdDate?: Date;
  modifiedBy?: string;
}

/**
 * DTO for API request parameters
 */
export interface RegistrationHoldsMappingParamsDto {
  SearchKeyword?: string;
  Sort?: 'asc' | 'desc';
  SortColumn?: string;
  InterdictionReason?: string;
  Code?: string;
  EffectiveDate?: string;
  EffectiveDatePeriod?: string;
  TerminationDate?: string;
  TerminationDatePeriod?: string;
}

/**
 * Filter values for Registration Holds Mapping
 */
export interface RegistrationHoldsMappingFilterValue {
  effectiveDatePeriod?: string | null;
  effectiveDate?: Date | string | null;
  terminationDatePeriod?: string | null;
  terminationDate?: Date | string | null;
}

/**
 * Request DTO for creating registration hold mapping
 */
export interface CreateRegistrationHoldsMappingRequestDto {
  InterReason: string;
  Code: string;
  EffectiveDate: string | null;
  TerminationDate: string | null;
}

/**
 * Request DTO for updating registration hold mapping
 */
export interface UpdateRegistrationHoldsMappingRequestDto {
  OriginalInterReason: string;
  OriginalCode: string;
  Code: string;
  EffectiveDate: string | null;
  TerminationDate: string | null;
}

/**
 * Dropdown row structure
 */
export interface DropdownRowDto {
  code: string;
  description: string;
}

/**
 * Dropdown response structure
 */
export interface RegistrationHoldsMappingDropdownDto {
  InterdictionReasons: DropdownRowDto[];
  InterdictionCodes: DropdownRowDto[];
}

/**
 * Response DTO from API
 */
export interface RegistrationHoldsMappingResponseDto {
  data: RegistrationHoldsMappingModel[];
  totalRecords: number;
  pageIndex: number;
  pageSize: number;
}
