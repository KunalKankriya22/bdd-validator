import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  Input,
  inject,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import {
  MAT_DATE_FORMATS,
  DateAdapter,
  ErrorStateMatcher,
} from '@angular/material/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';

import { ValidRemoteTestingLabFilterValue } from '../models/valid-remote-testing-labs.model';

@Component({
  selector: 'app-valid-remote-testing-labs-filter-panel',
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
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
  ],
  templateUrl: './valid-remote-testing-labs-filter-panel.html',
  styleUrls: ['./valid-remote-testing-labs-filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ValidRemoteTestingLabsFilterPanel implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  @Input() currentFilters: ValidRemoteTestingLabFilterValue | null = null;
  @Output() apply = new EventEmitter<ValidRemoteTestingLabFilterValue>();
  @Output() close = new EventEmitter<void>();

  @ViewChild('effDateNativeInput') effDateNativeInput?: ElementRef;
  @ViewChild('termDateNativeInput') termDateNativeInput?: ElementRef;

  filterForm!: FormGroup;
  initialFormValue: any = null;

  effectivePeriodRequired = false;
  terminationPeriodRequired = false;

  periodOptions = [
    { value: 'AFTER', label: 'After' },
    { value: 'BEFORE', label: 'Before' },
  ];

  // Custom error matchers
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

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      effectiveDatePeriod: [this.currentFilters?.effectiveDatePeriod || null],
      effectiveDate: [
        this.currentFilters?.effectiveDate ? new Date(this.currentFilters.effectiveDate) : null
      ],
      terminationDatePeriod: [this.currentFilters?.terminationDatePeriod || null],
      terminationDate: [
        this.currentFilters?.terminationDate ? new Date(this.currentFilters.terminationDate) : null
      ],
    });

    // Store initial form value for comparison
    this.initialFormValue = this.filterForm.getRawValue();

    // Clear error flags when effective date changes
    this.filterForm.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.effectivePeriodRequired = false;
      });

    // Clear error flags when effective date period changes
    this.filterForm.get('effectiveDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.effectivePeriodRequired = false;
      });

    // Clear error flags when termination date changes
    this.filterForm.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.terminationPeriodRequired = false;
      });

    // Clear error flags when termination date period changes
    this.filterForm.get('terminationDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.terminationPeriodRequired = false;
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

    // Check if form has changed from initial state
    const currentValue = this.filterForm.getRawValue();
    const hasChanged = this.hasFormChanged(this.initialFormValue, currentValue);

    return !hasChanged;
  }

  private hasFormChanged(initial: any, current: any): boolean {
    if (!initial) return true;

    // Compare dates properly - handle both Date objects and null/undefined
    const initialEffDate = initial.effectiveDate instanceof Date ? initial.effectiveDate.getTime() : null;
    const currentEffDate = current.effectiveDate instanceof Date ? current.effectiveDate.getTime() : null;
    const initialTermDate = initial.terminationDate instanceof Date ? initial.terminationDate.getTime() : null;
    const currentTermDate = current.terminationDate instanceof Date ? current.terminationDate.getTime() : null;

    return (
      initial.effectiveDatePeriod !== current.effectiveDatePeriod ||
      initialEffDate !== currentEffDate ||
      initial.terminationDatePeriod !== current.terminationDatePeriod ||
      initialTermDate !== currentTermDate
    );
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

  onApply(): void {
    // Mark all fields as touched to show validation errors
    this.filterForm.markAllAsTouched();

    const formValue = this.filterForm.value;

    // Check for period validation errors
    this.effectivePeriodRequired = !!(formValue.effectiveDate && !formValue.effectiveDatePeriod);
    this.terminationPeriodRequired = !!(formValue.terminationDate && !formValue.terminationDatePeriod);

    // If there are validation errors, stop here
    if (this.filterForm.invalid || this.effectivePeriodRequired || this.terminationPeriodRequired) {
      this.cdr.markForCheck();
      return;
    }

    // Format dates before emitting
    const filters: ValidRemoteTestingLabFilterValue = {
      effectiveDate: formValue.effectiveDate
        ? this.formatDateForApi(formValue.effectiveDate)
        : null,
      effectiveDatePeriod: formValue.effectiveDatePeriod || null,
      terminationDate: formValue.terminationDate
        ? this.formatDateForApi(formValue.terminationDate)
        : null,
      terminationDatePeriod: formValue.terminationDatePeriod || null,
    };

    this.apply.emit(filters);
  }

  onClear(): void {
    this.filterForm.reset();
    this.effectivePeriodRequired = false;
    this.terminationPeriodRequired = false;
  }

  /**
   * Format date to YYYY-MM-DD format for API
   * @param date - Date object
   * @returns Formatted date string
   */
  private formatDateForApi(date: Date | null): string | null {
    if (!date) return null;

    // Ensure we have a valid Date object
    const d = date instanceof Date ? date : new Date(date);

    if (isNaN(d.getTime())) {
      console.error('Invalid date in formatDateForApi:', date);
      return null;
    }

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  onClose(): void {
    this.close.emit();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
