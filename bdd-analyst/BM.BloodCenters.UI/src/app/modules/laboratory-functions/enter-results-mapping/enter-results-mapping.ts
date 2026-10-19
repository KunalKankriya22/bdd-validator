import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule, FormControl } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import moment from 'moment';

// Angular Material imports
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, ErrorStateMatcher } from '@angular/material/core';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

// Shared components and services
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { SnackbarService } from '@shared/services/snackbar.service';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';

// Module-specific imports
import { EnterResultsMappingApiService } from './services/enter-results-mapping-api.service';
import {
  CreateRgtResultsMatrixRequestDto,
  UpdateRgtResultsMatrixRequestDto,
  ContractDropdownDto,
  TestDropdownDto,
  ResultStatusDropdownDto,
  ResultMappingRow
} from './models/enter-results-mapping.model';

/**
 * Enter Results Mapping Component
 * Maps external blood bank codes to internal testing facility codes
 * JIRA: MLT-12645
 */
@Component({
  selector: 'app-enter-results-mapping',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDatepickerModule,
    MatDialogModule,
    MatTooltipModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './enter-results-mapping.html',
  styleUrl: './enter-results-mapping.scss'
})
export class EnterResultsMapping implements OnInit, OnDestroy {
  // Unique ID generation for accessibility
  private static nextId = 0;
  protected readonly componentId = `enter-results-mapping-${EnterResultsMapping.nextId++}`;

  // ID generator methods
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  // Dependency injection
  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(EnterResultsMappingApiService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly headerService = inject(HeaderService);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);
  private readonly destroy$ = new Subject<void>();

  // Signal-based state
  protected readonly loading = signal<boolean>(false);
  protected readonly loadingDropdowns = signal<boolean>(false);
  protected readonly saving = signal<boolean>(false);
  protected readonly contracts = signal<ContractDropdownDto[]>([]);
  protected readonly tests = signal<TestDropdownDto[]>([]);
  protected readonly localResults = signal<ResultStatusDropdownDto[]>([]);
  protected readonly cbcResults = signal<ResultStatusDropdownDto[]>([]);
  protected readonly mappings = signal<ResultMappingRow[]>([]);
  protected readonly selectedContractId = signal<string | null>(null);
  protected readonly selectedTestId = signal<string | null>(null);
  protected readonly selectedCbcTestId = signal<string | null>(null); // Gap #3 fix: Store CBC Test ID

  // Sort
  sortDirection: 'default' | 'asc' | 'desc' = 'default';
  private unsortedRows: ResultMappingRow[] = [];

  // Search controls for dropdowns
  contractSearchControl = new FormControl<string>('');
  testSearchControl = new FormControl<string>('');
  localResultSearchControl = new FormControl<string>('');
  cbcResultSearchControl = new FormControl<string>('');

  // Filtered options
  filteredContracts = signal<ContractDropdownDto[]>([]);
  filteredTests = signal<TestDropdownDto[]>([]);
  filteredLocalResults = signal<ResultStatusDropdownDto[]>([]);
  filteredCbcResults = signal<ResultStatusDropdownDto[]>([]);

  // Sentinel values for disabled mat-option rows
  readonly selectPanelLoadingValue = '__SELECT_PANEL_LOADING__';
  readonly selectPanelEmptyValue = '__SELECT_PANEL_EMPTY__';

  // Computed values
  protected readonly contractDescription = computed(() => {
    const contractId = this.selectedContractId();
    if (!contractId) return '-';

    const contract = this.contracts().find(c => c.contractId === contractId);
    if (!contract) return '-';

    return contract.isInternal
      ? contract.chapter || '-'
      : contract.company || '-';
  });

  // Gap #3 fix: CBC Test ID now computed from signal instead of placeholder
  protected readonly cbcTestId = computed(() => {
    return this.selectedCbcTestId() || '-';
  });

  protected readonly hasData = computed(() => this.mappings().length > 0);
  protected readonly hasDirtyRows = computed(() =>
    this.mappings().some(m =>
      m.isDirty || (m.isNew && !!(m.testId || m.resultStatus || m.cbcResultStatus || m.effDate || m.termDate)) || m.isDeleted
    )
  );
  protected readonly canRetrieve = computed(() => this.selectedContractId() !== null);
  protected readonly canClearFilters = computed(() =>
    this.selectedContractId() !== null || this.selectedTestId() !== null
  );
  protected readonly canSave = computed(() => !this.saving());

  // Forms
  filterForm!: FormGroup;

  // Page header configuration
  pageHeaderConfig: PageHeaderConfig = this.getPageHeaderConfig();

  private getPageHeaderConfig(): PageHeaderConfig {
    const menuItem = this.pageHeaderService.getCurrentMenuItem();
    const title = menuItem?.label || 'Enter Results Mapping';
    return {
      breadcrumbs: [
        { label: 'Home', link: '/home' },
        { label: title, link: null }
      ]
    };
  }

  // Date formatting and validation
  protected readonly formatDate = (value: any): string => {
    return DateFieldValidationUtility.formatDateForUI(value) || '-';
  };

  effDateFilter = DateFieldValidationUtility.createEffectiveDateFilter(
    this.headerService.chapterTimeZone()
  );

  private termDateFilters = new Map<ResultMappingRow, (date: moment.Moment | null) => boolean>();

  /**
   * Get chapter local date with fallback and warning (Gap #8)
   */
  private getChapterLocalDate(): moment.Moment {
    const localDate = this.chapterTimezoneService.getChapterLocalDate();

    if (!localDate || !localDate.isValid()) {
      console.warn(
        'Chapter local date not available from ChapterTimezoneService, falling back to browser local time. ' +
        'This may cause timezone validation discrepancies for chapters with timezone enabled.'
      );
      return moment().startOf('day');
    }

    return localDate;
  }

  getTermDateFilter(row: ResultMappingRow): (date: moment.Moment | null) => boolean {
    if (!this.termDateFilters.has(row)) {
      this.termDateFilters.set(row, (date: moment.Moment | null): boolean => {
        if (!date) return true;
        try {
          const checkDate = moment(date).clone().startOf('day');
          const today = this.getChapterLocalDate();
          if (checkDate.isBefore(today)) return false;
          if (row.effDate) {
            const effMoment = moment.isMoment(row.effDate) ? (row.effDate as moment.Moment).clone() : moment(row.effDate);
            if (effMoment.isValid() && checkDate.isBefore(effMoment.clone().startOf('day'))) return false;
          }
          return true;
        } catch {
          return true;
        }
      });
    }
    return this.termDateFilters.get(row)!;
  }

  /**
   * Get test ID error message for a row
   */
  getTestIdError(row: ResultMappingRow): string {
    if (!row.isNew) return '';
    // Only show error if field has been touched
    if (!row.testIdTouched) return '';
    if (!row.testId) {
      return 'Test ID is required';
    }
    return '';
  }

  /**
   * Get local result error message for a row
   */
  getResultStatusError(row: ResultMappingRow): string {
    if (!row.isNew) return '';
    // Only show error if field has been touched
    if (!row.resultStatusTouched) return '';
    if (!row.resultStatus) {
      return 'Local Result is required';
    }
    return '';
  }

  /**
   * Get CBC result error message for a row
   */
  getCbcResultError(row: ResultMappingRow): string {
    if (!row.isNew) return '';
    // Only show error if field has been touched
    if (!row.cbcResultStatusTouched) return '';
    if (!row.cbcResultStatus) {
      return 'CBC Result is required';
    }
    return '';
  }

  /**
   * Get effective date error message for a row
   */
  getEffDateError(row: ResultMappingRow): string {
    // Only show errors if field has been touched
    if (!row.effDateTouched) return '';

    // For new rows, show required error
    if (row.isNew && !row.effDate) {
      return 'Effective Date is required';
    }

    // Raw input has text but datepicker couldn't parse → invalid date
    if (row.effDateRawInput?.trim() && !row.effDate) {
      return 'Effective Date is invalid';
    }

    // For existing rows, allow empty effective date (not required on update)
    if (!row.isNew && !row.effDate) return '';

    try {
      const effMoment = moment(row.effDate);
      if (!effMoment.isValid()) {
        return 'Effective Date is invalid';
      }

      const todayStart = this.getChapterLocalDate();

      // Gap #4 Fix: Apply past-date validation to both new AND existing rows (Oracle Forms error 5003)
      if (effMoment.clone().startOf('day').isBefore(todayStart)) {
        return 'Effective Date cannot be past date';
      }
    } catch {
      return 'Effective Date is invalid';
    }

    return '';
  }

  getTermDateError(row: ResultMappingRow): string {
    // Only show errors if field has been touched
    if (!row.termDateTouched) return '';

    // Raw input has text but datepicker couldn't parse → invalid date
    if (row.termDateRawInput?.trim() && !row.termDate) {
      return 'Termination Date is invalid';
    }

    // Allow empty termination date (it's optional)
    if (!row.termDate) return '';

    // Gap #9 Fix: Require Effective Date before Termination Date can be set (Oracle Forms validation)
    if (!row.effDate) {
      return 'Effective Date is required before Termination Date';
    }

    try {
      const termMoment = moment(row.termDate);
      if (!termMoment.isValid()) {
        return 'Termination Date is invalid';
      }

      const todayStart = this.getChapterLocalDate();

      if (termMoment.clone().startOf('day').isBefore(todayStart)) {
        return 'Termination Date cannot be past date';
      }

      if (row.effDate) {
        const effMoment = moment(row.effDate);
        if (effMoment.isValid() && termMoment.clone().startOf('day').isBefore(effMoment.clone().startOf('day'))) {
          return 'Termination Date must be >= Effective Date';
        }
      }
    } catch {
      return 'Termination Date is invalid';
    }

    return '';
  }

  /**
   * Handle effective date change
   */
  onEffDateChange(row: ResultMappingRow, value: any): void {
    row.effDateTouched = true;
    if (value) {
      const momentValue = moment.isMoment(value) ? value : moment(value);
      row.effDate = momentValue.isValid() ? momentValue : null;
      if (row.effDate) row.effDateRawInput = undefined;
    } else {
      row.effDate = null;
    }
    if (!row.isNew) {
      row.isDirty = true;
    }
    this.termDateFilters.delete(row);
    this.mappings.set([...this.mappings()]);
  }

  /**
   * Handle termination date change
   */
  onTermDateChange(row: ResultMappingRow, value: any): void {
    row.termDateTouched = true;
    if (value) {
      const momentValue = moment.isMoment(value) ? value : moment(value);
      row.termDate = momentValue.isValid() ? momentValue : null;
      if (row.termDate) row.termDateRawInput = undefined;
    } else {
      row.termDate = null;
    }
    if (!row.isNew) {
      row.isDirty = true;
    }
    this.mappings.set([...this.mappings()]);
  }

  /**
   * Handle effective date input - validate and mark as touched for error display
   */
  onEffDateInput(event: Event, row: ResultMappingRow): void {
    const value = (event.target as HTMLInputElement).value;
    row.effDateTouched = true;
    row.effDateRawInput = value;

    if (!row.isNew) {
      row.isDirty = true;
    }
    this.mappings.set([...this.mappings()]);
  }

  /**
   * Handle effective date blur - mark as touched
   */
  onEffDateBlur(row: ResultMappingRow): void {
    row.effDateTouched = true;
    this.mappings.set([...this.mappings()]);
  }

  /**
   * Handle termination date input - validate and mark as touched for error display
   */
  onTermDateInput(event: Event, row: ResultMappingRow): void {
    const value = (event.target as HTMLInputElement).value;
    row.termDateTouched = true;
    row.termDateRawInput = value;

    if (!row.isNew) {
      row.isDirty = true;
    }
    this.mappings.set([...this.mappings()]);
  }

  /**
   * Handle termination date blur - mark as touched
   */
  onTermDateBlur(row: ResultMappingRow): void {
    row.termDateTouched = true;
    this.mappings.set([...this.mappings()]);
  }

  /**
   * Check if a field is invalid for a row
   */
  isFieldInvalid(row: ResultMappingRow, field: string): boolean {
    if (field === 'testId') {
      return !!this.getTestIdError(row);
    }
    if (field === 'resultStatus') {
      return !!this.getResultStatusError(row);
    }
    if (field === 'cbcResultStatus') {
      return !!this.getCbcResultError(row);
    }
    if (field === 'effDate') {
      return !!this.getEffDateError(row);
    }
    if (field === 'termDate') {
      return !!this.getTermDateError(row);
    }
    return false;
  }

  private testIdMatchers = new Map<ResultMappingRow, ErrorStateMatcher>();
  private resultStatusMatchers = new Map<ResultMappingRow, ErrorStateMatcher>();
  private cbcResultStatusMatchers = new Map<ResultMappingRow, ErrorStateMatcher>();
  private effDateMatchers = new Map<ResultMappingRow, ErrorStateMatcher>();
  private termDateMatchers = new Map<ResultMappingRow, ErrorStateMatcher>();

  getTestIdMatcher(row: ResultMappingRow): ErrorStateMatcher {
    if (!this.testIdMatchers.has(row)) {
      this.testIdMatchers.set(row, {
        isErrorState: () => !!this.getTestIdError(row)
      });
    }
    return this.testIdMatchers.get(row)!;
  }

  getResultStatusMatcher(row: ResultMappingRow): ErrorStateMatcher {
    if (!this.resultStatusMatchers.has(row)) {
      this.resultStatusMatchers.set(row, {
        isErrorState: () => !!this.getResultStatusError(row)
      });
    }
    return this.resultStatusMatchers.get(row)!;
  }

  getCbcResultStatusMatcher(row: ResultMappingRow): ErrorStateMatcher {
    if (!this.cbcResultStatusMatchers.has(row)) {
      this.cbcResultStatusMatchers.set(row, {
        isErrorState: () => !!this.getCbcResultError(row)
      });
    }
    return this.cbcResultStatusMatchers.get(row)!;
  }

  getEffDateMatcher(row: ResultMappingRow): ErrorStateMatcher {
    if (!this.effDateMatchers.has(row)) {
      this.effDateMatchers.set(row, {
        isErrorState: () => !!this.getEffDateError(row)
      });
    }
    return this.effDateMatchers.get(row)!;
  }

  getTermDateMatcher(row: ResultMappingRow): ErrorStateMatcher {
    if (!this.termDateMatchers.has(row)) {
      this.termDateMatchers.set(row, {
        isErrorState: () => !!this.getTermDateError(row)
      });
    }
    return this.termDateMatchers.get(row)!;
  }

  ngOnInit(): void {
    this.initFilterForm();
    this.setupSearchControls();
    this.loadDropdowns();
    this.subscribeToChapterChanges();
  }

  /**
   * Setup search controls for all dropdowns
   */
  private setupSearchControls(): void {
    // Contract search
    this.contractSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((search) => {
        const term = (search ?? '').toLowerCase();
        this.filteredContracts.set(
          this.contracts().filter(c =>
            c.display.toLowerCase().includes(term)
          )
        );
      });

    // Test search
    this.testSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((search) => {
        const term = (search ?? '').toLowerCase();
        this.filteredTests.set(
          this.tests().filter(t =>
            t.display.toLowerCase().includes(term)
          )
        );
      });

    // Local result search
    this.localResultSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((search) => {
        const term = (search ?? '').toLowerCase();
        this.filteredLocalResults.set(
          this.localResults().filter(r =>
            r.resultStatus.toLowerCase().includes(term)
          )
        );
      });

    // CBC result search
    this.cbcResultSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((search) => {
        const term = (search ?? '').toLowerCase();
        this.filteredCbcResults.set(
          this.cbcResults().filter(r =>
            r.resultStatus.toLowerCase().includes(term)
          )
        );
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Subscribe to chapter changes from header
   * When chapter changes, clear all data and reload dropdowns
   */
  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.onClearAllFilters();
        this.loadDropdowns();
      });
  }

  /**
   * Initialize filter form
   */
  private initFilterForm(): void {
    this.filterForm = this.fb.group({
      contractId: [null, Validators.required],
      testId: [null]
    });

    // Watch for contract ID changes
    this.filterForm.get('contractId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.selectedContractId.set(value);
        // Gap #3 fix: Clear CBC Test ID when contract changes
        this.selectedCbcTestId.set(null);
        // Load CBC Test ID if both contract and test are selected
        this.loadCbcTestIdIfNeeded();
      });

    // Watch for test ID changes
    this.filterForm.get('testId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.selectedTestId.set(value);
        // Gap #3 fix: Load CBC Test ID when test changes
        this.loadCbcTestIdIfNeeded();
      });
  }

  /**
   * Load dropdown data
   */
  private loadDropdowns(): void {
    this.loadingDropdowns.set(true);

    // Load all dropdowns in parallel
    const contracts$ = this.apiService.getContractsDropdown();
    const tests$ = this.apiService.getTestsDropdown();
    const resultStatuses$ = this.apiService.getResultStatusesDropdown();

    contracts$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.contracts.set(data);
          this.filteredContracts.set(data);
          this.contractSearchControl.setValue('', { emitEvent: false });
        },
        error: (err) => this.handleError('Failed to load contracts', err)
      });

    tests$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.tests.set(data);
          this.filteredTests.set(data);
          this.testSearchControl.setValue('', { emitEvent: false });
        },
        error: (err) => this.handleError('Failed to load tests', err)
      });

    resultStatuses$
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loadingDropdowns.set(false))
      )
      .subscribe({
        next: (data) => {
          this.localResults.set(data);
          this.cbcResults.set(data);
          this.filteredLocalResults.set(data);
          this.filteredCbcResults.set(data);
          this.localResultSearchControl.setValue('', { emitEvent: false });
          this.cbcResultSearchControl.setValue('', { emitEvent: false });
        },
        error: (err) => this.handleError('Failed to load result statuses', err)
      });
  }

  /**
   * Load result statuses filtered by test ID and contract ID
   */
  private loadFilteredResultStatuses(testId: string, contractId: string): void {
    this.apiService.getResultStatusesDropdown(testId, contractId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.localResults.set(data);
          this.filteredLocalResults.set(data);
          this.localResultSearchControl.setValue('', { emitEvent: false });
        },
        error: (err) => this.handleError('Failed to load filtered result statuses', err)
      });
  }

  /**
   * Gap #3 fix: Load CBC Test ID from RGT_TEST_MATRIX when both test ID and contract ID are selected
   * Replicates Oracle Forms VALIDATE_FIELD trigger logic
   */
  private loadCbcTestIdIfNeeded(): void {
    const testId = this.selectedTestId();
    const contractId = this.selectedContractId();

    if (!testId || !contractId) {
      this.selectedCbcTestId.set(null);
      return;
    }

    this.apiService.getCbcTestId(testId, contractId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (cbcTestId) => {
          this.selectedCbcTestId.set(cbcTestId);
        },
        error: (err) => {
          console.warn('Failed to load CBC Test ID:', err);
          this.selectedCbcTestId.set(null);
        }
      });
  }

  /**
   * Handle contract select opened event
   */
  onContractSelectOpened(opened: boolean): void {
    if (opened) {
      this.contractSearchControl.setValue('', { emitEvent: false });
    }
  }

  /**
   * Handle test select opened event
   */
  onTestSelectOpened(opened: boolean): void {
    if (opened) {
      this.testSearchControl.setValue('', { emitEvent: false });
    }
  }

  // Track which dropdown was actually opened by the user
  private testIdDropdownOpened = new Map<ResultMappingRow, boolean>();
  private resultStatusDropdownOpened = new Map<ResultMappingRow, boolean>();

  /**
   * Handle test ID dropdown opened event on table rows
   */
  onTestIdDropdownOpened(opened: boolean, row: ResultMappingRow): void {
    if (opened) {
      // User opened this dropdown
      this.testIdDropdownOpened.set(row, true);
    } else {
      // Dropdown is closing - only mark as touched if user actually opened it
      if (this.testIdDropdownOpened.get(row)) {
        row.testIdTouched = true;
        this.testIdDropdownOpened.delete(row);
        this.mappings.set([...this.mappings()]);
      }
    }
  }

  /**
   * Handle result status dropdown opened event on table rows
   */
  onResultStatusDropdownOpened(opened: boolean, row: ResultMappingRow): void {
    if (opened) {
      // User opened this dropdown
      this.resultStatusDropdownOpened.set(row, true);
    } else {
      // Dropdown is closing - only mark as touched if user actually opened it
      if (this.resultStatusDropdownOpened.get(row)) {
        row.resultStatusTouched = true;
        this.resultStatusDropdownOpened.delete(row);
        this.mappings.set([...this.mappings()]);
      }
    }
  }

  /**
   * Handle contract changed event
   */
  onContractChanged(): void {
    // Reset table data when contract changes
    this.mappings.set([]);
    this.selectedCbcTestId.set(null);
  }

  /**
   * Retrieve data based on filter criteria
   */
  onRetrieve(): void {
    if (!this.canRetrieve()) {
      this.snackbarService.showError('Please select a Contract ID');
      return;
    }

    this.loading.set(true);

    const query = {
      contractId: this.selectedContractId()!,
      testId: this.selectedTestId() || undefined
    };

    this.apiService.getAll(1000, 0, query)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (response) => {
          const rows: ResultMappingRow[] = response.data.map(item => ({
            ...item,
            effDate: item.effDate ? moment(item.effDate) : null,
            termDate: item.termDate ? moment(item.termDate) : null,
            isEditing: false,
            isNew: false,
            isDirty: false,
            isDeleted: false,
            original: { ...item }
          }));

          // Clear cached matchers, filters, dropdown state, and sort state
          this.testIdMatchers.clear();
          this.resultStatusMatchers.clear();
          this.cbcResultStatusMatchers.clear();
          this.effDateMatchers.clear();
          this.termDateMatchers.clear();
          this.termDateFilters.clear();
          this.testIdDropdownOpened.clear();
          this.resultStatusDropdownOpened.clear();
          this.unsortedRows = [...rows];
          this.sortDirection = 'default';

          // Always add an empty row at the beginning for new entries
          const emptyRow = this.createEmptyRow();
          this.mappings.set([emptyRow, ...rows]);

          // Auto-populate template row Test ID from filter and load CBC Test ID
          const filterTestId = this.selectedTestId();
          if (filterTestId) {
            emptyRow.testId = filterTestId;
            const test = this.tests().find(t => t.testId === filterTestId);
            emptyRow.testDescription = test?.description || null;
            this.mappings.set([...this.mappings()]);

            // Load filtered result statuses for the pre-selected test
            this.loadFilteredResultStatuses(filterTestId, this.selectedContractId()!);

            // Load CBC Test ID from API
            this.apiService.getCbcTestId(filterTestId, this.selectedContractId()!)
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: (cbcTestId) => this.selectedCbcTestId.set(cbcTestId),
                error: () => this.selectedCbcTestId.set(null)
              });
          } else {
            this.selectedCbcTestId.set(null);
          }
        },
        error: (err) => this.handleError('Failed to retrieve data', err)
      });
  }

  /**
   * Create empty row for new entry
   */
  private createEmptyRow(): ResultMappingRow {
    const contractId = this.selectedContractId();
    return {
      testId: '',
      resultStatus: '',
      contractId: contractId || '',
      cbcTestId: null,
      cbcResultStatus: null,
      lastModifiedDate: '',
      lastModifiedDateLocal: '',
      effDate: null,
      termDate: null,
      contractCompany: null,
      contractChapter: null,
      testDescription: null,
      resultStatusDescription: null,
      isInternal: false,
      isEditing: true,
      isNew: true,
      isDirty: false,
      isDeleted: false
    };
  }

  /**
   * Handle row field changes
   */
  onRowChange(row: ResultMappingRow, field: string, value: any): void {
    (row as any)[field] = value;

    // Mark field as touched for validation
    if (field === 'testId') {
      row.testIdTouched = true;
      const test = this.tests().find(t => t.testId === value);
      row.testDescription = test?.description || null;

      // Reload result statuses filtered by selected test ID and contract ID
      if (value && row.contractId) {
        this.loadFilteredResultStatuses(value, row.contractId);
      }
    }

    if (field === 'resultStatus') {
      row.resultStatusTouched = true;
      const status = this.localResults().find(s => s.resultStatus === value);
      row.resultStatusDescription = status?.description || null;
    }

    if (!row.isNew) {
      row.isDirty = true;
    }

    // Trigger change detection
    this.mappings.set([...this.mappings()]);
  }

  getTestTooltip(row: ResultMappingRow): string {
    if (!row.testId) return '';
    return row.testDescription ? `${row.testId} - ${row.testDescription}` : row.testId;
  }

  getLocalResultTooltip(row: ResultMappingRow): string {
    if (!row.resultStatus) return '';
    return row.resultStatusDescription ? `${row.resultStatus} - ${row.resultStatusDescription}` : row.resultStatus;
  }

  onCbcResultChange(row: ResultMappingRow): void {
    // Transform to uppercase
    if (row.cbcResultStatus) {
      row.cbcResultStatus = row.cbcResultStatus.toUpperCase();
    } else {
      row.cbcResultStatus = null;
    }

    if (!row.isNew) {
      row.isDirty = true;
    }
    this.mappings.set([...this.mappings()]);
  }

  onCbcResultBlur(row: ResultMappingRow): void {
    // Gap #11 Fix: Ensure uppercase transformation on blur (Oracle Forms CaseRestriction="Upper")
    if (row.cbcResultStatus) {
      row.cbcResultStatus = row.cbcResultStatus.toUpperCase();
    }
    row.cbcResultStatusTouched = true;
    if (!row.isNew) {
      row.isDirty = true;
    }
    this.mappings.set([...this.mappings()]);
  }

  /**
   * Delete a row
   */
  onDeleteRow(row: ResultMappingRow): void {
    if (row.isNew) {
      // Remove new unsaved row immediately
      const filtered = this.mappings().filter(m => m !== row);
      this.testIdMatchers.delete(row);
      this.resultStatusMatchers.delete(row);
      this.cbcResultStatusMatchers.delete(row);
      this.effDateMatchers.delete(row);
      this.termDateMatchers.delete(row);
      this.termDateFilters.delete(row);
      this.testIdDropdownOpened.delete(row);
      this.resultStatusDropdownOpened.delete(row);
      this.mappings.set(filtered);
    } else {
      // Mark existing row for deletion
      row.isDeleted = true;
      this.mappings.set([...this.mappings()]);
    }
  }

  /**
   * Clear all filter fields
   */
  onClearAllFilters(): void {
    this.filterForm.reset();
    this.mappings.set([]);
    this.selectedCbcTestId.set(null);
  }

  /**
   * Clear all table data - clears first row or reloads data
   */
  onClearAllTable(): void {
    const firstRow = this.mappings()[0];

    // If first row is the template row with data, clear it
    if (firstRow?.isNew && (firstRow.testId || firstRow.resultStatus || firstRow.cbcResultStatus || firstRow.effDate || firstRow.termDate)) {
      // Reset the first row to empty state
      firstRow.testId = '';
      firstRow.resultStatus = '';
      firstRow.cbcResultStatus = null;
      firstRow.effDate = null;
      firstRow.termDate = null;
      firstRow.testDescription = null;
      firstRow.resultStatusDescription = null;

      // Clear touched state
      firstRow.testIdTouched = false;
      firstRow.resultStatusTouched = false;
      firstRow.cbcResultStatusTouched = false;
      firstRow.effDateTouched = false;
      firstRow.termDateTouched = false;
      firstRow.effDateRawInput = undefined;
      firstRow.termDateRawInput = undefined;

      // Clear matchers
      this.testIdMatchers.delete(firstRow);
      this.resultStatusMatchers.delete(firstRow);
      this.cbcResultStatusMatchers.delete(firstRow);
      this.effDateMatchers.delete(firstRow);
      this.termDateMatchers.delete(firstRow);
      this.termDateFilters.delete(firstRow);
      this.testIdDropdownOpened.delete(firstRow);
      this.resultStatusDropdownOpened.delete(firstRow);

      this.mappings.set([...this.mappings()]);
    } else {
      // Otherwise, reload all data
      this.onRetrieve();
    }
  }

  /**
   * Save all changes
   */
  onSave(): void {
    if (!this.canSave()) {
      return;
    }

    // Mark all fields as touched to show validation errors ONLY for new rows that have any data
    this.mappings().forEach(row => {
      if (row.isNew && (row.testId || row.resultStatus || row.cbcResultStatus || row.effDate || row.termDate)) {
        row.testIdTouched = true;
        row.resultStatusTouched = true;
        row.cbcResultStatusTouched = true;
        row.effDateTouched = true;
      }
    });

    // Trigger change detection to show errors
    this.mappings.set([...this.mappings()]);

    // Validate all rows
    const validationErrors = this.validateRows();
    if (validationErrors.length > 0) {
      return;
    }

    this.saving.set(true);

    const newRows = this.mappings().filter(m => m.isNew && m.testId && m.resultStatus);
    const updatedRows = this.mappings().filter(m => m.isDirty && !m.isNew && !m.isDeleted);
    const deletedRows = this.mappings().filter(m => m.isDeleted && !m.isNew);

    let completedOperations = 0;
    const totalOperations = newRows.length + updatedRows.length + deletedRows.length;

    if (totalOperations === 0) {
      this.saving.set(false);
      return;
    }

    // Process creates
    newRows.forEach(row => {
      const request: CreateRgtResultsMatrixRequestDto = {
        testId: row.testId,
        resultStatus: row.resultStatus,
        contractId: row.contractId,
        cbcTestId: row.cbcTestId || undefined,
        cbcResultStatus: row.cbcResultStatus || undefined,
        effDate: DateFieldValidationUtility.serializeDateForApi(row.effDate as moment.Moment | null),
        termDate: DateFieldValidationUtility.serializeDateForApi(row.termDate as moment.Moment | null)
      };

      this.apiService.create(request)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            completedOperations++;
            this.checkSaveComplete(completedOperations, totalOperations);
          },
          error: (err) => {
            this.saving.set(false);
            this.handleError('Failed to create mapping', err);
          }
        });
    });

    // Process updates
    updatedRows.forEach(row => {
      const request: UpdateRgtResultsMatrixRequestDto = {
        cbcTestId: row.cbcTestId || undefined,
        cbcResultStatus: row.cbcResultStatus || undefined,
        effDate: DateFieldValidationUtility.serializeDateForApi(row.effDate as moment.Moment | null),
        termDate: DateFieldValidationUtility.serializeDateForApi(row.termDate as moment.Moment | null)
      };

      this.apiService.update(row.testId, row.resultStatus, row.contractId, request)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            completedOperations++;
            this.checkSaveComplete(completedOperations, totalOperations);
          },
          error: (err) => {
            this.saving.set(false);
            this.handleError('Failed to update mapping', err);
          }
        });
    });

    // Process deletes
    deletedRows.forEach(row => {
      this.apiService.delete(row.testId, row.resultStatus, row.contractId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            completedOperations++;
            this.checkSaveComplete(completedOperations, totalOperations);
          },
          error: (err) => {
            this.saving.set(false);
            this.handleError('Failed to delete mapping', err);
          }
        });
    });
  }

  /**
   * Check if all save operations are complete
   */
  private checkSaveComplete(completed: number, total: number): void {
    if (completed === total) {
      this.saving.set(false);
      const contractId = this.selectedContractId();
      this.snackbarService.showSuccess(
        `Test ID's for Contract ID ${contractId} have been saved.`
      );
      this.reloadLocalResults();
      this.onRetrieve();
    }
  }

  private reloadLocalResults(): void {
    this.apiService.getResultStatusesDropdown()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.localResults.set(data);
          this.cbcResults.set(data);
          this.filteredLocalResults.set(data);
          this.filteredCbcResults.set(data);
          this.localResultSearchControl.setValue('', { emitEvent: false });
          this.cbcResultSearchControl.setValue('', { emitEvent: false });
        },
        error: (err) => this.handleError('Failed to reload result statuses', err)
      });
  }

  /**
   * Validate all rows before saving
   */
  private validateRows(): string[] {
    const errors: string[] = [];
    const newRows = this.mappings().filter(m => m.isNew && (m.testId || m.resultStatus || m.cbcResultStatus || m.effDate));

    newRows.forEach((row) => {
      // Check for required field errors (displayed inline)
      if (!row.testId || !row.resultStatus || !row.cbcResultStatus || !row.effDate) {
        errors.push('Required fields are missing');
      }

      // Check for date validation errors (displayed inline)
      const effDateError = this.getEffDateError(row);
      if (effDateError) {
        errors.push('Invalid date values');
      }

      const termDateError = this.getTermDateError(row);
      if (termDateError) {
        errors.push('Invalid date values');
      }
    });

    // Gap #3: Add duplicate detection (Oracle Forms error code: 1023 / RGT-002)
    const duplicateErrors = this.validateNoDuplicates();
    if (duplicateErrors.length > 0) {
      // Show duplicate errors as snackbar since they're not field-specific
      this.snackbarService.showError(duplicateErrors[0]);
      errors.push(...duplicateErrors);
    }

    return errors;
  }

  /**
   * Validate no duplicate mappings exist (Gap #3)
   * Replicates Oracle Forms check_duplicate procedure
   */
  private validateNoDuplicates(): string[] {
    const errors: string[] = [];
    const seenKeys = new Set<string>();
    const contractId = this.filterForm.get('contractId')?.value;

    this.mappings().forEach((row, index) => {
      if (row.isDeleted || !row.testId || !row.resultStatus) {
        return;
      }

      // Create composite key (testId + resultStatus + contractId)
      const key = `${row.testId}|${row.resultStatus}|${contractId}`;

      if (seenKeys.has(key)) {
        errors.push(
          `1023: Duplicate mapping detected - Test ID "${row.testId}", Result Status "${row.resultStatus}" already exists.`
        );
      }

      seenKeys.add(key);
    });

    return errors;
  }

  /**
   * Handle errors
   */
  private handleError(message: string, error: any): void {
    console.error(message, error);

    let errorMessage = message;
    if (error?.error?.errorResponse?.error) {
      errorMessage = error.error.errorResponse.error;
    } else if (error?.message) {
      errorMessage = error.message;
    }

    this.snackbarService.showError(errorMessage);
  }

  /**
   * Track by function for ngFor performance
   */
  trackByRow(index: number, row: ResultMappingRow): string {
    return `${row.testId}-${row.resultStatus}-${row.contractId}-${index}`;
  }

  // ────────────────────────── Sort ──────────────────────────

  toggleSort(): void {
    if (this.sortDirection === 'default') {
      this.sortDirection = 'asc';
    } else if (this.sortDirection === 'asc') {
      this.sortDirection = 'desc';
    } else {
      this.sortDirection = 'default';
    }
    this.applySortToRows();
  }

  getSortAriaValue(): 'none' | 'ascending' | 'descending' {
    if (this.sortDirection === 'asc') return 'ascending';
    if (this.sortDirection === 'desc') return 'descending';
    return 'none';
  }

  getSortButtonLabel(): string {
    const baseLabel = 'Sort by Test ID';
    if (this.sortDirection === 'asc') {
      return `${baseLabel}, currently sorted ascending, click to sort descending`;
    }
    if (this.sortDirection === 'desc') {
      return `${baseLabel}, currently sorted descending, click to remove sort`;
    }
    return `${baseLabel}, currently unsorted, click to sort ascending`;
  }

  /**
   * Check if Test ID filter is selected
   */
  isTestIdFilterSelected(): boolean {
    return !!this.selectedTestId();
  }

  private applySortToRows(): void {
    const current = this.mappings();
    if (current.length <= 1) return;

    const templateRow = current[0]?.isNew ? current[0] : null;
    const dataRows = templateRow ? current.slice(1) : [...current];

    if (this.sortDirection === 'default') {
      const restored = templateRow
        ? [templateRow, ...this.unsortedRows]
        : [...this.unsortedRows];
      this.mappings.set(restored);
      return;
    }

    // Gap #12 Fix: Sort by composite key (test_id, result_status) matching Oracle Forms OrderByClause
    const sorted = [...dataRows].sort((a, b) => {
      const testIdCmp = (a.testId || '').localeCompare(b.testId || '', undefined, { sensitivity: 'base' });
      if (testIdCmp !== 0) {
        return this.sortDirection === 'asc' ? testIdCmp : -testIdCmp;
      }
      // If test IDs are equal, sort by result status as secondary key
      const resultStatusCmp = (a.resultStatus || '').localeCompare(b.resultStatus || '', undefined, { sensitivity: 'base' });
      return this.sortDirection === 'asc' ? resultStatusCmp : -resultStatusCmp;
    });

    this.mappings.set(templateRow ? [templateRow, ...sorted] : sorted);
  }
}
