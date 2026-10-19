import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  Input,
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, take, takeUntil } from 'rxjs';
import moment, { Moment } from 'moment';

import { PrePrintedProductLabelFilterValue, LookUp } from '../models/pre-printed-product-labels.model';
import { PrePrintedProductLabelsApiService } from '../services/pre-printed-product-labels-api.service';

@Component({
  selector: 'app-pre-printed-product-label-filter-panel',
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
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './pre-printed-product-label-filter-panel.html',
  styleUrls: ['./pre-printed-product-label-filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PrePrintedProductLabelFilterPanel implements OnInit, OnDestroy {
  @ViewChild('effectiveDateInput') effectiveDateInput?: ElementRef<HTMLInputElement>;
  @ViewChild('terminationDateInput') terminationDateInput?: ElementRef<HTMLInputElement>;

  @Input() currentFilters: PrePrintedProductLabelFilterValue | null = null;
  @Output() apply = new EventEmitter<PrePrintedProductLabelFilterValue>();
  @Output() close = new EventEmitter<void>();

  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly service = inject(PrePrintedProductLabelsApiService);

  filterForm!: FormGroup;

  catalogNumberOptions: LookUp[] = [];
  filteredCatalogNumberOptions: LookUp[] = [];
  catalogNumberSearchControl = new FormControl('');

  faceLabelOptions: LookUp[] = [];
  filteredFaceLabelOptions: LookUp[] = [];
  faceLabelSearchControl = new FormControl('');

  isLoadingFilters = false;

  private destroy$ = new Subject<void>();
  private effectiveDateRawInput = '';
  private terminationDateRawInput = '';
  private initialFilterValues: PrePrintedProductLabelFilterValue | null = null;

  ngOnInit(): void {
    this.initializeForm();
    this.loadFilters();
    this.setupSearchControls();

    if (this.currentFilters) {
      this.populateFormWithCurrentFilters();
      this.initialFilterValues = { ...this.currentFilters };
    } else {
      this.initialFilterValues = null;
    }

    this.setupValidation();
  }

  private initializeForm(): void {
    this.filterForm = this.fb.group({
      catalogNumber: [null],
      faceLabel: [null],
      effDatePeriod: [null],
      effDate: [null],
      termDatePeriod: [null],
      termDate: [null]
    });
  }

  private loadFilters(): void {
    this.isLoadingFilters = true;

    this.service.getFilterDropdown()
      .pipe(take(1))
      .subscribe({
        next: (response) => {
          this.catalogNumberOptions = response.catalogNumbers || [];
          this.filteredCatalogNumberOptions = [...this.catalogNumberOptions];
          this.faceLabelOptions = response.faceLabels || [];
          this.filteredFaceLabelOptions = [...this.faceLabelOptions];

          this.isLoadingFilters = false;

          if (this.currentFilters) {
            this.populateFormWithCurrentFilters();
          }

          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error loading filter options:', error);
          this.isLoadingFilters = false;

          this.catalogNumberOptions = [];
          this.filteredCatalogNumberOptions = [];
          this.faceLabelOptions = [];
          this.filteredFaceLabelOptions = [];

          this.cdr.markForCheck();
        }
      });
  }

  private populateFormWithCurrentFilters(): void {
    if (!this.currentFilters) return;

    const effDate = this.currentFilters.effDate
      ? moment.isMoment(this.currentFilters.effDate)
        ? this.currentFilters.effDate
        : moment(this.currentFilters.effDate)
      : null;

    const termDate = this.currentFilters.termDate
      ? moment.isMoment(this.currentFilters.termDate)
        ? this.currentFilters.termDate
        : moment(this.currentFilters.termDate)
      : null;

    this.filterForm.patchValue({
      catalogNumber: this.currentFilters.catalogNumber ?? null,
      faceLabel: this.currentFilters.faceLabel ?? null,
      effDatePeriod: this.currentFilters.effDatePeriod ?? null,
      effDate: effDate,
      termDatePeriod: this.currentFilters.termDatePeriod ?? null,
      termDate: termDate
    });

    this.cdr.markForCheck();
  }

  private setupSearchControls(): void {
    this.catalogNumberSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((search: string | null) => {
        this.filteredCatalogNumberOptions = this.filterOptions(search, this.catalogNumberOptions);
        this.cdr.markForCheck();
      });

    this.faceLabelSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((search: string | null) => {
        this.filteredFaceLabelOptions = this.filterOptions(search, this.faceLabelOptions);
        this.cdr.markForCheck();
      });
  }

  private filterOptions(search: string | null, options: LookUp[]): LookUp[] {
    if (!search || search.length < 1) {
      return [...options];
    }
    const lowerSearch = search.toLowerCase();
    return options.filter(o =>
      o.value.toLowerCase().includes(lowerSearch) ||
      o.key.toLowerCase().includes(lowerSearch)
    );
  }

  private setupValidation(): void {
    this.filterForm.get('effDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateEffDatePeriod();
        this.cdr.markForCheck();
      });

    this.filterForm.get('effDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateEffDatePeriod();
        this.cdr.markForCheck();
      });

    this.filterForm.get('termDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateTermDatePeriod();
        this.cdr.markForCheck();
      });

    this.filterForm.get('termDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateTermDatePeriod();
        this.cdr.markForCheck();
      });

    this.filterForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.cdr.markForCheck();
      });

    this.filterForm.statusChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.cdr.markForCheck();
      });
  }

  private validateEffDatePeriod(): void {
    const effDate = this.filterForm.get('effDate')?.value;
    const effDatePeriod = this.filterForm.get('effDatePeriod')?.value;
    const control = this.filterForm.get('effDatePeriod');

    if (effDate && !effDatePeriod) {
      control?.setErrors({ required: true });
      control?.markAsTouched();
    } else {
      control?.setErrors(null);
    }
  }

  private validateTermDatePeriod(): void {
    const termDate = this.filterForm.get('termDate')?.value;
    const termDatePeriod = this.filterForm.get('termDatePeriod')?.value;
    const control = this.filterForm.get('termDatePeriod');

    if (termDate && !termDatePeriod) {
      control?.setErrors({ required: true });
      control?.markAsTouched();
    } else {
      control?.setErrors(null);
    }
  }

  onEffDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const inputValue = input.value.trim();
    this.effectiveDateRawInput = inputValue;

    const control = this.filterForm.get('effDate');
    if (!control) return;

    control.markAsDirty();
    control.markAsTouched();

    setTimeout(() => {
      if (inputValue && !control.value) {
        control.setErrors({ ...control.errors, invalidDate: true });
      }
    }, 0);
  }

  onEffDateBlur(input: HTMLInputElement): void {
    setTimeout(() => {
      const control = this.filterForm.get('effDate');
      if (!control) return;

      control.markAsTouched();

      const controlValue = control.value;
      const inputValue = input.value.trim();

      if (controlValue && typeof controlValue === 'object' && controlValue.isValid && controlValue.isValid()) {
        const formattedDate = DateFieldValidationUtility.formatDateForUI(controlValue);
        input.value = formattedDate;
        this.effectiveDateRawInput = formattedDate;
        control.setErrors(null);
      } else if (inputValue && !controlValue) {
        input.value = this.effectiveDateRawInput;
        if (!control.hasError('invalidDate')) {
          control.setErrors({ invalidDate: true });
        }
      } else if (!inputValue) {
        control.setErrors(null);
      }
    }, 0);
  }

  onTermDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const inputValue = input.value.trim();
    this.terminationDateRawInput = inputValue;

    const control = this.filterForm.get('termDate');
    if (!control) return;

    control.markAsDirty();
    control.markAsTouched();

    setTimeout(() => {
      if (inputValue && !control.value) {
        control.setErrors({ ...control.errors, invalidDate: true });
      }
    }, 0);
  }

  onTermDateBlur(input: HTMLInputElement): void {
    setTimeout(() => {
      const control = this.filterForm.get('termDate');
      if (!control) return;

      control.markAsTouched();

      const controlValue = control.value;
      const inputValue = input.value.trim();

      if (controlValue && typeof controlValue === 'object' && controlValue.isValid && controlValue.isValid()) {
        const formattedDate = DateFieldValidationUtility.formatDateForUI(controlValue);
        input.value = formattedDate;
        this.terminationDateRawInput = formattedDate;
        control.setErrors(null);
      } else if (inputValue && !controlValue) {
        input.value = this.terminationDateRawInput;
        if (!control.hasError('invalidDate')) {
          control.setErrors({ invalidDate: true });
        }
      } else if (!inputValue) {
        control.setErrors(null);
      }
    }, 0);
  }

  getEffDatePeriodError(): string {
    const control = this.filterForm.get('effDatePeriod');
    if (control?.hasError('required') && control?.touched) {
      return 'Period is required';
    }
    return '';
  }

  getTermDatePeriodError(): string {
    const control = this.filterForm.get('termDatePeriod');
    if (control?.hasError('required') && control?.touched) {
      return 'Period is required';
    }
    return '';
  }

  getEffectiveDateError(): string {
    const control = this.filterForm.get('effDate');
    if (!control) return '';

    if (control.hasError('invalidDate') || control.hasError('matDatepickerParse')) {
      return 'Effective Date is invalid';
    }

    return '';
  }

  getTerminationDateError(): string {
    const control = this.filterForm.get('termDate');
    if (!control) return '';

    if (control.hasError('invalidDate') || control.hasError('matDatepickerParse')) {
      return 'Termination Date is invalid';
    }

    return '';
  }

  get effDatePeriodRequired(): boolean {
    const formValue = this.filterForm?.value;
    return !!(formValue?.effDate && !formValue?.effDatePeriod);
  }

  get termDatePeriodRequired(): boolean {
    const formValue = this.filterForm?.value;
    return !!(formValue?.termDate && !formValue?.termDatePeriod);
  }

  get isApplyDisabled(): boolean {
    if (this.filterForm?.invalid) {
      return true;
    }

    if (this.effDatePeriodRequired || this.termDatePeriodRequired) {
      return true;
    }

    if (this.hasDateErrors()) {
      return true;
    }

    if (this.getEffectiveDateError() || this.getTerminationDateError() ||
        this.getEffDatePeriodError() || this.getTermDatePeriodError()) {
      return true;
    }

    const formValue = this.filterForm?.value;
    if (!formValue) {
      return true;
    }

    const hasAnyValue =
      formValue.catalogNumber !== null ||
      formValue.faceLabel !== null ||
      formValue.effDatePeriod ||
      formValue.effDate ||
      formValue.termDatePeriod ||
      formValue.termDate;

    if (!hasAnyValue) {
      return true;
    }

    if (!this.hasFormChanged()) {
      return true;
    }

    return false;
  }

  private hasDateErrors(): boolean {
    const effDateControl = this.filterForm.get('effDate');
    const termDateControl = this.filterForm.get('termDate');
    const effHasError = effDateControl?.hasError('invalidDate') ||
                        effDateControl?.hasError('matDatepickerParse');
    const termHasError = termDateControl?.hasError('invalidDate') ||
                         termDateControl?.hasError('matDatepickerParse');

    return effHasError || termHasError || false;
  }

  private hasFormChanged(): boolean {
    const formValue = this.filterForm?.value;
    if (!formValue) return false;

    if (!this.initialFilterValues) return true;

    const currentEffDate = formValue.effDate ? this.formatDateOnly(formValue.effDate) : null;
    const currentTermDate = formValue.termDate ? this.formatDateOnly(formValue.termDate) : null;

    return formValue.catalogNumber !== (this.initialFilterValues.catalogNumber ?? null) ||
      formValue.faceLabel !== (this.initialFilterValues.faceLabel ?? null) ||
      formValue.effDatePeriod !== (this.initialFilterValues.effDatePeriod ?? null) ||
      currentEffDate !== (this.initialFilterValues.effDate ?? null) ||
      formValue.termDatePeriod !== (this.initialFilterValues.termDatePeriod ?? null) ||
      currentTermDate !== (this.initialFilterValues.termDate ?? null);
  }

  private formatDateOnly(date: Moment | Date | null): string | null {
    if (!date) return null;

    if (moment.isMoment(date)) {
      return date.format('YYYY-MM-DD') + 'T00:00:00';
    }

    const year = (date as Date).getFullYear();
    const month = String((date as Date).getMonth() + 1).padStart(2, '0');
    const day = String((date as Date).getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T00:00:00`;
  }

  onApply(): void {
    this.filterForm.markAllAsTouched();

    if (this.hasDateErrors() || this.effDatePeriodRequired || this.termDatePeriodRequired) {
      this.cdr.markForCheck();
      return;
    }

    const formValue = this.filterForm.value;
    const filters: PrePrintedProductLabelFilterValue = {};

    if (formValue.catalogNumber) {
      filters.catalogNumber = formValue.catalogNumber;
    }
    if (formValue.faceLabel) {
      filters.faceLabel = formValue.faceLabel;
    }
    if (formValue.effDate) {
      filters.effDatePeriod = formValue.effDatePeriod;
      filters.effDate = this.formatDateOnly(formValue.effDate) ?? undefined;
    }
    if (formValue.termDate) {
      filters.termDatePeriod = formValue.termDatePeriod;
      filters.termDate = this.formatDateOnly(formValue.termDate) ?? undefined;
    }

    this.apply.emit(filters);
  }

  onClear(): void {
    this.filterForm.reset({
      catalogNumber: null,
      faceLabel: null,
      effDatePeriod: null,
      effDate: null,
      termDatePeriod: null,
      termDate: null
    });

    this.effectiveDateRawInput = '';
    this.terminationDateRawInput = '';

    this.catalogNumberSearchControl.setValue('', { emitEvent: false });
    this.filteredCatalogNumberOptions = [...this.catalogNumberOptions];
    this.faceLabelSearchControl.setValue('', { emitEvent: false });
    this.filteredFaceLabelOptions = [...this.faceLabelOptions];

    this.cdr.markForCheck();
  }

  onClose(): void {
    this.close.emit();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
