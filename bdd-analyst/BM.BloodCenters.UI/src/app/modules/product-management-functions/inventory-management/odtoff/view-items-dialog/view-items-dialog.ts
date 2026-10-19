import { Component, Inject, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil } from 'rxjs';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TableColumn,
  TablePageEvent,
  TableSortEvent,
} from '@shared/interfaces/data-table.interface';
import { PickSlipProductDto } from '../models/odtoff.model';
import { OdtoffApiService } from '../services/odtoff-api.service';

export interface ViewItemsDialogData {
  pickSlipId: string;
}

@Component({
  selector: 'app-view-items-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    DataTable,
  ],
  templateUrl: './view-items-dialog.html',
  styleUrl: './view-items-dialog.scss',
})
export class ViewItemsDialogComponent implements OnInit, OnDestroy {
  private readonly apiService = inject(OdtoffApiService);
  private readonly destroy$ = new Subject<void>();

  tableConfig: DataTableConfig<PickSlipProductDto>;
  products: PickSlipProductDto[] = [];
  loading = false;

  private pageSize = 25;
  private pageIndex = 0;
  private sortColumn: string | null = 'expirationDate';
  private sortOrder: string | null = 'A';

  constructor(
    public dialogRef: MatDialogRef<ViewItemsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ViewItemsDialogData,
  ) {
    const columns: TableColumn<PickSlipProductDto>[] = [
      { key: 'unitId', header: 'Unit ID', sortable: true, valueFormatter: (_v, row) => row.checkDigit ? `${row.unitId}-${row.checkDigit}` : row.unitId },
      { key: 'productType', header: 'Product Type', sortable: false },
      { key: 'productStatusDescription', header: 'Status', sortable: false },
    ];

    this.tableConfig = {
      columns,
      caption: 'Pick slip products',
      pagination: {
        pageSize: this.pageSize,
        pageIndex: 0,
        totalRecords: 0,
        pageSizeOptions: [10, 25, 50, 100],
        showFirstLastButtons: true,
      },
      stickyHeader: true,
      emptyMessage: 'No products found on this pick slip.',
      showPagination: true,
    };
  }

  ngOnInit(): void {
    this.loadProducts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onClose(): void {
    this.dialogRef.close();
  }

  onPageChange(event: TablePageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadProducts();
  }

  onSortChange(event: TableSortEvent): void {
    const prevDirection = this.tableConfig.sortConfig?.column === event.column
      ? this.tableConfig.sortConfig?.direction
      : null;

    // The shared DataTable cycles D→A, but the required cycle is default→A→D→default
    const effectiveDirection = (prevDirection === 'D' && event.direction === 'A')
      ? 'default' as const
      : event.direction;

    if (effectiveDirection === 'default') {
      this.sortColumn = null;
      this.sortOrder = null;
    } else {
      this.sortColumn = event.column;
      this.sortOrder = effectiveDirection;
    }

    this.tableConfig = {
      ...this.tableConfig,
      sortConfig: { column: event.column, direction: effectiveDirection },
    };

    this.pageIndex = 0;
    this.loadProducts();
  }

  private loadProducts(): void {
    this.loading = true;
    const skip = this.pageIndex * this.pageSize;

    this.apiService
      .getPickSlipProductsPaged(this.data.pickSlipId, this.pageSize, skip, this.sortColumn, this.sortOrder)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const total = response.total || 0;
          this.products = response.data || [];
          this.tableConfig = {
            ...this.tableConfig,
            columns: this.tableConfig.columns.map((col) =>
              col.key === 'unitId' ? { ...col, header: `Unit ID (${total})` } : col
            ),
            pagination: {
              ...this.tableConfig.pagination!,
              pageIndex: this.pageIndex,
              pageSize: this.pageSize,
              totalRecords: total,
            },
          };
          this.loading = false;
        },
        error: () => {
          this.products = [];
          this.loading = false;
        },
      });
  }
}
