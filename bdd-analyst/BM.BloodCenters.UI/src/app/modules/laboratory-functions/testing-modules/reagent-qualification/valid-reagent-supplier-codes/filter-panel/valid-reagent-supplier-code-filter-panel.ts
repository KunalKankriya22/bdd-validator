import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  OnDestroy,
  Input,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { Subject, takeUntil } from 'rxjs';
import { Moment } from 'moment';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { dateFormatValidator } from 'src/app/core/utils/date-adapter.util';

export interface ValidReagentSupplierCodeFilterValue {
  showTerminated?: string;
  effectiveDatePeriod?: string | null;
  effectiveDate?: Moment | null;
  terminationDatePeriod?: string | null;
  terminationDate?: Moment | null;
}

@Component({
  selector: 'app-valid-reagent-supplier-code-filter-panel',
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
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }
  ],
  templateUrl: './valid-reagent-supplier-code-filter-panel.html',
  styleUrls: ['./valid-reagent-supplier-code-filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ValidReagentSupplierCodeFilterPanel implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  @Input() currentFilters: ValidReagentSupplierCodeFilterValue | null = null;
  @Output() apply = new EventEmitter<ValidReagentSupplierCodeFilterValue>();
  @Output() close = new EventEmitter<void>();

  filterForm!: FormGroup;

  // Validation error messages
  effectiveDatePeriodError = '';
  terminationDatePeriodError = '';

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      showTerminated: [this.currentFilters?.showTerminated || null],
      effectiveDatePeriod: [this.currentFilters?.effectiveDatePeriod || null],
      effectiveDate: [this.currentFilters?.effectiveDate || null, [dateFormatValidator()]],
      terminationDatePeriod: [this.currentFilters?.terminationDatePeriod || null],
      terminationDate: [this.currentFilters?.terminationDate || null, [dateFormatValidator()]]
    });

    this.setupPeriodValidation();

    // Run initial validation if data was provided
    if (this.currentFilters) {
      this.validateEffectiveDatePeriod();
      this.validateTerminationDatePeriod();
    }
  }

  private setupPeriodValidation(): void {
    // Validate effectiveDatePeriod when effectiveDate changes
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

    // Validate terminationDatePeriod when terminationDate changes
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
    this.filterForm.get('effectiveDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateEffectiveDatePeriod();
        this.cdr.markForCheck();
      });

    this.filterForm.get('terminationDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateTerminationDatePeriod();
        this.cdr.markForCheck();
      });
  }

  get isApplyDisabled(): boolean {
    // Check for period validation errors
    if (this.effectiveDatePeriodError || this.terminationDatePeriodError) {
      return true;
    }

    const formValue = this.filterForm.value;

    // Check if at least one filter field has a value
    const hasAnyFilter =
      formValue.showTerminated ||
      (formValue.effectiveDate && formValue.effectiveDatePeriod) ||
      (formValue.terminationDate && formValue.terminationDatePeriod);

    return !hasAnyFilter;
  }

  onApply(): void {
    // Validate before applying
    this.validateEffectiveDatePeriod();
    this.validateTerminationDatePeriod();

    if (this.effectiveDatePeriodError || this.terminationDatePeriodError) {
      return;
    }

    const formValue = this.filterForm.value;
    this.apply.emit(formValue);
    this.close.emit();
  }

  /**
   * Validate that Period is selected if Effective Date has a value
   */
  private validateEffectiveDatePeriod(): void {
    const effectiveDate = this.filterForm.get('effectiveDate')?.value;
    const effectiveDatePeriod = this.filterForm.get('effectiveDatePeriod')?.value;

    // Show error only if date is selected but period is not
    if (effectiveDate && (!effectiveDatePeriod || effectiveDatePeriod === '')) {
      this.effectiveDatePeriodError = 'Period is required';
    } else {
      this.effectiveDatePeriodError = '';
    }
  }

  /**
   * Validate that Period is selected if Termination Date has a value
   */
  private validateTerminationDatePeriod(): void {
    const terminationDate = this.filterForm.get('terminationDate')?.value;
    const terminationDatePeriod = this.filterForm.get('terminationDatePeriod')?.value;

    // Show error only if date is selected but period is not
    if (terminationDate && (!terminationDatePeriod || terminationDatePeriod === '')) {
      this.terminationDatePeriodError = 'Period is required';
    } else {
      this.terminationDatePeriodError = '';
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onClearAll(): void {
    this.filterForm.reset({
      showTerminated: null,
      effectiveDatePeriod: null,
      effectiveDate: null,
      terminationDatePeriod: null,
      terminationDate: null
    });
  }

  onClose(): void {
    this.close.emit();
  }
}
