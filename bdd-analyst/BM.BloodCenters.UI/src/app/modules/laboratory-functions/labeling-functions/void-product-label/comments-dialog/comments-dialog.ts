import { Component, Inject, inject } from '@angular/core';
import {
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { TextFieldModule } from '@angular/cdk/text-field';

/**
 * Data interface for Comments Dialog
 */
export interface CommentsDialogData {
  /** Dialog title (default: "Comments") */
  title?: string;

  /** Existing comment text (for editing) */
  comment?: string;

  /** Maximum character length (default: 240) */
  maxLength?: number;

  /** Label for the textarea (default: "Comments") */
  label?: string;

  /** Placeholder text (default: "") */
  placeholder?: string;

  /** Submit button text (default: "SUBMIT") */
  submitText?: string;

  /** Cancel button text (default: "CANCEL") */
  cancelText?: string;

  /** Whether the comment is required (default: false) */
  required?: boolean;
}

/**
 * Result interface for Comments Dialog
 */
export interface CommentsDialogResult {
  /** Whether the user submitted or cancelled */
  submitted: boolean;

  /** The entered comment text (if submitted) */
  comment?: string;
}

/**
 * Comments Dialog Component
 *
 * Used in Void Product Label into Hold feature to collect optional notes
 * explaining the void reason.
 *
 * Features:
 * - Textarea with configurable max length (default 240 characters)
 * - Character counter showing remaining characters
 * - Optional or required validation
 * - Auto-resizing textarea
 *
 * From Figma: "Comments" dialog with 240-character limit
 */
@Component({
  selector: 'app-comments-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    ReactiveFormsModule,
    TextFieldModule,
  ],
  templateUrl: './comments-dialog.html',
  styleUrls: ['./comments-dialog.scss'],
})
export class CommentsDialog {
  private static nextId = 0;
  protected readonly componentId = `comments-dialog-${CommentsDialog.nextId++}`;

  // Generate unique IDs for form elements
  protected readonly elementId = (name: string) =>
    `${this.componentId}-${name}`;

  private readonly dialogRef = inject(
    MatDialogRef<CommentsDialog>
  );

  commentControl: FormControl<string | null>;

  constructor(@Inject(MAT_DIALOG_DATA) public data: CommentsDialogData) {
    // Set default values
    this.data = {
      title: 'Comments',
      maxLength: 240,
      label: 'Comments',
      placeholder: '',
      submitText: 'SUBMIT',
      cancelText: 'CANCEL',
      required: false,
      ...data,
    };

    // Initialize form control with validators
    const validators = [Validators.maxLength(this.data.maxLength!)];
    if (this.data.required) {
      validators.push(Validators.required);
    }

    this.commentControl = new FormControl(this.data.comment || '', validators);
  }

  /**
   * Get remaining character count
   */
  get remainingChars(): number {
    const current = this.commentControl.value?.length || 0;
    return this.data.maxLength! - current;
  }

  /**
   * Handle cancel action
   */
  onCancel(): void {
    this.dialogRef.close({
      submitted: false,
    } as CommentsDialogResult);
  }

  /**
   * Handle submit action
   */
  onSubmit(): void {
    if (this.commentControl.valid) {
      this.dialogRef.close({
        submitted: true,
        comment: this.commentControl.value || undefined,
      } as CommentsDialogResult);
    }
  }

  /**
   * Handle Enter key press (submit)
   * Ctrl+Enter to submit from textarea
   */
  onKeyDown(event: KeyboardEvent): void {
    if (event.ctrlKey && event.key === 'Enter') {
      this.onSubmit();
    }
  }
}
