import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { dateFormatValidator } from 'src/app/core/utils/date-adapter.util';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import moment from 'moment';
import { Subject, takeUntil } from 'rxjs';

import { HHTemplateFilterValue, DropdownOption } from '../../models/health-history.model';

@Component({
  selector: 'app-hh-templates-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDatepickerModule,
    MatIconModule,
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './hh-templates-filter-panel.html',
  styleUrls: ['./hh-templates-filter-panel.scss']
})
export class HHTemplatesFilterPanel implements OnInit, OnDestroy {
  @Input() currentFilters: HHTemplateFilterValue | null = null;
  @Input() donationTypes: DropdownOption[] = [];
  @Output() apply = new EventEmitter<HHTemplateFilterValue>();
  @Output() clearAll = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  filterForm!: FormGroup;
  effDatePeriodRequired = false;
  termDatePeriodRequired = false;

  donationTypeSearchControl = new FormControl('');
  filteredDonationTypes: DropdownOption[] = [];

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEffDateError());
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTermDateError());

  private destroy$ = new Subject<void>();

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.filteredDonationTypes = this.donationTypes;

    this.filterForm = this.fb.group({
      status: [this.currentFilters?.status || null],
      donationType: [this.currentFilters?.donationType || null],
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

    this.donationTypeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => this.filterDonationTypesList(search || ''));

    this.setupDatePeriodValidation();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private filterDonationTypesList(search: string): void {
    if (!search) {
      this.filteredDonationTypes = this.donationTypes;
      return;
    }
    const lower = search.toLowerCase();
    this.filteredDonationTypes = this.donationTypes.filter(dt =>
      dt.code.toLowerCase().includes(lower) ||
      dt.description.toLowerCase().includes(lower)
    );
  }

  onSelectOpenedChange(isOpen: boolean): void {
    if (!isOpen) {
      this.donationTypeSearchControl.setValue('');
    }
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
    const date = this.filterForm.get('effectiveDate')?.value;
    const period = this.filterForm.get('effectiveDatePeriod')?.value;
    this.effDatePeriodRequired = !!date && !period;
  }

  validateTermDatePeriod(): void {
    const date = this.filterForm.get('terminationDate')?.value;
    const period = this.filterForm.get('terminationDatePeriod')?.value;
    this.termDatePeriodRequired = !!date && !period;
  }

  get isApplyDisabled(): boolean {
    if (this.effDatePeriodRequired || this.termDatePeriodRequired) return true;
    if (this.getEffDateError() || this.getTermDateError()) return true;

    const fv = this.filterForm.value;
    const hasFilters = fv.status || fv.donationType || fv.effectiveDate || fv.terminationDate;
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
    const filters: HHTemplateFilterValue = {};

    if (formValue.status) filters.status = formValue.status;
    if (formValue.donationType) filters.donationType = formValue.donationType;
    if (formValue.effectiveDate) {
      filters.effectiveDatePeriod = formValue.effectiveDatePeriod;
      filters.effectiveDate = moment(formValue.effectiveDate).format('YYYY-MM-DD');
    }
    if (formValue.terminationDate) {
      filters.terminationDatePeriod = formValue.terminationDatePeriod;
      filters.terminationDate = moment(formValue.terminationDate).format('YYYY-MM-DD');
    }

    this.apply.emit(filters);
  }

  onClear(): void {
    this.filterForm.reset();
    this.effDatePeriodRequired = false;
    this.termDatePeriodRequired = false;
  }

  onClose(): void {
    this.close.emit();
  }
}
