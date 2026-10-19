import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
  Output,
  ChangeDetectorRef,
  inject,
  OnDestroy,
  effect,
  ViewChild,
  ElementRef,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
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
import { HeaderService } from '@shared/services/header.service';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject } from 'rxjs';
import { takeUntil, distinctUntilChanged } from 'rxjs/operators';
import moment, { Moment } from 'moment';

import {
  AttributeConfigDto,
  SaveAttributeConfigRequest,
  LabProductTypeOption,
  AttributeClassOption,
  AttributeCodeOption,
  ModifierOption,
} from '../models/attribute-configurator.model';

@Component({
  selector: 'app-add-edit-attribute-config',
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
  templateUrl: './add-edit-attribute-config.html',
  styleUrls: ['./add-edit-attribute-config.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddEditAttributeConfigComponent implements OnInit, OnChanges, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly headerService = inject(HeaderService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly dateAdapter = inject(DateAdapter<Moment>);
  private readonly destroy$ = new Subject<void>();

  @Input() mode: 'add' | 'edit' = 'add';
  @Input() data: AttributeConfigDto | null = null;
  @Input() functionName = '';
  @Input() labProductTypes: LabProductTypeOption[] = [];
  @Input() attributeClasses: AttributeClassOption[] = [];
  @Input() attributeCodes: AttributeCodeOption[] = [];
  @Input() modifiers: ModifierOption[] = [];

  @Output() save = new EventEmitter<SaveAttributeConfigRequest>();
  @Output() saveAndCreateAnother = new EventEmitter<SaveAttributeConfigRequest>();
  @Output() close = new EventEmitter<void>();

  @ViewChild('effectiveDateInput') effectiveDateInput?: ElementRef<HTMLInputElement>;
  @ViewChild('terminationDateInput') terminationDateInput?: ElementRef<HTMLInputElement>;

  form!: FormGroup;
  isSubmitting = false;
  errorMessage: string | null = null;
  productTypeDescription = '';

  get formattedModifiedDate(): string {
    if (!this.data?.modifiedDate) return '';
    const m = moment(this.data.modifiedDate);
    if (!m.isValid()) return this.data.modifiedDate;

    const datePart = m.format('DD-MMM-YYYY').toUpperCase();
    const timePart = m.format('HH:mm');
    return `${datePart}, ${timePart}`;
  }

  // Search controls for dropdowns
  labProductTypeSearchControl = new FormControl<string>('');
  attributeClassSearchControl = new FormControl<string>('');
  attributeCodeSearchControl = new FormControl<string>('');
  modifierSearchControl = new FormControl<string>('');

  // Filtered dropdown options
  filteredLabProductTypes = signal<LabProductTypeOption[]>([]);
  filteredAttributeClasses = signal<AttributeClassOption[]>([]);
  filteredAttributeCodes = signal<AttributeCodeOption[]>([]);
  filteredModifiers = signal<ModifierOption[]>([]);

  minDate: Moment;
  terminationMinDate: Moment;
  private lastChangedDateField: 'effective' | 'termination' | null = null;

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getEffectiveDateError(),
  );
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getTerminationDateError(),
  );

  private initialFormValues: {
    labProductType: string;
    attributeClass: string;
    attributeCode: string;
    modifier: string | null;
    effectiveDate: string | null;
    terminationDate: string | null;
  } | null = null;

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
    this.setupProductTypeListener();
    this.setupDropdownSearch();

    if (this.mode === 'add') {
      DateFieldValidationUtility.setupAddModeValidators(this.form, this.chapterOffset);
    }
    // Note: Not calling setupEditModeValidators because we want effective date to remain editable in edit mode
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && this.form && this.mode === 'edit' && this.data) {
      this.populateEditForm();
    }

    // Update filtered lists when input data changes
    if (changes['labProductTypes']) {
      this.filteredLabProductTypes.set([...this.labProductTypes]);
    }
    if (changes['attributeClasses']) {
      this.filteredAttributeClasses.set([...this.attributeClasses]);
    }
    if (changes['attributeCodes']) {
      this.filteredAttributeCodes.set([...this.attributeCodes]);
    }
    if (changes['modifiers']) {
      this.filteredModifiers.set([...this.modifiers]);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    if (this.mode === 'add') {
      this.form = this.fb.group(
        {
          labProductType: ['', Validators.required],
          attributeClass: [''],
          attributeCode: [''],
          modifier: [''],
          effectiveDate: [this.getChapterMinDate(), [Validators.required, DateFieldValidationUtility.effectiveDateNotPastValidator()]],
          terminationDate: [null],
        },
        {
          validators: [
          DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate'),
          this.atLeastOneAttributeValidator,
        ],
        },
      );
      this.productTypeDescription = '';
    } else {
      // Edit mode - use conditional validator that only checks if field has been changed
      this.form = this.fb.group(
        {
          labProductType: [this.data?.labProductType || '', Validators.required],
          attributeClass: [this.data?.attributeClass || ''],
          attributeCode: [this.data?.attributeCode || ''],
          modifier: [this.data?.modifier || ''],
          effectiveDate: [
            this.data?.effectiveDate ? moment(this.data.effectiveDate, 'DD-MMM-YYYY') : null,
            [Validators.required, this.editModeEffectiveDateValidator.bind(this)]
          ],
          terminationDate: [this.data?.terminationDate ? moment(this.data.terminationDate, 'DD-MMM-YYYY') : null],
        },
        {
          validators: [
            this.editModeCrossFieldDateRangeValidator.bind(this),
            this.atLeastOneAttributeValidator,
          ],
        },
      );
      this.productTypeDescription = this.data?.productDescription || '';
      this.storeInitialValues();
    }
  }

  private storeInitialValues(): void {
    if (this.mode !== 'edit' || !this.data) return;

    const formValue = this.form.getRawValue();

    // Normalize modifier: treat empty string as null
    const normalizeModifier = (val: string | null | undefined): string | null =>
      (val === '' || val === null || val === undefined) ? null : val;

    this.initialFormValues = {
      labProductType: formValue.labProductType || '',
      attributeClass: formValue.attributeClass || '',
      attributeCode: formValue.attributeCode || '',
      modifier: normalizeModifier(formValue.modifier),
      effectiveDate: formValue.effectiveDate && moment.isMoment(formValue.effectiveDate) && formValue.effectiveDate.isValid()
        ? formValue.effectiveDate.format('YYYY-MM-DD')
        : null,
      terminationDate: formValue.terminationDate && moment.isMoment(formValue.terminationDate) && formValue.terminationDate.isValid()
        ? formValue.terminationDate.format('YYYY-MM-DD')
        : null
    };
  }

  private populateEditForm(): void {
    if (!this.data) return;
    this.form.patchValue({
      labProductType: this.data.labProductType,
      attributeClass: this.data.attributeClass,
      attributeCode: this.data.attributeCode,
      modifier: this.data.modifier || '',
      effectiveDate: this.data.effectiveDate ? moment(this.data.effectiveDate, 'DD-MMM-YYYY') : null,
      terminationDate: this.data.terminationDate ? moment(this.data.terminationDate, 'DD-MMM-YYYY') : null,
    });
    this.productTypeDescription = this.data.productDescription || '';
    this.storeInitialValues();
    this.cdr.markForCheck();
  }

  private setupProductTypeListener(): void {
    this.form.get('labProductType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        const selected = this.labProductTypes.find((t) => t.productType === value);
        this.productTypeDescription = selected?.productTypeDesc || '';
        this.cdr.markForCheck();
      });
  }

  private setupDropdownSearch(): void {
    // Initialize filtered lists
    this.filteredLabProductTypes.set([...this.labProductTypes]);
    this.filteredAttributeClasses.set([...this.attributeClasses]);
    this.filteredAttributeCodes.set([...this.attributeCodes]);
    this.filteredModifiers.set([...this.modifiers]);

    // Lab Product Type search
    this.labProductTypeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search || '').toLowerCase();
        this.filteredLabProductTypes.set(!term
          ? [...this.labProductTypes]
          : this.labProductTypes.filter(type =>
              type.productType.toLowerCase().includes(term) ||
              type.productTypeDesc.toLowerCase().includes(term)
            ));
      });

    // Attribute Class search
    this.attributeClassSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search || '').toLowerCase();
        this.filteredAttributeClasses.set(!term
          ? [...this.attributeClasses]
          : this.attributeClasses.filter(cls =>
              cls.code.toLowerCase().includes(term) ||
              cls.codeDesc.toLowerCase().includes(term)
            ));
      });

    // Attribute Code search
    this.attributeCodeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search || '').toLowerCase();
        this.filteredAttributeCodes.set(!term
          ? [...this.attributeCodes]
          : this.attributeCodes.filter(code =>
              code.code.toLowerCase().includes(term) ||
              code.codeDesc.toLowerCase().includes(term)
            ));
      });

    // Modifier search
    this.modifierSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search || '').toLowerCase();
        this.filteredModifiers.set(!term
          ? [...this.modifiers]
          : this.modifiers.filter(mod =>
              mod.code.toLowerCase().includes(term) ||
              mod.codeDesc.toLowerCase().includes(term)
            ));
      });
  }

  private setupDateValidationListeners(): void {
    this.form.statusChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.clearUnchangedDateErrors();
      this.cdr.markForCheck();
    });

    // Listen to all form value changes to trigger change detection
    this.form.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.clearUnchangedDateErrors();
      this.cdr.markForCheck();
    });

    this.form
      .get('effectiveDate')
      ?.valueChanges.pipe(
        distinctUntilChanged((prev, curr) => {
          if (!prev && !curr) return true;
          if (!prev || !curr) return false;
          return moment(prev).format('YYYY-MM-DD') === moment(curr).format('YYYY-MM-DD');
        }),
        takeUntil(this.destroy$),
      )
      .subscribe(() => {
        this.lastChangedDateField = 'effective';
        this.updateTerminationMinDate();
      });

    this.form
      .get('terminationDate')
      ?.valueChanges.pipe(
        distinctUntilChanged((prev, curr) => {
          if (!prev && !curr) return true;
          if (!prev || !curr) return false;
          return moment(prev).format('YYYY-MM-DD') === moment(curr).format('YYYY-MM-DD');
        }),
        takeUntil(this.destroy$),
      )
      .subscribe(() => {
        this.lastChangedDateField = 'termination';
      });
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

  onEffectiveDateInput(event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value,
      this.form.get('effectiveDate'),
    );
  }

  onEffectiveDateChange(): void {
    this.form.get('effectiveDate')?.markAsTouched();
    this.form.get('effectiveDate')?.markAsDirty();
    this.form.updateValueAndValidity();
  }

  onTerminationDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value,
      this.form.get('terminationDate'),
      this.mode === 'edit',
    );
  }

  onTerminationDateChange(): void {
    this.form.get('terminationDate')?.markAsTouched();
    this.form.get('terminationDate')?.markAsDirty();
    this.form.updateValueAndValidity();
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
    }, 0);
  }

  private validateEffectiveDateInput(): void {
    const control = this.form.get('effectiveDate');
    const inputElement = this.effectiveDateInput?.nativeElement;
    const inputValue = inputElement?.value?.trim() || '';

    // If there's text in the input but no valid control value, mark it as invalid
    if (inputValue && !control?.value) {
      control?.setErrors({ ...control.errors, invalidDate: true });
    } else if (control?.hasError('invalidDate') && control.value) {
      // Remove the custom error if now valid
      const errors = { ...control.errors };
      delete errors['invalidDate'];
      control.setErrors(Object.keys(errors).length > 0 ? errors : null);
    }
  }

  private validateTerminationDateInput(): void {
    const control = this.form.get('terminationDate');
    const inputElement = this.terminationDateInput?.nativeElement;
    const inputValue = inputElement?.value?.trim() || '';

    // If there's text in the input but no valid control value, mark it as invalid
    if (inputValue && !control?.value) {
      control?.setErrors({ ...control.errors, invalidDate: true });
    } else if (control?.hasError('invalidDate') && control.value) {
      // Remove the custom error if now valid
      const errors = { ...control.errors };
      delete errors['invalidDate'];
      control.setErrors(Object.keys(errors).length > 0 ? errors : null);
    }
  }

  getEffectiveDateError(): string {
    const control = this.form.get('effectiveDate');
    if (!control) return '';

    // Priority 1: Custom invalidDate error from manual validation
    if (control.hasError('invalidDate')) {
      return 'Effective date is invalid';
    }

    // Priority 2: Material datepicker parse error
    if (control.hasError('matDatepickerParse')) {
      return 'Effective date is invalid';
    }

    // Priority 3: Check if there's unparseable input (text in field but no value)
    const inputElement = this.effectiveDateInput?.nativeElement;
    const inputValue = inputElement?.value?.trim() || '';
    if (inputValue && !control.value) {
      return 'Effective date is invalid';
    }

    // Priority 4: Required error (only if touched/dirty)
    if (control.hasError('required') && (control.touched || control.dirty)) {
      return 'Effective Date is required';
    }

    // Priority 5: Effective date in the past error
    if (control.hasError('effectiveDatePast')) {
      return 'Effective Date cannot be in the past';
    }

    // Priority 6: Cross-field date range validation (only if this was the last changed field)
    if (this.lastChangedDateField === 'effective' && this.form.hasError('dateRangeInvalid')) {
      return 'Effective Date must be before Termination Date';
    }

    return '';
  }

  getTerminationDateError(): string {
    const control = this.form.get('terminationDate');
    if (!control) return '';

    // Priority 1: Custom invalidDate error from manual validation
    if (control.hasError('invalidDate')) {
      return 'Termination date is invalid';
    }

    // Priority 2: Material datepicker parse error
    if (control.hasError('matDatepickerParse')) {
      return 'Termination date is invalid';
    }

    // Priority 3: Check if there's unparseable input (text in field but no value)
    const inputElement = this.terminationDateInput?.nativeElement;
    const inputValue = inputElement?.value?.trim() || '';
    if (inputValue && !control.value) {
      return 'Termination date is invalid';
    }

    // Priority 4: Required error for add mode (only if touched/dirty)
    if (this.mode === 'add' && control.hasError('terminationDateRequired') && (control.touched || control.dirty)) {
      return 'Termination Date is required';
    }

    // Priority 5: Cross-field date range validation (only if this was the last changed field)
    if (this.lastChangedDateField === 'termination' && this.form.hasError('dateRangeInvalid')) {
      return 'Termination Date must be after Effective Date';
    }

    return '';
  }

  /**
   * Check if form data has changed from initial values (for edit mode)
   */
  private hasFormChanged(): boolean {
    if (this.mode !== 'edit' || !this.initialFormValues) {
      return true; // In add mode, always allow save if valid
    }

    const formValue = this.form.getRawValue();

    // Normalize modifier: treat empty string as null
    const normalizeModifier = (val: string | null | undefined): string | null =>
      (val === '' || val === null || val === undefined) ? null : val;

    const currentValues = {
      labProductType: formValue.labProductType || '',
      attributeClass: formValue.attributeClass || '',
      attributeCode: formValue.attributeCode || '',
      modifier: normalizeModifier(formValue.modifier),
      effectiveDate: formValue.effectiveDate && moment.isMoment(formValue.effectiveDate) && formValue.effectiveDate.isValid()
        ? formValue.effectiveDate.format('YYYY-MM-DD')
        : null,
      terminationDate: formValue.terminationDate && moment.isMoment(formValue.terminationDate) && formValue.terminationDate.isValid()
        ? formValue.terminationDate.format('YYYY-MM-DD')
        : null
    };

    const labProductTypeChanged = currentValues.labProductType !== this.initialFormValues.labProductType;
    const attributeClassChanged = currentValues.attributeClass !== this.initialFormValues.attributeClass;
    const attributeCodeChanged = currentValues.attributeCode !== this.initialFormValues.attributeCode;
    const modifierChanged = currentValues.modifier !== this.initialFormValues.modifier;
    const effectiveDateChanged = currentValues.effectiveDate !== this.initialFormValues.effectiveDate;
    const terminationDateChanged = currentValues.terminationDate !== this.initialFormValues.terminationDate;

    const hasChanged = labProductTypeChanged ||
           attributeClassChanged ||
           attributeCodeChanged ||
           modifierChanged ||
           effectiveDateChanged ||
           terminationDateChanged;

    return hasChanged;
  }

  /**
   * Custom validator for effective date in edit mode
   * Only validates past dates if the field value itself has changed from the initial value
   */
  private editModeEffectiveDateValidator(control: AbstractControl): ValidationErrors | null {
    // If we don't have initial values yet, don't validate (form is still initializing)
    if (!this.initialFormValues) {
      return null;
    }

    // Get current value
    const currentValue = control.value;
    const currentFormatted = currentValue && moment.isMoment(currentValue) && currentValue.isValid()
      ? currentValue.format('YYYY-MM-DD')
      : null;

    // Compare with initial value - only validate if the effective date itself changed
    if (currentFormatted === this.initialFormValues.effectiveDate) {
      return null; // Value hasn't changed, don't validate
    }

    // Value has changed, apply the past date validator
    return DateFieldValidationUtility.effectiveDateNotPastValidator()(control);
  }

  /**
   * Clear matDatepickerMin error from effective date if value hasn't changed from initial
   * This allows existing past dates to be valid while preventing new past date selection
   */
  private clearUnchangedDateErrors(): void {
    if (this.mode !== 'edit' || !this.initialFormValues) {
      return;
    }

    const effDateControl = this.form.get('effectiveDate');
    if (!effDateControl) return;

    const currentValue = effDateControl.value;
    const currentFormatted = currentValue && moment.isMoment(currentValue) && currentValue.isValid()
      ? currentValue.format('YYYY-MM-DD')
      : null;

    // If effective date hasn't changed from initial value
    if (currentFormatted === this.initialFormValues.effectiveDate) {
      // Clear the matDatepickerMin error
      const errors = effDateControl.errors;
      if (errors?.['matDatepickerMin']) {
        delete errors['matDatepickerMin'];
        effDateControl.setErrors(Object.keys(errors).length > 0 ? errors : null);
      }
    }
  }

  /**
   * Conditional cross-field date range validator for edit mode
   * Only validates if either date field has changed from initial values
   */
  private editModeCrossFieldDateRangeValidator(group: AbstractControl): ValidationErrors | null {
    // If we don't have initial values yet, don't validate (form is still initializing)
    if (!this.initialFormValues) {
      return null;
    }

    const effDateControl = group.get('effectiveDate');
    const termDateControl = group.get('terminationDate');

    const currentEffDate = effDateControl?.value;
    const currentTermDate = termDateControl?.value;

    const currentEffFormatted = currentEffDate && moment.isMoment(currentEffDate) && currentEffDate.isValid()
      ? currentEffDate.format('YYYY-MM-DD')
      : null;
    const currentTermFormatted = currentTermDate && moment.isMoment(currentTermDate) && currentTermDate.isValid()
      ? currentTermDate.format('YYYY-MM-DD')
      : null;

    // Check if either date has changed
    const effDateChanged = currentEffFormatted !== this.initialFormValues.effectiveDate;
    const termDateChanged = currentTermFormatted !== this.initialFormValues.terminationDate;

    // Only validate if either date has changed
    if (!effDateChanged && !termDateChanged) {
      return null;
    }

    // Apply the standard cross-field validator
    return DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate')(group);
  }

  get isFormInvalid(): boolean {
    if (!this.form) return true;

    if (this.mode === 'edit') {
      const isValid = this.form.valid;
      const hasChanged = this.hasFormChanged();
      const result = !isValid || !hasChanged;

      return result;
    }

    return !this.form.valid;
  }

  onSubmit(): void {
    if (this.isSubmitting) return;

    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'terminationDate');
    this.cdr.markForCheck();

    if (this.form.errors?.['dateRangeInvalid'] && !this.lastChangedDateField) {
      this.lastChangedDateField = 'effective';
    }

    if (this.form.invalid) return;

    this.isSubmitting = true;
    this.errorMessage = null;

    const formValue = this.form.getRawValue();

    const dto: SaveAttributeConfigRequest = {
      functionName: this.functionName,
      labProductType: formValue.labProductType,
      attributeClass: formValue.attributeClass,
      attributeCode: formValue.attributeCode,
      modifier: formValue.modifier || null,
      effectiveDate: DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate) || null,
      terminationDate: DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate) || null,
    };
    this.save.emit(dto);
  }

  onSaveAndCreateAnother(): void {
    if (this.isSubmitting) return;

    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'terminationDate');
    this.cdr.markForCheck();

    if (this.form.invalid) return;

    this.isSubmitting = true;
    this.errorMessage = null;

    const formValue = this.form.getRawValue();
    const dto: SaveAttributeConfigRequest = {
      functionName: this.functionName,
      labProductType: formValue.labProductType,
      attributeClass: formValue.attributeClass,
      attributeCode: formValue.attributeCode,
      modifier: formValue.modifier || null,
      effectiveDate: DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate) || null,
      terminationDate: DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate) || null,
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
      labProductType: '',
      attributeClass: '',
      attributeCode: '',
      modifier: '',
      effectiveDate: this.getChapterMinDate(),
      terminationDate: null,
    });
    this.isSubmitting = false;
    this.errorMessage = null;
    this.lastChangedDateField = null;
    this.productTypeDescription = '';

    Object.keys(this.form.controls).forEach((key) => {
      this.form.get(key)?.markAsUntouched();
      this.form.get(key)?.markAsPristine();
    });

    this.cdr.markForCheck();
  }

  private atLeastOneAttributeValidator(group: AbstractControl): ValidationErrors | null {
    const cls = group.get('attributeClass')?.value;
    const code = group.get('attributeCode')?.value;
    const mod = group.get('modifier')?.value;
    if (!cls && !code && !mod) {
      return { atLeastOneAttribute: true };
    }
    return null;
  }

  setErrorMessage(message: string): void {
    this.errorMessage = message;
    this.isSubmitting = false;
    this.cdr.markForCheck();
  }
}
