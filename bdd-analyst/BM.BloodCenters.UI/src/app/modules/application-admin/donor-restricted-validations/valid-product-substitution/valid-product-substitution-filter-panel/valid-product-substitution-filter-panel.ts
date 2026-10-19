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
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import moment from 'moment';

import { ValidProductSubstitutionFilterValue, ProductTypeLookup } from '../models/valid-product-substitution.model';
import { ValidProductSubstitutionService } from '../services/valid-product-substitution.service';

@Component({
  selector: 'app-valid-product-substitution-filter-panel',
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
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './valid-product-substitution-filter-panel.html',
  styleUrls: ['./valid-product-substitution-filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ValidProductSubstitutionFilterPanel implements OnInit, OnDestroy {
  @Input() currentFilters: ValidProductSubstitutionFilterValue | null = null;
  @Output() apply = new EventEmitter<ValidProductSubstitutionFilterValue>();
  @Output() close = new EventEmitter<void>();

  filterForm!: FormGroup;

  // Search controls for dropdowns
  requestProductTypeSearchCtrl = new FormControl('');
  compatibleProductTypeSearchCtrl = new FormControl('');

  // Signal-based lookup data for Requested Product Type
  readonly requestProductTypeSearch = signal('');
  readonly requestProductTypeOptionsSignal = signal<ProductTypeLookup[]>([]);
  readonly filteredRequestProductTypeOptions = computed(() => {
    const search = this.requestProductTypeSearch().toLowerCase();
    const options = this.requestProductTypeOptionsSignal();
    if (!search) return options;
    return options.filter(opt =>
      opt.code.toLowerCase().includes(search) ||
      opt.description.toLowerCase().includes(search)
    );
  });

  // Signal-based lookup data for Compatible Product Type
  readonly compatibleProductTypeSearch = signal('');
  readonly compatibleProductTypeOptionsSignal = signal<ProductTypeLookup[]>([]);
  readonly filteredCompatibleProductTypeOptions = computed(() => {
    const search = this.compatibleProductTypeSearch().toLowerCase();
    const options = this.compatibleProductTypeOptionsSignal();
    if (!search) return options;
    return options.filter(opt =>
      opt.code.toLowerCase().includes(search) ||
      opt.description.toLowerCase().includes(search)
    );
  });

  periodOptions: string[] = ['After', 'Before'];

  isLoadingFilters = false;

  /** Track initial filter values to detect changes */
  private initialFilterValues: {
    requestProductType: string | null;
    compatibleProductType: string | null;
    effectiveDatePeriod: string | null;
    effectiveDate: moment.Moment | null;
    terminationDatePeriod: string | null;
    terminationDate: moment.Moment | null;
  } | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private validProductSubstitutionService: ValidProductSubstitutionService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      requestProductType: [this.currentFilters?.requestProductType || null],
      compatibleProductType: [this.currentFilters?.compatibleProductType || null],
      effectiveDatePeriod: [this.currentFilters?.effectiveDatePeriod || null],
      effectiveDate: [this.currentFilters?.effectiveDate ? new Date(this.currentFilters.effectiveDate) : null],
      terminationDatePeriod: [this.currentFilters?.terminationDatePeriod || null],
      terminationDate: [this.currentFilters?.terminationDate ? new Date(this.currentFilters.terminationDate) : null]
    });

    this.setupValidation();
    this.setupSearchSubscriptions();
    this.loadFilterOptions();

    // Store initial filter values to track changes
    this.initialFilterValues = {
      requestProductType: this.currentFilters?.requestProductType || null,
      compatibleProductType: this.currentFilters?.compatibleProductType || null,
      effectiveDatePeriod: this.currentFilters?.effectiveDatePeriod || null,
      effectiveDate: this.currentFilters?.effectiveDate ? moment(this.currentFilters.effectiveDate) : null,
      terminationDatePeriod: this.currentFilters?.terminationDatePeriod || null,
      terminationDate: this.currentFilters?.terminationDate ? moment(this.currentFilters.terminationDate) : null
    };
  }

  private setupSearchSubscriptions(): void {
    // Requested Product Type search
    this.requestProductTypeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.requestProductTypeSearch.set(value || ''));

    // Compatible Product Type search
    this.compatibleProductTypeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.compatibleProductTypeSearch.set(value || ''));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupValidation(): void {
    // Watch effective date changes
    this.filterForm.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        this.validateEffectiveDatePeriod();
        // Clear date field errors and touched state when date is removed
        if (!value) {
          const control = this.filterForm.get('effectiveDate');
          control?.setErrors(null);
          control?.markAsUntouched();
          control?.markAsPristine();
        }
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
      .subscribe((value) => {
        this.validateTerminationDatePeriod();
        // Clear date field errors and touched state when date is removed
        if (!value) {
          const control = this.filterForm.get('terminationDate');
          control?.setErrors(null);
          control?.markAsUntouched();
          control?.markAsPristine();
        }
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

  private loadFilterOptions(): void {
    this.isLoadingFilters = true;

    this.validProductSubstitutionService.getValidProductSubstitutionFilters().subscribe({
      next: (response) => {
        this.requestProductTypeOptionsSignal.set(response.requestProductType || []);
        this.compatibleProductTypeOptionsSignal.set(response.compatibleProductType || []);
        this.isLoadingFilters = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading filter options:', error);
        this.requestProductTypeOptionsSignal.set([]);
        this.compatibleProductTypeOptionsSignal.set([]);
        this.isLoadingFilters = false;
        this.cdr.markForCheck();
      }
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
   * Handle manual input in effective date field
   * Uses handleEndDateInput since dates are optional in filter panel
   */
  onEffectiveDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value,
      this.filterForm.get('effectiveDate'),
      false // Not edit mode - clears errors when empty
    );
  }

  /**
   * Handle manual input in termination date field
   */
  onTerminationDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value,
      this.filterForm.get('terminationDate'),
      false // Not edit mode - clears errors when empty
    );
  }

  /**
   * Get error message for effective date field (invalid date)
   */
  getEffectiveDateError(): string {
    return DateFieldValidationUtility.getStartDateCrossFieldError(
      this.filterForm.get('effectiveDate'),
      'Effective Date',
      'Termination Date',
      null
    );
  }

  /**
   * Get error message for termination date field (invalid date)
   */
  getTerminationDateError(): string {
    return DateFieldValidationUtility.getEndDateCrossFieldError(
      this.filterForm.get('terminationDate'),
      'Termination Date',
      'Effective Date',
      null
    );
  }

  /**
   * Get the minimum date for Termination Date picker
   * (should be the selected Effective Date)
   */
  getTerminationDateMin(): Date | null {
    const effectiveDate = this.filterForm.get('effectiveDate')?.value;
    return effectiveDate || null;
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

  /**
   * Checks if the current filter values have changed from the initial values.
   * Period fields alone don't count as changes - they must have accompanying dates.
   */
  hasFilterChanged(): boolean {
    if (!this.initialFilterValues) return false;

    const currentValues = this.filterForm.value;

    // Compare requestProductType
    if ((currentValues.requestProductType || null) !== (this.initialFilterValues.requestProductType || null)) {
      return true;
    }

    // Compare compatibleProductType
    if ((currentValues.compatibleProductType || null) !== (this.initialFilterValues.compatibleProductType || null)) {
      return true;
    }

    // Check effective date changes
    const currentEffectiveDate = currentValues.effectiveDate;
    const initialEffectiveDate = this.initialFilterValues.effectiveDate;
    const currentEffectiveDatePeriod = currentValues.effectiveDatePeriod;
    const initialEffectiveDatePeriod = this.initialFilterValues.effectiveDatePeriod;

    if (currentEffectiveDate) {
      // Period changed
      if ((currentEffectiveDatePeriod || null) !== (initialEffectiveDatePeriod || null)) {
        return true;
      }
      // Date changed
      if (initialEffectiveDate) {
        if (!moment(currentEffectiveDate).isSame(initialEffectiveDate, 'day')) {
          return true;
        }
      } else {
        // Date was added
        return true;
      }
    } else if (initialEffectiveDate) {
      // Date was removed
      return true;
    }

    // Check termination date changes
    const currentTerminationDate = currentValues.terminationDate;
    const initialTerminationDate = this.initialFilterValues.terminationDate;
    const currentTerminationDatePeriod = currentValues.terminationDatePeriod;
    const initialTerminationDatePeriod = this.initialFilterValues.terminationDatePeriod;

    if (currentTerminationDate) {
      // Period changed
      if ((currentTerminationDatePeriod || null) !== (initialTerminationDatePeriod || null)) {
        return true;
      }
      // Date changed
      if (initialTerminationDate) {
        if (!moment(currentTerminationDate).isSame(initialTerminationDate, 'day')) {
          return true;
        }
      } else {
        // Date was added
        return true;
      }
    } else if (initialTerminationDate) {
      // Date was removed
      return true;
    }

    return false;
  }

  get isApplyDisabled(): boolean {
    const formValue = this.filterForm?.value;
    if (!formValue) {
      return true;
    }

    // Check if at least one field is selected
    const hasAnyValue = formValue.requestProductType ||
                        formValue.compatibleProductType ||
                        formValue.effectiveDate ||
                        formValue.terminationDate;

    // Disable if no values selected OR no changes made OR if there are validation errors
    return !hasAnyValue || !this.hasFilterChanged() || this.hasValidationErrors;
  }

  get hasValidationErrors(): boolean {
    const effectiveDateControl = this.filterForm.get('effectiveDate');
    const terminationDateControl = this.filterForm.get('terminationDate');
    const effectiveDateHasFormatError = effectiveDateControl?.hasError('invalidDateFormat') ||
                                        effectiveDateControl?.hasError('matDatepickerParse');
    const terminationDateHasFormatError = terminationDateControl?.hasError('invalidDateFormat') ||
                                          terminationDateControl?.hasError('matDatepickerParse');

    return this.filterForm.get('effectiveDatePeriod')?.invalid ||
           this.filterForm.get('terminationDatePeriod')?.invalid ||
           effectiveDateHasFormatError ||
           terminationDateHasFormatError ||
           false;
  }

  onApply(): void {
    const formValue = this.filterForm.value;

    // Validate before applying
    this.validateEffectiveDatePeriod();
    this.validateTerminationDatePeriod();

    if (this.hasValidationErrors) {
      return;
    }

    const filters: ValidProductSubstitutionFilterValue = {
      requestProductType: formValue.requestProductType || null,
      compatibleProductType: formValue.compatibleProductType || null,
      effectiveDatePeriod: formValue.effectiveDatePeriod || null,
      effectiveDate: formValue.effectiveDate || null,
      terminationDatePeriod: formValue.terminationDatePeriod || null,
      terminationDate: formValue.terminationDate || null
    };

    this.apply.emit(filters);

    // Update initial filter values to current values after applying
    this.initialFilterValues = {
      requestProductType: formValue.requestProductType || null,
      compatibleProductType: formValue.compatibleProductType || null,
      effectiveDatePeriod: formValue.effectiveDatePeriod || null,
      effectiveDate: formValue.effectiveDate ? moment(formValue.effectiveDate) : null,
      terminationDatePeriod: formValue.terminationDatePeriod || null,
      terminationDate: formValue.terminationDate ? moment(formValue.terminationDate) : null
    };
  }

  onClear(): void {
    this.filterForm.reset();

    // Update initial filter values to match the cleared state
    this.initialFilterValues = {
      requestProductType: null,
      compatibleProductType: null,
      effectiveDatePeriod: null,
      effectiveDate: null,
      terminationDatePeriod: null,
      terminationDate: null
    };

    this.cdr.markForCheck();
  }

  blurField(): void {
    (document.activeElement as HTMLElement)?.blur();
  }

  onClose(): void {
    this.close.emit();
  }
}
