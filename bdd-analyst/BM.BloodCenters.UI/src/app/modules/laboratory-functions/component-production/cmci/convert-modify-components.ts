import {
  Component,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  inject,
  ChangeDetectorRef,
  signal,
  computed,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSnackBar, MatSnackBarRef, TextOnlySnackBar } from '@angular/material/snack-bar';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import moment from 'moment';

import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { LoginService } from '@shared/services/login.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TablePageEvent, TableSortEvent } from '@shared/interfaces/data-table.interface';
import { UnitIdFieldComponent, UnitIdPostValidateEvent } from '@shared/components/unit-id-field';
import { UnitValidationResponse } from '@shared/components/unit-id-field/unit-id-field.model';
import { UppercaseMomentDateAdapter } from '@shared/date/date-formats';
import { MatDateFormats } from '@angular/material/core';

const DD_MON_YYYY_HH_MM_FORMATS: MatDateFormats = {
  parse: {
    dateInput: [
      'DD-MMM-YYYY HH:mm',
      'DD-MMM-YYYY',
      'DD.MMM.YYYY',
      'DD/MMM/YYYY',
      'DD MMM YYYY',
      'MMDDYYYY',
      'MM/DD/YYYY',
      'MM-DD-YYYY',
      'YYYY-MM-DD',
    ],
  },
  display: {
    dateInput: 'DD-MMM-YYYY HH:mm',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'DD-MMM-YYYY HH:mm',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

import { ComponentChangeApiService } from './services/component-change-api.service';
import {
  ComponentChangeEntry,
  ValidAttributeDto,
  ProductTypeDto,
  UnitValidationResultDto,
  ChangeAttributeRequestDto,
  ReprintLabelRequestDto,
  ProductCodeOption,
  CatalogNumberOption,
  DeriveProductCodeRequestDto,
} from './models/component-change.model';

@Component({
  selector: 'app-convert-modify-components',
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
    PageHeaderWithBreadcrumb,
    DataTable,
    UnitIdFieldComponent,
  ],
  providers: [
    { provide: DateAdapter, useClass: UppercaseMomentDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_HH_MM_FORMATS },
  ],
  templateUrl: './convert-modify-components.html',
  styleUrls: ['./convert-modify-components.scss'],
})
export class ConvertModifyComponentsComponent implements OnInit, OnDestroy {
  // Unique ID generation for accessibility
  private static nextId = 0;
  protected readonly componentId = `convert-modify-components-${ConvertModifyComponentsComponent.nextId++}`;
  // Generate unique IDs for form elements
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  // Dependency injection
  private readonly apiService = inject(ComponentChangeApiService);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly snackbarService = inject(SnackbarService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly headerService = inject(HeaderService);
  private readonly loginService = inject(LoginService);
  private readonly destroy$ = new Subject<void>();

  private entrySavedSnackBarRef: MatSnackBarRef<TextOnlySnackBar> | null = null;

  @ViewChild('unitIdField') unitIdField?: UnitIdFieldComponent;
  @ViewChild('productCodeInput') productCodeInput?: MatSelect;
  @ViewChild('catalogNumberInput') catalogNumberInput?: MatSelect;
  @ViewChild('verifyProductInput') verifyProductInput?: ElementRef<HTMLInputElement>;

  private readonly defaultTitle = 'Convert / Modify Components (ISBT)';
  private readonly functionName = 'CPICHNGE';

  readonly chapterToday = computed(() => {
    const chapterDate = this.chapterTimezoneService.chapterLocalDate();
    return chapterDate?.isValid() ? chapterDate.toDate() : new Date();
  });

  readonly minProcessDate = computed(() => {
    const validation = this.validationResult();
    if (validation?.collectionDate) {
      const collDate = moment(validation.collectionDate);
      if (collDate.isValid()) return collDate.toDate();
    }
    return null;
  });

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: this.defaultTitle, link: null },
    ],
    title: this.defaultTitle,
    subtitle: 'Convert or modify component attributes using ISBT coding.',
    actions: [],
  };

  // Forms
  filterForm!: FormGroup;
  entryForm!: FormGroup;

  // Signal-based state
  productTypes = signal<ProductTypeDto[]>([]);
  attributes = signal<ValidAttributeDto[]>([]);
  selectedProductType = signal<ProductTypeDto | null>(null);
  selectedAttribute = signal<ValidAttributeDto | null>(null);
  validationResult = signal<UnitValidationResultDto | null>(null);
  entries = signal<ComponentChangeEntry[]>([]);
  isProcessing = signal(false);
  isLoadingProductTypes = signal(false);
  isLoadingAttributes = signal(false);
  error = signal<string | null>(null);

  productCodeOptions = signal<ProductCodeOption[]>([]);
  catalogNumberOptions = signal<CatalogNumberOption[]>([]);
  isLoadingProductCodes = signal(false);
  isLoadingCatalogNumbers = signal(false);
  newExpiryDate = signal<string | null>(null);
  labelPrintRequired = signal(true);

  isAddOnlyAttribute = computed(() => this.selectedAttribute()?.attributeType === 'A');

  storedSelectedProductCode = signal<string>('');
  serverDerivedProductCode = signal<string>('');

  derivedProductCode = computed(() => {
    const selectedAttr = this.selectedAttribute();
    if (selectedAttr?.attributeType === 'A') {
      return this.storedSelectedProductCode() || '---';
    }
    return this.serverDerivedProductCode() || '---';
  });

  // Search controls for dropdowns
  readonly productTypeSearchControl = new FormControl('');
  readonly attributeCodeSearchControl = new FormControl('');
  readonly productCodeSearchControl = new FormControl('');
  readonly catalogNumberSearchControl = new FormControl('');

  private readonly productTypeSearch = signal('');
  private readonly attributeCodeSearch = signal('');
  private readonly productCodeSearch = signal('');
  private readonly catalogNumberSearch = signal('');

  // Computed signals
  filteredProductTypes = computed(() => {
    const search = this.productTypeSearch().toUpperCase();
    const types = this.productTypes();
    if (!search) return types;
    return types.filter(
      (p) =>
        p.productType.toUpperCase().includes(search) ||
        p.description.toUpperCase().includes(search),
    );
  });

  productTypeDescription = computed(() => {
    const selected = this.selectedProductType();
    return selected ? selected.description : '---';
  });

  attributeDescription = computed(() => {
    const selected = this.selectedAttribute();
    return selected ? selected.attributeDescription : '---';
  });

  catalogNumberEnabled = computed(() => {
    const attribute = this.selectedAttribute();
    return attribute?.attributeType !== 'M';
  });

  filteredAttributes = computed(() => {
    const search = this.attributeCodeSearch().toUpperCase();
    const attrs = this.attributes();
    if (!search) return attrs;
    return attrs.filter(
      (a) =>
        a.attributeCode.toUpperCase().includes(search) ||
        a.attributeDescription.toUpperCase().includes(search),
    );
  });

  showEntrySection = computed(() => {
    const productType = this.selectedProductType();
    const attribute = this.selectedAttribute();
    return !!productType && !!attribute;
  });

  filteredProductCodes = computed(() => {
    const search = this.productCodeSearch().toUpperCase();
    const codes = this.productCodeOptions();
    if (!search) return codes;
    return codes.filter(
      (p) => p.code.toUpperCase().includes(search) || p.description.toUpperCase().includes(search),
    );
  });

  filteredCatalogNumbers = computed(() => {
    const search = this.catalogNumberSearch().toUpperCase();
    const catalogs = this.catalogNumberOptions();
    if (!search) return catalogs;
    return catalogs.filter((c) => c.catalogNumber.toUpperCase().includes(search));
  });

  entriesCount = computed(() => this.entries().length);

  get isReprintDisabled(): boolean {
    if (this.isProcessing() || !this.validationResult()) return true;
    const f = this.entryForm;
    if (!f) return true;
    const unitId = this.storedParsedUnitId();
    const productCode = f.get('productCode')?.value;
    const processDate = f.get('processDate')?.value;
    const catalogControl = f.get('catalogNumber');
    const catalogFilled = catalogControl?.disabled || !!catalogControl?.value;
    const derived = this.derivedProductCode();
    const hasDerived = !!derived && derived !== '---';
    return !unitId || !productCode || !processDate || !catalogFilled || !hasDerived;
  }

  get isClearAllDisabled(): boolean {
    const entryValues = this.entryForm?.value;
    if (!entryValues) return true;
    const hasEntry = this.storedParsedUnitId() || entryValues.productCode
      || entryValues.processDate || entryValues.catalogNumber || entryValues.verifyProduct;
    const hasValidation = !!this.validationResult();
    return !hasEntry && !hasValidation;
  }

  private currentPageIndex = signal(0);
  private currentPageSize = signal(25);

  paginatedData = computed(() => {
    const data = this.entries();
    const pageIndex = this.currentPageIndex();
    const pageSize = this.currentPageSize();
    const start = pageIndex * pageSize;
    return data.slice(start, start + pageSize);
  });

  dataTableConfig: DataTableConfig<ComponentChangeEntry> = {
    columns: [
      { key: 'unitId', header: 'Unit ID', sortable: true, width: '14%' },
      { key: 'productCode', header: 'Product Code', sortable: false, width: '10%' },
      { key: 'derivedProductCode', header: 'Derived Product Code', sortable: false, width: '13%' },
      { key: 'shortName', header: 'Short Name', sortable: false, width: '10%' },
      {
        key: 'processDate',
        header: 'Process Date',
        sortable: false,
        width: '13%',
        valueFormatter: (value: string) => this.formatProcessDate(value),
      },
      { key: 'catalogNumber', header: 'Catalog Number', sortable: false, width: '13%' },
      { key: 'verifyProduct', header: 'Verify Product', sortable: false, width: '13%' },
      {
        key: 'expiryDate',
        header: 'New Expiry Date',
        sortable: false,
        width: '12%',
        valueFormatter: (value: string) => this.formatProcessDate(value),
      },
    ],
    pagination: {
      pageSize: 25,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50, 100],
      showFirstLastButtons: true,
    },
    stickyHeader: true,
    showPagination: true,
    enableSelection: false,
    emptyMessage: 'No Results to Display',
    emptySubMessage: 'Please enter search criteria to view results',
    loadingMessage: 'Processing...',
  };

  constructor() {
    // Subscribe to search controls
    this.productTypeSearchControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((value) => {
      this.productTypeSearch.set(value || '');
    });

    this.attributeCodeSearchControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((value) => {
      this.attributeCodeSearch.set(value || '');
    });

    this.productCodeSearchControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((value) => {
      this.productCodeSearch.set(value || '');
    });

    this.catalogNumberSearchControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((value) => {
      this.catalogNumberSearch.set(value || '');
    });

    // Update pagination totalRecords when entries change
    effect(() => {
      const count = this.entries().length;
      if (this.dataTableConfig.pagination) {
        this.dataTableConfig.pagination.totalRecords = count;
      }
    });

    // Page header effect
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          ...this.headerConfig,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title || this.defaultTitle, link: null },
          ],
          title: pageData.title || this.defaultTitle,
          subtitle:
            pageData.subtitle || 'Convert or modify component attributes using ISBT coding.',
        };
      }
    });
  }

  ngOnInit(): void {
    this.initializeForms();
    this.loadProductTypes();
    this.subscribeToChapterChanges();
    this.setupFormListeners();
  }

  ngOnDestroy(): void {
    this.dismissEntrySavedSnackbar();
    this.destroy$.next();
    this.destroy$.complete();
  }

  private storedParsedUnitId = signal('');

  private initializeForms(): void {
    this.filterForm = this.fb.group({
      productType: ['', Validators.required],
      attributeCode: [''],
    });

    this.entryForm = this.fb.group({
      productCode: ['', Validators.required],
      processDate: [null, Validators.required],
      catalogNumber: ['', Validators.required],
      verifyProduct: ['', Validators.required],
    });
  }

  private setupFormListeners(): void {
    // Product Type change
    this.filterForm.get('productType')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((productType) => {
      if (productType) {
        const selected = this.productTypes().find((p) => p.productType === productType);
        this.selectedProductType.set(selected || null);
        this.filterForm.get('attributeCode')?.setValue('', { emitEvent: false });
        this.selectedAttribute.set(null);
        this.loadAttributes(productType);
      } else {
        this.selectedProductType.set(null);
        this.attributes.set([]);
        this.selectedAttribute.set(null);
      }
    });

    // Attribute Code change
    this.filterForm.get('attributeCode')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((attributeCode) => {
      this.serverDerivedProductCode.set('');
      if (attributeCode) {
        const selected = this.attributes().find((a) => a.attributeCode === attributeCode);
        this.selectedAttribute.set(selected || null);

        // Disable catalog number for Modifier type, enable for Conversion and Add-only
        const catalogControl = this.entryForm.get('catalogNumber');
        if (selected?.attributeType === 'M') {
          const bagId = this.validationResult()?.bagId;
          if (this.storedParsedUnitId() && !bagId) {
            this.snackbarService.showError('Bag ID is required for modify operation');
          }
          this.catalogNumberOptions.set(bagId ? [{ catalogNumber: bagId, description: '' }] : []);
          catalogControl?.setValue(bagId || '');
          catalogControl?.disable();
        } else {
          catalogControl?.enable();
          const productType = this.filterForm.get('productType')?.value;
          const unitId = this.storedParsedUnitId();
          if (productType && attributeCode && unitId) {
            this.loadCatalogNumbers(unitId, productType);
          }
        }
        catalogControl?.updateValueAndValidity();

        if (this.storedSelectedProductCode()) {
          this.fetchDerivedProductCode();
        }
      } else {
        this.selectedAttribute.set(null);
        this.catalogNumberOptions.set([]);
      }
    });

    // Product Code change — update derived product code
    this.entryForm.get('productCode')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((productCode) => {
      this.storedSelectedProductCode.set(productCode || '');
      this.serverDerivedProductCode.set('');
      if (productCode) {
        this.fetchDerivedProductCode();
      }
    });
  }

  private fetchDerivedProductCode(): void {
    const oldProductCode = this.storedSelectedProductCode();
    const attributeCode = this.filterForm.get('attributeCode')?.value;
    const productType = this.filterForm.get('productType')?.value;
    const selectedAttr = this.selectedAttribute();

    if (!oldProductCode || !attributeCode || !productType) return;
    if (selectedAttr?.attributeType === 'A') return;

    const request: DeriveProductCodeRequestDto = {
      unitId: this.storedParsedUnitId(),
      oldProductCode,
      attributeCode,
      productType,
    };

    this.apiService
      .deriveProductCode(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response?.success && response.newProductCode) {
            this.serverDerivedProductCode.set(response.newProductCode);
          }
        },
        error: (error) => {
          console.error('Error deriving product code:', error);
        },
      });
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.clearAll();
      this.loadProductTypes();
    });
  }

  private loadProductTypes(): void {
    this.isLoadingProductTypes.set(true);
    this.apiService
      .getValidProductTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (productTypes) => {
          this.productTypes.set(productTypes);
          this.isLoadingProductTypes.set(false);
        },
        error: (error) => {
          console.error('Error loading product types:', error);
          this.snackbarService.showError('Failed to load product types. Please try again.');
          this.isLoadingProductTypes.set(false);
        },
      });
  }

  private loadAttributes(productType: string): void {
    this.isLoadingAttributes.set(true);
    this.apiService
      .getValidAttributes(this.functionName, productType)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (attributes) => {
          // Filter out PHER and VENI attribute groups, then deduplicate by attributeCode
          const filteredAttributes = attributes.filter(
            (attr) => attr.attributeGroup !== 'PHER' && attr.attributeGroup !== 'VENI',
          );
          const seen = new Set<string>();
          const uniqueAttributes = filteredAttributes.filter((attr) => {
            if (seen.has(attr.attributeCode)) return false;
            seen.add(attr.attributeCode);
            return true;
          });
          this.attributes.set(uniqueAttributes);
          this.isLoadingAttributes.set(false);
        },
        error: (error) => {
          console.error('Error loading attributes:', error);
          this.snackbarService.showError('Failed to load attributes. Please try again.');
          this.isLoadingAttributes.set(false);
        },
      });
  }

  private loadProductCodes(unitId: string, productType: string): void {
    this.isLoadingProductCodes.set(true);
    this.apiService
      .getProductCodes(unitId, productType)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (codes) => {
          this.productCodeOptions.set(codes);
          this.isLoadingProductCodes.set(false);
          if (codes.length === 0) {
            this.snackbarService.showError('No valid components available for this unit and product type');
          }
        },
        error: (error) => {
          console.error('Error loading product codes:', error);
          this.snackbarService.showError('Failed to load product codes. Please try again.');
          this.isLoadingProductCodes.set(false);
        },
      });
  }

  private loadCatalogNumbers(unitId: string, productType: string): void {
    this.isLoadingCatalogNumbers.set(true);
    this.apiService
      .getCatalogNumbers(unitId, productType)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (catalogs) => {
          this.catalogNumberOptions.set(catalogs);
          this.isLoadingCatalogNumbers.set(false);
        },
        error: (error) => {
          console.error('Error loading catalog numbers:', error);
          this.snackbarService.showError('Failed to load catalog numbers. Please try again.');
          this.isLoadingCatalogNumbers.set(false);
        },
      });
  }

  onUnitPostValidate(event: UnitIdPostValidateEvent): void {
    const parsedUnitId = event.data.parsedUnitId;

    const isDuplicate = this.entries().some((entry) => entry.unitId === parsedUnitId);
    if (isDuplicate) {
      event.reject('This unit already scanned');
      return;
    }

    this.isProcessing.set(true);

    this.apiService
      .validateUnit(parsedUnitId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.isProcessing.set(false);

          if (!result.isValid || !result.isModifiable) {
            event.reject(result.errorMessage || 'Unit cannot be modified');
            return;
          }
          if (result.hasInterdiction) {
            this.snackBar.open(result.interdictionReason || 'Component has active interdiction', 'OK', { duration: 5000 });
          }
          if (result.chapterId && result.chapterId !== this.headerService.getCurrentChapterId()) {
            event.reject('Unit does not belong to the current chapter');
            return;
          }

          this.storedParsedUnitId.set(parsedUnitId);
          this.validationResult.set(result);

          const labelRequired = result.labelPrintRequired !== false;
          this.labelPrintRequired.set(labelRequired);
          const verifyControl = this.entryForm.get('verifyProduct');
          if (!labelRequired) {
            verifyControl?.clearValidators();
          } else {
            verifyControl?.setValidators(Validators.required);
          }
          verifyControl?.updateValueAndValidity();

          const chapterId = this.headerService.getCurrentChapterId();
          if (chapterId) {
            this.chapterTimezoneService.fetchChapterTimezone(chapterId)
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: () => {
                  const freshDateTime = this.chapterTimezoneService.getChapterLocalDateTime();
                  this.entryForm.get('processDate')?.setValue(freshDateTime.toDate());
                },
                error: () => {
                  const fallback = this.chapterTimezoneService.getChapterLocalDateTime();
                  this.entryForm.get('processDate')?.setValue(fallback.toDate());
                },
              });
          } else {
            const chapterDateTime = this.chapterTimezoneService.getChapterLocalDateTime();
            this.entryForm.get('processDate')?.setValue(chapterDateTime.toDate());
          }

          const productType = this.filterForm.get('productType')?.value;
          if (parsedUnitId && productType) {
            this.loadProductCodes(parsedUnitId, productType);
          }

          const attributeCode = this.filterForm.get('attributeCode')?.value;
          const selectedAttr = this.selectedAttribute();
          if (selectedAttr?.attributeType === 'M') {
            const bagId = result.bagId;
            if (!bagId) {
              this.snackbarService.showError('Bag ID is required for modify operation');
            }
            this.catalogNumberOptions.set(bagId ? [{ catalogNumber: bagId, description: '' }] : []);
            const catalogControl = this.entryForm.get('catalogNumber');
            catalogControl?.setValue(bagId || '');
            catalogControl?.disable();
          } else if (productType && attributeCode && parsedUnitId) {
            this.loadCatalogNumbers(parsedUnitId, productType);
          }

          event.confirm();
          setTimeout(() => this.productCodeInput?.focus(), 100);
        },
        error: (error) => {
          this.isProcessing.set(false);
          const body = error?.error;
          const errorMessage = body?.errorResponse?.error || body?.message || error?.message || 'Failed to validate unit. Please try again.';
          event.reject(errorMessage);
        },
      });
  }

  onUnitValidated(_data: UnitValidationResponse): void {}

  onUnitCleared(): void {
    this.storedParsedUnitId.set('');
    this.validationResult.set(null);
    this.storedSelectedProductCode.set('');
    this.serverDerivedProductCode.set('');
    this.productCodeOptions.set([]);
    this.catalogNumberOptions.set([]);
    this.productCodeSearchControl.setValue('');
    this.catalogNumberSearchControl.setValue('');
    this.entryForm.get('productCode')?.setValue('');
    this.entryForm.get('processDate')?.setValue(null);
    this.entryForm.get('catalogNumber')?.setValue('');
    this.entryForm.get('verifyProduct')?.setValue('');
    this.labelPrintRequired.set(true);
    this.entryForm.get('verifyProduct')?.setValidators(Validators.required);
    this.entryForm.get('verifyProduct')?.updateValueAndValidity();
  }

  onProcessDateFocus(): void {
    const control = this.entryForm.get('processDate');
    if (!control?.value) {
      const chapterId = this.headerService.getCurrentChapterId();
      if (chapterId) {
        this.chapterTimezoneService.fetchChapterTimezone(chapterId)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              const freshDateTime = this.chapterTimezoneService.getChapterLocalDateTime();
              control?.setValue(freshDateTime.toDate());
            },
            error: () => {
              const fallback = this.chapterTimezoneService.getChapterLocalDateTime();
              control?.setValue(fallback.toDate());
            },
          });
      } else {
        const chapterDateTime = this.chapterTimezoneService.getChapterLocalDateTime();
        control?.setValue(chapterDateTime.toDate());
      }
    }
  }

  onProcessDateChange(): void {
    const control = this.entryForm.get('processDate');
    if (control?.value) {
      const selected = moment(control.value);
      if (selected.isValid() && selected.hour() === 0 && selected.minute() === 0) {
        const chapterId = this.headerService.getCurrentChapterId();
        if (chapterId) {
          this.chapterTimezoneService.fetchChapterTimezone(chapterId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: () => {
                const freshDateTime = this.chapterTimezoneService.getChapterLocalDateTime();
                selected.hour(freshDateTime.hour()).minute(freshDateTime.minute());
                control.setValue(selected.toDate(), { emitEvent: false });
              },
              error: () => {
                const fallback = this.chapterTimezoneService.getChapterLocalDateTime();
                selected.hour(fallback.hour()).minute(fallback.minute());
                control.setValue(selected.toDate(), { emitEvent: false });
              },
            });
        } else {
          const chapterDateTime = this.chapterTimezoneService.getChapterLocalDateTime();
          selected.hour(chapterDateTime.hour()).minute(chapterDateTime.minute());
          control.setValue(selected.toDate(), { emitEvent: false });
        }
      }

      // Enforce collection date minimum
      const validation = this.validationResult();
      if (validation?.collectionDate) {
        const collDate = moment(validation.collectionDate);
        if (collDate.isValid() && selected.isBefore(collDate)) {
          this.snackbarService.showError('Process Date cannot be before the collection date');
          control.setValue(null);
          return;
        }
      }
    }
  }
  //catalog number change
  onCatalogNumberChange(): void {
    if (!this.labelPrintRequired()) {
      const formValue = this.entryForm.value;
      const unitId = this.storedParsedUnitId();
      const catalogFilled = this.entryForm.get('catalogNumber')?.disabled || !!formValue.catalogNumber;
      if (unitId && formValue.productCode && formValue.processDate && catalogFilled) {
        this.submitEntry();
      }
    }
  }

  onVerifyProductScan(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.trim();
    if (value) {
      this.submitEntry();
    }
  }

  onVerifyProductKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      const value = (event.target as HTMLInputElement).value.trim();
      if (value) {
        this.submitEntry();
      }
    }
  }

  private submitEntry(): void {
    if (this.isProcessing()) return;

    const formValue = this.entryForm.getRawValue();
    const unitId = this.storedParsedUnitId();
    const validation = this.validationResult();
    const derivedProductCode = this.derivedProductCode();
    const verifyProduct = formValue.verifyProduct?.trim();

    if (!verifyProduct && this.labelPrintRequired()) return;

    if (this.labelPrintRequired() && verifyProduct && verifyProduct.toUpperCase() !== derivedProductCode?.toUpperCase()) {
      this.snackbarService.showError('Verify Product does not match the derived product code');
      this.entryForm.get('verifyProduct')?.setValue('');
      this.verifyProductInput?.nativeElement.focus();
      return;
    }

    if (this.entryForm.invalid) {
      Object.keys(this.entryForm.controls).forEach((key) => {
        this.entryForm.get(key)?.markAsTouched();
      });
      return;
    }

    // Process Date validations (Oracle: errors 8060, 8030, 9743)
    const processDateValue = formValue.processDate ? moment(formValue.processDate) : null;
    if (!processDateValue || !processDateValue.isValid()) {
      this.snackbarService.showError('Process Date is required');
      return;
    }

    const chapterNow = this.chapterTimezoneService.getChapterLocalDate();
    if (processDateValue.isAfter(chapterNow, 'day')) {
      this.snackbarService.showError('Process Date cannot be in the future');
      return;
    }

    if (validation?.collectionDate) {
      const collDate = moment(validation.collectionDate);
      if (collDate.isValid() && processDateValue.isBefore(collDate)) {
        this.snackbarService.showError('Process Date cannot be before the collection date');
        return;
      }
    }

    if (validation?.componentInsertDate) {
      // processDateValue is chapter-local; componentInsertDate (INSERT_DATS) is
      // stored in GMT. Convert processDate to GMT so both sides match, then
      // compare date portion only (matches Oracle Forms TRUNC() behaviour).
      const processDateGmt = this.chapterTimezoneService.convertLocalToGmt(processDateValue);
      const insertDateGmt = moment.utc(validation.componentInsertDate);
      if (insertDateGmt.isValid() && processDateGmt.isBefore(insertDateGmt, 'day')) {
        this.snackbarService.showError('Process Date cannot be before the component creation date');
        return;
      }
    }

    this.isProcessing.set(true);

    const selectedAttribute = this.selectedAttribute();
    const request: ChangeAttributeRequestDto = {
      unitId,
      attributeCode: this.filterForm.get('attributeCode')?.value,
      productType: this.filterForm.get('productType')?.value,
      attributeGroup: selectedAttribute?.attributeGroup,
      oldProductCode: validation?.productCode || formValue.productCode || null,
      newProductCode: derivedProductCode !== '---' ? derivedProductCode : null,
      catalogNumber: formValue.catalogNumber || null,
      processDate: processDateValue.format('YYYY-MM-DDTHH:mm:ss'),
      collectionDate: validation?.collectionDate || null,
    };

    this.apiService
      .changeAttribute(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isProcessing.set(false);
          if (response?.success) {
            const processDate = formValue.processDate
              ? moment(formValue.processDate).format('DD-MMM-YYYY HH:mm')
              : moment().format('DD-MMM-YYYY HH:mm');
            const expiryDate = response.newExpiryDate
              ? moment(response.newExpiryDate).format('DD-MMM-YYYY HH:mm')
              : '';
            const entry: ComponentChangeEntry = {
              unitId,
              productCode: formValue.productCode,
              derivedProductCode: derivedProductCode || formValue.productCode,
              shortName: validation?.productShortName || '',
              processDate,
              catalogNumber: formValue.catalogNumber || '',
              verifyProduct: verifyProduct,
              expiryDate,
            };
            this.entries.update((entries) => [...entries, entry]);
            this.showEntrySavedSnackbar();
            this.newExpiryDate.set(response.newExpiryDate || null);
          } else {
            this.snackbarService.showError(response?.message || 'Failed to change component');
          }

          // Reset entry form for next unit, keep filter selections
          this.unitIdField?.clear();
          this.storedParsedUnitId.set('');
          this.entryForm.reset();
          this.validationResult.set(null);
          this.newExpiryDate.set(null);
          this.storedSelectedProductCode.set('');
          this.serverDerivedProductCode.set('');
          this.productCodeOptions.set([]);
          this.catalogNumberOptions.set([]);
          this.productCodeSearchControl.setValue('');
          this.catalogNumberSearchControl.setValue('');
          this.labelPrintRequired.set(true);
          this.entryForm.get('verifyProduct')?.setValidators(Validators.required);
          this.entryForm.get('verifyProduct')?.updateValueAndValidity();

          // Re-disable catalog number if modifier attribute is still selected
          if (this.selectedAttribute()?.attributeType === 'M') {
            this.entryForm.get('catalogNumber')?.disable();
          }
        },
        error: (error) => {
          this.isProcessing.set(false);
          const body = error?.error;
          const errorMessage = body?.item?.message || body?.message || body?.errorResponse?.error || error?.message || 'Failed to change component';
          this.snackbarService.showError(errorMessage);
        },
      });
  }

  onPageChange(event: TablePageEvent): void {
    this.currentPageIndex.set(event.pageIndex);
    this.currentPageSize.set(event.pageSize);
    if (this.dataTableConfig.pagination) {
      this.dataTableConfig.pagination.pageIndex = event.pageIndex;
      this.dataTableConfig.pagination.pageSize = event.pageSize;
    }
  }

  onSortChange(event: TableSortEvent): void {
    this.dataTableConfig = {
      ...this.dataTableConfig,
      sortConfig: {
        column: event.column,
        direction: event.direction,
      },
    };

    this.entries.update(entries => {
      const sorted = [...entries];
      const key = event.column as keyof ComponentChangeEntry;
      if (event.direction === 'A') {
        sorted.sort((a, b) => String(a[key] ?? '').localeCompare(String(b[key] ?? '')));
      } else if (event.direction === 'D') {
        sorted.sort((a, b) => String(b[key] ?? '').localeCompare(String(a[key] ?? '')));
      }
      return sorted;
    });
  }

  onReprint(): void {
    const validation = this.validationResult();
    const productCode = this.entryForm.get('productCode')?.value;

    // Guard 1: Product code must be selected (Oracle error 9741)
    if (!productCode) {
      this.snackbarService.showError('Cannot reprint label — no product code selected');
      return;
    }

    // Guard 2: Verification must NOT have started (Oracle TR 1200)
    const verifyProduct = this.entryForm.get('verifyProduct')?.value?.trim();
    if (verifyProduct) {
      this.snackbarService.showError('Cannot reprint label — product verification already started');
      return;
    }

    // Guard 3: Unit must be validated
    if (!validation) {
      this.snackbarService.showError('Cannot reprint label — no unit validated');
      return;
    }

    // Guard 4: Derived product code must be available (Oracle KEY-MENU: new_product_code IS NOT NULL)
    const derived = this.derivedProductCode();
    if (!derived || derived === '---') {
      this.snackbarService.showError('Cannot reprint label — new product code has not been derived');
      return;
    }

    this.isProcessing.set(true);

    const request: ReprintLabelRequestDto = {
      unitId: this.storedParsedUnitId(),
      productCode: validation.productCode || productCode,
      productType: this.filterForm.get('productType')?.value,
      oldProductCode: validation.productCode || '',
      attributeGroup: this.selectedAttribute()?.attributeGroup,
      attributeCode: this.filterForm.get('attributeCode')?.value,
      processDate: this.entryForm.get('processDate')?.value
        ? moment(this.entryForm.get('processDate')?.value).format('YYYY-MM-DDTHH:mm:ss')
        : null,
      collectionDate: validation.collectionDate,
    };

    this.apiService
      .reprintLabel(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isProcessing.set(false);
          if (response?.success) {
            this.snackbarService.showSuccess(response.message || 'Label reprinted successfully');
          } else {
            this.snackbarService.showError(response?.message || 'Failed to reprint label');
          }
        },
        error: (error) => {
          this.isProcessing.set(false);
          const body = error?.error;
          const errorMessage = body?.item?.message || body?.message || body?.errorResponse?.error || error?.message || 'Failed to reprint label';
          this.snackbarService.showError(errorMessage);
        },
      });
  }

  clearFilters(): void {
    this.filterForm.reset();
    this.selectedProductType.set(null);
    this.selectedAttribute.set(null);
    this.attributes.set([]);
    this.productTypeSearchControl.setValue('');
    this.attributeCodeSearchControl.setValue('');
    this.clearAll();
  }

  clearAll(): void {
    this.unitIdField?.clear();
    this.storedParsedUnitId.set('');
    this.entryForm.reset();
    this.validationResult.set(null);
    this.error.set(null);
    this.newExpiryDate.set(null);
    this.storedSelectedProductCode.set('');
    this.serverDerivedProductCode.set('');
    this.productCodeOptions.set([]);
    this.catalogNumberOptions.set([]);
    this.productCodeSearchControl.setValue('');
    this.catalogNumberSearchControl.setValue('');
    this.labelPrintRequired.set(true);
    this.entryForm.get('verifyProduct')?.setValidators(Validators.required);
    this.entryForm.get('verifyProduct')?.updateValueAndValidity();

    // Re-disable catalog number if modifier attribute is still selected
    if (this.selectedAttribute()?.attributeType === 'M') {
      this.entryForm.get('catalogNumber')?.disable();
    }
  }

  private showEntrySavedSnackbar(): void {
    this.dismissEntrySavedSnackbar();

    const count = this.entries().length;
    const message = count === 1 ? '1 Entry Saved' : `${count} Entries Saved`;

    this.entrySavedSnackBarRef = this.snackBar.open(message, 'DISMISS', {
      horizontalPosition: 'end',
      verticalPosition: 'top',
      duration: 0,
      panelClass: ['success-snackbar'],
    });

    this.entrySavedSnackBarRef.onAction().subscribe(() => {
      this.entrySavedSnackBarRef?.dismiss();
      this.entrySavedSnackBarRef = null;
    });
  }

  private dismissEntrySavedSnackbar(): void {
    if (this.entrySavedSnackBarRef) {
      this.entrySavedSnackBarRef.dismiss();
      this.entrySavedSnackBarRef = null;
    }
  }

  protected formatProcessDate(value: string): string {
    if (!value || value === '​') return value;
    const m = moment(value, 'DD-MMM-YYYY HH:mm');
    return m.isValid() ? m.format('DD-MMM-YYYY HH:mm') : value;
  }

  get f() {
    return this.filterForm.controls;
  }

  get e() {
    return this.entryForm.controls;
  }
}
