// User Account from API
export interface UserAccount {
  useR_ID: string;
  useR_FIRST_NAME: string;
  useR_LAST_NAME: string;
  department: string;
}

// User info for display
export interface UserInfo {
  userId: string;
  userName: string;
  department: string;
}

// Access class from API response
export interface AccessClass {
  accessClass: string;
  code: string;
  description: string;
  accessLevel: number; // 1-9
  effectiveDate: string;
  terminationDate?: string | null;
}

// Lab user access details response from BE
export interface LabUserAccessDetailsResponse {
  userName: string;
  department: string;
  data: AccessClass[];
}

// User dropdown option
export interface UserDropdownOption {
  userId: string;
  userName: string;
}

// Access class option for dropdown
export interface AccessClassOption {
  code: string;
  description: string;
}

// Add access class request
export interface AddAccessClassRequest {
  userId: string;
  accessClass: string;
  description: string;
  accessLevel: number; // 1-9
  effectiveDate: string; // YYYY-MM-DD format
  terminationDate?: string | null;
}

// Update access class request
export interface UpdateAccessClassRequest {
  userId: string;
  description: string;
  accessLevel: number; // 1-9
  effectiveDate: string; // YYYY-MM-DD format
  terminationDate?: string | null;
}

// Attached user from API
export interface AttachedUser {
  userId: string;
  name: string;
  level: number; // 1-9
}

// Access level option from API
export interface AccessLevelOption {
  value: number;
  label: string;
}

// API response wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  statusCode: number;
  data: T;
}
