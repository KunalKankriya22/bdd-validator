import { Component, EventEmitter, Input, Output, OnInit, OnChanges, SimpleChanges, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, ErrorStateMatcher } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { SnackbarService } from '@shared/services/snackbar.service';
import { MatTableModule } from '@angular/material/table';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { forkJoin, Subject, takeUntil } from 'rxjs';

import { PoolCompatibilityMatrixService } from '../services/pool-compatibility-matrix.service';
import { VALIDATION_POOL_COMPATIBILITY_MATRIX } from 'src/app/core/constants/validation.constants';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ProductTypeOption, WorkOptionModel } from '../models/pool-compatibility-matrix.model';
import { HeaderService } from '@shared/services/header.service';
import moment, { Moment } from 'moment';

@Component({
  selector: 'app-add-edit-pool-compatibility-matrix',
  standalone: true,
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    MatDatepickerModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule,
    MatTableModule,
    NgxMatSelectSearchModule
  ],
  templateUrl: './add-edit-pool-compatibility-matrix.html',
  styleUrls: ['./add-edit-pool-compatibility-matrix.scss'],
})
export class AddEditPoolCompatibilityMatrix implements OnInit, OnChanges, OnDestroy {
  @ViewChild('effectiveDateInput') effectiveDateInput?: ElementRef<HTMLInputElement>;
  @ViewChild('terminationDateInput') terminationDateInput?: ElementRef<HTMLInputElement>;

  @Input() mode: 'add' | 'edit' = 'add';
  @Input() data: any = null;
  @Output() closePanel = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<void>();
  @Output() modeChange = new EventEmitter<'add' | 'edit'>();

  form!: FormGroup;
  panelTitle!: string;
  minDate = DateFieldValidationUtility.getMinDate();

  // Minimum date for termination datepicker: max(effectiveDate, today)
  get terminationMinDate() {
    const effectiveDate = this.form.get('effectiveDate')?.value;
    if (effectiveDate) {
      const effMoment = moment.isMoment(effectiveDate) ? effectiveDate : moment(effectiveDate);
      return effMoment.isAfter(this.minDate) ? effMoment : this.minDate;
    }
    return this.minDate;
  }

  readonly VALIDATION = VALIDATION_POOL_COMPATIBILITY_MATRIX.POOL_COMPATIBILITY_MATRIX_TABLE;

  workOptionOptions: WorkOptionModel[] = [];
  inventoryProductTypeOptions: ProductTypeOption[] = [];
  finishedProductTypeOptions: ProductTypeOption[] = [];

  // Search controls
  workOptionSearchControl = new FormControl('');
  inventorySearchControl = new FormControl('');
  finishedSearchControl = new FormControl('');

  // Filtered options
  filteredWorkOptionOptions: WorkOptionModel[] = [];
  filteredInventoryOptions: ProductTypeOption[] = [];
  filteredFinishedOptions: ProductTypeOption[] = [];

  // Temporary list for add mode
  addedProducts: any[] = [];
  displayedColumns: string[] = ['workOption', 'inventoryProductType', 'finishedInventoryProductType', 'effectiveDate', 'terminationDate', 'actions'];

  private initialFormSnapshot: string = '';
  private lastChangedDateField: 'effective' | 'termination' | null = null;
  private destroy$ = new Subject<void>();

  effDateErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control: FormControl | null): boolean => {
      if (!control) return false;
      return (control.touched || control.dirty) && !!this.getEffectiveDateError();
    }
  };

  termDateErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control: FormControl | null): boolean => {
      if (!control) return false;
      return (control.touched || control.dirty) && !!this.getTerminationDateError();
    }
  };

  constructor(
    private snackbarService: SnackbarService,
    private fb: FormBuilder,
    private poolCompatibilityMatrixService: PoolCompatibilityMatrixService,
    private headerService: HeaderService,
    private dateAdapter: DateAdapter<Moment>
  ) {}

  ngOnInit(): void {
    this.setupPanel();
    this.setupSearchFilters();
    this.subscribeToChapterChanges();
    this.setupDateFieldTracking();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mode'] || changes['data']) {
      if (!changes['mode']?.firstChange && !changes['data']?.firstChange) {
        this.setupPanel();
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearchFilters(): void {
    // Work Option search
    this.workOptionSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search || '').toLowerCase();
        this.filteredWorkOptionOptions = this.workOptionOptions.filter(option =>
          option.code.toLowerCase().includes(term) ||
          option.description?.toLowerCase().includes(term)
        );
      });

    // Inventory search
    this.inventorySearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search || '').toLowerCase();
        this.filteredInventoryOptions = this.inventoryProductTypeOptions.filter(option =>
          option.productType.toLowerCase().includes(term) ||
          option.description?.toLowerCase().includes(term)
        );
      });

    // Finished search
    this.finishedSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search || '').toLowerCase();
        this.filteredFinishedOptions = this.finishedProductTypeOptions.filter(option =>
          option.productType.toLowerCase().includes(term) ||
          option.description?.toLowerCase().includes(term)
        );
      });
  }

  private setupPanel(): void {
    this.panelTitle = this.mode === 'add' ? 'Add New Record' : 'Edit Record';

    const record = this.data || {};

    // Initialize form
    const effectiveDateValidators = this.mode === 'add'
      ? [Validators.required, DateFieldValidationUtility.effectiveDateNotPastValidator()]
      : [Validators.required];

    this.form = this.fb.group({
      workOption: [
        { value: '', disabled: this.mode === 'edit' },
        [Validators.required, Validators.maxLength(this.VALIDATION.LIMITS.WORK_OPTION_MAX_LENGTH)]
      ],
      inventoryProductType: [
        '',
        [Validators.required]
      ],
      finishedInventoryProductType: [
        '',
        [Validators.required]
      ],
      effectiveDate: [
        null,
        effectiveDateValidators
      ],
      terminationDate: [null, [DateFieldValidationUtility.terminationDateNotPastValidator()]]
    }, { validators: [DateFieldValidationUtility.dateRangeValidator()] });

    // Setup mode-specific validators
    if (this.mode === 'edit') {
      DateFieldValidationUtility.setupEditModeValidators(this.form);
      // Re-add termination date past validator for edit mode (setupEditModeValidators clears it)
      const termDateControl = this.form.get('terminationDate');
      if (termDateControl) {
        const existingValidators = termDateControl.validator ? [termDateControl.validator] : [];
        termDateControl.setValidators([
          ...existingValidators,
          DateFieldValidationUtility.terminationDateNotPastValidator()
        ]);
        termDateControl.updateValueAndValidity();
      }
    } else {
      DateFieldValidationUtility.setupAddModeValidators(this.form);
    }

    // Reset added products for add mode
    if (this.mode === 'add') {
      this.addedProducts = [];
    }

    // Load dropdowns first, then populate form with data
    this.loadDropdowns(record);
  }

  onCancel(): void {
    this.closePanel.emit();
  }

  onAdd(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.value;

    // Check for duplicate combination
    const isDuplicate = this.addedProducts.some(product =>
      product.workOption === formValue.workOption &&
      product.inventoryProductType === formValue.inventoryProductType &&
      product.finishedInventoryProductType === formValue.finishedInventoryProductType
    );

    if (isDuplicate) {
      this.showNotification('Error 0069: Duplicate values', 'error');
      return;
    }

    // Check if inventory product type and finished inventory product type are the same
    if (formValue.inventoryProductType === formValue.finishedInventoryProductType) {
      this.showNotification('Inventory Product Type and Finished Inventory Product Type cannot be the same', 'error');
      return;
    }

    const product = {
      workOption: formValue.workOption,
      inventoryProductType: formValue.inventoryProductType,
      finishedInventoryProductType: formValue.finishedInventoryProductType,
      effectiveDate: formValue.effectiveDate,
      terminationDate: formValue.terminationDate,
      effectiveDateFormatted: formValue.effectiveDate ? this.formatDateDisplay(formValue.effectiveDate) : '',
      terminationDateFormatted: formValue.terminationDate ? this.formatDateDisplay(formValue.terminationDate) : ''
    };

    // Create new array reference for change detection
    this.addedProducts = [...this.addedProducts, product];

    // Reset form and search controls for next entry
    this.form.reset();
    this.form.markAsUntouched();
    this.workOptionSearchControl.setValue('');
    this.inventorySearchControl.setValue('');
    this.finishedSearchControl.setValue('');
  }

  deleteProduct(index: number): void {
    // Create new array reference for change detection
    this.addedProducts = this.addedProducts.filter((_, i) => i !== index);
  }

  onSave(): void {
    if (this.mode === 'add') {
      // Check if there are products in the temporary list
      if (this.addedProducts.length === 0) {
        this.snackbarService.showError('Please add at least one product before saving.');
        return;
      }

      // Create individual API calls for each product
      const createRequests = this.addedProducts.map(product => {
        const payload = {
          workOption: product.workOption,
          inventoryProductType: product.inventoryProductType,
          finishedInventoryProductType: product.finishedInventoryProductType,
          effectiveDate: product.effectiveDate ? this.formatDate(product.effectiveDate) : '',
          terminationDate: product.terminationDate ? this.formatDate(product.terminationDate) : undefined
        };
        return this.poolCompatibilityMatrixService.createPoolCompatibilityMatrix(payload);
      });

      // Execute all requests in parallel
      forkJoin(createRequests).subscribe({
        next: (responses) => {
          const successMessage = this.addedProducts.length === 1
            ? 'The record has been added successfully.'
            : `${this.addedProducts.length} records have been added successfully.`;
          this.showNotification(successMessage, 'success');
          this.saveSuccess.emit();
          this.closePanel.emit();
        },
        error: () => {
          // Error handled by auth interceptor
        }
      });
    }

    if (this.mode === 'edit') {
      const raw = this.form.getRawValue();
      const record = this.data || {};

      // Check if inventory product type and finished inventory product type are the same
      if (raw.inventoryProductType === raw.finishedInventoryProductType) {
        this.showNotification('Inventory Product Type and Finished Inventory Product Type cannot be the same', 'error');
        return;
      }

      const payload = {
        chapterId: record.chapterId,
        workOption: raw.workOption,
        inventoryProductType: raw.inventoryProductType,
        finishedInventoryProductType: raw.finishedInventoryProductType,
        originalInventoryProductType: record.inventoryProductType || raw.inventoryProductType,
        originalFinishedInventoryProductType: record.finishedInventoryProductType || raw.finishedInventoryProductType,
        effectiveDate: raw.effectiveDate ? this.formatDate(raw.effectiveDate) : '',
        terminationDate: raw.terminationDate ? this.formatDate(raw.terminationDate) : undefined
      };

      this.poolCompatibilityMatrixService.updatePoolCompatibilityMatrix(payload).subscribe({
        next: (response: any) => {
          this.showNotification(response.message || 'Record updated successfully.', 'success');
          this.saveSuccess.emit();
          this.closePanel.emit();
        },
        error: () => {
          // Error handled by auth interceptor
        }
      });
    }
  }

  loadDropdowns(record?: any): void {
    forkJoin({
      workOptions: this.poolCompatibilityMatrixService.getWorkOptions(),
      inventoryTypes: this.poolCompatibilityMatrixService.getInventoryProductTypes(),
      finishedTypes: this.poolCompatibilityMatrixService.getFinishedProductTypes()
    }).subscribe({
      next: (res) => {
        this.workOptionOptions = res.workOptions || [];
        this.inventoryProductTypeOptions = res.inventoryTypes || [];
        this.finishedProductTypeOptions = res.finishedTypes || [];

        // Initialize filtered arrays
        this.filteredWorkOptionOptions = [...this.workOptionOptions];
        this.filteredInventoryOptions = [...this.inventoryProductTypeOptions];
        this.filteredFinishedOptions = [...this.finishedProductTypeOptions];

        // After dropdowns are loaded, populate form with record data
        if (record && Object.keys(record).length > 0) {
          // Ensure current record's product types are in the dropdown options
          // (they may be terminated/expired and not in the active list)
          if (record.inventoryProductType &&
              !this.inventoryProductTypeOptions.some(o => o.productType === record.inventoryProductType)) {
            this.inventoryProductTypeOptions = [
              ...this.inventoryProductTypeOptions,
              { productType: record.inventoryProductType, description: record.inventoryProductType }
            ];
          }
          if (record.finishedInventoryProductType &&
              !this.finishedProductTypeOptions.some(o => o.productType === record.finishedInventoryProductType)) {
            this.finishedProductTypeOptions = [
              ...this.finishedProductTypeOptions,
              { productType: record.finishedInventoryProductType, description: record.finishedInventoryProductType }
            ];
          }

          this.form.patchValue({
            workOption: record.workOption || '',
            inventoryProductType: record.inventoryProductType || '',
            finishedInventoryProductType: record.finishedInventoryProductType || '',
            effectiveDate: record.effectiveDate ? moment(record.effectiveDate) : null,
            terminationDate: record.terminationDate ? moment(record.terminationDate) : null
          });

          if (this.mode === 'edit') {
            this.initialFormSnapshot = this.getFormSnapshot();
          }
        }
      },
      error: () => {
      }
    });
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Close the panel when chapter changes to prevent stale data
        this.closePanel.emit();
      });
  }

  private setupDateFieldTracking(): void {
    // Track which date field was last changed for cross-field error display
    this.form.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'effective';
        this.form.get('terminationDate')?.updateValueAndValidity({ emitEvent: false });
      });

    this.form.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'termination';
        this.validateTerminationDateInput();
      });

    // Listen to effective date changes to validate input (only in add mode)
    if (this.mode === 'add') {
      this.form.get('effectiveDate')?.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.validateEffectiveDateInput();
        });
    }
  }

  private formatDate(date: any): string {
    const dateObj = moment.isMoment(date) ? date.toDate() : date;
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T00:00:00`;
  }

  formatDateDisplay(date: any): string {
    if (!date) return '';
    const m = moment(date);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : '';
  }

  private showNotification(message: string, type: 'success' | 'error'): void {
    if (type === 'success') {
      this.snackbarService.showSuccess(message);
    } else {
      this.snackbarService.showError(message);
    }
  }

  private getFormSnapshot(): string {
    const val = this.form.getRawValue();
    return JSON.stringify({
      workOption: val.workOption || '',
      inventoryProductType: val.inventoryProductType || '',
      finishedInventoryProductType: val.finishedInventoryProductType || '',
      effectiveDate: val.effectiveDate ? (moment.isMoment(val.effectiveDate) ? val.effectiveDate.format('YYYY-MM-DD') : '') : '',
      terminationDate: val.terminationDate ? (moment.isMoment(val.terminationDate) ? val.terminationDate.format('YYYY-MM-DD') : '') : ''
    });
  }

  get isFormChanged(): boolean {
    if (this.mode === 'add') return this.addedProducts.length > 0;
    return this.getFormSnapshot() !== this.initialFormSnapshot;
  }

  get isFormValid(): boolean {
    if (this.mode === 'add') {
      // In add mode, save button is enabled when there are products in the list
      return this.addedProducts.length > 0;
    }

    // In edit mode, form must be valid and changed
    const isValid = this.form.valid;
    return isValid && this.isFormChanged;
  }

  get isAddButtonDisabled(): boolean {
    // Check if form is invalid
    if (this.form.invalid) {
      return true;
    }

    // Check if there are any date errors
    if (this.getEffectiveDateError() || this.getTerminationDateError()) {
      return true;
    }

    return false;
  }

  onEffectiveDateInput(): void {
    const control = this.form.get('effectiveDate');
    if (!control) return;

    control.markAsDirty();
    control.markAsTouched();

    // Validate immediately on input
    setTimeout(() => {
      this.validateEffectiveDateInput();
    }, 0);
  }

  onEffectiveDateBlur(): void {
    // Trigger validation after blur to ensure Material datepicker has parsed the input
    setTimeout(() => {
      const control = this.form.get('effectiveDate');
      const inputElement = this.effectiveDateInput?.nativeElement;
      const inputValue = inputElement?.value?.trim() || '';

      // Mark as touched to ensure error state is displayed
      control?.markAsTouched();

      // If there's input text but no parsed value, try to manually parse it
      if (inputValue && !control?.value) {
        const formats = Array.isArray(DD_MON_YYYY_FORMATS.parse.dateInput)
          ? DD_MON_YYYY_FORMATS.parse.dateInput
          : [DD_MON_YYYY_FORMATS.parse.dateInput];

        const parsed = this.dateAdapter.parse(inputValue, formats);

        if (parsed && moment.isMoment(parsed) && parsed.isValid()) {
          // Successfully parsed - set the value and update the input display
          control?.setValue(parsed);
          if (inputElement) {
            inputElement.value = this.dateAdapter.format(parsed, DD_MON_YYYY_FORMATS.display.dateInput);
          }
        }
      }

      this.validateEffectiveDateInput();
      control?.updateValueAndValidity();
    }, 0);
  }

  onTerminationDateInput(): void {
    const control = this.form.get('terminationDate');
    if (!control) return;

    control.markAsDirty();
    control.markAsTouched();

    // Validate immediately on input
    setTimeout(() => {
      this.validateTerminationDateInput();
    }, 0);
  }

  onTerminationDateBlur(): void {
    // Trigger validation after blur to ensure Material datepicker has parsed the input
    setTimeout(() => {
      const control = this.form.get('terminationDate');
      const inputElement = this.terminationDateInput?.nativeElement;
      const inputValue = inputElement?.value?.trim() || '';

      // Mark as touched to ensure error state is displayed
      control?.markAsTouched();

      // If there's input text but no parsed value, try to manually parse it
      if (inputValue && !control?.value) {
        const formats = Array.isArray(DD_MON_YYYY_FORMATS.parse.dateInput)
          ? DD_MON_YYYY_FORMATS.parse.dateInput
          : [DD_MON_YYYY_FORMATS.parse.dateInput];

        const parsed = this.dateAdapter.parse(inputValue, formats);

        if (parsed && moment.isMoment(parsed) && parsed.isValid()) {
          // Successfully parsed - set the value and update the input display
          control?.setValue(parsed);
          if (inputElement) {
            inputElement.value = this.dateAdapter.format(parsed, DD_MON_YYYY_FORMATS.display.dateInput);
          }
        }
      }

      this.validateTerminationDateInput();
      control?.updateValueAndValidity();
    }, 0);
  }

  private validateEffectiveDateInput(): void {
    const control = this.form.get('effectiveDate');
    const inputElement = this.effectiveDateInput?.nativeElement;
    const inputValue = inputElement?.value?.trim() || '';

    if (inputValue && !control?.value && control) {
      // Set custom error when input has text but value is null (invalid date)
      control.setErrors({ ...control.errors, invalidDate: true });
    } else if (control?.hasError('invalidDate') && (!inputValue || control?.value)) {
      // Clear custom error if input is empty or has valid value
      const errors = { ...control.errors };
      delete errors['invalidDate'];
      control.setErrors(Object.keys(errors).length > 0 ? errors : null);
    }
  }

  private validateTerminationDateInput(): void {
    const control = this.form.get('terminationDate');
    const inputElement = this.terminationDateInput?.nativeElement;
    const inputValue = inputElement?.value?.trim() || '';

    if (inputValue && !control?.value && control) {
      // Set custom error when input has text but value is null (invalid date)
      control.setErrors({ ...control.errors, invalidDate: true });
    } else if (control?.hasError('invalidDate') && (!inputValue || control?.value)) {
      // Clear custom error if input is empty or has valid value
      const errors = { ...control.errors };
      delete errors['invalidDate'];
      control.setErrors(Object.keys(errors).length > 0 ? errors : null);
    }
  }

  getEffectiveDateError(): string {
    const control = this.form.get('effectiveDate');
    if (!control) return '';

    // Priority 1: Check for custom invalid date error (set by validateEffectiveDateInput)
    if (control.hasError('invalidDate')) {
      return 'Effective Date is invalid';
    }

    // Priority 2: Check for parse errors
    if (control.hasError('matDatepickerParse')) {
      return 'Effective Date is invalid';
    }

    // Check if the native input has text but control value is null (unparseable input)
    // This handles cases where user types random text that Material doesn't recognize as a date
    const inputElement = this.effectiveDateInput?.nativeElement;
    const hasInputValue = inputElement && inputElement.value && inputElement.value.trim() !== '';
    if (hasInputValue && !control.value) {
      return 'Effective Date is invalid';
    }

    // Priority 3: Check other validation errors (only if touched/dirty)
    if (!(control.touched || control.dirty)) {
      return '';
    }

    if (control.hasError('required')) {
      return 'Effective Date is required';
    }
    if (control.hasError('effectiveDatePast')) {
      return 'Effective date cannot be prior to system date';
    }

    // Show dateRangeInvalid on effective date when it was the last changed field
    if (this.lastChangedDateField === 'effective' && this.form.errors?.['dateRangeInvalid']) {
      return 'Effective Date must be on or before Termination Date';
    }

    return '';
  }

  getTerminationDateError(): string {
    const control = this.form.get('terminationDate');
    if (!control) return '';

    // Priority 1: Check for custom invalid date error (set by validateTerminationDateInput)
    if (control.hasError('invalidDate')) {
      return 'Termination Date is invalid';
    }

    // Priority 2: Check for parse errors
    if (control.hasError('matDatepickerParse')) {
      return 'Termination Date is invalid';
    }

    // Check if the native input has text but control value is null (unparseable input)
    const inputElement = this.terminationDateInput?.nativeElement;
    const hasInputValue = inputElement && inputElement.value && inputElement.value.trim() !== '';
    if (hasInputValue && !control.value) {
      return 'Termination Date is invalid';
    }

    // Priority 3: Check other validation errors (only if touched/dirty)
    if (!(control.touched || control.dirty)) {
      return '';
    }

    // Check past date validation (before chapter date) first
    if (control.hasError('terminationDatePast')) {
      return 'Termination Date cannot be in the past';
    }

    // Then check cross-field validation (termination vs effective date)
    if (this.lastChangedDateField !== 'effective') {
      if (control.hasError('matDatepickerMin')) {
        return 'Termination Date must be on or after Effective Date';
      }

      if (this.form.errors?.['dateRangeInvalid']) {
        return 'Termination Date must be on or after Effective Date';
      }
    }

    return '';
  }
}
