import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  inject,
  signal,
  computed,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import moment from 'moment';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TableSortEvent, TablePageEvent } from '@shared/interfaces/data-table.interface';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { UnitIdFieldComponent, UnitIdPostValidateEvent } from '@shared/components/unit-id-field/unit-id-field.component';
import { ConfirmActionDialogComponent, ConfirmActionDialogData } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';
import { WarehouseCheckOutApiService } from './services/warehouse-check-out-api.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import {
  WarehouseCheckOutBatchDto,
  WarehouseDropdownDto,
  CheckedOutUnitRow,
  ProductCodeOption,
  UnitLookupDto,
} from './models/warehouse-check-out.model';

@Component({
  selector: 'app-warehouse-check-out',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule,
    NgxMatSelectSearchModule,
    MatDialogModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    UnitIdFieldComponent,
  ],
  templateUrl: './warehouse-check-out.html',
  styleUrl: './warehouse-check-out.scss',
})
export class WarehouseCheckOut implements OnInit, OnDestroy {
  @ViewChild('unitIdField') unitIdField!: UnitIdFieldComponent;

  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(WarehouseCheckOutApiService);
  private readonly headerService = inject(HeaderService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly dialog = inject(MatDialog);
  private readonly destroy$ = new Subject<void>();

  // --- Signals ---
  readonly batchOptions = signal<WarehouseCheckOutBatchDto[]>([]);
  protected readonly filteredBatches = signal<WarehouseCheckOutBatchDto[]>([]);
  readonly warehouseOptions = signal<WarehouseDropdownDto[]>([]);
  protected readonly filteredWarehouses = signal<WarehouseDropdownDto[]>([]);

  readonly selectedBatch = signal<WarehouseCheckOutBatchDto | null>(null);
  readonly batchRetrieved = signal<boolean>(false);
  readonly loading = signal<boolean>(false);
  readonly isClosingBatch = signal<boolean>(false);
  private addingUnit = false;

  readonly units = signal<CheckedOutUnitRow[]>([]);
  readonly totalUnits = signal<number>(0);

  // Unit entry
  readonly collectionDate = signal<string>('');
  readonly expirationDate = signal<string>('');
  protected readonly parsedUnitId = signal<string | null>(null);

  // Product code dropdown
  readonly productSearchControl = new FormControl('');
  protected readonly productOptions = signal<ProductCodeOption[]>([]);
  protected readonly filteredProductOptions = signal<ProductCodeOption[]>([]);
  private readonly unitProducts = signal<UnitLookupDto[]>([]);

  // Warehouse label for table header
  protected readonly resolvedWarehouseLabel = signal<string>('');

  // Sort & pagination
  private readonly sortColumn = signal<string>('unitId');
  private readonly sortDirection = signal<'A' | 'D' | 'default'>('D');
  private readonly currentPageIndex = signal<number>(0);
  private readonly currentPageSize = signal<number>(10);

  // Search controls for dropdowns
  readonly batchIdSearchCtrl = new FormControl('');
  readonly warehouseSearchCtrl = new FormControl('');

  // --- Computed ---
  readonly tableData = computed(() => {
    const allUnits = [...this.units()];
    const col = this.sortColumn();
    const dir = this.sortDirection();
    const dateColumns = new Set(['collectionDate', 'expirationDate']);

    if (dir !== 'default') {
      allUnits.sort((a, b) => {
        const aVal = (a as any)[col] ?? '';
        const bVal = (b as any)[col] ?? '';
        let cmp: number;
        if (dateColumns.has(col)) {
          const aMs = moment(String(aVal), ['DD-MMM-YYYY HH:mm', 'DD-MMM-YYYY']).valueOf();
          const bMs = moment(String(bVal), ['DD-MMM-YYYY HH:mm', 'DD-MMM-YYYY']).valueOf();
          cmp = (isNaN(aMs) ? 0 : aMs) - (isNaN(bMs) ? 0 : bMs);
        } else {
          cmp = String(aVal).localeCompare(String(bVal));
        }
        return dir === 'A' ? cmp : -cmp;
      });
    }

    const start = this.currentPageIndex() * this.currentPageSize();
    return allUnits.slice(start, start + this.currentPageSize());
  });

  readonly tableConfig = computed<DataTableConfig<CheckedOutUnitRow>>(() => ({
    columns: [
      { key: 'unitId', header: `Unit ID (${this.totalUnits()})`, sortable: true },
      { key: 'collectionDate', header: 'Collection Date', sortable: false },
      { key: 'product', header: 'Product', sortable: false },
      { key: 'expirationDate', header: 'Expiration Date', sortable: false },
    ],
    showPagination: true,
    pagination: {
      pageSize: this.currentPageSize(),
      pageIndex: this.currentPageIndex(),
      totalRecords: this.totalUnits(),
      pageSizeOptions: [10, 25, 50, 100],
    },
    sortConfig: {
      column: this.sortColumn(),
      direction: this.sortDirection(),
    },
    emptyMessage: this.batchRetrieved() ? '' : 'No Results to Display',
    emptySubMessage: this.batchRetrieved() ? '' : 'Enter details to begin.',
    showTableOnEmpty: this.batchRetrieved(),
  }));

  // Forms
  batchForm!: FormGroup;
  unitEntryForm!: FormGroup;

  pageHeaderConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
    actions: [
      {
        label: 'ADD NEW BATCH',
        icon: 'add',
        matButton: 'raised',
        color: 'primary',
        onClick: () => this.onAddNewBatch(),
      },
    ],
  };

  constructor() {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.pageHeaderConfig = {
          ...this.pageHeaderConfig,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null },
          ],
          title: pageData.title,
          subtitle:
            pageData.subtitle ||
            'Check available products out of one warehouse, designate a target, and status the product as in transit until it is checked into the receiving warehouse.',
        };
      }
    });
  }

  ngOnInit(): void {
    this.initForms();
    this.loadBatches();
    this.loadWarehouses();

    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.onClearAll();
        this.loadBatches();
        this.loadWarehouses();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForms(): void {
    this.batchForm = this.fb.group({
      batchId: [''],
      sendTo: [''],
      temperature: [null],
      remarks: [''],
    });

    this.unitEntryForm = this.fb.group({
      productCode: ['', [Validators.required]],
    });

    this.batchForm
      .get('batchId')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((batchId: string) => {
        if (batchId) {
          this.onBatchIdSelected(batchId);
        }
      });

    this.batchIdSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((term) => {
        const t = (term || '').toLowerCase().trim();
        this.filteredBatches.set(
          t
            ? this.batchOptions().filter((b) => b.batchId.toLowerCase().includes(t))
            : this.batchOptions()
        );
      });

    this.warehouseSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((term) => {
        const t = (term || '').toLowerCase().trim();
        this.filteredWarehouses.set(
          t
            ? this.warehouseOptions().filter(
                (w) =>
                  w.code.toLowerCase().includes(t) ||
                  w.description.toLowerCase().includes(t)
              )
            : this.warehouseOptions()
        );
      });

    this.productSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((term) => {
        const t = (term || '').toLowerCase().trim();
        this.filteredProductOptions.set(
          t
            ? this.productOptions().filter(
                (p) =>
                  p.productCode.toLowerCase().includes(t) ||
                  (p.productDesc || '').toLowerCase().includes(t)
              )
            : this.productOptions()
        );
      });

    this.unitEntryForm
      .get('productCode')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((code: string) => {
        if (!code) return;
        const product = this.unitProducts().find((p) => p.productCode === code);
        if (product) {
          this.collectionDate.set(this.formatDate(product.collectionDate));
          this.expirationDate.set(this.formatDateTime(product.expirationDate));
        }
      });
  }

  // --- Data Loading ---

  private loadBatches(): void {
    this.apiService
      .getBatches()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.batchOptions.set(data);
          this.filteredBatches.set(data);
        },
        error: () => this.snackbarService.showError('Failed to load batches.'),
      });
  }

  private loadWarehouses(): void {
    this.apiService
      .getWarehouses()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.warehouseOptions.set(data);
          this.filteredWarehouses.set(data);
        },
        error: () => this.snackbarService.showError('Failed to load warehouses.'),
      });
  }

  // --- Batch Selection ---

  private onBatchIdSelected(batchId: string): void {
    const batch = this.batchOptions().find((b) => b.batchId === batchId);
    if (batch) {
      this.selectedBatch.set(batch);
      this.batchForm.patchValue(
        {
          sendTo: batch.toWarehouse,
          temperature: batch.checkoutTemp,
          remarks: batch.batchName ?? '',
        },
        { emitEvent: false }
      );
    }
  }

  getBatchDate(): string {
    const batch = this.selectedBatch();
    return batch?.createDate ? this.formatDate(batch.createDate) : '-';
  }

  getCreatedBy(): string {
    const batch = this.selectedBatch();
    return batch?.createUser || '-';
  }

  onBatchFieldBlur(): void {
    const batch = this.selectedBatch();
    if (!batch) return;

    const currentTemp = this.batchForm.get('temperature')?.value ?? null;
    const currentRemarks = this.batchForm.get('remarks')?.value || null;
    const tempChanged = currentTemp !== batch.checkoutTemp;
    const remarksChanged = currentRemarks !== (batch.batchName ?? null);

    if (!tempChanged && !remarksChanged) return;

    this.apiService
      .updateBatch(batch.batchId, {
        checkoutTemp: currentTemp,
        batchName: currentRemarks,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.selectedBatch.update((b) =>
            b ? { ...b, checkoutTemp: currentTemp, batchName: currentRemarks } : b
          );
        },
        error: (err) => {
          const msg = err?.error?.message || 'Failed to update batch.';
          this.snackbarService.showError(msg);
        },
      });
  }

  // --- Actions ---

  onRetrieve(): void {
    const batchId = this.batchForm.get('batchId')?.value;
    if (!batchId) return;

    this.loading.set(true);
    this.currentPageIndex.set(0);

    this.apiService
      .getBatchById(batchId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (batch) => {
          this.selectedBatch.set(batch);
          this.batchForm.patchValue(
            {
              sendTo: batch.toWarehouse,
              temperature: batch.checkoutTemp,
              remarks: batch.batchName ?? '',
            },
            { emitEvent: false }
          );

          const rows: CheckedOutUnitRow[] = (batch.products ?? []).map((p) => ({
            unitId: p.unitId ?? '',
            collectionDate: this.formatDate(p.collectionDate),
            product: p.productCode,
            expirationDate: this.formatDateTime(p.expirationDate),
          }));
          this.units.set(rows);
          this.totalUnits.set(rows.length);
          this.resolvedWarehouseLabel.set(
            batch.fromWarehouseName
              ? `${batch.fromWarehouse} - ${batch.fromWarehouseName}`
              : batch.fromWarehouse || ''
          );
          this.batchRetrieved.set(true);
          this.loading.set(false);
        },
        error: (err) => {
          this.loading.set(false);
          const msg = err?.error?.message || 'Failed to retrieve batch details.';
          this.snackbarService.showError(msg);
        },
      });
  }

  onClearAll(): void {
    this.batchForm.reset();
    this.selectedBatch.set(null);
    this.batchRetrieved.set(false);
    this.units.set([]);
    this.totalUnits.set(0);
    this.clearUnitFields();
    this.currentPageIndex.set(0);
  }

  onAddNewBatch(): void {
    const sendTo = this.batchForm.get('sendTo')?.value;
    const temperature = this.batchForm.get('temperature')?.value;
    const remarks = this.batchForm.get('remarks')?.value;

    if (!sendTo) {
      this.snackbarService.showError('Please select a "Send To" warehouse.');
      return;
    }

    this.apiService
      .createBatch({
        toWarehouse: sendTo,
        checkoutTemp: temperature ?? null,
        batchName: remarks || null,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const newBatchId = response.data?.[0]?.batchId;
          if (newBatchId) {
            this.snackbarService.showSuccess(`Batch ${newBatchId} created.`);
            this.loadBatches();
            this.batchForm.patchValue({ batchId: newBatchId });
            this.onRetrieve();
          }
        },
        error: (err) => {
          const msg = err?.error?.message || 'Failed to create batch.';
          this.snackbarService.showError(msg);
        },
      });
  }

  // --- Unit Entry (Scan flow) ---

  onPostValidate(event: UnitIdPostValidateEvent): void {
    const unitId = event.data.parsedUnitId;
    this.parsedUnitId.set(unitId);
    this.collectionDate.set('');
    this.expirationDate.set('');
    this.unitEntryForm.reset();
    this.productOptions.set([]);
    this.filteredProductOptions.set([]);

    if (unitId) {
      this.apiService
        .lookupUnit(unitId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (products) => {
            this.unitProducts.set(products);
            const options: ProductCodeOption[] = products.map((p) => ({
              productCode: p.productCode,
            }));
            this.productOptions.set(options);
            this.filteredProductOptions.set(options);

            if (products.length === 1) {
              this.collectionDate.set(this.formatDate(products[0].collectionDate));
              this.expirationDate.set(this.formatDateTime(products[0].expirationDate));
              this.unitEntryForm.patchValue({
                productCode: products[0].productCode,
              });
            }
            event.confirm();
          },
          error: (err) => {
            const msg = err?.error?.message || 'Unit not found or invalid.';
            event.reject(msg);
            this.parsedUnitId.set(null);
            this.collectionDate.set('');
            this.expirationDate.set('');
            this.unitEntryForm.reset();
            this.productOptions.set([]);
            this.filteredProductOptions.set([]);
            this.unitProducts.set([]);
          },
        });
    }
  }

  onAddProduct(): void {
    const unitId = this.parsedUnitId();
    const productCode = this.unitEntryForm.get('productCode')?.value;
    if (unitId && productCode) {
      this.addUnitToBatch(unitId, productCode);
    }
  }

  onUnitIdCleared(): void {
    this.parsedUnitId.set(null);
    this.collectionDate.set('');
    this.expirationDate.set('');
    this.unitEntryForm.reset();
    this.productOptions.set([]);
    this.filteredProductOptions.set([]);
    this.unitProducts.set([]);
  }

  private addUnitToBatch(unitId: string, productCode: string): void {
    const batchId = this.batchForm.get('batchId')?.value;
    if (!batchId || this.addingUnit) return;
    this.addingUnit = true;

    const collDate = this.collectionDate();
    const expDate = this.expirationDate();

    this.apiService
      .addProduct(batchId, { unitId, productCode })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.addingUnit = false;
          if (response.success) {
            const newRow: CheckedOutUnitRow = {
              unitId,
              collectionDate: collDate || '-',
              product: productCode,
              expirationDate: expDate || '-',
            };
            this.units.update((current) => [newRow, ...current]);
            this.totalUnits.update((n) => n + 1);
          }
          this.clearUnitFieldsAndRefocus();
        },
        error: (err) => {
          this.addingUnit = false;
          const msg = err?.error?.message || 'Failed to add product to batch.';
          this.snackbarService.showError(msg);
        },
      });
  }

  clearUnitFields(): void {
    this.parsedUnitId.set(null);
    this.collectionDate.set('');
    this.expirationDate.set('');
    this.unitEntryForm.reset();
    this.productOptions.set([]);
    this.filteredProductOptions.set([]);
    this.unitProducts.set([]);
    if (this.unitIdField) {
      this.unitIdField.clear();
    }
  }

  private clearUnitFieldsAndRefocus(): void {
    this.clearUnitFields();
    setTimeout(() => {
      if (this.unitIdField) {
        this.unitIdField.focus();
      }
    });
  }

  // --- Close Batch ---

  onCloseBatch(): void {
    const batchId = this.batchForm.get('batchId')?.value;
    if (!batchId) return;

    const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
      width: '480px',
      disableClose: true,
      data: {
        title: 'Close the transfer batch?',
        message: 'This will submit the close order slip.',
        confirmText: 'YES, CLOSE',
        cancelText: 'NO, GO BACK',
      } as ConfirmActionDialogData,
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((confirmed) => {
        if (confirmed) {
          this.executeCommit(batchId);
        }
      });
  }

  private executeCommit(batchId: string): void {
    this.isClosingBatch.set(true);
    this.apiService
      .commitBatch(batchId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isClosingBatch.set(false);
          if (response.success) {
            this.snackbarService.showSuccess('Transfer batch closed.');
            this.onClearAll();
            this.loadBatches();
          } else {
            this.snackbarService.showError(response.message || 'Failed to close batch.');
          }
        },
        error: (err) => {
          this.isClosingBatch.set(false);
          const msg = err?.error?.message || 'Failed to close batch.';
          this.snackbarService.showError(msg);
        },
      });
  }

  // --- Table Events ---

  onSortChange(event: TableSortEvent): void {
    this.sortColumn.set(event.column);
    this.sortDirection.set(event.direction);
    this.currentPageIndex.set(0);
  }

  onPageChange(event: TablePageEvent): void {
    this.currentPageIndex.set(event.pageIndex);
    this.currentPageSize.set(event.pageSize);
  }

  // --- Helpers ---

  private formatDate(isoDate: string | null | undefined): string {
    if (!isoDate) return '-';
    const m = moment(isoDate);
    if (!m.isValid()) return isoDate;
    return m.format('DD-MMM-YYYY').toUpperCase();
  }

  formatDateTime(isoDate: string | null | undefined): string {
    if (!isoDate) return '-';
    const m = moment(isoDate);
    if (!m.isValid()) return isoDate;
    return m.format('DD-MMM-YYYY  HH:mm').toUpperCase();
  }
}
