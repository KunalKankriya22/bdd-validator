import { Component, OnInit, OnDestroy, ViewChild, ViewChildren, QueryList, ElementRef, ChangeDetectorRef, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormControl, NgModel } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { SnackbarService } from '@shared/services/snackbar.service';
import { MatDatepickerModule, MatDatepickerInputEvent } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { Overlay, OverlayRef, FlexibleConnectedPositionStrategy, OverlayModule } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import moment from 'moment';
import { HeaderService } from '@shared/services/header.service';

import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TableColumn,
  TablePageEvent
} from '@shared/interfaces/data-table.interface';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';

import { OverrideRulesApiService } from './services/override-rules-api.service';
import {
  TestIdOption,
  OverrideRuleModel,
  OverrideRuleRequestParams,
  OverrideRuleFilterValue,
  OverrideRuleEditModel,
  InterdictionCode,
  TestResult
} from './models/override-rules.model';
import { OverrideRulesFilterChipsUtils } from './utils/filter-chips.utils';
import { OverrideRulesFilterPanel } from './override-rules-filter-panel/override-rules-filter-panel';

@Component({
  selector: 'app-override-rules',
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
    MatMomentDateModule,
    MatInputModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    NgxMatSelectSearchModule,
    OverlayModule,
    SearchBar,
    DataTable,
    FilterChips,
    OverrideRulesFilterPanel
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './override-rules.html',
  styleUrls: ['./override-rules.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OverrideRulesComponent implements OnInit, OnDestroy {
  @ViewChild(SearchBar) searchBarComponent!: SearchBar;
  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef<HTMLElement>;
  @ViewChild('filterBtn', { read: ElementRef }) filterBtn!: ElementRef<HTMLElement>;
  @ViewChildren('effDateInput') effDateInputs!: QueryList<NgModel>;
  @ViewChildren('termDateInput') termDateInputs!: QueryList<NgModel>;

  // Test ID Selection
  testIdControl = new FormControl('');
  readonly testIdSearchControl = new FormControl('');
  readonly testIdOptions = signal<TestIdOption[]>([]);
  private allTestIdOptions: TestIdOption[] = [];

  // Search Configuration
  searchConfig: SearchBarConfig = {
    placeholder: 'Search by current result',
    minLength: 2,
    ariaLabel: 'Search by current result',
    searchOnEnterOnly: true
  };

  // Pagination
  pageSize = 25;
  pageIndex = 0;
  totalRecords = 0;
  readonly pageSizeOptions = [10, 25, 50, 100];

  // Data Table
  dataSource: OverrideRuleModel[] = [];
  tableConfig: DataTableConfig<OverrideRuleModel> = {
    columns: [],
    rowActions: [],
    stickyHeader: true,
    stickyActionsColumn: false,
    noDataIcon: 'edit',
    emptyMessage: 'No override rules available to display',
    loadingMessage: 'Loading override rules...',
    showPagination: false
  };

  isLoading = false;
  hasError = false;
  errorMessage = '';
  requestState: OverrideRuleRequestParams = {};

  // Filter
  appliedFilters: OverrideRuleFilterValue | null = null;
  filterChips: FilterChip[] = [];
  isFilterOpen = false;

  // Track which dropdown is open to apply search filtering only to it
  openDropdown: { row: number; col: string } | null = null;

  onDropdownOpened(rowIndex: number, column: string, isOpen: boolean): void {
    this.openDropdown = isOpen ? { row: rowIndex, col: column } : null;
  }

  isDropdownOpen(rowIndex: number, column: string): boolean {
    return this.openDropdown?.row === rowIndex && this.openDropdown?.col === column;
  }

  // Edit mode state
  isEditMode = false;
  editableRows: OverrideRuleEditModel[] = [];
  originalRows: OverrideRuleModel[] = [];  // Backup for cancel
  dirtyRowIds = new Set<number>();  // Track modified rows

  // Validation state - banner only shows after save attempt
  showValidationBanner = false;
  get hasValidationErrors(): boolean {
    return this.editableRows.some(row => this.hasRowErrors(row));
  }

  // Dropdown options
  interdictionOptions: InterdictionCode[] = [];
  filterInterdictionOptions: InterdictionCode[] = [];
  overrideFlagOptions = [
    { value: 'Y', label: 'Yes' },
    { value: 'N', label: 'No' }
  ];
  
  // Result options - populated from API
  resultOptions: { value: string; label: string }[] = [];

  // Search controls for inline editable dropdowns
  readonly currentResultSearchControl = new FormControl('');
  readonly newResultSearchControl = new FormControl('');
  readonly interdictionSearchControl = new FormControl('');

  // Full option lists from API
  allResultOptions: { value: string; label: string }[] = [];
  allInterdictionOptions: InterdictionCode[] = [];

  // Filtered options as plain arrays (avoids signal-based re-render on all rows)
  filteredCurrentResultOptions: { value: string; label: string }[] = [];
  filteredNewResultOptions: { value: string; label: string }[] = [];
  filteredInterdictionOptions: InterdictionCode[] = [];

  private filterResultOptions(search: string): { value: string; label: string }[] {
    if (!search) return this.allResultOptions;
    const s = search.toLowerCase();
    return this.allResultOptions.filter(opt => opt.label.toLowerCase().includes(s));
  }

  private filterInterdictionOptionsList(search: string): InterdictionCode[] {
    if (!search) return this.allInterdictionOptions;
    const s = search.toLowerCase();
    return this.allInterdictionOptions.filter(opt =>
      opt.interCode.toLowerCase().includes(s) ||
      (opt.interDesc && opt.interDesc.toLowerCase().includes(s))
    );
  }

  private readonly headerService = inject(HeaderService);
  private get chapterOffset(): string { return this.headerService.chapterTimeZone(); }

  // Minimum date for effective date (chapter's today) - getter ensures latest timezone
  get minDate(): moment.Moment {
    return DateFieldValidationUtility.getMinDate(this.chapterOffset);
  }

  /**
   * Check if effective date is in the past (for readonly logic)
   * Per FMB: Existing records with past effective dates should be readonly
   */
  isPastEffectiveDate(row: OverrideRuleEditModel): boolean {
    return !!row.effDateReadonly;
  }

  /**
   * Get minimum termination date for a row.
   * - If effDate is in the past: termDate >= today (cannot select past dates)
   * - If effDate is today or future: termDate >= effDate
   */
  getTerminationMinDate(row: OverrideRuleEditModel): moment.Moment {
    const today = DateFieldValidationUtility.getMinDate(this.chapterOffset);
    if (row.effDate) {
      const effDate = moment(row.effDate).startOf('day');
      // If effDate is in the past, termDate must be >= today
      // If effDate is today or future, termDate must be >= effDate
      // Compare as calendar date strings to avoid timezone issues
      return effDate.format('YYYY-MM-DD') < today.format('YYYY-MM-DD') ? today : effDate;
    }
    return today;
  }

  private destroy$ = new Subject<void>();
  private isDestroyed = false;
  private overlayRef: OverlayRef | null = null;

  constructor(
    private service: OverrideRulesApiService,
    private overlay: Overlay,
    private snackbarService: SnackbarService,
    private cdr: ChangeDetectorRef
  ) {
    this.initializeTableConfiguration();
  }

  ngOnInit(): void {
    this.loadAllTestIds();
    this.loadInterdictionCodes();
    this.loadTestResults();
    this.loadFilterInterdictionCodes();
    this.setupTestIdSearch();
    this.setupTestIdSelection();
    this.setupInlineSearchControls();
    this.subscribeToChapterChanges();
    this.loadData();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Reset edit mode
        this.isEditMode = false;
        this.showValidationBanner = false;
        this.editableRows = [];
        this.dirtyRowIds.clear();

        // Reset selection and data
        this.testIdControl.reset();
        this.dataSource = [];

        // Reset filters
        this.appliedFilters = null;
        this.filterChips = [];
        this.isFilterOpen = false;
        this.requestState = {};

        // Reset search
        if (this.searchBarComponent) {
          this.searchBarComponent.searchText = '';
        }

        // Reload dropdown data for new chapter
        this.loadAllTestIds();
        this.loadInterdictionCodes();
        this.loadTestResults();
      });
  }

  /**
   * Subscribe to inline search controls and update signals
   */
  private setupInlineSearchControls(): void {
    this.currentResultSearchControl.valueChanges
      .pipe(debounceTime(200), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(value => {
        this.filteredCurrentResultOptions = this.filterResultOptions(value || '');
        this.cdr.markForCheck();
      });

    this.newResultSearchControl.valueChanges
      .pipe(debounceTime(200), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(value => {
        this.filteredNewResultOptions = this.filterResultOptions(value || '');
        this.cdr.markForCheck();
      });

    this.interdictionSearchControl.valueChanges
      .pipe(debounceTime(200), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(value => {
        this.filteredInterdictionOptions = this.filterInterdictionOptionsList(value || '');
        this.cdr.markForCheck();
      });
  }

  /**
   * Load interdiction codes for dropdown
   */
  private loadInterdictionCodes(): void {
    this.service.getInterdictionCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (codes) => {
          this.interdictionOptions = codes;
          this.allInterdictionOptions = codes;
          this.filteredInterdictionOptions = codes;
        },
        error: () => this.snackbarService.showError('Failed to load interdiction codes.')
      });
  }

  /**
   * Load interdiction codes filtered by testId for filter panel
   */
  private loadFilterInterdictionCodes(testId?: string): void {
    this.service.getInterdictionCodesForFilter(testId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (codes) => {
          this.filterInterdictionOptions = codes;
        },
        error: () => this.snackbarService.showError('Failed to load interdiction codes for filter.')
      });
  }

  /**
   * Load test results for dropdown
   */
  private loadTestResults(): void {
    this.service.getTestResults()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (results) => {
          this.resultOptions = results.map(result => ({
            value: result.resultCode,
            label: result.resultDescription
              ? `${result.resultCode} - ${result.resultDescription}`
              : result.resultCode
          }));
          this.allResultOptions = this.resultOptions;
          this.filteredCurrentResultOptions = this.resultOptions;
          this.filteredNewResultOptions = this.resultOptions;
        },
        error: () => this.snackbarService.showError('Failed to load test results.')
      });
  }

  /**
   * Load all test IDs without search filter (on dropdown open)
   */
  private loadAllTestIds(): void {
    this.service.getTestIds()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (testIds) => {
          this.allTestIdOptions = testIds;
          this.testIdOptions.set(testIds);
        },
        error: () => this.snackbarService.showError('Failed to load test IDs.')
      });
  }

  /**
   * Handle test ID dropdown opened event
   * Load test IDs when dropdown is first opened (ensures chapterId is available)
   */
  onTestIdDropdownOpened(isOpen: boolean): void {
    if (isOpen) {
      this.loadAllTestIds();
    }
  }

  ngOnDestroy(): void {
    this.isDestroyed = true;
    this.destroy$.next();
    this.destroy$.complete();
    if (this.overlayRef) {
      this.overlayRef.dispose();
    }
    this.removeOutsideClickListener();
  }

  private initializeTableConfiguration(): void {
    this.tableConfig = {
      columns: this.getTableColumns(),
      rowActions: [],
      stickyHeader: true,
      stickyActionsColumn: false,
      noDataIcon: 'edit',
      emptyMessage: 'No override rules available to display',
      loadingMessage: 'Loading override rules...',
      showPagination: true,
      pagination: {
        totalRecords: 0,
        pageSize: this.pageSize,
        pageIndex: this.pageIndex,
        pageSizeOptions: this.pageSizeOptions,
        showFirstLastButtons: true
      }
    };
  }

  private getTableColumns(): TableColumn<OverrideRuleModel>[] {
    return [
      {
        key: 'testId',
        header: 'Test ID',
        sortable: false,
        width: '120px'
      },
      {
        key: 'currentResultStatus',
        header: 'Current Result',
        sortable: false,
        width: '150px'
      },
      {
        key: 'newResultStatus',
        header: 'New Result',
        sortable: false,
        width: '150px'
      },
      {
        key: 'overrideFlag',
        header: 'Override Flag',
        sortable: false,
        width: '130px',
        valueFormatter: (value) => value === 'Y' ? 'Yes' : value === 'N' ? 'No' : value
      },
      {
        key: 'interCode',
        header: 'Interdiction',
        sortable: false,
        width: '250px',
        valueFormatter: (_value, row) => {
          if (row && row.interDescription) {
            return `${row.interCode} - ${row.interDescription}`;
          }
          return row?.interCode || '-';
        }
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
        key: 'insertDate',
        header: 'Modification Date',
        sortable: false,
        width: '150px',
        valueFormatter: (value) => this.formatDate(value)
      }
    ];
  }

  private formatDate(date: Date | string | null | undefined): string {
    if (!date) return '-';

    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = d.getFullYear();

    return `${day}-${month}-${year}`;
  }

  private setupTestIdSearch(): void {
    this.testIdSearchControl.valueChanges
      .pipe(debounceTime(150), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(search => {
        if (search) {
          const s = search.toLowerCase();
          this.testIdOptions.set(
            this.allTestIdOptions.filter(t =>
              t.testId.toLowerCase().includes(s) ||
              (t.testDesc && t.testDesc.toLowerCase().includes(s))
            )
          );
        } else {
          this.testIdOptions.set(this.allTestIdOptions);
        }
      });
  }

  private setupTestIdSelection(): void {
    this.testIdControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(testId => {
        if (testId) {
          this.requestState.testId = testId;
          this.pageIndex = 0;
          this.loadData();
          this.loadFilterInterdictionCodes(testId);
        } else {
          this.requestState.testId = undefined;
          this.pageIndex = 0;
          this.loadData();
          this.loadFilterInterdictionCodes();
        }
      });
  }

  loadData(): void {
    this.isLoading = true;
    this.hasError = false;

    const take = this.pageSize;
    const skip = this.pageIndex * this.pageSize;
    const params: OverrideRuleRequestParams = { ...this.requestState };

    this.service.getOverrideRules(take, skip, params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dataSource = response.data;
          this.totalRecords = response.totalRecords;
          this.tableConfig = {
            ...this.tableConfig,
            pagination: {
              totalRecords: this.totalRecords,
              pageSize: this.pageSize,
              pageIndex: this.pageIndex,
              pageSizeOptions: this.pageSizeOptions,
              showFirstLastButtons: true
            }
          };
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.hasError = true;
          this.isLoading = false;
          this.errorMessage = 'Failed to load override rules. Please try again.';
          this.cdr.markForCheck();
        }
      });
  }

  onSearch(searchText: string): void {
    this.requestState.searchKeyword = searchText || undefined;
    this.pageIndex = 0;
    this.loadData();
  }

  onPageChange(event: TablePageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadData();
  }

  openFilter(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
      this.isFilterOpen = false;
      this.removeOutsideClickListener();
      return;
    }

    this.isFilterOpen = true;

    const positionStrategy: FlexibleConnectedPositionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(this.filterBtn)
      .withPositions([
        {
          originX: 'start',
          originY: 'bottom',
          overlayX: 'start',
          overlayY: 'top',
          offsetY: 4
        }
      ])
      .withViewportMargin(20)
      .withPush(true);

    // hasBackdrop is false because the filter panel contains a datepicker that opens
    // its own CDK overlay — a backdrop would intercept clicks on the datepicker calendar.
    // Instead, we use a document click listener to close on outside clicks.
    this.overlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: false,
      scrollStrategy: this.overlay.scrollStrategies.reposition()
    });

    const portal = new ComponentPortal(OverrideRulesFilterPanel);
    const componentRef = this.overlayRef.attach(portal);

    componentRef.instance.currentFilters = this.appliedFilters;
    componentRef.instance.interdictionOptions = this.filterInterdictionOptions;

    componentRef.instance.apply
      .pipe(takeUntil(this.destroy$))
      .subscribe(filters => {
        this.applyFilters(filters);
        if (this.overlayRef) {
          this.overlayRef.dispose();
          this.overlayRef = null;
          this.isFilterOpen = false;
          this.removeOutsideClickListener();
        }
      });

    componentRef.instance.close
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.overlayRef) {
          this.overlayRef.dispose();
          this.overlayRef = null;
          this.isFilterOpen = false;
          this.removeOutsideClickListener();
        }
      });

    // Close on outside click (delayed to avoid closing immediately)
    setTimeout(() => {
      this.outsideClickListener = (event: MouseEvent) => {
        if (!this.overlayRef) return;
        const target = event.target as HTMLElement;
        // Don't close if click is inside the filter panel overlay or any CDK overlay (datepicker, select)
        if (target.closest('.cdk-overlay-container') || target.closest('.filter-button')) return;
        this.overlayRef.dispose();
        this.overlayRef = null;
        this.isFilterOpen = false;
        this.removeOutsideClickListener();
        this.cdr.markForCheck();
      };
      document.addEventListener('click', this.outsideClickListener);
    });
  }

  private outsideClickListener: ((event: MouseEvent) => void) | null = null;

  private removeOutsideClickListener(): void {
    if (this.outsideClickListener) {
      document.removeEventListener('click', this.outsideClickListener);
      this.outsideClickListener = null;
    }
  }

  applyFilters(filters: OverrideRuleFilterValue): void {
    this.appliedFilters = filters;

    this.filterChips = OverrideRulesFilterChipsUtils.convertFiltersToChips(filters);

    // Convert period values to lowercase for API and format dates
    const effectiveDatePeriod = filters.effectiveDatePeriod
      ? (filters.effectiveDatePeriod.toLowerCase() as 'before' | 'after')
      : undefined;
    const terminationDatePeriod = filters.terminationDatePeriod
      ? (filters.terminationDatePeriod.toLowerCase() as 'before' | 'after')
      : undefined;

    this.requestState = {
      ...this.requestState,
      overrideFlag: filters.overrideFlag || undefined,
      interdictionCode: filters.interdictionCode || undefined,
      effectiveDatePeriod: effectiveDatePeriod,
      effectiveDate: filters.effectiveDate ? this.formatFilterDate(filters.effectiveDate) : undefined,
      terminationDatePeriod: terminationDatePeriod,
      terminationDate: filters.terminationDate ? this.formatFilterDate(filters.terminationDate) : undefined
    };

    this.pageIndex = 0;
    this.loadData();
  }

  /**
   * Format filter date to YYYY-MM-DD string for API
   * Handles moment objects, Date objects, and strings
   */
  private formatFilterDate(date: any): string | undefined {
    if (!date) return undefined;

    let d: Date;

    // Check if it's a moment object (has toDate method)
    if (date && typeof date.toDate === 'function') {
      d = date.toDate();
    } else if (date instanceof Date) {
      d = date;
    } else {
      d = new Date(date);
    }

    if (isNaN(d.getTime())) return undefined;

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  onRemoveFilterChip(chipKey: string): void {
    this.appliedFilters = OverrideRulesFilterChipsUtils.removeFilterByChipKey(
      this.appliedFilters,
      chipKey
    );

    this.filterChips = OverrideRulesFilterChipsUtils.convertFiltersToChips(this.appliedFilters);

    this.updateRequestStateFromFilters();

    this.pageIndex = 0;
    this.loadData();
  }

  hasActiveFilters(): boolean {
    return OverrideRulesFilterChipsUtils.hasActiveFilters(this.appliedFilters);
  }

  onClearTestId(): void {
    this.testIdControl.reset();
    this.testIdSearchControl.reset();
    this.appliedFilters = null;
    this.filterChips = [];
    this.requestState = {};
    this.pageIndex = 0;
    if (this.searchBarComponent) {
      this.searchBarComponent.searchText = '';
    }
  }

  clearAllFilters(): void {
    this.appliedFilters = null;
    this.filterChips = [];

    this.updateRequestStateFromFilters();

    this.pageIndex = 0;
    this.loadData();
  }

  private updateRequestStateFromFilters(): void {
    if (!this.appliedFilters) {
      this.requestState = {
        testId: this.requestState.testId,
        searchKeyword: this.requestState.searchKeyword
      };
      return;
    }

    // Convert period values to lowercase for API
    const effectiveDatePeriod = this.appliedFilters.effectiveDatePeriod
      ? (this.appliedFilters.effectiveDatePeriod.toLowerCase() as 'before' | 'after')
      : undefined;
    const terminationDatePeriod = this.appliedFilters.terminationDatePeriod
      ? (this.appliedFilters.terminationDatePeriod.toLowerCase() as 'before' | 'after')
      : undefined;

    this.requestState = {
      testId: this.requestState.testId,
      searchKeyword: this.requestState.searchKeyword,
      overrideFlag: this.appliedFilters.overrideFlag || undefined,
      interdictionCode: this.appliedFilters.interdictionCode || undefined,
      effectiveDatePeriod: effectiveDatePeriod,
      effectiveDate: this.appliedFilters.effectiveDate ? this.formatFilterDate(this.appliedFilters.effectiveDate) : undefined,
      terminationDatePeriod: terminationDatePeriod,
      terminationDate: this.appliedFilters.terminationDate ? this.formatFilterDate(this.appliedFilters.terminationDate) : undefined
    };
  }

  // ==================== EDIT MODE METHODS ====================

  /**
   * Enter edit mode - convert table to editable rows
   */
  onAddEditClick(): void {
    if (!this.testIdControl.value) {
      return;
    }

    this.isEditMode = true;
    this.isLoading = true;
    this.showValidationBanner = false;
    this.cdr.markForCheck();

    // Yield to render cycle so spinner paints before heavy DOM work
    setTimeout(() => {
      // Deep clone current data for editing
      this.originalRows = JSON.parse(JSON.stringify(this.dataSource));
      const today = DateFieldValidationUtility.getMinDate(this.chapterOffset);
      this.editableRows = this.dataSource.map(row => {
        const effMoment = row.effDate ? moment(row.effDate) : null;
        const isEffPast = effMoment && row.auditKey > 0
          ? effMoment.clone().startOf('day').isBefore(today, 'day')
          : false;
        return {
          testId: row.testId,
          chapterId: row.chapterId,
          currentResultStatus: row.currentResultStatus,
          newResultStatus: row.newResultStatus,
          overrideFlag: row.overrideFlag,
          interCode: row.interCode,
          effDate: effMoment,
          termDate: row.termDate ? moment(row.termDate) : null,
          originalTermDate: row.termDate ? moment(row.termDate) : null,
          effDateReadonly: isEffPast,
          auditKey: row.auditKey,
          isDirty: false
        };
      });

      this.dirtyRowIds.clear();
      this.updateHasNewRowsFlag();
      this.isLoading = false;
      this.cdr.markForCheck();
    });
  }

  /**
   * Cancel edit mode - revert all changes
   */
  onCancelEdit(): void {
    this.isEditMode = false;
    this.showValidationBanner = false;
    this.editableRows = [];
    this.dirtyRowIds.clear();
    this.hasNewRowsFlag = false;
    // Restore original data
    this.dataSource = [...this.originalRows];
    this.originalRows = [];
    this.cdr.detectChanges();
    // After *ngIf re-creates child components, force another cycle for filter chips
    setTimeout(() => {
      if (this.isDestroyed) return;
      this.filterChips = [...this.filterChips];
      this.cdr.detectChanges();
    });
  }

  /**
   * Add new empty row to editable table (at the START)
   */
  onAddNewRow(): void {
    if (!this.testIdControl.value) {
      return;
    }

    const newRow: OverrideRuleEditModel = {
      testId: this.testIdControl.value,
      chapterId: 'ALL',  // Default from API examples
      currentResultStatus: '',
      newResultStatus: '',
      overrideFlag: '',
      interCode: '',
      effDate: null,
      termDate: null,
      auditKey: 0,  // 0 indicates new record
      isDirty: true,
      errors: {}
    };

    // Add at the beginning (index 0) instead of end
    this.editableRows.unshift(newRow);

    // Re-index all dirty rows (shift them down by 1)
    const newDirtyIds = new Set<number>();
    this.dirtyRowIds.forEach(id => {
      newDirtyIds.add(id + 1);
    });
    this.dirtyRowIds = newDirtyIds;

    // Mark the new row (now at index 0) as dirty
    this.dirtyRowIds.add(0);
    this.hasNewRowsFlag = true;
    this.cdr.markForCheck();
  }

  /**
   * Track row field changes
   */
  onRowFieldChange(rowIndex: number, field: string, value: any): void {
    const row = this.editableRows[rowIndex];
    (row as any)[field] = value;
    row.isDirty = true;
    this.dirtyRowIds.add(rowIndex);

    // Clear field-specific error when user types (skip date fields - handled by blur handlers)
    if (row.errors && row.errors[field] && field !== 'effDate' && field !== 'termDate') {
      delete row.errors[field];
    }
    this.cdr.markForCheck();
  }

  // ==================== DATE VALIDATION HANDLERS ====================

  /** Supported date formats for manual input parsing (strict mode) */
  private readonly dateParseFormats = ['DD-MMM-YYYY', 'D-MMM-YYYY', 'MM/DD/YYYY', 'M/DD/YYYY', 'MM-DD-YYYY', 'M-DD-YYYY', 'DD/MM/YYYY', 'D/MM/YYYY', 'DD-MM-YYYY', 'D-MM-YYYY'];

  /** Stores raw typed input per row before adapter converts it */
  private savedRawInput: { [key: string]: string } = {};

  /** Capture raw typed input and auto-convert compact dates (7-8 digits) immediately */
  onDateInput(event: Event, rowIndex: number, field: string): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    this.savedRawInput[`${rowIndex}_${field}`] = value;

    // Mark row as dirty when user types in date field
    // (ngModelChange may not fire if adapter returns null for invalid text and value was already null)
    if (value && value.trim() !== '') {
      const row = this.editableRows[rowIndex];
      if (row) {
        row.isDirty = true;
        this.dirtyRowIds.add(rowIndex);
      }
    }

    // Auto-convert when user finishes typing compact date (7-8 digits)
    if (/^\d{7,8}$/.test(value.trim())) {
      const row = this.editableRows[rowIndex];
      if (input.disabled) return;
      const parsedDate = this.isValidCalendarDate(value);
      if (parsedDate) {
        setTimeout(() => {
          this.validateAndFormatDate(value.trim(), row, rowIndex, field as 'effDate' | 'termDate', input);
        });
      }
    }
  }

  private isValidCalendarDate(inputValue: string): moment.Moment | null {
    const trimmed = inputValue.trim();

    // Handle digit-only inputs (no separators) manually
    if (/^\d{7,8}$/.test(trimmed)) {
      return this.parseCompactDate(trimmed);
    }

    const parsedDate = moment(trimmed, this.dateParseFormats, true);
    if (!parsedDate.isValid()) return null;
    const year = parsedDate.year();
    if (year < 1900 || year > 2100) return null;
    return parsedDate;
  }

  /**
   * Parse compact digit-only dates: 8 digits (MMDDYYYY primary) or 7 digits (MDDYYYY primary)
   */
  private parseCompactDate(digits: string): moment.Moment | null {
    const tryDate = (d: number, m: number, y: number): moment.Moment | null => {
      if (y < 1900 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) return null;
      const date = moment(`${d}-${m}-${y}`, 'D-M-YYYY', true);
      return date.isValid() ? date : null;
    };

    if (digits.length === 8) {
      // MMDDYYYY only (month-first)
      return tryDate(+digits.substring(2, 4), +digits.substring(0, 2), +digits.substring(4, 8));
    } else if (digits.length === 7) {
      // MDDYYYY only (M=1, DD=2, YYYY=4)
      return tryDate(+digits.substring(1, 3), +digits.substring(0, 1), +digits.substring(3, 7));
    }
    return null;
  }

  private validateAndFormatDate(
    inputValue: string,
    row: OverrideRuleEditModel,
    rowIndex: number,
    field: 'effDate' | 'termDate',
    inputElement: HTMLInputElement
  ): void {
    if (!row.errors) row.errors = {};
    delete row.errors[field];

    // Empty check
    if (!inputValue || inputValue.trim() === '') {
      if (field === 'effDate' && row.auditKey === 0) {
        row.errors[field] = 'Effective Date is required';
      }
      return;
    }

    const parsedDate = this.isValidCalendarDate(inputValue);

    if (!parsedDate) {
      row.errors[field] = 'Invalid date format. Use DD-MM-YYYY or DD-MMM-YYYY';
      (row as any)[field] = null;
      inputElement.value = inputValue;
      this.cdr.markForCheck();
      return;
    }

    // Valid date - auto-convert and update model
    (row as any)[field] = parsedDate;
    inputElement.value = parsedDate.format('DD-MMM-YYYY').toUpperCase();
    row.isDirty = true;
    this.dirtyRowIds.add(rowIndex);
    this.cdr.detectChanges();

    // Date range validation
    const today = DateFieldValidationUtility.getMinDate(this.chapterOffset);

    if (field === 'effDate') {
      if (parsedDate.isBefore(today, 'day')) {
        row.errors[field] = `Effective Date cannot be before ${today.format('DD-MMM-YYYY').toUpperCase()}`;
      }
    } else {
      const minTermDate = row.effDate ? moment(row.effDate) : today;
      if (parsedDate.isBefore(minTermDate, 'day')) {
        const minDateFormatted = minTermDate.format('DD-MMM-YYYY').toUpperCase();
        row.errors[field] = row.effDate
          ? `Termination Date cannot be before Effective Date (${minDateFormatted})`
          : `Termination Date cannot be before ${minDateFormatted}`;
      } else if (parsedDate.isBefore(today, 'day')) {
        row.errors[field] = `Termination Date cannot be before current date (${today.format('DD-MMM-YYYY').toUpperCase()})`;
      }
    }
  }

  /** dateChange: only handle datepicker popup selections */
  onEffectiveDateChange(event: MatDatepickerInputEvent<any>, row: OverrideRuleEditModel, rowIndex: number): void {
    // Only handle datepicker popup selection (event.value is set)
    if (event.value) {
      delete this.savedRawInput[`${rowIndex}_effDate`];
      this.validateAndFormatDate(
        moment(event.value).format('DD-MMM-YYYY'),
        row, rowIndex, 'effDate', event.targetElement as HTMLInputElement
      );
    }
  }

  /** blur: handle all manual text input (setTimeout ensures it runs after adapter/ngModel) */
  onEffectiveDateBlur(event: FocusEvent, row: OverrideRuleEditModel, rowIndex: number): void {
    const input = event.target as HTMLInputElement;
    const rawKey = `${rowIndex}_effDate`;
    const rawValue = this.savedRawInput[rawKey];
    setTimeout(() => {
      const inputValue = rawValue || input?.value || '';
      delete this.savedRawInput[rawKey];
      this.validateAndFormatDate(inputValue.trim(), row, rowIndex, 'effDate', input);
    });
  }

  /** dateChange: only handle datepicker popup selections */
  onTerminationDateChange(event: MatDatepickerInputEvent<any>, row: OverrideRuleEditModel, rowIndex: number): void {
    if (event.value) {
      delete this.savedRawInput[`${rowIndex}_termDate`];
      this.validateAndFormatDate(
        moment(event.value).format('DD-MMM-YYYY'),
        row, rowIndex, 'termDate', event.targetElement as HTMLInputElement
      );
    }
  }

  /** blur: handle all manual text input (setTimeout ensures it runs after adapter/ngModel) */
  onTerminationDateBlur(event: FocusEvent, row: OverrideRuleEditModel, rowIndex: number): void {
    const input = event.target as HTMLInputElement;
    const rawKey = `${rowIndex}_termDate`;
    const rawValue = this.savedRawInput[rawKey];
    setTimeout(() => {
      const inputValue = rawValue || input?.value || '';
      delete this.savedRawInput[rawKey];
      this.validateAndFormatDate(inputValue.trim(), row, rowIndex, 'termDate', input);
    });
  }

  /**
   * Validate single row (called on save)
   */
  private validateRow(row: OverrideRuleEditModel): boolean {
    let isValid = true;
    // Preserve existing date errors set during typing (e.g. invalid text like "jhgjhghgj")
    const existingDateErrors: Record<string, string> = {};
    if (row.errors?.['effDate']) existingDateErrors['effDate'] = row.errors['effDate'];
    if (row.errors?.['termDate']) existingDateErrors['termDate'] = row.errors['termDate'];
    row.errors = {};

    // Current Result Status validation
    if (!row.currentResultStatus || row.currentResultStatus.trim() === '') {
      row.errors['currentResultStatus'] = 'Current Result is required';
      isValid = false;
    } else if (row.currentResultStatus.trim().length > 5) {
      row.errors['currentResultStatus'] = 'Current Result cannot exceed 5 characters';
      isValid = false;
    }

    // New Result Status validation
    if (!row.newResultStatus || row.newResultStatus.trim() === '') {
      row.errors['newResultStatus'] = 'New Result is required';
      isValid = false;
    } else if (row.newResultStatus.trim().length > 5) {
      row.errors['newResultStatus'] = 'New Result cannot exceed 5 characters';
      isValid = false;
    }

    if (!row.overrideFlag) {
      row.errors['overrideFlag'] = 'Override Flag is required';
      isValid = false;
    }

    // Get row index for accessing ngModel controls
    const rowIndex = this.editableRows.indexOf(row);

    // Check for matDatepickerParse errors on date inputs
    const effDateControl = this.effDateInputs?.get(rowIndex);
    const termDateControl = this.termDateInputs?.get(rowIndex);
    const hasEffDateParseError = effDateControl?.errors?.['matDatepickerParse'];
    const hasTermDateParseError = termDateControl?.errors?.['matDatepickerParse'];

    const today = DateFieldValidationUtility.getMinDate(this.chapterOffset);

    // Effective Date validation
    // Check raw input element for text (catches invalid text for both new and existing rows)
    const effDateElement = document.getElementById('effDate-' + rowIndex) as HTMLInputElement;
    const hasEffDateText = !!effDateControl?.value || effDateControl?.errors?.['matDatepickerParse']
      || (effDateElement?.value && effDateElement.value.trim() !== '');

    if (hasEffDateParseError || (hasEffDateText && !row.effDate)) {
      row.errors['effDate'] = 'Invalid date format. Use DD-MM-YYYY or DD-MMM-YYYY';
      isValid = false;
    } else if (existingDateErrors['effDate'] && !row.effDate) {
      row.errors['effDate'] = existingDateErrors['effDate'];
      isValid = false;
    } else if (row.auditKey === 0) {
      // For new records: required and must be >= today
      if (!row.effDate) {
        row.errors['effDate'] = 'Effective Date is required';
        isValid = false;
      } else {
        const effDate = moment(row.effDate).startOf('day');
        if (effDate.isBefore(today, 'day')) {
          row.errors['effDate'] = `Effective Date cannot be before ${today.format('DD-MMM-YYYY').toUpperCase()}`;
          isValid = false;
        }
      }
    }

    // Termination Date validation
    // Check raw input element for text (catches cases where blur hasn't fired before save)
    const termDateElement = document.getElementById('termDate-' + rowIndex) as HTMLInputElement;
    const hasTermDateText = !!termDateControl?.value || termDateControl?.errors?.['matDatepickerParse']
      || (termDateElement?.value && termDateElement.value.trim() !== '');

    if (hasTermDateParseError || (hasTermDateText && !row.termDate)) {
      row.errors['termDate'] = 'Invalid date format. Use DD-MM-YYYY or DD-MMM-YYYY';
      isValid = false;
    } else if (existingDateErrors['termDate'] && !row.termDate) {
      // Restore error from inline validation (e.g. gibberish text typed)
      row.errors['termDate'] = existingDateErrors['termDate'];
      isValid = false;
    } else if (row.termDate) {
      const termDate = moment(row.termDate).startOf('day');
      const minTermDate = row.effDate ? moment(row.effDate).startOf('day') : today;

      if (termDate.isBefore(minTermDate, 'day')) {
        const minDateFormatted = minTermDate.format('DD-MMM-YYYY').toUpperCase();
        row.errors['termDate'] = row.effDate
          ? `Termination Date cannot be before Effective Date (${minDateFormatted})`
          : `Termination Date cannot be before ${minDateFormatted}`;
        isValid = false;
      } else if (termDate.isBefore(today, 'day')) {
        row.errors['termDate'] = `Termination Date cannot be before current date (${today.format('DD-MMM-YYYY').toUpperCase()})`;
        isValid = false;
      }
    }

    return isValid;
  }

  /**
   * Validate all rows
   */
  private validateAllRows(): boolean {
    let allValid = true;

    this.editableRows.forEach(row => {
      const isValid = this.validateRow(row);
      if (!isValid) {
        allValid = false;
      }
    });

    return allValid;
  }

  /**
   * Validate only dirty rows (modified or new)
   */
  private validateDirtyRows(): boolean {
    let allValid = true;

    this.editableRows.forEach((row, index) => {
      if (this.dirtyRowIds.has(index)) {
        const isValid = this.validateRow(row);
        if (!isValid) {
          allValid = false;
        }
      }
    });

    return allValid;
  }

  /**
   * Check if row has validation errors
   */
  hasRowErrors(row: OverrideRuleEditModel): boolean {
    return !!(row.errors && Object.keys(row.errors).length > 0);
  }

  /**
   * Cached flag - updated when rows are added/removed
   */
  hasNewRowsFlag = false;

  private updateHasNewRowsFlag(): void {
    this.hasNewRowsFlag = this.editableRows.some(row => row.auditKey === 0);
  }

  trackByRow(index: number, row: OverrideRuleEditModel): string | number {
    return row.auditKey > 0 ? row.auditKey : `new-${index}`;
  }

  /**
   * Save only modified rows (dirty rows)
   */
  onSave(): void {
    // Validate only dirty rows
    if (!this.validateDirtyRows()) {
      this.showValidationBanner = true;
      this.cdr.markForCheck();
      return;
    }

    // Prepare payload - send only dirty rows (modified or new)
    // API expects: testId, chapterId, currentResultStatus, newResultStatus, overrideFlag, interCode, effDate, termDate, auditKey
    // Format dates as YYYY-MM-DD string to avoid timezone issues
    const rowsToSave = this.editableRows
      .filter((_, index) => this.dirtyRowIds.has(index))
      .map(row => ({
        testId: row.testId,
        chapterId: row.chapterId,
        currentResultStatus: row.currentResultStatus.trim(),
        newResultStatus: row.newResultStatus.trim(),
        overrideFlag: row.overrideFlag,
        interCode: row.interCode,
        effDate: row.effDate ? this.formatDateForApi(row.effDate) : null,
        termDate: row.termDate ? this.formatDateForApi(row.termDate) : null,
        auditKey: row.auditKey
      }));

    this.isLoading = true;
    this.cdr.markForCheck();

    this.service.saveBulkOverrideRules(rowsToSave as any)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Show success message using SnackbarService
          if (response.success && response.message) {
            this.snackbarService.showSuccess(response.message);
          }

          // Exit edit mode
          this.isEditMode = false;
          this.showValidationBanner = false;
          this.editableRows = [];
          this.dirtyRowIds.clear();

          // Clear search keyword and reload ALL data (not filtered)
          this.requestState.searchKeyword = undefined;
          this.loadData();

          // Reload filter interdiction codes to include any newly added interdictions
          if (this.testIdControl.value) {
            this.loadFilterInterdictionCodes(this.testIdControl.value);
          }

          // Clear search bar text and refresh filter chips after *ngIf re-creates components
          setTimeout(() => {
            if (this.isDestroyed) return;
            if (this.searchBarComponent) {
              this.searchBarComponent.searchText = '';
            }
            this.filterChips = [...this.filterChips];
            this.cdr.detectChanges();
          });
        },
        error: () => {
          // Error snackbar shown by authInterceptor — hide loader, stay on edit table
          this.isLoading = false;
          this.cdr.markForCheck();
        }
      });
  }

  /**
   * Delete row from editable table
   */
  onDeleteRow(rowIndex: number): void {
    // Only allow deleting new rows (auditKey === 0)
    const row = this.editableRows[rowIndex];
    if (!row || row.auditKey !== 0) {
      return;
    }

    this.editableRows.splice(rowIndex, 1);
    this.dirtyRowIds.delete(rowIndex);

    // Re-index dirty rows after deletion
    const newDirtyIds = new Set<number>();
    this.dirtyRowIds.forEach(id => {
      if (id > rowIndex) {
        newDirtyIds.add(id - 1);
      } else if (id < rowIndex) {
        newDirtyIds.add(id);
      }
    });
    this.dirtyRowIds = newDirtyIds;
    this.updateHasNewRowsFlag();
    this.cdr.markForCheck();
  }

  /**
   * Format date for API - returns YYYY-MM-DD string without timezone
   */
  private formatDateForApi(date: moment.Moment | Date): string {
    if (moment.isMoment(date)) {
      return date.format('YYYY-MM-DD');
    }
    return moment(date).format('YYYY-MM-DD');
  }

}
