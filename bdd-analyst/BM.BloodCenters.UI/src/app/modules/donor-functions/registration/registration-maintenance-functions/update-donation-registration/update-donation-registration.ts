import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  FormControl,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatCardModule } from '@angular/material/card';
import { MatRadioModule } from '@angular/material/radio';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { Observable, Subject, take, takeUntil, forkJoin, distinctUntilChanged, debounceTime, switchMap, of } from 'rxjs';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import moment from 'moment';

import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { InternationalAddressDialogComponent } from '@shared/components/international-address-dialog/international-address-dialog.component';
import { InternationalAddressModel } from '@shared/models/international-address.model';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { UnitIdFieldComponent, UnitIdPostValidateEvent } from '@shared/components/unit-id-field/unit-id-field.component';
import { UnitValidationResponse as SharedUnitValidationResponse } from '@shared/components/unit-id-field/unit-id-field.model';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { MenuService } from '@shared/services/menu.service';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner.component';
import { BleedTimeDetailsDialog } from '@shared/components/bleed-time-details-dialog/bleed-time-details-dialog';
import { ROUTE_REGISTRY } from 'src/app/core/constants/route-registry';
import { RouteKey } from 'src/app/core/constants/route-keys';

import { DonorRegistrationService } from '../../../donor-functions-components/donor-registration/services/donor-registration.service';
import {
  ContentSection,
  ContentNavItem,
  DriveLookupDto,
  ProcedureCodeLookupDto,
  VenipunctureCodeLookupDto,
  EmployeeLookupDto,
  InterdictionCodeLookupDto,
  EmployerLookupDto,
  EthnicGroupLookupDto,
  AlternateTypeLookupDto,
  DonationTypeLookupDto,
  SponsorLookupDto,
  CodeDescriptionDto,
  DeferralReasonLookupDto,
  BleedTimeDetailsDialogData,
  BleedTimeDetailsDialogResult,
  ManualHoldsDialogResult,
  UnitValidationResponse,
  FieldValidationResult,
  CityStateLookupDto,
} from '../../../donor-functions-components/donor-registration/models/donor-registration.model';
import { ManualHoldsDialog } from '../../../donor-functions-components/donor-registration/dialogs/manual-holds-dialog/manual-holds-dialog';
import { ConfirmActionDialogComponent } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';
import { AlternateDemographicsDialogComponent } from '@shared/components/alternate-demographics-dialog/alternate-demographics-dialog.component';
import { AlternateDemographicsDialogData, AlternateDemographicsModel } from '@shared/models/alternate-demographics.model';
import { AlternateDemographicsService } from '@shared/services/alternate-demographics.service';

import { UpdateDonationRegistrationService } from './services/update-donation-registration.service';
import { UpdateDonationRetrieveResponse, UpdateDonationSaveRequest } from './models/update-donation-registration.model';

@Component({
  selector: 'app-update-donation-registration',
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
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    {
      provide: DateAdapter,
      useClass: ChapterAwareDateAdapter,
      deps: [MAT_DATE_LOCALE],
    },
  ],
  templateUrl: './update-donation-registration.html',
  styleUrls: ['./update-donation-registration.scss'],
})
export class UpdateDonationRegistrationComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('formContainer') formContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('armSelect') armSelect!: MatSelect;
  @ViewChild('searchUnitIdField') searchUnitIdField?: UnitIdFieldComponent;
  @ViewChild('donationUnitIdField') donationUnitIdField?: UnitIdFieldComponent;

  private readonly destroy$ = new Subject<void>();
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly dialog = inject(MatDialog);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly updateService = inject(UpdateDonationRegistrationService);
  private readonly donorService = inject(DonorRegistrationService);
  private readonly headerService = inject(HeaderService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly altDemoService = inject(AlternateDemographicsService);
  private readonly menuService = inject(MenuService);

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: 'Update Donation Registration' },
    ],
    title: 'Update Donation Registration',
    subtitle: 'Search for an existing donation, update or create a new one',
    actions: [],
  };

  mode = signal<'search' | 'edit'>('search');
  isLoading = signal(false);
  activeSection = signal<ContentSection>('donor');

  currentDonation = signal<UpdateDonationRetrieveResponse | null>(null);
  enteredByName = signal<string>('--');
  employerState = signal<string>('--');
  donorId = signal('');
  aboDescription = signal('--');
  driveDate = signal('');
  transactionId = signal('--');
  lastNameDisplay = signal('--');
  dobDisplay = signal('--');
  sexDisplay = signal('--');
  loadedScanId: string | null = null;

  drives = signal<DriveLookupDto[]>([]);
  procedureCodes = signal<ProcedureCodeLookupDto[]>([]);
  venipunctureCodes = signal<VenipunctureCodeLookupDto[]>([]);
  employees = signal<EmployeeLookupDto[]>([]);
  interdictionCodes = signal<InterdictionCodeLookupDto[]>([]);
  ethnicGroups = signal<EthnicGroupLookupDto[]>([]);
  alternateTypes = signal<AlternateTypeLookupDto[]>([]);
  donationTypes = signal<DonationTypeLookupDto[]>([]);
  sponsors = signal<SponsorLookupDto[]>([]);
  equipmentTypes = signal<CodeDescriptionDto[]>([]);
  reactionCodesList = signal<CodeDescriptionDto[]>([]);
  deferralReasons = signal<DeferralReasonLookupDto[]>([]);

  readonly deferralTypes: CodeDescriptionDto[] = [
    { code: 'IND', description: 'Indefinite' },
    { code: 'NA', description: 'Not Applicable' },
    { code: '99', description: 'Unknown' },
  ];

  isHoldsButtonDisabled = true;
  selectedHolds: InterdictionCodeLookupDto[] = [];
  private originalHoldCodes = new Set<string>();
  donorIntlAddress: InternationalAddressModel | null = null;
  employerIntlAddress: InternationalAddressModel | null = null;
  bleedTimeData: BleedTimeDetailsDialogData | null = null;
  hasInternationalAddress = signal(false);
  hasEmployerInternationalAddress = signal(false);
  private readonly pendingAltAddress = signal<AlternateDemographicsModel | null>(null);
  private readonly addressFields = ['homeAddress', 'apartmentNo', 'city', 'zip'];
  private readonly employerFields = ['employerSchoolName'];
  private readonly intlDisabledFields = [
    'homeAddress', 'apartmentNo', 'city', 'zip',
    'homePhone', 'workPhone', 'mobilePhone', 'email',
  ];

  searchForm!: FormGroup;
  editForm!: FormGroup;

  navigatedFromParent = false;
  hasUnsavedChanges = false;
  stateDisplay = signal('--');
  private selectedUspsId = signal<number | null>(null);
  private selectedEUspsId = signal<number | null>(null);

  driveSearchControl = new FormControl('');
  ethnicGroupSearchControl = new FormControl('');
  donationSearchControl = new FormControl('');
  procedureSearchControl = new FormControl('');
  physicalIdSearchControl = new FormControl('');
  deferralSearchControl = new FormControl('');
  reviewerSearchControl = new FormControl('');
  venipunctureSearchControl = new FormControl('');
  lookupIdSearchControl = new FormControl('');
  equipTypeSearchControl = new FormControl('');
  reactionSearchControl = new FormControl('');
  materialVerifSearchControl = new FormControl('');
  historianSearchControl = new FormControl('');
  altSponsorSearchControl = new FormControl('');
  deferralTypeSearchControl = new FormControl('');
  employerSearchControl = new FormControl('');
  citySearchControl = new FormControl('');
  employerCitySearchControl = new FormControl('');
  filteredEmployers = signal<EmployerLookupDto[]>([]);
  filteredCities = signal<CityStateLookupDto[]>([]);
  filteredEmployerCities = signal<CityStateLookupDto[]>([]);

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

  filteredSponsors = computed(() => this.sponsors());

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
      (d) =>
        d.reasonCode.toLowerCase().includes(search)
    );
  });

  ngOnInit(): void {
    const isChildRoute = this.route.parent?.routeConfig?.path?.includes('donations-on-hold') || false;
    const menuItem = this.menuService.findMenuItemByPath(ROUTE_REGISTRY[RouteKey.UpdateDonationRegistration].path);
    if (menuItem) {
      this.headerConfig = {
        ...this.headerConfig,
        title: menuItem.label,
        subtitle: menuItem.remarks?.trim() || menuItem.subtitle?.trim(),
      };
    }
    if (isChildRoute) {
      const parentMenuItem = this.menuService.findMenuItemByPath(ROUTE_REGISTRY[RouteKey.DonationsOnHoldQuery].path);
      this.headerConfig = {
        ...this.headerConfig,
        breadcrumbs: [
          { label: 'Home', link: '/home' },
          { label: parentMenuItem?.label || 'Donations on Hold Query', link: ROUTE_REGISTRY[RouteKey.DonationsOnHoldQuery].path },
          { label: this.headerConfig.title || 'Update Donation Registration' },
        ],
      };
    }

    this.initSearchForm();
    this.initEditForm();
    this.setupSearchTermSignals();
    this.loadStaticLovs();
    this.setupSponsorSearch();
    this.setupEmployerSearch();
    this.setupCitySearch();
    this.setupEmployerCitySearch();
    this.setupDonationTypeListener();
    this.setupDeferralTypeListener();
    this.setupDeferredThruValidation();
    this.subscribeToChapterChanges();
    this.checkQueryParams();
  }

  private checkQueryParams(): void {
    this.route.queryParams
      .pipe(take(1), takeUntil(this.destroy$))
      .subscribe((params) => {
        const unitId = params['unitId'];
        const collectionDate = params['collectionDate'];
        if (unitId && collectionDate) {
          this.navigatedFromParent = true;
          this.searchForm.patchValue({
            collectionDate: moment(collectionDate),
          });
          setTimeout(() => {
            if (this.searchUnitIdField) {
              this.searchUnitIdField.unitIdControl.setValue(unitId);
              this.searchUnitIdField.unitIdControl.markAsTouched();
              this.searchUnitIdField.onBlur();
            }
          }, 500);
        }
      });
  }

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

  ngAfterViewInit(): void {
    this.setupSectionObserver();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initSearchForm(): void {
    this.searchForm = this.fb.group({
      collectionDate: [{ value: null, disabled: true }],
    });
  }

  private initEditForm(): void {
    this.editForm = this.fb.group({
      driveId: [''],
      suffix: ['', Validators.maxLength(5)],
      firstName: ['', Validators.maxLength(50)],
      middleName: ['', Validators.maxLength(25)],
      weight: [null, [Validators.required, Validators.min(1), Validators.max(999), Validators.pattern(/^\d+$/)]],
      alternateId: ['', Validators.maxLength(20)],
      alternateType: [''],
      idQueue: [''],
      homeAddress: ['', Validators.maxLength(50)],
      apartmentNo: ['', Validators.maxLength(10)],
      city: ['', [Validators.maxLength(40), Validators.minLength(3)]],
      zip: ['', Validators.maxLength(6)],
      homePhone: ['', Validators.maxLength(14)],
      workPhone: ['', Validators.maxLength(14)],
      workPhoneExt: ['', [Validators.maxLength(6), Validators.pattern(/^\d*$/)]],
      mobilePhone: ['', Validators.maxLength(14)],
      email: ['', [Validators.email, Validators.maxLength(128)]],
      preferredPhone: [''],
      employerSchoolName: [''],
      employerId: [''],
      employerCity: [{ value: '', disabled: true }, Validators.maxLength(40)],
      employerZip: [{ value: '', disabled: true }, [Validators.maxLength(6), Validators.pattern(/^\d{5,6}$/)]],
      ethnicGroup: ['', Validators.required],
      alternateSponsorId: [''],
      lookupId: [''],
      donation: ['', Validators.required],
      procedure: ['', Validators.required],
      physicalId: [''],
      deferral: ['', Validators.required],
      deferredThru: [null],
      deferralType: ['', Validators.required],
      historianId: [''],
      armUsed: ['', Validators.required],
      venipunctureCodes: [''],
      reviewerId: [''],
      reactionCodes: [''],
      materialVerificationId: [''],
      equipmentType: [''],
      voidUnit: [''],
    });
  }

  private loadStaticLovs(): void {
    this.donorService
      .getEthnicGroups()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.ethnicGroups.set(data);
          this.repatchDropdownValues();
          this.cdr.markForCheck();
        },
      });

    this.donorService
      .getAlternateIdTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.alternateTypes.set(data);
          this.repatchDropdownValues();
          this.cdr.markForCheck();
        },
      });

    this.donorService
      .getEquipmentTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.equipmentTypes.set(data);
          this.repatchDropdownValues();
          this.cdr.markForCheck();
        },
      });

    this.donorService
      .getReactionCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.reactionCodesList.set(data);
          this.repatchDropdownValues();
          this.cdr.markForCheck();
        },
      });
  }

  private loadFormLovs(driveDate: string): void {
    forkJoin({
      drives: this.donorService.getDrives(driveDate),
      employees: this.donorService.getEmployees(driveDate),
      venipunctureCodes: this.donorService.getVenipunctureCodes(),
      interdictionCodes: this.donorService.getInterdictionCodes(),
      donationTypes: this.donorService.getDonationTypes(),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.drives.set(result.drives);
          this.employees.set(result.employees);
          this.venipunctureCodes.set(result.venipunctureCodes);
          this.interdictionCodes.set(result.interdictionCodes);
          this.donationTypes.set(result.donationTypes);
          this.repatchDropdownValues();
          this.cdr.markForCheck();
        },
        error: () => {
          this.snackbarService.showError('Failed to load lookup data.');
        },
      });
  }

  private setupSponsorSearch(): void {
    this.altSponsorSearchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((keyword) => {
          if (!keyword || keyword.length < 2) return of(null);
          return this.donorService.getSponsors(keyword);
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

  private resolveEmployerName(employerIdOrName: string): string {
    if (!employerIdOrName) return '';
    const match = this.filteredEmployers().find((e) => e.employerId === employerIdOrName);
    return match?.employerName || employerIdOrName;
  }

  onEmployerSelected(employerId: string): void {
    if (!employerId) {
      this.editForm.patchValue({ employerId: '', employerCity: '', employerZip: '' }, { emitEvent: false });
      this.employerState.set('--');
      this.cdr.markForCheck();
      return;
    }
    const employer = this.filteredEmployers().find((e) => e.employerId === employerId);
    if (!employer) return;

    this.editForm.patchValue({
      employerId: employer.employerId,
      employerSchoolName: employer.employerId,
      employerCity: employer.city || '',
      employerZip: employer.zip || '',
    }, { emitEvent: false });
    this.employerState.set(employer.state || '--');
    this.selectedEUspsId.set(employer.uspsId ?? null);
    if (employer.city) {
      this.filteredEmployerCities.set([{ uspsId: employer.uspsId ?? 0, city: employer.city, state: employer.state || '', zip: employer.zip || '' }]);
    }
    this.cdr.markForCheck();
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
          const selectedCity = this.editForm.get('city')?.value;
          if (selectedCity) {
            this.filteredCities.set(this.filteredCities().filter((c) => c.city === selectedCity));
          } else {
            this.filteredCities.set([]);
          }
        }
      });
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
          const selectedCity = this.editForm.get('employerCity')?.value;
          if (selectedCity) {
            this.filteredEmployerCities.set(this.filteredEmployerCities().filter((c) => c.city === selectedCity));
          } else {
            this.filteredEmployerCities.set([]);
          }
        }
      });
  }

  onCitySelected(city: CityStateLookupDto): void {
    this.stateDisplay.set(city.state || '--');
    this.selectedUspsId.set(city.uspsId ?? null);
    this.editForm.patchValue({ zip: city.zip }, { emitEvent: false });
  }

  onEmployerCitySelected(city: CityStateLookupDto): void {
    this.selectedEUspsId.set(city.uspsId ?? null);
    this.editForm.patchValue({
      employerZip: city.zip,
    }, { emitEvent: false });
    this.employerState.set(city.state || '--');
  }

  private setupDonationTypeListener(): void {
    this.editForm.get('donation')?.valueChanges
      .pipe(
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe((donationType) => {
        if (!donationType) {
          this.deferralReasons.set([]);
          return;
        }
        const donation = this.currentDonation();
        const driveDate = donation?.driveDate ?? donation?.collDate;
        if (!driveDate) return;
        const formattedDate = this.formatDateForApi(moment(driveDate));

        this.donorService.getDeferralReasons(donationType, formattedDate)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (reasons) => {
              this.deferralReasons.set(reasons);
              this.cdr.markForCheck();
            },
            error: () => {
              this.deferralReasons.set([]);
            },
          });

        this.donorService.getProcedureCodesByDonationType(donationType)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (codes) => {
              this.procedureCodes.set(codes);
              this.cdr.markForCheck();
            },
            error: () => {},
          });
      });
  }

  private formatDateForApi(date: moment.Moment): string {
    if (!date || !date.isValid()) return '';
    return date.format('MMDDYYYY');
  }

  private setupDeferralTypeListener(): void {
    this.editForm.get('deferralType')?.valueChanges
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((deferralType) => {
        const deferredThruCtrl = this.editForm.get('deferredThru');
        if (deferralType === 'IND') {
          deferredThruCtrl?.setValue(null, { emitEvent: false });
          deferredThruCtrl?.disable({ emitEvent: false });
        } else {
          deferredThruCtrl?.enable({ emitEvent: false });
        }
      });
  }

  private setupDeferredThruValidation(): void {
    this.editForm.get('deferredThru')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        const ctrl = this.editForm.get('deferredThru')!;
        if (!value) {
          if (!ctrl.hasError('matDatepickerParse')) {
            ctrl.setErrors(null);
          }
          return;
        }
        const donation = this.currentDonation();
        const driveDate = donation?.driveDate ?? donation?.collDate;
        if (driveDate && moment(value).isAfter(moment(driveDate), 'day')) {
          ctrl.setErrors({ afterDriveDate: true });
        } else if (!ctrl.hasError('matDatepickerParse')) {
          ctrl.setErrors(null);
        }
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

  onSearchUnitIdValidated(data: SharedUnitValidationResponse): void {
    if (this.navigatedFromParent) {
      this.navigatedFromParent = false;
    }
    if (data.collectionDate) {
      const collMoment = moment(data.collectionDate);
      this.searchForm.patchValue({ collectionDate: collMoment });
      const parsedUnitId = this.searchUnitIdField?.parsedUnitId;
      if (parsedUnitId) {
        this.isLoading.set(true);
        this.doRetrieve(parsedUnitId, collMoment.format('YYYY-MM-DD'));
      }
    }
    this.cdr.markForCheck();
  }

  onSearchUnitIdCleared(): void {
    this.cdr.markForCheck();
  }

  onRetrieve(): void {
    const parsedUnitId = this.searchUnitIdField?.parsedUnitId;
    if (!parsedUnitId) {
      this.snackbarService.showError('Please enter and validate a Unit ID before retrieving.');
      return;
    }

    const collDate = this.searchForm.getRawValue().collectionDate;
    const formattedDate = collDate ? moment(collDate).format('YYYY-MM-DD') : '';
    this.isLoading.set(true);
    this.doRetrieve(parsedUnitId, formattedDate);
  }

  private doRetrieve(parsedUnitId: string, formattedDate: string): void {
    this.updateService.retrieveByUnitId(parsedUnitId, formattedDate)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => this.handleRetrieveResponse(response),
        error: (error) => this.handleRetrieveError(error),
      });
  }

  private handleRetrieveResponse(response: any): void {
    if (!response) return;
    this.isLoading.set(false);
    if (response.success && (response.data || response.item)) {
      const data = response.data ?? response.item!;
      this.currentDonation.set(data);
      this.enteredByName.set(data.insertUser ?? data.enteredBy ?? '--');
      if (data.collDate) {
        this.searchForm.patchValue({ collectionDate: moment(data.collDate) });
      }
      this.populateEditForm(data);
      this.preloadSearchDropdowns(data);
      const driveDate = data.driveDate ?? data.collDate;
      if (driveDate) {
        this.loadFormLovs(moment(driveDate).format('YYYY-MM-DD'));
      }
      this.loadDeferralReasonsForDonationType(data.donationType, data.driveDate ?? data.collDate);
      this.loadProcedureCodesForDonationType(data.donationType);
      if (data.transactionId) {
        this.loadExistingInterdictions(data.transactionId);
      }
      this.hasUnsavedChanges = false;
      this.editForm.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => { this.hasUnsavedChanges = true; });
      this.mode.set('edit');
      this.isHoldsButtonDisabled = false;
      this.cdr.markForCheck();
      setTimeout(() => this.setupSectionObserver());
    } else {
      const errorMsg =
        response.errorResponse?.error ||
        response.message ||
        'No donation found for the given Unit ID and Collection Date.';
      this.snackbarService.showError(errorMsg);
    }
    this.cdr.markForCheck();
  }

  private handleRetrieveError(error: any): void {
    this.isLoading.set(false);
    const body = error?.error;
    const errorMsg =
      body?.errorResponse?.error ||
      body?.message ||
      'Failed to retrieve donation record.';
    this.snackbarService.showError(errorMsg);
    this.cdr.markForCheck();
  }

  private formatPhone(areaCode: string | null, phoneNo: string | null): string {
    if (!phoneNo) return '';
    if (areaCode && phoneNo.length >= 7) {
      return `(${areaCode}) ${phoneNo.substring(0, 3)}-${phoneNo.substring(3)}`;
    }
    if (phoneNo.length >= 7) {
      return `${phoneNo.substring(0, 3)}-${phoneNo.substring(3)}`;
    }
    return phoneNo;
  }

  private parsePhone(value: string | null): { areaCode: string; phoneNo: string } {
    if (!value) return { areaCode: '', phoneNo: '' };
    const digits = value.replace(/\D/g, '') || '';
    if (digits.length >= 10) {
      return { areaCode: digits.substring(0, 3), phoneNo: digits.substring(3, 10) };
    }
    if (digits.length >= 7) {
      return { areaCode: '', phoneNo: digits.substring(0, 7) };
    }
    return { areaCode: '', phoneNo: digits };
  }

  private populateEditForm(data: UpdateDonationRetrieveResponse): void {
    this.donorId.set(data.donorId || '');
    this.aboDescription.set(data.aboDescription || data.bloodType || '--');
    const driveDateValue = data.driveDate ?? data.collDate;
    this.driveDate.set(driveDateValue ? moment(driveDateValue).format('DD-MMM-YYYY') : '--');
    this.transactionId.set(data.transactionId || '--');
    this.lastNameDisplay.set(data.lastName || '--');
    this.dobDisplay.set(data.dateOfBirth ? moment(data.dateOfBirth).format('DD-MMM-YYYY') : '--');
    this.sexDisplay.set(this.formatGender(data.gender ?? null));
    this.stateDisplay.set(data.state || '--');
    this.selectedUspsId.set(data.uspsId ?? null);
    this.loadedScanId = data.scanId ?? null;

    if (data.city) {
      this.filteredCities.set([{
        uspsId: data.uspsId ?? 0,
        city: data.city,
        state: data.state || '',
        zip: data.zip || '',
      }]);
    }

    if (data.employerId && data.employerName) {
      this.filteredEmployers.set([{
        employerId: data.employerId,
        employerName: data.employerName,
        city: data.empCity ?? null,
        state: data.empState ?? null,
        zip: data.empZip ?? null,
        country: data.empCountryName ?? null,
        uspsId: data.empUspsId ?? null,
        intlAddrFlag: data.empIntlAddrFlag ?? null,
      }]);
      this.selectedEUspsId.set(data.empUspsId ?? null);
    }

    if (data.empIntlAddrFlag === 'Y') {
      this.employerIntlAddress = {
        streetName: data.empIntlAddress1 ?? '',
        addr1: data.empIntlAddress1 ?? null,
        addr2: data.empIntlAddress2 ?? null,
        addr3: data.empIntlAddress3 ?? null,
        addr4: data.empIntlAddress4 ?? null,
        country: data.empCountryName ?? '',
        postalCode: data.empIntlPostalCode ?? null,
        intlAddrFlag: 'Y',
      };
      this.employerState.set('--');
      this.disableEmployerFields();
    } else {
      this.employerState.set(data.empState || '--');
      if (data.empCity) {
        this.filteredEmployerCities.set([{
          uspsId: data.empUspsId ?? 0,
          city: data.empCity,
          state: data.empState || '',
          zip: data.empZip || '',
        }]);
      }
    }

    this.editForm.patchValue({
      driveId: data.driveId ?? '',
      suffix: data.lastNameSuffix ?? '',
      firstName: data.firstName ?? '',
      middleName: data.middleName ?? '',
      weight: data.donorWeight,
      alternateId: data.alternateId ?? '',
      alternateType: data.alternateIdType ?? '',
      homeAddress: data.streetName ?? '',
      apartmentNo: data.suiteApt ?? '',
      city: data.city ?? '',
      zip: data.zip ?? '',
      homePhone: this.formatPhone(data.hAreaCode, data.hPhoneNo),
      workPhone: this.formatPhone(data.dAreaCode, data.dPhoneNo),
      workPhoneExt: data.extension ? String(data.extension) : '',
      mobilePhone: this.formatPhone(data.mAreaCode, data.mPhoneNo),
      email: data.email ?? '',
      preferredPhone: data.preferredContactPhone === 'H' ? 'home'
        : data.preferredContactPhone === 'W' ? 'work'
        : data.preferredContactPhone === 'M' ? 'mobile' : '',
      employerSchoolName: data.employerId ?? '',
      employerCity: data.empCity ?? '',
      employerZip: data.empZip ?? '',
      ethnicGroup: data.ethnicGroup ?? '',
      alternateSponsorId: data.creditSponsor ?? '',
      lookupId: data.lookupId ?? '',
      donation: data.donationType ?? '',
      procedure: data.procedureCode ?? '',
      physicalId: data.physicalId ?? '',
      deferral: data.deferralReason ?? '',
      deferredThru: data.deferredThruDate ? moment(data.deferredThruDate) : null,
      deferralType: data.deferralType ?? '',
      historianId: data.screenerId ?? '',
      armUsed: data.armUsed ?? '',
      venipunctureCodes: data.venipunctureId ?? data.sVenipuncture ?? '',
      reviewerId: data.firstReviewerId ?? '',
      reactionCodes: data.reactionCode ?? data.sReactions ?? '',
      materialVerificationId: data.materialId ?? '',
      equipmentType: data.equipType ?? '',
      voidUnit: data.voidUnitId ?? '',
    }, { emitEvent: false });

    if (data.nAuditFlag) {
      this.editForm.get('donation')?.disable({ emitEvent: false });
      this.editForm.get('procedure')?.disable({ emitEvent: false });
    }

    if (data.intlAddrFlag === 'Y') {
      this.donorIntlAddress = {
        streetName: data.intlAddress1 ?? '',
        addr1: data.intlAddress2 ?? null,
        addr2: data.intlAddress3 ?? null,
        addr3: data.intlAddress4 ?? null,
        country: data.countryName ?? '',
        postalCode: data.intlPostalCode ?? null,
        homePhoneNo: data.intlHomePhoneNo ?? null,
        workPhoneNo: data.intlWorkPhoneNo ?? null,
        workPhoneExt: data.intlWorkPhoneExt ?? null,
        mobilePhoneNo: data.intlMobilePhoneNo ?? null,
        faxNo: data.intlFaxNo ?? null,
        email: data.email ?? null,
        intlAddrFlag: 'Y',
      };
      this.disableAddressFields();
    }

    if (data.altStreetName || data.altIntlAddress1 || data.otherContactNo) {
      this.pendingAltAddress.set({
        addressType: data.altIntlAddrFlag === 'Y' ? 'I' : 'L',
        streetName: data.altStreetName ?? null,
        suiteApt: data.altSuiteApt ?? null,
        city: data.altCity ?? null,
        state: data.altState ?? null,
        zip: data.altZip ?? null,
        uspsId: data.altUspsId,
        intlAddress1: data.altIntlAddress1,
        intlAddress2: data.altIntlAddress2,
        intlAddress3: data.altIntlAddress3,
        intlAddress4: data.altIntlAddress4,
        countryName: data.altCountryName,
        intlCity: null,
        intlPostalCode: data.altIntlPostalCode,
        intlAddrFlag: data.altIntlAddrFlag,
        mobilePhoneNumber: data.mAreaCode && data.mPhoneNo
          ? `${data.mAreaCode}${data.mPhoneNo}` : null,
        otherContactNumber: data.otherContactNo,
        altIntlPhoneNumber: data.altIntlPhoneNo,
        preferredContactPhone: data.preferredContactPhone,
        preferredContactAddress: data.preferredContactAddress,
      });
    }

    if (data.bleedStartTimeL1 || data.bleedStartTimeR1 || data.bleedStartPhlebL1 || data.bleedStartPhlebR1) {
      const armUsed = data.armUsed ?? '';
      const isLeft = armUsed === 'L' || armUsed === 'B';
      const isRight = armUsed === 'R' || armUsed === 'B';
      const toTime = (v: string | null | undefined): string => {
        if (!v) return '';
        return v.includes('T') ? v.split('T')[1].substring(0, 5) : v;
      };

      this.bleedTimeData = {
        doubleStickId: data.doubleStickId ?? '',
        currentDriveDate: '',
        employees: [],
        selectedArm: armUsed as '',
        drawStartTime: '',
        mrsLoss: '',
        phlebotomistLoss: '',
        other: { startTime1: '', startPhleb1: '', endTime1: '', endPhleb1: '', startTime2: '', startPhleb2: '', endTime2: '', endPhleb2: '' },
        leftArm: {
          startTime1: isLeft ? toTime(data.bleedStartTimeL1) : '',
          startPhleb1: isLeft ? (data.bleedStartPhlebL1 ?? '') : '',
          endTime1: isLeft ? toTime(data.bleedEndTimeL) : '',
          endPhleb1: isLeft ? (data.bleedEndPhlebL ?? '') : '',
          startTime2: isLeft ? toTime(data.bleedStartTimeL2) : '',
          startPhleb2: isLeft ? (data.bleedStartPhlebL2 ?? '') : '',
          endTime2: isLeft ? toTime(data.bleedEndTimeL2) : '',
          endPhleb2: isLeft ? (data.bleedEndPhlebL2 ?? '') : '',
        },
        rightArm: {
          startTime1: isRight ? toTime(data.bleedStartTimeR1) : '',
          startPhleb1: isRight ? (data.bleedStartPhlebR1 ?? '') : '',
          endTime1: isRight ? toTime(data.bleedEndTimeR) : '',
          endPhleb1: isRight ? (data.bleedEndPhlebR ?? '') : '',
          startTime2: isRight ? toTime(data.bleedStartTimeR2) : '',
          startPhleb2: isRight ? (data.bleedStartPhlebR2 ?? '') : '',
          endTime2: isRight ? toTime(data.bleedEndTimeR2) : '',
          endPhleb2: isRight ? (data.bleedEndPhlebR2 ?? '') : '',
        },
      };
    }
  }

  onDonationUnitIdPostValidate(event: UnitIdPostValidateEvent): void {
    const parsedId = event.data.parsedUnitId;
    const donorUnitId = this.currentDonation()?.unitId?.trim();

    if (parsedId !== donorUnitId) {
      event.reject('Unit ID does not match Donor Information Unit ID');
      this.snackbarService.showError('Unit ID mismatch.');
      return;
    }
    event.confirm();
  }

  onDonationUnitIdValidated(_: SharedUnitValidationResponse): void {
    this.onAutoSave();
  }

  onAutoSave(): void {
    if (this.isLoading()) return;
    if (!this.currentDonation()) return;

    this.editForm.markAllAsTouched();
    if (this.editForm.invalid) {
      const invalidFields = this.getInvalidFieldNames();
      this.snackbarService.showError(
        `Please fix required fields: ${invalidFields.join(', ')}`
      );
      this.cdr.markForCheck();
      return;
    }

    this.onSave();
  }

  onSave(): void {
    this.editForm.markAllAsTouched();
    if (this.editForm.invalid) {
      const invalidFields = this.getInvalidFieldNames();
      this.snackbarService.showError(
        `Please fix required fields: ${invalidFields.join(', ')}`
      );
      this.cdr.markForCheck();
      return;
    }

    const donation = this.currentDonation();
    if (!donation) return;

    this.isLoading.set(true);

    const formValue = this.editForm.getRawValue();

    const armUsed = formValue.armUsed || '';
    const isLeftEnabled = armUsed === 'L' || armUsed === 'B';
    const isRightEnabled = armUsed === 'R' || armUsed === 'B';

    const collDate = donation.collDate
      ?? (DateFieldValidationUtility.serializeDateForApi(moment(this.searchForm.get('collectionDate')?.value)) || undefined);

    const request: UpdateDonationSaveRequest = {
      transactionId: donation.transactionId,
      donorId: donation.donorId || undefined,
      collDate,
      driveId: formValue.driveId || undefined,
      lastNameSuffix: formValue.suffix || undefined,
      firstName: formValue.firstName || undefined,
      middleName: formValue.middleName || undefined,
      donorWeight: formValue.weight || undefined,
      alternateId: formValue.alternateId || undefined,
      alternateIdType: formValue.alternateType || undefined,
      idQueue: formValue.idQueue || undefined,
      streetName: formValue.homeAddress || '',
      suiteApt: formValue.apartmentNo || '',
      city: formValue.city || '',
      zip: formValue.zip || '',
      state: (this.stateDisplay() !== '--' ? this.stateDisplay() : ''),
      uspsId: this.selectedUspsId() ?? null,
      hAreaCode: this.parsePhone(formValue.homePhone).areaCode || '',
      hPhoneNo: this.parsePhone(formValue.homePhone).phoneNo || '',
      dAreaCode: this.parsePhone(formValue.workPhone).areaCode || '',
      dPhoneNo: this.parsePhone(formValue.workPhone).phoneNo || '',
      extension: formValue.workPhoneExt ? parseInt(formValue.workPhoneExt, 10) : undefined,
      mAreaCode: this.parsePhone(formValue.mobilePhone).areaCode || '',
      mPhoneNo: this.parsePhone(formValue.mobilePhone).phoneNo || '',
      email: formValue.email || '',
      preferredPhone: formValue.preferredPhone || '',
      employerId: formValue.employerId || undefined,
      employerName: this.resolveEmployerName(formValue.employerSchoolName) || undefined,
      employerCity: formValue.employerCity || undefined,
      employerZip: formValue.employerZip || undefined,
      eUspsId: this.selectedEUspsId() || undefined,
      ethnicGroup: formValue.ethnicGroup || undefined,
      donationType: formValue.donation || undefined,
      procedureCode: formValue.procedure || undefined,
      lookupId: formValue.lookupId || undefined,
      physicalId: formValue.physicalId || undefined,
      screenerId: formValue.historianId || undefined,
      deferralReason: formValue.deferral || undefined,
      deferredThruDate: formValue.deferredThru
        ? (DateFieldValidationUtility.serializeDateForApi(moment(formValue.deferredThru)) ?? undefined)
        : undefined,
      deferralType: formValue.deferralType || undefined,
      firstReviewerId: formValue.reviewerId || undefined,
      creditSponsor: formValue.alternateSponsorId || undefined,
      armUsed: formValue.armUsed || undefined,
      sVenipuncture: formValue.venipunctureCodes || undefined,
      venipunctureId: formValue.venipunctureCodes || undefined,
      sReaction: formValue.reactionCodes || undefined,
      sReactions: formValue.reactionCodes || undefined,
      materialId: formValue.materialVerificationId || undefined,
      equipType: formValue.equipmentType || undefined,
      voidUnitId: formValue.voidUnit || undefined,
      auditKey: donation.auditKey ?? undefined,
      intlAddrFlag: this.donorIntlAddress ? 'Y' : 'N',
      donorInternationalAddress: this.donorIntlAddress ? {
        streetName: this.donorIntlAddress.streetName,
        addr1: this.donorIntlAddress.addr1,
        addr2: this.donorIntlAddress.addr2,
        addr3: this.donorIntlAddress.addr3,
        addr4: this.donorIntlAddress.addr4,
        country: this.donorIntlAddress.country,
        postalCode: this.donorIntlAddress.postalCode,
        homePhoneNo: this.donorIntlAddress.homePhoneNo,
        workPhoneNo: this.donorIntlAddress.workPhoneNo,
        workPhoneExt: this.donorIntlAddress.workPhoneExt,
        mobilePhoneNo: this.donorIntlAddress.mobilePhoneNo,
        faxNo: this.donorIntlAddress.faxNo,
        email: this.donorIntlAddress.email,
      } : undefined,
      employerInternationalAddress: this.employerIntlAddress ? {
        streetName: this.employerIntlAddress.streetName,
        addr1: this.employerIntlAddress.addr1,
        addr2: this.employerIntlAddress.addr2,
        addr3: this.employerIntlAddress.addr3,
        addr4: this.employerIntlAddress.addr4,
        country: this.employerIntlAddress.country,
        postalCode: this.employerIntlAddress.postalCode,
        homePhoneNo: this.employerIntlAddress.homePhoneNo,
        workPhoneNo: this.employerIntlAddress.workPhoneNo,
        workPhoneExt: this.employerIntlAddress.workPhoneExt,
        mobilePhoneNo: this.employerIntlAddress.mobilePhoneNo,
        faxNo: this.employerIntlAddress.faxNo,
        email: this.employerIntlAddress.email,
      } : undefined,
      altStreetName: this.pendingAltAddress()?.streetName ?? null,
      altSuiteApt: this.pendingAltAddress()?.suiteApt ?? null,
      altUspsId: this.pendingAltAddress()?.uspsId ?? null,
      altIntlAddress1: this.pendingAltAddress()?.intlAddress1 ?? null,
      altIntlAddress2: this.pendingAltAddress()?.intlAddress2 ?? null,
      altIntlAddress3: this.pendingAltAddress()?.intlAddress3 ?? null,
      altIntlAddress4: this.pendingAltAddress()?.intlAddress4 ?? null,
      altCountryName: this.pendingAltAddress()?.countryName ?? null,
      altIntlPostalCode: this.pendingAltAddress()?.intlPostalCode ?? null,
      altIntlAddrFlag: this.pendingAltAddress()?.intlAddrFlag ?? null,
      altMobilePhoneNumber: this.pendingAltAddress()?.mobilePhoneNumber ?? null,
      otherContactNo: this.pendingAltAddress()?.otherContactNumber ?? null,
      altIntlPhoneNo: this.pendingAltAddress()?.altIntlPhoneNumber ?? null,
      preferredContactPhone: this.pendingAltAddress()?.preferredContactPhone ?? null,
      preferredContactAddress: this.pendingAltAddress()?.preferredContactAddress ?? null,
      bleedStartTimeL1: isLeftEnabled ? (this.bleedTimeData?.leftArm?.startTime1 || null) : null,
      bleedStartTimeL2: isLeftEnabled ? (this.bleedTimeData?.leftArm?.startTime2 || null) : null,
      bleedStartTimeR1: isRightEnabled ? (this.bleedTimeData?.rightArm?.startTime1 || null) : null,
      bleedStartTimeR2: isRightEnabled ? (this.bleedTimeData?.rightArm?.startTime2 || null) : null,
      bleedEndTimeL: isLeftEnabled ? (this.bleedTimeData?.leftArm?.endTime1 || null) : null,
      bleedEndTimeR: isRightEnabled ? (this.bleedTimeData?.rightArm?.endTime1 || null) : null,
      bleedStartPhlebL1: isLeftEnabled ? (this.bleedTimeData?.leftArm?.startPhleb1 || null) : null,
      bleedStartPhlebL2: isLeftEnabled ? (this.bleedTimeData?.leftArm?.startPhleb2 || null) : null,
      bleedStartPhlebR1: isRightEnabled ? (this.bleedTimeData?.rightArm?.startPhleb1 || null) : null,
      bleedStartPhlebR2: isRightEnabled ? (this.bleedTimeData?.rightArm?.startPhleb2 || null) : null,
      bleedEndPhlebL: isLeftEnabled ? (this.bleedTimeData?.leftArm?.endPhleb1 || null) : null,
      bleedEndPhlebR: isRightEnabled ? (this.bleedTimeData?.rightArm?.endPhleb1 || null) : null,
      bleedEndTimeL2: isLeftEnabled ? (this.bleedTimeData?.leftArm?.endTime2 || null) : null,
      bleedEndPhlebL2: isLeftEnabled ? (this.bleedTimeData?.leftArm?.endPhleb2 || null) : null,
      bleedEndTimeR2: isRightEnabled ? (this.bleedTimeData?.rightArm?.endTime2 || null) : null,
      bleedEndPhlebR2: isRightEnabled ? (this.bleedTimeData?.rightArm?.endPhleb2 || null) : null,
      interdictions: this.selectedHolds
        .filter(hold => !this.originalHoldCodes.has(hold.interCode))
        .map(hold => ({
          transactionId: donation.transactionId,
          interCode: hold.interCode,
          comments: '',
        })),
    };

    this.updateService.updateDonation(donation.transactionId, request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading.set(false);
          if (response.success) {
            this.snackbarService.showSuccess('Donation updated successfully.');
            this.resetPage();
          } else {
            const errorMsg =
              response.errorResponse?.error ||
              response.message ||
              'Failed to update donation.';
            this.snackbarService.showError(errorMsg);
          }
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.isLoading.set(false);
          const errorMsg =
            error?.error?.errorResponse?.error ||
            error?.error?.message ||
            'An error occurred while updating donation.';
          this.snackbarService.showError(errorMsg);
          this.cdr.markForCheck();
        },
      });
  }

  navigateToAddDonation(): void {
    const route = ROUTE_REGISTRY[RouteKey.DonorRegistration]?.path;
    if (route) {
      this.router.navigate([route]);
    }
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
      data: { existingAddress, targetTable: null },
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result: InternationalAddressModel | null | undefined) => {
        if (result) {
          if (target === 'donor') {
            this.donorIntlAddress = result;
            this.disableAddressFields();
          } else {
            this.employerIntlAddress = result;
            this.disableEmployerFields();
          }
        } else if (result === null) {
          if (target === 'donor') {
            this.enableAddressFields();
          } else {
            this.enableEmployerFields();
          }
        }
        (document.activeElement as HTMLElement)?.blur();
        this.cdr.markForCheck();
      });
  }

  openAlternateDemographics(): void {
    const donorId = this.currentDonation()?.donorId;
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
      disableClose: false,
      hasBackdrop: true,
    }).afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result: AlternateDemographicsModel | null | undefined | string) => {
        if (result === null) {
          this.pendingAltAddress.set(null);
        } else if (result && typeof result === 'object') {
          this.pendingAltAddress.set(result);
        }
        (document.activeElement as HTMLElement)?.blur();
      });
  }

  openManualHolds(): void {
    if (!this.interdictionCodes().length) {
      this.snackbarService.showError('Interdiction codes not loaded. Please try again.');
      return;
    }
    const dialogRef = this.dialog.open(ManualHoldsDialog, {
      width: '1015px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      position: { bottom: '0px', right: '0px' },
      panelClass: 'find-donor-panel',
      data: {
        interdictionCodes: this.interdictionCodes(),
        existingHolds: this.selectedHolds,
      },
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result: ManualHoldsDialogResult | undefined) => {
        if (result?.action === 'ok') {
          this.selectedHolds = result.selectedHolds ?? [];
          this.cdr.markForCheck();
        }
      });
  }

  onArmUsedChange(): void {
    this.openBleedTimeDetails();
  }

  onArmFieldClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const isArrow = target.closest('.mat-mdc-select-arrow-wrapper');
    if (isArrow || !this.editForm.get('armUsed')?.value) {
      return;
    }
    event.stopPropagation();
    event.preventDefault();
    this.armSelect.close();
    this.openBleedTimeDetails();
  }

  openBleedTimeDetails(): void {
    const donation = this.currentDonation();
    const currentArm = this.editForm.get('armUsed')?.value || '';

    const dialogRef = this.dialog.open(BleedTimeDetailsDialog, {
      width: '1077px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      position: { bottom: '0px', right: '0px' },
      panelClass: 'bleed-time-panel',
      data: {
        currentDriveDate: donation?.driveDate
          ? moment(donation.driveDate).format('DD-MMM-YYYY')
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

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result: BleedTimeDetailsDialogResult | undefined) => {
        if (result?.action === 'apply') {
          if (result.selectedArm) {
            this.editForm.get('armUsed')?.setValue(result.selectedArm);
          }
          if (result.data) {
            const d = result.data as unknown as Record<string, unknown>;
            this.bleedTimeData = {
              ...result.data,
              leftArm: {
                startTime1: (d['leftStartTime1'] as string) ?? '',
                startPhleb1: (d['leftStartPhleb1'] as string) ?? '',
                endTime1: (d['leftEndTime1'] as string) ?? '',
                endPhleb1: (d['leftEndPhleb1'] as string) ?? '',
                startTime2: (d['leftStartTime2'] as string) ?? '',
                startPhleb2: (d['leftStartPhleb2'] as string) ?? '',
                endTime2: (d['leftEndTime2'] as string) ?? '',
                endPhleb2: (d['leftEndPhleb2'] as string) ?? '',
              },
              rightArm: {
                startTime1: (d['rightStartTime1'] as string) ?? '',
                startPhleb1: (d['rightStartPhleb1'] as string) ?? '',
                endTime1: (d['rightEndTime1'] as string) ?? '',
                endPhleb1: (d['rightEndPhleb1'] as string) ?? '',
                startTime2: (d['rightStartTime2'] as string) ?? '',
                startPhleb2: (d['rightStartPhleb2'] as string) ?? '',
                endTime2: (d['rightEndTime2'] as string) ?? '',
                endPhleb2: (d['rightEndPhleb2'] as string) ?? '',
              },
              other: {
                startTime1: (d['otherTime'] as string) ?? '',
                startPhleb1: (d['otherPhleb'] as string) ?? '',
                endTime1: (d['otherEndTime'] as string) ?? '',
                endPhleb1: (d['otherEndPhleb'] as string) ?? '',
                startTime2: '',
                startPhleb2: '',
                endTime2: '',
                endPhleb2: '',
              },
            };
          }
          this.cdr.markForCheck();
        }
      });
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

  formatGender(value: string | null): string {
    if (!value) return '--';
    if (value === 'M') return 'Male';
    if (value === 'F') return 'Female';
    return value;
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

  private repatchDropdownValues(): void {
    const data = this.currentDonation();
    if (!data) return;

    this.editForm.patchValue({
      driveId: data.driveId ?? '',
      ethnicGroup: data.ethnicGroup ?? '',
      alternateType: data.alternateIdType ?? '',
      donation: data.donationType ?? '',
      procedure: data.procedureCode ?? '',
      lookupId: data.lookupId ?? '',
      physicalId: data.physicalId ?? '',
      reviewerId: data.firstReviewerId ?? '',
      historianId: data.screenerId ?? '',
      materialVerificationId: data.materialId ?? '',
      venipunctureCodes: data.venipunctureId ?? data.sVenipuncture ?? '',
      reactionCodes: data.reactionCode ?? data.sReactions ?? '',
      equipmentType: data.equipType ?? '',
      deferral: data.deferralReason ?? '',
      deferralType: data.deferralType ?? '',
      armUsed: data.armUsed ?? '',
      alternateSponsorId: data.creditSponsor ?? '',
    }, { emitEvent: false });
  }

  private preloadSearchDropdowns(data: UpdateDonationRetrieveResponse): void {
    if (data.creditSponsor) {
      this.donorService.getSponsors(data.creditSponsor)
        .pipe(takeUntil(this.destroy$))
        .subscribe((sponsors) => {
          this.sponsors.set(sponsors);
          this.cdr.markForCheck();
        });
    }
  }

  private disableAddressFields(): void {
    this.hasInternationalAddress.set(true);
    this.intlDisabledFields.forEach((f) => {
      const ctrl = this.editForm.get(f);
      ctrl?.setValue('', { emitEvent: false });
      ctrl?.disable({ emitEvent: false });
    });
    this.stateDisplay.set('--');
    this.selectedUspsId.set(null);

    const homeAddr = this.editForm.get('homeAddress');
    homeAddr?.clearValidators();
    homeAddr?.addValidators([Validators.maxLength(50)]);
    homeAddr?.updateValueAndValidity({ emitEvent: false });

    const cityCtrl = this.editForm.get('city');
    cityCtrl?.clearValidators();
    cityCtrl?.addValidators([Validators.maxLength(40)]);
    cityCtrl?.updateValueAndValidity({ emitEvent: false });

    const zipCtrl = this.editForm.get('zip');
    zipCtrl?.clearValidators();
    zipCtrl?.addValidators([Validators.maxLength(6)]);
    zipCtrl?.updateValueAndValidity({ emitEvent: false });
  }

  private enableAddressFields(): void {
    this.hasInternationalAddress.set(false);
    this.donorIntlAddress = null;
    this.intlDisabledFields.forEach((f) =>
      this.editForm.get(f)?.enable({ emitEvent: false })
    );

    const homeAddr = this.editForm.get('homeAddress');
    homeAddr?.clearValidators();
    homeAddr?.addValidators([Validators.required, Validators.maxLength(50)]);
    homeAddr?.updateValueAndValidity({ emitEvent: false });

    const cityCtrl = this.editForm.get('city');
    cityCtrl?.clearValidators();
    cityCtrl?.addValidators([Validators.required, Validators.maxLength(40), Validators.minLength(3)]);
    cityCtrl?.updateValueAndValidity({ emitEvent: false });

    const zipCtrl = this.editForm.get('zip');
    zipCtrl?.clearValidators();
    zipCtrl?.addValidators([Validators.required, Validators.maxLength(6)]);
    zipCtrl?.updateValueAndValidity({ emitEvent: false });
  }

  private disableEmployerFields(): void {
    this.hasEmployerInternationalAddress.set(true);
    this.employerFields.forEach((f) => {
      const ctrl = this.editForm.get(f);
      ctrl?.setValue('', { emitEvent: false });
      ctrl?.disable({ emitEvent: false });
    });
    this.employerState.set('--');
    this.selectedEUspsId.set(null);
  }

  private enableEmployerFields(): void {
    this.hasEmployerInternationalAddress.set(false);
    this.employerIntlAddress = null;
    this.employerFields.forEach((f) =>
      this.editForm.get(f)?.enable({ emitEvent: false })
    );
  }

  private resetPage(): void {
    this.mode.set('search');
    this.searchForm.reset();
    if (this.hasInternationalAddress()) {
      this.enableAddressFields();
    }
    if (this.hasEmployerInternationalAddress()) {
      this.enableEmployerFields();
    }
    this.editForm.reset();
    this.currentDonation.set(null);
    this.donorId.set('');
    this.aboDescription.set('--');
    this.driveDate.set('');
    this.transactionId.set('--');
    this.loadedScanId = null;
    this.enteredByName.set('--');
    this.employerState.set('--');
    this.lastNameDisplay.set('--');
    this.dobDisplay.set('--');
    this.sexDisplay.set('--');
    this.stateDisplay.set('--');
    this.selectedUspsId.set(null);
    this.selectedEUspsId.set(null);
    this.drives.set([]);
    this.employees.set([]);
    this.donorIntlAddress = null;
    this.employerIntlAddress = null;
    this.bleedTimeData = null;
    this.selectedHolds = [];
    this.originalHoldCodes.clear();
    this.isHoldsButtonDisabled = true;
    this.pendingAltAddress.set(null);
    this.filteredEmployers.set([]);
    this.filteredCities.set([]);
    this.filteredEmployerCities.set([]);
    this.citySearchControl.setValue('');
    this.employerCitySearchControl.setValue('');
    this.hasInternationalAddress.set(false);
    this.hasEmployerInternationalAddress.set(false);
    this.deferralReasons.set([]);
    this.hasUnsavedChanges = false;
    this.searchUnitIdField?.clear();
    this.donationUnitIdField?.clear();
    this.selectedUspsId.set(null);
    this.selectedEUspsId.set(null);
  }

  getSearchFieldError(fieldName: string): string {
    const control = this.searchForm.get(fieldName);
    if (!control?.touched) return '';
    if (control.hasError('required')) {
      if (fieldName === 'collectionDate') return 'Collection Date is required';
      return `${fieldName} is required`;
    }
    return '';
  }

  private loadDeferralReasonsForDonationType(donationType: string | null, driveDate: string | null): void {
    if (!donationType || !driveDate) return;
    const formattedDate = this.formatDateForApi(moment(driveDate));
    this.donorService.getDeferralReasons(donationType, formattedDate)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (reasons) => {
          this.deferralReasons.set(reasons);
          this.repatchDropdownValues();
          this.cdr.markForCheck();
        },
        error: () => { this.deferralReasons.set([]); },
      });
  }

  private loadProcedureCodesForDonationType(donationType: string | null): void {
    if (!donationType) return;
    this.donorService.getProcedureCodesByDonationType(donationType)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (codes) => {
          this.procedureCodes.set(codes);
          this.repatchDropdownValues();
          this.cdr.markForCheck();
        },
        error: () => {},
      });
  }

  private loadExistingInterdictions(transactionId: string): void {
    this.updateService.getInterdictions(transactionId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (interdictions) => {
          this.selectedHolds = interdictions.map((i) => ({
            interCode: i.interCode,
            interDesc: i.interDesc ?? '',
            interType: i.interType ?? null,
          }));
          this.originalHoldCodes = new Set(interdictions.map(i => i.interCode));
          this.cdr.markForCheck();
        },
        error: () => {
          this.selectedHolds = [];
        },
      });
  }

  formatPhoneInput(fieldName: string): void {
    const ctrl = this.editForm.get(fieldName);
    if (!ctrl) return;
    const stripped = (ctrl.value || '').replace(/\D/g, '').substring(0, 10);
    if (stripped !== ctrl.value) {
      ctrl.setValue(stripped, { emitEvent: false });
    }
  }

  validatePhone(fieldName: string, label: string): void {
    const value = this.editForm.get(fieldName)?.value?.trim();
    if (!value) return;
    const digitsOnly = value.replace(/\D/g, '');
    if (digitsOnly.length > 0 && (digitsOnly.length !== 7 && digitsOnly.length !== 10 || parseInt(digitsOnly, 10) <= 0)) {
      const msg = `${label} must be a valid 7 or 10-digit phone number`;
      const ctrl = this.editForm.get(fieldName);
      ctrl?.setValue('');
      ctrl?.setErrors({ serverError: msg });
      ctrl?.markAsTouched();
      this.cdr.markForCheck();
      return;
    }
    this.formatPhoneDisplay(fieldName);
  }

  private formatPhoneDisplay(fieldName: string): void {
    const ctrl = this.editForm.get(fieldName);
    if (!ctrl) return;
    const digits = (ctrl.value || '').replace(/\D/g, '');
    if (digits.length === 10) {
      ctrl.setValue(`(${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6)}`, { emitEvent: false });
    } else if (digits.length === 7) {
      ctrl.setValue(`${digits.substring(0, 3)}-${digits.substring(3)}`, { emitEvent: false });
    }
  }

  onZipBlur(): void {
    const zip = this.editForm.get('zip')?.value;
    if (zip && zip.length >= 5) {
      this.donorService.getCityState({ zip })
        .pipe(takeUntil(this.destroy$))
        .subscribe((results) => {
          if (results.length > 0) {
            const selectedCity = this.editForm.get('city')?.value;
            const match = results.find((r) => r.city === selectedCity);
            if (match) {
              this.stateDisplay.set(match.state || '--');
              this.selectedUspsId.set(match.uspsId ?? null);
            } else {
              const result = results[0];
              this.stateDisplay.set(result.state || '--');
              this.selectedUspsId.set(result.uspsId ?? null);
              this.editForm.patchValue({ city: result.city }, { emitEvent: false });
            }
            this.filteredCities.set(results);
            this.cdr.markForCheck();
          }
        });
    }
  }

  validateStaffField(fieldName: string): void {
    const value = this.editForm.get(fieldName)?.value;
    if (!value || value === '99' || value === '88') return;
    this.validateField(fieldName, this.donorService.validateStaff(value, this.getDriveDateForApi()));
  }

  private validateField(fieldName: string, validation$: Observable<FieldValidationResult>): void {
    validation$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {},
      error: (err) => {
        const errorMessage = err?.error?.errorResponse?.error || err?.error?.error || err?.error?.message || 'Validation failed';
        const ctrl = this.editForm.get(fieldName);
        ctrl?.setErrors({ serverError: errorMessage });
        ctrl?.markAsTouched();
        this.cdr.markForCheck();
      },
    });
  }

  private getDriveDateForApi(): string {
    const donation = this.currentDonation();
    const driveDate = donation?.driveDate ?? donation?.collDate;
    if (driveDate) {
      return moment(driveDate).format('MMDDYYYY');
    }
    return '';
  }

  validateCityField(): void {
    const value = this.editForm.get('city')?.value?.trim();
    if (!value) return;
    this.validateField('city', this.donorService.validateCity(value));
  }

  validateZipField(): void {
    const zip = this.editForm.get('zip')?.value?.trim();
    const city = this.editForm.get('city')?.value?.trim();
    if (!zip || !city) return;
    this.validateField('zip', this.donorService.validateZipCity(city, zip));
  }

  onEmployerZipBlur(): void {
    const zip = this.editForm.get('employerZip')?.value?.trim();
    if (!zip) {
      this.employerState.set('--');
      return;
    }
    if (zip.length < 5) return;
    const city = this.editForm.get('employerCity')?.value;
    this.donorService.getCityState({ zip })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (results) => {
          if (results.length > 0) {
            this.filteredEmployerCities.set(results);
            const match = results.find((r) => r.city === city);
            if (match) {
              this.employerState.set(match.state || '--');
              this.selectedEUspsId.set(match.uspsId ?? null);
            } else {
              this.editForm.patchValue({ employerCity: results[0].city }, { emitEvent: false });
              this.employerState.set(results[0].state || '--');
              this.selectedEUspsId.set(results[0].uspsId ?? null);
            }
          }
          this.validateEmployerZipField();
          this.cdr.markForCheck();
        },
      });
  }

  validateEmployerZipField(): void {
    const zip = this.editForm.get('employerZip')?.value?.trim();
    const city = this.editForm.get('employerCity')?.value?.trim();
    if (!zip || !city) return;
    this.donorService.validateZipCity(city, zip)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        error: (err) => {
          const errorMessage = err?.error?.errorResponse?.error || err?.error?.error || err?.error?.message || 'ZIP code does not match the specified city';
          const ctrl = this.editForm.get('employerZip');
          ctrl?.setErrors({ serverError: errorMessage });
          ctrl?.markAsTouched();
          this.cdr.markForCheck();
        },
      });
  }

  validateEthnicGroupField(): void {
    const value = this.editForm.get('ethnicGroup')?.value;
    if (!value) return;
    this.validateField('ethnicGroup', this.donorService.validateEthnicGroup(value));
  }

  validateEquipmentTypeField(): void {
    const value = this.editForm.get('equipmentType')?.value;
    if (!value) return;
    this.validateField('equipmentType', this.donorService.validateEquipmentType(value));
  }

  validateAlternateIdTypeField(): void {
    const value = this.editForm.get('alternateType')?.value;
    if (!value) return;
    this.validateField('alternateType', this.donorService.validateAlternateIdType(value));
  }

  validateDeferralReasonField(): void {
    const ctrl = this.editForm.get('deferral');
    const value = ctrl?.value?.trim();
    if (!value) return;
    if (value === '0' || value.endsWith(',')) {
      ctrl?.setValue('');
      ctrl?.setErrors({ serverError: "Deferral reason cannot be '0' or end with a comma" });
      ctrl?.markAsTouched();
      this.cdr.markForCheck();
    }
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

  onBackToSearch(): void {
    if (this.hasUnsavedChanges) {
      this.dialog.open(ConfirmActionDialogComponent, {
        width: '400px',
        disableClose: true,
        data: {
          title: 'Unsaved Changes',
          message: 'You have unsaved changes. Are you sure you want to leave?',
          confirmText: 'YES, LEAVE',
          cancelText: 'STAY',
        },
      }).afterClosed()
        .pipe(takeUntil(this.destroy$))
        .subscribe((confirmed) => {
          if (confirmed) {
            this.resetPage();
          }
        });
    } else {
      this.resetPage();
    }
  }

  canDeactivate(): boolean {
    return !this.hasUnsavedChanges;
  }

  private getInvalidFieldNames(): string[] {
    const fieldLabels: Record<string, string> = {
      weight: 'Weight',
      ethnicGroup: 'Ethnic Group',
      donation: 'Donation',
      procedure: 'Procedure',
      deferral: 'Deferral',
      deferralType: 'Deferral Type',
      armUsed: 'Arm Used',
    };
    const invalid: string[] = [];
    for (const [key, label] of Object.entries(fieldLabels)) {
      const control = this.editForm.get(key);
      if (control?.invalid) {
        invalid.push(label);
      }
    }
    return invalid;
  }

  getFieldError(fieldName: string, label: string): string {
    const control = this.editForm.get(fieldName);
    if (!control?.touched) return '';
    if (control.hasError('required')) return `${label} is required`;
    if (control.hasError('serverError')) return control.getError('serverError');
    if (control.hasError('min')) return `${label} must be at least 1`;
    if (control.hasError('max')) return `${label} cannot exceed 999`;
    if (control.hasError('maxlength')) return `${label} is too long`;
    if (control.hasError('minlength')) return `${label} must be at least ${control.getError('minlength').requiredLength} characters`;
    if (control.hasError('pattern')) return `Invalid ${label} format`;
    if (control.hasError('email')) return `Invalid email address`;
    return '';
  }
}
