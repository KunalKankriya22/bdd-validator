import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-void-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <div class="void-dialog">
      <h2 class="void-dialog__title">There are values marked as Not Acceptable.</h2>
      <p class="void-dialog__message">
        This action cannot be undone. If you continue, the results for this specific test
        in the batch will be voided.
      </p>
      <div class="void-dialog__actions">
        <button class="btn-cancel" (click)="onCancel()">CANCEL</button>
        <button class="btn-confirm" (click)="onConfirm()">CONFIRM BATCH</button>
      </div>
    </div>
  `,
  styles: [`
    .void-dialog {
      padding: 24px;
      max-width: 480px;
    }
    .void-dialog__title {
      margin: 0 0 16px;
      font-family: Roboto, sans-serif;
      font-size: 20px;
      font-weight: 500;
      color: #1D1B20;
    }
    .void-dialog__message {
      margin: 0 0 24px;
      font-family: Roboto, sans-serif;
      font-size: 14px;
      font-weight: 400;
      line-height: 20px;
      color: #49454F;
    }
    .void-dialog__actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }
    .btn-cancel {
      background: transparent;
      border: none;
      color: #228189;
      font-family: Roboto, sans-serif;
      font-weight: 500;
      font-size: 14px;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
    }
    .btn-cancel:hover { background-color: rgba(34, 129, 137, 0.04); }
    .btn-confirm {
      background: #228189;
      border: none;
      color: #ffffff;
      font-family: Roboto, sans-serif;
      font-weight: 500;
      font-size: 14px;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
    }
    .btn-confirm:hover { background-color: #1a6670; }
  `]
})
export class VoidConfirmDialogComponent {
  constructor(private dialogRef: MatDialogRef<VoidConfirmDialogComponent>) {}

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
