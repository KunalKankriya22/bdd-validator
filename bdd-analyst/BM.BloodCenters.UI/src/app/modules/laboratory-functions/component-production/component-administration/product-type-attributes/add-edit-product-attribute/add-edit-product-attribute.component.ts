import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormControl,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
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
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import moment from 'moment';
import { Subject, takeUntil, finalize, forkJoin } from 'rxjs';

import { ProductAttributeService } from '../services/product-attribute.service';
import {
  ProductAttribute,
  ProductTypeDropdown,
  AttributeGroupDropdown,
  AttributeCodeDropdown,
  LabelFlagOption,
  LifeSpanIndicatorOption,
  CreateProductAttributeDto,
  UpdateProductAttributeDto
} from '../models/product-attribute.model';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { HeaderService } from '@shared/services/header.service';
import { TIMEZONE_OFFSET_MAP } from '@core/constants/timezone.constants';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';

/**
 * Form data emitted on successful save
 */
export interface ProductAttributeFormData {
  productType: string;
  attribGroup: string;
  attribCode: string;
  attribCodeDesc: string;
  labelFlag: string;
  lifeSpanInd: string;
  lifeSpan: string;
  effDate: string;
  termDate: string | null;
  newProductType: string | null;
}

/**
 * Add/Edit Product Attribute Side Panel Component
 */
@Component({
  selector: 'app-add-edit-product-attribute',
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
  templateUrl: './add-edit-product-attribute.component.html',
  styleUrls: ['./add-edit-product-attribute.component.scss']
})
export class AddEditProductAttribute implements OnInit, OnChanges, OnDestroy {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() data: ProductAttribute | null = null;
  @Input() existingRecords: ProductAttribute[] = [];
  @Output() closePanel = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<ProductAttributeFormData>();
  @Output() modeChange = new EventEmitter<'add' | 'edit'>();

  form: FormGroup;
  panelTitle: string = '';
  lastUpdated: string = '';
  modificationDate: Date | null = null;

  editModeValues: {
    productType: string;
    attribGroup: string;
    attribCode: string;
    attribCodeDesc: string;
  } = {
    productType: '',
    attribGroup: '',
    attribCode: '',
    attribCodeDesc: ''
  };

  // Dropdown options
  productTypeOptions: ProductTypeDropdown[] = [];
  attributeGroupOptions: AttributeGroupDropdown[] = [];
  attributeCodeOptions: AttributeCodeDropdown[] = [];
  newProductTypeOptions: ProductTypeDropdown[] = [];

  labelFlagOptions: LabelFlagOption[] = [
    { value: 'Y', label: 'Yes' },
    { value: 'N', label: 'No' }
  ];

  lifeSpanIndicatorOptions: LifeSpanIndicatorOption[] = [
    { value: 'H', label: 'Hours' },
    { value: 'D', label: 'Days' },
    { value: 'Y', label: 'Years' }
  ];

  // Search controls for dropdowns
  productTypeSearchCtrl = new FormControl('');
  attributeGroupSearchCtrl = new FormControl('');
  attributeCodeSearchCtrl = new FormControl('');
  newProductTypeSearchCtrl = new FormControl('');

  // Filtered options using signals
  filteredProductTypeOptions = signal<ProductTypeDropdown[]>([]);
  filteredAttributeGroupOptions = signal<AttributeGroupDropdown[]>([]);
  filteredAttributeCodeOptions = signal<AttributeCodeDropdown[]>([]);
  filteredNewProductTypeOptions = signal<ProductTypeDropdown[]>([]);

  minDate!: moment.Moment;
  minTerminationDate!: moment.Moment;

  loadingProductTypes = false;
  loadingAttributeGroups = false;
  loadingAttributeCodes = false;
  loadingNewProductTypes = false;
  isSaving = false;

  private initialFormValues: any = null;

  /** Tracks which date field was last changed — cross-field error shows only on that field */
  private lastChangedDateField: 'effective' | 'termination' | null = null;

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEffectiveDateError());
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTerminationDateError());

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private productAttributeService: ProductAttributeService,
    private snackBar: MatSnackBar,
    private headerService: HeaderService,
    private chapterTimezoneService: ChapterTimezoneService
  ) {
    const chapterToday = this.chapterTimezoneService.getChapterLocalDate();
    this.minDate = chapterToday.clone();
    this.minTerminationDate = chapterToday.clone();
    this.form = this.fb.group(
      {
        productType: ['', [Validators.required]],
        attribGroup: ['', [Validators.required]],
        attribCode: ['', [Validators.required]],
        attribCodeDesc: [{ value: '', disabled: true }],
        labelFlag: [''],
        lifeSpanInd: [''],
        lifeSpan: [{ value: '', disabled: true }],
        newProductType: [{ value: '', disabled: true }],
        effectiveDate: [null, [Validators.required]],
        terminationDate: [null]
      },
      {
        validators: [
          DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate')
        ]
      }
    );
  }

  ngOnInit(): void {
    this.setupPanel();
    this.loadDropdownsFromAPI();
    this.setupDateValidationListeners();
    this.setupLifeSpanValidation();
    this.setupAttributeGroupChangeListener();
    this.setupProductTypeChangeListener();
    this.setupSearchFilters();

    if (this.mode === 'edit') {
      DateFieldValidationUtility.setupEditModeValidators(this.form);
    } else {
      DateFieldValidationUtility.setupAddModeValidators(this.form);
      this.addDuplicateValidators();
    }

    // Track which date field was last changed for cross-field error display
    this.form
      .get('effectiveDate')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'effective';
      });

    this.form
      .get('terminationDate')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'termination';
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

    if (changes['existingRecords'] && !changes['existingRecords'].firstChange) {
      if (this.mode === 'add') {
        this.form.get('attribCode')?.updateValueAndValidity();
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupPanel(): void {
    if (this.mode === 'add') {
      this.panelTitle = 'Add New Product Type Attribute';
      this.lastUpdated = '';
    } else {
      this.panelTitle = 'Edit Product Type Attribute';

      const dateToDisplay = this.data?.lastModifiedDate;
      this.lastUpdated = dateToDisplay
        ? `Last Updated: ${this.formatDateTime(dateToDisplay)}`
        : '';
      this.populateFormForEdit();
    }
  }

  private resetFormForAddMode(): void {
    this.editModeValues = {
      productType: '',
      attribGroup: '',
      attribCode: '',
      attribCodeDesc: ''
    };

    this.form.reset();
    this.form.markAsUntouched();
    this.form.markAsPristine();

    this.form.get('productType')?.enable();
    this.form.get('attribGroup')?.enable();
    this.form.get('attribCode')?.enable();
    this.form.get('attribCodeDesc')?.disable();
    this.form.get('newProductType')?.disable();
    this.form.get('lifeSpan')?.disable();

    // Reset initial values for change detection
    this.initialFormValues = null;
  }

  private populateFormForEdit(): void {
    if (this.data) {
      this.editModeValues = {
        productType: this.data.productType || '',
        attribGroup: this.data.attribGroup || '',
        attribCode: this.data.attribCode || '',
        attribCodeDesc: this.data.attribCodeDesc || ''
      };

      // Disable primary key fields and description in edit mode
      this.form.get('productType')?.disable();
      this.form.get('attribGroup')?.disable();
      this.form.get('attribCode')?.disable();
      this.form.get('attribCodeDesc')?.disable();

      this.form.patchValue({
        productType: this.data.productType || '',
        attribGroup: this.data.attribGroup || '',
        attribCode: this.data.attribCode || '',
        attribCodeDesc: this.data.attribCodeDesc || '',
        labelFlag: this.data.labelFlag || '',
        lifeSpanInd: this.data.lifeSpanInd || '',
        lifeSpan: this.data.lifeSpan || '',
        newProductType: this.data.newProductType || '',
        effectiveDate: this.data.effDate ? moment(this.data.effDate) : null,
        terminationDate: this.data.termDate ? moment(this.data.termDate) : null
      });

      if (this.data.lifeSpanInd) {
        this.form.get('lifeSpan')?.enable();
      } else {
        this.form.get('lifeSpan')?.disable();
      }

      // Load new product types dropdown excluding current product type
      if (this.data.productType) {
        this.loadNewProductTypes(this.data.productType);
        this.form.get('newProductType')?.enable();
      }

      // Set initial min termination date: max(today, effectiveDate)
      if (this.data.effDate) {
        const effMoment = moment(this.data.effDate);
        const chapterToday = this.minDate;
        this.minTerminationDate = effMoment.isAfter(chapterToday) ? effMoment : chapterToday;
      } else {
        this.minTerminationDate = this.minDate;
      }

      this.form.markAsPristine();
      this.form.markAsUntouched();

      // Show error immediately if effective date is in the past
      const effControl = this.form.get('effectiveDate');
      if (
        effControl?.value &&
        moment.isMoment(effControl.value) &&
        effControl.value.isBefore(this.minDate)
      ) {
        effControl.markAsTouched();
      }

      this.modificationDate = this.data.lastModifiedDate
        ? new Date(this.data.lastModifiedDate)
        : null;

      // Store initial values for change detection in edit mode
      this.initialFormValues = {
        labelFlag: this.data.labelFlag,
        lifeSpanInd: this.data.lifeSpanInd,
        lifeSpan: this.data.lifeSpan,
        newProductType: this.data.newProductType || null,
        effectiveDate: this.data.effDate ? moment(this.data.effDate).valueOf() : null,
        terminationDate: this.data.termDate ? moment(this.data.termDate).valueOf() : null
      };
    }
  }

  private loadDropdownsFromAPI(): void {
    this.loadingProductTypes = true;
    this.loadingAttributeGroups = true;

    forkJoin({
      productTypes: this.productAttributeService.getProductTypesDropdown(),
      attributeGroups: this.productAttributeService.getAttributeGroupsDropdown()
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.productTypeOptions = response.productTypes || [];
          this.filteredProductTypeOptions.set(this.productTypeOptions);

          this.attributeGroupOptions = response.attributeGroups || [];
          this.filteredAttributeGroupOptions.set(this.attributeGroupOptions);

          this.loadingProductTypes = false;
          this.loadingAttributeGroups = false;
        },
        error: (err) => {
          console.error('Error loading dropdowns:', err);
          this.loadingProductTypes = false;
          this.loadingAttributeGroups = false;
        }
      });
  }

  private loadNewProductTypes(currentProductType: string): void {
    this.loadingNewProductTypes = true;

    this.productAttributeService
      .getNewProductTypesDropdown(currentProductType)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.newProductTypeOptions = response || [];
          this.filteredNewProductTypeOptions.set(this.newProductTypeOptions);
          this.loadingNewProductTypes = false;
        },
        error: (err) => {
          console.error('Error loading new product types:', err);
          this.loadingNewProductTypes = false;
        }
      });
  }

  /**
   * Setup listener for product type changes
   * When product type is selected in add mode, load new product types excluding the selected one
   */
  private setupProductTypeChangeListener(): void {
    this.form
      .get('productType')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((selectedProductType) => {
        const newProductTypeControl = this.form.get('newProductType');

        if (selectedProductType && selectedProductType.trim() !== '') {
          this.loadNewProductTypes(selectedProductType.trim());
          newProductTypeControl?.enable();
        } else {
          // Reset and disable new product type field
          this.newProductTypeOptions = [];
          this.filteredNewProductTypeOptions.set([]);
          newProductTypeControl?.setValue('');
          newProductTypeControl?.disable();
        }
      });
  }

  /**
   * Setup listener for attribute group changes
   * When attribute group is selected, load attribute codes for that group
   */
  private setupAttributeGroupChangeListener(): void {
    this.form
      .get('attribGroup')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((selectedGroup) => {
        if (selectedGroup && selectedGroup.trim() !== '') {
          this.loadAttributeCodes(selectedGroup.trim());
        } else {
          // Reset attribute code field
          this.attributeCodeOptions = [];
          this.filteredAttributeCodeOptions.set([]);
          this.form.patchValue({ attribCode: '', attribCodeDesc: '' });
        }
      });

    // Also listen to attribute code changes to fetch description
    this.form
      .get('attribCode')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((selectedCode) => {
        if (selectedCode) {
          const selectedOption = this.attributeCodeOptions.find(
            (opt) => opt.attribCode === selectedCode
          );
          if (selectedOption) {
            this.form.patchValue({ attribCodeDesc: selectedOption.attribDesc });
          }
        } else {
          this.form.patchValue({ attribCodeDesc: '' });
        }
      });
  }

  /**
   * Load attribute codes for the selected attribute group
   */
  private loadAttributeCodes(attribGroup: string): void {
    this.loadingAttributeCodes = true;

    this.productAttributeService
      .getAttributeCodesDropdown(attribGroup)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.attributeCodeOptions = response || [];
          this.filteredAttributeCodeOptions.set(this.attributeCodeOptions);
          this.loadingAttributeCodes = false;
        },
        error: (err) => {
          console.error('Error loading attribute codes:', err);
          this.attributeCodeOptions = [];
          this.filteredAttributeCodeOptions.set([]);
          this.loadingAttributeCodes = false;
        }
      });
  }

  /**
   * Setup search filtering for dropdowns
   */
  private setupSearchFilters(): void {
    // Filter Product Type options
    this.productTypeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.filterProductTypes();
      });

    // Filter Attribute Group options
    this.attributeGroupSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.filterAttributeGroups();
      });

    // Filter Attribute Code options
    this.attributeCodeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.filterAttributeCodes();
      });

    // Filter New Product Type options
    this.newProductTypeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.filterNewProductTypes();
      });
  }

  private filterProductTypes(): void {
    const search = this.productTypeSearchCtrl.value?.toLowerCase() || '';
    if (!search) {
      this.filteredProductTypeOptions.set(this.productTypeOptions);
      return;
    }

    const filtered = this.productTypeOptions.filter(
      (option) =>
        (option.productType ?? '').toLowerCase().includes(search) ||
        (option.productTypeDesc ?? '').toLowerCase().includes(search)
    );
    this.filteredProductTypeOptions.set(filtered);
  }

  private filterAttributeGroups(): void {
    const search = this.attributeGroupSearchCtrl.value?.toLowerCase() || '';
    if (!search) {
      this.filteredAttributeGroupOptions.set(this.attributeGroupOptions);
      return;
    }

    const filtered = this.attributeGroupOptions.filter(
      (option) =>
        (option.code ?? '').toLowerCase().includes(search) ||
        (option.codeDesc ?? '').toLowerCase().includes(search)
    );
    this.filteredAttributeGroupOptions.set(filtered);
  }

  private filterAttributeCodes(): void {
    const search = this.attributeCodeSearchCtrl.value?.toLowerCase() || '';
    if (!search) {
      this.filteredAttributeCodeOptions.set(this.attributeCodeOptions);
      return;
    }

    const filtered = this.attributeCodeOptions.filter(
      (option) =>
        (option.attribCode ?? '').toLowerCase().includes(search) ||
        (option.attribDesc ?? '').toLowerCase().includes(search)
    );
    this.filteredAttributeCodeOptions.set(filtered);
  }

  private filterNewProductTypes(): void {
    const search = this.newProductTypeSearchCtrl.value?.toLowerCase() || '';
    if (!search) {
      this.filteredNewProductTypeOptions.set(this.newProductTypeOptions);
      return;
    }

    const filtered = this.newProductTypeOptions.filter(
      (option) =>
        (option.productType ?? '').toLowerCase().includes(search) ||
        (option.productTypeDesc ?? '').toLowerCase().includes(search)
    );
    this.filteredNewProductTypeOptions.set(filtered);
  }

  /**
   * Setup Life Span validation
   * If LIFE_SPAN_IND is set, LIFE_SPAN becomes required and must be numeric > 0
   * If LIFE_SPAN_IND is NULL, LIFE_SPAN is cleared and made non-editable
   */
  private setupLifeSpanValidation(): void {
    this.form
      .get('lifeSpanInd')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        const lifeSpanControl = this.form.get('lifeSpan');

        if (value) {
          lifeSpanControl?.enable();
          lifeSpanControl?.setValidators([Validators.required, Validators.min(1), Validators.max(9999)]);
        } else {
          lifeSpanControl?.clearValidators();
          lifeSpanControl?.setValue('');
          lifeSpanControl?.disable();
        }

        lifeSpanControl?.updateValueAndValidity();
      });
  }

  private addDuplicateValidators(): void {
    const attribCodeControl = this.form.get('attribCode');
    if (attribCodeControl) {
      attribCodeControl.setValidators([
        Validators.required,
        this.duplicateValidator.bind(this)
      ]);
      attribCodeControl.updateValueAndValidity();
    }

    this.form.get('productType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.form.get('attribCode')?.updateValueAndValidity();
      });

    this.form.get('attribGroup')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.form.get('attribCode')?.updateValueAndValidity();
      });
  }

  private duplicateValidator(control: any): { [key: string]: any } | null {
    if (!control.value || this.mode === 'edit') {
      return null;
    }

    const productType = this.form?.get('productType')?.value;
    const attribGroup = this.form?.get('attribGroup')?.value;
    const attribCode = control.value;

    if (!productType || !attribGroup) {
      return null;
    }

    const isDuplicate = this.existingRecords.some(record =>
      record.productType === productType &&
      record.attribGroup === attribGroup &&
      record.attribCode === attribCode
    );

    return isDuplicate ? { duplicate: true } : null;
  }

  private setupDateValidationListeners(): void {
    this.form
      .get('effectiveDate')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        const chapterToday = this.minDate;
        if (value && moment.isMoment(value) && value.isValid()) {
          this.minTerminationDate = value.isAfter(chapterToday) ? value.clone() : chapterToday;
        } else {
          this.minTerminationDate = chapterToday;
        }
        this.form.get('terminationDate')?.updateValueAndValidity();
      });
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

  onLifeSpanInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value;

    // Remove all non-numeric characters
    value = value.replace(/[^0-9]/g, '');

    // Limit to 4 digits maximum
    if (value.length > 4) {
      value = value.substring(0, 4);
    }

    // Update the form control value
    const lifeSpanControl = this.form.get('lifeSpan');
    if (lifeSpanControl) {
      lifeSpanControl.setValue(value, { emitEvent: false });
      // Update the input element to reflect the sanitized value
      input.value = value;
    }
  }

  onCancel(): void {
    this.closePanel.emit();
  }

  onSave(): void {
    if (this.isSaving) return;
    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'terminationDate');

    if (this.form.invalid) {
      return;
    }

    if (this.hasDateValidationError()) {
      this.form.get('terminationDate')?.markAsTouched();
      return;
    }

    const formValue = this.form.getRawValue();

    if (this.mode === 'add') {
      const dto: CreateProductAttributeDto = {
        productType: formValue.productType?.trim() || '',
        attribGroup: formValue.attribGroup?.trim() || '',
        attribCode: formValue.attribCode?.trim() || '',
        labelFlag: formValue.labelFlag || null,
        lifeSpanInd: formValue.lifeSpanInd || null,
        lifeSpan: formValue.lifeSpan ? String(formValue.lifeSpan) : null,
        effDate: formValue.effectiveDate
          ? moment(formValue.effectiveDate).format('YYYY-MM-DD')
          : moment.utc().format('YYYY-MM-DD'),
        termDate: formValue.terminationDate
          ? moment(formValue.terminationDate).format('YYYY-MM-DD')
          : null,
        newProductType: formValue.newProductType || null
      };

      this.isSaving = true;

      this.productAttributeService
        .createProductAttribute(dto)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => {
            this.isSaving = false;
          })
        )
        .subscribe({
          next: (response) => {
            if (response.success) {
              const message = response.message || 'Product attribute created successfully';

              this.snackBar.open(message, 'DISMISS', {
                horizontalPosition: 'end',
                verticalPosition: 'top',
                panelClass: ['success-snackbar']
              });

              const result: ProductAttributeFormData = {
                productType: formValue.productType?.trim() || '',
                attribGroup: formValue.attribGroup?.trim() || '',
                attribCode: formValue.attribCode?.trim() || '',
                attribCodeDesc: formValue.attribCodeDesc || '',
                labelFlag: formValue.labelFlag || '',
                lifeSpanInd: formValue.lifeSpanInd || '',
                lifeSpan: formValue.lifeSpan ? String(formValue.lifeSpan) : '',
                effDate:
                  DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate) || '',
                termDate: DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate),
                newProductType: formValue.newProductType || null
              };

              this.saveSuccess.emit(result);
              this.closePanel.emit();
            }
          },
          error: (error) => {
            console.error('Error creating product attribute:', error);
            const errorMessage = this.extractErrorMessage(
              error,
              'Error creating product attribute'
            );
            this.snackBar.open(errorMessage, 'DISMISS', {
              horizontalPosition: 'end',
              verticalPosition: 'top',
              panelClass: ['error-snackbar']
            });
          }
        });
    } else {
      // Edit mode
      const dto: UpdateProductAttributeDto = {
        labelFlag: formValue.labelFlag || null,
        lifeSpanInd: formValue.lifeSpanInd || null,
        lifeSpan: formValue.lifeSpan ? String(formValue.lifeSpan) : null,
        effDate: formValue.effectiveDate
          ? moment(formValue.effectiveDate).format('YYYY-MM-DD')
          : undefined,
        termDate: formValue.terminationDate
          ? moment(formValue.terminationDate).format('YYYY-MM-DD')
          : null,
        newProductType: formValue.newProductType || null
      };

      this.isSaving = true;

      this.productAttributeService
        .updateProductAttribute(
          formValue.productType,
          formValue.attribGroup,
          formValue.attribCode,
          dto
        )
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => {
            this.isSaving = false;
          })
        )
        .subscribe({
          next: (response) => {
            if (response.success) {
              const message = response.message || 'Product attribute updated successfully';

              this.snackBar.open(message, 'DISMISS', {
                horizontalPosition: 'end',
                verticalPosition: 'top',
                panelClass: ['success-snackbar']
              });

              const result: ProductAttributeFormData = {
                productType: formValue.productType?.trim() || '',
                attribGroup: formValue.attribGroup?.trim() || '',
                attribCode: formValue.attribCode?.trim() || '',
                attribCodeDesc: formValue.attribCodeDesc || '',
                labelFlag: formValue.labelFlag || '',
                lifeSpanInd: formValue.lifeSpanInd || '',
                lifeSpan: formValue.lifeSpan ? String(formValue.lifeSpan) : '',
                effDate:
                  DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate) || '',
                termDate: DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate),
                newProductType: formValue.newProductType || null
              };

              this.saveSuccess.emit(result);
              this.closePanel.emit();
            }
          },
          error: (error) => {
            console.error('Error updating product attribute:', error);
            const errorMessage = this.extractErrorMessage(
              error,
              'Error updating product attribute'
            );
            this.snackBar.open(errorMessage, 'DISMISS', {
              horizontalPosition: 'end',
              verticalPosition: 'top',
              panelClass: ['error-snackbar']
            });
          }
        });
    }
  }

  onSaveAndCreateAnother(): void {
    if (this.isSaving) return;
    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'terminationDate');

    if (this.form.invalid) {
      return;
    }

    if (this.hasDateValidationError()) {
      this.form.get('terminationDate')?.markAsTouched();
      return;
    }

    const formValue = this.form.getRawValue();

    if (this.mode === 'add') {
      const dto: CreateProductAttributeDto = {
        productType: formValue.productType?.trim() || '',
        attribGroup: formValue.attribGroup?.trim() || '',
        attribCode: formValue.attribCode?.trim() || '',
        labelFlag: formValue.labelFlag || null,
        lifeSpanInd: formValue.lifeSpanInd || null,
        lifeSpan: formValue.lifeSpan ? String(formValue.lifeSpan) : null,
        effDate: formValue.effectiveDate
          ? moment(formValue.effectiveDate).format('YYYY-MM-DD')
          : moment.utc().format('YYYY-MM-DD'),
        termDate: formValue.terminationDate
          ? moment(formValue.terminationDate).format('YYYY-MM-DD')
          : null,
        newProductType: formValue.newProductType || null
      };

      this.isSaving = true;

      this.productAttributeService
        .createProductAttribute(dto)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => {
            this.isSaving = false;
          })
        )
        .subscribe({
          next: (response) => {
            if (response.success) {
              const message = response.message || 'Product attribute created successfully';

              this.snackBar.open(message, 'DISMISS', {
                horizontalPosition: 'end',
                verticalPosition: 'top',
                panelClass: ['success-snackbar']
              });

              const result: ProductAttributeFormData = {
                productType: formValue.productType?.trim() || '',
                attribGroup: formValue.attribGroup?.trim() || '',
                attribCode: formValue.attribCode?.trim() || '',
                attribCodeDesc: formValue.attribCodeDesc || '',
                labelFlag: formValue.labelFlag || '',
                lifeSpanInd: formValue.lifeSpanInd || '',
                lifeSpan: formValue.lifeSpan ? String(formValue.lifeSpan) : '',
                effDate:
                  DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate) || '',
                termDate: DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate),
                newProductType: null
              };

              this.saveSuccess.emit(result);
              this.resetFormForAddMode();
            }
          },
          error: (error) => {
            console.error('Error creating product attribute:', error);
            const errorMessage = this.extractErrorMessage(
              error,
              'Error creating product attribute'
            );
            this.snackBar.open(errorMessage, 'DISMISS', {
              horizontalPosition: 'end',
              verticalPosition: 'top',
              panelClass: ['error-snackbar']
            });
          }
        });
    } else {
      // Edit mode - after saving, switch to add mode
      const dto: UpdateProductAttributeDto = {
        labelFlag: formValue.labelFlag || null,
        lifeSpanInd: formValue.lifeSpanInd || null,
        lifeSpan: formValue.lifeSpan ? String(formValue.lifeSpan) : null,
        effDate: formValue.effectiveDate
          ? moment(formValue.effectiveDate).format('YYYY-MM-DD')
          : undefined,
        termDate: formValue.terminationDate
          ? moment(formValue.terminationDate).format('YYYY-MM-DD')
          : null,
        newProductType: formValue.newProductType || null
      };

      this.isSaving = true;

      this.productAttributeService
        .updateProductAttribute(
          formValue.productType,
          formValue.attribGroup,
          formValue.attribCode,
          dto
        )
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => {
            this.isSaving = false;
          })
        )
        .subscribe({
          next: (response) => {
            if (response.success) {
              const message = response.message || 'Product attribute updated successfully';

              this.snackBar.open(message, 'DISMISS', {
                horizontalPosition: 'end',
                verticalPosition: 'top',
                panelClass: ['success-snackbar']
              });

              const result: ProductAttributeFormData = {
                productType: formValue.productType?.trim() || '',
                attribGroup: formValue.attribGroup?.trim() || '',
                attribCode: formValue.attribCode?.trim() || '',
                attribCodeDesc: formValue.attribCodeDesc || '',
                labelFlag: formValue.labelFlag || '',
                lifeSpanInd: formValue.lifeSpanInd || '',
                lifeSpan: formValue.lifeSpan ? String(formValue.lifeSpan) : '',
                effDate:
                  DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate) || '',
                termDate: DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate),
                newProductType: formValue.newProductType || null
              };

              this.saveSuccess.emit(result);

              // Switch to add mode
              this.mode = 'add';
              this.modeChange.emit('add');
              this.resetFormForAddMode();
              this.setupPanel();
            }
          },
          error: (error) => {
            console.error('Error updating product attribute:', error);
            const errorMessage = this.extractErrorMessage(
              error,
              'Error updating product attribute'
            );
            this.snackBar.open(errorMessage, 'DISMISS', {
              horizontalPosition: 'end',
              verticalPosition: 'top',
              panelClass: ['error-snackbar']
            });
          }
        });
    }
  }

  private hasDateValidationError(): boolean {
    return this.form.hasError('dateRangeInvalid') || false;
  }

  get productTypeControl() {
    return this.form.get('productType');
  }

  get attribGroupControl() {
    return this.form.get('attribGroup');
  }

  get attribCodeControl() {
    return this.form.get('attribCode');
  }

  get attribCodeDescControl() {
    return this.form.get('attribCodeDesc');
  }

  get labelFlagControl() {
    return this.form.get('labelFlag');
  }

  get lifeSpanIndControl() {
    return this.form.get('lifeSpanInd');
  }

  get lifeSpanControl() {
    return this.form.get('lifeSpan');
  }

  get newProductTypeControl() {
    return this.form.get('newProductType');
  }

  get effectiveDateControl() {
    return this.form.get('effectiveDate');
  }

  get terminationDateControl() {
    return this.form.get('terminationDate');
  }

  getProductTypeError(): string {
    const control = this.productTypeControl;
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return 'Product Type is required';
    }
    return '';
  }

  getAttribGroupError(): string {
    const control = this.attribGroupControl;
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return 'Attribute Group is required';
    }
    return '';
  }

  getAttribCodeError(): string {
    const control = this.attribCodeControl;
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return 'Attribute Code is required';
    }
    if (control.hasError('duplicate')) {
      return 'A record with this Product Type, Attribute Group, and Attribute Code already exists';
    }
    return '';
  }

  getLifeSpanError(): string {
    const control = this.lifeSpanControl;
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return 'Life Span is required when Life Span Indicator is set';
    }
    if (control.hasError('min')) {
      return 'Life Span must be greater than 0';
    }
    if (control.hasError('max')) {
      return 'Life Span cannot exceed 9999';
    }
    return '';
  }

  getEffectiveDateError(): string {
    const formErrors = this.lastChangedDateField === 'effective' ? this.form.errors : null;
    return DateFieldValidationUtility.getStartDateCrossFieldError(
      this.form.get('effectiveDate'),
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

  formatDate(date: Date | moment.Moment | null): string {
    if (!date) return '-';
    const momentDate = moment.isMoment(date) ? date : moment(date);
    return momentDate.format('DD-MMM-YYYY');
  }

  formatDateTime(date: Date | string | null): string {
    if (!date) return '';
    const momentDate = moment(date);
    const isToday = momentDate.isSame(moment(), 'day');
    const timeZone = this.headerService.chapterTimeZone();
    const tzAbbr = TIMEZONE_OFFSET_MAP[timeZone]?.abbr ?? 'GMT';

    if (isToday) {
      return `Today, ${momentDate.format('HH:mm')} ${tzAbbr}`;
    } else {
      return `${momentDate.format('DD-MMM-YYYY, HH:mm')} ${tzAbbr}`;
    }
  }

  getProductTypeDisplay(option: ProductTypeDropdown): string {
    return `${option.productType} - ${option.productTypeDesc}`;
  }

  getAttributeGroupDisplay(option: AttributeGroupDropdown): string {
    return `${option.code} - ${option.codeDesc}`;
  }

  getAttributeCodeDisplay(option: AttributeCodeDropdown): string {
    return `${option.attribCode} - ${option.attribDesc}`;
  }

  /**
   * Check if form data has changed from initial values (for edit mode)
   */
  private hasFormChanged(): boolean {
    if (this.mode !== 'edit' || !this.initialFormValues) {
      return true; // In add mode, always allow save if valid
    }

    const currentValues = this.form.getRawValue();

    // Check each editable field
    const labelFlagChanged = currentValues.labelFlag !== this.initialFormValues.labelFlag;
    const lifeSpanIndChanged = currentValues.lifeSpanInd !== this.initialFormValues.lifeSpanInd;
    const lifeSpanChanged = currentValues.lifeSpan !== this.initialFormValues.lifeSpan;
    const newProductTypeChanged =
      currentValues.newProductType !== this.initialFormValues.newProductType;

    const currentEffDate = currentValues.effectiveDate && moment.isMoment(currentValues.effectiveDate)
      ? currentValues.effectiveDate.valueOf()
      : null;
    const effDateChanged = currentEffDate !== this.initialFormValues.effectiveDate;

    const currentTermDate =
      currentValues.terminationDate && moment.isMoment(currentValues.terminationDate)
        ? currentValues.terminationDate.valueOf()
        : null;
    const termDateChanged = currentTermDate !== this.initialFormValues.terminationDate;

    return (
      labelFlagChanged ||
      lifeSpanIndChanged ||
      lifeSpanChanged ||
      newProductTypeChanged ||
      effDateChanged ||
      termDateChanged
    );
  }

  get isFormValid(): boolean {
    const isValid = this.form.valid && !this.hasDateValidationError();

    if (this.mode === 'edit') {
      return isValid && this.hasFormChanged();
    }

    return isValid;
  }


  /**
   * Extract error message with error code from API response
   */
  private extractErrorMessage(error: any, defaultMessage: string = 'Error saving record'): string {
    if (error?.error?.error?.errorCode && error?.error?.error?.errorDescription) {
      const errorCode = error.error.error.errorCode;
      const errorDescription = error.error.error.errorDescription;
      return `Error: ${errorCode} : ${errorDescription}`;
    }
    if (error?.error?.errorResponse?.errorCode && error?.error?.errorResponse?.error) {
      const errorCode = error.error.errorResponse.errorCode;
      const errorMessage = error.error.errorResponse.error;
      return `Error: ${errorCode} : ${errorMessage}`;
    }
    if (error?.error?.message) {
      return error.error.message;
    }
    return error?.message || defaultMessage;
  }
}
