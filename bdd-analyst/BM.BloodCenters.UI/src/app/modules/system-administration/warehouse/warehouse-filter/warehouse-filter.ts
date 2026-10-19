import { Component, ChangeDetectionStrategy, ChangeDetectorRef, EventEmitter, Input, OnInit, OnDestroy, Output, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, ErrorStateMatcher } from '@angular/material/core';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';

export interface WarehouseFilters {
  warehouse?: string | null;
  chapter?: string | null;
  effectiveDate?: Date | null;
  effectiveDatePeriod?: 'AFTER' | 'BEFORE' | null;
  terminationDate?: Date | null;
  terminationDatePeriod?: 'AFTER' | 'BEFORE' | null;
}

@Component({
  selector: 'app-warehouse-filter',
  standalone: true,
  templateUrl: './warehouse-filter.html',
  styleUrls: ['./warehouse-filter.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WarehouseFilterComponent implements OnInit, OnDestroy {
  @Input() currentFilters: WarehouseFilters | null = null;
  @Input() warehouses: { value: string; display: string }[] = [];
  @Input() chapters: { value: string; display: string }[] = [];
  @Output() apply = new EventEmitter<WarehouseFilters>();
  @Output() close = new EventEmitter<void>();

  @ViewChild('effectiveDateInput') effectiveDateInput?: ElementRef;
  @ViewChild('terminationDateInput') terminationDateInput?: ElementRef;

  filterForm!: FormGroup;

  // Search controls and filtered options
  warehouseSearchControl = new FormControl('');
  filteredWarehouses: { value: string; display: string }[] = [];

  chapterSearchControl = new FormControl('');
  filteredChapters: { value: string; display: string }[] = [];

  private destroy$ = new Subject<void>();

  periodOptions: { value: string; display: string }[] = [
    { value: 'AFTER', display: 'After' },
    { value: 'BEFORE', display: 'Before' }
  ];

  effectiveDateErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control): boolean => {
      if (!control || !(control.dirty || control.touched)) return false;
      if (control.invalid) return true;
      return !control.value && !!this.getNativeInputText(this.effectiveDateInput);
    }
  };

  terminationDateErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control): boolean => {
      if (!control || !(control.dirty || control.touched)) return false;
      if (control.invalid) return true;
      return !control.value && !!this.getNativeInputText(this.terminationDateInput);
    }
  };

  constructor(private fb: FormBuilder, private cdr: ChangeDetectorRef) {
    this.filterForm = this.fb.group({
      warehouse: [null],
      chapter: [null],
      effectiveDatePeriod: [null],
      effectiveDate: [null],
      terminationDatePeriod: [null],
      terminationDate: [null]
    });
  }

  ngOnInit(): void {
    // Initialize filtered options
    this.filteredWarehouses = [...this.warehouses];
    this.filteredChapters = [...this.chapters];

    if (this.currentFilters) {
      this.filterForm.patchValue(this.currentFilters);
    }

    this.setupSearchControls();
    this.setupValidation();
  }

  private setupSearchControls(): void {
    // Warehouse search
    this.warehouseSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search as string || '').toLowerCase();
        this.filteredWarehouses = this.warehouses.filter(warehouse =>
          warehouse.value.toLowerCase().includes(term) ||
          warehouse.display.toLowerCase().includes(term)
        );
        this.cdr.markForCheck();
      });

    // Chapter search
    this.chapterSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search as string || '').toLowerCase();
        this.filteredChapters = this.chapters.filter(chapter =>
          chapter.value.toLowerCase().includes(term) ||
          chapter.display.toLowerCase().includes(term)
        );
        this.cdr.markForCheck();
      });
  }

  private setupValidation(): void {
    this.filterForm.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        const periodControl = this.filterForm.get('effectiveDatePeriod');
        if (value && periodControl) {
          periodControl.markAsTouched();
          periodControl.updateValueAndValidity({ emitEvent: false });
          this.cdr.markForCheck();
        }
      });

    this.filterForm.get('effectiveDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.filterForm.get('effectiveDatePeriod')?.updateValueAndValidity({ emitEvent: false });
        this.cdr.markForCheck();
      });

    this.filterForm.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        const periodControl = this.filterForm.get('terminationDatePeriod');
        if (value && periodControl) {
          periodControl.markAsTouched();
          periodControl.updateValueAndValidity({ emitEvent: false });
          this.cdr.markForCheck();
        }
      });

    this.filterForm.get('terminationDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.filterForm.get('terminationDatePeriod')?.updateValueAndValidity({ emitEvent: false });
        this.cdr.markForCheck();
      });

    this.filterForm.get('effectiveDatePeriod')?.setValidators([this.effectiveDatePeriodValidator.bind(this)]);
    this.filterForm.get('terminationDatePeriod')?.setValidators([this.terminationDatePeriodValidator.bind(this)]);
  }

  private effectiveDatePeriodValidator(control: AbstractControl): ValidationErrors | null {
    if (!this.filterForm) return null;

    const effectiveDate = this.filterForm.get('effectiveDate')?.value;
    const effectiveDatePeriod = control.value;

    if (effectiveDate && !effectiveDatePeriod) {
      return { required: true };
    }

    return null;
  }

  private terminationDatePeriodValidator(control: AbstractControl): ValidationErrors | null {
    if (!this.filterForm) return null;

    const terminationDate = this.filterForm.get('terminationDate')?.value;
    const terminationDatePeriod = control.value;

    if (terminationDate && !terminationDatePeriod) {
      return { required: true };
    }

    return null;
  }

  private getNativeInputText(elRef?: ElementRef): string {
    return elRef?.nativeElement?.value?.trim() ?? '';
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get isApplyDisabled(): boolean {
    if (this.filterForm.invalid) {
      return true;
    }

    const formValue = this.filterForm.value;
    const hasAnyFilter = !!(
      formValue.warehouse ||
      formValue.chapter ||
      (formValue.effectiveDate && formValue.effectiveDatePeriod) ||
      (formValue.terminationDate && formValue.terminationDatePeriod)
    );

    return !hasAnyFilter;
  }

  onApply(): void {
    this.filterForm.markAllAsTouched();

    if (this.filterForm.invalid) {
      return;
    }

    const formValue = this.filterForm.value;

    const effectiveDatePeriod = formValue.effectiveDate ? (formValue.effectiveDatePeriod || null) : null;
    const terminationDatePeriod = formValue.terminationDate ? (formValue.terminationDatePeriod || null) : null;

    const filters: WarehouseFilters = {
      warehouse: formValue.warehouse || null,
      chapter: formValue.chapter || null,
      effectiveDatePeriod: effectiveDatePeriod,
      effectiveDate: formValue.effectiveDate || null,
      terminationDatePeriod: terminationDatePeriod,
      terminationDate: formValue.terminationDate || null
    };

    this.apply.emit(filters);
  }

  onClear(): void {
    this.filterForm.reset({
      warehouse: null,
      chapter: null,
      effectiveDatePeriod: null,
      effectiveDate: null,
      terminationDatePeriod: null,
      terminationDate: null
    });
  }

  onClose(): void {
    this.close.emit();
  }

  onEffectiveDateInput(): void {
    const control = this.filterForm.get('effectiveDate');
    if (control && !control.dirty) {
      control.markAsDirty();
    }
    control?.updateValueAndValidity();
    this.cdr.markForCheck();
  }

  onEffectiveDateBlur(): void {
    const control = this.filterForm.get('effectiveDate');
    control?.markAsTouched();
    this.cdr.markForCheck();
  }

  onTerminationDateInput(): void {
    const control = this.filterForm.get('terminationDate');
    if (control && !control.dirty) {
      control.markAsDirty();
    }
    control?.updateValueAndValidity();
    this.cdr.markForCheck();
  }

  onTerminationDateBlur(): void {
    const control = this.filterForm.get('terminationDate');
    control?.markAsTouched();
    this.cdr.markForCheck();
  }

  getEffectiveDatePeriodError(): string {
    const control = this.filterForm.get('effectiveDatePeriod');
    if (!control || !control.touched) return '';
    if (control.hasError('required')) return 'Period is required';
    return '';
  }

  getTerminationDatePeriodError(): string {
    const control = this.filterForm.get('terminationDatePeriod');
    if (!control || !control.touched) return '';
    if (control.hasError('required')) return 'Period is required';
    return '';
  }

  getEffectiveDateError(): string {
    const control = this.filterForm?.get('effectiveDate');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('matDatepickerParse')) return 'Effective date is invalid';
    if (!control.value && this.getNativeInputText(this.effectiveDateInput)) return 'Effective date is invalid';
    return '';
  }

  getTerminationDateError(): string {
    const control = this.filterForm?.get('terminationDate');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('matDatepickerParse')) return 'Termination date is invalid';
    if (!control.value && this.getNativeInputText(this.terminationDateInput)) return 'Termination date is invalid';
    return '';
  }
}
