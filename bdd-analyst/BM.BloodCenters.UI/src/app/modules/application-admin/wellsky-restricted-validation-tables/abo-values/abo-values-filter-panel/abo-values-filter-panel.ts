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
import { FormBuilder, FormGroup, ReactiveFormsModule, AbstractControl, ValidationErrors, FormControl } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { dateFormatValidator } from 'src/app/core/utils/date-adapter.util';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { Subject, takeUntil } from 'rxjs';
import moment from 'moment';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { AboValuesFilterValue, DropdownOption } from '../models/abo-values.model';
import { AboValuesService } from '../services/abo-values.service';

@Component({
  selector: 'app-abo-values-filter-panel',
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
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './abo-values-filter-panel.html',
  styleUrls: ['./abo-values-filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AboValuesFilterPanel implements OnInit, OnDestroy {
  @Input() currentFilters: AboValuesFilterValue | null = null;
  @Output() apply = new EventEmitter<any>();
  @Output() close = new EventEmitter<void>();

  filterForm!: FormGroup;

  intendedUseOptions = signal<DropdownOption[]>([]);
  unitSchemeOptions = signal<DropdownOption[]>([]);
  transfusionStatusOptions = signal<DropdownOption[]>([]);
  periodOptions: { value: string; display: string }[] = [
    { value: 'After', display: 'After' },
    { value: 'Before', display: 'Before' }
  ];

  // Search controls
  readonly intendedUseSearchControl = new FormControl('');
  readonly transfusionStatusSearchControl = new FormControl('');

  // Search signals
  private intendedUseSearch = signal('');
  private transfusionStatusSearch = signal('');

  // Filtered options
  readonly filteredIntendedUseOptions = computed(() => {
    const search = this.intendedUseSearch().toLowerCase();
    const options = this.intendedUseOptions();
    if (!search) return options;
    return options.filter(o =>
      o.key.toLowerCase().includes(search) ||
      o.value.toLowerCase().includes(search)
    );
  });

  readonly filteredTransfusionStatusOptions = computed(() => {
    const search = this.transfusionStatusSearch().toLowerCase();
    const options = this.transfusionStatusOptions();
    if (!search) return options;
    return options.filter(o =>
      o.key.toLowerCase().includes(search) ||
      o.value.toLowerCase().includes(search)
    );
  });

  isLoadingFilters = false;

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
    private aboValuesService: AboValuesService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      intendedUse: [this.currentFilters?.intendedUse || null],
      unitScheme: [this.currentFilters?.unitScheme || null],
      transfusionStatus: [this.currentFilters?.transfusionStatus || null],
      effectiveDatePeriod: [this.currentFilters?.effectiveDatePeriod || null],
      effectiveDate: [this.currentFilters?.effectiveDate ? new Date(this.currentFilters.effectiveDate) : null, [dateFormatValidator()]],
      terminationDatePeriod: [this.currentFilters?.terminationDatePeriod || null],
      terminationDate: [this.currentFilters?.terminationDate ? new Date(this.currentFilters.terminationDate) : null, [dateFormatValidator()]]
    });

    // Setup search control subscriptions
    this.intendedUseSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.intendedUseSearch.set(value || ''));

    this.transfusionStatusSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.transfusionStatusSearch.set(value || ''));

    this.setupValidation();
    this.loadFilterOptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupValidation(): void {
    // Add immediate validation on date changes
    this.filterForm.get('effectiveDate')?.valueChanges.subscribe(() => {
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

    this.filterForm.get('terminationDate')?.valueChanges.subscribe(() => {
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
    this.filterForm.get('effectiveDatePeriod')?.valueChanges.subscribe(() => {
      this.validateEffectivePeriod();
      this.cdr.markForCheck();
    });

    this.filterForm.get('terminationDatePeriod')?.valueChanges.subscribe(() => {
      this.validateTerminationPeriod();
      this.cdr.markForCheck();
    });
  }

  validateEffectivePeriod(): void {
    const date = this.filterForm.get('effectiveDate')?.value;
    const period = this.filterForm.get('effectiveDatePeriod')?.value;
    this.effectivePeriodRequired = !!date && !period;
    this.effectiveDateRequired = !!period && !date;
  }

  validateTerminationPeriod(): void {
    const date = this.filterForm.get('terminationDate')?.value;
    const period = this.filterForm.get('terminationDatePeriod')?.value;
    this.terminationPeriodRequired = !!date && !period;
    this.terminationDateRequired = !!period && !date;
  }

  /**
   * Load filter options from backend API
   */
  private loadFilterOptions(): void {
    this.isLoadingFilters = true;

    this.aboValuesService.getAboValuesFilters().subscribe({
      next: (response) => {
        // Handle response structure: response.data[0] contains the filter options
        let filterData = null;

        if (response.data && response.data.length > 0) {
          filterData = response.data[0];
        } else if (response.item) {
          filterData = response.item;
        }

        if (filterData) {
          // Extract dropdown options with key-value pairs
          this.intendedUseOptions.set(filterData.intendedUse || []);
          this.unitSchemeOptions.set(filterData.unitScheme || []);
          this.transfusionStatusOptions.set(filterData.transfusionStatus || []);
        }

        this.isLoadingFilters = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        // Fallback to empty arrays on error
        this.intendedUseOptions.set([]);
        this.unitSchemeOptions.set([]);
        this.transfusionStatusOptions.set([]);
        this.isLoadingFilters = false;
        this.cdr.markForCheck();
      }
    });
  }

  get isApplyDisabled(): boolean {
    // Check if there are validation errors
    if (this.effectivePeriodRequired || this.terminationPeriodRequired ||
        this.effectiveDateRequired || this.terminationDateRequired) {
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
    const hasIntendedUse = values?.intendedUse !== null && values?.intendedUse !== undefined;
    const hasUnitScheme = values?.unitScheme !== null && values?.unitScheme !== undefined;
    const hasTransfusionStatus = values?.transfusionStatus !== null && values?.transfusionStatus !== undefined;
    // Both period AND date must be filled for effective/termination dates
    const hasEffectiveDate = values?.effectiveDatePeriod && values?.effectiveDate;
    const hasTerminationDate = values?.terminationDatePeriod && values?.terminationDate;

    return !(hasIntendedUse || hasUnitScheme || hasTransfusionStatus || hasEffectiveDate || hasTerminationDate);
  }

  onApply(): void {
    const formValue = this.filterForm.value;

    const filters: AboValuesFilterValue = {
      intendedUse: formValue.intendedUse || null,
      unitScheme: formValue.unitScheme || null,
      transfusionStatus: formValue.transfusionStatus || null,
      effectiveDatePeriod: formValue.effectiveDatePeriod || null,
      effectiveDate: formValue.effectiveDate ? this.convertToUTCDate(formValue.effectiveDate)?.toISOString() || null : null,
      terminationDatePeriod: formValue.terminationDatePeriod || null,
      terminationDate: formValue.terminationDate ? this.convertToUTCDate(formValue.terminationDate)?.toISOString() || null : null
    };

    this.apply.emit(filters);
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

  onClear(): void {
    this.filterForm.reset({
      intendedUse: null,
      unitScheme: null,
      transfusionStatus: null,
      effectiveDatePeriod: null,
      effectiveDate: null,
      terminationDatePeriod: null,
      terminationDate: null
    });
    this.effectiveDateRawInput = '';
    this.terminationDateRawInput = '';
    this.effectivePeriodRequired = false;
    this.terminationPeriodRequired = false;
    this.effectiveDateRequired = false;
    this.terminationDateRequired = false;
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
