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
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatRadioModule } from '@angular/material/radio';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subject, take, takeUntil, finalize, debounceTime, distinctUntilChanged } from 'rxjs';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import moment from 'moment';

import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { dateFormatValidator } from 'src/app/core/utils/date-adapter.util';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { InternationalAddressDialogComponent } from '@shared/components/international-address-dialog/international-address-dialog.component';
import { InternationalAddressModel } from '@shared/models/international-address.model';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner.component';
import { ConfirmActionDialogComponent } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';

import { AlternateDemographicsDialogComponent } from '@shared/components/alternate-demographics-dialog/alternate-demographics-dialog.component';
import { AlternateDemographicsDialogData, AlternateDemographicsModel } from '@shared/models/alternate-demographics.model';
import { AlternateDemographicsService } from '@shared/services/alternate-demographics.service';

import { ManualHoldsDialog } from '../registration/registration-general-functions/register-deferral/dialogs/manual-holds-dialog/manual-holds-dialog';
import {
  InterdictionCodeLookupDto,
  ManualHoldsDialogData,
  ManualHoldsDialogResult,
} from '../registration/registration-general-functions/register-deferral/models/register-deferral.model';

import { normalizeDeferralId } from '@shared/utils/deferral-id.util';
import { UpdateDeferralService } from './services/update-deferral.service';
import {
  ContentSection,
  DeferralDetailDto,
  UpdateDeferralRequestDto,
  DriveLookupDto,
  EmployeeLookupDto,
  DonationTypeLookupDto,
  ProcedureCodeLookupDto,
  EquipmentTypeLookupDto,
  DeferralReasonLookupDto,
  DeferralTypeLookupDto,
  EthnicGroupLookupDto,
  EmployerLookupDto,
  AlternateTypeLookupDto,
  CityLookupDto,
  DEFERRAL_TYPES,
  FieldValidationResult,
} from './models/update-deferral.model';

@Component({
  selector: 'app-update-deferral',
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
    MatRadioModule,
    MatDialogModule,
    MatMomentDateModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    LoadingSpinnerComponent,
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    {
      provide: DateAdapter,
      useClass: ChapterAwareDateAdapter,
      deps: [MAT_DATE_LOCALE],
    },
  ],
  templateUrl: './update-deferral.html',
  styleUrl: './update-deferral.scss',
})
export class UpdateDeferral implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLDivElement>;

  private readonly destroy$ = new Subject<void>();
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly deferralService = inject(UpdateDeferralService);
  private readonly headerService = inject(HeaderService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly altDemoService = inject(AlternateDemographicsService);

  pageHeaderConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: 'Update Deferral', link: null },
    ],
    actions: [],
  };

  private readonly defaultPageHeaderConfig: PageHeaderConfig = { ...this.pageHeaderConfig };
  private returnUrl: string | null = null;

  hasUnsavedChanges = false;

  // Component state
  isLoading = signal(false);
  showUpdateForm = signal(false);
  activeSection = signal<ContentSection>('deferral-donor-info');

  // Data signals
  selectedDeferralId = signal('');
  donorId = signal('');
  aboDescription = signal('--');
  driveDate = signal('');
  stateDisplay = signal('--');
  employerStateDisplay = signal('--');
  transactionId = signal('--');
  enteredBy = signal('--');
  heightDisplay = signal('--');
  minDeferredThruDate = signal<moment.Moment | null>(null);
  selectedEmployerId = signal<string | null>(null);
  private readonly selectedUspsId = signal<number | null>(null);
  private loadedScanId: string | null = null;

  // International address / alternate address / holds signals
  private readonly donorIntlAddress = signal<InternationalAddressModel | null>(null);
  private readonly employerIntlAddress = signal<InternationalAddressModel | null>(null);
  private readonly pendingAltAddress = signal<AlternateDemographicsModel | null>(null);
  private readonly interdictionCodes = signal<InterdictionCodeLookupDto[]>([]);
  private readonly pendingHolds = signal<InterdictionCodeLookupDto[]>([]);
  hasInternationalAddress = signal(false);

  private readonly intlDisabledFields = [
    'homeAddress', 'apartmentNo', 'city', 'zip',
    'homePhoneNumber', 'workPhoneNumber', 'workPhoneExtension', 'mobilePhoneNumber', 'email',
  ];

  // Sex display
  sexDisplay = computed(() => {
    const code = this.updateForm?.get('sex')?.value?.toUpperCase();
    if (code === 'M' || code === 'MALE') return 'MALE';
    if (code === 'F' || code === 'FEMALE') return 'FEMALE';
    return code || '--';
  });

  // Dropdown data signals
  drives = signal<DriveLookupDto[]>([]);
  employees = signal<EmployeeLookupDto[]>([]);
  donationTypes = signal<DonationTypeLookupDto[]>([]);
  procedureCodes = signal<ProcedureCodeLookupDto[]>([]);
  equipmentTypes = signal<EquipmentTypeLookupDto[]>([]);
  deferralReasons = signal<DeferralReasonLookupDto[]>([]);
  ethnicGroups = signal<EthnicGroupLookupDto[]>([]);
  employers = signal<EmployerLookupDto[]>([]);
  cities = signal<CityLookupDto[]>([]);
  alternateTypes = signal<AlternateTypeLookupDto[]>([]);
  employerCities = signal<CityLookupDto[]>([]);

  // Filtered dropdown signals
  filteredDrives = signal<DriveLookupDto[]>([]);
  filteredEmployees = signal<EmployeeLookupDto[]>([]);
  filteredDonationTypes = signal<DonationTypeLookupDto[]>([]);
  filteredProcedureCodes = signal<ProcedureCodeLookupDto[]>([]);
  filteredEquipmentTypes = signal<EquipmentTypeLookupDto[]>([]);
  filteredDeferralReasons = signal<DeferralReasonLookupDto[]>([]);
  filteredEthnicGroups = signal<EthnicGroupLookupDto[]>([]);
  filteredEmployers = signal<EmployerLookupDto[]>([]);
  filteredCities = signal<CityLookupDto[]>([]);
  filteredAlternateTypes = signal<AlternateTypeLookupDto[]>([]);
  filteredEmployerCities = signal<CityLookupDto[]>([]);

  // Search filter controls for dropdowns
  driveFilterCtrl = new FormControl('');
  employeeFilterCtrl = new FormControl('');
  donationTypeFilterCtrl = new FormControl('');
  procedureCodeFilterCtrl = new FormControl('');
  equipmentTypeFilterCtrl = new FormControl('');
  deferralReasonFilterCtrl = new FormControl('');
  ethnicGroupFilterCtrl = new FormControl('');
  employerFilterCtrl = new FormControl('');
  showCreateEmployer = signal(false);
  pendingEmployerName = signal('');
  citySearchCtrl = new FormControl('');
  physicalIdFilterCtrl = new FormControl('');
  historianIdFilterCtrl = new FormControl('');
  reviewerIdFilterCtrl = new FormControl('');
  alternateTypeFilterCtrl = new FormControl('');
  employerCitySearchCtrl = new FormControl('');

  // Deferral type constants
  readonly deferralTypes: DeferralTypeLookupDto[] = [
    { code: DEFERRAL_TYPES.INDEFINITE, description: 'Indefinite' },
    { code: DEFERRAL_TYPES.NOT_APPLICABLE, description: 'Not Applicable' },
    { code: DEFERRAL_TYPES.UNKNOWN, description: 'Unknown' },
  ];

  // Double-entry state for search deferral ID
  deferralIdDoubleEntry: 'idle' | 'pending' = 'idle';
  private pendingDeferralId: string | null = null;

  // Double-entry state for final deferral ID
  finalDeferralIdDoubleEntry: 'idle' | 'pending' = 'idle';
  private pendingFinalDeferralId: string | null = null;
  private lastConfirmedFinalDeferralId: string | null = null;
  private initialDeferralId = '';

  // Forms
  searchForm!: FormGroup;
  updateForm!: FormGroup;

  // Section observer
  private sectionObserver: IntersectionObserver | null = null;

  ngOnInit(): void {
    this.initSearchForm();
    this.initUpdateForm();
    this.setupFilterListeners();
    this.setupFieldChangeListeners();

    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.deferralService.clearCaches();
        this.resetState();
      });

    this.checkQueryParams();
  }

  ngAfterViewInit(): void {
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.sectionObserver?.disconnect();
  }

  private initSearchForm(): void {
    this.searchForm = this.fb.group({
      deferralId: ['', [Validators.required, Validators.pattern('^([0-9]{8}|[Cc][0-9]{8}[Cc])$')]],
    });
  }

  private checkQueryParams(): void {
    this.route.queryParams
      .pipe(take(1), takeUntil(this.destroy$))
      .subscribe((params) => {
        console.log('Update Deferral - Query params received:', params);

        const deferralId = params['deferralId'];
        if (deferralId) {
          const normalizedId = normalizeDeferralId(deferralId);
          if (normalizedId) {
            this.initialDeferralId = normalizedId;
            this.selectedDeferralId.set(normalizedId);
            this.searchForm.patchValue({ deferralId: normalizedId });
            this.onRetrieve();
          }
        }
      });

    // Check router state for navigation context
    const navState = history.state;
    if (navState?.returnPath) {
      this.setupBreadcrumbFromState(navState.returnPath, navState.filterState);
    }
  }

  private initUpdateForm(): void {
    this.updateForm = this.fb.group({
      // Deferral & Donor (readonly displays handled via signals, driveId is editable)
      driveId: [''],
      // Personal Information
      lastName: [{ value: '', disabled: true }],
      suffix: ['', [Validators.maxLength(5)]],
      firstName: ['', [Validators.maxLength(50)]],
      middleName: ['', [Validators.maxLength(25)]],
      dob: [{ value: null, disabled: true }],
      sex: [{ value: '', disabled: true }],
      weight: [null, [Validators.required, Validators.min(1), Validators.max(999999), Validators.pattern('^[0-9]*$')]],
      alternateId: ['', [Validators.maxLength(20)]],
      alternateType: [''],
      // Address Information
      homeAddress: ['', [Validators.required, Validators.maxLength(50)]],
      apartmentNo: ['', [Validators.maxLength(10)]],
      city: ['', [Validators.required]],
      zip: ['', [Validators.required, Validators.maxLength(6)]],
      // Contact Information
      homePhoneNumber: ['', [Validators.maxLength(14)]],
      workPhoneNumber: ['', [Validators.maxLength(14)]],
      workPhoneExtension: ['', [Validators.maxLength(6)]],
      mobilePhoneNumber: ['', [Validators.maxLength(14)]],
      preferredPhone: [''],
      email: ['', [Validators.maxLength(128), Validators.email]],
      // Employer/School Information
      employerName: [''],
      employerCity: [{ value: '', disabled: true }],
      employerZip: [{ value: '', disabled: true }, [Validators.maxLength(6)]],
      // Donation Information
      ethnicGroup: ['', [Validators.required]],
      lookupId: [''],
      donationType: ['', [Validators.required]],
      procedureCode: ['', [Validators.required]],
      physicalId: [''],
      deferral: ['', [Validators.required]],
      deferredThru: [null, [dateFormatValidator(), DateFieldValidationUtility.validDateValidator()]],
      deferralType: ['', [Validators.required]],
      historianId: [''],
      reviewerId: [''],
      equipmentType: [''],
      // Footer
      finalDeferralId: ['', [Validators.required, Validators.pattern('^([0-9]{8}|[Cc][0-9]{8}[Cc])$')]],
    });
  }

  onDeferredThruInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value, this.updateForm.get('deferredThru')
    );
  }

  validateDeferredThruDate(): void {
    const deferredThru = this.updateForm.get('deferredThru')?.value;
    if (!deferredThru) return;
    const minDate = this.minDeferredThruDate();
    if (!minDate) return;

    const deferredMoment = moment.isMoment(deferredThru) ? deferredThru : moment(deferredThru);
    const driveMoment = moment.isMoment(minDate) ? minDate : moment(minDate);

    if (deferredMoment.isBefore(driveMoment, 'day')) {
      const ctrl = this.updateForm.get('deferredThru');
      ctrl?.setValue(null);
      ctrl?.setErrors({ serverError: 'Deferred Thru date cannot be before Drive Date' });
      ctrl?.markAsTouched();
      this.cdr.markForCheck();
    }
  }

  onDeferredThruBlur(event: FocusEvent): void {
    const input = event.target as HTMLInputElement;
    const raw = input?.value?.trim();
    if (!raw) return;
    const ctrl = this.updateForm.get('deferredThru');

    const match = raw.match(/^(\d{1,2})([A-Za-z]{3})(\d{4})$/);
    if (match) {
      const formatted = `${match[1].padStart(2, '0')}-${match[2].toUpperCase()}-${match[3]}`;
      const parsed = moment(formatted, 'DD-MMM-YYYY', true);
      if (parsed.isValid()) {
        ctrl?.setValue(parsed);
        input.value = formatted;
        return;
      }
    }

    setTimeout(() => {
      if (!ctrl) return;
      const currentRaw = input?.value?.trim();
      if (currentRaw && !ctrl.value) {
        ctrl.setErrors({ ...ctrl.errors, invalidDate: true });
        ctrl.markAsTouched();
        ctrl.markAsDirty();
        this.cdr.markForCheck();
      }
    }, 0);
  }

  private setupFieldChangeListeners(): void {
    this.updateForm.get('deferralType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((deferralType) => {
        const deferredThruCtrl = this.updateForm.get('deferredThru');
        if (deferralType === DEFERRAL_TYPES.INDEFINITE && deferredThruCtrl?.value) {
          const typeCtrl = this.updateForm.get('deferralType');
          typeCtrl?.setValue('', { emitEvent: false });
          typeCtrl?.markAsTouched();
          setTimeout(() => {
            typeCtrl?.setErrors({ serverError: 'Cannot have both a through-date and indefinite deferral type' });
            this.cdr.markForCheck();
          });
          return;
        } else if (deferralType === DEFERRAL_TYPES.INDEFINITE) {
          deferredThruCtrl?.setValue(null);
          deferredThruCtrl?.disable();
        } else {
          deferredThruCtrl?.enable();
        }
      });

    this.updateForm.get('donationType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((donationType) => {
        if (donationType) {
          this.loadProcedureCodes(donationType);
          this.loadDeferralReasons(donationType);
        }
      });
  }

  private setupFilterListeners(): void {
    this.driveFilterCtrl.valueChanges
      .pipe(takeUntil(this.destroy$), debounceTime(300), distinctUntilChanged())
      .subscribe((search) => this.filterList(search, this.drives, this.filteredDrives,
        (d, s) => d.driveId.toLowerCase().includes(s) || (d.sponsorName?.toLowerCase().includes(s) ?? false)));

    this.employeeFilterCtrl.valueChanges
      .pipe(takeUntil(this.destroy$), debounceTime(300), distinctUntilChanged())
      .subscribe((search) => this.filterList(search, this.employees, this.filteredEmployees,
        (e, s) => e.staffNo.toLowerCase().includes(s) || e.staffName.toLowerCase().includes(s)));

    this.physicalIdFilterCtrl.valueChanges
      .pipe(takeUntil(this.destroy$), debounceTime(300), distinctUntilChanged())
      .subscribe((search) => this.filterList(search, this.employees, this.filteredEmployees,
        (e, s) => e.staffNo.toLowerCase().includes(s) || e.staffName.toLowerCase().includes(s)));

    this.historianIdFilterCtrl.valueChanges
      .pipe(takeUntil(this.destroy$), debounceTime(300), distinctUntilChanged())
      .subscribe((search) => this.filterList(search, this.employees, this.filteredEmployees,
        (e, s) => e.staffNo.toLowerCase().includes(s) || e.staffName.toLowerCase().includes(s)));

    this.reviewerIdFilterCtrl.valueChanges
      .pipe(takeUntil(this.destroy$), debounceTime(300), distinctUntilChanged())
      .subscribe((search) => this.filterList(search, this.employees, this.filteredEmployees,
        (e, s) => e.staffNo.toLowerCase().includes(s) || e.staffName.toLowerCase().includes(s)));

    this.donationTypeFilterCtrl.valueChanges
      .pipe(takeUntil(this.destroy$), debounceTime(300), distinctUntilChanged())
      .subscribe((search) => this.filterList(search, this.donationTypes, this.filteredDonationTypes,
        (dt, s) => dt.code.toLowerCase().includes(s) || dt.description.toLowerCase().includes(s)));

    this.procedureCodeFilterCtrl.valueChanges
      .pipe(takeUntil(this.destroy$), debounceTime(300), distinctUntilChanged())
      .subscribe((search) => this.filterList(search, this.procedureCodes, this.filteredProcedureCodes,
        (pc, s) => pc.code.toLowerCase().includes(s) || pc.description.toLowerCase().includes(s)));

    this.equipmentTypeFilterCtrl.valueChanges
      .pipe(takeUntil(this.destroy$), debounceTime(300), distinctUntilChanged())
      .subscribe((search) => this.filterList(search, this.equipmentTypes, this.filteredEquipmentTypes,
        (et, s) => et.code.toLowerCase().includes(s) || et.description.toLowerCase().includes(s)));

    this.deferralReasonFilterCtrl.valueChanges
      .pipe(takeUntil(this.destroy$), debounceTime(300), distinctUntilChanged())
      .subscribe((search) => this.filterList(search, this.deferralReasons, this.filteredDeferralReasons,
        (dr, s) => dr.code.toLowerCase().includes(s) || (dr.description?.toLowerCase().includes(s) ?? false)));

    this.ethnicGroupFilterCtrl.valueChanges
      .pipe(takeUntil(this.destroy$), debounceTime(300), distinctUntilChanged())
      .subscribe((search) => this.filterList(search, this.ethnicGroups, this.filteredEthnicGroups,
        (eg, s) => eg.code.toLowerCase().includes(s) || eg.description.toLowerCase().includes(s)));

    this.employerFilterCtrl.valueChanges
      .pipe(takeUntil(this.destroy$), debounceTime(300), distinctUntilChanged())
      .subscribe((search) => {
        if (search && search.length >= 1) {
          this.deferralService.getEmployers(search)
            .pipe(takeUntil(this.destroy$))
            .subscribe((data) => {
              this.filteredEmployers.set(data);
              if (data.length === 0 && search.length >= 1) {
                this.showCreateEmployer.set(true);
                this.pendingEmployerName.set(search);
              } else {
                this.showCreateEmployer.set(false);
              }
            });
        }
      });

    this.citySearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$), debounceTime(300), distinctUntilChanged())
      .subscribe((search) => {
        if (!search || search.length < 3) {
          this.filteredCities.set(this.cities());
          return;
        }
        this.deferralService.getCities(search)
          .pipe(takeUntil(this.destroy$))
          .subscribe((data) => {
            this.cities.set(data);
            this.filteredCities.set(data);
          });
      });

    this.alternateTypeFilterCtrl.valueChanges
      .pipe(takeUntil(this.destroy$), debounceTime(300), distinctUntilChanged())
      .subscribe((search) => this.filterList(search, this.alternateTypes, this.filteredAlternateTypes,
        (t, s) => t.code.toLowerCase().includes(s) || t.description.toLowerCase().includes(s)));

    this.employerCitySearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$), debounceTime(300), distinctUntilChanged())
      .subscribe((search) => {
        if (!search || search.length < 3) {
          this.filteredEmployerCities.set(this.employerCities());
          return;
        }
        this.deferralService.getEmployerCities(search)
          .pipe(takeUntil(this.destroy$))
          .subscribe((data) => {
            this.employerCities.set(data);
            this.filteredEmployerCities.set(data);
          });
      });
  }

  private filterList<T>(
    search: string | null,
    source: () => T[],
    target: { set: (v: T[]) => void },
    predicate: (item: T, searchLower: string) => boolean,
  ): void {
    if (!search) {
      target.set(source());
      return;
    }
    const searchLower = search.toLowerCase();
    target.set(source().filter((item) => predicate(item, searchLower)));
  }

  onDeferralIdEntered(): void {
    if (this.isLoading()) return;
    const ctrl = this.searchForm.get('deferralId');
    const deferralId = ctrl?.value?.trim();
    if (!deferralId) return;
    if (ctrl?.invalid) return;

    const normalizedId = normalizeDeferralId(deferralId);
    if (!normalizedId) {
      ctrl?.setErrors({ serverError: 'Invalid Deferral ID' });
      ctrl?.markAsTouched();
      return;
    }

    if (normalizedId === this.initialDeferralId && this.showUpdateForm()) return;

    if (this.deferralIdDoubleEntry === 'idle') {
      if (this.initialDeferralId && this.showUpdateForm()) {
        this.showUpdateForm.set(false);
        this.resetUpdateState();
      }
      this.pendingDeferralId = normalizedId;
      this.deferralIdDoubleEntry = 'pending';
      ctrl?.setValue('', { emitEvent: false });
      ctrl?.markAsUntouched();
      this.cdr.markForCheck();
      return;
    }

    if (this.deferralIdDoubleEntry === 'pending') {
      if (normalizedId === this.pendingDeferralId) {
        this.deferralIdDoubleEntry = 'idle';
        this.pendingDeferralId = null;
        this.initialDeferralId = normalizedId!;
        this.selectedDeferralId.set(normalizedId!);
        ctrl?.setValue(normalizedId!, { emitEvent: false });
      } else {
        this.deferralIdDoubleEntry = 'idle';
        this.pendingDeferralId = null;
        const msg = 'Deferral ID did not match. Please try again.';
        ctrl?.setValue('', { emitEvent: false });
        ctrl?.setErrors({ serverError: msg });
        ctrl?.markAsTouched();
      }
      this.cdr.markForCheck();
    }
  }

  onDeferralIdBlur(event: FocusEvent): void {
    const relatedTarget = event.relatedTarget as HTMLElement;
    if (relatedTarget?.classList.contains('retrieve-button')) return;
    this.onDeferralIdEntered();
  }

  onDeferralIdEnter(event: Event): void {
    event.preventDefault();
    this.searchForm.get('deferralId')?.markAsTouched();
    this.onDeferralIdEntered();
  }

  onDeferralIdTab(event: Event): void {
    const ctrl = this.searchForm.get('deferralId');
    const value = ctrl?.value?.trim();

    if (value) {
      event.preventDefault();
      this.onDeferralIdEntered();
      return;
    }

    if (this.deferralIdDoubleEntry === 'pending' || ctrl?.invalid || !value) {
      event.preventDefault();
      document.getElementById('deferralIdInput')?.focus();
    }
  }

  onRetrieve(): void {
    const ctrl = this.searchForm.get('deferralId');

    if (this.deferralIdDoubleEntry === 'pending' || !this.initialDeferralId) {
      ctrl?.setValue('', { emitEvent: false });
      ctrl?.setErrors({ required: true });
      ctrl?.markAsTouched();
      this.deferralIdDoubleEntry = 'idle';
      this.pendingDeferralId = null;
      this.cdr.markForCheck();
      return;
    }

    if (this.searchForm.invalid) {
      this.searchForm.markAllAsTouched();
      return;
    }

    const deferralId = ctrl?.value?.trim();
    if (!deferralId) return;

    if (deferralId === this.initialDeferralId && this.showUpdateForm()) return;

    this.retrieveDeferral(deferralId);
  }

  private retrieveDeferral(deferralId: string): void {
    this.isLoading.set(true);
    this.showUpdateForm.set(false);

    this.deferralService.getDeferralById(deferralId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          const normalizedId = data.deferralId || deferralId;
          this.selectedDeferralId.set(normalizedId);
          this.initialDeferralId = normalizedId;
          if (normalizedId !== deferralId) {
            this.searchForm.get('deferralId')?.setValue(normalizedId, { emitEvent: false });
          }
          this.populateForm(data);
          this.loadLookupData(data.driveDate);
          if (data.transactionId) {
            this.loadExistingInterdictions(data.transactionId);
          }
          this.showUpdateForm.set(true);

          // Enable back button while preserving breadcrumb configuration
          this.pageHeaderConfig = {
            ...this.pageHeaderConfig,
            showBackButton: true,
            onBackClick: () => this.onBackClick(),
          };

          this.hasUnsavedChanges = false;
          this.updateForm.valueChanges
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => { this.hasUnsavedChanges = true; });
          this.isLoading.set(false);
          this.cdr.markForCheck();
          setTimeout(() => this.setupSectionObserver(), 100);
        },
        error: (err) => {
          const msg = err?.error?.errorResponse?.error || err?.error?.error || err?.error?.message || 'Deferral not found';
          this.snackbarService.showError(msg);
          this.isLoading.set(false);
          this.cdr.markForCheck();
        },
      });
  }

  private populateForm(data: DeferralDetailDto): void {
    this.donorId.set(data.donorId || '');
    this.aboDescription.set(data.aboDescription || data.bloodType || '--');
    this.driveDate.set(data.driveDate ? moment(data.driveDate).format('DD-MMM-YYYY') : '--');
    this.transactionId.set(data.transactionId || '--');
    this.enteredBy.set(data.insertedBy || data.insertUser || '--');
    this.heightDisplay.set(data.height || '--');
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
    this.selectedEmployerId.set(data.employerId || null);

    if (data.employerId && data.employerName) {
      this.filteredEmployers.set([{
        employerId: data.employerId,
        employerName: data.employerName,
        city: data.empCity ?? undefined,
        state: data.empState ?? undefined,
        zip: data.empZip ?? undefined,
        uspsId: data.empUspsId ?? undefined,
        intlAddrFlag: data.empIntlAddrFlag ?? undefined,
      }]);
    }

    if (data.empIntlAddrFlag === 'Y') {
      this.employerIntlAddress.set({
        streetName: data.empIntlCity ?? '',
        addr1: data.empIntlState ?? null,
        addr2: null,
        addr3: null,
        country: data.empIntlCountryName ?? '',
        postalCode: data.empIntlPostalCode ?? null,
        intlAddrFlag: 'Y',
      });
      this.employerStateDisplay.set('--');
      this.updateForm.get('employerName')?.disable({ emitEvent: false });
    } else {
      this.employerStateDisplay.set(data.empState || '--');
      if (data.empCity) {
        this.filteredEmployerCities.set([{
          uspsId: data.empUspsId ?? 0,
          city: data.empCity,
          state: data.empState || '',
          zip: data.empZip || '',
        }]);
      }
    }

    if (data.driveDate) {
      this.minDeferredThruDate.set(moment(data.driveDate));
    }

    const preferredPhone = this.mapPreferredContactToForm(data.preferredContactFlag);

    this.updateForm.patchValue({
      driveId: data.driveId,
      lastName: data.lastName,
      suffix: data.lastNameSuffix,
      firstName: data.firstName,
      middleName: data.middleName,
      dob: data.dateOfBirth ? moment(data.dateOfBirth) : null,
      sex: data.gender,
      weight: data.donorWeight,
      alternateId: data.alternateId,
      alternateType: data.alternateIdType,
      homeAddress: data.streetName,
      apartmentNo: data.suiteApt,
      city: data.city,
      zip: data.zip,
      homePhoneNumber: this.formatPhone(data.hAreaCode, data.hPhoneNo),
      workPhoneNumber: this.formatPhone(data.dAreaCode, data.dPhoneNo),
      workPhoneExtension: data.extension || '',
      mobilePhoneNumber: this.formatPhone(data.mAreaCode, data.mPhoneNo),
      preferredPhone,
      email: data.email,
      employerName: data.employerId,
      employerCity: data.empCity,
      employerZip: data.empZip,
      ethnicGroup: data.ethnicGroup,
      lookupId: data.lookupId,
      donationType: data.donationType,
      procedureCode: data.procedureCode,
      physicalId: data.physicalId,
      deferral: data.deferralReason,
      deferredThru: data.deferredThruDate ? moment(data.deferredThruDate) : null,
      deferralType: data.deferralType,
      historianId: data.screenerId,
      reviewerId: data.firstReviewerId,
      equipmentType: data.equipType,
      finalDeferralId: '',
    }, { emitEvent: false });

    if (data.deferralType === DEFERRAL_TYPES.INDEFINITE) {
      this.updateForm.get('deferredThru')?.disable({ emitEvent: false });
    }

    if (data.intlAddrFlag === 'Y') {
      this.donorIntlAddress.set({
        streetName: data.intlAddress1 ?? '',
        addr1: data.intlAddress2 ?? '',
        addr2: data.intlAddress3 ?? '',
        addr3: data.intlAddress4 ?? '',
        country: data.countryName ?? '',
        postalCode: data.intlPostalCode ?? '',
        homePhoneNo: data.intlHomePhoneNo ?? '',
        workPhoneNo: data.intlWorkPhoneNo ?? '',
        workPhoneExt: data.intlWorkPhoneExt ?? '',
        mobilePhoneNo: data.intlMobilePhoneNo ?? '',
        faxNo: data.intlFaxNo ?? '',
        email: data.email ?? '',
        intlAddrFlag: 'Y',
      });
      this.disableAddressFields();
    }

    if (data.altStreetName || data.altIntlAddress1) {
      this.pendingAltAddress.set({
        addressType: data.altIntlAddrFlag === 'Y' ? 'I' : 'L',
        streetName: data.altStreetName ?? null,
        suiteApt: data.altSuiteApt ?? null,
        city: data.altCity ?? null,
        state: data.altState ?? null,
        zip: data.altZip ?? null,
        uspsId: data.altUspsId ?? null,
        intlAddress1: data.altIntlAddress1 ?? null,
        intlAddress2: data.altIntlAddress2 ?? null,
        intlAddress3: data.altIntlAddress3 ?? null,
        intlAddress4: data.altIntlAddress4 ?? null,
        countryName: data.altCountryName ?? null,
        intlCity: null,
        intlPostalCode: data.altIntlPostalCode ?? null,
        intlAddrFlag: data.altIntlAddrFlag ?? null,
        mobilePhoneNumber: data.mAreaCode && data.mPhoneNo
          ? `${data.mAreaCode}${data.mPhoneNo}` : null,
        otherContactNumber: data.otherContactNo ?? null,
        altIntlPhoneNumber: data.altIntlPhoneNo ?? null,
        preferredContactPhone: data.preferredContactFlag === 'M' ? 'M'
          : data.preferredContactFlag === 'W' ? 'W'
          : data.preferredContactFlag === 'H' ? 'H' : null,
        preferredContactAddress: data.preferredContactAddrFlag ?? null,
      });
    }
  }

  private loadLookupData(driveDate: string | null): void {
    const driveDateStr = driveDate || '';

    this.deferralService.getDrives(driveDateStr)
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        this.drives.set(data);
        this.filteredDrives.set(data);
        const currentDriveId = this.updateForm.get('driveId')?.value;
        if (currentDriveId) {
          this.updateForm.patchValue({ driveId: currentDriveId }, { emitEvent: false });
          this.cdr.markForCheck();
        }
      });

    this.deferralService.getEmployees(driveDateStr)
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => { this.employees.set(data); this.filteredEmployees.set(data); });

    this.deferralService.getDonationTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        const withUnknown = this.ensureUnknownOption(data, () => ({ code: '99', description: 'Unknown' }));
        this.donationTypes.set(withUnknown);
        this.filteredDonationTypes.set(withUnknown);
      });

    this.deferralService.getEquipmentTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => { this.equipmentTypes.set(data); this.filteredEquipmentTypes.set(data); });

    this.deferralService.getEthnicGroups()
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => { this.ethnicGroups.set(data); this.filteredEthnicGroups.set(data); });

    this.deferralService.getEthnicRequired()
      .pipe(takeUntil(this.destroy$))
      .subscribe((required) => {
        const ctrl = this.updateForm.get('ethnicGroup');
        if (required) {
          ctrl?.addValidators(Validators.required);
        } else {
          ctrl?.removeValidators(Validators.required);
        }
        ctrl?.updateValueAndValidity({ emitEvent: false });
      });

    this.deferralService.getManualHolds()
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => this.interdictionCodes.set(data));

    this.deferralService.getAlternateIdTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => { this.alternateTypes.set(data); this.filteredAlternateTypes.set(data); });

    const donationType = this.updateForm.get('donationType')?.value;
    if (donationType) {
      this.loadProcedureCodes(donationType);
      this.loadDeferralReasons(donationType);
    }
  }

  private ensureUnknownOption<T extends { code: string }>(data: T[], factory: () => T): T[] {
    if (!data.some(item => item.code === '99')) {
      return [...data, factory()];
    }
    return data;
  }

  private loadProcedureCodes(donationType: string): void {
    this.deferralService.getProcedureCodes(donationType)
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        const withUnknown = this.ensureUnknownOption(data, () => ({ code: '99', description: 'Unknown' }));
        this.procedureCodes.set(withUnknown);
        this.filteredProcedureCodes.set(withUnknown);
      });
  }

  private loadDeferralReasons(donationType: string): void {
    this.deferralService.getDeferralReasons(donationType)
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        const withUnknown = this.ensureUnknownOption(data, () => ({ code: '99' }));
        this.deferralReasons.set(withUnknown);
        this.filteredDeferralReasons.set(withUnknown);
      });
  }

  private loadExistingInterdictions(transactionId: string): void {
    this.deferralService.getInterdictions(transactionId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        if (data.length > 0) {
          this.pendingHolds.set(data.map((d) => ({
            interCode: d.interCode,
            interDesc: d.description ?? null,
            interType: d.interType ?? null,
          })));
        }
      });
  }

  onDriveSelected(driveId: string): void {
    const drive = this.drives().find((d) => d.driveId === driveId);
    if (drive?.driveDate) {
      this.driveDate.set(moment(drive.driveDate, 'MMDDYYYY').format('DD-MMM-YYYY'));
      this.minDeferredThruDate.set(moment(drive.driveDate, 'MMDDYYYY'));
    }
  }

  onDonationTypeChange(): void {
    this.updateForm.patchValue({ deferral: '' }, { emitEvent: false });
  }

  onCitySelected(city: CityLookupDto): void {
    this.stateDisplay.set(city.state || '--');
    this.selectedUspsId.set(city.uspsId ?? null);
    this.updateForm.patchValue({ zip: city.zip }, { emitEvent: false });
  }

  onEmployerSelected(employerId: string): void {
    if (!employerId) {
      this.selectedEmployerId.set(null);
      this.updateForm.patchValue({ employerCity: '', employerZip: '' }, { emitEvent: false });
      this.employerStateDisplay.set('--');
      this.employerIntlAddress.set(null);
      this.cdr.markForCheck();
      return;
    }
    const employer = this.filteredEmployers().find((e) => e.employerId === employerId);
    if (!employer) return;

    this.selectedEmployerId.set(employer.employerId || null);

    if ((employer.intlAddrFlag ?? 'N') === 'Y') {
      this.employerIntlAddress.set({
        streetName: employer.city || '',
        addr1: employer.state || null,
        addr2: null,
        addr3: null,
        country: employer.country || '',
        postalCode: employer.zip || null,
        intlAddrFlag: 'Y',
      });
      this.updateForm.patchValue({ employerCity: '', employerZip: '' }, { emitEvent: false });
      this.updateForm.get('employerName')?.disable({ emitEvent: false });
      this.employerStateDisplay.set('--');
    } else {
      this.employerIntlAddress.set(null);
      this.updateForm.get('employerName')?.enable({ emitEvent: false });
      if (employer.city) {
        this.filteredEmployerCities.set([{
          uspsId: employer.uspsId ?? 0,
          city: employer.city,
          state: employer.state || '',
          zip: employer.zip || '',
        }]);
      }
      this.updateForm.patchValue({
        employerCity: employer.city || '',
        employerZip: employer.zip || '',
      }, { emitEvent: false });
      this.employerStateDisplay.set(employer.state || '--');
    }
    this.cdr.markForCheck();
  }

  openAddEmployerDialog(): void {
    import('./components/add-employer-wrapper-dialog/add-employer-wrapper-dialog').then((m) => {
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
            this.deferralService.getEmployers(result.employerName)
              .pipe(takeUntil(this.destroy$))
              .subscribe((employers) => {
                const employer = employers.find(e => e.employerId === result.employerId);
                if (employer) {
                  this.filteredEmployers.set([employer]);
                  this.updateForm.patchValue({ employerName: employer.employerId });
                  this.onEmployerSelected(employer.employerId!);
                } else {
                  this.filteredEmployers.set([{ employerId: result.employerId, employerName: result.employerName }]);
                  this.updateForm.patchValue({ employerName: result.employerId });
                  this.selectedEmployerId.set(result.employerId);
                }
                this.snackbarService.showSuccess('New employer created');
                this.cdr.markForCheck();
              });
          }
        });
    });
  }

  createNewEmployer(): void {
    const name = this.pendingEmployerName();
    if (!name) return;

    const city = this.updateForm.get('employerCity')?.value || '';
    const zip = this.updateForm.get('employerZip')?.value || '';
    const state = this.employerStateDisplay() === '--' ? '' : this.employerStateDisplay();

    this.deferralService.createEmployer({ employerName: name, city, state, zip })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result: any) => {
          this.showCreateEmployer.set(false);
          this.deferralService.getEmployers(name)
            .pipe(takeUntil(this.destroy$))
            .subscribe((employers) => {
              const employer = employers.find(e => e.employerId === result.employerId);
              if (employer) {
                this.filteredEmployers.set([employer]);
                this.updateForm.patchValue({ employerName: employer.employerId });
                this.onEmployerSelected(employer.employerId!);
              } else {
                this.selectedEmployerId.set(result.employerId);
                this.filteredEmployers.set([{
                  employerId: result.employerId,
                  employerName: name,
                  city: city || undefined,
                  state: state || undefined,
                  zip: zip || undefined,
                }]);
                this.updateForm.patchValue({ employerName: result.employerId });
                this.updateForm.patchValue({ employerCity: city, employerZip: zip }, { emitEvent: false });
                this.employerStateDisplay.set(state || '--');
              }
              this.snackbarService.showSuccess('New employer created');
              this.cdr.markForCheck();
            });
        },
        error: (err) => {
          const msg = err?.error?.errorResponse?.error || err?.error?.error || 'Failed to create employer';
          this.snackbarService.showError(msg);
        },
      });
  }

  onEmployerCitySelected(city: CityLookupDto): void {
    this.employerStateDisplay.set(city.state || '--');
    this.updateForm.patchValue({ employerZip: city.zip }, { emitEvent: false });
  }

  onEmployerZipBlur(): void {
    const zip = this.updateForm.get('employerZip')?.value;
    if (zip && zip.length >= 5) {
      this.deferralService.getEmployerZipLookup(zip)
        .pipe(takeUntil(this.destroy$))
        .subscribe((results) => {
          if (results.length > 0) {
            const result = results[0];
            this.employerStateDisplay.set(result.state || '--');
            this.filteredEmployerCities.set(results);
            this.updateForm.patchValue({ employerCity: result.city }, { emitEvent: false });
          }
        });
    }
  }

  onZipBlur(): void {
    const zip = this.updateForm.get('zip')?.value;
    if (zip && zip.length >= 5) {
      this.deferralService.getZipLookup(zip)
        .pipe(takeUntil(this.destroy$))
        .subscribe((results) => {
          if (results.length > 0) {
            const result = results[0];
            this.stateDisplay.set(result.state || '--');
            this.selectedUspsId.set(result.uspsId ?? null);
            this.updateForm.patchValue({ city: result.city }, { emitEvent: false });
          }
        });
    }
  }

  // --- Server-side field validations ---

  private validateField(fieldName: string, validation$: Observable<FieldValidationResult>): void {
    validation$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {},
      error: (err) => {
        const errorMessage = err?.error?.errorResponse?.error || err?.error?.error || err?.error?.message || 'Validation failed';
        const ctrl = this.updateForm.get(fieldName);
        ctrl?.setErrors({ serverError: errorMessage });
        ctrl?.markAsTouched();
        this.cdr.markForCheck();
      },
    });
  }

  private getDriveDateForApi(): string {
    const selectedDriveId = this.updateForm.get('driveId')?.value;
    if (selectedDriveId) {
      const drive = this.drives().find((d) => d.driveId === selectedDriveId);
      if (drive?.driveDate) {
        return moment(drive.driveDate, 'MMDDYYYY').format('YYYY-MM-DD');
      }
    }
    const dd = this.driveDate();
    if (dd && dd !== '--') {
      return moment(dd, 'DD-MMM-YYYY').format('YYYY-MM-DD');
    }
    return '';
  }

  validateDonationTypeField(): void {
    const value = this.updateForm.get('donationType')?.value;
    if (!value) return;
    this.validateField('donationType', this.deferralService.validateDonationType(value));
  }

  validateProcedureCodeField(): void {
    const value = this.updateForm.get('procedureCode')?.value;
    const donationType = this.updateForm.get('donationType')?.value;
    if (!value || !donationType) return;
    this.validateField('procedureCode', this.deferralService.validateProcedureCode(donationType, value));
  }

  validateDeferralReasonField(): void {
    const ctrl = this.updateForm.get('deferral');
    const value = ctrl?.value?.trim();
    if (!value) return;

    if (value === '0' || value.endsWith(',')) {
      const errorMessage = "Deferral reason cannot be '0' or end with a comma";
      ctrl?.setValue('');
      ctrl?.setErrors({ serverError: errorMessage });
      ctrl?.markAsTouched();
      this.cdr.markForCheck();
      return;
    }

    const donationType = this.updateForm.get('donationType')?.value;
    this.validateField('deferral', this.deferralService.validateDeferralReason(value, donationType));
  }

  validateEquipmentTypeField(): void {
    const value = this.updateForm.get('equipmentType')?.value;
    if (!value) return;
    this.validateField('equipmentType', this.deferralService.validateEquipmentType(value));
  }

  validateAlternateIdTypeField(): void {
    const value = this.updateForm.get('alternateType')?.value;
    if (!value) return;
    this.validateField('alternateType', this.deferralService.validateAlternateIdTypeField(value));
  }

  validateEthnicGroupField(): void {
    const value = this.updateForm.get('ethnicGroup')?.value;
    if (!value) return;
    this.validateField('ethnicGroup', this.deferralService.validateEthnicGroupField(value));
  }

  validateStaffField(fieldName: string): void {
    const value = this.updateForm.get(fieldName)?.value;
    if (!value) return;
    this.validateField(fieldName, this.deferralService.validateStaff(value, this.getDriveDateForApi()));
  }

  validateCityField(): void {
    const value = this.updateForm.get('city')?.value?.trim();
    if (!value) return;
    this.validateField('city', this.deferralService.validateCityField(value));
  }

  validateZipField(): void {
    const zip = this.updateForm.get('zip')?.value?.trim();
    const city = this.updateForm.get('city')?.value?.trim();
    if (!zip || !city) return;
    this.validateField('zip', this.deferralService.validateZipCityField(city, zip));
  }

  formatPhoneInput(fieldName: string): void {
    const ctrl = this.updateForm.get(fieldName);
    if (!ctrl) return;
    const raw = ctrl.value?.replace(/\D/g, '') || '';
    if (raw.length <= 3) {
      ctrl.setValue(`(${raw}`, { emitEvent: false });
    } else if (raw.length <= 6) {
      ctrl.setValue(`(${raw.substring(0, 3)}) ${raw.substring(3)}`, { emitEvent: false });
    } else {
      ctrl.setValue(`(${raw.substring(0, 3)}) ${raw.substring(3, 6)}-${raw.substring(6, 10)}`, { emitEvent: false });
    }
  }

  onFinalDeferralIdEntered(): void {
    if (this.isLoading()) return;
    const ctrl = this.updateForm.get('finalDeferralId');
    if (ctrl?.disabled) return;
    const finalDeferralId = ctrl?.value?.trim();
    if (!finalDeferralId || ctrl?.invalid) return;

    const normalizedFinal = normalizeDeferralId(finalDeferralId);
    if (!normalizedFinal) {
      ctrl?.setErrors({ serverError: 'Invalid Deferral ID' });
      ctrl?.markAsTouched();
      return;
    }

    if (normalizedFinal === this.lastConfirmedFinalDeferralId) {
      ctrl?.disable({ emitEvent: false });
      this.onSubmit();
      return;
    }

    if (this.finalDeferralIdDoubleEntry === 'idle') {
      this.pendingFinalDeferralId = normalizedFinal;
      this.finalDeferralIdDoubleEntry = 'pending';
      ctrl?.setValue('', { emitEvent: false });
      ctrl?.markAsUntouched();
      this.cdr.markForCheck();
      return;
    }

    if (this.finalDeferralIdDoubleEntry === 'pending') {
      if (normalizedFinal === this.pendingFinalDeferralId) {
        this.finalDeferralIdDoubleEntry = 'idle';
        this.pendingFinalDeferralId = null;

        if (normalizedFinal !== this.initialDeferralId) {
          this.snackbarService.showError('Final Deferral ID does not match the initial Deferral ID');
          this.clearFormForNext();
          return;
        }

        ctrl?.setValue(normalizedFinal!, { emitEvent: false });
        this.lastConfirmedFinalDeferralId = normalizedFinal;
        ctrl?.disable({ emitEvent: false });
        this.onSubmit();
      } else {
        this.finalDeferralIdDoubleEntry = 'idle';
        this.pendingFinalDeferralId = null;
        const msg = 'Final Deferral ID did not match. Please try again.';
        ctrl?.setValue('', { emitEvent: false });
        ctrl?.setErrors({ serverError: msg });
        ctrl?.markAsTouched();
      }
      this.cdr.markForCheck();
    }
  }

  private onSubmit(): void {
    this.enableEditableFields();
    this.updateForm.markAllAsTouched();

    if (this.updateForm.invalid) {
      this.snackbarService.showError('Please fill all required fields');
      return;
    }

    this.isLoading.set(true);
    const request = this.buildUpdateRequest();

    this.deferralService.updateDeferral(this.selectedDeferralId(), request)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => { this.isLoading.set(false); this.cdr.markForCheck(); }),
      )
      .subscribe({
        next: () => {
          this.hasUnsavedChanges = false;
          this.snackbarService.showSuccess('Deferral updated successfully');
          this.clearFormForNext();
        },
        error: (err) => {
          const body = err?.error;
          const code = body?.errorResponse?.errorCode;
          const msg = body?.errorResponse?.error || body?.error || body?.message || 'Failed to update deferral';
          this.snackbarService.showError(code ? `Error ${code}: ${msg}` : msg);
        },
      });
  }

  private buildUpdateRequest(): UpdateDeferralRequestDto {
    const f = this.updateForm.getRawValue();
    const homePhone = this.parsePhone(f.homePhoneNumber);
    const workPhone = this.parsePhone(f.workPhoneNumber);
    const mobilePhone = this.parsePhone(f.mobilePhoneNumber);

    return {
      driveId: f.driveId || null,
      firstName: f.firstName?.toUpperCase() || null,
      lastNameSuffix: f.suffix?.toUpperCase() || null,
      middleName: f.middleName?.toUpperCase() || null,
      donorWeight: f.weight || null,
      alternateId: f.alternateId || null,
      alternateIdType: f.alternateType || null,
      scanId: this.loadedScanId,
      employerId: this.selectedEmployerId() || null,
      streetName: f.homeAddress || null,
      suiteApt: f.apartmentNo || null,
      city: f.city || null,
      zip: f.zip || null,
      uspsId: this.selectedUspsId() ?? null,
      hAreaCode: homePhone.areaCode || null,
      hPhoneNo: homePhone.phoneNo || null,
      dAreaCode: workPhone.areaCode || null,
      dPhoneNo: workPhone.phoneNo || null,
      extension: f.workPhoneExtension || null,
      mAreaCode: mobilePhone.areaCode || null,
      mPhoneNo: mobilePhone.phoneNo || null,
      email: f.email || null,
      preferredContactFlag: this.mapFormToPreferredContact(f.preferredPhone),
      ethnicGroup: f.ethnicGroup || null,
      lookupId: f.lookupId || null,
      donationType: f.donationType ?? null,
      procedureCode: f.procedureCode ?? null,
      physicalId: f.physicalId ?? null,
      deferralReason: f.deferral ?? null,
      deferredThruDate: this.formatDateForApi(f.deferredThru),
      deferralType: f.deferralType ?? null,
      screenerId: f.historianId ?? null,
      firstReviewerId: f.reviewerId ?? null,
      equipType: f.equipmentType ?? null,
      intlAddrFlag: this.hasInternationalAddress() ? 'Y' : 'N',
      intlAddress1: this.donorIntlAddress()?.streetName ?? null,
      intlAddress2: this.donorIntlAddress()?.addr1 ?? null,
      intlAddress3: this.donorIntlAddress()?.addr2 ?? null,
      intlAddress4: this.donorIntlAddress()?.addr3 ?? null,
      countryName: this.donorIntlAddress()?.country ?? null,
      intlPostalCode: this.donorIntlAddress()?.postalCode ?? null,
      intlHomePhoneNo: this.donorIntlAddress()?.homePhoneNo ?? null,
      intlWorkPhoneNo: this.donorIntlAddress()?.workPhoneNo ?? null,
      intlWorkPhoneExt: this.donorIntlAddress()?.workPhoneExt ?? null,
      intlMobilePhoneNo: this.donorIntlAddress()?.mobilePhoneNo ?? null,
      intlFaxNo: this.donorIntlAddress()?.faxNo ?? null,
      preferredContactAddrFlag: this.pendingAltAddress()?.preferredContactAddress ?? null,
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
      otherContactNo: this.pendingAltAddress()?.otherContactNumber ?? null,
      altIntlPhoneNo: this.pendingAltAddress()?.altIntlPhoneNumber ?? null,
      employerInternationalAddress: this.employerIntlAddress() ? {
        streetName: this.employerIntlAddress()?.streetName ?? null,
        addr1: this.employerIntlAddress()?.addr1 ?? null,
        addr2: this.employerIntlAddress()?.addr2 ?? null,
        addr3: this.employerIntlAddress()?.addr3 ?? null,
        addr4: this.employerIntlAddress()?.addr4 ?? null,
        countryName: this.employerIntlAddress()?.country ?? null,
        postalCode: this.employerIntlAddress()?.postalCode ?? null,
        homePhone: this.employerIntlAddress()?.homePhoneNo ?? null,
        workPhone: this.employerIntlAddress()?.workPhoneNo ?? null,
        workPhoneExt: this.employerIntlAddress()?.workPhoneExt ?? null,
        mobilePhone: this.employerIntlAddress()?.mobilePhoneNo ?? null,
        faxNo: this.employerIntlAddress()?.faxNo ?? null,
        email: this.employerIntlAddress()?.email ?? null,
        intlAddrFlag: 'Y',
        modifiedFlag: 'Y',
      } : undefined,
      interdictions: this.pendingHolds().map(hold => ({
        transactionId: this.transactionId() !== '--' ? this.transactionId() : '',
        interCode: hold.interCode,
        comments: '',
      })),
    };
  }

  private parsePhone(value: string | null): { areaCode: string; phoneNo: string } {
    if (!value) return { areaCode: '', phoneNo: '' };
    const digits = value.replace(/\D/g, '');
    if (digits.length >= 10) {
      return { areaCode: digits.substring(0, 3), phoneNo: digits.substring(3, 10) };
    }
    if (digits.length === 7) {
      return { areaCode: '', phoneNo: digits };
    }
    return { areaCode: '', phoneNo: digits };
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

  private mapPreferredContactToForm(flag: string | null): string {
    switch (flag) {
      case 'H': return 'home';
      case 'W': return 'work';
      case 'M': return 'mobile';
      default: return '';
    }
  }

  private mapFormToPreferredContact(formValue: string | null): string | null {
    switch (formValue) {
      case 'home': return 'H';
      case 'work': return 'W';
      case 'mobile': return 'M';
      default: return null;
    }
  }

  private formatDateForApi(date: moment.Moment | null): string | null {
    if (!date || !moment.isMoment(date)) return null;
    return date.format('YYYY-MM-DD');
  }

  private enableEditableFields(): void {
    const editableFields = [
      'driveId', 'suffix', 'firstName', 'middleName', 'weight',
      'alternateId', 'alternateType',
      'homeAddress', 'apartmentNo', 'city', 'zip',
      'homePhoneNumber', 'workPhoneNumber', 'workPhoneExtension', 'mobilePhoneNumber', 'preferredPhone', 'email',
      'employerName',
      'ethnicGroup', 'lookupId', 'donationType', 'procedureCode', 'physicalId',
      'deferral', 'deferredThru', 'deferralType', 'historianId', 'reviewerId', 'equipmentType',
      'finalDeferralId',
    ];
    editableFields.forEach((name) => {
      if (name === 'employerName' && this.employerIntlAddress()) return;
      this.updateForm.get(name)?.enable({ emitEvent: false });
    });
  }

  private resetUpdateState(): void {
    this.updateForm.reset();
    this.donorId.set('');
    this.aboDescription.set('--');
    this.driveDate.set('');
    this.transactionId.set('--');
    this.enteredBy.set('--');
    this.heightDisplay.set('--');
    this.stateDisplay.set('--');
    this.employerStateDisplay.set('--');
    this.selectedEmployerId.set(null);
    this.selectedUspsId.set(null);
    this.loadedScanId = null;
    this.donorIntlAddress.set(null);
    this.employerIntlAddress.set(null);
    this.pendingAltAddress.set(null);
    this.pendingHolds.set([]);
    this.hasInternationalAddress.set(false);
    this.enableAddressFields();
    this.finalDeferralIdDoubleEntry = 'idle';
    this.pendingFinalDeferralId = null;
    this.lastConfirmedFinalDeferralId = null;
  }

  /**
   * Setup breadcrumb navigation from router state
   * Reconstructs return URL with filter state to avoid double-encoding
   */
  private setupBreadcrumbFromState(returnPath: string, filterState?: Record<string, string>): void {
    try {
      console.log('Update Deferral - Setting up breadcrumb from state:', returnPath, filterState);

      // Construct query string from filter state
      let returnUrl = returnPath;
      if (filterState && Object.keys(filterState).length > 0) {
        const params = new URLSearchParams();
        Object.entries(filterState).forEach(([key, value]) => {
          if (value) params.append(key, value);
        });
        returnUrl = `${returnPath}?${params.toString()}`;
      }

      this.returnUrl = returnUrl;

      // Determine parent label based on path
      let parentLabel = 'Deferral Registration';
      if (returnPath.includes('deferrals-on-hold-query')) {
        parentLabel = 'Deferrals on Hold Query';
      }

      console.log('Update Deferral - Parent label:', parentLabel);
      console.log('Update Deferral - Return URL:', returnUrl);

      // Update breadcrumb config while preserving other properties
      this.pageHeaderConfig = {
        ...this.pageHeaderConfig,
        breadcrumbs: [
          { label: 'Home', link: '/home' },
          { label: parentLabel, link: returnUrl },
          { label: 'Update Deferral', link: null },
        ],
      };

      console.log('Update Deferral - Breadcrumb config updated:', this.pageHeaderConfig);
    } catch (error) {
      console.error('Error setting up breadcrumb from state:', error);
    }
  }

  private onBackClick(): void {
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
            // If we have a returnUrl, navigate to it; otherwise, clear form
            if (this.returnUrl) {
              this.router.navigateByUrl(this.returnUrl);
            } else {
              this.clearFormForNext();
            }
          }
        });
    } else {
      // If we have a returnUrl, navigate to it; otherwise, clear form
      if (this.returnUrl) {
        this.router.navigateByUrl(this.returnUrl);
      } else {
        this.clearFormForNext();
      }
    }
  }

  clearFormForNext(): void {
    this.showUpdateForm.set(false);
    this.pageHeaderConfig = this.defaultPageHeaderConfig;
    this.resetUpdateState();
    this.selectedDeferralId.set('');
    this.initialDeferralId = '';
    this.deferralIdDoubleEntry = 'idle';
    this.pendingDeferralId = null;
    this.searchForm.reset();
    this.hasUnsavedChanges = false;
    this.cdr.markForCheck();
    setTimeout(() => {
      document.getElementById('deferralIdInput')?.focus();
    }, 100);
  }

  canDeactivate(): boolean {
    return !this.hasUnsavedChanges;
  }

  private resetState(): void {
    this.clearFormForNext();
    this.drives.set([]);
    this.employees.set([]);
    this.donationTypes.set([]);
    this.procedureCodes.set([]);
    this.equipmentTypes.set([]);
    this.deferralReasons.set([]);
    this.ethnicGroups.set([]);
    this.employers.set([]);
    this.filteredEmployers.set([]);
    this.cities.set([]);
    this.filteredCities.set([]);
  }

  onInternationalAddress(): void {
    this.openInternationalAddress('donor');
  }

  onEmployerInternationalAddress(): void {
    this.openInternationalAddress('employer');
  }

  private openInternationalAddress(target: 'donor' | 'employer'): void {
    const existingAddress = target === 'donor'
      ? this.donorIntlAddress()
      : this.employerIntlAddress();

    const dialogRef = this.dialog.open(InternationalAddressDialogComponent, {
      width: '600px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      position: { right: '0', top: '64px' },
      panelClass: 'code-dialog-panel-right',
      hasBackdrop: true,
      backdropClass: 'code-dialog-backdrop',
      data: { existingAddress, targetTable: null },
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result: InternationalAddressModel | null | undefined) => {
        if (result) {
          if (target === 'donor') {
            this.donorIntlAddress.set(result);
            this.disableAddressFields();
          } else {
            this.employerIntlAddress.set(result);
            this.disableEmployerFields();
          }
        } else if (result === null) {
          if (target === 'donor') {
            this.donorIntlAddress.set(null);
            this.enableAddressFields();
          } else {
            this.enableEmployerFields();
          }
        }
        this.cdr.markForCheck();
      });
  }

  onAlternateAddress(): void {
    const donorId = this.donorId();
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
      data: dialogData,
      disableClose: false,
      panelClass: 'code-dialog-panel-right',
      position: { right: '0', top: '64px' },
      hasBackdrop: true,
      backdropClass: 'code-dialog-backdrop',
    }).afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result: AlternateDemographicsModel | null | undefined | string) => {
        if (result === null) {
          this.pendingAltAddress.set(null);
        } else if (result && typeof result === 'object') {
          this.pendingAltAddress.set(result);
        }
      });
  }

  private disableAddressFields(): void {
    this.hasInternationalAddress.set(true);
    this.intlDisabledFields.forEach((f) => {
      const ctrl = this.updateForm.get(f);
      ctrl?.setValue('', { emitEvent: false });
      ctrl?.disable({ emitEvent: false });
    });
    this.stateDisplay.set('--');

    const homeAddr = this.updateForm.get('homeAddress');
    homeAddr?.clearValidators();
    homeAddr?.addValidators([Validators.maxLength(50)]);
    homeAddr?.updateValueAndValidity({ emitEvent: false });

    const cityCtrl = this.updateForm.get('city');
    cityCtrl?.clearValidators();
    cityCtrl?.addValidators([Validators.maxLength(40)]);
    cityCtrl?.updateValueAndValidity({ emitEvent: false });

    const zipCtrl = this.updateForm.get('zip');
    zipCtrl?.clearValidators();
    zipCtrl?.addValidators([Validators.maxLength(6)]);
    zipCtrl?.updateValueAndValidity({ emitEvent: false });
  }

  private enableAddressFields(): void {
    this.hasInternationalAddress.set(false);
    this.intlDisabledFields.forEach((f) =>
      this.updateForm.get(f)?.enable({ emitEvent: false }),
    );

    const homeAddr = this.updateForm.get('homeAddress');
    homeAddr?.clearValidators();
    homeAddr?.addValidators([Validators.required, Validators.maxLength(50)]);
    homeAddr?.updateValueAndValidity({ emitEvent: false });

    const cityCtrl = this.updateForm.get('city');
    cityCtrl?.clearValidators();
    cityCtrl?.addValidators([Validators.required, Validators.maxLength(40)]);
    cityCtrl?.updateValueAndValidity({ emitEvent: false });

    const zipCtrl = this.updateForm.get('zip');
    zipCtrl?.clearValidators();
    zipCtrl?.addValidators([Validators.required, Validators.maxLength(6)]);
    zipCtrl?.updateValueAndValidity({ emitEvent: false });
  }

  private disableEmployerFields(): void {
    const ctrl = this.updateForm.get('employerName');
    ctrl?.setValue('', { emitEvent: false });
    ctrl?.disable({ emitEvent: false });
    this.updateForm.get('employerCity')?.setValue('', { emitEvent: false });
    this.updateForm.get('employerZip')?.setValue('', { emitEvent: false });
    this.employerStateDisplay.set('--');
  }

  private enableEmployerFields(): void {
    this.employerIntlAddress.set(null);
    this.updateForm.get('employerName')?.enable({ emitEvent: false });
  }

  onManualHolds(): void {
    const dialogData: ManualHoldsDialogData = {
      interdictionCodes: this.interdictionCodes(),
      existingHolds: this.pendingHolds().length > 0 ? this.pendingHolds() : undefined,
    };

    this.dialog.open(ManualHoldsDialog, {
      width: '1000px',
      data: dialogData,
      disableClose: false,
      autoFocus: false,
    }).afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result: ManualHoldsDialogResult | undefined) => {
        if (result?.action === 'ok' && result.selectedHolds) {
          this.pendingHolds.set(result.selectedHolds);
        }
      });
  }

  scrollToSection(sectionId: string): void {
    this.activeSection.set(sectionId as ContentSection);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  private setupSectionObserver(): void {
    this.sectionObserver?.disconnect();

    const sectionIds = [
      'deferral-donor-info', 'personal-info', 'address-info',
      'contact-info', 'employer-info', 'donation-info',
    ];

    this.sectionObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            this.activeSection.set(entry.target.id as ContentSection);
            this.cdr.markForCheck();
            break;
          }
        }
      },
      {
        root: this.scrollContainer?.nativeElement,
        rootMargin: '-10% 0px -80% 0px',
        threshold: 0,
      },
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) this.sectionObserver!.observe(el);
    });
  }

  onlyNumbers(event: KeyboardEvent): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if (
      [46, 8, 9, 27, 13].indexOf(charCode) !== -1 ||
      (charCode === 65 && event.ctrlKey === true) ||
      (charCode === 67 && event.ctrlKey === true) ||
      (charCode === 86 && event.ctrlKey === true) ||
      (charCode === 88 && event.ctrlKey === true) ||
      (charCode >= 35 && charCode <= 39)
    ) {
      return true;
    }
    if ((charCode < 48 || charCode > 57) && (charCode < 96 || charCode > 105)) {
      event.preventDefault();
      return false;
    }
    const input = event.target as HTMLInputElement;
    const currentValue = input.value?.toString() || '';
    if (currentValue.length >= 6) {
      event.preventDefault();
      return false;
    }
    return true;
  }

  onPasteNumbers(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedText = event.clipboardData?.getData('text') || '';
    const numericOnly = pastedText.replace(/[^0-9]/g, '').substring(0, 6);
    document.execCommand('insertText', false, numericOnly);
  }

  get enteredByText(): string {
    return this.enteredBy() || '--';
  }
}
