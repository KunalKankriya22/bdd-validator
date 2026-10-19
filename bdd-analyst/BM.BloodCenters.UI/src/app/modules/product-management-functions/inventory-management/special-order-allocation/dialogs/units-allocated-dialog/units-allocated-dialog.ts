import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig } from '@shared/interfaces/data-table.interface';
import { SpecialOrderAllocationService } from '../../services/special-order-allocation.service';
import { AllocatedUnitRow } from '../../models/special-order-allocation.model';

export interface UnitsAllocatedDialogData {
  orderNo: string;
  itemNo: number;
}

@Component({
  selector: 'app-units-allocated-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    DataTable
  ],
  templateUrl: './units-allocated-dialog.html',
  styleUrl: './units-allocated-dialog.scss'
})
export class UnitsAllocatedDialog implements OnInit {
  private static nextId = 0;
  readonly componentId = `units-allocated-dialog-${UnitsAllocatedDialog.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;

  private readonly dialogRef = inject(MatDialogRef<UnitsAllocatedDialog>);
  private readonly data = inject<UnitsAllocatedDialogData>(MAT_DIALOG_DATA);
  private readonly service = inject(SpecialOrderAllocationService);

  readonly allocatedUnits = signal<AllocatedUnitRow[]>([]);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  tableConfig: DataTableConfig<AllocatedUnitRow> = {
    columns: [
      { key: 'itemNo', header: 'Item' },
      { key: 'unitId', header: 'Unit ID' },
      { key: 'productCode', header: 'Product' },
      { key: 'aliquot', header: 'Al' },
      { key: 'expirationDate', header: 'Exp Date' },
      { key: 'warehouse', header: 'W' }
    ],
    showPagination: false,
    emptyMessage: 'No allocated units found for this item.'
  };

  ngOnInit(): void {
    this.loadAllocatedUnits();
  }

  private loadAllocatedUnits(): void {
    this.loading.set(true);
    this.error.set(null);

    this.service.getAllocatedUnits(this.data.orderNo, this.data.itemNo)
      .subscribe({
        next: (units) => {
          const rows: AllocatedUnitRow[] = units.map(u => ({
            itemNo: u.itemNo,
            unitId: u.unitId || '',
            productCode: u.productCode || '',
            aliquot: u.aliquot || '',
            expirationDate: this.formatDate(u.expirationDate),
            warehouse: u.warehouse || '',
            pickSlipId: ''
          }));
          this.allocatedUnits.set(rows);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err.message || 'Failed to load allocated units');
          this.loading.set(false);
        }
      });
  }

  private formatDate(dateStr: string | null): string {
    if (!dateStr) return '--';
    try {
      const date = new Date(dateStr);
      const day = date.getDate();
      const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
      const year = date.getFullYear();
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${day}-${month}-${year}, ${hours}:${minutes}`;
    } catch {
      return dateStr;
    }
  }

  onExit(): void {
    this.dialogRef.close();
  }
}
