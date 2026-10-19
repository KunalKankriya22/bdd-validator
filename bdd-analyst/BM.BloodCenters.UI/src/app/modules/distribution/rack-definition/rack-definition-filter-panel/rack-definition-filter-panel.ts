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
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
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

import { RackDefinitionFilterValue, LovOption } from '../models/rack-definition.model';
import { RackDefinitionService } from '../services/rack-definition.service';

@Component({
  selector: 'app-rack-definition-filter-panel',
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
    MatProgressSpinnerModule
  ],
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }
  ],
  templateUrl: './rack-definition-filter-panel.html',
  styleUrls: ['./rack-definition-filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RackDefinitionFilterPanel implements OnInit, OnDestroy {

  @Input() currentFilters: RackDefinitionFilterValue | null = null;
  @Input() retrieveState!: { warehouseId: string; deviceType: string; deviceNumber: string; storageClass: string };
  @Output() close = new EventEmitter<void>();
  @Output() apply = new EventEmitter<RackDefinitionFilterValue>();

  filterForm!: FormGroup;

  readonly selectPanelLoadingValue = '__FILTER_PANEL_LOADING__';
  readonly selectPanelEmptyValue = '__FILTER_PANEL_EMPTY__';

  readonly rackNumberOptions = signal<LovOption[]>([]);
  readonly productTypeOptions = signal<LovOption[]>([]);

  periodOptions: { value: string; label: string }[] = [
    { value: 'After', label: 'After' },
    { value: 'Before', label: 'Before' }
  ];

  isLoadingFilters = false;

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
    private rackDefinitionService: RackDefinitionService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadFilterOptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /* ------------------------------ FORM INIT ------------------------------ */

  private initializeForm(): void {
    this.filterForm = this.fb.group({
      rackNumber: [this.currentFilters?.rackNumber ?? null],
      productType: [this.currentFilters?.productType ?? null],
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

  /* ------------------------------ LOAD OPTIONS ------------------------------ */

  private loadFilterOptions(): void {
    this.isLoadingFilters = true;

    const { warehouseId, deviceType, deviceNumber, storageClass } = this.retrieveState;

    this.rackDefinitionService.getFilterRackNumbers(warehouseId, deviceType, deviceNumber, storageClass)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.rackNumberOptions.set(res.data ?? []);
          this.cdr.markForCheck();
        },
        error: () => {
          this.rackNumberOptions.set([]);
          this.cdr.markForCheck();
        }
      });

    this.rackDefinitionService.getFilterProductTypes(warehouseId, deviceType, deviceNumber, storageClass)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.productTypeOptions.set(res.data ?? []);
          this.isLoadingFilters = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.productTypeOptions.set([]);
          this.isLoadingFilters = false;
          this.cdr.markForCheck();
        }
      });
  }

  /* ------------------------------ VALIDATION ------------------------------ */

  private validateEffectiveDatePeriod(): void {
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
  }

  private validateTerminationDatePeriod(): void {
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

  /* ------------------------------ ACTIONS ------------------------------ */

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

    const filters: RackDefinitionFilterValue = {
      rackNumber: formValue.rackNumber ?? null,
      productType: formValue.productType ?? null,
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

  get isApplyDisabled(): boolean {
    const values = this.filterForm?.value;
    const hasAnyValue = values?.rackNumber ||
                        values?.productType ||
                        values?.effectivePeriod || values?.effectiveDate ||
                        values?.terminationPeriod || values?.terminationDate;

    if (!hasAnyValue) return true;

    const effDateControl = this.filterForm.get('effectiveDate');
    const termDateControl = this.filterForm.get('terminationDate');
    const effPeriodControl = this.filterForm.get('effectivePeriod');
    const termPeriodControl = this.filterForm.get('terminationPeriod');

    const hasDateErrors = (effDateControl?.invalid ?? false) || (termDateControl?.invalid ?? false);
    const hasPeriodErrors = (effPeriodControl?.invalid ?? false) || (termPeriodControl?.invalid ?? false);

    return hasDateErrors || hasPeriodErrors;
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
