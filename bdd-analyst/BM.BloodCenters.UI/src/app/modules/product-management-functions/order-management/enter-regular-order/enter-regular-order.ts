import {
  Component, OnInit, OnDestroy, ViewChild, HostListener,
  signal, inject, effect, ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, takeUntil, catchError, of, from, concatMap } from 'rxjs';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner.component';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';

import { StepOrderDetailsComponent } from './step-order-details/step-order-details';
import { StepAddProductsComponent } from './step-add-products/step-add-products';
import {
  RegularOrderDto,
  OrderItemDto,
  CreateRegularOrderRequestDto,
  CreateOrderItemDto,
  StandingOrderItemDto,
  ContractLookupItem
} from './models/regular-order.model';
import { RegularOrderApiService } from './services/regular-order-api.service';
import { OpenOrdersDialogComponent } from './dialogs/open-orders-dialog/open-orders-dialog';
import { SpecialChargesDialogComponent } from './dialogs/special-charges-dialog/special-charges-dialog';
import { EnterCommentsDialogComponent } from './dialogs/enter-comments-dialog/enter-comments-dialog';
import { InventoryDialogComponent } from './dialogs/inventory-dialog/inventory-dialog';
import { ConfirmOrderReleaseDialogComponent } from './dialogs/confirm-order-release-dialog/confirm-order-release-dialog';
import { ConfirmActionDialogComponent } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';
import { EnterSpecialOrderComponent } from '../enter-special-order/enter-special-order';
import { EnterExportOrderComponent } from '../enter-export-order/enter-export-order';

@Component({
  selector: 'app-enter-regular-order',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    PageHeaderWithBreadcrumb,
    LoadingSpinnerComponent,
    StepOrderDetailsComponent,
    StepAddProductsComponent,
    EnterSpecialOrderComponent,
    EnterExportOrderComponent
  ],
  templateUrl: './enter-regular-order.html',
  styleUrls: ['./enter-regular-order.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EnterRegularOrderComponent implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `enter-regular-order-${EnterRegularOrderComponent.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;

  private readonly apiService = inject(RegularOrderApiService);
  private readonly headerService = inject(HeaderService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  @ViewChild(StepOrderDetailsComponent) stepOrderDetails!: StepOrderDetailsComponent;
  @ViewChild(StepAddProductsComponent) stepAddProducts!: StepAddProductsComponent;
  @ViewChild(EnterSpecialOrderComponent) specialOrderComponent!: EnterSpecialOrderComponent;
  @ViewChild(EnterExportOrderComponent) exportOrderComponent!: EnterExportOrderComponent;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/' },
      { label: 'Manage Orders', link: '' }
    ],
    title: 'Manage Orders',
    subtitle: 'Create and manage regular, special, or export orders with required details.',
    actions: [
      { label: 'OPEN ORDERS', matButton: 'stroked', ariaLabel: 'Open orders for customer', disabled: true, onClick: () => this.onOpenOrders() },
      { label: 'QUERY STOCKS', matButton: 'stroked', ariaLabel: 'Query stocks', disabled: true, onClick: () => this.onQueryStocks() },
      { label: 'CHARGES', matButton: 'stroked', ariaLabel: 'View charges', disabled: true, onClick: () => this.onCharges() }
    ]
  };

  private readonly headerEffect = effect(() => {
    const pageData = this.pageHeaderService.pageHeaderData();
    if (pageData) {
      this.headerConfig = {
        ...this.headerConfig,
        breadcrumbs: [
          { label: 'Home', link: '/' },
          { label: pageData.title, link: '' }
        ],
        title: pageData.title,
        subtitle: pageData.subtitle || this.headerConfig.subtitle
      };
      this.cdr.markForCheck();
    }
  });

  currentStep = signal<number>(1);
  loading = signal<boolean>(false);
  saving = signal<boolean>(false);
  isStep1Valid = signal<boolean>(false);

  orderData = signal<Partial<RegularOrderDto>>({});
  orderItems = signal<OrderItemDto[]>([]);
  orderNotes = signal<string>('');
  activeTab = signal<number>(0);
  selectedCustomerId = signal('');
  selectedConsigneeId = signal('');
  contractSubstituteFlag = signal('');
  private lastStandingOrderKey = '';
  private lastContractKey = '';

  ngOnInit(): void {
    this.subscribeToChapterChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.resetForm();
      });
  }

  resetForm(skipCleanup = false): void {
    const orderNo = this.orderData()?.orderNo;
    if (orderNo && !skipCleanup) {
      this.apiService.deleteOrder(orderNo).pipe(
        takeUntil(this.destroy$),
        catchError(() => of(false))
      ).subscribe();
    }
    this.currentStep.set(1);
    this.orderData.set({});
    this.orderItems.set([]);
    this.orderNotes.set('');
    this.isStep1Valid.set(false);
    this.selectedCustomerId.set('');
    this.selectedConsigneeId.set('');
    this.contractSubstituteFlag.set('');
    this.lastStandingOrderKey = '';
    this.lastContractKey = '';
    this.updateActionButtonStates(false);
    this.cdr.markForCheck();
  }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.orderData()?.orderNo) {
      event.preventDefault();
      event.returnValue = '';
    }
  }

  onStep1FormDataChange(data: Partial<RegularOrderDto>): void {
    this.orderData.set(data);
    this.selectedCustomerId.set(data.customerId || '');
    this.selectedConsigneeId.set(data.consigneeId || '');
    this.updateActionButtonStates(!!data.customerId);
    this.checkStandingOrders(data);
  }

  private updateActionButtonStates(hasCustomer: boolean): void {
    if (this.headerConfig.actions) {
      let hasItems = false;
      if (this.activeTab() === 1) {
        hasItems = (this.specialOrderComponent?.orderItems()?.length ?? 0) > 0;
      } else if (this.activeTab() === 2) {
        hasItems = (this.exportOrderComponent?.orderItems()?.length ?? 0) > 0;
      } else {
        hasItems = this.orderItems().length > 0;
      }
      this.headerConfig.actions.forEach(action => {
        if (action.label === 'CHARGES') {
          action.disabled = !hasItems;
        } else {
          action.disabled = !hasCustomer;
        }
      });
      this.headerConfig = { ...this.headerConfig };
    }
  }

  onSpCustomerChanged(hasCustomer: boolean): void {
    this.updateActionButtonStates(hasCustomer);
  }

  onSpOrderCreated(_orderNo: string): void {
    this.updateActionButtonStates(true);
  }

  onExCustomerChanged(hasCustomer: boolean): void {
    this.updateActionButtonStates(hasCustomer);
  }

  onExOrderCreated(_orderNo: string): void {
    this.updateActionButtonStates(true);
  }

  onItemsChanged(): void {
    this.updateActionButtonStates(true);
  }

  onStep1ValidityChange(valid: boolean): void {
    this.isStep1Valid.set(valid);
  }

  onTabKeydown(event: KeyboardEvent, currentIndex: number): void {
    const tabCount = 3;
    let newIndex = currentIndex;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      newIndex = (currentIndex + 1) % tabCount;
      event.preventDefault();
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      newIndex = (currentIndex - 1 + tabCount) % tabCount;
      event.preventDefault();
    } else if (event.key === 'Home') {
      newIndex = 0;
      event.preventDefault();
    } else if (event.key === 'End') {
      newIndex = tabCount - 1;
      event.preventDefault();
    }
    if (newIndex !== currentIndex) {
      this.activeTab.set(newIndex);
      setTimeout(() => {
        const tabs = document.querySelectorAll('[role="tab"]');
        (tabs[newIndex] as HTMLElement)?.focus();
      });
    }
  }

  goToStep2(): void {
    if (!this.isStep1Valid()) return;
    this.currentStep.set(2);
  }

  goToStep1(): void {
    this.currentStep.set(1);
  }

  private createOrderWithFirstItem(item: CreateOrderItemDto): void {
    const data = this.orderData();
    const request: CreateRegularOrderRequestDto = {
      customerId: data.customerId || '',
      orderType: 'RE',
      orderClass: data.priority || '',
      orderedBy: data.orderedBy,
      contractId: data.contractId,
      orderMode: data.orderMode,
      consigneeId: data.consigneeId || '',
      payeeId: data.payeeId || '',
      items: [item]
    };

    this.saving.set(true);
    this.apiService.createOrder(request).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (result) => {
        this.saving.set(false);
        const orderNo = result?.orderNo || '';
        this.orderData.update(d => ({ ...d, orderNo, estArrivalTime: result?.estArrivalTime }));
        this.orderItems.set(result?.items || []);
        this.updateActionButtonStates(true);
        this.cdr.markForCheck();
      },
      error: () => {
        this.saving.set(false);
        this.snackBar.open('Failed to create order. Please try again.', 'DISMISS', {
          horizontalPosition: 'end', verticalPosition: 'top', duration: 5000, panelClass: ['error-snackbar']
        });
        this.cdr.markForCheck();
      }
    });
  }

  onItemAdded(item: CreateOrderItemDto): void {
    const orderNo = this.orderData().orderNo;

    if (!orderNo) {
      this.createOrderWithFirstItem(item);
      return;
    }

    this.saving.set(true);
    this.apiService.addOrderItem(orderNo, item).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (allItems) => {
        this.saving.set(false);
        const existingItems = this.orderItems();
        const merged = (allItems || []).map(serverItem => {
          const existing = existingItems.find(e => e.itemNo === serverItem.itemNo);
          return { ...serverItem, bloodTypeDesc: serverItem.bloodTypeDesc || existing?.bloodTypeDesc || (serverItem.itemNo === item.itemNo ? item.bloodTypeDesc : undefined) };
        });
        this.orderItems.set(merged);
        this.updateActionButtonStates(true);
        this.cdr.markForCheck();
      },
      error: () => {
        this.saving.set(false);
        this.snackBar.open('Failed to add item. Please try again.', 'DISMISS', {
          horizontalPosition: 'end', verticalPosition: 'top', duration: 5000, panelClass: ['error-snackbar']
        });
        this.cdr.markForCheck();
      }
    });
  }

  onItemAddedExtra(extra: { attribGroup?: string; attribCode?: string }): void {
    this.orderItems.update(items => {
      if (items.length === 0) return items;
      const updated = [...items];
      const last = { ...updated[updated.length - 1], ...extra };
      updated[updated.length - 1] = last;
      return updated;
    });
  }

  onItemDeleted(itemNo: number): void {
    const orderNo = this.orderData().orderNo;
    if (orderNo) {
      this.apiService.deleteOrderItem(orderNo, itemNo).pipe(
        takeUntil(this.destroy$)
      ).subscribe(() => {
        this.orderItems.update(items => items.filter(i => i.itemNo !== itemNo));
        this.updateActionButtonStates(true);
        this.cdr.markForCheck();
      });
    } else {
      this.orderItems.update(items => items.filter(i => i.itemNo !== itemNo));
      this.updateActionButtonStates(true);
    }
  }

  onSubmitOrder(): void {
    if (this.orderItems().length === 0) {
      this.snackBar.open('Please add at least one product item.', 'DISMISS', {
        horizontalPosition: 'end', verticalPosition: 'top', duration: 5000, panelClass: ['error-snackbar']
      });
      return;
    }

    const dialogRef = this.dialog.open(ConfirmOrderReleaseDialogComponent, {
      width: '500px',
      disableClose: true
    });

    dialogRef.afterClosed().pipe(
      takeUntil(this.destroy$)
    ).subscribe(confirmed => {
      if (confirmed) {
        this.releaseOrder();
      }
    });
  }

  private releaseOrder(): void {
    const orderNo = this.orderData().orderNo;
    if (!orderNo) return;

    this.saving.set(true);
    this.apiService.updateOrder(orderNo, { orderStatus: 'RL' }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.saving.set(false);
        this.snackBar.open(`Order Number ${orderNo} is Printing`, 'DISMISS', {
          horizontalPosition: 'end', verticalPosition: 'top', duration: 8000
        });
        this.resetForm(true);
        this.cdr.markForCheck();
      },
      error: () => {
        this.saving.set(false);
        this.snackBar.open('Failed to release order. Please try again.', 'DISMISS', {
          horizontalPosition: 'end', verticalPosition: 'top', duration: 5000, panelClass: ['error-snackbar']
        });
        this.cdr.markForCheck();
      }
    });
  }

  onOpenOrders(): void {
    if (this.activeTab() === 1 && this.specialOrderComponent) {
      this.specialOrderComponent.onOpenOrders();
      return;
    }
    if (this.activeTab() === 2 && this.exportOrderComponent) {
      this.exportOrderComponent.onOpenOrders();
      return;
    }
    const customerId = this.orderData().customerId;
    if (!customerId) return;

    this.apiService.getOpenOrderItems(customerId).pipe(
      takeUntil(this.destroy$),
      catchError(() => of([]))
    ).subscribe(items => {
      const orders = (items || []).map((item: any) => ({
        orderNumber: item.orderNo,
        item: item.itemNo,
        product: item.productType,
        abORh: item.bloodTypeDesc || item.bloodType || '--',
        quantityRequired: item.requiredQty,
        quantityShort: item.qtyShort ?? 0,
        tierOrder: item.tier,
        date: item.insertDate,
        hours: item.hoursElapsed ?? 0
      }));
      const dialogRef = this.dialog.open(OpenOrdersDialogComponent, {
        position: { right: '0' },
        width: '950px',
        height: '100vh',
        panelClass: 'right-panel-dialog',
        data: { customerId, orders }
      });

      dialogRef.afterClosed().pipe(
        takeUntil(this.destroy$)
      ).subscribe(result => {
        if (result?.action === 'load' && result.orderNo) {
          this.loadExistingOrder(result.orderNo);
        }
      });
    });
  }

  onQueryStocks(): void {
    if (this.activeTab() === 1 && this.specialOrderComponent) {
      this.specialOrderComponent.onQueryStocks();
      return;
    }
    if (this.activeTab() === 2 && this.exportOrderComponent) {
      this.exportOrderComponent.onQueryStocks();
      return;
    }
    this.apiService.getProductTypesLookup().pipe(
      takeUntil(this.destroy$)
    ).subscribe(products => {
      this.dialog.open(InventoryDialogComponent, {
        position: { right: '0' },
        width: '750px',
        height: '100vh',
        panelClass: 'right-panel-dialog',
        data: { products, apiService: this.apiService }
      });
    });
  }

  onCharges(): void {
    if (this.activeTab() === 1 && this.specialOrderComponent) {
      this.specialOrderComponent.onCharges();
      return;
    }
    if (this.activeTab() === 2 && this.exportOrderComponent) {
      this.exportOrderComponent.onCharges();
      return;
    }
    const orderNo = this.orderData().orderNo;
    if (!orderNo) {
      this.snackBar.open('Please create the order first before adding charges.', 'DISMISS', {
        horizontalPosition: 'end', verticalPosition: 'top', duration: 5000, panelClass: ['error-snackbar']
      });
      return;
    }

    this.apiService.getOrderCharges(orderNo).pipe(
      takeUntil(this.destroy$),
      catchError(() => of([]))
    ).subscribe(charges => {
      this.dialog.open(SpecialChargesDialogComponent, {
        position: { right: '0' },
        width: '800px',
        height: '100vh',
        panelClass: 'right-panel-dialog',
        data: { orderNo, charges, apiService: this.apiService }
      });
    });
  }

  onAddNotes(): void {
    const orderNo = this.orderData().orderNo;

    if (orderNo) {
      this.apiService.getOrderNotes(orderNo).pipe(
        takeUntil(this.destroy$),
        catchError(() => of(null))
      ).subscribe(noteData => {
        this.openNotesDialog(orderNo, noteData?.note || this.orderNotes());
      });
    } else {
      this.openNotesDialog(null, this.orderNotes());
    }
  }

  private openNotesDialog(orderNo: string | null, notes: string): void {
    const dialogRef = this.dialog.open(EnterCommentsDialogComponent, {
      position: { right: '0' },
      width: '500px',
      height: '100vh',
      panelClass: 'right-panel-dialog',
      data: { notes }
    });

    dialogRef.afterClosed().pipe(
      takeUntil(this.destroy$)
    ).subscribe(result => {
      if (result !== null && result !== undefined) {
        this.orderNotes.set(result);
        if (orderNo) {
          this.apiService.saveOrderNotes(orderNo, result).pipe(
            takeUntil(this.destroy$)
          ).subscribe();
        }
      }
    });
  }

  private checkStandingOrders(data: Partial<RegularOrderDto>): void {
    const customerId = data.customerId || '';
    const contractId = data.contractId || '';
    const consigneeId = data.consigneeId || '';

    // Update contract substitute flag when contract changes
    const contractKey = `${customerId}|${contractId}`;
    if (contractKey !== this.lastContractKey && customerId && contractId) {
      this.lastContractKey = contractKey;
      this.apiService.getContracts(customerId).pipe(
        takeUntil(this.destroy$),
        catchError(() => of([] as ContractLookupItem[]))
      ).subscribe(contracts => {
        const contract = contracts.find((c: ContractLookupItem) => c.code === contractId);
        this.contractSubstituteFlag.set(contract?.substituteFlag || '');
      });
    } else if (!contractId) {
      this.contractSubstituteFlag.set('');
    }

    // Check standing orders when all three fields are present and the combination changes
    const standingKey = `${customerId}|${contractId}|${consigneeId}`;
    if (!customerId || !contractId || !consigneeId || standingKey === this.lastStandingOrderKey) return;
    this.lastStandingOrderKey = standingKey;

    this.apiService.getStandingOrderItems(customerId, contractId, consigneeId).pipe(
      takeUntil(this.destroy$),
      catchError(() => of([] as StandingOrderItemDto[]))
    ).subscribe(items => {
      if (items.length > 0) {
        const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
          width: '420px',
          disableClose: true,
          data: {
            title: 'Standing Order Items',
            message: 'Standing order items found. Apply them?',
            confirmText: 'YES',
            cancelText: 'NO'
          }
        });
        dialogRef.afterClosed().pipe(
          takeUntil(this.destroy$)
        ).subscribe(confirmed => {
          if (confirmed) {
            this.applyStandingOrderItems(items);
          }
        });
      }
    });
  }

  private applyStandingOrderItems(standingItems: StandingOrderItemDto[]): void {
    if (standingItems.length === 0) return;

    const data = this.orderData();
    const existingItems = this.orderItems();
    const startItemNo = existingItems.length > 0
      ? Math.max(...existingItems.map(i => i.itemNo)) + 1
      : 1;

    const createItems: CreateOrderItemDto[] = standingItems.map((item, i) => ({
      itemNo: startItemNo + i,
      productType: item.productType,
      bloodType: item.bloodType || '',
      bloodTypeDesc: item.bloodTypeDesc,
      tier: item.tier,
      requiredQty: item.requiredQty,
      subOk: item.subOk
    }));

    const orderNo = data.orderNo;
    if (!orderNo) {
      // No order yet - create order with all standing order items at once
      const request: CreateRegularOrderRequestDto = {
        customerId: data.customerId || '',
        orderType: 'RE',
        orderClass: data.priority || '',
        orderedBy: data.orderedBy,
        contractId: data.contractId,
        orderMode: data.orderMode,
        consigneeId: data.consigneeId || '',
        payeeId: data.payeeId || '',
        items: createItems
      };

      this.saving.set(true);
      this.apiService.createOrder(request).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (result) => {
          this.saving.set(false);
          this.orderData.update(d => ({ ...d, orderNo: result?.orderNo || '', estArrivalTime: result?.estArrivalTime }));
          this.orderItems.set(result?.items || []);
          this.updateActionButtonStates(true);
          this.snackBar.open(`${standingItems.length} standing order item(s) applied.`, 'DISMISS', {
            horizontalPosition: 'end', verticalPosition: 'top', duration: 5000
          });
          this.cdr.markForCheck();
        },
        error: () => {
          this.saving.set(false);
          this.snackBar.open('Failed to apply standing order items.', 'DISMISS', {
            horizontalPosition: 'end', verticalPosition: 'top', duration: 5000, panelClass: ['error-snackbar']
          });
          this.cdr.markForCheck();
        }
      });
    } else {
      // Order already exists - add items sequentially
      this.saving.set(true);
      from(createItems).pipe(
        concatMap(item => this.apiService.addOrderItem(orderNo, item).pipe(
          catchError(() => of([] as OrderItemDto[]))
        )),
        takeUntil(this.destroy$)
      ).subscribe({
        next: (allItems) => {
          if (Array.isArray(allItems) && allItems.length > 0) {
            this.orderItems.set(allItems);
          }
          this.updateActionButtonStates(true);
          this.cdr.markForCheck();
        },
        complete: () => {
          this.saving.set(false);
          this.snackBar.open(`${standingItems.length} standing order item(s) applied.`, 'DISMISS', {
            horizontalPosition: 'end', verticalPosition: 'top', duration: 5000
          });
          this.cdr.markForCheck();
        }
      });
    }
  }

  private getNextItemNo(): number {
    const items = this.orderItems();
    if (items.length === 0) return 1;
    return Math.max(...items.map(i => i.itemNo)) + 1;
  }

  private loadExistingOrder(orderNo: string): void {
    this.loading.set(true);
    this.apiService.getOrder(orderNo).pipe(
      takeUntil(this.destroy$),
      catchError(() => of(null))
    ).subscribe(order => {
      this.loading.set(false);
      if (order) {
        this.orderData.set(order);
        this.orderItems.set(order.items || []);
        this.selectedCustomerId.set(order.customerId || '');
        this.selectedConsigneeId.set(order.consigneeId || '');
        this.currentStep.set(2);
        this.updateActionButtonStates(true);
      }
      this.cdr.markForCheck();
    });
  }
}
