import { Component, Inject, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { Subject, takeUntil } from 'rxjs';

import { ViewConsigneesDialogData, ConsigneeInSameZone } from '../../models/ship-discard-salvage.model';
import { ShipDiscardSalvageApiService } from '../../services/ship-discard-salvage-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TableSortEvent } from '@shared/interfaces/data-table.interface';

@Component({
  selector: 'app-view-consignees-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    DataTable,
  ],
  templateUrl: './view-consignees-dialog.html',
  styleUrl: './view-consignees-dialog.scss',
})
export class ViewConsigneesDialogComponent implements OnDestroy {
  private readonly dialogRef = inject(MatDialogRef<ViewConsigneesDialogComponent>);
  private readonly apiService = inject(ShipDiscardSalvageApiService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly destroy$ = new Subject<void>();

  protected readonly consignees = signal<ConsigneeInSameZone[]>([]);
  protected readonly loading = signal<boolean>(false);

  protected tableConfig: DataTableConfig<ConsigneeInSameZone> = {
    columns: [
      { key: 'consigneeId', header: 'Consignee', sortable: true },
      { key: 'consigneeName', header: 'Name' },
      { key: 'orderClass', header: 'Order Class' },
      { key: 'orderStatus', header: 'Order Status' },
      { key: 'orderStatusDesc', header: 'Status' },
    ],
    sortConfig: { column: 'consigneeId', direction: 'D' },
    emptyMessage: 'No consignees found in the same zone',
  };

  constructor(@Inject(MAT_DIALOG_DATA) public data: ViewConsigneesDialogData) {
    this.loadConsignees();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadConsignees(): void {
    this.loading.set(true);

    this.apiService.getZoneConsignees(this.data.consigneeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (consignees) => {
          this.consignees.set(consignees);
          this.loading.set(false);
        },
        error: () => {
          this.snackbarService.showError('Failed to load consignees in same zone');
          this.loading.set(false);
        },
      });
  }

  onSortChange(event: TableSortEvent): void {
    this.tableConfig = {
      ...this.tableConfig,
      sortConfig: { column: event.column, direction: event.direction },
    };
    this.consignees.update(items => [...items].sort((a, b) => {
      const valA = String((a as any)[event.column] ?? '');
      const valB = String((b as any)[event.column] ?? '');
      const cmp = valA.localeCompare(valB);
      return event.direction === 'A' ? cmp : -cmp;
    }));
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
