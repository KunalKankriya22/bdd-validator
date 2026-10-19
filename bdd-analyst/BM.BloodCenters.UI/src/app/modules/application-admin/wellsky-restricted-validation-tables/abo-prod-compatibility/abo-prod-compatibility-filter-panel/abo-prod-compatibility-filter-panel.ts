import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  ChangeDetectionStrategy,
  Input,
  ChangeDetectorRef,
  OnDestroy,
  signal,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';

import { ABOProdCompatibilityFilterValue, ABOProdCompatibilityFilterOption } from '../models/abo-prod-compatibility.model';
import { ABOProdCompatibilityService } from '../services/abo-prod-compatibility.service';
import moment from 'moment';

interface FilterFormInitialValues {
  productType: string | null;
  effectiveDatePeriod: string | null;
  effectiveDate: moment.Moment | null;
  terminationDatePeriod: string | null;
  terminationDate: moment.Moment | null;
}

@Component({
  selector: 'app-abo-prod-compatibility-filter-panel',
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
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './abo-prod-compatibility-filter-panel.html',
  styleUrls: ['./abo-prod-compatibility-filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ABOProdCompatibilityFilterPanel implements OnInit, OnDestroy {
  @Input() currentFilters: ABOProdCompatibilityFilterValue | null = null;
  @Output() apply = new EventEmitter<ABOProdCompatibilityFilterValue>();
  @Output() close = new EventEmitter<void>();

  filterForm!: FormGroup;

  productTypeSearchControl = new FormControl('');

  // Signal-based filtering
  readonly productTypeSearch = signal('');
  readonly productTypeOptionsSignal = signal<ABOProdCompatibilityFilterOption[]>([]);
  readonly filteredProductTypes = computed(() => {
    const search = this.productTypeSearch().toLowerCase();
    const options = this.productTypeOptionsSignal();
    if (!search) return options;
    return options.filter(opt =>
      opt.productType.toLowerCase().includes(search) ||
      (opt.description && opt.description.toLowerCase().includes(search))
    );
  });

  // Track initial filter values to detect changes
  private initialFilterValues: FilterFormInitialValues | null = null;

  isLoadingFilters = false;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private aboProductCompatibilityService: ABOProdCompatibilityService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    // Initialize form with current filters - convert from before/after structure to period + date
    let effectiveDatePeriod = null;
    let effectiveDate = null;
    if (this.currentFilters?.effectiveDateAfter) {
      effectiveDatePeriod = 'After';
      effectiveDate = moment(this.currentFilters.effectiveDateAfter);
    } else if (this.currentFilters?.effectiveDateBefore) {
      effectiveDatePeriod = 'Before';
      effectiveDate = moment(this.currentFilters.effectiveDateBefore);
    }

    let terminationDatePeriod = null;
    let terminationDate = null;
    if (this.currentFilters?.terminationDateAfter) {
      terminationDatePeriod = 'After';
      terminationDate = moment(this.currentFilters.terminationDateAfter);
    } else if (this.currentFilters?.terminationDateBefore) {
      terminationDatePeriod = 'Before';
      terminationDate = moment(this.currentFilters.terminationDateBefore);
    }

    this.filterForm = this.fb.group({
      productType: [this.currentFilters?.inventoryProductType || null],
      effectiveDatePeriod: [effectiveDatePeriod],
      effectiveDate: [effectiveDate],
      terminationDatePeriod: [terminationDatePeriod],
      terminationDate: [terminationDate]
    });

    // Store initial filter values to track changes
    this.initialFilterValues = {
      productType: this.currentFilters?.inventoryProductType || null,
      effectiveDatePeriod: effectiveDatePeriod,
      effectiveDate: effectiveDate,
      terminationDatePeriod: terminationDatePeriod,
      terminationDate: terminationDate
    };

    this.setupValidation();
    this.setupProductTypeSearch();
    this.loadFilterOptions();
  }

  /**
   * Setup reactive validation for date/period fields
   */
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

  /**
   * Validate that period is selected when effective date has a value
   */
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

  /**
   * Validate that period is selected when termination date has a value
   */
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
   * Get error message for effective date period
   */
  getEffectiveDatePeriodError(): string {
    const control = this.filterForm.get('effectiveDatePeriod');
    if (control?.touched) {
      if (control?.hasError('required')) {
        return 'Period is required';
      }
    }
    return '';
  }

  /**
   * Get error message for termination date period
   */
  getTerminationDatePeriodError(): string {
    const control = this.filterForm.get('terminationDatePeriod');
    if (control?.touched) {
      if (control?.hasError('required')) {
        return 'Period is required';
      }
    }
    return '';
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Setup search control for product type dropdown
   */
  private setupProductTypeSearch(): void {
    this.productTypeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.productTypeSearch.set(value || ''));
  }

  /**
   * Load filter options from backend API
   */
  private loadFilterOptions(): void {
    this.isLoadingFilters = true;

    this.aboProductCompatibilityService.getABOProdCompatibilityFilters().subscribe({
      next: (response: ABOProdCompatibilityFilterOption[]) => {
        // API returns a direct array of product type strings
        this.productTypeOptionsSignal.set(response || []);

        this.isLoadingFilters = false;
        this.cdr.markForCheck();
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error loading filter options:', error);
        this.productTypeOptionsSignal.set([]);
        this.isLoadingFilters = false;
        this.cdr.markForCheck();
      }
    });
  }

  /**
   * Checks if the current filter values have changed from the initial values.
   * With OnPush change detection, this method is only called when explicitly triggered.
   *
   * Note: Period fields alone don't count as changes - they must have accompanying dates.
   */
  get isApplyDisabled(): boolean {
    if (!this.hasFilterChanged()) return true;
    return !!(
      this.filterForm.get('effectiveDatePeriod')?.invalid ||
      this.filterForm.get('terminationDatePeriod')?.invalid ||
      this.filterForm.get('effectiveDate')?.invalid ||
      this.filterForm.get('terminationDate')?.invalid
    );
  }

  hasFilterChanged(): boolean {
    if (!this.initialFilterValues) return false;

    const currentValues = this.filterForm.value;

    // Compare productType
    if ((currentValues.productType || null) !== (this.initialFilterValues.productType || null)) {
      return true;
    }

    // Check effective date changes
    // Period change only counts if there's a date value
    const currentEffectiveDate = currentValues.effectiveDate;
    const initialEffectiveDate = this.initialFilterValues.effectiveDate;
    const currentEffectiveDatePeriod = currentValues.effectiveDatePeriod;
    const initialEffectiveDatePeriod = this.initialFilterValues.effectiveDatePeriod;

    // If there's a current date, check for period or date changes
    if (currentEffectiveDate) {
      // Period changed
      if ((currentEffectiveDatePeriod || null) !== (initialEffectiveDatePeriod || null)) {
        return true;
      }
      // Date changed
      if (initialEffectiveDate) {
        if (!currentEffectiveDate.isSame(initialEffectiveDate, 'day')) {
          return true;
        }
      } else {
        // Date was added
        return true;
      }
    } else if (initialEffectiveDate) {
      // Date was removed (period change without date doesn't count)
      return true;
    }

    // Check termination date changes
    // Period change only counts if there's a date value
    const currentTerminationDate = currentValues.terminationDate;
    const initialTerminationDate = this.initialFilterValues.terminationDate;
    const currentTerminationDatePeriod = currentValues.terminationDatePeriod;
    const initialTerminationDatePeriod = this.initialFilterValues.terminationDatePeriod;

    // If there's a current date, check for period or date changes
    if (currentTerminationDate) {
      // Period changed
      if ((currentTerminationDatePeriod || null) !== (initialTerminationDatePeriod || null)) {
        return true;
      }
      // Date changed
      if (initialTerminationDate) {
        if (!currentTerminationDate.isSame(initialTerminationDate, 'day')) {
          return true;
        }
      } else {
        // Date was added
        return true;
      }
    } else if (initialTerminationDate) {
      // Date was removed (period change without date doesn't count)
      return true;
    }

    return false;
  }

  onApply(): void {
    // Trigger validation on all controls
    this.validateEffectiveDatePeriod();
    this.validateTerminationDatePeriod();

    // Check if any form control has errors (period controls OR date controls)
    if (this.filterForm.get('effectiveDatePeriod')?.invalid ||
        this.filterForm.get('terminationDatePeriod')?.invalid ||
        this.filterForm.get('effectiveDate')?.invalid ||
        this.filterForm.get('terminationDate')?.invalid) {
      this.cdr.markForCheck();
      return;
    }

    const formValue = this.filterForm.value;

    const filters: ABOProdCompatibilityFilterValue = {
      inventoryProductType: formValue.productType || null,
      effectiveDateAfter: formValue.effectiveDatePeriod === 'After' ? DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate) : null,
      effectiveDateBefore: formValue.effectiveDatePeriod === 'Before' ? DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate) : null,
      terminationDateAfter: formValue.terminationDatePeriod === 'After' ? DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate) : null,
      terminationDateBefore: formValue.terminationDatePeriod === 'Before' ? DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate) : null
    };

    // Update initial filter values to current values after applying
    // so that Apply button becomes disabled after applying
    this.initialFilterValues = {
      productType: formValue.productType || null,
      effectiveDatePeriod: formValue.effectiveDatePeriod || null,
      effectiveDate: formValue.effectiveDate || null,
      terminationDatePeriod: formValue.terminationDatePeriod || null,
      terminationDate: formValue.terminationDate || null
    };

    this.apply.emit(filters);
  }

  onClear(): void {
    this.filterForm.reset();
    this.filterForm.get('effectiveDatePeriod')?.setErrors(null);
    this.filterForm.get('terminationDatePeriod')?.setErrors(null);

    // Update initial filter values to match the cleared state
    // so that Apply button remains disabled after clearing
    this.initialFilterValues = {
      productType: null,
      effectiveDatePeriod: null,
      effectiveDate: null,
      terminationDatePeriod: null,
      terminationDate: null
    };

    this.cdr.markForCheck();
  }

  onClose(): void {
    this.close.emit();
  }
}
