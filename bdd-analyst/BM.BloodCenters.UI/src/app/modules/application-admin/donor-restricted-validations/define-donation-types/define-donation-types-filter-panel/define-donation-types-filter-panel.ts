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
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { dateFormatValidator } from 'src/app/core/utils/date-adapter.util';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

export interface DefineDonationTypesFilterFormValue {
  donationTypeCode: string | null;
  sequence: number | null;
  effectiveDatePeriod: string | null;
  effectiveDate: Date | null;
  terminationDatePeriod: string | null;
  terminationDate: Date | null;
}

@Component({
  selector: 'app-define-donation-types-filter-panel',
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
  templateUrl: './define-donation-types-filter-panel.html',
  styleUrls: ['./define-donation-types-filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DefineDonationTypesFilterPanel implements OnInit, OnDestroy {
  @Input() currentFilters: DefineDonationTypesFilterFormValue | null = null;
  @Input() donationTypeCodes: string[] = [];
  @Input() sequences: number[] = [];
  @Output() apply = new EventEmitter<DefineDonationTypesFilterFormValue>();
  @Output() close = new EventEmitter<void>();

  filterForm!: FormGroup;

  // Search controls for Donation Type Code and Sequence
  allDonationTypeCodeOptions: string[] = [];
  filteredDonationTypeCodeOptions: string[] = [];
  donationTypeCodeSearchControl = new FormControl('');

  allSequenceOptions: number[] = [];
  filteredSequenceOptions: number[] = [];
  sequenceSearchControl = new FormControl('');

  periodOptions: { value: string; display: string }[] = [
    { value: 'after', display: 'After' },
    { value: 'before', display: 'Before' }
  ];

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
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    // Initialize search options
    this.allDonationTypeCodeOptions = [...this.donationTypeCodes];
    this.filteredDonationTypeCodeOptions = [...this.donationTypeCodes];
    this.allSequenceOptions = [...this.sequences];
    this.filteredSequenceOptions = [...this.sequences];

    // Setup search functionality
    this.setupDonationTypeCodeSearch();
    this.setupSequenceSearch();

    this.filterForm = this.fb.group({
      donationTypeCode: [this.currentFilters?.donationTypeCode || null],
      sequence: [this.currentFilters?.sequence || null],
      effectiveDatePeriod: [this.currentFilters?.effectiveDatePeriod || null],
      effectiveDate: [
        this.currentFilters?.effectiveDate ? new Date(this.currentFilters.effectiveDate) : null,
        [dateFormatValidator()]
      ],
      terminationDatePeriod: [this.currentFilters?.terminationDatePeriod || null],
      terminationDate: [
        this.currentFilters?.terminationDate ? new Date(this.currentFilters.terminationDate) : null,
        [dateFormatValidator()]
      ]
    });

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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Setup Donation Type Code search
   */
  private setupDonationTypeCodeSearch(): void {
    this.donationTypeCodeSearchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((search: string | null) => {
        const previousLength = this.filteredDonationTypeCodeOptions.length;

        if (search && search.length >= 1) {
          this.filteredDonationTypeCodeOptions = this.allDonationTypeCodeOptions.filter(code =>
            code.toLowerCase().includes(search.toLowerCase())
          );
        } else {
          this.filteredDonationTypeCodeOptions = [...this.allDonationTypeCodeOptions];
        }

        // Only trigger change detection if the filtered options actually changed
        if (this.filteredDonationTypeCodeOptions.length !== previousLength) {
          this.cdr.markForCheck();
        }
      });
  }

  /**
   * Setup Sequence search
   */
  private setupSequenceSearch(): void {
    this.sequenceSearchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((search: string | null) => {
        const previousLength = this.filteredSequenceOptions.length;

        if (search && search.length >= 1) {
          this.filteredSequenceOptions = this.allSequenceOptions.filter(seq =>
            seq.toString().includes(search)
          );
        } else {
          this.filteredSequenceOptions = [...this.allSequenceOptions];
        }

        // Only trigger change detection if the filtered options actually changed
        if (this.filteredSequenceOptions.length !== previousLength) {
          this.cdr.markForCheck();
        }
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
    const hasDonationTypeCode = values?.donationTypeCode !== null && values?.donationTypeCode !== undefined && values?.donationTypeCode !== '';
    const hasSequence = values?.sequence !== null && values?.sequence !== undefined && values?.sequence !== '';
    // Both period AND date must be filled for effective/termination dates
    const hasEffectiveDate = values?.effectiveDatePeriod && values?.effectiveDate;
    const hasTerminationDate = values?.terminationDatePeriod && values?.terminationDate;

    return !(hasDonationTypeCode || hasSequence || hasEffectiveDate || hasTerminationDate);
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

  onApply(): void {
    // Don't apply if there are validation errors
    if (this.isApplyDisabled) {
      return;
    }

    const formValue = this.filterForm.value;

    const filters: DefineDonationTypesFilterFormValue = {
      donationTypeCode: formValue.donationTypeCode || null,
      sequence: formValue.sequence !== null && formValue.sequence !== undefined && formValue.sequence !== '' ? formValue.sequence : null,
      effectiveDatePeriod: formValue.effectiveDatePeriod || null,
      effectiveDate: formValue.effectiveDate || null,
      terminationDatePeriod: formValue.terminationDatePeriod || null,
      terminationDate: formValue.terminationDate || null
    };

    this.apply.emit(filters);
  }

  onClear(): void {
    this.filterForm.reset({
      donationTypeCode: null,
      sequence: null,
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

    // Reset search controls and options
    this.donationTypeCodeSearchControl.setValue('', { emitEvent: false });
    this.filteredDonationTypeCodeOptions = [...this.allDonationTypeCodeOptions];
    this.sequenceSearchControl.setValue('', { emitEvent: false });
    this.filteredSequenceOptions = [...this.allSequenceOptions];

    this.cdr.markForCheck();
  }

  onClose(): void {
    this.close.emit();
  }
}