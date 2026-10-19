import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-priority-error-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule
  ],
  template: `
    <div class="priority-dialog" role="alertdialog" aria-modal="true" aria-labelledby="priority-error-title">
      <h2 id="priority-error-title" class="priority-dialog__title">Unable to Verify Priority</h2>
      <div class="priority-dialog__content">
        <p>
          Could not verify if this priority sequence is already in use.
          Would you like to save anyway? Existing priorities will be shifted if needed.
        </p>
      </div>
      <div class="priority-dialog__actions">
        <button mat-button type="button" class="priority-dialog__cancel-btn"
          (click)="onCancel()" aria-label="Cancel">
          CANCEL
        </button>
        <button mat-raised-button type="button" class="priority-dialog__confirm-btn"
          (click)="onProceed()" aria-label="Save anyway">
          SAVE ANYWAY
        </button>
      </div>
    </div>
  `,
  styleUrls: ['./priority-confirmation-dialog.scss']
})
export class PriorityErrorDialog {
  constructor(private dialogRef: MatDialogRef<PriorityErrorDialog>) {}

  onCancel(): void {
    this.dialogRef.close();
  }

  onProceed(): void {
    this.dialogRef.close('proceed');
  }
}
