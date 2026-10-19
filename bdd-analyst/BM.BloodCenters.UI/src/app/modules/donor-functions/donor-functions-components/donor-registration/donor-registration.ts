import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  HostListener,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  FormControl,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule, MatDatepicker } from '@angular/material/datepicker';
import { MatCardModule } from '@angular/material/card';
import { MatRadioModule } from '@angular/material/radio';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { Observable, Subject, takeUntil, forkJoin, distinctUntilChanged, debounceTime, switchMap, of, catchError, finalize } from 'rxjs';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import moment from 'moment';

import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { ValidMasterCodesService } from '@shared/services/valid-master-codes.service';
import { FindDonorDialog } from '@shared/components/find-donor/find-donor';
import { FindDonorDialogData, FindDonorDialogResult, FindDonorResult, FindDonorNewData, FindDonorSearchCriteria } from '@shared/components/find-donor/find-donor.model';
import { InternationalAddressDialogComponent } from '@shared/components/international-address-dialog/international-address-dialog.component';
import { InternationalAddressModel } from '@shared/models/international-address.model';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { UnitIdFieldComponent, UnitIdPostValidateEvent } from '@shared/components/unit-id-field/unit-id-field.component';
import { UnitValidationResponse as SharedUnitValidationResponse } from '@shared/components/unit-id-field/unit-id-field.model';
import { UnitIdDisplayUtility } from '@shared/components/UnitIdDisplayUtility/unit-id-display.utility';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner.component';

import { DonorRegistrationService } from './services/donor-registration.service';
import {
  DonorRegistrationMode,
  ContentSection,
  ContentNavItem,
  DriveLookupDto,
  ProcedureCodeLookupDto,
  VenipunctureCodeLookupDto,
  EmployeeLookupDto,
  InterdictionCodeLookupDto,
  EmployerLookupDto,
  RegisterDonationDto,
  CreateRegisterDonationRequest,
  EthnicGroupLookupDto,
  AlternateTypeLookupDto,
  UnitValidationResponse,
  DonationTypeLookupDto,
  SponsorLookupDto,
  CityStateLookupDto,
  CodeDescriptionDto,
  DeferralReasonLookupDto,
  BleedTimeDetailsDialogResult,
  BleedTimeDetailsDialogData,
  ManualHoldsDialogResult,
  CreateDonorRequest,
  FieldValidationResult,
} from './models/donor-registration.model';
import { ManualHoldsDialog } from './dialogs/manual-holds-dialog/manual-holds-dialog';
import { AddEmployerDialog } from '../../registration/registration-maintenance/maintain-donor-employer/add-employer-dialog/add-employer-dialog';
import { BleedTimeDetailsDialog } from '@shared/components/bleed-time-details-dialog/bleed-time-details-dialog';
import { AlternateDemographicsDialogComponent } from '@shared/components/alternate-demographics-dialog/alternate-demographics-dialog.component';
import { AlternateDemographicsDialogData, AlternateDemographicsModel } from '@shared/models/alternate-demographics.model';
import { AlternateDemographicsService } from '@shared/services/alternate-demographics.service';
import { DonorAddress, DonorDemographics } from '../../registration/registration-general-functions/register-deferral/models/register-deferral.model';

@Component({
  selector: 'app-donor-registration',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatCardModule,
    MatRadioModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatTooltipModule,
    MatMomentDateModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    LoadingSpinnerComponent,
    UnitIdFieldComponent,
    AddEmployerDialog,
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    {
      provide: DateAdapter,
      useClass: ChapterAwareDateAdapter,
      deps: [MAT_DATE_LOCALE],
    },
  ],
  templateUrl: './donor-registration.html',
  styleUrl: './donor-registration.scss',
})
export class DonorRegistration implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('formContainer') formContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('driveDatePicker') driveDatePicker!: MatDatepicker<moment.Moment>;
  @ViewChild('armSelect') armSelect!: MatSelect;
  @ViewChild('unitIdField') unitIdField?: UnitIdFieldComponent;
  @ViewChild('donationUnitIdField') donationUnitIdField?: UnitIdFieldComponent;
  @ViewChild('previousUnitIdField') previousUnitIdField?: UnitIdFieldComponent;
  @ViewChild('voidUnitIdField') voidUnitIdField?: UnitIdFieldComponent;

  private lastActiveField: string | null = null;

  @HostListener('document:focusin', ['$event'])
  onGlobalFocusIn(event: Event): void {
    const target = event.target as HTMLElement;
    const fieldName = this.getFieldNameFromTarget(target);
    if (fieldName) {
      const isInSearchForm = fieldName === 'driveDate' || fieldName === 'driveId';
      const isInRegistrationForm = this.fieldSequence.some(f => f.name === fieldName);
      if (isInSearchForm || isInRegistrationForm) {
        this.lastActiveField = fieldName;
      }
    }
  }

  @HostListener('document:keydown.tab', ['$event'])
  @HostListener('document:keydown.enter', ['$event'])
  onGlobalKeyRedirect(event: Event): void {
    const keyEvent = event as KeyboardEvent;
    if (keyEvent.shiftKey) return;
    const target = event.target as HTMLElement;

    if (target.closest('.cdk-overlay-container')) return;

    const fieldName = this.getFieldNameFromTarget(target);
    const isInSearchForm = fieldName === 'driveDate' || fieldName === 'driveId';
    const isInRegistrationForm = fieldName && this.fieldSequence.some(f => f.name === fieldName);

    if (isInSearchForm || isInRegistrationForm) return;

    event.preventDefault();

    if (this.mode() === 'add') {
      const activeField = this.getActiveField();
      if (activeField) {
        this.focusField(activeField);
        return;
      }
    }

    const driveDateCtrl = this.searchForm?.get('driveDate');
    if (!driveDateCtrl?.value) {
      this.focusField('driveDate');
      return;
    }

    const driveIdCtrl = this.searchForm?.get('driveId');
    if (!driveIdCtrl?.value) {
      setTimeout(() => {
        const el = document.querySelector('[formControlName="driveId"]') as HTMLElement;
        el?.focus();
      });
    }
  }

  private readonly destroy$ = new Subject<void>();
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly donorService = inject(DonorRegistrationService);
  private readonly headerService = inject(HeaderService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly masterCodesService = inject(ValidMasterCodesService);
  private readonly altDemoService = inject(AlternateDemographicsService);

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: 'Register Donation' },
    ],
    actions: [],
  };

  mode = signal<DonorRegistrationMode>('search');
  isLoading = signal(false);
  activeSection = signal<ContentSection>('donor');

  selectedDriveId = signal<string>('');
  drives = signal<DriveLookupDto[]>([]);
  procedureCodes = signal<ProcedureCodeLookupDto[]>([]);
  venipunctureCodes = signal<VenipunctureCodeLookupDto[]>([]);
  employees = signal<EmployeeLookupDto[]>([]);
  interdictionCodes = signal<InterdictionCodeLookupDto[]>([]);
  ethnicGroups = signal<EthnicGroupLookupDto[]>([]);
  alternateTypes = signal<AlternateTypeLookupDto[]>([]);
  donationTypes = signal<DonationTypeLookupDto[]>([]);
  sponsors = signal<SponsorLookupDto[]>([]);
  private selectedSponsor = signal<SponsorLookupDto | null>(null);
  equipmentTypes = signal<CodeDescriptionDto[]>([]);
  reactionCodesList = signal<CodeDescriptionDto[]>([]);
  deferralReasons = signal<DeferralReasonLookupDto[]>([]);

  readonly deferralTypes: CodeDescriptionDto[] = [
    { code: 'IND', description: 'Indefinite' },
    { code: 'NA', description: 'Not Applicable' },
    { code: '99', description: 'Unknown' },
  ];

  currentDonation = signal<RegisterDonationDto | null>(null);
  hasInternationalAddress = signal(false);
  private readonly selectedUspsId = signal<number | null>(null);
  private readonly selectedEUspsId = signal<number | null>(null);

  driveDateDoubleEntry: 'idle' | 'pending' = 'idle';
  private pendingDriveDate: string | null = null;
  private lastConfirmedDriveDate: string | null = null;
  driveDateMismatchError: string | null = null;

  private attachDonorReturnUrl: string | null = null;
  private attachDonorTransactionId: string | null = null;
  private newDonorExpected: FindDonorNewData | null = null;
  donorMismatchErrors: Record<string, string> = {};
  isExistingDonor = signal(false);
  private readonly existingDonorLockedFields = ['lastName', 'firstName', 'dob', 'sex'];
  private findDonorValues: {
    lastName?: string;
    firstName?: string;
    dob?: string;
    sex?: string;
    alternateId?: string;
    alternateIdType?: string;
  } | null = null;

  // Button disable states
  isAddressButtonsDisabled = true;
  isEmployerButtonsDisabled = true;
  isHoldsButtonDisabled = true;
  showAddEmployerPanel = false;

  searchForm!: FormGroup;
  registrationForm!: FormGroup;

  driveSearchControl = new FormControl('');
  ethnicGroupSearchControl = new FormControl('');
  donationSearchControl = new FormControl('');
  procedureSearchControl = new FormControl('');
  physicalIdSearchControl = new FormControl('');
  deferralSearchControl = new FormControl('');
  reviewerSearchControl = new FormControl('');
  venipunctureSearchControl = new FormControl('');
  employerSearchControl = new FormControl('');
  filteredEmployers = signal<EmployerLookupDto[]>([]);
  citySearchControl = new FormControl('');
  filteredCities = signal<CityStateLookupDto[]>([]);
  stateDisplay = signal('--');
  employerStateDisplay = signal('--');
  lookupIdSearchControl = new FormControl('');
  equipTypeSearchControl = new FormControl('');
  reactionSearchControl = new FormControl('');
  materialVerifSearchControl = new FormControl('');
  historianSearchControl = new FormControl('');
  altSponsorSearchControl = new FormControl('');
  armUsedSearchControl = new FormControl('');
  deferralTypeSearchControl = new FormControl('');
  employerCitySearchControl = new FormControl('');
  filteredEmployerCities = signal<CityStateLookupDto[]>([]);

  // Search term signals for reactive computed filtering (FormControl.value is NOT reactive in computed())
  private driveSearchTerm = signal('');
  private ethnicGroupSearchTerm = signal('');
  private donationSearchTerm = signal('');
  private procedureSearchTerm = signal('');
  private physicalSearchTerm = signal('');
  private deferralSearchTerm = signal('');
  private reviewerSearchTerm = signal('');
  private venipunctureSearchTerm = signal('');
  private lookupSearchTerm = signal('');
  private equipTypeSearchTerm = signal('');
  private reactionSearchTerm = signal('');
  private materialSearchTerm = signal('');
  private historianSearchTerm = signal('');
  private deferralTypeSearchTerm = signal('');


  readonly contentSections: ContentNavItem[] = [
    { id: 'donor', label: 'Donor Information' },
    { id: 'personal', label: 'Personal Information' },
    { id: 'address', label: 'Address Information' },
    { id: 'contact', label: 'Contact Information' },
    { id: 'employer', label: 'Employer/School Information' },
    { id: 'donation', label: 'Donation Information' },
  ];

  selectedDriveName = computed(() => {
    const driveId = this.selectedDriveId();
    const drive = this.drives().find((d) => d.driveId === driveId);
    return drive?.sponsorName ?? '--';
  });

  filteredDrives = computed(() => {
    const search = this.driveSearchTerm().toLowerCase();
    const list = this.drives();
    if (!search) return list;
    return list.filter(
      (d) =>
        d.driveId.toLowerCase().includes(search) ||
        (d.sponsorName ?? '').toLowerCase().includes(search)
    );
  });

  filteredEthnicGroups = computed(() => {
    const search = this.ethnicGroupSearchTerm().toLowerCase();
    const list = this.ethnicGroups();
    if (!search) return list;
    return list.filter(
      (g) =>
        g.code.toLowerCase().includes(search) ||
        (g.description ?? '').toLowerCase().includes(search)
    );
  });

  filteredProcedureCodes = computed(() => {
    const search = this.procedureSearchTerm().toLowerCase();
    const list = this.procedureCodes();
    if (!search) return list;
    return list.filter(
      (p) =>
        p.procedureCode.toLowerCase().includes(search) ||
        (p.description ?? '').toLowerCase().includes(search)
    );
  });

  filteredVenipunctureCodes = computed(() => {
    const search = this.venipunctureSearchTerm().toLowerCase();
    const list = this.venipunctureCodes();
    if (!search) return list;
    return list.filter(
      (v) =>
        v.code.toLowerCase().includes(search) ||
        (v.description ?? '').toLowerCase().includes(search)
    );
  });

  filteredEmployees = computed(() => {
    const search = this.reviewerSearchTerm().toLowerCase();
    const list = this.employees();
    if (!search) return list;
    return list.filter(
      (e) =>
        e.staffNo.toLowerCase().includes(search) ||
        (e.employeeName ?? '').toLowerCase().includes(search)
    );
  });

  filteredLookupEmployees = computed(() => {
    const search = this.lookupSearchTerm().toLowerCase();
    const list = this.employees();
    if (!search) return list;
    return list.filter(
      (e) =>
        e.staffNo.toLowerCase().includes(search) ||
        (e.employeeName ?? '').toLowerCase().includes(search)
    );
  });

  filteredPhysicalEmployees = computed(() => {
    const search = this.physicalSearchTerm().toLowerCase();
    const list = this.employees();
    if (!search) return list;
    return list.filter(
      (e) =>
        e.staffNo.toLowerCase().includes(search) ||
        (e.employeeName ?? '').toLowerCase().includes(search)
    );
  });

  filteredHistorianEmployees = computed(() => {
    const search = this.historianSearchTerm().toLowerCase();
    const list = this.employees();
    if (!search) return list;
    return list.filter(
      (e) =>
        e.staffNo.toLowerCase().includes(search) ||
        (e.employeeName ?? '').toLowerCase().includes(search)
    );
  });

  filteredMaterialEmployees = computed(() => {
    const search = this.materialSearchTerm().toLowerCase();
    const list = this.employees();
    if (!search) return list;
    return list.filter(
      (e) =>
        e.staffNo.toLowerCase().includes(search) ||
        (e.employeeName ?? '').toLowerCase().includes(search)
    );
  });

  filteredDonationTypes = computed(() => {
    const search = this.donationSearchTerm().toLowerCase();
    const list = this.donationTypes();
    if (!search) return list;
    return list.filter(
      (d) =>
        d.donationType.toLowerCase().includes(search) ||
        (d.description ?? '').toLowerCase().includes(search)
    );
  });

  filteredSponsors = computed(() => {
    const list = this.sponsors();
    const selected = this.selectedSponsor();
    if (selected && !list.some(s => s.sponsorId === selected.sponsorId)) {
      return [selected, ...list];
    }
    return list;
  });

  filteredEquipmentTypes = computed(() => {
    const search = this.equipTypeSearchTerm().toLowerCase();
    const list = this.equipmentTypes();
    if (!search) return list;
    return list.filter(
      (e) =>
        e.code.toLowerCase().includes(search) ||
        (e.description ?? '').toLowerCase().includes(search)
    );
  });

  filteredReactionCodes = computed(() => {
    const search = this.reactionSearchTerm().toLowerCase();
    const list = this.reactionCodesList();
    if (!search) return list;
    return list.filter(
      (r) =>
        r.code.toLowerCase().includes(search) ||
        (r.description ?? '').toLowerCase().includes(search)
    );
  });

  filteredDeferralTypes = computed(() => {
    const search = this.deferralTypeSearchTerm().toLowerCase();
    if (!search) return this.deferralTypes;
    return this.deferralTypes.filter(
      (d) =>
        d.code.toLowerCase().includes(search) ||
        (d.description ?? '').toLowerCase().includes(search)
    );
  });

  filteredDeferralReasons = computed(() => {
    const search = this.deferralSearchTerm().toLowerCase();
    const list = this.deferralReasons();
    if (!search) return list;
    return list.filter(
      (d) => d.reasonCode.toLowerCase().includes(search)
    );
  });

  ngOnInit(): void {
    this.initSearchForm();
    this.initRegistrationForm();
    this.loadStaticLovs();
    this.setupSearchTermSignals();
    this.setupSponsorSearch();
    this.setupEmployerSearch();
    this.setupCitySearch();
    this.setupEmployerCitySearch();
    this.setupDonationTypeListener();
    this.setupDeferredThruValidation();
    this.setupDeferralTypeValidation();
    this.subscribeToChapterChanges();
    this.handleQueryParams();
  }

  /**
   * Handle query params from attach-donor navigation
   */
  private handleQueryParams(): void {
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const unitId = params['unitId'];
        const returnUrl = params['returnUrl'];
        const transactionId = params['transactionId'];

        if (returnUrl && transactionId) {
          this.attachDonorReturnUrl = returnUrl;
          this.attachDonorTransactionId = transactionId;
        }

        if (unitId) {
          setTimeout(() => {
            if (this.unitIdField) {
              this.unitIdField.unitIdControl.setValue(unitId);
              this.unitIdField.onBlur();
            }
          }, 500);
        }
      });
  }

  ngAfterViewInit(): void {
    this.setupSectionObserver();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initSearchForm(): void {
    this.searchForm = this.fb.group({
      driveDate: [null, Validators.required],
      driveId: ['', Validators.required],
    });

    this.searchForm.get('driveId')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((val) => {
        this.selectedDriveId.set(val ?? '');

        if (val) {
          const selectedDrive = this.drives().find(d => d.driveId === val);
          const driveDate = this.searchForm.get('driveDate')?.value;
          if (driveDate) {
            const formattedDate = moment.isMoment(driveDate) ? driveDate.format('YYYY-MM-DD') : String(driveDate);
            if (selectedDrive?.driveType === 'F') {
              this.donorService.getEmployees(formattedDate, val)
                .pipe(takeUntil(this.destroy$))
                .subscribe(emps => {
                  this.employees.set(emps.length > 0 ? emps : this.employees());
                });
            } else {
              this.donorService.getEmployees(formattedDate)
                .pipe(takeUntil(this.destroy$))
                .subscribe(emps => this.employees.set(emps));
            }
          }
        }
      });
  }

  // Field groups for progressive enabling (by rows, gated by required fields)
  private readonly fieldGroups = {
    // Group 1: Enabled after unitId validated (only Last Name)
    group2: ['lastName'],
    // Group 3: Enabled after lastName filled (rest of personal rows until weight)
    group3: ['suffix', 'firstName', 'middleName', 'dob', 'sex', 'weight'],
    // Group 4: Enabled after weight filled (Personal Row 3 + Address + Contact + Employer)
    group4: [
      'alternateId', 'alternateType', 'idQueue',
      'homeAddress', 'apartmentNo', 'city', 'zip',
      'homePhone', 'workPhone', 'mobilePhone', 'preferredPhone', 'email',
      'employerSchoolName', 'employerCity', 'employerZip',
    ],
    // Group 5: Enabled after weight filled (Donation Row 1)
    group5: ['ethnicGroup', 'alternateSponsorId', 'lookupId', 'donation', 'procedure'],
    // Group 6a: Enabled after ethnicGroup + donation + procedure filled (Donation Row 2)
    group6a: ['physicalId', 'deferral', 'deferredThru', 'deferralType', 'historianId'],
    // Group 6b: Enabled after Row 2 mandatory fields filled (Donation Row 3)
    group6b: ['armUsed', 'venipunctureCodes', 'reviewerId', 'reactionCodes', 'materialVerificationId'],
    // Group 7: Enabled after reviewerId filled (Donation Row 4)
    group7: ['equipmentType', 'voidUnit'],
  };

  // Address fields that get disabled when international address is provided
  private readonly addressFields = ['homeAddress', 'apartmentNo', 'city', 'zip'];
  private readonly employerFields = ['employerSchoolName'];

  donorIntlAddress: InternationalAddressModel | null = null;
  employerIntlAddress: InternationalAddressModel | null = null;
  bleedTimeData: BleedTimeDetailsDialogData | null = null;
  private readonly pendingHolds = signal<InterdictionCodeLookupDto[]>([]);
  private readonly isHoldAction = signal(false);
  private holdSearchCriteria: FindDonorSearchCriteria | null = null;
  hasEmployerInternationalAddress = signal(false);
  private readonly pendingAltAddress = signal<AlternateDemographicsModel | null>(null);

  private initRegistrationForm(): void {
    this.registrationForm = this.fb.group({
      donorId: [{ value: '', disabled: true }],
      abo: [{ value: '', disabled: true }],

      lastName: [{ value: '', disabled: true }, [Validators.required, Validators.maxLength(50)]],
      suffix: [{ value: '', disabled: true }, Validators.maxLength(5)],
      firstName: [{ value: '', disabled: true }, [Validators.required, Validators.maxLength(50)]],
      middleName: [{ value: '', disabled: true }, Validators.maxLength(25)],
      dob: [{ value: null, disabled: true }, Validators.required],
      sex: [{ value: '', disabled: true }, Validators.required],
      weight: [{ value: null, disabled: true }, [Validators.required, Validators.min(1), Validators.max(999)]],
      char: [{ value: '', disabled: true }],
      alternateId: [{ value: '', disabled: true }, Validators.maxLength(20)],
      alternateType: [{ value: '', disabled: true }],
      idQueue: [{ value: '', disabled: true }],

      homeAddress: [{ value: '', disabled: true }, [Validators.required, Validators.maxLength(50)]],
      apartmentNo: [{ value: '', disabled: true }, Validators.maxLength(10)],
      city: [{ value: '', disabled: true }, [Validators.required, Validators.maxLength(40)]],
      state: [{ value: '', disabled: true }],
      zip: [{ value: '', disabled: true }, [Validators.required, Validators.maxLength(6)]],

      homePhone: [{ value: '', disabled: true }, Validators.maxLength(14)],
      workPhone: [{ value: '', disabled: true }, Validators.maxLength(14)],
      extension: [{ value: '', disabled: true }, Validators.maxLength(10)],
      mobilePhone: [{ value: '', disabled: true }, Validators.maxLength(14)],
      preferredPhone: [{ value: '', disabled: true }],
      email: [{ value: '', disabled: true }, [Validators.maxLength(128), Validators.email]],

      employerSchoolName: [{ value: '', disabled: true }],
      employerCity: [{ value: '', disabled: true }, Validators.maxLength(40)],
      employerZip: [{ value: '', disabled: true }, Validators.maxLength(6)],

      ethnicGroup: [{ value: '', disabled: true }, Validators.required],
      alternateSponsorId: [{ value: '', disabled: true }],
      lookupId: [{ value: '', disabled: true }],
      donation: [{ value: '', disabled: true }, Validators.required],
      procedure: [{ value: '', disabled: true }, Validators.required],
      physicalId: [{ value: '', disabled: true }, Validators.required],
      deferral: [{ value: '', disabled: true }, Validators.required],
      deferredThru: [{ value: null, disabled: true }],
      deferralType: [{ value: '', disabled: true }, Validators.required],
      historianId: [{ value: '', disabled: true }, Validators.required],
      armUsed: [{ value: '', disabled: true }, Validators.required],
      venipunctureCodes: [{ value: '', disabled: true }],
      reviewerId: [{ value: '', disabled: true }],
      reactionCodes: [{ value: '', disabled: true }],
      materialVerificationId: [{ value: '', disabled: true }],
      collectionDate: [{ value: '', disabled: true }],
      equipmentType: [{ value: '', disabled: true }],
      voidUnit: [{ value: '', disabled: true }],
      transactionId: [{ value: '', disabled: true }],
    });

    this.setupProgressiveEnabling();
  }

  readonly fieldSequence: { name: string; required: boolean }[] = [
    { name: 'lastName', required: true },
    { name: 'suffix', required: false },
    { name: 'firstName', required: true },
    { name: 'middleName', required: false },
    { name: 'dob', required: true },
    { name: 'sex', required: true },
    { name: 'weight', required: true },
    { name: 'alternateId', required: false },
    { name: 'alternateType', required: false },
    { name: 'idQueue', required: false },
    { name: 'homeAddress', required: true },
    { name: 'apartmentNo', required: false },
    { name: 'city', required: true },
    { name: 'zip', required: true },
    { name: 'homePhone', required: false },
    { name: 'workPhone', required: false },
    { name: 'mobilePhone', required: false },
    { name: 'preferredPhone', required: false },
    { name: 'email', required: false },
    { name: 'employerSchoolName', required: false },
    { name: 'employerCity', required: false },
    { name: 'employerZip', required: false },
    { name: 'ethnicGroup', required: true },
    { name: 'alternateSponsorId', required: false },
    { name: 'lookupId', required: false },
    { name: 'donation', required: true },
    { name: 'procedure', required: true },
    { name: 'physicalId', required: true },
    { name: 'deferral', required: true },
    { name: 'deferredThru', required: false },
    { name: 'deferralType', required: true },
    { name: 'historianId', required: true },
    { name: 'armUsed', required: true },
    { name: 'venipunctureCodes', required: false },
    { name: 'reviewerId', required: false },
    { name: 'reactionCodes', required: false },
    { name: 'materialVerificationId', required: false },
    { name: 'equipmentType', required: false },
    { name: 'voidUnit', required: false },
  ];

  private readonly intlDisabledFields = [
    'homeAddress', 'apartmentNo', 'city', 'zip',
    'homePhone', 'workPhone', 'mobilePhone', 'email',
  ];
  private readonly employerIntlDisabledFields = ['employerSchoolName'];
  private readonly holdSkipFields = [
    'lastName', 'suffix', 'firstName', 'middleName',
    'dob', 'sex', 'weight', 'alternateId', 'alternateType',
    'homeAddress', 'apartmentNo', 'city', 'zip',
    'homePhone', 'workPhone', 'mobilePhone', 'preferredPhone', 'email',
    'idQueue', 'employerSchoolName', 'employerCity', 'employerZip', 'ethnicGroup',
  ];

  private setupProgressiveEnabling(): void {
    // No-op — field enabling is now driven by updateFieldStates() called from onFieldComplete()
  }

  updateFieldStates(): void {
    if (!this.registrationForm) return;

    let firstUnfilledRequiredIdx = this.fieldSequence.length;
    for (let i = 0; i < this.fieldSequence.length; i++) {
      const field = this.fieldSequence[i];
      if (field.required) {
        const control = this.registrationForm.get(field.name);

        if (control?.disabled && this.hasInternationalAddress() && this.intlDisabledFields.includes(field.name)) {
          continue;
        }
        if (control?.disabled && this.hasEmployerInternationalAddress() && this.employerIntlDisabledFields.includes(field.name)) {
          continue;
        }
        if (control?.disabled && this.isHoldAction() && this.holdSkipFields.includes(field.name)) {
          continue;
        }

        const value = control?.value;
        const hasValue = value !== null && value !== '' && value !== undefined;
        if (!hasValue || control?.invalid) {
          firstUnfilledRequiredIdx = i;
          break;
        }
      }
    }

    // Update button disabled states based on progress
    const weightIdx = this.fieldSequence.findIndex(f => f.name === 'weight');
    const reviewerIdx = this.fieldSequence.findIndex(f => f.name === 'reviewerId');
    this.isAddressButtonsDisabled = firstUnfilledRequiredIdx <= weightIdx;
    this.isEmployerButtonsDisabled = firstUnfilledRequiredIdx <= weightIdx;
    this.isHoldsButtonDisabled = !this.isHoldAction() && !this.isFindDonorOpen && !this.isExistingDonor() && !this.newDonorExpected;

    for (let i = 0; i < this.fieldSequence.length; i++) {
      const field = this.fieldSequence[i];
      const control = this.registrationForm.get(field.name);
      if (!control) continue;

      if (field.name === 'employerCity' || field.name === 'employerZip') {
        continue;
      }

      if (this.hasInternationalAddress() && this.intlDisabledFields.includes(field.name)) {
        if (control.enabled) control.disable({ emitEvent: false });
        continue;
      }
      if (this.hasEmployerInternationalAddress() && this.employerIntlDisabledFields.includes(field.name)) {
        if (control.enabled) control.disable({ emitEvent: false });
        continue;
      }

      if (this.isExistingDonor() && this.existingDonorLockedFields.includes(field.name)) {
        if (control.enabled) control.disable({ emitEvent: false });
        continue;
      }

      if (this.isHoldAction() && this.holdSkipFields.includes(field.name)) {
        continue;
      }

      if (i <= firstUnfilledRequiredIdx) {
        if (control.disabled) control.enable({ emitEvent: false });
      } else {
        if (control.enabled) control.disable({ emitEvent: false });
      }
    }

    const workPhoneCtrl = this.registrationForm.get('workPhone');
    const extCtrl = this.registrationForm.get('extension');
    if (extCtrl) {
      if (workPhoneCtrl?.enabled) {
        if (extCtrl.disabled) extCtrl.enable({ emitEvent: false });
      } else {
        if (extCtrl.enabled) extCtrl.disable({ emitEvent: false });
      }
    }

    this.cdr.markForCheck();
  }

  onFieldComplete(): void {
    this.updateFieldStates();
  }

  onSelectFieldComplete(fieldName?: string): void {
    this.updateFieldStates();
    if (fieldName) {
      const ctrl = this.registrationForm.get(fieldName);
      if (ctrl && !ctrl.invalid) {
        this.focusNextRequiredField(fieldName);
      }
    }
  }

  onSponsorSelected(): void {
    const selectedId = this.registrationForm.get('alternateSponsorId')?.value;
    const sponsor = this.sponsors().find(s => s.sponsorId === selectedId);
    if (sponsor) {
      this.selectedSponsor.set(sponsor);
    }
  }

  private readonly selfValidatedFields = [
    'lastName', 'firstName', 'dob', 'weight',
    'alternateId', 'homePhone', 'workPhone', 'mobilePhone',
    'zip', 'sex', 'ethnicGroup', 'donation', 'procedure', 'deferral',
    'deferralType', 'lookupId', 'physicalId', 'historianId', 'reviewerId',
    'equipmentType', 'alternateType', 'city', 'armUsed',
  ];

  onFormKeydown(event: KeyboardEvent): void {
    if (!(event.key === 'Enter' || (event.key === 'Tab' && !event.shiftKey))) return;

    const target = event.target as HTMLElement;
    const fieldName = this.getFieldNameFromTarget(target);
    if (!fieldName) return;
    if (!this.fieldSequence.some(f => f.name === fieldName)) return;

    if (fieldName === 'unitId') return;
    if (event.key === 'Enter' && target.closest('mat-select')) return;

    const control = this.registrationForm.get(fieldName);
    control?.markAsTouched();
    control?.markAsDirty();

    const fieldDef = this.fieldSequence.find(f => f.name === fieldName);
    if (fieldDef?.required && control?.invalid) {
      event.preventDefault();
      return;
    }

    event.preventDefault();

    if (this.selfValidatedFields.includes(fieldName)) {
      target.blur();
      return;
    }

    target.blur();
    this.onFieldComplete();
    setTimeout(() => {
      const ctrl = this.registrationForm.get(fieldName);
      if (ctrl && !ctrl.invalid) {
        this.focusNextRequiredField(fieldName);
      }
    });
  }

  private getFieldNameFromTarget(target: HTMLElement): string | null {
    const direct = target.getAttribute('formControlName');
    if (direct) return direct;
    const matSelect = target.closest('mat-select');
    if (matSelect) return matSelect.getAttribute('formControlName');
    return null;
  }

  private focusNextRequiredField(currentFieldName: string): void {
    const currentIdx = this.fieldSequence.findIndex(f => f.name === currentFieldName);
    if (currentIdx === -1) return;

    for (let i = currentIdx + 1; i < this.fieldSequence.length; i++) {
      const field = this.fieldSequence[i];
      if (!field.required) continue;
      const control = this.registrationForm.get(field.name);
      if (!control || control.disabled) continue;
      const value = control.value;
      if (value === null || value === '' || value === undefined) {
        this.focusField(field.name);
        return;
      }
    }
  }

  private focusField(fieldName: string): void {
    setTimeout(() => {
      const el = document.querySelector(`[formControlName="${fieldName}"]`) as HTMLElement;
      el?.focus();
    });
  }

  advanceFromField(fieldName: string): void {
    this.updateFieldStates();
    const ctrl = this.registrationForm.get(fieldName);
    if (ctrl && !ctrl.invalid) {
      this.focusNextRequiredField(fieldName);
    }
  }

  private getActiveField(): string | null {
    for (const field of this.fieldSequence) {
      const control = this.registrationForm.get(field.name);
      if (!control || control.disabled) continue;
      if (this.hasInternationalAddress() && this.intlDisabledFields.includes(field.name)) continue;
      if (!field.required) continue;
      const value = control.value;
      if (value === null || value === '' || value === undefined || control.invalid) {
        return field.name;
      }
    }
    return this.lastActiveField;
  }

  private focusActiveField(): void {
    const activeField = this.getActiveField();
    if (activeField) {
      this.focusField(activeField);
    }
  }

  private enableAllFields(): void {
    this.fieldSequence.forEach(field => {
      if (field.name === 'employerCity' || field.name === 'employerZip') return;
      const ctrl = this.registrationForm.get(field.name);
      if (ctrl?.disabled) ctrl.enable({ emitEvent: false });
    });
  }

  private validateField(fieldName: string, validation$: Observable<FieldValidationResult>): void {
    validation$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.advanceFromField(fieldName);
      },
      error: (err) => {
        const errorMessage = err?.error?.errorResponse?.error || err?.error?.error || err?.error?.message || 'Validation failed';
        const ctrl = this.registrationForm.get(fieldName);
        this.updateFieldStates();
        ctrl?.setErrors({ serverError: errorMessage });
        ctrl?.markAsTouched();
        this.focusField(fieldName);
        this.cdr.markForCheck();
      },
    });
  }

  private getDriveDateForApi(): string {
    return this.formatDateForApi(moment(this.searchForm.get('driveDate')?.value));
  }

  validateStaffField(fieldName: string): void {
    const value = this.registrationForm.get(fieldName)?.value;
    if (!value) return;
    if (value === '99' || value === '88') return;
    this.validateField(fieldName, this.donorService.validateStaff(value, this.getDriveDateForApi()));
  }

  validateEthnicGroupField(): void {
    const value = this.registrationForm.get('ethnicGroup')?.value;
    if (!value) return;
    this.validateField('ethnicGroup', this.donorService.validateEthnicGroup(value));
  }

  validateEquipmentTypeField(): void {
    const value = this.registrationForm.get('equipmentType')?.value;
    if (!value) return;
    this.validateField('equipmentType', this.donorService.validateEquipmentType(value));
  }

  validateAlternateIdTypeField(): void {
    const value = this.registrationForm.get('alternateType')?.value;
    if (!value) return;
    this.validateField('alternateType', this.donorService.validateAlternateIdType(value));
  }

  validateCityField(): void {
    const value = this.registrationForm.get('city')?.value?.trim();
    if (!value) return;
    this.validateField('city', this.donorService.validateCity(value));
  }

  validateZipField(): void {
    const zip = this.registrationForm.get('zip')?.value?.trim();
    const city = this.registrationForm.get('city')?.value?.trim();
    if (!zip || !city) return;
    this.validateField('zip', this.donorService.validateZipCity(city, zip));
  }

  validateEmployerZipField(): void {
    const zip = this.registrationForm.get('employerZip')?.value?.trim();
    const city = this.registrationForm.get('employerCity')?.value?.trim();
    if (!zip || !city) return;
    this.donorService.validateZipCity(city, zip)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        error: (err) => {
          const errorMessage = err?.error?.errorResponse?.error || err?.error?.error || err?.error?.message || 'ZIP code does not match the specified city';
          const ctrl = this.registrationForm.get('employerZip');
          ctrl?.setErrors({ serverError: errorMessage });
          ctrl?.markAsTouched();
          this.cdr.markForCheck();
        },
      });
  }

  validateDonationTypeField(): void {
    const value = this.registrationForm.get('donation')?.value;
    if (!value) return;
    this.advanceFromField('donation');
  }

  validateProcedureCodeField(): void {
    const value = this.registrationForm.get('procedure')?.value;
    if (!value) return;
    this.advanceFromField('procedure');
  }

  validateDeferralReasonField(): void {
    const ctrl = this.registrationForm.get('deferral');
    const value = ctrl?.value?.trim();
    if (!value) return;

    if (value.endsWith(',')) {
      ctrl?.setValue('');
      ctrl?.setErrors({ serverError: "Deferral reason cannot end with a comma" });
      ctrl?.markAsTouched();
      this.cdr.markForCheck();
      return;
    }

    this.advanceFromField('deferral');
  }

  validateDobAge(): void {
    const ctrl = this.registrationForm.get('dob');
    const dob = ctrl?.value;
    if (!dob) return;
    const dobMoment = moment.isMoment(dob) ? dob : moment(dob);
    const monthsDiff = moment().diff(dobMoment, 'months');
    if (monthsDiff > 1500) {
      ctrl?.setValue(null);
      ctrl?.setErrors({ serverError: 'Date of Birth results in age greater than 125 years' });
      ctrl?.markAsTouched();
      this.cdr.markForCheck();
    }
  }

  validateAlternateId(): void {
    if (this.findDonorValues?.alternateId) {
      const entered = this.registrationForm.get('alternateId')?.value?.trim();
      if (entered && entered !== this.findDonorValues.alternateId) {
        this.snackbarService.showError('Error 16007: Alternate ID does not match the donor record');
        this.registrationForm.get('alternateId')?.setValue(this.findDonorValues.alternateId);
      }
    }
    this.advanceFromField('alternateId');
  }

  validateAlternateIdType(): void {
    if (this.findDonorValues?.alternateIdType) {
      const entered = this.registrationForm.get('alternateType')?.value;
      if (entered && entered !== this.findDonorValues.alternateIdType) {
        this.snackbarService.showError('Error 16007: Alternate ID Type does not match the donor record');
        this.registrationForm.get('alternateType')?.setValue(this.findDonorValues.alternateIdType);
      }
    }
  }

  private enableGroup(fields: string[]): void {
    fields.forEach((f) => {
      const ctrl = this.registrationForm.get(f);
      if (ctrl?.disabled) ctrl.enable({ emitEvent: false });
    });
  }

  private disableGroup(fields: string[]): void {
    fields.forEach((f) => {
      const ctrl = this.registrationForm.get(f);
      if (ctrl?.enabled) ctrl.disable({ emitEvent: false });
    });
  }

  private disableGroups(groups: string[][]): void {
    groups.forEach((g) => this.disableGroup(g));
  }

  disableAddressFields(): void {
    this.hasInternationalAddress.set(true);
    this.intlDisabledFields.forEach((f) => {
      const ctrl = this.registrationForm.get(f);
      ctrl?.setValue('', { emitEvent: false });
      ctrl?.disable({ emitEvent: false });
    });
    this.stateDisplay.set('--');
    this.selectedUspsId.set(null);

    const homeAddr = this.registrationForm.get('homeAddress');
    homeAddr?.clearValidators();
    homeAddr?.addValidators([Validators.maxLength(50)]);
    homeAddr?.updateValueAndValidity({ emitEvent: false });

    const cityCtrl = this.registrationForm.get('city');
    cityCtrl?.clearValidators();
    cityCtrl?.addValidators([Validators.maxLength(40)]);
    cityCtrl?.updateValueAndValidity({ emitEvent: false });

    const zipCtrl = this.registrationForm.get('zip');
    zipCtrl?.clearValidators();
    zipCtrl?.addValidators([Validators.maxLength(6)]);
    zipCtrl?.updateValueAndValidity({ emitEvent: false });

    this.updateFieldStates();
  }

  enableAddressFields(): void {
    this.hasInternationalAddress.set(false);
    this.donorIntlAddress = null;
    this.intlDisabledFields.forEach((f) =>
      this.registrationForm.get(f)?.enable({ emitEvent: false })
    );

    const homeAddr = this.registrationForm.get('homeAddress');
    homeAddr?.clearValidators();
    homeAddr?.addValidators([Validators.required, Validators.maxLength(50)]);
    homeAddr?.updateValueAndValidity({ emitEvent: false });

    const cityCtrl = this.registrationForm.get('city');
    cityCtrl?.clearValidators();
    cityCtrl?.addValidators([Validators.required, Validators.maxLength(40)]);
    cityCtrl?.updateValueAndValidity({ emitEvent: false });

    const zipCtrl = this.registrationForm.get('zip');
    zipCtrl?.clearValidators();
    zipCtrl?.addValidators([Validators.required, Validators.maxLength(6)]);
    zipCtrl?.updateValueAndValidity({ emitEvent: false });

    this.updateFieldStates();
  }

  disableEmployerFields(): void {
    this.hasEmployerInternationalAddress.set(true);
    this.employerIntlDisabledFields.forEach((f) => {
      const ctrl = this.registrationForm.get(f);
      ctrl?.setValue('', { emitEvent: false });
      ctrl?.disable({ emitEvent: false });
    });
    this.employerStateDisplay.set('--');
    this.selectedEUspsId.set(null);
    this.updateFieldStates();
  }

  enableEmployerFields(): void {
    this.hasEmployerInternationalAddress.set(false);
    this.employerIntlAddress = null;
    this.employerIntlDisabledFields.forEach((f) =>
      this.registrationForm.get(f)?.enable({ emitEvent: false })
    );
    this.updateFieldStates();
  }

  private loadStaticLovs(): void {
    this.masterCodesService
      .getByCodeType('ETHGP')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) =>
          this.ethnicGroups.set(
            data.map((d) => ({ code: d.code, description: d.description }))
          ),
      });

    this.masterCodesService
      .getByCodeType('ALTID')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) =>
          this.alternateTypes.set(
            data.map((d) => ({ code: d.code, description: d.description }))
          ),
      });

    this.masterCodesService
      .getByCodeType('EQUIP')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) =>
          this.equipmentTypes.set(
            data.map((d) => ({ code: d.code, description: d.description }))
          ),
      });

    this.masterCodesService
      .getByCodeType('REACT')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) =>
          this.reactionCodesList.set(
            data.map((d) => ({ code: d.code, description: d.description }))
          ),
      });
  }

  onDriveDateChange(event: { value: moment.Moment | null }): void {
    const dateValue = event.value;
    if (!dateValue || !moment.isMoment(dateValue) || !dateValue.isValid()) {
      this.driveDateDoubleEntry = 'idle';
      this.pendingDriveDate = null;
      return;
    }

    const formatted = dateValue.format('YYYY-MM-DD');
    const driveDateCtrl = this.searchForm.get('driveDate');

    if (formatted === this.lastConfirmedDriveDate) {
      return;
    }

    if (this.driveDateDoubleEntry === 'idle') {
      if (this.lastConfirmedDriveDate && this.mode() === 'add') {
        this.mode.set('search');
        this.resetRegistrationState();
      }
      this.drives.set([]);
      const driveIdCtrl = this.searchForm.get('driveId');
      driveIdCtrl?.setValue('');
      driveIdCtrl?.markAsUntouched();
      this.pendingDriveDate = formatted;
      this.driveDateDoubleEntry = 'pending';
      this.driveDateMismatchError = null;
      driveDateCtrl?.setValue(null, { emitEvent: false });
      this.driveDatePicker?.close();
      setTimeout(() => {
        driveDateCtrl?.markAsUntouched();
        driveDateCtrl?.markAsPristine();
        this.cdr.markForCheck();
      });
      this.cdr.markForCheck();
      return;
    }

    if (this.driveDateDoubleEntry === 'pending') {
      if (formatted === this.pendingDriveDate) {
        this.driveDateDoubleEntry = 'idle';
        this.pendingDriveDate = null;
        this.lastConfirmedDriveDate = formatted;
        this.driveDateMismatchError = null;
        this.loadDriveDateDependentLovs(formatted);
        this.searchForm.get('driveId')?.setValue('');
      } else {
        this.driveDateDoubleEntry = 'idle';
        this.pendingDriveDate = null;
        this.driveDatePicker?.close();
        this.driveDateMismatchError = 'Drive Date did not match. Please re-enter.';
        driveDateCtrl?.setValue(null, { emitEvent: false });
        driveDateCtrl?.setErrors({ mismatch: true });
        driveDateCtrl?.markAsTouched();
      }
      this.cdr.markForCheck();
    }
  }

  private resetRegistrationState(): void {
    this.registrationForm.reset();
    this.unitIdField?.clear();
    this.bleedTimeData = null;
    this.pendingHolds.set([]);
    this.isHoldAction.set(false);
    this.holdSearchCriteria = null;
    this.newDonorExpected = null;
    this.isExistingDonor.set(false);
    this.findDonorValues = null;
    this.pendingAltAddress.set(null);
    this.filteredCities.set([]);
    this.stateDisplay.set('--');
    this.employerStateDisplay.set('--');
    this.donationUnitIdField?.clear();
    this.isHoldsButtonDisabled = true;

    setTimeout(() => {
      this.unitIdField?.unitIdInput?.nativeElement?.focus();
    }, 100);
  }

  private loadDriveDateDependentLovs(driveDate: string): void {
    forkJoin({
      drives: this.donorService.getDrives(driveDate),
      employees: this.donorService.getEmployees(driveDate),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.drives.set(result.drives);
          this.employees.set(result.employees);
          this.cdr.markForCheck();
        },
        error: () => {
          this.snackbarService.showError('Failed to load drives and employees.');
        },
      });
  }

  private loadFormLovs(): void {
    forkJoin({
      procedureCodes: this.donorService.getProcedureCodes(),
      venipunctureCodes: this.donorService.getVenipunctureCodes(),
      interdictionCodes: this.donorService.getInterdictionCodes(),
      donationTypes: this.donorService.getDonationTypes(),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.procedureCodes.set(result.procedureCodes);
          this.venipunctureCodes.set(result.venipunctureCodes);
          this.interdictionCodes.set(result.interdictionCodes);
          this.donationTypes.set(result.donationTypes);
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Failed to load form LOVs:', err);
          this.snackbarService.showError('Failed to load form data');
        },
      });
  }

  /** Bridge FormControl valueChanges into signals so computed() filters re-evaluate reactively. */
  private setupSearchTermSignals(): void {
    this.driveSearchControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.driveSearchTerm.set(v ?? ''));
    this.ethnicGroupSearchControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.ethnicGroupSearchTerm.set(v ?? ''));
    this.donationSearchControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.donationSearchTerm.set(v ?? ''));
    this.procedureSearchControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.procedureSearchTerm.set(v ?? ''));
    this.physicalIdSearchControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.physicalSearchTerm.set(v ?? ''));
    this.deferralSearchControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.deferralSearchTerm.set(v ?? ''));
    this.reviewerSearchControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.reviewerSearchTerm.set(v ?? ''));
    this.venipunctureSearchControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.venipunctureSearchTerm.set(v ?? ''));
    this.lookupIdSearchControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.lookupSearchTerm.set(v ?? ''));
    this.equipTypeSearchControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.equipTypeSearchTerm.set(v ?? ''));
    this.reactionSearchControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.reactionSearchTerm.set(v ?? ''));
    this.materialVerifSearchControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.materialSearchTerm.set(v ?? ''));
    this.historianSearchControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.historianSearchTerm.set(v ?? ''));
    this.deferralTypeSearchControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.deferralTypeSearchTerm.set(v ?? ''));
  }

  private setupSponsorSearch(): void {
    this.altSponsorSearchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((keyword) => {
          if (!keyword || keyword.length < 3) {
            this.sponsors.set([]);
            return of(null);
          }
          return this.donorService.getSponsors(keyword).pipe(
            catchError(() => {
              this.sponsors.set([]);
              return of(null);
            })
          );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((sponsors) => {
        if (sponsors) {
          this.sponsors.set(sponsors);
          this.cdr.markForCheck();
        }
      });
  }

  private setupEmployerSearch(): void {
    this.employerSearchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((search) => {
        if (search && search.length >= 1) {
          this.donorService.getEmployers(search)
            .pipe(takeUntil(this.destroy$))
            .subscribe((data) => {
              this.filteredEmployers.set(data);
              this.cdr.markForCheck();
            });
        }
      });
  }

  private setupCitySearch(): void {
    this.citySearchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((search) => {
        if (search && search.length >= 3) {
          this.donorService.getCityState({ city: search })
            .pipe(takeUntil(this.destroy$))
            .subscribe((data) => {
              this.filteredCities.set(data);
              this.cdr.markForCheck();
            });
        } else {
          const selectedCity = this.registrationForm.get('city')?.value;
          if (selectedCity) {
            this.filteredCities.set(this.filteredCities().filter((c) => c.city === selectedCity));
          } else {
            this.filteredCities.set([]);
          }
        }
      });
  }

  onCitySelected(city: CityStateLookupDto): void {
    this.stateDisplay.set(city.state || '--');
    this.selectedUspsId.set(city.uspsId ?? null);
    this.registrationForm.patchValue({ zip: city.zip }, { emitEvent: false });
  }

  private setupEmployerCitySearch(): void {
    this.employerCitySearchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((search) => {
        if (search && search.length >= 3) {
          this.donorService.getCityState({ city: search })
            .pipe(takeUntil(this.destroy$))
            .subscribe((data) => {
              this.filteredEmployerCities.set(data);
              this.cdr.markForCheck();
            });
        } else {
          const selectedCity = this.registrationForm.get('employerCity')?.value;
          if (selectedCity) {
            this.filteredEmployerCities.set(this.filteredEmployerCities().filter((c) => c.city === selectedCity));
          } else {
            this.filteredEmployerCities.set([]);
          }
        }
      });
  }

  onEmployerCitySelected(city: CityStateLookupDto): void {
    this.selectedEUspsId.set(city.uspsId ?? null);
    this.employerStateDisplay.set(city.state || '--');
    this.registrationForm.patchValue({ employerZip: city.zip }, { emitEvent: false });
    this.updateFieldStates();
  }

  onEmployerZipBlur(): void {
    const zip = this.registrationForm.get('employerZip')?.value?.trim();
    if (!zip) {
      this.employerStateDisplay.set('--');
      return;
    }
    if (zip.length < 5) return;
    const city = this.registrationForm.get('employerCity')?.value;
    this.donorService.getCityState({ zip })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (results) => {
          if (results.length > 0) {
            this.filteredEmployerCities.set(results);
            const match = results.find((r) => r.city === city);
            if (match) {
              this.employerStateDisplay.set(match.state || '--');
              this.selectedEUspsId.set(match.uspsId ?? null);
            } else {
              this.registrationForm.patchValue({ employerCity: results[0].city }, { emitEvent: false });
              this.employerStateDisplay.set(results[0].state || '--');
              this.selectedEUspsId.set(results[0].uspsId ?? null);
            }
          }
          this.validateEmployerZipField();
          this.cdr.markForCheck();
        },
      });
  }

  private resolveEmployerName(employerIdOrName: string): string {
    if (!employerIdOrName) return '';
    const match = this.filteredEmployers().find((e) => e.employerId === employerIdOrName);
    return match?.employerName || employerIdOrName;
  }

  onEmployerSelected(employerId: string): void {
    if (!employerId) {
      this.registrationForm.patchValue({ employerCity: '', employerZip: '' }, { emitEvent: false });
      this.employerStateDisplay.set('--');
      this.cdr.markForCheck();
      return;
    }
    const employer = this.filteredEmployers().find((e) => e.employerId === employerId);
    if (!employer) return;

    this.registrationForm.patchValue({
      employerCity: employer.city || '',
      employerZip: employer.zip || '',
    }, { emitEvent: false });
    this.employerStateDisplay.set(employer.state || '--');
    this.selectedEUspsId.set(employer.uspsId ?? null);
    if (employer.city) {
      this.filteredEmployerCities.set([{ uspsId: employer.uspsId ?? 0, city: employer.city, state: employer.state || '', zip: employer.zip || '' }]);
    }
    this.cdr.markForCheck();
  }

  private setupDonationTypeListener(): void {
    this.registrationForm.get('donation')?.valueChanges
      .pipe(
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe((donationType) => {
        if (!donationType) {
          this.deferralReasons.set([]);
          this.procedureCodes.set([]);
          this.registrationForm.get('procedure')?.setValue('', { emitEvent: false });
          this.registrationForm.get('deferral')?.setValue('', { emitEvent: false });
          this.registrationForm.get('deferralType')?.setValue('', { emitEvent: false });
          return;
        }
        const driveDate = this.searchForm.get('driveDate')?.value;
        if (!driveDate) return;
        const formattedDate = this.formatDateForApi(moment(driveDate));

        this.registrationForm.get('procedure')?.setValue('', { emitEvent: false });
        this.registrationForm.get('deferral')?.setValue('', { emitEvent: false });
        this.registrationForm.get('deferralType')?.setValue('', { emitEvent: false });

        this.donorService.getProcedureCodesByDonationType(donationType)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (codes) => {
              this.procedureCodes.set(codes);
              this.cdr.markForCheck();
            },
            error: () => {
              this.procedureCodes.set([]);
            },
          });

        this.donorService.getDeferralReasons(donationType, formattedDate)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (reasons) => {
              this.deferralReasons.set(reasons);
              this.cdr.markForCheck();
            },
            error: () => {
              this.deferralReasons.set([]);
              this.snackbarService.showError('Failed to load deferral reasons');
            },
          });
      });
  }

  private formatDateForApi(date: moment.Moment): string {
    if (!date || !date.isValid()) return '';
    return date.format('MMDDYYYY');
  }

  private setupDeferredThruValidation(): void {
    this.registrationForm.get('deferredThru')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        const ctrl = this.registrationForm.get('deferredThru')!;
        if (!value) {
          if (!ctrl.hasError('matDatepickerParse')) {
            ctrl.setErrors(null);
          }
          return;
        }
        const driveDate = this.searchForm.get('driveDate')?.value;
        if (driveDate && moment(value).isAfter(moment(driveDate), 'day')) {
          ctrl.setErrors({ afterDriveDate: true });
          ctrl.markAsTouched();
          this.cdr.markForCheck();
        } else if (this.registrationForm.get('deferralType')?.value === 'IND') {
          ctrl.setValue(null, { emitEvent: false });
          ctrl.setErrors({ serverError: 'Deferred Thru date cannot be set with Indefinite deferral type' });
          ctrl.markAsTouched();
          this.cdr.markForCheck();
        } else if (!ctrl.hasError('matDatepickerParse')) {
          ctrl.setErrors(null);
        }
      });
  }

  validatePhone(fieldName: string, label: string): void {
    const value = this.registrationForm.get(fieldName)?.value?.trim();
    if (!value) return;
    const digitsOnly = value.replace(/\D/g, '');
    if (digitsOnly.length > 0 && (digitsOnly.length !== 7 && digitsOnly.length !== 10 || parseInt(digitsOnly, 10) <= 0)) {
      const msg = `${label} must be a valid 7 or 10-digit phone number`;
      const ctrl = this.registrationForm.get(fieldName);
      ctrl?.setValue('');
      ctrl?.setErrors({ serverError: msg });
      ctrl?.markAsTouched();
      this.cdr.markForCheck();
      return;
    }
    this.formatPhoneDisplay(fieldName);
  }

  formatPhoneInput(fieldName: string): void {
    const ctrl = this.registrationForm.get(fieldName);
    if (!ctrl) return;
    const stripped = (ctrl.value || '').replace(/\D/g, '').substring(0, 10);
    if (stripped !== ctrl.value) {
      ctrl.setValue(stripped, { emitEvent: false });
    }
  }

  private formatPhoneDisplay(fieldName: string): void {
    const ctrl = this.registrationForm.get(fieldName);
    if (!ctrl) return;
    const digits = (ctrl.value || '').replace(/\D/g, '');
    if (digits.length === 10) {
      ctrl.setValue(`(${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6)}`, { emitEvent: false });
    } else if (digits.length === 7) {
      ctrl.setValue(`${digits.substring(0, 3)}-${digits.substring(3)}`, { emitEvent: false });
    }
  }

  private parsePhone(value: string): { areaCode: string; phoneNo: string } {
    if (!value) return { areaCode: '', phoneNo: '' };
    const digits = value.replace(/\D/g, '');
    if (digits.length === 10) return { areaCode: digits.substring(0, 3), phoneNo: digits.substring(3) };
    if (digits.length === 7) return { areaCode: '', phoneNo: digits };
    return { areaCode: '', phoneNo: digits };
  }

  onlyNumbers(event: KeyboardEvent): void {
    const charCode = event.key.charCodeAt(0);
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
    }
  }

  onPasteNumbers(event: ClipboardEvent): void {
    const text = event.clipboardData?.getData('text') ?? '';
    if (!/^\d+$/.test(text)) {
      event.preventDefault();
    }
  }

  private setupDeferralTypeValidation(): void {
    this.registrationForm.get('deferralType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        if (value === 'IND' && this.registrationForm.get('deferredThru')?.value) {
          const ctrl = this.registrationForm.get('deferralType');
          ctrl?.setValue('', { emitEvent: false });
          ctrl?.setErrors({ serverError: 'Cannot have both a through-date and indefinite deferral type' });
          ctrl?.markAsTouched();
          this.cdr.markForCheck();
        }
      });
  }

  onZipBlur(): void {
    const zip = this.registrationForm.get('zip')?.value?.trim();
    if (!zip) {
      this.stateDisplay.set('--');
      return;
    }

    this.donorService
      .getCityState({ zip })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (results) => {
          if (results.length > 0) {
            const selectedCity = this.registrationForm.get('city')?.value;
            const match = results.find((r) => r.city === selectedCity);
            if (match) {
              this.stateDisplay.set(match.state || '--');
              this.selectedUspsId.set(match.uspsId ?? null);
            } else {
              this.registrationForm.patchValue({ city: results[0].city }, { emitEvent: false });
              this.stateDisplay.set(results[0].state || '--');
              this.selectedUspsId.set(results[0].uspsId ?? null);
              this.filteredCities.set(results);
            }
            this.cdr.markForCheck();
          }
        },
      });
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.resetPage();
        this.loadStaticLovs();
      });
  }

  onRetrieve(): void {
    this.searchForm.markAllAsTouched();
    if (this.searchForm.invalid) return;

    this.isLoading.set(true);
    this.mode.set('add');
    this.registrationForm.reset();

    const driveDate = moment(this.searchForm.get('driveDate')?.value).format('YYYY-MM-DD');
    this.registrationForm.get('collectionDate')?.setValue(driveDate);

    this.loadFormLovs();
    this.isLoading.set(false);
    this.cdr.markForCheck();

    setTimeout(() => this.setupSectionObserver());
  }

  private isFindDonorOpen = false;

  onUnitIdPostValidate(event: UnitIdPostValidateEvent): void {
    const parsedId = event.data.parsedUnitId;
    this.donorService.checkExistingUnitId(parsedId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (exists) => {
          if (exists) {
            event.reject('Unit ID has already been used');
            return;
          }
          event.confirm();
        },
        error: () => {
          event.reject('Failed to check unit ID');
        },
      });
  }

  onUnitIdValidated(data: SharedUnitValidationResponse): void {
    this.updateFieldStates();
    this.openFindDonor();
  }

  onUnitIdCleared(): void {
    this.isHoldsButtonDisabled = true;
  }

  onPreviousUnitIdValidated(data: SharedUnitValidationResponse): void {
    this.cdr.markForCheck();
  }

  onPreviousUnitIdCleared(): void {
    this.cdr.markForCheck();
  }

  private openFindDonor(): void {
    this.isFindDonorOpen = true;
    this.isHoldsButtonDisabled = false;
    const dialogRef = this.dialog.open(FindDonorDialog, {
      width: '1184px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      position: { bottom: '0px', right: '0px' },
      panelClass: 'find-donor-panel',
      disableClose: true,
      restoreFocus: false,
      autoFocus: false,
      data: {
        programName: 'DRIREGIS',
      } as FindDonorDialogData,
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result: FindDonorDialogResult) => {
        this.isFindDonorOpen = false;

        if (!result) return;

        if (result.action === 'select' && result.donor) {
          this.populateDonorFields(result.donor);
        } else if (result.action === 'new') {
          this.populateNewDonorFields(result.newData);
        } else if (result.action === 'hold') {
          this.handleHoldAction(result.searchCriteria);
        } else if (result.action === 'cancel') {
          this.unitIdField?.clear();
        }
        this.cdr.markForCheck();
      });
  }

  private populateDonorFields(donor: FindDonorResult): void {
    this.enableAllFields();
    this.isLoading.set(true);

    this.registrationForm.patchValue({
      donorId: donor.donorId,
      lastName: donor.lastName,
      firstName: donor.firstName,
      middleName: donor.middleName ?? '',
      dob: donor.dob ? moment(donor.dob) : null,
      sex: this.toDisplaySex(donor.sex),
      abo: donor.aboRh ?? '',
      alternateId: donor.alternateId ?? '',
      alternateType: donor.alternateIdType ?? '',
    });

    this.isExistingDonor.set(true);
    this.findDonorValues = {
      lastName: donor.lastName,
      firstName: donor.firstName,
      dob: (donor.dob ?? undefined) as string | undefined,
      sex: this.toDisplaySex(donor.sex),
      alternateId: donor.alternateId ?? undefined,
      alternateIdType: donor.alternateIdType ?? undefined,
    };

    this.loadDonorDemographicsAndAddress(donor.donorId!);
  }

  private loadDonorDemographicsAndAddress(donorId: string): void {
    forkJoin({
      demographics: this.donorService.getDonor(donorId),
      address: this.donorService.getDonorAddress(donorId),
    })
      .pipe(takeUntil(this.destroy$), finalize(() => {
        this.isLoading.set(false);
        this.updateFieldStates();
        this.focusActiveField();
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: ({ demographics, address }) => {
          this.populateDemographics(demographics);
          this.populateAddress(address);
        },
        error: () => {
          this.snackbarService.showError('Failed to load donor data');
        },
      });
  }

  private populateDemographics(donor: DonorDemographics): void {
    this.registrationForm.patchValue({
      suffix: donor.lastNameSuffix ?? '',
      weight: donor.donorWeight,
    });
  }

  private populateAddress(address: DonorAddress): void {
    this.selectedUspsId.set(address.uspsId ?? null);
    this.selectedEUspsId.set(address.eUspsId ?? null);
    if ((address.intlAddrFlag ?? 'N') === 'Y') {
      this.donorIntlAddress = {
        streetName: address.intlAddress1 ?? '',
        addr1: address.intlAddress2 ?? null,
        addr2: address.intlAddress3 ?? null,
        addr3: address.intlAddress4 ?? null,
        country: address.countryName ?? '',
        postalCode: address.intlPostalCode ?? null,
        homePhoneNo: address.intlHomePhoneNo ?? null,
        workPhoneNo: address.intlWorkPhoneNo ?? null,
        workPhoneExt: address.intlWorkPhoneExt ?? null,
        mobilePhoneNo: address.intlMobilePhoneNo ?? null,
        faxNo: address.intlFaxNo ?? null,
        email: address.email ?? null,
        intlAddrFlag: 'Y',
      };
      this.registrationForm.patchValue({
        employerName: address.employerName ?? '',
        employerCity: address.eCity ?? '',
        employerZip: address.eZip ?? '',
      });
      if (address.eCity) {
        this.filteredEmployerCities.set([{ uspsId: address.eUspsId ?? 0, city: address.eCity, state: address.eState || '', zip: address.eZip || '' }]);
      }
      this.stateDisplay.set('--');
      this.employerStateDisplay.set(address.eState || '--');
      this.disableAddressFields();
    } else {
      if (address.city) {
        this.filteredCities.set([{ uspsId: address.uspsId ?? 0, city: address.city, state: address.state || '', zip: address.zip || '' }]);
      }
      if (address.eCity) {
        this.filteredEmployerCities.set([{ uspsId: address.eUspsId ?? 0, city: address.eCity, state: address.eState || '', zip: address.eZip || '' }]);
      }
      this.registrationForm.patchValue({
        homeAddress: address.streetName ?? '',
        apartmentNo: address.suiteApt ?? '',
        city: address.city ?? '',
        zip: address.zip ?? '',
        homePhone: this.formatPhoneFromParts(address.hAreaCode, address.hPhoneNo),
        workPhone: this.formatPhoneFromParts(address.dAreaCode, address.dPhoneNo),
        extension: address.extension ?? '',
        mobilePhone: this.formatPhoneFromParts(address.mAreaCode, address.mPhoneNo),
        email: address.email ?? '',
        employerName: address.employerName ?? '',
        employerCity: address.eCity ?? '',
        employerZip: address.eZip ?? '',
      });
      this.stateDisplay.set(address.state || '--');
      this.employerStateDisplay.set(address.eState || '--');

      if (address.preferredContactFlag === 'H') {
        this.registrationForm.patchValue({ preferredPhone: 'home' }, { emitEvent: false });
      } else if (address.preferredContactFlag === 'W') {
        this.registrationForm.patchValue({ preferredPhone: 'work' }, { emitEvent: false });
      } else if (address.preferredContactFlag === 'M') {
        this.registrationForm.patchValue({ preferredPhone: 'mobile' }, { emitEvent: false });
      }
    }

    if ((address.empIntlAddrFlag ?? 'N') === 'Y') {
      this.employerIntlAddress = {
        streetName: address.empIntlCity ?? '',
        addr1: address.empIntlState ?? null,
        addr2: null,
        addr3: null,
        country: address.empIntlCountryName ?? '',
        postalCode: address.empIntlPostalCode ?? null,
        intlAddrFlag: 'Y',
      };
      this.disableEmployerFields();
    }

    if (address.altStreetName || address.altIntlAddrFlag === 'Y') {
      this.pendingAltAddress.set({
        addressType: (address.altIntlAddrFlag ?? 'N') === 'Y' ? 'I' : 'L',
        streetName: address.altStreetName ?? null,
        suiteApt: address.altSuiteApt ?? null,
        city: address.altCity ?? null,
        state: address.altState ?? null,
        zip: address.altZip ?? null,
        uspsId: address.altUspsId ?? null,
        intlAddress1: address.altIntlAddress1 ?? null,
        intlAddress2: address.altIntlAddress2 ?? null,
        intlAddress3: address.altIntlAddress3 ?? null,
        intlAddress4: address.altIntlAddress4 ?? null,
        countryName: address.altCountryName ?? null,
        intlCity: null,
        intlPostalCode: address.altIntlPostalCode ?? null,
        intlAddrFlag: address.altIntlAddrFlag ?? null,
        mobilePhoneNumber: address.mAreaCode && address.mPhoneNo
          ? `${address.mAreaCode}${address.mPhoneNo}` : null,
        otherContactNumber: address.otherContactNo ?? null,
        altIntlPhoneNumber: address.altIntlPhoneNo ?? null,
        preferredContactPhone: address.preferredContactFlag === 'M' ? 'M'
          : address.preferredContactFlag === 'W' ? 'W'
          : address.preferredContactFlag === 'H' ? 'H' : null,
        preferredContactAddress: address.preferredContactAddrFlag ?? null,
      });
    }
  }

  private formatPhoneFromParts(areaCode: string | null, phoneNo: string | null): string {
    if (!phoneNo) return '';
    if (areaCode && phoneNo.length >= 7) {
      return `(${areaCode}) ${phoneNo.substring(0, 3)}-${phoneNo.substring(3)}`;
    }
    if (phoneNo.length >= 7) {
      return `${phoneNo.substring(0, 3)}-${phoneNo.substring(3)}`;
    }
    return phoneNo;
  }

  private populateNewDonorFields(newData?: FindDonorNewData): void {
    if (!newData) return;

    this.newDonorExpected = newData;
    this.donorMismatchErrors = {};
    this.isExistingDonor.set(false);
    this.findDonorValues = null;

    this.enableAllFields();
    this.updateFieldStates();
    this.focusField('firstName');
  }

  private handleHoldAction(searchCriteria?: FindDonorSearchCriteria): void {
    this.isHoldAction.set(true);
    this.holdSearchCriteria = searchCriteria ?? null;

    const nodonHold: InterdictionCodeLookupDto = {
      interCode: 'NODON',
      interDesc: 'No Donor Attached',
      interType: 'HOLDS',
    };
    const currentHolds = this.pendingHolds();
    if (!currentHolds.some(h => h.interCode === 'NODON')) {
      this.pendingHolds.set([...currentHolds, nodonHold]);
    }

    this.isFindDonorOpen = false;
    this.disableDonorFieldsForHold();
    this.updateFieldStates();

    setTimeout(() => {
      this.scrollToSection('donation');
      setTimeout(() => this.focusField('lookupId'), 100);
    }, 300);
  }

  private disableDonorFieldsForHold(): void {
    for (const field of this.holdSkipFields) {
      const ctrl = this.registrationForm.get(field);
      if (ctrl) {
        ctrl.clearValidators();
        ctrl.setValue(ctrl.value || null, { emitEvent: false });
        ctrl.disable({ emitEvent: false });
      }
    }
  }

  validateLastName(): void {
    const ctrl = this.registrationForm.get('lastName');
    const entered = ctrl?.value?.trim();
    if (!entered) return;

    if (this.findDonorValues) {
      if (entered !== this.findDonorValues.lastName) {
        this.snackbarService.showError('Error 16007: Last Name does not match the donor record');
        ctrl?.setValue(this.findDonorValues.lastName);
      }
    } else if (this.newDonorExpected?.lastName) {
      if (entered.toLowerCase() !== this.newDonorExpected.lastName.toLowerCase()) {
        this.donorMismatchErrors['lastName'] = 'Last Name does not match Find Donor entry';
        ctrl?.setErrors({ serverError: 'Last Name does not match Find Donor entry' });
        ctrl?.markAsTouched();
        this.cdr.markForCheck();
        return;
      }
    }
    delete this.donorMismatchErrors['lastName'];
    this.advanceFromField('lastName');
  }

  validateFirstName(): void {
    const ctrl = this.registrationForm.get('firstName');
    const entered = ctrl?.value?.trim();
    if (!entered) return;

    if (this.findDonorValues) {
      if (entered !== this.findDonorValues.firstName) {
        this.snackbarService.showError('Error 16007: First Name does not match the donor record');
        ctrl?.setValue(this.findDonorValues.firstName);
      }
    } else if (this.newDonorExpected?.firstName) {
      if (entered.toLowerCase() !== this.newDonorExpected.firstName.toLowerCase()) {
        this.donorMismatchErrors['firstName'] = 'First Name does not match Find Donor entry';
        ctrl?.setErrors({ serverError: 'First Name does not match Find Donor entry' });
        ctrl?.markAsTouched();
        this.cdr.markForCheck();
        return;
      }
    }
    delete this.donorMismatchErrors['firstName'];
    this.advanceFromField('firstName');
  }

  validateDob(): void {
    const ctrl = this.registrationForm.get('dob');
    const entered = ctrl?.value;
    if (!entered) { this.validateDobAge(); return; }
    const enteredStr = moment.isMoment(entered) ? entered.format('YYYY-MM-DD') : '';

    if (this.findDonorValues?.dob) {
      const expectedStr = moment(this.findDonorValues.dob).format('YYYY-MM-DD');
      if (enteredStr && enteredStr !== expectedStr) {
        this.snackbarService.showError('Error 16007: Date of Birth does not match the donor record');
        ctrl?.setValue(moment(this.findDonorValues.dob));
      }
    } else if (this.newDonorExpected?.dob) {
      const expectedStr = moment(this.newDonorExpected.dob).format('YYYY-MM-DD');
      if (enteredStr && enteredStr !== expectedStr) {
        this.donorMismatchErrors['dob'] = 'DOB does not match Find Donor entry';
        ctrl?.setErrors({ serverError: 'DOB does not match Find Donor entry' });
        ctrl?.markAsTouched();
        this.cdr.markForCheck();
        return;
      }
    }
    delete this.donorMismatchErrors['dob'];
    this.validateDobAge();
    this.advanceFromField('dob');
  }

  validateGender(): void {
    const ctrl = this.registrationForm.get('sex');
    const entered = ctrl?.value;
    if (!entered) return;

    if (this.findDonorValues?.sex) {
      if (entered !== this.findDonorValues.sex) {
        this.snackbarService.showError('Error 16007: Sex does not match the donor record');
        ctrl?.setValue(this.findDonorValues.sex);
      }
    } else if (this.newDonorExpected?.sex) {
      if (this.normalizeSex(entered) !== this.normalizeSex(this.newDonorExpected.sex)) {
        this.donorMismatchErrors['sex'] = 'Sex does not match Find Donor entry';
        ctrl?.setErrors({ serverError: 'Sex does not match Find Donor entry' });
        ctrl?.markAsTouched();
        this.cdr.markForCheck();
        return;
      }
    }
    delete this.donorMismatchErrors['sex'];
    this.advanceFromField('sex');
  }

  onNewDonorFieldEnter(event: Event, field: 'lastName' | 'firstName'): void {
    event.preventDefault();
    if (field === 'lastName') this.validateLastName();
    else this.validateFirstName();
  }

  private readonly sexMap: Record<string, string> = {
    'm': 'male', 'male': 'male', 'f': 'female', 'female': 'female',
  };

  private normalizeSex(value: string): string {
    return this.sexMap[value.trim().toLowerCase()] ?? value.trim().toLowerCase();
  }

  private toDisplaySex(value: string | null | undefined): string {
    if (!value) return '';
    const normalized = this.normalizeSex(value);
    if (normalized === 'male') return 'Male';
    if (normalized === 'female') return 'Female';
    return value;
  }

  private toGenderCode(value: string | null | undefined): string | undefined {
    if (!value) return undefined;
    const normalized = this.normalizeSex(value);
    if (normalized === 'male') return 'M';
    if (normalized === 'female') return 'F';
    return value;
  }

  onSexSelectionChange(): void {
    this.validateGender();
  }

  onDonationUnitIdPostValidate(event: UnitIdPostValidateEvent): void {
    const parsedId = event.data.parsedUnitId;
    const initialUnitId = this.unitIdField?.parsedUnitId;

    if (parsedId !== initialUnitId) {
      event.reject('Unit ID does not match the initial Unit ID');
      this.resetRegistrationState();
      setTimeout(() => this.unitIdField?.clear(), 150);
      return;
    }
    event.confirm();
  }

  onDonationUnitIdValidated(_: SharedUnitValidationResponse): void {
    this.onAutoSave();
  }

  onVoidUnitIdValidated(data: SharedUnitValidationResponse): void {
    this.registrationForm.patchValue({ voidUnit: data.parsedUnitId || '' });
    this.cdr.markForCheck();
    this.donationUnitIdField?.focus();
  }

  onVoidUnitIdCleared(): void {
    this.registrationForm.patchValue({ voidUnit: '' });
    this.cdr.markForCheck();
  }

  onNewEmployerSaved(event: { message: string; employerId: string; employerName: string }): void {
    this.showAddEmployerPanel = false;

    // Fetch all employers to refresh the list and get the newly created employer with full details
    this.donorService.getEmployers(event.employerName.substring(0, 3))
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.filteredEmployers.set(data);

          // Automatically select the newly created employer
          this.registrationForm.patchValue({ employerSchoolName: event.employerId });
          this.onEmployerSelected(event.employerId);

          this.cdr.markForCheck();
        },
        error: () => {
          // If fetching fails, add the employer with minimal data
          const newEmployer: EmployerLookupDto = {
            employerId: event.employerId,
            employerName: event.employerName,
            city: null,
            state: null,
            zip: null,
            country: null,
            uspsId: null,
            intlAddrFlag: null
          };

          const currentEmployers = this.filteredEmployers();
          this.filteredEmployers.set([newEmployer, ...currentEmployers]);

          // Automatically select the newly created employer
          this.registrationForm.patchValue({ employerSchoolName: event.employerId });
          this.onEmployerSelected(event.employerId);

          this.cdr.markForCheck();
        }
      });
  }

  private combineDateTime(timeStr: string | undefined, dateStr: string | undefined): string | undefined {
    if (!timeStr || !timeStr.includes(':')) return undefined;
    if (!dateStr) return undefined;
    return `${dateStr}T${timeStr}:00`;
  }

  onAutoSave(): void {
    if (this.isLoading()) return;

    // Use manualUnitId for ISBT128 units (includes check digit - 15 chars)
    // Use parsedUnitId for Codabar units (no check digit)
    const unitIdData = this.unitIdField?.parsedUnitData;
    const unitId = unitIdData?.codeScheme === 'I'
      ? unitIdData.manualUnitId
      : this.unitIdField?.parsedUnitId;

    if (!unitId) return;

    if (!this.isHoldAction()) {
      this.registrationForm.markAllAsTouched();
      if (this.registrationForm.invalid) return;
    }

    this.isLoading.set(true);

    const driveId = this.searchForm.get('driveId')?.value;
    const collDate = this.registrationForm.getRawValue().collectionDate;
    const formValue = this.registrationForm.getRawValue();

    const isNewDonor = !!this.newDonorExpected && !formValue.donorId;

    const resolvedState = (this.stateDisplay() !== '--' ? this.stateDisplay() : formValue.state) || undefined;
    const altAddr = this.pendingAltAddress();
    const homePhone = this.parsePhone(formValue.homePhone);
    const workPhone = this.parsePhone(formValue.workPhone);
    const mobilePhone = this.parsePhone(formValue.mobilePhone);

    const request: CreateRegisterDonationRequest = {
      // === Required fields ===
      donorId: formValue.donorId || undefined,
      unitId: unitId,
      donationType: formValue.donation,
      driveId: driveId,

      // === Donation details ===
      procedureCode: formValue.procedure || undefined,
      equipType: formValue.equipmentType || undefined,
      lookupId: formValue.lookupId || undefined,
      screenerId: formValue.historianId || undefined,
      physicalId: formValue.physicalId || undefined,
      firstReviewerId: formValue.reviewerId || undefined,
      creditSponsor: formValue.alternateSponsorId || undefined,
      materialId: formValue.materialVerificationId || undefined,
      armUsed: formValue.armUsed || undefined,
      deferralReason: formValue.deferral || undefined,
      deferralType: formValue.deferralType || undefined,
      deferredThruDate: formValue.deferredThru
        ? (DateFieldValidationUtility.serializeDateForApi(moment(formValue.deferredThru)) ?? undefined)
        : undefined,
      sVenipuncture: formValue.venipunctureCodes || undefined,
      collDate: collDate
        ? (DateFieldValidationUtility.serializeDateForApi(moment(collDate)) ?? undefined)
        : undefined,
      sReaction: formValue.reactionCodes || undefined,

      // === Bleed times (combined with collection date to avoid timezone shift) ===
      bleedStartTimeL1: this.combineDateTime(this.bleedTimeData?.leftArm?.startTime1, collDate),
      bleedStartPhlebL1: this.bleedTimeData?.leftArm?.startPhleb1 || undefined,
      bleedEndTimeL: this.combineDateTime(this.bleedTimeData?.leftArm?.endTime1, collDate),
      bleedEndPhlebL: this.bleedTimeData?.leftArm?.endPhleb1 || undefined,
      bleedStartTimeL2: this.combineDateTime(this.bleedTimeData?.leftArm?.startTime2, collDate),
      bleedStartPhlebL2: this.bleedTimeData?.leftArm?.startPhleb2 || undefined,
      bleedEndTimeL2: this.combineDateTime(this.bleedTimeData?.leftArm?.endTime2, collDate),
      bleedEndPhlebL2: this.bleedTimeData?.leftArm?.endPhleb2 || undefined,
      bleedStartTimeR1: this.combineDateTime(this.bleedTimeData?.rightArm?.startTime1, collDate),
      bleedStartPhlebR1: this.bleedTimeData?.rightArm?.startPhleb1 || undefined,
      bleedEndTimeR: this.combineDateTime(this.bleedTimeData?.rightArm?.endTime1, collDate),
      bleedEndPhlebR: this.bleedTimeData?.rightArm?.endPhleb1 || undefined,
      bleedStartTimeR2: this.combineDateTime(this.bleedTimeData?.rightArm?.startTime2, collDate),
      bleedStartPhlebR2: this.bleedTimeData?.rightArm?.startPhleb2 || undefined,
      bleedEndTimeR2: this.combineDateTime(this.bleedTimeData?.rightArm?.endTime2, collDate),
      bleedEndPhlebR2: this.bleedTimeData?.rightArm?.endPhleb2 || undefined,
      actualRbcLoss: this.bleedTimeData?.mrsLoss ? parseFloat(this.bleedTimeData.mrsLoss) : undefined,
      actualPlasmaLoss: this.bleedTimeData?.phlebotomistLoss ? parseFloat(this.bleedTimeData.phlebotomistLoss) : undefined,

      // === Donor demographics ===
      gender: this.toGenderCode(formValue.sex),
      donorWeight: formValue.weight || undefined,
      employerId: formValue.employerSchoolName || undefined,
      lastName: formValue.lastName || undefined,
      firstName: formValue.firstName || undefined,
      middleName: formValue.middleName || undefined,
      lastNameSuffix: formValue.suffix || undefined,
      bloodType: formValue.abo || undefined,
      ethnicGroup: formValue.ethnicGroup || undefined,
      alternateId: formValue.alternateId || undefined,
      alternateType: formValue.alternateType || undefined,
      scanId: undefined,
      idQueue: formValue.idQueue || undefined,
      employerName: this.resolveEmployerName(formValue.employerSchoolName) || undefined,
      employerCity: formValue.employerCity || undefined,
      employerZip: formValue.employerZip || undefined,
      eUspsId: this.selectedEUspsId() ?? undefined,

      // === US address ===
      streetName: formValue.homeAddress || '',
      suiteApt: formValue.apartmentNo || '',
      uspsId: this.selectedUspsId() ?? null,
      city: formValue.city || '',
      zip: formValue.zip || '',
      state: resolvedState || '',
      hAreaCode: homePhone.areaCode || '',
      hPhoneNo: homePhone.phoneNo || '',
      dAreaCode: workPhone.areaCode || '',
      dPhoneNo: workPhone.phoneNo || '',
      extension: formValue.extension ? Number(formValue.extension) : undefined,
      mAreaCode: mobilePhone.areaCode || '',
      mPhoneNo: mobilePhone.phoneNo || '',
      email: formValue.email || '',
      preferredContactPhone: formValue.preferredPhone || '',

      // === International address (flat fields) ===
      intlAddrFlag: this.donorIntlAddress?.intlAddrFlag ?? 'N',
      intlAddress1: this.donorIntlAddress?.addr1 ?? '',
      intlAddress2: this.donorIntlAddress?.addr2 ?? '',
      intlAddress3: this.donorIntlAddress?.addr3 ?? '',
      intlAddress4: this.donorIntlAddress?.addr4 ?? '',
      countryName: this.donorIntlAddress?.country ?? '',
      intlPostalCode: this.donorIntlAddress?.postalCode ?? '',
      intlHomePhoneNo: this.donorIntlAddress?.homePhoneNo ?? '',
      intlWorkPhoneNo: this.donorIntlAddress?.workPhoneNo ?? '',
      intlWorkPhoneExt: this.donorIntlAddress?.workPhoneExt ?? '',
      intlMobilePhoneNo: this.donorIntlAddress?.mobilePhoneNo ?? '',
      intlFaxNo: this.donorIntlAddress?.faxNo ?? '',
      intlCity: this.donorIntlAddress?.streetName ?? '',

      // === Alternate address ===
      altStreetName: altAddr?.streetName ?? '',
      altSuiteApt: altAddr?.suiteApt ?? '',
      altUspsId: altAddr?.uspsId ?? undefined,
      altIntlAddress1: altAddr?.intlAddress1 ?? '',
      altIntlAddress2: altAddr?.intlAddress2 ?? '',
      altIntlAddress3: altAddr?.intlAddress3 ?? '',
      altIntlAddress4: altAddr?.intlAddress4 ?? '',
      altCountryName: altAddr?.countryName ?? '',
      altIntlPostalCode: altAddr?.intlPostalCode ?? '',
      altIntlAddrFlag: altAddr?.intlAddrFlag ?? '',
      otherContactNo: altAddr?.otherContactNumber ?? '',
      altIntlPhoneNo: altAddr?.altIntlPhoneNumber ?? '',
      altIntlCityName: altAddr?.intlCity ?? '',
      preferredContactAddress: altAddr?.preferredContactAddress ?? '',

      // === New donor flag ===
      isNewDonor,
      newDonorDetails: isNewDonor ? {
        lastName: formValue.lastName,
        firstName: formValue.firstName,
        dateOfBirth: formValue.dob
          ? (DateFieldValidationUtility.serializeDateForApi(moment(formValue.dob)) ?? '')
          : '',
        gender: this.toGenderCode(formValue.sex) ?? '',
        middleName: formValue.middleName || undefined,
        salutation: undefined,
        alias: undefined,
        lastNameSuffix: formValue.suffix || undefined,
        ethnicGroup: formValue.ethnicGroup || undefined,
        alternateId: formValue.alternateId || undefined,
        alternateIdType: formValue.alternateType || undefined,
        scanId: undefined,
        address: {
          streetName: formValue.homeAddress || '',
          suiteApt: formValue.apartmentNo || '',
          uspsId: this.selectedUspsId() ?? undefined,
          city: formValue.city || '',
          zip: formValue.zip || '',
          state: resolvedState || '',
          hAreaCode: homePhone.areaCode || '',
          hPhoneNo: homePhone.phoneNo || '',
          dAreaCode: workPhone.areaCode || '',
          dPhoneNo: workPhone.phoneNo || '',
          mAreaCode: mobilePhone.areaCode || '',
          mPhoneNo: mobilePhone.phoneNo || '',
          email: formValue.email || '',
          intlAddrFlag: this.donorIntlAddress?.intlAddrFlag ?? 'N',
          intlAddress1: this.donorIntlAddress?.addr1 ?? '',
          intlAddress2: this.donorIntlAddress?.addr2 ?? '',
          intlAddress3: this.donorIntlAddress?.addr3 ?? '',
          intlAddress4: this.donorIntlAddress?.addr4 ?? '',
          countryName: this.donorIntlAddress?.country ?? '',
          intlPostalCode: this.donorIntlAddress?.postalCode ?? '',
          intlHomePhoneNo: this.donorIntlAddress?.homePhoneNo ?? '',
          intlWorkPhoneNo: this.donorIntlAddress?.workPhoneNo ?? '',
          intlWorkPhoneExt: this.donorIntlAddress?.workPhoneExt ?? '',
          intlMobilePhoneNo: this.donorIntlAddress?.mobilePhoneNo ?? '',
          intlFaxNo: this.donorIntlAddress?.faxNo ?? '',
        },
      } : undefined,

      // === Nested international address objects ===
      donorInternationalAddress: this.donorIntlAddress ? {
        streetName: this.donorIntlAddress.streetName,
        addr1: this.donorIntlAddress.addr1,
        addr2: this.donorIntlAddress.addr2,
        addr3: this.donorIntlAddress.addr3,
        addr4: this.donorIntlAddress.addr4,
        countryName: this.donorIntlAddress.country,
        postalCode: this.donorIntlAddress.postalCode,
        homePhone: this.donorIntlAddress.homePhoneNo,
        workPhone: this.donorIntlAddress.workPhoneNo,
        workPhoneExt: this.donorIntlAddress.workPhoneExt,
        mobilePhone: this.donorIntlAddress.mobilePhoneNo,
        faxNo: this.donorIntlAddress.faxNo,
        email: this.donorIntlAddress.email,
        intlAddrFlag: this.donorIntlAddress.intlAddrFlag ?? 'Y',
        modifiedFlag: 'Y',
      } : undefined,
      employerInternationalAddress: this.employerIntlAddress ? {
        streetName: this.employerIntlAddress.streetName,
        addr1: this.employerIntlAddress.addr1,
        addr2: this.employerIntlAddress.addr2,
        addr3: this.employerIntlAddress.addr3,
        addr4: this.employerIntlAddress.addr4,
        countryName: this.employerIntlAddress.country,
        postalCode: this.employerIntlAddress.postalCode,
        homePhone: this.employerIntlAddress.homePhoneNo,
        workPhone: this.employerIntlAddress.workPhoneNo,
        workPhoneExt: this.employerIntlAddress.workPhoneExt,
        mobilePhone: this.employerIntlAddress.mobilePhoneNo,
        faxNo: this.employerIntlAddress.faxNo,
        email: this.employerIntlAddress.email,
        intlAddrFlag: this.employerIntlAddress.intlAddrFlag ?? 'Y',
        modifiedFlag: 'Y',
      } : undefined,

      interdictions: this.pendingHolds().map(hold => ({
        interCode: hold.interCode,
        interType: hold.interType || 'HOLDS',
        description: hold.interDesc || '',
        comments: '',
        transactionId: '',
        termDate: '',
        releaseDate: '',
        releaseUser: '',
        programId: '',
        chapterId: this.headerService.getCurrentChapterId(),
        collDate: '',
      })),
      sessionId: undefined,
    };

    if (this.isHoldAction()) {
      const criteria = this.holdSearchCriteria;
      request.lastName = (criteria?.lastName || '').toUpperCase() || undefined;
      request.firstName = (criteria?.firstName || '').toUpperCase() || undefined;
      request.dateOfBirth = criteria?.dob
        ? (DateFieldValidationUtility.serializeDateForApi(moment(criteria.dob)) ?? undefined)
        : undefined;
      request.gender = criteria?.sex || request.gender;
      request.sessionId = '';
      request.donorId = '';
    }

    const apiCall$ = this.isHoldAction()
      ? this.donorService.registerHold(request)
      : this.donorService.create(request);
    apiCall$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading.set(false);
          if (response.success) {
            const transactionId = response.item?.transactionId ?? '';
            const donorId = response.item?.donorId ?? this.registrationForm.getRawValue().donorId ?? '';
            this.registrationForm.get('transactionId')?.setValue(transactionId);
            this.cdr.markForCheck();
            this.onDonationSaveComplete(donorId);
          } else {
            const errorMsg =
              response.errorResponse?.error ||
              response.message ||
              'Failed to register donation.';
            this.snackbarService.showError(errorMsg);
            this.clearFinalUnitId();
          }
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.isLoading.set(false);
          const errorMsg =
            error?.error?.errorResponse?.error ||
            error?.error?.message ||
            'An error occurred while registering donation.';
          this.snackbarService.showError(errorMsg);
          this.clearFinalUnitId();
          this.cdr.markForCheck();
        },
      });
  }

  private onDonationSaveComplete(donorId?: string): void {
    const msg = this.isHoldAction()
      ? `Donation placed on hold. Transaction ID: ${this.registrationForm.get('transactionId')?.value ?? ''}`
      : 'Donation registered successfully.';
    this.snackbarService.showSuccess(msg);

    if (this.attachDonorReturnUrl && this.attachDonorTransactionId) {
      const returnUrl = this.attachDonorReturnUrl;
      const transactionId = this.attachDonorTransactionId;
      this.attachDonorReturnUrl = null;
      this.attachDonorTransactionId = null;

      setTimeout(() => {
        this.router.navigate([returnUrl], {
          queryParams: {
            transactionId,
            newDonorId: donorId || undefined,
          }
        });
      }, 1500);
      return;
    }

    setTimeout(() => {
      this.resetRegistrationState();
      const driveDate = moment(this.searchForm.get('driveDate')?.value).format('YYYY-MM-DD');
      this.registrationForm.get('collectionDate')?.setValue(driveDate);
      this.cdr.markForCheck();
      this.unitIdField?.unitIdControl?.markAsUntouched();
      document.querySelector<HTMLInputElement>('app-unit-id-field input')?.focus();
    }, 2000);
  }

  private clearFinalUnitId(): void {
    this.donationUnitIdField?.clear();
    this.cdr.markForCheck();
  }

  openInternationalAddress(target: 'donor' | 'employer'): void {
    const existingAddress = target === 'donor'
      ? this.donorIntlAddress
      : this.employerIntlAddress;

    const dialogRef = this.dialog.open(InternationalAddressDialogComponent, {
      width: '600px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      position: { bottom: '0px', right: '0px' },
      panelClass: 'find-donor-panel',
      disableClose: true,
      data: {
        existingAddress,
        targetTable: null,
      },
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result: InternationalAddressModel | null | undefined) => {
        if (result) {
          if (target === 'donor') {
            this.donorIntlAddress = result;
            this.disableAddressFields();
          } else {
            // For employer, update the employer record with international address
            this.updateEmployerInternationalAddress(result);
          }
        } else if (result === null) {
          if (target === 'donor') {
            this.enableAddressFields();
          } else {
            this.enableEmployerFields();
          }
        }
        this.cdr.markForCheck();
        const activeEl = document.activeElement as HTMLElement;
        activeEl?.blur();
        this.focusActiveField();
      });
  }

  private updateEmployerInternationalAddress(address: InternationalAddressModel): void {
    // According to FMB analysis: Just store the international address locally
    // The DONOR_EMPLOYERS table will be updated when the donor record is saved
    this.employerIntlAddress = address;
    this.disableEmployerFields();
    this.cdr.markForCheck();
  }

  openAlternateDemographics(): void {
    const donorId = this.registrationForm.get('donorId')?.value;
    const pending = this.pendingAltAddress();

    if (donorId && !pending) {
      this.altDemoService.getByDonorId(donorId)
        .pipe(takeUntil(this.destroy$))
        .subscribe((existing) => this.openAltAddressDialog(existing ?? undefined));
    } else {
      this.openAltAddressDialog(pending ?? undefined);
    }
  }

  private openAltAddressDialog(existingData?: AlternateDemographicsModel): void {
    const dialogData: AlternateDemographicsDialogData = { existingData };

    this.dialog.open(AlternateDemographicsDialogComponent, {
      width: '700px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      position: { bottom: '0px', right: '0px' },
      panelClass: 'find-donor-panel',
      data: dialogData,
      disableClose: true,
      hasBackdrop: true,
    }).afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result: AlternateDemographicsModel | null | undefined | string) => {
        if (result === null) {
          this.pendingAltAddress.set(null);
        } else if (result && typeof result === 'object') {
          this.pendingAltAddress.set(result);
        }
        const activeEl = document.activeElement as HTMLElement;
        activeEl?.blur();
        this.focusActiveField();
      });
  }

  onArmUsedChange(): void {
    this.openBleedTimeDetails();
  }

  onArmFieldClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const isArrow = target.closest('.mat-mdc-select-arrow-wrapper');
    if (isArrow || !this.registrationForm.get('armUsed')?.value) {
      return;
    }
    event.stopPropagation();
    event.preventDefault();
    this.armSelect.close();
    this.openBleedTimeDetails();
  }

  openBleedTimeDetails(): void {
    const collDate = this.registrationForm.get('collectionDate')?.value;
    const driveDate = collDate || this.searchForm.get('driveDate')?.value;
    const currentArm = this.registrationForm.get('armUsed')?.value || '';

    const dialogRef = this.dialog.open(BleedTimeDetailsDialog, {
      width: '1077px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      position: { bottom: '0px', right: '0px' },
      panelClass: 'bleed-time-panel',
      disableClose: true,
      data: {
        currentDriveDate: driveDate
          ? moment(driveDate).format('DD-MMM-YYYY')
          : moment().format('DD-MMM-YYYY'),
        employees: this.employees(),
        selectedArm: currentArm,
        leftArm: this.bleedTimeData?.leftArm,
        rightArm: this.bleedTimeData?.rightArm,
        other: this.bleedTimeData?.other,
        drawStartTime: this.bleedTimeData?.drawStartTime ?? '',
        mrsLoss: this.bleedTimeData?.mrsLoss ?? '',
        phlebotomistLoss: this.bleedTimeData?.phlebotomistLoss ?? '',
      },
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result: BleedTimeDetailsDialogResult | undefined) => {
        if (result?.action === 'apply') {
          if (result.selectedArm) {
            this.registrationForm.get('armUsed')?.setValue(result.selectedArm);
          }
          if (result.data) {
            this.bleedTimeData = this.mapDialogResultToBleedData(result.data);
          }
          this.cdr.markForCheck();
        }
        this.focusActiveField();
      });
  }

  private mapDialogResultToBleedData(raw: BleedTimeDetailsDialogData): BleedTimeDetailsDialogData {
    return {
      ...raw,
      leftArm: {
        startTime1: raw.leftArm?.startTime1 ?? (raw as unknown as Record<string, string>)['leftStartTime1'] ?? '',
        startPhleb1: raw.leftArm?.startPhleb1 ?? (raw as unknown as Record<string, string>)['leftStartPhleb1'] ?? '',
        endTime1: raw.leftArm?.endTime1 ?? (raw as unknown as Record<string, string>)['leftEndTime1'] ?? '',
        endPhleb1: raw.leftArm?.endPhleb1 ?? (raw as unknown as Record<string, string>)['leftEndPhleb1'] ?? '',
        startTime2: raw.leftArm?.startTime2 ?? (raw as unknown as Record<string, string>)['leftStartTime2'] ?? '',
        startPhleb2: raw.leftArm?.startPhleb2 ?? (raw as unknown as Record<string, string>)['leftStartPhleb2'] ?? '',
        endTime2: raw.leftArm?.endTime2 ?? (raw as unknown as Record<string, string>)['leftEndTime2'] ?? '',
        endPhleb2: raw.leftArm?.endPhleb2 ?? (raw as unknown as Record<string, string>)['leftEndPhleb2'] ?? '',
      },
      rightArm: {
        startTime1: raw.rightArm?.startTime1 ?? (raw as unknown as Record<string, string>)['rightStartTime1'] ?? '',
        startPhleb1: raw.rightArm?.startPhleb1 ?? (raw as unknown as Record<string, string>)['rightStartPhleb1'] ?? '',
        endTime1: raw.rightArm?.endTime1 ?? (raw as unknown as Record<string, string>)['rightEndTime1'] ?? '',
        endPhleb1: raw.rightArm?.endPhleb1 ?? (raw as unknown as Record<string, string>)['rightEndPhleb1'] ?? '',
        startTime2: raw.rightArm?.startTime2 ?? (raw as unknown as Record<string, string>)['rightStartTime2'] ?? '',
        startPhleb2: raw.rightArm?.startPhleb2 ?? (raw as unknown as Record<string, string>)['rightStartPhleb2'] ?? '',
        endTime2: raw.rightArm?.endTime2 ?? (raw as unknown as Record<string, string>)['rightEndTime2'] ?? '',
        endPhleb2: raw.rightArm?.endPhleb2 ?? (raw as unknown as Record<string, string>)['rightEndPhleb2'] ?? '',
      },
      other: {
        startTime1: raw.other?.startTime1 ?? (raw as unknown as Record<string, string>)['otherTime'] ?? '',
        startPhleb1: raw.other?.startPhleb1 ?? (raw as unknown as Record<string, string>)['otherPhleb'] ?? '',
        endTime1: raw.other?.endTime1 ?? (raw as unknown as Record<string, string>)['otherEndTime'] ?? '',
        endPhleb1: raw.other?.endPhleb1 ?? (raw as unknown as Record<string, string>)['otherEndPhleb'] ?? '',
        startTime2: '',
        startPhleb2: '',
        endTime2: '',
        endPhleb2: '',
      },
      drawStartTime: (raw as unknown as Record<string, string>)['drawStartTime'] ?? raw.drawStartTime ?? '',
      mrsLoss: (raw as unknown as Record<string, string>)['mrsLoss'] ?? raw.mrsLoss ?? '',
      phlebotomistLoss: (raw as unknown as Record<string, string>)['phlebotomistLoss'] ?? raw.phlebotomistLoss ?? '',
    };
  }

  openManualHolds(): void {
    if (!this.interdictionCodes().length) {
      this.snackbarService.showError('Interdiction codes not loaded. Please try again.');
      return;
    }
    const dialogData = {
      interdictionCodes: this.interdictionCodes(),
      existingHolds: this.pendingHolds().length > 0 ? this.pendingHolds() : undefined,
    };

    this.dialog.open(ManualHoldsDialog, {
      width: '1015px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      position: { bottom: '0px', right: '0px' },
      panelClass: 'find-donor-panel',
      disableClose: true,
      data: dialogData,
    }).afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result: ManualHoldsDialogResult | undefined) => {
        if (result?.action === 'ok' && result.selectedHolds) {
          this.pendingHolds.set(result.selectedHolds);
          this.cdr.markForCheck();
        }
      });
  }

  private isScrollingProgrammatically = false;

  scrollToSection(sectionId: ContentSection): void {
    this.isScrollingProgrammatically = true;
    this.activeSection.set(sectionId);
    this.cdr.markForCheck();

    const element = document.getElementById(`section-${sectionId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => { this.isScrollingProgrammatically = false; }, 800);
    } else {
      this.isScrollingProgrammatically = false;
    }
  }

  private setupSectionObserver(): void {
    if (!this.formContainer?.nativeElement) return;

    const container = this.formContainer.nativeElement;
    const onScroll = () => {
      if (this.isScrollingProgrammatically) return;

      const containerTop = container.getBoundingClientRect().top;
      let current: ContentSection = this.contentSections[0].id;

      for (const section of this.contentSections) {
        const el = document.getElementById(`section-${section.id}`);
        if (el) {
          const elTop = el.getBoundingClientRect().top - containerTop;
          if (elTop <= 20) {
            current = section.id;
          }
        }
      }

      if (this.activeSection() !== current) {
        this.activeSection.set(current);
        this.cdr.markForCheck();
      }
    };

    container.addEventListener('scroll', onScroll, { passive: true });
    this.destroy$.subscribe(() => container.removeEventListener('scroll', onScroll));
  }

  onWeightKeypress(event: KeyboardEvent): void {
    const input = event.target as HTMLInputElement;
    if (!/^\d$/.test(event.key) || input.value.length >= 3) {
      event.preventDefault();
    }
  }

  onWeightPaste(event: ClipboardEvent): void {
    const pastedData = event.clipboardData?.getData('text') ?? '';
    if (!/^\d{1,3}$/.test(pastedData) || parseInt(pastedData, 10) > 999) {
      event.preventDefault();
    }
  }

  formatDate(value: string | null): string {
    if (!value) return '--';
    const m = moment(value);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : value;
  }

  private resetPage(): void {
    this.mode.set('search');
    this.searchForm.reset();
    this.registrationForm.reset();
    this.drives.set([]);
    this.employees.set([]);
    this.currentDonation.set(null);
    this.unitIdField?.clear();
    this.driveDateDoubleEntry = 'idle';
    this.pendingDriveDate = null;
    this.lastConfirmedDriveDate = null;
    this.driveDateMismatchError = null;
    this.donationUnitIdField?.clear();
    this.newDonorExpected = null;
    this.donorMismatchErrors = {};
    this.isExistingDonor.set(false);
    this.findDonorValues = null;
    this.donorIntlAddress = null;
    this.employerIntlAddress = null;
    this.bleedTimeData = null;
    this.pendingHolds.set([]);
    this.isHoldsButtonDisabled = true;
    this.pendingAltAddress.set(null);
    this.filteredEmployers.set([]);
    this.filteredCities.set([]);
    this.stateDisplay.set('--');
    this.employerStateDisplay.set('--');
    this.selectedUspsId.set(null);
    this.selectedEUspsId.set(null);
    this.hasInternationalAddress.set(false);
    this.hasEmployerInternationalAddress.set(false);
    this.deferralReasons.set([]);
    this.selectedSponsor.set(null);
  }

  getSearchFieldError(fieldName: string): string {
    const control = this.searchForm.get(fieldName);
    if (control?.hasError('required') && control.touched) {
      return `${fieldName === 'driveDate' ? 'Drive Date' : 'Drive ID'} is required`;
    }
    return '';
  }

  getFieldError(fieldName: string, label: string): string {
    const control = this.registrationForm.get(fieldName);
    if (!control?.touched) return '';
    if (control.hasError('required')) return `${label} is required`;
    if (control.hasError('min')) return `${label} must be greater than 0`;
    if (control.hasError('mismatch')) return 'Value did not match';
    if (control.hasError('serverError')) {
      const err = control.getError('serverError');
      if (typeof err === 'string') return err;
      return 'Validation failed';
    }
    return '';
  }
}
