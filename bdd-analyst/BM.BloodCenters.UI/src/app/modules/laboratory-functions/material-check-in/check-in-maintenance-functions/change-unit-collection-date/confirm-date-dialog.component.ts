import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface ConfirmDialogData {
  message: string;
}

@Component({
  selector: 'app-confirm-date-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Confirm Date</h2>
    <mat-dialog-content>
      <p>{{ data.message }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="close(false)" type="button">NO, CANCEL</button>
      <button mat-raised-button color="primary" (click)="confirm()" type="button" cdkFocusInitial>YES, CONFIRM</button>
    </mat-dialog-actions>
  `,
  styles: [`
    h2[mat-dialog-title] {
      margin: 0 0 12px 0;
      padding: 0 0 0 20px;
      font-size: 18px;
      font-weight: 600;
      color: #000000;
    }

    mat-dialog-content {
      padding: 0 0 20px 0;
      margin: 0;
    }

    mat-dialog-content p {
      margin: 0;
      font-size: 14px;
      line-height: 1.5;
      color: rgba(0, 0, 0, 0.87);
    }

    mat-dialog-actions {
      padding: 0;
      margin: 0;
      gap: 12px;
    }

    button {
      min-width: 110px;
      height: 36px;
      font-size: 13px;
      font-weight: 500;
      pointer-events: auto;
      cursor: pointer;
    }
  `]
})
export class ConfirmDateDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDateDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {}

  confirm(): void {
    this.dialogRef.close(true);
  }

  close(result: boolean): void {
    this.dialogRef.close(result);
  }
}
