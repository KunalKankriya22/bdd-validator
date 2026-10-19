import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  ChangeDetectionStrategy,
  Input,
  ChangeDetectorRef,
  OnDestroy,
  ViewChild,
  ElementRef,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { ErrorStateMatcher, DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { Subject, takeUntil } from 'rxjs';
import { Moment } from 'moment';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { A11yModule } from '@angular/cdk/a11y';

import { ProductStorageFilterValue, LovOption } from '../models/product-storage-definition.model';
import { ProductStorageDefinitionService } from '../services/product-storage-definition.service';

@Component({
  selector: 'app-product-storage-definition-filter-panel',
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
    MatProgressSpinnerModule,
    NgxMatSelectSearchModule,
    A11yModule
  ],
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }
  ],
  templateUrl: './product-storage-definition-filter-panel.html',
  styleUrls: ['./product-storage-definition-filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductStorageDefinitionFilterPanel implements OnInit, OnDestroy {

  @Input() currentFilters: ProductStorageFilterValue | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() apply = new EventEmitter<ProductStorageFilterValue>();

  filterForm!: FormGroup;

  readonly selectPanelLoadingValue = '__FILTER_PANEL_LOADING__';
  readonly selectPanelEmptyValue = '__FILTER_PANEL_EMPTY__';

  readonly productTypeOptions = signal<LovOption[]>([]);
  readonly warehouseCodeOptions = signal<LovOption[]>([]);
  readonly deviceTypeOptions = signal<LovOption[]>([]);

  filteredProductTypeOptions: LovOption[] = [];
  filteredWarehouseCodeOptions: LovOption[] = [];
  filteredDeviceTypeOptions: LovOption[] = [];

  productTypeSearchControl = new FormControl<string>('');
  warehouseCodeSearchControl = new FormControl<string>('');
  deviceTypeSearchControl = new FormControl<string>('');

  periodOptions: { value: string; label: string }[] = [
    { value: 'After', label: 'After' },
    { value: 'Before', label: 'Before' }
  ];

  isLoadingFilters = false;

  /** WCAG 2.4.3: template reference used by parent to move focus into the panel on open */
  @ViewChild('filterCloseButton') filterCloseButtonRef?: ElementRef<HTMLButtonElement>;
  @ViewChild('effectiveDateNativeInput') effectiveDateNativeInput?: ElementRef;
  @ViewChild('terminationDateNativeInput') terminationDateNativeInput?: ElementRef;

  effDateErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control): boolean => {
      if (!control || !(control.dirty || control.touched)) return false;
      if (control.invalid) return true;
      return !control.value && !!this.getNativeInputText(this.effectiveDateNativeInput);
    }
  };

  termDateErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control): boolean => {
      if (!control || !(control.dirty || control.touched)) return false;
      if (control.invalid) return true;
      return !control.value && !!this.getNativeInputText(this.terminationDateNativeInput);
    }
  };

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private productStorageService: ProductStorageDefinitionService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.setupSearchControls();
    this.initializeFilteredOptions();
  }

  private setupSearchControls(): void {
    // Product Type search
    this.productTypeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((search) => {
        const term = (search ?? '').toLowerCase();
        this.filteredProductTypeOptions = this.productTypeOptions().filter((option) =>
          option.code.toLowerCase().includes(term) ||
          option.description.toLowerCase().includes(term)
        );
      });

    // Warehouse Code search
    this.warehouseCodeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((search) => {
        const term = (search ?? '').toLowerCase();
        this.filteredWarehouseCodeOptions = this.warehouseCodeOptions().filter((option) =>
          option.code.toLowerCase().includes(term) ||
          option.description.toLowerCase().includes(term)
        );
      });

    // Device Type search
    this.deviceTypeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((search) => {
        const term = (search ?? '').toLowerCase();
        this.filteredDeviceTypeOptions = this.deviceTypeOptions().filter((option) =>
          option.code.toLowerCase().includes(term) ||
          option.description.toLowerCase().includes(term)
        );
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.filterForm = this.fb.group({
      productType: [this.currentFilters?.productType ?? null],
      warehouseCode: [this.currentFilters?.warehouseCode ?? null],
      deviceType: [this.currentFilters?.deviceType ?? null],
      effectivePeriod: [this.currentFilters?.effectivePeriod ?? null],
      effectiveDate: [
        this.currentFilters?.effectiveDate
          ? new Date(this.currentFilters.effectiveDate)
          : null
      ],
      terminationPeriod: [this.currentFilters?.terminationPeriod ?? null],
      terminationDate: [
        this.currentFilters?.terminationDate
          ? new Date(this.currentFilters.terminationDate)
          : null
      ]
    });

    this.filterForm.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((date) => {
        const control = this.filterForm.get('effectiveDate');
        const periodControl = this.filterForm.get('effectivePeriod');

        if (control && !control.touched) {
          control.markAsTouched();
        }

        const hasValidDate = date && !control?.hasError('matDatepickerParse');
        if (hasValidDate && periodControl) {
          periodControl.markAsTouched();
        }

        this.validateEffectiveDatePeriod();
      });

    this.filterForm.get('effectiveDate')?.statusChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const control = this.filterForm.get('effectiveDate');
        const periodControl = this.filterForm.get('effectivePeriod');

        const hasValidDate = control?.value && !control?.hasError('matDatepickerParse');
        if (hasValidDate && periodControl) {
          periodControl.markAsTouched();
        }

        this.validateEffectiveDatePeriod();
      });

    this.filterForm.get('effectivePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.validateEffectiveDatePeriod());

    this.filterForm.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((date) => {
        const control = this.filterForm.get('terminationDate');
        const periodControl = this.filterForm.get('terminationPeriod');

        if (control && !control.touched) {
          control.markAsTouched();
        }

        const hasValidDate = date && !control?.hasError('matDatepickerParse');
        if (hasValidDate && periodControl) {
          periodControl.markAsTouched();
        }

        this.validateTerminationDatePeriod();
      });

    this.filterForm.get('terminationDate')?.statusChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const control = this.filterForm.get('terminationDate');
        const periodControl = this.filterForm.get('terminationPeriod');

        const hasValidDate = control?.value && !control?.hasError('matDatepickerParse');
        if (hasValidDate && periodControl) {
          periodControl.markAsTouched();
        }

        this.validateTerminationDatePeriod();
      });

    this.filterForm.get('terminationPeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.validateTerminationDatePeriod());
  }

  private initializeFilteredOptions(): void {
    // Initialize filtered options from the options passed by parent component
    this.filteredProductTypeOptions = this.productTypeOptions();
    this.filteredWarehouseCodeOptions = this.warehouseCodeOptions();
    this.filteredDeviceTypeOptions = this.deviceTypeOptions();
  }

  private validateEffectiveDatePeriod(): void {
    setTimeout(() => {
      const effDateControl = this.filterForm.get('effectiveDate');
      const effDate = effDateControl?.value;
      const effDatePeriod = this.filterForm.get('effectivePeriod')?.value;
      const effDatePeriodControl = this.filterForm.get('effectivePeriod');

      const hasValidDate = effDate && !effDateControl?.hasError('matDatepickerParse');

      if (hasValidDate && !effDatePeriod) {
        effDatePeriodControl?.setErrors({ required: true });
        effDatePeriodControl?.markAsTouched();
      } else {
        effDatePeriodControl?.setErrors(null);
      }
      this.cdr.markForCheck();
    });
  }

  private validateTerminationDatePeriod(): void {
    setTimeout(() => {
      const termDateControl = this.filterForm.get('terminationDate');
      const termDate = termDateControl?.value;
      const termDatePeriod = this.filterForm.get('terminationPeriod')?.value;
      const termDatePeriodControl = this.filterForm.get('terminationPeriod');

      const hasValidDate = termDate && !termDateControl?.hasError('matDatepickerParse');

      if (hasValidDate && !termDatePeriod) {
        termDatePeriodControl?.setErrors({ required: true });
        termDatePeriodControl?.markAsTouched();
      } else {
        termDatePeriodControl?.setErrors(null);
      }
      this.cdr.markForCheck();
    });
  }

  getEffectiveDateError(): string {
    const control = this.filterForm?.get('effectiveDate');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('matDatepickerParse')) return 'Effective date is invalid';
    if (!control.value && this.getNativeInputText(this.effectiveDateNativeInput)) return 'Effective date is invalid';
    return '';
  }

  getTerminationDateError(): string {
    const control = this.filterForm?.get('terminationDate');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('matDatepickerParse')) return 'Termination date is invalid';
    if (!control.value && this.getNativeInputText(this.terminationDateNativeInput)) return 'Termination date is invalid';
    return '';
  }

  private getNativeInputText(elRef?: ElementRef): string {
    return elRef?.nativeElement?.value?.trim() ?? '';
  }

  onApply(): void {
    this.validateEffectiveDatePeriod();
    this.validateTerminationDatePeriod();

    const effDateControl = this.filterForm.get('effectiveDate');
    const termDateControl = this.filterForm.get('terminationDate');
    const effPeriodControl = this.filterForm.get('effectivePeriod');
    const termPeriodControl = this.filterForm.get('terminationPeriod');

    if (effDateControl?.errors ||
        termDateControl?.errors ||
        effPeriodControl?.errors ||
        termPeriodControl?.errors) {
      effDateControl?.markAsTouched();
      termDateControl?.markAsTouched();
      effPeriodControl?.markAsTouched();
      termPeriodControl?.markAsTouched();
      this.cdr.markForCheck();
      return;
    }

    const formValue = this.filterForm.value;

    const filters: ProductStorageFilterValue = {
      productType: formValue.productType ?? null,
      warehouseCode: formValue.warehouseCode ?? null,
      deviceType: formValue.deviceType ?? null,
      effectivePeriod: formValue.effectiveDate ? formValue.effectivePeriod : null,
      effectiveDate: formValue.effectiveDate
        ? this.formatDateForApi(formValue.effectiveDate)
        : null,
      terminationPeriod: formValue.terminationDate ? formValue.terminationPeriod : null,
      terminationDate: formValue.terminationDate
        ? this.formatDateForApi(formValue.terminationDate)
        : null
    };

    this.apply.emit(filters);
  }

  onClear(): void {
    this.filterForm.reset();
    this.filterForm.get('effectivePeriod')?.setErrors(null);
    this.filterForm.get('terminationPeriod')?.setErrors(null);
    this.cdr.markForCheck();
  }

  onClose(): void {
    this.close.emit();
  }

  /** WCAG 2.4.3: called by parent overlay host to move keyboard focus into this panel after it renders */
  focusCloseButton(): void {
    this.filterCloseButtonRef?.nativeElement?.focus();
  }

  get isApplyDisabled(): boolean {
    const values = this.filterForm?.value;

    // Check if any filter value is selected (excluding period-only selections)
    const hasProductType = !!values?.productType;
    const hasWarehouse = !!values?.warehouseCode;
    const hasDeviceType = !!values?.deviceType;

    const hasEffectiveDate = !!values?.effectiveDate;
    const hasEffectivePeriod = !!values?.effectivePeriod;
    const hasTerminationDate = !!values?.terminationDate;
    const hasTerminationPeriod = !!values?.terminationPeriod;

    // Check if there's at least one valid filter (dropdown or complete date pair)
    const hasValidEffectiveDate = hasEffectiveDate && hasEffectivePeriod;
    const hasValidTerminationDate = hasTerminationDate && hasTerminationPeriod;

    const hasAnyValidValue = hasProductType || hasWarehouse || hasDeviceType ||
                             hasValidEffectiveDate || hasValidTerminationDate;

    if (!hasAnyValidValue) return true;

    // Check for date validation errors
    const effDateControl = this.filterForm.get('effectiveDate');
    const termDateControl = this.filterForm.get('terminationDate');

    const hasDateErrors = (effDateControl?.invalid ?? false) || (termDateControl?.invalid ?? false);
    if (hasDateErrors) return true;

    // Disable if period is selected but date is not valid
    if (hasEffectivePeriod && !hasEffectiveDate) return true;
    if (hasTerminationPeriod && !hasTerminationDate) return true;

    return false;
  }

  private formatDateForApi(date: Date | string | Moment | null | undefined): string {
    if (!date) return '';

    if (typeof date === 'string') {
      return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : '';
    }

    const dateObj: Date = date instanceof Date ? date : (date as Moment).toDate();

    if (isNaN(dateObj.getTime())) return '';

    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
