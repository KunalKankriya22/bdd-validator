import { Component, ChangeDetectionStrategy, ChangeDetectorRef, EventEmitter, inject, Input, OnDestroy, OnInit, Output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DATE_FORMATS, DateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { Subject, takeUntil, distinctUntilChanged } from 'rxjs';
import moment, { Moment } from 'moment';

import { LabTestFilterValue } from '../models/lab-tests.model';
import { LabTestsApiService } from '../services/lab-tests-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { dateFormatValidator } from 'src/app/core/utils/date-adapter.util';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';

/**
 * Custom MomentDateAdapter for Lab Tests Filter Panel
 * Extends MomentDateAdapter to override today() method to use chapter local date
 */
class LabTestsFilterDateAdapter extends MomentDateAdapter {
  constructor(
    dateLocale: string,
    private chapterService: ChapterTimezoneService
  ) {
    super(dateLocale);
  }

  /**
   * Override today() to return chapter local date for datepicker highlighting
   * This ensures filter date pickers highlight the same date as the main component
   */
  override today(): Moment {
    try {
      if (this.chapterService && this.chapterService.isChapterLocalDateAvailable()) {
        const chapterMoment = this.chapterService.getChapterLocalDate();
        if (chapterMoment && chapterMoment.isValid()) {
          return chapterMoment.clone().startOf('day');
        }
      }
    } catch (error) {
      // Fallback to system date
    }
    return super.today();
  }
}

@Component({
  selector: 'app-lab-tests-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatInputModule,
    NgxMatSelectSearchModule
  ],
  templateUrl: './lab-tests-filter-panel.html',
  styleUrls: ['./lab-tests-filter-panel.scss'],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    {
      provide: DateAdapter,
      useFactory: (dateLocale: string, chapterService: ChapterTimezoneService) => {
        return new LabTestsFilterDateAdapter(dateLocale, chapterService);
      },
      deps: [MAT_DATE_LOCALE, ChapterTimezoneService]
    }
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LabTestsFilterPanel implements OnInit, OnDestroy {
  @Input() currentFilters: LabTestFilterValue | null = null;
  @Input() maxHeight: number | null = null;
  @Input() testId: string | null = null;
  @Output() apply = new EventEmitter<LabTestFilterValue>();
  @Output() close = new EventEmitter<void>();

  private readonly service = inject(LabTestsApiService);
  private readonly snackbarService = inject(SnackbarService);
  private destroy$ = new Subject<void>();

  filterForm!: FormGroup;

  initialRepeatOptions: { value: string; display: string }[] = [
    { value: 'I', display: 'I - Initial' },
    { value: 'R', display: 'R - Repeat' }
  ];

  interdictionCodeOptionsSignal = signal<{ value: string; display: string }[]>([]);

  periodOptions: { value: string; display: string }[] = [
    { value: 'After', display: 'After' },
    { value: 'Before', display: 'Before' }
  ];

  // Search controls
  readonly interdictionSearchControl = new FormControl('');

  // Search signals
  readonly interdictionSearch = signal('');

  // Filtered options
  readonly filteredInterdictionCodes = computed(() => {
    const search = this.interdictionSearch().toLowerCase();
    const options = this.interdictionCodeOptionsSignal();
    if (!search) return options;
    return options.filter(opt => opt.display.toLowerCase().includes(search));
  });

  constructor(private fb: FormBuilder, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadFilterValues();

    if (this.currentFilters) {
      this.filterForm.patchValue({
        initialRepeat: this.currentFilters.initialRepeat || null,
        interdictionCode: this.currentFilters.interdictionCode || null,
        effectiveDatePeriod: this.currentFilters.effectiveDatePeriod || null,
        effectiveDate: this.currentFilters.effectiveDate ? new Date(this.currentFilters.effectiveDate) : null,
        terminationDatePeriod: this.currentFilters.terminationDatePeriod || null,
        terminationDate: this.currentFilters.terminationDate ? new Date(this.currentFilters.terminationDate) : null
      });
    }

    this.setupValidation();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.filterForm = this.fb.group({
      initialRepeat: [null],
      interdictionCode: [null],
      effectiveDatePeriod: [null],
      effectiveDate: [null, [dateFormatValidator()]],
      terminationDatePeriod: [null],
      terminationDate: [null, [dateFormatValidator()]]
    });
  }

  private setupValidation(): void {
    // Watch effective date changes
    this.filterForm.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateEffectiveDatePeriod();
        this.cdr.markForCheck();
      });

    // Watch effective date period changes
    this.filterForm.get('effectiveDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateEffectiveDatePeriod();
        this.cdr.markForCheck();
      });

    // Watch termination date changes
    this.filterForm.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateTerminationDatePeriod();
        this.cdr.markForCheck();
      });

    // Watch termination date period changes
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
    const control = this.filterForm.get('effectiveDatePeriod');

    if (effectiveDate && !effectiveDatePeriod) {
      control?.setErrors({ required: true });
      control?.markAsTouched();
    } else {
      control?.setErrors(null);
    }
  }

  private validateTerminationDatePeriod(): void {
    const terminationDate = this.filterForm.get('terminationDate')?.value;
    const terminationDatePeriod = this.filterForm.get('terminationDatePeriod')?.value;
    const control = this.filterForm.get('terminationDatePeriod');

    if (terminationDate && !terminationDatePeriod) {
      control?.setErrors({ required: true });
      control?.markAsTouched();
    } else {
      control?.setErrors(null);
    }
  }

  private loadFilterValues(): void {
    // Only load interdiction codes if testId is provided
    if (this.testId) {
      this.service.getInterdictionCodesByTestId(this.testId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (options) => {
            this.interdictionCodeOptionsSignal.set(options);
            this.cdr.markForCheck();
          },
          error: () => {
            this.snackbarService.showError('Failed to load interdiction codes.');
          }
        });
    } else {
      // If no test ID, clear the options
      this.interdictionCodeOptionsSignal.set([]);
    }

    // Subscribe to search control changes - no debounce, works with 1 character
    this.interdictionSearchControl.valueChanges
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(value => this.interdictionSearch.set(value?.trim() || ''));
  }

  onEffectiveDateInput(event: Event): void {
    const inputValue = (event.target as HTMLInputElement).value;
    const control = this.filterForm.get('effectiveDate');

    // Mark as both dirty and touched so errors will display immediately
    control?.markAsDirty();
    control?.markAsTouched();

    // Handle optional date input (don't set required error)
    DateFieldValidationUtility.handleEndDateInput(
      inputValue,
      control,
      false // Not in edit mode
    );

    // Trigger change detection to show errors immediately
    this.cdr.markForCheck();
  }

  onEffectiveDateBlur(): void {
    const control = this.filterForm.get('effectiveDate');

    // Only mark as touched if field has value or had interaction
    if (control?.value || control?.dirty) {
      control?.markAsTouched();
    }

    this.validateEffectiveDatePeriod();
    this.cdr.markForCheck();
  }

  onTerminationDateInput(event: Event): void {
    const inputValue = (event.target as HTMLInputElement).value;
    const control = this.filterForm.get('terminationDate');

    // Mark as both dirty and touched so errors will display immediately
    control?.markAsDirty();
    control?.markAsTouched();

    DateFieldValidationUtility.handleEndDateInput(
      inputValue,
      control,
      false // Not in edit mode
    );

    // Trigger change detection to show errors immediately
    this.cdr.markForCheck();
  }

  onTerminationDateBlur(): void {
    const control = this.filterForm.get('terminationDate');

    // Only mark as touched if field has value or had interaction
    if (control?.value || control?.dirty) {
      control?.markAsTouched();
    }

    this.validateTerminationDatePeriod();
    this.cdr.markForCheck();
  }

  getEffectiveDatePeriodError(): string {
    const control = this.filterForm.get('effectiveDatePeriod');
    if (control?.hasError('required') && control?.touched) {
      return 'Period is required';
    }
    return '';
  }

  getTerminationDatePeriodError(): string {
    const control = this.filterForm.get('terminationDatePeriod');
    if (control?.hasError('required') && control?.touched) {
      return 'Period is required';
    }
    return '';
  }

  getEffectiveDateError(): string {
    const control = this.filterForm.get('effectiveDate');
    if (!control || !(control.touched || control.dirty)) {
      return '';
    }

    // Skip required error - date is optional in filter
    // Only show format/validity errors
    if (control.hasError('invalidDateFormat') ||
        control.hasError('invalidDate') ||
        control.hasError('matDatepickerParse')) {
      return 'Effective Date is invalid';
    }

    return '';
  }

  getTerminationDateError(): string {
    const control = this.filterForm.get('terminationDate');
    if (!control || !(control.touched || control.dirty)) {
      return '';
    }

    // Skip required error - date is optional in filter
    // Only show format/validity errors
    if (control.hasError('invalidDateFormat') ||
        control.hasError('invalidDate') ||
        control.hasError('matDatepickerParse')) {
      return 'Termination Date is invalid';
    }

    return '';
  }

  get isApplyDisabled(): boolean {
    const formValue = this.filterForm?.value;
    if (!formValue) {
      return true;
    }

    if (this.hasValidationErrors) {
      return true;
    }

    // Period without a date is not a meaningful filter
    const effectiveDateIncomplete = formValue.effectiveDatePeriod !== null && !formValue.effectiveDate;
    const terminationDateIncomplete = formValue.terminationDatePeriod !== null && !formValue.terminationDate;
    if (effectiveDateIncomplete || terminationDateIncomplete) {
      return true;
    }

    // At least one meaningful value must be selected (period alone does not count)
    const hasAnyValue =
      formValue.initialRepeat !== null ||
      formValue.interdictionCode !== null ||
      formValue.effectiveDate !== null ||
      formValue.terminationDate !== null;

    return !hasAnyValue;
  }

  get hasValidationErrors(): boolean {
    const effectiveDateControl = this.filterForm.get('effectiveDate');
    const terminationDateControl = this.filterForm.get('terminationDate');
    const effectiveDateHasError = effectiveDateControl?.hasError('invalidDateFormat') ||
                                  effectiveDateControl?.hasError('matDatepickerParse') ||
                                  effectiveDateControl?.hasError('invalidDate');
    const terminationDateHasError = terminationDateControl?.hasError('invalidDateFormat') ||
                                    terminationDateControl?.hasError('matDatepickerParse') ||
                                    terminationDateControl?.hasError('invalidDate');

    return this.filterForm.get('effectiveDatePeriod')?.invalid ||
           this.filterForm.get('terminationDatePeriod')?.invalid ||
           effectiveDateHasError ||
           terminationDateHasError ||
           false;
  }

  onApply(): void {
    const formValue = this.filterForm.value;

    const filters: LabTestFilterValue = {
      initialRepeat: formValue.initialRepeat || null,
      interdictionCode: formValue.interdictionCode || null,
      effectiveDatePeriod: formValue.effectiveDatePeriod || null,
      effectiveDate: DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate),
      terminationDatePeriod: formValue.terminationDatePeriod || null,
      terminationDate: DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate)
    };

    this.apply.emit(filters);
  }

  onClear(): void {
    this.filterForm.reset({
      initialRepeat: null,
      interdictionCode: null,
      effectiveDatePeriod: null,
      effectiveDate: null,
      terminationDatePeriod: null,
      terminationDate: null
    });
    this.cdr.markForCheck();
  }

  onClose(): void {
    this.close.emit();
  }
}
