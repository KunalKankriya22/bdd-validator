import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  ChangeDetectionStrategy,
  Input,
  ChangeDetectorRef,
  OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DATE_FORMATS, DateAdapter, ErrorStateMatcher, MAT_DATE_LOCALE } from '@angular/material/core';
import { MAT_MOMENT_DATE_ADAPTER_OPTIONS } from '@angular/material-moment-adapter';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { HeaderService } from '@shared/services/header.service';
import moment from 'moment';

import { DD_MON_YYYY_FORMATS, UppercaseMomentDateAdapter } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { HoldDetailsFilterValue, DropdownOption } from '../hold-details-panel.model';

@Component({
  selector: 'app-hold-details-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: UppercaseMomentDateAdapter, deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS] }
  ],
  templateUrl: './hold-details-filter-panel.html',
  styleUrls: ['./hold-details-filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HoldDetailsFilterPanelComponent implements OnInit, OnDestroy {

  @Input() currentFilters: HoldDetailsFilterValue | null = null;
  @Input() section: 'unit' | 'donor' = 'unit';
  @Output() close = new EventEmitter<void>();
  @Output() apply = new EventEmitter<HoldDetailsFilterValue>();

  filterForm!: FormGroup;

  minTerminationDate: Date | null = null;

  entryDatePeriodError = '';
  terminationDatePeriodError = '';

  entryDateErrorMatcher!: ErrorStateMatcher;
  terminationDateErrorMatcher!: ErrorStateMatcher;

  holdOptions: DropdownOption[] = [];
  filteredHoldOptions: DropdownOption[] = [];
  holdSearchControl = new FormControl('');

  private readonly unitHoldOptions: DropdownOption[] = [
    { value: 'Active', label: 'Active Holds' },
    { value: 'All', label: 'All Holds' }
  ];

  private readonly donorHoldOptions: DropdownOption[] = [
    { value: 'All', label: 'All Holds' },
    { value: 'ActiveDonation', label: 'Active Donation Holds' },
    { value: 'AllDonation', label: 'All Donation Holds' }
  ];

  periodOptions: DropdownOption[] = [
    { value: 'before', label: 'Before' },
    { value: 'after', label: 'After' }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private headerService: HeaderService
  ) {}

  ngOnInit(): void {
    this.holdOptions = this.section === 'donor' ? this.donorHoldOptions : this.unitHoldOptions;
    this.filteredHoldOptions = [...this.holdOptions];
    this.initializeForm();
    this.setupErrorMatchers();
    this.setupValidation();
    this.setupHoldSearch();
    this.subscribeToChapterChanges();

    if (this.currentFilters) {
      this.validateEntryDatePeriod();
      this.validateTerminationDatePeriod();
    }
  }

  trackByValue(index: number, option: { value: string }): string {
    return option.value;
  }

  private setupHoldSearch(): void {
    this.holdSearchControl.valueChanges
      .pipe(debounceTime(200), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search || '').toLowerCase();
        if (!term) {
          this.filteredHoldOptions = [...this.holdOptions];
        } else {
          this.filteredHoldOptions = this.holdOptions.filter(o =>
            o.label.toLowerCase().includes(term) || o.value.toLowerCase().includes(term)
          );
        }
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.close.emit();
      });
  }

  private initializeForm(): void {
    this.filterForm = this.fb.group({
      holds: [this.currentFilters?.holds ?? null],
      entryDatePeriod: [this.currentFilters?.entryDatePeriod ?? null],
      entryDate: [this.currentFilters?.entryDate ?? null],
      terminationDatePeriod: [this.currentFilters?.terminationDatePeriod ?? null],
      terminationDate: [this.currentFilters?.terminationDate ?? null]
    });
  }

  private setupErrorMatchers(): void {
    this.entryDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
      () => this.getEntryDateError()
    );
    this.terminationDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
      () => this.getTerminationDateError()
    );
  }

  private setupValidation(): void {
    this.filterForm.get('entryDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const control = this.filterForm.get('entryDate');
        if (control && !control.touched) {
          control.markAsTouched();
        }
        this.validateEntryDatePeriod();
        this.minTerminationDate = control?.value ? moment(control.value).toDate() : null;
        this.cdr.markForCheck();
      });

    this.filterForm.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const control = this.filterForm.get('terminationDate');
        if (control && !control.touched) {
          control.markAsTouched();
        }
        this.validateTerminationDatePeriod();
        this.cdr.markForCheck();
      });

    this.filterForm.get('entryDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateEntryDatePeriod();
        this.cdr.markForCheck();
      });

    this.filterForm.get('terminationDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateTerminationDatePeriod();
        this.cdr.markForCheck();
      });
  }

  private validateEntryDatePeriod(): void {
    const entryDate = this.filterForm.get('entryDate')?.value;
    const entryDatePeriod = this.filterForm.get('entryDatePeriod')?.value;

    if (entryDate && (!entryDatePeriod || entryDatePeriod === '')) {
      this.entryDatePeriodError = 'Period is required';
    } else {
      this.entryDatePeriodError = '';
    }
  }

  private validateTerminationDatePeriod(): void {
    const terminationDate = this.filterForm.get('terminationDate')?.value;
    const terminationDatePeriod = this.filterForm.get('terminationDatePeriod')?.value;

    if (terminationDate && (!terminationDatePeriod || terminationDatePeriod === '')) {
      this.terminationDatePeriodError = 'Period is required';
    } else {
      this.terminationDatePeriodError = '';
    }
  }

  getEntryDateError(): string {
    return DateFieldValidationUtility.getDateErrorMessage(
      this.filterForm.get('entryDate'),
      null,
      'Entry Date'
    );
  }

  getTerminationDateError(): string {
    return DateFieldValidationUtility.getDateErrorMessage(
      this.filterForm.get('terminationDate'),
      null,
      'Termination Date'
    );
  }

  get isApplyDisabled(): boolean {
    if (this.entryDatePeriodError || this.terminationDatePeriodError) {
      return true;
    }

    if (this.getEntryDateError() || this.getTerminationDateError()) {
      return true;
    }

    const v = this.filterForm.getRawValue();
    const hasHolds = !!v.holds;
    const hasEntryDate = !!v.entryDatePeriod && !!v.entryDate;
    const hasTerminationDate = !!v.terminationDatePeriod && !!v.terminationDate;
    return !hasHolds && !hasEntryDate && !hasTerminationDate;
  }

  onApply(): void {
    const formValue = this.filterForm.getRawValue();

    const filters: HoldDetailsFilterValue = {
      holds: formValue.holds ?? undefined,
      entryDatePeriod: formValue.entryDatePeriod ?? undefined,
      entryDate: formValue.entryDate ?? undefined,
      terminationDatePeriod: formValue.terminationDatePeriod ?? undefined,
      terminationDate: formValue.terminationDate ?? undefined
    };

    this.apply.emit(filters);
  }

  onClear(): void {
    this.filterForm.reset({
      holds: null,
      entryDatePeriod: null,
      entryDate: null,
      terminationDatePeriod: null,
      terminationDate: null
    });
    this.holdSearchControl.reset('');
    this.filteredHoldOptions = [...this.holdOptions];
    this.entryDatePeriodError = '';
    this.terminationDatePeriodError = '';
    this.minTerminationDate = null;
    this.cdr.markForCheck();
  }

  onClose(): void {
    this.close.emit();
  }

  onEntryDateInput(event: Event): void {
    const inputValue = (event.target as HTMLInputElement).value;
    DateFieldValidationUtility.handleEndDateInput(inputValue, this.filterForm.get('entryDate'));
    this.cdr.markForCheck();
  }

  onTerminationDateInput(event: Event): void {
    const inputValue = (event.target as HTMLInputElement).value;
    DateFieldValidationUtility.handleEndDateInput(inputValue, this.filterForm.get('terminationDate'));
    this.cdr.markForCheck();
  }

  onEntryDateBlur(): void {
    const control = this.filterForm.get('entryDate');
    if (control?.value && control.valid) {
      control.setValue(control.value, { emitEvent: false });
      control.updateValueAndValidity();
    }
  }

  onTerminationDateBlur(): void {
    const control = this.filterForm.get('terminationDate');
    if (control?.value && control.valid) {
      control.setValue(control.value, { emitEvent: false });
      control.updateValueAndValidity();
    }
  }
}
