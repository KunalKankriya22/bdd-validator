import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import moment from 'moment';

import { DonorInterdiction } from '../models/maintain-donor-interdiction.models';

export interface ViewInterdictionDialogData {
  interdiction: DonorInterdiction;
}

@Component({
  selector: 'app-view-interdiction-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="side-panel" role="dialog" aria-modal="true" aria-labelledby="view-interdiction-title">
      <!-- Header -->
      <div class="panel-header">
        <h2 id="view-interdiction-title">Interdiction Details</h2>
        <button mat-icon-button (click)="onClose()" aria-label="Close">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Body -->
      <div class="panel-body">
        <div class="panel-form">

          <!-- Row 1: Code (20%) + Description (80%) -->
          <div class="form-row">
            <div class="form-col col-20">
              <div class="readonly-field">
                <span class="readonly-label">Code</span>
                <span class="readonly-value">{{ data.interdiction.interCode }}</span>
              </div>
            </div>
            <div class="form-col col-80">
              <div class="readonly-field">
                <span class="readonly-label">Description</span>
                <span class="readonly-value">{{ data.interdiction.interDesc || '-' }}</span>
              </div>
            </div>
          </div>

          <!-- Row 2: Type (50%) + Unit ID (50%) -->
          <div class="form-row">
            <div class="form-col col-50">
              <div class="readonly-field">
                <span class="readonly-label">Type</span>
                <span class="readonly-value">{{ data.interdiction.interType }}</span>
              </div>
            </div>
            <div class="form-col col-50">
              <div class="readonly-field">
                <span class="readonly-label">Unit ID</span>
                <span class="readonly-value">{{ data.interdiction.unitId || '-' }}</span>
              </div>
            </div>
          </div>

          <!-- Row 3: Collection Date (50%) + empty -->
          <div class="form-row">
            <div class="form-col col-50">
              <div class="readonly-field">
                <span class="readonly-label">Collection Date</span>
                <span class="readonly-value">{{ formatDate(data.interdiction.collDate) }}</span>
              </div>
            </div>
            <div class="form-col col-50"></div>
          </div>

          <!-- Row 4: Effective Date (50%) + Termination Date (50%) -->
          <div class="form-row">
            <div class="form-col col-50">
              <div class="readonly-field">
                <span class="readonly-label">Effective Date</span>
                <span class="readonly-value">{{ formatDate(data.interdiction.effDate) }}</span>
              </div>
            </div>
            <div class="form-col col-50">
              <div class="readonly-field">
                <span class="readonly-label">Termination Date</span>
                <span class="readonly-value">{{ formatDate(data.interdiction.termDate) }}</span>
              </div>
            </div>
          </div>

          <!-- Row 5: Term Reason (50%) + empty -->
          @if (data.interdiction.termReason) {
          <div class="form-row">
            <div class="form-col col-50">
              <div class="readonly-field">
                <span class="readonly-label">Termination Reason</span>
                <span class="readonly-value">{{ data.interdiction.termReason }}</span>
              </div>
            </div>
            <div class="form-col col-50"></div>
          </div>
          }

          <!-- Row 6: User ID (50%) + empty -->
          <div class="form-row">
            <div class="form-col col-50">
              <div class="readonly-field">
                <span class="readonly-label">User ID</span>
                <span class="readonly-value">{{ data.interdiction.insertUser || '-' }}</span>
              </div>
            </div>
            <div class="form-col col-50"></div>
          </div>

          <!-- Row 6: Comments (100%) -->
          <div class="form-row">
            <div class="form-col col-100">
              <div class="readonly-field">
                <span class="readonly-label">Comments</span>
                <span class="readonly-value comments-value">{{ data.interdiction.notes || '-' }}</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      <!-- Footer -->
      <div class="panel-footer">
        <button mat-stroked-button type="button" (click)="onClose()" class="close-button">
          CLOSE
        </button>
      </div>
    </div>
  `,
  styles: [`
    .side-panel {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: #ffffff;
      overflow: hidden;
    }

    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 24px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.12);
      flex-shrink: 0;

      h2 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: rgba(0, 0, 0, 0.87);
      }

      button[mat-icon-button] {
        background: transparent;

        &:hover {
          background-color: rgba(0, 0, 0, 0.04);
        }

        ::ng-deep .mat-mdc-button-persistent-ripple,
        ::ng-deep .mat-mdc-focus-indicator {
          display: none;
        }
      }
    }

    .panel-body {
      flex: 1 1 0;
      overflow-y: auto;
      padding: 16px 24px;
      min-height: 0;
    }

    .panel-form {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .form-row {
      display: flex;
      gap: 16px;
      align-items: flex-start;
    }

    .form-col {
      display: flex;
      flex-direction: column;
    }

    .col-20 { flex: 0 0 20%; max-width: 20%; }
    .col-50 { flex: 0 0 calc(50% - 8px); max-width: calc(50% - 8px); }
    .col-80 { flex: 0 0 calc(80% - 16px); max-width: calc(80% - 16px); }
    .col-100 { flex: 0 0 100%; max-width: 100%; }

    .readonly-field {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 8px 0;
      min-height: 56px;
      justify-content: center;
    }

    .readonly-label {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.6);
      font-weight: 500;
    }

    .readonly-value {
      font-size: 14px;
      color: rgba(0, 0, 0, 0.87);
      font-weight: 400;
    }

    .comments-value {
      white-space: pre-wrap;
      word-break: break-word;
    }

    .panel-footer {
      display: flex;
      justify-content: flex-end;
      padding: 16px 24px;
      border-top: 1px solid rgba(0, 0, 0, 0.12);
      flex-shrink: 0;
    }

    .close-button {
      color: #228189;
      border-color: #228189;
      font-weight: 500;
    }
  `]
})
export class ViewInterdictionDialogComponent {
  readonly data = inject<ViewInterdictionDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<ViewInterdictionDialogComponent>);

  onClose(): void {
    this.dialogRef.close();
  }

  formatDate(dateString: string | null | undefined): string {
    if (!dateString) return '-';
    const m = moment(dateString, 'YYYY-MM-DD');
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : dateString;
  }
}
