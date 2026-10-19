import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil } from 'rxjs';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TableSortEvent } from '@shared/interfaces/data-table.interface';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner.component';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HttpErrorHandler } from '@shared/utils/error-handler.utils';
import { BoxDetailDto } from '../../models/shipments-by-ship-date.model';
import { ShipmentsByShipDateService } from '../../services/shipments-by-ship-date.service';
import moment from 'moment';

export interface ViewBoxDetailsDialogData {
  shipmentNo: string;
}

@Component({
  selector: 'app-view-box-details',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, DataTable, LoadingSpinnerComponent],
  templateUrl: './view-box-details.html',
  styleUrl: './view-box-details.scss',
})
export class ViewBoxDetailsDialog implements OnInit, OnDestroy {
  readonly data = inject<ViewBoxDetailsDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<ViewBoxDetailsDialog>);
  private readonly apiService = inject(ShipmentsByShipDateService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly destroy$ = new Subject<void>();

  protected readonly boxes = signal<BoxDetailDto[]>([]);
  protected readonly originalBoxes = signal<BoxDetailDto[]>([]);
  protected readonly loading = signal<boolean>(false);
  private readonly sortDirection = signal<'A' | 'D' | 'default'>('default');

  protected readonly tableConfig = computed<DataTableConfig<BoxDetailDto>>(() => {
    const count = this.boxes().length;
    return {
      columns: [
        { key: 'boxId', header: `Box ID (${count})`, sortable: true, width: '120px' },
        { key: 'boxType', header: 'Box Type', sortable: false, width: '100px' },
        {
          key: 'packedDate',
          header: 'Packed Date',
          sortable: false,
          width: '140px',
          valueFormatter: (value: string) => this.formatDate(value),
        },
        { key: 'packedBy', header: 'Packed By', sortable: false, width: '120px' },
        { key: 'temperature', header: 'Temperature', sortable: false, width: '120px' },
        {
          key: 'closedDate',
          header: 'Closed Date',
          sortable: false,
          width: '140px',
          valueFormatter: (value: string) => this.formatDate(value),
        },
      ],
      showPagination: false,
      stickyHeader: true,
      emptyMessage: 'No box details found',
      sortConfig: { column: 'boxId', direction: this.sortDirection() },
    };
  });

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
      .getBoxDetails(this.data.shipmentNo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (boxes) => {
          this.originalBoxes.set(boxes);
          this.boxes.set(boxes);
          this.loading.set(false);
        },
        error: (error) => {
          this.loading.set(false);
          this.snackbarService.showError(
            HttpErrorHandler.extractErrorMessage(error, 'Failed to load box details.')
          );
        },
      });
  }

  protected onSortChange(event: TableSortEvent): void {
    this.sortDirection.set(event.direction);
    const current = [...this.boxes()];
    if (event.direction === 'default') {
      this.boxes.set(this.originalBoxes());
      return;
    }
    current.sort((a, b) => {
      const valA = (a.boxId || '').toLowerCase();
      const valB = (b.boxId || '').toLowerCase();
      const cmp = valA.localeCompare(valB);
      return event.direction === 'A' ? cmp : -cmp;
    });
    this.boxes.set(current);
  }

  protected onClose(): void {
    this.dialogRef.close();
  }

  private formatDate(value: string | null): string {
    if (!value) return '';
    const m = moment(value);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : value;
  }
}
