import { Component, OnInit, OnDestroy, OnChanges, SimpleChanges, Output, EventEmitter, Input, ChangeDetectionStrategy, ChangeDetectorRef, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, Validators, ReactiveFormsModule, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { Subject, switchMap, debounceTime, takeUntil, finalize, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import moment, { Moment } from 'moment';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { MaintainDriveLocationService } from '../services/maintain-drive-location.service';
import { DriveLocation } from '../models/maintain-drive-location.model';
import { HeaderService } from '@shared/services/header.service';
import { LoginService } from '@shared/services/login.service';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner.component';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { dateFormatValidator } from 'src/app/core/utils/date-adapter.util';
import { UppercaseInputDirective } from '@shared/directives/uppercase-input.directive';

interface LocationTypeOption {
  code: string;
  description: string;
}

interface LocationOption {
  code: string;
  description: string;
}

interface SponsorOption {
  code: string;
  description: string;
}

interface HospitalOption {
  code: string;
  description: string;
}

interface DonorCarMnrOption {
  code: string;
  description: string;
}

interface FacilityOption {
  code: string;
  description: string;
}

interface CityStateOption {
  city: string;
  state: string;
  county: string;
  uspsId?: number;
}

@Component({
  selector: 'app-add-edit-drive-location',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatTabsModule,
    MatSnackBarModule,
    NgxMatSelectSearchModule,
    LoadingSpinnerComponent,
    UppercaseInputDirective
  ],
  templateUrl: './add-edit-drive-location.html',
  styleUrls: ['./add-edit-drive-location.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ]
})
export class AddEditDriveLocationComponent implements OnInit, OnChanges, OnDestroy {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() data: DriveLocation | null = null;
  @Input() internationalAddressData: any = null;

  @Output() saveSuccess = new EventEmitter<void>();
  @Output() closePanel = new EventEmitter<void>();
  @Output() openInternationalAddress = new EventEmitter<{ recordKey: string; hasUSAddressData: boolean; existingData?: any }>();

  form!: FormGroup;
  noteForm!: FormGroup;
  isSaving = signal<boolean>(false);
  isLoading = signal<boolean>(true);
  isSavingNote = false;
  panelTitle = '';
  selectedTabIndex = 0;
  driveLocationNotes: any[] = [];
  editingNoteIndex: number | null = null;
  notesModified = false;

  // Internal property to store loaded international address data in edit mode
  private loadedInternationalAddressData: any = null;

  // Dropdown options
  locationTypeOptions: LocationTypeOption[] = [];
  locationOptions: LocationOption[] = [];
  sponsorOptions: SponsorOption[] = [];
  hospitalOptions: HospitalOption[] = [];
  donorCarMnrOptions: DonorCarMnrOption[] = [];
  facilityOptions: FacilityOption[] = [];

  // Search controls for dropdowns
  locationTypeSearchCtrl = new FormControl('');
  locationSearchCtrl = new FormControl('');
  sponsorSearchCtrl = new FormControl('');
  hospitalSearchCtrl = new FormControl('');
  donorCarMnrSearchCtrl = new FormControl('');
  facilitySearchCtrl = new FormControl('');

  // Filtered options signals
  filteredLocationTypeOptions = signal<LocationTypeOption[]>([]);
  filteredLocationOptions = signal<LocationOption[]>([]);
  filteredSponsorOptions = signal<SponsorOption[]>([]);
  filteredHospitalOptions = signal<HospitalOption[]>([]);
  filteredDonorCarMnrOptions = signal<DonorCarMnrOption[]>([]);
  filteredFacilityOptions = signal<FacilityOption[]>([]);

  // City options for zip code lookup
  cityOptions = signal<CityStateOption[]>([]);
  citySearchCtrl = new FormControl('');
  private citySearch = signal('');
  filteredCityOptions = computed(() => {
    const search = this.citySearch().toLowerCase();
    const options = this.cityOptions();
    if (!search) return options;
    return options.filter(c => c.city.toLowerCase().includes(search));
  });
  private zipInput$ = new Subject<string>();
  private selectedUspsId: number | null = null;

  // Auto-populated values
  editModeValues = {
    locationTypeDescription: '',
    drawSite: '',
    sponsorDescription: '',
    hospitalDescription: '',
    staffFacilityDescription: '',
    donorCtrMnrDescription: '',
    city: '',
    state: '',
    mapsco: '',
    county: ''
  };

  // Date validation
  minDate = DateFieldValidationUtility.getMinDate();
  minEffectiveDate: Moment | null = null;
  minTerminationDate: Moment | null = null;
  minFdaLicenseDate: Moment | null = null;
  effectiveDateFilterFn: ((date: Moment | null) => boolean) | null = null;
  terminationDateFilterFn: ((date: Moment | null) => boolean) | null = null;
  fdaLicenseDateFilterFn: ((date: Moment | null) => boolean) | null = null;

  /** Tracks which date field was last changed — cross-field error shows only on that field */
  private lastChangedDateField: 'effective' | 'termination' | null = null;
  /** True when the termination date input contains text the datepicker cannot parse.
   *  Stored as a plain property so updateValueAndValidity() cannot wipe it. */
  private termDateInputHasInvalidText = false;

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEffectiveDateError());
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTerminationDateError());

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private maintainDriveLocationService: MaintainDriveLocationService,
    private headerService: HeaderService,
    private loginService: LoginService,
    private snackBar: MatSnackBar,
    private chapterTimezoneService: ChapterTimezoneService,
    private cdr: ChangeDetectorRef
  ) {
    effect(() => {
      const chapterTimezone = this.headerService.chapterTimeZone();
      if (chapterTimezone) {
        this.setupDateValidation();
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['internationalAddressData'] && this.form) {
      this.updateUSAddressFieldsState();
    }

    // Detect when data input changes (when user clicks different edit icon)
    if (changes['data'] && !changes['data'].firstChange) {
      // Data has changed - reload the form
      this.panelTitle = this.mode === 'add' ? 'Add New Drive Location' : 'Edit Drive Location';

      // Show loader
      this.isLoading.set(true);
      this.cdr.detectChanges(); // Force UI update to show loader immediately

      // Reset form and notes
      this.driveLocationNotes = [];
      this.editingNoteIndex = null;
      this.notesModified = false;
      this.selectedTabIndex = 0;
      this.loadedInternationalAddressData = null;
      this.termDateInputHasInvalidText = false;

      // Reset editModeValues to prevent showing stale data from previous record
      this.editModeValues = {
        locationTypeDescription: '',
        drawSite: '',
        sponsorDescription: '',
        hospitalDescription: '',
        staffFacilityDescription: '',
        donorCtrMnrDescription: '',
        city: '',
        state: '',
        mapsco: '',
        county: ''
      };

      // Reset city dropdown state
      this.cityOptions.set([]);
      this.citySearchCtrl.setValue('', { emitEvent: false });
      this.citySearch.set('');
      this.selectedUspsId = null;
      this.form?.get('city')?.setValue('', { emitEvent: false });
      this.form?.get('city')?.disable({ emitEvent: false });

      if (this.mode === 'edit' && this.data) {
        this.loadDriveLocationDetails();
      } else {
        // For add mode, reset the form
        this.form?.reset();
        this.noteForm?.reset();
        this.form?.get('city')?.disable({ emitEvent: false });
        this.isLoading.set(false);
      }
    }
  }

  ngOnInit(): void {
    this.panelTitle = this.mode === 'add' ? 'Add New Drive Location' : 'Edit Drive Location';
    this.setupDateValidation();
    this.loadDropdowns();
    this.initializeForm();
    this.initializeNoteForm();
    this.setupSearchFilters();
    this.citySearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.citySearch.set(value || ''));
    this.setupZipCodeLookup();
    this.setupValueChangeListeners();

    if (this.mode === 'edit' && this.data) {
      this.loadDriveLocationDetails();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupDateValidation(): void {
    const chapterTimezone = this.headerService.chapterTimeZone();
    if (!chapterTimezone) return;

    // Gap #3: Allow effective date up to 365 days in the past (Oracle: eff_date >= sysdate - 365)
    const chapterToday = DateFieldValidationUtility.getMinDate(chapterTimezone);
    const effectiveMin365 = chapterToday.clone().subtract(365, 'days');
    this.minEffectiveDate = effectiveMin365;
    this.effectiveDateFilterFn = (date: Moment | null) => {
      if (!date) return true;
      const d = moment.isMoment(date) ? date : moment(date);
      return d.isSameOrAfter(effectiveMin365, 'day');
    };

    // FDA License Date filter - no past dates allowed (unchanged)
    this.minFdaLicenseDate = DateFieldValidationUtility.getMinDate(chapterTimezone);
    this.fdaLicenseDateFilterFn = DateFieldValidationUtility.createEffectiveDateFilter(chapterTimezone);

    // Termination date filter
    this.terminationDateFilterFn = (date: Moment | null): boolean => {
      if (!date) return true;

      const chapterToday = DateFieldValidationUtility.getMinDate(chapterTimezone);
      const checkDate = moment.isMoment(date) ? date : moment(date);

      // Cannot be before chapter's today
      if (checkDate.format('YYYY-MM-DD') < chapterToday.format('YYYY-MM-DD')) {
        return false;
      }

      // Must be on or after effective date
      const effectiveDate = this.form?.get('effectiveDate')?.value;
      if (effectiveDate && moment.isMoment(effectiveDate)) {
        const effDay = moment(effectiveDate).startOf('day');
        if (checkDate.isBefore(effDay, 'day')) {
          return false;
        }
      }

      return true;
    };
  }

  private loadDropdowns(): void {
    const chapterId = this.headerService.getCurrentChapterId();
    this.isLoading.set(true);

    // In edit mode, only load Staff and Facilities (fields that remain editable)
    // Skip Location Types, Sponsors, Hospitals (read-only fields in edit mode)
    if (this.mode === 'edit') {
      forkJoin({
        staff: this.maintainDriveLocationService.getStaffLookup(chapterId).pipe(
          catchError(error => {
            console.error('Error loading staff:', error);
            return of([]);
          })
        ),
        facilities: this.maintainDriveLocationService.getFacilityLookup(chapterId).pipe(
          catchError(error => {
            console.error('Error loading facility:', error);
            return of([]);
          })
        )
      }).pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading.set(false))
      ).subscribe({
        next: (results) => {
          // Staff (Donor Ctr Mnr) options
          const staffArray = Array.isArray(results.staff) ? results.staff : [];
          this.donorCarMnrOptions = staffArray;
          this.filteredDonorCarMnrOptions.set(staffArray);

          // Facility (Staff Facility) options
          const facilitiesArray = Array.isArray(results.facilities) ? results.facilities : [];
          this.facilityOptions = facilitiesArray;
          this.filteredFacilityOptions.set(facilitiesArray);
        }
      });
      return;
    }

    // In add mode, load all lookups
    forkJoin({
      locationTypes: this.maintainDriveLocationService.getLocationTypeLookup(chapterId).pipe(
        catchError(error => {
          console.error('Error loading location types:', error);
          return of([]);
        })
      ),
      sponsors: this.maintainDriveLocationService.getSponsorLookup(chapterId).pipe(
        catchError(error => {
          console.error('Error loading sponsors:', error);
          return of([]);
        })
      ),
      hospitals: this.maintainDriveLocationService.getHospitalLookup(chapterId).pipe(
        catchError(error => {
          console.error('Error loading hospitals:', error);
          return of([]);
        })
      ),
      staff: this.maintainDriveLocationService.getStaffLookup(chapterId).pipe(
        catchError(error => {
          console.error('Error loading staff:', error);
          return of([]);
        })
      ),
      facilities: this.maintainDriveLocationService.getFacilityLookup(chapterId).pipe(
        catchError(error => {
          console.error('Error loading facility:', error);
          return of([]);
        })
      )
    }).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: (results) => {
        // Location Type options
        const locationTypesArray = Array.isArray(results.locationTypes) ? results.locationTypes : [];
        this.locationTypeOptions = locationTypesArray;
        this.filteredLocationTypeOptions.set(locationTypesArray);

        // Sponsor options
        const sponsorsArray = Array.isArray(results.sponsors) ? results.sponsors : [];
        this.sponsorOptions = sponsorsArray;
        this.filteredSponsorOptions.set(sponsorsArray);

        // Hospital options
        const hospitalsArray = Array.isArray(results.hospitals) ? results.hospitals : [];
        this.hospitalOptions = hospitalsArray;
        this.filteredHospitalOptions.set(hospitalsArray);

        // Staff (Donor Ctr Mnr) options
        const staffArray = Array.isArray(results.staff) ? results.staff : [];
        this.donorCarMnrOptions = staffArray;
        this.filteredDonorCarMnrOptions.set(staffArray);

        // Facility (Staff Facility) options
        const facilitiesArray = Array.isArray(results.facilities) ? results.facilities : [];
        this.facilityOptions = facilitiesArray;
        this.filteredFacilityOptions.set(facilitiesArray);
      }
    });
  }

  private loadLocationOptions(locationType: string, callbackAfterLoad?: () => void): void {
    const chapterId = this.headerService.getCurrentChapterId();

    this.maintainDriveLocationService.getLocationLookup(chapterId, locationType, '')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: any) => {
          const dataArray = Array.isArray(data) ? data : [];
          this.locationOptions = dataArray;
          this.filteredLocationOptions.set(dataArray);

          // Execute callback after options are loaded (used in edit mode)
          if (callbackAfterLoad) {
            callbackAfterLoad();
          }
        },
        error: (error: any) => {
          console.error('Error loading locations:', error);
          this.locationOptions = [];
          this.filteredLocationOptions.set([]);
        }
      });
  }

  /**
   * Validator that catches when Angular Material can't parse the date input
   * This is needed for optional date fields (FDA License Date, Termination Date)
   * because without 'required' validator, unparseable input doesn't make the control invalid
   */
  private unparseableDateValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      // If there's a value but it's not a valid moment object, it's invalid
      if (control.value && !moment.isMoment(control.value) && !moment(control.value).isValid()) {
        return { invalidDateInput: true };
      }

      // If control is dirty, touched, and null after user typed something, it's invalid
      // This catches the case where user typed something but datepicker couldn't parse it
      if (control.value === null && control.touched && control.dirty) {
        // Check if the native input has a value (user typed something invalid)
        const nativeElement = (control as any)._elementRef?.nativeElement;
        if (nativeElement?.value && nativeElement.value.trim() !== '') {
          return { invalidDateInput: true };
        }
      }

      // If value is null/empty and field is empty, it's valid (cleared field)
      return null;
    };
  }

  /** Validates that the value is a valid HH:MM 24-hour time after blur normalization. */
  private timeFormatValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = (control.value ?? '').toString().trim();
      if (!value) return null; // optional field
      const match = value.match(/^(\d{2}):(\d{2})$/);
      if (!match) return { invalidTimeFormat: true };
      const h = parseInt(match[1], 10);
      const m = parseInt(match[2], 10);
      if (h > 23 || m > 59) return { invalidTimeFormat: true };
      return null;
    };
  }

  /**
   * Validator to ensure time close is not before time open
   */
  private timeRangeValidator(): ValidatorFn {
    return (formGroup: AbstractControl): ValidationErrors | null => {
      const timeOpenControl = formGroup.get('timeOpen');
      const timeCloseControl = formGroup.get('timeClose');

      const timeOpen = timeOpenControl?.value;
      const timeClose = timeCloseControl?.value;

      // Clear any previous error on timeClose
      if (timeCloseControl?.hasError('timeCloseBeforeOpen')) {
        const errors = { ...timeCloseControl.errors };
        delete errors['timeCloseBeforeOpen'];
        timeCloseControl.setErrors(Object.keys(errors).length > 0 ? errors : null);
      }

      // Only validate if both times are provided
      if (!timeOpen || !timeClose) {
        return null;
      }

      // Time inputs return HH:MM format in 24-hour time
      // Compare as strings since format is consistent
      const openTime = timeOpen.toString().trim();
      const closeTime = timeClose.toString().trim();

      // String comparison works for HH:MM format
      if (closeTime < openTime) {
        // Set error on timeClose control so mat-error will display
        timeCloseControl?.setErrors({
          ...timeCloseControl.errors,
          timeCloseBeforeOpen: true
        });
        return { timeCloseBeforeOpen: true };
      }

      return null;
    };
  }

  /** Gap #2: Oracle WHEN-VALIDATE-ITEM — must contain ≥1 alpha, ≥1 digit, only A-Z/0-9/'-' */
  private mapscoFormatValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = (control.value ?? '').toString().trim();
      if (!value) return null;
      if (!/[A-Za-z]/.test(value)) return { mapscoMissingAlpha: true };
      if (!/[0-9]/.test(value)) return { mapscoMissingDigit: true };
      if (!/^[A-Za-z0-9-]+$/.test(value)) return { mapscoInvalidChars: true };
      return null;
    };
  }

  private initializeForm(): void {
    const chapterTimezone = this.headerService.chapterTimeZone();

    this.form = this.fb.group({
      // Draw Site Details Tab
      locationType: ['', Validators.required],
      locationId: [{ value: '', disabled: true }],
      drawSite: ['', [Validators.required, Validators.maxLength(50)]],
      sponsorId: [''],
      hospitalId: [''],
      travelTime: ['', [Validators.required, Validators.pattern(/^[0-9]{1,3}$/)]],
      distance: ['', [Validators.required, Validators.pattern(/^(\d{1,3}(\.\d{0,2})?)$/)]],
      fdaLicenseDate: [null, [
        dateFormatValidator(),
        DateFieldValidationUtility.validDateValidator(),
        DateFieldValidationUtility.effectiveDateNotPastValidator(chapterTimezone)
      ]],
      timeOpen: ['', this.timeFormatValidator()],
      timeClose: ['', this.timeFormatValidator()],
      rotationFlag: [''],
      staffFacility: ['', Validators.required],
      effectiveDate: [null, [Validators.required]],
      terminationDate: [null],
      donorCtrMnr: [''],
      directionNotes: ['', Validators.maxLength(500)],

      // Additional Details Tab
      locationName: ['', [Validators.required, Validators.maxLength(50)]],
      street: ['', [Validators.required, Validators.maxLength(50)]],
      suitApt: ['', Validators.maxLength(10)],
      city: [{ value: '', disabled: true }],
      zip: ['', [Validators.maxLength(5), Validators.pattern(/^$|^\d{5}$/)]],
      zipExtension: ['', [Validators.maxLength(4), Validators.pattern(/^\d*$/)]],
      mapsco: ['', [Validators.maxLength(10), this.mapscoFormatValidator()]],
      phoneAreaCode: ['', [Validators.maxLength(3), Validators.pattern(/^\d{0,3}$/)]],
      phoneNumber: ['', [Validators.pattern(/^$|^(\d{7}|\d{3}-\d{4})$/)]],
      phoneExtension: ['', [Validators.maxLength(6), Validators.pattern(/^\d*$/)]],
      faxAreaCode: ['', [Validators.maxLength(3), Validators.pattern(/^\d{0,3}$/)]],
      faxNumber: ['', [Validators.pattern(/^$|^(\d{7}|\d{3}-\d{4})$/)]],
      email: ['', [Validators.maxLength(128), Validators.pattern(/^$|^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)]],
      web: ['', [Validators.maxLength(128), Validators.pattern(/^$|^(https?:\/\/)?(www\.)?[\w\-]+(\.[\w\-]+)+[/#?]?.*$/i)]]
    }, {
      validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate'), this.timeRangeValidator()]
    });

    // Setup date validators based on mode
    if (this.mode === 'add') {
      DateFieldValidationUtility.setupAddModeValidators(this.form, this.headerService.chapterTimeZone());
      // Gap #3: Replace effectiveDateNotPastValidator with one allowing up to 365 days in past.
      // matDatepickerMin (from [min]="minEffectiveDate") handles the -365 boundary.
      const effDateCtrl = this.form.get('effectiveDate');
      effDateCtrl?.clearValidators();
      effDateCtrl?.addValidators([
        Validators.required,
        dateFormatValidator(),
        DateFieldValidationUtility.validDateValidator()
      ]);
      effDateCtrl?.updateValueAndValidity({ emitEvent: false });

      // locationId is display-only in add mode — remove required validator so the
      // enabled-but-empty control does not block form validity
      this.form.get('locationId')?.clearValidators();
      this.form.get('locationId')?.updateValueAndValidity({ emitEvent: false });
    } else {
      DateFieldValidationUtility.setupEditModeValidators(this.form);
    }

    // Track which date field was last changed for cross-field error display
    this.form.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => { this.lastChangedDateField = 'effective'; });

    this.form.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => { this.lastChangedDateField = 'termination'; });

    // Setup min termination date based on effective date
    this.form.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((effDate: Moment | null) => {
        if (effDate && moment.isMoment(effDate)) {
          this.minTerminationDate = moment(effDate).startOf('day');
        } else {
          const chapterTimezone = this.headerService.chapterTimeZone();
          this.minTerminationDate = DateFieldValidationUtility.getMinDate(chapterTimezone);
        }
        this.form.get('terminationDate')?.updateValueAndValidity();
      });

    // Update validation when termination date changes
    this.form.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value: Moment | null) => {
        // A successfully parsed date clears the "invalid text" tracking flag
        if (value && moment.isMoment(value)) {
          this.termDateInputHasInvalidText = false;
        }
        // Update form-level validation to trigger date range validator
        this.form.updateValueAndValidity({ emitEvent: false });
        // Trigger change detection for OnPush
        this.cdr.detectChanges();
      });

    // Update time close validation when time open changes
    this.form.get('timeOpen')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Update form-level validation
        this.form.updateValueAndValidity({ emitEvent: false });
        // Mark time close as dirty to trigger error display
        const timeCloseControl = this.form.get('timeClose');
        if (timeCloseControl?.value) {
          timeCloseControl.markAsDirty();
        }
        // Trigger change detection for OnPush
        this.cdr.detectChanges();
      });

    // Update validation when time close changes
    this.form.get('timeClose')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Update form-level validation
        this.form.updateValueAndValidity({ emitEvent: false });
        // Mark as dirty to show errors
        this.form.get('timeClose')?.markAsDirty();
        // Trigger change detection for OnPush
        this.cdr.detectChanges();
      });
  }


  private initializeNoteForm(): void {
    this.noteForm = this.fb.group({
      noteText: ['', [Validators.maxLength(240)]]
    });
  }

  private setupSearchFilters(): void {
    // Location Type Search
    this.locationTypeSearchCtrl.valueChanges
      .pipe(debounceTime(200), takeUntil(this.destroy$))
      .subscribe((searchTerm) => {
        this.filterLocationTypes(searchTerm || '');
      });

    // Location Search
    this.locationSearchCtrl.valueChanges
      .pipe(debounceTime(200), takeUntil(this.destroy$))
      .subscribe((searchTerm) => {
        this.filterLocations(searchTerm || '');
      });

    // Sponsor Search
    this.sponsorSearchCtrl.valueChanges
      .pipe(debounceTime(200), takeUntil(this.destroy$))
      .subscribe((searchTerm) => {
        this.filterSponsors(searchTerm || '');
      });

    // Hospital Search
    this.hospitalSearchCtrl.valueChanges
      .pipe(debounceTime(200), takeUntil(this.destroy$))
      .subscribe((searchTerm) => {
        this.filterHospitals(searchTerm || '');
      });

    // Donor Car Mnr Search
    this.donorCarMnrSearchCtrl.valueChanges
      .pipe(debounceTime(200), takeUntil(this.destroy$))
      .subscribe((searchTerm) => {
        this.filterDonorCarMnr(searchTerm || '');
      });

    // Facility Search
    this.facilitySearchCtrl.valueChanges
      .pipe(debounceTime(200), takeUntil(this.destroy$))
      .subscribe((searchTerm) => {
        this.filterFacility(searchTerm || '');
      });
  }

  private filterLocationTypes(searchTerm: string): void {
    const search = searchTerm.toLowerCase();
    const filtered = this.locationTypeOptions.filter(opt =>
      opt.code.toLowerCase().includes(search) ||
      opt.description.toLowerCase().includes(search)
    );
    this.filteredLocationTypeOptions.set(filtered);
  }

  private filterLocations(searchTerm: string): void {
    const search = searchTerm.toLowerCase();
    const filtered = this.locationOptions.filter(opt =>
      opt.code.toLowerCase().includes(search) ||
      opt.description.toLowerCase().includes(search)
    );
    this.filteredLocationOptions.set(filtered);
  }

  private filterSponsors(searchTerm: string): void {
    const search = searchTerm.toLowerCase();
    const filtered = this.sponsorOptions.filter(opt =>
      opt.code.toLowerCase().includes(search) ||
      opt.description.toLowerCase().includes(search)
    );
    this.filteredSponsorOptions.set(filtered);
  }

  private filterHospitals(searchTerm: string): void {
    const search = searchTerm.toLowerCase();
    const filtered = this.hospitalOptions.filter(opt =>
      opt.code.toLowerCase().includes(search) ||
      opt.description.toLowerCase().includes(search)
    );
    this.filteredHospitalOptions.set(filtered);
  }

  private filterDonorCarMnr(searchTerm: string): void {
    const search = searchTerm.toLowerCase();
    const filtered = this.donorCarMnrOptions.filter(opt =>
      opt.code.toLowerCase().includes(search) ||
      opt.description.toLowerCase().includes(search)
    );
    this.filteredDonorCarMnrOptions.set(filtered);
  }

  private filterFacility(searchTerm: string): void {
    const search = searchTerm.toLowerCase();
    const filtered = this.facilityOptions.filter(opt =>
      opt.code.toLowerCase().includes(search) ||
      opt.description.toLowerCase().includes(search)
    );
    this.filteredFacilityOptions.set(filtered);
  }

  private setupValueChangeListeners(): void {
    // Listen to form value changes to trigger change detection for OnPush strategy
    // This ensures isFormValid getter re-evaluates when any field changes
    this.form.valueChanges
      .pipe(debounceTime(100), takeUntil(this.destroy$))
      .subscribe(() => {
        this.cdr.detectChanges();
      });

    // Requirement 1: Location type auto-populates description and loads location dropdown
    this.form.get('locationType')?.valueChanges
      .pipe(debounceTime(100), takeUntil(this.destroy$))
      .subscribe((locationType: string) => {
        // Skip in edit mode - these fields are disabled and values come from API
        if (this.mode === 'edit') return;

        if (locationType) {
          const selected = this.locationTypeOptions.find(opt => opt.code === locationType);
          if (selected) {
            this.editModeValues.locationTypeDescription = selected.description;
          }
        } else {
          this.editModeValues.locationTypeDescription = '';
        }

        // Clear location ID when location type changes
        this.form.get('locationId')?.setValue('', { emitEvent: false });
        this.editModeValues.drawSite = '';
      });

    // Location ID auto-populates draw site
    this.form.get('locationId')?.valueChanges
      .pipe(debounceTime(100), takeUntil(this.destroy$))
      .subscribe((locationId: string) => {
        // Skip in edit mode - these fields are disabled and values come from API
        if (this.mode === 'edit') return;

        if (locationId) {
          const selected = this.locationOptions.find(opt => opt.code === locationId);
          if (selected) {
            this.editModeValues.drawSite = selected.description;
          }

          // Load existing notes for this location ID in add mode
          this.loadNotesForLocation(locationId);
        } else {
          this.editModeValues.drawSite = '';
          // Clear notes when location ID is cleared
          this.driveLocationNotes = [];
        }
      });

    // Requirement 2: Sponsor auto-populates description
    this.form.get('sponsorId')?.valueChanges
      .pipe(debounceTime(100), takeUntil(this.destroy$))
      .subscribe((sponsorId: string) => {
        // Skip in edit mode - these fields are disabled and values come from API
        if (this.mode === 'edit') return;

        if (sponsorId) {
          const selected = this.sponsorOptions.find(opt => opt.code === sponsorId);
          if (selected) {
            this.editModeValues.sponsorDescription = selected.description;
          }
        } else {
          this.editModeValues.sponsorDescription = '';
        }
      });

    // Requirement 3: Hospital ID auto-populates description
    this.form.get('hospitalId')?.valueChanges
      .pipe(debounceTime(100), takeUntil(this.destroy$))
      .subscribe((hospitalId: string) => {
        // Skip in edit mode - these fields are disabled and values come from API
        if (this.mode === 'edit') return;

        if (hospitalId) {
          const selected = this.hospitalOptions.find(opt => opt.code === hospitalId);
          if (selected) {
            this.editModeValues.hospitalDescription = selected.description;
          }
        } else {
          this.editModeValues.hospitalDescription = '';
        }
      });

    // Additional Details: Zip triggers city lookup via switchMap (see setupZipCodeLookup)
    this.form.get('zip')?.valueChanges
      .pipe(debounceTime(300), takeUntil(this.destroy$))
      .subscribe((zipCode: string) => {
        const trimmedZip = zipCode?.trim() || '';
        // Clear zipNotFound whenever user changes the zip value (Gap #5)
        const zipCtrl = this.form.get('zip');
        if (zipCtrl?.hasError('zipNotFound')) {
          const { zipNotFound: _, ...rest } = zipCtrl.errors ?? {};
          zipCtrl.setErrors(Object.keys(rest).length > 0 ? rest : null);
        }
        if (trimmedZip.length === 5 && /^\d{5}$/.test(trimmedZip)) {
          this.zipInput$.next(trimmedZip);
        } else {
          this.zipInput$.next('');
          const cityCtrl = this.form.get('city');
          cityCtrl?.disable({ emitEvent: false });
          cityCtrl?.setValue('', { emitEvent: false });
          this.cityOptions.set([]);
          this.selectedUspsId = null;
          this.editModeValues.city = '';
          this.editModeValues.state = '';
          this.editModeValues.county = '';
          this.cdr.detectChanges();
        }
      });

    // City selection updates state and county
    this.form.get('city')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((selectedCity: string) => {
        const match = this.cityOptions().find(o => o.city === selectedCity);
        if (match) {
          this.editModeValues.city = match.city;
          this.editModeValues.state = match.state;
          this.editModeValues.county = match.county;
          this.selectedUspsId = match.uspsId ?? null;
          this.cdr.detectChanges();
        }
      });
  }

  private setupZipCodeLookup(): void {
    const cityCtrl = this.form.get('city')!;

    this.zipInput$
      .pipe(
        takeUntil(this.destroy$),
        switchMap(zipCode => {
          // null sentinel means zip was cleared — skip lookup, no error
          if (!zipCode) return of(null as any);
          return this.maintainDriveLocationService.getCityStateByZipCode(zipCode).pipe(
            // undefined sentinel means API error — silently disable city, no "not found" error
            catchError(() => of(undefined as any))
          );
        })
      )
      .subscribe({
        next: (data: any) => {
          if (data === null || data === undefined) {
            // null = zip cleared; undefined = API error — reset city silently, no zipNotFound error
            cityCtrl.disable({ emitEvent: false });
            cityCtrl.setValue('', { emitEvent: false });
            this.cityOptions.set([]);
            this.selectedUspsId = null;
            this.editModeValues.city = '';
            this.editModeValues.state = '';
            this.editModeValues.county = '';
            this.cdr.detectChanges();
            return;
          }

          const options: CityStateOption[] = Array.isArray(data) ? data.map((d: any) => ({
            city: d.city || '',
            state: d.state || '',
            county: d.country || '',
            uspsId: d.uspsId
          })) : [];
          this.cityOptions.set(options);

          if (options.length > 0) {
            // Clear any lingering zipNotFound error
            const zipCtrl = this.form.get('zip');
            if (zipCtrl?.hasError('zipNotFound')) {
              const { zipNotFound: _, ...rest } = zipCtrl.errors ?? {};
              zipCtrl.setErrors(Object.keys(rest).length > 0 ? rest : null);
            }
            cityCtrl.enable({ emitEvent: false });
            if (options.length === 1) {
              cityCtrl.setValue(options[0].city, { emitEvent: false });
              this.editModeValues.city = options[0].city;
              this.editModeValues.state = options[0].state;
              this.editModeValues.county = options[0].county;
              this.selectedUspsId = options[0].uspsId ?? null;
            } else {
              cityCtrl.setValue('', { emitEvent: false });
              this.editModeValues.city = '';
              this.editModeValues.state = '';
              this.editModeValues.county = '';
              this.selectedUspsId = null;
            }
          } else {
            // Gap #5: Valid zip returned no cities — show error on zip field
            cityCtrl.disable({ emitEvent: false });
            cityCtrl.setValue('', { emitEvent: false });
            this.editModeValues.city = '';
            this.editModeValues.state = '';
            this.editModeValues.county = '';
            this.selectedUspsId = null;
            const zipCtrl = this.form.get('zip');
            if (zipCtrl) {
              zipCtrl.setErrors({ ...(zipCtrl.errors ?? {}), zipNotFound: true });
              zipCtrl.markAsTouched();
            }
          }
          this.cdr.detectChanges();
        }
      });
  }

  /**
   * Load existing notes for a location ID in add mode
   */
  private loadNotesForLocation(locationId: string): void {
    if (!locationId || this.mode !== 'add') return;

    const chapterId = this.headerService.getCurrentChapterId();

    this.maintainDriveLocationService.getLocationNotes(locationId, chapterId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (notes: any[]) => {
          if (notes && Array.isArray(notes) && notes.length > 0) {
            this.driveLocationNotes = notes.map((note: any) => ({
              noteId: note.noteId || note.noteSequence || null,
              noteText: note.note,
              createdBy: note.insertUserName || note.insertUser || 'System',
              createdDate: note.insertDate,
              version: `${note.noteSequence}.0`,
              auditKey: note.auditKey || null,
              isDeleted: false
            }));
            this.notesModified = false; // Existing notes don't count as modifications
            this.cdr.detectChanges();
          } else {
            // No existing notes for this location
            this.driveLocationNotes = [];
          }
        },
        error: (error: any) => {
          console.error('Error loading notes for location:', error);
          // Don't show error to user - just keep notes array empty
          this.driveLocationNotes = [];
        }
      });
  }

  /**
   * Load full drive location details from API for edit mode
   */
  private loadDriveLocationDetails(): void {
    if (!this.data || !this.data.locationId) return;

    const chapterId = this.headerService.getCurrentChapterId();
    const locationId = this.data.locationId;

    // Keep loading state from initial dropdown loading
    this.maintainDriveLocationService.getDriveLocationDetails(locationId, chapterId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (details: any) => {
          // Update data with full details from API
          this.data = {
            ...this.data,
            ...details,
            // Map API fields to component model
            travelDistance: details.travelDistance,
            openTime: details.openTime,
            closeTime: details.closeTime,
            effDate: details.effDate,
            termDate: details.termDate,
            siteDirections: details.siteDirections,
            hospitalId: details.nearestHospitalId,
            donorCtrMnr: details.siteManager
          };

          // Load notes if available
          if (details.notes && Array.isArray(details.notes)) {
            this.driveLocationNotes = details.notes.map((note: any) => ({
              noteId: note.noteId || note.noteSequence || null,
              noteText: note.note,
              createdBy: note.insertUserName || note.insertUser || 'System',
              createdDate: note.insertDate,
              version: `${note.noteSequence}.0`,
              auditKey: note.auditKey || null,
              isDeleted: false
            }));
          }
          this.notesModified = false;

          // Populate form with full details
          this.populateFormForEdit(details);
        },
        error: (error: any) => {
          console.error('Error loading drive location details:', error);
          this.snackBar.open('Error loading drive location details', 'DISMISS', {
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
          // Fallback to grid data
          this.populateFormForEdit();
        }
      });
  }

  private populateFormForEdit(apiDetails?: any): void {
    if (!this.data) return;

    // Use API details if provided, otherwise use grid data
    const details = apiDetails || this.data;
    const address = details.address || {};

    // Helper to extract time from various API formats -> "HH:MM" for <input type="time">
    // Gap #6: When parsing ISO date strings, convert UTC to chapter local time
    const extractTime = (datetime: string | undefined): string => {
      if (!datetime) return '';
      const s = String(datetime).trim();
      // HHMM four-digit Oracle format: "2300" → "23:00"
      if (/^\d{4}$/.test(s)) {
        return `${s.substring(0, 2)}:${s.substring(2, 4)}`;
      }
      // Already HH:MM or HH:MM:SS (plain time string, no timezone conversion needed)
      if (/^\d{2}:\d{2}/.test(s)) {
        return s.substring(0, 5);
      }
      try {
        // Append Z if absent: .NET/Dapper serializes Oracle DATE with DateTimeKind.Unspecified
        // (no Z suffix), which JS would parse as browser-local time instead of UTC.
        const normalized = s.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(s) ? s : s + 'Z';
        const date = new Date(normalized);
        if (isNaN(date.getTime())) return '';
        const offsetMinutes = this.chapterTimezoneService.getChapterUtcOffsetMinutes();
        if (offsetMinutes !== null) {
          const utcMins = date.getUTCHours() * 60 + date.getUTCMinutes();
          const localMins = ((utcMins + offsetMinutes) % 1440 + 1440) % 1440;
          return `${String(Math.floor(localMins / 60)).padStart(2, '0')}:${String(localMins % 60).padStart(2, '0')}`;
        }
        const hours = String(date.getUTCHours()).padStart(2, '0');
        const minutes = String(date.getUTCMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
      } catch {
        return '';
      }
    };

    // Zip and zipExtension come as separate fields in response
    // Convert to string to handle both string and number types from API
    const zip = address.zip != null ? String(address.zip) : '';
    const zipExtension = address.zipExtension != null ? String(address.zipExtension) : '';

    // Phone and fax fields from API response
    // Convert to string to handle both string and number types from API
    const phoneAreaCode = address.dAreaCode != null ? String(address.dAreaCode) : '';
    const phoneNum = address.dPhoneNo != null ? String(address.dPhoneNo) : '';
    const phoneExt = address.extension != null ? String(address.extension) : '';
    const faxAreaCode = address.fAreaCode != null ? String(address.fAreaCode) : '';
    const faxNum = address.fPhoneNo != null ? String(address.fPhoneNo) : '';

    // Populate all fields
    this.form.patchValue({
      // Draw Site Details
      sponsorId: details.sponsorId || this.data.sponsorId,
      hospitalId: details.nearestHospitalId || details.hospitalId || this.data.hospitalId,
      travelTime: details.travelTime || this.data.travelTime,
      distance: details.travelDistance || this.data.travelDistance,
      fdaLicenseDate: details.fdaLicenseDate ? moment(details.fdaLicenseDate) : (this.data.fdaLicenseDate ? moment(this.data.fdaLicenseDate) : null),
      timeOpen: extractTime(details.openTime) || extractTime(this.data.openTime),
      timeClose: extractTime(details.closeTime) || extractTime(this.data.closeTime),
      rotationFlag: details.rotationFlag || this.data.rotationFlag,
      staffFacility: details.staffFacility || this.data.staffFacility,
      effectiveDate: details.effDate ? moment(details.effDate) : (this.data.effDate ? moment(this.data.effDate) : null),
      terminationDate: details.termDate ? moment(details.termDate) : (this.data.termDate ? moment(this.data.termDate) : null),
      donorCtrMnr: details.siteManager || '',
      directionNotes: details.siteDirections || this.data.siteDirections,

      // Additional Details - Address fields
      // locationName field in form maps to address.address1 from API (exact match only)
      locationName: address.address1 || '',
      // street field in form maps to address.streetName from API (exact match only)
      street: address.streetName || '',
      // suitApt field in form maps to address.suiteApt from API (exact match only)
      suitApt: address.suiteApt || '',
      zipExtension: zipExtension,
      mapsco: address.mapsco != null ? String(address.mapsco) : '',
      phoneAreaCode: phoneAreaCode,
      phoneNumber: phoneNum,
      phoneExtension: phoneExt,
      faxAreaCode: faxAreaCode,
      faxNumber: faxNum,
      email: address.email || '',
      web: address.webAddress || ''
    });

    // Set zip without emitting so the valueChanges listener doesn't trigger
    // setupZipCodeLookup() via zipInput$. The city lookup below handles pre-selection.
    this.form.get('zip')?.setValue(zip, { emitEvent: false });

    // Set auto-populated address fields
    this.editModeValues.city = address.city || '';
    this.editModeValues.state = address.state || '';
    this.editModeValues.county = address.county || '';
    this.editModeValues.mapsco = ''; // Not in API response

    // Populate city options for the existing zip so the dropdown has options
    const existingCityName = address.city || '';
    const existingUspsId: number | undefined = address.uspsId;
    if (zip && /^\d{5}$/.test(zip)) {
      this.maintainDriveLocationService.getCityStateByZipCode(zip)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (data: any) => {
            const options: CityStateOption[] = Array.isArray(data) ? data.map((d: any) => ({
              city: d.city || '',
              state: d.state || '',
              county: d.country || '',
              uspsId: d.uspsId
            })) : [];
            this.cityOptions.set(options);
            const cityCtrl = this.form.get('city');
            if (options.length > 0) {
              cityCtrl?.enable({ emitEvent: false });
              const match = options.find(o => o.uspsId != null && o.uspsId === existingUspsId)
                         || options.find(o => o.city === existingCityName)
                         || options[0];
              cityCtrl?.setValue(match.city, { emitEvent: false });
              this.editModeValues.city = match.city;
              this.editModeValues.state = match.state;
              this.editModeValues.county = match.county;
              this.selectedUspsId = match.uspsId ?? null;
            }
            this.cdr.detectChanges();
          }
        });
    }

    // Load international address data if exists (store in internal property for edit mode)
    if (address.intlAddrFlag === 'Y') {
      this.loadedInternationalAddressData = {
        intlAddrFlag: 'Y',
        intlAddress1: address.intlAddress1 || null,
        intlAddress2: address.intlAddress2 || null,
        intlAddress3: address.intlAddress3 || null,
        intlAddress4: address.intlAddress4 || null,
        countryName: address.countryName || null,
        intlPostalCode: address.intlPostalCode || null,
        intlHomePhoneNo: address.intlHomePhoneNo || null,
        intlWorkPhoneNo: address.intlWorkPhoneNo || null,
        intlWorkPhoneExt: address.intlWorkPhoneExt || null,
        intlMobilePhoneNo: address.intlMobilePhoneNo || null,
        intlFaxNo: address.intlFaxNo || null,
        intlEmail: address.intlEmail || null
      };
    } else {
      this.loadedInternationalAddressData = null;
    }

    // Store edit mode display values for read-only fields
    // All descriptions come from the API response
    this.editModeValues.locationTypeDescription = details.locationTypeDescription || '';
    this.editModeValues.drawSite = details.locationName || '';
    this.editModeValues.sponsorDescription = details.sponsorName || '';
    this.editModeValues.hospitalDescription = details.nearestHospitalName || '';
    this.editModeValues.staffFacilityDescription = details.staffFacilityDescription || '';
    this.editModeValues.donorCtrMnrDescription = details.siteManagerName || '';

    // Disable fields that should be read-only in edit mode
    // Only these fields are disabled - others remain editable:
    // travelTime, distance, timeOpen, timeClose, rotationFlag,
    // staffFacility, terminationDate, donorCtrMnr, directionNotes
    this.form.get('locationType')?.disable();
    this.form.get('locationId')?.disable();
    this.form.get('sponsorId')?.disable();
    this.form.get('hospitalId')?.disable();
    this.form.get('fdaLicenseDate')?.disable();
    this.form.get('effectiveDate')?.disable();

    // Set location type and location ID values (no API call needed)
    const locationTypeToUse = details.locationType || this.data.locationType;
    const locationIdToSet = details.locationId || this.data.locationId;

    this.form.patchValue({
      locationType: locationTypeToUse,
      locationId: locationIdToSet
    }, { emitEvent: false });

    // Mark form as pristine after loading data so that subsequent changes will mark it as dirty
    this.form.markAsPristine();

    // Trigger change detection to update UI (required for OnPush strategy)
    this.cdr.detectChanges();
  }

  private focusFirstInvalidField(): void {
    const firstInvalidKey = Object.keys(this.form.controls).find(
      key => this.form.controls[key].invalid && this.form.controls[key].enabled
    );
    if (firstInvalidKey) {
      const el = document.querySelector(`[formControlName="${firstInvalidKey}"]`) as HTMLElement;
      if (el) el.focus();
    }
  }

  onSave(): void {
    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'terminationDate');
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'fdaLicenseDate');

    // In edit mode, allow saving even if form has validation errors (like empty optional fields)
    // In add mode, check if form is invalid
    if (this.mode === 'add' && this.form.invalid) {
      this.focusFirstInvalidField();
      return;
    }

    // In edit mode, block if there are critical errors or required field validation errors
    if (this.mode === 'edit') {
      // Check for date range errors
      if (this.form.hasError('dateRangeInvalid')) {
        this.form.markAllAsTouched();
        this.focusFirstInvalidField();
        return;
      }

      // Check if travel time or distance have pattern errors (negative values)
      const travelTimeControl = this.form.get('travelTime');
      const distanceControl = this.form.get('distance');

      if (travelTimeControl?.hasError('pattern') || travelTimeControl?.hasError('required') ||
          distanceControl?.hasError('pattern') || distanceControl?.hasError('required')) {
        this.form.markAllAsTouched();
        this.focusFirstInvalidField();
        return;
      }
    }

    if (this.isSaving()) {
      return;
    }

    this.isSaving.set(true);

    const payload = this.buildPayload();

    this.maintainDriveLocationService.upsertDriveLocation(payload)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isSaving.set(false))
      )
      .subscribe({
        next: (response: any) => {
          const locationId = this.form.get('locationId')?.value || this.data?.locationId || '';
          const message = this.mode === 'add'
            ? (response?.message || `Drive location ${locationId} added successfully.`)
            : `Drive location ${locationId} updated successfully.`;
          this.snackBar.open(message, 'DISMISS', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });
          this.notesModified = false;
          this.saveSuccess.emit();
          this.closePanel.emit();
        },
        error: (error) => {
          console.error('[AddEditDriveLocation] Save error:', error);
          const errorMessage = this.extractErrorMessage(error, 'Error saving drive location');
          this.snackBar.open(errorMessage, 'DISMISS', {
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
          // Drawer stays open for user to fix errors
          // Snackbar stays open until user clicks DISMISS
        }
      });
  }

  onClearAll(): void {
    this.form.reset();
    this.noteForm.reset();
    this.driveLocationNotes = [];
    this.editingNoteIndex = null;
    this.notesModified = false;
    this.termDateInputHasInvalidText = false;

    this.editModeValues = {
      locationTypeDescription: '',
      drawSite: '',
      sponsorDescription: '',
      hospitalDescription: '',
      staffFacilityDescription: '',
      donorCtrMnrDescription: '',
      city: '',
      state: '',
      mapsco: '',
      county: ''
    };

    // Reset search controls
    this.locationTypeSearchCtrl.reset();
    this.locationSearchCtrl.reset();
    this.sponsorSearchCtrl.reset();
    this.hospitalSearchCtrl.reset();
    this.donorCarMnrSearchCtrl.reset();
    this.facilitySearchCtrl.reset();

    // Clear location options
    this.locationOptions = [];
    this.filteredLocationOptions.set([]);
  }

  private buildPayload(): any {
    // Use getRawValue() to include disabled fields in edit mode
    const formValue = this.form.getRawValue();

    // Gap #1: Convert chapter-local HH:MM to UTC HH:MM before sending to API
    // Oracle GET_GMT_TIME stores UTC; GET_LOCAL_TIME converts back for display
    const convertLocalTimeToUtc = (localHHMM: string | null): string | null => {
      if (!localHHMM || !/^\d{2}:\d{2}$/.test(localHHMM)) return localHHMM || null;
      const offsetMinutes = this.chapterTimezoneService.getChapterUtcOffsetMinutes();
      if (offsetMinutes === null) return localHHMM;
      const [h, m] = localHHMM.split(':').map(Number);
      const utcMins = (((h * 60 + m) - offsetMinutes) % 1440 + 1440) % 1440;
      return `${String(Math.floor(utcMins / 60)).padStart(2, '0')}:${String(utcMins % 60).padStart(2, '0')}`;
    };

    // Helper function to convert date to ISO string preserving the date (not shifting by timezone)
    const convertDateToIso = (date: Moment | null): string | null => {
      if (!date || !moment.isMoment(date)) return null;
      // Get the local date parts and create UTC date to preserve the actual date selected
      const year = date.year();
      const month = date.month();
      const day = date.date();
      return moment.utc([year, month, day]).startOf('day').toISOString();
    };

    // Check if Additional Details has any data (user is currently filling it)
    const hasAdditionalDetailsData = !!(
      formValue.locationName?.trim() ||
      formValue.street?.trim() ||
      formValue.suitApt?.trim() ||
      formValue.zip?.trim() ||
      formValue.zipExtension?.trim() ||
      formValue.phoneAreaCode?.trim() ||
      formValue.phoneNumber?.trim() ||
      formValue.phoneExtension?.trim() ||
      formValue.faxAreaCode?.trim() ||
      formValue.faxNumber?.trim() ||
      formValue.email?.trim() ||
      formValue.web?.trim()
    );

    // Check if International Address has been applied/loaded (only use if Additional Details is empty)
    // Priority: If Additional Details has data, use it and ignore International Address
    const hasInternationalAddress = !hasAdditionalDetailsData && !!(this.internationalAddressData || this.loadedInternationalAddressData);

    return {
      // Draw Site Details
      locationType: formValue.locationType || this.data?.locationType || null,
      locationId: formValue.locationId || this.data?.locationId || null,
      drawSite: this.mode === 'add'
        ? (formValue.drawSite || null)
        : (this.editModeValues.drawSite || this.data?.locationName || null),
      // Sponsor, Hospital, and FDA License Date are disabled in edit mode, use original values
      sponsorId: this.mode === 'edit' && this.data?.sponsorId ? this.data.sponsorId : (formValue.sponsorId || null),
      travelTime: formValue.travelTime ? parseInt(formValue.travelTime, 10) : null,
      distance: formValue.distance ? parseFloat(formValue.distance) : null,
      fdaLicenseDate: this.mode === 'edit' && this.data?.fdaLicenseDate
        ? moment.utc(this.data.fdaLicenseDate).startOf('day').toISOString()
        : convertDateToIso(formValue.fdaLicenseDate),
      timeClose: convertLocalTimeToUtc(formValue.timeClose),
      timeOpen: convertLocalTimeToUtc(formValue.timeOpen),
      rotationFlag: formValue.rotationFlag || null,
      staffFacility: formValue.staffFacility || null,
      // Effective date is disabled in edit mode, use original value as-is (no timezone conversion)
      effectiveDate: this.mode === 'edit' && this.data?.effDate
        ? moment.utc(this.data.effDate).startOf('day').toISOString()
        : convertDateToIso(formValue.effectiveDate),
      terminationDate: convertDateToIso(formValue.terminationDate),
      donorCtrMgr: formValue.donorCtrMnr || null,
      directionNotes: formValue.directionNotes || null,

      // Additional Details
      // locationName at top level should be the draw site name
      locationName: this.mode === 'add'
        ? (formValue.drawSite || null)
        : (this.editModeValues.drawSite || this.data?.locationName || null),

      // MUTUALLY EXCLUSIVE: If International Address is used, clear Additional Details
      // If Additional Details is used, clear International Address
      address1: hasAdditionalDetailsData ? (formValue.locationName || null) : null,
      streetName: hasAdditionalDetailsData ? (formValue.street || null) : null,
      suiteApt: hasAdditionalDetailsData ? (formValue.suitApt || null) : null,
      // Only send zip if it has a value
      zip: hasAdditionalDetailsData && formValue.zip?.trim() ? formValue.zip : null,
      zipExtension: hasAdditionalDetailsData && formValue.zipExtension?.trim() ? formValue.zipExtension : null,
      mapsco: hasAdditionalDetailsData ? (formValue.mapsco || null) : null,
      county: hasAdditionalDetailsData ? (this.editModeValues.county || null) : null,
      uspsId: hasAdditionalDetailsData ? (this.selectedUspsId ?? null) : null,

      // Phone - separate fields (only if Additional Details is used)
      // Send phone number in formatted format (123-4567)
      dAreaCode: hasAdditionalDetailsData ? (formValue.phoneAreaCode || null) : null,
      dPhoneNo: hasAdditionalDetailsData ? (formValue.phoneNumber || null) : null,
      extension: hasAdditionalDetailsData ? (formValue.phoneExtension || null) : null,

      // Fax - separate fields (only if Additional Details is used)
      // Send fax number in formatted format (123-4567)
      fAreaCode: hasAdditionalDetailsData ? (formValue.faxAreaCode || null) : null,
      fPhoneNo: hasAdditionalDetailsData ? (formValue.faxNumber || null) : null,

      email: hasAdditionalDetailsData ? (formValue.email || null) : null,
      webAddress: hasAdditionalDetailsData ? (formValue.web || null) : null,

      // Notes
      notes: this.driveLocationNotes.map((note, index) => ({
        noteId: note.noteId || null,
        noteSequence: index + 1,
        note: note.noteText,
        auditKey: note.auditKey || null,
        isDeleted: note.isDeleted || false
      })),

      // International Address - only if Additional Details is NOT used
      // Flag: "Y" if international address, "N" if additional details (US address), null if neither
      intlAddrFlag: hasInternationalAddress ? 'Y' : (hasAdditionalDetailsData ? 'N' : null),
      intlAddress1: hasInternationalAddress ? ((this.internationalAddressData?.intlAddress1 || this.loadedInternationalAddressData?.intlAddress1) || null) : null,
      intlAddress2: hasInternationalAddress ? ((this.internationalAddressData?.intlAddress2 || this.loadedInternationalAddressData?.intlAddress2) || null) : null,
      intlAddress3: hasInternationalAddress ? ((this.internationalAddressData?.intlAddress3 || this.loadedInternationalAddressData?.intlAddress3) || null) : null,
      intlAddress4: hasInternationalAddress ? ((this.internationalAddressData?.intlAddress4 || this.loadedInternationalAddressData?.intlAddress4) || null) : null,
      countryName: hasInternationalAddress ? ((this.internationalAddressData?.countryName || this.loadedInternationalAddressData?.countryName) || null) : null,
      intlPostalCode: hasInternationalAddress ? ((this.internationalAddressData?.intlPostalCode || this.loadedInternationalAddressData?.intlPostalCode) || null) : null,
      intlHomePhoneNo: hasInternationalAddress ? ((this.internationalAddressData?.intlHomePhoneNo || this.loadedInternationalAddressData?.intlHomePhoneNo) || null) : null,
      intlWorkPhoneNo: hasInternationalAddress ? ((this.internationalAddressData?.intlWorkPhoneNo || this.loadedInternationalAddressData?.intlWorkPhoneNo) || null) : null,
      intlWorkPhoneExt: hasInternationalAddress ? ((this.internationalAddressData?.intlWorkPhoneExt || this.loadedInternationalAddressData?.intlWorkPhoneExt) || null) : null,
      intlMobilePhoneNo: hasInternationalAddress ? ((this.internationalAddressData?.intlMobilePhoneNo || this.loadedInternationalAddressData?.intlMobilePhoneNo) || null) : null,
      intlFaxNo: hasInternationalAddress ? ((this.internationalAddressData?.intlFaxNo || this.loadedInternationalAddressData?.intlFaxNo) || null) : null,
      intlEmail: hasInternationalAddress ? ((this.internationalAddressData?.intlEmail || this.loadedInternationalAddressData?.intlEmail) || null) : null,

      // System fields
      chapterId: this.headerService.getCurrentChapterId(),
      programId: 'DRIVELOC',
      // Hospital ID is disabled in edit mode, use original value
      nearestHospitalId: this.mode === 'edit' && (this.data?.nearestHospitalId || this.data?.hospitalId)
        ? (this.data.nearestHospitalId || this.data.hospitalId)
        : (formValue.hospitalId || null),
      zone: null
    };
  }

  onCancel(): void {
    this.closePanel.emit();
  }

  get isFormValid(): boolean {
    // Check if International Address data exists
    // In edit mode, check BOTH loaded data (from API) AND applied data (from current session)
    // In add mode, check applied data from parent
    const hasInternationalAddressData = this.mode === 'edit'
      ? (this.loadedInternationalAddressData !== null && this.loadedInternationalAddressData !== undefined) ||
        (this.internationalAddressData !== null && this.internationalAddressData !== undefined)
      : (this.internationalAddressData !== null && this.internationalAddressData !== undefined);

    // EDIT MODE - Allow save if there are changes and no errors in modified fields
    if (this.mode === 'edit') {
      // Check if international address has been modified
      const internationalAddressModified = !!(
        this.internationalAddressData &&
        JSON.stringify(this.internationalAddressData) !== JSON.stringify(this.loadedInternationalAddressData)
      );

      // Check if there are changes
      const hasChanges = this.form.dirty || internationalAddressModified || this.notesModified;

      // If no changes, disable save
      if (!hasChanges) {
        return false;
      }

      // Check for date range error (critical error)
      const hasDateRangeError = this.form.hasError('dateRangeInvalid');
      if (hasDateRangeError) {
        return false;
      }

      // Check if staffFacility is required and filled (even if not dirty)
      // Required for all records, including legacy records created before this became mandatory
      const staffFacilityControl = this.form.get('staffFacility');
      if (!staffFacilityControl?.value) {
        return false;
      }

      // Check for errors only in dirty (modified) fields
      let hasDirtyFieldErrors = false;
      Object.keys(this.form.controls).forEach(key => {
        const control = this.form.get(key);
        if (control?.dirty && control?.invalid) {
          hasDirtyFieldErrors = true;
        }
      });

      // Enable save if there are changes and no errors in modified fields
      return !hasDirtyFieldErrors;
    }

    // ADD MODE - Detailed validation
    // Check if Draw Site Details required fields are valid
    const drawSiteDetailsValid =
      (this.form.get('locationType')?.valid ?? false) &&
      (this.form.get('drawSite')?.valid ?? false) &&
      (this.form.get('travelTime')?.valid ?? false) &&
      (this.form.get('distance')?.valid ?? false) &&
      (this.form.get('staffFacility')?.valid ?? false) &&
      (this.form.get('effectiveDate')?.valid ?? false) &&
      (this.form.get('fdaLicenseDate')?.valid ?? true) && // Optional but must be valid if filled
      (this.form.get('terminationDate')?.valid ?? true) && !this.termDateInputHasInvalidText && // Optional but must be valid if filled
      (this.form.get('timeOpen')?.valid ?? true) && // Optional but must be valid HH:MM if filled
      (this.form.get('timeClose')?.valid ?? true) && // Optional but must be valid HH:MM if filled
      !this.form.hasError('dateRangeInvalid');

    // Check if user has started filling Additional Details (excluding zip)
    const formValue = this.form.getRawValue();
    const hasOtherAdditionalDetailsData = !!(
      formValue.locationName?.trim() ||
      formValue.street?.trim() ||
      formValue.suitApt?.trim() ||
      formValue.phoneAreaCode?.trim() ||
      formValue.phoneNumber?.trim() ||
      formValue.phoneExtension?.trim() ||
      formValue.faxAreaCode?.trim() ||
      formValue.faxNumber?.trim() ||
      formValue.email?.trim() ||
      formValue.web?.trim() ||
      formValue.mapsco?.trim()
    );

    // Check if zip is filled and valid
    const zipValue = this.form.get('zip')?.value?.trim();
    const hasZip = !!(zipValue && zipValue.length > 0);
    const isZipValid = this.form.get('zip')?.valid ?? false;

    // Check if email, web, phone, and fax fields are valid (if filled)
    const emailValid = this.form.get('email')?.valid ?? true;
    const webValid = this.form.get('web')?.valid ?? true;
    const phoneAreaCodeValid = this.form.get('phoneAreaCode')?.valid ?? true;
    const phoneNumberValid = this.form.get('phoneNumber')?.valid ?? true;
    const faxAreaCodeValid = this.form.get('faxAreaCode')?.valid ?? true;
    const faxNumberValid = this.form.get('faxNumber')?.valid ?? true;

    // Additional Details has data if either other fields OR zip is filled
    const hasAdditionalDetailsData = hasOtherAdditionalDetailsData || hasZip;

    // Location Name is required unless international address is applied
    const locationNameValid = this.form.get('locationName')?.valid ?? false;

    // If International Address is applied, just validate Draw Site Details (locationName not required)
    if (hasInternationalAddressData) {
      return drawSiteDetailsValid;
    }

    // If user has filled Additional Details, zip is required AND all fields must be valid
    const mapscoValid = this.form.get('mapsco')?.valid ?? true;
    if (hasAdditionalDetailsData) {
      return drawSiteDetailsValid && locationNameValid && hasZip && isZipValid && emailValid && webValid &&
             phoneAreaCodeValid && phoneNumberValid && faxAreaCodeValid && faxNumberValid && mapscoValid;
    }

    // Only Draw Site Details + Location Name required when no address block is filled
    return drawSiteDetailsValid && locationNameValid;
  }

  private updateUSAddressFieldsState(): void {
    const usAddressControls = [
      'locationName', 'street', 'suitApt', 'zip', 'zipExtension', 'mapsco',
      'phoneAreaCode', 'phoneNumber', 'phoneExtension',
      'faxAreaCode', 'faxNumber', 'email', 'web'
    ];
    if (this.internationalAddressData) {
      usAddressControls.forEach(name => this.form.get(name)?.disable({ emitEvent: false }));
    } else {
      usAddressControls.forEach(name => this.form.get(name)?.enable({ emitEvent: false }));
    }
    this.cdr.markForCheck();
  }

  // Error message getters
  getLocationTypeError(): string {
    const control = this.form.get('locationType');
    if (control?.hasError('required') && control?.touched) {
      return 'Location Type is required';
    }
    return '';
  }

  getLocationIdError(): string {
    const control = this.form.get('locationId');
    if (control?.hasError('required') && control?.touched) {
      return 'Location ID is required';
    }
    return '';
  }

  getDrawSiteError(): string {
    const control = this.form.get('drawSite');
    if (control?.hasError('required') && control?.touched) {
      return 'Draw Site is required';
    }
    if (control?.hasError('maxlength') && control?.touched) {
      return 'Draw Site cannot exceed 50 characters';
    }
    return '';
  }

  getEffectiveDateError(): string {
    const control = this.form.get('effectiveDate');
    // Gap #3: matDatepickerMin fires when user picks a date older than today-365
    if (control?.hasError('matDatepickerMin') && (control?.touched || control?.dirty)) {
      return 'Effective date cannot be more than 365 days in the past';
    }
    const formErrors = this.lastChangedDateField === 'effective' ? this.form.errors : null;
    return DateFieldValidationUtility.getStartDateCrossFieldError(
      control, 'Effective Date', 'Termination Date', formErrors
    );
  }

  getTerminationDateError(): string {
    const control = this.form.get('terminationDate');
    if (!control || !(control.touched || control.dirty)) return '';
    // termDateInputHasInvalidText is set in onTerminationDateInput and is a plain property —
    // updateValueAndValidity() and Angular Material's [min] handling cannot clear it.
    if (this.termDateInputHasInvalidText) {
      return 'Termination date is invalid';
    }
    const formErrors = this.lastChangedDateField === 'termination' ? this.form.errors : null;
    return DateFieldValidationUtility.getEndDateCrossFieldError(
      control, 'Termination Date', 'Effective Date', formErrors
    );
  }

  getFdaLicenseDateError(): string {
    const control = this.form.get('fdaLicenseDate');
    if (!control) return '';

    // Only show errors if touched or dirty
    if (!(control.touched || control.dirty)) return '';

    // Check for invalid date format errors
    if (control.hasError('invalidDateFormat')) {
      return 'FDA License date is invalid';
    }

    if (control.hasError('invalidDate')) {
      return 'FDA License date is invalid';
    }

    if (control.hasError('matDatepickerParse')) {
      return 'FDA License date is invalid';
    }

    if (control.hasError('effectiveDatePast')) {
      return 'FDA License date cannot be past date';
    }

    return '';
  }

  getTimeOpenError(): string {
    const control = this.form.get('timeOpen');
    if (!control?.touched) return '';
    if (control.hasError('invalidTimeFormat')) return 'Time Open is invalid (use HH:MM, e.g. 23:00)';
    return '';
  }

  getTimeCloseError(): string {
    const control = this.form.get('timeClose');
    if (!control) return '';
    if (control.touched && control.hasError('invalidTimeFormat')) {
      return 'Time Close is invalid (use HH:MM, e.g. 23:00)';
    }
    if (control.hasError('timeCloseBeforeOpen') && (control.touched || control.dirty)) {
      return 'Close time cannot be prior to Open time';
    }
    return '';
  }

  onTimeInput(fieldName: string): void {
    // Mark as dirty on input to enable validation
    const control = this.form.get(fieldName);
    if (control) {
      control.markAsDirty();
    }

    // Update form validation
    this.form.updateValueAndValidity();

    // Trigger change detection for OnPush strategy
    this.cdr.detectChanges();
  }

  onTimeBlur(fieldName: string): void {
    const control = this.form.get(fieldName);
    if (control) {
      control.markAsTouched();
      control.markAsDirty();
      // Normalize whatever the user typed to HH:MM — handles "2300" → "23:00",
      // "9:30" → "09:30", etc. Works regardless of browser locale.
      const raw = (control.value ?? '').toString().trim();
      if (raw) {
        const normalized = this.normalizeTimeInput(raw);
        if (normalized !== null) {
          control.setValue(normalized, { emitEvent: false });
        }
      }
    }
    this.form.updateValueAndValidity();
    this.cdr.detectChanges();
  }

  /** Converts flexible time input to zero-padded HH:MM (24-hour). Returns null if unparseable. */
  private normalizeTimeInput(input: string): string | null {
    const digits = input.replace(/\D/g, '');

    // 4-digit HHMM: "2300" → "23:00", "0630" → "06:30"
    if (digits.length === 4) {
      const h = parseInt(digits.substring(0, 2), 10);
      const m = parseInt(digits.substring(2, 4), 10);
      if (h <= 23 && m <= 59) {
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      }
    }

    // 3-digit HMM: "930" → "09:30"
    if (digits.length === 3) {
      const h = parseInt(digits.substring(0, 1), 10);
      const m = parseInt(digits.substring(1, 3), 10);
      if (h <= 9 && m <= 59) {
        return `0${h}:${String(m).padStart(2, '0')}`;
      }
    }

    // H:MM or HH:MM with colon already present
    const match = input.match(/^(\d{1,2}):(\d{2})$/);
    if (match) {
      const h = parseInt(match[1], 10);
      const m = parseInt(match[2], 10);
      if (h <= 23 && m <= 59) {
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      }
    }

    return null;
  }

  /** Allow only digits and colon in the time text inputs. */
  onTimeKeyPress(event: KeyboardEvent): void {
    const key = event.key;
    if (['Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
         'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(key)) {
      return;
    }
    if (event.ctrlKey || event.metaKey) {
      return;
    }
    if (!/^[\d:]$/.test(key)) {
      event.preventDefault();
    }
  }

  getDirectionNotesError(): string {
    const control = this.form.get('directionNotes');
    if (control?.hasError('maxlength') && control?.touched) {
      return 'Direction Notes cannot exceed 500 characters';
    }
    return '';
  }

  getTravelTimeError(): string {
    const control = this.form.get('travelTime');
    if (control?.hasError('required') && control?.touched) {
      return 'Travel Time is required';
    }
    if (control?.hasError('pattern') && control?.touched) {
      return 'Travel Time must be a number (max 3 digits)';
    }
    return '';
  }

  getDistanceError(): string {
    const control = this.form.get('distance');
    if (control?.hasError('required') && control?.touched) {
      return 'Distance is required';
    }
    if (control?.hasError('pattern') && control?.touched) {
      return 'Distance must be a number (max 999.99)';
    }
    return '';
  }

  getStaffFacilityError(): string {
    const control = this.form.get('staffFacility');
    if (control?.hasError('required') && control?.touched) {
      return 'Staff Facility is required';
    }
    return '';
  }

  /**
   * Check if zip is required
   * - If user starts filling Additional Details → zip IS required (takes priority)
   * - If international address is filled AND no Additional Details → zip is NOT required
   */
  isZipRequired(): boolean {
    // Check if any Additional Details field (excluding zip itself) has data
    const formValue = this.form.getRawValue();
    const hasOtherAdditionalDetailsData = !!(
      formValue.locationName?.trim() ||
      formValue.street?.trim() ||
      formValue.suitApt?.trim() ||
      formValue.phoneAreaCode?.trim() ||
      formValue.phoneNumber?.trim() ||
      formValue.phoneExtension?.trim() ||
      formValue.faxAreaCode?.trim() ||
      formValue.faxNumber?.trim() ||
      formValue.email?.trim() ||
      formValue.web?.trim() ||
      formValue.mapsco?.trim()
    );

    // If user has filled any Additional Details, zip is required
    // (This takes priority over international address)
    if (hasOtherAdditionalDetailsData) {
      return true;
    }

    // If no Additional Details are filled, zip is not required
    // (either because international address is used, or nothing is filled yet)
    return false;
  }

  getZipError(): string {
    const control = this.form.get('zip');
    const zipValue = control?.value?.trim();

    // Check if zip is required and not filled
    if (this.isZipRequired() && !zipValue && control?.touched) {
      return 'Zip is required';
    }

    if (control?.hasError('minLength') && control?.touched) {
      return 'Zip must be exactly 5 digits';
    }

    if (control?.hasError('maxLength') && control?.touched) {
      return 'Zip must be exactly 5 digits';
    }

    if (control?.hasError('pattern') && control?.touched) {
      return 'Zip must be exactly 5 digits';
    }

    // Gap #5: Zip was not found in VALID_CITY_STATE
    if (control?.hasError('zipNotFound') && control?.touched) {
      return 'Zip code not found';
    }

    return '';
  }

  getMapscoError(): string {
    const control = this.form.get('mapsco');
    if (!control?.touched) return '';
    if (control.hasError('mapscoMissingAlpha')) return 'Mapsco must contain at least one letter';
    if (control.hasError('mapscoMissingDigit')) return 'Mapsco must contain at least one digit';
    if (control.hasError('mapscoInvalidChars')) return 'Mapsco can only contain letters, digits, and hyphens';
    return '';
  }

  formatDate(date: string | undefined): string {
    if (!date) return '-';
    try {
      const d = new Date(date);
      const day = String(d.getDate()).padStart(2, '0');
      const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    } catch {
      return '-';
    }
  }

  /**
   * Open International Address screen within side panel
   */
  openInternationalAddressDialog(): void {
    // Check if any US address fields have data
    const hasData = this.hasUSAddressData();

    // Always open the dialog, but pass the hasUSAddressData flag
    // The International Address component will show the warning banner if needed
    const recordKey = this.data?.locationId || '';

    // In edit mode, pass the loaded international address data
    const existingData = this.mode === 'edit' ? this.loadedInternationalAddressData : null;

    this.openInternationalAddress.emit({ recordKey, hasUSAddressData: hasData, existingData });
  }

  /**
   * Check if any US address fields contain data
   */
  private hasUSAddressData(): boolean {
    const formValue = this.form.value;

    // Check all US address fields in Additional Details tab
    const hasFormData = !!(
      formValue.locationName?.trim() ||
      formValue.street?.trim() ||
      formValue.suitApt?.trim() ||
      formValue.zip?.trim() ||
      formValue.zipExtension?.trim() ||
      formValue.mapsco?.trim() ||
      formValue.phoneAreaCode?.trim() ||
      formValue.phoneNumber?.trim() ||
      formValue.phoneExtension?.trim() ||
      formValue.faxAreaCode?.trim() ||
      formValue.faxNumber?.trim() ||
      formValue.email?.trim() ||
      formValue.web?.trim()
    );

    // Check auto-populated fields
    const hasAutoPopulatedData = !!(
      this.editModeValues.city ||
      this.editModeValues.state ||
      this.editModeValues.county
    );

    return hasFormData || hasAutoPopulatedData;
  }

  /**
   * Notes functionality
   */
  onAddNote(): void {
    const noteText = this.noteForm.get('noteText')?.value?.trim();
    if (!noteText) return;

    this.isSavingNote = true;

    // Get current datetime - stored as UTC ISO string
    // The timestamp represents the absolute point in time, not tied to a specific timezone
    const now = moment();

    if (this.editingNoteIndex !== null) {
      // Update existing note
      this.driveLocationNotes[this.editingNoteIndex] = {
        ...this.driveLocationNotes[this.editingNoteIndex],
        noteText,
        createdBy: this.loginService.getStoredUsername(),
        createdDate: now.toISOString()
      };
      this.editingNoteIndex = null;
    } else {
      // Add new note
      this.driveLocationNotes.push({
        noteId: null,
        noteText,
        createdBy: this.loginService.getStoredUsername(),
        createdDate: now.toISOString(),
        version: `${this.driveLocationNotes.length + 1}.0`,
        auditKey: null,
        isDeleted: false
      });
    }

    this.notesModified = true;
    this.noteForm.reset();
    this.isSavingNote = false;
    // Trigger change detection to update save button state
    this.cdr.detectChanges();
  }

  onEditNote(note: any, index: number): void {
    this.editingNoteIndex = index;
    this.noteForm.patchValue({ noteText: note.noteText });
  }

  onDeleteNote(index: number): void {
    const note = this.driveLocationNotes[index];

    // If note has noteId (existing note), mark as deleted
    if (note.noteId) {
      this.driveLocationNotes[index] = {
        ...note,
        isDeleted: true
      };
    } else {
      // If note doesn't have noteId (new note), remove from array
      this.driveLocationNotes.splice(index, 1);
    }

    this.notesModified = true;
    // Trigger change detection to update save button state
    this.cdr.detectChanges();
  }

  get activeNotes() {
    return this.driveLocationNotes.filter(note => !note.isDeleted);
  }

  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }
    return parts[0].charAt(0).toUpperCase();
  }

  formatNoteDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const day = String(date.getDate()).padStart(2, '0');
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  onEffectiveDateInput(event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value, this.form.get('effectiveDate')
    );
  }

  onTerminationDateInput(event: Event): void {
    const inputValue = (event.target as HTMLInputElement).value;
    const control = this.form.get('terminationDate');
    // Track unparseable text independently of form control errors so that
    // updateValueAndValidity() calls (including Angular Material's [min] handler)
    // cannot wipe the "Termination date is invalid" message.
    this.termDateInputHasInvalidText = !!inputValue.trim() && !control?.value;
    DateFieldValidationUtility.handleEndDateInput(inputValue, control, this.mode === 'edit');
  }

  onFdaLicenseDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value, this.form.get('fdaLicenseDate'), this.mode === 'edit'
    );
  }

  /**
   * Prevent non-numeric characters in numeric input fields
   */
  onNumericKeyPress(event: KeyboardEvent): void {
    const key = event.key;

    // Allow: backspace, delete, tab, escape, enter, arrow keys
    if (['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(key)) {
      return;
    }

    // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
    if (event.ctrlKey || event.metaKey) {
      if (['a', 'c', 'v', 'x', 'A', 'C', 'V', 'X'].includes(key)) {
        return;
      }
    }

    // Prevent: anything that is not a number (0-9)
    if (!/^\d$/.test(key)) {
      event.preventDefault();
    }
  }

  /**
   * Get phone area code error message
   */
  getPhoneAreaCodeError(): string {
    // No error messages - field accepts 0-3 digits
    return '';
  }

  /**
   * Get phone number error message
   */
  getPhoneNumberError(): string {
    const control = this.form.get('phoneNumber');
    if (control?.hasError('pattern') && control?.touched) {
      return 'Must be 7 digits';
    }
    return '';
  }

  /**
   * Get fax area code error message
   */
  getFaxAreaCodeError(): string {
    // No error messages - field accepts 0-3 digits
    return '';
  }

  /**
   * Get fax number error message
   */
  getFaxNumberError(): string {
    const control = this.form.get('faxNumber');
    if (control?.hasError('pattern') && control?.touched) {
      return 'Must be 7 digits';
    }
    return '';
  }

  /**
   * Strip hyphen from phone number on focus to allow editing
   */
  onPhoneNumberFocus(): void {
    const control = this.form.get('phoneNumber');
    const value = control?.value;
    if (value) {
      const digitsOnly = value.replace(/\D/g, '');
      control?.setValue(digitsOnly);
      this.cdr.detectChanges();
    }
  }

  /**
   * Format phone number with hyphen (1234567 -> 123-4567)
   */
  formatPhoneNumber(): void {
    const control = this.form.get('phoneNumber');
    const value = control?.value?.replace(/\D/g, ''); // Remove non-digits

    if (value && value.length === 7) {
      const formatted = `${value.slice(0, 3)}-${value.slice(3)}`;
      const wasDirty = control?.dirty;

      control?.setValue(formatted, { emitEvent: false });

      // Clear errors and mark as untouched (but keep dirty state for save button)
      control?.setErrors(null);
      control?.markAsUntouched();

      // Restore dirty state if it was dirty before formatting
      if (wasDirty) {
        control?.markAsDirty();
      }

      this.cdr.detectChanges(); // Trigger change detection for OnPush strategy
    }
  }

  /**
   * Strip hyphen from fax number on focus to allow editing
   */
  onFaxNumberFocus(): void {
    const control = this.form.get('faxNumber');
    const value = control?.value;
    if (value) {
      const digitsOnly = value.replace(/\D/g, '');
      control?.setValue(digitsOnly);
      this.cdr.detectChanges();
    }
  }

  /**
   * Format fax number with hyphen (1234567 -> 123-4567)
   */
  formatFaxNumber(): void {
    const control = this.form.get('faxNumber');
    const value = control?.value?.replace(/\D/g, ''); // Remove non-digits

    if (value && value.length === 7) {
      const formatted = `${value.slice(0, 3)}-${value.slice(3)}`;
      const wasDirty = control?.dirty;

      control?.setValue(formatted, { emitEvent: false });

      // Clear errors and mark as untouched (but keep dirty state for save button)
      control?.setErrors(null);
      control?.markAsUntouched();

      // Restore dirty state if it was dirty before formatting
      if (wasDirty) {
        control?.markAsDirty();
      }

      this.cdr.detectChanges(); // Trigger change detection for OnPush strategy
    }
  }

  /**
   * Prevent non-numeric and non-decimal characters in decimal input fields
   */
  onDecimalKeyPress(event: KeyboardEvent): void {
    const key = event.key;
    const inputElement = event.target as HTMLInputElement;
    const currentValue = inputElement.value;

    // Allow: backspace, delete, tab, escape, enter, arrow keys
    if (['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(key)) {
      return;
    }

    // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
    if (event.ctrlKey || event.metaKey) {
      if (['a', 'c', 'v', 'x', 'A', 'C', 'V', 'X'].includes(key)) {
        return;
      }
    }

    // Allow decimal point only if there isn't one already
    if (key === '.') {
      if (currentValue.indexOf('.') !== -1) {
        event.preventDefault();
      }
      return;
    }

    // Prevent: anything that is not a number (0-9)
    if (!/^\d$/.test(key)) {
      event.preventDefault();
    }
  }

  /**
   * Extract error message from API response
   * Priority 1: errorResponse with errorCode and error (format: "Error: errorCode : error")
   * Priority 2: message from API response
   * Priority 3: Generic fallback
   */
  private extractErrorMessage(error: any, defaultMessage: string = 'Error saving record'): string {
    // Priority 1: Check for errorResponse.error with errorCode (format: "Error: errorCode : error")
    if (error?.error?.errorResponse?.error && error?.error?.errorResponse?.errorCode) {
      const errorCode = error.error.errorResponse.errorCode;
      const errorMessage = error.error.errorResponse.error;
      return `Error: ${errorCode} : ${errorMessage}`;
    }

    // Priority 2: Check for message in API response
    if (error?.error?.message) {
      return error.error.message;
    }

    // Priority 3: Fallback to generic error message
    return error?.message || defaultMessage;
  }
}
