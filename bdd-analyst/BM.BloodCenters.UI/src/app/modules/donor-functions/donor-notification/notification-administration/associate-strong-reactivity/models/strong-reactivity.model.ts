/**
 * Core data model for Strong Reactivity from API
 */
export interface StrongReactivityModel {
  epitopeId1?: string | null;
  epitopeId2?: string | null;
  bound?: string | null;  // Bond value (C = Cross, S = Strong)
  effectiveDate?: string | Date | null;
  terminationDate?: string | Date | null;
  insertDate?: string | Date | null;
  insertUser?: string;
  programId?: string;
  chapterId?: string;
  auditKey?: number;
  totalCount?: number;
}

/**
 * API Response wrapper
 */
export interface StrongReactivityResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: StrongReactivityModel[];
  totalRecords: number;
}

/**
 * API request parameters for list endpoint
 */
export interface StrongReactivityParamsDto {
  epitopeId1?: string | null;
  epitopeId2?: string | null;
  bond?: string | null;
  searchKeyword?: string;
  effDate?: string | null;
  effDatePeriod?: string | null;
  termDate?: string | null;
  termDatePeriod?: string | null;
  sortDirection?: string;
  sortColumn?: string;
}

/**
 * Filter form values
 */
export interface StrongReactivityFilterValue {
  epitopeId1: string | null;
  epitopeId2: string | null;
  bound: string | null;
  effectivePeriod: string | null;
  effectiveDate: Date | null;
  terminationPeriod: string | null;
  terminationDate: Date | null;
}

/**
 * DTO for creating new Strong Reactivity record
 */
export interface CreateStrongReactivityDto {
  epitopeId1: string;
  epitopeId2: string;
  bound: string;           // C = Cross, S = Strong
  effectiveDate: string;   // ISO date string
  terminationDate?: string; // ISO date string (optional)
}

/**
 * DTO for updating existing Strong Reactivity record
 */
export interface UpdateStrongReactivityDto {
  epitopeId1: string;
  epitopeId2: string;
  bound: string;
  effectiveDate: string;
  terminationDate?: string;
}

/**
 * Bound type options (from Oracle Forms: Cross='C', Strong='S')
 */
export const BOUND_OPTIONS = [
  { label: 'Strong', value: 'S' },
  { label: 'Cross', value: 'C' }
] as const;

/**
 * Epitope dropdown item from API
 */
export interface EpitopeDropdownItem {
  epitopeId: string;
  locus?: string;
}

/**
 * Sort direction type
 */
export type SortDirection = 'A' | 'D' | 'default';

/**
 * Edit mode data - used for inline table editing
 */
export interface StrongReactivityEditRow extends StrongReactivityModel {
  _isEditing?: boolean;
  _isNew?: boolean;
  _isModified?: boolean; // Track if row has been changed
  _originalEpitopeId1?: string | null; // Track original for updates
  _originalEpitopeId2?: string | null; // Track original for updates
  _formGroup?: any; // FormGroup for all field validation (imported from @angular/forms)
}
