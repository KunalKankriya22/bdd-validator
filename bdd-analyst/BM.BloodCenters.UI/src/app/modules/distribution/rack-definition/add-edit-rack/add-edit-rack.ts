import {
  Component,
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
  effect
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
import { MatSelect, MatSelectModule } from '@angular/material/select';
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
import { formatTableDate } from '@shared/utils/date-format.util';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { RackDefinitionService } from '../services/rack-definition.service';
import { HeaderService } from '@shared/services/header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { TIMEZONE_OFFSET_MAP, TIMEZONE_OFFSET_REGEX } from 'src/app/core/constants/timezone.constants';
import moment, { Moment } from 'moment';
import { Subject, takeUntil, finalize, Observable } from 'rxjs';
import {
  RackDetailListDto,
  CreateRackDetailDto,
  UpdateRackDetailDto,
  LovOption,
  ReturnResult
} from '../models/rack-definition.model';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { noWhitespaceOnlyValidator } from '@shared/validators/input.validators';

const ABORH_DISABLE_STORAGE_CLASSES = ['BI', 'DI', 'OD', 'QU', 'RJ'];

@Component({
  selector: 'app-add-edit-rack',
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
  templateUrl: './add-edit-rack.html',
  styleUrls: ['./add-edit-rack.scss']
})
export class AddEditRackComponent implements OnInit, OnChanges, OnDestroy {

  @Input() mode: 'add' | 'edit' = 'add';
  @Input() data: RackDetailListDto | null = null;
  @Input() retrieveState!: { warehouseId: string; deviceType: string; deviceNumber: string; storageClass: string };
  @Output() closePanel = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<void>();

  @ViewChild('productTypeSelect') productTypeSelect?: MatSelect;
  @ViewChild('aboRhSelect') aboRhSelect?: MatSelect;

  form!: FormGroup;
  panelTitle = '';
  lastModified = '';
  isSaving = false;

  readonly selectPanelLoadingValue = '__PANEL_LOADING__';
  readonly selectPanelEmptyValue = '__PANEL_EMPTY__';

  productTypeOptions = signal<LovOption[]>([]);
  aboRhOptions = signal<LovOption[]>([]);
  isLoadingProductTypes = false;
  isLoadingAboRh = false;

  readonly productTypeSearchControl = new FormControl('');
  readonly aboRhSearchControl = new FormControl('');

  readonly productTypeSearch = signal('');
  readonly aboRhSearch = signal('');

  readonly filteredProductTypes = computed(() => {
    const search = this.productTypeSearch().toLowerCase();
    const options = this.productTypeOptions();
    if (!search) return options;
    return options.filter(o =>
      o.code?.toLowerCase().includes(search) || o.description?.toLowerCase().includes(search)
    );
  });

  readonly filteredAboRh = computed(() => {
    const search = this.aboRhSearch().toLowerCase();
    const options = this.aboRhOptions();
    if (!search) return options;
    return options.filter(o =>
      o.code?.toLowerCase().includes(search) || o.description?.toLowerCase().includes(search)
    );
  });

  get isAboRhDisabled(): boolean {
    return ABORH_DISABLE_STORAGE_CLASSES.includes(this.retrieveState?.storageClass);
  }

  minEffectiveDate = DateFieldValidationUtility.getMinDate();

  terminationDateFilter = (date: moment.Moment | null): boolean => {
    if (!date) return true;

    const checkDate = moment(date).startOf('day');
    const today = this.chapterTimezoneService.getChapterLocalDate();

    if (checkDate.isBefore(today)) {
      return false;
    }

    const eff = this.form?.get('effectiveDate')?.value;
    if (eff) {
      const effDay = moment(eff).startOf('day');
      if (checkDate.isBefore(effDay)) {
        return false;
      }
    }

    return true;
  };

  private lastChangedDateField: 'effective' | 'termination' | null = null;

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEffectiveDateError());
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTerminationDateError());

  private originalRackNumber: string | null = null;
  private originalProductType: string | null = null;
  private originalBloodType: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private rackDefinitionService: RackDefinitionService,
    private headerService: HeaderService,
    private chapterTimezoneService: ChapterTimezoneService,
    private snackbarService: SnackbarService
  ) {
    this.buildForm();

    this.productTypeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.productTypeSearch.set(value || ''));

    this.aboRhSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.aboRhSearch.set(value || ''));

    effect(() => {
      this.filteredProductTypes();
      this.filteredAboRh();
      setTimeout(() => {
        [this.productTypeSelect, this.aboRhSelect]
          .forEach(s => { if (s?.panelOpen) (s as any)._keyManager?.setActiveItem(1); });
      });
    });
  }

  ngOnInit(): void {
    this.setupDateValidationListeners();
    this.loadDropdowns();
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

  /* ---------------- FORM BUILD ---------------- */

  private buildForm(): void {
    this.form = this.fb.group({
      rackNumber: ['', [Validators.required, Validators.maxLength(2), Validators.pattern(/^[A-Za-z0-9]{1,2}$/)]],
      rackDescription: ['', [Validators.required, Validators.maxLength(50), noWhitespaceOnlyValidator()]],
      productType: ['', Validators.required],
      bloodType: [null],
      shelfCount: [null, [Validators.min(0), Validators.max(99)]],
      trayCount: [null, [Validators.min(0), Validators.max(9999)]],
      mixProduct: [null],
      mixAbo: [null],
      effectiveDate: [null, [Validators.required, DateFieldValidationUtility.effectiveDateNotPastValidator(this.headerService.chapterTimeZone())]],
      terminationDate: [null]
    }, {
      validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate')]
    });
  }

  /* ---------------- PANEL SETUP ---------------- */

  private setupPanel(): void {
    if (this.mode === 'add') {
      this.panelTitle = 'Add New Rack';
      this.lastModified = '';
      this.form.enable();
      this.form.reset();

      if (this.isAboRhDisabled) {
        this.form.get('bloodType')?.disable();
      } else {
        this.form.get('bloodType')?.enable();
      }

      DateFieldValidationUtility.setupAddModeValidators(this.form);
    } else if (this.mode === 'edit' && this.data) {
      this.panelTitle = 'Edit Rack';
      this.lastModified = this.formatLastModified(this.data.lastModifiedDate);
      this.populateForm();
      DateFieldValidationUtility.setupEditModeValidators(this.form);

      const termCtrl = this.form.get('terminationDate');
      if (termCtrl) {
        termCtrl.addValidators(DateFieldValidationUtility.terminationDateNotPastValidator(this.headerService.chapterTimeZone()));
        termCtrl.updateValueAndValidity({ emitEvent: false });
      }
    }
  }

  private populateForm(): void {
    if (!this.data) return;

    this.originalRackNumber = this.data.rackNumber;
    this.originalProductType = this.data.productType;
    this.originalBloodType = this.data.bloodType;

    this.form.enable();

    const terminationDate = this.data.terminationDate ? moment(this.data.terminationDate, 'DD-MMM-YYYY') : null;

    this.form.patchValue({
      rackNumber: this.data.rackNumber,
      rackDescription: this.data.rackDescription,
      productType: this.data.productType,
      bloodType: this.data.bloodType,
      shelfCount: this.data.shelfCount,
      trayCount: this.data.trayCount,
      mixProduct: this.data.mixProduct,
      mixAbo: this.data.mixAbo,
      effectiveDate: this.data.effectiveDate ? moment(this.data.effectiveDate, 'DD-MMM-YYYY') : null,
      terminationDate
    });

    if (this.isAboRhDisabled) {
      this.form.get('bloodType')?.disable();
      this.form.get('bloodType')?.setValue(null);
    }
  }

  /* ---------------- DATE VALIDATION ---------------- */

  private setupDateValidationListeners(): void {
    this.form.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'effective';
        this.form.updateValueAndValidity({ onlySelf: true, emitEvent: false });
      });

    this.form.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'termination';
        this.form.updateValueAndValidity({ onlySelf: true, emitEvent: false });
      });
  }

  get effectiveDateControl() {
    return this.form.get('effectiveDate');
  }

  get terminationDateControl() {
    return this.form.get('terminationDate');
  }

  get isFormValid(): boolean {
    if (this.mode === 'add') {
      return this.form?.valid;
    }
    if (!this.form?.dirty) {
      return false;
    }
    const rackNum = this.form.get('rackNumber');
    const desc = this.form.get('rackDescription');
    const prodType = this.form.get('productType');
    const hasVisibleErrors =
      !!(rackNum?.touched && rackNum?.invalid) ||
      !!(desc?.touched && desc?.invalid) ||
      !!(prodType?.touched && prodType?.invalid) ||
      this.getEffectiveDateError() !== '' ||
      this.getTerminationDateError() !== '';
    return !hasVisibleErrors;
  }

  getRackNumberError(): string {
    const ctrl = this.form.get('rackNumber');
    if (ctrl?.hasError('required')) return 'Rack Number is required';
    if (ctrl?.hasError('pattern')) return 'Only alphanumeric characters allowed';
    if (ctrl?.hasError('maxlength')) return 'Max 2 characters';
    return '';
  }

  getDescriptionError(): string {
    const ctrl = this.form.get('rackDescription');
    if (ctrl?.hasError('required')) return 'Description is required';
    if (ctrl?.hasError('whitespaceOnly')) return 'Description cannot contain only spaces';
    if (ctrl?.hasError('maxlength')) return 'Max 50 characters';
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

  /* ---------------- INPUT HANDLERS ---------------- */

  onRackNumberKeydown(event: KeyboardEvent): void {
    const allowed = /^[A-Za-z0-9]$/;
    if (event.key.length === 1 && !allowed.test(event.key)) {
      event.preventDefault();
    }
  }

  onRackNumberPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pasted = event.clipboardData?.getData('text') || '';
    const cleaned = pasted.replace(/[^A-Za-z0-9]/g, '').substring(0, 2).toUpperCase();
    const input = event.target as HTMLInputElement;
    input.value = cleaned;
    this.form.get('rackNumber')?.setValue(cleaned);
  }

  onRackNumberInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const transformed = input.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    if (input.value !== transformed) {
      input.value = transformed;
      this.form.get('rackNumber')?.setValue(transformed, { emitEvent: false });
    }
  }

  onDescriptionKeydown(event: KeyboardEvent): void {
    const input = event.target as HTMLInputElement;
    if (event.key === ' ' && input.selectionStart === 0) {
      event.preventDefault();
    }
  }

  onNumericKeydown(event: KeyboardEvent): void {
    const allowed = /^[0-9]$/;
    const navKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End'];
    if (navKeys.includes(event.key)) return;
    if (event.ctrlKey || event.metaKey) return;
    if (event.key.length === 1 && !allowed.test(event.key)) {
      event.preventDefault();
    }
  }

  onNumericPaste(event: ClipboardEvent, maxDigits: number): void {
    event.preventDefault();
    const pasted = event.clipboardData?.getData('text') || '';
    const cleaned = pasted.replace(/[^0-9]/g, '').substring(0, maxDigits);
    const input = event.target as HTMLInputElement;
    input.value = cleaned;
    const controlName = input.getAttribute('formControlName');
    if (controlName) {
      this.form.get(controlName)?.setValue(cleaned ? Number(cleaned) : null);
    }
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

  /* ---------------- LOAD DROPDOWNS ---------------- */

  private loadDropdowns(): void {
    this.isLoadingProductTypes = true;
    this.rackDefinitionService.getProductTypeLov()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          this.productTypeOptions.set(res.data ?? []);
          this.isLoadingProductTypes = false;
        },
        error: () => {
          this.productTypeOptions.set([]);
          this.isLoadingProductTypes = false;
        }
      });

    if (!this.isAboRhDisabled) {
      this.isLoadingAboRh = true;
      this.rackDefinitionService.getAboRhLov()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: res => {
            this.aboRhOptions.set(res.data ?? []);
            this.isLoadingAboRh = false;
          },
          error: () => {
            this.aboRhOptions.set([]);
            this.isLoadingAboRh = false;
          }
        });
    }
  }

  /* ---------------- SAVE HANDLER ---------------- */

  onSave(closeAfterSave = true): void {
    this.form.markAllAsTouched();
    this.form.get('terminationDate')?.updateValueAndValidity();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'terminationDate');

    if (this.mode === 'add' && this.form.invalid) return;
    if (this.mode === 'edit' && !this.isFormValid) return;

    const raw = this.form.getRawValue();

    const effectiveDate = raw.effectiveDate as Moment;
    const terminationDate = raw.terminationDate as Moment;

    if (this.mode === 'add' && (!effectiveDate || !effectiveDate.isValid())) return;
    if (terminationDate && !terminationDate.isValid()) return;

    this.isSaving = true;

    let apiCall: Observable<ReturnResult<any>>;

    if (this.mode === 'add') {
      const payload: CreateRackDetailDto = {
        warehouseId: this.retrieveState.warehouseId,
        deviceType: this.retrieveState.deviceType,
        deviceNumber: this.retrieveState.deviceNumber,
        storageClass: this.retrieveState.storageClass,
        rackNumber: raw.rackNumber?.trim(),
        rackDescription: raw.rackDescription?.trim(),
        productType: raw.productType?.trim(),
        bloodType: this.isAboRhDisabled ? null : (raw.bloodType || null),
        shelfCount: raw.shelfCount !== null && raw.shelfCount !== '' ? Number(raw.shelfCount) : null,
        trayCount: raw.trayCount !== null && raw.trayCount !== '' ? Number(raw.trayCount) : null,
        mixProduct: raw.mixProduct || null,
        mixAbo: raw.mixAbo || null,
        effectiveDate: effectiveDate.format('YYYY-MM-DD') + 'T00:00:00',
        terminationDate: terminationDate ? terminationDate.format('YYYY-MM-DD') + 'T00:00:00' : null
      };

      apiCall = this.rackDefinitionService.createRack(payload);
    } else {
      const payload: UpdateRackDetailDto = {
        warehouseId: this.retrieveState.warehouseId,
        deviceType: this.retrieveState.deviceType,
        deviceNumber: this.retrieveState.deviceNumber,
        storageClass: this.retrieveState.storageClass,
        rackNumber: raw.rackNumber?.trim(),
        rackDescription: raw.rackDescription?.trim(),
        productType: raw.productType?.trim(),
        bloodType: this.isAboRhDisabled ? null : (raw.bloodType || null),
        shelfCount: raw.shelfCount !== null && raw.shelfCount !== '' ? Number(raw.shelfCount) : null,
        trayCount: raw.trayCount !== null && raw.trayCount !== '' ? Number(raw.trayCount) : null,
        mixProduct: raw.mixProduct || null,
        mixAbo: raw.mixAbo || null,
        effectiveDate: effectiveDate ? effectiveDate.format('YYYY-MM-DD') + 'T00:00:00' : this.data!.effectiveDate,
        terminationDate: terminationDate ? terminationDate.format('YYYY-MM-DD') + 'T00:00:00' : null,
        originalRackNumber: this.originalRackNumber || '',
        originalProductType: this.originalProductType || '',
        originalBloodType: this.originalBloodType || null
      };

      apiCall = this.rackDefinitionService.updateRack(payload);
    }

    apiCall
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isSaving = false))
      )
      .subscribe({
        next: (res: any) => {
          this.snackbarService.showSuccess(res?.message || 'Rack details have been saved.');
          this.saveSuccess.emit();

          if (closeAfterSave) {
            this.closePanel.emit();
          } else {
            this.form.reset();
            this.form.markAsPristine();
            this.form.markAsUntouched();
            if (this.isAboRhDisabled) {
              this.form.get('bloodType')?.disable();
            }
          }
        },
        error: () => {}
      });
  }

  onSaveAndCreateAnother(): void {
    this.onSave(false);
  }

  onCancel(): void {
    this.closePanel.emit();
  }

  onClearAll(): void {
    if (this.mode === 'edit' && this.data) {
      this.populateForm();
      this.form.markAsPristine();
      this.form.markAsUntouched();
    }
  }

  /* ---------------- FORMATTERS ---------------- */

  formatDate(date: string | null | undefined): string {
    return formatTableDate(date);
  }

  private formatLastModified(date: string | null | undefined): string {
    if (!date) return '';

    const match = date.match(/^(\d{2})-(\w{3})-(\d{4})\s+(\d{2}):(\d{2})\s*(AM|PM)?$/i);
    if (!match) return '';

    const [, dayStr, monStr, yearStr, hourStr, minuteStr, ampm] = match;

    let timeZone = this.headerService.chapterTimeZone();
    if (!timeZone || !TIMEZONE_OFFSET_REGEX.test(timeZone)) {
      timeZone = '+00:00';
    }
    const displayLabel = TIMEZONE_OFFSET_MAP[timeZone]?.abbr ?? `GMT${timeZone}`;

    const sign = timeZone[0] === '+' ? 1 : -1;
    const [tzHH, tzMM] = timeZone.slice(1).split(':').map(Number);
    const chapterNow = new Date(Date.now() + sign * (tzHH * 60 + tzMM) * 60000);
    const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
    const todayDay = String(chapterNow.getUTCDate()).padStart(2, '0');
    const todayMon = MONTHS[chapterNow.getUTCMonth()];
    const todayYear = String(chapterNow.getUTCFullYear());

    const isToday = dayStr === todayDay && monStr.toUpperCase() === todayMon && yearStr === todayYear;
    const datePart = isToday ? 'Today' : `${dayStr}-${monStr.toUpperCase()}-${yearStr}`;

    const timePart = ampm ? `${hourStr}:${minuteStr} ${ampm.toUpperCase()}` : `${hourStr}:${minuteStr}`;

    return `Last Modified: ${datePart}, ${timePart} ${displayLabel}`;
  }
}
