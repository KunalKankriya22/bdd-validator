import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject } from 'rxjs';
import { map, startWith, takeUntil } from 'rxjs/operators';

import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig } from '@shared/interfaces/data-table.interface';
import { SpecialOrderAllocationService } from '../../services/special-order-allocation.service';
import { StockTierRow, StockSummary } from '../../models/special-order-allocation.model';

export interface ViewStockDialogData {
  productType: string;
  bloodType: string | null;
}

@Component({
  selector: 'app-view-stock-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    NgxMatSelectSearchModule,
    DataTable
  ],
  templateUrl: './view-stock-dialog.html',
  styleUrl: './view-stock-dialog.scss'
})
export class ViewStockDialog implements OnInit, OnDestroy {
  private static nextId = 0;
  readonly componentId = `view-stock-dialog-${ViewStockDialog.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;

  private readonly dialogRef = inject(MatDialogRef<ViewStockDialog>);
  private readonly data = inject<ViewStockDialogData>(MAT_DIALOG_DATA);
  private readonly service = inject(SpecialOrderAllocationService);

  protected readonly stockSummary = signal<StockSummary | null>(null);
  protected readonly loading = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);
  private destroy$ = new Subject<void>();
  readonly selectedProduct = signal<string>('');
  readonly productOptions = signal<Array<{code: string, description: string}>>([]);
  readonly filteredProductOptions = signal<Array<{code: string, description: string}>>([]);
  productSearchCtrl = new FormControl<string>('');

  tableConfig: DataTableConfig<StockTierRow> = {
    columns: [
      { key: 'tier', header: 'Tier' },
      { key: 'from', header: 'From' },
      { key: 'to', header: 'To' },
      { key: 'days', header: 'Days' },
      { key: 'stock', header: 'Stock' },
      { key: 'order', header: 'Order' },
      { key: 'alloc', header: 'Alloc' },
      { key: 'pack', header: 'Pack' },
      { key: 'avail', header: 'Avail' }
    ],
    showPagination: false,
    showFooter: true,
    stickyFooter: true,
    emptyMessage: 'No stock data available'
  };

  ngOnInit(): void {
    const options = [{ code: this.data.productType, description: this.data.productType }];
    this.productOptions.set(options);
    this.filteredProductOptions.set(options);
    this.selectedProduct.set(this.data.productType);

    this.productSearchCtrl.valueChanges.pipe(
      startWith(''),
      map(search => {
        const all = this.productOptions();
        if (!search) return all;
        const upper = search.toUpperCase();
        return all.filter(o => o.code.toUpperCase().includes(upper));
      }),
      takeUntil(this.destroy$)
    ).subscribe(filtered => this.filteredProductOptions.set(filtered));

    this.loadStockSummary();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadStockSummary(): void {
    this.loading.set(true);
    this.error.set(null);

    const productType = this.selectedProduct();
    const bloodType = this.data.bloodType || '';

    this.service.getInventorySummary(productType, bloodType)
      .subscribe({
        next: (summaryData) => {
          if (summaryData) {
            const tierRows: StockTierRow[] = (summaryData.tiers || []).map((t: any) => ({
              tier: t.tier,
              from: t.fromDay,
              to: t.toDay,
              days: 'Days',
              stock: t.inStock,
              order: t.onOrder,
              alloc: t.allocated,
              pack: t.packed,
              avail: t.available
            }));

            const summary: StockSummary = {
              productCode: productType,
              productDescription: productType,
              aboRh: bloodType || '--',
              optimal: summaryData.optimal,
              minimal: summaryData.minimal,
              tiers: tierRows,
              totalStock: tierRows.reduce((sum, t) => sum + t.stock, 0),
              totalOrder: tierRows.reduce((sum, t) => sum + t.order, 0),
              totalAlloc: tierRows.reduce((sum, t) => sum + t.alloc, 0),
              totalPack: tierRows.reduce((sum, t) => sum + t.pack, 0),
              totalAvail: tierRows.reduce((sum, t) => sum + t.avail, 0)
            };

            this.stockSummary.set(summary);
            this.tableConfig = {
              ...this.tableConfig,
              footerData: {
                tier: '', from: '', to: '', days: '',
                stock: summary.totalStock,
                order: summary.totalOrder,
                alloc: summary.totalAlloc,
                pack: summary.totalPack,
                avail: summary.totalAvail
              }
            };
          } else {
            this.stockSummary.set(null);
          }
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err.message || 'Failed to load inventory levels');
          this.loading.set(false);
        }
      });
  }

  onProductChange(productCode: string): void {
    this.selectedProduct.set(productCode);
    this.loadStockSummary();
  }

  onExit(): void {
    this.dialogRef.close();
  }
}
