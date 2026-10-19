import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  inject,
  signal,
  computed,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import moment from 'moment';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TableSortEvent, TablePageEvent } from '@shared/interfaces/data-table.interface';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { UnitIdFieldComponent, UnitIdPostValidateEvent } from '@shared/components/unit-id-field/unit-id-field.component';
import { WarningOverrideDialogComponent, WarningOverrideDialogData, WarningOverrideDialogResult } from './dialogs/warning-override-dialog';
import { WarehouseCheckInApiService } from './services/warehouse-checkin-api.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import {
  WarehouseCheckInRequestDto,
  CheckedInUnitRow,
  UnitValidationInfo,
  LocationLookupOption,
  ProductCodeOption,
  UnitProductDto,
  ValidationWarning,
  ValidateAllRequestDto,
  ERROR_CODE_MESSAGES,
} from './models/warehouse-checkin.model';

@Component({
  selector: 'app-warehouse-checkin',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule,
    NgxMatSelectSearchModule,
    MatSnackBarModule,
    MatDialogModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    UnitIdFieldComponent,
  ],
  templateUrl: './warehouse-checkin.html',
  styleUrl: './warehouse-checkin.scss'
})
export class WarehouseCheckIn implements OnInit, OnDestroy {
  @ViewChild('unitIdField') unitIdField!: UnitIdFieldComponent;

  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(WarehouseCheckInApiService);
  private readonly headerService = inject(HeaderService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly destroy$ = new Subject<void>();

  // Warehouse ID resolved during the location cascade
  private locationWarehouseId: string | null = null;
  private locationWarehouseName: string = '';
  // Full "H - Home Warehouse" label resolved from the chapter warehouses API
  protected readonly resolvedWarehouseLabel = signal<string>('');
  // deviceType from the 4b response, forwarded to 4c/4d calls
  private selectedDeviceType: string | null = null;
  // Held until validateAll resolves — mirrors lab-warehouse-checkin pattern so
  // cancel on the warning dialog calls event.reject() and shows the error below the unit ID field.
  private pendingValidateEvent: UnitIdPostValidateEvent | null = null;

  // --- Signals ---
  readonly checkInTemp = signal<number | null>(null);
  protected readonly parsedUnitId = signal<string | null>(null);
  readonly scannedUnits = signal<CheckedInUnitRow[]>([]);
  readonly loading = signal<boolean>(false);
  readonly validating = signal<boolean>(false);
  readonly validationInfo = signal<UnitValidationInfo | null>(null);
  readonly successCount = signal<number>(0);

  // Product code dropdown
  readonly productSearchControl = new FormControl('');
  protected readonly productOptions = signal<ProductCodeOption[]>([]);
  protected readonly filteredProductOptions = signal<ProductCodeOption[]>([]);

  // Aliquot dropdown
  readonly aliquotSearchControl = new FormControl('');
  protected readonly aliquotOptions = signal<string[]>([]);
  protected readonly filteredAliquotOptions = signal<string[]>([]);
  private readonly unitProducts = signal<UnitProductDto[]>([]);

  // Location cascade state
  protected readonly locationLoading = signal<boolean>(false);
  protected readonly deviceError = signal<string | null>(null);
  protected readonly rackError = signal<string | null>(null);
  protected readonly trayError = signal<string | null>(null);
  readonly deviceOptions = signal<LocationLookupOption[]>([]);
  protected readonly rackOptions = signal<LocationLookupOption[]>([]);
  protected readonly trayOptions = signal<LocationLookupOption[]>([]);

  // Search controls for location dropdowns
  readonly deviceSearchControl = new FormControl('');
  readonly rackSearchControl = new FormControl('');
  readonly traySearchControl = new FormControl('');
  protected readonly filteredDeviceOptions = signal<LocationLookupOption[]>([]);
  protected readonly filteredRackOptions = signal<LocationLookupOption[]>([]);
  protected readonly filteredTrayOptions = signal<LocationLookupOption[]>([]);

  // Sort and pagination state
  private readonly sortColumn = signal<string>('unitId');
  private readonly sortDirection = signal<'A' | 'D' | 'default'>('D');
  private readonly currentPageIndex = signal<number>(0);
  private readonly currentPageSize = signal<number>(10);

  // --- Computed ---
  readonly canScan = computed(() => this.checkInTemp() !== null);
  readonly canCommit = computed(() =>
    this.validationInfo()?.isValid === true && !this.loading() && !this.validating()
  );
  readonly isEmpty = computed(() => this.scannedUnits().length === 0);
  protected readonly warehouseLabel = computed(() => {
    const id = this.headerService.warehouseId();
    if (!id || id === 'undefined') return '';
    return id;
  });

  // Sorted + paginated slice of scannedUnits fed to the table
  readonly tableData = computed(() => {
    const units = [...this.scannedUnits()];
    const col = this.sortColumn();
    const dir = this.sortDirection();
    const dateColumns = new Set(['collectionDate', 'expirationDate']);

    if (dir !== 'default') {
      units.sort((a, b) => {
        const aVal = (a as any)[col] ?? '';
        const bVal = (b as any)[col] ?? '';
        let cmp: number;
        if (dateColumns.has(col)) {
          const aMs = moment(String(aVal), ['DD-MMM-YYYY HH:mm', 'DD-MMM-YYYY']).valueOf();
          const bMs = moment(String(bVal), ['DD-MMM-YYYY HH:mm', 'DD-MMM-YYYY']).valueOf();
          cmp = (isNaN(aMs) ? 0 : aMs) - (isNaN(bMs) ? 0 : bMs);
        } else {
          cmp = String(aVal).localeCompare(String(bVal));
        }
        return dir === 'A' ? cmp : -cmp;
      });
    }

    const start = this.currentPageIndex() * this.currentPageSize();
    return units.slice(start, start + this.currentPageSize());
  });

  // Reactive table config — keeps totalRecords and sort state in sync
  readonly tableConfig = computed<DataTableConfig<CheckedInUnitRow>>(() => ({
    columns: [
      { key: 'unitId',         header: `Unit ID (${this.scannedUnits().length})`, sortable: true  },
      { key: 'collectionDate', header: 'Collection Date',  sortable: false },
      { key: 'product',        header: 'Product',          sortable: false },
      { key: 'aliquot',        header: 'Al',               sortable: false },
      { key: 'expirationDate', header: 'Expiration Date',  sortable: false },
      { key: 'class',          header: 'Class',            sortable: false },
      { key: 'warehouseId',    header: 'Warehouse ID',     sortable: false },
      { key: 'deviceNumber',   header: 'Device Number',    sortable: false },
      { key: 'rackNumber',     header: 'Rack Number',      sortable: false },
      { key: 'trayNumber',     header: 'Tray Number',      sortable: false },
    ],
    showPagination: true,
    pagination: {
      pageSize:        this.currentPageSize(),
      pageIndex:       this.currentPageIndex(),
      totalRecords:    this.scannedUnits().length,
      pageSizeOptions: [10, 25, 50, 100],
    },
    sortConfig: {
      column:    this.sortColumn(),
      direction: this.sortDirection(),
    },
    emptyMessage:     'No Results to Display - Enter Check-in temperature to begin.',
    showTableOnEmpty: this.canScan(),
  }));

  // Forms
  tempForm!: FormGroup;
  scanForm!: FormGroup;

  pageHeaderConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
  };

  constructor() {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.pageHeaderConfig = {
          ...this.pageHeaderConfig,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null },
          ],
          title: pageData.title,
          subtitle: pageData.subtitle || '',
        };
      }
    });
  }

  ngOnInit(): void {
    this.initForms();
    this.loadWarehouseName();
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadWarehouseName());
  }

  private loadWarehouseName(): void {
    const chapterId  = this.headerService.getCurrentChapterId();
    const warehouseId = this.headerService.getCurrentWarehouseId();
    if (!chapterId || !warehouseId) return;

    this.apiService.getChapterWarehouses(chapterId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(warehouses => {
        const match = warehouses.find(w => w.warehouseId === warehouseId);
        if (match) {
          this.resolvedWarehouseLabel.set(`${match.warehouseId} - ${match.warehouseName}`);
          this.locationWarehouseName = match.warehouseName;
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForms(): void {
    // Temperature form — default null (empty) per design
    this.tempForm = this.fb.group({
      checkInTemp: [null, [Validators.required]]
    });

    // Scan form — unitId managed by app-unit-id-field, not a form control here
    this.scanForm = this.fb.group({
      productCode: ['', [Validators.required, Validators.maxLength(10)]],
      aliquot: [''],
      deviceNumber: [''],
      rackNumber: [''],
      trayNumber: ['']
    });

    this.scanForm.get('productCode')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((code: string) => {
        if (!code) return;
        const matching = this.unitProducts().filter(p => p.productCode === code);
        const aliquots = [...new Set(matching.map(p => p.aliquot).filter(Boolean))];
        this.aliquotOptions.set(aliquots);
        this.filteredAliquotOptions.set(aliquots);

        if (aliquots.length <= 1) {
          const aliquot = aliquots[0] || '';
          this.scanForm.patchValue({ aliquot }, { emitEvent: false });
          const product = matching[0];
          if (product) this.bindProductData(product);
          const unitId = this.parsedUnitId();
          if (unitId) this.runValidateAll(unitId, code, aliquot);
        } else {
          this.scanForm.patchValue({ aliquot: '' }, { emitEvent: false });
          const product = matching[0];
          if (product) this.bindProductData(product);
        }
      });

    this.scanForm.get('aliquot')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((aliquot: string) => {
        if (!aliquot) return;
        const code = this.scanForm.get('productCode')?.value;
        const product = this.unitProducts().find(p => p.productCode === code && p.aliquot === aliquot);
        if (product) this.bindProductData(product);
        const unitId = this.parsedUnitId();
        if (unitId && code) this.runValidateAll(unitId, code, aliquot);
      });

    // Aliquot search filtering
    this.aliquotSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((term) => {
        const t = (term || '').toLowerCase().trim();
        this.filteredAliquotOptions.set(
          t ? this.aliquotOptions().filter(a => a.toLowerCase().includes(t)) : this.aliquotOptions()
        );
      });

    // Step 4a: device selected → capture deviceType, load racks
    this.scanForm.get('deviceNumber')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((device: string) => {
        if (device) {
          const opt = this.deviceOptions().find(d => d.value === device);
          this.selectedDeviceType = opt?.deviceType ?? null;
          this.rackOptions.set([]);
          this.trayOptions.set([]);
          this.scanForm.patchValue({ rackNumber: '', trayNumber: '' }, { emitEvent: false });
          this.rackError.set(null);
          this.trayError.set(null);
          this.loadRacks();
        }
      });

    // Product search filtering
    this.productSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((term) => {
        const t = (term || '').toLowerCase().trim();
        this.filteredProductOptions.set(
          t ? this.productOptions().filter(p =>
              p.productCode.toLowerCase().includes(t) ||
              (p.productDesc || '').toLowerCase().includes(t)
            )
            : this.productOptions()
        );
      });

    // Device search filtering
    this.deviceSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((term) => {
        const t = (term || '').toLowerCase().trim();
        this.filteredDeviceOptions.set(
          t ? this.deviceOptions().filter(o => o.label.toLowerCase().includes(t) || o.value.toLowerCase().includes(t))
            : this.deviceOptions()
        );
      });

    // Rack search filtering
    this.rackSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((term) => {
        const t = (term || '').toLowerCase().trim();
        this.filteredRackOptions.set(
          t ? this.rackOptions().filter(o => o.label.toLowerCase().includes(t) || o.value.toLowerCase().includes(t))
            : this.rackOptions()
        );
      });

    // Tray search filtering
    this.traySearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((term) => {
        const t = (term || '').toLowerCase().trim();
        this.filteredTrayOptions.set(
          t ? this.trayOptions().filter(o => o.label.toLowerCase().includes(t) || o.value.toLowerCase().includes(t))
            : this.trayOptions()
        );
      });

    // Step 4b: rack selected → load trays
    this.scanForm.get('rackNumber')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((rack: string) => {
        if (rack) {
          this.trayOptions.set([]);
          this.scanForm.patchValue({ trayNumber: '' }, { emitEvent: false });
          this.trayError.set(null);
          this.loadTrays();
        }
      });

    // Tray capacity check — mirrors Oracle conf_over_loc
    this.scanForm.get('trayNumber')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((tray: string) => {
        if (!tray) return;
        const opt = this.trayOptions().find(t => t.value === tray);
        if (opt?.trayCapacity != null && opt?.itemCount != null && opt.itemCount >= opt.trayCapacity) {
          this.showWarningDialog(
            'Tray Capacity Warning',
            [{ code: 'TRAY_FULL', message: `Tray ${tray} is at capacity (${opt.itemCount}/${opt.trayCapacity} items)` }],
            (proceed) => {
              if (!proceed) {
                this.scanForm.patchValue({ trayNumber: '' }, { emitEvent: false });
              }
            }
          );
        }
      });
  }

  get tempFormControl() { return this.tempForm.controls; }
  get scanFormControl() { return this.scanForm.controls; }

  // ==================== Temperature ====================

  onTempChange(): void {
    let temp = this.tempForm.get('checkInTemp')?.value;
    if (temp !== null && temp !== undefined) {
      const str = String(temp);
      if (str.length > 7) {
        temp = parseFloat(str.substring(0, 7));
        this.tempForm.patchValue({ checkInTemp: temp }, { emitEvent: false });
      }
    }
    this.checkInTemp.set(temp ?? null);
    // Re-run validate-all so temperature result is included immediately
    const unitId = this.parsedUnitId();
    const productCode = this.scanForm.get('productCode')?.value;
    const aliquot = this.scanForm.get('aliquot')?.value;
    if (unitId && productCode) {
      this.runValidateAll(unitId, productCode, aliquot);
    }
  }

  onClearTemp(): void {
    this.tempForm.patchValue({ checkInTemp: null });
    this.checkInTemp.set(null);
    this.clearScanFields();
    this.scannedUnits.set([]);
    this.successCount.set(0);
  }

  // ==================== Unit ID (app-unit-id-field) ====================

  /** Called by app-unit-id-field after barcode format validation passes. */
  onPostValidate(event: UnitIdPostValidateEvent): void {
    this.parsedUnitId.set(event.data.parsedUnitId);
    this.validationInfo.set(null);
    this.resetLocationState();

    // Load available products — confirms or rejects the unit field based on API response
    this.loadUnitProducts(event.data.parsedUnitId, event);

    // If product code already selected, run consolidated validation now
    const productCode = this.scanForm.get('productCode')?.value;
    const aliquot = this.scanForm.get('aliquot')?.value;
    if (productCode) {
      this.runValidateAll(event.data.parsedUnitId, productCode, aliquot);
    }
  }

  /** Called by app-unit-id-field when the field is cleared. */
  onUnitIdCleared(): void {
    this.pendingValidateEvent = null;
    this.parsedUnitId.set(null);
    this.validationInfo.set(null);
    this.resetLocationState();
    this.unitProducts.set([]);
    this.productOptions.set([]);
    this.filteredProductOptions.set([]);
    this.productSearchControl.setValue('', { emitEvent: false });
    this.aliquotOptions.set([]);
    this.filteredAliquotOptions.set([]);
    this.aliquotSearchControl.setValue('', { emitEvent: false });
    this.scanForm.patchValue({ productCode: '', aliquot: '' }, { emitEvent: false });
  }

  /** POST /warehouse-checkin/validate — single call covering all validations */
  private runValidateAll(unitId: string, productCode: string, aliquot?: string): void {
    if (!unitId || !productCode) return;

    this.validating.set(true);

    const request: ValidateAllRequestDto = {
      unitId,
      productCode,
      aliquot: aliquot || undefined,
      temperature: this.checkInTemp() ?? null,
    };

    this.apiService.validateAll(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.validating.set(false);

          if (response.isValid) {
            // Use the receiving warehouse (logged-in user's warehouse) not the source warehouse
            const receivingWarehouseId = this.headerService.getCurrentWarehouseId() || '';
            this.validationInfo.update(info => ({
              collectionDate: this.formatDate(response.collectionDate) || info?.collectionDate || '',
              expirationDate: this.formatDateTime(response.expirationDate) || info?.expirationDate || '',
              class: response.productClass || info?.class || '',
              warehouseId: receivingWarehouseId || info?.warehouseId || '',
              productType: info?.productType || '',
              isValid: true,
            }));

            // All warnings already collected server-side — show once in a single dialog
            const warnings: ValidationWarning[] = (response.warnings ?? []).map(w => ({
              code: w.code,
              message: w.message || ERROR_CODE_MESSAGES[w.code] || `Warning ${w.code}`,
            }));

            if (warnings.length > 0) {
              this.showWarningDialog('Unit Validation Warnings', warnings, (proceed) => {
                if (proceed) {
                  // User accepted warnings — confirm the unit ID field and load locations
                  this.pendingValidateEvent?.confirm();
                  this.pendingValidateEvent = null;
                  this.loadLocationCascade();
                } else {
                  // User cancelled — show error below unit ID field (mirrors lab-warehouse-checkin)
                  this.pendingValidateEvent?.reject('Validation canceled');
                  this.pendingValidateEvent = null;
                  this.validationInfo.update(info => info ? { ...info, isValid: false } : null);
                }
              });
            } else {
              // Clean pass — confirm immediately
              this.pendingValidateEvent?.confirm();
              this.pendingValidateEvent = null;
              this.loadLocationCascade();
            }
          } else {
            const code = response.errorCode || '';
            const msg = ERROR_CODE_MESSAGES[code] || response.errorMessage || 'Unit validation failed';
            // Hard error — reject the unit ID field so the error appears below it
            this.pendingValidateEvent?.reject(msg);
            this.pendingValidateEvent = null;
            this.showWarningDialog('Validation Error', [{ code: code || 'ERROR', message: msg }], () => {}, false);
            this.validationInfo.update(info => info ? { ...info, isValid: false } : null);
          }
        },
        error: (err) => {
          this.validating.set(false);
          const code = err.errorCode || '';
          const msg = ERROR_CODE_MESSAGES[code] || err.message || 'Failed to validate unit';
          this.pendingValidateEvent?.reject(msg);
          this.pendingValidateEvent = null;
          this.showWarningDialog('Validation Error', [{ code: code || 'ERROR', message: msg }], () => {}, false);
          this.validationInfo.update(info => info ? { ...info, isValid: false } : null);
        }
      });
  }

  private showWarningDialog(
    title: string,
    warnings: ValidationWarning[],
    callback: (proceed: boolean) => void,
    allowOverride = true
  ): void {
    const dialogData: WarningOverrideDialogData = {
      title,
      warnings,
      allowOverride,
    };

    const dialogRef = this.dialog.open(WarningOverrideDialogComponent, {
      width: '560px',
      disableClose: true,
      data: dialogData,
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result: WarningOverrideDialogResult) => {
        callback(result?.override ?? false);
      });
  }

  // ==================== Unit Products ====================

  /** GET /warehouse-checkin/unit/{unitId}/products — called right after unit ID format validates. */
  private loadUnitProducts(unitId: string, event?: UnitIdPostValidateEvent): void {
    this.apiService.getUnitProducts(unitId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (products: UnitProductDto[]) => {
          this.unitProducts.set(products);

          if (products.length === 0) {
            event?.reject('No products found for this unit');
            return;
          }

          this.bindProductData(products[0]);

          const distinctCodes = new Map<string, ProductCodeOption>();
          for (const p of products) {
            if (!distinctCodes.has(p.productCode)) {
              distinctCodes.set(p.productCode, { productCode: p.productCode });
            }
          }
          const options = Array.from(distinctCodes.values());

          if (options.length === 1) {
            // Single product: defer confirm until validateAll completes
            this.pendingValidateEvent = event ?? null;
          } else {
            // Multiple products: unit exists, confirm the field now;
            // validateAll will run when the user picks a product code
            event?.confirm();
            this.pendingValidateEvent = null;
          }

          this.setProductOptions(options);
        },
        error: (err) => {
          this.pendingValidateEvent = null;
          this.unitProducts.set([]);
          this.setProductOptions([]);
          const message = err?.error?.message || err?.message || 'Failed to load unit products';
          event?.reject(message);
          this.showError(message);
        }
      });
  }

  private setProductOptions(options: ProductCodeOption[]): void {
    this.productOptions.set(options);
    this.filteredProductOptions.set(options);
    if (options.length === 1) {
      const code = options[0].productCode;
      const prevCode = this.scanForm.get('productCode')?.value;
      this.scanForm.patchValue({ productCode: code }, { emitEvent: false });

      const matching = this.unitProducts().filter(p => p.productCode === code);
      const aliquots = [...new Set(matching.map(p => p.aliquot).filter(Boolean))];
      this.aliquotOptions.set(aliquots);
      this.filteredAliquotOptions.set(aliquots);
      const aliquot = aliquots.length === 1 ? aliquots[0] : '';
      this.scanForm.patchValue({ aliquot }, { emitEvent: false });
      if (matching[0]) this.bindProductData(matching[0]);

      if (prevCode !== code) {
        const unitId = this.parsedUnitId();
        if (unitId) {
          this.runValidateAll(unitId, code, aliquot);
        }
      }
    }
  }

  /** Bind product data directly to the display labels. */
  private bindProductData(product: UnitProductDto): void {
    // Use the receiving warehouse (logged-in user's warehouse) not the source warehouse
    const receivingWarehouseId = this.headerService.getCurrentWarehouseId() || '';
    this.validationInfo.set({
      collectionDate: this.formatDate(product.collDate),
      expirationDate: this.formatDateTime(product.expDate),
      class: product.inventoryClass || '',
      warehouseId: receivingWarehouseId,
      productType: product.productType || '',
      isValid: false,
    });
  }

  // ==================== Location Cascade ====================

  private get currentProductCode(): string {
    return this.scanForm.get('productCode')?.value ?? '';
  }

  private get currentProduct(): UnitProductDto | undefined {
    const aliquot = this.scanForm?.get('aliquot')?.value;
    return this.unitProducts().find(p =>
      p.productCode === this.currentProductCode &&
      (!aliquot || p.aliquot === aliquot)
    );
  }

  private get currentProductType(): string {
    return this.currentProduct?.productType ?? '';
  }


  /** 4a — GET /location-lookup?productCode=X → warehouses */
  private loadLocationCascade(): void {
    this.locationLoading.set(true);
    this.deviceError.set(null);
    this.rackError.set(null);
    this.trayError.set(null);
    this.locationWarehouseId = null;
    this.selectedDeviceType = null;
    this.deviceOptions.set([]);
    this.rackOptions.set([]);
    this.trayOptions.set([]);
    this.scanForm.patchValue({ deviceNumber: '', rackNumber: '', trayNumber: '' }, { emitEvent: false });

    this.apiService.getLocationLookup({ productCode: this.currentProductCode, productType: this.currentProductType || undefined })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (warehouses) => {
          if (warehouses.length === 0) {
            this.locationLoading.set(false);
            this.deviceError.set('No warehouse location available');
            return;
          }
          // Use the logged-in user's warehouse (receiving warehouse) — mirrors :GLOBAL.warehouse in the FMB.
          // destinationWarehouse from validate-unit is null for no-batch cases (9925/9926),
          // so headerService is the only reliable source.
          const receivingWh = this.headerService.getCurrentWarehouseId();
          const matched = warehouses.find(w => w.value === receivingWh) ?? warehouses[0];
          this.locationWarehouseId = matched.value;
          this.loadDevices();
        },
        error: () => {
          this.locationLoading.set(false);
          this.deviceError.set('Failed to load warehouse locations');
        }
      });
  }

  /** 4b — GET /location-lookup?productCode=X&warehouseId=Y&productType=Z → devices */
  private loadDevices(): void {
    const warehouseId = this.locationWarehouseId;
    if (!warehouseId) return;

    this.apiService.getLocationLookup({
      productCode: this.currentProductCode,
      warehouseId,
      productType: this.currentProductType,
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (devices) => {
          if (devices.length === 0) {
            this.locationLoading.set(false);
            this.deviceError.set('No storage devices available for this warehouse');
            return;
          }
          this.deviceOptions.set(devices);
          this.filteredDeviceOptions.set(devices);
          this.deviceSearchControl.setValue('', { emitEvent: false });
          this.locationLoading.set(false);
        },
        error: () => {
          this.locationLoading.set(false);
          this.deviceError.set('Failed to load storage devices');
        }
      });
  }

  /** 4c — GET /location-lookup?productCode&warehouseId&deviceNumber&deviceType&storageClass&productType&bloodType → racks */
  private loadRacks(): void {
    const warehouseId  = this.locationWarehouseId;
    const deviceNumber = this.scanForm.get('deviceNumber')?.value;
    if (!warehouseId || !deviceNumber) return;

    this.locationLoading.set(true);

    this.apiService.getLocationLookup({
      productCode:  this.currentProductCode,
      warehouseId,
      deviceNumber,
      productType:  this.currentProduct?.productType  || undefined,
      deviceType:   this.selectedDeviceType           ?? undefined,
      storageClass: this.currentProduct?.storageClass || undefined,
      bloodType:    this.currentProduct?.bloodType    || undefined,
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (racks) => {
          if (racks.length === 0) {
            this.locationLoading.set(false);
            this.rackError.set('No racks available for this device');
            return;
          }
          this.rackOptions.set(racks);
          this.filteredRackOptions.set(racks);
          this.rackSearchControl.setValue('', { emitEvent: false });
          this.locationLoading.set(false);
        },
        error: () => {
          this.locationLoading.set(false);
          this.rackError.set('Failed to load racks');
        }
      });
  }

  /** 4d — GET /location-lookup?...+rackNumber → trays */
  private loadTrays(): void {
    const warehouseId  = this.locationWarehouseId;
    const deviceNumber = this.scanForm.get('deviceNumber')?.value;
    const rackNumber   = this.scanForm.get('rackNumber')?.value;
    if (!warehouseId || !deviceNumber || !rackNumber) return;

    this.locationLoading.set(true);

    this.apiService.getLocationLookup({
      productCode:  this.currentProductCode,
      warehouseId,
      deviceNumber,
      rackNumber,
      productType:  this.currentProduct?.productType  || undefined,
      deviceType:   this.selectedDeviceType           ?? undefined,
      storageClass: this.currentProduct?.storageClass || undefined,
      bloodType:    this.currentProduct?.bloodType    || undefined,
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (trays) => {
          this.locationLoading.set(false);
          if (trays.length === 0) {
            this.trayError.set('No trays available for this rack');
            return;
          }
          this.trayOptions.set(trays);
          this.filteredTrayOptions.set(trays);
          this.traySearchControl.setValue('', { emitEvent: false });
        },
        error: () => {
          this.locationLoading.set(false);
          this.trayError.set('Failed to load trays');
        }
      });
  }

  // ==================== Commit ====================

  /** Step 8: POST /warehouse-checkin */
  onCommit(): void {
    if (!this.canCommit()) return;

    const unitId = this.parsedUnitId();
    const productCode = this.scanForm.get('productCode')?.value;
    const deviceNumber = this.scanForm.get('deviceNumber')?.value;
    const rackNumber = this.scanForm.get('rackNumber')?.value;
    const trayNumber = this.scanForm.get('trayNumber')?.value;
    let locationId: string | undefined;
    if (deviceNumber && rackNumber && trayNumber) {
      const wh         = this.locationWarehouseId || this.headerService.getCurrentWarehouseId() || '';
      const deviceType = this.selectedDeviceType ?? '';
      const dev        = deviceNumber.toString().padStart(2, '0');
      const rak        = rackNumber.toString().padStart(2, '0');
      const shelf      = '00';
      const tray       = trayNumber.toString(); // use as returned by API (e.g. "T001")
      // 12-char FMB format: {WH:1}{deviceType:1}{device:2}{rack:2}{shelf:2}{tray:4}
      // e.g. H + C + 10 + 08 + 00 + T001 → "HC1008 00T001" (12 chars)
      locationId = `${wh}${deviceType}${dev}${rak}${shelf}${tray}`;
    }

    const aliquot = this.scanForm.get('aliquot')?.value;
    const request: WarehouseCheckInRequestDto = {
      unitId: unitId || '',
      productCode,
      aliquot: aliquot || undefined,
      locationId,
      trayId: trayNumber || undefined,
      receiveTemp: this.checkInTemp() ?? undefined,
      quarantineFlag: false,
    };

    this.loading.set(true);

    this.apiService.checkIn(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loading.set(false);

          const info = this.validationInfo();
          const newRow: CheckedInUnitRow = {
            unitId: unitId || '',
            collectionDate: info?.collectionDate || '',
            product: productCode,
            aliquot: aliquot || '',
            expirationDate: info?.expirationDate || '',
            class: info?.class || '',
            warehouseId: this.locationWarehouseName
              ? `${this.locationWarehouseId} - ${this.locationWarehouseName}`
              : (this.locationWarehouseId || info?.warehouseId || ''),
            deviceNumber: deviceNumber || '',
            rackNumber: rackNumber || '',
            trayNumber: trayNumber || '',
            sequence: this.scannedUnits().length + 1,
          };

          this.scannedUnits.update(units => [newRow, ...units]);
          this.currentPageIndex.set(0);
          this.successCount.update(count => count + 1);
          this.clearUnitFields();

          const isQuarantined = response.stockState === 'QU';
          const hasTempWarn   = response.warningCode === '9928';

          if (isQuarantined || hasTempWarn) {
            const msg = response.warningMessage
              || response.message
              || (hasTempWarn ? ERROR_CODE_MESSAGES['9928'] : 'Unit checked in — quarantined');
            this.showWarning(msg);
          } else if (response.batchReconciled) {
            this.showSuccess(response.message || `Batch ${response.batchId} reconciled successfully`);
          } else {
            this.showSuccess(response.message || 'Unit checked in successfully');
          }

          this.unitIdField?.focus();
        },
        error: (err) => {
          this.loading.set(false);
          const code = err?.error?.errorResponse?.errorCode || err.errorCode || '';
          const msg  = ERROR_CODE_MESSAGES[code] || err?.error?.message || err.message || 'Failed to check in unit';
          this.showError(msg);
        }
      });
  }

  // ==================== Sort / Pagination ====================

  onSortChange(event: TableSortEvent): void {
    this.sortColumn.set(event.column);
    this.sortDirection.set(event.direction);
    this.currentPageIndex.set(0);
  }

  onPageChange(event: TablePageEvent): void {
    this.currentPageIndex.set(event.pageIndex);
    this.currentPageSize.set(event.pageSize);
  }

  // ==================== Clear / Reset ====================

  /** Clears unit/product/aliquot fields but preserves location selections for rapid scanning. */
  private clearUnitFields(): void {
    this.unitIdField?.clear();
    this.parsedUnitId.set(null);
    this.unitProducts.set([]);
    this.scanForm.patchValue({ productCode: '', aliquot: '' }, { emitEvent: false });
    this.productOptions.set([]);
    this.filteredProductOptions.set([]);
    this.productSearchControl.setValue('', { emitEvent: false });
    this.aliquotOptions.set([]);
    this.filteredAliquotOptions.set([]);
    this.aliquotSearchControl.setValue('', { emitEvent: false });
    this.validationInfo.set(null);
  }

  clearScanFields(): void {
    this.unitIdField?.clear();
    this.parsedUnitId.set(null);
    this.unitProducts.set([]);
    this.scanForm.patchValue(
      { productCode: '', aliquot: '', deviceNumber: '', rackNumber: '', trayNumber: '' },
      { emitEvent: false }
    );
    this.scanForm.markAsUntouched();
    this.scanForm.markAsPristine();
    this.productOptions.set([]);
    this.filteredProductOptions.set([]);
    this.productSearchControl.setValue('', { emitEvent: false });
    this.aliquotOptions.set([]);
    this.filteredAliquotOptions.set([]);
    this.aliquotSearchControl.setValue('', { emitEvent: false });
    this.validationInfo.set(null);
    this.resetLocationState();
  }

  /** CLEAR ALL button: resets the full scan row (Unit ID, Product Code, location). */
  clearAllScanFields(): void {
    this.clearScanFields();
  }

  private resetLocationState(): void {
    this.locationWarehouseId = null;
    this.selectedDeviceType = null;
    this.deviceOptions.set([]);
    this.rackOptions.set([]);
    this.trayOptions.set([]);
    this.filteredDeviceOptions.set([]);
    this.filteredRackOptions.set([]);
    this.filteredTrayOptions.set([]);
    this.deviceSearchControl.setValue('', { emitEvent: false });
    this.rackSearchControl.setValue('', { emitEvent: false });
    this.traySearchControl.setValue('', { emitEvent: false });
    this.deviceError.set(null);
    this.rackError.set(null);
    this.trayError.set(null);
    this.locationLoading.set(false);
  }

  // ==================== Utilities ====================

  private formatDate(value: string | null | undefined): string {
    if (!value) return '';
    const m = moment(value);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : '';
  }

  private formatDateTime(value: string | null | undefined): string {
    if (!value) return '';
    const m = moment(value);
    return m.isValid() ? m.format('DD-MMM-YYYY HH:mm').toUpperCase() : '';
  }

  onTrayNumberKeydown(event: Event): void {
    if (this.canCommit()) {
      event.preventDefault();
      this.onCommit();
    }
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'DISMISS', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }

  private showWarning(message: string): void {
    this.snackBar.open(message, 'DISMISS', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }

  onlyNumbers(event: KeyboardEvent): boolean {
    const key = event.key;
    const controlKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (controlKeys.includes(key) || (event.ctrlKey && ['a', 'c', 'v', 'x'].includes(key.toLowerCase()))) {
      return true;
    }
    if (!/^[\d.\-]$/.test(key)) {
      event.preventDefault();
      return false;
    }
    const input = event.target as HTMLInputElement;
    if (input.value.length >= 7) {
      event.preventDefault();
      return false;
    }
    return true;
  }
}
