import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil } from 'rxjs';

import { SpAntigenRarityService } from './services/sp-antigen-rarity.service';
import {
  SpAntigenRarity,
  SpAntigenRarityParamsDto
} from './models/sp-antigen-rarity.model';

import { HeaderService } from '@shared/services/header.service';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TableColumn,
  RowAction,
  TablePageEvent,
  TableRowActionEvent,
  TableSortEvent
} from '@shared/interfaces/data-table.interface';
import { LoggingService } from '@shared/services/logging.service';
import { SnackbarService } from '@shared/services/snackbar.service';

/**
 * SP' Antigen Rarities Component (Child of Special Processing Antigen Grouping and Rarity)
 */
@Component({
  selector: 'app-sp-antigen-rarities',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    DataTable
  ],
  templateUrl: './sp-antigen-rarities.component.html',
  styleUrls: ['./sp-antigen-rarities.component.scss']
})
export class SpAntigenRaritiesComponent implements OnInit, OnDestroy {
  tableConfig: DataTableConfig<SpAntigenRarity> = {
    columns: [],
    rowActions: [],
    pagination: {
      pageSize: 25,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50, 100],
      showFirstLastButtons: true
    },
    stickyHeader: true,
    stickyActionsColumn: true,
    emptyMessage: '',
    loadingMessage: '',
    showPagination: true
  };

  dataSource: SpAntigenRarity[] = [];
  requestState: SpAntigenRarityParamsDto = {};

  isLoading = false;
  hasError = false;
  errorMessage = '';

  private destroy$ = new Subject<void>();

  constructor(
    private service: SpAntigenRarityService,
    private headerService: HeaderService,
    private loggingService: LoggingService,
    private snackbarService: SnackbarService
  ) {
    this.initializeConfigurations();
  }

  ngOnInit(): void {
    this.subscribeToChapterChanges();
    this.loadTableData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeConfigurations(): void {
    this.tableConfig = {
      columns: this.getTableColumns(),
      rowActions: this.getRowActions(),
      pagination: {
        pageSize: 25,
        pageIndex: 0,
        totalRecords: 0,
        pageSizeOptions: [10, 25, 50, 100],
        showFirstLastButtons: true
      },
      stickyHeader: true,
      stickyActionsColumn: true,
      emptyMessage: 'No antigen rarities available to display',
      loadingMessage: 'Loading antigen rarities...',
      showPagination: true
    };
  }

  private getTableColumns(): TableColumn<SpAntigenRarity>[] {
    return [
      {
        key: 'rarityCode',
        header: 'Rarity Code',
        width: '150px',
        sortable: true
      },
      {
        key: 'rarityDescription',
        header: 'Description',
        width: '300px',
        sortable: true
      },
      {
        key: 'effDate',
        header: 'Effective Date',
        width: '150px',
        sortable: true,
        valueFormatter: (value) => this.formatDate(value)
      },
      {
        key: 'termDate',
        header: 'Termination Date',
        width: '150px',
        valueFormatter: (value) => this.formatDate(value)
      }
    ];
  }

  private getRowActions(): RowAction<SpAntigenRarity>[] {
    return [
      {
        icon: 'edit',
        iconSvg: 'assets/images/icons/edit.svg',
        label: 'Edit antigen rarity',
        ariaLabel: 'Edit antigen rarity',
        color: 'default',
        action: 'edit'
      },
      {
        icon: 'delete',
        iconSvg: 'assets/images/icons/delete.svg',
        label: 'Delete antigen rarity',
        ariaLabel: 'Delete antigen rarity',
        color: 'warn',
        action: 'delete'
      }
    ];
  }

  private formatDate(date: Date | string | null): string {
    if (!date) return '-';

    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = d.getFullYear();

    return `${day}-${month}-${year}`;
  }

  loadTableData(): void {
    this.isLoading = true;
    this.hasError = false;

    const skip =
      (this.tableConfig.pagination?.pageIndex || 0) *
      (this.tableConfig.pagination?.pageSize || 25);

    const take = this.tableConfig.pagination?.pageSize || 25;

    this.service
      .getAntigenRarities(take, skip, this.requestState)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dataSource = response.data || [];
          this.tableConfig.pagination!.totalRecords = response.total || 0;
          this.isLoading = false;
        },
        error: (error) => {
          this.loggingService.error('Error loading antigen rarities:', error);
          this.hasError = true;
          this.isLoading = false;
          this.errorMessage = 'Failed to load data. Please try again.';
        }
      });
  }

  onPageChange(event: TablePageEvent): void {
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = event.pageIndex;
      this.tableConfig.pagination.pageSize = event.pageSize;
    }
    this.loadTableData();
  }

  onSortChange(event: TableSortEvent): void {
    const columnMap: { [key: string]: string } = {
      'rarityCode': 'RarityCode',
      'rarityDescription': 'RarityDescription',
      'effDate': 'EffDate'
    };

    if (event.direction === 'default') {
      this.requestState.sortColumn = undefined;
      this.requestState.sortOrder = undefined;
    } else {
      this.requestState.sortColumn = columnMap[event.column] || event.column;
      this.requestState.sortOrder = event.direction === 'A' ? 'ASC' : 'DESC';
    }

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadTableData();
  }

  onRowAction(event: TableRowActionEvent<SpAntigenRarity>): void {
    switch (event.action) {
      case 'edit':
        this.editRecord(event.row);
        break;
      case 'delete':
        this.deleteRecord(event.row);
        break;
    }
  }

  createRecord(): void {
    this.snackbarService.showSuccess('Add functionality will be implemented in the next phase');
  }

  editRecord(record: SpAntigenRarity): void {
    this.snackbarService.showSuccess('Edit functionality will be implemented in the next phase');
  }

  deleteRecord(record: SpAntigenRarity): void {
    this.snackbarService.showSuccess('Delete functionality will be implemented in the next phase');
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadTableData();
      });
  }
}
