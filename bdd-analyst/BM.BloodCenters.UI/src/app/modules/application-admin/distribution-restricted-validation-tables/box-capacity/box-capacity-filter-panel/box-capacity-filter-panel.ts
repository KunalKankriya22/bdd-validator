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
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { CustomDateAdapter, DD_MMM_YYYY_FORMAT, dateFormatValidator } from 'src/app/core/utils/date-adapter.util';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { A11yModule } from '@angular/cdk/a11y';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil, startWith } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { FilterPanelBase } from '@shared/components/filter-panel-base/filter-panel-base';

import { BoxCapacityFilterValue } from '../models/box-capacity.model';
import { BoxCapacityService } from '../services/box-capacity.service';

@Component({
  selector: 'app-box-capacity-filter-panel',
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
    A11yModule,
    FilterPanelBase,
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: DateAdapter, useClass: CustomDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MMM_YYYY_FORMAT }
  ],
  templateUrl: './box-capacity-filter-panel.html',
  styleUrls: ['./box-capacity-filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BoxCapacityFilterPanel implements OnInit, OnDestroy {
  @Input() currentFilters: BoxCapacityFilterValue | null = null;
  @Output() apply = new EventEmitter<any>();
  @Output() close = new EventEmitter<void>();

  filterForm!: FormGroup;

  boxTypeOptions: any[] = [];
  inventoryProductTypeOptions: any[] = [];

  // Search controls for dropdowns
  boxTypeSearchCtrl = new FormControl('');
  inventoryProductTypeSearchCtrl = new FormControl('');

  // Signals for filtered options
  boxTypeOptionsSignal = signal<any[]>([]);
  inventoryProductTypeOptionsSignal = signal<any[]>([]);

  // Convert FormControl values to signals
  boxTypeSearchSignal = toSignal(this.boxTypeSearchCtrl.valueChanges.pipe(startWith('')), { initialValue: '' });
  inventoryProductTypeSearchSignal = toSignal(this.inventoryProductTypeSearchCtrl.valueChanges.pipe(startWith('')), { initialValue: '' });

  filteredBoxTypeOptions = computed(() => {
    const searchTerm = this.boxTypeSearchSignal()?.toLowerCase() || '';
    const options = this.boxTypeOptionsSignal();
    if (!searchTerm) return options;
    return options.filter(option =>
      option.boxType?.toLowerCase().includes(searchTerm) ||
      option.boxTypeDescription?.toLowerCase().includes(searchTerm)
    );
  });

  filteredInventoryProductTypeOptions = computed(() => {
    const searchTerm = this.inventoryProductTypeSearchSignal()?.toLowerCase() || '';
    const options = this.inventoryProductTypeOptionsSignal();
    if (!searchTerm) return options;
    return options.filter(option =>
      option.inventoryProductType?.toLowerCase().includes(searchTerm) ||
      option.productTypeDescription?.toLowerCase().includes(searchTerm)
    );
  });

  isLoadingFilters = false;
  showCapacityOverflowError = false;

  capacityRangeError = false;

  minDate = DateFieldValidationUtility.getMinDate();

  /** Tracks which date field was last changed — cross-field error shows only on that field */
  private lastChangedDateField: 'effective' | 'termination' | null = null;

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEffectiveDateError());
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTerminationDateError());

  private initialFilterValues: BoxCapacityFilterValue | null = null;

  private destroy$ = new Subject<void>();
  private effectiveDateRawInput = '';
  private terminationDateRawInput = '';

  constructor(
    private fb: FormBuilder,
    private boxCapacityService: BoxCapacityService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    const effectiveDate = this.currentFilters?.effectiveDate ? new Date(this.currentFilters.effectiveDate) : null;
    const terminationDate = this.currentFilters?.terminationDate ? new Date(this.currentFilters.terminationDate) : null;

    this.filterForm = this.fb.group({
      boxType: [this.currentFilters?.boxType || null],
      inventoryProductType: [this.currentFilters?.inventoryProductType || null],
      capacityRange: [this.currentFilters?.capacityRange || null],
      // Use nullish coalescing to preserve 0 value
      capacity: [this.currentFilters?.capacity ?? null, [Validators.min(0), Validators.max(9999)]],
      effectiveDatePeriod: [this.currentFilters?.effectiveDatePeriod || null],
      effectiveDate: [effectiveDate, [dateFormatValidator()]],
      terminationDatePeriod: [this.currentFilters?.terminationDatePeriod || null],
      terminationDate: [terminationDate, [dateFormatValidator()]]
    }, {
      validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate')]
    });

    // Store initial values to track changes
    this.initialFilterValues = this.currentFilters ? { ...this.currentFilters } : null;

    // Setup validation listeners for capacity range
    this.filterForm.get('capacity')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateCapacityRange();
      });

    this.filterForm.get('capacityRange')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateCapacityRange();
      });

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

    // Initial validation check in case filters were pre-populated
    this.validateCapacityRange();
    this.validateEffectiveDatePeriod();
    this.validateTerminationDatePeriod();

    // Setup listeners to clear validation when fields are cleared
    this.setupClearValidationListeners();

    this.loadFilterOptions();
  }

  /**
   * Setup listeners to clear validation errors when fields are cleared
   * Note: capacityRange, effectiveDatePeriod, and terminationDatePeriod are NOT included
   * because their error clearing is handled by the corresponding validate* methods
   */
  private setupClearValidationListeners(): void {
    // Box Type dropdown
    this.filterForm.get('boxType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        const control = this.filterForm.get('boxType');
        if (!value && control) {
          control.setErrors(null);
          control.markAsPristine();
          control.markAsUntouched();
        }
      });

    // Inventory Product Type dropdown
    this.filterForm.get('inventoryProductType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        const control = this.filterForm.get('inventoryProductType');
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

  private validateCapacityRange(): void {
    const capacity = this.filterForm.get('capacity')?.value;
    const capacityRange = this.filterForm.get('capacityRange')?.value;
    const capacityRangeControl = this.filterForm.get('capacityRange');

    this.capacityRangeError = !!(capacity !== null && capacity !== '' && !capacityRange);

    if (this.capacityRangeError) {
      capacityRangeControl?.setErrors({ required: true });
      capacityRangeControl?.markAsTouched();
    } else {
      capacityRangeControl?.setErrors(null);
    }
    this.cdr.markForCheck();
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
   * Load filter options from backend API
   */
  private loadFilterOptions(): void {
    this.isLoadingFilters = true;

    this.boxCapacityService.getBoxCapacityFilters().subscribe({
      next: (response) => {
        // Handle different response structures: response.item, response.data[0], or response directly
        let filterData = null;

        if (response.item) {
          filterData = response.item;
        } else if (response.data && response.data.length > 0) {
          filterData = response.data[0];
        } else if (response && (response as any).boxTypes) {
          filterData = response as any;
        }

        if (filterData) {
          // Keep the full LOV objects with both code and description
          this.boxTypeOptions = filterData.boxTypes || [];
          this.inventoryProductTypeOptions = filterData.inventoryProdTypes || [];

          // Update signals for filtered dropdowns
          this.boxTypeOptionsSignal.set(this.boxTypeOptions);
          this.inventoryProductTypeOptionsSignal.set(this.inventoryProductTypeOptions);
        }

        this.isLoadingFilters = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.boxTypeOptions = [];
        this.inventoryProductTypeOptions = [];
        this.isLoadingFilters = false;
        this.cdr.markForCheck();
      }
    });
  }

  onApply(): void {
    this.filterForm.markAllAsTouched();

    if (this.hasDateErrors() || this.effDatePeriodRequired || this.termDatePeriodRequired || this.capacityRangeError || this.filterForm.invalid) {
      this.cdr.markForCheck();
      return;
    }

    const formValue = this.filterForm.value;

    const filters: BoxCapacityFilterValue = {
      boxType: formValue.boxType || null,
      inventoryProductType: formValue.inventoryProductType || null,
      capacityRange: formValue.capacityRange || null,
      // Fix: Capacity 0 should be preserved, only filter out null/undefined/empty string
      capacity: formValue.capacity !== null && formValue.capacity !== '' && formValue.capacity !== undefined ? Number(formValue.capacity) : null,
      effectiveDatePeriod: formValue.effectiveDatePeriod || null,
      effectiveDate: formValue.effectiveDate || null,
      terminationDatePeriod: formValue.terminationDatePeriod || null,
      terminationDate: formValue.terminationDate || null
    };

    this.apply.emit(filters);
  }

  onClear(): void {
    this.filterForm.reset({
      boxType: null,
      inventoryProductType: null,
      capacityRange: null,
      capacity: null,
      effectiveDatePeriod: null,
      effectiveDate: null,
      terminationDatePeriod: null,
      terminationDate: null
    });
    this.capacityRangeError = false;
    this.showCapacityOverflowError = false;
    this.effectiveDateRawInput = '';
    this.terminationDateRawInput = '';

    // Clear all control errors
    this.filterForm.get('capacity')?.setErrors(null);
    this.filterForm.get('capacityRange')?.setErrors(null);
    this.filterForm.get('effectiveDatePeriod')?.setErrors(null);
    this.filterForm.get('terminationDatePeriod')?.setErrors(null);

    this.cdr.markForCheck();
  }

  onClose(): void {
    this.close.emit();
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

  getEffectiveDateError(): string {
    const formErrors = this.lastChangedDateField === 'effective' ? this.filterForm.errors : null;
    return DateFieldValidationUtility.getEndDateCrossFieldError(
      this.filterForm.get('effectiveDate'), 'Effective Date', 'Termination Date', formErrors
    );
  }

  getTerminationDateError(): string {
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

  onCapacityInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    // Allow only digits (no negative values)
    let value = input.value.replace(/[^\d]/g, '');

    // Check if value exceeds 4 digits
    const overflowed = value.length > 4;

    if (overflowed) {
      value = value.substring(0, 4);
    }

    const capacityControl = this.filterForm.get('capacity');

    // Clear overflow error if user is typing within valid range
    if (!overflowed && this.showCapacityOverflowError) {
      this.showCapacityOverflowError = false;
    }

    capacityControl?.setValue(value ? Number(value) : null, { emitEvent: true });
    input.value = value;

    if (overflowed) {
      this.showTemporaryCapacityError();
    }

    this.cdr.markForCheck();
  }

  private showTemporaryCapacityError(): void {
    this.showCapacityOverflowError = true;
    const capacityControl = this.filterForm.get('capacity');
    capacityControl?.setErrors({ overflow: true });
    capacityControl?.markAsTouched();
    this.cdr.markForCheck();
  }

  getCapacityError(): string {
    const capacityControl = this.filterForm.get('capacity');
    if (this.showCapacityOverflowError) {
      return 'Value must be between 0 and 9999.';
    }
    if (capacityControl?.hasError('min')) {
      return 'Value must be between 0 and 9999.';
    }
    if (capacityControl?.hasError('max')) {
      return 'Value must be between 0 and 9999.';
    }
    return '';
  }

  get isApplyDisabled(): boolean {
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
    if (this.getEffectiveDateError() || this.getTerminationDateError() ||
        this.getEffectiveDatePeriodError() || this.getTerminationDatePeriodError()) {
      return true;
    }

    // Check if any field has a value
    const formValue = this.filterForm?.value;
    if (!formValue) {
      return true;
    }

    const hasAnyValue =
      formValue.boxType !== null ||
      formValue.inventoryProductType !== null ||
      formValue.capacityRange ||
      (formValue.capacity !== null && formValue.capacity !== '' && formValue.capacity !== undefined) ||
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
      formValue.boxType !== this.initialFilterValues.boxType ||
      formValue.inventoryProductType !== this.initialFilterValues.inventoryProductType ||
      formValue.capacityRange !== this.initialFilterValues.capacityRange ||
      formValue.capacity !== this.initialFilterValues.capacity ||
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
}
