import { Component, OnInit, OnDestroy, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil, filter } from 'rxjs';
import { NavigationEnd, RouterOutlet } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { A11yModule } from '@angular/cdk/a11y';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig } from '@shared/interfaces/data-table.interface';
import { MenuService } from '@shared/services/menu.service';
import { HeaderService } from '@shared/services/header.service';
import { ROUTE_REGISTRY } from '../../../core/constants/route-registry';
import { RouteKey } from '../../../core/constants/route-keys';
import { ROUTES } from '../../../core/constants/route.constants';
import { OrderChargesApiService } from './services/order-charges-api.service';
import {
  OrderChargesSummary,
  OrderTypeDto,
  OrderListItemDto,
  ProductCharge
} from './models/order-charges.model';
import { AdditionalChargesPanel } from './additional-charges-modal/additional-charges-modal';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-order-charges-by-order-no',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    A11yModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    AdditionalChargesPanel,
    RouterOutlet
  ],
  templateUrl: './order-charges-by-order-no.html',
  styleUrls: ['./order-charges-by-order-no.scss']
})
export class OrderChargesByOrderNoComponent implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `order-charges-by-order-no-${OrderChargesByOrderNoComponent.nextId++}`;

  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(OrderChargesApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly menuService = inject(MenuService);
  private readonly headerService = inject(HeaderService);

  protected isChildRouteActive = false;

  protected readonly loading = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);
  protected readonly orderData = signal<OrderChargesSummary | null>(null);
  protected readonly orderTypes = signal<OrderTypeDto[]>([]);
  protected readonly orders = signal<OrderListItemDto[]>([]);
  protected readonly loadingOrderTypes = signal<boolean>(false);
  protected readonly loadingOrders = signal<boolean>(false);
  protected readonly sidePanelOpen = signal<boolean>(false);
  private panelTriggerElement: HTMLElement | null = null;

  protected readonly hasData = computed(() => this.orderData() !== null);
  protected readonly isEmpty = computed(() => !this.hasData() && !this.loading() && !this.error());
  protected readonly products = computed(() => this.orderData()?.products || []);
  protected readonly totals = computed(() => this.orderData()?.totals);

  protected readonly orderTypeSearchCtrl = new FormControl('');
  protected readonly orderNoSearchCtrl = new FormControl('');
  private readonly orderTypeSearchText = signal('');
  private readonly orderNoSearchText = signal('');

  protected readonly filteredOrderTypes = computed(() => {
    const search = this.orderTypeSearchText().toLowerCase();
    const types = this.orderTypes();
    if (!search) return types;
    return types.filter(t =>
      t.code.toLowerCase().includes(search) || (t.description?.toLowerCase().includes(search) ?? false)
    );
  });

  protected readonly filteredOrders = computed(() => {
    const search = this.orderNoSearchText().toLowerCase();
    const ordersList = this.orders();
    if (!search) return ordersList;
    return ordersList.filter(o =>
      o.orderNo.toLowerCase().includes(search) || (o.customerName?.toLowerCase().includes(search) ?? false)
    );
  });

  protected readonly tableConfig: DataTableConfig<ProductCharge> = {
    columns: [
      { key: 'unitId', header: 'Unit ID', sortable: false },
      { key: 'collDate', header: 'Collection Date', sortable: false,
        valueFormatter: (v: any) => formatDateDisplay(v) },
      { key: 'prodCode', header: 'Product Code', sortable: false, valueFormatter: (v: any) => v || '--' },
      { key: 'aliquot', header: 'AI', sortable: false, valueFormatter: (v: any) => v || '--' },
      { key: 'abo', header: 'ABO', sortable: false, valueFormatter: (v: any) => v || '--' },
      { key: 'expDate', header: 'Expiration Date', sortable: false,
        valueFormatter: (v: any) => formatDateDisplay(v) },
      { key: 'boxId', header: 'Box ID', sortable: false, valueFormatter: (v: any) => v || '--' },
      { key: 'price', header: 'Price', sortable: false, headerClass: 'align-right', cellClass: 'align-right',
        valueFormatter: (v: any) => v != null ? `$${Number(v).toFixed(2)}` : '$0.00' }
    ],
    showPagination: false,
    emptyMessage: 'No products available',
    stickyHeader: true
  };

  filterForm!: FormGroup;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
    actions: [
      {
        label: 'VIEW ORDER DETAILS',
        variant: 'outlined',
        ariaLabel: 'View order details',
        onClick: () => this.viewOrderDetails(),
        disabled: true
      },
      {
        label: 'SHIPPED ATTRIBUTES/ANTIGENS',
        variant: 'outlined',
        ariaLabel: 'View shipped attributes and antigens',
        onClick: () => this.toggleSidePanel(),
        disabled: true
      }
    ]
  };

  private destroy$ = new Subject<void>();

  constructor() {
    effect(() => {
      const menuItems = this.menuService.getMenuItemsSignal()();

      if (menuItems.length > 0) {
        const basePath = ROUTE_REGISTRY[RouteKey.OrderChargesByOrderNo].path;
        const menuItem = this.menuService.findMenuItemByPath(basePath);

        if (menuItem) {
          this.headerConfig = {
            ...this.headerConfig,
            breadcrumbs: [
              { label: 'Home', link: ROUTES.HOME },
              { label: menuItem.label, link: null }
            ],
            title: menuItem.label,
            subtitle: menuItem.remarks || menuItem.subtitle || 'Review itemized unit pricing, processing attributes, and grand totals for a specific order'
          };
        }
      }
    });
  }

  ngOnInit(): void {
    this.initForm();
    this.loadOrderTypes();
    this.subscribeToChapterChanges();
    this.subscribeToFilterChanges();
    this.subscribeToSearchControls();

    this.isChildRouteActive = this.route.children.length > 0;
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.isChildRouteActive = this.route.children.length > 0;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.filterForm = this.fb.group({
      orderType: [null],
      orderNo: [{ value: null, disabled: true }],
      orderBy: [null]
    });
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.clearAll();
      });
  }

  private subscribeToFilterChanges(): void {
    this.filterForm.get('orderType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((orderType: string | null) => {
        this.onOrderTypeChange(orderType);
      });

    this.filterForm.get('orderNo')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((orderNo: string | null) => {
        if (orderNo) {
          this.loadOrderCharges(orderNo);
        } else {
          this.orderData.set(null);
          this.sidePanelOpen.set(false);
          this.updateButtonStates();
        }
      });
  }

  private subscribeToSearchControls(): void {
    this.orderTypeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.orderTypeSearchText.set(v || ''));

    this.orderNoSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.orderNoSearchText.set(v || ''));
  }

  private loadOrderTypes(): void {
    this.loadingOrderTypes.set(true);

    this.apiService.getOrderTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (types) => {
          this.orderTypes.set(types);
          this.loadingOrderTypes.set(false);
        },
        error: (err) => {
          console.error('Error loading order types:', err);
          this.orderTypes.set([]);
          this.loadingOrderTypes.set(false);
          this.error.set('Failed to load order types. Please try again.');
        }
      });
  }

  private onOrderTypeChange(orderType: string | null): void {
    this.filterForm.patchValue({ orderNo: null, orderBy: null }, { emitEvent: false });

    this.orderData.set(null);
    this.sidePanelOpen.set(false);
    this.orderNoSearchCtrl.setValue('');
    this.updateButtonStates();

    if (orderType) {
      this.filterForm.get('orderNo')?.enable();
      this.loadOrders(orderType);
    } else {
      this.filterForm.get('orderNo')?.disable();
      this.orders.set([]);
    }
  }

  private loadOrders(orderType: string): void {
    this.loadingOrders.set(true);

    this.apiService.getOrders(orderType)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (ordersList) => {
          this.orders.set(ordersList);
          this.loadingOrders.set(false);
        },
        error: (err) => {
          console.error('Error loading orders:', err);
          this.orders.set([]);
          this.loadingOrders.set(false);
          this.error.set('Failed to load orders. Please try again.');
        }
      });
  }

  private loadOrderCharges(orderNo: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.sidePanelOpen.set(false);

    this.apiService.getOrderCharges(orderNo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.orderData.set(data);
          this.loading.set(false);
          this.filterForm.patchValue({ orderBy: data.orderBy }, { emitEvent: false });
          this.updateButtonStates();
        },
        error: (err) => {
          console.error('Error loading order charges:', err);
          this.orderData.set(null);
          this.loading.set(false);
          this.error.set(err.status === 404 ? 'Order not found' : 'Failed to load order charges. Please try again.');
          this.updateButtonStates();
        }
      });
  }

  private updateButtonStates(): void {
    const hasOrderData = this.orderData() !== null;
    if (this.headerConfig.actions) {
      this.headerConfig.actions[0].disabled = !hasOrderData;
      this.headerConfig.actions[1].disabled = !hasOrderData;
    }
  }

  toggleSidePanel(): void {
    if (!this.sidePanelOpen()) {
      this.panelTriggerElement = document.activeElement as HTMLElement;
    }
    this.sidePanelOpen.set(!this.sidePanelOpen());
  }

  closeSidePanel(): void {
    this.sidePanelOpen.set(false);
    this.panelTriggerElement?.focus();
    this.panelTriggerElement = null;
  }

  viewOrderDetails(): void {
    const orderNo = this.filterForm.get('orderNo')?.value;
    if (orderNo) {
      this.router.navigate(['order-details', orderNo], { relativeTo: this.route });
    }
  }

  clearAll(): void {
    this.filterForm.reset();
    this.filterForm.get('orderNo')?.disable();
    this.orderData.set(null);
    this.orders.set([]);
    this.error.set(null);
    this.sidePanelOpen.set(false);
    this.orderTypeSearchCtrl.setValue('');
    this.orderNoSearchCtrl.setValue('');
    this.updateButtonStates();
  }

  get f() {
    return this.filterForm.controls;
  }

  onOtherDebitsFocus(event: FocusEvent): void {
    const input = event.target as HTMLInputElement;
    const raw = input.value.replace(/[^0-9.\-]/g, '');
    input.value = raw;
    input.select();
  }

  onOtherDebitsBlur(event: FocusEvent): void {
    const input = event.target as HTMLInputElement;
    const rawValue = input.value.replace(/[^0-9.\-]/g, '');
    const newValue = parseFloat(rawValue) || 0;
    const current = this.orderData();
    if (current?.totals) {
      const updatedTotals = {
        ...current.totals,
        otherDebitTotal: newValue,
        grandTotal: current.totals.antigensTotal + current.totals.attributesTotal +
          current.totals.productsTotal + newValue + current.totals.otherCreditTotal
      };
      this.orderData.set({ ...current, totals: updatedTotals });
    }
    input.value = this.formatCurrency(newValue);
  }

  formatCurrency(value: number | null | undefined): string {
    if (value === null || value === undefined) return '$0.00';
    return `$${value.toFixed(2)}`;
  }

  formatDateTime(dateString: string | null | undefined): string {
    if (!dateString) return '--';
    return formatDateTimeDisplay(dateString);
  }
}

function formatDateDisplay(value: string | null | undefined): string {
  if (!value) return '--';
  const date = new Date(value);
  if (isNaN(date.getTime())) return String(value);
  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  return `${date.getDate()}-${months[date.getMonth()]}-${date.getFullYear()}`;
}

function formatDateTimeDisplay(value: string): string {
  const date = new Date(value);
  if (isNaN(date.getTime())) return value;
  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const mins = date.getMinutes().toString().padStart(2, '0');
  return `${day}-${months[date.getMonth()]}-${date.getFullYear()}, ${hours}:${mins}`;
}
