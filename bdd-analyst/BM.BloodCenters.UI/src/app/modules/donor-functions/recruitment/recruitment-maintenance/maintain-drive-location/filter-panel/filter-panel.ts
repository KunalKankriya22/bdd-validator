import { Component, EventEmitter, Input, OnInit, Output, ChangeDetectionStrategy, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { DriveLocationFilterFormValue } from '../models/maintain-drive-location.model';
import moment, { Moment } from 'moment';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { Subject, takeUntil } from 'rxjs';


@Component({
  selector: 'app-maintain-drive-location-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './filter-panel.html',
  styleUrls: ['./filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MaintainDriveLocationFilterPanel implements OnInit, OnDestroy {
  @ViewChild('effDateInput') effDateInput?: ElementRef<HTMLInputElement>;
  @ViewChild('termDateInput') termDateInput?: ElementRef<HTMLInputElement>;

  @Input() currentFilters: DriveLocationFilterFormValue | null = null;
  @Input() applicationDateTime: Moment | null = null;
  @Output() apply = new EventEmitter<DriveLocationFilterFormValue>();
  @Output() close = new EventEmitter<void>();

  filterForm!: FormGroup;
  private initialFormValue: any;
  private destroy$ = new Subject<void>();

  // Store raw input text to preserve invalid dates
  private effDateRawInput = '';
  private termDateRawInput = '';

  constructor(
    private fb: FormBuilder,
    private dateAdapter: DateAdapter<Moment>
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.initialFormValue = this.filterForm.value;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    // Parse dates from current filters
    const effDate = this.currentFilters?.effDate
      ? moment.isMoment(this.currentFilters.effDate) ? this.currentFilters.effDate : moment(this.currentFilters.effDate)
      : null;
    const termDate = this.currentFilters?.termDate
      ? moment.isMoment(this.currentFilters.termDate) ? this.currentFilters.termDate : moment(this.currentFilters.termDate)
      : null;

    this.filterForm = this.fb.group({
      effDatePeriod: [this.currentFilters?.effDatePeriod || null],
      effDate: [effDate],
      termDatePeriod: [this.currentFilters?.termDatePeriod || null],
      termDate: [termDate]
    });

    // Validate period is selected when date is entered
    this.filterForm.get('effDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateEffDatePeriod();
      });

    this.filterForm.get('effDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateEffDatePeriod();
      });

    this.filterForm.get('termDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateTermDatePeriod();
        this.validateTerminationDateInput();
      });

    this.filterForm.get('termDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateTermDatePeriod();
      });
  }

  private validateEffDatePeriod(): void {
    const effDate = this.filterForm.get('effDate')?.value;
    const effDatePeriod = this.filterForm.get('effDatePeriod')?.value;
    const effDatePeriodControl = this.filterForm.get('effDatePeriod');

    if (effDate && !effDatePeriod) {
      effDatePeriodControl?.setErrors({ required: true });
      effDatePeriodControl?.markAsTouched();
    } else {
      effDatePeriodControl?.setErrors(null);
    }
  }

  private validateTermDatePeriod(): void {
    const termDate = this.filterForm.get('termDate')?.value;
    const termDatePeriod = this.filterForm.get('termDatePeriod')?.value;
    const termDatePeriodControl = this.filterForm.get('termDatePeriod');

    if (termDate && !termDatePeriod) {
      termDatePeriodControl?.setErrors({ required: true });
      termDatePeriodControl?.markAsTouched();
    } else {
      termDatePeriodControl?.setErrors(null);
    }
  }

  private validateEffectiveDateInput(): void {
    const control = this.filterForm.get('effDate');
    const inputElement = this.effDateInput?.nativeElement;
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
    const control = this.filterForm.get('termDate');
    const inputElement = this.termDateInput?.nativeElement;
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

  onApply(): void {
    // Validate before emitting
    this.validateEffDatePeriod();
    this.validateTermDatePeriod();

    if (this.filterForm.valid) {
      this.apply.emit(this.filterForm.value);
    }
  }

  onClear(): void {
    this.filterForm.reset({
      effDatePeriod: null,
      effDate: null,
      termDatePeriod: null,
      termDate: null
    });
  }

  onClose(): void {
    this.close.emit();
  }

  isApplyDisabled(): boolean {
    // Disable if form is invalid or unchanged
    const isUnchanged = JSON.stringify(this.filterForm.value) === JSON.stringify(this.initialFormValue);
    return this.filterForm.invalid || isUnchanged;
  }

  onEffDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const inputValue = input.value.trim();
    this.effDateRawInput = inputValue;

    const control = this.filterForm.get('effDate');
    if (!control) return;

    control.markAsDirty();
    control.markAsTouched();

    // Check if input has text but control value is null (invalid date)
    setTimeout(() => {
      if (inputValue && !control.value) {
        control.setErrors({ ...control.errors, invalidDate: true });
      }
    }, 0);
  }

  onEffDateBlur(input: HTMLInputElement): void {
    setTimeout(() => {
      const control = this.filterForm.get('effDate');
      if (!control) return;

      control.markAsTouched();

      const controlValue = control.value;
      const inputValue = input.value.trim();

      // Check if we have a valid moment object
      if (controlValue && typeof controlValue === 'object' && controlValue.isValid && controlValue.isValid()) {
        // Use DateFieldUtility to format the date
        const formattedDate = DateFieldValidationUtility.formatDateForUI(controlValue);
        input.value = formattedDate;
        this.effDateRawInput = formattedDate;
        control.setErrors(null);
      } else if (inputValue && !controlValue) {
        // Invalid date: restore typed text and set error
        input.value = this.effDateRawInput;
        if (!control.hasError('invalidDate')) {
          control.setErrors({ invalidDate: true });
        }
      } else if (!inputValue) {
        control.setErrors(null);
      }
    }, 0);
  }

  onTermDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const inputValue = input.value.trim();
    this.termDateRawInput = inputValue;

    const control = this.filterForm.get('termDate');
    if (!control) return;

    control.markAsDirty();
    control.markAsTouched();

    // Check if input has text but control value is null (invalid date)
    setTimeout(() => {
      if (inputValue && !control.value) {
        control.setErrors({ ...control.errors, invalidDate: true });
      }
    }, 0);
  }

  onTermDateBlur(input: HTMLInputElement): void {
    setTimeout(() => {
      const control = this.filterForm.get('termDate');
      if (!control) return;

      control.markAsTouched();

      const controlValue = control.value;
      const inputValue = input.value.trim();

      // Check if we have a valid moment object
      if (controlValue && typeof controlValue === 'object' && controlValue.isValid && controlValue.isValid()) {
        // Use DateFieldUtility to format the date
        const formattedDate = DateFieldValidationUtility.formatDateForUI(controlValue);
        input.value = formattedDate;
        this.termDateRawInput = formattedDate;
        control.setErrors(null);
      } else if (inputValue && !controlValue) {
        // Invalid date: restore typed text and set error
        input.value = this.termDateRawInput;
        if (!control.hasError('invalidDate')) {
          control.setErrors({ invalidDate: true });
        }
      } else if (!inputValue) {
        control.setErrors(null);
      }
    }, 0);
  }

  getEffDateError(): string {
    const control = this.filterForm.get('effDate');
    if (!control) return '';

    // Priority 1: Check for custom invalid date error
    if (control.hasError('invalidDate')) {
      return 'Effective Date is invalid';
    }

    // Priority 2: Check for parse errors
    if (control.hasError('matDatepickerParse')) {
      return 'Effective Date is invalid';
    }

    // Only show other errors if touched or dirty
    if (!(control.touched || control.dirty)) {
      return '';
    }

    return '';
  }

  getTermDateError(): string {
    const control = this.filterForm.get('termDate');
    if (!control) return '';

    // Priority 1: Check for custom invalid date error
    if (control.hasError('invalidDate')) {
      return 'Termination Date is invalid';
    }

    // Priority 2: Check for parse errors
    if (control.hasError('matDatepickerParse')) {
      return 'Termination Date is invalid';
    }

    // Only show other errors if touched or dirty
    if (!(control.touched || control.dirty)) {
      return '';
    }

    return '';
  }

  getEffDatePeriodError(): string {
    const periodControl = this.filterForm.get('effDatePeriod');
    if (periodControl?.hasError('required') && periodControl?.touched) {
      return 'Period is required';
    }
    return '';
  }

  getTermDatePeriodError(): string {
    const periodControl = this.filterForm.get('termDatePeriod');
    if (periodControl?.hasError('required') && periodControl?.touched) {
      return 'Period is required';
    }
    return '';
  }
}
