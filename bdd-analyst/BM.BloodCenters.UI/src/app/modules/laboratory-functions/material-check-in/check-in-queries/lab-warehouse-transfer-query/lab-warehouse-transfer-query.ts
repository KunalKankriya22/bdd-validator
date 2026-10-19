import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  effect,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSidenavModule, MatDrawer } from '@angular/material/sidenav';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { FormControl } from '@angular/forms';
import { DateAdapter, ErrorStateMatcher, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { Subject, takeUntil } from 'rxjs';
import moment, { Moment } from 'moment';

import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { dateFormatValidator } from 'src/app/core/utils/date-adapter.util';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TablePageEvent, TableSortEvent } from '@shared/interfaces/data-table.interface';
import { UnitIdFieldComponent } from '@shared/components/unit-id-field/unit-id-field.component';

import { LabWarehouseTransferQueryApiService } from './services/lab-warehouse-transfer-query-api.service';
import {
  LabWhTransHdrDto,
  LabWhTransDtlDto,
  LabWhTransQueryDto,
  WarehouseLookupDto,
  BatchIdLookupDto,
  StatusLookupDto,
  BatchStatus
} from './models/lab-warehouse-transfer-query.model';

/**
 * Lab Warehouse Transfer Query Component
 * Allows users to query and view warehouse transfer batches and unit details
 * Master-detail layout with batch list on left and details on right
 */
@Component({
  selector: 'app-lab-warehouse-transfer-query',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDatepickerModule,
    MatAutocompleteModule,
    MatSidenavModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    UnitIdFieldComponent
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './lab-warehouse-transfer-query.html',
  styleUrls: ['./lab-warehouse-transfer-query.scss']
})
export class LabWarehouseTransferQuery implements OnInit, OnDestroy {
  // Unique ID generation for accessibility
  private static nextId = 0;
  protected readonly componentId = `lab-warehouse-transfer-query-${LabWarehouseTransferQuery.nextId++}`;

  // Generate unique IDs for form elements
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  @ViewChild('receiveTemperaturePanel') receiveTemperaturePanel!: MatDrawer;
  @ViewChild(UnitIdFieldComponent) unitIdField!: UnitIdFieldComponent;
  private validatedUnitId: string | null = null;

  // Dependency injection
  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(LabWarehouseTransferQueryApiService);
  private readonly headerService = inject(HeaderService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly destroy$ = new Subject<void>();

  // Signal-based state
  protected readonly warehouses = signal<WarehouseLookupDto[]>([]);
  protected readonly batches = signal<LabWhTransHdrDto[]>([]);
  protected readonly selectedBatch = signal<LabWhTransHdrDto | null>(null);
  protected readonly units = signal<LabWhTransDtlDto[]>([]);
  protected readonly loading = signal<boolean>(false);
  protected readonly loadingBatchDetails = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);
  protected readonly hasSearched = signal<boolean>(false);

  // Computed values
  protected readonly hasBatches = computed(() => this.batches().length > 0);
  protected readonly hasSelectedBatch = computed(() => this.selectedBatch() !== null);
  protected readonly isEmpty = computed(() => !this.loading() && !this.hasBatches() && this.hasSearched());
  protected readonly showEmptyState = computed(() => !this.hasSearched() && !this.loading());

  protected readonly formDirty = signal(false);

  get isClearAllDisabled(): boolean {
    return !this.formDirty() && !this.hasSearched();
  }

  protected get today(): Moment {
    const tz = this.headerService.chapterTimeZone?.();
    if (tz) {
      return moment().utcOffset(tz).startOf('day');
    }
    return moment().startOf('day');
  }

  // Search form
  searchForm!: FormGroup;

  // API-driven dropdown data
  protected readonly statusOptions = signal<StatusLookupDto[]>([]);
  protected readonly batchIdOptions = signal<BatchIdLookupDto[]>([]);
  protected readonly batchIdSearchCtrl = new FormControl('');
  protected readonly fromWhSearchCtrl = new FormControl('');
  protected readonly toWhSearchCtrl = new FormControl('');

  private readonly fromWhSearch = signal('');
  private readonly toWhSearch = signal('');
  private readonly batchIdSearch = signal('');

  protected readonly filteredFromWarehouses = computed(() => {
    const search = this.fromWhSearch().toLowerCase();
    const all = this.warehouses();
    if (!search) return all;
    return all.filter(w => w.code.toLowerCase().includes(search) || w.description.toLowerCase().includes(search));
  });

  protected readonly filteredToWarehouses = computed(() => {
    const search = this.toWhSearch().toLowerCase();
    const all = this.warehouses();
    if (!search) return all;
    return all.filter(w => w.code.toLowerCase().includes(search) || w.description.toLowerCase().includes(search));
  });

  protected readonly filteredBatchIds = computed(() => {
    const search = this.batchIdSearch().toLowerCase();
    const all = this.batchIdOptions();
    if (!search || search.length < 2) return all;
    return all.filter(b => b.batchId.toLowerCase().includes(search));
  });

  // Page header configuration
  pageHeaderConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
    actions: []
  };

  // Units table configuration
  unitsTableConfig: DataTableConfig<LabWhTransDtlDto> = {
    columns: [
      { key: 'unitId', header: 'Unit ID', sortable: true, width: '140px' },
      { key: 'productCode', header: 'Product Code', sortable: false, width: '120px' },
      { key: 'receiveWarehouse', header: 'Reconciliation Warehouse', sortable: false, width: '180px' },
      {
        key: 'receiveDate',
        header: 'Reconciliation Date',
        sortable: false,
        width: '160px',
        valueFormatter: (value) => this.formatDate(value)
      },
      { key: 'receiveUser', header: 'By', sortable: false, width: '100px' },
      { key: 'reconReason', header: 'Reconciliation Code', sortable: false, width: '150px' },
      { key: 'reconDetail', header: 'Reconciliation Details', sortable: false, width: '200px' }
    ],
    stickyHeader: true,
    showPagination: false,
    emptyMessage: 'No Units to Display',
    emptySubMessage: 'Select a batch to view unit details',
    noDataIcon: 'inbox',
    loadingMessage: 'Loading unit details...'
  };

  // Receive Temperature side panel table config
  receiveTempTableConfig: DataTableConfig<LabWhTransDtlDto> = {
    columns: [
      { key: 'unitId', header: 'Unit ID', sortable: false, width: '200px' },
      { key: 'productCode', header: 'Product Code', sortable: false, width: '150px' },
      {
        key: 'receiveTemp',
        header: 'In Temperature',
        sortable: false,
        width: '150px',
        valueFormatter: (value) => value != null ? `${value}°C` : '-'
      }
    ],
    stickyHeader: false,
    showPagination: false,
    emptyMessage: 'No temperature data available',
    noDataIcon: 'thermostat'
  };

  // Units data source for table
  unitsDataSource: LabWhTransDtlDto[] = [];

  constructor() {
    // Update header config from menu-items API response
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.pageHeaderConfig = {
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null }
          ],
          title: pageData.title,
          subtitle: pageData.subtitle || '',
          actions: []
        };
      }
    });
  }

  ngOnInit(): void {
    this.initForm();
    this.loadDropdowns();
    this.subscribeToChapterChanges();
    this.setupBatchIdFilter();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize search form with default values
   */
  private initForm(): void {
    this.searchForm = this.fb.group({
      fromWarehouse: [''],
      toWarehouse: [''],
      status: [''],
      batchId: [''],
      fromDate: [null, [dateFormatValidator()]],
      toDate: [null, [dateFormatValidator()]]
    }, {
      validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('fromDate', 'toDate')]
    });

    this.searchForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.updateFormDirty());
  }

  private setupBatchIdFilter(): void {
    this.searchForm.get('batchId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.batchIdSearch.set(value || ''));

    this.fromWhSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.fromWhSearch.set(value || ''));

    this.toWhSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.toWhSearch.set(value || ''));
  }

  private loadDropdowns(): void {
    this.apiService.getWarehouses()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (warehouses) => this.warehouses.set(warehouses),
        error: () => this.snackbarService.showError('Failed to load warehouse list')
      });

    this.apiService.getStatuses()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => this.statusOptions.set(data),
        error: () => this.statusOptions.set([])
      });

    this.apiService.getBatchIds()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => this.batchIdOptions.set(data),
        error: () => this.batchIdOptions.set([])
      });
  }

  /**
   * Subscribe to chapter changes and reload data
   */
  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.onClearAll();
        this.loadDropdowns();
      });
  }

  /**
   * Get form control accessor
   */
  get f() {
    return this.searchForm.controls;
  }

  /**
   * Handle retrieve button click
   * Validates form and executes search
   */
  fromDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getFromDateError()
  );
  toDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getToDateError()
  );

  getFromDateError(): string {
    const control = this.searchForm.get('fromDate');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('matDatepickerParse')) return 'Invalid date format';
    if (control.hasError('invalidDateFormat')) return 'Invalid date format';
    if (control.hasError('matDatepickerMax')) return 'From Date cannot be in the future';
    const baseError = DateFieldValidationUtility.getDateErrorMessage(
      control, this.searchForm.errors, 'From Date', 'From Date cannot be after To Date'
    );
    return baseError;
  }

  getToDateError(): string {
    const control = this.searchForm.get('toDate');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('matDatepickerParse')) return 'Invalid date format';
    if (control.hasError('invalidDateFormat')) return 'Invalid date format';
    if (control.hasError('matDatepickerMax')) return 'To Date cannot be in the future';
    const baseError = DateFieldValidationUtility.getDateErrorMessage(
      control, this.searchForm.errors, 'To Date', 'To Date cannot be before From Date'
    );
    return baseError;
  }

  onDateInput(event: Event, controlName: string): void {
    const inputValue = (event.target as HTMLInputElement).value;
    const control = this.searchForm.get(controlName);
    if (!control) return;
    control.markAsTouched();
    control.markAsDirty();
    if (inputValue?.trim() && !control.value) {
      control.setErrors({ invalidDateFormat: true });
    } else if (control.hasError('invalidDateFormat')) {
      control.setErrors(null);
      control.updateValueAndValidity();
    }
  }

  onRetrieve(): void {
    this.searchForm.markAllAsTouched();
    if (this.searchForm.invalid) {
      return;
    }

    let fromDate = this.f['fromDate'].value as Moment | null;
    let toDate = this.f['toDate'].value as Moment | null;

    if (fromDate && toDate && fromDate.isAfter(toDate)) {
      this.snackbarService.showError('From Date cannot be after To Date');
      return;
    }

    const hasUnitOrBatch = (this.validatedUnitId && this.unitIdField?.isValid) ||
                           this.f['batchId'].value?.trim();

    if (!fromDate && !toDate && !hasUnitOrBatch) {
      toDate = this.today;
      fromDate = moment(this.today).subtract(30, 'days');
      this.f['fromDate'].setValue(fromDate);
      this.f['toDate'].setValue(toDate);
    } else if (fromDate && !toDate) {
      const maxTo = moment.min(moment(fromDate).add(30, 'days'), moment(this.today));
      toDate = maxTo;
      this.f['toDate'].setValue(toDate);
    } else if (!fromDate && toDate) {
      fromDate = moment(toDate).subtract(30, 'days');
      this.f['fromDate'].setValue(fromDate);
    }

    const query: LabWhTransQueryDto = {
      fromWarehouse: this.f['fromWarehouse'].value || undefined,
      toWarehouse: this.f['toWarehouse'].value || undefined,
      status: this.f['status'].value || undefined,
      batchId: this.f['batchId'].value?.trim() || undefined,
      unitId: (this.validatedUnitId && this.unitIdField?.isValid) ? this.validatedUnitId : undefined,
      fromDate: fromDate ? fromDate.format('YYYY-MM-DD') : undefined,
      toDate: toDate ? toDate.format('YYYY-MM-DD') : undefined
    };

    this.executeSearch(query);
  }

  /**
   * Execute search with query parameters
   */
  private executeSearch(query: LabWhTransQueryDto): void {
    this.loading.set(true);
    this.error.set(null);
    this.selectedBatch.set(null);
    this.units.set([]);

    this.apiService.queryTransfers(query, 1000, 0)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.batches.set(response.data || []);
          this.hasSearched.set(true);
          this.loading.set(false);

          if (response.data.length === 0) {
            this.snackbarService.showSuccess('No batches found matching criteria');
          }
        },
        error: (err) => {
          this.loading.set(false);
          this.hasSearched.set(true);
          const errorMsg = this.getErrorMessage(err);
          this.error.set(errorMsg);
          this.snackbarService.showError(errorMsg);
        }
      });
  }

  /**
   * Handle clear all button click
   * Resets form and clears all data
   */
  onUnitValidated(data: any): void {
    this.validatedUnitId = data.parsedUnitId;
    this.updateFormDirty();
  }

  onUnitCleared(): void {
    this.validatedUnitId = null;
    this.updateFormDirty();
  }

  onClearAll(): void {
    this.searchForm.reset();
    this.batches.set([]);
    this.selectedBatch.set(null);
    this.units.set([]);
    this.unitsDataSource = [];
    this.hasSearched.set(false);
    this.error.set(null);
    this.validatedUnitId = null;
    this.formDirty.set(false);
    this.unitIdField?.clear();
  }

  private updateFormDirty(): void {
    const v = this.searchForm.value;
    const hasValue = !!v.fromWarehouse || !!v.toWarehouse || !!v.status ||
      !!v.batchId?.trim() || !!v.fromDate || !!v.toDate || !!this.validatedUnitId;
    this.formDirty.set(hasValue);
  }

  /**
   * Handle batch selection from list
   * Loads complete batch data with unit details
   */
  onSelectBatch(batch: LabWhTransHdrDto): void {
    this.selectedBatch.set(batch);
    this.loadBatchDetails(batch.batchId);
  }

  /**
   * Load complete batch details including units
   */
  private loadBatchDetails(batchId: string): void {
    this.loadingBatchDetails.set(true);
    this.units.set([]);

    this.apiService.getComplete(batchId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (complete) => {
          this.selectedBatch.set(complete.header);
          this.units.set(complete.details || []);
          this.unitsDataSource = complete.details || [];
          this.loadingBatchDetails.set(false);
        },
        error: (err) => {
          this.loadingBatchDetails.set(false);
          this.snackbarService.showError(this.getErrorMessage(err));
        }
      });
  }

  /**
   * Check if batch is selected (for highlighting)
   */
  isBatchSelected(batch: LabWhTransHdrDto): boolean {
    return this.selectedBatch()?.batchId === batch.batchId;
  }

  /**
   * Get status badge CSS class
   */
  getStatusClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'RECON':
        return 'status-recon';
      case 'OPEN':
        return 'status-open';
      case 'CLOSED':
      case 'CLOSE':
        return 'status-closed';
      default:
        return '';
    }
  }

  /**
   * Open receive temperature dialog
   */
  onViewReceiveTemperature(): void {
    if (!this.selectedBatch()) return;
    this.receiveTemperaturePanel.open();
  }

  onCloseReceiveTemperature(): void {
    this.receiveTemperaturePanel.close();
  }

  /**
   * Format date for display (DD-MMM-YYYY)
   */
  formatDate(value: string | null): string {
    if (!value) return '-';
    const m = moment(value);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : '-';
  }

  /**
   * Format temperature for display
   */
  formatTemperature(temp: number | null): string {
    if (temp === null || temp === undefined) return '-';
    return `${temp}°C`;
  }

  /**
   * Get transfer direction text
   */
  getTransferDirection(batch: LabWhTransHdrDto): string {
    const from = batch.fromWarehouse || '-';
    const to = batch.toWarehouse || '-';
    return `${from} →${to}`;
  }

  private getErrorMessage(error: any): string {
    if (error?.error?.errorResponse?.errorCode && error?.error?.errorResponse?.error) {
      return `Error ${error.error.errorResponse.errorCode}: ${error.error.errorResponse.error}`;
    }
    if (error?.error?.errorCode && error?.error?.message) {
      return `Error ${error.error.errorCode}: ${error.error.message}`;
    }
    if (error?.status === 404) {
      return error?.error?.message || 'Batch not found.';
    }
    return error?.error?.message || 'An error occurred. Please try again.';
  }

  /**
   * Handle table page change
   */
  onTablePageChange(event: TablePageEvent): void {
    // DataTable handles pagination internally with unitsDataSource
    // No server-side pagination needed for unit details
  }

  onTableSortChange(event: TableSortEvent): void {
    this.unitsTableConfig = {
      ...this.unitsTableConfig,
      sortConfig: { column: event.column, direction: event.direction }
    };

    if (event.direction === 'default') {
      this.unitsDataSource = [...this.units()];
      return;
    }

    const sorted = [...this.unitsDataSource].sort((a: any, b: any) => {
      const valA = (a[event.column] ?? '').toString().toLowerCase();
      const valB = (b[event.column] ?? '').toString().toLowerCase();
      const cmp = valA.localeCompare(valB);
      return event.direction === 'A' ? cmp : -cmp;
    });
    this.unitsDataSource = sorted;
  }
}
