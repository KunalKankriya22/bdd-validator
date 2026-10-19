import { Component, ViewEncapsulation, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig } from '@shared/interfaces/data-table.interface';
import { ReleaseGroupInterdictionUnitInfoDto } from '../models/release-group-interdiction.models';

export interface ViewUnitsDialogData {
  units: ReleaseGroupInterdictionUnitInfoDto[];
  isLoading: boolean;
  formatDate: (value: string | null | undefined) => string;
}

@Component({
  selector: 'app-view-units-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    DataTable,
  ],
  template: `
    <div class="view-units-dialog">
      <div class="dialog-header">
        <h2 id="view-units-dialog-title" class="dialog-title">View Units in this Group</h2>
        <button mat-icon-button (click)="onClose()" class="close-btn" [attr.aria-label]="'Close view units dialog'">
          <mat-icon aria-hidden="true">close</mat-icon>
        </button>
      </div>

      <div class="dialog-content">
        @if (data.isLoading) {
          <div class="loading-container" role="status" aria-live="polite">
            <mat-spinner diameter="32" aria-hidden="true"></mat-spinner>
            <span class="cdk-visually-hidden">Loading units, please wait...</span>
          </div>
        } @else if (data.units.length > 0) {
          <app-data-table
            [config]="tableConfig"
            [data]="data.units"
            [attr.aria-label]="'Units in this group'">
          </app-data-table>
        } @else {
          <p class="empty-text">No units found.</p>
        }
      </div>

      <div class="dialog-footer">
        <button mat-button class="cancel-btn" (click)="onClose()">CANCEL</button>
      </div>
    </div>
  `,
  encapsulation: ViewEncapsulation.None,
  styles: [`
    .cdk-overlay-pane.view-units-side-dialog {
      position: fixed !important;
      top: 56px !important;
      right: 0 !important;
      bottom: 0 !important;
      left: auto !important;
      width: 500px !important;
      max-width: 500px !important;
      height: calc(100vh - 56px) !important;
      max-height: calc(100vh - 56px) !important;
      margin: 0 !important;
      transform: none !important;
    }

    .cdk-overlay-pane.view-units-side-dialog .mat-mdc-dialog-container {
      border-radius: 0 !important;
      padding: 0 !important;
      max-height: 100% !important;
      height: 100% !important;
    }

    .cdk-overlay-pane.view-units-side-dialog .mat-mdc-dialog-surface {
      border-radius: 0 !important;
      height: 100% !important;
    }

    .view-units-dialog {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .view-units-dialog .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 18px;
      border-bottom: 1px solid #E4E7E9;
      background-color: #ffffff;
      position: sticky;
      top: 0;
      z-index: 10;
      flex-shrink: 0;
    }

    .view-units-dialog .dialog-title {
      margin: 0;
      font-family: 'Roboto', sans-serif;
      font-size: 20px;
      font-weight: 500;
      line-height: 28px;
      color: #1D1B20;
    }

    .view-units-dialog .close-btn {
      color: #3F4849;
      background: transparent;
    }

    .view-units-dialog .close-btn:hover {
      background-color: rgba(63, 72, 73, 0.08);
    }

    .dialog-content {
      flex: 1;
      overflow-y: auto;
      padding: 0;
    }

    .loading-container {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 48px;
    }

    .empty-text {
      text-align: center;
      padding: 48px 24px;
      color: rgba(0, 0, 0, 0.6); /* ≈ #666666 = 5.74:1 contrast — passes AA (MOD-02) */
      font-size: 14px;
    }

    .dialog-footer {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      border-top: 1px solid #e0e0e0;
    }

    .cancel-btn {
      color: #228189;
      font-weight: 500;
      letter-spacing: 0.5px;
    }
  `],
})
export class ViewUnitsDialogComponent {
  readonly data = inject<ViewUnitsDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<ViewUnitsDialogComponent>);

  readonly tableConfig: DataTableConfig<ReleaseGroupInterdictionUnitInfoDto> = {
    columns: [
      {
        key: 'unitId',
        header: 'Unit ID',
        width: '55%',
        valueFormatter: (value, row) => `${value}${row.chkDigit ? '-' + row.chkDigit : ''}`,
      },
      {
        key: 'collDate',
        header: 'Collection Date',
        width: '45%',
        type: 'date',
        valueFormatter: (v) => this.data.formatDate(v),
      },
    ],
    enableSelection: false,
    showPagination: false,
    stickyHeader: true,
    emptyMessage: 'No units found',
  };

  onClose(): void {
    this.dialogRef.close();
  }
}
