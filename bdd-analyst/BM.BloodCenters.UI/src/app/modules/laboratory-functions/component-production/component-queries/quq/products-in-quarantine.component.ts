import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
} from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import moment from 'moment';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TablePageEvent,
  TableSortEvent,
} from '@shared/interfaces/data-table.interface';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HttpErrorHandler } from '@shared/utils/error-handler.utils';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner.component';

import { ProductsInQuarantineApiService } from './services/products-in-quarantine-api.service';
import {
  ProductInQuarantineDto,
  QuarantineTypeDto,
} from './models/products-in-quarantine.model';

@Component({
  selector: 'app-products-in-quarantine',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    LoadingSpinnerComponent,
  ],
  templateUrl: './products-in-quarantine.component.html',
  styleUrl: './products-in-quarantine.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsInQuarantineComponent implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `products-in-quarantine-${ProductsInQuarantineComponent.nextId++}`;

  // Generate unique IDs for elements
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  private readonly apiService = inject(ProductsInQuarantineApiService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly headerService = inject(HeaderService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);
  private readonly destroy$ = new Subject<void>();

  // Form control
  quarantineTypeControl = new FormControl<string | null>(null, [Validators.required]);

  // Signal-based state
  readonly quarantineTypes = signal<QuarantineTypeDto[]>([]);
  readonly products = signal<ProductInQuarantineDto[]>([]);
  readonly filteredProducts = signal<ProductInQuarantineDto[]>([]);
  readonly pagedProducts = signal<ProductInQuarantineDto[]>([]);
  readonly loadingTypes = signal<boolean>(false);
  readonly loading = signal<boolean>(false);
  readonly totalProducts = signal<number>(0);
  readonly selectedQuarantineType = signal<string | null>(null);

  // Computed values
  readonly isReturnProducts = computed(() => this.selectedQuarantineType() === 'RT');
  readonly hasSearched = computed(() => this.selectedQuarantineType() !== null);
  readonly showEmptyState = computed(
    () => !this.loading() && this.hasSearched() && this.products().length === 0
  );
  // Distinct unit ID count computed from current result set
  readonly distinctUnitIdCount = computed(() => {
    const ids = this.filteredProducts().map((p) => p.unitId);
    return new Set(ids).size;
  });

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: 'Products in Quarantine', link: null },
    ],
    // title and subtitle intentionally omitted — resolved from menu API via PageHeaderService
  };

  tableConfig: DataTableConfig<ProductInQuarantineDto> = {
    columns: [
      {
        key: 'unitId',
        header: 'Unit ID',
        sortable: true,
        width: '15%',
        valueFormatter: (value, row) => {
          const unitId = value || '';
          const checkDigit = row.checkDigit || '';
          return checkDigit ? `${unitId} (${checkDigit})` : unitId;
        },
      },
      {
        key: 'productCode',
        header: 'Product',
        sortable: false,
        width: '12%',
        valueFormatter: (value, row) => {
          const productCode = value || '';
          const aliquot = row.aliquot || '';
          return aliquot ? `${productCode}/${aliquot}` : productCode;
        },
      },
      {
        key: 'aboDescription',
        header: 'ABORh',
        sortable: false,
        width: '12%',
      },
      {
        key: 'expirationDate',
        header: 'Expiration Date',
        sortable: false,
        width: '15%',
        valueFormatter: (value) => this.formatDateWithTimezone(value),
      },
      {
        key: 'customer',
        header: 'Customer',
        sortable: false,
        width: '18%',
      },
      {
        key: 'reasonCode',
        header: 'Reason Code',
        sortable: false,
        width: '12%',
      },
      {
        key: 'reason',
        header: 'Description',
        sortable: false,
        width: '16%',
      },
      {
        key: 'userId',
        header: 'User ID',
        sortable: false,
        width: '10%',
      },
    ],
    showPagination: true,
    pagination: {
      pageSize: 25,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50],
      showFirstLastButtons: true,
    },
    sortConfig: { column: '', direction: 'default' as const },
    stickyHeader: true,
    enableRowHighlight: false,
  };

  ngOnInit(): void {
    const menuItem = this.pageHeaderService.getCurrentMenuItem();
    if (menuItem?.label) {
      this.headerConfig = {
        ...this.headerConfig,
        breadcrumbs: [
          { label: 'Home', link: '/home' },
          { label: menuItem.label, link: null },
        ],
      };
    }

    this.loadQuarantineTypes();
    this.subscribeToChapterChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.clearAll();
      this.loadQuarantineTypes();
    });
  }

  private loadQuarantineTypes(): void {
    this.loadingTypes.set(true);

    this.apiService
      .getQuarantineTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loadingTypes.set(false);
          if (response.success && response.data) {
            this.quarantineTypes.set(response.data);
          } else {
            this.quarantineTypes.set([]);
            this.snackbarService.showError(
              response.message || 'Failed to load quarantine types.'
            );
          }
        },
        error: (error) => {
          this.loadingTypes.set(false);
          this.quarantineTypes.set([]);
          this.snackbarService.showError(
            HttpErrorHandler.extractErrorMessage(
              error,
              'An error occurred while loading quarantine types'
            )
          );
        },
      });
  }

  onQuarantineTypeChange(): void {
    const selectedType = this.quarantineTypeControl.value;
    this.selectedQuarantineType.set(selectedType);

    if (selectedType) {
      this.searchProducts();
    } else {
      this.clearResults();
    }
  }

  onClear(): void {
    this.clearAll();
  }

  private searchProducts(): void {
    const quarantineType = this.quarantineTypeControl.value;

    if (!quarantineType) {
      this.snackbarService.showError('Please select a quarantine type.');
      return;
    }

    this.loading.set(true);

    this.apiService
      .getProducts({
        quarantineType,
        take: 500, // Get max records for client-side pagination and sorting
        skip: 0,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loading.set(false);

          if (response.success && response.data) {
            this.products.set(response.data);
            this.filteredProducts.set(response.data);
            this.totalProducts.set(response.totalCount);

            // Update table columns based on quarantine type
            this.updateTableColumns();

            // Reset to first page and compute the initial page slice (Bug 2)
            const pageSize = this.tableConfig.pagination?.pageSize ?? 25;
            this.pagedProducts.set(response.data.slice(0, pageSize));

            // Update pagination
            this.tableConfig = {
              ...this.tableConfig,
              pagination: {
                ...this.tableConfig.pagination!,
                totalRecords: response.data.length,
                pageIndex: 0,
                pageSize,
                pageSizeOptions: [10, 25, 50],
                showFirstLastButtons: true,
              },
            };

            if (response.data.length === 0) {
              this.snackbarService.showInfo('No products found for the selected quarantine type.');
            }
          } else {
            this.clearResults();
            this.snackbarService.showError(response.message || 'Failed to load products.');
          }
        },
        error: (error) => {
          this.loading.set(false);
          this.clearResults();
          this.snackbarService.showError(
            HttpErrorHandler.extractErrorMessage(error, 'An error occurred while loading products')
          );
        },
      });
  }

  private updateTableColumns(): void {
    // Bug 1: dynamic distinct unit ID count in header
    const unitIdHeader = `Unit ID (${this.distinctUnitIdCount()})`;

    // Create new columns array
    const columns = [
      {
        key: 'unitId',
        header: unitIdHeader,
        sortable: true,
        width: '15%',
        valueFormatter: (value: string, row: ProductInQuarantineDto) => {
          const unitId = value || '';
          const checkDigit = row.checkDigit || '';
          return checkDigit ? `${unitId} (${checkDigit})` : unitId;
        },
      },
      {
        key: 'productCode',
        header: 'Product',
        sortable: false,
        width: this.isReturnProducts() ? '12%' : '14%',
        valueFormatter: (value: string, row: ProductInQuarantineDto) => {
          const productCode = value || '';
          const aliquot = row.aliquot || '';
          return aliquot ? `${productCode}/${aliquot}` : productCode;
        },
      },
      {
        key: 'aboDescription',
        header: 'ABORh',
        sortable: false,
        width: this.isReturnProducts() ? '12%' : '14%',
      },
      {
        key: 'expirationDate',
        header: 'Expiration Date',
        sortable: false,
        width: '15%',
        valueFormatter: (value: string) => this.formatDateWithTimezone(value),
      },
    ];

    // Bug 4: Customer column only shown for Return Quarantine (code 'RT')
    if (this.isReturnProducts()) {
      columns.push({
        key: 'customer',
        header: 'Customer',
        sortable: false,
        width: '18%',
      });
    }

    columns.push(
      {
        key: 'reasonCode',
        header: 'Reason Code',
        sortable: false,
        width: '12%',
      },
      {
        key: 'reason',
        header: 'Description',
        sortable: false,
        width: '16%',
      },
      {
        key: 'userId',
        header: 'User ID',
        sortable: false,
        width: '10%',
      }
    );

    this.tableConfig = {
      ...this.tableConfig,
      columns,
    };
  }

  onTablePageChange(event: TablePageEvent): void {
    // Bug 2: slice the full filtered dataset to the requested page
    const start = event.pageIndex * event.pageSize;
    const end = start + event.pageSize;
    this.pagedProducts.set(this.filteredProducts().slice(start, end));

    this.tableConfig = {
      ...this.tableConfig,
      pagination: {
        ...this.tableConfig.pagination!,
        pageIndex: event.pageIndex,
        pageSize: event.pageSize,
      },
    };
  }

  onTableSortChange(event: TableSortEvent): void {
    this.tableConfig = {
      ...this.tableConfig,
      sortConfig: { column: event.column, direction: event.direction },
      pagination: {
        ...this.tableConfig.pagination!,
        pageIndex: 0,
      },
    };

    const sorted = this.sortData(this.filteredProducts(), event.column, event.direction);
    this.filteredProducts.set(sorted);

    // Bug 2: reset paged view to page 0 after sort
    const pageSize = this.tableConfig.pagination?.pageSize ?? 25;
    this.pagedProducts.set(sorted.slice(0, pageSize));
  }

  private sortData(
    data: ProductInQuarantineDto[],
    column: string,
    direction: 'A' | 'D' | 'default'
  ): ProductInQuarantineDto[] {
    if (direction === 'default') return [...data];

    const sorted = [...data].sort((a, b) => {
      let valA = String((a as unknown as Record<string, unknown>)[column] ?? '');
      let valB = String((b as unknown as Record<string, unknown>)[column] ?? '');

      // Special handling for date sorting
      if (column === 'expirationDate') {
        const dateA = a.expirationDate ? new Date(a.expirationDate).getTime() : 0;
        const dateB = b.expirationDate ? new Date(b.expirationDate).getTime() : 0;
        return dateA - dateB;
      }

      return valA.localeCompare(valB, undefined, { sensitivity: 'base' });
    });

    return direction === 'D' ? sorted.reverse() : sorted;
  }

  private formatDateWithTimezone(dateStr: string | null | undefined): string {
    if (!dateStr) return '--';
    const m = moment.utc(dateStr);
    if (!m.isValid()) return '--';
    const localM = this.chapterTimezoneService.convertGmtToLocal(m);
    const day = String(localM.date()).padStart(2, '0');
    const monthStr = localM.format('MMM').toUpperCase();
    const hours = String(localM.hours()).padStart(2, '0');
    const minutes = String(localM.minutes()).padStart(2, '0');
    return `${day}-${monthStr}-${localM.year()} ${hours}:${minutes}`;
  }

  private clearResults(): void {
    this.products.set([]);
    this.filteredProducts.set([]);
    this.pagedProducts.set([]);
    this.totalProducts.set(0);
    this.tableConfig = {
      ...this.tableConfig,
      pagination: {
        ...this.tableConfig.pagination!,
        totalRecords: 0,
        pageIndex: 0,
      },
    };
  }

  private clearAll(): void {
    this.quarantineTypeControl.setValue(null);
    this.selectedQuarantineType.set(null);
    this.clearResults();
  }
}
