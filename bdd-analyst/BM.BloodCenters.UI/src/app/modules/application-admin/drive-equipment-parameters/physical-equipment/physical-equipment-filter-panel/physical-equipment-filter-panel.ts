import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DATE_FORMATS, DateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { PhysicalEquipmentFilterParams } from '../../models/drive-equipment-parameters.model';
import { dateFormatValidator } from 'src/app/core/utils/date-adapter.util';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';

@Component({
  selector: 'app-physical-equipment-filter-panel',
  standalone: true,
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatSelectModule, MatIconModule, MatDatepickerModule, MatMomentDateModule, MatInputModule, MatButtonModule],
  templateUrl: './physical-equipment-filter-panel.html',
  styleUrls: ['./physical-equipment-filter-panel.scss']
})
export class PhysicalEquipmentFilterPanel implements OnInit {
  @Input() currentFilters: PhysicalEquipmentFilterParams = {};
  @Output() apply = new EventEmitter<PhysicalEquipmentFilterParams>();
  @Output() close = new EventEmitter<void>();

  form!: FormGroup;
  private formChanged = false;

  effectiveDatePeriodError = '';
  terminationDatePeriodError = '';

  private effectiveDateRawInput = '';
  private terminationDateRawInput = '';

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      effDatePeriod: [this.determinePeriod(this.currentFilters.effDateFrom, this.currentFilters.effDateTo)],
      effDate: [this.determineDate(this.currentFilters.effDateFrom, this.currentFilters.effDateTo), [dateFormatValidator()]],
      termDatePeriod: [this.determinePeriod(this.currentFilters.termDateFrom, this.currentFilters.termDateTo)],
      termDate: [this.determineDate(this.currentFilters.termDateFrom, this.currentFilters.termDateTo), [dateFormatValidator()]]
    });

    this.form.get('effDatePeriod')?.valueChanges.subscribe(() => {
      this.formChanged = true;
      this.validateEffectiveDatePeriod();
    });

    this.form.get('termDatePeriod')?.valueChanges.subscribe(() => {
      this.formChanged = true;
      this.validateTerminationDatePeriod();
    });

    this.form.get('effDate')?.valueChanges.subscribe(() => {
      this.formChanged = true;
      const control = this.form.get('effDate');
      if (control && !control.touched) {
        control.markAsTouched();
      }
      this.validateEffectiveDatePeriod();
    });

    this.form.get('termDate')?.valueChanges.subscribe(() => {
      this.formChanged = true;
      const control = this.form.get('termDate');
      if (control && !control.touched) {
        control.markAsTouched();
      }
      this.validateTerminationDatePeriod();
    });

    if (this.currentFilters && Object.keys(this.currentFilters).length > 0) {
      this.validateEffectiveDatePeriod();
      this.validateTerminationDatePeriod();
    }
  }

  private validateEffectiveDatePeriod(): void {
    const effDate = this.form.get('effDate')?.value;
    const effDatePeriod = this.form.get('effDatePeriod')?.value;
    const control = this.form.get('effDatePeriod');

    if (effDate && !effDatePeriod) {
      control?.setErrors({ required: true });
      control?.markAsTouched();
      this.effectiveDatePeriodError = 'Period is required';
    } else {
      control?.setErrors(null);
      this.effectiveDatePeriodError = '';
    }
  }

  private validateTerminationDatePeriod(): void {
    const termDate = this.form.get('termDate')?.value;
    const termDatePeriod = this.form.get('termDatePeriod')?.value;
    const control = this.form.get('termDatePeriod');

    if (termDate && !termDatePeriod) {
      control?.setErrors({ required: true });
      control?.markAsTouched();
      this.terminationDatePeriodError = 'Period is required';
    } else {
      control?.setErrors(null);
      this.terminationDatePeriodError = '';
    }
  }

  get isApplyDisabled(): boolean {
    const formValue = this.form.value;

    const effDateControl = this.form.get('effDate');
    const termDateControl = this.form.get('termDate');
    const hasDateFormatErrors = !!(
      effDateControl?.hasError('invalidDateFormat') ||
      effDateControl?.hasError('matDatepickerParse') ||
      effDateControl?.hasError('invalidDate') ||
      termDateControl?.hasError('invalidDateFormat') ||
      termDateControl?.hasError('matDatepickerParse') ||
      termDateControl?.hasError('invalidDate')
    );

    if (hasDateFormatErrors) return true;

    const effIncomplete = formValue.effDatePeriod !== null && !formValue.effDate;
    const termIncomplete = formValue.termDatePeriod !== null && !formValue.termDate;

    const hasEffDate = formValue.effDate !== null;
    const hasTermDate = formValue.termDate !== null;
    const hasAnyDate = hasEffDate || hasTermDate;

    if (!hasAnyDate || effIncomplete || termIncomplete || this.hasValidationErrors) {
      return true;
    }

    return !this.formChanged;
  }

  get hasValidationErrors(): boolean {
    return !!(
      this.form.get('effDatePeriod')?.invalid ||
      this.form.get('termDatePeriod')?.invalid
    );
  }

  onApply(): void {
    if (this.isApplyDisabled) return;

    const raw = this.form.value;
    const filters: PhysicalEquipmentFilterParams = {};

    if (raw.effDate && raw.effDatePeriod) {
      if (raw.effDatePeriod === 'AFTER') {
        filters.effDateFrom = DateFieldValidationUtility.serializeDateForApi(raw.effDate) || undefined;
      } else if (raw.effDatePeriod === 'BEFORE') {
        filters.effDateTo = DateFieldValidationUtility.serializeDateForApi(raw.effDate) || undefined;
      }
    }

    if (raw.termDate && raw.termDatePeriod) {
      if (raw.termDatePeriod === 'AFTER') {
        filters.termDateFrom = DateFieldValidationUtility.serializeDateForApi(raw.termDate) || undefined;
      } else if (raw.termDatePeriod === 'BEFORE') {
        filters.termDateTo = DateFieldValidationUtility.serializeDateForApi(raw.termDate) || undefined;
      }
    }

    this.apply.emit(filters);
  }

  onClearAll(): void {
    this.form.reset({
      effDatePeriod: null,
      effDate: null,
      termDatePeriod: null,
      termDate: null
    });
    this.effectiveDatePeriodError = '';
    this.terminationDatePeriodError = '';
    this.effectiveDateRawInput = '';
    this.terminationDateRawInput = '';
    this.form.get('effDatePeriod')?.setErrors(null);
    this.form.get('termDatePeriod')?.setErrors(null);
  }

  onClose(): void { this.close.emit(); }

  onEffectiveDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.effectiveDateRawInput = input.value;
    const control = this.form.get('effDate');
    if (input.value?.trim()) {
      control?.markAsTouched();
      control?.markAsDirty();
      if (!control?.value) {
        control?.setErrors({ invalidDate: true });
      }
    }
  }

  onEffectiveDateBlur(input: HTMLInputElement): void {
    setTimeout(() => {
      const control = this.form.get('effDate');
      if (!control?.value && this.effectiveDateRawInput && !input.value) {
        input.value = this.effectiveDateRawInput;
      }
    }, 0);
  }

  onTerminationDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.terminationDateRawInput = input.value;
    const control = this.form.get('termDate');
    if (input.value?.trim()) {
      control?.markAsTouched();
      control?.markAsDirty();
      if (!control?.value) {
        control?.setErrors({ invalidDate: true });
      }
    }
  }

  onTerminationDateBlur(input: HTMLInputElement): void {
    setTimeout(() => {
      const control = this.form.get('termDate');
      if (!control?.value && this.terminationDateRawInput && !input.value) {
        input.value = this.terminationDateRawInput;
      }
    }, 0);
  }

  private determinePeriod(fromDate?: string, toDate?: string): string | null {
    if (fromDate) return 'AFTER';
    if (toDate) return 'BEFORE';
    return null;
  }

  private determineDate(fromDate?: string, toDate?: string): Date | null {
    if (fromDate) return new Date(fromDate);
    if (toDate) return new Date(toDate);
    return null;
  }
}
