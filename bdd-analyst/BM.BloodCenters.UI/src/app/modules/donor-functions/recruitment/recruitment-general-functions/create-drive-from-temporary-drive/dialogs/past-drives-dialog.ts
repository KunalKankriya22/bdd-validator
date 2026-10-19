import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface PastDrive {
  driveId: string;
  driveDate: string;
  projectedShow: number;
  projectedDraw: number;
  locationName: string;
  actualShow: number;
  actualDraw: number;
  deferralPercentage: number;
}

export interface PastDrivesDialogData {
  sponsorId: string;
  sponsorName: string;
  drives: PastDrive[];
}

@Component({
  selector: 'app-past-drives-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="past-drives-dialog">
      <div class="dialog-header">
        <h2 mat-dialog-title>Past Drives - {{ data.sponsorName }}</h2>
        <button mat-icon-button class="close-button" (click)="close()" aria-label="Close dialog">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-dialog-content>
        <div class="drives-list">
          <div class="drive-card" *ngFor="let drive of data.drives">
            <div class="drive-header">
              <div class="drive-id">{{ drive.driveId }}</div>
              <div class="drive-status">Completed</div>
            </div>
            <div class="drive-time">{{ formatDriveTime(drive.driveDate) }}</div>
            <div class="drive-metrics">
              <div class="metric-col">
                <div class="metric-item">
                  <div class="metric-label">Projected SHOW</div>
                  <div class="metric-value">{{ drive.projectedShow }}</div>
                </div>
                <div class="metric-item">
                  <div class="metric-label">Actual Draw</div>
                  <div class="metric-value">{{ drive.actualDraw }}</div>
                </div>
              </div>
              <div class="metric-col">
                <div class="metric-item">
                  <div class="metric-label">Projected DRAW</div>
                  <div class="metric-value">{{ drive.projectedDraw }}</div>
                </div>
                <div class="metric-item">
                  <div class="metric-label">Actual Deferral%</div>
                  <div class="metric-value">{{ drive.deferralPercentage }}%</div>
                </div>
              </div>
              <div class="metric-col">
                <div class="metric-item">
                  <div class="metric-label">Actual SHOW</div>
                  <div class="metric-value">{{ drive.actualShow }}</div>
                </div>
              </div>
            </div>
          </div>

          <div *ngIf="data.drives.length === 0" class="no-drives">
            No past drives found for this sponsor.
          </div>
        </div>
      </mat-dialog-content>
    </div>
  `,
  styles: [`
    .past-drives-dialog {
      width: 80%;
      max-width: 500px;
      display: flex;
      flex-direction: column;

      .dialog-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        border-bottom: 1px solid #E0E0E0;

        h2 {
          margin: 0;
          font-family: Roboto;
          font-size: 16px;
          font-weight: 500;
          color: #081620;
        }

        .close-button {
          width: 24px;
          height: 24px;
          padding: 0;

          mat-icon {
            font-size: 20px;
            width: 20px;
            height: 20px;
            line-height: 20px;
          }
        }
      }

      mat-dialog-content {
        padding: 0;
        overflow-y: auto;
        max-height: 100%;
      }

      .drives-list {
        display: flex;
        flex-direction: column;
        max-height: 100%;
        max-width: 100%;
      }

      .drive-card {
        padding: 16px 20px;
        border: 1px solid #E0E0E0;
         border-radius: 8px;
        background: white;
        margin-bottom: 12px;
        margin-left:12px;

        &:hover {
          background: #FAFAFA;
        }
          
      }

      .drive-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 4px;
      }

      .drive-id {
        font-family: Roboto;
        font-size: 14px;
        font-weight: 500;
        color: #081620;
      }

      .drive-status {
        padding: 2px 8px;
        background: #E8F5E9;
        border-radius: 4px;
        font-family: Roboto;
        font-size: 11px;
        font-weight: 400;
        color: #2E7D32;
      }

      .drive-time {
        font-family: Roboto;
        font-size: 11px;
        font-weight: 400;
        color: #6B7280;
        margin-bottom: 12px;
      }

      .drive-metrics {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 16px;
      }

      .metric-col {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .metric-item {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .metric-label {
        font-family: Roboto;
        font-size: 11px;
        font-weight: 400;
        color: #6B7280;
        white-space: nowrap;
      }

      .metric-value {
        font-family: Roboto;
        font-size: 14px;
        font-weight: 400;
        color: #081620;
      }

      .no-drives {
        padding: 40px 20px;
        text-align: center;
        color: #9E9E9E;
        font-family: Roboto;
        font-size: 14px;
        font-weight: 400;
      }
    }
  `]
})
export class PastDrivesDialog {
  constructor(
    public dialogRef: MatDialogRef<PastDrivesDialog>,
    @Inject(MAT_DIALOG_DATA) public data: PastDrivesDialogData
  ) {}

  close(): void {
    this.dialogRef.close();
  }

  formatDriveTime(driveDate: string): string {
    if (!driveDate) return '';

    try {
      const date = new Date(driveDate);
      const day = date.getDate().toString().padStart(2, '0');
      const month = date.toLocaleString('en-US', { month: 'short' });
      const year = date.getFullYear();

      return `${day}-${month.toUpperCase()}-${year}`;
    } catch {
      return driveDate;
    }
  }
}
