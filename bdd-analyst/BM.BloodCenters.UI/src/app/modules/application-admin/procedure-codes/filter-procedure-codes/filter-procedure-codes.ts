import { Component, OnInit, Input, Output, EventEmitter, inject, ChangeDetectorRef, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { dateFormatValidator } from 'src/app/core/utils/date-adapter.util';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ProcedureCodeFilter } from '../models/procedure-code.model';
import { ProcedureCodeApiService } from '../services/procedure-code-api.service';
import moment from 'moment';

@Component({
  selector: 'app-filter-procedure-codes',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatIconModule,
    NgxMatSelectSearchModule,
  ],
  templateUrl: './filter-procedure-codes.html',
  styleUrls: ['./filter-procedure-codes.scss'],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FilterProcedureCodesComponent implements OnInit, OnDestroy {
  private apiService = inject(ProcedureCodeApiService);

  @Input() currentFilters: ProcedureCodeFilter | null = null;
  @Output() apply = new EventEmitter<ProcedureCodeFilter>();
  @Output() close = new EventEmitter<void>();

  filterForm!: FormGroup;

  // Search controls for Procedure Code and Deferral Days
  allProcedureCodeOptions: string[] = [];
  filteredProcedureCodeOptions: string[] = [];
  procedureCodeSearchControl = new FormControl('');

  allDeferralDaysOptions: number[] = [];
  filteredDeferralDaysOptions: number[] = [];
  deferralDaysSearchControl = new FormControl('');

  // Validation flags for period/date combinations
  effPeriodRequired = false;
  termPeriodRequired = false;

  // Store raw input text to preserve invalid dates
  private effDateRawInput = '';
  private termDateRawInput = '';
  isLoadingFilters = false;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Setup search functionality
    this.setupProcedureCodeSearch();
    this.setupDeferralDaysSearch();

    this.filterForm = this.fb.group({
      procedureCode: [this.currentFilters?.procedureCode || null],
      deferralDays: [this.currentFilters?.deferralDays || null],
      effDatePeriod: [this.currentFilters?.effDatePeriod || null],
      effDate: [this.currentFilters?.effDate ? new Date(this.currentFilters.effDate) : null, [dateFormatValidator()]],
      termDatePeriod: [this.currentFilters?.termDatePeriod || null],
      termDate: [this.currentFilters?.termDate ? new Date(this.currentFilters.termDate) : null, [dateFormatValidator()]],
    });

    // Add immediate validation on date changes
    this.filterForm.get('effDate')?.valueChanges.subscribe(() => {
      const control = this.filterForm.get('effDate');
      if (control && !control.touched) {
        control.markAsTouched();
      }
      setTimeout(() => {
        this.validateEffPeriod();
        this.cdr.markForCheck();
      }, 0);
    });

    this.filterForm.get('termDate')?.valueChanges.subscribe(() => {
      const control = this.filterForm.get('termDate');
      if (control && !control.touched) {
        control.markAsTouched();
      }
      setTimeout(() => {
        this.validateTermPeriod();
        this.cdr.markForCheck();
      }, 0);
    });

    // Clear errors when period is selected
    this.filterForm.get('effDatePeriod')?.valueChanges.subscribe(() => {
      this.validateEffPeriod();
      this.cdr.markForCheck();
    });

    this.filterForm.get('termDatePeriod')?.valueChanges.subscribe(() => {
      this.validateTermPeriod();
      this.cdr.markForCheck();
    });

    // Fetch dropdown options
    this.loadDropdownOptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Setup Procedure Code search
   */
  private setupProcedureCodeSearch(): void {
    this.procedureCodeSearchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((search: string | null) => {
        const previousLength = this.filteredProcedureCodeOptions.length;

        if (search && search.length >= 1) {
          this.filteredProcedureCodeOptions = this.allProcedureCodeOptions.filter(code =>
            code.toLowerCase().includes(search.toLowerCase())
          );
        } else {
          this.filteredProcedureCodeOptions = [...this.allProcedureCodeOptions];
        }

        // Only trigger change detection if the filtered options actually changed
        if (this.filteredProcedureCodeOptions.length !== previousLength) {
          this.cdr.markForCheck();
        }
      });
  }

  /**
   * Setup Deferral Days search
   */
  private setupDeferralDaysSearch(): void {
    this.deferralDaysSearchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((search: string | null) => {
        const previousLength = this.filteredDeferralDaysOptions.length;

        if (search && search.length >= 1) {
          this.filteredDeferralDaysOptions = this.allDeferralDaysOptions.filter(days =>
            days.toString().includes(search)
          );
        } else {
          this.filteredDeferralDaysOptions = [...this.allDeferralDaysOptions];
        }

        // Only trigger change detection if the filtered options actually changed
        if (this.filteredDeferralDaysOptions.length !== previousLength) {
          this.cdr.markForCheck();
        }
      });
  }

  validateEffPeriod(): void {
    const date = this.filterForm.get('effDate')?.value;
    const period = this.filterForm.get('effDatePeriod')?.value;

    // Show error only if date is selected but period is not
    this.effPeriodRequired = !!date && (!period || period === '');
  }

  validateTermPeriod(): void {
    const date = this.filterForm.get('termDate')?.value;
    const period = this.filterForm.get('termDatePeriod')?.value;

    // Show error only if date is selected but period is not
    this.termPeriodRequired = !!date && (!period || period === '');
  }

  get isApplyDisabled(): boolean {
    const formValue = this.filterForm.value;

    // Check if there are any period validation errors
    if (this.effPeriodRequired || this.termPeriodRequired) {
      return true;
    }

    // Check for invalid date format errors
    const effDateControl = this.filterForm.get('effDate');
    const termDateControl = this.filterForm.get('termDate');

    if (effDateControl?.hasError('invalidDateFormat') ||
        effDateControl?.hasError('matDatepickerParse') ||
        effDateControl?.hasError('invalidDate')) {
      return true;
    }

    if (termDateControl?.hasError('invalidDateFormat') ||
        termDateControl?.hasError('matDatepickerParse') ||
        termDateControl?.hasError('invalidDate')) {
      return true;
    }

    // Check if at least one field is selected
    const hasAnyValue = formValue.effDate ||
                        formValue.termDate ||
                        (formValue.procedureCode && formValue.procedureCode !== '') ||
                        (formValue.deferralDays !== null && formValue.deferralDays !== undefined);

    return !hasAnyValue;
  }

  private loadDropdownOptions(): void {
    this.apiService.getProcedureCodeDropdowns().subscribe({
      next: (response) => {
        this.allProcedureCodeOptions = response.procedureCodes || [];
        this.filteredProcedureCodeOptions = [...this.allProcedureCodeOptions];

        this.allDeferralDaysOptions = response.deferralDays || [];
        this.filteredDeferralDaysOptions = [...this.allDeferralDaysOptions];

        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading dropdown options for filter:', error);
        this.allProcedureCodeOptions = [];
        this.filteredProcedureCodeOptions = [];
        this.allDeferralDaysOptions = [];
        this.filteredDeferralDaysOptions = [];
        this.cdr.markForCheck();
      }
    });
  }

  onApply(): void {
    const formValue = this.filterForm.value;
    const filters: ProcedureCodeFilter = {};

    if (formValue.procedureCode) {
      filters.procedureCode = formValue.procedureCode;
    }
    if (formValue.deferralDays !== null && formValue.deferralDays !== undefined) {
      filters.deferralDays = formValue.deferralDays;
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

  onClearAll(): void {
    this.filterForm.reset({
      procedureCode: null,
      deferralDays: null,
      effDatePeriod: null,
      effDate: null,
      termDatePeriod: null,
      termDate: null,
    });
    this.effDateRawInput = '';
    this.termDateRawInput = '';
    this.effPeriodRequired = false;
    this.termPeriodRequired = false;

    // Clear all control errors
    this.filterForm.get('effDatePeriod')?.setErrors(null);
    this.filterForm.get('termDatePeriod')?.setErrors(null);
  }

  onClose(): void {
    this.close.emit();
  }

  /**
   * Store raw input text when user types in effective date field
   */
  onEffDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.effDateRawInput = input.value;
    const control = this.filterForm.get('effDate');
    if (input.value?.trim()) {
      control?.markAsTouched();
      control?.markAsDirty();
      if (!control?.value) {
        control?.setErrors({ invalidDate: true });
      }
    }
  }

  /**
   * Restore invalid text when Material clears it on blur
   */
  onEffDateBlur(input: HTMLInputElement): void {
    setTimeout(() => {
      const control = this.filterForm.get('effDate');
      if (!control?.value && this.effDateRawInput && !input.value) {
        input.value = this.effDateRawInput;
      }
    }, 0);
  }

  /**
   * Store raw input text when user types in termination date field
   */
  onTermDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.termDateRawInput = input.value;
    const control = this.filterForm.get('termDate');
    if (input.value?.trim()) {
      control?.markAsTouched();
      control?.markAsDirty();
      if (!control?.value) {
        control?.setErrors({ invalidDate: true });
      }
    }
  }

  /**
   * Restore invalid text when Material clears it on blur
   */
  onTermDateBlur(input: HTMLInputElement): void {
    setTimeout(() => {
      const control = this.filterForm.get('termDate');
      if (!control?.value && this.termDateRawInput && !input.value) {
        input.value = this.termDateRawInput;
      }
    }, 0);
  }
}
