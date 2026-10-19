import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  signal,
  computed,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { A11yModule } from '@angular/cdk/a11y';
import { Observable, Subject, of, map, takeUntil } from 'rxjs';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { DonorLibLabelScanService } from '@shared/services/donor-lib-label-scan.service';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TablePageEvent } from '@shared/interfaces/data-table.interface';
import { UnitIdFieldComponent, UnitIdPostValidateEvent } from '@shared/components/unit-id-field/unit-id-field.component';
import { convertUTCToTimezone } from '@shared/date/timezone.util';
import { ScanSelectFieldComponent, ScanSelectOption } from '@shared/components/scan-select-field';
import { SCAN_PATTERNS } from '@shared/utils/scan-pattern.util';

import { PackodApiService } from './services/packod-api.service';
import {
  DiscardProductDto,
  DiscardProductQueryDto,
  ConsigneeDto,
  ProductTypeLookupDto,
  OpenBoxDto,
  OrderLookupDto,
  PackProductResponse,
} from './models/packod.model';
import { PackodBoxDialogComponent } from './components/box-dialog/box-dialog.component';
import { PackodViewBoxContentsDialogComponent } from './components/view-box-contents-dialog/view-box-contents-dialog.component';

@Component({
  selector: 'app-packod',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    UnitIdFieldComponent,
    ScanSelectFieldComponent,
    PackodViewBoxContentsDialogComponent,
    A11yModule,
  ],
  templateUrl: './packod.html',
  styleUrls: ['./packod.scss'],
})
export class PackodComponent implements OnInit, OnDestroy {
  @ViewChild('unitIdField') unitIdField!: UnitIdFieldComponent;
  @ViewChild('productCodeField') productCodeField!: ScanSelectFieldComponent;
  @ViewChild('aboRhField') aboRhField!: ScanSelectFieldComponent;

  private readonly packodService = inject(PackodApiService);
  private readonly headerService = inject(HeaderService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly labelScanService = inject(DonorLibLabelScanService);
  private readonly dialog = inject(MatDialog);
  private readonly destroy$ = new Subject<void>();
  private readonly unitCodeScheme = signal<string>('I');

  readonly headerConfig = computed<PageHeaderConfig>(() => {
    const data = this.pageHeaderService.pageHeaderData();
    return {
      breadcrumbs: [
        { label: 'Distribution' },
        { label: 'Packing Function' },
        { label: data?.title || 'Pack Inv Rejects To Discard' },
      ],
      title: data?.title || 'Pack Inv Rejects To Discard',
      subtitle: data?.subtitle || 'Process of collecting, verifying, and packaging rejected or non-conforming inventory units for approved disposal in compliance with organizational and regulatory requirements.',
    };
  });

  protected readonly packedProducts = signal<DiscardProductDto[]>([]);
  protected readonly boxContents = signal<DiscardProductDto[]>([]);
  protected readonly consignees = signal<ConsigneeDto[]>([]);
  protected readonly productTypes = signal<ProductTypeLookupDto[]>([]);
  protected readonly boxes = signal<OpenBoxDto[]>([]);
  protected readonly orders = signal<OrderLookupDto[]>([]);
  protected readonly loading = signal(false);
  protected readonly loadingDropdowns = signal(false);
  protected readonly totalRecords = signal(0);
  protected readonly pageSize = signal(25);
  protected readonly pageIndex = signal(0);
  protected readonly currentBoxId = signal('');
  protected readonly currentUnitId = signal<string | null>(null);
  protected readonly pickSlipId = signal('-');
  protected readonly selectedConsigneeAddress = signal('');
  protected readonly selectedProductTypeDesc = signal('');
  protected readonly productCodeOptions = signal<ScanSelectOption[]>([]);
  protected readonly selectedProductCode = signal('');
  protected readonly aboRhOptions = signal<ScanSelectOption[]>([]);
  private readonly bloodTypeExpDateMap = signal<Map<string, string>>(new Map());
  // selectedAboRh holds the blood_type CODE (e.g. "OP"), not the description
  protected readonly selectedAboRh = signal('');
  protected readonly boxContentsPanelOpen = signal(false);
  private readonly pendingAutoSelectBoxId = signal<string | null>(null);
  private readonly suppressTableRefresh = signal(false);
  protected readonly expiryDisplay = signal('');
  private resolvedExpiryIso = '';

  protected readonly SCAN_PATTERNS = SCAN_PATTERNS;

  private stripProductScanPrefix(value: string): string {
    if (value.startsWith('=<')) return value.substring(2);
    if (/^A0/i.test(value) && value.length === 9) return value.substring(2);
    return value;
  }

  readonly parseProductCode = (value: string): Observable<ScanSelectOption | null> => {
    const trimmed = value?.trim()?.toUpperCase();
    if (!trimmed) return of(null);
    const decoded = this.stripProductScanPrefix(trimmed);
    const match = this.productCodeOptions().find(
      o => o.code.toUpperCase() === decoded
        || o.code.toUpperCase() === trimmed
        || decoded.startsWith(o.code.toUpperCase())
        || o.code.toUpperCase().startsWith(decoded),
    );
    if (match) return of(match);
    return this.labelScanService.validateProductScan(value, this.unitCodeScheme()).pipe(
      map((res) => {
        if (res.success && res.item) {
          return { code: res.item.productCode!, description: res.item.productDescription ?? '' };
        }
        if (decoded.length >= 5 && decoded !== trimmed) {
          return { code: decoded, description: '' };
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
          const aboCode = (res.item.aboCode || '').toUpperCase();
          const optMatch = this.aboRhOptions().find(o => o.code.toUpperCase() === aboCode);
          if (optMatch) return optMatch;
          return { code: res.item.aboCode!, description: res.item.aboShortName ?? '' };
        }
        throw new Error(res.errorResponse?.error || res.message || 'Invalid ABO code');
      }),
    );
  };

  protected readonly hasPackedProducts = computed(() => this.packedProducts().length > 0);
  protected readonly canCloseBox = computed(() => !!this.currentBoxId() && this.hasPackedProducts());
  protected readonly selectedConsigneeId = signal<string | null>(null);
  protected readonly canSave = computed(() =>
    !!this.currentUnitId()
    && !!this.selectedProductCode()
    && !!this.selectedAboRh()
    && !!this.selectedConsigneeId()
  );

  // Search controls for ngx-mat-select-search
  consigneeSearchCtrl = new FormControl('');
  private readonly consigneeSearchText = signal('');
  readonly filteredConsignees = computed(() => {
    const s = this.consigneeSearchText().toLowerCase();
    return !s ? this.consignees() : this.consignees().filter(c =>
      c.consigneeId?.toLowerCase().includes(s)
      || c.name?.toLowerCase().includes(s)
      || c.customerId?.toLowerCase().includes(s)
      || c.address?.toLowerCase().includes(s)
    );
  });

  productTypeSearchCtrl = new FormControl('');
  private readonly productTypeSearchText = signal('');
  readonly filteredProductTypes = computed(() => {
    const s = this.productTypeSearchText().toLowerCase();
    return !s ? this.productTypes() : this.productTypes().filter(pt =>
      pt.productType?.toLowerCase().includes(s) || pt.productTypeDesc?.toLowerCase().includes(s)
    );
  });

  boxSearchCtrl = new FormControl('');
  private readonly boxSearchText = signal('');
  readonly filteredBoxes = computed(() => {
    const s = this.boxSearchText().toLowerCase();
    return !s ? this.boxes() : this.boxes().filter(b =>
      b.boxId.toLowerCase().includes(s)
    );
  });

  // Header / cascading-select form
  form = new FormGroup({
    consigneeId: new FormControl<string | null>(null, [Validators.required]),
    orderId: new FormControl<string | null>({ value: null, disabled: true }),
    productType: new FormControl<string | null>({ value: null, disabled: true }),
    boxId: new FormControl<string | null>(null),
  });

  readonly tableConfig = computed<DataTableConfig<DiscardProductDto>>(() => ({
    columns: [
      {
        key: 'unitId',
        header: 'Unit ID',
        valueFormatter: (_v: any, row: DiscardProductDto) =>
          row.chkDigit ? `${row.unitId} (${row.chkDigit})` : row.unitId,
      },
      { key: 'productCode', header: 'Product Code' },
      { key: 'productDesc', header: 'Product Description' },
      { key: 'productType', header: 'Product Type' },
      {
        key: 'aboDesc',
        header: 'Ordered ABO/Rh',
        valueFormatter: (_v: any, row: DiscardProductDto) => row.aboDesc || row.bloodType || '-',
      },
      {
        key: 'expDate',
        header: 'Expiry Date and Time',
        valueFormatter: (_v: any, row: DiscardProductDto) => {
          if (!row.expDate) return '-';
          return this.formatExpiryDisplay(row.expDate);
        },
      },
      { key: 'boxId', header: 'Box ID' },
    ],
    pagination: {
      pageSize: this.pageSize(),
      pageIndex: this.pageIndex(),
      totalRecords: this.totalRecords(),
      pageSizeOptions: [10, 25, 50, 100],
      showFirstLastButtons: true,
    },
    stickyHeader: true,
    emptyMessage: 'No pending products',
    emptySubMessage: 'No checked-in products are available for packing',
    showPagination: true,
  }));

  ngOnInit(): void {
    this.setupFormSubscriptions();
    this.subscribeToChapterChanges();
    this.loadConsignees();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupFormSubscriptions(): void {
    this.form.get('consigneeId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(val => {
        this.selectedConsigneeId.set(val || null);
        this.onConsigneeChange(val || '');
      });

    this.form.get('orderId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.onOrderChange());

    this.form.get('productType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.onProductTypeChange());

    this.form.get('boxId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(val => {
        this.currentBoxId.set(val ?? '');
        if (val && val.trim() !== '') {
          this.loadBoxContents(val.trim());
          if (!this.suppressTableRefresh()) this.loadPackedProducts();
        } else {
          this.boxContents.set([]);
          this.packedProducts.set([]);
          this.totalRecords.set(0);
        }
      });

    this.consigneeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.consigneeSearchText.set(v || ''));

    this.productTypeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.productTypeSearchText.set(v || ''));

    this.boxSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.boxSearchText.set(v || ''));
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.clearAll());
  }

  private loadConsignees(): void {
    this.loadingDropdowns.set(true);
    this.packodService.getConsignees()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success && res.data) this.consignees.set(res.data);
          this.loadingDropdowns.set(false);
        },
        error: () => {
          this.snackbarService.showError('Failed to load consignees');
          this.loadingDropdowns.set(false);
        },
      });
  }

  private onConsigneeChange(consigneeId: string): void {
    this.orders.set([]);
    this.productTypes.set([]);
    this.boxes.set([]);
    this.form.patchValue({ orderId: null, productType: null, boxId: null }, { emitEvent: false });
    this.form.get('orderId')?.disable();
    this.form.get('productType')?.disable();
    this.currentBoxId.set('');
    this.selectedProductTypeDesc.set('');

    if (!consigneeId) {
      this.selectedConsigneeAddress.set('');
      this.packedProducts.set([]);
      return;
    }

    const consignee = this.consignees().find(c => c.consigneeId === consigneeId);
    this.selectedConsigneeAddress.set(consignee?.address ?? '');
    if (consignee) {
      this.loadOrders(consigneeId, consignee.customerId ?? '');
    }
  }

  private loadOrders(consigneeId: string, customerId: string): void {
    this.loadingDropdowns.set(true);
    this.packodService.getOrders(consigneeId, customerId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          const data = res.success && res.data ? res.data : [];
          this.orders.set(data);
          this.loadingDropdowns.set(false);
          if (data.length > 0) {
            this.form.get('orderId')?.enable();
            if (data.length === 1) this.form.get('orderId')?.setValue(data[0].orderNo);
          } else {
            this.form.get('orderId')?.disable();
          }
        },
        error: () => {
          this.orders.set([]);
          this.loadingDropdowns.set(false);
        },
      });
  }

  private loadOrdersAndSelect(consigneeId: string, customerId: string, orderNoToSelect: string): void {
    this.loadingDropdowns.set(true);
    this.packodService.getOrders(consigneeId, customerId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          const data = res.success && res.data ? res.data : [];
          this.orders.set(data);
          this.loadingDropdowns.set(false);
          if (data.length > 0) {
            this.form.get('orderId')?.enable({ emitEvent: false });
            const target = data.find(o => o.orderNo === orderNoToSelect);
            if (target) {
              this.form.get('orderId')?.setValue(target.orderNo);
            } else if (data.length === 1) {
              this.form.get('orderId')?.setValue(data[0].orderNo);
            }
          } else {
            this.form.get('orderId')?.disable();
          }
        },
        error: () => {
          this.orders.set([]);
          this.loadingDropdowns.set(false);
        },
      });
  }

  private onOrderChange(): void {
    const consigneeId = this.form.get('consigneeId')?.value;
    const orderId = this.form.get('orderId')?.value;
    this.productTypes.set([]);
    this.boxes.set([]);
    this.form.patchValue({ productType: null, boxId: null }, { emitEvent: false });
    this.form.get('productType')?.disable({ emitEvent: false });

    if (!consigneeId || !orderId) return;

    const consignee = this.consignees().find(c => c.consigneeId === consigneeId);
    if (consignee) {
      this.loadProductTypes(consigneeId, consignee.customerId ?? '');
    }
    if (!this.suppressTableRefresh()) this.loadPackedProducts();
  }

  private loadProductTypes(consigneeId: string, customerId: string): void {
    this.loadingDropdowns.set(true);
    this.packodService.getProductTypes(consigneeId, customerId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          const data = res.success && res.data ? res.data : [];
          this.productTypes.set(data);
          this.loadingDropdowns.set(false);
          if (data.length > 0) {
            if (data.length === 1) {
              this.form.get('productType')?.enable({ emitEvent: false });
              this.form.get('productType')?.setValue(data[0].productType);
            } else {
              this.form.get('productType')?.enable();
            }
          } else {
            this.form.get('productType')?.disable();
            this.suppressTableRefresh.set(false);
          }
        },
        error: () => {
          this.snackbarService.showError('Failed to load product types');
          this.loadingDropdowns.set(false);
          this.suppressTableRefresh.set(false);
        },
      });
  }

  private onProductTypeChange(): void {
    const consigneeId = this.form.get('consigneeId')?.value;
    const productType = this.form.get('productType')?.value;

    const desc = this.productTypes().find(p => p.productType === productType)?.productTypeDesc ?? '';
    this.selectedProductTypeDesc.set(desc);

    if (consigneeId) {
      this.loadBoxes(consigneeId, productType ?? undefined);
      if (!this.suppressTableRefresh()) this.loadPackedProducts();
    }
  }

  private loadBoxes(consigneeId: string, productType?: string, selectBoxId?: string): void {
    this.loadingDropdowns.set(true);
    const warehouseId = this.headerService.warehouseId();
    this.packodService.getBoxes(consigneeId, productType, warehouseId || undefined)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          const data = res.success && res.data ? res.data : [];
          this.boxes.set(data);
          this.loadingDropdowns.set(false);
          const pendingId = this.pendingAutoSelectBoxId();
          const targetBoxId = selectBoxId || pendingId;
          if (targetBoxId) {
            this.pendingAutoSelectBoxId.set(null);
            if (data.some(b => b.boxId === targetBoxId)) {
              this.form.get('boxId')?.setValue(targetBoxId);
            }
          } else if (data.length === 1) {
            this.form.get('boxId')?.setValue(data[0].boxId);
          }
          this.suppressTableRefresh.set(false);
        },
        error: () => {
          this.boxes.set([]);
          this.loadingDropdowns.set(false);
          this.suppressTableRefresh.set(false);
        },
      });
  }

  private loadPackedProducts(): void {
    const productType = this.form.get('productType')?.value;

    const query: DiscardProductQueryDto = {
      productType: productType || null,
      sortColumn: 'UnitId',
      sortOrder: 'ASC',
    };

    this.loading.set(true);
    this.packodService.getAvailableProducts(this.pageSize(), this.pageIndex() * this.pageSize(), query)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.packedProducts.set(response.data);
            this.totalRecords.set(response.total ?? 0);
          } else {
            this.packedProducts.set([]);
            this.totalRecords.set(0);
          }
          this.loading.set(false);
        },
        error: () => {
          this.snackbarService.showError('Failed to load packed products');
          this.loading.set(false);
        },
      });
  }

  private loadBoxContents(boxId: string): void {
    this.packodService.getBoxContents(boxId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          const data = res.success && res.data ? res.data : [];
          this.boxContents.set(data);
          const slipId = data.find(d => d.pickSlipId)?.pickSlipId;
          if (slipId) this.pickSlipId.set(slipId);
        },
        error: () => this.boxContents.set([]),
      });
  }

  private loadProductCodes(unitId: string): void {
    const consignee = this.consignees().find(
      c => c.consigneeId === this.form.get('consigneeId')?.value
    );
    this.packodService.getProductCodesForUnit(
      unitId,
      consignee?.customerId ?? undefined,
      consignee?.consigneeId ?? undefined
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          const data = res.success && res.data ? res.data : [];
          this.productCodeOptions.set(
            data.map(pc => ({ code: pc.productCode, description: pc.productDesc ?? '' }))
          );
          setTimeout(() => this.productCodeField?.focus());
        },
        error: () => {
          this.snackbarService.showError('Failed to load product codes');
        },
      });
  }

  private loadBloodTypes(unitId: string, productCode: string): void {
    this.packodService.getBloodTypesForProduct(unitId, productCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          const data = res.success && res.data ? res.data : [];
          const expMap = new Map<string, string>();
          data.forEach(bt => {
            if (bt.expDate) expMap.set(bt.bloodType, bt.expDate);
          });
          this.bloodTypeExpDateMap.set(expMap);
          this.aboRhOptions.set(
            data.map(bt => ({ code: bt.bloodType, description: bt.aboDesc ?? bt.bloodType }))
          );
          setTimeout(() => this.aboRhField?.focus());
        },
        error: () => {
          this.snackbarService.showError('Failed to load blood types');
        },
      });
  }

  formatExpiryDisplay(isoDate: string): string {
    const timezone = this.headerService.getCurrentChapterTimezone() || 'UTC';
    const d = convertUTCToTimezone(isoDate, timezone);
    if (isNaN(d.getTime())) return String(isoDate);
    const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = d.getHours();
    const mm = d.getMinutes();
    const dateStr = `${dd}-${months[d.getMonth()]}-${d.getFullYear()}`;
    return (hh || mm) ? `${dateStr} ${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}` : dateStr;
  }

  private populateExpDate(isoDate: string): void {
    this.resolvedExpiryIso = isoDate;
    this.expiryDisplay.set(this.formatExpiryDisplay(isoDate));
  }

  onPostValidate(event: UnitIdPostValidateEvent): void {
    const unitId = event.data.parsedUnitId;
    if (!unitId) {
      event.reject('Invalid unit ID');
      return;
    }
    this.currentUnitId.set(unitId);
    this.unitCodeScheme.set(event.data.codeScheme ?? 'I');
    event.confirm();
    this.loadProductCodes(unitId);
  }

  onUnitIdCleared(): void {
    this.currentUnitId.set(null);
    this.productCodeOptions.set([]);
    this.productCodeField?.clear();
    this.selectedProductCode.set('');
    this.aboRhOptions.set([]);
    this.aboRhField?.clear();
    this.selectedAboRh.set('');
  }

  onProductCodeChanged(option: ScanSelectOption | null): void {
    this.selectedProductCode.set(option?.code ?? '');
    this.aboRhOptions.set([]);
    this.aboRhField?.clear();
    this.selectedAboRh.set('');
    if (option?.code && this.currentUnitId()) {
      this.loadBloodTypes(this.currentUnitId()!, option.code);
    }
  }

  onProductCodeCleared(): void {
    this.selectedProductCode.set('');
    this.aboRhOptions.set([]);
    this.aboRhField?.clear();
    this.selectedAboRh.set('');
  }

  onAboRhChanged(option: ScanSelectOption | null): void {
    this.selectedAboRh.set(option?.code ?? '');
    if (option?.code) {
      const expDate = this.bloodTypeExpDateMap().get(option.code);
      if (expDate) {
        this.populateExpDate(expDate);
      }
    }
  }

  onAboRhCleared(): void {
    this.selectedAboRh.set('');
  }

  onSave(): void {
    if (!this.canSave() || this.loading()) return;

    const boxId = this.form.get('boxId')?.value?.trim() ?? '';
    const unitId = this.currentUnitId()!;
    const productCode = this.selectedProductCode();
    const bloodType = this.selectedAboRh() || undefined;
    const expDate = this.resolvedExpiryIso || undefined;
    const consigneeId = this.form.get('consigneeId')?.value ?? undefined;

    const orderId = this.form.get('orderId')?.value ?? undefined;
    const productType = this.form.get('productType')?.value ?? undefined;

    this.loading.set(true);
    this.packodService.addProductToBox({
      unitId,
      productCode,
      boxId: boxId || '',
      bloodType,
      expDate,
      consigneeId: consigneeId || undefined,
      orderNo: orderId || undefined,
      productType: productType || undefined,
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (response) => {
        if (response.success) {
          this.snackbarService.showSuccess('Product packed successfully');
          const data = response.data as PackProductResponse | undefined;
          if (data?.pickSlipId) {
            this.pickSlipId.set(data.pickSlipId);
          }
          this.clearEntry();
          const consigneeIdVal = this.form.get('consigneeId')?.value;
          const productTypeVal = this.form.get('productType')?.value;
          const responseBoxId = data?.boxId ?? boxId;
          if (responseBoxId) {
            const updated = this.packedProducts().map(p =>
              p.unitId === unitId && p.productCode === productCode
                ? { ...p, boxId: responseBoxId, productStatus: 'PK' }
                : p
            );
            this.packedProducts.set(updated);
          }
          if (consigneeIdVal) {
            const hasNewOrder = !!(data?.orderNo && !this.form.get('orderId')?.value);
            const hasNewBox = !!(responseBoxId && !this.currentBoxId());

            if (hasNewOrder) {
              this.suppressTableRefresh.set(true);
              if (hasNewBox) {
                this.pendingAutoSelectBoxId.set(responseBoxId);
              }
              const consignee = this.consignees().find(c => c.consigneeId === consigneeIdVal);
              if (consignee) {
                this.loadOrdersAndSelect(consigneeIdVal, consignee.customerId ?? '', data!.orderNo);
              }
            } else if (productTypeVal) {
              if (hasNewBox) {
                this.loadBoxes(consigneeIdVal, productTypeVal, responseBoxId);
              } else if (responseBoxId) {
                this.loadBoxContents(responseBoxId);
              }
            }
          }
        } else {
          this.snackbarService.showError(response.message ?? 'Failed to pack product');
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.snackbarService.showError(err?.error?.message ?? 'Failed to pack product');
      },
    });
  }

  onViewBoxContents(): void {
    const boxId = this.currentBoxId();
    if (!boxId) return;
    this.boxContentsPanelOpen.set(true);
  }

  onBoxContentsPanelClosed(): void {
    this.boxContentsPanelOpen.set(false);
  }

  onCloseBox(): void {
    const boxId = this.currentBoxId();
    if (!boxId) return;

    const dialogRef = this.dialog.open(PackodBoxDialogComponent, {
      width: '450px',
      data: { title: 'Close Box', boxId },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.confirmed && result?.allProperlyPacked) {
        this.performCloseBox(boxId);
      }
    });
  }

  onCreateNewBox(): void {
    const dialogRef = this.dialog.open(PackodBoxDialogComponent, {
      width: '450px',
      data: { title: 'Create New Box', boxId: this.currentBoxId() },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result?.confirmed) return;

      if (result.closeCurrent && result.allProperlyPacked && this.currentBoxId()) {
        this.performCloseBox(this.currentBoxId(), true);
      } else {
        this.resetForNewBox();
      }
    });
  }

  private performCloseBox(boxId: string, createNewAfter = false): void {
    this.loading.set(true);
    this.packodService.closeBox(boxId, { allProperlyPacked: true, qcFlag: 'Y' })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.snackbarService.showSuccess('Box has been closed successfully.');
            this.resetForNewBox();
            const consigneeId = this.form.get('consigneeId')?.value!;
            const productType = this.form.get('productType')?.value!;
            this.loadBoxes(consigneeId, productType);
            this.loadPackedProducts();
            if (createNewAfter) {
              this.snackbarService.showSuccess('Ready for new box.');
            }
          } else {
            this.snackbarService.showError(response.message ?? 'Failed to close box');
          }
          this.loading.set(false);
        },
        error: (err) => {
          this.loading.set(false);
          this.snackbarService.showError(err?.error?.message ?? 'Failed to close box');
        },
      });
  }

  private resetForNewBox(): void {
    this.form.patchValue({ boxId: null });
    this.boxContents.set([]);
    this.currentBoxId.set('');
    this.pickSlipId.set('-');
    this.pendingAutoSelectBoxId.set(null);
    this.suppressTableRefresh.set(false);
    this.clearEntry();
  }

  onPageChange(event: TablePageEvent): void {
    this.pageSize.set(event.pageSize);
    this.pageIndex.set(event.pageIndex);
    this.loadPackedProducts();
  }

  clearAll(): void {
    this.form.reset();
    this.form.get('orderId')?.disable();
    this.form.get('productType')?.disable();
    this.currentBoxId.set('');
    this.selectedConsigneeAddress.set('');
    this.selectedProductTypeDesc.set('');
    this.packedProducts.set([]);
    this.orders.set([]);
    this.productTypes.set([]);
    this.boxes.set([]);
    this.boxContents.set([]);
    this.pickSlipId.set('-');
    this.pendingAutoSelectBoxId.set(null);
    this.suppressTableRefresh.set(false);
    this.clearEntry();
    this.loadConsignees();
  }

  clearEntry(): void {
    this.unitIdField?.clear();
    this.productCodeField?.clear();
    this.aboRhField?.clear();
    this.currentUnitId.set(null);
    this.productCodeOptions.set([]);
    this.selectedProductCode.set('');
    this.aboRhOptions.set([]);
    this.selectedAboRh.set('');
    this.resolvedExpiryIso = '';
    this.expiryDisplay.set('');
    setTimeout(() => this.unitIdField?.focus());
  }

  getProductTypeDesc(): string {
    return this.selectedProductTypeDesc();
  }
}
