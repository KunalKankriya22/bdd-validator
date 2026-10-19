import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  OnDestroy,
  Output,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ViewChild,
  ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { noWhitespaceOnlyValidator } from '@shared/validators/input.validators';
import { Subject, takeUntil, finalize } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { DateAdapter, MAT_DATE_FORMATS, ErrorStateMatcher } from '@angular/material/core';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { HeaderService } from '@shared/services/header.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EmfProcessesService, AddEditProcessCodeDto } from '../services/emf-processes.service';
import moment, { Moment } from 'moment';

export interface AddProcessCodePayload {
  processCode: string;
  processDescription: string;
  effectiveDate: Date | null;
  terminationDate: Date | null;
}

export interface EditProcessCodeData {
  code: string;
  description: string;
  rulesText: string;
  effectiveDate: string;
  terminationDate?: string;
}

@Component({
  selector: 'app-add-edit-process-code',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatDatepickerModule,
    MatInputModule,
    MatFormFieldModule
  ],
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }
  ],
  templateUrl: './add-edit-process-code.html',
  styleUrls: ['./add-edit-process-code.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddEditProcessCode implements OnInit, OnDestroy {
  @Input() mode: 'add' | 'edit' | 'view' = 'add';
  @Input() editData: EditProcessCodeData | null = null;
  @Output() save = new EventEmitter<AddProcessCodePayload>();
  @Output() saveAndCreateAnother = new EventEmitter<AddProcessCodePayload>();
  @Output() cancel = new EventEmitter<void>();
  @Output() closePanel = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<void>();

  @ViewChild('effectiveDateInput') effectiveDateInput?: ElementRef<HTMLInputElement>;
  @ViewChild('terminationDateInput') terminationDateInput?: ElementRef<HTMLInputElement>;

  form!: FormGroup;
  panelTitle = '';
  isFormDirty = false;
  private initialFormSnapshot = '';
  private periodKeyPressed = false;
  private valueBeforeInput: Record<string, string> = {};
  private effectiveDateRawInput = '';
  private terminationDateRawInput = '';
  private lastChangedDateField: 'effective' | 'termination' | null = null;
  private destroy$ = new Subject<void>();

  get isEdit(): boolean { return this.mode === 'edit'; }
  get isView(): boolean { return this.mode === 'view'; }
  get title(): string {
    if (this.mode === 'view') return 'View Process Code';
    return this.isEdit ? 'Edit Process Code' : 'Add New Process Code';
  }
  get isSaveDisabled(): boolean {
    return this.form.invalid || this.hasDateErrors || this.isSaving || (this.isEdit && !this.isFormDirty);
  }

  private get chapterOffset(): string {
    return this.headerService.chapterTimeZone();
  }

  get minDate() {
    return DateFieldValidationUtility.getMinDate(this.chapterOffset);
  }

  get hasDateErrors(): boolean {
    const eff = this.form.get('effectiveDate');
    const term = this.form.get('terminationDate');
    return !!(
      eff?.hasError('invalidDate') ||
      eff?.hasError('invalidDateFormat') ||
      eff?.hasError('matDatepickerParse') ||
      term?.hasError('invalidDate') ||
      term?.hasError('invalidDateFormat') ||
      term?.hasError('matDatepickerParse')
    );
  }

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

  isSaving = false;
  isEffectiveDateLocked = false;

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private dateAdapter: DateAdapter<any>,
    private headerService: HeaderService,
    private emfProcessesService: EmfProcessesService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Set panel title
    this.panelTitle = this.title;

    const d = this.editData;
    this.form = this.fb.group({
      processCode: [{ value: d?.code ?? '', disabled: this.isEdit }, [Validators.required, Validators.maxLength(10), Validators.pattern(/^[a-zA-Z0-9]*$/), noWhitespaceOnlyValidator()]],
      processDescription: [d?.description ?? '', [Validators.required, Validators.maxLength(240), noWhitespaceOnlyValidator()]],
      effectiveDate: [d?.effectiveDate ? this.parseDate(d.effectiveDate) : null, [Validators.required]],
      terminationDate: [d?.terminationDate ? this.parseDate(d.terminationDate) : null]
    }, {
      validators: [DateFieldValidationUtility.dateRangeValidator()]
    });

    // Setup date validators
    if (this.mode === 'add') {
      DateFieldValidationUtility.setupAddModeValidators(this.form, this.chapterOffset);
      // Override termination date to remove dateFormatValidator (not compatible with Moment adapter)
      const termDateControl = this.form.get('terminationDate');
      if (termDateControl) {
        termDateControl.clearValidators();
        termDateControl.setValidators([
          DateFieldValidationUtility.validDateValidator(),
          DateFieldValidationUtility.terminationDateNotPastValidator(this.chapterOffset)
        ]);
        termDateControl.updateValueAndValidity();
      }
    } else {
      const effDateControl = this.form.get('effectiveDate');
      const effDateValue = effDateControl?.value;
      if (effDateValue) {
        const today = DateFieldValidationUtility.getMinDate(this.chapterOffset);
        const effMoment = moment.isMoment(effDateValue) ? effDateValue : moment(effDateValue);
        if (effMoment.format('YYYY-MM-DD') < today.format('YYYY-MM-DD')) {
          this.isEffectiveDateLocked = true;
          effDateControl?.disable();
        } else {
          effDateControl?.setValidators([
            Validators.required,
            DateFieldValidationUtility.validDateValidator(),
            DateFieldValidationUtility.effectiveDateNotPastValidator(this.chapterOffset)
          ]);
          effDateControl?.updateValueAndValidity();
        }
      } else {
        this.isEffectiveDateLocked = true;
        effDateControl?.disable();
      }
      // Store the original termination date to skip past-date validation for existing data
      const originalTermDate = d?.terminationDate ? this.parseDate(d.terminationDate) : null;
      const termDateControl = this.form.get('terminationDate');
      if (termDateControl) {
        termDateControl.clearValidators();
        termDateControl.setValidators([
          DateFieldValidationUtility.validDateValidator(),
          this.editModeTermDateValidator(originalTermDate)
        ]);
        termDateControl.updateValueAndValidity();
      }
    }

    // Re-validate termination date when effective date changes
    // and track which date field was last changed for cross-field error display
    this.form.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'effective';
        this.form.get('terminationDate')?.updateValueAndValidity({ emitEvent: false });
      });

    this.form.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'termination';
      });

    this.initialFormSnapshot = this.normalizeFormValue();

    // Listen to each enabled control individually to ensure dirty detection works with OnPush
    ['processDescription', 'terminationDate'].forEach(controlName => {
      this.form.get(controlName)?.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.isFormDirty = this.normalizeFormValue() !== this.initialFormSnapshot;
          this.cdr.markForCheck();
        });
    });

    if (!this.isEdit) {
      ['processCode', 'effectiveDate'].forEach(controlName => {
        this.form.get(controlName)?.valueChanges
          .pipe(takeUntil(this.destroy$))
          .subscribe(() => {
            this.isFormDirty = this.normalizeFormValue() !== this.initialFormSnapshot;
            this.cdr.markForCheck();
          });
      });
    } else if (!this.isEffectiveDateLocked) {
      this.form.get('effectiveDate')?.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.isFormDirty = this.normalizeFormValue() !== this.initialFormSnapshot;
          this.cdr.markForCheck();
        });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private editModeTermDateValidator(originalTermDate: any): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) return null;

      const selectedDate = moment.isMoment(value) ? value : moment(value);
      if (!selectedDate.isValid()) return null;

      // If date is same as original, allow it (even if past)
      if (originalTermDate) {
        const origDate = moment.isMoment(originalTermDate) ? originalTermDate : moment(originalTermDate);
        if (selectedDate.format('YYYY-MM-DD') === origDate.format('YYYY-MM-DD')) {
          return null;
        }
      }

      // Only block NEW past dates
      const today = DateFieldValidationUtility.getMinDate(this.chapterOffset);
      if (selectedDate.format('YYYY-MM-DD') < today.format('YYYY-MM-DD')) {
        return { terminationDatePast: true };
      }

      return null;
    };
  }

  private normalizeFormValue(): string {
    const v = this.form.getRawValue();
    return JSON.stringify({
      processCode: v.processCode?.trim() || '',
      processDescription: v.processDescription || '',
      effectiveDate: v.effectiveDate ? moment(v.effectiveDate).format('YYYY-MM-DD') : null,
      terminationDate: v.terminationDate ? moment(v.terminationDate).format('YYYY-MM-DD') : null
    });
  }

  private parseDate(dateStr: string): any {
    if (!dateStr) return null;

    // Handle ISO format (e.g., 2017-03-15T00:00:00)
    if (dateStr.includes('T') || /^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
      const m = moment(dateStr);
      return m.isValid() ? m : null;
    }

    // Handle DD-MMM-YYYY format
    const m = moment(dateStr, 'DD-MMM-YYYY', true);
    return m.isValid() ? m : null;
  }

  /**
   * Captures the control value BEFORE the keystroke modifies it,
   * and tracks whether the period key was physically pressed.
   * Must be bound as (keydown) on every text input that calls sanitizeInput.
   */
  onTextKeyDown(event: KeyboardEvent, controlName: string): void {
    if (event.key === '.') {
      this.periodKeyPressed = true;
    }
    const control = this.form.get(controlName);
    // Snapshot the current value (may be uppercase for processCode).
    // sanitizeInput compares period counts only, so case mismatch is harmless.
    if (control && typeof control.value === 'string') {
      this.valueBeforeInput[controlName] = control.value;
    }
  }

  sanitizeInput(controlName: string): void {
    const control = this.form.get(controlName);
    if (!control) return;
    const value = control.value;
    if (typeof value !== 'string') return;

    let sanitized = value;

    // Detect macOS double-space period: a new period appeared without the user pressing '.'
    const prev = this.valueBeforeInput[controlName];
    if (prev !== undefined && !this.periodKeyPressed) {
      const prevPeriodCount = (prev.match(/\./g) || []).length;
      const currPeriodCount = (value.match(/\./g) || []).length;

      if (currPeriodCount > prevPeriodCount) {
        const lastDotIndex = sanitized.lastIndexOf('.');
        if (lastDotIndex !== -1) {
          sanitized = sanitized.substring(0, lastDotIndex) + sanitized.substring(lastDotIndex + 1);
        }
      }
    }
    this.periodKeyPressed = false;

    // Remove leading spaces and collapse multiple spaces
    sanitized = sanitized.replace(/^\s+/, '').replace(/\s{2,}/g, ' ');
    if (sanitized !== value) {
      control.setValue(sanitized, { emitEvent: false });
    }
  }

  toUpperCase(controlName: string): void {
    const control = this.form.get(controlName);
    if (!control) return;
    const value = control.value;
    if (typeof value === 'string') {
      const upper = value.toUpperCase();
      if (upper !== value) {
        control.setValue(upper, { emitEvent: false });
      }
    }
  }

  trimInput(controlName: string): void {
    const control = this.form.get(controlName);
    if (!control) return;
    const value = control.value;
    if (typeof value === 'string') {
      const trimmed = value.trimEnd();
      if (trimmed !== value) {
        control.setValue(trimmed, { emitEvent: false });
      }
    }
  }

  // Date validation methods - Following Valid Facility Identifier pattern
  onDateInputChange(event: any, controlName: string): void {
    const input = event.target as HTMLInputElement;
    const inputValue = input.value?.trim() || '';

    if (controlName === 'effectiveDate') {
      this.effectiveDateRawInput = inputValue;
    } else if (controlName === 'terminationDate') {
      this.terminationDateRawInput = inputValue;
    }
  }

  onDateBlur(event: any, controlName: string): void {
    // Trigger validation after blur to ensure Material datepicker has parsed the input
    setTimeout(() => {
      if (controlName === 'effectiveDate') {
        this.onEffectiveDateBlur();
      } else if (controlName === 'terminationDate') {
        this.onTerminationDateBlur();
      }
    }, 0);
  }

  private onEffectiveDateBlur(): void {
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
    this.cdr.markForCheck();
  }

  private onTerminationDateBlur(): void {
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
    this.cdr.markForCheck();
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

  getEffectiveDateError(): string {
    const control = this.form.get('effectiveDate');
    if (!control) return '';

    /// Priority 1: Check for custom invalid date error (set by validateEffectiveDateInput)
    if (control.hasError('invalidDate')) {
      return 'Effective Date is invalid';
    }

    /// Priority 2: Check for parse errors
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

    /// Priority 3: Check other validation errors (only if touched/dirty)
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

    /// Priority 1: Check for custom invalid date error (set by validateTerminationDateInput)
    if (control.hasError('invalidDate')) {
      return 'Termination Date is invalid';
    }

    /// Priority 2: Check for parse errors
    if (control.hasError('matDatepickerParse')) {
      return 'Termination Date is invalid';
    }

    // Check if the native input has text but control value is null (unparseable input)
    const inputElement = this.terminationDateInput?.nativeElement;
    const hasInputValue = inputElement && inputElement.value && inputElement.value.trim() !== '';
    if (hasInputValue && !control.value) {
      return 'Termination Date is invalid';
    }

    /// Priority 3: Check other validation errors (only if touched/dirty)
    if (!(control.touched || control.dirty)) {
      return '';
    }

    if (control.hasError('terminationDatePast')) {
      return 'Termination date cannot be prior to system date';
    }

    if (this.lastChangedDateField !== 'effective') {
      if (control.hasError('matDatepickerMin')) {
        return 'Termination Date must be on or after Effective Date';
      }
    }

    // Show dateRangeInvalid on termination date when it was the last changed field
    if (this.lastChangedDateField === 'termination' && this.form.errors?.['dateRangeInvalid']) {
      return 'Termination Date must be on or after Effective Date';
    }

    return '';
  }

  onCancel(): void { this.cancel.emit(); }

  onSave(): void {
    this.performSave(() => {
      this.closePanel.emit();
    });
  }

  onAddAndCreateAnother(): void {
    this.performSave(() => {
      this.resetForm();
    });
  }

  private performSave(onSuccessCallback: () => void): void {
    // Prevent duplicate submissions
    if (this.isSaving) {
      return;
    }

    this.isSaving = true;
    this.cdr.markForCheck();

    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.isSaving = false;
      this.cdr.markForCheck();
      return;
    }

    const formValue = this.form.getRawValue();

    // Trim text fields before saving
    const dto: AddEditProcessCodeDto = {
      procCode: formValue.processCode ? formValue.processCode.trim() : formValue.processCode,
      procDesc: formValue.processDescription ? formValue.processDescription.trim() : formValue.processDescription,
      effDate: formValue.effectiveDate
        ? moment(formValue.effectiveDate).format('YYYY-MM-DD')
        : null,
      termDate: formValue.terminationDate
        ? moment(formValue.terminationDate).format('YYYY-MM-DD')
        : null
    };
    const apiCall = this.isEdit
      ? this.emfProcessesService.updateProcessCode(dto)
      : this.emfProcessesService.addProcessCode(dto);

    apiCall
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isSaving = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: () => {
          const procCode = dto.procCode || '';
          const message = `"${procCode}" ${this.isEdit ? 'updated' : 'created'} successfully`;
          this.snackBar.open(message, 'DISMISS', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });
          this.saveSuccess.emit();
          onSuccessCallback();
        },
        error: (error: any) => {
          let message = error?.error?.errorResponse?.error
            || error?.error?.message
            || error?.message
            || `Failed to ${this.isEdit ? 'update' : 'add'} process code`;

          const errorCode = error?.error?.errorCode || error?.error?.errorResponse?.errorCode;
          if (errorCode) {
            message = `Error ${errorCode}: ${message}`;
          }

          this.snackBar.open(message, 'DISMISS', {
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  private resetForm(): void {
    this.form.reset();
    this.effectiveDateRawInput = '';
    this.terminationDateRawInput = '';
    this.lastChangedDateField = null;
    this.initialFormSnapshot = this.normalizeFormValue();
    this.isFormDirty = false;
    this.cdr.markForCheck();
  }
}
