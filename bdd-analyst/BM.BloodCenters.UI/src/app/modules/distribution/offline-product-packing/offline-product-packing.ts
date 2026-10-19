import { Component, OnInit, OnDestroy, inject, signal, computed, effect, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Observable, of, Subject, takeUntil, debounceTime, distinctUntilChanged, map } from 'rxjs';
import moment from 'moment';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, ErrorStateMatcher } from '@angular/material/core';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, SortConfig, TableSortEvent } from '@shared/interfaces/data-table.interface';
import { UnitIdFieldComponent } from '@shared/components/unit-id-field/unit-id-field.component';
import { UnitValidationResponse } from '@shared/components/unit-id-field/unit-id-field.model';
import { ScanSelectFieldComponent } from '@shared/components/scan-select-field/scan-select-field.component';
import { ScanSelectOption } from '@shared/components/scan-select-field/scan-select-field.model';
import { DonorLibLabelScanService } from '@shared/services/donor-lib-label-scan.service';

import { ConfirmActionDialogComponent } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';
import { ErrorDialogComponent } from '@shared/components/error-dialog/error-dialog.component';

import { OfflineProductPackingService } from './services/offline-product-packing.service';
import {
  OrderPackingDto,
  OrderPackingDetailDto,
  OrderItemPackingDto,
  PackedProductDto,
  BoxTypeLookupDto,
  PickSlipLookupDto,
  PackProductRequest,
  QuarantineProductRequest,
  CloseBoxRequest,
  PackStatusResponse,
  PackStatusProduct,
  BoxContentsItem,
  PackProductResponse,
  QuarantineProductResponse
} from './models/offline-product-packing.model';
import {
  CreateNewBoxDialogComponent,
  CreateNewBoxDialogData,
  CreateNewBoxDialogResult
} from './create-new-box-dialog/create-new-box-dialog';
import { ViewPackStatusDialogComponent } from './view-pack-status-dialog/view-pack-status-dialog';
import { ViewBoxContentsDialogComponent } from './view-box-contents-dialog/view-box-contents-dialog';

/**
 * Offline Product Packing Component
 * Main component for offline product packing operations
 * JIRA: MLT-14046
 * Mnemonic: PACKO
 */
@Component({
  selector: 'app-offline-product-packing',
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
    MatDatepickerModule,
    MatDialogModule,
    MatTooltipModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    UnitIdFieldComponent,
    ScanSelectFieldComponent
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './offline-product-packing.html',
  styleUrl: './offline-product-packing.scss'
})
export class OfflineProductPackingComponent implements OnInit, OnDestroy {
  // Program mnemonic for this module
  protected readonly mnemonic = 'PACKO';

  // Unique ID generation for accessibility
  private static nextId = 0;
  protected readonly componentId = `offline-product-packing-${OfflineProductPackingComponent.nextId++}`;

  // Generate unique IDs for elements
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  // Dependency injection
  private readonly fb = inject(FormBuilder);
  private readonly packingService = inject(OfflineProductPackingService);
  private readonly headerService = inject(HeaderService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly dialog = inject(MatDialog);
  private readonly labelScanService = inject(DonorLibLabelScanService);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);
  private readonly cdr = inject(ChangeDetectorRef);

  // Lifecycle management
  private readonly destroy$ = new Subject<void>();

  // Search control for the Order mat-select dropdown
  protected readonly orderSearchControl = new FormControl('');

  // Page header configuration
  headerConfig!: PageHeaderConfig;

  // Form
  packingForm!: FormGroup;

  // Signal-based state
  protected readonly loading = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);
  protected readonly allOrders = signal<OrderPackingDto[]>([]);
  protected readonly filteredOrders = signal<OrderPackingDto[]>([]);
  protected readonly selectedOrder = signal<OrderPackingDetailDto | null>(null);
  protected readonly orderLineItems = signal<OrderItemPackingDto[]>([]);
  protected readonly packedProducts = signal<PackedProductDto[]>([]);
  protected readonly currentBoxId = signal<string | null>(null);
  protected readonly submitted = signal<boolean>(false);

  // Product scanning state
  protected readonly isScanning = signal<boolean>(false);
  protected readonly lastScanResult = signal<{ success: boolean; message: string } | null>(null);
  protected readonly capacityWarning = signal<boolean>(false);
  protected readonly selectedItemNo = signal<number>(0);

  // Sort state
  protected readonly lineItemsSort = signal<SortConfig>({ column: 'itemNo', direction: 'default' });
  protected readonly packedProductsSort = signal<SortConfig>({ column: 'lineItemNo', direction: 'default' });

  // Toggle to force packed products table destroy/recreate for header count refresh
  protected readonly showPackedTable = signal<boolean>(true);

  // Last pack request for substitution re-submit
  private lastPackRequest: PackProductRequest | null = null;

  // Scan field validation state (label verification pattern)
  protected fieldErrors: Record<string, string> = {};
  protected fieldProcessing: Record<string, boolean> = {};

  // Barcode parse callbacks for scan-select fields
  protected readonly parseProductCode = (value: string): Observable<ScanSelectOption | null> => {
    return this.labelScanService.validateProductScan(value).pipe(
      map(res => res.success && res.item ? { code: res.item.productCode || value, description: '' } : null)
    );
  };

  protected readonly parseAboRh = (value: string): Observable<ScanSelectOption | null> => {
    return this.labelScanService.validateAboScan(value).pipe(
      map(res => res.success && res.item ? { code: res.item.aboCode || value, description: '' } : null)
    );
  };

  // Computed values
  protected readonly hasOrderSelected = computed(() => this.selectedOrder() !== null);
  protected readonly hasLineItems = computed(() => this.orderLineItems().length > 0);
  protected readonly hasPackedProducts = computed(() => this.packedProducts().length > 0);
  protected readonly isRetrieving = computed(() => this.loading() && !this.hasOrderSelected());
  protected readonly canScanProduct = computed(() => this.hasOrderSelected() && !this.isScanning());

  // Table column definitions
  protected readonly lineItemColumns: string[] = [
    'lineItemNumber',
    'productType',
    'productDescription',
    'aboRh',
    'quantity',
    'status'
  ];

  protected readonly packedProductsColumns: string[] = [
    'lineItemNo',
    'unitId',
    'product',
    'aboRh',
    'expirationDate',
    'time',
    'boxId'
  ];

  // Packed products display columns (per Figma - no separate time column)
  protected readonly packedProductsDisplayColumns: string[] = [
    'lineItemNo',
    'unitId',
    'product',
    'aboRh',
    'expirationDate',
    'boxId'
  ];

  // Selected line item for scan section display
  protected readonly selectedLineItem = computed(() => {
    const itemNo = this.selectedItemNo();
    if (itemNo > 0) return itemNo.toString();
    const lineItems = this.orderLineItems();
    if (lineItems.length > 0) return lineItems[0].itemNo.toString();
    return null;
  });

  // Type dropdown options - loaded from API (VSERV_MASTER with CODE_TYPE = 'BOXTP')
  private readonly allTypeOptions = signal<BoxTypeLookupDto[]>([]);
  protected readonly typeOptions = signal<BoxTypeLookupDto[]>([]);
  protected readonly typeOptionsLoading = signal<boolean>(false);

  // Pick slip options - loaded from API based on selected order
  protected readonly pickSlipOptions = signal<PickSlipLookupDto[]>([]);
  protected readonly pickSlipOptionsLoading = signal<boolean>(false);

  // Open boxes for selected order's consignee - loaded from API (legacy LOV: "Open Boxes For This Customer")
  protected readonly openBoxOptions = signal<BoxTypeLookupDto[]>([]);
  protected readonly openBoxOptionsLoading = signal<boolean>(false);

  // Date input references for manual entry validation
  @ViewChild('packingDateInput', { read: ElementRef }) packingDateInput!: ElementRef<HTMLInputElement>;

  // Scan-select field references
  @ViewChild('unitIdField') unitIdField!: UnitIdFieldComponent;
  @ViewChild('productCodeField') productCodeField!: ScanSelectFieldComponent;
  @ViewChild('aboRhField') aboRhField!: ScanSelectFieldComponent;
  @ViewChild('aliquotField') aliquotField!: ScanSelectFieldComponent;

  // Product Code / ABORh / Aliquot dropdown options (loaded from API after Unit ID scan)
  protected readonly productCodeOptions = signal<ScanSelectOption[]>([]);
  protected readonly bloodTypeOptions = signal<ScanSelectOption[]>([]);
  protected readonly aliquotOptions = signal<ScanSelectOption[]>([]);

  // Chapter date for datepicker max constraint and calendar start position
  protected maxDate!: moment.Moment;
  protected chapterDate!: moment.Moment;

  // Error state matcher for Actual Packing Date (shows error on invalid manual entry)
  protected packingDateErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control: FormControl | null): boolean => {
      if (!control) return false;
      if (control.invalid && (control.touched || control.dirty)) return true;
      const inputValue = this.packingDateInput?.nativeElement?.value;
      return !!(control.touched || control.dirty) && !control.value && !!inputValue && inputValue.trim().length > 0;
    }
  };

  // Data table configurations
  protected readonly lineItemsTableConfig = computed<DataTableConfig<OrderItemPackingDto>>(() => ({
    columns: [
      { key: 'itemNo', header: 'Line Item Number', sortable: true },
      { key: 'productType', header: 'Product Type' },
      { key: 'productTypeDesc', header: 'Product Description' },
      { key: 'aboDesc', header: 'ABORh' },
      { key: 'actualRequiredQty', header: 'Quantity' },
      { key: 'itemStatusDesc', header: 'Status' }
    ],
    sortConfig: this.lineItemsSort(),
    stickyHeader: true,
    showTableOnEmpty: true,
    emptyMessage: 'No line items',
    showPagination: false
  }));

  protected readonly sortedLineItems = computed(() => {
    const items = this.orderLineItems();
    const sort = this.lineItemsSort();
    if (sort.direction === 'default' || !sort.column) return items;

    return [...items].sort((a, b) => {
      const aVal = (a as any)[sort.column];
      const bVal = (b as any)[sort.column];
      const aNum = typeof aVal === 'number' ? aVal : Number(aVal);
      const bNum = typeof bVal === 'number' ? bVal : Number(bVal);
      const useNumeric = !isNaN(aNum) && !isNaN(bNum);
      const cmp = useNumeric ? aNum - bNum : String(aVal ?? '').localeCompare(String(bVal ?? ''));
      return sort.direction === 'A' ? cmp : -cmp;
    });
  });

  protected packedProductsTableConfig = computed<DataTableConfig<PackedProductDto>>(() => ({
    columns: [
      { key: 'lineItemNo', header: `Line Item (${this.packedProducts().length})`, sortable: true },
      {
        key: 'unitId', header: 'Unit ID',
        valueFormatter: (_val: string, row: PackedProductDto) => row.displayUnitId || row.unitId
      },
      { key: 'productCode', header: 'Product' },
      { key: 'aboRh', header: 'ABORh' },
      {
        key: 'expirationDate', header: 'Expiration Date',
        valueFormatter: (value: string) => this.formatDate(value)
      },
      { key: 'boxId', header: 'Box ID' }
    ],
    sortConfig: this.packedProductsSort(),
    stickyHeader: true,
    showTableOnEmpty: true,
    emptyMessage: 'No packed products yet',
    showPagination: false
  }));

  protected readonly sortedPackedProducts = computed(() => {
    const products = this.packedProducts();
    const sort = this.packedProductsSort();
    if (sort.direction === 'default' || !sort.column) return products;

    return [...products].sort((a, b) => {
      const aVal = (a as any)[sort.column];
      const bVal = (b as any)[sort.column];
      const aNum = typeof aVal === 'number' ? aVal : Number(aVal);
      const bNum = typeof bVal === 'number' ? bVal : Number(bVal);
      const useNumeric = !isNaN(aNum) && !isNaN(bNum);
      const cmp = useNumeric ? aNum - bNum : String(aVal ?? '').localeCompare(String(bVal ?? ''));
      return sort.direction === 'A' ? cmp : -cmp;
    });
  });

  constructor() {
    // Page header effect - uses title and remarks from menu item API
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          ...this.headerConfig,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null }
          ],
          title: pageData.title,
          subtitle: pageData.subtitle
        };
      }
    });

    // Keep maxDate / chapterDate in sync with chapter changes
    effect(() => {
      const chapterLocalDate = this.chapterTimezoneService.chapterLocalDate();
      if (chapterLocalDate && chapterLocalDate.isValid()) {
        this.maxDate = chapterLocalDate.clone().startOf('day');
        this.chapterDate = chapterLocalDate.clone().startOf('day');
      }
    });
  }

  ngOnInit(): void {
    this.maxDate = this.chapterTimezoneService.getChapterLocalDate();
    this.chapterDate = this.chapterTimezoneService.getChapterLocalDate();
    this.initializeConfig();
    this.initForm();
    this.setupOrderSearch();
    this.subscribeToChapterChanges();
    this.subscribeToQualityCheckChanges();
    this.loadBoxTypes();
    this.loadOrders();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize page header configuration
   * Title and subtitle are loaded dynamically from menu item API via PageHeaderService
   */
  private initializeConfig(): void {
    this.headerConfig = {
      breadcrumbs: [
        { label: 'Home', link: '/home' }
      ]
    };
  }

  /**
   * Initialize reactive form
   */
  private initForm(): void {
    this.packingForm = this.fb.group({
      order: ['', [Validators.required]],
      packSlipId: ['', [Validators.maxLength(50)]],
      boxId: ['', [Validators.maxLength(50)]],
      type: ['', [Validators.required]],
      shipTo: [{ value: '', disabled: true }],  // Read-only, populated from order
      actualPackingDate: [null, [Validators.required]],
      time: ['', [Validators.required, Validators.pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)]],
      // Product scanning fields (PRODUCTS block from Oracle Forms)
      unitId: ['', [Validators.required, Validators.maxLength(20)]],
      productCode: ['', [Validators.required, Validators.maxLength(10)]],
      aliquot: ['', [Validators.maxLength(2)]],
      scanBloodType: ['', [Validators.required, Validators.maxLength(10)]],
      expirationDate: [''],
      qualityCheck: [null, [Validators.required]]
    });
  }

  /**
   * Setup order searchable dropdown search
   * Filters locally from pre-loaded orders
   */
  private setupOrderSearch(): void {
    this.orderSearchControl.valueChanges
      .pipe(
        debounceTime(200),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(searchTerm => {
        const term = (searchTerm || '').toLowerCase().trim();
        if (!term) {
          this.filteredOrders.set(this.allOrders());
        } else {
          const filtered = this.allOrders().filter(order =>
            order.orderNo.toLowerCase().includes(term) ||
            (order.customerId && order.customerId.toLowerCase().includes(term)) ||
            (order.orderClassDesc && order.orderClassDesc.toLowerCase().includes(term))
          );
          this.filteredOrders.set(filtered);

          // Server-side search for terms >= 2 chars
          if (term.length >= 2) {
            this.packingService.searchOrders(term).subscribe({
              next: (orders) => {
                if (orders && orders.length > 0) {
                  const existingNos = new Set(this.allOrders().map(o => o.orderNo));
                  const newOrders = orders.filter(o => !existingNos.has(o.orderNo));
                  if (newOrders.length > 0) {
                    this.allOrders.update(current => [...current, ...newOrders]);
                    // Re-filter with updated list
                    this.filteredOrders.set(
                      this.allOrders().filter(o =>
                        o.orderNo.toLowerCase().includes(term) ||
                        (o.customerId && o.customerId.toLowerCase().includes(term)) ||
                        (o.orderClassDesc && o.orderClassDesc.toLowerCase().includes(term))
                      )
                    );
                  }
                }
              }
            });
          }
        }
      });
  }

  private setFieldError(controlName: string, message: string): void {
    this.fieldErrors[controlName] = message;
    const control = this.packingForm.get(controlName);
    if (control) {
      control.setErrors({ serverError: true });
      control.markAsTouched();
    }
  }

  private clearFieldError(controlName: string): void {
    this.fieldErrors[controlName] = '';
    const control = this.packingForm.get(controlName);
    if (control) {
      control.setErrors(null);
    }
  }


  private tryParseCompactExpDate(value: string): moment.Moment | null {
    // DDmmmYYYYHHmm (e.g. 25jul20262359) or DDmmmYYYY HH:mm
    const compact = /^(\d{2})([A-Za-z]{3})(\d{4})(\d{2})(\d{2})$/;
    const m = value.match(compact);
    if (!m) return null;
    const formatted = `${m[1]}-${m[2].toUpperCase()}-${m[3]} ${m[4]}:${m[5]}`;
    const parsed = moment(formatted, 'DD-MMM-YYYY HH:mm', true);
    return parsed.isValid() ? parsed : null;
  }

  protected onExpiryDateScanBlur(): void {
    const scanValue = this.packingForm.get('expirationDate')?.value?.trim();
    if (!scanValue) return;

    this.clearFieldError('expirationDate');

    // Already in target format DD-MMM-YYYY HH:mm
    const regex = /^(\d{2})-([A-Za-z]{3})-(\d{4})\s(\d{2}):(\d{2})$/;
    const match = scanValue.match(regex);
    if (match) {
      const parsed = moment(scanValue, 'DD-MMM-YYYY HH:mm', true);
      if (!parsed.isValid()) {
        this.packingForm.get('expirationDate')?.setErrors({ invalidDateTime: true });
        this.packingForm.get('expirationDate')?.markAsTouched();
      } else {
        this.packingForm.patchValue({
          expirationDate: parsed.format('DD-MMM-YYYY HH:mm').replace(/-([a-z]{3})-/i, (_, m: string) => `-${m.toUpperCase()}-`)
        }, { emitEvent: false });
        this.tryAutoAddProduct();
      }
      return;
    }

    // Compact format: DDmmmYYYYHHmm (e.g. 25jul20262359)
    const compactParsed = this.tryParseCompactExpDate(scanValue);
    if (compactParsed) {
      this.packingForm.patchValue({
        expirationDate: compactParsed.format('DD-MMM-YYYY HH:mm').replace(/-([a-z]{3})-/i, (_, m: string) => `-${m.toUpperCase()}-`)
      }, { emitEvent: false });
      this.tryAutoAddProduct();
      return;
    }

    // Barcode scan or pure numeric
    if (scanValue.startsWith('&>') || scanValue.startsWith('=>') || /^\d{6,}$/.test(scanValue)) {
      this.fieldProcessing['expirationDate'] = true;
      this.labelScanService.validateExpdateScan(scanValue)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res) => {
            this.fieldProcessing['expirationDate'] = false;
            if (res.success && res.item?.expiryDate) {
              const expMoment = moment(res.item.expiryDate);
              if (expMoment.isValid()) {
                this.packingForm.patchValue({
                  expirationDate: expMoment.format('DD-MMM-YYYY HH:mm').replace(/-([a-z]{3})-/i, (_, m: string) => `-${m.toUpperCase()}-`),
                }, { emitEvent: false });
              }
              this.tryAutoAddProduct();
            } else {
              this.setFieldError('expirationDate', res.errorResponse?.error || res.message || 'Invalid expiry date.');
            }
          },
          error: (err) => {
            this.fieldProcessing['expirationDate'] = false;
            const body = err?.error;
            this.setFieldError('expirationDate', body?.errorResponse?.error || body?.message || 'Failed to validate expiry date.');
          }
        });
      return;
    }

    this.packingForm.get('expirationDate')?.setErrors({ invalidFormat: true });
    this.packingForm.get('expirationDate')?.markAsTouched();
  }

  private get isAnyFieldProcessing(): boolean {
    return Object.values(this.fieldProcessing).some(v => v);
  }

  private tryAutoAddProduct(): void {
    if (this.isAnyFieldProcessing) return;
    if (this.isScanning() || !this.hasOrderSelected()) return;

    const unitId = this.packingForm.get('unitId')?.value?.trim();
    const productCode = this.packingForm.get('productCode')?.value?.trim();
    const bloodType = this.packingForm.get('scanBloodType')?.value?.trim();
    const qcValue = this.packingForm.get('qualityCheck')?.value;

    if (!unitId || !productCode || !bloodType || qcValue === null || qcValue === undefined) return;

    const hasErrors = ['unitId', 'productCode', 'scanBloodType', 'expirationDate'].some(key => {
      const control = this.packingForm.get(key);
      return control && control.errors !== null;
    });
    if (hasErrors) return;

    this.onScanProduct();
  }

  /**
   * Subscribe to chapter changes
   */
  private subscribeToQualityCheckChanges(): void {
    this.packingForm.get('qualityCheck')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.tryAutoAddProduct());
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.clearAll();
        this.loadBoxTypes();
        this.loadOrders();
      });
  }

  /**
   * Load box types from API
   * Fetches active box types from VSERV_MASTER with CODE_TYPE = 'BOXTP'
   */
  private loadBoxTypes(): void {
    this.typeOptionsLoading.set(true);
    this.packingService.getBoxTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (boxTypes) => {
          this.allTypeOptions.set(boxTypes);
          this.typeOptions.set(boxTypes);
          this.typeOptionsLoading.set(false);
        },
        error: (error) => {
          console.error('Error loading box types:', error);
          this.allTypeOptions.set([]);
          this.typeOptions.set([]);
          this.typeOptionsLoading.set(false);
        }
      });
  }

  /**
   * Load orders on page load
   * Fetches available orders for the dropdown
   */
  private loadOrders(): void {
    this.packingService.getAllOrders(500, 0)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const orders = response.data || [];
          this.allOrders.set(orders);
          this.filteredOrders.set(orders);
        },
        error: (error) => {
          console.error('Error loading orders:', error);
          this.allOrders.set([]);
          this.filteredOrders.set([]);
        }
      });
  }

  /**
   * Get form controls
   */
  get f() {
    return this.packingForm.controls;
  }

  /**
   * Handle order selection from the searchable dropdown
   */
  protected onOrderSelected(orderNo: string): void {
    const order = this.allOrders().find(o => o.orderNo === orderNo);
    this.packingForm.patchValue({ packSlipId: '' });
    this.packingForm.get('shipTo')?.setValue(order?.consigneeAddress || '');

    // Clear previous pick slips and open boxes, then load new ones
    this.pickSlipOptions.set([]);
    this.openBoxOptions.set([]);
    this.currentBoxId.set(null);
    this.packingForm.patchValue({ boxId: '', type: '' });
    if (orderNo) {
      this.loadPickSlips(orderNo);
      this.loadOpenBoxes(orderNo);

      this.packingService.getOrderDetail(orderNo)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (detail) => {
            if (detail) {
              this.packingForm.get('shipTo')?.setValue(detail.consigneeAddress || '');

              if (detail.items?.length) {
                this.orderLineItems.set(detail.items);
                const firstUnfilled = detail.items.find(i => i.itemStatus !== 'PK');
                if (firstUnfilled) {
                  this.selectedItemNo.set(firstUnfilled.itemNo);
                }
              }
            }
          }
        });
    }
  }

  /**
   * Load pick slips based on selected order number
   * Endpoint: GET /api/v1/offline-packing/lookups/pick-slips?orderNo={orderNo}
   */
  private loadPickSlips(orderNo: string): void {
    this.pickSlipOptionsLoading.set(true);
    this.packingService.getPickSlips(orderNo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (pickSlips) => {
          this.pickSlipOptions.set(pickSlips);
          if (pickSlips.length > 0) {
            this.packingForm.patchValue({ packSlipId: pickSlips[0].pickSlipId });
          }
          this.pickSlipOptionsLoading.set(false);
        },
        error: (error) => {
          console.error('Error loading pick slips:', error);
          this.pickSlipOptions.set([]);
          this.pickSlipOptionsLoading.set(false);
        }
      });
  }

  /**
   * Load open boxes for selected order (legacy LOV: "Open Boxes For This Customer")
   * These are existing open boxes for the same consignee that can be reused
   */
  private loadOpenBoxes(orderNo: string): void {
    this.openBoxOptionsLoading.set(true);
    this.packingService.getOpenBoxes(orderNo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (boxes) => {
          this.openBoxOptions.set(boxes || []);
          this.openBoxOptionsLoading.set(false);
          const currentBox = this.packingForm.get('boxId')?.value;
          if (currentBox && boxes?.some(b => b.value === currentBox)) {
            this.currentBoxId.set(currentBox);
          }
        },
        error: () => {
          this.openBoxOptions.set([]);
          this.openBoxOptionsLoading.set(false);
        }
      });
  }

  /**
   * Re-fetch packed products from server for the given order.
   * Matches legacy behavior where PACKED_PRODUCTS block queries all packed
   * products across all boxes for the order — closing one box does not
   * remove them from the display.
   */
  private refreshPackedProducts(orderNo: string): void {
    this.packingService.getPackStatus(orderNo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          const statusData = response?.item || response;
          const serverPacked: PackStatusProduct[] = statusData?.packedProducts || [];
          const mapped: PackedProductDto[] = serverPacked.map((p: PackStatusProduct) => ({
            lineItemNo: p.itemNo || 0,
            unitId: p.unitId || '',
            displayUnitId: p.displayUnitId || undefined,
            productCode: p.productCode || '',
            aboRh: p.aboDesc || p.bloodType || '',
            expirationDate: p.expirationDate || '',
            expirationTime: '',
            boxId: p.boxId || '',
            qualityCheck: true
          }));
          this.packedProducts.set(mapped);
        },
        error: () => {
          // Non-critical — keep current list if refresh fails
        }
      });
  }

  /**
   * Handle Box ID selection from dropdown
   * Existing box → fetch box-specific type options (no auto-select)
   * New box (blank) → restore full type options list
   */
  protected onBoxSelected(boxId: string): void {
    this.packingForm.patchValue({ type: '' });
    if (boxId) {
      this.currentBoxId.set(boxId);
      this.typeOptionsLoading.set(true);
      this.packingService.getBoxTypeByBoxId(boxId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (types) => {
            this.typeOptions.set(types);
            this.typeOptionsLoading.set(false);
          },
          error: () => {
            this.typeOptions.set(this.allTypeOptions());
            this.typeOptionsLoading.set(false);
          }
        });
    } else {
      this.currentBoxId.set(null);
      this.typeOptions.set(this.allTypeOptions());
    }
  }

  /**
   * Handle RETRIEVE button click
   */
  protected onRetrieve(): void {
    this.submitted.set(true);

    // Validate required fields
    const orderNo = this.packingForm.get('order')?.value;
    if (!orderNo) {
      this.snackbarService.showError('Please select an order');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.packingService.getOrderDetail(orderNo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (orderDetail) => {
          if (orderDetail) {
            this.selectedOrder.set(orderDetail);
            this.orderLineItems.set(orderDetail.items || []);

            const firstUnfilled = (orderDetail.items || []).find(
              item => item.itemStatus !== 'PK'
            );
            if (firstUnfilled) {
              this.selectedItemNo.set(firstUnfilled.itemNo);
            }

            this.packingForm.get('shipTo')?.setValue(orderDetail.consigneeAddress || '');

            this.loadOpenBoxes(orderNo);

            this.packedProducts.set([]);

            this.snackbarService.showSuccess('Order retrieved successfully');
          } else {
            this.error.set('Order not found');
            this.snackbarService.showError('Order not found');
          }
          this.loading.set(false);
        },
        error: (error) => {
          this.error.set(error.message || 'Failed to retrieve order');
          this.snackbarService.showError('Failed to retrieve order');
          this.loading.set(false);
        }
      });
  }

  /**
   * Handle CLEAR ALL button click
   */
  protected onClearAll(): void {
    this.clearAll();
    this.snackbarService.showInfo('Form cleared');
  }

  /**
   * Clear all form fields and data
   */
  private clearAll(): void {
    this.packingForm.reset({
      order: '',
      packSlipId: '',
      boxId: '',
      type: '',
      actualPackingDate: null,
      time: '',
      unitId: '',
      productCode: '',
      aliquot: '',
      scanBloodType: '',
      expirationDate: '',
      qualityCheck: null
    });
    this.packingForm.get('shipTo')?.setValue('');
    this.orderSearchControl.reset('');
    this.selectedOrder.set(null);
    this.orderLineItems.set([]);
    this.packedProducts.set([]);
    this.currentBoxId.set(null);
    this.submitted.set(false);
    this.error.set(null);
    this.lastScanResult.set(null);
    this.capacityWarning.set(false);
    this.pickSlipOptions.set([]);
    this.openBoxOptions.set([]);
    this.typeOptions.set(this.allTypeOptions());
    this.clearCascadingFields();
    this.selectedItemNo.set(0);
    this.loadOrders();
  }

  /**
   * Handle CREATE NEW BOX button click
   */
  protected onCreateNewBox(): void {
    const dialogData: CreateNewBoxDialogData = {
      currentBoxId: this.currentBoxId(),
      hasPackedProducts: this.hasPackedProducts()
    };

    const dialogRef = this.dialog.open(CreateNewBoxDialogComponent, {
      width: '500px',
      disableClose: true,
      data: dialogData
    });

    dialogRef.afterClosed().subscribe((result: CreateNewBoxDialogResult | null) => {
      if (result) {
        this.createNewBox(result);
      }
    });
  }

  /**
   * Create new box with the provided options
   */
  private createNewBox(options: CreateNewBoxDialogResult): void {
    const orderNo = this.packingForm.get('order')?.value;
    const boxType = this.packingForm.get('type')?.value;

    if (!orderNo) {
      this.snackbarService.showError('Please select an order');
      return;
    }

    if (!boxType) {
      this.snackbarService.showError('Please select a box type');
      return;
    }

    this.loading.set(true);

    const packingDate = this.packingForm.get('actualPackingDate')?.value;
    const packingTime = this.packingForm.get('time')?.value;
    let packedDateStr = '';
    if (packingDate) {
      packedDateStr = moment(packingDate).format('YYYY-MM-DD');
      if (packingTime) {
        packedDateStr += `T${packingTime}:00`;
      }
    }

    this.packingService.createBox({
      orderNo,
      boxType,
      productGrouping: '',
      closeCurrentBox: options.closeCurrentBox,
      packedDate: packedDateStr || undefined
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && (response.item || response.data?.length)) {
            const box = response.item || response.data[0];
            if (box) {
              this.currentBoxId.set(box.boxId);
              this.packingForm.patchValue({
                boxId: box.boxId
              });
              this.snackbarService.showSuccess('New box has been created');
              const currentOrderNo = this.packingForm.get('order')?.value;
              if (currentOrderNo) {
                this.loadOpenBoxes(currentOrderNo);
              }
            }
          } else {
            this.snackbarService.showError(response.message || 'Failed to create new box');
          }
          this.loading.set(false);
        },
        error: (error) => {
          const msg = error?.error?.message || 'Failed to create new box';
          this.snackbarService.showError(msg);
          this.loading.set(false);
        }
      });
  }

  private autoCreateBoxThenPack(): void {
    const orderNo = this.packingForm.get('order')?.value;
    const boxType = this.packingForm.get('type')?.value;

    if (!boxType) {
      this.snackbarService.showError('Please select a box type before packing');
      return;
    }

    this.isScanning.set(true);
    const autoPackingDate = this.packingForm.get('actualPackingDate')?.value;
    const autoPackingTime = this.packingForm.get('time')?.value;
    let autoPackedDateStr = '';
    if (autoPackingDate) {
      autoPackedDateStr = moment(autoPackingDate).format('YYYY-MM-DD');
      if (autoPackingTime) {
        autoPackedDateStr += `T${autoPackingTime}:00`;
      }
    }

    this.packingService.createBox({
      orderNo,
      boxType,
      productGrouping: '',
      closeCurrentBox: false,
      packedDate: autoPackedDateStr || undefined
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && (response.item || response.data?.length)) {
            const box = response.item || response.data[0];
            if (box) {
              this.currentBoxId.set(box.boxId);
              this.packingForm.patchValue({ boxId: box.boxId });
              this.snackbarService.showSuccess(`Box ${box.boxId} auto-created`);
              this.loadOpenBoxes(orderNo);
              this.isScanning.set(false);
              this.onScanProduct();
              return;
            }
          }
          this.snackbarService.showError(response.message || 'Failed to auto-create box');
          this.isScanning.set(false);
        },
        error: (error) => {
          this.snackbarService.showError(error?.error?.message || 'Failed to auto-create box');
          this.isScanning.set(false);
        }
      });
  }

  /**
   * Handle VIEW PACK STATUS button click
   */
  protected onViewPackStatus(): void {
    const orderNo = this.packingForm.get('order')?.value;
    if (!orderNo) { this.snackbarService.showError('Please select an order'); return; }
    this.loading.set(true);
    this.packingService.getPackStatus(orderNo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response.success || response.item) {
            const data = response.item || response;
            this.dialog.open(ViewPackStatusDialogComponent, {
              width: '65vw',
              height: '100vh',
              panelClass: 'view-pack-status-panel',
              position: { right: '0', top: '0' },
              data: {
                packedProducts: data.packedProducts || [],
                allocatedProducts: data.allocatedProducts || []
              }
            });
          }
          this.loading.set(false);
        },
        error: () => {
          this.snackbarService.showError('Failed to retrieve pack status');
          this.loading.set(false);
        }
      });
  }

  /**
   * Handle VIEW BOX CONTENTS button click
   */
  protected onViewBoxContents(): void {
    const boxId = this.currentBoxId();
    if (!boxId) { this.snackbarService.showError('No box selected'); return; }
    this.loading.set(true);
    this.packingService.getBoxContents(boxId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response.success || response.data) {
            this.dialog.open(ViewBoxContentsDialogComponent, {
              width: '65vw',
              height: '100vh',
              panelClass: 'view-box-contents-panel',
              position: { right: '0', top: '0' },
              data: { contents: response.data || [] }
            });
          }
          this.loading.set(false);
        },
        error: () => {
          this.snackbarService.showError('Failed to retrieve box contents');
          this.loading.set(false);
        }
      });
  }

  /**
   * Handle SAVE button click
   */
  protected onSave(): void {
    const orderNo = this.packingForm.get('order')?.value;
    const boxId = this.currentBoxId() || this.packingForm.get('boxId')?.value;

    if (!orderNo || !boxId) {
      this.snackbarService.showError('Order and Box ID are required');
      return;
    }

    const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
      data: {
        title: 'Close Box',
        message: 'Are all products in this box properly packed?',
        confirmText: 'YES',
        cancelText: 'NO'
      }
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result === true) {
        this.loading.set(true);
        const request: CloseBoxRequest = {
          boxId,
          orderNo,
          allProperlyPacked: true
        };
        this.packingService.closeBox(request)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.snackbarService.showSuccess('Box closed successfully');
              this.currentBoxId.set(null);
              this.packingForm.patchValue({ boxId: '' });
              const currentOrderNo = this.packingForm.get('order')?.value;
              if (currentOrderNo) {
                this.loadOpenBoxes(currentOrderNo);
              }
              this.loading.set(false);
            },
            error: () => {
              this.snackbarService.showError('Failed to close box');
              this.loading.set(false);
            }
          });
      }
    });
  }

  protected onLineItemsSortChange(event: TableSortEvent): void {
    this.lineItemsSort.set({ column: event.column, direction: event.direction });
  }

  protected onPackedProductsSortChange(event: TableSortEvent): void {
    this.packedProductsSort.set({ column: event.column, direction: event.direction });
  }

  private refreshPackedTable(): void {
    this.showPackedTable.set(false);
    this.cdr.detectChanges();
    this.showPackedTable.set(true);
  }

  /**
   * Handle CLEAR ALL button in packed products section
   */
  protected onClearPackedProducts(): void {
    this.packedProducts.set([]);
    this.refreshPackedTable();
    this.snackbarService.showInfo('Packed products cleared');
  }

  /**
   * Handle CLEAR ALL button in scan product row
   */
  protected onClearScanFields(): void {
    this.clearProductEntryFields();
    this.unitIdField?.clear();
    this.lastScanResult.set(null);
  }

  /**
   * Handle validated Unit ID from the shared unit-id-field component
   */
  protected onUnitIdValidated(data: UnitValidationResponse): void {
    const unitId = data.parsedUnitId || data.manualUnitId;
    this.packingForm.patchValue({ unitId });
    this.loadProductCodes(unitId);
  }

  /**
   * Handle cleared Unit ID from the shared unit-id-field component
   */
  protected onUnitIdCleared(): void {
    this.packingForm.patchValue({ unitId: '' });
    this.clearCascadingFields();
  }

  /**
   * Handle SCAN/ADD PRODUCT button click
   * Validates product entry fields and calls the backend API to pack the product
   */
  protected onScanProduct(): void {
    const orderNo = this.packingForm.get('order')?.value;
    const boxId = this.currentBoxId() || this.packingForm.get('boxId')?.value;
    const pickSlipId = this.packingForm.get('packSlipId')?.value;
    const unitId = this.packingForm.get('unitId')?.value;
    const productCode = this.packingForm.get('productCode')?.value;
    const aliquot = this.packingForm.get('aliquot')?.value;
    const bloodType = this.packingForm.get('scanBloodType')?.value;
    const expDateRaw = this.packingForm.get('expirationDate')?.value?.trim();
    const qcPassed = this.packingForm.get('qualityCheck')?.value;
    const packingDate = this.packingForm.get('actualPackingDate')?.value;
    const packingTime = this.packingForm.get('time')?.value;

    if (!unitId || !productCode || !bloodType) {
      this.snackbarService.showError('Please fill in all required fields (Unit ID, Product Code, Blood Type)');
      return;
    }

    if (!orderNo) {
      this.snackbarService.showError('Order is required');
      return;
    }

    if (!boxId) {
      this.autoCreateBoxThenPack();
      return;
    }

    // Handle QC fail — show quarantine confirmation
    if (qcPassed === false) {
      this.showQuarantineConfirmation(orderNo, unitId, productCode, aliquot);
      return;
    }

    // Build packed date combining date + time
    let packedDateStr = '';
    if (packingDate) {
      packedDateStr = moment(packingDate).format('YYYY-MM-DD');
      if (packingTime) {
        packedDateStr += `T${packingTime}:00`;
      }
    }

    let expDateStr = '';
    if (expDateRaw) {
      const parsed = moment(expDateRaw, 'DD-MMM-YYYY HH:mm', true);
      if (parsed.isValid()) {
        expDateStr = parsed.format('YYYY-MM-DDTHH:mm:00');
      }
    }

    const request: PackProductRequest = {
      orderNo,
      boxId,
      unitId,
      productCode,
      itemNo: this.selectedItemNo() || 1,
      bloodType,
      expirationDate: expDateStr || undefined,
      packedDate: packedDateStr || undefined,
      pickSlipId: pickSlipId || undefined,
      qcPassed: true
    };

    this.lastPackRequest = request;
    this.isScanning.set(true);
    this.lastScanResult.set(null);
    this.capacityWarning.set(false);

    this.packingService.packProduct(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            const packed = response.item || response.data?.[0];
            const packedProduct: PackedProductDto = {
              lineItemNo: request.itemNo,
              unitId: request.unitId,
              displayUnitId: packed?.displayUnitId || undefined,
              productCode: aliquot ? `${productCode}-${aliquot}` : productCode,
              aboRh: bloodType,
              expirationDate: expDateStr ? moment(expDateStr).format('YYYY-MM-DD') : '',
              expirationTime: '',
              boxId,
              qualityCheck: true
            };
            this.packedProducts.set([...this.packedProducts(), packedProduct]);
            this.refreshPackedTable();
            this.clearProductEntryFields();
            this.snackbarService.showSuccess(`Product ${unitId} packed successfully`);

            // Display any warnings from the pack operation
            const packWarnings = packed?.warnings || response?.data?.[0]?.warnings;
            if (packWarnings && packWarnings.length > 0) {
              packWarnings.forEach((warning: string) => {
                this.snackbarService.showInfo(`Warning: ${warning}`);
              });
            }

            // Auto-advance to next unfilled item
            const items = this.orderLineItems();
            const nextUnfilled = items.find(i => i.itemStatus !== 'PK' && i.itemNo !== request.itemNo);
            if (nextUnfilled) {
              this.selectedItemNo.set(nextUnfilled.itemNo);
            }
          } else {
            this.handlePackError(response);
          }
          this.isScanning.set(false);
        },
        error: (error: any) => {
          this.handlePackError(error?.error || error);
          this.isScanning.set(false);
        }
      });
  }

  /**
   * Clear product entry fields after successful scan
   */
  private clearProductEntryFields(): void {
    this.packingForm.patchValue({
      unitId: '',
      productCode: '',
      aliquot: '',
      scanBloodType: '',
      expirationDate: '',
      qualityCheck: null
    });

    this.unitIdField?.clear();
    this.productCodeField?.clear();
    this.aboRhField?.clear();
    this.aliquotField?.clear();
    this.clearCascadingFields();
    this.fieldErrors = {};
    this.fieldProcessing = {};

    this.packingForm.get('unitId')?.markAsUntouched();
    this.packingForm.get('productCode')?.markAsUntouched();
    this.packingForm.get('aliquot')?.markAsUntouched();
    this.packingForm.get('scanBloodType')?.markAsUntouched();
    this.packingForm.get('expirationDate')?.markAsUntouched();
    this.packingForm.get('qualityCheck')?.markAsUntouched();

    this.packingForm.get('productCode')?.setErrors(null);
    this.packingForm.get('scanBloodType')?.setErrors(null);
    this.packingForm.get('expirationDate')?.setErrors(null);
  }

  private clearCascadingFields(): void {
    this.productCodeOptions.set([]);
    this.bloodTypeOptions.set([]);
    this.aliquotOptions.set([]);
  }

  private loadProductCodes(unitId: string): void {
    if (!unitId) return;
    this.productCodeField?.clear();
    this.aboRhField?.clear();
    this.aliquotField?.clear();
    this.bloodTypeOptions.set([]);
    this.aliquotOptions.set([]);
    this.packingForm.patchValue({ productCode: '', scanBloodType: '', aliquot: '' });

    this.packingService.getProductCodes(unitId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (codes) => {
          const options: ScanSelectOption[] = codes.map(c => ({ code: c.value, description: c.label }));
          this.productCodeOptions.set(options);
          if (options.length === 1) {
            this.productCodeField?.setValue(options[0].code, options[0].description);
            this.packingForm.patchValue({ productCode: options[0].code });
            this.onProductCodeSelected(options[0]);
          }
        },
        error: () => this.productCodeOptions.set([])
      });
  }

  protected onProductCodeSelected(option: ScanSelectOption | null): void {
    if (!option) return;
    this.packingForm.patchValue({ productCode: option.code });
    this.clearFieldError('productCode');

    const unitId = this.packingForm.get('unitId')?.value?.trim();
    if (!unitId) return;

    this.aboRhField?.clear();
    this.aliquotField?.clear();
    this.packingForm.patchValue({ scanBloodType: '', aliquot: '' });

    this.loadBloodTypes(unitId, option.code);
  }

  private loadBloodTypes(unitId: string, productCode: string): void {
    this.packingService.getValidBloodTypes(unitId, productCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (types) => {
          const options: ScanSelectOption[] = types.map(t => ({ code: t.value, description: t.label }));
          this.bloodTypeOptions.set(options);
          if (options.length === 1) {
            this.aboRhField?.setValue(options[0].code, options[0].description);
            this.packingForm.patchValue({ scanBloodType: options[0].code });
            this.tryAutoAddProduct();
          }
        },
        error: () => this.bloodTypeOptions.set([])
      });
  }

  private loadAliquots(unitId: string, productCode: string): void {
    this.packingService.getValidAliquots(unitId, productCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (aliquots) => {
          const options: ScanSelectOption[] = aliquots.map(a => ({ code: a.value, description: a.label }));
          this.aliquotOptions.set(options);
          if (options.length === 1) {
            this.aliquotField?.setValue(options[0].code, options[0].description);
            this.packingForm.patchValue({ aliquot: options[0].code });
          }
        },
        error: () => this.aliquotOptions.set([])
      });
  }

  protected onAboRhSelected(option: ScanSelectOption | null): void {
    if (!option) return;
    this.packingForm.patchValue({ scanBloodType: option.code });
    this.clearFieldError('scanBloodType');
    this.tryAutoAddProduct();
  }

  protected onAliquotSelected(option: ScanSelectOption | null): void {
    if (!option) return;
    this.packingForm.patchValue({ aliquot: option.code });
  }

  protected onLineItemChanged(itemNo: number): void {
    this.selectedItemNo.set(itemNo);
  }

  /**
   * Handle pack product error responses
   */
  private handlePackError(response: any): void {
    const errorCode = response?.errorCode || response?.errorResponse?.errorCode || '';
    const errorMessage = response?.message || response?.error || response?.errorResponse?.error || 'Failed to pack product';

    if (errorCode === '3001') {
      this.capacityWarning.set(true);
      this.snackbarService.showError('Box is full. Please create a new box.');
    } else if (errorCode === 'SUB_CONFIRM') {
      this.showSubstitutionConfirmation();
    } else if (errorCode) {
      this.dialog.open(ErrorDialogComponent, {
        data: { title: `ERR: ${errorCode}`, message: errorMessage }
      });
    } else {
      this.snackbarService.showError(errorMessage);
    }

    this.lastScanResult.set({ success: false, message: errorMessage });
  }

  /**
   * Show quarantine confirmation dialog when QC fails
   */
  private showQuarantineConfirmation(orderNo: string, unitId: string, productCode: string, aliquot: string): void {
    const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
      data: {
        title: 'Place this product in quarantine?',
        message: 'Do you wish to continue?',
        confirmText: 'YES',
        cancelText: 'NO'
      }
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result === true) {
        const request: QuarantineProductRequest = {
          orderNo,
          unitId,
          productCode,
          aliquot: aliquot || undefined,
          reason: 'VSUAL'
        };

        this.packingService.quarantineProduct(request)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.snackbarService.showSuccess('Product has been placed in quarantine.');
              this.clearProductEntryFields();
            },
            error: () => {
              this.snackbarService.showError('Failed to quarantine product');
            }
          });
      } else {
        this.clearProductEntryFields();
      }
    });
  }

  /**
   * Show substitution confirmation dialog
   * On YES, re-submits the last pack request with substituteConfirmed = true
   */
  private showSubstitutionConfirmation(): void {
    const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
      data: {
        title: 'Product Substitution',
        message: 'Products exist which match order. Are you sure you want to substitute?',
        confirmText: 'YES',
        cancelText: 'NO'
      }
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result === true && this.lastPackRequest) {
        this.lastPackRequest.substituteConfirmed = true;
        this.isScanning.set(true);
        this.lastScanResult.set(null);

        const request = this.lastPackRequest;
        this.packingService.packProduct(request)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (response: any) => {
              if (response.success) {
                const packed = response.item || response.data?.[0];
                const packedProduct: PackedProductDto = {
                  lineItemNo: request.itemNo,
                  unitId: request.unitId,
                  displayUnitId: packed?.displayUnitId || undefined,
                  productCode: request.aliquot ? `${request.productCode}-${request.aliquot}` : request.productCode,
                  aboRh: request.bloodType || '',
                  expirationDate: request.expirationDate ? moment(request.expirationDate).format('YYYY-MM-DD') : '',
                  expirationTime: '',
                  boxId: request.boxId,
                  qualityCheck: true
                };
                this.packedProducts.set([...this.packedProducts(), packedProduct]);
                this.refreshPackedTable();
                this.clearProductEntryFields();
                this.snackbarService.showSuccess(`Product ${request.unitId} packed successfully (substitution)`);

                // Display any warnings from the pack operation
                const packWarnings = packed?.warnings || response?.data?.[0]?.warnings;
                if (packWarnings && packWarnings.length > 0) {
                  packWarnings.forEach((warning: string) => {
                    this.snackbarService.showInfo(`Warning: ${warning}`);
                  });
                }

                // Auto-advance to next unfilled item
                const items = this.orderLineItems();
                const nextUnfilled = items.find(i => i.itemStatus !== 'PK' && i.itemNo !== request.itemNo);
                if (nextUnfilled) {
                  this.selectedItemNo.set(nextUnfilled.itemNo);
                }
              } else {
                this.handlePackError(response);
              }
              this.isScanning.set(false);
            },
            error: (error: any) => {
              this.handlePackError(error?.error || error);
              this.isScanning.set(false);
            }
          });
      }
    });
  }

  protected onPackingDateBlur(): void {
    setTimeout(() => {
      const control = this.packingForm.get('actualPackingDate');
      control?.markAsTouched();
      this.validatePackingDateInput();
      control?.updateValueAndValidity();
      this.validatePackingDateTime();
    }, 0);
  }

  protected onTimeBlur(): void {
    this.packingForm.get('time')?.markAsTouched();
    this.validatePackingDateTime();
  }

  protected getPackingDateError(): string {
    const control = this.packingForm.get('actualPackingDate');
    if (!control) return '';

    if (control.hasError('required') && control.touched) {
      return 'Actual Packing Date is required';
    }
    if (control.hasError('matDatepickerMax')) {
      return 'Actual Packing Date cannot be a future date';
    }
    if (control.hasError('invalidDate') || control.hasError('matDatepickerParse')) {
      return 'Actual Packing Date is invalid';
    }
    const inputValue = this.packingDateInput?.nativeElement?.value;
    if (inputValue && inputValue.trim().length > 0 && !control.value) {
      return 'Actual Packing Date is invalid';
    }
    return '';
  }

  private validatePackingDateInput(): void {
    const control = this.packingForm.get('actualPackingDate');
    const inputValue = this.packingDateInput?.nativeElement?.value?.trim() || '';

    if (inputValue && !control?.value && control) {
      control.setErrors({ ...control.errors, invalidDate: true });
    } else if (control?.hasError('invalidDate') && (!inputValue || control?.value)) {
      const errors = { ...control.errors };
      delete errors['invalidDate'];
      control.setErrors(Object.keys(errors).length > 0 ? errors : null);
    }
  }

  protected getTimeError(): string {
    const control = this.packingForm.get('time');
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return 'Time is required';
    }
    if (control.hasError('pattern')) {
      return 'Invalid time format. Use HH:MM (e.g., 14:30)';
    }
    if (control.hasError('futureDateTime')) {
      return 'Packing date and time cannot be in the future';
    }
    return '';
  }

  private validatePackingDateTime(): void {
    const timeControl = this.packingForm.get('time');
    const dateControl = this.packingForm.get('actualPackingDate');
    if (!timeControl || !dateControl) return;

    const errors = { ...timeControl.errors };
    delete errors['futureDateTime'];
    timeControl.setErrors(Object.keys(errors).length ? errors : null);

    const packingDate = dateControl.value;
    const packingTime = timeControl.value?.trim();
    if (!packingDate || !packingTime || timeControl.hasError('pattern')) return;

    const timeMatch = packingTime.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
    if (!timeMatch) return;

    const packedMoment = moment(packingDate).clone()
      .hour(parseInt(timeMatch[1], 10))
      .minute(parseInt(timeMatch[2], 10))
      .second(0);

    const chapterNow = this.chapterTimezoneService.getChapterLocalDateTime();

    if (packedMoment.isSameOrAfter(chapterNow)) {
      timeControl.setErrors({ ...timeControl.errors, futureDateTime: true });
    }
  }

  /**
   * Format date for display (DD-MMM-YYYY)
   */
  protected formatDate(date: string | null): string {
    if (!date) return '';
    try {
      const m = moment(date);
      return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : date;
    } catch {
      return date;
    }
  }

  /**
   * Format time for display (HH:MM)
   */
  protected formatTime(time: string | null): string {
    if (!time) return '';
    return time;
  }
}
