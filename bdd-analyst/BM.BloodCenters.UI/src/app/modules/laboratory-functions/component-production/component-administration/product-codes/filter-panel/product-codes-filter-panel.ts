import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  Input,
  ChangeDetectorRef,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';
import { Moment } from 'moment';
import { ProductCodesService } from '../services/product-codes.service';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { dateFormatValidator } from 'src/app/core/utils/date-adapter.util';

export interface ProductCodeFilterValue {
  productType?: string | null;
  effectiveDatePeriod?: string | null;
  effectiveDate?: Moment | null;
  terminationDatePeriod?: string | null;
  terminationDate?: Moment | null;
}

@Component({
  selector: 'app-product-codes-filter-panel',
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
    MatMomentDateModule,
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }
  ],
  templateUrl: './product-codes-filter-panel.html',
  styleUrls: ['./product-codes-filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductCodesFilterPanel implements OnInit, OnDestroy {
  private readonly productCodesService = inject(ProductCodesService);
  private readonly destroy$ = new Subject<void>();

  @Input() currentFilters: ProductCodeFilterValue | null = null;
  @Output() apply = new EventEmitter<ProductCodeFilterValue>();
  @Output() close = new EventEmitter<void>();

  filterForm!: FormGroup;

  // Dropdown options loaded from API
  productTypes: any[] = [];
  filteredProductTypes: any[] = [];
  productTypeSearchCtrl = new FormControl('');

  // Period validation errors
  effectiveDatePeriodError = '';
  terminationDatePeriodError = '';

  // Store raw input text to preserve invalid dates
  private effectiveDateRawInput = '';
  private terminationDateRawInput = '';

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private dateAdapter: DateAdapter<Moment>
  ) { }

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      productType: [this.currentFilters?.productType || null],
      effectiveDatePeriod: [this.currentFilters?.effectiveDatePeriod || null],
      effectiveDate: [this.currentFilters?.effectiveDate || null, [dateFormatValidator()]],
      terminationDatePeriod: [this.currentFilters?.terminationDatePeriod || null],
      terminationDate: [this.currentFilters?.terminationDate || null, [dateFormatValidator()]]
    });

    this.setupPeriodValidation();
    this.setupProductTypeSearch();
    this.loadProductTypes();

    // Run initial validation if data was provided
    if (this.currentFilters) {
      this.validateEffectiveDatePeriod();
      this.validateTerminationDatePeriod();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupPeriodValidation(): void {
    // Validate effectiveDatePeriod when effectiveDate changes
    this.filterForm.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const control = this.filterForm.get('effectiveDate');
        if (control && !control.touched) {
          control.markAsTouched();
        }
        this.validateEffectiveDatePeriod();
        this.cdr.markForCheck();
      });

    // Validate terminationDatePeriod when terminationDate changes
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

    // Validate when period values change
    this.filterForm.get('effectiveDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateEffectiveDatePeriod();
        this.cdr.markForCheck();
      });

    this.filterForm.get('terminationDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateTerminationDatePeriod();
        this.cdr.markForCheck();
      });
  }

  private setupProductTypeSearch(): void {
    this.productTypeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const search = (this.productTypeSearchCtrl.value || '').toLowerCase().trim();
        if (!search) {
          this.filteredProductTypes = [...this.productTypes];
        } else {
          this.filteredProductTypes = this.productTypes.filter(
            type =>
              type.productTypeCode?.toLowerCase().includes(search) ||
              type.productTypeDesc?.toLowerCase().includes(search)
          );
        }
        this.cdr.markForCheck();
      });
  }

  private loadProductTypes(): void {
    this.productCodesService.getProductTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (types) => {
          this.productTypes = types;
          this.filteredProductTypes = [...types];
          this.cdr.markForCheck();
        },
        error: (err) => console.error('Error loading product types:', err)
      });
  }

  private validateEffectiveDatePeriod(): void {
    const effectiveDate = this.filterForm.get('effectiveDate')?.value;
    const effectiveDatePeriod = this.filterForm.get('effectiveDatePeriod')?.value;

    // Show error only if date is selected but period is not
    if (effectiveDate && (!effectiveDatePeriod || effectiveDatePeriod === '')) {
      this.effectiveDatePeriodError = 'Period is required';
    } else {
      this.effectiveDatePeriodError = '';
    }
  }

  private validateTerminationDatePeriod(): void {
    const terminationDate = this.filterForm.get('terminationDate')?.value;
    const terminationDatePeriod = this.filterForm.get('terminationDatePeriod')?.value;

    // Show error only if date is selected but period is not
    if (terminationDate && (!terminationDatePeriod || terminationDatePeriod === '')) {
      this.terminationDatePeriodError = 'Period is required';
    } else {
      this.terminationDatePeriodError = '';
    }
  }

  onEffectiveDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.effectiveDateRawInput = input.value;
  }

  onEffectiveDateBlur(input: HTMLInputElement): void {
    const control = this.filterForm.get('effectiveDate');
    if (!control) return;

    if (this.effectiveDateRawInput && !control.value) {
      control.setErrors({ invalidDateFormat: true });
      control.markAsTouched();
    }
  }

  onTerminationDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.terminationDateRawInput = input.value;
  }

  onTerminationDateBlur(input: HTMLInputElement): void {
    const control = this.filterForm.get('terminationDate');
    if (!control) return;

    if (this.terminationDateRawInput && !control.value) {
      control.setErrors({ invalidDateFormat: true });
      control.markAsTouched();
    }
  }

  get isApplyDisabled(): boolean {
    if (this.filterForm.invalid ||
        !!this.effectiveDatePeriodError ||
        !!this.terminationDatePeriodError) {
      return true;
    }

    const formValue = this.filterForm?.value;
    if (!formValue) {
      return true;
    }

    const hasAnyValue =
      formValue.productType !== null && formValue.productType !== '' ||
      formValue.effectiveDatePeriod ||
      formValue.effectiveDate ||
      formValue.terminationDatePeriod ||
      formValue.terminationDate;

    return !hasAnyValue;
  }

  onClearAll(): void {
    this.filterForm.reset();
    this.effectiveDatePeriodError = '';
    this.terminationDatePeriodError = '';
    this.effectiveDateRawInput = '';
    this.terminationDateRawInput = '';
    this.cdr.markForCheck();
  }

  onApply(): void {
    if (this.isApplyDisabled) return;

    const filters: ProductCodeFilterValue = {
      productType: this.filterForm.get('productType')?.value || null,
      effectiveDatePeriod: this.filterForm.get('effectiveDatePeriod')?.value || null,
      effectiveDate: this.filterForm.get('effectiveDate')?.value || null,
      terminationDatePeriod: this.filterForm.get('terminationDatePeriod')?.value || null,
      terminationDate: this.filterForm.get('terminationDate')?.value || null
    };

    this.apply.emit(filters);
  }

  onClose(): void {
    this.close.emit();
  }
}
