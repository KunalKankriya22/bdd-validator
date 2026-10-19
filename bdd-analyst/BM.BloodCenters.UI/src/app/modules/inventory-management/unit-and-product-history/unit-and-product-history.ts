import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  TemplateRef,
  inject,
  signal,
  computed,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { Subject, takeUntil } from 'rxjs';
import moment from 'moment';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import {
  UnitIdFieldComponent,
  UnitValidationResponse,
  UnitIdPostValidateEvent,
} from '@shared/components/unit-id-field';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner.component';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TableRowActionEvent, TableSortEvent } from '@shared/interfaces/data-table.interface';
import { UnitProductHistoryService } from './services/unit-product-history.service';
import { ProductHistoryDialog } from './dialogs/product-history-dialog';
import {
  UnitProductDto,
  ProductTableRow,
  ProductHistoryDialogData,
  STATUS_BADGE_COLORS,
} from './models/unit-product-history.model';

@Component({
  selector: 'app-unit-and-product-history',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    MatChipsModule,
    PageHeaderWithBreadcrumb,
    UnitIdFieldComponent,
    LoadingSpinnerComponent,
    DataTable,
  ],
  templateUrl: './unit-and-product-history.html',
  styleUrl: './unit-and-product-history.scss',
})
export class UnitAndProductHistory implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `unit-product-history-${UnitAndProductHistory.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;

  @ViewChild(UnitIdFieldComponent) unitIdField!: UnitIdFieldComponent;
  @ViewChild('statusCellTemplate', { static: true }) statusCellTemplate!: TemplateRef<any>;

  private readonly historyService = inject(UnitProductHistoryService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly route = inject(ActivatedRoute);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);
  private readonly destroy$ = new Subject<void>();

  readonly products = signal<ProductTableRow[]>([]);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly unitId = signal<string>('');
  readonly collectionDate = signal<string>('');
  readonly unitValidated = signal<boolean>(false);

  readonly hasProducts = computed(() => this.products().length > 0);
  readonly formattedCollectionDate = computed(() => {
    const date = this.collectionDate();
    if (!date) return '';
    const m = this.chapterTimezoneService.convertGmtToLocal(moment.utc(date));
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : date;
  });

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [{ label: 'Home', link: '/home' }],
    title: '',
    subtitle: '',
  };

  tableConfig: DataTableConfig<ProductTableRow> = {
    columns: [
      { key: 'product', header: 'Product', sortable: true, cellClass: 'product-column' },
      { key: 'aboCodeDesc', header: 'ABORh', sortable: false, cellClass: 'abo-column' },
      { key: 'formattedExpDate', header: 'Expiration Date', sortable: false, cellClass: 'exp-date-column' },
      { key: 'productStatus', header: 'Status', sortable: false, type: 'custom', cellClass: 'status-column' },
      { key: 'inventoryClass', header: 'Inventory Class', sortable: false, cellClass: 'inventory-class-column' },
      { key: 'disposition', header: 'Disposition', sortable: false, cellClass: 'disposition-column' },
      { key: 'orderNumber', header: 'Order Number', sortable: false, cellClass: 'order-number-column' },
      { key: 'boxId', header: 'Box ID', sortable: false, cellClass: 'box-id-column' },
    ],
    stickyHeader: true,
    showPagination: true,
    pagination: {
      pageSize: 25,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50, 100],
    },
    showTableOnEmpty: false,
    emptyMessage: 'No products found for this unit',
    enableRowHighlight: true,
    rowActions: [
      {
        icon: 'visibility',
        label: 'View History',
        ariaLabel: 'View product history',
        action: 'viewHistory',
      },
    ],
  };

  constructor() {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        // Only update if we don't already have breadcrumbs from query params
        if (this.headerConfig.breadcrumbs.length <= 1) {
          this.headerConfig = {
            ...this.headerConfig,
            breadcrumbs: [
              { label: 'Home', link: '/home' },
              { label: pageData.title, link: null },
            ],
            title: pageData.title,
            subtitle: pageData.subtitle || 'Review information about a specific product.',
          };
        }
      }
    });
  }

  ngOnInit(): void {
    const statusCol = this.tableConfig.columns.find(c => c.key === 'productStatus');
    if (statusCol) {
      statusCol.cellTemplate = this.statusCellTemplate;
    }

    // Check for query parameters - subscribe once and update config
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const unitId = params['unitId'];
        const from = params['from'];
        const fromPath = params['fromPath'];

        // Update breadcrumb FIRST if coming from another screen
        if (from && fromPath) {
          // Wait for page header service to have data
          setTimeout(() => {
            const pageData = this.pageHeaderService.pageHeaderData();
            const currentTitle = pageData?.title || 'Unit and Product History';

            this.headerConfig = {
              breadcrumbs: [
                { label: 'Home', link: '/home' },
                { label: from, link: fromPath },
                { label: currentTitle, link: null }
              ],
              title: currentTitle,
              subtitle: pageData?.subtitle || 'Review information about a specific product.'
            };
          }, 50);
        }

        // Auto-populate unit ID if provided
        if (unitId) {
          // Use longer timeout to ensure ViewChild is initialized
          setTimeout(() => {
            if (this.unitIdField && this.unitIdField.unitIdInput) {
              // Format the unit ID with ISBT format for barcode validation
              // Prefix '=' indicates ISBT format, suffix '00' is the terminator
              // This matches the format users manually enter: =W12341707011600
              const formattedUnitId = `=${unitId}00`;

              // Set the value in the form control
              this.unitIdField.unitIdControl.setValue(formattedUnitId);

              // Mark the control as touched so validation errors show
              this.unitIdField.unitIdControl.markAsTouched();

              // Wait a moment for the value to be set, then trigger validation
              setTimeout(() => {
                if (this.unitIdField && this.unitIdField.unitIdInput) {
                  // First focus the input
                  this.unitIdField.unitIdInput.nativeElement.focus();

                  // Then trigger blur event which starts the validation process
                  setTimeout(() => {
                    if (this.unitIdField && this.unitIdField.unitIdInput) {
                      this.unitIdField.unitIdInput.nativeElement.blur();
                    }
                  }, 50);
                }
              }, 50);
            }
          }, 200);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onUnitPostValidate(event: UnitIdPostValidateEvent): void {
    const unitId = event.data.parsedUnitId;

    this.historyService
      .validateUnit(unitId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (validationData) => {
          this.unitId.set(validationData.unitId);
          this.collectionDate.set(validationData.collectionDate);
          event.confirm();
          this.unitValidated.set(true);
          this.loadProducts(validationData.unitId, validationData.collectionDate);
        },
        error: (err) => {
          const msg = err?.error?.message || err?.message || 'Unit not found or has no collection date';
          event.reject(msg);
        },
      });
  }

  onUnitValidated(_data: UnitValidationResponse): void {
    // Validation and product loading handled in postValidate
  }

  onUnitCleared(): void {
    this.unitValidated.set(false);
    this.unitId.set('');
    this.collectionDate.set('');
    this.products.set([]);
    this.error.set(null);
  }

  onClearAll(): void {
    this.unitIdField?.clear();
    this.onUnitCleared();
  }

  onSortChange(event: TableSortEvent): void {
    this.tableConfig = {
      ...this.tableConfig,
      sortConfig: { column: event.column, direction: event.direction },
    };

    const sorted = [...this.products()].sort((a, b) => {
      const aVal = (a as any)[event.column];
      const bVal = (b as any)[event.column];

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      const comparison =
        typeof aVal === 'string' && typeof bVal === 'string'
          ? aVal.localeCompare(bVal)
          : aVal < bVal ? -1 : aVal > bVal ? 1 : 0;

      return event.direction === 'D' ? -comparison : comparison;
    });

    this.products.set(sorted);
  }

  onRowAction(event: TableRowActionEvent<ProductTableRow>): void {
    if (event.action === 'viewHistory') {
      this.viewProductHistory(event.row);
    }
  }

  viewProductHistory(product: ProductTableRow): void {
    this.historyService
      .getProductHistory(
        this.unitId(),
        product.productCode,
        product.aliquot,
        this.collectionDate()
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (records) => {
          if (!records || records.length === 0) {
            this.showErrorMessage('Product has no history');
            return;
          }

          const dialogData: ProductHistoryDialogData = {
            unitId: this.unitId(),
            productCode: product.productCode,
            aliquot: product.aliquot,
            collectionDate: this.collectionDate(),
            product: product.product,
            shipmentNumber: product.orderNumber || undefined,
            historyRecords: records,
          };

          this.dialog.open(ProductHistoryDialog, {
            width: '1000px',
            maxWidth: '100vw',
            height: 'calc(100vh - 64px)',
            maxHeight: 'calc(100vh - 64px)',
            position: { right: '0', top: '64px' },
            hasBackdrop: false,
            data: dialogData,
            disableClose: false,
            autoFocus: true,
          });
        },
        error: () => {
          this.showErrorMessage('Product has no history');
        },
      });
  }

  getStatusBadgeColor(status: string): string {
    return STATUS_BADGE_COLORS[status] || 'primary';
  }

  private loadProducts(unitIdValue: string, collectionDateValue: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.historyService
      .getProducts(unitIdValue, collectionDateValue)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (productsData) => {
          const mappedProducts = this.mapToTableRows(productsData);
          this.products.set(mappedProducts);
          this.tableConfig = {
            ...this.tableConfig,
            pagination: {
              ...this.tableConfig.pagination!,
              totalRecords: mappedProducts.length,
              pageIndex: 0,
            },
          };
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err.message || 'Failed to load products. Please try again.');
          this.loading.set(false);
          this.products.set([]);
          this.showErrorMessage(this.error()!);
        },
      });
  }

  private mapToTableRows(products: UnitProductDto[]): ProductTableRow[] {
    return products.map((product) => ({
      ...product,
      product: `${product.productCode}${product.aliquot}`,
      formattedExpDate: this.formatDateTime(product.expDate),
      statusBadgeClass: this.getStatusBadgeClass(product.productStatus),
    }));
  }

  private formatDateTime(dateString: string | null): string {
    if (!dateString) return '';
    const m = this.chapterTimezoneService.convertGmtToLocal(moment.utc(dateString));
    return m.isValid() ? m.format('DD-MMM-YYYY HH:mm').toUpperCase() : dateString;
  }

  private getStatusBadgeClass(status: string): string {
    const statusMap: Record<string, string> = {
      'Available': 'status-available',
      'Delivered': 'status-delivered',
      'Shipped': 'status-shipped',
      'Allocated': 'status-allocated',
      'Packed': 'status-packed',
      'Returned': 'status-returned',
      'Discarded': 'status-discarded',
      'Quarantine': 'status-quarantine',
      'Outdated': 'status-outdated',
      'In Lab': 'status-in-lab',
    };
    return statusMap[status] || 'status-default';
  }

  private showErrorMessage(message: string): void {
    this.snackBar.open(message, 'DISMISS', {
      duration: 6000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar'],
    });
  }
}
