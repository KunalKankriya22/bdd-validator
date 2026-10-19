import {
  Component,
  ElementRef,
  EventEmitter,
  Output,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  Input,
  ChangeDetectorRef,
  ViewChild
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
import { DateAdapter, ErrorStateMatcher, MAT_DATE_FORMATS } from '@angular/material/core';
import { CustomDateAdapter, DD_MMM_YYYY_FORMAT, dateFormatValidator } from 'src/app/core/utils/date-adapter.util';
import { Subject, takeUntil } from 'rxjs';

import { DefineMaxDonationsService } from '../services/define-max-donations.service';
import { DonationTypeDropdown } from '../models/define-max-donations.model';

export interface DefineMaxDonationsFilterFormValue {
  donationType: string | null;
  periodType1: string | null;
  effectiveDate: Date | null;
  periodType2: string | null;
  terminationDate: Date | null;
}

@Component({
  selector: 'app-define-max-donations-filter-panel',
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
  templateUrl: './define-max-donations-filter-panel.html',
  styleUrls: ['./define-max-donations-filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DefineMaxDonationsFilterPanel implements OnInit, OnDestroy {
  @Input() currentFilters: DefineMaxDonationsFilterFormValue | null = null;
  @Output() apply = new EventEmitter<DefineMaxDonationsFilterFormValue>();
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
  donationTypes: DonationTypeDropdown[] = [];
  filteredDonationTypes: DonationTypeDropdown[] = [];
  donationTypeSearchControl = new FormControl('');
  isLoadingDonationTypes = false;

  // Store raw input text to preserve invalid dates
  private effectiveDateRawInput = '';
  private terminationDateRawInput = '';

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private defineMaxDonationsService: DefineMaxDonationsService
  ) { }

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      donationType: [this.currentFilters?.donationType || null],
      periodType1: [this.currentFilters?.periodType1 || null],
      effectiveDate: [this.currentFilters?.effectiveDate || null, [dateFormatValidator()]],
      periodType2: [this.currentFilters?.periodType2 || null],
      terminationDate: [this.currentFilters?.terminationDate || null, [dateFormatValidator()]]
    });

    // Setup validation listeners
    this.filterForm.get('effectiveDate')?.valueChanges.subscribe(() => {
      this.validatePeriodType1();
    });

    this.filterForm.get('periodType1')?.valueChanges.subscribe(() => {
      this.validatePeriodType1();
    });

    this.filterForm.get('terminationDate')?.valueChanges.subscribe(() => {
      this.validatePeriodType2();
    });

    this.filterForm.get('periodType2')?.valueChanges.subscribe(() => {
      this.validatePeriodType2();
    });

    // Initial validation check in case filters were pre-populated
    this.validatePeriodType1();
    this.validatePeriodType2();

    this.loadDonationTypes();

    // Setup donation type search filtering
    this.donationTypeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        this.filterDonationTypes(search || '');
      });
  }

  private filterDonationTypes(search: string): void {
    if (!search) {
      this.filteredDonationTypes = this.donationTypes;
      return;
    }
    const lowerSearch = search.toLowerCase();
    this.filteredDonationTypes = this.donationTypes.filter(type =>
      type.donationType.toLowerCase().includes(lowerSearch) ||
      type.donationTypeDescription?.toLowerCase().includes(lowerSearch)
    );
    this.cdr.markForCheck();
  }

  private validatePeriodType1(): void {
    const effectiveDate = this.filterForm.get('effectiveDate')?.value;
    const periodType1 = this.filterForm.get('periodType1')?.value;
    const periodType1Control = this.filterForm.get('periodType1');

    if (effectiveDate && !periodType1) {
      periodType1Control?.setErrors({ required: true });
      periodType1Control?.markAsTouched();
    } else {
      periodType1Control?.setErrors(null);
    }
    this.cdr.markForCheck();
  }

  private validatePeriodType2(): void {
    const terminationDate = this.filterForm.get('terminationDate')?.value;
    const periodType2 = this.filterForm.get('periodType2')?.value;
    const periodType2Control = this.filterForm.get('periodType2');

    if (terminationDate && !periodType2) {
      periodType2Control?.setErrors({ required: true });
      periodType2Control?.markAsTouched();
    } else {
      periodType2Control?.setErrors(null);
    }
    this.cdr.markForCheck();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadDonationTypes(): void {
    this.isLoadingDonationTypes = true;
    this.cdr.markForCheck();

    this.defineMaxDonationsService.getDonationTypesFilter()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.donationTypes = data || [];
          this.filteredDonationTypes = this.donationTypes;
          this.isLoadingDonationTypes = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error loading donation types:', error);
          this.isLoadingDonationTypes = false;
          this.cdr.markForCheck();
        }
      });
  }

  /**
   * Store raw input text when user types in effective date field
   */
  onEffectiveDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.effectiveDateRawInput = input.value;

    const control = this.filterForm.get('effectiveDate');
    if (control && !control.dirty) {
      control.markAsDirty();
    }
    control?.updateValueAndValidity();
    if (input.value && input.value.trim().length > 0 && !control?.value) {
      control?.setErrors({ invalidDateFormat: true });
    }
    this.cdr.markForCheck();
  }

  /**
   * Restore invalid text when Material clears it on blur
   */
  onEffectiveDateBlur(input: HTMLInputElement): void {
    setTimeout(() => {
      const control = this.filterForm.get('effectiveDate');
      control?.markAsTouched();
      if (!control?.value && this.effectiveDateRawInput && !input.value) {
        input.value = this.effectiveDateRawInput;
      }
      if (!control?.value && this.effectiveDateRawInput && this.effectiveDateRawInput.trim().length > 0) {
        control?.setErrors({ invalidDateFormat: true });
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

    const control = this.filterForm.get('terminationDate');
    if (control && !control.dirty) {
      control.markAsDirty();
    }
    control?.updateValueAndValidity();
    if (input.value && input.value.trim().length > 0 && !control?.value) {
      control?.setErrors({ invalidDateFormat: true });
    }
    this.cdr.markForCheck();
  }

  /**
   * Restore invalid text when Material clears it on blur
   */
  onTerminationDateBlur(input: HTMLInputElement): void {
    setTimeout(() => {
      const control = this.filterForm.get('terminationDate');
      control?.markAsTouched();
      if (!control?.value && this.terminationDateRawInput && !input.value) {
        input.value = this.terminationDateRawInput;
      }
      if (!control?.value && this.terminationDateRawInput && this.terminationDateRawInput.trim().length > 0) {
        control?.setErrors({ invalidDateFormat: true });
      }
      this.cdr.markForCheck();
    }, 0);
  }

  onApply(): void {
    // Validate before applying
    this.validatePeriodType1();
    this.validatePeriodType2();

    // Don't apply if there are validation errors
    const periodType1Control = this.filterForm.get('periodType1');
    const periodType2Control = this.filterForm.get('periodType2');

    if (periodType1Control?.errors || periodType2Control?.errors) {
      return;
    }

    const formValue = this.filterForm.value;

    const filters: DefineMaxDonationsFilterFormValue = {
      donationType: formValue.donationType,
      periodType1: formValue.periodType1,
      effectiveDate: formValue.effectiveDate,
      periodType2: formValue.periodType2,
      terminationDate: formValue.terminationDate
    };

    this.apply.emit(filters);
  }

  onClear(): void {
    this.filterForm.reset({
      donationType: null,
      periodType1: null,
      effectiveDate: null,
      periodType2: null,
      terminationDate: null
    });
    this.effectiveDateRawInput = '';
    this.terminationDateRawInput = '';
    this.cdr.markForCheck();
  }

  onClose(): void {
    this.close.emit();
  }

  get isApplyDisabled(): boolean {
    const formValue = this.filterForm.value;

    // Check if at least one field has a value
    const hasAnyValue =
      (formValue.donationType !== null && formValue.donationType !== '') ||
      formValue.effectiveDate !== null ||
      formValue.terminationDate !== null ||
      (formValue.periodType1 !== null && formValue.periodType1 !== '') ||
      (formValue.periodType2 !== null && formValue.periodType2 !== '');

    // Check for validation errors
    const hasValidationErrors = this.filterForm.invalid;

    return !hasAnyValue || hasValidationErrors;
  }
}
