/**
 * Interface definitions for NotesManager component
 * Provides type safety for notes data and configuration
 */

/**
 * Represents a single note item
 */
export interface NoteItem {
  /** Unique identifier for the note */
  id: number | string;

  /** The text content of the note */
  text: string;

  /** Optional: Name of the user who created the note */
  userName?: string;

  /** Optional: User initials for avatar display */
  userInitials?: string;

  /** Optional: Timestamp when note was created/modified */
  timestamp?: string;

  /** Optional: Version information (e.g., "1B | 4-Apr-2026") */
  version?: string;

  /** Optional: Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Configuration options for NotesManager component
 */
export interface NotesConfig {
  /** Placeholder text for textarea (default: "Add Notes") */
  placeholder?: string;

  /** Number of rows for textarea (default: 4) */
  textareaRows?: number;

  /** Maximum character length for notes (default: 500) */
  maxLength?: number;

  /** Show user info in note cards (default: true) */
  showUserInfo?: boolean;

  /** Allow editing notes (default: true) */
  allowEdit?: boolean;

  /** Allow deleting notes (default: true) */
  allowDelete?: boolean;

  /** Message shown when no notes exist (default: "No notes available") */
  emptyStateMessage?: string;

  /** Text for add button (default: "ADD") */
  addButtonText?: string;

  /** Text for update button (default: "UPDATE") */
  updateButtonText?: string;
}

/**
 * Event emitted when a note action occurs
 */
export interface NoteActionEvent {
  /** The type of action performed */
  action: 'add' | 'update' | 'delete';

  /** The note item involved in the action */
  note: NoteItem;

  /** Optional: Index of the note in the array (for update/delete) */
  index?: number;
}
