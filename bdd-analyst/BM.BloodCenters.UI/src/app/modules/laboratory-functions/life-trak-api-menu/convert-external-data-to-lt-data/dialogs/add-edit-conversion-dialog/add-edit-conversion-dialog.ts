import { Component, OnInit, Input, Output, EventEmitter, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormControl,
} from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { dateFormatValidator } from 'src/app/core/utils/date-adapter.util';
import { ConversionMappingApiService } from '../../services/conversion-mapping-api.service';
import {
  ConversionMappingDto,
  TargetValueTypeDto,
  CreateConversionMappingDto,
  UpdateConversionMappingDto,
} from '../../models/conversion-mapping.model';
import moment, { Moment } from 'moment';
import { Subject, takeUntil, distinctUntilChanged } from 'rxjs';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

@Component({
  selector: 'app-add-edit-conversion-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
    MatIconModule,
    NgxMatSelectSearchModule,
  ],
  templateUrl: './add-edit-conversion-dialog.html',
  styleUrl: './add-edit-conversion-dialog.scss',
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
  ],
})
export class AddEditConversionDialog implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() sourceApplId = '';
  @Input() mapping: ConversionMappingDto | null = null;
  @Input() targetValueTypes: TargetValueTypeDto[] = [];
  @Output() close = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<void>();

  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(ConversionMappingApiService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly headerService = inject(HeaderService);

  form!: FormGroup;
  isSaving = false;

  // Target Value Type search
  targetValueTypeSearchControl = new FormControl('');
  filteredTargetValueTypes: TargetValueTypeDto[] = [];

  // Date validation using chapter timezone
  minDate = DateFieldValidationUtility.getMinDate(this.headerService.chapterTimeZone());
  terminationMinDate = DateFieldValidationUtility.getMinDate(this.headerService.chapterTimeZone());

  // Track which date field was last changed for error display
  lastChangedDateField: 'effective' | 'termination' | null = null;

  // Error state matchers for date fields
  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEffectiveDateError());
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTerminationDateError());

  get isEditMode(): boolean {
    return this.mode === 'edit';
  }

  get dialogTitle(): string {
    return this.isEditMode
      ? 'Edit Source & Target Details'
      : 'Add New Source & Target Details';
  }

  get lastModifiedDisplay(): string {
    if (!this.isEditMode || !this.mapping?.lastModDate) return '';
    const date = new Date(this.mapping.lastModDate);
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const day = date.getDate().toString().padStart(2, '0');
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  /** Effective date filter: Edit mode allows all dates, Add mode not before today */
  effectiveDateFilter = (date: any): boolean => {
    if (!date) return true;
    // In Edit mode, allow all dates (including past)
    if (this.isEditMode) return true;
    // In Add mode, don't allow dates before today (using chapter timezone)
    const checkDate = date.clone().startOf('day');
    const today = this.minDate.clone().startOf('day');
    return !checkDate.isBefore(today);
  };

  /** Termination date filter: not before effective date and not before today */
  terminationDateFilter = (date: any): boolean => {
    if (!date) return true;
    const checkDate = date.clone().startOf('day');

    // Cannot be before effective date
    const effDate = this.form.get('effDate')?.value;
    if (effDate) {
      const effectiveDate = moment(effDate).clone().startOf('day');
      if (checkDate.isBefore(effectiveDate)) {
        return false;
      }
    }

    // In Add mode, cannot be before today (using chapter timezone)
    if (!this.isEditMode) {
      const today = this.minDate.clone().startOf('day');
      if (checkDate.isBefore(today)) {
        return false;
      }
    }

    return true;
  };

  getEffectiveDateError(): string {
    const formErrors = this.lastChangedDateField === 'effective' ? this.form.errors : null;
    return DateFieldValidationUtility.getStartDateCrossFieldError(
      this.form.get('effDate'),
      'Effective Date',
      'Termination Date',
      formErrors
    );
  }

  getTerminationDateError(): string {
    const formErrors = this.lastChangedDateField === 'termination' ? this.form.errors : null;
    return DateFieldValidationUtility.getEndDateCrossFieldError(
      this.form.get('termDate'),
      'Termination Date',
      'Effective Date',
      formErrors
    );
  }

  onEffectiveDateInput(event: Event): void {
    this.lastChangedDateField = 'effective';
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value,
      this.form.get('effDate')
    );
  }

  onTerminationDateInput(event: Event): void {
    this.lastChangedDateField = 'termination';
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value,
      this.form.get('termDate'),
      this.isEditMode
    );
  }

  ngOnInit(): void {
    // Initialize filtered target value types
    this.filteredTargetValueTypes = this.targetValueTypes;
    this.setupTargetValueTypeSearch();

    if (this.isEditMode && this.mapping) {
      // Edit mode - Source Value and Target Value are readonly (disabled but validated)
      this.form = this.fb.group({
        sourceValue: [
          { value: this.mapping.sourceValue, disabled: true },
          [Validators.required, Validators.maxLength(15)]
        ],
        targetValue: [
          { value: this.mapping.targetValue, disabled: true },
          [Validators.required, Validators.maxLength(15)]
        ],
        targetValueType: [this.mapping.targetValueType, [Validators.required]],
        effDate: [
          this.mapping.effDate ? moment(this.mapping.effDate) : null,
          [Validators.required]
        ],
        termDate: [this.mapping.termDate ? moment(this.mapping.termDate) : null],
      }, {
        validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effDate', 'termDate')]
      });

      // In Edit mode, allow past dates for Effective Date (existing records can have past dates)
      const effDateControl = this.form.get('effDate');
      if (effDateControl) {
        effDateControl.clearValidators();
        effDateControl.setValidators([
          Validators.required,
          dateFormatValidator(),
          DateFieldValidationUtility.validDateValidator()
        ]);
        effDateControl.updateValueAndValidity();
      }

      // Set terminationMinDate from existing effective date
      if (this.mapping.effDate) {
        this.terminationMinDate = moment(this.mapping.effDate);
      }
    } else {
      // Add mode - all fields editable, effective date cannot be in the past
      this.form = this.fb.group({
        sourceValue: ['', [Validators.required, Validators.maxLength(15)]],
        targetValue: ['', [Validators.required, Validators.maxLength(15)]],
        targetValueType: ['', [Validators.required]],
        effDate: [null, [Validators.required]],
        termDate: [null],
      }, {
        validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effDate', 'termDate')]
      });

      // Setup Add mode validators (prevents past dates for Effective Date)
      DateFieldValidationUtility.setupAddModeValidators(this.form, this.headerService.chapterTimeZone());
    }

    // Setup form value change listeners
    this.setupFormListeners();
  }

  private setupFormListeners(): void {
    // Track which date field was last changed for cross-field error display
    this.form.get('effDate')?.valueChanges
      .pipe(
        distinctUntilChanged((prev, curr) => {
          if (!prev && !curr) return true;
          if (!prev || !curr) return false;
          if (!prev.isValid || !curr.isValid) return false;
          if (!prev.isValid() || !curr.isValid()) return false;
          return prev.format('YYYY-MM-DD') === curr.format('YYYY-MM-DD');
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.lastChangedDateField = 'effective';
        this.updateTerminationMinDate();
      });

    this.form.get('termDate')?.valueChanges
      .pipe(
        distinctUntilChanged((prev, curr) => {
          if (!prev && !curr) return true;
          if (!prev || !curr) return false;
          if (!prev.isValid || !curr.isValid) return false;
          if (!prev.isValid() || !curr.isValid()) return false;
          return prev.format('YYYY-MM-DD') === curr.format('YYYY-MM-DD');
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.lastChangedDateField = 'termination';
      });
  }

  private updateTerminationMinDate(): void {
    const effDate = this.form.get('effDate')?.value;
    if (effDate && effDate.isValid && effDate.isValid()) {
      this.terminationMinDate = moment(effDate);
    }
    // Revalidate termination date when effective date changes
    this.form.get('termDate')?.updateValueAndValidity();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupTargetValueTypeSearch(): void {
    this.targetValueTypeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.filterTargetValueTypes();
      });
  }

  private filterTargetValueTypes(): void {
    const searchTerm = (this.targetValueTypeSearchControl.value || '').toLowerCase().trim();
    if (!searchTerm) {
      this.filteredTargetValueTypes = this.targetValueTypes;
    } else {
      this.filteredTargetValueTypes = this.targetValueTypes.filter(type =>
        type.code.toLowerCase().includes(searchTerm) ||
        type.codeDesc.toLowerCase().includes(searchTerm)
      );
    }
  }

  onSave(): void {
    if (this.form.invalid || this.isSaving) return;

    this.isSaving = true;
    const formValues = this.form.getRawValue();

    if (this.isEditMode && this.mapping) {
      this.updateMapping(formValues);
    } else {
      this.createMapping(formValues, false);
    }
  }

  onSaveAndAddAnother(): void {
    if (this.form.invalid || this.isSaving || this.isEditMode) return;

    this.isSaving = true;
    const formValues = this.form.getRawValue();
    this.createMapping(formValues, true);
  }

  private createMapping(formValues: any, addNew: boolean): void {
    const dto: CreateConversionMappingDto = {
      sourceApplId: this.sourceApplId,
      targetApplId: 'BC',
      sourceValue: formValues.sourceValue,
      targetValue: formValues.targetValue,
      targetValueType: formValues.targetValueType,
      effDate: DateFieldValidationUtility.serializeDateForApi(formValues.effDate) || '',
      termDate: formValues.termDate
        ? DateFieldValidationUtility.serializeDateForApi(formValues.termDate) || undefined
        : undefined,
    };

    this.apiService.createConversionMapping(dto).subscribe({
      next: (response) => {
        this.isSaving = false;
        if (response.success) {
          this.snackbarService.showSuccess('1 new entry has been saved successfully');
          this.saveSuccess.emit();
          if (addNew) {
            // Reset form for adding another
            this.form.reset();
          } else {
            this.close.emit();
          }
        } else {
          const errorCode = response?.errorCode || response?.errorResponse?.errorCode;
          const errorMessage =
            response?.error ||
            response?.errorResponse?.error ||
            response?.message ||
            'Failed to create conversion mapping';
          const displayMessage = errorCode ? `${errorCode}: ${errorMessage}` : errorMessage;
          this.snackbarService.showError(displayMessage);
        }
      },
      error: (error) => {
        this.isSaving = false;
        const errorResponse = error?.error?.errorResponse || error?.error;
        const errorCode = errorResponse?.errorCode;
        const errorMessage =
          errorResponse?.error ||
          error?.error?.message ||
          error?.error?.Error ||
          'An error occurred while creating the conversion mapping';
        const displayMessage = errorCode ? `${errorCode}: ${errorMessage}` : errorMessage;
        this.snackbarService.showError(displayMessage);
      },
    });
  }

  private updateMapping(formValues: any): void {
    const dto: UpdateConversionMappingDto = {
      targetValueType: formValues.targetValueType,
      effDate: DateFieldValidationUtility.serializeDateForApi(formValues.effDate) || '',
      termDate: formValues.termDate
        ? DateFieldValidationUtility.serializeDateForApi(formValues.termDate) || undefined
        : undefined,
    };

    const mapping = this.mapping!;

    this.apiService
      .updateConversionMapping(
        mapping.sourceApplId,
        mapping.targetApplId,
        mapping.sourceValue,
        mapping.targetValue,
        mapping.targetValueType,
        dto
      )
      .subscribe({
        next: (response) => {
          this.isSaving = false;
          if (response.success) {
            this.snackbarService.showSuccess('All changes have been saved successfully');
            this.saveSuccess.emit();
            this.close.emit();
          } else {
            const errorCode = response?.errorCode || response?.errorResponse?.errorCode;
            const errorMessage =
              response?.error ||
              response?.errorResponse?.error ||
              response?.message ||
              'Failed to update conversion mapping';
            const displayMessage = errorCode ? `${errorCode}: ${errorMessage}` : errorMessage;
            this.snackbarService.showError(displayMessage);
          }
        },
        error: (error) => {
          this.isSaving = false;
          const errorResponse = error?.error?.errorResponse || error?.error;
          const errorCode = errorResponse?.errorCode;
          const errorMessage =
            errorResponse?.error ||
            error?.error?.message ||
            error?.error?.Error ||
            'An error occurred while updating the conversion mapping';
          const displayMessage = errorCode ? `${errorCode}: ${errorMessage}` : errorMessage;
          this.snackbarService.showError(displayMessage);
        },
      });
  }

  onCancel(): void {
    this.close.emit();
  }
}
