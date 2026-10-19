/**
 * Represents basic user information displayed in the application header.
 */
export interface User {
  /**
   * Full display name of the logged-in user.
   * Example: "John Doe"
   */
  name: string;

  /**
   * Unique identifier of the user.
   * Typically mapped from backend userId.
   */
  id: string;

  /**
   * Role assigned to the user.
   * Example: "Admin", "Donor", "Viewer"
   */
  role: string;

  /**
   * Optional URL pointing to the user's avatar image.
   * Used for profile display in the header.
   */
  avatarUrl?: string;
}

/**
 * Configuration object used to render the application header.
 */
export interface HeaderConfig {
  /**
   * Primary title shown in the header.
   * Example: "Donor Management System"
   */
  title: string;

  /**
   * Secondary text shown below or beside the title.
   * Example: "Boston Children’s Group"
   */
  subtitle: string;

  /**
   * URL of the organization or application logo.
   */
  logoUrl?: string;

  /**
   * URL of the institution logo (displayed in header-title-section).
   * Fetched from institution API and displayed alongside title/subtitle.
   */
  institutionLogoUrl?: string;

  /**
   * Optional logged-in user details.
   * If undefined, header will render without user information.
   */
  user?: User;
}

/**
 * API response model representing authenticated system user data.
 * Returned after successful login or token validation.
 */
export interface SystemUserResponse {
  /**
   * Unique identifier of the authenticated user.
   * Usually extracted from the JWT token or authentication service.
   */
  userId: string;

  /**
   * Identifier of the chapter or organization the user belongs to.
   */
  chapterId: string;

  /**
   * First name of the user.
   */
  userFirstName: string;

  /**
   * Last name of the user.
   */
  userLastName: string;

  /**
   * Identifier of the warehouse associated with the user.
   * Used for scoping inventory or data access.
   */
  warehouseId: string;

  /**
   * Database prefix assigned to the user.
   * Used for multi-tenant or environment-specific data segregation.
   */
  databasePrefix: string;

  /**
   * Full database name.
   * Example: "devdb"
   */
  databaseName: string;

  /**
   * Print header text for the chapter.
   * Used as descriptive tooltip for chapter information.
   * Example: "Dallas Regional Blood Center"
   */
  printHdr: string;

  /**
   * Name of the chapter.
   * Example: "Dallas Regional Blood Center"
   */
  chapterName: string;
  /**
   * Name of the warehouse.
   * Example: "Main Warehouse"
   */
  warehouseName: string;

  /**
   * Chapter's timezone identifier.
   * Used to display dates/times in the chapter's local timezone.
   * Example: "America/New_York", "America/Chicago", "America/Los_Angeles", "Asia/Kolkata"
   * Note: API returns this as "chapterTimezone" (lowercase 't')
   */
  chapterTimezone?: string;

  /**
   * User's testing lab code from SYSTEM_USERS.TESTING_LAB_CODE.
   * Used to filter lab-specific data (test kits, reagents).
   * Value '99' means "all labs".
   */
  labCode?: string;
}
