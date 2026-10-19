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
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, forkJoin, takeUntil } from 'rxjs';

import { CancelUnfilledOrdersService } from './services/cancel-unfilled-orders.service';
import {
  OrderDetailDto,
  OrderItemDetailDto,
  CancelOrderRequestDto,
  EligibleOrderLovDto,
  OrderTypeLookupDto,
  OrderClassLookupDto
} from './models/cancel-unfilled-orders.model';

import { DataTable } from '@shared/components/data-table/data-table';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { MessageDialog } from '@shared/components/message-dialog/message-dialog';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';

import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { MessageDialogData } from '@shared/interfaces/auth.interface';
import {
  DataTableConfig,
  TableColumn,
  TablePageEvent
} from '@shared/interfaces/data-table.interface';

@Component({
  selector: 'app-cancel-unfilled-orders',
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
    DataTable
  ],
  templateUrl: './cancel-unfilled-orders.html',
  styleUrls: ['./cancel-unfilled-orders.scss']
})
export class CancelUnfilledOrdersComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('statusCellTpl', { static: true }) statusCellTpl!: TemplateRef<any>;

  private static nextId = 0;
  protected readonly componentId = `cancel-unfilled-orders-${CancelUnfilledOrdersComponent.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;

  private readonly fb = inject(FormBuilder);
  private readonly cancelOrdersService = inject(CancelUnfilledOrdersService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly headerService = inject(HeaderService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly dialog = inject(MatDialog);

  private readonly destroy$ = new Subject<void>();

  // State signals
  readonly selectedOrder = signal<OrderDetailDto | null>(null);
  readonly orderItems = signal<OrderItemDetailDto[]>([]);
  readonly searchLoading = signal<boolean>(false);
  readonly cancelLoading = signal<boolean>(false);
  readonly submitted = signal<boolean>(false);

  // Lookup data
  readonly orderTypeLookups = signal<OrderTypeLookupDto[]>([]);
  readonly orderClassLookups = signal<OrderClassLookupDto[]>([]);
  readonly eligibleOrders = signal<EligibleOrderLovDto[]>([]);
  readonly loadingOrders = signal<boolean>(false);

  // Search controls for ngx-mat-select-search
  readonly orderSearchCtrl = new FormControl<string>('');
  readonly typeSearchCtrl = new FormControl<string>('');
  private readonly orderSearchText = signal<string>('');
  private readonly typeSearchText = signal<string>('');

  readonly hoursOldOptions = [
    { value: 12, label: '12' },
    { value: 24, label: '24' },
    { value: 48, label: '48' },
    { value: 72, label: '72' },
    { value: 96, label: '96' },
    { value: 120, label: '120' },
    { value: 168, label: '168' },
    { value: 240, label: '240' },
    { value: 336, label: '336' },
    { value: 720, label: '720' }
  ];

  // Computed filtered dropdowns
  readonly filteredOrders = computed(() => {
    const search = this.orderSearchText().toLowerCase();
    const items = this.eligibleOrders();
    if (!search) return items;
    return items.filter(item =>
      item.orderNo.toLowerCase().includes(search) ||
      (item.customerName?.toLowerCase().includes(search) ?? false)
    );
  });

  readonly filteredOrderTypes = computed(() => {
    const search = this.typeSearchText().toLowerCase();
    const items = this.orderTypeLookups();
    if (!search) return items;
    return items.filter(item =>
      item.orderType.toLowerCase().includes(search) ||
      item.orderTypeDesc.toLowerCase().includes(search)
    );
  });

  // Computed values
  readonly hasSelectedOrder = computed(() => this.selectedOrder() !== null);
  readonly hasOrderItems = computed(() => this.orderItems().length > 0);
  readonly hasUnfilledItems = computed(() => {
    const order = this.selectedOrder();
    if (order?.hasUnfilledItems !== undefined) return order.hasUnfilledItems;
    return this.orderItems().some(item => (item.balance ?? 0) > 0);
  });
  readonly canCancel = computed(() => this.hasSelectedOrder() && this.hasUnfilledItems() && !this.cancelLoading());

  // Status badge mapping
  protected readonly statusMap: Record<string, { label: string; cssClass: string }> = {
    OR: { label: 'Ordered', cssClass: 'status-ordered' },
    BO: { label: 'Back Order', cssClass: 'status-backordered' },
    AL: { label: 'Allocated', cssClass: 'status-allocated' },
    PK: { label: 'Packed', cssClass: 'status-packed' },
    SH: { label: 'Shipped', cssClass: 'status-shipped' },
    CL: { label: 'Closed', cssClass: 'status-closed' },
    SY: { label: 'System Cancelled', cssClass: 'status-cancelled' },
    CA: { label: 'Cancelled', cssClass: 'status-cancelled' },
    DL: { label: 'Delivered', cssClass: 'status-delivered' }
  };

  searchForm!: FormGroup;
  headerConfig!: PageHeaderConfig;
  itemsTableConfig!: DataTableConfig<OrderItemDetailDto>;

  ngOnInit(): void {
    this.initForm();
    this.initPageHeader();
    this.initItemsTable();
    this.subscribeToChapterChanges();
    this.subscribeToSearchControls();
    this.loadLookups();
  }

  ngAfterViewInit(): void {
    if (this.statusCellTpl) {
      this.itemsTableConfig = {
        ...this.itemsTableConfig,
        columns: this.itemsTableConfig.columns.map(col =>
          col.key === 'itemStatus'
            ? { ...col, cellTemplate: this.statusCellTpl, valueFormatter: undefined }
            : col
        )
      };
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.searchForm = this.fb.group({
      hoursOld: [null],
      orderNo: [null],
      orderType: [null]
    });

    this.searchForm.get('hoursOld')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((hoursOld: number | null) => {
        this.searchForm.patchValue({ orderNo: null }, { emitEvent: false });
        this.clearOrderDisplay();
        if (hoursOld) {
          this.loadEligibleOrders(hoursOld);
        } else {
          this.eligibleOrders.set([]);
        }
      });

    this.searchForm.get('orderNo')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((orderNo: string | null) => {
        if (orderNo) {
          this.loadOrderDetails(orderNo);
        }
      });
  }

  private subscribeToSearchControls(): void {
    this.orderSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(val => this.orderSearchText.set(val ?? ''));

    this.typeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(val => this.typeSearchText.set(val ?? ''));
  }

  private initPageHeader(): void {
    const pageData = this.pageHeaderService.pageHeaderData();
    this.headerConfig = {
      breadcrumbs: [
        { label: 'Home', link: '/home' },
        { label: pageData?.title || 'Cancel Unfilled Orders', link: null }
      ],
      title: pageData?.title || 'Cancel Unfilled Orders',
      subtitle: 'Cancel remaining unfulfilled items for selected orders.'
    };
  }

  private initItemsTable(): void {
    const columns: TableColumn<OrderItemDetailDto>[] = [
      { key: 'itemNo', header: 'Item', width: '60px' },
      { key: 'itemStatus', header: 'Status', width: '120px' },
      { key: 'productType', header: 'Product', width: '80px' },
      { key: 'productTypeDesc', header: 'Product Type', width: '150px' },
      { key: 'bloodType', header: 'ABORh', width: '70px' },
      { key: 'aboDesc', header: 'Blood Type Description', width: '140px' },
      { key: 'tier', header: 'Tier', width: '60px' },
      {
        key: 'requiredQty', header: 'Order', width: '70px',
        cellClass: 'text-right'
      },
      {
        key: 'allocatedQty', header: 'Alloc', width: '70px',
        cellClass: 'text-right'
      },
      {
        key: 'canceledQty', header: 'Cancel', width: '70px',
        cellClass: 'text-right',
        valueFormatter: (value: any) => value != null ? String(value) : '0'
      },
      {
        key: 'balance', header: 'Balance', width: '80px',
        cellClass: 'text-right',
        valueFormatter: (value: any) => {
          const num = value != null ? Number(value) : 0;
          return num === 0 ? '--' : String(num);
        }
      }
    ];

    this.itemsTableConfig = {
      columns,
      pagination: {
        pageSize: 10,
        pageIndex: 0,
        totalRecords: 0,
        pageSizeOptions: [10, 25, 50],
        showFirstLastButtons: true
      },
      showPagination: true,
      stickyHeader: true,
      noDataIcon: 'search',
      emptyMessage: 'No Results to Display',
      emptySubMessage: 'Use the fields above to get started.'
    };
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.clearAll();
        this.loadLookups();
      });
  }

  private loadLookups(): void {
    forkJoin({
      orderTypes: this.cancelOrdersService.getOrderTypes(),
      orderClasses: this.cancelOrdersService.getOrderClasses()
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: ({ orderTypes, orderClasses }) => {
        this.orderTypeLookups.set(orderTypes);
        this.orderClassLookups.set(orderClasses);
      },
      error: () => {}
    });
  }

  private loadEligibleOrders(hoursOld: number): void {
    this.loadingOrders.set(true);
    this.eligibleOrders.set([]);
    this.cancelOrdersService.getEligibleOrdersLov(hoursOld)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (orders) => {
          this.eligibleOrders.set(orders);
          this.loadingOrders.set(false);
        },
        error: () => {
          this.loadingOrders.set(false);
        }
      });
  }

  private loadOrderDetails(orderNo: string): void {
    this.searchLoading.set(true);
    this.clearOrderDisplay();

    this.cancelOrdersService.getOrderDetails(orderNo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (orderDetail) => {
          this.selectedOrder.set(orderDetail);
          const items = (orderDetail.orderItems || []).map(item => ({
            ...item,
            balance: this.calculateBalance(item)
          }));
          this.orderItems.set(items);
          this.updateTablePagination(items.length);
          this.searchLoading.set(false);
        },
        error: (error) => {
          this.searchLoading.set(false);
          this.handleError(error, 'Failed to load order details');
        }
      });
  }

  onRetrieve(): void {
    this.submitted.set(true);
    const { hoursOld, orderNo } = this.searchForm.value;

    if (orderNo) {
      this.loadOrderDetails(orderNo);
      return;
    }

    if (hoursOld) {
      this.loadEligibleOrders(hoursOld);
      return;
    }

    this.snackbarService.showError('Please select Hours Old or enter an Order number.');
  }

  clearAll(): void {
    this.searchForm.reset();
    this.submitted.set(false);
    this.eligibleOrders.set([]);
    this.orderSearchCtrl.setValue('');
    this.typeSearchCtrl.setValue('');
    this.clearOrderDisplay();
  }

  private clearOrderDisplay(): void {
    this.selectedOrder.set(null);
    this.orderItems.set([]);
  }

  onCancelUnfilledItems(): void {
    const order = this.selectedOrder();
    if (!order) return;

    if (!this.hasUnfilledItems()) {
      const dialogData: MessageDialogData = {
        title: 'No Unfilled Items Found',
        message: 'There are no unfilled items in this order to cancel.\nAll items have already been filled or processed.',
        primaryAction: {
          label: 'OK',
          action: 'ok',
          variant: 'primary'
        }
      };

      this.dialog.open(MessageDialog, {
        width: '500px',
        maxHeight: '90vh',
        data: dialogData,
        disableClose: false,
        autoFocus: false
      });
      return;
    }

    const dialogData: MessageDialogData = {
      title: 'Cancel Unfilled Items',
      message: 'Are you sure you want to cancel the unfilled portion of this order?\nOnly the items that have not been filled will be canceled.',
      primaryAction: {
        label: 'YES, CANCEL UNFILLED ITEMS',
        action: 'yes',
        variant: 'primary'
      },
      secondaryAction: {
        label: 'NO, KEEP ORDER',
        action: 'no',
        variant: 'secondary'
      }
    };

    const dialogRef = this.dialog.open(MessageDialog, {
      width: '550px',
      maxHeight: '90vh',
      data: dialogData,
      disableClose: true,
      autoFocus: false
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result) => {
        if (result === 'yes') {
          this.executeCancellation(order.orderNo);
        }
      });
  }

  private executeCancellation(orderNo: string): void {
    const request: CancelOrderRequestDto = { Confirmation: 'Y' };
    this.cancelLoading.set(true);

    this.cancelOrdersService.cancelUnfilledOrder(orderNo, request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.cancelLoading.set(false);
          this.snackbarService.showSuccess(response.message || 'Transaction committed');

          if (response.updatedOrder) {
            this.selectedOrder.set(response.updatedOrder);
            const items = (response.updatedOrder.orderItems || []).map(item => ({
              ...item,
              balance: this.calculateBalance(item)
            }));
            this.orderItems.set(items);
            this.updateTablePagination(items.length);
          } else {
            this.loadOrderDetails(orderNo);
          }
        },
        error: (error) => {
          this.cancelLoading.set(false);
          this.handleError(error, 'Failed to cancel order');
        }
      });
  }

  private calculateBalance(item: OrderItemDetailDto): number {
    const required = item.requiredQty ?? 0;
    const allocated = item.allocatedQty ?? 0;
    const canceled = item.canceledQty ?? 0;
    const sysCanceled = item.systemCancelQty ?? 0;
    const balance = required - allocated - canceled - sysCanceled;
    return balance > 0 ? balance : 0;
  }

  private updateTablePagination(totalRecords: number): void {
    this.itemsTableConfig = {
      ...this.itemsTableConfig,
      pagination: {
        ...this.itemsTableConfig.pagination!,
        totalRecords,
        pageIndex: 0
      }
    };
  }

  protected getStatusInfo(code: string | null): { label: string; cssClass: string } {
    if (!code) return { label: '--', cssClass: '' };
    return this.statusMap[code] || { label: code, cssClass: '' };
  }

  protected formatCustomer(order: OrderDetailDto): string {
    if (!order.customerId) return '--';
    if (order.customerName) return `${order.customerId} - ${order.customerName}`;
    return order.customerId;
  }

  protected formatStandingOrder(flag: string | null): string {
    if (flag === 'Y') return 'Yes';
    if (flag === 'N') return 'No';
    return '--';
  }

  protected formatDate(dateStr: string | null): string {
    if (!dateStr) return '--';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '--';
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${day}-${month}-${year},  ${displayHours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
  }

  protected formatOrderType(order: OrderDetailDto): string {
    if (!order.orderType) return '--';
    if (order.orderTypeDesc) return `${order.orderType} - ${order.orderTypeDesc}`;
    return order.orderType;
  }

  protected formatOrderClass(order: OrderDetailDto): string {
    if (!order.orderClass) return '--';
    if (order.orderClassDesc) return `${order.orderClass} - ${order.orderClassDesc}`;
    return order.orderClass;
  }

  private handleError(error: any, defaultMessage: string): void {
    const errorMessage = error?.error?.errorResponse?.error
      || error?.error?.message
      || error?.error?.Message
      || error?.message
      || defaultMessage;
    this.snackbarService.showError(errorMessage);
  }

  onPageChange(_event: TablePageEvent): void {}
}
