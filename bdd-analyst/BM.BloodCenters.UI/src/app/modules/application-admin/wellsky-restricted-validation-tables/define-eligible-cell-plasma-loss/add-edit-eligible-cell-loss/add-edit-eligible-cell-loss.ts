import { Component, EventEmitter, Input, OnInit, Output, OnDestroy, inject, effect, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { Subject, takeUntil, finalize, distinctUntilChanged } from 'rxjs';
import moment, { Moment } from 'moment';

import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { convertUTCToTimezone } from '@shared/date/timezone.util';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { HeaderService } from '@shared/services/header.service';
import { EligiblePlasmaCellLossService } from '../services/eligible-plasma-cell-loss.service';
import {
  AddEligiblePlasmaCellLossRequest,
  UpdateEligiblePlasmaCellLossRequest,
  ValidateDuplicateRequest,
  CellType
} from '../models/eligible-plasma-cell-loss.model';
import { EligibleCellPlasmaLossModel } from '../define-eligible-cell-plasma-loss/define-eligible-cell-plasma-loss';

@Component({
  selector: 'app-add-edit-eligible-cell-loss',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    MatDatepickerModule,
    MatSnackBarModule,
    MatMomentDateModule,
  ],
  templateUrl: './add-edit-eligible-cell-loss.html',
  styleUrls: ['./add-edit-eligible-cell-loss.scss'],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
})
export class AddEditEligibleCellLoss implements OnInit, OnDestroy {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() data: EligibleCellPlasmaLossModel | null = null;
  @Output() closePanel = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<void>();

  form: FormGroup;
  panelTitle = '';
  panelSubtitle = '';
  isSaving = false;
  minDate: Moment;
  terminationMinDate: Moment;

  cellTypeOptions: CellType[] = [
    { code: 'PLASM', description: 'Plasma' },
    { code: 'RBC', description: 'Red Blood Cell' }
  ];

  private lastChangedDateField: 'effective' | 'termination' | null = null;
  private lastChangedWeightField: 'min' | 'max' | null = null;

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEffectiveDateError());
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTerminationDateError());
  minWeightErrorMatcher = { isErrorState: (): boolean => !!this.getMinWeightError() };
  maxWeightErrorMatcher = { isErrorState: (): boolean => !!this.getMaxWeightError() };
  maxLossErrorMatcher = { isErrorState: (): boolean => !!this.getMaxLossError() };
  periodErrorMatcher = { isErrorState: (): boolean => !!this.getPeriodError() };

  private readonly headerService = inject(HeaderService);
  private get chapterOffset(): string { return this.headerService.chapterTimeZone(); }

  private getChapterMinDate(): Moment {
    const chapterDate = DateFieldValidationUtility.getMinDate(this.chapterOffset);
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

  showMaxLossOverflowError = false;
  private maxLossErrorTimeout: ReturnType<typeof setTimeout> | null = null;

  showPeriodOverflowError = false;
  private periodErrorTimeout: ReturnType<typeof setTimeout> | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private eligiblePlasmaCellLossService: EligiblePlasmaCellLossService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {
    this.minDate = this.getChapterMinDate();
    this.terminationMinDate = this.minDate;

    this.form = this.fb.group({
      cellType: [null, [Validators.required]],
      description: [null],
      minWeight: [null, [this.integerValidator, this.positiveIntegerValidator, Validators.max(999999)]],
      maxWeight: [null, [this.integerValidator, this.positiveIntegerValidator, Validators.max(999999)]],
      maxLoss: [null, [Validators.required, this.integerValidator, this.positiveIntegerValidator, Validators.max(999999)]],
      period: [null, [Validators.required, this.integerValidator, this.positiveIntegerValidator, Validators.max(999999)]],
      effectiveDate: [null, [Validators.required]],
      terminationDate: [null],
      auditKey: [null],
    }, {
      validators: [
        this.maxWeightValidator,
        DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate')
      ]
    });

    this.form.get('effectiveDate')?.valueChanges
      .pipe(
        distinctUntilChanged((prev, curr) => {
          if (!prev && !curr) return true;
          if (!prev || !curr) return false;
          return moment(prev).format('YYYY-MM-DD') === moment(curr).format('YYYY-MM-DD');
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.lastChangedDateField = 'effective';
        this.updateTerminationMinDate();
        this.cdr.detectChanges();
      });

    this.form.get('terminationDate')?.valueChanges
      .pipe(
        distinctUntilChanged((prev, curr) => {
          if (!prev && !curr) return true;
          if (!prev || !curr) return false;
          return moment(prev).format('YYYY-MM-DD') === moment(curr).format('YYYY-MM-DD');
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(() => { this.lastChangedDateField = 'termination'; });

    this.form.get('minWeight')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => { this.lastChangedWeightField = 'min'; });

    this.form.get('maxWeight')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => { this.lastChangedWeightField = 'max'; });

    effect(() => {
      this.minDate = this.getChapterMinDate();
      this.updateTerminationMinDate();
    });
  }

  ngOnInit(): void {
    this.setupPanel();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.maxLossErrorTimeout) {
      clearTimeout(this.maxLossErrorTimeout);
    }
    if (this.periodErrorTimeout) {
      clearTimeout(this.periodErrorTimeout);
    }
  }

  private setupPanel(): void {
    if (this.mode === 'add') {
      this.panelTitle = 'Add Eligible Cell Loss';
      this.panelSubtitle = '';
      this.resetFormForAddMode();
    } else {
      this.panelTitle = 'Edit Eligible Cell Loss';
      this.panelSubtitle = '';
      this.populateFormForEdit();
    }
  }

  private resetFormForAddMode(): void {
    this.form.reset();
    this.form.markAsUntouched();
    this.form.markAsPristine();
    this.lastChangedDateField = null;
    this.lastChangedWeightField = null;

    this.showMaxLossOverflowError = false;
    this.showPeriodOverflowError = false;
    if (this.maxLossErrorTimeout) {
      clearTimeout(this.maxLossErrorTimeout);
      this.maxLossErrorTimeout = null;
    }
    if (this.periodErrorTimeout) {
      clearTimeout(this.periodErrorTimeout);
      this.periodErrorTimeout = null;
    }

    this.cellTypeOptions = [
      { code: 'PLASM', description: 'Plasma' },
      { code: 'RBC', description: 'Red Blood Cell' }
    ];

    this.form.get('cellType')?.enable();
    this.form.get('effectiveDate')?.enable();

    DateFieldValidationUtility.setupAddModeValidators(this.form, this.chapterOffset);
  }

  private populateFormForEdit(): void {
    if (this.data) {
      this.form.patchValue({
        cellType: this.data.cellType,
        description: this.data.description,
        minWeight: this.data.minWeight,
        maxWeight: this.data.maxWeight,
        maxLoss: this.data.maxLoss,
        period: this.data.period,
        effectiveDate: this.data.effectiveDate ? moment(this.data.effectiveDate) : null,
        terminationDate: this.data.terminationDate ? moment(this.data.terminationDate) : null,
        auditKey: this.data.auditKey,
      });

      if (!this.data.description && this.data.cellType) {
        const cellType = this.cellTypeOptions.find(type => type.code === this.data!.cellType);
        if (cellType) {
          this.form.patchValue({ description: cellType.description });
        }
      }

      if (this.data.cellType && this.data.description) {
        this.cellTypeOptions = [{ code: this.data.cellType, description: this.data.description }];
      }
    }

    this.updateTerminationMinDate();
    this.form.markAsPristine();
    DateFieldValidationUtility.setupEditModeValidators(this.form, this.chapterOffset);
  }

  onCellTypeChange(value: string): void {
    const selectedType = this.cellTypeOptions.find(type => type.code === value);
    if (selectedType) {
      this.form.patchValue({ description: selectedType.description });
    }
  }

  // ─── Validators ───

  private integerValidator = (control: any): any => {
    const value = control.value;
    if (value === null || value === undefined || value === '') return null;
    if (typeof value === 'string' && !/^-?\d+$/.test(value)) return { notInteger: true };
    if (typeof value === 'number' && !Number.isInteger(value)) return { notInteger: true };
    return null;
  };

  private positiveIntegerValidator = (control: any): any => {
    const value = control.value;
    if (value === null || value === undefined || value === '') return null;
    const numValue = typeof value === 'string' ? parseInt(value, 10) : value;
    if (numValue < 1) return { notPositive: true };
    return null;
  };

  private maxWeightValidator = (control: any): any => {
    const minWeightValue = control.get('minWeight')?.value;
    const maxWeightValue = control.get('maxWeight')?.value;

    if (minWeightValue != null && minWeightValue !== '' && maxWeightValue != null && maxWeightValue !== '') {
      const minWeight = Number(minWeightValue);
      const maxWeight = Number(maxWeightValue);

      if (!isNaN(minWeight) && !isNaN(maxWeight) && maxWeight < minWeight) {
        return { maxWeightInvalid: true };
      }
    }

    return null;
  };

  onMaxLossInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let inputValue = input.value.replace(/[^\d]/g, '');

    if (inputValue.length > 6) {
      inputValue = inputValue.substring(0, 6);
      input.value = inputValue;
      this.form.get('maxLoss')?.setValue(inputValue, { emitEvent: false });
      this.form.get('maxLoss')?.updateValueAndValidity({ emitEvent: false });
      this.showTemporaryMaxLossError();
    }
  }

  private showTemporaryMaxLossError(): void {
    if (this.maxLossErrorTimeout) {
      clearTimeout(this.maxLossErrorTimeout);
    }

    this.showMaxLossOverflowError = true;
    this.form.get('maxLoss')?.setErrors({ overflow: true });
    this.form.get('maxLoss')?.markAsTouched();
    this.cdr.markForCheck();

    this.maxLossErrorTimeout = setTimeout(() => {
      this.showMaxLossOverflowError = false;
      const control = this.form.get('maxLoss');
      if (control) {
        const currentErrors = control.errors;
        if (currentErrors?.['overflow']) {
          const { overflow, ...rest } = currentErrors;
          control.setErrors(Object.keys(rest).length ? rest : null);
        }
        control.updateValueAndValidity({ emitEvent: false });
      }
      this.cdr.markForCheck();
    }, 2000);
  }

  onPeriodInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let inputValue = input.value.replace(/[^\d]/g, '');

    if (inputValue.length > 6) {
      inputValue = inputValue.substring(0, 6);
      input.value = inputValue;
      this.form.get('period')?.setValue(inputValue, { emitEvent: false });
      this.form.get('period')?.updateValueAndValidity({ emitEvent: false });
      this.showTemporaryPeriodError();
    }
  }

  private showTemporaryPeriodError(): void {
    if (this.periodErrorTimeout) {
      clearTimeout(this.periodErrorTimeout);
    }

    this.showPeriodOverflowError = true;
    this.form.get('period')?.setErrors({ overflow: true });
    this.form.get('period')?.markAsTouched();
    this.cdr.markForCheck();

    this.periodErrorTimeout = setTimeout(() => {
      this.showPeriodOverflowError = false;
      const control = this.form.get('period');
      if (control) {
        const currentErrors = control.errors;
        if (currentErrors?.['overflow']) {
          const { overflow, ...rest } = currentErrors;
          control.setErrors(Object.keys(rest).length ? rest : null);
        }
        control.updateValueAndValidity({ emitEvent: false });
      }
      this.cdr.markForCheck();
    }, 2000);
  }

  // ─── Error Messages ───

  getMinWeightError(): string {
    const control = this.form.get('minWeight');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.errors?.['notInteger']) return 'Value must be Integer';
    if (control.errors?.['notPositive']) return 'Value must be greater than one (1)';
    if (control.errors?.['max']) return 'Value must not exceed 999999';
    const formErrors = this.lastChangedWeightField === 'min' ? this.form.errors : null;
    if (formErrors?.['maxWeightInvalid']) return 'Lower range cannot be greater than upper range.';
    return '';
  }

  getMaxWeightError(): string {
    const control = this.form.get('maxWeight');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.errors?.['notInteger']) return 'Value must be Integer';
    if (control.errors?.['notPositive']) return 'Value must be greater than one (1)';
    if (control.errors?.['max']) return 'Value must not exceed 999999';
    const formErrors = this.lastChangedWeightField === 'max' ? this.form.errors : null;
    if (formErrors?.['maxWeightInvalid']) return 'Lower range cannot be greater than upper range.';
    return '';
  }

  getMaxLossError(): string {
    if (this.showMaxLossOverflowError) {
      return 'Value must not exceed 999999';
    }

    const control = this.form.get('maxLoss');
    if (!control || !control.errors || !control.touched) return '';
    if (control.errors['required']) return 'Max Loss (in mL) is required';
    if (control.errors['notInteger']) return 'Value must be Integer';
    if (control.errors['notPositive']) return 'Value must be greater than one (1)';
    if (control.errors['max']) return 'Value must not exceed 999999';
    return '';
  }

  getPeriodError(): string {
    if (this.showPeriodOverflowError) {
      return 'Value must not exceed 999999';
    }

    const control = this.form.get('period');
    if (!control || !control.errors || !control.touched) return '';
    if (control.errors['required']) return 'Period (in Days) is required';
    if (control.errors['notInteger']) return 'Value must be Integer';
    if (control.errors['notPositive']) return 'Value must be greater than one (1)';
    if (control.errors['max']) return 'Value must not exceed 999999';
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

  getEffectiveDateDisplay(): string {
    const effDate = this.form.getRawValue().effectiveDate;
    if (!effDate) return '-';
    const m = moment.isMoment(effDate) ? effDate : moment(effDate);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : '-';
  }

  onEffectiveDateInput(event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value, this.form.get('effectiveDate')
    );
  }

  onEffectiveDateChange(): void {
    this.form.get('effectiveDate')?.markAsTouched();
    this.form.get('effectiveDate')?.markAsDirty();
    this.form.updateValueAndValidity();
  }

  onTerminationDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value, this.form.get('terminationDate'), this.mode === 'edit'
    );
  }

  onTerminationDateChange(): void {
    this.form.get('terminationDate')?.markAsTouched();
    this.form.get('terminationDate')?.markAsDirty();
    this.form.updateValueAndValidity();
  }

  // ─── Input Prevention ───

  preventInvalidNumericInput(event: KeyboardEvent, maxDigits: number = 10): void {
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (allowedKeys.includes(event.key)) return;
    if (['e', 'E', '+', '-', '.'].includes(event.key)) { event.preventDefault(); return; }
    if (event.key < '0' || event.key > '9') { event.preventDefault(); return; }
    const input = event.target as HTMLInputElement;
    if (input.value.length >= maxDigits && input.selectionStart === input.selectionEnd) {
      event.preventDefault();
    }
  }

  preventNonNumericPaste(event: ClipboardEvent): void {
    const pastedText = event.clipboardData?.getData('text') || '';
    if (!/^\d+$/.test(pastedText)) { event.preventDefault(); }
  }

  // ─── Actions ───

  private hasDateValidationError(): boolean {
    return this.form.hasError('dateRangeInvalid') || false;
  }

  get isFormValid(): boolean {
    if (this.mode === 'edit' && !this.form.dirty) return false;
    return this.form.valid && !this.hasDateValidationError();
  }

  private serializeDateForApi(date: Moment | Date | null | undefined): string | null {
    const dateStr = DateFieldValidationUtility.serializeDateForApi(date);
    if (!dateStr) return null;
    return `${dateStr}T12:00:00.000Z`;
  }

  private buildRequest(): AddEligiblePlasmaCellLossRequest {
    const formValue = this.form.getRawValue();
    return {
      cellType: formValue.cellType,
      fromWeight: formValue.minWeight,
      toWeight: formValue.maxWeight,
      maximumLoss: formValue.maxLoss,
      daysBetween: typeof formValue.period === 'string' ? parseInt(formValue.period, 10) : formValue.period,
      effDate: this.serializeDateForApi(formValue.effectiveDate) || '',
      termDate: this.serializeDateForApi(formValue.terminationDate) || null,
      chapterId: this.headerService.chapterId?.() || '001',
      programId: '001',
    };
  }

  private validateBeforeSave(): boolean {
    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'terminationDate');

    if (this.form.errors?.['maxWeightInvalid'] && !this.lastChangedWeightField) {
      this.lastChangedWeightField = 'max';
    }

    if (this.form.errors?.['dateRangeInvalid'] && !this.lastChangedDateField) {
      this.lastChangedDateField = 'effective';
    }

    if (this.form.invalid) return false;
    if (this.hasDateValidationError()) {
      this.form.get('terminationDate')?.markAsTouched();
      return false;
    }
    return true;
  }

  onSave(): void {
    if (!this.validateBeforeSave()) return;

    this.isSaving = true;
    this.checkDuplicateAndSave();
  }

  private checkDuplicateAndSave(): void {
    const formValue = this.form.getRawValue();
    const duplicateRequest: ValidateDuplicateRequest = {
      cellType: formValue.cellType,
      effDate: this.serializeDateForApi(formValue.effectiveDate) || '',
      chapterId: this.headerService.chapterId?.() || '001',
      ...(this.mode === 'edit' && formValue.auditKey ? { excludeAuditKey: formValue.auditKey } : {}),
    };

    this.eligiblePlasmaCellLossService.validateDuplicate(duplicateRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.isDuplicate) {
            this.isSaving = false;
            this.snackBar.open(
              response.message || 'A record with this Cell Type and Effective Date already exists.',
              'Close',
              { duration: 5000, horizontalPosition: 'end', verticalPosition: 'top', panelClass: ['error-snackbar'] }
            );
            return;
          }
          if (this.mode === 'add') {
            this.performAdd();
          } else {
            this.performUpdate();
          }
        },
        error: () => {
          if (this.mode === 'add') {
            this.performAdd();
          } else {
            this.performUpdate();
          }
        }
      });
  }

  private performAdd(): void {
    this.eligiblePlasmaCellLossService.addRecord(this.buildRequest())
      .pipe(takeUntil(this.destroy$), finalize(() => { this.isSaving = false; }))
      .subscribe({
        next: () => {
          this.snackBar.open('Record added successfully', 'Close', {
            duration: 3000, horizontalPosition: 'end', verticalPosition: 'top', panelClass: ['success-snackbar']
          });
          this.saveSuccess.emit();
          this.closePanel.emit();
        },
        error: (error) => {
          this.showErrorSnackbar(error, 'Failed to add record');
        }
      });
  }

  private performUpdate(): void {
    const auditKey = this.form.getRawValue().auditKey;
    this.eligiblePlasmaCellLossService.updateRecord(auditKey, this.buildRequest())
      .pipe(takeUntil(this.destroy$), finalize(() => { this.isSaving = false; }))
      .subscribe({
        next: () => {
          this.snackBar.open('Record updated successfully', 'Close', {
            duration: 3000, horizontalPosition: 'end', verticalPosition: 'top', panelClass: ['success-snackbar']
          });
          this.saveSuccess.emit();
          this.closePanel.emit();
        },
        error: (error) => {
          this.showErrorSnackbar(error, 'Failed to update record');
        }
      });
  }

  onCancel(): void {
    this.closePanel.emit();
  }

  private showErrorSnackbar(error: any, fallbackMessage: string): void {
    let errorMessage = fallbackMessage;
    const errorCode = error?.error?.errorCode || error?.error?.errorResponse?.errorCode;

    if (error?.error?.errorResponse?.error) {
      errorMessage = error.error.errorResponse.error;
    } else if (error?.error?.errors && Array.isArray(error.error.errors) && error.error.errors.length > 0) {
      errorMessage = error.error.errors.join(', ');
    } else if (error?.error?.message) {
      errorMessage = error.error.message;
    }

    if (errorCode) {
      errorMessage = `${errorMessage} (Error Code: ${errorCode})`;
    }

    this.snackBar.open(errorMessage, 'Close', {
      duration: 5000, horizontalPosition: 'end', verticalPosition: 'top', panelClass: ['error-snackbar']
    });
  }
}
