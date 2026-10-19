import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface StaffCalculationResult {
  staffRequired: number;
  totalHours: number;
  efficiencyRange: number;
  projectedShow: number;
}

@Component({
  selector: 'app-staff-calculation-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="staff-calculation-dialog">
      <div class="dialog-header">
        <h2 mat-dialog-title>Staff Calculation Result</h2>
        <button mat-icon-button class="close-button" (click)="close()" aria-label="Close dialog">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-dialog-content>
        <div class="calculation-result">
          <div class="result-card">
            <div class="result-main">
              <div class="result-label">Staff Required</div>
              <div class="result-value">{{ data.staffRequired }}</div>
            </div>
            <div class="result-details">
              <div class="detail-item">
                <span class="detail-label">Total Hours:</span>
                <span class="detail-value">{{ data.totalHours | number: '1.2-2' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Projected Show:</span>
                <span class="detail-value">{{ data.projectedShow }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Efficiency Range:</span>
                <span class="detail-value">{{ data.efficiencyRange }}</span>
              </div>
            </div>
          </div>
          <div class="formula-info">
            <div class="formula-title">Calculation Formula:</div>
            <div class="formula-text">Staff Required = ROUND((Projected Show / Total Hours) / Efficiency Range)</div>
            <div class="formula-note">Minimum of 1 if Projected Show > 0</div>
          </div>
        </div>
      </mat-dialog-content>

      <div class="dialog-footer">
        <button mat-raised-button color="primary" (click)="close()">
          CLOSE
        </button>
      </div>
    </div>
  `,
  styles: [`
    .staff-calculation-dialog {
      min-width: 450px;
      display: flex;
      flex-direction: column;

      .dialog-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px 24px;
        border-bottom: 1px solid #e0e0e0;
        flex-shrink: 0;

        h2 {
          margin: 0;
          font-size: 18px;
          font-weight: 500;
          color: #081620;
        }

        .close-button {
          margin-right: -12px;
        }
      }

      mat-dialog-content {
        padding: 24px;
      }

      .dialog-footer {
        padding: 16px 24px;
        border-top: 1px solid #e0e0e0;
        display: flex;
        justify-content: flex-end;
        gap: 12px;
      }

      .calculation-result {
        display: flex;
        flex-direction: column;
        gap: 24px;
      }

      .result-card {
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        padding: 24px;
        background: #f9fafb;

        .result-main {
          text-align: center;
          margin-bottom: 24px;
          padding-bottom: 24px;
          border-bottom: 1px solid #e0e0e0;

          .result-label {
            font-size: 14px;
            color: #666;
            margin-bottom: 8px;
          }

          .result-value {
            font-size: 48px;
            font-weight: 600;
            color: #1976d2;
          }
        }

        .result-details {
          display: flex;
          flex-direction: column;
          gap: 12px;

          .detail-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 12px;
            background: white;
            border-radius: 4px;

            .detail-label {
              font-size: 14px;
              color: #666;
            }

            .detail-value {
              font-size: 16px;
              font-weight: 500;
              color: #081620;
            }
          }
        }
      }

      .formula-info {
        padding: 16px;
        background: #e3f2fd;
        border-radius: 4px;
        border-left: 4px solid #1976d2;

        .formula-title {
          font-size: 13px;
          font-weight: 500;
          color: #1976d2;
          margin-bottom: 8px;
        }

        .formula-text {
          font-size: 13px;
          color: #333;
          font-family: 'Courier New', monospace;
          margin-bottom: 4px;
        }

        .formula-note {
          font-size: 12px;
          color: #666;
          font-style: italic;
        }
      }
    }
  `]
})
export class StaffCalculationDialog {
  constructor(
    public dialogRef: MatDialogRef<StaffCalculationDialog>,
    @Inject(MAT_DIALOG_DATA) public data: StaffCalculationResult
  ) {}

  close(): void {
    this.dialogRef.close();
  }
}
