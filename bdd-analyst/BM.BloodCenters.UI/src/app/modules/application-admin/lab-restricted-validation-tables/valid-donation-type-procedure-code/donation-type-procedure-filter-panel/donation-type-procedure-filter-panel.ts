import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  ChangeDetectionStrategy,
  Input,
  ChangeDetectorRef,
  OnDestroy,
  signal,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { DD_MMM_YYYY_FORMAT, dateFormatValidator } from 'src/app/core/utils/date-adapter.util';
import { ChapterAwareDateAdapter } from 'src/app/shared/date/chapter-aware-date-adapter';
import { Subject, takeUntil } from 'rxjs';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import moment from 'moment';

import {
  DonationTypeProcedureCodeFilterValue,
  DonationTypeLookup,
  ProcedureCodeLookup,
  AttributeGroupLookup
} from '../models/valid-donation-type-procedure-code.model';
import { ValidDonationTypeProcedureCodeService } from '../services/valid-donation-type-procedure-code.service';

@Component({
  selector: 'app-donation-type-procedure-filter-panel',
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
    { provide: MAT_DATE_FORMATS, useValue: DD_MMM_YYYY_FORMAT },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './donation-type-procedure-filter-panel.html',
  styleUrls: ['./donation-type-procedure-filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DonationTypeProcedureFilterPanel implements OnInit, OnDestroy {
  @Input() currentFilters: DonationTypeProcedureCodeFilterValue | null = null;
  @Output() apply = new EventEmitter<DonationTypeProcedureCodeFilterValue>();
  @Output() close = new EventEmitter<void>();

  filterForm!: FormGroup;

  periodOptions: string[] = ['After', 'Before'];

  isLoadingOptions = false;
  private formChanged = false;

  // Store raw input text to preserve invalid dates
  private effectiveDateRawInput = '';
  private terminationDateRawInput = '';

  // Search controls for searchable dropdowns
  readonly donationTypeSearchControl = new FormControl('');
  readonly procedureCodeSearchControl = new FormControl('');
  readonly attributeGroupSearchControl = new FormControl('');

  // Signals for search filtering
  private readonly donationTypeSearch = signal('');
  private readonly procedureCodeSearch = signal('');
  private readonly attributeGroupSearch = signal('');
  private readonly donationTypeOptionsSignal = signal<DonationTypeLookup[]>([]);
  private readonly procedureCodeOptionsSignal = signal<ProcedureCodeLookup[]>([]);
  private readonly attributeGroupOptionsSignal = signal<AttributeGroupLookup[]>([]);

  readonly filteredDonationTypes = computed(() => {
    const search = this.donationTypeSearch().toLowerCase();
    const options = this.donationTypeOptionsSignal();
    if (!search) return options;
    return options.filter(o =>
      o.code.toLowerCase().includes(search) ||
      o.description.toLowerCase().includes(search)
    );
  });

  readonly filteredProcedureCodes = computed(() => {
    const search = this.procedureCodeSearch().toLowerCase();
    const options = this.procedureCodeOptionsSignal();
    if (!search) return options;
    return options.filter(o =>
      o.code.toLowerCase().includes(search) ||
      o.description.toLowerCase().includes(search)
    );
  });

  readonly filteredAttributeGroups = computed(() => {
    const search = this.attributeGroupSearch().toLowerCase();
    const options = this.attributeGroupOptionsSignal();
    if (!search) return options;
    return options.filter(o =>
      o.code.toLowerCase().includes(search) ||
      o.description.toLowerCase().includes(search)
    );
  });

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private validDonationTypeProcedureCodeService: ValidDonationTypeProcedureCodeService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    // Parse dates to Date objects if they exist
    const parseDate = (dateStr: Date | string | null | undefined): Date | null => {
      if (!dateStr) return null;
      if (dateStr instanceof Date) return dateStr;
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? null : d;
    };

    this.filterForm = this.fb.group({
      donationType: [this.currentFilters?.donationType || null],
      procedureCode: [this.currentFilters?.procedureCode || null],
      attributeGroup: [this.currentFilters?.attributeGroup || null],
      period: [this.currentFilters?.period || null],
      effectiveDate: [parseDate(this.currentFilters?.effectiveDate), [dateFormatValidator()]],
      terminationDate: [parseDate(this.currentFilters?.terminationDate), [dateFormatValidator()]],
      terminationPeriod: [this.currentFilters?.terminationPeriod || null]
    });

    this.setupValidation();
    this.loadFilterOptions();
  }

  private setupValidation(): void {
    // Setup validation listeners for effective date
    this.filterForm.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((date) => {
        const control = this.filterForm.get('effectiveDate');
        const periodControl = this.filterForm.get('period');

        if (control && !control.touched) {
          control.markAsTouched();
        }

        // Mark period as touched when a valid date is selected
        const hasValidDate = date && !control?.hasError('invalidDateFormat') && !control?.hasError('matDatepickerParse');
        if (hasValidDate && periodControl) {
          periodControl.markAsTouched();
        }

        this.validateEffectiveDatePeriod();
      });

    this.filterForm.get('effectiveDate')?.statusChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const control = this.filterForm.get('effectiveDate');
        const periodControl = this.filterForm.get('period');

        // Mark period as touched when date becomes valid
        const hasValidDate = control?.value && !control?.hasError('invalidDateFormat') && !control?.hasError('matDatepickerParse');
        if (hasValidDate && periodControl) {
          periodControl.markAsTouched();
        }

        this.validateEffectiveDatePeriod();
      });

    this.filterForm.get('period')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateEffectiveDatePeriod();
      });

    // Setup validation listeners for termination date
    this.filterForm.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((date) => {
        const control = this.filterForm.get('terminationDate');
        const periodControl = this.filterForm.get('terminationPeriod');

        if (control && !control.touched) {
          control.markAsTouched();
        }

        // Mark period as touched when a valid date is selected
        const hasValidDate = date && !control?.hasError('invalidDateFormat') && !control?.hasError('matDatepickerParse');
        if (hasValidDate && periodControl) {
          periodControl.markAsTouched();
        }

        this.validateTerminationDatePeriod();
      });

    this.filterForm.get('terminationDate')?.statusChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const control = this.filterForm.get('terminationDate');
        const periodControl = this.filterForm.get('terminationPeriod');

        // Mark period as touched when date becomes valid
        const hasValidDate = control?.value && !control?.hasError('invalidDateFormat') && !control?.hasError('matDatepickerParse');
        if (hasValidDate && periodControl) {
          periodControl.markAsTouched();
        }

        this.validateTerminationDatePeriod();
      });

    this.filterForm.get('terminationPeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateTerminationDatePeriod();
      });

    // Track form changes to match Master Code Screen apply-button behavior
    this.filterForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.formChanged = true;
        this.cdr.markForCheck();
      });

    // Subscribe to search control changes
    this.donationTypeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.donationTypeSearch.set(value || ''));

    this.procedureCodeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.procedureCodeSearch.set(value || ''));

    this.attributeGroupSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.attributeGroupSearch.set(value || ''));
  }

  private validateEffectiveDatePeriod(): void {
    const effectiveDateControl = this.filterForm.get('effectiveDate');
    const effectiveDate = effectiveDateControl?.value;
    const period = this.filterForm.get('period')?.value;
    const periodControl = this.filterForm.get('period');

    // Only require period if date is valid (no date validation errors)
    const hasValidDate = effectiveDate && !effectiveDateControl?.hasError('invalidDateFormat') && !effectiveDateControl?.hasError('matDatepickerParse');

    if (hasValidDate && !period) {
      periodControl?.setErrors({ required: true });
      periodControl?.markAsTouched();
    } else {
      periodControl?.setErrors(null);
    }
    this.cdr.markForCheck();
  }

  private validateTerminationDatePeriod(): void {
    const terminationDateControl = this.filterForm.get('terminationDate');
    const terminationDate = terminationDateControl?.value;
    const terminationPeriod = this.filterForm.get('terminationPeriod')?.value;
    const terminationPeriodControl = this.filterForm.get('terminationPeriod');

    // Only require period if date is valid (no date validation errors)
    const hasValidDate = terminationDate && !terminationDateControl?.hasError('invalidDateFormat') && !terminationDateControl?.hasError('matDatepickerParse');

    if (hasValidDate && !terminationPeriod) {
      terminationPeriodControl?.setErrors({ required: true });
      terminationPeriodControl?.markAsTouched();
    } else {
      terminationPeriodControl?.setErrors(null);
    }
    this.cdr.markForCheck();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadFilterOptions(): void {
    this.isLoadingOptions = true;

    this.validDonationTypeProcedureCodeService
      .getFilters()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.data) {
            this.donationTypeOptionsSignal.set(response.data.donationTypes || []);
            this.procedureCodeOptionsSignal.set(response.data.procedureCodes || []);
            this.attributeGroupOptionsSignal.set(response.data.attributeGroups || []);
          }
          this.isLoadingOptions = false;
          this.cdr.markForCheck();
        },
        error: () => {
          // Error is handled by authInterceptor
          this.donationTypeOptionsSignal.set([]);
          this.procedureCodeOptionsSignal.set([]);
          this.attributeGroupOptionsSignal.set([]);
          this.isLoadingOptions = false;
          this.cdr.markForCheck();
        }
      });
  }

  onClose(): void {
    this.close.emit();
  }

  onClear(): void {
    this.filterForm.reset();
    this.effectiveDateRawInput = '';
    this.terminationDateRawInput = '';

    this.filterForm.get('period')?.setErrors(null);
    this.filterForm.get('terminationPeriod')?.setErrors(null);

    // Clear search controls
    this.donationTypeSearchControl.setValue('');
    this.procedureCodeSearchControl.setValue('');
    this.attributeGroupSearchControl.setValue('');

    this.cdr.markForCheck();
  }

  onApply(): void {
    this.validateEffectiveDatePeriod();
    this.validateTerminationDatePeriod();

    const effectiveDateControl = this.filterForm.get('effectiveDate');
    const terminationDateControl = this.filterForm.get('terminationDate');
    const periodControl = this.filterForm.get('period');
    const terminationPeriodControl = this.filterForm.get('terminationPeriod');

    // Prevent apply if any validation errors exist
    if (effectiveDateControl?.errors ||
        terminationDateControl?.errors ||
        periodControl?.errors ||
        terminationPeriodControl?.errors) {
      // Mark all controls as touched to show all errors
      effectiveDateControl?.markAsTouched();
      terminationDateControl?.markAsTouched();
      periodControl?.markAsTouched();
      terminationPeriodControl?.markAsTouched();
      this.cdr.markForCheck();
      return;
    }

    const formValue = this.filterForm.value;

    // Convert Moment objects to Date objects (ChapterAwareDateAdapter returns Moment)
    const effectiveDate = formValue.effectiveDate && moment.isMoment(formValue.effectiveDate)
      ? formValue.effectiveDate.toDate()
      : formValue.effectiveDate || null;

    const terminationDate = formValue.terminationDate && moment.isMoment(formValue.terminationDate)
      ? formValue.terminationDate.toDate()
      : formValue.terminationDate || null;

    const filters: DonationTypeProcedureCodeFilterValue = {
      donationType: formValue.donationType || null,
      procedureCode: formValue.procedureCode || null,
      attributeGroup: formValue.attributeGroup || null,
      attributeCode: null,
      period: formValue.period || null,
      effectiveDate,
      terminationDate,
      terminationPeriod: formValue.terminationPeriod || null
    };
    this.apply.emit(filters);
  }

  get isApplyDisabled(): boolean {
    const formValue = this.filterForm?.value;
    if (!formValue) return true;

    // Check for date format validation errors
    const effDateControl = this.filterForm.get('effectiveDate');
    const termDateControl = this.filterForm.get('terminationDate');
    const hasDateFormatErrors = !!(
      effDateControl?.hasError('invalidDateFormat') ||
      effDateControl?.hasError('matDatepickerParse') ||
      effDateControl?.hasError('invalidDate') ||
      termDateControl?.hasError('invalidDateFormat') ||
      termDateControl?.hasError('matDatepickerParse') ||
      termDateControl?.hasError('invalidDate')
    );

    if (hasDateFormatErrors) {
      return true;
    }

    // Disable if period is selected without a corresponding date
    const effectiveDateIncomplete = formValue.period !== null && !formValue.effectiveDate;
    const terminationDateIncomplete = formValue.terminationPeriod !== null && !formValue.terminationDate;

    // Check if at least one complete filter value exists
    const hasDonationType = !!formValue.donationType;
    const hasProcedureCode = !!formValue.procedureCode;
    const hasAttributeGroup = !!formValue.attributeGroup;
    const hasEffectiveDate = formValue.effectiveDate !== null;
    const hasTerminationDate = formValue.terminationDate !== null;
    const hasAnyCompleteValue = hasDonationType || hasProcedureCode || hasAttributeGroup
      || hasEffectiveDate || hasTerminationDate;

    if (!hasAnyCompleteValue || effectiveDateIncomplete || terminationDateIncomplete || this.hasValidationErrors) {
      return true;
    }

    return !this.formChanged;
  }

  get hasValidationErrors(): boolean {
    return this.filterForm.get('period')?.invalid ||
           this.filterForm.get('terminationPeriod')?.invalid ||
           false;
  }

  get effDatePeriodRequired(): boolean {
    const control = this.filterForm?.get('period');
    return control?.hasError('required') ?? false;
  }

  get termDatePeriodRequired(): boolean {
    const control = this.filterForm?.get('terminationPeriod');
    return control?.hasError('required') ?? false;
  }

  /**
   * Store raw input text when user types in effective date field
   */
  onEffectiveDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.effectiveDateRawInput = input.value;

    // Mark as dirty so validator runs even if adapter rejects the value
    const control = this.filterForm.get('effectiveDate');
    if (control && !control.dirty) {
      control.markAsDirty();
    }
    // Trigger validation update
    control?.updateValueAndValidity();
    this.cdr.markForCheck();
  }

  /**
   * Restore invalid text when Material clears it on blur
   */
  onEffectiveDateBlur(input: HTMLInputElement): void {
    setTimeout(() => {
      const control = this.filterForm.get('effectiveDate');
      // Mark as touched to show validation errors
      control?.markAsTouched();

      if (!control?.value && this.effectiveDateRawInput && !input.value) {
        input.value = this.effectiveDateRawInput;
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

    // Mark as dirty so validator runs even if adapter rejects the value
    const control = this.filterForm.get('terminationDate');
    if (control && !control.dirty) {
      control.markAsDirty();
    }
    // Trigger validation update
    control?.updateValueAndValidity();
    this.cdr.markForCheck();
  }

  /**
   * Restore invalid text when Material clears it on blur
   */
  onTerminationDateBlur(input: HTMLInputElement): void {
    setTimeout(() => {
      const control = this.filterForm.get('terminationDate');
      // Mark as touched to show validation errors
      control?.markAsTouched();

      if (!control?.value && this.terminationDateRawInput && !input.value) {
        input.value = this.terminationDateRawInput;
      }
      this.cdr.markForCheck();
    }, 0);
  }
}
