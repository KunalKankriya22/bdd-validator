import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ElementRef,
  ViewChild,
  signal,
  computed,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepicker, MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { MatPseudoCheckboxModule } from '@angular/material/core';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Subject, merge, takeUntil } from 'rxjs';
import moment from 'moment';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TablePageEvent,
  TableSortEvent,
} from '@shared/interfaces/data-table.interface';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { DD_MON_YYYY_FORMATS, UppercaseMomentDateAdapter } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { DateRangePairErrorStateMatcher } from '@shared/error-state-matchers/date-range-pair-error-state.matcher';
import { FormGroupChildErrorStateMatcher } from '@shared/error-state-matchers/form-group-child-error-state.matcher';

import { MultipleDriveSelectionQueryService } from './services/multiple-drive-selection-query.service';
import {
  MultipleDriveSelectionLookups,
  MultipleDriveFilterRequest,
  DriveRecord,
  LookupOption,
} from './models/multiple-drive-selection-query.model';
import { MultipleDriveFilterChipsUtils } from './utils/filter-chips.utils';
import { DescribeCriteriaDialog } from './components/describe-criteria-dialog/describe-criteria-dialog';

@Component({
  selector: 'app-multiple-drive-selection-query',
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
    MatDialogModule,
    MatSnackBarModule,
    MatPseudoCheckboxModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    SearchBar,
    FilterChips,
  ],
  templateUrl: './multiple-drive-selection-query.html',
  styleUrls: ['./multiple-drive-selection-query.scss'],
  providers: [
    { provide: DateAdapter, useClass: UppercaseMomentDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
  ],
})
export class MultipleDriveSelectionQueryComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('advancedFilterSection') advancedFilterSection?: ElementRef<HTMLElement>;
  @ViewChild('fromDatePicker') private fromDatePicker?: MatDatepicker<Date>;
  @ViewChild('toDatePicker') private toDatePicker?: MatDatepicker<Date>;

  private fb = inject(FormBuilder);
  private service = inject(MultipleDriveSelectionQueryService);
  private headerService = inject(HeaderService);
  private pageHeaderService = inject(PageHeaderService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private liveAnnouncer = inject(LiveAnnouncer);

  private destroy$ = new Subject<void>();

  // Signals for reactive state
  lookups = signal<MultipleDriveSelectionLookups | null>(null);
  drives = signal<DriveRecord[]>([]);
  totalRecords = signal<number>(0);
  isLoadingData = signal<boolean>(false);
  isLoadingLookups = signal<boolean>(false);
  searchKeyword = signal<string>('');
  appliedFilters = signal<MultipleDriveFilterRequest>({} as MultipleDriveFilterRequest);
  filterChips = signal<FilterChip[]>([]);
  selectedDriveIds = signal<Set<string>>(new Set());
  isFilterPanelOpen = signal<boolean>(false);

  // Computed values
  hasSearched = computed(() => this.drives().length > 0 || this.searchKeyword().length > 0);
  hasSelectedDrives = computed(() => this.selectedDriveIds().size > 0);
  hasActiveFilters = computed(() => {
    const filters = this.appliedFilters();
    return MultipleDriveFilterChipsUtils.hasActiveFilters(filters);
  });

  // Form
  filterForm!: FormGroup;
  /** Highlights From/To fields when cross-field `dateRangeInvalid` is set */
  dateRangeErrorMatcher!: DateRangePairErrorStateMatcher;
  /** Cross-field errors on `filterForm` for advanced filters */
  projectedDrawRangeErrorMatcher!: FormGroupChildErrorStateMatcher;
  driveDurationRangeErrorMatcher!: FormGroupChildErrorStateMatcher;
  driveStartTimeRangeErrorMatcher!: FormGroupChildErrorStateMatcher;
  readonly multiSelectPanelClass = 'multiple-drive-selection-query-panel';

  /**
   * Stable array refs for template *ngFor — inline literals recreate arrays every CD and force
   * MatSelect to tear down/rebuild all options (major jank with many dropdowns open).
   */
  readonly travelTimeMinuteOptions = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60];
  readonly durationHourOptions = [
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23,
  ];
  readonly durationMinuteOptions = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  /** Cached start-of-day ms for datepicker filters (updated only when From/To change). */
  private cachedToDayStartMs: number | null = null;
  private cachedFromDayStartMs: number | null = null;

  readonly trackByLookupCode = (_index: number, option: LookupOption): string => option.code;
  readonly trackByStringCode = (_index: number, code: string): string => code;
  readonly trackByNumber = (_index: number, n: number): number => n;

  /** Special value to represent "All" selection in multi-select dropdowns */
  readonly ALL_OPTION_VALUE = '__ALL__';

  /**
   * Calendar: allow only dates on or before To Date — O(1), no moment per cell.
   * The datepicker may pass Moment or other adapter types, not only native Date.
   */
  fromDateCalendarFilter = (d: unknown): boolean => {
    if (this.cachedToDayStartMs == null) {
      return true;
    }
    const coerced = this.coerceToDate(d);
    if (!coerced) {
      return true;
    }
    return this.startOfLocalDayMs(coerced) <= this.cachedToDayStartMs;
  };

  /**
   * Calendar: allow only dates on or after From Date — O(1), no moment per cell.
   * The datepicker may pass Moment or other adapter types, not only native Date.
   */
  toDateCalendarFilter = (d: unknown): boolean => {
    if (this.cachedFromDayStartMs == null) {
      return true;
    }
    const coerced = this.coerceToDate(d);
    if (!coerced) {
      return true;
    }
    return this.startOfLocalDayMs(coerced) >= this.cachedFromDayStartMs;
  };

  // Default visible columns
  private defaultColumnKeys: string[] = [];
  private allColumns: any[] = [];

  /** Reactive header: both actions enable when at least one table row is selected */
  headerConfig = computed<PageHeaderConfig>(() => {
    const hasSelection = this.hasSelectedDrives();
    return {
      breadcrumbs: [
        { label: 'Home', link: '/' },
        { label: 'Donor Functions', link: '/donor-functions' },
        { label: 'Recruitment', link: '/donor-functions/recruitment' },
        { label: 'Recruitment Queries', link: '/donor-functions/recruitment/recruitment-queries' },
      ],
      title: 'Multiple Drive Selection Query',
      subtitle: 'Find multiple drive details',
      actions: [
        {
          label: 'DESCRIBE CRITERIA',
          matButton: 'stroked',
          color: 'accent',
          onClick: () => this.openDescribeCriteria(),
          disabled: !hasSelection,
        },
        {
          label: 'DRIVE DETAILS',
          matButton: 'raised',
          color: 'primary',
          ariaLabel: 'Drive details for selected drives (not yet available)',
          onClick: () => this.navigateToDriveDetails(),
          // Drive Details Query screen is not routed yet — enable when registered (see navigateToDriveDetails).
          disabled: true,
        },
      ],
    };
  });

  // Table configuration
  tableConfig: DataTableConfig<DriveRecord> = {
    columns: [
      {
        key: 'driveDate',
        header: 'Drive Date',
        sortable: true,
        type: 'text',
        width: '140px',
        valueFormatter: (value) => this.formatDate(value),
      },
      {
        key: 'driveId',
        header: 'Drive ID',
        sortable: true,
        type: 'text',
        width: '120px',
      },
      {
        key: 'pgy',
        header: 'Pgy',
        sortable: false,
        type: 'text',
        width: '80px',
      },
      {
        key: 'sponsorName',
        header: 'Sponsor Name',
        sortable: true,
        type: 'text',
        width: '250px',
      },
      {
        key: 'travel',
        header: 'Travel',
        sortable: false,
        type: 'text',
        width: '100px',
      },
      {
        key: 'duration',
        header: 'Duration',
        sortable: false,
        type: 'text',
        width: '100px',
      },
      {
        key: 'status',
        header: 'Status',
        sortable: false,
        type: 'text',
        width: '120px',
      },
      {
        key: 'recruiter',
        header: 'Recruiter',
        sortable: false,
        type: 'text',
        width: '150px',
      },
      {
        key: 'projectedShow',
        header: 'Projected SHOW',
        sortable: false,
        type: 'number',
        width: '140px',
        cellClass: 'text-right',
      },
      {
        key: 'projectedDraw',
        header: 'Projected DRAW',
        sortable: false,
        type: 'number',
        width: '140px',
        cellClass: 'text-right',
      },
    ],
    pagination: {
      pageSize: 25,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50, 100],
      showFirstLastButtons: true,
    },
    sortConfig: {
      column: 'driveDate',
      direction: 'A',
    },
    stickyHeader: true,
    showPagination: true,
    emptyMessage: 'No drives found. Please adjust your search criteria and try again.',
    enableSelection: true,
    selectionKey: 'driveId',
  };

  // Search bar configuration
  searchConfig: SearchBarConfig = {
    placeholder: 'Search by Drive ID or Sponsor Name',
    minLength: 0,
    ariaLabel: 'Search drives',
    debounceTime: 500,
    searchOnEnterOnly: false,
  };

  ngOnInit(): void {
    this.initializeForm();
    this.dateRangeErrorMatcher = new DateRangePairErrorStateMatcher(() => this.filterForm);
    this.projectedDrawRangeErrorMatcher = new FormGroupChildErrorStateMatcher(
      () => this.filterForm,
      'projectedDrawRange',
    );
    this.driveDurationRangeErrorMatcher = new FormGroupChildErrorStateMatcher(
      () => this.filterForm,
      'driveDurationRange',
    );
    this.driveStartTimeRangeErrorMatcher = new FormGroupChildErrorStateMatcher(
      () => this.filterForm,
      'driveStartTimeRange',
    );
    this.syncDatepickerBounds();
    this.filterForm
      .get('toDate')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => this.syncDatepickerBounds());
    this.filterForm
      .get('fromDate')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => this.syncDatepickerBounds());
    this.loadLookups();

    // Store default columns
    this.allColumns = [...this.tableConfig.columns];
    this.defaultColumnKeys = this.allColumns.map((col) => col.key);
  }

  ngAfterViewInit(): void {
    const closedStreams = [
      this.fromDatePicker?.closedStream,
      this.toDatePicker?.closedStream,
    ].filter((s): s is NonNullable<typeof s> => !!s);
    if (closedStreams.length > 0) {
      merge(...closedStreams)
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          queueMicrotask(() => (document.activeElement as HTMLElement | null)?.blur?.());
        });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize the filter form
   */
  private initializeForm(): void {
    this.filterForm = this.fb.group(
      {
        // Main filter bar
        select: [[]],
        fromDate: [null, Validators.required],
        toDate: [null, Validators.required],
        facility: [[]],
        status: [[]],
        sponsor: [[]],

        // Advanced filters
        zipCode: [[]],
        sponsorCategory: [''],
        territory: [[]],
        procedure: [''],
        driveCategory: [[]],
        fixedDrive: [''],

        // Numeric ranges
        minimumProjectDraw: [null],
        maximumProjectDraw: [null],

        // Travel time
        minimumTravelTime: [null],
        maximumTravelTime: [null],

        // Drive duration
        minimumDriveDurationHour: [0],
        minimumDriveDurationMinute: [0],
        maximumDriveDurationHour: [0],
        maximumDriveDurationMinute: [0],

        // Drive start time
        minimumDriveStartTimeEnterTime: ['', [Validators.pattern(/^(0?[1-9]|1[0-2]):[0-5][0-9]$/)]],
        minimumDriveStartTimeAMorPM: [''],
        maximumDriveStartTimeEnterTime: ['', [Validators.pattern(/^(0?[1-9]|1[0-2]):[0-5][0-9]$/)]],
        maximumDriveStartTimeAMorPM: [''],
      },
      {
        validators: [
          DateFieldValidationUtility.fromToDateRangeValidator('fromDate', 'toDate'),
          this.projectedDrawRangeValidator(),
          this.driveDurationRangeValidator(),
          this.driveStartTimeRangeValidator(),
        ],
      },
    );
  }

  /**
   * Load lookup data for dropdowns
   */
  private loadLookups(): void {
    this.isLoadingLookups.set(true);

    this.service
      .getLookups()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (lookups) => {
          this.lookups.set(lookups);
          this.isLoadingLookups.set(false);
        },
        error: (error) => {
          console.error('Error loading lookups:', error);
          this.isLoadingLookups.set(false);
          this.showError('Failed to load filter options. Please try again.');
        },
      });
  }

  /**
   * Retrieve drives based on filters
   */
  onRetrieve(): void {
    if (this.filterForm.invalid) {
      this.filterForm.markAllAsTouched();
      return;
    }

    this.searchDrives();
  }

  /**
   * Apply filters from advanced search panel
   * Triggers search and closes the advanced panel
   */
  onApplyFilters(): void {
    if (this.filterForm.invalid) {
      this.filterForm.markAllAsTouched();
      return;
    }

    // Trigger search
    this.searchDrives();

    // Close advanced search panel
    this.isFilterPanelOpen.set(false);
  }

  /**
   * Search drives with current filters and pagination
   */
  private searchDrives(): void {
    const formValue = this.filterForm.value;
    const pageSize = this.tableConfig.pagination?.pageSize || 25;
    const pageIndex = this.tableConfig.pagination?.pageIndex || 0;
    const skip = pageIndex * pageSize;

    // Build filter request
    const filters: MultipleDriveFilterRequest = {
      fromDate: this.formatDateForApi(formValue.fromDate),
      toDate: this.formatDateForApi(formValue.toDate),
      searchKeyword: this.searchKeyword() || undefined,
      sort: this.buildSortString(),
      select: formValue.select?.length > 0 ? formValue.select : undefined,
      facility: formValue.facility?.length > 0 ? formValue.facility : undefined,
      status: formValue.status?.length > 0 ? formValue.status : undefined,
      sponsors: formValue.sponsor?.length > 0 ? formValue.sponsor : undefined,
      zipCode: formValue.zipCode?.length > 0 ? formValue.zipCode : undefined,
      sponsorCategory: formValue.sponsorCategory || undefined,
      territory: formValue.territory?.length > 0 ? formValue.territory : undefined,
      procedure: formValue.procedure || undefined,
      driveCategory: formValue.driveCategory?.length > 0 ? formValue.driveCategory : undefined,
      fixedDrive: formValue.fixedDrive || undefined,
      minimumProjectDraw: formValue.minimumProjectDraw || undefined,
      maximumProjectDraw: formValue.maximumProjectDraw || undefined,
      minimumTravelTime: formValue.minimumTravelTime ?? undefined,
      maximumTravelTime: formValue.maximumTravelTime ?? undefined,
      minimumDriveDurationHour: formValue.minimumDriveDurationHour || undefined,
      minimumDriveDurationMinute: formValue.minimumDriveDurationMinute || undefined,
      maximumDriveDurationHour: formValue.maximumDriveDurationHour || undefined,
      maximumDriveDurationMinute: formValue.maximumDriveDurationMinute || undefined,
      minimumDriveStartTimeEnterTime: formValue.minimumDriveStartTimeEnterTime || undefined,
      minimumDriveStartTimeAMorPM: formValue.minimumDriveStartTimeAMorPM || undefined,
      maximumDriveStartTimeEnterTime: formValue.maximumDriveStartTimeEnterTime || undefined,
      maximumDriveStartTimeAMorPM: formValue.maximumDriveStartTimeAMorPM || undefined,
    };

    this.appliedFilters.set(filters);
    this.updateFilterChips();
    this.isLoadingData.set(true);

    this.service
      .searchDrives(pageSize, skip, filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.drives.set(response.data);
          this.totalRecords.set(response.total);

          if (this.tableConfig.pagination) {
            this.tableConfig.pagination.totalRecords = response.total;
          }

          this.isLoadingData.set(false);

          // Screen reader announcement
          this.liveAnnouncer.announce(`${response.total} drives found`, 'polite');
        },
        error: (error) => {
          console.error('Error searching drives:', error);
          this.isLoadingData.set(false);
          this.showError('Failed to search drives. Please try again.');
        },
      });
  }

  /**
   * Handle page change event
   */
  onPageChange(event: TablePageEvent): void {
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageSize = event.pageSize;
      this.tableConfig.pagination.pageIndex = event.pageIndex;
    }
    this.searchDrives();
  }

  /**
   * Handle sort change event
   */
  onSortChange(event: TableSortEvent): void {
    if (this.tableConfig.sortConfig) {
      this.tableConfig.sortConfig.column = event.column;
      this.tableConfig.sortConfig.direction = event.direction;
    }
    this.searchDrives();
  }

  /**
   * Handle search change event
   */
  onSearchChange(searchText: string): void {
    this.searchKeyword.set(searchText);

    // Reset to first page
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    // Only search if we have existing results or a search keyword
    if (this.hasSearched()) {
      this.searchDrives();
    }
  }

  /**
   * Handle row selection change
   */
  onSelectionChange(selectedDrives: DriveRecord[]): void {
    const selectedIds = new Set(
      selectedDrives.map((d) => d.driveId).filter((id) => id) as string[],
    );
    this.selectedDriveIds.set(selectedIds);

    // Screen reader announcement
    this.liveAnnouncer.announce(`${selectedIds.size} drives selected`, 'polite');
  }

  /**
   * Toggle advanced filter panel (inline expansion).
   * Panel stays in the DOM (hidden when closed) so opening is instant — no *ngIf teardown.
   */
  openAdvancedSearch(event?: Event): void {
    const next = !this.isFilterPanelOpen();
    this.isFilterPanelOpen.set(next);

    if (next) {
      queueMicrotask(() => {
        this.advancedFilterSection?.nativeElement?.scrollIntoView({
          block: 'nearest',
          behavior: 'auto',
        });
      });
    }

    const target = event?.currentTarget;
    if (target instanceof HTMLElement) {
      queueMicrotask(() => target.blur());
    }
  }

  /**
   * Clear advanced filters only
   */
  onClearAdvancedFilters(): void {
    this.filterForm.patchValue({
      zipCode: [],
      sponsorCategory: '',
      territory: [],
      procedure: '',
      driveCategory: [],
      fixedDrive: '',
      minimumProjectDraw: null,
      maximumProjectDraw: null,
      minimumTravelTime: null,
      maximumTravelTime: null,
      minimumDriveDurationHour: 0,
      minimumDriveDurationMinute: 0,
      maximumDriveDurationHour: 0,
      maximumDriveDurationMinute: 0,
      minimumDriveStartTimeEnterTime: '',
      minimumDriveStartTimeAMorPM: '',
      maximumDriveStartTimeEnterTime: '',
      maximumDriveStartTimeAMorPM: '',
    });
  }

  /**
   * Remove a filter chip
   */
  onRemoveFilterChip(chipKey: string): void {
    const currentFilters = this.appliedFilters();

    // Find the chip to get its value
    const chip = this.filterChips().find((c) => c.key === chipKey);
    const chipValue = chip?.value;

    const updatedFilters = MultipleDriveFilterChipsUtils.removeFilterByChipKey(
      currentFilters,
      chipKey,
      chipValue,
    );

    // Update form controls
    this.updateFormFromFilters(updatedFilters);

    // Re-search
    this.onRetrieve();
  }

  /**
   * Clear all filters (including advanced filters)
   */
  onClearAllFilters(): void {
    this.filterForm.reset({
      select: [],
      fromDate: null,
      toDate: null,
      facility: [],
      status: [],
      sponsor: [],
      zipCode: [],
      sponsorCategory: '',
      territory: [],
      procedure: '',
      driveCategory: [],
      fixedDrive: '',
      minimumProjectDraw: null,
      maximumProjectDraw: null,
      minimumTravelTime: null,
      maximumTravelTime: null,
      minimumDriveDurationHour: 0,
      minimumDriveDurationMinute: 0,
      maximumDriveDurationHour: 0,
      maximumDriveDurationMinute: 0,
      minimumDriveStartTimeEnterTime: '',
      minimumDriveStartTimeAMorPM: '',
      maximumDriveStartTimeEnterTime: '',
      maximumDriveStartTimeAMorPM: '',
    });

    this.appliedFilters.set({} as MultipleDriveFilterRequest);
    this.filterChips.set([]);
    this.searchKeyword.set('');
    this.drives.set([]);
    this.totalRecords.set(0);
    this.selectedDriveIds.set(new Set());

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
      this.tableConfig.pagination.totalRecords = 0;
    }

    // Close advanced search panel if it's open
    if (this.isFilterPanelOpen()) {
      this.isFilterPanelOpen.set(false);
    }
  }

  /**
   * Open describe criteria dialog
   */
  openDescribeCriteria(): void {
    const criteriaList = this.generateCriteriaDescription();

    this.dialog.open(DescribeCriteriaDialog, {
      width: '70%',
      minWidth: '600px',
      data: { criteriaList },
      restoreFocus: false,
    });
  }

  /**
   * Navigate to drive details for the current selection.
   * TODO: Add RouteKey + lazy route for Drive Details Query, register in donor-functions.routes,
   * then inject Router and navigate with that path and queryParams: { driveIds: selectedIds.join(',') },
   * and set the DRIVE DETAILS header action to disabled: !hasSelection.
   */
  navigateToDriveDetails(): void {
    const selectedIds = Array.from(this.selectedDriveIds());

    if (selectedIds.length === 0) {
      this.showError('Please select at least one drive.');
      return;
    }
  }

  /**
   * Generate criteria description for dialog
   */
  private generateCriteriaDescription(): string[] {
    const criteria: string[] = [];
    const filters = this.appliedFilters();
    const lookups = this.lookups();

    if (!lookups) {
      return ['No criteria available.'];
    }

    // Date range (required)
    if (filters.fromDate && filters.toDate) {
      const fromDate = moment(filters.fromDate).format('ddd MMM DD, YYYY');
      const toDate = moment(filters.toDate).format('ddd MMM DD, YYYY');
      criteria.push(`Drive Date Between: ${fromDate} and ${toDate}`);
    }

    // Select columns
    if (filters.select && filters.select.length > 0) {
      const columns = filters.select
        .map((c) => lookups.select.find((s) => s.code === c)?.description || c)
        .join(', ');
      criteria.push(`Selected Columns: ${columns}`);
    }

    // Facility
    if (filters.facility && filters.facility.length > 0) {
      const facilities = filters.facility
        .map((c) => lookups.facility.find((f) => f.code === c)?.description || c)
        .join(', ');
      criteria.push(`Facility: ${facilities}`);
    }

    // Status
    if (filters.status && filters.status.length > 0) {
      const statuses = filters.status
        .map((c) => lookups.status.find((s) => s.code === c)?.description || c)
        .join(', ');
      criteria.push(`Status: ${statuses}`);
    }

    // Sponsors
    if (filters.sponsors && filters.sponsors.length > 0) {
      const sponsors = filters.sponsors
        .map((c) => lookups.sponsors.find((s) => s.code === c)?.description || c)
        .join(', ');
      criteria.push(`Sponsors: ${sponsors}`);
    }

    // Zip Code
    if (filters.zipCode && filters.zipCode.length > 0) {
      const zipCodes = filters.zipCode
        .map((c) => lookups.zipCode.find((z) => z.code === c)?.description || c)
        .join(', ');
      criteria.push(`Zip Code: ${zipCodes}`);
    }

    // Sponsor Category
    if (filters.sponsorCategory) {
      const category =
        lookups.sponsorCategory.find((c) => c.code === filters.sponsorCategory)?.description ||
        filters.sponsorCategory;
      criteria.push(`Sponsor Category: ${category}`);
    }

    // Territory
    if (filters.territory && filters.territory.length > 0) {
      const territories = filters.territory
        .map((c) => lookups.territory.find((t) => t.code === c)?.description || c)
        .join(', ');
      criteria.push(`Territory: ${territories}`);
    }

    // Procedure
    if (filters.procedure) {
      const procedure =
        lookups.procedure.find((p) => p.code === filters.procedure)?.description ||
        filters.procedure;
      criteria.push(`Procedure: ${procedure}`);
    }

    // Drive Category
    if (filters.driveCategory && filters.driveCategory.length > 0) {
      const categories = filters.driveCategory
        .map((c) => lookups.driveCategory.find((d) => d.code === c)?.description || c)
        .join(', ');
      criteria.push(`Drive Category: ${categories}`);
    }

    // Fixed Drive
    if (filters.fixedDrive) {
      const fixedDrive =
        lookups.fixedDrive.find((f) => f.code === filters.fixedDrive)?.description ||
        filters.fixedDrive;

      if (filters.fixedDrive === 'I') {
        criteria.push('Include Fixed Drives');
      } else if (filters.fixedDrive === 'E') {
        criteria.push('Do Not Include Fixed Drives');
      } else if (filters.fixedDrive === 'O') {
        criteria.push('Only Fixed Drives');
      } else {
        criteria.push(`Fixed Drive: ${fixedDrive}`);
      }
    }

    // Projected Draw Range
    if (filters.minimumProjectDraw !== null && filters.minimumProjectDraw !== undefined) {
      criteria.push(`Minimum Projected Draw: ${filters.minimumProjectDraw}`);
    }
    if (filters.maximumProjectDraw !== null && filters.maximumProjectDraw !== undefined) {
      criteria.push(`Maximum Projected Draw: ${filters.maximumProjectDraw}`);
    }

    // Travel Time Range
    if (filters.minimumTravelTime !== null && filters.minimumTravelTime !== undefined) {
      criteria.push(`Minimum Travel Time: ${filters.minimumTravelTime} mins`);
    }
    if (filters.maximumTravelTime !== null && filters.maximumTravelTime !== undefined) {
      criteria.push(`Maximum Travel Time: ${filters.maximumTravelTime} mins`);
    }

    // Drive Duration
    if (filters.minimumDriveDurationHour || filters.minimumDriveDurationMinute) {
      const hrs = filters.minimumDriveDurationHour || 0;
      const mins = filters.minimumDriveDurationMinute || 0;
      criteria.push(`Minimum Drive Duration: ${hrs} hrs ${mins} mins`);
    }
    if (filters.maximumDriveDurationHour || filters.maximumDriveDurationMinute) {
      const hrs = filters.maximumDriveDurationHour || 0;
      const mins = filters.maximumDriveDurationMinute || 0;
      criteria.push(`Maximum Drive Duration: ${hrs} hrs ${mins} mins`);
    }

    // Drive Start Time
    if (filters.minimumDriveStartTimeEnterTime && filters.minimumDriveStartTimeAMorPM) {
      criteria.push(
        `Minimum Drive Start Time: ${filters.minimumDriveStartTimeEnterTime} ${filters.minimumDriveStartTimeAMorPM}`,
      );
    }
    if (filters.maximumDriveStartTimeEnterTime && filters.maximumDriveStartTimeAMorPM) {
      criteria.push(
        `Maximum Drive Start Time: ${filters.maximumDriveStartTimeEnterTime} ${filters.maximumDriveStartTimeAMorPM}`,
      );
    }

    // If no criteria applied (shouldn't happen with required date fields)
    if (criteria.length === 0) {
      criteria.push('No filter criteria applied.');
    }

    return criteria;
  }

  /**
   * Update filter chips display
   */
  private updateFilterChips(): void {
    const chips = MultipleDriveFilterChipsUtils.convertFiltersToChips(
      this.appliedFilters(),
      this.lookups(),
    );
    this.filterChips.set(chips);
  }

  /**
   * Update form from filter object
   */
  private updateFormFromFilters(filters: MultipleDriveFilterRequest): void {
    this.filterForm.patchValue({
      select: filters.select || [],
      facility: filters.facility || [],
      status: filters.status || [],
      sponsor: filters.sponsors || [],
      zipCode: filters.zipCode || [],
      sponsorCategory: filters.sponsorCategory || '',
      territory: filters.territory || [],
      procedure: filters.procedure || '',
      driveCategory: filters.driveCategory || [],
      fixedDrive: filters.fixedDrive || '',
      minimumProjectDraw: filters.minimumProjectDraw || null,
      maximumProjectDraw: filters.maximumProjectDraw || null,
      minimumTravelTime: filters.minimumTravelTime || null,
      maximumTravelTime: filters.maximumTravelTime || null,
      minimumDriveDurationHour: filters.minimumDriveDurationHour || 0,
      minimumDriveDurationMinute: filters.minimumDriveDurationMinute || 0,
      maximumDriveDurationHour: filters.maximumDriveDurationHour || 0,
      maximumDriveDurationMinute: filters.maximumDriveDurationMinute || 0,
      minimumDriveStartTimeEnterTime: filters.minimumDriveStartTimeEnterTime || '',
      minimumDriveStartTimeAMorPM: filters.minimumDriveStartTimeAMorPM || '',
      maximumDriveStartTimeEnterTime: filters.maximumDriveStartTimeEnterTime || '',
      maximumDriveStartTimeAMorPM: filters.maximumDriveStartTimeAMorPM || '',
    });
  }

  /**
   * Build sort string for API
   */
  private buildSortString(): string | undefined {
    const sortConfig = this.tableConfig.sortConfig;
    if (!sortConfig || sortConfig.direction === 'default') {
      return undefined;
    }

    const direction = sortConfig.direction === 'A' ? 'asc' : 'desc';
    return `${sortConfig.column} ${direction}`;
  }

  /** Mat-error text for From Date (required + range) */
  getFromDateErrorMessage(): string {
    return DateFieldValidationUtility.getDateErrorMessage(
      this.filterForm.get('fromDate'),
      this.filterForm.errors,
      'From Date',
      'From Date must be on or before To Date',
    );
  }

  /** Mat-error text for To Date (required + range) */
  getToDateErrorMessage(): string {
    return DateFieldValidationUtility.getDateErrorMessage(
      this.filterForm.get('toDate'),
      this.filterForm.errors,
      'To Date',
      'To Date must be on or after From Date',
    );
  }

  /** Form-level `projectedDrawRange` — show under Min / Max projected draw */
  getProjectedDrawRangeErrorMessage(): string {
    if (!this.filterForm.hasError('projectedDrawRange')) {
      return '';
    }
    if (
      !this.anyControlTouchedOrDirty(['minimumProjectDraw', 'maximumProjectDraw'])
    ) {
      return '';
    }
    const err = this.filterForm.errors?.['projectedDrawRange'];
    return typeof err === 'string' ? err : '';
  }

  /** Form-level `driveDurationRange` — single line under max duration (minute) */
  getDriveDurationRangeErrorMessage(): string {
    if (!this.filterForm.hasError('driveDurationRange')) {
      return '';
    }
    if (
      !this.anyControlTouchedOrDirty([
        'minimumDriveDurationHour',
        'minimumDriveDurationMinute',
        'maximumDriveDurationHour',
        'maximumDriveDurationMinute',
      ])
    ) {
      return '';
    }
    const err = this.filterForm.errors?.['driveDurationRange'];
    return typeof err === 'string' ? err : '';
  }

  /** Minimum drive start time: format errors only (range message on max field) */
  getMinimumDriveStartTimeEnterTimeErrorMessage(): string {
    const c = this.filterForm.get('minimumDriveStartTimeEnterTime');
    if (!c || !(c.touched || c.dirty)) {
      return '';
    }
    if (c.hasError('pattern') || c.hasError('invalidTime')) {
      return 'Invalid time format. Use HH:MM (12-hour format, e.g., 09:30)';
    }
    return '';
  }

  /** Maximum drive start time: format + form-level `driveStartTimeRange` */
  getMaximumDriveStartTimeEnterTimeErrorMessage(): string {
    const c = this.filterForm.get('maximumDriveStartTimeEnterTime');
    if (!c || !(c.touched || c.dirty)) {
      return '';
    }
    if (c.hasError('pattern') || c.hasError('invalidTime')) {
      return 'Invalid time format. Use HH:MM (12-hour format, e.g., 05:45)';
    }
    if (!this.filterForm.hasError('driveStartTimeRange')) {
      return '';
    }
    if (
      !this.anyControlTouchedOrDirty([
        'minimumDriveStartTimeEnterTime',
        'minimumDriveStartTimeAMorPM',
        'maximumDriveStartTimeEnterTime',
        'maximumDriveStartTimeAMorPM',
      ])
    ) {
      return '';
    }
    const err = this.filterForm.errors?.['driveStartTimeRange'];
    return typeof err === 'string' ? err : '';
  }

  private anyControlTouchedOrDirty(names: string[]): boolean {
    return names.some((name) => {
      const ctrl = this.filterForm.get(name);
      return !!(ctrl && (ctrl.touched || ctrl.dirty));
    });
  }

  /**
   * Format date for API (ISO 8601)
   */
  private formatDateForApi(date: any): string {
    if (!date) {
      return '';
    }
    return moment(date).format('YYYY-MM-DDTHH:mm:ss');
  }

  /**
   * Format date for display (DD-MON-YYYY)
   */
  private formatDate(date: any): string {
    if (!date) {
      return '';
    }
    return moment(date).format('DD-MMM-YYYY');
  }

  /**
   * Show error message
   */
  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar'],
    });
  }

  /**
   * Get display text for multi-select dropdown (shows first 2 items + count)
   */
  getMultiSelectDisplay(
    controlName: string,
    lookupKey: keyof MultipleDriveSelectionLookups,
  ): string {
    const values = (this.filterForm.get(controlName)?.value as string[]) || [];
    if (values.length === 0) {
      return '';
    }

    const lookups = this.lookups()?.[lookupKey] || [];
    const descriptions = values.map((code) => {
      const lookup = lookups.find((l: LookupOption) => l.code === code);
      return lookup?.description || code;
    });

    if (descriptions.length <= 2) {
      return descriptions.join(', ');
    }

    return `${descriptions.slice(0, 2).join(', ')} +${descriptions.length - 2}`;
  }

  /**
   * Remove a selected value from multi-select
   */
  removeMultiSelectValue(controlName: string, valueToRemove: string, event: Event): void {
    event.stopPropagation();
    const currentValues = (this.filterForm.get(controlName)?.value as string[]) || [];
    const updatedValues = currentValues.filter((v) => v !== valueToRemove);
    this.filterForm.get(controlName)?.setValue(updatedValues);
  }

  /**
   * Get description for a code from a lookup array
   */
  getLookupDescription(code: string, lookupKey: keyof MultipleDriveSelectionLookups): string {
    const lookups = this.lookups()?.[lookupKey] || [];
    const lookup = lookups.find((l: LookupOption) => l.code === code);
    return lookup?.description || code;
  }

  /**
   * Handle selection change for multi-select dropdowns with "All" option
   */
  onMultiSelectChange(controlName: string, lookupKey: keyof MultipleDriveSelectionLookups): void {
    const control = this.filterForm.get(controlName);
    if (!control) return;

    const selectedValues = control.value as string[] || [];
    const allOptions = this.lookups()?.[lookupKey] || [];
    const allOptionCodes = allOptions.map((opt: LookupOption) => opt.code);

    // Check if "All" was just selected
    if (selectedValues.includes(this.ALL_OPTION_VALUE)) {
      // If "All" is selected, select all other options and remove "All" from the array
      control.setValue(allOptionCodes, { emitEvent: false });
    } else {
      // Check if all individual options are selected
      const allIndividualOptionsSelected = allOptionCodes.every(code => selectedValues.includes(code));

      if (allIndividualOptionsSelected && allOptionCodes.length > 0) {
        // If all options are selected, we don't need to do anything special
        // The "All" checkbox will appear checked via isAllSelected()
      }
    }
  }

  /**
   * Check if all options are selected for a given multi-select dropdown
   */
  isAllSelected(controlName: string, lookupKey: keyof MultipleDriveSelectionLookups): boolean {
    const control = this.filterForm.get(controlName);
    if (!control) return false;

    const selectedValues = control.value as string[] || [];
    const allOptions = this.lookups()?.[lookupKey] || [];
    const allOptionCodes = allOptions.map((opt: LookupOption) => opt.code);

    return allOptionCodes.length > 0 && allOptionCodes.every(code => selectedValues.includes(code));
  }

  /**
   * Check if some (but not all) options are selected for indeterminate state
   */
  isSomeSelected(controlName: string, lookupKey: keyof MultipleDriveSelectionLookups): boolean {
    const control = this.filterForm.get(controlName);
    if (!control) return false;

    const selectedValues = control.value as string[] || [];
    const allOptions = this.lookups()?.[lookupKey] || [];
    const allOptionCodes = allOptions.map((opt: LookupOption) => opt.code);

    const selectedCount = selectedValues.filter(val => allOptionCodes.includes(val)).length;
    return selectedCount > 0 && selectedCount < allOptionCodes.length;
  }

  /**
   * Get checkbox state for "All" option
   */
  getAllCheckboxState(controlName: string, lookupKey: keyof MultipleDriveSelectionLookups): 'checked' | 'unchecked' | 'indeterminate' {
    if (this.isAllSelected(controlName, lookupKey)) {
      return 'checked';
    } else if (this.isSomeSelected(controlName, lookupKey)) {
      return 'indeterminate';
    }
    return 'unchecked';
  }

  /**
   * Toggle all options for a multi-select dropdown
   */
  toggleAllSelection(controlName: string, lookupKey: keyof MultipleDriveSelectionLookups): void {
    const control = this.filterForm.get(controlName);
    if (!control) return;

    const allOptions = this.lookups()?.[lookupKey] || [];
    const allOptionCodes = allOptions.map((opt: LookupOption) => opt.code);

    if (this.isAllSelected(controlName, lookupKey)) {
      // Deselect all
      control.setValue([], { emitEvent: false });
    } else {
      // Select all
      control.setValue(allOptionCodes, { emitEvent: false });
    }
  }

  /**
   * Check if required date fields are filled
   */
  areDatesFilledAndValid(): boolean {
    const fromDate = this.filterForm.get('fromDate')?.value;
    const toDate = this.filterForm.get('toDate')?.value;
    const fromDateControl = this.filterForm.get('fromDate');
    const toDateControl = this.filterForm.get('toDate');

    return !!(fromDate && toDate && fromDateControl?.valid && toDateControl?.valid && !this.filterForm.errors?.['dateRangeInvalid']);
  }

  /**
   * Apply filters from a specific multi-select dropdown
   * Triggers search if dates are filled
   */
  onApplyDropdownFilter(event: Event): void {
    event.stopPropagation();

    const fromDate = this.filterForm.get('fromDate')?.value;
    const toDate = this.filterForm.get('toDate')?.value;

    // Only trigger search if both dates are filled
    if (fromDate && toDate && this.filterForm.valid) {
      this.searchDrives();
    }
  }

  /**
   * Restrict time input to numbers and colon only
   */
  onTimeKeyPress(event: KeyboardEvent): void {
    const allowedKeys = [
      'Backspace',
      'Delete',
      'Tab',
      'ArrowLeft',
      'ArrowRight',
      'Home',
      'End',
      'Enter',
    ];
    const key = event.key;

    // Allow control keys
    if (allowedKeys.includes(key)) {
      return;
    }

    // Allow only digits and colon
    if (!/^[0-9:]$/.test(key)) {
      event.preventDefault();
    }
  }

  /**
   * Handle time input as user types
   */
  onTimeInput(event: Event, controlName: string): void {
    const input = event.target as HTMLInputElement;
    let value = input.value;

    // Remove any non-digit and non-colon characters
    value = value.replace(/[^0-9:]/g, '');

    // Prevent multiple colons
    const colonCount = (value.match(/:/g) || []).length;
    if (colonCount > 1) {
      value = value.substring(0, value.lastIndexOf(':'));
    }

    // Auto-add colon after 2 digits
    if (value.length === 2 && !value.includes(':')) {
      value = value + ':';
    }

    // Limit to 5 characters (HH:MM)
    if (value.length > 5) {
      value = value.substring(0, 5);
    }

    // Update the form control value
    const control = this.filterForm.get(controlName);
    if (control) {
      control.setValue(value, { emitEvent: false });
      // Update the input element to match
      input.value = value;
    }
  }

  /**
   * Format and validate time input on blur
   */
  formatTimeInput(controlName: string): void {
    const control = this.filterForm.get(controlName);
    if (!control) return;

    let value = control.value?.trim();
    if (!value) {
      control.setErrors(null);
      return;
    }

    // Remove any non-digit and non-colon characters
    value = value.replace(/[^0-9:]/g, '');

    // Handle cases like "1:30" -> "01:30" or "12:5" -> "12:05"
    const parts = value.split(':');
    if (parts.length === 2) {
      let hours = parts[0];
      let minutes = parts[1];

      // Pad hours to 2 digits
      if (hours.length === 1) {
        hours = '0' + hours;
      }

      // Pad minutes to 2 digits
      if (minutes.length === 1) {
        minutes = '0' + minutes;
      }

      // Validate hours (01-12)
      const hoursNum = parseInt(hours, 10);
      if (hoursNum < 1 || hoursNum > 12) {
        control.setErrors({ invalidTime: true });
        return;
      }

      // Validate minutes (00-59)
      const minutesNum = parseInt(minutes, 10);
      if (minutesNum < 0 || minutesNum > 59) {
        control.setErrors({ invalidTime: true });
        return;
      }

      // Clear errors and set formatted value
      control.setErrors(null);
      control.setValue(`${hours}:${minutes}`, { emitEvent: false });
      control.updateValueAndValidity({ emitEvent: false });
    } else if (parts.length === 1 && value.length > 0) {
      // If user typed digits without colon, try to parse as HHMM
      if (value.length === 3 || value.length === 4) {
        const hours = value.length === 3 ? value.substring(0, 1) : value.substring(0, 2);
        const minutes = value.length === 3 ? value.substring(1, 3) : value.substring(2, 4);

        const paddedHours = hours.length === 1 ? '0' + hours : hours;
        const paddedMinutes = minutes.length === 1 ? '0' + minutes : minutes;

        // Validate and set
        const hoursNum = parseInt(paddedHours, 10);
        const minutesNum = parseInt(paddedMinutes, 10);

        if (hoursNum >= 1 && hoursNum <= 12 && minutesNum >= 0 && minutesNum <= 59) {
          control.setErrors(null);
          control.setValue(`${paddedHours}:${paddedMinutes}`, { emitEvent: false });
          control.updateValueAndValidity({ emitEvent: false });
        } else {
          control.setErrors({ invalidTime: true });
        }
      } else {
        control.setErrors({ invalidTime: true });
      }
    }
  }

  /**
   * Projected draw range validator
   */
  private projectedDrawRangeValidator(): ValidatorFn {
    return (formGroup: AbstractControl): ValidationErrors | null => {
      const min = formGroup.get('minimumProjectDraw')?.value;
      const max = formGroup.get('maximumProjectDraw')?.value;

      if (min != null && max != null && min > max) {
        return { projectedDrawRange: 'Minimum cannot exceed Maximum' };
      }
      return null;
    };
  }

  /**
   * Drive duration range validator
   */
  private driveDurationRangeValidator(): ValidatorFn {
    return (formGroup: AbstractControl): ValidationErrors | null => {
      const minHrs = formGroup.get('minimumDriveDurationHour')?.value || 0;
      const minMins = formGroup.get('minimumDriveDurationMinute')?.value || 0;
      const maxHrs = formGroup.get('maximumDriveDurationHour')?.value || 0;
      const maxMins = formGroup.get('maximumDriveDurationMinute')?.value || 0;

      const minTotal = minHrs * 60 + minMins;
      const maxTotal = maxHrs * 60 + maxMins;

      if (minTotal > maxTotal) {
        return { driveDurationRange: 'Minimum duration cannot exceed Maximum' };
      }
      return null;
    };
  }

  /**
   * Drive start time range validator
   */
  private driveStartTimeRangeValidator(): ValidatorFn {
    return (formGroup: AbstractControl): ValidationErrors | null => {
      const minTime = formGroup.get('minimumDriveStartTimeEnterTime')?.value;
      const minAmPm = formGroup.get('minimumDriveStartTimeAMorPM')?.value;
      const maxTime = formGroup.get('maximumDriveStartTimeEnterTime')?.value;
      const maxAmPm = formGroup.get('maximumDriveStartTimeAMorPM')?.value;

      // Skip validation if any field is empty
      if (!minTime || !minAmPm || !maxTime || !maxAmPm) {
        return null;
      }

      // Convert to 24-hour format for comparison
      const min24 = this.convertTo24Hour(minTime, minAmPm);
      const max24 = this.convertTo24Hour(maxTime, maxAmPm);

      if (min24 > max24) {
        return { driveStartTimeRange: 'Minimum start time cannot be after Maximum' };
      }
      return null;
    };
  }

  /**
   * Convert time to 24-hour format for comparison
   */
  private convertTo24Hour(time: string, amPm: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    let hour24 = hours;

    if (amPm === 'PM' && hours !== 12) {
      hour24 += 12;
    } else if (amPm === 'AM' && hours === 12) {
      hour24 = 0;
    }

    return hour24 * 60 + (minutes || 0);
  }

  private startOfLocalDayMs(d: Date): number {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  }

  private coerceToDate(value: unknown): Date | null {
    if (value == null || value === '') {
      return null;
    }
    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? null : value;
    }
    if (moment.isMoment(value)) {
      const d = (value as moment.Moment).toDate();
      return Number.isNaN(d.getTime()) ? null : d;
    }
    const d = new Date(value as string | number);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  private syncDatepickerBounds(): void {
    if (!this.filterForm) {
      return;
    }
    const toD = this.coerceToDate(this.filterForm.get('toDate')?.value);
    const fromD = this.coerceToDate(this.filterForm.get('fromDate')?.value);
    this.cachedToDayStartMs = toD ? this.startOfLocalDayMs(toD) : null;
    this.cachedFromDayStartMs = fromD ? this.startOfLocalDayMs(fromD) : null;
  }
}
