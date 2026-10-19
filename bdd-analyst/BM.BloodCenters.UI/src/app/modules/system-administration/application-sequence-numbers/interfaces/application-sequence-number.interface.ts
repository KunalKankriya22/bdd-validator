/**
 * Application Sequence Number Interface
 * Represents a sequence number configuration for business entities
 */
export interface ApplicationSequenceNumber {
  /**
   * Unique identifier for the chapter
   */
  chapterId: string;

  /**
   * Full name of the chapter
   */
  chapterName: string;

  /**
   * Type of number sequence (e.g., GELTUBE_BOX, BATCH_SEQ)
   */
  numberType: string;

  /**
   * Maximum number in the sequence
   */
  maxNumber: number;

  /**
   * Starting number for the sequence (can be null)
   */
  startingNumber: number | null;

  /**
   * Reset cycle code from backend ("D", "Y", "M", or null)
   * Frontend will map this to display strings
   */
  resetCycle: string | null;

  /**
   * Last date when the sequence was reset (can be null)
   */
  lastResetDate: Date | null;
}

/**
 * Filter parameters for Application Sequence Numbers
 * Used in filter modal for client-side filtering
 */
export interface ApplicationSequenceNumberFilterParams {
  /**
   * Filter by chapter ID (null = "All")
   */
  chapterId: string | null;

  /**
   * Filter by chapter name (null = "All")
   */
  chapterName: string | null;

  /**
   * Filter by number type (null = "All")
   */
  numberType: string | null;

  /**
   * Filter by cycle code (null = "All")
   * Values: "D", "Y", "M", or null
   */
  cycle: string | null;
}

/**
 * Request parameters DTO for API calls (matching Valid Product Substitution pattern)
 * Sent in POST body with pagination endpoint
 */
export interface ApplicationSequenceNumberParamsDto {
  /**
   * Search keyword for full-text search
   */
  SearchKeyword?: string;

  /**
   * Filter by chapter ID
   */
  ChapterId?: string;

  /**
   * Filter by chapter name
   */
  ChapterName?: string;

  /**
   * Filter by number type
   */
  NumberType?: string;

  /**
   * Filter by reset cycle
   */
  Cycle?: string;

  /**
   * Sort direction: 'asc' (ascending) or 'desc' (descending)
   */
  Sort?: string;
}
export interface SingleSequenceNumberApiResponse {
  success: boolean;
  message: string;
  statusCode: number;
  item: ApplicationSequenceNumber;
  error?: string;
}

export interface CreateSequenceNumberPayload {
  chapterId: string;
  numberType: string;
  maxNumber: number;
  resetCycle: string | null;
  lastResetDate: string | null;
  startingNumber: number;
}

export interface ChapterLookup {
  chapterId: string;
  chapterName: string;
}

/**
 * Filter dropdown response from backend
 * Contains DISTINCT values for each filterable field
 */
export interface ApplicationSequenceNumberFilterDropdownDto {
  chapterIds: string[];
  chapterNames: string[];
  numberTypes: string[];
  cycles: string[];
}
