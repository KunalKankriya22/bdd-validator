import { Component, EventEmitter, Input, OnInit, Output, OnDestroy, OnChanges, SimpleChanges, ViewChild, signal, computed, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepicker, MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { ABOProdCompatibilityService } from '../services/abo-prod-compatibility.service';
import { HeaderService } from '@shared/services/header.service';
import moment from 'moment';
import { Subject, takeUntil, finalize, debounceTime } from 'rxjs';
import {
  ABOProdCompatibilityModel,
  ABOProdCompatibilityDto,
  UpdateABOProdCompatibilityDto,
  ABOCodeOption
} from '../models/abo-prod-compatibility.model';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { dateFormatValidator } from 'src/app/core/utils/date-adapter.util';

export interface ABOProdCompatibilityFormData {
  productType: string;
  requestABO: string;
  compatibleABO: string;
  effectiveDate: Date;
  terminationDate?: Date | null;
}

interface EditModeInitialFormValues {
  effectiveDate: moment.Moment | null;
  terminationDate: moment.Moment | null;
}

@Component({
  selector: 'app-add-edit-abo-prod-compatibility',
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
    ReactiveFormsModule,
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './add-edit-abo-prod-compatibility.html',
  styleUrls: ['./add-edit-abo-prod-compatibility.scss']
})
export class AddEditABOProdCompatibility implements OnInit, OnChanges, OnDestroy {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() data: ABOProdCompatibilityModel | null = null;
  @Output() closePanel = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<ABOProdCompatibilityFormData>();
  @Output() modeChange = new EventEmitter<'add' | 'edit'>();

  @ViewChild('terminationPicker') terminationPicker?: MatDatepicker<moment.Moment>;

  form: FormGroup;
  panelTitle: string = '';
  lastUpdated: string = '';

  editModeValues: {
    productType: string;
    description: string;
    requestABO: string;
    compatibleABO: string;
    effectiveDate: string;
    terminationDate: string;
  } = {
      productType: '',
      description: '',
      requestABO: '',
      compatibleABO: '',
      effectiveDate: '',
      terminationDate: ''
    };

  // Search controls for dropdowns
  productTypeSearchCtrl = new FormControl('');
  requestABOSearchCtrl = new FormControl('');
  compatibleABOSearchCtrl = new FormControl('');

  // Signal-based lookup data for Product Types
  readonly productTypeSearch = signal('');
  readonly productTypeOptionsSignal = signal<Array<{ productType: string; description: string }>>([]);
  readonly filteredProductTypes = computed(() => {
    const search = this.productTypeSearch().toLowerCase();
    const options = this.productTypeOptionsSignal();
    // Show all options if search is empty or less than 3 characters
    if (!search) return options;
    return options.filter(opt =>
      (opt.productType?.toLowerCase() || '').includes(search) ||
      (opt.description?.toLowerCase() || '').includes(search)
    );
  });

  // Signal-based lookup data for ABO Codes
  readonly requestABOSearch = signal('');
  readonly compatibleABOSearch = signal('');
  readonly aboCodeOptionsSignal = signal<ABOCodeOption[]>([]);
  readonly filteredRequestABOOptions = computed(() => {
    const search = this.requestABOSearch().toLowerCase();
    const options = this.aboCodeOptionsSignal();
    // Show all options if search is empty or less than 3 characters
    if (!search) return options;
    return options.filter(opt =>
      (opt.key?.toLowerCase() || '').includes(search) ||
      (opt.value?.toLowerCase() || '').includes(search)
    );
  });

  readonly filteredCompatibleABOOptions = computed(() => {
    const search = this.compatibleABOSearch().toLowerCase();
    const options = this.aboCodeOptionsSignal();
    if (!search) return options;
    return options.filter(opt =>
      (opt.key?.toLowerCase() || '').includes(search) ||
      (opt.value?.toLowerCase() || '').includes(search)
    );
  });

  isLoadingOptions = false;
  isSaving = false;

  // Minimum date for datepickers (chapter's today) — set in constructor
  minDate!: moment.Moment;

  /** Tracks which date field was last changed — cross-field error shows only on that field */
  private lastChangedDateField: 'effective' | 'termination' | null = null;

  /** Track initial form values for edit mode to detect changes */
  private initialFormValues: EditModeInitialFormValues | null = null;

  /** Cached error strings — updated via debounceTime(0) to avoid NG0100 */
  effectiveDateError = '';
  terminationDateError = '';

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.effectiveDateError);
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.terminationDateError);

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

  // Minimum date for termination datepicker: max(effectiveDate, today)
  get terminationMinDate() {
    const effectiveDate = this.form.get('effectiveDate')?.value;
    if (effectiveDate) {
      const effMoment = moment.isMoment(effectiveDate) ? effectiveDate : moment(effectiveDate);
      // Use 'day' granularity to avoid timezone/millisecond precision issues
      return effMoment.isAfter(this.minDate, 'day') ? effMoment : this.minDate;
    }
    return this.minDate;
  }

  // Store original values for edit mode (needed for update API)
  private originalValues: {
    productType: string;
    requestABO: string;
    compatibleABO: string;
    effectiveDate: Date | null;
  } = {
    productType: '',
    requestABO: '',
    compatibleABO: '',
    effectiveDate: null
  };

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private aboProductCompatibilityService: ABOProdCompatibilityService,
    private snackBar: MatSnackBar,
    private headerService: HeaderService,
    private cdr: ChangeDetectorRef
  ) {
    this.minDate = DateFieldValidationUtility.getMinDate(this.headerService.chapterTimeZone());
    this.form = this.fb.group({
      productType: ['', [Validators.required]],
      requestABO: ['', [Validators.required]],
      compatibleABO: ['', [Validators.required]],
      effectiveDate: [null, [Validators.required]],
      terminationDate: [null]
    }, {
      validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate')]
    });
  }

  ngOnInit(): void {
    this.setupPanel();
    this.setupSubscriptions();
    this.loadDropdownOptions();
  }

  /**
   * Load dropdown options from API
   */
  private loadDropdownOptions(): void {
    this.isLoadingOptions = true;

    this.aboProductCompatibilityService.getAddDropdownValues()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Handle different response structures: response.item, response.data[0], or response directly
          let dropdownData = null;

          if (response.item) {
            dropdownData = response.item;
          } else if (response.data && response.data.length > 0) {
            dropdownData = response.data[0];
          } else if (response && response.productTypes) {
            dropdownData = response;
          }

          if (dropdownData) {
            // Set signal values
            this.productTypeOptionsSignal.set(dropdownData.productTypes || []);
            this.aboCodeOptionsSignal.set(dropdownData.aboCodes || []);
          } else {
            console.warn('No dropdown data found in response');
          }

          this.isLoadingOptions = false;
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error loading dropdown options:', error);

          // Set empty arrays on error
          this.productTypeOptionsSignal.set([]);
          this.aboCodeOptionsSignal.set([]);

          this.isLoadingOptions = false;
        }
      });
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
      this.lastUpdated = '';
      DateFieldValidationUtility.setupAddModeValidators(this.form, this.headerService.chapterTimeZone());
    } else {
      this.panelTitle = 'Edit Record';
      const modificationDate = this.data?.modificationDate;
      this.lastUpdated = modificationDate
        ? `Last Updated: ${this.formatDateTime(modificationDate)}`
        : '';
      this.populateFormForEdit();

      // Setup edit mode validators
      DateFieldValidationUtility.setupEditModeValidators(this.form);

      // Re-enable effective date for editing (the shared utility disables it by default)
      const effDateControl = this.form.get('effectiveDate');
      if (effDateControl) {
        effDateControl.enable();
        effDateControl.setValidators([
          Validators.required,
          dateFormatValidator(),
          DateFieldValidationUtility.validDateValidator(),
          DateFieldValidationUtility.effectiveDateNotPastValidator(this.headerService.chapterTimeZone())
        ]);
        effDateControl.updateValueAndValidity();
      }

      this.form.get('terminationDate')?.setValidators([DateFieldValidationUtility.terminationDateNotPastValidator()]);
      this.form.get('terminationDate')?.updateValueAndValidity();
    }
  }

  /**
   * Setup all form subscriptions - called ONCE from ngOnInit
   * Prevents duplicate subscriptions when mode changes
   */
  private setupSubscriptions(): void {
    // Setup search subscriptions
    this.productTypeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.productTypeSearch.set(value || ''));

    this.requestABOSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.requestABOSearch.set(value || ''));

    this.compatibleABOSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.compatibleABOSearch.set(value || ''));

    this.form.valueChanges
      .pipe(debounceTime(0), takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateDateErrors();
        this.cdr.markForCheck();
      });
  }

  private resetFormForAddMode(): void {
    this.editModeValues = {
      productType: '',
      description: '',
      requestABO: '',
      compatibleABO: '',
      effectiveDate: '',
      terminationDate: ''
    };

    this.form.reset();
    this.form.markAsUntouched();
    this.form.markAsPristine();

    // Enable all fields for add mode
    this.form.get('productType')?.enable();
    this.form.get('requestABO')?.enable();
    this.form.get('compatibleABO')?.enable();
    this.form.get('effectiveDate')?.enable();

    // Restore required validators for add mode
    this.form.get('productType')?.setValidators([Validators.required]);
    this.form.get('requestABO')?.setValidators([Validators.required]);
    this.form.get('compatibleABO')?.setValidators([Validators.required]);

    // Update validity
    this.form.get('productType')?.updateValueAndValidity();
    this.form.get('requestABO')?.updateValueAndValidity();
    this.form.get('compatibleABO')?.updateValueAndValidity();
    this.form.get('effectiveDate')?.updateValueAndValidity();
  }

  private populateFormForEdit(): void {
    if (this.data) {
      const productType = this.data.productType || '';
      const requestABO = this.data.requestABO || '';
      const compatibleABO = this.data.compatibleABO || '';

      // Store original values for update API
      this.originalValues = {
        productType,
        requestABO,
        compatibleABO,
        effectiveDate: this.data.effectiveDate || null
      };

      // Use display values for read-only fields in edit mode
      this.editModeValues = {
        productType,
        description: this.data.productDescription || '',
        requestABO: this.data.requestABODisplay || requestABO,
        compatibleABO: this.data.compatibleABODisplay || compatibleABO,
        effectiveDate: this.data.effectiveDate ? this.formatDateForDisplay(this.data.effectiveDate) : '',
        terminationDate: this.data.terminationDate ? this.formatDateForDisplay(this.data.terminationDate) : ''
      };

      // In edit mode, only dates are editable - disable other fields
      this.form.patchValue({
        productType,
        requestABO,
        compatibleABO,
        effectiveDate: this.data.effectiveDate ? moment(this.data.effectiveDate) : null,
        terminationDate: this.data.terminationDate ? moment(this.data.terminationDate) : null
      });

      // Disable non-editable fields in edit mode
      this.form.get('productType')?.disable();
      this.form.get('requestABO')?.disable();
      this.form.get('compatibleABO')?.disable();

      // Store initial form values to track changes in edit mode
      this.initialFormValues = {
        effectiveDate: this.data.effectiveDate ? moment(this.data.effectiveDate) : null,
        terminationDate: this.data.terminationDate ? moment(this.data.terminationDate) : null
      };
    }
  }

  private formatDateForDisplay(date: Date | null | undefined): string {
    if (!date) return '';
    const m = moment(date);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : '';
  }

  onCancel(): void {
    this.closePanel.emit();
  }

  onSave(): void {
    this.form.markAllAsTouched();
    this.updateDateErrors();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'terminationDate');

    if (!this.isFormValid) {
      return;
    }

    const formValue = this.form.getRawValue();

    this.isSaving = true;

    let apiCall;

    if (this.mode === 'add') {
      const addPayload: ABOProdCompatibilityDto = {
        inventoryProductType: formValue.productType?.trim() || '',
        requestedABO: formValue.requestABO || '',
        compatibleABO: formValue.compatibleABO || '',
        effectiveDate: DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate) || '',
        terminationDate: DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate)
      };
      apiCall = this.aboProductCompatibilityService.addABOProdCompatibility(addPayload);
    } else {
      const effectiveDateChanged = this.hasDateChanged(formValue.effectiveDate, this.initialFormValues?.effectiveDate ?? null);
      const updatePayload: UpdateABOProdCompatibilityDto = {
        // Current values (to identify the record)
        currentInventoryProductType: this.originalValues.productType,
        currentRequestedABO: this.originalValues.requestABO,
        currentCompatibleABO: this.originalValues.compatibleABO,
        currentEffectiveDate: DateFieldValidationUtility.serializeDateForApi(this.originalValues.effectiveDate) || '',
        // New values
        newCompatibleABO: formValue.compatibleABO || '',
        newEffectiveDate: effectiveDateChanged ? DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate) : null,
        newTerminationDate: DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate)
      };
      apiCall = this.aboProductCompatibilityService.updateABOProdCompatibility(updatePayload);
    }

    apiCall
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isSaving = false;
        })
      )
      .subscribe({
        next: () => {
          const productType = formValue.productType?.trim() || '';
          const message = this.mode === 'add'
            ? `New substitution record for ${productType} has been successfully added.`
            : `Substitution record for ${productType} has been successfully updated.`;

          this.snackBar.open(message, 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });

          const result: ABOProdCompatibilityFormData = {
            productType: formValue.productType?.trim() || '',
            requestABO: formValue.requestABO || '',
            compatibleABO: formValue.compatibleABO || '',
            effectiveDate: formValue.effectiveDate?.toDate() || new Date(),
            terminationDate: formValue.terminationDate?.toDate() || null
          };

          this.saveSuccess.emit(result);
          this.closePanel.emit();
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error saving abo product compatibility:', error);

          let errorMessage = error.error?.message;

          if (!errorMessage) {
            if (error.status === 409) {
              errorMessage = 'This ABO Product Compatibility already exists';
            } else if (error.status === 404) {
              errorMessage = 'Record not found';
            } else {
              errorMessage = 'An error occurred while saving';
            }
          }

          this.snackBar.open(errorMessage, 'Close', {
            duration: 5000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
          this.cdr.markForCheck();
        }
      });
  }

  onSaveAndCreateAnother(): void {
    this.form.markAllAsTouched();
    this.updateDateErrors();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'terminationDate');

    if (!this.isFormValid) {
      return;
    }

    const formValue = this.form.getRawValue();

    this.isSaving = true;

    let apiCall;

    if (this.mode === 'add') {
      const addPayload: ABOProdCompatibilityDto = {
        inventoryProductType: formValue.productType?.trim() || '',
        requestedABO: formValue.requestABO || '',
        compatibleABO: formValue.compatibleABO || '',
        effectiveDate: DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate) || '',
        terminationDate: DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate)
      };
      apiCall = this.aboProductCompatibilityService.addABOProdCompatibility(addPayload);
    } else {
      const effectiveDateChanged = this.hasDateChanged(formValue.effectiveDate, this.initialFormValues?.effectiveDate ?? null);
      const updatePayload: UpdateABOProdCompatibilityDto = {
        // Current values (to identify the record)
        currentInventoryProductType: this.originalValues.productType,
        currentRequestedABO: this.originalValues.requestABO,
        currentCompatibleABO: this.originalValues.compatibleABO,
        currentEffectiveDate: DateFieldValidationUtility.serializeDateForApi(this.originalValues.effectiveDate) || '',
        // New values
        newCompatibleABO: formValue.compatibleABO || '',
        newEffectiveDate: effectiveDateChanged ? DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate) : null,
        newTerminationDate: DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate)
      };
      apiCall = this.aboProductCompatibilityService.updateABOProdCompatibility(updatePayload);
    }

    apiCall
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isSaving = false;
        })
      )
      .subscribe({
        next: () => {
          const productType = formValue.productType?.trim() || '';
          const message = this.mode === 'add'
            ? `New substitution record for ${productType} has been successfully added.`
            : `Substitution record for ${productType} has been successfully updated.`;

          this.snackBar.open(message, 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });

          const result: ABOProdCompatibilityFormData = {
            productType: formValue.productType?.trim() || '',
            requestABO: formValue.requestABO || '',
            compatibleABO: formValue.compatibleABO || '',
            effectiveDate: formValue.effectiveDate?.toDate() || new Date(),
            terminationDate: formValue.terminationDate?.toDate() || null
          };

          this.saveSuccess.emit(result);

          if (this.mode === 'edit') {
            this.mode = 'add';
            this.modeChange.emit('add');
            this.resetFormForAddMode();
            this.setupPanel();
          } else {
            this.resetFormForAddMode();
          }
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error saving abo product compatibility:', error);

          let errorMessage = error.error?.message;

          if (!errorMessage) {
            if (error.status === 409) {
              errorMessage = 'This ABO Product Compatibility already exists';
            } else if (error.status === 404) {
              errorMessage = 'Record not found';
            } else {
              errorMessage = 'An error occurred while saving';
            }
          }

          this.snackBar.open(errorMessage, 'Close', {
            duration: 5000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
          this.cdr.markForCheck();
        }
      });
  }

  formatDateTime(date: Date | null): string {
    if (!date) return '';
    const momentDate = moment(date);
    const isToday = momentDate.isSame(moment(), 'day');
    const timezone = this.headerService.chapterTimeZone() || 'PST';

    if (isToday) {
      return momentDate.format(`[Today], hh:mm A [${timezone}]`);
    } else {
      return momentDate.format(`DD-MMM-YYYY, hh:mm A [${timezone}]`);
    }
  }

  get productTypeControl() {
    return this.form.get('productType');
  }

  get requestABOControl() {
    return this.form.get('requestABO');
  }

  get compatibleABOControl() {
    return this.form.get('compatibleABO');
  }

  get effectiveDateControl() {
    return this.form.get('effectiveDate');
  }

  get terminationDateControl() {
    return this.form.get('terminationDate');
  }

  getInventoryProductTypeError(): string {
    const control = this.productTypeControl;
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return 'Inventory Product Type is required';
    }
    return '';
  }

  getRequestedABOError(): string {
    const control = this.requestABOControl;
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return 'Requested ABO is required';
    }
    return '';
  }

  getCompatibleABOError(): string {
    const control = this.compatibleABOControl;
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return 'Compatible ABO is required';
    }
    return '';
  }

  updateDateErrors(): void {
    const effFormErrors = this.lastChangedDateField === 'effective' ? this.form.errors : null;
    this.effectiveDateError = DateFieldValidationUtility.getStartDateCrossFieldError(
      this.form.get('effectiveDate'), 'Effective Date', 'Termination Date', effFormErrors
    );

    if (this.mode === 'edit' && this.effectiveDateError && this.form.get('effectiveDate')?.hasError('effectiveDatePast')) {
      const effControl = this.form.get('effectiveDate');
      if (!this.hasDateChanged(effControl?.value, this.initialFormValues?.effectiveDate ?? null)) {
        this.effectiveDateError = '';
      }
    }

    if (this.lastChangedDateField === 'effective' && this.form.get('terminationDate')?.hasError('matDatepickerMin')) {
      this.terminationDateError = '';
    } else {
      const termFormErrors = this.lastChangedDateField === 'termination' ? this.form.errors : null;
      this.terminationDateError = DateFieldValidationUtility.getEndDateCrossFieldError(
        this.form.get('terminationDate'), 'Termination Date', 'Effective Date', termFormErrors
      );
    }
  }

  onEffectiveDateInput(event: Event): void {
    this.lastChangedDateField = 'effective';
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value, this.form.get('effectiveDate')
    );
  }

  onEffectiveDateChanged(): void {
    this.lastChangedDateField = 'effective';
    this.terminationPicker?.close();
  }

  onTerminationDateInput(event: Event): void {
    this.lastChangedDateField = 'termination';
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value, this.form.get('terminationDate'), this.mode === 'edit'
    );
  }

  onTerminationDateChanged(): void {
    this.lastChangedDateField = 'termination';
  }

  /**
   * Checks if form data has changed from initial values (edit mode only)
   * In add mode, always returns true
   */
  private hasFormChanged(): boolean {
    if (this.mode !== 'edit' || !this.initialFormValues) {
      return true;
    }

    const currentEffectiveDate = this.form.get('effectiveDate')?.value;
    const initialEffectiveDate = this.initialFormValues.effectiveDate;
    const currentTerminationDate = this.form.get('terminationDate')?.value;
    const initialTerminationDate = this.initialFormValues.terminationDate;

    const effectiveDateChanged = this.hasDateChanged(currentEffectiveDate, initialEffectiveDate);
    const terminationDateChanged = this.hasDateChanged(currentTerminationDate, initialTerminationDate);

    return effectiveDateChanged || terminationDateChanged;
  }

  private hasDateChanged(current: moment.Moment | null, initial: moment.Moment | null): boolean {
    if (current && initial) {
      return !current.isSame(initial, 'day');
    }
    return current !== initial;
  }

  get isFormValid(): boolean {
    if (this.mode === 'edit') {
      return this.isEditFormEffectivelyValid() && this.hasFormChanged();
    }
    return this.form.valid;
  }

  private isEditFormEffectivelyValid(): boolean {
    if (this.form.valid) return true;

    const effControl = this.form.get('effectiveDate');
    const hasBypassableError = effControl?.hasError('matDatepickerMin') || effControl?.hasError('effectiveDatePast');
    if (!hasBypassableError) return false;
    if (this.hasDateChanged(effControl!.value, this.initialFormValues?.effectiveDate ?? null)) return false;

    const bypassKeys = new Set(['matDatepickerMin', 'effectiveDatePast']);
    const hasOtherEffErrors = effControl!.errors && Object.keys(effControl!.errors).some(k => !bypassKeys.has(k));
    if (hasOtherEffErrors) return false;

    const termControl = this.form.get('terminationDate');
    if (termControl?.enabled && termControl?.invalid) return false;

    return !this.form.errors;
  }
}
