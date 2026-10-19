import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, OnDestroy, Optional, Inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';
import { ValidAboService } from '../services/valid-abo.service';
import { ValidAboCreateDto, LookupOption } from '../models/valid-abo.model';
import { VALIDATION_VALID_ABO } from 'src/app/core/constants/validation.constants';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { noWhitespaceOnlyValidator } from '@shared/validators/input.validators';
import { HeaderService } from '@shared/services/header.service';
import { dateFormatValidator } from 'src/app/core/utils/date-adapter.util';
import moment, { Moment } from 'moment';

// Kept for backward compatibility with spec files and dialog data
export interface AddEditValidAboDialogData {
  mode: 'add' | 'edit';
  data?: any;
}

@Component({
  selector: 'app-add-edit-valid-abo',
  standalone: true,
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    MatDatepickerModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    NgxMatSelectSearchModule
  ],
  templateUrl: './add-edit-valid-abo.html',
  styleUrls: ['./add-edit-valid-abo.scss'],
})
export class AddEditValidAbo implements OnInit, OnChanges, OnDestroy {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() data: any = null;
  @Output() closePanel = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<void>();

  form!: FormGroup;
  panelTitle!: string;
  isSaving = false;
  minDate!: Moment;

  readonly VALIDATION = VALIDATION_VALID_ABO.VALID_ABO_TABLE;

  // Dropdown data - loaded from API lookups endpoint
  intendedUseOptions: LookupOption[] = [];
  unitSchemeOptions: LookupOption[] = [];
  transfusionStatusOptions: LookupOption[] = [];

  aboGroupOnlyOptions: { label: string; value: string }[] = [
    { label: 'Yes', value: 'Yes' },
    { label: 'No', value: 'No' }
  ];

  // Filtered lists for ngx-mat-select-search
  filteredIntendedUseOptions: LookupOption[] = [];
  filteredUnitSchemeOptions: LookupOption[] = [];
  filteredTransfusionStatusOptions: LookupOption[] = [];

  // Search controls
  intendedUseSearchControl = new FormControl<string>('');
  unitSchemeSearchControl = new FormControl<string>('');
  transfusionStatusSearchControl = new FormControl<string>('');

  // Loading states
  isLoadingIntendedUse = false;

  /**
   * Sentinel values for disabled mat-option rows in the panel (loading / empty).
   * Not valid API codes; options are disabled so they never become the control value.
   */
  readonly selectPanelLoadingValue = '__ADD_EDIT_VALID_ABO_PANEL_LOADING__';
  readonly selectPanelEmptyValue = '__ADD_EDIT_VALID_ABO_PANEL_EMPTY__';

  /** Tracks which date field was last changed — cross-field error shows only on that field */
  private lastChangedDateField: 'effective' | 'termination' | null = null;

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEffectiveDateError());
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTerminationDateError());

  /** Termination: not before chapter today and not before Effective Date */
  terminationDateFilter = (date: Moment | null): boolean => {
    if (!date) return true;

    const checkDate = moment(date).startOf('day');
    const today = DateFieldValidationUtility.getMinDate(this.chapterOffset);

    if (checkDate.isBefore(today)) {
      return false;
    }

    const eff = this.form?.get('effectiveDate')?.value;
    if (eff) {
      const effDay = moment(eff).startOf('day');
      if (checkDate.isBefore(effDay)) {
        return false;
      }
    }

    return true;
  };

  private destroy$ = new Subject<void>();

  // Support for both side panel and dialog modes
  private isDialogMode = false;

  constructor(
    private snackBar: MatSnackBar,
    private fb: FormBuilder,
    private validAboService: ValidAboService,
    private headerService: HeaderService,
    @Optional() public dialogRef?: MatDialogRef<AddEditValidAbo>,
    @Optional() @Inject(MAT_DIALOG_DATA) dialogData?: AddEditValidAboDialogData
  ) {
    // If opened as dialog, use dialog data
    if (dialogRef && dialogData) {
      this.isDialogMode = true;
      this.mode = dialogData.mode;
      this.data = dialogData.data || null;
    }
  }

  private get chapterOffset(): string {
    return this.headerService.chapterTimeZone();
  }

  ngOnInit(): void {
    this.minDate = DateFieldValidationUtility.getMinDate(this.chapterOffset);

    this.setupPanel();
    this.setupDropdownSearch();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mode'] || changes['data']) {
      if (!changes['mode']?.firstChange && !changes['data']?.firstChange) {
        this.setupPanel();
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Setup dropdown search filters for lookups with code and description
   */
  private setupDropdownSearch(): void {
    // Intended Use search
    this.intendedUseSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((search) => {
        const term = (search ?? '').toLowerCase();
        this.filteredIntendedUseOptions = this.intendedUseOptions.filter(
          (option) =>
            option.code.toLowerCase().includes(term) ||
            option.description.toLowerCase().includes(term)
        );
      });

    // Unit Scheme search
    this.unitSchemeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((search) => {
        const term = (search ?? '').toLowerCase();
        this.filteredUnitSchemeOptions = this.unitSchemeOptions.filter(
          (option) =>
            option.code.toLowerCase().includes(term) ||
            option.description.toLowerCase().includes(term)
        );
      });

    // Transfusion Status search
    this.transfusionStatusSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((search) => {
        const term = (search ?? '').toLowerCase();
        this.filteredTransfusionStatusOptions = this.transfusionStatusOptions.filter(
          (option) =>
            option.code.toLowerCase().includes(term) ||
            option.description.toLowerCase().includes(term)
        );
      });
  }

  isFormValid(): boolean {
    if (this.mode === 'edit' && !this.form?.dirty) {
      return false;
    }

    const termDateControl = this.form?.get('terminationDate');
    const hasTermDateError = termDateControl?.touched && termDateControl?.hasError('terminationDatePast');
    const hasDateRangeError = this.form?.hasError('dateRangeInvalid');
    const termHasFormatError = termDateControl &&
      (termDateControl.hasError('invalidDate') || termDateControl.hasError('invalidDateFormat') || termDateControl.hasError('matDatepickerParse'));

    if (hasTermDateError || termHasFormatError) {
      return false;
    }

    const otherControlsValid = Object.keys(this.form.controls)
      .filter(key => key !== 'terminationDate')
      .every(key => {
        const control = this.form.get(key);
        return !control || control.disabled || control.valid;
      });

    return otherControlsValid && !hasDateRangeError;
  }

  private setupPanel(): void {
    this.panelTitle = this.mode === 'add' ? 'Add New Record' : 'Edit Record';

    const record = this.data || {};

    // Convert boolean to Yes/No for display
    const aboGroupOnlyValue = record.aboGroupOnly === true ? 'Yes' : record.aboGroupOnly === false ? 'No' : '';

    // Reset last changed date field tracking
    this.lastChangedDateField = null;

    this.form = this.fb.group({
      code: [
        { value: record.code || '', disabled: this.mode === 'edit' },
        [
          Validators.required,
          Validators.minLength(this.VALIDATION.LIMITS.CODE_MIN_LENGTH),
          Validators.maxLength(5),
          Validators.pattern(/^[A-Za-z0-9]+$/)
        ]
      ],
      description: [
        record.description || '',
        [
          Validators.required,
          Validators.maxLength(50),
          noWhitespaceOnlyValidator()
        ]
      ],
      intendedUse: [record.intendedUse?.split('-')[0] || '', Validators.required],
      unitScheme: [record.unitScheme || '', Validators.required],
      transfusionStatus: [record.transfusionStatus || '', Validators.required],
      aboGroupOnly: [aboGroupOnlyValue],
      mnemonic1: [
        record.mnemonic1 || '',
        [
          Validators.maxLength(20),
          Validators.pattern(/^[A-Za-z0-9 ]+$/),
          noWhitespaceOnlyValidator()
        ]
      ],
      mnemonic2: [
        record.mnemonic2 || '',
        [
          Validators.maxLength(20),
          Validators.pattern(/^[A-Za-z0-9 ]+$/),
          noWhitespaceOnlyValidator()
        ]
      ],
      group: [
        record.group || '',
        [
          Validators.maxLength(5)
        ]
      ],
      sequence: [
        record.sequence || null,
        [
          Validators.min(this.VALIDATION.LIMITS.SEQUENCE_MIN),
          Validators.max(this.VALIDATION.LIMITS.SEQUENCE_MAX)
        ]
      ],
      effectiveDate: [this.toMomentOrNull(record.effectiveDate)],
      terminationDate: [this.toMomentOrNull(record.terminationDate)]
    }, {
      validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate')]
    });

    // Setup date validators based on mode
    if (this.mode === 'edit') {
      DateFieldValidationUtility.setupEditModeValidators(this.form, this.chapterOffset);
      this.setupTerminationDateValidatorsForEdit();
      // Mark form as pristine and untouched so save button is disabled until user makes changes
      this.form.markAsPristine();
      this.form.markAsUntouched();
    } else {
      DateFieldValidationUtility.setupAddModeValidators(this.form, this.chapterOffset);
    }

    this.loadDropdowns();

    // Track which date field was last changed for cross-field error display
    this.form.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => { this.lastChangedDateField = 'effective'; });

    this.form.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => { this.lastChangedDateField = 'termination'; });
  }

  private setupTerminationDateValidatorsForEdit(): void {
    const termDateControl = this.form.get('terminationDate');
    if (termDateControl) {
      termDateControl.setValidators([
        dateFormatValidator(),
        DateFieldValidationUtility.validDateValidator(),
        DateFieldValidationUtility.terminationDateNotPastValidator(this.chapterOffset)
      ]);
      termDateControl.updateValueAndValidity({ onlySelf: true, emitEvent: false });
    }
  }

  onCancel(): void {
    if (this.isDialogMode && this.dialogRef) {
      this.dialogRef.close();
    } else {
      this.closePanel.emit();
    }
  }

  onSave(): void {
    const termDateControl = this.form.get('terminationDate');
    const wasTermDateTouched = termDateControl?.touched || false;

    this.form.markAllAsTouched();

    if (termDateControl && !termDateControl.value) {
      termDateControl.setErrors(null);
    }

    if (!wasTermDateTouched && termDateControl) {
      termDateControl.markAsUntouched();
    }

    if (!this.isFormValid()) {
      return;
    }

    const formValue = this.form.getRawValue();

    const payload = {
      code: formValue.code?.trim(),
      description: formValue.description?.trim(),
      intendedUse: formValue.intendedUse,
      unitScheme: formValue.unitScheme,
      transfusionStatus: formValue.transfusionStatus,
      aboGroupOnly: formValue.aboGroupOnly === 'Yes' ? true : formValue.aboGroupOnly === 'No' ? false : false,
      mnemonic1: formValue.mnemonic1?.trim() || '',
      mnemonic2: formValue.mnemonic2?.trim() || '',
      group: formValue.group || undefined,
      sequence: formValue.sequence ? Number(formValue.sequence) : undefined,
      effectiveDate: DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate) || '',
      terminationDate: DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate) || undefined,
      ...(this.mode === 'edit' ? { originalUnitScheme: this.data.unitScheme } : {})
    };

    this.isSaving = true;

    if (this.mode === 'add') {
      this.validAboService.createValidAbo(payload).subscribe({
        next: (response: any) => {
          this.isSaving = false;
          const message = `New code ${payload.code} has been successfully added.`;
          this.snackBar.open(message, 'DISMISS', {
            duration: 5000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });

          if (this.isDialogMode && this.dialogRef) {
            this.dialogRef.close(true);
          } else {
            this.saveSuccess.emit();
            this.closePanel.emit();
          }
        },
        error: () => {
          this.isSaving = false;
        }
      });
    }

    if (this.mode === 'edit') {
      this.validAboService.updateValidAbo(this.data.code, payload).subscribe({
        next: (response: any) => {
          this.isSaving = false;
          const message = `Code ${payload.code} has been successfully updated.`;
          this.snackBar.open(message, 'DISMISS', {
            duration: 5000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });

          if (this.isDialogMode && this.dialogRef) {
            this.dialogRef.close(true);
          } else {
            this.saveSuccess.emit();
            this.closePanel.emit();
          }
        },
        error: () => {
          this.isSaving = false;
        }
      });
    }
  }

  loadDropdowns(): void {
    // Load all dropdowns from lookups API
    this.isLoadingIntendedUse = true;
    this.validAboService.getValidAboLookups()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Intended Use options
          this.intendedUseOptions = response.intendedUse || [];
          this.filteredIntendedUseOptions = [...this.intendedUseOptions];
          this.intendedUseSearchControl.setValue('', { emitEvent: false });

          // Unit Scheme options
          this.unitSchemeOptions = response.unitScheme || [];
          this.filteredUnitSchemeOptions = [...this.unitSchemeOptions];
          this.unitSchemeSearchControl.setValue('', { emitEvent: false });

          // Transfusion Status options
          this.transfusionStatusOptions = response.transfusionStatus || [];
          this.filteredTransfusionStatusOptions = [...this.transfusionStatusOptions];
          this.transfusionStatusSearchControl.setValue('', { emitEvent: false });

          this.isLoadingIntendedUse = false;
        },
        error: (error) => {
          console.error('Error loading lookups:', error);
          this.intendedUseOptions = [];
          this.filteredIntendedUseOptions = [];
          this.unitSchemeOptions = [];
          this.filteredUnitSchemeOptions = [];
          this.transfusionStatusOptions = [];
          this.filteredTransfusionStatusOptions = [];
          this.isLoadingIntendedUse = false;
        }
      });
  }

  // --- Field error getters (BarCode Translation pattern) ---

  getCodeError(): string {
    const control = this.form.get('code');
    if (!control || !control.touched) return '';
    if (control.hasError('required')) return 'Code is required';
    if (control.hasError('pattern')) return 'Only alphanumeric characters allowed (no spaces)';
    if (control.hasError('minlength') || control.hasError('maxlength')) return 'Code must be 1-5 characters';
    return '';
  }

  getDescriptionError(): string {
    const control = this.form.get('description');
    if (!control || !control.touched) return '';
    if (control.hasError('required')) return 'Description is required';
    if (control.hasError('whitespaceOnly')) return 'Description cannot contain only spaces';
    if (control.hasError('maxlength')) return 'Description must not exceed 50 characters';
    return '';
  }

  getIntendedUseError(): string {
    const control = this.form.get('intendedUse');
    if (!control || !control.touched) return '';
    if (control.hasError('required')) return 'Intended Use is required';
    return '';
  }

  getUnitSchemeError(): string {
    const control = this.form.get('unitScheme');
    if (!control || !control.touched) return '';
    if (control.hasError('required')) return 'Unit Scheme is required';
    return '';
  }

  getTransfusionStatusError(): string {
    const control = this.form.get('transfusionStatus');
    if (!control || !control.touched) return '';
    if (control.hasError('required')) return 'Transfusion Status is required';
    return '';
  }

  getGroupError(): string {
    const control = this.form.get('group');
    if (!control || !control.touched) return '';
    if (control.hasError('maxlength')) return 'Group must not exceed 5 characters';
    return '';
  }

  getSequenceError(): string {
    const control = this.form.get('sequence');
    if (!control || !control.touched) return '';
    if (control.hasError('min') || control.hasError('max')) return 'Sequence must be between 0 and 99';
    return '';
  }

  preventSpecialCharsInCode(event: KeyboardEvent): void {
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'Escape'];
    if (allowedKeys.includes(event.key)) return;
    if (event.ctrlKey || event.metaKey) return;

    if (!/^[A-Za-z0-9]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  onCodeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const originalValue = input.value;
    const cursorPosition = input.selectionStart ?? 0;
    const sanitizedValue = originalValue.replace(/[^A-Za-z0-9]/g, '');

    if (originalValue !== sanitizedValue) {
      this.form.patchValue({ code: sanitizedValue }, { emitEvent: false });
      input.value = sanitizedValue;

      const removedChars = originalValue.length - sanitizedValue.length;
      const newPosition = Math.max(0, cursorPosition - removedChars);
      input.setSelectionRange(newPosition, newPosition);
    }
  }

  /**
   * Prevent leading spaces in text fields
   * Blocks space key when cursor is at position 0
   */
  preventLeadingSpace(event: KeyboardEvent, _controlName: string): void {
    const input = event.target as HTMLInputElement;
    const cursorPosition = input.selectionStart ?? 0;

    // Prevent space at the beginning (cursor at position 0)
    if (event.key === ' ' && cursorPosition === 0) {
      event.preventDefault();
    }
  }

  preventSpecialCharsInMnemonic(event: KeyboardEvent, _controlName: string): void {
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'Escape'];

    if (allowedKeys.includes(event.key)) {
      return;
    }

    if (event.ctrlKey || event.metaKey) {
      return;
    }

    const input = event.target as HTMLInputElement;
    const cursorPosition = input.selectionStart ?? 0;

    if (event.key === ' ' && cursorPosition === 0) {
      event.preventDefault();
      return;
    }

    if (!/^[A-Za-z0-9 ]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  /**
   * Trim leading spaces from input as user types or pastes
   * Applied on input event to catch all input methods (typing, paste, etc.)
   */
  onInputTrimLeadingSpace(event: Event, controlName: string): void {
    const input = event.target as HTMLInputElement;
    const originalValue = input.value;

    // Remove leading spaces while preserving trailing and internal spaces
    const trimmedValue = originalValue.replace(/^\s+/, '');

    if (originalValue !== trimmedValue) {
      const control = this.form.get(controlName);
      if (control) {
        control.setValue(trimmedValue, { emitEvent: false });
        input.value = trimmedValue;

        // Restore cursor position (adjusted for removed leading spaces)
        const removedChars = originalValue.length - trimmedValue.length;
        const newPosition = Math.max(0, (input.selectionStart ?? 0) - removedChars);
        input.setSelectionRange(newPosition, newPosition);
      }
    }
  }

  onMnemonicInput(event: Event, controlName: string): void {
    const input = event.target as HTMLInputElement;
    const originalValue = input.value;
    const cursorPosition = input.selectionStart ?? 0;

    let sanitizedValue = originalValue.replace(/[^A-Za-z0-9 ]/g, '');
    sanitizedValue = sanitizedValue.replace(/^\s+/, '');

    if (originalValue !== sanitizedValue) {
      const control = this.form.get(controlName);
      if (control) {
        control.setValue(sanitizedValue, { emitEvent: false });
        input.value = sanitizedValue;

        const removedChars = originalValue.length - sanitizedValue.length;
        const newPosition = Math.max(0, cursorPosition - removedChars);
        input.setSelectionRange(newPosition, newPosition);
      }
    }
  }

  /**
   * For description field: prevent leading spaces AND limit to single space between words
   * Removes leading spaces and replaces multiple consecutive spaces with a single space
   */
  onDescriptionInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const originalValue = input.value;
    const cursorPosition = input.selectionStart ?? 0;

    // Step 1: Remove leading spaces
    let sanitizedValue = originalValue.replace(/^\s+/, '');

    // Step 2: Replace multiple consecutive spaces with a single space
    sanitizedValue = sanitizedValue.replace(/\s{2,}/g, ' ');

    if (originalValue !== sanitizedValue) {
      const control = this.form.get('description');
      if (control) {
        control.setValue(sanitizedValue, { emitEvent: false });
        input.value = sanitizedValue;

        // Calculate new cursor position
        const removedChars = originalValue.length - sanitizedValue.length;
        const newPosition = Math.max(0, cursorPosition - removedChars);
        input.setSelectionRange(newPosition, newPosition);
      }
    }
  }

  preventInvalidNumericChars(event: KeyboardEvent, maxDigits: number = 10): void {
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (allowedKeys.includes(event.key)) return;

    const invalidChars = ['e', 'E', '+', '-', '.'];
    if (invalidChars.includes(event.key)) {
      event.preventDefault();
      return;
    }

    const isDigit = event.key >= '0' && event.key <= '9';
    if (!isDigit) {
      event.preventDefault();
      return;
    }

    const input = event.target as HTMLInputElement;
    if (input.value.length >= maxDigits && input.selectionStart === input.selectionEnd) {
      event.preventDefault();
    }
  }

  preventNonNumericPaste(event: ClipboardEvent): void {
    const pastedText = event.clipboardData?.getData('text') || '';
    if (!/^\d+$/.test(pastedText)) {
      event.preventDefault();
    }
  }

  getMnemonic1Error(): string {
    const control = this.form.get('mnemonic1');
    if (!control || !control.touched) return '';
    if (control.hasError('whitespaceOnly')) return 'Mnemonic cannot contain only spaces';
    if (control.hasError('pattern')) return 'Only alphanumeric characters allowed (no special characters)';
    if (control.hasError('maxlength')) return 'Mnemonic must not exceed 20 characters';
    return '';
  }

  getMnemonic2Error(): string {
    const control = this.form.get('mnemonic2');
    if (!control || !control.touched) return '';
    if (control.hasError('whitespaceOnly')) return 'Mnemonic cannot contain only spaces';
    if (control.hasError('pattern')) return 'Only alphanumeric characters allowed (no special characters)';
    if (control.hasError('maxlength')) return 'Mnemonic must not exceed 20 characters';
    return '';
  }

  private toMomentOrNull(value: any): moment.Moment | null {
    if (!value || value === '-') return null;

    // Try parsing with specific format first (DD-MMM-YYYY from grid)
    let parsed = moment(value, 'DD-MMM-YYYY', true);
    if (parsed.isValid()) return parsed;

    // Fallback to automatic parsing (for ISO dates from API)
    parsed = moment(value);
    return parsed.isValid() ? parsed : null;
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

  getEffectiveDateError(): string {
    const formErrors = this.lastChangedDateField === 'effective' ? this.form.errors : null;
    return DateFieldValidationUtility.getStartDateCrossFieldError(
      this.form.get('effectiveDate'), 'Effective Date', 'Termination Date', formErrors
    );
  }

  getTerminationDateError(): string {
    const control = this.form?.get('terminationDate');

    if (control?.touched && control?.hasError('terminationDatePast')) {
      return 'Termination Date cannot be in the past';
    }

    const formErrors = this.lastChangedDateField === 'termination' ? this.form.errors : null;
    return DateFieldValidationUtility.getEndDateCrossFieldError(
      control, 'Termination Date', 'Effective Date', formErrors
    );
  }
}
