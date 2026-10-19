import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-visual-check-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
  ],
  template: `
    <div class="visual-check-dialog">
      <div class="dialog-header">
        <div class="dialog-title-group">
          <h1 mat-dialog-title class="dialog-title">Visual Check</h1>
          <p class="dialog-subtitle">Has the unit been visually checked?</p>
        </div>
        <button class="close-btn" (click)="onNo()" aria-label="Close">
          <mat-icon aria-hidden="true">close</mat-icon>
        </button>
      </div>

      <hr class="dialog-divider" aria-hidden="true" />
      <mat-dialog-content>
        <p class="dialog-message">
          Confirm that the unit has been visually inspected before proceeding with the return.
        </p>
      </mat-dialog-content>

      <hr class="dialog-divider" aria-hidden="true" />
      <mat-dialog-actions align="end">
        <button mat-button class="btn-no" (click)="onNo()">NO</button>
        <button mat-flat-button class="btn-yes" (click)="onYes()">YES</button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .visual-check-dialog {
      max-width: 100%;
    }

    .dialog-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      padding: 16px 16px 16px;
      gap: 16px;
    }

    .dialog-title-group { flex: 1; }

    .dialog-title {
      font-family: Roboto, sans-serif;
      font-size: 20px;
      font-weight: 500;
      color: #1D1B20;
      margin: 0 0 4px;
      line-height: 28px;
    }

    .dialog-subtitle {
      font-family: Roboto, sans-serif;
      font-size: 14px;
      font-weight: 400;
      color: #49454F;
      margin: 0;
      line-height: 20px;
    }

    .close-btn {
      color: #49454F;
      width: 24px;
      height: 24px;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      background: none;
      border: none;
      cursor: pointer;

      .mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      &:hover { color: #1D1B20; }
    }

    .dialog-divider {
      border: none;
      border-top: 1px solid #E0E0E0;
      margin: 0;
    }

    .dialog-body { padding: 16px 36px; }

    .dialog-message {
      font-family: Roboto, sans-serif;
      font-size: 14px;
      font-weight: 400;
      color: #49454F;
      line-height: 20px;
      margin: 0;
    }

    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 8px;
      padding: 16px 24px 24px;
    }

    .btn-no {
      font-family: Roboto, sans-serif;
      font-weight: 500;
      font-size: 14px;
      color: #228189;
    }

    .btn-yes {
      font-family: Roboto, sans-serif;
      font-weight: 500;
      font-size: 14px;
      background: #228189 !important;
      color: #FFFFFF !important;
      border-radius: 4px;
      padding: 0 24px;
    }
  `],
})
export class VisualCheckDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<VisualCheckDialogComponent>,
  ) {}

  onNo(): void {
    this.dialogRef.close({ checked: false });
  }

  onYes(): void {
    this.dialogRef.close({ checked: true });
  }
}
