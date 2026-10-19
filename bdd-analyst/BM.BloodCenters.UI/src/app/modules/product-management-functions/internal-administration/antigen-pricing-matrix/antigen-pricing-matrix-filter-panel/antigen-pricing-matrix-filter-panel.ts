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
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
// WCAG 2.1.2 / 2.4.3: A11yModule provides cdkTrapFocus directive for focus trapping in the dialog overlay
import { A11yModule } from '@angular/cdk/a11y';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { dateFormatValidator } from 'src/app/core/utils/date-adapter.util';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';
import moment from 'moment';

import { AntigenPricingMatrixFilterValue } from '../models/antigen-pricing-matrix.model';
import { AntigenPricingMatrixApiService } from '../services/antigen-pricing-matrix-api.service';

@Component({
  selector: 'app-antigen-pricing-matrix-filter-panel',
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
    MatProgressSpinnerModule,
    NgxMatSelectSearchModule,
    A11yModule  // WCAG 2.1.2 / 2.4.3: provides cdkTrapFocus for focus trap in dialog overlay
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './antigen-pricing-matrix-filter-panel.html',
  styleUrls: ['./antigen-pricing-matrix-filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AntigenPricingMatrixFilterPanel implements OnInit, OnDestroy {
  @Input() currentFilters: AntigenPricingMatrixFilterValue | null = null;
  @Input() serviceCodeOptions: string[] = [];
  @Output() apply = new EventEmitter<AntigenPricingMatrixFilterValue>();
  @Output() close = new EventEmitter<void>();

  filterForm!: FormGroup;

  // Service Code filter
  filteredServiceCodeOptions: string[] = [];
  serviceCodeSearchControl = new FormControl<string>('');
  isLoadingFilters = false;

  // Validation flags for period/date combinations
  effPeriodRequired = false;
  termPeriodRequired = false;

  // Store raw input text to preserve invalid dates
  private effDateRawInput = '';
  private termDateRawInput = '';

  // Error state matchers for date fields
  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getEffectiveDateError(),
  );
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getTerminationDateError(),
  );

  /**
   * Sentinel values for disabled mat-option rows in the panel (loading / empty).
   */
  readonly selectPanelLoadingValue = '__FILTER_PANEL_LOADING__';
  readonly selectPanelEmptyValue = '__FILTER_PANEL_EMPTY__';

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      serviceCode: [this.currentFilters?.serviceCode || null],
      antigenQty: [this.currentFilters?.antigenQty ?? null, [Validators.min(1), Validators.max(9999)]],
      effDatePeriod: [this.currentFilters?.effDatePeriod ?? null],
      effDate: [this.currentFilters?.effDate ? new Date(this.currentFilters.effDate) : null, [dateFormatValidator()]],
      termDatePeriod: [this.currentFilters?.termDatePeriod ?? null],
      termDate: [this.currentFilters?.termDate ? new Date(this.currentFilters.termDate) : null, [dateFormatValidator()]]
    });

    this.setupDateValidation();
    this.setupServiceCodeSearch();
  }

  private setupDateValidation(): void {
    this.filterForm.get('effDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const control = this.filterForm.get('effDate');
        if (control && !control.touched) {
          control.markAsTouched();
        }
        setTimeout(() => {
          this.validateEffPeriod();
          this.cdr.markForCheck();
        }, 0);
      });

    this.filterForm.get('termDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const control = this.filterForm.get('termDate');
        if (control && !control.touched) {
          control.markAsTouched();
        }
        setTimeout(() => {
          this.validateTermPeriod();
          this.cdr.markForCheck();
        }, 0);
      });

    this.filterForm.get('effDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateEffPeriod();
        this.cdr.markForCheck();
      });

    this.filterForm.get('termDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateTermPeriod();
        this.cdr.markForCheck();
      });
  }

  private setupServiceCodeSearch(): void {
    // Initialize filtered options
    this.filteredServiceCodeOptions = [...this.serviceCodeOptions];

    // Setup search filtering
    this.serviceCodeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((search) => {
        const term = (search ?? '').toLowerCase();
        this.filteredServiceCodeOptions = this.serviceCodeOptions.filter((code) =>
          code.toLowerCase().includes(term)
        );
        this.cdr.markForCheck();
      });
  }

  validateEffPeriod(): void {
    this.effPeriodRequired = this.isPeriodRequired('effDate', 'effDatePeriod');
  }

  validateTermPeriod(): void {
    this.termPeriodRequired = this.isPeriodRequired('termDate', 'termDatePeriod');
  }

  private isPeriodRequired(dateControl: string, periodControl: string): boolean {
    const date = this.filterForm.get(dateControl)?.value;
    const period = this.filterForm.get(periodControl)?.value;
    return !!date && !period;
  }

  getEffectiveDateError(): string {
    const control = this.filterForm?.get('effDate');
    if (!control) return '';

    if (control.hasError('required')) {
      return 'Effective Date is required';
    }
    if (control.hasError('matDatepickerParse')) {
      return 'Invalid date format';
    }
    if (control.hasError('invalidDateFormat')) {
      return 'Invalid date format';
    }
    if (control.hasError('invalidDate')) {
      return 'Invalid date format';
    }
    return '';
  }

  getTerminationDateError(): string {
    const control = this.filterForm?.get('termDate');
    if (!control) return '';

    if (control.hasError('matDatepickerParse')) {
      return 'Invalid date format';
    }
    if (control.hasError('invalidDateFormat')) {
      return 'Invalid date format';
    }
    if (control.hasError('invalidDate')) {
      return 'Invalid date format';
    }
    return '';
  }

  get isApplyDisabled(): boolean {
    if (this.effPeriodRequired || this.termPeriodRequired) {
      return true;
    }

    if (this.hasDateErrors('effDate') || this.hasDateErrors('termDate')) {
      return true;
    }

    const formValue = this.filterForm.value;
    const hasAntigenQtyError = this.filterForm.get('antigenQty')?.invalid && formValue.antigenQty != null;
    if (hasAntigenQtyError) return true;
    return !formValue.serviceCode && formValue.antigenQty == null && !formValue.effDate && !formValue.termDate;
  }

  private hasDateErrors(controlName: string): boolean {
    const control = this.filterForm.get(controlName);
    return control?.hasError('invalidDateFormat') ||
           control?.hasError('matDatepickerParse') ||
           control?.hasError('invalidDate') ||
           false;
  }

  onApply(): void {
    const formValue = this.filterForm.value;
    const filters: AntigenPricingMatrixFilterValue = {};

    if (formValue.serviceCode) {
      filters.serviceCode = formValue.serviceCode;
    }
    if (formValue.antigenQty != null && formValue.antigenQty !== '') {
      filters.antigenQty = Number(formValue.antigenQty);
    }
    if (formValue.effDate) {
      filters.effDatePeriod = formValue.effDatePeriod;
      filters.effDate = this.convertToUTCDate(formValue.effDate)?.toISOString() || undefined;
    }
    if (formValue.termDate) {
      filters.termDatePeriod = formValue.termDatePeriod;
      filters.termDate = this.convertToUTCDate(formValue.termDate)?.toISOString() || undefined;
    }

    this.apply.emit(filters);
  }

  private convertToUTCDate(date: moment.Moment | Date | null): Date | null {
    if (!date) return null;

    if (moment.isMoment(date)) {
      return new Date(Date.UTC(
        date.year(),
        date.month(),
        date.date(),
        0, 0, 0, 0
      ));
    }

    return new Date(Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      0, 0, 0, 0
    ));
  }

  onClear(): void {
    this.filterForm.reset({
      serviceCode: null,
      antigenQty: null,
      effDatePeriod: null,
      effDate: null,
      termDatePeriod: null,
      termDate: null
    });

    this.effDateRawInput = '';
    this.termDateRawInput = '';
    this.effPeriodRequired = false;
    this.termPeriodRequired = false;

    this.filterForm.get('effDatePeriod')?.setErrors(null);
    this.filterForm.get('termDatePeriod')?.setErrors(null);

    this.serviceCodeSearchControl.setValue('', { emitEvent: false });

    this.cdr.markForCheck();
  }

  onEffDateInput(event: Event): void {
    this.handleDateInput(event, 'effDate', 'effDateRawInput');
  }

  onEffDateBlur(input: HTMLInputElement): void {
    this.handleDateBlur(input, 'effDate', this.effDateRawInput);
  }

  onTermDateInput(event: Event): void {
    this.handleDateInput(event, 'termDate', 'termDateRawInput');
  }

  onTermDateBlur(input: HTMLInputElement): void {
    this.handleDateBlur(input, 'termDate', this.termDateRawInput);
  }

  private handleDateInput(event: Event, controlName: string, rawInputProp: 'effDateRawInput' | 'termDateRawInput'): void {
    const input = event.target as HTMLInputElement;
    this[rawInputProp] = input.value;
    const control = this.filterForm.get(controlName);
    if (input.value?.trim()) {
      control?.markAsTouched();
      control?.markAsDirty();
      if (!control?.value) {
        control?.setErrors({ invalidDate: true });
      }
      this.cdr.markForCheck();
    }
  }

  private handleDateBlur(input: HTMLInputElement, controlName: string, rawInput: string): void {
    setTimeout(() => {
      const control = this.filterForm.get(controlName);
      if (!control?.value && rawInput && !input.value) {
        input.value = rawInput;
      }
    }, 0);
  }

  onAntigenQtyKeyDown(event: KeyboardEvent): void {
    if (['-', '+', 'e', 'E', '.'].includes(event.key)) {
      event.preventDefault();
    }
  }

  onAntigenQtyInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.value.length > 4) {
      input.value = input.value.slice(0, 4);
      this.filterForm.get('antigenQty')?.setValue(Number(input.value), { emitEvent: false });
    }
  }

  onClose(): void {
    this.close.emit();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
