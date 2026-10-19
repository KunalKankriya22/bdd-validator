import {
  Component,
  OnInit,
  OnDestroy,
  HostListener,
  ViewChild,
  ElementRef,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil } from 'rxjs';

import { DaylightSavingsService } from './services/daylight-savings.service';
import {
  DaylightSavingsModel,
  DaylightSavingsParamsDto,
  DaylightSavingsFilterValue
} from './models/daylight-savings.model';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TableColumn,
  RowAction,
  TablePageEvent,
  TableSortEvent,
  TableRowActionEvent
} from '@shared/interfaces/data-table.interface';

import {
  Overlay,
  OverlayRef,
  FlexibleConnectedPositionStrategy
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';

import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { DaylightSavingsFilterChipsUtils } from './utils/filter-chips.utils';
import { DaylightSavingsFilterPanel } from './daylight-savings-filter-panel/daylight-savings-filter-panel';
import { AddEditDaylightSavings } from './add-edit-daylight-savings/add-edit-daylight-savings';

@Component({
  selector: 'app-daylight-savings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    DataTable,
    FilterChips,
    AddEditDaylightSavings
  ],
  templateUrl: './daylight-savings.html',
  styleUrls: ['./daylight-savings.scss']
})
export class DaylightSavingsComponent implements OnInit, OnDestroy {

  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef<HTMLElement>;
  @ViewChild('filterBtn', { read: ElementRef }) filterBtn!: ElementRef<HTMLElement>;

  headerConfig!: PageHeaderConfig;
  tableConfig!: DataTableConfig<DaylightSavingsModel>;

  // Search
  searchConfig: SearchBarConfig = {
    placeholder: 'Search by Chapter ID or Chapter Name',
    minLength: 2,
    ariaLabel: 'Search by Chapter ID or Chapter Name',
    debounceTime: 300,
    searchOnEnterOnly: true,
    alwaysShowTooltip: true
  };
  searchTerm = '';

  appliedFilters: DaylightSavingsFilterValue | null = null;
  filterChips: FilterChip[] = [];

  dataSource: DaylightSavingsModel[] = [];
  requestState: DaylightSavingsParamsDto = {
    sort: 'D' // Default sort: Chapter ID descending
  };

  isLoading = false;
  hasError = false;
  errorMessage = '';
  searchText = '';

  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' | 'view' = 'add';
  sidePanelData: DaylightSavingsModel | null = null;

  isFilterOpen = false;

  private destroy$ = new Subject<void>();
  private overlayRef: OverlayRef | null = null;
  currentYear: number = new Date().getFullYear();

  constructor(
    private daylightSavingsService: DaylightSavingsService,
    private router: Router,
    private overlay: Overlay,
    private pageHeaderService: PageHeaderService
  ) {
    this.initializeConfigurations();

    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          ...this.headerConfig,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null }
          ],
          title: pageData.title,
          subtitle: pageData.subtitle || ''
        };
      }
    });
  }

  ngOnInit(): void {
    this.loadData();
    // Preload dropdown data so it's cached and ready when the panel opens
    this.daylightSavingsService.getChapters().pipe(takeUntil(this.destroy$)).subscribe();
    this.daylightSavingsService.getDaylightSavingsDropdown().pipe(takeUntil(this.destroy$)).subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.overlayRef?.dispose();
  }

  /* -------------------------------- CONFIG -------------------------------- */

  private initializeConfigurations(): void {
    this.headerConfig = {
      breadcrumbs: [
        { label: 'Home', link: '/home' }
      ],
      title: '',
      subtitle: '',
      actions: [
        {
          label: 'ADD NEW',
          icon: 'add',
          color: 'accent',
          ariaLabel: 'Add new daylight savings record',
          onClick: () => this.createRecord()
        }
      ]
    };


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
      sortConfig: {
        column: 'chapterId',
        direction: 'D'
      },
      stickyHeader: true,
      stickyActionsColumn: true,
      emptyMessage: 'No daylight savings records available to display',
      loadingMessage: 'Loading daylight savings data...',
      showPagination: true
    };
  }

  private getTableColumns(): TableColumn<DaylightSavingsModel>[] {
    return [
      { key: 'chapterId', header: 'Chapter ID', sortable: true, width: '120px' },
      { key: 'chapterName', header: 'Chapter Name', sortable: false, width: '180px' },
      {
        key: 'startTime',
        header: 'Start Date & Time',
        width: '180px',
        valueFormatter: (v) => this.formatDateTime(v)
      },
      {
        key: 'endTime',
        header: 'End Date & Time',
        width: '180px',
        valueFormatter: (v) => this.formatDateTime(v)
      },
      { key: 'timeZone', header: 'Time Zone', width: '150px' },
      {
        key: 'baseOffSet',
        header: 'Base OffSet',
        width: '120px',
        valueFormatter: (v) => this.formatOffSet(v)
      },
      {
        key: 'dstOffSet',
        header: 'DST OffSet',
        width: '120px',
        valueFormatter: (v) => this.formatOffSet(v)
      },
      { key: 'timeZoneRegion', header: 'Time Zone Region', width: '150px' }
    ];
  }


  private getRowActions(): RowAction<DaylightSavingsModel>[] {
    return [
      {
        icon: 'edit',
        iconSvg: 'assets/images/icons/edit.svg',
        label: 'Edit daylight savings',
        ariaLabel: 'Edit daylight savings',
        color: 'default',
        action: 'edit',
        visible: (row: DaylightSavingsModel) => this.isEditAllowed(row)
      },
      {
        icon: 'visibility',
        label: 'View daylight savings',
        ariaLabel: 'View daylight savings',
        color: 'default',
        action: 'view',
        visible: (row: DaylightSavingsModel) => !this.isEditAllowed(row)
      }
    ];
  }

  /**
   * Check if edit is allowed for a record
   * Edit is not allowed if the end date has passed (per FMB requirements)
   */
  private isEditAllowed(row: DaylightSavingsModel): boolean {
    if (!row.endTime) return true; // If no end time, allow edit

    const endDate = new Date(row.endTime);
    const currentDate = new Date();

    // Allow edit only if end date is in the future
    return endDate >= currentDate;
  }

  /* -------------------------------- LOAD DATA -------------------------------- */

  loadData(): void {
    this.isLoading = true;
    this.hasError = false;

    const skip =
      (this.tableConfig.pagination?.pageIndex || 0) *
      (this.tableConfig.pagination?.pageSize || 25);

    const take = this.tableConfig.pagination?.pageSize || 25;

    this.daylightSavingsService
      .getDaylightSavings(take, skip, this.requestState)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.dataSource = res.data;
          this.tableConfig.pagination!.totalRecords = res.totalRecords;
          this.isLoading = false;
        },
        error: (err) => {
          this.isLoading = false;
          this.hasError = true;
          this.errorMessage =
            err?.error?.message ||
            'Failed to load daylight savings data.';
        }
      });
  }

  /* -------------------------------- EVENTS -------------------------------- */

  onSearch(searchTerm: string): void {
    const trimmedText = searchTerm?.trim() || '';
    this.searchTerm = trimmedText;
    this.requestState.searchKeyword = trimmedText || undefined;
    this.tableConfig.pagination!.pageIndex = 0;
    this.loadData();
  }

  onSearchCleared(): void {
    this.searchTerm = '';
    this.requestState.searchKeyword = undefined;
    this.tableConfig.pagination!.pageIndex = 0;
    this.loadData();
  }

  onPageChange(event: TablePageEvent): void {
    this.tableConfig.pagination!.pageIndex = event.pageIndex;
    this.tableConfig.pagination!.pageSize = event.pageSize;
    this.loadData();
  }

  onSortChange(event: TableSortEvent): void {
    this.tableConfig.sortConfig!.column = event.column;
    this.tableConfig.sortConfig!.direction = event.direction;

    if (event.direction === 'A') {
      this.requestState.sort = 'A';
    } else if (event.direction === 'D') {
      this.requestState.sort = 'D';
    } else {
      this.requestState.sort = undefined;
    }

    this.loadData();
  }

  onRowAction(event: TableRowActionEvent<DaylightSavingsModel>): void {
    if (event.action === 'edit') {
      this.editRecord(event.row);
    } else if (event.action === 'view') {
      this.viewRecord(event.row);
    }
  }

  /* -------------------------------- FILTERS -------------------------------- */

  applyFilters(filters: DaylightSavingsFilterValue): void {
    this.appliedFilters = filters;
    this.filterChips =
      DaylightSavingsFilterChipsUtils.convertFiltersToChips(filters);

    this.requestState = {
      ...this.requestState,
      chapterId: filters.chapterId || undefined,
      chapterName: filters.chapterName || undefined,
      timeZone: filters.timeZone || undefined,
      dstOffSet: filters.dstOffSet ?? undefined
    };

    this.tableConfig.pagination!.pageIndex = 0;
    this.loadData();
  }

  clearAllFilters(): void {
    this.appliedFilters = null;
    this.filterChips = [];

    const { chapterId, chapterName, timeZone, dstOffSet, ...rest } =
      this.requestState;

    this.requestState = rest;
    this.tableConfig.pagination!.pageIndex = 0;
    this.loadData();
  }

  /* -------------------------------- SIDE PANEL -------------------------------- */

  createRecord(): void {
    this.sidePanelMode = 'add';
    this.sidePanelData = null;
    this.sidePanelOpen = true;
  }

  editRecord(record: DaylightSavingsModel): void {
    this.sidePanelMode = 'edit';
    this.sidePanelData = record;
    this.sidePanelOpen = true;
  }

  viewRecord(record: DaylightSavingsModel): void {
    this.sidePanelMode = 'view';
    this.sidePanelData = record;
    this.sidePanelOpen = true;
  }

  closeSidePanel(): void {
    this.sidePanelOpen = false;
    this.sidePanelData = null;
  }

  onSaveSuccess(): void {
    this.loadData();
  }

  /* -------------------------------- FILTER PANEL -------------------------------- */

  openFilter(): void {
    if (this.isFilterOpen) return;

    if (!this.filterBtn) {
      console.error('Filter button reference not available');
      return;
    }

    const filterBtnElement = this.filterBtn.nativeElement;
    const positionStrategy: FlexibleConnectedPositionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(filterBtnElement)
      .withPositions([
        {
          originX: 'start',
          originY: 'bottom',
          overlayX: 'start',
          overlayY: 'top',
          offsetY: 4
        }
      ]);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      scrollStrategy: this.overlay.scrollStrategies.reposition()
    });

    const filterPortal = new ComponentPortal(DaylightSavingsFilterPanel);
    const filterComponentRef = this.overlayRef.attach(filterPortal);

    filterComponentRef.instance.currentFilters = this.appliedFilters;
    filterComponentRef.instance.apply.subscribe((filters: DaylightSavingsFilterValue) => {
      this.applyFilters(filters);
      this.closeFilterPanel();
    });

    filterComponentRef.instance.close.subscribe(() => {
      this.closeFilterPanel();
    });

    this.overlayRef.backdropClick().subscribe(() => {
      this.closeFilterPanel();
    });

    this.isFilterOpen = true;
  }

  private closeFilterPanel(): void {
    this.overlayRef?.dispose();
    this.overlayRef = null;
    this.isFilterOpen = false;
    // Remove focus from filter button
    if (this.filterBtn?.nativeElement) {
      this.filterBtn.nativeElement.blur();
    }
  }

  hasActiveFilters(): boolean {
    return this.filterChips.length > 0;
  }

  onRemoveFilterChip(chipKey: string): void {
    const updatedFilters =
      DaylightSavingsFilterChipsUtils.removeFilterByChipKey(this.appliedFilters, chipKey);

    if (updatedFilters === null) {
      this.clearAllFilters();
    } else {
      this.applyFilters(updatedFilters);
    }
  }

  /* -------------------------------- UTILITIES -------------------------------- */

  private formatDateTime(dateTime: Date | string | null | undefined): string {
    if (!dateTime) return '-';

    const d = new Date(dateTime);
    return `${d.getDate().toString().padStart(2, '0')}-${d
      .toLocaleString('en-US', { month: 'short' })
      .toUpperCase()}-${d.getFullYear()} ${d
      .getHours()
      .toString()
      .padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  }

  private formatOffSet(offset: number | string | null | undefined): string {
    if (offset === null || offset === undefined) return '-';
    const num = typeof offset === 'string' ? parseFloat(offset) : offset;
    if (isNaN(num)) return '-';
    return `${num >= 0 ? '+' : ''}${num.toFixed(2)}`;
  }

  /* -------------------------------- KEYBOARD SHORTCUTS -------------------------------- */

  @HostListener('window:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent): void {
    // Alt+C: Create new record
    if (event.altKey && event.key.toLowerCase() === 'c') {
      event.preventDefault();
      this.createRecord();
    }

    // Alt+S: Focus search field
    if (event.altKey && event.key.toLowerCase() === 's') {
      event.preventDefault();
      const searchInput = document.querySelector<HTMLInputElement>('.search-wrapper input');
      searchInput?.focus();
    }

    // Alt+F: Open filter
    if (event.altKey && event.key.toLowerCase() === 'f') {
      event.preventDefault();
      this.openFilter();
    }

    // Escape: Close filter panel if open
    if (event.key === 'Escape' && this.overlayRef) {
      event.preventDefault();
      this.overlayRef.dispose();
      this.overlayRef = null;
      this.isFilterOpen = false;
    }

    // Escape: Close side panel if open
    if (event.key === 'Escape' && this.sidePanelOpen) {
      event.preventDefault();
      this.closeSidePanel();
    }
  }
}
