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
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DATE_FORMATS, DateAdapter } from '@angular/material/core';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { TerritoryFilterValue, LookupItem } from '../models/territory.model';
import { Subject, takeUntil } from 'rxjs';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

@Component({
  selector: 'app-territory-filter-panel',
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
    MatCheckboxModule,
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }
  ],
  templateUrl: './territory-filter-panel.html',
  styleUrls: ['./territory-filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TerritoryFilterPanel implements OnInit, OnDestroy {
  @Input() currentFilters: TerritoryFilterValue | null = null;
  @Input() groups: LookupItem[] = [];
  @Input() types: LookupItem[] = [];
  @Output() apply = new EventEmitter<TerritoryFilterValue>();
  @Output() close = new EventEmitter<void>();

  filterForm!: FormGroup;
  hasChanges = false;
  hasActiveFilters = false;
  periodOptions = [
    { value: 'after', display: 'After' },
    { value: 'before', display: 'Before' }
  ];

  // Search controls and filtered options
  groupSearchControl = new FormControl('');
  filteredGroups: LookupItem[] = [];

  typeSearchControl = new FormControl('');
  filteredTypes: LookupItem[] = [];

  // Store raw input text to preserve invalid dates
  private effDateRawInput = '';
  private termDateRawInput = '';

  private appliedFilterSnapshot!: string;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private dateAdapter: DateAdapter<any>
  ) {}

  ngOnInit(): void {
    // Initialize filtered options
    this.filteredGroups = [...this.groups];
    this.filteredTypes = [...this.types];

    this.filterForm = this.fb.group({
      showTerminated: [this.currentFilters?.showTerminated ?? false],
      territoryGroup: [this.currentFilters?.territoryGroup || null],
      territoryType: [this.currentFilters?.territoryType || null],
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

    this.setupSearchControls();
    this.setupValidation();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearchControls(): void {
    // Group search
    this.groupSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search as string || '').toLowerCase();
        this.filteredGroups = this.groups.filter(group =>
          group.code.toLowerCase().includes(term) ||
          group.description.toLowerCase().includes(term)
        );
        this.cdr.markForCheck();
      });

    // Type search
    this.typeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search as string || '').toLowerCase();
        this.filteredTypes = this.types.filter(type =>
          type.code.toLowerCase().includes(term) ||
          type.description.toLowerCase().includes(term)
        );
        this.cdr.markForCheck();
      });
  }

  private setupValidation(): void {
    // When effective date changes, validate that period is selected if date is set
    this.filterForm.get('effDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        const periodControl = this.filterForm.get('effDatePeriod');
        if (value && periodControl) {
          periodControl.markAsTouched();
          periodControl.updateValueAndValidity({ emitEvent: false });
          this.cdr.markForCheck();
        }
      });

    // When effective date period changes, re-validate
    this.filterForm.get('effDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.filterForm.get('effDatePeriod')?.updateValueAndValidity({ emitEvent: false });
        this.cdr.markForCheck();
      });

    // When termination date changes, validate that period is selected if date is set
    this.filterForm.get('termDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        const periodControl = this.filterForm.get('termDatePeriod');
        if (value && periodControl) {
          periodControl.markAsTouched();
          periodControl.updateValueAndValidity({ emitEvent: false });
          this.cdr.markForCheck();
        }
      });

    // When termination date period changes, re-validate
    this.filterForm.get('termDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.filterForm.get('termDatePeriod')?.updateValueAndValidity({ emitEvent: false });
        this.cdr.markForCheck();
      });

    // Set validators
    this.filterForm.get('effDatePeriod')?.setValidators([this.effDatePeriodValidator.bind(this)]);
    this.filterForm.get('termDatePeriod')?.setValidators([this.termDatePeriodValidator.bind(this)]);
  }

  private normalizeFormValue(formValue: any): string {
    return JSON.stringify({
      showTerminated: formValue.showTerminated ?? false,
      territoryGroup: formValue.territoryGroup || null,
      territoryType: formValue.territoryType || null,
      effDatePeriod: formValue.effDatePeriod || null,
      effDate: formValue.effDate ? String(formValue.effDate) : null,
      termDatePeriod: formValue.termDatePeriod || null,
      termDate: formValue.termDate ? String(formValue.termDate) : null
    });
  }

  private checkHasActiveFilters(): boolean {
    const formValue = this.filterForm.value;

    // Check if any filter is set (excluding showTerminated which defaults to false)
    return !!(
      formValue.territoryGroup ||
      formValue.territoryType ||
      formValue.effDatePeriod ||
      formValue.effDate ||
      formValue.termDatePeriod ||
      formValue.termDate ||
      formValue.showTerminated === true
    );
  }

  private effDatePeriodValidator(control: AbstractControl): ValidationErrors | null {
    if (!this.filterForm) return null;

    const effDate = this.filterForm.get('effDate')?.value;
    const effDatePeriod = control.value;

    if (effDate && !effDatePeriod) {
      return { required: true };
    }

    return null;
  }

  private termDatePeriodValidator(control: AbstractControl): ValidationErrors | null {
    if (!this.filterForm) return null;

    const termDate = this.filterForm.get('termDate')?.value;
    const termDatePeriod = control.value;

    if (termDate && !termDatePeriod) {
      return { required: true };
    }

    return null;
  }

  onApply(): void {
    // Mark all fields as touched to show validation errors
    this.filterForm.markAllAsTouched();

    // Prevent apply if form is invalid
    if (this.filterForm.invalid) {
      return;
    }

    const formValue = this.filterForm.value;

    // Clear period if date is not set (period without date doesn't make sense)
    const effDatePeriod = formValue.effDate ? (formValue.effDatePeriod || null) : null;
    const termDatePeriod = formValue.termDate ? (formValue.termDatePeriod || null) : null;

    const filters: TerritoryFilterValue = {
      showTerminated: formValue.showTerminated ?? false,
      territoryGroup: formValue.territoryGroup || null,
      territoryType: formValue.territoryType || null,
      effDatePeriod: effDatePeriod,
      effDate: formValue.effDate || null,
      termDatePeriod: termDatePeriod,
      termDate: formValue.termDate || null
    };

    this.appliedFilterSnapshot = this.normalizeFormValue(this.filterForm.value);
    this.hasChanges = false;
    this.cdr.markForCheck();

    this.apply.emit(filters);
  }

  onClear(): void {
    this.filterForm.reset({
      showTerminated: false,
      territoryGroup: null,
      territoryType: null,
      effDatePeriod: null,
      effDate: null,
      termDatePeriod: null,
      termDate: null
    });

    this.effDateRawInput = '';
    this.termDateRawInput = '';
  }

  onClose(): void {
    this.close.emit();
  }

  getEffDatePeriodError(): string {
    const control = this.filterForm.get('effDatePeriod');
    if (!control || !control.touched) return '';
    if (control.hasError('required')) return 'Period is required';
    return '';
  }

  getTermDatePeriodError(): string {
    const control = this.filterForm.get('termDatePeriod');
    if (!control || !control.touched) return '';
    if (control.hasError('required')) return 'Period is required';
    return '';
  }

  get hasDateErrors(): boolean {
    const effDate = this.filterForm.get('effDate');
    const termDate = this.filterForm.get('termDate');
    return !!(
      effDate?.hasError('matDatepickerParse') ||
      effDate?.hasError('invalidDateFormat') ||
      termDate?.hasError('matDatepickerParse') ||
      termDate?.hasError('invalidDateFormat')
    );
  }

  onEffDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.effDateRawInput = input.value;
    const control = this.filterForm.get('effDate');
    if (control) {
      control.markAsTouched();
      if (input.value && !this.dateAdapter.parse(input.value, DD_MON_YYYY_FORMATS.parse.dateInput)) {
        control.setErrors({ ...control.errors, invalidDateFormat: true });
      } else if (input.value) {
        const { invalidDateFormat: _, ...rest } = control.errors ?? {};
        control.setErrors(Object.keys(rest).length ? rest : null);
      }
    }
    this.cdr.markForCheck();
  }

  onEffDateBlur(input: HTMLInputElement): void {
    setTimeout(() => {
      const control = this.filterForm.get('effDate');
      if (!control?.value && this.effDateRawInput && !input.value) {
        input.value = this.effDateRawInput;
      }
    }, 0);
  }

  onTermDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.termDateRawInput = input.value;
    const control = this.filterForm.get('termDate');
    if (control) {
      control.markAsTouched();
      if (input.value && !this.dateAdapter.parse(input.value, DD_MON_YYYY_FORMATS.parse.dateInput)) {
        control.setErrors({ ...control.errors, invalidDateFormat: true });
      } else if (input.value) {
        const { invalidDateFormat: _, ...rest } = control.errors ?? {};
        control.setErrors(Object.keys(rest).length ? rest : null);
      }
    }
    this.cdr.markForCheck();
  }

  onTermDateBlur(input: HTMLInputElement): void {
    setTimeout(() => {
      const control = this.filterForm.get('termDate');
      if (!control?.value && this.termDateRawInput && !input.value) {
        input.value = this.termDateRawInput;
      }
    }, 0);
  }
}
