import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-confirm-non-acceptable-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Confirm Non-Acceptable Values</h2>
    <mat-dialog-content>
      <p class="message">There are values marked as <strong>Not Acceptable</strong>.</p>
      <p class="detail">This action cannot be undone. If you continue, the results for this specific test in the batch will be voided.</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="close(false)" type="button">CANCEL</button>
      <button mat-raised-button color="primary" (click)="confirm()" type="button" cdkFocusInitial>CONFIRM BATCH</button>
    </mat-dialog-actions>
  `,
  styles: [`
    h2[mat-dialog-title] {
      padding: 24px 24px 0 24px;
      margin: 0;
      font-size: 20px;
      font-weight: 500;
    }

    mat-dialog-content {
      padding: 16px 24px;
      margin: 0;
      min-width: 400px;
    }

    mat-dialog-content p {
      margin: 0 0 16px 0;
      font-size: 14px;
      line-height: 1.5;
      color: rgba(0, 0, 0, 0.87);
    }

    mat-dialog-content p:last-child {
      margin-bottom: 0;
    }

    .message strong {
      font-weight: 600;
    }

    mat-dialog-actions {
      padding: 0 24px 24px 24px;
      margin: 0;
      gap: 12px;
    }

    button {
      min-width: 100px;
      height: 36px;
      font-size: 13px;
      font-weight: 500;
      text-transform: uppercase;
    }
  `]
})
export class ConfirmNonAcceptableDialogComponent {
  constructor(public dialogRef: MatDialogRef<ConfirmNonAcceptableDialogComponent>) {}

  confirm(): void {
    this.dialogRef.close(true);
  }

  close(result: boolean): void {
    this.dialogRef.close(result);
  }
}
