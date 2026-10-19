import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { of, Subject } from 'rxjs';
import { catchError, finalize, takeUntil, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import moment from 'moment';

import { AttachDonorService } from './services/attach-donor.service';
import { DonorEmployerService } from '../registration/registration-maintenance/maintain-donor-employer/services/donor-employer.service';
import { FindDonorService } from '@shared/components/find-donor/find-donor.service';
import {
  GradedDonorDto,
  GradedDonationDto,
  EntryOkOption,
  ResolvedStatus,
  TransactionType,
  DonorSearchResult
} from './models/attach-donor.model';
import {
  ConfirmDonorDialogComponent,
  ConfirmDonorDialogData,
  ConfirmDonorDialogResult
} from './dialogs/confirm-donor-dialog/confirm-donor-dialog';
import { FindDonorDialog } from '@shared/components/find-donor/find-donor';
import { FindDonorDialogData, FindDonorDialogResult } from '@shared/components/find-donor/find-donor.model';
import {
  DonorListHelpDialogComponent
} from './dialogs/donor-list-help-dialog/donor-list-help-dialog';
import {
  AttachDonorPhlebotomyDetailsDialogComponent,
  PhlebotomyDetailsDialogInput
} from './dialogs/phlebotomy-details-dialog/phlebotomy-details-dialog';
import { AlternateDemographicsDialogComponent } from '@shared/components/alternate-demographics-dialog/alternate-demographics-dialog.component';
import { AlternateDemographicsDialogData } from '@shared/models/alternate-demographics.model';
import { AlternateDemographicsService } from '@shared/services/alternate-demographics.service';
import { InternationalAddressDialogComponent } from '@shared/components/international-address-dialog/international-address-dialog.component';
import { InternationalAddressDialogData, InternationalAddressModel } from '@shared/models/international-address.model';
import { ConfirmActionDialogComponent, ConfirmActionDialogData } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { HeaderService } from '@shared/services/header.service';
import { MenuService } from '@shared/services/menu.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { ROUTE_REGISTRY } from '../../../core/constants/route-registry';
import { RouteKey } from '../../../core/constants/route-keys';
import { UnitIdFieldService } from '@shared/components/unit-id-field/unit-id-field.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { dateFormatValidator } from 'src/app/core/utils/date-adapter.util';
import { contactNameValidator } from '@shared/validators/contact.validators';
import { strictEmailValidator, trimmedMinLengthValidator } from '@shared/validators/input.validators';

/**
 * Attach Donor Component
 * Main component for attaching donors to donations/deferrals (DRUREHLD form)
 * Based on Figma screenshots and API documentation from MLT-10497/MLT-10498
 */
@Component({
  selector: 'app-attach-donor',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatRadioModule,
    MatProgressSpinnerModule,
    MatExpansionModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatAutocompleteModule,
    RouterModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
  ],
  templateUrl: './attach-donor.html',
  styleUrl: './attach-donor.scss'
})
export class AttachDonorComponent implements OnInit, OnDestroy {
  private static nextId = 0;
  readonly componentId = `attach-donor-${AttachDonorComponent.nextId++}`;

  // Dependency injection
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly attachDonorService = inject(AttachDonorService);
  private readonly donorEmployerService = inject(DonorEmployerService);
  private readonly findDonorService = inject(FindDonorService);
  private readonly alternateDemographicsService = inject(AlternateDemographicsService);
  private readonly headerService = inject(HeaderService);
  private readonly menuService = inject(MenuService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly unitIdFieldService = inject(UnitIdFieldService);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  // Cleanup
  private readonly destroy$ = new Subject<void>();

  readonly elementId = (name: string) => `${this.componentId}-${name}`;
  readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  // Page Header Configuration
  pageHeaderConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: 'Attach Donor', link: null },
    ],
    actions: [],
  };

  // Look up page header by the registered route path so it resolves correctly
  // even when rendered as a child route under a different URL
  readonly pageHeader = computed(() => {
    const menuItem = this.menuService.findMenuItemByPath(ROUTE_REGISTRY[RouteKey.AttachDonor].path);
    if (menuItem) {
      return {
        title: menuItem.label,
        subtitle: menuItem.remarks?.trim() || menuItem.subtitle?.trim(),
      };
    }
    return this.pageHeaderService.pageHeaderData();
  });

  // Signal-based state
  readonly transactionData = signal<GradedDonationDto | null>(null);
  readonly gradedDonors = signal<GradedDonorDto[]>([]);
  readonly selectedDonorId = signal<string | null>(null);
  readonly selectedDonorIds = signal<string[]>([]);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly entryOkError = signal<string | null>(null);
  readonly donorRecordExpanded = signal<boolean>(false);
  readonly resolvedStatus = signal<ResolvedStatus>('Not Resolved');
  readonly duplicateMode = signal<boolean>(false);
  readonly isSubmitting = signal<boolean>(false);
  readonly donorExistsInFullTable = signal<boolean>(true); // Track if donor exists in full donor table
  readonly heldDonor = signal<DonorSearchResult | null>(null); // Track donor on hold
  readonly entryOkConfirmed = signal<boolean>(false); // Track if Entry OK has been set (Y or N)
  readonly donorSelectionEnabled = signal<boolean>(true); // Track if donor selection from list is allowed
  readonly keyDataComplete = signal<boolean>(true); // Track if key data (lastName, DOB, gender) is present
  readonly isNewDonorMode = signal<boolean>(false);
  private capturedIntlAddress = signal<InternationalAddressModel | null>(null);
  readonly intlAddressActive = signal<boolean>(false);
  readonly findDonorSearchCriteria = signal<{ lastName?: string; firstName?: string; dob?: string; sex?: string } | null>(null);

  // Computed values
  readonly isEmpty = computed(() => this.gradedDonors().length === 0);
  readonly hasResults = computed(() => this.gradedDonors().length > 0);
  readonly selectedDonor = computed(() => {
    const donorId = this.selectedDonorId();
    if (!donorId) return null;
    return this.gradedDonors().find(d => d.donorId === donorId) || null;
  });
  readonly canSelectDonor = computed(() => {
    return this.selectedDonorId() !== null && !this.loading();
  });
  readonly canMarkDuplicates = computed(() => {
    return this.selectedDonorIds().length >= 2 && !this.loading();
  });
  readonly canViewPhlebotomy = computed(() => {
    if (this.duplicateMode()) return false;

    const transaction = this.transactionData();
    if (!transaction) return false;

    const transactionType = this.transactionTypeControl.value;

    if (transactionType === 'Donation') {
      return !!transaction.unitId;
    }

    return this.selectedDonorId() !== null;
  });

  /**
   * Check if duplicate mode can be toggled
   * Requires at least 2 donor records displayed
   */
  readonly canToggleDuplicate = computed(() => {
    return this.gradedDonors().length >= 2 && !this.loading();
  });

  // Signal to track if deferral ID auto-populated transaction ID
  readonly transactionIdAutoPopulated = signal<boolean>(false);

  // Signal to track which field was used to fetch data ('unitId' or 'transactionId')
  readonly fetchedBy = signal<'unitId' | 'transactionId' | null>(null);
  readonly originalFetchValue = signal<string | null>(null);

  // Form
  transactionForm!: FormGroup;
  donorRecordForm!: FormGroup;
  readonly transactionTypeControl = new FormControl<TransactionType>('Donation');
  readonly entryOkControl = new FormControl<EntryOkOption | null>(null);

  // Save form controls
  readonly saveUnitIdControl = new FormControl<string>('');
  readonly saveTransactionIdControl = new FormControl<string>('');

  // Donor selection control (synced with selectedDonorId signal)
  readonly donorSelectionControl = new FormControl<string | null>(null);

  // Signal for transaction type changes (must be after transactionTypeControl)
  readonly transactionType = toSignal(this.transactionTypeControl.valueChanges, {
    initialValue: this.transactionTypeControl.value
  });

  readonly unitIdLabel = computed(() => {
    return this.transactionType() === 'Deferral' ? 'Deferral ID' : 'Unit ID';
  });

  // Dropdown options
  transactionTypes: TransactionType[] = ['Donation', 'Deferral'];
  entryOkOptions: EntryOkOption[] = ['Y', 'N'];
  employerOptions = signal<{ value: string; label: string }[]>([]);
  filteredEmployerOptions = signal<{ value: string; label: string }[]>([]);
  alternateIdTypes = signal<{ code: string; description: string }[]>([]);
  ethnicGroups = signal<{ code: string; description: string }[]>([]);
  cityOptions = signal<{ code: string; description: string }[]>([]);
  readonly alternateTypeSearchCtrl = new FormControl<string>('');
  readonly ethnicGroupSearchCtrl = new FormControl<string>('');
  private alternateTypeSearch = signal<string>('');
  private ethnicGroupSearch = signal<string>('');
  filteredAlternateIdTypes = computed(() => {
    const search = this.alternateTypeSearch().toUpperCase();
    if (!search) return this.alternateIdTypes();
    return this.alternateIdTypes().filter(t =>
      t.code.toUpperCase().includes(search) || t.description.toUpperCase().includes(search)
    );
  });
  filteredEthnicGroups = computed(() => {
    const search = this.ethnicGroupSearch().toUpperCase();
    if (!search) return this.ethnicGroups();
    return this.ethnicGroups().filter(e =>
      e.code.toUpperCase().includes(search) || e.description.toUpperCase().includes(search)
    );
  });
  employerCityOptions = signal<{ code: string; description: string }[]>([]);

  // Table columns for graded donors
  displayedColumns: string[] = [
    'select',
    'donorId',
    'grade',
    'dgmId',
    'lastName',
    'firstName',
    'dateOfBirth',
    'gender',
    'actions'
  ];

  ngOnInit(): void {
    // CRITICAL FIX: Ensure header context (chapterId) is loaded from cookies first
    // This prevents 404 errors on getDonorById() when X-ChapterId header is missing
    this.headerService.loadFromCookies();

    this.initForm();
    this.loadDataFromRoute();
    this.loadEmployers();
    this.loadAlternateIdTypes();
    this.loadEthnicGroups();
    this.setupAutoSave();
    this.setupTransactionTypeListener();
    this.setupDonorSelectionListener();
    this.setupCityAutocomplete();
    this.setupEmployerCityAutocomplete();
    this.alternateTypeSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.alternateTypeSearch.set(v || ''));
    this.ethnicGroupSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.ethnicGroupSearch.set(v || ''));
  }

  /**
   * Setup listener for donor selection control
   * Syncs FormControl with selectedDonorId signal to avoid NG0100 errors
   */
  private setupDonorSelectionListener(): void {
    // Listen to FormControl changes and update signal
    this.donorSelectionControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((donorId) => {
        this.selectedDonorId.set(donorId);
      });
  }

  /**
   * Setup city autocomplete with debounce
   * Searches cities as user types (min 2 characters)
   */
  private setupCityAutocomplete(): void {
    const cityControl = this.donorRecordForm.get('city');
    if (cityControl) {
      cityControl.valueChanges
        .pipe(
          debounceTime(300),
          distinctUntilChanged(),
          takeUntil(this.destroy$)
        )
        .subscribe((searchTerm) => {
          if (searchTerm && typeof searchTerm === 'string' && searchTerm.trim().length >= 2) {
            this.attachDonorService.searchCities(searchTerm.trim())
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: (cities) => {
                  this.cityOptions.set(cities);
                },
                error: (err) => {
                  this.cityOptions.set([]);
                }
              });
          } else {
            this.cityOptions.set([]);
          }
        });
    }
  }

  private setupEmployerCityAutocomplete(): void {
    const empCityControl = this.donorRecordForm.get('employerCity');
    if (empCityControl) {
      empCityControl.valueChanges
        .pipe(
          debounceTime(300),
          distinctUntilChanged(),
          takeUntil(this.destroy$)
        )
        .subscribe((searchTerm) => {
          if (searchTerm && typeof searchTerm === 'string' && searchTerm.trim().length >= 2) {
            this.attachDonorService.searchCities(searchTerm.trim())
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: (cities) => this.employerCityOptions.set(cities),
                error: () => this.employerCityOptions.set([])
              });
          } else {
            this.employerCityOptions.set([]);
          }
        });
    }
  }

  /**
   * Setup listener for transaction type changes
   * Auto-search with Deferral ID when switching to Deferral type
   */
  private setupTransactionTypeListener(): void {
    this.transactionTypeControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((transactionType) => {
        // When switching to Deferral, trigger search if Deferral ID is already entered
        if (transactionType === 'Deferral') {
          const deferralId = this.transactionForm.get('unitId')?.value;
          if (deferralId && deferralId.trim() !== '') {
            // Trigger the same logic as onUnitIdBlur
            this.onUnitIdBlur();
          }
        }
      });
  }

  /**
   * Setup auto-save when user enters Unit ID or Transaction ID
   */
  private setupAutoSave(): void {
    // Save is triggered ONLY by Enter key press in the save Unit ID / Transaction ID fields.
    // Previously this method had valueChanges subscriptions that fired onSaveDonorRecord()
    // on every keystroke (500ms debounce), causing error snackbars while user was still typing.
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.transactionForm = this.fb.group({
      unitId: [''],
      collectionDate: [''],
      transactionId: [''],
      enteredBy: ['']
    });

    this.donorRecordForm = this.fb.group({
      // Personal Information
      lastName: ['', [Validators.required, contactNameValidator()]],
      firstName: ['', [Validators.required, contactNameValidator()]],
      middleName: [''],
      alternateId: [''],
      alternateType: [''],
      dateOfBirth: [null, [Validators.required, dateFormatValidator(), DateFieldValidationUtility.validDateValidator()]],
      gender: ['', [Validators.required]],

      // Address Information
      homeAddress: ['', [Validators.required]],
      apartmentNo: [''],
      city: ['', [Validators.required, trimmedMinLengthValidator(3)]],
      state: [''],
      zip: [''],

      // Contact Information
      // Phone pattern: ###-###-#### (10 digits) or ###-#### (7 digits)
      homePhone: ['', [Validators.pattern(/^(\d{3}-\d{3}-\d{4}|\d{3}-\d{4})$/)]],
      workPhone: ['', [Validators.pattern(/^(\d{3}-\d{3}-\d{4}|\d{3}-\d{4})$/)]],
      workPhoneExtension: [''],
      mobilePhone: ['', [Validators.pattern(/^(\d{3}-\d{3}-\d{4}|\d{3}-\d{4})$/)]],
      email: ['', [strictEmailValidator()]],
      preferredPhone: [''],

      // Employer/School Information
      employerSchoolName: [''],
      employerCity: [''],
      employerState: [''],
      employerZip: [''],
      ethnicGroup: ['']
    });
  }

  get f() {
    return this.transactionForm.controls;
  }

  /**
   * Load transaction data from route query params
   */
  private loadDataFromRoute(): void {
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const transactionId = params['transactionId'];
        const newDonorId = params['newDonorId'];
        const unitId = params['unitId'];

        if (transactionId && newDonorId) {
          this.handleReturnFromRegistration(transactionId, newDonorId);
        } else if (transactionId) {
          this.loadTransactionData(transactionId);
          if (unitId) {
            this.fetchedBy.set('unitId');
            this.originalFetchValue.set(unitId);
            this.transactionForm.get('unitId')?.setValue(unitId);
          }
        } else {
          const savedContext = this.attachDonorService.getContext();
          if (savedContext) {
            if (this.transactionTypeControl) {
              this.transactionTypeControl.setValue(savedContext.transactionType);
            }
            this.loadTransactionData(savedContext.transactionId);
            this.attachDonorService.clearContext();
          }
        }
      });

    // Check router state for navigation context
    const navState = history.state;
    if (navState?.returnPath) {
      this.setupBreadcrumbFromState(navState.returnPath, navState.filterState);
    }
  }

  /**
   * Setup breadcrumb navigation from router state
   * Reconstructs return URL with filter state to avoid double-encoding
   */
  private setupBreadcrumbFromState(returnPath: string, filterState?: Record<string, string>): void {
    try {
      // breadcrumb setup from router state

      // Construct query string from filter state
      let returnUrl = returnPath;
      if (filterState && Object.keys(filterState).length > 0) {
        const params = new URLSearchParams();
        Object.entries(filterState).forEach(([key, value]) => {
          if (value) params.append(key, value);
        });
        returnUrl = `${returnPath}?${params.toString()}`;
      }

      // Determine parent label based on path
      let parentLabel = 'Donations on Hold Query'; // Default

      if (returnPath.includes('deferrals-on-hold-query')) {
        parentLabel = 'Deferrals on Hold Query';
      } else if (returnPath.includes('donations-on-hold-query')) {
        parentLabel = 'Donations on Hold Query';
      }

      // Update breadcrumb configuration
      this.pageHeaderConfig = {
        breadcrumbs: [
          { label: 'Home', link: '/home' },
          { label: parentLabel, link: returnUrl },
          { label: 'Attach Donor', link: null },
        ],
        actions: [],
      };
    } catch (error) {
      // breadcrumb setup failed — use default
      // Fallback to default
      this.pageHeaderConfig = {
        breadcrumbs: [
          { label: 'Home', link: '/home' },
          { label: 'Donations on Hold Query', link: ROUTE_REGISTRY[RouteKey.DonationsOnHoldQuery].path },
          { label: 'Attach Donor', link: null },
        ],
        actions: [],
      };
    }
  }

  private handleReturnFromRegistration(transactionId: string, newDonorId: string): void {
    this.loading.set(true);
    this.entryOkConfirmed.set(true);

    const savedContext = this.attachDonorService.getContext();
    if (savedContext && this.transactionTypeControl) {
      this.transactionTypeControl.setValue(savedContext.transactionType);
    }
    this.attachDonorService.clearContext();

    this.attachDonorService.getTransaction(transactionId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (transaction) => {
          this.transactionData.set(transaction);
          this.populateTransactionForm(transaction);
          this.autoAttachNewDonor(transactionId, newDonorId);
        },
        error: (err) => {
          this.loading.set(false);
          this.showError(err?.message || 'Failed to load transaction on return from registration');
        }
      });
  }

  private autoAttachNewDonor(transactionId: string, newDonorId: string): void {
    this.attachDonorService.addGradedDonor({ transactionId, donorId: newDonorId })
      .pipe(
        switchMap(() => this.attachDonorService.selectDonor({
          transactionId,
          donorId: newDonorId
        })),
        takeUntil(this.destroy$),
        finalize(() => {
          this.loading.set(false);
          this.isSubmitting.set(false);
        })
      )
      .subscribe({
        next: () => {
          this.showSuccess('New donor created and attached to the transaction successfully.');
          this.onClearAll();
        },
        error: (err) => {
          if (err?.errorCode === '16022') {
            this.showSuccess('New donor created and attached to the transaction successfully.');
            this.onClearAll();
          } else {
            this.snackBar.open(
              'New donor added. Please select the donor to complete the attach.',
              'DISMISS',
              { horizontalPosition: 'end', verticalPosition: 'top' }
            );
            this.loadGradedDonors(transactionId);
          }
        }
      });
  }

  /**
   * Load employers for dropdown
   */
  private loadEmployers(): void {
    this.attachDonorService.getLookupEmployers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (employers) => {
          this.employerOptions.set(employers);
          this.filteredEmployerOptions.set(employers);
        },
        error: (err) => {
          this.employerOptions.set([]);
        }
      });
  }

  /**
   * Load alternate ID types for dropdown
   */
  private loadAlternateIdTypes(): void {
    this.findDonorService.getAlternateIdTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (types) => {
          // Exclude C39 and C417 as per add-donor pattern
          const excluded = ['C39', 'C417'];
          this.alternateIdTypes.set(
            types
              .filter(t => !excluded.includes(t.code))
              .map(t => ({ code: t.code, description: t.description }))
          );
        },
        error: (err) => {
          this.alternateIdTypes.set([]);
        }
      });
  }

  private loadEthnicGroups(): void {
    this.attachDonorService.getLookupEthnicGroups()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (groups) => this.ethnicGroups.set(groups),
        error: () => this.ethnicGroups.set([])
      });
  }

  onSelectOpenedChange(searchCtrl: FormControl, opened: boolean): void {
    if (!opened) {
      searchCtrl.setValue('');
    }
  }

  openAddEmployerDialog(): void {
    import('../update-deferral/components/add-employer-wrapper-dialog/add-employer-wrapper-dialog').then((m) => {
      this.dialog.open(m.AddEmployerWrapperDialog, {
        width: '600px',
        height: 'calc(100vh - 64px)',
        maxWidth: '100vw',
        maxHeight: 'calc(100vh - 64px)',
        position: { right: '0', top: '64px' },
        panelClass: 'code-dialog-panel-right',
        hasBackdrop: true,
        backdropClass: 'code-dialog-backdrop',
      }).afterClosed()
        .pipe(takeUntil(this.destroy$))
        .subscribe((result: { employerId: string; employerName: string } | null) => {
          if (result) {
            const newOption = { value: result.employerId, label: result.employerName };
            this.employerOptions.update(opts => [newOption, ...opts]);
            this.filteredEmployerOptions.update(opts => [newOption, ...opts]);
            this.donorRecordForm.patchValue({ employerSchoolName: result.employerId });
            this.onEmployerSelected(result.employerId);
            this.showSuccess('New employer created successfully');
          }
        });
    });
  }

  /**
   * Filter employer options as user types
   */
  onEmployerSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    const search = (input.value || '').toUpperCase();
    if (!search) {
      this.filteredEmployerOptions.set(this.employerOptions());
      return;
    }
    const filtered = this.employerOptions().filter(
      e => e.label.toUpperCase().includes(search)
    );
    this.filteredEmployerOptions.set(filtered);
  }

  /**
   * Display function for employer autocomplete
   */
  displayEmployer(value: string): string {
    if (!value) return '';
    const employer = this.employerOptions().find(e => e.value === value);
    return employer?.label || value;
  }

  /**
   * Handle employer selection - fetch full employer details and populate city/state/zip
   */
  onEmployerSelected(employerId: string): void {
    if (!employerId) {
      this.donorRecordForm.patchValue({
        employerCity: '',
        employerState: '',
        employerZip: ''
      });
      return;
    }

    this.donorEmployerService
      .getById(employerId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (employer) => {
          this.donorRecordForm.patchValue({
            employerCity: employer.city || '',
            employerState: employer.state || '',
            employerZip: employer.zip || ''
          });
        },
        error: (err) => {
        }
      });
  }

  /**
   * Handle ZIP code blur - auto-populate city and state
   */
  onZipBlur(): void {
    const zip = this.donorRecordForm.get('zip')?.value?.trim();
    if (!zip || zip.length < 5) {
      return;
    }

    this.attachDonorService.getCityStateByZip(zip)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (results) => {
          if (results && results.length > 0) {
            if (results.length === 1) {
              this.donorRecordForm.patchValue({
                city: results[0].city,
                state: results[0].state
              });
            } else {
              this.donorRecordForm.patchValue({ state: results[0].state });
              this.cityOptions.set(results.map(r => ({ code: r.zip, description: r.city })));
            }
          } else {
            this.showError('Error 10002: Invalid ZIP code - no matching city/state found');
          }
        },
        error: () => {
          this.showError('Error 10002: Invalid ZIP code - unable to validate');
        }
      });
  }

  /**
   * Handle city selection from autocomplete
   * Per legacy behavior: selecting a city does NOT auto-populate state.
   * State is only populated when the user enters a zip code.
   */
  onCitySelected(city: string): void {
    if (!city || !city.trim()) {
      return;
    }

    const cityValue = city.trim().toUpperCase();
    this.donorRecordForm.patchValue({ city: cityValue, state: '' }, { emitEvent: false });
  }

  /**
   * Handle Employer ZIP code blur - auto-populate employer city and state
   */
  onEmployerZipBlur(): void {
    const zip = this.donorRecordForm.get('employerZip')?.value?.trim();
    if (!zip || zip.length < 5) {
      return;
    }

    this.attachDonorService.getCityStateByZip(zip)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (results) => {
          if (results && results.length > 0) {
            if (results.length === 1) {
              this.donorRecordForm.patchValue({
                employerCity: results[0].city,
                employerState: results[0].state
              });
            } else {
              this.donorRecordForm.patchValue({ employerState: results[0].state });
              this.employerCityOptions.set(results.map(r => ({ code: r.zip, description: r.city })));
            }
          } else {
            this.showError('Error 10002: Invalid ZIP code - no matching city/state found');
          }
        },
        error: (err) => {
          // Don't show error to user, just let them enter manually
        }
      });
  }

  /**
   * Get employer name from employerId or free-text input
   */
  private getSelectedEmployerName(employerValue: string | null | undefined): string {
    if (!employerValue) return '';
    const employer = this.employerOptions().find(e => e.value === employerValue);
    return employer?.label || employerValue;
  }

  /**
   * Convert preferred phone radio value to backend code
   */
  private getPreferredPhoneCode(value: string | null | undefined): string {
    if (!value) return '';
    if (value === 'home') return 'H';
    if (value === 'work') return 'W';
    if (value === 'mobile') return 'M';
    return '';
  }

  /**
   * Search directly by Unit ID (called when Enter is pressed in Unit ID field)
   * Per legacy behavior: entering a Unit ID should always search by Unit ID,
   * never require the user to enter a Transaction ID.
   */
  onUnitIdSearch(): void {
    const unitId = this.transactionForm.get('unitId')?.value;

    if (unitId && unitId.trim()) {
      this.loadTransactionDataByUnit(unitId.trim());
    } else {
      const idType = this.transactionType() === 'Deferral' ? 'Deferral ID' : 'Unit ID';
      this.showError(`Please enter a ${idType}`);
    }
  }

  /**
   * Search for transaction using Unit ID or Transaction ID
   * For Donation type: prioritize Unit ID (user should never need Transaction ID)
   * For Deferral type: prioritize Transaction ID
   */
  onSearch(): void {
    const rawUnitId = this.transactionForm.get('unitId')?.value;
    const transactionId = this.transactionForm.get('transactionId')?.value;
    const unitId = rawUnitId ? rawUnitId.replace(/^[^a-zA-Z0-9]+/, '') : rawUnitId;

    if (this.transactionType() === 'Donation') {
      if (rawUnitId && rawUnitId.trim()) {
        this.loadTransactionDataByUnit(rawUnitId.trim());
      } else if (transactionId && transactionId.trim()) {
        this.loadTransactionData(transactionId.trim());
      } else {
        this.showError('Please enter a Unit ID');
      }
    } else {
      if (transactionId && transactionId.trim()) {
        this.loadTransactionData(transactionId.trim());
      } else if (rawUnitId && rawUnitId.trim()) {
        this.loadTransactionDataByUnit(rawUnitId.trim());
      } else {
        this.showError('Please enter either Deferral ID or Transaction ID');
      }
    }
  }

  /**
   * Retrieve - Reload data from server
   */
  onRetrieve(): void {
    const rawUnitId = this.transactionForm.get('unitId')?.value;
    const transactionId = this.transactionForm.get('transactionId')?.value;

    if (this.transactionType() === 'Donation') {
      if (rawUnitId && rawUnitId.trim()) {
        this.loadTransactionDataByUnit(rawUnitId.trim());
      } else if (transactionId && transactionId.trim()) {
        this.loadTransactionData(transactionId.trim());
      } else {
        this.showError('Please enter a Unit ID to retrieve data');
      }
    } else {
      if (transactionId && transactionId.trim()) {
        this.loadTransactionData(transactionId.trim());
      } else if (rawUnitId && rawUnitId.trim()) {
        this.loadTransactionDataByUnit(rawUnitId.trim());
      } else {
        this.showError('Please enter either Deferral ID or Transaction ID to retrieve data');
      }
    }
  }

  /**
   * Clear all form fields and reset state
   */
  onClearAll(): void {
    // Reset transaction form
    this.transactionForm.reset({
      unitId: '',
      transactionId: '',
      collectionDate: '',
      enteredBy: ''
    });

    // Reset standalone controls
    this.transactionTypeControl.setValue('Donation');
    this.entryOkControl.setValue(null);

    // Reset save form controls
    this.saveUnitIdControl.reset();
    this.saveTransactionIdControl.reset();
    this.donorSelectionControl.reset();

    // Clear all signals
    this.transactionData.set(null);
    this.gradedDonors.set([]);
    this.selectedDonorIds.set([]);
    this.error.set(null);
    this.donorRecordExpanded.set(false);
    this.resolvedStatus.set('Not Resolved');
    this.duplicateMode.set(false);
    this.transactionIdAutoPopulated.set(false);
    this.fetchedBy.set(null);
    this.originalFetchValue.set(null);
    this.donorExistsInFullTable.set(true);
    this.isNewDonorMode.set(false);
    this.entryOkConfirmed.set(false);
    this.donorSelectionEnabled.set(true);
    this.keyDataComplete.set(true);
    this.capturedIntlAddress.set(null);
    this.findDonorSearchCriteria.set(null);
    this.intlAddressActive.set(false);
  }

  /**
   * Handle Unit ID / Deferral ID blur event
   * Auto-populate Transaction ID if deferral ID is unique
   */
  onUnitIdBlur(): void {
    const unitId = this.transactionForm.get('unitId')?.value;

    if (!unitId || unitId.trim() === '') {
      // If unit ID is cleared and was auto-populated for Deferral, clear transaction ID
      if (this.transactionType() === 'Deferral' && this.transactionIdAutoPopulated()) {
        this.transactionForm.patchValue({ transactionId: '' });
        this.transactionIdAutoPopulated.set(false);
      }
      return;
    }

    if (this.transactionType() === 'Donation') {
      // Per FMB f_UNIT_ID KEY-NEXT-ITEM: auto-retrieve transaction data by Unit ID
      this.loadTransactionDataByUnit(unitId.trim());
    } else {
      // Deferral type: auto-populate Transaction ID if deferral ID is unique
      const transactionId = this.transactionForm.get('transactionId')?.value;

      // If transaction ID exists and was manually entered, don't override it
      if (transactionId && transactionId.trim() !== '' && !this.transactionIdAutoPopulated()) {
        return;
      }

      this.unitIdFieldService.validateUnitId(unitId.trim(), 'N')
        .pipe(
          catchError(() => of(null)),
          switchMap((response) => {
            let parsedId: string;
            if (response?.success && response?.item) {
              parsedId = response.item.parsedUnitId;
            } else {
              parsedId = unitId.trim().replace(/^[^a-zA-Z0-9]+/, '');
              if (parsedId.length === 15) {
                parsedId = parsedId.substring(0, 13);
              }
            }
            return this.attachDonorService.getTransactionByUnit(parsedId);
          }),
          takeUntil(this.destroy$)
        )
        .subscribe({
          next: (transaction) => {
            this.transactionForm.patchValue({
              transactionId: transaction.transactionId
            });
            this.transactionIdAutoPopulated.set(true);
          },
          error: () => {
            if (this.transactionIdAutoPopulated()) {
              this.transactionForm.patchValue({ transactionId: '' });
            }
            this.transactionIdAutoPopulated.set(false);
          }
        });
    }
  }

  /**
   * Handle Entry OK dropdown selection change
   * When user selects "N" (NO), open Find Donor dialog
   * Shows error message when value is not 'Y' or '?'
   */
  onEntryOkChange(value: EntryOkOption | null): void {
    // Clear previous error
    this.entryOkError.set(null);

    const transaction = this.transactionData();

    if (!transaction && value !== null) {
      this.snackBar.open(
        'Please retrieve a transaction first before selecting Entry OK',
        'DISMISS',
        {
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['warning-snackbar']
        }
      );
      this.entryOkControl.setValue(null);
      return;
    }

    // Gap C: Error 16062 — block Entry OK when donors already flagged as S or D
    const alreadyFlagged = this.gradedDonors().some(
      d => d.potentialDuplicateFlag === 'S' || d.potentialDuplicateFlag === 'D'
    );
    if (alreadyFlagged && value !== null) {
      this.showError('Error 16062: Transaction already has selected or duplicate-flagged donors');
      this.entryOkControl.setValue(null);
      return;
    }

    if (value === 'Y') {
      this.entryOkConfirmed.set(true);
      this.showRightDonorPresentDialog();
    } else if (value === 'N') {
      // Show informational message about what 'N' does
      this.entryOkError.set('Entry is not OK - Find Donor dialog will open to search for correct donor');
      this.entryOkConfirmed.set(true);
      this.donorSelectionEnabled.set(false);

      // Open Find Donor dialog BLANK when user selects "N" (NO)
      // Per Oracle Forms spec: Entry OK = N routes to find_donors block without prepopulated data
      this.openFindDonorDialog(transaction!.transactionId, true);
    } else if (value !== null) {
      this.entryOkError.set('Error 16063: Invalid entry check value. Expected values: Y (Yes) or N (No)');
    }
  }

  /**
   * Per FMB ENTRY_CHECK KEY-NEXT-ITEM: after Entry OK = Y, show alert
   * "Is the right donor present in the list?"
   * YES = enable donor selection; NO = disable selection, use ADD NEW DONOR
   */
  private showRightDonorPresentDialog(): void {
    const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
      width: '500px',
      disableClose: true,
      data: {
        title: 'Donor Confirmation',
        message: 'Is the right donor present in the list?',
        detail: 'WARNING: A donor selected from the list will be overwritten with the donor information ' +
          'in the Original Key Data block and will no longer exist as listed.',
        confirmText: 'YES',
        cancelText: 'NO'
      } as ConfirmActionDialogData
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result) => {
        if (result === true) {
          this.donorSelectionEnabled.set(true);
        } else {
          this.donorSelectionEnabled.set(false);
        }
      });
  }

  /**
   * Load transaction and graded donors data by Transaction ID
   */
  private loadTransactionData(transactionId: string): void {
    if (transactionId.length < 10) {
      this.showError('Transaction ID must be at least 10 characters');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    // Track that data was fetched by Transaction ID
    this.fetchedBy.set('transactionId');
    this.originalFetchValue.set(transactionId);

    // Clear save fields when loading a new transaction
    this.saveUnitIdControl.reset();
    this.saveTransactionIdControl.reset();

    // Load transaction details
    this.attachDonorService.getTransaction(transactionId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (transaction) => {
          this.transactionData.set(transaction);
          this.populateTransactionForm(transaction);
          this.loadGradedDonors(transaction.transactionId);
        },
        error: (err) => {
          this.error.set(err?.message || 'Failed to load transaction details');
          this.loading.set(false);
          this.showError(err?.message || 'Failed to load transaction details');
        }
      });
  }

  /**
   * Load transaction and graded donors data by Unit ID
   */
  private loadTransactionDataByUnit(rawUnitId: string): void {
    this.loading.set(true);
    this.error.set(null);

    // Clear save fields when loading a new transaction
    this.saveUnitIdControl.reset();
    this.saveTransactionIdControl.reset();

    // Donation type: validate format =UNITID00 (must start with = AND end with 00)
    // Deferral type: no scan format restriction
    const isDonation = this.transactionType() === 'Donation';
    if (isDonation) {
      const hasPrefix = rawUnitId.startsWith('=');
      const hasSuffix = rawUnitId.endsWith('00');
      if (!hasPrefix || !hasSuffix) {
        this.loading.set(false);
        this.showError('Invalid Unit ID format');
        return;
      }
    }

    const stripped = rawUnitId.startsWith('=') ? rawUnitId.substring(1) : rawUnitId;

    this.unitIdFieldService.validateUnitId(rawUnitId, 'N')
      .pipe(
        catchError(() => of(null)),
        switchMap((response) => {
          let parsedId: string;
          if (response?.success && response?.item) {
            parsedId = response.item.parsedUnitId;
          } else {
            parsedId = stripped;
            if (parsedId.length === 15) {
              parsedId = parsedId.substring(0, 13);
            }
          }

          this.fetchedBy.set('unitId');
          this.originalFetchValue.set(parsedId);

          return this.attachDonorService.getTransactionByUnit(parsedId);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (transaction) => {
          this.transactionData.set(transaction);
          this.populateTransactionForm(transaction);
          this.loadGradedDonors(transaction.transactionId);
        },
        error: (err) => {
          this.error.set(err?.message || 'Failed to load transaction details');
          this.loading.set(false);
          this.showError(err?.message || 'Failed to load transaction details');
        }
      });
  }

  /**
   * Populate transaction form with data
   */
  private populateTransactionForm(transaction: GradedDonationDto): void {
    this.transactionTypeControl.setValue('Donation'); // Set standalone control
    this.transactionForm.patchValue({
      unitId: transaction.unitId || '',
      collectionDate: transaction.collectionDate ? this.formatDate(transaction.collectionDate) : '',
      transactionId: transaction.transactionId || '',
      enteredBy: transaction.enteredBy || ''
    });
  }

  /**
   * Per FMB check_null_key_data: checks if lastName, DOB, and gender are ALL present.
   * If any missing, skip Entry OK and auto-open blank Find Donor dialog.
   */
  private checkNullKeyData(): void {
    if (this.entryOkConfirmed()) return;

    const transaction = this.transactionData();
    if (!transaction) return;

    const hasLastName = !!transaction.lastName?.trim();
    const hasDob = !!transaction.dateOfBirth;
    const hasGender = !!transaction.gender?.trim();

    if (hasLastName && hasDob && hasGender) {
      this.keyDataComplete.set(true);
    } else {
      this.keyDataComplete.set(false);
      this.entryOkConfirmed.set(true);
      this.donorSelectionEnabled.set(true);
    }
  }

  /**
   * Load graded donors for transaction
   */
  private loadGradedDonors(transactionId: string): void {
    this.attachDonorService.getGradedDonors(transactionId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (donors) => {
          this.gradedDonors.set(donors);
          this.loading.set(false);

          // Update resolved status based on whether a donor is already selected
          // A donor is selected if potentialDuplicateFlag === 'S'
          const selectedDonor = donors.find(d => d.potentialDuplicateFlag === 'S');
          if (selectedDonor) {
            this.resolvedStatus.set('Resolved');
          } else {
            this.resolvedStatus.set('Not Resolved');
          }

          // Per FMB check_null_key_data: if key data incomplete, skip Entry OK
          this.checkNullKeyData();
        },
        error: (err) => {
          this.error.set(err?.message || 'Failed to load graded donors');
          this.loading.set(false);
          // Don't show snackbar on error - error is displayed in template
        }
      });
  }

  /**
   * Format date for display (DD-MMM-YYYY)
   */
  formatDate(value: string | null): string {
    if (!value) return '';
    const m = moment(value);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : '';
  }

  /**
   * Select a donor (radio button selection)
   */
  onSelectDonor(donor: GradedDonorDto): void {
    if (!this.donorSelectionEnabled() && !this.duplicateMode()) {
      return;
    }

    // Defer signal update to next change detection cycle to avoid ExpressionChangedAfterItHasBeenCheckedError
    setTimeout(() => {
      if (this.duplicateMode()) {
        // Prevent selecting donors that already have a duplicate flag
        if (donor.potentialDuplicateFlag) {
          this.showError(`Cannot select ${donor.firstName} ${donor.lastName} - already marked with flag: ${donor.potentialDuplicateFlag}`);
          return;
        }

        // Toggle selection in duplicate mode
        const selected = this.selectedDonorIds();
        const index = selected.indexOf(donor.donorId);
        if (index > -1) {
          this.selectedDonorIds.set(selected.filter(id => id !== donor.donorId));
        } else {
          this.selectedDonorIds.set([...selected, donor.donorId]);
        }
      } else {
        // Single selection mode - expand donor record form and load details
        // User can update details and re-enter Unit ID to save/attach
        this.onViewDonorDetails(donor);
      }
    }, 0);
  }

  /**
   * Check if donor is selected
   */
  isDonorSelected(donor: GradedDonorDto): boolean {
    if (this.duplicateMode()) {
      return this.selectedDonorIds().includes(donor.donorId);
    }
    return this.selectedDonorId() === donor.donorId;
  }

  /**
   * View donor details (expand panel)
   */
  onViewDonorDetails(donor: GradedDonorDto): void {
    // Defer updates to next change detection cycle to avoid ExpressionChangedAfterItHasBeenCheckedError
    setTimeout(() => {
      this.donorSelectionControl.setValue(donor.donorId, { emitEvent: true });
      this.donorRecordExpanded.set(true);

      // Clear save fields when switching to a different donor
      // This prevents Transaction ID from previous donor being retained
      this.saveUnitIdControl.reset();
      this.saveTransactionIdControl.reset();

      // CRITICAL: Verify chapter context is loaded before API call
      const currentChapter = this.headerService.getCurrentChapterId();

      if (!currentChapter || currentChapter.trim() === '') {
        this.snackBar.open(
          'Chapter context not loaded. Please refresh the page or select a chapter from the header.',
          'DISMISS',
          {
            duration: 8000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          }
        );
        this.loading.set(false);
        return;
      }

      // Fetch full donor details including address information
      this.loading.set(true);
      this.attachDonorService.getDonorById(donor.donorId)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => this.loading.set(false))
        )
        .subscribe({
          next: (fullDonorData) => {
            this.donorExistsInFullTable.set(true);

            // Format phone numbers from flat API structure
            // API returns: hAreaCode/hPhoneNo (home), dAreaCode/dPhoneNo (work), mAreaCode/mPhoneNo (mobile)
            const homePhone = this.formatPhoneNumber({
              areaCode: fullDonorData.hAreaCode,
              phoneNo: fullDonorData.hPhoneNo
            });
            const workPhone = this.formatPhoneNumber({
              areaCode: fullDonorData.dAreaCode,
              phoneNo: fullDonorData.dPhoneNo
            });
            const mobilePhone = this.formatPhoneNumber({
              areaCode: fullDonorData.mAreaCode,
              phoneNo: fullDonorData.mPhoneNo
            });

            // Convert preferred contact flag (H/W/M) to form value (home/work/mobile)
            const preferredPhone = this.convertPreferredPhoneCode(fullDonorData.preferredContactFlag);

            // Populate donor record form with complete donor data (flat structure from API)
            this.donorRecordForm.patchValue({
              lastName: fullDonorData.lastName || '',
              firstName: fullDonorData.firstName || '',
              middleName: fullDonorData.middleName || '',
              alternateId: fullDonorData.alternateId || '',
              alternateType: fullDonorData.alternateIdType || '',
              dateOfBirth: fullDonorData.dateOfBirth ? new Date(fullDonorData.dateOfBirth) : null,
              gender: this.convertGenderCodeToForm(fullDonorData.gender),

              // Address Information (flat at root level)
              homeAddress: fullDonorData.streetName || '',
              apartmentNo: fullDonorData.suiteApt || '',
              city: fullDonorData.city || '',
              state: fullDonorData.state || '',
              zip: fullDonorData.zip || '',

              // Contact Information (flat at root level)
              homePhone: homePhone,
              workPhone: workPhone,
              workPhoneExtension: fullDonorData.extension ? String(fullDonorData.extension) : '',
              mobilePhone: mobilePhone,
              email: fullDonorData.email || '',
              preferredPhone: preferredPhone,

              // Employer/School Information (flat at root level)
              // API returns: employerId, empName, eCity, eState, eZip
              employerSchoolName: fullDonorData.employerId || '',
              employerCity: fullDonorData.eCity || '',
              employerState: fullDonorData.eState || '',
              employerZip: fullDonorData.eZip || '',
              ethnicGroup: fullDonorData.ethnicGroup || ''
            });

            this.intlAddressActive.set(fullDonorData.intlAddrFlag === 'Y');
            this.donorRecordForm.markAsPristine();
          },
          error: (err) => {
            this.donorExistsInFullTable.set(false);
            this.intlAddressActive.set(false);

            // Show informative message to user
            this.snackBar.open(
              `Donor ${donor.donorId} has limited information available. You can still attach this donor to the transaction.`,
              'DISMISS',
              {
                duration: 8000,
                horizontalPosition: 'end',
                verticalPosition: 'top',
                panelClass: ['info-snackbar']
              }
            );

            // Fallback: populate with basic data from GradedDonorDto
            this.donorRecordForm.patchValue({
              lastName: donor.lastName || '',
              firstName: donor.firstName || '',
              dateOfBirth: donor.dateOfBirth ? new Date(donor.dateOfBirth) : null,
              gender: this.convertGenderCodeToForm(donor.gender)
              // Address, contact, employer fields will be empty - user can fill them in
            });

            // Mark form as pristine so user changes will be tracked as dirty
            this.donorRecordForm.markAsPristine();
          }
        });
    }, 0);
  }

  /**
   * Parse donor name from API format "LastName, FirstName MiddleName" to separate fields
   * Example: "White, Joseph C" -> { lastName: "White", firstName: "Joseph", middleName: "C" }
   */
  private parseDonorName(fullName: string): { lastName: string; firstName: string; middleName: string } {
    if (!fullName || !fullName.trim()) {
      return { lastName: '', firstName: '', middleName: '' };
    }

    // Split by comma: "LastName, FirstName MiddleName"
    const parts = fullName.split(',').map(p => p.trim());
    const lastName = parts[0] || '';
    const firstAndMiddle = parts[1] || '';

    // Split first and middle names by space
    const names = firstAndMiddle.split(' ').filter(n => n.trim());
    const firstName = names[0] || '';
    const middleName = names.slice(1).join(' '); // Join remaining parts as middle name

    return { lastName, firstName, middleName };
  }

  /**
   * Format phone number from API structure { areaCode, phoneNo } to display format
   * Example: { areaCode: "606", phoneNo: "3251234" } -> "606-3251234"
   */
  private formatPhoneNumber(phone: any): string {
    if (!phone) return '';

    const areaCode = phone.areaCode || '';
    const phoneNo = phone.phoneNo || '';

    if (!areaCode && !phoneNo) return '';
    if (!areaCode) return phoneNo;
    if (!phoneNo) return areaCode;

    return `${areaCode}-${phoneNo}`;
  }

  /**
   * Parse phone number from display format to API structure
   * Example: "606-3251234" -> { areaCode: "606", phoneNo: "3251234" }
   * Handles various formats: "606-3251234", "6063251234", "3251234"
   */
  private parsePhoneNumber(phoneString: string | null | undefined): { areaCode: string; phoneNo: string } | null {
    if (!phoneString || !phoneString.trim()) {
      return null;
    }

    const cleaned = phoneString.replace(/\D/g, ''); // Remove all non-digits

    if (!cleaned) {
      return null;
    }

    // If 10 digits, assume first 3 are area code
    if (cleaned.length === 10) {
      return {
        areaCode: cleaned.substring(0, 3),
        phoneNo: cleaned.substring(3)
      };
    }

    // If 7 digits, no area code
    if (cleaned.length === 7) {
      return {
        areaCode: '',
        phoneNo: cleaned
      };
    }

    // If more than 10 digits, assume first 3 are area code and take next 7
    if (cleaned.length > 10) {
      return {
        areaCode: cleaned.substring(0, 3),
        phoneNo: cleaned.substring(3, 10)
      };
    }

    // Less than 7 digits - treat entire string as phone number
    return {
      areaCode: '',
      phoneNo: cleaned
    };
  }

  onDobInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value, this.donorRecordForm.get('dateOfBirth')
    );
  }

  onPhoneBlur(controlName: string): void {
    const phoneValue = this.donorRecordForm.get(controlName)?.value;
    if (!phoneValue) return;

    const parsed = this.parsePhoneNumber(phoneValue);
    if (parsed?.areaCode && parsed.areaCode.length === 3) {
      this.attachDonorService.validateAreaCode(parsed.areaCode)
        .pipe(takeUntil(this.destroy$))
        .subscribe(isValid => {
          if (!isValid) {
            this.showError(`Error 9207: Invalid area code: ${parsed.areaCode}`);
            this.donorRecordForm.get(controlName)?.setErrors({ invalidAreaCode: true });
          }
        });
    }
  }

  onCityBlur(): void {
    const city = this.donorRecordForm.get('city')?.value?.trim();
    if (!city || city.length < 3) return;

    this.attachDonorService.searchCities(city)
      .pipe(takeUntil(this.destroy$))
      .subscribe(results => {
        const exactMatch = results.some(r => r.description?.toUpperCase() === city.toUpperCase());
        if (!exactMatch && results.length === 0) {
          this.showError('Error 16040: City not found in valid city list');
          this.donorRecordForm.get('city')?.setErrors({ invalidCity: true });
        }
      });
  }

  /**
   * Convert input value to uppercase as user types
   */
  toUpperCase(event: Event, controlName: string): void {
    const input = event.target as HTMLInputElement;
    const upper = input.value.toUpperCase();
    if (input.value !== upper) {
      const pos = input.selectionStart;
      this.donorRecordForm.get(controlName)?.setValue(upper, { emitEvent: true });
      setTimeout(() => {
        if (input && typeof input.setSelectionRange === 'function') {
          input.setSelectionRange(pos, pos);
        }
      }, 0);
    }
  }

  /**
   * Format phone number input as user types
   * Auto-formats to ###-###-#### pattern (10 digits) or ###-#### pattern (7 digits)
   * @param event - Input event
   * @param controlName - Form control name (homePhone, workPhone, mobilePhone)
   */
  formatPhoneInput(event: Event, controlName: string): void {
    const input = event.target as HTMLInputElement;
    const allDigits = input.value.replace(/\D/g, '');

    // For work phone: if more than 10 digits, overflow extra digits into extension
    if (controlName === 'workPhone' && allDigits.length > 10) {
      const phoneDigits = allDigits.substring(0, 10);
      const extensionDigits = allDigits.substring(10);
      const formatted = `${phoneDigits.substring(0, 3)}-${phoneDigits.substring(3, 6)}-${phoneDigits.substring(6, 10)}`;
      this.donorRecordForm.get(controlName)?.setValue(formatted, { emitEvent: false });
      this.donorRecordForm.get('workPhoneExtension')?.setValue(extensionDigits, { emitEvent: false });
      setTimeout(() => {
        if (input && typeof input.setSelectionRange === 'function') {
          input.setSelectionRange(formatted.length, formatted.length);
        }
      }, 0);
      return;
    }

    let value = allDigits;
    if (value.length > 10) {
      value = value.substring(0, 10);
    }

    let formatted = '';
    if (value.length <= 3) {
      formatted = value;
    } else if (value.length <= 6) {
      formatted = `${value.substring(0, 3)}-${value.substring(3)}`;
    } else {
      formatted = `${value.substring(0, 3)}-${value.substring(3, 6)}-${value.substring(6, 10)}`;
    }

    this.donorRecordForm.get(controlName)?.setValue(formatted, { emitEvent: false });

    const cursorPosition = formatted.length;
    setTimeout(() => {
      if (input && typeof input.setSelectionRange === 'function') {
        input.setSelectionRange(cursorPosition, cursorPosition);
      }
    }, 0);
  }

  /**
   * Convert backend preferred phone code (H/W/M) to form value (home/work/mobile)
   */
  private convertPreferredPhoneCode(code: string | null | undefined): string {
    if (!code) return '';
    if (code === 'H') return 'home';
    if (code === 'W') return 'work';
    if (code === 'M') return 'mobile';
    return '';
  }

  /**
   * Convert backend gender code (M/F) to form value (Male/Female)
   */
  private convertGenderCodeToForm(code: string | null | undefined): string {
    if (!code) return '';
    const genderUpper = code.toUpperCase();
    if (genderUpper === 'M') return 'Male';
    if (genderUpper === 'F') return 'Female';
    return code; // Return as-is if unknown
  }

  /**
   * Convert form gender value (Male/Female) to backend code (M/F)
   */
  private convertGenderFormToCode(value: string | null | undefined): string {
    if (!value) return '';
    if (value === 'Male') return 'M';
    if (value === 'Female') return 'F';
    // If already a code (M/F), return as-is
    const valueUpper = value.toUpperCase();
    if (valueUpper === 'M' || valueUpper === 'F') return valueUpper;
    return value; // Return as-is if unknown
  }

  /**
   * Confirm and select donor
   */
  onConfirmSelectDonor(): void {
    const donorId = this.selectedDonorId();
    const donor = this.selectedDonor();
    const transaction = this.transactionData();

    if (!donorId || !donor) {
      this.showError('Please select a donor first');
      return;
    }

    if (!transaction) {
      this.showError('Transaction data not found');
      return;
    }

    // Check if transaction is already resolved with a different donor
    const alreadyAttachedDonor = this.gradedDonors().find(d => d.potentialDuplicateFlag === 'S');
    if (alreadyAttachedDonor && alreadyAttachedDonor.donorId !== donorId) {
      this.showError(
        `Transaction is already resolved with ${alreadyAttachedDonor.firstName} ${alreadyAttachedDonor.lastName} (${alreadyAttachedDonor.donorId}). ` +
        `Cannot attach a different donor. Please detach the current donor first or contact support.`
      );
      return;
    }

    // Show confirmation dialog
    const dialogData: ConfirmDonorDialogData = {
      donorId: donor.donorId,
      donorName: `${donor.firstName} ${donor.lastName}`
    };

    const dialogRef = this.dialog.open(ConfirmDonorDialogComponent, {
      width: '500px',
      data: dialogData,
      disableClose: true
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result: ConfirmDonorDialogResult) => {
        if (result === 'right-donor') {
          this.selectDonor(donorId);
        } else if (result === 'no') {
          // User said no, open Find Donor dialog to search for correct donor
          this.openFindDonorDialog(transaction.transactionId);
        }
      });
  }

  /**
   * Select donor and call API
   */
  private selectDonor(donorId: string): void {
    const transaction = this.transactionData();
    if (!transaction) {
      this.showError('Transaction data not available');
      return;
    }

    // Double-check if transaction is already resolved with a different donor (safety check)
    const alreadyAttachedDonor = this.gradedDonors().find(d => d.potentialDuplicateFlag === 'S');
    if (alreadyAttachedDonor && alreadyAttachedDonor.donorId !== donorId) {
      this.showError(
        `Transaction is already resolved with ${alreadyAttachedDonor.firstName} ${alreadyAttachedDonor.lastName} (${alreadyAttachedDonor.donorId}). ` +
        `Cannot attach a different donor.`
      );
      return;
    }

    // Prevent duplicate submissions
    if (this.isSubmitting()) {
      return;
    }

    this.loading.set(true);
    this.isSubmitting.set(true);

    this.attachDonorService.selectDonor({
      transactionId: transaction.transactionId,
      donorId: donorId
    })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.loading.set(false);
          this.isSubmitting.set(false);
        })
      )
      .subscribe({
        next: () => {
          this.resolvedStatus.set('Resolved');

          // Check if donor was on hold
          const held = this.heldDonor();
          if (held && held.donorId === donorId) {
            this.showSuccess('HOLD Resolved with - SELECT');
            this.heldDonor.set(null);
          } else {
            this.showSuccess('Donor selected successfully');
          }

          // Gap 7: COPY_FALSE_DUPLICATE auto-prompt — per FMB resolve_status_routine
          this.checkFalseDuplicatePrompt(donorId);
        },
        error: (err) => {
          this.showError(err?.message || 'Failed to select donor');
        }
      });
  }

  private checkFalseDuplicatePrompt(selectedDonorId: string): void {
    const donors = this.gradedDonors();
    if (donors.length !== 2) return;

    const bothLowGrade = donors.every(d => d.grade != null && d.grade <= 2);
    if (!bothLowGrade) return;

    const otherDonor = donors.find(d => d.donorId !== selectedDonorId);
    if (!otherDonor) return;

    const transaction = this.transactionData();
    if (!transaction) return;

    const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
      width: '500px',
      disableClose: true,
      data: {
        title: 'Resolve False Duplicate',
        message: 'Do you want to put donor records in Resolve False Duplicate?',
        confirmText: 'YES',
        cancelText: 'NO'
      } as ConfirmActionDialogData
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result) => {
        if (result === true) {
          this.attachDonorService.markFalseDuplicate({
            donorId: otherDonor.donorId,
            transactionId: transaction.transactionId,
            comments: 'Auto-resolved false duplicate per DRUREHLD workflow'
          })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: () => this.showSuccess('Donors marked as false duplicates'),
              error: (err) => this.showError(err?.message || 'Failed to mark false duplicate')
            });
        }
      });
  }

  /**
   * Toggle duplicate mode
   * Requires at least 2 donor records to be displayed
   */
  onToggleDuplicateMode(): void {
    const donorCount = this.gradedDonors().length;

    // Validate that at least 2 donor records exist
    if (donorCount < 2) {
      this.snackBar.open(
        'At least 2 donor records must be displayed to enable duplicate mode',
        'DISMISS',
        {
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['warning-snackbar']
        }
      );
      return;
    }

    this.duplicateMode.update(mode => !mode);
    this.selectedDonorIds.set([]);
    this.donorSelectionControl.reset();
  }

  /**
   * Mark selected donors as duplicates
   */
  onMarkDuplicates(): void {
    const selectedIds = this.selectedDonorIds();
    const transaction = this.transactionData();

    if (selectedIds.length < 2) {
      this.showError('Please select at least 2 donors to mark as duplicates');
      return;
    }

    if (!transaction) {
      this.showError('Transaction data not available');
      return;
    }

    // Check if any selected donor already has a duplicate flag
    const allDonors = this.gradedDonors();
    const alreadyMarkedDonors = selectedIds
      .map(id => allDonors.find(d => d.donorId === id))
      .filter(d => d && d.potentialDuplicateFlag);

    if (alreadyMarkedDonors.length > 0) {
      const donorNames = alreadyMarkedDonors
        .map(d => `${d!.firstName} ${d!.lastName} (${d!.donorId}) [${d!.potentialDuplicateFlag}]`)
        .join(', ');
      this.showError(
        `Cannot mark as duplicate - the following donor(s) already have a duplicate flag: ${donorNames}`
      );
      return;
    }

    // Prevent duplicate submissions
    if (this.isSubmitting()) {
      return;
    }

    this.loading.set(true);
    this.isSubmitting.set(true);

    // First donor is primary, rest are duplicates
    const [primaryDonorId, ...duplicateDonorIds] = selectedIds;

    this.attachDonorService.markDuplicates({
      primaryDonorId,
      duplicateDonorIds,
      transactionId: transaction.transactionId
    })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.loading.set(false);
          this.isSubmitting.set(false);
        })
      )
      .subscribe({
        next: (result) => {
          const count = result.data?.donorCount || duplicateDonorIds.length + 1;

          // Check if any of the marked duplicates were on hold
          const held = this.heldDonor();
          if (held && (duplicateDonorIds.includes(held.donorId) || primaryDonorId === held.donorId)) {
            // Resolving held donor with DUPLICATE
            this.showSuccess('HOLD Resolved with - DUPLICATE');
            this.heldDonor.set(null);  // Clear held donor
          } else {
            // Normal duplicate marking
            this.showSuccess(`Marked ${count} donors as duplicates`);
          }

          // Immediately update the local state to disable checkboxes before reload
          // This prevents any UI lag/flicker while waiting for the API response
          const currentDonors = this.gradedDonors();
          const updatedDonors = currentDonors.map(donor => {
            // Mark all selected donors (primary + duplicates) with 'D' flag
            if (selectedIds.includes(donor.donorId)) {
              return { ...donor, potentialDuplicateFlag: 'D' };
            }
            return donor;
          });
          this.gradedDonors.set(updatedDonors);

          this.duplicateMode.set(false);
          this.selectedDonorIds.set([]);

          // Auto-select the primary donor and expand donor record form
          const primaryDonor = currentDonors.find(d => d.donorId === primaryDonorId);
          if (primaryDonor) {
            this.onViewDonorDetails(primaryDonor);
          }

          // Small delay to ensure database commit completes before reloading
          setTimeout(() => {
            // Reload graded donors from server to get authoritative state
            this.loadGradedDonors(transaction.transactionId);
          }, 300);
        },
        error: (err) => {
          this.showError(err?.message || 'Failed to mark duplicates');
        }
      });
  }

  /**
   * Open inline new donor entry form (matches Oracle Forms PB_NEW behavior)
   */
  onAddNewDonor(): void {
    const transaction = this.transactionData();
    if (!transaction) {
      this.showError('Transaction data not available');
      return;
    }

    this.donorRecordForm.reset();
    this.donorRecordForm.markAsPristine();
    this.donorRecordForm.markAsUntouched();
    this.donorSelectionControl.reset();
    this.selectedDonorId.set(null);
    this.capturedIntlAddress.set(null);
    this.intlAddressActive.set(false);
    this.isNewDonorMode.set(true);
    this.donorRecordExpanded.set(true);
    this.saveUnitIdControl.reset();
    this.saveTransactionIdControl.reset();
  }

  /**
   * Cancel inline new donor entry
   */
  onCancelNewDonor(): void {
    this.isNewDonorMode.set(false);
    this.donorRecordExpanded.set(false);
    this.donorRecordForm.reset();
    this.capturedIntlAddress.set(null);
  }

  /**
   * Save inline new donor: create donor, add to graded donors, auto-attach
   */
  onSaveNewDonor(): void {
    const transaction = this.transactionData();
    if (!transaction) {
      this.showError('Transaction data not available');
      return;
    }

    if (this.isSubmitting()) return;

    const formValues = this.donorRecordForm.value;

    if (!formValues.lastName?.trim()) {
      this.showError('Last Name is required');
      this.donorRecordForm.markAllAsTouched();
      this.focusFirstInvalidField();
      return;
    }
    if (!formValues.firstName?.trim()) {
      this.showError('First Name is required');
      this.donorRecordForm.markAllAsTouched();
      this.focusFirstInvalidField();
      return;
    }
    if (!formValues.dateOfBirth) {
      this.showError('Date of Birth is required');
      this.donorRecordForm.markAllAsTouched();
      this.focusFirstInvalidField();
      return;
    }
    if (!formValues.gender) {
      this.showError('Sex is required');
      this.donorRecordForm.markAllAsTouched();
      this.focusFirstInvalidField();
      return;
    }

    // Gap 3: DOB age validation (err 16053)
    const dobMoment = moment(formValues.dateOfBirth);
    if (dobMoment.isValid()) {
      const chapterNow = this.chapterTimezoneService.isChapterLocalDateAvailable()
        ? this.chapterTimezoneService.getChapterLocalDate()
        : moment();
      const monthsOld = chapterNow.diff(dobMoment, 'months');
      if (monthsOld > 1500) {
        this.showError('Error 16053: Date of Birth is invalid — cannot be more than 125 years ago');
        return;
      }
    }

    // Gap 4: Err 16007 — all key fields must match original search data
    const origLastName = transaction.lastName?.trim().toUpperCase();
    if (origLastName) {
      const enteredLastName = formValues.lastName.trim().toUpperCase();
      if (enteredLastName !== origLastName) {
        this.showError('Error 16007: Entry must match original search data. Last Name must be "' + origLastName + '"');
        return;
      }
    }
    const origFirstName = transaction.firstName?.trim().toUpperCase();
    if (origFirstName) {
      const enteredFirstName = (formValues.firstName || '').trim().toUpperCase();
      if (enteredFirstName !== origFirstName) {
        this.showError('Error 16007: Entry must match original search data. First Name must be "' + origFirstName + '"');
        return;
      }
    }
    if (transaction.dateOfBirth) {
      const enteredDob = formValues.dateOfBirth ? moment(formValues.dateOfBirth).format('YYYY-MM-DD') : '';
      const origDobFormatted = moment(transaction.dateOfBirth).format('YYYY-MM-DD');
      if (enteredDob && enteredDob !== origDobFormatted) {
        this.showError('Error 16007: Entry must match original search data. Date of Birth must match.');
        return;
      }
    }
    const origGenderRaw = transaction.gender?.trim();
    if (origGenderRaw) {
      const origGender = this.convertGenderFormToCode(origGenderRaw).toUpperCase() || origGenderRaw.toUpperCase();
      const enteredGender = this.convertGenderFormToCode(formValues.gender).toUpperCase();
      if (enteredGender !== origGender) {
        this.showError('Error 16007: Entry must match original search data. Sex must match.');
        return;
      }
    }

    // Gap 6: Err 16029 — when Entry OK='N', data must match find donor search criteria
    const searchCriteria = this.findDonorSearchCriteria();
    if (searchCriteria) {
      if (searchCriteria.lastName) {
        const enteredLast = formValues.lastName.trim().toUpperCase();
        if (enteredLast !== searchCriteria.lastName.trim().toUpperCase()) {
          this.showError('Error 16029: Donor data must match find donor search criteria. Last Name mismatch.');
          return;
        }
      }
      if (searchCriteria.firstName) {
        const enteredFirst = (formValues.firstName || '').trim().toUpperCase();
        if (enteredFirst !== searchCriteria.firstName.trim().toUpperCase()) {
          this.showError('Error 16029: Donor data must match find donor search criteria. First Name mismatch.');
          return;
        }
      }
      if (searchCriteria.dob) {
        const enteredDob = formValues.dateOfBirth ? moment(formValues.dateOfBirth).format('MM/DD/YYYY') : '';
        if (enteredDob && enteredDob !== searchCriteria.dob) {
          this.showError('Error 16029: Donor data must match find donor search criteria. Date of Birth mismatch.');
          return;
        }
      }
      if (searchCriteria.sex) {
        const enteredGender = this.convertGenderFormToCode(formValues.gender).toUpperCase();
        if (enteredGender !== searchCriteria.sex.toUpperCase()) {
          this.showError('Error 16029: Donor data must match find donor search criteria. Sex mismatch.');
          return;
        }
      }
    }

    // Gap 8: Err 18067 — Extension requires work phone
    if (formValues.workPhoneExtension && formValues.workPhoneExtension.trim()) {
      if (!formValues.workPhone || !formValues.workPhone.trim()) {
        this.showError('Error 18067: Work Phone Extension requires a Work Phone Number');
        return;
      }
    }

    // Gap 11: Preferred phone requires corresponding phone number
    const preferred = formValues.preferredPhone;
    if (preferred === 'home' && (!formValues.homePhone || !formValues.homePhone.trim())) {
      this.showError('Home Phone is required when selected as preferred contact');
      return;
    }
    if (preferred === 'work' && (!formValues.workPhone || !formValues.workPhone.trim())) {
      this.showError('Work Phone is required when selected as preferred contact');
      return;
    }
    if (preferred === 'mobile' && (!formValues.mobilePhone || !formValues.mobilePhone.trim())) {
      this.showError('Mobile Phone is required when selected as preferred contact');
      return;
    }

    this.loading.set(true);
    this.isSubmitting.set(true);

    const homePhone = this.parsePhoneNumber(formValues.homePhone);
    const workPhone = this.parsePhoneNumber(formValues.workPhone);
    const mobilePhone = this.parsePhoneNumber(formValues.mobilePhone);
    const intlAddr = this.capturedIntlAddress();

    const payload = {
      lastName: (formValues.lastName || '').trim().toUpperCase(),
      firstName: (formValues.firstName || '').trim().toUpperCase(),
      middleName: (formValues.middleName || '').toUpperCase(),
      gender: this.convertGenderFormToCode(formValues.gender),
      dateOfBirth: moment(formValues.dateOfBirth).format('YYYY-MM-DD'),
      alternateId: formValues.alternateId || '',
      alternateIdType: formValues.alternateType || '',
      ethnicGroup: formValues.ethnicGroup || '',
      employerId: formValues.employerSchoolName || '',
      salutation: '',
      alias: '',
      lastNameSuffix: '',
      lang: '',
      address: {
        streetName: (formValues.homeAddress || '').trim().toUpperCase(),
        suiteApt: (formValues.apartmentNo || '').toUpperCase(),
        city: (formValues.city || '').toUpperCase(),
        zip: formValues.zip || '',
        state: formValues.state || '',
        uspsId: 0,
        hAreaCode: homePhone?.areaCode || '',
        hPhoneNo: homePhone?.phoneNo || '',
        dAreaCode: workPhone?.areaCode || '',
        dPhoneNo: workPhone?.phoneNo || '',
        extension: formValues.workPhoneExtension && formValues.workPhoneExtension.trim() ? parseInt(formValues.workPhoneExtension, 10) : null,
        mAreaCode: mobilePhone?.areaCode || '',
        mPhoneNo: mobilePhone?.phoneNo || '',
        preferredPhone: this.getPreferredPhoneCode(formValues.preferredPhone),
        email: formValues.email || '',
        employerName: this.getSelectedEmployerName(formValues.employerSchoolName),
        eCity: formValues.employerCity || '',
        eZip: formValues.employerZip || '',
        eState: formValues.employerState || '',
        intlAddrFlag: intlAddr?.intlAddrFlag || '',
        intlAddress1: intlAddr?.addr1 || '',
        intlAddress2: intlAddr?.addr2 || '',
        intlAddress3: intlAddr?.addr3 || '',
        intlAddress4: intlAddr?.addr4 || '',
        countryName: intlAddr?.country || '',
        intlPostalCode: intlAddr?.postalCode || '',
        intlHomePhoneNo: intlAddr?.homePhoneNo || '',
        intlWorkPhoneNo: intlAddr?.workPhoneNo || '',
        intlWorkPhoneExt: intlAddr?.workPhoneExt || '',
        intlMobilePhoneNo: intlAddr?.mobilePhoneNo || '',
        intlFaxNo: intlAddr?.faxNo || ''
      }
    };

    this.attachDonorService.createDonor(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            const newDonorId = Array.isArray(response.data)
              ? (response.data.length > 0 ? response.data[0]?.donorId : undefined)
              : response.data.donorId;

            if (newDonorId) {
              this.isNewDonorMode.set(false);
              this.donorRecordExpanded.set(false);
              this.capturedIntlAddress.set(null);
              this.autoAttachNewDonor(transaction.transactionId, newDonorId);
            } else {
              this.showError('Donor created but no Donor ID returned');
              this.loading.set(false);
              this.isSubmitting.set(false);
            }
          } else {
            this.showError(response.message || 'Failed to create donor');
            this.loading.set(false);
            this.isSubmitting.set(false);
          }
        },
        error: (err) => {
          this.showError(err?.message || 'Failed to create donor');
          this.loading.set(false);
          this.isSubmitting.set(false);
        }
      });
  }

  /**
   * Open Alternate Address dialog for the selected donor
   */
  onOpenAlternateAddress(): void {
    if (this.isNewDonorMode()) {
      this.openAlternateAddressDialog('NEW', undefined);
      return;
    }

    const donor = this.selectedDonor();
    if (!donor || !donor.donorId) {
      this.showError('Please select a donor first');
      return;
    }

    // Fetch existing alternate demographics data for the selected donor
    this.alternateDemographicsService.getByDonorId(donor.donorId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (existingData) => {
          this.openAlternateAddressDialog(donor.donorId, existingData ?? undefined);
        },
        error: () => {
          // Even if fetch fails, still open the dialog (it will show empty form)
          this.openAlternateAddressDialog(donor.donorId, undefined);
        }
      });
  }

  /**
   * Open the Alternate Demographics dialog
   */
  private openAlternateAddressDialog(donorId: string, existingData?: any): void {
    const dialogData: AlternateDemographicsDialogData = {
      donorId,
      existingData,
      readOnly: false
    };

    this.dialog.open(AlternateDemographicsDialogComponent, {
      width: '700px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      position: { bottom: '0px', right: '0px' },
      panelClass: 'find-donor-panel',
      data: dialogData,
      disableClose: false,
      hasBackdrop: true,
      backdropClass: 'find-donor-backdrop'
    }).afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          // Only show success if result is an object (actual save), not 'closeAll' string or undefined
          if (result && typeof result === 'object') {
            this.showSuccess('Alternate address updated successfully');
          }
        }
      });
  }

  /**
   * Open International Address dialog for the selected donor
   */
  onOpenInternationalAddress(): void {
    if (this.isNewDonorMode()) {
      this.openInternationalAddressDialog(null, null);
      return;
    }

    const donor = this.selectedDonor();
    if (!donor || !donor.donorId) {
      this.showError('Please select a donor first');
      return;
    }

    // Gap 16: err 16317 — prevent international nav when local address is populated
    const formValues = this.donorRecordForm.value;
    const hasLocalAddress = formValues.homeAddress?.trim() || formValues.city?.trim() ||
                           formValues.state?.trim() || formValues.zip?.trim();
    if (hasLocalAddress) {
      this.showError('Error 16317: Cannot open International Address when local address fields are populated. Clear local address fields first.');
      return;
    }

    this.openInternationalAddressDialog(donor.donorId, null);
  }

  /**
   * Open the International Address dialog
   * For existing donors: passes donorId with targetTable for DB save
   * For new donors: non-DB mode, captures data locally
   */
  private openInternationalAddressDialog(donorId: string | null, existingAddress: InternationalAddressModel | null): void {
    const isNewDonor = !donorId || donorId === 'NEW';
    const chapterId = this.headerService.getCurrentChapterId() || '';

    const dialogData: InternationalAddressDialogData = {
      existingAddress: existingAddress || this.capturedIntlAddress() || null,
      targetTable: isNewDonor ? null : 'DONOR_ADDRESSES',
      recordKeyValues: isNewDonor ? [] : [donorId!],
      chapterId,
      existingAddressId: null
    };

    this.dialog.open(InternationalAddressDialogComponent, {
      width: '600px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      position: { bottom: '0px', right: '0px' },
      panelClass: 'find-donor-panel',
      data: dialogData,
      disableClose: false,
      hasBackdrop: true,
      backdropClass: 'find-donor-backdrop'
    }).afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result: any) => {
          if (result) {
            if (isNewDonor) {
              this.capturedIntlAddress.set(result);
            }
            this.intlAddressActive.set(true);
            this.showSuccess('International address saved successfully');
          }
        }
      });
  }

  /**
   * Open Find Donor dialog when no graded donors found
   * Opens as right-side drawer matching Figma design
   */
  private openFindDonorDialog(transactionId: string, blank = false): void {
    const transaction = this.transactionData();
    const unitId = transaction?.unitId;

    let searchOnOpen: FindDonorDialogData['searchOnOpen'];

    if (!blank) {
      const hasDemographics = transaction?.lastName || transaction?.firstName ||
        transaction?.dateOfBirth || transaction?.gender;

      searchOnOpen = hasDemographics
        ? {
            lastName: transaction?.lastName || undefined,
            firstName: transaction?.firstName || undefined,
            dob: transaction?.dateOfBirth
              ? moment(transaction.dateOfBirth).format('MM/DD/YYYY')
              : undefined,
            sex: transaction?.gender || undefined
          }
        : unitId ? { unitId } : undefined;
    }

    // Gap 6: Capture search criteria for err 16029 validation when Entry OK = 'N'
    if (searchOnOpen && (searchOnOpen as any).lastName) {
      this.findDonorSearchCriteria.set({
        lastName: (searchOnOpen as any).lastName,
        firstName: (searchOnOpen as any).firstName,
        dob: (searchOnOpen as any).dob,
        sex: (searchOnOpen as any).sex
      });
    }

    const dialogData: FindDonorDialogData = {
      mode: 'add',
      programName: 'DRUREHLD',
      searchOnOpen
    };

    this.dialog.open(FindDonorDialog, {
      width: '1184px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      position: { bottom: '0px', right: '0px' },
      panelClass: 'find-donor-panel',
      data: dialogData,
      disableClose: false,
      hasBackdrop: true,
      backdropClass: 'find-donor-backdrop'
    }).afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result: FindDonorDialogResult) => {
          if (result?.action === 'select' && result.donor) {
            // User found and selected a donor from Find Donor — re-enable selection
            this.donorSelectionEnabled.set(true);
            this.loadGradedDonors(transactionId);
          } else if (result?.action === 'hold' && result.donor) {
            // User clicked HOLD - call API to put donor on hold
            this.attachDonorService.putDonorOnHold(result.donor.donorId!, transactionId)
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: () => {
                  // Store held donor for resolution snackbar messages
                  this.heldDonor.set({
                    donorId: result.donor!.donorId ?? '',
                    lastName: result.donor!.lastName ?? '',
                    firstName: result.donor!.firstName ?? '',
                    dateOfBirth: (result.donor!.dob ?? null) as string | null,
                    sex: result.donor!.sex ?? null,
                    alternateId: result.donor!.alternateId ?? null
                  });
                  this.showSuccess('Donor put on hold successfully');
                  // Reload graded donors to show updated status
                  this.loadGradedDonors(transactionId);
                },
                error: (err) => {
                  this.showError(err?.message || 'Failed to put donor on hold');
                }
              });
          } else if (result?.action === 'new') {
            this.onAddNewDonor();
          }
        }
      });
  }

  /**
   * Show donor list help dialog
   * Displays information about active/inactive donor lists
   */
  onShowDonorListHelp(): void {
    this.dialog.open(DonorListHelpDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
      panelClass: 'donor-list-help-panel',
      disableClose: false,
      hasBackdrop: true,
      backdropClass: 'donor-list-help-backdrop'
    });
  }

  /**
   * Mark donor as false duplicate (requires comments)
   */
  onMarkFalseDuplicate(donor: GradedDonorDto): void {
    const transaction = this.transactionData();
    if (!transaction) {
      this.showError('Transaction data not available');
      return;
    }

    import('./dialogs/comments-input-dialog/comments-input-dialog').then((m) => {
      this.dialog.open(m.CommentsInputDialogComponent, {
        width: '450px',
        disableClose: true,
        data: {
          title: 'Mark as False Duplicate',
          message: `Enter reason for marking donor ${donor.donorId} (${donor.firstName} ${donor.lastName}) as false duplicate:`,
          placeholder: 'Reason / Comments',
          confirmText: 'MARK FALSE DUPLICATE',
          cancelText: 'CANCEL'
        }
      }).afterClosed()
        .pipe(takeUntil(this.destroy$))
        .subscribe((comments: string | null) => {
          if (!comments) return;

          this.loading.set(true);
          this.attachDonorService.markFalseDuplicate({
            donorId: donor.donorId,
            transactionId: transaction.transactionId,
            comments
          })
            .pipe(
              takeUntil(this.destroy$),
              finalize(() => this.loading.set(false))
            )
            .subscribe({
              next: () => {
                this.showSuccess('Donor marked as false duplicate');
                this.loadGradedDonors(transaction.transactionId);
              },
              error: (err) => {
                this.showError(err?.message || 'Failed to mark false duplicate');
              }
            });
        });
    });
  }

  /**
   * Save donor record by re-entering the same Unit ID or Transaction ID
   * Validates that the re-entered value matches the original fetch value
   * Two-step process:
   * 1. Update donor personal information (PUT /api/v1/donors/{donorId})
   * 2. Attach donor to transaction (POST /api/v1/attach-donor/select-donor)
   */
  onSaveDonorRecord(): void {
    // Prevent multiple simultaneous saves
    if (this.isSubmitting() || this.loading()) {
      return;
    }

    const fetchedBy = this.fetchedBy();
    const originalValue = this.originalFetchValue();
    const saveUnitId = this.saveUnitIdControl.value?.trim() || '';
    const saveTransactionId = this.saveTransactionIdControl.value?.trim() || '';

    // If both fields are empty, user just tabbed through - don't do anything
    if (!saveUnitId && !saveTransactionId) {
      return;
    }

    // Validation: Must have been fetched first
    if (!fetchedBy || !originalValue) {
      this.showError('Please fetch transaction data first before saving');
      return;
    }

    // For Donation type: ALWAYS use Unit ID for save confirmation (never Transaction ID)
    // For Deferral type: use Transaction ID
    const isDeferral = this.transactionType() === 'Deferral';
    const transaction = this.transactionData();
    const originalUnitId = transaction?.unitId || this.transactionForm.get('unitId')?.value?.trim() || '';

    if (!isDeferral) {
      if (!saveUnitId) {
        return;
      }
      if (saveUnitId !== originalUnitId && saveUnitId !== originalValue) {
        this.showError(`Unit ID does not match. Expected: ${originalUnitId}`);
        return;
      }
    } else {
      if (!saveTransactionId) {
        return;
      }
      if (saveTransactionId !== originalValue) {
        this.showError(`Transaction ID does not match. Expected: ${originalValue}`);
        return;
      }
    }

    // Validation passed - proceed with save
    const donor = this.selectedDonor();
    if (!donor || !transaction) {
      this.showError('Please select a donor first');
      return;
    }

    // Prepare donor update payload matching API specification
    const formValues = this.donorRecordForm.value;

    // Gap 3: DOB age validation (err 16053)
    if (formValues.dateOfBirth) {
      const dobMoment = moment(formValues.dateOfBirth);
      const chapterNow = this.chapterTimezoneService.isChapterLocalDateAvailable()
        ? this.chapterTimezoneService.getChapterLocalDate()
        : moment();
      if (dobMoment.isValid() && chapterNow.diff(dobMoment, 'months') > 1500) {
        this.showError('Error 16053: Date of Birth is invalid — cannot be more than 125 years ago');
        return;
      }
    }

    // Gap 8: Err 18067 — Extension requires work phone
    if (formValues.workPhoneExtension && formValues.workPhoneExtension.trim()) {
      if (!formValues.workPhone || !formValues.workPhone.trim()) {
        this.showError('Error 18067: Work Phone Extension requires a Work Phone Number');
        return;
      }
    }

    // Gap 11: Preferred phone requires corresponding phone number
    const preferred = formValues.preferredPhone;
    if (preferred === 'home' && (!formValues.homePhone || !formValues.homePhone.trim())) {
      this.showError('Home Phone is required when selected as preferred contact');
      return;
    }
    if (preferred === 'work' && (!formValues.workPhone || !formValues.workPhone.trim())) {
      this.showError('Work Phone is required when selected as preferred contact');
      return;
    }
    if (preferred === 'mobile' && (!formValues.mobilePhone || !formValues.mobilePhone.trim())) {
      this.showError('Mobile Phone is required when selected as preferred contact');
      return;
    }

    this.loading.set(true);
    this.isSubmitting.set(true);
    const donorExistsInDB = this.donorExistsInFullTable();
    const hasFormChanges = this.donorRecordForm.dirty;

    // If donor doesn't exist AND form has no changes, skip update and go directly to attach
    if (!donorExistsInDB && !hasFormChanges) {
      this.attachDonorToTransaction(transaction.transactionId, donor.donorId);
      return;
    }

    // If form has no changes (regardless of donor existence), skip update and go to attach
    if (!hasFormChanges) {
      this.attachDonorToTransaction(transaction.transactionId, donor.donorId);
      return;
    }

    // Validate required fields before building payload (only if updating)
    if (!formValues.homeAddress || !formValues.homeAddress.trim()) {
      this.showError('Street Name (Home Address) is required. Please fill it in before saving.');
      this.loading.set(false);
      this.isSubmitting.set(false);
      return;
    }

    // Validate required fields before building payload (only if updating)
    if (!formValues.city || !formValues.city.trim()) {
      this.showError('City is required. Please fill it in before saving.');
      this.loading.set(false);
      this.isSubmitting.set(false);
      return;
    }

    // Parse phone numbers from form values
    const homePhone = this.parsePhoneNumber(formValues.homePhone);
    const workPhone = this.parsePhoneNumber(formValues.workPhone);
    const mobilePhone = this.parsePhoneNumber(formValues.mobilePhone);

    const updatePayload = {
      lastName: (formValues.lastName || donor.lastName || '').toUpperCase(),
      firstName: (formValues.firstName || donor.firstName || '').toUpperCase(),
      middleName: (formValues.middleName || '').toUpperCase(),
      gender: this.convertGenderFormToCode(formValues.gender) || this.convertGenderFormToCode(donor.gender),
      dateOfBirth: formValues.dateOfBirth
        ? moment(formValues.dateOfBirth).format('YYYY-MM-DD')
        : donor.dateOfBirth,
      alternateId: formValues.alternateId || '',
      alternateIdType: formValues.alternateType || '',
      employerId: formValues.employerSchoolName || '',
      address: {
        streetName: (formValues.homeAddress || '').trim().toUpperCase(),
        suiteApt: (formValues.apartmentNo || '').toUpperCase(),
        city: (formValues.city || '').toUpperCase(),
        state: formValues.state || '',
        zip: formValues.zip || '',
        uspsId: 0,

        // Phone numbers (inside address object per API spec)
        hAreaCode: homePhone?.areaCode || '',
        hPhoneNo: homePhone?.phoneNo || '',
        dAreaCode: workPhone?.areaCode || '',
        dPhoneNo: workPhone?.phoneNo || '',
        extension: formValues.workPhoneExtension && formValues.workPhoneExtension.trim() ? parseInt(formValues.workPhoneExtension, 10) : null,
        mAreaCode: mobilePhone?.areaCode || '',
        mPhoneNo: mobilePhone?.phoneNo || '',
        preferredPhone: this.getPreferredPhoneCode(formValues.preferredPhone),

        // Email (inside address object per API spec)
        email: formValues.email || '',

        // Employer information (inside address object per API spec)
        employerName: this.getSelectedEmployerName(formValues.employerSchoolName),
        eCity: formValues.employerCity || '',
        eZip: formValues.employerZip || '',
        eState: formValues.employerState || '',

        // International address fields (empty for now)
        intlAddrFlag: '',
        intlAddress1: '',
        intlAddress2: '',
        intlAddress3: '',
        intlAddress4: '',
        countryName: '',
        intlPostalCode: '',
        intlWorkPhoneNo: '',
        intlWorkPhoneExt: '',
        intlHomePhoneNo: '',
        intlMobilePhoneNo: '',
        intlFaxNo: ''
      },
      phones: {
        home: { areaCode: homePhone?.areaCode || '', phoneNo: homePhone?.phoneNo || '' },
        work: {
          areaCode: workPhone?.areaCode || '',
          phoneNo: workPhone?.phoneNo || '',
          extension: formValues.workPhoneExtension && formValues.workPhoneExtension.trim() ? parseInt(formValues.workPhoneExtension, 10) : null
        },
        mobile: { areaCode: mobilePhone?.areaCode || '', phoneNo: mobilePhone?.phoneNo || '' },
        preferredContact: this.getPreferredPhoneCode(formValues.preferredPhone)
      },
      email: formValues.email || '',
      personalInfo: {
        language: '',
        alias: '',
        lastNameSuffix: '',
        ethnicGroup: formValues.ethnicGroup || '',
        salutation: ''
      }
    };

    // Step 1: Update donor personal information (form has changes at this point)
    this.attachDonorService.updateDonor(donor.donorId, updatePayload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updateResult) => {
          if (updateResult.success) {
            // Step 2: After successful update, attach donor to transaction
            this.attachDonorToTransaction(transaction.transactionId, donor.donorId);
          } else {
            this.showError(updateResult.message || 'Failed to update donor information');
            this.loading.set(false);
            this.isSubmitting.set(false);
          }
        },
        error: (err) => {
          // If donor doesn't exist (404) or endpoint not implemented, still proceed to attach
          if (err?.status === 404) {
            // Proceed to Step 2 even if update fails
            this.attachDonorToTransaction(transaction.transactionId, donor.donorId);
          } else {
            // Extract the most detailed error message available
            const errorMessage = err?.error?.message
              || err?.error?.errorResponse?.error
              || err?.message
              || 'Failed to update donor information';

            this.showError(errorMessage);
            this.loading.set(false);
            this.isSubmitting.set(false);
          }
        }
      })
  }

  /**
   * Helper method to attach donor to transaction (Step 2 of save process)
   */
  private attachDonorToTransaction(transactionId: string, donorId: string): void {
    // Check if donor is already selected
    const donor = this.gradedDonors().find(d => d.donorId === donorId);
    if (donor && donor.potentialDuplicateFlag === 'S') {
      this.showSuccess('Donor information saved successfully. Donor is already attached to this transaction.');
      this.loading.set(false);
      this.isSubmitting.set(false);
      this.onClearAll();
      return;
    }

    const selectRequest = {
      transactionId,
      donorId
    };

    this.loading.set(true);
    this.isSubmitting.set(true);

    this.attachDonorService.selectDonor(selectRequest)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.loading.set(false);
          this.isSubmitting.set(false);
        })
      )
      .subscribe({
        next: (selectResult) => {
          if (selectResult.success) {
            this.showSuccess('Donor information saved and attached successfully');
            this.onClearAll();
          } else {
            this.showError(selectResult.message || 'Failed to attach donor to transaction');
          }
        },
        error: (err) => {
          // Handle specific error codes
          const errorCode = err?.errorCode || err?.error?.errorCode || err?.error?.errorResponse?.errorCode;

          // Error 16022: Donor already attached - treat as success
          if (errorCode === '16022') {
            this.showSuccess('Donor is already attached to this transaction');
            this.onClearAll();
          } else {
            this.showError(err?.message || 'Failed to attach donor to transaction');
          }
        }
      });
  }

  /**
   * Focus the first invalid field in the donor record form (WCAG 3.3.1)
   * Helps screen reader users find and correct validation errors
   */
  private focusFirstInvalidField(): void {
    const firstInvalidControl = Object.keys(this.donorRecordForm.controls)
      .find(key => this.donorRecordForm.controls[key].invalid);
    if (firstInvalidControl) {
      const el = document.querySelector(`[formControlName="${firstInvalidControl}"]`) as HTMLElement;
      if (el) el.focus();
    }
  }

  /**
   * Get mismatch cells for a donor
   */
  getMismatchCells(donor: GradedDonorDto): string[] {
    const mismatches: string[] = [];
    if (donor.lastNameMismatch) mismatches.push('lastName');
    if (donor.firstNameMismatch) mismatches.push('firstName');
    if (donor.dateOfBirthMismatch) mismatches.push('dateOfBirth');
    if (donor.genderMismatch) mismatches.push('gender');
    return mismatches;
  }

  /**
   * Check if cell has mismatch
   */
  hasMismatch(donor: GradedDonorDto, column: string): boolean {
    return this.getMismatchCells(donor).includes(column);
  }

  /**
   * Show success snackbar
   */
  private showSuccess(message: string): void {
    this.snackBar.open(message, 'DISMISS', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
  }

  /**
   * Show error snackbar
   */
  private showError(message: string): void {
    this.snackBar.open(message, 'DISMISS', {
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }

  /**
   * Get original key data for display
   */
  get originalKeyData(): string {
    const transaction = this.transactionData();
    if (!transaction) return '';

    let lastName = transaction.lastName;
    let firstName = transaction.firstName;
    let dateOfBirth = transaction.dateOfBirth;
    let genderCode = transaction.gender;

    if (!lastName && !firstName && !dateOfBirth && !genderCode) {
      const donors = this.gradedDonors();
      const donor = this.selectedDonor() || (donors.length > 0 ? donors[0] : null);
      if (donor) {
        lastName = donor.lastName;
        firstName = donor.firstName;
        dateOfBirth = donor.dateOfBirth;
        genderCode = donor.gender;
      }
    }

    const gender = this.getFullGenderText(genderCode);
    const parts = [
      lastName || '',
      firstName || '',
      dateOfBirth ? this.formatDate(dateOfBirth) : '',
      gender
    ].filter(p => p);

    return parts.join(' ');
  }

  /**
   * Convert gender code to full text
   */
  private getFullGenderText(gender: string | null | undefined): string {
    if (!gender) return '';
    const genderUpper = gender.toUpperCase();
    if (genderUpper === 'M') return 'Male';
    if (genderUpper === 'F') return 'Female';
    return gender;
  }

  onViewPhlebotomyDetails(): void {
    const transaction = this.transactionData();

    if (!transaction) {
      this.snackBar.open(
        'Please retrieve a transaction first before viewing phlebotomy details',
        'DISMISS',
        {
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['warning-snackbar']
        }
      );
      return;
    }

    const unitId = transaction.unitId || this.transactionForm.get('unitId')?.value;
    const collDate = transaction.collectionDate
      ? moment(transaction.collectionDate).format('YYYY-MM-DD')
      : undefined;

    const dialogData: PhlebotomyDetailsDialogInput = {
      transactionId: transaction.transactionId,
      unitId: unitId || '',
      collDate,
    };

    this.dialog.open(AttachDonorPhlebotomyDetailsDialogComponent, {
      width: '1000px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      data: dialogData,
      disableClose: false,
      autoFocus: false,
      panelClass: 'code-dialog-panel-right',
      position: { right: '0', top: '64px' },
      hasBackdrop: true,
      backdropClass: 'code-dialog-backdrop',
    });
  }
}
