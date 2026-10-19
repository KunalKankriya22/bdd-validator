import {
  Component, OnInit, OnDestroy, ViewChild, Output, EventEmitter,
  signal, inject, ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, Observable, takeUntil, catchError, of, switchMap, map, from, concatMap, toArray, finalize } from 'rxjs';

import { LoadingSpinnerComponent } from '@shared/components/loading-spinner.component';
import { ConfirmActionDialogComponent } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';

import { ExStepOrderDetailsComponent } from './step-order-details/ex-step-order-details';
import { ExStepAddProductsComponent } from './step-add-products/ex-step-add-products';
import {
  ExportOrderDto,
  ExportOrderItemDto,
  CreateExportOrderRequestDto,
  CreateExportOrderItemDto,
  UpdateExportOrderRequestDto,
  StandingOrderItemDto
} from './models/export-order.model';
import { ExportOrderApiService } from './services/export-order-api.service';
import { OpenOrdersDialogComponent } from '../enter-regular-order/dialogs/open-orders-dialog/open-orders-dialog';
import { SpecialChargesDialogComponent } from '../enter-regular-order/dialogs/special-charges-dialog/special-charges-dialog';
import { EnterCommentsDialogComponent } from '../enter-regular-order/dialogs/enter-comments-dialog/enter-comments-dialog';
import { InventoryDialogComponent } from '../enter-regular-order/dialogs/inventory-dialog/inventory-dialog';
import { ConfirmOrderReleaseDialogComponent } from '../enter-regular-order/dialogs/confirm-order-release-dialog/confirm-order-release-dialog';

@Component({
  selector: 'app-enter-export-order',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    LoadingSpinnerComponent,
    ExStepOrderDetailsComponent,
    ExStepAddProductsComponent
  ],
  templateUrl: './enter-export-order.html',
  styleUrls: ['./enter-export-order.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EnterExportOrderComponent implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `enter-export-order-${EnterExportOrderComponent.nextId++}`;

  private readonly apiService = inject(ExportOrderApiService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  @ViewChild(ExStepOrderDetailsComponent) stepOrderDetails!: ExStepOrderDetailsComponent;
  @ViewChild(ExStepAddProductsComponent) stepAddProducts!: ExStepAddProductsComponent;

  @Output() customerChanged = new EventEmitter<boolean>();
  @Output() orderCreated = new EventEmitter<string>();
  @Output() itemsChanged = new EventEmitter<void>();

  currentStep = signal<number>(1);
  loading = signal<boolean>(false);
  saving = signal<boolean>(false);
  isStep1Valid = signal<boolean>(false);

  orderData = signal<Partial<ExportOrderDto>>({});
  orderItems = signal<ExportOrderItemDto[]>([]);
  orderNotes = signal<string>('');
  priceChangeFlag = signal<string | null>(null);
  contractSubstituteFlag = signal<string | null>(null);

  private pendingSubmitAfterAdd = false;

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  resetForm(): void {
    this.currentStep.set(1);
    this.orderData.set({});
    this.orderItems.set([]);
    this.orderNotes.set('');
    this.isStep1Valid.set(false);
    this.customerChanged.emit(false);
    this.cdr.markForCheck();
  }

  onStep1FormDataChange(data: Partial<ExportOrderDto>): void {
    this.orderData.set(data);
    this.customerChanged.emit(!!data.customerId);
  }

  onStep1ValidityChange(valid: boolean): void {
    this.isStep1Valid.set(valid);
  }

  goToStep2(): void {
    if (!this.isStep1Valid()) return;
    this.currentStep.set(2);
  }

  goToStep1(): void {
    this.currentStep.set(1);
  }

  private createOrderWithFirstItem(item: CreateExportOrderItemDto): void {
    const data = this.orderData();
    const request: CreateExportOrderRequestDto = {
      customerId: data.customerId || '',
      orderType: 'EX',
      orderClass: data.priority || '',
      orderedBy: data.orderedBy || '',
      contractId: data.contractId || '',
      orderMode: data.orderMode || '',
      consigneeId: data.consigneeId || '',
      payeeId: data.payeeId || '',
      codFlag: data.codFlag ?? 'N',
      estArrivalTime: data.estArrivalTime || undefined,
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
        this.orderCreated.emit(orderNo);
        this.itemsChanged.emit();
        this.cdr.markForCheck();

        if (this.pendingSubmitAfterAdd) {
          this.pendingSubmitAfterAdd = false;
          this.proceedWithSubmit();
        }
      },
      error: () => {
        this.saving.set(false);
        this.pendingSubmitAfterAdd = false;
        this.snackBar.open('Failed to create export order. Please try again.', 'DISMISS', {
          horizontalPosition: 'end', verticalPosition: 'top', duration: 5000, panelClass: ['error-snackbar']
        });
        this.cdr.markForCheck();
      }
    });
  }

  onItemAdded(item: CreateExportOrderItemDto): void {
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
        this.itemsChanged.emit();
        this.cdr.markForCheck();

        if (this.pendingSubmitAfterAdd) {
          this.pendingSubmitAfterAdd = false;
          this.proceedWithSubmit();
        }
      },
      error: () => {
        this.saving.set(false);
        this.pendingSubmitAfterAdd = false;
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
        this.itemsChanged.emit();
        this.cdr.markForCheck();
      });
    } else {
      this.orderItems.update(items => items.filter(i => i.itemNo !== itemNo));
      this.itemsChanged.emit();
    }
  }

  onSubmitOrder(): void {
    // Auto-flush pending product item if form is filled and valid
    if (this.stepAddProducts?.newItemForm?.dirty && this.stepAddProducts?.newItemForm?.valid) {
      this.pendingSubmitAfterAdd = true;
      this.stepAddProducts.onAddItem();
      // If items already existed before the flush, the new item is just extra;
      // proceed immediately since the order already has items
      if (this.orderItems().length > 0) {
        this.pendingSubmitAfterAdd = false;
        this.proceedWithSubmit();
      }
      // Otherwise, proceedWithSubmit will be called from onItemAdded/createOrderWithFirstItem callback
      return;
    }

    this.proceedWithSubmit();
  }

  private proceedWithSubmit(): void {
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
    const updateDto: UpdateExportOrderRequestDto = { orderStatus: 'RL' };
    this.apiService.updateOrder(orderNo, updateDto).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.saving.set(false);
        this.snackBar.open(`Order Number ${orderNo} is Printing`, 'DISMISS', {
          horizontalPosition: 'end', verticalPosition: 'top', duration: 8000
        });
        this.resetForm();
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

  /** Route guard hook: prompts to cancel empty orders before navigating away */
  canDeactivate(): Observable<boolean> | boolean {
    const orderNo = this.orderData()?.orderNo;
    if (orderNo && this.orderItems().length === 0) {
      const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
        width: '400px',
        disableClose: true,
        data: {
          title: 'Cancel Order',
          message: 'The order has no items and will be cancelled. Do you want to continue?',
          confirmText: 'YES, CANCEL ORDER',
          cancelText: 'STAY'
        }
      });
      return dialogRef.afterClosed().pipe(
        switchMap(confirmed => {
          if (confirmed) {
            return this.apiService.deleteOrder(orderNo).pipe(
              map(() => true),
              catchError(() => of(true))
            );
          }
          return of(false);
        })
      );
    }
    return true;
  }

  onPriceChangeFlagChange(flag: string | null): void {
    this.priceChangeFlag.set(flag);
  }

  onContractSubstituteFlagChange(flag: string | null): void {
    this.contractSubstituteFlag.set(flag);
  }

  onStandingOrderItemsFound(items: StandingOrderItemDto[]): void {
    if (items.length === 0) return;

    const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
      width: '500px',
      disableClose: true,
      data: {
        title: 'Standing Order Items',
        message: `${items.length} standing order item(s) found. Would you like to apply them to this order?`,
        confirmText: 'APPLY',
        cancelText: 'SKIP'
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

  private applyStandingOrderItems(items: StandingOrderItemDto[]): void {
    // Convert standing order items to CreateExportOrderItemDto format
    const orderItems = items.map((item, index) => ({
      itemNo: this.orderItems().length + index + 1,
      productType: item.productType,
      bloodType: item.bloodType,
      bloodTypeDesc: item.bloodTypeDesc,
      tier: item.tier,
      requiredQty: item.requiredQty,
      subOk: item.subOk,
      attribGroup: item.attribGroup,
      attribCode: item.attribCode
    }));

    // If no order yet, we'll include these when creating the first item
    // If order exists, add them one by one
    const orderNo = this.orderData()?.orderNo;
    if (orderNo) {
      // Add sequentially
      this.saving.set(true);
      from(orderItems).pipe(
        concatMap(item => this.apiService.addOrderItem(orderNo, item)),
        toArray(),
        finalize(() => this.saving.set(false))
      ).subscribe({
        next: () => {
          // Refresh items list
          this.apiService.getOrderItems(orderNo).subscribe(refreshedItems => {
            this.orderItems.set(refreshedItems);
            this.itemsChanged.emit();
          });
        },
        error: () => {
          this.snackBar.open('Failed to apply some standing order items', 'Close', {
            duration: 5000, panelClass: 'error-snackbar'
          });
        }
      });
    } else {
      const baseItemNo = this.orderItems().length;
      items.forEach((item, index) => {
        const itemDto: CreateExportOrderItemDto = {
          itemNo: baseItemNo + index + 1,
          productType: item.productType,
          bloodType: item.bloodType,
          bloodTypeDesc: item.bloodTypeDesc,
          tier: item.tier,
          requiredQty: item.requiredQty,
          subOk: item.subOk,
          attribGroup: item.attribGroup,
          attribCode: item.attribCode
        };
        this.onItemAdded(itemDto);
      });
    }
  }

  onOpenOrders(): void {
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
      this.dialog.open(OpenOrdersDialogComponent, {
        position: { right: '0' },
        width: '950px',
        height: '100vh',
        panelClass: 'right-panel-dialog',
        data: { customerId, orders }
      });
    });
  }

  onQueryStocks(): void {
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
    const orderNo = this.orderData()?.orderNo;

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
      disableClose: false,
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
          ).subscribe({
            error: () => {
              this.snackBar.open('Failed to save notes', 'Close', {
                duration: 5000, panelClass: 'error-snackbar'
              });
            }
          });
        }
      }
    });
  }
}
