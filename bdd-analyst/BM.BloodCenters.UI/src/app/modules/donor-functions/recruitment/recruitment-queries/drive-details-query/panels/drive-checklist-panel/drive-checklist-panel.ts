import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, finalize } from 'rxjs';

import { SidePanelBase } from '@shared/components/side-panel-base/side-panel-base';
import { DataTable } from '@shared/components/data-table/data-table';
import { DialogButton } from '@shared/interfaces/dialog.interface';
import { DataTableConfig, TableColumn } from '@shared/interfaces/data-table.interface';

import { DriveDetailsQueryService } from '../../services/drive-details-query.service';
import { DriveChecklistItem } from '../../models/drive-details-query.model';

@Component({
  selector: 'app-drive-checklist-panel',
  standalone: true,
  imports: [
    CommonModule,
    SidePanelBase,
    DataTable
  ],
  templateUrl: './drive-checklist-panel.html',
  styleUrl: './drive-checklist-panel.scss'
})
export class DriveChecklistPanel implements OnInit, OnDestroy, OnChanges {
  private readonly service = inject(DriveDetailsQueryService);
  private destroy$ = new Subject<void>();

  /** Drive ID to load checklist for */
  @Input() driveId: string = '';

  /** Emitted when panel should be closed */
  @Output() closePanel = new EventEmitter<void>();

  panelTitle = 'Drive Checklist';

  // No footer buttons - panel closes via X button only
  footerButtons: DialogButton[] = [];

  tableConfig: DataTableConfig = {
    columns: [],
    pagination: {
      pageSize: 10,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [5, 10, 25],
      showFirstLastButtons: false
    },
    stickyHeader: true,
    showPagination: false,
    showTableOnEmpty: true
  };

  checklistData: DriveChecklistItem[] = [];
  isLoading = false;

  ngOnInit(): void {
    this.initializeTableColumns();
    this.loadChecklist();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['driveId'] && !changes['driveId'].firstChange) {
      this.loadChecklist();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeTableColumns(): void {
    const columns: TableColumn[] = [
      { key: 'action', header: 'Action', sortable: false, width: '15%' },
      { key: 'description', header: 'Description', sortable: false, width: '25%' },
      { key: 'targetDate', header: 'Target Date', sortable: false, width: '15%', valueFormatter: (v) => this.formatDate(v) },
      { key: 'user', header: 'User', sortable: false, width: '15%' },
      { key: 'actionDate', header: 'Action Date', sortable: false, width: '15%', valueFormatter: (v) => this.formatDate(v) },
      { key: 'actionBy', header: 'Action By', sortable: false, width: '15%' }
    ];

    this.tableConfig = {
      ...this.tableConfig,
      columns
    };
  }

  private loadChecklist(): void {
    if (!this.driveId) {
      return;
    }

    this.isLoading = true;

    this.service.getDriveChecklist(this.driveId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (items) => {
          this.checklistData = items;
        },
        error: (err) => {
          console.error('Error loading drive checklist:', err);
          this.checklistData = [];
        }
      });
  }

  private formatDate(dateStr: string | null): string {
    if (!dateStr) return '--';
    try {
      const date = new Date(dateStr);
      const day = date.getDate();
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    } catch {
      return dateStr;
    }
  }

  onButtonClick(action: string): void {
    if (action === 'close') {
      this.closePanel.emit();
    }
  }

  onClose(): void {
    this.closePanel.emit();
  }
}
