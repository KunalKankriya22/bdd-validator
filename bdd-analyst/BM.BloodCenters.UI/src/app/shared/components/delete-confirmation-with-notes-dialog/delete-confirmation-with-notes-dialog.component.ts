import { Component, Inject } from '@angular/core';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { TextFieldModule } from '@angular/cdk/text-field';

export interface DeleteConfirmationWithNotesDialogData {
  title?: string;
  message?: string;
  noteLabel?: string;
  noteMaxLength?: number;
  notePlaceholder?: string;
  confirmText?: string;
  cancelText?: string;
}

export interface DeleteConfirmationWithNotesDialogResult {
  confirmed: boolean;
  note?: string;
}

/**
 * Delete Confirmation Dialog with Notes Input
 * Shows a confirmation dialog with a required textarea for entering deletion notes.
 * Used for Component Delete and similar operations requiring audit trail.
 */
@Component({
  selector: 'app-delete-confirmation-with-notes-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    TextFieldModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data.title || 'Comments' }}</h2>
    <mat-dialog-content>
      @if (data.message) {
        <p class="dialog-message">{{ data.message }}</p>
      }
      <mat-form-field appearance="fill" class="full-width">
        <mat-label>{{ data.noteLabel || 'Reason for deletion' }}</mat-label>
        <textarea
          matInput
          [formControl]="noteControl"
          [maxLength]="data.noteMaxLength || 240"
          [placeholder]="data.notePlaceholder || 'Enter deletion reason'"
          rows="4"
          cdkTextareaAutosize
          cdkAutosizeMinRows="4"
          cdkAutosizeMaxRows="6">
        </textarea>
        <mat-hint align="end">{{ noteControl.value?.length || 0 }}/{{ data.noteMaxLength || 240 }}</mat-hint>
        @if (noteControl.hasError('required')) {
          <mat-error>Deletion reason is required</mat-error>
        }
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-stroked-button (click)="onCancel()">
        {{ data.cancelText || 'CANCEL' }}
      </button>
      <button
        mat-raised-button
        color="primary"
        (click)="onConfirm()"
        [disabled]="noteControl.invalid">
        {{ data.confirmText || 'ACCEPT' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-message {
      margin-bottom: 16px;
      color: rgba(0, 0, 0, 0.6);
    }
    .full-width {
      width: 100%;
    }
  `]
})
export class DeleteConfirmationWithNotesDialogComponent {
  noteControl = new FormControl('', [
    Validators.required,
    Validators.maxLength(240)
  ]);

  constructor(
    public dialogRef: MatDialogRef<DeleteConfirmationWithNotesDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DeleteConfirmationWithNotesDialogData
  ) {}

  onCancel(): void {
    this.dialogRef.close({ confirmed: false } as DeleteConfirmationWithNotesDialogResult);
  }

  onConfirm(): void {
    if (this.noteControl.valid) {
      this.dialogRef.close({
        confirmed: true,
        note: this.noteControl.value || undefined
      } as DeleteConfirmationWithNotesDialogResult);
    }
  }
}
