import {
  Component,
  OnInit,
  OnDestroy,
  Inject,
  signal,
  computed,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil } from 'rxjs';

import { ShipProductsService } from '../../services/ship-products.service';
import { BoxProductDto } from '../../models/ship-products.model';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig } from '@shared/interfaces/data-table.interface';

export interface ViewShippedBoxesDialogData {
  shipmentNo: string;
}

@Component({
  selector: 'app-view-shipped-boxes-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatProgressSpinnerModule,
    DataTable
  ],
  templateUrl: './view-shipped-boxes.html',
  styleUrls: ['./view-shipped-boxes.scss']
})
export class ViewShippedBoxesDialog implements OnInit, OnDestroy {
  private readonly shipProductsService = inject(ShipProductsService);
  private readonly dialogRef = inject(MatDialogRef<ViewShippedBoxesDialog>);

  protected readonly boxProducts = signal<BoxProductDto[]>([]);
  protected readonly loading = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);

  private destroy$ = new Subject<void>();

  readonly tableConfig = computed<DataTableConfig<BoxProductDto>>(() => ({
    columns: [
      { key: 'boxId', header: 'Box ID' },
      { key: 'productCode', header: 'Product' },
      { key: 'orderedAboRh', header: 'Ordered ABO/Rh' },
      { key: 'count', header: 'Count' }
    ],
    stickyHeader: true,
    emptyMessage: 'No products found',
    showPagination: false
  }));

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ViewShippedBoxesDialogData
  ) {}

  ngOnInit(): void {
    this.loadBoxProducts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadBoxProducts(): void {
    this.loading.set(true);
    this.error.set(null);

    this.shipProductsService.getBoxProductsForShipment(this.data.shipmentNo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (products) => {
          this.boxProducts.set(products);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err.error?.message || 'Failed to load box contents');
          this.loading.set(false);
        }
      });
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
