import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Input,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { dateFormatValidator } from 'src/app/core/utils/date-adapter.util';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { Subject } from 'rxjs';

import { SpecialProcessingFilterValue } from '../models/special-processing-master-codes.model';

@Component({
  selector: 'app-special-processing-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatInputModule,
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
  ],
  templateUrl: './special-processing-filter-panel.html',
  styleUrls: ['./special-processing-filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpecialProcessingFilterPanel implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  @Input() currentFilters: SpecialProcessingFilterValue | null = null;
  @Output() apply = new EventEmitter<SpecialProcessingFilterValue>();
  @Output() close = new EventEmitter<void>();

  filterForm!: FormGroup;

  periodOptions = [
    { value: 'after', display: 'After' },
    { value: 'before', display: 'Before' },
  ];

  effectivePeriodRequired = false;
  terminationPeriodRequired = false;
  effectiveDateRequired = false;
  terminationDateRequired = false;

  private effectiveDateRawInput = '';
  private terminationDateRawInput = '';

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      effDatePeriod: [this.currentFilters?.effDatePeriod || null],
      effDate: [this.currentFilters?.effDate ? new Date(this.currentFilters.effDate) : null, [dateFormatValidator()]],
      termDatePeriod: [this.currentFilters?.termDatePeriod || null],
      termDate: [this.currentFilters?.termDate ? new Date(this.currentFilters.termDate) : null, [dateFormatValidator()]],
    });

    this.filterForm.get('effDate')?.valueChanges.subscribe(() => {
      const control = this.filterForm.get('effDate');
      if (control && !control.touched) {
        control.markAsTouched();
      }
      setTimeout(() => {
        this.validateEffectivePeriod();
        this.cdr.markForCheck();
      }, 0);
    });

    this.filterForm.get('termDate')?.valueChanges.subscribe(() => {
      const control = this.filterForm.get('termDate');
      if (control && !control.touched) {
        control.markAsTouched();
      }
      setTimeout(() => {
        this.validateTerminationPeriod();
        this.cdr.markForCheck();
      }, 0);
    });

    this.filterForm.get('effDatePeriod')?.valueChanges.subscribe(() => {
      this.validateEffectivePeriod();
      this.cdr.markForCheck();
    });

    this.filterForm.get('termDatePeriod')?.valueChanges.subscribe(() => {
      this.validateTerminationPeriod();
      this.cdr.markForCheck();
    });
  }

  validateEffectivePeriod(): void {
    const date = this.filterForm.get('effDate')?.value;
    const period = this.filterForm.get('effDatePeriod')?.value;
    this.effectivePeriodRequired = !!date && !period;
    this.effectiveDateRequired = !!period && !date;
  }

  validateTerminationPeriod(): void {
    const date = this.filterForm.get('termDate')?.value;
    const period = this.filterForm.get('termDatePeriod')?.value;
    this.terminationPeriodRequired = !!date && !period;
    this.terminationDateRequired = !!period && !date;
  }

  get isApplyDisabled(): boolean {
    if (this.effectivePeriodRequired || this.terminationPeriodRequired ||
        this.effectiveDateRequired || this.terminationDateRequired) {
      return true;
    }

    const effDateControl = this.filterForm.get('effDate');
    const termDateControl = this.filterForm.get('termDate');
    if (effDateControl?.hasError('invalidDateFormat') ||
        effDateControl?.hasError('matDatepickerParse') ||
        termDateControl?.hasError('invalidDateFormat') ||
        termDateControl?.hasError('matDatepickerParse')) {
      return true;
    }

    const values = this.filterForm.value;
    const hasEffDate = values?.effDatePeriod && values?.effDate;
    const hasTermDate = values?.termDatePeriod && values?.termDate;

    return !(hasEffDate || hasTermDate);
  }

  onEffectiveDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.effectiveDateRawInput = input.value;
    setTimeout(() => {
      const control = this.filterForm.get('effDate');
      if (control && !control.value && input.value.trim()) {
        control.setErrors({ invalidDateFormat: true });
        control.markAsTouched();
        this.cdr.markForCheck();
      }
    }, 0);
  }

  onEffectiveDateBlur(input: HTMLInputElement): void {
    setTimeout(() => {
      const control = this.filterForm.get('effDate');
      if (!control?.value && this.effectiveDateRawInput && !input.value) {
        input.value = this.effectiveDateRawInput;
      }
    }, 0);
  }

  onTerminationDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.terminationDateRawInput = input.value;
    setTimeout(() => {
      const control = this.filterForm.get('termDate');
      if (control && !control.value && input.value.trim()) {
        control.setErrors({ invalidDateFormat: true });
        control.markAsTouched();
        this.cdr.markForCheck();
      }
    }, 0);
  }

  onTerminationDateBlur(input: HTMLInputElement): void {
    setTimeout(() => {
      const control = this.filterForm.get('termDate');
      if (!control?.value && this.terminationDateRawInput && !input.value) {
        input.value = this.terminationDateRawInput;
      }
    }, 0);
  }

  onApply(): void {
    const formValue = this.filterForm.value;

    const filters: SpecialProcessingFilterValue = {
      effDatePeriod: formValue.effDatePeriod || undefined,
      effDate: formValue.effDate ? DateFieldValidationUtility.serializeDateForApi(formValue.effDate) || undefined : undefined,
      termDatePeriod: formValue.termDatePeriod || undefined,
      termDate: formValue.termDate ? DateFieldValidationUtility.serializeDateForApi(formValue.termDate) || undefined : undefined,
    };

    this.apply.emit(filters);
  }

  onClear(): void {
    this.filterForm.reset({
      effDatePeriod: null,
      effDate: null,
      termDatePeriod: null,
      termDate: null,
    });
    this.effectiveDateRawInput = '';
    this.terminationDateRawInput = '';
    this.effectivePeriodRequired = false;
    this.terminationPeriodRequired = false;
    this.effectiveDateRequired = false;
    this.terminationDateRequired = false;
  }

  onClose(): void {
    this.close.emit();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
