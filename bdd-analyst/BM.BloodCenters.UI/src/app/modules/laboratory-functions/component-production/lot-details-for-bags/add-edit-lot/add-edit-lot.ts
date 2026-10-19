import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
  Output,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
  OnDestroy,
  effect,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { dateFormatValidator } from '@core/utils/date-adapter.util';
import { InputValidationUtil } from '@shared/utils/input-validation.util';
import { HeaderService } from '@shared/services/header.service';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject } from 'rxjs';
import { takeUntil, distinctUntilChanged } from 'rxjs/operators';
import moment, { Moment } from 'moment';

import {
  ValidLotDto,
  CreateValidLotDto,
  UpdateValidLotDto,
  CatalogDropdownDto,
  MasterCodeDropdownDto,
} from '../models/lot-details-for-bags.model';

@Component({
  selector: 'app-add-edit-lot',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatCheckboxModule,
    NgxMatSelectSearchModule,
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
  ],
  templateUrl: './add-edit-lot.html',
  styleUrls: ['./add-edit-lot.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddEditLotComponent implements OnInit, OnChanges, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly headerService = inject(HeaderService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly dateAdapter = inject(DateAdapter<Moment>);
  private readonly destroy$ = new Subject<void>();

  @ViewChild('receivedDateInput') receivedDateInput?: ElementRef<HTMLInputElement>;
  @ViewChild('effectiveDateInput') effectiveDateInput?: ElementRef<HTMLInputElement>;
  @ViewChild('terminationDateInput') terminationDateInput?: ElementRef<HTMLInputElement>;

  @Input() mode: 'add' | 'edit' = 'add';
  @Input() data: ValidLotDto | null = null;
  @Input() catalogs: CatalogDropdownDto[] = [];
  @Input() cmcCodes: MasterCodeDropdownDto[] = [];
  @Input() volumeTypeSets: MasterCodeDropdownDto[] = [];
  @Input() supplyCodes: MasterCodeDropdownDto[] = [];

  @Output() save = new EventEmitter<CreateValidLotDto | UpdateValidLotDto>();
  @Output() saveAndCreateAnother = new EventEmitter<CreateValidLotDto>();
  @Output() close = new EventEmitter<void>();

  form!: FormGroup;
  isSubmitting = false;
  errorMessage: string | null = null;
  private initialFormValues: {
    lotNumber: string;
    catalogNumber: string;
    vendorName: string;
    dateReceived: number | null;
    numberOfUnits: number | null;
    numberOfCartons: number | null;
    spFlag: string; // JSON string for comparison
    volumeTypeSet: string;
    supplyCode: string;
    effDate: number | null;
    termDate: number | null;
  } | null = null;

  cmcSearchCtrl = new FormControl('');
  filteredCmcCodes: MasterCodeDropdownDto[] = [];

  catalogSearchCtrl = new FormControl('');
  typeSetSearchCtrl = new FormControl('');
  supplyCodeSearchCtrl = new FormControl('');

  filteredCatalogs: CatalogDropdownDto[] = [];
  filteredVolumeTypeSets: MasterCodeDropdownDto[] = [];
  filteredSupplyCodes: MasterCodeDropdownDto[] = [];

  minDate: Moment;
  terminationMinDate: Moment;
  private lastChangedDateField: 'effective' | 'termination' | null = null;

  receivedDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getReceivedDateError(),
  );
  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getEffectiveDateError(),
  );
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getTerminationDateError(),
  );

  terminationDateFilter = (date: moment.Moment | null): boolean => {
    if (!date) return true;
    const checkDate = moment(date).startOf('day');
    const effectiveDate = this.form?.get('effDate')?.value;
    if (effectiveDate) {
      const effDay = moment(effectiveDate).startOf('day');
      if (checkDate.isBefore(effDay)) {
        return false;
      }
    }
    return true;
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

    if (this.mode === 'add') {
      DateFieldValidationUtility.setupAddModeValidators(this.form, this.chapterOffset);
    }

    // Track which date field was last changed for cross-field error display
    this.form.get('effDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'effective';
        // Force both fields to re-evaluate their error state
        setTimeout(() => {
          this.form.get('effDate')?.updateValueAndValidity({ emitEvent: false });
          this.form.get('termDate')?.updateValueAndValidity({ emitEvent: false });
          this.cdr.markForCheck();
        }, 0);
      });

    // Listen to received date changes to validate input
    this.form.get('dateReceived')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateReceivedDateInput();
      });

    // Listen to termination date changes to validate input
    this.form.get('termDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'termination';
        this.validateTerminationDateInput();
        // Force both fields to re-evaluate their error state
        setTimeout(() => {
          this.form.get('effDate')?.updateValueAndValidity({ emitEvent: false });
          this.form.get('termDate')?.updateValueAndValidity({ emitEvent: false });
          this.cdr.markForCheck();
        }, 0);
      });

    // Listen to effective date changes to validate input (only in add mode)
    if (this.mode === 'add') {
      this.form.get('effDate')?.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.validateEffectiveDateInput();
        });
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['catalogs']) {
      this.filteredCatalogs = this.catalogs;
    }
    if (changes['volumeTypeSets']) {
      this.filteredVolumeTypeSets = this.volumeTypeSets;
    }
    if (changes['supplyCodes']) {
      this.filteredSupplyCodes = this.supplyCodes;
    }
    if (changes['cmcCodes']) {
      this.filteredCmcCodes = this.cmcCodes;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearchFilters(): void {
    this.filteredCatalogs = this.catalogs;
    this.filteredVolumeTypeSets = this.volumeTypeSets;
    this.filteredSupplyCodes = this.supplyCodes;

    this.catalogSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((search) => {
        this.filteredCatalogs = this.filterList(
          this.catalogs, search, (c) => c.catalogNumber
        );
        this.cdr.markForCheck();
      });

    this.typeSetSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((search) => {
        this.filteredVolumeTypeSets = this.filterList(
          this.volumeTypeSets, search, (v) => v.code
        );
        this.cdr.markForCheck();
      });

    this.supplyCodeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((search) => {
        this.filteredSupplyCodes = this.filterList(
          this.supplyCodes, search, (s) => s.code
        );
        this.cdr.markForCheck();
      });

    this.cmcSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((search) => {
        this.filteredCmcCodes = this.filterList(
          this.cmcCodes, search, (c) => `${c.code} ${c.description}`
        );
        this.cdr.markForCheck();
      });
  }

  private filterList<T>(items: T[], search: string | null, getText: (item: T) => string): T[] {
    if (!search) return items;
    const lower = search.toLowerCase();
    return items.filter((item) => getText(item).toLowerCase().includes(lower));
  }

  private getChapterMinDate(): Moment {
    const chapterDate = DateFieldValidationUtility.getMinDate(this.chapterOffset);
    return moment.utc(chapterDate.format('YYYY-MM-DD'), 'YYYY-MM-DD');
  }

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

  private initializeForm(): void {
    if (this.mode === 'add') {
      this.form = this.fb.group(
        {
          lotNumber: ['', [Validators.required, Validators.maxLength(30), this.lotNumberValidator]],
          catalogNumber: ['', [Validators.required, Validators.maxLength(10)]],
          vendorName: ['', Validators.maxLength(50)],
          dateReceived: [null, [
            dateFormatValidator(),
            DateFieldValidationUtility.validDateValidator(),
            this.receivedDateNotFutureValidator.bind(this)
          ]],
          numberOfUnits: [null, [Validators.min(0), Validators.max(9999)]],
          numberOfCartons: [null, [Validators.min(0), Validators.max(9999)]],
          spFlag: [[]],
          volumeTypeSet: [''],
          supplyCode: [''],
          effDate: [null, [
            Validators.required,
            dateFormatValidator(),
            DateFieldValidationUtility.validDateValidator(),
            DateFieldValidationUtility.effectiveDateNotPastValidator(this.chapterOffset)
          ]],
          termDate: [null, [
            dateFormatValidator(),
            DateFieldValidationUtility.validDateValidator(),
            DateFieldValidationUtility.terminationDateNotPastValidator(this.chapterOffset)
          ]],
        },
        {
          validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effDate', 'termDate')],
        },
      );
    } else {
      // Convert comma-separated string to array for multi-select
      const spFlagArray = this.data?.spFlag
        ? this.data.spFlag.split(',').map(s => s.trim()).filter(s => s.length > 0)
        : [];

      this.form = this.fb.group(
        {
          lotNumber: [this.data?.lotNumber || '', [Validators.required, Validators.maxLength(30), this.lotNumberValidator]],
          catalogNumber: [this.data?.catalogNumber || '', [Validators.required, Validators.maxLength(10)]],
          vendorName: [this.data?.vendorName || '', Validators.maxLength(50)],
          dateReceived: [this.data?.dateReceived ? moment(this.data.dateReceived) : null, [
            dateFormatValidator(),
            DateFieldValidationUtility.validDateValidator(),
            this.receivedDateNotFutureValidator.bind(this)
          ]],
          numberOfUnits: [this.data?.numberOfUnits ?? null, [Validators.min(0), Validators.max(9999)]],
          numberOfCartons: [this.data?.numberOfCartons ?? null, [Validators.min(0), Validators.max(9999)]],
          spFlag: [spFlagArray],
          volumeTypeSet: [this.data?.volumeTypeSet || ''],
          supplyCode: [this.data?.supplyCode || ''],
          effDate: [this.data?.effDate ? moment(this.data.effDate) : null, [
            Validators.required,
            dateFormatValidator(),
            DateFieldValidationUtility.validDateValidator(),
            DateFieldValidationUtility.effectiveDateNotPastValidator(this.chapterOffset)
          ]],
          termDate: [this.data?.termDate ? moment(this.data.termDate) : null, [
            dateFormatValidator(),
            DateFieldValidationUtility.validDateValidator(),
            DateFieldValidationUtility.terminationDateNotPastValidator(this.chapterOffset)
          ]],
        },
        {
          validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effDate', 'termDate')],
        },
      );

      // Store initial values for change detection in edit mode
      this.initialFormValues = {
        lotNumber: this.data?.lotNumber || '',
        catalogNumber: this.data?.catalogNumber || '',
        vendorName: this.data?.vendorName || '',
        dateReceived: this.data?.dateReceived ? moment(this.data.dateReceived).valueOf() : null,
        numberOfUnits: this.data?.numberOfUnits ?? null,
        numberOfCartons: this.data?.numberOfCartons ?? null,
        spFlag: JSON.stringify(spFlagArray.sort()), // Use sorted JSON string for array comparison
        volumeTypeSet: this.data?.volumeTypeSet || '',
        supplyCode: this.data?.supplyCode || '',
        effDate: this.data?.effDate ? moment(this.data.effDate).valueOf() : null,
        termDate: this.data?.termDate ? moment(this.data.termDate).valueOf() : null,
      };
    }
  }

  private lotNumberValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    const pattern = /^[a-zA-Z0-9\-_]+$/;
    return pattern.test(control.value) ? null : { invalidLotNumber: true };
  }

  private receivedDateNotFutureValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null; // Received date is optional

    const selectedDate = moment.isMoment(value) ? value : moment(value);

    // First check if date is valid
    if (!selectedDate.isValid()) {
      return null; // Let validDateValidator handle this
    }

    // Use chapter date instead of local browser time
    const chapterToday = DateFieldValidationUtility.getMinDate(this.chapterOffset);

    // Compare as calendar date strings to avoid timezone issues
    if (selectedDate.format('YYYY-MM-DD') > chapterToday.format('YYYY-MM-DD')) {
      return { receivedDateFuture: true };
    }

    return null;
  }

  private setupDateValidationListeners(): void {
    this.form.statusChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.cdr.markForCheck();
    });

    this.form
      .get('dateReceived')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => {
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
        takeUntil(this.destroy$),
      )
      .subscribe(() => {
        this.updateTerminationMinDate();
        this.cdr.markForCheck();
      });
  }

  onReceivedDateBlur(): void {
    // Trigger validation after blur to ensure Material datepicker has parsed the input
    setTimeout(() => {
      const control = this.form.get('dateReceived');
      const inputElement = this.receivedDateInput?.nativeElement;
      const inputValue = inputElement?.value?.trim() || '';

      // Mark as touched to ensure error state is displayed
      control?.markAsTouched();

      // If there's input text but no parsed value, try to manually parse it
      if (inputValue && !control?.value) {
        const formats = Array.isArray(DD_MON_YYYY_FORMATS.parse.dateInput)
          ? DD_MON_YYYY_FORMATS.parse.dateInput
          : [DD_MON_YYYY_FORMATS.parse.dateInput];

        const parsed = this.dateAdapter.parse(inputValue, formats);

        if (parsed && moment.isMoment(parsed) && parsed.isValid()) {
          // Successfully parsed - set the value and update the input display
          control?.setValue(parsed);
          if (inputElement) {
            inputElement.value = this.dateAdapter.format(parsed, DD_MON_YYYY_FORMATS.display.dateInput);
          }
        }
      }

      this.validateReceivedDateInput();
      control?.updateValueAndValidity();
      this.cdr.markForCheck();
    }, 0);
  }

  onEffectiveDateBlur(): void {
    // Trigger validation after blur to ensure Material datepicker has parsed the input
    setTimeout(() => {
      const control = this.form.get('effDate');
      const inputElement = this.effectiveDateInput?.nativeElement;
      const inputValue = inputElement?.value?.trim() || '';

      // Mark as touched to ensure error state is displayed
      control?.markAsTouched();

      // If there's input text but no parsed value, try to manually parse it
      if (inputValue && !control?.value) {
        const formats = Array.isArray(DD_MON_YYYY_FORMATS.parse.dateInput)
          ? DD_MON_YYYY_FORMATS.parse.dateInput
          : [DD_MON_YYYY_FORMATS.parse.dateInput];

        const parsed = this.dateAdapter.parse(inputValue, formats);

        if (parsed && moment.isMoment(parsed) && parsed.isValid()) {
          // Successfully parsed - set the value and update the input display
          control?.setValue(parsed);
          if (inputElement) {
            inputElement.value = this.dateAdapter.format(parsed, DD_MON_YYYY_FORMATS.display.dateInput);
          }
        }
      }

      this.validateEffectiveDateInput();
      control?.updateValueAndValidity();
      this.cdr.markForCheck();
    }, 0);
  }

  onTerminationDateBlur(): void {
    // Trigger validation after blur to ensure Material datepicker has parsed the input
    setTimeout(() => {
      const control = this.form.get('termDate');
      const inputElement = this.terminationDateInput?.nativeElement;
      const inputValue = inputElement?.value?.trim() || '';

      // Mark as touched to ensure error state is displayed
      control?.markAsTouched();

      // If there's input text but no parsed value, try to manually parse it
      if (inputValue && !control?.value) {
        const formats = Array.isArray(DD_MON_YYYY_FORMATS.parse.dateInput)
          ? DD_MON_YYYY_FORMATS.parse.dateInput
          : [DD_MON_YYYY_FORMATS.parse.dateInput];

        const parsed = this.dateAdapter.parse(inputValue, formats);

        if (parsed && moment.isMoment(parsed) && parsed.isValid()) {
          // Successfully parsed - set the value and update the input display
          control?.setValue(parsed);
          if (inputElement) {
            inputElement.value = this.dateAdapter.format(parsed, DD_MON_YYYY_FORMATS.display.dateInput);
          }
        }
      }

      this.validateTerminationDateInput();
      control?.updateValueAndValidity();
      this.cdr.markForCheck();
    }, 0);
  }

  private validateReceivedDateInput(): void {
    setTimeout(() => {
      const control = this.form.get('dateReceived');
      const inputElement = this.receivedDateInput?.nativeElement;
      const inputValue = inputElement?.value?.trim() || '';

      if (inputValue && !control?.value && control) {
        // Set custom error when input has text but value is null (invalid date)
        control.setErrors({ ...control.errors, invalidDate: true });
        control.markAsDirty();
        control.markAsTouched();
        this.cdr.markForCheck();
      } else if (control?.hasError('invalidDate') && (!inputValue || control?.value)) {
        // Clear custom error if input is empty or has valid value
        const errors = { ...control.errors };
        delete errors['invalidDate'];
        control.setErrors(Object.keys(errors).length > 0 ? errors : null);
        this.cdr.markForCheck();
      }
    }, 0);
  }

  private validateEffectiveDateInput(): void {
    const control = this.form.get('effDate');
    const inputElement = this.effectiveDateInput?.nativeElement;
    const inputValue = inputElement?.value?.trim() || '';

    if (inputValue && !control?.value && control) {
      // Set custom error when input has text but value is null (invalid date)
      control.setErrors({ ...control.errors, invalidDate: true });
    } else if (control?.hasError('invalidDate') && (!inputValue || control?.value)) {
      // Clear custom error if input is empty or has valid value
      const errors = { ...control.errors };
      delete errors['invalidDate'];
      control.setErrors(Object.keys(errors).length > 0 ? errors : null);
    }
  }

  private validateTerminationDateInput(): void {
    const control = this.form.get('termDate');
    const inputElement = this.terminationDateInput?.nativeElement;
    const inputValue = inputElement?.value?.trim() || '';

    if (inputValue && !control?.value && control) {
      // Set custom error when input has text but value is null (invalid date)
      control.setErrors({ ...control.errors, invalidDate: true });
    } else if (control?.hasError('invalidDate') && (!inputValue || control?.value)) {
      // Clear custom error if input is empty or has valid value
      const errors = { ...control.errors };
      delete errors['invalidDate'];
      control.setErrors(Object.keys(errors).length > 0 ? errors : null);
    }
  }

  getReceivedDateError(): string {
    const control = this.form.get('dateReceived');
    if (!control) return '';

    /// Priority 1: Check for custom invalid date error
    if (control.hasError('invalidDate')) {
      return 'Received Date is invalid';
    }

    /// Priority 2: Check for parse errors
    if (control.hasError('matDatepickerParse')) {
      return 'Received Date is invalid';
    }

    /// Priority 3: Check other validation errors (only if touched/dirty)
    if (!(control.touched || control.dirty)) {
      return '';
    }

    if (control.hasError('receivedDateFuture')) {
      return 'Received date cannot be future date';
    }

    return '';
  }

  getEffectiveDateError(): string {
    const control = this.form.get('effDate');
    if (!control) return '';

    /// Priority 1: Check for custom invalid date error (set by validateEffectiveDateInput)
    if (control.hasError('invalidDate')) {
      return 'Effective Date is invalid';
    }

    /// Priority 2: Check for parse errors
    if (control.hasError('matDatepickerParse')) {
      return 'Effective Date is invalid';
    }

    // Check if the native input has text but control value is null (unparseable input)
    const inputElement = this.effectiveDateInput?.nativeElement;
    const hasInputValue = inputElement && inputElement.value && inputElement.value.trim() !== '';
    if (hasInputValue && !control.value && control.hasError('required')) {
      return 'Effective Date is invalid';
    }

    /// Priority 3: Check other validation errors (only if touched/dirty)
    if (!(control.touched || control.dirty)) {
      return '';
    }

    if (control.hasError('required')) {
      return 'Effective Date is required';
    }
    if (control.hasError('effectiveDatePast')) {
      return 'Effective date cannot be past date';
    }

    // Show dateRangeInvalid on effective date when it was the last changed field
    if (this.lastChangedDateField === 'effective' && this.form.errors?.['dateRangeInvalid']) {
      return 'Effective Date must be on or before Termination Date';
    }

    return '';
  }

  getTerminationDateError(): string {
    const control = this.form.get('termDate');
    if (!control) return '';

    /// Priority 1: Check for custom invalid date error (set by validateTerminationDateInput)
    if (control.hasError('invalidDate')) {
      return 'Termination Date is invalid';
    }

    /// Priority 2: Check for parse errors
    if (control.hasError('matDatepickerParse')) {
      return 'Termination Date is invalid';
    }

    // Check if the native input has text but control value is null (unparseable input)
    const inputElement = this.terminationDateInput?.nativeElement;
    const hasInputValue = inputElement && inputElement.value && inputElement.value.trim() !== '';
    if (hasInputValue && !control.value) {
      return 'Termination Date is invalid';
    }

    /// Priority 3: Check other validation errors (only if touched/dirty)
    if (!(control.touched || control.dirty)) {
      return '';
    }

    if (control.hasError('terminationDatePast')) {
      return 'Termination date cannot be past date';
    }

    if (this.lastChangedDateField !== 'effective') {
      if (control.hasError('matDatepickerMin')) {
        return 'Termination Date must be on or after Effective Date';
      }

      if (this.form.errors?.['dateRangeInvalid']) {
        return 'Termination Date must be on or after Effective Date';
      }
    }

    return '';
  }

  formatDate(date: string | null | undefined): string {
    if (!date) return '-';
    const m = moment(date);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : '-';
  }

  get isFormInvalid(): boolean {
    return !this.isFormValid;
  }

  onlyNumbers(event: KeyboardEvent): void {
    const pattern = /[0-9]/;
    if (!pattern.test(event.key) && event.key !== 'Backspace' && event.key !== 'Tab') {
      event.preventDefault();
    }
  }

  preventSpaceInput(event: KeyboardEvent): void {
    InputValidationUtil.preventSpaceInput(event);
  }

  getSelectedCmcValues(): string[] {
    const spFlagValue = this.form.get('spFlag')?.value;
    if (Array.isArray(spFlagValue)) {
      return spFlagValue;
    }
    return [];
  }

  removeCmcChip(event: Event, value: string): void {
    event.stopPropagation();
    const currentValues = this.getSelectedCmcValues();
    const updated = currentValues.filter((v) => v !== value);
    const control = this.form.get('spFlag');
    control?.setValue(updated);
    control?.markAsDirty();
    this.form.markAsDirty();
    this.cdr.markForCheck();
  }

  private hasFormChanged(): boolean {
    if (this.mode !== 'edit' || !this.initialFormValues) {
      return true; // In add mode, always allow save if valid
    }

    const currentValues = this.form.getRawValue();

    // Helper to compare moment dates
    const compareDates = (current: any, initial: number | null): boolean => {
      const currentValue = current && moment.isMoment(current) ? current.valueOf() : null;
      return currentValue !== initial;
    };

    // Compare spFlag arrays by sorting and stringifying
    const currentSpFlag = Array.isArray(currentValues.spFlag)
      ? JSON.stringify([...currentValues.spFlag].sort())
      : JSON.stringify([]);

    return (
      currentValues.lotNumber !== this.initialFormValues.lotNumber ||
      currentValues.catalogNumber !== this.initialFormValues.catalogNumber ||
      currentValues.vendorName !== this.initialFormValues.vendorName ||
      compareDates(currentValues.dateReceived, this.initialFormValues.dateReceived) ||
      currentValues.numberOfUnits !== this.initialFormValues.numberOfUnits ||
      currentValues.numberOfCartons !== this.initialFormValues.numberOfCartons ||
      currentSpFlag !== this.initialFormValues.spFlag ||
      currentValues.volumeTypeSet !== this.initialFormValues.volumeTypeSet ||
      currentValues.supplyCode !== this.initialFormValues.supplyCode ||
      compareDates(currentValues.effDate, this.initialFormValues.effDate) ||
      compareDates(currentValues.termDate, this.initialFormValues.termDate)
    );
  }

  get isFormValid(): boolean {
    if (!this.form) return false;

    const isValid = this.form.valid;

    if (this.mode === 'edit') {
      return isValid && this.hasFormChanged();
    }

    return isValid;
  }

  get title(): string {
    return this.mode === 'add' ? 'Add Lot' : 'Edit Lot';
  }

  onSubmit(): void {
    if (this.isSubmitting) return;

    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'termDate');
    this.cdr.markForCheck();

    if (this.form.errors?.['dateRangeInvalid'] && !this.lastChangedDateField) {
      this.lastChangedDateField = 'effective';
    }

    if (this.form.invalid) return;

    this.isSubmitting = true;
    this.errorMessage = null;

    const formValue = this.form.getRawValue();

    if (this.mode === 'add') {
      const dto: CreateValidLotDto = {
        lotNumber: formValue.lotNumber,
        catalogNumber: formValue.catalogNumber,
        vendorName: formValue.vendorName || null,
        dateReceived: DateFieldValidationUtility.serializeDateForApi(formValue.dateReceived) || null,
        numberOfUnits: formValue.numberOfUnits ?? null,
        numberOfCartons: formValue.numberOfCartons ?? null,
        spFlag: Array.isArray(formValue.spFlag) ? formValue.spFlag.join(',') : (formValue.spFlag || null),
        volumeTypeSet: formValue.volumeTypeSet || null,
        supplyCode: formValue.supplyCode || null,
        effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effDate) || null,
        termDate: DateFieldValidationUtility.serializeDateForApi(formValue.termDate) || null,
      };
      this.save.emit(dto);
    } else {
      const dto: UpdateValidLotDto = {
        lotNumber: formValue.lotNumber,
        catalogNumber: formValue.catalogNumber,
        bagCode: this.data?.bagCode || '',
        vendorName: formValue.vendorName || null,
        dateReceived: DateFieldValidationUtility.serializeDateForApi(formValue.dateReceived) || null,
        numberOfUnits: formValue.numberOfUnits ?? null,
        numberOfCartons: formValue.numberOfCartons ?? null,
        spFlag: Array.isArray(formValue.spFlag) ? formValue.spFlag.join(',') : (formValue.spFlag || null),
        volumeTypeSet: formValue.volumeTypeSet || null,
        supplyCode: formValue.supplyCode || null,
        effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effDate) || null,
        termDate: DateFieldValidationUtility.serializeDateForApi(formValue.termDate) || null,
      };
      this.save.emit(dto);
    }
  }

  onSaveAndCreateAnother(): void {
    if (this.isSubmitting) return;

    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'termDate');
    this.cdr.markForCheck();

    if (this.form.invalid) return;

    this.isSubmitting = true;
    this.errorMessage = null;

    const formValue = this.form.getRawValue();
    const dto: CreateValidLotDto = {
      lotNumber: formValue.lotNumber,
      catalogNumber: formValue.catalogNumber,
      vendorName: formValue.vendorName || null,
      dateReceived: DateFieldValidationUtility.serializeDateForApi(formValue.dateReceived) || null,
      numberOfUnits: formValue.numberOfUnits ?? null,
      numberOfCartons: formValue.numberOfCartons ?? null,
      spFlag: Array.isArray(formValue.spFlag) ? formValue.spFlag.join(',') : (formValue.spFlag || null),
      volumeTypeSet: formValue.volumeTypeSet || null,
      supplyCode: formValue.supplyCode || null,
      effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effDate) || null,
      termDate: DateFieldValidationUtility.serializeDateForApi(formValue.termDate) || null,
    };
    this.saveAndCreateAnother.emit(dto);
  }

  onClose(): void {
    this.close.emit();
  }

  resetSubmissionState(): void {
    this.isSubmitting = false;
    this.cdr.markForCheck();
  }

  resetForm(): void {
    this.form.reset({
      lotNumber: '',
      catalogNumber: '',
      vendorName: '',
      dateReceived: null,
      numberOfUnits: null,
      numberOfCartons: null,
      spFlag: [],
      volumeTypeSet: '',
      supplyCode: '',
      effDate: null,
      termDate: null,
    });
    this.isSubmitting = false;
    this.errorMessage = null;
    this.lastChangedDateField = null;

    Object.keys(this.form.controls).forEach((key) => {
      this.form.get(key)?.markAsUntouched();
      this.form.get(key)?.markAsPristine();
    });

    this.cdr.markForCheck();
  }

  setErrorMessage(message: string): void {
    this.errorMessage = message;
    this.isSubmitting = false;
    this.cdr.markForCheck();
  }
}
