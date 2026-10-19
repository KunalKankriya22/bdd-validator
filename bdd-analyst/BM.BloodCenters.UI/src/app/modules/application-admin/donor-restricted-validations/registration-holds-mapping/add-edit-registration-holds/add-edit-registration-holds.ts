import {
  Component,
  OnInit,
  OnDestroy,
  Inject,
  ViewChild,
  ElementRef,
  signal,
  computed
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, ErrorStateMatcher } from '@angular/material/core';
import { DD_MON_YYYY_FORMATS, UppercaseMomentDateAdapter } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { RegistrationHoldsMappingService } from '../services/registration-holds-mapping.service';
import moment, { Moment } from 'moment';
import { Subject, takeUntil, finalize } from 'rxjs';
import {
  RegistrationHoldsMappingModel,
  CreateRegistrationHoldsMappingRequestDto,
  UpdateRegistrationHoldsMappingRequestDto
} from '../models/registration-holds-mapping.model';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

export interface RegistrationHoldsFormData {
  interdictionReason: string;
  code: string;
  description: string;
  effectiveDate: Date;
  terminationDate?: Date | null;
}

export interface CodeOption {
  code: string;
  description: string;
}

@Component({
  selector: 'app-add-edit-registration-holds',
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
  templateUrl: './add-edit-registration-holds.html',
  styleUrls: ['./add-edit-registration-holds.scss']
})
export class AddEditRegistrationHolds implements OnInit, OnDestroy {
  @ViewChild('effectiveDateInput') effectiveDateInput?: ElementRef<HTMLInputElement>;
  @ViewChild('terminationDateInput') terminationDateInput?: ElementRef<HTMLInputElement>;

  mode: 'add' | 'edit' = 'add';
  data: RegistrationHoldsMappingModel | null = null;

  form: FormGroup;
  panelTitle: string = '';

  editModeValues: {
    interdictionReason: string;
    code: string;
    description: string;
    effectiveDate: string;
    terminationDate: string;
  } = {
    interdictionReason: '',
    code: '',
    description: '',
    effectiveDate: '',
    terminationDate: ''
  };

  // Dropdown options as signals for reactivity
  codeOptions = signal<{ code: string; description?: string }[]>([]);

  // Search form controls for dropdowns
  readonly codeSearchControl = new FormControl('');

  // Convert search FormControl values to signals for reactivity
  readonly codeSearch = signal('');

  // Filtered options based on search
  readonly filteredCodes = computed(() => {
    const search = this.codeSearch().toLowerCase();
    const options = this.codeOptions();

    if (!search) return options;
    return options.filter(option =>
      option.code.toLowerCase().includes(search) ||
      (option.description && option.description.toLowerCase().includes(search))
    );
  });

  isLoadingOptions = false;
  isSaving = false;

  // Minimum date for datepicker restrictions
  minDate = DateFieldValidationUtility.getMinDate();

  effDateErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control: FormControl | null): boolean => {
      if (!control) return false;
      return (control.touched || control.dirty) && !!this.getEffectiveDateError();
    }
  };

  termDateErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control: FormControl | null): boolean => {
      if (!control) return false;
      return (control.touched || control.dirty) && !!this.getTerminationDateError();
    }
  };

  terminationDateFilter = (date: moment.Moment | null): boolean => {
    if (!date) return true;
    const checkDate = moment(date).startOf('day');
    const effectiveDate = this.form?.get('effectiveDate')?.value;
    if (effectiveDate) {
      const effDay = moment(effectiveDate).startOf('day');
      if (checkDate.isBefore(effDay)) {
        return false;
      }
    }
    return true;
  };

  /**
   * Computed minimum date for termination date picker.
   * Returns the latest of chapter's today or effective date.
   */
  get minTerminationDate(): moment.Moment {
    const today = DateFieldValidationUtility.getMinDate(); // Use chapter local date
    const effectiveDate = this.form?.get('effectiveDate')?.value;
    if (!effectiveDate) return today;
    const effDate = moment(effectiveDate).startOf('day');
    return effDate.isAfter(today) ? effDate : today;
  }

  // Store original values for update operations
  private originalInterdictionReason: string = '';
  private originalCode: string = '';
  private originalValues: any = null;

  private lastChangedDateField: 'effective' | 'termination' | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private registrationHoldsMappingService: RegistrationHoldsMappingService,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<AddEditRegistrationHolds>,
    private dateAdapter: DateAdapter<Moment>,
    @Inject(MAT_DIALOG_DATA) public dialogData: { mode: 'add' | 'edit'; record?: RegistrationHoldsMappingModel }
  ) {
    // Initialize from dialog data
    this.mode = dialogData.mode || 'add';
    this.data = dialogData.record || null;
    this.form = this.fb.group({
      interdictionReason: ['', [Validators.required]],
      code: ['', [Validators.required]],
      description: [''],  // No validation - autopopulated from code selection
      effectiveDate: [null],  // Validators will be set by utility in ngOnInit
      terminationDate: [null] // Validators will be set by utility in ngOnInit
    }, {
      validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate')]
    });

    // Subscribe to search control changes
    this.codeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.codeSearch.set(value || '');
      });

    // Track which date field was last changed for cross-field error display
    this.form.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'effective';
        this.form.get('terminationDate')?.updateValueAndValidity({ emitEvent: false });
      });

    // Listen to termination date changes to validate input
    this.form.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'termination';
        this.validateTerminationDateInput();
      });

    // Listen to effective date changes to validate input (only in add mode)
    if (this.mode === 'add') {
      this.form.get('effectiveDate')?.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.validateEffectiveDateInput();
        });
    }
  }

  ngOnInit(): void {
    this.setupPanel();
    this.loadCodeOptions();
    this.setupCodeChangeListener();

    // Setup mode-specific validators using utility only
    if (this.mode === 'edit') {
      DateFieldValidationUtility.setupEditModeValidators(this.form);
    } else {
      DateFieldValidationUtility.setupAddModeValidators(this.form);
    }

    // Disable description field in both modes since it's autopopulated
    this.form.get('description')?.disable();
  }

  /**
   * Load code options with descriptions from API
   */
  private loadCodeOptions(): void {
    this.isLoadingOptions = true;

    this.registrationHoldsMappingService.getCodeDropdowns()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.codeOptions.set(response.data || []);
          this.isLoadingOptions = false;
        },
        error: (error) => {
          console.error('Error loading code options:', error);
          this.codeOptions.set([]);
          this.isLoadingOptions = false;
        }
      });
  }

  /**
   * Setup listener for code changes to auto-populate description (works in both add and edit modes)
   */
  private setupCodeChangeListener(): void {
    this.form.get('code')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(selectedCode => {
        const descriptionControl = this.form.get('description');
        if (selectedCode) {
          const selectedOption = this.codeOptions().find(opt => opt.code === selectedCode);
          if (selectedOption && selectedOption.description) {
            // Enable briefly to set value, then disable again in add mode
            if (this.mode === 'add') {
              descriptionControl?.enable({ emitEvent: false });
            }
            this.form.patchValue({
              description: selectedOption.description
            }, { emitEvent: false });
            if (this.mode === 'add') {
              descriptionControl?.disable({ emitEvent: false });
            }
          }
        } else {
          // Clear description if code is cleared
          this.form.patchValue({
            description: ''
          }, { emitEvent: false });
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupPanel(): void {
    if (this.mode === 'add') {
      this.panelTitle = 'Add New Record';
    } else {
      this.panelTitle = 'Edit Record';
      this.populateFormForEdit();
    }
  }

  private resetFormForAddMode(): void {
    this.form.reset();
    this.form.markAsUntouched();
    this.form.markAsPristine();

    // Restore required validators for add mode
    this.form.get('interdictionReason')?.setValidators([Validators.required]);
    this.form.get('code')?.setValidators([Validators.required]);
    // Description has no validators - autopopulated from code selection
    this.form.get('effectiveDate')?.setValidators([Validators.required, DateFieldValidationUtility.effectiveDateNotPastValidator()]);

    // Update validity
    this.form.get('interdictionReason')?.updateValueAndValidity();
    this.form.get('code')?.updateValueAndValidity();
    this.form.get('description')?.updateValueAndValidity();
    this.form.get('effectiveDate')?.updateValueAndValidity();

    // Disable description field since it's autopopulated
    this.form.get('description')?.disable();
  }

  private populateFormForEdit(): void {
    if (this.data) {
      // Store original values for update operation
      this.originalInterdictionReason = this.data.interdictionReason || '';
      this.originalCode = this.data.code || '';

      // Store formatted values for display cards in edit mode
      this.editModeValues = {
        interdictionReason: this.data.interdictionReason || '',
        code: this.data.code || '',
        description: this.data.description || '',
        effectiveDate: this.data.effectiveDate ? DateFieldValidationUtility.formatDateForUI(moment.utc(this.data.effectiveDate)).toUpperCase() : '',
        terminationDate: this.data.terminationDate ? DateFieldValidationUtility.formatDateForUI(moment.utc(this.data.terminationDate)).toUpperCase() : ''
      };

      this.form.patchValue({
        interdictionReason: this.data.interdictionReason || '',
        code: this.data.code || '',
        description: this.data.description || '',
        effectiveDate: this.data.effectiveDate ? moment.utc(this.data.effectiveDate) : null,
        terminationDate: this.data.terminationDate ? moment.utc(this.data.terminationDate) : null
      });

      // In edit mode, remove validators from read-only fields
      // (interdictionReason, description, effectiveDate)
      // Note: Code is now editable in edit mode
      this.form.get('interdictionReason')?.clearValidators();
      this.form.get('description')?.clearValidators();
      this.form.get('effectiveDate')?.clearValidators();

      // Update validity
      this.form.get('interdictionReason')?.updateValueAndValidity();
      this.form.get('description')?.updateValueAndValidity();
      this.form.get('effectiveDate')?.updateValueAndValidity();

      // Store original values for change detection
      this.originalValues = this.form.getRawValue();
    }
  }


  onEffectiveDateBlur(): void {
    // Trigger validation after blur to ensure Material datepicker has parsed the input
    setTimeout(() => {
      const control = this.form.get('effectiveDate');
      const inputElement = this.effectiveDateInput?.nativeElement;
      const inputValue = inputElement?.value?.trim() || '';

      // Mark as touched to ensure error state is displayed
      control?.markAsTouched();

      // If there's input text but no parsed value, try to manually parse it
      if (inputValue && !control?.value) {
        const formats = Array.isArray(DD_MON_YYYY_FORMATS.parse.dateInput)
          ? DD_MON_YYYY_FORMATS.parse.dateInput
          : [DD_MON_YYYY_FORMATS.parse.dateInput];

        const parsed = this.dateAdapter.parse(inputValue, formats);

        if (parsed && moment.isMoment(parsed) && parsed.isValid()) {
          // Successfully parsed - set the value and update the input display
          control?.setValue(parsed);
          if (inputElement) {
            inputElement.value = this.dateAdapter.format(parsed, DD_MON_YYYY_FORMATS.display.dateInput);
          }
        }
      }

      this.validateEffectiveDateInput();
      control?.updateValueAndValidity();
    }, 0);
  }

  onTerminationDateBlur(): void {
    // Trigger validation after blur to ensure Material datepicker has parsed the input
    setTimeout(() => {
      const control = this.form.get('terminationDate');
      const inputElement = this.terminationDateInput?.nativeElement;
      const inputValue = inputElement?.value?.trim() || '';

      // Mark as touched to ensure error state is displayed
      control?.markAsTouched();

      // If there's input text but no parsed value, try to manually parse it
      if (inputValue && !control?.value) {
        const formats = Array.isArray(DD_MON_YYYY_FORMATS.parse.dateInput)
          ? DD_MON_YYYY_FORMATS.parse.dateInput
          : [DD_MON_YYYY_FORMATS.parse.dateInput];

        const parsed = this.dateAdapter.parse(inputValue, formats);

        if (parsed && moment.isMoment(parsed) && parsed.isValid()) {
          // Successfully parsed - set the value and update the input display
          control?.setValue(parsed);
          if (inputElement) {
            inputElement.value = this.dateAdapter.format(parsed, DD_MON_YYYY_FORMATS.display.dateInput);
          }
        }
      }

      this.validateTerminationDateInput();
      control?.updateValueAndValidity();
    }, 0);
  }

  private validateEffectiveDateInput(): void {
    const control = this.form.get('effectiveDate');
    const inputElement = this.effectiveDateInput?.nativeElement;
    const inputValue = inputElement?.value?.trim() || '';

    if (inputValue && !control?.value && control) {
      // Set custom error when input has text but value is null (invalid date)
      control.setErrors({ ...control.errors, invalidDate: true });
    } else if (control?.hasError('invalidDate') && (!inputValue || control?.value)) {
      // Clear custom error if input is empty or has valid value
      const errors = { ...control.errors };
      delete errors['invalidDate'];
      control.setErrors(Object.keys(errors).length > 0 ? errors : null);
    }
  }

  private validateTerminationDateInput(): void {
    const control = this.form.get('terminationDate');
    const inputElement = this.terminationDateInput?.nativeElement;
    const inputValue = inputElement?.value?.trim() || '';

    if (inputValue && !control?.value && control) {
      // Set custom error when input has text but value is null (invalid date)
      control.setErrors({ ...control.errors, invalidDate: true });
    } else if (control?.hasError('invalidDate') && (!inputValue || control?.value)) {
      // Clear custom error if input is empty or has valid value
      const errors = { ...control.errors };
      delete errors['invalidDate'];
      control.setErrors(Object.keys(errors).length > 0 ? errors : null);
    }
  }

  /**
   * Handle interdiction reason input - uppercase only, no spaces
   */
  onInterdictionReasonInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value;

    // Remove spaces and convert to uppercase
    value = value.replace(/\s/g, '').toUpperCase();

    // Update the form control
    this.form.get('interdictionReason')?.setValue(value, { emitEvent: false });

    // Update the input element
    input.value = value;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'terminationDate');

    if (this.form.invalid || this.form.hasError('dateRangeInvalid')) {
      return;
    }

    const formValue = this.form.getRawValue();

    this.isSaving = true;

    let apiCall;

    if (this.mode === 'add') {
      const createPayload: CreateRegistrationHoldsMappingRequestDto = {
        InterReason: formValue.interdictionReason?.trim() || '',
        Code: formValue.code?.trim() || '',
        EffectiveDate: formValue.effectiveDate ? DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate) : null,
        TerminationDate: formValue.terminationDate ? DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate) : null
      };
      apiCall = this.registrationHoldsMappingService.addRegistrationHold(createPayload);
    } else {
      const updatePayload: UpdateRegistrationHoldsMappingRequestDto = {
        OriginalInterReason: this.originalInterdictionReason,
        OriginalCode: this.originalCode,
        Code: formValue.code?.trim() || this.originalCode, // Code is now editable in edit mode
        EffectiveDate: formValue.effectiveDate ? DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate) : null,
        TerminationDate: formValue.terminationDate ? DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate) : null
      };
      apiCall = this.registrationHoldsMappingService.updateRegistrationHold(updatePayload);
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
          const code = formValue.code?.trim();

          const message = this.mode === 'add'
            ? `New Mapping for code ${code} has been added successfully.`
            : `Mapping for code ${code} has been updated successfully.`;

          this.snackBar.open(message, 'DISMISS', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });

          this.dialogRef.close(true);
        },
        error: (error) => {
          console.error('Error saving registration hold:', error);

          let errorMessage = error.error?.message;

          if (!errorMessage) {
            if (error.status === 409) {
              errorMessage = 'This registration hold already exists';
            } else if (error.status === 404) {
              errorMessage = 'Record not found';
            } else {
              errorMessage = 'An error occurred while saving';
            }
          }

        }
      });
  }

  get interdictionReasonControl() {
    return this.form.get('interdictionReason');
  }

  get codeControl() {
    return this.form.get('code');
  }

  get descriptionControl() {
    return this.form.get('description');
  }

  get effectiveDateControl() {
    return this.form.get('effectiveDate');
  }

  get terminationDateControl() {
    return this.form.get('terminationDate');
  }

  getInterdictionReasonError(): string {
    const control = this.interdictionReasonControl;
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return 'Interdiction Reason is required';
    }
    return '';
  }

  getEffectiveDateError(): string {
    const control = this.form.get('effectiveDate');
    if (!control) return '';

    // Priority 1: Check for custom invalid date error (set by validateEffectiveDateInput)
    if (control.hasError('invalidDate')) {
      return 'Effective Date is invalid';
    }

    // Priority 2: Check for parse errors
    if (control.hasError('matDatepickerParse')) {
      return 'Effective Date is invalid';
    }

    // Check if the native input has text but control value is null (unparseable input)
    // This handles cases where user types random text that Material doesn't recognize as a date
    const inputElement = this.effectiveDateInput?.nativeElement;
    const hasInputValue = inputElement && inputElement.value && inputElement.value.trim() !== '';
    if (hasInputValue && !control.value && control.hasError('required')) {
      return 'Effective Date is invalid';
    }

    // Priority 3: Check other validation errors (only if touched/dirty)
    if (!(control.touched || control.dirty)) {
      return '';
    }

    if (control.hasError('required')) {
      return 'Effective Date is required';
    }
    if (control.hasError('effectiveDatePast')) {
      return 'Effective date cannot be prior to system date';
    }

    // Show dateRangeInvalid on effective date when it was the last changed field
    if (this.lastChangedDateField === 'effective' && this.form.errors?.['dateRangeInvalid']) {
      return 'Effective Date must be on or before Termination Date';
    }

    return '';
  }

  getTerminationDateError(): string {
    const control = this.form.get('terminationDate');
    if (!control) return '';

    // Priority 1: Check for custom invalid date error (set by validateTerminationDateInput)
    if (control.hasError('invalidDate')) {
      return 'Termination Date is invalid';
    }

    // Priority 2: Check for parse errors
    if (control.hasError('matDatepickerParse')) {
      return 'Termination Date is invalid';
    }

    // Check if the native input has text but control value is null (unparseable input)
    const inputElement = this.terminationDateInput?.nativeElement;
    const hasInputValue = inputElement && inputElement.value && inputElement.value.trim() !== '';
    if (hasInputValue && !control.value) {
      return 'Termination Date is invalid';
    }

    // Priority 3: Check other validation errors (only if touched/dirty)
    if (!(control.touched || control.dirty)) {
      return '';
    }

    if (this.lastChangedDateField !== 'effective') {
      if (control.hasError('matDatepickerMin')) {
        return 'Termination Date must be on or after Effective Date';
      }

      if (this.form.errors?.['dateRangeInvalid']) {
        return 'Termination Date must be on or after Effective Date';
      }
    }

    return '';
  }

  getCodeError(): string {
    const control = this.codeControl;
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return 'Code is required';
    }
    return '';
  }

  getDescriptionError(): string {
    const control = this.descriptionControl;
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return 'Description is required';
    }
    return '';
  }

  get isFormValid(): boolean {
    // Check all controls except optional terminationDate
    const termControl = this.form.get('terminationDate');
    const termHasRealError = termControl &&
      (termControl.hasError('invalidDate') ||
       termControl.hasError('invalidDateFormat') ||
       termControl.hasError('matDatepickerParse') ||
       termControl.hasError('matDatepickerMin') ||
       termControl.hasError('terminationDatePast'));

    if (termHasRealError) {
      return false;
    }

    // Check validity of other controls (exclude termination date errors from form.valid check)
    const otherControlsValid = Object.keys(this.form.controls)
      .filter(key => key !== 'terminationDate')
      .every(key => {
        const control = this.form.get(key);
        return !control || control.disabled || control.valid;
      });

    // In add mode, check that form is dirty and valid
    if (this.mode === 'add') {
      return otherControlsValid && !this.form.hasError('dateRangeInvalid') && this.form.dirty;
    }

    // In edit mode, check if there are changes and form is valid
    return otherControlsValid && !this.form.hasError('dateRangeInvalid') && this.hasFormChanged();
  }

  private hasFormChanged(): boolean {
    if (!this.originalValues) {
      return true; // If no original values, allow save
    }

    const currentValues = this.form.getRawValue();

    // In edit mode, code and terminationDate are editable
    // Note: interdictionReason, description, and effectiveDate are read-only in edit mode

    // Check code
    const originalCode = this.originalValues.code?.trim() || '';
    const currentCode = currentValues.code?.trim() || '';

    if (originalCode !== currentCode) {
      return true;
    }

    // Check terminationDate
    const originalTermDate = this.originalValues.terminationDate
      ? DateFieldValidationUtility.serializeDateForApi(this.originalValues.terminationDate)
      : null;
    const currentTermDate = currentValues.terminationDate
      ? DateFieldValidationUtility.serializeDateForApi(currentValues.terminationDate)
      : null;

    if (originalTermDate !== currentTermDate) {
      return true;
    }

    return false;
  }
}
