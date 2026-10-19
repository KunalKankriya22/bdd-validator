import { Component, Inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, SortConfig, TableSortEvent } from '@shared/interfaces/data-table.interface';

export interface ViewPackStatusDialogData {
  packedProducts: PackStatusProduct[];
  allocatedProducts: PackStatusProduct[];
}

interface PackStatusProduct {
  unitId: string;
  displayUnitId?: string;
  productCode?: string;
  aboDesc?: string;
  productDesc?: string;
}

@Component({
  selector: 'app-view-pack-status-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, DataTable],
  templateUrl: './view-pack-status-dialog.html',
  styleUrl: './view-pack-status-dialog.scss'
})
export class ViewPackStatusDialogComponent {
  protected readonly packedSort = signal<SortConfig>({ column: '', direction: 'default' });
  protected readonly allocatedSort = signal<SortConfig>({ column: '', direction: 'default' });

  protected readonly packedTableConfig = computed<DataTableConfig<PackStatusProduct>>(() => ({
    columns: [
      {
        key: 'unitId',
        header: `Unit ID (${this.data.packedProducts.length})`,
        sortable: true,
        valueFormatter: (_val: string, row: PackStatusProduct) => row.displayUnitId || row.unitId
      },
      { key: 'productCode', header: 'Product' },
      { key: 'aboDesc', header: 'ABORh' }
    ],
    sortConfig: this.packedSort(),
    stickyHeader: true,
    showTableOnEmpty: true,
    emptyMessage: 'No packed products',
    showPagination: false
  }));

  protected readonly allocatedTableConfig = computed<DataTableConfig<PackStatusProduct>>(() => ({
    columns: [
      {
        key: 'unitId',
        header: `Unit ID (${this.data.allocatedProducts.length})`,
        sortable: true,
        valueFormatter: (_val: string, row: PackStatusProduct) => row.displayUnitId || row.unitId
      },
      { key: 'productCode', header: 'Product' },
      { key: 'aboDesc', header: 'ABORh' }
    ],
    sortConfig: this.allocatedSort(),
    stickyHeader: true,
    showTableOnEmpty: true,
    emptyMessage: 'No allocated products',
    showPagination: false
  }));

  protected readonly sortedPacked = computed(() =>
    this.sortData(this.data.packedProducts, this.packedSort())
  );

  protected readonly sortedAllocated = computed(() =>
    this.sortData(this.data.allocatedProducts, this.allocatedSort())
  );

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ViewPackStatusDialogData,
    private dialogRef: MatDialogRef<ViewPackStatusDialogComponent>
  ) {}

  close(): void {
    this.dialogRef.close();
  }

  onPackedSortChange(event: TableSortEvent): void {
    this.packedSort.set({ column: event.column, direction: event.direction });
  }

  onAllocatedSortChange(event: TableSortEvent): void {
    this.allocatedSort.set({ column: event.column, direction: event.direction });
  }

  private sortData(items: PackStatusProduct[], sort: SortConfig): PackStatusProduct[] {
    if (sort.direction === 'default' || !sort.column) return items;
    return [...items].sort((a, b) => {
      const aVal = (a as any)[sort.column] ?? '';
      const bVal = (b as any)[sort.column] ?? '';
      const cmp = String(aVal).localeCompare(String(bVal));
      return sort.direction === 'A' ? cmp : -cmp;
    });
  }
}
