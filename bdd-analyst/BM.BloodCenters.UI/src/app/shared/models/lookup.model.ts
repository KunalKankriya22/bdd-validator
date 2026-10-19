/**
 * Lookup DTOs
 * Common data transfer objects for various lookup/dropdown data
 * from VALID_MASTER_CODES and other lookup endpoints
 */

/**
 * Master Code DTO
 * Generic code/description pair from VALID_MASTER_CODES table
 * Used for dropdowns, autocompletes, and validation lists
 */
export interface MasterCodeDto {
  /**
   * Code type category (e.g., 'STATE', 'DRVTY', 'CNTRY')
   * Optional as some endpoints return codes without the type
   */
  codeType?: string;

  /**
   * The actual code value (e.g., 'NY', 'CA', 'USA')
   * Max length varies by code type
   */
  code: string;

  /**
   * Human-readable description of the code
   * Example: 'New York', 'California', 'United States'
   */
  description: string;

  /**
   * Effective date for the code (when it becomes active)
   * ISO 8601 datetime string in GMT
   */
  effDate?: string;

  /**
   * Termination date for the code (when it becomes inactive)
   * ISO 8601 datetime string in GMT
   * Null if code is still active
   */
  termDate?: string | null;
}

/**
 * Valid Test DTO
 * Represents a valid laboratory test available in the system
 * Used for test selection, scheduling, and validation
 */
export interface ValidTestDto {
  /**
   * Unique test identifier
   * Max 10 characters
   */
  testId: string;

  /**
   * Descriptive name of the test
   * Max 100 characters
   */
  testDesc: string;

  /**
   * Test group category (optional grouping for organization)
   * Max 10 characters
   * Null if test is not assigned to a group
   */
  testGroup: string | null;

  /**
   * Effective date when test becomes available
   * ISO 8601 datetime string in GMT
   */
  effDate: string;

  /**
   * Termination date when test is no longer available
   * ISO 8601 datetime string in GMT
   * Null if test is still active
   */
  termDate: string | null;
}

/**
 * State DTO
 * Represents a US state or territory
 * Typically used for address forms and location data
 */
export interface StateDto {
  /**
   * Two-letter state code (e.g., 'NY', 'CA', 'TX')
   * Max 2 characters
   */
  code: string;

  /**
   * Full state name (e.g., 'New York', 'California', 'Texas')
   */
  description: string;

  /**
   * Optional country code the state belongs to
   * Usually 'USA' for US states
   */
  countryCode?: string;
}

/**
 * Country DTO
 * Represents a country from the countries lookup
 * Used for international addresses and location data
 */
export interface CountryDto {
  /**
   * Code type identifier (typically 'CNTRY')
   * Optional as some endpoints omit this field
   */
  codeType?: string;

  /**
   * Country code (e.g., 'USA', 'CAN', 'GBR')
   * Max length varies (typically 3 characters)
   */
  code: string;

  /**
   * Full country name (e.g., 'United States', 'Canada', 'United Kingdom')
   */
  description: string;
}

/**
 * Chapter DTO
 * Represents a blood center chapter/organization
 * Used for chapter selection and filtering
 */
export interface ChapterDto {
  /**
   * Unique chapter identifier
   * Max 6 characters
   */
  chapterId: string;

  /**
   * Chapter name
   * Example: 'Dallas Regional Blood Center'
   */
  chapterName: string;

  /**
   * Print header text for the chapter
   * Used in reports and printed documents
   */
  printHdr?: string;

  /**
   * Chapter's timezone identifier
   * Example: 'America/New_York', 'America/Chicago', 'America/Los_Angeles'
   */
  chapterTimezone?: string;

  /**
   * Chapter status (active/inactive)
   * Typically 'A' for active, 'I' for inactive
   */
  status?: string;

  /**
   * Database name associated with the chapter
   */
  databaseName?: string;
}
