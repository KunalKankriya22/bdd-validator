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
  computed,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MAT_DATE_FORMATS, DateAdapter } from '@angular/material/core';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';

export interface ManageErrorsFilterValue {
  machineTestId: string | null;
  effDatePeriod: string | null;
  effDate: Date | null;
  termDatePeriod: string | null;
  termDate: Date | null;
}

@Component({
  selector: 'app-manage-errors-filter-panel',
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
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }
  ],
  templateUrl: './manage-errors-filter-panel.html',
  styleUrls: ['./manage-errors-filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ManageErrorsFilterPanel implements OnInit, OnDestroy {
  @ViewChild('effDateInput') effDateInput?: ElementRef<HTMLInputElement>;
  @ViewChild('termDateInput') termDateInput?: ElementRef<HTMLInputElement>;

  @Input() currentFilters: ManageErrorsFilterValue | null = null;
  @Input() machineTestIds: string[] = [];
  @Output() apply = new EventEmitter<ManageErrorsFilterValue>();
  @Output() close = new EventEmitter<void>();

  filterForm!: FormGroup;
  hasChanges = false;
  hasActiveFilters = false;
  periodOptions = [
    { value: 'after', display: 'After' },
    { value: 'before', display: 'Before' }
  ];

  readonly machineTestIdSearchControl = new FormControl('');
  private readonly machineTestIdSearch = signal('');
  readonly filteredMachineTestIds = computed(() => {
    const search = this.machineTestIdSearch().toLowerCase();
    if (!search) return this.machineTestIds;
    return this.machineTestIds.filter(id => id.toLowerCase().includes(search));
  });

  private appliedFilterSnapshot!: string;
  private destroy$ = new Subject<void>();
  private effDateRawInput = '';
  private termDateRawInput = '';

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      machineTestId: [this.currentFilters?.machineTestId || null],
      effDatePeriod: [this.currentFilters?.effDatePeriod || null],
      effDate: [this.currentFilters?.effDate || null],
      termDatePeriod: [this.currentFilters?.termDatePeriod || null],
      termDate: [this.currentFilters?.termDate || null]
    });

    this.appliedFilterSnapshot = this.normalizeFormValue(this.filterForm.value);
    this.hasActiveFilters = this.checkHasActiveFilters();

    this.filterForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.hasChanges = this.normalizeFormValue(this.filterForm.value) !== this.appliedFilterSnapshot;
        this.hasActiveFilters = this.checkHasActiveFilters();
        this.cdr.markForCheck();
      });

    this.machineTestIdSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.machineTestIdSearch.set(value || ''));

    this.filterForm.get('effDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.validateEffDatePeriod());

    this.filterForm.get('effDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.validateEffDatePeriod());

    this.filterForm.get('termDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.validateTermDatePeriod());

    this.filterForm.get('termDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.validateTermDatePeriod());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private validateEffDatePeriod(): void {
    const effDate = this.filterForm.get('effDate')?.value;
    const effDatePeriod = this.filterForm.get('effDatePeriod')?.value;
    const periodControl = this.filterForm.get('effDatePeriod');

    if (effDate && !effDatePeriod) {
      periodControl?.setErrors({ required: true });
      periodControl?.markAsTouched();
    } else {
      periodControl?.setErrors(null);
    }
  }

  private validateTermDatePeriod(): void {
    const termDate = this.filterForm.get('termDate')?.value;
    const termDatePeriod = this.filterForm.get('termDatePeriod')?.value;
    const periodControl = this.filterForm.get('termDatePeriod');

    if (termDate && !termDatePeriod) {
      periodControl?.setErrors({ required: true });
      periodControl?.markAsTouched();
    } else {
      periodControl?.setErrors(null);
    }
  }

  private normalizeFormValue(formValue: ManageErrorsFilterValue): string {
    return JSON.stringify({
      machineTestId: formValue.machineTestId || null,
      effDatePeriod: formValue.effDatePeriod || null,
      effDate: formValue.effDate ? String(formValue.effDate) : null,
      termDatePeriod: formValue.termDatePeriod || null,
      termDate: formValue.termDate ? String(formValue.termDate) : null
    });
  }

  private checkHasActiveFilters(): boolean {
    const v = this.filterForm.value;
    const hasEffDateFilter = !!(v.effDatePeriod && v.effDate);
    const hasTermDateFilter = !!(v.termDatePeriod && v.termDate);
    return !!(v.machineTestId || hasEffDateFilter || hasTermDateFilter);
  }

  onEffDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const inputValue = input.value.trim();
    this.effDateRawInput = inputValue;

    const control = this.filterForm.get('effDate');
    if (!control) return;

    control.markAsDirty();
    control.markAsTouched();

    setTimeout(() => {
      if (inputValue && !control.value) {
        control.setErrors({ ...control.errors, invalidDate: true });
      }
      this.cdr.markForCheck();
    }, 0);
  }

  onEffDateBlur(input: HTMLInputElement): void {
    setTimeout(() => {
      const control = this.filterForm.get('effDate');
      if (!control) return;

      control.markAsTouched();
      const controlValue = control.value;
      const inputValue = input.value.trim();

      if (controlValue && typeof controlValue === 'object' && controlValue.isValid?.()) {
        const formatted = DateFieldValidationUtility.formatDateForUI(controlValue).toUpperCase();
        input.value = formatted;
        this.effDateRawInput = formatted;
        control.setErrors(null);
      } else if (inputValue && !controlValue) {
        input.value = this.effDateRawInput;
        if (!control.hasError('invalidDate')) {
          control.setErrors({ invalidDate: true });
        }
      } else if (!inputValue) {
        control.setErrors(null);
      }

      this.cdr.markForCheck();
    }, 0);
  }

  onTermDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const inputValue = input.value.trim();
    this.termDateRawInput = inputValue;

    const control = this.filterForm.get('termDate');
    if (!control) return;

    control.markAsDirty();
    control.markAsTouched();

    setTimeout(() => {
      if (inputValue && !control.value) {
        control.setErrors({ ...control.errors, invalidDate: true });
      }
      this.cdr.markForCheck();
    }, 0);
  }

  onTermDateBlur(input: HTMLInputElement): void {
    setTimeout(() => {
      const control = this.filterForm.get('termDate');
      if (!control) return;

      control.markAsTouched();
      const controlValue = control.value;
      const inputValue = input.value.trim();

      if (controlValue && typeof controlValue === 'object' && controlValue.isValid?.()) {
        const formatted = DateFieldValidationUtility.formatDateForUI(controlValue).toUpperCase();
        input.value = formatted;
        this.termDateRawInput = formatted;
        control.setErrors(null);
      } else if (inputValue && !controlValue) {
        input.value = this.termDateRawInput;
        if (!control.hasError('invalidDate')) {
          control.setErrors({ invalidDate: true });
        }
      } else if (!inputValue) {
        control.setErrors(null);
      }

      this.cdr.markForCheck();
    }, 0);
  }

  getEffDateError(): string {
    return DateFieldValidationUtility.getDateErrorMessage(
      this.filterForm.get('effDate'),
      this.filterForm.errors,
      'Effective Date'
    );
  }

  getTermDateError(): string {
    return DateFieldValidationUtility.getDateErrorMessage(
      this.filterForm.get('termDate'),
      this.filterForm.errors,
      'Termination Date'
    );
  }

  getEffDatePeriodError(): string {
    const control = this.filterForm.get('effDatePeriod');
    if (control?.hasError('required') && control?.touched) return 'Period is required';
    return '';
  }

  getTermDatePeriodError(): string {
    const control = this.filterForm.get('termDatePeriod');
    if (control?.hasError('required') && control?.touched) return 'Period is required';
    return '';
  }

  onApply(): void {
    this.filterForm.markAllAsTouched();
    this.validateEffDatePeriod();
    this.validateTermDatePeriod();

    if (this.filterForm.invalid) return;

    const v = this.filterForm.value;
    const effDatePeriod = v.effDate ? (v.effDatePeriod || null) : null;
    const termDatePeriod = v.termDate ? (v.termDatePeriod || null) : null;

    const filters: ManageErrorsFilterValue = {
      machineTestId: v.machineTestId || null,
      effDatePeriod,
      effDate: v.effDate || null,
      termDatePeriod,
      termDate: v.termDate || null
    };

    this.appliedFilterSnapshot = this.normalizeFormValue(this.filterForm.value);
    this.hasChanges = false;
    this.cdr.markForCheck();

    this.apply.emit(filters);
  }

  onClear(): void {
    this.machineTestIdSearchControl.setValue('');
    this.filterForm.reset({
      machineTestId: null,
      effDatePeriod: null,
      effDate: null,
      termDatePeriod: null,
      termDate: null
    });
  }

  onClose(): void {
    this.close.emit();
  }
}
