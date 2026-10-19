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
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { A11yModule } from '@angular/cdk/a11y';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MAT_DATE_FORMATS, DateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { dateFormatValidator } from 'src/app/core/utils/date-adapter.util';
import { Subject, takeUntil } from 'rxjs';

import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { RecoveredPlasmaTestFilterValue } from '../models/recovered-plasma-test.model';

@Component({
  selector: 'app-recovered-plasma-test-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    A11yModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatInputModule,
    MatSelectModule
  ],
  templateUrl: './recovered-plasma-test-filter-panel.html',
  styleUrls: ['./recovered-plasma-test-filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }
  ]
})
export class RecoveredPlasmaTestFilterPanel implements OnInit, OnDestroy {
  @Input() currentFilters: RecoveredPlasmaTestFilterValue | null = null;
  @Output() apply = new EventEmitter<RecoveredPlasmaTestFilterValue>();
  @Output() close = new EventEmitter<void>();

  filterForm!: FormGroup;

  periodOptions: { value: string; display: string }[] = [
    { value: 'after', display: 'After' },
    { value: 'before', display: 'Before' }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      effectiveDatePeriod: [this.currentFilters?.effectiveDatePeriod || null],
      effectiveDate: [
        this.currentFilters?.effectiveDate ? new Date(this.currentFilters.effectiveDate) : null,
        [dateFormatValidator()]
      ],
      terminationDatePeriod: [this.currentFilters?.terminationDatePeriod || null],
      terminationDate: [
        this.currentFilters?.terminationDate ? new Date(this.currentFilters.terminationDate) : null,
        [dateFormatValidator()]
      ]
    });

    this.setupValidation();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupValidation(): void {
    // Watch effective date changes
    this.filterForm.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateEffectiveDatePeriod();
        this.cdr.markForCheck();
      });

    // Watch effective date period changes
    this.filterForm.get('effectiveDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateEffectiveDatePeriod();
        this.cdr.markForCheck();
      });

    // Watch termination date changes
    this.filterForm.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateTerminationDatePeriod();
        this.cdr.markForCheck();
      });

    // Watch termination date period changes
    this.filterForm.get('terminationDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
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
    } else {
      control?.setErrors(null);
    }
  }

  private validateTerminationDatePeriod(): void {
    const terminationDate = this.filterForm.get('terminationDate')?.value;
    const terminationDatePeriod = this.filterForm.get('terminationDatePeriod')?.value;
    const control = this.filterForm.get('terminationDatePeriod');

    if (terminationDate && !terminationDatePeriod) {
      control?.setErrors({ required: true });
      control?.markAsTouched();
    } else {
      control?.setErrors(null);
    }
  }

  onDateInput(event: Event, controlName: string): void {
    const inputValue = (event.target as HTMLInputElement).value;
    const control = this.filterForm.get(controlName);
    if (!control) return;

    control.markAsTouched();
    control.markAsDirty();

    if (!inputValue?.trim()) {
      control.setErrors(null);
    } else if (!control.value) {
      control.setErrors({ invalidDate: true });
    }

    this.cdr.markForCheck();
  }

  getEffectiveDateError(): string {
    return DateFieldValidationUtility.getDateErrorMessage(
      this.filterForm.get('effectiveDate'), null, 'Effective Date'
    );
  }

  getTerminationDateError(): string {
    return DateFieldValidationUtility.getDateErrorMessage(
      this.filterForm.get('terminationDate'), null, 'Termination Date'
    );
  }

  getEffectiveDatePeriodError(): string {
    const control = this.filterForm.get('effectiveDatePeriod');
    if (control?.hasError('required') && control?.touched) {
      return 'Period is required';
    }
    return '';
  }

  getTerminationDatePeriodError(): string {
    const control = this.filterForm.get('terminationDatePeriod');
    if (control?.hasError('required') && control?.touched) {
      return 'Period is required';
    }
    return '';
  }

  onApply(): void {
    if (this.isApplyDisabled) {
      return;
    }

    const formValue = this.filterForm.value;

    const filters: RecoveredPlasmaTestFilterValue = {
      effectiveDatePeriod: formValue.effectiveDatePeriod || null,
      effectiveDate: formValue.effectiveDate || null,
      terminationDatePeriod: formValue.terminationDatePeriod || null,
      terminationDate: formValue.terminationDate || null
    };

    this.apply.emit(filters);
  }

  onClear(): void {
    this.filterForm.reset({
      effectiveDatePeriod: null,
      effectiveDate: null,
      terminationDatePeriod: null,
      terminationDate: null
    });
  }

  onClose(): void {
    this.close.emit();
  }

  get isApplyDisabled(): boolean {
    const formValue = this.filterForm.value;

    // Check if at least one field has a value
    const hasAnyValue = (formValue.effectiveDatePeriod !== null && formValue.effectiveDate !== null) ||
                        (formValue.terminationDatePeriod !== null && formValue.terminationDate !== null);

    // Disable if no values selected OR if there are validation errors
    return !hasAnyValue || this.hasValidationErrors;
  }

  get hasValidationErrors(): boolean {
    const effectiveDateControl = this.filterForm.get('effectiveDate');
    const terminationDateControl = this.filterForm.get('terminationDate');
    const effectiveDateHasError = effectiveDateControl?.hasError('invalidDateFormat') ||
                                  effectiveDateControl?.hasError('invalidDate') ||
                                  effectiveDateControl?.hasError('matDatepickerParse');
    const terminationDateHasError = terminationDateControl?.hasError('invalidDateFormat') ||
                                    terminationDateControl?.hasError('invalidDate') ||
                                    terminationDateControl?.hasError('matDatepickerParse');

    return this.filterForm.get('effectiveDatePeriod')?.invalid ||
           this.filterForm.get('terminationDatePeriod')?.invalid ||
           effectiveDateHasError ||
           terminationDateHasError ||
           false;
  }
}
