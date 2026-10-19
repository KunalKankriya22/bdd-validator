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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import moment from 'moment';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { PrdtyatService } from '../../services/prdtyat.service';
import {
  ProductTypeAttribute,
  ProductTypeAttributeFormData,
  CreateProductTypeAttributeDto,
  UpdateProductTypeAttributeDto
} from '../../models/product-type-attribute.model';
import {
  AnticoagulantCodeLov,
  ProductTypeLov,
  AttributeGroupLov,
  AttributeCodeLov,
  ProductClassLov,
  ModifierCodeLov
} from '../../models/product-type-attribute-lov.model';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';

/**
 * Add/Edit Product Type Attribute Side Panel Component
 * Drawer for creating new or editing existing product type attributes
 */
@Component({
  selector: 'app-prdtyat-drawer',
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
  templateUrl: './prdtyat-drawer.component.html',
  styleUrls: ['./prdtyat-drawer.component.scss']
})
export class PrdtyatDrawerComponent implements OnInit, OnChanges, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `prdtyat-drawer-${PrdtyatDrawerComponent.nextId++}`;

  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  @Input() mode: 'add' | 'edit' = 'add';
  @Input() data: ProductTypeAttribute | null = null;
  @Input() existingRecords: ProductTypeAttribute[] = [];
  @Output() closePanel = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<ProductTypeAttributeFormData>();
  @Output() modeChange = new EventEmitter<'add' | 'edit'>();

  form: FormGroup;
  panelTitle = signal<string>('');

  editModeValues: {
    anticoagulantCode: string;
    volume: string;
    productType: string;
    effDate: string;
  } = {
    anticoagulantCode: '',
    volume: '',
    productType: '',
    effDate: ''
  };

  // Dropdown options
  anticoagulantCodeOptions: AnticoagulantCodeLov[] = [];
  productTypeOptions: ProductTypeLov[] = [];
  attributeGroupOptions: AttributeGroupLov[] = [];
  attributeCodeOptions: AttributeCodeLov[] = [];
  productClassOptions: ProductClassLov[] = [];
  modifierCodeOptions: ModifierCodeLov[] = [];

  // Search controls for dropdowns
  anticoagulantSearchCtrl = new FormControl('');
  productTypeSearchCtrl = new FormControl('');
  attributeGroupSearchCtrl = new FormControl('');
  attributeCodeSearchCtrl = new FormControl('');
  productClassSearchCtrl = new FormControl('');
  modifierCodeSearchCtrl = new FormControl('');

  // Filtered options using signals
  filteredAnticoagulantOptions = signal<AnticoagulantCodeLov[]>([]);
  filteredProductTypeOptions = signal<ProductTypeLov[]>([]);
  filteredAttributeGroupOptions = signal<AttributeGroupLov[]>([]);
  filteredAttributeCodeOptions = signal<AttributeCodeLov[]>([]);
  filteredProductClassOptions = signal<ProductClassLov[]>([]);
  filteredModifierCodeOptions = signal<ModifierCodeLov[]>([]);

  attributeGroupDescription = signal('---');
  attributeCodeDescription = signal('---');

  minDate = DateFieldValidationUtility.getMinDate();

  loadingAnticoagulant = false;
  loadingProductType = false;
  loadingAttributeGroup = false;
  loadingAttributeCode = false;
  loadingProductClass = false;
  loadingModifierCode = false;
  isSaving = signal<boolean>(false);

  private initialFormValues: any = null;
  private lastChangedDateField: 'effective' | 'termination' | null = null;

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEffectiveDateError());
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTerminationDateError());

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private prdtyatService: PrdtyatService,
    private snackbarService: SnackbarService,
    private headerService: HeaderService
  ) {
    this.form = this.fb.group(
      {
        anticoagulantCode: ['', [Validators.required]],
        volume: ['', [this.volumeValidator.bind(this)]],
        productType: ['', [Validators.required]],
        attributeGroup: ['', [Validators.required]],
        attributeCode: ['', [Validators.required]],
        productClass: ['', [Validators.required]],
        modifierCode: ['', [Validators.required]],
        effDate: [null, [Validators.required]],
        termDate: [null]
      },
      {
        validators: [
          DateFieldValidationUtility.crossFieldDateRangeValidator('effDate', 'termDate')
        ]
      }
    );
  }

  ngOnInit(): void {
    this.setupPanel();
    this.loadDropdownsFromAPI();
    this.setupDateValidationListeners();
    this.setupAnticoagulantChangeListener();
    this.setupAttributeGroupChangeListener();
    this.setupDescriptionListeners();
    this.setupSearchFilters();

    if (this.mode === 'add') {
      DateFieldValidationUtility.setupAddModeValidators(this.form, this.headerService.chapterTimeZone());
    } else {
      DateFieldValidationUtility.setupEditModeValidators(this.form);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mode'] || changes['data']) {
      this.setupPanel();
      if (this.form) {
        this.populateForm();
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupPanel(): void {
    if (this.mode === 'add') {
      this.panelTitle.set('Add Product Code Attribute');
    } else {
      this.panelTitle.set('Edit Product Code Attribute');
    }
  }

  private loadDropdownsFromAPI(): void {
    this.loadingAnticoagulant = true;
    this.loadingProductType = true;
    this.loadingAttributeGroup = true;
    this.loadingProductClass = true;
    this.loadingModifierCode = true;

    forkJoin({
      anticoagulant: this.prdtyatService.getAnticoagulantCodes(),
      productTypes: this.prdtyatService.getProductTypes(),
      attributeGroups: this.prdtyatService.getAttributeGroups(),
      productClasses: this.prdtyatService.getProductClasses(),
      modifierCodes: this.prdtyatService.getModifierCodes()
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.anticoagulantCodeOptions = response.anticoagulant || [];
          this.filteredAnticoagulantOptions.set([...this.anticoagulantCodeOptions]);

          this.productTypeOptions = response.productTypes || [];
          this.filteredProductTypeOptions.set([...this.productTypeOptions]);

          this.attributeGroupOptions = response.attributeGroups || [];
          this.filteredAttributeGroupOptions.set([...this.attributeGroupOptions]);

          this.productClassOptions = response.productClasses || [];
          this.filteredProductClassOptions.set([...this.productClassOptions]);

          this.modifierCodeOptions = response.modifierCodes || [];
          this.filteredModifierCodeOptions.set([...this.modifierCodeOptions]);

          this.loadingAnticoagulant = false;
          this.loadingProductType = false;
          this.loadingAttributeGroup = false;
          this.loadingProductClass = false;
          this.loadingModifierCode = false;

          if (this.mode === 'edit' && this.data) {
            this.populateForm();
          }
        },
        error: (err) => {
          console.error('Error loading dropdown options:', err);
          this.snackbarService.showError('Failed to load dropdown options.');
          this.loadingAnticoagulant = false;
          this.loadingProductType = false;
          this.loadingAttributeGroup = false;
          this.loadingProductClass = false;
          this.loadingModifierCode = false;
        }
      });
  }

  private setupAnticoagulantChangeListener(): void {
    // No cascading behavior needed — product types are loaded independently
  }

  private setupAttributeGroupChangeListener(): void {
    this.form.get('attributeGroup')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((attributeGroupCode) => {
        if (attributeGroupCode) {
          this.loadAttributeCodes(attributeGroupCode);
        } else {
          this.attributeCodeOptions = [];
          this.filteredAttributeCodeOptions.set([]);
          this.form.patchValue({ attributeCode: '' }, { emitEvent: false });
        }
      });
  }

  private loadAttributeCodes(attributeGroupCode: string): void {
    this.loadingAttributeCode = true;
    this.prdtyatService.getAttributeCodes(attributeGroupCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (codes) => {
          this.attributeCodeOptions = codes || [];
          this.filteredAttributeCodeOptions.set([...this.attributeCodeOptions]);
          this.loadingAttributeCode = false;
        },
        error: (err) => {
          console.error('Error loading attribute codes:', err);
          this.loadingAttributeCode = false;
        }
      });
  }

  private setupDescriptionListeners(): void {
    this.form.get('attributeGroup')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((code) => {
        if (!code) {
          this.attributeGroupDescription.set('---');
          return;
        }
        const group = this.attributeGroupOptions.find(g => g.code === code);
        this.attributeGroupDescription.set(group?.description || '---');
      });

    this.form.get('attributeCode')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((code) => {
        if (!code) {
          this.attributeCodeDescription.set('---');
          return;
        }
        const attr = this.attributeCodeOptions.find(a => a.code === code);
        this.attributeCodeDescription.set(attr?.description || '---');
      });
  }

  private setupDateValidationListeners(): void {
    this.form.get('effDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'effective';
      });

    this.form.get('termDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'termination';
      });
  }

  private setupSearchFilters(): void {
    // Anticoagulant Code search
    this.anticoagulantSearchCtrl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((searchText) => {
        this.filterOptions(
          searchText || '',
          this.anticoagulantCodeOptions,
          this.filteredAnticoagulantOptions
        );
      });

    // Product Type search
    this.productTypeSearchCtrl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((searchText) => {
        this.filterOptions(
          searchText || '',
          this.productTypeOptions,
          this.filteredProductTypeOptions
        );
      });

    // Attribute Group search
    this.attributeGroupSearchCtrl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((searchText) => {
        this.filterOptions(
          searchText || '',
          this.attributeGroupOptions,
          this.filteredAttributeGroupOptions
        );
      });

    // Attribute Code search
    this.attributeCodeSearchCtrl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((searchText) => {
        this.filterOptions(
          searchText || '',
          this.attributeCodeOptions,
          this.filteredAttributeCodeOptions
        );
      });

    // Product Class search
    this.productClassSearchCtrl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((searchText) => {
        this.filterOptions(
          searchText || '',
          this.productClassOptions,
          this.filteredProductClassOptions
        );
      });

    // Modifier Code search
    this.modifierCodeSearchCtrl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((searchText) => {
        this.filterOptions(
          searchText || '',
          this.modifierCodeOptions,
          this.filteredModifierCodeOptions
        );
      });
  }

  private filterOptions<T extends { code: string; description: string }>(
    searchText: string,
    allOptions: T[],
    filteredSignal: ReturnType<typeof signal<T[]>>
  ): void {
    if (!searchText) {
      filteredSignal.set([...allOptions]);
    } else {
      const lowerSearch = searchText.toLowerCase();
      const filtered = allOptions.filter(
        option =>
          (option.code ?? '').toLowerCase().includes(lowerSearch) ||
          (option.description ?? '').toLowerCase().includes(lowerSearch)
      );
      filteredSignal.set(filtered);
    }
  }

  private populateForm(): void {
    if (!this.data) return;

    if (this.mode === 'edit') {
      this.editModeValues = {
        anticoagulantCode: this.data.anticoagulantCode,
        volume: this.data.volume != null ? String(this.data.volume) : '---',
        productType: this.data.productType,
        effDate: this.formatDate(this.data.effDate)
      };

      this.form.get('anticoagulantCode')?.disable();
      this.form.get('volume')?.disable();
      this.form.get('productType')?.disable();
      this.form.get('effDate')?.disable();
      // Keep termDate enabled in edit mode to allow termination
    }

    this.form.patchValue({
      anticoagulantCode: this.data.anticoagulantCode,
      volume: this.data.volume != null ? String(this.data.volume) : '',
      productType: this.data.productType,
      attributeGroup: this.data.attributeGroup,
      attributeCode: this.data.attributeCode,
      productClass: this.data.productClass,
      modifierCode: this.data.modifierCode,
      effDate: this.data.effDate ? moment(this.data.effDate) : null,
      termDate: this.data.termDate ? moment(this.data.termDate) : null
    });

    this.initialFormValues = this.form.getRawValue();

    if (this.data.attributeGroupDesc) {
      this.attributeGroupDescription.set(this.data.attributeGroupDesc);
    }
    if (this.data.attributeCodeDesc) {
      this.attributeCodeDescription.set(this.data.attributeCodeDesc);
    }

    if (this.mode === 'edit') {
      if (this.data.attributeGroup) {
        this.loadAttributeCodes(this.data.attributeGroup);
      }
    }
  }

  getEffectiveDateError(): string {
    const formErrors = this.lastChangedDateField === 'effective' ? this.form.errors : null;
    return DateFieldValidationUtility.getStartDateCrossFieldError(
      this.form.get('effDate'), 'Effective Date', 'Termination Date', formErrors
    );
  }

  getTerminationDateError(): string {
    const formErrors = this.lastChangedDateField === 'termination' ? this.form.errors : null;
    return DateFieldValidationUtility.getEndDateCrossFieldError(
      this.form.get('termDate'), 'Termination Date', 'Effective Date', formErrors
    );
  }

  onEffectiveDateInput(event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value, this.form.get('effDate')
    );
  }

  onTerminationDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value, this.form.get('termDate'), this.mode === 'edit'
    );
  }

  onVolumeKeyDown(event: KeyboardEvent): void {
    const input = event.target as HTMLInputElement;
    const key = event.key;
    const value = input.value;
    const cursorPosition = input.selectionStart || 0;
    const selectionLength = (input.selectionEnd || 0) - cursorPosition;

    // Allow: backspace, delete, tab, escape, enter, arrow keys
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (allowedKeys.includes(key)) {
      return;
    }

    // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
    if (event.ctrlKey || event.metaKey) {
      return;
    }

    // Only validate numeric keys and decimal point
    if (!/^[0-9.]$/.test(key)) {
      event.preventDefault();
      return;
    }

    // Handle decimal point
    if (key === '.') {
      // Prevent multiple decimal points
      if (value.indexOf('.') !== -1 && selectionLength === 0) {
        event.preventDefault();
      }
      return;
    }

    // Handle numeric input
    if (key >= '0' && key <= '9') {
      const parts = value.split('.');
      const beforeDecimal = parts[0] || '';
      const afterDecimal = parts[1] || '';
      const decimalIndex = value.indexOf('.');

      // If there's a selection, allow (it will be replaced)
      if (selectionLength > 0) {
        return;
      }

      // Check if cursor is before or after decimal
      if (decimalIndex === -1 || cursorPosition <= decimalIndex) {
        // Typing before decimal or no decimal exists
        // Prevent if already 3 digits before decimal
        if (beforeDecimal.length >= 3) {
          event.preventDefault();
        }
      } else {
        // Typing after decimal
        // Prevent if already 2 digits after decimal
        if (afterDecimal.length >= 2) {
          event.preventDefault();
        }
      }
    }
  }

  onVolumeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value;

    if (!value) {
      const volumeControl = this.form.get('volume');
      if (volumeControl) {
        volumeControl.updateValueAndValidity();
      }
      return;
    }

    // Remove leading zeros (but keep "0." for decimals like 0.5)
    if (value.length > 1 && value.startsWith('0') && value[1] !== '.') {
      value = value.replace(/^0+/, '');
      input.value = value || '0';
    }

    // Handle pasted content - enforce max 3 digits before decimal, max 2 after
    const parts = value.split('.');
    let modified = false;

    // Limit to 3 digits before decimal
    if (parts[0] && parts[0].length > 3) {
      parts[0] = parts[0].substring(0, 3);
      modified = true;
    }

    // Limit to 2 digits after decimal
    if (parts.length > 1 && parts[1] && parts[1].length > 2) {
      parts[1] = parts[1].substring(0, 2);
      modified = true;
    }

    // Remove multiple decimal points if pasted
    if (parts.length > 2) {
      input.value = parts[0] + '.' + parts.slice(1).join('').substring(0, 2);
      modified = true;
    } else if (modified) {
      input.value = parts.join('.');
    }

    // Trigger validation
    const volumeControl = this.form.get('volume');
    if (volumeControl) {
      volumeControl.markAsTouched();
      volumeControl.updateValueAndValidity();
    }
  }

  /**
   * Custom validator for bag volume
   * - Must be between 0.01 and 999
   * - Must match format: up to 3 digits before decimal, up to 2 after
   */
  private volumeValidator(control: FormControl): { [key: string]: any } | null {
    const value = control.value;

    // Allow empty/null (field is optional)
    if (!value || value === '') {
      return null;
    }

    const numValue = parseFloat(value);

    // Check if valid number
    if (isNaN(numValue)) {
      return { invalidNumber: true };
    }

    // Check minimum value (greater than 0 if entered)
    if (numValue <= 0) {
      return { min: { min: 0.01, actual: numValue } };
    }

    // Check maximum value
    if (numValue > 999) {
      return { max: { max: 999, actual: numValue } };
    }

    // Check format: up to 3 digits before decimal, up to 2 after
    const valueStr = value.toString();
    const parts = valueStr.split('.');

    if (parts[0] && parts[0].length > 3) {
      return { pattern: true };
    }

    if (parts[1] && parts[1].length > 2) {
      return { pattern: true };
    }

    return null;
  }

  get f() {
    return this.form.controls;
  }

  /**
   * Format date for display in DD-MMM-YYYY format
   */
  private formatDate(date: Date | string | null | undefined): string {
    if (!date) return '---';

    const d = new Date(date);
    if (isNaN(d.getTime())) return '---';

    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = d.getFullYear();

    return `${day}-${month}-${year}`;
  }

  get isSaveDisabled(): boolean {
    if (this.isSaving()) return true;

    if (this.mode === 'add') {
      return !this.form.dirty || this.form.invalid;
    }

    if (!this.initialFormValues) return true;
    const currentValues = this.form.getRawValue();
    const hasChanges = JSON.stringify(currentValues) !== JSON.stringify(this.initialFormValues);
    return !hasChanges || this.form.invalid;
  }

  onSave(): void {
    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'termDate');

    if (this.form.invalid) {
      const firstInvalid = document.querySelector('.ng-invalid[formControlName]');
      if (firstInvalid) {
        (firstInvalid as HTMLElement).focus();
      }
      return;
    }

    this.isSaving.set(true);

    const formValues = this.form.getRawValue();
    const volumeVal = formValues.volume ? parseFloat(formValues.volume) : null;

    if (this.mode === 'add') {
      const createPayload: CreateProductTypeAttributeDto = {
        anticoagulantCode: formValues.anticoagulantCode,
        volume: volumeVal,
        productType: formValues.productType,
        attributeGroup: formValues.attributeGroup,
        attributeCode: formValues.attributeCode,
        productClass: formValues.productClass,
        modifierCode: formValues.modifierCode,
        effDate: DateFieldValidationUtility.serializeDateForApi(formValues.effDate) || '',
        termDate: DateFieldValidationUtility.serializeDateForApi(formValues.termDate)
      };

      this.prdtyatService.createProductTypeAttribute(createPayload)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.snackbarService.showSuccess('Product code attribute added successfully.');
            this.emitFormDataAndClose(formValues, volumeVal);
          },
          error: (err) => {
            this.snackbarService.showError(err?.error?.message || 'Failed to save product code attribute.');
            this.isSaving.set(false);
          }
        });
    } else {
      const updatePayload: UpdateProductTypeAttributeDto = {
        attributeGroup: formValues.attributeGroup,
        attributeCode: formValues.attributeCode,
        productClass: formValues.productClass,
        modifierCode: formValues.modifierCode,
        effDate: DateFieldValidationUtility.serializeDateForApi(formValues.effDate),
        termDate: DateFieldValidationUtility.serializeDateForApi(formValues.termDate)
      };

      this.prdtyatService.updateProductTypeAttribute(
        this.data!.productType,
        this.data!.attributeGroup,
        this.data!.attributeCode,
        this.data!.anticoagulantCode,
        this.data!.volume ?? 0,
        updatePayload
      )
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.snackbarService.showSuccess('Product code attribute updated successfully.');
            this.emitFormDataAndClose(formValues, volumeVal);
          },
          error: (err) => {
            this.snackbarService.showError(err?.error?.message || 'Failed to save product code attribute.');
            this.isSaving.set(false);
          }
        });
    }
  }

  private emitFormDataAndClose(formValues: any, volumeVal: number | null): void {
    const formData: ProductTypeAttributeFormData = {
      anticoagulantCode: formValues.anticoagulantCode,
      volume: volumeVal,
      productType: formValues.productType,
      attributeGroup: formValues.attributeGroup,
      attributeCode: formValues.attributeCode,
      productClass: formValues.productClass,
      modifierCode: formValues.modifierCode,
      effDate: DateFieldValidationUtility.serializeDateForApi(formValues.effDate) || '',
      termDate: DateFieldValidationUtility.serializeDateForApi(formValues.termDate)
    };
    this.saveSuccess.emit(formData);
    this.isSaving.set(false);
    this.onClose();
  }

  onAddAndCreateAnother(): void {
    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'termDate');

    if (this.form.invalid) {
      const firstInvalid = document.querySelector('.ng-invalid[formControlName]');
      if (firstInvalid) {
        (firstInvalid as HTMLElement).focus();
      }
      return;
    }

    this.isSaving.set(true);

    const formValues = this.form.getRawValue();
    const volumeVal = formValues.volume ? parseFloat(formValues.volume) : null;

    const payload: CreateProductTypeAttributeDto = {
      anticoagulantCode: formValues.anticoagulantCode,
      volume: volumeVal,
      productType: formValues.productType,
      attributeGroup: formValues.attributeGroup,
      attributeCode: formValues.attributeCode,
      productClass: formValues.productClass,
      modifierCode: formValues.modifierCode,
      effDate: DateFieldValidationUtility.serializeDateForApi(formValues.effDate) || '',
      termDate: DateFieldValidationUtility.serializeDateForApi(formValues.termDate)
    };

    this.prdtyatService.createProductTypeAttribute(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackbarService.showSuccess('Product code attribute added successfully.');

          const formData: ProductTypeAttributeFormData = {
            anticoagulantCode: formValues.anticoagulantCode,
            volume: volumeVal,
            productType: formValues.productType,
            attributeGroup: formValues.attributeGroup,
            attributeCode: formValues.attributeCode,
            productClass: formValues.productClass,
            modifierCode: formValues.modifierCode,
            effDate: DateFieldValidationUtility.serializeDateForApi(formValues.effDate) || '',
            termDate: DateFieldValidationUtility.serializeDateForApi(formValues.termDate)
          };

          this.saveSuccess.emit(formData);
          this.isSaving.set(false);

          this.form.reset();
          this.initialFormValues = null;
          this.lastChangedDateField = null;

          this.anticoagulantSearchCtrl.setValue('');
          this.productTypeSearchCtrl.setValue('');
          this.attributeGroupSearchCtrl.setValue('');
          this.attributeCodeSearchCtrl.setValue('');
          this.productClassSearchCtrl.setValue('');
          this.modifierCodeSearchCtrl.setValue('');

          this.filteredAnticoagulantOptions.set([...this.anticoagulantCodeOptions]);
          this.filteredProductTypeOptions.set([...this.productTypeOptions]);
          this.filteredAttributeGroupOptions.set([...this.attributeGroupOptions]);
          this.filteredAttributeCodeOptions.set([...this.attributeCodeOptions]);
          this.filteredProductClassOptions.set([...this.productClassOptions]);
          this.filteredModifierCodeOptions.set([...this.modifierCodeOptions]);

          this.attributeGroupDescription.set('---');
          this.attributeCodeDescription.set('---');
        },
        error: (err) => {
          this.snackbarService.showError(err?.error?.message || 'Failed to save product code attribute.');
          this.isSaving.set(false);
        }
      });
  }

  onClose(): void {
    this.closePanel.emit();
  }
}
