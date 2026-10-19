import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  Input,
  ChangeDetectorRef,
  signal,
  computed,
  Injectable,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { CustomDateAdapter, DD_MMM_YYYY_FORMAT, dateFormatValidator } from 'src/app/core/utils/date-adapter.util';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { A11yModule } from '@angular/cdk/a11y';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil, startWith } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

import { ReturnReasonsFilterValue } from '../models/return-reasons.model';
import { FilterPanelBase } from '@shared/components/filter-panel-base/filter-panel-base';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';

/**
 * Custom DateAdapter that uses Chapter's local date as "today"
 * instead of system date
 */
@Injectable()
export class ChapterDateAdapter extends CustomDateAdapter {
  private chapterService: ChapterTimezoneService | null = null;

  setChapterTimezoneService(service: ChapterTimezoneService): void {
    this.chapterService = service;
  }

  override today(): Date {
    if (this.chapterService) {
      const chapterDate = this.chapterService.getChapterLocalDate();
      if (chapterDate && chapterDate.isValid()) {
        return chapterDate.toDate();
      }
    }
    return super.today();
  }
}

@Component({
  selector: 'app-return-reasons-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatSelectModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    A11yModule,
    FilterPanelBase,
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: DateAdapter, useClass: ChapterDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MMM_YYYY_FORMAT }
  ],
  templateUrl: './return-reasons-filter-panel.html',
  styleUrls: ['./return-reasons-filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReturnReasonsFilterPanel implements OnInit, OnDestroy {
  @Input() currentFilters: ReturnReasonsFilterValue | null = null;
  @Input() locationTypeOptions: string[] = [];
  @Output() apply = new EventEmitter<ReturnReasonsFilterValue>();
  @Output() close = new EventEmitter<void>();

  filterForm!: FormGroup;
  crNcrOptions: string[] = ['Yes', 'No'];
  enforceOptions: string[] = ['Yes', 'No'];
  periodOptions: string[] = ['After', 'Before'];

  // Search controls for dropdowns
  locationTypeSearchCtrl = new FormControl('');

  // Signals for filtered options
  locationTypeOptionsSignal = signal<string[]>([]);

  // Convert FormControl values to signals
  locationTypeSearchSignal = toSignal(this.locationTypeSearchCtrl.valueChanges.pipe(startWith('')), { initialValue: '' });

  filteredLocationTypeOptions = computed(() => {
    const searchTerm = this.locationTypeSearchSignal()?.toLowerCase() || '';
    const options = this.locationTypeOptionsSignal();
    if (!searchTerm) return options;
    return options.filter(option => option.toLowerCase().includes(searchTerm));
  });

  minDate = DateFieldValidationUtility.getMinDate();

  /** Tracks which date field was last changed — cross-field error shows only on that field */
  private lastChangedDateField: 'effective' | 'termination' | null = null;

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEffDateError());
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTermDateError());

  private initialFilterValues: ReturnReasonsFilterValue | null = null;

  private destroy$ = new Subject<void>();
  private effectiveDateRawInput = '';
  private terminationDateRawInput = '';

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private chapterTimezoneService: ChapterTimezoneService,
    private dateAdapter: DateAdapter<Date>
  ) {
    // Set the ChapterTimezoneService on the custom date adapter
    if (this.dateAdapter instanceof ChapterDateAdapter) {
      this.dateAdapter.setChapterTimezoneService(this.chapterTimezoneService);
    }

    // Watch for changes in chapter local date and notify the dateAdapter
    effect(() => {
      const chapterDate = this.chapterTimezoneService.chapterLocalDate();
      if (chapterDate && chapterDate.isValid()) {
        this.dateAdapter.setLocale('en-US');
      }
    });
  }

  ngOnInit(): void {
    const effectiveDate = this.currentFilters?.effectiveDate ? new Date(this.currentFilters.effectiveDate) : null;
    const terminationDate = this.currentFilters?.terminationDate ? new Date(this.currentFilters.terminationDate) : null;

    this.filterForm = this.fb.group({
      locationType: [this.currentFilters?.locationType || null],
      crNcr: [this.currentFilters?.crNcr || null],
      enforce: [this.currentFilters?.enforce || null],
      effectiveDatePeriod: [this.currentFilters?.effectiveDatePeriod || null],
      effectiveDate: [effectiveDate, [dateFormatValidator()]],
      terminationDatePeriod: [this.currentFilters?.terminationDatePeriod || null],
      terminationDate: [terminationDate, [dateFormatValidator()]]
    }, {
      validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate')]
    });

    // Store initial values to track changes
    if (this.currentFilters) {
      this.initialFilterValues = { ...this.currentFilters };
    } else {
      this.initialFilterValues = null;
    }

    this.setupValidation();
    this.setupClearValidationListeners();

    // Update signal with passed-in location types from parent
    this.locationTypeOptionsSignal.set(this.locationTypeOptions);
  }

  private setupValidation(): void {
    // Watch effective date changes
    this.filterForm.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'effective';
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
        this.lastChangedDateField = 'termination';
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

    // Watch all form changes to update Apply button state
    this.filterForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.cdr.markForCheck();
      });

    // Watch form status changes (valid/invalid) to update Apply button state
    this.filterForm.statusChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
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

  /**
   * Setup listeners to clear validation errors when fields are cleared
   */
  private setupClearValidationListeners(): void {
    // Location Type dropdown
    this.filterForm.get('locationType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        const control = this.filterForm.get('locationType');
        if (!value && control) {
          control.setErrors(null);
          control.markAsPristine();
          control.markAsUntouched();
        }
      });

    // CR/NCR dropdown
    this.filterForm.get('crNcr')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        const control = this.filterForm.get('crNcr');
        if (!value && control) {
          control.setErrors(null);
          control.markAsPristine();
          control.markAsUntouched();
        }
      });

    // Enforce dropdown
    this.filterForm.get('enforce')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        const control = this.filterForm.get('enforce');
        if (!value && control) {
          control.setErrors(null);
          control.markAsPristine();
          control.markAsUntouched();
        }
      });

    // Effective Date Period dropdown
    this.filterForm.get('effectiveDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        const control = this.filterForm.get('effectiveDatePeriod');
        if (!value && control) {
          control.setErrors(null);
          control.markAsPristine();
          control.markAsUntouched();
        }
      });

    // Termination Date Period dropdown
    this.filterForm.get('terminationDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        const control = this.filterForm.get('terminationDatePeriod');
        if (!value && control) {
          control.setErrors(null);
          control.markAsPristine();
          control.markAsUntouched();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onEffectiveDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.effectiveDateRawInput = input.value;
    DateFieldValidationUtility.handleEndDateInput(
      input.value, this.filterForm.get('effectiveDate'), false
    );
  }

  onEffectiveDateBlur(input: HTMLInputElement): void {
    const control = this.filterForm.get('effectiveDate');

    if (control?.hasError('invalidDateFormat') || control?.hasError('matDatepickerParse')) {
      setTimeout(() => {
        input.value = this.effectiveDateRawInput;
      }, 0);
    }
  }

  onTerminationDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.terminationDateRawInput = input.value;
    DateFieldValidationUtility.handleEndDateInput(
      input.value, this.filterForm.get('terminationDate'), false
    );
  }

  onTerminationDateBlur(input: HTMLInputElement): void {
    const control = this.filterForm.get('terminationDate');

    if (control?.hasError('invalidDateFormat') || control?.hasError('matDatepickerParse')) {
      setTimeout(() => {
        input.value = this.terminationDateRawInput;
      }, 0);
    }
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

  get effDatePeriodRequired(): boolean {
    const formValue = this.filterForm?.value;
    return !!(formValue?.effectiveDate && !formValue?.effectiveDatePeriod);
  }

  get termDatePeriodRequired(): boolean {
    const formValue = this.filterForm?.value;
    return !!(formValue?.terminationDate && !formValue?.terminationDatePeriod);
  }

  getEffDateError(): string {
    const formErrors = this.lastChangedDateField === 'effective' ? this.filterForm.errors : null;
    return DateFieldValidationUtility.getEndDateCrossFieldError(
      this.filterForm.get('effectiveDate'), 'Effective Date', 'Termination Date', formErrors
    );
  }

  getTermDateError(): string {
    const formErrors = this.lastChangedDateField === 'termination' ? this.filterForm.errors : null;
    return DateFieldValidationUtility.getEndDateCrossFieldError(
      this.filterForm.get('terminationDate'), 'Termination Date', 'Effective Date', formErrors
    );
  }

  private hasDateErrors(): boolean {
    const effectiveDateControl = this.filterForm.get('effectiveDate');
    const terminationDateControl = this.filterForm.get('terminationDate');
    const effectiveDateHasFormatError = effectiveDateControl?.hasError('invalidDateFormat') ||
                                        effectiveDateControl?.hasError('matDatepickerParse');
    const terminationDateHasFormatError = terminationDateControl?.hasError('invalidDateFormat') ||
                                          terminationDateControl?.hasError('matDatepickerParse');

    const hasRangeError = this.filterForm.hasError('dateRangeInvalid');

    return effectiveDateHasFormatError || terminationDateHasFormatError || hasRangeError || false;
  }

  isApplyDisabled(): boolean {
    // Check if form is invalid (any validation errors)
    if (this.filterForm?.invalid) {
      return true;
    }

    // Check if period validation fails
    if (this.effDatePeriodRequired || this.termDatePeriodRequired) {
      return true;
    }

    // Check if form has date errors
    if (this.hasDateErrors()) {
      return true;
    }

    // Check if there are any error messages showing
    if (this.getEffDateError() || this.getTermDateError() ||
        this.getEffectiveDatePeriodError() || this.getTerminationDatePeriodError()) {
      return true;
    }

    // Check if any field has a value
    const formValue = this.filterForm?.value;
    if (!formValue) {
      return true;
    }

    const hasAnyValue =
      formValue.locationType !== null ||
      formValue.crNcr !== null ||
      formValue.enforce !== null ||
      formValue.effectiveDatePeriod ||
      formValue.effectiveDate ||
      formValue.terminationDatePeriod ||
      formValue.terminationDate;

    if (!hasAnyValue) {
      return true;
    }

    // Check if form values have changed from initial values
    if (!this.hasFormChanged()) {
      return true;
    }

    return false;
  }

  private hasFormChanged(): boolean {
    const formValue = this.filterForm?.value;
    if (!formValue) {
      return false;
    }

    // If no initial values were set, consider it changed if there are values
    if (!this.initialFilterValues) {
      return true;
    }

    // Compare each field
    const currentEffectiveDate = formValue.effectiveDate ? this.formatDateForComparison(formValue.effectiveDate) : null;
    const currentTerminationDate = formValue.terminationDate ? this.formatDateForComparison(formValue.terminationDate) : null;

    const initialEffectiveDate = this.initialFilterValues.effectiveDate ? this.formatDateForComparison(new Date(this.initialFilterValues.effectiveDate)) : null;
    const initialTerminationDate = this.initialFilterValues.terminationDate ? this.formatDateForComparison(new Date(this.initialFilterValues.terminationDate)) : null;

    const isChanged =
      formValue.locationType !== this.initialFilterValues.locationType ||
      formValue.crNcr !== this.initialFilterValues.crNcr ||
      formValue.enforce !== this.initialFilterValues.enforce ||
      formValue.effectiveDatePeriod !== this.initialFilterValues.effectiveDatePeriod ||
      currentEffectiveDate !== initialEffectiveDate ||
      formValue.terminationDatePeriod !== this.initialFilterValues.terminationDatePeriod ||
      currentTerminationDate !== initialTerminationDate;

    return isChanged;
  }

  private formatDateForComparison(date: Date | null): string | null {
    if (!date) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  onApply(): void {
    this.filterForm.markAllAsTouched();

    if (this.hasDateErrors() || this.effDatePeriodRequired || this.termDatePeriodRequired) {
      this.cdr.markForCheck();
      return;
    }

    const formValue = this.filterForm.value;

    const filters: ReturnReasonsFilterValue = {
      locationType: formValue.locationType || null,
      crNcr: formValue.crNcr || null,
      enforce: formValue.enforce || null,
      // Only include period if date is also selected (prevents orphaned period values)
      effectiveDatePeriod: formValue.effectiveDate ? (formValue.effectiveDatePeriod || null) : null,
      effectiveDate: formValue.effectiveDate || null,
      // Only include period if date is also selected (prevents orphaned period values)
      terminationDatePeriod: formValue.terminationDate ? (formValue.terminationDatePeriod || null) : null,
      terminationDate: formValue.terminationDate || null
    };

    this.apply.emit(filters);
  }

  onClear(): void {
    this.filterForm.reset({
      locationType: null,
      crNcr: null,
      enforce: null,
      effectiveDatePeriod: null,
      effectiveDate: null,
      terminationDatePeriod: null,
      terminationDate: null
    });
    this.effectiveDateRawInput = '';
    this.terminationDateRawInput = '';

    // Clear all control errors
    this.filterForm.get('effectiveDatePeriod')?.setErrors(null);
    this.filterForm.get('terminationDatePeriod')?.setErrors(null);

    this.cdr.markForCheck();
  }

  onClose(): void {
    this.close.emit();
  }
}
