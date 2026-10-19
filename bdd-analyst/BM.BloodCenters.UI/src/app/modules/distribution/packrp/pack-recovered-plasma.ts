import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  signal,
  computed,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil, switchMap, of, forkJoin } from 'rxjs';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TableRowActionEvent } from '@shared/interfaces/data-table.interface';
import { ConfirmActionDialogComponent } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';
import { formatTableDate } from '@shared/utils/date-format.util';

import { UnitIdFieldComponent } from '@shared/components/unit-id-field';
import { UnitValidationResponse } from '@shared/components/unit-id-field/unit-id-field.model';

import { PackRecoveredPlasmaService } from './services/pack-recovered-plasma.service';
import {
  PickSlipDto,
  PickSlipQueryDto,
  BoxDto,
  PackedProductDto,
  VolumeSummary,
  PackProductRequestDto,
  OrderDto,
  ProductDto,
  ProductDetailDto,
  CreatePickSlipRequestDto,
  CreateBoxRequestDto
} from './models/pack-recovered-plasma.model';
import { NewBoxDialogComponent } from './dialogs/new-box-dialog/new-box-dialog';
import { CloseBoxDialogComponent, CloseBoxDialogResult } from './dialogs/close-box-dialog/close-box-dialog';

/**
 * Pack Recovered Plasma Component
 * Process of packaging recovered plasma products into shipping boxes
 * JIRA: MLT-14014
 * Mnemonic: PACKRP
 */
@Component({
  selector: 'app-pack-recovered-plasma',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatDialogModule,
    MatTooltipModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    UnitIdFieldComponent
  ],
  templateUrl: './pack-recovered-plasma.html',
  styleUrls: ['./pack-recovered-plasma.scss']
})
export class PackRecoveredPlasmaComponent implements OnInit, OnDestroy {
  @ViewChild('unitIdField') unitIdField?: UnitIdFieldComponent;

  private static nextId = 0;
  protected readonly componentId = `pack-recovered-plasma-${PackRecoveredPlasmaComponent.nextId++}`;

  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  private readonly destroy$ = new Subject<void>();
  private readonly fb: FormBuilder;
  private readonly packService: PackRecoveredPlasmaService;
  private readonly dialog: MatDialog;
  private readonly headerService: HeaderService;
  private readonly pageHeaderService: PageHeaderService;
  private readonly snackbarService: SnackbarService;

  headerConfig!: PageHeaderConfig;
  productForm!: FormGroup;
  tableConfig!: DataTableConfig<PackedProductDto>;

  // Signal-based state
  protected readonly selectedPickSlip = signal<PickSlipDto | null>(null);
  protected readonly selectedBox = signal<BoxDto | null>(null);
  protected readonly packedProducts = signal<PackedProductDto[]>([]);
  protected readonly loading = signal<boolean>(false);
  protected readonly packingProduct = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);
  protected readonly submitted = signal<boolean>(false);

  // Dropdown options
  protected readonly customerOptions = signal<Array<{ customerId: string; customerName: string; consigneeId: string; consigneeName: string }>>([]);
  protected readonly orderOptions = signal<OrderDto[]>([]);
  protected readonly pickSlipOptions = signal<PickSlipDto[]>([]);
  protected readonly boxOptions = signal<BoxDto[]>([]);
  protected readonly productTypeOptions = signal<Array<{ productCode: string; description: string }>>([]);
  protected readonly productCodeOptions = signal<Array<{ productCode: string; description: string }>>([]);

  // Search controls for dropdowns
  protected readonly customerSearchCtrl = new FormControl('');
  protected readonly boxSearchCtrl = new FormControl('');
  protected readonly productCodeSearchCtrl = new FormControl('');
  protected readonly labelCtrl = new FormControl('');

  // Filtered dropdown options
  protected readonly filteredCustomerOptions = signal<Array<{ customerId: string; customerName: string; consigneeId: string; consigneeName: string }>>([]);
  protected readonly filteredBoxOptions = signal<BoxDto[]>([]);
  protected readonly filteredProductCodeOptions = signal<Array<{ productCode: string; description: string }>>([]);

  // Product detail from DIN lookup (populates readonly fields)
  protected readonly productDetail = signal<ProductDetailDto | null>(null);
  protected readonly fetchingProduct = signal<boolean>(false);

  // Volume tracking (from API response)
  protected readonly previousVolume = signal<number>(0);
  protected readonly currentVolume = signal<number>(0);

  // Selected values for dropdowns and editable header fields
  protected selectedCustomerId: string = '';
  protected selectedBoxId: string = '';
  protected selectedProductType: string = '';
  protected selectedConsigneeId: string = '';
  protected selectedOrderNo: string = '';

  // Computed values
  protected readonly numberOfProducts = computed(() => this.packedProducts().length);

  protected readonly volumeSummary = computed<VolumeSummary>(() => {
    const products = this.packedProducts();
    const currentVol = products.reduce((sum, p) => sum + (p.componentVolume || 0), 0);

    return {
      previousVolume: this.previousVolume(),
      currentVolume: currentVol,
      totalVolume: this.previousVolume() + currentVol
    };
  });

  protected readonly hasPickSlip = computed(() => this.selectedPickSlip() !== null);
  protected readonly hasBox = computed(() => this.selectedBox() !== null);
  protected readonly canPack = computed(() =>
    this.hasPickSlip() &&
    this.hasBox() &&
    !this.packingProduct() &&
    !(this.selectedBox()?.isAtCapacity ?? false)
  );

  // Current page for pagination
  currentPage = 0;
  pageSize = 10;
  totalCount = 0;

  constructor(
    fb: FormBuilder,
    packService: PackRecoveredPlasmaService,
    dialog: MatDialog,
    headerService: HeaderService,
    pageHeaderService: PageHeaderService,
    snackbarService: SnackbarService
  ) {
    this.fb = fb;
    this.packService = packService;
    this.dialog = dialog;
    this.headerService = headerService;
    this.pageHeaderService = pageHeaderService;
    this.snackbarService = snackbarService;

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
          subtitle: pageData.subtitle || ''
        };
      }
    });
  }

  ngOnInit(): void {
    console.log('PackRecoveredPlasmaComponent initialized');
    this.initializeConfig();
    this.initializeForm();
    this.initializeTableConfig();
    this.subscribeToChapterChanges();
    this.setupAutocomplete();

    // TODO: Load initial data or wait for user to select pick slip/box
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeConfig(): void {
    this.headerConfig = {
      breadcrumbs: [
        { label: 'Home', link: '/home' }
      ],
      title: 'Pack Recovered Plasma',
      subtitle: 'Process of packaging recovered plasma units after proper verification, labeling, and quality checks to ensure safe storage and distribution according to regulatory standards.'
    };
  }

  private initializeForm(): void {
    this.productForm = this.fb.group({
      productCode: ['', [Validators.required, Validators.maxLength(8)]]
    });
  }

  private initializeTableConfig(): void {
    this.tableConfig = {
      columns: [
        {
          key: 'dinNumber',
          header: 'Unit ID',
          sortable: true,
          width: '180px'
        },
        {
          key: 'collectionDate',
          header: 'Collection Date',
          sortable: true,
          width: '150px',
          valueFormatter: (value: string) => formatTableDate(value)
        },
        {
          key: 'productCode',
          header: 'Product Code',
          sortable: true,
          width: '130px'
        },
        {
          key: 'aboRh',
          header: 'ABO/Rh',
          sortable: true,
          width: '100px'
        },
        {
          key: 'componentWeight',
          header: 'Weight',
          sortable: true,
          width: '100px',
          cellClass: 'text-right'
        },
        {
          key: 'componentVolume',
          header: 'Volume',
          sortable: true,
          width: '100px',
          cellClass: 'text-right'
        },
        {
          key: 'expirationDate',
          header: 'Expiry Date',
          sortable: true,
          width: '140px',
          valueFormatter: (value: string) => formatTableDate(value)
        }
      ],
      pagination: {
        pageSize: this.pageSize,
        pageIndex: 0,
        totalRecords: 0,
        pageSizeOptions: [10, 25, 50]
      },
      emptyMessage: 'No products packed in this box yet'
    };
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.clearAll();
        this.loadCustomers();
      });
  }

  /**
   * Set up dropdown options
   */
  private setupAutocomplete(): void {
    this.loadCustomers();
    this.loadProductTypes();
    this.setupDropdownSearch();
  }

  private setupDropdownSearch(): void {
    this.customerSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(term => {
        const search = (term || '').toLowerCase().trim();
        const all = this.customerOptions();
        if (!search) {
          this.filteredCustomerOptions.set([...all]);
          return;
        }
        this.filteredCustomerOptions.set(
          all.filter(c =>
            c.customerId.toLowerCase().includes(search) ||
            c.customerName.toLowerCase().includes(search)
          )
        );
      });

    this.boxSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(term => {
        const search = (term || '').toLowerCase().trim();
        const all = this.boxOptions();
        if (!search) {
          this.filteredBoxOptions.set([...all]);
          return;
        }
        this.filteredBoxOptions.set(
          all.filter(b => b.boxId.toLowerCase().includes(search))
        );
      });

    this.productCodeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(term => {
        const search = (term || '').toLowerCase().trim();
        const all = this.productCodeOptions();
        if (!search) {
          this.filteredProductCodeOptions.set([...all]);
          return;
        }
        this.filteredProductCodeOptions.set(
          all.filter(c =>
            c.productCode.toLowerCase().includes(search) ||
            (c.description || '').toLowerCase().includes(search)
          )
        );
      });
  }

  /**
   * Load customers for dropdown
   */
  private loadCustomers(): void {
    this.loading.set(true);
    this.packService.getCustomers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (customers) => {
          const mapped = customers.map(c => ({
            customerId: c.customerId,
            customerName: c.customerName,
            consigneeId: c.consigneeId,
            consigneeName: c.consigneeName
          }));
          this.customerOptions.set(mapped);
          this.filteredCustomerOptions.set(mapped);
          this.loading.set(false);
        },
        error: () => {
          this.customerOptions.set([]);
          this.loading.set(false);
          this.snackbarService.showError('Failed to load customers');
        }
      });
  }

  private loadOrders(customerId: string, consigneeId: string): void {
    this.packService.getOrders(customerId, consigneeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (orders) => {
          this.orderOptions.set(orders);
          if (orders.length === 1) {
            this.selectedOrderNo = orders[0].orderId;
          }
        },
        error: () => {
          this.orderOptions.set([]);
        }
      });
  }

  private loadBoxesByPickSlip(pickSlipId: string): void {
    this.packService.getBoxesByPickSlip(pickSlipId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (boxes) => {
          this.boxOptions.set(boxes);
          this.filteredBoxOptions.set(boxes);
          const openBox = boxes.find(b => b.status === 'OP');
          if (openBox) {
            this.selectedBoxId = openBox.boxId;
            this.selectedBox.set(openBox);
            this.loadPackedProducts(openBox.boxId);
          }
        },
        error: () => {
          this.boxOptions.set([]);
          this.filteredBoxOptions.set([]);
        }
      });
  }

  private loadAvailableProducts(productCode: string): void {
    this.packService.getAvailableProducts(productCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (products) => {
          const uniqueCodes = new Map<string, string>();
          products.forEach(p => {
            if (!uniqueCodes.has(p.productCode)) {
              uniqueCodes.set(p.productCode, p.productDescription || p.productCode);
            }
          });
          const options = Array.from(uniqueCodes, ([productCode, description]) => ({ productCode, description }));
          this.productCodeOptions.set(options);
          this.filteredProductCodeOptions.set(options);
        },
        error: () => {
          this.productCodeOptions.set([]);
          this.filteredProductCodeOptions.set([]);
        }
      });
  }

  private loadPickSlips(): void {
    const customerId = this.selectedCustomerId;
    const consigneeId = this.selectedConsigneeId;
    const productType = this.selectedProductType;
    if (!customerId || !consigneeId || !productType) return;

    const filters: PickSlipQueryDto = {
      customerId,
      consigneeId,
      productCode: productType,
      status: 'OP'
    };
    this.packService.queryPickSlips(10, 0, filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.pickSlipOptions.set(result.data);
          if (result.data.length === 1) {
            this.selectPickSlip(result.data[0]);
          }
        },
        error: () => {
          this.pickSlipOptions.set([]);
        }
      });
  }

  private selectPickSlip(pickSlip: PickSlipDto): void {
    this.selectedPickSlip.set(pickSlip);
    this.selectedOrderNo = pickSlip.orderId || this.selectedOrderNo;
    this.loadBoxesByPickSlip(pickSlip.pickSlipId);
    this.loadPreviousVolume(pickSlip.pickSlipId);
  }

  private loadPreviousVolume(pickSlipId: string): void {
    this.packService.getPackedProductsByPickSlip(pickSlipId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (products) => {
          const currentBoxId = this.selectedBox()?.boxId;
          const prevVol = products
            .filter(p => p.boxId !== currentBoxId)
            .reduce((sum, p) => sum + (p.componentVolume || 0), 0);
          this.previousVolume.set(prevVol);
        },
        error: () => {
          this.previousVolume.set(0);
        }
      });
  }

  /**
   * Load product types for dropdown (restricted to RPL/RPFF per XML spec)
   */
  private loadProductTypes(): void {
    this.productTypeOptions.set([
      { productCode: 'RPL', description: 'Recovered Plasma Liquid' },
      { productCode: 'RPFF', description: 'Recovered Plasma Fresh Frozen' }
    ]);
  }

  protected onUnitIdValidated(data: UnitValidationResponse): void {
    const unitId = data.parsedUnitId;
    if (!unitId) return;

    this.labelCtrl.setValue(data.codeScheme === 'I' ? 'Mf' : '49');

    this.fetchingProduct.set(true);
    this.packService.getProductByDin(unitId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (detail) => {
          this.productDetail.set(detail);
          if (detail.productCode) {
            this.ensureProductCodeOption(detail.productCode);
            this.productForm.patchValue({ productCode: detail.productCode });
          }
          if (detail.barcodeScheme) {
            this.labelCtrl.setValue(detail.barcodeScheme);
          }
          this.fetchingProduct.set(false);
        },
        error: (err) => {
          this.productDetail.set(null);
          this.fetchingProduct.set(false);
          const status = err?.status;
          if (status === 404) {
            this.snackbarService.showError('No available product found for this Unit ID. Verify the Unit ID is correct and the product is in stock.');
          } else if (status === 400) {
            this.snackbarService.showError(err?.error?.message || 'Invalid Unit ID format');
          } else {
            this.snackbarService.showError('Unable to look up product. Please try again.');
          }
        }
      });
  }

  protected onUnitIdCleared(): void {
    this.productDetail.set(null);
    this.labelCtrl.setValue('');
    this.productForm.patchValue({ productCode: '' });
  }

  private ensureProductCodeOption(code: string): void {
    const current = this.productCodeOptions();
    if (!current.some(c => c.productCode === code)) {
      const updated = [...current, { productCode: code, description: code }];
      this.productCodeOptions.set(updated);
      this.filteredProductCodeOptions.set(updated);
    }
  }

  /**
   * Handle customer change
   */
  protected onCustomerChange(customerId: string): void {
    const customer = this.customerOptions().find(c => c.customerId === customerId);
    if (!customer) return;

    this.selectedConsigneeId = customer.consigneeId;

    // Clear downstream state
    this.orderOptions.set([]);
    this.pickSlipOptions.set([]);
    this.selectedPickSlip.set(null);
    this.selectedBox.set(null);
    this.selectedBoxId = '';
    this.selectedOrderNo = '';
    this.boxOptions.set([]);
    this.filteredBoxOptions.set([]);
    this.packedProducts.set([]);
    this.previousVolume.set(0);

    // Set partial pick slip for display (customer/consignee names)
    this.selectedPickSlip.set({
      pickSlipId: '',
      orderId: '',
      customerId: customer.customerId,
      customerName: customer.customerName,
      consigneeId: customer.consigneeId,
      consigneeName: customer.consigneeName,
      productCode: this.selectedProductType || '',
      aboType: '',
      quantityOrdered: 0,
      quantityPacked: 0,
      status: ''
    });

    this.loadOrders(customer.customerId, customer.consigneeId);

    // If product type already selected, search for existing pick slips
    if (this.selectedProductType) {
      this.loadPickSlips();
    }
  }

  /**
   * Handle box change
   */
  protected onBoxChange(boxId: string): void {
    if (!boxId) return;

    this.packService.getBoxById(boxId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (boxDetails) => {
          this.selectedBox.set(boxDetails);
          this.selectedBoxId = boxDetails.boxId;
          this.loadPackedProducts(boxId);

          // Flow B: If no pick slip selected, auto-populate from box's pick slip
          if (!this.selectedPickSlip()?.pickSlipId && boxDetails.pickSlipId) {
            this.packService.getPickSlipById(boxDetails.pickSlipId)
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: (pickSlip) => {
                  this.selectedPickSlip.set(pickSlip);
                  this.selectedCustomerId = pickSlip.customerId;
                  this.selectedConsigneeId = pickSlip.consigneeId;
                  this.selectedOrderNo = pickSlip.orderId || '';
                  this.selectedProductType = pickSlip.productCode || '';
                  this.loadPreviousVolume(pickSlip.pickSlipId);
                  if (pickSlip.productCode) {
                    this.loadAvailableProducts(pickSlip.productCode);
                  }
                },
                error: () => {
                  this.snackbarService.showError('Failed to load pick slip details');
                }
              });
          } else if (this.selectedPickSlip()?.pickSlipId) {
            this.loadPreviousVolume(this.selectedPickSlip()!.pickSlipId);
          }
        },
        error: () => {
          this.snackbarService.showError('Failed to load box details');
        }
      });
  }

  /**
   * Handle box ID barcode scan
   */
  protected onDirectBoxIdEntry(boxId: string): void {
    if (!boxId?.trim()) return;
    this.onBoxChange(boxId.trim());
  }

  /**
   * Handle product type change
   */
  protected onProductTypeChange(productCode: string): void {
    const product = this.productTypeOptions().find(p => p.productCode === productCode);
    if (!product) return;

    const currentPickSlip = this.selectedPickSlip();
    if (currentPickSlip) {
      this.selectedPickSlip.set({ ...currentPickSlip, productCode: product.productCode });
    }

    this.loadAvailableProducts(product.productCode);

    if (this.selectedCustomerId && this.selectedConsigneeId) {
      this.loadPickSlips();
    }
  }

  get f() {
    return this.productForm.controls;
  }

  /**
   * Pack product into box
   */
  onUpdatePack(): void {
    this.submitted.set(true);

    if (!this.unitIdField?.isValid) {
      this.unitIdField?.focus();
      return;
    }

    if (this.productForm.invalid) {
      const firstInvalid = document.querySelector('.ng-invalid[formControlName]');
      if (firstInvalid) {
        (firstInvalid as HTMLElement).focus();
      }
      return;
    }

    if (!this.selectedCustomerId || !this.selectedProductType) {
      this.snackbarService.showError('Customer and product type must be selected');
      return;
    }

    this.packingProduct.set(true);
    const formValue = this.productForm.value;
    const unitData = this.unitIdField?.parsedUnitData;
    const dinNumber = this.unitIdField?.parsedUnitId ?? '';

    // Lazy creation: ensure pick slip exists, then ensure box exists, then pack
    this.ensurePickSlipExists().pipe(
      switchMap(pickSlip => this.ensureBoxExists(pickSlip.pickSlipId).pipe(
        switchMap(box => {
          const packRequest: PackProductRequestDto = {
            dinNumber,
            boxId: box.boxId,
            pickSlipId: pickSlip.pickSlipId,
            productCode: formValue.productCode,
            barcodeScheme: this.labelCtrl.value || this.productDetail()?.barcodeScheme || (unitData?.codeScheme === 'I' ? 'Mf' : '49'),
            customerId: this.selectedCustomerId,
            consigneeId: this.selectedConsigneeId || pickSlip.consigneeId,
            orderNo: this.selectedOrderNo || pickSlip.orderId || null,
            productType: this.selectedProductType || pickSlip.productCode || null,
            validateAboCompatibility: true,
            validateExpiry: true,
            validateInterdictions: false,
            validateTier: true,
            autoCreateOrder: !this.selectedOrderNo,
            autoCloseBox: true
          };
          return this.packService.packProduct(packRequest).pipe(
            switchMap(response => {
              this.snackbarService.showSuccess('Product packed successfully');

              const updatedBox: BoxDto = {
                ...box,
                currentCount: response.currentCount,
                remainingCapacity: response.remainingCapacity,
                percentageFull: (response.currentCount / box.maxCapacity) * 100,
                isAtCapacity: response.currentCount >= box.maxCapacity
              };
              this.selectedBox.set(updatedBox);

              if (updatedBox.isAtCapacity) {
                this.packingProduct.set(false);
                this.snackbarService.showSuccess('Maximum Capacity Reached. Box closed.');
                this.clearAll();
              } else {
                this.loadPackedProducts(box.boxId);

                this.unitIdField?.clear();
                this.productForm.patchValue({ productCode: '' });
                this.productDetail.set(null);
                this.labelCtrl.setValue('');
                this.submitted.set(false);
                this.packingProduct.set(false);

                setTimeout(() => this.unitIdField?.focus(), 100);
              }
              return of(response);
            })
          );
        })
      )),
      takeUntil(this.destroy$)
    ).subscribe({
      error: () => {
        this.packingProduct.set(false);
      }
    });
  }

  private ensurePickSlipExists() {
    const pickSlip = this.selectedPickSlip();
    if (pickSlip?.pickSlipId) {
      return of(pickSlip);
    }

    const request: CreatePickSlipRequestDto = {
      orderId: this.selectedOrderNo || '',
      customerId: this.selectedCustomerId,
      consigneeId: this.selectedConsigneeId,
      productCode: this.selectedProductType,
      aboType: ''
    };
    return this.packService.createPickSlip(request).pipe(
      switchMap(response => this.packService.getPickSlipById(response.pickSlipId)),
      switchMap(newPickSlip => {
        this.selectedPickSlip.set(newPickSlip);
        return of(newPickSlip);
      })
    );
  }

  private ensureBoxExists(pickSlipId: string) {
    const box = this.selectedBox();
    if (box?.boxId) {
      return of(box);
    }

    const request: CreateBoxRequestDto = {
      pickSlipId,
      maxCapacity: 50,
      productType: this.selectedProductType || 'RPL'
    };
    return this.packService.createBox(request).pipe(
      switchMap(response => this.packService.getBoxById(response.boxId)),
      switchMap(newBox => {
        this.selectedBox.set(newBox);
        this.selectedBoxId = newBox.boxId;
        return of(newBox);
      })
    );
  }

  /**
   * Handle table row action
   */
  onTableRowAction(event: TableRowActionEvent<PackedProductDto>): void {
    if (event.action === 'remove') {
      this.onUnpackProduct(event.row);
    }
  }

  /**
   * Unpack product from box
   */
  onUnpackProduct(product: PackedProductDto): void {
    if (!this.selectedBox() || !this.selectedPickSlip()) {
      return;
    }

    const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
      width: '500px',
      data: {
        title: 'Remove Product',
        message: `Are you sure you want to remove product ${product.dinNumber} from this box?`,
        confirmText: 'REMOVE',
        cancelText: 'CANCEL'
      }
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed && this.selectedBox() && this.selectedPickSlip()) {
        this.packService.unpackProduct({
          dinNumber: product.dinNumber,
          boxId: this.selectedBox()!.boxId,
          pickSlipId: this.selectedPickSlip()!.pickSlipId
        })
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (response) => {
              this.snackbarService.showSuccess('Product removed successfully');

              // Update box capacity
              const box = this.selectedBox()!;
              const updatedBox: BoxDto = {
                ...box,
                currentCount: response.currentCount,
                remainingCapacity: response.remainingCapacity,
                percentageFull: (response.currentCount / box.maxCapacity) * 100,
                isAtCapacity: response.currentCount >= box.maxCapacity
              };
              this.selectedBox.set(updatedBox);

              // Reload packed products
              this.loadPackedProducts(box.boxId);
            },
            error: () => {
              // Error handled by interceptor
            }
          });
      }
    });
  }

  /**
   * Prompt to close current box
   */
  private promptCloseBox(): void {
    const dialogRef = this.dialog.open(CloseBoxDialogComponent, {
      width: '500px',
      disableClose: true,
      data: {
        currentBoxId: this.selectedBox()?.boxId ?? null,
        hasPackedProducts: this.packedProducts().length > 0
      }
    });

    dialogRef.afterClosed().subscribe((result: CloseBoxDialogResult | null) => {
      if (result) {
        if (result.closeCurrentBox) {
          this.onCloseBox();
        }
      }
    });
  }

  /**
   * Close current box and prompt for new box
   */
  onCloseBox(): void {
    const pickSlipId = this.selectedPickSlip()?.pickSlipId;
    if (!pickSlipId) return;

    const dialogRef = this.dialog.open(NewBoxDialogComponent, {
      width: '500px',
      disableClose: true,
      data: { pickSlipId }
    });

    dialogRef.afterClosed().subscribe((result: { action: string; boxId?: string; maxCapacity?: number }) => {
      if (!result || result.action !== 'new') return;

      const request: CreateBoxRequestDto = {
        pickSlipId: pickSlipId,
        maxCapacity: result.maxCapacity || 50,
        boxId: result.boxId || null,
        productType: this.selectedProductType || 'RPL'
      };

      this.packService.createBox(request).pipe(
        switchMap(response => this.packService.getBoxById(response.boxId)),
        takeUntil(this.destroy$)
      ).subscribe({
        next: (newBox) => {
          this.selectedBox.set(newBox);
          this.selectedBoxId = newBox.boxId;
          this.packedProducts.set([]);
          this.snackbarService.showSuccess(`New box ${newBox.boxId} created`);
          this.loadBoxesByPickSlip(pickSlipId);
        },
        error: () => {
          this.snackbarService.showError('Failed to create new box');
        }
      });
    });
  }

  /**
   * Load packed products for box
   */
  private loadPackedProducts(boxId: string): void {
    this.loading.set(true);
    this.packService.getPackedProductsByBox(boxId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (products) => {
          this.packedProducts.set(products);
          this.totalCount = products.length;
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        }
      });
  }

  /**
   * Cancel and clear form
   */
  onCancel(): void {
    this.unitIdField?.clear();
    this.productForm.reset();
    this.productDetail.set(null);
    this.labelCtrl.setValue('');
    this.submitted.set(false);
  }

  /**
   * Clear all data
   */
  private clearAll(): void {
    this.unitIdField?.clear();
    this.selectedPickSlip.set(null);
    this.selectedBox.set(null);
    this.packedProducts.set([]);
    this.orderOptions.set([]);
    this.pickSlipOptions.set([]);
    this.boxOptions.set([]);
    this.filteredBoxOptions.set([]);
    this.productCodeOptions.set([]);
    this.filteredProductCodeOptions.set([]);
    this.selectedCustomerId = '';
    this.selectedBoxId = '';
    this.selectedProductType = '';
    this.selectedConsigneeId = '';
    this.selectedOrderNo = '';
    this.productDetail.set(null);
    this.labelCtrl.setValue('');
    this.previousVolume.set(0);
    this.currentVolume.set(0);
    this.productForm.reset();
    this.submitted.set(false);
  }
}
