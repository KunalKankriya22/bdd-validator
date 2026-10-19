import { Component, OnInit, OnDestroy, ViewChild, inject, signal, computed, effect, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil, startWith } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import moment, { Moment } from 'moment';

import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { UnitIdFieldComponent, UnitValidationResponse } from '@shared/components/unit-id-field';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';

import { ConvertSpikedBagService } from './services/convert-spiked-bag.service';
import {
  ProcessCode,
  ProductType,
  AttributeGroup,
  AttributeCode,
  CatalogNumber,
  ProductCodeOption,
  ConversionHistoryRow,
  DeriveProductRequest,
  DeriveProductResponse,
  ProductOption,
  AttributeGroupForProduct,
  AttributeTypeForProduct
} from './models/convert-spiked-bag.model';
import { DateTimePickerDialogComponent } from './datetime-picker-dialog/datetime-picker-dialog.component';

@Component({
  selector: 'app-convert-component-into-spiked-bag',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatProgressSpinnerModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatDialogModule,
    NgxMatSelectSearchModule,
    UnitIdFieldComponent,
    PageHeaderWithBreadcrumb,
    DatePipe
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './convert-component-into-spiked-bag.html',
  styleUrl: './convert-component-into-spiked-bag.scss'
})
export class ConvertComponentIntoSpikedBagComponent implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `convert-spiked-bag-${ConvertComponentIntoSpikedBagComponent.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;
  protected readonly Math = Math; // For template access to Math.ceil in pagination

  private readonly service = inject(ConvertSpikedBagService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly headerService = inject(HeaderService);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);
  private readonly dialog = inject(MatDialog);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();
  private chapterTimezoneCheckInterval: any = null;

  @ViewChild(UnitIdFieldComponent) unitIdField!: UnitIdFieldComponent;

  private readonly defaultTitle = 'Convert Component into Spiked Bag';

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: 'Record the time a unit is placed in the freezer during real-time separation.',
    actions: []
  };

  // Form
  form!: FormGroup;
  minDate!: Moment;

  // Form control getters
  get processCodeControl() { return this.form.get('processCode') as FormControl; }
  get processDescControl() { return this.form.get('processDesc') as FormControl; }
  get processDateTimeControl() { return this.form.get('processDateTime') as FormControl; }
  get oldProductCodeControl() { return this.form.get('oldProductCode') as FormControl; }
  get productCodeControl() { return this.form.get('productCode') as FormControl; }
  get attributeGroupControl() { return this.form.get('attributeGroup') as FormControl; }
  get attributeTypeControl() { return this.form.get('attributeType') as FormControl; }
  get newProductControl() { return this.form.get('newProduct') as FormControl; }
  get catalogNumberControl() { return this.form.get('catalogNumber') as FormControl; }
  get verifyProductControl() { return this.form.get('verifyProduct') as FormControl; }

  // Dropdown data signals
  protected readonly processCodes = signal<ProcessCode[]>([]);
  protected readonly productTypes = signal<ProductType[]>([]);
  protected readonly attributeGroups = signal<AttributeGroup[]>([]);
  protected readonly attributeCodes = signal<AttributeCode[]>([]);
  protected readonly catalogNumbers = signal<CatalogNumber[]>([]);
  protected readonly attributeGroupOptions = signal<AttributeGroupForProduct[]>([]);
  protected readonly attributeTypeOptions = signal<AttributeTypeForProduct[]>([]);

  // Selected process code description
  protected readonly selectedProcessDescription = signal<string>('');

  // Current datetime as Moment for the picker
  protected currentDateTime = signal<Moment>(moment());

  // Search control for process code dropdown
  protected readonly processCodeSearchCtrl = new FormControl('');
  protected readonly productCodeSearchCtrl = new FormControl('');
  protected readonly attributeGroupSearchCtrl = new FormControl('');
  protected readonly attributeTypeSearchCtrl = new FormControl('');
  protected readonly catalogNumberSearchCtrl = new FormControl('');

  // Convert search FormControl to signal
  protected readonly processCodeSearchSignal = toSignal(
    this.processCodeSearchCtrl.valueChanges.pipe(startWith('')),
    { initialValue: '' }
  );

  protected readonly productCodeSearchSignal = toSignal(
    this.productCodeSearchCtrl.valueChanges.pipe(startWith('')),
    { initialValue: '' }
  );

  protected readonly attributeGroupSearchSignal = toSignal(
    this.attributeGroupSearchCtrl.valueChanges.pipe(startWith('')),
    { initialValue: '' }
  );

  protected readonly attributeTypeSearchSignal = toSignal(
    this.attributeTypeSearchCtrl.valueChanges.pipe(startWith('')),
    { initialValue: '' }
  );

  protected readonly catalogNumberSearchSignal = toSignal(
    this.catalogNumberSearchCtrl.valueChanges.pipe(startWith('')),
    { initialValue: '' }
  );

  // Filtered process codes based on search
  protected readonly filteredProcessCodes = computed(() => {
    const searchTerm = this.processCodeSearchSignal()?.toLowerCase() || '';
    const codes = this.processCodes();
    if (!searchTerm) return codes;
    return codes.filter(code =>
      code.processCode.toLowerCase().includes(searchTerm) ||
      (code.processCodeDesc && code.processCodeDesc.toLowerCase().includes(searchTerm))
    );
  });

  // Filtered product codes based on search
  protected readonly filteredProductCodeOptions = computed(() => {
    const searchTerm = this.productCodeSearchSignal()?.toLowerCase() || '';
    const products = this.productCodeOptions();
    if (!searchTerm) return products;
    return products.filter(product =>
      product.productCode.toLowerCase().includes(searchTerm) ||
      (product.productDesc && product.productDesc.toLowerCase().includes(searchTerm))
    );
  });

  // Filtered attribute groups based on search
  protected readonly filteredAttributeGroups = computed(() => {
    const searchTerm = this.attributeGroupSearchSignal()?.toLowerCase() || '';
    const groups = this.attributeGroupOptions();
    if (!searchTerm) return groups;
    return groups.filter(group =>
      group.code.toLowerCase().includes(searchTerm) ||
      (group.codeDesc && group.codeDesc.toLowerCase().includes(searchTerm))
    );
  });

  // Filtered attribute types based on search
  protected readonly filteredAttributeTypes = computed(() => {
    const searchTerm = this.attributeTypeSearchSignal()?.toLowerCase() || '';
    const types = this.attributeTypeOptions();
    if (!searchTerm) return types;
    return types.filter(type =>
      type.attribCode.toLowerCase().includes(searchTerm) ||
      (type.attribDesc && type.attribDesc.toLowerCase().includes(searchTerm))
    );
  });

  // Filtered catalog numbers based on search
  protected readonly filteredCatalogNumbers = computed(() => {
    const searchTerm = this.catalogNumberSearchSignal()?.toLowerCase() || '';
    const catalogs = this.catalogNumbers();
    if (!searchTerm) return catalogs;
    return catalogs.filter(catalog =>
      catalog.catalogNumber.toLowerCase().includes(searchTerm) ||
      (catalog.lotNumber && catalog.lotNumber.toLowerCase().includes(searchTerm))
    );
  });

  // State signals
  protected readonly isLoading = signal(false);
  protected readonly unitIdValid = signal(false);
  protected readonly currentUnitId = signal<string | null>(null);
  protected readonly collectionDate = signal<string | null>(null);
  protected readonly oldProductCode = signal<string | null>(null);
  protected readonly oldProductDesc = signal<string>('');
  protected readonly oldProductType = signal<string | null>(null);
  protected readonly newProductCode = signal<string | null>(null);
  protected readonly newProductDesc = signal<string>('');
  protected readonly labelPrintRequired = signal(false);
  protected readonly entryCount = signal(0);
  protected readonly productCodeOptions = signal<ProductCodeOption[]>([]);
  protected readonly hasMultipleProducts = signal(false);

  // Results table
  protected readonly conversions = signal<ConversionHistoryRow[]>([]);
  protected readonly displayedColumns = [
    'unitId',
    'productCode',
    'processDateTime',
    'attributeGroup',
    'attributeType',
    'newProduct',
    'catalogNumber',
    'verifyProduct'
  ];
  protected readonly currentPageSize = signal(25);
  protected readonly pageSizeOptions = [10, 25, 50, 100];
  protected readonly currentPage = signal(0);

  // Sorting
  protected readonly sortState = signal<{ active: string; direction: 'asc' | 'desc' | '' }>({
    active: '',
    direction: ''
  });

  // Computed: sorted and paginated data
  protected readonly sortedData = computed(() => {
    const data = this.conversions();
    const sort = this.sortState();
    if (!sort.active || sort.direction === '') return [...data]; // Return new array reference

    return [...data].sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      const valA = (a as unknown as Record<string, unknown>)[sort.active];
      const valB = (b as unknown as Record<string, unknown>)[sort.active];
      if (valA == null && valB == null) return 0;
      if (valA == null) return isAsc ? -1 : 1;
      if (valB == null) return isAsc ? 1 : -1;
      return (valA < valB ? -1 : valA > valB ? 1 : 0) * (isAsc ? 1 : -1);
    });
  });

  // Computed: paginated data
  protected readonly paginatedData = computed(() => {
    const sorted = this.sortedData();
    const page = this.currentPage();
    const pageSize = this.currentPageSize();
    const start = page * pageSize;
    return sorted.slice(start, start + pageSize);
  });

  private get chapterOffset(): string {
    return this.headerService.chapterTimeZone();
  }

  constructor() {
    this.initializeHeaderConfig();
    this.setupEffects();
    this.minDate = this.getChapterMinDate();
  }

  /**
   * Get minimum date for date picker (chapter local "today" at 00:00:00)
   * Uses chapter local date, not browser/system date
   */
  private getChapterMinDate(): Moment {
    return this.chapterTimezoneService.getChapterLocalDate();
  }

  /**
   * Get formatted datetime string for display in DD-MON-YY HH:mm format (24-hour)
   */
  protected getFormattedDateTime(): string {
    const dt = this.currentDateTime();
    return dt ? dt.format('DD-MMM-YY HH:mm') : '';
  }

  /**
   * Trim product description at first pipe character and append "..."
   * Example: "Apheresis PLATELETS|ACD-A/XX/20-24C|..." -> "Apheresis PLATELETS..."
   */
  protected getTrimmedProductDesc(description: string | undefined | null): string {
    if (!description) return '';
    const pipeIndex = description.indexOf('|');
    if (pipeIndex === -1) return description;
    return description.substring(0, pipeIndex) + '...';
  }

  /**
   * Open datetime picker dialog
   */
  protected openDateTimePicker(): void {
    const dialogRef = this.dialog.open(DateTimePickerDialogComponent, {
      width: '400px',
      data: {
        currentDateTime: this.currentDateTime(),
        minDate: this.minDate
      }
    });

    dialogRef.afterClosed().subscribe((result: Moment | undefined) => {
      if (result) {
        this.currentDateTime.set(result);
        // Update the form control with the formatted value to satisfy required validation
        this.processDateTimeControl.setValue(result.format('DD-MMM-YY HH:mm'));
        this.processDateTimeControl.markAsTouched();
        this.processDateTimeControl.updateValueAndValidity();
      }
    });
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
          subtitle: this.headerConfig.subtitle
        };
      }
    });

    effect(() => {
      this.minDate = this.getChapterMinDate();
    });
  }

  ngOnInit(): void {
    this.waitForChapterTimezone();
    this.initializeForm();
    this.loadProcessCodes();
    this.subscribeToChapterChanges();
  }

  /**
   * Wait for chapter timezone to be available before initializing dates
   * This ensures we use chapter local time, not browser time
   */
  private waitForChapterTimezone(): void {
    // Clear any existing interval
    if (this.chapterTimezoneCheckInterval) {
      clearInterval(this.chapterTimezoneCheckInterval);
      this.chapterTimezoneCheckInterval = null;
    }

    // Check if chapter timezone is already loaded
    if (this.chapterTimezoneService.isChapterLocalDateAvailable()) {
      this.updateDatesWithChapterTime();
      return;
    }

    // Wait for chapter timezone to load
    // HeaderService automatically fetches it on app initialization
    this.chapterTimezoneCheckInterval = setInterval(() => {
      if (this.chapterTimezoneService.isChapterLocalDateAvailable()) {
        clearInterval(this.chapterTimezoneCheckInterval);
        this.chapterTimezoneCheckInterval = null;
        this.updateDatesWithChapterTime();
      }
    }, 100); // Check every 100ms

    // Timeout after 5 seconds and use system time as fallback
    setTimeout(() => {
      if (this.chapterTimezoneCheckInterval) {
        clearInterval(this.chapterTimezoneCheckInterval);
        this.chapterTimezoneCheckInterval = null;
        if (!this.chapterTimezoneService.isChapterLocalDateAvailable()) {
          console.warn('Chapter timezone not available, using system time');
        }
      }
    }, 5000);
  }

  /**
   * Update current datetime and minDate with chapter local time
   */
  private updateDatesWithChapterTime(): void {
    const chapterNow = this.chapterTimezoneService.getChapterLocalDateTime();
    this.currentDateTime.set(chapterNow);
    this.minDate = this.getChapterMinDate();

    // Update form control if it exists
    if (this.processDateTimeControl) {
      this.processDateTimeControl.setValue(chapterNow.format('DD-MMM-YY HH:mm'));
    }

    this.cdr.markForCheck();
  }

  ngOnDestroy(): void {
    // Clear chapter timezone check interval
    if (this.chapterTimezoneCheckInterval) {
      clearInterval(this.chapterTimezoneCheckInterval);
      this.chapterTimezoneCheckInterval = null;
    }

    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    // Initialize currentDateTime with chapter local time (matches Oracle Forms behavior)
    // Oracle Forms: get_local_time(:global.chapter_id, sysdate, v_local_time)
    const now = this.chapterTimezoneService.getChapterLocalDateTime();
    this.currentDateTime.set(now);

    this.form = this.fb.group({
      processCode: [null, Validators.required],
      processDesc: [{ value: '', disabled: true }],
      unitId: [''],
      oldProductCode: [{ value: '' }],
      productCode: [{ value: null }], // Always enabled
      processDateTime: [now.format('DD-MMM-YY HH:mm'), Validators.required], // Initialize with current datetime
      attributeGroup: [null], // Always enabled
      attributeType: [null],  // Always enabled
      newProduct: [{ value: '', disabled: true }],
      catalogNumber: [null], // Always enabled - optional field
      verifyProduct: [''] // Always enabled
    });
  }

  private initializeHeaderConfig(): void {
    this.headerConfig = {
      breadcrumbs: [
        { label: 'Home', link: '/home' },
        { label: this.defaultTitle, link: null }
      ],
      title: this.defaultTitle,
      subtitle: 'Record the time a unit is placed in the freezer during real-time separation.',
      actions: []
    };
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.handleChapterChange());
  }

  /**
   * Handle chapter change - wait for new chapter timezone to load before resetting
   * Issue: HeaderService emits chapterChanged$ BEFORE the timezone API completes
   * So we must poll until the new timezone is available
   */
  private handleChapterChange(): void {
    // Clear any existing interval
    if (this.chapterTimezoneCheckInterval) {
      clearInterval(this.chapterTimezoneCheckInterval);
      this.chapterTimezoneCheckInterval = null;
    }

    // Store the current chapter ID to detect when timezone changes
    const newChapterId = this.headerService.chapterId();
    const oldChapterId = this.chapterTimezoneService.currentChapterId();

    // If chapter ID hasn't changed, just reset immediately
    if (newChapterId === oldChapterId) {
      this.resetAll();
      this.loadProcessCodes();
      this.minDate = this.getChapterMinDate();
      return;
    }

    // Poll until new chapter timezone is loaded
    const checkForNewChapter = () => {
      const currentChapterId = this.chapterTimezoneService.currentChapterId();

      // Wait until ChapterTimezoneService has the NEW chapter's timezone
      if (currentChapterId === newChapterId && this.chapterTimezoneService.isChapterLocalDateAvailable()) {
        clearInterval(this.chapterTimezoneCheckInterval);
        this.chapterTimezoneCheckInterval = null;

        // Now reset with the correct new chapter time
        this.resetAll();
        this.loadProcessCodes();
        this.minDate = this.getChapterMinDate();
        this.cdr.markForCheck();
      }
    };

    // Check immediately
    checkForNewChapter();

    // If not ready, poll every 100ms
    this.chapterTimezoneCheckInterval = setInterval(checkForNewChapter, 100);

    // Timeout after 5 seconds and reset anyway
    setTimeout(() => {
      if (this.chapterTimezoneCheckInterval) {
        clearInterval(this.chapterTimezoneCheckInterval);
        this.chapterTimezoneCheckInterval = null;
        console.warn('Chapter timezone not loaded after 5s, resetting anyway');
        this.resetAll();
        this.loadProcessCodes();
        this.minDate = this.getChapterMinDate();
      }
    }, 5000);
  }

  private loadProcessCodes(): void {
    this.isLoading.set(true);
    this.service.getProcessCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (codes) => {
          this.processCodes.set(codes);
          this.isLoading.set(false);
        },
        error: (error) => {
          // Show API error message if available
          const apiErrorMessage = error?.error?.message;
          if (apiErrorMessage) {
            this.showError(apiErrorMessage);
          }
          this.isLoading.set(false);
        }
      });
  }

  protected onProcessCodeChange(code: string): void {
    if (!code) {
      this.selectedProcessDescription.set('');
      return;
    }
    const selected = this.processCodes().find(pc => pc.processCode === code);
    this.selectedProcessDescription.set(selected?.processCodeDesc || '');
  }

  protected onProductCodeChange(productCode: string): void {
    if (!productCode) {
      return;
    }

    // Find the selected product from options to get productType
    const selectedProduct = this.productCodeOptions().find(p => p.productCode === productCode);

    // Store selected product code and product type
    this.oldProductCode.set(productCode);
    this.oldProductType.set(selectedProduct?.productType || null);

    // Load attribute groups for the selected product
    this.loadAttributeGroups(productCode);

    // Auto-populate attributes based on FR_VPRODUCT_PROCESSES (FRICON2 logic)
    this.autoPopulateAttributes(productCode);
  }

  /**
   * Auto-populate Attribute Group, Code, and Type from FR_VPRODUCT_PROCESSES
   * Based on FRICON2 OLD_PRODUCT_CODE.VALIDATE_FIELD trigger logic
   */
  private autoPopulateAttributes(oldProductCode: string): void {
    const processCode = this.form.get('processCode')?.value;
    const unitId = this.currentUnitId();

    if (!processCode || !unitId) {
      console.warn('Process code or unit ID not available for auto-populating attributes');
      return;
    }

    this.isLoading.set(true);
    this.service.getAttributesForProcess(oldProductCode, processCode, unitId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.item) {
            // Auto-populate the form fields
            this.form.patchValue({
              attributeGroup: response.item.attributeGroup,
              attributeType: response.item.attributeCode
            });

            // Store suitability check date if needed for validation
            if (response.item.suitabilityCheckDate) {
              console.log('Suitability check date:', response.item.suitabilityCheckDate);
            }

            // Derive product code IMMEDIATELY after attributes are populated
            // This matches FMB flow: attributes → derive product → catalog
            this.deriveProductCode();
          } else {
            // Show API error message only
            if (response.message) {
              this.showError(response.message);
            }

            // Clear attribute fields on error
            this.form.patchValue({
              attributeGroup: '',
              attributeType: ''
            });
          }
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error auto-populating attributes:', error);

          // Show API error message if available
          const apiErrorMessage = error?.error?.message;
          if (apiErrorMessage) {
            this.showError(apiErrorMessage);
          }

          this.isLoading.set(false);

          // Clear attribute fields on error
          this.form.patchValue({
            attributeGroup: '',
            attributeType: ''
          });
        }
      });
  }

  // Called when unit ID is validated by the shared UnitIdFieldComponent
  protected onUnitValidated(data: UnitValidationResponse): void {
    const unitId = data.parsedUnitId;

    this.currentUnitId.set(unitId);
    this.unitIdValid.set(true);

    // The UnitValidationResponse from the shared component contains collection date
    if (data.collectionDate) {
      this.collectionDate.set(data.collectionDate);
    }

    // DO NOT call validateUnit API again - the shared component already validated it
    // Instead, directly load the required data (products, catalog numbers, etc.)

    this.isLoading.set(true);

    // Load products filtered by process code to populate Product Code dropdown
    this.loadProductsForUnit();

    // Load catalog numbers for product type
    // Note: We might need the product type from another API call
    // this.loadCatalogNumbers();

    this.isLoading.set(false);
    this.cdr.markForCheck();
  }

  protected onUnitCleared(): void {
    this.resetEntryFields();
  }

  private loadProductsForUnit(): void {
    const processCode = this.form.get('processCode')?.value;
    const unitId = this.currentUnitId();
    const collDate = this.collectionDate();

    // Process code is required to load products
    if (!processCode || !unitId || !collDate) {
      return;
    }

    this.isLoading.set(true);
    this.service.getProducts(unitId, collDate, processCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (products) => {
          if (products && products.length > 0) {
            // Store all products in the signal for dropdown binding
            this.productCodeOptions.set(products.map((p: any) => ({
              productCode: p.productCode,
              productDesc: p.productDesc,
              componentPrefix: p.componentPrefix,
              productType: p.productType
            })));

            // Product code dropdown is always enabled (no need to enable it here)

            // If only one product, auto-select it
            if (products.length === 1) {
              const product = products[0];
              const productCode = product.productCode;

              this.form.patchValue({
                productCode: productCode
              });

              // Manually trigger the change event to load attributes and catalogs
              this.onProductCodeChange(productCode);
            }
          }
          this.isLoading.set(false);
        },
        error: (error) => {
          // Show API error message if available
          const apiErrorMessage = error?.error?.message;
          if (apiErrorMessage) {
            this.showError(apiErrorMessage);
          }
          this.isLoading.set(false);
        }
      });
  }

  private loadAttributeGroups(productCode: string): void {
    this.isLoading.set(true);
    this.service.getAttributeGroupsForProduct(productCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (groups) => {
          this.attributeGroupOptions.set(groups);

          // Dropdown is already enabled unconditionally

          this.isLoading.set(false);
        },
        error: (error) => {
          const apiErrorMessage = error?.error?.message;
          if (apiErrorMessage) {
            this.showError(apiErrorMessage);
          }
          this.isLoading.set(false);
        }
      });
  }

  protected onAttributeGroupChange(attributeGroup: string): void {
    if (!attributeGroup) {
      this.attributeTypeOptions.set([]);
      this.attributeTypeControl.setValue('');
      // Dropdown remains enabled unconditionally
      return;
    }

    const productCode = this.oldProductCode();
    const unitId = this.currentUnitId();
    const collDate = this.collectionDate();
    const productType = this.oldProductType();

    if (!productCode || !unitId || !collDate || !productType) {
      return;
    }

    this.loadAttributeTypes(productCode, attributeGroup, unitId, collDate, productType);
  }

  private loadAttributeTypes(
    productCode: string,
    attributeGroup: string,
    unitId: string,
    collDate: string,
    productType: string
  ): void {
    this.isLoading.set(true);
    this.service.getAttributeTypesForProduct(
      productCode,
      attributeGroup,
      unitId,
      collDate,
      productType
    )
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (types) => {
        this.attributeTypeOptions.set(types);

        // Dropdown is already enabled unconditionally

        this.isLoading.set(false);
      },
      error: (error) => {
        const apiErrorMessage = error?.error?.message;
        if (apiErrorMessage) {
          this.showError(apiErrorMessage);
        }
        this.isLoading.set(false);
      }
    });
  }

  private loadCatalogNumbers(): void {
    const productType = this.oldProductType();
    const unitId = this.currentUnitId();
    if (!productType || !unitId) return;

    this.isLoading.set(true);
    this.service.getValidCatalogs(productType, unitId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (catalogs) => {
          this.catalogNumbers.set(catalogs);
          // Catalog number is always enabled - no need to enable it here
          this.isLoading.set(false);
        },
        error: (error) => {
          // Show API error message if available
          const apiErrorMessage = error?.error?.message;
          if (apiErrorMessage) {
            this.showError(apiErrorMessage);
          }
          this.isLoading.set(false);
        }
      });
  }

  protected onCatalogNumberChange(catalogNumber: string): void {
    // Catalog number is optional - no validation required
    // Just store the selected value
    if (catalogNumber) {
      this.form.patchValue({ catalogNumber });
    }
  }

  protected onAttributeTypeChange(attributeType: string): void {
    if (!attributeType) {
      return;
    }

    // Derive product code when attribute type is selected
    this.deriveProductCode();
  }

  private deriveProductCode(): void {
    const oldProductCode = this.oldProductCode();
    const processCode = this.form.get('processCode')?.value;
    const productType = this.oldProductType();
    const attributeType = this.form.get('attributeType')?.value; // Now from dropdown selection

    if (!oldProductCode || !processCode || !productType || !attributeType) {
      return;
    }

    this.isLoading.set(true);
    this.service.deriveProduct({
      oldProductCode,
      processCode, // Used for tracking/logging
      productType: productType, // Use the actual product type from selected product
      attributeType: attributeType // Selected from dropdown - passed as P_ATTRIBUTE_TO_ADD
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (result: DeriveProductResponse) => {
        if (result.hasMultipleMatches && result.multipleProducts && result.multipleProducts.length > 0) {
          // Show product selection dialog
          this.productCodeOptions.set(result.multipleProducts);
          this.hasMultipleProducts.set(true);
          // TODO: Open product selection dialog
        } else if (result.newProductCode) {
          this.newProductCode.set(result.newProductCode);
          this.newProductDesc.set(result.newProductDesc || '');
          this.form.patchValue({
            newProduct: result.newProductCode
          });
          this.checkLabelPrintRequired();

          // Load catalog numbers AFTER product derivation (matches FMB flow)
          this.loadCatalogNumbers();
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        // Show API error message if available
        const apiErrorMessage = error?.error?.message;
        if (apiErrorMessage) {
          this.showError(apiErrorMessage);
        }
        this.isLoading.set(false);
      }
    });
  }

  private checkLabelPrintRequired(): void {
    // Label print logic would be determined by API response
    // Verify product field is ALWAYS enabled - no need to enable it here
    this.labelPrintRequired.set(true);
  }

  /**
   * Handle input event on verify product field (real-time validation as user types)
   * Validates on every keystroke without calling the API
   */
  protected onVerifyProductInput(): void {
    const verifyValue = this.verifyProductControl.value?.trim();
    const expectedCode = this.newProductCode();

    if (!verifyValue || !expectedCode) {
      // Clear any validation errors if field is empty
      this.verifyProductControl.setErrors(null);
      return;
    }

    const verifyValueTrimmed = verifyValue.trim().toUpperCase();
    const expectedCodeTrimmed = expectedCode.trim().toUpperCase();

    // Show validation error if values don't match (without showing snackbar)
    if (verifyValueTrimmed !== expectedCodeTrimmed) {
      this.verifyProductControl.setErrors({ mismatch: true });
    } else {
      this.verifyProductControl.setErrors(null);
    }
  }

  /**
   * Handle blur event on verify product field (when user tabs out)
   * Validates and calls API if validation passes
   */
  protected onVerifyProductBlur(): void {
    const verifyValue = this.verifyProductControl.value?.trim();
    const expectedCode = this.newProductCode();

    if (!verifyValue) {
      return; // Don't do anything if field is empty
    }

    const verifyValueTrimmed = verifyValue.trim().toUpperCase();
    const expectedCodeTrimmed = expectedCode?.trim().toUpperCase();

    if (verifyValueTrimmed !== expectedCodeTrimmed) {
      // Show error message and clear field
      this.showError('Product codes don\'t match');
      this.verifyProductControl.setValue('');
      this.verifyProductControl.setErrors(null);
      return;
    }

    // If validation passes, call API to commit conversion
    this.commitConversion();
  }

  /**
   * Handle Enter key on verify product field
   * Validates and calls API if validation passes
   */
  protected onVerifyProductEnter(): void {
    const verifyValue = this.verifyProductControl.value?.trim();
    const expectedCode = this.newProductCode();

    if (!verifyValue) {
      return; // Don't do anything if field is empty
    }

    const verifyValueTrimmed = verifyValue.trim().toUpperCase();
    const expectedCodeTrimmed = expectedCode?.trim().toUpperCase();

    if (verifyValueTrimmed !== expectedCodeTrimmed) {
      // Show error message and clear field
      this.showError('Product codes don\'t match');
      this.verifyProductControl.setValue('');
      this.verifyProductControl.setErrors(null);
      return;
    }

    // If validation passes, call API to commit conversion
    this.commitConversion();
  }

  private commitConversion(): void {
    if (this.isLoading()) {
      return;
    }

    const unitId = this.currentUnitId();
    const oldProductCode = this.oldProductCode();
    const newProductCode = this.newProductCode();
    const processCode = this.form.get('processCode')?.value;
    const catalogNumber = this.form.get('catalogNumber')?.value?.trim(); // Optional field
    const attributeGroup = this.form.get('attributeGroup')?.value;
    const attributeCode = this.form.get('attributeType')?.value;
    const verifyProduct = this.form.get('verifyProduct')?.value;

    // Get current datetime from signal
    const processDateTime = this.currentDateTime();

    // Catalog number is OPTIONAL - removed from required validation
    if (!unitId || !oldProductCode || !newProductCode || !processCode || !processDateTime) {
      return;
    }

    this.isLoading.set(true);

    // Format process date/time for API in YYYY-MM-DDTHH:mm:ss format
    const formattedProcessDate = processDateTime.format('YYYY-MM-DDTHH:mm:ss');

    this.service.convertComponent({
      unitId,
      oldProductCode,
      newProductCode,
      processCode,
      processDate: formattedProcessDate,
      attributeGroup: attributeGroup === '-' ? '' : attributeGroup,
      attributeCode: attributeCode === '-' ? '' : attributeCode,
      catalogNumber: catalogNumber || '', // Send empty string if not provided
      verifyProductCode: verifyProduct || ''
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (response) => {
        // Always create the new row from the data we just submitted
        // This ensures the row is added even if the API response doesn't include data
        // NOTE: Store chapter local datetime for display, not the GMT-formatted API string
        const displayDateTime = processDateTime.format('YYYY-MM-DDTHH:mm:ss');

        const newRow: ConversionHistoryRow = {
          unitId: unitId,
          productCode: oldProductCode,
          processDateTime: displayDateTime, // Chapter local time for display
          attributeGroup: attributeGroup || '',
          attributeType: attributeCode || '',
          newProduct: newProductCode,
          catalogNumber: catalogNumber || '',
          verifyProduct: verifyProduct || ''
        };

        // Reset to first page to ensure new row is visible
        this.currentPage.set(0);

        // Add the new row to the beginning of the array
        // Use set() with shallow copy to avoid potential circular reference issues
        const currentRows = this.conversions();
        this.conversions.set([newRow, ...currentRows]);

        // Update entry count
        const currentCount = this.entryCount() + 1;
        this.entryCount.set(currentCount);

        // Show success message with entry count (e.g., "1 Entry saved")
        const successMessage = response.message || `${currentCount} ${currentCount === 1 ? 'Entry' : 'Entries'} saved`;
        this.showSuccess(successMessage);

        // Reset entry fields after successful save
        this.resetEntryFields();

        // Focus management: move focus to results table for keyboard users
        setTimeout(() => {
          const resultsHeading = document.getElementById(this.elementId('results-title'));
          if (resultsHeading) {
            resultsHeading.setAttribute('tabindex', '-1');
            resultsHeading.focus();
            // Remove tabindex after focus to prevent tab-stop pollution
            setTimeout(() => resultsHeading.removeAttribute('tabindex'), 100);
          }
        }, 100);

        this.isLoading.set(false);
      },
      error: (error) => {
        // Show API error message if available
        const apiErrorMessage = error?.error?.message;
        if (apiErrorMessage) {
          this.showError(apiErrorMessage);
        }
        this.isLoading.set(false);
      }
    });
  }

  protected onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex);
    this.currentPageSize.set(event.pageSize);
  }

  protected onSortChange(sort: Sort): void {
    this.sortState.set({ active: sort.active, direction: sort.direction as 'asc' | 'desc' | '' });
  }

  private resetEntryFields(): void {
    this.unitIdValid.set(false);
    this.currentUnitId.set(null);
    this.collectionDate.set(null);
    this.oldProductCode.set(null);
    this.oldProductDesc.set('');
    this.oldProductType.set(null);
    this.newProductCode.set(null);
    this.newProductDesc.set('');
    this.labelPrintRequired.set(false);
    this.productCodeOptions.set([]);

    // Clear dropdown options
    this.attributeGroupOptions.set([]);
    this.attributeTypeOptions.set([]);

    // Reset to chapter local date and time (matches Oracle Forms behavior)
    const now = this.chapterTimezoneService.getChapterLocalDateTime();
    this.currentDateTime.set(now);

    this.form.patchValue({
      oldProductCode: '',
      productCode: null,
      processDateTime: now.format('DD-MMM-YY HH:mm'), // Update with current datetime
      attributeGroup: null,
      attributeType: null,
      newProduct: '',
      catalogNumber: null,
      verifyProduct: ''
    });

    // ALL fields are always enabled - no need to disable anything

    if (this.unitIdField) this.unitIdField.clear();
  }

  private resetAll(): void {
    this.resetEntryFields();
    this.form.patchValue({
      processCode: null,
      processDesc: ''
    });
    this.selectedProcessDescription.set('');
    this.conversions.set([]);
    this.entryCount.set(0);
    this.currentPage.set(0);
    this.sortState.set({ active: '', direction: '' });
  }

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

  private extractErrorMessage(error: any, fallback: string): string {
    return error?.error?.message || error?.message || fallback;
  }
}
