import {
  Component,
  OnInit,
  OnDestroy,
  Input,
  Output,
  EventEmitter,
  inject,
  ChangeDetectorRef,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, takeUntil, distinctUntilChanged } from 'rxjs';
import moment, { Moment } from 'moment';

import { DonorEmployerService } from '../services/donor-employer.service';
import { DonorEmployer, UpdateDonorEmployerRequest, StateOption, CountryOption } from '../models/donor-employer.model';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { HeaderService } from '@shared/services/header.service';
import { HttpErrorHandler } from '@shared/utils/error-handler.utils';

@Component({
  selector: 'app-edit-employer-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './edit-employer-dialog.html',
  styleUrls: ['./edit-employer-dialog.scss']
})
export class EditEmployerDialog implements OnInit, OnDestroy {
  @Input() employer: DonorEmployer | null = null;
  @Output() save = new EventEmitter<{ message: string }>();
  @Output() close = new EventEmitter<void>();

  private destroy$ = new Subject<void>();
  private fb = inject(FormBuilder);
  private donorEmployerService = inject(DonorEmployerService);
  private cdr = inject(ChangeDetectorRef);
  private snackBar = inject(MatSnackBar);
  private readonly headerService = inject(HeaderService);

  form!: FormGroup;
  isSaving = false;

  minDate: Moment;
  terminationMinDate: Moment;

  editModeValues = {
    effectiveDate: ''
  };

  isEffectiveDateEditable = false;
  private initialFormSnapshot: string = '';
  private lastChangedDateField: 'effective' | 'termination' | null = null;

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEffectiveDateError());
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTerminationDateError());

  private get chapterOffset(): string { return this.headerService.chapterTimeZone(); }

  private getChapterMinDate(): Moment {
    const chapterDate = DateFieldValidationUtility.getMinDate(this.chapterOffset);
    return moment.utc(chapterDate.format('YYYY-MM-DD'), 'YYYY-MM-DD');
  }

  private updateTerminationMinDate(): void {
    const effectiveValue = this.form?.get('effDate')?.value;
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

  constructor() {
    this.minDate = this.getChapterMinDate();
    this.terminationMinDate = this.minDate;

    effect(() => {
      this.minDate = this.getChapterMinDate();
      this.updateTerminationMinDate();
    });
  }

  ngOnInit(): void {
    this.initializeForm();
    this.setupDateValidationListeners();
    this.populateFormForEdit(); // This enables effDate if editable
    // Note: NOT calling setupEditModeValidators because we handle effDate enabling/disabling in populateFormForEdit
    this.addTerminationDatePastValidator();
    this.cdr.detectChanges(); // Force change detection after setup
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    const effDate = this.employer?.effDate ? moment(this.employer.effDate) : null;
    const termDate = this.employer?.termDate ? moment(this.employer.termDate) : null;

    this.form = this.fb.group({
      effDate: [effDate],
      termDate: [termDate]
    }, { validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effDate', 'termDate')] });
  }

  private addTerminationDatePastValidator(): void {
    const termControl = this.form.get('termDate');
    if (termControl) {
      termControl.addValidators(DateFieldValidationUtility.terminationDateNotPastValidator(this.chapterOffset));
      termControl.updateValueAndValidity();
    }
  }

  private setupDateValidationListeners(): void {
    this.form.statusChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.cdr.markForCheck();
      });

    this.form.get('effDate')?.valueChanges
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
      });

    this.form.get('termDate')?.valueChanges
      .pipe(
        distinctUntilChanged((prev, curr) => {
          if (!prev && !curr) return true;
          if (!prev || !curr) return false;
          return moment(prev).format('YYYY-MM-DD') === moment(curr).format('YYYY-MM-DD');
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.lastChangedDateField = 'termination';
        this.form.get('termDate')?.markAsTouched();
        this.form.get('termDate')?.markAsDirty();
        this.form.updateValueAndValidity({ emitEvent: false });
        this.cdr.markForCheck();
      });
  }

  private populateFormForEdit(): void {
    if (!this.employer) return;

    this.editModeValues.effectiveDate = this.employer.effDate
      ? this.formatDateDisplay(this.employer.effDate)
      : '-';

    // Determine if effective date is editable (>= current date)
    const effDateMoment = this.employer.effDate ? moment(this.employer.effDate) : null;
    const today = DateFieldValidationUtility.getMinDate(this.chapterOffset);
    this.isEffectiveDateEditable = effDateMoment ? effDateMoment.isSameOrAfter(today, 'day') : false;

    // If effective date is editable, enable and add validators
    if (this.isEffectiveDateEditable) {
      const effDateControl = this.form.get('effDate');
      effDateControl?.enable(); // Enable the control
      effDateControl?.setValidators([Validators.required, DateFieldValidationUtility.effectiveDateNotPastValidator()]);
      effDateControl?.updateValueAndValidity();
    } else {
      // Disable if not editable
      const effDateControl = this.form.get('effDate');
      effDateControl?.disable();
    }

    this.updateTerminationMinDate();
    this.initialFormSnapshot = this.getFormSnapshot();
  }

  get displayAddress(): string {
    if (!this.employer) return '-';
    if (this.employer.intlAddrFlag === 'Y') {
      return this.employer.internationalAddress || '-';
    }
    return this.employer.address || '-';
  }

  formatDateDisplay(dateStr: string | null): string {
    return DateFieldValidationUtility.formatDateForUI(dateStr ? moment(dateStr) : null) || '-';
  }

  onTerminationDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value,
      this.form.get('termDate'),
      true
    );
    this.form.get('termDate')?.markAsTouched();
    this.form.get('termDate')?.markAsDirty();
    this.form.updateValueAndValidity();
    this.cdr.markForCheck();
  }

  onTerminationDateChange(): void {
    this.form.get('termDate')?.markAsTouched();
    this.form.get('termDate')?.markAsDirty();
    this.form.updateValueAndValidity();
    this.cdr.markForCheck();
  }

  onEffectiveDateInput(event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value,
      this.form.get('effDate')
    );
  }

  onEffectiveDateChange(): void {
    this.form.get('effDate')?.markAsTouched();
    this.form.get('effDate')?.markAsDirty();
    this.form.updateValueAndValidity();
  }

  getEffectiveDateError(): string {
    const formErrors = this.lastChangedDateField === 'effective' ? this.form.errors : null;
    return DateFieldValidationUtility.getStartDateCrossFieldError(
      this.form.get('effDate'), 'Effective Date', 'Termination Date', formErrors
    );
  }

  getTerminationDateError(): string {
    const formErrors = this.lastChangedDateField === 'termination' ? this.form.errors : null;
    return DateFieldValidationUtility.getEndDateCrossFieldError(
      this.form.get('termDate'), 'Termination Date', 'Effective Date', formErrors
    );
  }

  private getFormSnapshot(): string {
    const val = this.form.getRawValue();
    return JSON.stringify({
      effDate: this.isEffectiveDateEditable && val.effDate ? (moment.isMoment(val.effDate) ? val.effDate.format('YYYY-MM-DD') : moment(val.effDate).format('YYYY-MM-DD')) : '',
      termDate: val.termDate ? (moment.isMoment(val.termDate) ? val.termDate.format('YYYY-MM-DD') : moment(val.termDate).format('YYYY-MM-DD')) : ''
    });
  }

  get isFormChanged(): boolean {
    return this.getFormSnapshot() !== this.initialFormSnapshot;
  }

  get isFormValid(): boolean {
    return this.form.valid && this.isFormChanged;
  }

  onSubmit(): void {
    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'termDate');
    this.cdr.markForCheck();

    if (this.form.invalid || !this.employer) {
      this.focusFirstInvalidField();
      return;
    }

    this.isSaving = true;
    const formValue = this.form.getRawValue();

    // If effective date is editable, use the form value; otherwise use the original employer's effDate
    const effDateToSend = this.isEffectiveDateEditable
      ? (DateFieldValidationUtility.serializeDateForApi(formValue.effDate) || '')
      : (this.employer.effDate || '');

    // Send all existing employer data to prevent backend from clearing fields
    const request: UpdateDonorEmployerRequest = {
      employerId: this.employer.employerId,
      employerName: this.employer.employerName,
      effDate: effDateToSend,
      termDate: DateFieldValidationUtility.serializeDateForApi(formValue.termDate),
      uspsId: this.employer.uspsId,
      city: this.employer.city,
      zip: this.employer.zip,
      intlAddrFlag: this.employer.intlAddrFlag,
      intlCity: this.employer.intlCity,
      intlState: this.employer.intlState,
      intlPostalCode: this.employer.intlPostalCode,
      intlCountryName: this.employer.intlCountryName
    };

    this.donorEmployerService.update(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isSaving = false;
          this.save.emit({
            message: `Employer details of ${this.employer?.employerId} updated successfully.`
          });
        },
        error: (error) => {
          this.isSaving = false;
          this.snackBar.open(HttpErrorHandler.extractErrorMessage(error, 'An error occurred while saving'), 'DISMISS', {
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  private focusFirstInvalidField(): void {
    const firstInvalidControl = Object.keys(this.form.controls)
      .find(key => this.form.controls[key].invalid);
    if (firstInvalidControl) {
      const el = document.querySelector(`[formControlName="${firstInvalidControl}"]`) as HTMLElement;
      if (el) el.focus();
    }
  }

  onCancel(): void {
    this.close.emit();
  }

  convertToUpperCase(event: Event, controlName: string): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    const upperValue = value.toUpperCase();

    if (value !== upperValue) {
      const control = this.form.get(controlName);
      control?.setValue(upperValue, { emitEvent: false });

      // Preserve cursor position
      const cursorPosition = input.selectionStart || 0;
      setTimeout(() => {
        input.setSelectionRange(cursorPosition, cursorPosition);
      }, 0);
    }
  }
}
