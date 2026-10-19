import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NoteItem, NotesConfig, NoteActionEvent } from './notes-manager.interface';

/**
 * Reusable Notes Manager Component
 *
 * Provides a consistent UI for adding, editing, and deleting notes across the application.
 * Features:
 * - Textarea input for adding/editing notes
 * - Card-based display with user information
 * - Edit and delete actions
 * - Empty state handling
 * - Loading state support
 * - Configurable via NotesConfig
 * - WCAG 2.1 accessible
 *
 * @example
 * ```html
 * <app-notes-manager
 *   [notes]="notesList"
 *   [config]="{placeholder: 'Add your notes'}"
 *   [currentUserName]="userName"
 *   (noteAction)="handleNoteAction($event)">
 * </app-notes-manager>
 * ```
 */
@Component({
  selector: 'app-notes-manager',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './notes-manager.html',
  styleUrls: ['./notes-manager.scss']
})
export class NotesManagerComponent {
  /** Array of notes to display */
  @Input() notes: NoteItem[] = [];

  /** Configuration options for the component */
  @Input() config: NotesConfig = {};

  /** Current user's name for new notes */
  @Input() currentUserName?: string;

  /** Read-only mode - disables add/edit/delete */
  @Input() readonly: boolean = false;

  /** Loading state - shows spinner and disables actions */
  @Input() loading: boolean = false;

  /** Emits when a note action (add/update/delete) occurs */
  @Output() noteAction = new EventEmitter<NoteActionEvent>();

  /** Emits when notes array changes (for two-way binding) */
  @Output() notesChange = new EventEmitter<NoteItem[]>();

  /** Local state for textarea input */
  newNoteText = '';

  /** Tracks which note is being edited (null when adding new) */
  editingNoteId: number | string | null = null;

  /** Error message to display */
  errorMessage: string | null = null;

  /**
   * Gets effective configuration with defaults applied
   */
  get effectiveConfig(): Required<NotesConfig> {
    return {
      placeholder: this.config.placeholder ?? 'Add Notes',
      textareaRows: this.config.textareaRows ?? 4,
      maxLength: this.config.maxLength ?? 500,
      showUserInfo: this.config.showUserInfo ?? true,
      allowEdit: this.config.allowEdit ?? true,
      allowDelete: this.config.allowDelete ?? true,
      emptyStateMessage: this.config.emptyStateMessage ?? 'No notes available',
      addButtonText: this.config.addButtonText ?? 'ADD',
      updateButtonText: this.config.updateButtonText ?? 'UPDATE'
    };
  }

  /**
   * Gets the appropriate button text based on edit mode
   */
  getButtonText(): string {
    return this.editingNoteId
      ? this.effectiveConfig.updateButtonText
      : this.effectiveConfig.addButtonText;
  }

  /**
   * Adds a new note or updates an existing one
   */
  addNote(): void {
    const trimmedText = this.newNoteText.trim();

    // Validate: Check if note is empty
    if (!trimmedText) {
      this.errorMessage = 'Error 11034: Note is empty when trying to navigate';
      return;
    }

    // Clear any previous errors
    this.errorMessage = null;

    if (this.editingNoteId !== null) {
      // Update existing note
      const noteToUpdate: NoteItem = {
        id: this.editingNoteId,
        text: trimmedText
      };

      this.noteAction.emit({
        action: 'update',
        note: noteToUpdate,
        index: this.notes.findIndex(n => n.id === this.editingNoteId)
      });

      this.cancelEdit();
    } else {
      // Add new note
      const newNote: NoteItem = {
        id: Date.now(),
        text: trimmedText,
        userName: this.currentUserName,
        timestamp: new Date().toISOString()
      };

      this.noteAction.emit({
        action: 'add',
        note: newNote
      });

      // Clear textarea
      this.newNoteText = '';
    }
  }

  /**
   * Enters edit mode for a specific note
   * @param note The note to edit
   */
  editNote(note: NoteItem): void {
    this.editingNoteId = note.id;
    this.newNoteText = note.text;

    // Scroll textarea into view
    setTimeout(() => {
      const textarea = document.querySelector('.notes-textarea') as HTMLTextAreaElement;
      if (textarea) {
        textarea.focus();
        textarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 0);
  }

  /**
   * Deletes a note
   * @param note The note to delete
   */
  deleteNote(note: NoteItem): void {
    const index = this.notes.findIndex(n => n.id === note.id);

    this.noteAction.emit({
      action: 'delete',
      note,
      index
    });
  }

  /**
   * Cancels edit mode and clears the textarea
   */
  cancelEdit(): void {
    this.editingNoteId = null;
    this.newNoteText = '';
    this.errorMessage = null;
  }

  /**
   * Clears error message when user starts typing
   */
  onNoteInput(): void {
    if (this.errorMessage) {
      this.errorMessage = null;
    }
  }

  /**
   * Extracts user initials from a name
   * @param userName Full name of the user
   * @returns Initials (max 2 characters)
   */
  getUserInitials(userName: string): string {
    if (!userName) {
      return '?';
    }

    const names = userName.trim().split(' ');
    if (names.length === 1) {
      return names[0].substring(0, 2).toUpperCase();
    }

    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  }
}
