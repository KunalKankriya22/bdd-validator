import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Subject, Observable, of, map } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { UnitIdFieldComponent, UnitValidationResponse } from '@shared/components/unit-id-field';
import { ScanSelectFieldComponent, ScanSelectOption } from '@shared/components/scan-select-field';
import { SCAN_PATTERNS } from '@shared/utils/scan-pattern.util';
import { DonorLibLabelScanService } from '@shared/services/donor-lib-label-scan.service';
import { PackLabDiscardsService } from './services/pack-lab-discards.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TableRowActionEvent } from '@shared/interfaces/data-table.interface';
import {
  CreateNewBoxDialogComponent,
  CreateNewBoxDialogData,
  CreateNewBoxDialogResult,
} from '../offline-product-packing/create-new-box-dialog/create-new-box-dialog';
import { SelectTestDialogComponent, SelectTestDialogData } from './dialogs/select-test-dialog/select-test-dialog';
import { DiscardProductsDialogComponent, DiscardProductsDialogData } from './dialogs/discard-products-dialog/discard-products-dialog';
import { BoxContentsDialogComponent, BoxContentsDialogData } from './dialogs/box-contents-dialog/box-contents-dialog';

import {
  Consignee,
  Order,
  ProductType,
  DiscardType,
  Box,
  TestId,
  PackProductRequest,
  PackedProduct,
  UnitProduct,
  ERROR_MESSAGES,
} from './models/pack-lab-discards.model';

@Component({
  selector: 'app-pack-lab-discards',
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
    MatDialogModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    UnitIdFieldComponent,
    ScanSelectFieldComponent,
  ],
  templateUrl: './pack-lab-discards.component.html',
  styleUrls: ['./pack-lab-discards.component.scss'],
})
export class PackLabDiscardsComponent implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `pack-lab-discards-${PackLabDiscardsComponent.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;

  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly packLabDiscardsService = inject(PackLabDiscardsService);
  private readonly labelScanService = inject(DonorLibLabelScanService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly dialog = inject(MatDialog);
  private readonly headerService = inject(HeaderService);
  private readonly pageHeaderService = inject(PageHeaderService);

  private readonly discardOption: string = this.route.snapshot.data['discardOption'] || 'DI';

  @ViewChild('unitIdField') unitIdField?: UnitIdFieldComponent;
  @ViewChild('productCodeField') productCodeField?: ScanSelectFieldComponent;
  @ViewChild('aboRhField') aboRhField?: ScanSelectFieldComponent;

  protected readonly SCAN_PATTERNS = SCAN_PATTERNS;

  private readonly unitCodeScheme = signal<string>('I');

  readonly parseProductCode = (value: string): Observable<ScanSelectOption | null> => {
    const trimmed = value?.trim()?.toUpperCase();
    if (!trimmed) return of(null);
    const match = this.productCodeOptions().find(
      o => o.code.toUpperCase() === trimmed || o.code.toUpperCase().startsWith(trimmed),
    );
    if (match) return of(match);
    return this.labelScanService.validateProductScan(value, this.unitCodeScheme()).pipe(
      map((res) => {
        if (res.success && res.item) {
          return { code: res.item.productCode!, description: res.item.productDescription ?? '' };
        }
        throw new Error(res.errorResponse?.error || res.message || 'Invalid product code');
      }),
    );
  };

  readonly parseAboRh = (value: string): Observable<ScanSelectOption | null> => {
    const trimmed = value?.trim()?.toUpperCase();
    if (!trimmed) return of(null);
    const match = this.aboRhOptions().find(o => o.code.toUpperCase() === trimmed);
    if (match) return of(match);
    return this.labelScanService.validateAboScan(value, this.unitCodeScheme()).pipe(
      map((res) => {
        if (res.success && res.item) {
          const optMatch = this.aboRhOptions().find(
            o => o.code.toUpperCase() === (res.item!.aboCode || '').toUpperCase(),
          );
          return optMatch ?? { code: res.item.aboCode!, description: res.item.aboShortName ?? '' };
        }
        throw new Error(res.errorResponse?.error || res.message || 'Invalid ABO code');
      }),
    );
  };

  private destroy$ = new Subject<void>();

  protected readonly headerConfig = computed<PageHeaderConfig>(() => {
    const data = this.pageHeaderService.pageHeaderData();
    return {
      title: data?.title || 'Pack Lab Discards to Discard',
      subtitle: data?.subtitle || '',
      breadcrumbs: [
        { label: 'Home', link: '/home' },
        { label: data?.title || 'Pack Lab Discards to Discard' },
      ],
    };
  });

  packForm!: FormGroup;

  // Lookup data
  consignees = signal<Consignee[]>([]);
  orders = signal<Order[]>([]);
  productTypes = signal<ProductType[]>([]);
  discardTypes = signal<DiscardType[]>([]);
  boxes = signal<Box[]>([]);
  testIds = signal<TestId[]>([]);

  // State
  loading = signal(false);
  selectedConsigneeId = signal<string | null>(null);
  selectedBoxId = signal<string | null>(null);
  selectedDiscardType = signal<string | null>(null);
  showTestIds = computed(() => this.selectedDiscardType() === 'BIO');
  pickSlipId = signal('');
  packedProducts = signal<PackedProduct[]>([]);
  selectedTestIds = signal<TestId[]>([]);

  // Unit validation state
  validatedUnitId = signal<string | null>(null);
  unitProducts = signal<UnitProduct[]>([]);
  productCodeOptions = signal<ScanSelectOption[]>([]);
  aliquotOptions = signal<string[]>([]);
  productDescription = signal('-');
  aboRhOptions = signal<ScanSelectOption[]>([]);
  selectedProductCode = signal('');
  collectionDateDisplay = signal('-');

  // Search controls
  consigneeSearchCtrl = new FormControl('');
  private consigneeSearchText = signal('');
  readonly filteredConsignees = computed(() => {
    const s = this.consigneeSearchText().toLowerCase();
    return !s ? this.consignees() : this.consignees().filter(c =>
      c.consigneeId.toLowerCase().includes(s) ||
      c.customerId.toLowerCase().includes(s) ||
      c.consigneeName?.toLowerCase().includes(s)
    );
  });

  testIdSearchCtrl = new FormControl('');

  // Packed products table config
  packedProductsTableConfig: DataTableConfig = {
    caption: 'Packed Products',
    columns: [
      { key: 'unitId', header: 'Unit ID' },
      { key: 'productCode', header: 'Product Code' },
      { key: 'productDesc', header: 'Description' },
      { key: 'orderedAboRh', header: 'Ordered ABO/Rh' },
      { key: 'boxId', header: 'Box ID' },
    ],
    rowActions: [
      { icon: 'delete', action: 'delete', ariaLabel: 'Remove product {{unitId}}', color: 'warn' },
    ],
    showTableOnEmpty: true,
    pagination: {
      pageSize: 25,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50],
      showFirstLastButtons: true,
    },
    emptyMessage: 'No products packed yet.',
    emptySubMessage: 'Scan a product to begin packing.',
  };

  ngOnInit(): void {
    this.initForm();
    this.loadInitialData();
    this.setupFormSubscriptions();
    this.setupSearchSubscriptions();
    this.subscribeToChapterChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.packForm = this.fb.group({
      consigneeId: ['', [Validators.required, Validators.maxLength(10)]],
      orderNo: [{ value: '', disabled: true }],
      productType: [''],
      discardType: [''],
      boxId: [{ value: '', disabled: true }],
      productCode: [''],
      bloodType: [''],
      aliquot: [''],
    });
  }

  private setupFormSubscriptions(): void {
    this.packForm.get('consigneeId')?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(id => {
        this.selectedConsigneeId.set(id);
        if (id) {
          this.packForm.get('orderNo')?.enable({ emitEvent: false });
          this.packForm.get('boxId')?.enable({ emitEvent: false });
          this.loadOrders(id);
          this.loadBoxes(id);
        } else {
          this.orders.set([]);
          this.boxes.set([]);
          this.packForm.patchValue({ orderNo: '', boxId: '' });
          this.packForm.get('orderNo')?.disable({ emitEvent: false });
          this.packForm.get('boxId')?.disable({ emitEvent: false });
        }
      });

    this.packForm.get('orderNo')?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(orderNo => {
        if (orderNo === '') this.pickSlipId.set('');
      });

    this.packForm.get('discardType')?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(dt => {
        this.selectedDiscardType.set(dt);
        if (dt !== 'BIO') this.selectedTestIds.set([]);
      });

    this.packForm.get('boxId')?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(boxId => {
        this.selectedBoxId.set(boxId);
        if (boxId) {
          this.loadPackedProducts(boxId);
        } else {
          this.packedProducts.set([]);
        }
      });
  }

  private setupSearchSubscriptions(): void {
    this.consigneeSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(v => this.consigneeSearchText.set(v || ''));
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$.pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.clearForm();
        this.loadInitialData();
      });
  }

  // --- Data Loading ---

  private loadInitialData(): void {
    this.loadConsignees();
    this.loadProductTypes();
    this.loadDiscardTypes();
    this.loadTestIds();
  }

  private loadConsignees(): void {
    this.packLabDiscardsService.getConsignees(this.discardOption)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: data => this.consignees.set(data),
        error: err => this.handleError('Failed to load consignees', err),
      });
  }

  private loadOrders(consigneeId: string): void {
    this.packLabDiscardsService.getOrders(consigneeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: data => {
          this.orders.set(data);
          if (data.length === 1 && !this.packForm.get('orderNo')?.value) {
            this.packForm.patchValue({ orderNo: data[0].orderNo });
          }
        },
        error: err => this.handleError('Failed to load orders', err),
      });
  }

  private loadProductTypes(): void {
    this.packLabDiscardsService.getProductTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: data => this.productTypes.set(data),
        error: err => this.handleError('Failed to load product types', err),
      });
  }

  private loadDiscardTypes(): void {
    this.packLabDiscardsService.getDiscardTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: data => this.discardTypes.set(data),
        error: err => this.handleError('Failed to load discard types', err),
      });
  }

  private loadBoxes(consigneeId: string): void {
    this.packLabDiscardsService.getBoxes(consigneeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: data => this.boxes.set(data),
        error: err => this.handleError('Failed to load boxes', err),
      });
  }

  private loadTestIds(): void {
    this.packLabDiscardsService.getTestIds()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: data => this.testIds.set(data),
        error: err => this.handleError('Failed to load test IDs', err),
      });
  }

  private loadPackedProducts(boxId: string): void {
    this.packLabDiscardsService.getBoxContents(boxId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: data => {
          this.packedProducts.set(
            data.map(item => ({
              unitId: item.unitId,
              productCode: item.productCode,
              productDesc: item.productDesc || '-',
              orderedAboRh: item.aboDesc || '-',
              boxId,
            })),
          );
        },
        error: err => this.handleError('Failed to load packed products', err),
      });
  }

  // --- Unit & Product handlers ---

  onUnitValidated(event: UnitValidationResponse): void {
    const unitId = event?.parsedUnitId;
    if (!unitId) return;

    this.validatedUnitId.set(unitId);
    this.unitCodeScheme.set(event.codeScheme || 'I');

    if (event.collectionDate) {
      this.collectionDateDisplay.set(event.collectionDate);
    }

    this.resetProductState();

    this.loading.set(true);
    this.packLabDiscardsService.getUnitProducts(
      unitId,
      this.packForm.get('productType')?.value || undefined,
      this.packForm.get('discardType')?.value || undefined,
      this.packForm.get('consigneeId')?.value || undefined,
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (products) => {
          this.loading.set(false);
          this.unitProducts.set(products);

          if (products.length === 0) {
            this.snackbarService.showError(`No discardable products found for unit ${unitId}`);
            return;
          }

          const uniqueProducts = new Map<string, string>();
          products.forEach(p => {
            if (!uniqueProducts.has(p.productCode)) {
              uniqueProducts.set(p.productCode, p.productDesc || '');
            }
          });
          const opts = Array.from(uniqueProducts, ([code, description]) => ({ code, description }));
          this.productCodeOptions.set(opts);

          setTimeout(() => this.productCodeField?.focus());

          if (this.collectionDateDisplay() === '-' && products[0]?.collDate) {
            this.collectionDateDisplay.set(products[0].collDate);
          }
        },
        error: (err) => {
          this.loading.set(false);
          this.handleError('Failed to load products for unit', err);
        },
      });
  }

  onProductCodeChange(option: ScanSelectOption | null): void {
    const code = option?.code || '';
    this.aliquotOptions.set([]);
    this.aboRhOptions.set([]);
    this.aboRhField?.clear();
    this.selectedProductCode.set(code);
    this.packForm.patchValue({ productCode: code, aliquot: '', bloodType: '' });

    if (!code) {
      this.productDescription.set('-');
      return;
    }

    const matching = this.unitProducts().filter(p => p.productCode === code);
    if (matching.length > 0) {
      this.productDescription.set(matching[0].productDesc || '-');

      const bloodTypeMap = new Map<string, string>();
      matching.forEach(p => {
        if (p.systemLabelDecision && !bloodTypeMap.has(p.systemLabelDecision)) {
          bloodTypeMap.set(p.systemLabelDecision, p.aboDesc || p.systemLabelDecision);
        }
      });
      this.aboRhOptions.set(Array.from(bloodTypeMap, ([code, description]) => ({ code, description })));

      const prefixes = [...new Set(matching.map(p => p.componentPrefix).filter(Boolean))];
      this.aliquotOptions.set(prefixes);

      if (prefixes.length === 1) {
        this.packForm.patchValue({ aliquot: prefixes[0] });
      }

      setTimeout(() => this.aboRhField?.focus());
    }
  }

  onAliquotChange(aliquot: string): void {
    if (!aliquot) {
      this.aboRhField?.clear();
      this.packForm.patchValue({ bloodType: '' });
      return;
    }

    this.aboRhField?.clear();
    this.packForm.patchValue({ bloodType: '' });
    setTimeout(() => this.aboRhField?.focus());
  }

  private applyBloodTypeFromAliquot(aliquot: string, matchingProducts: UnitProduct[]): void {
    const exact = matchingProducts.find(p => p.componentPrefix === aliquot);
    const product = exact ?? (matchingProducts.length > 0 ? matchingProducts[0] : null);
    if (product?.systemLabelDecision) {
      const option: ScanSelectOption = {
        code: product.systemLabelDecision,
        description: product.aboDesc || product.systemLabelDecision,
      };
      this.aboRhField?.setValue(option.code, option.description);
      this.onAboRhChanged(option);
    }
  }

  onAboRhChanged(option: ScanSelectOption | null): void {
    this.packForm.patchValue({ bloodType: option?.code ?? '' });
    if (option?.code) {
      this.onPackProduct();
    }
  }

  onAboRhCleared(): void {
    this.packForm.patchValue({ bloodType: '' });
  }

  onUnitCleared(): void {
    this.validatedUnitId.set(null);
    this.collectionDateDisplay.set('-');
    this.resetProductState();
  }

  private resetProductState(): void {
    this.unitProducts.set([]);
    this.productCodeOptions.set([]);
    this.aliquotOptions.set([]);
    this.aboRhOptions.set([]);
    this.selectedProductCode.set('');
    this.productCodeField?.clear();
    this.aboRhField?.clear();
    this.productDescription.set('-');
    this.packForm.patchValue({ productCode: '', bloodType: '', aliquot: '' });
  }

  // --- Actions ---

  onPackProduct(): void {
    if (!this.validatedUnitId()) {
      this.snackbarService.showError('Please scan or enter a valid Unit ID');
      return;
    }

    if (this.packForm.invalid) {
      this.packForm.markAllAsTouched();
      return;
    }

    const request: PackProductRequest = {
      consigneeId: this.packForm.get('consigneeId')?.value,
      orderNo: this.packForm.get('orderNo')?.value || undefined,
      productType: this.packForm.get('productType')?.value || undefined,
      discardType: this.packForm.get('discardType')?.value,
      boxId: this.packForm.get('boxId')?.value || undefined,
      unitId: this.validatedUnitId()!,
      productCode: this.packForm.get('productCode')?.value,
      bloodType: this.packForm.get('bloodType')?.value,
      aliquot: this.packForm.get('aliquot')?.value || undefined,
      testIds: this.selectedTestIds().map(t => t.testId),
    };

    this.loading.set(true);
    this.packLabDiscardsService.packProduct(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: response => {
          this.loading.set(false);
          if (response.success && response.data) {
            this.snackbarService.showSuccess(response.message || 'Product packed successfully.');

            this.packedProducts.update(list => [...list, {
              unitId: response.data!.unitId,
              productCode: response.data!.productCode,
              aliquot: this.packForm.get('aliquot')?.value || undefined,
              productDesc: this.productDescription(),
              orderedAboRh: this.aboRhField?.currentValue?.description || this.packForm.get('bloodType')?.value || '-',
              boxId: response.data!.boxId,
            }]);

            if (response.data.pickSlipId) this.pickSlipId.set(response.data.pickSlipId);
            if (response.data.boxId) {
              const boxExistsInList = this.boxes().some(b => b.boxId === response.data!.boxId);
              if (!boxExistsInList) {
                this.boxes.update(list => [...list, {
                  boxId: response.data!.boxId,
                  boxStatus: 'OP',
                  consigneeId: this.packForm.get('consigneeId')?.value
                } as Box]);
              }
              if (!this.selectedBoxId()) {
                this.packForm.patchValue({ boxId: response.data.boxId });
              }
              this.loadPackedProducts(response.data.boxId);
            }
            if (response.data.orderNo) {
              const existsInList = this.orders().some(o => o.orderNo === response.data!.orderNo);
              if (!existsInList) {
                this.orders.update(list => [...list, {
                  orderNo: response.data!.orderNo,
                  orderType: 'LD',
                  orderStatus: 'PK',
                  insertDate: new Date().toISOString()
                } as Order]);
              }
              if (!this.packForm.get('orderNo')?.value) {
                this.packForm.patchValue({ orderNo: response.data.orderNo });
              }
            }

            this.clearProductFields();
            this.unitIdField?.focus();
          } else {
            this.handleApiError(response);
          }
        },
        error: err => { this.loading.set(false); this.handleError('Failed to pack product', err); },
      });
  }

  onPackedProductAction(event: TableRowActionEvent<PackedProduct>): void {
    if (event.action === 'delete') {
      const { unitId, productCode, aliquot } = event.row;
      this.loading.set(true);
      this.packLabDiscardsService.unpackProduct(unitId, productCode, aliquot)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: response => {
            this.loading.set(false);
            if (response.success) {
              this.snackbarService.showSuccess('Product unpacked successfully.');
              this.packedProducts.update(list =>
                list.filter(p => !(p.unitId === unitId && p.productCode === productCode && p.aliquot === aliquot))
              );
              this.refreshUnitProductsAfterUnpack(unitId);
            } else {
              this.handleApiError(response);
            }
          },
          error: err => { this.loading.set(false); this.handleError('Failed to unpack product', err); },
        });
    }
  }

  onCloseBox(): void {
    const boxId = this.selectedBoxId();
    if (!boxId) return;

    const dialogRef = this.dialog.open(CreateNewBoxDialogComponent, {
      width: '500px',
      disableClose: false,
      data: {
        currentBoxId: boxId,
        hasPackedProducts: this.packedProducts().length > 0,
        dialogTitle: 'Close Box',
        confirmButtonText: 'CLOSE BOX',
      } as CreateNewBoxDialogData,
    });

    dialogRef.afterClosed().subscribe((result: CreateNewBoxDialogResult | null) => {
      if (!result) return;

      if (result.closeCurrentBox && result.allProperlyPacked) {
        this.loading.set(true);
        this.packLabDiscardsService.closeBox(boxId, 'Y')
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: response => {
              this.loading.set(false);
              if (response.success) {
                this.snackbarService.showSuccess('box has been closed successfully.');
                this.packForm.patchValue({ boxId: '' });
                this.packedProducts.set([]);
                if (this.selectedConsigneeId()) this.loadBoxes(this.selectedConsigneeId()!);
              } else {
                this.handleApiError(response);
              }
            },
            error: err => { this.loading.set(false); this.handleError('Failed to close box', err); },
          });
      }
    });
  }

  onNewBox(): void {
    const currentBoxId = this.selectedBoxId();
    if (currentBoxId && this.packedProducts().length > 0) {
      const dialogRef = this.dialog.open(CreateNewBoxDialogComponent, {
        width: '500px',
        disableClose: false,
        data: {
          currentBoxId,
          hasPackedProducts: true,
          dialogTitle: 'Close Box',
          confirmButtonText: 'CREATE NEW',
        } as CreateNewBoxDialogData,
      });

      dialogRef.afterClosed().subscribe((result: CreateNewBoxDialogResult | null) => {
        if (!result) return;
        if (result.closeCurrentBox) {
          this.loading.set(true);
          this.packLabDiscardsService.closeBox(currentBoxId, 'Y')
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: () => {
                this.loading.set(false);
                this.packForm.patchValue({ boxId: '' });
                this.packedProducts.set([]);
                if (this.selectedConsigneeId()) this.loadBoxes(this.selectedConsigneeId()!);
              },
              error: err => { this.loading.set(false); this.handleError('Failed to close box', err); },
            });
        } else {
          this.packForm.patchValue({ boxId: '' });
          this.packedProducts.set([]);
        }
      });
    } else {
      this.packForm.patchValue({ boxId: '' });
      this.packedProducts.set([]);
    }
  }

  onViewBoxContents(): void {
    const boxId = this.selectedBoxId();
    if (!boxId) return;

    this.dialog.open(BoxContentsDialogComponent, {
      width: '700px',
      maxWidth: '90vw',
      height: 'calc(100vh - 64px)',
      position: { right: '0', top: '64px' },
      panelClass: 'right-side-drawer',
      hasBackdrop: false,
      autoFocus: false,
      enterAnimationDuration: '0ms',
      exitAnimationDuration: '0ms',
      data: { boxId } as BoxContentsDialogData,
    });
  }

  onViewDiscardProducts(): void {
    this.dialog.open(DiscardProductsDialogComponent, {
      width: '700px',
      maxWidth: '90vw',
      height: 'calc(100vh - 64px)',
      position: { right: '0', top: '64px' },
      panelClass: 'right-side-drawer',
      hasBackdrop: true,
      backdropClass: 'side-panel-backdrop',
      autoFocus: false,
      enterAnimationDuration: '0ms',
      exitAnimationDuration: '0ms',
      data: {
        productType: this.packForm.get('productType')?.value || undefined,
        discardType: this.packForm.get('discardType')?.value || undefined,
      } as DiscardProductsDialogData,
    });
  }

  onAddTest(): void {
    const dialogRef = this.dialog.open(SelectTestDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      height: 'calc(100vh - 64px)',
      position: { right: '0', top: '64px' },
      panelClass: 'right-side-drawer',
      hasBackdrop: false,
      autoFocus: false,
      enterAnimationDuration: '0ms',
      exitAnimationDuration: '0ms',
      data: {
        availableTests: this.testIds(),
        selectedTestIds: this.selectedTestIds().map(t => t.testId),
      } as SelectTestDialogData,
    });

    dialogRef.afterClosed().subscribe((selectedTests: TestId[] | null) => {
      if (selectedTests) {
        this.selectedTestIds.set(selectedTests);
      }
    });
  }

  onRemoveTest(testId: string): void {
    this.selectedTestIds.update(list => list.filter(t => t.testId !== testId));
  }

  onCancel(): void {
    this.clearForm();
  }

  canDeactivate(): boolean {
    return this.packedProducts().length === 0 && !this.loading();
  }

  // --- Helpers ---

  private refreshUnitProductsAfterUnpack(unitId: string): void {
    if (this.validatedUnitId() !== unitId) return;

    this.packLabDiscardsService.getUnitProducts(
      unitId,
      this.packForm.get('productType')?.value || undefined,
      this.packForm.get('discardType')?.value || undefined,
      this.packForm.get('consigneeId')?.value || undefined,
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (products) => {
          this.unitProducts.set(products);

          const uniqueProducts = new Map<string, string>();
          products.forEach(p => {
            if (!uniqueProducts.has(p.productCode)) {
              uniqueProducts.set(p.productCode, p.productDesc || '');
            }
          });
          this.productCodeOptions.set(
            Array.from(uniqueProducts, ([code, description]) => ({ code, description }))
          );
        },
      });
  }

  private clearProductFields(): void {
    this.unitIdField?.clear();
    this.validatedUnitId.set(null);
    this.collectionDateDisplay.set('-');
    this.resetProductState();
  }

  clearForm(): void {
    this.unitIdField?.clear();
    this.validatedUnitId.set(null);
    this.collectionDateDisplay.set('-');
    this.resetProductState();
    this.packForm.reset();
    this.packForm.get('orderNo')?.disable({ emitEvent: false });
    this.packForm.get('boxId')?.disable({ emitEvent: false });
    this.orders.set([]);
    this.boxes.set([]);
    this.packedProducts.set([]);
    this.selectedTestIds.set([]);
    this.pickSlipId.set('');
  }

  protected getSelectedConsigneeAddress(): string {
    const id = this.packForm.get('consigneeId')?.value;
    if (!id) return '';
    const c = this.consignees().find(x => x.consigneeId === id);
    if (!c) return '';
    return [c.shortName, c.address1, c.city, c.state].filter(Boolean).join(', ');
  }

  protected getSelectedProductTypeDesc(): string {
    const pt = this.packForm.get('productType')?.value;
    if (!pt) return '';
    return this.productTypes().find(x => x.productType === pt)?.productDesc || '';
  }

  get f() { return this.packForm.controls; }

  private handleApiError(response: any): void {
    const code = response.errorCode;
    const msg = code && ERROR_MESSAGES[code] ? ERROR_MESSAGES[code] : response.message || 'An error occurred';
    this.snackbarService.showError(msg);
  }

  private handleError(message: string, err: any): void {
    console.error(message, err);
    this.snackbarService.showError(err?.error?.message || err?.message || message);
  }
}
