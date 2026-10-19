import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, finalize } from 'rxjs';

import { SidePanelBase } from '@shared/components/side-panel-base/side-panel-base';
import { DataTable } from '@shared/components/data-table/data-table';
import { DialogButton } from '@shared/interfaces/dialog.interface';
import { DataTableConfig, TableColumn } from '@shared/interfaces/data-table.interface';

import { DriveDetailsQueryService } from '../../services/drive-details-query.service';
import { PickupScheduleItem } from '../../models/drive-details-query.model';

@Component({
  selector: 'app-pickup-schedule-panel',
  standalone: true,
  imports: [
    CommonModule,
    SidePanelBase,
    DataTable
  ],
  templateUrl: './pickup-schedule-panel.html',
  styleUrl: './pickup-schedule-panel.scss'
})
export class PickupSchedulePanel implements OnInit, OnDestroy, OnChanges {
  private readonly service = inject(DriveDetailsQueryService);
  private destroy$ = new Subject<void>();

  /** Drive ID to load pickup schedule for */
  @Input() driveId: string = '';

  /** Emitted when panel should be closed */
  @Output() closePanel = new EventEmitter<void>();

  panelTitle = 'Pickup Schedule';

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

  pickupData: PickupScheduleItem[] = [];
  isLoading = false;

  ngOnInit(): void {
    this.initializeTableColumns();
    this.loadPickupSchedule();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['driveId'] && !changes['driveId'].firstChange) {
      this.loadPickupSchedule();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeTableColumns(): void {
    const columns: TableColumn[] = [
      { key: 'courier', header: 'Courier', sortable: false, width: '35%' },
      { key: 'time', header: 'Time', sortable: false, width: '30%', valueFormatter: (v) => this.formatTime(v) },
      { key: 'driver', header: 'Driver', sortable: false, width: '35%' }
    ];

    this.tableConfig = {
      ...this.tableConfig,
      columns
    };
  }

  private loadPickupSchedule(): void {
    if (!this.driveId) {
      return;
    }

    this.isLoading = true;

    this.service.getPickupSchedule(this.driveId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (items) => {
          this.pickupData = items;
        },
        error: (err) => {
          console.error('Error loading pickup schedule:', err);
          this.pickupData = [];
        }
      });
  }

  private formatTime(dateStr: string | null): string {
    if (!dateStr) return '--';
    try {
      const date = new Date(dateStr);
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
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
