import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  FormsModule
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MAT_MOMENT_DATE_ADAPTER_OPTIONS } from '@angular/material-moment-adapter';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { HeaderService } from '@shared/services/header.service';

export interface UserAccountFilter {
  effectiveDatePeriod: 'AFTER' | 'BEFORE';
  effectiveDate: Date | null;
  terminationDatePeriod: 'AFTER' | 'BEFORE';
  terminationDate: Date | null;
  accountStatus: string | null;
}

@Component({
  selector: 'app-user-account-filter',
  standalone: true,
  templateUrl: './user-account-filter.html',
  styleUrls: ['./user-account-filter.scss'],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'en-US' },
    {
      provide: DateAdapter,
      useClass: ChapterAwareDateAdapter,
      deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS]
    },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: MAT_MOMENT_DATE_ADAPTER_OPTIONS, useValue: { useUtc: true } }
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ]
})
export class UserAccountFilterComponent implements OnInit {
  filterForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<UserAccountFilterComponent>,
    @Inject(MAT_DIALOG_DATA) public data: UserAccountFilter | null,
    private dateAdapter: DateAdapter<any>
  ) {
    this.filterForm = this.fb.group({
      effectiveDatePeriod: [null],
      effectiveDate: [null],
      terminationDatePeriod: [null],
      terminationDate: [null],
      accountStatus: [null]
    });
  }

  ngOnInit(): void {
    // Set date locale - ChapterAwareDateAdapter automatically uses chapter timezone
    this.dateAdapter.setLocale('en-US');

    if (this.data) {
      this.filterForm.patchValue(this.data);
    }

    // Add immediate validation on date changes
    this.filterForm.get('effectiveDate')?.valueChanges.subscribe(() => {
      setTimeout(() => {
        this.validatePeriodForDate('effectiveDatePeriod', 'effectiveDate');
      }, 0);
    });

    this.filterForm.get('terminationDate')?.valueChanges.subscribe(() => {
      setTimeout(() => {
        this.validatePeriodForDate('terminationDatePeriod', 'terminationDate');
      }, 0);
    });

    // Clear errors when period is selected
    this.filterForm.get('effectiveDatePeriod')?.valueChanges.subscribe(() => {
      this.validatePeriodForDate('effectiveDatePeriod', 'effectiveDate');
    });

    this.filterForm.get('terminationDatePeriod')?.valueChanges.subscribe(() => {
      this.validatePeriodForDate('terminationDatePeriod', 'terminationDate');
    });
  }

  get effectiveDateControl() {
    return this.filterForm.get('effectiveDate');
  }

  get terminationDateControl() {
    return this.filterForm.get('terminationDate');
  }

  get effectiveDatePeriodControl() {
    return this.filterForm.get('effectiveDatePeriod');
  }

  get terminationDatePeriodControl() {
    return this.filterForm.get('terminationDatePeriod');
  }

  private validatePeriodForDate(periodField: string, dateField: string): void {
    const dateControl = this.filterForm.get(dateField);
    const periodControl = this.filterForm.get(periodField);

    if (dateControl?.value && !periodControl?.value) {
      periodControl?.setErrors({ required: true });
      periodControl?.markAsTouched();
    } else if (!dateControl?.value && periodControl?.hasError('required')) {
      periodControl?.setErrors(null);
    }
  }

  get hasEffectiveDateError(): boolean {
    const control = this.effectiveDateControl;
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  get hasTerminationDateError(): boolean {
    const control = this.terminationDateControl;
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  get hasEffectiveDatePeriodError(): boolean {
    const control = this.effectiveDatePeriodControl;
    return !!(control && control.invalid && control.touched);
  }

  get hasTerminationDatePeriodError(): boolean {
    const control = this.terminationDatePeriodControl;
    return !!(control && control.invalid && control.touched);
  }

  getEffectiveDateErrorMessage(): string {
    return DateFieldValidationUtility.getStartDateCrossFieldError(
      this.effectiveDateControl,
      'Effective Date',
      'Termination Date',
      this.filterForm.errors
    );
  }

  getTerminationDateErrorMessage(): string {
    return DateFieldValidationUtility.getEndDateCrossFieldError(
      this.terminationDateControl,
      'Termination Date',
      'Effective Date',
      this.filterForm.errors
    );
  }

  /**
   * Handle effective date input using DateFieldUtility
   */
  onEffectiveDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    DateFieldValidationUtility.handleStartDateInput(
      input.value,
      this.filterForm.get('effectiveDate')
    );
  }

  /**
   * Handle effective date blur using DateFieldUtility
   */
  onEffectiveDateBlur(): void {
    const control = this.filterForm.get('effectiveDate');
    if (control) {
      control.markAsTouched();
    }
  }

  /**
   * Handle termination date input using DateFieldUtility
   */
  onTerminationDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    DateFieldValidationUtility.handleEndDateInput(
      input.value,
      this.filterForm.get('terminationDate'),
      false // Not in edit mode
    );
  }

  /**
   * Handle termination date blur using DateFieldUtility
   */
  onTerminationDateBlur(): void {
    const control = this.filterForm.get('terminationDate');
    if (control) {
      control.markAsTouched();
    }
  }

  get isApplyDisabled(): boolean {
    // Check if there are validation errors
    if (this.filterForm.invalid) {
      return true;
    }

    // Check if at least one complete filter is provided
    const values = this.filterForm.value;

    // Effective date filter is complete if BOTH period and date are provided
    const hasCompleteEffectiveDate = values.effectiveDatePeriod && values.effectiveDate;

    // Termination date filter is complete if BOTH period and date are provided
    const hasCompleteTerminationDate = values.terminationDatePeriod && values.terminationDate;

    // Account status is complete if selected
    const hasAccountStatus = values.accountStatus !== null && values.accountStatus !== undefined;

    // Also check if user has ONLY period selected (incomplete filter)
    const hasOnlyEffectiveDatePeriod = values.effectiveDatePeriod && !values.effectiveDate;
    const hasOnlyTerminationDatePeriod = values.terminationDatePeriod && !values.terminationDate;

    // Disable if only incomplete filters (period without date)
    if ((hasOnlyEffectiveDatePeriod || hasOnlyTerminationDatePeriod) && !hasAccountStatus) {
      return true;
    }

    // At least one complete filter must be provided
    return !(hasCompleteEffectiveDate || hasCompleteTerminationDate || hasAccountStatus);
  }

  onApply(): void {
    // Validate period fields
    this.validatePeriodForDate('effectiveDatePeriod', 'effectiveDate');
    this.validatePeriodForDate('terminationDatePeriod', 'terminationDate');

    // Mark all as touched to show errors
    this.filterForm.markAllAsTouched();

    // Don't submit if form is invalid
    if (this.filterForm.invalid) {
      return;
    }

    this.dialogRef.close(this.filterForm.value);
  }

  onClear(): void {
    this.filterForm.reset({
      effectiveDatePeriod: null,
      effectiveDate: null,
      terminationDatePeriod: null,
      terminationDate: null,
      accountStatus: null
    });
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}
