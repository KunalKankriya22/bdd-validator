import { Component, EventEmitter, Input, OnInit, Output, OnChanges, SimpleChanges, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { noWhitespaceOnlyValidator } from '@shared/validators/input.validators';
import { HeaderService } from '@shared/services/header.service';
import {
  AssociateNicknameToName,
  AssociateNicknameCreateRequest,
  AssociateNicknameUpdateRequest,
  AssociateNicknameFormData,
} from '../models/associate-nickname-to-name.model';
import { AssociateNicknameToNameApiService } from '../services/associate-nickname-to-name-api.service';
import moment, { Moment } from 'moment';
import { Subject, takeUntil, finalize } from 'rxjs';

@Component({
  selector: 'app-add-update-associate-nickname',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatIconModule,
    MatSnackBarModule,
  ],
  templateUrl: './add-update-associate-nickname.html',
  styleUrls: ['./add-update-associate-nickname.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
})
export class AddUpdateAssociateNicknameComponent implements OnInit, OnChanges, OnDestroy {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() data: AssociateNicknameToName | null = null;
  @Output() closePanel = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<AssociateNicknameFormData>();
  @Output() modeChange = new EventEmitter<'add' | 'edit'>();

  panelTitle: string = '';

  form!: FormGroup;
  isSaving = false;
  isSavingAndCreating = false;

  // Store original values for edit mode (composite key)
  private originalValues: {
    nickName: string;
    firstName: string;
  } = {
    nickName: '',
    firstName: ''
  };

  editModeValues: {
    nickName: string;
    firstName: string;
    effDate: string;
    termDate: string;
  } = {
    nickName: '',
    firstName: '',
    effDate: '',
    termDate: ''
  };

  // Minimum date for datepicker restrictions
  minDate: Moment;

  private lastChangedDateField: 'effective' | 'termination' | null = null;

  get minTerminationDate(): Moment {
    if (this.mode === 'edit' && this.data?.effDate) {
      const effMoment = moment(this.data.effDate).startOf('day');
      return effMoment.isAfter(this.minDate) ? effMoment : this.minDate;
    }
    return this.minDate;
  }

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEffDateError());
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTermDateError());

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private service: AssociateNicknameToNameApiService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private headerService: HeaderService
  ) {
    this.minDate = DateFieldValidationUtility.getMinDate();
  }

  ngOnInit(): void {
    this.initializeForm();
    this.minDate = DateFieldValidationUtility.getMinDate(this.headerService.chapterTimeZone());
    this.setupPanel();
    this.subscribeToChapterChanges();

    this.form.statusChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.cdr.markForCheck());

    this.form.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'effective';
        this.form.get('effectiveDate')?.markAsTouched();
        this.cdr.markForCheck();
      });

    this.form.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'termination';
        this.cdr.markForCheck();
      });
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.form = this.fb.group({
      nickName: ['', [Validators.required, Validators.maxLength(25), noWhitespaceOnlyValidator()]],
      firstName: ['', [Validators.required, Validators.maxLength(25), noWhitespaceOnlyValidator()]],
      effectiveDate: [null, [Validators.required, DateFieldValidationUtility.effectiveDateNotPastValidator()]],
      terminationDate: [null]
    }, {
      validators: [DateFieldValidationUtility.dateRangeValidator()]
    });
  }

  private setupPanel(): void {
    if (this.mode === 'add') {
      this.panelTitle = 'Add New Nickname';
      this.resetFormForAddMode();
      this.setupAddModeValidators();
    } else {
      this.panelTitle = 'Edit Nickname';
      this.populateFormForEdit();
      this.setupEditModeValidators();
    }
  }

  private resetFormForAddMode(): void {
    this.form.reset({
      nickName: '',
      firstName: '',
      effectiveDate: null,
      terminationDate: null
    });

    this.editModeValues = {
      nickName: '',
      firstName: '',
      effDate: '',
      termDate: ''
    };

    this.form.markAsUntouched();
    this.form.markAsPristine();
    this.lastChangedDateField = null;
    this.form.get('firstName')?.enable();
    this.form.get('nickName')?.enable();
  }

  private populateFormForEdit(): void {
    if (this.data) {
      // Store original values for update API
      this.originalValues = {
        nickName: this.data.nickName,
        firstName: this.data.firstName
      };

      this.form.patchValue({
        nickName: this.data.nickName || '',
        firstName: this.data.firstName || '',
        effectiveDate: this.data.effDate ? moment(this.data.effDate) : null,
        terminationDate: this.data.termDate ? moment(this.data.termDate) : null
      });

      this.editModeValues = {
        nickName: this.data.nickName || '',
        firstName: this.data.firstName || '',
        effDate: this.data.effDate ? this.formatDateForDisplay(this.data.effDate) : '',
        termDate: this.data.termDate ? this.formatDateForDisplay(this.data.termDate) : ''
      };

      this.form.get('nickName')?.enable();
      this.form.get('firstName')?.disable();

      this.form.markAsPristine();
      this.form.markAsUntouched();
      this.lastChangedDateField = null;
    }
  }

  /**
   * Custom setup for edit mode validators.
   * - If original effective date is in the past: disable the field (read-only)
   * - If original effective date is today or future: keep field editable but validate against past dates
   */
  private setupAddModeValidators(): void {
    DateFieldValidationUtility.setupAddModeValidators(this.form, this.headerService.chapterTimeZone());
    this.form.setValidators([DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate')]);
    this.form.updateValueAndValidity();
  }

  private setupEditModeValidators(): void {
    DateFieldValidationUtility.setupEditModeValidators(this.form, this.headerService.chapterTimeZone());
    this.form.setValidators([DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate')]);
    this.form.updateValueAndValidity();
  }

  onEffectiveDateInput(event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value, this.form.get('effectiveDate')
    );
    this.cdr.markForCheck();
  }

  onTerminationDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value, this.form.get('terminationDate'), this.mode === 'edit'
    );
    this.cdr.markForCheck();
  }

  private formatDateForDisplay(date: Date | string | null | undefined): string {
    if (!date) return '';
    const m = moment(date);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : '';
  }

  getNickNameError(): string {
    const control = this.form.get('nickName');
    if (!control || !(control.touched || control.dirty)) return '';

    if (control.hasError('required')) return 'Nick name is required';
    if (control.hasError('whitespaceOnly')) return 'Nick name cannot be only whitespace';
    if (control.hasError('maxlength')) return 'Nick name cannot exceed 25 characters';
    return '';
  }

  getFirstNameError(): string {
    const control = this.form.get('firstName');
    if (!control || !(control.touched || control.dirty)) return '';

    if (control.hasError('required')) return 'First name is required';
    if (control.hasError('whitespaceOnly')) return 'First name cannot be only whitespace';
    if (control.hasError('maxlength')) return 'First name cannot exceed 25 characters';
    return '';
  }

  getEffDateError(): string {
    const control = this.form.get('effectiveDate');
    if (!control || !(control.touched || control.dirty)) return '';

    if (control.hasError('matDatepickerParse') || control.hasError('invalidDateFormat') || control.hasError('invalidDate')) {
      return 'Effective Date is invalid';
    }
    if (control.hasError('required')) return 'Effective Date is required';
    if (control.hasError('effectiveDatePast')) return 'Effective Date cannot be past date';

    if (this.lastChangedDateField === 'effective') {
      const effVal = control.value;
      const termVal = this.form.get('terminationDate')?.value;
      if (effVal && termVal && moment(effVal).startOf('day').isAfter(moment(termVal).startOf('day'))) {
        return 'Effective Date must be less than or equal to Termination Date';
      }
    }
    return '';
  }

  getTermDateError(): string {
    const control = this.form.get('terminationDate');
    if (!control || !(control.touched || control.dirty)) return '';

    if (control.hasError('matDatepickerParse') || control.hasError('invalidDateFormat') || control.hasError('invalidDate')) {
      return 'Termination Date is invalid';
    }
    if (control.hasError('terminationDatePast')) {
      return 'Termination Date cannot be past date';
    }

    if (this.lastChangedDateField === 'termination' && control.value) {
      const effDate = this.mode === 'edit' && this.data?.effDate
        ? moment(this.data.effDate).startOf('day')
        : moment(this.form.get('effectiveDate')?.value).startOf('day');
      const termDate = moment(control.value).startOf('day');
      if (effDate.isValid() && termDate.isBefore(effDate)) {
        return 'Termination Date must be greater than or equal to Effective Date';
      }
    }

    return '';
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
      });
  }

  onCancel(): void {
    this.closePanel.emit();
  }

  onSave(): void {
    this.form.markAllAsTouched();

    // In add mode, validate form before submitting
    // In edit mode, allow submission to get API validation errors
    if (this.mode === 'add' && this.form.invalid) {
      return;
    }

    this.isSaving = true;

    const formValue = this.form.getRawValue();
    let apiCall;

    if (this.mode === 'add') {
      const createRequest: AssociateNicknameCreateRequest = {
        nickName: formValue.nickName.trim().toUpperCase(),
        firstName: formValue.firstName.trim().toUpperCase(),
        effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate) || '',
        termDate: DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate),
      };
      apiCall = this.service.createAssociateNickname(createRequest);
    } else {
      const updateRequest: AssociateNicknameUpdateRequest = {
        nickName: formValue.nickName.trim().toUpperCase(),
        firstName: formValue.firstName.trim().toUpperCase(),
        effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate) || '',
        termDate: DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate),
      };
      apiCall = this.service.updateAssociateNickname(
        this.originalValues.nickName,
        this.originalValues.firstName,
        updateRequest
      );
    }

    apiCall
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isSaving = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response: any) => {
          const message = response?.message || (this.mode === 'add'
            ? 'Nickname association created successfully'
            : 'Nickname association updated successfully');

          this.snackBar.open(message, 'DISMISS', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });

          const result: AssociateNicknameFormData = {
            nickName: formValue.nickName.trim().toUpperCase(),
            firstName: formValue.firstName.trim().toUpperCase(),
            effDate: formValue.effectiveDate ? formValue.effectiveDate.toDate() : new Date(),
            termDate: formValue.terminationDate ? formValue.terminationDate.toDate() : null
          };

          this.saveSuccess.emit(result);
          this.closePanel.emit();
        },
        error: (error) => {
          let errorMessage = '';

          if (this.mode === 'edit') {
            // Edit mode: Show detailed error with error code
            const apiError = error?.error;
            const errorCode = apiError?.errorCode || apiError?.errorResponse?.errorCode;
            const errorText = apiError?.errorResponse?.error || apiError?.error || apiError?.message || error?.message;

            if (errorCode && errorText) {
              // Format: "Error: 3115: Termination date cannot be before current date"
              errorMessage = `Error: ${errorCode}: ${errorText}`;
            } else if (errorText) {
              errorMessage = errorText;
            } else if (error.status === 409) {
              errorMessage = 'This nickname association already exists';
            } else if (error.status === 404) {
              errorMessage = 'Record not found';
            } else {
              errorMessage = 'An error occurred while saving';
            }
          } else {
            const apiError = error?.error;
            const errorCode = apiError?.errorCode || apiError?.errorResponse?.errorCode;
            const errorText = apiError?.errorResponse?.error || apiError?.error || apiError?.message || error?.message;

            if (errorCode && errorText) {
              errorMessage = `Error: ${errorCode}: ${errorText}`;
            } else if (errorText) {
              errorMessage = errorText;
            } else if (error.status === 409) {
              errorMessage = 'This nickname association already exists';
            } else if (error.status === 404) {
              errorMessage = 'Record not found';
            } else {
              errorMessage = 'An error occurred while saving';
            }
          }

          this.snackBar.open(errorMessage, 'DISMISS', {
            duration: 5000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  onSaveAndCreateAnother(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    this.isSavingAndCreating = true;

    const formValue = this.form.getRawValue();

    const createRequest: AssociateNicknameCreateRequest = {
      nickName: formValue.nickName.trim().toUpperCase(),
      firstName: formValue.firstName.trim().toUpperCase(),
      effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate) || '',
      termDate: DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate),
    };

    this.service.createAssociateNickname(createRequest)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isSavingAndCreating = false;
          this.cdr.markForCheck();
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

          const result: AssociateNicknameFormData = {
            nickName: formValue.nickName.trim().toUpperCase(),
            firstName: formValue.firstName.trim().toUpperCase(),
            effDate: formValue.effectiveDate ? formValue.effectiveDate.toDate() : new Date(),
            termDate: formValue.terminationDate ? formValue.terminationDate.toDate() : null
          };

          this.saveSuccess.emit(result);
          this.resetFormForAddMode();
        },
        error: (error) => {
          const apiError = error?.error;
          const errorCode = apiError?.errorCode || apiError?.errorResponse?.errorCode;
          const errorText = apiError?.errorResponse?.error || apiError?.error || apiError?.message || error?.message;

          let errorMessage = '';
          if (errorCode && errorText) {
            errorMessage = `Error: ${errorCode}: ${errorText}`;
          } else if (errorText) {
            errorMessage = errorText;
          } else if (error.status === 409) {
            errorMessage = 'This nickname association already exists';
          } else if (error.status === 404) {
            errorMessage = 'Record not found';
          } else {
            errorMessage = 'An error occurred while saving';
          }

          this.snackBar.open(errorMessage, 'DISMISS', {
            duration: 5000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  get isFormValidGetter(): boolean {
    if (this.mode === 'edit') {
      return this.form.dirty && this.form.valid && !this.isSaving && !this.isSavingAndCreating && !this.hasDateRangeError();
    }
    return this.form.valid && !this.isSaving && !this.isSavingAndCreating;
  }

  private hasDateRangeError(): boolean {
    const termControl = this.form.get('terminationDate');
    if (!termControl?.value || !this.data?.effDate) return false;
    const effMoment = moment(this.data.effDate).startOf('day');
    const termMoment = moment(termControl.value).startOf('day');
    return termMoment.isBefore(effMoment);
  }
}
