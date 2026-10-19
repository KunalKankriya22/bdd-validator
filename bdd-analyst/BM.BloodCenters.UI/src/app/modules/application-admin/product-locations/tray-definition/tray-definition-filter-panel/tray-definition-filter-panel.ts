import { Component, OnInit, OnDestroy, Output, EventEmitter, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { dateFormatValidator } from 'src/app/core/utils/date-adapter.util';
import moment from 'moment';
import { Subject, takeUntil } from 'rxjs';

import { TrayDefinitionFilterValue, TrayStatusLovDto } from '../models/tray-definition.model';
import { TrayDefinitionService } from '../services/tray-definition.service';

@Component({
  selector: 'app-tray-definition-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './tray-definition-filter-panel.html',
  styleUrls: ['./tray-definition-filter-panel.scss']
})
export class TrayDefinitionFilterPanel implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly trayDefinitionService = inject(TrayDefinitionService);
  private readonly destroy$ = new Subject<void>();

  @Input() currentFilters: TrayDefinitionFilterValue | null = null;

  @Output() apply = new EventEmitter<TrayDefinitionFilterValue>();
  @Output() close = new EventEmitter<void>();

  // Unique ID generation for accessibility
  private static nextId = 0;
  protected readonly componentId = `tray-definition-filter-${TrayDefinitionFilterPanel.nextId++}`;

  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  filterForm!: FormGroup;
  trayStatusOptions: TrayStatusLovDto[] = [];
  isLoadingOptions = false;

  effDatePeriodRequired = false;
  termDatePeriodRequired = false;

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEffDateError());
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTermDateError());

  // Period options
  protected readonly periodOptions = [
    { value: 'After', label: 'After' },
    { value: 'Before', label: 'Before' }
  ];

  ngOnInit(): void {
    this.initForm();
    this.loadTrayStatusOptions();
    this.setupDatePeriodValidation();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.filterForm = this.fb.group({
      trayStatus: [this.currentFilters?.trayStatus || null],
      effectiveDatePeriod: [this.currentFilters?.effectiveDatePeriod || null],
      effectiveDate: [
        this.currentFilters?.effectiveDate ? moment(this.currentFilters.effectiveDate) : null,
        [dateFormatValidator(), DateFieldValidationUtility.validDateValidator()]
      ],
      terminationDatePeriod: [this.currentFilters?.terminationDatePeriod || null],
      terminationDate: [
        this.currentFilters?.terminationDate ? moment(this.currentFilters.terminationDate) : null,
        [dateFormatValidator(), DateFieldValidationUtility.validDateValidator()]
      ]
    });
  }

  private setupDatePeriodValidation(): void {
    this.filterForm.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.validateEffDatePeriod());

    this.filterForm.get('effectiveDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.validateEffDatePeriod());

    this.filterForm.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.validateTermDatePeriod());

    this.filterForm.get('terminationDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.validateTermDatePeriod());
  }

  validateEffDatePeriod(): void {
    const dateControl = this.filterForm.get('effectiveDate');
    const periodControl = this.filterForm.get('effectiveDatePeriod');
    const date = dateControl?.value;
    const period = periodControl?.value;
    this.effDatePeriodRequired = !!date && !period;

    if (this.effDatePeriodRequired) {
      periodControl?.setErrors({ required: true });
      periodControl?.markAsTouched();
    } else {
      periodControl?.setErrors(null);
    }
  }

  validateTermDatePeriod(): void {
    const dateControl = this.filterForm.get('terminationDate');
    const periodControl = this.filterForm.get('terminationDatePeriod');
    const date = dateControl?.value;
    const period = periodControl?.value;
    this.termDatePeriodRequired = !!date && !period;

    if (this.termDatePeriodRequired) {
      periodControl?.setErrors({ required: true });
      periodControl?.markAsTouched();
    } else {
      periodControl?.setErrors(null);
    }
  }

  private loadTrayStatusOptions(): void {
    this.isLoadingOptions = true;
    this.trayDefinitionService.getTrayStatusLov()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (options) => {
          this.trayStatusOptions = options;
          this.isLoadingOptions = false;
        },
        error: (error) => {
          console.error('Error loading tray status options:', error);
          this.isLoadingOptions = false;
        }
      });
  }

  get isApplyDisabled(): boolean {
    // Disable if date is selected but period is not
    if (this.effDatePeriodRequired || this.termDatePeriodRequired) return true;

    // Disable if there are date validation errors
    if (this.getEffDateError() || this.getTermDateError()) return true;

    // Disable if no filter is selected
    const fv = this.filterForm.value;
    const hasFilters = fv.trayStatus || fv.effectiveDate || fv.terminationDate;
    return !hasFilters;
  }

  getEffDateError(): string {
    const control = this.filterForm?.get('effectiveDate');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('matDatepickerParse') || control.hasError('invalidDateFormat') || control.hasError('invalidDate')) {
      return 'Effective Date is invalid';
    }
    return '';
  }

  getTermDateError(): string {
    const control = this.filterForm?.get('terminationDate');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('matDatepickerParse') || control.hasError('invalidDateFormat') || control.hasError('invalidDate')) {
      return 'Termination Date is invalid';
    }
    return '';
  }

  onEffDateInput(event: Event): void {
    const inputValue = (event.target as HTMLInputElement).value;
    const control = this.filterForm.get('effectiveDate');
    if (!control) return;
    if (!inputValue?.trim()) {
      control.setValue(null, { emitEvent: false });
      control.setErrors(null);
      control.markAsPristine();
      control.markAsUntouched();
      control.updateValueAndValidity();
    } else {
      control.markAsTouched();
      control.markAsDirty();
      if (!control.value) {
        control.setErrors({ invalidDate: true });
      }
    }
  }

  onTermDateInput(event: Event): void {
    const inputValue = (event.target as HTMLInputElement).value;
    const control = this.filterForm.get('terminationDate');
    if (!control) return;
    if (!inputValue?.trim()) {
      control.setValue(null, { emitEvent: false });
      control.setErrors(null);
      control.markAsPristine();
      control.markAsUntouched();
      control.updateValueAndValidity();
    } else {
      control.markAsTouched();
      control.markAsDirty();
      if (!control.value) {
        control.setErrors({ invalidDate: true });
      }
    }
  }

  onApply(): void {
    const formValue = this.filterForm.value;
    const filters: TrayDefinitionFilterValue = {
      trayStatus: formValue.trayStatus || null,
      effectiveDatePeriod: formValue.effectiveDate ? formValue.effectiveDatePeriod : null,
      effectiveDate: formValue.effectiveDate || null,
      terminationDatePeriod: formValue.terminationDate ? formValue.terminationDatePeriod : null,
      terminationDate: formValue.terminationDate || null
    };

    this.apply.emit(filters);
  }

  onClearAll(): void {
    this.filterForm.reset({
      trayStatus: null,
      effectiveDatePeriod: null,
      effectiveDate: null,
      terminationDatePeriod: null,
      terminationDate: null
    });
    this.effDatePeriodRequired = false;
    this.termDatePeriodRequired = false;
  }

  onClose(): void {
    this.close.emit();
  }

  hasActiveFilters(): boolean {
    const value = this.filterForm.value;
    return !!(value.trayStatus || value.effectiveDate || value.terminationDate);
  }
}
