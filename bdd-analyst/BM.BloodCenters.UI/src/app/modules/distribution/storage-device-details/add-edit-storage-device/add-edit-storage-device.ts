import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  signal,
  computed,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
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
import { StorageDeviceService } from '../services/storage-device.service';
import { HeaderService } from '@shared/services/header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { TIMEZONE_OFFSET_MAP, TIMEZONE_OFFSET_REGEX } from 'src/app/core/constants/timezone.constants';
import moment, { Moment } from 'moment';
import { Subject, takeUntil, finalize, Observable } from 'rxjs';
import {
  StorageDeviceListDto,
  CreateStorageDeviceDto,
  UpdateStorageDeviceDto,
  LovOption,
  SaveResult
} from '../models/storage-device.model';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { noWhitespaceOnlyValidator } from '@shared/validators/input.validators';
import { dateFormatValidator } from 'src/app/core/utils/date-adapter.util';

@Component({
  selector: 'app-add-edit-storage-device',
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
  templateUrl: './add-edit-storage-device.html',
  styleUrls: ['./add-edit-storage-device.scss']
})
export class AddEditStorageDeviceComponent implements OnInit, OnChanges, OnDestroy {

  @Input() mode: 'add' | 'edit' = 'add';
  @Input() data: StorageDeviceListDto | null = null;
  @Input() warehouseId!: string;
  @Input() deviceTypeLovOptions: LovOption[] = [];
  @Input() deviceStatusLovOptions: LovOption[] = [];
  @Output() closePanel = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<{ keepPanelOpen: boolean }>();

  form!: FormGroup;
  panelTitle = '';
  lastModified = '';
  isSaving = false;

  readonly deviceTypeSearchControl = new FormControl('');
  readonly deviceTypeSearch = signal('');

  readonly filteredDeviceTypes = computed(() => {
    const search = this.deviceTypeSearch().toLowerCase();
    const options = this.deviceTypeLovOptions;
    if (!search) return options;
    return options.filter(o =>
      o.code.toLowerCase().includes(search) || o.description.toLowerCase().includes(search)
    );
  });

  minEffectiveDate = DateFieldValidationUtility.getMinDate();
  today: moment.Moment = DateFieldValidationUtility.getMinDate('');

  terminationDateFilter = (date: moment.Moment | null): boolean => {
    if (!date) return true;
    const checkDate = moment(date).startOf('day');
    const today = this.chapterTimezoneService.getChapterLocalDate();
    if (checkDate.isBefore(today)) return false;
    const eff = this.form?.get('effectiveDate')?.value;
    if (eff) {
      const effDay = moment(eff).startOf('day');
      if (checkDate.isBefore(effDay)) return false;
    }
    return true;
  };

  installDateFilter = (date: moment.Moment | null): boolean => {
    if (!date) return true;
    const checkDate = moment(date).startOf('day');
    const today = this.chapterTimezoneService.getChapterLocalDate();
    return !checkDate.isAfter(today);
  };

  lastServiceDateFilter = (date: moment.Moment | null): boolean => {
    if (!date) return true;
    const checkDate = moment(date).startOf('day');
    const today = this.chapterTimezoneService.getChapterLocalDate();
    if (checkDate.isAfter(today)) return false;
    const install = this.form?.get('installDate')?.value;
    if (install) {
      const installDay = moment(install).startOf('day');
      if (checkDate.isBefore(installDay)) return false;
    }
    return true;
  };

  nextServiceDateFilter = (date: moment.Moment | null): boolean => {
    if (!date) return true;
    const checkDate = moment(date).startOf('day');
    const lastService = this.form?.get('lastServiceDate')?.value;
    if (lastService) {
      const lastServiceDay = moment(lastService).startOf('day');
      if (checkDate.isBefore(lastServiceDay)) return false;
    }
    return true;
  };

  tempReadDateFilter = (date: moment.Moment | null): boolean => {
    if (!date) return true;
    const checkDate = moment(date).startOf('day');
    const today = this.chapterTimezoneService.getChapterLocalDate();
    if (checkDate.isAfter(today)) return false;
    const install = this.form?.get('installDate')?.value;
    if (install) {
      const installDay = moment(install).startOf('day');
      if (checkDate.isBefore(installDay)) return false;
    }
    return true;
  };

  private lastChangedDateField: 'effective' | 'termination' | null = null;
  private lastChangedServiceDateField: 'lastService' | 'nextService' | null = null;
  private lastChangedInstallServiceField: 'install' | 'lastService' | 'tempRead' | null = null;

  installDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getInstallDateError());
  lastServiceDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getLastServiceDateError());
  nextServiceDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getNextServiceDateError());
  tempReadDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTempReadDateError());
  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEffectiveDateError());
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTerminationDateError());

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private storageDeviceService: StorageDeviceService,
    private headerService: HeaderService,
    private chapterTimezoneService: ChapterTimezoneService,
    private snackbarService: SnackbarService
  ) {
    this.buildForm();

    effect(() => {
      this.today = DateFieldValidationUtility.getMinDate(this.headerService.chapterTimeZone());
    });

    this.deviceTypeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.deviceTypeSearch.set(value || ''));
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

  private buildForm(): void {
    this.form = this.fb.group({
      deviceType: ['', Validators.required],
      deviceDescription: ['', [Validators.required, Validators.maxLength(50), noWhitespaceOnlyValidator()]],
      deviceNumber: ['', [Validators.required, Validators.maxLength(2), Validators.pattern(/^\d{2}$/)]],
      deviceStatus: ['', Validators.required],
      rackCount: [null, [Validators.required, Validators.min(0), Validators.max(9999)]],
      installDate: [null, [dateFormatValidator(), DateFieldValidationUtility.validDateValidator(), this.noFutureDateValidator()]],
      lastServiceDate: [null, [dateFormatValidator(), DateFieldValidationUtility.validDateValidator(), this.noFutureDateValidator()]],
      nextServiceDate: [null, [dateFormatValidator(), DateFieldValidationUtility.validDateValidator()]],
      lastTemperature: [null],
      tempReadDate: [null, [dateFormatValidator(), DateFieldValidationUtility.validDateValidator(), this.noFutureDateValidator()]],
      effectiveDate: [null, [Validators.required, DateFieldValidationUtility.effectiveDateNotPastValidator(this.headerService.chapterTimeZone())]],
      terminationDate: [null]
    }, {
      validators: [
        DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate'),
        this.serviceDateRangeValidator(),
        this.installVsServiceDateValidator('lastServiceDate', 'installLastServiceRangeInvalid'),
        this.installVsServiceDateValidator('tempReadDate', 'installTempReadRangeInvalid')
      ]
    });
  }

  private setupPanel(): void {
    if (this.mode === 'add') {
      this.panelTitle = 'Add New Record';
      this.lastModified = '';
      this.form.enable();
      this.form.reset();
      DateFieldValidationUtility.setupAddModeValidators(this.form);
    } else if (this.mode === 'edit' && this.data) {
      this.panelTitle = 'Edit Record';
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

    this.form.enable();

    this.form.patchValue({
      deviceType: this.data.deviceType,
      deviceDescription: this.data.deviceDescription,
      deviceNumber: this.data.deviceNumber,
      deviceStatus: this.data.deviceStatus,
      rackCount: this.data.rackCount,
      installDate: this.data.installDate ? moment(this.data.installDate, 'DD-MMM-YYYY') : null,
      lastServiceDate: this.data.lastServiceDate ? moment(this.data.lastServiceDate, 'DD-MMM-YYYY') : null,
      nextServiceDate: this.data.nextServiceDate ? moment(this.data.nextServiceDate, 'DD-MMM-YYYY') : null,
      lastTemperature: this.data.lastTemperature,
      tempReadDate: this.data.tempReadDate ? moment(this.data.tempReadDate, 'DD-MMM-YYYY') : null,
      effectiveDate: this.data.effectiveDate ? moment(this.data.effectiveDate, 'DD-MMM-YYYY') : null,
      terminationDate: this.data.terminationDate ? moment(this.data.terminationDate, 'DD-MMM-YYYY') : null
    });
  }

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

    this.form.get('installDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedInstallServiceField = 'install';
        this.form.updateValueAndValidity({ onlySelf: true, emitEvent: false });
      });

    this.form.get('lastServiceDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedServiceDateField = 'lastService';
        this.lastChangedInstallServiceField = 'lastService';
        this.form.updateValueAndValidity({ onlySelf: true, emitEvent: false });
      });

    this.form.get('nextServiceDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedServiceDateField = 'nextService';
        this.form.updateValueAndValidity({ onlySelf: true, emitEvent: false });
      });

    this.form.get('tempReadDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedInstallServiceField = 'tempRead';
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
    const desc = this.form.get('deviceDescription');
    const status = this.form.get('deviceStatus');
    const count = this.form.get('rackCount');
    const hasVisibleErrors =
      !!(desc?.touched && desc?.invalid) ||
      !!(status?.touched && status?.invalid) ||
      !!(count?.touched && count?.invalid) ||
      this.getEffectiveDateError() !== '' ||
      this.getTerminationDateError() !== '' ||
      this.getInstallDateError() !== '' ||
      this.getLastServiceDateError() !== '' ||
      this.getNextServiceDateError() !== '' ||
      this.getTempReadDateError() !== '';
    return !hasVisibleErrors;
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

  getInstallDateError(): string {
    const control = this.form.get('installDate');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('matDatepickerParse') || control.hasError('invalidDateFormat') || control.hasError('invalidDate')) return 'Commissioned Date is invalid';
    if (control.hasError('matDatepickerMax')) return 'Commissioned Date cannot be a future date';
    if (this.lastChangedInstallServiceField === 'install' && this.form.errors?.['installLastServiceRangeInvalid']) {
      return 'Commissioned Date must be less than or equal to Last Service Date';
    }
    if (this.lastChangedInstallServiceField === 'install' && this.form.errors?.['installTempReadRangeInvalid']) {
      return 'Commissioned Date must be less than or equal to Last Reading Date';
    }
    return '';
  }

  getLastServiceDateError(): string {
    const control = this.form.get('lastServiceDate');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('matDatepickerParse') || control.hasError('invalidDateFormat') || control.hasError('invalidDate')) return 'Last Service Date is invalid';
    if (control.hasError('matDatepickerMax')) return 'Last Service Date cannot be a future date';
    if (this.lastChangedInstallServiceField === 'lastService' && this.form.errors?.['installLastServiceRangeInvalid']) {
      return 'Last Service Date cannot be before Commissioned Date';
    }
    if (this.lastChangedServiceDateField === 'lastService' && this.form.errors?.['serviceDateRangeInvalid']) {
      return 'Last Service Date must be less than or equal to Next Service Date';
    }
    return '';
  }

  getNextServiceDateError(): string {
    const control = this.form.get('nextServiceDate');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('matDatepickerParse') || control.hasError('invalidDateFormat') || control.hasError('invalidDate')) return 'Next Service Date is invalid';
    if (this.lastChangedServiceDateField === 'nextService' && this.form.errors?.['serviceDateRangeInvalid']) {
      return 'Next Service Date must be greater than or equal to Last Service Date';
    }
    return '';
  }

  getTempReadDateError(): string {
    const control = this.form.get('tempReadDate');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('matDatepickerParse') || control.hasError('invalidDateFormat') || control.hasError('invalidDate')) return 'Last Reading Date is invalid';
    if (control.hasError('matDatepickerMax')) return 'Last Reading Date cannot be a future date';
    if (this.lastChangedInstallServiceField === 'tempRead' && this.form.errors?.['installTempReadRangeInvalid']) {
      return 'Last Reading Date cannot be before Commissioned Date';
    }
    return '';
  }

  onDescriptionKeydown(event: KeyboardEvent): void {
    const input = event.target as HTMLInputElement;
    if (event.key === ' ' && input.selectionStart === 0) {
      event.preventDefault();
    }
  }

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

  onDecimalKeydown(event: KeyboardEvent): void {
    const navKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End'];
    if (navKeys.includes(event.key)) return;
    if (event.ctrlKey || event.metaKey) return;
    const input = event.target as HTMLInputElement;
    if (event.key === '-' && input.selectionStart === 0 && !input.value.includes('-')) return;
    if (event.key === '.' && !input.value.includes('.')) return;
    if (event.key.length === 1 && !/^[0-9]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  onDecimalPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pasted = event.clipboardData?.getData('text') || '';
    const cleaned = pasted.replace(/[^0-9.\-]/g, '').substring(0, 7);
    const input = event.target as HTMLInputElement;
    input.value = cleaned;
    this.form.get('lastTemperature')?.setValue(cleaned || null);
  }

  onOptionalDateInput(event: Event, controlName: string): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value,
      this.form.get(controlName),
      this.mode === 'edit'
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

    let apiCall: Observable<SaveResult>;

    if (this.mode === 'add') {
      const payload: CreateStorageDeviceDto = {
        warehouseId: this.warehouseId,
        deviceType: raw.deviceType?.trim(),
        deviceDescription: raw.deviceDescription?.trim(),
        deviceNumber: raw.deviceNumber?.trim(),
        deviceStatus: raw.deviceStatus?.trim(),
        rackCount: raw.rackCount !== null && raw.rackCount !== '' ? Number(raw.rackCount) : 0,
        installDate: raw.installDate ? (raw.installDate as Moment).format('YYYY-MM-DD') : null,
        lastServiceDate: raw.lastServiceDate ? (raw.lastServiceDate as Moment).format('YYYY-MM-DD') : null,
        nextServiceDate: raw.nextServiceDate ? (raw.nextServiceDate as Moment).format('YYYY-MM-DD') : null,
        lastTemperature: raw.lastTemperature !== null && raw.lastTemperature !== '' ? Number(raw.lastTemperature) : null,
        tempReadDate: raw.tempReadDate ? (raw.tempReadDate as Moment).format('YYYY-MM-DD') : null,
        effectiveDate: effectiveDate.format('YYYY-MM-DD'),
        terminationDate: terminationDate ? terminationDate.format('YYYY-MM-DD') : null
      };
      apiCall = this.storageDeviceService.createStorageDevice(payload);
    } else {
      const payload: UpdateStorageDeviceDto = {
        warehouseId: this.warehouseId,
        deviceType: raw.deviceType?.trim(),
        deviceDescription: raw.deviceDescription?.trim(),
        deviceNumber: raw.deviceNumber?.trim(),
        deviceStatus: raw.deviceStatus?.trim(),
        rackCount: raw.rackCount !== null && raw.rackCount !== '' ? Number(raw.rackCount) : 0,
        installDate: raw.installDate ? (raw.installDate as Moment).format('YYYY-MM-DD') : null,
        lastServiceDate: raw.lastServiceDate ? (raw.lastServiceDate as Moment).format('YYYY-MM-DD') : null,
        nextServiceDate: raw.nextServiceDate ? (raw.nextServiceDate as Moment).format('YYYY-MM-DD') : null,
        lastTemperature: raw.lastTemperature !== null && raw.lastTemperature !== '' ? Number(raw.lastTemperature) : null,
        tempReadDate: raw.tempReadDate ? (raw.tempReadDate as Moment).format('YYYY-MM-DD') : null,
        effectiveDate: effectiveDate ? effectiveDate.format('YYYY-MM-DD') : this.data!.effectiveDate,
        terminationDate: terminationDate ? terminationDate.format('YYYY-MM-DD') : null
      };
      apiCall = this.storageDeviceService.updateStorageDevice(payload);
    }

    apiCall
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isSaving = false))
      )
      .subscribe({
        next: () => {
          const message = this.mode === 'add'
            ? 'New storage device has been created.'
            : 'Storage device updated successfully.';
          this.snackbarService.showSuccess(message);

          if (closeAfterSave) {
            this.saveSuccess.emit({ keepPanelOpen: false });
            this.closePanel.emit();
          } else {
            this.saveSuccess.emit({ keepPanelOpen: true });
            this.form.reset();
            this.form.markAsPristine();
            this.form.markAsUntouched();
            this.setupPanel();
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

  formatDate(date: string | null | undefined): string {
    if (!date) return '-';
    return date;
  }

  private noFutureDateValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const selectedDate = moment.isMoment(control.value) ? control.value : moment(control.value);
      if (!selectedDate.isValid()) return null;
      const today = this.chapterTimezoneService.getChapterLocalDate();
      if (selectedDate.format('YYYY-MM-DD') > today.format('YYYY-MM-DD')) {
        return { matDatepickerMax: { max: today, actual: selectedDate } };
      }
      return null;
    };
  }

  private notBeforeFieldValidator(compareField: string, compareLabel: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const selectedDate = moment.isMoment(control.value) ? control.value : moment(control.value);
      if (!selectedDate.isValid()) return null;
      const compareValue = this.form?.get(compareField)?.value;
      if (!compareValue) return null;
      const compareDate = moment.isMoment(compareValue) ? compareValue : moment(compareValue);
      if (!compareDate.isValid()) return null;
      if (selectedDate.format('YYYY-MM-DD') < compareDate.format('YYYY-MM-DD')) {
        return { notBeforeField: { compareField: compareLabel } };
      }
      return null;
    };
  }

  private serviceDateRangeValidator(): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const lastService = (group as FormGroup).get('lastServiceDate')?.value;
      const nextService = (group as FormGroup).get('nextServiceDate')?.value;
      if (!lastService || !nextService) return null;
      const lastDate = moment.isMoment(lastService) ? lastService : moment(lastService);
      const nextDate = moment.isMoment(nextService) ? nextService : moment(nextService);
      if (!lastDate.isValid() || !nextDate.isValid()) return null;
      if (lastDate.format('YYYY-MM-DD') > nextDate.format('YYYY-MM-DD')) {
        return { serviceDateRangeInvalid: true };
      }
      return null;
    };
  }

  private installVsServiceDateValidator(dependentField: string, errorKey: string): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const install = (group as FormGroup).get('installDate')?.value;
      const dependent = (group as FormGroup).get(dependentField)?.value;
      if (!install || !dependent) return null;
      const installDate = moment.isMoment(install) ? install : moment(install);
      const dependentDate = moment.isMoment(dependent) ? dependent : moment(dependent);
      if (!installDate.isValid() || !dependentDate.isValid()) return null;
      if (dependentDate.format('YYYY-MM-DD') < installDate.format('YYYY-MM-DD')) {
        return { [errorKey]: true };
      }
      return null;
    };
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
