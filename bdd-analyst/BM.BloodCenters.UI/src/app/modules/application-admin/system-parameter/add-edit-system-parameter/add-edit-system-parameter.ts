import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import moment from 'moment';
import { LoginService } from '@shared/services/login.service';

import { ViewSystemParameterService } from '../services/view-system-parameter.service';
import { SYSTEM_PARAMETER_VALIDATION } from '../constants/validation.constants';
import { DD_MON_YYYY_FORMATS, UppercaseMomentDateAdapter } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { dateFormatValidator } from 'src/app/core/utils/date-adapter.util';
import { noWhitespaceOnlyValidator } from '@shared/validators/input.validators';

@Component({
  selector: 'app-add-edit-system-parameter',
  standalone: true,
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: UppercaseMomentDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    MatDatepickerModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule,
    MatDialogModule
  ],
  templateUrl: './add-edit-system-parameter.html',
  styleUrls: ['./add-edit-system-parameter.scss']
})
export class AddEditSystemParameter implements OnInit, OnDestroy {
  form!: FormGroup;
  mode!: 'add' | 'edit';
  title!: string;
  minDate = DateFieldValidationUtility.getMinDate();
  private originalParameterCode = '';
  private originalParameterType = '';

  /** Termination date filter: not before today and not before Effective Date */
  terminationDateFilter = (date: moment.Moment | null): boolean => {
    if (!date) return true;

    const checkDate = moment(date).startOf('day');
    const today = DateFieldValidationUtility.getMinDate();

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

  readonly V = SYSTEM_PARAMETER_VALIDATION;

  /** Tracks which date field was last changed — cross-field error shows only on that field */
  private lastChangedDateField: 'effective' | 'termination' | null = null;

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getEffectiveDateError()
  );
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getTerminationDateError()
  );

  private destroy$ = new Subject<void>();

  constructor(
    public dialogRef: MatDialogRef<AddEditSystemParameter>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private snackBar: MatSnackBar,
    private fb: FormBuilder,
    private service: ViewSystemParameterService,
    private loginService: LoginService
  ) {}

  ngOnInit(): void {
    this.mode = this.data?.mode || 'add';
    this.title = this.mode === 'add' ? 'Add New Parameter' : 'Edit Parameter';

    const record = this.data?.record || {};
    this.originalParameterCode = record.parameterCode || '';
    this.originalParameterType = record.parameterType || 'ALL';

    this.form = this.fb.group({
      parameterCode: [
        record.parameterCode || '',
        [
          Validators.required,
          Validators.maxLength(this.V.LIMITS.PARAMETER_CODE_MAX_LENGTH),
          noWhitespaceOnlyValidator()
        ]
      ],
      parameterValue: [
        record.parameterValue || '',
        [
          Validators.required,
          Validators.maxLength(this.V.LIMITS.PARAMETER_VALUE_MAX_LENGTH),
          noWhitespaceOnlyValidator()
        ]
      ],
      description: [
        record.description || '',
        [
          Validators.required,
          Validators.maxLength(this.V.LIMITS.DESCRIPTION_MAX_LENGTH),
          noWhitespaceOnlyValidator()
        ]
      ],
      effectiveDate: [
        this.toMomentOrNull(record.effectiveDate),
        [Validators.required]
      ],
      terminationDate: [this.toMomentOrNull(record.terminationDate)]
    }, {
      validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate')]
    });

    if (this.mode === 'edit') {
      DateFieldValidationUtility.setupEditModeValidators(this.form);
      const termDateControl = this.form.get('terminationDate');
      if (termDateControl) {
        termDateControl.setValidators([
          dateFormatValidator(),
          DateFieldValidationUtility.validDateValidator(),
          DateFieldValidationUtility.terminationDateNotPastValidator()
        ]);
        termDateControl.updateValueAndValidity();
      }
    } else {
      DateFieldValidationUtility.setupAddModeValidators(this.form);
    }

    // Track which date field was last changed for cross-field error display
    this.form.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => { this.lastChangedDateField = 'effective'; });

    this.form.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => { this.lastChangedDateField = 'termination'; });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'terminationDate');

    if (this.mode === 'add' && this.form.invalid) {
      return;
    }

    const formValue = this.form.getRawValue();
    const payload = this.buildPayload(formValue);

    if (this.mode === 'add') {
      this.service.createSystemParameter(payload).subscribe({
        next: () => {
          this.dialogRef.close(true);
          setTimeout(() => {
            this.snackBar.open(
              `New parameter ${payload.parameterCode} has been added successfully.`,
              'DISMISS',
              { duration: 5000, horizontalPosition: 'end', verticalPosition: 'top', panelClass: ['success-snackbar'] }
            );
          }, 100);
        },
        error: (error) => this.handleSaveError(error, 'add')
      });
    }

    if (this.mode === 'edit') {
      this.service.updateSystemParameter(this.originalParameterCode, payload).subscribe({
        next: () => {
          this.dialogRef.close(true);
          setTimeout(() => {
            this.snackBar.open(
              `Parameter ${payload.parameterCode} updated successfully.`,
              'DISMISS',
              { duration: 5000, horizontalPosition: 'end', verticalPosition: 'top', panelClass: ['success-snackbar'] }
            );
          }, 100);
        },
        error: (error) => this.handleSaveError(error, 'edit')
      });
    }
  }

  private handleSaveError(error: any, action: 'add' | 'edit'): void {
    let errorMessage = error?.error?.errorResponse?.error
      || error?.error?.message
      || error?.message
      || `Failed to ${action === 'add' ? 'save' : 'update'} parameter`;

    const errorCode = error?.error?.errorCode || error?.error?.errorResponse?.errorCode;
    if (errorCode) {
      errorMessage = `Error ${errorCode}: ${errorMessage}`;
    }

    this.snackBar.open(errorMessage, 'DISMISS', {
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }

  private buildPayload(formValue: any): any {
    let effectiveDateString = '';
    let terminationDateString: string | undefined = undefined;

    if (formValue.effectiveDate) {
      if (moment.isMoment(formValue.effectiveDate)) {
        effectiveDateString = formValue.effectiveDate.format('YYYY-MM-DD');
      } else if (formValue.effectiveDate instanceof Date) {
        const d = formValue.effectiveDate;
        effectiveDateString = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      }
    }

    if (formValue.terminationDate) {
      if (moment.isMoment(formValue.terminationDate)) {
        terminationDateString = formValue.terminationDate.format('YYYY-MM-DD');
      } else if (formValue.terminationDate instanceof Date) {
        const d = formValue.terminationDate;
        terminationDateString = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      }
    }

    const payload: any = {
      parameterCode: formValue.parameterCode?.trim(),
      chapterId: 'ALL',
      parameterType: 'ALL',
      parameterValue: formValue.parameterValue?.trim(),
      description: formValue.description?.trim(),
      effectiveDate: effectiveDateString,
      terminationDate: terminationDateString,
      programId: 'MANUAL',
      insertUser: this.loginService.getStoredUsername() || 'API'
    };

    if (this.mode === 'edit') {
      payload.originalParameterType = this.originalParameterType;
    }

    return payload;
  }

  preventLeadingSpace(event: KeyboardEvent, controlName: string): void {
    if (event.key === ' ' && !this.form.get(controlName)?.value?.trim()) {
      event.preventDefault();
    }
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

  convertToUppercase(controlName: string): void {
    const control = this.form.get(controlName);
    if (control?.value) {
      control.setValue(control.value.toUpperCase(), { emitEvent: false });
    }
  }

  onParameterCodeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    const newValue = value.replace(/[^a-zA-Z0-9_]/g, '').toUpperCase();
    if (value !== newValue) {
      this.form.get('parameterCode')?.setValue(newValue, { emitEvent: false });
      input.value = newValue;
    }
  }

  getParameterCodeError(): string {
    const control = this.form.get('parameterCode');
    if (!control || !control.touched) return '';
    if (control.hasError('required')) return 'Parameter is required';
    if (control.hasError('whitespaceOnly')) return 'Parameter code cannot contain only spaces';
    if (control.hasError('maxlength')) return `Parameter code must not exceed ${this.V.LIMITS.PARAMETER_CODE_MAX_LENGTH} characters`;
    return '';
  }

  getParameterValueError(): string {
    const control = this.form.get('parameterValue');
    if (!control || !control.touched) return '';
    if (control.hasError('required')) return 'Value is required';
    if (control.hasError('whitespaceOnly')) return 'Value cannot contain only spaces';
    if (control.hasError('maxlength')) return `Value must not exceed ${this.V.LIMITS.PARAMETER_VALUE_MAX_LENGTH} characters`;
    return '';
  }

  getDescriptionError(): string {
    const control = this.form.get('description');
    if (!control || !control.touched) return '';
    if (control.hasError('required')) return 'Description is required';
    if (control.hasError('whitespaceOnly')) return 'Description cannot contain only spaces';
    if (control.hasError('maxlength')) return `Description must not exceed ${this.V.LIMITS.DESCRIPTION_MAX_LENGTH} characters`;
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

  isFormValid(): boolean {
    if (this.mode === 'edit') {
      if (!this.form.dirty) return false;
      const hasFieldErrors =
        !!this.form.get('parameterCode')?.errors ||
        !!this.form.get('parameterValue')?.errors ||
        !!this.form.get('description')?.errors;
      const hasVisibleErrors =
        hasFieldErrors ||
        this.getEffectiveDateError() !== '' ||
        this.getTerminationDateError() !== '';
      return !hasVisibleErrors;
    }
    return !this.form.invalid;
  }

  private toMomentOrNull(value: any): moment.Moment | null {
    if (!value || value === '-') return null;
    let parsed = moment(value, 'DD-MMM-YYYY', true);
    if (parsed.isValid()) return parsed;
    parsed = moment(value);
    return parsed.isValid() ? parsed : null;
  }
}
