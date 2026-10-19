import { Component, EventEmitter, Input, OnInit, Output, OnChanges, SimpleChanges, OnDestroy, signal, computed } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { InventoryProductTypesService } from '../services/inventory-product-types.service';
import { InventoryProductTypeModel, ProductGroupingOption, InventoryProductTypeCreateDto, InventoryProductTypeUpdateDto } from '../models/inventory-product-types.model';
import { VALIDATION_INVENTORY_PRODUCT_TYPES } from 'src/app/core/constants/validation.constants';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { noWhitespaceOnlyValidator } from '@shared/validators/input.validators';
import { HeaderService } from '@shared/services/header.service';
import moment from 'moment';
import { Subject, takeUntil } from 'rxjs';

/**
 * Validator to ensure price has at most 2 decimal places
 */
function twoDecimalPlacesValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value && control.value !== 0) {
    return null; // Allow empty
  }

  const value = control.value.toString();

  // Check if it contains a decimal point
  if (value.includes('.')) {
    const parts = value.split('.');
    // Check if more than 2 decimal places
    if (parts[1] && parts[1].length > 2) {
      return { twoDecimalPlaces: true };
    }
  }

  return null;
}

/**
 * Form-level validator: Ensures LifeSpan and LifeSpanIndicator are both provided or both empty.
 * Sets field-level errors on child controls for proper Material error display.
 */
function lifeSpanValidator(control: AbstractControl): ValidationErrors | null {
  const lifeSpan = control.get('lifeSpan');
  const lifeSpanInd = control.get('lifeSpanInd');

  if (!lifeSpan || !lifeSpanInd) {
    return null;
  }

  const hasLifeSpan = lifeSpan.value !== null &&
                      lifeSpan.value !== '' &&
                      lifeSpan.value !== undefined;
  const hasLifeSpanInd = lifeSpanInd.value !== null &&
                         lifeSpanInd.value !== '' &&
                         lifeSpanInd.value !== undefined;

  // Both filled or both empty - clear interdependent errors
  if ((hasLifeSpan && hasLifeSpanInd) || (!hasLifeSpan && !hasLifeSpanInd)) {
    if (lifeSpan.hasError('interdependent')) {
      const errors = { ...lifeSpan.errors };
      delete errors['interdependent'];
      lifeSpan.setErrors(Object.keys(errors).length > 0 ? errors : null);
    }
    if (lifeSpanInd.hasError('interdependent')) {
      const errors = { ...lifeSpanInd.errors };
      delete errors['interdependent'];
      lifeSpanInd.setErrors(Object.keys(errors).length > 0 ? errors : null);
    }
  }
  // Life span has value but unit is empty
  else if (hasLifeSpan && !hasLifeSpanInd) {
    if (!lifeSpanInd.hasError('interdependent')) {
      lifeSpanInd.setErrors({ ...lifeSpanInd.errors, interdependent: true });
    }
    // Always mark as touched when there's an interdependent error
    lifeSpanInd.markAsTouched();

    // Clear error from life span field
    if (lifeSpan.hasError('interdependent')) {
      const errors = { ...lifeSpan.errors };
      delete errors['interdependent'];
      lifeSpan.setErrors(Object.keys(errors).length > 0 ? errors : null);
    }
  }
  // Unit has value but life span is empty
  else if (!hasLifeSpan && hasLifeSpanInd) {
    if (!lifeSpan.hasError('interdependent')) {
      lifeSpan.setErrors({ ...lifeSpan.errors, interdependent: true });
    }
    // Always mark as touched when there's an interdependent error
    lifeSpan.markAsTouched();

    // Clear error from unit field
    if (lifeSpanInd.hasError('interdependent')) {
      const errors = { ...lifeSpanInd.errors };
      delete errors['interdependent'];
      lifeSpanInd.setErrors(Object.keys(errors).length > 0 ? errors : null);
    }
  }

  return null;
}

@Component({
  selector: 'app-add-edit-inventory-product-type',
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
    MatSlideToggleModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    NgxMatSelectSearchModule
  ],
  templateUrl: './add-edit-inventory-product-type.html',
  styleUrls: ['./add-edit-inventory-product-type.scss'],
})
export class AddEditInventoryProductType implements OnInit, OnChanges, OnDestroy {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() data: InventoryProductTypeModel | null = null;
  @Output() closePanel = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<void>();

  form!: FormGroup;
  title!: string;
  minDate = DateFieldValidationUtility.getMinDate();
  terminationMinDate: moment.Moment | null = null;
  private lastChangedDateField: 'effective' | 'termination' | null = null;
  private destroy$ = new Subject<void>();
  private originalEffectiveDate: string | null = null;
  private originalTerminationDate: string | null = null;

  readonly VALIDATION = VALIDATION_INVENTORY_PRODUCT_TYPES.INVENTORY_PRODUCT_TYPES_TABLE;

  lifeSpanIndOptions: string[] = [];
  booleanOptions: string[] = ['Yes', 'No'];

  // Searchable Type dropdown (add mode)
  productTypeSearchCtrl = new FormControl('');
  readonly productTypeSearch = signal('');
  readonly productTypeOptionsSignal = signal<string[]>([]);
  readonly filteredProductTypeOptions = computed(() => {
    const search = this.productTypeSearch().toLowerCase();
    const options = this.productTypeOptionsSignal();
    if (!search || search.length < 2) return options;
    return options.filter(opt => opt.toLowerCase().includes(search));
  });

  // Searchable Grouping dropdown
  groupingSearchCtrl = new FormControl('');
  readonly groupingSearch = signal('');
  readonly groupingOptionsSignal = signal<ProductGroupingOption[]>([]);
  readonly filteredGroupingOptions = computed(() => {
    const search = this.groupingSearch().toLowerCase();
    const options = this.groupingOptionsSignal();
    if (!search) return options;
    return options.filter(opt =>
      opt.code.toLowerCase().includes(search) ||
      opt.description.toLowerCase().includes(search)
    );
  });
  isPriceFocused = false;

  isLoadingProductTypes = false;
  isLoadingDropdowns = false;
  readonly selectPanelLoadingValue = '__FILTER_PANEL_LOADING__';
  readonly selectPanelEmptyValue = '__FILTER_PANEL_EMPTY__';

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEffectiveDateError());
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTerminationDateError());

  constructor(
    private snackBar: MatSnackBar,
    private fb: FormBuilder,
    private inventoryProductTypesService: InventoryProductTypesService,
    private headerService: HeaderService
  ) {
  }

  ngOnInit(): void {
    this.title = this.mode === 'add' ? 'Add New Record' : 'Edit Record';

    const record = this.data;

    this.initForm(record);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSubscriptions(): void {
    // Track which date field was last changed for cross-field error display
    this.form?.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        this.lastChangedDateField = 'effective';
        this.updateTerminationMinDate(value);
      });

    this.form?.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => { this.lastChangedDateField = 'termination'; });

    this.productTypeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.productTypeSearch.set(value || ''));

    this.groupingSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.groupingSearch.set(value || ''));

    // Setup interdependent validation for Life Span fields
    this.form?.get('lifeSpan')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Trigger form-level validation to update interdependent errors
        this.form.updateValueAndValidity({ emitEvent: false });
      });

    this.form?.get('lifeSpanInd')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Trigger form-level validation to update interdependent errors
        this.form.updateValueAndValidity({ emitEvent: false });
      });
  }


  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mode'] || changes['data']) {
      if (!changes['mode']?.firstChange && !changes['data']?.firstChange) {
        this.title = this.mode === 'add' ? 'Add New Record' : 'Edit Record';
        const record = this.data;
        this.initForm(record);
      }
    }
  }

  private initForm(record: any): void {

    const aboOnlyValue = record?.aboOnly === true ? 'Yes' : record?.aboOnly === false ? 'No' : '';
    const rhRequiredValue = record?.rhRequired === true ? 'Yes' : record?.rhRequired === false ? 'No' : '';
    const importAllowedValue = record?.importAllowed === true ? 'Yes' : record?.importAllowed === false ? 'No' : '';

    // Initialize form first with empty values
    this.form = this.fb.group({
      productType: [
        '',
        [
          Validators.required,
          Validators.minLength(this.VALIDATION.LIMITS.PRODUCT_TYPE_MIN_LENGTH),
          Validators.maxLength(this.VALIDATION.LIMITS.PRODUCT_TYPE_MAX_LENGTH),
          Validators.pattern(/^[A-Za-z0-9]+$/)
        ]
      ],
      shortName: [
        '',
        [
          Validators.required,
          Validators.maxLength(this.VALIDATION.LIMITS.SHORT_NAME_MAX_LENGTH)
        ]
      ],
      description: [
        '',
        [
          Validators.required,
          Validators.maxLength(this.VALIDATION.LIMITS.DESCRIPTION_MAX_LENGTH),
          noWhitespaceOnlyValidator()
        ]
      ],
      price: [
        null,
        [
          Validators.min(this.VALIDATION.LIMITS.PRICE_MIN),
          Validators.max(this.VALIDATION.LIMITS.PRICE_MAX),
          twoDecimalPlacesValidator
        ]
      ],
      lifeSpan: [
        null,
        [
          Validators.min(this.VALIDATION.LIMITS.LIFE_SPAN_MIN),
          Validators.max(this.VALIDATION.LIMITS.LIFE_SPAN_MAX),
          Validators.pattern(/^[0-9]+$/)
        ]
      ],
      lifeSpanInd: [''], // Not required - validated by lifeSpanValidator
      sortSequence: [
        null,
        [
          Validators.min(this.VALIDATION.LIMITS.SORT_SEQUENCE_MIN),
          Validators.max(this.VALIDATION.LIMITS.SORT_SEQUENCE_MAX),
          Validators.pattern(/^[0-9]+$/)
        ]
      ],
      productGrouping: [
        '',
        [
          Validators.required,
          Validators.maxLength(this.VALIDATION.LIMITS.PRODUCT_GROUPING_MAX_LENGTH)
        ]
      ],
      aboOnly: [''],
      rhRequired: [''],
      importAllowed: [''],
      pooledProduct: [false],
      specialInventory: [false],
      effectiveDate: [null, [Validators.required]],
      terminationDate: [null]
    }, {
      validators: [
        lifeSpanValidator,
        DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate')
      ]
    });

    // Setup subscriptions for date field tracking
    this.setupSubscriptions();

    // Setup date validators based on mode
    if (this.mode === 'add') {
      DateFieldValidationUtility.setupAddModeValidators(
        this.form,
        this.headerService.chapterTimeZone()
      );
      this.lastChangedDateField = null;
    }

    // Load dropdowns first, then populate form with data
    this.loadDropdowns(record, aboOnlyValue, rhRequiredValue, importAllowedValue);
  }

  onCancel(): void {
    this.closePanel.emit();
  }

  onSave(): void {
    this.form.markAllAsTouched();

    // Clear optional date errors before validation
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'terminationDate');

    if (this.form.invalid) {
      this.snackBar.open(
        'Please correct the highlighted errors before saving.',
        'DISMISS',
        { duration: 5000 }
      );
      return;
    }

    const raw = this.form.getRawValue();

    const productGroupingCode = raw.productGrouping || '';

    const payload: InventoryProductTypeCreateDto = {
      productType: raw.productType?.trim(),
      shortName: raw.shortName?.trim(),
      description: raw.description?.trim(),
      standardPrice: (raw.price !== null && raw.price !== '' && raw.price !== undefined) ? Number(raw.price) : undefined, // Backend expects 'StandardPrice'
      lifeSpan: (raw.lifeSpan !== null && raw.lifeSpan !== '' && raw.lifeSpan !== undefined) ? Number(raw.lifeSpan) : undefined,
      lifeSpanIndicator: (raw.lifeSpanInd && raw.lifeSpanInd !== '') ? raw.lifeSpanInd : undefined,
      sortSequence: (raw.sortSequence !== null && raw.sortSequence !== '' && raw.sortSequence !== undefined) ? Number(raw.sortSequence) : undefined,
      productGrouping: productGroupingCode,
      aboOnly: raw.aboOnly === 'Yes' ? true : raw.aboOnly === 'No' ? false : false, // Required boolean, defaults to false
      poolProduct: raw.pooledProduct === true, // Backend expects 'PoolProduct'
      specialProductType: raw.specialInventory === true, // Backend expects 'SpecialProductType'
      shipAnyRh: raw.rhRequired === 'Yes' ? true : raw.rhRequired === 'No' ? false : false, // Required boolean, defaults to false
      aboFlag: raw.importAllowed === 'Yes' ? true : raw.importAllowed === 'No' ? false : false, // Required boolean, defaults to false
      maximumTemp: raw.tempMax !== null && raw.tempMax !== undefined ? Number(raw.tempMax) : undefined, // Backend expects 'MaximumTemp'
      minimumTemp: raw.tempMin !== null && raw.tempMin !== undefined ? Number(raw.tempMin) : undefined, // Backend expects 'MinimumTemp'
      effectiveDate: raw.effectiveDate ? this.formatDate(raw.effectiveDate) : '',
      terminationDate: raw.terminationDate ? this.formatDate(raw.terminationDate) : undefined
    };

    if (this.mode === 'add') {
      this.inventoryProductTypesService.createInventoryProductType(payload).subscribe({
        next: () => {
          this.saveSuccess.emit();
          this.closePanel.emit();
          setTimeout(() => {
            this.snackBar.open(
              `New product ${raw.shortName} has been successfully added.`,
              'DISMISS',
              {
                duration: 5000,
                horizontalPosition: 'right',
                verticalPosition: 'top',
                panelClass: ['success-snackbar']
              }
            );
          }, 100);
        },
        error: () => {
        }
      });
    }

    if (this.mode === 'edit') {
      this.inventoryProductTypesService.updateInventoryProductType(raw.productType, payload).subscribe({
        next: () => {
          this.saveSuccess.emit();
          this.closePanel.emit();
          setTimeout(() => {
            this.snackBar.open(
              `Product ${raw.shortName} has been successfully updated.`,
              'DISMISS',
              {
                duration: 5000,
                horizontalPosition: 'right',
                verticalPosition: 'top',
                panelClass: ['success-snackbar']
              }
            );
          }, 100);
        },
        error: () => {
        }
      });
    }
  }

  loadDropdowns(
    record?: any,
    aboOnlyValue?: string,
    rhRequiredValue?: string,
    importAllowedValue?: string
  ): void {
    // Load available product types for Add mode
    if (this.mode === 'add') {
      this.isLoadingProductTypes = true;
      this.productTypeOptionsSignal.set([]);
      this.inventoryProductTypesService.getAvailableProductTypes().subscribe({
        next: (res) => {
          let options: string[] = [];
          if (Array.isArray(res)) {
            options = res.map((item: any) => item.Code || item.code || item);
          } else if (res.Item || res.Data) {
            const data = res.Item || res.Data?.[0] || res.Data;
            if (Array.isArray(data)) {
              options = data.map((item: any) => item.Code || item.code || item);
            }
          }
          this.productTypeOptionsSignal.set(options);
          this.isLoadingProductTypes = false;
        },
        error: () => {
          this.productTypeOptionsSignal.set([]);
          this.isLoadingProductTypes = false;
        }
      });
    }

    this.isLoadingDropdowns = true;
    this.groupingOptionsSignal.set([]);
    this.inventoryProductTypesService.getAvailableDropdowns().subscribe({
      next: (res) => {
        // Extract data from ReturnResult structure
        const data = res.Item || res.Data?.[0] || res.Data || (res as any);

        // Extract ProductGrouping and LifeSpanIndicator arrays
        const raw: { code?: string; description?: string; Code?: string; Description?: string }[] =
          (data as any)?.ProductGrouping || (data as any)?.productGrouping || [];
        const groupings: ProductGroupingOption[] = raw
          .filter(g => g.code || g.Code)
          .map(g => ({ code: g.code ?? g.Code ?? '', description: g.description ?? g.Description ?? '' }));
        this.groupingOptionsSignal.set(groupings);
        this.lifeSpanIndOptions = (data as any)?.LifeSpanIndicator || (data as any)?.lifeSpanIndicator || [];
        this.isLoadingDropdowns = false;

        // After dropdowns are loaded, populate form with record data
        // Only patch if we have actual record data (not null/undefined)
        if (record && Object.keys(record).length > 0) {
          const effectiveDateValue = record.effectiveDate ? this.parseApiDate(record.effectiveDate) : null;
          const terminationDateValue = record.terminationDate ? this.parseApiDate(record.terminationDate) : null;
          const productGroupingValue = record.productGrouping || '';

          if (this.mode === 'edit') {
            if (effectiveDateValue) {
              this.originalEffectiveDate = effectiveDateValue.format('YYYY-MM-DD');
            }
            if (terminationDateValue) {
              this.originalTerminationDate = terminationDateValue.format('YYYY-MM-DD');
            }
          }

          this.form.patchValue({
            productType: record.productType || '',
            shortName: record.shortName || '',
            description: record.description || '',
            price: record.price ?? null,                    // ✅ Allows 0
            lifeSpan: record.lifeSpan ?? null,              // ✅ Allows 0
            lifeSpanInd: record.lifeSpanInd || '',
            sortSequence: record.sortSequence ?? null,      // ✅ Allows 0
            productGrouping: productGroupingValue,
            aboOnly: aboOnlyValue || '',
            rhRequired: rhRequiredValue || '',
            importAllowed: importAllowedValue || '',
            pooledProduct: record.pooledProduct === true,
            specialInventory: record.specialInventory === true,
            effectiveDate: effectiveDateValue,
            terminationDate: terminationDateValue
          });

          this.updateTerminationMinDate(effectiveDateValue);

          if (this.mode === 'edit') {
            // Effective date: keep enabled, required + block past dates unless unchanged (IM 9348)
            const effectiveDateControl = this.form.get('effectiveDate');
            if (effectiveDateControl) {
              effectiveDateControl.enable();
              const chapterTz = this.headerService.chapterTimeZone();
              effectiveDateControl.setValidators([
                Validators.required,
                (control: AbstractControl): ValidationErrors | null => {
                  if (!control.value) return null;
                  const selected = moment.isMoment(control.value) ? control.value : moment(control.value);
                  if (!selected.isValid()) return null;
                  if (this.originalEffectiveDate && selected.format('YYYY-MM-DD') === this.originalEffectiveDate) {
                    return null;
                  }
                  const today = DateFieldValidationUtility.getMinDate(chapterTz);
                  if (selected.format('YYYY-MM-DD') < today.format('YYYY-MM-DD')) {
                    return { pastDate: true };
                  }
                  return null;
                }
              ]);
              effectiveDateControl.updateValueAndValidity({ emitEvent: false });
            }

            // Termination date: clear add-mode validators, apply edit-mode validator
            const terminationDateControl = this.form.get('terminationDate');
            if (terminationDateControl) {
              terminationDateControl.setValidators([
                DateFieldValidationUtility.editModeTerminationDateValidator(
                  this.originalTerminationDate,
                  this.headerService.chapterTimeZone()
                )
              ]);
              terminationDateControl.updateValueAndValidity({ emitEvent: false });
            }

            this.lastChangedDateField = null;
            this.form.markAsPristine();
          }
        }
      },
      error: () => {
        this.isLoadingDropdowns = false;
      }
    });
  }

  private parseApiDate(dateString: string): moment.Moment | null {
    if (!dateString) return null;

    // Try parsing with specific format first (DD-MMM-YYYY from grid)
    let parsed = moment(dateString, 'DD-MMM-YYYY', true);
    if (parsed.isValid()) return parsed;

    // Fallback to automatic parsing (for ISO dates from API)
    parsed = moment(dateString);
    return parsed.isValid() ? parsed : null;
  }

  formatDateForDisplay(date: any): string {
    if (!date) return '-';

    // Handle moment objects
    if (moment.isMoment(date)) {
      return date.format('DD-MMM-YYYY').toUpperCase();
    }

    // Handle Date objects
    if (date instanceof Date) {
      const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const day = String(date.getDate()).padStart(2, '0');
      const month = monthNames[date.getMonth()];
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    }

    return '-';
  }

  private formatDate(date: any): string {
    if (!date) return '';

    // Handle moment objects
    if (moment.isMoment(date)) {
      return date.format('YYYY-MM-DD');
    }

    // Handle native Date objects
    if (date instanceof Date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    // Fallback to DateFieldValidationUtility
    return DateFieldValidationUtility.serializeDateForApi(date) || '';
  }

  getEffectiveDateError(): string {
    const control = this.form.get('effectiveDate');
    if (control?.hasError('pastDate')) {
      return 'Effective Date cannot be in the past';
    }
    const formErrors = this.lastChangedDateField === 'effective' ? this.form.errors : null;
    return DateFieldValidationUtility.getStartDateCrossFieldError(
      control,
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

  /**
   * Get error message for life span field
   */
  getLifeSpanError(): string {
    const control = this.form?.get('lifeSpan');

    if (!control) return '';

    // Check for interdependent validation error (when unit has value but lifespan is empty)
    if (control.hasError('interdependent') && control.touched) {
      return 'Life span is required';
    }

    // Only show other field-level errors if control is touched
    if (control.touched) {
      if (control.hasError('min')) {
        return 'Life Span must be at least 0';
      }

      if (control.hasError('max')) {
        return 'Life Span must be between 0 and 99999';
      }

      if (control.hasError('pattern')) {
        return 'Life Span must be a whole number';
      }
    }

    return '';
  }

  /**
   * Get error message for life span indicator field
   */
  getLifeSpanIndError(): string {
    const control = this.form?.get('lifeSpanInd');

    if (!control) return '';

    // Check for interdependent validation error (when lifespan has value but unit is empty)
    if (control.hasError('interdependent') && control.touched) {
      return 'Lifespan Unit is required';
    }

    return '';
  }

  private updateTerminationMinDate(effectiveDate: any): void {
    if (effectiveDate && moment.isMoment(effectiveDate) && effectiveDate.isValid()) {
      this.terminationMinDate = effectiveDate.clone();
    } else if (effectiveDate) {
      const parsed = moment(effectiveDate);
      this.terminationMinDate = parsed.isValid() ? parsed : null;
    } else {
      this.terminationMinDate = null;
    }
  }

  onEffectiveDateInput(event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value,
      this.form.get('effectiveDate')
    );
  }

  onTerminationDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value,
      this.form.get('terminationDate'),
      this.mode === 'edit'
    );
  }


  /**
   * Prevent invalid numeric input characters (only allow digits 0-9)
   * @param event Keyboard event
   * @param maxDigits Maximum number of digits allowed
   */
  preventInvalidNumericInput(event: KeyboardEvent, maxDigits: number = 10): void {
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (allowedKeys.includes(event.key)) return;

    const invalidChars = ['e', 'E', '+', '-', '.'];
    if (invalidChars.includes(event.key)) {
      event.preventDefault();
      return;
    }

    const isDigit = event.key >= '0' && event.key <= '9';
    if (!isDigit) {
      event.preventDefault();
      return;
    }

    const input = event.target as HTMLInputElement;
    if (input.value.length >= maxDigits && input.selectionStart === input.selectionEnd) {
      event.preventDefault();
    }
  }

  /**
   * Prevent non-numeric paste
   * @param event Clipboard event
   */
  preventNonNumericPaste(event: ClipboardEvent): void {
    const pastedText = event.clipboardData?.getData('text') || '';
    if (!/^\d+$/.test(pastedText)) {
      event.preventDefault();
    }
  }

  /**
   * Prevent invalid alphanumeric input (only letters and numbers allowed)
   * @param event Keyboard event
   * @param maxLength Maximum length allowed
   */
  preventInvalidAlphanumericInput(event: KeyboardEvent, maxLength: number): void {
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (allowedKeys.includes(event.key)) return;

    const input = event.target as HTMLInputElement;
    const key = event.key;

    // Allow only letters (A-Z, a-z) and numbers (0-9)
    if (!/^[A-Za-z0-9]$/.test(key)) {
      event.preventDefault();
      return;
    }

    // Check max length
    if (input.value.length >= maxLength && input.selectionStart === input.selectionEnd) {
      event.preventDefault();
    }
  }

  /**
   * Prevent non-alphanumeric paste
   * @param event Clipboard event
   */
  preventNonAlphanumericPaste(event: ClipboardEvent): void {
    const pastedText = event.clipboardData?.getData('text') || '';
    if (!/^[A-Za-z0-9]+$/.test(pastedText)) {
      event.preventDefault();
    }
  }

  /**
   * Prevent leading whitespace in text input fields
   * @param event Keyboard event
   * @param controlName Form control name
   */
  preventLeadingSpace(event: KeyboardEvent, controlName: string): void {
    if (event.key === ' ' && !this.form.get(controlName)?.value?.trim()) {
      event.preventDefault();
    }
  }

  /**
   * Prevent invalid price input characters (allow digits, one decimal point, minus sign at start, and at most 2 decimal places)
   * @param event Keyboard event
   */
  preventInvalidPriceInput(event: KeyboardEvent): void {
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (allowedKeys.includes(event.key)) return;

    const input = event.target as HTMLInputElement;
    const currentValue = input.value;
    const key = event.key;
    const selectionStart = input.selectionStart || 0;

    // Allow minus sign only at the beginning
    if (key === '-') {
      if (selectionStart === 0 && !currentValue.includes('-')) {
        return; // Allow minus at start
      } else {
        event.preventDefault(); // Prevent minus elsewhere
        return;
      }
    }

    // Allow only digits and decimal point
    if (!/^[0-9.]$/.test(key)) {
      event.preventDefault();
      return;
    }

    // Prevent multiple decimal points
    if (key === '.' && currentValue.includes('.')) {
      event.preventDefault();
      return;
    }

    // If there's already a decimal point, check decimal places
    if (currentValue.includes('.')) {
      const parts = currentValue.split('.');
      const selectionEnd = input.selectionEnd || 0;

      // If cursor is after decimal and there are already 2 decimal places
      if (selectionStart > currentValue.indexOf('.') && parts[1].length >= 2 && selectionStart === selectionEnd) {
        event.preventDefault();
        return;
      }
    }
  }

  /**
   * Prevent invalid paste for price
   * @param event Clipboard event
   */
  preventInvalidPricePaste(event: ClipboardEvent): void {
    const pastedText = event.clipboardData?.getData('text') || '';

    // Check if pasted text is a valid number with at most 2 decimal places
    // Now allows negative numbers: -123.45
    if (!/^-?\d+(\.\d{0,2})?$/.test(pastedText)) {
      event.preventDefault();
    }
  }

}
