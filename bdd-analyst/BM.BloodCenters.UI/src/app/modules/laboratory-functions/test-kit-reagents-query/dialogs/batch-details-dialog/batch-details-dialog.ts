import { Component, Input, Output, EventEmitter, inject, signal, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { A11yModule } from '@angular/cdk/a11y';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TableColumn,
} from '@shared/interfaces/data-table.interface';

import { TestKitReagentsQueryApiService } from '../../services/test-kit-reagents-query-api.service';
import { BatchDetailDto } from '../../models/test-kit-reagents-query.model';

export interface BatchDetailsDialogData {
  testKitId: string;
}

@Component({
  selector: 'app-batch-details-panel',
  standalone: true,
  imports: [
    CommonModule,
    A11yModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    DataTable,
  ],
  templateUrl: './batch-details-dialog.html',
  styleUrl: './batch-details-dialog.scss',
})
export class BatchDetailsDialogComponent implements OnChanges, OnDestroy {
  @Input() row: BatchDetailsDialogData | null = null;
  @Input() isOpen = false;
  @Output() closePanel = new EventEmitter<void>();

  private readonly apiService = inject(TestKitReagentsQueryApiService);
  private readonly destroy$ = new Subject<void>();

  protected readonly dataSource = signal<BatchDetailDto[]>([]);
  protected readonly loading = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);

  protected testKitId = '';

  protected tableConfig: DataTableConfig<BatchDetailDto> = {
    columns: [],
    rowActions: [],
    showPagination: false
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']?.currentValue === true && this.row) {
      this.testKitId = this.row.testKitId;
      this.initializeTableConfig();
      this.loadBatches();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeTableConfig(): void {
    this.tableConfig = {
      columns: this.getTableColumns(),
      rowActions: [],
      stickyHeader: true,
      emptyMessage: 'No batches found for this test kit.',
      loadingMessage: 'Loading batch details...',
      showPagination: false
    };
  }

  private getTableColumns(): TableColumn<BatchDetailDto>[] {
    return [
      {
        key: 'tbId',
        header: 'Batch ID',
        sortable: false,
        width: '200px'
      },
      {
        key: 'firstUnitId',
        header: 'First Unit ID',
        sortable: false,
        width: '250px',
        valueFormatter: (_value, row) => this.formatUnitIdWithCheckDigit(row?.firstUnitId, row?.firstChkDigit)
      },
      {
        key: 'lastUnitId',
        header: 'Last Unit ID',
        sortable: false,
        width: '250px',
        valueFormatter: (_value, row) => this.formatUnitIdWithCheckDigit(row?.lastUnitId, row?.lastChkDigit)
      }
    ];
  }

  private formatUnitIdWithCheckDigit(unitId: string | null | undefined, chkDigit: string | null | undefined): string {
    if (!unitId) return '';
    return chkDigit ? `${unitId}-${chkDigit}` : unitId;
  }

  private loadBatches(): void {
    if (!this.row) return;
    this.loading.set(true);
    this.error.set(null);

    this.apiService.getBatchDetails(this.row.testKitId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
      next: (data) => {
        this.dataSource.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.errorResponse?.error || 'Failed to load batch details');
        this.loading.set(false);
      },
    });
  }

  protected close(): void {
    this.closePanel.emit();
  }
}
