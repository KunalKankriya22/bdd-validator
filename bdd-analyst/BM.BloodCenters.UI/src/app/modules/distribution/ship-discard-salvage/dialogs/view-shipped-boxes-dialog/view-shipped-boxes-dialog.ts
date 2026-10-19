import { Component, Inject, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { Subject, takeUntil } from 'rxjs';

import { ViewShippedBoxesDialogData, ShippedBoxProduct } from '../../models/ship-discard-salvage.model';
import { ShipDiscardSalvageApiService } from '../../services/ship-discard-salvage-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TableSortEvent } from '@shared/interfaces/data-table.interface';

@Component({
  selector: 'app-view-shipped-boxes-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    DataTable,
  ],
  templateUrl: './view-shipped-boxes-dialog.html',
  styleUrl: './view-shipped-boxes-dialog.scss',
})
export class ViewShippedBoxesDialogComponent implements OnDestroy {
  private readonly apiService = inject(ShipDiscardSalvageApiService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly destroy$ = new Subject<void>();

  protected readonly shippedProducts = signal<ShippedBoxProduct[]>([]);
  protected readonly loading = signal<boolean>(false);

  protected tableConfig: DataTableConfig<ShippedBoxProduct> = {
    columns: [
      { key: 'boxId', header: 'Box ID (14)', sortable: true },
      { key: 'productCode', header: 'Product' },
      { key: 'orderedAboRh', header: 'Ordered ABO/Rh' },
      { key: 'count', header: 'Count' },
    ],
    sortConfig: { column: 'boxId', direction: 'D' },
    emptyMessage: 'No products in shipped boxes',
  };

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ViewShippedBoxesDialogData,
    private readonly dialogRef: MatDialogRef<ViewShippedBoxesDialogComponent>
  ) {
    this.loadShippedBoxProducts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadShippedBoxProducts(): void {
    if (!this.data.shipmentNo) return;

    this.loading.set(true);

    this.apiService.getShipmentProducts(this.data.shipmentNo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (products) => {
          this.shippedProducts.set(products);
          this.loading.set(false);
        },
        error: () => {
          this.snackbarService.showError('Failed to load shipped products');
          this.loading.set(false);
        },
      });
  }

  onSortChange(event: TableSortEvent): void {
    this.tableConfig = {
      ...this.tableConfig,
      sortConfig: { column: event.column, direction: event.direction },
    };
    this.shippedProducts.update(items => [...items].sort((a, b) => {
      const valA = String((a as any)[event.column] ?? '');
      const valB = String((b as any)[event.column] ?? '');
      const cmp = valA.localeCompare(valB);
      return event.direction === 'A' ? cmp : -cmp;
    }));
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
