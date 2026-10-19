import { Component, OnInit, OnDestroy, signal, computed, effect, inject, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormControl } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatPaginatorModule, MatPaginatorIntl, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, ErrorStateMatcher } from '@angular/material/core';
import { OverlayModule, ConnectedPosition } from '@angular/cdk/overlay';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { UppercaseMomentDateAdapter } from '@shared/date/uppercase-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';

import { DonorProfileAuditQueryService } from './services/donor-profile-audit-query.service';
import { SearchForDonorDialog } from '@shared/components/search-for-donor/search-for-donor';
import { SearchForDonorDialogResult } from '@shared/components/search-for-donor/search-for-donor.model';
import { FilterPanel } from './components/filter-panel/filter-panel';
import { PrintSelectedDialog, PrintSelectedDialogData } from './components/print-selected-dialog/print-selected-dialog';
import { DetailViewTab } from './components/detail-view-tab/detail-view-tab';
import {
  DonorInfo,
  DonorProfileAuditQueryDto,
  DonorProfileAuditResultDto,
  DonorProfileAuditDetailDto,
  AuditFilterCriteria,
  DPAQ_ERROR_MESSAGES
} from './models/donor-profile-audit-query.model';
import { DonorProfileAuditQueryFilterChipsUtils } from './utils/filter-chips.utils';
import moment from 'moment';

@Component({
  selector: 'app-donor-profile-audit-query',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatCheckboxModule,
    MatPaginatorModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatTooltipModule,
    OverlayModule,
    PageHeaderWithBreadcrumb,
    FilterChips,
    FilterPanel,
    DetailViewTab,
    SearchBar
  ],
  templateUrl: './donor-profile-audit-query.html',
  styleUrls: ['./donor-profile-audit-query.scss'],
  providers: [
    {
      provide: MatPaginatorIntl,
      useFactory: () => {
        const intl = new MatPaginatorIntl();
        intl.itemsPerPageLabel = 'Rows per page:';
        return intl;
      }
    },
    { provide: DateAdapter, useClass: UppercaseMomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }
  ]
})
export class DonorProfileAuditQuery implements OnInit, OnDestroy {
  @ViewChild('summaryFilterBtn', { read: ElementRef }) summaryFilterBtn!: ElementRef<HTMLElement>;
  @ViewChild('summaryTrigger', { static: false }) summaryTrigger: any;
  @ViewChild('detailViewTab') detailViewTab!: DetailViewTab;
  @ViewChild('fromDateInput', { read: ElementRef }) fromDateInput!: ElementRef<HTMLInputElement>;
  @ViewChild('toDateInput', { read: ElementRef }) toDateInput!: ElementRef<HTMLInputElement>;
  @ViewChild('collectionDateInput', { read: ElementRef }) collectionDateInput!: ElementRef<HTMLInputElement>;

  // Computed property to get the current trigger based on active tab
  get detailTrigger(): any {
    return this.detailViewTab?.detailTrigger;
  }

  private readonly fb = inject(FormBuilder);
  private readonly service = inject(DonorProfileAuditQueryService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly headerService = inject(HeaderService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly timezoneService = inject(ChapterTimezoneService);
  private readonly dialog = inject(MatDialog);

  private destroy$ = new Subject<void>();

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [{ label: 'Home', link: '/home' }],
    title: '',
    subtitle: ''
  };

  // Summary View uses manual mat-table with custom checkbox handling (like Detail View)
  // to avoid auto-selection issues with the shared DataTable component
  summaryDisplayedColumns: string[] = ['checkbox', 'recNum', 'insertDate', 'insertUser', 'programId', 'tableName', 'dataDetails'];

  searchForm!: FormGroup;

  donorInfo = signal<DonorInfo | null>(null);
  auditData = signal<DonorProfileAuditResultDto[]>([]);
  originalAuditData = signal<DonorProfileAuditResultDto[]>([]); // Store unfiltered data
  selectedAuditDetail = signal<DonorProfileAuditDetailDto | null>(null);
  totalCount = signal<number>(0);
  isLoading = signal<boolean>(false);
  hasError = false;
  isDetailLoading = signal<boolean>(false);

  // Separate state for Summary View
  summarySearchText = signal<string>('');
  summarySelectedRecords = signal<Set<number>>(new Set());
  summarySelectedTableNames = signal<Set<string>>(new Set());

  // Separate state for Detail View
  detailSearchText = signal<string>('');
  detailSelectedRecords = signal<Set<number>>(new Set());

  // Search bar configurations
  summarySearchConfig: SearchBarConfig = {
    placeholder: 'Search by Data Details or Program ID',
    minLength: 2,
    ariaLabel: 'Search by Data Details or Program ID',
    searchOnEnterOnly: true,
    alwaysShowTooltip: true
  };

  detailSearchConfig: SearchBarConfig = {
    placeholder: 'Search by Table Name',
    minLength: 2,
    ariaLabel: 'Search by Table Name',
    searchOnEnterOnly: true,
    alwaysShowTooltip: true
  };

  currentTabIndex = signal<number>(0);
  sortDirection = signal<'asc' | 'desc'>('asc');
  hasRetrieved = signal<boolean>(false);

  // Helper methods to get current tab's state
  selectedRecords = computed(() => {
    return this.currentTabIndex() === 0
      ? this.summarySelectedRecords()
      : this.detailSelectedRecords();
  });

  searchText = computed(() => {
    return this.currentTabIndex() === 0
      ? this.summarySearchText()
      : this.detailSearchText();
  });

  // Signal to track if any filter field has a value
  hasAnyFilterValue = signal<boolean>(false);

  // Client-side filters (not sent to backend due to backend issues)
  clientUnitIdFilter = signal<string>('');
  clientDeferralIdFilter = signal<string>('');
  clientCollectionDateFilter = signal<string>('');

  // Filter Panel State - Separate for each tab
  isFilterOpen = false;

  // Overlay positions for filter panel to appear below the button
  filterOverlayPositions: ConnectedPosition[] = [
    {
      originX: 'start',
      originY: 'bottom',
      overlayX: 'start',
      overlayY: 'top',
      offsetX: 0,
      offsetY: 4
    }
  ];

  // Summary tab filters
  summaryAppliedFilters = signal<AuditFilterCriteria>({});
  summaryFilterChips = signal<FilterChip[]>([]);

  // Detail tab filters
  detailAppliedFilters = signal<AuditFilterCriteria>({});
  detailFilterChips = signal<FilterChip[]>([]);

  insertedUsers = signal<string[]>([]);

  // Computed properties to get current tab's filter state
  appliedFilters = computed(() => {
    return this.currentTabIndex() === 0 ? this.summaryAppliedFilters() : this.detailAppliedFilters();
  });

  filterChips = computed(() => {
    return this.currentTabIndex() === 0 ? this.summaryFilterChips() : this.detailFilterChips();
  });

  pageSize = 25;
  pageIndex = 0;
  pageSizeOptions = [10, 25, 50, 100];

  // Error state matchers for date fields
  fromDateErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control: FormControl | null): boolean => {
      if (!control) return false;
      if (control.invalid && (control.touched || control.dirty)) return true;
      const inputValue = this.fromDateInput?.nativeElement?.value;
      return !!(control.touched || control.dirty) && !control.value && !!inputValue && inputValue.trim().length > 0;
    }
  };

  toDateErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control: FormControl | null): boolean => {
      if (!control) return false;
      if (control.invalid && (control.touched || control.dirty)) return true;
      const inputValue = this.toDateInput?.nativeElement?.value;
      return !!(control.touched || control.dirty) && !control.value && !!inputValue && inputValue.trim().length > 0;
    }
  };

  collectionDateErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control: FormControl | null): boolean => {
      if (!control) return false;
      if (control.invalid && (control.touched || control.dirty)) return true;
      const inputValue = this.collectionDateInput?.nativeElement?.value;
      return !!(control.touched || control.dirty) && !control.value && !!inputValue && inputValue.trim().length > 0;
    }
  };

  constructor() {
    this.initForm();

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
          subtitle: pageData.subtitle || 'View all modifications to this donor\'s profile'
        };
      }
    });
  }

  // ============================================================================
  // TIMEZONE CONVERSION METHODS
  // JIRA MLT-11028: All date handling is timezone-aware
  // Dates are converted between local user time and GMT for database storage
  // ============================================================================

  /**
   * Convert local date/time to GMT for backend API
   * Per JIRA: "Date parameters converted from local timezone to GMT before passing to package"
   * @param localDate - Date in user's local timezone
   * @returns ISO string in GMT (e.g., "2025-01-15T08:00:00.000Z")
   */
  private convertLocalToGMT(localDate: moment.Moment): string {
    // Convert to UTC (GMT)
    return localDate.clone().utc().format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');
  }

  /**
   * Convert local date to GMT date/time string for backend API
   * Used for filter dates (fromDate, toDate, collectionDate)
   * @param localDate - Date in user's local timezone (with time component if applicable)
   * @returns GMT date/time string in YYYY-MM-DD HH:mm:ss format
   *
   * IMPORTANT: The time component (start/end of day) must be set BEFORE calling this function
   * This function only handles timezone conversion, not setting time components
   */
  private convertLocalDateToGMT(localDate: moment.Moment): string {
    // Convert to UTC and preserve the time component
    return localDate.clone().utc().format('YYYY-MM-DD HH:mm:ss');
  }

  /**
   * Convert GMT date/time from backend to local time for display
   * Per JIRA: "Insert dates converted GMT to local for display (format MM-DD-YYYY HH24:MI)"
   * @param gmtDateTime - GMT date/time string from backend
   * @returns Moment in local timezone
   */
  private convertGMTToLocal(gmtDateTime: string): moment.Moment {
    // Parse as UTC and convert to local time
    return moment.utc(gmtDateTime).local();
  }

  /**
   * Check if timezone conversion is enabled
   * Fallback to false if chapter timezone service is not available
   * @returns true if timezone conversion should be applied
   */
  private isTimezoneEnabled(): boolean {
    // Check if chapter timezone service has loaded chapter info
    return this.timezoneService.isChapterLocalDateAvailable();
  }

  ngOnInit(): void {
    this.subscribeToChapterChanges();

    // Automatically open donor search dialog if no donor is selected
    if (!this.donorInfo()) {
      // Use setTimeout to ensure the component is fully initialized
      setTimeout(() => {
        this.onDonorIdClick();
      }, 0);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.searchForm = this.fb.group({
      fromDate: [null, [this.notFutureDateValidator()]],
      toDate: [null, [this.notFutureDateValidator()]],
      unitId: ['', [this.unitIdFormatValidator()]],
      deferralId: ['', [this.deferralIdFormatValidator()]],
      collectionDate: [null, [this.notFutureDateValidator()]]
    }, {
      validators: [
        this.unitIdDeferralIdMutualExclusionValidator(),
        this.fromDateToDateValidator(),
        this.toDateRequiresFromDateValidator()
      ]
    });

    // Subscribe to form value changes to update hasAnyFilterValue signal
    this.searchForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const fromDate = this.searchForm.get('fromDate')?.value;
        const toDate = this.searchForm.get('toDate')?.value;
        const unitId = this.searchForm.get('unitId')?.value?.trim();
        const deferralId = this.searchForm.get('deferralId')?.value?.trim();
        const collectionDate = this.searchForm.get('collectionDate')?.value;

        this.hasAnyFilterValue.set(!!(fromDate || toDate || unitId || deferralId || collectionDate));

        // If date filters are cleared and we have original data, restore it
        if (!fromDate && !toDate && !unitId && !deferralId && !collectionDate &&
            this.originalAuditData().length > 0 && this.auditData().length !== this.originalAuditData().length) {
          this.auditData.set(this.originalAuditData());
          this.totalCount.set(this.originalAuditData().length);
          this.hasError = false;
        }
      });

    // Clear backend errors when user types in Unit ID field
    this.searchForm.get('unitId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const control = this.searchForm.get('unitId');
        // Only clear backend error, keep format validation errors
        if (control?.hasError('unitIdNotFound')) {
          const errors = { ...control.errors };
          delete errors['unitIdNotFound'];
          control.setErrors(Object.keys(errors).length > 0 ? errors : null);
        }
      });

    // Clear backend errors when user types in Deferral ID field
    this.searchForm.get('deferralId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const control = this.searchForm.get('deferralId');
        // Only clear backend error, keep format validation errors
        if (control?.hasError('deferralIdNotFound')) {
          const errors = { ...control.errors };
          delete errors['deferralIdNotFound'];
          control.setErrors(Object.keys(errors).length > 0 ? errors : null);
        }
      });

    // Clear backend errors when user changes Collection Date field
    this.searchForm.get('collectionDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const control = this.searchForm.get('collectionDate');
        if (control?.hasError('collectionDateNotFound')) {
          const errors = { ...control.errors };
          delete errors['collectionDateNotFound'];
          control.setErrors(Object.keys(errors).length > 0 ? errors : null);
        }
      });

    // Show snackbar for From Date validation errors
    this.searchForm.get('fromDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const control = this.searchForm.get('fromDate');
        if (control?.touched && control?.invalid && !control?.hasError('matDatepickerParse')) {
          const error = this.getFromDateError();
          if (error) {
            this.snackbarService.showError(error);
          }
        }
      });

    // Show snackbar for To Date validation errors
    this.searchForm.get('toDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const control = this.searchForm.get('toDate');
        if (control?.touched && control?.invalid && !control?.hasError('matDatepickerParse')) {
          const error = this.getToDateError();
          if (error) {
            this.snackbarService.showError(error);
          }
        }
      });

    // Show snackbar for Collection Date validation errors
    this.searchForm.get('collectionDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const control = this.searchForm.get('collectionDate');
        if (control?.touched && control?.invalid && !control?.hasError('matDatepickerParse')) {
          const error = this.getCollectionDateError();
          if (error) {
            this.snackbarService.showError(error);
          }
        }
      });
  }

  // Custom validator: Unit ID and Deferral ID are mutually exclusive
  private unitIdDeferralIdMutualExclusionValidator() {
    return (formGroup: FormGroup) => {
      const unitId = formGroup.get('unitId')?.value?.trim();
      const deferralId = formGroup.get('deferralId')?.value?.trim();

      if (unitId && deferralId) {
        return { mutualExclusion: true };
      }

      return null;
    };
  }

  // Validator: Date cannot be in the future (Error 2137, 2138, Collection Date)
  private notFutureDateValidator() {
    return (control: any): { [key: string]: any } | null => {
      const value = control.value;
      if (!value) return null;

      const selectedDate = moment.isMoment(value) ? value : moment(value);
      if (!selectedDate.isValid()) return null;

      // Get today's date in the chapter's timezone from the backend
      // The backend calculates the exact current date/time in the chapter's timezone
      const today = this.timezoneService.getChapterLocalDate();

      // Compare just the date part (YYYY-MM-DD)
      const selected = selectedDate.clone().startOf('day');

      if (selected.isAfter(today)) {
        return { futureDate: true };
      }

      return null;
    };
  }

  // Validator: From Date must be <= To Date (Error 2102)
  private fromDateToDateValidator() {
    return (formGroup: FormGroup) => {
      const fromDate = formGroup.get('fromDate')?.value;
      const toDate = formGroup.get('toDate')?.value;

      if (!fromDate || !toDate) return null;

      const from = moment.isMoment(fromDate) ? fromDate : moment(fromDate);
      const to = moment.isMoment(toDate) ? toDate : moment(toDate);

      if (!from.isValid() || !to.isValid()) return null;

      // Compare just the date parts
      if (from.isAfter(to, 'day')) {
        return { fromDateAfterToDate: true };
      }

      return null;
    };
  }

  // Validator: From Date is required when To Date is entered (Error 12116)
  private toDateRequiresFromDateValidator() {
    return (formGroup: FormGroup) => {
      const fromDate = formGroup.get('fromDate')?.value;
      const toDate = formGroup.get('toDate')?.value;

      if (toDate && !fromDate) {
        return { toDateRequiresFromDate: true };
      }

      return null;
    };
  }

  // Validator: Unit ID format (7-digit Codabar or 15-digit ISBT with check digits)
  // JIRA MLT-11028: ISBT format = '=' + 5-digit prefix + 8-digit core + 2-digit check (total 15)
  private unitIdFormatValidator() {
    return (control: any): { [key: string]: any } | null => {
      const value = control.value?.trim();
      if (!value) return null;

      // Check if it's 7-digit Codabar format
      if (value.length === 7) {
        // Must be all numeric
        if (!/^\d{7}$/.test(value)) {
          return { unitIdInvalidFormat: true };
        }

        // Validate check digit at position 7 (index 6)
        const checkDigit = this.calculateCodabarCheckDigit(value.substring(0, 6));
        if (parseInt(value[6]) !== checkDigit) {
          return { unitIdCodabarCheckDigit: true };
        }

        // KNOWN LIMITATION (QA Bug #3): Missing Collection Date LOV workflow for 7-character Unit IDs
        // Per Oracle Forms behavior:
        // - If a 7-character unit ID has multiple collection dates, user should select from a list/dropdown
        // - If only 1 collection date exists, it should be auto-populated
        // - If > 1 collection dates exist, show collection date picker and require user selection
        //
        // TODO: Implement Collection Date LOV workflow:
        // 1. After successful 7-digit validation, query backend for collection date count
        // 2. If count === 1, auto-populate collection date field
        // 3. If count > 1, show collection date picker/dropdown with available dates
        // 4. If count === 0, show error that no collection dates found
        //
        // REQUIRES:
        // - Backend API: GET /api/donors/{donorId}/unit-ids/{unitId}/collection-dates
        // - UI Component: Collection date selection dialog/dropdown
        // - Workflow: Navigate to collection date field or show picker based on count
        //
        // See FMB reference: dpqaudit_fmb.xml - go_item('ctrl_blk_1.s_coll_date') logic

        return null;
      }

      // Check if it's 15-digit ISBT format
      if (value.length === 15) {
        // Position 1 (index 0) must be '='
        if (value[0] !== '=') {
          return { unitIdIsbtFormat: true };
        }

        // Validate ISBT prefix (positions 2-6, indices 1-5) - Error 16206
        const prefix = value.substring(1, 6);
        if (!this.isValidIsbtPrefix(prefix)) {
          return { unitIdIsbtInvalidPrefix: true };
        }

        // Positions 2-14 (indices 1-13) should be alphanumeric
        const dataSection = value.substring(1, 14);
        if (!/^[A-Za-z0-9]{13}$/.test(dataSection)) {
          return { unitIdInvalidFormat: true };
        }

        // Positions 8-13 (indices 7-12) must be numeric per JIRA error 16207
        const coreSection = value.substring(7, 13);
        if (!/^\d{6}$/.test(coreSection)) {
          return { unitIdIsbtCoreNotNumeric: true };
        }

        // Validate check digits at positions 14-15 (indices 13-14)
        // NOTE: ISBT uses 2 check digits (positions 14-15) per ISO 7064 Mod 37,2
        // KNOWN LIMITATION (QA Bug #4 & #5): Current implementation validates only the second check digit (position 15)
        // The complete validation should verify BOTH check digits against the ISO 7064 Mod 37,2 algorithm
        // TODO: Implement full ISO 7064 Mod 37,2 two-check-digit validation
        // TODO: Verify this matches Oracle Forms validate_unit_chkdigit function behavior
        // TODO: Test side-by-side with Oracle Forms to ensure algorithm matches exactly
        const checkDigit = this.calculateIsbtCheckDigit(value.substring(0, 14));
        if (value[14] !== checkDigit) {
          return { unitIdIsbtCheckDigit: true };
        }

        return null;
      }

      // For lengths 8-13: Check if all numeric OR last 5 digits are numeric (FMB validation per QA report)
      if (value.length >= 8 && value.length <= 13) {
        const allNumeric = /^\d+$/.test(value);
        const last5Numeric = /\d{5}$/.test(value);

        if (!allNumeric && !last5Numeric) {
          return { unitIdInvalidFormat: true };
        }

        // If we reach here, the unit ID is valid (all numeric OR last 5 numeric)
        return null;
      }

      // If not 7, 8-13, or 15 characters, invalid format
      return { unitIdInvalidFormat: true };
    };
  }

  /**
   * Calculate Codabar check digit (Modulo 10)
   * KNOWN LIMITATION (QA Bug #5): This is a custom implementation
   * TODO: Verify this matches Oracle Forms validate_unit_chkdigit function for Codabar
   * TODO: Test side-by-side with Oracle Forms to ensure the modulo 10 algorithm matches exactly
   */
  private calculateCodabarCheckDigit(unitId: string): number {
    let sum = 0;
    for (let i = 0; i < unitId.length; i++) {
      sum += parseInt(unitId[i]);
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit;
  }

  // Calculate ISBT check digit (ISO 7064, Mod 37, 2)
  private calculateIsbtCheckDigit(unitId: string): string {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ*';
    let check = 0;

    for (let i = 1; i < unitId.length; i++) { // Start from 1 to skip '='
      const char = unitId[i].toUpperCase();
      const value = chars.indexOf(char);
      if (value === -1) continue;

      check = ((check + value) * 2) % 37;
    }

    check = (37 - check) % 37;
    return chars[check];
  }

  /**
   * Validates ISBT prefix format (positions 2-6, indices 1-5)
   * Per FMB check_isbt_prefix function - Error 16206
   *
   * ISBT prefixes are facility codes assigned by ICCBBA (International Council for Commonality in Blood Banking Automation)
   * Basic validation rules:
   * - Must be exactly 5 characters
   * - First character must be a letter (A-Z)
   * - Remaining 4 characters must be alphanumeric
   * - Cannot be all numeric (e.g., "12345")
   * - Cannot be all the same character (e.g., "AAAAA")
   *
   * TODO: For complete validation, this should check against the official ISBT prefix registry
   * or match the Oracle Forms check_isbt_prefix function behavior
   */
  private isValidIsbtPrefix(prefix: string): boolean {
    if (prefix.length !== 5) {
      return false;
    }

    const upperPrefix = prefix.toUpperCase();

    // First character must be a letter
    if (!/^[A-Z]/.test(upperPrefix)) {
      return false;
    }

    // Remaining characters must be alphanumeric
    if (!/^[A-Z][A-Z0-9]{4}$/.test(upperPrefix)) {
      return false;
    }

    // Cannot be all numeric (would fail first check anyway, but being explicit)
    if (/^\d{5}$/.test(upperPrefix)) {
      return false;
    }

    // Cannot be all the same character
    const firstChar = upperPrefix[0];
    if (upperPrefix.split('').every(c => c === firstChar)) {
      return false;
    }

    // Basic validation passed
    // NOTE: For production, this should validate against the official ISBT prefix list
    return true;
  }

  // Validator: Deferral ID format (alphanumeric, max 8 characters)
  private deferralIdFormatValidator() {
    return (control: any): { [key: string]: any } | null => {
      const value = control.value?.trim();
      if (!value) return null;

      // Max length check (8 characters max) - per FMB, no format validation, only length
      if (value.length > 8) {
        return { deferralIdMaxLength: true };
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

  onDonorIdClick(): void {
    const dialogRef = this.dialog.open(SearchForDonorDialog, {
      width: '1150px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      disableClose: true,
      position: { right: '0', top: '64px' },
      panelClass: 'right-side-dialog',
      hasBackdrop: true,
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe((result: SearchForDonorDialogResult) => {
      if (result?.action === 'select' && result.donor) {
        // Map the SearchForDonorDialogResult donor to DonorInfo
        const donorInfo: DonorInfo = {
          donorId: result.donor.donorId,
          lastName: result.donor.lastName || '',
          firstName: result.donor.firstName || '',
          dateOfBirth: result.donor.dateOfBirth || '',
          sex: this.formatSex(result.donor.gender || '')
        };

        this.donorInfo.set(donorInfo);
        this.clearResults();

        // Clear all filter fields
        this.searchForm.reset({
          fromDate: null,
          toDate: null,
          unitId: '',
          deferralId: '',
          collectionDate: null
        });

        // Clear filter panel filters and chips for both tabs
        this.summaryAppliedFilters.set({});
        this.summaryFilterChips.set([]);
        this.detailAppliedFilters.set({});
        this.detailFilterChips.set([]);
        this.isFilterOpen = false;

        // Automatically retrieve data for the selected donor
        this.pageIndex = 0;
        this.summarySelectedRecords.set(new Set());
        this.summarySelectedTableNames.set(new Set());
        this.detailSelectedRecords.set(new Set());
        this.hasRetrieved.set(true);
        this.loadAuditData();
      }
    });
  }

  onRetrieve(): void {
    if (!this.donorInfo()) {
      this.snackbarService.showError(DPAQ_ERROR_MESSAGES.NO_DONOR_SELECTED);
      return;
    }

    // Clear backend validation errors before new submission (keep format errors)
    const unitIdControl = this.searchForm.get('unitId');
    const deferralIdControl = this.searchForm.get('deferralId');
    const collectionDateControl = this.searchForm.get('collectionDate');

    if (unitIdControl?.hasError('unitIdNotFound')) {
      const errors = { ...unitIdControl.errors };
      delete errors['unitIdNotFound'];
      unitIdControl.setErrors(Object.keys(errors).length > 0 ? errors : null);
    }
    if (deferralIdControl?.hasError('deferralIdNotFound')) {
      const errors = { ...deferralIdControl.errors };
      delete errors['deferralIdNotFound'];
      deferralIdControl.setErrors(Object.keys(errors).length > 0 ? errors : null);
    }
    if (collectionDateControl?.hasError('collectionDateNotFound')) {
      const errors = { ...collectionDateControl.errors };
      delete errors['collectionDateNotFound'];
      collectionDateControl.setErrors(Object.keys(errors).length > 0 ? errors : null);
    }

    // Mark form as touched to show validation errors
    this.searchForm.markAllAsTouched();

    // Clear error state when retrieve is clicked (same as retry button)
    this.hasError = false;

    // Check if at least one search criteria is entered
    if (!this.hasAnyFilterValue()) {
      this.snackbarService.showError(DPAQ_ERROR_MESSAGES.AT_LEAST_ONE_CRITERIA_REQUIRED);
      return;
    }

    // Check form validity - inline mat-error will display below fields
    if (this.searchForm.invalid) {
      this.searchForm.markAllAsTouched();
      this.focusFirstInvalidField();
      return;
    }

    // Note: Removed client-side date filtering optimization - all filtering now done server-side
    // Always call backend API when RETRIEVE is clicked to ensure consistent behavior

    this.pageIndex = 0;
    // Clear both Summary and Detail view selections
    this.summarySelectedRecords.set(new Set());
    this.summarySelectedTableNames.set(new Set());
    this.detailSelectedRecords.set(new Set());
    this.hasRetrieved.set(true); // Mark that retrieve has been called
    // Clear all applied filters for both tabs when retrieve is clicked
    this.summaryAppliedFilters.set({});
    this.summaryFilterChips.set([]);
    this.detailAppliedFilters.set({});
    this.detailFilterChips.set([]);
    this.loadAuditData();
  }

  private loadAuditData(): void {
    const donor = this.donorInfo();
    if (!donor) return;

    const form = this.searchForm.getRawValue();
    this.hasError = false;

    // Format donor DOB to YYYY-MM-DD (remove time component if present)
    const formattedDob = donor.dateOfBirth ? moment(donor.dateOfBirth).format('YYYY-MM-DD') : '';

    const criteria: DonorProfileAuditQueryDto = {
      donorId: donor.donorId ? donor.donorId.trim() : '',
      lastName: donor.lastName ? donor.lastName.trim() : '',
      firstName: donor.firstName ? donor.firstName.trim() : '',
      dob: formattedDob
    };

    // Only add gender field if it has a valid value (omit entirely if missing)
    // Convert Male/Female back to M/F for API
    if (donor.sex && donor.sex !== '--' && donor.sex.trim()) {
      criteria.gender = this.unformatSex(donor.sex.trim());
    }

    // Add date filters to backend request
    // IMPORTANT: Send dates in CHAPTER LOCAL TIME (not GMT/UTC) as YYYY-MM-DD format
    // This matches the pattern used by other audit queries (deferrals/donations pending audit)
    // Backend SHOULD pass these directly to Oracle without timezone conversion
    // KNOWN BACKEND BUG: Backend incorrectly converts local dates to GMT and loses time component
    // See backend analysis for fix needed in DonorProfileAuditController
    if (form.fromDate) {
      criteria.fromDate = DateFieldValidationUtility.serializeDateForApi(form.fromDate) || undefined;
    }
    if (form.toDate) {
      criteria.toDate = DateFieldValidationUtility.serializeDateForApi(form.toDate) || undefined;
    }

    // Send Unit ID, Deferral ID, and Collection Date filters to backend
    if (form.unitId?.trim()) {
      criteria.unitId = form.unitId.trim();
    }
    if (form.deferralId?.trim()) {
      criteria.deferralId = form.deferralId.trim();
    }
    if (form.collectionDate) {
      criteria.collectionDate = DateFieldValidationUtility.serializeDateForApi(form.collectionDate) || undefined;
    }

    // Clear client-side filters since we're sending to backend now
    this.clientUnitIdFilter.set('');
    this.clientDeferralIdFilter.set('');
    this.clientCollectionDateFilter.set('');

    // NOTE: Filter panel filters (fromDate, toDate, insertedUser) are applied client-side
    // to allow each tab to filter independently without affecting the other tab

    this.isLoading.set(true);

    // For Detail View tab (index 1), pass expandAll=true to get all detail rows
    const expandAll = this.currentTabIndex() === 1;

    // Get search text based on current tab
    const searchText = this.currentTabIndex() === 0 ? this.summarySearchText() : this.detailSearchText();

    // For Summary view: use searchText for Program ID and Data Details
    // For Detail view: use tableName parameter to filter by Table Name column
    const summarySearch = this.currentTabIndex() === 0 ? searchText : undefined;

    // For Detail view: prioritize selected table names from Summary View, otherwise use search text
    let tableNameFilter: string | undefined = undefined;
    if (this.currentTabIndex() === 1) {
      const selectedTableNames = this.summarySelectedTableNames();
      if (selectedTableNames.size > 0) {
        // Join table names with comma for backend filtering
        tableNameFilter = Array.from(selectedTableNames).join(',');
      } else {
        // No selection in Summary View, use search text
        tableNameFilter = searchText;
      }
    }

    this.service.queryAuditRecords(criteria, this.pageSize, this.pageIndex * this.pageSize, expandAll, summarySearch, tableNameFilter)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Map rowNum to recNum for display (API returns rowNum, code uses recNum)
          const mappedData = response.data.map(record => ({
            ...record,
            recNum: record.rowNum
          }));

          this.auditData.set(mappedData);

          // Store original data only if this is a fresh load without any filters
          // (no Unit ID, Deferral ID, Collection Date, From Date, or To Date)
          const hasNoFilters = !criteria.unitId && !criteria.deferralId && !criteria.collectionDate &&
                              !criteria.fromDate && !criteria.toDate;
          if (hasNoFilters) {
            this.originalAuditData.set(mappedData);
          }

          this.totalCount.set(response.total);
          this.isLoading.set(false);

          const users = [...new Set(response.data.map(r => r.insertUser))];
          this.insertedUsers.set(users);

          if (mappedData.length === 0) {
            this.snackbarService.showError(DPAQ_ERROR_MESSAGES.NO_RESULTS);
          }
        },
        error: (err) => {
          this.auditData.set([]);
          this.totalCount.set(0);
          this.isLoading.set(false);
          this.hasError = true;

          // Check for specific error codes
          const errorCode = err?.error?.errorCode || err?.errorCode || '';
          const msg = err?.error?.message || err?.displayMessage || '';

          // Handle Unit ID not found (Error 17003)
          if (errorCode === '17003' || msg?.toLowerCase().includes('unit id not found')) {
            const unitIdControl = this.searchForm.get('unitId');
            unitIdControl?.setErrors({ unitIdNotFound: true });
            unitIdControl?.markAsTouched();
            this.snackbarService.showError(DPAQ_ERROR_MESSAGES.UNIT_ID_NOT_FOUND);
            return;
          }

          // Handle Deferral ID not found (Error 16204)
          if (errorCode === '16204' || msg?.toLowerCase().includes('deferral id not found')) {
            const deferralIdControl = this.searchForm.get('deferralId');
            deferralIdControl?.setErrors({ deferralIdNotFound: true });
            deferralIdControl?.markAsTouched();
            this.snackbarService.showError(DPAQ_ERROR_MESSAGES.DEFERRAL_ID_NOT_FOUND);
            return;
          }

          // Handle Collection Date not found (Error 1145)
          if (errorCode === '1145' || msg?.toLowerCase().includes('collection date not found')) {
            const collectionDateControl = this.searchForm.get('collectionDate');
            collectionDateControl?.setErrors({ collectionDateNotFound: true });
            collectionDateControl?.markAsTouched();
            this.snackbarService.showError(DPAQ_ERROR_MESSAGES.COLLECTION_DATE_NOT_FOUND);
            return;
          }

          // Generic error handling
          if (msg) {
            this.snackbarService.showError(msg);
          } else {
            this.snackbarService.showError(DPAQ_ERROR_MESSAGES.LOAD_ERROR);
          }
        }
      });
  }

  onViewDetails(record: DonorProfileAuditResultDto): void {
    if (!record.detailsAvailable) return;
    this.currentTabIndex.set(1);
    this.loadAuditDetail(record.recNum);
  }

  onRowClick(record: DonorProfileAuditResultDto): void {
    if (!record.detailsAvailable) {
      return;
    }
    // Switch to Detail View tab and load details
    this.currentTabIndex.set(1);
    this.loadAuditDetail(record.recNum);
  }

  private loadAuditDetail(recNum: number): void {
    this.isDetailLoading.set(true);

    this.service.getAuditDetail(recNum)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (detail) => {
          this.selectedAuditDetail.set(detail);
          this.isDetailLoading.set(false);
        },
        error: (err) => {
          this.selectedAuditDetail.set(null);
          this.isDetailLoading.set(false);

          const statusCode = err?.status || err?.error?.statusCode;
          if (statusCode === 404) {
            this.snackbarService.showError(DPAQ_ERROR_MESSAGES.DETAIL_NOT_FOUND);
          } else {
            const msg = err?.error?.message || err?.displayMessage || '';
            if (msg) {
              this.snackbarService.showError(msg);
            } else {
              this.snackbarService.showError(DPAQ_ERROR_MESSAGES.DETAIL_LOAD_ERROR);
            }
          }
        }
      });
  }

  onTabChange(index: number): void {
    this.currentTabIndex.set(index);
    if (index === 0) {
      this.selectedAuditDetail.set(null);
    }

    // Reset pagination to first page when switching tabs
    // This prevents "No Results" when switching back to Summary view after navigating Detail view pagination
    // Example: Detail view has 956 records, Summary view has 8 records
    // If user is on page 2 in Detail view and switches to Summary, page 2 would be empty
    this.pageIndex = 0;

    // Reload data when switching tabs because Detail View needs expandAll=true
    // Summary View (index 0) uses expandAll=false (COL_NUM = 1 only)
    // Detail View (index 1) uses expandAll=true (all COL_NUM values)
    if (this.hasRetrieved() && this.donorInfo()) {
      this.loadAuditData();
    }
  }

  // Summary View checkbox methods (only called from Summary View template)
  onToggleRecord(recNum: number): void {
    const selected = new Set(this.summarySelectedRecords());
    const selectedTableNames = new Set(this.summarySelectedTableNames());

    // Find the record to get its table name
    const record = this.filteredData().find(r => r.recNum === recNum);

    if (selected.has(recNum)) {
      selected.delete(recNum);
      // Remove table name if no other selected records have the same table name
      if (record && !Array.from(selected).some(recNum => {
        const r = this.filteredData().find(x => x.recNum === recNum);
        return r?.tableName === record.tableName;
      })) {
        selectedTableNames.delete(record.tableName);
      }
    } else {
      selected.add(recNum);
      // Add table name to the set
      if (record?.tableName) {
        selectedTableNames.add(record.tableName);
      }
    }

    this.summarySelectedRecords.set(selected);
    this.summarySelectedTableNames.set(selectedTableNames);
  }

  onToggleAll(event: { checked: boolean }): void {
    if (event.checked) {
      const allRecords = new Set(this.filteredData().map(r => r.recNum));
      const allTableNames = new Set(this.filteredData().map(r => r.tableName).filter(Boolean));
      this.summarySelectedRecords.set(allRecords);
      this.summarySelectedTableNames.set(allTableNames);
    } else {
      this.summarySelectedRecords.set(new Set());
      this.summarySelectedTableNames.set(new Set());
    }
  }

  isRecordSelected(recNum: number): boolean {
    return this.summarySelectedRecords().has(recNum);
  }

  // Summary View checkbox state - computed signals for automatic reactivity
  isAllSelected = computed(() => {
    const filtered = this.filteredData();
    if (filtered.length === 0) return false;
    const selected = this.summarySelectedRecords();
    return filtered.every(r => selected.has(r.recNum));
  });

  onSummaryPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
  }

  onDetailViewSelectionChange(selected: Set<number>): void {
    // DetailViewTab emits Set<number> directly
    this.detailSelectedRecords.set(selected);
  }

  onDetailViewSearch(searchText: string): void {
    // DetailViewTab now emits the search string directly from SearchBar component
    const trimmed = searchText?.trim() || '';
    this.detailSearchText.set(trimmed);

    // Reset to first page when searching
    this.pageIndex = 0;

    // Trigger API call with search text
    if (this.hasRetrieved() && this.donorInfo()) {
      this.loadAuditData();
    }
  }

  onDetailViewPageChange(event: PageEvent): void {
    // DetailViewTab pagination - triggers API call to load new page
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    this.loadAuditData();
  }

  toggleFilterPanel(): void {
    this.isFilterOpen = !this.isFilterOpen;
  }

  closeFilterPanel(): void {
    this.isFilterOpen = false;
    // Remove focus from filter button based on current tab
    const currentFilterBtn = this.currentTabIndex() === 0
      ? this.summaryFilterBtn
      : this.detailViewTab?.filterBtn;

    if (currentFilterBtn?.nativeElement) {
      currentFilterBtn.nativeElement.blur();
    }
  }

  applyFilters(filters: AuditFilterCriteria): void {
    // Apply filters to the current tab only
    if (this.currentTabIndex() === 0) {
      this.summaryAppliedFilters.set(filters);
      this.summaryFilterChips.set(DonorProfileAuditQueryFilterChipsUtils.convertFiltersToChips(filters));
      // Clear selections when filters are applied to prevent selecting filtered-out records
      this.summarySelectedRecords.set(new Set());
      this.summarySelectedTableNames.set(new Set());
    } else {
      this.detailAppliedFilters.set(filters);
      this.detailFilterChips.set(DonorProfileAuditQueryFilterChipsUtils.convertFiltersToChips(filters));
      // Clear selections when filters are applied to prevent selecting filtered-out records
      this.detailSelectedRecords.set(new Set());
    }

    // Reset to first page when filtering
    this.pageIndex = 0;

    // Clear error state when applying filters
    this.hasError = false;

    this.closeFilterPanel();

    // NOTE: Filters are applied client-side to prevent one tab's filters from affecting the other tab
    // Each tab filters the shared auditData independently based on its own filter state
  }

  removeFilterChip(chipKey: string): void {
    const updatedFilters = DonorProfileAuditQueryFilterChipsUtils.removeFilterByChipKey(
      this.appliedFilters(),
      chipKey
    );

    if (updatedFilters) {
      this.applyFilters(updatedFilters);
    } else {
      this.clearAllFilters();
    }

    // Clear error state when filters are removed
    this.hasError = false;
  }

  clearAllFilters(): void {
    this.closeFilterPanel();

    // Clear filters for the current tab only
    if (this.currentTabIndex() === 0) {
      this.summaryAppliedFilters.set({});
      this.summaryFilterChips.set([]);
      // Clear selections when filters are cleared
      this.summarySelectedRecords.set(new Set());
      this.summarySelectedTableNames.set(new Set());
    } else {
      this.detailAppliedFilters.set({});
      this.detailFilterChips.set([]);
      // Clear selections when filters are cleared
      this.detailSelectedRecords.set(new Set());
    }

    // Reset to first page
    this.pageIndex = 0;

    // Clear error state when filters are cleared
    this.hasError = false;

    // NOTE: Filter panel filters are applied client-side, so clearing them automatically updates
    // the computed properties (filteredData/sortedData) without needing to reload data
  }

  onClearAllSearchFilters(): void {
    // Clear all search filter fields in the second section
    this.searchForm.patchValue({
      fromDate: null,
      toDate: null,
      unitId: '',
      deferralId: '',
      collectionDate: null
    });

    // Mark all controls as untouched to remove any validation errors
    Object.keys(this.searchForm.controls).forEach(key => {
      this.searchForm.get(key)?.markAsUntouched();
    });

    // Clear any backend errors
    this.clearBackendErrors();

    // Update the signal that tracks if any filter has a value
    this.hasAnyFilterValue.set(false);

    // Clear client-side filter signals
    this.clientUnitIdFilter.set('');
    this.clientDeferralIdFilter.set('');
    this.clientCollectionDateFilter.set('');
  }

  onSearch(searchKeyword: string): void {
    const trimmed = searchKeyword?.trim() || '';
    this.summarySearchText.set(trimmed);

    // Reset to first page when searching
    this.pageIndex = 0;

    // Trigger API call with search text
    if (this.hasRetrieved() && this.donorInfo()) {
      this.loadAuditData();
    }
  }

  // Summary View filtered data - computed signal for reactivity
  // Applies only filter panel filters (fromDate, toDate, insertedUser) client-side
  // Search filtering is now handled server-side
  filteredData = computed(() => {
    const data = this.auditData();
    const direction = this.sortDirection();
    const filters = this.summaryAppliedFilters();

    let filtered = data;

    // Apply filter panel filters (fromDate, toDate, insertedUser) - client-side
    if (filters.fromDate || filters.toDate) {
      filtered = filtered.filter(record => {
        if (!record.insertDate) return false;

        const insertDate = moment(record.insertDate).startOf('day');
        if (!insertDate.isValid()) return false;

        if (filters.fromDate) {
          const fromDate = moment(filters.fromDate).startOf('day');
          if (insertDate.isBefore(fromDate)) return false;
        }

        if (filters.toDate) {
          const toDate = moment(filters.toDate).startOf('day');
          if (insertDate.isAfter(toDate)) return false;
        }

        return true;
      });
    }

    if (filters.insertedUser) {
      filtered = filtered.filter(record =>
        record.insertUser?.toLowerCase() === filters.insertedUser?.toLowerCase()
      );
    }

    // Apply sorting by Record Number
    const sorted = [...filtered].sort((a, b) => {
      if (direction === 'asc') {
        return a.recNum - b.recNum;
      } else {
        return b.recNum - a.recNum;
      }
    });

    return sorted;
  });

  toggleSort(): void {
    const current = this.sortDirection();
    this.sortDirection.set(current === 'asc' ? 'desc' : 'asc');
  }

  onPrintSelected(): void {
    const isDetailView = this.currentTabIndex() === 1;
    const currentSelected = isDetailView ? this.detailSelectedRecords() : this.summarySelectedRecords();

    // Filter selected records to only include those visible in current filtered view
    const visibleRecordNumbers = new Set(this.filteredData().map(r => r.recNum));
    const visibleSelected = Array.from(currentSelected)
      .filter(recNum => visibleRecordNumbers.has(recNum))
      .sort((a: number, b: number) => a - b);

    if (visibleSelected.length === 0) {
      this.snackbarService.showError(DPAQ_ERROR_MESSAGES.PRINT_NO_SELECTION);
      return;
    }

    const dialogRef = this.dialog.open<PrintSelectedDialog, PrintSelectedDialogData>(
      PrintSelectedDialog,
      {
        width: '500px',
        data: { recordNumbers: visibleSelected }
      }
    );

    dialogRef.afterClosed().subscribe(printRange => {
      if (printRange) {
        this.executePrint(printRange.fromRecordNumber!, printRange.toRecordNumber!);
      }
    });
  }

  private executePrint(fromRecord: number, toRecord: number): void {
    const recordsToPrint = this.auditData().filter(
      r => r.recNum >= fromRecord && r.recNum <= toRecord
    );

    if (recordsToPrint.length === 0) {
      this.snackbarService.showError('No records found in the selected range');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      this.snackbarService.showError('Please allow popups to print');
      return;
    }

    const donor = this.donorInfo();
    const printContent = this.generatePrintHtml(recordsToPrint, donor);
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  }

  private generatePrintHtml(records: DonorProfileAuditResultDto[], donor: DonorInfo | null): string {
    const rows = records.map(r => `
      <tr>
        <td>${r.recNum ?? '-'}</td>
        <td>${this.formatDateTime(r.insertDate) || '-'}</td>
        <td>${r.insertUser ?? '-'}</td>
        <td>${r.programId ?? '-'}</td>
        <td>${r.tableName ?? '-'}</td>
        <td>${this.currentTabIndex() === 0 ? '-' : (r.dataDetails ?? '-')}</td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Donor Profile Audit Query - Print</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { font-size: 18px; margin-bottom: 10px; }
            .donor-info { margin-bottom: 20px; }
            .donor-info p { margin: 5px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: bold; }
            @media print {
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>Donor Profile Audit Query (DPAQ)</h1>
          ${donor ? `
            <div class="donor-info">
              <p><strong>Donor ID:</strong> ${donor.donorId ?? '-'}</p>
              <p><strong>Name:</strong> ${donor.lastName ?? '-'}, ${donor.firstName ?? '-'}</p>
              <p><strong>Date of Birth:</strong> ${this.formatDate(donor.dateOfBirth) || '-'}</p>
              <p><strong>Sex:</strong> ${donor.sex ?? '-'}</p>
            </div>
          ` : ''}
          <table>
            <thead>
              <tr>
                <th>Record Number</th>
                <th>Inserted Date</th>
                <th>Inserted User</th>
                <th>Program ID</th>
                <th>Table Name</th>
                <th>Data Details</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </body>
      </html>
    `;
  }

  onRetry(): void {
    this.hasError = false;
    if (this.donorInfo()) {
      this.loadAuditData();
    }
  }

  // Keyboard shortcuts
  @HostListener('window:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent): void {
    // Alt+F: Toggle filter panel
    if (event.altKey && event.key.toLowerCase() === 'f') {
      event.preventDefault();
      this.toggleFilterPanel();
    }

    // Escape: Close filter if open
    if (event.key === 'Escape') {
      if (this.isFilterOpen) {
        event.preventDefault();
        this.closeFilterPanel();
      }
    }
  }

  formatDate(value: string): string {
    if (!value) return '--';

    // Handle special "******" dates (per JIRA: treat as 2099-12-31)
    if (value === '******') {
      return '31-DEC-2099';
    }

    // Convert from GMT to local timezone if enabled
    let m: moment.Moment;
    if (this.isTimezoneEnabled()) {
      m = this.convertGMTToLocal(value);
    } else {
      m = moment(value);
    }

    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : value;
  }

  formatDateTime(value: string): string {
    if (!value) return '--';

    // Handle special "******" dates (per JIRA: treat as 2099-12-31 23:59)
    if (value === '******') {
      return '31-DEC-2099 23:59';
    }

    // Convert from GMT to local timezone if enabled
    let m: moment.Moment;
    if (this.isTimezoneEnabled()) {
      m = this.convertGMTToLocal(value);
    } else {
      m = moment(value);
    }

    if (!m.isValid()) return value;

    // If value is just a date (YYYY-MM-DD), add time
    if (value.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // For "From Date" use 00:00, for "To Date" use 24:00 (display as 00:00 next day)
      return m.format('DD-MMM-YYYY').toUpperCase() + ' 00:00';
    }

    return m.format('DD-MMM-YYYY HH:mm').toUpperCase();
  }

  formatSex(value: string | null | undefined): string {
    if (!value) return '--';
    const upperValue = value.toUpperCase();
    if (upperValue === 'M') return 'Male';
    if (upperValue === 'F') return 'Female';
    return value;
  }

  unformatSex(value: string | null | undefined): string {
    if (!value) return '';
    const lowerValue = value.toLowerCase();
    if (lowerValue === 'male') return 'M';
    if (lowerValue === 'female') return 'F';
    return value;
  }

  displayValue(value: string | null | undefined): string {
    if (value === null || value === undefined || value === '') return '--';
    return String(value);
  }

  hasAppliedFilters(): boolean {
    const filters = this.appliedFilters();
    return !!(filters.fromDate ||
              filters.toDate ||
              filters.insertedUser);
  }

  hasUnitIdDeferralIdError(): boolean {
    const unitId = this.searchForm.get('unitId')?.value?.trim();
    const deferralId = this.searchForm.get('deferralId')?.value?.trim();
    return !!(unitId && deferralId && this.searchForm.hasError('mutualExclusion'));
  }

  getUnitIdError(): string {
    const control = this.searchForm.get('unitId');
    if (!control) return '';

    // Check mutual exclusion first
    if (this.hasUnitIdDeferralIdError()) {
      return 'Cannot enter both Unit ID and Deferral ID. Please clear one field.';
    }

    // Only show errors when field is touched
    if (!control.touched) return '';

    // Only show frontend validation errors inline (format, length, check digit)
    // Backend errors (unitIdNotFound) are shown in snackbar only
    if (control.hasError('unitIdInvalidFormat')) {
      return DPAQ_ERROR_MESSAGES.UNIT_ID_INVALID_FORMAT;
    }
    if (control.hasError('unitIdCodabarCheckDigit')) {
      return DPAQ_ERROR_MESSAGES.UNIT_ID_CODABAR_CHECK_DIGIT;
    }
    if (control.hasError('unitIdIsbtFormat')) {
      return DPAQ_ERROR_MESSAGES.UNIT_ID_ISBT_FORMAT;
    }
    if (control.hasError('unitIdIsbtInvalidPrefix')) {
      return DPAQ_ERROR_MESSAGES.UNIT_ID_ISBT_INVALID_PREFIX;
    }
    if (control.hasError('unitIdIsbtCheckDigit')) {
      return DPAQ_ERROR_MESSAGES.UNIT_ID_ISBT_CHECK_DIGIT;
    }
    if (control.hasError('unitIdIsbtCoreNotNumeric')) {
      return DPAQ_ERROR_MESSAGES.UNIT_ID_ISBT_CORE_NOT_NUMERIC;
    }
    if (control.hasError('unitIdMaxLength')) {
      return DPAQ_ERROR_MESSAGES.UNIT_ID_MAX;
    }

    return '';
  }

  getDeferralIdError(): string {
    const control = this.searchForm.get('deferralId');
    if (!control) return '';

    // Check mutual exclusion first
    if (this.hasUnitIdDeferralIdError()) {
      return 'Cannot enter both Unit ID and Deferral ID. Please clear one field.';
    }

    // Only show errors when field is touched
    if (!control.touched) return '';

    // Only show frontend validation errors inline (max length)
    // Backend errors (deferralIdNotFound) are shown in snackbar only
    if (control.hasError('deferralIdMaxLength')) {
      return DPAQ_ERROR_MESSAGES.DEFERRAL_ID_MAX;
    }

    return '';
  }

  getFromDateError(): string {
    const control = this.searchForm.get('fromDate');
    if (!control) return '';

    // Only show errors after field is touched (blurred)
    if (!control.touched) return '';

    // Check form-level errors first
    if (this.searchForm.hasError('fromDateAfterToDate')) {
      return DPAQ_ERROR_MESSAGES.FROM_DATE_AFTER_TO_DATE;
    }

    if (this.searchForm.hasError('toDateRequiresFromDate')) {
      return DPAQ_ERROR_MESSAGES.TO_DATE_REQUIRES_FROM_DATE;
    }

    // Check field-level errors
    if (control.hasError('futureDate')) {
      return DPAQ_ERROR_MESSAGES.FROM_DATE_FUTURE;
    }

    // Check for invalid date input
    if (control.hasError('invalidDate') || control.hasError('matDatepickerParse')) {
      return 'From Date is invalid';
    }

    const inputValue = this.fromDateInput?.nativeElement?.value;
    if (inputValue && inputValue.trim().length > 0 && !control.value) {
      return 'From Date is invalid';
    }

    return '';
  }

  getToDateError(): string {
    const control = this.searchForm.get('toDate');
    if (!control) return '';

    // Only show errors after field is touched (blurred)
    if (!control.touched) return '';

    // Check form-level errors first
    if (this.searchForm.hasError('fromDateAfterToDate')) {
      return DPAQ_ERROR_MESSAGES.FROM_DATE_AFTER_TO_DATE;
    }

    if (this.searchForm.hasError('toDateRequiresFromDate')) {
      return DPAQ_ERROR_MESSAGES.TO_DATE_REQUIRES_FROM_DATE;
    }

    // Check field-level errors
    if (control.hasError('futureDate')) {
      return DPAQ_ERROR_MESSAGES.TO_DATE_FUTURE;
    }

    // Check for invalid date input
    if (control.hasError('invalidDate') || control.hasError('matDatepickerParse')) {
      return 'To Date is invalid';
    }

    const inputValue = this.toDateInput?.nativeElement?.value;
    if (inputValue && inputValue.trim().length > 0 && !control.value) {
      return 'To Date is invalid';
    }

    return '';
  }

  getCollectionDateError(): string {
    const control = this.searchForm.get('collectionDate');
    if (!control) return '';

    // Backend existence validation (show immediately)
    if (control.hasError('collectionDateNotFound')) {
      return DPAQ_ERROR_MESSAGES.COLLECTION_DATE_NOT_FOUND;
    }

    // Only show other errors after field is touched (blurred)
    if (!control.touched) return '';

    // Future date validation
    if (control.hasError('futureDate')) {
      return 'Collection Date cannot be greater than current date';
    }

    // Check for invalid date input
    if (control.hasError('invalidDate') || control.hasError('matDatepickerParse')) {
      return 'Collection Date is invalid';
    }

    const inputValue = this.collectionDateInput?.nativeElement?.value;
    if (inputValue && inputValue.trim().length > 0 && !control.value) {
      return 'Collection Date is invalid';
    }

    return '';
  }

  private clearResults(): void {
    this.auditData.set([]);
    this.originalAuditData.set([]);
    this.totalCount.set(0);
    // Clear both Summary and Detail view selections and search
    this.summarySelectedRecords.set(new Set());
    this.summarySelectedTableNames.set(new Set());
    this.detailSelectedRecords.set(new Set());
    this.summarySearchText.set('');
    this.detailSearchText.set('');
    this.selectedAuditDetail.set(null);
    this.pageIndex = 0;
    // Clear client-side filters
    this.clientUnitIdFilter.set('');
    this.clientDeferralIdFilter.set('');
    this.clientCollectionDateFilter.set('');
  }

  private resetComponent(): void {
    this.donorInfo.set(null);
    this.searchForm.reset();
    this.clearResults();
    // Clear filters for both tabs
    this.summaryAppliedFilters.set({});
    this.summaryFilterChips.set([]);
    this.detailAppliedFilters.set({});
    this.detailFilterChips.set([]);
  }

  private clearBackendErrors(): void {
    // Clear backend validation errors (keep format validation errors)
    const unitIdControl = this.searchForm.get('unitId');
    const deferralIdControl = this.searchForm.get('deferralId');
    const collectionDateControl = this.searchForm.get('collectionDate');

    if (unitIdControl?.hasError('unitIdNotFound')) {
      const errors = { ...unitIdControl.errors };
      delete errors['unitIdNotFound'];
      unitIdControl.setErrors(Object.keys(errors).length > 0 ? errors : null);
    }
    if (deferralIdControl?.hasError('deferralIdNotFound')) {
      const errors = { ...deferralIdControl.errors };
      delete errors['deferralIdNotFound'];
      deferralIdControl.setErrors(Object.keys(errors).length > 0 ? errors : null);
    }
    if (collectionDateControl?.hasError('collectionDateNotFound')) {
      const errors = { ...collectionDateControl.errors };
      delete errors['collectionDateNotFound'];
      collectionDateControl.setErrors(Object.keys(errors).length > 0 ? errors : null);
    }
  }


  private focusFirstInvalidField(): void {
    const firstInvalidControl = Object.keys(this.searchForm.controls)
      .find(key => this.searchForm.controls[key].invalid);
    if (firstInvalidControl) {
      const el = document.querySelector(`[formControlName="${firstInvalidControl}"]`) as HTMLElement;
      if (el) el.focus();
    }
  }

  onFromDateBlur(): void {
    setTimeout(() => {
      const control = this.searchForm.get('fromDate');
      control?.markAsTouched();
      this.validateDateInput('fromDate', this.fromDateInput);
      control?.updateValueAndValidity();

      // Show snackbar error on blur if invalid
      if (control?.invalid && !control?.hasError('matDatepickerParse')) {
        const error = this.getFromDateError();
        if (error) {
          this.snackbarService.showError(error);
        }
      }
    }, 0);
  }

  onToDateBlur(): void {
    setTimeout(() => {
      const control = this.searchForm.get('toDate');
      control?.markAsTouched();
      this.validateDateInput('toDate', this.toDateInput);
      control?.updateValueAndValidity();

      // Show snackbar error on blur if invalid
      if (control?.invalid && !control?.hasError('matDatepickerParse')) {
        const error = this.getToDateError();
        if (error) {
          this.snackbarService.showError(error);
        }
      }
    }, 0);
  }

  onCollectionDateBlur(): void {
    setTimeout(() => {
      const control = this.searchForm.get('collectionDate');
      control?.markAsTouched();
      this.validateDateInput('collectionDate', this.collectionDateInput);
      control?.updateValueAndValidity();

      // Show snackbar error on blur if invalid
      if (control?.invalid && !control?.hasError('matDatepickerParse')) {
        const error = this.getCollectionDateError();
        if (error) {
          this.snackbarService.showError(error);
        }
      }
    }, 0);
  }

  private validateDateInput(controlName: string, inputRef: ElementRef<HTMLInputElement>): void {
    const control = this.searchForm.get(controlName);
    const inputValue = inputRef?.nativeElement?.value?.trim() || '';

    if (inputValue && !control?.value && control) {
      control.setErrors({ ...control.errors, invalidDate: true });
    } else if (control?.hasError('invalidDate') && (!inputValue || control?.value)) {
      const errors = { ...control.errors };
      delete errors['invalidDate'];
      control.setErrors(Object.keys(errors).length > 0 ? errors : null);
    }
  }

  get f() {
    return this.searchForm.controls;
  }
}
