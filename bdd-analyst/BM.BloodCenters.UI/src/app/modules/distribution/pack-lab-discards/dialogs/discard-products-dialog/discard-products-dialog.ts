import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TableSortEvent } from '@shared/interfaces/data-table.interface';
import { PackLabDiscardsService } from '../../services/pack-lab-discards.service';
import { AvailableProduct } from '../../models/pack-lab-discards.model';

export interface DiscardProductsDialogData {
  productType?: string;
  discardType?: string;
}

@Component({
  selector: 'app-discard-products-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, DataTable],
  templateUrl: './discard-products-dialog.html',
  styleUrl: './discard-products-dialog.scss'
})
export class DiscardProductsDialogComponent implements OnInit {
  readonly data = inject<DiscardProductsDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<DiscardProductsDialogComponent>);
  private readonly service = inject(PackLabDiscardsService);

  protected readonly loading = signal(true);
  protected readonly products = signal<AvailableProduct[]>([]);
  private readonly currentSort = signal<TableSortEvent | null>(null);

  protected readonly sortedProducts = computed(() => {
    const items = this.products();
    const sort = this.currentSort();
    if (!sort || sort.direction === 'default') return items;
    return [...items].sort((a, b) => {
      const aVal = String(a.unitId ?? '');
      const bVal = String(b.unitId ?? '');
      return sort.direction === 'A' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });
  });

  readonly tableConfig = computed<DataTableConfig<AvailableProduct>>(() => ({
    caption: 'Products Available for Discard',
    columns: [
      { key: 'unitId', header: 'Unit ID', sortable: true },
      { key: 'collDate', header: 'Collection Date', type: 'date' },
      { key: 'productType', header: 'Product Type' },
      { key: 'productCode', header: 'Product Code' },
      { key: 'systemLabelDecision', header: 'System Label Decision' },
      { key: 'aboDesc', header: '' },
    ],
    sortConfig: this.currentSort()
      ? { column: this.currentSort()!.column, direction: this.currentSort()!.direction }
      : undefined,
    sortIconMap: { default: 'unfold_more', ascending: 'arrow_upward', descending: 'arrow_downward' },
    showPagination: false,
    stickyHeader: true,
    emptyMessage: 'No products available for discard.',
  }));

  ngOnInit(): void {
    this.service.getAvailableProducts({
      productType: this.data.productType,
      discardType: this.data.discardType,
    }).subscribe({
      next: (products) => { this.products.set(products); this.loading.set(false); },
      error: () => { this.loading.set(false); },
    });
  }

  protected onSortChange(event: TableSortEvent): void {
    this.currentSort.set(event);
  }

  protected onClose(): void {
    this.dialogRef.close();
  }
}
