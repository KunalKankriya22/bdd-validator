import { Component, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil } from 'rxjs';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HttpErrorHandler } from '@shared/utils/error-handler.utils';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig } from '@shared/interfaces/data-table.interface';
import { OrderItemsDialogData, OrderItemDto } from '../../models/enter-order-charges.model';
import { EnterOrderChargesApiService } from '../../services/enter-order-charges-api.service';
import { AttributesAntigensDialogComponent } from '../attributes-antigens-dialog/attributes-antigens-dialog';

@Component({
  selector: 'app-order-items-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, DataTable],
  templateUrl: './order-items-dialog.html',
  styleUrls: ['./order-items-dialog.scss'],
})
export class OrderItemsDialogComponent implements OnDestroy {
  readonly data = inject<OrderItemsDialogData>(MAT_DIALOG_DATA);

  itemsTableConfig: DataTableConfig<OrderItemDto> = {
    columns: [
      { key: 'itemNo', header: 'Item' },
      { key: 'product', header: 'Product' },
      { key: 'aboRh', header: 'ABORh' },
      { key: 'requiredQuantity', header: 'Required Quantity' },
      { key: 'canceledQuantity', header: 'Canceled Quantity' },
      {
        key: 'unitPrice',
        header: 'Unit Price ($)',
        valueFormatter: (val: number) => val != null ? `$${val.toFixed(2)}` : '$0.00',
      },
    ],
    showPagination: false,
    showTableOnEmpty: true,
    emptyMessage: 'No items found.',
    caption: 'Order items',
  };
  private readonly dialogRef = inject(MatDialogRef<OrderItemsDialogComponent>);
  private readonly dialog = inject(MatDialog);
  private readonly apiService = inject(EnterOrderChargesApiService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly destroy$ = new Subject<void>();

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onAttributesAntigens(): void {
    this.apiService.getItemAttributesAntigens(this.data.orderNo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.item) {
            this.dialog.open(AttributesAntigensDialogComponent, {
              position: { right: '0', top: '64px' },
              width: '750px',
              height: 'calc(100vh - 64px)',
              panelClass: 'right-panel-dialog',
              backdropClass: 'right-panel-backdrop',
              disableClose: true,
              autoFocus: 'first-tabbable',
              restoreFocus: true,
              ariaLabelledBy: 'attr-antigens-dialog-title',
              data: {
                antigens: response.item.antigens ?? [],
                attributes: response.item.attributes ?? [],
              },
            });
          } else {
            const msg = response.errorResponse?.error || response.message || 'No data found.';
            this.snackbarService.showError(msg);
          }
        },
        error: (error) => {
          this.snackbarService.showError(
            HttpErrorHandler.extractErrorMessage(error, 'Failed to load attributes & antigens.'),
          );
        },
      });
  }
}
