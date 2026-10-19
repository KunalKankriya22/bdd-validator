import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil } from 'rxjs';

import { OfflineProductShipmentApiService } from '../../services/offline-product-shipment-api.service';
import { ProductInBoxDto } from '../../models/offline-product-shipment.model';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, SortConfig, TableSortEvent } from '@shared/interfaces/data-table.interface';
import { SnackbarService } from '@shared/services/snackbar.service';

export interface ViewProductsInBoxDialogData {
  shipmentNo: string;
}

@Component({
  selector: 'app-view-products-in-box-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    DataTable
  ],
  templateUrl: './view-products-in-box-dialog.html',
  styleUrl: './view-products-in-box-dialog.scss'
})
export class ViewProductsInBoxDialog implements OnInit, OnDestroy {
  // Unique ID generation for accessibility
  private static nextId = 0;
  protected readonly componentId = `view-products-in-box-dialog-${ViewProductsInBoxDialog.nextId++}`;

  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;

  // Dependency injection
  private readonly dialogRef = inject(MatDialogRef<ViewProductsInBoxDialog>);
  private readonly data = inject<ViewProductsInBoxDialogData>(MAT_DIALOG_DATA);
  private readonly apiService = inject(OfflineProductShipmentApiService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly destroy$ = new Subject<void>();

  // Signal-based state
  protected readonly products = signal<ProductInBoxDto[]>([]);
  protected readonly loading = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);

  // Computed values
  protected readonly isEmpty = computed(() => this.products().length === 0);
  protected readonly isReady = computed(() => !this.loading() && !this.error());
  protected readonly shipmentNo = this.data.shipmentNo;

  // Sort and data table
  protected readonly productSort = signal<SortConfig>({ column: 'boxId', direction: 'default' });
  protected readonly sortedProducts = computed(() => {
    const items = this.products();
    const sort = this.productSort();
    if (sort.direction === 'default' || !sort.column) return items;
    return [...items].sort((a, b) => {
      const aVal = (a as any)[sort.column];
      const bVal = (b as any)[sort.column];
      const cmp = String(aVal ?? '').localeCompare(String(bVal ?? ''));
      return sort.direction === 'A' ? cmp : -cmp;
    });
  });
  protected tableConfig!: DataTableConfig<ProductInBoxDto>;

  ngOnInit(): void {
    this.initTableConfig();
    this.loadProducts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize data table configuration
   */
  private initTableConfig(): void {
    this.tableConfig = {
      columns: [
        {
          key: 'boxId',
          header: 'Box ID',
          sortable: true,
          width: '30%'
        },
        {
          key: 'productCode',
          header: 'Product Code',
          sortable: false,
          width: '30%'
        },
        {
          key: 'aboRhDesc',
          header: 'ABORh',
          sortable: false,
          width: '20%'
        },
        {
          key: 'productCount',
          header: 'Number of Products',
          sortable: false,
          width: '20%'
        }
      ],
      showPagination: true,
      emptyMessage: 'No products found in this box'
    };
  }

  /**
   * Load products for the given shipment
   */
  private loadProducts(): void {
    this.loading.set(true);
    this.error.set(null);

    this.apiService.getProductsInBox(this.shipmentNo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (products) => {
          this.products.set(products);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Failed to load products');
          this.loading.set(false);
        }
      });
  }

  /**
   * Close dialog
   */
  onProductSortChange(event: TableSortEvent): void {
    this.productSort.set({ column: event.column, direction: event.direction });
    this.tableConfig = {
      ...this.tableConfig,
      sortConfig: { column: event.column, direction: event.direction }
    };
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
