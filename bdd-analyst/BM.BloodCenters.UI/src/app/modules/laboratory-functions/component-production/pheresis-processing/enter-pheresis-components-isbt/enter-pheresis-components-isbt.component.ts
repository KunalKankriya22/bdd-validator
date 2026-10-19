import { Component, OnInit, OnDestroy, ViewChild, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';

import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { UnitIdFieldComponent } from '@shared/components/unit-id-field';
import { UnitIdPostValidateEvent } from '@shared/components/unit-id-field/unit-id-field.component';
import { SnackbarService } from '@shared/services/snackbar.service';

import { PheresisComponentApiService } from './services/pheresis-component-api.service';
import { ProductsDescriptionsDialogComponent } from './products-descriptions-dialog/products-descriptions-dialog';
import {
  ProductTypeItem,
  AttributeItem,
  CatalogNumberItem,
  ProductCodeOption,
  ComponentRow,
  ProductDeterminationResult,
} from './models/pheresis-component.model';
import {
  extractErrorMessage,
  shouldClearUnitField,
  isWeightRequired,
  shouldShowAttributes,
  isValidWeight,
  isValidVolume,
  calculateVolume,
  hasProperty,
  parseIsbtCatalogScan,
  parseWeightScan,
} from './utils/error-handler.util';

@Component({
  selector: 'app-enter-pheresis-components-isbt',
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
    UnitIdFieldComponent,
    PageHeaderWithBreadcrumb,
    ProductsDescriptionsDialogComponent,
  ],
  templateUrl: './enter-pheresis-components-isbt.component.html',
  styleUrls: ['./enter-pheresis-components-isbt.component.scss'],
})
export class EnterPheresisComponentsIsbtComponent implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `pheresis-isbt-${EnterPheresisComponentsIsbtComponent.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;

  private readonly service = inject(PheresisComponentApiService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly headerService = inject(HeaderService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroy$ = new Subject<void>();

  // Store returnUrl for navigation back to Pathogen Reduction
  private returnUrl: string | null = null;

  @ViewChild(UnitIdFieldComponent) unitIdField!: UnitIdFieldComponent;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
    actions: [],
  };

  // Header section controls
  protected readonly productTypeControl = new FormControl<string | null>(null, [Validators.required]);
  protected readonly productTypeSearchCtrl = new FormControl<string>('');
  protected readonly attributeControl = new FormControl<string | null>({ value: null, disabled: true });
  protected readonly attributeSearchCtrl = new FormControl<string>('');

  // Data entry row controls
  protected readonly bucControl = new FormControl<number | null>({ value: 1, disabled: true });
  protected readonly catalogNumberControl = new FormControl<string | null>({ value: null, disabled: true }, [Validators.required]);
  protected readonly productCodeControl = new FormControl<string | null>({ value: null, disabled: true });
  protected readonly verifyProductControl = new FormControl<string | null>({ value: null, disabled: true });
  protected readonly volumeControl = new FormControl<string | null>({ value: null, disabled: true }, [Validators.required]);
  protected readonly weightControl = new FormControl<string | null>({ value: null, disabled: true }, [Validators.required]);
  protected readonly anticoagControl = new FormControl<string | null>({ value: null, disabled: true });

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
  protected readonly currentUnitIdWithCheckDigit = signal<string | null>(null);
  protected readonly collectionDate = signal<string | null>(null);
  protected readonly currentBuc = signal<number>(0);
  protected readonly currentProductCode = signal<string | null>(null);
  protected readonly productDescription = signal<string>('');
  protected readonly productShortName = signal<string>('');
  protected readonly specificGravity = signal<number>(1.0);
  protected readonly labelPrintRequired = signal(false);
  protected readonly weightRequired = signal(false);
  protected readonly computedVolume = signal<string>('');
  protected readonly verifyProductUsed = signal(false);
  protected readonly isLoading = signal(false);
  protected readonly entryCount = signal(0);
  protected readonly labelAlreadyPrinted = signal(false);
  protected readonly productCodeDetermined = signal(false);

  // Results table
  protected readonly components = signal<ComponentRow[]>([]);
  protected readonly displayedColumns = [
    'unitId', 'buc', 'catalogNumber', 'product', 'productDescription',
    'verifyProduct', 'volume', 'weight', 'anticoagVolume',
  ];
  protected currentPageSize = 10;
  protected readonly pageSizeOptions = [10, 25, 50];
  protected currentPage = 0;

  // Product code dialog
  protected readonly productCodeDialogOpen = signal(false);
  protected readonly productCodeOptions = signal<ProductCodeOption[]>([]);
  protected readonly hasMultipleProducts = signal(false);

  // Sorting
  protected readonly sortState = signal<{ active: string; direction: 'asc' | 'desc' | '' }>({
    active: '',
    direction: '',
  });

  protected readonly showAttributeFields = computed(() => {
    const pt = this.selectedProductType();
    return shouldShowAttributes(pt?.attribFlag);
  });

  protected readonly bucEditable = computed(() => {
    const pt = this.selectedProductType()?.productTypeCode;
    return this.unitIdValid() && (pt === 'PLT' || pt === 'PLRF');
  });

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
    this.initializeHeaderConfig();
    this.setupEffects();
  }

  private readonly defaultTitle = 'Enter Pheresis Components - ISBT';

  private setupEffects(): void {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        // Preserve breadcrumbs if navigated from Pathogen Reduction
        const breadcrumbs = this.returnUrl || history.state?.fromPathogenReduction
          ? this.headerConfig.breadcrumbs // Keep existing breadcrumbs with Pathogen Reduction Manager
          : [
              { label: 'Home', link: '/home' },
              { label: pageData.title || this.defaultTitle, link: null },
            ];

        this.headerConfig = {
          ...this.headerConfig,
          breadcrumbs,
          title: pageData.title || this.defaultTitle,
          subtitle: pageData.subtitle || 'Allows the initial definition of ISBT apheresis products.',
        };
      }
    });

    effect(() => {
      if (this.showAttributeFields()) {
        this.attributeControl.enable({ emitEvent: false });
      } else {
        this.attributeControl.disable({ emitEvent: false });
        this.attributeControl.reset(null, { emitEvent: false });
        this.selectedAttribute.set(null);
      }
    });

    effect(() => {
      if (this.bucEditable()) {
        this.bucControl.enable({ emitEvent: false });
      } else {
        this.bucControl.disable({ emitEvent: false });
        this.bucControl.setValue(1, { emitEvent: false });
      }
    });

    effect(() => {
      if (this.unitIdValid() && this.selectedProductType() && !this.productCodeDetermined()) {
        this.catalogNumberControl.enable({ emitEvent: false });
      } else {
        this.catalogNumberControl.disable({ emitEvent: false });
      }
    });

    effect(() => {
      if (this.currentProductCode() && this.labelPrintRequired()) {
        this.verifyProductControl.enable({ emitEvent: false });
      } else {
        this.verifyProductControl.disable({ emitEvent: false });
      }
    });

    effect(() => {
      if (this.currentProductCode()) {
        this.volumeControl.enable({ emitEvent: false });
        this.weightControl.enable({ emitEvent: false });
      } else {
        this.volumeControl.disable({ emitEvent: false });
        this.weightControl.disable({ emitEvent: false });
      }
    });

    effect(() => {
      if (this.currentProductCode()) {
        this.anticoagControl.enable({ emitEvent: false });
      } else {
        this.anticoagControl.disable({ emitEvent: false });
      }
    });
  }

  ngOnInit(): void {
    // Check if navigated from Pathogen Reduction
    this.checkNavigationState();

    this.loadProductTypes();
    this.subscribeToChapterChanges();
    this.setupSearchFilters();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Check if navigated from Pathogen Reduction and update breadcrumbs accordingly
   * Uses query params pattern (similar to verify-control-values)
   */
  private checkNavigationState(): void {
    // Check for returnUrl query param (indicates navigation from another screen)
    const queryParams = this.route.snapshot.queryParams;
    const state = history.state;

    if (queryParams['returnUrl']) {
      this.returnUrl = queryParams['returnUrl'];
      this.initializeHeaderConfigWithPathogenReduction();
    } else if (state?.fromPathogenReduction) {
      // Fallback to state-based detection
      this.initializeHeaderConfigWithPathogenReduction();
    } else {
      this.initializeHeaderConfig();
    }
  }

  /**
   * Initialize header with Pathogen Reduction in breadcrumb
   */
  private initializeHeaderConfigWithPathogenReduction(): void {
    this.headerConfig = {
      breadcrumbs: [
        { label: 'Home', link: '/home' },
        {
          label: 'Pathogen Reduction Manager',
          link: '/laboratory-functions/component-production/pathogen-reduction/pathogen-reduction-manager'
        },
        { label: this.defaultTitle, link: null },
      ],
      title: this.defaultTitle,
      subtitle: 'Allows the initial definition of ISBT apheresis products.',
      showBackButton: true,
      onBackClick: () => this.navigateToPathogenReduction(),
      actions: [],
    };
  }

  /**
   * Navigate back to Pathogen Reduction Manager with state
   * Uses returnUrl pattern (similar to verify-control-values)
   */
  navigateToPathogenReduction(): void {
    if (this.returnUrl) {
      // Navigate to the returnUrl which includes query params for state restoration
      this.router.navigateByUrl(this.returnUrl);
    } else {
      // Fallback to base path
      this.router.navigate(['/laboratory-functions/component-production/pathogen-reduction/pathogen-reduction-manager']);
    }
  }

  private initializeHeaderConfig(): void {
    this.headerConfig = {
      breadcrumbs: [
        { label: 'Home', link: '/home' },
        { label: this.defaultTitle, link: null },
      ],
      title: this.defaultTitle,
      subtitle: '',
      actions: [],
    };
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.handleChapterChange());
  }

  private setupSearchFilters(): void {
    this.productTypeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.filterProductTypes(this.productTypeSearchCtrl.value || '');
      });

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
        error: () => {
          this.showError('Failed to load product types');
          this.isLoading.set(false);
        },
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
      this.productTypes().filter(
        (pt) => pt.productTypeCode.toLowerCase().includes(lower) || pt.productTypeDesc.toLowerCase().includes(lower)
      )
    );
  }

  protected onProductTypeChange(productTypeCode: string): void {
    const selected = this.productTypes().find((pt) => pt.productTypeCode === productTypeCode);
    if (!selected) return;

    this.selectedProductType.set(selected);
    this.weightRequired.set(isWeightRequired(selected.weightRequired));

    this.resetEntryFields();
    this.attributeControl.reset(null, { emitEvent: false });
    this.selectedAttribute.set(null);
    if (this.unitIdField) this.unitIdField.clear();

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
          },
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
      this.attributes().filter(
        (a) => a.attribCode.toLowerCase().includes(lower) || a.attribDesc.toLowerCase().includes(lower)
      )
    );
  }

  protected onAttributeChange(attribCode: string): void {
    const selected = this.attributes().find((a) => a.attribCode === attribCode);
    this.selectedAttribute.set(selected || null);
  }

  // --- BUC Field ---

  protected onBucEnter(): void {
    this.validateBuc();
  }

  protected onBucBlur(): void {
    this.validateBuc();
  }

  private validateBuc(): void {
    const val = this.bucControl.value;
    if (val === null || val === undefined || val < 1 || val > 9) {
      this.showError('Error 0129: Bags used must be between 1 and 9');
      this.bucControl.setValue(1, { emitEvent: false });
      this.currentBuc.set(1);
      return;
    }
    this.currentBuc.set(val);
  }

  // --- Data Entry Handlers ---

  protected onUnitPostValidate(event: UnitIdPostValidateEvent): void {
    if (this.isLoading()) return;

    const productType = this.selectedProductType()?.productTypeCode;
    if (!productType) {
      event.reject('Please select a product type first');
      return;
    }

    const parsedUnitId = event.data.parsedUnitId;
    const checkDigit = event.data.checkDigit;

    // Store both parsed unit ID (for API calls) and display version with check digit
    // Note: checkDigit already includes the hyphen prefix (e.g., "-H")
    this.currentUnitId.set(parsedUnitId);
    this.currentUnitIdWithCheckDigit.set(checkDigit ? `${parsedUnitId}${checkDigit}` : parsedUnitId);

    this.isLoading.set(true);
    this.service.validateUnit(parsedUnitId, productType)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          event.confirm();
          this.unitIdValid.set(true);
          this.collectionDate.set(result.collDate);
          this.currentBuc.set(1);
          this.bucControl.setValue(1, { emitEvent: false });
          this.loadCatalogNumbers(parsedUnitId);
        },
        error: (error) => {
          const errorMessage = extractErrorMessage(error, 'Failed to validate unit');
          this.showError(errorMessage);
          event.reject('');
          const errorCode = error?.error?.errorCode || error?.errorCode;
          if (shouldClearUnitField(errorCode)) {
            this.resetUnitFields();
          }
          this.isLoading.set(false);
        },
      });
  }

  protected onUnitCleared(): void {
    this.unitIdValid.set(false);
    this.currentUnitId.set(null);
    this.currentUnitIdWithCheckDigit.set(null);
    this.collectionDate.set(null);
    this.currentBuc.set(0);
    this.resetEntryFields();
  }

  private loadCatalogNumbers(unitId: string): void {
    const productType = this.selectedProductType()?.productTypeCode;
    if (!productType) {
      this.isLoading.set(false);
      return;
    }

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
        },
      });
  }

  protected onCatalogNumberSelected(catalogNumber: string): void {
    this.catalogNumberControl.setValue(catalogNumber);
    this.determineProductCode(catalogNumber);
  }

  protected onCatalogNumberEnter(): void {
    const rawValue = this.catalogNumberControl.value?.trim();
    if (!rawValue) {
      this.showError('Catalog Number is required');
      return;
    }
    const value = parseIsbtCatalogScan(rawValue) || rawValue;
    if (value !== rawValue) {
      this.catalogNumberControl.setValue(value, { emitEvent: false });
    }
    if (this.catalogNumbers().length === 0) return;
    if (!this.isValidCatalogNumber(value)) {
      this.showError('Error 9719: Catalog number not valid for this unit/product type');
      this.catalogNumberControl.reset(null);
      this.filteredCatalogNumbers.set(this.catalogNumbers());
      return;
    }
    this.determineProductCode(value);
  }

  protected onCatalogNumberBlur(): void {
    const rawValue = this.catalogNumberControl.value?.trim();
    if (!rawValue || this.catalogNumbers().length === 0) return;
    const value = parseIsbtCatalogScan(rawValue) || rawValue;
    if (value !== rawValue) {
      this.catalogNumberControl.setValue(value, { emitEvent: false });
    }
    if (!this.isValidCatalogNumber(value)) {
      this.catalogNumberControl.reset(null);
      this.filteredCatalogNumbers.set(this.catalogNumbers());
    }
  }

  private isValidCatalogNumber(value: string): boolean {
    return this.catalogNumbers().some((c) => c.catalogNumber === value);
  }

  protected filterCatalogNumbers(value: string): void {
    if (!value) {
      this.filteredCatalogNumbers.set(this.catalogNumbers());
      return;
    }
    const lower = value.toLowerCase();
    this.filteredCatalogNumbers.set(
      this.catalogNumbers().filter((c) => c.catalogNumber.toLowerCase().includes(lower))
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
        },
      });
  }

  private handleProductDetermination(result: ProductDeterminationResult): void {
    if (result.timeLimitWarning) {
      this.showError(result.timeLimitWarning);
      return;
    }

    this.labelPrintRequired.set(result.labelPrintRequired ?? false);

    if (result.productCode && (!result.isMultiple || !result.productOptions?.length)) {
      this.currentProductCode.set(result.productCode);
      this.productDescription.set(result.productDesc || '');
      this.productShortName.set(result.productShortName || '');
      this.productCodeControl.setValue(result.productCode);
      this.specificGravity.set(result.specificGravity || 1.0);
      this.hasMultipleProducts.set(false);
      if (result.labelPrintRequired) {
        this.labelAlreadyPrinted.set(true);
      }
      // Set flag to disable catalog number field once product is determined
      this.productCodeDetermined.set(true);
      // Focus on Verify Product field if label print is required, otherwise focus on Volume
      this.focusNextFieldAfterProduct(result.labelPrintRequired ?? false);
    } else if (result.isMultiple && result.productOptions && result.productOptions.length > 0) {
      this.productCodeOptions.set(result.productOptions);
      this.hasMultipleProducts.set(true);
      this.productCodeDialogOpen.set(true);
    } else {
      this.showError('No valid product combination found');
    }
  }

  protected onProductCodeDialogCommit(options: ProductCodeOption[]): void {
    if (options.length > 0) {
      const first = options[0];
      this.currentProductCode.set(first.productCode);
      this.productDescription.set(first.productDesc || '');
      this.productShortName.set(first.productShortName || '');
      this.productCodeControl.setValue(first.productCode);
      this.specificGravity.set(first.specificGravity || 1.0);
      // Set flag to disable catalog number field once product is selected from dialog
      this.productCodeDetermined.set(true);
    }
    this.productCodeDialogOpen.set(false);
    // Focus on Verify Product field if label print is required, otherwise focus on Volume
    this.focusNextFieldAfterProduct(this.labelPrintRequired());
  }

  private focusNextFieldAfterProduct(labelPrintRequired: boolean): void {
    // Use setTimeout to ensure DOM is updated before focusing
    setTimeout(() => {
      if (labelPrintRequired && !this.verifyProductControl.disabled) {
        // Focus on Verify Product field
        const verifyInput = document.querySelector('.verify-field input') as HTMLInputElement;
        if (verifyInput) {
          verifyInput.focus();
        }
      } else {
        // Focus on Volume field
        const volumeInput = document.querySelector('.volume-field input') as HTMLInputElement;
        if (volumeInput) {
          volumeInput.focus();
        }
      }
    }, 100);
  }

  protected onProductCodeDialogClose(): void {
    this.productCodeDialogOpen.set(false);
  }

  protected onProductCodeClick(): void {
    if (this.hasMultipleProducts() && this.productCodeOptions().length > 0) {
      this.productCodeDialogOpen.set(true);
    }
  }

  protected onVerifyProductBlur(): void {
    if (!this.labelPrintRequired()) return;
    const verifyValue = this.verifyProductControl.value?.trim();
    if (!verifyValue) return;
    const expectedCode = this.currentProductCode();
    if (expectedCode && verifyValue !== expectedCode) {
      this.showError('Error 9728: Verified product code does not match');
      this.verifyProductControl.reset(null);
      // Refocus on the verify product field after error
      setTimeout(() => {
        const verifyInput = document.querySelector('.verify-field input') as HTMLInputElement;
        if (verifyInput) {
          verifyInput.focus();
        }
      }, 100);
    }
  }

  protected onVerifyProductEnter(): void {
    const verifyValue = this.verifyProductControl.value?.trim();
    const expectedCode = this.currentProductCode();
    if (verifyValue && expectedCode && verifyValue !== expectedCode) {
      this.showError('Error 9728: Verified product code does not match');
      this.verifyProductControl.reset(null);
      // Keep focus on verify product field after error
      setTimeout(() => {
        const verifyInput = document.querySelector('.verify-field input') as HTMLInputElement;
        if (verifyInput) {
          verifyInput.focus();
        }
      }, 100);
      return;
    }
    if (verifyValue && expectedCode && verifyValue === expectedCode) {
      this.verifyProductUsed.set(true);
      // Move to Volume field after successful verification
      setTimeout(() => {
        const volumeInput = document.querySelector('.volume-field input') as HTMLInputElement;
        if (volumeInput) {
          volumeInput.focus();
        }
      }, 100);
    }
  }

  protected onVolumeInput(value: string): void {
    if (!value || !value.trim()) {
      this.weightControl.setValue(null, { emitEvent: false });
      return;
    }
    const volume = parseFloat(value);
    if (isNaN(volume) || !isValidVolume(volume)) {
      this.weightControl.setValue(null, { emitEvent: false });
      return;
    }
    const sg = this.specificGravity();
    if (sg && sg > 0) {
      const weight = Math.round(volume * sg * 100) / 100;
      this.weightControl.setValue(weight.toString(), { emitEvent: false });
    }
  }

  protected onVolumeEnter(): void {
    this.validateVolume();
  }

  protected onVolumeBlur(): void {
    this.validateVolume();
  }

  private validateVolume(): void {
    const volStr = this.volumeControl.value?.trim();
    if (!volStr) return;
    const volume = parseFloat(volStr);
    if (isNaN(volume) || !isValidVolume(volume)) {
      this.showError('Volume must be greater than zero and not exceed 999.99');
      this.volumeControl.reset(null);
      this.weightControl.setValue(null, { emitEvent: false });
      return;
    }
    const sg = this.specificGravity();
    if (sg && sg > 0) {
      const weight = Math.round(volume * sg * 100) / 100;
      this.weightControl.setValue(weight.toString(), { emitEvent: false });
    }
  }

  protected onWeightInput(value: string): void {
    if (!value || !value.trim()) {
      this.computedVolume.set('');
      this.volumeControl.setValue(null, { emitEvent: false });
      return;
    }
    const parsedWeight = parseWeightScan(value);
    const weight = parsedWeight ?? parseFloat(value);
    if (parsedWeight !== null && parsedWeight.toString() !== value.trim()) {
      this.weightControl.setValue(parsedWeight.toString(), { emitEvent: false });
    }
    if (isNaN(weight) || !isValidWeight(weight)) {
      this.computedVolume.set('');
      this.volumeControl.setValue(null, { emitEvent: false });
      return;
    }
    const volume = calculateVolume(weight, this.specificGravity());
    const volStr = volume !== null ? volume.toString() : '';
    this.computedVolume.set(volStr);
    this.volumeControl.setValue(volStr || null, { emitEvent: false });
  }

  protected onWeightEnter(): void {
    this.validateWeight();
    // After weight validation, move focus to anticoag field (don't auto-commit)
    if (this.weightControl.valid && this.weightControl.value) {
      // Focus will move naturally via tab order to anticoag field
      const anticoagInput = document.querySelector(`#${this.elementId('anticoag')}`) as HTMLInputElement;
      if (anticoagInput) {
        anticoagInput.focus();
      }
    }
  }

  protected onWeightBlur(): void {
    this.validateWeight();
  }

  private validateWeight(): void {
    const weightStr = this.weightControl.value?.trim();
    if (!weightStr) return;

    const weight = parseFloat(weightStr);
    if (!isValidWeight(weight)) {
      this.showError('Error 0250: Weight must be greater than zero');
      this.weightControl.reset(null);
      this.computedVolume.set('');
      this.volumeControl.setValue(null, { emitEvent: false });
      return;
    }

    const volume = calculateVolume(weight, this.specificGravity());
    if (volume !== null) {
      this.computedVolume.set(volume.toString());
      this.volumeControl.setValue(volume.toString(), { emitEvent: false });
    } else {
      this.computedVolume.set('');
    }
  }

  protected onAnticoagEnter(): void {
    this.validateAndCommitAnticoag();
  }

  protected onAnticoagBlur(event?: FocusEvent): void {
    // Don't commit if user is navigating backwards (Shift+Tab)
    // The relatedTarget will be the element that is receiving focus
    if (event?.relatedTarget) {
      const targetElement = event.relatedTarget as HTMLElement;
      // Check if focus is moving to a field that comes before Anticoag
      // (Weight, Volume, Verify Product, Product Code, Catalog, etc.)
      const anticoagField = document.querySelector(`#${this.elementId('anticoag')}`);
      if (anticoagField && targetElement) {
        const anticoagIndex = Array.from(document.querySelectorAll('input, button, select')).indexOf(anticoagField);
        const targetIndex = Array.from(document.querySelectorAll('input, button, select')).indexOf(targetElement);
        if (targetIndex < anticoagIndex) {
          // User is navigating backwards, don't commit
          return;
        }
      }
    }

    // Validate and commit on blur (when user tabs forward)
    // Only commit if we have all required fields filled
    const hasRequiredFields = this.currentUnitId() && this.currentProductCode() &&
                               this.selectedProductType()?.productTypeCode &&
                               this.catalogNumberControl.value &&
                               (this.volumeControl.value || this.weightControl.value);

    if (hasRequiredFields) {
      this.validateAndCommitAnticoag();
    }
  }

  private validateAnticoagValue(anticoagStr: string): boolean {
    const val = parseFloat(anticoagStr);
    if (isNaN(val)) {
      this.showError('Error 1707: Anticoagulant volume must be numeric');
      this.anticoagControl.reset(null);
      return false;
    }
    if (val <= 0) {
      this.showError('Error 0330: Anticoagulant volume must be greater than zero');
      this.anticoagControl.reset(null);
      return false;
    }
    if (val !== Math.floor(val)) {
      this.showError('Error 1372: Anticoagulant volume must be a whole number');
      this.anticoagControl.reset(null);
      return false;
    }
    if (val > 999) {
      this.showError('Error 4313: Anticoagulant volume format invalid — must not exceed 999');
      this.anticoagControl.reset(null);
      return false;
    }
    return true;
  }

  private validateAndCommitAnticoag(): void {
    const anticoagStr = this.anticoagControl.value?.trim();
    // Validate if anticoag has value
    if (anticoagStr && !this.validateAnticoagValue(anticoagStr)) {
      return;
    }
    // Commit regardless of whether anticoag is filled (it's optional)
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

    const volValue = this.volumeControl.value ? parseFloat(this.volumeControl.value) : undefined;
    const wgtValue = this.weightControl.value ? parseFloat(this.weightControl.value) : undefined;

    if (!volValue && !wgtValue) {
      this.showError('Either volume or weight must be provided');
      return;
    }

    if (wgtValue !== undefined && wgtValue <= 0) {
      this.showError('Error 0250: Weight must be greater than zero');
      return;
    }

    const anticoagStr = this.anticoagControl.value?.trim();
    const anticoagVolume = anticoagStr ? parseFloat(anticoagStr) : undefined;

    this.isLoading.set(true);

    this.service.createComponent({
      unitId,
      collectionDate: collDate,
      productTypeCode: productType,
      productCode,
      catalogNumber,
      attribCode: this.selectedAttribute()?.attribCode,
      bagsUsed: this.bucEditable() ? (this.bucControl.value ?? 1) : 1,
      volume: this.volumeControl.value ? parseFloat(this.volumeControl.value) : undefined,
      componentWeight: this.weightControl.value ? parseFloat(this.weightControl.value) : undefined,
      verifyProductCode: this.verifyProductControl.value || undefined,
      anticoagVolume,
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const apiData = response?.data?.[0];
          if (apiData) {
            const newRow: ComponentRow = {
              unitId: this.currentUnitIdWithCheckDigit() || apiData.UnitId || unitId,
              buc: apiData.Buc ?? this.currentBuc(),
              catalogNumber: apiData.CatalogNumber || catalogNumber,
              productCode: apiData.ProductCode || productCode,
              productDesc: this.productDescription(),
              productType: this.selectedProductType()?.productTypeCode,
              verifyProduct: this.labelPrintRequired()
                ? (this.verifyProductControl.value || '')
                : '',
              weight: hasProperty(apiData, 'Weight')
                ? apiData.Weight
                : (this.weightControl.value ? parseFloat(this.weightControl.value) : undefined),
              volume: hasProperty(apiData, 'Volume')
                ? apiData.Volume
                : (this.computedVolume() ? parseFloat(this.computedVolume()) : undefined),
              anticoagVolume: hasProperty(apiData, 'AnticoagVolume')
                ? apiData.AnticoagVolume
                : anticoagVolume,
              insertDats: new Date().toISOString(),
              componentPrefix: apiData.ComponentPrefix,
            };
            this.components.update((rows) => [newRow, ...rows]);
          }
          this.entryCount.update((c) => c + 1);
          this.showSuccess(response?.message || 'Component successfully created');

          this.resetEntryFields();
          if (this.unitIdField) this.unitIdField.clear();

          // Focus back on Unit ID field for next entry
          setTimeout(() => {
            if (this.unitIdField?.unitIdInput?.nativeElement) {
              this.unitIdField.unitIdInput.nativeElement.focus();
            }
          }, 100);

          this.isLoading.set(false);
        },
        error: (error) => {
          this.handleApiError(error, 'Failed to save component');
          this.isLoading.set(false);
        },
      });
  }

  protected onReprint(): void {
    if (this.isLoading()) return;

    const unitId = this.currentUnitId();
    const productCode = this.currentProductCode();
    const productType = this.selectedProductType()?.productTypeCode;
    const collDate = this.collectionDate();

    if (!unitId || !productCode || !productType || !collDate) {
      this.showError('Error 9741: Required fields missing for label reprint');
      return;
    }

    const verifyValue = this.verifyProductControl.value?.trim();
    if (verifyValue) {
      this.showError('Error 9741: Cannot reprint — verify product code field is in use');
      return;
    }

    this.isLoading.set(true);
    this.service.reprintLabel({ unitId, productCode, productType, collDate })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
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
        },
      });
  }

  protected onClearEntry(): void {
    this.resetEntryFields();
    if (this.unitIdField) this.unitIdField.clear();
  }

  protected onClearForm(): void {
    this.resetAllFields();
    this.components.set([]);
    this.entryCount.set(0);
    this.currentPage = 0;
    this.sortState.set({ active: '', direction: '' });
    this.loadProductTypes();
  }

  private resetEntryFields(): void {
    this.unitIdValid.set(false);
    this.currentUnitId.set(null);
    this.currentUnitIdWithCheckDigit.set(null);
    this.collectionDate.set(null);
    this.currentBuc.set(0);
    this.bucControl.setValue(1, { emitEvent: false });
    this.catalogNumberControl.reset(null, { emitEvent: false });
    this.productCodeControl.reset(null, { emitEvent: false });
    this.verifyProductControl.reset(null, { emitEvent: false });
    this.volumeControl.reset(null, { emitEvent: false });
    this.weightControl.reset(null, { emitEvent: false });
    this.anticoagControl.reset(null, { emitEvent: false });
    this.currentProductCode.set(null);
    this.productDescription.set('');
    this.productShortName.set('');
    this.computedVolume.set('');
    this.verifyProductUsed.set(false);
    this.labelAlreadyPrinted.set(false);
    this.catalogNumbers.set([]);
    this.filteredCatalogNumbers.set([]);
    this.labelPrintRequired.set(false);
    this.specificGravity.set(1.0);
    this.hasMultipleProducts.set(false);
    this.productCodeOptions.set([]);
    this.productCodeDetermined.set(false);
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
    this.snackbarService.showSuccess(message);
  }

  private showError(message: string): void {
    this.snackbarService.showError(message);
  }

  private handleApiError(error: any, fallback: string): void {
    const displayMessage = extractErrorMessage(error, fallback);
    this.showError(displayMessage);
  }

  private resetUnitFields(): void {
    this.unitIdValid.set(false);
    this.collectionDate.set(null);
    this.currentBuc.set(0);
    this.bucControl.setValue(1, { emitEvent: false });
    this.bucControl.disable({ emitEvent: false });
    this.catalogNumbers.set([]);
    this.catalogNumberControl.reset();
    this.catalogNumberControl.disable();
    this.productCodeControl.reset();
    this.productCodeControl.disable();
    this.verifyProductControl.reset();
    this.verifyProductControl.disable();
    this.volumeControl.reset();
    this.volumeControl.disable();
    this.weightControl.reset();
    this.weightControl.disable();
    this.anticoagControl.reset();
    this.anticoagControl.disable();
  }
}
