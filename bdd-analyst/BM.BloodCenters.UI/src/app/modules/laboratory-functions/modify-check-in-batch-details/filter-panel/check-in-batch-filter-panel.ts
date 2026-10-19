import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Input,
  inject,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';
import moment from 'moment';
import { FormControl } from '@angular/forms';

import {
  CheckInBatchFilterValue,
  ProductTypeOption,
  CheckInUserOption,
} from '../models/modify-check-in-batch.model';

@Component({
  selector: 'app-check-in-batch-filter-panel',
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
    NgxMatSelectSearchModule,
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
  ],
  templateUrl: './check-in-batch-filter-panel.html',
  styleUrls: ['./check-in-batch-filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckInBatchFilterPanel implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  @ViewChild('shippedDateInput') shippedDateInput?: ElementRef<HTMLInputElement>;
  @ViewChild('receivedDateInput') receivedDateInput?: ElementRef<HTMLInputElement>;
  @ViewChild('qcDateInput') qcDateInput?: ElementRef<HTMLInputElement>;
  @ViewChild('batchDateInput') batchDateInput?: ElementRef<HTMLInputElement>;

  @Input() currentFilters: CheckInBatchFilterValue | null = null;
  @Input() productTypeOptions: ProductTypeOption[] = [];
  @Input() checkInUserOptions: CheckInUserOption[] = [];
  @Output() apply = new EventEmitter<CheckInBatchFilterValue>();
  @Output() close = new EventEmitter<void>();

  filterForm!: FormGroup;
  productTypeFilterCtrl = new FormControl('');
  filteredProductTypeOptions: ProductTypeOption[] = [];

  periodOptions = [
    { value: 'After', display: 'After' },
    { value: 'Before', display: 'Before' },
  ];

  private shippedDateRawInput = '';
  private receivedDateRawInput = '';
  private qcDateRawInput = '';
  private batchDateRawInput = '';

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      checkinUserId: [this.currentFilters?.checkinUserId || null],
      productType: [this.currentFilters?.productType || null],
      shippedDatePeriod: [this.currentFilters?.shippedDatePeriod || null],
      shippedDate: [this.currentFilters?.shippedDate || null],
      receivedDatePeriod: [this.currentFilters?.receivedDatePeriod || null],
      receivedDate: [this.currentFilters?.receivedDate || null],
      qcDatePeriod: [this.currentFilters?.qcDatePeriod || null],
      qcDate: [this.currentFilters?.qcDate || null],
      batchDatePeriod: [this.currentFilters?.batchDatePeriod || null],
      batchDate: [this.currentFilters?.batchDate || null],
    });

    this.filteredProductTypeOptions = [...this.productTypeOptions];
    this.productTypeFilterCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        if (!search) {
          this.filteredProductTypeOptions = [...this.productTypeOptions];
        } else {
          const s = search.toLowerCase();
          this.filteredProductTypeOptions = this.productTypeOptions.filter(
            o => o.productType.toLowerCase().includes(s)
          );
        }
      });

    this.setupDateValidation();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupDateValidation(): void {
    this.filterForm.get('shippedDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.validateShippedDatePeriod());

    this.filterForm.get('shippedDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.validateShippedDatePeriod());

    this.filterForm.get('receivedDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.validateReceivedDatePeriod());

    this.filterForm.get('receivedDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.validateReceivedDatePeriod());

    this.filterForm.get('qcDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.validateQcDatePeriod());

    this.filterForm.get('qcDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.validateQcDatePeriod());

    this.filterForm.get('batchDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.validateBatchDatePeriod());

    this.filterForm.get('batchDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.validateBatchDatePeriod());
  }

  private validateShippedDatePeriod(): void {
    const date = this.filterForm.get('shippedDate')?.value;
    const period = this.filterForm.get('shippedDatePeriod')?.value;
    const periodControl = this.filterForm.get('shippedDatePeriod');
    const dateControl = this.filterForm.get('shippedDate');

    if (date && !period) {
      periodControl?.setErrors({ required: true });
      periodControl?.markAsTouched();
    } else {
      periodControl?.setErrors(null);
    }

    if (period && !date && !dateControl?.hasError('invalidDate')) {
      dateControl?.setErrors({ required: true });
      dateControl?.markAsTouched();
    } else if (dateControl?.hasError('required')) {
      const { required, ...rest } = dateControl.errors || {};
      dateControl?.setErrors(Object.keys(rest).length ? rest : null);
    }
  }

  private validateReceivedDatePeriod(): void {
    const date = this.filterForm.get('receivedDate')?.value;
    const period = this.filterForm.get('receivedDatePeriod')?.value;
    const periodControl = this.filterForm.get('receivedDatePeriod');
    const dateControl = this.filterForm.get('receivedDate');

    if (date && !period) {
      periodControl?.setErrors({ required: true });
      periodControl?.markAsTouched();
    } else {
      periodControl?.setErrors(null);
    }

    if (period && !date && !dateControl?.hasError('invalidDate')) {
      dateControl?.setErrors({ required: true });
      dateControl?.markAsTouched();
    } else if (dateControl?.hasError('required')) {
      const { required, ...rest } = dateControl.errors || {};
      dateControl?.setErrors(Object.keys(rest).length ? rest : null);
    }
  }

  private validateQcDatePeriod(): void {
    const date = this.filterForm.get('qcDate')?.value;
    const period = this.filterForm.get('qcDatePeriod')?.value;
    const periodControl = this.filterForm.get('qcDatePeriod');
    const dateControl = this.filterForm.get('qcDate');

    if (date && !period) {
      periodControl?.setErrors({ required: true });
      periodControl?.markAsTouched();
    } else {
      periodControl?.setErrors(null);
    }

    if (period && !date && !dateControl?.hasError('invalidDate')) {
      dateControl?.setErrors({ required: true });
      dateControl?.markAsTouched();
    } else if (dateControl?.hasError('required')) {
      const { required, ...rest } = dateControl.errors || {};
      dateControl?.setErrors(Object.keys(rest).length ? rest : null);
    }
  }

  private validateBatchDatePeriod(): void {
    const date = this.filterForm.get('batchDate')?.value;
    const period = this.filterForm.get('batchDatePeriod')?.value;
    const periodControl = this.filterForm.get('batchDatePeriod');
    const dateControl = this.filterForm.get('batchDate');

    if (date && !period) {
      periodControl?.setErrors({ required: true });
      periodControl?.markAsTouched();
    } else {
      periodControl?.setErrors(null);
    }

    if (period && !date && !dateControl?.hasError('invalidDate')) {
      dateControl?.setErrors({ required: true });
      dateControl?.markAsTouched();
    } else if (dateControl?.hasError('required')) {
      const { required, ...rest } = dateControl.errors || {};
      dateControl?.setErrors(Object.keys(rest).length ? rest : null);
    }
  }

  get isApplyDisabled(): boolean {
    if (this.filterForm.invalid) return true;

    const values = this.filterForm.value;

    if ((values.shippedDate && !values.shippedDatePeriod) || (!values.shippedDate && values.shippedDatePeriod)) return true;
    if ((values.receivedDate && !values.receivedDatePeriod) || (!values.receivedDate && values.receivedDatePeriod)) return true;
    if ((values.qcDate && !values.qcDatePeriod) || (!values.qcDate && values.qcDatePeriod)) return true;
    if ((values.batchDate && !values.batchDatePeriod) || (!values.batchDate && values.batchDatePeriod)) return true;

    const hasFilters =
      values.checkinUserId ||
      values.productType ||
      (values.shippedDate && values.shippedDatePeriod) ||
      (values.receivedDate && values.receivedDatePeriod) ||
      (values.qcDate && values.qcDatePeriod) ||
      (values.batchDate && values.batchDatePeriod);

    return !hasFilters;
  }

  onApply(): void {
    if (this.isApplyDisabled) return;

    const values = this.filterForm.value;
    const filters: CheckInBatchFilterValue = {};

    if (values.checkinUserId) filters.checkinUserId = values.checkinUserId;
    if (values.productType) filters.productType = values.productType;

    if (values.shippedDate && values.shippedDatePeriod) {
      filters.shippedDate = moment(values.shippedDate);
      filters.shippedDatePeriod = values.shippedDatePeriod;
    }

    if (values.receivedDate && values.receivedDatePeriod) {
      filters.receivedDate = moment(values.receivedDate);
      filters.receivedDatePeriod = values.receivedDatePeriod;
    }

    if (values.qcDate && values.qcDatePeriod) {
      filters.qcDate = moment(values.qcDate);
      filters.qcDatePeriod = values.qcDatePeriod;
    }

    if (values.batchDate && values.batchDatePeriod) {
      filters.batchDate = moment(values.batchDate);
      filters.batchDatePeriod = values.batchDatePeriod;
    }

    this.apply.emit(filters);
  }

  onClearAll(): void {
    this.filterForm.reset();
    this.cdr.markForCheck();
  }

  onClose(): void {
    this.close.emit();
  }

  // --- Shipped Date input/blur/error ---

  onShippedDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.shippedDateRawInput = input.value.trim();
    const control = this.filterForm.get('shippedDate');
    if (!control) return;
    control.markAsDirty();
    control.markAsTouched();
    setTimeout(() => {
      if (this.shippedDateRawInput && !control.value) {
        control.setErrors({ ...control.errors, invalidDate: true });
      }
    }, 0);
  }

  onShippedDateBlur(input: HTMLInputElement): void {
    setTimeout(() => {
      const control = this.filterForm.get('shippedDate');
      if (!control) return;
      control.markAsTouched();
      const controlValue = control.value;
      const inputValue = input.value.trim();

      if (controlValue && typeof controlValue === 'object' && controlValue.isValid && controlValue.isValid()) {
        const formattedDate = DateFieldValidationUtility.formatDateForUI(controlValue);
        input.value = formattedDate;
        this.shippedDateRawInput = formattedDate;
        control.setErrors(null);
      } else if (inputValue && !controlValue) {
        input.value = this.shippedDateRawInput;
        if (!control.hasError('invalidDate')) {
          control.setErrors({ invalidDate: true });
        }
      } else if (!inputValue) {
        control.setErrors(null);
      }
    }, 0);
  }

  getShippedDateError(): string {
    const control = this.filterForm.get('shippedDate');
    if (!control) return '';
    if (control.hasError('invalidDate')) return 'Shipped Date is invalid';
    if (control.hasError('matDatepickerParse')) return 'Shipped Date is invalid';
    if (control.hasError('required') && control.touched) return 'Date is required';
    return '';
  }

  getShippedDatePeriodError(): string {
    const periodControl = this.filterForm.get('shippedDatePeriod');
    if (periodControl?.hasError('required') && periodControl?.touched) {
      return 'Period is required';
    }
    return '';
  }

  // --- Received Date input/blur/error ---

  onReceivedDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.receivedDateRawInput = input.value.trim();
    const control = this.filterForm.get('receivedDate');
    if (!control) return;
    control.markAsDirty();
    control.markAsTouched();
    setTimeout(() => {
      if (this.receivedDateRawInput && !control.value) {
        control.setErrors({ ...control.errors, invalidDate: true });
      }
    }, 0);
  }

  onReceivedDateBlur(input: HTMLInputElement): void {
    setTimeout(() => {
      const control = this.filterForm.get('receivedDate');
      if (!control) return;
      control.markAsTouched();
      const controlValue = control.value;
      const inputValue = input.value.trim();

      if (controlValue && typeof controlValue === 'object' && controlValue.isValid && controlValue.isValid()) {
        const formattedDate = DateFieldValidationUtility.formatDateForUI(controlValue);
        input.value = formattedDate;
        this.receivedDateRawInput = formattedDate;
        control.setErrors(null);
      } else if (inputValue && !controlValue) {
        input.value = this.receivedDateRawInput;
        if (!control.hasError('invalidDate')) {
          control.setErrors({ invalidDate: true });
        }
      } else if (!inputValue) {
        control.setErrors(null);
      }
    }, 0);
  }

  getReceivedDateError(): string {
    const control = this.filterForm.get('receivedDate');
    if (!control) return '';
    if (control.hasError('invalidDate')) return 'Received Date is invalid';
    if (control.hasError('matDatepickerParse')) return 'Received Date is invalid';
    if (control.hasError('required') && control.touched) return 'Date is required';
    return '';
  }

  getReceivedDatePeriodError(): string {
    const periodControl = this.filterForm.get('receivedDatePeriod');
    if (periodControl?.hasError('required') && periodControl?.touched) {
      return 'Period is required';
    }
    return '';
  }

  // --- QC Date input/blur/error ---

  onQcDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.qcDateRawInput = input.value.trim();
    const control = this.filterForm.get('qcDate');
    if (!control) return;
    control.markAsDirty();
    control.markAsTouched();
    setTimeout(() => {
      if (this.qcDateRawInput && !control.value) {
        control.setErrors({ ...control.errors, invalidDate: true });
      }
    }, 0);
  }

  onQcDateBlur(input: HTMLInputElement): void {
    setTimeout(() => {
      const control = this.filterForm.get('qcDate');
      if (!control) return;
      control.markAsTouched();
      const controlValue = control.value;
      const inputValue = input.value.trim();

      if (controlValue && typeof controlValue === 'object' && controlValue.isValid && controlValue.isValid()) {
        const formattedDate = DateFieldValidationUtility.formatDateForUI(controlValue);
        input.value = formattedDate;
        this.qcDateRawInput = formattedDate;
        control.setErrors(null);
      } else if (inputValue && !controlValue) {
        input.value = this.qcDateRawInput;
        if (!control.hasError('invalidDate')) {
          control.setErrors({ invalidDate: true });
        }
      } else if (!inputValue) {
        control.setErrors(null);
      }
    }, 0);
  }

  getQcDateError(): string {
    const control = this.filterForm.get('qcDate');
    if (!control) return '';
    if (control.hasError('invalidDate')) return 'QC Date is invalid';
    if (control.hasError('matDatepickerParse')) return 'QC Date is invalid';
    if (control.hasError('required') && control.touched) return 'Date is required';
    return '';
  }

  getQcDatePeriodError(): string {
    const periodControl = this.filterForm.get('qcDatePeriod');
    if (periodControl?.hasError('required') && periodControl?.touched) {
      return 'Period is required';
    }
    return '';
  }

  // --- Batch Date input/blur/error ---

  onBatchDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.batchDateRawInput = input.value.trim();
    const control = this.filterForm.get('batchDate');
    if (!control) return;
    control.markAsDirty();
    control.markAsTouched();
    setTimeout(() => {
      if (this.batchDateRawInput && !control.value) {
        control.setErrors({ ...control.errors, invalidDate: true });
      }
    }, 0);
  }

  onBatchDateBlur(input: HTMLInputElement): void {
    setTimeout(() => {
      const control = this.filterForm.get('batchDate');
      if (!control) return;
      control.markAsTouched();
      const controlValue = control.value;
      const inputValue = input.value.trim();

      if (controlValue && typeof controlValue === 'object' && controlValue.isValid && controlValue.isValid()) {
        const formattedDate = DateFieldValidationUtility.formatDateForUI(controlValue);
        input.value = formattedDate;
        this.batchDateRawInput = formattedDate;
        control.setErrors(null);
      } else if (inputValue && !controlValue) {
        input.value = this.batchDateRawInput;
        if (!control.hasError('invalidDate')) {
          control.setErrors({ invalidDate: true });
        }
      } else if (!inputValue) {
        control.setErrors(null);
      }
    }, 0);
  }

  getBatchDateError(): string {
    const control = this.filterForm.get('batchDate');
    if (!control) return '';
    if (control.hasError('invalidDate')) return 'Batch Date is invalid';
    if (control.hasError('matDatepickerParse')) return 'Batch Date is invalid';
    if (control.hasError('required') && control.touched) return 'Date is required';
    return '';
  }

  getBatchDatePeriodError(): string {
    const periodControl = this.filterForm.get('batchDatePeriod');
    if (periodControl?.hasError('required') && periodControl?.touched) {
      return 'Period is required';
    }
    return '';
  }
}
