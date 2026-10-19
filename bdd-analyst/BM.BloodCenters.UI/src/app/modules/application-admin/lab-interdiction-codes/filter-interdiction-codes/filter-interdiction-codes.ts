import { Component, Inject, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DATE_FORMATS, DateAdapter, ErrorStateMatcher } from '@angular/material/core';
import { dateFormatValidator } from 'src/app/core/utils/date-adapter.util';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';

export interface LabInterdictionFilterData {
  type?: string;
  system?: string;
  effectivePeriod?: string;
  effectiveDate?: Date | null;
  terminationPeriod?: string;
  terminationDate?: Date | null;
}

@Component({
  selector: 'app-filter-interdiction-codes',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }
  ],
  templateUrl: './filter-interdiction-codes.html',
  styleUrls: ['./filter-interdiction-codes.scss'],
})
export class FilterInterdictionCodes implements OnInit, OnDestroy {
  @ViewChild('effDateNativeInput') effDateNativeInput?: ElementRef;
  @ViewChild('termDateNativeInput') termDateNativeInput?: ElementRef;

  filterForm: FormGroup;
  private destroy$ = new Subject<void>();

  effectivePeriodRequired = false;
  terminationPeriodRequired = false;

  // Dropdown search controls
  typeSearchControl = new FormControl<string>('');

  // Filtered options
  filteredTypeOptions: { value: string; label: string }[] = [];

  // All options
  typeOptions = [
    { value: 'I', label: 'INITIAL' },
    { value: 'H', label: 'HOLD' },
    { value: 'B', label: 'BIO' },
    { value: 'N', label: 'NFT' }
  ];

  systemOptions = [
    { value: 'Y', label: 'YES' },
    { value: 'N', label: 'NO' }
  ];

  // Store raw input text to preserve invalid dates
  private effectiveDateRawInput = '';
  private terminationDateRawInput = '';

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

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<FilterInterdictionCodes>,
    @Inject(MAT_DIALOG_DATA) public data: LabInterdictionFilterData
  ) {
    // Initialize filtered options
    this.filteredTypeOptions = [...this.typeOptions];

    this.filterForm = this.fb.group({
      type: [data?.type || null],
      system: [data?.system || null],
      effectivePeriod: [data?.effectivePeriod || null],
      effectiveDate: [data?.effectiveDate ? new Date(data.effectiveDate) : null, [dateFormatValidator()]],
      terminationPeriod: [data?.terminationPeriod || null],
      terminationDate: [data?.terminationDate ? new Date(data.terminationDate) : null, [dateFormatValidator()]]
    });
  }

  ngOnInit(): void {
    // Setup dropdown search for Type
    this.typeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((search) => {
        const term = (search ?? '').toLowerCase();
        this.filteredTypeOptions = this.typeOptions.filter((option) =>
          option.label.toLowerCase().includes(term) || option.value.toLowerCase().includes(term)
        );
      });

    // Setup validation listeners for immediate validation
    this.filterForm.get('effectiveDate')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((value) => {
      const dateControl = this.filterForm.get('effectiveDate');
      const hasValidDate = value && !dateControl?.hasError('invalidDateFormat') && !dateControl?.hasError('matDatepickerParse');

      if (hasValidDate) {
        // Mark period as touched when a valid date is selected
        this.filterForm.get('effectivePeriod')?.markAsTouched();
      }

      setTimeout(() => this.validateEffectivePeriod(), 0);
    });

    this.filterForm.get('effectiveDate')?.statusChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      const dateControl = this.filterForm.get('effectiveDate');
      const hasValidDate = dateControl?.value && !dateControl?.hasError('invalidDateFormat') && !dateControl?.hasError('matDatepickerParse');

      if (hasValidDate) {
        // Mark period as touched when date becomes valid
        this.filterForm.get('effectivePeriod')?.markAsTouched();
      }

      this.validateEffectivePeriod();
    });

    this.filterForm.get('effectivePeriod')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.validateEffectivePeriod();
    });

    this.filterForm.get('terminationDate')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((value) => {
      const dateControl = this.filterForm.get('terminationDate');
      const hasValidDate = value && !dateControl?.hasError('invalidDateFormat') && !dateControl?.hasError('matDatepickerParse');

      if (hasValidDate) {
        // Mark period as touched when a valid date is selected
        this.filterForm.get('terminationPeriod')?.markAsTouched();
      }

      setTimeout(() => this.validateTerminationPeriod(), 0);
    });

    this.filterForm.get('terminationDate')?.statusChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      const dateControl = this.filterForm.get('terminationDate');
      const hasValidDate = dateControl?.value && !dateControl?.hasError('invalidDateFormat') && !dateControl?.hasError('matDatepickerParse');

      if (hasValidDate) {
        // Mark period as touched when date becomes valid
        this.filterForm.get('terminationPeriod')?.markAsTouched();
      }

      this.validateTerminationPeriod();
    });

    this.filterForm.get('terminationPeriod')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.validateTerminationPeriod();
    });

    // Initial validation
    this.validateEffectivePeriod();
    this.validateTerminationPeriod();
  }

  private validateEffectivePeriod(): void {
    const effectiveDateControl = this.filterForm.get('effectiveDate');
    const effectiveDate = effectiveDateControl?.value;
    const effectivePeriod = this.filterForm.get('effectivePeriod')?.value;

    // Only require period if date is valid (no date validation errors)
    const hasValidDate = effectiveDate && !effectiveDateControl?.hasError('invalidDateFormat') && !effectiveDateControl?.hasError('matDatepickerParse');

    if (hasValidDate && !effectivePeriod) {
      this.effectivePeriodRequired = true;
    } else {
      this.effectivePeriodRequired = false;
    }
  }

  private validateTerminationPeriod(): void {
    const terminationDateControl = this.filterForm.get('terminationDate');
    const terminationDate = terminationDateControl?.value;
    const terminationPeriod = this.filterForm.get('terminationPeriod')?.value;

    // Only require period if date is valid (no date validation errors)
    const hasValidDate = terminationDate && !terminationDateControl?.hasError('invalidDateFormat') && !terminationDateControl?.hasError('matDatepickerParse');

    if (hasValidDate && !terminationPeriod) {
      this.terminationPeriodRequired = true;
    } else {
      this.terminationPeriodRequired = false;
    }
  }

  /**
   * Store raw input text when user types in effective date field
   */
  onEffectiveDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.effectiveDateRawInput = input.value;

    // Mark field as touched to show validation errors immediately
    const control = this.filterForm.get('effectiveDate');
    if (control && !control.touched) {
      control.markAsTouched();
    }
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

    // Mark field as touched to show validation errors immediately
    const control = this.filterForm.get('terminationDate');
    if (control && !control.touched) {
      control.markAsTouched();
    }
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

  private getNativeInputText(elRef?: ElementRef): string {
    return elRef?.nativeElement?.value?.trim() ?? '';
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

  get isApplyDisabled(): boolean {
    // Check if form has validation errors
    if (this.filterForm.invalid) {
      return true;
    }

    // Check if date fields have invalid text input
    if (this.getEffectiveDateError() || this.getTerminationDateError()) {
      return true;
    }

    // Check if there are period validation errors
    if (this.effectivePeriodRequired || this.terminationPeriodRequired) {
      return true;
    }

    // Check if at least one field has a value
    const formValue = this.filterForm.value;
    const hasAnyValue = (formValue.type && formValue.type !== '') ||
                        (formValue.system && formValue.system !== '') ||
                        formValue.effectiveDate ||
                        formValue.terminationDate;

    return !hasAnyValue;
  }

  apply(): void {
    // Validate before applying
    this.validateEffectivePeriod();
    this.validateTerminationPeriod();

    if (this.effectivePeriodRequired || this.terminationPeriodRequired || this.filterForm.invalid) {
      return;
    }

    const filters = this.filterForm.value;
    this.dialogRef.close(filters);
  }

  clearAll(): void {
    this.filterForm.reset({
      type: null,
      system: null,
      effectivePeriod: null,
      effectiveDate: null,
      terminationPeriod: null,
      terminationDate: null
    });

    // Clear raw input storage
    this.effectiveDateRawInput = '';
    this.terminationDateRawInput = '';

    // Reset search controls
    this.typeSearchControl.setValue('', { emitEvent: false });
  }

  preventSpaceInput(event: KeyboardEvent): void {
    if (event.key === ' ' || event.code === 'Space') {
      event.preventDefault();
    }
  }

  close(): void {
    this.dialogRef.close();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
