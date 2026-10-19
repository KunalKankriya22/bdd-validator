/**
 * Add/Edit Panel Component for Product/Procedure Matrix
 * JIRA: MLT-12847
 * Oracle Forms: VPROCPRD.fmb
 * Pattern: Follows add-edit-max-donations.ts
 */

import {
  Component,
  OnInit,
  OnChanges,
  SimpleChanges,
  OnDestroy,
  Input,
  Output,
  EventEmitter,
  inject,
  signal,
  effect,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormControl, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, distinctUntilChanged, startWith } from 'rxjs/operators';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import moment, { Moment } from 'moment';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { HeaderService } from '@shared/services/header.service';
import { TIMEZONE_OFFSET_MAP, TIMEZONE_OFFSET_REGEX } from '@core/constants/timezone.constants';
import { MatrixPheresisService } from '../../services/matrix-pheresis.service';
import {
  ProcProdMatrix,
  ProcedureDropdown,
  ProductTypeDropdown,
  CreateMatrixDto,
  UpdateMatrixDto
} from '../../models/matrix-pheresis.model';

@Component({
  selector: 'app-add-edit-matrix-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    NgxMatSelectSearchModule
  ],
  templateUrl: './add-edit-matrix-panel.html',
  styleUrls: ['./add-edit-matrix-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ]
})
export class AddEditMatrixPanelComponent implements OnInit, OnChanges, OnDestroy {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() data: ProcProdMatrix | null = null;
  @Input() procedures: ProcedureDropdown[] = [];
  @Input() productTypes: ProductTypeDropdown[] = [];
  @Output() closePanel = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<void>();
  @Output() recordAdded = new EventEmitter<void>();

  private readonly destroy$ = new Subject<void>();
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(MatrixPheresisService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly headerService = inject(HeaderService);
  private cdr = inject(ChangeDetectorRef);

  form!: FormGroup;
  isSaving = signal<boolean>(false);

  // Search controls for dropdowns
  procedureSearchControl = new FormControl('');
  productTypeSearchControl = new FormControl('');

  // Filtered lists
  filteredProcedures = signal<ProcedureDropdown[]>([]);
  filteredProductTypes = signal<ProductTypeDropdown[]>([]);

  // Selected descriptions for display (Add mode)
  selectedProcedureDescription = signal<string>('');
  selectedProductTypeDescription = signal<string>('');

  // Date validation properties (from DateFieldValidationUtility pattern)
  minDate: Moment;
  terminationMinDate: Moment;
  private lastChangedDateField: 'effective' | 'termination' | null = null;

  // Error matchers
  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getEffectiveDateError()
  );
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getTerminationDateError()
  );

  // Edit mode read-only values
  editModeValues = {
    proc: '',
    procDesc: '',
    productType: '',
    productDesc: '',
    effectiveDate: ''
  };

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
    this.setupSearchFilters();
    this.updateFilteredLists();
    this.setupFormBasedOnMode();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Skip on initial change (ngOnInit handles that)
    if (changes['mode'] && !changes['mode'].firstChange) {
      this.setupFormBasedOnMode();
    }

    // Handle data changes for edit mode
    if (changes['data'] && !changes['data'].firstChange && this.mode === 'edit') {
      this.populateFormForEdit();
    }

    // Update filtered lists when procedures or productTypes change
    if ((changes['procedures'] || changes['productTypes']) && this.form) {
      this.updateFilteredLists();
    }
  }

  /**
   * Setup form based on current mode (add or edit)
   */
  private setupFormBasedOnMode(): void {
    if (!this.form) return;

    // Reset form and clear descriptions
    this.form.reset();
    this.selectedProcedureDescription.set('');
    this.selectedProductTypeDescription.set('');
    this.lastChangedDateField = null;

    // Enable all fields first
    this.form.get('proc')?.enable();
    this.form.get('productType')?.enable();
    this.form.get('effDate')?.enable();

    if (this.mode === 'edit') {
      // Setup edit mode validators and populate form
      DateFieldValidationUtility.setupEditModeValidators(this.form, this.chapterOffset);
      this.populateFormForEdit();
    } else {
      // Setup add mode validators
      DateFieldValidationUtility.setupAddModeValidators(this.form, this.chapterOffset);
      // FMB EFF_DATE InitializeValue="$$DATE$$" — restore today's date after reset
      this.form.patchValue({ effDate: this.getChapterMinDate() }, { emitEvent: false });
      // Clear edit mode values
      this.editModeValues = {
        proc: '',
        procDesc: '',
        productType: '',
        productDesc: '',
        effectiveDate: ''
      };
    }

    // Trigger validation update
    this.form.updateValueAndValidity();
    this.cdr.markForCheck();
  }

  /**
   * Update filtered lists when input changes
   */
  private updateFilteredLists(): void {
    this.filteredProcedures.set(this.procedures);
    this.filteredProductTypes.set(this.productTypes);
  }

  /**
   * Setup search filters for dropdowns
   */
  private setupSearchFilters(): void {
    // Procedure search filter
    this.procedureSearchControl.valueChanges
      .pipe(
        startWith(''),
        takeUntil(this.destroy$)
      )
      .subscribe(searchValue => {
        const search = (searchValue || '').toLowerCase();
        if (!search) {
          this.filteredProcedures.set(this.procedures);
        } else {
          const filtered = this.procedures.filter(p =>
            p.code.toLowerCase().includes(search) ||
            p.codeDesc.toLowerCase().includes(search)
          );
          this.filteredProcedures.set(filtered);
        }
      });

    // Product type search filter
    this.productTypeSearchControl.valueChanges
      .pipe(
        startWith(''),
        takeUntil(this.destroy$)
      )
      .subscribe(searchValue => {
        const search = (searchValue || '').toLowerCase();
        if (!search) {
          this.filteredProductTypes.set(this.productTypes);
        } else {
          const filtered = this.productTypes.filter(pt =>
            pt.productCode.toLowerCase().includes(search) ||
            pt.productDesc.toLowerCase().includes(search)
          );
          this.filteredProductTypes.set(filtered);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Custom validator for number range 0-4
   */
  private numberRangeValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null; // Empty is valid
      }

      const value = parseInt(control.value, 10);

      if (isNaN(value)) {
        return null; // Let pattern validator handle non-numeric
      }

      if (value < 0 || value > 4) {
        return { invalidRange: true };
      }

      return null;
    };
  }

  /**
   * Initialize form with validators
   */
  private initializeForm(): void {
    // FMB EFF_DATE has InitializeValue="$$DATE$$" — defaults to today's chapter-local date
    const defaultEffDate = this.getChapterMinDate();

    this.form = this.fb.group(
      {
        proc: ['', [Validators.required, Validators.maxLength(2)]],
        productType: ['', [Validators.required, Validators.maxLength(5)]],
        numberProducts: ['', [Validators.pattern(/^\d*$/), this.numberRangeValidator()]],
        effDate: [
          defaultEffDate,
          [Validators.required, DateFieldValidationUtility.effectiveDateNotPastValidator()]
        ],
        termDate: [null]
      },
      {
        validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effDate', 'termDate')]
      }
    );
  }

  /**
   * Populate form with existing data for edit mode
   */
  private populateFormForEdit(): void {
    if (!this.data) return;

    // Set edit mode read-only values
    this.editModeValues = {
      proc: this.data.proc || '',
      procDesc: this.data.procDesc || '',
      productType: this.data.productType || '',
      productDesc: this.data.productDesc || '',
      effectiveDate: this.formatDate(this.data.effDate)
    };

    // Set form values
    this.form.patchValue({
      proc: this.data.proc,
      productType: this.data.productType,
      numberProducts: this.data.numberProducts || '',
      effDate: this.data.effDate ? moment(this.data.effDate) : null,
      termDate: this.data.termDate ? moment(this.data.termDate) : null
    });

    // Disable fields that cannot be edited (composite PK + effDate)
    this.form.get('proc')?.disable();
    this.form.get('productType')?.disable();
    this.form.get('effDate')?.disable();

    this.updateTerminationMinDate();
  }

  /**
   * Setup date validation listeners
   */
  private setupDateValidationListeners(): void {
    this.form.statusChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.cdr.markForCheck();
    });

    this.form
      .get('effDate')
      ?.valueChanges.pipe(
        distinctUntilChanged((prev, curr) => {
          if (!prev && !curr) return true;
          if (!prev || !curr) return false;
          return moment(prev).format('YYYY-MM-DD') === moment(curr).format('YYYY-MM-DD');
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.lastChangedDateField = 'effective';
        this.updateTerminationMinDate();
      });

    this.form
      .get('termDate')
      ?.valueChanges.pipe(
        distinctUntilChanged((prev, curr) => {
          if (!prev && !curr) return true;
          if (!prev || !curr) return false;
          return moment(prev).format('YYYY-MM-DD') === moment(curr).format('YYYY-MM-DD');
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.lastChangedDateField = 'termination';
      });
  }

  /**
   * Get chapter-aware minimum date
   */
  private getChapterMinDate(): Moment {
    const chapterDate = DateFieldValidationUtility.getMinDate(this.chapterOffset);
    return moment.utc(chapterDate.format('YYYY-MM-DD'), 'YYYY-MM-DD');
  }

  /**
   * Update termination minimum date based on effective date
   */
  private updateTerminationMinDate(): void {
    const effectiveValue = this.form?.get('effDate')?.value;
    let effectiveMoment: Moment | null = null;

    if (effectiveValue && moment.isMoment(effectiveValue) && effectiveValue.isValid()) {
      effectiveMoment = effectiveValue.clone();
    } else if (effectiveValue instanceof Date && !isNaN(effectiveValue.getTime())) {
      effectiveMoment = moment(effectiveValue);
    }

    if (effectiveMoment) {
      this.terminationMinDate = effectiveMoment.isAfter(this.minDate)
        ? effectiveMoment
        : this.minDate.clone();
    } else {
      this.terminationMinDate = this.minDate;
    }
  }

  /**
   * Handle effective date input
   */
  onEffectiveDateInput(event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value,
      this.form.get('effDate')
    );
  }

  /**
   * Handle effective date change
   */
  onEffectiveDateChange(): void {
    this.form.get('effDate')?.markAsTouched();
    this.form.get('effDate')?.markAsDirty();
    this.form.updateValueAndValidity();
  }

  /**
   * Handle termination date input
   */
  onTerminationDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value,
      this.form.get('termDate'),
      this.mode === 'edit'
    );
  }

  /**
   * Handle termination date change
   */
  onTerminationDateChange(): void {
    this.form.get('termDate')?.markAsTouched();
    this.form.get('termDate')?.markAsDirty();
    this.form.updateValueAndValidity();
  }

  /**
   * Handle number of products input - allow numeric input only, limit to 1 digit
   */
  onNumberProductsInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    // Only allow numeric characters and limit to 1 digit
    const numericValue = value.replace(/[^0-9]/g, '').slice(0, 1);

    // Update the input value if it was changed
    if (value !== numericValue) {
      input.value = numericValue;
      this.form.get('numberProducts')?.setValue(numericValue, { emitEvent: true });
    }

    // Trigger validation to show error if value is out of range
    this.form.get('numberProducts')?.updateValueAndValidity();
  }

  /**
   * Get effective date error message
   */
  getEffectiveDateError(): string {
    const formErrors = this.lastChangedDateField === 'effective' ? this.form.errors : null;
    return DateFieldValidationUtility.getStartDateCrossFieldError(
      this.form.get('effDate'),
      'Effective Date',
      'Termination Date',
      formErrors
    );
  }

  /**
   * Get termination date error message
   */
  getTerminationDateError(): string {
    const formErrors = this.lastChangedDateField === 'termination' ? this.form.errors : null;
    return DateFieldValidationUtility.getEndDateCrossFieldError(
      this.form.get('termDate'),
      'Termination Date',
      'Effective Date',
      formErrors
    );
  }

  /**
   * Handle procedure selection change
   */
  onProcedureChange(): void {
    const selectedValue = this.form.get('proc')?.value;
    if (selectedValue) {
      const selected = this.procedures.find(p => p.code === selectedValue);
      this.selectedProcedureDescription.set(selected?.codeDesc || '');
    } else {
      this.selectedProcedureDescription.set('');
    }
  }

  /**
   * Handle product type selection change
   */
  onProductTypeChange(): void {
    const selectedValue = this.form.get('productType')?.value;
    if (selectedValue) {
      const selected = this.productTypes.find(pt => pt.productCode === selectedValue);
      this.selectedProductTypeDescription.set(selected?.productDesc || '');
    } else {
      this.selectedProductTypeDescription.set('');
    }
  }

  /**
   * Check for date validation errors
   */
  private hasDateValidationError(): boolean {
    return this.form.hasError('dateRangeInvalid') || false;
  }

  /**
   * Save matrix record
   */
  onSave(): void {
    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'termDate');
    this.cdr.markForCheck();

    if (this.form.errors?.['dateRangeInvalid'] && !this.lastChangedDateField) {
      this.lastChangedDateField = 'effective';
    }

    if (this.form.invalid) {
      return;
    }

    if (this.hasDateValidationError()) {
      this.form.get('termDate')?.markAsTouched();
      return;
    }

    const formValue = this.form.getRawValue();

    if (this.mode === 'add') {
      this.createMatrix(formValue);
    } else {
      this.updateMatrix(formValue);
    }
  }

  /**
   * Save and create another (Add mode only)
   */
  onSaveAndCreateAnother(): void {
    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'termDate');
    this.cdr.markForCheck();

    if (this.form.errors?.['dateRangeInvalid'] && !this.lastChangedDateField) {
      this.lastChangedDateField = 'effective';
    }

    if (this.form.invalid) {
      return;
    }

    if (this.hasDateValidationError()) {
      this.form.get('termDate')?.markAsTouched();
      return;
    }

    const formValue = this.form.getRawValue();
    this.createMatrix(formValue, true);
  }

  /**
   * Create new matrix record
   */
  private createMatrix(formValue: any, createAnother = false): void {
    const payload: CreateMatrixDto = {
      proc: formValue.proc,
      productType: formValue.productType,
      numberProducts: formValue.numberProducts || undefined,
      effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effDate) || '',
      termDate: DateFieldValidationUtility.serializeDateForApi(formValue.termDate) || undefined
    };

    this.isSaving.set(true);

    this.service
      .createMatrix(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isSaving.set(false);
          this.handleSuccess(response.message || 'Matrix record created successfully');

          if (createAnother) {
            this.form.reset();
            this.selectedProcedureDescription.set('');
            this.selectedProductTypeDescription.set('');
            this.lastChangedDateField = null;
            DateFieldValidationUtility.setupAddModeValidators(this.form, this.chapterOffset);
            this.form.updateValueAndValidity();
            this.cdr.markForCheck();
            this.recordAdded.emit();
          } else {
            this.saveSuccess.emit();
          }
        },
        error: () => {
          this.isSaving.set(false);
        }
      });
  }

  /**
   * Update existing matrix record
   */
  private updateMatrix(formValue: any): void {
    if (!this.data) return;

    const payload: UpdateMatrixDto = {
      numberProducts: formValue.numberProducts || undefined,
      effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effDate) || '',
      termDate: DateFieldValidationUtility.serializeDateForApi(formValue.termDate) || undefined
    };

    this.isSaving.set(true);

    this.service
      .updateMatrix(this.data.proc, this.data.productType, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isSaving.set(false);
          this.handleSuccess(response.message || 'Matrix record updated successfully');
          this.saveSuccess.emit();
        },
        error: () => {
          this.isSaving.set(false);
        }
      });
  }

  /**
   * Close panel
   */
  onCancel(): void {
    this.closePanel.emit();
  }

  /**
   * Format date for display
   */
  formatDate(dateString?: string): string {
    if (!dateString) return '--';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  formatDateWithTime(dateString?: string): string {
    if (!dateString) return '--';
    let isoString = dateString;
    if (!isoString.endsWith('Z') && !/[+-]\d{2}:\d{2}$/.test(isoString)) {
      isoString += this.chapterOffset || '+00:00';
    }
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return dateString;

    const timeZone = this.chapterOffset || '+00:00';
    if (!TIMEZONE_OFFSET_REGEX.test(timeZone)) return dateString;

    const match = timeZone.match(/^([+-])(\d{2}):(\d{2})$/);
    if (!match) return dateString;

    const sign = match[1] === '+' ? 1 : -1;
    const hh = parseInt(match[2], 10);
    const mm = parseInt(match[3], 10);
    const local = new Date(date.getTime() + sign * (hh * 60 + mm) * 60000);

    const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
    const day = String(local.getUTCDate()).padStart(2, '0');
    const month = MONTHS[local.getUTCMonth()];
    const year = local.getUTCFullYear();
    const hour = String(local.getUTCHours()).padStart(2, '0');
    const minute = String(local.getUTCMinutes()).padStart(2, '0');
    const displayLabel = TIMEZONE_OFFSET_MAP[timeZone]?.abbr ?? `GMT${timeZone}`;

    return `${day}-${month}-${year}, ${hour}:${minute} ${displayLabel}`;
  }

  /**
   * Show success snackbar
   */
  private handleSuccess(message: string): void {
    this.snackBar.open(message, 'Dismiss', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
  }
}
