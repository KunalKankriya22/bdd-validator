/**
 * AboValuesModel
 * Main model for ABO Values table records
 */
export interface AboValuesModel {
  testedAbo?: string;
  description?: string;
  intendedUse?: string;
  unitScheme?: string;
  aboLabel?: string;
  aboDescription?: string;
  bloodTypeCode?: string;
  transfusionStatus?: string;
  aboOnly?: boolean | string;
  alternateAbo?: string;
  usageCode?: string;
  effectiveDate?: Date | null;
  terminationDate?: Date | null;
  auditKey?: number;
}

/**
 * Request DTO for fetching ABO Values data with filters
 * Uses camelCase for backend compatibility
 */
export interface AboValuesParamsDto {
  searchKeyword?: string;
  intendedUse?: string;
  unitScheme?: string;
  transfusionStatus?: string;
  effectiveDate?: string;
  effectiveDatePeriod?: string;
  terminationDate?: string;
  terminationDatePeriod?: string;
  sort?: string;
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
 * Clean property names for internal use
 */
export interface AboValuesFilterValue {
  intendedUse: string | null;
  unitScheme: string | null;
  transfusionStatus: string | null;
  effectiveDatePeriod: string | null;
  effectiveDate: string | null;
  terminationDatePeriod: string | null;
  terminationDate: string | null;
}

/**
 * Dropdown option with key-value pair
 */
export interface DropdownOption {
  key: string;
  value: string;
  description?: string;
}

/**
 * Filter LOV Model - dropdown options from backend
 */
export interface AboValuesFilterLov {
  intendedUse?: DropdownOption[];
  unitScheme?: DropdownOption[];
  transfusionStatus?: DropdownOption[];
}

/**
 * Dropdown options for add/edit form
 */
export interface AboValuesDropdowns {
  testedABO?: DropdownOption[];
  intendedUse?: DropdownOption[];
  unitScheme?: DropdownOption[];
  transfusionStatus?: DropdownOption[];
  aboOnly?: DropdownOption[];
}

/**
 * DTO for adding new ABO Values record
 * Required fields: testedAbo, intendedUse, unitScheme, effectiveDate
 */
export interface AboValuesDto {
  testedAbo: string;
  intendedUse: string;
  unitScheme: string;
  aboLabel?: string;
  aboDescription?: string;
  transfusionStatus?: string;
  bloodTypeCode?: string;
  aboOnly?: string; // "Y" or "N"
  alternateAbo?: string;
  usageCode?: string;
  effectiveDate: string | null;
  terminationDate?: string | null;
}

/**
 * DTO for updating existing ABO Values record
 * Original fields identify the record to update
 * New values are the editable fields
 */
export interface UpdateAboValuesDto {
  // Audit key for identifying the record
  auditKey: number;

  // Original values (to identify the record)
  originalTestedAbo: string;
  originalIntendedUse: string;
  originalUnitScheme: string;

  // New values (editable fields)
  intendedUse?: string;
  unitScheme?: string;
  aboLabel?: string;
  aboDescription?: string;
  transfusionStatus?: string;
  bloodTypeCode?: string;
  aboOnly?: string; // "Y" or "N"
  alternateAbo?: string;
  usageCode?: string;
  effectiveDate?: string | null;
  terminationDate?: string | null;
}

/**
 * Form data interface for add/edit operations
 */
export interface AboValuesFormData {
  testedAbo: string;
  description?: string;
  intendedUse: string;
  unitScheme: string;
  aboLabel?: string;
  aboDescription?: string;
  bloodTypeCode?: string;
  transfusionStatus?: string;
  aboOnly?: boolean | string;
  alternateAbo?: string;
  usageCode?: string;
  effectiveDate: Date;
  terminationDate?: Date | null;
}
