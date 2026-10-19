import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  computed,
  inject,
  ViewChild,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormControl,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { Subject, startWith } from 'rxjs';
import { takeUntil, switchMap, catchError } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TableSortEvent } from '@shared/interfaces/data-table.interface';
import { UnitIdFieldComponent } from '@shared/components/unit-id-field/unit-id-field.component';
import { UnitValidationResponse } from '@shared/components/unit-id-field/unit-id-field.model';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { SnackbarService } from '@shared/services/snackbar.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { terminationAfterEffectiveValidator } from '@shared/validators/date.validators';
import { dateFormatValidator } from '@core/utils/date-adapter.util';

import { SampleTransferQueryService } from './services/sample-transfer-query.service';
import {
  ContractOption,
  TestIdOption,
  FacilityOption,
  SampleTransferQueryRequest,
  SampleTransferQueryResponse,
  SampleTransferDisplay
} from './models/sample-transfer-query.model';
import moment from 'moment';

/**
 * Sample Transfer Out not Checked In Query Component
 * MLT-13434 - SAMPTQ - RGQCKPND
 *
 * Query regional sample transfers that have been shipped out but not checked in
 */
@Component({
  selector: 'app-sample-transfer-out-not-checked-in-query',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
    MatIconModule,
    MatProgressSpinnerModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    UnitIdFieldComponent
  ],
  templateUrl: './sample-transfer-out-not-checked-in-query.html',
  styleUrl: './sample-transfer-out-not-checked-in-query.scss',
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }
  ]
})
export class SampleTransferOutNotCheckedInQueryComponent implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `sample-transfer-query-${SampleTransferOutNotCheckedInQueryComponent.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(SampleTransferQueryService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly headerService = inject(HeaderService);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);
  private readonly destroy$ = new Subject<void>();

  constructor() {
    // Update header config dynamically from menu-items API response
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          ...this.headerConfig,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null }
          ],
          title: pageData.title,
          subtitle: pageData.subtitle || ''
        };
      }
    });
  }

  @ViewChild('unitIdField') unitIdField!: UnitIdFieldComponent;

  /** Tracks which date field was last changed — cross-field error shows only on that field */
  private lastChangedDateField: 'from' | 'to' | null = null;

  // Error matchers for date fields
  fromDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getFromDateError());
  toDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getToDateError());

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
    actions: []
  };

  // Unit ID label without required marker (all fields are optional per FMB)
  readonly unitIdLabel = 'Unit ID';

  // Signal-based state
  protected readonly loading = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);
  protected readonly submitted = signal<boolean>(false);
  protected readonly hasSearched = signal<boolean>(false);
  protected readonly hasFormValue = signal<boolean>(false);

  // Sort state for server-side sorting
  protected readonly sortOrder = signal<'ASC' | 'DESC' | null>(null);
  protected readonly sortColumn = signal<string | null>(null);

  // Pagination state for server-side paging
  protected readonly pageSize = signal<number>(25);
  protected readonly pageIndex = signal<number>(0);

  // Disable retrieve button when form is empty/pristine
  protected readonly isRetrieveDisabled = computed(() => {
    return this.loading() || !this.hasFormValue();
  });

  // Dropdown data signals
  protected readonly contracts = signal<ContractOption[]>([]);
  protected readonly contractsLoading = signal<boolean>(false);
  protected readonly testIds = signal<TestIdOption[]>([]);
  protected readonly testIdsLoading = signal<boolean>(false);
  protected readonly facilities = signal<FacilityOption[]>([]);
  protected readonly facilitiesLoading = signal<boolean>(false);

  // Contract searchable dropdown
  contractSearchCtrl = new FormControl('');
  contractSearchSignal = toSignal(
    this.contractSearchCtrl.valueChanges.pipe(startWith('')),
    { initialValue: '' }
  );

  filteredContracts = computed(() => {
    const searchTerm = this.contractSearchSignal()?.toLowerCase() || '';
    const options = this.contracts();
    if (!searchTerm) return options;
    return options.filter(option =>
      option.contractId.toLowerCase().includes(searchTerm) ||
      option.company.toLowerCase().includes(searchTerm)
    );
  });

  // Test ID searchable dropdown
  testIdSearchCtrl = new FormControl('');
  testIdSearchSignal = toSignal(
    this.testIdSearchCtrl.valueChanges.pipe(startWith('')),
    { initialValue: '' }
  );

  filteredTestIds = computed(() => {
    const searchTerm = this.testIdSearchSignal()?.toLowerCase() || '';
    const options = this.testIds();
    if (!searchTerm) return options;
    return options.filter(option =>
      option.testId.toLowerCase().includes(searchTerm) ||
      option.testDesc?.toLowerCase().includes(searchTerm)
    );
  });

  // Facility From searchable dropdown
  facilityFromSearchCtrl = new FormControl('');
  facilityFromSearchSignal = toSignal(
    this.facilityFromSearchCtrl.valueChanges.pipe(startWith('')),
    { initialValue: '' }
  );

  filteredFacilitiesFrom = computed(() => {
    const searchTerm = this.facilityFromSearchSignal()?.toLowerCase() || '';
    const options = this.facilities();
    if (!searchTerm) return options;
    return options.filter(option =>
      option.code.toLowerCase().includes(searchTerm) ||
      option.codeDesc?.toLowerCase().includes(searchTerm)
    );
  });

  // Facility To searchable dropdown
  facilityToSearchCtrl = new FormControl('');
  facilityToSearchSignal = toSignal(
    this.facilityToSearchCtrl.valueChanges.pipe(startWith('')),
    { initialValue: '' }
  );

  filteredFacilitiesTo = computed(() => {
    const searchTerm = this.facilityToSearchSignal()?.toLowerCase() || '';
    const options = this.facilities();
    if (!searchTerm) return options;
    return options.filter(option =>
      option.code.toLowerCase().includes(searchTerm) ||
      option.codeDesc?.toLowerCase().includes(searchTerm)
    );
  });

  // Results data signals
  protected readonly allResults = signal<SampleTransferQueryResponse[]>([]);
  protected readonly totalRecords = computed(() => this.allResults().length);

  // Display results with formatted dates
  protected readonly displayResults = computed<SampleTransferDisplay[]>(() => {
    return this.allResults().map(result => ({
      ...result,
      checkedInTimeFormatted: this.formatDateTime(result.checkedInTime),
      collDateFormatted: this.formatDateTime(result.collDate)
    }));
  });

  // Search form
  searchForm!: FormGroup;

  // Data table configuration
  tableConfig: DataTableConfig<SampleTransferDisplay> = {
    columns: [
      { key: 'unitId', header: 'Unit ID', sortable: true },
      { key: 'contractId', header: 'Contract ID', sortable: false },
      { key: 'sampleType', header: 'Sample Type', sortable: false },
      { key: 'frozenFlag', header: 'Frozen', sortable: false },
      { key: 'shippedOutFacility', header: 'From Location', sortable: false },
      { key: 'checkedInTimeFormatted', header: 'Checked In Time', sortable: false },
      { key: 'boxId', header: 'Box ID', sortable: false },
      { key: 'collDateFormatted', header: 'Coll Date', sortable: false },
      { key: 'elapsedTime', header: 'Elapsed Time', sortable: false }
    ],
    pagination: {
      pageSize: 25,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50, 100]
    },
    sortConfig: {
      column: 'unitId',
      direction: 'default'
    },
    emptyMessage: 'No Results to Display',
    emptySubMessage: 'No records found for the selected criteria',
    noDataIcon: 'edit'
  };

  maxDate = computed(() => {
    const chapterDate = this.chapterTimezoneService.chapterLocalDate();
    if (chapterDate && chapterDate.isValid()) {
      return chapterDate.toDate();
    }
    return new Date();
  });

  get f() {
    return this.searchForm.controls;
  }

  ngOnInit(): void {
    this.initializeForm();
    this.loadDropdownData();
    this.setupPageHeader();
    this.setupFormValueChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.searchForm = this.fb.group({
      unitId: [''],
      contractId: ['', [Validators.maxLength(9)]],
      testId: [''],
      facilityFrom: [''],
      facilityTo: [''],
      fromDate: [null as Date | null],
      toDate: [null as Date | null]
    }, {
      validators: [
        DateFieldValidationUtility.crossFieldDateRangeValidator('fromDate', 'toDate'),
        this.facilityValidator.bind(this)
      ]
    });

    // Setup date validators using the same utility method as HLA Antigens
    // This sets up dateFormatValidator and validDateValidator for both date fields
    const fromDateControl = this.searchForm.get('fromDate');
    const toDateControl = this.searchForm.get('toDate');

    if (fromDateControl) {
      fromDateControl.setValidators([
        dateFormatValidator(),
        DateFieldValidationUtility.validDateValidator()
      ]);
      fromDateControl.updateValueAndValidity();
    }

    if (toDateControl) {
      toDateControl.setValidators([
        dateFormatValidator(),
        DateFieldValidationUtility.validDateValidator()
      ]);
      toDateControl.updateValueAndValidity();
    }

    // Subscribe to fromDate changes to re-validate toDate (like Effective/Termination pattern)
    this.searchForm.get('fromDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const toDateControl = this.searchForm.get('toDate');
        if (toDateControl?.value) {
          toDateControl.updateValueAndValidity();
        }
      });
  }

  private setupPageHeader(): void {
    // Page header is dynamically updated via effect() in constructor
    // The effect watches pageHeaderService.pageHeaderData() and updates breadcrumbs, title, and subtitle
    // from the menu-items API response (like Valid Reagent Codes pattern)
  }

  private setupFormValueChanges(): void {
    // Subscribe to form value changes to enable/disable RETRIEVE button
    this.searchForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const formValue = this.searchForm.value;

        // Check date pair requirement: both dates must be provided together or both empty
        const hasFromDate = !!formValue.fromDate;
        const hasToDate = !!formValue.toDate;
        const datePairValid = (hasFromDate && hasToDate) || (!hasFromDate && !hasToDate);

        // Check if at least one non-date field has a value OR both dates are provided
        const hasNonDateValue =
          formValue.unitId ||
          formValue.contractId ||
          formValue.testId ||
          formValue.facilityFrom ||
          formValue.facilityTo;

        const hasBothDates = hasFromDate && hasToDate;
        const hasAnyValue = hasNonDateValue || hasBothDates;

        // Enable button if:
        // 1. At least one field (or both dates) has a value
        // 2. Form is valid
        // 3. Date pair requirement is met (both or neither)
        this.hasFormValue.set(!!hasAnyValue && this.searchForm.valid && datePairValid);
      });
  }

  private loadDropdownData(): void {
    // Load contracts
    this.contractsLoading.set(true);
    this.apiService.getContracts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.contracts.set(data);
          this.contractsLoading.set(false);
        },
        error: (error) => {
          this.snackbarService.showError('Failed to load contracts');
          this.contractsLoading.set(false);
        }
      });

    // Load test IDs
    this.testIdsLoading.set(true);
    this.apiService.getTestIds()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.testIds.set(data);
          this.testIdsLoading.set(false);
        },
        error: (error) => {
          this.snackbarService.showError('Failed to load test IDs');
          this.testIdsLoading.set(false);
        }
      });

    // Load facilities
    this.facilitiesLoading.set(true);
    this.apiService.getFacilities()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.facilities.set(data);
          this.facilitiesLoading.set(false);
        },
        error: (error) => {
          this.snackbarService.showError('Failed to load facilities');
          this.facilitiesLoading.set(false);
        }
      });
  }


  /**
   * Form-group-level validator: To Date cannot be earlier than From Date
   * Follows same pattern as terminationAfterEffectiveValidator
   * Sets error directly on the toDate control for proper field-level error display
   */
  private toDateAfterFromDateValidator(): (control: AbstractControl) => ValidationErrors | null {
    return (control: AbstractControl): ValidationErrors | null => {
      const fromDateControl = control.get('fromDate');
      const toDateControl = control.get('toDate');

      if (!fromDateControl || !toDateControl) {
        return null;
      }

      const fromDate = fromDateControl.value;
      const toDate = toDateControl.value;

      // If either date is not set, clear any previous error and don't validate
      if (!fromDate || !toDate) {
        this.clearToBeforeFromError(toDateControl);
        return null;
      }

      // Convert to moment objects for comparison
      const from = moment.isMoment(fromDate) ? fromDate : moment(fromDate);
      const to = moment.isMoment(toDate) ? toDate : moment(toDate);

      // Compare dates only (not times)
      const fromDay = moment(from).startOf('day');
      const toDay = moment(to).startOf('day');

      if (toDay.isBefore(fromDay)) {
        // Set error on toDate control
        const currentErrors = toDateControl.errors || {};
        toDateControl.setErrors(
          { ...currentErrors, toBeforeFrom: true }
        );
        // Return null so the form itself is NOT invalid
        return null;
      }

      // Clear the error if dates are valid
      this.clearToBeforeFromError(toDateControl);
      return null;
    };
  }

  /**
   * Helper function to clear the toBeforeFrom error from toDate control
   * while preserving other errors
   */
  private clearToBeforeFromError(control: AbstractControl): void {
    if (control.hasError('toBeforeFrom')) {
      const errors = { ...control.errors };
      delete errors['toBeforeFrom'];
      control.setErrors(
        Object.keys(errors).length > 0 ? errors : null
      );
    }
  }


  /**
   * Custom validator: Facility From cannot equal Facility To
   */
  private facilityValidator(control: AbstractControl): ValidationErrors | null {
    const formGroup = control as FormGroup;
    const facilityFrom = formGroup.get('facilityFrom')?.value;
    const facilityTo = formGroup.get('facilityTo')?.value;

    if (facilityFrom && facilityTo && facilityFrom === facilityTo) {
      return { facilitySame: true };
    }

    return null;
  }

  /**
   * Handle Unit ID validation from child component
   */
  onUnitIdValidated(data: UnitValidationResponse): void {
    this.searchForm.patchValue({
      unitId: data.parsedUnitId
    });
  }

  /**
   * Handle Unit ID clear from child component
   */
  onUnitIdCleared(): void {
    this.searchForm.patchValue({
      unitId: ''
    });
  }

  /**
   * Handle from date input for validation (keyboard typing)
   * Uses same pattern as HLA Antigens dialog
   */
  onFromDateInput(event: Event): void {
    this.lastChangedDateField = 'from';
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value,
      this.searchForm.get('fromDate')
    );
  }

  /**
   * Handle to date input for validation (keyboard typing)
   * Uses same pattern as HLA Antigens dialog
   */
  onToDateInput(event: Event): void {
    this.lastChangedDateField = 'to';
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value,
      this.searchForm.get('toDate'),
      false // Not edit mode - both dates are optional
    );
  }

  /**
   * Handle from date change - triggers to date revalidation
   */
  onFromDateChange(): void {
    this.lastChangedDateField = 'from';
    const fromDateControl = this.searchForm.get('fromDate');
    const toDateControl = this.searchForm.get('toDate');

    fromDateControl?.markAsTouched();

    // Re-validate to date when from date changes
    if (toDateControl?.value) {
      toDateControl.updateValueAndValidity();
    }
  }

  /**
   * Handle to date change - triggers validation
   */
  onToDateChange(): void {
    this.lastChangedDateField = 'to';
    this.searchForm.get('toDate')?.markAsTouched();
  }

  /**
   * Get from date error message using DateFieldValidationUtility
   * Matches pattern from HLA Antigens dialog
   */
  getFromDateError(): string {
    const formErrors = this.lastChangedDateField === 'from' ? this.searchForm.errors : null;
    return DateFieldValidationUtility.getStartDateCrossFieldError(
      this.searchForm.get('fromDate'),
      'From Date',
      'To Date',
      formErrors
    );
  }

  /**
   * Get to date error message using DateFieldValidationUtility
   * Matches pattern from HLA Antigens dialog
   */
  getToDateError(): string {
    const formErrors = this.lastChangedDateField === 'to' ? this.searchForm.errors : null;
    return DateFieldValidationUtility.getEndDateCrossFieldError(
      this.searchForm.get('toDate'),
      'To Date',
      'From Date',
      formErrors
    );
  }

  /**
   * Execute search query
   */
  onRetrieve(): void {
    this.submitted.set(true);
    this.searchForm.updateValueAndValidity();

    if (this.searchForm.invalid) {
      this.snackbarService.showError('Please correct the errors in the form');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const formValue = this.searchForm.value;
    const request: SampleTransferQueryRequest = {
      unitId: formValue.unitId || null,
      contractId: formValue.contractId || null,
      testId: formValue.testId || null,
      facilityFrom: formValue.facilityFrom || null,
      facilityTo: formValue.facilityTo || null,
      fromDate: formValue.fromDate || null,
      toDate: formValue.toDate || null,
      sortOrder: this.sortOrder() || null,
      sortColumn: this.sortColumn() || null,
      take: this.pageSize(),
      skip: this.pageIndex() * this.pageSize()
    };

    this.apiService.query(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.allResults.set(response.data);
          this.hasSearched.set(true);
          this.loading.set(false);

          // Update pagination totalRecords with server total
          if (this.tableConfig.pagination) {
            this.tableConfig.pagination.totalRecords = response.total;
          }

          // Don't show success notification - user can see results count in the table
        },
        error: (error) => {
          this.error.set(error.error?.message || 'An error occurred while executing the query');
          this.snackbarService.showError(this.error()!);
          this.loading.set(false);
        }
      });
  }

  /**
   * Handle pagination change (server-side paging)
   */
  onPageChange(event: { pageSize: number; pageIndex: number }): void {
    this.pageSize.set(event.pageSize);
    this.pageIndex.set(event.pageIndex);

    // Update table config pagination (required for DataTable component to track state)
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = event.pageIndex;
      this.tableConfig.pagination.pageSize = event.pageSize;
    }

    this.onRetrieve(); // Reload data with new page
  }

  /**
   * Handle sort change for Unit ID column (server-side sorting)
   */
  onSortChange(event: TableSortEvent): void {
    // Update table config with new sort
    this.tableConfig = {
      ...this.tableConfig,
      sortConfig: { column: event.column, direction: event.direction }
    };

    // Map sort direction to API format (A -> ASC, D -> DESC, default -> null)
    if (event.direction === 'A' || event.direction === 'D') {
      this.sortOrder.set(event.direction === 'A' ? 'ASC' : 'DESC');
      this.sortColumn.set(event.column);
    } else {
      // Default - clear sort parameters to use backend default order
      this.sortOrder.set(null);
      this.sortColumn.set(null);
    }

    // Reset to first page when sorting changes
    this.pageIndex.set(0);
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    // Reload data from server with new sort parameters
    this.onRetrieve();
  }

  /**
   * Clear all form fields and results
   */
  onClearAll(): void {
    this.searchForm.reset();
    this.contractSearchCtrl.setValue('');
    this.testIdSearchCtrl.setValue('');
    this.facilityFromSearchCtrl.setValue('');
    this.facilityToSearchCtrl.setValue('');
    this.allResults.set([]);
    this.submitted.set(false);
    this.hasSearched.set(false);
    this.error.set(null);
    this.loading.set(false); // Stop loading spinner

    // Reset sort state
    this.sortOrder.set(null);
    this.sortColumn.set(null);

    // Reset pagination state
    this.pageIndex.set(0);
    this.pageSize.set(25);
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.totalRecords = 0;
      this.tableConfig.pagination.pageIndex = 0;
      this.tableConfig.pagination.pageSize = 25;
    }

    // Reset sort config in table
    if (this.tableConfig.sortConfig) {
      this.tableConfig.sortConfig.direction = 'default';
    }

    if (this.unitIdField) {
      this.unitIdField.clear();
    }
  }

  /**
   * Show empty state when no search has been performed
   */
  showEmptyState(): boolean {
    return !this.hasSearched() && !this.loading();
  }

  /**
   * Show no results state after search with no data
   */
  showNoResults(): boolean {
    return this.hasSearched() && this.allResults().length === 0 && !this.loading();
  }

  /**
   * Format datetime string to DD-MON-YYYY HH:MM
   */
  private formatDateTime(dateStr: string): string {
    if (!dateStr) return '';
    const parsed = moment(dateStr);
    return parsed.isValid() ? parsed.format('DD-MMM-YYYY HH:mm') : dateStr;
  }
}
