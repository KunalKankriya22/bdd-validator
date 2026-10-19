import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil } from 'rxjs';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TableSortEvent } from '@shared/interfaces/data-table.interface';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner.component';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HttpErrorHandler } from '@shared/utils/error-handler.utils';
import { ShippedProductDetailDto } from '../../models/shipments-by-ship-date.model';
import { ShipmentsByShipDateService } from '../../services/shipments-by-ship-date.service';
import moment from 'moment';

export interface ViewShippedProductDetailsDialogData {
  shipmentNo: string;
}

@Component({
  selector: 'app-view-shipped-product-details',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, DataTable, LoadingSpinnerComponent],
  templateUrl: './view-shipped-product-details.html',
  styleUrl: './view-shipped-product-details.scss',
})
export class ViewShippedProductDetailsDialog implements OnInit, OnDestroy {
  readonly data = inject<ViewShippedProductDetailsDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<ViewShippedProductDetailsDialog>);
  private readonly apiService = inject(ShipmentsByShipDateService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly destroy$ = new Subject<void>();

  protected readonly products = signal<ShippedProductDetailDto[]>([]);
  protected readonly originalProducts = signal<ShippedProductDetailDto[]>([]);
  protected readonly loading = signal<boolean>(false);
  private readonly sortDirection = signal<'A' | 'D' | 'default'>('default');

  protected readonly tableConfig = computed<DataTableConfig<ShippedProductDetailDto>>(() => {
    const count = this.products().length;
    return {
      columns: [
        { key: 'unitId', header: `Unit ID (${count})`, sortable: true, width: '160px' },
        { key: 'product', header: 'Product', sortable: false, width: '120px' },
        { key: 'aboRh', header: 'ABORh', sortable: false, width: '100px' },
        {
          key: 'expirationDate',
          header: 'Expiration Date',
          sortable: false,
          width: '160px',
          valueFormatter: (value: string) => this.formatDateTime(value),
        },
        { key: 'inventoryClass', header: 'Class', sortable: false, width: '100px' },
        { key: 'importFlag', header: 'Imported', sortable: false, width: '100px' },
      ],
      showPagination: false,
      stickyHeader: true,
      emptyMessage: 'No shipped products found',
      sortConfig: { column: 'unitId', direction: this.sortDirection() },
    };
  });

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadData(): void {
    this.loading.set(true);
    this.apiService
      .getShippedProducts(this.data.shipmentNo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (products) => {
          this.originalProducts.set(products);
          this.products.set(products);
          this.loading.set(false);
        },
        error: (error) => {
          this.loading.set(false);
          this.snackbarService.showError(
            HttpErrorHandler.extractErrorMessage(error, 'Failed to load shipped product details.')
          );
        },
      });
  }

  protected onSortChange(event: TableSortEvent): void {
    this.sortDirection.set(event.direction);
    const current = [...this.products()];
    if (event.direction === 'default') {
      this.products.set(this.originalProducts());
      return;
    }
    current.sort((a, b) => {
      const valA = (a.unitId || '').toLowerCase();
      const valB = (b.unitId || '').toLowerCase();
      const cmp = valA.localeCompare(valB);
      return event.direction === 'A' ? cmp : -cmp;
    });
    this.products.set(current);
  }

  protected onClose(): void {
    this.dialogRef.close();
  }

  private formatDateTime(value: string | null): string {
    if (!value) return '';
    const m = moment(value);
    return m.isValid() ? m.format('DD-MMM-YYYY HH:mm').toUpperCase() : value;
  }
}
