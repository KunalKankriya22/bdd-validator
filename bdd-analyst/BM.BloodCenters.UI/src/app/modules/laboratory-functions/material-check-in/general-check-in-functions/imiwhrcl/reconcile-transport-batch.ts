import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, TemplateRef, effect, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil, startWith, map } from 'rxjs';

import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TableSortEvent,
  TableRowActionEvent,
} from '@shared/interfaces/data-table.interface';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HttpErrorHandler } from '@shared/utils/error-handler.utils';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';

import { ReconcileTransportBatchApiService } from './services/reconcile-transport-batch-api.service';
import {
  BatchHeaderDto,
  BatchReconciliationDto,
  TransportDetailUiModel,
  ReasonCodeDto,
  ReconcileBatchRequestDto,
  ReconcileUnitDto,
} from './models/reconcile-transport-batch.model';
import {
  AddReconciliationReasonDialogComponent,
  AddReconciliationReasonDialogData,
  AddReconciliationReasonDialogResult,
} from './add-reconciliation-reason-dialog/add-reconciliation-reason-dialog';

/**
 * Reconcile Transport Batch Component (IMIWHRCL/WHRCL)
 * Check in products with status of "in transit" but not yet checked into any warehouse
 */
@Component({
  selector: 'app-reconcile-transport-batch',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatCheckboxModule,
    MatDialogModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    PageHeaderWithBreadcrumb,
    DataTable,
  ],
  templateUrl: './reconcile-transport-batch.html',
  styleUrls: ['./reconcile-transport-batch.scss'],
})
export class ReconcileTransportBatchComponent implements OnInit, OnDestroy, AfterViewInit {
  // Unique ID generation for accessibility
  private static nextId = 0;
  protected readonly componentId = `reconcile-transport-batch-${ReconcileTransportBatchComponent.nextId++}`;

  // Generate unique IDs for form elements
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [{ label: 'Home', link: '/home' }],
    title: '',
    subtitle: '',
  };

  @ViewChild(DataTable) dataTable!: DataTable<TransportDetailUiModel>;
  @ViewChild('unitIdCellTemplate', { static: true }) unitIdCellTemplate!: TemplateRef<any>;

  // Search form
  searchForm = new FormGroup({
    batchId: new FormControl<string | null>(null, [Validators.required]),
  });
  filteredBatches = signal<BatchHeaderDto[]>([]);

  // State signals
  loading = signal<boolean>(false);
  saving = signal<boolean>(false);
  batches = signal<BatchHeaderDto[]>([]);
  batchDetails = signal<BatchReconciliationDto | null>(null);
  reasonCodes = signal<ReasonCodeDto[]>([]);
  selectedRows = signal<Set<TransportDetailUiModel>>(new Set());
  tableData = signal<TransportDetailUiModel[]>([]);

  // Computed values
  hasSelectedRows = computed(() => this.selectedRows().size > 0);
  selectedRowCount = computed(() => this.selectedRows().size);
  warehouseTransfer = computed(() => {
    const details = this.batchDetails();
    if (!details) return '';
    const id = this.headerService.warehouseId();
    const name = this.headerService.warehouseName() || details.currentWarehouse || '';
    return id ? `${id} - ${name}` : name;
  });
  canSave = computed(() => {
    const data = this.tableData();
    // Save is enabled when ALL units have reconciliation codes assigned
    // Per Figma Developer Notes: "'Save' CTA will be disabled till all Unit Id's are reconciled"
    return data.length > 0 && data.every((d) => !!d.reconReason);
  });
  showEmptyState = computed(() => !this.loading() && this.tableData().length === 0);
  showTable = computed(() => !this.loading() && this.tableData().length > 0);
  createdOn = computed(() => {
    const details = this.batchDetails();
    if (!details?.createDate) return '-';
    return DateFieldValidationUtility.formatDateForUI(new Date(details.createDate)) || '-';
  });
  sentTo = computed(() => {
    const details = this.batchDetails();
    if (!details?.toWarehouseDescription) return '-';
    return details.toWarehouseDescription;
  });
  hasAnyReasonAssigned = computed(() => {
    return this.tableData().some((d) => !!d.reconReason);
  });

  // Table configuration
  tableConfig!: DataTableConfig<TransportDetailUiModel>;

  // Pagination
  pageSize = signal<number>(25);
  pageSizeOptions = [10, 25, 50, 100];
  currentPage = signal<number>(0);

  // Track last loaded batch to prevent duplicate API calls
  private lastLoadedBatchId: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private dialog: MatDialog,
    private pageHeaderService: PageHeaderService,
    private headerService: HeaderService,
    private snackbarService: SnackbarService,
    private apiService: ReconcileTransportBatchApiService
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

    // Update Unit ID column header with count
    effect(() => {
      const count = this.tableData().length;
      if (this.tableConfig?.columns) {
        const unitIdCol = this.tableConfig.columns.find((c) => c.key === 'unitId');
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

  ngAfterViewInit(): void {
    const unitIdCol = this.tableConfig.columns.find((c) => c.key === 'unitId');
    if (unitIdCol && this.unitIdCellTemplate) {
      unitIdCol.cellTemplate = this.unitIdCellTemplate;
    }
    this.tableConfig = { ...this.tableConfig };
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupBatchSearch(): void {
    // Filter batches based on form control input
    this.searchForm.get('batchId')?.valueChanges
      .pipe(
        startWith(''),
        map((search) => (search || '').toUpperCase()),
        takeUntil(this.destroy$)
      )
      .subscribe((searchTerm) => {
        this.filteredBatches.set(
          this.batches().filter((b) => b.batchId.toUpperCase().includes(searchTerm))
        );
      });
  }

  /**
   * Handle batch input for filtering
   * Forces uppercase input to match Oracle Forms behavior
   */
  onBatchInput(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const cursorPosition = inputElement.selectionStart;
    const upperValue = inputElement.value?.toUpperCase() || '';

    // Update input value to uppercase
    inputElement.value = upperValue;
    this.searchForm.get('batchId')?.setValue(upperValue, { emitEvent: false });

    // Restore cursor position after uppercase conversion
    if (cursorPosition !== null) {
      inputElement.setSelectionRange(cursorPosition, cursorPosition);
    }

    // Filter batches based on uppercase value
    this.filteredBatches.set(
      this.batches().filter((b) => b.batchId.toUpperCase().includes(upperValue))
    );
  }

  /**
   * Handle batch selection from autocomplete
   */
  onBatchSelected(event: MatAutocompleteSelectedEvent): void {
    const batchId = event.option.value;
    this.searchForm.get('batchId')?.setValue(batchId, { emitEvent: false });
    this.loadBatchDetails(batchId);
  }

  /**
   * Handle blur on batch input - validate and load if valid
   */
  onBatchBlur(): void {
    const batchId = this.searchForm.get('batchId')?.value?.toUpperCase();
    if (batchId && batchId !== this.lastLoadedBatchId) {
      // Check if batch exists in the list
      const batch = this.batches().find((b) => b.batchId.toUpperCase() === batchId);
      if (batch) {
        this.searchForm.get('batchId')?.setValue(batch.batchId, { emitEvent: false });
        this.loadBatchDetails(batch.batchId);
      }
    }
  }

  /**
   * Load batch details by batchId
   */
  private loadBatchDetails(batchId: string): void {
    // Prevent duplicate API calls for the same batch
    if (this.lastLoadedBatchId === batchId) {
      return;
    }
    this.lastLoadedBatchId = batchId;

    this.loading.set(true);
    this.tableData.set([]);
    this.clearTableSelection();

    this.apiService
      .getBatchDetails(batchId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (details) => {
          this.loading.set(false);

          if (!details) {
            this.snackbarService.showError('Batch not found or invalid status');
            this.batchDetails.set(null);
            return;
          }

          this.batchDetails.set(details);

          // Transform unreceived units to UI models with selection state
          const uiModels: TransportDetailUiModel[] = details.unreceivedUnits.map((unit) => ({
            ...unit,
            selected: false,
            rowId: `${unit.unitId}_${unit.productCode || ''}_${unit.aliquot || ''}`,
          }));

          this.tableData.set(uiModels);
        },
        error: (err) => {
          this.loading.set(false);
          this.snackbarService.showError(
            HttpErrorHandler.extractErrorMessage(err, 'Failed to retrieve batch details')
          );
        },
      });
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.clearAll();
      this.loadBatches();
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
        },
        error: (err) => {
          this.snackbarService.showError(
            HttpErrorHandler.extractErrorMessage(err, 'Failed to load batches')
          );
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
          this.snackbarService.showError(
            HttpErrorHandler.extractErrorMessage(err, 'Failed to load reason codes')
          );
        },
      });
  }

  /**
   * Clear all form fields and data
   */
  clearAll(): void {
    this.searchForm.reset();
    this.batchDetails.set(null);
    this.tableData.set([]);
    this.clearTableSelection();
    this.currentPage.set(0);
    this.lastLoadedBatchId = null;
  }

  /**
   * Handle row selection changes from data table
   */
  onSelectionChange(selectedItems: TransportDetailUiModel[]): void {
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
   * Apply reconciliation reason to selected units
   */
  private applyReconciliationReason(
    units: TransportDetailUiModel[],
    result: AddReconciliationReasonDialogResult
  ): void {
    const reasonCode = this.reasonCodes().find((r) => r.code === result.reconReason);

    const updatedData = this.tableData().map((item) => {
      const isSelected = units.some(
        (u) =>
          u.unitId === item.unitId &&
          u.productCode === item.productCode &&
          u.aliquot === item.aliquot
      );

      if (isSelected) {
        return {
          ...item,
          reconReason: result.reconReason,
          reasonDescription: reasonCode?.description || null,
          reconDetail: result.reconDetail || null,
        };
      }

      return item;
    });

    this.tableData.set(updatedData);
    this.clearTableSelection();
  }

  /**
   * Clear all reconciliation reasons from table
   */
  clearAllReasons(): void {
    const updatedData = this.tableData().map((item) => ({
      ...item,
      reconReason: null,
      reasonDescription: null,
      reconDetail: null,
    }));

    this.tableData.set(updatedData);
    this.clearTableSelection();
  }

  /**
   * Save reconciliation (submit to API)
   */
  onSave(): void {
    const batchId = this.batchDetails()?.batchId;
    if (!batchId) {
      this.snackbarService.showError('Please select a batch');
      return;
    }

    const units: ReconcileUnitDto[] = this.tableData().map((item) => ({
      unitId: item.unitId,
      productCode: item.productCode,
      aliquot: item.aliquot,
      reconReason: item.reconReason || undefined,
      reconDetail: item.reconDetail || undefined,
    }));

    const request: ReconcileBatchRequestDto = {
      units,
    };

    this.saving.set(true);

    this.apiService
      .reconcileBatch(batchId, request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.saving.set(false);

          // Show success message - use response count or fallback to units sent
          const count = response?.unitsReconciled ?? units.length;
          const message = `${count} Unit ID${count !== 1 ? "'s" : ''} for Batch ID ${batchId} have been reconciled.`;
          this.snackbarService.showSuccess(message);

          // Clear form and reload batches
          this.clearAll();
          this.loadBatches();
        },
        error: (err) => {
          this.saving.set(false);
          this.snackbarService.showError(
            HttpErrorHandler.extractErrorMessage(err, 'Failed to save reconciliation')
          );
        },
      });
  }

  /**
   * Handle row action events
   */
  onRowAction(event: TableRowActionEvent<TransportDetailUiModel>): void {
    // No row actions defined for this component
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
            if (row.checkDigit) {
              return `${value}${row.checkDigit}`;
            }
            return value;
          },
        },
        {
          key: 'productCode',
          header: 'Product',
          sortable: false,
          minWidth: '130px',
          valueFormatter: (v) => v || '-',
        },
        {
          key: 'expirationDate',
          header: 'Expiration Date',
          sortable: false,
          minWidth: '150px',
          valueFormatter: (v) => (v ? DateFieldValidationUtility.formatDateTimeForUI(new Date(v)) || '-' : '-'),
        },
        {
          key: 'reconReason',
          header: 'Reconciliation Code',
          sortable: false,
          minWidth: '150px',
          valueFormatter: (v) => v || '-',
        },
        {
          key: 'reasonDescription',
          header: 'Reason',
          sortable: false,
          minWidth: '200px',
          valueFormatter: (v) => v || '-',
        },
        {
          key: 'reconDetail',
          header: 'Reason Details',
          sortable: false,
          minWidth: '200px',
          valueFormatter: (v) => v || '-',
        },
      ],
      rowActions: [],
      sortConfig: { column: 'unitId', direction: 'A' },
      stickyHeader: true,
      enableSelection: true,
      selectionPosition: 'first',
      selectionKey: 'rowId',
      emptyMessage: 'No Results to Display',
      emptySubMessage: 'Enter batch ID to begin.',
      noDataIcon: 'search',
      enableRowHighlight: true,
      caption: 'Batch units pending reconciliation',
      rowLabelKey: 'unitId' as keyof TransportDetailUiModel,
    };
  }

  onSortChange(event: TableSortEvent): void {
    const data = this.tableData().slice();

    if (!event.column || event.direction === 'default') {
      this.tableData.set(data);
    } else {
      const sorted = data.sort((a, b) => {
        const isAsc = event.direction === 'A';
        if (event.column === 'unitId') {
          return this.compare(a.unitId, b.unitId, isAsc);
        }
        return 0;
      });
      this.tableData.set(sorted);
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
   * TrackBy function for table rows
   */
  trackByUnitId(_index: number, item: TransportDetailUiModel): string {
    return item.rowId;
  }

  get f() {
    return this.searchForm.controls;
  }
}
