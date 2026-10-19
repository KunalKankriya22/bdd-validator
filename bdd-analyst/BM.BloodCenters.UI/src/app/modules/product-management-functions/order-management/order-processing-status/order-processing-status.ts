import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  TemplateRef,
  inject,
  signal,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import moment from 'moment';

import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { OverlayModule } from '@angular/cdk/overlay';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig } from '@shared/interfaces/data-table.interface';

import { OrderProcessingStatusService } from './services/order-processing-status.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';

import {
  OrderStatusDto,
  OrderProcessingStatusResponseDto,
  OrderStatusCodeDto,
  OrderFilters,
  OrderType,
  PAGINATION_DEFAULTS,
  STATUS_COLORS,
  OrderedAntigenItem,
  OrderedAttributeItem,
  ShippedProduct,
  ShippedAntigen,
  ShippedAttribute
} from './models/order-processing-status.model';

import { FilterPanelComponent } from './components/filter-panel/filter-panel';
import { OrderDetailComponent } from './components/order-detail/order-detail';

type PanelType = 'ordered-attr' | 'shipped-products' | 'shipped-attr' | null;

@Component({
  selector: 'app-order-processing-status',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    OverlayModule,
    PageHeaderWithBreadcrumb,
    FilterChips,
    SearchBar,
    DataTable,
    FilterPanelComponent,
    OrderDetailComponent
  ],
  templateUrl: './order-processing-status.html',
  styleUrl: './order-processing-status.scss'
})
export class OrderProcessingStatusComponent implements OnInit, AfterViewInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `order-processing-status-${OrderProcessingStatusComponent.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;

  @ViewChild('statusCellTpl', { static: true }) statusCellTpl!: TemplateRef<any>;

  private readonly orderService = inject(OrderProcessingStatusService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly headerService = inject(HeaderService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly destroy$ = new Subject<void>();

  protected readonly selectedTab = signal<number>(OrderType.STAT);
  protected readonly orderData = signal<OrderProcessingStatusResponseDto | null>(null);
  protected readonly statusCodes = signal<OrderStatusCodeDto[]>([]);
  protected readonly selectedOrder = signal<OrderStatusDto | null>(null);
  protected readonly loading = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);
  protected readonly filterOpen = signal<boolean>(false);
  protected readonly filters = signal<OrderFilters>({});
  protected readonly searchText = signal<string>('');

  protected readonly take = signal<number>(PAGINATION_DEFAULTS.TAKE);
  protected readonly skip = signal<number>(PAGINATION_DEFAULTS.SKIP);

  // Side panel state
  protected readonly activePanel = signal<PanelType>(null);
  protected readonly panelLoading = signal<boolean>(false);
  protected readonly orderedAntigens = signal<OrderedAntigenItem[]>([]);
  protected readonly orderedAttributes = signal<OrderedAttributeItem[]>([]);
  protected readonly shippedProducts = signal<ShippedProduct[]>([]);
  protected readonly shippedAntigens = signal<ShippedAntigen[]>([]);
  protected readonly shippedAttributesData = signal<ShippedAttribute[]>([]);
  private orderedAttrLoaded = false;
  private shippedDataLoaded = false;

  protected readonly searchConfig: SearchBarConfig = {
    placeholder: 'Search',
    minLength: 1,
    debounceTime: 300,
    ariaLabel: 'Search orders'
  };

  protected readonly statusDescriptionMap = computed<Record<string, string>>(() => {
    const codes = this.statusCodes();
    const map: Record<string, string> = {};
    codes.forEach(c => map[c.code] = c.codeDesc);
    return map;
  });

  protected orderListTableConfig = computed<DataTableConfig<OrderStatusDto>>(() => {
    return {
      columns: [
        { key: 'orderNo', header: 'Order Number' },
        { key: 'orderAge', header: 'Age', type: 'number' },
        { key: 'orderStatus', header: 'Status', cellTemplate: this.statusCellTpl }
      ],
      emptyMessage: 'No orders found.',
      showPagination: false,
      stickyHeader: true
    };
  });

  // Side panel table configs
  protected readonly orderedAntigensTableConfig: DataTableConfig = {
    columns: [
      { key: 'itemNo', header: 'Item' },
      { key: 'antigenId', header: 'Antigen ID' },
      { key: 'unitPrice', header: 'Unit Price', type: 'number' },
      { key: 'resultStatus', header: 'Result Status' }
    ],
    emptyMessage: 'No ordered antigens.',
    showPagination: false
  };

  protected readonly orderedAttributesTableConfig: DataTableConfig = {
    columns: [
      { key: 'itemNo', header: 'Item' },
      { key: 'attribGroup', header: 'Attribute Group' },
      { key: 'attribCode', header: 'Attribute Code' },
      { key: 'unitPrice', header: 'Unit Price', type: 'number' }
    ],
    emptyMessage: 'No ordered attributes.',
    showPagination: false
  };

  protected readonly shippedProductsTableConfig: DataTableConfig = {
    columns: [
      { key: 'unitId', header: 'Unit ID' },
      { key: 'collDate', header: 'Collection Date' },
      { key: 'prodCode', header: 'Product Code' },
      { key: 'abo', header: 'ABO' },
      { key: 'expDate', header: 'Expiration Date' },
      { key: 'boxId', header: 'Box ID' },
      { key: 'price', header: 'Price', type: 'number' }
    ],
    emptyMessage: 'No shipped products.',
    showPagination: false
  };

  protected readonly shippedAntigensTableConfig: DataTableConfig = {
    columns: [
      { key: 'unitId', header: 'Unit ID' },
      { key: 'prodCode', header: 'Product Code' },
      { key: 'testId', header: 'Test ID' },
      { key: 'price', header: 'Price', type: 'number' }
    ],
    emptyMessage: 'No product antigens.',
    showPagination: false
  };

  protected readonly shippedAttributesTableConfig: DataTableConfig = {
    columns: [
      { key: 'unitId', header: 'Unit ID' },
      { key: 'prodCode', header: 'Product Code' },
      { key: 'attributeCode', header: 'Attribute Code' },
      { key: 'attributeDesc', header: 'Description' },
      { key: 'price', header: 'Price', type: 'number' }
    ],
    emptyMessage: 'No product attributes.',
    showPagination: false
  };

  protected readonly currentOrders = computed(() => {
    const data = this.orderData();
    if (!data) return [];
    const tab = this.selectedTab();
    let orders: OrderStatusDto[] = [];
    switch (tab) {
      case OrderType.STAT: orders = data.statOrders; break;
      case OrderType.ASAP: orders = data.asapOrders; break;
      case OrderType.ROUTINE: orders = data.routineOrders; break;
      case OrderType.STANDING: orders = data.standingOrders; break;
    }
    const search = this.searchText().toLowerCase();
    if (search) {
      orders = orders.filter(order => order.orderNo.toLowerCase().includes(search));
    }
    return orders;
  });

  protected readonly currentCount = computed(() => {
    const data = this.orderData();
    if (!data) return 0;
    const tab = this.selectedTab();
    switch (tab) {
      case OrderType.STAT: return data.statCount;
      case OrderType.ASAP: return data.asapCount;
      case OrderType.ROUTINE: return data.routineCount;
      case OrderType.STANDING: return data.standingCount;
      default: return 0;
    }
  });

  protected readonly isEmpty = computed(() => this.currentOrders().length === 0);
  protected readonly isReady = computed(() => !this.loading() && !this.error());
  protected readonly hasData = computed(() => this.orderData() !== null);

  protected readonly tabLabels = ['STAT Order', 'ASAP Order', 'Routine Order', 'Standing Order'];

  protected readonly headerConfig = computed<PageHeaderConfig>(() => {
    const pageData = this.pageHeaderService.pageHeaderData();
    const hasSelection = !!this.selectedOrder();
    return {
      breadcrumbs: [
        { label: 'Home', link: '/home' },
        { label: pageData?.title || 'Order Processing Status', link: null }
      ],
      title: pageData?.title || 'Order Processing Status',
      subtitle: pageData?.subtitle || 'Track the real-time fulfilment status of active orders.',
      actions: [
        { label: 'ORDERED ATTRIBUTES/ANTIGENS', matButton: hasSelection ? 'raised' : 'stroked', color: 'primary', onClick: () => this.togglePanel('ordered-attr') },
        { label: 'SHIPPED PRODUCTS', matButton: hasSelection ? 'raised' : 'stroked', color: 'primary', onClick: () => this.togglePanel('shipped-products') },
        { label: 'SHIPPED ATTRIBUTES/ANTIGENS', matButton: hasSelection ? 'raised' : 'stroked', color: 'primary', onClick: () => this.togglePanel('shipped-attr') }
      ]
    };
  });

  protected readonly filterChips = computed<FilterChip[]>(() => {
    const f = this.filters();
    const chips: FilterChip[] = [];
    const codes = this.statusCodes();
    if (f.age !== undefined && f.age !== null) {
      chips.push({ key: 'age', label: `Age > ${f.age} Hrs.`, value: f.age });
    }
    if (f.orderStatus) {
      const desc = codes.find(c => c.code === f.orderStatus)?.codeDesc || f.orderStatus;
      chips.push({ key: 'orderStatus', label: `Order Status: ${desc}`, value: f.orderStatus });
    }
    if (f.fromDate) {
      chips.push({ key: 'fromDate', label: `From: ${moment(f.fromDate).format('DD-MMM-YYYY')}`, value: f.fromDate });
    }
    if (f.toDate) {
      chips.push({ key: 'toDate', label: `To: ${moment(f.toDate).format('DD-MMM-YYYY')}`, value: f.toDate });
    }
    return chips;
  });

  protected readonly OrderType = OrderType;
  protected readonly STATUS_COLORS = STATUS_COLORS;

  ngOnInit(): void {
    this.loadStatusCodes();
    this.loadOrders();
    this.subscribeToChapterChanges();
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadStatusCodes(): void {
    this.orderService.getOrderStatusCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (codes) => this.statusCodes.set(codes),
        error: (err) => console.error('Failed to load status codes:', err)
      });
  }

  private loadOrders(): void {
    this.loading.set(true);
    this.error.set(null);
    const currentFilters = this.filters();
    const query = {
      age: currentFilters.age,
      orderStatus: currentFilters.orderStatus,
      fromDate: currentFilters.fromDate ? moment(currentFilters.fromDate).format('YYYY-MM-DD') : undefined,
      toDate: currentFilters.toDate ? moment(currentFilters.toDate).format('YYYY-MM-DD') : undefined,
      take: this.take(),
      skip: this.skip()
    };

    this.orderService.getOrderProcessingStatus(query)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.orderData.set(data);
          this.loading.set(false);
          this.selectedOrder.set(null);
        },
        error: (err) => {
          const errorMsg = err.error?.message || 'Failed to load order processing status. Please try again.';
          this.error.set(errorMsg);
          this.loading.set(false);
          this.snackbarService.showError(errorMsg);
        }
      });
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.clearAll();
        this.loadOrders();
      });
  }

  protected onTabChange(index: number): void {
    this.selectedTab.set(index);
    this.selectedOrder.set(null);
  }

  protected onSearch(text: string): void {
    this.searchText.set(text);
  }

  protected onOrderRowClick(order: OrderStatusDto): void {
    this.selectedOrder.set(order);
    this.orderedAttrLoaded = false;
    this.shippedDataLoaded = false;
  }

  protected toggleFilter(): void {
    this.filterOpen.set(!this.filterOpen());
  }

  protected onApplyFilters(filters: OrderFilters): void {
    this.filters.set(filters);
    this.filterOpen.set(false);
    this.skip.set(0);
    this.loadOrders();
  }

  protected onClearFilters(): void {
    this.filters.set({});
    this.searchText.set('');
    this.filterOpen.set(false);
    this.skip.set(0);
    this.loadOrders();
  }

  protected onRemoveChip(key: string): void {
    const current = { ...this.filters() };
    delete (current as any)[key];
    this.filters.set(current);
    this.skip.set(0);
    this.loadOrders();
  }

  protected clearAll(): void {
    this.filters.set({});
    this.searchText.set('');
    this.selectedOrder.set(null);
    this.skip.set(0);
  }

  protected retry(): void {
    this.loadOrders();
  }

  protected getStatusColor(status: string): string {
    return STATUS_COLORS[status] || 'gray';
  }

  // Side panel methods
  protected togglePanel(panel: PanelType): void {
    const order = this.selectedOrder();
    if (!order) {
      this.snackbarService.showError('Please select an order first.');
      return;
    }

    if (this.activePanel() === panel) {
      this.closeSidePanel();
      return;
    }

    this.activePanel.set(panel);

    if (panel === 'ordered-attr' && !this.orderedAttrLoaded) {
      this.loadOrderedAttrData(order.orderNo);
    } else if ((panel === 'shipped-products' || panel === 'shipped-attr') && !this.shippedDataLoaded) {
      this.loadShippedData(order.orderNo);
    }
  }

  protected closeSidePanel(): void {
    this.activePanel.set(null);
  }

  private loadOrderedAttrData(orderNo: string): void {
    this.panelLoading.set(true);
    forkJoin({
      antigens: this.orderService.getOrderedAntigens(orderNo),
      attributes: this.orderService.getOrderedAttributes(orderNo)
    }).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.orderedAntigens.set(data.antigens);
          this.orderedAttributes.set(data.attributes);
          this.orderedAttrLoaded = true;
          this.panelLoading.set(false);
        },
        error: () => this.panelLoading.set(false)
      });
  }

  private loadShippedData(orderNo: string): void {
    this.panelLoading.set(true);
    this.orderService.getOrderCharges(orderNo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          if (data) {
            this.shippedProducts.set(data.products || []);
            this.shippedAntigens.set(data.antigens || []);
            this.shippedAttributesData.set(data.attributes || []);
          }
          this.shippedDataLoaded = true;
          this.panelLoading.set(false);
        },
        error: () => this.panelLoading.set(false)
      });
  }
}
