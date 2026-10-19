import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  ChangeDetectionStrategy,
  Input,
  ChangeDetectorRef,
  OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { Subject, takeUntil } from 'rxjs';
import { Moment } from 'moment';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { A11yModule } from '@angular/cdk/a11y';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';

export interface InternalContractFilterValue {
  effectivePeriod?: 'Before' | 'After';
  effectiveDate?: Moment | null;
  terminationPeriod?: 'Before' | 'After';
  terminationDate?: Moment | null;
}

@Component({
  selector: 'app-internal-contract-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatInputModule,
    A11yModule
  ],
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }
  ],
  templateUrl: './internal-contract-filter-panel.component.html',
  styleUrls: ['./internal-contract-filter-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InternalContractFilterPanelComponent implements OnInit, OnDestroy {
  @Input() currentFilters: InternalContractFilterValue | null = null;
  @Output() apply = new EventEmitter<InternalContractFilterValue>();
  @Output() close = new EventEmitter<void>();

  filterForm!: FormGroup;

  effectiveDatePeriodError = '';
  terminationDatePeriodError = '';
  effectiveDateInvalidError = '';
  terminationDateInvalidError = '';

  // Store raw input text to preserve invalid dates
  private effectiveDateRawInput = '';
  private terminationDateRawInput = '';

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private dateAdapter: DateAdapter<Moment>
  ) { }

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      effectivePeriod: [this.currentFilters?.effectivePeriod || null],
      effectiveDate: [this.currentFilters?.effectiveDate || null],
      terminationPeriod: [this.currentFilters?.terminationPeriod || null],
      terminationDate: [this.currentFilters?.terminationDate || null]
    });

    this.setupPeriodValidation();

    // Run initial validation if data was provided
    if (this.currentFilters) {
      this.validateEffectiveDatePeriod();
      this.validateTerminationDatePeriod();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupPeriodValidation(): void {
    // Validate effectivePeriod when effectiveDate changes
    this.filterForm.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const control = this.filterForm.get('effectiveDate');
        if (control && !control.touched) {
          control.markAsTouched();
        }
        this.validateEffectiveDatePeriod();
        this.cdr.markForCheck();
      });

    // Validate terminationPeriod when terminationDate changes
    this.filterForm.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const control = this.filterForm.get('terminationDate');
        if (control && !control.touched) {
          control.markAsTouched();
        }
        this.validateTerminationDatePeriod();
        this.cdr.markForCheck();
      });

    // Validate when period values change
    this.filterForm.get('effectivePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateEffectiveDatePeriod();
        this.cdr.markForCheck();
      });

    this.filterForm.get('terminationPeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateTerminationDatePeriod();
        this.cdr.markForCheck();
      });
  }

  private validateEffectiveDatePeriod(): void {
    const date = this.filterForm.get('effectiveDate')?.value;
    const period = this.filterForm.get('effectivePeriod')?.value;

    if (date && !period) {
      this.effectiveDatePeriodError = 'Period is required when date is selected';
    } else {
      this.effectiveDatePeriodError = '';
    }
  }

  private validateTerminationDatePeriod(): void {
    const date = this.filterForm.get('terminationDate')?.value;
    const period = this.filterForm.get('terminationPeriod')?.value;

    if (date && !period) {
      this.terminationDatePeriodError = 'Period is required when date is selected';
    } else {
      this.terminationDatePeriodError = '';
    }
  }


  onEffectiveDateInput(event: Event): void {
    const inputValue = (event.target as HTMLInputElement).value;
    this.effectiveDateRawInput = inputValue;
    const control = this.filterForm.get('effectiveDate');
    if (!control) return;

    if (!inputValue?.trim()) {
      this.effectiveDateInvalidError = '';
      control.setValue(null, { emitEvent: false });
      control.setErrors(null);
      control.markAsPristine();
      control.markAsUntouched();
      control.updateValueAndValidity();
    } else {
      control.markAsTouched();
      control.markAsDirty();
      if (!control.value) {
        control.setErrors({ invalidDate: true });
        this.effectiveDateInvalidError = 'Effective date is invalid';
      } else {
        this.effectiveDateInvalidError = '';
      }
    }
    this.cdr.markForCheck();
  }

  onTerminationDateInput(event: Event): void {
    const inputValue = (event.target as HTMLInputElement).value;
    this.terminationDateRawInput = inputValue;
    const control = this.filterForm.get('terminationDate');
    if (!control) return;

    if (!inputValue?.trim()) {
      this.terminationDateInvalidError = '';
      control.setValue(null, { emitEvent: false });
      control.setErrors(null);
      control.markAsPristine();
      control.markAsUntouched();
      control.updateValueAndValidity();
    } else {
      control.markAsTouched();
      control.markAsDirty();
      if (!control.value) {
        control.setErrors({ invalidDate: true });
        this.terminationDateInvalidError = 'Termination date is invalid';
      } else {
        this.terminationDateInvalidError = '';
      }
    }
    this.cdr.markForCheck();
  }

  onEffectiveDateBlur(event: FocusEvent): void {
    const input = event.target as HTMLInputElement;
    this.effectiveDateRawInput = input.value;

    const control = this.filterForm.get('effectiveDate');
    if (input.value?.trim() && !control?.value) {
      this.effectiveDateInvalidError = 'Effective date is invalid';
      control?.setErrors({ invalidDate: true });
    } else if (!input.value?.trim()) {
      this.effectiveDateInvalidError = '';
    }

    if (control?.invalid && this.effectiveDateRawInput) {
      input.value = this.effectiveDateRawInput;
    }
    this.cdr.markForCheck();
  }

  onTerminationDateBlur(event: FocusEvent): void {
    const input = event.target as HTMLInputElement;
    this.terminationDateRawInput = input.value;

    const control = this.filterForm.get('terminationDate');
    if (input.value?.trim() && !control?.value) {
      this.terminationDateInvalidError = 'Termination date is invalid';
      control?.setErrors({ invalidDate: true });
    } else if (!input.value?.trim()) {
      this.terminationDateInvalidError = '';
    }

    if (control?.invalid && this.terminationDateRawInput) {
      input.value = this.terminationDateRawInput;
    }
    this.cdr.markForCheck();
  }

  isApplyDisabled(): boolean {
    // Check for validation errors
    if (this.effectiveDatePeriodError !== '' || this.terminationDatePeriodError !== '') {
      return true;
    }

    // Check for invalid date errors
    if (this.effectiveDateInvalidError !== '' || this.terminationDateInvalidError !== '') {
      return true;
    }

    // Check if at least one filter field has data
    const hasEffectiveDate = this.filterForm.value.effectivePeriod && this.filterForm.value.effectiveDate;
    const hasTerminationDate = this.filterForm.value.terminationPeriod && this.filterForm.value.terminationDate;

    // Disable if no filters are applied
    return !hasEffectiveDate && !hasTerminationDate;
  }

  onApply(): void {
    if (this.isApplyDisabled()) {
      return;
    }

    const filters: InternalContractFilterValue = {
      effectivePeriod: this.filterForm.value.effectivePeriod || undefined,
      effectiveDate: this.filterForm.value.effectiveDate || undefined,
      terminationPeriod: this.filterForm.value.terminationPeriod || undefined,
      terminationDate: this.filterForm.value.terminationDate || undefined
    };

    this.apply.emit(filters);
  }

  onClearAll(): void {
    this.filterForm.reset();
    this.effectiveDatePeriodError = '';
    this.terminationDatePeriodError = '';
    this.effectiveDateInvalidError = '';
    this.terminationDateInvalidError = '';
    this.cdr.markForCheck();
  }

  onClose(): void {
    this.close.emit();
  }
}
