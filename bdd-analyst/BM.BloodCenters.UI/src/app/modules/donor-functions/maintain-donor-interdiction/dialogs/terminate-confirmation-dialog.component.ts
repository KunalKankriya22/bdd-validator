import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-terminate-confirmation-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Interdiction Removal Alert</h2>
    <mat-dialog-content cdkFocusInitial>
      <p>Are you certain you want to remove this Interdiction?</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end" class="dialog-actions">
      <button mat-stroked-button (click)="onNo()" class="cancel-button">NO, CANCEL</button>
      <button mat-raised-button (click)="onYes()" class="confirm-button">YES</button>
    </mat-dialog-actions>
  `,
  styles: [`
    h2 { margin: 0 0 8px; font-size: 20px; font-weight: 500; color: #1a1a1a; }
    p { font-size: 14px; color: rgba(0,0,0,0.87); margin: 0; }
    .dialog-actions {
      gap: 12px;
      padding: 16px 24px;
      border-top: 1px solid #e0e0e0;
    }
    .cancel-button {
      color: #228189;
      border-color: #228189;
      font-weight: 500;
      font-size: 14px;
      letter-spacing: 0.5px;
    }
    .confirm-button {
      background-color: #228189;
      color: #ffffff;
      font-weight: 500;
      font-size: 14px;
      letter-spacing: 0.5px;
    }
    .confirm-button:hover { background-color: #1b6b72; }
  `]
})
export class TerminateConfirmationDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<TerminateConfirmationDialogComponent>);

  onYes(): void {
    this.dialogRef.close(true);
  }

  onNo(): void {
    this.dialogRef.close(false);
  }
}
