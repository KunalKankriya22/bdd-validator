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
import { MAT_DATE_FORMATS, DateAdapter } from '@angular/material/core';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { IdTypeOption, SourceIdOption } from '../models/api-temp-data-query.model';
import { Subject, takeUntil } from 'rxjs';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import moment from 'moment';

export interface ApiTempDataQueryFilterValue {
  idType?: string;
  sourceId?: string;
  periodType?: string;
  insertDate?: Date | null;
}

@Component({
  selector: 'app-api-temp-data-query-filter-panel',
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
  templateUrl: './api-temp-data-query-filter-panel.html',
  styleUrls: ['./api-temp-data-query-filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ApiTempDataQueryFilterPanel implements OnInit, OnDestroy {
  @Input() currentFilters: ApiTempDataQueryFilterValue | null = null;
  @Input() idTypes: IdTypeOption[] = [];
  @Input() sourceIds: SourceIdOption[] = [];
  @Output() apply = new EventEmitter<ApiTempDataQueryFilterValue>();
  @Output() close = new EventEmitter<void>();

  filterForm!: FormGroup;
  hasChanges = false;
  hasActiveFilters = false;
  periodTypes = [
    { value: 'after', label: 'After' },
    { value: 'before', label: 'Before' }
  ];

  // Search controls and filtered options
  idTypeSearchControl = new FormControl('');
  filteredIdTypes: IdTypeOption[] = [];

  sourceIdSearchControl = new FormControl('');
  filteredSourceIds: SourceIdOption[] = [];

  private appliedFilterSnapshot!: string;
  private destroy$ = new Subject<void>();
  private insertDateRawInput = '';

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Initialize filtered options
    this.filteredIdTypes = [...this.idTypes];
    this.filteredSourceIds = [...this.sourceIds];

    this.filterForm = this.fb.group({
      idType: [this.currentFilters?.idType || null],
      sourceId: [this.currentFilters?.sourceId || null],
      periodType: [this.currentFilters?.periodType || null],
      insertDate: [this.currentFilters?.insertDate || null, [DateFieldValidationUtility.validDateValidator()]]
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
    // ID Type search
    this.idTypeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search as string || '').toLowerCase();
        this.filteredIdTypes = this.idTypes.filter(idType =>
          idType.code.toLowerCase().includes(term) ||
          idType.description.toLowerCase().includes(term)
        );
        this.cdr.markForCheck();
      });

    // Source ID search
    this.sourceIdSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search as string || '').toLowerCase();
        this.filteredSourceIds = this.sourceIds.filter(source =>
          source.sourceId.toLowerCase().includes(term)
        );
        this.cdr.markForCheck();
      });
  }

  private setupValidation(): void {
    // When insert date changes, validate that period is selected if date is set
    this.filterForm.get('insertDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        const periodControl = this.filterForm.get('periodType');

        if (value && periodControl) {
          periodControl.markAsTouched();
          periodControl.updateValueAndValidity({ emitEvent: false });
          this.cdr.markForCheck();
        }
      });

    // When period type changes, re-validate
    this.filterForm.get('periodType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.filterForm.get('periodType')?.updateValueAndValidity({ emitEvent: false });
        this.cdr.markForCheck();
      });

    // Set validators
    this.filterForm.get('periodType')?.setValidators([this.periodTypeValidator.bind(this)]);
  }

  private normalizeFormValue(formValue: any): string {
    return JSON.stringify({
      idType: formValue.idType || null,
      sourceId: formValue.sourceId || null,
      periodType: formValue.periodType || null,
      insertDate: formValue.insertDate ? String(formValue.insertDate) : null
    });
  }

  private checkHasActiveFilters(): boolean {
    const formValue = this.filterForm.value;

    return !!(
      formValue.idType ||
      formValue.sourceId ||
      formValue.periodType ||
      formValue.insertDate
    );
  }

  private periodTypeValidator(control: AbstractControl): ValidationErrors | null {
    if (!this.filterForm) return null;

    const insertDate = this.filterForm.get('insertDate')?.value;
    const periodType = control.value;

    if (insertDate && !periodType) {
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
    const periodType = formValue.insertDate ? (formValue.periodType || null) : null;

    const filters: ApiTempDataQueryFilterValue = {
      idType: formValue.idType || undefined,
      sourceId: formValue.sourceId || undefined,
      periodType: periodType || undefined,
      insertDate: formValue.insertDate || undefined
    };

    this.appliedFilterSnapshot = this.normalizeFormValue(this.filterForm.value);
    this.hasChanges = false;
    this.cdr.markForCheck();

    this.apply.emit(filters);
  }

  onClear(): void {
    this.filterForm.reset({
      idType: null,
      sourceId: null,
      periodType: null,
      insertDate: null
    });
  }

  onClose(): void {
    this.close.emit();
  }

  getPeriodTypeError(): string {
    const control = this.filterForm.get('periodType');
    if (!control || !control.touched) return '';
    if (control.hasError('required')) return 'Period is required';
    return '';
  }

  getInsertDateError(): string {
    const control = this.filterForm.get('insertDate');
    if (!control) return '';

    // If there's raw input but no value (adapter rejected it), show invalid date error
    if (this.insertDateRawInput && !control.value && control.hasError('invalidDateFormat')) {
      return 'Insert Date is invalid';
    }

    // Check for matDatepickerParse error (when user types invalid text)
    if (control.hasError('matDatepickerParse')) {
      return 'Insert Date is invalid';
    }

    // Check for invalidDate error (from validDateValidator)
    if (control.hasError('invalidDate')) {
      return 'Insert Date is invalid';
    }

    return '';
  }

  onDateInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const inputValue = input.value?.trim() || '';

    // Store raw input
    this.insertDateRawInput = inputValue;

    // Validate in real-time
    this.validateDateInput(inputValue);
  }

  onDateBlur(event: FocusEvent): void {
    const input = event.target as HTMLInputElement;
    const inputValue = input.value?.trim() || '';

    // Clear raw input if field is empty
    if (!inputValue) {
      this.insertDateRawInput = '';
    }

    // Validate when user leaves the field
    this.validateDateInput(inputValue);
  }

  private validateDateInput(inputValue: string): void {
    const control = this.filterForm.get('insertDate');
    if (!control) return;

    if (!inputValue) {
      // Clear manual validation errors if input is empty
      if (control.hasError('invalidDateFormat')) {
        const errors = { ...control.errors };
        delete errors['invalidDateFormat'];
        control.setErrors(Object.keys(errors).length > 0 ? errors : null);
      }
      return;
    }

    const trimmedInput = inputValue.trim().toUpperCase();

    // Try to parse the date using moment with strict parsing
    const parsedDate = moment(trimmedInput, ['DD-MMM-YYYY', 'DD/MMM/YYYY', 'DD-MM-YYYY', 'DD/MM/YYYY'], true);

    if (!parsedDate.isValid()) {
      // Date is invalid
      control.setErrors({ ...control.errors, invalidDateFormat: true });
      control.markAsTouched();
      this.cdr.markForCheck();
      return;
    }

    // If we reach here, date is valid - clear the invalidDateFormat error
    if (control.hasError('invalidDateFormat')) {
      const errors = { ...control.errors };
      delete errors['invalidDateFormat'];
      control.setErrors(Object.keys(errors).length > 0 ? errors : null);
      this.cdr.markForCheck();
    }
  }
}
