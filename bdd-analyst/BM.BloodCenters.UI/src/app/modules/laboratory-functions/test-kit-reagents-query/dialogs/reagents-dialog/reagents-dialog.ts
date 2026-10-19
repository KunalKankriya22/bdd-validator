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
import { ReagentDetailDto } from '../../models/test-kit-reagents-query.model';

export interface ReagentsDialogData {
  testKitId: string;
  testId: string;
}

@Component({
  selector: 'app-reagents-panel',
  standalone: true,
  imports: [
    CommonModule,
    A11yModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    DataTable,
  ],
  templateUrl: './reagents-dialog.html',
  styleUrl: './reagents-dialog.scss',
})
export class ReagentsDialogComponent implements OnChanges, OnDestroy {
  @Input() row: ReagentsDialogData | null = null;
  @Input() isOpen = false;
  @Output() closePanel = new EventEmitter<void>();

  private readonly apiService = inject(TestKitReagentsQueryApiService);
  private readonly destroy$ = new Subject<void>();

  protected readonly dataSource = signal<ReagentDetailDto[]>([]);
  protected readonly loading = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);

  protected tableConfig: DataTableConfig<ReagentDetailDto> = {
    columns: [],
    rowActions: [],
    showPagination: false
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']?.currentValue === true && this.row) {
      this.initializeTableConfig();
      this.loadReagents();
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
      emptyMessage: 'No reagents found for this test kit.',
      loadingMessage: 'Loading reagent details...',
      showPagination: false
    };
  }

  private getTableColumns(): TableColumn<ReagentDetailDto>[] {
    return [
      {
        key: 'reagentType',
        header: 'Type',
        sortable: false,
        width: '150px',
        valueFormatter: (value) => this.getReagentTypeDisplay(value)
      },
      {
        key: 'reagentDescription',
        header: 'Reagent Description',
        sortable: false,
        width: '300px'
      },
      {
        key: 'masterKitLotNumber',
        header: 'Kit Lot Number',
        sortable: false,
        width: '200px',
        valueFormatter: (value) => value || '--'
      },
      {
        key: 'lotNumber',
        header: 'Lot#',
        sortable: false,
        width: '150px',
        valueFormatter: (value) => value || '--'
      }
    ];
  }

  private loadReagents(): void {
    if (!this.row) return;
    this.loading.set(true);
    this.error.set(null);

    this.apiService.getReagentDetails(this.row.testKitId, this.row.testId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
      next: (data) => {
        this.dataSource.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.errorResponse?.error || 'Failed to load reagent details');
        this.loading.set(false);
      },
    });
  }

  protected close(): void {
    this.closePanel.emit();
  }

  protected getReagentTypeDisplay(type: string): string {
    const typeMap: Record<string, string> = {
      C: 'C - Control',
      R: 'R - Reagent',
      S: 'S - Substrate',
    };
    return typeMap[type] || type;
  }
}
