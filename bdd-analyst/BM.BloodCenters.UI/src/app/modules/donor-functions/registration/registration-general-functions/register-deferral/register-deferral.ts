import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, Subject, debounceTime, distinctUntilChanged, filter, finalize, map, switchMap, takeUntil, tap } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepicker, MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSelectModule } from '@angular/material/select';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner.component';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import moment, { Moment } from 'moment';

import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { dateFormatValidator } from 'src/app/core/utils/date-adapter.util';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { HeaderService } from '@shared/services/header.service';
import { LoginService } from '@shared/services/login.service';
import { FindDonorDialog } from '@shared/components/find-donor/find-donor';
import { FindDonorDialogData, FindDonorDialogResult, FindDonorNewData, FindDonorResult, FindDonorSearchCriteria } from '@shared/components/find-donor/find-donor.model';
import { InternationalAddressDialogComponent } from '@shared/components/international-address-dialog/international-address-dialog.component';
import { InternationalAddressModel } from '@shared/models/international-address.model';
import { AlternateDemographicsDialogComponent } from '@shared/components/alternate-demographics-dialog/alternate-demographics-dialog.component';
import { ConfirmActionDialogComponent } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';
import { AlternateDemographicsDialogData, AlternateDemographicsModel } from '@shared/models/alternate-demographics.model';
import { AlternateDemographicsService } from '@shared/services/alternate-demographics.service';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';

import { normalizeDeferralId } from '@shared/utils/deferral-id.util';
import { AddEmployerPanelComponent } from '../../../donor-profile/donor-profile-general-functions/add-donor/add-employer-panel/add-employer-panel.component';
import { EmployerIntlAddressDialogComponent, EmployerIntlAddressResult } from '../../../donor-profile/donor-profile-general-functions/add-donor/employer-intl-address-dialog/employer-intl-address-dialog.component';
import { RegisterDeferralService } from './services/register-deferral.service';
import { ManualHoldsDialog } from './dialogs/manual-holds-dialog/manual-holds-dialog';
import {
  ContentSection,
  ContentNavItem,
  DriveOption,
  EmployeeOption,
  EmployerLookupOption,
  InterdictionCodeLookupDto,
  InterdictionItem,
  LookupOption,
  DonationTypeLookupOption,
  ProcedureCodeLookupOption,
  DeferralReasonLookupOption,
  CityStateResult,
  DonorAddress,
  FieldValidationResult,
  ManualHoldsDialogData,
  ManualHoldsDialogResult,
  RegisterHoldRequest,
} from './models/register-deferral.model';

@Component({
  selector: 'app-register-deferral',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatMomentDateModule,
    LoadingSpinnerComponent,
    MatRadioModule,
    MatSelectModule,
    MatSnackBarModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
  ],
  templateUrl: './register-deferral.html',
  styleUrls: ['./register-deferral.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterDeferralComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('driveDatePicker') driveDatePicker!: MatDatepicker<Moment>;

  @HostListener('document:focusin', ['$event'])
  onGlobalFocusIn(event: Event): void {
    const target = event.target as HTMLElement;
    const fieldName = this.getFieldNameFromTarget(target);
    if (fieldName) {
      const isInDriveForm = fieldName === 'driveDate' || fieldName === 'driveId';
      const isInRegistrationForm = this.fieldSequence.some(f => f.name === fieldName);
      if (isInDriveForm || isInRegistrationForm) {
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
    const isInDriveForm = fieldName === 'driveDate' || fieldName === 'driveId';
    const isInRegistrationForm = fieldName && this.fieldSequence.some(f => f.name === fieldName);

    if (isInDriveForm || isInRegistrationForm) return;

    event.preventDefault();

    if (this.showRegistrationForm()) {
      const activeField = this.getActiveField();
      if (activeField) {
        this.focusField(activeField);
        return;
      }
    }

    const driveDateCtrl = this.driveForm.get('driveDate');
    if (!driveDateCtrl?.value) {
      this.focusField('driveDate');
      return;
    }

    const driveIdCtrl = this.driveForm.get('driveId');
    if (!driveIdCtrl?.value) {
      setTimeout(() => {
        const el = document.querySelector('[formControlName="driveId"]') as HTMLElement;
        el?.focus();
      });
    }
  }

  private readonly destroy$ = new Subject<void>();
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly headerService = inject(HeaderService);
  private readonly loginService = inject(LoginService);
  private readonly deferralService = inject(RegisterDeferralService);
  private readonly altDemoService = inject(AlternateDemographicsService);

  pageHeaderConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: 'Deferral Registration', link: null },
    ],
  };

  private readonly defaultPageHeaderConfig: PageHeaderConfig = { ...this.pageHeaderConfig };

  private readonly pageHeaderConfigWithBack: PageHeaderConfig = {
    ...this.pageHeaderConfig,
    showBackButton: true,
    onBackClick: () => this.onBackClick(),
  };

  driveForm!: FormGroup;
  registrationForm!: FormGroup;

  showRegistrationForm = signal(false);
  isLoading = signal(false);
  driveRetrieved = signal(false);
  activeSection = signal<ContentSection>('deferral-donor-info');
  registrationTotal = signal(0);
  hasUnsavedChanges = false;
  private isScrollingProgrammatically = false;
  private isFindDonorOpen = false;

  readonly contentSections: ContentNavItem[] = [
    { id: 'deferral-donor-info', label: 'Deferral & Donor Information' },
    { id: 'personal-info', label: 'Personal Information' },
    { id: 'address-info', label: 'Address Information' },
    { id: 'contact-info', label: 'Contact Information' },
    { id: 'employer-info', label: 'Employer/School Information' },
    { id: 'donation-info', label: 'Donation Information' },
  ];
  setId = signal('');
  isDeferralIdValid = signal(false);
  initialDeferralId = '';
  private formInitialized = false;
  private findDonorValues: {
    lastName: string;
    firstName: string;
    dateOfBirth: string;
    gender: string;
    alternateId: string;
    alternateIdType: string;
  } | null = null;
  private newDonorExpected: FindDonorNewData | null = null;

  readonly drives = signal<DriveOption[]>([]);
  readonly driveSearchControl = new FormControl('');
  readonly filteredDrives = signal<DriveOption[]>([]);

  readonly employees = signal<EmployeeOption[]>([]);
  readonly donationTypes = signal<DonationTypeLookupOption[]>([]);
  readonly procedureCodes = signal<ProcedureCodeLookupOption[]>([]);
  readonly deferralReasons = signal<DeferralReasonLookupOption[]>([]);
  readonly equipmentTypes = signal<LookupOption[]>([]);
  readonly ethnicGroups = signal<LookupOption[]>([]);
  readonly deferralTypes: LookupOption[] = [
    { code: 'IND', description: 'Indefinite' },
    { code: 'NA', description: 'Not Applicable' },
    { code: '99', description: 'Unknown' },
  ];
  readonly alternateIdTypes = signal<LookupOption[]>([]);
  readonly interdictionCodes = signal<InterdictionCodeLookupDto[]>([]);
  isEthnicRequired = signal(false);
  isExistingDonor = signal(false);
  hasInternationalAddress = signal(false);
  private readonly donorIntlAddress = signal<InternationalAddressModel | null>(null);
  private readonly employerIntlAddress = signal<InternationalAddressModel | null>(null);
  private readonly pendingAltAddress = signal<AlternateDemographicsModel | null>(null);
  private readonly pendingHolds = signal<InterdictionCodeLookupDto[]>([]);
  private readonly isHoldAction = signal(false);
  private holdSearchCriteria: FindDonorSearchCriteria | null = null;
  readonly minDeferredThruDate = signal<Moment | null>(null);
  private readonly addressFields = ['homeAddress', 'apartmentNo', 'city', 'zip'];
  private readonly intlDisabledFields = [
    'homeAddress', 'apartmentNo', 'city', 'zip',
    'homePhoneNumber', 'workPhoneNumber', 'mobilePhoneNumber', 'email',
  ];

  readonly employerSearchControl = new FormControl('');
  readonly filteredEmployers = signal<EmployerLookupOption[]>([]);
  readonly cityOptions = signal<{ city: string; state: string; uspsId: number | null }[]>([]);
  readonly zipOptions = signal<{ code: string; description: string }[]>([]);
  validCityZips: string[] = [];
  private isSettingCityFromZip = false;
  readonly employerCitySearchControl = new FormControl('');
  readonly filteredEmployerCities = signal<CityStateResult[]>([]);

  readonly alternateTypeSearchControl = new FormControl('');
  readonly filteredAlternateIdTypes = signal<LookupOption[]>([]);

  readonly ethnicGroupSearchControl = new FormControl('');
  readonly filteredEthnicGroups = signal<LookupOption[]>([]);

  readonly donationTypeSearchControl = new FormControl('');
  readonly filteredDonationTypes = signal<DonationTypeLookupOption[]>([]);

  readonly procedureCodeSearchControl = new FormControl('');
  readonly filteredProcedureCodes = signal<ProcedureCodeLookupOption[]>([]);

  readonly deferralReasonSearchControl = new FormControl('');
  readonly filteredDeferralReasons = signal<DeferralReasonLookupOption[]>([]);

  readonly staffSearchControl = new FormControl('');
  readonly filteredEmployees = signal<EmployeeOption[]>([]);

  readonly equipmentTypeSearchControl = new FormControl('');
  readonly filteredEquipmentTypes = signal<LookupOption[]>([]);

  donorId = signal('');
  aboDescription = signal('--');
  driveName = signal('--');
  transactionId = signal('--');
  stateDisplay = signal('--');
  employerStateDisplay = signal('--');
  private readonly selectedUspsId = signal<number | null>(null);
  readonly selectedCityName = signal<string>('');
  private readonly selectedEUspsId = signal<number | null>(null);
  private readonly selectedEmployerId = signal<string | null>(null);

  readonly fieldSequence: { name: string; required: boolean }[] = [
    { name: 'deferralId', required: true },
    { name: 'lastName', required: true },
    { name: 'lastNameSuffix', required: false },
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
    { name: 'homePhoneNumber', required: false },
    { name: 'workPhoneNumber', required: false },
    { name: 'extension', required: false },
    { name: 'mobilePhoneNumber', required: false },
    { name: 'preferredPhone', required: false },
    { name: 'email', required: false },
    { name: 'employerName', required: false },
    { name: 'employerCity', required: false },
    { name: 'employerZip', required: false },
    { name: 'ethnicGroup', required: false },
    { name: 'lookupId', required: false },
    { name: 'donationType', required: true },
    { name: 'procedureCode', required: true },
    { name: 'physicalId', required: false },
    { name: 'deferral', required: true },
    { name: 'deferredThru', required: false },
    { name: 'deferralType', required: true },
    { name: 'historianId', required: false },
    { name: 'reviewerId', required: false },
    { name: 'equipmentType', required: false },
    { name: 'finalDeferralId', required: true },
  ];

  private lastActiveField: string | null = null;
  private savedLocalAddress: {
    homeAddress: string; apartmentNo: string; city: string; zip: string;
    homePhoneNumber: string; workPhoneNumber: string; mobilePhoneNumber: string;
    email: string; stateDisplay: string;
  } | null = null;

  private savedEmployerAddress: {
    employerName: string; employerCity: string; employerZip: string;
    employerStateDisplay: string; cityDisabled: boolean; zipDisabled: boolean;
  } | null = null;

  minDate: Moment;
  chapterMaxDate: Moment;

  driveDateDoubleEntry: 'idle' | 'pending' = 'idle';
  private pendingDriveDate: string | null = null;
  private lastConfirmedDriveDate: string | null = null;

  deferralIdDoubleEntry: 'idle' | 'pending' = 'idle';
  private pendingDeferralId: string | null = null;
  private deferralIdInputStartTime: number = 0;
  private deferralIdCharCount: number = 0;
  private readonly SCAN_SPEED_THRESHOLD_MS = 100;

  finalDeferralIdDoubleEntry: 'idle' | 'pending' = 'idle';
  private pendingFinalDeferralId: string | null = null;
  private lastConfirmedFinalDeferralId: string | null = null;

  private get chapterOffset(): string {
    return this.headerService.chapterTimeZone();
  }

  constructor() {
    this.minDate = this.getChapterMinDate();
    this.chapterMaxDate = this.getChapterMinDate();
  }

  ngOnInit(): void {
    this.initDriveForm();
    this.subscribeToChapterChanges();
    this.setupDriveDateChange();
    this.setupDriveSearch();
  }

  ngAfterViewInit(): void {
    this.setupSectionObserver();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initDriveForm(): void {
    this.driveForm = this.fb.group({
      driveDate: [null, [Validators.required]],
      driveId: ['', [Validators.required]],
    });
  }

  private initRegistrationForm(): void {
    this.registrationForm = this.fb.group({
      deferralId: ['', [Validators.required, Validators.pattern('^([0-9]{8}|[Cc][0-9]{8}[Cc])$')]],
      lastName: ['', [Validators.required, Validators.maxLength(50)]],
      lastNameSuffix: ['', [Validators.maxLength(5)]],
      firstName: ['', [Validators.required, Validators.maxLength(50)]],
      middleName: ['', [Validators.maxLength(25)]],
      dob: [null, [Validators.required]],
      sex: ['', [Validators.required]],
      weight: [null, [Validators.required, Validators.min(1), Validators.max(999999), Validators.pattern('^[0-9]*$')]],
      alternateId: ['', [Validators.maxLength(20)]],
      alternateType: [''],
      idQueue: [''],
      homeAddress: ['', [Validators.required, Validators.maxLength(50)]],
      apartmentNo: ['', [Validators.maxLength(10)]],
      city: ['', [Validators.required, Validators.maxLength(40)]],
      zip: ['', [Validators.required, Validators.maxLength(6)]],
      homePhoneNumber: [''],
      workPhoneNumber: [''],
      extension: ['', [Validators.maxLength(6), Validators.pattern('^[0-9]*$')]],
      mobilePhoneNumber: [''],
      preferredPhone: [''],
      email: ['', [Validators.maxLength(128), Validators.email]],
      employerName: [''],
      employerCity: ['', [Validators.maxLength(40)]],
      employerZip: ['', [Validators.maxLength(6)]],
      ethnicGroup: [''],
      lookupId: [''],
      donationType: ['', [Validators.required]],
      procedureCode: ['', [Validators.required]],
      physicalId: [''],
      deferral: [[], [Validators.required]],
      deferredThru: [null, [dateFormatValidator(), DateFieldValidationUtility.validDateValidator()]],
      deferralType: ['', [Validators.required]],
      historianId: [''],
      reviewerId: [''],
      equipmentType: [''],
      finalDeferralId: ['', [Validators.required, Validators.pattern('^([0-9]{8}|[Cc][0-9]{8}[Cc])$')]],
    });
  }

  updateFieldStates(): void {
    if (!this.registrationForm) return;

    let firstUnfilledRequiredIdx = this.fieldSequence.length;
    for (let i = 0; i < this.fieldSequence.length; i++) {
      const field = this.fieldSequence[i];
      if (field.required) {
        const control = this.registrationForm.get(field.name);
        if (control?.disabled && this.intlDisabledFields.includes(field.name) && this.hasInternationalAddress()) {
          continue;
        }
        if (control?.disabled && this.isHoldAction() && this.holdSkipFields.includes(field.name)) {
          continue;
        }
        const value = control?.value;
        const hasValue = value !== null && value !== '' && value !== undefined && !(Array.isArray(value) && value.length === 0);
        if (!hasValue || control?.invalid) {
          firstUnfilledRequiredIdx = i;
          break;
        }
      }
    }

    for (let i = 0; i < this.fieldSequence.length; i++) {
      const field = this.fieldSequence[i];
      const control = this.registrationForm.get(field.name);
      if (!control) continue;

      if (this.hasInternationalAddress() && this.intlDisabledFields.includes(field.name)) {
        continue;
      }

      if (field.name === 'employerCity' || field.name === 'employerZip') {
        continue;
      }

      if (field.name === 'employerName') {
        control.enable({ emitEvent: false });
        continue;
      }

      if (this.isExistingDonor() && this.existingDonorLockedFields.includes(field.name)) {
        control.disable({ emitEvent: false });
        continue;
      }

      if (this.isHoldAction() && this.holdSkipFields.includes(field.name)) {
        continue;
      }

      if (field.name === 'deferredThru' && this.registrationForm.get('deferralType')?.value === 'IND') {
        control.disable({ emitEvent: false });
        continue;
      }

      const enableOptionalWithPrev = !field.required && i > 0 && i <= firstUnfilledRequiredIdx + 1;
      if (i <= firstUnfilledRequiredIdx || enableOptionalWithPrev) {
        control.enable({ emitEvent: false });
      } else {
        control.disable({ emitEvent: false });
      }
    }
    this.cdr.markForCheck();
  }

  onFieldComplete(): void {
    this.updateFieldStates();
  }

  onSelectFieldComplete(fieldName: string): void {
    this.onFieldComplete();
    const ctrl = this.registrationForm.get(fieldName);
    if (ctrl && !ctrl.invalid) {
      this.focusNextRequiredField(fieldName);
    }
  }

  private readonly selfValidatedFields = [
    'lastName', 'firstName', 'dob', 'weight',
    'alternateId', 'homePhoneNumber', 'workPhoneNumber', 'mobilePhoneNumber',
    'zip',
    'sex', 'ethnicGroup', 'donationType', 'procedureCode', 'deferral',
    'deferralType', 'lookupId', 'physicalId', 'historianId', 'reviewerId',
    'equipmentType', 'alternateType', 'city',
  ];

  onFormKeydown(event: KeyboardEvent): void {
    if (!(event.key === 'Enter' || (event.key === 'Tab' && !event.shiftKey))) return;

    const target = event.target as HTMLElement;
    const fieldName = this.getFieldNameFromTarget(target);
    if (!fieldName) return;
    if (!this.fieldSequence.some(f => f.name === fieldName)) return;

    if (fieldName === 'deferralId' || fieldName === 'finalDeferralId') return;
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

    // Special handling for address fields - don't skip optional apartmentNo
    const addressSequenceFields = ['homeAddress', 'apartmentNo', 'city'];
    const isInAddressSequence = addressSequenceFields.includes(currentFieldName);

    // Special handling for work phone -> extension sequence
    const contactSequenceFields = ['workPhoneNumber', 'extension'];
    const isInContactSequence = contactSequenceFields.includes(currentFieldName);

    for (let i = currentIdx + 1; i < this.fieldSequence.length; i++) {
      const field = this.fieldSequence[i];
      const control = this.registrationForm.get(field.name);
      if (!control || control.disabled) continue;

      // If we're in address sequence, focus next field in sequence even if optional
      if (isInAddressSequence && addressSequenceFields.includes(field.name)) {
        this.focusField(field.name);
        return;
      }

      // If we're in contact sequence, focus extension after work phone
      if (isInContactSequence && contactSequenceFields.includes(field.name)) {
        this.focusField(field.name);
        return;
      }

      // Otherwise, only focus if required and empty
      if (!field.required) continue;
      const value = control.value;
      if (value === null || value === '' || value === undefined || (Array.isArray(value) && value.length === 0)) {
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

  private getActiveField(): string | null {
    for (const field of this.fieldSequence) {
      const control = this.registrationForm.get(field.name);
      if (!control || control.disabled) continue;
      if (this.hasInternationalAddress() && this.intlDisabledFields.includes(field.name)) continue;
      if (!field.required) continue;
      const value = control.value;
      if (value === null || value === '' || value === undefined || (Array.isArray(value) && value.length === 0) || control.invalid) {
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
      this.registrationForm.get(field.name)?.enable({ emitEvent: false });
    });
  }

  private loadLookupData(): void {
    const driveValues = this.driveForm.value;
    const driveDate = this.formatDateForApi(driveValues.driveDate);
    if (driveDate) {
      this.deferralService.getEmployees(driveDate)
        .pipe(takeUntil(this.destroy$))
        .subscribe((data) => { this.employees.set(data); this.filteredEmployees.set(data); });
    }

    this.deferralService.getDonationTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => { this.donationTypes.set(data); this.filteredDonationTypes.set(data); });

    this.deferralService.getEquipmentTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => { this.equipmentTypes.set(data); this.filteredEquipmentTypes.set(data); });

    this.deferralService.getEthnicGroups()
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => { this.ethnicGroups.set(data); this.filteredEthnicGroups.set(data); });

    this.deferralService.getEthnicRequired()
      .pipe(takeUntil(this.destroy$))
      .subscribe((required) => {
        this.isEthnicRequired.set(required);
        const ctrl = this.registrationForm.get('ethnicGroup');
        const fieldDef = this.fieldSequence.find(f => f.name === 'ethnicGroup');
        if (required) {
          ctrl?.addValidators(Validators.required);
          if (fieldDef) fieldDef.required = true;
        } else {
          ctrl?.removeValidators(Validators.required);
          if (fieldDef) fieldDef.required = false;
        }
        ctrl?.updateValueAndValidity({ emitEvent: false });
      });

    this.deferralService.getEmployers()
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => this.filteredEmployers.set(data));

    this.deferralService.getInterdictions()
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => this.interdictionCodes.set(data));

    this.deferralService.getAlternateIdTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => { this.alternateIdTypes.set(data); this.filteredAlternateIdTypes.set(data); });
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.deferralService.clearCaches();
        this.minDate = this.getChapterMinDate();
        this.chapterMaxDate = this.getChapterMinDate();
        this.loadLookupData();
        this.resetForm();
      });
  }

  private setupDriveDateChange(): void {
    this.driveForm.get('driveDate')?.valueChanges
      .pipe(
        distinctUntilChanged((prev, curr) => {
          if (!prev && !curr) return true;
          if (!prev || !curr) return false;
          return moment(prev).format('YYYY-MM-DD') === moment(curr).format('YYYY-MM-DD');
        }),
        takeUntil(this.destroy$),
      )
      .subscribe((dateValue) => {
        if (!dateValue) {
          this.driveDateDoubleEntry = 'idle';
          this.pendingDriveDate = null;
          this.lastConfirmedDriveDate = null;
          this.drives.set([]);
          this.filteredDrives.set([]);
          const driveIdCtrl = this.driveForm.get('driveId');
          driveIdCtrl?.setValue('');
          driveIdCtrl?.markAsUntouched();
          this.driveName.set('--');
          if (this.showRegistrationForm()) {
            this.showRegistrationForm.set(false);
            this.resetRegistrationState();
          }
          return;
        }
      });
  }

  onDriveDateChange(event: { value: Moment | null }): void {
    const dateValue = event.value;
    if (!dateValue || !moment.isMoment(dateValue) || !dateValue.isValid()) {
      this.driveDateDoubleEntry = 'idle';
      this.pendingDriveDate = null;
      return;
    }

    const formatted = dateValue.format('YYYY-MM-DD');
    const driveDateCtrl = this.driveForm.get('driveDate');

    if (formatted === this.lastConfirmedDriveDate) {
      return;
    }

    if (this.driveDateDoubleEntry === 'idle') {
      if (this.lastConfirmedDriveDate && this.showRegistrationForm()) {
        this.showRegistrationForm.set(false);
        this.resetRegistrationState();
      }
      this.drives.set([]);
      this.filteredDrives.set([]);
      const driveIdCtrl = this.driveForm.get('driveId');
      driveIdCtrl?.setValue('');
      driveIdCtrl?.markAsUntouched();
      this.driveName.set('--');
      this.pendingDriveDate = formatted;
      this.driveDateDoubleEntry = 'pending';
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
        this.minDeferredThruDate.set(dateValue);
        this.loadDrivesForDate(dateValue);
      } else {
        this.driveDateDoubleEntry = 'idle';
        this.pendingDriveDate = null;
        this.driveDatePicker?.close();
        const msg = 'Drive Date did not match. Please try again.';
        driveDateCtrl?.setValue(null, { emitEvent: false });
        driveDateCtrl?.setErrors({ serverError: msg });
        driveDateCtrl?.markAsTouched();
      }
      this.cdr.markForCheck();
    }
  }

  private loadDrivesForDate(dateValue: Moment | Date | string): void {
    const formattedDate = this.formatDateForApi(dateValue);

    this.isLoading.set(true);
    this.cdr.markForCheck();
    this.driveForm.get('driveId')?.setValue('');
    this.driveName.set('--');

    this.deferralService.getDrives(formattedDate)
      .pipe(takeUntil(this.destroy$), finalize(() => { this.isLoading.set(false); this.cdr.markForCheck(); }))
      .subscribe({
        next: (data) => {
          this.drives.set(data);
          this.filteredDrives.set(data);
          this.cdr.markForCheck();
        },
        error: () => this.showError('Failed to retrieve drives'),
      });
  }

  private setupDriveSearch(): void {
    this.driveSearchControl.valueChanges
      .pipe(debounceTime(200), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((search) => {
        const term = (search ?? '').toLowerCase();
        this.filteredDrives.set(
          this.drives().filter(
            (d) =>
              d.driveId.toLowerCase().includes(term) ||
              d.sponsorName.toLowerCase().includes(term)
          )
        );
      });
  }

  private setupEmployerSearch(): void {
    this.employerSearchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((search) => {
        this.deferralService.getEmployers(search || undefined)
          .pipe(takeUntil(this.destroy$))
          .subscribe((data) => {
            this.filteredEmployers.set(data);
          });
      });
  }

  private setupZipLookup(): void {
    this.registrationForm.get('zip')?.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300),
        distinctUntilChanged(),
        tap((zip) => {
          const zipVal = (zip || '').toString().trim();
          if (!zipVal) {
            this.cityOptions.set([]);
            this.zipOptions.set([]);
            this.validCityZips = [];
            this.stateDisplay.set('--');
            const rawCity = this.registrationForm.get('city')?.value;
            const city = (typeof rawCity === 'string' ? rawCity : rawCity?.city || '').trim().toUpperCase();
            if (city.length >= 3) {
              this.deferralService.getZipsByCity(city)
                .pipe(takeUntil(this.destroy$))
                .subscribe(zips => {
                  if (zips.length > 0) {
                    this.zipOptions.set(zips);
                    this.validCityZips = zips.map(z => z.code);
                  }
                  this.cdr.markForCheck();
                });
            }
            this.cdr.markForCheck();
          }
        }),
        filter((zip) => !!zip && (zip || '').toString().trim().length === 5),
        switchMap((zip) => this.deferralService.getZipLookup((zip || '').toString().trim()))
      )
      .subscribe(results => {
        const zipControl = this.registrationForm.get('zip');
        this.zipOptions.set([]);
        if (results.length > 0) {
          zipControl?.setErrors(null);
          const uniqueCities = results.reduce((acc, r) => {
            if (!acc.some(c => c.city === r.city)) {
              acc.push({ city: r.city, state: r.state, uspsId: r.uspsId ?? null });
            }
            return acc;
          }, [] as { city: string; state: string; uspsId: number | null }[]);

          this.validCityZips = results.map(r => r.zip);

          if (uniqueCities.length === 1) {
            this.cityOptions.set([]);
            this.isSettingCityFromZip = true;
            this.registrationForm.patchValue({
              city: uniqueCities[0].city,
            }, { emitEvent: false });
            this.selectedCityName.set(uniqueCities[0].city);
            this.stateDisplay.set(uniqueCities[0].state || '--');
            this.selectedUspsId.set(uniqueCities[0].uspsId);
            setTimeout(() => this.isSettingCityFromZip = false, 0);
          } else {
            this.registrationForm.patchValue({ city: '' }, { emitEvent: false });
            this.selectedCityName.set('');
            this.stateDisplay.set(results[0].state || '--');
            this.cityOptions.set(uniqueCities);
          }
        } else {
          this.cityOptions.set([]);
          this.validCityZips = [];
          this.registrationForm.patchValue({ city: '' }, { emitEvent: false });
          this.selectedCityName.set('');
          this.stateDisplay.set('--');
          zipControl?.setErrors({ invalidZip: true });
          zipControl?.markAsTouched();
        }
        this.cdr.markForCheck();
      });
  }

  private setupCityToZipLookup(): void {
    this.registrationForm.get('city')?.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300),
        distinctUntilChanged(),
        filter(() => !this.isSettingCityFromZip),
        map((value: string | { city: string }) => typeof value === 'string' ? value : value?.city || ''),
        filter((city: string) => !!city && city.trim().length >= 3),
        switchMap((city: string) => this.deferralService.getZipsByCity(city.trim().toUpperCase()))
      )
      .subscribe(results => {
        if (results.length > 0) {
          this.validCityZips = results.map(z => z.code);
          const currentZip = (this.registrationForm.get('zip')?.value || '').toString().trim();
          if (currentZip && !this.validCityZips.includes(currentZip)) {
            this.registrationForm.patchValue({ zip: '' }, { emitEvent: false });
            this.registrationForm.get('zip')?.setErrors(null);
            this.stateDisplay.set('--');
          }
          this.zipOptions.set(results);
          this.registrationForm.get('city')?.setErrors(null);
        } else {
          this.zipOptions.set([]);
          this.validCityZips = [];
        }
        this.cdr.markForCheck();
      });
  }

  onCityBlur(): void {
    const rawCity = this.registrationForm.get('city')?.value;
    const city = (typeof rawCity === 'string' ? rawCity : rawCity?.city || '').trim().toUpperCase();
    if (city && city.length > 0) {
      this.registrationForm.patchValue({ city }, { emitEvent: false });
      this.validateCity(city);
    } else {
      this.zipOptions.set([]);
      this.validCityZips = [];
      this.stateDisplay.set('--');
      this.registrationForm.get('city')?.setErrors(null);
      this.cdr.markForCheck();
    }
  }

  onCityEnter(event: Event): void {
    event.preventDefault();
    const rawCity = this.registrationForm.get('city')?.value;
    const city = (typeof rawCity === 'string' ? rawCity : rawCity?.city || '').trim().toUpperCase();
    if (!city) return;
    this.registrationForm.patchValue({ city }, { emitEvent: false });
    this.validateCity(city);
  }

  private validateCity(city: string): void {
    this.deferralService.getZipsByCity(city)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (zips) => {
          if (zips.length > 0) {
            this.registrationForm.get('city')?.setErrors(null);
            this.validCityZips = zips.map(z => z.code);
            const currentZip = (this.registrationForm.get('zip')?.value || '').toString().trim();
            if (currentZip && !this.validCityZips.includes(currentZip)) {
              this.registrationForm.patchValue({ zip: '' }, { emitEvent: false });
              this.registrationForm.get('zip')?.setErrors(null);
              this.stateDisplay.set('--');
            }
            this.zipOptions.set(zips);
          } else {
            this.registrationForm.get('city')?.setErrors({ invalidCity: true });
            this.validCityZips = [];
            this.zipOptions.set([]);
            this.stateDisplay.set('--');
          }
          this.cdr.markForCheck();
        },
        error: () => {
          this.registrationForm.get('city')?.setErrors({ invalidCity: true });
          this.validCityZips = [];
          this.zipOptions.set([]);
          this.stateDisplay.set('--');
          this.cdr.markForCheck();
        },
      });
  }

  validateZip(): void {
    const zipCtrl = this.registrationForm.get('zip');
    const zip = (zipCtrl?.value || '').trim();
    if (!zip) return;
    if (this.validCityZips.length > 0 && !this.validCityZips.includes(zip)) {
      zipCtrl?.setErrors({ invalidZipCity: true });
      zipCtrl?.markAsTouched();
    } else if (zipCtrl?.hasError('invalidZipCity')) {
      zipCtrl?.setErrors(null);
    }
    this.cdr.markForCheck();
  }

  onCitySelected(option: { city: string; state: string; uspsId: number | null }): void {
    this.selectedCityName.set(option.city);
    this.selectedUspsId.set(option.uspsId);
    this.stateDisplay.set(option.state || '--');
    this.registrationForm.patchValue({ city: option.city }, { emitEvent: false });
    this.cityOptions.set([]);
    this.updateFieldStates();
    this.cdr.markForCheck();
  }

  onZipOptionSelected(option: { code: string; description: string }): void {
    const parts = option.description.split(' - ');
    const state = parts.length > 1 ? parts[1].trim() : '';
    this.registrationForm.patchValue({ zip: option.code }, { emitEvent: false });
    this.stateDisplay.set(state || '--');
    this.validCityZips = [option.code];
    this.deferralService.getZipLookup(option.code)
      .pipe(takeUntil(this.destroy$))
      .subscribe(results => {
        if (results.length > 1) {
          const uniqueCities = results.reduce((acc, r) => {
            if (!acc.some(c => c.city === r.city)) {
              acc.push({ city: r.city, state: r.state, uspsId: r.uspsId ?? null });
            }
            return acc;
          }, [] as { city: string; state: string; uspsId: number | null }[]);
          this.cityOptions.set(uniqueCities);
        } else {
          this.cityOptions.set([]);
        }
        this.cdr.markForCheck();
      });
  }

  private setupEmployerCitySearch(): void {
    this.employerCitySearchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((search) => {
        if (search && search.length >= 3) {
          this.deferralService.getCities(search)
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

  onEmployerCitySelected(cityName: string): void {
    if (!cityName) {
      this.employerStateDisplay.set('--');
      this.selectedEUspsId.set(null);
      return;
    }

    // Find the selected city from the filtered list
    const city = this.filteredEmployerCities().find((c) => c.city === cityName);
    if (city) {
      this.employerStateDisplay.set(city.state || '--');
      this.selectedEUspsId.set(city.uspsId ?? null);
      this.registrationForm.patchValue({ employerZip: city.zip }, { emitEvent: false });
    }
  }

  onEmployerSelected(employerId: string): void {
    if (!employerId) {
      this.selectedEmployerId.set(null);
      this.registrationForm.patchValue({ employerCity: '', employerZip: '' }, { emitEvent: false });
      this.registrationForm.get('employerCity')?.enable({ emitEvent: false });
      this.registrationForm.get('employerZip')?.enable({ emitEvent: false });
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
      this.registrationForm.patchValue({ employerCity: '', employerZip: '' }, { emitEvent: false });
      this.employerStateDisplay.set('--');
      this.selectedEUspsId.set(null);
    } else {
      this.employerIntlAddress.set(null);
      this.selectedEUspsId.set(employer.uspsId ?? null);
      if (employer.city) {
        this.filteredEmployerCities.set([{
          uspsId: employer.uspsId ?? 0,
          city: employer.city,
          state: employer.state || '',
          zip: employer.zip || '',
        }]);
      }
      this.registrationForm.patchValue({
        employerCity: employer.city || '',
        employerZip: employer.zip || '',
      }, { emitEvent: false });
      this.employerStateDisplay.set(employer.state || '--');
      this.registrationForm.get('employerCity')?.disable({ emitEvent: false });
      this.registrationForm.get('employerZip')?.disable({ emitEvent: false });
    }
    this.cdr.markForCheck();
  }

  onEmployerZipBlur(): void {
    const zip = this.registrationForm.get('employerZip')?.value?.trim();
    if (!zip) {
      this.employerStateDisplay.set('--');
      return;
    }
    const city = this.registrationForm.get('employerCity')?.value;
    if (!city) return;

    this.deferralService.getZipLookup(zip)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (results) => {
          const match = results.find((r) => r.city === city);
          if (match) {
            this.employerStateDisplay.set(match.state || '--');
            this.selectedEUspsId.set(match.uspsId ?? null);
          } else if (results.length > 0) {
            this.employerStateDisplay.set(results[0].state || '--');
            this.selectedEUspsId.set(results[0].uspsId ?? null);
          }
          this.cdr.markForCheck();
        },
        error: () => {},
      });
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
        this.showSuccess(result.message || 'Employer created successfully');
        dialogRef.close();

        const searchTerm = result.employerName?.substring(0, 3) || '';
        if (searchTerm) {
          this.deferralService.getEmployers(searchTerm)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (employers) => {
                this.filteredEmployers.set(employers);
                if (result.employerId) {
                  this.registrationForm.patchValue({ employerName: result.employerId });
                  this.selectedEmployerId.set(result.employerId);
                  this.onEmployerSelected(result.employerId);
                }
                this.cdr.markForCheck();
              },
              error: () => this.filteredEmployers.set([]),
            });
        }
      });

    dialogRef.componentInstance.close
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        dialogRef.close();
      });
  }

  private setupAlternateTypeSearch(): void {
    this.alternateTypeSearchControl.valueChanges
      .pipe(debounceTime(200), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((search) => {
        const term = (search ?? '').toLowerCase();
        this.filteredAlternateIdTypes.set(
          this.alternateIdTypes().filter((t) => t.description.toLowerCase().includes(term) || t.code.toLowerCase().includes(term))
        );
      });
  }

  private setupEthnicGroupSearch(): void {
    this.ethnicGroupSearchControl.valueChanges
      .pipe(debounceTime(200), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((search) => {
        const term = (search ?? '').toLowerCase();
        this.filteredEthnicGroups.set(
          this.ethnicGroups().filter((g) => g.description.toLowerCase().includes(term) || g.code.toLowerCase().includes(term))
        );
      });
  }

  private setupDonationTypeSearch(): void {
    this.donationTypeSearchControl.valueChanges
      .pipe(debounceTime(200), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((search) => {
        const term = (search ?? '').toLowerCase();
        this.filteredDonationTypes.set(
          this.donationTypes().filter((t) => t.description.toLowerCase().includes(term) || t.donationType.toLowerCase().includes(term))
        );
      });
  }

  private setupProcedureCodeSearch(): void {
    this.procedureCodeSearchControl.valueChanges
      .pipe(debounceTime(200), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((search) => {
        const term = (search ?? '').toLowerCase();
        this.filteredProcedureCodes.set(
          this.procedureCodes().filter((c) => c.procedureCode.toLowerCase().includes(term))
        );
      });
  }

  private setupDeferralReasonSearch(): void {
    this.deferralReasonSearchControl.valueChanges
      .pipe(debounceTime(200), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((search) => {
        const term = (search ?? '').toLowerCase();
        this.filteredDeferralReasons.set(
          this.deferralReasons().filter((r) => r.reasonCode.toLowerCase().includes(term))
        );
      });
  }

  private setupStaffSearch(): void {
    this.staffSearchControl.valueChanges
      .pipe(debounceTime(200), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((search) => {
        const term = (search ?? '').toLowerCase();
        this.filteredEmployees.set(
          this.employees().filter((e) => e.fullName.toLowerCase().includes(term) || e.staffNo.toLowerCase().startsWith(term))
        );
      });
  }

  private setupEquipmentTypeSearch(): void {
    this.equipmentTypeSearchControl.valueChanges
      .pipe(debounceTime(200), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((search) => {
        const term = (search ?? '').toLowerCase();
        this.filteredEquipmentTypes.set(
          this.equipmentTypes().filter((t) => t.description.toLowerCase().includes(term) || t.code.toLowerCase().includes(term))
        );
      });
  }

  private setupDonationTypeChange(): void {
    this.registrationForm.get('donationType')?.valueChanges
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((donationType) => {
        if (donationType) {
          const driveDate = this.formatDateForApi(this.driveForm.value.driveDate);

          this.deferralService.getProcedureCodes(donationType)
            .pipe(takeUntil(this.destroy$))
            .subscribe((data) => { this.procedureCodes.set(data); this.filteredProcedureCodes.set(data); });

          this.registrationForm.get('deferral')?.setValue([], { emitEvent: false });
          this.deferralService.getDeferralReasons(driveDate, donationType)
            .pipe(takeUntil(this.destroy$))
            .subscribe((data) => {
              const validReasons = data.filter((d) => d.reasonCode !== '0' && !d.reasonCode.endsWith(','));
              this.deferralReasons.set(validReasons);
              this.filteredDeferralReasons.set(validReasons);
              this.cdr.markForCheck();
            });
        } else {
          this.procedureCodes.set([]);
          this.filteredProcedureCodes.set([]);
          this.deferralReasons.set([]);
          this.filteredDeferralReasons.set([]);
        }
      });
  }

  private syncMobileToAltAddress(): void {
    this.registrationForm.get('mobilePhoneNumber')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        const alt = this.pendingAltAddress();
        if (alt) {
          const digits = (value || '').replace(/\D/g, '');
          this.pendingAltAddress.set({ ...alt, mobilePhoneNumber: digits || null });
        }
      });
  }

  onRetrieveDrives(): void {
    if (this.driveForm.invalid) {
      this.driveForm.markAllAsTouched();
      return;
    }

    this.initializeRegistrationIfNeeded();
    this.resetRegistrationState();
    this.updateFieldStates();
    this.driveRetrieved.set(true);
    this.showRegistrationForm.set(true);
    this.pageHeaderConfig = this.pageHeaderConfigWithBack;
    this.cdr.markForCheck();
    setTimeout(() => {
      document.getElementById('deferralIdInput')?.focus();
      this.setupSectionObserver();
    }, 100);
  }

  private initializeRegistrationIfNeeded(): void {
    if (this.formInitialized) return;

    this.initRegistrationForm();
    this.registrationForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => { this.hasUnsavedChanges = true; });
    this.loadLookupData();
    this.setupEmployerSearch();
    this.setupZipLookup();
    this.setupCityToZipLookup();
    this.setupEmployerCitySearch();
    this.setupAlternateTypeSearch();
    this.setupEthnicGroupSearch();
    this.setupDonationTypeSearch();
    this.setupProcedureCodeSearch();
    this.setupDeferralReasonSearch();
    this.setupStaffSearch();
    this.setupEquipmentTypeSearch();
    this.setupDonationTypeChange();
    this.syncMobileToAltAddress();
    this.updateFieldStates();
    this.formInitialized = true;
  }

  onDriveSelected(driveId: string): void {
    const selected = this.drives().find((d) => d.driveId === driveId);
    if (selected) {
      this.driveName.set(selected.sponsorName);
    }
    if (this.showRegistrationForm()) {
      this.showRegistrationForm.set(false);
      this.resetRegistrationState();
    }
  }

  onDeferralIdInput(): void {
    const ctrl = this.registrationForm.get('deferralId');
    const value = ctrl?.value || '';
    if (this.deferralIdCharCount === 0 || value.length === 1) {
      this.deferralIdInputStartTime = Date.now();
    }
    this.deferralIdCharCount = value.length;
  }

  private wasScannedInput(): boolean {
    if (this.deferralIdCharCount < 8) return false;
    if (this.deferralIdInputStartTime === 0) return true;
    const elapsed = Date.now() - this.deferralIdInputStartTime;
    const msPerChar = elapsed / this.deferralIdCharCount;
    return msPerChar < this.SCAN_SPEED_THRESHOLD_MS;
  }

  onDeferralIdEntered(): void {
    if (this.isFindDonorOpen) return;
    const ctrl = this.registrationForm.get('deferralId');
    const deferralId = ctrl?.value?.trim();
    if (!deferralId) return;
    if (ctrl?.invalid) return;

    const normalizedId = normalizeDeferralId(deferralId);
    if (!normalizedId) {
      ctrl?.setErrors({ serverError: 'Invalid Deferral ID' });
      ctrl?.markAsTouched();
      return;
    }

    if (normalizedId === this.initialDeferralId) {
      if (!this.donorId() && !this.newDonorExpected) {
        this.openFindDonorDialog();
      }
      return;
    }

    if (this.wasScannedInput() && this.deferralIdDoubleEntry === 'idle') {
      if (this.initialDeferralId) {
        this.resetRegistrationState();
        this.updateFieldStates();
      }
      ctrl?.setValue(normalizedId!, { emitEvent: false });
      this.deferralIdCharCount = 0;
      this.deferralIdInputStartTime = 0;
      this.validateAndProcessDeferralId(normalizedId!);
      this.cdr.markForCheck();
      return;
    }

    if (this.deferralIdDoubleEntry === 'idle') {
      if (this.initialDeferralId) {
        this.resetRegistrationState();
        this.updateFieldStates();
      }
      this.pendingDeferralId = normalizedId;
      this.deferralIdDoubleEntry = 'pending';
      ctrl?.setValue('', { emitEvent: false });
      ctrl?.markAsUntouched();
      this.deferralIdCharCount = 0;
      this.deferralIdInputStartTime = 0;
      this.cdr.markForCheck();
      return;
    }

    if (this.deferralIdDoubleEntry === 'pending') {
      if (normalizedId === this.pendingDeferralId) {
        this.deferralIdDoubleEntry = 'idle';
        ctrl?.setValue(normalizedId!, { emitEvent: false });
        this.pendingDeferralId = null;
        this.validateAndProcessDeferralId(normalizedId!);
      } else {
        this.deferralIdDoubleEntry = 'idle';
        this.pendingDeferralId = null;
        const msg = 'Deferral ID did not match. Please try again.';
        ctrl?.setValue('', { emitEvent: false });
        ctrl?.setErrors({ serverError: msg });
        ctrl?.markAsTouched();
      }
      this.deferralIdCharCount = 0;
      this.deferralIdInputStartTime = 0;
      this.cdr.markForCheck();
    }
  }

  private validateAndProcessDeferralId(deferralId: string): void {
    this.deferralService.validateDeferralId(deferralId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          if (result?.item?.isValid === false) {
            const code = result.errorCode;
            const msg = result.message || 'This Deferral ID already exists in the system';
            const errorMsg = code ? `Error ${code}: ${msg}` : msg;
            this.showError(errorMsg);
            const deferralCtrl = this.registrationForm.get('deferralId');
            deferralCtrl?.setValue('');
            deferralCtrl?.setErrors({ serverError: msg });
            deferralCtrl?.markAsTouched();
            this.deferralIdDoubleEntry = 'idle';
            this.cdr.markForCheck();
            return;
          }
          const normalizedId = result?.validatedDeferralId || deferralId;
          const deferralCtrl = this.registrationForm.get('deferralId');
          if (normalizedId !== deferralId) {
            deferralCtrl?.setValue(normalizedId, { emitEvent: false });
          }
          this.initialDeferralId = normalizedId;
          this.isDeferralIdValid.set(true);
          this.openFindDonorDialog();
        },
        error: (error) => {
          const message = error?.error?.errorResponse?.error || error?.error?.error || error?.error?.message || 'Failed to validate Deferral ID';
          const deferralCtrl = this.registrationForm.get('deferralId');
          deferralCtrl?.setValue('');
          deferralCtrl?.setErrors({ serverError: message });
          deferralCtrl?.markAsTouched();
          this.deferralIdDoubleEntry = 'idle';
          this.cdr.markForCheck();
        },
      });
  }

  onDeferralIdEnter(event: Event): void {
    event.preventDefault();
    this.registrationForm.get('deferralId')?.markAsTouched();
    this.onDeferralIdEntered();
  }

  onDeferralIdTab(event: Event): void {
    const ctrl = this.registrationForm.get('deferralId');
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

  private openFindDonorDialog(): void {
    this.isFindDonorOpen = true;
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
        programName: 'DRIREDEF',
        searchOnOpen: this.initialDeferralId ? { unitId: this.initialDeferralId } : undefined,
      } as FindDonorDialogData,
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result: FindDonorDialogResult) => {
        if (!result) {
          this.isFindDonorOpen = false;
          return;
        }

        if (result.action === 'select' && result.donor) {
          this.populateDonorData(result.donor.donorId!, result.donor.aboRh);
        } else if (result.action === 'new') {
          this.populateNewDonorFields(result.newData);
          this.isFindDonorOpen = false;
        } else if (result.action === 'hold') {
          this.handleHoldAction(result.donor, result.searchCriteria);
        } else if (result.action === 'cancel') {
          this.registrationForm.get('deferralId')?.setValue('');
          this.initialDeferralId = '';
          this.isDeferralIdValid.set(false);
          this.isFindDonorOpen = false;
        }
        this.cdr.markForCheck();
      });
  }

  private handleHoldAction(donor?: FindDonorResult, searchCriteria?: FindDonorSearchCriteria): void {
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
      this.scrollToSection('donation-info');
      setTimeout(() => this.focusField('lookupId'), 100);
    }, 300);
  }

  private readonly holdSkipFields = [
    'lastName', 'lastNameSuffix', 'firstName', 'middleName',
    'dob', 'sex', 'weight', 'alternateId', 'alternateType',
    'homeAddress', 'apartmentNo', 'city', 'zip',
    'homePhoneNumber', 'workPhoneNumber', 'mobilePhoneNumber', 'preferredPhone', 'email',
    'idQueue', 'employerName', 'employerCity', 'employerZip', 'ethnicGroup',
  ];

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

  private enableDonorFields(): void {
    if (!this.registrationForm) return;
    for (const field of this.holdSkipFields) {
      if (field === 'employerCity' || field === 'employerZip') continue;
      this.registrationForm.get(field)?.enable({ emitEvent: false });
    }
  }

  private populateDonorData(donorId: string, aboRh?: string | null): void {
    this.donorId.set(donorId);
    this.newDonorExpected = null;
    this.isLoading.set(true);

    this.deferralService.checkOnlineDonation(donorId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          if (result?.hasOnlineRegistration) {
            this.isLoading.set(false);
            this.dialog.open(ConfirmActionDialogComponent, {
              width: '450px',
              disableClose: true,
              data: {
                title: 'Online Registration Found',
                message: 'This donor has an existing online registration. Do you want to continue? The existing online registration will be removed.',
                confirmText: 'YES, CONTINUE',
                cancelText: 'NO, CANCEL'
              }
            }).afterClosed()
              .pipe(takeUntil(this.destroy$))
              .subscribe((confirmed) => {
                if (confirmed) {
                  this.loadDonorDataAfterCheck(donorId, aboRh);
                } else {
                  this.donorId.set('');
                  this.isFindDonorOpen = false;
                  this.cdr.markForCheck();
                }
              });
          } else {
            this.loadDonorDataAfterCheck(donorId, aboRh);
          }
        },
        error: () => {
          this.loadDonorDataAfterCheck(donorId, aboRh);
        },
      });
  }

  private loadDonorDataAfterCheck(donorId: string, aboRh?: string | null): void {
    this.isLoading.set(true);
    this.deferralService.getDonor(donorId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (donor) => {
          this.registrationForm.patchValue({
            lastName: donor.lastName,
            lastNameSuffix: donor.lastNameSuffix,
            firstName: donor.firstName,
            middleName: donor.middleName,
            dob: donor.dateOfBirth ? moment(donor.dateOfBirth) : null,
            sex: donor.gender,
            weight: donor.donorWeight,
            alternateId: donor.alternateId,
            alternateType: donor.alternateIdType,
          });
          this.aboDescription.set(donor.aboDescription || aboRh || '--');
          this.findDonorValues = {
            lastName: donor.lastName,
            firstName: donor.firstName,
            dateOfBirth: donor.dateOfBirth,
            gender: donor.gender,
            alternateId: donor.alternateId,
            alternateIdType: donor.alternateIdType,
          };
          this.isExistingDonor.set(true);
          this.lockExistingDonorFields();
          this.loadDonorAddress(donorId);
        },
        error: () => {
          this.isLoading.set(false);
          this.showError('Failed to load donor data');
        },
      });
  }

  private populateNewDonorFields(newData?: FindDonorNewData): void {
    this.donorId.set('');
    this.aboDescription.set('--');
    this.findDonorValues = null;
    this.newDonorExpected = newData ?? null;
    this.unlockExistingDonorFields();
    this.enableAllFields();
    this.updateFieldStates();
    this.focusNextRequiredField('deferralId');
  }

  private loadDonorAddress(donorId: string): void {
    this.deferralService.getDonorAddress(donorId)
      .pipe(takeUntil(this.destroy$), finalize(() => {
        this.isLoading.set(false);
        this.updateFieldStates();
        this.focusNextRequiredField('deferralId');
        setTimeout(() => { this.isFindDonorOpen = false; });
      }))
      .subscribe({
        next: (address) => {
          this.selectedUspsId.set(address.uspsId ?? null);
          this.selectedEUspsId.set(address.eUspsId ?? null);
          this.selectedEmployerId.set(address.employerId ?? null);
          if ((address.intlAddrFlag ?? 'N') === 'Y') {
            this.donorIntlAddress.set({
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
            });
            if (address.eCity) {
              this.filteredEmployerCities.set([{ uspsId: address.eUspsId ?? 0, city: address.eCity, state: address.eState || '', zip: address.eZip || '' }]);
            }
            this.registrationForm.patchValue({
              employerName: address.employerId,
              employerCity: address.eCity,
              employerZip: address.eZip,
            });
            this.stateDisplay.set('--');
            this.employerStateDisplay.set(address.eState || '--');
            this.disableAddressFields();
            this.updateFieldStates();
            this.focusField('ethnicGroup');
          } else {
            if (address.city) {
              this.isSettingCityFromZip = true;
              this.selectedCityName.set(address.city);
              this.selectedUspsId.set(address.uspsId ?? null);
              this.cityOptions.set([]);
              setTimeout(() => this.isSettingCityFromZip = false, 0);
            }
            if (address.eCity) {
              this.filteredEmployerCities.set([{ uspsId: address.eUspsId ?? 0, city: address.eCity, state: address.eState || '', zip: address.eZip || '' }]);
            }
            this.registrationForm.patchValue({
              homeAddress: address.streetName,
              apartmentNo: address.suiteApt,
              city: address.city || '',
              zip: address.zip,
              homePhoneNumber: this.formatPhone(address.hAreaCode, address.hPhoneNo),
              workPhoneNumber: this.formatPhone(address.dAreaCode, address.dPhoneNo),
              extension: address.extension || '',
              mobilePhoneNumber: this.formatPhone(address.mAreaCode, address.mPhoneNo),
              email: address.email,
              employerName: address.employerId,
              employerCity: address.eCity,
              employerZip: address.eZip,
            }, { emitEvent: false });
            this.stateDisplay.set(address.state || '--');
            this.employerStateDisplay.set(address.eState || '--');

            if (address.preferredContactFlag === 'H') {
              this.registrationForm.patchValue({ preferredPhone: 'home' });
            } else if (address.preferredContactFlag === 'W') {
              this.registrationForm.patchValue({ preferredPhone: 'work' });
            } else if (address.preferredContactFlag === 'M') {
              this.registrationForm.patchValue({ preferredPhone: 'mobile' });
            }
          }

          if ((address.empIntlAddrFlag ?? 'N') === 'Y') {
            this.employerIntlAddress.set({
              streetName: address.empIntlCity ?? '',
              addr1: address.empIntlState ?? null,
              addr2: null,
              addr3: null,
              country: address.empIntlCountryName ?? '',
              postalCode: address.empIntlPostalCode ?? null,
              intlAddrFlag: 'Y',
            });
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
        },
        error: () => this.showError('Failed to load donor address'),
      });
  }

  openInternationalAddress(target: 'donor' | 'employer'): void {
    const existingAddress = target === 'donor'
      ? this.donorIntlAddress()
      : this.employerIntlAddress();

    if (target === 'donor' && !existingAddress) {
      const hasLocalAddress = !!(
        this.registrationForm.get('homeAddress')?.value?.trim() ||
        this.registrationForm.get('city')?.value?.trim() ||
        this.registrationForm.get('zip')?.value?.trim()
      );

      if (hasLocalAddress) {
        this.dialog.open(ConfirmActionDialogComponent, {
          width: '400px',
          disableClose: true,
          data: {
            title: 'Local Address Populated',
            message: 'Local address is already populated. Switching to international address will clear the domestic address fields. Do you want to proceed?',
            confirmText: 'PROCEED',
            cancelText: 'CANCEL',
          },
        }).afterClosed()
          .pipe(takeUntil(this.destroy$))
          .subscribe((confirmed: boolean) => {
            if (confirmed) {
              this.saveLocalAddressFields();
              this.disableAddressFields();
              this.openDonorInternationalAddressDialog(existingAddress);
            }
          });
        return;
      }
    }

    if (target === 'employer' && !existingAddress) {
      const hasEmployerAddress = !!(
        this.registrationForm.get('employerName')?.value?.trim() ||
        this.registrationForm.get('employerCity')?.value?.trim() ||
        this.registrationForm.get('employerZip')?.value?.trim()
      );

      if (hasEmployerAddress) {
        this.dialog.open(ConfirmActionDialogComponent, {
          width: '400px',
          disableClose: true,
          data: {
            title: 'Employer Address Populated',
            message: 'Employer address is already populated. Switching to international address will clear the employer address fields. Do you want to proceed?',
            confirmText: 'PROCEED',
            cancelText: 'CANCEL',
          },
        }).afterClosed()
          .pipe(takeUntil(this.destroy$))
          .subscribe((confirmed: boolean) => {
            if (confirmed) {
              this.saveEmployerAddressFields();
              this.disableEmployerFields();
              this.openEmployerInternationalAddressDialog(null);
            }
          });
        return;
      }
    }

    if (target === 'donor') {
      this.disableAddressFields();
      this.openDonorInternationalAddressDialog(existingAddress);
    } else {
      this.disableEmployerFields();
      this.openEmployerInternationalAddressDialog(existingAddress);
    }
  }

  private openDonorInternationalAddressDialog(existingAddress: InternationalAddressModel | null): void {
    const dialogRef = this.dialog.open(InternationalAddressDialogComponent, {
      width: '600px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      position: { right: '0', top: '64px' },
      panelClass: 'code-dialog-panel-right',
      hasBackdrop: true,
      backdropClass: 'code-dialog-backdrop',
      data: {
        existingAddress,
        targetTable: null,
      },
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result: InternationalAddressModel | null | undefined) => {
        if (result) {
          this.donorIntlAddress.set(result);
          this.savedLocalAddress = null;
          this.updateFieldStates();
        } else if (result === null) {
          this.donorIntlAddress.set(null);
          this.savedLocalAddress = null;
          this.enableAddressFields();
        } else if (!existingAddress) {
          this.restoreLocalAddressFields();
        }
        this.focusActiveField();
      });
  }

  private openEmployerInternationalAddressDialog(existingAddress: InternationalAddressModel | null): void {
    // InternationalAddressModel reuses generic field names (streetName, addr1) that map to
    // employer-specific semantics (city, state). This is intentional — the reverse mapping
    // in the afterClosed subscriber below must stay in sync.
    const existingEmployerAddr: EmployerIntlAddressResult | null = existingAddress
      ? {
          city: existingAddress.streetName ?? '',
          state: existingAddress.addr1 ?? null,
          postalCode: existingAddress.postalCode ?? null,
          country: existingAddress.country ?? '',
          intlAddrFlag: existingAddress.intlAddrFlag ?? 'Y',
          modifiedFlag: 'N',
        }
      : null;

    const dialogRef = this.dialog.open(EmployerIntlAddressDialogComponent, {
      width: '600px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      position: { right: '0', top: '64px' },
      panelClass: 'code-dialog-panel-right',
      hasBackdrop: true,
      backdropClass: 'code-dialog-backdrop',
      data: { existingAddress: existingEmployerAddr },
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result: EmployerIntlAddressResult | null | undefined) => {
        if (result) {
          this.employerIntlAddress.set({
            streetName: result.city,
            addr1: result.state ?? null,
            addr2: null,
            addr3: null,
            country: result.country,
            postalCode: result.postalCode ?? null,
            intlAddrFlag: 'Y',
          });
          this.savedEmployerAddress = null;
        } else if (result === null) {
          this.employerIntlAddress.set(null);
          this.savedEmployerAddress = null;
          this.enableEmployerFields();
        } else if (!existingAddress) {
          this.restoreEmployerAddressFields();
        }
        this.focusActiveField();
      });
  }

  openAlternateAddress(): void {
    const donorId = this.donorId();
    const pending = this.pendingAltAddress();

    const preferred = this.registrationForm.get('preferredPhone')?.value || '';
    const preferredContactPhoneMap: Record<string, string> = { home: 'H', work: 'W', mobile: 'M' };
    const preferredContactPhone = preferredContactPhoneMap[preferred] || null;

    if (donorId && !pending) {
      this.altDemoService.getByDonorId(donorId)
        .pipe(takeUntil(this.destroy$))
        .subscribe(existing => this.openAltAddressDialog(existing ?? undefined));
    } else if (pending) {
      const existingData = { ...pending, preferredContactPhone: preferredContactPhone ?? pending.preferredContactPhone };
      this.openAltAddressDialog(existingData);
    } else {
      const mobileRaw = (this.registrationForm.get('mobilePhoneNumber')?.value || '').trim();
      let existingData: AlternateDemographicsModel | undefined;
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
      this.openAltAddressDialog(existingData);
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
          const mobileCtrl = this.registrationForm.get('mobilePhoneNumber');
          mobileCtrl?.setValue('');
          mobileCtrl?.setErrors(null);
          this.cdr.markForCheck();
        } else if (result && typeof result === 'object') {
          const altData = result as AlternateDemographicsModel;
          this.pendingAltAddress.set(altData);

          const mobileCtrl = this.registrationForm.get('mobilePhoneNumber');
          if (altData.mobilePhoneNumber) {
            mobileCtrl?.setValue(altData.mobilePhoneNumber);
            this.validatePhone('mobilePhoneNumber', 'Mobile Phone');
          } else {
            mobileCtrl?.setValue('');
            mobileCtrl?.setErrors(null);
          }
          this.cdr.markForCheck();
        }
        this.focusActiveField();
      });
  }

  openHoldsDialog(): void {
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

  private readonly existingDonorLockedFields = ['lastName', 'firstName', 'dob', 'sex'];

  private lockExistingDonorFields(): void {
    this.existingDonorLockedFields.forEach((f) =>
      this.registrationForm.get(f)?.disable({ emitEvent: false })
    );
  }

  private unlockExistingDonorFields(): void {
    this.isExistingDonor.set(false);
    this.existingDonorLockedFields.forEach((f) =>
      this.registrationForm.get(f)?.enable({ emitEvent: false })
    );
  }

  private disableAddressFields(): void {
    this.hasInternationalAddress.set(true);
    this.intlDisabledFields.forEach((f) => {
      const ctrl = this.registrationForm.get(f);
      ctrl?.setValue('', { emitEvent: false });
      ctrl?.disable({ emitEvent: false });
    });
    this.stateDisplay.set('--');

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
  }

  private enableAddressFields(): void {
    this.hasInternationalAddress.set(false);
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
  }

  private disableEmployerFields(): void {
    this.registrationForm.patchValue({ employerCity: '', employerZip: '' }, { emitEvent: false });
    this.employerStateDisplay.set('--');
    this.selectedEUspsId.set(null);
  }

  private enableEmployerFields(): void {
    this.registrationForm.get('employerName')?.enable({ emitEvent: false });
    this.registrationForm.get('employerCity')?.enable({ emitEvent: false });
    this.registrationForm.get('employerZip')?.enable({ emitEvent: false });
  }

  private saveLocalAddressFields(): void {
    this.savedLocalAddress = {
      homeAddress: this.registrationForm.get('homeAddress')?.value ?? '',
      apartmentNo: this.registrationForm.get('apartmentNo')?.value ?? '',
      city: this.registrationForm.get('city')?.value ?? '',
      zip: this.registrationForm.get('zip')?.value ?? '',
      homePhoneNumber: this.registrationForm.get('homePhoneNumber')?.value ?? '',
      workPhoneNumber: this.registrationForm.get('workPhoneNumber')?.value ?? '',
      mobilePhoneNumber: this.registrationForm.get('mobilePhoneNumber')?.value ?? '',
      email: this.registrationForm.get('email')?.value ?? '',
      stateDisplay: this.stateDisplay(),
    };
  }

  private restoreLocalAddressFields(): void {
    this.enableAddressFields();
    if (this.savedLocalAddress) {
      const { stateDisplay, ...formValues } = this.savedLocalAddress;
      this.registrationForm.patchValue(formValues, { emitEvent: false });
      this.stateDisplay.set(stateDisplay || '--');
      this.savedLocalAddress = null;
    }
  }

  private saveEmployerAddressFields(): void {
    this.savedEmployerAddress = {
      employerName: this.registrationForm.get('employerName')?.value ?? '',
      employerCity: this.registrationForm.get('employerCity')?.value ?? '',
      employerZip: this.registrationForm.get('employerZip')?.value ?? '',
      employerStateDisplay: this.employerStateDisplay(),
      cityDisabled: this.registrationForm.get('employerCity')?.disabled ?? false,
      zipDisabled: this.registrationForm.get('employerZip')?.disabled ?? false,
    };
  }

  private restoreEmployerAddressFields(): void {
    this.enableEmployerFields();
    if (this.savedEmployerAddress) {
      const { employerStateDisplay, cityDisabled, zipDisabled, ...formValues } = this.savedEmployerAddress;
      this.registrationForm.patchValue(formValues, { emitEvent: false });
      this.employerStateDisplay.set(employerStateDisplay || '--');
      if (cityDisabled) {
        this.registrationForm.get('employerCity')?.disable({ emitEvent: false });
      }
      if (zipDisabled) {
        this.registrationForm.get('employerZip')?.disable({ emitEvent: false });
      }
      this.savedEmployerAddress = null;
    }
  }

  onlyNumbers(event: KeyboardEvent): void {
    const charCode = event.key.charCodeAt(0);
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
      return;
    }
    const input = event.target as HTMLInputElement;
    const currentValue = input.value?.toString() || '';
    if (currentValue.length >= 6) {
      event.preventDefault();
    }
  }

  onPasteNumbers(event: ClipboardEvent): void {
    event.preventDefault();
    const text = event.clipboardData?.getData('text') ?? '';
    const numericOnly = text.replace(/[^0-9]/g, '').substring(0, 6);
    if (numericOnly) {
      document.execCommand('insertText', false, numericOnly);
    }
  }

  uppercaseInput(fieldName: string): void {
    const ctrl = this.registrationForm.get(fieldName);
    if (!ctrl) return;
    const value = ctrl.value;
    if (value && typeof value === 'string') {
      const uppercased = value.toUpperCase();
      if (value !== uppercased) {
        ctrl.setValue(uppercased, { emitEvent: false });
      }
    }
  }

  // --- Field match validations (error 16007) ---
  // SELECT flow: validate against findDonorValues, reset to donor value on mismatch
  // NEW flow: validate against newDonorExpected, show error but let user correct

  validateLastName(): void {
    const ctrl = this.registrationForm.get('lastName');
    const entered = ctrl?.value?.trim();
    if (!entered) return;

    if (this.findDonorValues) {
      if (entered !== this.findDonorValues.lastName) {
        this.showError('Error 16007: Last Name does not match the donor record');
        ctrl?.setValue(this.findDonorValues.lastName);
      }
    } else if (this.newDonorExpected?.lastName) {
      if (entered.toLowerCase() !== this.newDonorExpected.lastName.toLowerCase()) {
        const msg = 'Last Name does not match Find Donor entry';
        ctrl?.setErrors({ serverError: msg });
        ctrl?.markAsTouched();
        this.cdr.markForCheck();
        return;
      }
    }
    this.advanceFromField('lastName');
  }

  validateFirstName(): void {
    const ctrl = this.registrationForm.get('firstName');
    const entered = ctrl?.value?.trim();
    if (!entered) return;

    if (this.findDonorValues) {
      if (entered !== this.findDonorValues.firstName) {
        this.showError('Error 16007: First Name does not match the donor record');
        ctrl?.setValue(this.findDonorValues.firstName);
      }
    } else if (this.newDonorExpected?.firstName) {
      if (entered.toLowerCase() !== this.newDonorExpected.firstName.toLowerCase()) {
        const msg = 'First Name does not match Find Donor entry';
        ctrl?.setErrors({ serverError: msg });
        ctrl?.markAsTouched();
        this.cdr.markForCheck();
        return;
      }
    }
    this.advanceFromField('firstName');
  }

  validateDob(): void {
    const ctrl = this.registrationForm.get('dob');
    const entered = ctrl?.value;
    if (!entered) { this.validateDobAge(); return; }
    const enteredStr = moment.isMoment(entered) ? entered.format('YYYY-MM-DD') : '';

    if (this.findDonorValues?.dateOfBirth) {
      const expectedStr = moment(this.findDonorValues.dateOfBirth).format('YYYY-MM-DD');
      if (enteredStr && enteredStr !== expectedStr) {
        this.showError('Error 16007: Date of Birth does not match the donor record');
        ctrl?.setValue(moment(this.findDonorValues.dateOfBirth));
      }
    } else if (this.newDonorExpected?.dob) {
      const expectedStr = moment(this.newDonorExpected.dob).format('YYYY-MM-DD');
      if (enteredStr && enteredStr !== expectedStr) {
        const msg = 'Date of Birth does not match Find Donor entry';
        ctrl?.setErrors({ serverError: msg });
        ctrl?.markAsTouched();
        this.cdr.markForCheck();
        return;
      }
    }
    this.validateDobAge();
    this.advanceFromField('dob');
  }

  validateGender(): void {
    const ctrl = this.registrationForm.get('sex');
    const entered = ctrl?.value;
    if (!entered) return;

    if (this.findDonorValues) {
      if (entered !== this.findDonorValues.gender) {
        this.showError('Error 16007: Sex does not match the donor record');
        ctrl?.setValue(this.findDonorValues.gender);
      }
    } else if (this.newDonorExpected?.sex) {
      const normalize = (v: string) => v.trim().toLowerCase();
      if (normalize(entered) !== normalize(this.newDonorExpected.sex)) {
        const msg = 'Sex does not match Find Donor entry';
        ctrl?.setErrors({ serverError: msg });
        ctrl?.markAsTouched();
        this.cdr.markForCheck();
        return;
      }
    }
    this.advanceFromField('sex');
  }

  private setFieldMismatchError(ctrl: ReturnType<FormGroup['get']>, fieldName: string): void {
    ctrl?.setErrors({ donorMismatch: true });
    ctrl?.markAsTouched();
    this.updateFieldStates();
    this.cdr.markForCheck();
    setTimeout(() => {
      const el = document.querySelector(`[formControlName="${fieldName}"]`) as HTMLElement;
      el?.focus();
    }, 50);
  }

  advanceFromField(fieldName: string): void {
    this.updateFieldStates();
    const ctrl = this.registrationForm.get(fieldName);
    if (ctrl && !ctrl.invalid) {
      this.focusNextRequiredField(fieldName);
    }
  }

  validateAlternateId(): void {
    if (this.findDonorValues?.alternateId) {
      const entered = this.registrationForm.get('alternateId')?.value?.trim();
      if (entered && entered !== this.findDonorValues.alternateId) {
        this.showError('Error 16007: Alternate ID does not match the donor record');
        this.registrationForm.get('alternateId')?.setValue(this.findDonorValues.alternateId);
      }
    }
    this.advanceFromField('alternateId');
  }

  validateAlternateIdType(): void {
    if (this.findDonorValues?.alternateIdType) {
      const entered = this.registrationForm.get('alternateType')?.value;
      if (entered && entered !== this.findDonorValues.alternateIdType) {
        this.showError('Error 16007: Alternate ID Type does not match the donor record');
        this.registrationForm.get('alternateType')?.setValue(this.findDonorValues.alternateIdType);
      }
    }
  }

  // --- DOB age limit (error 16053) ---

  private validateDobAge(): void {
    const ctrl = this.registrationForm.get('dob');
    const dob = ctrl?.value;
    if (!dob) return;
    const dobMoment = moment.isMoment(dob) ? dob : moment(dob);
    const monthsDiff = moment().diff(dobMoment, 'months');
    if (monthsDiff > 1500) {
      const msg = 'Date of Birth results in age greater than 125 years';
      ctrl?.setValue(null);
      ctrl?.setErrors({ serverError: msg });
      ctrl?.markAsTouched();
      this.cdr.markForCheck();
      return;
    }

    const dobStr = dobMoment.format('YYYY-MM-DD');
    this.deferralService.checkAgeLimits(dobStr)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {},
        error: (err) => {
          const message = err?.error?.message || 'Age limit check failed';
          const isWarning = err?.error?.data === true;
          if (isWarning) {
            this.dialog.open(ConfirmActionDialogComponent, {
              width: '400px',
              disableClose: true,
              data: {
                title: 'Age Limit Warning',
                message: message,
                confirmText: 'PROCEED',
                cancelText: 'STOP'
              }
            }).afterClosed()
              .pipe(takeUntil(this.destroy$))
              .subscribe((confirmed) => {
                if (!confirmed) {
                  ctrl?.setValue(null);
                  ctrl?.markAsTouched();
                  this.focusField('dob');
                  this.cdr.markForCheck();
                }
              });
          }
        },
      });
  }

  // --- Deferred thru >= drive date (error 16050) ---

  validateDeferredThruDate(): void {
    const deferredThru = this.registrationForm.get('deferredThru')?.value;
    if (!deferredThru) return;
    const driveDate = this.driveForm.get('driveDate')?.value;
    if (!driveDate) return;

    const deferredMoment = moment.isMoment(deferredThru) ? deferredThru : moment(deferredThru);
    const driveMoment = moment.isMoment(driveDate) ? driveDate : moment(driveDate);

    if (deferredMoment.isBefore(driveMoment, 'day')) {
      const msg = 'Deferred Thru date cannot be before Drive Date';
      const ctrl = this.registrationForm.get('deferredThru');
      ctrl?.setValue(null);
      this.updateFieldStates();
      ctrl?.setErrors({ serverError: msg });
      ctrl?.markAsTouched();
      this.focusField('deferredThru');
      this.cdr.markForCheck();
    }
  }

  onDeferredThruInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value, this.registrationForm.get('deferredThru')
    );
  }

  onDeferredThruBlur(event: FocusEvent): void {
    const input = event.target as HTMLInputElement;
    const raw = input?.value?.trim();
    if (!raw) return;
    const ctrl = this.registrationForm.get('deferredThru');

    const match = raw.match(/^(\d{1,2})([A-Za-z]{3})(\d{4})$/);
    if (match) {
      const formatted = `${match[1].padStart(2, '0')}-${match[2].toUpperCase()}-${match[3]}`;
      const parsed = moment(formatted, 'DD-MMM-YYYY', true);
      if (parsed.isValid()) {
        ctrl?.setValue(parsed);
        input.value = formatted;
        this.validateDeferredThruDate();
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

  // --- Deferral type IND + deferred_thru conflict (error 16179) ---

  validateDeferralType(): void {
    const deferralType = this.registrationForm.get('deferralType')?.value;
    const deferredThruCtrl = this.registrationForm.get('deferredThru');
    const deferredThru = deferredThruCtrl?.value;

    if (deferralType === 'IND' && deferredThru) {
      const msg = 'Cannot have both a through-date and indefinite deferral type';
      const ctrl = this.registrationForm.get('deferralType');
      ctrl?.setValue('');
      this.updateFieldStates();
      ctrl?.setErrors({ serverError: msg });
      ctrl?.markAsTouched();
      this.focusField('deferralType');
      this.cdr.markForCheck();
      return;
    }

    if (deferralType === 'IND') {
      deferredThruCtrl?.setValue(null);
      deferredThruCtrl?.disable();
    } else {
      deferredThruCtrl?.enable();
    }

    this.advanceFromField('deferralType');
  }

  // --- Phone format validation (error 16054) ---

  validatePhone(fieldName: string, label: string): void {
    const value = this.registrationForm.get(fieldName)?.value?.trim();
    if (!value) { this.advanceFromField(fieldName); return; }
    const digitsOnly = value.replace(/\D/g, '');
    if (digitsOnly.length > 0 && (digitsOnly.length !== 7 && digitsOnly.length !== 10 || parseInt(digitsOnly, 10) <= 0)) {
      const msg = `${label} must be a valid 7 or 10-digit phone number`;
      const ctrl = this.registrationForm.get(fieldName);
      ctrl?.setValue('');
      this.updateFieldStates();
      ctrl?.setErrors({ serverError: msg });
      ctrl?.markAsTouched();
      this.focusField(fieldName);
      this.cdr.markForCheck();
      return;
    }
    this.formatPhoneDisplay(fieldName);
    if (fieldName === 'mobilePhoneNumber') {
      const alt = this.pendingAltAddress();
      if (alt) {
        this.pendingAltAddress.set({ ...alt, mobilePhoneNumber: value || null });
      }
    }
    if (digitsOnly.length === 10) {
      this.validatePhoneAreaCode(fieldName);
    } else {
      this.advanceFromField(fieldName);
    }
  }

  private validatePhoneAreaCode(fieldName: string): void {
    const ctrl = this.registrationForm.get(fieldName);
    if (!ctrl?.value) return;

    const digits = (ctrl.value || '').replace(/\D/g, '');
    if (digits.length !== 10) return;

    const areaCode = digits.substring(0, 3);
    this.deferralService.validateAreaCode(areaCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe(valid => {
        if (!valid) {
          ctrl.setErrors({ ...ctrl.errors, areaCodeNotFound: true });
          ctrl.markAsTouched();
          this.focusField(fieldName);
          this.cdr.markForCheck();
        } else {
          if (ctrl.errors?.['areaCodeNotFound']) {
            const { areaCodeNotFound, ...rest } = ctrl.errors;
            ctrl.setErrors(Object.keys(rest).length ? rest : null);
          }
          this.advanceFromField(fieldName);
        }
      });
  }

  // --- Server-side field validations ---

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
    return this.formatDateForApi(this.driveForm.get('driveDate')?.value);
  }

  validateDonationTypeField(): void {
    const value = this.registrationForm.get('donationType')?.value;
    if (!value) return;
    this.advanceFromField('donationType');
  }

  validateProcedureCodeField(): void {
    const value = this.registrationForm.get('procedureCode')?.value;
    if (!value) return;
    this.advanceFromField('procedureCode');
  }

  validateDeferralReasonField(): void {
    const ctrl = this.registrationForm.get('deferral');
    const value = ctrl?.value;
    if (!value || (Array.isArray(value) && value.length === 0)) return;

    const values = Array.isArray(value) ? value : [value];
    if (values.includes('0') || values.some((v: string) => v.endsWith(','))) {
      const errorMessage = "Deferral reason cannot be '0' or end with a comma";
      ctrl?.setValue([]);
      ctrl?.setErrors({ serverError: errorMessage });
      ctrl?.markAsTouched();
      this.cdr.markForCheck();
      return;
    }

    this.advanceFromField('deferral');
  }

  validateEquipmentTypeField(): void {
    const value = this.registrationForm.get('equipmentType')?.value;
    if (!value) return;
    this.validateField('equipmentType', this.deferralService.validateEquipmentTypeField(value));
  }

  validateEthnicGroupField(): void {
    const value = this.registrationForm.get('ethnicGroup')?.value;
    if (!value) return;
    this.validateField('ethnicGroup', this.deferralService.validateEthnicGroupField(value));
  }

  validateAlternateIdTypeField(): void {
    const value = this.registrationForm.get('alternateType')?.value;
    if (!value) return;
    this.validateField('alternateType', this.deferralService.validateAlternateIdTypeField(value));
  }

  validateStaffField(fieldName: string): void {
    const value = this.registrationForm.get(fieldName)?.value;
    if (!value) return;

    // Skip validation for '99' (Unknown) - this is a valid system value
    if (value === '99') {
      this.advanceFromField(fieldName);
      return;
    }

    this.validateField(fieldName, this.deferralService.validateStaff(value, this.getDriveDateForApi()));
  }

  validateCityField(): void {
    const cityName = this.selectedCityName();
    if (!cityName) return;
    this.validateField('city', this.deferralService.validateCityField(cityName));
  }

  validateZipField(): void {
    const zip = this.registrationForm.get('zip')?.value?.trim();
    if (!zip) return;
    const cityName = this.selectedCityName();
    if (!cityName) return;
    this.validateField('zip', this.deferralService.validateZipCityField(cityName, zip));
  }

  scrollToSection(sectionId: ContentSection): void {
    this.isScrollingProgrammatically = true;
    this.activeSection.set(sectionId);
    this.cdr.markForCheck();

    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => { this.isScrollingProgrammatically = false; }, 800);
    } else {
      this.isScrollingProgrammatically = false;
    }
  }

  private setupSectionObserver(): void {
    if (!this.scrollContainer?.nativeElement) return;

    const container = this.scrollContainer.nativeElement;
    const onScroll = () => {
      if (this.isScrollingProgrammatically) return;

      const containerTop = container.getBoundingClientRect().top;
      let current: ContentSection = this.contentSections[0].id;

      for (const section of this.contentSections) {
        const el = document.getElementById(section.id);
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

  onFinalDeferralIdEntered(): void {
    if (this.isLoading()) return;
    const ctrl = this.registrationForm.get('finalDeferralId');
    if (ctrl?.disabled) return;
    const finalDeferralId = ctrl?.value?.trim();
    if (!finalDeferralId) return;

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
        ctrl?.setValue(normalizedFinal!, { emitEvent: false });

        if (normalizedFinal !== this.initialDeferralId) {
          const msg = 'Final Deferral ID does not match the initial Deferral ID';
          ctrl?.setErrors({ serverError: msg });
          ctrl?.markAsTouched();
          this.cdr.markForCheck();
          this.clearFormForNext();
          setTimeout(() => document.getElementById('deferralIdInput')?.focus(), 150);
          return;
        }

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

  onSubmit(): void {
    this.enableAllFields();
    this.registrationForm.markAllAsTouched();
    if (this.registrationForm.invalid) {
      this.updateFieldStates();
      this.showError('Please fill all required fields');
      return;
    }

    this.isLoading.set(true);
    const f = this.registrationForm.getRawValue();
    const driveValues = this.driveForm.value;

    if (this.isHoldAction()) {
      this.submitHoldRequest(f, driveValues);
      return;
    }

    const request = {
      driveId: driveValues.driveId,
      //driveDate: moment.isMoment(driveValues.driveDate)
      //  ? driveValues.driveDate.format('YYYY-MM-DD')
      //  : driveValues.driveDate,
      driveDate: this.formatDateForApi(driveValues.driveDate),
      deferralId: f.deferralId,
      setId: this.setId(),
      idQueue: f.idQueue || '',
      donor: {
        donorId: this.donorId(),
        lastName: (f.lastName || '').toUpperCase(),
        lastNameSuffix: f.lastNameSuffix,
        firstName: (f.firstName || '').toUpperCase(),
        middleName: (f.middleName || '').toUpperCase(),
        dateOfBirth: DateFieldValidationUtility.serializeDateForApi(f.dob) ?? '',
        gender: f.sex,
        donorWeight: f.weight,
        bloodType: '',
        aboDescription: this.aboDescription(),
        status: '',
        scanId: '',
        alternateId: f.alternateId,
        alternateIdType: f.alternateType,
        ethnicGroup: f.ethnicGroup,
        programId: '',
        chapterId: this.headerService.getCurrentChapterId(),
      },
      address: this.buildAddressPayload(f),
      donation: {
        lookupId: f.lookupId,
        donationType: f.donationType,
        procedureCode: f.procedureCode,
        physicalId: f.physicalId === '99' ? '' : f.physicalId,
        deferralReason: Array.isArray(f.deferral) ? f.deferral.join(',') : f.deferral,
        deferredThruDate: DateFieldValidationUtility.serializeDateForApi(f.deferredThru) ?? '',
        deferralType: f.deferralType,
        screenerId: f.historianId === '99' ? '' : f.historianId,
        firstReviewerId: f.reviewerId === '99' ? '' : f.reviewerId,
        equipType: f.equipmentType,
        deferralId: f.finalDeferralId || f.deferralId,
        transactionId: '',
        creditSponsor: '',
        donorId: this.donorId(),
        driveId: driveValues.driveId,
        programId: '',
        chapterId: this.headerService.getCurrentChapterId(),
        collDate: '',
        setId: this.setId(),
        bagType: '',
        creditCount: 0,
        startDataEntryTime: '',
        endDataEntryTime: '',
      },
      interdictions: this.buildInterdictionsPayload(f),
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
      loggedInUserName: this.loginService.getStoredUsername() || '',
      chapterId: this.headerService.getCurrentChapterId(),
    };

    this.deferralService.registerDeferral(request)
      .pipe(takeUntil(this.destroy$), finalize(() => { this.isLoading.set(false); this.cdr.markForCheck(); }))
      .subscribe({
        next: (result) => {
          this.transactionId.set(result.transactionId);
          if (result.setId && !this.setId()) {
            this.setId.set(result.setId);
          }
          this.registrationTotal.update((t) => t + 1);
          this.hasUnsavedChanges = false;
          this.showSuccess('Deferral registered successfully');
          this.cdr.markForCheck();
          setTimeout(() => this.clearFormForNext(), 1000);
        },
        error: (err) => {
          const body = err?.error;
          const code = body?.errorResponse?.errorCode;
          const msg = body?.errorResponse?.error || body?.message || 'Failed to register deferral';
          this.showError(code ? `Error ${code}: ${msg}` : msg);
          const finalCtrl = this.registrationForm.get('finalDeferralId');
          finalCtrl?.enable({ emitEvent: false });
          finalCtrl?.setValue('', { emitEvent: false });
          this.finalDeferralIdDoubleEntry = 'idle';
          this.lastConfirmedFinalDeferralId = null;
          this.updateFieldStates();
        },
      });
  }

  private submitHoldRequest(f: Record<string, any>, driveValues: Record<string, any>): void { // eslint-disable-line @typescript-eslint/no-explicit-any
    const criteria = this.holdSearchCriteria;

    const request: RegisterHoldRequest = {
      driveId: driveValues['driveId'],
      driveDate: this.formatDateForApi(driveValues['driveDate']),
      deferralId: f['deferralId'],
      setId: this.setId(),
      sessionId: '',
      donation: {
        lookupId: f['lookupId'] || '',
        donationType: f['donationType'],
        procedureCode: f['procedureCode'],
        physicalId: f['physicalId'] === '99' ? '' : (f['physicalId'] || ''),
        deferralReason: Array.isArray(f['deferral']) ? f['deferral'].join(',') : f['deferral'],
        deferredThruDate: DateFieldValidationUtility.serializeDateForApi(f['deferredThru']) ?? '',
        deferralType: f['deferralType'],
        screenerId: f['historianId'] === '99' ? '' : (f['historianId'] || ''),
        firstReviewerId: f['reviewerId'] === '99' ? '' : (f['reviewerId'] || ''),
        equipType: f['equipmentType'] || '',
        deferralId: f['finalDeferralId'] || f['deferralId'],
        creditSponsor: '',
      },
      lastName: (criteria?.lastName || f['lastName'] || '').toUpperCase(),
      firstName: (criteria?.firstName || f['firstName'] || '').toUpperCase(),
      dateOfBirth: criteria?.dob || (DateFieldValidationUtility.serializeDateForApi(f['dob']) ?? ''),
      gender: criteria?.sex || f['sex'] || '',
    };

    this.deferralService.registerHold(request)
      .pipe(takeUntil(this.destroy$), finalize(() => { this.isLoading.set(false); this.cdr.markForCheck(); }))
      .subscribe({
        next: (result) => {
          this.transactionId.set(result.transactionId);
          this.registrationTotal.update((t) => t + 1);
          this.hasUnsavedChanges = false;
          this.showSuccess(`Hold registered successfully. Transaction ID: ${result.transactionId}`);
          this.cdr.markForCheck();
          setTimeout(() => this.clearFormForNext(), 1000);
        },
        error: (err) => {
          const body = err?.error;
          const code = body?.errorResponse?.errorCode;
          const msg = body?.errorResponse?.error || body?.message || 'Failed to register hold';
          this.showError(code ? `Error ${code}: ${msg}` : msg);
          const finalCtrl = this.registrationForm.get('finalDeferralId');
          finalCtrl?.enable({ emitEvent: false });
          finalCtrl?.setValue('', { emitEvent: false });
          this.finalDeferralIdDoubleEntry = 'idle';
          this.lastConfirmedFinalDeferralId = null;
          this.updateFieldStates();
        },
      });
  }

  private buildInterdictionsPayload(f: Record<string, any>): InterdictionItem[] { // eslint-disable-line @typescript-eslint/no-explicit-any
    const interdictions: InterdictionItem[] = [];

    // Add DRDEF interdiction based on selected deferral reason
    const deferralReason = f['deferral'];
    const deferralReasonStr = Array.isArray(deferralReason) ? deferralReason.join(',') : deferralReason;
    if (deferralReasonStr) {
      interdictions.push({
        interCode: 'DRDEF',
        interType: 'DEFER',
        description: `Deferral: ${deferralReasonStr}`,
        comments: '',
        transactionId: '',
        termDate: '',
        releaseDate: '',
        releaseUser: '',
        programId: '',
        chapterId: this.headerService.getCurrentChapterId(),
        collDate: '',
      });
    }

    // Add manual holds
    const manualHolds = this.pendingHolds().map(hold => ({
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
    }));

    return [...interdictions, ...manualHolds];
  }

  private buildAddressPayload(f: Record<string, any>): DonorAddress { // eslint-disable-line @typescript-eslint/no-explicit-any
    const intlAddr = this.donorIntlAddress();
    const hasIntl = this.hasInternationalAddress();
    const homePhone = this.parsePhone(f['homePhoneNumber']);
    const workPhone = this.parsePhone(f['workPhoneNumber']);
    const mobilePhone = this.parsePhone(f['mobilePhoneNumber']);
    const pref = f['preferredPhone'];
    const altAddr = this.pendingAltAddress();
    const altMobile = altAddr?.mobilePhoneNumber ? this.parsePhone(altAddr.mobilePhoneNumber) : null;
    const finalMobileAreaCode = altMobile ? altMobile.areaCode : (hasIntl ? '' : mobilePhone.areaCode);
    const finalMobilePhoneNo = altMobile ? altMobile.phoneNo : (hasIntl ? '' : mobilePhone.phoneNo);
    const primaryPref = pref === 'home' ? 'H' : pref === 'work' ? 'W' : pref === 'mobile' ? 'M' : '';
    const finalPreferredContact = altAddr?.preferredContactPhone ?? primaryPref;

    return {
      streetName: hasIntl ? '' : (f['homeAddress'] || '').toUpperCase(),
      suiteApt: hasIntl ? '' : (f['apartmentNo'] || '').toUpperCase(),
      city: hasIntl ? '' : (this.selectedCityName() || ''),
      state: hasIntl ? '' : (this.stateDisplay() === '--' ? '' : this.stateDisplay()),
      zip: hasIntl ? '' : (f['zip'] || ''),
      hAreaCode: hasIntl ? '' : homePhone.areaCode,
      hPhoneNo: hasIntl ? '' : homePhone.phoneNo,
      dAreaCode: hasIntl ? '' : workPhone.areaCode,
      dPhoneNo: hasIntl ? '' : workPhone.phoneNo,
      extension: f['extension'] || '',
      mAreaCode: finalMobileAreaCode,
      mPhoneNo: finalMobilePhoneNo,
      email: f['email'] || '',
      preferredContactFlag: finalPreferredContact,
      employerName: f['employerName'] || '',
      employerId: this.selectedEmployerId() || '',
      eCity: f['employerCity'] || '',
      eState: this.employerStateDisplay() === '--' ? '' : this.employerStateDisplay(),
      eZip: f['employerZip'] || '',
      intlAddrFlag: hasIntl ? 'Y' : 'N',
      intlAddress1: intlAddr?.streetName ?? '',
      intlAddress2: intlAddr?.addr1 ?? '',
      intlAddress3: intlAddr?.addr2 ?? '',
      intlAddress4: intlAddr?.addr3 ?? '',
      countryName: intlAddr?.country ?? '',
      intlPostalCode: intlAddr?.postalCode ?? '',
      intlHomePhoneNo: intlAddr?.homePhoneNo ?? '',
      intlWorkPhoneNo: intlAddr?.workPhoneNo ?? '',
      intlWorkPhoneExt: intlAddr?.workPhoneExt ?? '',
      intlMobilePhoneNo: intlAddr?.mobilePhoneNo ?? '',
      intlFaxNo: intlAddr?.faxNo ?? '',
      preferredContactAddrFlag: altAddr?.preferredContactAddress ?? '',
      uspsId: this.selectedUspsId() ?? null,
      eUspsId: this.selectedEUspsId() ?? null,
      addressType: 'RES',
      donorId: this.donorId(),
      programId: '',
      chapterId: this.headerService.getCurrentChapterId(),
      altStreetName: altAddr?.streetName ?? '',
      altSuiteApt: altAddr?.suiteApt ?? '',
      altUspsId: altAddr?.uspsId ?? null,
      altIntlAddress1: altAddr?.intlAddress1 ?? '',
      altIntlAddress2: altAddr?.intlAddress2 ?? '',
      altIntlAddress3: altAddr?.intlAddress3 ?? '',
      altIntlAddress4: altAddr?.intlAddress4 ?? '',
      altCountryName: altAddr?.countryName ?? '',
      altIntlPostalCode: altAddr?.intlPostalCode ?? '',
      altIntlAddrFlag: altAddr?.intlAddrFlag ?? 'N',
      altCity: altAddr?.city ?? '',
      altState: altAddr?.state ?? '',
      altZip: altAddr?.zip ?? '',
      otherContactNo: altAddr?.otherContactNumber ?? '',
      altIntlPhoneNo: altAddr?.altIntlPhoneNumber ?? '',
      empIntlAddrFlag: this.employerIntlAddress()?.intlAddrFlag ?? 'N',
      empIntlCity: this.employerIntlAddress()?.streetName ?? '',
      empIntlState: this.employerIntlAddress()?.addr1 ?? '',
      empIntlPostalCode: this.employerIntlAddress()?.postalCode ?? '',
      empIntlCountryName: this.employerIntlAddress()?.country ?? '',
    };
  }

  private formatPhone(areaCode: string, phoneNo: string): string {
    if (areaCode && phoneNo) {
      const digits = phoneNo.replace(/\D/g, '');
      return `(${areaCode}) ${digits.substring(0, 3)}-${digits.substring(3)}`;
    }
    if (phoneNo) {
      const digits = phoneNo.replace(/\D/g, '');
      if (digits.length === 7) return `${digits.substring(0, 3)}-${digits.substring(3)}`;
      return phoneNo;
    }
    if (areaCode) return areaCode;
    return '';
  }

  private parsePhone(value: string): { areaCode: string; phoneNo: string } {
    if (!value) return { areaCode: '', phoneNo: '' };
    const digits = value.replace(/\D/g, '');
    if (digits.length === 10) return { areaCode: digits.substring(0, 3), phoneNo: digits.substring(3) };
    if (digits.length === 7) return { areaCode: '', phoneNo: digits };
    return { areaCode: '', phoneNo: digits };
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

  clearFormForNext(): void {
    this.unlockExistingDonorFields();
    if (this.hasInternationalAddress()) {
      this.enableAddressFields();
    }
    this.registrationForm.reset();
    this.donorId.set('');
    this.aboDescription.set('--');
    this.transactionId.set('--');
    this.stateDisplay.set('--');
    this.employerStateDisplay.set('--');
    this.initialDeferralId = '';
    this.isDeferralIdValid.set(false);
    this.lastActiveField = null;
    this.procedureCodes.set([]);
    this.donorIntlAddress.set(null);
    this.employerIntlAddress.set(null);
    this.pendingAltAddress.set(null);
    this.pendingHolds.set([]);
    this.isHoldAction.set(false);
    this.holdSearchCriteria = null;
    this.enableDonorFields();
    this.selectedUspsId.set(null);
    this.selectedEUspsId.set(null);
    this.selectedEmployerId.set(null);
    this.cityOptions.set([]);
    this.zipOptions.set([]);
    this.validCityZips = [];
    this.isSettingCityFromZip = false;
    this.deferralIdDoubleEntry = 'idle';
    this.pendingDeferralId = null;
    this.finalDeferralIdDoubleEntry = 'idle';
    this.pendingFinalDeferralId = null;
    this.lastConfirmedFinalDeferralId = null;

    this.findDonorValues = null;
    this.newDonorExpected = null;
    this.hasUnsavedChanges = false;
    this.showRegistrationForm.set(true);
    this.pageHeaderConfig = this.pageHeaderConfigWithBack;
    this.updateFieldStates();
    setTimeout(() => {
      document.getElementById('deferralIdInput')?.focus();
    }, 100);
  }

  private resetRegistrationState(): void {
    if (!this.formInitialized) return;
    this.unlockExistingDonorFields();
    if (this.hasInternationalAddress()) {
      this.enableAddressFields();
    }
    this.registrationForm.reset();
    this.donorId.set('');
    this.aboDescription.set('--');
    this.transactionId.set('--');
    this.stateDisplay.set('--');
    this.employerStateDisplay.set('--');
    this.initialDeferralId = '';
    this.isDeferralIdValid.set(false);
    this.lastActiveField = null;
    this.procedureCodes.set([]);
    this.donorIntlAddress.set(null);
    this.employerIntlAddress.set(null);
    this.pendingAltAddress.set(null);
    this.pendingHolds.set([]);
    this.isHoldAction.set(false);
    this.holdSearchCriteria = null;
    this.enableDonorFields();
    this.deferralIdDoubleEntry = 'idle';
    this.pendingDeferralId = null;
    this.finalDeferralIdDoubleEntry = 'idle';
    this.pendingFinalDeferralId = null;
    this.lastConfirmedFinalDeferralId = null;
    this.isExistingDonor.set(false);
    this.hasInternationalAddress.set(false);
    this.selectedUspsId.set(null);
    this.selectedEUspsId.set(null);
    this.selectedEmployerId.set(null);
    this.cityOptions.set([]);
    this.zipOptions.set([]);
    this.validCityZips = [];
    this.isSettingCityFromZip = false;
    this.findDonorValues = null;
    this.newDonorExpected = null;
    this.hasUnsavedChanges = false;
    this.isFindDonorOpen = false;
  }

  private onBackClick(): void {
    const doExit = () => {
      if (this.registrationTotal() > 0) {
        this.showSuccess(`Batch complete. ${this.registrationTotal()} deferral(s) registered. Batch ID: ${this.setId() || 'N/A'}`);
      }
      this.resetForm();
    };

    if (this.hasUnsavedChanges) {
      this.dialog.open(ConfirmActionDialogComponent, {
        width: '400px',
        disableClose: true,
        data: {
          title: 'Unsaved Changes',
          message: 'You have unsaved changes. Are you sure you want to leave?',
          confirmText: 'YES, LEAVE',
          cancelText: 'STAY'
        }
      }).afterClosed()
        .pipe(takeUntil(this.destroy$))
        .subscribe((confirmed) => {
          if (confirmed) {
            doExit();
          } else {
            this.focusActiveField();
          }
        });
    } else {
      doExit();
    }
  }

  resetForm(): void {
    this.showRegistrationForm.set(false);
    this.pageHeaderConfig = this.defaultPageHeaderConfig;
    this.driveRetrieved.set(false);
    this.driveForm.reset();
    if (this.formInitialized) {
      this.unlockExistingDonorFields();
      this.registrationForm.reset();
    }
    this.drives.set([]);
    this.filteredDrives.set([]);
    this.donorId.set('');
    this.aboDescription.set('--');
    this.driveName.set('--');
    this.transactionId.set('--');
    this.stateDisplay.set('--');
    this.employerStateDisplay.set('--');
    this.registrationTotal.set(0);
    this.setId.set('');
    this.initialDeferralId = '';
    this.isDeferralIdValid.set(false);
    this.donorIntlAddress.set(null);
    this.employerIntlAddress.set(null);
    this.pendingAltAddress.set(null);
    this.pendingHolds.set([]);
    this.isHoldAction.set(false);
    this.holdSearchCriteria = null;
    this.enableDonorFields();
    this.driveDateDoubleEntry = 'idle';
    this.pendingDriveDate = null;
    this.lastConfirmedDriveDate = null;
    this.deferralIdDoubleEntry = 'idle';
    this.pendingDeferralId = null;
    this.finalDeferralIdDoubleEntry = 'idle';
    this.pendingFinalDeferralId = null;
    this.lastConfirmedFinalDeferralId = null;

    this.hasInternationalAddress.set(false);
    this.selectedUspsId.set(null);
    this.selectedEUspsId.set(null);
    this.selectedEmployerId.set(null);
    this.findDonorValues = null;
    this.newDonorExpected = null;
    this.hasUnsavedChanges = false;
  }

  canDeactivate(): boolean {
    return !this.hasUnsavedChanges;
  }

  private getChapterMinDate(): Moment {
    const chapterDate = DateFieldValidationUtility.getMinDate(this.chapterOffset);
    return moment.utc(chapterDate.format('YYYY-MM-DD'), 'YYYY-MM-DD');
  }

  private showSuccess(message: string): void {
    this.snackBar.dismiss();
    const ref = this.snackBar.open(message, 'DISMISS', {
      duration: 8000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar'],
    });
    ref.onAction().subscribe(() => ref.dismiss());
  }

  private showError(message: string): void {
    this.snackBar.dismiss();
    const ref = this.snackBar.open(message, 'DISMISS', {
      duration: 0,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar'],
    });
    ref.onAction().subscribe(() => ref.dismiss());
  }

  private formatDateForApi(date: any): string {
    if (!date) return '';
    const m = moment(date);
    if (!m.isValid()) return '';

    // Format as DDMMYYYY
    const day = m.format('DD');
    const month = m.format('MM'); // Get month abbreviation
    const year = m.format('YYYY');


    return `${month}${day}${year}`;
  }
}
