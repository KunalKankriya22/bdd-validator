import { Component, EventEmitter, Input, OnInit, OnDestroy, Output, inject, ChangeDetectorRef, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { AccessClassesFilterValue } from '../models/user-access-filters.model';
import { UserAccessService } from '../services/user-access.service';
import { FilterPanelBase } from '@shared/components/filter-panel-base/filter-panel-base';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';

@Component({
  selector: 'app-access-classes-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatInputModule,
    NgxMatSelectSearchModule,
    FilterPanelBase
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './access-classes-filter-panel.html',
  styleUrl: './access-classes-filter-panel.scss'
})
export class AccessClassesFilterPanel implements OnInit, OnDestroy {
  @Input() currentFilters: AccessClassesFilterValue | null = null;
  @Input() userId: string | null = null;
  @Output() apply = new EventEmitter<AccessClassesFilterValue>();
  @Output() close = new EventEmitter<void>();

  filterForm: FormGroup;
  private userAccessService = inject(UserAccessService);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  // Filter options - loaded from API
  periodOptions = ['After', 'Before'];
  isLoadingFilters = false;

  // Searchable dropdown signals
  classOptions = signal<string[]>([]);
  readonly classSearchControl = new FormControl('');
  private readonly classSearch = signal('');

  readonly filteredClassOptions = computed(() => {
    const search = this.classSearch().toLowerCase();
    const options = this.classOptions();
    if (!search) return options;
    return options.filter(opt => opt.toLowerCase().includes(search));
  });

  constructor(private fb: FormBuilder) {
    this.filterForm = this.fb.group({
      class: [null],
      effectiveDatePeriod: [null],
      effectiveDate: [null],
      terminationDatePeriod: [null],
      terminationDate: [null]
    });

    this.classSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.classSearch.set(value || ''));
  }

  ngOnInit(): void {
    if (this.currentFilters) {
      this.filterForm.patchValue(this.currentFilters, { emitEvent: false });
    }

    // Load filter dropdown options from API
    this.loadFilterOptions();
    this.setupValidation();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupValidation(): void {
    // Watch effective date changes — dynamically require period when date is set
    this.filterForm.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateEffectivePeriod();
      });

    this.filterForm.get('effectiveDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateEffectivePeriod();
      });

    // Watch termination date changes — dynamically require period when date is set
    this.filterForm.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateTerminationPeriod();
      });

    this.filterForm.get('terminationDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateTerminationPeriod();
      });
  }

  private validateEffectivePeriod(): void {
    const effectiveDate = this.filterForm.get('effectiveDate')?.value;
    const periodControl = this.filterForm.get('effectiveDatePeriod');

    if (effectiveDate) {
      periodControl?.setValidators([Validators.required]);
      periodControl?.markAsTouched();
    } else {
      periodControl?.clearValidators();
    }
    periodControl?.updateValueAndValidity({ emitEvent: false });
    this.cdr.markForCheck();
  }

  private validateTerminationPeriod(): void {
    const terminationDate = this.filterForm.get('terminationDate')?.value;
    const periodControl = this.filterForm.get('terminationDatePeriod');

    if (terminationDate) {
      periodControl?.setValidators([Validators.required]);
      periodControl?.markAsTouched();
    } else {
      periodControl?.clearValidators();
    }
    periodControl?.updateValueAndValidity({ emitEvent: false });
    this.cdr.markForCheck();
  }

  loadFilterOptions(): void {
    if (!this.userId) {
      this.classOptions.set([]);
      return;
    }

    this.isLoadingFilters = true;
    this.userAccessService.getUserClassOptions(this.userId).subscribe({
      next: (data) => {
        this.classOptions.set(data.map(d => d.code));
        this.isLoadingFilters = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading user class options:', error);
        this.classOptions.set([]);
        this.isLoadingFilters = false;
      }
    });
  }

  /** Validate date input while typing — uses DateFieldValidationUtility pattern */
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

  onApply(): void {
    this.validateEffectivePeriod();
    this.validateTerminationPeriod();

    if (this.filterForm.invalid) {
      return;
    }

    const formValue = this.filterForm.value;
    const filterValue: AccessClassesFilterValue = {
      ...formValue,
      effectiveDate: formValue.effectiveDate
        ? this.formatDateToYMD(formValue.effectiveDate)
        : null,
      terminationDate: formValue.terminationDate
        ? this.formatDateToYMD(formValue.terminationDate)
        : null
    };
    this.apply.emit(filterValue);
  }

  private formatDateToYMD(dateValue: any): string {
    const d = new Date(dateValue);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  onClear(): void {
    this.filterForm.reset({
      class: null,
      effectiveDatePeriod: null,
      effectiveDate: null,
      terminationDatePeriod: null,
      terminationDate: null
    });
    this.classSearchControl.setValue('');
    this.cdr.markForCheck();
  }

  onClose(): void {
    this.close.emit();
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

  get isApplyDisabled(): boolean {
    if (this.filterForm.invalid) return true;

    if (this.filterForm.get('effectiveDate')?.hasError('invalidDate') ||
        this.filterForm.get('effectiveDate')?.hasError('matDatepickerParse') ||
        this.filterForm.get('terminationDate')?.hasError('invalidDate') ||
        this.filterForm.get('terminationDate')?.hasError('matDatepickerParse')) {
      return true;
    }

    const formValue = this.filterForm.value;
    const hasAnyValue =
      (formValue.class !== null && formValue.class !== '') ||
      (formValue.effectiveDatePeriod !== null && formValue.effectiveDatePeriod !== '') ||
      formValue.effectiveDate !== null ||
      (formValue.terminationDatePeriod !== null && formValue.terminationDatePeriod !== '') ||
      formValue.terminationDate !== null;

    return !hasAnyValue;
  }
}
