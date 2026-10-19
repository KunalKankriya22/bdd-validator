import { Component, OnInit, OnDestroy, ViewChild, ElementRef, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, FormControl, Validators, ReactiveFormsModule, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { MatTableModule } from '@angular/material/table';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Sort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { OverlayModule, ConnectedPosition } from '@angular/cdk/overlay';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, ErrorStateMatcher } from '@angular/material/core';
import moment, { Moment } from 'moment';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { LoginService } from '@shared/services/login.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { UppercaseMomentDateAdapter } from '@shared/date/uppercase-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';

import {
  DonationRecord,
  DonorRecord,
  DonationsFilterValue,
  DonorsFilterValue,
  MultiSelectInterdictionsDialogData,
  MultiSelectInterdictionsDialogResult
} from './models/interdiction-query.model';
import { InterdictionQueryService } from '../../../query-interdictions-holds/services/interdiction-query.service';
import {
  InterdictionCode,
  InterdictionQueryParams as ApiInterdictionQueryParams,
  InterdictionQueryResponse,
  VALIDATION_MESSAGES
} from '../../../query-interdictions-holds/models/interdiction-query.model';
import { OtherHoldsPanelComponent, OtherHoldsPanelData } from './components/other-holds-panel/other-holds-panel.component';
import { MultiSelectInterdictionsDialogComponent } from './multi-select-interdictions-dialog/multi-select-interdictions-dialog.component';
import { DonationsFilterPanelComponent } from './components/donations-tab/donations-filter-panel/donations-filter-panel.component';
import { DonorsFilterPanelComponent } from './components/donors-tab/donors-filter-panel/donors-filter-panel.component';
import { SearchBar } from '@shared/components/search-bar/search-bar';
import { DonationsTabComponent } from './components/donations-tab/donations-tab.component';
import { DonorsTabComponent } from './components/donors-tab/donors-tab.component';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { InterdictionQueryFilterChipsUtils } from './utils/filter-chips.utils';
import { DonorDemographicsComponent } from '../../../donor-demographics/donor-demographics';

// Interface for dropdown codes (maps from API InterdictionCode)
interface InterdictionTypeOption {
  code: string;
  description: string;
}

@Component({
  selector: 'app-interdiction-query',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatTableModule,
    MatMenuModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    OverlayModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    DonationsFilterPanelComponent,
    DonorsFilterPanelComponent,
    OtherHoldsPanelComponent,
    SearchBar,
    DonationsTabComponent,
    DonorsTabComponent,
    FilterChips,
    DonorDemographicsComponent
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: UppercaseMomentDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './interdiction-query.component.html',
  styleUrls: ['./interdiction-query.component.scss']
})
export class InterdictionQueryComponent implements OnInit, OnDestroy {
  @ViewChild('filterBtn', { read: ElementRef }) filterBtn!: ElementRef<HTMLElement>;
  @ViewChild('fromDateInput') fromDateInput?: ElementRef<HTMLInputElement>;
  @ViewChild('toDateInput') toDateInput?: ElementRef<HTMLInputElement>;
  @ViewChild('contentArea', { read: ElementRef }) contentArea?: ElementRef<HTMLElement>;

  private destroy$ = new Subject<void>();

  // Header configuration
  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
    actions: []
  };

  // Current user ID for access filtering
  currentUserId = signal<string>('');
  currentChapterId = signal<string>('');

  // Query Form
  queryForm!: FormGroup;
  availableCodes: InterdictionTypeOption[] = [];
  selectedCodeDescription = '';
  selectedInterType: { code: string; description: string } | undefined;

  // Code search for dropdown
  readonly codeSearchControl = new FormControl('');
  filteredCodesSignal = signal<InterdictionTypeOption[]>([]);

  // Max date for date pickers (chapter local date - no future dates allowed)
  // Uses computed to reactively update when chapter local date is loaded from API
  maxDate = computed<Moment>(() => {
    const chapterDate = this.chapterTimezoneService.chapterLocalDate();
    if (chapterDate && chapterDate.isValid()) {
      return chapterDate.clone().startOf('day');
    }
    // Fallback to system date if chapter date not yet loaded
    return moment().startOf('day');
  });

  // Date field validation
  private lastChangedDateField: 'from' | 'to' | null = null;

  fromDateErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control: FormControl | null): boolean => {
      if (!control) return false;
      // Show error immediately for futureDate, invalidDate, or parse errors
      // Only require touched/dirty for dateRangeInvalid
      const hasImmediateError = control.hasError('futureDate') ||
                                 control.hasError('invalidDate') ||
                                 control.hasError('matDatepickerParse');
      if (hasImmediateError) return true;
      return (control.touched || control.dirty) && !!this.getFromDateError();
    }
  };

  toDateErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control: FormControl | null): boolean => {
      if (!control) return false;
      // Show error immediately for futureDate, invalidDate, or parse errors
      // Only require touched/dirty for dateRangeInvalid
      const hasImmediateError = control.hasError('futureDate') ||
                                 control.hasError('invalidDate') ||
                                 control.hasError('matDatepickerParse');
      if (hasImmediateError) return true;
      return (control.touched || control.dirty) && !!this.getToDateError();
    }
  };

  // Tab management
  selectedTabIndex = signal<number>(0);
  currentTab = computed(() => this.selectedTabIndex() === 0 ? 'Donations' : 'Donors');

  // Data signals
  donationRecords = signal<DonationRecord[]>([]);
  donorRecords = signal<DonorRecord[]>([]);
  isLoading = signal<boolean>(false);
  hasQueried = signal<boolean>(false);
  queriedOptionType = signal<'Interdiction' | 'Hold'>('Interdiction');
  expandedRows = new Set<string>();

  // Filter states
  donationsFilter = signal<DonationsFilterValue | null>(null);
  donorsFilter = signal<DonorsFilterValue | null>(null);
  donationsFilterChips: FilterChip[] = [];
  donorsFilterChips: FilterChip[] = [];
  isFilterOpen = false;
  filterPanelMaxHeight = signal<number | null>(null);

  // Filter panel positions - exact match to lab-tests implementation
  filterPanelPositions: ConnectedPosition[] = [
    {
      originX: 'start',
      originY: 'bottom',
      overlayX: 'start',
      overlayY: 'top',
      offsetX: 0,
      offsetY: 4
    }
  ];

  // Other Holds Panel state
  isOtherHoldsPanelOpen = false;
  otherHoldsPanelData: OtherHoldsPanelData | null = null;

  // Donor Information (Demographics) side panel state
  isDonorInfoPanelOpen = signal(false);
  donorInfoPanelDonorId = signal('');

  // Track the row that should be highlighted (when side panel is open or action is happening)
  // This follows the same pattern as distribution-master-codes module
  highlightedDonationRow: DonationRecord | null = null;

  // Search - separate for Interdiction and Hold
  interdictionSearchText = signal<string>('');
  holdSearchText = signal<string>('');

  // Sorting
  currentSort: Sort | null = null;

  // Bottom navigation
  selectedDonorId = signal<string | null>(null);
  totalCount = computed(() =>
    this.currentTab() === 'Donations'
      ? this.filteredDonations().length
      : this.filteredDonors().length
  );

  // Filtered data (computed)
  // Note: Search filtering is primarily handled by API call in onSearch()
  // Note: showReleased filtering is handled server-side via API (removed client-side filtering)
  // Client-side filtering below acts as a defensive fallback in case API doesn't filter properly
  filteredDonations = computed(() => {
    let data = this.donationRecords();
    const filter = this.donationsFilter();

    // Apply donation type filter
    if (filter?.donationType) {
      data = data.filter(d => d.donationType === filter.donationType);
    }

    // showReleased filter removed - handled server-side by API
    // Server-side filtering is more efficient and matches Oracle Forms SQL-level filtering

    // Apply effective date filter
    if (filter?.effectiveDate && filter?.effectivePeriod) {
      const filterDate = new Date(filter.effectiveDate);
      data = data.filter(d => {
        if (!d.effectiveDate) return false;
        const effDate = new Date(d.effectiveDate);
        return filter.effectivePeriod === 'After'
          ? effDate >= filterDate
          : effDate <= filterDate;
      });
    }

    // Apply termination date filter
    if (filter?.terminationDate && filter?.terminationPeriod) {
      const filterDate = new Date(filter.terminationDate);
      data = data.filter(d => {
        if (!d.terminationDate) return false;
        const termDate = new Date(d.terminationDate);
        return filter.terminationPeriod === 'After'
          ? termDate >= filterDate
          : termDate <= filterDate;
      });
    }

    // Apply unit ID filter from filter panel (if exists)
    if (filter?.unitId) {
      data = data.filter(d => d.unitId.includes(filter.unitId!));
    }

    // Apply search text filter (defensive fallback for API filtering)
    // Check the appropriate search text based on queried option type
    const optionType = this.queriedOptionType();
    const searchText = optionType === 'Interdiction'
      ? this.interdictionSearchText()
      : this.holdSearchText();

    if (searchText && searchText.trim()) {
      const searchLower = searchText.trim().toLowerCase();
      data = data.filter(d =>
        d.unitId && d.unitId.toLowerCase().includes(searchLower)
      );
    }

    return data;
  });

  // Note: Search filtering is now handled by API call in onSearch()
  filteredDonors = computed(() => {
    let data = this.donorRecords();
    const filter = this.donorsFilter();

    // Apply Show Terminated filter
    if (filter?.showTerminated === false) {
      // Filter out terminated donors (those with a termination date)
      data = data.filter(d => !d.terminationDate || d.terminationDate === '');
    }

    return data;
  });

  // Table columns for Donations tab
  donationsColumns: string[] = [
    'expand',
    'unitId',
    'collectionDate',
    'donationType',
    'procedureCode',
    'interdiction',
    'effectiveDate',
    'terminationDate',
    'releaseDate',
    'releaseUser',
    'origin',
    'reason'
  ];

  // Table columns for Donors tab
  donorsColumns: string[] = [
    'unitId',
    'collectionDate',
    'driveId',
    'effectiveDate',
    'terminationDate',
    'actions'
  ];

  constructor(
    private fb: FormBuilder,
    private interdictionQueryService: InterdictionQueryService,
    private loginService: LoginService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private pageHeaderService: PageHeaderService,
    private headerService: HeaderService,
    private router: Router,
    private chapterTimezoneService: ChapterTimezoneService
  ) {
    this.initQueryForm();

    // Update header config from menu-items API response
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        const navigation = this.router.getCurrentNavigation();
        const state = navigation?.extras?.state || window.history.state;
        const breadcrumbs = state?.['fromDonorDetailQuery']
          ? [
              { label: 'Home', link: '/home' },
              { label: 'Donor Detail Query', link: '/donor-functions/donor-profile/donor-detail-query' },
              { label: pageData.title, link: null }
            ]
          : [
              { label: 'Home', link: '/home' },
              { label: pageData.title, link: null }
            ];
        this.headerConfig = {
          ...this.headerConfig,
          breadcrumbs,
          title: pageData.title,
          subtitle: pageData.subtitle || 'View and manage unit and donor restrictions across interdiction and hold records'
        };
      }
    });
  }

  ngOnInit(): void {
    // Get user ID from cookies
    const userId = this.loginService.getStoredUsername();
    if (userId) {
      this.currentUserId.set(userId);
    }

    // Get chapter ID from header service
    const chapterId = this.headerService.getCurrentChapterId();
    if (chapterId) {
      this.currentChapterId.set(chapterId);
    }

    this.subscribeToChapterChanges();
    this.subscribeToOptionChanges();
    this.subscribeToCodeChanges();
    this.setupCodeSearch();
    this.setupDateValidation();

    // Load codes only when user selects an option (not on initial load)
    const initialOption = this.queryForm.get('option')?.value;
    if (initialOption === 'Interdiction' || initialOption === 'Hold') {
      this.loadCodesForOption(initialOption);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initQueryForm(): void {
    this.queryForm = this.fb.group({
      option: ['', [Validators.required]],
      code: [null, [Validators.required]],
      operation: ['-'],
      fromCollectionDate: [null, [this.noFutureDateValidator()]],
      toCollectionDate: [null, [this.noFutureDateValidator()]],
      multipleCodes: [[]], // Array of selected codes for MULTI mode
      multipleOperation: ['OR'] // AND/OR for multiple codes
    }, {
      validators: [
        DateFieldValidationUtility.fromToDateRangeValidator('fromCollectionDate', 'toCollectionDate'),
        this.interdictionCodeValidator()
      ]
    });
  }

  /**
   * Custom validator to ensure either code or multipleCodes is set based on operation
   */
  private interdictionCodeValidator() {
    return (group: FormGroup): { [key: string]: any } | null => {
      const operation = group.get('operation')?.value;
      const multipleCodes = group.get('multipleCodes')?.value || [];

      // If in ADD mode, at least one code must be selected in multipleCodes
      if (operation === 'ADD' && multipleCodes.length === 0) {
        return { multipleCodesRequired: true };
      }

      // If not in ADD mode, code field must be set (handled by field-level validator)
      return null;
    };
  }

  /**
   * Custom validator to prevent future dates
   * Uses chapter local date for validation
   */
  private noFutureDateValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null; // Dates are optional
      }

      const selectedDate = moment.isMoment(control.value) ? control.value : moment(control.value);

      // Check if date is valid
      if (!selectedDate.isValid()) {
        return null; // Let other validators handle invalid dates
      }

      // Get max allowed date (chapter local date)
      const maxAllowed = this.maxDate();

      // Check if selected date is after the max allowed date
      if (selectedDate.isAfter(maxAllowed, 'day')) {
        return { futureDate: true };
      }

      return null;
    };
  }

  /**
   * Setup date field validation tracking
   * Dates are optional - only validate when provided
   */
  private setupDateValidation(): void {
    // Track which date field was last changed for cross-field error display
    this.queryForm.get('fromCollectionDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'from';
        this.queryForm.get('toCollectionDate')?.updateValueAndValidity({ emitEvent: false });
        this.validateFromDateInput();
      });

    this.queryForm.get('toCollectionDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'to';
        this.validateToDateInput();
      });
  }




  /**
   * Handle From Collection Date blur
   * Validates input and parses manual entry
   */
  onFromDateBlur(): void {
    setTimeout(() => {
      const control = this.queryForm.get('fromCollectionDate');
      const inputElement = this.fromDateInput?.nativeElement;
      const inputValue = inputElement?.value?.trim() || '';

      // Mark as touched to ensure error state is displayed
      control?.markAsTouched();

      // If there's input text but no parsed value, try to manually parse it
      if (inputValue && !control?.value) {
        const formats = Array.isArray(DD_MON_YYYY_FORMATS.parse.dateInput)
          ? DD_MON_YYYY_FORMATS.parse.dateInput
          : [DD_MON_YYYY_FORMATS.parse.dateInput];

        const dateAdapter = this.queryForm.get('fromCollectionDate')?.parent?.get('fromCollectionDate')?.parent
          ? (this.queryForm.get('fromCollectionDate') as any)._dateAdapter
          : null;

        if (dateAdapter) {
          const parsed = dateAdapter.parse(inputValue, formats);

          if (parsed && moment.isMoment(parsed) && parsed.isValid()) {
            // Successfully parsed - set the value and let the validator handle validation
            control?.setValue(parsed);
            if (inputElement) {
              inputElement.value = moment(parsed).format('DD-MMM-YYYY').toUpperCase();
            }
          }
        }
      }

      this.validateFromDateInput();
      this.lastChangedDateField = 'from';
      control?.updateValueAndValidity();
      // Trigger form-level validators (dateRangeInvalid)
      this.queryForm.updateValueAndValidity({ emitEvent: false });
    }, 0);
  }

  /**
   * Handle To Collection Date blur
   * Validates input and parses manual entry
   */
  onToDateBlur(): void {
    setTimeout(() => {
      const control = this.queryForm.get('toCollectionDate');
      const inputElement = this.toDateInput?.nativeElement;
      const inputValue = inputElement?.value?.trim() || '';

      // Mark as touched to ensure error state is displayed
      control?.markAsTouched();

      // If there's input text but no parsed value, try to manually parse it
      if (inputValue && !control?.value) {
        const formats = Array.isArray(DD_MON_YYYY_FORMATS.parse.dateInput)
          ? DD_MON_YYYY_FORMATS.parse.dateInput
          : [DD_MON_YYYY_FORMATS.parse.dateInput];

        const dateAdapter = this.queryForm.get('toCollectionDate')?.parent?.get('toCollectionDate')?.parent
          ? (this.queryForm.get('toCollectionDate') as any)._dateAdapter
          : null;

        if (dateAdapter) {
          const parsed = dateAdapter.parse(inputValue, formats);

          if (parsed && moment.isMoment(parsed) && parsed.isValid()) {
            // Successfully parsed - set the value and let the validator handle validation
            control?.setValue(parsed);
            if (inputElement) {
              inputElement.value = moment(parsed).format('DD-MMM-YYYY').toUpperCase();
            }
          }
        }
      }

      this.validateToDateInput();
      this.lastChangedDateField = 'to';
      control?.updateValueAndValidity();
      // Trigger form-level validators (dateRangeInvalid)
      this.queryForm.updateValueAndValidity({ emitEvent: false });
    }, 0);
  }

  /**
   * Validate From Collection Date input
   */
  private validateFromDateInput(): void {
    const control = this.queryForm.get('fromCollectionDate');
    const inputElement = this.fromDateInput?.nativeElement;
    const inputValue = inputElement?.value?.trim() || '';

    if (inputValue && !control?.value && control) {
      // Set custom error when input has text but value is null (invalid date)
      // But don't override futureDate error if it's already set
      if (!control.hasError('futureDate')) {
        const currentErrors = control.errors || {};
        control.setErrors({ ...currentErrors, invalidDate: true });
      }
    } else if (control?.hasError('invalidDate') && (!inputValue || control?.value)) {
      // Clear custom error if input is empty or has valid value
      const errors = { ...control.errors };
      delete errors['invalidDate'];
      control.setErrors(Object.keys(errors).length > 0 ? errors : null);
    }
  }

  /**
   * Validate To Collection Date input
   */
  private validateToDateInput(): void {
    const control = this.queryForm.get('toCollectionDate');
    const inputElement = this.toDateInput?.nativeElement;
    const inputValue = inputElement?.value?.trim() || '';

    if (inputValue && !control?.value && control) {
      // Set custom error when input has text but value is null (invalid date)
      // But don't override futureDate error if it's already set
      if (!control.hasError('futureDate')) {
        const currentErrors = control.errors || {};
        control.setErrors({ ...currentErrors, invalidDate: true });
      }
    } else if (control?.hasError('invalidDate') && (!inputValue || control?.value)) {
      // Clear custom error if input is empty or has valid value
      const errors = { ...control.errors };
      delete errors['invalidDate'];
      control.setErrors(Object.keys(errors).length > 0 ? errors : null);
    }
  }

  /**
   * Get error message for From Collection Date
   */
  getFromDateError(): string {
    const control = this.queryForm.get('fromCollectionDate');
    if (!control) return '';

    // Priority 1: Check for future date error
    if (control.hasError('futureDate')) {
      return 'From Collection Date cannot be a future date';
    }

    // Priority 2: Check for custom invalid date error
    if (control.hasError('invalidDate')) {
      return 'From Collection Date is invalid';
    }

    // Priority 3: Check for parse errors
    if (control.hasError('matDatepickerParse')) {
      return 'From Collection Date is invalid';
    }

    // Check if the native input has text but control value is null
    const inputElement = this.fromDateInput?.nativeElement;
    const hasInputValue = inputElement && inputElement.value && inputElement.value.trim() !== '';
    if (hasInputValue && !control.value) {
      return 'From Collection Date is invalid';
    }

    // Priority 4: Check other validation errors (only if touched/dirty)
    if (!(control.touched || control.dirty)) {
      return '';
    }

    // Show dateRangeInvalid on from date when it was the last changed field
    if (this.lastChangedDateField === 'from' && this.queryForm.errors?.['dateRangeInvalid']) {
      return 'From Collection Date must be on or before To Collection Date';
    }

    return '';
  }

  /**
   * Get error message for To Collection Date
   */
  getToDateError(): string {
    const control = this.queryForm.get('toCollectionDate');
    if (!control) return '';

    // Priority 1: Check for future date error
    if (control.hasError('futureDate')) {
      return 'To Collection Date cannot be a future date';
    }

    // Priority 2: Check for custom invalid date error
    if (control.hasError('invalidDate')) {
      return 'To Collection Date is invalid';
    }

    // Priority 3: Check for parse errors
    if (control.hasError('matDatepickerParse')) {
      return 'To Collection Date is invalid';
    }

    // Check if the native input has text but control value is null
    const inputElement = this.toDateInput?.nativeElement;
    const hasInputValue = inputElement && inputElement.value && inputElement.value.trim() !== '';
    if (hasInputValue && !control.value) {
      return 'To Collection Date is invalid';
    }

    // Priority 4: Check other validation errors (only if touched/dirty)
    if (!(control.touched || control.dirty)) {
      return '';
    }

    if (this.lastChangedDateField !== 'from') {
      if (this.queryForm.errors?.['dateRangeInvalid']) {
        return 'To Collection Date must be on or after From Collection Date';
      }
    }

    return '';
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.resetComponent();
      });
  }

  private subscribeToOptionChanges(): void {
    this.queryForm.get('option')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((optionType: string) => {
        // Clear everything when option changes
        this.queryForm.patchValue({
          code: null,
          operation: '-',
          fromCollectionDate: null,
          toCollectionDate: null,
          multipleCodes: [],
          multipleOperation: 'OR'
        }, { emitEvent: false });

        this.selectedCodeDescription = '';
        this.selectedInterType = undefined;

        // Reset code search
        this.codeSearchControl.setValue('', { emitEvent: false });

        // Update code validators: required only for Hold, not for Interdiction
        const codeControl = this.queryForm.get('code');
        if (optionType === 'Interdiction') {
          codeControl?.clearValidators();
        } else {
          codeControl?.setValidators([Validators.required]);
        }
        codeControl?.updateValueAndValidity({ emitEvent: false });

        // Clear data tables and filters
        this.donationRecords.set([]);
        this.donorRecords.set([]);
        this.hasQueried.set(false);
        this.donationsFilter.set(null);
        this.donorsFilter.set(null);
        this.donationsFilterChips = [];
        this.donorsFilterChips = [];
        this.interdictionSearchText.set('');
        this.holdSearchText.set('');

        // Load codes only when a valid option is selected
        if (optionType === 'Interdiction' || optionType === 'Hold') {
          this.loadCodesForOption(optionType);
        } else {
          this.availableCodes = [];
          this.filteredCodesSignal.set([]);
        }
      });
  }

  private loadCodesForOption(optionType: 'Interdiction' | 'Hold'): void {
    // Call the API with the option parameter to get filtered codes
    this.interdictionQueryService.getInterdictionCodes(optionType)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (codes: InterdictionCode[]) => {
          // Map API response to component interface
          this.availableCodes = codes.map((item: InterdictionCode) => ({
            code: item.code,
            description: item.description
          }));

          // Initialize filtered codes signal with all codes
          this.filteredCodesSignal.set(this.availableCodes);

          if (this.availableCodes.length === 0) {
            this.showInfoMessage(`No ${optionType} codes available`);
          }
        },
        error: () => {
          this.availableCodes = [];
          this.filteredCodesSignal.set([]);
          this.showErrorMessage(`Failed to load ${optionType} codes`);
        }
      });
  }

  /**
   * Setup code search - filters codes as user types
   * Searches in both code and description fields
   */
  private setupCodeSearch(): void {
    this.codeSearchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(search => {
        if (!search || search.trim() === '') {
          this.filteredCodesSignal.set(this.availableCodes);
        } else {
          const searchLower = search.toLowerCase();
          const filtered = this.availableCodes.filter(c =>
            (c.code && c.code.toLowerCase().includes(searchLower)) ||
            (c.description && c.description.toLowerCase().includes(searchLower))
          );
          this.filteredCodesSignal.set(filtered);
        }
      });
  }

  /**
   * Format code display for dropdown
   * Shows "code - description" if description exists, otherwise just "code"
   */
  formatCodeDisplay(code: InterdictionTypeOption): string {
    if (code.description && code.description.trim()) {
      return `${code.code} - ${code.description}`;
    }
    return code.code;
  }

  private subscribeToCodeChanges(): void {
    this.queryForm.get('code')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((code: string) => {
        // Only update description for single-select mode
        // In multiselect mode (operation === 'ADD'), preserve the multiselect description
        const operation = this.queryForm.get('operation')?.value;
        if (operation !== 'ADD') {
          const selected = this.availableCodes.find(c => c.code === code);
          this.selectedCodeDescription = selected?.description || '';
        }
      });

    // Watch operation changes to clear multiple codes when switching away from ADD
    this.queryForm.get('operation')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((operation: string) => {
        const codeControl = this.queryForm.get('code');

        if (operation === 'ADD') {
          // In multi-select mode: code field is not required
          codeControl?.clearValidators();
          codeControl?.updateValueAndValidity({ emitEvent: false });
        } else {
          // In single-select mode: code is required only for Hold, not for Interdiction
          const optionValue = this.queryForm.get('option')?.value;
          if (optionValue === 'Hold') {
            codeControl?.setValidators([Validators.required]);
          } else {
            codeControl?.clearValidators();
          }
          codeControl?.updateValueAndValidity({ emitEvent: false });

          // Clear multiple codes selection when not in ADD mode
          this.queryForm.patchValue({
            multipleCodes: [],
            multipleOperation: 'OR'
          }, { emitEvent: false });

          // Reset description to single code description
          const code = this.queryForm.get('code')?.value;
          if (code) {
            const selected = this.availableCodes.find(c => c.code === code);
            this.selectedCodeDescription = selected?.description || '';
          } else {
            this.selectedCodeDescription = '';
            this.selectedInterType = undefined;
          }
        }
      });
  }

  private resetComponent(): void {
    this.queryForm.reset({
      option: '',
      operation: '-',
      multipleCodes: [],
      multipleOperation: 'OR',
      fromCollectionDate: null,
      toCollectionDate: null
    });
    this.selectedCodeDescription = '';
    this.selectedInterType = undefined;
    this.codeSearchControl.setValue('', { emitEvent: false });
    this.donationRecords.set([]);
    this.donorRecords.set([]);
    this.hasQueried.set(false);
    this.queriedOptionType.set('Interdiction');
    this.expandedRows.clear();
    this.donationsFilter.set(null);
    this.donorsFilter.set(null);
    this.donationsFilterChips = [];
    this.donorsFilterChips = [];
    this.interdictionSearchText.set('');
    this.holdSearchText.set('');
    this.currentSort = null;
  }

  onRetrieve(): void {
    if (this.queryForm.invalid) {
      this.showErrorMessage(`Error ${VALIDATION_MESSAGES.REQUIRED_FIELD}: Please fill in all required fields`);
      return;
    }

    // Validate dates before proceeding
    if (!this.validateDates()) {
      return;
    }

    const userId = this.currentUserId();
    const chapterId = this.currentChapterId();

    if (!userId || !chapterId) {
      this.showErrorMessage('User ID or Chapter ID not available');
      return;
    }

    const formValue = this.queryForm.value;

    // Store the option type that was used for this query
    const optionType = formValue.option as 'Interdiction' | 'Hold';
    this.queriedOptionType.set(optionType);

    // Check if multiple codes are selected
    const hasMultipleCodes = formValue.operation === 'ADD' &&
                             formValue.multipleCodes &&
                             formValue.multipleCodes.length > 0;

    // Map sort direction: 'asc' → 'ASC', 'desc' → 'DESC', '' → undefined
    const sortColumn = this.currentSort?.direction ? this.currentSort.active : undefined;
    const sortDirection = this.currentSort?.direction ? this.currentSort.direction.toUpperCase() : undefined;

    // Apply default date range if not provided (matches Oracle Forms SET_DEFAULT_VALUES procedure)
    // This prevents full table scans by ensuring date filters are always present
    // Use chapter local date instead of system date
    const chapterToday = this.chapterTimezoneService.getChapterLocalDate();
    let fromDate = formValue.fromCollectionDate;
    let toDate = formValue.toCollectionDate;
    let datesCalculated = false;

    if (!fromDate && !toDate) {
      // Both null: default to 3-day window (chapter_date-3 to chapter_date)
      fromDate = chapterToday.clone().subtract(3, 'days').startOf('day');
      toDate = chapterToday.clone().startOf('day');
      datesCalculated = true;
    } else if (toDate && !fromDate) {
      // To provided, From null: set From = To - 3
      fromDate = moment(toDate).subtract(3, 'days').startOf('day');
      datesCalculated = true;
    } else if (fromDate && !toDate) {
      // From provided, To null: set To = min(From + 3, chapter_date)
      const calculatedTo = moment(fromDate).add(3, 'days').startOf('day');
      toDate = calculatedTo.isAfter(chapterToday) ? chapterToday.clone() : calculatedTo;
      datesCalculated = true;
    }

    // Update form with calculated dates so subsequent operations (filter/search/sort) use them
    if (datesCalculated) {
      this.queryForm.patchValue({
        fromCollectionDate: fromDate,
        toCollectionDate: toDate
      }, { emitEvent: false });
    }

    const filter = this.donationsFilter();
    // Use the appropriate search text based on option type
    const searchText = optionType === 'Interdiction' ? this.interdictionSearchText() : this.holdSearchText();

    const apiParams: ApiInterdictionQueryParams = {
      option: formValue.option,
      // Always send interCodes as array, even for single value
      interCodes: hasMultipleCodes ? formValue.multipleCodes : (formValue.code ? [formValue.code] : undefined),
      // Only send operator when there are actually multiple codes
      interCodesOperator: hasMultipleCodes ? (formValue.multipleOperation || 'OR') : undefined,
      fromDate: this.formatDateForAPI(fromDate),
      toDate: this.formatDateForAPI(toDate),
      donationType: filter?.donationType || undefined,
      unitId: searchText || undefined,
      // For Interdictions: send showReleased, For Holds: send showTerminated
      showReleased: optionType === 'Interdiction' && (filter?.showReleased !== null && filter?.showReleased !== undefined) ? filter.showReleased : undefined,
      showTerminated: optionType === 'Hold' && (filter?.showReleased !== null && filter?.showReleased !== undefined) ? filter.showReleased : undefined,
      effDateFilter: filter?.effectiveDate ? this.formatDateForAPI(filter.effectiveDate) : undefined,
      effDatePeriod: filter?.effectivePeriod || undefined,
      termDateFilter: filter?.terminationDate ? this.formatDateForAPI(filter.terminationDate) : undefined,
      termDatePeriod: filter?.terminationPeriod || undefined,
      sortColumn: sortColumn,
      sortDirection: sortDirection,
      chapterId,
      userId
    };

    this.isLoading.set(true);

    // Determine which query to run based on current tab
    const queryMethod = this.currentTab() === 'Donations'
      ? this.interdictionQueryService.queryInterdictions(apiParams)
      : this.interdictionQueryService.queryDonorInterdictions(apiParams);

    queryMethod
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: InterdictionQueryResponse) => {
          this.isLoading.set(false);

          if (response.success) {
            const results = response.results || [];
            const totalRecords = response.totalRecords || 0;

            // Map results based on current tab
            if (this.currentTab() === 'Donations') {
              const donationRecords: DonationRecord[] = results.map(r => ({
                transactionId: r.transactionId || '',
                unitId: r.displayUnitId || r.unitId || '',
                collectionDate: r.collDate ? this.formatDateForDisplay(r.collDate) : '',
                driveId: r.driveId || '',
                donationType: r.donationType || '',
                procedureCode: r.procedureCode || '',
                interdiction: r.interCode || '',
                effectiveDate: r.effDate ? this.formatDateForDisplay(r.effDate) : '',
                terminationDate: r.termDate ? this.formatDateForDisplay(r.termDate) : '',
                releaseDate: r.releaseDate ? this.formatDateForDisplay(r.releaseDate) : '',
                releaseUser: r.releaseUser || '',
                origin: r.originatedFrom || '',
                reason: r.reasonCode || '',
                interdictionType: r.interType || '',
                interdictionCustody: this.mapSourceToCustody(r.source),
                donorId: r.donorId || '',
                name: r.donorName || '',
                dateOfBirth: r.dateOfBirth ? this.formatDateForDisplay(r.dateOfBirth) : '',
                gender: r.gender || ''
              }));
              this.donationRecords.set(donationRecords);
            } else {
              const donorRecords: DonorRecord[] = results.map(r => ({
                transactionId: r.transactionId || '',
                unitId: r.displayUnitId || r.unitId || '',
                collectionDate: r.collDate ? this.formatDateForDisplay(r.collDate) : '',
                driveId: r.driveId || '',
                effectiveDate: r.effDate ? this.formatDateForDisplay(r.effDate) : '',
                terminationDate: r.termDate ? this.formatDateForDisplay(r.termDate) : '',
                donorId: r.donorId || '',
                interdictionCode: r.interCode || ''
              }));
              this.donorRecords.set(donorRecords);
            }

            this.hasQueried.set(true);

            if (totalRecords > 700) {
              this.showErrorMessage(VALIDATION_MESSAGES.TOO_MANY_RESULTS);
            }
            // Success case - no notification needed
          }
        }
      });
  }

  onAddInterdictions(): void {
    // Get current values from form
    const currentMultipleOperation = this.queryForm.get('multipleOperation')?.value || 'OR';
    const currentCodes = this.queryForm.get('multipleCodes')?.value || [];

    const dialogData: MultiSelectInterdictionsDialogData = {
      mode: currentMultipleOperation,
      selectedCodes: currentCodes,
      selectedInterType: this.selectedInterType
    };

    const dialogRef = this.dialog.open(MultiSelectInterdictionsDialogComponent, {
      width: '900px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      disableClose: true,
      position: { right: '0', top: '64px' },
      panelClass: 'multi-select-interdictions-drawer',
      hasBackdrop: true,
      backdropClass: 'multi-select-interdictions-backdrop',
      autoFocus: false,
      ariaLabelledBy: 'multi-select-panel-title',
      data: dialogData,
    });

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe((result: MultiSelectInterdictionsDialogResult) => {
      if (result && result.success && result.selectedCodes) {
        // Update form with selected codes
        // Step 1: Set operation to 'ADD' first (triggers valueChanges which clears code validators)
        this.queryForm.patchValue({
          operation: 'ADD'
        });

        // Step 2: Store selected inter type and update description
        this.selectedInterType = result.selectedInterType;
        this.selectedCodeDescription = `${result.selectedCodes.length} codes selected (${result.logicalOperation}): ${result.displayString}`;

        // Step 3: Set the rest of the values including clearing code
        this.queryForm.patchValue({
          code: null,
          multipleCodes: result.selectedCodes,
          multipleOperation: result.logicalOperation
        });

        // Success - no notification needed
      }
    });
  }

  onTabChange(index: number): void {
    this.selectedTabIndex.set(index);
    // Note: Don't clear search text when switching tabs - each option maintains its own search

    // Close filter panel when switching tabs
    this.closeFilterPanel();
  }

  toggleRow(unitId: string): void {
    if (this.expandedRows.has(unitId)) {
      this.expandedRows.delete(unitId);
    } else {
      this.expandedRows.add(unitId);
    }
  }

  isRowExpanded(unitId: string): boolean {
    return this.expandedRows.has(unitId);
  }

  expandAllRows(): void {
    const donations = this.filteredDonations();
    donations.forEach(donation => {
      this.expandedRows.add(donation.unitId);
    });
  }

  collapseAllRows(): void {
    this.expandedRows.clear();
  }

  onSearch(searchTerm: string): void {
    // Set the appropriate search text based on the queried option type
    const optionType = this.queriedOptionType();
    if (optionType === 'Interdiction') {
      this.interdictionSearchText.set(searchTerm);
    } else {
      this.holdSearchText.set(searchTerm);
    }

    // Only call API if we have already queried once
    if (!this.hasQueried()) {
      return;
    }

    // Call API with or without search term
    const userId = this.currentUserId();
    const chapterId = this.currentChapterId();

    if (!userId || !chapterId) {
      return;
    }

    const formValue = this.queryForm.value;
    const hasMultipleCodes = formValue.operation === 'ADD' &&
                             formValue.multipleCodes &&
                             formValue.multipleCodes.length > 0;

    // Map sort direction: 'asc' → 'ASC', 'desc' → 'DESC', '' → undefined
    const sortColumn = this.currentSort?.direction ? this.currentSort.active : undefined;
    const sortDirection = this.currentSort?.direction ? this.currentSort.direction.toUpperCase() : undefined;

    // Get filter values if they exist
    const filter = this.donationsFilter();

    const apiParams: ApiInterdictionQueryParams = {
      option: formValue.option,
      // Always send interCodes as array, even for single value
      interCodes: hasMultipleCodes ? formValue.multipleCodes : (formValue.code ? [formValue.code] : undefined),
      // Only send operator when there are actually multiple codes
      interCodesOperator: hasMultipleCodes ? (formValue.multipleOperation || 'OR') : undefined,
      fromDate: formValue.fromCollectionDate ? this.formatDateForAPI(formValue.fromCollectionDate) : undefined,
      toDate: formValue.toCollectionDate ? this.formatDateForAPI(formValue.toCollectionDate) : undefined,
      donationType: filter?.donationType || undefined,
      unitId: searchTerm.trim() || undefined,
      // For Interdictions: send showReleased, For Holds: send showTerminated
      showReleased: optionType === 'Interdiction' && (filter?.showReleased !== null && filter?.showReleased !== undefined) ? filter.showReleased : undefined,
      showTerminated: optionType === 'Hold' && (filter?.showReleased !== null && filter?.showReleased !== undefined) ? filter.showReleased : undefined,
      effDateFilter: filter?.effectiveDate ? this.formatDateForAPI(filter.effectiveDate) : undefined,
      effDatePeriod: filter?.effectivePeriod || undefined,
      termDateFilter: filter?.terminationDate ? this.formatDateForAPI(filter.terminationDate) : undefined,
      termDatePeriod: filter?.terminationPeriod || undefined,
      sortColumn: sortColumn,
      sortDirection: sortDirection,
      chapterId,
      userId
    };

    this.isLoading.set(true);

    this.interdictionQueryService.queryInterdictions(apiParams)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: InterdictionQueryResponse) => {
          this.isLoading.set(false);

          if (response.success) {
            const results = response.results || [];
            const totalRecords = response.totalRecords || 0;

            const donationRecords: DonationRecord[] = results.map(r => ({
              transactionId: r.transactionId || '',
              unitId: r.displayUnitId || r.unitId || '',
              collectionDate: r.collDate ? this.formatDateForDisplay(r.collDate) : '',
              driveId: r.driveId || '',
              donationType: r.donationType || '',
              procedureCode: r.procedureCode || '',
              interdiction: r.interCode || '',
              effectiveDate: r.effDate ? this.formatDateForDisplay(r.effDate) : '',
              terminationDate: r.termDate ? this.formatDateForDisplay(r.termDate) : '',
              releaseDate: r.releaseDate ? this.formatDateForDisplay(r.releaseDate) : '',
              releaseUser: r.releaseUser || '',
              origin: r.originatedFrom || '',
              reason: r.reasonCode || '',
              interdictionType: r.interType || '',
              interdictionCustody: this.mapSourceToCustody(r.source),
              donorId: r.donorId || '',
              name: r.donorName || '',
              dateOfBirth: r.dateOfBirth ? this.formatDateForDisplay(r.dateOfBirth) : '',
              gender: r.gender || ''
            }));

            this.donationRecords.set(donationRecords);

            // No notification needed for search results
          }
        }
      });
  }

  onDonationsSort(sort: Sort): void {
    // Store current sort state
    this.currentSort = sort;

    // Only call API if we have already queried once
    if (!this.hasQueried()) {
      return;
    }

    // Re-query with sort parameters
    const userId = this.currentUserId();
    const chapterId = this.currentChapterId();

    if (!userId || !chapterId) {
      return;
    }

    const formValue = this.queryForm.value;
    const hasMultipleCodes = formValue.operation === 'ADD' &&
                             formValue.multipleCodes &&
                             formValue.multipleCodes.length > 0;

    // Map MatSort direction: 'asc' → 'ASC', 'desc' → 'DESC', '' → undefined
    const sortColumn = sort.direction ? sort.active : undefined;
    const sortDirection = sort.direction ? sort.direction.toUpperCase() : undefined;

    // Get filter values if they exist
    const filter = this.donationsFilter();
    // Use the appropriate search text based on queried option type
    const optionType = this.queriedOptionType();
    const searchText = optionType === 'Interdiction' ? this.interdictionSearchText() : this.holdSearchText();

    const apiParams: ApiInterdictionQueryParams = {
      option: formValue.option,
      // Always send interCodes as array, even for single value
      interCodes: hasMultipleCodes ? formValue.multipleCodes : (formValue.code ? [formValue.code] : undefined),
      // Only send operator when there are actually multiple codes
      interCodesOperator: hasMultipleCodes ? (formValue.multipleOperation || 'OR') : undefined,
      fromDate: formValue.fromCollectionDate ? this.formatDateForAPI(formValue.fromCollectionDate) : undefined,
      toDate: formValue.toCollectionDate ? this.formatDateForAPI(formValue.toCollectionDate) : undefined,
      donationType: filter?.donationType || undefined,
      unitId: searchText || undefined,
      // For Interdictions: send showReleased, For Holds: send showTerminated
      showReleased: optionType === 'Interdiction' && (filter?.showReleased !== null && filter?.showReleased !== undefined) ? filter.showReleased : undefined,
      showTerminated: optionType === 'Hold' && (filter?.showReleased !== null && filter?.showReleased !== undefined) ? filter.showReleased : undefined,
      effDateFilter: filter?.effectiveDate ? this.formatDateForAPI(filter.effectiveDate) : undefined,
      effDatePeriod: filter?.effectivePeriod || undefined,
      termDateFilter: filter?.terminationDate ? this.formatDateForAPI(filter.terminationDate) : undefined,
      termDatePeriod: filter?.terminationPeriod || undefined,
      sortColumn: sortColumn,
      sortDirection: sortDirection,
      chapterId,
      userId
    };

    this.isLoading.set(true);

    this.interdictionQueryService.queryInterdictions(apiParams)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: InterdictionQueryResponse) => {
          this.isLoading.set(false);

          if (response.success) {
            const results = response.results || [];

            const donationRecords: DonationRecord[] = results.map(r => ({
              transactionId: r.transactionId || '',
              unitId: r.displayUnitId || r.unitId || '',
              collectionDate: r.collDate ? this.formatDateForDisplay(r.collDate) : '',
              driveId: r.driveId || '',
              donationType: r.donationType || '',
              procedureCode: r.procedureCode || '',
              interdiction: r.interCode || '',
              effectiveDate: r.effDate ? this.formatDateForDisplay(r.effDate) : '',
              terminationDate: r.termDate ? this.formatDateForDisplay(r.termDate) : '',
              releaseDate: r.releaseDate ? this.formatDateForDisplay(r.releaseDate) : '',
              releaseUser: r.releaseUser || '',
              origin: r.originatedFrom || '',
              reason: r.reasonCode || '',
              interdictionType: r.interType || '',
              interdictionCustody: this.mapSourceToCustody(r.source),
              donorId: r.donorId || '',
              name: r.donorName || '',
              dateOfBirth: r.dateOfBirth ? this.formatDateForDisplay(r.dateOfBirth) : '',
              gender: r.gender || ''
            }));

            this.donationRecords.set(donationRecords);
          }
        }
      });
  }

  toggleFilterPanel(): void {
    this.isFilterOpen = !this.isFilterOpen;

    // Calculate filter panel max height when opening
    if (this.isFilterOpen) {
      const maxHeight = this.calculateFilterPanelMaxHeight();
      this.filterPanelMaxHeight.set(maxHeight);
    }
  }

  /**
   * Calculate maximum height for filter panel based on available space above footer
   * Allows panel to cover the filter button and extend to full content area height
   */
  private calculateFilterPanelMaxHeight(): number | null {
    if (!this.contentArea?.nativeElement) {
      return null;
    }

    const contentAreaRect = this.contentArea.nativeElement.getBoundingClientRect();

    // Check for bottom navigation (Donors tab) or app footer
    const bottomNavElement = document.querySelector('.bottom-navigation') as HTMLElement;
    const footerElement = document.querySelector('app-footer') as HTMLElement;

    let bottomBoundary: number;

    if (bottomNavElement && getComputedStyle(bottomNavElement).display !== 'none') {
      // If bottom navigation is visible, use its top position
      bottomBoundary = bottomNavElement.getBoundingClientRect().top;
    } else if (footerElement) {
      // Otherwise use footer top position
      bottomBoundary = footerElement.getBoundingClientRect().top;
    } else {
      // Fallback to viewport height if no footer found
      bottomBoundary = window.innerHeight;
    }

    // Calculate available height: from content area top to bottom boundary
    // This gives maximum height and allows panel to cover filter button and search section
    const filterSearchSection = document.querySelector('.filter-search-section');
    const topPosition = filterSearchSection
      ? filterSearchSection.getBoundingClientRect().top
      : contentAreaRect.top;

    const availableHeight = bottomBoundary - topPosition - 4; // 4px margin from bottom

    // Return minimum of 250px to ensure usability
    return Math.max(250, availableHeight);
  }

  closeFilterPanel(): void {
    this.isFilterOpen = false;
    // Remove focus from filter button
    if (this.filterBtn?.nativeElement) {
      this.filterBtn.nativeElement.blur();
    }
  }

  applyDonationsFilters(filters: DonationsFilterValue): void {
    this.donationsFilter.set(filters);
    const currentOptionType = this.queryForm.value.option as 'Interdiction' | 'Hold';
    this.donationsFilterChips = InterdictionQueryFilterChipsUtils.convertDonationsFiltersToChips(filters, currentOptionType);
    this.closeFilterPanel();

    // Call API with new filter parameters
    if (!this.hasQueried()) {
      return;
    }

    const userId = this.currentUserId();
    const chapterId = this.currentChapterId();

    if (!userId || !chapterId) {
      return;
    }

    const formValue = this.queryForm.value;
    const hasMultipleCodes = formValue.operation === 'ADD' &&
                             formValue.multipleCodes &&
                             formValue.multipleCodes.length > 0;

    const sortColumn = this.currentSort?.direction ? this.currentSort.active : undefined;
    const sortDirection = this.currentSort?.direction ? this.currentSort.direction.toUpperCase() : undefined;

    // Use the appropriate search text based on queried option type
    const queriedOption = this.queriedOptionType();
    const searchText = queriedOption === 'Interdiction' ? this.interdictionSearchText() : this.holdSearchText();

    const apiParams: ApiInterdictionQueryParams = {
      option: formValue.option,
      // Always send interCodes as array, even for single value
      interCodes: hasMultipleCodes ? formValue.multipleCodes : (formValue.code ? [formValue.code] : undefined),
      // Only send operator when there are actually multiple codes
      interCodesOperator: hasMultipleCodes ? (formValue.multipleOperation || 'OR') : undefined,
      fromDate: formValue.fromCollectionDate ? this.formatDateForAPI(formValue.fromCollectionDate) : undefined,
      toDate: formValue.toCollectionDate ? this.formatDateForAPI(formValue.toCollectionDate) : undefined,
      donationType: filters.donationType || undefined,
      unitId: searchText || filters.unitId || undefined,
      // For Interdictions: send showReleased, For Holds: send showTerminated
      showReleased: queriedOption === 'Interdiction' && (filters.showReleased !== null && filters.showReleased !== undefined) ? filters.showReleased : undefined,
      showTerminated: queriedOption === 'Hold' && (filters.showReleased !== null && filters.showReleased !== undefined) ? filters.showReleased : undefined,
      effDateFilter: filters.effectiveDate ? this.formatDateForAPI(filters.effectiveDate) : undefined,
      effDatePeriod: filters.effectivePeriod || undefined,
      termDateFilter: filters.terminationDate ? this.formatDateForAPI(filters.terminationDate) : undefined,
      termDatePeriod: filters.terminationPeriod || undefined,
      sortColumn: sortColumn,
      sortDirection: sortDirection,
      chapterId,
      userId
    };

    this.isLoading.set(true);

    this.interdictionQueryService.queryInterdictions(apiParams)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: InterdictionQueryResponse) => {
          this.isLoading.set(false);

          if (response.success) {
            const results = response.results || [];
            const totalRecords = response.totalRecords || 0;

            const donationRecords: DonationRecord[] = results.map(r => ({
              transactionId: r.transactionId || '',
              unitId: r.displayUnitId || r.unitId || '',
              collectionDate: r.collDate ? this.formatDateForDisplay(r.collDate) : '',
              driveId: (r as any).driveId || '',
              donationType: r.donationType || '',
              procedureCode: r.procedureCode || '',
              interdiction: r.interCode || '',
              effectiveDate: r.effDate ? this.formatDateForDisplay(r.effDate) : '',
              terminationDate: r.termDate ? this.formatDateForDisplay(r.termDate) : '',
              releaseDate: r.releaseDate ? this.formatDateForDisplay(r.releaseDate) : '',
              releaseUser: r.releaseUser || '',
              origin: r.originatedFrom || '',
              reason: r.reasonCode || '',
              interdictionType: r.interType || '',
              interdictionCustody: this.mapSourceToCustody(r.source),
              donorId: r.donorId || '',
              name: r.donorName || '',
              dateOfBirth: r.dateOfBirth ? this.formatDateForDisplay(r.dateOfBirth) : '',
              gender: r.gender || ''
            }));

            this.donationRecords.set(donationRecords);

            // No notification needed for filter results
          }
        },
        error: (error) => {
          this.isLoading.set(false);
          this.showErrorMessage('Failed to apply filters');
        }
      });
  }

  applyDonorsFilters(filters: DonorsFilterValue): void {
    this.donorsFilter.set(filters);
    this.donorsFilterChips = InterdictionQueryFilterChipsUtils.convertDonorsFiltersToChips(filters);
    this.closeFilterPanel();

    // Call API with new filter parameters
    if (!this.hasQueried()) {
      return;
    }

    const userId = this.currentUserId();
    const chapterId = this.currentChapterId();

    if (!userId || !chapterId) {
      return;
    }

    const formValue = this.queryForm.value;
    const hasMultipleCodes = formValue.operation === 'ADD' &&
                             formValue.multipleCodes &&
                             formValue.multipleCodes.length > 0;

    const sortColumn = this.currentSort?.direction ? this.currentSort.active : undefined;
    const sortDirection = this.currentSort?.direction ? this.currentSort.direction.toUpperCase() : undefined;

    const apiParams: ApiInterdictionQueryParams = {
      // Always send interCodes as array, even for single value
      interCodes: hasMultipleCodes ? formValue.multipleCodes : (formValue.code ? [formValue.code] : undefined),
      // Only send operator when there are actually multiple codes
      interCodesOperator: hasMultipleCodes ? (formValue.multipleOperation || 'OR') : undefined,
      fromDate: formValue.fromCollectionDate ? this.formatDateForAPI(formValue.fromCollectionDate) : undefined,
      toDate: formValue.toCollectionDate ? this.formatDateForAPI(formValue.toCollectionDate) : undefined,
      sortColumn: sortColumn,
      sortDirection: sortDirection,
      chapterId,
      userId
    };

    this.isLoading.set(true);

    this.interdictionQueryService.queryDonorInterdictions(apiParams)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: InterdictionQueryResponse) => {
          this.isLoading.set(false);

          if (response.success) {
            const results = response.results || [];
            const totalRecords = response.totalRecords || 0;

            const donorRecords: DonorRecord[] = results.map(r => ({
              transactionId: r.transactionId || '',
              unitId: r.displayUnitId || r.unitId || '',
              collectionDate: r.collDate ? this.formatDateForDisplay(r.collDate) : '',
              driveId: (r as any).driveId || '',
              effectiveDate: r.effDate ? this.formatDateForDisplay(r.effDate) : '',
              terminationDate: r.termDate ? this.formatDateForDisplay(r.termDate) : '',
              donorId: r.donorId || '',
              interdictionCode: r.interCode || ''
            }));

            this.donorRecords.set(donorRecords);

            // No notification needed for filter results
          }
        },
        error: (error) => {
          this.isLoading.set(false);
          this.showErrorMessage('Failed to apply donor filters');
        }
      });
  }

  removeDonationsFilterChip(chipKey: string): void {
    const updatedFilters = InterdictionQueryFilterChipsUtils.removeDonationsFilterByChipKey(
      this.donationsFilter(),
      chipKey
    );

    if (updatedFilters) {
      this.applyDonationsFilters(updatedFilters);
    } else {
      this.clearDonationsFilters();
    }
  }

  removeDonorsFilterChip(chipKey: string): void {
    const updatedFilters = InterdictionQueryFilterChipsUtils.removeDonorsFilterByChipKey(
      this.donorsFilter(),
      chipKey
    );

    if (updatedFilters) {
      this.applyDonorsFilters(updatedFilters);
    } else {
      this.clearDonorsFilters();
    }
  }

  clearDonationsFilters(): void {
    const emptyFilters: DonationsFilterValue = {
      donationType: null,
      showReleased: null,
      effectivePeriod: null,
      effectiveDate: null,
      terminationPeriod: null,
      terminationDate: null,
      unitId: null
    };
    this.applyDonationsFilters(emptyFilters);
  }

  clearDonorsFilters(): void {
    const emptyFilters: DonorsFilterValue = {
      showTerminated: false,
      sex: ''
    };
    this.applyDonorsFilters(emptyFilters);
  }

  onDonationsFilter(): void {
    this.toggleFilterPanel();
  }

  onDonorsFilter(): void {
    this.toggleFilterPanel();
  }

  clearFilters(): void {
    if (this.currentTab() === 'Donations') {
      this.clearDonationsFilters();
    } else {
      this.clearDonorsFilters();
    }
  }


  openOtherHoldsDialog(unitId: string): void {
    // Find the record to get additional data
    let transactionId: string | undefined;
    let collectionDate: string | undefined;
    let driveId: string | undefined;
    let donationRow: DonationRecord | undefined;

    if (this.currentTab() === 'Donations') {
      donationRow = this.filteredDonations().find((d: DonationRecord) => d.unitId === unitId);
      transactionId = donationRow?.transactionId;
      collectionDate = donationRow?.collectionDate;
      driveId = donationRow?.driveId;
    } else {
      const donor = this.donorRecords().find(d => d.unitId === unitId);
      transactionId = donor?.transactionId;
      collectionDate = donor?.collectionDate;
      driveId = donor?.driveId;
    }

    if (!transactionId) {
      return;
    }

    // Set the highlighted row (matches distribution-master-codes pattern)
    this.highlightedDonationRow = donationRow || null;

    // Set panel data and open panel
    this.otherHoldsPanelData = {
      transactionId: transactionId,
      unitId: unitId,
      collectionDate: collectionDate,
      driveId: driveId
    };
    this.isOtherHoldsPanelOpen = true;
  }

  closeOtherHoldsPanel(): void {
    this.isOtherHoldsPanelOpen = false;
    // Clear the highlighted row when panel closes (matches distribution-master-codes pattern)
    this.highlightedDonationRow = null;
  }

  openDonorInformation(donorId: string): void {
    if (!donorId) return;
    this.donorInfoPanelDonorId.set(donorId);
    this.isDonorInfoPanelOpen.set(true);
  }

  closeDonorInfoPanel(): void {
    this.isDonorInfoPanelOpen.set(false);
    this.donorInfoPanelDonorId.set('');
  }

  formatDate(date: string | Date | null | undefined): string {
    if (!date) return '-';
    return moment(date).isValid() ? moment(date).format('DD-MMM-YYYY').toUpperCase() : '-';
  }

  private formatDateForAPI(date: any): string {
    if (!date) return '';
    if (moment.isMoment(date)) {
      return date.format('YYYY-MM-DD');
    }
    return moment(date).format('YYYY-MM-DD');
  }

  private formatDateForDisplay(date: string | Date | null | undefined): string {
    if (!date) return '';
    return moment(date).format('DD-MMM-YYYY').toUpperCase();
  }

  /**
   * Maps source field to user-friendly custody label
   * @param source - 'U' for Unit/Donation, 'D' for Donor
   * @returns User-friendly custody label
   */
  private mapSourceToCustody(source: string | undefined): string {
    switch (source) {
      case 'U':
        return 'Unit';
      case 'D':
        return 'Donor';
      default:
        return source || '';
    }
  }

  /**
   * Validates dates according to Oracle Forms business rules (FMB VALIDATE_FROM_TO_DATES)
   * Implements FMB logic:
   * 1. Validates FROM_DATE not in future (if provided)
   * 2. Validates TO_DATE not in future (if provided)
   * 3. Validates FROM_DATE <= TO_DATE (if both provided)
   * @returns true if dates are valid, false otherwise
   */
  private validateDates(): boolean {
    const fromDate = this.queryForm.get('fromCollectionDate')?.value;
    const toDate = this.queryForm.get('toCollectionDate')?.value;
    // Use chapter local date instead of system date for validation
    const today = this.maxDate();

    // Dates are optional - allow empty dates
    // Only validate if dates are actually provided

    // Validation 1: FROM_DATE cannot be in future (FMB error '2140')
    if (fromDate && moment(fromDate).isAfter(today, 'day')) {
      this.showErrorMessage(`Error ${VALIDATION_MESSAGES.FROM_DATE_FUTURE}: From Collection Date cannot be greater than current date`);
      return false;
    }

    // Validation 2: TO_DATE cannot be in future (FMB error '0060')
    if (toDate && moment(toDate).isAfter(today, 'day')) {
      this.showErrorMessage(`Error ${VALIDATION_MESSAGES.TO_DATE_FUTURE}: To Collection Date cannot be greater than current date`);
      return false;
    }

    // Validation 3: FROM_DATE must be <= TO_DATE (FMB error '9192')
    if (fromDate && toDate && moment(fromDate).isAfter(moment(toDate), 'day')) {
      this.showErrorMessage(`Error ${VALIDATION_MESSAGES.INVALID_DATE_RANGE}: From Collection Date must be on or before To Collection Date`);
      return false;
    }

    return true;
  }


  private showErrorMessage(message: string): void {
    this.snackBar.open(message, 'Dismiss', {
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }

  private showInfoMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }

  /**
   * Bottom Navigation Methods
   * Navigate to different donor-related pages
   */
  navigateToOtherInter(): void {
    const donorId = this.selectedDonorId();
    if (!donorId) return;

    // TODO: Implement side panel for donor interdictions
    // Full-page route has been removed in favor of side panels
    // this.router.navigate(['/donor-functions/donor-profile/interdictions'], {
    //   queryParams: { donorId }
    // });
  }

  navigateToAttributes(): void {
    const donorId = this.selectedDonorId();
    if (!donorId) return;

    this.router.navigate(['/donor-functions/donor-profile/attributes'], {
      queryParams: { donorId }
    });
  }

  navigateToDemographics(): void {
    const donorId = this.selectedDonorId();
    if (!donorId) return;

    this.router.navigate(['/donor-functions/donor-profile/demographics'], {
      queryParams: { donorId }
    });
  }

  navigateToDonations(): void {
    const donorId = this.selectedDonorId();
    if (!donorId) return;

    this.router.navigate(['/donor-functions/donor-profile/donations'], {
      queryParams: { donorId }
    });
  }

  // Getters for template
  get f() {
    return this.queryForm.controls;
  }

  /**
   * Get truncated description for display (max 50 chars)
   * Full description is shown in tooltip
   */
  get displayCodeDescription(): string {
    if (!this.selectedCodeDescription) {
      return '-';
    }
    if (this.selectedCodeDescription.length > 50) {
      return this.selectedCodeDescription.substring(0, 50) + '...';
    }
    return this.selectedCodeDescription;
  }

  /**
   * Check if any filter or search is currently active
   * Used to determine whether to show filter/search controls even when there's no data
   */
  get hasActiveFiltersOrSearch(): boolean {
    const filter = this.donationsFilter();
    const optionType = this.queriedOptionType();
    const searchText = optionType === 'Interdiction' ? this.interdictionSearchText() : this.holdSearchText();

    // Check if search is active
    if (searchText && searchText.trim()) {
      return true;
    }

    // Check if any filters are active
    if (filter) {
      return !!(
        filter.donationType ||
        filter.showReleased !== null ||
        filter.effectiveDate ||
        filter.terminationDate ||
        filter.unitId
      );
    }

    return false;
  }

  /**
   * Get query context for filter panel
   * Donation types lookup needs current query parameters
   * Returns same payload structure as search endpoint
   */
  get filterQueryContext(): ApiInterdictionQueryParams {
    const formValue = this.queryForm?.value;
    if (!formValue) return {};

    const hasMultipleCodes = formValue.operation === 'ADD' &&
                             formValue.multipleCodes &&
                             formValue.multipleCodes.length > 0;

    // Convert dates to API format (YYYY-MM-DD)
    const fromDate = formValue.fromCollectionDate
      ? this.formatDateForAPI(formValue.fromCollectionDate)
      : undefined;

    const toDate = formValue.toCollectionDate
      ? this.formatDateForAPI(formValue.toCollectionDate)
      : undefined;

    // Build query context matching search endpoint payload
    return {
      option: formValue.option,
      // Use interCodes for multiselect, interCode for single select
      interCodes: hasMultipleCodes ? formValue.multipleCodes : (formValue.code ? [formValue.code] : undefined),
      interCodesOperator: hasMultipleCodes ? formValue.multipleOperation : undefined,
      fromDate,
      toDate,
      userId: this.currentUserId(),
      chapterId: this.currentChapterId()
    };
  }
}
