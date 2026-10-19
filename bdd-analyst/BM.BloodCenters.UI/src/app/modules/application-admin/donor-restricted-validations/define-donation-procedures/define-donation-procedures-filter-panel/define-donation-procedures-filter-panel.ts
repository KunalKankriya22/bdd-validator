import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
  Input,
  ChangeDetectorRef,
  ViewChild,
  ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DateAdapter, ErrorStateMatcher, MAT_DATE_FORMATS } from '@angular/material/core';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';
import { LookUp } from '../models/define-donation-procedures.model';

export interface DefineDonationProceduresFilterFormValue {
  donationType: string | null;
  procedureCode: string | null;
  effectiveDatePeriod: string | null;
  effectiveDate: Date | null;
  terminationDatePeriod: string | null;
  terminationDate: Date | null;
}

@Component({
  selector: 'app-define-donation-procedures-filter-panel',
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
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }
  ],
  templateUrl: './define-donation-procedures-filter-panel.html',
  styleUrls: ['./define-donation-procedures-filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DefineDonationProceduresFilterPanel implements OnInit, OnChanges, OnDestroy {
  @Input() currentFilters: DefineDonationProceduresFilterFormValue | null = null;
  @Input() donationTypes: LookUp[] = [];
  @Input() procedureCodes: LookUp[] = [];
  @Output() apply = new EventEmitter<DefineDonationProceduresFilterFormValue>();
  @Output() close = new EventEmitter<void>();
  @ViewChild('effectiveDateInput') effectiveDateInputRef!: ElementRef<HTMLInputElement>;
  @ViewChild('terminationDateInput') terminationDateInputRef!: ElementRef<HTMLInputElement>;

  effDateErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control: FormControl | null): boolean => {
      if (!control) return false;
      if (control.invalid && (control.touched || control.dirty)) return true;
      const inputValue = this.effectiveDateInputRef?.nativeElement?.value;
      return !!(control.touched || control.dirty) && !control.value && !!inputValue && inputValue.trim().length > 0;
    }
  };

  termDateErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control: FormControl | null): boolean => {
      if (!control) return false;
      if (control.invalid && (control.touched || control.dirty)) return true;
      const inputValue = this.terminationDateInputRef?.nativeElement?.value;
      return !!(control.touched || control.dirty) && !control.value && !!inputValue && inputValue.trim().length > 0;
    }
  };

  filterForm!: FormGroup;

  periodOptions: { value: string; display: string }[] = [
    { value: 'After', display: 'After' },
    { value: 'Before', display: 'Before' }
  ];

  // Filtered dropdown arrays
  filteredDonationTypes: LookUp[] = [];
  filteredProcedureCodes: LookUp[] = [];

  // Search controls for dropdowns
  donationTypeSearchControl = new FormControl<string>('');
  procedureCodeSearchControl = new FormControl<string>('');

  // Loading state
  isLoadingFilters = false;
  private formChanged = false;

  // Sentinel values for disabled mat-option rows
  readonly selectPanelLoadingValue = '__FILTER_PANEL_LOADING__';
  readonly selectPanelEmptyValue = '__FILTER_PANEL_EMPTY__';

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    // Update filtered arrays when input arrays change
    if (changes['donationTypes'] && this.donationTypes) {
      this.filteredDonationTypes = [...this.donationTypes];
      this.donationTypeSearchControl.setValue('', { emitEvent: false });
    }

    if (changes['procedureCodes'] && this.procedureCodes) {
      this.filteredProcedureCodes = [...this.procedureCodes];
      this.procedureCodeSearchControl.setValue('', { emitEvent: false });
    }
  }

  ngOnInit(): void {
    // Initialize filtered arrays
    this.filteredDonationTypes = [...this.donationTypes];
    this.filteredProcedureCodes = [...this.procedureCodes];

    this.filterForm = this.fb.group({
      donationType: [this.currentFilters?.donationType || null],
      procedureCode: [this.currentFilters?.procedureCode || null],
      effectiveDatePeriod: [this.currentFilters?.effectiveDatePeriod || null],
      effectiveDate: [this.currentFilters?.effectiveDate ? new Date(this.currentFilters.effectiveDate) : null],
      terminationDatePeriod: [this.currentFilters?.terminationDatePeriod || null],
      terminationDate: [this.currentFilters?.terminationDate ? new Date(this.currentFilters.terminationDate) : null]
    });

    // Setup search for Donation Type dropdown
    this.donationTypeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((search) => {
        const term = (search ?? '').toLowerCase();
        this.filteredDonationTypes = this.donationTypes.filter((option) =>
          (option.key + ' - ' + option.value).toLowerCase().includes(term)
        );
      });

    // Setup search for Procedure Code dropdown
    this.procedureCodeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((search) => {
        const term = (search ?? '').toLowerCase();
        this.filteredProcedureCodes = this.procedureCodes.filter((option) =>
          (option.key + ' - ' + option.value).toLowerCase().includes(term)
        );
      });

    this.setupValidation();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupValidation(): void {
    // When effective date changes, validate that period is selected if date is set
    this.filterForm.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        const dateControl = this.filterForm.get('effectiveDate');
        const periodControl = this.filterForm.get('effectiveDatePeriod');
        const hasValidDate = value && !dateControl?.hasError('invalidDateFormat') && !dateControl?.hasError('matDatepickerParse');

        if (hasValidDate && periodControl) {
          periodControl.markAsTouched();
        }

        setTimeout(() => {
          periodControl?.updateValueAndValidity({ emitEvent: false });
          this.cdr.markForCheck();
        }, 0);
      });

    // When effective date status changes, re-validate period
    this.filterForm.get('effectiveDate')?.statusChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const dateControl = this.filterForm.get('effectiveDate');
        const periodControl = this.filterForm.get('effectiveDatePeriod');
        const hasValidDate = dateControl?.value && !dateControl?.hasError('invalidDateFormat') && !dateControl?.hasError('matDatepickerParse');

        if (hasValidDate && periodControl) {
          periodControl.markAsTouched();
        }

        periodControl?.updateValueAndValidity({ emitEvent: false });
        this.cdr.markForCheck();
      });

    // When effective date period changes, re-validate
    this.filterForm.get('effectiveDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        setTimeout(() => {
          this.filterForm.get('effectiveDatePeriod')?.updateValueAndValidity({ emitEvent: false });
          this.cdr.markForCheck();
        }, 0);
      });

    // When termination date changes, validate that period is selected if date is set
    this.filterForm.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        const dateControl = this.filterForm.get('terminationDate');
        const periodControl = this.filterForm.get('terminationDatePeriod');
        const hasValidDate = value && !dateControl?.hasError('invalidDateFormat') && !dateControl?.hasError('matDatepickerParse');

        if (hasValidDate && periodControl) {
          periodControl.markAsTouched();
        }

        setTimeout(() => {
          periodControl?.updateValueAndValidity({ emitEvent: false });
          this.cdr.markForCheck();
        }, 0);
      });

    // When termination date status changes, re-validate period
    this.filterForm.get('terminationDate')?.statusChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const dateControl = this.filterForm.get('terminationDate');
        const periodControl = this.filterForm.get('terminationDatePeriod');
        const hasValidDate = dateControl?.value && !dateControl?.hasError('invalidDateFormat') && !dateControl?.hasError('matDatepickerParse');

        if (hasValidDate && periodControl) {
          periodControl.markAsTouched();
        }

        periodControl?.updateValueAndValidity({ emitEvent: false });
        this.cdr.markForCheck();
      });

    // When termination date period changes, re-validate
    this.filterForm.get('terminationDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        setTimeout(() => {
          this.filterForm.get('terminationDatePeriod')?.updateValueAndValidity({ emitEvent: false });
          this.cdr.markForCheck();
        }, 0);
      });

    // Set validators
    this.filterForm.get('effectiveDatePeriod')?.setValidators([this.effectiveDatePeriodValidator.bind(this)]);
    this.filterForm.get('terminationDatePeriod')?.setValidators([this.terminationDatePeriodValidator.bind(this)]);

    // Subscribe to form value changes to update Apply button state
    this.filterForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.formChanged = true;
        this.cdr.markForCheck();
      });
  }

  private effectiveDatePeriodValidator(control: AbstractControl): ValidationErrors | null {
    if (!this.filterForm) return null;

    const effectiveDateControl = this.filterForm.get('effectiveDate');
    const effectiveDate = effectiveDateControl?.value;
    const effectiveDatePeriod = control.value;

    // Only require period if date is valid (no date validation errors)
    const hasValidDate = effectiveDate && !effectiveDateControl?.hasError('matDatepickerParse');

    if (hasValidDate && !effectiveDatePeriod) {
      return { required: true };
    }

    return null;
  }

  private terminationDatePeriodValidator(control: AbstractControl): ValidationErrors | null {
    if (!this.filterForm) return null;

    const terminationDateControl = this.filterForm.get('terminationDate');
    const terminationDate = terminationDateControl?.value;
    const terminationDatePeriod = control.value;

    // Only require period if date is valid (no date validation errors)
    const hasValidDate = terminationDate && !terminationDateControl?.hasError('matDatepickerParse');

    if (hasValidDate && !terminationDatePeriod) {
      return { required: true };
    }

    return null;
  }

  onApply(): void {
    // Mark all fields as touched to show validation errors
    this.filterForm.markAllAsTouched();

    // Prevent apply if form is invalid
    if (this.filterForm.invalid) {
      return;
    }

    const formValue = this.filterForm.value;

    const filters: DefineDonationProceduresFilterFormValue = {
      donationType: formValue.donationType || null,
      procedureCode: formValue.procedureCode || null,
      effectiveDatePeriod: formValue.effectiveDatePeriod || null,
      effectiveDate: formValue.effectiveDate || null,
      terminationDatePeriod: formValue.terminationDatePeriod || null,
      terminationDate: formValue.terminationDate || null
    };

    this.apply.emit(filters);
  }

  onClear(): void {
    this.filterForm.reset({
      donationType: null,
      procedureCode: null,
      effectiveDatePeriod: null,
      effectiveDate: null,
      terminationDatePeriod: null,
      terminationDate: null
    });

    // Re-validate after reset to clear any stale validation state
    this.filterForm.get('effectiveDatePeriod')?.updateValueAndValidity({ emitEvent: false });
    this.filterForm.get('terminationDatePeriod')?.updateValueAndValidity({ emitEvent: false });
  }

  get effectiveDatePeriodControl() {
    return this.filterForm.get('effectiveDatePeriod');
  }

  get terminationDatePeriodControl() {
    return this.filterForm.get('terminationDatePeriod');
  }

  private getNativeInputText(elRef?: ElementRef): string {
    return elRef?.nativeElement?.value?.trim() ?? '';
  }

  getEffectiveDatePeriodError(): string {
    const control = this.effectiveDatePeriodControl;
    if (!control || !control.touched) return '';
    if (control.hasError('required')) return 'Period is required';
    return '';
  }

  getTerminationDatePeriodError(): string {
    const control = this.terminationDatePeriodControl;
    if (!control || !control.touched) return '';
    if (control.hasError('required')) return 'Period is required';
    return '';
  }

  getEffectiveDateError(): string {
    const control = this.filterForm?.get('effectiveDate');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('matDatepickerParse')) return 'Effective Date is invalid';
    if (!control.value && this.getNativeInputText(this.effectiveDateInputRef)) return 'Effective Date is invalid';
    return '';
  }

  getTerminationDateError(): string {
    const control = this.filterForm?.get('terminationDate');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('matDatepickerParse')) return 'Termination Date is invalid';
    if (!control.value && this.getNativeInputText(this.terminationDateInputRef)) return 'Termination Date is invalid';
    return '';
  }

  get isApplyDisabled(): boolean {
    if (!this.filterForm) return true;

    // Check if form has validation errors
    if (this.filterForm.invalid) {
      return true;
    }

    // Check if date fields have invalid text input
    if (this.getEffectiveDateError() || this.getTerminationDateError()) {
      return true;
    }

    const formValue = this.filterForm.value;

    // Disable if period is selected without a corresponding date
    const effectiveDateIncomplete = formValue.effectiveDatePeriod !== null && formValue.effectiveDatePeriod !== '' && !formValue.effectiveDate;
    const terminationDateIncomplete = formValue.terminationDatePeriod !== null && formValue.terminationDatePeriod !== '' && !formValue.terminationDate;

    // Check if at least one complete filter value exists
    const hasAnyCompleteValue =
      (formValue.donationType !== null && formValue.donationType !== '') ||
      (formValue.procedureCode !== null && formValue.procedureCode !== '') ||
      formValue.effectiveDate !== null ||
      formValue.terminationDate !== null;

    if (!hasAnyCompleteValue || effectiveDateIncomplete || terminationDateIncomplete) {
      return true;
    }

    return !this.formChanged;
  }

  onClose(): void {
    this.close.emit();
  }
}
