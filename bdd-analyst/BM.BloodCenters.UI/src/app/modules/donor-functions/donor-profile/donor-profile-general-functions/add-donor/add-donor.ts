import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  ChangeDetectorRef,
  ElementRef,
  effect,
} from '@angular/core';
import { AsyncPipe, CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatRadioModule } from '@angular/material/radio';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
} from '@angular/material/core';
import { Subject, Observable, combineLatest, takeUntil, debounceTime, distinctUntilChanged, startWith, map } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';
import moment, { Moment } from 'moment';

import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { HeaderService } from '@shared/services/header.service';
import { MenuService } from '@shared/services/menu.service';
import { LoginService } from '@shared/services/login.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { InternationalAddressDialogComponent } from '@shared/components/international-address-dialog/international-address-dialog.component';
import {
  InternationalAddressModel,
  InternationalAddressDialogData,
} from '@shared/models/international-address.model';
import { AlternateDemographicsDialogComponent } from '@shared/components/alternate-demographics-dialog/alternate-demographics-dialog.component';
import { AlternateDemographicsDialogData, AlternateDemographicsModel } from '@shared/models/alternate-demographics.model';
import { ConfirmActionDialogComponent, ConfirmActionDialogData } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';
import { FindDonorService } from '@shared/components/find-donor/find-donor.service';
import { FindDonorDialog } from '@shared/components/find-donor/find-donor';
import { FindDonorDialogResult, FindDonorResult } from '@shared/components/find-donor/find-donor.model';
import { DonorEmployerService } from '../../../registration/registration-maintenance/maintain-donor-employer/services/donor-employer.service';
import { AutocompleteOption } from '../../../registration/registration-maintenance/maintain-donor-employer/models/donor-employer.model';
import { AddEmployerPanelComponent } from './add-employer-panel/add-employer-panel.component';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { ROUTES } from '../../../../../core/constants/route.constants';
import { ROUTE_REGISTRY } from '../../../../../core/constants/route-registry';
import { RouteKey } from '../../../../../core/constants/route-keys';

import { AddDonorService } from './services/add-donor.service';
import {
  AddDonorNavigationState,
  CreateDonorRequest,
  ModifyDonorRequest,
  DonorData,
  LookupOption,
  PotentialDuplicateEntry,
} from './models/add-donor.model';
import { EmployerIntlAddressDialogComponent, EmployerIntlAddressResult } from './employer-intl-address-dialog/employer-intl-address-dialog.component';
import { PotentialDuplicatesDialogComponent, PotentialDuplicatesDialogData } from './potential-duplicates-dialog/potential-duplicates-dialog';
import { DoubleEntryDialogComponent, DoubleEntryDialogData } from './double-entry-dialog/double-entry-dialog';

@Component({
  selector: 'app-add-donor',
  standalone: true,
  imports: [
    AsyncPipe,
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatDatepickerModule,
    MatRadioModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatMomentDateModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
  ],
  providers: [
    {
      provide: MAT_DATE_FORMATS,
      useValue: DD_MON_YYYY_FORMATS,
    },
    {
      provide: DateAdapter,
      useClass: ChapterAwareDateAdapter,
      deps: [MAT_DATE_LOCALE],
    },
  ],
  templateUrl: './add-donor.html',
  styleUrls: ['./add-donor.scss'],
})
export class AddDonorComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly addDonorService = inject(AddDonorService);
  private readonly donorEmployerService = inject(DonorEmployerService);
  private readonly headerService = inject(HeaderService);
  private readonly loginService = inject(LoginService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly findDonorService = inject(FindDonorService);
  private readonly route = inject(ActivatedRoute);
  private readonly menuService = inject(MenuService);
  private readonly el = inject(ElementRef);

  pendingAltAddress = signal<AlternateDemographicsModel | null>(null);
  private savedLocalAddress: Record<string, unknown> | null = null;
  mode: 'add' | 'modify' = 'add';
  private navigatedFromInvestigate = false;
  private isSettingCityFromZip = false;
  private isSettingMigratedCityFromZip = false;
  donorForm!: FormGroup;
  saving = false;
  donorCreated = false;
  maxDob: Moment = this.getChapterDate();
  chapterDate: Moment = this.getChapterDate();

  salutations = signal<LookupOption[]>([]);
  ethnicGroups = signal<LookupOption[]>([]);
  languages = signal<LookupOption[]>([]);
  alternateIdTypes = signal<LookupOption[]>([]);
  employerOptions = signal<AutocompleteOption[]>([]);
  private allEmployerOptions: AutocompleteOption[] = [];

  salutationSearchCtrl = new FormControl('');
  ethnicGroupSearchCtrl = new FormControl('');
  languageSearchCtrl = new FormControl('');
  altIdTypeSearchCtrl = new FormControl('');
  employerSearchCtrl = new FormControl('');

  private salutationSearch = signal('');
  private ethnicGroupSearch = signal('');
  private languageSearch = signal('');
  private altIdTypeSearch = signal('');

  filteredSalutations = computed(() => this.filterLookup(this.salutations(), this.salutationSearch()));
  filteredEthnicGroups = computed(() => this.filterLookup(this.ethnicGroups(), this.ethnicGroupSearch()));
  filteredLanguages = computed(() => this.filterLookup(this.languages(), this.languageSearch()));
  filteredAltIdTypes = computed(() => this.filterLookup(this.alternateIdTypes(), this.altIdTypeSearch()));

  filteredEmployers = computed(() => this.employerOptions());

  // ── CITY DROPDOWNS ──────────────────────────────────────────────────────────
  allCities = signal<{ code: string; description: string }[]>([]);
  isLoadingCities = signal(false);
  private allCities$ = toObservable(this.allCities);

  donorCitySearchCtrl = new FormControl('');
  employerCitySearchCtrl2 = new FormControl('');
  migratedCitySearchCtrl = new FormControl('');

  // Observable-based city filters (FE-DROP-004 pattern — required for ngx-mat-select-search)
  filteredDonorCities$!: Observable<{ code: string; description: string }[]>;
  filteredEmployerCities$!: Observable<{ code: string; description: string }[]>;
  filteredMigratedCities$!: Observable<{ code: string; description: string }[]>;

  // ── ZIP DROPDOWNS ────────────────────────────────────────────────────────────
  donorZipOptions = signal<{ code: string; description: string; state: string }[]>([]);
  employerZipOptions = signal<{ code: string; description: string; state: string }[]>([]);
  migratedZipOptions = signal<{ code: string; description: string; state: string }[]>([]);

  isLoadingDonorZips = false;
  isLoadingEmployerZips = false;
  isLoadingMigratedZips = false;

  donorZipSearchCtrl = new FormControl('');
  employerZipSearchCtrl2 = new FormControl('');
  migratedZipSearchCtrl = new FormControl('');

  // Observable-based zip filters (FE-DROP-004 pattern — required for ngx-mat-select-search)
  filteredDonorZips$!: Observable<{ code: string; description: string; state: string }[]>;
  filteredEmployerZips$!: Observable<{ code: string; description: string; state: string }[]>;
  filteredMigratedZips$!: Observable<{ code: string; description: string; state: string }[]>;

  currentDonorData: DonorData | null = null;
  private isPopulatingForm = false;
  private originalBloodType = '';
  private findDonorAlternateId: string | null = null;
  private mdKeyValue = '';
  private originalLastName = '';
  private originalDob = '';
  isSaveDisabled = true;

  donorIntlAddress = signal<InternationalAddressModel | null>(null);
  employerIntlAddress = signal<EmployerIntlAddressResult | null>(null);

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
    actions: [
      {
        label: 'CANCEL',
        matButton: 'stroked',
        ariaLabel: 'Cancel and go back',
        onClick: () => this.onCancel(),
      },
      {
        label: 'SAVE DONOR',
        color: 'primary',
        matButton: 'raised',
        ariaLabel: 'Save donor data',
        disabled: true,
        onClick: () => this.onSave(),
      },
    ],
  };

  constructor() {
    const nav = this.router.getCurrentNavigation();
    const navState = nav?.extras?.state as AddDonorNavigationState | undefined;
    const histState = window.history.state as AddDonorNavigationState | undefined;
    const sessionFlag = sessionStorage.getItem('fromInvestigateDuplicate') === 'true';
    if (navState?.fromInvestigateDuplicate || histState?.fromInvestigateDuplicate || sessionFlag) {
      this.navigatedFromInvestigate = true;
    }

    effect(() => {
      const menuItems = this.menuService.getMenuItemsSignal()();
      if (menuItems.length > 0 && !this.navigatedFromInvestigate) {
        this.initializeHeaderFromMenu();
      }
    });
  }

  private initializeHeaderFromMenu(): void {
    const routeKey = this.mode === 'modify' ? RouteKey.ModifyDonor : RouteKey.AddDonor;
    const basePath = ROUTE_REGISTRY[routeKey]?.path;
    const menuItem = this.menuService.findMenuItemByPath(basePath);

    if (menuItem) {
      this.headerConfig = {
        ...this.headerConfig,
        breadcrumbs: [
          { label: 'Home', link: ROUTES.HOME },
          { label: 'Donor Profile', link: ROUTES.HOME },
          { label: menuItem.label, link: null },
        ],
        title: menuItem.label,
        subtitle: menuItem.remarks || menuItem.subtitle || '',
      };
      this.cdr.markForCheck();
    }
  }

  ngOnInit(): void {
    this.initializeForm();
    this.loadNavigationState();
    this.loadLookups();
    this.setupCityFilters();
    this.setupZipFilters();
    this.loadAllCities();
    this.setupEmployerAutocomplete();
    this.setupSearchSubscriptions();
    this.subscribeToChapterChanges();
    this.setupAlternateIdValidation();
    this.subscribeToFormStatus();
    this.syncMobileToAltAddress();
    this.setupBloodTypeValidation();
    this.setupAltIdCrossValidation();
    this.loadMdKeyParameter();
  }

  private setupAltIdCrossValidation(): void {
    const altIdCtrl = this.donorForm.get('alternateId');
    altIdCtrl?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.isPopulatingForm || this.mode !== 'modify' || !this.findDonorAlternateId) return;
        const newValue = (altIdCtrl.value || '').trim();
        if (newValue && newValue !== this.findDonorAlternateId) {
          altIdCtrl.setErrors({ ...(altIdCtrl.errors || {}), altIdMismatch: true });
        } else if (altIdCtrl.hasError('altIdMismatch')) {
          const { altIdMismatch, ...rest } = altIdCtrl.errors || {};
          altIdCtrl.setErrors(Object.keys(rest).length ? rest : null);
        }
      });
  }

  private setupBloodTypeValidation(): void {
    const bloodTypeCtrl = this.donorForm.get('bloodType');
    bloodTypeCtrl?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.isPopulatingForm || this.mode !== 'modify') return;
        this.validateBloodType();
      });
  }

  validateBloodType(): void {
    const ctrl = this.donorForm.get('bloodType');
    if (!ctrl) return;
    const newValue = (ctrl.value || '').trim().toUpperCase();
    const original = this.originalBloodType.trim().toUpperCase();
    if (newValue && newValue !== original) {
      ctrl.setErrors({ ...(ctrl.errors || {}), aboModificationNotAllowed: true });
      ctrl.markAsTouched();
      ctrl.markAsDirty();
      this.cdr.markForCheck();
    } else if (ctrl.hasError('aboModificationNotAllowed')) {
      const { aboModificationNotAllowed, ...rest } = ctrl.errors || {};
      ctrl.setErrors(Object.keys(rest).length ? rest : null);
      this.cdr.markForCheck();
    }
  }

  private loadMdKeyParameter(): void {
    if (this.mode !== 'modify') return;
    this.addDonorService.getSystemParameterValue('MDKEY')
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.mdKeyValue = value);
  }

  private requiresDoubleEntry(formValue: Record<string, unknown>): boolean {
    if (this.mdKeyValue !== '2') return false;
    const lastNameChanged = ((formValue['lastName'] as string) || '').toUpperCase().trim()
      !== this.originalLastName.toUpperCase().trim();
    const dobChanged = moment(formValue['dob'] as Moment).format('MM/DD/YYYY')
      !== moment(this.originalDob).format('MM/DD/YYYY');
    return lastNameChanged || dobChanged;
  }

  private showDoubleEntryDialog(formValue: Record<string, unknown>): void {
    const lastNameChanged = ((formValue['lastName'] as string) || '').toUpperCase().trim()
      !== this.originalLastName.toUpperCase().trim();
    const dobChanged = moment(formValue['dob'] as Moment).format('MM/DD/YYYY')
      !== moment(this.originalDob).format('MM/DD/YYYY');

    const dialogRef = this.dialog.open(DoubleEntryDialogComponent, {
      width: '400px',
      disableClose: true,
      data: {
        requireLastName: lastNameChanged,
        requireDob: dobChanged,
        originalLastName: (formValue['lastName'] as string) || '',
        originalDob: formValue['dob'] as string,
      } as DoubleEntryDialogData,
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(verified => {
        if (verified) {
          this.setSaving(true);
          this.modifyDonor(formValue);
        }
      });
  }

  private subscribeToFormStatus(): void {
    this.donorForm.statusChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.updateSaveButtonState());
  }

  private syncMobileToAltAddress(): void {
    this.donorForm.get('mobilePhoneNumber')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        const alt = this.pendingAltAddress();
        if (alt) {
          const digits = (value || '').replace(/\D/g, '');
          this.pendingAltAddress.set({ ...alt, mobilePhoneNumber: digits || null });
        }
      });
  }

  private updateSaveButtonState(): void {
    // Defer update to next tick to avoid ExpressionChangedAfterItHasBeenCheckedError
    Promise.resolve().then(() => {
      const shouldDisable = this.donorCreated || this.donorForm.invalid || this.saving;
      const updatedActions = (this.headerConfig.actions || []).map(action => {
        if (action.ariaLabel === 'Save donor data') {
          return { ...action, disabled: shouldDisable };
        }
        return action;
      });
      this.headerConfig = { ...this.headerConfig, actions: updatedActions };
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.donorForm = this.fb.group({
      lastName: ['', [Validators.required, Validators.maxLength(50), Validators.pattern(/^[a-zA-Z\s'\-]+$/)]],
      firstName: ['', [Validators.required, Validators.maxLength(50)]],
      middleName: ['', [Validators.maxLength(25)]],
      sex: ['', [Validators.required]],
      dob: [null, [Validators.required]],
      donorId: [{ value: '', disabled: true }],
      salutation: ['', [Validators.maxLength(15)]],
      alias: ['', [Validators.maxLength(15)]],
      suffix: ['', [Validators.maxLength(5)]],
      language: ['', [Validators.maxLength(15)]],
      ethnicGroup: ['', [Validators.maxLength(5)]],
      alternateId: ['', [Validators.maxLength(20)]],
      alternateIdType: ['', [Validators.maxLength(20)]],
      claimedDonation: [null, [Validators.min(0), Validators.max(99999)]],
      bloodType: ['', [Validators.maxLength(10)]],

      homeAddress: ['', [Validators.required, Validators.maxLength(50)]],
      apartmentNo: ['', [Validators.maxLength(10)]],
      city: [null, [Validators.required]],
      state: [{ value: '', disabled: true }, [Validators.maxLength(2)]],
      zip: [{ value: null, disabled: true }, [Validators.required]],

      homePhoneNumber: ['', [Validators.maxLength(14)]],
      workPhoneNumber: ['', [Validators.maxLength(14)]],
      mobilePhoneNumber: ['', [Validators.maxLength(14)]],
      preferredContact: [''],
      email: ['', [Validators.maxLength(128), Validators.email]],

      employerName: ['', [Validators.maxLength(50)]],
      employerId: [''],
      employerCity: [null],
      employerState: [{ value: '', disabled: true }],
      employerZip: [{ value: null, disabled: true }],

      bloodCenter: ['', [Validators.maxLength(30)]],
      migratedHomeAddress: ['', [Validators.maxLength(50)]],
      migratedApartmentNo: ['', [Validators.maxLength(10)]],
      migratedCity: [null],
      migratedState: [{ value: '', disabled: true }, [Validators.maxLength(5)]],
      migratedZip: [{ value: null, disabled: true }],
      migratedId: ['', [Validators.maxLength(10)]],
      migratedDonations: [null, [Validators.max(9999)]],
    });
  }

  private loadNavigationState(): void {
    const nav = this.router.getCurrentNavigation();
    const state = nav?.extras?.state as AddDonorNavigationState | undefined;

    if (state?.mode) {
      this.applyNavigationState(state);
      return;
    }

    const currentState = history.state as AddDonorNavigationState | undefined;
    if (currentState?.mode) {
      this.applyNavigationState(currentState);
      return;
    }

    const routeMode = this.route.snapshot.data['donorMode'] as 'add' | 'modify' | undefined;
    if (routeMode) {
      this.mode = routeMode;
      this.initializeHeaderFromMenu();
      this.openFindDonorDialog(routeMode);
    } else {
      this.initializeHeaderFromMenu();
    }
  }

  private openFindDonorDialog(donorMode: 'add' | 'modify'): void {
    const dialogRef = this.dialog.open(FindDonorDialog, {
      width: '1184px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      position: { bottom: '0px', right: '0px' },
      panelClass: 'find-donor-panel',
      disableClose: true,
      data: { mode: donorMode, programName: donorMode === 'modify' ? 'DPUKYDAT' : 'DPIADDNR' }
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result: FindDonorDialogResult) => {
        if (result?.action === 'new') {
          const criteria = result.searchCriteria;
          if (criteria) {
            this.donorForm.patchValue({
              lastName: criteria.lastName || '',
              firstName: criteria.firstName || '',
              sex: criteria.sex || '',
              dob: criteria.dob ? moment(criteria.dob) : null,
              alternateId: criteria.alternateId || '',
              alternateIdType: criteria.alternateIdType || '',
            });
          }
          if (donorMode === 'modify') {
            this.updateHeaderForModify();
          } else {
            this.initializeHeaderFromMenu();
          }
        } else if (result?.action === 'select') {
          this.mode = 'modify';
          this.updateHeaderForModify();
          if (result.searchCriteria?.alternateId) {
            this.findDonorAlternateId = result.searchCriteria.alternateId;
          }
          this.loadDonorForModify(result.donor.donorId!);
        } else {
          this.router.navigate(['/home']);
        }
      });
  }

  private applyNavigationState(state: AddDonorNavigationState): void {
    this.mode = state.mode;

    if (state.fromInvestigateDuplicate) {
      this.navigatedFromInvestigate = true;
      sessionStorage.setItem('fromInvestigateDuplicate', 'true');
    }

    if (this.mode === 'add') {
      this.initializeHeaderFromMenu();
      if (state.searchCriteria) {
        const criteria = state.searchCriteria;
        this.donorForm.patchValue({
          lastName: criteria.lastName || '',
          firstName: criteria.firstName || '',
          sex: criteria.sex || '',
          dob: criteria.dob ? moment(criteria.dob) : null,
          alternateId: criteria.alternateId || '',
          alternateIdType: criteria.alternateIdType || '',
        });
      }
    }

    if (this.mode === 'modify' && state.donorId) {
      if (state.searchCriteria?.alternateId) {
        this.findDonorAlternateId = state.searchCriteria.alternateId;
      }
      if (this.navigatedFromInvestigate) {
        this.updateHeaderForInvestigateDuplicate();
      } else {
        this.updateHeaderForModify();
      }
      this.loadDonorForModify(state.donorId);
    }
  }

  private updateHeaderForInvestigateDuplicate(): void {
    const basePath = ROUTE_REGISTRY[RouteKey.ModifyDonor]?.path;
    const menuItem = this.menuService.findMenuItemByPath(basePath);
    const title = menuItem?.label || 'Modify Donor Data';
    const subtitle = menuItem?.remarks || menuItem?.subtitle || '';

    this.headerConfig = {
      ...this.headerConfig,
      breadcrumbs: [
        { label: 'Home', link: ROUTES.HOME },
        { label: 'Investigate Duplicate Donor Records', link: '/donor-functions/donor-profile/donor-profile-maintenance/investigate-duplicate-donor-records' },
        { label: title, link: null },
      ],
      title,
      subtitle,
    };
    this.cdr.markForCheck();
  }

  private updateHeaderForModify(): void {
    const basePath = ROUTE_REGISTRY[RouteKey.ModifyDonor]?.path;
    const menuItem = this.menuService.findMenuItemByPath(basePath);

    if (menuItem) {
      this.headerConfig = {
        ...this.headerConfig,
        breadcrumbs: [
          { label: 'Home', link: ROUTES.HOME },
          { label: 'Donor Profile', link: ROUTES.HOME },
          { label: menuItem.label, link: null },
        ],
        title: menuItem.label,
        subtitle: menuItem.remarks || menuItem.subtitle || '',
      };
    } else {
      this.headerConfig = {
        ...this.headerConfig,
        breadcrumbs: [
          { label: 'Home', link: ROUTES.HOME },
          { label: 'Donor Profile', link: ROUTES.HOME },
          { label: 'Modify Donor', link: null },
        ],
        title: 'Modify Donor',
        subtitle: '',
      };
    }
    this.cdr.markForCheck();
  }

  private loadDonorForModify(donorId: string): void {
    this.addDonorService
      .getDonorById(donorId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (donor) => {
          this.currentDonorData = donor;
          this.populateFormFromDonor(donor);
          this.cdr.markForCheck();
        },
        error: () => {
          this.snackbarService.showError('Failed to load donor data.');
        },
      });
  }

  private populateFormFromDonor(donor: DonorData): void {
    this.isPopulatingForm = true;
    this.donorForm.patchValue({
      lastName: donor.lastName,
      firstName: donor.firstName,
      middleName: donor.middleName,
      sex: donor.gender,
      dob: donor.dateOfBirth ? moment(donor.dateOfBirth) : null,
      donorId: donor.donorId,
      salutation: donor.salutation,
      alias: donor.alias,
      suffix: donor.lastNameSuffix,
      language: donor.lang,
      ethnicGroup: donor.ethnicGroup,
      alternateId: donor.alternateId,
      alternateIdType: donor.alternateIdType,
      claimedDonation: donor.claimedDonation,
      bloodType: donor.bloodType || '',
      homeAddress: donor.intlAddrFlag === 'Y' ? '' : donor.streetName,
      apartmentNo: donor.intlAddrFlag === 'Y' ? '' : donor.suiteApt,
      city: donor.intlAddrFlag === 'Y' ? '' : donor.city,
      state: donor.intlAddrFlag === 'Y' ? '' : donor.state,
      zip: donor.intlAddrFlag === 'Y' ? '' : donor.zip,
      homePhoneNumber: this.formatPhoneForDisplay(
        donor.homeAreaCode,
        donor.homePhoneNo,
      ),
      workPhoneNumber: this.formatPhoneForDisplay(
        donor.workAreaCode,
        donor.workPhoneNo,
      ),
      mobilePhoneNumber: this.formatPhoneForDisplay(
        donor.mobileAreaCode,
        donor.mobilePhoneNo,
      ),
      preferredContact: this.getPreferredContact(donor.preferredContactFlag),
      email: donor.email,
      employerName: donor.employerName,
      employerId: donor.employerId,
      employerCity: donor.employerCity,
      employerState: donor.employerState,
      employerZip: donor.employerZip,
      bloodCenter: donor.prevBloodCenter,
      migratedHomeAddress: donor.migratedStreetName,
      migratedApartmentNo: donor.migratedSuiteApt,
      migratedCity: donor.migratedCity,
      migratedState: donor.migratedState,
      migratedZip: donor.migratedZip,
      migratedId: donor.previousDonorId,
      migratedDonations: donor.migratedUnit,
    });

    this.originalBloodType = donor.bloodType || '';
    this.originalLastName = donor.lastName || '';
    this.originalDob = donor.dateOfBirth || '';

    setTimeout(() => {
      this.isPopulatingForm = false;
    }, 500);

    if (donor.alternateAddress) {
      this.pendingAltAddress.set(donor.alternateAddress);
    }

    if (donor.internationalAddress) {
      this.donorIntlAddress.set(donor.internationalAddress);
      this.disableAddressFields();
    } else if (donor.city) {
      // Load zips for existing city so dropdown is populated, then re-patch zip
      this.onDonorCitySelected(donor.city);
      const savedZip = donor.zip;
      const savedState = donor.state;
      if (savedZip) {
        setTimeout(() => {
          this.donorForm.patchValue({ zip: savedZip, state: savedState }, { emitEvent: false });
        }, 500);
      }
    }

    if (donor.migratedCity) {
      this.onMigratedCitySelected(donor.migratedCity);
      const savedMigZip = donor.migratedZip;
      const savedMigState = donor.migratedState;
      if (savedMigZip) {
        setTimeout(() => {
          this.donorForm.patchValue({ migratedZip: savedMigZip, migratedState: savedMigState }, { emitEvent: false });
        }, 500);
      }
    }

    if (donor.employerCity) {
      this.onEmployerCitySelected(donor.employerCity);
      const savedEmpZip = donor.employerZip;
      if (savedEmpZip) {
        setTimeout(() => {
          this.donorForm.patchValue({ employerZip: savedEmpZip }, { emitEvent: false });
          this.donorForm.get('employerState')?.setValue(donor.employerState || '', { emitEvent: false });
        }, 500);
      }
    }
    if (donor.employerId && donor.employerIntlAddrFlag === 'Y') {
      this.disableEmployerAddressFields();
      this.donorEmployerService
        .getById(donor.employerId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (empData: any) => {
            if (empData?.intlAddrFlag === 'Y') {
              this.employerIntlAddress.set({
                city: empData.intlCity || '',
                state: empData.intlState || null,
                postalCode: empData.intlPostalCode || null,
                country: empData.intlCountryName || '',
                intlAddrFlag: 'Y',
                modifiedFlag: 'N',
              });
            }
            this.cdr.markForCheck();
          },
          error: () => {
            if (donor.employerInternationalAddress) {
              this.employerIntlAddress.set(donor.employerInternationalAddress);
            }
          },
        });
    } else if (donor.employerInternationalAddress) {
      this.employerIntlAddress.set(donor.employerInternationalAddress);
      this.disableEmployerAddressFields();
    }
  }

  private loadLookups(): void {
    this.addDonorService
      .getLookupSalutations()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => this.salutations.set(data || []),
        error: () => this.snackbarService.showError('Failed to load salutations'),
      });

    this.addDonorService
      .getLookupEthnicGroups()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => this.ethnicGroups.set(data || []),
        error: () => this.snackbarService.showError('Failed to load ethnic groups'),
      });

    this.addDonorService
      .getLookupLanguages()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => this.languages.set(data || []),
        error: () => this.snackbarService.showError('Failed to load languages'),
      });

    this.loadAlternateIdTypes();
  }

  private loadAlternateIdTypes(): void {
    this.findDonorService
      .getAlternateIdTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (types) => {
          const excluded = ['C39', 'C417'];
          this.alternateIdTypes.set(
            types
              .filter((t) => !excluded.includes(t.code))
              .map((t) => ({ code: t.code, description: t.description }))
          );
        },
        error: () => this.snackbarService.showError('Failed to load alternate ID types'),
      });
  }

  private setupEmployerAutocomplete(): void {
    this.loadEmployers();
    this.employerSearchCtrl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$),
      )
      .subscribe(search => {
        if (!search) {
          this.employerOptions.set(this.allEmployerOptions);
        } else {
          const lower = search.toLowerCase();
          this.employerOptions.set(
            this.allEmployerOptions.filter(o =>
              o.employerName.toLowerCase().includes(lower)
            )
          );
        }
      });
  }

  private loadEmployers(): void {
    this.addDonorService.getLookupEmployers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (options) => {
          const mapped = options.map(o => ({
            employerId: o.code,
            employerName: o.description,
          }));
          this.allEmployerOptions = mapped;
          this.employerOptions.set(mapped);
        },
        error: () => this.employerOptions.set([]),
      });
  }

  onEmployerSelected(employerId: string): void {
    if (!employerId) {
      this.donorForm.patchValue({ employerId: '', employerCity: null, employerState: '', employerZip: null });
      this.donorForm.get('employerZip')?.disable({ emitEvent: false });
      this.employerZipOptions.set([]);
      return;
    }
    const option = this.employerOptions().find(o => o.employerId === employerId);
    if (!option) return;

    this.donorForm.patchValue({
      employerId: option.employerId,
    });

    this.donorEmployerService
      .getById(option.employerId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        next: (response: any) => {
          const data = response?.item || response || {};
          if (data.intlAddrFlag === 'Y') {
            this.employerIntlAddress.set({
              city: data.intlCity || '',
              state: data.intlState || null,
              postalCode: data.intlPostalCode || null,
              country: data.intlCountryName || '',
              intlAddrFlag: 'Y',
              modifiedFlag: 'N',
            });
            this.disableEmployerAddressFields();
          } else {
            this.employerIntlAddress.set(null);
            this.enableEmployerAddressFields();
            const city = data.city || '';
            const zip = data.zip || '';
            const state = data.state || '';
            if (city) {
              // Load zips via the mat-select flow, then patch zip
              this.donorForm.patchValue({ employerCity: city }, { emitEvent: false });
              this.onEmployerCitySelected(city);
              if (zip) {
                setTimeout(() => {
                  this.donorForm.patchValue({ employerZip: zip }, { emitEvent: false });
                  this.donorForm.get('employerState')?.setValue(state, { emitEvent: false });
                }, 500);
              }
            }
          }
          this.cdr.markForCheck();
        },
        error: () => {},
      });
  }

  displayEmployerFn(option: AutocompleteOption | string): string {
    if (typeof option === 'string') return option;
    return option?.employerName || '';
  }

  openAddEmployerDialog(): void {
    const dialogRef = this.dialog.open(AddEmployerPanelComponent, {
      width: '600px',
      height: 'calc(100vh - 64px)',
      maxHeight: 'calc(100vh - 64px)',
      position: { right: '0', top: '64px' },
      panelClass: 'right-side-drawer',
      disableClose: true,
    });

    dialogRef.componentInstance.save
      .pipe(takeUntil(this.destroy$))
      .subscribe((result: { message: string; employerId: string; employerName: string }) => {
        this.snackbarService.showSuccess(result.message || 'Employer created successfully');
        dialogRef.close();

        const newEmployerId = result.employerId;
        const newEmployerName = result.employerName;

        this.addDonorService.getLookupEmployers()
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (options) => {
              const mapped = options.map(o => ({
                employerId: o.code,
                employerName: o.description,
              }));

              if (newEmployerId && !mapped.some(o => o.employerId === newEmployerId)) {
                mapped.unshift({ employerId: newEmployerId, employerName: newEmployerName });
              }

              this.allEmployerOptions = mapped;
              this.employerOptions.set(mapped);

              if (newEmployerId) {
                this.donorForm.patchValue({ employerId: newEmployerId });
                this.onEmployerSelected(newEmployerId);
              }

              this.cdr.markForCheck();
            },
            error: () => this.employerOptions.set([]),
          });
      });

    dialogRef.componentInstance.close
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        dialogRef.close();
      });
  }

  openDonorInternationalAddress(): void {
    const hasLocalAddress = !!(
      this.donorForm.get('homeAddress')?.value?.trim() ||
      this.donorForm.get('city')?.value?.trim() ||
      this.donorForm.get('zip')?.value?.trim()
    );

    if (hasLocalAddress && !this.donorIntlAddress()) {
      const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
        width: '400px',
        disableClose: true,
        data: {
          title: 'Local Address Populated',
          message: 'Local address is already populated. Switching to international address will clear the domestic address fields. Do you want to proceed?',
          confirmText: 'PROCEED',
          cancelText: 'CANCEL',
        },
      });

      dialogRef.afterClosed()
        .pipe(takeUntil(this.destroy$))
        .subscribe((confirmed: boolean) => {
          if (confirmed) {
            this.saveLocalAddressFields();
            this.disableAddressFields();
            this.openInternationalAddressDialog();
          }
        });
      return;
    }

    this.openInternationalAddressDialog();
  }

  private openInternationalAddressDialog(): void {
    const dialogRef = this.dialog.open(InternationalAddressDialogComponent, {
      width: '600px',
      height: 'calc(100vh - 64px)',
      maxHeight: 'calc(100vh - 64px)',
      position: { right: '0', top: '64px' },
      panelClass: 'right-side-drawer',
      data: { existingAddress: this.donorIntlAddress() },
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result: InternationalAddressModel | null | undefined) => {
        if (result === null) {
          this.clearDonorInternationalAddress();
          this.savedLocalAddress = null;
        } else if (result) {
          this.donorIntlAddress.set(result);
          this.disableAddressFields();
          this.savedLocalAddress = null;
          this.cdr.markForCheck();
        } else if (!this.donorIntlAddress()) {
          this.restoreLocalAddressFields();
          this.cdr.markForCheck();
        }
      });
  }

  openEmployerInternationalAddress(): void {
    // Check only for city and zip, not employerId (we keep the employer selection)
    const hasLocalEmployerAddress = !!(
      this.donorForm.get('employerCity')?.value?.trim() ||
      this.donorForm.get('employerZip')?.value?.trim()
    );

    if (hasLocalEmployerAddress && !this.employerIntlAddress()) {
      const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
        width: '400px',
        disableClose: true,
        data: {
          title: 'Employer Address Populated',
          message: 'Employer address is already populated. Switching to international address will clear the employer address fields. Do you want to proceed?',
          confirmText: 'PROCEED',
          cancelText: 'CANCEL',
        },
      });

      dialogRef.afterClosed()
        .pipe(takeUntil(this.destroy$))
        .subscribe((confirmed: boolean) => {
          if (confirmed) {
            this.disableEmployerAddressFields();
            this.openEmployerInternationalAddressDialog();
          }
        });
      return;
    }

    this.openEmployerInternationalAddressDialog();
  }

  private openEmployerInternationalAddressDialog(): void {
    const dialogRef = this.dialog.open(EmployerIntlAddressDialogComponent, {
      width: '600px',
      height: 'calc(100vh - 64px)',
      maxHeight: 'calc(100vh - 64px)',
      position: { right: '0', top: '64px' },
      panelClass: 'right-side-drawer',
      data: { existingAddress: this.employerIntlAddress() },
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result: EmployerIntlAddressResult | null | undefined) => {
        if (result === null) {
          this.clearEmployerInternationalAddress();
        } else if (result) {
          this.employerIntlAddress.set(result);
          this.disableEmployerAddressFields();
          this.cdr.markForCheck();
        } else if (!this.employerIntlAddress()) {
          this.enableEmployerAddressFields();
          this.cdr.markForCheck();
        }
      });
  }

  clearDonorInternationalAddress(): void {
    this.donorIntlAddress.set(null);
    this.enableAddressFields();
    this.cdr.markForCheck();
  }

  private clearEmployerInternationalAddress(): void {
    this.employerIntlAddress.set(null);
    this.enableEmployerAddressFields();
    this.cdr.markForCheck();
  }

  private disableAddressFields(): void {
    const addressFields = ['homeAddress', 'apartmentNo', 'city', 'zip'];
    addressFields.forEach(f => {
      const ctrl = this.donorForm.get(f);
      ctrl?.setValue('', { emitEvent: false });
      ctrl?.disable({ emitEvent: false });
      ctrl?.clearValidators();
      ctrl?.updateValueAndValidity({ emitEvent: false });
    });

    if (!this.pendingAltAddress()) {
      const contactFields = ['homePhoneNumber', 'workPhoneNumber', 'mobilePhoneNumber', 'preferredContact', 'email'];
      contactFields.forEach(f => {
        const ctrl = this.donorForm.get(f);
        ctrl?.setValue('', { emitEvent: false });
        ctrl?.disable({ emitEvent: false });
        ctrl?.clearValidators();
        ctrl?.updateValueAndValidity({ emitEvent: false });
      });
    }

    this.donorForm.get('state')?.setValue('', { emitEvent: false });
    this.updateSaveButtonState();
  }

  private enableAddressFields(): void {
    const contactFields = ['homePhoneNumber', 'workPhoneNumber', 'mobilePhoneNumber', 'preferredContact', 'email'];

    // Enable street/apt/city only — zip stays disabled until a city is selected
    ['homeAddress', 'apartmentNo', 'city'].forEach(f => this.donorForm.get(f)?.enable());
    contactFields.forEach(f => this.donorForm.get(f)?.enable());

    this.donorForm.get('homeAddress')?.setValidators([Validators.required, Validators.maxLength(50)]);
    this.donorForm.get('city')?.setValidators([Validators.required]);
    this.donorForm.get('zip')?.setValidators([Validators.required]);
    this.donorForm.get('homePhoneNumber')?.setValidators([Validators.maxLength(14)]);
    this.donorForm.get('workPhoneNumber')?.setValidators([Validators.maxLength(14)]);
    this.donorForm.get('mobilePhoneNumber')?.setValidators([Validators.maxLength(14)]);
    this.donorForm.get('email')?.setValidators([Validators.maxLength(128), Validators.email]);

    ['homeAddress', 'apartmentNo', 'city', 'zip', ...contactFields].forEach(f => this.donorForm.get(f)?.updateValueAndValidity());
  }

  private saveLocalAddressFields(): void {
    const fields = ['homeAddress', 'apartmentNo', 'city', 'state', 'zip',
      'homePhoneNumber', 'workPhoneNumber', 'mobilePhoneNumber', 'preferredContact', 'email'];
    this.savedLocalAddress = {};
    fields.forEach(f => {
      this.savedLocalAddress![f] = this.donorForm.get(f)?.value ?? '';
    });
  }

  private restoreLocalAddressFields(): void {
    if (this.savedLocalAddress) {
      this.enableAddressFields();
      this.donorForm.patchValue(this.savedLocalAddress, { emitEvent: false });
      this.donorForm.get('state')?.disable({ emitEvent: false });
      this.savedLocalAddress = null;
    } else {
      this.enableAddressFields();
    }
  }

  private enableContactFields(): void {
    const contactFields = ['homePhoneNumber', 'workPhoneNumber', 'mobilePhoneNumber', 'preferredContact', 'email'];
    contactFields.forEach(f => this.donorForm.get(f)?.enable());

    this.donorForm.get('homePhoneNumber')?.setValidators([Validators.maxLength(14)]);
    this.donorForm.get('workPhoneNumber')?.setValidators([Validators.maxLength(14)]);
    this.donorForm.get('mobilePhoneNumber')?.setValidators([Validators.maxLength(14)]);
    this.donorForm.get('email')?.setValidators([Validators.maxLength(128), Validators.email]);

    contactFields.forEach(f => this.donorForm.get(f)?.updateValueAndValidity());
  }

  private disableEmployerAddressFields(): void {
    // Only clear and disable the address fields (city, zip, state)
    // Keep the employerId (employer name dropdown) as it is
    const employerFields = ['employerCity', 'employerZip'];
    employerFields.forEach(f => {
      const ctrl = this.donorForm.get(f);
      ctrl?.setValue('', { emitEvent: false });
      ctrl?.disable({ emitEvent: false });
      ctrl?.clearValidators();
      ctrl?.updateValueAndValidity({ emitEvent: false });
    });
    this.donorForm.get('employerState')?.setValue('', { emitEvent: false });
  }

  private enableEmployerAddressFields(): void {
    // Only enable the address fields (city, zip)
    // employerId should always remain enabled
    const employerFields = ['employerCity', 'employerZip'];
    employerFields.forEach(f => this.donorForm.get(f)?.enable());
    employerFields.forEach(f => this.donorForm.get(f)?.updateValueAndValidity());
  }

  openAlternateAddress(): void {
    const pending = this.pendingAltAddress();

    const preferred = this.donorForm.get('preferredContact')?.value || '';
    const preferredContactPhoneMap: Record<string, string> = { home: 'H', work: 'W', mobile: 'M' };
    const preferredContactPhone = preferredContactPhoneMap[preferred] || null;

    let existingData: AlternateDemographicsModel | undefined = undefined;
    if (pending) {
      existingData = { ...pending, preferredContactPhone: preferredContactPhone ?? pending.preferredContactPhone };
    } else {
      const mobileRaw = (this.donorForm.get('mobilePhoneNumber')?.value || '').trim();

      if (mobileRaw || preferredContactPhone) {
        existingData = {
          addressType: 'L',
          streetName: null, suiteApt: null, city: null, state: null, zip: null,
          uspsId: null, intlAddress1: null, intlAddress2: null, intlAddress3: null,
          intlAddress4: null, countryName: null, intlCity: null, intlPostalCode: null,
          intlAddrFlag: null, mobilePhoneNumber: mobileRaw || null, otherContactNumber: null,
          altIntlPhoneNumber: null, preferredContactPhone, preferredContactAddress: null,
        };
      }
    }

    const dialogData: AlternateDemographicsDialogData = {
      readOnly: false,
      existingData,
    };

    const dialogRef = this.dialog.open(AlternateDemographicsDialogComponent, {
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
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result: AlternateDemographicsModel | string | null | undefined) => {
        if (result === null) {
          this.pendingAltAddress.set(null);
          const mobileCtrl = this.donorForm.get('mobilePhoneNumber');
          mobileCtrl?.setValue('');
          mobileCtrl?.setErrors(null);
          if (this.donorIntlAddress()) {
            this.disableAddressFields();
          }
          this.cdr.markForCheck();
          return;
        }
        if (!result || result === 'closeAll') return;
        const altData = result as AlternateDemographicsModel;
        const hasPhones = !!(altData.mobilePhoneNumber || altData.otherContactNumber || altData.altIntlPhoneNumber);
        if (hasPhones && !altData.preferredContactPhone) {
          this.snackbarService.showError('Preferred Contact Phone is required in Alternate Demographics.');
          return;
        }
        this.pendingAltAddress.set(altData);

          if (this.donorIntlAddress()) {
            this.enableContactFields();
          }

          const mobileCtrl = this.donorForm.get('mobilePhoneNumber');
          if (altData.mobilePhoneNumber) {
            mobileCtrl?.setValue(altData.mobilePhoneNumber);
            this.validatePhoneField('mobilePhoneNumber');
            if (mobileCtrl?.invalid) {
              mobileCtrl.markAsTouched();
              document.getElementById('mobilePhoneInput')?.focus();
            }
          } else {
            mobileCtrl?.setValue('');
            mobileCtrl?.setErrors(null);
          }

          this.cdr.markForCheck();
      });
  }

  onlyNumbers(event: KeyboardEvent): void {
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (allowedKeys.includes(event.key) || event.ctrlKey || event.metaKey) return;
    if (event.key < '0' || event.key > '9') {
      event.preventDefault();
    }
  }

  convertToUpperCase(event: Event, controlName: string): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.toUpperCase();
    this.donorForm.get(controlName)?.setValue(input.value, { emitEvent: false });
  }

  onPastePositiveOnly(event: ClipboardEvent, controlName: string): void {
    event.preventDefault();
    const pastedText = event.clipboardData?.getData('text') || '';
    const digitsOnly = pastedText.replace(/\D/g, '');
    if (digitsOnly) {
      const value = parseInt(digitsOnly, 10);
      if (value >= 0) {
        this.donorForm.get(controlName)?.setValue(value);
      }
    }
  }

  onDobInput(event: Event): void {
    const input = (event.target as HTMLInputElement).value;
    const dob = this.donorForm.get('dob');
    if (!dob) return;
    if (!input?.trim()) {
      dob.setValue(null, { emitEvent: false });
      dob.setErrors({ required: true });
    } else if (!dob.value) {
      dob.markAsTouched();
      dob.setErrors({ invalidDate: true });
    }
  }

  validateDob(): void {
    const dob = this.donorForm.get('dob');
    if (!dob?.value) return;
    const dobMoment = moment(dob.value);
    if (dobMoment.isValid() && dobMoment.isAfter(this.maxDob)) {
      dob.setErrors({ ...dob.errors, futureDob: true });
    } else if (dob.hasError('futureDob')) {
      const { futureDob, ...remaining } = dob.errors || {};
      dob.setErrors(Object.keys(remaining).length ? remaining : null);
    }
  }

  private focusFirstInvalidField(): void {
    const firstInvalidControl = Object.keys(this.donorForm.controls)
      .find(key => this.donorForm.controls[key].invalid);
    if (firstInvalidControl) {
      const el = this.el.nativeElement.querySelector(
        `[formControlName="${firstInvalidControl}"]`
      ) as HTMLElement;
      if (el) {
        el.focus();
      }
    }
  }

  onSave(): void {
    this.donorForm.markAllAsTouched();
    this.cdr.markForCheck();

    if (this.donorForm.invalid) {
      this.focusFirstInvalidField();
      this.snackbarService.showError('Please fill in all required fields.');
      return;
    }

    if (this.mode === 'modify' && !this.currentDonorData?.donorId) {
      this.snackbarService.showError('Please select a donor to modify first.');
      return;
    }

    const formValue = this.donorForm.getRawValue();

    if (this.mode === 'add') {
      this.checkForDuplicatesBeforeCreate(formValue);
    } else {
      this.checkForDuplicatesBeforeSave(formValue);
    }
  }

  private setSaving(isSaving: boolean): void {
    this.saving = isSaving;

    const updatedActions = (this.headerConfig.actions || []).map(action => {
      if (action.ariaLabel === 'Save donor data') {
        return { ...action, label: isSaving ? 'Saving...' : 'SAVE DONOR', disabled: isSaving || this.donorForm.invalid };
      }
      if (action.ariaLabel === 'Cancel and go back') {
        return { ...action, disabled: isSaving };
      }
      return action;
    });

    this.headerConfig = { ...this.headerConfig, actions: updatedActions };
    this.cdr.markForCheck();
  }

  private disableSaveButton(): void {
    const updatedActions = (this.headerConfig.actions || []).map(action => {
      if (action.ariaLabel === 'Save donor data') {
        return { ...action, disabled: true };
      }
      return action;
    });
    this.headerConfig = { ...this.headerConfig, actions: updatedActions };
    this.cdr.markForCheck();
  }

  private checkForDuplicatesBeforeCreate(formValue: Record<string, unknown>): void {
    const dobControl = this.donorForm.get('dob');
    const dobValue = dobControl?.value;
    const dobFormatted = dobValue ? moment(dobValue).format('MM/DD/YYYY') : '';
    const criteria: any = {
      lastName: formValue['lastName'] || '',
      firstName: formValue['firstName'] || '',
      dob: dobFormatted,
      sex: formValue['sex'] || '',
    };

    const enteredLastName = ((formValue['lastName'] as string) || '').trim().toUpperCase();
    const enteredFirstName = ((formValue['firstName'] as string) || '').trim().toUpperCase();
    const enteredMiddleName = ((formValue['middleName'] as string) || '').trim().toUpperCase();
    const enteredDob = dobFormatted;
    const enteredSex = ((formValue['sex'] as string) || '').trim().toUpperCase().charAt(0);

    this.findDonorService.searchDonors(criteria)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          const duplicates = (result.data || []).filter(d => {
            const dLastName = (d.lastName || '').trim().toUpperCase();
            const dFirstName = (d.firstName || '').trim().toUpperCase();
            const dMiddleName = ((d.middleName as string) || '').trim().toUpperCase();
            const dDob = d.dob ? moment(d.dob).format('MM/DD/YYYY') : '';
            const dSex = (d.sex || '').trim().toUpperCase().charAt(0);
            return dLastName === enteredLastName
              && dFirstName === enteredFirstName
              && dMiddleName === enteredMiddleName
              && dDob === enteredDob
              && dSex === enteredSex;
          });
          if (duplicates.length > 0) {
            this.showDuplicatesDialogForCreate(formValue, duplicates);
          } else {
            this.setSaving(true);
            this.createDonor(formValue);
          }
        },
        error: () => {
          this.setSaving(true);
          this.createDonor(formValue);
        },
      });
  }

  private showDuplicatesDialogForCreate(formValue: Record<string, unknown>, duplicates: FindDonorResult[]): void {
    const dobCtrl = this.donorForm.get('dob');
    const dobFormatted = dobCtrl?.value ? moment(dobCtrl.value).format('MM-DD-YYYY') : '';
    const address = [
      (formValue['homeAddress'] as string) || '',
      (formValue['apartmentNo'] as string) ? '#' + (formValue['apartmentNo'] as string) : '',
      (formValue['city'] as string) || '',
      (formValue['state'] as string) || '',
      (formValue['zip'] as string) || '',
    ].filter(Boolean).join(' ');
    const phone = [
      (formValue['homePhoneNumber'] as string) ? `(H)- ${formValue['homePhoneNumber']}` : '',
      (formValue['workPhoneNumber'] as string) ? `(W)- ${formValue['workPhoneNumber']}` : '',
    ].filter(Boolean).join(' ');

    const dialogRef = this.dialog.open(PotentialDuplicatesDialogComponent, {
      width: '900px',
      disableClose: true,
      data: {
        duplicates,
        donorId: '',
        currentDonor: {
          donorId: '(NEW)',
          lastName: (formValue['lastName'] as string) || '',
          firstName: (formValue['firstName'] as string) || '',
          middleName: (formValue['middleName'] as string) || '',
          dob: dobFormatted,
          sex: (formValue['sex'] as string) || '',
          aboRh: '',
          address,
          phone,
        },
      } as PotentialDuplicatesDialogData,
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((confirmed) => {
        if (confirmed) {
          const potentialDuplicates: PotentialDuplicateEntry[] = duplicates.map(d => ({
            donorId: d.donorId,
            grade: d.grade ?? null,
          }));
          this.setSaving(true);
          this.createDonor(formValue, potentialDuplicates);
        }
      });
  }

  private createDonor(formValue: Record<string, unknown>, potentialDuplicates?: PotentialDuplicateEntry[]): void {
    const request = this.buildCreateRequest(formValue, potentialDuplicates);

    this.addDonorService
      .createDonor(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.setSaving(false);
          this.pendingAltAddress.set(null);
          this.donorCreated = true;
          const data = Array.isArray(response?.data) ? response.data[0] : response?.data;
          const donorId = data?.donorId || '';
          if (donorId) {
            this.donorForm.get('donorId')?.setValue(donorId);
          }
          this.donorForm.disable({ emitEvent: false });
          this.disableSaveButton();
          this.snackbarService.showSuccess(`Donor ${donorId} created successfully.`);
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.setSaving(false);
          const errorMsg =
            error?.error?.errorResponse?.error ||
            error?.error?.message ||
            'Failed to create donor.';
          this.snackbarService.showError(errorMsg);
        },
      });
  }

  private modifyDonor(formValue: Record<string, unknown>): void {
    const donorId = this.currentDonorData?.donorId || '';
    const request: ModifyDonorRequest = {
      ...this.buildCreateRequest(formValue),
      donorId,
    };

    this.addDonorService
      .modifyDonor(donorId, request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.setSaving(false);
          this.snackbarService.showSuccess('Donor updated successfully.');
          this.navigateAfterModify();
        },
        error: (error) => {
          this.setSaving(false);
          const errorMsg =
            error?.error?.errorResponse?.error ||
            error?.error?.message ||
            'Failed to update donor.';
          this.snackbarService.showError(errorMsg);
        },
      });
  }

  private checkForDuplicatesBeforeSave(formValue: Record<string, unknown>): void {
    const donorId = this.currentDonorData?.donorId || '';
    const dobControl = this.donorForm.get('dob');
    const dobValue = dobControl?.value;
    const dobFormatted = dobValue ? moment(dobValue).format('MM/DD/YYYY') : '';
    const criteria: any = {
      lastName: formValue['lastName'] || '',
      firstName: formValue['firstName'] || '',
      dob: dobFormatted,
      sex: formValue['sex'] || '',
    };

    const enteredLastName = ((formValue['lastName'] as string) || '').trim().toUpperCase();
    const enteredFirstName = ((formValue['firstName'] as string) || '').trim().toUpperCase();
    const enteredMiddleName = ((formValue['middleName'] as string) || '').trim().toUpperCase();
    const enteredDob = dobFormatted;
    const enteredSex = ((formValue['sex'] as string) || '').trim().toUpperCase().charAt(0);
    const normalizedDonorId = (donorId || '').trim().toUpperCase();

    this.findDonorService.searchDonors(criteria)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          const duplicates = (result.data || []).filter(d => {
            if ((d.donorId || '').trim().toUpperCase() === normalizedDonorId) return false;
            const dLastName = (d.lastName || '').trim().toUpperCase();
            const dFirstName = (d.firstName || '').trim().toUpperCase();
            const dMiddleName = ((d.middleName as string) || '').trim().toUpperCase();
            const dDob = d.dob ? moment(d.dob).format('MM/DD/YYYY') : '';
            const dSex = (d.sex || '').trim().toUpperCase().charAt(0);
            return dLastName === enteredLastName
              && dFirstName === enteredFirstName
              && dMiddleName === enteredMiddleName
              && dDob === enteredDob
              && dSex === enteredSex;
          });
          if (duplicates.length > 0) {
            this.showDuplicateConfirmation(formValue, duplicates);
          } else {
            this.proceedWithModify(formValue);
          }
        },
        error: () => this.proceedWithModify(formValue),
      });
  }

  private showDuplicateConfirmation(formValue: Record<string, unknown>, duplicates: FindDonorResult[]): void {
    const confirmRef = this.dialog.open(ConfirmActionDialogComponent, {
      width: '400px',
      disableClose: true,
      data: {
        title: 'Confirm',
        message: 'Is all key data modified correct?',
        confirmText: 'YES',
        cancelText: 'NO',
      } as ConfirmActionDialogData,
    });

    confirmRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(confirmed => {
        if (confirmed) {
          this.showDuplicatesDialog(formValue, duplicates);
        }
      });
  }

  private showDuplicatesDialog(formValue: Record<string, unknown>, duplicates: FindDonorResult[]): void {
    const donor = this.currentDonorData;
    const dobCtrl = this.donorForm.get('dob');
    const dobFormatted = dobCtrl?.value ? moment(dobCtrl.value).format('MM-DD-YYYY') : '';
    const address = [
      donor?.streetName,
      donor?.suiteApt ? '#' + donor.suiteApt : '',
      donor?.city,
      donor?.state,
      donor?.zip,
    ].filter(Boolean).join(' ');
    const phone = [
      donor?.homeAreaCode || donor?.homePhoneNo ? `(H)- ${donor?.homeAreaCode || ''} ${donor?.homePhoneNo || ''}` : '',
      donor?.workAreaCode || donor?.workPhoneNo ? `(W)- ${donor?.workAreaCode || ''} ${donor?.workPhoneNo || ''}` : '',
    ].filter(Boolean).join(' ');

    const dialogRef = this.dialog.open(PotentialDuplicatesDialogComponent, {
      width: '900px',
      disableClose: true,
      data: {
        duplicates,
        donorId: donor?.donorId || '',
        currentDonor: {
          donorId: donor?.donorId || '',
          lastName: (formValue['lastName'] as string) || '',
          firstName: (formValue['firstName'] as string) || '',
          middleName: (formValue['middleName'] as string) || '',
          dob: dobFormatted,
          sex: (formValue['sex'] as string) || '',
          aboRh: donor?.bloodType || '',
          address,
          phone,
        },
      } as PotentialDuplicatesDialogData,
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.proceedWithModify(formValue));
  }

  private proceedWithModify(formValue: Record<string, unknown>): void {
    if (this.requiresDoubleEntry(formValue)) {
      this.showDoubleEntryDialog(formValue);
    } else {
      this.setSaving(true);
      this.modifyDonor(formValue);
    }
  }

  private navigateAfterModify(): void {
    sessionStorage.removeItem('fromInvestigateDuplicate');
    if (this.navigatedFromInvestigate) {
      this.router.navigate(['/donor-functions/donor-profile/donor-profile-maintenance/investigate-duplicate-donor-records']);
    } else {
      this.router.navigate([ROUTE_REGISTRY[RouteKey.FindDonor].path]);
    }
  }

  private buildCreateRequest(
    formValue: Record<string, unknown>,
    potentialDuplicates?: PotentialDuplicateEntry[],
  ): CreateDonorRequest {
    const { areaCode: homeAreaCode, phone: homePhone } = this.parsePhone(
      formValue['homePhoneNumber'] as string,
    );
    const { areaCode: workAreaCode, phone: workPhone } = this.parsePhone(
      formValue['workPhoneNumber'] as string,
    );
    const { areaCode: mobileAreaCode, phone: mobilePhone } = this.parsePhone(
      formValue['mobilePhoneNumber'] as string,
    );

    const preferred = formValue['preferredContact'] as string;
    let preferredPhone = '';
    if (preferred === 'home') preferredPhone = 'H';
    else if (preferred === 'work') preferredPhone = 'W';
    else if (preferred === 'mobile') preferredPhone = 'M';

    const intlAddr = this.donorIntlAddress();
    const hasIntl = !!intlAddr;
    const empIntlAddr = this.employerIntlAddress();
    const altAddr = this.pendingAltAddress();

    return {
      lastName: (formValue['lastName'] as string) || '',
      firstName: (formValue['firstName'] as string) || '',
      middleName: (formValue['middleName'] as string) || '',
      salutation: (formValue['salutation'] as string) || '',
      alias: (formValue['alias'] as string) || '',
      lastNameSuffix: (formValue['suffix'] as string) || '',
      gender: (formValue['sex'] as string) || '',
      dateOfBirth: formValue['dob']
        ? moment(formValue['dob'] as Moment).format('YYYY-MM-DD')
        : '',
      ethnicGroup: (formValue['ethnicGroup'] as string) || '',
      alternateId: (formValue['alternateId'] as string) || '',
      alternateIdType: (formValue['alternateIdType'] as string) || '',
      claimedDonation: formValue['claimedDonation'] as number | null,
      lang: (formValue['language'] as string) || '',
      scanId: '',
      employerId: (formValue['employerId'] as string) || '',
      prevBloodCenter: (formValue['bloodCenter'] as string) || '',
      previosDonorId: (formValue['migratedId'] as string) || '',
      migratedUnit: formValue['migratedDonations'] as number | null,
      migratedCity: (formValue['migratedCity'] as string) || '',
      migratedState: (formValue['migratedState'] as string) || '',
      migratedZip: (formValue['migratedZip'] as string) || '',
      migratedAddr2: (formValue['migratedHomeAddress'] as string) || '',
      migratedAddr3: (formValue['migratedApartmentNo'] as string) || '',
      address: {
        streetName: hasIntl ? '' : ((formValue['homeAddress'] as string) || ''),
        suiteApt: hasIntl ? '' : ((formValue['apartmentNo'] as string) || ''),
        city: hasIntl ? '' : ((formValue['city'] as string) || ''),
        state: hasIntl ? '' : ((formValue['state'] as string) || ''),
        zip: hasIntl ? '' : ((formValue['zip'] as string) || ''),
        hAreaCode: homeAreaCode || '',
        hPhoneNo: homePhone || '',
        dAreaCode: workAreaCode || '',
        dPhoneNo: workPhone || '',
        mAreaCode: mobileAreaCode || '',
        mPhoneNo: mobilePhone || '',
        preferredPhone: preferredPhone || '',
        email: hasIntl ? (intlAddr?.email || '') : ((formValue['email'] as string) || ''),
        employerName: this.getSelectedEmployerName(formValue['employerId'] as string),
        eCity: (formValue['employerCity'] as string) || '',
        eZip: (formValue['employerZip'] as string) || '',
        eState: (formValue['employerState'] as string) || '',
        intlAddrFlag: hasIntl ? 'Y' : 'N',
        intlAddress1: intlAddr?.streetName || '',
        intlAddress2: intlAddr?.addr2 || '',
        intlAddress3: intlAddr?.addr3 || '',
        intlAddress4: intlAddr?.addr4 || '',
        countryName: intlAddr?.country || '',
        intlPostalCode: intlAddr?.postalCode || '',
        intlHomePhoneNo: intlAddr?.homePhoneNo || '',
        intlWorkPhoneNo: intlAddr?.workPhoneNo || '',
        intlWorkPhoneExt: intlAddr?.workPhoneExt || '',
        intlMobilePhoneNo: intlAddr?.mobilePhoneNo || '',
        intlFaxNo: intlAddr?.faxNo || '',
        altStreetName: altAddr?.addressType === 'L' ? (altAddr?.streetName || '') : '',
        altSuiteApt: altAddr?.addressType === 'L' ? (altAddr?.suiteApt || '') : '',
        altUspsId: altAddr?.addressType === 'L' ? (altAddr?.uspsId || 0) : 0,
        altIntlAddress1: altAddr?.addressType === 'I' ? (altAddr?.intlAddress1 || '') : '',
        altIntlAddress2: altAddr?.addressType === 'I' ? (altAddr?.intlAddress2 || '') : '',
        altIntlAddress3: altAddr?.addressType === 'I' ? (altAddr?.intlAddress3 || '') : '',
        altIntlAddress4: altAddr?.addressType === 'I' ? (altAddr?.intlAddress4 || '') : '',
        altCountryName: altAddr?.addressType === 'I' ? (altAddr?.countryName || '') : '',
        altIntlPostalCode: altAddr?.addressType === 'I' ? (altAddr?.intlPostalCode || '') : '',
        altIntlAddrFlag: altAddr ? (altAddr.addressType === 'I' ? 'Y' : 'N') : '',
        otherContactNo: altAddr?.otherContactNumber || '',
        altIntlPhoneNo: altAddr?.altIntlPhoneNumber || '',
        altPreferredContactPhone: altAddr?.preferredContactPhone || '',
        preferredContactAddrFlag: altAddr?.preferredContactAddress || '',
        empIntlAddrFlag: empIntlAddr ? 'Y' : 'N',
        empIntlAddress1: '',
        empIntlAddress2: '',
        empIntlAddress3: '',
        empIntlAddress4: '',
        empIntlCity: empIntlAddr?.city || '',
        empIntlState: empIntlAddr?.state || '',
        empCountryName: empIntlAddr?.country || '',
        empIntlPostalCode: empIntlAddr?.postalCode || '',
        empIntlHomePhoneNo: '',
        empIntlWorkPhoneNo: '',
        empIntlWorkPhoneExt: '',
        empIntlMobilePhoneNo: '',
        empIntlFaxNo: '',
        empEmail: '',
      },
      ...(potentialDuplicates?.length ? { potentialDuplicates } : {}),
    };
  }

  onCancel(): void {
    if (this.donorCreated) {
      sessionStorage.removeItem('fromInvestigateDuplicate');
      this.router.navigate([ROUTE_REGISTRY[RouteKey.FindDonor].path]);
      return;
    }

    const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
      width: '400px',
      disableClose: true,
      data: {
        title: 'Unsaved Changes',
        message: 'You have unsaved changes. Are you sure you want to leave?',
        confirmText: 'YES, LEAVE',
        cancelText: 'STAY',
      },
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((confirmed: boolean) => {
        if (confirmed) {
          sessionStorage.removeItem('fromInvestigateDuplicate');
          if (this.navigatedFromInvestigate) {
            this.router.navigate(['/donor-functions/donor-profile/donor-profile-maintenance/investigate-duplicate-donor-records']);
          } else {
            this.router.navigate([ROUTE_REGISTRY[RouteKey.FindDonor].path]);
          }
        }
      });
  }

  private parsePhone(
    phoneStr: string,
  ): { areaCode: string; phone: string } {
    if (!phoneStr) return { areaCode: '', phone: '' };
    const digits = phoneStr.replace(/\D/g, '');
    if (digits.length >= 10) {
      return {
        areaCode: digits.substring(0, 3),
        phone: digits.substring(3, 10),
      };
    }
    return { areaCode: '', phone: '' };
  }

  private formatPhoneForDisplay(
    areaCode: string,
    phoneNo: string,
  ): string {
    if (!areaCode && !phoneNo) return '';
    const cleanPhone = (phoneNo || '').replace(/\D/g, '');
    if (areaCode) {
      return `(${areaCode}) ${cleanPhone.substring(0, 3)}-${cleanPhone.substring(3)}`;
    }
    if (cleanPhone.length === 7) {
      return `${cleanPhone.substring(0, 3)}-${cleanPhone.substring(3)}`;
    }
    return cleanPhone;
  }

  private getPreferredContact(flag: string): string {
    if (!flag) return '';
    const normalized = flag.trim().toUpperCase();
    switch (normalized) {
      case 'H':
        return 'home';
      case 'W':
      case 'D':
        return 'work';
      case 'M':
        return 'mobile';
      default:
        return '';
    }
  }

  validatePhoneField(fieldName: string): void {
    const ctrl = this.donorForm.get(fieldName);
    if (!ctrl) return;
    const value = (ctrl.value || '').replace(/\D/g, '');

    if (!value) {
      ctrl.setErrors(null);
      return;
    }

    if (value.length !== 10 || parseInt(value, 10) <= 0) {
      ctrl.setErrors({ invalidPhone: true });
    } else {
      this.formatPhoneDisplay(fieldName);
      ctrl.setErrors(null);
      // Validate area code after phone is valid
      this.validatePhoneAreaCode(fieldName);
    }

    if (fieldName === 'mobilePhoneNumber') {
      const alt = this.pendingAltAddress();
      if (alt) {
        this.pendingAltAddress.set({ ...alt, mobilePhoneNumber: value || null });
      }
    }
  }

  private validatePhoneAreaCode(fieldName: string): void {
    const ctrl = this.donorForm.get(fieldName);
    if (!ctrl?.value) return;

    const digits = (ctrl.value || '').replace(/\D/g, '');
    if (digits.length !== 10) return;

    const areaCode = digits.substring(0, 3);
    this.addDonorService.validateAreaCode(areaCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe(valid => {
        if (!valid) {
          ctrl.setErrors({ ...ctrl.errors, areaCodeNotFound: true });
          ctrl.markAsTouched();
        } else if (ctrl.errors?.['areaCodeNotFound']) {
          const { areaCodeNotFound, ...rest } = ctrl.errors;
          ctrl.setErrors(Object.keys(rest).length ? rest : null);
        }
      });
  }

  onPhoneTab(event: Event, fieldName: string): void {
    const value = (this.donorForm.get(fieldName)?.value || '').replace(/\D/g, '');
    event.preventDefault();

    if (!value) {
      const nextFieldMap: Record<string, string> = {
        homePhoneNumber: 'workPhoneNumber',
        workPhoneNumber: 'mobilePhoneNumber',
        mobilePhoneNumber: 'email',
      };
      const nextField = nextFieldMap[fieldName];
      if (nextField) {
        const nextInput = this.el.nativeElement.querySelector(`[formControlName="${nextField}"]`) as HTMLElement;
        nextInput?.focus();
      }
    } else {
      const radioMap: Record<string, string> = {
        homePhoneNumber: 'home',
        workPhoneNumber: 'work',
        mobilePhoneNumber: 'mobile',
      };
      const radioValue = radioMap[fieldName];
      const radio = this.el.nativeElement.querySelector(`mat-radio-button[value="${radioValue}"] input`) as HTMLElement;
      radio?.focus();
    }
  }

  formatPhoneInput(fieldName: string): void {
    const ctrl = this.donorForm.get(fieldName);
    if (!ctrl) return;
    const stripped = (ctrl.value || '').replace(/\D/g, '').substring(0, 10);
    if (stripped !== ctrl.value) {
      ctrl.setValue(stripped, { emitEvent: false });
    }
  }

  onPhonePaste(event: ClipboardEvent, fieldName: string): void {
    event.preventDefault();
    const pastedText = event.clipboardData?.getData('text') || '';
    const digitsOnly = pastedText.replace(/\D/g, '').substring(0, 10);
    const ctrl = this.donorForm.get(fieldName);
    if (ctrl && digitsOnly) {
      ctrl.setValue(digitsOnly, { emitEvent: false });
    }
  }

  private formatPhoneDisplay(fieldName: string): void {
    const ctrl = this.donorForm.get(fieldName);
    if (!ctrl) return;
    const digits = (ctrl.value || '').replace(/\D/g, '');
    if (digits.length === 10) {
      ctrl.setValue(`(${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6)}`, { emitEvent: false });
    }
  }

  // ─── Observable-based city/zip filter setup (FE-DROP-004) ───────────────────

  private setupCityFilters(): void {
    this.filteredDonorCities$ = combineLatest([
      this.donorCitySearchCtrl.valueChanges.pipe(startWith('')),
      this.allCities$,
    ]).pipe(
      map(([search, cities]) => {
        const q = (search || '').toLowerCase();
        return q ? cities.filter(c => c.code.toLowerCase().includes(q)) : cities;
      })
    );

    this.filteredEmployerCities$ = combineLatest([
      this.employerCitySearchCtrl2.valueChanges.pipe(startWith('')),
      this.allCities$,
    ]).pipe(
      map(([search, cities]) => {
        const q = (search || '').toLowerCase();
        return q ? cities.filter(c => c.code.toLowerCase().includes(q)) : cities;
      })
    );

    this.filteredMigratedCities$ = combineLatest([
      this.migratedCitySearchCtrl.valueChanges.pipe(startWith('')),
      this.allCities$,
    ]).pipe(
      map(([search, cities]) => {
        const q = (search || '').toLowerCase();
        return q ? cities.filter(c => c.code.toLowerCase().includes(q)) : cities;
      })
    );
  }

  private setupZipFilters(): void {
    this.filteredDonorZips$ = this.donorZipSearchCtrl.valueChanges.pipe(
      startWith(''),
      map(search => {
        const q = (search || '').toLowerCase();
        const zips = this.donorZipOptions();
        return q ? zips.filter(z => z.code.includes(q) || z.description.toLowerCase().includes(q)) : zips;
      })
    );

    this.filteredEmployerZips$ = this.employerZipSearchCtrl2.valueChanges.pipe(
      startWith(''),
      map(search => {
        const q = (search || '').toLowerCase();
        const zips = this.employerZipOptions();
        return q ? zips.filter(z => z.code.includes(q) || z.description.toLowerCase().includes(q)) : zips;
      })
    );

    this.filteredMigratedZips$ = this.migratedZipSearchCtrl.valueChanges.pipe(
      startWith(''),
      map(search => {
        const q = (search || '').toLowerCase();
        const zips = this.migratedZipOptions();
        return q ? zips.filter(z => z.code.includes(q) || z.description.toLowerCase().includes(q)) : zips;
      })
    );
  }

  // ─── Load all cities on page load ────────────────────────────────────────

  private loadAllCities(): void {
    this.isLoadingCities.set(true);
    this.addDonorService.searchCities('').pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (cities) => {
        this.allCities.set(cities);
        this.isLoadingCities.set(false);
      },
      error: () => {
        this.isLoadingCities.set(false);
      }
    });
  }

  // ─── Donor address handlers ────────────────────────────────────────────────

  onDonorCitySelected(cityCode: string): void {
    this.donorForm.patchValue({ zip: null, state: '' }, { emitEvent: false });
    this.donorForm.get('zip')?.disable({ emitEvent: false });
    this.donorZipOptions.set([]);
    this.donorZipSearchCtrl.setValue('');

    if (!cityCode) return;

    this.isLoadingDonorZips = true;
    this.cdr.markForCheck(); // spinner renders immediately under OnPush
    this.addDonorService.getZipsByCity(cityCode).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (zips) => {
        const options = zips.map(z => {
          const parts = z.description.split(' - ');
          return { code: z.code, description: z.description, state: parts[1]?.trim() ?? '' };
        });
        this.donorZipOptions.set(options);
        this.isLoadingDonorZips = false;
        if (options.length > 0) {
          this.donorForm.get('zip')?.enable({ emitEvent: false });
        }
        if (options.length === 1) {
          this.donorForm.patchValue({ zip: options[0].code, state: options[0].state }, { emitEvent: false });
        }
        // Re-trigger filteredDonorZips$ so ngx-mat-select-search re-syncs with new options
        this.donorZipSearchCtrl.setValue('', { emitEvent: true });
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoadingDonorZips = false;
        this.cdr.markForCheck();
      }
    });
  }

  onDonorZipSelected(zipCode: string): void {
    const zipOption = this.donorZipOptions().find(z => z.code === zipCode);
    if (zipOption?.state) {
      this.donorForm.patchValue({ state: zipOption.state }, { emitEvent: false });
    }
  }

  // ─── Employer address handlers ─────────────────────────────────────────────

  onEmployerCitySelected(cityCode: string): void {
    this.donorForm.patchValue({ employerZip: null }, { emitEvent: false });
    this.donorForm.get('employerState')?.setValue('', { emitEvent: false });
    this.donorForm.get('employerZip')?.disable({ emitEvent: false });
    this.employerZipOptions.set([]);
    this.employerZipSearchCtrl2.setValue('');

    if (!cityCode) return;

    this.isLoadingEmployerZips = true;
    this.cdr.markForCheck(); // spinner renders immediately under OnPush
    this.addDonorService.getZipsByCity(cityCode).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (zips) => {
        const options = zips.map(z => {
          const parts = z.description.split(' - ');
          return { code: z.code, description: z.description, state: parts[1]?.trim() ?? '' };
        });
        this.employerZipOptions.set(options);
        this.isLoadingEmployerZips = false;
        if (options.length > 0) this.donorForm.get('employerZip')?.enable({ emitEvent: false });
        if (options.length === 1) {
          this.donorForm.patchValue({ employerZip: options[0].code }, { emitEvent: false });
          this.donorForm.get('employerState')?.setValue(options[0].state, { emitEvent: false });
        }
        // Re-trigger filteredEmployerZips$ so ngx-mat-select-search re-syncs with new options
        this.employerZipSearchCtrl2.setValue('', { emitEvent: true });
        this.cdr.markForCheck();
      },
      error: () => { this.isLoadingEmployerZips = false; this.cdr.markForCheck(); }
    });
  }

  onEmployerZipSelected(zipCode: string): void {
    const zipOption = this.employerZipOptions().find(z => z.code === zipCode);
    if (zipOption?.state) {
      this.donorForm.get('employerState')?.setValue(zipOption.state, { emitEvent: false });
    }
  }

  // ─── Migrated address handlers ────────────────────────────────────────────

  onMigratedCitySelected(cityCode: string): void {
    this.donorForm.patchValue({ migratedZip: null, migratedState: '' }, { emitEvent: false });
    this.donorForm.get('migratedZip')?.disable({ emitEvent: false });
    this.migratedZipOptions.set([]);
    this.migratedZipSearchCtrl.setValue('');

    if (!cityCode) return;

    this.isLoadingMigratedZips = true;
    this.cdr.markForCheck(); // spinner renders immediately under OnPush
    this.addDonorService.getZipsByCity(cityCode).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (zips) => {
        const options = zips.map(z => {
          const parts = z.description.split(' - ');
          return { code: z.code, description: z.description, state: parts[1]?.trim() ?? '' };
        });
        this.migratedZipOptions.set(options);
        this.isLoadingMigratedZips = false;
        if (options.length > 0) this.donorForm.get('migratedZip')?.enable({ emitEvent: false });
        if (options.length === 1) {
          this.donorForm.patchValue({ migratedZip: options[0].code, migratedState: options[0].state }, { emitEvent: false });
        }
        // Re-trigger filteredMigratedZips$ so ngx-mat-select-search re-syncs with new options
        this.migratedZipSearchCtrl.setValue('', { emitEvent: true });
        this.cdr.markForCheck();
      },
      error: () => { this.isLoadingMigratedZips = false; this.cdr.markForCheck(); }
    });
  }

  onMigratedZipSelected(zipCode: string): void {
    const zipOption = this.migratedZipOptions().find(z => z.code === zipCode);
    if (zipOption?.state) {
      this.donorForm.patchValue({ migratedState: zipOption.state }, { emitEvent: false });
    }
  }

  private setupSearchSubscriptions(): void {
    this.salutationSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(v => this.salutationSearch.set(v || ''));
    this.ethnicGroupSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(v => this.ethnicGroupSearch.set(v || ''));
    this.languageSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(v => this.languageSearch.set(v || ''));
    this.altIdTypeSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(v => this.altIdTypeSearch.set(v || ''));
  }

  onSelectOpenedChange(searchCtrl: FormControl, isOpen: boolean): void {
    if (!isOpen) searchCtrl.setValue('');
  }

  private getSelectedEmployerName(employerId: string): string {
    if (!employerId) return '';
    const found = this.employerOptions().find(o => o.employerId === employerId);
    return found?.employerName || '';
  }

  private filterLookup(items: LookupOption[], search: string): LookupOption[] {
    if (!search) return items;
    const lower = search.toLowerCase();
    return items.filter(i =>
      (i.code || '').toLowerCase().includes(lower) ||
      (i.description || '').toLowerCase().includes(lower)
    );
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.chapterDate = this.getChapterDate();
        this.maxDob = this.chapterDate;
        this.loadLookups();
        this.cdr.markForCheck();
      });
  }

  private getChapterDate(): Moment {
    return DateFieldValidationUtility.getMinDate(this.headerService.chapterTimeZone());
  }

  private setupAlternateIdValidation(): void {
    const altIdCtrl = this.donorForm.get('alternateId');
    const altTypeCtrl = this.donorForm.get('alternateIdType');

    altIdCtrl?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value: string) => {
        if (value && value.trim()) {
          altTypeCtrl?.setValidators([Validators.required, Validators.maxLength(20)]);
        } else {
          altTypeCtrl?.clearValidators();
          altTypeCtrl?.setValidators([Validators.maxLength(20)]);
          // Clear the alternate type value when alternate id is cleared
          altTypeCtrl?.setValue('', { emitEvent: false });
        }
        altTypeCtrl?.updateValueAndValidity({ emitEvent: false });
      });
  }

}
