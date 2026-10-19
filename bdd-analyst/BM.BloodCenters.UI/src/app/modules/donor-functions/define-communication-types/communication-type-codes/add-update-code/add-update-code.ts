import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { MatIconModule } from '@angular/material/icon';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { DD_MON_YYYY_FORMATS } from '../../../../../shared/date/date-formats';
import { ChapterAwareDateAdapter } from '../../../../../shared/date/chapter-aware-date-adapter';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { dateFormatValidator } from '../../../../../core/utils/date-adapter.util';
import { requiredTrimmedValidator, trimmedMaxLengthValidator } from '@shared/validators';
import { HeaderService } from '@shared/services/header.service';
import { CommTypeDialogResult } from '../../services/communication-types.service';
import { COMM_CODE_VALIDATION } from '../../constants/communication-types-messages.constants';
import { convertUTCToTimezone } from '@shared/date/timezone.util';
import moment from 'moment';
import { Subject, takeUntil } from 'rxjs';

export interface CodeDialogData {
  mode: 'add' | 'edit';
  codeType: string;
  codeTypeDescription?: string;
  commCode?: string;
  description?: string;
  targetDays?: number;
  effDate?: string;
  termDate?: string | null;
}

@Component({
  selector: 'app-add-update-code',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatIconModule,
    ReactiveFormsModule,
  ],
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
  ],
  templateUrl: './add-update-code.html',
  styleUrl: './add-update-code.scss',
})
export class AddUpdateCode implements OnInit, OnDestroy {
  dialogTitle: string;
  mode: 'add' | 'edit' = 'add';
  form!: FormGroup;
  minDate: moment.Moment;

  isSaving = false;
  saveRequest = new Subject<CommTypeDialogResult>();

  private lastChangedDateField: 'effective' | 'termination' | null = null;

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEffectiveDateError());
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTerminationDateError());

  terminationDateFilter = (date: moment.Moment | null): boolean => {
    if (!date) return true;

    const checkDate = moment(date).startOf('day');
    const today = this.minDate.clone().startOf('day');

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

  constructor(
    private fb: FormBuilder,
    private headerService: HeaderService,
    public dialogRef: MatDialogRef<AddUpdateCode>,
    @Inject(MAT_DIALOG_DATA) public data: CodeDialogData
  ) {
    this.mode = data.mode;
    this.dialogTitle = data.mode === 'add' ? 'Add New Code' : 'Edit Code';
    this.minDate = DateFieldValidationUtility.getMinDate(this.headerService.chapterTimeZone());
  }

  ngOnInit(): void {
    this.initializeForm();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.form = this.fb.group(
      {
        code: [
          '',
          [
            Validators.required,
            requiredTrimmedValidator(),
            trimmedMaxLengthValidator(5),
            Validators.pattern(/^[a-zA-Z0-9]+$/),
            (control: AbstractControl): ValidationErrors | null =>
              control.value?.trim().toUpperCase() === 'COMTP' ? { forbiddenValue: true } : null,
          ],
        ],
        description: ['', [Validators.required, requiredTrimmedValidator(), trimmedMaxLengthValidator(50)]],
        days: [null],
        effectiveDate: [null, [Validators.required]],
        terminationDate: [null],
      },
      {
        validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate')],
      }
    );

    if (this.mode === 'edit' && this.data) {
      this.form.patchValue({
        code: this.data.commCode || '',
        description: this.data.description || '',
        days: this.data.targetDays ?? null,
        effectiveDate: this.data.effDate ? this.convertApiDateToMoment(this.data.effDate) : null,
        terminationDate: this.data.termDate ? this.convertApiDateToMoment(this.data.termDate) : null,
      });
      this.form.markAsPristine();
      this.form.markAsUntouched();
      DateFieldValidationUtility.setupEditModeValidators(this.form, this.headerService.chapterTimeZone());
      this.setupTerminationDateValidatorsForEdit();
    } else {
      DateFieldValidationUtility.setupAddModeValidators(this.form, this.headerService.chapterTimeZone());
    }

    this.form
      .get('effectiveDate')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'effective';
      });

    this.form
      .get('terminationDate')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'termination';
      });
  }

  private setupTerminationDateValidatorsForEdit(): void {
    const termDateControl = this.form.get('terminationDate');
    if (termDateControl) {
      termDateControl.setValidators([
        dateFormatValidator(),
        DateFieldValidationUtility.validDateValidator(),
        DateFieldValidationUtility.terminationDateNotPastValidator(this.headerService.chapterTimeZone()),
      ]);
      termDateControl.updateValueAndValidity({ onlySelf: true, emitEvent: false });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(addAnother = false): void {
    if (this.isSaving) return;

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

    const result: CommTypeDialogResult = {
      commCode: formValue.code,
      description: formValue.description,
      targetDays: formValue.days ? Number(formValue.days) : undefined,
      effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate) || '',
      termDate: DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate),
      addAnother,
    };

    this.isSaving = true;
    this.saveRequest.next(result);
  }

  isFormValid(): boolean {
    if (this.mode === 'edit' && !this.form.dirty) {
      return false;
    }

    const termDateControl = this.form.get('terminationDate');
    const hasTermDateError = termDateControl?.touched && termDateControl?.hasError('terminationDatePast');

    const hasDateRangeError = this.form.hasError('dateRangeInvalid');

    const termHasFormatError =
      termDateControl &&
      (termDateControl.hasError('invalidDate') ||
        termDateControl.hasError('invalidDateFormat') ||
        termDateControl.hasError('matDatepickerParse'));

    if (hasTermDateError || termHasFormatError) {
      return false;
    }

    const otherControlsValid = Object.keys(this.form.controls)
      .filter((key) => key !== 'terminationDate')
      .every((key) => {
        const control = this.form.get(key);
        return !control || control.disabled || control.valid;
      });

    return otherControlsValid && !hasDateRangeError;
  }

  resetFormForAddAnother(): void {
    this.isSaving = false;
    this.form.reset({
      code: '',
      description: '',
      days: null,
      effectiveDate: null,
      terminationDate: null,
    });
    this.form.markAsPristine();
    this.form.markAsUntouched();
    this.lastChangedDateField = null;

    DateFieldValidationUtility.setupAddModeValidators(this.form, this.headerService.chapterTimeZone());
  }

  onClearAll(): void {
    if (this.mode === 'edit' && this.data) {
      this.form.patchValue({
        description: this.data.description || '',
        days: this.data.targetDays ?? null,
        terminationDate: this.data.termDate ? this.convertApiDateToMoment(this.data.termDate) : null,
      });
      this.form.markAsPristine();
      this.form.markAsUntouched();
      this.lastChangedDateField = null;
    }
  }

  getCodeError(): string {
    const control = this.form.get('code');
    if (!control || !control.touched) return '';

    if (control.hasError('required') || control.hasError('whitespaceOnly')) {
      return COMM_CODE_VALIDATION.CODE_REQUIRED;
    }

    if (control.hasError('trimmedMaxLength')) {
      return COMM_CODE_VALIDATION.CODE_MAX_LENGTH;
    }

    if (control.hasError('pattern')) {
      return COMM_CODE_VALIDATION.CODE_PATTERN;
    }

    if (control.hasError('forbiddenValue')) {
      return COMM_CODE_VALIDATION.CODE_FORBIDDEN;
    }

    return '';
  }

  getDescriptionError(): string {
    const control = this.form.get('description');
    if (!control || !control.touched) return '';

    if (control.hasError('required') || control.hasError('whitespaceOnly')) {
      return COMM_CODE_VALIDATION.DESCRIPTION_REQUIRED;
    }

    if (control.hasError('trimmedMaxLength')) {
      return COMM_CODE_VALIDATION.DESCRIPTION_MAX_LENGTH;
    }

    return '';
  }

  getDaysError(): string {
    const control = this.form.get('days');
    if (!control || !control.touched) return '';

    if (control.hasError('pattern')) {
      return COMM_CODE_VALIDATION.DAYS_PATTERN;
    }

    return '';
  }

  get editEffectiveDateDisplay(): string {
    if (!this.data?.effDate) return '-';
    const chapterTz = this.headerService.chapterTimeZone();
    const noonUtc = this.data.effDate.replace(/T.*$/, 'T12:00:00Z');
    const d = convertUTCToTimezone(noonUtc, chapterTz);
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const day = String(d.getDate()).padStart(2, '0');
    return `${day}-${months[d.getMonth()]}-${d.getFullYear()}`;
  }

  private convertApiDateToMoment(dateStr: string): moment.Moment {
    const chapterTz = this.headerService.chapterTimeZone();
    const noonUtc = dateStr.replace(/T.*$/, 'T12:00:00Z');
    const d = convertUTCToTimezone(noonUtc, chapterTz);
    return moment([d.getFullYear(), d.getMonth(), d.getDate()]);
  }

  getEffectiveDateError(): string {
    const formErrors = this.lastChangedDateField === 'effective' ? this.form.errors : null;
    return DateFieldValidationUtility.getStartDateCrossFieldError(
      this.form.get('effectiveDate'),
      'Effective Date',
      'Termination Date',
      formErrors
    );
  }

  getTerminationDateError(): string {
    const control = this.form.get('terminationDate');

    if (control?.touched && control?.hasError('terminationDatePast')) {
      return COMM_CODE_VALIDATION.TERMINATION_DATE_PAST;
    }

    const formErrors = this.lastChangedDateField === 'termination' ? this.form.errors : null;
    return DateFieldValidationUtility.getEndDateCrossFieldError(
      control,
      'Termination Date',
      'Effective Date',
      formErrors
    );
  }

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
      this.mode === 'edit'
    );
  }

  get descriptionRemainingChars(): number {
    const description = this.form.get('description')?.value || '';
    return 50 - description.length;
  }

  onCodeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    const newValue = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

    if (value !== newValue) {
      this.form.patchValue({ code: newValue }, { emitEvent: false });
      input.value = newValue;
    }
  }

  onDaysInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/[^0-9]/g, '');
    const truncated = value.slice(0, 4);

    if (input.value !== truncated) {
      input.value = truncated;
      this.form.patchValue({ days: truncated ? Number(truncated) : null }, { emitEvent: false });
    }
  }

  onDaysKeypress(event: KeyboardEvent): void {
    const allowed = /[0-9]/;
    if (!allowed.test(event.key)) {
      event.preventDefault();
    }

    const input = event.target as HTMLInputElement;
    if (input.value.length >= 4 && input.selectionStart === input.selectionEnd) {
      event.preventDefault();
    }
  }
}
