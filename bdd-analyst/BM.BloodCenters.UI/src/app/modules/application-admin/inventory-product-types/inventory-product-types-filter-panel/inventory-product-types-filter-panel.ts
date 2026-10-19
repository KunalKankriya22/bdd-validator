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
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { HeaderService } from '@shared/services/header.service';

import { InventoryProductTypesService } from '../services/inventory-product-types.service';
import { InventoryProductTypeFilterValue, ProductGroupingOption } from '../models/inventory-product-types.model';
import { Subject, take, takeUntil } from 'rxjs';

function twoDecimalPlacesValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value && control.value !== 0) {
    return null;
  }
  const value = control.value.toString();
  if (value.includes('.')) {
    const parts = value.split('.');
    if (parts[1] && parts[1].length > 2) {
      return { twoDecimalPlaces: true };
    }
  }
  return null;
}

@Component({
  selector: 'app-inventory-product-types-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatDatepickerModule,
    MatInputModule,
    NgxMatSelectSearchModule,
    MatProgressSpinnerModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './inventory-product-types-filter-panel.html',
  styleUrls: ['./inventory-product-types-filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InventoryProductTypesFilterPanel implements OnInit, OnDestroy {
  @Input() currentFilters: InventoryProductTypeFilterValue | null = null;
  @Output() apply = new EventEmitter<any>();
  @Output() close = new EventEmitter<void>();

  filterForm!: FormGroup;

  // Grouping search
  groupingSearchCtrl = new FormControl('');
  readonly groupingSearch = signal('');
  readonly groupingOptionsSignal = signal<ProductGroupingOption[]>([]);
  readonly filteredGroupingOptions = computed(() => {
    const search = this.groupingSearch().toLowerCase();
    const options = this.groupingOptionsSignal();
    if (!search) return options;
    return options.filter(opt =>
      opt.code.toLowerCase().includes(search) ||
      opt.description.toLowerCase().includes(search)
    );
  });

  booleanOptions: { label: string; value: boolean }[] = [
    { label: 'Yes', value: true },
    { label: 'No', value: false }
  ];
  periodOptions: string[] = ['After', 'Before'];
  rangeOptions: string[] = ['Over', 'Under'];

  priceRangeError = '';

  isLoadingFilters = false;
  readonly selectPanelLoadingValue = '__FILTER_PANEL_LOADING__';
  readonly selectPanelEmptyValue = '__FILTER_PANEL_EMPTY__';

  private appliedFilterSnapshot!: string;
  hasChanges = false;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private service: InventoryProductTypesService,
    private cdr: ChangeDetectorRef,
    private headerService: HeaderService
  ) { }

  ngOnInit(): void {
    const effectiveDatePeriod = this.currentFilters?.effectiveDateFrom
      ? 'After'
      : this.currentFilters?.effectiveDateTo
        ? 'Before'
        : null;

    const terminationDatePeriod = this.currentFilters?.terminationDateFrom
      ? 'After'
      : this.currentFilters?.terminationDateTo
        ? 'Before'
        : null;

    const effectiveDate = this.currentFilters?.effectiveDateFrom
      ? new Date(this.currentFilters.effectiveDateFrom)
      : this.currentFilters?.effectiveDateTo
        ? new Date(this.currentFilters.effectiveDateTo)
        : null;

    const terminationDate = this.currentFilters?.terminationDateFrom
      ? new Date(this.currentFilters.terminationDateFrom)
      : this.currentFilters?.terminationDateTo
        ? new Date(this.currentFilters.terminationDateTo)
        : null;

    this.filterForm = this.fb.group({
      productGrouping: [this.currentFilters?.productGrouping || null],
      specialInventory: [this.currentFilters?.specialInventory ?? null],
      priceRange: [this.currentFilters?.priceRange || null],
      price: [this.currentFilters?.price || null, [
        (control: AbstractControl): ValidationErrors | null => {
          const value = control.value;
          if (value === null || value === '' || value === undefined) return null;
          const numValue = Number(value);
          if (isNaN(numValue)) return { invalidNumber: true };
          if (numValue < -999999.99) return { min: { min: -999999.99, actual: numValue } };
          if (numValue > 999999.99) return { max: { max: 999999.99, actual: numValue } };
          return null;
        },
        twoDecimalPlacesValidator
      ]],
      effectiveDatePeriod: [effectiveDatePeriod],
      effectiveDate: [effectiveDate],
      terminationDatePeriod: [terminationDatePeriod],
      terminationDate: [terminationDate]
    }, {
      validators: [
        DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate')
      ]
    });

    this.setupValidation();
    this.setupSearchSubscriptions();

    // Create initial snapshot of applied filters
    this.appliedFilterSnapshot = this.normalizeFormValue(this.filterForm.value);

    this.filterForm.get('priceRange')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.priceRangeError = '';
        this.cdr.markForCheck();
      });

    this.filterForm.get('price')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((price) => {
        const control = this.filterForm.get('price');
        if (control && !control.touched) {
          control.markAsTouched();
        }
        const range = this.filterForm.get('priceRange')?.value;
        if (price !== null && price !== '' && !range) {
          this.priceRangeError = 'Range is required';
        } else {
          this.priceRangeError = '';
        }
        this.cdr.markForCheck();
      });

    this.filterForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Track if form has changed from applied state
        this.hasChanges = this.normalizeFormValue(this.filterForm.value) !== this.appliedFilterSnapshot;
        this.cdr.markForCheck();
      });

    // Re-evaluate Apply button when date control status changes (catches matDatepickerParse)
    this.filterForm.get('effectiveDate')?.statusChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.cdr.markForCheck());

    this.filterForm.get('terminationDate')?.statusChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.cdr.markForCheck());

    this.loadFilters();
    this.subscribeToChapterChanges();
  }

  private setupSearchSubscriptions(): void {
    this.groupingSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.groupingSearch.set(value || ''));
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadFilters();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupValidation(): void {
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

    this.filterForm.get('effectiveDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateEffectiveDatePeriod();
        this.cdr.markForCheck();
      });

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
    const periodControl = this.filterForm.get('effectiveDatePeriod');
    const dateControl = this.filterForm.get('effectiveDate');

    if (effectiveDate && !effectiveDatePeriod) {
      // Date exists but no period selected - show error
      periodControl?.setErrors({ required: true });
      periodControl?.markAsTouched();
    } else {
      // Both exist or both are null - clear period errors
      periodControl?.setErrors(null);
    }

    // Clear date errors when date is cleared
    if (!effectiveDate) {
      dateControl?.setErrors(null);
      dateControl?.markAsUntouched();
      dateControl?.markAsPristine();
    }
  }

  private validateTerminationDatePeriod(): void {
    const terminationDate = this.filterForm.get('terminationDate')?.value;
    const terminationDatePeriod = this.filterForm.get('terminationDatePeriod')?.value;
    const periodControl = this.filterForm.get('terminationDatePeriod');
    const dateControl = this.filterForm.get('terminationDate');

    if (terminationDate && !terminationDatePeriod) {
      // Date exists but no period selected - show error
      periodControl?.setErrors({ required: true });
      periodControl?.markAsTouched();
    } else {
      // Both exist or both are null - clear period errors
      periodControl?.setErrors(null);
    }

    // Clear date errors when date is cleared
    if (!terminationDate) {
      dateControl?.setErrors(null);
      dateControl?.markAsUntouched();
      dateControl?.markAsPristine();
    }
  }

  onEffectiveDateInput(event: Event): void {
    const inputValue = (event.target as HTMLInputElement).value?.trim();
    const dateControl = this.filterForm.get('effectiveDate');

    // Use handleEndDateInput with false - treats date as optional in filter panel
    DateFieldValidationUtility.handleEndDateInput(inputValue, dateControl, false);
  }

  onTerminationDateInput(event: Event): void {
    const inputValue = (event.target as HTMLInputElement).value?.trim();
    const dateControl = this.filterForm.get('terminationDate');

    // Use handleEndDateInput with false - treats date as optional in filter panel
    DateFieldValidationUtility.handleEndDateInput(inputValue, dateControl, false);
  }

  getEffectiveDateError(): string {
    // Show only cross-field date range errors in filter panel
    return DateFieldValidationUtility.getStartDateCrossFieldError(
      this.filterForm.get('effectiveDate'),
      'Effective Date',
      'Termination Date',
      this.filterForm.errors
    );
  }

  getTerminationDateError(): string {
    // Show only cross-field date range errors in filter panel
    return DateFieldValidationUtility.getEndDateCrossFieldError(
      this.filterForm.get('terminationDate'),
      'Termination Date',
      'Effective Date',
      this.filterForm.errors
    );
  }

  getEffectiveDatePeriodError(): string {
    const control = this.filterForm.get('effectiveDatePeriod');
    if (control?.touched) {
      if (control?.hasError('required')) {
        return 'Period is required';
      }
    }
    return '';
  }

  getTerminationDatePeriodError(): string {
    const control = this.filterForm.get('terminationDatePeriod');
    if (control?.touched) {
      if (control?.hasError('required')) {
        return 'Period is required';
      }
    }
    return '';
  }

  onEffectiveDateChange(): void {
    // This fires when a valid date is selected from calendar or when calendar closes
    // For invalid input (keyboard), this doesn't fire - only (blur) fires
    this.cdr.markForCheck();
  }

  onTerminationDateChange(): void {
    // This fires when a valid date is selected from calendar or when calendar closes
    // For invalid input (keyboard), this doesn't fire - only (blur) fires
    this.cdr.markForCheck();
  }

  onEffectiveDateBlur(): void {
    const dateControl = this.filterForm.get('effectiveDate');
    if (dateControl) {
      dateControl.markAsTouched();
      this.cdr.markForCheck();
    }
  }

  onTerminationDateBlur(): void {
    const dateControl = this.filterForm.get('terminationDate');
    if (dateControl) {
      dateControl.markAsTouched();
      this.cdr.markForCheck();
    }
  }

  blurField(): void {
    (document.activeElement as HTMLElement)?.blur();
  }

  private normalizeFormValue(formValue: typeof this.filterForm.value): string {
    return JSON.stringify({
      productGrouping: formValue.productGrouping || null,
      specialInventory: formValue.specialInventory ?? null,
      priceRange: formValue.priceRange || null,
      price: formValue.price !== null && formValue.price !== '' ? formValue.price : null,
      effectiveDatePeriod: formValue.effectiveDatePeriod || null,
      effectiveDate: formValue.effectiveDate?.format?.('YYYY-MM-DD') ?? null,
      terminationDatePeriod: formValue.terminationDatePeriod || null,
      terminationDate: formValue.terminationDate?.format?.('YYYY-MM-DD') ?? null
    });
  }

  private loadFilters(): void {
    this.isLoadingFilters = true;
    this.groupingOptionsSignal.set([]);
    this.cdr.markForCheck();

    this.service.getFilterOptions()
      .pipe(take(1))
      .subscribe({
        next: res => {
          const data = res.Item || res.Data?.[0] || res.Data || (res as any);
          const raw: { code?: string; description?: string; Code?: string; Description?: string }[] =
            (data as any)?.ProductGrouping || (data as any)?.productGrouping || [];
          const groupings: ProductGroupingOption[] = raw
            .filter(g => g.code || g.Code)
            .map(g => ({ code: g.code ?? g.Code ?? '', description: g.description ?? g.Description ?? '' }));
          this.groupingOptionsSignal.set(groupings);
          this.isLoadingFilters = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.groupingOptionsSignal.set([]);
          this.isLoadingFilters = false;
          this.cdr.markForCheck();
        }
      });
  }

  get isApplyDisabled(): boolean {
    const formValue = this.filterForm?.value;
    if (!formValue) return true;

    // Check if price range and price are both set (not just range alone)
    const hasPriceFilter = !!(
      formValue.priceRange &&
      (formValue.price !== null && formValue.price !== '' && formValue.price !== undefined)
    );

    const hasAnyValue = !!(
      formValue.productGrouping ||
      (formValue.specialInventory !== null && formValue.specialInventory !== undefined) ||
      hasPriceFilter ||
      formValue.effectiveDate ||
      formValue.terminationDate
    );

    // Disable if no values OR no changes OR has validation errors
    return !hasAnyValue || !this.hasChanges || this.hasValidationErrors;
  }

  get hasValidationErrors(): boolean {
    const effectiveDateControl = this.filterForm.get('effectiveDate');
    const terminationDateControl = this.filterForm.get('terminationDate');
    const priceControl = this.filterForm.get('price');

    const effectiveDateHasFormatError = !!(
      effectiveDateControl?.hasError('invalidDateFormat') ||
      effectiveDateControl?.hasError('matDatepickerParse')
    );
    const terminationDateHasFormatError = !!(
      terminationDateControl?.hasError('invalidDateFormat') ||
      terminationDateControl?.hasError('matDatepickerParse')
    );

    return !!(
      this.filterForm.get('effectiveDatePeriod')?.invalid ||
      this.filterForm.get('terminationDatePeriod')?.invalid ||
      effectiveDateHasFormatError ||
      terminationDateHasFormatError ||
      priceControl?.invalid ||
      this.priceRangeError
    );
  }

  onApply(): void {
    const priceRange = this.filterForm.value.priceRange;
    const price = this.filterForm.value.price;
    const effectiveDatePeriod = this.filterForm.value.effectiveDatePeriod;
    const effectiveDate = this.filterForm.value.effectiveDate;
    const terminationDatePeriod = this.filterForm.value.terminationDatePeriod;
    const terminationDate = this.filterForm.value.terminationDate;

    this.priceRangeError = '';
    let hasError = false;

    if ((price !== null && price !== '') && !priceRange) {
      this.priceRangeError = 'Range is required';
      hasError = true;
    }

    if (effectiveDate && !effectiveDatePeriod) {
      this.validateEffectiveDatePeriod();
      hasError = true;
    }

    if (terminationDate && !terminationDatePeriod) {
      this.validateTerminationDatePeriod();
      hasError = true;
    }

    // Mark date fields as touched to show cross-field errors
    this.filterForm.get('effectiveDate')?.markAsTouched();
    this.filterForm.get('terminationDate')?.markAsTouched();

    // Check for cross-field date range errors
    if (this.filterForm.hasError('dateRangeInvalid')) {
      hasError = true;
    }

    if (hasError || this.hasValidationErrors) {
      this.cdr.markForCheck();
      return;
    }

    const filters: InventoryProductTypeFilterValue = {
      productGrouping: this.filterForm.value.productGrouping || null,
      specialInventory: this.filterForm.value.specialInventory !== null && this.filterForm.value.specialInventory !== undefined
        ? this.filterForm.value.specialInventory
        : null,
      priceRange: this.filterForm.value.priceRange || null,
      price: (price !== null && price !== '' && price !== undefined) ? Number(price) : null,
      effectiveDateFrom: effectiveDatePeriod === 'After' && effectiveDate
        ? DateFieldValidationUtility.serializeDateForApi(effectiveDate)
        : null,
      effectiveDateTo: effectiveDatePeriod === 'Before' && effectiveDate
        ? DateFieldValidationUtility.serializeDateForApi(effectiveDate)
        : null,
      terminationDateFrom: terminationDatePeriod === 'After' && terminationDate
        ? DateFieldValidationUtility.serializeDateForApi(terminationDate)
        : null,
      terminationDateTo: terminationDatePeriod === 'Before' && terminationDate
        ? DateFieldValidationUtility.serializeDateForApi(terminationDate)
        : null
    };
    this.apply.emit(filters);
    this.appliedFilterSnapshot = this.normalizeFormValue(this.filterForm.value);
    this.hasChanges = false;
  }

  onClear(): void {
    this.filterForm.reset();
    this.priceRangeError = '';
    this.groupingSearchCtrl.setValue('');
    this.appliedFilterSnapshot = this.normalizeFormValue(this.filterForm.value);
    this.hasChanges = false;
    this.cdr.markForCheck();
  }

  onClose(): void {
    this.close.emit();
  }

  preventInvalidPriceInput(event: KeyboardEvent): void {
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (allowedKeys.includes(event.key)) return;

    const input = event.target as HTMLInputElement;
    const currentValue = input.value;
    const key = event.key;
    const selectionStart = input.selectionStart || 0;

    // Prevent spaces entirely
    if (key === ' ') {
      event.preventDefault();
      return;
    }

    // Allow minus sign only at the beginning
    if (key === '-') {
      if (selectionStart === 0 && !currentValue.includes('-')) {
        return; // Allow minus at start
      } else {
        event.preventDefault(); // Prevent minus elsewhere
        return;
      }
    }

    // Allow only digits and decimal point
    if (!/^[0-9.]$/.test(key)) {
      event.preventDefault();
      return;
    }

    // Prevent multiple decimal points
    if (key === '.' && currentValue.includes('.')) {
      event.preventDefault();
      return;
    }

    // If there's already a decimal point, check decimal places
    if (currentValue.includes('.')) {
      const parts = currentValue.split('.');
      const selectionEnd = input.selectionEnd || 0;

      if (selectionStart > currentValue.indexOf('.') &&
          parts[1].length >= 2 &&
          selectionStart === selectionEnd) {
        event.preventDefault();
        return;
      }
    }
  }

  preventInvalidPricePaste(event: ClipboardEvent): void {
    const pastedText = event.clipboardData?.getData('text') || '';
    // Now allows negative numbers: -123.45
    if (!/^-?\d+(\.\d{0,2})?$/.test(pastedText)) {
      event.preventDefault();
    }
  }
}
