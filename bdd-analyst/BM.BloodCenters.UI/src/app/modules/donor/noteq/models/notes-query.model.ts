/**
 * Notes Query Models
 * Generated from API documentation: notesquery-api-documentation.md
 * JIRA: MLT-11886
 * Mnemonic: NOTEQ
 */

/**
 * Request DTO for notes query search
 * POST /api/v1/notes-query/search
 */
export interface NotesQueryRequestDto {
  /** From date for the query range (inclusive) - Required */
  fromDate: string;
  /** To date for the query range (inclusive) - Required, must be >= fromDate */
  toDate: string;
  /** Filter by specific user - Optional */
  userId?: string;
  /** Filter by specific program - Optional */
  programId?: string;
  /** Column to sort by - Optional (InsertUser | ProgramId | NoteId) */
  sortColumn?: string;
  /** Sort direction - Optional (ASC | DESC) */
  sortOrder?: string;
  /** Number of records to return - Default: 25 */
  take?: number;
  /** Number of records to skip for pagination - Default: 0 */
  skip?: number;
}

/**
 * Response DTO from notes query search
 */
export interface NotesQueryResponseDto {
  /** List of notes matching criteria */
  notes: NoteResultDto[];
  /** Summary of note counts by user */
  userCounts: UserNoteCountDto[];
  /** Summary of note counts by program */
  programCounts: ProgramNoteCountDto[];
  /** Total number of notes found */
  totalNotes: number;
  /** Total count for pagination */
  totalCount: number;
}

/**
 * Individual note result
 */
export interface NoteResultDto {
  /** User who created the note */
  insertUser: string;
  /** Program that created the note */
  programId: string;
  /** Note identifier */
  noteId: string;
  /** Sequence number */
  noteSequence: number;
  /** Note text content (max 240 chars) - Nullable */
  note: string | null;
  /** Date when note was created */
  insertDate: string;
  /** User's full name (formatted as LAST, FIRST MIDDLE) - Nullable */
  userName: string | null;
  /** Formatted date string (MM-DD-YYYY HH:MI:SS) - Nullable */
  formattedDate: string | null;
}

/**
 * User note count summary
 */
export interface UserNoteCountDto {
  /** User ID */
  userId: string;
  /** Number of notes created by this user */
  count: number;
}

/**
 * Program note count summary
 */
export interface ProgramNoteCountDto {
  /** Program ID */
  programId: string;
  /** Number of notes created by this program */
  count: number;
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  item?: T;
  errorCode?: string;
  errorResponse?: {
    errorCode: string;
    error: string;
  };
}

/**
 * Sort column options
 */
export type SortColumn = 'InsertUser' | 'ProgramId' | 'NoteId' | '';

/**
 * Sort order options
 */
export type SortOrder = 'ASC' | 'DESC' | '';

/**
 * Request DTO for Users LOV
 * POST /api/v1/notes-query/users
 */
export interface UsersLovRequestDto {
  fromDate: string;
  toDate: string;
}

/**
 * Request DTO for Programs LOV
 * POST /api/v1/notes-query/programs
 */
export interface ProgramsLovRequestDto {
  fromDate: string;
  toDate: string;
  userId?: string;
}

/**
 * User LOV item from the Users LOV API
 */
export interface UserLovItemDto {
  userId: string;
  name: string;
}

/**
 * Program LOV item from the Programs LOV API
 */
export interface ProgramLovItemDto {
  programId: string;
  description: string;
}

/**
 * API Response wrapper for LOV endpoints (uses `data` field)
 */
export interface DataResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T[];
}

/**
 * Dropdown option for User select
 */
export interface UserOption {
  userId: string;
  name?: string;
  count?: number;
}

/**
 * Dropdown option for Program select
 */
export interface ProgramOption {
  programId: string;
  description?: string;
  count?: number;
}
