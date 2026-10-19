import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { dateFormatValidator } from 'src/app/core/utils/date-adapter.util';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export interface ResourceFilter {
  effectiveDatePeriod: 'AFTER' | 'BEFORE' | null;
  effectiveDate: Date | null;
  terminationDatePeriod: 'AFTER' | 'BEFORE' | null;
  terminationDate: Date | null;
}

@Component({
  selector: 'app-resource-filter',
  standalone: true,
  templateUrl: './resource-filter.html',
  styleUrls: ['./resource-filter.scss'],
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResourceFilterComponent implements OnInit, OnDestroy {
  @Input() currentFilters: ResourceFilter | null = null;
  @Output() apply = new EventEmitter<ResourceFilter>();
  @Output() close = new EventEmitter<void>();

  filterForm!: FormGroup;
  effectivePeriodRequired = false;
  terminationPeriodRequired = false;

  private effectiveDateRawInput = '';
  private terminationDateRawInput = '';
  private destroy$ = new Subject<void>();
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  constructor() {
    this.filterForm = this.fb.group({
      effectiveDatePeriod: [null],
      effectiveDate: [null, [dateFormatValidator()]],
      terminationDatePeriod: [null],
      terminationDate: [null, [dateFormatValidator()]]
    });
  }

  ngOnInit(): void {
    if (this.currentFilters) {
      this.filterForm.patchValue(this.currentFilters);
    }
    this.setupValidators();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupValidators(): void {
    this.filterForm.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const control = this.filterForm.get('effectiveDate');
        if (control && !control.touched) {
          control.markAsTouched();
        }
        setTimeout(() => this.validateEffectivePeriod(), 0);
      });

    this.filterForm.get('effectiveDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        setTimeout(() => this.validateEffectivePeriod(), 0);
      });

    this.filterForm.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const control = this.filterForm.get('terminationDate');
        if (control && !control.touched) {
          control.markAsTouched();
        }
        setTimeout(() => this.validateTerminationPeriod(), 0);
      });

    this.filterForm.get('terminationDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        setTimeout(() => this.validateTerminationPeriod(), 0);
      });
  }

  private validateEffectivePeriod(): void {
    const date = this.filterForm.get('effectiveDate')?.value;
    const period = this.filterForm.get('effectiveDatePeriod')?.value;
    this.effectivePeriodRequired = !!date && !period;
  }

  private validateTerminationPeriod(): void {
    const date = this.filterForm.get('terminationDate')?.value;
    const period = this.filterForm.get('terminationDatePeriod')?.value;
    this.terminationPeriodRequired = !!date && !period;
  }

  onApply(): void {
    if (this.isApplyDisabled) return;
    this.apply.emit(this.filterForm.value);
  }

  onClear(): void {
    this.filterForm.reset({
      effectiveDatePeriod: null,
      effectiveDate: null,
      terminationDatePeriod: null,
      terminationDate: null
    });
    this.effectivePeriodRequired = false;
    this.terminationPeriodRequired = false;
    this.effectiveDateRawInput = '';
    this.terminationDateRawInput = '';
    this.cdr.markForCheck();
  }

  onClose(): void {
    this.close.emit();
  }

  get isApplyDisabled(): boolean {
    const formValue = this.filterForm.value;

    const effectiveDateControl = this.filterForm.get('effectiveDate');
    const terminationDateControl = this.filterForm.get('terminationDate');
    const hasDateFormatErrors = !!(
      effectiveDateControl?.hasError('invalidDateFormat') ||
      effectiveDateControl?.hasError('matDatepickerParse') ||
      terminationDateControl?.hasError('invalidDateFormat') ||
      terminationDateControl?.hasError('matDatepickerParse')
    );

    if (hasDateFormatErrors) {
      return true;
    }

    const effectiveDateIncomplete = formValue.effectiveDatePeriod !== null && !formValue.effectiveDate;
    const terminationDateIncomplete = formValue.terminationDatePeriod !== null && !formValue.terminationDate;
    const hasValidationErrors = this.effectivePeriodRequired || this.terminationPeriodRequired;

    const hasAnyValue = formValue.effectiveDate !== null || formValue.terminationDate !== null;

    return !hasAnyValue || effectiveDateIncomplete || terminationDateIncomplete || hasValidationErrors;
  }

  onEffectiveDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.effectiveDateRawInput = input.value;
    this.validateDateInput('effectiveDate', input.value);
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
    this.validateDateInput('terminationDate', input.value);
  }

  onTerminationDateBlur(input: HTMLInputElement): void {
    setTimeout(() => {
      const control = this.filterForm.get('terminationDate');
      if (!control?.value && this.terminationDateRawInput && !input.value) {
        input.value = this.terminationDateRawInput;
      }
    }, 0);
  }

  private validateDateInput(controlName: string, rawValue: string): void {
    const control = this.filterForm.get(controlName);
    if (!control) return;
    control.markAsTouched();
    if (rawValue && rawValue.trim() && !control.value) {
      control.setErrors({ invalidDateFormat: true });
    }
    this.cdr.markForCheck();
  }
}
