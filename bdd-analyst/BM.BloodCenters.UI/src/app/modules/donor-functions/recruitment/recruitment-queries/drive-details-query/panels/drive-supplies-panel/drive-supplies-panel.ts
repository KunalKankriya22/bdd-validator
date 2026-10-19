import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, finalize } from 'rxjs';

import { SidePanelBase } from '@shared/components/side-panel-base/side-panel-base';
import { DialogHeaderFields } from '@shared/components/dialog-header-fields/dialog-header-fields';
import { DialogTabs } from '@shared/components/dialog-tabs/dialog-tabs';
import { DataTable } from '@shared/components/data-table/data-table';
import { DialogButton, DialogHeaderField, DialogTab } from '@shared/interfaces/dialog.interface';
import { DataTableConfig, TableColumn } from '@shared/interfaces/data-table.interface';

import { DriveDetailsQueryService } from '../../services/drive-details-query.service';
import { CampaignItem, DriveBagItem } from '../../models/drive-details-query.model';

@Component({
  selector: 'app-drive-supplies-panel',
  standalone: true,
  imports: [
    CommonModule,
    SidePanelBase,
    DialogHeaderFields,
    DialogTabs,
    DataTable
  ],
  templateUrl: './drive-supplies-panel.html',
  styleUrl: './drive-supplies-panel.scss'
})
export class DriveSuppliesPanel implements OnInit, OnDestroy, OnChanges {
  private readonly service = inject(DriveDetailsQueryService);
  private destroy$ = new Subject<void>();

  /** Drive ID to load supplies for */
  @Input() driveId: string = '';

  /** Emitted when panel should be closed */
  @Output() closePanel = new EventEmitter<void>();

  panelTitle = 'Drive Supplies';

  headerFields: DialogHeaderField[] = [
    { label: 'Campaign ID', value: '--' },
    { label: 'Campaign Name', value: '--' }
  ];

  tabs: DialogTab[] = [
    { id: 'campaign', label: 'Campaign Items' },
    { id: 'bags', label: 'Bags' }
  ];
  activeTab = 'campaign';

  // No footer buttons - panel closes via X button only
  footerButtons: DialogButton[] = [];

  // Campaign Items table
  campaignTableConfig: DataTableConfig = {
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
  campaignData: CampaignItem[] = [];

  // Bags table
  bagsTableConfig: DataTableConfig = {
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
  bagsData: DriveBagItem[] = [];

  isLoading = false;

  ngOnInit(): void {
    this.initializeCampaignTableColumns();
    this.initializeBagsTableColumns();
    this.loadSupplies();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['driveId'] && !changes['driveId'].firstChange) {
      this.loadSupplies();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeCampaignTableColumns(): void {
    const columns: TableColumn[] = [
      { key: 'item', header: 'Item', sortable: false, width: '25%' },
      { key: 'description', header: 'Description', sortable: false, width: '50%' },
      { key: 'qty', header: 'Quantity', sortable: false, width: '25%', valueFormatter: (v) => v != null ? String(v) : '--' }
    ];

    this.campaignTableConfig = {
      ...this.campaignTableConfig,
      columns
    };
  }

  private initializeBagsTableColumns(): void {
    const columns: TableColumn[] = [
      { key: 'bag', header: 'Bag', sortable: false, width: '20%' },
      { key: 'description', header: 'Description', sortable: false, width: '35%' },
      { key: 'qty', header: 'Quantity', sortable: false, width: '20%', valueFormatter: (v) => v != null ? String(v) : '--' },
      { key: 'aboDesc', header: 'ABO Description', sortable: false, width: '25%' }
    ];

    this.bagsTableConfig = {
      ...this.bagsTableConfig,
      columns
    };
  }

  private loadSupplies(): void {
    if (!this.driveId) {
      return;
    }

    this.isLoading = true;

    this.service.getDriveSupplies(this.driveId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (response) => {
          // Update header fields
          this.headerFields = [
            { label: 'Campaign ID', value: response.campaignId || '--' },
            { label: 'Campaign Name', value: response.campaignName || '--' }
          ];

          this.campaignData = response.campaignItems || [];
          this.bagsData = response.bags || [];
        },
        error: (err) => {
          console.error('Error loading drive supplies:', err);
          this.campaignData = [];
          this.bagsData = [];
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
