import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  signal,
  computed,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  FormControl
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import {
  MatSnackBar,
  MatSnackBarModule
} from '@angular/material/snack-bar';
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE
} from '@angular/material/core';
import { DD_MON_YYYY_FORMATS } from '../../../../../shared/date/date-formats';
import { ChapterAwareDateAdapter } from '../../../../../shared/date/chapter-aware-date-adapter';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { ValidDonationTypeProcedureCodeService } from '../services/valid-donation-type-procedure-code.service';
import { HeaderService } from '../../../../../shared/services/header.service';
import moment, { Moment } from 'moment';
import { Subject, takeUntil, finalize } from 'rxjs';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import {
  ValidDonationTypeProcedureCodeModel,
  AddDonationTypeProcedureCodeDto,
  UpdateDonationTypeProcedureCodeDto,
  DropdownOptionsResponse,
  AttributeCodesResponse,
  ApiOperationResponse,
  DonationTypeLookup,
  ProcedureCodeLookup,
  AttributeGroupLookup,
  AttributeCodeLookup
} from '../models/valid-donation-type-procedure-code.model';

export interface DonationTypeProcedureCodeFormData {
  donationType: string;
  procedureCode: string;
  attributeGroup: string;
  attributeCode: string;
  effectiveDate: Date;
  terminationDate?: Date | null;
}

@Component({
  selector: 'app-add-edit-donation-type-procedure-code-panel',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatIconModule,
    MatSnackBarModule,
    ReactiveFormsModule,
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './add-edit-donation-type-procedure-code-panel.html',
  styleUrls: ['./add-edit-donation-type-procedure-code-panel.scss']
})
export class AddEditDonationTypeProcedureCodePanel
  implements OnInit, OnChanges, OnDestroy {

  @Input() mode: 'add' | 'edit' = 'add';
  @Input() data: ValidDonationTypeProcedureCodeModel | null = null;

  @Output() closePanel = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<DonationTypeProcedureCodeFormData>();

  form: FormGroup;
  panelTitle = '';

  // Store raw last modified date for reactive formatting
  private lastModifiedDateRaw: string | null = null;

  isLoadingOptions = false;
  isSaving = false;
  isSavingAndAdd = false;

  editModeValues = {
    donationType: '',
    procedureCode: '',
    attributeGroup: '',
    attributeCode: '',
    effectiveDate: ''
  };

  get lastUpdated(): string {
    if (!this.lastModifiedDateRaw) return '';
    const offset = this.headerService.chapterTimeZone();
    const m = offset ? moment.utc(this.lastModifiedDateRaw).utcOffset(offset) : moment(this.lastModifiedDateRaw);
    return m.isValid() ? `Last Modified: ${m.format('DD-MMM-YYYY').toUpperCase()}` : '';
  }

  minDate: Moment;
  terminationMinDate: Moment;

  private getChapterMinDate(): Moment {
    const chapterDate = DateFieldValidationUtility.getMinDate(this.headerService.chapterTimeZone());
    return moment.utc(chapterDate.format('YYYY-MM-DD'), 'YYYY-MM-DD');
  }

  private updateTerminationMinDate(): void {
    const effectiveValue = this.form?.get('effectiveDate')?.value;
    let effectiveMoment: Moment | null = null;

    if (effectiveValue && moment.isMoment(effectiveValue) && effectiveValue.isValid()) {
      effectiveMoment = effectiveValue.clone();
    } else if (effectiveValue instanceof Date && !isNaN(effectiveValue.getTime())) {
      effectiveMoment = moment(effectiveValue);
    }

    if (effectiveMoment) {
      this.terminationMinDate = effectiveMoment.isAfter(this.minDate) ? effectiveMoment : this.minDate.clone();
    } else {
      this.terminationMinDate = this.minDate;
    }
  }

  // Track initial termination date for edit mode
  private initialTerminationDate: moment.Moment | null = null;

  /** Tracks which date field was last changed — cross-field error shows only on that field */
  private lastChangedDateField: 'effective' | 'termination' | null = null;

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEffectiveDateError());
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTerminationDateError());

  // Search controls for searchable dropdowns
  readonly donationTypeSearchControl = new FormControl('');
  readonly procedureCodeSearchControl = new FormControl('');
  readonly attributeGroupSearchControl = new FormControl('');
  readonly attributeCodeSearchControl = new FormControl('');

  // Signals for search filtering
  private readonly donationTypeSearch = signal('');
  private readonly procedureCodeSearch = signal('');
  private readonly attributeGroupSearch = signal('');
  private readonly attributeCodeSearch = signal('');
  private readonly donationTypeOptionsSignal = signal<DonationTypeLookup[]>([]);
  private readonly procedureCodeOptionsSignal = signal<ProcedureCodeLookup[]>([]);
  private readonly attributeGroupOptionsSignal = signal<AttributeGroupLookup[]>([]);
  private readonly attributeCodeOptionsSignal = signal<AttributeCodeLookup[]>([]);

  readonly filteredDonationTypes = computed(() => {
    const search = this.donationTypeSearch().toLowerCase();
    const options = this.donationTypeOptionsSignal();
    if (!search) return options;
    return options.filter(o =>
      o.code.toLowerCase().includes(search) ||
      o.description.toLowerCase().includes(search)
    );
  });

  readonly filteredProcedureCodes = computed(() => {
    const search = this.procedureCodeSearch().toLowerCase();
    const options = this.procedureCodeOptionsSignal();
    if (!search) return options;
    return options.filter(o =>
      o.code.toLowerCase().includes(search) ||
      o.description.toLowerCase().includes(search)
    );
  });

  readonly filteredAttributeGroups = computed(() => {
    const search = this.attributeGroupSearch().toLowerCase();
    const options = this.attributeGroupOptionsSignal();
    if (!search) return options;
    return options.filter(o =>
      o.code.toLowerCase().includes(search) ||
      o.description.toLowerCase().includes(search)
    );
  });

  readonly filteredAttributeCodes = computed(() => {
    const search = this.attributeCodeSearch().toLowerCase();
    const options = this.attributeCodeOptionsSignal();
    if (!search) return options;
    return options.filter(o =>
      o.code.toLowerCase().includes(search) ||
      o.description.toLowerCase().includes(search)
    );
  });

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private service: ValidDonationTypeProcedureCodeService,
    private snackBar: MatSnackBar,
    private headerService: HeaderService,
    private cdr: ChangeDetectorRef
  ) {
    this.minDate = this.getChapterMinDate();
    this.terminationMinDate = this.minDate;

    effect(() => {
      const tz = this.headerService.chapterTimeZone();
      this.minDate = this.getChapterMinDate();

      if (this.mode === 'add') {
        DateFieldValidationUtility.setupAddModeValidators(this.form, tz);
      } else {
        DateFieldValidationUtility.setupEditModeValidators(this.form);
      }

      this.updateTerminationMinDate();
      this.form.get('effectiveDate')?.updateValueAndValidity({ emitEvent: false });
      this.form.get('terminationDate')?.updateValueAndValidity({ emitEvent: false });
    });

    this.form = this.fb.group({
      donationType: [''],
      procedureCode: [''],
      attributeGroup: ['', Validators.required],
      attributeCode: ['', Validators.required],
      effectiveDate: [null, [Validators.required]],
      terminationDate: [null]
    }, {
      validators: [
        DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate'),
        this.mutuallyExclusiveValidator
      ]
    });

    // Setup mutually exclusive behavior
    this.setupMutuallyExclusiveFields();
  }

  ngOnInit(): void {
    this.setupPanel();
    this.loadDropdownOptions();
    this.setupAttributeGroupListener();
    this.setupTerminationDateMinimum();
    this.subscribeToChapterChanges();

    // Subscribe to search control changes
    this.donationTypeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.donationTypeSearch.set(value || ''));

    this.procedureCodeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.procedureCodeSearch.set(value || ''));

    this.attributeGroupSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.attributeGroupSearch.set(value || ''));

    this.attributeCodeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.attributeCodeSearch.set(value || ''));

    // Track which date field was last changed for cross-field error display
    this.form.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'effective';
        this.updateTerminationMinDate();
        this.cdr.detectChanges();
      });

    this.form.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => { this.lastChangedDateField = 'termination'; });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mode'] || changes['data']) {
      this.setupPanel();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===============================
  // MUTUALLY EXCLUSIVE VALIDATION
  // ===============================
  /**
   * Custom validator: At least one of donationType or procedureCode must be provided
   */
  private mutuallyExclusiveValidator = (group: FormGroup): { [key: string]: any } | null => {
    const donationTypeControl = group.get('donationType');
    const procedureCodeControl = group.get('procedureCode');
    const donationType = donationTypeControl?.value;
    const procedureCode = procedureCodeControl?.value;

    // At least one must be provided
    if (!donationType && !procedureCode) {
      // Set control-level errors so they get highlighted and show messages
      donationTypeControl?.setErrors({ atLeastOneRequired: true }, { emitEvent: false });
      procedureCodeControl?.setErrors({ atLeastOneRequired: true }, { emitEvent: false });
      return { atLeastOneRequired: true };
    } else {
      // Clear the atLeastOneRequired error if one of them has a value
      if (donationTypeControl?.hasError('atLeastOneRequired')) {
        donationTypeControl.setErrors(null, { emitEvent: false });
      }
      if (procedureCodeControl?.hasError('atLeastOneRequired')) {
        procedureCodeControl.setErrors(null, { emitEvent: false });
      }
    }

    return null;
  };

  /**
   * Setup mutually exclusive behavior for donationType and procedureCode
   * When one is selected, the other becomes optional (asterisk removed, no required validation) and disabled
   * At least one must be selected
   */
  private setupMutuallyExclusiveFields(): void {
    const donationTypeControl = this.form.get('donationType');
    const procedureCodeControl = this.form.get('procedureCode');

    if (!donationTypeControl || !procedureCodeControl) return;

    // Listen to donationType changes
    donationTypeControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        if (value) {
          // If donationType is selected, disable procedureCode
          procedureCodeControl.disable({ emitEvent: false });
        } else {
          // If donationType is cleared, enable procedureCode
          procedureCodeControl.enable({ emitEvent: false });
        }
        // Trigger validation update
        this.form.updateValueAndValidity({ emitEvent: false });
      });

    // Listen to procedureCode changes
    procedureCodeControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        if (value) {
          // If procedureCode is selected, disable donationType
          donationTypeControl.disable({ emitEvent: false });
        } else {
          // If procedureCode is cleared, enable donationType
          donationTypeControl.enable({ emitEvent: false });
        }
        // Trigger validation update
        this.form.updateValueAndValidity({ emitEvent: false });
      });
  }

  // ===============================
  // DROPDOWN LOADING (SAFE VERSION)
  // ===============================
  private loadDropdownOptions(): void {

    if (!this.service?.getAllDropdownOptions) {
      // Prevent unit test crash
      return;
    }

    this.isLoadingOptions = true;

    this.service.getAllDropdownOptions()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isLoadingOptions = false))
      )
      .subscribe({
        next: (options: DropdownOptionsResponse) => {
          this.donationTypeOptionsSignal.set(options.donationTypes);
          this.procedureCodeOptionsSignal.set(options.procedureCodes);
          this.attributeGroupOptionsSignal.set(options.attributeGroups);
          // Attribute codes will be loaded when attribute group is selected
        },
        error: () => {
          // Error is already displayed by authInterceptor
        }
      });
  }

  /**
   * Setup listener for attribute group changes to dynamically load attribute codes
   */
  private setupAttributeGroupListener(): void {
    const attributeGroupControl = this.form.get('attributeGroup');

    if (!attributeGroupControl) return;

    attributeGroupControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(attribGroup => {
        if (attribGroup) {
          this.loadAttributeCodes(attribGroup);
        } else {
          // Clear attribute codes when no group is selected
          this.attributeCodeOptionsSignal.set([]);
          this.form.get('attributeCode')?.setValue('');
        }
      });
  }

  /**
 * Load attribute codes based on selected attribute group
 */
  private loadAttributeCodes(attribGroup: string): void {
    if (!this.service?.getAttributeCodes) {
      return;
    }

    this.service.getAttributeCodes(attribGroup)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: AttributeCodesResponse) => {
          this.attributeCodeOptionsSignal.set(response.data);
        },
        error: () => {
          // Error is handled by authInterceptor
          this.attributeCodeOptionsSignal.set([]);
        }
      });
  }

  /**
   * Setup minimum date for termination date datepicker.
   * Updates validation when effective date changes
   */
  private setupTerminationDateMinimum(): void {
    const effectiveDateControl = this.form.get('effectiveDate');

    if (!effectiveDateControl) return;

    effectiveDateControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateTerminationMinDate();
        this.form.get('terminationDate')?.updateValueAndValidity({ emitEvent: false });
      });
  }

  // ===============================
  // PANEL SETUP
  // ===============================
  private setupPanel(): void {
    if (this.mode === 'add') {
      this.panelTitle = 'Add New Attribute Mapping';
      this.initialTerminationDate = null;
      this.form.reset();
      this.form.enable();
      // Ensure both donationType and procedureCode are enabled in add mode
      this.form.get('donationType')?.enable();
      this.form.get('procedureCode')?.enable();
      // Mark as pristine so save button is disabled initially
      this.form.markAsPristine();
      this.form.markAsUntouched();
      DateFieldValidationUtility.setupAddModeValidators(this.form, this.headerService.chapterTimeZone());
    } else {
      this.panelTitle = 'Edit Attribute Mapping';
      this.populateEditValues();
      DateFieldValidationUtility.setupEditModeValidators(this.form);
    }
  }

  private populateEditValues(): void {
    if (!this.data) return;

    // Load attribute codes for the selected attribute group in edit mode
    if (this.data.AttribGroup) {
      this.loadAttributeCodes(this.data.AttribGroup);
    }

    // Store raw last modified date (will be formatted reactively by getter)
    this.lastModifiedDateRaw = this.data.LastModifiedDate || null;

    // Format effective date for display (not reactive)
    const formattedEffDate = this.data.EffDate
      ? moment(this.data.EffDate).format('DD-MMM-YYYY')
      : '-';

    // Store values for read-only display
    this.editModeValues.donationType = this.data.DonationType || '-';
    this.editModeValues.procedureCode = this.data.ProcedureCode || '-';
    this.editModeValues.attributeGroup = this.data.AttribGroup || '-';
    this.editModeValues.attributeCode = this.data.AttribCode || '-';
    this.editModeValues.effectiveDate = formattedEffDate;

    // Store initial termination date for comparison
    this.initialTerminationDate = this.data.TermDate ? moment(this.data.TermDate) : null;

    this.form.patchValue({
      donationType: this.data.DonationType || '',
      procedureCode: this.data.ProcedureCode || '',
      attributeGroup: this.data.AttribGroup,
      attributeCode: this.data.AttribCode,
      effectiveDate: this.data.EffDate ? new Date(this.data.EffDate) : null,
      terminationDate: this.data.TermDate ? new Date(this.data.TermDate) : null
    });

    // Disable all fields except terminationDate in edit mode
    this.form.get('donationType')?.disable();
    this.form.get('procedureCode')?.disable();
    this.form.get('attributeGroup')?.disable();
    this.form.get('attributeCode')?.disable();
    this.form.get('effectiveDate')?.disable();
    // terminationDate remains enabled

    this.updateTerminationMinDate();
  }

  // ===============================
  // SAVE
  // ===============================
  onSave(): void {

    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'terminationDate');

    if (this.form.invalid) return;

    const raw = this.form.getRawValue();
    this.isSaving = true;

    // Create base payload
    const basePayload = {
      donationType: raw.donationType || null,
      procedureCode: raw.procedureCode || null,
      attribGroup: raw.attributeGroup,
      attribCode: raw.attributeCode,
      effDate: DateFieldValidationUtility.serializeDateForApi(raw.effectiveDate),
      termDate: raw.terminationDate ? DateFieldValidationUtility.serializeDateForApi(raw.terminationDate) : null
    };

    // Add sortSequence only for add mode
    const request$ = this.mode === 'add'
      ? this.service.addRecord({ ...basePayload, sortSequence: this.data?.SortSequence ?? 0 } as AddDonationTypeProcedureCodeDto)
      : this.service.updateRecord(basePayload as UpdateDonationTypeProcedureCodeDto);

    request$
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isSaving = false))
      )
      .subscribe({
        next: (res: ApiOperationResponse) => {
          this.showSnackBar(res.message || 'Saved successfully', 'Close', { duration: 3000 });

          this.saveSuccess.emit({
            donationType: raw.donationType,
            procedureCode: raw.procedureCode,
            attributeGroup: raw.attributeGroup,
            attributeCode: raw.attributeCode,
            effectiveDate: this.toNativeDate(raw.effectiveDate) || new Date(),
            terminationDate: this.toNativeDate(raw.terminationDate)
          });

          this.closePanel.emit();
        },
        error: (error) => {
          const errorMessage = this.extractErrorMessage(error, 'Error saving record');
          this.showSnackBar(errorMessage, 'Close', { duration: 5000, panelClass: ['error-snackbar'] });
        }
      });
  }

  onCancel(): void {
    this.closePanel.emit();
  }

  private toApiDate(date: any): string {
    if (!date) return '';
    const m = moment(date);
    return m.isValid() ? m.utc(true).toISOString() : '';
  }

  get isFormValid(): boolean {
    return this.form.valid;
  }

  /**
   * Check if form has been modified
   * In add mode: check if form is dirty (user has touched any field)
   * In edit mode: check if termination date has changed from initial value
   */
  get hasFormChanged(): boolean {
    if (this.mode === 'add') {
      // In add mode, form must be dirty (user has made changes)
      return this.form.dirty;
    } else {
      // In edit mode, check if termination date has changed
      const currentTermDate = this.form.get('terminationDate')?.value;

      // Both null/undefined
      if (!this.initialTerminationDate && !currentTermDate) {
        return false;
      }

      // One is null/undefined, the other is not
      if (!this.initialTerminationDate || !currentTermDate) {
        return true;
      }

      // Compare the dates
      return !moment(currentTermDate).isSame(this.initialTerminationDate, 'day');
    }
  }

  /**
   * Check if save button should be enabled
   */
  get isSaveEnabled(): boolean {
    return this.isFormValid && this.hasFormChanged && !this.isSaving && !this.isSavingAndAdd;
  }

  /**
   * Check if donation type field is required (asterisk should be shown)
   * Required only when procedure code is empty
   */
  get isDonationTypeRequired(): boolean {
    if (this.mode === 'edit') return false;
    const procedureCodeValue = this.form.get('procedureCode')?.value;
    return !procedureCodeValue;
  }

  /**
   * Check if procedure code field is required (asterisk should be shown)
   * Required only when donation type is empty
   */
  get isProcedureCodeRequired(): boolean {
    if (this.mode === 'edit') return false;
    const donationTypeValue = this.form.get('donationType')?.value;
    return !donationTypeValue;
  }

  // ===============================
  // ERROR GETTERS
  // ===============================
  getDonationTypeError(): string {
    const control = this.form.get('donationType');
    if (control?.hasError('atLeastOneRequired') && control?.touched) {
      return 'Either Donation Type or Procedure Code is required';
    }
    return '';
  }

  getProcedureCodeError(): string {
    const control = this.form.get('procedureCode');
    if (control?.hasError('atLeastOneRequired') && control?.touched) {
      return 'Either Donation Type or Procedure Code is required';
    }
    return '';
  }

  getAttributeGroupError(): string {
    const control = this.form.get('attributeGroup');
    if (control?.hasError('required') && control?.touched) {
      return 'Attribute Group is required';
    }
    return '';
  }

  getAttributeCodeError(): string {
    const control = this.form.get('attributeCode');
    if (control?.hasError('required') && control?.touched) {
      return 'Attribute Code is required';
    }
    return '';
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

  onEffectiveDateInput(event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value, this.form.get('effectiveDate')
    );
  }

  onTerminationDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value, this.form.get('terminationDate'), this.mode === 'edit'
    );
  }

  // ===============================
  // SAVE AND CREATE ANOTHER
  // ===============================
  onSaveAndCreateAnother(): void {
    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'terminationDate');

    if (this.form.invalid) return;

    const raw = this.form.getRawValue();
    this.isSavingAndAdd = true;

    const payload = {
      donationType: raw.donationType || null,
      procedureCode: raw.procedureCode || null,
      attribGroup: raw.attributeGroup,
      attribCode: raw.attributeCode,
      effDate: DateFieldValidationUtility.serializeDateForApi(raw.effectiveDate),
      termDate: raw.terminationDate ? DateFieldValidationUtility.serializeDateForApi(raw.terminationDate) : null,
      sortSequence: this.data?.SortSequence ?? 0
    };

    this.service.addRecord(payload as AddDonationTypeProcedureCodeDto)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isSavingAndAdd = false))
      )
      .subscribe({
        next: (res: ApiOperationResponse) => {
          this.showSnackBar(res.message || 'Saved successfully', 'Close', { duration: 3000 });

          this.saveSuccess.emit({
            donationType: raw.donationType,
            procedureCode: raw.procedureCode,
            attributeGroup: raw.attributeGroup,
            attributeCode: raw.attributeCode,
            effectiveDate: this.toNativeDate(raw.effectiveDate) || new Date(),
            terminationDate: this.toNativeDate(raw.terminationDate)
          });

          // Reset form for another entry
          this.form.reset();
          // Re-enable both fields after reset
          this.form.get('donationType')?.enable();
          this.form.get('procedureCode')?.enable();
          this.form.patchValue({
            donationType: '',
            procedureCode: '',
            attributeGroup: '',
            attributeCode: '',
            effectiveDate: null,
            terminationDate: null
          });
          // Mark form as pristine to disable save button until user makes changes
          this.form.markAsPristine();
          this.form.markAsUntouched();
        },
        error: (error) => {
          const errorMessage = this.extractErrorMessage(error, 'Error saving record');
          this.showSnackBar(errorMessage, 'Close', { duration: 5000, panelClass: ['error-snackbar'] });
        }
      });
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

  /**
   * Display snackbar message at top of screen
   */
  private showSnackBar(message: string, action: string, config?: any): void {
    this.snackBar.open(message, action, {
      duration: config?.duration || 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: config?.panelClass || [],
      ...config
    });
  }

  private toNativeDate(value: Moment | Date | string | null | undefined): Date | null {
    if (!value) return null;

    // Check if it's a moment object
    if (moment.isMoment(value)) {
      return value.toDate();
    }

    // Check if it's already a Date object
    if (value instanceof Date) {
      return value;
    }

    // Try to parse as date string
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {

      });
  }
}
