import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DATE_FORMATS, DateAdapter, ErrorStateMatcher } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DefineOrderChargesService } from '../services/define-order-charges.service';
import { OrderChargesFilterFormValue, ServiceCodeDropdownOption } from '../models/define-order-charges.model';

/**
 * Filter panel component for Define Order Charges
 * Provides filtering by service code
 */
@Component({
  selector: 'app-define-order-charges-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatInputModule,
    MatProgressSpinnerModule,
    NgxMatSelectSearchModule
  ],
  templateUrl: './define-order-charges-filter-panel.html',
  styleUrls: ['./define-order-charges-filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }
  ]
})
export class DefineOrderChargesFilterPanel implements OnInit, OnDestroy {
  @Input() currentFilters: OrderChargesFilterFormValue | null = null;
  @Output() apply = new EventEmitter<OrderChargesFilterFormValue>();
  @Output() close = new EventEmitter<void>();

  @ViewChild('effDateNativeInput') effDateNativeInput?: ElementRef;
  @ViewChild('termDateNativeInput') termDateNativeInput?: ElementRef;

  private fb = inject(FormBuilder);
  private service = inject(DefineOrderChargesService);
  private cdr = inject(ChangeDetectorRef);

  filterForm!: FormGroup;

  // Service Code dropdown
  serviceCodeOptions: string[] = [];
  filteredServiceCodeOptions: string[] = [];
  serviceCodeSearchControl = new FormControl<string>('');

  isLoadingFilters = false;

  /**
   * Sentinel values for disabled mat-option rows in the panel (loading / empty).
   * Not valid codes; options are disabled so they never become the control value.
   */
  readonly selectPanelLoadingValue = '__FILTER_PANEL_LOADING__';
  readonly selectPanelEmptyValue = '__FILTER_PANEL_EMPTY__';

  // Custom error matchers
  effDateErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control): boolean => {
      if (!control || !(control.dirty || control.touched)) return false;
      if (control.invalid) return true;
      return !control.value && !!this.getNativeInputText(this.effDateNativeInput);
    }
  };

  termDateErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control): boolean => {
      if (!control || !(control.dirty || control.touched)) return false;
      if (control.invalid) return true;
      return !control.value && !!this.getNativeInputText(this.termDateNativeInput);
    }
  };

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      serviceCode: [this.currentFilters?.serviceCode || null],
      effectiveDatePeriod: [this.currentFilters?.effectiveDatePeriod || null],
      effectiveDate: [
        this.currentFilters?.effectiveDate ? new Date(this.currentFilters.effectiveDate) : null
      ],
      terminationDatePeriod: [this.currentFilters?.terminationDatePeriod || null],
      terminationDate: [
        this.currentFilters?.terminationDate ? new Date(this.currentFilters.terminationDate) : null
      ]
    });

    this.filterForm.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((date) => {
        const control = this.filterForm.get('effectiveDate');
        const periodControl = this.filterForm.get('effectiveDatePeriod');
        if (control && !control.touched) control.markAsTouched();
        const hasValidDate = date && !control?.hasError('matDatepickerParse');
        if (hasValidDate && periodControl) periodControl.markAsTouched();
        this.validateEffectiveDatePeriod();
      });

    this.filterForm.get('effectiveDate')?.statusChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const control = this.filterForm.get('effectiveDate');
        const periodControl = this.filterForm.get('effectiveDatePeriod');
        const hasValidDate = control?.value && !control?.hasError('matDatepickerParse');
        if (hasValidDate && periodControl) periodControl.markAsTouched();
        this.validateEffectiveDatePeriod();
      });

    this.filterForm.get('effectiveDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.validateEffectiveDatePeriod());

    this.filterForm.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((date) => {
        const control = this.filterForm.get('terminationDate');
        const periodControl = this.filterForm.get('terminationDatePeriod');
        if (control && !control.touched) control.markAsTouched();
        const hasValidDate = date && !control?.hasError('matDatepickerParse');
        if (hasValidDate && periodControl) periodControl.markAsTouched();
        this.validateTerminationDatePeriod();
      });

    this.filterForm.get('terminationDate')?.statusChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const control = this.filterForm.get('terminationDate');
        const periodControl = this.filterForm.get('terminationDatePeriod');
        const hasValidDate = control?.value && !control?.hasError('matDatepickerParse');
        if (hasValidDate && periodControl) periodControl.markAsTouched();
        this.validateTerminationDatePeriod();
      });

    this.filterForm.get('terminationDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.validateTerminationDatePeriod());

    // Setup service code dropdown search
    this.serviceCodeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((search) => {
        const term = (search ?? '').toLowerCase();
        this.filteredServiceCodeOptions = this.serviceCodeOptions.filter((code) =>
          code.toLowerCase().includes(term)
        );
      });

    this.loadFilterOptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private getNativeInputText(elRef?: ElementRef): string {
    return elRef?.nativeElement?.value?.trim() ?? '';
  }

  get isApplyDisabled(): boolean {
    if (this.filterForm?.invalid) return true;

    if (this.getEffectiveDateError() || this.getTerminationDateError()) return true;

    const formValue = this.filterForm.value;
    const effDateControl = this.filterForm.get('effectiveDate');
    const termDateControl = this.filterForm.get('terminationDate');
    const effPeriodControl = this.filterForm.get('effectiveDatePeriod');
    const termPeriodControl = this.filterForm.get('terminationDatePeriod');

    const hasDateFormatErrors = !!(
      effDateControl?.hasError('matDatepickerParse') ||
      termDateControl?.hasError('matDatepickerParse')
    );
    if (hasDateFormatErrors) return true;

    if (!effDateControl?.value && this.getNativeInputText(this.effDateNativeInput)) return true;
    if (!termDateControl?.value && this.getNativeInputText(this.termDateNativeInput)) return true;

    if (formValue.effectiveDatePeriod && !formValue.effectiveDate) return true;
    if (formValue.terminationDatePeriod && !formValue.terminationDate) return true;

    const hasPeriodErrors = (effPeriodControl?.invalid ?? false) || (termPeriodControl?.invalid ?? false);
    if (hasPeriodErrors) return true;

    const hasEffectiveDateFilter = formValue.effectiveDate && formValue.effectiveDatePeriod;
    const hasTerminationDateFilter = formValue.terminationDate && formValue.terminationDatePeriod;
    const hasAnyValue = formValue.serviceCode ||
                        hasEffectiveDateFilter ||
                        hasTerminationDateFilter;

    return !hasAnyValue;
  }

  /**
   * Load filter options from backend API
   */
  private loadFilterOptions(): void {
    this.isLoadingFilters = true;
    this.serviceCodeOptions = [];
    this.filteredServiceCodeOptions = [];

    this.service.getFilterServiceCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          // Extract service codes from response
          if (Array.isArray(response)) {
            this.serviceCodeOptions = response.map((option: any) => option.code);
            this.filteredServiceCodeOptions = [...this.serviceCodeOptions];
            this.serviceCodeSearchControl.setValue('', { emitEvent: false });
          }

          this.isLoadingFilters = false;
          this.cdr.markForCheck();
        },
        error: (error: any) => {
          console.error('Error loading filter options:', error);
          console.error('Error details:', error.error);
          // Fallback to empty arrays on error
          this.serviceCodeOptions = [];
          this.filteredServiceCodeOptions = [];
          this.isLoadingFilters = false;
          this.cdr.markForCheck();
        }
      });
  }

  getEffectiveDateError(): string {
    const control = this.filterForm?.get('effectiveDate');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('matDatepickerParse')) return 'Effective Date is invalid';
    if (!control.value && this.getNativeInputText(this.effDateNativeInput)) return 'Effective Date is invalid';
    return '';
  }

  getTerminationDateError(): string {
    const control = this.filterForm?.get('terminationDate');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('matDatepickerParse')) return 'Termination Date is invalid';
    if (!control.value && this.getNativeInputText(this.termDateNativeInput)) return 'Termination Date is invalid';
    return '';
  }

  onApply(): void {
    this.validateEffectiveDatePeriod();
    this.validateTerminationDatePeriod();

    const effDateControl = this.filterForm.get('effectiveDate');
    const termDateControl = this.filterForm.get('terminationDate');
    const effPeriodControl = this.filterForm.get('effectiveDatePeriod');
    const termPeriodControl = this.filterForm.get('terminationDatePeriod');

    if (effDateControl?.errors ||
        termDateControl?.errors ||
        effPeriodControl?.errors ||
        termPeriodControl?.errors) {
      effDateControl?.markAsTouched();
      termDateControl?.markAsTouched();
      effPeriodControl?.markAsTouched();
      termPeriodControl?.markAsTouched();
      this.cdr.markForCheck();
      return;
    }

    const formValue = this.filterForm.value;

    const filters: OrderChargesFilterFormValue = {
      serviceCode: formValue.serviceCode || null,
      effectiveDate: formValue.effectiveDate
        ? this.formatDateForApi(formValue.effectiveDate)
        : null,
      effectiveDatePeriod: formValue.effectiveDate ? formValue.effectiveDatePeriod : null,
      terminationDate: formValue.terminationDate
        ? this.formatDateForApi(formValue.terminationDate)
        : null,
      terminationDatePeriod: formValue.terminationDate ? formValue.terminationDatePeriod : null
    };

    this.apply.emit(filters);
  }

  onClear(): void {
    this.filterForm.reset();
    this.filterForm.get('effectiveDatePeriod')?.setErrors(null);
    this.filterForm.get('terminationDatePeriod')?.setErrors(null);
    this.serviceCodeSearchControl.setValue('', { emitEvent: false });
    this.cdr.markForCheck();
  }

  onClose(): void {
    this.close.emit();
  }

  private validateEffectiveDatePeriod(): void {
    const effDateControl = this.filterForm.get('effectiveDate');
    const effDate = effDateControl?.value;
    const effDatePeriod = this.filterForm.get('effectiveDatePeriod')?.value;
    const effDatePeriodControl = this.filterForm.get('effectiveDatePeriod');

    const hasValidDate = effDate && !effDateControl?.hasError('matDatepickerParse');

    if (hasValidDate && !effDatePeriod) {
      effDatePeriodControl?.setErrors({ required: true });
      effDatePeriodControl?.markAsTouched();
    } else {
      effDatePeriodControl?.setErrors(null);
    }
    this.cdr.markForCheck();
  }

  private validateTerminationDatePeriod(): void {
    const termDateControl = this.filterForm.get('terminationDate');
    const termDate = termDateControl?.value;
    const termDatePeriod = this.filterForm.get('terminationDatePeriod')?.value;
    const termDatePeriodControl = this.filterForm.get('terminationDatePeriod');

    const hasValidDate = termDate && !termDateControl?.hasError('matDatepickerParse');

    if (hasValidDate && !termDatePeriod) {
      termDatePeriodControl?.setErrors({ required: true });
      termDatePeriodControl?.markAsTouched();
    } else {
      termDatePeriodControl?.setErrors(null);
    }
    this.cdr.markForCheck();
  }

  private formatDateForApi(date: Date | null): string | null {
    if (!date) return null;

    // Ensure we have a valid Date object
    const d = date instanceof Date ? date : new Date(date);

    if (isNaN(d.getTime())) {
      console.error('Invalid date in formatDateForApi:', date);
      return null;
    }

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
