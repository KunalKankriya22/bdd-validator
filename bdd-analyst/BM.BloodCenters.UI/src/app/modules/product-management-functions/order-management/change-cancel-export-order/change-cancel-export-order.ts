import {
  Component, OnInit, OnDestroy, ViewChild,
  signal, inject, effect, ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, takeUntil, catchError, of } from 'rxjs';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner.component';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { ConfirmActionDialogComponent } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';

import { CcExStepOrderDetailsComponent } from './step-order-details/cc-ex-step-order-details';
import { CcExStepEditProductsComponent } from './step-edit-products/cc-ex-step-edit-products';
import {
  ExportOrderDto,
  ExportOrderItemDto,
  CreateExportOrderItemDto,
  UpdateExportOrderRequestDto
} from '../enter-export-order/models/export-order.model';
import { ExportOrderApiService } from '../enter-export-order/services/export-order-api.service';
import { ConfirmOrderReleaseDialogComponent } from '../enter-regular-order/dialogs/confirm-order-release-dialog/confirm-order-release-dialog';
import { EnterCommentsDialogComponent } from '../enter-regular-order/dialogs/enter-comments-dialog/enter-comments-dialog';
import { SpecialChargesDialogComponent } from '../enter-regular-order/dialogs/special-charges-dialog/special-charges-dialog';

@Component({
  selector: 'app-change-cancel-export-order',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    PageHeaderWithBreadcrumb,
    LoadingSpinnerComponent,
    CcExStepOrderDetailsComponent,
    CcExStepEditProductsComponent
  ],
  templateUrl: './change-cancel-export-order.html',
  styleUrls: ['./change-cancel-export-order.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChangeCancelExportOrderComponent implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `change-cancel-export-order-${ChangeCancelExportOrderComponent.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;

  private readonly apiService = inject(ExportOrderApiService);
  private readonly headerService = inject(HeaderService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  @ViewChild(CcExStepOrderDetailsComponent) stepOrderDetails!: CcExStepOrderDetailsComponent;
  @ViewChild(CcExStepEditProductsComponent) stepEditProducts!: CcExStepEditProductsComponent;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
    actions: [
      { label: 'CANCEL ORDER', matButton: 'stroked', ariaLabel: 'Cancel entire export order', disabled: true, onClick: () => this.onCancelOrder() },
      { label: 'ADD NOTES', matButton: 'stroked', ariaLabel: 'Add notes to export order', disabled: true, onClick: () => this.onAddNotes() },
      { label: 'CHARGES', matButton: 'stroked', ariaLabel: 'View special charges', disabled: true, onClick: () => this.onCharges() }
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
  isReadOnly = signal<boolean>(false);

  orderData = signal<Partial<ExportOrderDto>>({});
  orderItems = signal<ExportOrderItemDto[]>([]);
  orderNotes = signal<string>('');

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

  resetForm(): void {
    this.currentStep.set(1);
    this.orderData.set({});
    this.orderItems.set([]);
    this.orderNotes.set('');
    this.isStep1Valid.set(false);
    this.isReadOnly.set(false);
    this.updateActionButtonStates(false);
    this.cdr.markForCheck();
  }

  onStep1FormDataChange(data: Partial<ExportOrderDto>): void {
    this.orderData.update(existing => ({ ...existing, ...data }));
  }

  onStep1ValidityChange(valid: boolean): void {
    this.isStep1Valid.set(valid);
  }

  onOrderLoaded(data: { order: ExportOrderDto; items: ExportOrderItemDto[] }): void {
    this.orderData.set(data.order);
    this.orderItems.set(data.items);
    this.isReadOnly.set(
      data.order.orderStatus === 'CA' || data.order.orderStatus === 'SH' ||
      data.order.orderStatus === 'CL' || data.order.orderStatus === 'DL'
    );
    this.updateActionButtonStates(true);
    this.cdr.markForCheck();
  }

  private updateActionButtonStates(hasOrder: boolean): void {
    if (this.headerConfig.actions) {
      this.headerConfig.actions.forEach(action => {
        action.disabled = !hasOrder;
      });
      this.headerConfig = { ...this.headerConfig };
    }
  }

  goToStep2(): void {
    if (!this.isStep1Valid()) return;
    this.currentStep.set(2);
  }

  goToStep1(): void {
    this.currentStep.set(1);
  }

  onItemAdded(item: CreateExportOrderItemDto): void {
    const orderNo = this.orderData().orderNo;
    if (!orderNo) return;

    this.saving.set(true);
    this.apiService.addOrderItem(orderNo, item).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (allItems) => {
        this.saving.set(false);
        this.orderItems.set(allItems || []);
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

  onItemDeleted(itemNo: number): void {
    const orderNo = this.orderData().orderNo;
    if (!orderNo) return;

    this.apiService.deleteOrderItem(orderNo, itemNo).pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.orderItems.update(items => items.filter(i => i.itemNo !== itemNo));
      this.cdr.markForCheck();
    });
  }

  onItemCanceled(itemNo: number): void {
    const orderNo = this.orderData().orderNo;
    if (!orderNo) return;

    this.saving.set(true);
    this.apiService.cancelOrderItem(orderNo, itemNo).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (updatedItems) => {
        this.saving.set(false);
        this.orderItems.set(updatedItems || []);
        this.snackBar.open(`Item ${itemNo} has been canceled.`, 'DISMISS', {
          horizontalPosition: 'end', verticalPosition: 'top', duration: 5000
        });
        this.cdr.markForCheck();
      },
      error: () => {
        this.saving.set(false);
        this.snackBar.open('Failed to cancel item. Please try again.', 'DISMISS', {
          horizontalPosition: 'end', verticalPosition: 'top', duration: 5000, panelClass: ['error-snackbar']
        });
        this.cdr.markForCheck();
      }
    });
  }

  onCancelOrder(): void {
    const orderNo = this.orderData().orderNo;
    if (!orderNo) return;

    const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
      width: '500px',
      disableClose: true,
      data: {
        title: 'Cancel Export Order',
        message: `Are you sure you want to cancel export order ${orderNo}? This action cannot be undone.`,
        confirmText: 'YES, CANCEL ORDER',
        cancelText: 'NO, KEEP ORDER'
      }
    });

    dialogRef.afterClosed().pipe(
      takeUntil(this.destroy$)
    ).subscribe(confirmed => {
      if (confirmed) {
        this.saving.set(true);
        this.apiService.deleteOrder(orderNo).pipe(
          takeUntil(this.destroy$)
        ).subscribe({
          next: () => {
            this.saving.set(false);
            this.snackBar.open(`Export order ${orderNo} has been canceled.`, 'DISMISS', {
              horizontalPosition: 'end', verticalPosition: 'top', duration: 8000
            });
            this.resetForm();
            this.cdr.markForCheck();
          },
          error: () => {
            this.saving.set(false);
            this.snackBar.open('Failed to cancel order. Please try again.', 'DISMISS', {
              horizontalPosition: 'end', verticalPosition: 'top', duration: 5000, panelClass: ['error-snackbar']
            });
            this.cdr.markForCheck();
          }
        });
      }
    });
  }

  onAddNotes(): void {
    const orderNo = this.orderData().orderNo;
    if (!orderNo) return;

    this.apiService.getOrderNotes(orderNo).pipe(
      takeUntil(this.destroy$),
      catchError(() => of(null))
    ).subscribe(noteData => {
      this.openNotesDialog(orderNo, noteData?.note || this.orderNotes());
    });
  }

  private openNotesDialog(orderNo: string, notes: string): void {
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
        this.apiService.saveOrderNotes(orderNo, result).pipe(
          takeUntil(this.destroy$)
        ).subscribe({
          next: () => {
            this.snackBar.open('Notes saved successfully.', 'DISMISS', {
              horizontalPosition: 'end', verticalPosition: 'top', duration: 5000
            });
          },
          error: () => {
            this.snackBar.open('Failed to save notes. Please try again.', 'DISMISS', {
              horizontalPosition: 'end', verticalPosition: 'top', duration: 5000, panelClass: ['error-snackbar']
            });
          }
        });
      }
    });
  }

  onCharges(): void {
    const orderNo = this.orderData().orderNo;
    if (!orderNo) return;

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

  onReleaseOrder(): void {
    if (this.stepEditProducts?.hasPendingItem()) {
      if (!this.stepEditProducts.tryFlushPendingItem()) {
        return;
      }
    }

    if (this.orderItems().length === 0) {
      this.snackBar.open('No items in this order.', 'DISMISS', {
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
        this.snackBar.open(`Export Order Number ${orderNo} is Printing`, 'DISMISS', {
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
}
