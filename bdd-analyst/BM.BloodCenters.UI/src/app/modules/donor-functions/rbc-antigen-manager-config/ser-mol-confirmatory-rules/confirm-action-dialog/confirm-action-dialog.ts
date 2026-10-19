import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface ConfirmActionDialogData {
  title: string;
  message: string;
  confirmLabel: string;
}

@Component({
  selector: 'app-confirm-action-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <p>{{ data.message }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button class="cancel-btn" (click)="onCancel()">CANCEL</button>
      <button mat-raised-button class="confirm-btn" (click)="onConfirm()">{{ data.confirmLabel }}</button>
    </mat-dialog-actions>
  `,
  styles: [`
    h2[mat-dialog-title] {
      font-family: 'Roboto', sans-serif;
      font-size: 18px;
      font-weight: 500;
      color: #1a1a1a;
      margin: 0;
      padding: 24px 24px 8px;
    }
    mat-dialog-content p {
      font-family: 'Roboto', sans-serif;
      font-size: 14px;
      color: #666;
      line-height: 20px;
      margin: 0;
    }
    mat-dialog-actions {
      padding: 16px 24px 24px;
      gap: 8px;
    }
    .cancel-btn {
      color: #228189 !important;
      font-family: 'Roboto', sans-serif;
      font-weight: 500;
    }
    .confirm-btn {
      background-color: #228189 !important;
      color: #ffffff !important;
      font-family: 'Roboto', sans-serif;
      font-weight: 500;
      height: 40px;
      padding: 0 24px;
    }
  `],
})
export class ConfirmActionDialogComponent {
  constructor(
    public readonly dialogRef: MatDialogRef<ConfirmActionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public readonly data: ConfirmActionDialogData,
  ) {}

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
