import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil } from 'rxjs';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig } from '@shared/interfaces/data-table.interface';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner.component';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HttpErrorHandler } from '@shared/utils/error-handler.utils';
import { OrderDetailDto } from '../../models/shipments-by-ship-date.model';
import { ShipmentsByShipDateService } from '../../services/shipments-by-ship-date.service';

export interface ViewOrderDetailsDialogData {
  shipmentNo: string;
}

@Component({
  selector: 'app-view-order-details',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, DataTable, LoadingSpinnerComponent],
  templateUrl: './view-order-details.html',
  styleUrl: './view-order-details.scss',
})
export class ViewOrderDetailsDialog implements OnInit, OnDestroy {
  readonly data = inject<ViewOrderDetailsDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<ViewOrderDetailsDialog>);
  private readonly apiService = inject(ShipmentsByShipDateService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly destroy$ = new Subject<void>();

  protected readonly orders = signal<OrderDetailDto[]>([]);
  protected readonly loading = signal<boolean>(false);

  protected readonly tableConfig = computed<DataTableConfig<OrderDetailDto>>(() => ({
    columns: [
      { key: 'orderNo', header: 'Order Number', sortable: false, width: '160px' },
      { key: 'orderStatusDesc', header: 'Order Status', sortable: false, width: '140px' },
    ],
    showPagination: false,
    stickyHeader: true,
    emptyMessage: 'No order details found',
  }));

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadData(): void {
    this.loading.set(true);
    this.apiService
      .getOrderDetails(this.data.shipmentNo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (orders) => {
          this.orders.set(orders);
          this.loading.set(false);
        },
        error: (error) => {
          this.loading.set(false);
          this.snackbarService.showError(
            HttpErrorHandler.extractErrorMessage(error, 'Failed to load order details.')
          );
        },
      });
  }

  protected onClose(): void {
    this.dialogRef.close();
  }
}
