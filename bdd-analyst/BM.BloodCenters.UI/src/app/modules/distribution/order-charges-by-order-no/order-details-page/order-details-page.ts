import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { A11yModule } from '@angular/cdk/a11y';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig } from '@shared/interfaces/data-table.interface';
import { ROUTES } from '../../../../core/constants/route.constants';
import { OrderChargesApiService } from '../services/order-charges-api.service';
import { AdditionalChargesPanel } from '../additional-charges-modal/additional-charges-modal';
import {
  OrderChargesSummary,
  OrderListItemDto,
  OrderedProduct,
  OrderNote,
  AuditTrailItem,
  OrderedAntigenItem,
  OrderedAttributeItem,
  ProductCharge
} from '../models/order-charges.model';

@Component({
  selector: 'app-order-details-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule,
    A11yModule,
    NgxMatSelectSearchModule,
    DataTable,
    PageHeaderWithBreadcrumb,
    AdditionalChargesPanel
  ],
  templateUrl: './order-details-page.html',
  styleUrls: ['./order-details-page.scss']
})
export class OrderDetailsPageComponent implements OnInit, OnDestroy {

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly apiService = inject(OrderChargesApiService);

  protected readonly loading = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);
  protected readonly orderData = signal<OrderChargesSummary | null>(null);
  protected readonly orderedProducts = signal<OrderedProduct[]>([]);
  protected readonly orderNote = signal<OrderNote | null>(null);
  protected readonly auditTrail = signal<AuditTrailItem[]>([]);
  protected readonly orderedAntigens = signal<OrderedAntigenItem[]>([]);
  protected readonly orderedAttributes = signal<OrderedAttributeItem[]>([]);

  protected readonly orders = signal<OrderListItemDto[]>([]);
  protected readonly selectedOrderNo = signal<string>('');
  protected readonly orderNoSearchCtrl = new FormControl('');
  private readonly orderNoSearchText = signal('');

  protected readonly filteredOrders = computed(() => {
    const search = this.orderNoSearchText().toLowerCase();
    const ordersList = this.orders();
    if (!search) return ordersList;
    return ordersList.filter(o =>
      o.orderNo.toLowerCase().includes(search) || (o.customerName?.toLowerCase().includes(search) ?? false)
    );
  });

  protected readonly hasData = computed(() => this.orderData() !== null);

  protected readonly statusMap: Record<string, { label: string; cssClass: string }> = {
    OR: { label: 'Ordered', cssClass: '' },
    AL: { label: 'Allocated', cssClass: 'status-allocated' },
    BO: { label: 'Back Ordered', cssClass: 'status-backordered' },
    CL: { label: 'Closed', cssClass: 'closed' },
    CO: { label: 'Completed', cssClass: 'closed' },
    CN: { label: 'Cancelled', cssClass: 'status-cancelled' },
    SH: { label: 'Shipped', cssClass: 'status-shipped' }
  };

  // Panel visibility
  protected readonly activePanel = signal<'ordered-attr' | 'shipped-products' | 'shipped-attr' | null>(null);
  protected readonly panelLoading = signal<boolean>(false);
  protected readonly notesPanelVisible = signal(false);
  private panelTriggerElement: HTMLElement | null = null;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: ROUTES.HOME },
      { label: 'Order Charges – By Order No', link: '/distribution/order-charges-by-order-no' },
      { label: 'Order Details', link: null }
    ],
    title: 'Order Details',
    subtitle: '',
    showBackButton: true,
    onBackClick: () => this.goBack(),
    actions: [
      {
        label: 'ORDERED ATTRIBUTES/ANTIGENS',
        variant: 'outlined',
        ariaLabel: 'View ordered attributes and antigens',
        onClick: () => this.togglePanel('ordered-attr')
      },
      {
        label: 'SHIPPED PRODUCTS',
        variant: 'outlined',
        ariaLabel: 'View shipped products',
        onClick: () => this.togglePanel('shipped-products')
      },
      {
        label: 'SHIPPED ATTRIBUTES/ANTIGENS',
        variant: 'outlined',
        ariaLabel: 'View shipped attributes and antigens',
        onClick: () => this.togglePanel('shipped-attr')
      }
    ]
  };

  protected readonly shippedProducts = computed(() => this.orderData()?.products || []);

  protected readonly shippedProductsTableConfig: DataTableConfig<ProductCharge> = {
    columns: [
      { key: 'unitId', header: 'Unit ID', sortable: false },
      { key: 'collDate', header: 'Collection Date', sortable: false, valueFormatter: (v: any) => formatDateDisplay(v) },
      { key: 'prodCode', header: 'Product Code', sortable: false, valueFormatter: (v: any) => v || '--' },
      { key: 'aliquot', header: 'AI', sortable: false, valueFormatter: (v: any) => v || '--' },
      { key: 'abo', header: 'ABO', sortable: false, valueFormatter: (v: any) => v || '--' },
      { key: 'expDate', header: 'Expiration Date', sortable: false, valueFormatter: (v: any) => formatDateDisplay(v) },
      { key: 'boxId', header: 'Box ID', sortable: false, valueFormatter: (v: any) => v || '--' },
      { key: 'price', header: 'Price', sortable: false, valueFormatter: (v: any) => v != null ? `$${Number(v).toFixed(2)}` : '$0.00' }
    ],
    showPagination: false,
    emptyMessage: 'No shipped products',
    stickyHeader: true
  };

  protected readonly auditTableConfig: DataTableConfig<AuditTrailItem> = {
    columns: [
      { key: 'actionFunction', header: 'Action Function', sortable: false, valueFormatter: (v: any) => v || '--' },
      { key: 'actionDate', header: 'Date & Time', sortable: false, valueFormatter: (v: any) => v || '--' },
      { key: 'userName', header: 'User Name', sortable: false, valueFormatter: (v: any) => v || '--' }
    ],
    showPagination: false,
    emptyMessage: 'No audit trail available',
    stickyHeader: true
  };

  private orderNo = '';
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.orderNoSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.orderNoSearchText.set(v || ''));

    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.orderNo = params['orderNo'];
      if (this.orderNo) {
        this.selectedOrderNo.set(this.orderNo);
        this.loadAllData(this.orderNo);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadAllData(orderNo: string): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      charges: this.apiService.getOrderCharges(orderNo),
      products: this.apiService.getOrderedProducts(orderNo).pipe(catchError(() => of([]))),
      notes: this.apiService.getOrderNotes(orderNo).pipe(catchError(() => of(null))),
      audit: this.apiService.getAuditTrail(orderNo).pipe(catchError(() => of([])))
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (result) => {
        this.orderData.set(result.charges);
        this.orderedProducts.set(result.products as OrderedProduct[]);
        this.orderNote.set(result.notes as OrderNote | null);
        this.auditTrail.set(result.audit as AuditTrailItem[]);
        this.loading.set(false);
        if (result.charges?.orderType) {
          this.loadOrders(result.charges.orderType);
        }
      },
      error: (err) => {
        console.error('Error loading order details:', err);
        this.loading.set(false);
        this.error.set(err.status === 404 ? 'Order not found' : 'Failed to load order details.');
      }
    });
  }

  private orderedAttrLoaded = false;

  togglePanel(panel: 'ordered-attr' | 'shipped-products' | 'shipped-attr'): void {
    if (this.activePanel() === panel) {
      this.closeSidePanel();
      return;
    }

    this.panelTriggerElement = document.activeElement as HTMLElement;
    this.activePanel.set(panel);

    if (panel === 'ordered-attr' && !this.orderedAttrLoaded) {
      this.panelLoading.set(true);
      forkJoin({
        antigens: this.apiService.getOrderedAntigens(this.orderNo).pipe(catchError(() => of([]))),
        attributes: this.apiService.getOrderedAttributes(this.orderNo).pipe(catchError(() => of([])))
      }).pipe(takeUntil(this.destroy$)).subscribe(result => {
        this.orderedAntigens.set(result.antigens as OrderedAntigenItem[]);
        this.orderedAttributes.set(result.attributes as OrderedAttributeItem[]);
        this.orderedAttrLoaded = true;
        this.panelLoading.set(false);
      });
    }
  }

  closeSidePanel(): void {
    this.activePanel.set(null);
    this.panelLoading.set(false);
    this.panelTriggerElement?.focus();
    this.panelTriggerElement = null;
  }

  private loadOrders(orderType: string): void {
    this.apiService.getOrders(orderType)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (ordersList) => {
          this.orders.set(ordersList);
          if (!this.selectedOrderNo() && ordersList.length > 0) {
            this.selectedOrderNo.set(ordersList[0].orderNo);
          }
        },
        error: () => this.orders.set([])
      });
  }

  onOrderChange(newOrderNo: string): void {
    if (newOrderNo && newOrderNo !== this.orderNo) {
      this.router.navigate(['../', newOrderNo], { relativeTo: this.route });
    }
  }

  getStatusInfo(code: string | null): { label: string; cssClass: string } {
    if (!code) return { label: '--', cssClass: '' };
    return this.statusMap[code] || { label: code, cssClass: '' };
  }

  goBack(): void {
    this.router.navigate(['/distribution/order-charges-by-order-no']);
  }

  clearAll(): void {
    this.goBack();
  }

  showOrderNotes(): void {
    this.notesPanelVisible.update(v => !v);
  }

  formatDateTime(value: string | null | undefined): string {
    if (!value) return '--';
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;
    const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const mins = date.getMinutes().toString().padStart(2, '0');
    return `${day}-${months[date.getMonth()]}-${date.getFullYear()}, ${hours}:${mins}`;
  }
}

function formatDateDisplay(value: string | null | undefined): string {
  if (!value) return '--';
  const date = new Date(value);
  if (isNaN(date.getTime())) return String(value);
  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  return `${date.getDate()}-${months[date.getMonth()]}-${date.getFullYear()}`;
}
