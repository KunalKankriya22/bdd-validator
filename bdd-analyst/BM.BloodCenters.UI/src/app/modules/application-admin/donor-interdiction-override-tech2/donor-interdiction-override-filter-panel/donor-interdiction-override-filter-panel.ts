import {
  Component,
  EventEmitter,
  Output,
  Input,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DATE_FORMATS, DateAdapter } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { dateFormatValidator } from 'src/app/core/utils/date-adapter.util';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import moment from 'moment';
import { DonorInterdictionOverrideFilterValue } from '../models/donor-interdiction-override.model';

@Component({
  selector: 'app-donor-interdiction-override-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    NgxMatSelectSearchModule
  ],
  templateUrl: './donor-interdiction-override-filter-panel.html',
  styleUrls: ['./donor-interdiction-override-filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
})
export class DonorInterdictionOverrideFilterPanel implements OnInit, OnDestroy {
  @Input() currentFilters: DonorInterdictionOverrideFilterValue | null = null;
  @Input() cueOptions: Array<{ code: string; display: string }> = [];
  @Input() typeOptions: Array<{ code: string; display: string }> = [];

  @Output() apply = new EventEmitter<DonorInterdictionOverrideFilterValue>();
  @Output() close = new EventEmitter<void>();

  filterForm!: FormGroup;

  // Search controls for Cue and Type
  allCueOptions: Array<{ code: string; display: string }> = [];
  filteredCueOptions: Array<{ code: string; display: string }> = [];
  cueSearchControl = new FormControl('');

  allTypeOptions: Array<{ code: string; display: string }> = [];
  filteredTypeOptions: Array<{ code: string; display: string }> = [];
  typeSearchControl = new FormControl('');

  periodOptions: { value: string; display: string }[] = [
    { value: 'after', display: 'After' },
    { value: 'before', display: 'Before' }
  ];

  effectivePeriodRequired = false;
  terminationPeriodRequired = false;
  effectiveDateRequired = false;
  terminationDateRequired = false;

  // Store raw input text to preserve invalid dates
  private effectiveDateRawInput = '';
  private terminationDateRawInput = '';

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Initialize search options
    this.allCueOptions = [...this.cueOptions];
    this.filteredCueOptions = [...this.cueOptions];
    this.allTypeOptions = [...this.typeOptions];
    this.filteredTypeOptions = [...this.typeOptions];

    // Setup search functionality
    this.setupCueSearch();
    this.setupTypeSearch();

    this.filterForm = this.fb.group({
      donorDecisionCode: [this.currentFilters?.donorDecisionCode || null],
      interType: [this.currentFilters?.interType || null],
      periodEffDate: [this.currentFilters?.periodEffDate || null],
      effectiveDate: [this.currentFilters?.effectiveDate ? new Date(this.currentFilters.effectiveDate) : null, [dateFormatValidator()]],
      periodTermDate: [this.currentFilters?.periodTermDate || null],
      terminationDate: [this.currentFilters?.terminationDate ? new Date(this.currentFilters.terminationDate) : null, [dateFormatValidator()]]
    });

    // Add immediate validation on date changes
    this.filterForm.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Mark field as touched when user types to show validation errors
        const control = this.filterForm.get('effectiveDate');
        if (control && !control.touched) {
          control.markAsTouched();
        }
        setTimeout(() => {
          this.validateEffectivePeriod();
          this.cdr.markForCheck();
        }, 0);
      });

    this.filterForm.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Mark field as touched when user types to show validation errors
        const control = this.filterForm.get('terminationDate');
        if (control && !control.touched) {
          control.markAsTouched();
        }
        setTimeout(() => {
          this.validateTerminationPeriod();
          this.cdr.markForCheck();
        }, 0);
      });

    // Clear errors when period is selected
    this.filterForm.get('periodEffDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateEffectivePeriod();
        this.cdr.markForCheck();
      });

    this.filterForm.get('periodTermDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateTerminationPeriod();
        this.cdr.markForCheck();
      });
  }

  /**
   * Setup Cue search
   */
  private setupCueSearch(): void {
    this.cueSearchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((search: string | null) => {
        const previousLength = this.filteredCueOptions.length;

        if (search && search.length >= 1) {
          this.filteredCueOptions = this.allCueOptions.filter(o =>
            o.code.toLowerCase().includes(search.toLowerCase()) ||
            o.display.toLowerCase().includes(search.toLowerCase())
          );
        } else {
          this.filteredCueOptions = [...this.allCueOptions];
        }

        // Only trigger change detection if the filtered options actually changed
        if (this.filteredCueOptions.length !== previousLength) {
          this.cdr.markForCheck();
        }
      });
  }

  /**
   * Setup Type search
   */
  private setupTypeSearch(): void {
    this.typeSearchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((search: string | null) => {
        const previousLength = this.filteredTypeOptions.length;

        if (search && search.length >= 1) {
          this.filteredTypeOptions = this.allTypeOptions.filter(o =>
            o.code.toLowerCase().includes(search.toLowerCase()) ||
            o.display.toLowerCase().includes(search.toLowerCase())
          );
        } else {
          this.filteredTypeOptions = [...this.allTypeOptions];
        }

        if (this.filteredTypeOptions.length !== previousLength) {
          this.cdr.markForCheck();
        }
      });
  }

  validateEffectivePeriod(): void {
    const date = this.filterForm.get('effectiveDate')?.value;
    const period = this.filterForm.get('periodEffDate')?.value;
    // Period is required when date is filled
    this.effectivePeriodRequired = !!date && !period;
    // Date is required when period is filled
    this.effectiveDateRequired = !!period && !date;
  }

  validateTerminationPeriod(): void {
    const date = this.filterForm.get('terminationDate')?.value;
    const period = this.filterForm.get('periodTermDate')?.value;
    // Period is required when date is filled
    this.terminationPeriodRequired = !!date && !period;
    // Date is required when period is filled
    this.terminationDateRequired = !!period && !date;
  }

  get isApplyDisabled(): boolean {
    // Check if there are validation errors (period without date or date without period)
    if (this.effectivePeriodRequired || this.terminationPeriodRequired ||
        this.effectiveDateRequired || this.terminationDateRequired) {
      return true;
    }

    // Check for date format validation errors
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
    const hasCue = values?.donorDecisionCode !== null && values?.donorDecisionCode !== undefined;
    const hasInterType = values?.interType !== null && values?.interType !== undefined;
    // Both period AND date must be filled for effective/termination dates
    const hasEffectiveDate = values?.periodEffDate && values?.effectiveDate;
    const hasTerminationDate = values?.periodTermDate && values?.terminationDate;

    return !(hasCue || hasInterType || hasEffectiveDate || hasTerminationDate);
  }

  onApply(): void {
    const formValue = this.filterForm.value;
    const filters: DonorInterdictionOverrideFilterValue = {};

    if (formValue.donorDecisionCode) {
      filters.donorDecisionCode = formValue.donorDecisionCode;
      const cueOption = this.allCueOptions.find(o => o.code === formValue.donorDecisionCode);
      filters.donorDecisionCodeDisplay = cueOption?.display || formValue.donorDecisionCode;
    }

    if (formValue.interType) {
      filters.interType = formValue.interType;
      const typeOption = this.allTypeOptions.find(o => o.code === formValue.interType);
      filters.interTypeDisplay = typeOption?.display || formValue.interType;
    }

    if (formValue.effectiveDate) {
      filters.effectiveDate = this.convertToUTCDate(formValue.effectiveDate)?.toISOString();
    }

    if (formValue.periodEffDate) {
      filters.periodEffDate = formValue.periodEffDate;
    }

    if (formValue.terminationDate) {
      filters.terminationDate = this.convertToUTCDate(formValue.terminationDate)?.toISOString();
    }

    if (formValue.periodTermDate) {
      filters.periodTermDate = formValue.periodTermDate;
    }

    this.apply.emit(filters);
  }

  onClearAll(): void {
    this.filterForm.reset({
      donorDecisionCode: null,
      interType: null,
      periodEffDate: null,
      effectiveDate: null,
      periodTermDate: null,
      terminationDate: null
    });
    this.effectiveDateRawInput = '';
    this.terminationDateRawInput = '';
    this.effectivePeriodRequired = false;
    this.terminationPeriodRequired = false;
    this.effectiveDateRequired = false;
    this.terminationDateRequired = false;

    // Reset search controls and options
    this.cueSearchControl.setValue('', { emitEvent: false });
    this.filteredCueOptions = [...this.allCueOptions];
    this.typeSearchControl.setValue('', { emitEvent: false });
    this.filteredTypeOptions = [...this.allTypeOptions];

    this.cdr.markForCheck();
  }

  onClose(): void {
    this.close.emit();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Convert Moment date to UTC Date at midnight
   * This ensures the selected date is preserved regardless of timezone
   */
  private convertToUTCDate(date: moment.Moment | Date | null): Date | null {
    if (!date) return null;

    // Handle moment.Moment objects
    if (moment.isMoment(date)) {
      return new Date(Date.UTC(
        date.year(),
        date.month(),
        date.date(),
        0, 0, 0, 0
      ));
    }

    // Handle Date objects
    return new Date(Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      0, 0, 0, 0
    ));
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
