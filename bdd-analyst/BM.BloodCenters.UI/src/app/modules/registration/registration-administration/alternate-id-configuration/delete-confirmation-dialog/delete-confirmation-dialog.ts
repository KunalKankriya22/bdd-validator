import { Component, Inject } from '@angular/core';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface DeleteConfirmationDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

@Component({
  selector: 'app-delete-confirmation-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title class="dialog-title">{{ data.title }}</h2>
    <mat-dialog-content class="dialog-content">
      <p class="dialog-message">{{ data.message }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end" class="dialog-actions">
      <button mat-button class="cancel-btn" (click)="onCancel()">
        {{ data.cancelText || 'NO, CANCEL' }}
      </button>
      <button mat-raised-button class="confirm-btn" (click)="onConfirm()">
        {{ data.confirmText || 'YES, DELETE' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    :host {
      display: block;
      font-family: 'Roboto', sans-serif;
    }

    .dialog-title {
      font-size: 20px;
      font-weight: 500;
      color: #1D1B20;
      margin: 0 0 12px;
      padding: 24px 24px 0;
      line-height: 1.4;
    }

    .dialog-content {
      padding: 12px 24px 8px;
      max-width: 340px;
    }

    .dialog-message {
      font-size: 14px;
      color: rgba(0, 0, 0, 0.6);
      line-height: 1.5;
      margin: 0;
    }

    .dialog-actions {
      padding: 8px 16px 16px;
      gap: 4px;
    }

    .cancel-btn {
      color: #228189;
      font-weight: 500;
      font-size: 14px;
      letter-spacing: 0.5px;
      background: transparent;
      box-shadow: none;
    }

    .confirm-btn {
      background-color: #228189;
      color: #ffffff;
      font-weight: 500;
      font-size: 14px;
      letter-spacing: 0.5px;

      &:hover:not(:disabled) {
        background-color: #1a6670;
      }
    }
  `]
})
export class DeleteConfirmationDialog {
  constructor(
    public dialogRef: MatDialogRef<DeleteConfirmationDialog>,
    @Inject(MAT_DIALOG_DATA) public data: DeleteConfirmationDialogData
  ) {}

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
