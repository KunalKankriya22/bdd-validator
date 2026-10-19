import { Component, Input, Output, EventEmitter, signal, computed, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatPaginatorModule, MatPaginatorIntl, PageEvent } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { OverlayModule } from '@angular/cdk/overlay';
import moment from 'moment';

import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { FilterPanel } from '../filter-panel/filter-panel';
import { DonorProfileAuditResultDto } from '../../models/donor-profile-audit-query.model';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';

export interface AuditFilterCriteria {
  fromDate?: string;
  toDate?: string;
  insertedUser?: string;
}

@Component({
  selector: 'app-detail-view-tab',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    MatPaginatorModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    OverlayModule,
    FilterChips,
    FilterPanel,
    SearchBar
  ],
  templateUrl: './detail-view-tab.html',
  styleUrls: ['./detail-view-tab.scss'],
  providers: [
    {
      provide: MatPaginatorIntl,
      useFactory: () => {
        const intl = new MatPaginatorIntl();
        intl.itemsPerPageLabel = 'Rows per page:';
        return intl;
      }
    }
  ]
})
export class DetailViewTab {
  @Input() set auditData(value: DonorProfileAuditResultDto[]) {
    this._auditData.set(value);
  }

  @Input() set loading(value: boolean) {
    this._loading.set(value);
  }

  @Input() set totalCount(value: number) {
    this._totalCount.set(value);
  }

  @Input() set appliedFilters(value: AuditFilterCriteria) {
    this._appliedFilters.set(value);
  }

  @Input() set searchText(value: string) {
    this._searchText.set(value);
  }

  @Input() pageSize = 25;
  @Input() pageIndex = 0;
  @Input() pageSizeOptions = [10, 25, 50, 100];

  @Input() set selectedRecords(value: Set<number>) {
    this._selectedRecords.set(value);
  }

  @Input() filterChips: FilterChip[] = [];
  @Input() isFilterOpen = false;
  @Input() insertedUsers: string[] = [];
  @Input() hasError = false;

  @Output() filterClick = new EventEmitter<MouseEvent>();
  @Output() printSelected = new EventEmitter<void>();
  @Output() searchInput = new EventEmitter<string>();
  @Output() pageChange = new EventEmitter<PageEvent>();
  @Output() selectionChange = new EventEmitter<Set<number>>();
  @Output() removeChip = new EventEmitter<string>();
  @Output() clearAllChips = new EventEmitter<void>();
  @Output() applyFilters = new EventEmitter<AuditFilterCriteria>();
  @Output() closeFilter = new EventEmitter<void>();
  @Output() retry = new EventEmitter<void>();

  @ViewChild('detailFilterBtn', { read: ElementRef }) filterBtn!: ElementRef<HTMLElement>;
  @ViewChild('detailTrigger', { static: false }) detailTrigger: any;

  _auditData = signal<DonorProfileAuditResultDto[]>([]);
  _loading = signal<boolean>(false);
  _totalCount = signal<number>(0);
  _searchText = signal<string>('');
  _appliedFilters = signal<AuditFilterCriteria>({});
  sortDirection = signal<'asc' | 'desc'>('asc');

  displayedColumns: string[] = ['checkbox', 'recNum', 'insertDate', 'insertUser', 'programId', 'tableName', 'dataDetails'];

  _selectedRecords = signal<Set<number>>(new Set());

  // Search bar configuration
  searchConfig: SearchBarConfig = {
    placeholder: 'Search by Data Details or Program ID',
    minLength: 2,
    ariaLabel: 'Search by Data Details or Program ID',
    searchOnEnterOnly: true,
    alwaysShowTooltip: true
  };

  // Timezone service for date conversion
  private timezoneService = inject(ChapterTimezoneService);

  // Computed signal for sorted and filtered data - updates automatically when dependencies change
  // Applies both filter panel filters (fromDate, toDate, insertedUser) and search filters client-side
  // This ensures each tab filters independently without affecting the other tab's data
  sortedData = computed(() => {
    let data = this._auditData();
    const direction = this.sortDirection();
    const search = this._searchText().trim();
    const filters = this._appliedFilters();

    // Apply filter panel filters (fromDate, toDate, insertedUser) - client-side
    if (filters.fromDate || filters.toDate) {
      data = data.filter(record => {
        if (!record.insertDate) return false;

        try {
          const insertDate = moment(record.insertDate).startOf('day');
          if (!insertDate.isValid()) return false;

          if (filters.fromDate) {
            const fromDate = moment(filters.fromDate).startOf('day');
            if (!fromDate.isValid()) return true; // If filter date is invalid, don't filter out
            if (insertDate.isBefore(fromDate)) return false;
          }

          if (filters.toDate) {
            const toDate = moment(filters.toDate).startOf('day');
            if (!toDate.isValid()) return true; // If filter date is invalid, don't filter out
            if (insertDate.isAfter(toDate)) return false;
          }

          return true;
        } catch (error) {
          // If any error occurs during date parsing, include the record
          return true;
        }
      });
    }

    if (filters.insertedUser) {
      const filterUser = filters.insertedUser.trim().toLowerCase();
      data = data.filter(record => {
        if (!record.insertUser) return false;
        return record.insertUser.toLowerCase() === filterUser;
      });
    }

    // Apply search filter (Data Details or Program ID) - client-side only
    if (search) {
      const searchLower = search.toLowerCase();
      data = data.filter(record =>
        record.programId?.toLowerCase().includes(searchLower) ||
        record.dataDetails?.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting by Record Number
    return [...data].sort((a, b) => {
      if (direction === 'asc') {
        return a.recNum - b.recNum;
      } else {
        return b.recNum - a.recNum;
      }
    });
  });

  // Computed signals for oldest and newest insert dates from the data
  oldestInsertDate = computed(() => {
    const data = this._auditData();
    if (data.length === 0) return null;

    const dates = data
      .map(record => record.insertDate)
      .filter(date => date != null)
      .sort();

    return dates.length > 0 ? dates[0] : null;
  });

  newestInsertDate = computed(() => {
    const data = this._auditData();
    if (data.length === 0) return null;

    const dates = data
      .map(record => record.insertDate)
      .filter(date => date != null)
      .sort();

    return dates.length > 0 ? dates[dates.length - 1] : null;
  });

  isRecordSelected(recNum: number): boolean {
    return this._selectedRecords().has(recNum);
  }

  isAllSelected(): boolean {
    const data = this.sortedData();
    if (data.length === 0) return false;
    return data.every(record => this._selectedRecords().has(record.recNum));
  }

  isSomeSelected(): boolean {
    const data = this.sortedData();
    if (data.length === 0) return false;
    const selected = this._selectedRecords();
    return data.some(record => selected.has(record.recNum)) && !this.isAllSelected();
  }

  onToggleRecord(recNum: number): void {
    const selected = new Set(this._selectedRecords());
    if (selected.has(recNum)) {
      selected.delete(recNum);
    } else {
      selected.add(recNum);
    }
    this._selectedRecords.set(selected);
    this.selectionChange.emit(selected);
  }

  onToggleAll(event: any): void {
    const selected = new Set(this._selectedRecords());
    const data = this.sortedData();

    if (event.checked) {
      data.forEach((record: DonorProfileAuditResultDto) => selected.add(record.recNum));
    } else {
      data.forEach((record: DonorProfileAuditResultDto) => selected.delete(record.recNum));
    }

    this._selectedRecords.set(selected);
    this.selectionChange.emit(selected);
  }

  onFilterClick(event: MouseEvent): void {
    this.filterClick.emit(event);
  }

  onPrintSelected(): void {
    this.printSelected.emit();
  }

  onSearchInput(searchText: string): void {
    this.searchInput.emit(searchText);
  }

  onRemoveChip(chipKey: string): void {
    this.removeChip.emit(chipKey);
  }

  onClearAllChips(): void {
    this.clearAllChips.emit();
  }

  onApplyFilters(filters: AuditFilterCriteria): void {
    this.applyFilters.emit(filters);
  }

  onCloseFilter(): void {
    this.closeFilter.emit();
  }

  onPageChange(event: PageEvent): void {
    this.pageChange.emit(event);
  }

  onRetry(): void {
    this.retry.emit();
  }

  toggleSort(): void {
    const current = this.sortDirection();
    this.sortDirection.set(current === 'asc' ? 'desc' : 'asc');
  }

  // Timezone helper methods
  private convertGMTToLocal(gmtDateTime: string): moment.Moment {
    return moment.utc(gmtDateTime).local();
  }

  private isTimezoneEnabled(): boolean {
    return this.timezoneService.isChapterLocalDateAvailable();
  }

  formatDateTime(value: string): string {
    if (!value) return '--';

    // Handle special "******" dates (per JIRA: treat as 2099-12-31 23:59)
    if (value === '******') {
      return '31-DEC-2099 23:59';
    }

    // Convert from GMT to local timezone if enabled
    let m: moment.Moment;
    if (this.isTimezoneEnabled()) {
      m = this.convertGMTToLocal(value);
    } else {
      m = moment(value);
    }

    if (!m.isValid()) return value;

    // If value is just a date (YYYY-MM-DD), add time
    if (value.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return m.format('DD-MMM-YYYY').toUpperCase() + ' 00:00';
    }

    return m.format('DD-MMM-YYYY HH:mm').toUpperCase();
  }

  displayValue(value: string | null | undefined): string {
    if (value === null || value === undefined || value === '') return '--';
    return String(value);
  }

  hasAppliedFilters(): boolean {
    const filters = this._appliedFilters();
    return !!(filters.fromDate ||
              filters.toDate ||
              filters.insertedUser);
  }
}
