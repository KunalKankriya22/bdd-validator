import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, finalize } from 'rxjs';

import { SidePanelBase } from '@shared/components/side-panel-base/side-panel-base';
import { DialogTabs } from '@shared/components/dialog-tabs/dialog-tabs';
import { DataTable } from '@shared/components/data-table/data-table';
import { DialogButton, DialogTab } from '@shared/interfaces/dialog.interface';
import { DataTableConfig, TableColumn } from '@shared/interfaces/data-table.interface';

import { DriveDetailsQueryService } from '../../services/drive-details-query.service';
import { DriveProcedureItem } from '../../models/drive-details-query.model';

@Component({
  selector: 'app-drive-procedures-panel',
  standalone: true,
  imports: [
    CommonModule,
    SidePanelBase,
    DialogTabs,
    DataTable
  ],
  templateUrl: './drive-procedures-panel.html',
  styleUrl: './drive-procedures-panel.scss'
})
export class DriveProceduresPanel implements OnInit, OnDestroy, OnChanges {
  private readonly service = inject(DriveDetailsQueryService);
  private destroy$ = new Subject<void>();

  /** Drive ID to load procedures for */
  @Input() driveId: string = '';

  /** Emitted when panel should be closed */
  @Output() closePanel = new EventEmitter<void>();

  panelTitle = 'Drive Procedures';

  tabs: DialogTab[] = [
    { id: 'scheduled', label: 'Scheduled' },
    { id: 'actual', label: 'Actual' }
  ];
  activeTab = 'scheduled';

  // No footer buttons - panel closes via X button only
  footerButtons: DialogButton[] = [];

  // Scheduled procedures table
  scheduledTableConfig: DataTableConfig = {
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
  scheduledData: DriveProcedureItem[] = [];

  // Actual procedures table
  actualTableConfig: DataTableConfig = {
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
  actualData: DriveProcedureItem[] = [];

  isLoading = false;

  ngOnInit(): void {
    this.initializeTableColumns();
    this.loadProcedures();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['driveId'] && !changes['driveId'].firstChange) {
      this.loadProcedures();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeTableColumns(): void {
    const columns: TableColumn[] = [
      { key: 'procedure', header: 'Procedure', sortable: false, width: '15%' },
      { key: 'procedureDescription', header: 'Procedure Description', sortable: false, width: '25%' },
      { key: 'don', header: 'Don', sortable: false, width: '15%' },
      { key: 'donDescription', header: 'Don Description', sortable: false, width: '30%' },
      { key: 'draw', header: 'Draw', sortable: false, width: '15%', valueFormatter: (v) => v != null ? String(v) : '--' }
    ];

    this.scheduledTableConfig = {
      ...this.scheduledTableConfig,
      columns
    };

    this.actualTableConfig = {
      ...this.actualTableConfig,
      columns
    };
  }

  private loadProcedures(): void {
    if (!this.driveId) {
      return;
    }

    this.isLoading = true;

    this.service.getDriveProcedures(this.driveId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (response) => {
          this.scheduledData = response.scheduled || [];
          this.actualData = response.actual || [];
        },
        error: (err) => {
          console.error('Error loading drive procedures:', err);
          this.scheduledData = [];
          this.actualData = [];
        }
      });
  }

  onTabChange(tabId: string): void {
    this.activeTab = tabId;
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
