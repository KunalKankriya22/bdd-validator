import { Component, EventEmitter, Input, Output, OnInit, OnChanges, OnDestroy, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { ErrorStateMatcher } from '@angular/material/core';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import moment, { Moment } from 'moment';
import { Subject, takeUntil } from 'rxjs';

import { CustomerTierPricingDto, CreateCustomerTierPricingRequest, UpdateCustomerTierPricingDto } from '../models/enter-customer-tier-pricing.model';
import { EnterCustomerTierPricingApiService } from '../services/enter-customer-tier-pricing-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { dateFormatValidator } from 'src/app/core/utils/date-adapter.util';
import { convertUTCToTimezone } from '@shared/date/timezone.util';

@Component({
  selector: 'app-add-edit-customer-tier-pricing-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatMomentDateModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './add-edit-customer-tier-pricing.html',
  styleUrls: ['./add-edit-customer-tier-pricing.scss']
})
export class AddEditCustomerTierPricingPanel implements OnInit, OnChanges, OnDestroy {
  @Input() data: CustomerTierPricingDto | null = null;
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() customerId: string = '';
  @Input() productType: string = '';
  @Output() closePanel = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private service = inject(EnterCustomerTierPricingApiService);
  private snackbarService = inject(SnackbarService);
  private headerService = inject(HeaderService);
  private destroy$ = new Subject<void>();

  editForm!: FormGroup;
  isSaving = false;
  lastModifiedDisplay = '';

  minDate!: Moment;
  private lastChangedDateField: 'effective' | 'termination' | null = null;
  effDateErrorMatcher!: ErrorStateMatcher;
  termDateErrorMatcher!: ErrorStateMatcher;

  private originalUnitPrice: number | null = null;
  private originalTermDate: Moment | null = null;
  effDateUserModified = false;

  private get chapterOffset(): string {
    return this.headerService.chapterTimeZone();
  }

  terminationDateFilter = (date: Moment | null): boolean => {
    if (!date) return true;
    const checkDate = moment(date).startOf('day');
    const chapterToday = moment().utcOffset(this.chapterOffset).startOf('day');
    const today = moment(chapterToday.format('YYYY-MM-DD')).startOf('day');
    if (checkDate.isBefore(today)) return false;
    const effectiveDate = this.editForm?.get('effectiveDate')?.value;
    if (effectiveDate) {
      const effDay = moment(effectiveDate).startOf('day');
      if (checkDate.isBefore(effDay)) return false;
    }
    return true;
  };

  constructor() {
    this.initForm();
    this.effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEffectiveDateError());
    this.termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTerminationDateError());
  }

  ngOnInit(): void {
    this.minDate = DateFieldValidationUtility.getMinDate(this.chapterOffset);

    this.subscribeToChapterChanges();
    this.setupDateValidationListeners();

    if (this.mode === 'edit') {
      DateFieldValidationUtility.setupEditModeValidators(this.editForm, this.chapterOffset);
      this.applyEditModeTermDateValidators();
    } else {
      DateFieldValidationUtility.setupAddModeValidators(this.editForm, this.chapterOffset);
      this.setupAddModeWithDeferredEffDateValidation();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mode'] || changes['data']) {
      this.populateForm();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get panelTitle(): string {
    return this.mode === 'add' ? 'Add New Price' : 'Edit Price Details';
  }

  get effectiveDateDisplay(): string {
    if (!this.data?.effectiveDate) return '--';
    return DateFieldValidationUtility.formatDateForUI(moment(this.data.effectiveDate));
  }

  get isFormValid(): boolean {
    if (!this.editForm.valid) return false;
    if (this.mode === 'edit') {
      const formValue = this.editForm.getRawValue();
      const unitPriceChanged = Number(formValue.unitPrice) !== this.originalUnitPrice;
      const currentTerm = formValue.terminationDate ? moment(formValue.terminationDate) : null;
      const termDateChanged = currentTerm && this.originalTermDate
        ? !currentTerm.isSame(this.originalTermDate, 'day')
        : currentTerm !== this.originalTermDate;
      return unitPriceChanged || termDateChanged;
    }
    return true;
  }

  private initForm(): void {
    this.editForm = this.fb.group({
      unitPrice: [null, [Validators.required, Validators.min(0.01), Validators.max(999999.99)]],
      effectiveDate: [null, [Validators.required]],
      terminationDate: [null]
    }, {
      validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate')]
    });
  }

  private setupDateValidationListeners(): void {
    this.editForm.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => { this.lastChangedDateField = 'effective'; });

    this.editForm.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => { this.lastChangedDateField = 'termination'; });
  }

  private populateForm(): void {
    if (this.mode === 'edit' && this.data) {
      this.originalUnitPrice = this.data.unitPrice;
      const termDate = this.data.terminationDate ? moment(this.data.terminationDate) : null;
      this.originalTermDate = termDate;

      this.editForm.patchValue({
        unitPrice: this.data.unitPrice,
        effectiveDate: this.data.effectiveDate ? moment(this.data.effectiveDate) : null,
        terminationDate: termDate
      });

      DateFieldValidationUtility.setupEditModeValidators(this.editForm, this.chapterOffset);
      this.applyEditModeTermDateValidators();

      this.lastModifiedDisplay = this.data.lastModifiedDate
        ? `Last Modified: ${this.formatLastModified(this.data.lastModifiedDate)}`
        : '';
    } else {
      this.originalUnitPrice = null;
      this.originalTermDate = null;
      this.lastModifiedDisplay = '';
      this.effDateUserModified = false;
      this.editForm.reset();
      if (this.data) {
        this.editForm.patchValue({
          effectiveDate: this.data.effectiveDate ? moment(this.data.effectiveDate) : null,
          terminationDate: this.data.terminationDate ? moment(this.data.terminationDate) : null
        });
      }
      this.setupAddModeWithDeferredEffDateValidation();
    }

    this.editForm.markAsPristine();
    this.editForm.markAsUntouched();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.minDate = DateFieldValidationUtility.getMinDate(this.chapterOffset);
      });
  }

  getEffectiveDateError(): string {
    const formErrors = this.lastChangedDateField === 'effective' ? this.editForm.errors : null;
    return DateFieldValidationUtility.getStartDateCrossFieldError(
      this.editForm.get('effectiveDate'),
      'Effective Date',
      'Termination Date',
      formErrors
    );
  }

  getTerminationDateError(): string {
    const formErrors = this.lastChangedDateField === 'termination' ? this.editForm.errors : null;
    return DateFieldValidationUtility.getEndDateCrossFieldError(
      this.editForm.get('terminationDate'),
      'Termination Date',
      'Effective Date',
      formErrors
    );
  }

  getUnitPriceError(): string {
    const ctrl = this.editForm.get('unitPrice');
    if (!ctrl?.touched && !ctrl?.dirty) return '';
    if (ctrl?.hasError('required')) return 'Unit Price is required';
    if (ctrl?.hasError('min')) return 'Unit Price must be greater than 0';
    if (ctrl?.hasError('max')) return 'Maximum price 999999.99';
    return '';
  }

  onEffectiveDateInput(event: Event): void {
    this.onEffDateFieldInteraction();
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value,
      this.editForm.get('effectiveDate')
    );
  }

  onTerminationDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value,
      this.editForm.get('terminationDate'),
      this.mode === 'edit'
    );
  }

  onUnitPriceKeyDown(event: KeyboardEvent): void {
    const allowedKeys = [
      'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
      'ArrowLeft', 'ArrowRight', 'Home', 'End'
    ];
    if (allowedKeys.includes(event.key) || event.ctrlKey || event.metaKey) {
      return;
    }

    if (!/[\d.]/.test(event.key)) {
      event.preventDefault();
      return;
    }

    const input = event.target as HTMLInputElement;
    const value = input.value ?? '';
    const selStart = input.selectionStart ?? value.length;
    const selEnd = input.selectionEnd ?? value.length;
    const newValue = value.substring(0, selStart) + event.key + value.substring(selEnd);

    if (!/^\d{0,6}(\.\d{0,2})?$/.test(newValue)) {
      event.preventDefault();
    }
  }

  private applyEditModeTermDateValidators(): void {
    const termDateControl = this.editForm.get('terminationDate');
    if (termDateControl) {
      termDateControl.setValidators([
        dateFormatValidator(),
        DateFieldValidationUtility.validDateValidator(),
        DateFieldValidationUtility.terminationDateNotPastValidator()
      ]);
      termDateControl.updateValueAndValidity();
    }
  }

  private setupAddModeWithDeferredEffDateValidation(): void {
    const effControl = this.editForm.get('effectiveDate');
    const termControl = this.editForm.get('terminationDate');

    if (effControl) {
      effControl.clearValidators();
      const validators: ValidatorFn[] = [
        Validators.required,
        dateFormatValidator(),
        DateFieldValidationUtility.validDateValidator()
      ];
      if (this.effDateUserModified) {
        validators.push(DateFieldValidationUtility.effectiveDateNotPastValidator(this.chapterOffset));
      }
      effControl.setValidators(validators);
      effControl.enable();
      effControl.updateValueAndValidity();
    }

    if (termControl) {
      termControl.clearValidators();
      termControl.setValidators([
        dateFormatValidator(),
        DateFieldValidationUtility.validDateValidator(),
        DateFieldValidationUtility.terminationDateNotPastValidator(this.chapterOffset)
      ]);
      termControl.updateValueAndValidity();
    }
  }

  onEffDateFieldInteraction(): void {
    if (this.mode !== 'add' || this.effDateUserModified) return;
    this.effDateUserModified = true;
    const effControl = this.editForm.get('effectiveDate');
    if (effControl) {
      effControl.clearValidators();
      effControl.setValidators([
        Validators.required,
        dateFormatValidator(),
        DateFieldValidationUtility.validDateValidator(),
        DateFieldValidationUtility.effectiveDateNotPastValidator(this.chapterOffset)
      ]);
      effControl.updateValueAndValidity();
    }
  }

  onSave(): void {
    this.editForm.markAllAsTouched();
    if (this.mode === 'edit') {
      this.editForm.get('terminationDate')?.updateValueAndValidity();
    }
    DateFieldValidationUtility.clearOptionalDateErrors(this.editForm, 'terminationDate');

    if (this.editForm.errors?.['dateRangeInvalid']) {
      this.editForm.get('terminationDate')?.markAsTouched();
      return;
    }

    if (this.mode === 'add' && !this.editForm.valid) return;
    if (this.mode === 'edit' && !this.isFormValid) return;

    this.isSaving = true;
    const formValue = this.editForm.getRawValue();
    const terminationDateStr = formValue.terminationDate
      ? moment(formValue.terminationDate).format('YYYY-MM-DD')
      : null;

    if (this.mode === 'add') {
      const dto: CreateCustomerTierPricingRequest = {
        customerId: this.customerId,
        productType: this.productType,
        tierPricingItems: [{
          tier: this.data?.tier ?? 0,
          fromDay: parseInt(String(this.data?.minimumAge), 10) || 0,
          toDay: parseInt(String(this.data?.maximumAge), 10) || 0,
          unitPrice: Number(formValue.unitPrice),
          effectiveDate: moment(formValue.effectiveDate).format('YYYY-MM-DD'),
          terminationDate: terminationDateStr
        }]
      };

      this.service.createCustomerTierPricing(dto)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.isSaving = false;
            this.snackbarService.showSuccess(response.message || `New price added to Customer ID ${this.customerId}.`);
            this.saveSuccess.emit();
            this.closePanel.emit();
          },
          error: (error) => {
            this.isSaving = false;
            const msg = error?.error?.message || error?.error?.error || 'Failed to save tier pricing. Please try again.';
            this.snackbarService.showError(msg);
          }
        });
    } else {
      const dto: UpdateCustomerTierPricingDto = {
        unitPrice: Number(formValue.unitPrice),
        terminationDate: terminationDateStr
      };

      this.service.updateCustomerTierPricing(this.customerId, this.productType, this.data!.tier, dto)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.isSaving = false;
            this.snackbarService.showSuccess(response.message || `Tier pricing for Customer ID ${this.customerId} has been saved.`);
            this.saveSuccess.emit();
            this.closePanel.emit();
          },
          error: (error) => {
            this.isSaving = false;
            const msg = error?.error?.message || error?.error?.error || 'Failed to update tier pricing. Please try again.';
            this.snackbarService.showError(msg);
          }
        });
    }
  }

  onAddAndCreateAnother(): void {
    this.editForm.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.editForm, 'terminationDate');

    if (this.editForm.errors?.['dateRangeInvalid']) {
      this.editForm.get('terminationDate')?.markAsTouched();
      return;
    }

    if (this.mode !== 'add' || !this.editForm.valid) return;

    this.isSaving = true;
    const formValue = this.editForm.getRawValue();
    const terminationDateStr = formValue.terminationDate
      ? moment(formValue.terminationDate).format('YYYY-MM-DD')
      : null;

    const dto: CreateCustomerTierPricingRequest = {
      customerId: this.customerId,
      productType: this.productType,
      tierPricingItems: [{
        tier: this.data?.tier ?? 0,
        fromDay: parseInt(String(this.data?.minimumAge), 10) || 0,
        toDay: parseInt(String(this.data?.maximumAge), 10) || 0,
        unitPrice: Number(formValue.unitPrice),
        effectiveDate: moment(formValue.effectiveDate).format('YYYY-MM-DD'),
        terminationDate: terminationDateStr
      }]
    };

    this.service.createCustomerTierPricing(dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isSaving = false;
          this.snackbarService.showSuccess(response.message || 'New price added successfully.');
          this.saveSuccess.emit();
          this.editForm.reset();
          this.editForm.markAsPristine();
          this.editForm.markAsUntouched();
        },
        error: (error) => {
          this.isSaving = false;
          const msg = error?.error?.message || error?.error?.error || 'Failed to save tier pricing. Please try again.';
          this.snackbarService.showError(msg);
        }
      });
  }

  onClearAll(): void {
    if (this.mode === 'edit') {
      this.editForm.patchValue({
        unitPrice: null,
        terminationDate: null
      });
    } else {
      this.editForm.reset();
    }
    this.editForm.markAsDirty();
  }

  onCancel(): void {
    this.closePanel.emit();
  }

  private formatLastModified(dateStr: string): string {
    const timezone = this.headerService.getCurrentChapterTimezone() || 'UTC';
    const convertedDate = convertUTCToTimezone(dateStr, timezone);
    const formattedDate = moment(convertedDate).format('DD-MMM-YYYY, HH:mm').toUpperCase();
    const timezoneAbbr = new Intl.DateTimeFormat('en-US', { timeZone: timezone, timeZoneName: 'short' })
      .formatToParts(new Date(dateStr))
      .find(p => p.type === 'timeZoneName')?.value || timezone;

    const chapterNow = moment().utcOffset(this.chapterOffset);
    if (moment(convertedDate).isSame(chapterNow, 'day')) {
      const timeOnly = moment(convertedDate).format('HH:mm');
      return `Today, ${timeOnly} ${timezoneAbbr}`;
    }

    return `${formattedDate} ${timezoneAbbr}`;
  }
}
