import { Component, OnInit, OnDestroy, ViewChild, ElementRef, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, startWith, map } from 'rxjs/operators';

// Angular Material
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule, MatSelectChange } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { A11yModule } from '@angular/cdk/a11y';

// Shared Components
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { DataTable } from '@shared/components/data-table/data-table';
import { UnitIdFieldComponent, UnitIdPostValidateEvent } from '@shared/components/unit-id-field/unit-id-field.component';
import { UnitValidationResponse } from '@shared/components/unit-id-field/unit-id-field.model';
import {
  ConfirmActionDialogComponent,
  ConfirmActionDialogData
} from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';
import { SidePanelBase } from '@shared/components/side-panel-base/side-panel-base';
import { DialogButton } from '@shared/interfaces/dialog.interface';

// Interfaces
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DataTableConfig } from '@shared/interfaces/data-table.interface';

// Services and Models
import { RestockUnshippedProductsService } from './services/restock-unshipped-products.service';
import { HeaderService } from '@shared/services/header.service';
import { MenuService } from '@shared/services/menu.service';
import { LoginService } from '@shared/services/login.service';
import { ROUTE_REGISTRY } from '@core/constants/route-registry';
import { RouteKey } from '@core/constants/route-keys';
import { ROUTES } from '@core/constants/route.constants';
import { UppercaseDatePipe } from '@shared/pipes/uppercase-date.pipe';
import {
  PickSlipDto,
  PickSlipProductDto,
  DisplayProductDto,
  ProductCodeOption,
  AboRhOption,
  RestockProductRequestDto,
  RestockProductItemDto,
  StorageDeviceDto,
  StorageRackDto,
  StorageTrayDto
} from './models/restock-unshipped-products.model';

@Component({
  selector: 'app-restock-unshipped-products',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatDialogModule,
    NgxMatSelectSearchModule,
    A11yModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    UnitIdFieldComponent,
    SidePanelBase
  ],
  templateUrl: './restock-unshipped-products.html',
  styleUrls: ['./restock-unshipped-products.scss']
})
export class RestockUnshippedProducts implements OnInit, OnDestroy {
  // Unique ID generation for accessibility
  private static nextId = 0;
  protected readonly componentId = `restock-unshipped-products-${RestockUnshippedProducts.nextId++}`;

  // Generate unique IDs for form elements
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  // ViewChild references
  @ViewChild(UnitIdFieldComponent) unitIdField!: UnitIdFieldComponent;

  // Dependency injection
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(RestockUnshippedProductsService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly headerService = inject(HeaderService);
  private readonly menuService = inject(MenuService);
  private readonly loginService = inject(LoginService);
  private readonly el = inject(ElementRef);
  private readonly datePipe = new UppercaseDatePipe();

  // Destroy subject for cleanup
  private destroy$ = new Subject<void>();

  // Signal-based state
  protected readonly pickSlips = signal<PickSlipDto[]>([]);
  protected readonly selectedPickSlip = signal<PickSlipDto | null>(null);
  protected readonly products = signal<PickSlipProductDto[]>([]);
  protected readonly displayProducts = signal<DisplayProductDto[]>([]);
  protected readonly loading = signal<boolean>(false);
  protected readonly loadingProducts = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);
  protected readonly restockedProducts = signal<Set<string>>(new Set());
  protected readonly isRestocking = signal<boolean>(false);
  protected readonly statusAnnouncement = signal<string>('');

  // Unit ID field state — parsedUnitId comes from unitIdField.parsedUnitId
  protected unitScannedWarning = '';
  protected pendingProduct: PickSlipProductDto | null = null;
  protected selectedProduct = signal<PickSlipProductDto | null>(null);
  private currentFilterUnitId = '';

  // Dropdown options
  protected readonly productCodes = signal<ProductCodeOption[]>([]);
  protected readonly aboRhOptions = signal<AboRhOption[]>([]);
  protected readonly storageDevices = signal<StorageDeviceDto[]>([]);
  protected readonly storageRacks = signal<StorageRackDto[]>([]);
  protected readonly storageTrays = signal<StorageTrayDto[]>([]);

  // Currently selected product context for storage lookups
  private currentProductType = '';
  private currentBloodType = '';
  private currentWarehouseId = '';
  private currentInventoryClass = 'RE';
  private currentUnitSchemeType = 'C';
  private selectedDeviceType = '';
  private selectedDeviceNumber = '';
  private selectedRackMixAbo = 'N';
  private selectedRackMixProduct = 'N';
  private selectedRackShipAnyRh = 'N';

  // Search controls for dropdowns
  pickSlipSearchControl = new FormControl('');
  productCodeSearchControl = new FormControl('');
  aboRhSearchControl = new FormControl('');
  deviceSearchControl = new FormControl('');
  rackSearchControl = new FormControl('');
  traySearchControl = new FormControl('');

  // Filtered options for searchable dropdowns
  protected readonly filteredPickSlips = signal<PickSlipDto[]>([]);
  protected readonly filteredProductCodes = signal<ProductCodeOption[]>([]);
  protected readonly filteredAboRhOptions = signal<AboRhOption[]>([]);
  protected readonly filteredDevices = signal<StorageDeviceDto[]>([]);
  protected readonly filteredRacks = signal<StorageRackDto[]>([]);
  protected readonly filteredTrays = signal<StorageTrayDto[]>([]);

  // Computed values
  protected readonly isEmpty = computed(() => this.displayProducts().length === 0 && !this.loadingProducts());
  protected readonly isReady = computed(() => !this.loading() && !this.error());
  protected readonly hasSelectedPickSlip = computed(() => this.selectedPickSlip() !== null);

  // Forms
  pickSlipForm!: FormGroup;
  filterForm!: FormGroup;

  // Page Header Configuration
  pageHeaderConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: ''
  };

  constructor() {
    effect(() => {
      const menuItems = this.menuService.getMenuItemsSignal()();
      if (menuItems.length > 0) {
        const basePath = ROUTE_REGISTRY[RouteKey.RestockUnshippedProducts]?.path;
        if (basePath) {
          const menuItem = this.menuService.findMenuItemByPath(basePath);
          if (menuItem) {
            this.pageHeaderConfig = {
              ...this.pageHeaderConfig,
              breadcrumbs: [
                { label: 'Home', link: ROUTES.HOME },
                { label: menuItem.label, link: null }
              ],
              title: menuItem.label,
              subtitle: menuItem.remarks || menuItem.subtitle || ''
            };
          }
        }
      }
    });
  }

  // Data Table Configuration
  tableConfig: DataTableConfig<DisplayProductDto> = {
    columns: [
      { key: 'unitId', header: 'Unit ID', sortable: false },
      { key: 'productCode', header: 'Product Code', sortable: false },
      { key: 'productShortName', header: 'Product Description', sortable: false },
      { key: 'bloodTypeDesc', header: 'ABORh', sortable: false },
      {
        key: 'expDate',
        header: 'Expiration Date',
        sortable: false,
        type: 'date',
        valueFormatter: (value: string) => this.datePipe.transform(value, 'dd-MMM-yyyy HH:mm') || '-'
      },
      { key: 'warehouseId', header: 'Warehouse ID', sortable: false },
      { key: 'device', header: 'Device', sortable: false },
      { key: 'rack', header: 'Rack', sortable: false },
      { key: 'tray', header: 'Tray', sortable: false },
      {
        key: 'isRestocked',
        header: 'Status',
        sortable: true,
        valueFormatter: (value: boolean) => value ? 'Restocked' : '-'
      }
    ],
    showPagination: true,
    stickyHeader: true,
    emptyMessage: 'No Results to Display',
    emptySubMessage: 'Please enter search criteria to view results',
    noDataIcon: 'search',
    sortConfig: { column: 'isRestocked', direction: 'default' as const }
  };

  // Side Panel - View Unpack Products
  protected readonly showProductsPanel = signal(false);

  protected readonly panelTableConfig: DataTableConfig<PickSlipProductDto> = {
    columns: [
      { key: 'unitId', header: 'Unit ID', sortable: false },
      { key: 'productCode', header: 'Product', sortable: false },
      { key: 'productShortName', header: 'Short Name', sortable: false, minWidth: '120px' },
      { key: 'aliquot', header: 'Al', sortable: false },
      { key: 'bloodTypeDesc', header: 'ABORh', sortable: false },
      {
        key: 'expDate',
        header: 'Expiration Date',
        sortable: false,
        minWidth: '180px',
        valueFormatter: (value: string) => this.datePipe.transform(value, 'dd-MMM-yyyy HH:mm') || '-'
      }
    ],
    showPagination: false,
    stickyHeader: true,
    emptyMessage: 'No products found',
    noDataIcon: 'search'
  };

  protected readonly panelFooterButtons: DialogButton[] = [
    { label: 'EXIT', action: 'exit', variant: 'primary' }
  ];

  ngOnInit(): void {
    this.initForms();
    this.loadPickSlips();
    this.setupSearchFilters();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize forms with validation
   */
  private initForms(): void {
    // Pick slip selection form
    this.pickSlipForm = this.fb.group({
      pickSlipId: ['']
    });

    // Product filter form — Unit ID is handled by UnitIdFieldComponent, not a form control
    this.filterForm = this.fb.group({
      productCode: ['', [Validators.maxLength(8)]],
      aboRh: [''],
      device: [''],
      rack: [''],
      tray: ['']
    });

    // Subscribe to pick slip selection — auto-load all RP products (per legacy KEY-NXTBLK → execute_query)
    this.pickSlipForm.get('pickSlipId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(pickSlipId => {
        const pickSlip = this.pickSlips().find(ps => ps.pickSlipId === pickSlipId);
        this.selectedPickSlip.set(pickSlip || null);
        this.clearProducts();
        this.filterForm.reset();
        this.pendingProduct = null;
        this.selectedProduct.set(null);
        this.unitScannedWarning = '';
        this.unitIdField?.clear();
        if (pickSlip) {
          this.loadPickSlipProducts(pickSlip.pickSlipId);
        }
      });

    // Subscribe to Product Code selection to populate Expiration Date & Warehouse ID
    this.filterForm.get('productCode')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((productCode: string) => {
        if (productCode && this.currentFilterUnitId) {
          const product = this.products().find(p =>
            p.unitId.toUpperCase() === this.currentFilterUnitId.toUpperCase() &&
            p.productCode === productCode
          );
          this.selectedProduct.set(product || null);
        } else {
          this.selectedProduct.set(null);
        }
      });

    // Subscribe to Device changes to load Racks from API
    this.filterForm.get('device')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((deviceValue: string) => {
        this.filterForm.patchValue({ rack: '', tray: '' }, { emitEvent: false });
        this.storageRacks.set([]);
        this.filteredRacks.set([]);
        this.storageTrays.set([]);
        this.filteredTrays.set([]);
        if (deviceValue) {
          const device = this.storageDevices().find(
            d => `${d.deviceType}-${d.deviceNumber}` === deviceValue
          );
          if (device) {
            this.selectedDeviceType = device.deviceType;
            this.selectedDeviceNumber = device.deviceNumber;
            this.loadStorageRacks();
          }
        }
      });

    // Subscribe to Rack changes to capture mix flags and load Trays from API
    this.filterForm.get('rack')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((rackValue: string) => {
        this.filterForm.patchValue({ tray: '' }, { emitEvent: false });
        this.storageTrays.set([]);
        this.filteredTrays.set([]);
        if (rackValue) {
          const rack = this.storageRacks().find(r => r.rackNumber === rackValue);
          if (rack) {
            this.selectedRackMixAbo = rack.mixAbo || 'N';
            this.selectedRackMixProduct = rack.mixProduct || 'N';
          }
          this.loadStorageTrays(rackValue);
        }
      });

  }

  /**
   * Load pick slips with restockable products
   */
  protected loadPickSlips(): void {
    this.loading.set(true);
    this.error.set(null);

    const chapterId = this.headerService.getCurrentChapterId();
    const warehouseId = this.headerService.getCurrentWarehouseId();

    this.service.getPickSlips({ chapterId, warehouseId }, 100, 0)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const pickSlips = response.data || response.item || [];
          this.pickSlips.set(pickSlips);
          this.filteredPickSlips.set(pickSlips);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err.error?.message || 'Failed to load pick slips');
          this.loading.set(false);
          this.showError('Failed to load pick slips');
        }
      });
  }

  /**
   * Load products for selected pick slip (used internally for validation)
   */
  private loadPickSlipProducts(pickSlipId: string): void {
    this.loadingProducts.set(true);
    const chapterId = this.headerService.getCurrentChapterId();

    this.service.getPickSlipProducts(pickSlipId, chapterId, 100, 0)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const products = response.data || response.item || [];
          this.products.set(products);
          this.extractFilterOptions(products);
          this.loadingProducts.set(false);
        },
        error: (err) => {
          this.showError(err.error?.message || 'Failed to load products');
          this.loadingProducts.set(false);
          this.clearProducts();
        }
      });
  }

  /**
   * Update display products with restock status
   */
  private updateDisplayProducts(): void {
    const restocked = this.restockedProducts();
    const displayProducts = this.products().map(p => ({
      ...p,
      isRestocked: restocked.has(this.getProductKey(p))
    }));
    this.displayProducts.set(displayProducts);
  }

  /**
   * Extract filter options from products (product code & ABORh only —
   * device/rack/tray come from the TRAYS API)
   */
  private extractFilterOptions(products: PickSlipProductDto[]): void {
    const productCodesSet = new Set<string>();
    const productCodeMap = new Map<string, string>();
    products.forEach(p => {
      if (p.productCode) {
        productCodesSet.add(p.productCode);
        if (p.productShortName) {
          productCodeMap.set(p.productCode, p.productShortName);
        }
      }
    });
    const productCodeOptions: ProductCodeOption[] = Array.from(productCodesSet).map(code => ({
      code,
      description: productCodeMap.get(code) || ''
    }));
    this.productCodes.set(productCodeOptions);
    this.filteredProductCodes.set(productCodeOptions);

    const aboRhSet = new Set<string>();
    const aboRhMap = new Map<string, string>();
    products.forEach(p => {
      if (p.bloodType) {
        aboRhSet.add(p.bloodType);
        if (p.bloodTypeDesc) {
          aboRhMap.set(p.bloodType, p.bloodTypeDesc);
        }
      }
    });
    const aboRhOptions: AboRhOption[] = Array.from(aboRhSet).map(code => ({
      code,
      description: aboRhMap.get(code) || code
    }));
    this.aboRhOptions.set(aboRhOptions);
    this.filteredAboRhOptions.set(aboRhOptions);

    // Capture first product's context for storage lookups
    if (products.length > 0) {
      const first = products[0];
      this.currentWarehouseId = first.warehouseId || this.headerService.getCurrentWarehouseId();
      this.currentProductType = first.productType || first.productCode || '';
      this.currentBloodType = first.bloodType || '';
      this.currentUnitSchemeType = first.unitSchemeType || 'C';
      this.loadStorageDevices();
    }
  }

  private loadStorageDevices(): void {
    const chapterId = this.headerService.getCurrentChapterId();
    this.service.getStorageDevices(this.currentWarehouseId, this.currentProductType, chapterId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const devices = response.data || [];
          this.storageDevices.set(devices);
          this.filteredDevices.set(devices);
        },
        error: () => this.showError('Failed to load storage devices')
      });
  }

  private loadStorageRacks(): void {
    const chapterId = this.headerService.getCurrentChapterId();
    this.service.getStorageRacks(
      this.currentWarehouseId, this.selectedDeviceType, this.selectedDeviceNumber,
      this.currentProductType, this.currentBloodType, chapterId, this.currentInventoryClass
    ).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const racks = response.data || [];
          this.storageRacks.set(racks);
          this.filteredRacks.set(racks);
        },
        error: () => this.showError('Failed to load storage racks')
      });
  }

  private loadStorageTrays(rackNumber: string): void {
    const chapterId = this.headerService.getCurrentChapterId();
    this.service.getStorageTrays(
      this.currentWarehouseId, this.selectedDeviceType, this.selectedDeviceNumber,
      rackNumber, this.currentProductType, this.currentBloodType, chapterId,
      this.selectedRackMixProduct, this.selectedRackMixAbo, this.selectedRackShipAnyRh,
      this.currentUnitSchemeType
    ).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const trays = response.data || [];
          this.storageTrays.set(trays);
          this.filteredTrays.set(trays);
        },
        error: () => this.showError('Failed to load storage trays')
      });
  }

  /**
   * Apply client-side filters to products
   */
  private getProductsToRestock(): PickSlipProductDto[] {
    if (!this.currentFilterUnitId) return [];

    const filters = this.filterForm.value;
    let filtered = this.products().filter(p =>
      p.unitId.toUpperCase() === this.currentFilterUnitId.toUpperCase()
    );

    if (filters.productCode) {
      filtered = filtered.filter(p => p.productCode === filters.productCode);
    }

    if (filters.aboRh) {
      filtered = filtered.filter(p => p.bloodType === filters.aboRh);
    }

    const restocked = this.restockedProducts();
    return filtered.filter(p => !restocked.has(this.getProductKey(p)));
  }

  /**
   * Setup search filters for dropdowns
   */
  private setupSearchFilters(): void {
    // Pick slip search filter
    this.pickSlipSearchControl.valueChanges
      .pipe(
        startWith(''),
        map(search => search?.toLowerCase() || ''),
        takeUntil(this.destroy$)
      )
      .subscribe(searchTerm => {
        const filtered = this.pickSlips().filter(ps =>
          ps.pickSlipId.toLowerCase().includes(searchTerm) ||
          (ps.warehouseId && ps.warehouseId.toLowerCase().includes(searchTerm))
        );
        this.filteredPickSlips.set(filtered);
      });

    // Product code search filter
    this.productCodeSearchControl.valueChanges
      .pipe(
        startWith(''),
        map(search => search?.toLowerCase() || ''),
        takeUntil(this.destroy$)
      )
      .subscribe(searchTerm => {
        const filtered = this.productCodes().filter(pc =>
          pc.code.toLowerCase().includes(searchTerm) ||
          pc.description.toLowerCase().includes(searchTerm)
        );
        this.filteredProductCodes.set(filtered);
      });

    // ABO/Rh search filter
    this.aboRhSearchControl.valueChanges
      .pipe(
        startWith(''),
        map(search => search?.toLowerCase() || ''),
        takeUntil(this.destroy$)
      )
      .subscribe(searchTerm => {
        const filtered = this.aboRhOptions().filter(abo =>
          abo.code.toLowerCase().includes(searchTerm) ||
          abo.description.toLowerCase().includes(searchTerm)
        );
        this.filteredAboRhOptions.set(filtered);
      });

    // Device search filter
    this.deviceSearchControl.valueChanges
      .pipe(
        startWith(''),
        map(search => search?.toLowerCase() || ''),
        takeUntil(this.destroy$)
      )
      .subscribe(searchTerm => {
        const filtered = this.storageDevices().filter(d =>
          d.description.toLowerCase().includes(searchTerm) ||
          d.deviceType.toLowerCase().includes(searchTerm)
        );
        this.filteredDevices.set(filtered);
      });

    // Rack search filter
    this.rackSearchControl.valueChanges
      .pipe(
        startWith(''),
        map(search => search?.toLowerCase() || ''),
        takeUntil(this.destroy$)
      )
      .subscribe(searchTerm => {
        const filtered = this.storageRacks().filter(r =>
          r.rackNumber.toLowerCase().includes(searchTerm) ||
          r.description.toLowerCase().includes(searchTerm)
        );
        this.filteredRacks.set(filtered);
      });

    // Tray search filter
    this.traySearchControl.valueChanges
      .pipe(
        startWith(''),
        map(search => search?.toLowerCase() || ''),
        takeUntil(this.destroy$)
      )
      .subscribe(searchTerm => {
        const filtered = this.storageTrays().filter(t =>
          t.trayNumber.toLowerCase().includes(searchTerm) ||
          t.description.toLowerCase().includes(searchTerm)
        );
        this.filteredTrays.set(filtered);
      });
  }

  /**
   * Get form controls for pick slip form
   */
  get pf() {
    return this.pickSlipForm.controls;
  }

  /**
   * Get form controls for filter form
   */
  get f() {
    return this.filterForm.controls;
  }

  /**
   * Get unique product key for tracking restocked status
   */
  private getProductKey(product: PickSlipProductDto): string {
    return `${product.unitId}_${product.productCode}_${product.aliquot}`;
  }

  /**
   * Handle Unit ID post-validation from UnitIdFieldComponent.
   * Validates the scanned unit exists in the pick slip, then calls confirm/reject.
   * Product is added to the table in onUnitValidated (after confirm).
   */
  onUnitPostValidate(event: UnitIdPostValidateEvent): void {
    this.unitScannedWarning = '';
    const unitId = event.data?.parsedUnitId;

    if (!unitId) {
      event.reject?.('Invalid unit ID');
      return;
    }

    const pickSlip = this.selectedPickSlip();
    if (!pickSlip) {
      event.reject?.('Please select an Unpack Slip ID first');
      return;
    }

    const product = this.products().find(p =>
      p.unitId.toUpperCase() === unitId.toUpperCase()
    );

    if (product) {
      const alreadyRestocked = this.restockedProducts().has(this.getProductKey(product));
      if (alreadyRestocked) {
        this.unitScannedWarning = 'This Unit ID has already been restocked';
      }
      this.pendingProduct = product;
      this.currentFilterUnitId = unitId;

      this.currentWarehouseId = product.warehouseId || this.headerService.getCurrentWarehouseId();
      this.currentProductType = product.productType || product.productCode || '';
      this.currentBloodType = product.bloodType || '';
      this.currentUnitSchemeType = product.unitSchemeType || 'C';
      this.loadStorageDevices();

      event.confirm?.();
    } else {
      event.reject?.('Unit ID not found in this pick slip');
    }
  }

  /**
   * Handle Unit ID validated event — fires after postValidate confirm().
   * Adds the product to the table and clears the field for next scan.
   */
  onUnitValidated(_data: UnitValidationResponse): void {
  }

  onUnitCleared(): void {
    this.unitScannedWarning = '';
    this.pendingProduct = null;
    this.selectedProduct.set(null);
    this.currentFilterUnitId = '';
  }

  onUnitFieldFocus(): void {
    this.unitScannedWarning = '';
  }

  openProductsPanel(): void {
    this.showProductsPanel.set(true);
  }

  closeProductsPanel(): void {
    this.showProductsPanel.set(false);
    const trigger = this.el.nativeElement.querySelector(`#${this.elementId('view-products-btn')}`);
    trigger?.focus();
  }

  onPanelButtonClick(action: string): void {
    if (action === 'exit') {
      this.closeProductsPanel();
    }
  }

  onLocationSelected(): void {
    const deviceValue = this.f['device'].value;
    const rack = this.f['rack'].value;
    const tray = this.f['tray'].value;

    if (!deviceValue || !rack || !tray) return;

    const productsToRestock = this.getProductsToRestock();
    if (productsToRestock.length === 0) return;

    const selectedTray = this.storageTrays().find(t => t.trayNumber === tray);

    if (selectedTray?.isFull) {
      const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
        data: {
          title: 'Tray Full',
          message: 'Tray is full. Use the same tray?',
          confirmText: 'Yes',
          cancelText: 'No'
        } as ConfirmActionDialogData,
        width: '400px',
        disableClose: true
      });

      dialogRef.afterClosed().subscribe((result) => {
        if (result) {
          this.restockBatch(productsToRestock, deviceValue, rack, tray);
        } else {
          this.filterForm.patchValue({ tray: '' }, { emitEvent: false });
        }
      });
    } else {
      this.restockBatch(productsToRestock, deviceValue, rack, tray);
    }
  }

  onSortChange(event: { column: string; direction: 'A' | 'D' | 'default' }): void {
    this.tableConfig = {
      ...this.tableConfig,
      sortConfig: { column: event.column, direction: event.direction }
    };

    const products = [...this.displayProducts()];
    if (event.direction === 'default') {
      this.displayProducts.set(products);
      return;
    }

    products.sort((a, b) => {
      const aVal = a.isRestocked ? 1 : 0;
      const bVal = b.isRestocked ? 1 : 0;
      return event.direction === 'A' ? aVal - bVal : bVal - aVal;
    });
    this.displayProducts.set(products);
  }

  private restockBatch(
    productsToRestock: PickSlipProductDto[],
    deviceValue: string,
    rack: string,
    tray: string
  ): void {
    const warehouseId = this.currentWarehouseId || this.headerService.getCurrentWarehouseId();
    const selectedTray = this.storageTrays().find(t => t.trayNumber === tray);
    const shelfNumber = selectedTray?.shelfNumber || '';
    const locationId = `${warehouseId}${this.selectedDeviceType}${this.selectedDeviceNumber}${rack}${shelfNumber}${tray}`;

    const items: RestockProductItemDto[] = productsToRestock.map(p => ({
      unitId: p.unitId,
      productCode: p.productCode,
      aliquot: p.aliquot,
      collDate: p.collDate,
      locationId,
      warehouseId,
      deviceType: this.selectedDeviceType,
      deviceNumber: this.selectedDeviceNumber,
      rackNumber: rack,
      trayNumber: tray,
      productType: this.currentProductType
    }));

    const request: RestockProductRequestDto = {
      pickSlipId: this.selectedPickSlip()!.pickSlipId,
      chapterId: this.headerService.getCurrentChapterId(),
      products: items
    };

    this.isRestocking.set(true);
    this.service.restockProducts(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            const restocked = new Set(this.restockedProducts());
            productsToRestock.forEach(p => restocked.add(this.getProductKey(p)));
            this.restockedProducts.set(restocked);

            const newEntries: DisplayProductDto[] = productsToRestock.map(p => ({
              ...p,
              device: deviceValue,
              rack: rack,
              tray: tray,
              isRestocked: true
            }));
            const current = this.displayProducts();
            this.displayProducts.set([...current, ...newEntries]);

            const count = response.data?.productsRestocked || items.length;
            const msg = `${count} ${count === 1 ? 'Entry' : 'Entries'} restocked.`;
            this.statusAnnouncement.set(msg);
            this.showSuccess(msg);

            if (response.data?.pickSlipClosed) {
              this.showSuccess('Pick slip closed — all products restocked.');
              this.loadPickSlips();
            }

            this.currentFilterUnitId = '';
            this.pendingProduct = null;
            this.selectedProduct.set(null);
            this.unitScannedWarning = '';
            this.filterForm.reset();
            this.unitIdField?.clear();
            this.unitIdField?.focus();
          } else {
            this.showError(response.message || 'Failed to restock products');
          }
          this.isRestocking.set(false);
        },
        error: (err) => {
          this.showError(err.error?.message || 'Failed to restock products');
          this.isRestocking.set(false);
        }
      });
  }

  /**
   * Clear pick slip selection
   */
  clearPickSlip(): void {
    this.pickSlipForm.reset();
    this.selectedPickSlip.set(null);
    this.clearProducts();
    this.clearFilters();
    this.unitScannedWarning = '';
    this.pendingProduct = null;
    this.unitIdField?.clear();
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.filterForm.reset();
    this.currentFilterUnitId = '';
    this.pendingProduct = null;
    this.selectedProduct.set(null);
    this.unitScannedWarning = '';
    this.unitIdField?.clear();
  }

  /**
   * Clear products
   */
  private clearProducts(): void {
    this.products.set([]);
    this.displayProducts.set([]);
    this.restockedProducts.set(new Set());
    this.currentFilterUnitId = '';
    this.productCodes.set([]);
    this.aboRhOptions.set([]);
    this.storageDevices.set([]);
    this.storageRacks.set([]);
    this.storageTrays.set([]);
    this.filteredProductCodes.set([]);
    this.filteredAboRhOptions.set([]);
    this.filteredDevices.set([]);
    this.filteredRacks.set([]);
    this.filteredTrays.set([]);
    this.currentProductType = '';
    this.currentBloodType = '';
    this.currentWarehouseId = '';
    this.currentInventoryClass = 'RE';
    this.currentUnitSchemeType = 'C';
    this.selectedDeviceType = '';
    this.selectedDeviceNumber = '';
    this.selectedRackMixAbo = 'N';
    this.selectedRackMixProduct = 'N';
    this.selectedRackShipAnyRh = 'N';
  }

  /**
   * Show error message in snackbar (top right corner)
   */
  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }

  /**
   * Show success message in snackbar (top right corner)
   */
  private showSuccess(message: string): void {
    this.snackBar.open(message, 'DISMISS', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
  }
}
