import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  ViewChild,
  signal,
  computed,
  inject,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SnackbarService } from '@shared/services/snackbar.service';
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE
} from '@angular/material/core';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { HeaderService } from '@shared/services/header.service';
import { TIMEZONE_OFFSET_MAP, TIMEZONE_OFFSET_REGEX } from 'src/app/core/constants/timezone.constants';
import moment, { Moment } from 'moment';
import { Subject, takeUntil, finalize, Observable } from 'rxjs';
import {
  ProductStorageListDto,
  CreateProductStorageDto,
  UpdateProductStorageDto,
  LovOption,
  SaveResult
} from '../models/product-storage-definition.model';
import { ProductStorageDefinitionService } from '../services/product-storage-definition.service';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

@Component({
  selector: 'app-add-edit-product-storage',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatIconModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './add-edit-product-storage.html',
  styleUrls: ['./add-edit-product-storage.scss']
})
export class AddEditProductStorageComponent implements OnInit, OnChanges, OnDestroy {

  @Input() mode: 'add' | 'edit' = 'add';
  @Input() data: ProductStorageListDto | null = null;
  @Input() productTypeLovOptions: LovOption[] = [];
  @Input() warehouseLovOptions: LovOption[] = [];
  @Input() deviceTypeLovOptions: LovOption[] = [];
  @Output() closePanel = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<void>();

  /** WCAG 2.4.3: template reference used by parent to move focus into panel on open */
  @ViewChild('closeButtonRef') closeButtonElement?: ElementRef<HTMLButtonElement>;

  form!: FormGroup;
  panelTitle = '';
  lastModified = '';
  isSaving = false;

  deviceDescription = signal('');
  deviceNumberLovOptions = signal<LovOption[]>([]);
  isLoadingDeviceNumbers = signal(false);

  // ─── Product-type search ───────────────────────────────────────────────────
  readonly productTypeSearchControl = new FormControl('');
  readonly productTypeSearch = signal('');
  readonly filteredProductTypes = computed(() => {
    const search = this.productTypeSearch().toLowerCase();
    return search
      ? this.productTypeLovOptions.filter(o =>
          o.code.toLowerCase().includes(search) || o.description.toLowerCase().includes(search))
      : this.productTypeLovOptions;
  });

  // ─── Warehouse search ──────────────────────────────────────────────────────
  readonly warehouseSearchControl = new FormControl('');
  readonly warehouseSearch = signal('');
  readonly filteredWarehouses = computed(() => {
    const search = this.warehouseSearch().toLowerCase();
    return search
      ? this.warehouseLovOptions.filter(o =>
          o.code.toLowerCase().includes(search) || o.description.toLowerCase().includes(search))
      : this.warehouseLovOptions;
  });

  // ─── Device-type search ────────────────────────────────────────────────────
  readonly deviceTypeSearchControl = new FormControl('');
  readonly deviceTypeSearch = signal('');
  readonly filteredDeviceTypes = computed(() => {
    const search = this.deviceTypeSearch().toLowerCase();
    return search
      ? this.deviceTypeLovOptions.filter(o =>
          o.code.toLowerCase().includes(search) || o.description.toLowerCase().includes(search))
      : this.deviceTypeLovOptions;
  });

  // ─── Device-number search ──────────────────────────────────────────────────
  readonly deviceNumberSearchControl = new FormControl('');
  readonly deviceNumberSearch = signal('');
  readonly filteredDeviceNumbers = computed(() => {
    const search = this.deviceNumberSearch().toLowerCase();
    return search
      ? this.deviceNumberLovOptions().filter(o =>
          o.code.toLowerCase().includes(search) || o.description.toLowerCase().includes(search))
      : this.deviceNumberLovOptions();
  });

  private lastChangedDateField: 'effective' | 'termination' | null = null;

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEffectiveDateError());
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTerminationDateError());

  minDate: Moment;
  terminationMinDate: Moment;

  private readonly headerService = inject(HeaderService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly fb = inject(FormBuilder);
  private readonly productStorageService = inject(ProductStorageDefinitionService);
  private readonly snackbarService = inject(SnackbarService);

  private destroy$ = new Subject<void>();

  private get chapterOffset(): string { return this.headerService.chapterTimeZone(); }

  constructor() {
    this.minDate = this.getChapterMinDate();
    this.terminationMinDate = this.minDate;

    this.productTypeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.productTypeSearch.set(value || ''));

    this.warehouseSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.warehouseSearch.set(value || ''));

    this.deviceTypeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.deviceTypeSearch.set(value || ''));

    this.deviceNumberSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.deviceNumberSearch.set(value || ''));

    this.buildForm();
  }

  ngOnInit(): void {
    this.setupDateValidationListeners();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mode'] || changes['data']) {
      this.setupPanel();
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

  private updateTerminationMinDate(): void {
    const effectiveValue = this.form?.get('effectiveDate')?.value;
    let effectiveMoment: Moment | null = null;

    if (effectiveValue && moment.isMoment(effectiveValue) && effectiveValue.isValid()) {
      effectiveMoment = effectiveValue.clone();
    } else if (effectiveValue instanceof Date && !isNaN(effectiveValue.getTime())) {
      effectiveMoment = moment(effectiveValue);
    }

    if (effectiveMoment) {
      this.terminationMinDate = effectiveMoment.isAfter(this.minDate) ? effectiveMoment : this.minDate.clone();
    } else {
      this.terminationMinDate = this.minDate;
    }
  }

  private buildForm(): void {
    this.form = this.fb.group({
      productType: ['', Validators.required],
      warehouseId: ['', Validators.required],
      deviceType: ['', Validators.required],
      number: ['', [Validators.required]],
      trayCapacity: ['', [Validators.required, Validators.maxLength(2), Validators.pattern(/^[1-9]\d?$/)]],
      effectiveDate: [null, [Validators.required, DateFieldValidationUtility.effectiveDateNotPastValidator(this.chapterOffset)]],
      terminationDate: [null]
    }, {
      validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate')]
    });
  }

  private setupPanel(): void {
    if (this.mode === 'add') {
      this.panelTitle = 'Add Product Type';
      this.lastModified = '';
      this.deviceDescription.set('');
      this.form.enable();
      this.form.reset();
      DateFieldValidationUtility.setupAddModeValidators(this.form, this.chapterOffset);
      this.productTypeSearchControl.reset('');
      this.warehouseSearchControl.reset('');
      this.deviceTypeSearchControl.reset('');
      this.deviceNumberLovOptions.set([]);
      this.deviceNumberSearchControl.reset('');
    } else if (this.mode === 'edit' && this.data) {
      this.panelTitle = 'Edit Product Type';
      this.lastModified = this.formatLastModified(this.data.lastModifiedDate);
      this.deviceDescription.set(this.data.deviceDescription || '');

      this.form.enable();
      // Composite-key fields + effectiveDate are display-only in edit mode
      this.form.get('productType')?.disable();
      this.form.get('warehouseId')?.disable();
      this.form.get('deviceType')?.disable();
      this.form.get('number')?.disable();
      this.form.get('effectiveDate')?.disable();

      this.populateForm();
      DateFieldValidationUtility.setupEditModeValidators(this.form, this.chapterOffset);

      const termCtrl = this.form.get('terminationDate');
      if (termCtrl) {
        termCtrl.addValidators(DateFieldValidationUtility.terminationDateNotPastValidator(this.chapterOffset));
        termCtrl.updateValueAndValidity({ emitEvent: false });
      }
    }
  }

  private populateForm(): void {
    if (!this.data) return;

    this.form.patchValue({
      productType: this.data.productType,
      warehouseId: this.data.warehouseId,
      deviceType: this.data.deviceType,
      number: this.data.number,
      trayCapacity: this.data.trayCapacity,
      effectiveDate: this.data.effectiveDate ? moment(this.data.effectiveDate, 'DD-MMM-YYYY') : null,
      terminationDate: this.data.terminationDate ? moment(this.data.terminationDate, 'DD-MMM-YYYY') : null
    });
  }

  private setupDateValidationListeners(): void {
    this.form.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'effective';
        this.updateTerminationMinDate();
        this.form.updateValueAndValidity({ onlySelf: true, emitEvent: false });
        this.cdr.markForCheck();
      });

    this.form.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'termination';
        this.form.updateValueAndValidity({ onlySelf: true, emitEvent: false });
        this.cdr.markForCheck();
      });
  }

  // ─── Cascade: device number ────────────────────────────────────────────────

  onWarehouseChange(_warehouseId: string): void {
    this.loadDeviceNumbers();
  }

  onDeviceTypeChange(selectedCode: string): void {
    const option = this.deviceTypeLovOptions.find(o => o.code === selectedCode);
    this.deviceDescription.set(option?.description || '');
    this.loadDeviceNumbers();
  }

  private loadDeviceNumbers(): void {
    const warehouseId = this.form.get('warehouseId')?.value;
    const deviceType = this.form.get('deviceType')?.value;

    this.deviceNumberLovOptions.set([]);
    this.form.get('number')?.setValue(null, { emitEvent: false });
    this.deviceNumberSearchControl.reset('');

    if (!warehouseId || !deviceType) return;

    this.isLoadingDeviceNumbers.set(true);
    this.productStorageService.getDeviceNumbersLov(warehouseId, deviceType)
      .pipe(takeUntil(this.destroy$), finalize(() => this.isLoadingDeviceNumbers.set(false)))
      .subscribe({
        next: (res) => this.deviceNumberLovOptions.set(res?.data ?? []),
        error: () => this.deviceNumberLovOptions.set([])
      });
  }

  // ─── Numeric input guards ──────────────────────────────────────────────────

  onNumericKeydown(event: KeyboardEvent): void {
    const navKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End'];
    if (navKeys.includes(event.key)) return;
    if (event.ctrlKey || event.metaKey) return;
    if (event.key.length === 1 && !/^[0-9]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  onNumericPaste(event: ClipboardEvent, controlName: string, maxDigits: number): void {
    event.preventDefault();
    const pasted = event.clipboardData?.getData('text') || '';
    const cleaned = pasted.replace(/[^0-9]/g, '').substring(0, maxDigits);
    const input = event.target as HTMLInputElement;
    input.value = cleaned;
    this.form.get(controlName)?.setValue(cleaned || null);
  }

  // ─── Date event handlers ───────────────────────────────────────────────────

  onEffectiveDateInput(event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value, this.form.get('effectiveDate')
    );
  }

  onEffectiveDateChange(): void {
    this.lastChangedDateField = 'effective';
    this.updateTerminationMinDate();
    this.form.get('effectiveDate')?.markAsTouched();
    this.form.get('effectiveDate')?.markAsDirty();
    this.form.updateValueAndValidity();
    this.cdr.markForCheck();
  }

  onTerminationDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value, this.form.get('terminationDate'), this.mode === 'edit'
    );
  }

  onTerminationDateChange(): void {
    this.lastChangedDateField = 'termination';
    this.form.get('terminationDate')?.markAsTouched();
    this.form.get('terminationDate')?.markAsDirty();
    this.form.updateValueAndValidity();
    this.cdr.markForCheck();
  }

  // ─── Character counters ────────────────────────────────────────────────────

  get numberCharCount(): string {
    const val = this.form.get('number')?.value || '';
    return `Character remaining : ${String(val).length}/2`;
  }

  get trayCapacityCharCount(): string {
    const val = this.form.get('trayCapacity')?.value || '';
    return `${String(val).length} of 2 characters`;
  }

  // ─── Form validity ─────────────────────────────────────────────────────────

  get isFormValid(): boolean {
    if (this.mode === 'add') {
      return this.form?.valid;
    }
    if (!this.form?.dirty) {
      return false;
    }
    const hasVisibleErrors =
      this.getEffectiveDateError() !== '' ||
      this.getTerminationDateError() !== '';
    return !hasVisibleErrors;
  }

  // ─── Date error getters ────────────────────────────────────────────────────

  getEffectiveDateError(): string {
    return DateFieldValidationUtility.getStartDateCrossFieldError(
      this.form.get('effectiveDate'), 'Effective Date', 'Termination Date', this.form.errors
    );
  }

  getTerminationDateError(): string {
    return DateFieldValidationUtility.getEndDateCrossFieldError(
      this.form.get('terminationDate'), 'Termination Date', 'Effective Date', this.form.errors
    );
  }

  // ─── Save ──────────────────────────────────────────────────────────────────

  onSave(closeAfterSave = true): void {
    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'terminationDate');
    this.cdr.markForCheck();

    if (this.form.errors?.['dateRangeInvalid'] && !this.lastChangedDateField) {
      this.lastChangedDateField = 'effective';
    }

    if (this.mode === 'add' && this.form.invalid) return;
    if (this.mode === 'edit' && !this.isFormValid) return;

    const raw = this.form.getRawValue();
    const effectiveDate = raw.effectiveDate as Moment;
    const terminationDate = raw.terminationDate as Moment;

    if (this.mode === 'add' && (!effectiveDate || !effectiveDate.isValid())) return;
    if (terminationDate && !terminationDate.isValid()) return;

    this.isSaving = true;

    let apiCall: Observable<SaveResult>;

    if (this.mode === 'add') {
      const payload: CreateProductStorageDto = {
        productType: raw.productType?.trim(),
        warehouseId: raw.warehouseId?.trim(),
        deviceType: raw.deviceType?.trim(),
        deviceNumber: String(raw.number ?? '').trim(),
        trayCapacity: Number(raw.trayCapacity),
        effectiveDate: effectiveDate.format('YYYY-MM-DD'),
        termDate: terminationDate ? terminationDate.format('YYYY-MM-DD') : null
      };
      apiCall = this.productStorageService.createProductStorage(payload);
    } else {
      const payload: UpdateProductStorageDto = {
        trayCapacity: Number(raw.trayCapacity),
        effectiveDate: this.data!.effectiveDate
          ? moment(this.data!.effectiveDate, 'DD-MMM-YYYY').format('YYYY-MM-DD')
          : effectiveDate?.format('YYYY-MM-DD') ?? '',
        termDate: terminationDate ? terminationDate.format('YYYY-MM-DD') : null
      };
      apiCall = this.productStorageService.updateProductStorage(
        this.data!.productType,
        this.data!.warehouseId,
        this.data!.deviceType,
        this.data!.number,
        payload
      );
    }

    apiCall
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isSaving = false))
      )
      .subscribe({
        next: (res) => {
          const successMessage = this.mode === 'add'
            ? 'New product type has been added.'
            : 'New product type has been saved.';
          this.snackbarService.showSuccess(successMessage);

          // Always emit saveSuccess to refresh data
          this.saveSuccess.emit();

          if (closeAfterSave) {
            // Only close panel when saving normally, not for "Add and Create Another"
            this.closePanel.emit();
          } else {
            // For "Add and Create Another", reset form but keep panel open
            this.form.reset();
            this.form.markAsPristine();
            this.form.markAsUntouched();
            this.deviceDescription.set('');
            this.deviceNumberLovOptions.set([]);
            this.productTypeSearchControl.reset('');
            this.warehouseSearchControl.reset('');
            this.deviceTypeSearchControl.reset('');
            this.deviceNumberSearchControl.reset('');
            this.updateTerminationMinDate();
            this.cdr.markForCheck();
          }
        },
        error: () => {}
      });
  }

  onSaveAndCreateAnother(): void {
    this.onSave(false);
  }

  /** WCAG 2.4.3: called by parent to move keyboard focus into the panel after it opens */
  focusFirstElement(): void {
    setTimeout(() => this.closeButtonElement?.nativeElement?.focus(), 0);
  }

  onCancel(): void {
    this.closePanel.emit();
  }

  onClearAll(): void {
    if (this.mode === 'edit' && this.data) {
      this.deviceDescription.set(this.data.deviceDescription || '');
      this.populateForm();
      this.form.markAsPristine();
      this.form.markAsUntouched();
      this.lastChangedDateField = null;
      this.cdr.markForCheck();
    }
  }

  formatDate(date: string | null | undefined): string {
    if (!date) return '-';
    return date;
  }

  private formatLastModified(date: string | null | undefined): string {
    if (!date) return '';

    // Parse date as-is without timezone conversion
    const parsedDate = moment(date);
    if (!parsedDate.isValid()) return '';

    const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const dayStr = String(parsedDate.date()).padStart(2, '0');
    const monStr = MONTHS[parsedDate.month()];
    const yearStr = String(parsedDate.year());

    // Get current date for "Today" comparison
    const now = moment();
    const todayDay = String(now.date()).padStart(2, '0');
    const todayMon = MONTHS[now.month()];
    const todayYear = String(now.year());

    const isToday = dayStr === todayDay && monStr === todayMon && yearStr === todayYear;
    const datePart = isToday ? 'Today' : `${dayStr}-${monStr}-${yearStr}`;

    return `Last Modified: ${datePart}`;
  }
}
