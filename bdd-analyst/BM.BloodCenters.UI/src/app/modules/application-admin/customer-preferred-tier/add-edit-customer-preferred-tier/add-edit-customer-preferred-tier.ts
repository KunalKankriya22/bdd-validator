import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
  signal,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { CustomerPreferredTierService } from '../services/customer-preferred-tier.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import moment from 'moment';
import { Subject, takeUntil, finalize, startWith, debounceTime, distinctUntilChanged } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  CustomerPreferredTierModel,
  CreateCustomerPreferredTierRequestDto,
  UpdateCustomerPreferredTierRequestDto,
  ProductTypeDropdownDto,
  PricingTierDropdownDto
} from '../models/customer-preferred-tier.model';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';

export interface CustomerPreferredTierFormData {
  customerId: string;
  productType: string;
  tier: number;
  effectiveDate: Date;
  terminationDate?: Date | null;
}

@Component({
  selector: 'app-add-edit-customer-preferred-tier',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatIconModule,
    ReactiveFormsModule,
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './add-edit-customer-preferred-tier.html',
  styleUrls: ['./add-edit-customer-preferred-tier.scss']
})
export class AddEditCustomerPreferredTierComponent implements OnInit, OnChanges, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `customer-preferred-tier-${AddEditCustomerPreferredTierComponent.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  @Input() mode: 'add' | 'edit' = 'add';
  @Input() data: CustomerPreferredTierModel | null = null;
  @Input() customerId = '';
  @Input() customerName = '';
  @Output() closePanel = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<CustomerPreferredTierFormData>();

  @ViewChild('effDateInput') effDateInput?: ElementRef<HTMLInputElement>;
  @ViewChild('termDateInput') termDateInput?: ElementRef<HTMLInputElement>;

  form: FormGroup;
  panelTitle = '';
  lastUpdated = '';

  editModeValues = {
    productType: '',
    tier: '',
    effectiveDate: '',
    terminationDate: ''
  };

  // Pricing info display (read-only)
  selectedTierInfo: { fromDay: number | null; toDay: number | null; unitPrice: number | null } = {
    fromDay: null, toDay: null, unitPrice: null
  };

  // Dropdown options
  productTypeOptions: ProductTypeDropdownDto[] = [];
  pricingTierOptions: PricingTierDropdownDto[] = [];

  // Search controls
  productTypeSearchCtrl = new FormControl('');
  productTypeOptionsSignal = signal<ProductTypeDropdownDto[]>([]);
  private productTypeSearchSignal = toSignal(this.productTypeSearchCtrl.valueChanges.pipe(startWith('')), { initialValue: '' });

  filteredProductTypeOptions = computed(() => {
    const searchTerm = this.productTypeSearchSignal()?.toLowerCase() || '';
    const options = this.productTypeOptionsSignal();
    if (!searchTerm) return options;
    return options.filter(o =>
      (o.productType || '').toLowerCase().includes(searchTerm) ||
      (o.productTypeDesc || '').toLowerCase().includes(searchTerm)
    );
  });

  isLoadingOptions = false;
  isLoadingTiers = false;
  isSaving = false;
  savingAction: 'add' | 'addAnother' | 'save' | null = null;

  minDate!: moment.Moment;
  minEffectiveDate: moment.Moment | null = null;
  minTerminationDate: moment.Moment | null = null;

  effectiveDateFilterFn!: (date: moment.Moment | null) => boolean;
  terminationDateFilterFn!: (date: moment.Moment | null) => boolean;

  private lastChangedDateField: 'effective' | 'termination' | null = null;

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEffectiveDateError());
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTerminationDateError());

  private readonly ISO_DATE_TIME_NOON = 'T12:00:00.000Z';

  private originalValues = { customerId: '', productType: '', effectiveDate: null as Date | null };
  private originalEditableValues = { tier: null as number | null, terminationDate: null as string | null };

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private service: CustomerPreferredTierService,
    private snackbarService: SnackbarService,
    private cdr: ChangeDetectorRef,
    private headerService: HeaderService
  ) {
    this.form = this.fb.group({
      productType: ['', [Validators.required, Validators.maxLength(15)]],
      tier: [null, [Validators.required]],
      effectiveDate: [null, [Validators.required]],
      terminationDate: [null]
    }, { validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate')] });
  }

  ngOnInit(): void {
    this.setupDateValidation();
    this.setupPanel();
    this.loadDropdownOptions();
    this.setupDateValueChangeListeners();
    this.setupProductTypeListener();
    this.setupTierChangeListener();

    if (this.mode === 'add') {
      DateFieldValidationUtility.setupAddModeValidators(this.form, this.headerService.chapterTimeZone());
    } else {
      DateFieldValidationUtility.setupEditModeValidators(this.form);
    }
  }

  private setupDateValidation(): void {
    const chapterTimezone = this.headerService.chapterTimeZone();
    if (!chapterTimezone) return;

    this.minDate = DateFieldValidationUtility.getMinDate(chapterTimezone);
    this.minEffectiveDate = DateFieldValidationUtility.getMinDate(chapterTimezone);
    this.effectiveDateFilterFn = DateFieldValidationUtility.createEffectiveDateFilter(chapterTimezone);

    this.terminationDateFilterFn = (date: moment.Moment | null): boolean => {
      if (!date) return true;
      const chapterToday = DateFieldValidationUtility.getMinDate(chapterTimezone);
      const checkDate = moment.isMoment(date) ? date : moment(date);
      if (checkDate.format('YYYY-MM-DD') < chapterToday.format('YYYY-MM-DD')) return false;
      const effectiveDate = this.form?.get('effectiveDate')?.value;
      if (effectiveDate && moment.isMoment(effectiveDate)) {
        if (checkDate.isBefore(moment(effectiveDate).startOf('day'), 'day')) return false;
      }
      return true;
    };
  }

  private setupDateValueChangeListeners(): void {
    this.form.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'effective';
        this.form.get('terminationDate')?.updateValueAndValidity({ emitEvent: false });
      });

    this.form.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => { this.lastChangedDateField = 'termination'; });
  }

  private setupProductTypeListener(): void {
    this.form.get('productType')?.valueChanges
      .pipe(takeUntil(this.destroy$), debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        this.form.get('tier')?.setValue(null);
        this.selectedTierInfo = { fromDay: null, toDay: null, unitPrice: null };
        this.loadPricingTiers();
      });
  }

  private setupTierChangeListener(): void {
    this.form.get('tier')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((tierValue: number | null) => {
        if (tierValue != null) {
          const tierInfo = this.pricingTierOptions.find(t => t.tier === tierValue);
          this.selectedTierInfo = tierInfo
            ? { fromDay: tierInfo.fromDay, toDay: tierInfo.toDay, unitPrice: tierInfo.unitPrice }
            : { fromDay: null, toDay: null, unitPrice: null };
        } else {
          this.selectedTierInfo = { fromDay: null, toDay: null, unitPrice: null };
        }
      });
  }

  private loadDropdownOptions(): void {
    this.isLoadingOptions = true;
    this.service.getProductTypesDropdown()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (productTypes) => {
          this.productTypeOptions = productTypes;
          this.productTypeOptionsSignal.set(productTypes);
          this.isLoadingOptions = false;
        },
        error: () => { this.isLoadingOptions = false; }
      });
  }

  private loadPricingTiers(): void {
    const productType = this.form.get('productType')?.value;
    if (!productType) {
      this.pricingTierOptions = [];
      return;
    }

    this.isLoadingTiers = true;
    this.service.getPricingTiersDropdown(productType, this.customerId)
      .pipe(takeUntil(this.destroy$), finalize(() => {
        this.isLoadingTiers = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (tiers) => {
          this.pricingTierOptions = tiers;
          if (this.mode === 'edit' && this.data?.tier) {
            const tierExists = tiers.some(t => t.tier === this.data!.tier);
            if (tierExists) {
              this.form.get('tier')?.setValue(this.data.tier, { emitEvent: true });
            }
          }
        },
        error: () => { this.pricingTierOptions = []; }
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mode'] || changes['data']) {
      if (!changes['mode']?.firstChange && !changes['data']?.firstChange) {
        this.setupPanel();
        if (this.mode === 'add') this.resetFormForAddMode();
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupPanel(): void {
    if (this.mode === 'add') {
      this.panelTitle = 'Add Product';
      this.lastUpdated = '';
    } else {
      this.panelTitle = 'Edit Product Details';
      this.lastUpdated = this.data?.lastModifiedDate
        ? `Last Modified: ${this.formatDateTime(new Date(this.data.lastModifiedDate))}`
        : '';
      this.populateFormForEdit();
    }
  }

  private resetFormForAddMode(): void {
    this.editModeValues = { productType: '', tier: '', effectiveDate: '', terminationDate: '' };
    this.selectedTierInfo = { fromDay: null, toDay: null, unitPrice: null };

    this.form.reset();
    this.form.markAsUntouched();
    this.form.markAsPristine();

    this.form.get('productType')?.enable();
    this.form.get('tier')?.enable();
    this.form.get('effectiveDate')?.enable();

    this.form.get('productType')?.setValidators([Validators.required, Validators.maxLength(15)]);
    this.form.get('tier')?.setValidators([Validators.required]);

    DateFieldValidationUtility.setupAddModeValidators(this.form, this.headerService.chapterTimeZone());

    this.form.get('productType')?.updateValueAndValidity();
    this.form.get('tier')?.updateValueAndValidity();
  }

  private populateFormForEdit(): void {
    if (!this.data) return;

    const productType = this.data.productType || '';
    const effectiveDate = this.data.effDate;

    this.originalValues = {
      customerId: this.data.customerId || this.customerId,
      productType,
      effectiveDate: effectiveDate ?? null
    };

    this.editModeValues = {
      productType: this.data.productTypeDesc ? `${productType} - ${this.data.productTypeDesc}` : productType,
      tier: this.data.tier != null ? this.data.tier.toString() : '',
      effectiveDate: effectiveDate ? this.formatDateForDisplay(effectiveDate) : '',
      terminationDate: this.data.termDate ? this.formatDateForDisplay(this.data.termDate) : ''
    };

    this.selectedTierInfo = {
      fromDay: this.data.fromDay ?? null,
      toDay: this.data.toDay ?? null,
      unitPrice: this.data.unitPrice ?? null
    };

    this.form.get('productType')?.disable();
    this.form.get('tier')?.setValidators([Validators.required]);

    const chapterTimezone = this.headerService.chapterTimeZone();
    DateFieldValidationUtility.setupEditModeValidators(this.form, chapterTimezone);

    this.form.get('productType')?.updateValueAndValidity();
    this.form.get('tier')?.updateValueAndValidity();

    this.form.patchValue({
      productType,
      tier: this.data.tier,
      effectiveDate: effectiveDate ? moment(effectiveDate) : null,
      terminationDate: this.data.termDate ? moment(this.data.termDate) : null
    }, { emitEvent: false });

    this.originalEditableValues = {
      tier: this.data.tier ?? null,
      terminationDate: this.data.termDate ? moment(this.data.termDate).format('YYYY-MM-DD') : null
    };

    const chapterToday = DateFieldValidationUtility.getMinDate(chapterTimezone);
    if (effectiveDate) {
      const effDay = moment(effectiveDate).startOf('day');
      this.minTerminationDate = effDay.isAfter(chapterToday) ? effDay : chapterToday;
    } else {
      this.minTerminationDate = chapterToday;
    }

    this.loadPricingTiers();
    this.form.markAsPristine();
    this.form.markAsUntouched();
    this.cdr.markForCheck();
  }

  private formatDateForDisplay(date: Date | null | undefined): string {
    if (!date) return '';
    const m = moment(date);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : '';
  }

  private toNativeDate(value: any): Date | null {
    if (!value) return null;
    if (moment.isMoment(value)) return value.toDate();
    if (value instanceof Date) return value;
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  private toISOStringWithoutTimezone(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}${this.ISO_DATE_TIME_NOON}`;
  }

  onCancel(): void {
    this.closePanel.emit();
  }

  onClearAll(): void {
    this.form.get('terminationDate')?.setValue(null);
    this.form.get('terminationDate')?.markAsUntouched();
  }

  onSave(keepPanelOpen = false): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const formValue = this.form.getRawValue();
    this.isSaving = true;
    this.savingAction = keepPanelOpen ? 'addAnother' : (this.mode === 'add' ? 'add' : 'save');

    let apiCall;

    if (this.mode === 'add') {
      const effectiveDate = this.toNativeDate(formValue.effectiveDate);
      const terminationDate = this.toNativeDate(formValue.terminationDate);
      const addPayload: CreateCustomerPreferredTierRequestDto = {
        productType: formValue.productType || '',
        tier: formValue.tier || 0,
        effDate: effectiveDate ? this.toISOStringWithoutTimezone(effectiveDate) : '',
        termDate: terminationDate ? this.toISOStringWithoutTimezone(terminationDate) : null
      };
      apiCall = this.service.create(this.customerId, addPayload);
    } else {
      const effectiveDate = this.toNativeDate(formValue.effectiveDate);
      const terminationDate = this.toNativeDate(formValue.terminationDate);
      const updatePayload: UpdateCustomerPreferredTierRequestDto = {
        tier: formValue.tier || 0,
        effDate: effectiveDate ? this.toISOStringWithoutTimezone(effectiveDate) : '',
        termDate: terminationDate ? this.toISOStringWithoutTimezone(terminationDate) : null
      };
      apiCall = this.service.update(this.originalValues.customerId, this.originalValues.productType, updatePayload);
    }

    apiCall
      .pipe(takeUntil(this.destroy$), finalize(() => { this.isSaving = false; this.savingAction = null; }))
      .subscribe({
        next: (response: any) => {
          const message = response?.message || (this.mode === 'add'
            ? 'New record has been added successfully'
            : 'Record has been updated successfully');
          this.snackbarService.showSuccess(message);
          this.saveSuccess.emit();

          if (keepPanelOpen) {
            this.resetFormForAddMode();
          } else {
            this.closePanel.emit();
          }
        },
        error: (error) => {
          console.error('Error saving:', error);
        }
      });
  }

  onSaveAndCreateAnother(): void {
    this.onSave(true);
  }

  formatDateTime(date: Date | null): string {
    if (!date) return '';
    const timeZone = this.headerService.chapterTimeZone();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: true, timeZoneName: 'short'
    });
    const parts = formatter.formatToParts(date);
    const hour = parts.find(p => p.type === 'hour')?.value || '12';
    const minute = parts.find(p => p.type === 'minute')?.value || '00';
    const dayPeriod = parts.find(p => p.type === 'dayPeriod')?.value || 'AM';
    const timeZoneName = parts.find(p => p.type === 'timeZoneName')?.value || 'UTC';

    const momentDate = moment(date);
    const isToday = momentDate.isSame(moment(), 'day');
    const datePart = isToday ? 'Today' : momentDate.format('DD-MMM-YYYY').toUpperCase();
    return `${datePart}, ${hour}:${minute} ${dayPeriod} ${timeZoneName}`;
  }

  formatCurrency(value: number | null): string {
    if (value == null) return '-';
    return value.toFixed(2);
  }

  getProductTypeLabel(pt: ProductTypeDropdownDto): string {
    return `${pt.productType} - ${pt.productTypeDesc}`;
  }

  get productTypeControl() { return this.form.get('productType'); }
  get tierControl() { return this.form.get('tier'); }
  get effectiveDateControl() { return this.form.get('effectiveDate'); }
  get terminationDateControl() { return this.form.get('terminationDate'); }

  getProductTypeError(): string {
    const control = this.productTypeControl;
    if (!control || !control.touched) return '';
    if (control.hasError('required')) return 'Product is required';
    if (control.hasError('maxlength')) return 'Product Type cannot exceed 15 characters';
    return '';
  }

  getTierError(): string {
    const control = this.tierControl;
    if (!control || !control.touched) return '';
    if (control.hasError('required')) return 'Tier is required';
    return '';
  }

  getEffectiveDateError(): string {
    const control = this.form.get('effectiveDate');
    if (!control) return '';

    if (control.hasError('invalidDate') || control.hasError('matDatepickerParse')) return 'Effective Date is invalid';
    if (control.hasError('invalidDateFormat')) return 'Effective Date is invalid';

    const inputValue = this.effDateInput?.nativeElement?.value;
    if (inputValue && inputValue.trim().length > 0 && !control.value) {
      return 'Effective Date is invalid';
    }

    if (!(control.touched || control.dirty)) return '';

    if (control.hasError('required')) return 'Effective Date is required';
    if (control.hasError('effectiveDatePast')) return 'Effective Date cannot be past date';

    if (this.lastChangedDateField === 'effective' && this.form.errors?.['dateRangeInvalid']) {
      return 'Effective Date must be less than or equal to Termination Date';
    }

    return '';
  }

  getTerminationDateError(): string {
    const control = this.form.get('terminationDate');
    if (!control) return '';

    if (control.hasError('invalidDate') || control.hasError('matDatepickerParse')) return 'Termination Date is invalid';
    if (control.hasError('invalidDateFormat')) return 'Termination Date is invalid';

    const inputValue = this.termDateInput?.nativeElement?.value;
    if (inputValue && inputValue.trim().length > 0 && !control.value) {
      return 'Termination Date is invalid';
    }

    if (!(control.touched || control.dirty)) return '';

    if (control.hasError('required')) return 'Termination Date is required';
    if (control.hasError('terminationDatePast')) return 'Termination Date cannot be past date';
    if (control.hasError('matDatepickerMin')) return 'Termination Date cannot be past date';

    if (this.lastChangedDateField !== 'effective') {
      if (this.form.errors?.['dateRangeInvalid']) return 'Termination Date must be greater than or equal to Effective Date';
    }

    return '';
  }

  get isFormValid(): boolean {
    if (this.getEffectiveDateError() || this.getTerminationDateError()) return false;
    return this.form.valid;
  }

  get isFormDirty(): boolean {
    if (this.mode === 'add') return true;
    const currentTier = this.form.get('tier')?.value ?? null;
    const currentTermDate = this.form.get('terminationDate')?.value;
    const currentTermDateStr = currentTermDate
      ? (moment.isMoment(currentTermDate) ? currentTermDate.format('YYYY-MM-DD') : moment(currentTermDate).format('YYYY-MM-DD'))
      : null;
    return currentTier !== this.originalEditableValues.tier
      || currentTermDateStr !== this.originalEditableValues.terminationDate;
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

  onEffectiveDateBlur(): void {
    setTimeout(() => {
      const control = this.form.get('effectiveDate');
      control?.markAsTouched();
      control?.updateValueAndValidity();
      this.form.updateValueAndValidity({ emitEvent: false });
      this.cdr.markForCheck();
    }, 0);
  }

  onTerminationDateBlur(): void {
    setTimeout(() => {
      const control = this.form.get('terminationDate');
      control?.markAsTouched();
      control?.updateValueAndValidity();
      this.form.updateValueAndValidity({ emitEvent: false });
      this.cdr.markForCheck();
    }, 0);
  }
}
