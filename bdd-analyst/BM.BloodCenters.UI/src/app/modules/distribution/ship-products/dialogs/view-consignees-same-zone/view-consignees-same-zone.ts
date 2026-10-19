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
import { ConsigneeInZoneDto } from '../../models/ship-products.model';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig } from '@shared/interfaces/data-table.interface';

export interface ViewConsigneesSameZoneDialogData {
  consigneeId: string;
}

@Component({
  selector: 'app-view-consignees-same-zone-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatProgressSpinnerModule,
    DataTable
  ],
  templateUrl: './view-consignees-same-zone.html',
  styleUrls: ['./view-consignees-same-zone.scss']
})
export class ViewConsigneesSameZoneDialog implements OnInit, OnDestroy {
  private readonly shipProductsService = inject(ShipProductsService);
  private readonly dialogRef = inject(MatDialogRef<ViewConsigneesSameZoneDialog>);

  protected readonly consignees = signal<ConsigneeInZoneDto[]>([]);
  protected readonly loading = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);

  private destroy$ = new Subject<void>();

  readonly tableConfig = computed<DataTableConfig<ConsigneeInZoneDto>>(() => ({
    columns: [
      { key: 'consigneeId', header: 'Consignee' },
      { key: 'consigneeName', header: 'Name' },
      { key: 'address1', header: 'Address' },
      { key: 'city', header: 'City' },
      { key: 'state', header: 'State' },
      { key: 'zip', header: 'ZIP' },
      { key: 'zone', header: 'Zone' },
      { key: 'orderClass', header: 'Class' },
      { key: 'orderStatus', header: 'Order Status' }
    ],
    stickyHeader: true,
    emptyMessage: 'No consignees found in the same zone',
    showPagination: false
  }));

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ViewConsigneesSameZoneDialogData
  ) {}

  ngOnInit(): void {
    this.loadConsignees();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadConsignees(): void {
    this.loading.set(true);
    this.error.set(null);

    this.shipProductsService.getConsigneesInSameZone(this.data.consigneeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (consignees) => {
          this.consignees.set(consignees);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err.error?.message || 'Failed to load consignees');
          this.loading.set(false);
        }
      });
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
