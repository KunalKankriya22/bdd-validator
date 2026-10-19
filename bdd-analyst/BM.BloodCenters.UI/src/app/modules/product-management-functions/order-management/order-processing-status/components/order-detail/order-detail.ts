import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  OnDestroy,
  OnInit,
  AfterViewInit,
  ViewChild,
  TemplateRef,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TableRowActionEvent } from '@shared/interfaces/data-table.interface';

import { OrderProcessingStatusService } from '../../services/order-processing-status.service';
import {
  OrderStatusDto,
  OrderDetailDto,
  OrderItemDto,
  OrderNoteDto,
  OrderAuditTrailDto,
  STATUS_COLORS
} from '../../models/order-processing-status.model';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    DataTable
  ],
  templateUrl: './order-detail.html',
  styleUrl: './order-detail.scss'
})
export class OrderDetailComponent implements OnInit, OnChanges, OnDestroy, AfterViewInit {
  private static nextId = 0;
  protected readonly componentId = `order-detail-${OrderDetailComponent.nextId++}`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  @ViewChild('itemStatusTpl', { static: true }) itemStatusTpl!: TemplateRef<any>;

  private readonly orderService = inject(OrderProcessingStatusService);
  private readonly destroy$ = new Subject<void>();

  @Input() order!: OrderStatusDto;
  @Input() statusColor: string = 'teal';
  @Input() statusDescriptions: Record<string, string> = {};

  protected readonly detail = signal<OrderDetailDto | null>(null);
  protected readonly notes = signal<OrderNoteDto | null>(null);
  protected readonly auditTrail = signal<OrderAuditTrailDto[]>([]);
  protected readonly loading = signal<boolean>(false);
  protected readonly selectedProductNotes = signal<string | null>(null);
  protected readonly showOrderNotes = signal<boolean>(false);

  protected productsTableConfig!: DataTableConfig<OrderItemDto>;

  protected readonly auditTableConfig: DataTableConfig = {
    columns: [
      { key: 'actionFunction', header: 'Action Function' },
      { key: 'actionDate', header: 'Date & Time', type: 'date', valueFormatter: (v: string) => this.formatDateTime(v) },
      { key: 'userName', header: 'User Name' }
    ],
    emptyMessage: 'No audit trail data available.',
    showPagination: false,
    stickyHeader: true
  };

  ngOnInit(): void {
    this.productsTableConfig = {
      columns: [
        { key: 'itemNo', header: 'Item', width: '60px' },
        { key: 'productType', header: 'Product', width: '100px' },
        { key: 'bloodTypeDesc', header: 'ABORh', width: '100px',
          valueFormatter: (value: any, row: any) => value || row?.bloodType || '—' },
        { key: 'requiredQty', header: 'Required', width: '90px', type: 'number' },
        { key: 'allocatedQty', header: 'Allocated', width: '90px', type: 'number' },
        { key: 'canceledQty', header: 'Canceled', width: '90px', type: 'number' },
        { key: 'itemStatus', header: 'Status', width: '110px', cellTemplate: this.itemStatusTpl }
      ],
      rowActions: [
        { icon: 'chat_bubble_outline', action: 'notes', ariaLabel: 'View notes' }
      ],
      emptyMessage: 'No ordered products found.',
      showPagination: false,
      stickyHeader: true
    };
  }

  ngAfterViewInit(): void {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['order'] && this.order) {
      this.loadOrderDetail(this.order.orderNo);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadOrderDetail(orderNo: string): void {
    this.loading.set(true);
    this.detail.set(null);
    this.notes.set(null);
    this.auditTrail.set([]);
    this.selectedProductNotes.set(null);
    this.showOrderNotes.set(false);

    this.orderService.getOrderDetail(orderNo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.detail.set(data);
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });

    this.orderService.getOrderNotes(orderNo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => this.notes.set(data),
        error: () => {}
      });

    this.orderService.getAuditTrail(orderNo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => this.auditTrail.set(data),
        error: () => {}
      });
  }

  protected getStatusLabel(status: string): string {
    return this.statusDescriptions[status] || status;
  }

  protected getStatusColorClass(status: string): string {
    const color = STATUS_COLORS[status] || 'gray';
    return `status-${color}`;
  }

  protected formatDateTime(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}-${month}-${year}, ${hours}:${minutes}`;
  }

  protected toggleOrderNotes(): void {
    this.showOrderNotes.set(!this.showOrderNotes());
    if (this.showOrderNotes()) {
      this.selectedProductNotes.set(null);
    }
  }

  protected onProductRowAction(event: TableRowActionEvent<OrderItemDto>): void {
    if (event.action === 'notes') {
      const productType = event.row.productType;
      this.showOrderNotes.set(false);
      this.selectedProductNotes.set(
        this.selectedProductNotes() === productType ? null : productType
      );
    }
  }
}
