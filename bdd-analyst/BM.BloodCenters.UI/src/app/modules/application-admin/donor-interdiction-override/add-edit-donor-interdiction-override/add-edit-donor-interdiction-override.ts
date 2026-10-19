import { Component, EventEmitter, Input, OnInit, Output, OnDestroy, OnChanges, SimpleChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { noWhitespaceOnlyValidator } from '@shared/validators/input.validators';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { DonorInterdictionOverrideService } from '../services/donor-interdiction-override.service';
import { LoginService } from '@shared/services/login.service';
import { HeaderService } from '@shared/services/header.service';
import { dateFormatValidator } from 'src/app/core/utils/date-adapter.util';
import moment from 'moment';
import { Subject, takeUntil, finalize, debounceTime, distinctUntilChanged } from 'rxjs';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import {
  DonorInterdictionOverrideModel,
  DonorInterdictionOverrideCreateDto,
  DonorInterdictionOverrideUpdateDto,
  getInterTypeDisplay
} from '../models/donor-interdiction-override.model';

export interface DonorInterdictionOverrideFormData {
  donorDecisionCode: string;
  productType: string;
  attributeGroup: string;
  attributeCode: string;
  interCode: string;
  interType: string;
  overrideDesc: string;
  effDate: Date;
  termDate?: Date | null;
}

@Component({
  selector: 'app-add-edit-donor-interdiction-override',
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
  templateUrl: './add-edit-donor-interdiction-override.html',
  styleUrls: ['./add-edit-donor-interdiction-override.scss']
})
export class AddEditDonorInterdictionOverride implements OnInit, OnChanges, OnDestroy {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() data: DonorInterdictionOverrideModel | null = null;
  @Output() closePanel = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<DonorInterdictionOverrideFormData>();
  @Output() modeChange = new EventEmitter<'add' | 'edit'>();

  /** Tracks which date field was last changed — cross-field error shows only on that field */
  private lastChangedDateField: 'effective' | 'termination' | null = null;

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEffDateError());
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTermDateError());

  /** Termination date filter: not before today and not before Effective Date */
  terminationDateFilter = (date: moment.Moment | null): boolean => {
    if (!date) return true;

    const checkDate = moment(date).startOf('day');
    const today = this.minDate.startOf('day');

    // Prevent dates before today
    if (checkDate.isBefore(today)) {
      return false;
    }

    // Prevent dates before effective date
    const eff = this.form?.get('effDate')?.value;
    if (eff) {
      const effDay = moment(eff).startOf('day');
      if (checkDate.isBefore(effDay)) {
        return false;
      }
    }

    return true;
  };

  form: FormGroup;
  panelTitle: string = '';
  lastModified: string = '';

  // Dropdown options - raw data
  private allDonorDecisionCodeOptions: { value: string; display: string }[] = [];
  private allProductTypeOptions: { value: string; display: string }[] = [];
  private allAttributeGroupOptions: { value: string; display: string }[] = [];
  private allAttributeCodeOptions: { value: string; display: string }[] = [];
  private allInterCodeOptions: { value: string; display: string }[] = [];
  private allInterTypeOptions: { value: string; display: string }[] = [
    { value: 'N', display: 'N - No effect on product suitability' },
    { value: 'H', display: 'H - Quarantine all products from donor' },
    { value: 'C', display: 'C - Discard products from unit causing interdiction' },
    { value: 'Q', display: 'Q - Quarantine all products from unit causing interdiction' },
    { value: 'A', display: 'A - Discard all products from donor' },
    { value: 'I', display: 'I - Discard products between effective and termination dates' }
  ];

  // Filtered options (signals)
  readonly donorDecisionCodeOptions = signal<{ value: string; display: string }[]>([]);
  readonly productTypeOptions = signal<{ value: string; display: string }[]>([]);
  readonly attributeGroupOptions = signal<{ value: string; display: string }[]>([]);
  readonly attributeCodeOptions = signal<{ value: string; display: string }[]>([]);
  readonly interCodeOptions = signal<{ value: string; display: string }[]>([]);
  readonly interTypeOptions = signal<{ value: string; display: string }[]>([]);

  // Search controls
  readonly donorDecisionCodeSearchControl = new FormControl('');
  readonly productTypeSearchControl = new FormControl('');
  readonly attributeGroupSearchControl = new FormControl('');
  readonly attributeCodeSearchControl = new FormControl('');
  readonly interCodeSearchControl = new FormControl('');
  readonly interTypeSearchControl = new FormControl('');

  // Auto-populated description fields (non-editable)
  productTypeDesc: string = '';
  interDesc: string = '';

  // Lookup maps for auto-populating descriptions
  private productTypeDescriptionMap: Map<string, string> = new Map();
  private interCodeDescriptionMap: Map<string, string> = new Map();

  isLoadingOptions = false;
  isSaving = false;

  // Date constraints
  minDate = DateFieldValidationUtility.getMinDate();

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private overrideService: DonorInterdictionOverrideService,
    private snackBar: MatSnackBar,
    private loginService: LoginService,
    private headerService: HeaderService
  ) {
    this.form = this.fb.group({
      donorDecisionCode: ['', [Validators.required]],
      productType: ['', [Validators.required]],
      attributeGroup: [''],
      attributeCode: [{ value: '', disabled: true }],
      interCode: ['', [Validators.required]],
      interType: ['', [Validators.required]],
      overrideDesc: ['', [Validators.required, Validators.maxLength(50), noWhitespaceOnlyValidator()]],
      effDate: [null, [Validators.required]],
      termDate: [null]
    }, {
      validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effDate', 'termDate')]
    });

    // Track which date field was last changed for cross-field error display
    this.form.get('effDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'effective';
      });

    this.form.get('termDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => { this.lastChangedDateField = 'termination'; });
  }

  ngOnInit(): void {
    this.setupPanel();
    this.loadDropdowns();
    this.setupAutoPopulate();
    this.setupModeValidators();
    this.setupSearchFilters();
  }

  private setupSearchFilters(): void {
    // Donor Decision Code search
    this.donorDecisionCodeSearchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(search => {
        const filtered = this.filterOptions(this.allDonorDecisionCodeOptions, search);
        this.donorDecisionCodeOptions.set(filtered);
      });

    // Product Type search
    this.productTypeSearchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(search => {
        const filtered = this.filterOptions(this.allProductTypeOptions, search);
        this.productTypeOptions.set(filtered);
      });

    // Attribute Group search
    this.attributeGroupSearchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(search => {
        const filtered = this.filterOptions(this.allAttributeGroupOptions, search);
        this.attributeGroupOptions.set(filtered);
      });

    // Attribute Code search
    this.attributeCodeSearchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(search => {
        const filtered = this.filterOptions(this.allAttributeCodeOptions, search);
        this.attributeCodeOptions.set(filtered);
      });

    // Inter Code search
    this.interCodeSearchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(search => {
        const filtered = this.filterOptions(this.allInterCodeOptions, search);
        this.interCodeOptions.set(filtered);
      });

    // Inter Type search
    this.interTypeSearchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(search => {
        const filtered = this.filterOptions(this.allInterTypeOptions, search);
        this.interTypeOptions.set(filtered);
      });
  }

  private filterOptions(options: { value: string; display: string }[], search: string | null): { value: string; display: string }[] {
    if (!search || search.length === 0) {
      return options;
    }
    const searchLower = search.toLowerCase();
    return options.filter(opt =>
      opt.value.toLowerCase().includes(searchLower) ||
      opt.display.toLowerCase().includes(searchLower)
    );
  }

  private setupAutoPopulate(): void {
    // Auto-populate Product Type Description
    this.form.get('productType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value: string) => {
        this.productTypeDesc = this.productTypeDescriptionMap.get(value) || '';
      });

    // Auto-populate Interdiction Description
    this.form.get('interCode')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value: string) => {
        this.interDesc = this.interCodeDescriptionMap.get(value) || '';
      });

    // Filter attribute codes based on selected attribute group
    this.form.get('attributeGroup')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value: string) => {
        const attribCodeControl = this.form.get('attributeCode');
        if (value) {
          attribCodeControl?.enable({ emitEvent: false });
          attribCodeControl?.setValidators([Validators.required]);
          attribCodeControl?.updateValueAndValidity();
          this.overrideService.getAttribCodesByGroup(value)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (codes) => {
                this.allAttributeCodeOptions = codes.map((item) => ({
                  value: item.code,
                  display: item.code
                }));
                this.attributeCodeOptions.set(this.allAttributeCodeOptions);
                // Clear attrib code if current value is not in the new options
                const currentCode = attribCodeControl?.value;
                if (currentCode && !codes.some(c => c.code === currentCode)) {
                  attribCodeControl?.setValue('', { emitEvent: false });
                }
              },
              error: () => {
                this.allAttributeCodeOptions = [];
                this.attributeCodeOptions.set([]);
              }
            });
        } else {
          attribCodeControl?.setValue('', { emitEvent: false });
          attribCodeControl?.clearValidators();
          attribCodeControl?.disable({ emitEvent: false });
          attribCodeControl?.updateValueAndValidity();
          this.allAttributeCodeOptions = [];
          this.attributeCodeOptions.set([]);
        }
      });

  }

  private loadDropdowns(): void {
    this.isLoadingOptions = true;

    this.overrideService.getDropdowns()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (dropdowns) => {
          // Cue: combination of code - description
          const rawCodes = dropdowns.donorDecisionCodes || [];
          this.allDonorDecisionCodeOptions = rawCodes.map((item) => ({
            value: item.code,
            display: item.description ? `${item.code} - ${item.description}` : item.code
          }));
          this.donorDecisionCodeOptions.set(this.allDonorDecisionCodeOptions);

          // Product Type
          const rawProductTypes = dropdowns.productTypes || [];
          this.allProductTypeOptions = rawProductTypes.map((item) => ({
            value: item.code,
            display: item.code
          }));
          this.productTypeOptions.set(this.allProductTypeOptions);
          this.productTypeDescriptionMap.clear();
          rawProductTypes.forEach((item) => {
            this.productTypeDescriptionMap.set(item.code, item.description || '');
          });

          // Attribute Group
          const rawAttrGroups = dropdowns.attributeGroups || [];
          this.allAttributeGroupOptions = rawAttrGroups.map((item) => ({
            value: item.code,
            display: item.code
          }));
          this.attributeGroupOptions.set(this.allAttributeGroupOptions);

          // Attribute Code
          const rawAttrCodes = dropdowns.attributeCodes || [];
          this.allAttributeCodeOptions = rawAttrCodes.map((item) => ({
            value: item.code,
            display: item.code
          }));
          this.attributeCodeOptions.set(this.allAttributeCodeOptions);

          // Interdiction Code
          const rawInterCodes = dropdowns.interCodes || [];
          this.allInterCodeOptions = rawInterCodes.map((item) => ({
            value: item.code,
            display: item.code
          }));
          this.interCodeOptions.set(this.allInterCodeOptions);
          this.interCodeDescriptionMap.clear();
          rawInterCodes.forEach((item) => {
            this.interCodeDescriptionMap.set(item.code, item.description || '');
          });

          // Type
          const rawTypes = dropdowns.interTypes || [];
          if (rawTypes.length > 0) {
            this.allInterTypeOptions = rawTypes
              .map((type) => ({
                value: type.code,
                display: getInterTypeDisplay(type.code)
              }));
          }
          this.interTypeOptions.set(this.allInterTypeOptions);

          // In edit mode, re-apply form values after options load
          if (this.mode === 'edit' && this.data) {
            const savedProductTypeDesc = this.productTypeDesc;
            const savedInterDesc = this.interDesc;

            this.form.patchValue({
              donorDecisionCode: this.data.donorDecisionCode || '',
              productType: this.data.productType || '',
              attributeGroup: this.data.attributeGroup || '',
              interCode: this.data.interCode || '',
              interType: this.data.interType || ''
            }, { emitEvent: false });

            // Enable attributeCode and set value when attributeGroup is present
            const attribCodeControl = this.form.get('attributeCode');
            if (this.data.attributeGroup) {
              attribCodeControl?.enable({ emitEvent: false });
              attribCodeControl?.setValidators([Validators.required]);
              attribCodeControl?.setValue(this.data.attributeCode || '', { emitEvent: false });
              attribCodeControl?.updateValueAndValidity({ emitEvent: false });
            }

            // Clear dropdown values that no longer exist in loaded options (e.g., terminated items)
            // Mark as touched so required error message displays immediately
            const currentProductType = this.form.get('productType')?.value;
            if (currentProductType && !this.allProductTypeOptions.some(o => o.value === currentProductType)) {
              const ctrl = this.form.get('productType');
              ctrl?.setValue('');
              ctrl?.markAsTouched();
              this.productTypeDesc = '';
            } else if (currentProductType) {
              this.productTypeDesc = this.productTypeDescriptionMap.get(currentProductType) || savedProductTypeDesc;
            }

            const currentInterCode = this.form.get('interCode')?.value;
            if (currentInterCode && !this.allInterCodeOptions.some(o => o.value === currentInterCode)) {
              const ctrl = this.form.get('interCode');
              ctrl?.setValue('');
              ctrl?.markAsTouched();
              this.interDesc = '';
            } else if (currentInterCode) {
              this.interDesc = this.interCodeDescriptionMap.get(currentInterCode) || savedInterDesc;
            }

            const currentInterType = this.form.get('interType')?.value;
            if (currentInterType && !this.allInterTypeOptions.some(o => o.value === currentInterType)) {
              const ctrl = this.form.get('interType');
              ctrl?.setValue('');
              ctrl?.markAsTouched();
            }

            const currentDDC = this.form.get('donorDecisionCode')?.value;
            if (currentDDC && !this.allDonorDecisionCodeOptions.some(o => o.value === currentDDC)) {
              const ctrl = this.form.get('donorDecisionCode');
              ctrl?.setValue('');
              ctrl?.markAsTouched();
            }

            // After validating dropdowns, ensure termination date stays untouched
            // This prevents past date errors from showing until user touches the field
            this.form.get('termDate')?.markAsUntouched();
            this.form.markAsPristine();
          }

          this.isLoadingOptions = false;
        },
        error: (error) => {
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
      this.panelTitle = 'Add New Override';
      this.lastModified = '';
    } else {
      this.panelTitle = 'Edit Override';
      const modifiedDate = this.data?.lastModifiedDate;
      this.lastModified = modifiedDate
        ? `Last Modified: ${moment(modifiedDate).format('DD-MMM-YYYY').toUpperCase()}`
        : '';
      this.populateFormForEdit();
    }
    this.setupModeValidators();
  }

  private setupModeValidators(): void {
    if (this.mode === 'edit') {
      DateFieldValidationUtility.setupEditModeValidators(this.form, this.headerService.chapterTimeZone());
      // Override termination date validators to include past date validation in edit mode
      this.setupTerminationDateValidatorsForEdit();
    } else {
      DateFieldValidationUtility.setupAddModeValidators(this.form, this.headerService.chapterTimeZone());
    }
  }

  /**
   * Setup termination date validators for edit mode
   * Business Rule: Terminated records can be edited, but if user touches termination date field,
   * show "date is in past" error and disable save
   */
  private setupTerminationDateValidatorsForEdit(): void {
    const termDateControl = this.form.get('termDate');
    if (termDateControl) {
      termDateControl.setValidators([
        dateFormatValidator(),
        DateFieldValidationUtility.validDateValidator(),
        DateFieldValidationUtility.terminationDateNotPastValidator(this.headerService.chapterTimeZone())
      ]);
      termDateControl.updateValueAndValidity({ onlySelf: true, emitEvent: false });
    }
  }

  /** Clears a form control if its current value is not in the active options (e.g. terminated). */
  private clearIfTerminated(fieldName: string, options: { value: string }[]): void {
    if (options.length === 0) return;
    const ctrl = this.form.get(fieldName);
    const value = ctrl?.value;
    if (value && !options.some(opt => opt.value === value)) {
      ctrl?.setValue('');
      ctrl?.markAsTouched();
      ctrl?.updateValueAndValidity();
    }
  }

  private resetFormForAddMode(): void {
    this.productTypeDesc = '';
    this.interDesc = '';

    this.form.reset();
    this.form.get('attributeCode')?.disable({ emitEvent: false });
    this.form.markAsUntouched();
    this.form.markAsPristine();

    // Update validity
    Object.keys(this.form.controls).forEach(key => {
      this.form.get(key)?.updateValueAndValidity();
    });
  }

  private populateFormForEdit(): void {
    if (this.data) {
      const effDateMoment = this.data.effDate ? moment(this.data.effDate) : null;

      // Set all fields except attributeCode first
      this.form.patchValue({
        donorDecisionCode: this.data.donorDecisionCode || '',
        productType: this.data.productType || '',
        attributeGroup: this.data.attributeGroup || '',
        interCode: this.data.interCode || '',
        interType: this.data.interType || '',
        overrideDesc: this.data.overrideDesc || '',
        effDate: effDateMoment,
        termDate: this.data.termDate ? moment(this.data.termDate) : null
      });

      // Load attrib codes for the group, then set attrib code value
      if (this.data.attributeGroup) {
        this.overrideService.getAttribCodesByGroup(this.data.attributeGroup)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (codes) => {
              this.allAttributeCodeOptions = codes.map((item) => ({
                value: item.code,
                display: item.code
              }));
              this.attributeCodeOptions.set(this.allAttributeCodeOptions);
              this.form.patchValue({
                attributeCode: this.data?.attributeCode || ''
              }, { emitEvent: false });
            }
          });
      }

      // Set descriptions from row data
      this.productTypeDesc = this.data.productTypeDesc || '';
      this.interDesc = this.data.interDesc || '';

      // Validate dropdown values against active options (for Add → Edit switch at runtime).
      // On initial load, loadDropdowns() handles this after options are fetched.
      // But when switching modes at runtime, options are already loaded so we validate here.
      this.clearIfTerminated('productType', this.allProductTypeOptions);
      this.clearIfTerminated('interCode', this.allInterCodeOptions);
      this.clearIfTerminated('donorDecisionCode', this.allDonorDecisionCodeOptions);
      this.clearIfTerminated('interType', this.allInterTypeOptions);

      // Mark form as pristine and untouched after population
      // This prevents termination date errors from showing until user touches the field
      this.form.markAsPristine();
      this.form.markAsUntouched();
    }
  }

  onCancel(): void {
    this.closePanel.emit();
  }

  onSave(): void {
    // Store termination date touched state before markAllAsTouched
    const termDateControl = this.form.get('termDate');
    const wasTermDateTouched = termDateControl?.touched || false;

    this.form.markAllAsTouched();

    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'termDate');

    // If termination date was not manually touched, restore its untouched state
    // This prevents showing past date errors on save for terminated records
    if (!wasTermDateTouched && termDateControl) {
      termDateControl.markAsUntouched();
    }

    // Check for visible validation errors (not hidden termination date errors)
    if (!this.isFormValid) {
      return;
    }

    const formValue = this.form.getRawValue();
    const username = (this.loginService.getStoredUsername() || 'DONSYS').substring(0, 6);

    this.isSaving = true;

    let apiCall;

    if (this.mode === 'add') {
      const addPayload: DonorInterdictionOverrideCreateDto = {
        donorDecisionCode: formValue.donorDecisionCode?.trim() || '',
        productType: formValue.productType?.trim() || '',
        attribGroup: formValue.attributeGroup?.trim() || '',
        attribCode: formValue.attributeCode?.trim() || '',
        interCode: formValue.interCode?.trim() || '',
        interType: formValue.interType || '',
        overrideDesc: formValue.overrideDesc?.trim() || '',
        effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effDate) || '',
        termDate: DateFieldValidationUtility.serializeDateForApi(formValue.termDate),
        insertUser: username
      };
      apiCall = this.overrideService.createOverride(addPayload);
    } else {
      const updatePayload: DonorInterdictionOverrideUpdateDto = {
        donorDecisionCode: formValue.donorDecisionCode?.trim() || '',
        productType: formValue.productType?.trim() || '',
        attribGroup: formValue.attributeGroup?.trim() || '',
        attribCode: formValue.attributeCode?.trim() || '',
        interCode: formValue.interCode?.trim() || '',
        interType: formValue.interType || '',
        overrideDesc: formValue.overrideDesc?.trim() || '',
        effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effDate) || '',
        termDate: DateFieldValidationUtility.serializeDateForApi(formValue.termDate),
        insertUser: username,
        originalDonorDecisionCode: this.data?.donorDecisionCode || '',
        originalProductType: this.data?.productType || '',
        originalInterCode: this.data?.interCode || ''
      };
      apiCall = this.overrideService.updateOverride(updatePayload);
    }

    apiCall
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isSaving = false;
        })
      )
      .subscribe({
        next: (response: any) => {
          const message = response?.message || (this.mode === 'add'
            ? 'Override added successfully'
            : 'Override updated successfully');

          this.snackBar.open(message, 'Close', {
            duration: 2000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });

          const result: DonorInterdictionOverrideFormData = {
            donorDecisionCode: formValue.donorDecisionCode?.trim() || '',
            productType: formValue.productType?.trim() || '',
            attributeGroup: formValue.attributeGroup?.trim() || '',
            attributeCode: formValue.attributeCode?.trim() || '',
            interCode: formValue.interCode?.trim() || '',
            interType: formValue.interType || '',
            overrideDesc: formValue.overrideDesc?.trim() || '',
            effDate: formValue.effDate?.toDate() || new Date(),
            termDate: formValue.termDate?.toDate() || null
          };

          this.saveSuccess.emit(result);
          this.closePanel.emit();
        }
      });
  }

  onSaveAndCreateAnother(): void {
    // Store termination date touched state before markAllAsTouched
    const termDateControl = this.form.get('termDate');
    const wasTermDateTouched = termDateControl?.touched || false;

    this.form.markAllAsTouched();

    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'termDate');

    // If termination date was not manually touched, restore its untouched state
    // This prevents showing past date errors on save for terminated records
    if (!wasTermDateTouched && termDateControl) {
      termDateControl.markAsUntouched();
    }

    // Check for visible validation errors (not hidden termination date errors)
    if (!this.isFormValid) {
      return;
    }

    const formValue = this.form.getRawValue();
    const username = (this.loginService.getStoredUsername() || 'DONSYS').substring(0, 6);

    this.isSaving = true;

    const addPayload: DonorInterdictionOverrideCreateDto = {
      donorDecisionCode: formValue.donorDecisionCode?.trim() || '',
      productType: formValue.productType?.trim() || '',
      attribGroup: formValue.attributeGroup?.trim() || '',
      attribCode: formValue.attributeCode?.trim() || '',
      interCode: formValue.interCode?.trim() || '',
      interType: formValue.interType || '',
      overrideDesc: formValue.overrideDesc?.trim() || '',
      effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effDate) || '',
      termDate: DateFieldValidationUtility.serializeDateForApi(formValue.termDate),
      insertUser: username
    };

    this.overrideService.createOverride(addPayload)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isSaving = false;
        })
      )
      .subscribe({
        next: (response: any) => {
          const message = response?.message || 'Override added successfully';

          this.snackBar.open(message, 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });

          const result: DonorInterdictionOverrideFormData = {
            donorDecisionCode: formValue.donorDecisionCode?.trim() || '',
            productType: formValue.productType?.trim() || '',
            attributeGroup: formValue.attributeGroup?.trim() || '',
            attributeCode: formValue.attributeCode?.trim() || '',
            interCode: formValue.interCode?.trim() || '',
            interType: formValue.interType || '',
            overrideDesc: formValue.overrideDesc?.trim() || '',
            effDate: formValue.effDate?.toDate() || new Date(),
            termDate: formValue.termDate?.toDate() || null
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
        error: () => {
          // Error handling is done by the auth interceptor
        }
      });
  }

  // Form control getters
  get donorDecisionCodeControl() { return this.form.get('donorDecisionCode'); }
  get productTypeControl() { return this.form.get('productType'); }
  get attributeGroupControl() { return this.form.get('attributeGroup'); }
  get attributeCodeControl() { return this.form.get('attributeCode'); }
  get interCodeControl() { return this.form.get('interCode'); }
  get interTypeControl() { return this.form.get('interType'); }
  get overrideDescControl() { return this.form.get('overrideDesc'); }
  get effDateControl() { return this.form.get('effDate'); }
  get termDateControl() { return this.form.get('termDate'); }

  // Error message getters
  getDonorDecisionCodeError(): string {
    const control = this.donorDecisionCodeControl;
    if (!control || !control.touched) return '';
    if (control.hasError('required')) return 'Cue is required';
    return '';
  }

  getProductTypeError(): string {
    const control = this.productTypeControl;
    if (!control || !control.touched) return '';
    if (control.hasError('required')) return 'Inventory Product Type is required';
    return '';
  }

  getAttributeGroupError(): string {
    const control = this.attributeGroupControl;
    if (!control || !control.touched) return '';
    if (control.hasError('required')) return 'Attribute Group is required';
    return '';
  }

  getAttributeCodeError(): string {
    const control = this.attributeCodeControl;
    if (!control || !control.touched) return '';
    if (control.hasError('required')) return 'Attribute Code is required';
    return '';
  }

  getInterCodeError(): string {
    const control = this.interCodeControl;
    if (!control || !control.touched) return '';
    if (control.hasError('required')) return 'Donor Interdiction is required';
    return '';
  }

  getInterTypeError(): string {
    const control = this.interTypeControl;
    if (!control || !control.touched) return '';
    if (control.hasError('required')) return 'Type is required';
    return '';
  }

  getOverrideDescError(): string {
    const control = this.overrideDescControl;
    if (!control || !control.touched) return '';
    if (control.hasError('required')) return 'Override Description is required';
    if (control.hasError('whitespaceOnly')) return 'Override Description cannot contain only spaces';
    if (control.hasError('maxlength')) return 'Override Description must be at most 50 characters';
    return '';
  }

  /** Format effective date for display in edit mode */
  get editEffectiveDateDisplay(): string {
    const effDate = this.form?.get('effDate')?.value;
    if (!effDate) return '-';
    return DateFieldValidationUtility.formatDateForUI(effDate)?.toUpperCase() || '-';
  }

  getEffDateError(): string {
    const formErrors = this.lastChangedDateField === 'effective' ? this.form.errors : null;
    return DateFieldValidationUtility.getStartDateCrossFieldError(
      this.form.get('effDate'), 'Effective Date', 'Termination Date', formErrors
    );
  }

  getTermDateError(): string {
    const control = this.form.get('termDate');

    // Field-level error: Termination date is in the past (only shown if field is touched)
    if (control?.touched && control?.hasError('terminationDatePast')) {
      return 'Termination Date cannot be in the past';
    }

    const formErrors = this.lastChangedDateField === 'termination' ? this.form.errors : null;
    return DateFieldValidationUtility.getEndDateCrossFieldError(
      control, 'Termination Date', 'Effective Date', formErrors
    );
  }

  onEffDateInput(event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value, this.form.get('effDate')
    );
  }

  onTermDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value, this.form.get('termDate'), this.mode === 'edit'
    );
  }

  get isFormValid(): boolean {
    if (this.mode === 'edit' && !this.form.dirty) {
      return false;
    }

    // Check for visible errors (only errors on touched fields)
    // This allows saving when other fields are changed but termination date is untouched
    const termDateControl = this.form.get('termDate');
    const hasTermDateError = termDateControl?.touched && termDateControl?.hasError('terminationDatePast');

    // Check for cross-field date range errors
    const hasDateRangeError = this.form.hasError('dateRangeInvalid');

    // Check if required fields are valid
    const hasRequiredErrors = (this.form.invalid || this.form.get('attributeCode')?.invalid) && (
      this.form.get('donorDecisionCode')?.invalid ||
      this.form.get('productType')?.invalid ||
      this.form.get('attributeCode')?.invalid ||
      this.form.get('interCode')?.invalid ||
      this.form.get('interType')?.invalid ||
      this.form.get('overrideDesc')?.invalid ||
      this.form.get('effDate')?.invalid
    );

    return !hasTermDateError && !hasDateRangeError && !hasRequiredErrors;
  }
}
