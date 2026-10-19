import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil } from 'rxjs';

import { OfflineProductShipmentApiService } from '../../services/offline-product-shipment-api.service';
import { ConsigneeInZoneDto } from '../../models/offline-product-shipment.model';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig } from '@shared/interfaces/data-table.interface';
import { SnackbarService } from '@shared/services/snackbar.service';

export interface ViewConsigneesInZoneDialogData {
  consigneeId: string;
  zone: string;
}

@Component({
  selector: 'app-view-consignees-in-zone-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    DataTable
  ],
  templateUrl: './view-consignees-in-zone-dialog.html',
  styleUrl: './view-consignees-in-zone-dialog.scss'
})
export class ViewConsigneesInZoneDialog implements OnInit, OnDestroy {
  // Unique ID generation for accessibility
  private static nextId = 0;
  protected readonly componentId = `view-consignees-in-zone-dialog-${ViewConsigneesInZoneDialog.nextId++}`;

  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;

  // Dependency injection
  private readonly dialogRef = inject(MatDialogRef<ViewConsigneesInZoneDialog>);
  private readonly data = inject<ViewConsigneesInZoneDialogData>(MAT_DIALOG_DATA);
  private readonly apiService = inject(OfflineProductShipmentApiService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly destroy$ = new Subject<void>();

  // Signal-based state
  protected readonly consignees = signal<ConsigneeInZoneDto[]>([]);
  protected readonly loading = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);

  // Computed values
  protected readonly isEmpty = computed(() => this.consignees().length === 0);
  protected readonly isReady = computed(() => !this.loading() && !this.error());
  protected readonly consigneeId = this.data.consigneeId;

  // Data table configuration
  protected tableConfig!: DataTableConfig<ConsigneeInZoneDto>;

  ngOnInit(): void {
    this.initTableConfig();
    this.loadConsignees();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize data table configuration
   */
  private initTableConfig(): void {
    this.tableConfig = {
      columns: [
        {
          key: 'consigneeId',
          header: 'Consignee',
          sortable: false,
          width: '25%'
        },
        {
          key: 'name',
          header: 'Name',
          sortable: false,
          width: '45%'
        },
        {
          key: 'orderClass',
          header: 'Order Type',
          sortable: false,
          width: '15%'
        },
        {
          key: 'orderStatus',
          header: 'Status',
          sortable: false,
          width: '15%'
        }
      ],
      showPagination: true,
      emptyMessage: 'No consignees found in the same zone'
    };
  }

  /**
   * Load consignees in the same zone as the selected consignee
   */
  private loadConsignees(): void {
    this.loading.set(true);
    this.error.set(null);

    this.apiService.getConsigneesInSameZone(this.consigneeId, this.data.zone)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (consignees) => {
          this.consignees.set(consignees);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Failed to load consignees');
          this.loading.set(false);
        }
      });
  }

  /**
   * Close dialog
   */
  onClose(): void {
    this.dialogRef.close();
  }
}
