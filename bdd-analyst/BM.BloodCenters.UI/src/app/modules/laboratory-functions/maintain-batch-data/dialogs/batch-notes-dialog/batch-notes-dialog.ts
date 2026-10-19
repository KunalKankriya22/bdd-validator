import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import {
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export interface BatchNotesDialogData {
  noteText: string | null;
}

@Component({
  selector: 'app-batch-notes-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <h2 mat-dialog-title>Notes</h2>
      </div>
      <hr class="header-divider" />

      <div class="dialog-content">
        <mat-form-field appearance="fill" class="notes-field">
          <mat-label>Notes</mat-label>
          <textarea
            matInput
            [formControl]="noteControl"
            rows="6"
            maxlength="240"
            aria-label="Batch notes"
          ></textarea>
          <mat-hint align="end"
            >{{ noteControl.value?.length || 0 }}/240</mat-hint
          >
        </mat-form-field>
      </div>

      <div class="dialog-footer">
        <button mat-button class="cancel-btn" (click)="onCancel()">
          CANCEL
        </button>
        <button
          mat-flat-button
          color="primary"
          class="save-btn"
          (click)="onSave()"
        >
          SAVE
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .dialog-container {
        display: flex;
        flex-direction: column;
      }

      .dialog-header {
        padding: 24px 24px 0;

        h2 {
          margin: 0;
          font-size: 20px;
          font-weight: 500;
          color: #1d1b20;
        }
      }

      .header-divider {
        border: none;
        border-top: 1px solid #e0e0e0;
        margin: 16px 0 0;
      }

      .dialog-content {
        padding: 24px;
      }

      .notes-field {
        width: 100%;

        textarea {
          resize: vertical;
        }
      }

      .dialog-footer {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        padding: 8px 24px 16px;
        border-top: 1px solid #e0e0e0;
      }

      .cancel-btn {
        color: #228189;
      }

      .save-btn {
        background-color: #228189;
      }
    `,
  ],
})
export class BatchNotesDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<BatchNotesDialogComponent>);
  readonly data = inject<BatchNotesDialogData>(MAT_DIALOG_DATA);

  noteControl = new FormControl(this.data.noteText || '');

  onSave(): void {
    this.dialogRef.close(this.noteControl.value?.trim() || '');
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}
