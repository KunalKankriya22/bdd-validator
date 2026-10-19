import { Component, Inject, OnInit, OnDestroy, inject, signal, Input, Output, EventEmitter, Optional, computed, Injector } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, filter, switchMap, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { DonorDemographicsService } from './services/donor-demographics.service';
import { SidePanelBase } from '@shared/components/side-panel-base/side-panel-base';
import { DialogButton } from '@shared/interfaces/dialog.interface';
import { MessageDialog } from '@shared/components/message-dialog/message-dialog';
import { InternationalAddressDialogComponent } from '@shared/components/international-address-dialog/international-address-dialog.component';
import { InternationalAddressFormComponent } from '@shared/components/international-address-form/international-address-form.component';
import { InternationalAddressService } from '@shared/services/international-address.service';
import { AlternateDemographicsDialogComponent } from '@shared/components/alternate-demographics-dialog/alternate-demographics-dialog.component';
import { MessageDialogData } from '@shared/interfaces/auth.interface';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import {
  DonorDemographicsDto,
  DonorDemographicsDialogData,
  UpdateDonorDemographicsDto,
  MasterCodeOption
} from './models/donor-demographics.model';

@Component({
  selector: 'app-donor-demographics',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    SidePanelBase,
    InternationalAddressFormComponent,
    AlternateDemographicsDialogComponent,
    NgxMatSelectSearchModule
  ],
  templateUrl: './donor-demographics.html',
  styleUrl: './donor-demographics.scss'
})
export class DonorDemographicsComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly demographicsService = inject(DonorDemographicsService);
  readonly intlAddressService = inject(InternationalAddressService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialogRef = inject(MatDialogRef<DonorDemographicsComponent>, { optional: true });
  private readonly destroy$ = new Subject<void>();

  // Signals for state management
  readonly donorData = signal<DonorDemographicsDto | null>(null);
  readonly loading = signal<boolean>(false);
  readonly saving = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly languageOptions = signal<MasterCodeOption[]>([]);
  readonly ethnicityOptions = signal<MasterCodeOption[]>([]);
  readonly salutationOptions = signal<MasterCodeOption[]>([]);
  readonly cityOptions = signal<{ city: string; state: string; uspsId: number | null; county?: string }[]>([]);
  readonly employerCityOptions = signal<{ city: string; state: string; uspsId: number | null }[]>([]);
  readonly heightOptions = signal<MasterCodeOption[]>([]);
  readonly formDirty = signal<boolean>(false);

  // Search controls for searchable dropdowns
  readonly languageSearchCtrl = new FormControl('');
  readonly ethnicitySearchCtrl = new FormControl('');
  readonly salutationSearchCtrl = new FormControl('');
  readonly heightSearchCtrl = new FormControl('');

  // Filtered options
  filteredLanguages: MasterCodeOption[] = [];
  filteredEthnicities: MasterCodeOption[] = [];
  filteredSalutations: MasterCodeOption[] = [];
  filteredHeights: MasterCodeOption[] = [];
  readonly submitted = signal<boolean>(false);

  // Form
  form!: FormGroup;
  private queryModeSnapshot: any = null;
  private pendingNewEmployer = false;
  private matchedEmployerId: string | null = null;

  // Side panel mode inputs
  @Input() inputDonorId?: string;
  @Input() inputReadOnly?: boolean;
  @Input() queryMode = true;
  @Output() closePanelEvent = new EventEmitter<void>();
  @Output() panelWidthChange = new EventEmitter<string>();

  // Mode detection
  readonly isSidePanelMode: boolean;

  // Sub-panel navigation (side panel mode only)
  readonly currentSubPanel = signal<'main' | 'international' | 'alternate'>('main');
  readonly panelTitle = computed(() => {
    switch (this.currentSubPanel()) {
      case 'international': return 'International Address';
      case 'alternate': return 'Alternate Demographics';
      default: return 'Donor Demographics';
    }
  });

  // Side panel footer buttons
  readonly sidePanelButtons = computed<DialogButton[]>(() => [
    { label: 'REDISPLAY', action: 'redisplay', variant: 'secondary', disabled: this.loading() || this.saving() },
    { label: 'CANCEL', action: 'cancel', variant: 'secondary' },
    { label: 'SAVE', action: 'save', variant: 'primary', disabled: this.saving() || !this.formDirty() || (this.readOnly && !this.queryMode) }
  ]);

  // Dialog data
  donorId: string = '';
  readOnly: boolean = false;

  constructor(
    @Optional() @Inject(MAT_DIALOG_DATA) public data: DonorDemographicsDialogData | null
  ) {
    this.isSidePanelMode = !this.dialogRef;
    if (this.data) {
      this.donorId = this.data.donorId;
      this.readOnly = this.data.readOnly || false;
    }
  }

  ngOnInit(): void {
    if (this.isSidePanelMode && this.inputDonorId) {
      this.donorId = this.inputDonorId;
      this.readOnly = this.inputReadOnly ?? false;
    }

    this.initForm();
    this.loadMasterCodes();
    this.loadDemographics();
    this.setupPreferredContactValidation();
    this.setupCityClearsFields();
    this.setupZipLookup();
    this.setupPhoneClearUnchecksPreferred();
    this.setupEmployerNameClearsFields();
    this.setupEmployerCityClearsFields();
    this.setupEmployerZipLookup();
    this.setupExtensionValidation();
    this.setupFormDirtyTracking();
    this.setupDropdownSearch();
  }

  private setupFormDirtyTracking(): void {
    this.form.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        filter(() => this.form.dirty)
      )
      .subscribe(() => {
        this.formDirty.set(true);
      });
  }

  private setupDropdownSearch(): void {
    this.filteredHeights = [...this.heightOptions()];

    this.languageSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(search => {
      const s = (search || '').toLowerCase();
      this.filteredLanguages = this.languageOptions().filter(o => !s || o.description.toLowerCase().includes(s));
    });

    this.ethnicitySearchCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(search => {
      const s = (search || '').toLowerCase();
      this.filteredEthnicities = this.ethnicityOptions().filter(o => !s || o.description.toLowerCase().includes(s));
    });

    this.salutationSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(search => {
      const s = (search || '').toLowerCase();
      this.filteredSalutations = this.salutationOptions().filter(o => !s || o.description.toLowerCase().includes(s));
    });

    this.heightSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(search => {
      const s = (search || '').toLowerCase();
      this.filteredHeights = this.heightOptions().filter(h => !s || h.description.toLowerCase().includes(s));
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize the form with all fields
   */
  private initForm(): void {
    this.form = this.fb.group({
      // Address section
      streetName: ['', [Validators.required, Validators.maxLength(50)]],
      suiteApt: ['', [Validators.maxLength(10)]],
      city: ['', [Validators.maxLength(40), this.cityMinLengthValidator]],
      zip: ['', [Validators.maxLength(5), Validators.pattern(/^\d{0,5}$/)]],
      state: ['', [Validators.maxLength(5)]],
      county: ['', [Validators.maxLength(40)]],
      uspsId: [null],

      // Phone section (combined area code + phone number)
      homePhoneNumber: ['', [Validators.maxLength(20), this.phoneFormatValidator]],
      homePreferred: [false],

      workPhoneNumber: ['', [Validators.maxLength(20), this.phoneFormatValidator]],
      workExtension: [null],
      workPreferred: [false],

      mobilePhoneNumber: ['', [Validators.maxLength(20), this.phoneFormatValidator]],
      mobilePreferred: [false],

      // Email
      email: ['', [Validators.maxLength(128), this.emailFormatValidator]],

      // Personal info
      language: ['', [Validators.maxLength(15)]],
      alias: ['', [Validators.maxLength(15)]],
      suffix: ['', [Validators.maxLength(5)]],
      ethnicity: ['', [Validators.maxLength(5)]],
      salutation: ['', [Validators.maxLength(5)]],
      claimedDonations: [null],
      height: ['', [Validators.maxLength(10)]],
      weight: [null, [this.weightValidator]],

      // Employer section (UAT #7: maxLength validators)
      employerName: ['', [Validators.maxLength(50)]],
      employerCity: ['', [Validators.maxLength(40)]],
      employerZip: ['', [Validators.maxLength(5), Validators.pattern(/^\d{0,5}$/)]],
      employerState: ['', [Validators.maxLength(2)]],
      employerUspsId: [null],
    });

    if (this.readOnly && this.isSidePanelMode && this.queryMode) {
      this.form.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          if (this.queryModeSnapshot) {
            this.form.patchValue(this.queryModeSnapshot, { emitEvent: false });
          }
        });
    } else if (this.readOnly) {
      this.form.disable();
    }
  }

  private weightValidator(control: AbstractControl): ValidationErrors | null {
    if (control.value === null || control.value === '' || control.value === 0) {
      return null;
    }
    const value = Number(control.value);
    if (!Number.isInteger(value)) {
      return { notInteger: true };
    }
    if (value < 1) {
      return { min: { min: 1, actual: control.value } };
    }
    return null;
  }

  private emailFormatValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value || !value.trim()) return null;
    if (!value.includes('@') || !value.includes('.')) {
      return { email: true };
    }
    return null;
  }

  private cityMinLengthValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value || !value.trim()) return null;
    if (value.trim().length < 3) return { minlength: { requiredLength: 3, actualLength: value.trim().length } };
    return null;
  }

  private phoneFormatValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value || !value.trim()) return null;

    // Already formatted: (+927) 123-1212
    const match = value.match(/^\(\+?(\d+)\)\s*(.+)$/);
    if (match) {
      const areaCode = match[1];
      const phoneDigits = match[2].replace(/[^0-9]/g, '');
      if (areaCode.length !== 3) {
        return { invalidAreaCode: true };
      }
      if (phoneDigits.length !== 7) {
        return { invalidPhoneDigits: true };
      }
      if (Number(phoneDigits) <= 0) {
        return { invalidPhoneDigits: true };
      }
      return null;
    }

    // Raw digits only: 9271231212 (10 digits = 3 area + 7 phone)
    const digitsOnly = value.replace(/[^0-9]/g, '');
    if (digitsOnly.length === 0) {
      return { phoneRequired: true };
    }
    if (digitsOnly.length < 10) {
      return { phoneTooShort: true };
    }
    if (digitsOnly.length > 10) {
      return { phoneTooLong: true };
    }
    return null;
  }

  // UAT #4: Force uppercase for address fields
  forceUpperCase(controlName: string): void {
    const control = this.form.get(controlName);
    if (control?.value && typeof control.value === 'string') {
      const upper = control.value.toUpperCase();
      if (control.value !== upper) {
        control.setValue(upper, { emitEvent: false });
      }
    }
  }

  // UAT #6: Zip fields accept only digits
  onZipInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/[^0-9]/g, '');
  }

  onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/[^0-9()+\-\s]/g, '');
  }

  onPhoneBlur(controlName: string): void {
    const control = this.form.get(controlName);
    if (!control?.value) return;

    const digits = control.value.replace(/[^0-9]/g, '');
    if (digits.length === 10) {
      const area = digits.substring(0, 3);
      const phone = digits.substring(3, 6) + '-' + digits.substring(6);
      control.setValue(`(+${area}) ${phone}`, { emitEvent: false });
    }

    // UAT #2: Validate area code against AREAC master codes on blur
    this.validatePhoneAreaCode(controlName);
  }

  private validatePhoneAreaCode(controlName: string): void {
    const control = this.form.get(controlName);
    if (!control?.value) return;

    const match = control.value.match(/^\(\+?(\d{3})\)/);
    if (!match) return;

    const areaCode = match[1];
    this.demographicsService.validateAreaCode(areaCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe(valid => {
        if (!valid) {
          control.setErrors({ areaCodeNotFound: true });
          control.markAsTouched();
        } else if (control.errors?.['areaCodeNotFound']) {
          const { areaCodeNotFound, ...rest } = control.errors;
          control.setErrors(Object.keys(rest).length ? rest : null);
        }
      });
  }

  /**
   * Setup preferred contact checkbox logic - only one can be selected
   */
  private setupPreferredContactValidation(): void {
    this.form.get('homePreferred')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(checked => {
        if (checked) {
          this.form.patchValue({ workPreferred: false, mobilePreferred: false }, { emitEvent: false });
        }
      });

    this.form.get('workPreferred')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(checked => {
        if (checked) {
          this.form.patchValue({ homePreferred: false, mobilePreferred: false }, { emitEvent: false });
        }
      });

    this.form.get('mobilePreferred')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(checked => {
        if (checked) {
          this.form.patchValue({ homePreferred: false, workPreferred: false }, { emitEvent: false });
        }
      });
  }

  // If city is manually typed (not selected from zip-lookup dropdown), clear zip, state and county
  private setupCityClearsFields(): void {
    this.form.get('city')?.valueChanges
      .pipe(takeUntil(this.destroy$), distinctUntilChanged())
      .subscribe(() => {
        if (this.cityOptions().length === 0) {
          this.form.patchValue({ zip: '', state: '', county: '', uspsId: null }, { emitEvent: false });
        }
      });
  }

  // UAT #12: State and County auto-populate from Zip
  private setupZipLookup(): void {
    const zipControl = this.form.get('zip');

    // Clear state, county and city options immediately when zip changes
    zipControl?.valueChanges
      .pipe(takeUntil(this.destroy$), distinctUntilChanged())
      .subscribe(() => {
        this.cityOptions.set([]);
        this.form.patchValue({ state: '', county: '' }, { emitEvent: false });
      });

    // After debounce, if valid 5-digit zip, look up from API
    zipControl?.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300),
        distinctUntilChanged(),
        filter((zip: string) => !!zip && zip.trim().length === 5),
        switchMap((zip: string) => this.demographicsService.getCityStateByZip(zip.trim()).pipe(
          catchError(() => of([]))
        ))
      )
      .subscribe(results => {
        if (results.length === 0) {
          this.cityOptions.set([]);
          zipControl?.setErrors({ invalidZip: true });
          zipControl?.markAsTouched();
          return;
        }

        zipControl?.setErrors(null);
        const uniqueCities = results.reduce((acc, r) => {
          if (!acc.some(c => c.city === r.city)) {
            acc.push({ city: r.city, state: r.state, uspsId: r.uspsId, county: r.county ?? '' });
          }
          return acc;
        }, [] as { city: string; state: string; uspsId: number | null; county?: string }[]);

        const currentCity = (this.form.get('city')?.value || '').toUpperCase().trim();
        const matchingCity = currentCity ? uniqueCities.find(c => c.city.toUpperCase() === currentCity) : null;

        if (matchingCity) {
          this.cityOptions.set([]);
          this.form.patchValue({
            state: matchingCity.state,
            county: matchingCity.county ?? '',
            uspsId: matchingCity.uspsId
          }, { emitEvent: false });
        } else if (uniqueCities.length === 1) {
          this.cityOptions.set([]);
          this.form.patchValue({
            city: uniqueCities[0].city,
            state: uniqueCities[0].state,
            county: uniqueCities[0].county ?? '',
            uspsId: uniqueCities[0].uspsId
          }, { emitEvent: false });
        } else {
          this.cityOptions.set(uniqueCities);
          this.form.patchValue({ city: '' }, { emitEvent: false });
        }
      });
  }

  onCitySelected(city: string): void {
    const match = this.cityOptions().find(c => c.city === city);
    if (match) {
      this.form.patchValue({
        state: match.state,
        county: match.county ?? '',
        uspsId: match.uspsId
      }, { emitEvent: false });
    }
  }

  onCityBlur(): void {
    const cityControl = this.form.get('city');
    const city = cityControl?.value?.trim();
    if (!city || city.length < 3) return;

    this.demographicsService.getCityStateByCity(city)
      .pipe(takeUntil(this.destroy$))
      .subscribe(results => {
        if (results.length === 0) {
          cityControl?.setErrors({ ...cityControl.errors, cityNotFound: true });
          cityControl?.markAsTouched();
        } else if (cityControl?.errors?.['cityNotFound']) {
          const { cityNotFound, ...rest } = cityControl.errors;
          cityControl.setErrors(Object.keys(rest).length ? rest : null);
        }
      });
  }

  // UAT #8: If phone number deleted, uncheck preferred
  private setupPhoneClearUnchecksPreferred(): void {
    this.form.get('homePhoneNumber')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        if (!value || !value.trim()) {
          this.form.patchValue({ homePreferred: false }, { emitEvent: false });
        }
      });

    this.form.get('workPhoneNumber')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        if (!value || !value.trim()) {
          this.form.patchValue({ workPreferred: false }, { emitEvent: false });
        }
      });

    this.form.get('mobilePhoneNumber')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        if (!value || !value.trim()) {
          this.form.patchValue({ mobilePreferred: false }, { emitEvent: false });
        }
      });
  }

  private setupExtensionValidation(): void {
    this.form.get('workPhoneNumber')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        const extControl = this.form.get('workExtension');
        if (!value || !value.trim()) {
          if (extControl?.value) {
            extControl.setErrors({ extensionRequiresPhone: true });
            extControl.markAsTouched();
          }
        } else {
          if (extControl?.errors?.['extensionRequiresPhone']) {
            const { extensionRequiresPhone, ...rest } = extControl.errors;
            extControl.setErrors(Object.keys(rest).length ? rest : null);
          }
        }
      });
  }

  // UAT #9: If employer name changes, clear city/state/zip
  private setupEmployerNameClearsFields(): void {
    this.form.get('employerName')?.valueChanges
      .pipe(takeUntil(this.destroy$), distinctUntilChanged())
      .subscribe(() => {
        this.form.patchValue({
          employerCity: '',
          employerZip: '',
          employerState: '',
          employerUspsId: null
        }, { emitEvent: false });
        this.employerCityOptions.set([]);
      });
  }

  // If employer city is manually typed (not selected from zip-lookup dropdown), clear employer zip and state
  private setupEmployerCityClearsFields(): void {
    this.form.get('employerCity')?.valueChanges
      .pipe(takeUntil(this.destroy$), distinctUntilChanged())
      .subscribe(() => {
        if (this.employerCityOptions().length === 0) {
          this.form.patchValue({ employerZip: '', employerState: '' }, { emitEvent: false });
        }
      });
  }

  // UAT #11: Employer State auto-populate from Employer Zip
  private setupEmployerZipLookup(): void {
    const employerZipControl = this.form.get('employerZip');

    // Clear employer state and city options immediately when employer zip changes
    employerZipControl?.valueChanges
      .pipe(takeUntil(this.destroy$), distinctUntilChanged())
      .subscribe(() => {
        this.employerCityOptions.set([]);
        this.form.patchValue({ employerState: '' }, { emitEvent: false });
      });

    // After debounce, if valid 5-digit zip, look up from API
    employerZipControl?.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300),
        distinctUntilChanged(),
        filter((zip: string) => !!zip && zip.trim().length === 5),
        switchMap((zip: string) => this.demographicsService.getCityStateByZip(zip.trim()).pipe(
          catchError(() => of([]))
        ))
      )
      .subscribe(results => {
        if (results.length === 0) {
          this.employerCityOptions.set([]);
          employerZipControl?.setErrors({ invalidZip: true });
          employerZipControl?.markAsTouched();
          return;
        }

        employerZipControl?.setErrors(null);
        const uniqueCities = results.reduce((acc, r) => {
          if (!acc.some(c => c.city === r.city)) {
            acc.push({ city: r.city, state: r.state, uspsId: r.uspsId });
          }
          return acc;
        }, [] as { city: string; state: string; uspsId: number | null }[]);

        const currentCity = (this.form.get('employerCity')?.value || '').toUpperCase().trim();
        const matchingCity = currentCity ? uniqueCities.find(c => c.city.toUpperCase() === currentCity) : null;

        if (matchingCity) {
          this.employerCityOptions.set([]);
          this.form.patchValue({
            employerState: matchingCity.state,
            employerUspsId: matchingCity.uspsId
          }, { emitEvent: false });
        } else if (uniqueCities.length === 1) {
          this.employerCityOptions.set([]);
          this.form.patchValue({
            employerCity: uniqueCities[0].city,
            employerState: uniqueCities[0].state,
            employerUspsId: uniqueCities[0].uspsId
          }, { emitEvent: false });
        } else {
          this.employerCityOptions.set(uniqueCities);
          this.form.patchValue({ employerCity: '', employerUspsId: null }, { emitEvent: false });
        }
      });
  }

  onEmployerCitySelected(city: string): void {
    const match = this.employerCityOptions().find(c => c.city === city);
    if (match) {
      this.form.patchValue({ employerState: match.state, employerUspsId: match.uspsId }, { emitEvent: false });
    }
  }

  /**
   * Load master code options for dropdowns
   */
  private loadMasterCodes(): void {
    this.demographicsService.getLanguages()
      .pipe(takeUntil(this.destroy$))
      .subscribe(languages => {
        this.languageOptions.set(languages);
        this.filteredLanguages = languages;
      });

    this.demographicsService.getEthnicities()
      .pipe(takeUntil(this.destroy$))
      .subscribe(ethnicities => {
        this.ethnicityOptions.set(ethnicities);
        this.filteredEthnicities = ethnicities;
      });

    this.demographicsService.getSalutations()
      .pipe(takeUntil(this.destroy$))
      .subscribe(salutations => {
        this.salutationOptions.set(salutations);
        this.filteredSalutations = salutations;
      });

    this.demographicsService.getHeights()
      .pipe(takeUntil(this.destroy$))
      .subscribe(heights => {
        this.heightOptions.set(heights);
        this.filteredHeights = heights;
      });
  }

  /**
   * Load donor demographics data
   */
  loadDemographics(): void {
    this.loading.set(true);
    this.error.set(null);

    this.demographicsService.getDemographics(this.donorId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.donorData.set(data);
          this.populateForm(data);
          this.loadIntlAddressFromData(data);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err.message || 'Failed to load donor demographics');
          this.loading.set(false);
          this.showError(err.message || 'Failed to load donor demographics');
        }
      });
  }

  /**
   * Populate form with loaded data
   */
  private loadIntlAddressFromData(data: DonorDemographicsDto): void {
    if (data.intlAddrFlag === 'Y' && data.address) {
      this.intlAddressService.setInternationalAddress({
        streetName: data.address.intlAddress1 ?? '',
        addr1: data.address.intlAddress2 ?? null,
        addr2: data.address.intlAddress3 ?? null,
        addr3: data.address.intlAddress4 ?? null,
        country: data.address.countryName ?? '',
        postalCode: data.address.intlPostalCode ?? null,
        homePhoneNo: data.address.intlHomePhoneNo ?? null,
        workPhoneNo: data.address.intlWorkPhoneNo ?? null,
        workPhoneExt: data.address.intlWorkPhoneExt ?? null,
        mobilePhoneNo: data.address.intlMobilePhoneNo ?? null,
        faxNo: data.address.intlFaxNo ?? null,
        intlAddrFlag: 'Y'
      });
    } else {
      this.intlAddressService.clearInternationalAddress();
    }
  }

  private populateForm(data: DonorDemographicsDto): void {
    this.queryModeSnapshot = null;
    this.form.patchValue({
      // Address
      streetName: data.address?.streetName,
      suiteApt: data.address?.suiteApt,
      city: data.address?.city,
      zip: data.address?.zip,
      state: data.address?.state,
      county: data.address?.county,
      uspsId: data.address?.uspsId,

      // Phones (combined)
      homePhoneNumber: this.combinePhone(data.phones?.home?.areaCode, data.phones?.home?.phoneNo),
      homePreferred: data.phones?.preferredContact === 'H',

      workPhoneNumber: this.combinePhone(data.phones?.work?.areaCode, data.phones?.work?.phoneNo),
      workExtension: data.phones?.work?.extension,
      workPreferred: data.phones?.preferredContact === 'W',

      mobilePhoneNumber: this.combinePhone(data.phones?.mobile?.areaCode, data.phones?.mobile?.phoneNo),
      mobilePreferred: data.phones?.preferredContact === 'M',

      // Email
      email: data.email,

      // Personal info
      language: data.personalInfo?.language,
      alias: data.personalInfo?.alias,
      suffix: data.personalInfo?.lastNameSuffix,
      ethnicity: data.personalInfo?.ethnicGroup,
      salutation: data.personalInfo?.salutation,
      claimedDonations: data.personalInfo?.claimedDonations,
      height: data.personalInfo?.height || '',
      weight: data.personalInfo?.donorWeight || null,

      // Employer
      employerName: data.employer?.employerName,
      employerCity: data.employer?.city,
      employerZip: data.employer?.zip,
      employerState: data.employer?.state,
    }, { emitEvent: false });

    if (data.intlAddrFlag === 'Y') {
      this.form.get('streetName')?.clearValidators();
      this.form.get('streetName')?.addValidators([Validators.maxLength(50)]);
      this.form.get('streetName')?.updateValueAndValidity({ emitEvent: false });
    } else {
      this.form.get('zip')?.addValidators([Validators.required]);
      this.form.get('zip')?.updateValueAndValidity({ emitEvent: false });
    }

    this.form.markAsPristine();
    this.formDirty.set(false);

    if (this.readOnly && this.queryMode) {
      this.queryModeSnapshot = this.form.getRawValue();
    }
  }

  private combinePhone(areaCode: string | null | undefined, phoneNo: string | null | undefined): string {
    if (!areaCode && !phoneNo) return '';
    const area = areaCode ? `(+${areaCode})` : '';
    const phone = phoneNo ? this.formatPhoneWithHyphen(phoneNo) : '';
    return `${area} ${phone}`.trim();
  }

  private formatPhoneWithHyphen(phone: string): string {
    const cleaned = phone.replace(/[^0-9]/g, '');
    if (cleaned.length === 7) {
      return `${cleaned.substring(0, 3)}-${cleaned.substring(3)}`;
    }
    return phone;
  }

  private parsePhone(combined: string | null | undefined): { areaCode: string | null; phoneNo: string | null } {
    if (!combined || !combined.trim()) return { areaCode: null, phoneNo: null };
    const match = combined.match(/^\(\+?(\d+)\)\s*(.+)$/);
    if (match) {
      return { areaCode: match[1], phoneNo: match[2].replace(/[^0-9]/g, '') };
    }
    return { areaCode: null, phoneNo: combined.replace(/[^0-9]/g, '') || null };
  }

  /**
   * Get form control
   */
  get f() {
    return this.form.controls;
  }

  /**
   * Get preferred contact value
   */
  private getPreferredContact(): string | null {
    if (this.form.get('homePreferred')?.value) return 'H';
    if (this.form.get('workPreferred')?.value) return 'W';
    if (this.form.get('mobilePreferred')?.value) return 'M';
    return null;
  }

  /**
   * Open International Address dialog
   */
  onInternationalAddress(): void {
    // FMB: If intl_addr_flag is already 'Y', open directly (editing existing intl address)
    // Only block if switching FROM domestic TO international while domestic fields are populated
    const isAlreadyInternational = this.donorData()?.intlAddrFlag === 'Y';
    if (!isAlreadyInternational) {
      const formValue = this.form.getRawValue();
      if (formValue.streetName?.trim() || formValue.city?.trim() || formValue.zip?.trim()) {
        this.showError('Error:16317: Clear US address fields before clicking the button');
        return;
      }
    }

    if (this.isSidePanelMode) {
      this.currentSubPanel.set('international');
      this.panelWidthChange.emit('700px');
      return;
    }

    this.dialog.open(InternationalAddressDialogComponent, {
      width: '700px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      disableClose: true,
      panelClass: 'code-dialog-panel-right',
      position: { right: '0', top: '64px' },
      hasBackdrop: true,
      backdropClass: 'code-dialog-backdrop',
      data: {
        donorId: this.donorId
      }
    }).afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result === null) {
          this.intlAddressService.clearInternationalAddress();
        }
        if (result) {
          this.form.markAsDirty();
        }
      });
  }

  /**
   * Open Alternate Address dialog
   */
  onAlternateAddress(): void {
    if (this.isSidePanelMode) {
      const fakeDialogRef = {
        close: (result?: any) => {
          if (result && this.queryMode) {
            this.showQueryModeError();
          }
          this.currentSubPanel.set('main');
          this.alternateInjector = null;
          this.panelWidthChange.emit('70vw');
        },
        afterClosed: () => ({ subscribe: () => {} }),
        updateSize: () => {},
        updatePosition: () => {}
      };

      this.alternateInjector = Injector.create({
        providers: [
          { provide: MatDialogRef, useValue: fakeDialogRef },
          { provide: MAT_DIALOG_DATA, useValue: { donorId: this.donorId, readOnly: this.readOnly } }
        ]
      });
      this.currentSubPanel.set('alternate');
      this.panelWidthChange.emit('700px');
      return;
    }

    this.dialog.open(AlternateDemographicsDialogComponent, {
      width: '700px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      disableClose: false,
      panelClass: 'code-dialog-panel-right',
      position: { right: '0', top: '64px' },
      hasBackdrop: true,
      backdropClass: 'code-dialog-backdrop',
      data: {
        donorId: this.isSidePanelMode ? '' : this.donorId,
        readOnly: this.readOnly
      }
    }).afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        this.currentSubPanel.set('main');
        if (result) {
          if (this.isSidePanelMode && this.queryMode) {
            this.showQueryModeError();
          } else {
            this.loadDemographics();
          }
        }
      });
  }

  /**
   * Redisplay - reload donor demographics
   */
  onRedisplay(): void {
    this.loadDemographics();
  }

  /**
   * Cancel and close dialog
   */
  onCancel(): void {
    if (this.dialogRef) {
      this.dialogRef.close();
    } else {
      this.closePanelEvent.emit();
    }
  }

  readonly AlternateDemographicsComponent = AlternateDemographicsDialogComponent;
  alternateInjector: Injector | null = null;

  onSubPanelBack(): void {
    this.currentSubPanel.set('main');
    this.alternateInjector = null;
    this.panelWidthChange.emit('70vw');
  }

  onSubPanelApply(result: any): void {
    if (result && this.queryMode) {
      this.showQueryModeError();
    }
    this.currentSubPanel.set('main');
    this.alternateInjector = null;
    this.panelWidthChange.emit('70vw');
  }

  onIntlAddressApplied(result: any): void {
    if (result === null) {
      this.intlAddressService.clearInternationalAddress();
    }
    if (result) {
      this.form.markAsDirty();
    }
    this.currentSubPanel.set('main');
    this.panelWidthChange.emit('70vw');
  }

  onSubPanelCancel(): void {
    this.currentSubPanel.set('main');
    this.alternateInjector = null;
    this.panelWidthChange.emit('70vw');
  }

  onSidePanelButtonClick(action: string): void {
    switch (action) {
      case 'redisplay':
        this.onRedisplay();
        break;
      case 'cancel':
        this.onCancel();
        break;
      case 'save':
        this.onSave();
        break;
    }
  }

  onSave(): void {
    this.submitted.set(true);

    if (this.form.invalid) {
      const firstInvalid = document.querySelector('.ng-invalid[formControlName]');
      if (firstInvalid) {
        (firstInvalid as HTMLElement).focus();
      }
      return;
    }

    this.submitUpdate();
  }

  private buildUpdatePayload(): UpdateDonorDemographicsDto {
    const formValue = this.form.getRawValue();
    const homePhone = this.parsePhone(formValue.homePhoneNumber);
    const workPhone = this.parsePhone(formValue.workPhoneNumber);
    const mobilePhone = this.parsePhone(formValue.mobilePhoneNumber);
    const intlAddr = this.intlAddressService.getInternationalAddress();

    return {
      address: {
        streetName: formValue.streetName,
        suiteApt: formValue.suiteApt,
        city: formValue.city,
        zip: formValue.zip,
        state: formValue.state,
        county: formValue.county,
        uspsId: formValue.uspsId,
        intlAddress1: intlAddr?.streetName ?? null,
        intlAddress2: intlAddr?.addr1 ?? null,
        intlAddress3: intlAddr?.addr2 ?? null,
        intlAddress4: intlAddr?.addr3 ?? null,
        countryName: intlAddr?.country ?? null,
        intlPostalCode: intlAddr?.postalCode ?? null,
        intlAddrFlag: intlAddr?.intlAddrFlag ?? this.donorData()?.intlAddrFlag ?? 'N',
        intlWorkPhoneNo: intlAddr?.workPhoneNo ?? null,
        intlWorkPhoneExt: intlAddr?.workPhoneExt ?? null,
        intlHomePhoneNo: intlAddr?.homePhoneNo ?? null,
        intlMobilePhoneNo: intlAddr?.mobilePhoneNo ?? null,
        intlFaxNo: intlAddr?.faxNo ?? null
      },
      phones: {
        home: homePhone.areaCode || homePhone.phoneNo ? {
          areaCode: homePhone.areaCode,
          phoneNo: homePhone.phoneNo
        } : null,
        work: workPhone.areaCode || workPhone.phoneNo ? {
          areaCode: workPhone.areaCode,
          phoneNo: workPhone.phoneNo,
          extension: formValue.workExtension
        } : null,
        mobile: mobilePhone.areaCode || mobilePhone.phoneNo ? {
          areaCode: mobilePhone.areaCode,
          phoneNo: mobilePhone.phoneNo
        } : null,
        preferredContact: this.getPreferredContact()
      },
      email: formValue.email,
      personalInfo: {
        language: formValue.language,
        alias: formValue.alias,
        lastNameSuffix: formValue.suffix,
        ethnicGroup: formValue.ethnicity,
        salutation: formValue.salutation,
        height: formValue.height,
        donorWeight: formValue.weight,
        claimedDonations: formValue.claimedDonations
      },
      employer: {
        employerId: this.pendingNewEmployer ? null : (this.matchedEmployerId ?? this.donorData()?.employer?.employerId ?? null),
        employerName: formValue.employerName,
        city: formValue.employerCity,
        zip: formValue.employerZip,
        state: formValue.employerState,
        uspsId: formValue.employerUspsId
      }
    };
  }

  private submitUpdate(): void {
    if (this.isSidePanelMode && this.queryMode) {
      this.showQueryModeError();
      this.closePanelEvent.emit();
      return;
    }

    const formValue = this.form.getRawValue();
    const employerName = formValue.employerName?.trim();
    const originalEmployerName = this.donorData()?.employer?.employerName?.trim();

    // UAT #10: If employer changed, check if it exists; prompt to create if new
    if (employerName && employerName !== originalEmployerName) {
      this.demographicsService.searchEmployers({ searchName: employerName, searchType: 'M' }, 1, 0)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (result) => {
            if (result.total === 0) {
              this.promptCreateNewEmployer();
            } else {
              const matched = result.data[0];
              this.matchedEmployerId = matched.employerId;
              this.form.patchValue({
                employerCity: matched.city || '',
                employerState: matched.state || '',
                employerZip: matched.zip || '',
                employerUspsId: matched.uspsId ?? null
              }, { emitEvent: false });
              this.executeSave();
            }
          },
          error: () => {
            this.promptCreateNewEmployer();
          }
        });
    } else {
      this.executeSave();
    }
  }

  // UAT #10: Prompt to create new employer
  private promptCreateNewEmployer(): void {
    const dialogData: MessageDialogData = {
      title: 'New Employer',
      message: 'No matching employer found. Do you want to create a new employer?',
      primaryAction: {
        label: 'YES',
        action: 'yes',
        variant: 'primary'
      },
      secondaryAction: {
        label: 'NO',
        action: 'no',
        variant: 'secondary'
      }
    };

    this.dialog.open(MessageDialog, {
      width: '420px',
      maxWidth: '90vw',
      autoFocus: false,
      hasBackdrop: true,
      panelClass: 'demographics-commit-dialog',
      data: dialogData
    }).afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result) => {
        if (result === 'yes') {
          this.pendingNewEmployer = true;
          this.executeSave();
        }
      });
  }

  private executeSave(): void {
    this.saving.set(true);
    this.doUpdateDemographics();
  }

  private doUpdateDemographics(): void {
    const updateData = this.buildUpdatePayload();

    this.demographicsService.updateDemographics(this.donorId, updateData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.pendingNewEmployer = false;
          this.matchedEmployerId = null;
          this.snackBar.open('Donor demographics updated successfully', 'DISMISS', {
            duration: 5000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });
          if (this.dialogRef) {
            this.dialogRef.close(true);
          } else {
            this.closePanelEvent.emit();
          }
        },
        error: (err) => {
          this.saving.set(false);
          this.pendingNewEmployer = false;
          this.matchedEmployerId = null;
          this.showError(err.message || 'Failed to save donor demographics');
        }
      });
  }

  /**
   * Show error message
   */
  private showError(message: string): void {
    this.snackBar.open(message, 'DISMISS', {
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }

  onFormClick(event: Event): void {
    if (!this.readOnly || !this.queryMode) return;

    const target = event.target as HTMLElement;
    if (target.closest('mat-form-field, mat-checkbox, mat-select, input, textarea, select')) {
      this.showQueryModeError();
    }
  }

  private showQueryModeError(): void {
    this.showError('Error:1705: Form in query mode, cannot change database fields');
  }

  /**
   * Handle number-only input for weight
   */
  getPhoneError(controlName: string): string {
    const control = this.form.get(controlName);
    if (!control?.errors) return '';
    if (control.errors['areaCodeNotFound']) return 'Invalid area code';
    if (control.errors['invalidAreaCode']) return 'Area code must be 3 digits';
    if (control.errors['invalidPhoneDigits']) return 'Phone must be 7 digits';
    if (control.errors['phoneRequired']) return 'Enter area code + phone number';
    if (control.errors['phoneTooShort']) return 'Phone number is too short';
    if (control.errors['phoneTooLong']) return 'Phone number is too long';
    return '';
  }

  limitWeightLength(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.value.length > 4) {
      input.value = input.value.slice(0, 4);
      this.form.get('weight')?.setValue(Number(input.value), { emitEvent: true });
    }
  }

  onlyNumbers(event: KeyboardEvent): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
      return false;
    }
    return true;
  }

  /**
   * Handle paste for number-only fields
   */
  onPasteNumbers(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedText = event.clipboardData?.getData('text') || '';
    const numericOnly = pastedText.replace(/[^0-9]/g, '');
    document.execCommand('insertText', false, numericOnly);
  }
}
