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
import { HeaderService } from '@shared/services/header.service';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject } from 'rxjs';
import { takeUntil, distinctUntilChanged } from 'rxjs/operators';
import moment, { Moment } from 'moment';

import {
  ContainerDto,
  CreateContainerDto,
  UpdateContainerDto,
  ProductTypeDropdownDto,
  ContainerIdDropdownDto,
} from '../../models/container.model';

@Component({
  selector: 'app-add-edit-container',
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
  templateUrl: './add-edit-container.html',
  styleUrls: ['./add-edit-container.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddEditContainerComponent implements OnInit, OnChanges, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly headerService = inject(HeaderService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly dateAdapter = inject(DateAdapter<Moment>);
  private readonly destroy$ = new Subject<void>();

  @ViewChild('effectiveDateInput') effectiveDateInput?: ElementRef<HTMLInputElement>;
  @ViewChild('terminationDateInput') terminationDateInput?: ElementRef<HTMLInputElement>;

  @Input() mode: 'add' | 'edit' = 'add';
  @Input() data: ContainerDto | null = null;
  @Input() catalogNumber = '';
  @Input() productTypes: ProductTypeDropdownDto[] = [];
  @Input() containerIds: ContainerIdDropdownDto[] = [];

  @Output() save = new EventEmitter<CreateContainerDto | UpdateContainerDto>();
  @Output() saveAndCreateAnother = new EventEmitter<CreateContainerDto>();
  @Output() close = new EventEmitter<void>();

  form!: FormGroup;
  isSubmitting = false;
  errorMessage: string | null = null;

  private lastChangedDateField: 'effective' | 'termination' | null = null;
  private initialFormValues: {
    containerId: string | null;
    ilfFlag: boolean;
    productType: string;
    otherProductTypes: string;
    effectiveDate: number | null;
    terminationDate: number | null;
  } | null = null;

  productTypeSearchCtrl = new FormControl('');
  filteredProductTypes: ProductTypeDropdownDto[] = [];

  containerIdSearchCtrl = new FormControl('');
  filteredContainerIds: ContainerIdDropdownDto[] = [];

  ilfFlagOptions = [
    { value: true, label: 'Yes' },
    { value: false, label: 'No' },
  ];

  minDate: Moment;
  terminationMinDate: Moment;

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getEffectiveDateError(),
  );
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getTerminationDateError(),
  );

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

    effect(() => {
      this.minDate = this.getChapterMinDate();
      this.updateTerminationMinDate();
    });
  }

  ngOnInit(): void {
    this.initializeForm();
    this.setupDateValidationListeners();
    this.setupSearchFilters();

    // Track which date field was last changed for cross-field error display
    this.form.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'effective';
        // Force both fields to re-evaluate their error state
        setTimeout(() => {
          this.form.get('effectiveDate')?.updateValueAndValidity({ emitEvent: false });
          this.form.get('terminationDate')?.updateValueAndValidity({ emitEvent: false });
          this.cdr.markForCheck();
        }, 0);
      });

    // Listen to termination date changes to validate input
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

    // Listen to effective date changes to validate input (only in add mode)
    if (this.mode === 'add') {
      this.form.get('effectiveDate')?.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.validateEffectiveDateInput();
        });
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['productTypes']) {
      this.filteredProductTypes = this.productTypes;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearchFilters(): void {
    this.filteredProductTypes = this.productTypes;
    this.filteredContainerIds = this.containerIds;

    this.productTypeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((search) => {
        this.filteredProductTypes = this.filterProductTypes(search);
        this.cdr.markForCheck();
      });

    this.containerIdSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((search) => {
        this.filteredContainerIds = this.filterContainerIds(search);
        this.cdr.markForCheck();
      });
  }

  private filterProductTypes(search: string | null): ProductTypeDropdownDto[] {
    if (!search) return this.productTypes;
    const lower = search.toLowerCase();
    return this.productTypes.filter((p) =>
      p.code.toLowerCase().includes(lower) ||
      p.description.toLowerCase().includes(lower)
    );
  }

  private filterContainerIds(search: string | null): ContainerIdDropdownDto[] {
    if (!search) return this.containerIds;
    const lower = search.toLowerCase();
    return this.containerIds.filter((c) =>
      c.code.toLowerCase().includes(lower) ||
      c.description.toLowerCase().includes(lower)
    );
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
          catalogNumber: [{ value: '-', disabled: true }],
          containerId: [null, [Validators.required, Validators.min(0), Validators.max(99999)]],
          ilfFlag: [null, [Validators.required]],
          productType: ['', [Validators.required, Validators.maxLength(5)]],
          otherProductTypes: ['', [Validators.maxLength(250)]],
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

      // Listen to container ID changes to update catalog number
      this.form.get('containerId')?.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe((containerId) => {
          this.updateCatalogNumber(containerId);
        });
    } else {
      this.form = this.fb.group(
        {
          catalogNumber: [{ value: this.data?.catalogNumber || this.catalogNumber, disabled: true }],
          containerId: [this.data?.containerId || null, [Validators.required, Validators.min(0), Validators.max(99999)]],
          ilfFlag: [this.data?.inlineFilterFlag === 'Y', [Validators.required]],
          productType: [this.data?.productType || '', [Validators.required, Validators.maxLength(5)]],
          otherProductTypes: [this.data?.subProdTypes || '', [Validators.maxLength(250)]],
          effectiveDate: [this.data?.effDate ? moment(this.data.effDate) : null, [
            Validators.required,
            dateFormatValidator(),
            DateFieldValidationUtility.validDateValidator(),
            DateFieldValidationUtility.effectiveDateNotPastValidator(this.chapterOffset)
          ]],
          terminationDate: [this.data?.termDate ? moment(this.data.termDate) : null, [
            dateFormatValidator(),
            DateFieldValidationUtility.validDateValidator(),
            DateFieldValidationUtility.terminationDateNotPastValidator(this.chapterOffset)
          ]],
        },
        {
          validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate')],
        },
      );

      // Store initial values for change detection in edit mode
      this.initialFormValues = {
        containerId: this.data?.containerId || null,
        ilfFlag: this.data?.inlineFilterFlag === 'Y',
        productType: this.data?.productType || '',
        otherProductTypes: this.data?.subProdTypes || '',
        effectiveDate: this.data?.effDate ? moment(this.data.effDate).valueOf() : null,
        terminationDate: this.data?.termDate ? moment(this.data.termDate).valueOf() : null,
      };

      // Listen to container ID changes to update catalog number in edit mode too
      this.form.get('containerId')?.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe((containerId) => {
          this.updateCatalogNumber(containerId);
        });
    }
  }

  private updateCatalogNumber(containerId: number | null): void {
    if (!containerId) {
      return;
    }

    const selectedContainer = this.containerIds.find(c => c.code === String(containerId));
    if (selectedContainer) {
      const catalogValue = `${selectedContainer.code}${this.catalogNumber}`;
      this.form.get('catalogNumber')?.setValue(catalogValue);
    } else {
      this.form.get('catalogNumber')?.setValue('-');
    }
    this.cdr.markForCheck();
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
      const control = this.form.get('terminationDate');
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

  private validateEffectiveDateInput(): void {
    const control = this.form.get('effectiveDate');
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
    const control = this.form.get('terminationDate');
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

  getEffectiveDateError(): string {
    const control = this.form.get('effectiveDate');
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
    const control = this.form.get('terminationDate');
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

    return (
      currentValues.containerId !== this.initialFormValues.containerId ||
      currentValues.ilfFlag !== this.initialFormValues.ilfFlag ||
      currentValues.productType !== this.initialFormValues.productType ||
      currentValues.otherProductTypes !== this.initialFormValues.otherProductTypes ||
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
      const payload: CreateContainerDto = {
        baseCatalogNo: this.catalogNumber,
        containerId: formValue.containerId,
        inlineFilterFlag: formValue.ilfFlag ? 'Y' : 'N',
        productType: formValue.productType,
        subProdTypes: formValue.otherProductTypes || null,
        effDate: formatDate(formValue.effectiveDate)!,
        termDate: formatDate(formValue.terminationDate),
      };

      if (createAnother) {
        this.saveAndCreateAnother.emit(payload);
      } else {
        this.save.emit(payload);
      }
    } else {
      const payload: UpdateContainerDto = {
        catalogNumber: `${formValue.containerId}${this.catalogNumber}`,
        containerId: formValue.containerId,
        inlineFilterFlag: formValue.ilfFlag ? 'Y' : 'N',
        productType: formValue.productType,
        subProdTypes: formValue.otherProductTypes || null,
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
  }

  resetForm(): void {
    this.form.reset({
      catalogNumber: this.catalogNumber,
      containerId: null,
      ilfFlag: null,
      productType: '',
      otherProductTypes: '',
      effectiveDate: null,
      terminationDate: null,
    });
    this.errorMessage = null;
    this.isSubmitting = false;
    this.productTypeSearchCtrl.setValue('');
  }

  get title(): string {
    return this.mode === 'add' ? 'Add New Container' : 'Edit Container';
  }
}
