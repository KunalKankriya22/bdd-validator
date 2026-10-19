import { Component, OnInit, OnDestroy, ViewChild, effect, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil, forkJoin, startWith, map } from 'rxjs';
import moment from 'moment';

import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TableSortEvent, TableRowActionEvent } from '@shared/interfaces/data-table.interface';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';

import { HttpErrorHandler } from '@shared/utils/error-handler.utils';
import { ReconcileLabWarehouseBatchApiService } from './services/reconcile-lab-warehouse-batch-api.service';
import {
  BatchHeaderDto,
  BatchDetailDto,
  BatchDetailUiModel,
  BatchDropdownDto,
  ReasonCodeDto,
  ReconcileBatchRequestDto,
  ReconcileDetailItemDto,
} from './models/reconcile-lab-warehouse-batch.model';
import {
  AddReconciliationReasonDialogComponent,
  AddReconciliationReasonDialogData,
  AddReconciliationReasonDialogResult,
} from './add-reconciliation-reason-dialog/add-reconciliation-reason-dialog';

/**
 * Reconcile Lab Warehouse Batch Component (LBWHRCL)
 * Review and resolve transfer batches by confirming unit status and updating final warehouse location
 */
@Component({
  selector: 'app-reconcile-lab-warehouse-batch',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatCheckboxModule,
    MatDialogModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    DataTable,
  ],
  templateUrl: './reconcile-lab-warehouse-batch.html',
  styleUrls: ['./reconcile-lab-warehouse-batch.scss'],
})
export class ReconcileLabWarehouseBatchComponent implements OnInit, OnDestroy {
  // Unique ID generation for accessibility
  private static nextId = 0;
  protected readonly componentId = `reconcile-lab-warehouse-batch-${ReconcileLabWarehouseBatchComponent.nextId++}`;

  // Generate unique IDs for form elements
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [{ label: 'Home', link: '/home' }],
    title: '',
    subtitle: '',
  };

  @ViewChild(DataTable) dataTable!: DataTable<BatchDetailUiModel>;

  searchForm = new FormGroup({
    batchId: new FormControl<string | null>(null, [Validators.required]),
  });
  batchSearchControl = new FormControl('');
  filteredBatches = signal<BatchDropdownDto[]>([]);

  // State signals
  loading = signal<boolean>(false);
  saving = signal<boolean>(false);
  batches = signal<BatchDropdownDto[]>([]);
  batchHeader = signal<BatchHeaderDto | null>(null);
  batchDetails = signal<BatchDetailUiModel[]>([]);
  reasonCodes = signal<ReasonCodeDto[]>([]);
  selectedRows = signal<Set<BatchDetailUiModel>>(new Set());
  currentWarehouse = signal<string>('');

  // Computed values
  hasSelectedRows = computed(() => this.selectedRows().size > 0);
  selectedRowCount = computed(() => this.selectedRows().size);
  totalReconcileUnits = computed(() => this.batchDetails().length);
  warehouseTransfer = computed(() => {
    const header = this.batchHeader();
    if (!header) return '';
    const fromWarehouse = this.currentWarehouse();
    return `${fromWarehouse} → ${header.toWarehouse} - ${header.toWhDesc}`;
  });
  canSave = computed(() => {
    const details = this.batchDetails();
    return details.length > 0 && details.every((d) => !!d.reconReason);
  });
  allReasonsAssigned = computed(() => {
    const details = this.batchDetails();
    return details.length > 0 && details.every((d) => !!d.reconReason);
  });
  hasAnyReasonAssigned = computed(() => {
    return this.batchDetails().some((d) => !!d.reconReason);
  });
  showEmptyState = computed(() => !this.loading() && this.batchDetails().length === 0);
  showTable = computed(() => !this.loading() && this.batchDetails().length > 0);

  // Table configuration
  tableConfig!: DataTableConfig<BatchDetailUiModel>;

  private destroy$ = new Subject<void>();

  constructor(
    private dialog: MatDialog,
    private pageHeaderService: PageHeaderService,
    private headerService: HeaderService,
    private snackbarService: SnackbarService,
    private apiService: ReconcileLabWarehouseBatchApiService
  ) {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          ...this.headerConfig,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null },
          ],
          title: pageData.title,
          subtitle: pageData.subtitle || '',
        };
      }
    });

    // Update current warehouse from header service
    effect(() => {
      const warehouseId = this.headerService.warehouseId();
      const warehouseName = this.headerService.warehouseName();
      const hasValidName = warehouseName && warehouseName !== 'undefined' && warehouseName !== 'null';
      if (warehouseId) {
        this.currentWarehouse.set(hasValidName ? `${warehouseId} - ${warehouseName}` : warehouseId);
      }
    });

    // Update Unit ID column header with count
    effect(() => {
      const count = this.batchDetails().length;
      if (this.tableConfig?.columns) {
        const unitIdCol = this.tableConfig.columns.find(c => c.key === 'unitId');
        if (unitIdCol) {
          unitIdCol.header = count > 0 ? `Unit ID (${count})` : 'Unit ID';
        }
      }
    });
  }
  

  ngOnInit(): void {
    this.buildTableConfig();
    this.loadBatches();
    this.loadReasonCodes();
    this.setupBatchSearch();
    this.subscribeToChapterChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupBatchSearch(): void {
    this.batchSearchControl.valueChanges
      .pipe(
        startWith(''),
        map((search) => (search || '').toUpperCase()),
        takeUntil(this.destroy$),
      )
      .subscribe((searchTerm) => {
        this.filteredBatches.set(
          this.batches().filter((b) => b.batchId.toUpperCase().includes(searchTerm)),
        );
      });
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.clearAll();
      this.loadBatches(); // Reload batches for new chapter
    });
  }

  /**
   * Load batches for dropdown
   */
  private loadBatches(): void {
    this.apiService
      .getBatches()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (batchList) => {
          this.batches.set(batchList);
          this.filteredBatches.set(batchList);
          this.batchSearchControl.setValue('');
        },
        error: (err) => {
          this.snackbarService.showError(HttpErrorHandler.extractErrorMessage(err, 'Failed to load batches'));
        },
      });
  }

  /**
   * Load reason codes for dropdown
   */
  private loadReasonCodes(): void {
    this.apiService
      .getReasonCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (codes) => {
          this.reasonCodes.set(codes);
        },
        error: (err) => {
          this.snackbarService.showError(HttpErrorHandler.extractErrorMessage(err, 'Failed to load reason codes'));
        },
      });
  }

  /**
   * Retrieve batch details when RETRIEVE button clicked
   */
  onRetrieve(): void {
    if (this.searchForm.invalid) {
      this.searchForm.markAllAsTouched();
      return;
    }

    const batchId = this.searchForm.get('batchId')?.value;
    if (!batchId) return;

    this.loading.set(true);
    this.batchDetails.set([]);
    this.selectedRows.set(new Set());

    // Load batch header and details in parallel
    forkJoin({
      header: this.apiService.getBatchHeader(batchId),
      details: this.apiService.getBatchDetails(batchId),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loading.set(false);

          if (!response.header) {
            this.snackbarService.showError('Batch not found or invalid status');
            return;
          }

          this.batchHeader.set(response.header);

          // Transform batch details to UI models with selection state
          const uiModels: BatchDetailUiModel[] = response.details.map((detail) => ({
            ...detail,
            selected: false,
            rowId: `${detail.unitId}_${detail.productCode || ''}_${detail.aliquot || ''}`,
          }));

          this.batchDetails.set(uiModels);
        },
        error: (err) => {
          this.loading.set(false);
          this.snackbarService.showError(HttpErrorHandler.extractErrorMessage(err, 'Failed to retrieve batch details'));
        },
      });
  }

  /**
   * Clear all form fields and data
   */
  clearAll(): void {
    this.searchForm.reset();
    this.batchHeader.set(null);
    this.batchDetails.set([]);
    this.clearTableSelection();
  }

  /**
   * Handle row selection changes from data table
   */
  onSelectionChange(selectedItems: BatchDetailUiModel[]): void {
    this.selectedRows.set(new Set(selectedItems));
  }

  private clearTableSelection(): void {
    this.selectedRows.set(new Set());
    if (this.dataTable) {
      this.dataTable.selectedIds.clear();
      this.dataTable.selectedRows = [];
      this.dataTable.isAllSelected = false;
      this.dataTable.isAllPagesSelected = false;
    }
  }

  /**
   * Open Add Reconciliation Reason dialog for selected rows
   */
  openAddReconciliationDialog(): void {
    const selectedUnits = Array.from(this.selectedRows());

    if (selectedUnits.length === 0) {
      this.snackbarService.showError('Please select at least one unit');
      return;
    }

    const dialogData: AddReconciliationReasonDialogData = {
      reasonCodes: this.reasonCodes(),
      selectedUnits,
    };

    const dialogRef = this.dialog.open(AddReconciliationReasonDialogComponent, {
      width: '600px',
      disableClose: true,
      data: dialogData,
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result: AddReconciliationReasonDialogResult | null) => {
        if (result) {
          this.applyReconciliationReason(selectedUnits, result);
        }
      });
  }

  /**
   * Open Add Reconciliation Reason dialog for a single row (Edit action)
   */
  onEditRow(row: BatchDetailUiModel): void {
    const dialogData: AddReconciliationReasonDialogData = {
      reasonCodes: this.reasonCodes(),
      selectedUnits: [row],
    };

    const dialogRef = this.dialog.open(AddReconciliationReasonDialogComponent, {
      width: '600px',
      disableClose: true,
      data: dialogData,
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result: AddReconciliationReasonDialogResult | null) => {
        if (result) {
          this.applyReconciliationReason([row], result);
        }
      });
  }

  /**
   * Apply reconciliation reason to selected units
   */
  private applyReconciliationReason(units: BatchDetailUiModel[], result: AddReconciliationReasonDialogResult): void {
    const reasonCode = this.reasonCodes().find((r) => r.code === result.reconReason);

    const updatedDetails = this.batchDetails().map((detail) => {
      const isSelected = units.some((u) => u.unitId === detail.unitId && u.productCode === detail.productCode && u.aliquot === detail.aliquot);

      if (isSelected) {
        return {
          ...detail,
          reconReason: result.reconReason,
          reasonCdDesc: reasonCode?.codeDesc || null,
          reconDetail: result.reconDetail || null,
        };
      }

      return detail;
    });

    this.batchDetails.set(updatedDetails);
    this.clearTableSelection();
  }

  /**
   * Clear all reconciliation reasons from table
   */
  clearAllReasons(): void {
    const updatedDetails = this.batchDetails().map((detail) => ({
      ...detail,
      reconReason: null,
      reasonCdDesc: null,
      reconDetail: null,
    }));

    this.batchDetails.set(updatedDetails);
    this.clearTableSelection();
  }

  /**
   * Save reconciliation (submit to API)
   */
  onSave(): void {
    if (!this.canSave()) {
      this.snackbarService.showError('Please add reconciliation reasons to all units before saving');
      return;
    }

    const batchId = this.batchHeader()?.batchId;
    if (!batchId) return;

    const details: ReconcileDetailItemDto[] = this.batchDetails().map((item) => ({
      unitId: item.unitId,
      productCode: item.productCode,
      aliquot: item.aliquot,
      reconReason: item.reconReason || '',
      reconDetail: item.reconDetail || undefined,
      collDate: item.collDate || undefined,
    }));

    const request: ReconcileBatchRequestDto = {
      batchId,
      details,
    };

    this.saving.set(true);

    this.apiService
      .reconcileBatch(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.saving.set(false);

          // Show success message
          const message = `${response.itemsReconciled} Unit ID${response.itemsReconciled !== 1 ? 's' : ''} of Batch ID ${batchId} have been reconciled.`;
          this.snackbarService.showSuccess(message);

          // Clear form and reload
          this.clearAll();
        },
        error: (err) => {
          this.saving.set(false);
          this.snackbarService.showError(HttpErrorHandler.extractErrorMessage(err, 'Failed to save reconciliation'));
        },
      });
  }

  /**
   * Handle row action events (Edit)
   */
  onRowAction(event: TableRowActionEvent<BatchDetailUiModel>): void {
    if (event.action === 'edit') {
      this.onEditRow(event.row);
    }
  }

  private buildTableConfig(): void {
    this.tableConfig = {
      columns: [
        {
          key: 'unitId',
          header: 'Unit ID',
          sortable: true,
          minWidth: '180px',
          valueFormatter: (value, row) => {
            // Append aliquot suffix if component (productCode exists)
            if (row.productCode && row.aliquot) {
              return `${value}-${row.aliquot}`;
            }
            return value;
          },
        },
        {
          key: 'productCode',
          header: 'Product Code',
          sortable: false,
          minWidth: '130px',
          valueFormatter: (v) => v || '-',
        },
        {
          key: 'productCodeDesc',
          header: 'Product Description',
          sortable: false,
          minWidth: '200px',
          valueFormatter: (v) => v || '-',
        },
        {
          key: 'reconReason',
          header: 'Reconciliation Code',
          sortable: false,
          minWidth: '150px',
          valueFormatter: (v) => v || '',
        },
        {
          key: 'reasonCdDesc',
          header: 'Reason',
          sortable: false,
          minWidth: '200px',
          valueFormatter: (v) => v || '',
        },
        {
          key: 'reconDetail',
          header: 'Reason Details',
          sortable: false,
          minWidth: '200px',
          valueFormatter: (v) => v || '',
        },
      ],
      rowActions: [],
      sortConfig: { column: 'unitId', direction: 'D' },
      stickyHeader: true,
      enableSelection: true,
      selectionKey: 'rowId',
      emptyMessage: 'No Results to Display',
      emptySubMessage: 'Please enter search criteria to view results',
      noDataIcon: 'search',
      enableRowHighlight: true,
    };
  }

  onSortChange(event: TableSortEvent): void {
    const data = this.batchDetails().slice();

    if (!event.column || event.direction === 'default') {
      this.batchDetails.set(data);
    } else {
      const sorted = data.sort((a, b) => {
        const isAsc = event.direction === 'A';
        if (event.column === 'unitId') {
          return this.compare(a.unitId, b.unitId, isAsc);
        }
        return 0;
      });
      this.batchDetails.set(sorted);
    }

    this.tableConfig = {
      ...this.tableConfig,
      sortConfig: { column: event.column, direction: event.direction },
    };
  }

  private compare(a: number | string, b: number | string, isAsc: boolean): number {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  /**
   * Format date for display (DD-MMM-YYYY)
   */
  formatDate(date: string | Date | null | undefined): string {
    if (!date) return '-';
    const m = moment(date);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : '-';
  }

  /**
   * TrackBy function for table rows
   */
  trackByUnitId(_index: number, item: BatchDetailUiModel): string {
    return `${item.unitId}-${item.productCode || ''}-${item.aliquot || ''}`;
  }

  get f() {
    return this.searchForm.controls;
  }
}
