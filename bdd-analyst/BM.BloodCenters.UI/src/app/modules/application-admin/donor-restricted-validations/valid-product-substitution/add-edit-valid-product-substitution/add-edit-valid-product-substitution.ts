import { Component, EventEmitter, Input, OnInit, Output, OnDestroy, OnChanges, SimpleChanges, ViewChild, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule, Validators, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepicker, MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { ValidProductSubstitutionService } from '../services/valid-product-substitution.service';
import { HeaderService } from '@shared/services/header.service';
import moment from 'moment';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { Subject, takeUntil, finalize } from 'rxjs';
import {
  ValidProductSubstitutionModel,
  ValidProductSubstitutionDto,
  UpdateValidProductSubstitutionDto,
  ProductTypeLookup
} from '../models/valid-product-substitution.model';

export interface AddEditProductSubstitutionDialogData {
  mode: 'add' | 'edit';
  data?: ValidProductSubstitutionModel;
}

@Component({
  selector: 'app-add-edit-valid-product-substitution',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './add-edit-valid-product-substitution.html',
  styleUrls: ['./add-edit-valid-product-substitution.scss']
})
export class AddEditValidProductSubstitution implements OnInit, OnChanges, OnDestroy {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() data: ValidProductSubstitutionModel | null = null;
  @Output() closePanel = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<void>();
  @Output() modeChange = new EventEmitter<'add' | 'edit'>();

  @ViewChild('terminationPicker') terminationPicker?: MatDatepicker<moment.Moment>;

  form: FormGroup;
  panelTitle: string = '';

  // Search control for dropdown
  productTypeSearchCtrl = new FormControl('');

  // Signal-based lookup data
  readonly productTypeSearch = signal('');
  readonly productTypeOptionsSignal = signal<ProductTypeLookup[]>([]);
  readonly filteredProductTypeOptions = computed(() => {
    const search = this.productTypeSearch().toLowerCase();
    const options = this.productTypeOptionsSignal();
    if (!search) return options;
    return options.filter(opt =>
      opt.code.toLowerCase().includes(search) ||
      opt.description.toLowerCase().includes(search)
    );
  });

  // Filtered options for Compatible Product Type dropdown
  // Note: Does NOT exclude request product type - allows selection to trigger Error 5331
  readonly filteredCompatibleProductTypeOptions = computed(() => {
    const search = this.productTypeSearch().toLowerCase();
    const options = this.productTypeOptionsSignal();

    if (!search) return options;

    return options.filter(opt =>
      opt.code.toLowerCase().includes(search) ||
      opt.description.toLowerCase().includes(search)
    );
  });

  minDate = DateFieldValidationUtility.getMinDate();

  isLoadingOptions = false;
  isSaving = false;

  private originalValues = {
    requestProductType: '',
    compatibleProductType: ''
  };

  private initialFormSnapshot: string = '';
  private lastChangedDateField: 'effective' | 'termination' | null = null;
  private lastSameProductTypeError: boolean = false;

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEffectiveDateError());
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTerminationDateError());

  // Visual filter to gray out dates before effective date
  terminationDateFilterFn = (date: moment.Moment | null): boolean => {
    if (!date) return true;

    const checkDate = moment.isMoment(date) ? date : moment(date);

    // Must be >= chapter's today
    if (checkDate.isBefore(this.minDate, 'day')) {
      return false;
    }

    // Must be >= effective date (if set)
    const effectiveDate = this.form?.get('effectiveDate')?.value;
    if (effectiveDate && moment.isMoment(effectiveDate)) {
      const effDay = moment(effectiveDate).startOf('day');
      if (checkDate.isBefore(effDay, 'day')) {
        return false;
      }
    }

    return true;
  };

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private validProductSubstitutionService: ValidProductSubstitutionService,
    private snackBar: MatSnackBar,
    private headerService: HeaderService
  ) {
    this.form = this.fb.group({
      requestProductType: ['', [Validators.required]],
      compatibleProductType: ['', [Validators.required]],
      effectiveDate: [null, [Validators.required]],
      terminationDate: [null]
    }, {
      validators: [
        DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate'),
        this.productTypeNotSameValidator()
      ]
    });
  }

  /**
   * Custom validator to ensure request and compatible product types are different
   * Matches FMB error 5331: Compatible product type cannot be same as requested product type
   */
  private productTypeNotSameValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!(control instanceof FormGroup)) return null;

      const requested = control.get('requestProductType')?.value;
      const compatible = control.get('compatibleProductType')?.value;

      if (requested && compatible && requested === compatible) {
        return { sameProductType: true };
      }

      return null;
    };
  }

  ngOnInit(): void {
    this.setupPanel();
    this.setupSubscriptions();
    this.loadProductTypes();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mode'] || changes['data']) {
      if (!changes['mode']?.firstChange && !changes['data']?.firstChange) {
        this.setupPanel();

        if (this.mode === 'add') {
          this.resetFormForAddMode();
        }
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupPanel(): void {
    if (this.mode === 'add') {
      this.panelTitle = 'Add New Record';
      DateFieldValidationUtility.setupAddModeValidators(this.form, this.headerService.chapterTimeZone());
    } else {
      this.panelTitle = 'Edit Record';
      this.populateFormForEdit();
    }
  }

  /**
   * Setup all form subscriptions - called ONCE from ngOnInit
   * Prevents duplicate subscriptions when mode changes
   */
  private setupSubscriptions(): void {
    // Track which field was last changed for smart error display
    this.form.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'effective';
        // Close termination picker to force filter re-evaluation
        this.terminationPicker?.close();
      });

    this.form.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => { this.lastChangedDateField = 'termination'; });

    // Setup search subscription
    this.productTypeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.productTypeSearch.set(value || ''));

    // Watch for Error 5331 (same product type) and show popup immediately
    this.form.statusChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const hasSameProductTypeError = this.form.hasError('sameProductType');

        // Only show popup when error state changes from false to true
        if (hasSameProductTypeError && !this.lastSameProductTypeError) {
          const requestValue = this.form.get('requestProductType')?.value;
          const compatibleValue = this.form.get('compatibleProductType')?.value;

          // Only show if both values are actually set and equal
          if (requestValue && compatibleValue && requestValue === compatibleValue) {
            this.snackBar.open(
              'Error 5331: Compatible product type cannot be same as requested product type',
              'DISMISS',
              {
                horizontalPosition: 'end',
                verticalPosition: 'top',
                panelClass: ['error-snackbar']
              }
            );
          }
        }

        // Update the last error state
        this.lastSameProductTypeError = hasSameProductTypeError;
      });
  }

  private resetFormForAddMode(): void {
    this.originalValues = {
      requestProductType: '',
      compatibleProductType: ''
    };

    this.form.reset();
    this.form.markAsUntouched();
    this.form.markAsPristine();

    DateFieldValidationUtility.setupAddModeValidators(this.form, this.headerService.chapterTimeZone());

    this.initialFormSnapshot = '';
    this.lastSameProductTypeError = false;
  }

  private loadProductTypes(): void {
    this.isLoadingOptions = true;

    this.validProductSubstitutionService.getInventoryProductTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: ProductTypeLookup[]) => {
          this.productTypeOptionsSignal.set(response || []);
          this.isLoadingOptions = false;
        },
        error: (error) => {
          console.error('Error loading product types:', error);
          this.productTypeOptionsSignal.set([]);
          this.isLoadingOptions = false;
        }
      });
  }

  private populateFormForEdit(): void {
    if (!this.data) return;

    const record = this.data;
    const requestProductType = record.requestProductType || '';
    const compatibleProductType = record.compatibleProductType || '';

    this.originalValues = { requestProductType, compatibleProductType };

    this.form.patchValue({
      requestProductType,
      compatibleProductType,
      effectiveDate: record.effectiveDate ? moment(record.effectiveDate) : null,
      terminationDate: record.terminationDate ? moment(record.terminationDate) : null
    });

    DateFieldValidationUtility.setupEditModeValidators(this.form);

    // Re-enable effective date so it is editable in edit mode
    const effControl = this.form.get('effectiveDate');
    if (effControl) {
      effControl.enable();
      effControl.setValidators([Validators.required]);
      effControl.updateValueAndValidity();
    }

    this.initialFormSnapshot = this.getFormSnapshot();
    this.lastSameProductTypeError = false;

    this.form.markAsPristine();
    this.form.markAsUntouched();
  }

  onCancel(): void {
    this.closePanel.emit();
  }

  onSave(): void {
    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'terminationDate');

    // Check for same product type error (Error 5331)
    if (this.form.hasError('sameProductType')) {
      this.snackBar.open(
        'Error 5331: Compatible product type cannot be same as requested product type',
        'DISMISS',
        {
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        }
      );
      return;
    }

    if (this.form.invalid) {
      return;
    }

    const formValue = this.form.getRawValue();
    this.isSaving = true;

    let apiCall;

    if (this.mode === 'add') {
      const addPayload: ValidProductSubstitutionDto = {
        requestProductType: formValue.requestProductType?.trim() || '',
        compatibleProductType: formValue.compatibleProductType || '',
        effectiveDate: DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate) || '',
        terminationDate: DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate)
      };
      apiCall = this.validProductSubstitutionService.addValidProductSubstitution(addPayload);
    } else {
      const updatePayload: UpdateValidProductSubstitutionDto = {
        originalRequestProductType: this.originalValues.requestProductType,
        originalCompatibleProductType: this.originalValues.compatibleProductType,
        requestProductType: formValue.requestProductType || '',
        compatibleProductType: formValue.compatibleProductType || '',
        effectiveDate: DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate) || '',
        terminationDate: DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate)
      };
      apiCall = this.validProductSubstitutionService.updateValidProductSubstitution(updatePayload);
    }

    apiCall
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isSaving = false;
        })
      )
      .subscribe({
        next: (response: any) => {
          const message = response?.message || (this.mode === 'add'
            ? 'Record added successfully'
            : 'Record updated successfully');

          this.snackBar.open(message, 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });

          this.saveSuccess.emit();
          this.closePanel.emit();
        },
        error: (error) => {
          // Handle specific errors with snackbar notification
          let errorMessage = 'An error occurred while saving the record.';

          // Extract error message from API response
          // Note: Error 5331 (same product types) is validated on UI,
          // but API validation also exists for defense in depth (direct API calls)
          if (error?.error?.errorResponse?.error) {
            // Use the error message from ErrorResponse
            errorMessage = `Error ${error.error.errorCode}: ${error.error.errorResponse.error}`;
          } else if (error?.error?.message) {
            errorMessage = error.error.message;
          } else if (error?.message) {
            errorMessage = error.message;
          }

          this.snackBar.open(errorMessage, 'DISMISS', {
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  getRequestedProductTypeError(): string {
    const control = this.form.get('requestProductType');
    if (!control) return '';

    // Check for form-level error: same product type validation (Error 5331)
    // Show immediately without requiring field to be touched
    if (this.form.hasError('sameProductType')) {
      return 'Error 5331: Requested product type cannot be same as compatible product type';
    }

    // Show other errors only when touched
    if (!control.touched) return '';
    if (control.hasError('required')) return 'Requested Inventory Product Type is required';

    return '';
  }

  getCompatibleProductTypeError(): string {
    const control = this.form.get('compatibleProductType');
    if (!control) return '';

    // Check for form-level error: same product type validation (Error 5331)
    // Show immediately without requiring field to be touched
    if (this.form.hasError('sameProductType')) {
      return 'Error 5331: Compatible product type cannot be same as requested product type';
    }

    // Show other errors only when touched
    if (!control.touched) return '';
    if (control.hasError('required')) return 'Compatible Inventory Product Type is required';

    return '';
  }

  getEffectiveDateError(): string {
    const formErrors = this.lastChangedDateField === 'effective' ? this.form.errors : null;
    return DateFieldValidationUtility.getStartDateCrossFieldError(
      this.form.get('effectiveDate'), 'Effective Date', 'Termination Date', formErrors
    );
  }

  getTerminationDateError(): string {
    const formErrors = this.lastChangedDateField === 'termination' ? this.form.errors : null;
    return DateFieldValidationUtility.getEndDateCrossFieldError(
      this.form.get('terminationDate'), 'Termination Date', 'Effective Date', formErrors
    );
  }

  onEffectiveDateInput(event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value, this.form.get('effectiveDate')
    );
  }

  onTerminationDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value, this.form.get('terminationDate'), this.mode === 'edit'
    );
  }

  /**
   * Get the minimum date for Termination Date picker
   * In add mode: uses effective date
   * In edit mode: uses the later of original termination date or effective date
   * This prevents users from selecting dates earlier than the currently saved termination date
   */
  getTerminationDateMin(): moment.Moment | null {
    const effectiveDate = this.form.get('effectiveDate')?.value;

    // Termination date must be >= effective date (if effective date exists)
    // This allows backward selection in edit mode while maintaining date ordering
    if (effectiveDate) {
      const effMoment = moment.isMoment(effectiveDate) ? effectiveDate : moment(effectiveDate);
      // Return the later of: effective date OR chapter's today
      return effMoment.isAfter(this.minDate, 'day') ? effMoment : this.minDate;
    }

    // No effective date selected yet - use chapter's today as minimum
    return this.minDate;
  }

  private getFormSnapshot(): string {
    const val = this.form.getRawValue();
    return JSON.stringify({
      requestProductType: val.requestProductType || '',
      compatibleProductType: val.compatibleProductType || '',
      effectiveDate: val.effectiveDate ? (moment.isMoment(val.effectiveDate) ? val.effectiveDate.format('YYYY-MM-DD') : '') : '',
      terminationDate: val.terminationDate ? (moment.isMoment(val.terminationDate) ? val.terminationDate.format('YYYY-MM-DD') : '') : ''
    });
  }

  get isFormChanged(): boolean {
    if (this.mode === 'add') return true;
    return this.getFormSnapshot() !== this.initialFormSnapshot;
  }

  get isFormValid(): boolean {
    return this.form.valid && this.isFormChanged;
  }
}
