import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, ErrorStateMatcher } from '@angular/material/core';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import moment, { Moment } from 'moment';
import { Subject, takeUntil, distinctUntilChanged } from 'rxjs';

import {
  HHResponseGroupModel,
  HHResponseGroupCreateDto,
  HHResponseGroupUpdateDto
} from '../models/hh-response-groups.model';
import { HHResponseGroupsService } from '../services/hh-response-groups.service';
import { HeaderService } from '@shared/services/header.service';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { HhResponseGroupsValidators } from '../validators/hh-response-groups.validators';

/**
 * Add/Edit Side Panel for HH Response Groups
 * Handles creation and editing of health history response groups
 */
@Component({
  selector: 'app-add-edit-hh-response-group',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatIconModule,
    MatSnackBarModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './add-edit-hh-response-group.html',
  styleUrls: ['./add-edit-hh-response-group.scss']
})
export class AddEditHHResponseGroup implements OnInit, OnDestroy {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() data: HHResponseGroupModel | null = null;
  @Input() prefilledQuestionCode: string | null = null;
  @Input() prefilledResponseCode: string | null = null;
  @Output() save = new EventEmitter<{ response: any; keepOpen: boolean }>();
  @Output() close = new EventEmitter<void>();

  responseGroupForm!: FormGroup;
  isLoading = false;
  isSaving = false;

  currentChapterId = '';
  chapterTimezone = '';
  minDate: Moment;

  get editTerminationMinDate(): Moment | null {
    return this.responseGroupForm?.get('effectiveDate')?.value || this.minDate;
  }

  private lastChangedDateField: 'effectiveDate' | 'terminationDate' | null = null;

  private destroy$ = new Subject<void>();

  // Error state matchers for showing form-level cross-field validation errors
  effectiveDateErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control: FormControl | null): boolean => {
      if (!control) return false;
      const touchedOrDirty = control.touched || control.dirty;

      // If there is a cross-field date range error, only show error on the last changed field
      if (this.responseGroupForm?.errors?.['dateRangeInvalid']) {
        return touchedOrDirty && this.lastChangedDateField === 'effectiveDate';
      }

      // Otherwise, show normal field-level errors
      return control.invalid && touchedOrDirty;
    }
  };

  terminationDateErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control: FormControl | null): boolean => {
      if (!control) return false;
      const touchedOrDirty = control.touched || control.dirty;

      // If there is a cross-field date range error, only show error on the last changed field
      if (this.responseGroupForm?.errors?.['dateRangeInvalid']) {
        return touchedOrDirty && this.lastChangedDateField === 'terminationDate';
      }

      // Otherwise, show normal field-level errors
      return control.invalid && touchedOrDirty;
    }
  };

  constructor(
    private fb: FormBuilder,
    private hhResponseService: HHResponseGroupsService,
    private headerService: HeaderService,
    private cdr: ChangeDetectorRef,
    private snackBar: MatSnackBar
  ) {
    this.chapterTimezone = this.headerService.chapterTimeZone();
    this.minDate = DateFieldValidationUtility.getMinDate(this.chapterTimezone);
  }

  ngOnInit(): void {
    this.currentChapterId = this.headerService.chapterId();
    this.initializeForm();
    this.setupDateFieldTracking();

    if (this.mode === 'edit' && this.data) {
      this.populateForm();
    } else {
      this.responseGroupForm.updateValueAndValidity();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.responseGroupForm = this.fb.group({
      groupCode: ['', [
        this.groupCodeRequiredValidator(),
        this.groupCodeAlphanumericValidator(),
        Validators.maxLength(30)
      ]],
      description: ['', [
        HhResponseGroupsValidators.requiredField('Description'),
        Validators.maxLength(240)
      ]],
      effectiveDate: [null, [Validators.required]],
      terminationDate: [null]
    }, {
      validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate')]
    });

    if (this.mode === 'edit') {
      DateFieldValidationUtility.setupEditModeValidators(this.responseGroupForm, this.chapterTimezone);
    } else {
      DateFieldValidationUtility.setupAddModeValidators(this.responseGroupForm, this.chapterTimezone);
    }
  }

  /**
   * Track which date field was changed last
   * Used to intelligently place cross-field validation errors on the field the user modified
   */
  private setupDateFieldTracking(): void {
    this.responseGroupForm.get('effectiveDate')?.valueChanges
      .pipe(
        distinctUntilChanged((prev, curr) => {
          if (!prev && !curr) return true;
          if (!prev || !curr) return false;
          return moment(prev).format('YYYY-MM-DD') === moment(curr).format('YYYY-MM-DD');
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        setTimeout(() => {
          this.lastChangedDateField = 'effectiveDate';
        }, 0);
      });

    this.responseGroupForm.get('terminationDate')?.valueChanges
      .pipe(
        distinctUntilChanged((prev, curr) => {
          if (!prev && !curr) return true;
          if (!prev || !curr) return false;
          return moment(prev).format('YYYY-MM-DD') === moment(curr).format('YYYY-MM-DD');
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        setTimeout(() => {
          this.lastChangedDateField = 'terminationDate';
        }, 0);
      });
  }

  /**
   * Custom validator for Group Code required field
   */
  private groupCodeRequiredValidator() {
    return (control: any) => {
      const value = control.value?.trim();
      if (!value) {
        return {
          requiredField: {
            errorCode: '0080',
            message: 'Group Code is required'
          }
        };
      }
      return null;
    };
  }

  /**
   * Custom validator for Group Code alphanumeric check
   */
  private groupCodeAlphanumericValidator() {
    return (control: any) => {
      const value = control.value?.trim();
      if (value) {
        const alphanumericRegex = /^[A-Z0-9]+$/i;
        if (!alphanumericRegex.test(value)) {
          return {
            invalidCharacters: {
              errorCode: '9740',
              message: 'Invalid characters in group code (non-alphanumeric)'
            }
          };
        }
      }
      return null;
    };
  }

  private populateForm(): void {
    if (!this.data) return;

    this.responseGroupForm.patchValue({
      groupCode: this.data.groupCode,
      description: this.data.description,
      effectiveDate: this.data.effectiveDate ? moment(this.data.effectiveDate) : null,
      terminationDate: this.data.terminationDate ? moment(this.data.terminationDate) : null
    });

    if (this.mode === 'edit') {
      const groupCodeControl = this.responseGroupForm.get('groupCode');
      groupCodeControl?.disable();
      groupCodeControl?.clearValidators();
      groupCodeControl?.updateValueAndValidity();

      // Effective date is disabled by setupEditModeValidators
      this.responseGroupForm.get('effectiveDate')?.disable({ emitEvent: false });
    }

    this.responseGroupForm.markAsPristine();
  }

  onAdd(): void {
    this.responseGroupForm.markAllAsTouched();

    if (this.responseGroupForm.errors?.['dateRangeInvalid'] && !this.lastChangedDateField) {
      this.lastChangedDateField = 'terminationDate';
    }

    DateFieldValidationUtility.clearOptionalDateErrors(this.responseGroupForm, 'terminationDate');
    if (this.responseGroupForm.invalid) return;
    this.saveGroup(false);
  }

  onAddAndCreateAnother(): void {
    this.responseGroupForm.markAllAsTouched();

    if (this.responseGroupForm.errors?.['dateRangeInvalid'] && !this.lastChangedDateField) {
      this.lastChangedDateField = 'terminationDate';
    }

    DateFieldValidationUtility.clearOptionalDateErrors(this.responseGroupForm, 'terminationDate');
    if (this.responseGroupForm.invalid) return;
    this.saveGroup(true);
  }

  onSave(): void {
    this.responseGroupForm.markAllAsTouched();

    if (this.responseGroupForm.errors?.['dateRangeInvalid'] && !this.lastChangedDateField) {
      this.lastChangedDateField = 'terminationDate';
    }

    DateFieldValidationUtility.clearOptionalDateErrors(this.responseGroupForm, 'terminationDate');
    if (this.responseGroupForm.invalid) return;
    this.saveGroup(false);
  }

  private saveGroup(keepOpen: boolean): void {
    this.isSaving = true;

    const formValue = this.responseGroupForm.getRawValue();

    const questionCode = this.mode === 'add' ? this.prefilledQuestionCode : this.data?.questionCode;
    const responseCode = this.mode === 'add' ? this.prefilledResponseCode : this.data?.responseCode;

    const effectiveDateFormatted = DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate);
    const terminationDateFormatted = DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate);

    const payload: HHResponseGroupCreateDto = {
      questionCode: questionCode || '',
      responseCode: responseCode || '',
      groupCode: formValue.groupCode || '',
      description: formValue.description || '',
      effectiveDate: effectiveDateFormatted || '',
      terminationDate: terminationDateFormatted || undefined,
      chapterId: this.currentChapterId
    };

    const operation = this.mode === 'add'
      ? this.hhResponseService.addResponseGroup(payload)
      : this.hhResponseService.updateResponseGroup(payload as HHResponseGroupUpdateDto);

    operation.subscribe({
      next: (response) => {
        this.isSaving = false;
        this.save.emit({ response, keepOpen });

        if (keepOpen) {
          this.resetForm();
        } else {
          this.close.emit();
        }
      },
      error: () => {
        this.isSaving = false;
      }
    });
  }

  onCancel(): void {
    this.close.emit();
  }

  resetForm(): void {
    this.lastChangedDateField = null;
    this.responseGroupForm.reset();
    this.responseGroupForm.markAsUntouched();
    this.responseGroupForm.markAsPristine();

    const groupCodeControl = this.responseGroupForm.get('groupCode');
    groupCodeControl?.enable();
    groupCodeControl?.setValidators([
      this.groupCodeRequiredValidator(),
      this.groupCodeAlphanumericValidator(),
      Validators.maxLength(30)
    ]);
    groupCodeControl?.updateValueAndValidity();

    // Re-setup add mode validators for date fields
    DateFieldValidationUtility.setupAddModeValidators(this.responseGroupForm, this.chapterTimezone);
  }

  onEffectiveDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const control = this.responseGroupForm.get('effectiveDate');
    this.lastChangedDateField = 'effectiveDate';

    if (!input.value?.trim()) {
      control?.setValue(null, { emitEvent: false });
      control?.markAsTouched();
      control?.setErrors({ required: true });
    } else {
      control?.markAsTouched();
      control?.markAsDirty();
    }

    setTimeout(() => {
      this.responseGroupForm.updateValueAndValidity();
    }, 0);
  }

  onTerminationDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const control = this.responseGroupForm.get('terminationDate');
    this.lastChangedDateField = 'terminationDate';

    if (!input.value?.trim()) {
      control?.setValue(null, { emitEvent: false });
      control?.setErrors(null);
      if (this.mode === 'edit') {
        control?.markAsDirty();
      } else {
        control?.markAsPristine();
        control?.markAsUntouched();
      }
      control?.updateValueAndValidity();
    } else {
      control?.markAsTouched();
      control?.markAsDirty();
      if (!control?.value) {
        control?.setErrors({ invalidDate: true });
      }
    }

    setTimeout(() => {
      this.responseGroupForm.updateValueAndValidity();
    }, 0);
  }

  getEffectiveDateError(): string {
    const control = this.responseGroupForm.get('effectiveDate');
    if (!control || !(control.touched || control.dirty)) return '';

    if (control.hasError('matDatepickerParse')) {
      return 'Effective date is invalid';
    }

    if (control.hasError('required')) {
      return 'Effective Date is required';
    }

    if (control.hasError('invalidDateFormat')) {
      return 'Effective date is invalid';
    }

    if (control.hasError('invalidDate')) {
      return 'Effective date is invalid';
    }

    if (control.hasError('effectiveDatePast')) {
      return 'Effective date cannot be past date';
    }

    // Show cross-field error ONLY if effective date was changed last
    const formErrors = this.lastChangedDateField === 'effectiveDate' ? this.responseGroupForm.errors : null;
    if (formErrors?.['dateRangeInvalid']) {
      return 'Effective Date must be less than or equal to Termination Date';
    }

    return '';
  }

  getTerminationDateError(): string {
    const control = this.responseGroupForm.get('terminationDate');
    if (!control || !(control.touched || control.dirty)) return '';

    if (!control.value) {
      return '';
    }

    if (control.hasError('invalidDateFormat')) {
      return 'Termination date is invalid';
    }

    if (control.hasError('invalidDate')) {
      return 'Termination date is invalid';
    }

    if (control.hasError('matDatepickerParse')) {
      return 'Termination date is invalid';
    }

    if (control.hasError('terminationDatePast')) {
      return 'Termination date cannot be past date';
    }

    // Skip matDatepickerMin error when there's a cross-field error on the OTHER field
    if (this.responseGroupForm.errors?.['dateRangeInvalid'] && this.lastChangedDateField !== 'terminationDate') {
      return '';
    }

    if (control.hasError('matDatepickerMin')) {
      return 'Termination Date must be greater than or equal to Effective Date';
    }

    // Show cross-field error ONLY if termination date was changed last
    if (this.responseGroupForm.errors?.['dateRangeInvalid'] && this.lastChangedDateField === 'terminationDate') {
      return 'Termination Date must be greater than or equal to Effective Date';
    }

    return '';
  }

  get descriptionCharsRemaining(): number {
    const description = this.responseGroupForm.get('description')?.value || '';
    return 240 - description.length;
  }

  getTitle(): string {
    return this.mode === 'add' ? 'Add New Response Group' : 'Edit Response Group';
  }

  getFormattedEffectiveDate(): string {
    if (!this.data?.effectiveDate) return '-';
    return moment(this.data.effectiveDate).format('DD-MMM-YYYY').toUpperCase();
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.responseGroupForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getErrorMessage(fieldName: string): string {
    const field = this.responseGroupForm.get(fieldName);
    if (!field) return '';

    if (field.hasError('requiredField')) {
      const error = field.getError('requiredField');
      return error.message;
    }

    if (field.hasError('invalidCharacters')) {
      const error = field.getError('invalidCharacters');
      return error.message;
    }

    return '';
  }

  /**
   * Check if the form is valid for submission
   */
  isFormValidForSubmission(): boolean {
    if (this.mode === 'edit') {
      return this.responseGroupForm.valid && !this.responseGroupForm.hasError('dateRangeInvalid');
    }

    const groupCode = this.responseGroupForm.get('groupCode');
    const effectiveDate = this.responseGroupForm.get('effectiveDate');
    const terminationDate = this.responseGroupForm.get('terminationDate');

    if (!groupCode || groupCode.invalid || !groupCode.value?.trim()) {
      return false;
    }

    if (!effectiveDate || effectiveDate.invalid || !effectiveDate.value) {
      return false;
    }

    if (terminationDate && terminationDate.value && terminationDate.invalid) {
      return false;
    }

    return this.responseGroupForm.valid && !this.responseGroupForm.hasError('dateRangeInvalid');
  }
}
