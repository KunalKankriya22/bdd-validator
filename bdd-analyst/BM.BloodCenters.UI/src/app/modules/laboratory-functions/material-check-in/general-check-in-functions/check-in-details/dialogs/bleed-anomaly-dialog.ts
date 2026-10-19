import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface BleedAnomalyDialogData {
  message: string;
}

export interface BleedAnomalyDialogResult {
  proceed: boolean;
}

/**
 * Bleed Anomaly Warning Dialog
 * Shown when bleed time is anomalous (too long or end <= start).
 * YES => proceed with interdiction + commit
 * NO  => return to bleed start time field
 */
@Component({
  selector: 'app-bleed-anomaly-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="bleed-anomaly-dialog" role="alertdialog" aria-labelledby="anomaly-title" aria-describedby="anomaly-message">
      <div class="dialog-header">
        <mat-icon class="dialog-icon" aria-hidden="true">warning</mat-icon>
        <h2 id="anomaly-title" class="dialog-title">Bleed Time Warning</h2>
      </div>
      <div class="dialog-content">
        <p id="anomaly-message" class="dialog-message">{{ data.message }}</p>
        <p class="dialog-question">Do you want to proceed with this bleed time?</p>
      </div>
      <div class="dialog-actions" role="group" aria-label="Dialog actions">
        <button mat-button type="button" (click)="onNo()" aria-label="No, return to bleed start time">
          NO
        </button>
        <button mat-raised-button color="warn" type="button" (click)="onYes()" aria-label="Yes, proceed with anomalous bleed time">
          YES
        </button>
      </div>
    </div>
  `,
  styles: [`
    .bleed-anomaly-dialog {
      padding: 0;
      min-width: 380px;
      max-width: 480px;
    }

    .dialog-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 20px 24px 12px;
      border-bottom: 1px solid rgba(0,0,0,0.12);
    }

    .dialog-icon {
      color: #F57C00;
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    .dialog-title {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: rgba(0,0,0,0.87);
    }

    .dialog-content {
      padding: 16px 24px;
    }

    .dialog-message {
      margin: 0 0 8px;
      font-size: 14px;
      color: rgba(0,0,0,0.7);
      line-height: 1.5;
    }

    .dialog-question {
      margin: 0;
      font-size: 14px;
      font-weight: 500;
      color: rgba(0,0,0,0.87);
    }

    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      padding: 8px 16px 16px;
    }
  `],
})
export class BleedAnomalyDialogComponent {
  readonly data = inject<BleedAnomalyDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<BleedAnomalyDialogComponent>);

  onYes(): void {
    const result: BleedAnomalyDialogResult = { proceed: true };
    this.dialogRef.close(result);
  }

  onNo(): void {
    const result: BleedAnomalyDialogResult = { proceed: false };
    this.dialogRef.close(result);
  }
}
