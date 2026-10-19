import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
  Input,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatRadioModule } from '@angular/material/radio';
import { Subject, takeUntil, finalize, debounceTime } from 'rxjs';
import moment from 'moment';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { dateFormatValidator } from 'src/app/core/utils/date-adapter.util';
import { noWhitespaceOnlyValidator, codeFieldValidator } from '@shared/validators/input.validators';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';

import { DefineDonationTypesService } from '../services/define-donation-types.service';
import {
  DefineDonationTypesModel,
  DefineDonationTypesDto,
  UpdateDefineDonationTypesDto
} from '../models/define-donation-types.model';

export interface DonationTypeFormData {
  donationTypeCode: string;
  donationTypeDescription: string;
  sequence: number;
  testingRequired: boolean;
  effectiveDate: Date;
  terminationDate?: Date | null;
}

@Component({
  selector: 'app-add-edit-donation-type',
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
    MatMomentDateModule,
    MatSnackBarModule,
    MatRadioModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './add-edit-donation-type.html',
  styleUrls: ['./add-edit-donation-type.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddEditDonationType implements OnInit, OnChanges, OnDestroy {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() data: DefineDonationTypesModel | null = null;
  @Output() closePanel = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<DonationTypeFormData>();

  form!: FormGroup;
  panelTitle = '';
  isSaving = false;
  minDate = DateFieldValidationUtility.getMinDate();

  // Temporary error message for sequence overflow
  showSequenceOverflowError = false;
  private sequenceErrorTimeout: ReturnType<typeof setTimeout> | null = null;

  /** Tracks which date field was last changed — cross-field error shows only on that field */
  private lastChangedDateField: 'effective' | 'termination' | null = null;

  effectiveDateError = '';
  terminationDateError = '';

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.effectiveDateError);
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.terminationDateError);

  /** Termination date filter: not before today and not before Effective Date */
  terminationDateFilter = (date: moment.Moment | null): boolean => {
    if (!date) return true;

    const checkDate = moment(date).startOf('day');
    const today = this.minDate.startOf('day');

    // Prevent dates before today
    if (checkDate.isBefore(today)) {
      return false;
    }

    // Prevent dates before effective date
    const eff = this.form?.get('effectiveDate')?.value;
    if (eff) {
      const effDay = moment(eff).startOf('day');
      if (checkDate.isBefore(effDay)) {
        return false;
      }
    }

    return true;
  };

  editModeValues = {
    donationTypeCode: '',
    effectiveDate: ''
  };

  private originalValues = {
    donationTypeCode: '',
    effectiveDate: null as Date | null
  };

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private defineDonationTypesService: DefineDonationTypesService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.updatePanelTitle();
    this.setupFormData();
    this.setupFormSubscriptions();
    this.updateDateErrors();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Reinitialize form when data or mode changes (e.g., opening panel multiple times)
    if ((changes['data'] || changes['mode']) && this.form) {
      this.initializeForm();
      this.updatePanelTitle();
      this.setupFormData();
      this.cdr.markForCheck();
    }
  }

  private setupFormData(): void {
    // Setup date validators based on mode
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
      if (this.data) {
        this.populateFormForEdit();
      }
    } else {
      DateFieldValidationUtility.setupAddModeValidators(this.form);
    }
  }

  private setupFormSubscriptions(): void {
    // Track which date field was last changed for cross-field error display
    this.form.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'effective';
        this.cdr.markForCheck();
      });

    this.form.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'termination';
        this.cdr.markForCheck();
      });

    // Trigger change detection and update date errors when form validation state changes (needed for OnPush)
    this.form.statusChanges
      .pipe(debounceTime(0), takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateDateErrors();
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.sequenceErrorTimeout) {
      clearTimeout(this.sequenceErrorTimeout);
    }
  }

  private initializeForm(): void {
    this.form = this.fb.group({
      donationTypeCode: ['', [Validators.required, Validators.maxLength(5), noWhitespaceOnlyValidator(), codeFieldValidator()]],
      donationTypeDescription: ['', [Validators.required, Validators.maxLength(50), noWhitespaceOnlyValidator()]],
      sequence: [null, [Validators.min(0), Validators.max(999)]],
      testingRequired: [false, [Validators.required]],
      effectiveDate: [null, [Validators.required]],
      terminationDate: [null]
    }, { validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate')] });
  }

  private updatePanelTitle(): void {
    this.panelTitle = this.mode === 'add' ? 'Add Donation Type' : 'Edit Donation Type';
  }

  private populateFormForEdit(): void {
    if (!this.data) return;

    // Store original values for API call
    this.originalValues.donationTypeCode = this.data.donationType || '';
    this.originalValues.effectiveDate = this.data.effDate ? new Date(this.data.effDate) : null;

    // Store display values for read-only cards
    this.editModeValues.donationTypeCode = this.data.donationType || '';
    this.editModeValues.effectiveDate = this.data.effDate
      ? moment(this.data.effDate).format('DD-MMM-YYYY')
      : '';

    // Disable non-editable fields in edit mode
    this.form.get('donationTypeCode')?.disable();

    // Clear validators for disabled fields
    this.form.get('donationTypeCode')?.clearValidators();
    this.form.get('donationTypeCode')?.updateValueAndValidity();

    // Populate form with data
    this.form.patchValue({
      donationTypeCode: this.data.donationType || '',
      donationTypeDescription: this.data.description || '',
      sequence: this.data.sortSequence || null,
      testingRequired: this.data.testNeededFlag?.toUpperCase() === 'Y',
      effectiveDate: this.data.effDate ? moment(this.data.effDate) : null,
      terminationDate: this.data.termDate ? moment(this.data.termDate) : null
    });

    this.form.markAsPristine();
    this.cdr.markForCheck();
  }

  onSequenceInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let inputValue = input.value;

    // Remove any non-digit characters
    inputValue = inputValue.replace(/[^\d]/g, '');

    // Limit to 3 digits max and show temporary error if exceeded
    if (inputValue.length > 3) {
      inputValue = inputValue.substring(0, 3);
      input.value = inputValue;
      // Update form control value to prevent max validator from triggering
      const truncatedValue = parseInt(inputValue, 10);
      this.form.get('sequence')?.setValue(truncatedValue || null, { emitEvent: false });
      this.form.get('sequence')?.updateValueAndValidity({ emitEvent: false });
      this.showTemporarySequenceError();
      return;
    }

    // Always update input value after cleaning
    input.value = inputValue;

    const value = parseInt(inputValue, 10);

    // Validate min value (0 is allowed for sequence)
    if (!isNaN(value) && value < 0) {
      input.value = '0';
      this.form.patchValue({ sequence: 0 }, { emitEvent: false });
    }
  }

  private showTemporarySequenceError(): void {
    // Clear any existing timeout
    if (this.sequenceErrorTimeout) {
      clearTimeout(this.sequenceErrorTimeout);
    }

    // Show error by setting custom error on form control
    this.showSequenceOverflowError = true;
    this.form.get('sequence')?.setErrors({ overflow: true });
    this.form.get('sequence')?.markAsTouched();
    this.cdr.markForCheck();

    // Hide error after 2 seconds
    this.sequenceErrorTimeout = setTimeout(() => {
      this.showSequenceOverflowError = false;
      // Clear the overflow error
      const control = this.form.get('sequence');
      if (control?.hasError('overflow')) {
        control.setErrors(null);
        control.updateValueAndValidity({ emitEvent: false });
      }
      this.cdr.markForCheck();
    }, 2000);
  }

  onCancel(): void {
    this.closePanel.emit();
  }

  /**
   * Convert date value to native Date object
   * Handles both moment objects and native Date objects
   */
  private toNativeDate(value: any): Date | null {
    if (!value) return null;

    // Check if it's a moment object
    if (moment.isMoment(value)) {
      return value.toDate();
    }

    // Check if it's already a Date object
    if (value instanceof Date) {
      return value;
    }

    // Try to parse as date string
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  /**
   * Convert Date to ISO string without timezone shift
   * Preserves the local date by using UTC at noon
   */
  private toISOStringWithoutTimezone(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T12:00:00.000Z`;
  }

  onSave(): void {
    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'terminationDate');
    this.cdr.markForCheck();

    if (this.form.invalid) {
      return;
    }

    const formValue = this.form.getRawValue();

    this.isSaving = true;

    let apiCall;

    if (this.mode === 'add') {
      const effectiveDate = this.toNativeDate(formValue.effectiveDate);
      const terminationDate = this.toNativeDate(formValue.terminationDate);

      const addPayload: DefineDonationTypesDto = {
        donationType: formValue.donationTypeCode?.trim() || '',
        description: formValue.donationTypeDescription?.trim() || '',
        testNeededFlag: formValue.testingRequired ? 'Y' : 'N',
        sortSequence: formValue.sequence || 0,
        effDate: effectiveDate ? moment(effectiveDate).format('YYYY-MM-DD') : '',
        termDate: terminationDate ? moment(terminationDate).format('YYYY-MM-DD') : ''
      };
      apiCall = this.defineDonationTypesService.addDonationType(addPayload);
    } else {
      const terminationDate = this.toNativeDate(formValue.terminationDate);

      const updatePayload: UpdateDefineDonationTypesDto = {
        donationType: this.originalValues.donationTypeCode,
        description: formValue.donationTypeDescription?.trim() || '',
        testNeededFlag: formValue.testingRequired ? 'Y' : 'N',
        sortSequence: formValue.sequence || 0,
        effDate: this.originalValues.effectiveDate ? moment(this.originalValues.effectiveDate).format('YYYY-MM-DD') : '',
        termDate: terminationDate ? moment(terminationDate).format('YYYY-MM-DD') : ''
      };
      apiCall = this.defineDonationTypesService.updateDonationType(updatePayload);
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
        next: () => {
          const donationTypeCode = this.mode === 'add'
            ? formValue.donationTypeCode?.trim()
            : this.originalValues.donationTypeCode;

          const message = this.mode === 'add'
            ? `${donationTypeCode} has been added successfully.`
            : `${donationTypeCode} has been updated successfully.`;

          this.snackBar.open(message, 'DISMISS', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });

          const result: DonationTypeFormData = {
            donationTypeCode: formValue.donationTypeCode?.trim() || '',
            donationTypeDescription: formValue.donationTypeDescription?.trim() || '',
            sequence: formValue.sequence,
            testingRequired: formValue.testingRequired,
            effectiveDate: this.toNativeDate(formValue.effectiveDate) || new Date(),
            terminationDate: this.toNativeDate(formValue.terminationDate)
          };

          this.saveSuccess.emit(result);
          this.closePanel.emit();
        },
        error: (error) => {
          let errorMessage = error?.error?.errorResponse?.error
            || error?.error?.message
            || error?.message
            || `Failed to ${this.mode === 'add' ? 'add' : 'update'} donation type`;

          const errorCode = error?.error?.errorCode || error?.error?.errorResponse?.errorCode;
          if (errorCode) {
            errorMessage = `Error ${errorCode}: ${errorMessage}`;
          }

          this.snackBar.open(errorMessage, 'DISMISS', {
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
          this.cdr.markForCheck();
        }
      });
  }


  // Form control getters
  get donationTypeCodeControl() {
    return this.form.get('donationTypeCode');
  }

  get donationTypeDescriptionControl() {
    return this.form.get('donationTypeDescription');
  }

  get sequenceControl() {
    return this.form.get('sequence');
  }

  get testingRequiredControl() {
    return this.form.get('testingRequired');
  }

  get effectiveDateControl() {
    return this.form.get('effectiveDate');
  }

  get terminationDateControl() {
    return this.form.get('terminationDate');
  }

  // Validation error methods
  getDonationTypeCodeError(): string {
    const control = this.donationTypeCodeControl;
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return 'Donation Type Code is required';
    }
    if (control.hasError('whitespaceOnly')) {
      return 'Donation Type Code cannot contain only spaces';
    }
    if (control.hasError('noAlphanumeric')) {
      return 'Donation Type Code must contain at least one letter or number';
    }
    if (control.hasError('maxlength')) {
      return 'Maximum 5 characters allowed';
    }
    return '';
  }

  getDonationTypeDescriptionError(): string {
    const control = this.donationTypeDescriptionControl;
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return 'Description is required';
    }
    if (control.hasError('whitespaceOnly')) {
      return 'Description cannot contain only spaces';
    }
    if (control.hasError('maxlength')) {
      return 'Maximum 50 characters allowed';
    }
    return '';
  }

  getSequenceError(): string {
    // Show temporary overflow error first
    if (this.showSequenceOverflowError) {
      return 'Sequence must be 999 or less';
    }

    const control = this.sequenceControl;
    if (!control || !control.touched) return '';

    if (control.hasError('min')) {
      return 'Sequence must be 0 or greater';
    }
    if (control.hasError('max')) {
      return 'Sequence must be 999 or less';
    }
    return '';
  }

  getTestingRequiredError(): string {
    const control = this.testingRequiredControl;
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return 'Testing Required is required';
    }
    return '';
  }

  private updateDateErrors(): void {
    const effFormErrors = this.lastChangedDateField === 'effective' ? this.form.errors : null;
    this.effectiveDateError = DateFieldValidationUtility.getStartDateCrossFieldError(
      this.form.get('effectiveDate'), 'Effective date', 'Termination date', effFormErrors
    );

    const termFormErrors = this.lastChangedDateField === 'termination' ? this.form.errors : null;
    this.terminationDateError = DateFieldValidationUtility.getEndDateCrossFieldError(
      this.form.get('terminationDate'), 'Termination date', 'Effective date', termFormErrors
    );

    // In edit mode, check if termination date is in the past
    if (this.mode === 'edit' && !this.terminationDateError) {
      const termControl = this.form.get('terminationDate');
      if (termControl && (termControl.touched || termControl.dirty) && termControl.value) {
        const selectedDate = moment.isMoment(termControl.value) ? termControl.value : moment(termControl.value);
        if (selectedDate.isValid()) {
          const today = DateFieldValidationUtility.getMinDate();
          if (selectedDate.format('YYYY-MM-DD') < today.format('YYYY-MM-DD')) {
            this.terminationDateError = 'Termination date cannot be past date';
          }
        }
      }
    }
  }

  getEffectiveDateError(): string {
    return this.effectiveDateError;
  }

  getTerminationDateError(): string {
    return this.terminationDateError;
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

  onTerminationDateBlur(): void {
    this.updateDateErrors();
    this.cdr.markForCheck();
  }

  get isFormValid(): boolean {
    if (this.mode === 'edit') {
      return !this.isSaving && this.form.dirty && !this.form.invalid;
    }
    return !this.form.invalid && !this.isSaving;
  }
}
