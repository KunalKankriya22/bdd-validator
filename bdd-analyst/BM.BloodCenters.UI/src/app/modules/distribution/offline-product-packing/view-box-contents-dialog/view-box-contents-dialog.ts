import { Component, Inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import moment from 'moment';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, SortConfig, TableSortEvent } from '@shared/interfaces/data-table.interface';

export interface ViewBoxContentsDialogData {
  contents: BoxContentItem[];
}

interface BoxContentItem {
  unitId: string;
  displayUnitId?: string;
  expirationDate?: string;
  productType?: string;
  productCode: string;
  aboDesc?: string;
}

@Component({
  selector: 'app-view-box-contents-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, DataTable],
  templateUrl: './view-box-contents-dialog.html',
  styleUrl: './view-box-contents-dialog.scss'
})
export class ViewBoxContentsDialogComponent {
  protected readonly contentsSort = signal<SortConfig>({ column: '', direction: 'default' });

  protected readonly tableConfig = computed<DataTableConfig<BoxContentItem>>(() => ({
    columns: [
      {
        key: 'unitId',
        header: `Unit ID (${this.data.contents.length})`,
        sortable: true,
        valueFormatter: (_val: string, row: BoxContentItem) => row.displayUnitId || row.unitId
      },
      {
        key: 'expirationDate',
        header: 'Expiration Date',
        valueFormatter: (val: string) => this.formatDate(val)
      },
      { key: 'productType', header: 'Product Type' },
      { key: 'productCode', header: 'Product Code' },
      { key: 'aboDesc', header: 'ABORh' }
    ],
    sortConfig: this.contentsSort(),
    stickyHeader: true,
    showTableOnEmpty: true,
    emptyMessage: 'No box contents',
    showPagination: false
  }));

  protected readonly sortedContents = computed(() => {
    const items = this.data.contents;
    const sort = this.contentsSort();
    if (sort.direction === 'default' || !sort.column) return items;
    return [...items].sort((a, b) => {
      const aVal = (a as any)[sort.column] ?? '';
      const bVal = (b as any)[sort.column] ?? '';
      const cmp = String(aVal).localeCompare(String(bVal));
      return sort.direction === 'A' ? cmp : -cmp;
    });
  });

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ViewBoxContentsDialogData,
    private dialogRef: MatDialogRef<ViewBoxContentsDialogComponent>
  ) {}

  close(): void {
    this.dialogRef.close();
  }

  onSortChange(event: TableSortEvent): void {
    this.contentsSort.set({ column: event.column, direction: event.direction });
  }

  formatDate(date: string | null | undefined): string {
    if (!date) return '';
    const m = moment(date);
    return m.isValid() ? m.format('DD-MMM-YYYY HH:mm').toUpperCase() : (date || '');
  }
}
