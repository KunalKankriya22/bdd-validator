import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ErrorStateMatcher, MAT_DATE_FORMATS, MAT_DATE_LOCALE, DateAdapter } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { QaLibraryFilters } from '../../models/qa-library.models';

@Component({
  selector: 'app-qa-library-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }
  ],
  templateUrl: './qa-library-filter-panel.component.html',
  styleUrls: ['./qa-library-filter-panel.component.scss']
})
export class QaLibraryFilterPanelComponent implements OnInit, OnDestroy {
  @Input() currentFilters: QaLibraryFilters | null = null;
  @Output() apply = new EventEmitter<QaLibraryFilters>();
  @Output() clearAll = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  @ViewChild('effDateNativeInput') effDateNativeInput?: ElementRef;
  @ViewChild('termDateNativeInput') termDateNativeInput?: ElementRef;

  filterForm!: FormGroup;

  showEffectiveDatePeriodError = false;
  showTerminationDatePeriodError = false;

  effDateErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control): boolean => {
      if (!control || !(control.dirty || control.touched)) return false;
      if (control.invalid) return true;
      return !control.value && !!this.getNativeInputText(this.effDateNativeInput);
    }
  };

  termDateErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control): boolean => {
      if (!control || !(control.dirty || control.touched)) return false;
      if (control.invalid) return true;
      return !control.value && !!this.getNativeInputText(this.termDateNativeInput);
    }
  };

  private destroy$ = new Subject<void>();

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      sex: [this.currentFilters?.sex || null],
      responseType: [this.currentFilters?.responseType || null],
      effectiveDatePeriod: [this.currentFilters?.effectiveDatePeriod || null],
      effectiveDate: [this.currentFilters?.effectiveDate || null],
      terminationDatePeriod: [this.currentFilters?.terminationDatePeriod || null],
      terminationDate: [this.currentFilters?.terminationDate || null]
    });

    // Clear error flags when effective date changes
    this.filterForm.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.showEffectiveDatePeriodError = false;
      });

    // Clear error flags when effective date period changes
    this.filterForm.get('effectiveDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.showEffectiveDatePeriodError = false;
      });

    // Clear error flags when termination date changes
    this.filterForm.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.showTerminationDatePeriodError = false;
      });

    // Clear error flags when termination date period changes
    this.filterForm.get('terminationDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.showTerminationDatePeriodError = false;
      });
  }

  get effDatePeriodRequired(): boolean {
    const date = this.filterForm?.get('effectiveDate')?.value;
    const period = this.filterForm?.get('effectiveDatePeriod')?.value;
    return !!date && !period;
  }

  get termDatePeriodRequired(): boolean {
    const date = this.filterForm?.get('terminationDate')?.value;
    const period = this.filterForm?.get('terminationDatePeriod')?.value;
    return !!date && !period;
  }

  private getNativeInputText(elRef?: ElementRef): string {
    return elRef?.nativeElement?.value?.trim() ?? '';
  }

  getEffectiveDateError(): string {
    const control = this.filterForm?.get('effectiveDate');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('matDatepickerParse')) return 'Effective Date is invalid';
    if (!control.value && this.getNativeInputText(this.effDateNativeInput)) return 'Effective Date is invalid';
    return '';
  }

  getTerminationDateError(): string {
    const control = this.filterForm?.get('terminationDate');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('matDatepickerParse')) return 'Termination Date is invalid';
    if (!control.value && this.getNativeInputText(this.termDateNativeInput)) return 'Termination Date is invalid';
    return '';
  }

  get isApplyDisabled(): boolean {
    // Check if form has validation errors
    if (this.filterForm.invalid) {
      return true;
    }

    // Check if date fields have invalid text input
    if (this.getEffectiveDateError() || this.getTerminationDateError()) {
      return true;
    }

    // Check if there are period validation errors
    if (this.effDatePeriodRequired || this.termDatePeriodRequired) {
      return true;
    }

    // Check if at least one field has a value
    const formValue = this.filterForm.value;
    const hasAnyValue = formValue.sex ||
                        formValue.responseType ||
                        formValue.effectiveDate ||
                        formValue.terminationDate;

    return !hasAnyValue;
  }

  onApply(): void {
    // Mark all fields as touched to show validation errors
    this.filterForm.markAllAsTouched();

    const formValue = this.filterForm.value;

    // Check for period validation errors
    this.showEffectiveDatePeriodError = !!(formValue.effectiveDate && !formValue.effectiveDatePeriod);
    this.showTerminationDatePeriodError = !!(formValue.terminationDate && !formValue.terminationDatePeriod);

    // If there are validation errors, stop here
    if (this.filterForm.invalid || this.showEffectiveDatePeriodError || this.showTerminationDatePeriodError) {
      return;
    }

    this.apply.emit(this.filterForm.value);
  }

  onClear(): void {
    this.filterForm.reset();
    this.showEffectiveDatePeriodError = false;
    this.showTerminationDatePeriodError = false;
    this.clearAll.emit();
  }

  onClose(): void {
    this.close.emit();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
