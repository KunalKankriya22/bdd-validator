import { Component, OnInit, OnDestroy, ViewChild, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { A11yModule } from '@angular/cdk/a11y';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';

import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { UnitIdFieldComponent, UnitValidationResponse } from '@shared/components/unit-id-field';
import { UnitIdPostValidateEvent } from '@shared/components/unit-id-field/unit-id-field.component';

import { ComponentsMadeFromUnitIsbtService } from './services/components-made-from-unit-isbt.service';
import { ProductCodeDialogComponent } from './product-code-dialog/product-code-dialog';
import {
  ProductTypeItem,
  AttributeItem,
  CatalogNumberItem,
  ProductCodeOption,
  ComponentRow,
  ProductDeterminationResult
} from './models/components-made-from-unit-isbt.model';
import {
  extractErrorMessage,
  shouldClearUnitField,
  isWeightRequired,
  shouldShowAttributes,
  isValidWeight,
  calculateVolume,
  hasProperty
} from './utils/error-handler.util';

@Component({
  selector: 'app-components-made-from-unit-isbt',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    NgxMatSelectSearchModule,
    A11yModule,
    UnitIdFieldComponent,
    PageHeaderWithBreadcrumb,
    ProductCodeDialogComponent
  ],
  templateUrl: './components-made-from-unit-isbt.html',
  styleUrl: './components-made-from-unit-isbt.scss'
})
export class ComponentsMadeFromUnitIsbtComponent implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `cpicom2-${ComponentsMadeFromUnitIsbtComponent.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  private readonly service: ComponentsMadeFromUnitIsbtService;
  private readonly snackBar: MatSnackBar;
  private readonly pageHeaderService: PageHeaderService;
  private readonly headerService: HeaderService;
  private readonly destroy$ = new Subject<void>();

  @ViewChild(UnitIdFieldComponent) unitIdField!: UnitIdFieldComponent;

  private readonly defaultTitle = 'Components Made from Unit (ISBT)';

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
    actions: []
  };

  // Header section controls
  protected readonly productTypeControl = new FormControl<string | null>(null, [Validators.required]);
  protected readonly productTypeSearchCtrl = new FormControl<string>('');
  protected readonly attributeControl = new FormControl<string | null>({ value: null, disabled: true });
  protected readonly attributeSearchCtrl = new FormControl<string>('');

  // Data entry row 1 controls
  protected readonly catalogNumberControl = new FormControl<string | null>({ value: null, disabled: true }, [Validators.required]);
  protected readonly productCodeControl = new FormControl<string | null>({ value: null, disabled: true });

  // Data entry row 2 controls
  protected readonly verifyProductControl = new FormControl<string | null>({ value: null, disabled: true });
  protected readonly weightControl = new FormControl<string | null>({ value: null, disabled: true });

  // Dropdown data signals
  protected readonly productTypes = signal<ProductTypeItem[]>([]);
  protected readonly filteredProductTypes = signal<ProductTypeItem[]>([]);
  protected readonly attributes = signal<AttributeItem[]>([]);
  protected readonly filteredAttributes = signal<AttributeItem[]>([]);
  protected readonly catalogNumbers = signal<CatalogNumberItem[]>([]);
  protected readonly filteredCatalogNumbers = signal<CatalogNumberItem[]>([]);

  // State signals
  protected readonly selectedProductType = signal<ProductTypeItem | null>(null);
  protected readonly selectedAttribute = signal<AttributeItem | null>(null);
  protected readonly unitIdValid = signal(false);
  protected readonly currentUnitId = signal<string | null>(null);
  protected readonly collectionDate = signal<string | null>(null);
  protected readonly currentProductCode = signal<string | null>(null);
  protected readonly productDescription = signal<string>('');
  protected readonly productShortName = signal<string>('');
  protected readonly specificGravity = signal<number>(1.0);
  protected readonly labelPrintRequired = signal(false);
  protected readonly weightRequired = signal(false);
  protected readonly computedVolume = signal<string>('');
  protected readonly isLoading = signal(false);
  protected readonly entryCount = signal(0);
  protected readonly timeLimitWarning = signal<string | null>(null);

  // Results table
  protected readonly components = signal<ComponentRow[]>([]);
  protected readonly displayedColumns = ['unitId', 'catalogNumber', 'productCode', 'description', 'verifyProduct', 'weight', 'volume'];
  protected currentPageSize = 25;
  protected readonly pageSizeOptions = [10, 25, 50, 100];
  protected currentPage = 0;

  // Product code dialog
  protected readonly productCodeDialogOpen = signal(false);
  protected readonly productCodeOptions = signal<ProductCodeOption[]>([]);
  private dialogTriggerElement: HTMLElement | null = null;
  protected readonly hasMultipleProducts = signal(false);

  // Sorting
  protected readonly sortState = signal<{ active: string; direction: 'asc' | 'desc' | '' }>({
    active: '',
    direction: ''
  });

  // Computed: show attribute fields when product type has attribFlag='Y' per API documentation
  protected readonly showAttributeFields = computed(() => {
    const pt = this.selectedProductType();
    return shouldShowAttributes(pt?.attribFlag);
  });

  // Computed: paginated data
  protected readonly sortedData = computed(() => {
    const data = this.components();
    const sort = this.sortState();
    if (!sort.active || sort.direction === '') return data;

    return data.slice().sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      const valA = (a as unknown as Record<string, unknown>)[sort.active];
      const valB = (b as unknown as Record<string, unknown>)[sort.active];
      if (valA == null && valB == null) return 0;
      if (valA == null) return isAsc ? -1 : 1;
      if (valB == null) return isAsc ? 1 : -1;
      return (valA < valB ? -1 : valA > valB ? 1 : 0) * (isAsc ? 1 : -1);
    });
  });

  constructor() {
    // Inject services in constructor to avoid circular dependency issues
    this.service = inject(ComponentsMadeFromUnitIsbtService);
    this.snackBar = inject(MatSnackBar);
    this.pageHeaderService = inject(PageHeaderService);
    this.headerService = inject(HeaderService);

    this.initializeHeaderConfig();
    this.setupEffects();
  }

  private setupEffects(): void {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          ...this.headerConfig,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title || this.defaultTitle, link: null }
          ],
          title: pageData.title || this.defaultTitle,
          subtitle: pageData.subtitle || ''
        };
      }
    });

    // Enable attribute field when product type supports it
    effect(() => {
      if (this.showAttributeFields()) {
        this.attributeControl.enable({ emitEvent: false });
      } else {
        this.attributeControl.disable({ emitEvent: false });
        this.attributeControl.reset(null, { emitEvent: false });
        this.selectedAttribute.set(null);
      }
    });

    // Enable catalog number when unit ID is valid
    effect(() => {
      if (this.unitIdValid() && this.selectedProductType()) {
        this.catalogNumberControl.enable({ emitEvent: false });
      } else {
        this.catalogNumberControl.disable({ emitEvent: false });
      }
    });

    // Enable verify product when product code is determined and label print required
    effect(() => {
      if (this.currentProductCode() && this.labelPrintRequired()) {
        this.verifyProductControl.enable({ emitEvent: false });
      } else {
        this.verifyProductControl.disable({ emitEvent: false });
      }
    });

    // Enable weight when product code is determined and weight required
    effect(() => {
      if (this.currentProductCode() && this.weightRequired()) {
        this.weightControl.enable({ emitEvent: false });
      } else {
        this.weightControl.disable({ emitEvent: false });
      }
    });
  }

  ngOnInit(): void {
    this.loadProductTypes();
    this.subscribeToChapterChanges();
    this.setupSearchFilters();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeHeaderConfig(): void {
    this.headerConfig = {
      breadcrumbs: [
        { label: 'Home', link: '/home' },
        { label: this.defaultTitle, link: null }
      ],
      title: this.defaultTitle,
      subtitle: '',
      actions: []
    };
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.handleChapterChange());
  }

  private setupSearchFilters(): void {
    // Filter Product Type options
    this.productTypeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.filterProductTypes(this.productTypeSearchCtrl.value || '');
      });

    // Filter Attribute options
    this.attributeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.filterAttributes(this.attributeSearchCtrl.value || '');
      });
  }

  private handleChapterChange(): void {
    this.resetAllFields();
    this.components.set([]);
    this.entryCount.set(0);
    this.currentPage = 0;
    this.sortState.set({ active: '', direction: '' });
    this.loadProductTypes();
  }

  private loadProductTypes(): void {
    this.isLoading.set(true);
    this.service.getProductTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (types) => {
          this.productTypes.set(types);
          this.filteredProductTypes.set(types);
          this.isLoading.set(false);
        },
        error: () => { this.showError('Failed to load product types'); this.isLoading.set(false); }
      });
  }

  // --- Header Section Handlers ---

  private filterProductTypes(value: string): void {
    if (!value) {
      this.filteredProductTypes.set(this.productTypes());
      return;
    }
    const lower = value.toLowerCase();
    this.filteredProductTypes.set(
      this.productTypes().filter(pt =>
        pt.productTypeCode.toLowerCase().includes(lower)
      )
    );
  }

  protected onProductTypeChange(productTypeCode: string): void {
    const selected = this.productTypes().find(pt => pt.productTypeCode === productTypeCode);
    if (!selected) return;

    this.selectedProductType.set(selected);
    this.weightRequired.set(isWeightRequired(selected.weightRequired));

    // Reset downstream fields + attribute
    this.resetEntryFields();
    this.attributeControl.reset(null, { emitEvent: false });
    this.selectedAttribute.set(null);
    if (this.unitIdField) this.unitIdField.clear();

    // Load attributes if supported
    if (selected.attribFlag === 'Y') {
      this.isLoading.set(true);
      this.service.getAttributes(productTypeCode)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (attrs) => {
            this.attributes.set(attrs);
            this.filteredAttributes.set(attrs);
            this.isLoading.set(false);
          },
          error: (err) => {
            this.handleApiError(err, 'Failed to load attributes');
            this.isLoading.set(false);
          }
        });
    } else {
      this.attributes.set([]);
      this.filteredAttributes.set([]);
      this.selectedAttribute.set(null);
    }
  }

  private filterAttributes(value: string): void {
    if (!value) {
      this.filteredAttributes.set(this.attributes());
      return;
    }
    const lower = value.toLowerCase();
    this.filteredAttributes.set(
      this.attributes().filter(a =>
        a.attribCode.toLowerCase().includes(lower) ||
        a.attribDesc.toLowerCase().includes(lower)
      )
    );
  }

  protected onAttributeChange(attribCode: string): void {
    const selected = this.attributes().find(a => a.attribCode === attribCode);
    this.selectedAttribute.set(selected || null);
  }

  // --- Data Entry Handlers ---

  /**
   * Step 3: Unit ID Post-Validation Handler
   * Called after shared unit-id-field completes its validation
   * Chains to screen-specific POST /validate-unit endpoint
   */
  protected onUnitPostValidate(event: UnitIdPostValidateEvent): void {
    if (this.isLoading()) return;

    const productType = this.selectedProductType()?.productTypeCode;
    if (!productType) {
      event.reject('Please select a product type first');
      return;
    }

    // Use parsedUnitId from shared validation (never display value)
    const parsedUnitId = event.data.parsedUnitId;
    this.currentUnitId.set(parsedUnitId);

    this.isLoading.set(true);
    this.service.validateUnit(parsedUnitId, productType)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          // Confirm to shared component - shows green checkmark
          event.confirm();

          // Store collection date for all subsequent API calls
          this.unitIdValid.set(true);
          this.collectionDate.set(result.collDate);

          // Step 4: Load catalog numbers
          this.loadCatalogNumbers(parsedUnitId);
        },
        error: (error) => {
          // Reject to shared component with error message
          const errorMessage = extractErrorMessage(error, 'Failed to validate unit');
          event.reject(errorMessage);

          // Clear unit-related fields on specific errors
          const errorCode = error?.error?.errorCode || error?.errorCode;
          if (shouldClearUnitField(errorCode)) {
            this.resetUnitFields();
          }

          this.isLoading.set(false);
        }
      });
  }

  protected onUnitCleared(): void {
    this.unitIdValid.set(false);
    this.currentUnitId.set(null);
    this.collectionDate.set(null);
    this.resetEntryFields();
  }

  private loadCatalogNumbers(unitId: string): void {
    const productType = this.selectedProductType()?.productTypeCode;
    if (!productType) { this.isLoading.set(false); return; }

    this.isLoading.set(true);
    this.service.getCatalogNumbers(unitId, productType)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (catalogs) => {
          this.catalogNumbers.set(catalogs);
          this.filteredCatalogNumbers.set(catalogs);
          this.isLoading.set(false);
        },
        error: (error) => {
          this.handleApiError(error, 'Failed to load catalog numbers');
          this.isLoading.set(false);
        }
      });
  }

  protected onCatalogNumberSelected(catalogNumber: string): void {
    this.catalogNumberControl.setValue(catalogNumber);
    this.determineProductCode(catalogNumber);
  }

  protected onCatalogNumberEnter(): void {
    const value = this.catalogNumberControl.value?.trim();
    if (!value) return;
    if (!this.isValidCatalogNumber(value)) {
      this.showError('Invalid catalog number');
      this.catalogNumberControl.reset(null);
      this.filteredCatalogNumbers.set(this.catalogNumbers());
      return;
    }
    this.determineProductCode(value);
  }

  protected onCatalogNumberBlur(): void {
    const value = this.catalogNumberControl.value?.trim();
    if (!value) return;
    if (!this.isValidCatalogNumber(value)) {
      this.showError('Invalid catalog number');
      this.catalogNumberControl.reset(null);
      this.filteredCatalogNumbers.set(this.catalogNumbers());
    }
  }

  private isValidCatalogNumber(value: string): boolean {
    return this.catalogNumbers().some(c => c.catalogNumber === value);
  }

  protected filterCatalogNumbers(value: string): void {
    if (!value) {
      this.filteredCatalogNumbers.set(this.catalogNumbers());
      return;
    }
    const lower = value.toLowerCase();
    this.filteredCatalogNumbers.set(
      this.catalogNumbers().filter(c => c.catalogNumber.toLowerCase().includes(lower))
    );
  }

  private determineProductCode(catalogNumber: string): void {
    if (this.isLoading()) return;
    const unitId = this.currentUnitId();
    const productType = this.selectedProductType()?.productTypeCode;
    const collDate = this.collectionDate();
    if (!unitId || !productType || !collDate) return;

    const attribCode = this.selectedAttribute()?.attribCode;

    this.isLoading.set(true);
    this.service.determineProductCode(unitId, collDate, productType, catalogNumber, attribCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.handleProductDetermination(result);
          this.isLoading.set(false);
        },
        error: (error) => {
          this.handleApiError(error, 'Failed to determine product code');
          this.isLoading.set(false);
        }
      });
  }

  private handleProductDetermination(result: ProductDeterminationResult): void {
    // Check for time limit warning
    if (result.timeLimitWarning) {
      this.timeLimitWarning.set(result.timeLimitWarning);
      this.showError(result.timeLimitWarning);
    }

    // Set label print flag from API response
    this.labelPrintRequired.set(result.labelPrintRequired ?? false);

    // Single product auto-resolved
    if (!result.isMultiple && result.productCode) {
      this.currentProductCode.set(result.productCode);
      this.productDescription.set(result.productDesc || '');
      this.productShortName.set(result.productShortName || '');
      this.productCodeControl.setValue(result.productCode);
      this.specificGravity.set(result.specificGravity || 1.0);
      this.hasMultipleProducts.set(false);

      if (!this.labelPrintRequired() && !this.weightRequired()) {
        this.commitComponent();
      }
    }
    // Multiple products - user must choose
    else if (result.isMultiple && result.productOptions && result.productOptions.length > 0) {
      this.productCodeOptions.set(result.productOptions);
      this.hasMultipleProducts.set(true);
      this.dialogTriggerElement = document.activeElement as HTMLElement;
      this.productCodeDialogOpen.set(true);
    } else {
      this.showError('No valid product combination found');
    }
  }

  protected onProductCodeDialogSave(option: ProductCodeOption): void {
    this.currentProductCode.set(option.productCode);
    this.productDescription.set(option.productDesc || '');
    this.productShortName.set(option.productShortName || '');
    this.productCodeControl.setValue(option.productCode);
    this.specificGravity.set(option.specificGravity || 1.0);
    this.productCodeDialogOpen.set(false);
    this.dialogTriggerElement?.focus();
    this.dialogTriggerElement = null;
  }

  protected onProductCodeDialogClose(): void {
    this.productCodeDialogOpen.set(false);
    this.dialogTriggerElement?.focus();
    this.dialogTriggerElement = null;
  }

  protected onProductCodeClick(): void {
    if (this.hasMultipleProducts() && this.productCodeOptions().length > 0) {
      this.dialogTriggerElement = document.activeElement as HTMLElement;
      this.productCodeDialogOpen.set(true);
    }
  }

  protected onVerifyProductBlur(): void {
    if (!this.labelPrintRequired()) return;
    const verifyValue = this.verifyProductControl.value?.trim();
    if (!verifyValue) return;
    const expectedCode = this.currentProductCode();
    if (expectedCode && verifyValue !== expectedCode) {
      this.showError('Verification does not match the assigned product code');
      this.verifyProductControl.reset(null);
    }
  }

  protected onVerifyProductEnter(): void {
    const verifyValue = this.verifyProductControl.value?.trim();
    const expectedCode = this.currentProductCode();
    if (verifyValue && expectedCode && verifyValue !== expectedCode) {
      this.showError('Verification does not match the assigned product code');
      this.verifyProductControl.reset(null);
      return;
    }

    if (!this.weightRequired()) {
      this.commitComponent();
    }
  }

  protected onWeightInput(value: string): void {
    if (!value || !value.trim()) {
      this.computedVolume.set('');
      return;
    }
    const weight = parseFloat(value);
    if (isNaN(weight) || !isValidWeight(weight)) {
      this.computedVolume.set('');
      return;
    }
    const volume = calculateVolume(weight, this.specificGravity());
    this.computedVolume.set(volume !== null ? volume.toString() : '');
  }

  protected onWeightEnter(): void {
    const weightStr = this.weightControl.value?.trim();
    if (!weightStr) return;

    const weight = parseFloat(weightStr);

    // Validate weight using utility function per API documentation (1-999.99 range)
    if (!isValidWeight(weight)) {
      this.showError('Weight must be between 1 and 999.99 grams');
      this.weightControl.reset(null);
      this.computedVolume.set('');
      return;
    }

    // Calculate volume using utility function
    const volume = calculateVolume(weight, this.specificGravity());
    if (volume !== null) {
      this.computedVolume.set(volume.toString());
    } else {
      this.computedVolume.set('');
    }

    this.commitComponent();
  }

  private commitComponent(): void {
    if (this.isLoading()) return;
    const unitId = this.currentUnitId();
    const productCode = this.currentProductCode();
    const productType = this.selectedProductType()?.productTypeCode;
    const catalogNumber = this.catalogNumberControl.value;
    const collDate = this.collectionDate();

    if (!unitId || !productCode || !productType || !catalogNumber || !collDate) {
      this.showError('Required fields are missing');
      return;
    }

    this.isLoading.set(true);

    this.service.createComponent({
      unitId,
      collectionDate: collDate,
      productTypeCode: productType,
      productCode,
      catalogNumber,
      attribCode: this.selectedAttribute()?.attribCode,
      componentWeight: this.weightControl.value ? parseFloat(this.weightControl.value) : undefined,
      verifyProductCode: this.verifyProductControl.value || undefined
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (response) => {
        // Response format per API documentation:
        // { success: true, statusCode: 201, message: "Component successfully added",
        //   data: [{ UnitId, ProductCode, CatalogNumber, Weight, ExpiryDate, ComponentPrefix, CmvStatus }] }
        const apiData = response?.data?.[0];
        if (apiData) {
          const newRow: ComponentRow = {
            unitId: apiData.UnitId || unitId,
            catalogNumber: apiData.CatalogNumber || catalogNumber,
            productCode: apiData.ProductCode || productCode,
            productDesc: this.productDescription(),
            productType: this.selectedProductType()?.productTypeCode,
            // verifyProduct: show blank when verify field was disabled (labelPrintRequired=false)
            verifyProduct: this.labelPrintRequired() ? (this.verifyProductControl.value || '') : '',
            weight: hasProperty(apiData, 'Weight') ? apiData.Weight : (this.weightControl.value ? parseFloat(this.weightControl.value) : undefined),
            volume: this.computedVolume() ? parseFloat(this.computedVolume()) : undefined,
            insertDats: new Date().toISOString(),
            componentPrefix: apiData.ComponentPrefix
          };
          this.components.update(rows => [newRow, ...rows]);
        }
        this.entryCount.update(c => c + 1);
        this.showSuccess(response?.message || `${this.entryCount()} Entries saved`);

        this.resetEntryFields();
        if (this.unitIdField) this.unitIdField.clear();

        this.isLoading.set(false);
      },
      error: (error) => {
        this.handleApiError(error, 'Failed to save component');
        this.isLoading.set(false);
      }
    });
  }

  protected onReprint(): void {
    if (this.isLoading()) return;
    const unitId = this.currentUnitId();
    const productCode = this.currentProductCode();
    const productType = this.selectedProductType()?.productTypeCode;
    const collDate = this.collectionDate();

    if (!unitId || !productCode || !productType || !collDate) {
      this.showError('Unit ID, Product Code, Product Type, and Collection Date are required for reprint');
      return;
    }

    this.isLoading.set(true);
    this.service.reprintLabel({ unitId, productCode, productType, collDate })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Response format per API documentation:
          // { success: true, message: "Label data generated", statusCode: 200,
          //   data: [{ unitId, productCode, productDesc, productType, collDate, expiryDate,
          //            cmvStatus, preprintedLabel, timeLimitWarning }] }
          const labelData = response?.data?.[0];
          if (labelData?.preprintedLabel) {
            this.showSuccess('Product has preprinted label — no printing needed');
          } else {
            const warning = labelData?.timeLimitWarning ? ` | Warning: ${labelData.timeLimitWarning}` : '';
            this.showSuccess(`Label sent to printer${warning}`);
          }
          this.isLoading.set(false);
        },
        error: (error) => {
          this.handleApiError(error, 'Failed to reprint label');
          this.isLoading.set(false);
        }
      });
  }

  protected onClearAll(): void {
    this.resetEntryFields();
    if (this.unitIdField) this.unitIdField.clear();
  }

  private resetEntryFields(): void {
    this.unitIdValid.set(false);
    this.currentUnitId.set(null);
    this.collectionDate.set(null);
    this.catalogNumberControl.reset(null, { emitEvent: false });
    this.productCodeControl.reset(null, { emitEvent: false });
    this.verifyProductControl.reset(null, { emitEvent: false });
    this.weightControl.reset(null, { emitEvent: false });
    this.currentProductCode.set(null);
    this.productDescription.set('');
    this.productShortName.set('');
    this.computedVolume.set('');
    this.catalogNumbers.set([]);
    this.filteredCatalogNumbers.set([]);
    this.labelPrintRequired.set(false);
    this.specificGravity.set(1.0);
    this.hasMultipleProducts.set(false);
    this.productCodeOptions.set([]);
  }

  private resetAllFields(): void {
    this.resetEntryFields();
    this.productTypeControl.reset(null, { emitEvent: false });
    this.attributeControl.reset(null, { emitEvent: false });
    this.selectedProductType.set(null);
    this.selectedAttribute.set(null);
    this.attributes.set([]);
    this.filteredAttributes.set([]);
    this.weightRequired.set(false);
    if (this.unitIdField) this.unitIdField.clear();
  }

  // --- Table ---

  protected getPaginatedData(): ComponentRow[] {
    const sorted = this.sortedData();
    const start = this.currentPage * this.currentPageSize;
    return sorted.slice(start, start + this.currentPageSize);
  }

  protected onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.currentPageSize = event.pageSize;
  }

  protected onSortChange(sort: Sort): void {
    this.sortState.set({ active: sort.active, direction: sort.direction as 'asc' | 'desc' | '' });
  }

  // --- Notifications ---

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'DISMISS', {
      duration: 8000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'DISMISS', {
      duration: 10000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }

  /**
   * Handles API errors with comprehensive error code extraction
   * Based on API documentation error handling pattern
   *
   * @param error - API error object
   * @param fallback - Fallback message if error details not found
   * @param shouldClearUnit - Whether to clear unit field on specific errors
   */
  private handleApiError(error: HttpErrorResponse | Error, fallback: string, shouldClearUnit: boolean = false): void {
    const displayMessage = extractErrorMessage(error, fallback);
    this.showError(displayMessage);

    // Clear unit field for specific validation errors per documentation
    if (shouldClearUnit && error instanceof HttpErrorResponse) {
      const errorCode = error.error?.errorCode;
      if (shouldClearUnitField(errorCode)) {
        this.resetUnitFields();
        if (this.unitIdField) {
          this.unitIdField.clear();
        }
      }
    }
  }

  /**
   * Resets unit-related fields after validation error
   */
  private resetUnitFields(): void {
    this.unitIdValid.set(false);
    this.collectionDate.set(null);
    this.catalogNumbers.set([]);
    this.catalogNumberControl.reset();
    this.catalogNumberControl.disable();
    this.productCodeControl.reset();
    this.productCodeControl.disable();
    this.verifyProductControl.reset();
    this.verifyProductControl.disable();
    this.weightControl.reset();
    this.weightControl.disable();
  }
}
