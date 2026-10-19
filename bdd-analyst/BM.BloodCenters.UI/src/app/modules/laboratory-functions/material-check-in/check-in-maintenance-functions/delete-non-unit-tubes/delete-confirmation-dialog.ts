import { Component } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-delete-confirmation-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Are you sure you want to delete selected tubes?</h2>
    <mat-dialog-content>
      <p>This action cannot be undone. The record will be permanently removed from the system.</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button class="cancel-action" (click)="onCancel()">CANCEL</button>
      <button mat-raised-button class="delete-action" (click)="onConfirm()">DELETE SELECTION</button>
    </mat-dialog-actions>
  `,
  styles: [`
    h2[mat-dialog-title] {
      font-family: Roboto;
      font-size: 18px;
      font-weight: 500;
      color: #1a1a1a;
      margin: 0;
      padding: 24px 24px 8px;
    }

    mat-dialog-content {
      padding: 0 24px;

      p {
        font-family: Roboto;
        font-size: 14px;
        font-weight: 400;
        color: #666;
        line-height: 20px;
        margin: 0;
      }
    }

    mat-dialog-actions {
      padding: 16px 24px 24px;
      gap: 8px;
    }

    .cancel-action {
      font-family: Roboto;
      font-weight: 500;
      font-size: 14px;
      color: #228189 !important;
    }

    .cancel-action:focus,
    .cancel-action:focus-visible {
      outline: none !important;
      box-shadow: none !important;
      background-color: transparent !important;
    }

    ::ng-deep .cancel-action .mat-mdc-button-persistent-ripple,
    ::ng-deep .cancel-action .mat-ripple {
      display: none !important;
    }

    ::ng-deep .cancel-action .mdc-button__ripple {
      display: none !important;
    }

    .delete-action {
      background-color: #228189 !important;
      color: white !important;
      font-family: Roboto;
      font-weight: 500;
      font-size: 14px;
      border-radius: 4px;
      padding: 0 24px;
      height: 40px;
    }
  `]
})
export class DeleteConfirmationDialogComponent {
  constructor(private dialogRef: MatDialogRef<DeleteConfirmationDialogComponent>) {}

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
