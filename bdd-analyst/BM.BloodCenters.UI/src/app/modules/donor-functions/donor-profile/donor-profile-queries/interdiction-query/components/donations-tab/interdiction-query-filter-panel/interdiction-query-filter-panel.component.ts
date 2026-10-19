import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  ChangeDetectionStrategy,
  Input,
  ChangeDetectorRef,
  OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';
import { Moment } from 'moment';
import { InterdictionQueryFilterValue, DonorInterdictionCode } from '../../../models/interdiction-query.model';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';

@Component({
  selector: 'app-interdiction-query-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatInputModule,
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }
  ],
  templateUrl: './interdiction-query-filter-panel.component.html',
  styleUrls: ['./interdiction-query-filter-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InterdictionQueryFilterPanelComponent implements OnInit, OnDestroy {
  @Input() currentFilters: InterdictionQueryFilterValue | null = null;
  @Output() apply = new EventEmitter<InterdictionQueryFilterValue>();
  @Output() close = new EventEmitter<void>();

  filterForm!: FormGroup;
  donorInterdictionCodes: DonorInterdictionCode[] = [];
  filteredInterdictionCodes: DonorInterdictionCode[] = [];
  interdictionCodeSearchControl = new FormControl('');
  userInactiveClasses: string[] = [];
  filteredUserInactiveClasses: string[] = [];
  userInactiveClassSearchControl = new FormControl('');
  isLoadingInterdictionCodes = false;
  isLoadingUserInactiveClasses = false;

  effectiveDatePeriodError = '';
  terminationDatePeriodError = '';

  // Store raw input text to preserve invalid dates
  private effectiveDateRawInput = '';
  private terminationDateRawInput = '';

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private dateAdapter: DateAdapter<Moment>
  ) { }

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      donorInterdictionCode: [this.currentFilters?.donorInterdictionCode || null],
      effectivePeriod: [this.currentFilters?.effectivePeriod || null],
      effectiveDate: [this.currentFilters?.effectiveDate || null],
      terminationPeriod: [this.currentFilters?.terminationPeriod || null],
      terminationDate: [this.currentFilters?.terminationDate || null],
      unitId: [this.currentFilters?.unitId || null],
      userInactiveClass: [this.currentFilters?.userInactiveClass || null]
    });

    this.setupPeriodValidation();
    this.loadInterdictionCodes();
    this.loadUserInactiveClasses();

    // Setup interdiction code search filter
    this.interdictionCodeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search || '').toLowerCase();
        this.filteredInterdictionCodes = this.donorInterdictionCodes.filter(item =>
          (item.donorInterdictionCode && item.donorInterdictionCode.toLowerCase().includes(term)) ||
          (item.codeMeaning && item.codeMeaning.toLowerCase().includes(term))
        );
        this.cdr.markForCheck();
      });

    // Setup user inactive class search filter
    this.userInactiveClassSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search || '').toLowerCase();
        this.filteredUserInactiveClasses = this.userInactiveClasses.filter(cls =>
          cls.toLowerCase().includes(term)
        );
        this.cdr.markForCheck();
      });

    // Run initial validation if data was provided
    if (this.currentFilters) {
      this.validateEffectiveDatePeriod();
      this.validateTerminationDatePeriod();
    }
  }

  private setupPeriodValidation(): void {
    // Validate effectivePeriod when effectiveDate changes
    this.filterForm.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const control = this.filterForm.get('effectiveDate');
        if (control && !control.touched) {
          control.markAsTouched();
        }
        this.validateEffectiveDatePeriod();
        this.cdr.markForCheck();
      });

    // Validate terminationPeriod when terminationDate changes
    this.filterForm.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const control = this.filterForm.get('terminationDate');
        if (control && !control.touched) {
          control.markAsTouched();
        }
        this.validateTerminationDatePeriod();
        this.cdr.markForCheck();
      });

    // Validate when period values change
    this.filterForm.get('effectivePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateEffectiveDatePeriod();
        this.cdr.markForCheck();
      });

    this.filterForm.get('terminationPeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateTerminationDatePeriod();
        this.cdr.markForCheck();
      });
  }

  private validateEffectiveDatePeriod(): void {
    const effectiveDate = this.filterForm.get('effectiveDate')?.value;
    const effectivePeriod = this.filterForm.get('effectivePeriod')?.value;

    if (effectiveDate && (!effectivePeriod || effectivePeriod === '')) {
      this.effectiveDatePeriodError = 'Period is required';
    } else {
      this.effectiveDatePeriodError = '';
    }
  }

  private validateTerminationDatePeriod(): void {
    const terminationDate = this.filterForm.get('terminationDate')?.value;
    const terminationPeriod = this.filterForm.get('terminationPeriod')?.value;

    if (terminationDate && (!terminationPeriod || terminationPeriod === '')) {
      this.terminationDatePeriodError = 'Period is required';
    } else {
      this.terminationDatePeriodError = '';
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Parse input date string using configured date formats
   */
  private parseInputDate(inputValue: string): Moment | null {
    const formats = Array.isArray(DD_MON_YYYY_FORMATS.parse.dateInput)
      ? DD_MON_YYYY_FORMATS.parse.dateInput
      : [DD_MON_YYYY_FORMATS.parse.dateInput];
    return this.dateAdapter.parse(inputValue, formats);
  }

  private loadInterdictionCodes(): void {
    this.isLoadingInterdictionCodes = true;
    // TODO: Replace with real API call when backend endpoint is available
    // For now, set empty array as this filter is optional
    this.donorInterdictionCodes = [];
    this.filteredInterdictionCodes = [];
    this.isLoadingInterdictionCodes = false;
    this.cdr.markForCheck();
  }

  private loadUserInactiveClasses(): void {
    this.isLoadingUserInactiveClasses = true;
    // TODO: Replace with real API call when backend endpoint is available
    // For now, set empty array as this filter is optional
    this.userInactiveClasses = [];
    this.filteredUserInactiveClasses = [];
    this.isLoadingUserInactiveClasses = false;
    this.cdr.markForCheck();
  }

  onApply(): void {
    // Validate before applying
    this.validateEffectiveDatePeriod();
    this.validateTerminationDatePeriod();

    if (this.effectiveDatePeriodError || this.terminationDatePeriodError) {
      return;
    }

    const formValue = this.filterForm.value;

    const filters: InterdictionQueryFilterValue = {
      donorInterdictionCode: formValue.donorInterdictionCode || null,
      effectivePeriod: formValue.effectivePeriod || null,
      effectiveDate: formValue.effectiveDate || null,
      terminationPeriod: formValue.terminationPeriod || null,
      terminationDate: formValue.terminationDate || null,
      unitId: formValue.unitId || null,
      userInactiveClass: formValue.userInactiveClass || null
    };

    this.apply.emit(filters);
  }

  onClear(): void {
    this.filterForm.reset({
      donorInterdictionCode: null,
      effectivePeriod: null,
      effectiveDate: null,
      terminationPeriod: null,
      terminationDate: null,
      unitId: null,
      userInactiveClass: null
    });
    this.effectiveDatePeriodError = '';
    this.terminationDatePeriodError = '';
    this.effectiveDateRawInput = '';
    this.terminationDateRawInput = '';

    this.filterForm.get('effectivePeriod')?.setErrors(null);
    this.filterForm.get('terminationPeriod')?.setErrors(null);
  }

  onClose(): void {
    this.close.emit();
  }

  get isApplyDisabled(): boolean {
    const formValue = this.filterForm.value;

    // Check if there are any period validation errors
    if (this.effectiveDatePeriodError || this.terminationDatePeriodError) {
      return true;
    }

    // Check for invalid date format errors
    const effectiveDateControl = this.filterForm.get('effectiveDate');
    const terminationDateControl = this.filterForm.get('terminationDate');

    if (effectiveDateControl?.hasError('invalidDate') ||
        effectiveDateControl?.hasError('invalidDateFormat') ||
        effectiveDateControl?.hasError('matDatepickerParse')) {
      return true;
    }

    if (terminationDateControl?.hasError('invalidDate') ||
        terminationDateControl?.hasError('invalidDateFormat') ||
        terminationDateControl?.hasError('matDatepickerParse')) {
      return true;
    }

    // Check if at least one field has a value
    const hasAnyValue =
      (formValue.donorInterdictionCode !== null && formValue.donorInterdictionCode !== '') ||
      formValue.effectiveDate !== null ||
      formValue.terminationDate !== null ||
      (formValue.unitId !== null && formValue.unitId !== '') ||
      (formValue.userInactiveClass !== null && formValue.userInactiveClass !== '');

    return !hasAnyValue;
  }

  /**
   * Store raw input text when user types in effective date field
   */
  onEffectiveDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.effectiveDateRawInput = input.value;
  }

  /**
   * Restore invalid text when Material clears it on blur and validate
   */
  onEffectiveDateBlur(input: HTMLInputElement): void {
    setTimeout(() => {
      const control = this.filterForm.get('effectiveDate');
      const inputValue = input.value?.trim() || '';

      if (!control?.value && this.effectiveDateRawInput && !input.value) {
        input.value = this.effectiveDateRawInput;
      }

      if (inputValue && !control?.value) {
        const parsed = this.parseInputDate(inputValue);

        if (parsed?.isValid()) {
          control?.setValue(parsed);
          input.value = this.dateAdapter.format(parsed, DD_MON_YYYY_FORMATS.display.dateInput);
        } else if (control) {
          control.setErrors({ ...control.errors, invalidDate: true });
          control.markAsTouched();
        }
      } else if (control?.hasError('invalidDate') && (!inputValue || control?.value)) {
        const errors = { ...control.errors };
        delete errors['invalidDate'];
        control.setErrors(Object.keys(errors).length > 0 ? errors : null);
      }

      this.cdr.markForCheck();
    }, 0);
  }

  /**
   * Store raw input text when user types in termination date field
   */
  onTerminationDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.terminationDateRawInput = input.value;
  }

  /**
   * Restore invalid text when Material clears it on blur and validate
   */
  onTerminationDateBlur(input: HTMLInputElement): void {
    setTimeout(() => {
      const control = this.filterForm.get('terminationDate');
      const inputValue = input.value?.trim() || '';

      if (!control?.value && this.terminationDateRawInput && !input.value) {
        input.value = this.terminationDateRawInput;
      }

      if (inputValue && !control?.value) {
        const parsed = this.parseInputDate(inputValue);

        if (parsed?.isValid()) {
          control?.setValue(parsed);
          input.value = this.dateAdapter.format(parsed, DD_MON_YYYY_FORMATS.display.dateInput);
        } else if (control) {
          control.setErrors({ ...control.errors, invalidDate: true });
          control.markAsTouched();
        }
      } else if (control?.hasError('invalidDate') && (!inputValue || control?.value)) {
        const errors = { ...control.errors };
        delete errors['invalidDate'];
        control.setErrors(Object.keys(errors).length > 0 ? errors : null);
      }

      this.cdr.markForCheck();
    }, 0);
  }

  /**
   * Get display text for interdiction code option
   */
  getInterdictionCodeDisplay(code: string): string {
    const item = this.donorInterdictionCodes.find(c => c.donorInterdictionCode === code);
    return item?.codeMeaning ? `${code} - ${item.codeMeaning}` : code;
  }
}
