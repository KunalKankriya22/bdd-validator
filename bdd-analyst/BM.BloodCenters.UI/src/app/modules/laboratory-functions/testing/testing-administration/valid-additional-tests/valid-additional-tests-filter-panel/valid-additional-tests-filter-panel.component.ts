import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, inject, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { Subject, takeUntil } from 'rxjs';

import { ValidAdditionalTestFilterValue } from '../models/valid-additional-tests.model';

@Component({
  selector: 'app-valid-additional-tests-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
  ],
  templateUrl: './valid-additional-tests-filter-panel.component.html',
  styleUrls: ['./valid-additional-tests-filter-panel.component.scss'],
})
export class ValidAdditionalTestsFilterPanelComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  @Input() currentFilters: ValidAdditionalTestFilterValue | null = null;
  @Output() apply = new EventEmitter<ValidAdditionalTestFilterValue>();
  @Output() close = new EventEmitter<void>();

  @ViewChild('effectiveDateNativeInput') effectiveDateNativeInput?: ElementRef;
  @ViewChild('terminationDateNativeInput') terminationDateNativeInput?: ElementRef;

  filterForm!: FormGroup;

  periodOptions = [
    { value: 'After', label: 'After' },
    { value: 'Before', label: 'Before' },
  ];

  effDateErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control): boolean => {
      if (!control || !(control.dirty || control.touched)) return false;
      if (control.invalid) return true;
      return !control.value && !!this.getNativeInputText(this.effectiveDateNativeInput);
    }
  };

  termDateErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control): boolean => {
      if (!control || !(control.dirty || control.touched)) return false;
      if (control.invalid) return true;
      return !control.value && !!this.getNativeInputText(this.terminationDateNativeInput);
    }
  };

  ngOnInit(): void {
    this.initializeForm();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.filterForm = this.fb.group({
      effectivePeriod: [this.currentFilters?.effectivePeriod ?? null],
      effectiveDate: [this.currentFilters?.effDateFrom ?? null],
      terminationPeriod: [this.currentFilters?.terminationPeriod ?? null],
      terminationDate: [this.currentFilters?.effDateTo ?? null],
    });

    this.filterForm.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((date) => {
        const control = this.filterForm.get('effectiveDate');
        const periodControl = this.filterForm.get('effectivePeriod');
        if (control && !control.touched) control.markAsTouched();
        const hasValidDate = date && !control?.hasError('matDatepickerParse');
        if (hasValidDate && periodControl) periodControl.markAsTouched();
        this.validateEffectiveDatePeriod();
      });

    this.filterForm.get('effectiveDate')?.statusChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const control = this.filterForm.get('effectiveDate');
        const periodControl = this.filterForm.get('effectivePeriod');
        const hasValidDate = control?.value && !control?.hasError('matDatepickerParse');
        if (hasValidDate && periodControl) periodControl.markAsTouched();
        this.validateEffectiveDatePeriod();
      });

    this.filterForm.get('effectivePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.validateEffectiveDatePeriod());

    this.filterForm.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((date) => {
        const control = this.filterForm.get('terminationDate');
        const periodControl = this.filterForm.get('terminationPeriod');
        if (control && !control.touched) control.markAsTouched();
        const hasValidDate = date && !control?.hasError('matDatepickerParse');
        if (hasValidDate && periodControl) periodControl.markAsTouched();
        this.validateTerminationDatePeriod();
      });

    this.filterForm.get('terminationDate')?.statusChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const control = this.filterForm.get('terminationDate');
        const periodControl = this.filterForm.get('terminationPeriod');
        const hasValidDate = control?.value && !control?.hasError('matDatepickerParse');
        if (hasValidDate && periodControl) periodControl.markAsTouched();
        this.validateTerminationDatePeriod();
      });

    this.filterForm.get('terminationPeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.validateTerminationDatePeriod());
  }

  private validateEffectiveDatePeriod(): void {
    const effDateControl = this.filterForm.get('effectiveDate');
    const effDate = effDateControl?.value;
    const effDatePeriod = this.filterForm.get('effectivePeriod')?.value;
    const effDatePeriodControl = this.filterForm.get('effectivePeriod');

    const hasValidDate = effDate && !effDateControl?.hasError('matDatepickerParse');

    if (hasValidDate && !effDatePeriod) {
      effDatePeriodControl?.setErrors({ required: true });
      effDatePeriodControl?.markAsTouched();
    } else {
      effDatePeriodControl?.setErrors(null);
    }
    this.cdr.markForCheck();
  }

  private validateTerminationDatePeriod(): void {
    const termDateControl = this.filterForm.get('terminationDate');
    const termDate = termDateControl?.value;
    const termDatePeriod = this.filterForm.get('terminationPeriod')?.value;
    const termDatePeriodControl = this.filterForm.get('terminationPeriod');

    const hasValidDate = termDate && !termDateControl?.hasError('matDatepickerParse');

    if (hasValidDate && !termDatePeriod) {
      termDatePeriodControl?.setErrors({ required: true });
      termDatePeriodControl?.markAsTouched();
    } else {
      termDatePeriodControl?.setErrors(null);
    }
    this.cdr.markForCheck();
  }

  getEffectiveDateError(): string {
    const control = this.filterForm?.get('effectiveDate');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('matDatepickerParse')) return 'Effective date is invalid';
    if (!control.value && this.getNativeInputText(this.effectiveDateNativeInput)) return 'Effective date is invalid';
    return '';
  }

  getTerminationDateError(): string {
    const control = this.filterForm?.get('terminationDate');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('matDatepickerParse')) return 'Termination date is invalid';
    if (!control.value && this.getNativeInputText(this.terminationDateNativeInput)) return 'Termination date is invalid';
    return '';
  }

  private getNativeInputText(elRef?: ElementRef): string {
    return elRef?.nativeElement?.value?.trim() ?? '';
  }

  get isApplyDisabled(): boolean {
    const effDateControl = this.filterForm.get('effectiveDate');
    const termDateControl = this.filterForm.get('terminationDate');
    const effPeriodControl = this.filterForm.get('effectivePeriod');
    const termPeriodControl = this.filterForm.get('terminationPeriod');

    const hasDateErrors = (effDateControl?.invalid ?? false) || (termDateControl?.invalid ?? false);
    const hasPeriodErrors = (effPeriodControl?.invalid ?? false) || (termPeriodControl?.invalid ?? false);

    const hasUnparsedEffDate = !effDateControl?.value && !!this.getNativeInputText(this.effectiveDateNativeInput);
    const hasUnparsedTermDate = !termDateControl?.value && !!this.getNativeInputText(this.terminationDateNativeInput);

    const hasNoDates = !effDateControl?.value && !termDateControl?.value;

    return hasDateErrors || hasPeriodErrors || hasUnparsedEffDate || hasUnparsedTermDate || hasNoDates;
  }

  onApply(): void {
    this.validateEffectiveDatePeriod();
    this.validateTerminationDatePeriod();

    const effDateControl = this.filterForm.get('effectiveDate');
    const termDateControl = this.filterForm.get('terminationDate');
    const effPeriodControl = this.filterForm.get('effectivePeriod');
    const termPeriodControl = this.filterForm.get('terminationPeriod');

    if (effDateControl?.errors || termDateControl?.errors ||
        effPeriodControl?.errors || termPeriodControl?.errors) {
      effDateControl?.markAsTouched();
      termDateControl?.markAsTouched();
      effPeriodControl?.markAsTouched();
      termPeriodControl?.markAsTouched();
      this.cdr.markForCheck();
      return;
    }

    const v = this.filterForm.value;
    this.apply.emit({
      effectivePeriod: v.effectiveDate ? v.effectivePeriod : null,
      effDateFrom: v.effectiveDate || null,
      terminationPeriod: v.terminationDate ? v.terminationPeriod : null,
      effDateTo: v.terminationDate || null,
    });
  }

  onClear(): void {
    this.filterForm.reset();
    this.filterForm.get('effectivePeriod')?.setErrors(null);
    this.filterForm.get('terminationPeriod')?.setErrors(null);
    this.cdr.markForCheck();
  }

  onClose(): void {
    this.close.emit();
  }
}
