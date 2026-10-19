import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
  Input,
  ChangeDetectorRef,
  inject,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors, AsyncValidatorFn } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, ErrorStateMatcher } from '@angular/material/core';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { SnackbarService } from '@shared/services/snackbar.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil, finalize, distinctUntilChanged, of, timer, Observable } from 'rxjs';
import { map, catchError, switchMap, debounceTime } from 'rxjs/operators';
import moment, { Moment } from 'moment';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { HeaderService } from '@shared/services/header.service';
import { LoginService } from '@shared/services/login.service';
import { DefineOrderChargesService } from '../services/define-order-charges.service';
import { OrderChargeModel, OrderChargeCreateDto, OrderChargeUpdateDto } from '../models/define-order-charges.model';

@Component({
  selector: 'app-add-edit-order-charges',
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
    MatMomentDateModule,
    MatProgressSpinnerModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './add-edit-order-charges.html',
  styleUrls: ['./add-edit-order-charges.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddEditOrderCharges implements OnInit, OnChanges, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `add-edit-order-charges-${AddEditOrderCharges.nextId++}`;

  @Input() mode: 'add' | 'edit' = 'add';
  @Input() data: OrderChargeModel | null = null;
  @Output() closePanel = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<OrderChargeModel>();

  private fb = inject(FormBuilder);
  private service = inject(DefineOrderChargesService);
  private snackbarService = inject(SnackbarService);
  private cdr = inject(ChangeDetectorRef);
  private readonly headerService = inject(HeaderService);
  private readonly loginService = inject(LoginService);

  form!: FormGroup;
  panelTitle = '';
  isSaving = false;

  // Date validation properties
  minDate: Moment;
  targetMinDate: Moment;
  private lastChangedDateField: 'effective' | 'target' | null = null;

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getEffectiveDateError()
  );
  targetDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getTargetDateError()
  );
  orderNumberErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control: AbstractControl | null): boolean => {
      if (!control) return false;
      const isTouchedOrDirty = control.dirty || control.touched;
      if (!isTouchedOrDirty) return false;
      const hasFormError = this.form?.hasError('orderNumberRequired') || false;
      const hasFieldError = control.invalid;
      return hasFormError || hasFieldError;
    }
  };

  private get chapterOffset(): string { return this.headerService.chapterTimeZone(); }

  // Edit mode display values
  editModeValues = {
    serviceCode: '',
    effectiveDate: '',
    lastModified: ''
  };

  // Original values for composite key (edit mode)
  private originalValues = {
    serviceCode: '',
    effectiveDate: ''
  };

  // Dropdown options
  modifyChargeOptions = [
    { value: 'Yes', label: 'Yes' },
    { value: 'No', label: 'No' }
  ];

  chargeTypeOptions = [
    { value: 'Debit', label: 'Debit' },
    { value: 'Credit', label: 'Credit' }
  ];

  shipmentChargeOptions = [
    { value: 'Y', label: 'Y - Yes Entry at shipment' },
    { value: 'N', label: 'N - No' },
    { value: 'S', label: 'S - Default' },
    { value: 'B', label: 'B - Box' }
  ];

  orderNumberOptions = [
    { value: 'Yes', label: 'Yes' },
    { value: 'No', label: 'No' }
  ];

  private destroy$ = new Subject<void>();

  constructor() {
    this.minDate = this.getChapterMinDate();
    this.targetMinDate = this.minDate;

    effect(() => {
      this.minDate = this.getChapterMinDate();
      this.updateTargetMinDate();
    });
  }

  /**
   * Async validator to check for duplicate service code
   * Error code 0319 from Forms
   */
  private duplicateServiceCodeValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value || control.value.length === 0) {
        return of(null);
      }

      const serviceCode = control.value.trim().toUpperCase();
      const chapterId = this.headerService.getCurrentChapterId() || '';

      // Skip validation in edit mode
      if (this.mode === 'edit') {
        return of(null);
      }

      return timer(500).pipe(
        switchMap(() => this.service.checkDuplicateServiceCode(serviceCode, chapterId)),
        map(exists => exists ? { duplicateServiceCode: true } : null),
        catchError(() => of(null))
      );
    };
  }

  /**
   * Async validator to check if billing code is active
   * Error code 0247 from Forms
   */
  private billingCodeValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value || control.value.length === 0) {
        return of(null);
      }

      const billingCode = control.value.trim().toUpperCase();

      return timer(500).pipe(
        switchMap(() => this.service.validateBillingCode(billingCode)),
        map(isValid => isValid ? null : { invalidBillingCode: true }),
        catchError(() => of(null))
      );
    };
  }

  /**
   * Conditional validator for Order Number field
   * Required when Charge Type is 'Credit'
   * Error code 0318 from Forms
   */
  private conditionalOrderNumberValidator() {
    return (formGroup: AbstractControl): ValidationErrors | null => {
      const chargeTypeControl = formGroup.get('chargeType');
      const orderNumberControl = formGroup.get('orderNumber');

      if (!chargeTypeControl || !orderNumberControl) {
        return null;
      }

      const chargeType = chargeTypeControl.value;
      const orderNumber = orderNumberControl.value;

      // If charge type is Credit, order number is required (Y or N both valid)
      if (chargeType === 'Credit' && (!orderNumber || orderNumber === '')) {
        return { orderNumberRequired: true };
      }

      return null;
    };
  }

  /**
   * Validator to ensure service code is uppercase
   */
  private upperCaseValidator() {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }
      const value = control.value as string;
      if (value !== value.toUpperCase()) {
        return { notUpperCase: true };
      }
      return null;
    };
  }

  /**
   * Validator for Charge Type field
   * Must be 'Debit' or 'Credit'
   * Corresponds to CRDBI validation in Oracle Forms (error 7309)
   */
  private validChargeTypeValidator() {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }
      const value = control.value;
      if (value !== 'Debit' && value !== 'Credit') {
        return { invalidChargeType: true };
      }
      return null;
    };
  }

  /**
   * Validator for Shipment Charge field
   * Must be Y, N, S, or B
   * Error code 7321 from Forms
   */
  private validShipmentChargeValidator() {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }
      const value = control.value;
      if (!['Y', 'N', 'S', 'B'].includes(value)) {
        return { invalidShipmentCharge: true };
      }
      return null;
    };
  }

  /**
   * Validator for Effective Date
   * Must not be in the past for new records
   * Error code 0501 from Forms
   */
  private effectiveDateNotPastValidator() {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value || this.mode === 'edit') {
        return null;
      }

      const effectiveDate = moment(control.value);
      if (!effectiveDate.isValid()) {
        return null; // Let the date picker handle invalid dates
      }

      const today = this.getChapterMinDate();
      if (effectiveDate.isBefore(today, 'day')) {
        return { effectiveDatePast: true };
      }

      return null;
    };
  }

  private chargeRangeValidator() {
    return (control: AbstractControl): ValidationErrors | null => {
      if (control.value === null || control.value === undefined || control.value === '') {
        return null;
      }
      const strVal = String(control.value).trim();
      if (strVal === '' || strVal === '-' || strVal === '+' || strVal === '.') {
        return { invalidCharge: true };
      }
      const num = parseFloat(strVal);
      if (isNaN(num)) {
        return { invalidCharge: true };
      }
      if (num > 99999.99) {
        return { max: true };
      }
      if (num < -9999.99) {
        return { min: true };
      }
      const decimalParts = strVal.replace(/^[+-]/, '').split('.');
      if (decimalParts.length === 2 && decimalParts[1].length > 2) {
        return { maxDecimal: true };
      }
      return null;
    };
  }

  onChargeKeydown(event: KeyboardEvent): void {
    const allowed = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (allowed.includes(event.key)) return;
    if (event.ctrlKey || event.metaKey) return;

    const input = event.target as HTMLInputElement;
    const value = input.value;
    const selStart = input.selectionStart ?? 0;
    const selEnd = input.selectionEnd ?? 0;
    const selectedText = value.substring(selStart, selEnd);
    const newValue = value.substring(0, selStart) + event.key + value.substring(selEnd);

    if (event.key === '-' || event.key === '+') {
      if (selStart !== 0 || ((value.includes('-') || value.includes('+')) && !selectedText.includes('-') && !selectedText.includes('+'))) {
        event.preventDefault();
      }
      return;
    }

    if (event.key === '.') {
      if (value.includes('.') && !selectedText.includes('.')) {
        event.preventDefault();
      }
      return;
    }

    if (!/^\d$/.test(event.key)) {
      event.preventDefault();
      return;
    }

    if (!this.isChargeWithinLimits(newValue)) {
      event.preventDefault();
    }
  }

  private isChargeWithinLimits(value: string): boolean {
    const isNegative = value.startsWith('-');
    const stripped = value.replace(/^[+-]/, '');
    const parts = stripped.split('.');
    const integerPart = parts[0] || '';
    const decimalPart = parts[1] || '';
    const maxIntDigits = isNegative ? 4 : 5;
    if (integerPart.length > maxIntDigits) return false;
    if (decimalPart.length > 2) return false;
    return true;
  }

  onChargeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value;
    const cleaned = value.replace(/[^0-9.+\-]/g, '');
    if (cleaned !== value) {
      value = cleaned;
      input.value = value;
    }
    if (value && !this.isChargeWithinLimits(value)) {
      const corrected = this.truncateChargeValue(value);
      input.value = corrected;
      value = corrected;
    }
    const numericValue = value.trim() === '' ? null : value;
    this.form.get('charge')?.setValue(numericValue, { emitEvent: true });
  }

  private truncateChargeValue(value: string): string {
    const isNegative = value.startsWith('-');
    const hasPlus = value.startsWith('+');
    const stripped = value.replace(/^[+-]/, '');
    const parts = stripped.split('.');
    const maxIntDigits = isNegative ? 4 : 5;
    let integerPart = (parts[0] || '').substring(0, maxIntDigits);
    let decimalPart = parts.length > 1 ? (parts[1] || '').substring(0, 2) : '';
    const prefix = isNegative ? '-' : hasPlus ? '+' : '';
    return prefix + integerPart + (parts.length > 1 ? '.' + decimalPart : '');
  }

  onChargePaste(event: ClipboardEvent): void {
    const pasted = event.clipboardData?.getData('text')?.trim() || '';
    if (!/^[+-]?\d*\.?\d{0,2}$/.test(pasted)) {
      event.preventDefault();
      return;
    }
    if (!this.isChargeWithinLimits(pasted)) {
      event.preventDefault();
    }
  }

  ngOnInit(): void {
    this.initializeForm();
    this.updatePanelTitle();

    if (this.mode === 'edit') {
      // Do not call setupEditModeValidators - no fields are required
      this.populateFormForEdit();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mode'] || changes['data']) {
      if (!changes['mode']?.firstChange && !changes['data']?.firstChange) {
        this.updatePanelTitle();

        if (this.mode === 'add') {
          this.resetFormForAddMode();
        } else if (this.mode === 'edit') {
          this.populateFormForEdit();
        }

        this.cdr.markForCheck();
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private getChapterMinDate(): Moment {
    const chapterDate = DateFieldValidationUtility.getMinDate(this.chapterOffset);
    return moment.utc(chapterDate.format('YYYY-MM-DD'), 'YYYY-MM-DD');
  }

  private updateTargetMinDate(): void {
    const effectiveValue = this.form?.get('effectiveDate')?.value;
    let effectiveMoment: Moment | null = null;

    if (effectiveValue && moment.isMoment(effectiveValue) && effectiveValue.isValid()) {
      effectiveMoment = effectiveValue.clone();
    } else if (effectiveValue instanceof Date && !isNaN(effectiveValue.getTime())) {
      effectiveMoment = moment(effectiveValue);
    }

    if (effectiveMoment) {
      this.targetMinDate = effectiveMoment.isAfter(this.minDate) ? effectiveMoment : this.minDate.clone();
    } else {
      this.targetMinDate = this.minDate;
    }
  }

  private initializeForm(): void {
    this.form = this.fb.group({
      serviceCode: ['',
        [Validators.required, Validators.maxLength(5), this.upperCaseValidator()],
        [this.duplicateServiceCodeValidator(), this.billingCodeValidator()]
      ],
      serviceCodeDescription: ['', [Validators.required, Validators.maxLength(50)]],
      charge: [null, [Validators.required, this.chargeRangeValidator()]],
      modifyCharge: [null, [Validators.required]],
      chargeType: [null, [Validators.required, this.validChargeTypeValidator()]],
      shipmentCharge: [null, [this.validShipmentChargeValidator()]],
      orderNumber: [null],
      effectiveDate: [null, [Validators.required, this.effectiveDateNotPastValidator()]],
      targetDate: [null]
    }, {
      validators: [
        DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'targetDate'),
        this.conditionalOrderNumberValidator()
      ]
    });

    // Setup date change listeners (NO valueChanges - use template events)
    this.form.get('effectiveDate')?.valueChanges
      .pipe(
        distinctUntilChanged((prev, curr) => {
          if (!prev && !curr) return true;
          if (!prev || !curr) return false;
          return moment(prev).format('YYYY-MM-DD') === moment(curr).format('YYYY-MM-DD');
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.updateTargetMinDate();
      });

    // Listen to Charge Type changes to trigger conditional validation for Order Number
    this.form.get('chargeType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.form.updateValueAndValidity({ emitEvent: false });
        // Trigger change detection to update error state matcher
        this.cdr.markForCheck();
      });

    // Listen to Order Number changes to trigger conditional validation
    this.form.get('orderNumber')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.form.updateValueAndValidity({ emitEvent: false });
        this.cdr.markForCheck();
      });

    // Ensure change detection runs for all form changes (OnPush)
    this.form.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.cdr.markForCheck();
      });

    this.form.statusChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.cdr.markForCheck();
      });
  }

  private updatePanelTitle(): void {
    this.panelTitle = this.mode === 'add' ? 'Add New Order Charge' : 'Edit Order Charge';
  }

  private resetFormForAddMode(): void {
    // Reset edit mode display values
    this.editModeValues = {
      serviceCode: '',
      effectiveDate: '',
      lastModified: ''
    };

    // Reset original values
    this.originalValues = {
      serviceCode: '',
      effectiveDate: ''
    };

    // Reset form without emitting events to prevent triggering validation errors
    this.form.reset({}, { emitEvent: false });

    this.form.markAsUntouched();
    this.form.markAsPristine();

    // Enable all fields in add mode
    this.form.get('serviceCode')?.enable({ emitEvent: false });
    this.form.get('effectiveDate')?.enable({ emitEvent: false });

    // Restore validators for service code and effective date
    this.form.get('serviceCode')?.setValidators([
      Validators.required,
      Validators.maxLength(5),
      this.upperCaseValidator()
    ]);
    this.form.get('serviceCode')?.setAsyncValidators([
      this.duplicateServiceCodeValidator(),
      this.billingCodeValidator()
    ]);
    this.form.get('effectiveDate')?.setValidators([
      Validators.required,
      this.effectiveDateNotPastValidator()
    ]);

    // Update validity without emitting events
    this.form.get('serviceCode')?.updateValueAndValidity({ emitEvent: false });
    this.form.get('effectiveDate')?.updateValueAndValidity({ emitEvent: false });

    // Reset target min date
    this.targetMinDate = this.minDate;
  }

  private populateFormForEdit(): void {
    if (!this.data) return;

    // Store original values for composite key
    this.originalValues = {
      serviceCode: this.data.serviceCode,
      effectiveDate: this.data.effectiveDate
    };

    // Set edit mode display values
    this.editModeValues = {
      serviceCode: this.data.serviceCode,
      effectiveDate: this.data.effectiveDate,
      lastModified: this.data.lastModifiedDate
        ? `Last Modified: ${this.formatDateTime(this.data.lastModifiedDate)}`
        : ''
    };

    // Disable service code and effective date (composite key)
    this.form.get('serviceCode')?.disable();
    this.form.get('effectiveDate')?.disable();
    this.form.get('serviceCode')?.clearValidators();
    this.form.get('serviceCode')?.clearAsyncValidators();
    this.form.get('effectiveDate')?.clearValidators();
    this.form.get('effectiveDate')?.clearAsyncValidators();
    this.form.get('serviceCode')?.updateValueAndValidity();
    this.form.get('effectiveDate')?.updateValueAndValidity();

    // Parse effective date for termination min date calculation
    const effDate = this.parseDisplayDate(this.data.effectiveDate);

    // Populate form
    this.form.patchValue({
      serviceCode: this.data.serviceCode,
      serviceCodeDescription: this.data.serviceCodeDescription,
      charge: this.data.charge,
      modifyCharge: this.data.modifyCharge,
      chargeType: this.data.chargeType,
      shipmentCharge: this.data.shipmentCharge,
      orderNumber: this.data.orderNumber,
      effectiveDate: effDate,
      targetDate: this.data.targetDate ? this.parseDisplayDate(this.data.targetDate) : null
    });

    this.updateTargetMinDate();
    this.cdr.markForCheck();
  }

  // Event handler for Service Code - force uppercase
  onServiceCodeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const cursorPosition = input.selectionStart;
    const upperValue = input.value.toUpperCase();

    this.form.get('serviceCode')?.setValue(upperValue, { emitEvent: false });

    // Restore cursor position
    if (cursorPosition !== null) {
      input.setSelectionRange(cursorPosition, cursorPosition);
    }
  }

  // Event handlers for date fields (NO subscriptions)
  onEffectiveDateInput(event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value,
      this.form.get('effectiveDate')
    );
  }

  onEffectiveDateChange(): void {
    this.lastChangedDateField = 'effective';
    this.updateTargetMinDate();
    this.form.get('effectiveDate')?.markAsTouched();
    this.form.get('effectiveDate')?.markAsDirty();
    this.form.updateValueAndValidity();
    this.cdr.markForCheck();
  }

  onTargetDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value,
      this.form.get('targetDate'),
      this.mode === 'edit'
    );
  }

  onTargetDateChange(): void {
    this.lastChangedDateField = 'target';
    this.form.get('targetDate')?.markAsTouched();
    this.form.get('targetDate')?.markAsDirty();
    this.form.updateValueAndValidity();
    this.cdr.markForCheck();
  }

  onSubmit(createAnother: boolean = false): void {
    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'targetDate');
    this.cdr.markForCheck();

    if (this.form.errors?.['dateRangeInvalid'] && !this.lastChangedDateField) {
      this.lastChangedDateField = 'effective';
    }

    if (this.mode === 'edit') {
      if (!this.isFormValid) {
        return;
      }
    } else if (this.form.invalid) {
      return;
    }

    this.isSaving = true;
    const formValue = this.form.getRawValue();

    let apiCall;

    if (this.mode === 'add') {
      const payload: OrderChargeCreateDto = {
        chargeCode: formValue.serviceCode?.trim().toUpperCase() || '',
        chargeCodeDesc: formValue.serviceCodeDescription?.trim() || '',
        charge: parseFloat(formValue.charge) || 0,
        editCharge: formValue.modifyCharge === 'Yes' ? 'Y' : 'N',
        chargeCodeType: formValue.chargeType === 'Debit' ? 'DB' : 'CR',
        shipFlag: formValue.shipmentCharge || 'N',
        crNcr: formValue.orderNumber === 'Yes' ? 'Y' : 'N',
        effectiveDate: DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate) || '',
        terminationDate: DateFieldValidationUtility.serializeDateForApi(formValue.targetDate)
      };
      apiCall = this.service.addOrderCharge(payload);
    } else {
      const payload: OrderChargeUpdateDto = {
        chargeCode: formValue.serviceCode?.trim().toUpperCase() || '',
        originalChargeCode: this.originalValues.serviceCode,
        chargeCodeDesc: formValue.serviceCodeDescription?.trim() || '',
        charge: parseFloat(formValue.charge) || 0,
        editCharge: formValue.modifyCharge === 'Yes' ? 'Y' : 'N',
        chargeCodeType: formValue.chargeType === 'Debit' ? 'DB' : 'CR',
        shipFlag: formValue.shipmentCharge || 'N',
        crNcr: formValue.orderNumber === 'Yes' ? 'Y' : 'N',
        effectiveDate: this.parseDisplayDateToApi(this.originalValues.effectiveDate),
        terminationDate: DateFieldValidationUtility.serializeDateForApi(formValue.targetDate)
      };
      apiCall = this.service.updateOrderCharge(payload);
    }

    apiCall
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isSaving = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response) => {
          const serviceCode = this.mode === 'add' ? formValue.serviceCode : this.originalValues.serviceCode;
          const message = this.mode === 'add'
            ? `New Order Charges for service code ${serviceCode} have been added.`
            : `New Order Charges for service code ${serviceCode} have been updated.`;

          this.snackbarService.showSuccess(message);
          this.saveSuccess.emit(response.data);

          if (createAnother && this.mode === 'add') {
            // Reset form for next entry
            this.form.reset();
            this.lastChangedDateField = null;
            this.cdr.markForCheck();
          } else {
            this.closePanel.emit();
          }
        },
        error: () => {}
      });
  }

  onCancel(): void {
    this.closePanel.emit();
  }

  onClearAll(): void {
    if (this.mode === 'edit' && this.data) {
      // Reset form to original values
      this.form.patchValue({
        serviceCode: this.data.serviceCode,
        serviceCodeDescription: this.data.serviceCodeDescription,
        charge: this.data.charge,
        modifyCharge: this.data.modifyCharge,
        chargeType: this.data.chargeType,
        shipmentCharge: this.data.shipmentCharge,
        orderNumber: this.data.orderNumber,
        effectiveDate: this.parseDisplayDate(this.data.effectiveDate),
        targetDate: this.data.targetDate ? this.parseDisplayDate(this.data.targetDate) : null
      });
      this.form.markAsPristine();
      this.form.markAsUntouched();
      this.cdr.markForCheck();
    }
  }

  get isFormValid(): boolean {
    if (this.mode === 'edit') {
      if (!this.form?.dirty) {
        return false;
      }
      const desc = this.form.get('serviceCodeDescription');
      const charge = this.form.get('charge');
      const modifyCharge = this.form.get('modifyCharge');
      const chargeType = this.form.get('chargeType');
      const orderNumber = this.form.get('orderNumber');
      const hasVisibleErrors =
        !!(desc?.touched && desc?.invalid) ||
        !!(charge?.touched && charge?.invalid) ||
        !!(modifyCharge?.touched && modifyCharge?.invalid) ||
        !!(chargeType?.touched && chargeType?.invalid) ||
        !!(orderNumber?.touched && orderNumber?.invalid) ||
        this.getEffectiveDateError() !== '' ||
        this.getTargetDateError() !== '' ||
        this.getOrderNumberError() !== '';
      return !hasVisibleErrors;
    } else {
      return this.areRequiredFieldsFilled() && this.form.valid;
    }
  }

  private areRequiredFieldsFilled(): boolean {
    const formValue = this.form.value;

    // Required fields for Add mode:
    // 1. Service Code
    // 2. Service Code Description
    // 3. Charge Type
    // 4. Effective Date

    const hasServiceCode = !!formValue.serviceCode && formValue.serviceCode.trim().length > 0;
    const hasDescription = !!formValue.serviceCodeDescription && formValue.serviceCodeDescription.trim().length > 0;
    const hasChargeType = !!formValue.chargeType && formValue.chargeType.length > 0;
    const hasEffectiveDate = formValue.effectiveDate !== null && formValue.effectiveDate !== undefined;

    // 5. Order Number is conditionally required when Charge Type = 'Credit'
    let hasOrderNumber = true;
    if (formValue.chargeType === 'Credit') {
      hasOrderNumber = !!formValue.orderNumber;
    }

    return hasServiceCode && hasDescription && hasChargeType && hasEffectiveDate && hasOrderNumber;
  }

  get isOrderNumberRequired(): boolean {
    return this.form?.get('chargeType')?.value === 'Credit';
  }

  // Error message getters
  getServiceCodeError(): string {
    const control = this.form.get('serviceCode');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('required')) return 'Service Code is required';
    if (control.hasError('maxlength')) return 'Maximum 5 characters';
    if (control.hasError('notUpperCase')) return 'Service Code must be uppercase';
    if (control.hasError('duplicateServiceCode')) return 'Service Code already exists (Error 0319)';
    if (control.hasError('invalidBillingCode')) return 'Invalid or inactive billing code (Error 0247)';
    return '';
  }

  getServiceCodeDescriptionError(): string {
    const control = this.form.get('serviceCodeDescription');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('required')) return 'Service Code Description is required';
    if (control.hasError('maxlength')) return 'Maximum 50 characters';
    return '';
  }

  getChargeError(): string {
    const control = this.form.get('charge');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('required')) return 'Charge is required';
    if (control.hasError('invalidCharge')) return 'Enter a valid number';
    if (control.hasError('max')) return 'Max. charge : 99999.99';
    if (control.hasError('min')) return 'Min. charge : -9999.99';
    if (control.hasError('maxDecimal')) return 'Maximum 2 decimal places allowed';
    return '';
  }

  getChargeTypeError(): string {
    const control = this.form.get('chargeType');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('required')) return 'Charge Type is required';
    if (control.hasError('invalidChargeType')) return 'Invalid charge type (Error 7309)';
    return '';
  }

  getModifyChargeError(): string {
    const control = this.form.get('modifyCharge');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('required')) return 'Modify Charge is required';
    return '';
  }

  getShipmentChargeError(): string {
    const control = this.form.get('shipmentCharge');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('invalidShipmentCharge')) return 'Shipment Charge must be Y, N, S, or B (Error 7321)';
    return '';
  }

  getOrderNumberError(): string {
    const control = this.form.get('orderNumber');
    if (!control || !(control.touched || control.dirty)) return '';
    if (this.form.hasError('orderNumberRequired')) {
      return 'Order Number is required when Charge Type is Credit';
    }
    return '';
  }

  getEffectiveDateError(): string {
    const control = this.form.get('effectiveDate');
    if (!control || !(control.touched || control.dirty)) return '';

    // Required validation
    if (control.hasError('required')) {
      return 'Effective Date is required';
    }

    // Check for invalid date format errors
    if (control.hasError('matDatepickerParse')) {
      return 'Effective Date is invalid';
    }

    if (control.hasError('invalidDateFormat') || control.hasError('invalidDate')) {
      return 'Effective Date is invalid';
    }

    if (control.hasError('effectiveDatePast')) {
      return 'Effective Date cannot be in the past';
    }

    // Cross-field validation
    const formErrors = this.lastChangedDateField === 'effective' ? this.form.errors : null;
    if (formErrors?.['dateRangeInvalid']) {
      return 'Effective Date must be before Termination Date';
    }

    return '';
  }

  getTargetDateError(): string {
    const control = this.form.get('targetDate');
    if (!control || !(control.touched || control.dirty)) return '';

    // Check for invalid date format errors
    if (control.hasError('matDatepickerParse')) {
      return 'Termination Date is invalid';
    }

    if (control.hasError('invalidDateFormat') || control.hasError('invalidDate')) {
      return 'Termination Date is invalid';
    }

    // Termination Date is always optional - never show required error
    // (skip control.hasError('required') check)

    if (control.hasError('terminationDatePast')) {
      return 'Termination Date cannot be in the past';
    }

    // Cross-field validation
    const formErrors = this.lastChangedDateField === 'target' ? this.form.errors : null;
    if (formErrors?.['dateRangeInvalid']) {
      return 'Termination Date must be after Effective Date';
    }

    return '';
  }

  // Helper methods
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;

  private parseDisplayDate(dateStr: string): Date | null {
    if (!dateStr) return null;
    const m = moment(dateStr, 'DD-MMM-YYYY', true);
    return m.isValid() ? m.toDate() : null;
  }

  private parseDisplayDateToApi(dateStr: string): string {
    if (!dateStr) return '';
    const m = moment(dateStr, 'DD-MMM-YYYY', true);
    return m.isValid() ? m.format('YYYY-MM-DD') : '';
  }

  private formatDateTime(dateStr: string): string {
    if (!dateStr) return '';

    const m = moment(dateStr);
    if (!m.isValid()) return dateStr;

    // Get timezone abbreviation from header service
    const timezoneOffset = this.headerService.chapterTimeZone();
    const timezoneAbbr = this.getTimezoneAbbreviation(timezoneOffset);

    // Format: DD-MMM-YYYY, HH:mm TIMEZONE
    return `${m.format('DD-MMM-YYYY, HH:mm')} ${timezoneAbbr}`;
  }

  private getTimezoneAbbreviation(offset: string): string {
    // Map common timezone offsets to abbreviations
    // Note: Some offsets are used by multiple timezones (e.g., -05:00 for EST/CDT)
    // We use the most common abbreviation for each offset
    const timezoneMap: { [key: string]: string } = {
      '-08:00': 'PST',  // Pacific Standard Time
      '-07:00': 'PDT',  // Pacific Daylight Time / MST (Mountain Standard)
      '-06:00': 'CST',  // Central Standard Time / MDT (Mountain Daylight)
      '-05:00': 'EST',  // Eastern Standard Time / CDT (Central Daylight)
      '-04:00': 'EDT',  // Eastern Daylight Time
      '+00:00': 'UTC',  // Coordinated Universal Time
      '+05:30': 'IST'   // India Standard Time
    };

    return timezoneMap[offset] || offset;
  }

  shouldShowServiceCodeHint(): boolean {
    const value = this.form.get('serviceCode')?.value || '';
    return value.length > 0;
  }

  shouldShowDescriptionHint(): boolean {
    const value = this.form.get('serviceCodeDescription')?.value || '';
    return value.length > 0;
  }

  get serviceCodeCharCount(): string {
    const value = this.form.get('serviceCode')?.value || '';
    const remaining = 5 - value.length;
    return `${remaining}/5`;
  }

  get descriptionCharCount(): string {
    const value = this.form.get('serviceCodeDescription')?.value || '';
    const remaining = 50 - value.length;
    return `Characters remaining: ${remaining}/50`;
  }
}
