import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HttpErrorHandler } from '@shared/utils/error-handler.utils';
import { SmartDropdownComponent, DropdownItem } from '@shared/components/smart-dropdown/smart-dropdown';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TableRowActionEvent } from '@shared/interfaces/data-table.interface';

import moment from 'moment';
import { EnterOrderChargesApiService } from './services/enter-order-charges-api.service';
import {
  OrderChargesHeaderDto,
  OrderChargeDto,
  ServiceCodeDto,
  CrDbIndicatorDto,
  OrderItemDto,
} from './models/enter-order-charges.model';
import { AddEditChargeDialogComponent } from './dialogs/add-edit-charge-dialog/add-edit-charge-dialog';
import { OrderItemsDialogComponent } from './dialogs/order-items-dialog/order-items-dialog';

@Component({
  selector: 'app-enter-order-charges',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    PageHeaderWithBreadcrumb,
    SmartDropdownComponent,
    DataTable,
  ],
  templateUrl: './enter-order-charges.html',
  styleUrl: './enter-order-charges.scss',
})
export class EnterOrderChargesComponent implements OnInit, OnDestroy {
  private readonly apiService = inject(EnterOrderChargesApiService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly headerService = inject(HeaderService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly dialog = inject(MatDialog);
  private readonly destroy$ = new Subject<void>();
  private currentOrderNo: string | null = null;
  private readonly orderCodeToNo = new Map<string, string>();

  headerConfig = computed<PageHeaderConfig>(() => {
    const pageData = this.pageHeaderService.pageHeaderData();
    const hasOrder = !!this.orderData();
    if (!pageData) {
      return {
        breadcrumbs: [],
        title: '',
        subtitle: '',
      };
    }
    return {
      breadcrumbs: [
        { label: 'Home', link: '/home' },
        { label: pageData.title, link: null },
      ],
      title: pageData.title,
      subtitle: pageData.subtitle || 'Input and manage service charges for the active order.',
      actions: [
        {
          label: 'ORDERED ITEMS',
          variant: 'outlined',
          matButton: 'stroked',
          ariaLabel: 'View ordered items',
          disabled: !hasOrder,
          onClick: () => this.openOrderItems(),
        },
      ],
    };
  });

  selectedOrderNo = signal<string | null>(null);
  orderItems = signal<DropdownItem[]>([]);

  isLoading = false;
  hasSearched = false;
  orderData = signal<OrderChargesHeaderDto | null>(null);
  serviceCodes = signal<ServiceCodeDto[]>([]);
  crDbIndicators = signal<CrDbIndicatorDto[]>([]);

  totalAmount = computed(() => {
    const data = this.orderData();
    if (!data?.charges) return 0;
    return data.charges.reduce((sum, c) => {
      const amt = c.amount ?? 0;
      const indicator = (c.creditDebit || c.debitCredit || '').toUpperCase();
      return indicator === 'CREDIT' || indicator === 'CR' ? sum - amt : sum + amt;
    }, 0);
  });

  chargesTableConfig = computed<DataTableConfig<OrderChargeDto>>(() => {
    const total = this.totalAmount();
    const hasCharges = (this.orderData()?.charges?.length ?? 0) > 0;

    return {
      columns: [
        { key: 'serviceCode', header: 'Service Code', width: '20%' },
        { key: 'serviceDescription', header: 'Service Description', width: '25%' },
        { key: 'creditDebit', header: 'Credit/Debit', width: '18%' },
        { key: 'quantity', header: 'Quantity', width: '15%' },
        {
          key: 'amount',
          header: 'Amount ($)',
          width: '15%',
          valueFormatter: (val: number) => val != null ? val.toFixed(2) : '0.00',
        },
      ],
      rowActions: [
        { icon: 'edit', iconSvg: 'assets/images/icons/edit.svg', action: 'edit', label: 'Edit charge', ariaLabel: 'Edit charge {{serviceCode}}', color: 'default' },
      ],
      showFooter: hasCharges,
      footerData: { amount: `Total Amount\n${total.toFixed(2)}` },
      showPagination: false,
      showTableOnEmpty: true,
      emptyMessage: 'No charges found.',
      caption: 'Order charges',
    };
  });

  onChargeAction(event: TableRowActionEvent<OrderChargeDto>): void {
    if (event.action === 'edit') {
      this.onEditCharge(event.row);
    }
  }

  ngOnInit(): void {
    this.loadOrders();
    this.loadServiceCodes();
    this.loadCrDbIndicators();

    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.onClearAll();
        this.loadOrders();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onOrderSelected(value: string | string[] | null): void {
    if (!value || typeof value !== 'string') {
      this.currentOrderNo = null;
      this.clearResults();
      return;
    }
    const orderNo = this.orderCodeToNo.get(value) || value;
    if (orderNo === this.currentOrderNo) return;
    this.currentOrderNo = orderNo;
    this.loadCharges(orderNo);
  }

  onClearAll(): void {
    this.currentOrderNo = null;
    this.selectedOrderNo.set(null);
    this.clearResults();
  }

  hasAnyFieldValue(): boolean {
    return !!this.selectedOrderNo();
  }

  displayValue(value: string | number | null | undefined): string {
    if (value == null || value === '') return '--';
    return String(value);
  }

  formatOrderDate(value: string | null | undefined): string {
    if (!value) return '--';
    const m = moment(value);
    if (!m.isValid()) return '--';
    return m.format('DD-MMM-YYYY, hh:mm A').replace(/(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)/i, match => match.toUpperCase());
  }

  onAddNewCharge(): void {
    const data = this.orderData();
    if (!data) return;

    const dialogRef = this.dialog.open(AddEditChargeDialogComponent, {
      position: { right: '0', top: '64px' },
      width: '450px',
      height: 'calc(100vh - 64px)',
      panelClass: 'right-panel-dialog',
      backdropClass: 'right-panel-backdrop',
      disableClose: true,
      autoFocus: 'first-tabbable',
      restoreFocus: true,
      ariaLabelledBy: 'add-edit-charge-dialog-title',
      data: {
        mode: 'add',
        orderNo: data.orderNo,
        serviceCodes: this.serviceCodes(),
        crDbIndicators: this.crDbIndicators(),
      },
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((saved: boolean) => {
        if (saved && data) {
          this.reloadCharges(data.orderNo);
        }
      });
  }

  onEditCharge(charge: OrderChargeDto): void {
    const data = this.orderData();
    if (!data) return;

    const dialogRef = this.dialog.open(AddEditChargeDialogComponent, {
      position: { right: '0', top: '64px' },
      width: '450px',
      height: 'calc(100vh - 64px)',
      panelClass: 'right-panel-dialog',
      backdropClass: 'right-panel-backdrop',
      disableClose: true,
      autoFocus: 'first-tabbable',
      restoreFocus: true,
      ariaLabelledBy: 'add-edit-charge-dialog-title',
      data: {
        mode: 'edit',
        orderNo: data.orderNo,
        charge,
        serviceCodes: this.serviceCodes(),
        crDbIndicators: this.crDbIndicators(),
      },
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((saved: boolean) => {
        if (saved && data) {
          this.reloadCharges(data.orderNo);
        }
      });
  }

  private openOrderItems(): void {
    const data = this.orderData();
    if (!data) return;

    this.apiService.getOrderItems(data.orderNo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            const mappedItems: OrderItemDto[] = response.data.map((item: any) => ({
              itemNo: item.itemNo,
              product: item.productType || item.product || '',
              aboRh: item.bloodTypeDescription || item.aboRh || '',
              requiredQuantity: item.requiredQty ?? item.requiredQuantity ?? 0,
              canceledQuantity: item.canceledQty ?? item.canceledQuantity ?? 0,
              unitPrice: item.unitPrice ?? 0,
            }));

            this.dialog.open(OrderItemsDialogComponent, {
              position: { right: '0', top: '64px' },
              width: '700px',
              height: 'calc(100vh - 64px)',
              panelClass: 'right-panel-dialog',
              backdropClass: 'right-panel-backdrop',
              disableClose: true,
              autoFocus: 'first-tabbable',
              restoreFocus: true,
              ariaLabelledBy: 'order-items-dialog-title',
              data: {
                orderNo: data.orderNo,
                items: mappedItems,
              },
            });
          } else {
            const msg = response.errorResponse?.error || response.message || 'No items found.';
            this.snackbarService.showError(msg);
          }
        },
        error: (error) => {
          this.snackbarService.showError(
            HttpErrorHandler.extractErrorMessage(error, 'Failed to load order items.'),
          );
        },
      });
  }

  private loadOrders(): void {
    this.apiService.getOrders()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            const items: DropdownItem[] = response.data.map(o => {
              let displayCode = o.orderNo;
              if (o.orderName) displayCode += ` - ${o.orderName}`;
              if (o.orderDate) displayCode += ` (${o.orderDate})`;
              this.orderCodeToNo.set(displayCode, o.orderNo);
              return { code: displayCode, description: o.orderName || '' };
            });
            this.orderItems.set(items);
          } else {
            this.orderItems.set([]);
          }
        },
        error: () => {
          this.orderItems.set([]);
        },
      });
  }

  private loadServiceCodes(): void {
    this.apiService.getServiceCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            const mappedCodes: ServiceCodeDto[] = response.data.map((item: any) => ({
              code: item.chargeCode || item.code,
              description: item.description,
              defaultAmount: item.unitCharge ?? item.defaultAmount,
              isAmountEditable: item.isAmountEditable,
            }));
            this.serviceCodes.set(mappedCodes);
          } else {
            this.serviceCodes.set([]);
          }
        },
        error: (error) => {
          this.serviceCodes.set([]);
          console.error('Error loading service codes:', error);
        },
      });
  }

  private loadCrDbIndicators(): void {
    this.apiService.getCrDbIndicators()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.crDbIndicators.set(response.data);
          } else {
            this.crDbIndicators.set([]);
          }
        },
        error: () => {
          this.crDbIndicators.set([]);
        },
      });
  }

  private loadCharges(orderNo: string): void {
    if (this.isLoading) {
      return;
    }

    this.isLoading = true;
    this.hasSearched = true;

    this.apiService.getOrderCharges(orderNo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.success && response.data) {
            const rawData = Array.isArray(response.data) ? response.data[0] : response.data;

            if (!rawData) {
              this.orderData.set(null);
              return;
            }

            const normalizedData: OrderChargesHeaderDto = {
              orderNo: rawData.orderNo,
              orderName: rawData.customerName || rawData.orderName || '',
              orderDate: rawData.orderDate,
              grandTotal: rawData.grandTotal,
              charges: (rawData.charges || []).map((charge: any, index: number) => ({
                orderChargeRowId: charge.orderChargeRowId || charge.OrderChargeRowId,
                chargeId: charge.serviceCode || charge.chargeCode || charge.chargeId || index,
                serviceCode: charge.serviceCode || charge.chargeCode || '',
                serviceDescription: charge.serviceDescription || charge.chargeCodeDescription || '',
                creditDebit: charge.crDbDescription || charge.debitCredit || charge.creditDebit || '',
                quantity: charge.quantity,
                amount: charge.amount,
                isAmountEditable: charge.isAmountEditable,
                lastModified: charge.lastModified,
              })),
            };

            this.orderData.set(normalizedData);
          } else {
            this.orderData.set(null);
            if (response.errorResponse?.error) {
              this.snackbarService.showError(response.errorResponse.error);
            }
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.orderData.set(null);
          console.error('Error loading charges:', error);
          this.snackbarService.showError('Failed to retrieve order charges.');
        },
      });
  }

  private reloadCharges(orderNo: string): void {
    this.loadCharges(orderNo);
  }

  private clearResults(): void {
    this.orderData.set(null);
    this.hasSearched = false;
  }
}
