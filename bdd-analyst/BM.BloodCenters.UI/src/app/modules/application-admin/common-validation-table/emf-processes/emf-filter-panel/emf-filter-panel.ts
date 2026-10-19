import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  OnDestroy,
  Output,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';

import { ProcessCodesFilterValue } from '../emf-processes';

@Component({
  selector: 'app-emf-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatDatepickerModule,
    MatInputModule,
    MatFormFieldModule
  ],
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }
  ],
  templateUrl: './emf-filter-panel.html',
  styleUrls: ['./emf-filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmfFilterPanel implements OnInit, OnDestroy {
  @Input() currentFilters: ProcessCodesFilterValue | null = null;
  @Output() apply = new EventEmitter<ProcessCodesFilterValue>();
  @Output() close = new EventEmitter<void>();

  filterForm!: FormGroup;
  hasChanges = false;
  hasActiveFilters = false;
  periodOptions = ['After', 'Before'];

  private effectiveDateRawInput = '';
  private terminationDateRawInput = '';
  private appliedFilterSnapshot!: string;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private dateAdapter: DateAdapter<any>
  ) {}

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      effectiveDatePeriod: [this.currentFilters?.effectiveDatePeriod || null],
      effectiveDate: [this.currentFilters?.effectiveDate || null],
      terminationDatePeriod: [this.currentFilters?.terminationDatePeriod || null],
      terminationDate: [this.currentFilters?.terminationDate || null]
    });

    this.appliedFilterSnapshot = this.normalizeFormValue(this.filterForm.value);
    this.hasActiveFilters = this.checkHasActiveFilters();

    this.filterForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.hasChanges = this.normalizeFormValue(this.filterForm.value) !== this.appliedFilterSnapshot;
        this.hasActiveFilters = this.checkHasActiveFilters();
        this.cdr.markForCheck();
      });

    this.setupValidation();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupValidation(): void {
    this.filterForm.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        const periodControl = this.filterForm.get('effectiveDatePeriod');
        if (value && periodControl) {
          periodControl.markAsTouched();
          periodControl.updateValueAndValidity({ emitEvent: false });
        }
        this.filterForm.get('effectiveDate')?.updateValueAndValidity({ emitEvent: false });
        this.cdr.markForCheck();
      });

    this.filterForm.get('effectiveDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        this.filterForm.get('effectiveDatePeriod')?.updateValueAndValidity({ emitEvent: false });
        if (value) {
          const dateControl = this.filterForm.get('effectiveDate');
          if (dateControl) {
            dateControl.markAsTouched();
            dateControl.updateValueAndValidity({ emitEvent: false });
          }
        }
        this.cdr.markForCheck();
      });

    this.filterForm.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        const periodControl = this.filterForm.get('terminationDatePeriod');
        if (value && periodControl) {
          periodControl.markAsTouched();
          periodControl.updateValueAndValidity({ emitEvent: false });
        }
        this.filterForm.get('terminationDate')?.updateValueAndValidity({ emitEvent: false });
        this.cdr.markForCheck();
      });

    this.filterForm.get('terminationDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        this.filterForm.get('terminationDatePeriod')?.updateValueAndValidity({ emitEvent: false });
        if (value) {
          const dateControl = this.filterForm.get('terminationDate');
          if (dateControl) {
            dateControl.markAsTouched();
            dateControl.updateValueAndValidity({ emitEvent: false });
          }
        }
        this.cdr.markForCheck();
      });

    this.filterForm.get('effectiveDatePeriod')?.setValidators([this.effDatePeriodValidator.bind(this)]);
    this.filterForm.get('terminationDatePeriod')?.setValidators([this.termDatePeriodValidator.bind(this)]);
  }

  private normalizeFormValue(formValue: any): string {
    return JSON.stringify({
      effectiveDatePeriod: formValue.effectiveDatePeriod || null,
      effectiveDate: formValue.effectiveDate ? String(formValue.effectiveDate) : null,
      terminationDatePeriod: formValue.terminationDatePeriod || null,
      terminationDate: formValue.terminationDate ? String(formValue.terminationDate) : null
    });
  }

  private checkHasActiveFilters(): boolean {
    const formValue = this.filterForm.value;
    return !!(
      (formValue.effectiveDate && formValue.effectiveDatePeriod) ||
      (formValue.terminationDate && formValue.terminationDatePeriod)
    );
  }

  private effDatePeriodValidator(control: AbstractControl): ValidationErrors | null {
    if (!this.filterForm) return null;
    const effDate = this.filterForm.get('effectiveDate')?.value;
    if (effDate && !control.value) {
      return { required: true };
    }
    return null;
  }

  private termDatePeriodValidator(control: AbstractControl): ValidationErrors | null {
    if (!this.filterForm) return null;
    const termDate = this.filterForm.get('terminationDate')?.value;
    if (termDate && !control.value) {
      return { required: true };
    }
    return null;
  }


  onApply(): void {
    this.filterForm.markAllAsTouched();
    if (this.filterForm.invalid) return;

    const formValue = this.filterForm.value;
    const effDatePeriod = formValue.effectiveDate ? (formValue.effectiveDatePeriod || null) : null;
    const termDatePeriod = formValue.terminationDate ? (formValue.terminationDatePeriod || null) : null;

    const filters: ProcessCodesFilterValue = {
      effectiveDatePeriod: effDatePeriod,
      effectiveDate: formValue.effectiveDate || null,
      terminationDatePeriod: termDatePeriod,
      terminationDate: formValue.terminationDate || null
    };

    this.appliedFilterSnapshot = this.normalizeFormValue(this.filterForm.value);
    this.hasChanges = false;
    this.cdr.markForCheck();

    this.apply.emit(filters);
  }

  onClear(): void {
    this.filterForm.reset({
      effectiveDatePeriod: null,
      effectiveDate: null,
      terminationDatePeriod: null,
      terminationDate: null
    });
    this.effectiveDateRawInput = '';
    this.terminationDateRawInput = '';
  }

  onClose(): void {
    this.close.emit();
  }

  getEffDatePeriodError(): string {
    const control = this.filterForm.get('effectiveDatePeriod');
    if (!control || !control.touched) return '';
    if (control.hasError('required')) return 'Period is required';
    return '';
  }

  getTermDatePeriodError(): string {
    const control = this.filterForm.get('terminationDatePeriod');
    if (!control || !control.touched) return '';
    if (control.hasError('required')) return 'Period is required';
    return '';
  }

  get isApplyDisabled(): boolean {
    if (this.hasDateErrors) return true;
    if (!this.hasActiveFilters) return true;

    const v = this.filterForm.value;
    if (v.effectiveDate && !v.effectiveDatePeriod) return true;
    if (v.terminationDate && !v.terminationDatePeriod) return true;
    if (v.effectiveDatePeriod && !v.effectiveDate) return true;
    if (v.terminationDatePeriod && !v.terminationDate) return true;

    return false;
  }

  get hasDateErrors(): boolean {
    const effDate = this.filterForm.get('effectiveDate');
    const termDate = this.filterForm.get('terminationDate');
    return !!(
      effDate?.hasError('matDatepickerParse') ||
      effDate?.hasError('invalidDate') ||
      termDate?.hasError('matDatepickerParse') ||
      termDate?.hasError('invalidDate')
    );
  }

  /**
   * Store raw input text when user types in effective date field
   */
  onEffectiveDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.effectiveDateRawInput = input.value;
  }

  /**
   * Restore invalid text when Material clears it on blur and validate
   */
  onEffectiveDateBlur(input: HTMLInputElement): void {
    // Use setTimeout to run after Material's blur handling
    setTimeout(() => {
      const control = this.filterForm.get('effectiveDate');
      const inputValue = input.value?.trim() || '';

      // If control has no value but we have raw input, restore it
      if (!control?.value && this.effectiveDateRawInput && !input.value) {
        input.value = this.effectiveDateRawInput;
      }

      // If there's input text but no parsed value, try to manually parse it
      if (inputValue && !control?.value) {
        const formats = Array.isArray(DD_MON_YYYY_FORMATS.parse.dateInput)
          ? DD_MON_YYYY_FORMATS.parse.dateInput
          : [DD_MON_YYYY_FORMATS.parse.dateInput];

        const parsed = this.dateAdapter.parse(inputValue, formats);

        if (parsed?.isValid()) {
          // Successfully parsed - set the value and update the input display
          control?.setValue(parsed);
          input.value = this.dateAdapter.format(parsed, DD_MON_YYYY_FORMATS.display.dateInput);
        } else if (control) {
          // Failed to parse - set invalid error
          control.setErrors({ ...control.errors, invalidDate: true });
          control.markAsTouched();
        }
      } else if (control?.hasError('invalidDate') && (!inputValue || control?.value)) {
        // Clear custom error if input is empty or has valid value
        const errors = { ...control.errors };
        delete errors['invalidDate'];
        control.setErrors(Object.keys(errors).length > 0 ? errors : null);
      }

      this.cdr.markForCheck();
    }, 0);
  }

  /**
   * Store raw input text when user types in termination date field
   */
  onTerminationDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.terminationDateRawInput = input.value;
  }

  /**
   * Restore invalid text when Material clears it on blur and validate
   */
  onTerminationDateBlur(input: HTMLInputElement): void {
    // Use setTimeout to run after Material's blur handling
    setTimeout(() => {
      const control = this.filterForm.get('terminationDate');
      const inputValue = input.value?.trim() || '';

      // If control has no value but we have raw input, restore it
      if (!control?.value && this.terminationDateRawInput && !input.value) {
        input.value = this.terminationDateRawInput;
      }

      // If there's input text but no parsed value, try to manually parse it
      if (inputValue && !control?.value) {
        const formats = Array.isArray(DD_MON_YYYY_FORMATS.parse.dateInput)
          ? DD_MON_YYYY_FORMATS.parse.dateInput
          : [DD_MON_YYYY_FORMATS.parse.dateInput];

        const parsed = this.dateAdapter.parse(inputValue, formats);

        if (parsed?.isValid()) {
          // Successfully parsed - set the value and update the input display
          control?.setValue(parsed);
          input.value = this.dateAdapter.format(parsed, DD_MON_YYYY_FORMATS.display.dateInput);
        } else if (control) {
          // Failed to parse - set invalid error
          control.setErrors({ ...control.errors, invalidDate: true });
          control.markAsTouched();
        }
      } else if (control?.hasError('invalidDate') && (!inputValue || control?.value)) {
        // Clear custom error if input is empty or has valid value
        const errors = { ...control.errors };
        delete errors['invalidDate'];
        control.setErrors(Object.keys(errors).length > 0 ? errors : null);
      }

      this.cdr.markForCheck();
    }, 0);
  }
}
