import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  inject,
  signal,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, map, startWith, takeUntil } from 'rxjs/operators';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DatePipe } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TablePageEvent, TableRowActionEvent } from '@shared/interfaces/data-table.interface';
import { SpecialOrderAllocationService } from './services/special-order-allocation.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { MatchingProductsStateService } from './services/matching-products-state.service';
import { ROUTE_REGISTRY } from '@core/constants/route-registry';
import { RouteKey } from '@core/constants/route-keys';
import {
  OrderTypeItem,
  OrderItem,
  OrderItemTableRow,
  OrderItemDto,
  OrderLookupDto,
  OrderHeaderDto,
  MatchingProductsDialogData
} from './models/special-order-allocation.model';

import { LoadingSpinnerComponent } from '@shared/components/loading-spinner.component';
import { HeaderService } from '@shared/services/header.service';
import { UnitsAllocatedDialog } from './dialogs/units-allocated-dialog/units-allocated-dialog';
import { ViewStockDialog } from './dialogs/view-stock-dialog/view-stock-dialog';

@Component({
  selector: 'app-special-order-allocation',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    DataTable,
    DatePipe,
    NgxMatSelectSearchModule,
    LoadingSpinnerComponent,
    PageHeaderWithBreadcrumb
  ],
  templateUrl: './special-order-allocation.html',
  styleUrl: './special-order-allocation.scss'
})
export class SpecialOrderAllocation implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `special-order-allocation-${SpecialOrderAllocation.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly service = inject(SpecialOrderAllocationService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly dialog = inject(MatDialog);
  private readonly matchingProductsStateService = inject(MatchingProductsStateService);
  private readonly headerService = inject(HeaderService);

  private destroy$ = new Subject<void>();

  protected readonly orderTypes = signal<OrderTypeItem[]>([]);
  protected readonly orders = signal<OrderItem[]>([]);
  protected readonly currentPickSlipId = signal<string | null>(null);
  protected readonly orderItems = signal<OrderItemTableRow[]>([]);
  protected readonly selectedOrder = signal<OrderItem | null>(null);
  protected readonly loading = signal<boolean>(false);
  protected readonly hasRetrieved = signal<boolean>(false);
  protected readonly loadingOrderItems = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);
  protected readonly totalRecords = signal<number>(0);

  protected readonly pageSize = signal<number>(25);
  protected readonly pageIndex = signal<number>(0);

  protected readonly hasOrderItems = computed(() => this.orderItems().length > 0);
  protected readonly canRetrieve = signal<boolean>(false);

  typeSearchCtrl = new FormControl<string>('');

  @ViewChild('orderInput') orderInputRef!: ElementRef<HTMLInputElement>;
  @ViewChild(MatAutocompleteTrigger) orderAutoTrigger!: MatAutocompleteTrigger;

  protected readonly filteredOrderTypes = signal<OrderTypeItem[]>([]);
  protected readonly filteredOrders = signal<OrderItem[]>([]);

  searchForm!: FormGroup;

  pageHeaderConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: 'Special Order Allocation', link: '' }
    ],
    title: '',
    subtitle: ''
  };

  tableConfig: DataTableConfig<OrderItemTableRow> = {
    columns: [
      { key: 'itemNo', header: 'Number' },
      { key: 'productCode', header: 'Product' },
      { key: 'aboRh', header: 'ABHORh' },
      { key: 'substitutionFlag', header: 'Substitution Flag' },
      { key: 'orderedQuantity', header: 'O - Quantity' },
      { key: 'allocatedQuantity', header: 'A - Quantity', valueFormatter: (_val, row) => row.allocatedQuantityDisplay },
      { key: 'groupCode', header: 'Group' },
      { key: 'attributeCode', header: 'Attributes' },
      { key: 'antigenCodes', header: 'Antigens' }
    ],
    rowActions: [
      { icon: 'arrow_forward', action: 'allocate', ariaLabel: 'Allocate units for item {{itemNo}}' }
    ],
    pagination: {
      pageSize: 25,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50, 100],
      showFirstLastButtons: true
    },
    showPagination: true,
    stickyHeader: true,
    emptyMessage: 'No order items found'
  };

  ngOnInit(): void {
    this.initForm();
    this.loadOrderTypes();
    this.setupOrderTypeListener();
    this.setupOrderInputListener();
    this.setupSearchFilters();
    this.subscribeToChapterChanges();
    this.handleReturnFromMatchingProducts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.searchForm = this.fb.group({
      type: ['', Validators.required],
      order: ['', Validators.required]
    });

    this.searchForm.statusChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const typeValid = this.searchForm.get('type')?.valid ?? false;
        const orderValid = this.searchForm.get('order')?.valid ?? false;
        this.canRetrieve.set(typeValid && orderValid);
      });
  }

  private setupSearchFilters(): void {
    this.typeSearchCtrl.valueChanges.pipe(
      startWith(''),
      map(search => this.filterOrderTypes(search)),
      takeUntil(this.destroy$)
    ).subscribe(filtered => this.filteredOrderTypes.set(filtered));
  }

  private filterOrderTypes(search: string | null): OrderTypeItem[] {
    const all = this.orderTypes();
    if (!search) return all;
    const upper = search.toUpperCase();
    return all.filter(t =>
      t.code.toUpperCase().includes(upper) ||
      t.description.toUpperCase().includes(upper)
    );
  }

  private filterOrders(search: string | null): OrderItem[] {
    const all = this.orders();
    if (!search) return all;
    const upper = search.toUpperCase();
    return all.filter(o =>
      o.orderNo.toUpperCase().includes(upper) ||
      o.customerName.toUpperCase().includes(upper)
    );
  }


  private loadOrderTypes(): void {
    const types: OrderTypeItem[] = [
      { code: 'SP', description: 'Special Order' },
      { code: 'RE', description: 'Directed Order' },
      { code: 'EX', description: 'Exchange Order' }
    ];
    this.orderTypes.set(types);
    this.filteredOrderTypes.set(types);
  }

  private setupOrderTypeListener(): void {
    this.searchForm.get('type')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(typeCode => {
        if (typeCode) {
          this.loadOrders(typeCode);
          this.searchForm.patchValue({ order: '' });
          this.selectedOrder.set(null);
          this.currentPickSlipId.set(null);
          this.orderItems.set([]);
        }
      });
  }

  private setupOrderInputListener(): void {
    this.searchForm.get('order')?.valueChanges
      .pipe(
        debounceTime(300),
        takeUntil(this.destroy$)
      )
      .subscribe(val => {
        const trimmed = (val || '').trim();
        if (!trimmed) {
          this.selectedOrder.set(null);
          this.currentPickSlipId.set(null);
          this.orderItems.set([]);
          this.hasRetrieved.set(false);
          return;
        }

        const exactMatch = this.orders().find(o => o.orderNo.toUpperCase() === trimmed.toUpperCase());
        if (exactMatch && this.selectedOrder()?.orderNo !== exactMatch.orderNo) {
          this.selectOrder(exactMatch.orderNo);
        } else if (!exactMatch) {
          this.selectedOrder.set(null);
          this.currentPickSlipId.set(null);
          this.orderItems.set([]);
          this.hasRetrieved.set(false);
        }
      });
  }

  private loadOrders(typeCode: string): void {
    this.loading.set(true);

    this.service.getOrdersByType(typeCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (lookups: OrderLookupDto[]) => {
          const items: OrderItem[] = lookups.map(l => ({
            orderNo: l.orderNo,
            orderType: typeCode,
            customerName: l.customerName || '',
            status: l.orderStatusDesc || l.orderStatus || '',
            priority: l.priority || '',
            estimateArrivalTime: l.orderDate || null,
            customerId: l.customerId,
            consigneeId: null
          }));
          this.orders.set(items);
          this.filteredOrders.set(items);
          this.loading.set(false);
        },
        error: () => {
          this.orders.set([]);
          this.filteredOrders.set([]);
          this.loading.set(false);
        }
      });
  }

  onOrderSelected(event: any): void {
    const orderNo = event.option.value;
    this.selectOrder(orderNo);
  }

  onOrderInput(): void {
    const val = (this.searchForm.get('order')?.value || '').trim();
    this.filteredOrders.set(this.filterOrders(val));
  }

  toggleOrderPanel(): void {
    if (this.orderAutoTrigger) {
      if (this.orderAutoTrigger.panelOpen) {
        this.orderAutoTrigger.closePanel();
      } else {
        this.filteredOrders.set(this.orders());
        this.orderAutoTrigger.openPanel();
      }
    }
  }

  private selectOrder(orderNo: string): void {
    const order = this.orders().find(o => o.orderNo === orderNo);
    if (order) {
      this.selectedOrder.set(order);
      this.currentPickSlipId.set(null);
      this.orderItems.set([]);

      this.service.getOrderHeader(orderNo)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (header: OrderHeaderDto | null) => {
            if (header) {
              this.selectedOrder.set({
                orderNo: header.orderNo,
                orderType: header.orderType || order.orderType,
                customerName: header.customerName || '',
                status: header.orderStatusDesc || header.orderStatus || '',
                priority: header.priority || '',
                estimateArrivalTime: header.estArrivalTime || null,
                customerId: header.customerId || null,
                consigneeId: header.consigneeId || null
              });
            }
          }
        });
    }
  }

  onRetrieve(): void {
    const orderNo = (this.searchForm.get('order')?.value || '').trim();
    if (!orderNo) return;

    const validOrder = this.orders().find(o => o.orderNo.toUpperCase() === orderNo.toUpperCase());
    if (!validOrder || !this.selectedOrder() || this.selectedOrder()?.orderNo.toUpperCase() !== orderNo.toUpperCase()) {
      this.snackbarService.showError('Invalid order number.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.hasRetrieved.set(true);
    this.currentPickSlipId.set(null);

    this.service.getOrderItems(orderNo, this.pageSize(), 0)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            const items = this.mapOrderItemsToTableRows(response.data);
            this.orderItems.set(items);
            const total = response.total || response.data.length;
            this.totalRecords.set(total);
            this.pageIndex.set(0);
            this.tableConfig = {
              ...this.tableConfig,
              pagination: { ...this.tableConfig.pagination!, totalRecords: total, pageIndex: 0, pageSize: this.pageSize() }
            };
          }

          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err.message || 'Failed to load order data');
          this.loading.set(false);
        }
      });
  }

  private loadOrderItems(orderNo: string): void {
    this.loadingOrderItems.set(true);
    this.error.set(null);

    const take = this.pageSize();
    const skip = this.pageIndex() * this.pageSize();

    this.service.getOrderItems(orderNo, take, skip)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            const items = this.mapOrderItemsToTableRows(response.data);
            this.orderItems.set(items);
            const total = response.total || response.data.length;
            this.totalRecords.set(total);
            this.tableConfig = {
              ...this.tableConfig,
              pagination: { ...this.tableConfig.pagination!, totalRecords: total, pageIndex: this.pageIndex(), pageSize: this.pageSize() }
            };
          }
          this.loadingOrderItems.set(false);
        },
        error: (err) => {
          this.error.set(err.message || 'Failed to load order items');
          this.loadingOrderItems.set(false);
        }
      });
  }

  private mapOrderItemsToTableRows(items: OrderItemDto[]): OrderItemTableRow[] {
    return items.map(item => ({
      itemNo: item.itemNo,
      productCode: item.productCode || '',
      productDescription: item.productTypeDesc || item.productDescription || item.productCode || '',
      aboRh: this.formatAboRh(item.abo ?? null, item.rh ?? null),
      substitutionFlag: (item.subOk || item.substitutionFlag) === 'Y' ? 'Yes' : 'No',
      orderedQuantity: (item.requiredQty ?? 0) - (item.canceledQty ?? 0) - (item.systemCancelQty ?? 0),
      allocatedQuantity: item.quantityAllocated ?? 0,
      allocatedQuantityDisplay: (item.quantityAllocated ?? 0) > 0
        ? String(item.quantityAllocated)
        : (item.itemStatusDesc || item.itemStatus || 'Ordered'),
      groupCode: item.attribGroup || item.groupCode || '--',
      attributeCode: item.attribCode || item.attributeCode || '--',
      antigenCodes: this.formatAntigenCodes(item.antigenCodes ?? null),
      orderNo: item.orderNo,
      bloodType: item.bloodType ?? null,
      abo: item.abo ?? null,
      rh: item.rh ?? null,
      subOk: item.subOk ?? null,
      tier: item.tier ?? 0,
      unitPrice: item.unitPrice ?? 0
    }));
  }

  private formatAboRh(abo: string | null, rh: string | null): string {
    if (!abo && !rh) return '--';
    const aboStr = abo || '';
    const rhStr = rh || '';
    return `${aboStr} ${rhStr}`.trim() || '--';
  }

  private formatAntigenCodes(antigenCodes: string | null): string {
    if (!antigenCodes) return '--';
    return antigenCodes;
  }

  onPageChange(event: TablePageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);

    const orderNo = this.searchForm.get('order')?.value;

    if (orderNo) {
      this.loadOrderItems(orderNo);
    }
  }

  onTableRowAction(event: TableRowActionEvent<OrderItemTableRow>): void {
    if (event.action === 'allocate') {
      this.onRowAction(event.row);
    }
  }

  onClearAll(): void {
    this.searchForm.reset();
    this.selectedOrder.set(null);
    this.orders.set([]);
    this.filteredOrders.set([]);
    this.currentPickSlipId.set(null);
    this.orderItems.set([]);
    this.error.set(null);
    this.hasRetrieved.set(false);
    this.pageIndex.set(0);
    this.pageSize.set(10);
    this.typeSearchCtrl.setValue('');
    this.tableConfig = {
      ...this.tableConfig,
      pagination: { ...this.tableConfig.pagination!, totalRecords: 0, pageIndex: 0, pageSize: 10 }
    };
    this.loadOrderTypes();
  }

  onRowAction(row: OrderItemTableRow): void {
    const pickSlipId = this.currentPickSlipId();

    const order = this.selectedOrder();
    const antigenList = this.parseAntigenCodes(row.antigenCodes);
    const attrCount = (row.groupCode && row.groupCode !== '--') ? 1 : 0;

    const inputData: MatchingProductsDialogData = {
      itemNo: row.itemNo,
      productCode: row.productCode,
      productDescription: row.productDescription,
      aboRh: row.aboRh,
      need: row.orderedQuantity,
      found: 0,
      allocat: row.allocatedQuantity,
      orderNo: row.orderNo,
      pickSlipId: pickSlipId,
      antigenCodes: antigenList,
      matchingProducts: [],
      abo: row.abo,
      rh: row.rh,
      bloodType: row.bloodType,
      subProduct: row.subOk === 'Y',
      subAbo: row.subOk === 'Y',
      source: false,
      productType: row.productCode,
      orderType: order?.orderType || 'SP',
      customerId: order?.customerId || null,
      tier: row.tier,
      unitPrice: row.unitPrice,
      attCount: attrCount,
      antCount: antigenList.length
    };

    this.matchingProductsStateService.saveState(inputData, {
      typeCode: this.searchForm.get('type')?.value || '',
      orderNo: this.searchForm.get('order')?.value || '',
      pickSlipId: pickSlipId || null,
      selectedOrder: this.selectedOrder(),
      orders: this.orders(),
      orderTypes: this.orderTypes(),
      orderItems: this.orderItems(),
      totalRecords: this.totalRecords(),
      pageSize: this.pageSize(),
      pageIndex: this.pageIndex(),
      hasRetrieved: this.hasRetrieved()
    });

    this.router.navigate([ROUTE_REGISTRY[RouteKey.MatchingProductsFound].path]);
  }

  private handleReturnFromMatchingProducts(): void {
    const result = this.matchingProductsStateService.consumeResult();
    const parentState = this.matchingProductsStateService.getParentFormState();

    if (parentState) {
      this.orderTypes.set(parentState.orderTypes);
      this.filteredOrderTypes.set(parentState.orderTypes);
      this.orders.set(parentState.orders);
      this.filteredOrders.set(parentState.orders);
      this.currentPickSlipId.set(parentState.pickSlipId || null);
      this.selectedOrder.set(parentState.selectedOrder);
      this.hasRetrieved.set(parentState.hasRetrieved);
      this.pageSize.set(parentState.pageSize);
      this.pageIndex.set(parentState.pageIndex);

      this.searchForm.patchValue({
        type: parentState.typeCode,
        order: parentState.orderNo
      }, { emitEvent: false });

      this.tableConfig = {
        ...this.tableConfig,
        pagination: { ...this.tableConfig.pagination!, totalRecords: parentState.totalRecords, pageIndex: parentState.pageIndex, pageSize: parentState.pageSize }
      };

      if (result && (result.allocated || result.backOrdered)) {
        this.loadOrderItems(parentState.orderNo);
        if (result.allocated && result.pickSlipId) {
          this.currentPickSlipId.set(result.pickSlipId);
        }
      } else {
        this.orderItems.set(parentState.orderItems);
        this.totalRecords.set(parentState.totalRecords);
      }

      this.matchingProductsStateService.clear();
    }
  }

  private parseAntigenCodes(antigenCodes: string): string[] {
    if (!antigenCodes || antigenCodes === '--') return [];
    return antigenCodes.split(',').map(code => code.trim());
  }

  onAllocatedUnitsForItem(): void {
    const orderNo = this.searchForm.get('order')?.value;
    if (!orderNo || this.orderItems().length === 0) return;

    const firstItem = this.orderItems()[0];

    this.dialog.open(UnitsAllocatedDialog, {
      width: '1000px',
      maxWidth: '100vw',
      height: 'calc(100vh - 64px)',
      maxHeight: 'calc(100vh - 64px)',
      position: { right: '0', top: '64px' },
      hasBackdrop: false,
      data: {
        orderNo: orderNo,
        itemNo: firstItem.itemNo
      }
    });
  }

  onViewStock(): void {
    if (this.orderItems().length === 0) return;

    const firstItem = this.orderItems()[0];

    this.dialog.open(ViewStockDialog, {
      width: '1000px',
      maxWidth: '100vw',
      height: 'calc(100vh - 64px)',
      maxHeight: 'calc(100vh - 64px)',
      position: { right: '0', top: '64px' },
      hasBackdrop: false,
      data: {
        productType: firstItem.productCode,
        bloodType: firstItem.bloodType
      }
    });
  }

  get f() {
    return this.searchForm.controls;
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.onClearAll();
        this.loadOrderTypes();
      });
  }
}
