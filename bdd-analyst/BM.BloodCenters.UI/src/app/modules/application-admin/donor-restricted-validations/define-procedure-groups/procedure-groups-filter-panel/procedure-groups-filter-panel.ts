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
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { CustomDateAdapter, DD_MMM_YYYY_FORMAT, dateFormatValidator } from 'src/app/core/utils/date-adapter.util';

import {
  DefineProcedureGroupsFilterValue,
  ProcedureGroupLookup,
  ProcedureCodeLookup,
  CreditCountLookup
} from '../models/define-procedure-groups.model';
import { DefineProcedureGroupsService } from '../services/define-procedure-groups.service';
import { forkJoin, Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-procedure-groups-filter-panel',
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
    { provide: DateAdapter, useClass: CustomDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MMM_YYYY_FORMAT }
  ],
  templateUrl: './procedure-groups-filter-panel.html',
  styleUrls: ['./procedure-groups-filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProcedureGroupsFilterPanel implements OnInit, OnDestroy {
  @Input() currentFilters: DefineProcedureGroupsFilterValue | null = null;
  @Output() apply = new EventEmitter<DefineProcedureGroupsFilterValue>();
  @Output() close = new EventEmitter<void>();

  filterForm!: FormGroup;

  procedureGroupOptions: ProcedureGroupLookup[] = [];
  procedureCodeOptions: ProcedureCodeLookup[] = [];
  creditCountOptions: CreditCountLookup[] = [];
  periodOptions = [
    { value: 'After', label: 'After' },
    { value: 'Before', label: 'Before' }
  ];

  // Search controls for searchable dropdowns
  procedureGroupSearchControl = new FormControl('');
  procedureCodeSearchControl = new FormControl('');
  donationCreditsSearchControl = new FormControl('');

  // Filtered options for searchable dropdowns
  filteredProcedureGroupOptions: ProcedureGroupLookup[] = [];
  filteredProcedureCodeOptions: ProcedureCodeLookup[] = [];
  filteredCreditCountOptions: CreditCountLookup[] = [];

  effectiveDatePeriodError = '';
  terminationDatePeriodError = '';

  isLoadingFilters = false;

  private effectiveDateRawInput = '';
  private terminationDateRawInput = '';

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private procedureGroupsService: DefineProcedureGroupsService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    // Initialize form with current filter values
    this.filterForm = this.fb.group({
      procedureGroupCode: [this.currentFilters?.procedureGroupCode || null],
      procedureCode: [this.currentFilters?.procedureCode || null],
      donationCredits: [this.currentFilters?.donationCredits || null],
      effectiveDatePeriod: [this.currentFilters?.effectiveDatePeriod || null],
      effectiveDate: [this.currentFilters?.effectiveDate || null, [dateFormatValidator()]],
      terminationDatePeriod: [this.currentFilters?.terminationDatePeriod || null],
      terminationDate: [this.currentFilters?.terminationDate || null, [dateFormatValidator()]]
    });

    // Setup validation listeners for effective date
    this.filterForm.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((date) => {
        const control = this.filterForm.get('effectiveDate');
        if (control && !control.touched) {
          control.markAsTouched();
        }

        const periodControl = this.filterForm.get('effectiveDatePeriod');
        const period = periodControl?.value;

        if (date && !period) {
          this.effectiveDatePeriodError = 'Period is required';
          periodControl?.setErrors({ required: true });
          periodControl?.markAsTouched();
        } else {
          this.effectiveDatePeriodError = '';
          periodControl?.setErrors(null);
        }
        this.cdr.markForCheck();
      });

    this.filterForm.get('effectiveDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const periodControl = this.filterForm.get('effectiveDatePeriod');
        this.effectiveDatePeriodError = '';
        periodControl?.setErrors(null);
        this.cdr.markForCheck();
      });

    // Setup validation listeners for termination date
    this.filterForm.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((date) => {
        const control = this.filterForm.get('terminationDate');
        if (control && !control.touched) {
          control.markAsTouched();
        }

        const periodControl = this.filterForm.get('terminationDatePeriod');
        const period = periodControl?.value;

        if (date && !period) {
          this.terminationDatePeriodError = 'Period is required';
          periodControl?.setErrors({ required: true });
          periodControl?.markAsTouched();
        } else {
          this.terminationDatePeriodError = '';
          periodControl?.setErrors(null);
        }
        this.cdr.markForCheck();
      });

    this.filterForm.get('terminationDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const periodControl = this.filterForm.get('terminationDatePeriod');
        this.terminationDatePeriodError = '';
        periodControl?.setErrors(null);
        this.cdr.markForCheck();
      });

    // Setup search filters for searchable dropdowns
    this.setupDropdownSearchFilters();

    // Load filter options
    this.loadFilterOptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Set up search filters for searchable dropdowns
   */
  private setupDropdownSearchFilters(): void {
    this.procedureGroupSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search || '').toLowerCase();
        this.filteredProcedureGroupOptions = this.procedureGroupOptions.filter(option =>
          option.code.toLowerCase().includes(term) ||
          option.description.toLowerCase().includes(term)
        );
      });

    this.procedureCodeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search || '').toLowerCase();
        this.filteredProcedureCodeOptions = this.procedureCodeOptions.filter(option =>
          option.procedureCode.toLowerCase().includes(term) ||
          option.description.toLowerCase().includes(term)
        );
      });

    this.donationCreditsSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search || '').toLowerCase();
        this.filteredCreditCountOptions = this.creditCountOptions.filter(option =>
          option.creditCount.toString().includes(term)
        );
      });
  }

  /**
   * Load filter options from backend API
   */
  private loadFilterOptions(): void {
    // Store current form values to restore after data loads
    const currentFormValues = this.filterForm.value;

    // Fetch filter-specific lookups (distinct values from existing records) in parallel
    forkJoin({
      procedureGroups: this.procedureGroupsService.getProcedureGroupsFilterLookup(),
      procedureCodes: this.procedureGroupsService.getProcedureCodesFilterLookup(),
      creditCounts: this.procedureGroupsService.getCreditCountsLookup()
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (responses) => {
        this.procedureGroupOptions = responses.procedureGroups.data || [];
        this.filteredProcedureGroupOptions = [...this.procedureGroupOptions];

        this.procedureCodeOptions = responses.procedureCodes.data || [];
        this.filteredProcedureCodeOptions = [...this.procedureCodeOptions];

        this.creditCountOptions = responses.creditCounts.data || [];
        this.filteredCreditCountOptions = [...this.creditCountOptions];

        this.isLoadingFilters = false;

        // Restore form values after data loads to ensure selected values are shown
        this.filterForm.patchValue(currentFormValues, { emitEvent: false });

        this.cdr.markForCheck();
      },
      error: () => {
        // Fallback to empty arrays on error
        this.procedureGroupOptions = [];
        this.filteredProcedureGroupOptions = [];
        this.procedureCodeOptions = [];
        this.filteredProcedureCodeOptions = [];
        this.creditCountOptions = [];
        this.filteredCreditCountOptions = [];

        this.isLoadingFilters = false;
        this.cdr.markForCheck();
      }
    });
  }

  onApply(): void {
    const effectiveDatePeriod = this.filterForm.value.effectiveDatePeriod;
    const effectiveDate = this.filterForm.value.effectiveDate;
    const terminationDatePeriod = this.filterForm.value.terminationDatePeriod;
    const terminationDate = this.filterForm.value.terminationDate;

    this.effectiveDatePeriodError = '';
    this.terminationDatePeriodError = '';

    const effectivePeriodControl = this.filterForm.get('effectiveDatePeriod');
    effectivePeriodControl?.setErrors(null);
    const terminationPeriodControl = this.filterForm.get('terminationDatePeriod');
    terminationPeriodControl?.setErrors(null);

    let hasError = false;

    if (effectiveDate && !effectiveDatePeriod) {
      this.effectiveDatePeriodError = 'Period is required';
      effectivePeriodControl?.setErrors({ required: true });
      effectivePeriodControl?.markAsTouched();
      hasError = true;
    }

    if (terminationDate && !terminationDatePeriod) {
      this.terminationDatePeriodError = 'Period is required';
      terminationPeriodControl?.setErrors({ required: true });
      terminationPeriodControl?.markAsTouched();
      hasError = true;
    }

    if (hasError) {
      this.cdr.markForCheck();
      return;
    }

    const formValue = this.filterForm.value;

    const filters: DefineProcedureGroupsFilterValue = {
      procedureGroupCode: formValue.procedureGroupCode || null,
      procedureCode: formValue.procedureCode || null,
      donationCredits: formValue.donationCredits !== null && formValue.donationCredits !== undefined ? formValue.donationCredits : null,
      effectiveDatePeriod: formValue.effectiveDatePeriod || null,
      effectiveDate: formValue.effectiveDate || null,
      terminationDatePeriod: formValue.terminationDatePeriod || null,
      terminationDate: formValue.terminationDate || null
    };

    this.apply.emit(filters);
  }

  onClear(): void {
    this.filterForm.reset();
    this.procedureGroupSearchControl.setValue('');
    this.procedureCodeSearchControl.setValue('');
    this.donationCreditsSearchControl.setValue('');
    this.effectiveDatePeriodError = '';
    this.effectiveDateRawInput = '';
    this.terminationDatePeriodError = '';
    this.terminationDateRawInput = '';
    this.cdr.markForCheck();
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

  onTerminationDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.terminationDateRawInput = input.value;
  }

  onTerminationDateBlur(input: HTMLInputElement): void {
    setTimeout(() => {
      const control = this.filterForm.get('terminationDate');
      if (!control?.value && this.terminationDateRawInput && !input.value) {
        input.value = this.terminationDateRawInput;
      }
    }, 0);
  }

  get isApplyDisabled(): boolean {
    const formValue = this.filterForm.value;

    if (this.effectiveDatePeriodError || this.terminationDatePeriodError) {
      return true;
    }

    const hasAnyValue =
      (formValue.procedureGroupCode !== null && formValue.procedureGroupCode !== '') ||
      (formValue.procedureCode !== null && formValue.procedureCode !== '') ||
      (formValue.donationCredits !== null && formValue.donationCredits !== '') ||
      formValue.effectiveDate !== null ||
      formValue.terminationDate !== null;

    return !hasAnyValue;
  }
}
