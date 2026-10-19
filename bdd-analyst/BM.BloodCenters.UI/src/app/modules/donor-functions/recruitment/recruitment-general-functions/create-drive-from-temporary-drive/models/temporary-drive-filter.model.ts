/**
 * Temporary Drive Filter Value Interface
 * Used to store active filter state
 */
export interface TemporaryDriveFilterValue {
  driveDate: Date | null;
  sponsorId: string | null;
  driveType: string | null;
  driveCategory: string | null;
}

/**
 * Filter options for dropdowns
 */
export interface TemporaryDriveFilterOptions {
  sponsors: Array<{ id: string; name: string }>;
  driveTypes: Array<{ value: string; label: string }>;
  driveCategories: Array<{ value: string; label: string }>;
}
