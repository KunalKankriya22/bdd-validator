import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  ChangeDetectionStrategy,
  Input,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { CustomDateAdapter, DD_MMM_YYYY_FORMAT, dateFormatValidator } from 'src/app/core/utils/date-adapter.util';

export interface ChapterFilterValue {
  effectivePeriod: string | null;
  effectiveDate: Date | null;
  terminationPeriod: string | null;
  terminationDate: Date | null;
}

@Component({
  selector: 'app-chapter-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatInputModule
  ],
  providers: [
    { provide: DateAdapter, useClass: CustomDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MMM_YYYY_FORMAT }
  ],
  templateUrl: './chapter-filter-panel.html',
  styleUrls: ['./chapter-filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChapterFilterPanel implements OnInit {
  @Input() currentFilters: ChapterFilterValue | null = null;
  @Output() apply = new EventEmitter<ChapterFilterValue>();
  @Output() close = new EventEmitter<void>();

  filterForm!: FormGroup;
  hasEffectivePeriodError = false;
  hasTerminationPeriodError = false;

  // Store raw input text to preserve invalid dates
  private effectiveDateRawInput = '';
  private terminationDateRawInput = '';

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      effectivePeriod: [this.currentFilters?.effectivePeriod || null],
      effectiveDate: [this.currentFilters?.effectiveDate || null, [dateFormatValidator()]],
      terminationPeriod: [this.currentFilters?.terminationPeriod || null],
      terminationDate: [this.currentFilters?.terminationDate || null, [dateFormatValidator()]]
    });

    // Setup validation listeners for effective date
    this.filterForm.get('effectiveDate')?.valueChanges.subscribe((date) => {
      const control = this.filterForm.get('effectiveDate');
      if (control && !control.touched) {
        control.markAsTouched();
      }
      setTimeout(() => {
        this.validateEffectivePeriod();
        this.cdr.markForCheck();
      }, 0);
    });

    this.filterForm.get('effectivePeriod')?.valueChanges.subscribe(() => {
      this.validateEffectivePeriod();
      this.cdr.markForCheck();
    });

    // Setup validation listeners for termination date
    this.filterForm.get('terminationDate')?.valueChanges.subscribe((date) => {
      const control = this.filterForm.get('terminationDate');
      if (control && !control.touched) {
        control.markAsTouched();
      }
      setTimeout(() => {
        this.validateTerminationPeriod();
        this.cdr.markForCheck();
      }, 0);
    });

    this.filterForm.get('terminationPeriod')?.valueChanges.subscribe(() => {
      this.validateTerminationPeriod();
      this.cdr.markForCheck();
    });
  }

  private validateEffectivePeriod(): void {
    const effectiveDate = this.filterForm.get('effectiveDate')?.value;
    const effectivePeriod = this.filterForm.get('effectivePeriod')?.value;
    const effectivePeriodControl = this.filterForm.get('effectivePeriod');

    if (effectiveDate && !effectivePeriod) {
      effectivePeriodControl?.setErrors({ required: true });
      effectivePeriodControl?.markAsTouched();
      this.hasEffectivePeriodError = true;
    } else {
      effectivePeriodControl?.setErrors(null);
      this.hasEffectivePeriodError = false;
    }
    this.cdr.markForCheck();
  }

  private validateTerminationPeriod(): void {
    const terminationDate = this.filterForm.get('terminationDate')?.value;
    const terminationPeriod = this.filterForm.get('terminationPeriod')?.value;
    const terminationPeriodControl = this.filterForm.get('terminationPeriod');

    if (terminationDate && !terminationPeriod) {
      terminationPeriodControl?.setErrors({ required: true });
      terminationPeriodControl?.markAsTouched();
      this.hasTerminationPeriodError = true;
    } else {
      terminationPeriodControl?.setErrors(null);
      this.hasTerminationPeriodError = false;
    }
    this.cdr.markForCheck();
  }

  get isApplyDisabled(): boolean {
    // Check if there are validation errors
    if (this.hasEffectivePeriodError || this.hasTerminationPeriodError) {
      return true;
    }

    // Check for invalid date format errors
    const effectiveDateControl = this.filterForm.get('effectiveDate');
    const terminationDateControl = this.filterForm.get('terminationDate');
    if (effectiveDateControl?.hasError('invalidDateFormat') ||
        effectiveDateControl?.hasError('matDatepickerParse') ||
        terminationDateControl?.hasError('invalidDateFormat') ||
        terminationDateControl?.hasError('matDatepickerParse')) {
      return true;
    }

    // Check if at least one field has a value
    const values = this.filterForm.value;
    const hasEffectiveDate = values?.effectivePeriod || values?.effectiveDate;
    const hasTerminationDate = values?.terminationPeriod || values?.terminationDate;

    return !(hasEffectiveDate || hasTerminationDate);
  }

  onApply(): void {
    // Validate period fields
    this.validateEffectivePeriod();
    this.validateTerminationPeriod();

    // Mark all as touched to show errors
    this.filterForm.markAllAsTouched();

    // Don't submit if form is invalid
    if (this.filterForm.invalid || this.hasEffectivePeriodError || this.hasTerminationPeriodError) {
      this.cdr.markForCheck();
      return;
    }

    const formValue = this.filterForm.value;

    const filters: ChapterFilterValue = {
      effectivePeriod: formValue.effectivePeriod || null,
      effectiveDate: formValue.effectiveDate,
      terminationPeriod: formValue.terminationPeriod || null,
      terminationDate: formValue.terminationDate
    };

    this.apply.emit(filters);
  }

  onClear(): void {
    this.filterForm.reset({
      effectivePeriod: null,
      effectiveDate: null,
      terminationPeriod: null,
      terminationDate: null
    });
    this.hasEffectivePeriodError = false;
    this.hasTerminationPeriodError = false;
    this.effectiveDateRawInput = '';
    this.terminationDateRawInput = '';

    // Clear all control errors
    this.filterForm.get('effectivePeriod')?.setErrors(null);
    this.filterForm.get('terminationPeriod')?.setErrors(null);

    this.cdr.markForCheck();
  }

  onClose(): void {
    this.close.emit();
  }

  /**
   * Store raw input text when user types in effective date field
   */
  onEffectiveDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.effectiveDateRawInput = input.value;
    // Set invalidDateFormat error when input has text but control value is null (unparseable)
    setTimeout(() => {
      const control = this.filterForm.get('effectiveDate');
      if (control && !control.value && input.value.trim()) {
        control.setErrors({ invalidDateFormat: true });
        control.markAsTouched();
        this.cdr.markForCheck();
      }
    }, 0);
  }

  /**
   * Restore invalid text when Material clears it on blur
   */
  onEffectiveDateBlur(input: HTMLInputElement): void {
    setTimeout(() => {
      const control = this.filterForm.get('effectiveDate');
      if (!control?.value && this.effectiveDateRawInput && !input.value) {
        input.value = this.effectiveDateRawInput;
      }
    }, 0);
  }

  /**
   * Store raw input text when user types in termination date field
   */
  onTerminationDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.terminationDateRawInput = input.value;
    // Set invalidDateFormat error when input has text but control value is null (unparseable)
    setTimeout(() => {
      const control = this.filterForm.get('terminationDate');
      if (control && !control.value && input.value.trim()) {
        control.setErrors({ invalidDateFormat: true });
        control.markAsTouched();
        this.cdr.markForCheck();
      }
    }, 0);
  }

  /**
   * Restore invalid text when Material clears it on blur
   */
  onTerminationDateBlur(input: HTMLInputElement): void {
    setTimeout(() => {
      const control = this.filterForm.get('terminationDate');
      if (!control?.value && this.terminationDateRawInput && !input.value) {
        input.value = this.terminationDateRawInput;
      }
    }, 0);
  }
}
