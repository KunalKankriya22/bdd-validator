import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
  OnDestroy,
  Output,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
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
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { HeaderService } from '@shared/services/header.service';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';
import moment, { Moment } from 'moment';

import { AttributeCodeModel, AttributeCodeFormValue } from '../models/attribute-codes.model';
import { AttributeCodesApiService } from '../services/attribute-codes-api.service';

@Component({
  selector: 'app-add-edit-attribute-code',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatSelectModule,
    MatCheckboxModule,
    MatTooltipModule,
    NgxMatSelectSearchModule,
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
  ],
  templateUrl: './add-edit-attribute-code.html',
  styleUrls: ['./add-edit-attribute-code.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddEditAttributeCodeComponent implements OnInit, OnChanges, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly headerService = inject(HeaderService);
  private readonly apiService = inject(AttributeCodesApiService);
  readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  @Input() mode: 'add' | 'edit' = 'add';
  @Input() data: AttributeCodeModel | null = null;
  @Input() selectedAttributeGroup: string | null = null;

  @Output() save = new EventEmitter<AttributeCodeFormValue>();
  @Output() saveAndCreateAnother = new EventEmitter<AttributeCodeFormValue>();
  @Output() close = new EventEmitter<void>();

  form!: FormGroup;
  isSubmitting = false;
  errorMessage: string | null = null;
  private originalFormValue: Record<string, unknown> | null = null; // Store original values for edit mode comparison

  // Dropdown options
  interdictionCodeOptions: Array<{ value: string; label: string; description: string }> = [];
  filteredInterdictionCodeOptions: Array<{ value: string; label: string; description: string }> = [];

  readonly statusFlagOptions: Array<{ value: string; label: string }> = [
    { value: 'H', label: 'H - HOLD' },
    { value: 'O', label: 'O - OK' },
    { value: 'N', label: 'N - NFT' },
  ];

  readonly unitSchemeOptions: Array<{ value: string; label: string }> = [
    { value: 'I', label: 'I - ISBT' },
    { value: 'C', label: 'C - Codabar' },
  ];

  readonly attributeTypeOptions: Array<{ value: string; label: string }> = [
    { value: 'C', label: 'C - Conversion' },
    { value: 'M', label: 'M - Modification' },
    { value: 'A', label: 'A - Simple' },
  ];

  get isInterdictionCodeDisabled(): boolean {
    const status = this.form?.get('statusFlag')?.value;
    return status !== 'H' && status !== 'N';
  }

  // Search controls
  interdictionCodeSearchControl = new FormControl<string>('');

  private lastChangedDateField: 'effective' | 'termination' | null = null;

  minDate: Moment;
  terminationMinDate: Moment;

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getEffectiveDateError(),
  );
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getTerminationDateError(),
  );

  private get chapterOffset(): string {
    return this.headerService.chapterTimeZone();
  }

  constructor() {
    this.minDate = this.getChapterMinDate();
    this.terminationMinDate = this.minDate;

    effect(() => {
      this.minDate = this.getChapterMinDate();
      this.updateTerminationMinDate();
    });
  }

  ngOnInit(): void {
    this.initializeForm();
    this.setupDateValidationListeners();
    this.setupModeValidators();
    this.updateTerminationMinDate();
    this.setupInterdictionCodeSearchListener();
    // Load interdiction codes if initial status is H or N
    const initialStatus = this.form.get('statusFlag')?.value;
    if (initialStatus === 'H' || initialStatus === 'N') {
      this.loadInterdictionCodes(initialStatus);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['mode'] || changes['data']) && this.form) {
      this.initializeForm();
      this.setupModeValidators();
      this.updateTerminationMinDate();
      // Reload interdiction codes if status is H or N
      const currentStatus = this.form.get('statusFlag')?.value;
      if (currentStatus === 'H' || currentStatus === 'N') {
        this.loadInterdictionCodes(currentStatus);
      }
    }

    // Handle attribute group changes while form is open (only in add mode)
    if (changes['selectedAttributeGroup'] && this.form && !changes['selectedAttributeGroup'].firstChange && this.mode === 'add') {
      // Clear the current attribute code value since the group changed
      if (this.selectedAttributeGroup && this.selectedAttributeGroup.trim() !== '') {
        this.form.get('attributeCode')?.setValue('');
        this.form.get('attributeCode')?.markAsUntouched();
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupModeValidators(): void {
    const effDateControl = this.form.get('effectiveDate');
    const termControl = this.form.get('terminationDate');
    const attributeCodeControl = this.form.get('attributeCode');
    const unitSchemeControl = this.form.get('unitScheme');

    if (this.mode === 'add') {
      // Add mode: effective date must be >= today
      DateFieldValidationUtility.setupAddModeValidators(this.form, this.chapterOffset);
      // Ensure attribute code and unit scheme are enabled in add mode
      attributeCodeControl?.enable();
      unitSchemeControl?.enable();
    } else {
      // Edit mode: attribute code is read-only (part of primary key), disable it
      attributeCodeControl?.disable();
      // Unit scheme remains ENABLED in edit mode per backend PR #1218
      unitSchemeControl?.enable();

      // Edit mode: effective date can be in the past, just required
      // Remove any validators that prevent past dates
      effDateControl?.clearValidators();
      effDateControl?.setValidators([Validators.required]);
      effDateControl?.updateValueAndValidity();

      // Edit mode: termination date can be any past date, no validators needed
      // The cross-field validator and datepicker [min] binding ensure termination >= effective
      if (termControl) {
        termControl.clearValidators();
        termControl.updateValueAndValidity();
      }
    }
  }

  initializeForm(): void {
    const initialStatus = this.data?.statusFlag || null;
    const interCodeValidators = (initialStatus === 'H' || initialStatus === 'N')
      ? [Validators.required, Validators.maxLength(4)]
      : [Validators.maxLength(4)];

    this.form = this.fb.group({
      attributeCode: [
        this.data?.attributeCode || null,
        [Validators.required, Validators.maxLength(10)]
      ],
      description: [
        this.data?.description || null,
        [Validators.required, Validators.maxLength(50)]
      ],
      unitScheme: [
        this.data?.unitSchemeType || null,
        [Validators.required]
      ],
      statusFlag: [
        initialStatus,
        [Validators.required]
      ],
      interCode: [
        this.data?.interCode || null,
        interCodeValidators
      ],
      stopLabelFlag: [
        this.data?.stopLabelFlag ? this.transformYNToYesNo(this.data.stopLabelFlag) : null,
        [Validators.required]
      ],
      attributeCustom: [
        this.data?.attributeCustom ? this.transformYNToYesNo(this.data.attributeCustom) : this.transformYNToYesNo('N'),
        [Validators.required]
      ],
      showOnLabelFlag: [
        this.data?.showOnLabelFlag ? this.transformYNToYesNo(this.data.showOnLabelFlag) : null,
        [Validators.required]
      ],
      deleteAllowed: [
        this.data?.deleteAllowed ? this.transformYNToYesNo(this.data.deleteAllowed) : 'No'
      ],
      attributeType: [
        this.data?.attributeType || null,
        [Validators.required, Validators.maxLength(1), Validators.pattern(/^[CMA]$/)]
      ],
      attributeLabel: [
        this.data?.attributeLabel || null,
        [Validators.maxLength(50)]
      ],
      attributeAbbrev: [
        this.data?.attributeAbbrev || null,
        [Validators.maxLength(12)]
      ],
      attributePosition: [
        this.data?.attributePosition || null,
        [Validators.max(9)]
      ],
      exclusivityFlag: [
        this.data?.exclusivityFlag ? this.transformYNToYesNo(this.data.exclusivityFlag) : null,
        [Validators.required]
      ],
      price: [
        this.data?.price || null,
        [
          Validators.pattern(/^\d+(\.\d{1,2})?$/), // Only digits and optional decimal with up to 2 places
          Validators.max(9999.99),
          Validators.min(0)
        ]
      ],
      serviceCode: [
        this.data?.serviceCode || null,
        [Validators.maxLength(8)]
      ],
      specialOrder: [
        this.data
          ? this.transformYNToYesNo(this.data.normalStockFlag === 'N' ? 'Y' : 'N')
          : this.transformYNToYesNo('N'),
        [Validators.required]
      ],
      regularOrder: [
        this.data
          ? this.transformYNToYesNo(this.data.normalStockFlag === 'Y' ? 'Y' : 'N')
          : this.transformYNToYesNo('Y'),
        [Validators.required]
      ],
      creditFlag: [
        this.data?.creditFlag ? this.transformYNToYesNo(this.data.creditFlag) : this.transformYNToYesNo('Y'),
        [Validators.required]
      ],
      normalStockFlag: [
        this.data?.normalStockFlag || 'Y',
        [Validators.required]
      ],
      assignAfterLabelFlag: [
        this.data?.assignAfterLabelFlag ? this.transformYNToYesNo(this.data.assignAfterLabelFlag) : this.transformYNToYesNo('N'),
        [Validators.required]
      ],
      effectiveDate: [
        this.data?.effectiveDate ? moment(this.data.effectiveDate) : null,
        [Validators.required]
      ],
      terminationDate: [
        this.data?.terminationDate ? moment(this.data.terminationDate) : null
      ],
    }, {
      validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate')]
    });

    this.form.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'effective';
      });

    this.form.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'termination';
      });

    // Sync Special Order and Regular Order with Normal Stock Flag
    this.form.get('specialOrder')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        const normalizedValue = value?.trim().toLowerCase();
        if (normalizedValue === 'yes' || normalizedValue === 'y') {
          this.form.get('regularOrder')?.setValue('No', { emitEvent: false, onlySelf: true });
          this.form.get('normalStockFlag')?.setValue('N', { emitEvent: false, onlySelf: true });
        }
      });

    this.form.get('regularOrder')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        const normalizedValue = value?.trim().toLowerCase();
        if (normalizedValue === 'yes' || normalizedValue === 'y') {
          this.form.get('specialOrder')?.setValue('No', { emitEvent: false, onlySelf: true });
          this.form.get('normalStockFlag')?.setValue('Y', { emitEvent: false, onlySelf: true });
        }
      });

    // Handle ISBT field validation based on Unit Scheme selection
    this.form.get('unitScheme')?.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300)
      )
      .subscribe((value) => {
        const isISBT = value === 'I';
        const labelControl = this.form.get('attributeLabel');
        const abbrevControl = this.form.get('attributeAbbrev');
        const positionControl = this.form.get('attributePosition');
        const descControl = this.form.get('description');
        const codeControl = this.form.get('attributeCode');

        if (isISBT) {
          // ISBT: Clear validators (fields hidden from UI) but auto-populate values
          labelControl?.clearValidators();
          abbrevControl?.clearValidators();
          positionControl?.clearValidators();

          // Auto-populate if empty
          if (!labelControl?.value && descControl?.value) {
            const desc = descControl.value.toString();
            labelControl?.setValue(desc.substring(0, 50), { emitEvent: false, onlySelf: true });
          }
          if (!abbrevControl?.value) {
            const source = descControl?.value?.toString() || codeControl?.value?.toString() || '';
            abbrevControl?.setValue(source.substring(0, 12), { emitEvent: false, onlySelf: true });
          }
          if (!positionControl?.value) {
            positionControl?.setValue(1, { emitEvent: false, onlySelf: true });
          }
        } else {
          // Codabar: Clear validators and values
          labelControl?.clearValidators();
          abbrevControl?.clearValidators();
          positionControl?.clearValidators();

          // Clear ISBT field values when switching to Codabar
          // These fields must be null for Codabar attributes
          labelControl?.setValue(null, { emitEvent: false, onlySelf: true });
          abbrevControl?.setValue(null, { emitEvent: false, onlySelf: true });
          positionControl?.setValue(null, { emitEvent: false, onlySelf: true });
        }

        labelControl?.updateValueAndValidity();
        abbrevControl?.updateValueAndValidity();
        positionControl?.updateValueAndValidity();
        this.cdr.markForCheck();
      });

    // Set up conditional validation for Interdiction Code based on Status Flag
    this.form.get('statusFlag')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((status) => {
        const interCodeControl = this.form.get('interCode');

        if (status === 'H' || status === 'N') {
          this.loadInterdictionCodes(status);
          interCodeControl?.enable({ emitEvent: false });
          interCodeControl?.setValidators([Validators.required, Validators.maxLength(4)]);
        } else {
          this.interdictionCodeOptions = [];
          this.filteredInterdictionCodeOptions = [];
          interCodeControl?.clearValidators();
          interCodeControl?.setValidators([Validators.maxLength(4)]);
          if (interCodeControl?.value) {
            interCodeControl.setValue(null, { emitEvent: false, onlySelf: true });
          }
          interCodeControl?.disable({ emitEvent: false });
        }
        interCodeControl?.updateValueAndValidity();
        this.cdr.markForCheck();
      });

    // Disable interCode if status is not H or N
    const interCodeControl = this.form.get('interCode');
    if (initialStatus !== 'H' && initialStatus !== 'N') {
      interCodeControl?.disable({ emitEvent: false });
    }

    this.errorMessage = null;
    this.isSubmitting = false;

    // Set up ISBT field validators based on initial unit scheme value
    const initialUnitScheme = this.form.get('unitScheme')?.value;
    if (initialUnitScheme === 'I') {
      const labelControl = this.form.get('attributeLabel');
      const abbrevControl = this.form.get('attributeAbbrev');
      const positionControl = this.form.get('attributePosition');

      labelControl?.setValidators([Validators.required, Validators.maxLength(50)]);
      abbrevControl?.setValidators([Validators.required, Validators.maxLength(12)]);
      positionControl?.setValidators([Validators.required, Validators.max(9)]);

      labelControl?.updateValueAndValidity({ onlySelf: true });
      abbrevControl?.updateValueAndValidity({ onlySelf: true });
      positionControl?.updateValueAndValidity({ onlySelf: true });
    }

    // In edit mode, mark form as pristine after initialization
    // This ensures the form only becomes dirty when user actually changes values
    // not from programmatic synchronization during setup
    if (this.mode === 'edit') {
      // Store original form values IMMEDIATELY to prevent save button enabling during initialization
      this.originalFormValue = this.deepCloneFormValue(this.form.getRawValue());

      // Use setTimeout with 350ms delay to ensure all debounced subscriptions have completed
      // (unitScheme has debounceTime(300), so we wait longer)
      setTimeout(() => {
        this.form.markAsPristine();
        // Update original form values after all initialization is complete
        // Deep clone to avoid reference issues with moment objects
        this.originalFormValue = this.deepCloneFormValue(this.form.getRawValue());
        this.cdr.markForCheck();
      }, 350);
    }
  }

  private setupDateValidationListeners(): void {
    this.form.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateTerminationMinDate();
        this.cdr.markForCheck();
      });

    this.form.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.cdr.markForCheck();
      });
  }

  private updateTerminationMinDate(): void {
    const effDate = this.form?.get('effectiveDate')?.value;

    if (effDate && moment.isMoment(effDate)) {
      // In edit mode: allow past dates but not before effective date
      // In add mode: termination min is max(effective date, today)
      if (this.mode === 'edit') {
        // Edit mode: termination min is always the effective date (even if in the past)
        this.terminationMinDate = effDate.clone();
      } else {
        // Add mode: termination min is effective date or today, whichever is later
        if (effDate.isAfter(this.minDate)) {
          this.terminationMinDate = effDate.clone();
        } else {
          this.terminationMinDate = this.minDate;
        }
      }
    } else {
      // No effective date set: use today as minimum
      this.terminationMinDate = this.minDate;
    }
  }

  private getChapterMinDate(): Moment {
    const chapterDate = DateFieldValidationUtility.getMinDate(this.chapterOffset);
    return moment.utc(chapterDate.format('YYYY-MM-DD'), 'YYYY-MM-DD');
  }

  get editEffectiveDateDisplay(): string {
    const effDate = this.form?.get('effectiveDate')?.value;
    if (!effDate) return '-';
    return DateFieldValidationUtility.formatDateForUI(effDate)?.toUpperCase() || '-';
  }

  get lastModifiedDisplay(): string {
    if (!this.data?.lastModifiedDate) return '';
    const pst = moment.utc(this.data.lastModifiedDate).utcOffset(-8);
    if (!pst.isValid()) return '';
    const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const day = String(pst.date()).padStart(2, '0');
    const month = MONTHS[pst.month()];
    const year = pst.year();
    const hours = String(pst.hours()).padStart(2, '0');
    const minutes = String(pst.minutes()).padStart(2, '0');
    return `Last Modified: ${day}-${month}-${year}, ${hours}:${minutes} PST`;
  }

  getEffectiveDateError(): string {
    const formErrors = this.lastChangedDateField === 'effective' ? this.form.errors : null;
    return DateFieldValidationUtility.getStartDateCrossFieldError(
      this.form.get('effectiveDate'),
      'Effective Date',
      'Termination Date',
      formErrors
    );
  }

  getTerminationDateError(): string {
    const formErrors = this.lastChangedDateField === 'termination' ? this.form.errors : null;
    return DateFieldValidationUtility.getEndDateCrossFieldError(
      this.form.get('terminationDate'),
      'Termination Date',
      'Effective Date',
      formErrors
    );
  }

  onSave(): void {
    if (this.validateForm()) {
      this.isSubmitting = true;
      this.save.emit(this.getFormValue());
    }
  }

  onSaveAndCreateAnother(): void {
    if (this.validateForm()) {
      this.isSubmitting = true;
      this.saveAndCreateAnother.emit(this.getFormValue());
    }
  }

  /**
   * Reset form to pristine state after successful save.
   * Called by parent component after save completes.
   */
  resetFormAfterSave(): void {
    this.isSubmitting = false;
    if (this.mode === 'edit') {
      // Update original values IMMEDIATELY to prevent save button enabling during reset
      // Deep clone to avoid reference issues
      this.originalFormValue = this.deepCloneFormValue(this.form.getRawValue());

      // Wait for debounced subscriptions to settle (350ms > debounceTime(300))
      setTimeout(() => {
        // Update original values again after all changes settle
        // Deep clone to avoid reference issues with moment objects
        this.originalFormValue = this.deepCloneFormValue(this.form.getRawValue());
        // Mark form as pristine so save button is disabled
        this.form.markAsPristine();
        this.cdr.markForCheck();
      }, 350);
    }
  }

  /**
   * Reset form state after save error.
   * Updates originalFormValue to current values so save button stays disabled after error.
   * Called by parent component when save fails.
   */
  resetFormAfterError(): void {
    this.isSubmitting = false;
    if (this.mode === 'edit') {
      // Update original values to CURRENT form values
      // This prevents save button from re-enabling when user clicks on fields after error
      this.originalFormValue = this.deepCloneFormValue(this.form.getRawValue());

      // Wait for any pending changes to settle
      setTimeout(() => {
        this.originalFormValue = this.deepCloneFormValue(this.form.getRawValue());
        this.cdr.markForCheck();
      }, 350);
    }
  }

  private validateForm(): boolean {
    this.form.markAllAsTouched();

    // Only clear optional date errors if the field doesn't have parse errors
    // Parse errors indicate the user entered invalid text (e.g., "abc"), not that the field is empty
    const termDateControl = this.form.get('terminationDate');
    if (!termDateControl?.hasError('matDatepickerParse')) {
      DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'terminationDate');
    }

    if (this.form.invalid) {
      return false;
    }

    if (this.hasDateValidationError()) {
      this.form.get('terminationDate')?.markAsTouched();
      return false;
    }

    return true;
  }

  private hasDateValidationError(): boolean {
    return this.form.hasError('dateRangeInvalid') ||
      !!this.getEffectiveDateError() ||
      !!this.getTerminationDateError();
  }

  onCancel(): void {
    this.close.emit();
  }

  onEffDateInput(event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value,
      this.form.get('effectiveDate')
    );
  }

  onTermDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value,
      this.form.get('terminationDate'),
      this.mode === 'edit'
    );
  }

  onAmountKeyDown(event: KeyboardEvent): void {
    const input = event.target as HTMLInputElement;
    const key = event.key;
    const currentValue = input.value;
    const cursorPosition = input.selectionStart || 0;

    // Allow: backspace, delete, tab, escape, enter
    if (['Backspace', 'Delete', 'Tab', 'Escape', 'Enter'].includes(key)) {
      return;
    }

    // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
    if (event.ctrlKey || event.metaKey) {
      return;
    }

    // Allow: home, end, left, right
    if (['Home', 'End', 'ArrowLeft', 'ArrowRight'].includes(key)) {
      return;
    }

    // Block: e, E, +, - (scientific notation and signs)
    if (['e', 'E', '+', '-'].includes(key)) {
      event.preventDefault();
      return;
    }

    // Allow digits (0-9)
    if (/^\d$/.test(key)) {
      return;
    }

    // Allow decimal point only if:
    // 1. Key is decimal point or period
    // 2. There's no decimal point in the current value yet
    if ((key === '.' || key === ',') && !currentValue.includes('.')) {
      return;
    }

    // Block all other keys
    event.preventDefault();
  }

  private getFormValue(): AttributeCodeFormValue {
    const raw = this.form.getRawValue();
    const isISBT = raw.unitScheme === 'I';

    // Handle ISBT fields - take values from form as-is
    // The form validators already ensure they're populated when unit scheme is 'I'
    let attributeLabel: string | null | undefined = raw.attributeLabel;
    let attributeAbbrev: string | null | undefined = raw.attributeAbbrev;
    let attributePosition: number | null | undefined = raw.attributePosition;

    const payload: AttributeCodeFormValue = {
      attributeCode: raw.attributeCode,
      description: raw.description,
      unitScheme: raw.unitScheme,
      statusFlag: raw.statusFlag,
      attributeType: raw.attributeType,
      normalStockFlag: this.transformYesNoToYN(raw.regularOrder) === 'Y' ? 'Y' : 'N',
      assignAfterLabelFlag: this.transformYesNoToYN(raw.assignAfterLabelFlag),
      effectiveDate: raw.effectiveDate,
      terminationDate: raw.terminationDate,
      interCode: raw.interCode,
      stopLabelFlag: this.transformYesNoToYN(raw.stopLabelFlag),
      attributeCustom: this.transformYesNoToYN(raw.attributeCustom),
      showOnLabelFlag: this.transformYesNoToYN(raw.showOnLabelFlag),
      deleteAllowed: this.transformYesNoToYN(raw.deleteAllowed),
      exclusivityFlag: this.transformYesNoToYN(raw.exclusivityFlag),
      price: raw.price,
      serviceCode: raw.serviceCode,
      creditFlag: this.transformYesNoToYN(raw.creditFlag),
    };

    // Only include ISBT fields if Unit Scheme is 'I' (ISBT)
    // For Codabar ('C'), exclude ISBT fields entirely
    if (isISBT) {
      // Only include if they have non-null values
      if (attributeLabel != null) {
        payload.attributeLabel = attributeLabel;
      }
      if (attributeAbbrev != null) {
        payload.attributeAbbrev = attributeAbbrev;
      }
      if (attributePosition != null) {
        payload.attributePosition = attributePosition;
      }
    }
    // If unit scheme is Codabar ('C'), send null values for ISBT fields
    // This allows the backend to clear them when switching from ISBT to Codabar
    else {
      payload.attributeLabel = null;
      payload.attributeAbbrev = null;
      payload.attributePosition = null;
    }

    return payload;
  }

  get isFormValid(): boolean {
    if (this.mode === 'edit') {
      // In edit mode, ONLY check if form is valid and if values actually changed
      // Do NOT check form.dirty as clicking on fields makes it dirty without changing values
      if (!this.form.valid || this.hasDateValidationError()) return false;
      // Only enable save if values have actually changed from original
      if (!this.hasFormValuesChanged()) return false;
      return true;
    }
    return this.form.valid && !this.hasDateValidationError();
  }

  /**
   * Deep clone form values to avoid reference issues with moment objects and nested structures
   */
  private deepCloneFormValue(formValue: Record<string, unknown>): Record<string, unknown> {
    const cloned: Record<string, unknown> = {};

    for (const key in formValue) {
      if (formValue.hasOwnProperty(key)) {
        const value = formValue[key];

        // Clone moment objects by creating new instances
        if (moment.isMoment(value)) {
          cloned[key] = value.isValid() ? moment(value) : null;
        }
        // Clone other values (primitives, null, undefined)
        else {
          cloned[key] = value;
        }
      }
    }

    return cloned;
  }

  private hasFormValuesChanged(): boolean {
    if (!this.originalFormValue) return true; // No original value stored, allow save

    const currentValue = this.form.getRawValue();

    // Helper function to normalize values for consistent comparison
    const normalizeValue = (value: any): any => {
      // Handle moment objects - convert to ISO date string for comparison
      if (moment.isMoment(value)) {
        return value.isValid() ? value.format('YYYY-MM-DD') : null;
      }
      // Handle strings - trim whitespace and treat empty as null
      if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed === '' ? null : trimmed;
      }
      // Handle numbers - keep as is (including 0)
      if (typeof value === 'number') {
        return value;
      }
      // Normalize undefined and empty string to null for consistent comparison
      if (value === undefined || value === '') {
        return null;
      }
      return value;
    };

    // Compare each field with normalized values
    for (const key in currentValue) {
      if (currentValue.hasOwnProperty(key) && this.originalFormValue.hasOwnProperty(key)) {
        const currentNormalized = normalizeValue(currentValue[key]);
        const originalNormalized = normalizeValue(this.originalFormValue[key]);

        // Use strict equality for normalized values
        if (currentNormalized !== originalNormalized) {
          return true; // Value changed
        }
      }
    }

    return false; // No changes detected
  }


  get dialogTitle(): string {
    return this.mode === 'add' ? 'Add New Attribute Code' : 'Edit Attribute Code';
  }

  get submitButtonLabel(): string {
    return this.mode === 'add' ? 'ADD' : 'SAVE';
  }

  get showCreateAnotherButton(): boolean {
    return this.mode === 'add';
  }

  formatYesNo(value: string | null | undefined): string {
    if (!value) return '';
    return value === 'Y' ? 'Yes' : value === 'N' ? 'No' : value;
  }

  private transformYNToYesNo(value: string): string {
    return value === 'Y' ? 'Yes' : value === 'N' ? 'No' : value;
  }

  private transformYesNoToYN(value: string): string {
    if (!value) return 'N';
    const normalized = value.trim().toLowerCase();
    if (normalized === 'yes' || normalized === 'y') return 'Y';
    if (normalized === 'no' || normalized === 'n') return 'N';
    return value; // Return as-is if not recognized
  }

  get stopLabelFlagDisplay(): string {
    return this.formatYesNo(this.form.get('stopLabelFlag')?.value);
  }

  get attributeCustomDisplay(): string {
    return this.formatYesNo(this.form.get('attributeCustom')?.value);
  }

  get showOnLabelFlagDisplay(): string {
    return this.formatYesNo(this.form.get('showOnLabelFlag')?.value);
  }

  get deleteAllowedDisplay(): string {
    return this.formatYesNo(this.form.get('deleteAllowed')?.value);
  }

  get exclusivityFlagDisplay(): string {
    return this.formatYesNo(this.form.get('exclusivityFlag')?.value);
  }

  get specialOrderDisplay(): string {
    return this.formatYesNo(this.form.get('specialOrder')?.value);
  }

  get regularOrderDisplay(): string {
    return this.formatYesNo(this.form.get('regularOrder')?.value);
  }

  get creditFlagDisplay(): string {
    return this.formatYesNo(this.form.get('creditFlag')?.value);
  }

  formatTerminationDate(date: string): string {
    const pst = moment.utc(date).utcOffset(-8);
    if (!pst.isValid()) return '-';
    const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const day = String(pst.date()).padStart(2, '0');
    const month = MONTHS[pst.month()];
    const year = pst.year();
    return `${day}-${month}-${year}`;
  }

  formatTerminationDateDisplay(date: string | null | undefined): string {
    if (!date) return '-';
    return this.formatTerminationDate(date);
  }

  private loadInterdictionCodes(statusFlag?: string): void {
    // Only load if statusFlag is H or N
    if (statusFlag === 'H' || statusFlag === 'N') {
      this.apiService
        .getInterdictionCodes(statusFlag)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (codes) => {
            this.interdictionCodeOptions = codes;
            this.filteredInterdictionCodeOptions = codes;
            this.cdr.markForCheck();
          },
          error: (error) => {
            console.error('Error loading interdiction codes:', error);
            this.interdictionCodeOptions = [];
            this.filteredInterdictionCodeOptions = [];
            this.cdr.markForCheck();
          }
        });
    }
  }

  private setupInterdictionCodeSearchListener(): void {
    this.interdictionCodeSearchControl.valueChanges
      .pipe(
        debounceTime(300),
        takeUntil(this.destroy$)
      )
      .subscribe((searchText) => {
        this.filterInterdictionCodes(searchText || '');
      });
  }

  private filterInterdictionCodes(searchText: string): void {
    if (!searchText) {
      this.filteredInterdictionCodeOptions = this.interdictionCodeOptions;
    } else {
      const term = searchText.toLowerCase();
      this.filteredInterdictionCodeOptions = this.interdictionCodeOptions.filter(
        (code) =>
          code.value.toLowerCase().includes(term) ||
          code.description.toLowerCase().includes(term)
      );
    }
    this.cdr.markForCheck();
  }

  onInterdictionDropdownOpened(isOpen: boolean): void {
    if (isOpen) {
      this.interdictionCodeSearchControl.setValue('');
      this.filteredInterdictionCodeOptions = this.interdictionCodeOptions;
    }
  }

}
