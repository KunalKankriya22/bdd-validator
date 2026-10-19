import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  Input,
  ChangeDetectorRef,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';
import { Moment } from 'moment';
import { HlaAntigenFilterValue } from '../models/hla-antigens.model';
import { HlaAntigensService } from '../services/hla-antigens.service';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { dateFormatValidator } from 'src/app/core/utils/date-adapter.util';

@Component({
  selector: 'app-hla-antigens-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatMomentDateModule,
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }
  ],
  templateUrl: './hla-antigens-filter-panel.html',
  styleUrls: ['./hla-antigens-filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HlaAntigensFilterPanel implements OnInit, OnDestroy {
  private readonly hlaAntigensService = inject(HlaAntigensService);
  private readonly destroy$ = new Subject<void>();

  @Input() currentFilters: HlaAntigenFilterValue | null = null;
  @Output() apply = new EventEmitter<HlaAntigenFilterValue>();
  @Output() close = new EventEmitter<void>();

  filterForm!: FormGroup;

  // Dropdown options loaded from API
  epitopeIds: string[] = [];
  epitopeSuperIds: string[] = [];

  // Search controls
  antigenSearchControl = new FormControl('');
  associatedAntigenSearchControl = new FormControl('');

  // Filtered options
  filteredEpitopeIds: string[] = [];
  filteredEpitopeSuperIds: string[] = [];

  // Period validation errors
  effectiveDatePeriodError = '';
  terminationDatePeriodError = '';

  // Store raw input text to preserve invalid dates
  private effectiveDateRawInput = '';
  private terminationDateRawInput = '';

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private dateAdapter: DateAdapter<Moment>
  ) { }

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      antigen: [this.currentFilters?.antigen || null],
      associatedAntigen: [this.currentFilters?.associatedAntigen || null],
      effectiveDatePeriod: [this.currentFilters?.effectiveDatePeriod || null],
      effectiveDate: [this.currentFilters?.effectiveDate || null, [dateFormatValidator()]],
      terminationDatePeriod: [this.currentFilters?.terminationDatePeriod || null],
      terminationDate: [this.currentFilters?.terminationDate || null, [dateFormatValidator()]]
    });

    this.setupPeriodValidation();
    this.loadEpitopeIds();
    this.loadEpitopeSuperIds();
    this.setupSearchFilters();

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

  /**
   * Load epitope IDs from API
   */
  private loadEpitopeIds(): void {
    this.hlaAntigensService.getEpitopeIds()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (ids) => {
          this.epitopeIds = ids;
          this.filteredEpitopeIds = ids;
          this.cdr.markForCheck();
        },
        error: (error) => {
        }
      });
  }

  /**
   * Load epitope super IDs from API
   */
  private loadEpitopeSuperIds(): void {
    this.hlaAntigensService.getEpitopeSuperIds()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (ids) => {
          this.epitopeSuperIds = ids;
          this.filteredEpitopeSuperIds = ids;
          this.cdr.markForCheck();
        },
        error: (error) => {
        }
      });
  }

  /**
   * Setup search filtering for dropdowns
   */
  private setupSearchFilters(): void {
    // Antigen search
    this.antigenSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.filterAntigenOptions();
      });

    // Associated Antigen search
    this.associatedAntigenSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.filterAssociatedAntigenOptions();
      });
  }

  /**
   * Filter antigen options based on search text
   */
  private filterAntigenOptions(): void {
    const searchTerm = (this.antigenSearchControl.value || '').toLowerCase().trim();
    if (!searchTerm) {
      this.filteredEpitopeIds = this.epitopeIds;
    } else {
      this.filteredEpitopeIds = this.epitopeIds.filter(id =>
        id.toLowerCase().includes(searchTerm)
      );
    }
  }

  /**
   * Filter associated antigen options based on search text
   */
  private filterAssociatedAntigenOptions(): void {
    const searchTerm = (this.associatedAntigenSearchControl.value || '').toLowerCase().trim();
    if (!searchTerm) {
      this.filteredEpitopeSuperIds = this.epitopeSuperIds;
    } else {
      this.filteredEpitopeSuperIds = this.epitopeSuperIds.filter(id =>
        id.toLowerCase().includes(searchTerm)
      );
    }
  }

  /**
   * Handle filter application
   */
  onApply(): void {
    // Validate before applying
    this.validateEffectiveDatePeriod();
    this.validateTerminationDatePeriod();

    if (this.effectiveDatePeriodError || this.terminationDatePeriodError) {
      return;
    }

    const formValue = this.filterForm.value;

    const filters: HlaAntigenFilterValue = {
      antigen: formValue.antigen || null,
      associatedAntigen: formValue.associatedAntigen || null,
      effectiveDatePeriod: formValue.effectiveDatePeriod || null,
      effectiveDate: formValue.effectiveDate || null,
      terminationDatePeriod: formValue.terminationDatePeriod || null,
      terminationDate: formValue.terminationDate || null
    };

    this.apply.emit(filters);
  }

  /**
   * Clear all filters
   */
  onClearAll(): void {
    this.filterForm.reset({
      antigen: null,
      associatedAntigen: null,
      effectiveDatePeriod: null,
      effectiveDate: null,
      terminationDatePeriod: null,
      terminationDate: null
    });
    this.effectiveDatePeriodError = '';
    this.terminationDatePeriodError = '';
    this.effectiveDateRawInput = '';
    this.terminationDateRawInput = '';

    // Clear all control errors
    this.filterForm.get('effectiveDatePeriod')?.setErrors(null);
    this.filterForm.get('terminationDatePeriod')?.setErrors(null);

    this.cdr.markForCheck();
  }

  /**
   * Close filter panel
   */
  onClose(): void {
    this.close.emit();
  }

  /**
   * Check if Apply button should be disabled
   */
  get isApplyDisabled(): boolean {
    const formValue = this.filterForm.value;

    // Check if there are any period validation errors
    if (this.effectiveDatePeriodError || this.terminationDatePeriodError) {
      return true;
    }

    // Check for invalid date format errors
    const effectiveDateControl = this.filterForm.get('effectiveDate');
    const terminationDateControl = this.filterForm.get('terminationDate');

    if (effectiveDateControl?.hasError('invalidDate') ||
        effectiveDateControl?.hasError('invalidDateFormat') ||
        effectiveDateControl?.hasError('matDatepickerParse')) {
      return true;
    }

    if (terminationDateControl?.hasError('invalidDate') ||
        terminationDateControl?.hasError('invalidDateFormat') ||
        terminationDateControl?.hasError('matDatepickerParse')) {
      return true;
    }

    // Check if at least one field has a value
    const hasAnyValue =
      (formValue.antigen !== null && formValue.antigen !== '') ||
      (formValue.associatedAntigen !== null && formValue.associatedAntigen !== '') ||
      formValue.effectiveDate !== null ||
      formValue.terminationDate !== null;

    return !hasAnyValue;
  }

  /**
   * Parse input date string using configured date formats
   */
  private parseInputDate(inputValue: string): Moment | null {
    const formats = Array.isArray(DD_MON_YYYY_FORMATS.parse.dateInput)
      ? DD_MON_YYYY_FORMATS.parse.dateInput
      : [DD_MON_YYYY_FORMATS.parse.dateInput];
    return this.dateAdapter.parse(inputValue, formats);
  }

  /**
   * Store raw input text when user types in effective date field
   */
  onEffectiveDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.effectiveDateRawInput = input.value;
    const control = this.filterForm.get('effectiveDate');
    if (input.value?.trim()) {
      control?.markAsTouched();
      control?.markAsDirty();
      if (!control?.value) {
        control?.setErrors({ ...control.errors, invalidDate: true });
      }
    }
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
        const parsed = this.parseInputDate(inputValue);

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
    const control = this.filterForm.get('terminationDate');
    if (input.value?.trim()) {
      control?.markAsTouched();
      control?.markAsDirty();
      if (!control?.value) {
        control?.setErrors({ ...control.errors, invalidDate: true });
      }
    }
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
        const parsed = this.parseInputDate(inputValue);

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
