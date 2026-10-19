import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  ChangeDetectionStrategy,
  Input,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import moment from 'moment';

import { DriveCategoryRuleFilterValue } from '../../models/drive-category-rules.model';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { CustomDateAdapter, DD_MMM_YYYY_FORMAT, dateFormatValidator } from 'src/app/core/utils/date-adapter.util';

@Component({
  selector: 'app-drive-category-rule-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatInputModule
  ],
  providers: [
    { provide: DateAdapter, useClass: CustomDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MMM_YYYY_FORMAT }
  ],
  templateUrl: './filter-panel.html',
  styleUrls: ['./filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DriveCategoryRuleFilterPanel implements OnInit {
  @Input() currentFilters: DriveCategoryRuleFilterValue | null = null;
  @Output() apply = new EventEmitter<DriveCategoryRuleFilterValue>();
  @Output() close = new EventEmitter<void>();

  filterForm!: FormGroup;

  periodOptions: Array<{ value: string; label: string }> = [
    { value: 'Before', label: 'Before' },
    { value: 'After', label: 'After' }
  ];

  // Store raw input text to preserve invalid dates
  private effectiveDateRawInput = '';
  private terminationDateRawInput = '';

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      showTerminated: [this.currentFilters?.showTerminated ?? false],
      effectiveDatePeriod: [this.currentFilters?.effectiveDatePeriod ?? null],
      effectiveDateValue: [
        this.currentFilters?.effectiveDateValue ? new Date(this.currentFilters.effectiveDateValue) : null,
        [dateFormatValidator()]
      ],
      terminationDatePeriod: [this.currentFilters?.terminationDatePeriod ?? null],
      terminationDateValue: [
        this.currentFilters?.terminationDateValue ? new Date(this.currentFilters.terminationDateValue) : null,
        [dateFormatValidator()]
      ]
    });

    // Setup validation listeners for effective date
    this.filterForm.get('effectiveDateValue')?.valueChanges.subscribe(() => {
      this.filterForm.get('effectiveDatePeriod')?.markAsTouched();
      this.cdr.markForCheck();
    });

    this.filterForm.get('effectiveDatePeriod')?.valueChanges.subscribe(() => {
      this.cdr.markForCheck();
    });

    // Setup validation listeners for termination date
    this.filterForm.get('terminationDateValue')?.valueChanges.subscribe(() => {
      this.filterForm.get('terminationDatePeriod')?.markAsTouched();
      this.cdr.markForCheck();
    });

    this.filterForm.get('terminationDatePeriod')?.valueChanges.subscribe(() => {
      this.cdr.markForCheck();
    });
  }

  get effDatePeriodRequired(): boolean {
    const dateControl = this.filterForm?.get('effectiveDateValue');
    const dateValue = dateControl?.value;
    const periodValue = this.filterForm?.get('effectiveDatePeriod')?.value;
    const hasValidDate = dateValue && (
      (moment.isMoment(dateValue) && dateValue.isValid()) ||
      (dateValue instanceof Date && !isNaN(dateValue.getTime()))
    );
    return !!hasValidDate && !periodValue;
  }

  get termDatePeriodRequired(): boolean {
    const dateControl = this.filterForm?.get('terminationDateValue');
    const dateValue = dateControl?.value;
    const periodValue = this.filterForm?.get('terminationDatePeriod')?.value;
    const hasValidDate = dateValue && (
      (moment.isMoment(dateValue) && dateValue.isValid()) ||
      (dateValue instanceof Date && !isNaN(dateValue.getTime()))
    );
    return !!hasValidDate && !periodValue;
  }

  get isApplyDisabled(): boolean {
    // Disable if period validation errors
    if (this.effDatePeriodRequired || this.termDatePeriodRequired) return true;

    // Disable if date format validation errors
    if (this.filterForm?.get('effectiveDateValue')?.hasError('invalidDateFormat') ||
        this.filterForm?.get('effectiveDateValue')?.hasError('matDatepickerParse') ||
        this.filterForm?.get('terminationDateValue')?.hasError('invalidDateFormat') ||
        this.filterForm?.get('terminationDateValue')?.hasError('matDatepickerParse')) {
      return true;
    }

    // Disable if no filter is applied
    const val = this.filterForm?.value;
    const hasShowTerminated = val?.showTerminated === true;
    const hasEffDate = val?.effectiveDatePeriod || val?.effectiveDateValue;
    const hasTermDate = val?.terminationDatePeriod || val?.terminationDateValue;

    return !(hasShowTerminated || hasEffDate || hasTermDate);
  }

  onEffDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.effectiveDateRawInput = input.value;
    const control = this.filterForm.get('effectiveDateValue');
    if (control && !control.touched) {
      control.markAsTouched();
      this.cdr.markForCheck();
    }
  }

  onEffDateBlur(input: HTMLInputElement): void {
    setTimeout(() => {
      const control = this.filterForm.get('effectiveDateValue');
      if (this.effectiveDateRawInput) {
        if (!control?.value) {
          input.value = this.effectiveDateRawInput;
        } else {
          const formattedValue = this.formatDateToDisplay(control.value);
          if (formattedValue !== this.effectiveDateRawInput) {
            input.value = this.effectiveDateRawInput;
            control.setValue(null, { emitEvent: false });
            control.markAsTouched();
            control.setErrors({ invalidDateFormat: true });
            this.cdr.markForCheck();
          }
        }
      }
    }, 0);
  }

  onTermDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.terminationDateRawInput = input.value;
    const control = this.filterForm.get('terminationDateValue');
    if (control && !control.touched) {
      control.markAsTouched();
      this.cdr.markForCheck();
    }
  }

  onTermDateBlur(input: HTMLInputElement): void {
    setTimeout(() => {
      const control = this.filterForm.get('terminationDateValue');
      if (this.terminationDateRawInput) {
        if (!control?.value) {
          input.value = this.terminationDateRawInput;
        } else {
          const formattedValue = this.formatDateToDisplay(control.value);
          if (formattedValue !== this.terminationDateRawInput) {
            input.value = this.terminationDateRawInput;
            control.setValue(null, { emitEvent: false });
            control.markAsTouched();
            control.setErrors({ invalidDateFormat: true });
            this.cdr.markForCheck();
          }
        }
      }
    }, 0);
  }

  private formatDateToDisplay(date: Date | null): string {
    if (!date) return '';
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const day = String(date.getDate()).padStart(2, '0');
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  onApply(): void {
    if (this.effDatePeriodRequired || this.termDatePeriodRequired) {
      this.filterForm.get('effectiveDatePeriod')?.markAsTouched();
      this.filterForm.get('terminationDatePeriod')?.markAsTouched();
      this.cdr.markForCheck();
      return;
    }

    const formValue = this.filterForm.value;

    // Serialize dates to YYYY-MM-DD format for API
    const effectiveDateValue = formValue.effectiveDateValue
      ? DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDateValue)
      : null;

    const terminationDateValue = formValue.terminationDateValue
      ? DateFieldValidationUtility.serializeDateForApi(formValue.terminationDateValue)
      : null;

    const filters: DriveCategoryRuleFilterValue = {
      showTerminated: formValue.showTerminated || false,
      effectiveDatePeriod: effectiveDateValue ? formValue.effectiveDatePeriod : null,
      effectiveDateValue: effectiveDateValue,
      terminationDatePeriod: terminationDateValue ? formValue.terminationDatePeriod : null,
      terminationDateValue: terminationDateValue
    };

    this.apply.emit(filters);
  }

  onClear(): void {
    this.filterForm.reset({
      showTerminated: false,
      effectiveDatePeriod: null,
      effectiveDateValue: null,
      terminationDatePeriod: null,
      terminationDateValue: null
    });

    this.cdr.markForCheck();
  }

  onClose(): void {
    this.close.emit();
  }
}
