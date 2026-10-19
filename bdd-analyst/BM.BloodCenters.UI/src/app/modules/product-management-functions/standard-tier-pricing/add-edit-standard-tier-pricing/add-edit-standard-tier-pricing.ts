import { Component, EventEmitter, Input, Output, OnInit, OnChanges, OnDestroy, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidatorFn, ValidationErrors, Validators } from '@angular/forms';
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

import { StandardTierPricingDto, CreateStandardTierPricingDto, UpdateStandardTierPricingDto } from '../models/standard-tier-pricing.model';
import { StandardTierPricingApiService } from '../services/standard-tier-pricing-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { LoggingService } from '@shared/services/logging.service';

/**
 * Add/Edit Standard Tier Pricing Side Panel
 *
 * Handles creating new tiers and editing existing tier details.
 *
 * Features:
 * - Add Mode: All fields editable, tier must be unique
 * - Edit Mode: Product Type and Tier read-only, validates changes
 * - Cascade warning: Editing day ranges updates customer pricing
 * - ADD AND CREATE ANOTHER: Save and keep panel open for new tier
 *
 * Validation:
 * - Tier: Positive number, unique for product
 * - fromDay: > 0, < lifeSpan, < toDay, no overlap
 * - toDay: <= lifeSpan, >= fromDay, no overlap
 * - Effective Date: Not in past (add only)
 * - Termination Date: >= Effective Date
 */
@Component({
  selector: 'app-add-edit-standard-tier-pricing-panel',
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
  templateUrl: './add-edit-standard-tier-pricing.html',
  styleUrls: ['./add-edit-standard-tier-pricing.scss']
})
export class AddEditStandardTierPricingPanel implements OnInit, OnChanges, OnDestroy {
  @Input() data: StandardTierPricingDto | null = null;
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() productType: string | null = null;
  @Input() productLifeSpan: string = '-';
  @Input() productLifeSpanValue: number | null = null;
  @Input() existingTiers: StandardTierPricingDto[] = [];
  @Output() save = new EventEmitter<void>();
  @Output() dataChanged = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private apiService = inject(StandardTierPricingApiService);
  private snackbarService = inject(SnackbarService);
  private headerService = inject(HeaderService);
  private loggingService = inject(LoggingService);
  private destroy$ = new Subject<void>();

  editForm!: FormGroup;
  isSaving = false;
  savingAction: 'save' | 'createAnother' | null = null;
  lastModifiedDisplay = '';

  minDate!: Moment;
  lastChangedDateField: 'effective' | 'termination' | null = null;
  effDateErrorMatcher!: ErrorStateMatcher;
  termDateErrorMatcher!: ErrorStateMatcher;
  tierErrorMatcher!: ErrorStateMatcher;
  fromDayErrorMatcher!: ErrorStateMatcher;
  toDayErrorMatcher!: ErrorStateMatcher;


  private originalFromDay: number | null = null;
  private originalToDay: number | null = null;
  private originalUnitPrice: number | null = null;
  private originalEffDate: Moment | null = null;
  private originalTermDate: Moment | null = null;

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
    this.tierErrorMatcher = { isErrorState: () => !!this.getTierError() };
    this.fromDayErrorMatcher = { isErrorState: () => !!this.getFromDayError() };
    this.toDayErrorMatcher = { isErrorState: () => !!this.getToDayError() };
  }

  ngOnInit(): void {
    this.minDate = DateFieldValidationUtility.getMinDate(this.chapterOffset);

    this.subscribeToChapterChanges();
    this.setupDateValidationListeners();

    if (this.mode === 'edit') {
      DateFieldValidationUtility.setupEditModeValidators(this.editForm, this.chapterOffset);
    } else {
      DateFieldValidationUtility.setupAddModeValidators(this.editForm, this.chapterOffset);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mode'] || changes['data']) {
      this.populateForm();
    }
    if (changes['productLifeSpanValue']) {
      this.updateLifeSpanValidators();
    }
    if (changes['productLifeSpanValue'] || changes['existingTiers'] || changes['mode'] || changes['data']) {
      this.updateFormLevelValidators();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get panelTitle(): string {
    return this.mode === 'add' ? 'Add New Tier' : 'Edit Tier Details';
  }

  get effectiveDateDisplay(): string {
    if (!this.originalEffDate) return '-';
    return this.originalEffDate.format('DD-MMM-YYYY').toUpperCase();
  }

  get terminationDateDisplay(): string {
    if (!this.originalTermDate) return '-';
    return this.originalTermDate.format('DD-MMM-YYYY').toUpperCase();
  }

  get hasPreExistingTermDate(): boolean {
    return this.mode === 'edit' && this.originalTermDate != null;
  }

  get isFormValid(): boolean {
    if (!this.editForm.valid) return false;
    if (this.mode === 'edit') {
      const formValue = this.editForm.getRawValue();
      const fromDayChanged = Number(formValue.fromDay) !== this.originalFromDay;
      const toDayChanged = Number(formValue.toDay) !== this.originalToDay;
      const currentUnitPrice = formValue.unitPrice != null && formValue.unitPrice !== '' ? Number(formValue.unitPrice) : null;
      const unitPriceChanged = currentUnitPrice !== this.originalUnitPrice;
      const currentEff = formValue.effectiveDate ? moment(formValue.effectiveDate) : null;
      const effDateChanged = currentEff && this.originalEffDate
        ? !currentEff.isSame(this.originalEffDate, 'day')
        : currentEff !== this.originalEffDate;
      const currentTerm = formValue.terminationDate ? moment(formValue.terminationDate) : null;
      const termDateChanged = currentTerm && this.originalTermDate
        ? !currentTerm.isSame(this.originalTermDate, 'day')
        : currentTerm !== this.originalTermDate;
      return fromDayChanged || toDayChanged || unitPriceChanged || effDateChanged || termDateChanged;
    }
    return true;
  }

  private initForm(): void {
    this.editForm = this.fb.group({
      tier: [null, [Validators.required, Validators.min(0), Validators.max(999)]],
      fromDay: [null, [Validators.required, Validators.min(0)]],
      toDay: [null, [Validators.required, Validators.min(1)]],
      unitPrice: [null, [Validators.min(0.01), Validators.max(999999.99)]],
      effectiveDate: [null, [Validators.required]],
      terminationDate: [null]
    }, {
      validators: [
        DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate'),
        AddEditStandardTierPricingPanel.fromDayLessThanToDayValidator
      ]
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
      this.originalFromDay = this.data.fromDay;
      this.originalToDay = this.data.toDay;
      this.originalUnitPrice = this.data.unitPrice ?? null;
      this.originalEffDate = this.data.effDate ? this.parseDateAsUtc(this.data.effDate) : null;
      const termDate = this.data.termDate ? this.parseDateAsUtc(this.data.termDate) : null;
      this.originalTermDate = termDate;

      this.editForm.patchValue({
        tier: this.data.tier,
        fromDay: this.data.fromDay,
        toDay: this.data.toDay,
        unitPrice: this.data.unitPrice,
        effectiveDate: this.originalEffDate,
        terminationDate: termDate
      });

      this.editForm.get('tier')?.disable();
      if (termDate) {
        this.editForm.get('terminationDate')?.disable();
      } else {
        this.editForm.get('terminationDate')?.enable();
      }

      DateFieldValidationUtility.setupEditModeValidators(this.editForm, this.chapterOffset);

      if (this.data.lastModifiedDate) {
        const lastMod = moment(this.data.lastModifiedDate);
        const chapterNow = moment().utcOffset(this.chapterOffset);
        const dateStr = lastMod.isSame(chapterNow, 'day')
          ? `Today, ${lastMod.format('HH:mm')}`
          : lastMod.format('DD-MMM-YYYY, HH:mm');
        this.lastModifiedDisplay = `Last Modified: ${dateStr}`;
      }
    } else {
      this.originalFromDay = null;
      this.originalToDay = null;
      this.originalUnitPrice = null;
      this.originalTermDate = null;
      this.lastModifiedDisplay = '';
      this.editForm.reset();
      this.editForm.get('tier')?.enable();
      this.editForm.get('terminationDate')?.enable();
      const chapterToday = moment(moment().utcOffset(this.chapterOffset).format('YYYY-MM-DD'), 'YYYY-MM-DD');
      this.originalEffDate = chapterToday;
      this.editForm.patchValue({ effectiveDate: chapterToday });
      DateFieldValidationUtility.setupAddModeValidators(this.editForm, this.chapterOffset);
      this.editForm.get('effectiveDate')?.disable();
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

  private updateLifeSpanValidators(): void {
    if (!this.editForm) return;
    const fromDayCtrl = this.editForm.get('fromDay');
    const toDayCtrl = this.editForm.get('toDay');
    if (this.productLifeSpanValue != null && this.productLifeSpanValue > 0) {
      fromDayCtrl?.setValidators([Validators.required, Validators.min(0), Validators.max(this.productLifeSpanValue - 1)]);
      toDayCtrl?.setValidators([Validators.required, Validators.min(1), Validators.max(this.productLifeSpanValue)]);
    } else {
      fromDayCtrl?.setValidators([Validators.required, Validators.min(0)]);
      toDayCtrl?.setValidators([Validators.required, Validators.min(1)]);
    }
    fromDayCtrl?.updateValueAndValidity({ emitEvent: false });
    toDayCtrl?.updateValueAndValidity({ emitEvent: false });
  }

  static tierOverlapValidator(existingTiers: StandardTierPricingDto[], mode: 'add' | 'edit', currentData: StandardTierPricingDto | null, chapterOffset: string = '+00:00'): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const fromDay = group.get('fromDay')?.value;
      const toDay = group.get('toDay')?.value;
      if (fromDay == null || toDay == null) return null;
      const newFrom = Number(fromDay);
      const newTo = Number(toDay);
      if (isNaN(newFrom) || isNaN(newTo)) return null;

      const now = moment().utcOffset(chapterOffset).startOf('day');
      const activeTiers = existingTiers.filter(t => {
        if (mode === 'edit' && currentData && t.tier === currentData.tier && t.productType === currentData.productType) {
          return false;
        }
        if (t.termDate) {
          const termDate = moment(t.termDate.substring(0, 10), 'YYYY-MM-DD');
          if (termDate.isBefore(now, 'day')) return false;
        }
        return true;
      });

      for (const tier of activeTiers) {
        if (newFrom >= tier.fromDay && newFrom <= tier.toDay) {
          return { tierOverlap: { errorCode: '7315' } };
        }
        if (newTo >= tier.fromDay && newTo <= tier.toDay) {
          return { tierOverlap: { errorCode: '7316' } };
        }
        if (newFrom < tier.fromDay && newTo > tier.toDay) {
          return { tierOverlap: { errorCode: '7317' } };
        }
      }
      return null;
    };
  }

  private updateFormLevelValidators(): void {
    if (!this.editForm) return;
    this.editForm.setValidators([
      DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate'),
      AddEditStandardTierPricingPanel.fromDayLessThanToDayValidator,
      AddEditStandardTierPricingPanel.tierOverlapValidator(this.existingTiers, this.mode, this.data, this.chapterOffset)
    ]);
    this.editForm.updateValueAndValidity({ emitEvent: false });
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

  static fromDayLessThanToDayValidator(group: AbstractControl): ValidationErrors | null {
    const fromDay = group.get('fromDay')?.value;
    const toDay = group.get('toDay')?.value;
    if (fromDay != null && toDay != null && Number(fromDay) > Number(toDay)) {
      return { fromDayExceedsToDay: true };
    }
    return null;
  }

  getTierError(): string {
    const ctrl = this.editForm.get('tier');
    if (!ctrl?.touched && !ctrl?.dirty) return '';
    if (ctrl?.hasError('required')) return 'Tier is required';
    if (ctrl?.hasError('min')) return 'Tier must be at least 0';
    if (ctrl?.hasError('max')) return 'Tier cannot exceed 999';
    return '';
  }

  getFromDayError(): string {
    const ctrl = this.editForm.get('fromDay');
    if (!ctrl?.touched && !ctrl?.dirty) return '';
    if (ctrl?.hasError('required')) return 'Minimum Days to Expiration is required';
    if (ctrl?.hasError('min')) return 'Minimum days cannot be negative';
    if (ctrl?.hasError('max')) return 'Minimum days must be less than life span of the product';
    const overlap = this.editForm.errors?.['tierOverlap'];
    if (overlap && (overlap.errorCode === '7315' || overlap.errorCode === '7317')) {
      return overlap.errorCode === '7315'
        ? 'Minimum days overlap another defined tier'
        : 'Tier encompasses another tier\'s definition';
    }
    if (this.editForm.hasError('fromDayExceedsToDay')) return 'Minimum days cannot exceed maximum days';
    return '';
  }

  getToDayError(): string {
    const ctrl = this.editForm.get('toDay');
    if (!ctrl?.touched && !ctrl?.dirty) return '';
    if (ctrl?.hasError('required')) return 'Maximum Days till Expiration is required';
    if (ctrl?.hasError('min')) return 'Maximum days must be greater than 0';
    if (ctrl?.hasError('max')) return 'Maximum days cannot be greater than life span of the product';
    const overlap = this.editForm.errors?.['tierOverlap'];
    if (overlap && (overlap.errorCode === '7316' || overlap.errorCode === '7317')) {
      return overlap.errorCode === '7316'
        ? 'Maximum days overlap another defined tier'
        : 'Tier encompasses another tier\'s definition';
    }
    if (this.editForm.hasError('fromDayExceedsToDay')) return 'Maximum days cannot be less than minimum days';
    return '';
  }

  getUnitPriceError(): string {
    const ctrl = this.editForm.get('unitPrice');
    if (!ctrl?.touched && !ctrl?.dirty) return '';
    if (ctrl?.hasError('min')) return 'Unit Price must be greater than 0';
    if (ctrl?.hasError('max')) return 'Maximum price 999999.99';
    return '';
  }

  onEffectiveDateInput(event: Event): void {
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

  private parseDateAsUtc(dateStr: string): Moment {
    return moment(dateStr.substring(0, 10), 'YYYY-MM-DD');
  }

  onlyNumbers(event: KeyboardEvent): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if ([8, 9, 27, 13, 45, 46].indexOf(charCode) !== -1) return true;
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
      return false;
    }
    return true;
  }

  onSave(createAnother: boolean = false): void {
    this.editForm.markAllAsTouched();

    if (this.mode === 'edit') {
      const formErrors = this.editForm.errors;
      if (formErrors?.['dateRangeInvalid']) {
        this.editForm.get('terminationDate')?.markAsTouched();
        return;
      }
    }

    DateFieldValidationUtility.clearOptionalDateErrors(this.editForm, 'terminationDate');

    if (this.mode === 'add' && !this.editForm.valid) return;
    if (this.mode === 'edit' && !this.isFormValid) return;

    if (!this.productType) {
      this.snackbarService.showError('Product type is missing');
      return;
    }

    this.isSaving = true;
    this.savingAction = createAnother ? 'createAnother' : 'save';
    const formValue = this.editForm.getRawValue();

    if (this.mode === 'add') {
      const dto: CreateStandardTierPricingDto = {
        productType: this.productType,
        tier: Number(formValue.tier),
        fromDay: Number(formValue.fromDay),
        toDay: Number(formValue.toDay),
        unitPrice: formValue.unitPrice ? Number(formValue.unitPrice) : null,
        effDate: moment(formValue.effectiveDate).format('YYYY-MM-DD'),
        termDate: formValue.terminationDate ? moment(formValue.terminationDate).format('YYYY-MM-DD') : null
      };

      this.apiService.createTier(dto)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.isSaving = false;
            this.savingAction = null;
            if (createAnother) {
              this.populateForm();
              this.dataChanged.emit();
              this.snackbarService.showSuccess('Tier created successfully. Add another tier.');
            } else {
              this.save.emit();
            }
          },
          error: (error) => {
            this.isSaving = false;
            this.savingAction = null;
            this.loggingService.error('Failed to create tier', error);
            this.snackbarService.showError(error.message || 'Failed to create tier');
          }
        });
    } else {
      // Edit mode
      const dto: UpdateStandardTierPricingDto = {
        fromDay: Number(formValue.fromDay),
        toDay: Number(formValue.toDay),
        unitPrice: formValue.unitPrice ? Number(formValue.unitPrice) : null,
        effDate: moment(formValue.effectiveDate).format('YYYY-MM-DD'),
        termDate: formValue.terminationDate ? moment(formValue.terminationDate).format('YYYY-MM-DD') : null
      };

      this.apiService.updateTier(this.productType, Number(formValue.tier), dto)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.isSaving = false;
            this.savingAction = null;
            this.save.emit();
          },
          error: (error) => {
            this.isSaving = false;
            this.savingAction = null;
            this.loggingService.error('Failed to update tier', error);
            this.snackbarService.showError(error.message || 'Failed to update tier');
          }
        });
    }
  }

  onClearAll(): void {
    this.populateForm();
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
