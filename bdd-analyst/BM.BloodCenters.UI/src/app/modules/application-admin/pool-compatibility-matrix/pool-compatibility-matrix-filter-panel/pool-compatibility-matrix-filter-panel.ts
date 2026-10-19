import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  Input,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { TranslateModule } from '@ngx-translate/core';
import { forkJoin, take, Subject, takeUntil } from 'rxjs';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import moment from 'moment';

import { PoolCompatibilityMatrixService } from '../services/pool-compatibility-matrix.service';
import { PoolCompatibilityMatrixFilterValue, ProductTypeOption } from '../models/pool-compatibility-matrix.model';
import { HeaderService } from '@shared/services/header.service';

@Component({
  selector: 'app-pool-compatibility-matrix-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatDatepickerModule,
    MatInputModule,
    MatFormFieldModule,
    TranslateModule,
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './pool-compatibility-matrix-filter-panel.html',
  styleUrls: ['./pool-compatibility-matrix-filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PoolCompatibilityMatrixFilterPanel implements OnInit, OnDestroy {
  @Input() currentFilters: PoolCompatibilityMatrixFilterValue | null = null;
  @Output() apply = new EventEmitter<PoolCompatibilityMatrixFilterValue>();
  @Output() close = new EventEmitter<void>();

  filterForm!: FormGroup;

  inventoryProductTypeOptions: ProductTypeOption[] = [];
  finishedProductTypeOptions: ProductTypeOption[] = [];
  periodOptions: string[] = ['After', 'Before'];

  // Search controls
  inventorySearchControl = new FormControl('');
  finishedSearchControl = new FormControl('');

  // Filtered options
  filteredInventoryOptions: ProductTypeOption[] = [];
  filteredFinishedOptions: ProductTypeOption[] = [];

  // Store raw input text to preserve invalid dates
  private effectiveDateRawInput = '';
  private terminationDateRawInput = '';

  private destroy$ = new Subject<void>();
  private initialFilterValues: string = '';

  constructor(
    private fb: FormBuilder,
    private service: PoolCompatibilityMatrixService,
    private cdr: ChangeDetectorRef,
    private headerService: HeaderService
  ) { }

  ngOnInit(): void {
    // Determine period values from current filters
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

    // Parse dates from API format (YYYY-MM-DD) to moment
    const effectiveDate = this.currentFilters?.effectiveDateFrom
      ? moment(this.currentFilters.effectiveDateFrom, 'YYYY-MM-DD')
      : this.currentFilters?.effectiveDateTo
        ? moment(this.currentFilters.effectiveDateTo, 'YYYY-MM-DD')
        : null;

    const terminationDate = this.currentFilters?.terminationDateFrom
      ? moment(this.currentFilters.terminationDateFrom, 'YYYY-MM-DD')
      : this.currentFilters?.terminationDateTo
        ? moment(this.currentFilters.terminationDateTo, 'YYYY-MM-DD')
        : null;

    this.filterForm = this.fb.group({
      inventoryProductType: [this.currentFilters?.inventoryProductType || null],
      finishedInventoryProductType: [this.currentFilters?.finishedInventoryProductType || null],
      effectiveDatePeriod: [effectiveDatePeriod],
      effectiveDate: [effectiveDate],
      terminationDatePeriod: [terminationDatePeriod],
      terminationDate: [terminationDate]
    });

    // Setup validation listeners for effective date
    this.filterForm.get('effectiveDate')?.valueChanges.subscribe(() => {
      const control = this.filterForm.get('effectiveDate');
      if (control && !control.touched) {
        control.markAsTouched();
      }
      this.validateEffectiveDatePeriod();
    });

    this.filterForm.get('effectiveDatePeriod')?.valueChanges.subscribe(() => {
      this.validateEffectiveDatePeriod();
    });

    // Setup validation listeners for termination date
    this.filterForm.get('terminationDate')?.valueChanges.subscribe(() => {
      const control = this.filterForm.get('terminationDate');
      if (control && !control.touched) {
        control.markAsTouched();
      }
      this.validateTerminationDatePeriod();
    });

    this.filterForm.get('terminationDatePeriod')?.valueChanges.subscribe(() => {
      this.validateTerminationDatePeriod();
    });

    // Save initial values for smart apply button
    this.initialFilterValues = JSON.stringify(this.filterForm.value);

    // Setup search filtering
    this.setupSearchFilters();

    this.loadFilters();
    this.subscribeToChapterChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearchFilters(): void {
    // Inventory search
    this.inventorySearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search || '').toLowerCase();
        this.filteredInventoryOptions = this.inventoryProductTypeOptions.filter(option =>
          option.productType.toLowerCase().includes(term) ||
          option.description?.toLowerCase().includes(term)
        );
        this.cdr.markForCheck();
      });

    // Finished search
    this.finishedSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search || '').toLowerCase();
        this.filteredFinishedOptions = this.finishedProductTypeOptions.filter(option =>
          option.productType.toLowerCase().includes(term) ||
          option.description?.toLowerCase().includes(term)
        );
        this.cdr.markForCheck();
      });
  }

  private loadFilters(): void {
    forkJoin({
      inventoryTypes: this.service.getFilterInventoryProductTypes(),
      finishedTypes: this.service.getFilterFinishedProductTypes()
    })
      .pipe(take(1))
      .subscribe({
        next: response => {
          this.inventoryProductTypeOptions = response.inventoryTypes || [];
          this.finishedProductTypeOptions = response.finishedTypes || [];
          this.filteredInventoryOptions = [...this.inventoryProductTypeOptions];
          this.filteredFinishedOptions = [...this.finishedProductTypeOptions];
          this.cdr.markForCheck();
        },
        error: () => {
          this.inventoryProductTypeOptions = [];
          this.finishedProductTypeOptions = [];
          this.filteredInventoryOptions = [];
          this.filteredFinishedOptions = [];
          this.cdr.markForCheck();
        }
      });
  }

  /**
   * Smart apply button - disabled if no changes made or validation errors exist
   */
  get isApplyDisabled(): boolean {
    const currentValues = JSON.stringify(this.filterForm.value);
    const hasChanges = currentValues !== this.initialFilterValues;

    // Check for validation errors
    const effectiveDateControl = this.filterForm.get('effectiveDate');
    const terminationDateControl = this.filterForm.get('terminationDate');
    const effectiveDatePeriodControl = this.filterForm.get('effectiveDatePeriod');
    const terminationDatePeriodControl = this.filterForm.get('terminationDatePeriod');

    const hasErrors = !!(
      effectiveDateControl?.errors ||
      terminationDateControl?.errors ||
      effectiveDatePeriodControl?.errors ||
      terminationDatePeriodControl?.errors
    );

    return !hasChanges || hasErrors;
  }

  private validateEffectiveDatePeriod(): void {
    const effectiveDate = this.filterForm.get('effectiveDate')?.value;
    const effectiveDatePeriod = this.filterForm.get('effectiveDatePeriod')?.value;
    const effectiveDatePeriodControl = this.filterForm.get('effectiveDatePeriod');

    if (effectiveDate && !effectiveDatePeriod) {
      effectiveDatePeriodControl?.setErrors({ required: true });
      effectiveDatePeriodControl?.markAsTouched();
    } else {
      effectiveDatePeriodControl?.setErrors(null);
    }
    this.cdr.markForCheck();
  }

  private validateTerminationDatePeriod(): void {
    const terminationDate = this.filterForm.get('terminationDate')?.value;
    const terminationDatePeriod = this.filterForm.get('terminationDatePeriod')?.value;
    const terminationDatePeriodControl = this.filterForm.get('terminationDatePeriod');

    if (terminationDate && !terminationDatePeriod) {
      terminationDatePeriodControl?.setErrors({ required: true });
      terminationDatePeriodControl?.markAsTouched();
    } else {
      terminationDatePeriodControl?.setErrors(null);
    }
    this.cdr.markForCheck();
  }

  getEffectiveDatePeriodError(): string {
    const periodControl = this.filterForm.get('effectiveDatePeriod');
    if (periodControl?.hasError('required') && periodControl?.touched) {
      return 'Period is required';
    }
    return '';
  }

  getTerminationDatePeriodError(): string {
    const periodControl = this.filterForm.get('terminationDatePeriod');
    if (periodControl?.hasError('required') && periodControl?.touched) {
      return 'Period is required';
    }
    return '';
  }

  getEffectiveDateError(): string {
    const control = this.filterForm.get('effectiveDate');
    if (control?.hasError('invalidDateFormat')) {
      return 'Effective Date is invalid';
    }
    return '';
  }

  getTerminationDateError(): string {
    const control = this.filterForm.get('terminationDate');
    if (control?.hasError('invalidDateFormat')) {
      return 'Termination Date is invalid';
    }
    return '';
  }

  onApply(): void {
    this.validateEffectiveDatePeriod();
    this.validateTerminationDatePeriod();

    const effectiveDateControl = this.filterForm.get('effectiveDate');
    const terminationDateControl = this.filterForm.get('terminationDate');
    const effectiveDatePeriodControl = this.filterForm.get('effectiveDatePeriod');
    const terminationDatePeriodControl = this.filterForm.get('terminationDatePeriod');

    // Prevent apply if any validation errors exist
    if (effectiveDateControl?.errors ||
        terminationDateControl?.errors ||
        effectiveDatePeriodControl?.errors ||
        terminationDatePeriodControl?.errors) {
      // Mark all controls as touched to show all errors
      effectiveDateControl?.markAsTouched();
      terminationDateControl?.markAsTouched();
      effectiveDatePeriodControl?.markAsTouched();
      terminationDatePeriodControl?.markAsTouched();
      this.cdr.markForCheck();
      return;
    }

    const effectiveDatePeriod = this.filterForm.value.effectiveDatePeriod;
    const effectiveDate = this.filterForm.value.effectiveDate;
    const terminationDatePeriod = this.filterForm.value.terminationDatePeriod;
    const terminationDate = this.filterForm.value.terminationDate;

    const filters: PoolCompatibilityMatrixFilterValue = {
      inventoryProductType: this.filterForm.value.inventoryProductType || null,
      finishedInventoryProductType: this.filterForm.value.finishedInventoryProductType || null,
      effectiveDateFrom: effectiveDatePeriod === 'After' && effectiveDate
        ? DateFieldValidationUtility.serializeDateForApi(effectiveDate) || null
        : null,
      effectiveDateTo: effectiveDatePeriod === 'Before' && effectiveDate
        ? DateFieldValidationUtility.serializeDateForApi(effectiveDate) || null
        : null,
      terminationDateFrom: terminationDatePeriod === 'After' && terminationDate
        ? DateFieldValidationUtility.serializeDateForApi(terminationDate) || null
        : null,
      terminationDateTo: terminationDatePeriod === 'Before' && terminationDate
        ? DateFieldValidationUtility.serializeDateForApi(terminationDate) || null
        : null
    };

    // Update initial values after successful apply
    this.initialFilterValues = JSON.stringify(this.filterForm.value);
    this.apply.emit(filters);
  }

  onEffectiveDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const inputValue = input.value.trim();
    this.effectiveDateRawInput = inputValue;

    const control = this.filterForm.get('effectiveDate');
    if (!control) return;

    control.markAsDirty();
    control.markAsTouched();

    // DateFieldUtility validation: check if input can be parsed as valid moment
    setTimeout(() => {
      if (inputValue && !control.value) {
        control.setErrors({ invalidDateFormat: true });
      }
      this.cdr.markForCheck();
    }, 0);
  }

  /**
   * Handle blur event for effective date field
   * Uses DateFieldUtility.formatDateForUI() for auto-formatting
   */
  onEffectiveDateBlur(input: HTMLInputElement): void {
    setTimeout(() => {
      const control = this.filterForm.get('effectiveDate');
      if (!control) return;

      control.markAsTouched();

      const controlValue = control.value;
      const inputValue = input.value.trim();

      // Check if we have a valid moment object
      if (controlValue && typeof controlValue === 'object' && controlValue.isValid && controlValue.isValid()) {
        // Use DateFieldUtility to format the date
        const formattedDate = DateFieldValidationUtility.formatDateForUI(controlValue);
        input.value = formattedDate;
        this.effectiveDateRawInput = formattedDate;
        control.setErrors(null);
      } else if (inputValue && !controlValue) {
        // Invalid date: restore typed text and set error
        input.value = this.effectiveDateRawInput;
        if (!control.hasError('invalidDateFormat')) {
          control.setErrors({ invalidDateFormat: true });
        }
      } else if (!inputValue) {
        control.setErrors(null);
      }

      this.cdr.markForCheck();
    }, 0);
  }

  onTerminationDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const inputValue = input.value.trim();
    this.terminationDateRawInput = inputValue;

    const control = this.filterForm.get('terminationDate');
    if (!control) return;

    control.markAsDirty();
    control.markAsTouched();

    // DateFieldUtility validation: check if input can be parsed as valid moment
    setTimeout(() => {
      if (inputValue && !control.value) {
        control.setErrors({ invalidDateFormat: true });
      }
      this.cdr.markForCheck();
    }, 0);
  }

  /**
   * Handle blur event for termination date field
   * Uses DateFieldUtility.formatDateForUI() for auto-formatting
   */
  onTerminationDateBlur(input: HTMLInputElement): void {
    setTimeout(() => {
      const control = this.filterForm.get('terminationDate');
      if (!control) return;

      control.markAsTouched();

      const controlValue = control.value;
      const inputValue = input.value.trim();

      // Check if we have a valid moment object
      if (controlValue && typeof controlValue === 'object' && controlValue.isValid && controlValue.isValid()) {
        // Use DateFieldUtility to format the date
        const formattedDate = DateFieldValidationUtility.formatDateForUI(controlValue);
        input.value = formattedDate;
        this.terminationDateRawInput = formattedDate;
        control.setErrors(null);
      } else if (inputValue && !controlValue) {
        // Invalid date: restore typed text and set error
        input.value = this.terminationDateRawInput;
        if (!control.hasError('invalidDateFormat')) {
          control.setErrors({ invalidDateFormat: true });
        }
      } else if (!inputValue) {
        control.setErrors(null);
      }

      this.cdr.markForCheck();
    }, 0);
  }

  onClear(): void {
    this.filterForm.reset({
      inventoryProductType: null,
      finishedInventoryProductType: null,
      effectiveDatePeriod: null,
      effectiveDate: null,
      terminationDatePeriod: null,
      terminationDate: null
    });
    this.filterForm.markAsUntouched();
    this.filterForm.markAsPristine();
    this.inventorySearchControl.setValue('');
    this.finishedSearchControl.setValue('');
    this.effectiveDateRawInput = '';
    this.terminationDateRawInput = '';
    this.initialFilterValues = JSON.stringify(this.filterForm.value);
    this.cdr.markForCheck();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Close the filter panel when chapter changes to prevent stale filter data
        this.close.emit();
      });
  }

  onClose(): void {
    this.close.emit();
  }
}
