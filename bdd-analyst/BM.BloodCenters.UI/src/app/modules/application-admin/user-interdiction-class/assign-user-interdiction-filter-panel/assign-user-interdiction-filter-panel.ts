import {
  Component,
  ElementRef,
  EventEmitter,
  Output,
  Input,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ViewChild,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatNativeDateModule, MAT_DATE_FORMATS, DateAdapter, ErrorStateMatcher } from '@angular/material/core';
import { TranslateModule } from '@ngx-translate/core';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, take, takeUntil } from 'rxjs';

import { AssignUserInterdictionClassService } from '../services/assign-user-interdiction-class.service';
import { AssignUserInterdictionClassFilterValue } from '../models/assign-user-interdiction-class.model';
import { CustomDateAdapter, DD_MMM_YYYY_FORMAT, dateFormatValidator } from 'src/app/core/utils/date-adapter.util';

@Component({
  selector: 'app-assign-user-interdiction-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatDatepickerModule,
    MatInputModule,
    MatFormFieldModule,
    MatNativeDateModule,
    TranslateModule,
    NgxMatSelectSearchModule
  ],
  templateUrl: './assign-user-interdiction-filter-panel.html',
  styleUrls: ['./assign-user-interdiction-filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: DateAdapter, useClass: CustomDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MMM_YYYY_FORMAT }
  ],
})
export class AssignUserInterdictionFilterPanel implements OnInit, OnDestroy {
  @Input() currentFilters: AssignUserInterdictionClassFilterValue | null = null;

  @Output() apply = new EventEmitter<AssignUserInterdictionClassFilterValue>();
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

  private readonly fb = inject(FormBuilder);
  private readonly service = inject(AssignUserInterdictionClassService);
  private readonly cdr = inject(ChangeDetectorRef);

  filterForm!: FormGroup;

  interdictionClassOptions: string[] = [];
  periodOptions: string[] = ['After', 'Before'];

  // Search control and filtered options for Interdiction Class
  interdictionClassSearchControl = new FormControl('');
  filteredInterdictionClassOptions: string[] = [];

  isLoadingFilters = false;

  // Store raw input text to preserve invalid dates
  private effectiveDateRawInput = '';
  private terminationDateRawInput = '';

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.initializeForm();
    this.loadFilters();
    this.setupInterdictionClassSearch();

    // Setup validation listeners for effective date
    this.filterForm.get('effectiveDate')?.valueChanges.subscribe(() => {
      // Mark field as touched when user types to show validation errors
      const control = this.filterForm.get('effectiveDate');
      if (control && !control.touched) {
        control.markAsTouched();
      }
      this.validateEffectiveDatePeriod();
      this.cdr.markForCheck();
    });

    this.filterForm.get('effectiveDatePeriod')?.valueChanges.subscribe(() => {
      this.validateEffectiveDatePeriod();
      this.cdr.markForCheck();
    });

    // Setup validation listeners for termination date
    this.filterForm.get('terminationDate')?.valueChanges.subscribe(() => {
      // Mark field as touched when user types to show validation errors
      const control = this.filterForm.get('terminationDate');
      if (control && !control.touched) {
        control.markAsTouched();
      }
      this.validateTerminationDatePeriod();
      this.cdr.markForCheck();
    });

    this.filterForm.get('terminationDatePeriod')?.valueChanges.subscribe(() => {
      this.validateTerminationDatePeriod();
      this.cdr.markForCheck();
    });

    if (this.currentFilters) {
      this.populateFormWithCurrentFilters();
    }

    // Initial validation check in case filters were pre-populated
    this.validateEffectiveDatePeriod();
    this.validateTerminationDatePeriod();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupInterdictionClassSearch(): void {
    this.interdictionClassSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(searchTerm => {
        const term = (searchTerm as string || '').toLowerCase();
        this.filteredInterdictionClassOptions = this.interdictionClassOptions.filter(option =>
          option.toLowerCase().includes(term)
        );
      });
  }

  private validateEffectiveDatePeriod(): void {
    const effectiveDate = this.filterForm.get('effectiveDate')?.value;
    const effectiveDatePeriod = this.filterForm.get('effectiveDatePeriod')?.value;
    const effectiveDatePeriodControl = this.filterForm.get('effectiveDatePeriod');

    if (effectiveDate && !effectiveDatePeriod) {
      effectiveDatePeriodControl?.setErrors({ required: true });
      effectiveDatePeriodControl?.markAsTouched();
    } else {
      effectiveDatePeriodControl?.setErrors(null);
    }
    this.cdr.markForCheck();
  }

  private validateTerminationDatePeriod(): void {
    const terminationDate = this.filterForm.get('terminationDate')?.value;
    const terminationDatePeriod = this.filterForm.get('terminationDatePeriod')?.value;
    const terminationDatePeriodControl = this.filterForm.get('terminationDatePeriod');

    if (terminationDate && !terminationDatePeriod) {
      terminationDatePeriodControl?.setErrors({ required: true });
      terminationDatePeriodControl?.markAsTouched();
    } else {
      terminationDatePeriodControl?.setErrors(null);
    }
    this.cdr.markForCheck();
  }

  private initializeForm(): void {
    this.filterForm = this.fb.group({
      interClass: [null],
      effectiveDatePeriod: [null],
      effectiveDate: [null, [dateFormatValidator()]],
      terminationDatePeriod: [null],
      terminationDate: [null, [dateFormatValidator()]]
    });
  }

  private loadFilters(): void {
    this.isLoadingFilters = true;

    this.service.getInterdictionClasses()
      .pipe(take(1))
      .subscribe({
        next: (classes) => {
          // Map the InterdictionClassOption[] to string[] of codes
          this.interdictionClassOptions = classes.map(c => c.code);
          this.filteredInterdictionClassOptions = [...this.interdictionClassOptions];

          this.isLoadingFilters = false;

          if (this.currentFilters) {
            this.populateFormWithCurrentFilters();
          }

          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error loading filter options:', error);
          this.isLoadingFilters = false;

          this.interdictionClassOptions = [];
          this.filteredInterdictionClassOptions = [];

          this.cdr.markForCheck();
        }
      });
  }

  private populateFormWithCurrentFilters(): void {
    if (!this.currentFilters) return;

    this.filterForm.patchValue({
      interClass: this.currentFilters.interClass,
      effectiveDatePeriod: this.currentFilters.effectiveDatePeriod,
      effectiveDate: this.currentFilters.effectiveDate,
      terminationDatePeriod: this.currentFilters.terminationDatePeriod,
      terminationDate: this.currentFilters.terminationDate
    });

    this.cdr.markForCheck();
  }

  /**
   * Convert Date to UTC Date at midnight
   * This ensures the selected date is preserved regardless of timezone
   */
  private convertToUTCDate(date: Date | string | null): Date | null {
    if (!date) return null;

    // Convert string to Date if needed
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    // Handle Date objects
    return new Date(Date.UTC(
      dateObj.getFullYear(),
      dateObj.getMonth(),
      dateObj.getDate(),
      0, 0, 0, 0
    ));
  }

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
    this.validateEffectiveDatePeriod();
    this.validateTerminationDatePeriod();

    // Don't apply if there are validation errors
    const effectiveDatePeriodControl = this.filterForm.get('effectiveDatePeriod');
    const terminationDatePeriodControl = this.filterForm.get('terminationDatePeriod');

    if (effectiveDatePeriodControl?.errors || terminationDatePeriodControl?.errors) {
      return;
    }

    const formValue = this.filterForm.value;

    const updatedFilters: AssignUserInterdictionClassFilterValue = {
      interClass: formValue.interClass || null,
      effectiveDatePeriod: formValue.effectiveDatePeriod || null,
      effectiveDate: this.convertToUTCDate(formValue.effectiveDate),
      terminationDatePeriod: formValue.terminationDatePeriod || null,
      terminationDate: this.convertToUTCDate(formValue.terminationDate)
    };

    this.apply.emit(updatedFilters);
  }

  onClear(): void {
    this.filterForm.reset({
      interClass: null,
      effectiveDatePeriod: null,
      effectiveDate: null,
      terminationDatePeriod: null,
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

    const hasEffectivePeriod = formValue.effectiveDatePeriod !== null && formValue.effectiveDatePeriod !== '';
    const hasEffectiveDate = formValue.effectiveDate !== null;
    const hasTerminationPeriod = formValue.terminationDatePeriod !== null && formValue.terminationDatePeriod !== '';
    const hasTerminationDate = formValue.terminationDate !== null;

    // Period without date is incomplete — not a valid filter
    const hasIncompleteEffective = hasEffectivePeriod && !hasEffectiveDate;
    const hasIncompleteTermination = hasTerminationPeriod && !hasTerminationDate;

    // A complete filter requires: interdiction class alone, or period+date together
    const hasAnyCompleteValue =
      (formValue.interClass !== null && formValue.interClass !== '') ||
      (hasEffectiveDate) ||
      (hasTerminationDate);

    // Check for date format validation errors
    const effectiveDateControl = this.filterForm.get('effectiveDate');
    const terminationDateControl = this.filterForm.get('terminationDate');
    const hasDateFormatErrors = !!(
      effectiveDateControl?.hasError('invalidDateFormat') ||
      effectiveDateControl?.hasError('matDatepickerParse') ||
      terminationDateControl?.hasError('invalidDateFormat') ||
      terminationDateControl?.hasError('matDatepickerParse')
    );

    const hasValidationErrors = this.filterForm.invalid || hasDateFormatErrors;

    return !hasAnyCompleteValue || hasIncompleteEffective || hasIncompleteTermination || hasValidationErrors;
  }
}
