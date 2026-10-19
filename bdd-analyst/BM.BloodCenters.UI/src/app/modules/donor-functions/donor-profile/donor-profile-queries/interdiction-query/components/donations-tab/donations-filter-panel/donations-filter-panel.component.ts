import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  ChangeDetectionStrategy,
  Input,
  ChangeDetectorRef,
  OnDestroy,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { Subject, takeUntil } from 'rxjs';
import { Moment } from 'moment';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DonationsFilterValue } from '../../../models/interdiction-query.model';
import { InterdictionQueryService } from '../../../../../../query-interdictions-holds/services/interdiction-query.service';
import { DonationType, LovResponse, InterdictionQueryParams } from '../../../../../../query-interdictions-holds/models/interdiction-query.model';

/**
 * Donations Filter Panel Component
 * Based on screenshot requirements for Donations tab filtering
 */
@Component({
  selector: 'app-donations-filter-panel',
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
    MatInputModule
  ],
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }
  ],
  templateUrl: './donations-filter-panel.component.html',
  styleUrls: ['./donations-filter-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DonationsFilterPanelComponent implements OnInit, OnDestroy {
  @Input() currentFilters: DonationsFilterValue | null = null;
  @Input() queryContext: InterdictionQueryParams = {};
  @Output() apply = new EventEmitter<DonationsFilterValue>();
  @Output() close = new EventEmitter<void>();

  filterForm!: FormGroup;
  effectiveDatePeriodError = '';
  terminationDatePeriodError = '';

  // Donation types from API
  donationTypes = signal<DonationType[]>([]);
  loadingDonationTypes = signal<boolean>(true);

  // Store raw input text to preserve invalid dates
  private effectiveDateRawInput = '';
  private terminationDateRawInput = '';

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private interdictionQueryService: InterdictionQueryService,
    private dateAdapter: DateAdapter<Moment>
  ) { }

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      donationType: [this.currentFilters?.donationType || null],
      showReleased: [this.currentFilters?.showReleased !== undefined && this.currentFilters?.showReleased !== null ? this.currentFilters.showReleased : null],
      effectivePeriod: [this.currentFilters?.effectivePeriod || null],
      effectiveDate: [this.currentFilters?.effectiveDate || null],
      terminationPeriod: [this.currentFilters?.terminationPeriod || null],
      terminationDate: [this.currentFilters?.terminationDate || null]
    });

    this.setupPeriodValidation();

    // Run initial validation if data was provided
    if (this.currentFilters) {
      this.validateEffectiveDatePeriod();
      this.validateTerminationDatePeriod();
    }

    // Load donation types from API
    this.loadDonationTypes();
  }

  private loadDonationTypes(): void {
    this.loadingDonationTypes.set(true);

    this.interdictionQueryService.getValidDonationTypes(this.queryContext)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: LovResponse<DonationType>) => {
          if (response.success && response.data) {
            // Use donation types from API without adding 'ALL' option
            this.donationTypes.set(response.data);
          } else {
            // Fallback to empty array
            this.donationTypes.set([]);
          }
          this.loadingDonationTypes.set(false);
          this.cdr.markForCheck();
        },
        error: () => {
          // Fallback to common donation types when API fails (without ALL)
          const fallbackTypes: DonationType[] = [
            { code: 'WB', description: 'Whole Blood' },
            { code: 'PL', description: 'Platelets' },
            { code: 'RBC', description: 'Red Blood Cells' },
            { code: 'PLT', description: 'Plateletpheresis' },
            { code: 'GR', description: 'Granulocytes' }
          ];
          this.donationTypes.set(fallbackTypes);
          this.loadingDonationTypes.set(false);
          this.cdr.markForCheck();
        }
      });
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

    // Show error only if date is selected but period is not
    if (effectiveDate && (!effectivePeriod || effectivePeriod === '')) {
      this.effectiveDatePeriodError = 'Period is required';
    } else {
      this.effectiveDatePeriodError = '';
    }
  }

  private validateTerminationDatePeriod(): void {
    const terminationDate = this.filterForm.get('terminationDate')?.value;
    const terminationPeriod = this.filterForm.get('terminationPeriod')?.value;

    // Show error only if date is selected but period is not
    if (terminationDate && (!terminationPeriod || terminationPeriod === '')) {
      this.terminationDatePeriodError = 'Period is required';
    } else {
      this.terminationDatePeriodError = '';
    }
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
    // Use setTimeout to run after Material's blur handling
    setTimeout(() => {
      const control = this.filterForm.get('effectiveDate');
      const inputValue = input.value?.trim() || '';

      // If control has no value but we have raw input, restore it
      if (!control?.value && this.effectiveDateRawInput && !input.value) {
        input.value = this.effectiveDateRawInput;
      }

      // If there's input text but no parsed value, try to manually parse it
      if (inputValue && !control?.value) {
        const parsed = this.parseInputDate(inputValue);

        if (parsed?.isValid()) {
          // Successfully parsed - set the value and update the input display
          control?.setValue(parsed);
          input.value = this.dateAdapter.format(parsed, DD_MON_YYYY_FORMATS.display.dateInput);
        } else if (control) {
          // Failed to parse - set invalid error
          control.setErrors({ ...control.errors, invalidDate: true });
          control.markAsTouched();
        }
      } else if (control?.hasError('invalidDate') && (!inputValue || control?.value)) {
        // Clear custom error if input is empty or has valid value
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
    // Use setTimeout to run after Material's blur handling
    setTimeout(() => {
      const control = this.filterForm.get('terminationDate');
      const inputValue = input.value?.trim() || '';

      // If control has no value but we have raw input, restore it
      if (!control?.value && this.terminationDateRawInput && !input.value) {
        input.value = this.terminationDateRawInput;
      }

      // If there's input text but no parsed value, try to manually parse it
      if (inputValue && !control?.value) {
        const parsed = this.parseInputDate(inputValue);

        if (parsed?.isValid()) {
          // Successfully parsed - set the value and update the input display
          control?.setValue(parsed);
          input.value = this.dateAdapter.format(parsed, DD_MON_YYYY_FORMATS.display.dateInput);
        } else if (control) {
          // Failed to parse - set invalid error
          control.setErrors({ ...control.errors, invalidDate: true });
          control.markAsTouched();
        }
      } else if (control?.hasError('invalidDate') && (!inputValue || control?.value)) {
        // Clear custom error if input is empty or has valid value
        const errors = { ...control.errors };
        delete errors['invalidDate'];
        control.setErrors(Object.keys(errors).length > 0 ? errors : null);
      }

      this.cdr.markForCheck();
    }, 0);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onApply(): void {
    // Validate before applying
    this.validateEffectiveDatePeriod();
    this.validateTerminationDatePeriod();

    if (this.effectiveDatePeriodError || this.terminationDatePeriodError) {
      return;
    }

    const formValue = this.filterForm.value;

    const filters: DonationsFilterValue = {
      donationType: formValue.donationType || null,
      showReleased: formValue.showReleased !== undefined && formValue.showReleased !== null ? formValue.showReleased : null,
      effectivePeriod: formValue.effectivePeriod || null,
      effectiveDate: formValue.effectiveDate || null,
      terminationPeriod: formValue.terminationPeriod || null,
      terminationDate: formValue.terminationDate || null
    };

    this.apply.emit(filters);
  }

  onClear(): void {
    this.filterForm.reset({
      donationType: null,
      showReleased: null,
      effectivePeriod: null,
      effectiveDate: null,
      terminationPeriod: null,
      terminationDate: null
    });
    this.effectiveDatePeriodError = '';
    this.terminationDatePeriodError = '';
    this.effectiveDateRawInput = '';
    this.terminationDateRawInput = '';

    // Clear all control errors
    this.filterForm.get('effectivePeriod')?.setErrors(null);
    this.filterForm.get('terminationPeriod')?.setErrors(null);
  }

  onClose(): void {
    this.close.emit();
  }

  get isApplyDisabled(): boolean {
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

    // Check if at least one filter has been applied
    const hasFiltersApplied = this.hasAnyFiltersApplied();
    if (!hasFiltersApplied) {
      return true;
    }

    return false;
  }

  /**
   * Check if any filter value has been set
   */
  private hasAnyFiltersApplied(): boolean {
    const formValue = this.filterForm.value;

    return !!(
      formValue.donationType ||
      (formValue.showReleased !== null && formValue.showReleased !== undefined) ||
      formValue.effectivePeriod ||
      formValue.effectiveDate ||
      formValue.terminationPeriod ||
      formValue.terminationDate
    );
  }

  /**
   * Check if donation type field should be visible
   * Donation type is only applicable for Interdictions, not Holds
   */
  get showDonationType(): boolean {
    return this.queryContext?.option !== 'Hold';
  }

  /**
   * Get the label for the show released/terminated field
   * Interdictions: "Show Released"
   * Holds: "Show Terminated"
   */
  get showReleasedLabel(): string {
    return this.queryContext?.option === 'Hold' ? 'Show Terminated' : 'Show Released';
  }
}
