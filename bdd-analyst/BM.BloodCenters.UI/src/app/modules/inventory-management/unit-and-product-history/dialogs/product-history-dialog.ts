import { Component, inject, OnInit, OnDestroy, Inject, ViewChild, TemplateRef, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { Subject, takeUntil } from 'rxjs';
import moment from 'moment';

import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig } from '@shared/interfaces/data-table.interface';
import { UnitProductHistoryService } from '../services/unit-product-history.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import {
  ProductHistoryDto,
  ProductHistoryDialogData,
  HistoryTableRow,
} from '../models/unit-product-history.model';

/**
 * Product History Dialog Component
 * MLT-14054: Dialog for viewing chronological history of a specific product
 *
 * Displays the complete transaction history for a blood product including:
 * - Status changes (Created, Allocated, Shipped, Delivered, etc.)
 * - Person who performed each action
 * - Timestamps
 * - Locations and destinations
 */
@Component({
  selector: 'app-product-history-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    DataTable,
  ],
  templateUrl: './product-history-dialog.html',
  styleUrl: './product-history-dialog.scss',
})
export class ProductHistoryDialog implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `product-history-dialog-${ProductHistoryDialog.nextId++}`;

  // Generate unique IDs for accessibility
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;

  @ViewChild('statusCellTemplate', { static: true }) statusCellTemplate!: TemplateRef<any>;

  private readonly historyService = inject(UnitProductHistoryService);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);
  private readonly destroy$ = new Subject<void>();

  // Signal-based state
  readonly historyRecords = signal<HistoryTableRow[]>([]);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  // Computed values
  readonly hasHistory = computed(() => this.historyRecords().length > 0);
  readonly displayProduct = computed(() => this.data.product);
  readonly displayShipmentNumber = computed(() => this.data.shipmentNumber || 'N/A');

  // Table configuration
  tableConfig: DataTableConfig<HistoryTableRow> = {
    columns: [
      {
        key: 'statusDescription',
        header: 'Process',
        sortable: false,
        cellClass: 'process-column',
      },
      {
        key: 'statusInd',
        header: 'Status',
        sortable: false,
        type: 'custom',
        cellClass: 'status-column',
      },
      {
        key: 'inventoryClass',
        header: 'Inventory Class',
        sortable: false,
        cellClass: 'inventory-class-column',
      },
      {
        key: 'personName',
        header: 'By',
        sortable: false,
        cellClass: 'person-column',
      },
      {
        key: 'formattedDate',
        header: 'Date/Time',
        sortable: false,
        cellClass: 'datetime-column',
      },
      {
        key: 'locationId',
        header: 'Location ID',
        sortable: false,
        cellClass: 'location-column',
      },
      {
        key: 'customer',
        header: 'Customer',
        sortable: false,
        cellClass: 'customer-column',
      },
      {
        key: 'consignee',
        header: 'Consignee',
        sortable: false,
        cellClass: 'consignee-column',
      },
    ],
    stickyHeader: true,
    showPagination: false,
    showTableOnEmpty: false,
    emptyMessage: 'No history records found for this product',
    enableRowHighlight: false,
  };

  constructor(@Inject(MAT_DIALOG_DATA) public data: ProductHistoryDialogData) {}

  ngOnInit(): void {
    const statusCol = this.tableConfig.columns.find(c => c.key === 'statusInd');
    if (statusCol) {
      statusCol.cellTemplate = this.statusCellTemplate;
    }

    if (this.data.historyRecords?.length) {
      const mappedRecords = this.mapToTableRows(this.data.historyRecords);
      this.historyRecords.set(mappedRecords);
    } else {
      this.loadHistory();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load product history from API
   */
  loadHistory(): void {
    if (!this.data?.unitId || !this.data?.productCode || !this.data?.aliquot || !this.data?.collectionDate) {
      this.error.set('Required product information is missing');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.historyService
      .getProductHistory(
        this.data.unitId,
        this.data.productCode,
        this.data.aliquot,
        this.data.collectionDate
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (records) => {
          const mappedRecords = this.mapToTableRows(records);
          this.historyRecords.set(mappedRecords);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Failed to load product history:', err);
          this.error.set(err.message || 'Failed to load product history. Please try again.');
          this.loading.set(false);
        },
      });
  }

  /**
   * Map API DTOs to table rows with formatted data
   */
  private mapToTableRows(records: ProductHistoryDto[]): HistoryTableRow[] {
    return records.map((record) => ({
      ...record,
      formattedDate: this.formatDateTime(record.fromDate),
      statusBadgeClass: this.getStatusBadgeClass(record.statusInd),
      statusDisplayName: this.getStatusDisplayName(record.statusInd),
      locationId: record.destination || '',
      customer: record.customerName || '',
      consignee: record.consigneeName || '',
    }));
  }

  private getStatusDisplayName(statusInd: string): string {
    const nameMap: Record<string, string> = {
      'AV': 'Available',
      'AL': 'Allocated',
      'PK': 'Packed',
      'SH': 'Shipped',
      'DL': 'Delivered',
      'RT': 'Returned',
      'QU': 'Quarantine',
      'DI': 'Discarded',
      'OD': 'Outdated',
      'IL': 'In Lab',
      'CK': 'Checked',
      'XR': 'Crossmatch',
      'RP': 'Reprocessed',
      'CM': 'In Lab',
      'WO': 'Work Order',
    };
    return nameMap[statusInd] || statusInd;
  }

  /**
   * Format date/time to DD-MMM-YYYY HH:MM format
   */
  private formatDateTime(dateString: string): string {
    const m = this.chapterTimezoneService.convertGmtToLocal(moment.utc(dateString));
    return m.isValid() ? m.format('DD-MMM-YYYY HH:mm').toUpperCase() : dateString;
  }

  /**
   * Get badge color class based on status indicator
   */
  private getStatusBadgeClass(statusInd: string): string {
    // Map status indicator to badge color
    const statusMap: Record<string, string> = {
      'AV': 'status-available',
      'AL': 'status-allocated',
      'PK': 'status-packed',
      'SH': 'status-shipped',
      'DL': 'status-delivered',
      'RT': 'status-returned',
      'QU': 'status-quarantine',
      'DI': 'status-discarded',
      'OD': 'status-outdated',
      'IL': 'status-in-lab',
      'CK': 'status-checked',
      'XR': 'status-crossmatch',
      'RP': 'status-reprocessed',
      'WO': 'status-allocated',
      'CM': 'status-in-lab',
    };

    return statusMap[statusInd] || 'status-default';
  }

  onRetry(): void {
    this.loadHistory();
  }
}
