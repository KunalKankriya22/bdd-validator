import { Component, OnInit, OnDestroy, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject } from 'rxjs';
import { takeUntil, startWith, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import moment from 'moment';

import { TestKitReagentsQueryApiService } from './services/test-kit-reagents-query-api.service';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { dateFormatValidator } from 'src/app/core/utils/date-adapter.util';
import { PageHeaderService } from '@shared/services/page-header.service';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TableColumn,
  RowAction,
  TablePageEvent,
  TableRowActionEvent,
} from '@shared/interfaces/data-table.interface';

import {
  TestKitReagentResultDto,
  TestKitReagentQueryParams,
  ERROR_MESSAGES,
} from './models/test-kit-reagents-query.model';
import { ReagentsDialogComponent, ReagentsDialogData } from './dialogs/reagents-dialog/reagents-dialog';
import { BatchDetailsDialogComponent, BatchDetailsDialogData } from './dialogs/batch-details-dialog/batch-details-dialog';



@Component({
  selector: 'app-test-kit-reagents-query',
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
    MatTooltipModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    ReagentsDialogComponent,
    BatchDetailsDialogComponent,
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
  ],
  templateUrl: './test-kit-reagents-query.component.html',
  styleUrl: './test-kit-reagents-query.component.scss',
})
export class TestKitReagentsQueryComponent implements OnInit, OnDestroy {
  // Unique ID generation for accessibility
  private static nextId = 0;
  protected readonly componentId = `test-kit-reagents-query-${TestKitReagentsQueryComponent.nextId++}`;

  // Generate unique IDs for elements
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  // Dependency injection
  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(TestKitReagentsQueryApiService);
  private readonly pageHeaderService = inject(PageHeaderService);

  // Lifecycle management
  private readonly destroy$ = new Subject<void>();

  // Signal-based state
  protected readonly testKits = signal<TestKitReagentResultDto[]>([]);
  protected readonly loading = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);
  protected readonly submitted = signal<boolean>(false);
  protected readonly currentTestId = signal<string>('');
  protected readonly resultAnnouncement = signal<string>('');

  // Test ID dropdown state
  protected testIdOptions: Array<{testId: string, testDescription: string}> = [];
  protected filteredTestIdOptions: Array<{testId: string, testDescription: string}> = [];
  protected testIdSearchControl = new FormControl('');
  protected isLoadingTestIds = false;
  protected readonly selectPanelLoadingValue = '__LOADING__';
  protected readonly selectPanelEmptyValue = '__EMPTY__';

  // Computed values
  protected readonly isEmpty = computed(() => this.testKits().length === 0);
  protected readonly hasData = computed(() => this.testKits().length > 0);

  // Side panel state
  protected reagentsPanelRow: ReagentsDialogData | null = null;
  protected isReagentsPanelOpen = false;
  protected batchPanelRow: BatchDetailsDialogData | null = null;
  protected isBatchPanelOpen = false;

  /**
   * Check if CLEAR button should be disabled
   * Disabled when form is pristine or all fields are empty
   */
  protected get isClearDisabled(): boolean {
    const formValues = this.searchForm.value;
    return !formValues.testId &&
           !formValues.testIdDescription &&
           !formValues.fromDate &&
           !formValues.toDate &&
           this.testKits().length === 0;
  }

  // Form group
  searchForm!: FormGroup;

  // Date field error state matchers
  fromDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getFromDateError());
  toDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getToDateError());

  // Table configuration
  tableConfig: DataTableConfig<TestKitReagentResultDto> = {
    columns: [],
    rowActions: [],
    showPagination: true
  };

  // Table data source
  dataSource: TestKitReagentResultDto[] = [];

  // Page header configuration
  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/' },
      { label: 'Test Kit Reagents Query', link: '' },
    ],
    title: 'Test Kit Reagents Query',
    subtitle: '',
    actions: [],
  };

  // Today's date for date validation
  protected readonly today = moment().startOf('day');

  constructor() {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          ...this.headerConfig,
          title: pageData.title,
          subtitle: pageData.subtitle || '',
        };
      }
    });
  }

  ngOnInit(): void {
    this.initForms();
    this.initializeTableConfig();
    this.loadTestIds();
    this.setupTestIdSearch();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForms(): void {
    this.searchForm = this.fb.group({
      testId: ['', [Validators.required, Validators.maxLength(10)]],
      testIdDescription: [{ value: '', disabled: true }],
      fromDate: [null, [dateFormatValidator(), DateFieldValidationUtility.validDateValidator()]],
      toDate: [null, [dateFormatValidator(), DateFieldValidationUtility.validDateValidator()]],
    }, {
      validators: [DateFieldValidationUtility.fromToDateRangeValidator('fromDate', 'toDate')]
    });
  }

  private initializeTableConfig(): void {
    this.tableConfig = {
      columns: this.getTableColumns(),
      rowActions: this.getRowActions(),
      pagination: {
        pageSize: 25,
        pageIndex: 0,
        totalRecords: 0,
        pageSizeOptions: [10, 25, 50, 100],
        showFirstLastButtons: true
      },
      stickyHeader: true,
      stickyActionsColumn: false,
      showActionsAsMenu: true,
      hideActionsTooltip: true,
      emptyMessage: 'No test kits found',
      loadingMessage: 'Loading test kits...',
      showPagination: true
    };
  }

  private getTableColumns(): TableColumn<TestKitReagentResultDto>[] {
    return [
      {
        key: 'testKitId',
        header: 'Test Kit ID',
        sortable: false,
        width: '140px'
      },
      {
        key: 'insertDate',
        header: 'Creation Date',
        sortable: false,
        width: '140px',
        valueFormatter: (value) => this.formatDate(value)
      },
      {
        key: 'qcExpiryDate',
        header: 'QC Exp Date',
        sortable: false,
        width: '140px',
        valueFormatter: (value) => this.formatDate(value)
      },
      {
        key: 'apprLicFlag',
        header: 'Appr/Lic Flag',
        sortable: false,
        width: '140px',
        valueFormatter: (value) => this.getApprLicFlagDisplay(value)
      },
      {
        key: 'isQcIncomplete',
        header: 'Reason',
        sortable: false,
        width: '140px',
        valueFormatter: (value) => this.getReasonDisplay(value)
      }
    ];
  }

  private getRowActions(): RowAction<TestKitReagentResultDto>[] {
    return [
      {
        label: 'See Reagents',
        ariaLabel: 'See reagents for test kit {{testKitId}}',
        action: 'see-reagents'
      },
      {
        label: 'Batch Details',
        ariaLabel: 'View batch details for test kit {{testKitId}}',
        action: 'batch-details'
      }
    ];
  }

  // Form getter
  get sf() {
    return this.searchForm.controls;
  }

  /**
   * Clear all search criteria
   */
  protected onClear(): void {
    this.submitted.set(false);
    this.error.set(null);
    this.currentTestId.set('');
    this.resultAnnouncement.set('');
    this.searchForm.reset();
    Object.keys(this.searchForm.controls).forEach(key => {
      this.searchForm.get(key)?.setErrors(null);
      this.searchForm.get(key)?.markAsUntouched();
      this.searchForm.get(key)?.markAsPristine();
    });
    this.testKits.set([]);
    this.dataSource = [];
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.totalRecords = 0;
      this.tableConfig.pagination.pageIndex = 0;
    }
  }

  /**
   * Search for test kits
   */
  protected onSearch(): void {
    this.submitted.set(true);

    // Validate search form
    if (this.searchForm.invalid) {
      const firstInvalid = document.querySelector('.ng-invalid[formControlName]');
      if (firstInvalid) {
        (firstInvalid as HTMLElement).focus();
      }
      return;
    }

    this.loadTestKits();
  }

  /**
   * Load test kits from API
   */
  private loadTestKits(): void {
    const testId = this.searchForm.get('testId')?.value?.trim();
    if (!testId) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.currentTestId.set(testId);

    // Build query parameters
    const params: TestKitReagentQueryParams = {
      testId: testId,
    };

    // Add optional filters
    const fromDate = this.searchForm.get('fromDate')?.value;
    if (fromDate) {
      params.fromDate = moment(fromDate).format('YYYY-MM-DD');
    }

    const toDate = this.searchForm.get('toDate')?.value;
    if (toDate) {
      params.toDate = moment(toDate).format('YYYY-MM-DD');
    }

    this.apiService
      .getTestKits(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.testKits.set(data);
          this.dataSource = data;
          if (this.tableConfig.pagination) {
            this.tableConfig.pagination.totalRecords = data.length;
          }
          this.loading.set(false);
          this.resultAnnouncement.set(
            data.length > 0
              ? `Found ${data.length} test kit${data.length === 1 ? '' : 's'}.`
              : 'No test kits found.'
          );
        },
        error: (err) => {
          const errorMessage =
            err?.error?.errorResponse?.error || err?.error?.message || ERROR_MESSAGES.LOAD_ERROR;
          this.error.set(errorMessage);
          this.loading.set(false);
          this.testKits.set([]);
          this.dataSource = [];
          if (this.tableConfig.pagination) {
            this.tableConfig.pagination.totalRecords = 0;
          }
          this.resultAnnouncement.set(errorMessage);
        },
      });
  }

  /**
   * Handle page change
   */
  protected onPageChange(event: TablePageEvent): void {
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = event.pageIndex;
      this.tableConfig.pagination.pageSize = event.pageSize;
    }
  }

  /**
   * Handle row action click
   */
  protected onRowAction(event: TableRowActionEvent<TestKitReagentResultDto>): void {
    if (event.action === 'see-reagents') {
      this.onSeeReagents(event.row);
    } else if (event.action === 'batch-details') {
      this.onBatchDetails(event.row);
    }
  }

  protected onSeeReagents(testKit: TestKitReagentResultDto): void {
    this.reagentsPanelRow = {
      testKitId: testKit.testKitId,
      testId: this.currentTestId(),
    };
    this.isReagentsPanelOpen = true;
  }

  protected closeReagentsPanel(): void {
    this.isReagentsPanelOpen = false;
    this.reagentsPanelRow = null;
  }

  protected onBatchDetails(testKit: TestKitReagentResultDto): void {
    this.batchPanelRow = { testKitId: testKit.testKitId };
    this.isBatchPanelOpen = true;
  }

  protected closeBatchPanel(): void {
    this.isBatchPanelOpen = false;
    this.batchPanelRow = null;
  }

  /**
   * Format date for display (DD-MMM-YYYY)
   */
  protected formatDate(value: string | null): string {
    if (!value) return '--';
    const m = moment(value);
    return m.isValid() ? m.format('DD-MMM-YYYY HH:mm').toUpperCase() : value;
  }

  /**
   * Get display value for Appr/Lic Flag
   */
  protected getApprLicFlagDisplay(flag: string): string {
    return flag === 'Y' ? 'Y' : flag === 'N' ? 'N' : flag;
  }

  /**
   * Get display value for Reason (QC Incomplete)
   */
  protected getReasonDisplay(isQcIncomplete: boolean): string {
    return isQcIncomplete ? 'QC Incomplete' : '';
  }

  /**
   * Date change handlers for validation
   */
  protected onFromDateChange(): void {
    this.searchForm.get('toDate')?.updateValueAndValidity();
  }

  protected onToDateChange(): void {
    this.searchForm.get('fromDate')?.updateValueAndValidity();
  }

  protected onFromDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value,
      this.searchForm.get('fromDate')
    );
  }

  protected onToDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value,
      this.searchForm.get('toDate')
    );
  }

  protected getFromDateError(): string {
    return DateFieldValidationUtility.getDateErrorMessage(
      this.searchForm.get('fromDate'),
      this.searchForm.errors,
      'From Date'
    );
  }

  protected getToDateError(): string {
    return DateFieldValidationUtility.getDateErrorMessage(
      this.searchForm.get('toDate'),
      this.searchForm.errors,
      'To Date',
      'To Date must be on or after From Date'
    );
  }

  /**
   * Load Test IDs for dropdown from last 21 days
   */
  private loadTestIds(): void {
    this.isLoadingTestIds = true;

    this.apiService
      .getTestIdsLov()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: Array<{testId: string, testDescription: string}>) => {
          this.testIdOptions = data || [];
          this.filteredTestIdOptions = this.testIdOptions;
          this.isLoadingTestIds = false;
        },
        error: (err: unknown) => {
          console.error('Failed to load test IDs:', err);
          this.testIdOptions = [];
          this.filteredTestIdOptions = [];
          this.isLoadingTestIds = false;
        },
      });
  }

  /**
   * Setup search functionality for Test ID dropdown
   */
  private setupTestIdSearch(): void {
    this.testIdSearchControl.valueChanges
      .pipe(
        startWith(''),
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe((searchText) => {
        this.filterTestIds(searchText || '');
      });
  }

  /**
   * Filter Test ID options based on search text
   */
  private filterTestIds(searchText: string): void {
    if (!searchText) {
      this.filteredTestIdOptions = this.testIdOptions;
      return;
    }

    const search = searchText.toLowerCase();
    this.filteredTestIdOptions = this.testIdOptions.filter(
      (option) =>
        option.testId.toLowerCase().includes(search) ||
        option.testDescription?.toLowerCase().includes(search)
    );
  }

  /**
   * Handle Test ID selection change
   */
  protected onTestIdChange(testId: string): void {
    const selectedOption = this.testIdOptions.find(opt => opt.testId === testId);
    if (selectedOption) {
      this.searchForm.patchValue({
        testIdDescription: selectedOption.testDescription || ''
      });
    } else {
      this.searchForm.patchValue({
        testIdDescription: ''
      });
    }
  }
}
