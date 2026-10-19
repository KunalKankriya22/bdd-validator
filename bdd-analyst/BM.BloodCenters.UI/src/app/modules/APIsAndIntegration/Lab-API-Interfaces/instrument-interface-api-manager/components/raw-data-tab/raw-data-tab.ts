import { Component, Input, signal, computed, inject, effect, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, MatPaginatorIntl, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CdkOverlayOrigin, OverlayModule } from '@angular/cdk/overlay';
import { SearchBar } from '@shared/components/search-bar/search-bar';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { InstrumentInterfaceService } from '../../services/instrument-interface.service';
import { RawData } from '../../models/instrument-interface.model';
import { RawDataFilterPanel, RawDataFilterValue } from '../raw-data-filter-panel/raw-data-filter-panel';
import { buildRawDataFilterChips } from '../../utils/raw-data-filter-chips.utils';

@Component({
  selector: 'app-raw-data-tab',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    OverlayModule,
    SearchBar,
    FilterChips,
    RawDataFilterPanel,
    DatePipe,
  ],
  templateUrl: './raw-data-tab.html',
  styleUrls: ['./raw-data-tab.scss'],
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
export class RawDataTab implements OnChanges {
  @Input() chapterId!: string;
  @Input() instrumentId!: string;

  private instrumentService = inject(InstrumentInterfaceService);

  // Signals
  rawDataList = signal<RawData[]>([]);
  filteredData = signal<RawData[]>([]);
  paginatedData = signal<RawData[]>([]);
  loading = signal<boolean>(false);
  hasLoadedData = signal<boolean>(false);
  expandedRows = signal<Set<string>>(new Set());
  searchText = signal<string>('');
  pageIndex = signal<number>(0);
  pageSize = signal<number>(25);
  totalItems = signal<number>(0);
  sortDirection = signal<string>('DESC');

  allExpanded = computed(() => {
    const data = this.paginatedData();
    const expanded = this.expandedRows();
    return data.length > 0 && data.every(row => expanded.has(this.getRowKey(row)));
  });

  // Filter
  isFilterOpen = false;
  currentFilters: RawDataFilterValue = {
    fileId: null
  };
  filterChips: FilterChip[] = [];

  displayedColumns: string[] = [
    'expand',
    'fileId',
    'unitId',
    'machineTestId',
    'machineResult',
    'resultDate',
    'resultUserId',
    'finalPoolSize',
    'extBatchId',
    'uploadStatus',
  ];

  searchConfig = {
    placeholder: 'Search by Unit ID',
    ariaLabel: 'Search by Unit ID',
    debounceTime: 300,
    searchOnEnterOnly: true,
    minLength: 1,
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['chapterId'] || changes['instrumentId']) {
      this.rawDataList.set([]);
      this.filteredData.set([]);
      this.paginatedData.set([]);
      this.totalItems.set(0);
      this.hasLoadedData.set(false);
      this.loading.set(false);
      this.pageIndex.set(0);
      this.pageSize.set(25);
      this.sortDirection.set('DESC');
      this.currentFilters = { fileId: null };
      this.filterChips = [];
      this.searchText.set('');
      this.expandedRows.set(new Set());
    }
  }

  constructor() {
    effect(() => {
      const data = this.rawDataList();
      this.filteredData.set(data);
      this.updatePagination();
    });
  }

  loadRawData(): void {
    if (!this.chapterId || !this.instrumentId) {
      return;
    }

    this.rawDataList.set([]);
    this.loading.set(true);

    this.instrumentService
      .getRawData(
        this.chapterId,
        this.instrumentId,
        this.pageSize(),
        this.pageIndex() * this.pageSize(),
        this.searchText(),
        this.currentFilters.fileId || '',
        this.sortDirection()
      )
      .subscribe({
        next: (response) => {
          const rawData = Array.isArray(response.data) ? response.data : [];
          this.rawDataList.set(rawData);
          this.totalItems.set(rawData.length === 0 ? 0 : (response.total || rawData.length));
          this.hasLoadedData.set(true);
          this.loading.set(false);
        },
        error: (error) => {
          this.rawDataList.set([]);
          this.hasLoadedData.set(true);
          this.loading.set(false);
        },
      });
  }

  onSearch(searchText: string): void {
    this.searchText.set(searchText);
    this.pageIndex.set(0);
    this.loadRawData();
  }

  onPageChange(event: PageEvent): void {
    this.expandedRows.set(new Set());
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadRawData();
  }

  updatePagination(): void {
    this.paginatedData.set(this.filteredData());
  }

  toggleRow(row: RawData): void {
    const expanded = this.expandedRows();
    const key = this.getRowKey(row);

    if (expanded.has(key)) {
      expanded.delete(key);
    } else {
      expanded.add(key);
    }

    this.expandedRows.set(new Set(expanded));
  }

  toggleAllRows(): void {
    if (this.allExpanded()) {
      this.expandedRows.set(new Set());
    } else {
      const allKeys = new Set(this.paginatedData().map(row => this.getRowKey(row)));
      this.expandedRows.set(allKeys);
    }
  }

  isExpanded(row: RawData): boolean {
    return this.expandedRows().has(this.getRowKey(row));
  }

  getRowKey(row: RawData): string {
    return `${row.auditKey}`;
  }

  getStatusClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'Y': 'status-processed',
      'N': 'status-pending',
      'P': 'status-pending',
      'S': 'status-processed',
      'E': 'status-error',
      'A': 'status-error',
    };
    return statusMap[status] || 'status-pending';
  }

  getStatusIcon(status: string): string {
    const iconMap: { [key: string]: string } = {
      'Y': 'check_circle',
      'N': 'cancel',
      'P': 'cancel',
      'S': 'check_circle',
      'E': 'cancel',
      'A': 'cancel',
    };
    return iconMap[status] || 'cancel';
  }

  getStatusLabel(status: string): string {
    const labelMap: { [key: string]: string } = {
      'Y': 'Processed',
      'N': 'Not Uploaded',
      'P': 'Pending',
      'S': 'Processed',
      'E': 'Error',
      'A': 'Aborted',
    };
    return labelMap[status] || 'Pending';
  }

  trackByIndex(index: number): number {
    return index;
  }

  toggleSort(): void {
    this.sortDirection.set(this.sortDirection() === 'ASC' ? 'DESC' : 'ASC');
    this.pageIndex.set(0);
    this.loadRawData();
  }

  toggleFilter(): void {
    this.isFilterOpen = !this.isFilterOpen;
  }

  onFilterApply(filters: RawDataFilterValue): void {
    this.currentFilters = filters;
    this.filterChips = buildRawDataFilterChips(filters);
    this.isFilterOpen = false;
    this.pageIndex.set(0);
    this.loadRawData();
  }

  onFilterClose(): void {
    this.isFilterOpen = false;
  }

  removeFilterChip(chipKey: string): void {
    if (chipKey === 'fileId') {
      this.currentFilters = { ...this.currentFilters, fileId: null };
    }
    this.filterChips = buildRawDataFilterChips(this.currentFilters);
    this.pageIndex.set(0);
    this.loadRawData();
  }

  clearAllFilters(): void {
    this.currentFilters = { fileId: null };
    this.filterChips = [];
    this.pageIndex.set(0);
    this.loadRawData();
  }
}
