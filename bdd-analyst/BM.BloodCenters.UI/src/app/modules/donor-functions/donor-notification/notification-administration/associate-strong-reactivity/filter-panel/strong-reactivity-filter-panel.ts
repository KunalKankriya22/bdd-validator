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
import { FormBuilder, FormGroup, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
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
import { StrongReactivityFilterValue, BOUND_OPTIONS } from '../models/strong-reactivity.model';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';

@Component({
  selector: 'app-strong-reactivity-filter-panel',
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
    MatInputModule
  ],
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }
  ],
  templateUrl: './strong-reactivity-filter-panel.html',
  styleUrls: ['./strong-reactivity-filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StrongReactivityFilterPanel implements OnInit, OnDestroy {
  @Input() currentFilters: StrongReactivityFilterValue | null = null;
  @Output() apply = new EventEmitter<StrongReactivityFilterValue>();
  @Output() close = new EventEmitter<void>();

  filterForm!: FormGroup;
  hasActiveFilters = false;
  boundOptions = BOUND_OPTIONS;

  periodOptions = [
    { value: 'After', display: 'After' },
    { value: 'Before', display: 'Before' }
  ];

  // Store raw input text to preserve invalid dates
  private effDateRawInput = '';
  private termDateRawInput = '';

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private dateAdapter: DateAdapter<Moment>
  ) { }

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      bound: [this.currentFilters?.bound || null],
      effectivePeriod: [this.currentFilters?.effectivePeriod || null],
      effectiveDate: [this.currentFilters?.effectiveDate || null],
      terminationPeriod: [this.currentFilters?.terminationPeriod || null],
      terminationDate: [this.currentFilters?.terminationDate || null]
    });

    this.hasActiveFilters = this.checkHasActiveFilters();

    this.filterForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.hasActiveFilters = this.checkHasActiveFilters();
        this.cdr.markForCheck();
      });

    // Setup validation after a delay to avoid interfering with datepicker initialization
    setTimeout(() => {
      this.setupValidation();
    }, 100);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupValidation(): void {
    // Set validators
    this.filterForm.get('effectivePeriod')?.setValidators([this.effDatePeriodValidator.bind(this)]);
    this.filterForm.get('terminationPeriod')?.setValidators([this.termDatePeriodValidator.bind(this)]);

    // When effective date changes, validate that period is selected if date is set
    this.filterForm.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        const periodControl = this.filterForm.get('effectivePeriod');
        if (value && periodControl) {
          periodControl.markAsTouched();
          periodControl.updateValueAndValidity({ emitEvent: false });
        }
        this.cdr.markForCheck();
      });

    // When termination date changes, validate that period is selected if date is set
    this.filterForm.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        const periodControl = this.filterForm.get('terminationPeriod');
        if (value && periodControl) {
          periodControl.markAsTouched();
          periodControl.updateValueAndValidity({ emitEvent: false });
        }
        this.cdr.markForCheck();
      });
  }

  private checkHasActiveFilters(): boolean {
    const formValue = this.filterForm.value;

    return !!(
      formValue.bound ||
      formValue.effectivePeriod ||
      formValue.effectiveDate ||
      formValue.terminationPeriod ||
      formValue.terminationDate
    );
  }

  private effDatePeriodValidator(control: AbstractControl): ValidationErrors | null {
    if (!this.filterForm) return null;

    const effDate = this.filterForm.get('effectiveDate')?.value;
    const effDatePeriod = control.value;

    if (effDate && !effDatePeriod) {
      return { required: true };
    }

    return null;
  }

  private termDatePeriodValidator(control: AbstractControl): ValidationErrors | null {
    if (!this.filterForm) return null;

    const termDate = this.filterForm.get('terminationDate')?.value;
    const termDatePeriod = control.value;

    if (termDate && !termDatePeriod) {
      return { required: true };
    }

    return null;
  }

  onApply(): void {
    // Mark all fields as touched to show validation errors
    this.filterForm.markAllAsTouched();

    // Prevent apply if form is invalid
    if (this.filterForm.invalid) {
      return;
    }

    const formValue = this.filterForm.value;

    // Clear period if date is not set (period without date doesn't make sense)
    const effectivePeriod = formValue.effectiveDate ? (formValue.effectivePeriod || null) : null;
    const terminationPeriod = formValue.terminationDate ? (formValue.terminationPeriod || null) : null;

    const filters: StrongReactivityFilterValue = {
      epitopeId1: null,
      epitopeId2: null,
      bound: formValue.bound || null,
      effectivePeriod: effectivePeriod,
      effectiveDate: formValue.effectiveDate || null,
      terminationPeriod: terminationPeriod,
      terminationDate: formValue.terminationDate || null
    };

    this.apply.emit(filters);
  }

  onClear(): void {
    this.filterForm.reset({
      bound: null,
      effectivePeriod: null,
      effectiveDate: null,
      terminationPeriod: null,
      terminationDate: null
    });

    this.effDateRawInput = '';
    this.termDateRawInput = '';
  }

  onClose(): void {
    this.close.emit();
  }

  getEffDatePeriodError(): string {
    const control = this.filterForm.get('effectivePeriod');
    if (!control || !control.touched) return '';
    if (control.hasError('required')) return 'Period is required';
    return '';
  }

  getTermDatePeriodError(): string {
    const control = this.filterForm.get('terminationPeriod');
    if (!control || !control.touched) return '';
    if (control.hasError('required')) return 'Period is required';
    return '';
  }

  get hasDateErrors(): boolean {
    const effDate = this.filterForm.get('effectiveDate');
    const termDate = this.filterForm.get('terminationDate');
    return !!(
      effDate?.hasError('matDatepickerParse') ||
      effDate?.hasError('invalidDateFormat') ||
      termDate?.hasError('matDatepickerParse') ||
      termDate?.hasError('invalidDateFormat')
    );
  }

  get isApplyDisabled(): boolean {
    return this.filterForm.invalid || !this.hasActiveFilters || this.hasDateErrors;
  }

  onEffDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.effDateRawInput = input.value;
    const control = this.filterForm.get('effectiveDate');
    if (control) {
      control.markAsTouched();
      if (input.value && !this.dateAdapter.parse(input.value, DD_MON_YYYY_FORMATS.parse.dateInput)) {
        control.setErrors({ ...control.errors, invalidDateFormat: true });
      } else if (input.value) {
        const { invalidDateFormat: _, ...rest } = control.errors ?? {};
        control.setErrors(Object.keys(rest).length ? rest : null);
      }
    }
    this.cdr.markForCheck();
  }

  onEffDateBlur(input: HTMLInputElement): void {
    setTimeout(() => {
      const control = this.filterForm.get('effectiveDate');
      if (!control?.value && this.effDateRawInput && !input.value) {
        input.value = this.effDateRawInput;
      }
    }, 0);
  }

  onTermDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.termDateRawInput = input.value;
    const control = this.filterForm.get('terminationDate');
    if (control) {
      control.markAsTouched();
      if (input.value && !this.dateAdapter.parse(input.value, DD_MON_YYYY_FORMATS.parse.dateInput)) {
        control.setErrors({ ...control.errors, invalidDateFormat: true });
      } else if (input.value) {
        const { invalidDateFormat: _, ...rest } = control.errors ?? {};
        control.setErrors(Object.keys(rest).length ? rest : null);
      }
    }
    this.cdr.markForCheck();
  }

  onTermDateBlur(input: HTMLInputElement): void {
    setTimeout(() => {
      const control = this.filterForm.get('terminationDate');
      if (!control?.value && this.termDateRawInput && !input.value) {
        input.value = this.termDateRawInput;
      }
    }, 0);
  }
}
