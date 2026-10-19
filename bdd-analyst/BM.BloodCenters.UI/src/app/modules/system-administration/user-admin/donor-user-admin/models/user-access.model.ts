/** User Access Class row for the table */
export interface UserAccessClassRow {
  accessClass: string;
  description: string;
  level: number;
  effectiveDate: string;
  terminationDate: string;
}

/** User information retrieved from API */
export interface UserAccessInfo {
  userId: string;
  userName: string;
  department: string;
}

/** API Response DTO from BE - matches DefineUserAccessListDto (camelCase from .NET serialization) */
export interface DefineUserAccessListDto {
  userId: string;
  userName: string;
  department: string;
  accessClass: string;
  description: string;
  level: number;
  effectiveDate: string;
  terminationDate: string;
}

/** Generic API Response wrapper */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data: T;
}

/** User dropdown option */
export interface UserDropdownOption {
  userId: string;
  userName: string;
}

/** Access Class dropdown item */
export interface AccessClassDropdownDto {
  code: string;
  description: string;
}

/** DTO for assigning an access class to a user */
export interface AssignUserAccessDto {
  userId: string;
  accessClass: string;
  interLevel: number;
  effDate: string;
  termDate?: string | null;
}

/** DTO for updating an existing user access class assignment */
export interface UpdateUserAccessDto {
  interLevel: number;
  effDate: string;
  termDate?: string | null;
}

/** Dialog data for assign/edit access class */
export interface AssignEditAccessClassDialogData {
  mode: 'assign' | 'edit';
  user: {
    userId: string;
    userName: string;
    department: string;
  };
  accessClassData?: {
    accessClass: string;
    description: string;
    level: number;
    effectiveDate: string;
    terminationDate?: string;
  };
}

/** Overlapping interdiction item */
export interface OverlappingInterdictionDto {
  code: string;
  description: string;
  accessClasses: string[];
}

/** Dialog result */
export interface AssignEditAccessClassDialogResult {
  success: boolean;
}
