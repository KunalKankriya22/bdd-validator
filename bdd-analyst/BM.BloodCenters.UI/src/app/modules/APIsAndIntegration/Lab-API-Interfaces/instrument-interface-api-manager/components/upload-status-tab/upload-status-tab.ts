import { Component, Input, signal, inject, effect, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, MatPaginatorIntl, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CdkOverlayOrigin, OverlayModule } from '@angular/cdk/overlay';
import { SearchBar } from '@shared/components/search-bar/search-bar';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { InstrumentInterfaceService } from '../../services/instrument-interface.service';
import { UploadStatus } from '../../models/instrument-interface.model';
import { UnitDetailsDialog } from '../unit-details-dialog/unit-details-dialog';
import { UploadStatusFilterPanel, UploadStatusFilterValue } from '../upload-status-filter-panel/upload-status-filter-panel';
import { buildUploadStatusFilterChips } from '../../utils/upload-status-filter-chips.utils';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';

@Component({
  selector: 'app-upload-status-tab',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    OverlayModule,
    SearchBar,
    FilterChips,
    UploadStatusFilterPanel,
  ],
  templateUrl: './upload-status-tab.html',
  styleUrls: ['./upload-status-tab.scss'],
  providers: [
    {
      provide: MatPaginatorIntl,
      useFactory: () => {
        const intl = new MatPaginatorIntl();
        intl.itemsPerPageLabel = 'Rows per page:';
        return intl;
      }
    }
  ],
})
export class UploadStatusTab implements OnChanges {
  @Input() chapterId!: string;
  @Input() instrumentId!: string;

  private instrumentService = inject(InstrumentInterfaceService);
  private dialog = inject(MatDialog);

  hasLoadedData = signal<boolean>(false);

  // Signals
  uploadStatusList = signal<UploadStatus[]>([]);
  filteredData = signal<UploadStatus[]>([]);
  paginatedData = signal<UploadStatus[]>([]);
  loading = signal<boolean>(false);
  searchText = signal<string>('');
  pageIndex = signal<number>(0);
  pageSize = signal<number>(25);
  totalItems = signal<number>(0);
  sortDirection = signal<string>('DESC');
  statusOptions = signal<{ value: string; label: string }[]>([]);

  // Filter
  isFilterOpen = false;
  currentFilters: UploadStatusFilterValue = {
    fileId: null,
    testBatchId: null,
    status: null,
    period: null,
    processDate: null
  };
  filterChips: FilterChip[] = [];

  displayedColumns: string[] = [
    'ltTbId',
    'uploadStatus',
    'totRecProcessed',
    'totRecLoaded',
    'totRecRejected',
    'processDate',
    'logFileName',
    'actions',
  ];

  searchConfig = {
    placeholder: 'Search by TB ID',
    ariaLabel: 'Search by Test Batch ID',
    debounceTime: 300,
    searchOnEnterOnly: true,
    minLength: 1,
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['chapterId'] || changes['instrumentId']) {
      this.uploadStatusList.set([]);
      this.filteredData.set([]);
      this.paginatedData.set([]);
      this.totalItems.set(0);
      this.hasLoadedData.set(false);
      this.loading.set(false);
      this.pageIndex.set(0);
      this.pageSize.set(25);
      this.sortDirection.set('DESC');
      this.statusOptions.set([]);
      this.currentFilters = {
        fileId: null,
        testBatchId: null,
        status: null,
        period: null,
        processDate: null
      };
      this.filterChips = [];
      this.searchText.set('');
    }
  }

  constructor() {
    // Effect to update pagination when data changes
    effect(() => {
      const data = this.uploadStatusList();
      this.filteredData.set(data);
      this.updatePagination();
    });
  }

  loadUploadStatus(): void {
    if (!this.chapterId || !this.instrumentId) {
      return;
    }

    this.uploadStatusList.set([]);
    this.loading.set(true);
    this.loadStatusOptions();

    const filters: any = {};

    if (this.currentFilters.fileId) {
      filters.fileId = this.currentFilters.fileId;
    }

    if (this.currentFilters.testBatchId) {
      filters.testBatchId = this.currentFilters.testBatchId;
    }

    if (this.currentFilters.status) {
      filters.uploadStatus = this.currentFilters.status;
    }

    if (this.currentFilters.processDate && this.currentFilters.period) {
      const dateStr = DateFieldValidationUtility.serializeDateForApi(this.currentFilters.processDate);

      if (dateStr) {
        if (this.currentFilters.period === 'after') {
          filters.processDateFrom = dateStr;
        } else if (this.currentFilters.period === 'before') {
          filters.processDateTo = dateStr;
        }
      }
    }

    this.instrumentService
      .getUploadStatus(
        this.chapterId,
        this.instrumentId,
        this.pageSize(),
        this.pageIndex() * this.pageSize(),
        this.searchText(),
        filters,
        this.sortDirection()
      )
      .subscribe({
        next: (response) => {
          const uploadData = Array.isArray(response.data) ? response.data : [];
          this.uploadStatusList.set(uploadData);
          this.totalItems.set(uploadData.length === 0 ? 0 : (response.total || 0));
          this.hasLoadedData.set(true);
          this.loading.set(false);
        },
        error: (error) => {
          this.uploadStatusList.set([]);
          this.hasLoadedData.set(true);
          this.loading.set(false);
        },
      });
  }

  onSearch(searchText: string): void {
    this.searchText.set(searchText);
    this.pageIndex.set(0);
    this.loadUploadStatus();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadUploadStatus();
  }

  updatePagination(): void {
    // Server-side pagination - just use the data as is
    this.paginatedData.set(this.filteredData());
  }

  openUnitDetails(fileId: string): void {
    this.dialog.open(UnitDetailsDialog, {
      width: '50vw',
      disableClose: true,
      position: { right: '0' },
      panelClass: 'unit-details-drawer',
      data: {
        chapterId: this.chapterId,
        machineId: this.instrumentId,
        fileId: fileId,
      },
    });
  }

  getStatusLabel(code: string): string {
    const statusMap: Record<string, string> = {
      'P': 'Pending',
      'S': 'Loaded',
      'E': 'Error',
      'A': 'Aborted',
    };
    return statusMap[code?.toUpperCase()] || code || '-';
  }

  trackByIndex(index: number): number {
    return index;
  }

  toggleFilter(): void {
    this.isFilterOpen = !this.isFilterOpen;
  }

  onFilterApply(filters: UploadStatusFilterValue): void {
    this.currentFilters = filters;
    this.filterChips = buildUploadStatusFilterChips(filters);
    this.isFilterOpen = false;
    this.pageIndex.set(0);
    this.loadUploadStatus();
  }

  onFilterClose(): void {
    this.isFilterOpen = false;
  }

  removeFilterChip(chipKey: string): void {
    switch (chipKey) {
      case 'fileId':
        this.currentFilters = { ...this.currentFilters, fileId: null };
        break;
      case 'testBatchId':
        this.currentFilters = { ...this.currentFilters, testBatchId: null };
        break;
      case 'status':
        this.currentFilters = { ...this.currentFilters, status: null };
        break;
      case 'processDate':
        this.currentFilters = { ...this.currentFilters, processDate: null, period: null };
        break;
    }
    this.filterChips = buildUploadStatusFilterChips(this.currentFilters);
    this.pageIndex.set(0);
    this.loadUploadStatus();
  }

  clearAllFilters(): void {
    this.currentFilters = {
      fileId: null,
      testBatchId: null,
      status: null,
      period: null,
      processDate: null
    };
    this.filterChips = [];
    this.pageIndex.set(0);
    this.loadUploadStatus();
  }

  toggleSort(): void {
    this.sortDirection.set(this.sortDirection() === 'ASC' ? 'DESC' : 'ASC');
    this.pageIndex.set(0);
    this.loadUploadStatus();
  }

  private loadStatusOptions(): void {
    if (this.statusOptions().length > 0) return;
    this.instrumentService.getUploadStatuses(this.chapterId, this.instrumentId).subscribe({
      next: (options) => this.statusOptions.set(options),
      error: () => this.statusOptions.set([]),
    });
  }
}
