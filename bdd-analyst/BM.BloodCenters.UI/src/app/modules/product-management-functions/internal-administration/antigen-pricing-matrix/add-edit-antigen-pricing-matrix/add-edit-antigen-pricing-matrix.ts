import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { HeaderService } from '@shared/services/header.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import moment, { Moment } from 'moment';

import {
  AntigenPricingMatrixModel,
  AntigenPricingMatrixFormValue
} from '../models/antigen-pricing-matrix.model';

@Component({
  selector: 'app-add-edit-antigen-pricing-matrix',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
  ],
  templateUrl: './add-edit-antigen-pricing-matrix.html',
  styleUrls: ['./add-edit-antigen-pricing-matrix.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddEditAntigenPricingMatrixComponent implements OnInit, OnChanges, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly headerService = inject(HeaderService);
  public readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  @Input() mode: 'add' | 'edit' = 'add';
  @Input() data: AntigenPricingMatrixModel | null = null;

  @Output() save = new EventEmitter<AntigenPricingMatrixFormValue>();
  @Output() saveAndCreateAnother = new EventEmitter<AntigenPricingMatrixFormValue>();
  @Output() close = new EventEmitter<void>();

  form!: FormGroup;
  isSubmitting = false;
  errorMessage: string | null = null;

  /**
   * Reset submitting state when save fails
   * Called by parent component on error
   */
  resetSubmitting(): void {
    this.isSubmitting = false;
    this.cdr.markForCheck();
  }

  /**
   * Get remaining characters for Code field
   */
  getCodeCharactersRemaining(): number {
    const value = this.form.get('code')?.value || '';
    return 8 - value.length;
  }

  /**
   * Get remaining characters for Quantity field
   */
  getQuantityCharactersRemaining(): number {
    const value = this.form.get('quantity')?.value?.toString() || '';
    return 4 - value.length;
  }

  /**
   * Get remaining characters for Description field
   */
  getDescriptionCharactersRemaining(): number {
    const value = this.form.get('description')?.value || '';
    return 50 - value.length;
  }

  /**
   * Get formatted effective date for readonly display
   */
  getFormattedEffectiveDate(): string {
    const effDate = this.form.get('effDate')?.value;
    if (!effDate) return '';
    const date = moment(effDate);
    return date.format('DD-MMM-YYYY');
  }

  // Removed: Code dropdown search (Code is now a text input field)

  get dialogTitle(): string {
    return this.mode === 'add' ? 'Add New Price' : 'Edit Price';
  }

  get submitButtonLabel(): string {
    return this.mode === 'add' ? 'ADD' : 'SAVE';
  }

  get isFormValid(): boolean {
    // In edit mode, form must be valid AND dirty (changed)
    if (this.mode === 'edit') {
      return this.form.valid && this.form.dirty;
    }
    // In add mode, just needs to be valid
    return this.form.valid;
  }

  getFormattedModificationDate(): string {
    if (!this.data?.modificationDate) return '';

    const modDate = moment(this.data.modificationDate);
    const tz = this.headerService.chapterTimeZone() || 'UTC';
    return modDate.format('DD-MMM-YYYY, HH:mm') + ` (${tz})`;
  }

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getEffectiveDateError(),
  );
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getTerminationDateError(),
  );

  /**
   * Termination date filter: must be >= chapter's today AND >= effective date
   * Following venipuncture-attributes pattern for consistent behavior
   */
  terminationDateFilter = (date: moment.Moment | null): boolean => {
    if (!date) return true;

    const checkDate = moment(date).startOf('day');
    const chapterToday = moment().utcOffset(this.chapterOffset).startOf('day');
    const today = moment(chapterToday.format('YYYY-MM-DD')).startOf('day');

    // Block dates before chapter's local date
    if (checkDate.isBefore(today)) {
      return false;
    }

    // Must be >= effective date if set
    const effectiveDate = this.form?.get('effDate')?.value;
    if (effectiveDate) {
      const effDay = moment(effectiveDate).startOf('day');
      if (checkDate.isBefore(effDay)) {
        return false;
      }
    }

    return true;
  };

  private get chapterOffset(): string {
    return this.headerService.chapterTimeZone();
  }

  get minDate() {
    return DateFieldValidationUtility.getMinDate(this.chapterOffset);
  }

  constructor() {
    // Constructor simplified - DateFieldValidationUtility handles min date logic
  }

  ngOnInit(): void {
    this.initializeForm();
    this.setupModeValidators();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Re-initialize form when data or mode input changes
    if ((changes['data'] || changes['mode']) && this.form) {
      this.initializeForm();
      this.setupModeValidators();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    const effDate = this.data?.effDate ? moment(this.data.effDate, 'YYYY-MM-DD') : null;
    const termDate = this.data?.termDate ? moment(this.data.termDate, 'YYYY-MM-DD') : null;

    // Format existing price to 2 decimal places
    const formattedPrice = this.data?.price !== null && this.data?.price !== undefined
      ? this.formatPriceValue(this.data.price)
      : null;

    this.form = this.fb.group({
      code: [
        this.data?.code || null,
        [Validators.required, Validators.maxLength(8)]
      ],
      quantity: [
        this.data?.quantity || null,
        [Validators.required, Validators.min(1), Validators.max(9999)]
      ],
      price: [
        formattedPrice,
        [Validators.required, Validators.min(0.01), Validators.max(99999.99)]
      ],
      description: [
        this.data?.description || null,
        [Validators.required, Validators.maxLength(50)]
      ],
      effDate: [effDate, Validators.required],
      termDate: [termDate]
    }, {
      validators: [DateFieldValidationUtility.dateRangeValidator()]
    });

    // Re-validate termination date when effective date changes (for date range validation)
    this.form.get('effDate')?.valueChanges.subscribe(() => {
      this.form.get('termDate')?.updateValueAndValidity();
    });

    // Mark form as pristine and untouched on initialization
    this.form.markAsPristine();
    this.form.markAsUntouched();
  }

  private setupModeValidators(): void {
    if (this.mode === 'add') {
      DateFieldValidationUtility.setupAddModeValidators(this.form, this.chapterOffset);
    } else {
      DateFieldValidationUtility.setupEditModeValidators(this.form, this.chapterOffset);
    }
  }

  // Removed: setupSearchFilters and filterList methods (Code is now a text input field)

  onEffDateInput(event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value, this.form.get('effDate')
    );
  }

  onTermDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value, this.form.get('termDate'), this.mode === 'edit'
    );
  }

  getEffectiveDateError(): string {
    return DateFieldValidationUtility.getStartDateCrossFieldError(
      this.form.get('effDate'),
      'Effective Date',
      'Termination Date',
      this.form.errors
    );
  }

  getTerminationDateError(): string {
    return DateFieldValidationUtility.getEndDateCrossFieldError(
      this.form.get('termDate'),
      'Termination Date',
      'Effective Date',
      this.form.errors
    );
  }

  onSave(): void {
    if (this.form.valid) {
      this.isSubmitting = true;
      this.errorMessage = null;

      const formValue = this.form.getRawValue();
      this.save.emit(formValue);
    }
  }

  onSaveAndCreateAnother(): void {
    if (this.form.valid) {
      this.isSubmitting = true;
      this.errorMessage = null;

      const formValue = this.form.getRawValue();
      this.saveAndCreateAnother.emit(formValue);
    }
  }

  onClearAll(): void {
    if (this.mode === 'edit') {
      // In edit mode, only clear editable fields (code, price, description, termDate)
      // Keep readonly fields (quantity, effDate) with their original values
      this.form.patchValue({
        code: '',
        price: null,
        description: '',
        termDate: null
      });
      this.form.markAsPristine();
      this.form.markAsUntouched();
    } else {
      // In add mode, clear all fields
      this.form.reset();
    }
    this.errorMessage = null;
    this.cdr.markForCheck();
  }

  onCancel(): void {
    this.close.emit();
  }

  /**
   * Prevent entering more than 3 digits in quantity field
   * @param event - The keyboard event
   */
  preventQuantityOverflow(event: KeyboardEvent): void {
    const input = event.target as HTMLInputElement;
    const currentValue = input.value;
    const key = event.key;

    // Allow control keys (backspace, delete, arrow keys, tab, etc.)
    const controlKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab', 'Home', 'End'];
    if (controlKeys.includes(key) || event.ctrlKey || event.metaKey) {
      return;
    }

    // Only allow digits 0-9, block everything else
    if (!/^\d$/.test(key)) {
      event.preventDefault();
      return;
    }

    // Get the selection range
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;

    // Calculate what the new value would be
    const newValue = currentValue.substring(0, start) + key + currentValue.substring(end);

    // Prevent if it would exceed 4 characters (max quantity 9999)
    if (newValue.length > 4) {
      event.preventDefault();
    }
  }

  /**
   * Prevent entering price that exceeds 99999.99 format (5 digits + decimal + 2 digits = 8 chars max)
   * @param event - The keyboard event
   */
  preventPriceOverflow(event: KeyboardEvent): void {
    const input = event.target as HTMLInputElement;
    const key = event.key;

    // Allow control keys (backspace, delete, arrow keys, tab, etc.)
    const controlKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab', 'Home', 'End'];
    if (controlKeys.includes(key) || event.ctrlKey || event.metaKey) {
      return;
    }

    const currentValue = input.value || '';
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;

    // Allow decimal point if not already present
    if (key === '.') {
      if (currentValue.includes('.')) {
        event.preventDefault();
      }
      return;
    }

    // Only allow digits 0-9, block everything else (including e, E, +, -)
    if (!/^\d$/.test(key)) {
      event.preventDefault();
      return;
    }

    // Calculate what the new value would be after this keypress
    const beforeCursor = currentValue.substring(0, start);
    const afterCursor = currentValue.substring(end);
    const newValue = beforeCursor + key + afterCursor;

    // Split by decimal to check integer and decimal parts
    const parts = newValue.split('.');
    const integerPart = parts[0] || '';
    const decimalPart = parts[1] || '';

    // Prevent if integer part exceeds 5 digits
    if (integerPart.length > 5) {
      event.preventDefault();
      return;
    }

    // Prevent if decimal part exceeds 2 digits
    if (decimalPart.length > 2) {
      event.preventDefault();
      return;
    }

    // Final validation: prevent if value would exceed 99999.99
    const numValue = parseFloat(newValue);
    if (!isNaN(numValue) && numValue > 99999.99) {
      event.preventDefault();
    }
  }

  /**
   * Format price value to 2 decimal places
   * @param value - The price value to format
   * @returns Formatted price as number with 2 decimals
   */
  private formatPriceValue(value: number | string): number {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return 0;
    return parseFloat(numValue.toFixed(2));
  }

  /**
   * Handle price input blur event to format the value to 2 decimal places
   * @param event - The blur event
   */
  onPriceBlur(event: FocusEvent): void {
    const priceControl = this.form.get('price');
    if (!priceControl) return;

    const value = priceControl.value;
    if (value === null || value === undefined || value === '') {
      return;
    }

    const formattedValue = this.formatPriceValue(value);
    priceControl.setValue(formattedValue, { emitEvent: false });
    this.cdr.markForCheck();
  }

  /**
   * Get the display value for price field (always shows 2 decimal places)
   * @returns Formatted price string for display
   */
  getPriceDisplayValue(): string {
    const priceControl = this.form.get('price');
    const value = priceControl?.value;

    if (value === null || value === undefined || value === '') {
      return '';
    }

    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return '';

    return numValue.toFixed(2);
  }
}
