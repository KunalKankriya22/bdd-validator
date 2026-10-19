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
import { Observable, Subject, map, of, takeUntil } from 'rxjs';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TablePageEvent, TableRowActionEvent } from '@shared/interfaces/data-table.interface';
import { UnitIdFieldComponent, UnitIdPostValidateEvent } from '@shared/components/unit-id-field/unit-id-field.component';
import { DonorLibLabelScanService } from '@shared/services/donor-lib-label-scan.service';
import { convertUTCToTimezone } from '@shared/date/timezone.util';

import { ScanSelectFieldComponent, ScanSelectOption } from '@shared/components/scan-select-field';
import { SCAN_PATTERNS } from '@shared/utils/scan-pattern.util';

import { PackInvRejectsApiService } from './services/pack-inv-rejects-api.service';
import {
  ConsigneeLovDto,
  OrderLovDto,
  ProductTypeLovDto,
  BoxLovDto,
  DiscardProductDto,
  PackInvRejectsQueryDto,
} from './models/pack-inv-rejects.model';
import { PackodBoxDialogComponent } from '../../distribution-module/packing-functions/packod/components/box-dialog/box-dialog.component';
import { ViewBoxContentsDialogComponent } from './dialogs/view-box-contents-dialog';

@Component({
  selector: 'app-pack-inv-rejects-to-salvage',
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
    A11yModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    UnitIdFieldComponent,
    ScanSelectFieldComponent,
    ViewBoxContentsDialogComponent,
  ],
  templateUrl: './pack-inv-rejects-to-salvage.html',
  styleUrls: ['./pack-inv-rejects-to-salvage.scss'],
})
export class PackInvRejectsToSalvageComponent implements OnInit, OnDestroy {
  @ViewChild('unitIdField') unitIdField!: UnitIdFieldComponent;
  @ViewChild('productCodeField') productCodeField!: ScanSelectFieldComponent;
  @ViewChild('aboRhField') aboRhField!: ScanSelectFieldComponent;

  private readonly apiService = inject(PackInvRejectsApiService);
  private readonly labelScanService = inject(DonorLibLabelScanService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly headerService = inject(HeaderService);
  private readonly dialog = inject(MatDialog);
  private readonly destroy$ = new Subject<void>();

  readonly headerConfig = computed<PageHeaderConfig>(() => {
    const data = this.pageHeaderService.pageHeaderData();
    return {
      breadcrumbs: [
        { label: 'Home', link: '/home' },
        { label: data?.title ?? '' },
      ],
      title: data?.title,
      subtitle: data?.subtitle,
    };
  });

  // Signal-based state
  protected readonly consignees = signal<ConsigneeLovDto[]>([]);
  protected readonly orders = signal<OrderLovDto[]>([]);
  protected readonly productTypes = signal<ProductTypeLovDto[]>([]);
  protected readonly boxes = signal<BoxLovDto[]>([]);
  protected readonly packedProducts = signal<DiscardProductDto[]>([]);
  protected readonly loading = signal(false);
  protected readonly loadingDropdowns = signal(false);
  protected readonly totalRecords = signal(0);
  protected readonly pageSize = signal(25);
  protected readonly pageIndex = signal(0);
  protected readonly currentBoxId = signal('');
  protected readonly boxContentsPanelOpen = signal(false);
  protected readonly currentUnitId = signal<string | null>(null);
  protected readonly selectedConsigneeAddress = signal('');
  protected readonly selectedProductTypeDesc = signal('');
  protected readonly productCodeOptions = signal<ScanSelectOption[]>([]);
  protected readonly selectedProductCode = signal('');
  protected readonly aboRhOptions = signal<ScanSelectOption[]>([]);
  protected readonly selectedAboRh = signal('');
  protected readonly expirationDateValidating = signal(false);
  private readonly unitCodeScheme = signal<string>('I');
  protected readonly SCAN_PATTERNS = SCAN_PATTERNS;

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

  protected readonly hasPackedProducts = computed(() => this.packedProducts().length > 0);
  protected readonly canCloseBox = computed(() => !!this.currentBoxId() && this.hasPackedProducts());

  // Search controls for ngx-mat-select-search
  consigneeSearchCtrl = new FormControl('');
  private readonly consigneeSearchText = signal('');
  readonly filteredConsignees = computed(() => {
    const s = this.consigneeSearchText().toLowerCase();
    return !s ? this.consignees() : this.consignees().filter(c =>
      c.consigneeId?.toLowerCase().includes(s)
      || c.customerId?.toLowerCase().includes(s)
      || c.customerName?.toLowerCase().includes(s)
      || c.shortName?.toLowerCase().includes(s)
      || c.fullAddress?.toLowerCase().includes(s)
    );
  });

  productTypeSearchCtrl = new FormControl('');
  private readonly productTypeSearchText = signal('');
  readonly filteredProductTypes = computed(() => {
    const s = this.productTypeSearchText().toLowerCase();
    return !s ? this.productTypes() : this.productTypes().filter(pt =>
      pt.productType?.toLowerCase().includes(s)
      || pt.description?.toLowerCase().includes(s)
    );
  });

  orderSearchCtrl = new FormControl('');
  private readonly orderSearchText = signal('');
  readonly filteredOrders = computed(() => {
    const s = this.orderSearchText().toLowerCase();
    return !s ? this.orders() : this.orders().filter(o =>
      o.orderNo?.toLowerCase().includes(s)
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
    productType: new FormControl<string>({ value: '', disabled: true }),
    pickSlipId: new FormControl<string>(''),
    boxId: new FormControl<string | null>(null),
  });

  // Unit scan / entry form
  entryForm = new FormGroup({
    expirationDate: new FormControl<string>(''),
  });

  readonly tableConfig = computed<DataTableConfig<DiscardProductDto>>(() => ({
    columns: [
      { key: 'unitId', header: 'Unit ID' },
      { key: 'chkDigit', header: 'Chk', valueFormatter: (_v: any, row: DiscardProductDto) => row.chkDigit || '' },
      { key: 'productCode', header: 'Product Code' },
      { key: 'productDesc', header: 'Product Desc', valueFormatter: (_v: any, row: DiscardProductDto) => row.productDesc || '-' },
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
          const timezone = this.headerService.getCurrentChapterTimezone() || 'UTC';
          const d = convertUTCToTimezone(row.expDate, timezone);
          if (isNaN(d.getTime())) return row.expDate;
          const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
          const dd = String(d.getDate()).padStart(2, '0');
          const hh = String(d.getHours()).padStart(2, '0');
          const mm = String(d.getMinutes()).padStart(2, '0');
          return `${dd}-${months[d.getMonth()]}-${d.getFullYear()} ${hh}:${mm}`;
        },
      },
      { key: 'boxId', header: 'Box ID' },
    ],
    rowActions: [
      {
        icon: 'delete', action: 'delete', ariaLabel: 'Remove product', color: 'warn',
        visible: (row: DiscardProductDto) => !!row.boxId && row.boxId !== '-',
      },
    ],
    pagination: {
      pageSize: this.pageSize(),
      pageIndex: this.pageIndex(),
      totalRecords: this.totalRecords(),
      pageSizeOptions: [10, 25, 50, 100],
      showFirstLastButtons: true,
    },
    stickyHeader: true,
    emptyMessage: 'No products packed yet',
    emptySubMessage: 'Scan a unit ID to add products to the box',
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
      .subscribe(val => this.onConsigneeChange(val || ''));

    this.form.get('orderId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.onOrderChange());

    this.form.get('productType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.onProductTypeChange());

    this.form.get('boxId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(val => {
        this.currentBoxId.set(val || '');
        if (this.form.get('consigneeId')?.value) {
          this.pageIndex.set(0);
          this.loadPackedProducts();
        }
      });

    this.consigneeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.consigneeSearchText.set(v || ''));

    this.orderSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.orderSearchText.set(v || ''));

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
      .subscribe(() => this.onCancel());
  }

  private loadConsignees(): void {
    this.loadingDropdowns.set(true);
    this.apiService.getConsignees()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.consignees.set(data);
          this.loadingDropdowns.set(false);
        },
        error: (err) => {
          this.snackbarService.showError(this.extractErrorMessage(err, 'Failed to load consignees'));
          this.loadingDropdowns.set(false);
        },
      });
  }

  private onConsigneeChange(consigneeId: string): void {
    this.orders.set([]);
    this.productTypes.set([]);
    this.boxes.set([]);
    this.form.patchValue({ orderId: null, productType: '', boxId: null }, { emitEvent: false });
    this.form.get('orderId')?.disable();
    this.form.get('productType')?.disable();
    this.currentBoxId.set('');
    this.selectedProductTypeDesc.set('');

    if (!consigneeId) {
      this.selectedConsigneeAddress.set('');
      return;
    }

    const consignee = this.consignees().find(c => c.consigneeId === consigneeId);
    this.selectedConsigneeAddress.set(
      consignee?.fullAddress
      || [consignee?.shortName, consignee?.address, consignee?.city, consignee?.state].filter(Boolean).join(', ')
      || ''
    );
    if (consignee) {
      this.loadOrders(consignee.customerId, consigneeId);
    }
  }

  private loadOrders(customerId: string, consigneeId: string): void {
    this.loadingDropdowns.set(true);
    this.apiService.getOrders(customerId, consigneeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.orders.set(data);
          this.loadingDropdowns.set(false);
          if (data.length > 0) {
            this.form.get('orderId')?.enable();
            if (data.length === 1) this.form.get('orderId')?.setValue(data[0].orderNo);
          } else {
            this.form.get('orderId')?.disable();
          }
        },
        error: (err) => {
          this.snackbarService.showError(this.extractErrorMessage(err, 'Failed to load orders'));
          this.loadingDropdowns.set(false);
        },
      });
  }

  private onOrderChange(): void {
    const consigneeId = this.form.get('consigneeId')?.value;
    const orderId = this.form.get('orderId')?.value;
    this.productTypes.set([]);
    this.boxes.set([]);
    this.form.patchValue({ productType: '', boxId: null }, { emitEvent: false });
    this.form.get('productType')?.disable();

    if (!consigneeId || !orderId) return;

    const consignee = this.consignees().find(c => c.consigneeId === consigneeId);
    if (consignee) {
      this.loadProductTypes(consignee.customerId, consigneeId);
    }
  }

  private loadProductTypes(customerId: string, consigneeId: string): void {
    this.loadingDropdowns.set(true);
    this.apiService.getProductTypes(customerId, consigneeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.productTypes.set(data);
          this.loadingDropdowns.set(false);
          if (data.length > 0) this.form.get('productType')?.enable();
          else this.form.get('productType')?.disable();
        },
        error: (err) => {
          this.snackbarService.showError(this.extractErrorMessage(err, 'Failed to load product types'));
          this.loadingDropdowns.set(false);
        },
      });
  }

  private loadProductCodes(unitId: string, codeScheme: string): void {
    const consigneeId = this.form.get('consigneeId')?.value;
    const consignee = this.consignees().find(c => c.consigneeId === consigneeId);
    if (!consigneeId || !consignee) return;

    this.apiService.getProductCodes(unitId, consignee.customerId, consigneeId, codeScheme)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.productCodeOptions.set(
            data.map(pc => ({ code: pc.productCode, description: pc.shortName ?? '' })),
          );
          this.productCodeField?.focus();
        },
        error: (err) => {
          this.snackbarService.showError(this.extractErrorMessage(err, 'Failed to load product codes'));
        },
      });
  }

  private onProductTypeChange(): void {
    const consigneeId = this.form.get('consigneeId')?.value;
    const productType = this.form.get('productType')?.value;

    const desc = this.productTypes().find(p => p.productType === productType)?.description ?? '';
    this.selectedProductTypeDesc.set(desc);

    if (consigneeId) {
      this.loadBoxes(consigneeId, productType || undefined);
      this.pageIndex.set(0);
      this.loadPackedProducts();
    }
  }

  private loadBoxes(consigneeId: string, productType?: string): void {
    this.loadingDropdowns.set(true);
    this.apiService.getBoxes(consigneeId, productType)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.boxes.set(data);
          this.loadingDropdowns.set(false);
          if (data.length === 1) {
            this.currentBoxId.set(data[0].boxId);
            this.form.get('boxId')?.setValue(data[0].boxId, { emitEvent: false });
          }
        },
        error: () => {
          this.boxes.set([]);
          this.loadingDropdowns.set(false);
        },
      });
  }

  private loadPackedProducts(): void {
    const consigneeId = this.form.get('consigneeId')?.value;
    const productType = this.form.get('productType')?.value;
    const boxId = this.form.get('boxId')?.value;

    if (!consigneeId) {
      this.packedProducts.set([]);
      return;
    }

    const queryDto: PackInvRejectsQueryDto = {
      consigneeId,
      orderId: this.form.get('orderId')?.value || null,
      productType: productType || 'All',
      boxId: boxId || null,
      productStatus: 'PK',
      sortColumn: 'UnitId',
      sortOrder: 'ASC',
    };

    this.loading.set(true);
    this.apiService.queryDiscardProducts(this.pageSize(), this.pageIndex() * this.pageSize(), queryDto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.packedProducts.set(response.data);
          this.totalRecords.set(response.totalCount);
          this.loading.set(false);
        },
        error: (err) => {
          this.snackbarService.showError(this.extractErrorMessage(err, 'Failed to load packed products'));
          this.loading.set(false);
        },
      });
  }

  private loadBoxesAndSelect(consigneeId: string, productType: string, selectBoxId: string): void {
    this.loadingDropdowns.set(true);
    this.apiService.getBoxes(consigneeId, productType)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.boxes.set(data);
          this.loadingDropdowns.set(false);
          this.currentBoxId.set(selectBoxId);
          this.form.get('boxId')?.setValue(selectBoxId, { emitEvent: false });
        },
        error: () => {
          this.boxes.set([]);
          this.loadingDropdowns.set(false);
        },
      });
  }

  private loadOrdersAndSelect(customerId: string, consigneeId: string, selectOrderId: string, previousOrders: OrderLovDto[] = []): void {
    this.loadingDropdowns.set(true);
    this.apiService.getOrders(customerId, consigneeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.orders.set(data);
          this.loadingDropdowns.set(false);
          if (data.length > 0) this.form.get('orderId')?.enable({ emitEvent: false });
          const newOrder = data.find(o => !previousOrders.some(p => p.orderNo === o.orderNo));
          const orderToSet = selectOrderId || newOrder?.orderNo || '';
          if (orderToSet) {
            this.form.get('orderId')?.setValue(orderToSet, { emitEvent: false });
          }
        },
        error: (err) => {
          this.snackbarService.showError(this.extractErrorMessage(err, 'Failed to load orders'));
          this.loadingDropdowns.set(false);
        },
      });
  }

  onPostValidate(event: UnitIdPostValidateEvent): void {
    const unitId = event.data.parsedUnitId;
    if (!unitId) {
      event.reject('Invalid unit ID');
      return;
    }

    this.apiService.validateUnit(unitId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.isValid) {
            this.currentUnitId.set(unitId);
            this.unitCodeScheme.set(event.data.codeScheme ?? 'I');
            event.confirm();
            this.loadProductCodes(unitId, this.unitCodeScheme());
          } else {
            event.reject(response.errorMessage || 'Unit is not eligible for salvage packing');
          }
        },
        error: (err) => {
          event.reject(this.extractErrorMessage(err, 'Unit validation failed'));
        },
      });
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
      this.loadBloodTypes(this.currentUnitId()!, option.code, this.unitCodeScheme());
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
      this.tryAutoSave();
    }
  }

  onAboRhCleared(): void {
    this.selectedAboRh.set('');
  }

  onExpirationDateBlur(): void {
    const value = this.entryForm.get('expirationDate')?.value?.trim();
    if (!value) return;

    this.expirationDateValidating.set(true);
    this.labelScanService.validateExpiryScan(value, this.unitCodeScheme())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.expirationDateValidating.set(false);
          if (res.success && res.item) {
            const formatted = this.formatExpiryDisplay(res.item.expiryDate);
            this.entryForm.patchValue({ expirationDate: formatted }, { emitEvent: false });
          } else {
            this.snackbarService.showError(res.errorResponse?.error || 'Invalid expiry date');
            this.entryForm.patchValue({ expirationDate: '' }, { emitEvent: false });
          }
        },
        error: (err) => {
          this.expirationDateValidating.set(false);
          this.snackbarService.showError(this.extractErrorMessage(err, 'Invalid expiry date'));
          this.entryForm.patchValue({ expirationDate: '' }, { emitEvent: false });
        },
      });
  }

  private formatExpiryDisplay(value: string | null): string {
    if (!value) return '';
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
    const day = String(d.getDate()).padStart(2, '0');
    const hours = d.getHours();
    const minutes = d.getMinutes();
    if (hours === 0 && minutes === 0) {
      return `${day}-${months[d.getMonth()]}-${d.getFullYear()}`;
    }
    const hh = String(hours).padStart(2, '0');
    const mm = String(minutes).padStart(2, '0');
    return `${day}-${months[d.getMonth()]}-${d.getFullYear()} ${hh}:${mm}`;
  }

  private loadBloodTypes(unitId: string, productCode: string, codeScheme: string): void {
    this.apiService.getBloodTypes(unitId, productCode, codeScheme)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.aboRhOptions.set(
            data.map(bt => ({ code: bt.aboDesc, description: bt.aboDesc })),
          );
          this.aboRhField?.focus();
        },
        error: (err) => {
          this.snackbarService.showError(this.extractErrorMessage(err, 'Failed to load blood types'));
        },
      });
  }

  private tryAutoSave(): void {
    if (this.loading()) return;

    const unitId = this.currentUnitId();
    const productCode = this.selectedProductCode();
    const aboRh = this.selectedAboRh();
    const consigneeId = this.form.get('consigneeId')?.value;

    if (!unitId || !productCode || !aboRh || !consigneeId) return;

    this.onSave();
  }

  onSave(): void {
    if (!this.currentUnitId() || !this.form.get('consigneeId')?.value) return;
    if (this.loading()) return;

    const boxId = this.form.get('boxId')?.value || '';

    if (!boxId) {
      this.autoCreateBoxThenPack();
      return;
    }

    this.packProduct(boxId);
  }

  private autoCreateBoxThenPack(): void {
    const consigneeId = this.form.get('consigneeId')?.value!;

    this.loading.set(true);
    this.apiService.createNewBox({
      currentBoxId: null,
      closeCurrentBox: false,
      allProductsProperlyPacked: false,
      consigneeId,
    }).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const newBoxId = response.boxId;
          this.currentBoxId.set(newBoxId);
          this.form.patchValue({ boxId: newBoxId }, { emitEvent: false });
          this.snackbarService.showSuccess(`Box ${newBoxId} created`);

          const productType = this.form.get('productType')?.value;
          if (consigneeId && productType) {
            this.loadBoxesAndSelect(consigneeId, productType, newBoxId);
          }

          this.loading.set(false);
          this.packProduct(newBoxId);
        },
        error: (err) => {
          this.snackbarService.showError(this.extractErrorMessage(err, 'Failed to create box'));
          this.loading.set(false);
        },
      });
  }

  private packProduct(boxId: string): void {
    const unitId = this.currentUnitId()!;
    const productCode = this.selectedProductCode();
    const aboRh = this.selectedAboRh();
    const expDate = this.entryForm.get('expirationDate')?.value || '';
    const consigneeId = this.form.get('consigneeId')?.value!;
    const productType = this.form.get('productType')?.value || '';
    const orderId = this.form.getRawValue().orderId || '';
    const consignee = this.consignees().find(c => c.consigneeId === consigneeId);
    const previousOrders = this.orders();

    this.loading.set(true);
    this.apiService.packProducts({
      boxId,
      productKeys: [{ unitId, productCode, aliquot: aboRh, expDate }],
    }).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.snackbarService.showSuccess('Product packed successfully');
          const responseBoxId = response?.boxId ?? boxId;
          this.packedProducts.set(
            this.packedProducts().map(p =>
              p.unitId === unitId && p.productCode === productCode
                ? { ...p, boxId: responseBoxId, expDate: expDate || p.expDate }
                : p
            )
          );
          this.clearEntry();
          this.loadBoxesAndSelect(consigneeId, productType, responseBoxId);
          if (consignee) {
            this.loadOrdersAndSelect(consignee.customerId, consigneeId, orderId, previousOrders);
          }
          this.loading.set(false);
          setTimeout(() => this.unitIdField?.focus());
        },
        error: (err) => {
          this.snackbarService.showError(this.extractErrorMessage(err, 'Failed to pack product'));
          this.loading.set(false);
        },
      });
  }

  onViewBoxContents(): void {
    if (!this.currentBoxId()) return;
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
        this.loading.set(true);
        this.apiService.closeBox(boxId, result.allProperlyPacked)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.snackbarService.showSuccess('Box closed successfully');
              this.form.patchValue({ boxId: null }, { emitEvent: false });
              this.currentBoxId.set('');
              const consigneeId = this.form.get('consigneeId')?.value!;
              const productType = this.form.get('productType')?.value!;
              this.loadBoxes(consigneeId, productType);
              this.loadPackedProducts();
              this.loading.set(false);
            },
            error: (err) => {
              this.snackbarService.showError(this.extractErrorMessage(err, 'Failed to close box'));
              this.loading.set(false);
            },
          });
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

      const consigneeId = this.form.get('consigneeId')?.value!;
      const productType = this.form.get('productType')?.value!;

      if (result.closeCurrent && result.allProperlyPacked && this.currentBoxId()) {
        this.loading.set(true);
        this.apiService.closeBox(this.currentBoxId())
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.snackbarService.showSuccess('Box has been closed successfully.');
              this.form.patchValue({ boxId: null }, { emitEvent: false });
              this.currentBoxId.set('');
              this.loadBoxes(consigneeId, productType);
              this.loadPackedProducts();
              this.loading.set(false);
            },
            error: (err) => {
              this.snackbarService.showError(this.extractErrorMessage(err, 'Failed to close box'));
              this.loading.set(false);
            },
          });
      } else {
        this.form.patchValue({ boxId: null }, { emitEvent: false });
        this.currentBoxId.set('');
        this.loadBoxes(consigneeId, productType);
      }
    });
  }

  onPageChange(event: TablePageEvent): void {
    this.pageSize.set(event.pageSize);
    this.pageIndex.set(event.pageIndex);
    this.loadPackedProducts();
  }

  onPackedProductAction(event: TableRowActionEvent<DiscardProductDto>): void {
    if (event.action !== 'delete') return;

    const row = event.row;

    let expDate = row.expDate ?? '';
    if (expDate) {
      const timezone = this.headerService.getCurrentChapterTimezone() || 'UTC';
      const d = convertUTCToTimezone(expDate, timezone);
      if (!isNaN(d.getTime())) {
        const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
        const dd = String(d.getDate()).padStart(2, '0');
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        expDate = `${dd}-${months[d.getMonth()]}-${d.getFullYear()} ${hh}:${mm}`;
      }
    }

    this.loading.set(true);
    this.apiService.unpackProduct({
      unitId: row.unitId,
      productCode: row.productCode,
      aliquot: row.aliquot,
      expDate,
    }).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackbarService.showSuccess('Product removed successfully');
          this.loadPackedProducts();
          this.loading.set(false);
        },
        error: (err) => {
          this.snackbarService.showError(this.extractErrorMessage(err, 'Failed to remove product'));
          this.loading.set(false);
        },
      });
  }

  clearEntry(): void {
    this.entryForm.reset();
    this.unitIdField?.clear();
    this.productCodeField?.clear();
    this.aboRhField?.clear();
    this.selectedProductCode.set('');
    this.productCodeOptions.set([]);
    this.selectedAboRh.set('');
    this.aboRhOptions.set([]);
    this.currentUnitId.set(null);
  }

  onCancel(): void {
    this.form.reset();
    this.form.get('orderId')?.disable();
    this.form.get('productType')?.disable();
    this.currentBoxId.set('');
    this.selectedConsigneeAddress.set('');
    this.selectedProductTypeDesc.set('');
    this.entryForm.reset();
    this.unitIdField?.clear();
    this.productCodeField?.clear();
    this.aboRhField?.clear();
    this.selectedProductCode.set('');
    this.productCodeOptions.set([]);
    this.selectedAboRh.set('');
    this.aboRhOptions.set([]);
    this.currentUnitId.set(null);
    this.packedProducts.set([]);
    this.totalRecords.set(0);
    this.pageIndex.set(0);
    this.orders.set([]);
    this.productTypes.set([]);
    this.boxes.set([]);
    this.loadConsignees();
  }

  private extractErrorMessage(err: any, fallback: string): string {
    return err?.error?.errorResponse?.error
      || err?.error?.message
      || err?.message
      || fallback;
  }

  getProductTypeDesc(): string {
    return this.selectedProductTypeDesc();
  }

  get f() { return this.entryForm.controls; }
}
