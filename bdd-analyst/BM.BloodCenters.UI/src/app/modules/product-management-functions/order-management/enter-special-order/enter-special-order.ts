import {
  Component, OnInit, OnDestroy, ViewChild, Output, EventEmitter,
  signal, inject, ChangeDetectionStrategy, ChangeDetectorRef, HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, Observable, takeUntil, catchError, of, switchMap, map } from 'rxjs';
import moment from 'moment';

import { LoadingSpinnerComponent } from '@shared/components/loading-spinner.component';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { ConfirmActionDialogComponent } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';

import { SpStepOrderDetailsComponent } from './step-order-details/sp-step-order-details';
import { SpStepAddProductsComponent } from './step-add-products/sp-step-add-products';
import {
  SpecialOrderDto,
  SpecialOrderItemDto,
  CreateSpecialOrderRequestDto,
  CreateSpecialOrderItemDto,
  UpdateSpecialOrderRequestDto
} from './models/special-order.model';
import { SpecialOrderApiService } from './services/special-order-api.service';
import { SpOpenOrdersDialogComponent } from './dialogs/sp-open-orders-dialog/sp-open-orders-dialog';
import { SpecialChargesDialogComponent } from '../enter-regular-order/dialogs/special-charges-dialog/special-charges-dialog';
import { EnterCommentsDialogComponent } from '../enter-regular-order/dialogs/enter-comments-dialog/enter-comments-dialog';
import { InventoryDialogComponent } from '../enter-regular-order/dialogs/inventory-dialog/inventory-dialog';
import { ConfirmOrderReleaseDialogComponent } from '../enter-regular-order/dialogs/confirm-order-release-dialog/confirm-order-release-dialog';

@Component({
  selector: 'app-enter-special-order',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    LoadingSpinnerComponent,
    SpStepOrderDetailsComponent,
    SpStepAddProductsComponent
  ],
  templateUrl: './enter-special-order.html',
  styleUrls: ['./enter-special-order.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EnterSpecialOrderComponent implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `enter-special-order-${EnterSpecialOrderComponent.nextId++}`;

  private readonly apiService = inject(SpecialOrderApiService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);
  private readonly destroy$ = new Subject<void>();

  @ViewChild(SpStepOrderDetailsComponent) stepOrderDetails!: SpStepOrderDetailsComponent;
  @ViewChild(SpStepAddProductsComponent) stepAddProducts!: SpStepAddProductsComponent;

  @Output() customerChanged = new EventEmitter<boolean>();
  @Output() orderCreated = new EventEmitter<string>();
  @Output() itemsChanged = new EventEmitter<void>();

  currentStep = signal<number>(1);
  loading = signal<boolean>(false);
  saving = signal<boolean>(false);
  isStep1Valid = signal<boolean>(false);

  orderData = signal<Partial<SpecialOrderDto>>({});
  orderItems = signal<SpecialOrderItemDto[]>([]);
  orderNotes = signal<string>('');

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    const orderNo = this.orderData().orderNo;
    if (orderNo && this.orderItems().length === 0) {
      event.preventDefault();
    }
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    // Gap #11: Auto-cancel empty orders on component destroy
    const orderNo = this.orderData().orderNo;
    if (orderNo && this.orderItems().length === 0) {
      this.apiService.cancelOrder(orderNo).subscribe();
    }
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

  /** Route guard hook: prompts to cancel empty orders before navigating away */
  canDeactivate(): Observable<boolean> | boolean {
    const orderNo = this.orderData().orderNo;
    if (orderNo && this.orderItems().length === 0) {
      const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
        width: '400px',
        disableClose: true,
        data: {
          title: 'Cancel Order',
          message: 'No items in order. Cancel order?',
          confirmText: 'YES',
          cancelText: 'NO'
        }
      });
      return dialogRef.afterClosed().pipe(
        switchMap(confirmed => {
          if (confirmed) {
            return this.apiService.cancelOrder(orderNo).pipe(
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

  onStep1FormDataChange(data: Partial<SpecialOrderDto>): void {
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

  private createOrderThenAddItem(item: CreateSpecialOrderItemDto): void {
    const data = this.orderData();
    const request: CreateSpecialOrderRequestDto = {
      customerId: data.customerId || '',
      orderType: 'SP',
      orderClass: data.priority || '',
      orderedBy: data.orderedBy || '',
      contractId: data.contractId || '',
      orderMode: data.orderMode || '',
      consigneeId: data.consigneeId || '',
      payeeId: data.payeeId || '',
      patientName: data.patientName || '',
      doctorName: data.doctorName,
      notes: data.notes
    };

    this.saving.set(true);
    this.apiService.createOrder(request).pipe(
      takeUntil(this.destroy$),
      switchMap((result: any) => {
        const orderNo = result?.orderNo || result?.OrderNo || '';
        this.orderData.update(d => ({ ...d, orderNo }));
        this.orderCreated.emit(orderNo);
        return this.apiService.addOrderItem(orderNo, item);
      })
    ).subscribe({
      next: (allItems) => {
        this.saving.set(false);
        this.orderItems.set(allItems || []);
        this.itemsChanged.emit();
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

  onItemAdded(item: CreateSpecialOrderItemDto): void {
    const orderNo = this.orderData().orderNo;

    if (!orderNo) {
      this.createOrderThenAddItem(item);
      return;
    }

    this.saving.set(true);
    this.apiService.addOrderItem(orderNo, item).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (allItems) => {
        this.saving.set(false);
        this.orderItems.set(allItems || []);
        this.itemsChanged.emit();
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
        this.itemsChanged.emit();
        this.cdr.markForCheck();
      });
    } else {
      this.orderItems.update(items => items.filter(i => i.itemNo !== itemNo));
      this.itemsChanged.emit();
    }
  }

  onSubmitOrder(): void {
    if (this.orderItems().length === 0) {
      this.snackBar.open('Please add at least one product item.', 'DISMISS', {
        horizontalPosition: 'end', verticalPosition: 'top', duration: 5000, panelClass: ['error-snackbar']
      });
      return;
    }

    // Gap #1: Validate each item has at least one antigen or attribute
    const items = this.orderItems();
    for (const item of items) {
      const hasAntigen = !!(item.antigenId);
      const hasAttribute = !!(item.attribGroup && item.attribCode);
      if (!hasAntigen && !hasAttribute) {
        this.snackBar.open(
          `Item ${item.itemNo}: An attribute or antigen must be entered for custom order items`,
          'DISMISS',
          { horizontalPosition: 'end', verticalPosition: 'top', duration: 5000, panelClass: ['error-snackbar'] }
        );
        return;
      }
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
    const updateDto: UpdateSpecialOrderRequestDto = { orderStatus: 'RL' };
    this.apiService.updateOrder(orderNo, updateDto).pipe(
      switchMap(() => this.apiService.getOrder(orderNo)),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (order) => {
        this.saving.set(false);
        // Gap #9: Display EST_ARRIVAL_TIME after order release
        if (order?.estArrivalTime) {
          const gmtMoment = moment.utc(order.estArrivalTime);
          const localMoment = this.chapterTimezoneService.convertGmtToLocal(gmtMoment);
          const formatted = localMoment.format('D-MMM-YYYY, hh:mm A').toUpperCase();
          this.orderData.update(d => ({ ...d, estArrivalTime: formatted }));
        }
        this.snackBar.open(`Order Number ${orderNo} is Printing`, 'DISMISS', {
          horizontalPosition: 'end', verticalPosition: 'top', duration: 8000
        });
        this.goToStep1();
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
    const customerId = this.orderData().customerId;
    if (!customerId) return;

    this.apiService.getOpenOrderItems(customerId).pipe(
      takeUntil(this.destroy$),
      catchError(() => of([]))
    ).subscribe(items => {
      const orders = (items || []).map((item: any) => ({
        orderNumber: item.orderNo,
        item: item.itemNo,
        productType: item.productType,
        abORh: item.bloodTypeDesc || item.bloodType || '--',
        quantityRequired: item.requiredQty,
        quantityAl: item.allocatedQty ?? 0,
        date: item.insertDate,
        hours: item.hoursElapsed ?? 0,
        attribute: item.attribDesc || (item.attribGroup && item.attribCode ? `${item.attribGroup}/${item.attribCode}` : item.attribute || '--'),
        antigenId: item.antigenDesc || item.antigenId || '--'
      }));
      this.dialog.open(SpOpenOrdersDialogComponent, {
        position: { right: '0' },
        width: '1200px',
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
}
