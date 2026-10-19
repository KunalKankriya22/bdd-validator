// ============================================================================
// Common Response Structure
// ============================================================================
export interface ReturnResult<T> {
  success: boolean;
  message?: string;
  error?: string;
  statusCode: number;
  data?: T[];
  total?: number;
}

// ============================================================================
// Active Users API Models
// ============================================================================

export interface ActiveUser {
  userId: string;
  firstName: string;
  lastName: string;
  effectiveDate: string;
}

export type ActiveUsersResponse = ReturnResult<ActiveUser>;

// ============================================================================
// Menu Items API Models
// ============================================================================

/**
 * Request body for Get Menu Items By User API
 * POST /api/system-users/{userId}/menu-items
 */
export interface MenuItemsFilterRequest {
  searchKeyword?: string;
  menuTitle?: string;
  program?: string;
  effectiveDate?: string;
  effectiveDatePeriod?: 'BEFORE' | 'AFTER' | null;
  terminationDate?: string;
  terminationDatePeriod?: 'BEFORE' | 'AFTER' | null;
  sort?: 'A' | 'D' | null;
}

/**
 * Response data item for Get Menu Items By User API
 */
export interface MenuItemDto {
  userID: string;
  mnemonic: string;
  menuTitle: string;
  program: string;
  effectiveDate: string;
  terminationDate: string;
  otherUsers: number;
}

/**
 * Response for Get Menu Items By User API
 */
export type MenuItemsResponse = ReturnResult<MenuItemDto>;

// ============================================================================
// Other Users API Models
// ============================================================================

/**
 * Response data item for Get Users By Menu API
 * GET /api/system-users/menu-items/{mnemonic}/users/{userId}
 */
export interface MenuUserDto {
  userID: string;
  userName: string;
  groupID: string;
  groupDescription: string;
  accessLevel: number;
  effectiveDate: string;
}

/**
 * Response for Get Users By Menu API
 */
export type MenuUsersResponse = ReturnResult<MenuUserDto>;

// ============================================================================
// Filter Data API Models
// ============================================================================

/**
 * Response data item for Get Menu Items Filter Data API
 */
export interface MenuFilterDataDto {
  menuTitle: string[];
  program: string[];
}

/**
 * Response for Get Menu Items Filter Data API
 */
export type MenuFilterDataResponse = ReturnResult<MenuFilterDataDto>;

// ============================================================================
// Access Classes API Models
// ============================================================================

/**
 * Request body for Get Access Classes By User API
 * POST /api/v1/system-users/{userId}/access-classes
 */
export interface AccessClassesFilterRequest {
  searchKeyword?: string;
  class?: string;
  effectiveDate?: string;
  effectiveDatePeriod?: 'BEFORE' | 'AFTER' | null;
  terminationDate?: string;
  terminationDatePeriod?: 'BEFORE' | 'AFTER' | null;
  sort?: 'A' | 'D' | null;
}

/**
 * Response data item for Get Access Classes By User API
 */
export interface AccessClassDto {
  userID: string;
  class: string;
  description: string;
  accessLevel: number;
  usersInClass: number;
  effectiveDate: string;
  terminationDate: string;
}

/**
 * Response for Get Access Classes By User API
 */
export type AccessClassesResponse = ReturnResult<AccessClassDto>;

/**
 * Response data item for Get Access Classes Filter Data API
 */
export interface AccessClassesFilterDataDto {
  class: string[];
}

/**
 * Response for Get Access Classes Filter Data API
 */
export type AccessClassesFilterDataResponse = ReturnResult<AccessClassesFilterDataDto>;

/**
 * Response data item for Get User Classes API
 * GET /api/v1/define-user-access/user-classes?userId=X
 */
export interface UserClassOptionDto {
  code: string;
  description: string;
}

/**
 * Response for Get User Classes API
 */
export type UserClassOptionsResponse = ReturnResult<UserClassOptionDto>;

// ============================================================================
// Access Classes Users API Models
// ============================================================================

/**
 * Response data item for Get Users By Access Class API
 * POST /api/v1/system-users/{userId}/interdictions/{accessClass}/users
 */
export interface AccessClassUserDto {
  userId: string;
  userName: string;
  groupId: string | null;
  groupDescription: string;
  accessLevel: number;
  effectiveDate: string;
  terminationDate: string | null;
}

/**
 * Response for Get Users By Access Class API
 */
export type AccessClassUsersResponse = ReturnResult<AccessClassUserDto>;

// ============================================================================
// Associated Interdictions API Models
// ============================================================================

/**
 * Response data item for Get Associated Interdictions API
 * POST /api/v1/system-users/interdictions/{accessClass}/associated
 */
export interface AssociatedInterdictionDto {
  type: string;
  code: string;
  description: string;
  accessLevel: number;
  insertDate: string;
}

/**
 * Response for Get Associated Interdictions API
 */
export type AssociatedInterdictionsResponse = ReturnResult<AssociatedInterdictionDto>;

// ============================================================================
// Group Details API Models
// ============================================================================

/**
 * Response data item for Get Group Details API
 * GET /api/v1/system-users/group-details/{userId}
 */
export interface GroupDetailsDto {
  userId: string;
  groupId: string;
  groupDescription: string;
  accessLevel: number;
  effectiveDate: string;
  terminationDate: string;
}

/**
 * Response structure for Group Details API
 */
export interface GroupDetailsResponse {
  success: boolean;
  message?: string;
  error?: string;
  statusCode: number;
  item?: GroupDetailsDto;
  total?: number;
}

// ============================================================================
// Legacy/Deprecated Models (Keep for backwards compatibility)
// ============================================================================

/**
 * @deprecated Use MenuItemDto instead
 */
export interface MenuItem {
  menuTitle: string;
  accessLevel: string;
  effectiveDate: string;
  terminationDate: string;
  otherUsers: string;
}

/**
 * @deprecated Use MenuItemsFilterRequest instead
 */
export interface UserAccessRequest {
  userIdentifier: string;
}

/**
 * @deprecated This model will be replaced by individual API responses
 */
export interface UserAccessResponse {
  userId: string;
  userName: string;
  grpId: string;
  accPriv: number;
  groupName: string;
  effDate: string;
  termDate: string;
  menuItems: MenuItem[];
}

// ============================================================================
// Access Classes & Interdictions (Future APIs)
// ============================================================================

/**
 * @future These will be used when Access Classes endpoints are available
 */
export interface AccessClassItem {
  accessClass: string;
  description: string;
  accessLevel: string;
  effectiveDate: string;
  terminationDate: string;
}

/**
 * @future These will be used when Interdictions endpoints are available
 */
export interface InterdictionItem {
  interdictionsType: string;
  interdictionsCode: string;
  description: string;
}
