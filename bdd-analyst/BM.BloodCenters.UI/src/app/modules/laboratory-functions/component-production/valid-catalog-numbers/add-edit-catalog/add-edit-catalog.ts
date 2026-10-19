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
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
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
  ValidCatalogDto,
  CreateValidCatalogDto,
  UpdateValidCatalogDto,
  ManufacturerDropdownDto,
  AnticoagulantDropdownDto,
  AdditiveDropdownDto,
} from '../models/valid-catalog-numbers.model';

@Component({
  selector: 'app-add-edit-catalog',
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
    NgxMatSelectSearchModule,
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
  ],
  templateUrl: './add-edit-catalog.html',
  styleUrls: ['./add-edit-catalog.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddEditCatalogComponent implements OnInit, OnChanges, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly headerService = inject(HeaderService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly dateAdapter = inject(DateAdapter<Moment>);
  private readonly destroy$ = new Subject<void>();

  @ViewChild('effectiveDateInput') effectiveDateInput?: ElementRef<HTMLInputElement>;
  @ViewChild('terminationDateInput') terminationDateInput?: ElementRef<HTMLInputElement>;

  @Input() mode: 'add' | 'edit' = 'add';
  @Input() data: ValidCatalogDto | null = null;
  @Input() manufacturers: ManufacturerDropdownDto[] = [];
  @Input() anticoagulants: AnticoagulantDropdownDto[] = [];
  @Input() additives: AdditiveDropdownDto[] = [];

  @Output() save = new EventEmitter<CreateValidCatalogDto | UpdateValidCatalogDto>();
  @Output() saveAndCreateAnother = new EventEmitter<CreateValidCatalogDto>();
  @Output() close = new EventEmitter<void>();

  form!: FormGroup;
  isSubmitting = false;
  errorMessage: string | null = null;

  private lastChangedDateField: 'effective' | 'termination' | null = null;
  private initialFormValues: {
    manufacturer: string;
    catalogNumber: string;
    numberOfBags: number | null;
    numberOfProducts: number | null;
    bagVolume: number | null;
    anticoagulant: string;
    additiveSolution: string;
    instSpecificCode: string;
    effectiveDate: number | null;
    terminationDate: number | null;
  } | null = null;

  manufacturerSearchCtrl = new FormControl('');
  filteredManufacturers: ManufacturerDropdownDto[] = [];

  anticoagulantSearchCtrl = new FormControl('');
  filteredAnticoagulants: AnticoagulantDropdownDto[] = [];

  additiveSearchCtrl = new FormControl('');
  filteredAdditives: AdditiveDropdownDto[] = [];

  minDate: Moment;
  terminationMinDate: Moment;
  effectiveDateMinDate: Moment;

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getEffectiveDateError(),
  );
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getTerminationDateError(),
  );

  effectiveDateFilter = (date: moment.Moment | null): boolean => {
    if (!date) return true;
    const checkDate = moment(date).startOf('day');

    // Get fresh chapter min date
    const chapterDate = DateFieldValidationUtility.getMinDate(this.chapterOffset);
    const chapterMinDate = moment.utc(chapterDate.format('YYYY-MM-DD'), 'YYYY-MM-DD').startOf('day');

    // In edit mode, allow the original effective date even if it's in the past
    if (this.mode === 'edit' && this.data?.effDate) {
      const originalDate = moment(this.data.effDate).startOf('day');
      if (checkDate.isSame(originalDate, 'day')) {
        return true;
      }
    }

    // Otherwise, must be >= chapter min date (or same day)
    return checkDate.isSameOrAfter(chapterMinDate, 'day');
  };

  terminationDateFilter = (date: moment.Moment | null): boolean => {
    if (!date) return true;
    const checkDate = moment(date).startOf('day');
    const effectiveDate = this.form?.get('effectiveDate')?.value;
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
    this.effectiveDateMinDate = this.minDate;

    effect(() => {
      this.minDate = this.getChapterMinDate();
      this.updateTerminationMinDate();
      this.updateEffectiveDateMinDate();
    });
  }

  ngOnInit(): void {
    this.initializeForm();
    this.updateEffectiveDateMinDate();
    this.setupDateValidationListeners();
    this.setupSearchFilters();

    if (this.mode === 'add') {
      DateFieldValidationUtility.setupAddModeValidators(this.form, this.chapterOffset);
    }

    // Track which date field was last changed for cross-field error display
    this.form.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'effective';
        if (this.mode === 'add') {
          this.validateEffectiveDateInput();
        }
        // Force both fields to re-evaluate their error state
        setTimeout(() => {
          this.form.get('effectiveDate')?.updateValueAndValidity({ emitEvent: false });
          this.form.get('terminationDate')?.updateValueAndValidity({ emitEvent: false });
          this.cdr.markForCheck();
        }, 0);
      });

    this.form.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'termination';
        this.validateTerminationDateInput();
        // Force both fields to re-evaluate their error state
        setTimeout(() => {
          this.form.get('effectiveDate')?.updateValueAndValidity({ emitEvent: false });
          this.form.get('terminationDate')?.updateValueAndValidity({ emitEvent: false });
          this.cdr.markForCheck();
        }, 0);
      });

    this.form.get('manufacturer')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((mfrCode) => {
        const manufacturer = this.manufacturers.find(m => m.code === mfrCode);
        if (manufacturer) {
          this.form.patchValue({ manufacturerDescription: manufacturer.description }, { emitEvent: false });
        }
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['manufacturers']) {
      this.filteredManufacturers = this.manufacturers;
    }
    if (changes['anticoagulants']) {
      this.filteredAnticoagulants = this.anticoagulants;
    }
    if (changes['additives']) {
      this.filteredAdditives = this.additives;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearchFilters(): void {
    this.filteredManufacturers = this.manufacturers;
    this.filteredAnticoagulants = this.anticoagulants;
    this.filteredAdditives = this.additives;

    this.manufacturerSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((search) => {
        this.filteredManufacturers = this.filterManufacturers(search);
        this.cdr.markForCheck();
      });

    this.anticoagulantSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((search) => {
        this.filteredAnticoagulants = this.filterAnticoagulants(search);
        this.cdr.markForCheck();
      });

    this.additiveSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((search) => {
        this.filteredAdditives = this.filterAdditives(search);
        this.cdr.markForCheck();
      });
  }

  private filterManufacturers(search: string | null): ManufacturerDropdownDto[] {
    if (!search) return this.manufacturers;
    const lower = search.toLowerCase();
    return this.manufacturers.filter((m) =>
      m.code.toLowerCase().includes(lower) ||
      m.description.toLowerCase().includes(lower)
    );
  }

  private filterAnticoagulants(search: string | null): AnticoagulantDropdownDto[] {
    if (!search) return this.anticoagulants;
    const lower = search.toLowerCase();
    return this.anticoagulants.filter((a) =>
      a.code.toLowerCase().includes(lower) ||
      a.description.toLowerCase().includes(lower)
    );
  }

  private filterAdditives(search: string | null): AdditiveDropdownDto[] {
    if (!search) return this.additives;
    const lower = search.toLowerCase();
    return this.additives.filter((a) =>
      a.code.toLowerCase().includes(lower) ||
      a.description.toLowerCase().includes(lower)
    );
  }

  private getChapterMinDate(): Moment {
    const chapterDate = DateFieldValidationUtility.getMinDate(this.chapterOffset);
    return moment.utc(chapterDate.format('YYYY-MM-DD'), 'YYYY-MM-DD');
  }

  private updateEffectiveDateMinDate(): void {
    this.effectiveDateMinDate = this.minDate;
  }

  private allowOriginalDateValidator(originalDate: string | null) {
    return (control: any) => {
      const value = control.value;
      if (!value) return null;

      const currentDate = moment.isMoment(value) ? value : moment(value);
      if (!currentDate.isValid()) return null;

      if (originalDate && moment(originalDate).isSame(currentDate, 'day')) {
        return null;
      }

      if (control.errors?.['matDatepickerMin']) {
        return { matDatepickerMin: control.errors['matDatepickerMin'] };
      }

      return null;
    };
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
          manufacturer: ['', [Validators.required]],
          manufacturerDescription: [{ value: '', disabled: true }],
          catalogNumber: ['', [Validators.required, Validators.maxLength(9)]],
          numberOfBags: [null, [Validators.required, Validators.min(0), Validators.max(99999)]],
          numberOfProducts: [null, [Validators.required, Validators.min(0), Validators.max(99999)]],
          bagVolume: [null, [Validators.min(0), Validators.max(999.99)]],
          anticoagulant: [''],
          additiveSolution: [''],
          instSpecificCode: [''],
          effectiveDate: [null, [
            Validators.required,
            dateFormatValidator(),
            DateFieldValidationUtility.validDateValidator(),
            DateFieldValidationUtility.effectiveDateNotPastValidator(this.chapterOffset)
          ]],
          terminationDate: [null, [
            dateFormatValidator(),
            DateFieldValidationUtility.validDateValidator(),
            DateFieldValidationUtility.terminationDateNotPastValidator(this.chapterOffset)
          ]],
        },
        {
          validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate')],
        },
      );
    } else {
      this.form = this.fb.group(
        {
          manufacturer: [this.data?.manufacturerCode || '', [Validators.required]],
          manufacturerDescription: [{ value: this.data?.manufacturer || '', disabled: true }],
          catalogNumber: [this.data?.catalogNumber || '', [Validators.required, Validators.maxLength(9)]],
          numberOfBags: [this.data?.totalBagsInSet ?? null, [Validators.required, Validators.min(0), Validators.max(99999)]],
          numberOfProducts: [this.data?.numberOfProds ?? null, [Validators.required, Validators.min(0), Validators.max(99999)]],
          bagVolume: [this.data?.bagVolume ?? null, [Validators.min(0), Validators.max(999.99)]],
          anticoagulant: [this.data?.anticoagulant || ''],
          additiveSolution: [this.data?.additiveSolution || ''],
          instSpecificCode: [this.data?.instSpecificCode || ''],
          effectiveDate: [this.data?.effDate ? moment(this.data.effDate) : null, [
            Validators.required,
            dateFormatValidator(),
            DateFieldValidationUtility.validDateValidator()
          ]],
          terminationDate: [this.data?.termDate ? moment(this.data.termDate) : null, [
            dateFormatValidator(),
            DateFieldValidationUtility.validDateValidator()
          ]],
        },
        {
          validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate')],
        },
      );

      this.initialFormValues = {
        manufacturer: this.data?.manufacturerCode || '',
        catalogNumber: this.data?.catalogNumber || '',
        numberOfBags: this.data?.totalBagsInSet ?? null,
        numberOfProducts: this.data?.numberOfProds ?? null,
        bagVolume: this.data?.bagVolume ?? null,
        anticoagulant: this.data?.anticoagulant || '',
        additiveSolution: this.data?.additiveSolution || '',
        instSpecificCode: this.data?.instSpecificCode || '',
        effectiveDate: this.data?.effDate ? moment(this.data.effDate).valueOf() : null,
        terminationDate: this.data?.termDate ? moment(this.data.termDate).valueOf() : null,
      };
    }
  }

  private setupDateValidationListeners(): void {
    this.form.statusChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.cdr.markForCheck();
    });

    this.form
      .get('effectiveDate')
      ?.valueChanges.pipe(
        distinctUntilChanged((prev, curr) => {
          if (!prev && !curr) return true;
          if (!prev || !curr) return false;
          if (moment.isMoment(prev) && moment.isMoment(curr)) {
            return prev.isSame(curr, 'day');
          }
          return false;
        }),
        takeUntil(this.destroy$),
      )
      .subscribe(() => {
        this.updateTerminationMinDate();
        this.cdr.markForCheck();
      });
  }

  onEffectiveDateBlur(): void {
    // Trigger validation after blur to ensure Material datepicker has parsed the input
    setTimeout(() => {
      const control = this.form.get('effectiveDate');
      const inputElement = this.effectiveDateInput?.nativeElement;
      const inputValue = inputElement?.value?.trim() || '';

      control?.markAsTouched();

      if (inputValue && !control?.value) {
        const formats = Array.isArray(DD_MON_YYYY_FORMATS.parse.dateInput)
          ? DD_MON_YYYY_FORMATS.parse.dateInput
          : [DD_MON_YYYY_FORMATS.parse.dateInput];

        const parsed = this.dateAdapter.parse(inputValue, formats);

        if (parsed && moment.isMoment(parsed) && parsed.isValid()) {
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
      const control = this.form.get('terminationDate');
      const inputElement = this.terminationDateInput?.nativeElement;
      const inputValue = inputElement?.value?.trim() || '';

      control?.markAsTouched();

      if (inputValue && !control?.value) {
        const formats = Array.isArray(DD_MON_YYYY_FORMATS.parse.dateInput)
          ? DD_MON_YYYY_FORMATS.parse.dateInput
          : [DD_MON_YYYY_FORMATS.parse.dateInput];

        const parsed = this.dateAdapter.parse(inputValue, formats);

        if (parsed && moment.isMoment(parsed) && parsed.isValid()) {
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

  private validateEffectiveDateInput(): void {
    const control = this.form.get('effectiveDate');
    const inputElement = this.effectiveDateInput?.nativeElement;
    const inputValue = inputElement?.value?.trim() || '';

    if (inputValue && !control?.value && control) {
      control.setErrors({ ...control.errors, invalidDate: true });
    } else if (control?.hasError('invalidDate') && (!inputValue || control?.value)) {
      const errors = { ...control.errors };
      delete errors['invalidDate'];
      control.setErrors(Object.keys(errors).length > 0 ? errors : null);
    }
  }

  private validateTerminationDateInput(): void {
    const control = this.form.get('terminationDate');
    const inputElement = this.terminationDateInput?.nativeElement;
    const inputValue = inputElement?.value?.trim() || '';

    if (inputValue && !control?.value && control) {
      control.setErrors({ ...control.errors, invalidDate: true });
    } else if (control?.hasError('invalidDate') && (!inputValue || control?.value)) {
      const errors = { ...control.errors };
      delete errors['invalidDate'];
      control.setErrors(Object.keys(errors).length > 0 ? errors : null);
    }
  }

  getEffectiveDateError(): string {
    const control = this.form.get('effectiveDate');
    if (!control) return '';

    if (control.hasError('invalidDate')) {
      return 'Effective Date is invalid';
    }

    if (control.hasError('matDatepickerParse')) {
      return 'Effective Date is invalid';
    }

    const inputElement = this.effectiveDateInput?.nativeElement;
    const hasInputValue = inputElement && inputElement.value && inputElement.value.trim() !== '';
    if (hasInputValue && !control.value && control.hasError('required')) {
      return 'Effective Date is invalid';
    }

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
    const control = this.form.get('terminationDate');
    if (!control) return '';

    if (control.hasError('invalidDate')) {
      return 'Termination Date is invalid';
    }

    if (control.hasError('matDatepickerParse')) {
      return 'Termination Date is invalid';
    }

    const inputElement = this.terminationDateInput?.nativeElement;
    const hasInputValue = inputElement && inputElement.value && inputElement.value.trim() !== '';
    if (hasInputValue && !control.value) {
      return 'Termination Date is invalid';
    }

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

  private hasFormChanged(): boolean {
    if (this.mode !== 'edit' || !this.initialFormValues) {
      return true;
    }

    const currentValues = this.form.getRawValue();

    const compareDates = (current: any, initial: number | null): boolean => {
      const currentValue = current && moment.isMoment(current) ? current.valueOf() : null;
      return currentValue !== initial;
    };

    return (
      currentValues.manufacturer !== this.initialFormValues.manufacturer ||
      currentValues.catalogNumber !== this.initialFormValues.catalogNumber ||
      currentValues.numberOfBags !== this.initialFormValues.numberOfBags ||
      currentValues.numberOfProducts !== this.initialFormValues.numberOfProducts ||
      currentValues.bagVolume !== this.initialFormValues.bagVolume ||
      currentValues.anticoagulant !== this.initialFormValues.anticoagulant ||
      currentValues.additiveSolution !== this.initialFormValues.additiveSolution ||
      currentValues.instSpecificCode !== this.initialFormValues.instSpecificCode ||
      compareDates(currentValues.effectiveDate, this.initialFormValues.effectiveDate) ||
      compareDates(currentValues.terminationDate, this.initialFormValues.terminationDate)
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

  onSubmit(createAnother = false): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;

    const formValue = this.form.getRawValue();

    const formatDate = (value: unknown): string | null => {
      if (!value) return null;
      if (moment.isMoment(value)) {
        return value.format('YYYY-MM-DD');
      }
      if (value instanceof Date) {
        return moment(value).format('YYYY-MM-DD');
      }
      return null;
    };

    if (this.mode === 'add') {
      const payload: CreateValidCatalogDto = {
        manufacturerCode: formValue.manufacturer,
        catalogNumber: formValue.catalogNumber,
        totalBagsInSet: formValue.numberOfBags ?? null,
        numberOfProds: formValue.numberOfProducts ?? null,
        bagType: formValue.bagType || '',
        bagVolume: formValue.bagVolume,
        weightOfBag: null,
        collectionVolume: null,
        anticoagulant: formValue.anticoagulant || null,
        additiveSolution: formValue.additiveSolution || null,
        instSpecificCode: formValue.instSpecificCode || null,
        bagStorageRestriction: null,
        effDate: formatDate(formValue.effectiveDate)!,
        termDate: formatDate(formValue.terminationDate),
      };

      if (createAnother) {
        this.saveAndCreateAnother.emit(payload);
      } else {
        this.save.emit(payload);
      }
    } else {
      const selectedManufacturer = this.manufacturers.find(
        m => m.code === formValue.manufacturer
      );

      const payload: UpdateValidCatalogDto = {
        originalCatalogNumber: this.data?.catalogNumber || '',
        catalogNumber: formValue.catalogNumber,
        manufacturerCode: formValue.manufacturer,
        manufacturer: selectedManufacturer?.description || formValue.manufacturerDescription || '',
        totalBagsInSet: formValue.numberOfBags ?? null,
        numberOfProds: formValue.numberOfProducts ?? null,
        bagType: formValue.bagType || '',
        bagVolume: formValue.bagVolume,
        weightOfBag: null,
        collectionVolume: null,
        anticoagulant: formValue.anticoagulant || null,
        additiveSolution: formValue.additiveSolution || null,
        instSpecificCode: formValue.instSpecificCode || null,
        bagStorageRestriction: null,
        effDate: formatDate(formValue.effectiveDate)!,
        termDate: formatDate(formValue.terminationDate),
      };

      this.save.emit(payload);
    }
  }

  onCancel(): void {
    this.close.emit();
  }

  setErrorMessage(message: string): void {
    this.errorMessage = message;
    this.isSubmitting = false;
    this.cdr.markForCheck();

    setTimeout(() => {
      const contentElement = document.querySelector('.side-drawer__content');
      if (contentElement) {
        contentElement.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 100);
  }

  resetForm(): void {
    this.form.reset({
      manufacturer: '',
      manufacturerDescription: '',
      catalogNumber: '',
      numberOfBags: null,
      numberOfProducts: null,
      bagVolume: null,
      anticoagulant: '',
      additiveSolution: '',
      instSpecificCode: '',
      effectiveDate: null,
      terminationDate: null,
    });
    this.errorMessage = null;
    this.isSubmitting = false;
    this.manufacturerSearchCtrl.setValue('');
  }

  onNumericKeyDown(event: KeyboardEvent): void {
    if (['Backspace', 'Delete', 'Tab', 'Escape', 'Enter'].indexOf(event.key) !== -1 ||
        (event.key === 'a' && event.ctrlKey === true) ||
        (event.key === 'c' && event.ctrlKey === true) ||
        (event.key === 'v' && event.ctrlKey === true) ||
        (event.key === 'x' && event.ctrlKey === true) ||
        (event.key === 'Home' || event.key === 'End' || event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
      return;
    }
    if (event.key === '.' || event.key === '-' || event.key === 'e' || event.key === 'E' ||
        (event.key < '0' || event.key > '9')) {
      event.preventDefault();
    }
  }

  onDecimalKeyDown(event: KeyboardEvent): void {
    if (['Backspace', 'Delete', 'Tab', 'Escape', 'Enter'].indexOf(event.key) !== -1 ||
        (event.key === 'a' && event.ctrlKey === true) ||
        (event.key === 'c' && event.ctrlKey === true) ||
        (event.key === 'v' && event.ctrlKey === true) ||
        (event.key === 'x' && event.ctrlKey === true) ||
        (event.key === 'Home' || event.key === 'End' || event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
      return;
    }
    const input = event.target as HTMLInputElement;
    const value = input.value;
    if (event.key === '.' && value.indexOf('.') === -1) {
      return;
    }
    if (event.key === '-' || event.key === 'e' || event.key === 'E' ||
        (event.key !== '.' && (event.key < '0' || event.key > '9'))) {
      event.preventDefault();
    }
  }

  preventSpaceInput(event: KeyboardEvent): void {
    InputValidationUtil.preventSpaceInput(event);
  }

  onNumberOfBagsInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value;
    value = value.replace(/[^0-9]/g, '');
    if (input.value !== value) {
      input.value = value;
    }
    const numValue = value === '' ? null : parseInt(value, 10);
    this.form.get('numberOfBags')?.setValue(numValue, { emitEvent: false });
  }

  onNumberOfProductsInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value;
    value = value.replace(/[^0-9]/g, '');
    if (input.value !== value) {
      input.value = value;
    }
    const numValue = value === '' ? null : parseInt(value, 10);
    this.form.get('numberOfProducts')?.setValue(numValue, { emitEvent: false });
  }

  onBagVolumeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value;
    const parts = value.split('.');
    if (parts.length > 2) {
      value = parts[0] + '.' + parts.slice(1).join('');
    }
    value = value.replace(/[^0-9.]/g, '');
    if (parts.length === 2 && parts[1].length > 2) {
      value = parts[0] + '.' + parts[1].substring(0, 2);
    }
    if (input.value !== value) {
      input.value = value;
    }
    const numValue = value === '' ? null : parseFloat(value);
    this.form.get('bagVolume')?.setValue(numValue, { emitEvent: false });
  }

  get title(): string {
    return this.mode === 'add' ? 'Add New Catalog' : 'Edit Catalog';
  }
}
