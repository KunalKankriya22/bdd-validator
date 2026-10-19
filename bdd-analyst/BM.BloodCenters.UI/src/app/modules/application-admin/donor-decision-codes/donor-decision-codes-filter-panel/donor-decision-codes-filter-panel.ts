import { Component, ChangeDetectionStrategy, ChangeDetectorRef, EventEmitter, Input, OnInit, OnDestroy, Output, ViewChild, ElementRef, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, ErrorStateMatcher, MatDateFormats } from '@angular/material/core';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { dateFormatValidator } from 'src/app/core/utils/date-adapter.util';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';
import { DonorDecisionCodesService } from '../services/donor-decision-codes.service';
import { DonorDecisionCodeFilterValue, DonorDecisionCodeOption } from '../models/donor-decision-codes.model';

// Custom date formats for filter panel - includes DDMMMYYYY format for auto-formatting
const FILTER_DATE_FORMATS: MatDateFormats = {
  parse: {
    dateInput: [
      'DD-MMM-YYYY',     // Preferred display format
      'DDMMMYYYY',       // Auto-format: 01jan2026 → 01-JAN-2026
      'DD.MMM.YYYY',
      'DD/MMM/YYYY',
      'DD MMM YYYY',
      'YYYY-MMM-DD',
      'MMM DD, YYYY',
      'MMMM DD, YYYY',
      'MMDDYYYY',
      'MM/DD/YYYY',
      'MM-DD-YYYY',
      'MM.DD.YYYY',
      'DD/MM/YYYY',
      'DD-MM-YYYY',
      'YYYY-MM-DD',
      'YYYY/MM/DD',
      'YYYY.MM.DD',
      'YYYYMMDD',
    ],
  },
  display: {
    dateInput: 'DD-MMM-YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'DD-MMM-YYYY',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

@Component({
  selector: 'app-donor-decision-codes-filter-panel',
  standalone: true,
  templateUrl: './donor-decision-codes-filter-panel.html',
  styleUrls: ['./donor-decision-codes-filter-panel.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatProgressSpinnerModule,
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: FILTER_DATE_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DonorDecisionCodesFilterPanel implements OnInit, OnDestroy {
  @Input() currentFilters: DonorDecisionCodeFilterValue | null = null;
  @Output() apply = new EventEmitter<DonorDecisionCodeFilterValue>();
  @Output() close = new EventEmitter<void>();

  @ViewChild('effectiveDateNativeInput') effectiveDateNativeInput?: ElementRef;
  @ViewChild('terminationDateNativeInput') terminationDateNativeInput?: ElementRef;

  filterForm!: FormGroup;

  readonly selectPanelLoadingValue = '__FILTER_PANEL_LOADING__';
  readonly selectPanelEmptyValue = '__FILTER_PANEL_EMPTY__';

  readonly barcodeOptions = signal<string[]>([]);
  readonly donorDecisionCodeOptions = signal<DonorDecisionCodeOption[]>([]);

  readonly barcodeSearchControl = new FormControl('');
  readonly donorDecisionCodeSearchControl = new FormControl('');

  readonly barcodeSearch = signal('');
  readonly donorDecisionCodeSearch = signal('');

  readonly filteredBarcodes = computed(() => {
    const search = this.barcodeSearch().toLowerCase();
    const options = this.barcodeOptions();
    if (!search) return options;
    return options.filter(o => o.toLowerCase().includes(search));
  });

  readonly filteredDonorDecisionCodes = computed(() => {
    const search = this.donorDecisionCodeSearch().toLowerCase();
    const options = this.donorDecisionCodeOptions();
    if (!search) return options;
    return options.filter(o =>
      o.donorDecisionCode.toLowerCase().includes(search) ||
      (o.description && o.description.toLowerCase().includes(search))
    );
  });

  isLoadingFilters = false;

  private destroy$ = new Subject<void>();

  periodOptions: { value: string; display: string }[] = [
    { value: 'After', display: 'After' },
    { value: 'Before', display: 'Before' }
  ];

  effectiveDateErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control): boolean => {
      if (!control || !(control.dirty || control.touched)) return false;
      if (control.invalid) return true;
      return !control.value && !!this.getNativeInputText(this.effectiveDateNativeInput);
    }
  };

  terminationDateErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control): boolean => {
      if (!control || !(control.dirty || control.touched)) return false;
      if (control.invalid) return true;
      return !control.value && !!this.getNativeInputText(this.terminationDateNativeInput);
    }
  };

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private service: DonorDecisionCodesService
  ) {
    this.filterForm = this.fb.group({
      barcode: [null],
      donorDecisionCode: [null],
      effectiveDatePeriod: [null],
      effectiveDate: [null],
      terminationDatePeriod: [null],
      terminationDate: [null]
    });

    // Setup search control subscriptions
    this.barcodeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.barcodeSearch.set(value || ''));

    this.donorDecisionCodeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.donorDecisionCodeSearch.set(value || ''));
  }

  ngOnInit(): void {
    this.loadDropdownData();

    if (this.currentFilters) {
      this.filterForm.patchValue(this.currentFilters);
    }

    this.setupValidation();
  }

  private loadDropdownData(): void {
    this.isLoadingFilters = true;

    // Load barcodes
    this.service.getBarcodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (barcodes) => {
          this.barcodeOptions.set(barcodes);
          this.isLoadingFilters = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.barcodeOptions.set([]);
          this.isLoadingFilters = false;
          this.cdr.markForCheck();
        }
      });

    // Load donor decision codes
    this.service.getDonorDecisionCodeOptions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (codes) => {
          this.donorDecisionCodeOptions.set(codes);
          this.cdr.markForCheck();
        },
        error: () => {
          this.donorDecisionCodeOptions.set([]);
          this.cdr.markForCheck();
        }
      });
  }

  private setupValidation(): void {
    this.filterForm.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        const periodControl = this.filterForm.get('effectiveDatePeriod');
        if (periodControl) {
          if (value) {
            periodControl.markAsTouched();
          } else {
            // Clear touched state when date is cleared
            periodControl.markAsUntouched();
          }
          periodControl.updateValueAndValidity({ emitEvent: false });
          this.cdr.markForCheck();
        }
      });

    this.filterForm.get('effectiveDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.filterForm.get('effectiveDatePeriod')?.updateValueAndValidity({ emitEvent: false });
        this.cdr.markForCheck();
      });

    this.filterForm.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        const periodControl = this.filterForm.get('terminationDatePeriod');
        if (periodControl) {
          if (value) {
            periodControl.markAsTouched();
          } else {
            // Clear touched state when date is cleared
            periodControl.markAsUntouched();
          }
          periodControl.updateValueAndValidity({ emitEvent: false });
          this.cdr.markForCheck();
        }
      });

    this.filterForm.get('terminationDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.filterForm.get('terminationDatePeriod')?.updateValueAndValidity({ emitEvent: false });
        this.cdr.markForCheck();
      });

    this.filterForm.get('effectiveDatePeriod')?.setValidators([this.effectiveDatePeriodValidator.bind(this)]);
    this.filterForm.get('terminationDatePeriod')?.setValidators([this.terminationDatePeriodValidator.bind(this)]);

    // Setup date format validators for auto-formatting
    const effectiveDateControl = this.filterForm.get('effectiveDate');
    if (effectiveDateControl) {
      effectiveDateControl.setValidators([
        dateFormatValidator(),
        DateFieldValidationUtility.validDateValidator()
      ]);
      effectiveDateControl.updateValueAndValidity();
    }

    const terminationDateControl = this.filterForm.get('terminationDate');
    if (terminationDateControl) {
      terminationDateControl.setValidators([
        dateFormatValidator(),
        DateFieldValidationUtility.validDateValidator()
      ]);
      terminationDateControl.updateValueAndValidity();
    }
  }

  private effectiveDatePeriodValidator(control: AbstractControl): ValidationErrors | null {
    if (!this.filterForm) return null;

    const effectiveDate = this.filterForm.get('effectiveDate')?.value;
    const effectiveDatePeriod = control.value;

    if (effectiveDate && !effectiveDatePeriod) {
      return { required: true };
    }

    return null;
  }

  private terminationDatePeriodValidator(control: AbstractControl): ValidationErrors | null {
    if (!this.filterForm) return null;

    const terminationDate = this.filterForm.get('terminationDate')?.value;
    const terminationDatePeriod = control.value;

    if (terminationDate && !terminationDatePeriod) {
      return { required: true };
    }

    return null;
  }

  private getNativeInputText(elRef?: ElementRef): string {
    return elRef?.nativeElement?.value?.trim() ?? '';
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get isApplyDisabled(): boolean {
    if (this.filterForm.invalid) {
      return true;
    }

    const formValue = this.filterForm.value;
    const hasAnyFilter = !!(
      formValue.barcode ||
      formValue.donorDecisionCode ||
      (formValue.effectiveDate && formValue.effectiveDatePeriod) ||
      (formValue.terminationDate && formValue.terminationDatePeriod)
    );

    return !hasAnyFilter;
  }

  onApply(): void {
    this.filterForm.markAllAsTouched();

    if (this.filterForm.invalid) {
      return;
    }

    const formValue = this.filterForm.value;

    const effectiveDatePeriod = formValue.effectiveDate ? (formValue.effectiveDatePeriod || null) : null;
    const terminationDatePeriod = formValue.terminationDate ? (formValue.terminationDatePeriod || null) : null;

    const filters: DonorDecisionCodeFilterValue = {
      barcode: formValue.barcode || null,
      donorDecisionCode: formValue.donorDecisionCode || null,
      effectiveDatePeriod: effectiveDatePeriod,
      effectiveDate: formValue.effectiveDate || null,
      terminationDatePeriod: terminationDatePeriod,
      terminationDate: formValue.terminationDate || null
    };

    this.apply.emit(filters);
  }

  onClear(): void {
    this.filterForm.reset({
      barcode: null,
      donorDecisionCode: null,
      effectiveDatePeriod: null,
      effectiveDate: null,
      terminationDatePeriod: null,
      terminationDate: null
    });

    // Reset search controls
    this.barcodeSearchControl.reset('');
    this.donorDecisionCodeSearchControl.reset('');
    this.barcodeSearch.set('');
    this.donorDecisionCodeSearch.set('');
  }

  onClose(): void {
    this.close.emit();
  }

  onEffectiveDateInput(event: Event): void {
    const inputValue = (event.target as HTMLInputElement).value;
    DateFieldValidationUtility.handleStartDateInput(
      inputValue,
      this.filterForm.get('effectiveDate')
    );
    this.cdr.markForCheck();
  }

  onEffectiveDateBlur(): void {
    const control = this.filterForm.get('effectiveDate');
    control?.markAsTouched();
    this.cdr.markForCheck();
  }

  onTerminationDateInput(event: Event): void {
    const inputValue = (event.target as HTMLInputElement).value;
    DateFieldValidationUtility.handleEndDateInput(
      inputValue,
      this.filterForm.get('terminationDate'),
      false // Not edit mode
    );
    this.cdr.markForCheck();
  }

  onTerminationDateBlur(): void {
    const control = this.filterForm.get('terminationDate');
    control?.markAsTouched();
    this.cdr.markForCheck();
  }

  getEffectiveDatePeriodError(): string {
    const control = this.filterForm.get('effectiveDatePeriod');
    const dateControl = this.filterForm.get('effectiveDate');

    // Only show error if date has a value
    if (!dateControl?.value) return '';
    if (!control || !control.touched) return '';
    if (control.hasError('required')) return 'Period is required';
    return '';
  }

  getTerminationDatePeriodError(): string {
    const control = this.filterForm.get('terminationDatePeriod');
    const dateControl = this.filterForm.get('terminationDate');

    // Only show error if date has a value
    if (!dateControl?.value) return '';
    if (!control || !control.touched) return '';
    if (control.hasError('required')) return 'Period is required';
    return '';
  }

  getEffectiveDateError(): string {
    const control = this.filterForm?.get('effectiveDate');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('matDatepickerParse')) return 'Effective date is invalid';
    if (!control.value && this.getNativeInputText(this.effectiveDateNativeInput)) return 'Effective date is invalid';
    return '';
  }

  getTerminationDateError(): string {
    const control = this.filterForm?.get('terminationDate');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('matDatepickerParse')) return 'Termination date is invalid';
    if (!control.value && this.getNativeInputText(this.terminationDateNativeInput)) return 'Termination date is invalid';
    return '';
  }
}
