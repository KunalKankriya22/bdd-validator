import { Component, OnInit, Inject, OnDestroy, ViewChild, ElementRef, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { CustomDateAdapter, DD_MMM_YYYY_FORMAT, dateFormatValidator } from 'src/app/core/utils/date-adapter.util';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { AssociateNicknameFilter } from '../models/associate-nickname-to-name.model';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-filter-associate-nickname',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatIconModule,
    MatSelectModule,
  ],
  templateUrl: './filter-associate-nickname.html',
  styleUrls: ['./filter-associate-nickname.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: DateAdapter, useClass: CustomDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MMM_YYYY_FORMAT }
  ],
})
export class FilterAssociateNicknameComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('filterTitle') filterTitle!: ElementRef;

  filterForm!: FormGroup;

  periodOptions: { value: 'BEFORE' | 'AFTER'; label: string }[] = [
    { value: 'BEFORE', label: 'Before' },
    { value: 'AFTER', label: 'After' }
  ];

  showEffectiveDatePeriodError = false;
  showTerminationDatePeriodError = false;

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.effDateError);
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.termDateError);

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    public dialogRef: MatDialogRef<FilterAssociateNicknameComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AssociateNicknameFilter
  ) {}

  ngAfterViewInit(): void {
    // Set focus to the title instead of the close button to prevent highlight on open
    setTimeout(() => {
      if (this.filterTitle) {
        this.filterTitle.nativeElement.focus();
      }
    }, 0);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit(): void {
    // Get initial period and date values from existing filter
    const effDateType = this.data?.effectivePeriod || null;
    const termDateType = this.data?.terminationPeriod || null;

    const effDate = this.data?.effectiveDate ? new Date(this.data.effectiveDate) : null;
    const termDate = this.data?.terminationDate ? new Date(this.data.terminationDate) : null;

    this.filterForm = this.fb.group({
      effDateType: [effDateType],
      effDate: [effDate, [dateFormatValidator()]],
      termDateType: [termDateType],
      termDate: [termDate, [dateFormatValidator()]],
    });

    // Setup validation listeners for effective date
    this.filterForm.get('effDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.filterForm.get('effDateType')?.markAsTouched();
        this.showEffectiveDatePeriodError = false;
        this.cdr.markForCheck();
      });

    this.filterForm.get('effDate')?.statusChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.cdr.markForCheck());

    this.filterForm.get('effDateType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.showEffectiveDatePeriodError = false;
        this.cdr.markForCheck();
      });

    // Setup validation listeners for termination date
    this.filterForm.get('termDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.filterForm.get('termDateType')?.markAsTouched();
        this.showTerminationDatePeriodError = false;
        this.cdr.markForCheck();
      });

    this.filterForm.get('termDate')?.statusChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.cdr.markForCheck());

    this.filterForm.get('termDateType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.showTerminationDatePeriodError = false;
        this.cdr.markForCheck();
      });
  }

  get effDateError(): string {
    const control = this.filterForm?.get('effDate');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('matDatepickerParse') || control.hasError('invalidDateFormat') || control.hasError('invalidDate')) return 'Invalid date';
    return '';
  }

  get termDateError(): string {
    const control = this.filterForm?.get('termDate');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('matDatepickerParse') || control.hasError('invalidDateFormat') || control.hasError('invalidDate')) return 'Invalid date';
    return '';
  }

  get effDatePeriodRequired(): boolean {
    const date = this.filterForm?.get('effDate')?.value;
    const period = this.filterForm?.get('effDateType')?.value;
    return !!date && !period;
  }

  get termDatePeriodRequired(): boolean {
    const date = this.filterForm?.get('termDate')?.value;
    const period = this.filterForm?.get('termDateType')?.value;
    return !!date && !period;
  }

  get isApplyDisabled(): boolean {
    // Check if there are validation errors (date without period)
    if (this.effDatePeriodRequired || this.termDatePeriodRequired) {
      return true;
    }

    // Check if period is selected without a corresponding date
    const formValue = this.filterForm.value;
    if (formValue.effDateType && !formValue.effDate) {
      return true;
    }
    if (formValue.termDateType && !formValue.termDate) {
      return true;
    }

    // Check for date format validation errors
    const effDateControl = this.filterForm.get('effDate');
    const termDateControl = this.filterForm.get('termDate');
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

    // Check if at least one complete filter pair has a value
    const hasAnyValue = (formValue.effDate && formValue.effDateType) || (formValue.termDate && formValue.termDateType);

    return !hasAnyValue;
  }

  onApply(): void {
    const formValue = this.filterForm.value;

    // Check for period validation errors
    this.showEffectiveDatePeriodError = !!(formValue.effDate && !formValue.effDateType);
    this.showTerminationDatePeriodError = !!(formValue.termDate && !formValue.termDateType);

    // If there are validation errors, stop here
    if (this.showEffectiveDatePeriodError || this.showTerminationDatePeriodError) {
      return;
    }

    const filters: AssociateNicknameFilter = {};

    // Handle Effective Date with Period
    if (formValue.effDate && formValue.effDateType) {
      const effDate = new Date(formValue.effDate);
      filters.effectiveDate = new Date(Date.UTC(
        effDate.getFullYear(),
        effDate.getMonth(),
        effDate.getDate(),
        0, 0, 0, 0
      )).toISOString();
      filters.effectivePeriod = formValue.effDateType;
    }

    // Handle Termination Date with Period
    if (formValue.termDate && formValue.termDateType) {
      const termDate = new Date(formValue.termDate);
      filters.terminationDate = new Date(Date.UTC(
        termDate.getFullYear(),
        termDate.getMonth(),
        termDate.getDate(),
        0, 0, 0, 0
      )).toISOString();
      filters.terminationPeriod = formValue.termDateType;
    }

    this.dialogRef.close(filters);
  }

  onClearAll(): void {
    this.filterForm.reset();
    this.showEffectiveDatePeriodError = false;
    this.showTerminationDatePeriodError = false;
  }

  onClose(): void {
    this.dialogRef.close(null);
  }

  onEffectiveDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value, this.filterForm.get('effDate')
    );
    this.cdr.markForCheck();
  }

  onTerminationDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value, this.filterForm.get('termDate')
    );
    this.cdr.markForCheck();
  }
}
