import { Component, EventEmitter, Input, OnInit, Output, OnDestroy, OnChanges, SimpleChanges, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { ReturnReasonsService } from '../services/return-reasons.service';
import { HeaderService } from '@shared/services/header.service';
import { LoginService } from '@shared/services/login.service';
import moment from 'moment';
import { Subject, takeUntil, finalize, forkJoin, startWith } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import {
  ReturnReasonsModel,
  ReturnReasonsDto,
  UpdateReturnReasonsDto
} from '../models/return-reasons.model';

export interface ReturnReasonsFormData {
  code: string;
  codeDesc: string;
  locationType: string;
  crNcr: string;
  enforce: string;
  feeCode1: string;
  feeCode2: string;
  effDate: Date;
  termDate?: Date | null;
}

@Component({
  selector: 'app-add-edit-return-reasons',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatIconModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    ReactiveFormsModule,
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './add-edit-return-reasons.html',
  styleUrls: ['./add-edit-return-reasons.scss']
})
export class AddEditReturnReasons implements OnInit, OnChanges, OnDestroy {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() data: ReturnReasonsModel | null = null;
  @Output() closePanel = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<void>();
  @Output() modeChange = new EventEmitter<'add' | 'edit'>();

  form: FormGroup;
  panelTitle: string = '';
  lastUpdated: string = '';

  editModeValues: {
    code: string;
    codeDesc: string;
    locationType: string;
    crNcr: string;
    enforce: string;
    feeCode1: string;
    feeCode2: string;
    effectiveDate: string;
    terminationDate: string;
  } = {
      code: '',
      codeDesc: '',
      locationType: '',
      crNcr: '',
      enforce: '',
      feeCode1: '',
      feeCode2: '',
      effectiveDate: '',
      terminationDate: ''
    };

  locationTypeOptions: { code: string; codeDesc: string }[] = [];
  feeCode1Options: { chargeCode: string; chargeCodeDesc: string }[] = [];
  feeCode2Options: { chargeCode: string; chargeCodeDesc: string }[] = [];
  crNcrOptions: string[] = ['Y', 'N'];
  enforceOptions: string[] = ['Y', 'N'];

  // Search controls for dropdowns
  locationTypeSearchCtrl = new FormControl('');
  feeCode1SearchCtrl = new FormControl('');
  feeCode2SearchCtrl = new FormControl('');

  // Signals for filtered options
  locationTypeOptionsSignal = signal<{ code: string; codeDesc: string }[]>([]);
  feeCode1OptionsSignal = signal<{ chargeCode: string; chargeCodeDesc: string }[]>([]);
  feeCode2OptionsSignal = signal<{ chargeCode: string; chargeCodeDesc: string }[]>([]);

  // Convert FormControl values to signals
  locationTypeSearchSignal = toSignal(this.locationTypeSearchCtrl.valueChanges.pipe(startWith('')), { initialValue: '' });
  feeCode1SearchSignal = toSignal(this.feeCode1SearchCtrl.valueChanges.pipe(startWith('')), { initialValue: '' });
  feeCode2SearchSignal = toSignal(this.feeCode2SearchCtrl.valueChanges.pipe(startWith('')), { initialValue: '' });

  filteredLocationTypeOptions = computed(() => {
    const searchTerm = this.locationTypeSearchSignal()?.toLowerCase() || '';
    const options = this.locationTypeOptionsSignal();
    if (!searchTerm) return options;
    return options.filter(option =>
      option.code.toLowerCase().includes(searchTerm) ||
      option.codeDesc.toLowerCase().includes(searchTerm)
    );
  });

  filteredFeeCode1Options = computed(() => {
    const searchTerm = this.feeCode1SearchSignal()?.toLowerCase() || '';
    const options = this.feeCode1OptionsSignal();
    if (!searchTerm) return options;
    return options.filter(option =>
      option.chargeCode.toLowerCase().includes(searchTerm) ||
      option.chargeCodeDesc.toLowerCase().includes(searchTerm)
    );
  });

  filteredFeeCode2Options = computed(() => {
    const searchTerm = this.feeCode2SearchSignal()?.toLowerCase() || '';
    const options = this.feeCode2OptionsSignal();
    if (!searchTerm) return options;
    return options.filter(option =>
      option.chargeCode.toLowerCase().includes(searchTerm) ||
      option.chargeCodeDesc.toLowerCase().includes(searchTerm)
    );
  });

  // Min date for effective date picker (chapter local date)
  minDate!: moment.Moment;

  // Date filter functions for chapter-aware date pickers
  effectiveDateFilterFn!: (date: moment.Moment | null) => boolean;
  editModeEffDateFilterFn: (date: moment.Moment | null) => boolean = (date) => {
    if (!date) return true;
    // Allow the original effective date even if it's in the past
    if (this.originalValues.effDate) {
      const originalDate = moment(this.originalValues.effDate);
      if (date.isSame(originalDate, 'day')) return true;
    }
    // Block other past dates
    return this.effectiveDateFilterFn ? this.effectiveDateFilterFn(date) : true;
  };
  terminationDateFilterFn!: (date: moment.Moment | null) => boolean;

  // Minimum date for termination datepicker: max(effectiveDate, today)
  get terminationMinDate() {
    const effectiveDate = this.form.get('effectiveDate')?.value;
    if (effectiveDate) {
      const effMoment = moment.isMoment(effectiveDate) ? effectiveDate : moment(effectiveDate);
      return effMoment.isAfter(this.minDate) ? effMoment : this.minDate;
    }
    return this.minDate;
  }

  isLoadingOptions = false;
  isSaving = false;

  // Store original values for edit mode (needed for update API)
  private originalValues: {
    chapterId: string;
    code: string;
    effDate: Date | null;
  } = {
    chapterId: '',
    code: '',
    effDate: null
  };

  /** Tracks which date field was last changed — cross-field error shows only on that field */
  private lastChangedDateField: 'effective' | 'termination' | null = null;

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEffectiveDateError());
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTerminationDateError());

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private returnReasonsService: ReturnReasonsService,
    private snackBar: MatSnackBar,
    private headerService: HeaderService,
    private loginService: LoginService
  ) {
    this.form = this.fb.group({
      code: ['', [Validators.required]],
      codeDesc: ['', [Validators.required]],
      locationType: ['', [Validators.required]],
      credit: [false],
      enforcePolicy: [false],
      feeCode1: [''],
      feeCode2: [''],
      effectiveDate: [null, [Validators.required]],
      terminationDate: [null]
    }, {
      validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate')]
    });
  }

  ngOnInit(): void {
    this.setupDateValidation();
    this.setupPanel();
    this.loadDropdownOptions();
    this.setupFeeCodeListeners();
    this.setupDateFieldTracking();
    this.setupDropdownValueChangeListeners();

    // Setup validators based on mode
    if (this.mode === 'add') {
      DateFieldValidationUtility.setupAddModeValidators(this.form, this.headerService.chapterTimeZone());
    } else {
      DateFieldValidationUtility.setupEditModeValidators(this.form);
      // Re-enable effectiveDate for Return Reasons (FMB allows editing EFF_DATE)
      const effCtrl = this.form.get('effectiveDate');
      if (effCtrl) {
        effCtrl.enable();
        effCtrl.setValidators([Validators.required, this.editModeEffDatePastValidator()]);
        effCtrl.updateValueAndValidity();
      }
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mode'] || changes['data']) {
      if (!changes['mode']?.firstChange && !changes['data']?.firstChange) {
        this.setupPanel();

        if (this.mode === 'add') {
          this.resetFormForAddMode();
        }
      }
    }
  }

  /**
   * Validator for edit mode: allows keeping an existing past date unchanged,
   * but rejects selecting a new past date (matches FMB CHANGED record behavior).
   */
  private editModeEffDatePastValidator() {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;

      const currentDate = moment.isMoment(control.value) ? control.value : moment(control.value);

      // If date hasn't changed from original, allow it (even if in the past)
      if (this.originalValues.effDate) {
        const originalDate = moment(this.originalValues.effDate);
        if (currentDate.isSame(originalDate, 'day')) return null;
      }

      // Date changed — reject if in the past
      if (currentDate.isBefore(this.minDate, 'day')) {
        return { matDatepickerMin: { min: this.minDate, actual: currentDate } };
      }

      return null;
    };
  }

  /**
   * Setup date validation with chapter timezone
   */
  private setupDateValidation(): void {
    const chapterTimezone = this.headerService.chapterTimeZone();

    // Set minDate based on chapter timezone (fallback to default if no timezone)
    this.minDate = DateFieldValidationUtility.getMinDate(chapterTimezone);

    // Create effective date filter based on chapter timezone
    this.effectiveDateFilterFn = DateFieldValidationUtility.createEffectiveDateFilter(chapterTimezone);

    // Termination date filter - ensures date is not in past and after effective date
    this.terminationDateFilterFn = (date: moment.Moment | null): boolean => {
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

    // Date validators are set up via setupAddModeValidators/setupEditModeValidators
  }

  /**
   * Load dropdown options from API
   */
  private loadDropdownOptions(): void {
    this.isLoadingOptions = true;

    forkJoin({
      locationTypes: this.returnReasonsService.getLocationTypes(),
      feeCode1Options: this.returnReasonsService.getChargeCodes(),
      feeCode2Options: this.returnReasonsService.getChargeCodes()
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Extract code and description from each object
          this.locationTypeOptions = (response.locationTypes.data || [])
            .filter((item: any) => item.code.length <= 2)
            .map((item: any) => ({ code: item.code, codeDesc: item.codeDesc || '' }));
          this.feeCode1Options = (response.feeCode1Options.data || [])
            .map((item: any) => ({ chargeCode: item.chargeCode, chargeCodeDesc: item.chargeCodeDesc || '' }));
          this.feeCode2Options = (response.feeCode2Options.data || [])
            .map((item: any) => ({ chargeCode: item.chargeCode, chargeCodeDesc: item.chargeCodeDesc || '' }));

          // Update signals for filtered dropdowns
          this.locationTypeOptionsSignal.set(this.locationTypeOptions);
          this.feeCode1OptionsSignal.set(this.feeCode1Options);
          this.feeCode2OptionsSignal.set(this.feeCode2Options);

          this.isLoadingOptions = false;

          // After loading dropdown options, apply fee code exclusion for edit mode
          if (this.mode === 'edit' && this.data) {
            const feeCode1 = this.data.feeCode1 || '';
            const feeCode2 = this.data.feeCode2 || '';

            // Reload dropdowns with exclusions
            this.loadFeeCode1Options(feeCode2 || undefined);
            this.loadFeeCode2Options(feeCode1 || undefined);
          }
        },
        error: (error) => {
          console.error('Error loading dropdown options:', error);
          this.isLoadingOptions = false;
        }
      });
  }

  /**
   * Setup listeners for fee code dropdowns to handle exclusion
   */
  private setupFeeCodeListeners(): void {
    // Listen to feeCode1 changes and reload feeCode2 options excluding selected value
    this.form.get('feeCode1')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(selectedFeeCode1 => {
        this.loadFeeCode2Options(selectedFeeCode1);
      });

    // Listen to feeCode2 changes and reload feeCode1 options excluding selected value
    this.form.get('feeCode2')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(selectedFeeCode2 => {
        this.loadFeeCode1Options(selectedFeeCode2);
      });
  }

  /**
   * Track which date field was last changed for cross-field error display
   */
  private setupDateFieldTracking(): void {
    this.form.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => { this.lastChangedDateField = 'effective'; });

    this.form.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => { this.lastChangedDateField = 'termination'; });
  }

  /**
   * Setup listeners for dropdown fields to clear validation when value is cleared
   */
  private setupDropdownValueChangeListeners(): void {
    // Location Type dropdown
    this.form.get('locationType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        const control = this.form.get('locationType');
        if (!value && control) {
          control.setErrors(null);
          if (this.mode === 'add') {
            control.markAsPristine();
            control.markAsUntouched();
          }
        }
      });

    // Credit dropdown
    this.form.get('credit')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        const control = this.form.get('credit');
        if (value === null && control) {
          control.setErrors(null);
          if (this.mode === 'add') {
            control.markAsPristine();
            control.markAsUntouched();
          }
        }
      });

    // Enforce Policy dropdown
    this.form.get('enforcePolicy')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        const control = this.form.get('enforcePolicy');
        if (value === null && control) {
          control.setErrors(null);
          if (this.mode === 'add') {
            control.markAsPristine();
            control.markAsUntouched();
          }
        }
      });

    // Fee Code 1 dropdown
    this.form.get('feeCode1')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        const control = this.form.get('feeCode1');
        if (!value && control) {
          control.setErrors(null);
          if (this.mode === 'add') {
            control.markAsPristine();
            control.markAsUntouched();
          }
        }
      });

    // Fee Code 2 dropdown
    this.form.get('feeCode2')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        const control = this.form.get('feeCode2');
        if (!value && control) {
          control.setErrors(null);
          if (this.mode === 'add') {
            control.markAsPristine();
            control.markAsUntouched();
          }
        }
      });
  }

  /**
   * Load feeCode1 options excluding the value selected in feeCode2
   */
  private loadFeeCode1Options(excludeCode?: string): void {
    this.returnReasonsService.getChargeCodes(excludeCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.feeCode1Options = (response.data || [])
            .map((item: any) => ({ chargeCode: item.chargeCode, chargeCodeDesc: item.chargeCodeDesc || '' }));

          // Update signal for filtered dropdown
          this.feeCode1OptionsSignal.set(this.feeCode1Options);

          // If feeCode1 currently has the excluded value, clear it
          const currentFeeCode1 = this.form.get('feeCode1')?.value;
          if (currentFeeCode1 && currentFeeCode1 === excludeCode) {
            this.form.get('feeCode1')?.setValue('', { emitEvent: false });
          }
        },
        error: (error) => {
          console.error('Error loading feeCode1 options:', error);
        }
      });
  }

  /**
   * Load feeCode2 options excluding the value selected in feeCode1
   */
  private loadFeeCode2Options(excludeCode?: string): void {
    this.returnReasonsService.getChargeCodes(excludeCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.feeCode2Options = (response.data || [])
            .map((item: any) => ({ chargeCode: item.chargeCode, chargeCodeDesc: item.chargeCodeDesc || '' }));

          // Update signal for filtered dropdown
          this.feeCode2OptionsSignal.set(this.feeCode2Options);

          // If feeCode2 currently has the excluded value, clear it
          const currentFeeCode2 = this.form.get('feeCode2')?.value;
          if (currentFeeCode2 && currentFeeCode2 === excludeCode) {
            this.form.get('feeCode2')?.setValue('', { emitEvent: false });
          }
        },
        error: (error) => {
          console.error('Error loading feeCode2 options:', error);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupPanel(): void {
    if (this.mode === 'add') {
      this.panelTitle = 'Add New Return Reason';
      this.lastUpdated = '';
    } else {
      this.panelTitle = 'Edit Return Reason';
      this.lastUpdated = '';
      this.populateFormForEdit();
    }
  }

  private resetFormForAddMode(): void {
    this.editModeValues = {
      code: '',
      codeDesc: '',
      locationType: '',
      crNcr: '',
      enforce: '',
      feeCode1: '',
      feeCode2: '',
      effectiveDate: '',
      terminationDate: ''
    };

    this.form.reset();
    this.form.markAsUntouched();
    this.form.markAsPristine();

    // Restore validators for add mode
    this.form.get('code')?.setValidators([Validators.required]);
    this.form.get('codeDesc')?.setValidators([Validators.required]);
    this.form.get('locationType')?.setValidators([Validators.required]);
    this.form.get('feeCode1')?.setValidators([]);
    this.form.get('feeCode2')?.setValidators([]);

    // Setup date validators for add mode
    DateFieldValidationUtility.setupAddModeValidators(this.form, this.headerService.chapterTimeZone());

    // Update validity
    this.form.get('code')?.updateValueAndValidity();
    this.form.get('codeDesc')?.updateValueAndValidity();
    this.form.get('locationType')?.updateValueAndValidity();
    this.form.get('feeCode1')?.updateValueAndValidity();
    this.form.get('feeCode2')?.updateValueAndValidity();

    // Reset fee code options to show all options (no exclusion)
    this.loadFeeCode1Options();
    this.loadFeeCode2Options();
  }

  private populateFormForEdit(): void {
    if (this.data) {
      const code = this.data.code || '';
      const codeDesc = this.data.codeDesc || '';
      const locationType = this.data.locationType || '';
      const crNcr = this.data.crNcr || '';
      const enforce = this.data.enforce || '';
      const feeCode1 = this.data.feeCode1 || '';
      const feeCode2 = this.data.feeCode2 || '';

      // Store original values for update API
      this.originalValues = {
        chapterId: this.data.chapterId || '',
        code,
        effDate: this.data.effDate || null
      };

      this.editModeValues = {
        code,
        codeDesc,
        locationType,
        crNcr,
        enforce,
        feeCode1,
        feeCode2,
        effectiveDate: this.data.effDate ? this.formatDateForDisplay(this.data.effDate) : '',
        terminationDate: this.data.termDate ? this.formatDateForDisplay(this.data.termDate) : ''
      };

      // Setup edit mode validators (sets up terminationDate validators)
      DateFieldValidationUtility.setupEditModeValidators(this.form);
      // Re-enable effectiveDate for Return Reasons (FMB allows editing EFF_DATE)
      const effCtrl = this.form.get('effectiveDate');
      if (effCtrl) {
        effCtrl.enable();
        effCtrl.setValidators([Validators.required, this.editModeEffDatePastValidator()]);
        effCtrl.updateValueAndValidity();
      }

      this.form.patchValue({
        code,
        codeDesc,
        locationType,
        credit: crNcr === 'Y',
        enforcePolicy: enforce === 'Y',
        feeCode1,
        feeCode2,
        effectiveDate: this.data.effDate ? moment(this.data.effDate) : null,
        terminationDate: this.data.termDate ? moment(this.data.termDate) : null
      }, { emitEvent: false });

      // Mark as pristine immediately since we used emitEvent: false
      this.form.markAsPristine();
      this.form.markAsUntouched();

      // Note: Fee code exclusion logic is handled in loadDropdownOptions() callback
      // after initial options are loaded, to prevent timing issues

      // Force change detection to update the view
      setTimeout(() => {
        this.form.updateValueAndValidity();
      }, 100);
    }
  }

  private formatDateForDisplay(date: Date | null | undefined): string {
    if (!date) return '';
    const m = moment(date);
    return m.isValid() ? m.format('DD-MMM-YYYY') : '';
  }

  onCancel(): void {
    this.closePanel.emit();
  }

  onSave(): void {
    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'terminationDate');

    if (this.form.invalid) {
      return;
    }

    const formValue = this.form.getRawValue();

    this.isSaving = true;

    let apiCall;

    if (this.mode === 'add') {
      const addPayload: ReturnReasonsDto = {
        code: formValue.code?.trim().toUpperCase() || '',
        codeDesc: formValue.codeDesc?.trim() || '',
        locationType: formValue.locationType?.trim() || '',
        crNcr: formValue.credit ? 'Y' : 'N',
        enforce: formValue.enforcePolicy ? 'Y' : 'N',
        feeCode1: formValue.feeCode1?.trim() || '',
        feeCode2: formValue.feeCode2?.trim() || '',
        effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate) as any,
        termDate: DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate) as any,
        loggedInUserName: this.loginService.getStoredUsername() || '',
        chapterId: this.headerService.getCurrentChapterId() || '',
        warehouseId: this.headerService.getCurrentWarehouseId() || '',
        warehouseName: this.headerService.warehouseName() || ''
      };
      apiCall = this.returnReasonsService.addReturnReasons(addPayload);
    } else {
      const updatePayload: UpdateReturnReasonsDto = {
        // Current values (to identify the record)
        currentChapterId: this.originalValues.chapterId,
        currentCode: this.originalValues.code,
        currentEffDate: this.originalValues.effDate ? DateFieldValidationUtility.serializeDateForApi(this.originalValues.effDate) as any : null,
        // New values
        code: formValue.code?.trim().toUpperCase() || '',
        codeDesc: formValue.codeDesc?.trim() || '',
        locationType: formValue.locationType?.trim() || '',
        crNcr: formValue.credit ? 'Y' : 'N',
        enforce: formValue.enforcePolicy ? 'Y' : 'N',
        feeCode1: formValue.feeCode1?.trim() || '',
        feeCode2: formValue.feeCode2?.trim() || '',
        effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate) as any,
        termDate: DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate) as any,
        loggedInUserName: this.loginService.getStoredUsername() || '',
        chapterId: this.headerService.getCurrentChapterId() || '',
        warehouseId: this.headerService.getCurrentWarehouseId() || '',
        warehouseName: this.headerService.warehouseName() || ''
      };
      apiCall = this.returnReasonsService.updateReturnReasons(updatePayload);
    }

    apiCall
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isSaving = false;
        })
      )
      .subscribe({
        next: (response: any) => {
          const message = response?.message || (this.mode === 'add'
            ? 'Return Reasons added successfully'
            : 'Return Reasons updated successfully');

          this.snackBar.open(message, 'DISMISS', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });

          this.saveSuccess.emit();
          this.closePanel.emit();
        },
        error: (error) => {
          console.error('Error saving return reasons:', error);

          let errorMessage = error.error?.message;

          if (!errorMessage) {
            if (error.status === 409) {
              errorMessage = 'This return reasons record already exists';
            } else if (error.status === 404) {
              errorMessage = 'Return Reasons not found';
            } else {
              errorMessage = 'An error occurred while saving';
            }
          }

        }
      });
  }

  onSaveAndCreateAnother(): void {
    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'terminationDate');

    if (this.form.invalid) {
      return;
    }

    const formValue = this.form.getRawValue();

    this.isSaving = true;

    let apiCall;

    if (this.mode === 'add') {
      const addPayload: ReturnReasonsDto = {
        code: formValue.code?.trim().toUpperCase() || '',
        codeDesc: formValue.codeDesc?.trim() || '',
        locationType: formValue.locationType?.trim() || '',
        crNcr: formValue.credit ? 'Y' : 'N',
        enforce: formValue.enforcePolicy ? 'Y' : 'N',
        feeCode1: formValue.feeCode1?.trim() || '',
        feeCode2: formValue.feeCode2?.trim() || '',
        effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate) as any,
        termDate: DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate) as any,
        loggedInUserName: this.loginService.getStoredUsername() || '',
        chapterId: this.headerService.getCurrentChapterId() || '',
        warehouseId: this.headerService.getCurrentWarehouseId() || '',
        warehouseName: this.headerService.warehouseName() || ''
      };
      apiCall = this.returnReasonsService.addReturnReasons(addPayload);
    } else {
      const updatePayload: UpdateReturnReasonsDto = {
        // Current values (to identify the record)
        currentChapterId: this.originalValues.chapterId,
        currentCode: this.originalValues.code,
        currentEffDate: this.originalValues.effDate ? DateFieldValidationUtility.serializeDateForApi(this.originalValues.effDate) as any : null,
        // New values
        code: formValue.code?.trim().toUpperCase() || '',
        codeDesc: formValue.codeDesc?.trim() || '',
        locationType: formValue.locationType?.trim() || '',
        crNcr: formValue.credit ? 'Y' : 'N',
        enforce: formValue.enforcePolicy ? 'Y' : 'N',
        feeCode1: formValue.feeCode1?.trim() || '',
        feeCode2: formValue.feeCode2?.trim() || '',
        effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate) as any,
        termDate: DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate) as any,
        loggedInUserName: this.loginService.getStoredUsername() || '',
        chapterId: this.headerService.getCurrentChapterId() || '',
        warehouseId: this.headerService.getCurrentWarehouseId() || '',
        warehouseName: this.headerService.warehouseName() || ''
      };
      apiCall = this.returnReasonsService.updateReturnReasons(updatePayload);
    }

    apiCall
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isSaving = false;
        })
      )
      .subscribe({
        next: (response: any) => {
          const message = response?.message || 'Operation completed successfully';

          this.snackBar.open(message, 'DISMISS', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });

          this.saveSuccess.emit();
          if (this.mode === 'edit') {
            this.modeChange.emit('add');
          }
          this.resetFormForAddMode();
          this.setupPanel();
        },
        error: (error) => {
          console.error('Error saving return reasons:', error);

          let errorMessage = error.error?.message;

          if (!errorMessage) {
            if (error.status === 409) {
              errorMessage = 'This return reasons record already exists';
            } else if (error.status === 404) {
              errorMessage = 'Return Reasons not found';
            } else {
              errorMessage = 'An error occurred while saving';
            }
          }

        }
      });
  }

  formatDateTime(date: Date | null): string {
    if (!date) return '';
    const momentDate = moment(date);
    const isToday = momentDate.isSame(moment(), 'day');

    if (isToday) {
      return momentDate.format('[Today], hh:mm A [PST]');
    } else {
      return momentDate.format('DD-MMM-YYYY, hh:mm A [PST]');
    }
  }

  getEffectiveDateError(): string {
    const formErrors = this.lastChangedDateField === 'effective' ? this.form.errors : null;
    return DateFieldValidationUtility.getStartDateCrossFieldError(
      this.form.get('effectiveDate'), 'Effective Date', 'Termination Date', formErrors
    );
  }

  getTerminationDateError(): string {
    const formErrors = this.lastChangedDateField === 'termination' ? this.form.errors : null;
    return DateFieldValidationUtility.getEndDateCrossFieldError(
      this.form.get('terminationDate'), 'Termination Date', 'Effective Date', formErrors
    );
  }

  /**
   * Get minimum date for Termination Date field
   * In add mode: greater of (effective date or today)
   * In edit mode: today only (to prevent past dates)
   */
  getTerminationDateMin(): any {
    if (this.mode === 'edit') {
      // Edit mode: only allow today or future dates
      return this.minDate;
    } else {
      // Add mode: must be >= effective date OR today, whichever is greater
      const effectiveDate = this.form.get('effectiveDate')?.value;
      return effectiveDate || this.minDate;
    }
  }

  get isFormValid(): boolean {
    if (this.mode === 'edit') {      
      return this.form.valid && this.form.dirty;
    }
    // In add mode, only require valid form
    return this.form.valid;
  }

  /**
   * Convert reason code input to uppercase
   */
  onCodeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.toUpperCase();
    this.form.get('code')?.setValue(value, { emitEvent: false });
  }

  /**
   * Handle input event on effective date to parse and validate manual entry
   */
  onEffectiveDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const control = this.form.get('effectiveDate');

    if (!control) return;

    const inputValue = input.value?.trim();

    // If field is cleared, clear errors and reset state (same as Termination Date)
    if (!inputValue) {
      control.setValue(null, { emitEvent: false });
      control.setErrors(null);
      if (this.mode === 'edit') {
        control.markAsDirty();
      } else {
        control.markAsPristine();
        control.markAsUntouched();
      }
      control.updateValueAndValidity();
    } else {
      // If input has text but control value is null, datepicker couldn't parse it
      control.markAsTouched();
      control.markAsDirty();
      if (!control.value) {
        control.setErrors({ invalidDate: true });
      }
    }
  }

  /**
   * Handle blur event on effective date to prevent validation from showing on empty field
   */
  onEffectiveDateBlur(event: Event): void {
    const input = event.target as HTMLInputElement;
    const control = this.form.get('effectiveDate');

    if (!control) return;

    const inputValue = input.value?.trim();

    // If field is empty on blur, keep it pristine/untouched (prevents validation on blur)
    if (!inputValue) {
      control.setValue(null, { emitEvent: false });
      control.setErrors(null);
      if (this.mode === 'add') {
        control.markAsPristine();
        control.markAsUntouched();
      }
      control.updateValueAndValidity();
    }
  }

  /**
   * Handle input event on termination date to parse and validate manual entry
   */
  onTerminationDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value, this.form.get('terminationDate'), this.mode === 'edit'
    );
  }



}
