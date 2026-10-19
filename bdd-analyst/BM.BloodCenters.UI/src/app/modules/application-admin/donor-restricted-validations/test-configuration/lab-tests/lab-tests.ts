import { Component, OnInit, OnDestroy, ViewChild, ViewChildren, QueryList, ElementRef, signal, computed, Injector, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormControl, Validators, NgModel } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SnackbarService } from '@shared/services/snackbar.service';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DATE_FORMATS, DateAdapter, NativeDateAdapter } from '@angular/material/core';
import moment from 'moment';
import { DD_MMM_YYYY_FORMAT } from 'src/app/core/utils/date-adapter.util';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { MatInputModule } from '@angular/material/input';
import { MatDialog } from '@angular/material/dialog';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, finalize } from 'rxjs';
import { Overlay, OverlayRef, FlexibleConnectedPositionStrategy, OverlayModule } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TableColumn,
  TableSortEvent
} from '@shared/interfaces/data-table.interface';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { HeaderService } from '@shared/services/header.service';

import { LabTestsApiService } from './services/lab-tests-api.service';
import {
  TestIdOption,
  TestDetails,
  LabTestModel,
  LabTestRequestParams,
  LabTestFilterValue,
  LabTestEditModel,
  DefineTestResultsLabBulkUpsertDto,
  DefineTestResultsLabUpsertItemDto
} from './models/lab-tests.model';
import { LabTestsFilterChipsUtils } from './utils/filter-chips.utils';
import { LabTestsFilterPanel } from './lab-tests-filter-panel/lab-tests-filter-panel';
import { AddEditTestComponent, TestDialogData, TestDialogResult } from './add-edit-test/add-edit-test';

/**
 * Custom DateAdapter for Lab Tests component
 * Extends NativeDateAdapter directly to override today() method to use chapter local date
 * Note: Does not use @Injectable() decorator since it's instantiated via factory function
 */
class LabTestsDateAdapter extends NativeDateAdapter {
  constructor(private chapterService: ChapterTimezoneService) {
    super('en-US');
  }

  /**
   * Override today() to return chapter local date for datepicker highlighting
   * This ensures both effective date and termination date pickers highlight the same date
   */
  override today(): Date {
    try {
      if (this.chapterService && this.chapterService.isChapterLocalDateAvailable()) {
        const chapterMoment = this.chapterService.getChapterLocalDate();
        if (chapterMoment && chapterMoment.isValid()) {
          // Create a clean Date object at midnight local time
          const year = chapterMoment.year();
          const month = chapterMoment.month();
          const day = chapterMoment.date();
          return new Date(year, month, day);
        }
      }
    } catch (error) {
      // Fallback to system date
    }
    return super.today();
  }

  /**
   * Override format to use DD-MMM-YYYY format
   */
  override format(date: Date, displayFormat: Object): string {
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const day = String(date.getDate()).padStart(2, '0');
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();

    // Check if this is for month/year display (calendar header)
    const displayStr = String(displayFormat);
    if (displayStr === 'MMM YYYY' || displayStr.includes('monthYear')) {
      return `${month} ${year}`;
    }

    // Default: full date format
    return `${day}-${month}-${year}`;
  }

  /**
   * Override parse to support DD-MMM-YYYY format and various numeric formats
   * Also handles Date objects passed directly from the datepicker
   */
  override parse(value: any): Date | null {
    if (!value) return null;

    // If already a Date object, return it directly
    if (value instanceof Date) {
      // Ensure it's a valid date
      return !isNaN(value.getTime()) ? value : null;
    }

    if (typeof value !== 'string') return null;

    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const trimmedValue = value.trim();

    // Try DD-MMM-YYYY format (e.g., 20-MAR-2026)
    const ddMmmYyyyRegex = /^(\d{1,2})-(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)-(\d{4})$/i;
    let match = trimmedValue.match(ddMmmYyyyRegex);
    if (match) {
      const day = parseInt(match[1], 10);
      const monthIndex = monthNames.indexOf(match[2].toUpperCase());
      const year = parseInt(match[3], 10);
      const date = new Date(year, monthIndex, day);
      if (date.getDate() === day && date.getMonth() === monthIndex && date.getFullYear() === year) {
        return date;
      }
    }

    // Try MMDDYYYY format (8 digits, no separators) - e.g., 04182026
    const mmddyyyyRegex = /^(\d{2})(\d{2})(\d{4})$/;
    match = trimmedValue.match(mmddyyyyRegex);
    if (match) {
      const month = parseInt(match[1], 10) - 1; // 0-indexed
      const day = parseInt(match[2], 10);
      const year = parseInt(match[3], 10);
      if (month >= 0 && month <= 11) {
        const date = new Date(year, month, day);
        if (date.getDate() === day && date.getMonth() === month && date.getFullYear() === year) {
          return date;
        }
      }
    }

    // Try numeric formats: MM-DD-YYYY, MM/DD/YYYY, MM.DD.YYYY
    const numericRegex = /^(\d{1,2})[-\/\.](\d{1,2})[-\/\.](\d{4})$/;
    match = trimmedValue.match(numericRegex);
    if (match) {
      const month = parseInt(match[1], 10) - 1; // 0-indexed
      const day = parseInt(match[2], 10);
      const year = parseInt(match[3], 10);
      if (month >= 0 && month <= 11) {
        const date = new Date(year, month, day);
        if (date.getDate() === day && date.getMonth() === month && date.getFullYear() === year) {
          return date;
        }
      }
    }

    // Try YYYY-MM-DD format (with -, /, or . separators)
    const isoRegex = /^(\d{4})[-\/\.](\d{1,2})[-\/\.](\d{1,2})$/;
    match = trimmedValue.match(isoRegex);
    if (match) {
      const year = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1; // 0-indexed
      const day = parseInt(match[3], 10);
      if (month >= 0 && month <= 11) {
        const date = new Date(year, month, day);
        if (date.getDate() === day && date.getMonth() === month && date.getFullYear() === year) {
          return date;
        }
      }
    }

    return null;
  }
}

@Component({
  selector: 'app-lab-tests',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatDatepickerModule,
    MatInputModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    NgxMatSelectSearchModule,
    OverlayModule,
    SearchBar,
    DataTable,
    FilterChips
  ],
  providers: [
    {
      provide: DateAdapter,
      useFactory: (chapterService: ChapterTimezoneService) => {
        return new LabTestsDateAdapter(chapterService);
      },
      deps: [ChapterTimezoneService]
    },
    { provide: MAT_DATE_FORMATS, useValue: DD_MMM_YYYY_FORMAT }
  ],
  templateUrl: './lab-tests.html',
  styleUrls: ['./lab-tests.scss']
})
export class LabTestsComponent implements OnInit, OnDestroy {
  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef<HTMLElement>;
  @ViewChild('filterBtn', { read: ElementRef }) filterBtn!: ElementRef<HTMLElement>;
  @ViewChildren('effDateInput') effDateInputs!: QueryList<NgModel>;
  @ViewChildren('termDateInput') termDateInputs!: QueryList<NgModel>;

  // Test ID Selection
  testIdControl = new FormControl('', [Validators.required]);
  readonly testIdSearchControl = new FormControl('');
  readonly testIdOptions = signal<TestIdOption[]>([]);

  // Test Details
  testDetails: TestDetails | null = null;

  // Search Configuration
  searchConfig: SearchBarConfig = {
    placeholder: 'Search by Result Code',
    minLength: 2,
    debounceTime: 500, // 500ms debounce for server-side search
    ariaLabel: 'Search by Result Code',
    searchOnEnterOnly: true
  };

  // Data Table
  dataSource: LabTestModel[] = [];
  allLoadedData: LabTestModel[] = [];
  tableConfig: DataTableConfig<LabTestModel> = {
    columns: [],
    rowActions: [],
    sortConfig: {
      column: 'testId',
      direction: 'default'
    },
    stickyHeader: true,
    stickyActionsColumn: false,
    emptyMessage: 'No lab tests available to display',
    loadingMessage: 'Loading lab tests...',
    showPagination: false
  };

  isLoading = false;
  hasError = false;
  errorMessage = '';
  requestState: LabTestRequestParams = {};

  // Filter
  appliedFilters: LabTestFilterValue | null = null;
  filterChips: FilterChip[] = [];
  isFilterOpen = false;

  // Edit mode state
  isEditMode = false;
  editableRows: LabTestEditModel[] = [];
  originalRows: LabTestModel[] = [];
  dirtyRowIds = new Set<number>();

  // Validation state - banner only shows after save attempt
  showValidationBanner = false;

  // Cache for termination date filter functions (prevents creating new functions on every change detection)
  private termDateFilterCache = new Map<number, (date: Date | null) => boolean>();
  // Cache for termination min dates (prevents NG0100 by returning same Date reference)
  private termMinDateCache = new Map<number, { effDateRef: any; minDate: Date }>();

  // Track which dropdown is currently open (row index + field name)
  openDropdown: { row: number; col: string } | null = null;

  // Edit mode dropdown options (stored as signals)
  initialRepeatOptions: { value: string; display: string }[] = [
    { value: 'I', display: 'Initial' },
    { value: 'R', display: 'Repeat' }
  ];
  interdictionCodeOptionsSignal = signal<{ value: string; display: string }[]>([]);
  attributeCodeOptionsSignal = signal<{ value: string; display: string }[]>([]);
  resultCodeOptionsSignal = signal<{ value: string; display: string }[]>([]);
  testOptionsSignal = signal<{ value: string; display: string }[]>([]);
  confirmTestOptionsSignal = signal<{ value: string; display: string }[]>([]);
  yesNoOptions: { value: string; display: string }[] = [
    { value: 'Y', display: 'Yes' },
    { value: 'N', display: 'No' }
  ];

  // Search controls for dropdowns
  readonly interdictionSearchControl = new FormControl('');
  readonly attributeSearchControl = new FormControl('');
  readonly resultCodeSearchControl = new FormControl('');
  // Separate search controls for each Confirm Test dropdown (1-6)
  readonly confirmTest1SearchControl = new FormControl('');
  readonly confirmTest2SearchControl = new FormControl('');
  readonly confirmTest3SearchControl = new FormControl('');
  readonly confirmTest4SearchControl = new FormControl('');
  readonly confirmTest5SearchControl = new FormControl('');
  readonly confirmTest6SearchControl = new FormControl('');

  // Search signals
  readonly interdictionSearch = signal('');
  readonly attributeSearch = signal('');
  readonly resultCodeSearch = signal('');
  readonly confirmTest1Search = signal('');
  readonly confirmTest2Search = signal('');
  readonly confirmTest3Search = signal('');
  readonly confirmTest4Search = signal('');
  readonly confirmTest5Search = signal('');
  readonly confirmTest6Search = signal('');

  // Filtered options based on search
  readonly filteredInterdictionCodes = computed(() => {
    const search = this.interdictionSearch().toLowerCase();
    const options = this.interdictionCodeOptionsSignal();
    if (!search) return options;
    return options.filter(opt => opt.display.toLowerCase().includes(search));
  });

  readonly filteredAttributeCodes = computed(() => {
    const search = this.attributeSearch().toLowerCase();
    const options = this.attributeCodeOptionsSignal();
    if (!search) return options;
    return options.filter(opt => opt.display.toLowerCase().includes(search));
  });

  readonly filteredResultCodes = computed(() => {
    const search = this.resultCodeSearch().toLowerCase();
    const options = this.resultCodeOptionsSignal();
    if (!search) return options;
    return options.filter(opt => opt.display.toLowerCase().includes(search));
  });

  // Separate filtered test lists for each Confirm Test dropdown
  // All 6 Confirm Test fields (CONFIRM_TEST_ID_1-6) use the same data source (confirmTestOptionsSignal)
  // from GET /api/v1/define-tests-lab/active-test-ids
  // Each has its own search filter to prevent cross-contamination between dropdowns
  readonly filteredConfirmTests1 = computed(() => {
    const search = this.confirmTest1Search().toLowerCase();
    const options = this.confirmTestOptionsSignal();
    if (!search) return options;
    return options.filter(opt => opt.display.toLowerCase().includes(search));
  });

  readonly filteredConfirmTests2 = computed(() => {
    const search = this.confirmTest2Search().toLowerCase();
    const options = this.confirmTestOptionsSignal();
    if (!search) return options;
    return options.filter(opt => opt.display.toLowerCase().includes(search));
  });

  readonly filteredConfirmTests3 = computed(() => {
    const search = this.confirmTest3Search().toLowerCase();
    const options = this.confirmTestOptionsSignal();
    if (!search) return options;
    return options.filter(opt => opt.display.toLowerCase().includes(search));
  });

  readonly filteredConfirmTests4 = computed(() => {
    const search = this.confirmTest4Search().toLowerCase();
    const options = this.confirmTestOptionsSignal();
    if (!search) return options;
    return options.filter(opt => opt.display.toLowerCase().includes(search));
  });

  readonly filteredConfirmTests5 = computed(() => {
    const search = this.confirmTest5Search().toLowerCase();
    const options = this.confirmTestOptionsSignal();
    if (!search) return options;
    return options.filter(opt => opt.display.toLowerCase().includes(search));
  });

  readonly filteredConfirmTests6 = computed(() => {
    const search = this.confirmTest6Search().toLowerCase();
    const options = this.confirmTestOptionsSignal();
    if (!search) return options;
    return options.filter(opt => opt.display.toLowerCase().includes(search));
  });

  // Minimum date for effective date (chapter local date) - as Date for compatibility with DateAdapter
  get minDate(): Date {
    return DateFieldValidationUtility.getMinDate().toDate();
  }

  // Chapter local date as Date object for datepicker startAt
  get chapterLocalDateAsDate(): Date {
    return this.chapterTimezoneService.getChapterLocalDate().toDate();
  }

  // Chapter local date formatted for display
  get chapterLocalDateFormatted(): string {
    return this.chapterTimezoneService.getChapterLocalDate().format('DD-MMM-YYYY').toUpperCase();
  }

  /**
   * Date filter for effective date picker - disables dates before chapter local date
   * Converted to work with Date objects for NativeDateAdapter compatibility
   */
  effDateFilter = (date: Date | null): boolean => {
    if (!date) return true;
    const chapterLocalDate = DateFieldValidationUtility.getMinDate();
    const checkDate = moment(date).startOf('day');
    return checkDate.isSameOrAfter(chapterLocalDate, 'day');
  };

  /**
   * Get minimum termination date for a row.
   * Uses shared DateFieldValidationUtility to get chapter local date.
   * - If effDate is in the past: termDate >= chapter local date (cannot select past dates)
   * - If effDate is today or future: termDate >= effDate
   */
  getTerminationMinDate(row: LabTestEditModel): Date | null {
    // When cross-field error is on effDate, disable min constraint on termDate
    if (row.errors?.['effDate']) {
      return null;
    }
    const rowIndex = this.editableRows.indexOf(row);
    const cached = this.termMinDateCache.get(rowIndex);
    if (cached && cached.effDateRef === row.effDate) {
      return cached.minDate;
    }
    const chapterLocalDate = DateFieldValidationUtility.getMinDate();
    let minDate: Date;
    if (row.effDate) {
      const effDate = moment.isMoment(row.effDate) ? row.effDate.clone().startOf('day') : moment(row.effDate).startOf('day');
      minDate = (effDate.isBefore(chapterLocalDate) ? chapterLocalDate : effDate).toDate();
    } else {
      minDate = chapterLocalDate.toDate();
    }
    this.termMinDateCache.set(rowIndex, { effDateRef: row.effDate, minDate });
    return minDate;
  }

  /**
   * Date filter for termination date picker - disables dates before effective date or chapter local date
   * Uses a cache to return the same filter function instance, preventing Angular Material datepicker issues
   *
   * CRITICAL: Angular Material compares filter functions by reference. If we return a new function
   * on every change detection cycle, the datepicker thinks the filter is constantly changing and
   * breaks date selection. This cache ensures we return the same function instance for each row.
   */
  getTermDateFilter(row: LabTestEditModel): (date: Date | null) => boolean {
    const rowIndex = this.editableRows.indexOf(row);

    // Check if we have a cached filter for this row
    const cachedFilter = this.termDateFilterCache.get(rowIndex);

    // If cached filter exists, return it (same reference for Angular Material)
    if (cachedFilter) {
      return cachedFilter;
    }

    // Create new filter function that captures the current row reference
    // This allows the filter to always check the current effective date value
    const filterFn = (date: Date | null): boolean => {
      if (!date) return true;

      const chapterLocalDate = DateFieldValidationUtility.getMinDate();
      const checkDate = moment(date).startOf('day');

      // If no effective date is set, use chapter local date as minimum
      if (!row.effDate) {
        return checkDate.isSameOrAfter(chapterLocalDate, 'day');
      }

      // Convert effective date to moment (handles both Date objects and Moment objects)
      const effDateMoment = moment.isMoment(row.effDate)
        ? row.effDate.clone().startOf('day')
        : moment(row.effDate).startOf('day');

      // Termination date must be >= effective date AND >= chapter local date
      // Use whichever is later as the minimum
      const minDateMoment = effDateMoment.isBefore(chapterLocalDate) ? chapterLocalDate : effDateMoment;

      return checkDate.isSameOrAfter(minDateMoment, 'day');
    };

    // Cache the filter function for this row
    this.termDateFilterCache.set(rowIndex, filterFn);

    return filterFn;
  }

  // Validation state
  get hasValidationErrors(): boolean {
    return this.editableRows.some(row => {
      if (this.hasRowErrors(row)) return true;
      // New rows with empty required fields are invalid even if errors not yet set
      if (row.auditKey === 0) {
        const resultCode = row.resultCode?.toString().trim();
        const initialRepeat = row.initialRepeat?.toString().trim();
        if (!resultCode || !initialRepeat || !row.effDate) return true;
      }
      return false;
    });
  }

  private destroy$ = new Subject<void>();
  private overlayRef: OverlayRef | null = null;

  constructor(
    private service: LabTestsApiService,
    private overlay: Overlay,
    private snackbarService: SnackbarService,
    private dialog: MatDialog,
    private chapterTimezoneService: ChapterTimezoneService,
    private injector: Injector,
    private headerService: HeaderService,
    private cdr: ChangeDetectorRef
  ) {
    this.initializeTableConfiguration();

    // Set chapter timezone service for date utilities (shared across all instances)
    DateFieldValidationUtility.setChapterTimezoneService(this.chapterTimezoneService);
  }

  ngOnInit(): void {
    this.loadAllTestIds();
    this.loadEditDropdowns();
    this.setupTestIdSearch();
    this.setupTestIdSelection();
    this.subscribeToChapterChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.overlayRef) {
      this.overlayRef.dispose();
    }
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Exit edit mode if active
        if (this.isEditMode) {
          this.isEditMode = false;
          this.showValidationBanner = false;
          this.editableRows = [];
          this.dirtyRowIds.clear();
          this.termDateFilterCache.clear();
    this.termMinDateCache.clear();
          this.originalRows = [];
        }

        // Clear test ID selection
        this.testIdControl.reset();
        this.testIdSearchControl.reset();
        this.testDetails = null;

        // Clear all filters
        this.appliedFilters = null;
        this.filterChips = [];

        // Clear table data
        this.dataSource = [];
        this.allLoadedData = [];

        // Reset request state
        this.requestState = {};

        // Close filter panel if open
        if (this.overlayRef) {
          this.overlayRef.dispose();
          this.overlayRef = null;
          this.isFilterOpen = false;
        }

        // Reload test IDs dropdown for new chapter
        this.loadAllTestIds();
      });
  }

  private loadAllTestIds(): void {
    this.service.getTestIds()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (testIds) => {
          this.allTestIds = testIds;
          this.testIdOptions.set(testIds);
        },
        error: () => {
          this.snackbarService.showError('Failed to load test IDs. Please refresh the page.');
        }
      });
  }

  private loadEditDropdowns(): void {
    // Load result codes from the new dedicated endpoint
    this.service.getResultCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resultCodes) => {
          this.resultCodeOptionsSignal.set(resultCodes);
        },
        error: () => {
          this.snackbarService.showError('Failed to load result codes dropdown.');
        }
      });

    // Load other filter values
    this.service.getFilterValues()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (options) => {
          this.interdictionCodeOptionsSignal.set(options.interdictionCodes);
          this.attributeCodeOptionsSignal.set(options.attributeCodes);
          this.testOptionsSignal.set(options.tests);
        },
        error: () => {
          this.snackbarService.showError('Failed to load dropdown options. Some fields may not be editable.');
        }
      });

    // Subscribe to search control changes - no debounce, works with 1 character
    this.interdictionSearchControl.valueChanges
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(value => this.interdictionSearch.set(value?.trim() || ''));

    this.attributeSearchControl.valueChanges
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(value => this.attributeSearch.set(value?.trim() || ''));

    this.resultCodeSearchControl.valueChanges
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(value => this.resultCodeSearch.set(value?.trim() || ''));

    // Subscribe to each Confirm Test search control
    this.confirmTest1SearchControl.valueChanges
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((value: string | null) => this.confirmTest1Search.set(value?.trim() || ''));

    this.confirmTest2SearchControl.valueChanges
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((value: string | null) => this.confirmTest2Search.set(value?.trim() || ''));

    this.confirmTest3SearchControl.valueChanges
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((value: string | null) => this.confirmTest3Search.set(value?.trim() || ''));

    this.confirmTest4SearchControl.valueChanges
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((value: string | null) => this.confirmTest4Search.set(value?.trim() || ''));

    this.confirmTest5SearchControl.valueChanges
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((value: string | null) => this.confirmTest5Search.set(value?.trim() || ''));

    this.confirmTest6SearchControl.valueChanges
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((value: string | null) => this.confirmTest6Search.set(value?.trim() || ''));
  }

  /**
   * Track dropdown open/close state by row and column
   * Also resets search when dropdown closes
   */
  onDropdownOpened(rowIndex: number, column: string, isOpen: boolean): void {
    this.openDropdown = isOpen ? { row: rowIndex, col: column } : null;

    // When dropdown closes, reset search and validate required fields
    if (!isOpen) {
      this.resetSearchForColumn(column);
      const row = this.editableRows[rowIndex];
      if (row) {
        this.validateFieldImmediate(row, column);
      }
    }
  }

  /**
   * Check if a specific dropdown is currently open
   */
  isDropdownOpen(rowIndex: number, column: string): boolean {
    return this.openDropdown?.row === rowIndex && this.openDropdown?.col === column;
  }

  /**
   * Reset search controls when dropdown closes
   */
  private resetSearchForColumn(column: string): void {
    switch (column) {
      case 'interdictionCode':
        this.interdictionSearchControl.setValue('', { emitEvent: false });
        this.interdictionSearch.set('');
        break;
      case 'attributeCode':
        this.attributeSearchControl.setValue('', { emitEvent: false });
        this.attributeSearch.set('');
        break;
      case 'resultCode':
        this.resultCodeSearchControl.setValue('', { emitEvent: false });
        this.resultCodeSearch.set('');
        break;
      case 'confirmTest1':
        this.confirmTest1SearchControl.setValue('', { emitEvent: false });
        this.confirmTest1Search.set('');
        break;
      case 'confirmTest2':
        this.confirmTest2SearchControl.setValue('', { emitEvent: false });
        this.confirmTest2Search.set('');
        break;
      case 'confirmTest3':
        this.confirmTest3SearchControl.setValue('', { emitEvent: false });
        this.confirmTest3Search.set('');
        break;
      case 'confirmTest4':
        this.confirmTest4SearchControl.setValue('', { emitEvent: false });
        this.confirmTest4Search.set('');
        break;
      case 'confirmTest5':
        this.confirmTest5SearchControl.setValue('', { emitEvent: false });
        this.confirmTest5Search.set('');
        break;
      case 'confirmTest6':
        this.confirmTest6SearchControl.setValue('', { emitEvent: false });
        this.confirmTest6Search.set('');
        break;
    }
  }

  private initializeTableConfiguration(): void {
    this.tableConfig = {
      columns: this.getTableColumns(),
      rowActions: [],
      sortConfig: {
        column: 'resultCode',
        direction: 'default'
      },
      stickyHeader: true,
      stickyActionsColumn: false,
      emptyMessage: 'No lab tests available to display',
      loadingMessage: 'Loading lab tests...',
      showPagination: false
    };
  }

  private getTableColumns(): TableColumn<LabTestModel>[] {
    return [
      {
        key: 'resultCode',
        header: 'Result Code',
        sortable: false,
        width: '120px',
        sticky: true
      },
      {
        key: 'initialRepeat',
        header: 'Initial/Repeat',
        sortable: false,
        width: '120px',
        sticky: true,
        valueFormatter: (value) => value === 'I' ? 'Initial' : value === 'R' ? 'Repeat' : value || '-'
      },
      {
        key: 'interdictionCode',
        header: 'Interdiction Code',
        sortable: false,
        width: '150px',
        sticky: true
      },
      {
        key: 'noOfRepeats',
        header: 'No. of Repeats',
        sortable: false,
        width: '120px',
        valueFormatter: (value) => value != null ? String(value) : '-'
      },
      {
        key: 'attributeCode',
        header: 'Attribute Code',
        sortable: false,
        width: '130px'
      },
      {
        key: 'confirmTest1',
        header: 'Confirm Test 1',
        sortable: false,
        width: '120px'
      },
      {
        key: 'confirmTest2',
        header: 'Confirm Test 2',
        sortable: false,
        width: '120px'
      },
      {
        key: 'confirmTest3',
        header: 'Confirm Test 3',
        sortable: false,
        width: '120px'
      },
      {
        key: 'confirmTest4',
        header: 'Confirm Test 4',
        sortable: false,
        width: '120px'
      },
      {
        key: 'confirmTest5',
        header: 'Confirm Test 5',
        sortable: false,
        width: '120px'
      },
      {
        key: 'confirmTest6',
        header: 'Confirm Test 6',
        sortable: false,
        width: '120px'
      },
      {
        key: 'machineResult',
        header: 'Machine Read',
        sortable: false,
        width: '130px'
      },
      {
        key: 'result2',
        header: 'Result 2',
        sortable: false,
        width: '100px'
      },
      {
        key: 'effDate',
        header: 'Effective Date',
        sortable: false,
        width: '140px',
        valueFormatter: (value) => this.formatDate(value)
      },
      {
        key: 'termDate',
        header: 'Termination Date',
        sortable: false,
        width: '140px',
        valueFormatter: (value) => this.formatDate(value)
      },
      {
        key: 'modificationDate',
        header: 'Modification Date',
        sortable: false,
        width: '150px',
        valueFormatter: (value) => this.formatDate(value)
      }
    ];
  }

  formatDate(date: Date | string | null | undefined): string {
    if (!date) return '-';

    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = d.getFullYear();

    return `${day}-${month}-${year}`;
  }

  formatDateTime(date: Date | string | null | undefined): string {
    if (!date) return '-';

    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    return `${day}-${month}-${year} ${hours}:${minutes}`;
  }

  formatYesNo(value: string | undefined | null): string {
    if (!value) return '-';
    return value.toUpperCase() === 'Y' ? 'Yes' : value.toUpperCase() === 'N' ? 'No' : value;
  }

  formatInitialRepeat(value: string | undefined | null): string {
    if (!value) return '-';
    return value === 'I' ? 'Initial' : value === 'R' ? 'Repeat' : value;
  }

  /**
   * Formats test ID display for dropdown
   * Shows "testId - description" if description exists, otherwise just "testId"
   */
  formatTestIdDisplay(testId: TestIdOption): string {
    if (testId.description && testId.description.trim()) {
      return `${testId.testId} - ${testId.description}`;
    }
    return testId.testId;
  }

  onEditTestDetails(): void {
    if (!this.testDetails) return;

    const dialogRef = this.dialog.open(AddEditTestComponent, {
      width: '745px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      data: {
        mode: 'edit',
        testId: this.testIdControl.value,
        description: this.testDetails.description,
        shortId: this.testDetails.shortId,
        group: this.testDetails.group,
        antigenTest: this.testDetails.antigenTest,
        autoSchedule: this.testDetails.autoSchedule,
        editResults: this.testDetails.editResults,
        discrepancyCheck: this.testDetails.discrepancyCheck,
        noOfResults: this.testDetails.noOfResults,
        fullResult: this.testDetails.fullResult,
        effDateTime: this.testDetails.effDateTime,
        termDateTime: this.testDetails.termDateTime
      } as TestDialogData,
      panelClass: 'test-dialog-panel-right',
      position: { right: '0', top: '64px' },
      hasBackdrop: true,
      backdropClass: 'test-dialog-backdrop'
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result: TestDialogResult) => {
        if (result?.success) {
          this.loadTestDetails(this.testIdControl.value!);
        }
      });
  }

  allTestIds: TestIdOption[] = [];

  private setupTestIdSearch(): void {
    this.testIdSearchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(search => {
        if (search && search.length >= 1) {
          const searchLower = search.toLowerCase();
          const filtered = this.allTestIds.filter(t =>
            t.testId.toLowerCase().includes(searchLower) ||
            (t.description && t.description.toLowerCase().includes(searchLower))
          );
          this.testIdOptions.set(filtered);
        } else {
          this.testIdOptions.set(this.allTestIds);
        }
      });
  }

  private setupTestIdSelection(): void {
    this.testIdControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(testId => {
        if (testId) {
          this.requestState.testId = testId;
          this.loadTestDetails(testId);
          this.loadData();
        } else {
          this.requestState.testId = undefined;
          this.testDetails = null;
          this.dataSource = [];
        }
      });
  }

  private loadTestDetails(testId: string): void {
    this.service.getTestDetails(testId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (details) => this.testDetails = details,
        error: () => {
          this.snackbarService.showError('Failed to load test details.');
        }
      });
  }

  loadData(): void {
    if (!this.requestState.testId) {
      return;
    }

    this.isLoading = true;
    this.hasError = false;

    this.service.getLabTests(this.requestState)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Server handles all filtering via API (plateSeq, interdiction, dates)
          // Store all loaded data for client-side search
          // Create new array references to ensure Angular change detection triggers
          this.allLoadedData = [...response.data];
          this.dataSource = [...response.data];
          this.isLoading = false;
        },
        error: () => {
          this.hasError = true;
          this.isLoading = false;
          this.errorMessage = 'Failed to load lab tests. Please try again.';
        }
      });
  }

  onSearch(searchText: string): void {
    // Client-side search filtering
    if (searchText) {
      this.dataSource = this.allLoadedData.filter(row =>
        row.resultCode?.toLowerCase().includes(searchText.toLowerCase())
      );
    } else {
      this.dataSource = [...this.allLoadedData];
    }
  }

  onSortChange(event: TableSortEvent): void {
    this.tableConfig.sortConfig!.column = event.column;
    this.tableConfig.sortConfig!.direction = event.direction;

    if (event.direction === 'default') {
      this.requestState.sort = undefined;
    } else {
      this.requestState.sort = this.mapColumnToSortParam(event.column, event.direction);
    }

    this.loadData();
  }

  private mapColumnToSortParam(column: string, direction: 'A' | 'D'): string {
    const suffix = direction === 'A' ? 'ASC' : 'DESC';

    const columnMap: Record<string, string> = {
      'resultCode': 'RESULT_CODE',
      'initialRepeat': 'INITIAL_REPEAT',
      'interdictionCode': 'INTERDICTION_CODE',
      'noOfRepeats': 'NO_OF_REPEATS',
      'attributeCode': 'ATTRIBUTE_CODE',
      'machineResult': 'MACHINE_RESULT',
      'result2': 'RESULT_2',
      'effDate': 'EFFECTIVE_DATE',
      'termDate': 'TERMINATION_DATE',
      'modificationDate': 'MODIFICATION_DATE'
    };

    const columnKey = columnMap[column] || 'RESULT_CODE';
    return `${columnKey}_${suffix}`;
  }

  openFilter(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
      this.isFilterOpen = false;
      return;
    }

    this.isFilterOpen = true;

    // Calculate available height (from filter trigger to footer)
    const filterPanelMaxHeight = this.calculateFilterPanelMaxHeight();

    const positionStrategy: FlexibleConnectedPositionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(this.filterBtn)
      .withPositions([
        {
          originX: 'start',
          originY: 'bottom',
          overlayX: 'start',
          overlayY: 'top',
          offsetX: 0,
          offsetY: 4
        }
      ])
      .withViewportMargin(20)
      .withPush(true);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      scrollStrategy: this.overlay.scrollStrategies.block()
    });

    // Create ComponentPortal with injector to provide NgZone and other dependencies
    const portal = new ComponentPortal(LabTestsFilterPanel, null, this.injector);
    const componentRef = this.overlayRef.attach(portal);

    componentRef.instance.currentFilters = this.appliedFilters;
    componentRef.instance.testId = this.testIdControl.value;

    // Set dynamic max-height on filter panel
    if (filterPanelMaxHeight) {
      componentRef.instance.maxHeight = filterPanelMaxHeight;
    }

    componentRef.instance.apply
      .pipe(takeUntil(this.destroy$))
      .subscribe(filters => {
        this.applyFilters(filters);
        if (this.overlayRef) {
          this.overlayRef.dispose();
          this.overlayRef = null;
          this.isFilterOpen = false;
        }
      });

    componentRef.instance.close
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.overlayRef) {
          this.overlayRef.dispose();
          this.overlayRef = null;
          this.isFilterOpen = false;
        }
      });

    this.overlayRef.backdropClick()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.overlayRef) {
          this.overlayRef.dispose();
          this.overlayRef = null;
          this.isFilterOpen = false;
        }
      });
  }

  applyFilters(filters: LabTestFilterValue): void {
    this.appliedFilters = filters;

    this.filterChips = LabTestsFilterChipsUtils.convertFiltersToChips(filters);

    this.requestState = {
      ...this.requestState,
      initialRepeat: filters.initialRepeat || undefined,
      interdictionCode: filters.interdictionCode || undefined,
      effectiveDatePeriod: filters.effectiveDatePeriod || undefined,
      effectiveDate: filters.effectiveDate || undefined,
      terminationDatePeriod: filters.terminationDatePeriod || undefined,
      terminationDate: filters.terminationDate || undefined
    };

    this.loadData();
  }

  onRemoveFilterChip(chipKey: string): void {
    this.appliedFilters = LabTestsFilterChipsUtils.removeFilterByChipKey(
      this.appliedFilters,
      chipKey
    );

    this.filterChips = LabTestsFilterChipsUtils.convertFiltersToChips(this.appliedFilters);

    this.updateRequestStateFromFilters();
    this.loadData();
  }

  hasActiveFilters(): boolean {
    return LabTestsFilterChipsUtils.hasActiveFilters(this.appliedFilters);
  }

  clearAllFilters(): void {
    this.appliedFilters = null;
    this.filterChips = [];

    this.updateRequestStateFromFilters();
    this.loadData();
  }

  private updateRequestStateFromFilters(): void {
    if (!this.appliedFilters) {
      this.requestState = {
        testId: this.requestState.testId,
        searchKeyword: this.requestState.searchKeyword,
        sort: this.requestState.sort
      };
      return;
    }

    this.requestState = {
      testId: this.requestState.testId,
      searchKeyword: this.requestState.searchKeyword,
      initialRepeat: this.appliedFilters.initialRepeat || undefined,
      interdictionCode: this.appliedFilters.interdictionCode || undefined,
      effectiveDatePeriod: this.appliedFilters.effectiveDatePeriod || undefined,
      effectiveDate: this.appliedFilters.effectiveDate || undefined,
      terminationDatePeriod: this.appliedFilters.terminationDatePeriod || undefined,
      terminationDate: this.appliedFilters.terminationDate || undefined,
      sort: this.requestState.sort
    };
  }

  // ==================== EDIT MODE METHODS ====================

  onAddEditClick(): void {
    if (!this.testIdControl.value) {
      return;
    }

    // Load active test IDs for Confirm Test dropdowns only when entering edit mode
    // Check if already loaded to avoid duplicate API calls
    if (this.confirmTestOptionsSignal().length === 0) {
      this.service.getActiveTestIds()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (activeTests) => {
            this.confirmTestOptionsSignal.set(activeTests);
          },
          error: () => {
            this.snackbarService.showError('Failed to load confirm test options.');
          }
        });
    }

    this.isEditMode = true;
    this.showValidationBanner = false;

    this.originalRows = JSON.parse(JSON.stringify(this.dataSource));
    this.editableRows = this.dataSource.map(row => ({
      resultCode: row.resultCode,
      initialRepeat: row.initialRepeat,
      interdictionCode: row.interdictionCode || null,
      noOfRepeats: row.noOfRepeats,
      attributeCode: row.attributeCode,
      confirmTest1: row.confirmTest1,
      confirmTest2: row.confirmTest2,
      confirmTest3: row.confirmTest3,
      confirmTest4: row.confirmTest4,
      confirmTest5: row.confirmTest5,
      confirmTest6: row.confirmTest6,
      machineResult: row.machineResult,
      result2: row.result2,
      effDate: row.effDate ? new Date(row.effDate) : null,
      termDate: row.termDate ? new Date(row.termDate) : null,
      auditKey: row.auditKey,
      isDirty: false
    }));

    this.dirtyRowIds.clear();
    // Clear filter cache when entering edit mode to ensure fresh filters for all rows
    this.termDateFilterCache.clear();
    this.termMinDateCache.clear();

    // If no data exists for this test ID, automatically add a new blank row
    if (this.editableRows.length === 0) {
      this.onAddNewRow();
    }
  }

  onAddNewTest(): void {
    const dialogRef = this.dialog.open(AddEditTestComponent, {
      width: '745px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      data: {
        mode: 'add'
      } as TestDialogData,
      panelClass: 'test-dialog-panel-right',
      position: { right: '0', top: '64px' },
      hasBackdrop: true,
      backdropClass: 'test-dialog-backdrop'
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result: TestDialogResult) => {
        if (result?.success) {
          this.loadAllTestIds();
        }
      });
  }

  onCancelEdit(): void {
    this.isEditMode = false;
    this.showValidationBanner = false;
    this.editableRows = [];
    this.dirtyRowIds.clear();
    this.dataSource = [...this.originalRows];
    this.originalRows = [];
    // Clear filter cache when exiting edit mode
    this.termDateFilterCache.clear();
    this.termMinDateCache.clear();
  }

  onAddNewRow(): void {
    if (!this.testIdControl.value) {
      return;
    }

    const newRow: LabTestEditModel = {
      resultCode: '',
      initialRepeat: '',
      interdictionCode: null,
      noOfRepeats: null,
      attributeCode: '',
      confirmTest1: '',
      confirmTest2: '',
      confirmTest3: '',
      confirmTest4: '',
      confirmTest5: '',
      confirmTest6: '',
      machineResult: '',
      result2: '',
      effDate: null,
      termDate: null,
      auditKey: 0,
      isDirty: true,
      errors: {}
    };

    this.editableRows.unshift(newRow);

    // Shift existing dirty row indices by 1 to account for new row at index 0
    const newDirtyIds = new Set<number>();
    this.dirtyRowIds.forEach(id => {
      newDirtyIds.add(id + 1);
    });
    this.dirtyRowIds = newDirtyIds;

    // Mark the new row at index 0 as dirty so it will be validated on save
    this.dirtyRowIds.add(0);

    // Clear filter cache when adding rows because all row indices have shifted
    this.termDateFilterCache.clear();
    this.termMinDateCache.clear();
  }

  /**
   * Type guard to check if a field name is a valid editable field on LabTestEditModel
   */
  private isEditableField(field: string): field is keyof LabTestEditModel {
    const editableFields: (keyof LabTestEditModel)[] = [
      'resultCode', 'initialRepeat', 'interdictionCode', 'noOfRepeats',
      'attributeCode', 'confirmTest1', 'confirmTest2', 'confirmTest3',
      'confirmTest4', 'confirmTest5', 'confirmTest6', 'machineResult',
      'result2', 'effDate', 'termDate'
    ];
    return editableFields.includes(field as keyof LabTestEditModel);
  }

  onRowFieldChange(rowIndex: number, field: string, value: any): void {
    const row = this.editableRows[rowIndex];

    if (field === 'effDate') {
      row.effDate = value;
      row.lastDateField = 'effDate';
      if (!row.errors) row.errors = {};
      // Cross-validate against termDate
      if (row.termDate && value) {
        const effMoment = moment.isMoment(value) ? value.clone().startOf('day') : moment(value).startOf('day');
        const termMoment = moment.isMoment(row.termDate) ? row.termDate.clone().startOf('day') : moment(row.termDate).startOf('day');
        if (effMoment.isAfter(termMoment)) {
          row.errors['effDate'] = 'Effective Date must be on or before Termination Date';
          delete row.errors['termDate'];
        } else {
          delete row.errors['effDate'];
          delete row.errors['termDate'];
        }
      } else {
        delete row.errors['effDate'];
        delete row.errors['termDate'];
      }
      // Invalidate termDate min cache so the binding returns null when effDate has error
      this.termMinDateCache.delete(rowIndex);
    } else if (field === 'termDate') {
      row.termDate = value;
      row.lastDateField = 'termDate';
    } else if (this.isEditableField(field)) {
      // Type-safe assignment - field is validated by type guard
      // Cast needed because TypeScript can't infer the specific field type
      (row as Record<string, any>)[field] = value;
    }
    // Note: Unknown fields are silently ignored (type guard prevents invalid assignments)

    row.isDirty = true;
    this.dirtyRowIds.add(rowIndex);

    // Clear any existing errors for this field (skip if cross-field date validation already set it)
    if (field !== 'effDate' && field !== 'termDate') {
      if (row.errors && row.errors[field]) {
        delete row.errors[field];
      }
    }

    // Immediate validation for required fields to provide instant feedback
    this.validateFieldImmediate(row, field);
  }

  /**
   * Validate and format manually entered date on blur
   * Accepts formats: MMDDYYYY, MM/DD/YYYY, MM-DD-YYYY
   * Converts to Date object for the datepicker
   */
  onDateInputBlur(rowIndex: number, field: 'effDate' | 'termDate', event: any): void {
    const inputElement = event.target as HTMLInputElement;
    const inputValue = inputElement.value?.trim();
    const row = this.editableRows[rowIndex];

    // Initialize errors object if not exists
    if (!row.errors) {
      row.errors = {};
    }

    // Check if field is empty
    if (!inputValue) {
      // Only effective date is required for new rows
      if (field === 'effDate' && row.auditKey === 0) {
        row.errors[field] = 'This field is required and cannot be left blank.';
        row[field] = null;
      } else {
        // Clear error for optional fields
        delete row.errors[field];
        row[field] = null;
      }
      return;
    }

    // If it's already a valid Date object, validate it
    if (row[field] instanceof Date && !isNaN(row[field].getTime())) {
      this.validateDateField(row, field);
      return;
    }

    // Try to parse the manually entered date
    const parsedDate = this.parseManualDateInput(inputValue);

    if (parsedDate) {
      // Update the row with the parsed Date object
      row[field] = parsedDate;
      row.isDirty = true;
      this.dirtyRowIds.add(rowIndex);

      // Validate the parsed date
      this.validateDateField(row, field);
    } else {
      // Invalid date format
      row.errors[field] = 'Invalid date format. Use DD-MMM-YYYY (e.g., 21-APR-2026)';
      row[field] = null;
    }
  }

  /**
   * Validate a date field and set appropriate errors
   */
  private validateDateField(row: LabTestEditModel, field: 'effDate' | 'termDate'): void {
    if (!row.errors) {
      row.errors = {};
    }

    const chapterLocalDate = this.chapterTimezoneService.getChapterLocalDate();

    if (field === 'effDate') {
      row.lastDateField = 'effDate';
      delete row.errors['termDate'];
      // Effective date validation (only for new records)
      if (row.auditKey === 0) {
        if (!row.effDate) {
          row.errors['effDate'] = 'This field is required and cannot be left blank.';
        } else {
          const effDate = moment.isMoment(row.effDate) ? row.effDate.clone().startOf('day') : moment(row.effDate).startOf('day');
          if (effDate.isBefore(chapterLocalDate)) {
            row.errors['effDate'] = `Effective Date cannot be before chapter local date (${this.chapterLocalDateFormatted})`;
          } else if (row.termDate) {
            const termDate = moment.isMoment(row.termDate) ? row.termDate.clone().startOf('day') : moment(row.termDate).startOf('day');
            if (effDate.isAfter(termDate)) {
              row.errors['effDate'] = 'Effective Date must be on or before Termination Date';
            } else {
              delete row.errors['effDate'];
            }
          } else {
            delete row.errors['effDate'];
          }
        }
      }
    } else if (field === 'termDate') {
      row.lastDateField = 'termDate';
      // Termination date validation
      delete row.errors['effDate'];
      if (row.termDate) {
        const termDate = moment.isMoment(row.termDate) ? row.termDate.clone().startOf('day') : moment(row.termDate).startOf('day');

        if (row.effDate) {
          const effDate = moment.isMoment(row.effDate) ? row.effDate.clone().startOf('day') : moment(row.effDate).startOf('day');

          if (termDate.isBefore(effDate)) {
            row.errors['termDate'] = 'Termination Date must be on or after Effective Date';
          } else if (termDate.isBefore(chapterLocalDate)) {
            row.errors['termDate'] = `Termination Date must be chapter local date (${this.chapterLocalDateFormatted}) or future`;
          } else {
            delete row.errors['termDate'];
          }
        } else if (termDate.isBefore(chapterLocalDate)) {
          row.errors['termDate'] = `Termination Date must be chapter local date (${this.chapterLocalDateFormatted}) or future`;
        } else {
          delete row.errors['termDate'];
        }
      } else {
        delete row.errors['termDate'];
      }
    }
  }

  /**
   * Parse manual date input in various formats
   * Accepts: MMDDYYYY, MM/DD/YYYY, MM-DD-YYYY
   * Returns: Date object or null if invalid
   */
  private parseManualDateInput(input: string): Date | null {
    if (!input) return null;

    let month: number;
    let day: number;
    let year: number;

    // Remove all non-numeric characters for easier parsing
    const digitsOnly = input.replace(/\D/g, '');

    // Format: MMDDYYYY (8 digits)
    if (digitsOnly.length === 8) {
      month = parseInt(digitsOnly.substring(0, 2), 10);
      day = parseInt(digitsOnly.substring(2, 4), 10);
      year = parseInt(digitsOnly.substring(4, 8), 10);
    }
    // Format: MM/DD/YYYY or MM-DD-YYYY
    else if (input.includes('/') || input.includes('-')) {
      const parts = input.split(/[/-]/);
      if (parts.length === 3) {
        month = parseInt(parts[0], 10);
        day = parseInt(parts[1], 10);
        year = parseInt(parts[2], 10);

        // Handle 2-digit year (convert to 4-digit)
        if (year < 100) {
          year = year < 50 ? 2000 + year : 1900 + year;
        }
      } else {
        return null;
      }
    } else {
      return null;
    }

    // Validate ranges
    if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1900 || year > 2100) {
      return null;
    }

    // Create date object (month is 0-indexed in JavaScript Date)
    const date = new Date(year, month - 1, day);

    // Verify the date is valid (handles invalid dates like 02/30/2024)
    if (date.getMonth() !== month - 1 || date.getDate() !== day || date.getFullYear() !== year) {
      return null;
    }

    return date;
  }

  /**
   * Validate a specific field immediately (called on field change for instant feedback)
   */
  private validateFieldImmediate(row: LabTestEditModel, field: string): void {
    if (!row.errors) {
      row.errors = {};
    }

    switch (field) {
      case 'resultCode':
        const resultCode = row.resultCode?.toString().trim();
        if (!resultCode) {
          row.errors['resultCode'] = 'This field is required and cannot be left blank.';
        }
        break;

      case 'initialRepeat':
        const initialRepeat = row.initialRepeat?.toString().trim();
        if (!initialRepeat) {
          row.errors['initialRepeat'] = 'This field is required and cannot be left blank.';
        }
        break;

      case 'interdictionCode':
        break;

      case 'noOfRepeats':
        if (row.noOfRepeats != null && row.noOfRepeats !== '') {
          const numValue = Number(row.noOfRepeats);
          if (isNaN(numValue) || !Number.isInteger(numValue) || numValue < 0 || numValue > 9) {
            row.errors['noOfRepeats'] = 'Must be a number between 0 and 9';
          }
        }
        break;
    }
  }

  private validateRow(row: LabTestEditModel): boolean {
    let isValid = true;
    row.errors = {};

    // Validate Result Code (required)
    // Only reject empty, null, or undefined values
    const resultCode = row.resultCode?.toString().trim();
    if (!resultCode) {
      row.errors['resultCode'] = 'This field is required and cannot be left blank.';
      isValid = false;
    }

    // Validate Initial/Repeat (required)
    // Only reject empty, null, or undefined values
    const initialRepeat = row.initialRepeat?.toString().trim();
    if (!initialRepeat) {
      row.errors['initialRepeat'] = 'This field is required and cannot be left blank.';
      isValid = false;
    }

    // Validate No. of Repeats (optional, but must be 0-9 if provided)
    if (row.noOfRepeats != null && row.noOfRepeats !== '') {
      const numValue = Number(row.noOfRepeats);
      if (isNaN(numValue) || !Number.isInteger(numValue) || numValue < 0 || numValue > 9) {
        row.errors['noOfRepeats'] = 'Must be a number between 0 and 9';
        isValid = false;
      }
    }

    // Get chapter local date
    const chapterLocalDate = this.chapterTimezoneService.getChapterLocalDate();

    // Effective Date validation (only for new records)
    if (row.auditKey === 0) {
      if (!row.effDate) {
        row.errors['effDate'] = 'This field is required and cannot be left blank.';
        isValid = false;
      } else {
        const effDate = moment.isMoment(row.effDate) ? row.effDate.clone().startOf('day') : moment(row.effDate).startOf('day');
        if (effDate.isBefore(chapterLocalDate)) {
          row.errors['effDate'] = `Effective Date cannot be before chapter local date (${this.chapterLocalDateFormatted})`;
          isValid = false;
        }
      }
    }

    // Date range validation — show error on last changed field
    if (row.termDate && row.effDate) {
      const termDate = moment.isMoment(row.termDate) ? row.termDate.clone().startOf('day') : moment(row.termDate).startOf('day');
      const effDate = moment.isMoment(row.effDate) ? row.effDate.clone().startOf('day') : moment(row.effDate).startOf('day');

      if (termDate.isBefore(effDate)) {
        if (row.lastDateField === 'effDate') {
          row.errors['effDate'] = 'Effective Date must be on or before Termination Date';
        } else {
          row.errors['termDate'] = 'Termination Date must be on or after Effective Date';
        }
        isValid = false;
      } else if (termDate.isBefore(chapterLocalDate)) {
        row.errors['termDate'] = `Termination Date must be chapter local date (${this.chapterLocalDateFormatted}) or future`;
        isValid = false;
      }
    }

    return isValid;
  }

  private validateAllRows(): boolean {
    let allValid = true;

    this.editableRows.forEach((row, index) => {
      // Validate dirty rows AND new rows (auditKey === 0) even if untouched
      if (this.dirtyRowIds.has(index) || row.auditKey === 0) {
        const isValid = this.validateRow(row);
        if (!isValid) {
          allValid = false;
        }
      }
    });

    return allValid;
  }

  /**
   * Checks if there are any dirty rows that need to be saved
   */
  hasDirtyRows(): boolean {
    return this.dirtyRowIds.size > 0;
  }

  hasRowErrors(row: LabTestEditModel): boolean {
    return !!(row.errors && Object.keys(row.errors).length > 0);
  }

  /**
   * Get error message for date field to display in tooltip
   */
  getDateFieldError(row: LabTestEditModel, field: 'effDate' | 'termDate'): string {
    if (row.errors && row.errors[field]) {
      return row.errors[field];
    }
    return '';
  }

  hasNewRows(): boolean {
    return this.editableRows.some(row => row.auditKey === 0);
  }

  onSave(): void {
    const testId = this.testIdControl.value;
    if (!testId) {
      this.snackbarService.showError('Test ID is required');
      return;
    }

    // Check if there are any changes to save
    if (!this.hasDirtyRows()) {
      this.snackbarService.showError('No changes to save');
      return;
    }

    // Validate all dirty rows - errors are displayed directly on the fields
    const isValid = this.validateAllRows();

    if (!isValid) {
      this.showValidationBanner = true;
      this.snackbarService.showError('Please fix validation errors before saving');
      return;
    }

    // Reset validation banner on successful validation
    this.showValidationBanner = false;

    const records: DefineTestResultsLabUpsertItemDto[] = this.editableRows
      .filter((_, index) => this.dirtyRowIds.has(index))
      .map(row => {
        const baseRecord: DefineTestResultsLabUpsertItemDto = {
          resultCode: (row.resultCode || '').trim(),
          plateSeq: (row.initialRepeat || '').trim(),
          interdictionCode: (row.interdictionCode || '').trim() || null,
          noOfRepeats: row.noOfRepeats != null && row.noOfRepeats !== '' ? Number(row.noOfRepeats) : null,
          attributeCode: (row.attributeCode || '').trim() || undefined,
          confirmTest1: (row.confirmTest1 || '').trim() || undefined,
          confirmTest2: (row.confirmTest2 || '').trim() || undefined,
          confirmTest3: (row.confirmTest3 || '').trim() || undefined,
          confirmTest4: (row.confirmTest4 || '').trim() || undefined,
          confirmTest5: (row.confirmTest5 || '').trim() || undefined,
          confirmTest6: (row.confirmTest6 || '').trim() || undefined,
          autoOnly: row.machineResult?.toUpperCase() === 'Y' ? true :
                    row.machineResult?.toUpperCase() === 'N' ? false : null,
          secondTech: row.result2?.toUpperCase() === 'Y' ? true :
                      row.result2?.toUpperCase() === 'N' ? false : null,
          effectiveDate: this.formatDateForApi(row.effDate!),
          terminationDate: row.termDate ? this.formatDateForApi(row.termDate) : null
        };

        // Only include auditKey for existing records (auditKey > 0)
        if (row.auditKey > 0) {
          return {
            auditKey: row.auditKey,
            ...baseRecord
          };
        }

        // For new records (auditKey === 0), don't include auditKey
        return baseRecord;
      });

    if (records.length === 0) {
      this.snackbarService.showError('No changes to save');
      return;
    }

    const dto: DefineTestResultsLabBulkUpsertDto = { records };

    this.isLoading = true;

    this.service.saveBulkLabTests(testId, dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const message = response.Message ||
            `Saved successfully (${response.CreatedCount} created, ${response.UpdatedCount} updated)`;
          this.snackbarService.showSuccess(message);

          // Exit edit mode
          this.isEditMode = false;
          this.showValidationBanner = false;
          this.editableRows = [];
          this.dirtyRowIds.clear();
          // Clear filter cache when exiting edit mode after save
          this.termDateFilterCache.clear();
    this.termMinDateCache.clear();

          // Reload data to reflect the changes - loadData() manages isLoading state
          this.loadData();
        },
        error: () => {
          // Error snackbar handled by global HTTP interceptor
          // Reset loading state on error since loadData() won't be called
          this.isLoading = false;
        }
      });
  }

  onDeleteRow(rowIndex: number): void {
    if (this.editableRows.length <= 1) {
      return;
    }

    this.editableRows.splice(rowIndex, 1);
    this.dirtyRowIds.delete(rowIndex);

    const newDirtyIds = new Set<number>();
    this.dirtyRowIds.forEach(id => {
      if (id > rowIndex) {
        newDirtyIds.add(id - 1);
      } else if (id < rowIndex) {
        newDirtyIds.add(id);
      }
    });
    this.dirtyRowIds = newDirtyIds;

    // Clear filter cache when deleting rows because all row indices have shifted
    this.termDateFilterCache.clear();
    this.termMinDateCache.clear();
  }

  private formatDateForApi(date: any): string {
    const m = moment.isMoment(date) ? date : moment(date);
    return m.format('YYYY-MM-DD');
  }

  /**
   * Allow only digits 0-9 for No. of Repeats field
   */
  allowOnlyDigits(event: KeyboardEvent): void {
    // Allow navigation and editing keys
    if (['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
      return;
    }
    // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
    if (event.ctrlKey && ['a', 'c', 'v', 'x'].includes(event.key.toLowerCase())) {
      return;
    }
    // Block if not a digit 0-9
    if (!/^[0-9]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  /**
   * Calculate maximum height for filter panel based on available space above footer
   */
  private calculateFilterPanelMaxHeight(): number | null {
    const footerElement = document.querySelector('app-footer');
    if (!footerElement || !this.tableCard?.nativeElement) {
      return null;
    }

    const tableCardRect = this.tableCard.nativeElement.getBoundingClientRect();
    const footerRect = footerElement.getBoundingClientRect();

    // Calculate available height: from filter panel top (tableCard.top + 56px offset) to footer top
    // Subtract margin for spacing
    const filterPanelTop = tableCardRect.top + 56;
    const availableHeight = footerRect.top - filterPanelTop - 20; // 20px margin from footer

    // Return minimum of 200px to ensure usability
    return Math.max(200, availableHeight);
  }
}
