import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface DeleteConfirmDialogData {
  unitId: string;
}

@Component({
  selector: 'app-delete-unit-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>Data Purge</h2>
    <mat-dialog-content>
      <p class="warning-message">
        <strong>Warning:</strong> This action cannot be undone. All data associated with this Unit ID will be permanently removed from the system.
      </p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="close(false)" type="button">NO, CANCEL</button>
      <button mat-raised-button color="primary" (click)="confirm()" type="button" cdkFocusInitial>DELETE DATA</button>
    </mat-dialog-actions>
  `,
  styles: [`
    h2[mat-dialog-title] {
      margin: 0 0 12px 0;
      padding: 0;
      font-family: Roboto, sans-serif;
      font-size: 20px;
      font-weight: 500;
      line-height: 30px;
      letter-spacing: 0px;
      color: #1D1B20;
    }

    mat-dialog-content {
      padding: 0 0 20px 0 !important;
      margin: 0 !important;
    }

    .warning-message {
      margin: 0;
      font-family: Roboto, sans-serif;
      font-size: 14px;
      font-weight: 400;
      line-height: 21px;
      letter-spacing: 0px;
      color: #3F4849;

      strong {
        font-weight: 700;
        color: #3F4849;
      }
    }

    mat-dialog-actions {
      padding: 0;
      margin: 0;
      gap: 12px;
    }

    button {
      height: 36px;
      font-size: 13px;
      font-weight: 500;
      pointer-events: auto;
      cursor: pointer;
      padding: 0 16px;
      min-width: auto;
    }

    button[mat-button] {
      /* NO, CANCEL button (flat) */
      min-width: 111px;
    }

    button[mat-raised-button] {
      /* DELETE DATA button (raised) */
      min-width: 120px;
    }
  `]
})
export class DeleteUnitConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<DeleteUnitConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DeleteConfirmDialogData
  ) {}

  confirm(): void {
    this.dialogRef.close(true);
  }

  close(result: boolean): void {
    this.dialogRef.close(result);
  }
}
