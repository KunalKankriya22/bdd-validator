import { Component, OnInit, OnDestroy, ViewChild, ViewChildren, QueryList, ElementRef, signal, Injector } from '@angular/core';
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
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { Overlay, OverlayRef, FlexibleConnectedPositionStrategy, OverlayModule } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { HeaderService } from '@shared/services/header.service';

import { DonorTestsApiService } from './services/donor-tests-api.service';
import {
  TestIdOption,
  TestDetails,
  DonorTestResultModel,
  DonorTestResultRequestParams,
  DonorTestResultFilterValue,
  DonorTestResultEditModel,
  DefineTestResultsDonorUpsertItemDto,
  DefineTestResultsDonorBulkUpsertDto
} from './models/donor-tests.model';
import { DonorTestsFilterChipsUtils } from './utils/filter-chips.utils';
import { DonorTestsFilterPanel } from './donor-tests-filter-panel/donor-tests-filter-panel';
import { DonorAddEditTestComponent, DonorTestDialogData, DonorTestDialogResult } from './add-edit-test/add-edit-test';

/**
 * Custom DateAdapter for Donor Tests component
 * Extends NativeDateAdapter directly to override today() method to use chapter local date
 * Note: Does not use @Injectable() decorator since it's instantiated via factory function
 */
class DonorTestsDateAdapter extends NativeDateAdapter {
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
  selector: 'app-donor-tests',
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
    FilterChips
  ],
  providers: [
    {
      provide: DateAdapter,
      useFactory: (chapterService: ChapterTimezoneService) => {
        return new DonorTestsDateAdapter(chapterService);
      },
      deps: [ChapterTimezoneService]
    },
    { provide: MAT_DATE_FORMATS, useValue: DD_MMM_YYYY_FORMAT }
  ],
  templateUrl: './donor-tests.html',
  styleUrls: ['./donor-tests.scss']
})
export class DonorTestsComponent implements OnInit, OnDestroy {
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
    debounceTime: 500,
    ariaLabel: 'Search by Result Code',
    searchOnEnterOnly: true
  };

  // Data Table
  dataSource: DonorTestResultModel[] = [];
  allLoadedData: DonorTestResultModel[] = [];

  isLoading = false;
  hasError = false;
  errorMessage = '';
  requestState: DonorTestResultRequestParams = {};

  // Filter
  appliedFilters: DonorTestResultFilterValue | null = null;
  filterChips: FilterChip[] = [];
  isFilterOpen = false;

  // Edit mode state
  isEditMode = false;
  editableRows: DonorTestResultEditModel[] = [];
  originalRows: DonorTestResultModel[] = [];
  dirtyRowIds = new Set<number>();

  // Validation state - banner only shows after save attempt
  showValidationBanner = false;

  // Cache for termination date filter functions (prevents creating new functions on every change detection)
  private termDateFilterCache = new Map<number, (date: Date | null) => boolean>();

  // Dropdown options for edit mode
  interdictionOptions: { value: string; display: string }[] = [];
  resultCodeOptions: { value: string; display: string }[] = [];

  // Filtered lists from search (shared across all dropdowns)
  filteredInterdictionOptions: { value: string; display: string }[] = [];
  filteredResultCodeOptions: { value: string; display: string }[] = [];

  // Track which dropdown is currently open (row index + field name)
  openDropdown: { row: number; col: string } | null = null;

  // Search controls for dropdowns
  readonly resultCodeSearchControl = new FormControl('');
  readonly interdictionSearchControl = new FormControl('');

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
   * - If effectiveDate is in the past: terminationDate >= chapter local date (cannot select past dates)
   * - If effectiveDate is today or future: terminationDate >= effectiveDate
   */
  getTerminationMinDate(row: DonorTestResultEditModel): Date {
    const chapterLocalDate = DateFieldValidationUtility.getMinDate();
    if (row.effectiveDate) {
      const effDate = moment.isMoment(row.effectiveDate) ? row.effectiveDate.clone().startOf('day') : moment(row.effectiveDate).startOf('day');
      // Return the later of effectiveDate or chapterLocalDate
      return (effDate.isBefore(chapterLocalDate) ? chapterLocalDate : effDate).toDate();
    }
    return chapterLocalDate.toDate();
  }

  /**
   * Date filter for termination date picker - disables dates before effective date or chapter local date
   * Uses a cache to return the same filter function instance, preventing Angular Material datepicker issues
   *
   * CRITICAL: Angular Material compares filter functions by reference. If we return a new function
   * on every change detection cycle, the datepicker thinks the filter is constantly changing and
   * breaks date selection. This cache ensures we return the same function instance for each row.
   */
  getTermDateFilter(row: DonorTestResultEditModel): (date: Date | null) => boolean {
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
      if (!row.effectiveDate) {
        return checkDate.isSameOrAfter(chapterLocalDate, 'day');
      }

      // Convert effective date to moment (handles both Date objects and Moment objects)
      const effDateMoment = moment.isMoment(row.effectiveDate)
        ? row.effectiveDate.clone().startOf('day')
        : moment(row.effectiveDate).startOf('day');

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
    return this.editableRows.some(row => this.hasRowErrors(row));
  }

  allTestIds: TestIdOption[] = [];
  private destroy$ = new Subject<void>();
  private overlayRef: OverlayRef | null = null;

  constructor(
    private service: DonorTestsApiService,
    private overlay: Overlay,
    private snackbarService: SnackbarService,
    private dialog: MatDialog,
    private chapterTimezoneService: ChapterTimezoneService,
    private injector: Injector,
    private headerService: HeaderService
  ) {
    // Set chapter timezone service for date utilities (shared across all instances)
    DateFieldValidationUtility.setChapterTimezoneService(this.chapterTimezoneService);
  }

  ngOnInit(): void {
    this.loadAllTestIds();
    this.setupTestIdSearch();
    this.setupTestIdSelection();
    this.setupResultCodeSearch();
    this.setupInterdictionSearch();
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
          this.originalRows = [];
          this.resultCodeSearchControl.reset();
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

  formatDate(date: Date | string | null | undefined): string {
    if (!date) return '-';

    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = d.getFullYear();

    return `${day}-${month}-${year}`;
  }

  formatYesNo(value: string | undefined | null): string {
    if (!value) return '-';
    return value.toUpperCase() === 'Y' ? 'Yes' : value.toUpperCase() === 'N' ? 'No' : value;
  }

  /**
   * Format test ID display with description
   * Shows "testId - description" if description exists, otherwise just "testId"
   */
  formatTestIdDisplay(testId: TestIdOption): string {
    if (testId.description && testId.description.trim()) {
      return `${testId.testId} - ${testId.description}`;
    }
    return testId.testId;
  }

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

  private setupInterdictionSearch(): void {
    this.interdictionSearchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(search => {
        if (search && search.length >= 1) {
          const lower = search.toLowerCase();
          this.filteredInterdictionOptions = this.interdictionOptions.filter(opt =>
            opt.value.toLowerCase().includes(lower) || opt.display.toLowerCase().includes(lower)
          );
        } else {
          this.filteredInterdictionOptions = this.interdictionOptions;
        }
      });
  }

  private setupResultCodeSearch(): void {
    this.resultCodeSearchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(search => {
        if (search && search.length >= 1) {
          this.filteredResultCodeOptions = this.resultCodeOptions.filter(opt =>
            opt.value.toLowerCase().includes(search.toLowerCase()) ||
            opt.display.toLowerCase().includes(search.toLowerCase())
          );
        } else {
          this.filteredResultCodeOptions = this.resultCodeOptions;
        }
      });
  }

  /**
   * Track dropdown open/close state by row and column
   */
  onDropdownOpened(rowIndex: number, column: string, isOpen: boolean): void {
    this.openDropdown = isOpen ? { row: rowIndex, col: column } : null;
  }

  /**
   * Check if a specific dropdown is currently open
   */
  isDropdownOpen(rowIndex: number, column: string): boolean {
    return this.openDropdown?.row === rowIndex && this.openDropdown?.col === column;
  }

  /**
   * Reset result code search when dropdown closes
   */
  onResultCodeDropdownOpenChange(isOpen: boolean): void {
    if (!isOpen) {
      this.resultCodeSearchControl.setValue('', { emitEvent: false });
      this.filteredResultCodeOptions = this.resultCodeOptions;
    }
  }

  /**
   * Reset interdiction search when dropdown closes
   */
  onInterdictionDropdownOpenChange(isOpen: boolean): void {
    if (!isOpen) {
      this.interdictionSearchControl.setValue('', { emitEvent: false });
      this.filteredInterdictionOptions = this.interdictionOptions;
    }
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

    this.service.getDonorTestResults(this.requestState)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Server handles all filtering via API
          // Store all loaded data for client-side search
          // Create new array references to ensure Angular change detection triggers
          this.allLoadedData = [...response.data];
          this.dataSource = [...response.data];
          this.isLoading = false;
        },
        error: () => {
          this.hasError = true;
          this.isLoading = false;
          this.errorMessage = 'Failed to load test results. Please try again.';
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

  // ==================== ADD/EDIT TEST SIDE PANEL ====================

  onAddNewTest(): void {
    const dialogRef = this.dialog.open(DonorAddEditTestComponent, {
      width: '745px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      data: {
        mode: 'add'
      } as DonorTestDialogData,
      disableClose: true,
      panelClass: 'test-dialog-panel-right',
      position: { right: '0', top: '64px' },
      hasBackdrop: true,
      backdropClass: 'test-dialog-backdrop'
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result: DonorTestDialogResult) => {
        if (result?.success) {
          this.loadAllTestIds();
        }
      });
  }

  onEditTestDetails(): void {
    if (!this.testDetails) return;

    const dialogRef = this.dialog.open(DonorAddEditTestComponent, {
      width: '745px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      data: {
        mode: 'edit',
        testId: this.testIdControl.value,
        description: this.testDetails.description,
        shortId: this.testDetails.shortId,
        profileTest: this.testDetails.profileTest,
        antigenType: this.testDetails.antigenType,
        antigenGroup: this.testDetails.antigenGroup,
        testGroup: this.testDetails.testGroup,
        viewLevel: this.testDetails.viewLevel,
        effectiveDate: this.testDetails.effectiveDate,
        terminationDate: this.testDetails.terminationDate
      } as DonorTestDialogData,
      disableClose: true,
      panelClass: 'test-dialog-panel-right',
      position: { right: '0', top: '64px' },
      hasBackdrop: true,
      backdropClass: 'test-dialog-backdrop'
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result: DonorTestDialogResult) => {
        if (result?.success) {
          this.loadTestDetails(this.testIdControl.value!);
        }
      });
  }

  // ==================== FILTER OPERATIONS ====================

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
    const portal = new ComponentPortal(DonorTestsFilterPanel, null, this.injector);
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

  applyFilters(filters: DonorTestResultFilterValue): void {
    this.appliedFilters = filters;

    this.filterChips = DonorTestsFilterChipsUtils.convertFiltersToChips(filters);

    this.requestState = {
      ...this.requestState,
      interdiction: filters.interdiction || undefined,
      effectiveDatePeriod: filters.effectiveDatePeriod || undefined,
      effectiveDate: filters.effectiveDate || undefined,
      terminationDatePeriod: filters.terminationDatePeriod || undefined,
      terminationDate: filters.terminationDate || undefined
    };

    this.loadData();
  }

  onRemoveFilterChip(chipKey: string): void {
    this.appliedFilters = DonorTestsFilterChipsUtils.removeFilterByChipKey(
      this.appliedFilters,
      chipKey
    );

    this.filterChips = DonorTestsFilterChipsUtils.convertFiltersToChips(this.appliedFilters);

    this.updateRequestStateFromFilters();
    this.loadData();
  }

  hasActiveFilters(): boolean {
    return DonorTestsFilterChipsUtils.hasActiveFilters(this.appliedFilters);
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
      interdiction: this.appliedFilters.interdiction || undefined,
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

    this.isEditMode = true;
    this.showValidationBanner = false;

    // Load dropdown options for edit mode
    this.loadInterdictionOptions();
    this.loadResultCodeOptions();

    this.originalRows = JSON.parse(JSON.stringify(this.dataSource));
    this.editableRows = this.dataSource.map(row => ({
      testId: row.testId,
      chapterId: row.chapterId,
      resultCode: row.resultCode,
      interdiction1: row.interdiction1 || null,
      interdiction2: row.interdiction2 || null,
      interdiction3: row.interdiction3 || null,
      effectiveDate: row.effectiveDate ? new Date(row.effectiveDate) : null,
      terminationDate: row.terminationDate ? new Date(row.terminationDate) : null,
      auditKey: row.auditKey,
      isDirty: false
    }));

    this.dirtyRowIds.clear();
    // Clear filter cache when entering edit mode to ensure fresh filters for all rows
    this.termDateFilterCache.clear();

    // If no data exists for this test ID, automatically add a new blank row
    if (this.editableRows.length === 0) {
      this.onAddNewRow();
    }
  }

  private loadInterdictionOptions(): void {
    this.service.getInterdictionDropdowns()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (options) => {
          this.interdictionOptions = options;
          this.filteredInterdictionOptions = options;
        },
        error: () => {
          this.snackbarService.showError('Failed to load interdiction dropdown options.');
        }
      });
  }

  private loadResultCodeOptions(): void {
    this.service.getResultCodeDropdowns()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (options) => {
          this.resultCodeOptions = options;
          this.filteredResultCodeOptions = options;
        },
        error: () => {
          this.snackbarService.showError('Failed to load result code dropdown options.');
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
    // Clear dropdown searches
    this.resultCodeSearchControl.reset();
    this.interdictionSearchControl.reset();
  }

  onAddNewRow(): void {
    if (!this.testIdControl.value) {
      return;
    }

    const newRow: DonorTestResultEditModel = {
      testId: this.testIdControl.value,
      chapterId: '',
      resultCode: '',
      interdiction1: null,
      interdiction2: null,
      interdiction3: null,
      effectiveDate: null,
      terminationDate: null,
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
  }

  onRowFieldChange(rowIndex: number, field: string, value: any): void {
    const row = this.editableRows[rowIndex];

    // Ensure the value is properly set (ngModel should have already set it, but we ensure it here)
    if (field === 'effectiveDate') {
      row.effectiveDate = value;
    } else if (field === 'terminationDate') {
      row.terminationDate = value;
    } else {
      (row as any)[field] = value;
    }

    row.isDirty = true;
    this.dirtyRowIds.add(rowIndex);

    // Clear any existing errors for this field
    if (row.errors && row.errors[field]) {
      delete row.errors[field];
    }

    // Immediate validation for required fields to provide instant feedback
    this.validateFieldImmediate(row, field);
  }

  /**
   * Validate and format manually entered date on blur
   * Accepts formats: MMDDYYYY, MM/DD/YYYY, MM-DD-YYYY
   * Converts to Date object for the datepicker
   */
  onDateInputBlur(rowIndex: number, field: 'effectiveDate' | 'terminationDate', event: any): void {
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
      if (field === 'effectiveDate' && row.auditKey === 0) {
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
  private validateDateField(row: DonorTestResultEditModel, field: 'effectiveDate' | 'terminationDate'): void {
    if (!row.errors) {
      row.errors = {};
    }

    const chapterLocalDate = this.chapterTimezoneService.getChapterLocalDate();

    if (field === 'effectiveDate') {
      // Effective date validation (only for new records)
      if (row.auditKey === 0) {
        if (!row.effectiveDate) {
          row.errors['effectiveDate'] = 'This field is required and cannot be left blank.';
        } else {
          const effDate = moment.isMoment(row.effectiveDate) ? row.effectiveDate.clone().startOf('day') : moment(row.effectiveDate).startOf('day');
          if (effDate.isBefore(chapterLocalDate)) {
            row.errors['effectiveDate'] = `Effective Date cannot be before chapter local date (${this.chapterLocalDateFormatted})`;
          } else {
            // Valid - clear error
            delete row.errors['effectiveDate'];
          }
        }
      }
    } else if (field === 'terminationDate') {
      // Termination date validation
      if (row.terminationDate) {
        const termDate = moment.isMoment(row.terminationDate) ? row.terminationDate.clone().startOf('day') : moment(row.terminationDate).startOf('day');

        if (row.effectiveDate) {
          const effDate = moment.isMoment(row.effectiveDate) ? row.effectiveDate.clone().startOf('day') : moment(row.effectiveDate).startOf('day');

          if (termDate.isBefore(effDate)) {
            row.errors['terminationDate'] = 'Termination Date cannot be before Effective Date';
          } else if (termDate.isBefore(chapterLocalDate)) {
            row.errors['terminationDate'] = `Termination Date must be chapter local date (${this.chapterLocalDateFormatted}) or future`;
          } else {
            // Valid - clear error
            delete row.errors['terminationDate'];
          }
        } else if (termDate.isBefore(chapterLocalDate)) {
          row.errors['terminationDate'] = `Termination Date must be chapter local date (${this.chapterLocalDateFormatted}) or future`;
        } else {
          // Valid - clear error
          delete row.errors['terminationDate'];
        }
      } else {
        // Termination date is optional - clear error
        delete row.errors['terminationDate'];
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
  private validateFieldImmediate(row: DonorTestResultEditModel, field: string): void {
    if (!row.errors) {
      row.errors = {};
    }

    if (field === 'resultCode') {
      const resultCode = row.resultCode?.toString().trim();
      if (!resultCode || resultCode === '-') {
        row.errors['resultCode'] = 'This field is required and cannot be left blank.';
      }
    }
  }

  private validateRow(row: DonorTestResultEditModel): boolean {
    let isValid = true;
    row.errors = {};

    // Validate Result Code (required)
    // Reject empty, null, undefined, or "-" as invalid
    const resultCode = row.resultCode?.toString().trim();
    if (!resultCode || resultCode === '-') {
      row.errors['resultCode'] = 'This field is required and cannot be left blank.';
      isValid = false;
    }

    // Get chapter local date
    const chapterLocalDate = this.chapterTimezoneService.getChapterLocalDate();

    // Effective Date validation (only for new records)
    if (row.auditKey === 0) {
      if (!row.effectiveDate) {
        row.errors['effectiveDate'] = 'This field is required and cannot be left blank.';
        isValid = false;
      } else {
        const effDate = moment.isMoment(row.effectiveDate) ? row.effectiveDate.clone().startOf('day') : moment(row.effectiveDate).startOf('day');
        if (effDate.isBefore(chapterLocalDate)) {
          row.errors['effectiveDate'] = `Effective Date cannot be before chapter local date (${this.chapterLocalDateFormatted})`;
          isValid = false;
        }
      }
    }

    // Date range validation
    if (row.terminationDate && row.effectiveDate) {
      const termDate = moment.isMoment(row.terminationDate) ? row.terminationDate.clone().startOf('day') : moment(row.terminationDate).startOf('day');
      const effDate = moment.isMoment(row.effectiveDate) ? row.effectiveDate.clone().startOf('day') : moment(row.effectiveDate).startOf('day');

      if (termDate.isBefore(effDate)) {
        row.errors['terminationDate'] = 'Termination Date cannot be before Effective Date';
        isValid = false;
      } else if (termDate.isBefore(chapterLocalDate)) {
        row.errors['terminationDate'] = `Termination Date must be chapter local date (${this.chapterLocalDateFormatted}) or future`;
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
  private hasDirtyRows(): boolean {
    return this.dirtyRowIds.size > 0;
  }

  hasRowErrors(row: DonorTestResultEditModel): boolean {
    return !!(row.errors && Object.keys(row.errors).length > 0);
  }

  /**
   * Get error message for date field to display in tooltip
   */
  getDateFieldError(row: DonorTestResultEditModel, field: 'effectiveDate' | 'terminationDate', ngModelRef: NgModel): string {
    // Check NgModel errors first
    if (ngModelRef.errors?.['matDatepickerParse']) {
      return 'Invalid date format. Use DD-MMM-YYYY (e.g., 18-APR-2026)';
    }
    if (ngModelRef.errors?.['invalidDateFormat']) {
      return 'Invalid date. Please enter a valid date.';
    }

    // Check custom row errors
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

    const records: DefineTestResultsDonorUpsertItemDto[] = this.editableRows
      .filter((_, index) => this.dirtyRowIds.has(index))
      .map(row => {
        const baseRecord: DefineTestResultsDonorUpsertItemDto = {
          ResultCode: row.resultCode.trim(),
          Interdiction1: row.interdiction1 ?? null,
          Interdiction2: row.interdiction2 ?? null,
          Interdiction3: row.interdiction3 ?? null,
          EffectiveDate: this.formatDateForApi(row.effectiveDate!),
          TerminationDate: row.terminationDate ? this.formatDateForApi(row.terminationDate) : null
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

    this.isLoading = true;

    const dto: DefineTestResultsDonorBulkUpsertDto = {
      Records: records
    };

    this.service.saveBulkDonorTestResults(testId, dto)
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
          // Clear dropdown searches
          this.resultCodeSearchControl.reset();
          this.interdictionSearchControl.reset();

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
  }

  private formatDateForApi(date: any): string {
    const m = moment.isMoment(date) ? date : moment(date);
    return m.format('YYYY-MM-DD');
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
