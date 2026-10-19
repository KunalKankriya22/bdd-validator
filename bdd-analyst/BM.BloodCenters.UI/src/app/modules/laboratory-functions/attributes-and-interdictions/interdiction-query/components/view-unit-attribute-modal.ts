import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TableColumn,
  TablePageEvent,
  TableSortEvent
} from '@shared/interfaces/data-table.interface';
import { UnitAttribute, UnitAttributeTableRow } from '../models/interdiction-query.model';
import moment from 'moment';

export interface ViewUnitAttributeModalData {
  unitAttributes: UnitAttribute[];
}

@Component({
  selector: 'app-view-unit-attribute-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    DataTable
  ],
  template: `
    <div class="unit-attribute-modal">
      <!-- Dialog Header -->
      <div class="dialog-header">
        <h2 mat-dialog-title class="dialog-title">View Unit Attribute</h2>
        <button
          type="button"
          mat-icon-button
          class="close-button"
          aria-label="Close dialog"
          (click)="onClose()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Dialog Content -->
      <mat-dialog-content class="dialog-content">
        <div class="table-wrapper">
          <app-data-table
            [config]="tableConfig"
            [data]="tableData"
            [loading]="false"
            (pageChange)="onPageChange($event)"
            (sortChange)="onSortChange($event)" />
        </div>
      </mat-dialog-content>

      <!-- Dialog Actions -->
      <mat-dialog-actions class="dialog-actions">
        <button
          type="button"
          mat-button
          class="cancel-button"
          (click)="onClose()">
          CANCEL
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .unit-attribute-modal {
      display: flex;
      flex-direction: column;
      height: 100vh;
      width: 100%;
      background-color: #ffffff;
      box-shadow: none !important;
      border-left: 1px solid #E4E7E9;
    }

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid #E4E7E9;
      background-color: #ffffff;
      position: sticky;
      top: 0;
      z-index: 10;
      box-shadow: none !important;
      flex-shrink: 0;
    }

    .dialog-title {
      margin: 0;
      padding-left: 0;
      padding-right: 0;
      font-size: 20px;
      font-weight: 500;
      color: #0e1720;
    }

    .close-button {
      color: #6b7280;
      box-shadow: none;

      &:hover {
        color: #0e1720;
        background-color: #f5f5f5;
      }

      ::ng-deep .mat-mdc-button-persistent-ripple {
        display: none;
      }
    }

    .dialog-content {
      flex: 1 1 0;
      overflow: hidden;
      padding: 0;
      display: flex;
      flex-direction: column;
      max-width: 100%;
      min-height: 0;
    }

    .table-wrapper {
      flex: 1 1 0;
      min-height: 0;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      max-width: 100%;
    }

    ::ng-deep .table-wrapper app-data-table {
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 0;
      overflow: hidden;
      max-width: 100%;
      flex: 1 1 0;

      .data-table-wrapper {
        display: flex;
        flex-direction: column;
        height: 100%;
        box-shadow: none;
        border-radius: 0;
        min-height: 0;
        overflow: hidden;
        max-width: 100%;
        flex: 1 1 0;
        padding: 0 !important;
        margin: 0 !important;
      }

      .data-table__table-container {
        flex: 1 1 0;
        overflow-y: auto;
        overflow-x: auto;
        min-height: 0;
        max-width: 100%;
        padding: 0 !important;
        margin: 0 !important;

        // Scrollbar styling for the table container
        &::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        &::-webkit-scrollbar-track {
          background: #f5f5f5;
        }

        &::-webkit-scrollbar-thumb {
          background: #c0c0c0;
          border-radius: 4px;

          &:hover {
            background: #a0a0a0;
          }
        }
      }

      .data-table__pagination {
        display: none !important;
      }

      .mat-mdc-table {
        min-width: 800px; /* Ensure horizontal scroll if columns don't fit */
        width: max-content;
        margin: 0 !important;
      }
    }

    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 20px;
      border-top: 1px solid #E4E7E9;
      background-color: #ffffff;
      flex-shrink: 0;
      margin: 0;
    }

    .cancel-button {
      min-width: 100px;
      height: 40px;
      font-weight: 500;
      color: #228189;
      border: 1px solid #228189;
      background: transparent;

      &:hover {
        background-color: rgba(34, 129, 137, 0.08);
      }
    }
  `]
})
export class ViewUnitAttributeModal {
  tableConfig: DataTableConfig<UnitAttributeTableRow> = {
    columns: [],
    rowActions: [],
    pagination: {
      pageSize: 25,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50, 100],
      showFirstLastButtons: true
    },
    sortConfig: {
      column: 'attributeCode',
      direction: 'D' // Use 'D' to show down arrow for ascending
    },
    stickyHeader: true,
    stickyActionsColumn: false,
    emptyMessage: 'No Unit Attributes Available',
    noDataIcon: 'info',
    loadingMessage: 'Loading data...',
    showPagination: false // Hide pagination
  };

  tableData: UnitAttributeTableRow[] = [];

  constructor(
    public dialogRef: MatDialogRef<ViewUnitAttributeModal>,
    @Inject(MAT_DIALOG_DATA) public data: ViewUnitAttributeModalData
  ) {
    this.initializeTable();
  }

  private initializeTable(): void {
    this.tableConfig.columns = this.getTableColumns();
    this.tableData = this.mapToTableRows(this.data.unitAttributes);
    this.tableConfig.pagination!.totalRecords = this.tableData.length;
  }

  private getTableColumns(): TableColumn<UnitAttributeTableRow>[] {
    return [
      {
        key: 'attributeCode',
        header: 'Attribute Code',
        sortable: true, // Only Attribute Code sortable
        width: '150px'
      },
      {
        key: 'description',
        header: 'Description',
        sortable: false, // Not sortable
        width: '300px'
      },
      {
        key: 'group',
        header: 'Group',
        sortable: false, // Not sortable
        width: '150px'
      },
      {
        key: 'timeStamp',
        header: 'Time Stamp',
        sortable: false, // Not sortable
        width: '200px'
      },
      {
        key: 'user',
        header: 'User',
        sortable: false, // Not sortable
        width: '150px'
      }
    ];
  }

  private mapToTableRows(attributes: UnitAttribute[]): UnitAttributeTableRow[] {
    return attributes.map(attr => ({
      attributeCode: attr.attribCode,
      description: attr.attribDesc || '',
      group: attr.attribGroup,
      timeStamp: this.formatDate(attr.insertDats),
      user: attr.insertUserId || ''
    }));
  }

  private formatDate(date: string | null | undefined): string {
    if (!date) return '-';

    // Parse date as UTC/ISO and format consistently
    // Backend returns timestamps already in chapter timezone
    const m = moment(date);
    if (!m.isValid()) return '-';

    const day = String(m.date()).padStart(2, '0');
    const month = m.format('MMM').toUpperCase();
    const year = m.year();
    const hours = String(m.hours()).padStart(2, '0');
    const minutes = String(m.minutes()).padStart(2, '0');

    return `${day}-${month}-${year} ${hours}:${minutes}`;
  }

  onPageChange(event: TablePageEvent): void {
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = event.pageIndex;
      this.tableConfig.pagination.pageSize = event.pageSize;
    }
  }

  onSortChange(event: TableSortEvent): void {
    if (this.tableConfig.sortConfig) {
      this.tableConfig.sortConfig.column = event.column;
      this.tableConfig.sortConfig.direction = event.direction;
    }

    // Sort the data
    this.sortData(event.column as keyof UnitAttributeTableRow, event.direction);
  }

  private sortData(column: keyof UnitAttributeTableRow, direction: 'A' | 'D' | 'default'): void {
    if (direction === 'default') {
      // Reset to original order
      this.tableData = this.mapToTableRows(this.data.unitAttributes);
      return;
    }

    // Create a new sorted array to trigger change detection
    // Icons are backwards: 'D' shows down arrow (ascending), 'A' shows up arrow (descending)
    this.tableData = [...this.tableData].sort((a, b) => {
      const aValue = a[column] || '';
      const bValue = b[column] || '';

      if (aValue < bValue) {
        return direction === 'D' ? -1 : 1; // 'D' = down arrow = ascending
      }
      if (aValue > bValue) {
        return direction === 'D' ? 1 : -1; // 'A' = up arrow = descending
      }
      return 0;
    });
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
