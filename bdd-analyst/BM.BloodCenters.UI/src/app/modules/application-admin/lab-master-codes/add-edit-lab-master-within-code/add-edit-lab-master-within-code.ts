import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { alphanumericValidator, integerValidator, numericalValueValidator, trimmedMaxLengthValidator, trimmedRequiredValidator } from '../validators/lab-master-within-code.validator';
import moment from 'moment';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';

export interface LabMasterCodeDialogData {
  mode: 'add' | 'edit';
  codeType: string;
  codeTypeDescription: string;
  code?: string;
  description?: string;
  effectiveDate?: Date;
  terminationDate?: Date | null;
  modificationDate?: Date;
  numericalValue?: number | null;
  sequence1?: number | null;
  sequence2?: number | null;
  sequence3?: number | null;
}

export interface LabMasterCodeDialogResult {
  codeType: string;
  code: string;
  description: string;
  effectiveDate: Date;
  terminationDate?: Date | null;
  numericalValue?: number | null;
  sequence1?: number | null;
  sequence2?: number | null;
  sequence3?: number | null;
}

@Component({
  selector: 'app-add-edit-lab-master-within-code',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './add-edit-lab-master-within-code.html',
  styleUrls: ['./add-edit-lab-master-within-code.scss']
})
export class AddEditLabMasterWithinCode implements OnInit {
  mode: 'add' | 'edit' = 'add';
  data: LabMasterCodeDialogData | null = null;

  form!: FormGroup;
  dialogTitle: string = '';
  isSaving = false;
  codeTypeDisplay: string = '';
  codeTypeValue: string = '';
  modificationDate: Date | null = null;

  saveRequest = new Subject<LabMasterCodeDialogResult>();

  // Constants - FIXED VALUES
  readonly CODE_MAX_LENGTH = 5;
  readonly DESCRIPTION_MAX_LENGTH = 500;

  // Date restriction for datepickers
  minDate = DateFieldValidationUtility.getMinDate();

  /** Tracks which date field was last changed — cross-field error shows only on that field */
  lastChangedDateField: 'effective' | 'termination' | null = null;

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEffectiveDateError());
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTerminationDateError());

  terminationDateFilter = (date: moment.Moment | null): boolean => {
    if (!date) return true;
    const checkDate = moment(date).startOf('day');
    const today = this.minDate.clone().startOf('day');
    if (checkDate.isBefore(today)) return false;
    const eff = this.form?.get('effectiveDate')?.value;
    if (eff) {
      const effDay = moment(eff).startOf('day');
      if (checkDate.isBefore(effDay)) return false;
    }
    return true;
  };

  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<AddEditLabMasterWithinCode>);
  private dialogData = inject<LabMasterCodeDialogData>(MAT_DIALOG_DATA);

  ngOnInit(): void {
    this.mode = this.dialogData?.mode ?? 'add';
    this.data = this.dialogData ?? null;

    this.dialogTitle = this.mode === 'add' ? 'Add New Code' : 'Edit Code';

    // Store actual code type value and create display version
    this.codeTypeValue = this.data?.codeType || '';

    if (this.data?.codeType && this.data?.codeTypeDescription) {
      this.codeTypeDisplay = `${this.data.codeType} - ${this.data.codeTypeDescription}`;
    } else {
      this.codeTypeDisplay = this.data?.codeType || '';
    }

    this.initializeForm();
    this.populateFormData();
    this.setupDateValidationListeners();

    if (this.mode === 'edit') {
      DateFieldValidationUtility.setupEditModeValidators(this.form);
      const termDateControl = this.form.get('terminationDate');
      if (termDateControl) {
        termDateControl.setValidators([
          DateFieldValidationUtility.validDateValidator(),
          DateFieldValidationUtility.terminationDateNotPastValidator()
        ]);
        termDateControl.updateValueAndValidity();
      }
    } else {
      DateFieldValidationUtility.setupAddModeValidators(this.form);
    }
  }

  private setupDateValidationListeners(): void {
    this.form.get('effectiveDate')?.valueChanges.subscribe(() => {
      this.lastChangedDateField = 'effective';
      const terminationDateControl = this.form.get('terminationDate');
      if (terminationDateControl?.value) {
        terminationDateControl.updateValueAndValidity({ emitEvent: false });
      }
      this.form.updateValueAndValidity({ emitEvent: false });
    });

    this.form.get('terminationDate')?.valueChanges.subscribe(() => {
      this.lastChangedDateField = 'termination';
      this.form.updateValueAndValidity({ emitEvent: false });
    });
  }

  private initializeForm(): void {
    if (this.mode === 'add') {
      this.form = this.fb.group({
        code: ['', [
          Validators.required,
          trimmedRequiredValidator(),
          trimmedMaxLengthValidator(this.CODE_MAX_LENGTH),
          alphanumericValidator()
        ]],
        description: ['', [
          Validators.required,
          trimmedRequiredValidator(),
          trimmedMaxLengthValidator(this.DESCRIPTION_MAX_LENGTH)
        ]],
        effectiveDate: [null, [Validators.required, DateFieldValidationUtility.effectiveDateNotPastValidator()]],
        terminationDate: [null],
        numericalValue: [0, [numericalValueValidator()]],
        sequence1: [0, [integerValidator()]],
        sequence2: [0, [integerValidator()]],
        sequence3: [0, [integerValidator()]]
      }, {
        validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate')]
      });
    } else {
      // Edit mode - code is read-only
      this.form = this.fb.group({
        code: [{ value: '', disabled: true }],
        description: ['', [
          Validators.required,
          trimmedRequiredValidator(),
          trimmedMaxLengthValidator(this.DESCRIPTION_MAX_LENGTH)
        ]],
        effectiveDate: [null, Validators.required],
        terminationDate: [null],
        numericalValue: [0, [numericalValueValidator()]],
        sequence1: [0, [integerValidator()]],
        sequence2: [0, [integerValidator()]],
        sequence3: [0, [integerValidator()]]
      }, {
        validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate')]
      });
    }
  }

  private populateFormData(): void {
    if (this.data?.mode === 'edit') {
      this.form.patchValue({
        code: this.data.code || '',
        description: this.data.description || '',
        effectiveDate: this.data.effectiveDate ? moment(this.data.effectiveDate) : null,
        terminationDate: this.data.terminationDate ? moment(this.data.terminationDate) : null,
        numericalValue: this.data.numericalValue ?? 0,
        sequence1: this.data.sequence1 ?? 0,
        sequence2: this.data.sequence2 ?? 0,
        sequence3: this.data.sequence3 ?? 0
      });
      this.modificationDate = this.data.modificationDate ? new Date(this.data.modificationDate) : null;
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.mode === 'add') {
      this.form.markAllAsTouched();
      DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'terminationDate');
      if (this.form.invalid) {
        return;
      }
    }

    const formValue = this.form.getRawValue();

    const effectiveDate = formValue.effectiveDate ?
      (DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate) as any) : new Date();
    const terminationDate = formValue.terminationDate ?
      (DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate) as any) : null;

    const result: LabMasterCodeDialogResult = {
      codeType: this.codeTypeValue.trim(),
      code: formValue.code?.trim() || this.data?.code || '',
      description: formValue.description.trim(),
      effectiveDate: effectiveDate,
      terminationDate: terminationDate,
      numericalValue: formValue.numericalValue,
      sequence1: formValue.sequence1,
      sequence2: formValue.sequence2,
      sequence3: formValue.sequence3
    };

    this.isSaving = true;
    this.saveRequest.next(result);
  }

  isFormValid(): boolean {
    if (this.mode === 'edit') {
      if (!this.form.dirty) return false;
      const hasVisibleErrors =
        this.getCodeError() !== '' ||
        this.getDescriptionError() !== '' ||
        this.getEffectiveDateError() !== '' ||
        this.getTerminationDateError() !== '';
      return !hasVisibleErrors;
    }
    return !this.form.invalid;
  }

  // Error getters
  getCodeError(): string {
    const control = this.form.get('code');
    if (!control || !control.touched) return '';

    if (control.hasError('required') || control.hasError('trimmedRequired')) {
      return 'Code Type is required';
    }
    if (control.hasError('trimmedMaxLength')) {
      return `Code must not exceed ${this.CODE_MAX_LENGTH} characters`;
    }
    if (control.hasError('alphanumeric')) {
      return 'Code Type must be alphanumeric (special characters are not allowed)';
    }
    return '';
  }

  getDescriptionError(): string {
    const control = this.form.get('description');
    if (!control || !control.touched) return '';

    if (control.hasError('required') || control.hasError('trimmedRequired')) {
      return 'Description is required';
    }
    if (control.hasError('trimmedMaxLength')) {
      return `Description must not exceed ${this.DESCRIPTION_MAX_LENGTH} characters`;
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

  getNumericalValueError(): string {
    const control = this.form.get('numericalValue');
    if (!control || !control.touched) return '';
    if (control.hasError('numericalValue')) {
      return 'Must be a valid number up to 7 integer digits and 3 decimal digits (e.g. 9999999 or 1234567.890)';
    }
    return '';
  }

  getSequenceError(controlName: string): string {
    const control = this.form.get(controlName);
    if (!control || !control.touched) return '';
    if (control.hasError('integer')) {
      return 'Must be a whole number (e.g. 123 or -124)';
    }
    return '';
  }

  getCodeRemainingCharacters(): string {
    const remaining = this.CODE_MAX_LENGTH - (this.form.get('code')?.value?.length || 0);
    return `Characters Remaining: ${remaining}/${this.CODE_MAX_LENGTH}`;
  }

  getDescriptionRemainingCharacters(): string {
    const remaining = this.DESCRIPTION_MAX_LENGTH - (this.form.get('description')?.value?.length || 0);
    return `Characters Remaining: ${remaining}/${this.DESCRIPTION_MAX_LENGTH}`;
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

  get codeRemainingChars(): number {
    return this.CODE_MAX_LENGTH - (this.form.get('code')?.value?.length || 0);
  }

  get descriptionRemainingChars(): number {
    return this.DESCRIPTION_MAX_LENGTH - (this.form.get('description')?.value?.length || 0);
  }

  get editEffectiveDateDisplay(): string {
    const effDate = this.form?.get('effectiveDate')?.value;
    if (!effDate) return '-';
    return this.formatDate(effDate).toUpperCase() || '-';
  }

  onCodeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const newValue = input.value.replace(/\s/g, '').trim().toUpperCase();
    if (input.value !== newValue) {
      this.form.get('code')?.setValue(newValue, { emitEvent: false });
      input.value = newValue;
    }
  }

  // Blocks e/E and decimal point — used by Sequence 1/2/3 (integer-only fields)
  onIntegerKeydown(event: KeyboardEvent): void {
    if (event.key === 'e' || event.key === 'E' || event.key === '.') {
      event.preventDefault();
    }
  }

  // Strips e/E and decimal, enforces max digit count excluding minus sign — for Sequence 1/2/3
  onIntegerInput(event: Event, controlName: string, maxDigits: number): void {
    const input = event.target as HTMLInputElement;
    let value = input.value;
    value = value.replace(/[eE]/g, '').replace(/\..*/, '');
    const digits = value.startsWith('-') ? value.slice(1) : value;
    if (digits.length > maxDigits) {
      value = (value.startsWith('-') ? '-' : '') + digits.substring(0, maxDigits);
    }
    if (input.value !== value) {
      input.value = value;
      this.form.get(controlName)?.setValue(value === '' || value === '-' ? null : Number(value), { emitEvent: false });
    }
  }

  // Blocks e/E only — used by Numerical Value (decimals are allowed)
  onNumericKeydown(event: KeyboardEvent): void {
    if (event.key === 'e' || event.key === 'E') {
      event.preventDefault();
    }
  }

  // Strips e/E, enforces NUMBER(10,3): max 7 integer digits, max 3 decimal digits — for Numerical Value
  onDecimalInput(event: Event, controlName: string): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/[eE]/g, '');

    const dotIndex = value.indexOf('.');
    if (dotIndex !== -1) {
      const intPart = value.substring(0, dotIndex);
      let decPart = value.substring(dotIndex + 1);
      const sign = intPart.startsWith('-') ? '-' : '';
      const intDigits = intPart.replace('-', '');
      const clampedInt = intDigits.length > 7 ? intDigits.substring(0, 7) : intDigits;
      const clampedDec = decPart.length > 3 ? decPart.substring(0, 3) : decPart;
      value = sign + clampedInt + '.' + clampedDec;
    } else {
      const sign = value.startsWith('-') ? '-' : '';
      const intDigits = value.replace('-', '');
      if (intDigits.length > 7) {
        value = sign + intDigits.substring(0, 7);
      }
    }

    if (input.value !== value) {
      input.value = value;
      this.form.get(controlName)?.setValue(
        value === '' || value === '-' || value === '-.' ? null : Number(value),
        { emitEvent: false }
      );
    }
  }

  // Format date for display (DD-MMM-YYYY)
  formatDate(date: Date | null): string {
    if (!date) return '';
    return moment(date).format('DD-MMM-YYYY');
  }
}
