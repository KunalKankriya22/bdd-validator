/**
 * Assign User Interdiction Class Model
 * Represents a single user interdiction class record
 */
export interface AssignUserInterdictionClassModel {
  userId: string;
  userName: string;
  interClass: string;
  interClassDesc: string;
  effectiveDate: Date | null;
  terminationDate?: Date | null;
  lastModifiedDate: Date | null;
  isActive: boolean;
}

/**
 * Request DTO for fetching Assign User Interdiction Class data
 */
export interface AssignUserInterdictionClassParamsDto {
  searchText?: string;
  interClass?: string;
  effectiveDate?: string;
  effectiveDatePeriod?: string;
  terminationDate?: string;
  terminationDatePeriod?: string;
  sortColumn?: string;
  sort?: 'A' | 'D';
}

/**
 * Filter Form Value Interface
 * Represents the structure of the filter panel form
 */
export interface AssignUserInterdictionClassFilterValue {
  interClass: string | null;
  effectiveDatePeriod: 'After' | 'Before' | null;
  effectiveDate: Date | null;
  terminationDatePeriod: 'After' | 'Before' | null;
  terminationDate: Date | null;
}

/**
 * User option for dropdown
 */
export interface UserOption {
  userId: string;
  userName: string;
  displayName: string;
}

/**
 * Interdiction Class option for dropdown
 */
export interface InterdictionClassOption {
  code: string;
  description: string;
}

/**
 * DTO for Add/Update User Interdiction Class
 */
export interface AssignUserInterdictionClassDto {
  userId: string;
  interClass: string;
  effectiveDate: string | null;
  terminationDate?: string | null;
}

/**
 * Panel State Interface
 */
export interface UserInterdictionClassPanelState {
  isOpen: boolean;
  mode: 'add' | 'edit';
  data?: AssignUserInterdictionClassModel;
}
