import { Component, Injectable, OnInit, OnDestroy, AfterViewInit, ViewEncapsulation, signal, computed, effect, ViewChild, ElementRef, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { OverlayModule, CdkConnectedOverlay } from '@angular/cdk/overlay';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, ErrorStateMatcher } from '@angular/material/core';
import moment from 'moment';
import { Subject, takeUntil } from 'rxjs';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { convertUTCToTimezone } from '@shared/date/timezone.util';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TablePageEvent, TableSortEvent } from '@shared/interfaces/data-table.interface';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';

import {
  GradedDonationRecord,
  GradedDonorRecord,
  GradedDonorsQueryParams,
  UnitHoldsDialogData,
  DonorHoldsDialogData,
  GRADED_DONORS_VALIDATION_MESSAGES
} from './models/graded-donors-query.model';
import { GradedDonorsQueryService } from './services/graded-donors-query.service';
import { UnitHoldsDialogComponent } from './components/unit-holds-dialog/unit-holds-dialog';
import { DonorHoldsDialogComponent } from './components/donor-holds-dialog/donor-holds-dialog';
import { FiltersDialogComponent, FiltersDialogData } from './components/filters-dialog/filters-dialog';
import { validateUnitIdFormat } from './utils/unit-id-validator';
import { GradedDonorsFilterChipsUtils } from './utils/filter-chips.utils';

/**
 * Custom MatPaginatorIntl to change 'items per page' to 'rows per page'
 */
@Injectable()
class CustomPaginatorIntl extends MatPaginatorIntl {
  override itemsPerPageLabel = 'Rows per page:';
}

/**
 * Graded Donors Query Component
 *
 * Purpose: Investigate a donor match from entry of key data
 * Limitations: Only problem matches will be presented for query
 * Prerequisites: Donors must have been placed on hold in the Find Donor program
 *
 * This is a view-only screen - no changes can be committed to the database
 */
@Component({
  selector: 'app-graded-donors-query',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatMomentDateModule,
    MatDatepickerModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    OverlayModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    FiltersDialogComponent,
    DataTable,
    FilterChips
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MatPaginatorIntl, useClass: CustomPaginatorIntl }
  ],
  templateUrl: './graded-donors-query.html',
  styleUrls: ['./graded-donors-query.scss'],
  encapsulation: ViewEncapsulation.None
})
export class GradedDonorsQueryComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('donationsFilterBtn', { read: ElementRef }) donationsFilterBtn!: ElementRef;
  @ViewChild('donorsFilterBtn', { read: ElementRef }) donorsFilterBtn!: ElementRef;
  @ViewChild('fromDateInput') fromDateInput?: ElementRef<HTMLInputElement>;
  @ViewChild('toDateInput') toDateInput?: ElementRef<HTMLInputElement>;

  private destroy$ = new Subject<void>();
  private lastChangedDateField: 'from' | 'to' | null = null;

  // Header configuration
  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
    actions: []
  };

  // Query Form
  queryForm!: FormGroup;

  // Dropdown options
  unitIdOptions = signal<{ unitId: string; lastName: string; displayValue: string }[]>([]);
  lastNameOptions = signal<string[]>([]);
  filteredUnitIds = signal<{ unitId: string; lastName: string; displayValue: string }[]>([]);
  filteredLastNames = signal<string[]>([]);


  // Error state matchers for date fields - shows mat-error for form-group level errors
  fromDateErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control): boolean => {
      if (!control) return false;
      if (control.invalid && (control.touched || control.dirty)) return true;
      if (this.lastChangedDateField === 'from' && this.queryForm?.errors?.['dateRangeInvalid'] && control.touched) return true;
      return false;
    }
  };

  toDateErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control): boolean => {
      if (!control) return false;
      if (control.invalid && (control.touched || control.dirty)) return true;
      if (this.lastChangedDateField === 'to' && this.queryForm?.errors?.['dateRangeInvalid'] && control.touched) return true;
      return false;
    }
  };

  // Retrieve button disabled state - disable when all fields are empty
  isRetrieveDisabled = signal<boolean>(true);

  // Clear All button disabled state - disable when all fields are empty
  isClearAllDisabled = signal<boolean>(true);

  // Oracle Forms behavior: Auto-disable fields (mutually exclusive: Unit/Deferral ID, Last Name, Date Range)
  isUnitIdDisabled = signal<boolean>(false);
  isLastNameDisabled = signal<boolean>(false);
  isDateRangeDisabled = signal<boolean>(false);

  // Tab management
  selectedTabIndex = signal<number>(0);
  currentTab = computed(() => this.selectedTabIndex() === 0 ? 'Donations' : 'Donors');

  // Data signals
  gradedDonations = signal<GradedDonationRecord[]>([]);
  gradedDonors = signal<GradedDonorRecord[]>([]);
  donationsTotalRecords = signal<number>(0);
  donorsTotalRecords = signal<number>(0);
  isLoading = signal<boolean>(false);
  hasQueried = signal<boolean>(false);

  // Store last query params for refetching on page/filter/sort changes
  private lastQueryParams: GradedDonorsQueryParams | null = null;

  // Maps grid column keys to API sortBy field names
  private readonly DONATIONS_SORT_FIELD_MAP: { [key: string]: string } = {
    unitDeferId: 'unit_id'
  };

  // Search state
  donationsSearchText = signal<string>('');
  donorsSearchText = signal<string>('');

  // Filter state
  donationsFilters = signal<{ sex: string; status: string }>({ sex: 'All', status: 'All' });
  donorsFilters = signal<{ sex: string; status: string }>({ sex: 'All', status: 'All' });

  // Filter chips
  donationsFilterChips = signal<FilterChip[]>([]);
  donorsFilterChips = signal<FilterChip[]>([]);

  // Filter panel state
  isDonationsFilterOpen = signal<boolean>(false);
  isDonorsFilterOpen = signal<boolean>(false);

  // Search bar configurations
  donationsSearchConfig: SearchBarConfig = {
    placeholder: 'Search by Unit ID or Donor ID',
    minLength: 2,
    ariaLabel: 'Search graded donations by Unit ID or Donor ID',
    searchOnEnterOnly: true,
    alwaysShowTooltip: true
  };

  donorsSearchConfig: SearchBarConfig = {
    placeholder: 'Search by Donor ID',
    minLength: 2,
    ariaLabel: 'Search graded donors by Donor ID',
    searchOnEnterOnly: true,
    alwaysShowTooltip: true
  };

  // Pagination (Oracle Forms default: 10 records per page)
  donationsPageIndex = signal(0);
  donationsPageSize = signal(10);
  donorsPageIndex = signal(0);
  donorsPageSize = signal(10);
  pageSizeOptions = [10, 25, 50];

  // Custom Sorting - default ascending by primary column
  donationsSortColumn = signal<string>('unitDeferId');
  donationsSortDirection = signal<'asc' | 'desc'>('asc');
  donorsSortColumn = signal<string>('donorId');
  donorsSortDirection = signal<'asc' | 'desc'>('asc');

  // Filtered and paginated data
  filteredDonations = computed(() => {
    let data = this.gradedDonations();
    const searchText = this.donationsSearchText();
    const filters = this.donationsFilters();

    // Apply search filter (search by Unit ID or Donor ID only, not Name)
    if (searchText && searchText.trim()) {
      const searchLower = searchText.trim().toLowerCase();
      data = data.filter(d =>
        (d.unitDeferId && d.unitDeferId !== '-' && d.unitDeferId.toLowerCase().includes(searchLower)) ||
        (d.donorId && d.donorId.toLowerCase().includes(searchLower))
      );
    }

    // Apply sex filter - convert display value back to code (Male -> M, Female -> F)
    if (filters.sex && filters.sex.trim() !== '' && filters.sex !== 'All') {
      const sexCode = this.convertSexDisplayToCode(filters.sex);
      data = data.filter(d => d.sex === sexCode);
    }

    // Apply status filter
    if (filters.status && filters.status.trim() !== '' && filters.status !== 'All') {
      data = data.filter(d => d.status === filters.status);
    }

    // Apply sorting
    const sortColumn = this.donationsSortColumn();
    const sortDirection = this.donationsSortDirection();
    if (sortColumn) {
      data = [...data].sort((a, b) => {
        const aValue = (a as any)[sortColumn];
        const bValue = (b as any)[sortColumn];

        // Special handling for Unit ID column: '-' at top for ascending, bottom for descending
        if (sortColumn === 'unitDeferId') {
          if (aValue === '-' && bValue !== '-') {
            return sortDirection === 'asc' ? -1 : 1;  // asc: top, desc: bottom
          }
          if (aValue !== '-' && bValue === '-') {
            return sortDirection === 'asc' ? 1 : -1;  // asc: top, desc: bottom
          }
          if (aValue === '-' && bValue === '-') return 0;  // both empty, equal
        }

        const comparison = aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return data;
  });

  filteredDonors = computed(() => {
    let data = this.gradedDonors();
    const searchText = this.donorsSearchText();
    const filters = this.donorsFilters();

    // Apply search filter (search by Donor ID only, not Name)
    if (searchText && searchText.trim()) {
      const searchLower = searchText.trim().toLowerCase();
      data = data.filter(d =>
        (d.donorId && d.donorId.toLowerCase().includes(searchLower))
      );
    }

    // Apply sex filter - convert display value back to code (Male -> M, Female -> F)
    if (filters.sex && filters.sex.trim() !== '' && filters.sex !== 'All') {
      const sexCode = this.convertSexDisplayToCode(filters.sex);
      data = data.filter(d => d.sex === sexCode);
    }

    // Apply status filter (using mergeFlag for donors)
    if (filters.status && filters.status.trim() !== '' && filters.status !== 'All') {
      data = data.filter(d => d.mergeFlag === filters.status);
    }

    // Apply sorting
    const sortColumn = this.donorsSortColumn();
    const sortDirection = this.donorsSortDirection();
    if (sortColumn) {
      data = [...data].sort((a, b) => {
        const aValue = (a as any)[sortColumn];
        const bValue = (b as any)[sortColumn];
        const comparison = aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return data;
  });

  // Alias for template binding consistency
  paginatedDonations = computed(() => this.filteredDonations());

  // Data Table Configurations
  donationsTableConfig: DataTableConfig<GradedDonationRecord> = {
    columns: [
      { key: 'unitDeferId', header: 'Unit Id', sortable: true, type: 'text', width: '160px' },
      { key: 'lastName', header: 'Last Name', sortable: false, type: 'text', width: '120px' },
      { key: 'firstName', header: 'First Name', sortable: false, type: 'text', width: '120px' },
      { key: 'dateOfBirth', header: 'Date of Birth', sortable: false, type: 'text', width: '140px' },
      { key: 'sex', header: 'Sex', sortable: false, type: 'text', width: '100px', valueFormatter: (value) => this.formatSexForDisplay(value) },
      { key: 'status', header: 'Status of pending\ndonor record merge', sortable: false, type: 'text', width: '150px' },
      { key: 'insertDate', header: 'Insert Date and Time', sortable: false, type: 'text', width: '200px' },
      { key: 'insertUser', header: 'User', sortable: false, type: 'text', width: '120px' }
    ],
    rowActions: [
      { icon: 'visibility', label: 'View Unit Holds', ariaLabel: 'View unit holds', action: 'view-unit-holds' }
    ],
    pagination: { pageSize: 10, pageIndex: 0, totalRecords: 0, pageSizeOptions: [10, 25, 50], showFirstLastButtons: true },
    sortConfig: { column: 'unitDeferId', direction: 'A' },
    sortIconMap: { ascending: 'arrow_downward', descending: 'arrow_upward', default: 'arrow_upward' },
    stickyHeader: true,
    showPagination: false,
    emptyMessage: 'No search criteria selected',
    emptySubMessage: 'Please enter your search criteria above to retrieve results.'
  };

  donorsTableConfig: DataTableConfig<GradedDonorRecord> = {
    columns: [
      { key: 'donorId', header: 'Donor Id', sortable: true, type: 'text', width: '160px' },
      { key: 'matchGrade', header: 'Grade', sortable: false, type: 'text', width: '100px' },
      { key: 'dgmLocation', header: 'Donor Grading Matrix\nLine Location', sortable: false, type: 'text', width: '180px' },
      { key: 'lastName', header: 'Last Name', sortable: false, type: 'text', width: '120px' },
      { key: 'firstName', header: 'First Name', sortable: false, type: 'text', width: '120px' },
      { key: 'dateOfBirth', header: 'Date of Birth', sortable: false, type: 'text', width: '140px' },
      { key: 'sex', header: 'Sex', sortable: false, type: 'text', width: '100px', valueFormatter: (value) => this.formatSexForDisplay(value) },
      { key: 'mergeFlag', header: 'Status of pending\ndonor record merge', sortable: false, type: 'text', width: '150px' }
    ],
    rowActions: [
      { icon: 'visibility', label: 'View Donor Holds', ariaLabel: 'View donor holds', action: 'view-donor-holds' }
    ],
    pagination: { pageSize: 10, pageIndex: 0, totalRecords: 0, pageSizeOptions: [10, 25, 50], showFirstLastButtons: true },
    sortConfig: { column: 'donorId', direction: 'A' },
    sortIconMap: { ascending: 'arrow_downward', descending: 'arrow_upward', default: 'arrow_upward' },
    stickyHeader: true,
    showPagination: false,
    emptyMessage: 'No search criteria selected',
    emptySubMessage: 'Please enter your search criteria above to retrieve results.'
  };

  constructor(
    private fb: FormBuilder,
    private gradedDonorsQueryService: GradedDonorsQueryService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private pageHeaderService: PageHeaderService,
    private headerService: HeaderService,
    private renderer: Renderer2
  ) {
    this.initQueryForm();

    // React to page header data changes
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
          subtitle: pageData.subtitle || 'Query and review graded donor matches to identify and resolve donor-donation pairing issues and associated holds'
        };
      }
    });

    // Update donors table config when filtered donors change (client-side pagination)
    effect(() => {
      const filteredCount = this.filteredDonors().length;
      if (this.donorsTableConfig.pagination) {
        this.donorsTableConfig.pagination.totalRecords = filteredCount;
      }
    });

    // Update donations table config when data changes (server-side pagination)
    effect(() => {
      const totalRecords = this.donationsTotalRecords();
      if (this.donationsTableConfig.pagination) {
        this.donationsTableConfig.pagination.totalRecords = totalRecords;
      }
    });

    // Re-apply tooltips when data changes
    effect(() => {
      // Watch for data changes
      this.gradedDonations();
      this.gradedDonors();

      // Re-apply tooltips after data renders (in ngAfterViewInit)
    });
  }

  ngOnInit(): void {
    this.subscribeToChapterChanges();
    this.loadDropdownOptions();
    this.setupRetrieveButtonState();
    this.setupMutuallyExclusiveFields();
    this.setupDateFieldTracking();
  }

  ngAfterViewInit(): void {
    // Add title attribute to action buttons for native browser tooltip
    // Use multiple retries to ensure buttons are in DOM
    setTimeout(() => this.addTooltipsToButtons(), 500);
    setTimeout(() => this.addTooltipsToButtons(), 1000);
    setTimeout(() => this.addTooltipsToButtons(), 2000);
  }

  private addTooltipsToButtons(): void {
    // Try multiple selectors to ensure we catch all action buttons
    const selectors = [
      '.graded-donors-query-container .data-table__actions button',
      '.graded-donors-query-container .data-table__action-button',
      '.graded-donors-query-container button[aria-label*="View"]',
      '.graded-donors-query-container mat-icon-button'
    ];

    selectors.forEach(selector => {
      const buttons = document.querySelectorAll(selector);
      buttons.forEach((button: Element) => {
        const ariaLabel = button.getAttribute('aria-label');
        if (ariaLabel) {
          // Add title attribute for native tooltip
          button.setAttribute('title', ariaLabel);

          // Also add data attribute for CSS tooltip
          button.setAttribute('data-tooltip', ariaLabel);

          // Ensure button has relative positioning for ::after tooltip
          this.renderer.setStyle(button, 'position', 'relative');
          this.renderer.setStyle(button, 'overflow', 'visible');
        }
      });
    });
  }

  /**
   * Track which date field was last changed for better error display
   */
  private setupDateFieldTracking(): void {
    this.queryForm.get('fromDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'from';
        this.queryForm.get('toDate')?.updateValueAndValidity({ emitEvent: false });
      });

    this.queryForm.get('toDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'to';
        this.validateToDateInput();
      });
  }

  /**
   * Handle From Date blur - validate and parse input
   * Oracle Forms behavior: Show validation error immediately for invalid dates
   */
  onFromDateBlur(): void {
    setTimeout(() => {
      const control = this.queryForm.get('fromDate');
      const inputElement = this.fromDateInput?.nativeElement;
      const inputValue = inputElement?.value?.trim() || '';

      // Always mark as touched on blur
      control?.markAsTouched();

      if (inputValue && !control?.value) {
        const formats = Array.isArray(DD_MON_YYYY_FORMATS.parse.dateInput)
          ? DD_MON_YYYY_FORMATS.parse.dateInput
          : [DD_MON_YYYY_FORMATS.parse.dateInput];

        // Try to parse the input
        const parsed = moment(inputValue, formats, true);

        if (parsed && parsed.isValid()) {
          control?.setValue(parsed);
          if (inputElement) {
            inputElement.value = parsed.format('DD-MMM-YYYY').toUpperCase();
          }
        } else {
          // Invalid date - ensure error is set
          this.validateFromDateInput();
        }
      } else if (!inputValue) {
        // Clear any invalidDate error if input is cleared
        if (control?.hasError('invalidDate')) {
          const errors = { ...control.errors };
          delete errors['invalidDate'];
          control.setErrors(Object.keys(errors).length > 0 ? errors : null);
        }
      }

      // Final validation and update
      this.validateFromDateInput();
      control?.updateValueAndValidity();
    }, 0);
  }

  /**
   * Handle To Date blur - validate and parse input
   * Oracle Forms behavior: Auto-fills FROM_DATE if only TO_DATE is provided (TO_DATE - 21 days)
   */
  onToDateBlur(): void {
    setTimeout(() => {
      const control = this.queryForm.get('toDate');
      const fromDateControl = this.queryForm.get('fromDate');
      const inputElement = this.toDateInput?.nativeElement;
      const inputValue = inputElement?.value?.trim() || '';

      control?.markAsTouched();

      if (inputValue && !control?.value) {
        const formats = Array.isArray(DD_MON_YYYY_FORMATS.parse.dateInput)
          ? DD_MON_YYYY_FORMATS.parse.dateInput
          : [DD_MON_YYYY_FORMATS.parse.dateInput];

        const parsed = moment(inputValue, formats, true);

        if (parsed && parsed.isValid()) {
          control?.setValue(parsed);
          if (inputElement) {
            inputElement.value = parsed.format('DD-MMM-YYYY').toUpperCase();
          }
        }
      }

      this.validateToDateInput();
      control?.updateValueAndValidity();

      // Oracle Forms behavior: If TO_DATE is provided but FROM_DATE is null,
      // auto-fill FROM_DATE = TO_DATE - 21 days
      if (control?.value && !fromDateControl?.value) {
        const toDate = control.value as moment.Moment;
        const fromDate = toDate.clone().subtract(21, 'days');
        fromDateControl?.setValue(fromDate, { emitEvent: false });
        fromDateControl?.markAsTouched();
      }
    }, 0);
  }

  /**
   * Validate From Date input for invalid date entry (Oracle Forms error handling)
   * Made public to be called from template on input event
   */
  validateFromDateInput(): void {
    const control = this.queryForm.get('fromDate');
    const inputElement = this.fromDateInput?.nativeElement;
    const inputValue = inputElement?.value?.trim() || '';

    // If input has text but control value is null, it's an invalid date
    if (inputValue && !control?.value && control) {
      control.setErrors({ ...control.errors, invalidDate: true });
      control.markAsTouched(); // Ensure error displays
    } else if (control?.hasError('invalidDate') && (!inputValue || control?.value)) {
      const errors = { ...control.errors };
      delete errors['invalidDate'];
      control.setErrors(Object.keys(errors).length > 0 ? errors : null);
    }
  }

  /**
   * Validate To Date input for invalid date entry (Oracle Forms error handling)
   * Made public to be called from template on input event
   */
  validateToDateInput(): void {
    const control = this.queryForm.get('toDate');
    const inputElement = this.toDateInput?.nativeElement;
    const inputValue = inputElement?.value?.trim() || '';

    // If input has text but control value is null, it's an invalid date
    if (inputValue && !control?.value && control) {
      control.setErrors({ ...control.errors, invalidDate: true });
      control.markAsTouched(); // Ensure error displays
    } else if (control?.hasError('invalidDate') && (!inputValue || control?.value)) {
      const errors = { ...control.errors };
      delete errors['invalidDate'];
      control.setErrors(Object.keys(errors).length > 0 ? errors : null);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initQueryForm(): void {
    this.queryForm = this.fb.group({
      unitId: ['', [this.unitIdValidator()]],
      lastName: ['', [this.lastNameValidator()]],
      fromDate: [null],
      toDate: [null]
    }, {
      validators: [this.dateRangeValidator(), this.mutuallyExclusiveValidator()]
    });
  }

  /**
   * Load dropdown options from API
   * If API endpoints don't exist yet, fields will work as regular text inputs
   */
  private loadDropdownOptions(): void {
    // Load Unit IDs (optional - will gracefully fail if endpoint doesn't exist)
    this.gradedDonorsQueryService.getUnitIdsLov()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (unitIds) => {
          if (unitIds && unitIds.length > 0) {
            this.unitIdOptions.set(unitIds);
            this.filteredUnitIds.set(unitIds);
          }
        },
        error: () => {
          // Backend endpoint not implemented yet - field will work as regular text input
          this.unitIdOptions.set([]);
          this.filteredUnitIds.set([]);
        }
      });

    // Load Last Names (optional - will gracefully fail if endpoint doesn't exist)
    this.gradedDonorsQueryService.getLastNamesLov()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (lastNames) => {
          if (lastNames && lastNames.length > 0) {
            // Sort last names alphabetically
            const sortedLastNames = [...lastNames].sort((a, b) => a.localeCompare(b));
            this.lastNameOptions.set(sortedLastNames);
            this.filteredLastNames.set(sortedLastNames);
          }
        },
        error: () => {
          // Backend endpoint not implemented yet - field will work as regular text input
          this.lastNameOptions.set([]);
          this.filteredLastNames.set([]);
        }
      });
  }


  /**
   * Setup Retrieve button disabled state
   * Updates the signal whenever form values change
   */
  private setupRetrieveButtonState(): void {
    // Initial check
    this.updateRetrieveButtonState();

    // Subscribe to form value changes
    this.queryForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateRetrieveButtonState();
      });
  }

  /**
   * Setup mutually exclusive fields (Oracle Forms behavior: SET_CONTROL_BLOCK1_ITEMS)
   * Only ONE of: Unit/Deferral ID, Last Name, OR Date Range can be used
   */
  private setupMutuallyExclusiveFields(): void {
    // Watch Unit ID field changes
    this.queryForm.get('unitId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        const hasValue = value && value.trim() !== '';

        if (hasValue) {
          // Disable Last Name and Date Range fields
          this.isLastNameDisabled.set(true);
          this.isDateRangeDisabled.set(true);
          this.queryForm.get('lastName')?.disable({ emitEvent: false });
          this.queryForm.get('fromDate')?.disable({ emitEvent: false });
          this.queryForm.get('toDate')?.disable({ emitEvent: false });
        } else {
          // Re-enable other fields if they are also empty
          this.checkAndEnableFields();
        }
      });

    // Watch Last Name field changes
    this.queryForm.get('lastName')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        const hasValue = value && value.trim() !== '';

        if (hasValue) {
          // Disable Unit ID and Date Range fields
          this.isUnitIdDisabled.set(true);
          this.isDateRangeDisabled.set(true);
          this.queryForm.get('unitId')?.disable({ emitEvent: false });
          this.queryForm.get('fromDate')?.disable({ emitEvent: false });
          this.queryForm.get('toDate')?.disable({ emitEvent: false });
        } else {
          // Re-enable other fields if they are also empty
          this.checkAndEnableFields();
        }
      });

    // Watch From Date field changes
    this.queryForm.get('fromDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        const hasValue = !!value;

        if (hasValue) {
          // Disable Unit ID and Last Name fields
          this.isUnitIdDisabled.set(true);
          this.isLastNameDisabled.set(true);
          this.queryForm.get('unitId')?.disable({ emitEvent: false });
          this.queryForm.get('lastName')?.disable({ emitEvent: false });
        } else {
          // Re-enable other fields if they are also empty
          this.checkAndEnableFields();
        }
      });

    // Watch To Date field changes
    this.queryForm.get('toDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        const hasValue = !!value;

        if (hasValue) {
          // Disable Unit ID and Last Name fields
          this.isUnitIdDisabled.set(true);
          this.isLastNameDisabled.set(true);
          this.queryForm.get('unitId')?.disable({ emitEvent: false });
          this.queryForm.get('lastName')?.disable({ emitEvent: false });
        } else {
          // Re-enable other fields if they are also empty
          this.checkAndEnableFields();
        }
      });
  }

  /**
   * Check if all fields are empty and re-enable them
   */
  private checkAndEnableFields(): void {
    const unitIdValue = this.queryForm.get('unitId')?.value;
    const lastNameValue = this.queryForm.get('lastName')?.value;
    const fromDateValue = this.queryForm.get('fromDate')?.value;
    const toDateValue = this.queryForm.get('toDate')?.value;

    const hasUnitId = unitIdValue && unitIdValue.trim() !== '';
    const hasLastName = lastNameValue && lastNameValue.trim() !== '';
    const hasDateRange = fromDateValue || toDateValue;

    // If no field has a value, enable all fields
    if (!hasUnitId && !hasLastName && !hasDateRange) {
      this.isUnitIdDisabled.set(false);
      this.isLastNameDisabled.set(false);
      this.isDateRangeDisabled.set(false);
      this.queryForm.get('unitId')?.enable({ emitEvent: false });
      this.queryForm.get('lastName')?.enable({ emitEvent: false });
      this.queryForm.get('fromDate')?.enable({ emitEvent: false });
      this.queryForm.get('toDate')?.enable({ emitEvent: false });
    }
  }

  /**
   * Update retrieve button disabled state
   * Disabled when all fields are empty or when loading
   */
  private updateRetrieveButtonState(): void {
    if (!this.queryForm) {
      this.isRetrieveDisabled.set(true);
      this.isClearAllDisabled.set(true);
      return;
    }

    // Use getRawValue() to include disabled controls
    const formValue = this.queryForm.getRawValue();
    const hasAnyValue = !!(
      formValue.unitId ||
      formValue.lastName ||
      formValue.fromDate ||
      formValue.toDate
    );

    this.isRetrieveDisabled.set(!hasAnyValue || this.isLoading() || this.queryForm.invalid);

    // Clear All button is enabled when any field has a value
    this.isClearAllDisabled.set(!hasAnyValue);
  }

  /**
   * Effect to watch isLoading signal and update button state
   */
  private _watchLoadingState = effect(() => {
    // Track isLoading signal
    this.isLoading();
    // Update button state whenever loading changes
    this.updateRetrieveButtonState();
  });

  /**
   * Filter autocomplete options for string arrays
   */
  private _filterOptions(value: string, options: string[]): string[] {
    if (!value || !value.trim()) {
      return options;
    }
    const filterValue = value.toUpperCase();
    return options.filter(option => option && option.toUpperCase().includes(filterValue));
  }

  /**
   * Filter autocomplete options for unit ID options (with lastName)
   */
  private _filterUnitIdOptions(value: string, options: { unitId: string; lastName: string; displayValue: string }[]): { unitId: string; lastName: string; displayValue: string }[] {
    if (!value || !value.trim()) {
      return options;
    }
    const filterValue = value.toUpperCase();
    return options.filter(option =>
      option.displayValue && option.displayValue.toUpperCase().includes(filterValue)
    );
  }

  /**
   * Custom validator for Unit ID field
   * Oracle Forms validation: must be 7, 8, 13, or 15 characters
   */
  private unitIdValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value || control.value.trim() === '') {
        return null; // Allow empty (optional field)
      }

      const validationResult = validateUnitIdFormat(control.value);

      if (!validationResult.isValid) {
        return { invalidUnitId: true };
      }

      return null;
    };
  }

  /**
   * Custom validator for Last Name field
   * Only allows alpha characters, apostrophe, and hyphen
   */
  private lastNameValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value || control.value.trim() === '') {
        return null; // Allow empty
      }

      const lastNamePattern = /^[A-Za-z'-]+$/;
      const valid = lastNamePattern.test(control.value);

      return valid ? null : { invalidLastName: true };
    };
  }

  /**
   * Custom validator for mutually exclusive fields
   * Oracle Forms rule: Only ONE of Unit/Deferral ID, Last Name, OR Date Range can be used
   */
  private mutuallyExclusiveValidator(): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const unitId = group.get('unitId')?.value;
      const lastName = group.get('lastName')?.value;
      const fromDate = group.get('fromDate')?.value;
      const toDate = group.get('toDate')?.value;

      const hasUnitId = unitId && unitId.trim() !== '';
      const hasLastName = lastName && lastName.trim() !== '';
      const hasDateRange = fromDate || toDate;

      // Count how many criteria are filled
      const filledCount = [hasUnitId, hasLastName, hasDateRange].filter(Boolean).length;

      // More than one criterion filled - not allowed
      if (filledCount > 1) {
        return { mutuallyExclusive: true };
      }

      return null;
    };
  }

  /**
   * Custom validator for date range
   */
  private dateRangeValidator(): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const fromDate = group.get('fromDate')?.value;
      const toDate = group.get('toDate')?.value;

      if (!fromDate || !toDate) {
        return null;
      }

      const from = moment.isMoment(fromDate) ? fromDate : moment(fromDate);
      const to = moment.isMoment(toDate) ? toDate : moment(toDate);

      if (from.isValid() && to.isValid() && from.isAfter(to, 'day')) {
        return { dateRangeInvalid: true };
      }

      return null;
    };
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.resetComponent();
      });
  }

  private resetComponent(): void {
    this.queryForm.reset();
    this.queryForm.enable();
    this.gradedDonations.set([]);
    this.gradedDonors.set([]);
    this.donationsTotalRecords.set(0);
    this.donorsTotalRecords.set(0);
    this.hasQueried.set(false);
    this.donationsSearchText.set('');
    this.donorsSearchText.set('');
    this.donationsPageIndex.set(0);
    this.donorsPageIndex.set(0);
    this.lastQueryParams = null;
    this.isUnitIdDisabled.set(false);
    this.isLastNameDisabled.set(false);
    this.isDateRangeDisabled.set(false);
    this.filteredUnitIds.set(this.unitIdOptions());
    this.filteredLastNames.set(this.lastNameOptions());
  }

  /**
   * Convert Unit ID to uppercase and filter autocomplete options (Oracle Forms behavior)
   */
  onUnitIdInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const upperValue = input.value.toUpperCase();
    this.queryForm.get('unitId')?.setValue(upperValue, { emitEvent: false });
    input.value = upperValue;
    this.filteredUnitIds.set(this._filterUnitIdOptions(upperValue, this.unitIdOptions()));
  }

  /**
   * Convert Last Name to uppercase and filter autocomplete options (Oracle Forms behavior)
   */
  onLastNameInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const upperValue = input.value.toUpperCase();
    this.queryForm.get('lastName')?.setValue(upperValue, { emitEvent: false });
    input.value = upperValue;
    this.filteredLastNames.set(this._filterOptions(upperValue, this.lastNameOptions()));
  }

  /**
   * Handle Clear All button click
   */
  onClearAll(): void {
    this.resetComponent();
  }

  /**
   * Handle Retrieve button click
   */
  onRetrieve(): void {
    // Reset filters, filter chips, and search bars when retrieve is clicked
    this.donationsFilters.set({ sex: 'All', status: 'All' });
    this.donorsFilters.set({ sex: 'All', status: 'All' });
    this.donationsFilterChips.set([]);
    this.donorsFilterChips.set([]);
    this.donationsSearchText.set('');
    this.donorsSearchText.set('');

    // Mark all fields as touched to show validation errors
    Object.keys(this.queryForm.controls).forEach(key => {
      this.queryForm.get(key)?.markAsTouched();
    });

    // Check if at least one search criteria is provided
    // Use getRawValue() to include disabled controls
    const formValue = this.queryForm.getRawValue();
    const hasSearchCriteria = formValue.unitId || formValue.lastName || formValue.fromDate || formValue.toDate;

    if (!hasSearchCriteria) {
      this.showErrorMessage(GRADED_DONORS_VALIDATION_MESSAGES.REQUIRED_FIELD);
      return;
    }

    // Check for validation errors
    if (this.queryForm.invalid) {
      // Check form-level validators first
      if (this.queryForm.hasError('mutuallyExclusive')) {
        this.showErrorMessage(GRADED_DONORS_VALIDATION_MESSAGES.MUTUALLY_EXCLUSIVE);
        return;
      }
      if (this.queryForm.hasError('dateRangeInvalid')) {
        this.showErrorMessage(GRADED_DONORS_VALIDATION_MESSAGES.INVALID_DATE_RANGE);
        return;
      }

      // Check field-level validators
      if (this.queryForm.get('lastName')?.hasError('invalidLastName')) {
        this.showErrorMessage(GRADED_DONORS_VALIDATION_MESSAGES.INVALID_LAST_NAME);
        return;
      }
      return;
    }

    const unitDeferralId = formValue.unitId?.trim() || '';

    // Reset pagination to first page on new query
    this.donationsPageIndex.set(0);
    this.donorsPageIndex.set(0);

    // Build base query params (without pagination)
    const baseParams: GradedDonorsQueryParams = {
      lastName: formValue.lastName?.trim() || undefined,
      unitId: unitDeferralId || undefined,
      unitDeferId: unitDeferralId || undefined,
      fromDate: formValue.fromDate || undefined,
      toDate: formValue.toDate || undefined
    };

    // Store for later refetching
    this.lastQueryParams = baseParams;

    this.isLoading.set(true);

    // No pagination - fetch all records (screen has no pagination UI)
    // Maximum allowed is 500 records (Oracle Forms Error 16220 check)
    const params: GradedDonorsQueryParams = {
      ...baseParams,
      take: 500,  // Fetch all records up to maximum limit
      skip: 0     // Start from first record
    };

    // Single API call - extract both donations AND donors from the response
    this.queryBothDonationsAndDonors(params);
  }

  /**
   * Query both donations and donors from a single API call
   * The API returns donations with nested gradedDonors array
   */
  private queryBothDonationsAndDonors(params: GradedDonorsQueryParams): void {
    this.gradedDonorsQueryService.queryGradedDonationsRaw(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (rawResponse) => {
          this.isLoading.set(false);
          if (rawResponse.success && rawResponse.data) {
            const totalCount = rawResponse.total || 0;

            // Oracle Forms Error 16001: No results found
            if (totalCount === 0) {
              this.showErrorMessage(GRADED_DONORS_VALIDATION_MESSAGES.ERROR_16001);
              this.gradedDonations.set([]);
              this.gradedDonors.set([]);
              this.donationsTotalRecords.set(0);
              this.hasQueried.set(true);
              return;
            }

            // Oracle Forms Error 16220: More than 500 results
            if (totalCount > 500) {
              this.showErrorMessage(GRADED_DONORS_VALIDATION_MESSAGES.ERROR_16220);
              this.gradedDonations.set([]);
              this.gradedDonors.set([]);
              this.donationsTotalRecords.set(0);
              this.hasQueried.set(false);
              return;
            }

            // Valid result set - populate BOTH donations and donors from same RAW response
            // 1. Transform and store donations
            const transformedDonations: GradedDonationRecord[] = rawResponse.data.map(donation => ({
              unitDeferId: donation.unitIdWithCheckDigit || donation.unitId || '-',
              lastName: this.formatNameProperCase(donation.lastName),
              firstName: this.formatNameProperCase(donation.firstName),
              dateOfBirth: this.formatDateForDisplay(donation.dateOfBirth),
              sex: donation.gender || '',
              status: donation.activeFlag === 'Y' ? 'Active' : 'Inactive',
              insertDate: this.formatDateTimeForDisplay(donation.insertDate),
              insertUser: donation.insertUser || '',
              transactionId: donation.transactionId,
              donorId: donation.gradedDonors?.[0]?.donorId,
              driveId: undefined
            }));
            this.gradedDonations.set(transformedDonations);
            this.donationsTotalRecords.set(totalCount);

            // 2. Extract nested donors from the RAW donations (for Graded Donors tab)
            this.extractDonorsFromRawDonations(rawResponse.data);

            this.hasQueried.set(true);
          }
        },
        error: () => {
          this.isLoading.set(false);
          this.showErrorMessage(GRADED_DONORS_VALIDATION_MESSAGES.API_ERROR);
        }
      });
  }

  /**
   * Extract flattened donors from RAW API donations response
   * The API returns donations with nested gradedDonors array
   */
  private extractDonorsFromRawDonations(donations: any[]): void {
    const flattenedDonors: GradedDonorRecord[] = [];

    donations.forEach(donation => {
      donation.gradedDonors?.forEach((donor: any) => {
        flattenedDonors.push({
          donorId: donor.donorId,
          matchGrade: donor.grade?.toString() || '',
          dgmLocation: donor.dgmId.toString(),
          lastName: this.formatNameProperCase(donor.lastName),
          firstName: this.formatNameProperCase(donor.firstName),
          dateOfBirth: this.formatDateForDisplay(donor.dateOfBirth),
          sex: donor.gender || '',
          mergeFlag: donor.potentialDuplicateFlag || '',
          unitDeferId: donation.unitIdWithCheckDigit || donation.unitId
        });
      });
    });

    this.gradedDonors.set(flattenedDonors);
  }

  /**
   * Format name to proper case (e.g., "SMITH" -> "Smith", "MC DONALD" -> "Mc Donald")
   */
  private formatNameProperCase(name: string | null): string {
    if (!name || !name.trim()) return '';

    return name
      .toLowerCase()
      .split(' ')
      .map(word => {
        if (word.length === 0) return word;
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(' ');
  }

  /**
   * Format date from API (YYYY-MM-DD or ISO) to display format (DD-MMM-YYYY)
   */
  private formatDateForDisplay(dateString: string | null): string {
    if (!dateString) return '';
    const date = moment(dateString);
    return date.isValid() ? date.format('DD-MMM-YYYY').toUpperCase() : '';
  }

  /**
   * Format datetime from API (ISO/UTC) to display format (DD-MMM-YYYY HH:mm) in chapter timezone
   */
  private formatDateTimeForDisplay(datetime: string | null): string {
    if (!datetime) return '';
    const timezone = this.headerService.getCurrentChapterTimezone() || 'UTC';
    const converted = convertUTCToTimezone(datetime, timezone);
    const m = moment(converted);
    return m.isValid() ? m.format('DD-MMM-YYYY HH:mm').toUpperCase() : '';
  }

  /**
   * Format sex code (M/F) to full word (Male/Female)
   */
  private formatSexForDisplay(sex: string | null): string {
    if (!sex) return '-';
    return sex === 'M' ? 'Male' : sex === 'F' ? 'Female' : sex;
  }

  /**
   * Convert sex display value (Male/Female) back to code (M/F)
   */
  private convertSexDisplayToCode(displayValue: string): string {
    if (displayValue === 'Male') return 'M';
    if (displayValue === 'Female') return 'F';
    return displayValue; // Return as-is if already a code
  }

  onTabChange(index: number): void {
    this.selectedTabIndex.set(index);
  }

  onDonationsSearch(searchText: string): void {
    // Client-side search - only filters the current page data
    this.donationsSearchText.set(searchText);
    this.donationsPageIndex.set(0);
  }

  onDonorsSearch(searchText: string): void {
    // Client-side search for donors (nested data structure)
    this.donorsSearchText.set(searchText);
    this.donorsPageIndex.set(0);
  }

  onDonationsPageChange(event: TablePageEvent): void {
    this.donationsPageIndex.set(event.pageIndex);
    this.donationsPageSize.set(event.pageSize);

    // Update pagination config
    if (this.donationsTableConfig.pagination) {
      this.donationsTableConfig.pagination.pageIndex = event.pageIndex;
      this.donationsTableConfig.pagination.pageSize = event.pageSize;
    }

    // Note: Pagination is disabled (showPagination: false) so this method won't be called
    // If pagination is re-enabled in the future, it should fetch all records and paginate client-side
    // to match the Donors tab behavior (which uses client-side pagination)
  }

  onDonorsPageChange(event: TablePageEvent): void {
    // Client-side pagination for donors (nested data structure)
    this.donorsPageIndex.set(event.pageIndex);
    this.donorsPageSize.set(event.pageSize);

    // Update pagination config
    if (this.donorsTableConfig.pagination) {
      this.donorsTableConfig.pagination.pageIndex = event.pageIndex;
      this.donorsTableConfig.pagination.pageSize = event.pageSize;
    }
  }

  onDonationsSortChange(event: TableSortEvent): void {
    // Update table config for visual indicator
    if (this.donationsTableConfig.sortConfig) {
      this.donationsTableConfig.sortConfig.column = event.column;
      this.donationsTableConfig.sortConfig.direction = event.direction;
    }

    const sortOrder = event.direction === 'A' ? 'asc' : 'desc';

    // Update sort signals to trigger client-side sort in filteredDonations computed
    this.donationsSortColumn.set(event.column);
    this.donationsSortDirection.set(sortOrder);

    // Reset to first page when sorting
    this.donationsPageIndex.set(0);

    // Re-fetch from server with sort params so the API applies its own ordering
    const sortBy = this.DONATIONS_SORT_FIELD_MAP[event.column];
    if (sortBy && this.lastQueryParams) {
      const params: GradedDonorsQueryParams = {
        ...this.lastQueryParams,
        sortBy,
        sortOrder,
        take: 500,
        skip: 0
      };
      this.isLoading.set(true);
      this.queryBothDonationsAndDonors(params);
    }
  }

  onDonorsSortChange(event: TableSortEvent): void {
    // Update table config for visual indicator
    if (this.donorsTableConfig.sortConfig) {
      this.donorsTableConfig.sortConfig.column = event.column;
      this.donorsTableConfig.sortConfig.direction = event.direction;
    }

    // Update sort signals to trigger data sorting
    // Toggle between ascending and descending only (no default state)
    this.donorsSortColumn.set(event.column);
    this.donorsSortDirection.set(event.direction === 'A' ? 'asc' : 'desc');

    // Reset to first page when sorting
    this.donorsPageIndex.set(0);
  }

  onDonationsRowAction(event: { action: string; row: GradedDonationRecord }): void {
    if (event.action === 'view-unit-holds') {
      this.openUnitHoldsDialog(event.row);
    }
  }

  onDonorsRowAction(event: { action: string; row: GradedDonorRecord }): void {
    if (event.action === 'view-donor-holds') {
      this.openDonorHoldsDialog(event.row);
    }
  }

  /**
   * Toggle sort for Donations table (Unit ID column only)
   */
  toggleDonationsSort(column: string): void {
    const currentColumn = this.donationsSortColumn();
    const currentDirection = this.donationsSortDirection();

    if (currentColumn === column) {
      // Toggle direction: desc -> asc -> desc
      this.donationsSortDirection.set(currentDirection === 'desc' ? 'asc' : 'desc');
    } else {
      // New column, start with desc
      this.donationsSortColumn.set(column);
      this.donationsSortDirection.set('desc');
    }

    // Reset pagination and refetch from server
    this.donationsPageIndex.set(0);
    if (this.lastQueryParams) {
      const params: GradedDonorsQueryParams = {
        ...this.lastQueryParams,
        take: 500,  // Fetch all records up to maximum limit
        skip: 0     // Start from first record
      };

      this.isLoading.set(true);
      this.queryBothDonationsAndDonors(params);
    }
  }

  /**
   * Get sort icon for Donations table column
   */
  getDonationsSortIcon(column: string): string {
    const currentColumn = this.donationsSortColumn();
    const currentDirection = this.donationsSortDirection();

    if (currentColumn === column) {
      return currentDirection === 'asc' ? 'arrow_downward' : 'arrow_upward';
    }
    return 'arrow_upward'; // Default up arrow
  }

  /**
   * Toggle sort for Donors table (Donor ID column only)
   */
  toggleDonorsSort(column: string): void {
    const currentColumn = this.donorsSortColumn();
    const currentDirection = this.donorsSortDirection();

    if (currentColumn === column) {
      // Toggle direction: desc -> asc -> desc
      this.donorsSortDirection.set(currentDirection === 'desc' ? 'asc' : 'desc');
    } else {
      // New column, start with desc
      this.donorsSortColumn.set(column);
      this.donorsSortDirection.set('desc');
    }

    // Client-side sorting for donors (nested data structure)
    this.donorsPageIndex.set(0);
  }

  /**
   * Get sort icon for Donors table column
   */
  getDonorsSortIcon(column: string): string {
    const currentColumn = this.donorsSortColumn();
    const currentDirection = this.donorsSortDirection();

    if (currentColumn === column) {
      return currentDirection === 'asc' ? 'arrow_downward' : 'arrow_upward';
    }
    return 'arrow_upward'; // Default up arrow
  }

  /**
   * Open Unit Holds dialog
   */
  openUnitHoldsDialog(donation: GradedDonationRecord): void {
    const dialogData: UnitHoldsDialogData = {
      transactionId: donation.transactionId || '',
      unitDeferId: donation.unitDeferId,
      lastName: donation.lastName,
      firstName: donation.firstName,
      dateOfBirth: donation.dateOfBirth,
      sex: donation.sex
    };

    this.dialog.open(UnitHoldsDialogComponent, {
      width: '70vw',
      maxWidth: '1000px',
      minWidth: '500px',
      height: 'calc(100vh - 64px)',
      maxHeight: 'calc(100vh - 64px)',
      position: {
        top: '64px',
        right: '0'
      },
      panelClass: 'side-panel-dialog',
      backdropClass: 'side-panel-backdrop',
      data: dialogData,
      hasBackdrop: true,
      disableClose: true,
      autoFocus: false
    });
  }

  /**
   * Open Donor Holds dialog
   */
  openDonorHoldsDialog(donor: GradedDonorRecord): void {
    const dialogData: DonorHoldsDialogData = {
      donorId: donor.donorId,
      lastName: donor.lastName,
      firstName: donor.firstName,
      unitDeferId: donor.unitDeferId || '',
      dateOfBirth: donor.dateOfBirth,
      sex: donor.sex
    };

    this.dialog.open(DonorHoldsDialogComponent, {
      width: '70vw',
      maxWidth: '1000px',
      minWidth: '500px',
      height: 'calc(100vh - 64px)',
      maxHeight: 'calc(100vh - 64px)',
      position: {
        top: '64px',
        right: '0'
      },
      panelClass: 'side-panel-dialog',
      backdropClass: 'side-panel-backdrop',
      data: dialogData,
      hasBackdrop: true,
      disableClose: true,
      autoFocus: false
    });
  }

  /**
   * Open Filters dialog for Donations tab
   */
  /**
   * Toggle filter panel for Donations tab
   */
  toggleDonationsFilterPanel(): void {
    this.isDonationsFilterOpen.update(open => !open);
  }

  /**
   * Close donations filter panel
   */
  closeDonationsFilterPanel(): void {
    this.isDonationsFilterOpen.set(false);
  }

  /**
   * Apply filters for donations
   */
  applyDonationsFilters(filters: FiltersDialogData): void {
    const newFilters = {
      sex: filters.sex || 'All',
      status: filters.status || 'All'
    };
    this.donationsFilters.set(newFilters);

    // Update filter chips
    this.donationsFilterChips.set(
      GradedDonorsFilterChipsUtils.convertFiltersToChips(newFilters, 'donations')
    );

    this.donationsPageIndex.set(0);
    this.closeDonationsFilterPanel();
  }

  /**
   * Get available sex options for donations
   * Maps M/F to Male/Female for display
   */
  get availableDonationsSexOptions(): string[] {
    const rawSexValues = [...new Set(this.gradedDonations().map(d => d.sex).filter(s => s && s.trim() !== ''))];
    return rawSexValues.map(s => this.formatSexForDisplay(s)).sort();
  }

  /**
   * Get available status options for donations
   */
  get availableDonationsStatusOptions(): string[] {
    return [...new Set(this.gradedDonations().map(d => d.status).filter(s => s && s.trim() !== ''))].sort();
  }

  /**
   * Toggle filter panel for Donors tab
   */
  toggleDonorsFilterPanel(): void {
    this.isDonorsFilterOpen.update(open => !open);
  }

  /**
   * Close donors filter panel
   */
  closeDonorsFilterPanel(): void {
    this.isDonorsFilterOpen.set(false);
  }

  /**
   * Apply filters for donors
   */
  applyDonorsFilters(filters: FiltersDialogData): void {
    const newFilters = {
      sex: filters.sex || 'All',
      status: filters.status || 'All'
    };
    this.donorsFilters.set(newFilters);

    // Update filter chips
    this.donorsFilterChips.set(
      GradedDonorsFilterChipsUtils.convertFiltersToChips(newFilters, 'donors')
    );

    this.donorsPageIndex.set(0);
    this.closeDonorsFilterPanel();
  }

  /**
   * Get available sex options for donors
   * Maps M/F to Male/Female for display
   */
  get availableDonorsSexOptions(): string[] {
    const rawSexValues = [...new Set(this.gradedDonors().map(d => d.sex).filter(s => s && s.trim() !== ''))];
    return rawSexValues.map(s => this.formatSexForDisplay(s)).sort();
  }

  /**
   * Get available status options for donors
   */
  get availableDonorsStatusOptions(): string[] {
    return [...new Set(this.gradedDonors().map(d => d.mergeFlag).filter(s => s && s.trim() !== ''))].sort();
  }

  /**
   * Remove a specific filter chip for donations
   */
  onRemoveDonationsFilterChip(chipKey: string): void {
    const currentFilters = this.donationsFilters();
    const updatedFilters = GradedDonorsFilterChipsUtils.removeFilterByChipKey(currentFilters, chipKey);

    if (!updatedFilters) {
      this.clearDonationsFilters();
    } else {
      // Convert to FiltersDialogData format (remove null values)
      const dialogData: FiltersDialogData = {
        sex: updatedFilters.sex || undefined,
        status: updatedFilters.status || undefined
      };
      this.applyDonationsFilters(dialogData);
    }
  }

  /**
   * Remove a specific filter chip for donors
   */
  onRemoveDonorsFilterChip(chipKey: string): void {
    const currentFilters = this.donorsFilters();
    const updatedFilters = GradedDonorsFilterChipsUtils.removeFilterByChipKey(currentFilters, chipKey);

    if (!updatedFilters) {
      this.clearDonorsFilters();
    } else {
      // Convert to FiltersDialogData format (remove null values)
      const dialogData: FiltersDialogData = {
        sex: updatedFilters.sex || undefined,
        status: updatedFilters.status || undefined
      };
      this.applyDonorsFilters(dialogData);
    }
  }

  /**
   * Clear all donations filters
   */
  clearDonationsFilters(): void {
    this.donationsFilters.set({ sex: 'All', status: 'All' });
    this.donationsFilterChips.set([]);
    this.donationsPageIndex.set(0);
  }

  /**
   * Clear all donors filters
   */
  clearDonorsFilters(): void {
    this.donorsFilters.set({ sex: 'All', status: 'All' });
    this.donorsFilterChips.set([]);
    this.donorsPageIndex.set(0);
  }

  private showErrorMessage(message: string): void {
    this.snackBar.open(message, 'Dismiss', {
      horizontalPosition: 'end',
      verticalPosition: 'top',
      duration: 5000
    });
  }

  get f() {
    return this.queryForm.controls;
  }

  get donationsTotalCount(): number {
    return this.donationsTotalRecords();
  }

  get donorsTotalCount(): number {
    // Client-side pagination for donors: count filtered results
    return this.filteredDonors().length;
  }


  /**
   * Error message getters (Oracle Forms validation messages)
   * Based on WHEN-VALIDATE-ITEM triggers in dpqgrdon_fmb.xml
   */
  get unitIdError(): string {
    const control = this.queryForm.get('unitId');
    if (!control || !control.touched || !control.invalid) return '';

    // Oracle Forms error 16214: Length validation
    if (control.hasError('invalidUnitId')) {
      return GRADED_DONORS_VALIDATION_MESSAGES.ERROR_16214;
    }
    // Mutually exclusive validation
    if (this.queryForm.hasError('mutuallyExclusive')) {
      return GRADED_DONORS_VALIDATION_MESSAGES.MUTUALLY_EXCLUSIVE;
    }
    return '';
  }

  get lastNameError(): string {
    const control = this.queryForm.get('lastName');
    if (!control || !control.touched || !control.invalid) return '';

    // Invalid Last Name validation (alpha, apostrophe, hyphen only)
    if (control.hasError('invalidLastName')) {
      return GRADED_DONORS_VALIDATION_MESSAGES.INVALID_LAST_NAME;
    }
    // Mutually exclusive validation
    if (this.queryForm.hasError('mutuallyExclusive')) {
      return GRADED_DONORS_VALIDATION_MESSAGES.MUTUALLY_EXCLUSIVE;
    }
    return '';
  }

  get fromDateError(): string {
    const control = this.queryForm.get('fromDate');
    if (!control) return '';

    // Show parse errors immediately (don't wait for touched)
    if (control.hasError('matDatepickerParse')) {
      return GRADED_DONORS_VALIDATION_MESSAGES.INVALID_FROM_DATE;
    }
    if (control.hasError('invalidDate')) {
      return GRADED_DONORS_VALIDATION_MESSAGES.INVALID_FROM_DATE;
    }

    // Check if input has text but value is null (invalid date typed)
    const inputElement = this.fromDateInput?.nativeElement;
    const hasInputValue = inputElement && inputElement.value && inputElement.value.trim() !== '';
    if (hasInputValue && !control.value) {
      return GRADED_DONORS_VALIDATION_MESSAGES.INVALID_FROM_DATE;
    }

    // Other errors only show after touched
    if (!control.touched) return '';

    // Date range validation: show on the field that was last changed
    if (this.lastChangedDateField === 'from' && this.queryForm.errors?.['dateRangeInvalid']) {
      return GRADED_DONORS_VALIDATION_MESSAGES.ERROR_11065;
    }
    // Mutually exclusive validation
    if (this.queryForm.hasError('mutuallyExclusive')) {
      return GRADED_DONORS_VALIDATION_MESSAGES.MUTUALLY_EXCLUSIVE;
    }
    return '';
  }

  get toDateError(): string {
    const control = this.queryForm.get('toDate');
    if (!control) return '';

    // Show parse errors immediately (don't wait for touched)
    if (control.hasError('matDatepickerParse')) {
      return GRADED_DONORS_VALIDATION_MESSAGES.INVALID_TO_DATE;
    }
    if (control.hasError('invalidDate')) {
      return GRADED_DONORS_VALIDATION_MESSAGES.INVALID_TO_DATE;
    }

    // Check if input has text but value is null (invalid date typed)
    const inputElement = this.toDateInput?.nativeElement;
    const hasInputValue = inputElement && inputElement.value && inputElement.value.trim() !== '';
    if (hasInputValue && !control.value) {
      return GRADED_DONORS_VALIDATION_MESSAGES.INVALID_TO_DATE;
    }

    // Other errors only show after touched
    if (!control.touched) return '';

    // Date range validation: show on the field that was last changed
    if (this.lastChangedDateField === 'to' && this.queryForm.errors?.['dateRangeInvalid']) {
      return GRADED_DONORS_VALIDATION_MESSAGES.TO_DATE_BEFORE_FROM;
    }
    // Mutually exclusive validation
    if (this.queryForm.hasError('mutuallyExclusive')) {
      return GRADED_DONORS_VALIDATION_MESSAGES.MUTUALLY_EXCLUSIVE;
    }
    return '';
  }

  // Keep old methods for backward compatibility (if used elsewhere)
  getUnitIdError(): string { return this.unitIdError; }
  getLastNameError(): string { return this.lastNameError; }
  getFromDateError(): string { return this.fromDateError; }
  getToDateError(): string { return this.toDateError; }
}