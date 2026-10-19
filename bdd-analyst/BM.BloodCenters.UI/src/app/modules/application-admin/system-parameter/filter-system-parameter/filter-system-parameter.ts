import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  Input,
  ChangeDetectorRef,
  signal,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import moment from 'moment';

import { SystemParameterFilterFormValue, ParameterOption } from '../interfaces/view-system-parameter.interface';
import { dateFormatValidator } from 'src/app/core/utils/date-adapter.util';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';

@Component({
  selector: 'app-filter-system-parameter',
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
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './filter-system-parameter.html',
  styleUrls: ['./filter-system-parameter.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FilterSystemParameter implements OnInit, OnDestroy {
  @Input() currentFilters: SystemParameterFilterFormValue | null = null;
  @Input() parameterOptions: ParameterOption[] = [];
  @Output() apply = new EventEmitter<SystemParameterFilterFormValue>();
  @Output() close = new EventEmitter<void>();

  filterForm!: FormGroup;
  private formChanged = false;

  parameterSearchCtrl = new FormControl('');
  parameterOptionsSignal = signal<ParameterOption[]>([]);

  filteredParameterOptions = computed(() => {
    const search = this.parameterSearchText().toLowerCase();
    const options = this.parameterOptionsSignal();
    if (!search) return options;
    return options.filter(o =>
      (o.parameterCode || '').toLowerCase().includes(search) ||
      (o.description || '').toLowerCase().includes(search)
    );
  });

  private parameterSearchText = signal('');

  effectiveDatePeriodError = '';
  terminationDatePeriodError = '';

  // Store raw input text to preserve invalid dates
  private effectiveDateRawInput = '';
  private terminationDateRawInput = '';

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.parameterOptionsSignal.set(this.parameterOptions);

    this.filterForm = this.fb.group({
      parameter: [this.currentFilters?.parameter || null],
      effectiveDatePeriod: [this.currentFilters?.effectivePeriod || null],
      effectiveDate: [
        this.currentFilters?.effectiveDate ? this.parseDateStringAsLocal(this.currentFilters.effectiveDate) : null,
        [dateFormatValidator()]
      ],
      terminationDatePeriod: [this.currentFilters?.terminationPeriod || null],
      terminationDate: [
        this.currentFilters?.terminationDate ? this.parseDateStringAsLocal(this.currentFilters.terminationDate) : null,
        [dateFormatValidator()]
      ]
    });

    this.parameterSearchCtrl.valueChanges.subscribe(value => {
      this.parameterSearchText.set(value || '');
    });

    this.filterForm.get('parameter')?.valueChanges.subscribe(() => {
      this.formChanged = true;
      this.cdr.markForCheck();
    });

    // Add immediate validation on date changes
    this.filterForm.get('effectiveDate')?.valueChanges.subscribe(() => {
      this.formChanged = true;
      const control = this.filterForm.get('effectiveDate');
      if (control && !control.touched) {
        control.markAsTouched();
      }
      setTimeout(() => {
        this.validateEffectiveDatePeriod();
        this.cdr.markForCheck();
      }, 0);
    });

    this.filterForm.get('terminationDate')?.valueChanges.subscribe(() => {
      this.formChanged = true;
      const control = this.filterForm.get('terminationDate');
      if (control && !control.touched) {
        control.markAsTouched();
      }
      setTimeout(() => {
        this.validateTerminationDatePeriod();
        this.cdr.markForCheck();
      }, 0);
    });

    // Clear errors when period is selected
    this.filterForm.get('effectiveDatePeriod')?.valueChanges.subscribe(() => {
      this.formChanged = true;
      this.validateEffectiveDatePeriod();
      this.cdr.markForCheck();
    });

    this.filterForm.get('terminationDatePeriod')?.valueChanges.subscribe(() => {
      this.formChanged = true;
      this.validateTerminationDatePeriod();
      this.cdr.markForCheck();
    });
  }

  private validateEffectiveDatePeriod(): void {
    const effectiveDate = this.filterForm.get('effectiveDate')?.value;
    const effectiveDatePeriod = this.filterForm.get('effectiveDatePeriod')?.value;
    const control = this.filterForm.get('effectiveDatePeriod');

    if (effectiveDate && !effectiveDatePeriod) {
      control?.setErrors({ required: true });
      control?.markAsTouched();
      this.effectiveDatePeriodError = 'Period is required';
    } else {
      control?.setErrors(null);
      this.effectiveDatePeriodError = '';
    }
  }

  private validateTerminationDatePeriod(): void {
    const terminationDate = this.filterForm.get('terminationDate')?.value;
    const terminationDatePeriod = this.filterForm.get('terminationDatePeriod')?.value;
    const control = this.filterForm.get('terminationDatePeriod');

    if (terminationDate && !terminationDatePeriod) {
      control?.setErrors({ required: true });
      control?.markAsTouched();
      this.terminationDatePeriodError = 'Period is required';
    } else {
      control?.setErrors(null);
      this.terminationDatePeriodError = '';
    }
  }

  ngOnDestroy(): void {
    // Cleanup handled automatically by component destruction
  }

  onEffectiveDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.effectiveDateRawInput = input.value;
    setTimeout(() => {
      const control = this.filterForm.get('effectiveDate');
      if (control && !control.value && input.value.trim()) {
        control.setErrors({ invalidDateFormat: true });
        control.markAsTouched();
        this.cdr.markForCheck();
      }
    }, 0);
  }

  onEffectiveDateBlur(input: HTMLInputElement): void {
    setTimeout(() => {
      const control = this.filterForm.get('effectiveDate');
      if (!control?.value && this.effectiveDateRawInput && !input.value) {
        input.value = this.effectiveDateRawInput;
      }
    }, 0);
  }

  onTerminationDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.terminationDateRawInput = input.value;
    setTimeout(() => {
      const control = this.filterForm.get('terminationDate');
      if (control && !control.value && input.value.trim()) {
        control.setErrors({ invalidDateFormat: true });
        control.markAsTouched();
        this.cdr.markForCheck();
      }
    }, 0);
  }

  onTerminationDateBlur(input: HTMLInputElement): void {
    setTimeout(() => {
      const control = this.filterForm.get('terminationDate');
      if (!control?.value && this.terminationDateRawInput && !input.value) {
        input.value = this.terminationDateRawInput;
      }
    }, 0);
  }

  onApply(): void {
    if (this.isApplyDisabled) {
      return;
    }

    const formValue = this.filterForm.getRawValue();

    const filters: SystemParameterFilterFormValue = {
      parameter: formValue.parameter || null,
      effectivePeriod: formValue.effectiveDatePeriod || null,
      effectiveDate: formValue.effectiveDate ? this.formatDateForPayload(this.convertToUTCDate(formValue.effectiveDate)) : null,
      terminationPeriod: formValue.terminationDatePeriod || null,
      terminationDate: formValue.terminationDate ? this.formatDateForPayload(this.convertToUTCDate(formValue.terminationDate)) : null
    };

    this.apply.emit(filters);
  }

  private parseDateStringAsLocal(dateStr: string): Date {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  private convertToUTCDate(date: moment.Moment | Date | null): Date | null {
    if (!date) return null;

    if (moment.isMoment(date)) {
      return new Date(Date.UTC(
        date.year(),
        date.month(),
        date.date(),
        0, 0, 0, 0
      ));
    }

    return new Date(Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      0, 0, 0, 0
    ));
  }

  private formatDateForPayload(date: Date | null): string {
    if (!date) return '';
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  get isApplyDisabled(): boolean {
    const formValue = this.filterForm.value;

    // Check for date format validation errors
    const effDateControl = this.filterForm.get('effectiveDate');
    const termDateControl = this.filterForm.get('terminationDate');
    const hasDateFormatErrors = !!(
      effDateControl?.hasError('invalidDateFormat') ||
      effDateControl?.hasError('matDatepickerParse') ||
      effDateControl?.hasError('invalidDate') ||
      termDateControl?.hasError('invalidDateFormat') ||
      termDateControl?.hasError('matDatepickerParse') ||
      termDateControl?.hasError('invalidDate')
    );

    if (hasDateFormatErrors) {
      return true;
    }

    const effectiveDateIncomplete = formValue.effectiveDatePeriod !== null && !formValue.effectiveDate;
    const terminationDateIncomplete = formValue.terminationDatePeriod !== null && !formValue.terminationDate;

    const hasParameter = !!formValue.parameter;
    const hasEffectiveDate = formValue.effectiveDate !== null;
    const hasTerminationDate = formValue.terminationDate !== null;
    const hasAnyCompleteValue = hasParameter || hasEffectiveDate || hasTerminationDate;

    if (!hasAnyCompleteValue || effectiveDateIncomplete || terminationDateIncomplete || this.hasValidationErrors) {
      return true;
    }

    // Disable if form values haven't changed from initial state
    return !this.formChanged;
  }

  get hasValidationErrors(): boolean {
    return this.filterForm.get('effectiveDatePeriod')?.invalid ||
           this.filterForm.get('terminationDatePeriod')?.invalid ||
           false;
  }

  onClear(): void {
    this.filterForm.reset({
      parameter: null,
      effectiveDatePeriod: null,
      effectiveDate: null,
      terminationDatePeriod: null,
      terminationDate: null
    });

    this.parameterSearchCtrl.setValue('');
    this.effectiveDateRawInput = '';
    this.terminationDateRawInput = '';
    this.effectiveDatePeriodError = '';
    this.terminationDatePeriodError = '';
    this.cdr.markForCheck();
  }

  onClose(): void {
    this.close.emit();
  }

  displayParameter(code: string): string {
    const option = this.parameterOptions.find(o => o.parameterCode === code);
    return option ? `${option.parameterCode} - ${option.description}` : code || '';
  }

  onParameterSelectOpened(opened: boolean): void {
    if (!opened) {
      this.parameterSearchCtrl.setValue('');
    }
  }
}
