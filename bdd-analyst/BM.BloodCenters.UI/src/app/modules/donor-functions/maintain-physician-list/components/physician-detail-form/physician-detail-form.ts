import { Component, OnInit, OnDestroy, OnChanges, SimpleChanges, Input, Output, EventEmitter, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, Validators, ReactiveFormsModule, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import moment from 'moment';

import { PhysicianService } from '../../services/physician.service';
import {
  PhysicianModel,
  PhysicianSpecialtyModel,
  ZipCodeLookupModel,
  CreatePhysicianRequest,
  UpdatePhysicianRequest
} from '../../models/physician.model';
import { HeaderService } from '@shared/services/header.service';
import { LoginService } from '@shared/services/login.service';
import { InternationalAddressDialogComponent } from '@shared/components/international-address-dialog/international-address-dialog.component';
import { InternationalAddressModel, InternationalAddressDialogData } from '@shared/models/international-address.model';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { requiredTrimmedValidator, trimmedMaxLengthValidator } from '@shared/validators';
import { contactPhoneValidator, formatPhoneNumber as formatPhoneNumberUtil } from '@shared/validators/contact.validators';
import { effectiveDateNotPastValidator, terminationDateNotPastValidator, terminationAfterEffectiveValidator } from '@shared/validators/date.validators';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';

/**
 * Physician Detail Form Component
 * Handles add/edit functionality for physician records
 */
@Component({
  selector: 'app-physician-detail-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }
  ],
  templateUrl: './physician-detail-form.html',
  styleUrls: ['./physician-detail-form.scss']
})
export class PhysicianDetailForm implements OnInit, OnDestroy, OnChanges {
  @Input() physician: PhysicianModel | null = null;
  @Input() isAddMode = false;
  @Output() saved = new EventEmitter<PhysicianModel>();
  @Output() cancelled = new EventEmitter<void>();

  // Static ID counter for unique IDs
  private static nextId = 0;
  protected readonly componentId = `physician-detail-form-${PhysicianDetailForm.nextId++}`;

  // ID generation helpers for accessibility
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  // Custom error state matchers for date fields
  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEffectiveDateError());
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTerminationDateError());

  form!: FormGroup;
  specialties = signal<PhysicianSpecialtyModel[]>([]);
  filteredSpecialties = signal<PhysicianSpecialtyModel[]>([]);
  specialtySearchControl = new FormControl('');
  isSaving = signal<boolean>(false);
  isLoadingSpecialties = signal<boolean>(false);
  specialtyLoadError = signal<boolean>(false);
  submitted = signal<boolean>(false);

  // ZIP code lookup data
  zipCodeOptions = signal<ZipCodeLookupModel[]>([]);
  filteredZipCodeOptions = signal<ZipCodeLookupModel[]>([]);
  citySearchControl = new FormControl('');
  hasMultipleCityOptions = signal<boolean>(false);
  selectedUspsId = signal<number | null>(null);
  hasInvalidZipCode = signal<boolean>(false); // Track when ZIP lookup returns 0 results

  // International address data
  internationalAddress = signal<InternationalAddressModel | null>(null);
  internationalAddressId = signal<number | null>(null);
  internationalAddressUnavailable = signal<boolean>(false);

  private destroy$ = new Subject<void>();

  // Chapter timezone getter
  private get chapterOffset(): string {
    return this.headerService.chapterTimeZone();
  }

  // Date validation - minDate as getter to always use latest timezone
  get minDate() {
    return DateFieldValidationUtility.getMinDate(this.chapterOffset);
  }

  /**
   * Format effective date for display in edit mode (read-only)
   */
  get effectiveDateDisplay(): string {
    const effDate = this.form?.get('effectiveDate')?.value;
    if (!effDate) return '';
    return moment(effDate).format('DD-MMM-YYYY');
  }

  /**
   * Determine if save button should be disabled
   * Add mode: disabled if form invalid or saving or ZIP code validation fails
   * Edit mode: disabled if form invalid, not dirty (no changes), or saving, or ZIP code validation fails
   *
   * ZIP code validation:
   * - Empty (no ZIP) = ENABLED
   * - 1-4 characters (incomplete) = DISABLED
   * - 5 characters + no results found (invalid ZIP) = DISABLED
   * - 5 characters + multiple cities + no city selected = DISABLED
   * - 5 characters + multiple cities + city selected = ENABLED
   * - 5 characters + single city (auto-filled) = ENABLED
   */
  get isSaveDisabled(): boolean {
    if (this.isSaving()) {
      return true;
    }

    if (!this.form || this.form.invalid) {
      return true;
    }

    // ZIP code validation
    const zipCode = this.form.get('zipCode')?.value?.trim();
    if (zipCode) {
      // If ZIP code entered but less than 5 characters, disable save
      if (zipCode.length < 5) {
        return true;
      }

      // If ZIP code lookup returned no results (invalid ZIP), disable save
      if (zipCode.length === 5 && this.hasInvalidZipCode()) {
        return true;
      }

      // If ZIP code is 5 characters and multiple cities available, city selection is required
      if (zipCode.length === 5 && this.hasMultipleCityOptions() && !this.selectedUspsId()) {
        return true;
      }
    }

    // In edit mode, require form to be dirty (has changes)
    if (!this.isAddMode && this.form.pristine) {
      return true;
    }

    return false;
  }

  /**
   * Determine if Clear All button should be disabled (Add mode only)
   * Disabled when: form is saving OR form is pristine (no changes made)
   */
  get isClearAllDisabled(): boolean {
    if (this.isSaving()) {
      return true;
    }

    // Disable if form is pristine (no changes made yet)
    if (!this.form || this.form.pristine) {
      return true;
    }

    return false;
  }

  /**
   * Show search in specialty dropdown if 3 or more options
   */
  get showSpecialtySearch(): boolean {
    return this.specialties().length >= 3;
  }

  /**
   * Show search in city dropdown if 3 or more options
   */
  get showCitySearch(): boolean {
    return this.zipCodeOptions().length >= 3;
  }

  /**
   * Termination date filter: must be >= chapter's today AND >= effective date
   */
  terminationDateFilter = (date: moment.Moment | null): boolean => {
    if (!date) return true;

    const checkDate = moment(date).startOf('day');
    const chapterToday = moment().utcOffset(this.chapterOffset).startOf('day');
    const today = moment(chapterToday.format('YYYY-MM-DD')).startOf('day');

    // Block dates before chapter's local date
    if (checkDate.isBefore(today)) {
      return false;
    }

    // Must be >= effective date if set
    const effectiveDate = this.form?.get('effectiveDate')?.value;
    if (effectiveDate) {
      const effDay = moment(effectiveDate).startOf('day');
      if (checkDate.isBefore(effDay)) {
        return false;
      }
    }

    return true;
  };

  constructor(
    private fb: FormBuilder,
    private physicianService: PhysicianService,
    private headerService: HeaderService,
    private loginService: LoginService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private chapterTimezoneService: ChapterTimezoneService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadSpecialties();
    this.setupSpecialtySearch();
    this.setupCitySearch();

    // Initialize form state based on mode
    if (this.isAddMode) {
      this.clearForm();
    } else if (this.physician) {
      this.populateForm(this.physician);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Handle changes to inputs after initialization
    if (!this.form) return;

    if (changes['isAddMode'] && changes['isAddMode'].currentValue) {
      // Switching to add mode - clear form
      this.clearForm();
    } else if (changes['physician'] && changes['physician'].currentValue && !this.isAddMode) {
      const newPhysician = changes['physician'].currentValue;
      const previousPhysician = changes['physician'].previousValue;

      // Don't repopulate if:
      // 1. Form has unsaved changes (is dirty), AND
      // 2. It's the same physician (by ID)
      const isSamePhysician = previousPhysician && newPhysician.physicianId === previousPhysician.physicianId;
      if (this.form.dirty && isSamePhysician) {
        console.log('⚠️ Skipping form repopulation - form has unsaved changes');
        return;
      }

      // Physician changed in edit mode - populate form
      this.populateForm(newPhysician);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Format phone number on blur - displays as XXX-XXXX or XXX-XXX-XXXX
   * Uses shared contact validator utility
   */
  onPhoneNumberBlur(): void {
    const phoneControl = this.form.get('phoneNumber');
    if (phoneControl?.value) {
      const formatted = formatPhoneNumberUtil(phoneControl.value);
      if (formatted) {
        phoneControl.setValue(formatted, { emitEvent: false });
      }
    }
  }

  private initializeForm(): void {
    if (this.isAddMode) {
      // Add mode: effective date cannot be in past
      this.form = this.fb.group({
        lastName: ['', [requiredTrimmedValidator()]],
        firstName: [''],
        middleName: [''],
        specialtyCode: [''],
        phoneNumber: ['', [contactPhoneValidator()]],
        streetAddress: ['', [trimmedMaxLengthValidator(50)]],
        zipCode: [''],
        citySelect: [''], // For dropdown when multiple cities
        city: [{ value: '', disabled: true }],
        state: [{ value: '', disabled: true }],
        effectiveDate: [null, [Validators.required, effectiveDateNotPastValidator(this.chapterTimezoneService)]],
        terminationDate: [null, [terminationDateNotPastValidator(this.chapterTimezoneService)]],
        comments: ['']
      }, {
        validators: [terminationAfterEffectiveValidator()]
      });
    } else {
      // Edit mode: effective date can be in past (read-only)
      this.form = this.fb.group({
        lastName: ['', [requiredTrimmedValidator()]],
        firstName: [''],
        middleName: [''],
        specialtyCode: [''],
        phoneNumber: ['', [contactPhoneValidator()]],
        streetAddress: ['', [trimmedMaxLengthValidator(50)]],
        zipCode: [''],
        citySelect: [''], // For dropdown when multiple cities
        city: [{ value: '', disabled: true }],
        state: [{ value: '', disabled: true }],
        effectiveDate: [{ value: null, disabled: true }, [Validators.required]],
        terminationDate: [null, [terminationDateNotPastValidator(this.chapterTimezoneService)]],
        comments: ['']
      }, {
        validators: [terminationAfterEffectiveValidator()]
      });
    }

    // Re-validate termination date when effective date changes (for date range validation)
    this.form.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.form.get('terminationDate')?.updateValueAndValidity();
      });

    // ZIP code lookup on change (trigger after 5 characters)
    this.form.get('zipCode')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((zipCode) => {
        if (zipCode && zipCode.length >= 5) {
          this.lookupZipCode(zipCode);
        } else {
          // Save pristine state before programmatic update
          const wasPristine = this.form.pristine;
          // Remove required validator when ZIP is cleared/incomplete
          this.form.get('citySelect')?.clearValidators();
          this.form.get('citySelect')?.updateValueAndValidity({ emitEvent: false });
          this.form.patchValue({
            citySelect: '',
            city: '',
            state: ''
          }, { emitEvent: false });
          // Restore pristine state after programmatic update
          if (wasPristine) {
            this.form.markAsPristine();
          }
          this.zipCodeOptions.set([]);
          this.filteredZipCodeOptions.set([]);
          this.hasMultipleCityOptions.set(false);
          this.selectedUspsId.set(null);
          this.hasInvalidZipCode.set(false); // Clear invalid flag when ZIP changes
        }
      });

    // City selection from dropdown (when multiple cities for one ZIP)
    this.form.get('citySelect')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((uspsId) => {
        if (uspsId) {
          const selected = this.zipCodeOptions().find(option => option.uspsId === uspsId);
          if (selected) {
            // Save pristine state before programmatic update
            const wasPristine = this.form.pristine;
            this.selectedUspsId.set(selected.uspsId);
            this.form.patchValue({
              city: selected.city,
              state: selected.state
            }, { emitEvent: false });
            // Restore pristine state after programmatic update
            if (wasPristine) {
              this.form.markAsPristine();
            }
          }
        }
      });

    // Specialty description auto-populate
    this.form.get('specialtyCode')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((code) => {
        // Specialty description is displayed separately (read-only)
        // No need to update form
      });
  }

  private populateForm(physician: PhysicianModel): void {
    console.log('📋 Populating form with physician:', physician);

    this.form.patchValue({
      lastName: physician.lastName,
      firstName: physician.firstName,
      middleName: physician.middleName || '',
      specialtyCode: physician.specialtyCode,
      phoneNumber: physician.phoneNumber || '',
      streetAddress: physician.streetAddress || '',
      zipCode: physician.zipCode || '',
      city: physician.city || '',
      state: physician.state || '',
      effectiveDate: physician.effectiveDate ? moment(physician.effectiveDate) : null,
      terminationDate: physician.terminationDate ? moment(physician.terminationDate) : null,
      comments: physician.comments || ''
    }, { emitEvent: false });

    // Restore USPS ID for domestic addresses
    if (physician.uspsId) {
      console.log('✅ Restoring USPS ID:', physician.uspsId);
      this.selectedUspsId.set(physician.uspsId);
    } else {
      this.selectedUspsId.set(null);
    }

    // Set international address if exists
    if (physician.hasInternationalAddress && physician.intlAddress1) {
      // Set international address ID if available
      this.internationalAddressId.set(physician.internationalAddressId || null);

      // Build InternationalAddressModel from physician fields
      const intlAddr: InternationalAddressModel = {
        streetName: physician.intlAddress1 || '',
        addr1: physician.intlAddress2 || null,
        addr2: physician.intlAddress3 || null,
        addr3: physician.intlAddress4 || null,
        country: physician.countryName || '',
        postalCode: physician.intlPostalCode || null,
        homePhoneNo: physician.intlHomePhoneNo || null,
        workPhoneNo: physician.intlWorkPhoneNo || null,
        workPhoneExt: physician.intlWorkPhoneExt || null,
        mobilePhoneNo: physician.intlMobilePhoneNo || null,
        faxNo: physician.intlFaxNo || null,
        intlAddrFlag: 'Y'
      };

      this.internationalAddress.set(intlAddr);

      // Disable domestic address fields when international address exists
      this.form.get('streetAddress')?.disable({ emitEvent: false });
      this.form.get('zipCode')?.disable({ emitEvent: false });
    } else {
      // Clear international address if physician doesn't have one
      this.internationalAddress.set(null);
      this.internationalAddressId.set(null);

      // Enable domestic address fields when no international address
      if (!this.isAddMode) {
        this.form.get('streetAddress')?.enable({ emitEvent: false });
        this.form.get('zipCode')?.enable({ emitEvent: false });
      }
    }

    // Trigger ZIP code lookup if ZIP exists (to restore multiple city state and validators)
    if (physician.zipCode && physician.zipCode.length === 5) {
      this.physicianService.lookupZipCode(physician.zipCode)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (results: ZipCodeLookupModel[]) => {
            if (results && results.length > 0) {
              this.zipCodeOptions.set(results);
              this.filteredZipCodeOptions.set(results);
              this.hasInvalidZipCode.set(false);

              if (results.length === 1) {
                // Single result - no dropdown needed
                this.hasMultipleCityOptions.set(false);
                this.form.get('citySelect')?.clearValidators();
                this.form.get('citySelect')?.updateValueAndValidity({ emitEvent: false });
              } else {
                // Multiple results - show dropdown and set required validator
                this.hasMultipleCityOptions.set(true);
                this.form.get('citySelect')?.setValidators([Validators.required]);
                this.form.get('citySelect')?.updateValueAndValidity({ emitEvent: false });

                // Pre-select the city if uspsId exists
                if (physician.uspsId) {
                  this.form.patchValue({ citySelect: physician.uspsId }, { emitEvent: false });
                }
              }
            }

            // Mark form as pristine after ZIP lookup completes
            this.form.markAsPristine();
            this.form.markAsUntouched();
          }
        });
    } else {
      // No ZIP code to lookup, mark form as pristine immediately
      this.form.markAsPristine();
      this.form.markAsUntouched();
    }
  }

  private clearForm(): void {
    if (!this.form) return;

    // Reset all form controls
    this.form.reset({
      lastName: '',
      firstName: '',
      middleName: '',
      specialtyCode: '',
      phoneNumber: '',
      streetAddress: '',
      zipCode: '',
      citySelect: '',
      city: '',
      state: '',
      effectiveDate: null,
      terminationDate: null,
      comments: ''
    }, { emitEvent: false });

    // Re-enable fields and setup validators when switching to add mode
    if (this.isAddMode) {
      this.form.get('streetAddress')?.enable();
      this.form.get('zipCode')?.enable();
      // Re-setup add mode validators (includes enabling effectiveDate)
      DateFieldValidationUtility.setupAddModeValidators(this.form, this.chapterOffset);
    }

    // Clear international address
    this.internationalAddress.set(null);
    this.internationalAddressId.set(null);

    // Clear ZIP code options
    this.zipCodeOptions.set([]);
    this.filteredZipCodeOptions.set([]);
    this.hasMultipleCityOptions.set(false);
    this.selectedUspsId.set(null);
    this.hasInvalidZipCode.set(false);

    // Remove required validator from citySelect
    this.form.get('citySelect')?.clearValidators();
    this.form.get('citySelect')?.updateValueAndValidity({ emitEvent: false });

    // Reset form state
    this.submitted.set(false);
    this.form.markAsPristine();
    this.form.markAsUntouched();
  }

  private loadSpecialties(): void {
    this.isLoadingSpecialties.set(true);
    this.specialtyLoadError.set(false);
    this.physicianService.getSpecialties()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (specialties) => {
          this.specialties.set(specialties);
          this.filteredSpecialties.set(specialties);
          this.isLoadingSpecialties.set(false);
        },
        error: (error) => {
          console.error('Error loading specialties:', error);
          this.isLoadingSpecialties.set(false);
          this.specialtyLoadError.set(true);
        }
      });
  }

  /**
   * Retry loading specialties after error
   */
  retryLoadSpecialties(): void {
    this.loadSpecialties();
  }

  /**
   * Setup specialty dropdown search
   */
  private setupSpecialtySearch(): void {
    this.specialtySearchControl.valueChanges
      .pipe(
        debounceTime(200),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe((search) => {
        const term = (search ?? '').toLowerCase();
        this.filteredSpecialties.set(
          this.specialties().filter(
            (s) =>
              s.code.toLowerCase().includes(term) ||
              (s.description && s.description.toLowerCase().includes(term))
          )
        );
      });
  }

  /**
   * Setup city dropdown search
   */
  private setupCitySearch(): void {
    this.citySearchControl.valueChanges
      .pipe(
        debounceTime(200),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe((search) => {
        const term = (search ?? '').toLowerCase();
        this.filteredZipCodeOptions.set(
          this.zipCodeOptions().filter(
            (option) =>
              option.city.toLowerCase().includes(term) ||
              option.state.toLowerCase().includes(term)
          )
        );
      });
  }

  private lookupZipCode(zipCode: string): void {
    this.physicianService.lookupZipCode(zipCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (results: ZipCodeLookupModel[]) => {
        // Save pristine state before any programmatic updates
        const wasPristine = this.form.pristine;

        if (results && results.length > 0) {
          this.zipCodeOptions.set(results);
          this.filteredZipCodeOptions.set(results);
          this.hasInvalidZipCode.set(false); // Valid ZIP code with results

          if (results.length === 1) {
            // Single result - auto-populate city, state, and uspsId
            this.hasMultipleCityOptions.set(false);
            this.selectedUspsId.set(results[0].uspsId);
            // Remove required validator when only one city
            this.form.get('citySelect')?.clearValidators();
            this.form.get('citySelect')?.updateValueAndValidity({ emitEvent: false });
            this.form.patchValue({
              citySelect: '',
              city: results[0].city,
              state: results[0].state
            }, { emitEvent: false });
          } else {
            // Multiple results - show dropdown for city selection
            this.hasMultipleCityOptions.set(true);
            this.selectedUspsId.set(null);
            // Add required validator when multiple cities
            const citySelectControl = this.form.get('citySelect');
            citySelectControl?.setValidators([Validators.required]);
            citySelectControl?.updateValueAndValidity({ emitEvent: false });
            // Set error to display message to user (Error code 13014)
            if (citySelectControl && !citySelectControl.value) {
              citySelectControl.setErrors({ citySelectionRequired: true });
              citySelectControl.markAsTouched();
            }
            this.form.patchValue({
              citySelect: '',
              city: '',
              state: ''
            }, { emitEvent: false });
          }
        } else {
          // No results found - show warning snackbar
          this.zipCodeOptions.set([]);
          this.filteredZipCodeOptions.set([]);
          this.selectedUspsId.set(null);
          this.hasMultipleCityOptions.set(false);
          this.hasInvalidZipCode.set(true); // Invalid ZIP code - no results found
          // Remove required validator when no cities
          this.form.get('citySelect')?.clearValidators();
          this.form.get('citySelect')?.updateValueAndValidity({ emitEvent: false });
          this.form.patchValue({
            citySelect: '',
            city: '',
            state: ''
          }, { emitEvent: false });

          // Show warning message to user
          this.snackBar.open(
            `Found 0 city/state records for ZIP ${zipCode}`,
            'DISMISS',
            {
              duration: 5000,
              horizontalPosition: 'end',
              verticalPosition: 'top',
              panelClass: ['warning-snackbar']
            }
          );
        }

        // Restore pristine state after programmatic updates
        if (wasPristine) {
          this.form.markAsPristine();
        }
      }
    });
  }

  onSubmit(): void {
    this.submitted.set(true);

    // Mark all fields as touched to trigger validation display
    Object.keys(this.form.controls).forEach(key => {
      this.form.get(key)?.markAsTouched();
    });

    // Re-validate termination date for cross-field validation
    this.form.get('terminationDate')?.updateValueAndValidity();

    if (this.form.invalid) {
      const firstInvalid = document.querySelector('.ng-invalid[formControlName]') as HTMLElement;
      if (firstInvalid) {
        firstInvalid.focus();
      }
      this.showError('Please fix validation errors before saving');
      return;
    }

    // ZIP code validation
    const zipCode = this.form.get('zipCode')?.value?.trim();
    if (zipCode) {
      // Check if ZIP code is incomplete (less than 5 characters)
      if (zipCode.length < 5) {
        this.showError('Please enter all five characters for ZIP code');
        return;
      }

      // Check if ZIP code lookup returned no results (invalid ZIP)
      if (zipCode.length === 5 && this.hasInvalidZipCode()) {
        this.showError(`Found 0 city/state records for ZIP ${zipCode}`);
        return;
      }

      // Check if city selection is required but not selected
      if (zipCode.length === 5 && this.hasMultipleCityOptions() && !this.selectedUspsId()) {
        this.showError('Please select a city from the dropdown');
        return;
      }
    }

    this.isSaving.set(true);

    const formValue = this.form.getRawValue(); // Use getRawValue to include disabled fields

    if (this.isAddMode) {
      this.createPhysician(formValue);
    } else {
      this.updatePhysician(formValue);
    }
  }

  private createPhysician(formValue: any): void {
    const intlAddr = this.internationalAddress();
    const hasDomesticAddress = formValue.streetAddress?.trim() || formValue.zipCode?.trim();

    const request: CreatePhysicianRequest = {
      lastName: formValue.lastName.trim(),
      firstName: formValue.firstName?.trim() || null,
      middleName: formValue.middleName?.trim() || null,
      specialtyCode: formValue.specialtyCode || null,
      phoneNumber: formValue.phoneNumber?.trim() || null,
      streetAddress: formValue.streetAddress?.trim() || null,
      zipCode: formValue.zipCode?.trim() || null,
      uspsId: this.selectedUspsId() || null,
      effectiveDate: DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate) || '',
      terminationDate: DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate),
      comments: formValue.comments?.trim() || null,
      chapterId: this.headerService.getCurrentChapterId(),
      loggedInUserName: this.loginService.getStoredUsername() || '',
      internationalAddressId: this.internationalAddressId() || null,
      // Set intlAddrFlag: 'Y' if international address exists, 'N' if domestic address exists, null if no address
      intlAddrFlag: intlAddr !== null ? 'Y' : (hasDomesticAddress ? 'N' : null),
      // International address fields
      intlAddress1: intlAddr?.streetName || null,
      intlAddress2: intlAddr?.addr1 || null,
      intlAddress3: intlAddr?.addr2 || null,
      intlAddress4: intlAddr?.addr3 || null,
      countryName: intlAddr?.country || null,
      intlPostalCode: intlAddr?.postalCode || null,
      intlHomePhoneNo: intlAddr?.homePhoneNo || null,
      intlWorkPhoneNo: intlAddr?.workPhoneNo || null,
      intlWorkPhoneExt: intlAddr?.workPhoneExt || null,
      intlMobilePhoneNo: intlAddr?.mobilePhoneNo || null,
      intlFaxNo: intlAddr?.faxNo || null
    };

    console.log('📝 Creating physician with request:', request);

    this.physicianService.createPhysician(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (physician) => {
          console.log('✅ Physician created successfully:', physician);
          this.isSaving.set(false);
          this.saved.emit(physician);
        },
        error: (error) => {
          this.isSaving.set(false);
        }
      });
  }

  private updatePhysician(formValue: any): void {
    if (!this.physician) return;

    const intlAddr = this.internationalAddress();
    const hasDomesticAddress = formValue.streetAddress?.trim() || formValue.zipCode?.trim();

    const request: UpdatePhysicianRequest = {
      physicianId: this.physician.physicianId,
      lastName: formValue.lastName.trim(),
      firstName: formValue.firstName?.trim() || null,
      middleName: formValue.middleName?.trim() || null,
      specialtyCode: formValue.specialtyCode || null,
      phoneNumber: formValue.phoneNumber?.trim() || null,
      streetAddress: formValue.streetAddress?.trim() || null,
      zipCode: formValue.zipCode?.trim() || null,
      uspsId: this.selectedUspsId() || null,
      effectiveDate: DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate) || '',
      terminationDate: DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate),
      comments: formValue.comments?.trim() || null,
      chapterId: this.headerService.getCurrentChapterId(),
      loggedInUserName: this.loginService.getStoredUsername() || '',
      internationalAddressId: this.internationalAddressId() || null,
      // Set intlAddrFlag: 'Y' if international address exists, 'N' if domestic address exists, null if no address
      intlAddrFlag: intlAddr !== null ? 'Y' : (hasDomesticAddress ? 'N' : null),
      // International address fields
      intlAddress1: intlAddr?.streetName || null,
      intlAddress2: intlAddr?.addr1 || null,
      intlAddress3: intlAddr?.addr2 || null,
      intlAddress4: intlAddr?.addr3 || null,
      countryName: intlAddr?.country || null,
      intlPostalCode: intlAddr?.postalCode || null,
      intlHomePhoneNo: intlAddr?.homePhoneNo || null,
      intlWorkPhoneNo: intlAddr?.workPhoneNo || null,
      intlWorkPhoneExt: intlAddr?.workPhoneExt || null,
      intlMobilePhoneNo: intlAddr?.mobilePhoneNo || null,
      intlFaxNo: intlAddr?.faxNo || null
    };

    console.log('📝 Updating physician with request:', request);

    this.physicianService.updatePhysician(this.physician.physicianId, request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (physician) => {
          console.log('✅ Physician updated successfully:', physician);
          this.isSaving.set(false);
          this.saved.emit(physician);
        },
        error: (error) => {
          this.isSaving.set(false);
        }
      });
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  onClearAll(): void {
    // Reset form to empty state
    this.form.reset({
      lastName: '',
      firstName: '',
      middleName: '',
      specialtyCode: '',
      phoneNumber: '',
      streetAddress: '',
      zipCode: '',
      citySelect: '',
      city: '',
      state: '',
      effectiveDate: null,
      terminationDate: null,
      comments: ''
    });

    // Clear international address
    this.internationalAddress.set(null);
    this.internationalAddressId.set(null);

    // Clear ZIP code lookup data
    this.zipCodeOptions.set([]);
    this.filteredZipCodeOptions.set([]);
    this.hasMultipleCityOptions.set(false);
    this.selectedUspsId.set(null);

    // Remove required validator from citySelect
    this.form.get('citySelect')?.clearValidators();
    this.form.get('citySelect')?.updateValueAndValidity({ emitEvent: false });

    // Reset validation state
    this.submitted.set(false);
    this.form.markAsPristine();
    this.form.markAsUntouched();

    // Re-enable fields if in add mode
    if (this.isAddMode) {
      this.form.get('streetAddress')?.enable();
      this.form.get('zipCode')?.enable();
    }
  }

  onOpenInternationalAddress(): void {
    const dialogData: InternationalAddressDialogData = {
      existingAddress: this.internationalAddress() || undefined
      // No targetTable - non-DB mode (capture data only)
    };

    this.dialog.open(InternationalAddressDialogComponent, {
      width: '600px',
      panelClass: 'right-side-drawer',
      position: { right: '0', top: '64px' },
      height: 'calc(100vh - 64px)',
      data: dialogData
    }).afterClosed().subscribe((result: InternationalAddressModel | undefined | null) => {
      if (result) {
        // International address provided - set it and disable domestic fields
        this.internationalAddress.set(result);

        // Clear and disable domestic address fields when international address is set (in both add and edit modes)
        this.form.patchValue({
          streetAddress: '',
          zipCode: '',
          citySelect: '',
          city: '',
          state: ''
        }, { emitEvent: false });

        this.form.get('streetAddress')?.disable();
        this.form.get('zipCode')?.disable();

        // Clear ZIP code lookup state
        this.zipCodeOptions.set([]);
        this.filteredZipCodeOptions.set([]);
        this.hasMultipleCityOptions.set(false);
        this.selectedUspsId.set(null);
        this.hasInvalidZipCode.set(false);

        // Mark form as dirty to enable save button (a change has been made)
        this.form.markAsDirty();

        // Note: internationalAddressId will be set after saving the physician
        // when backend creates the address record
      } else if (result === null) {
        // International address explicitly cleared (result is null)
        // Clear the international address and re-enable domestic fields
        this.internationalAddress.set(null);
        this.internationalAddressId.set(null);

        // Re-enable domestic address fields (in both add and edit modes)
        this.form.get('streetAddress')?.enable();
        this.form.get('zipCode')?.enable();

        // Mark form as dirty to enable save button (clearing address is a change)
        this.form.markAsDirty();
      }
      // If result is undefined, dialog was cancelled - do nothing
    });
  }

  /**
   * Check if international address button should be disabled
   * In edit mode: Enable if physician has international address OR has no address at all (including form values)
   * Disable if user has started entering domestic address data
   * In add mode: Always enabled (unless domestic address is being filled)
   */
  get isInternationalAddressButtonDisabled(): boolean {
    // Check current form values for domestic address data
    const streetAddress = this.form?.get('streetAddress')?.value?.trim();
    const zipCode = this.form?.get('zipCode')?.value?.trim();
    const hasDomesticAddressInForm = streetAddress || zipCode;

    if (this.isAddMode) {
      // In add mode, disable if user has started filling domestic address
      return !!hasDomesticAddressInForm;
    }

    // In edit mode, enable if physician has international address
    if (this.physician?.hasInternationalAddress) {
      return false;
    }

    // Disable if user has started entering domestic address in the form
    if (hasDomesticAddressInForm) {
      return true;
    }

    // Also enable if physician has no address at all (no domestic and no international)
    const hasDomesticAddressOriginal = this.physician?.streetAddress || this.physician?.zipCode;
    if (!hasDomesticAddressOriginal && !this.physician?.hasInternationalAddress) {
      return false; // No address at all - enable button to add international address
    }

    // Disable if there's a domestic address in original data (to prevent mixing domestic and international)
    return true;
  }

  get f() {
    return this.form.controls;
  }

  get selectedSpecialtyDescription(): string {
    const code = this.f['specialtyCode'].value;
    if (!code) return '';
    const specialty = this.specialties().find(s => s.code === code);
    return specialty?.description || '';
  }

  get physicianFullName(): string {
    if (!this.physician) return '';
    return this.physician.physicianName;
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'DISMISS', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }

  // Date input handlers
  onEffectiveDateInput(event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value,
      this.form.get('effectiveDate')
    );
  }

  onTerminationDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value,
      this.form.get('terminationDate'),
      !this.isAddMode
    );
  }

  // Error getters for date fields
  getEffectiveDateError(): string {
    const control = this.form.get('effectiveDate');
    if (!control || !(control.touched || this.submitted())) {
      return '';
    }

    if (control.hasError('required')) {
      return 'Effective Date is required';
    }

    if (control.hasError('matDatepickerParse')) {
      return 'Effective Date is invalid';
    }

    if (control.hasError('effectiveDatePast')) {
      return 'Effective date cannot be past date (Error code: 12011)';
    }

    // Check for cross-field validation error
    if (this.form.errors?.['dateRangeInvalid']) {
      return 'Effective Date must be less than or equal to Termination Date (Error code: 1316)';
    }

    return '';
  }

  getTerminationDateError(): string {
    const control = this.form.get('terminationDate');
    if (!control || !(control.touched || this.submitted())) {
      return '';
    }

    if (control.hasError('matDatepickerParse')) {
      return 'Termination Date is invalid';
    }

    if (control.hasError('terminationDatePast')) {
      return 'Termination Date cannot be past date';
    }

    if (control.hasError('terminationBeforeEffective')) {
      return 'Termination Date must be greater than or equal to Effective Date (Error code: 8052)';
    }

    // Check for cross-field validation error
    if (this.form.errors?.['dateRangeInvalid']) {
      return 'Termination Date must be greater than or equal to Effective Date (Error code: 8052)';
    }

    return '';
  }

  /**
   * Get error message for last name field
   * Maps to error code 0080 from ErrorStore.json
   */
  getLastNameError(): string {
    const control = this.form.get('lastName');
    if (!control || !(control.touched || this.submitted())) {
      return '';
    }

    if (control.hasError('required')) {
      // Error code 0080 from Oracle Forms
      return 'Last Name is required (Error code: 0080)';
    }

    if (control.hasError('whitespaceOnly')) {
      return 'Last Name cannot be only whitespace';
    }

    return '';
  }

  // ZIP code blur handler - show snackbar if incomplete
  onZipCodeBlur(): void {
    const zipCode = this.form.get('zipCode')?.value;
    if (zipCode && zipCode.length > 0 && zipCode.length < 5) {
      this.snackBar.open(
        'Please enter all five characters for ZIP code',
        'DISMISS',
        {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['warning-snackbar']
        }
      );
    }
  }

  // Number-only input handler
  onlyNumbers(event: KeyboardEvent): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
      return false;
    }
    return true;
  }

  /**
   * Convert input text to uppercase for name fields
   * @param controlName - The form control name to convert
   */
  convertToUpperCase(controlName: string): void {
    const control = this.form.get(controlName);
    if (control) {
      const currentValue = control.value;
      if (currentValue && typeof currentValue === 'string') {
        const upperValue = currentValue.toUpperCase();
        if (currentValue !== upperValue) {
          control.setValue(upperValue, { emitEvent: false });
        }
      }
    }
  }
}
