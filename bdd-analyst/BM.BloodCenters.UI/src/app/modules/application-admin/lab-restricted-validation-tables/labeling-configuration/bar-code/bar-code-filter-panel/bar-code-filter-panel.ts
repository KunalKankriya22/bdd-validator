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
import { A11yModule } from '@angular/cdk/a11y';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MAT_DATE_FORMATS, DateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';
import { dateFormatValidator } from 'src/app/core/utils/date-adapter.util';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { Subject, takeUntil } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { BarCodeFilterValue } from '../models/bar-code.model';
import { LabelingFilterDataService } from '../../services/labeling-filter-data.service';

@Component({
  selector: 'app-bar-code-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    A11yModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    NgxMatSelectSearchModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatInputModule
  ],
  templateUrl: './bar-code-filter-panel.html',
  styleUrls: ['./bar-code-filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }
  ]
})
export class BarCodeFilterPanel implements OnInit, OnDestroy {
  @Input() currentFilters: BarCodeFilterValue | null = null;
  @Output() apply = new EventEmitter<BarCodeFilterValue>();
  @Output() close = new EventEmitter<void>();

  filterForm!: FormGroup;

  allTestIdOptions: { value: string; display: string }[] = [];
  testIdOptions: { value: string; display: string }[] = [];
  testIdSearchControl = new FormControl('');

  resultCodeOptions: { value: string; display: string }[] = [
    { value: 'N', display: 'Negative' },
    { value: 'P', display: 'Positive' }
  ];

  periodOptions: { value: string; display: string }[] = [
    { value: 'after', display: 'After' },
    { value: 'before', display: 'Before' }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private filterDataService: LabelingFilterDataService
  ) { }

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      testId: [this.currentFilters?.testId || null],
      resultCode: [this.currentFilters?.resultCode || null],
      effectiveDatePeriod: [this.currentFilters?.effectiveDatePeriod || null],
      effectiveDate: [
        this.currentFilters?.effectiveDate ? new Date(this.currentFilters.effectiveDate) : null,
        [dateFormatValidator()]
      ],
      terminationDatePeriod: [this.currentFilters?.terminationDatePeriod || null],
      terminationDate: [
        this.currentFilters?.terminationDate ? new Date(this.currentFilters.terminationDate) : null,
        [dateFormatValidator()]
      ]
    });

    this.buildTestIdOptionsFromTableData();
    this.setupTestIdSearch();
    this.setupValidation();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupValidation(): void {
    // Watch effective date changes
    this.filterForm.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateEffectiveDatePeriod();
        this.cdr.markForCheck();
      });

    // Watch effective date period changes
    this.filterForm.get('effectiveDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateEffectiveDatePeriod();
        this.cdr.markForCheck();
      });

    // Watch termination date changes
    this.filterForm.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateTerminationDatePeriod();
        this.cdr.markForCheck();
      });

    // Watch termination date period changes
    this.filterForm.get('terminationDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateTerminationDatePeriod();
        this.cdr.markForCheck();
      });
  }

  private validateEffectiveDatePeriod(): void {
    const effectiveDate = this.filterForm.get('effectiveDate')?.value;
    const effectiveDatePeriod = this.filterForm.get('effectiveDatePeriod')?.value;
    const control = this.filterForm.get('effectiveDatePeriod');

    if (effectiveDate && !effectiveDatePeriod) {
      control?.setErrors({ required: true });
      control?.markAsTouched();
    } else {
      control?.setErrors(null);
    }
  }

  private validateTerminationDatePeriod(): void {
    const terminationDate = this.filterForm.get('terminationDate')?.value;
    const terminationDatePeriod = this.filterForm.get('terminationDatePeriod')?.value;
    const control = this.filterForm.get('terminationDatePeriod');

    if (terminationDate && !terminationDatePeriod) {
      control?.setErrors({ required: true });
      control?.markAsTouched();
    } else {
      control?.setErrors(null);
    }
  }

  onDateInput(event: Event, controlName: string): void {
    const inputValue = (event.target as HTMLInputElement).value;
    const control = this.filterForm.get(controlName);
    if (!control) return;

    control.markAsTouched();
    control.markAsDirty();

    if (!inputValue?.trim()) {
      control.setErrors(null);
    } else if (!control.value) {
      control.setErrors({ invalidDate: true });
    }

    this.cdr.markForCheck();
  }

  getEffectiveDateError(): string {
    return DateFieldValidationUtility.getDateErrorMessage(
      this.filterForm.get('effectiveDate'), null, 'Effective Date'
    );
  }

  getTerminationDateError(): string {
    return DateFieldValidationUtility.getDateErrorMessage(
      this.filterForm.get('terminationDate'), null, 'Termination Date'
    );
  }

  getEffectiveDatePeriodError(): string {
    const control = this.filterForm.get('effectiveDatePeriod');
    if (control?.hasError('required') && control?.touched) {
      return 'Period is required';
    }
    return '';
  }

  getTerminationDatePeriodError(): string {
    const control = this.filterForm.get('terminationDatePeriod');
    if (control?.hasError('required') && control?.touched) {
      return 'Period is required';
    }
    return '';
  }

  private buildTestIdOptionsFromTableData(): void {
    const data = this.filterDataService.getData('bar-code');
    const uniqueTestIds = [...new Set(
      data
        .map((item: any) => item.testId)
        .filter((id: string | undefined): id is string => !!id)
    )].sort();

    this.allTestIdOptions = uniqueTestIds.map(id => ({ value: id, display: id }));
    this.testIdOptions = [...this.allTestIdOptions];
  }

  private setupTestIdSearch(): void {
    this.testIdSearchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(search => {
        if (search && search.length >= 1) {
          this.testIdOptions = this.allTestIdOptions.filter(o =>
            o.display.toLowerCase().includes(search.toLowerCase())
          );
        } else {
          this.testIdOptions = [...this.allTestIdOptions];
        }
        this.cdr.markForCheck();
      });
  }

  onApply(): void {
    if (this.isApplyDisabled) {
      return;
    }

    const formValue = this.filterForm.value;

    const filters: BarCodeFilterValue = {
      testId: formValue.testId || null,
      resultCode: formValue.resultCode || null,
      effectiveDatePeriod: formValue.effectiveDatePeriod || null,
      effectiveDate: formValue.effectiveDate || null,
      terminationDatePeriod: formValue.terminationDatePeriod || null,
      terminationDate: formValue.terminationDate || null
    };

    this.apply.emit(filters);
  }

  onClear(): void {
    this.filterForm.reset({
      testId: null,
      resultCode: null,
      effectiveDatePeriod: null,
      effectiveDate: null,
      terminationDatePeriod: null,
      terminationDate: null
    });
  }

  onClose(): void {
    this.close.emit();
  }

  get isApplyDisabled(): boolean {
    const formValue = this.filterForm.value;

    // Check if at least one complete filter is set
    // Period alone does not count — must have a date paired with it
    const hasAnyValue = formValue.testId !== null ||
                        formValue.resultCode !== null ||
                        (formValue.effectiveDatePeriod !== null && formValue.effectiveDate !== null) ||
                        (formValue.terminationDatePeriod !== null && formValue.terminationDate !== null);

    // Disable if no complete filters OR if there are validation errors
    return !hasAnyValue || this.hasValidationErrors;
  }

  get hasValidationErrors(): boolean {
    const effectiveDateControl = this.filterForm.get('effectiveDate');
    const terminationDateControl = this.filterForm.get('terminationDate');
    const effectiveDateHasError = effectiveDateControl?.hasError('invalidDateFormat') ||
                                  effectiveDateControl?.hasError('invalidDate') ||
                                  effectiveDateControl?.hasError('matDatepickerParse');
    const terminationDateHasError = terminationDateControl?.hasError('invalidDateFormat') ||
                                    terminationDateControl?.hasError('invalidDate') ||
                                    terminationDateControl?.hasError('matDatepickerParse');

    return this.filterForm.get('effectiveDatePeriod')?.invalid ||
           this.filterForm.get('terminationDatePeriod')?.invalid ||
           effectiveDateHasError ||
           terminationDateHasError ||
           false;
  }
}
