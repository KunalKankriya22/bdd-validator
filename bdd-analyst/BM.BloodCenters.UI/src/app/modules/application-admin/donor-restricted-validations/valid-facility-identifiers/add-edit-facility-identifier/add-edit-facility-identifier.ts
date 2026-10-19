import {
  Component,
  OnInit,
  OnDestroy,
  Inject,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, ErrorStateMatcher } from '@angular/material/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil, finalize } from 'rxjs';
import moment, { Moment } from 'moment';

import { ValidFacilityIdentifiersService, ChapterLookup } from '../services/valid-facility-identifiers.service';
import {
  ValidFacilityIdentifiersModel,
  ValidFacilityIdentifiersDto,
  UpdateValidFacilityIdentifiersDto
} from '../models/valid-facility-identifiers.model';
import { UppercaseMomentDateAdapter } from '@shared/date/uppercase-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';

export interface AddEditFacilityIdentifierDialogData {
  mode: 'add' | 'edit';
  data?: ValidFacilityIdentifiersModel;
}

@Component({
  selector: 'app-add-edit-facility-identifier',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatMomentDateModule,
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: UppercaseMomentDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './add-edit-facility-identifier.html',
  styleUrls: ['./add-edit-facility-identifier.scss']
})
export class AddEditFacilityIdentifier implements OnInit, OnDestroy {
  @ViewChild('effectiveDateInput') effectiveDateInput?: ElementRef<HTMLInputElement>;
  @ViewChild('terminationDateInput') terminationDateInput?: ElementRef<HTMLInputElement>;

  form!: FormGroup;
  mode: 'add' | 'edit' = 'add';
  isSaving = false;
  chapters: ChapterLookup[] = [];
  filteredChapters: ChapterLookup[] = [];
  chapterSearchControl = new FormControl('');
  isLoadingChapters = false;

  editModeValues = {
    chapterId: '',
    effectiveDate: ''
  };

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

  private originalChapterId = '';
  private originalFacilityIdentifier = '';
  private originalEffectiveDate = '';

  private initialFormValues: any = null;
  private lastChangedDateField: 'effective' | 'termination' | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private validFacilityIdentifiersService: ValidFacilityIdentifiersService,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<AddEditFacilityIdentifier>,
    private dateAdapter: DateAdapter<Moment>,
    @Inject(MAT_DIALOG_DATA) public data: AddEditFacilityIdentifierDialogData
  ) {
    this.mode = data.mode;
  }

  ngOnInit(): void {
    this.initializeForm();
    this.loadChapterIds();

    // Setup form based on mode
    if (this.mode === 'edit') {
      this.form.get('effectiveDate')?.disable();
      this.form.get('effectiveDate')?.clearValidators();
      this.form.get('effectiveDate')?.updateValueAndValidity();

      if (this.data.data) {
        this.populateFormForEdit();
      }
    }

    // Setup chapter search filter
    this.chapterSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search || '').toLowerCase();
        this.filteredChapters = this.chapters.filter(ch =>
          ch.chapterId.toLowerCase().includes(term) ||
          ch.chapterName.toLowerCase().includes(term)
        );
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

  private loadChapterIds(): void {
    this.isLoadingChapters = true;
    this.validFacilityIdentifiersService
      .getActiveChapters()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (chapters) => {
          this.chapters = chapters;
          this.filteredChapters = [...chapters];
          this.isLoadingChapters = false;
        },
        error: () => {
          this.snackBar.open('Failed to load chapters. Please try again.', 'Close', {
            duration: 5000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
          this.isLoadingChapters = false;
          this.chapters = [];
          this.filteredChapters = [];
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    const effectiveDateValidators = this.mode === 'add'
      ? [Validators.required, DateFieldValidationUtility.effectiveDateNotPastValidator()]
      : [Validators.required];

    this.form = this.fb.group({
      chapterId: ['', [Validators.required]],
      facilityIdentifier: ['', [Validators.required, Validators.maxLength(5), this.isbt128Validator()]],
      effectiveDate: [null, effectiveDateValidators],
      terminationDate: [null, this.mode === 'add' ? [DateFieldValidationUtility.terminationDateNotPastValidator()] : []]
    }, {
      validators: [DateFieldValidationUtility.dateRangeValidator()]
    });

    // Auto-uppercase FIN Code as user types
    this.form.get('facilityIdentifier')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        if (value && value !== value.toUpperCase()) {
          this.form.get('facilityIdentifier')?.setValue(value.toUpperCase(), { emitEvent: false });
        }
      });
  }

  /**
   * ISBT 128 format validator: 1 uppercase letter (A-Z) + 4 digits (0-9)
   * Matches backend validation in ValidFacilityIdentifiersValidation.cs
   * Error code: 16206
   */
  private isbt128Validator(): ValidatorFn {
    const pattern = /^[A-Z]\d{4}$/;
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) return null; // Let required validator handle empty
      const trimmed = value.trim().toUpperCase();
      if (!pattern.test(trimmed)) {
        return { invalidIsbt128: true };
      }
      return null;
    };
  }

  get panelTitle(): string {
    return this.mode === 'add' ? 'Add Facility Identification Code' : 'Edit Facility Identification Code';
  }

  private populateFormForEdit(): void {
    if (!this.data.data) return;

    const editData = this.data.data;

    this.originalChapterId = editData.chapterId || '';
    this.originalFacilityIdentifier = editData.facilityIdentifier || '';
    this.originalEffectiveDate = editData.effDate ? moment(editData.effDate).format('YYYY-MM-DD') : '';

    this.editModeValues.chapterId = editData.chapterId || '';
    this.editModeValues.effectiveDate = editData.effDate ? this.formatDateForDisplay(editData.effDate) : '-';

    this.form.get('chapterId')?.disable();
    this.form.get('chapterId')?.clearValidators();
    this.form.get('chapterId')?.updateValueAndValidity();

    this.form.patchValue({
      chapterId: editData.chapterId || '',
      facilityIdentifier: editData.facilityIdentifier || '',
      effectiveDate: editData.effDate ? moment(editData.effDate) : null,
      terminationDate: editData.termDate ? moment(editData.termDate) : null
    });

    // Store initial values for change detection in edit mode
    this.initialFormValues = {
      facilityIdentifier: editData.facilityIdentifier || '',
      terminationDate: editData.termDate ? moment(editData.termDate).valueOf() : null
    };
  }

  private formatDateForDisplay(date: Date | string | null | undefined): string {
    if (!date) return '-';
    return moment(date).format('DD-MMM-YYYY').toUpperCase();
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    const formValue = this.form.getRawValue();
    this.isSaving = true;

    let apiCall;

    if (this.mode === 'add') {
      const addPayload: ValidFacilityIdentifiersDto = {
        chapterId: formValue.chapterId?.trim() || '',
        facilityIdentifier: formValue.facilityIdentifier?.trim() || '',
        effDate: formValue.effectiveDate ? moment(formValue.effectiveDate).format('YYYY-MM-DD') : '',
        termDate: formValue.terminationDate ? moment(formValue.terminationDate).format('YYYY-MM-DD') : ''
      };
      apiCall = this.validFacilityIdentifiersService.addFacilityIdentifier(addPayload);
    } else {
      const updatePayload: UpdateValidFacilityIdentifiersDto = {
        chapterId: this.originalChapterId,
        originalFacilityIdentifier: this.originalFacilityIdentifier,
        facilityIdentifier: formValue.facilityIdentifier?.trim() || '',
        effDate: this.originalEffectiveDate,
        termDate: formValue.terminationDate ? moment(formValue.terminationDate).format('YYYY-MM-DD') : ''
      };
      apiCall = this.validFacilityIdentifiersService.updateFacilityIdentifier(updatePayload);
    }

    apiCall
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isSaving = false;
        })
      )
      .subscribe({
        next: () => {
          const chapterId = this.mode === 'add'
            ? formValue.chapterId?.trim()
            : this.originalChapterId;

          const message = this.mode === 'add'
            ? `${chapterId} has been added successfully.`
            : `${chapterId} has been updated successfully.`;

          this.snackBar.open(message, 'DISMISS', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });

          this.dialogRef.close({ success: true });
        },
        error: () => {
          // Error handling via global error interceptor
        }
      });
  }

  /**
   * Check if form data has changed from initial values (for edit mode)
   */
  private hasFormChanged(): boolean {
    if (this.mode !== 'edit' || !this.initialFormValues) {
      return true; // In add mode, always allow save if valid
    }

    const currentFacilityIdentifier = this.form.get('facilityIdentifier')?.value || '';
    const currentTerminationDate = this.form.get('terminationDate')?.value;
    const currentTerminationValue = currentTerminationDate && moment.isMoment(currentTerminationDate)
      ? currentTerminationDate.valueOf()
      : null;

    return currentFacilityIdentifier !== this.initialFormValues.facilityIdentifier ||
           currentTerminationValue !== this.initialFormValues.terminationDate;
  }

  // Form validity
  get isFormValid(): boolean {
    const isValid = this.form.valid;

    if (this.mode === 'edit') {
      return isValid && this.hasFormChanged();
    }

    return isValid;
  }

  get saveButtonLabel(): string {
    return this.mode === 'add' ? 'ADD' : 'SAVE';
  }

  // Error message methods
  getChapterIdError(): string {
    const control = this.form.get('chapterId');
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return 'Chapter ID is required';
    }
    return '';
  }

  getFacilityIdentifierError(): string {
    const control = this.form.get('facilityIdentifier');
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return 'FIN Code is required';
    }
    if (control.hasError('maxlength')) {
      return 'FIN Code cannot exceed 5 characters';
    }
    if (control.hasError('invalidIsbt128')) {
      return 'Invalid ISBT 128 prefix (format: 1 letter + 4 digits, e.g. A1234)';
    }
    return '';
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
      return 'Effective Date cannot be past date';
    }

    // Show dateRangeInvalid on effective date when it was the last changed field
    if (this.lastChangedDateField === 'effective' && this.form.errors?.['dateRangeInvalid']) {
      return 'Effective Date must be less than or equal to Termination Date';
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
      return 'Termination Date cannot be in the past';
    }

    if (this.lastChangedDateField !== 'effective') {
      if (control.hasError('matDatepickerMin')) {
        return 'Termination Date must be greater than or equal to Effective Date';
      }

      if (this.form.errors?.['dateRangeInvalid']) {
        return 'Termination Date must be greater than or equal to Effective Date';
      }
    }

    return '';
  }
}
