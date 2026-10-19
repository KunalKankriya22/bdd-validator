import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';

import { InterdictionUpgradeMatrixService } from './services/interdiction-upgrade-matrix.service';
import {
  InterdictionCodeOption,
  InterdictionUpgradeMatrixModel,
  InterdictionUpgradeMatrixParamsDto,
  InterdictionUpgradeMatrixFilterValue,
  InterdictionUpgradeMatrixFilterLov
} from './models/interdiction-upgrade-matrix.model';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TableColumn,
  RowAction,
  TablePageEvent,
  TableSortEvent,
  TableRowActionEvent,
} from '@shared/interfaces/data-table.interface';

import {
  Overlay,
  OverlayRef,
  FlexibleConnectedPositionStrategy
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';

import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { InterdictionUpgradeMatrixFilterChipsUtils } from './utils/filter-chips.utils';
import { InterdictionUpgradeFilterPanel } from './interdiction-upgrade-filter-panel/interdiction-upgrade-filter-panel';
import { AddEditInterdictionUpgrade } from './add-edit-interdiction-upgrade/add-edit-interdiction-upgrade';

@Component({
  selector: 'app-interdiction-upgrade-matrix',
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
    AddEditInterdictionUpgrade
  ],
  templateUrl: './interdiction-upgrade-matrix.html',
  styleUrls: ['./interdiction-upgrade-matrix.scss']
})
export class InterdictionUpgradeMatrixComponent implements OnInit, OnDestroy {
  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef<HTMLElement>;
  @ViewChild('filterBtn', { read: ElementRef }) filterBtn!: ElementRef<HTMLElement>;

  headerConfig!: PageHeaderConfig;

  // Search
  searchConfig: SearchBarConfig = {
    placeholder: 'Search by Source, Existing, or Action Interdictions',
    minLength: 2,
    ariaLabel: 'Search by Source, Existing, or Action Interdictions',
    debounceTime: 300,
    searchOnEnterOnly: true,
    alwaysShowTooltip: true
  };

  searchTerm = '';

  tableConfig: DataTableConfig<InterdictionUpgradeMatrixModel> = {
    columns: [],
    rowActions: [],
    pagination: {
      pageSize: 25,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50, 100],
      showFirstLastButtons: true
    },
    sortConfig: {
      column: 'sourceInterdiction',
      direction: 'D'
    },
    stickyHeader: true,
    stickyActionsColumn: true,
    emptyMessage: '',
    loadingMessage: '',
    showPagination: true
  };

  appliedFilters: InterdictionUpgradeMatrixFilterValue | null = null;
  filterChips: FilterChip[] = [];

  dataSource: InterdictionUpgradeMatrixModel[] = [];
  requestState: InterdictionUpgradeMatrixParamsDto = {
    Sort: 'D'
  };

  isLoading = false;
  hasError = false;
  errorMessage = '';

  // Lookup data loaded once by parent and passed to children
  interdictionCodes: InterdictionCodeOption[] = [];
  filterLov: InterdictionUpgradeMatrixFilterLov | null = null;

  // Side Panel State
  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  sidePanelData: InterdictionUpgradeMatrixModel | null = null;

  // Filter Panel State
  isFilterOpen = false;
  private overlayRef: OverlayRef | null = null;

  private destroy$ = new Subject<void>();
  currentYear: number = new Date().getFullYear();

  constructor(
    private interdictionUpgradeMatrixService: InterdictionUpgradeMatrixService,
    private overlay: Overlay,
    private pageHeaderService: PageHeaderService,
    private headerService: HeaderService
  ) {
    // Update header config from menu-items API response
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
    this.setupHeaderConfig();
    this.loadInterdictionCodes();
    this.loadFilterData();
    this.loadData();
    this.subscribeToChapterChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.overlayRef) {
      this.overlayRef.dispose();
    }
  }

  private setupHeaderConfig(): void {
    this.headerConfig = {
      breadcrumbs: [
        { label: 'Home', link: '/home' },
        { label: 'Interdiction Upgrade Matrix', link: null }
      ],
      title: '',
      subtitle: '',
      actions: [{
        label: 'NEW INTERDICTION UPGRADE',
        icon: 'add',
        color: 'accent',
        ariaLabel: 'Create new interdiction upgrade',
        onClick: () => this.createRecord()
      }]
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
        column: 'sourceInterdiction',
        direction: 'D'
      },
      stickyHeader: true,
      stickyActionsColumn: true,
      emptyMessage: 'No interdiction upgrades available to display',
      loadingMessage: 'Loading interdiction upgrade data...',
      showPagination: true
    };
  }

  private getTableColumns(): TableColumn<InterdictionUpgradeMatrixModel>[] {
    return [
      {
        key: 'sourceInterdiction',
        header: 'Source Interdiction',
        sortable: true,
        width: '18%'
      },
      {
        key: 'existingInterdiction',
        header: 'Existing Interdiction',
        width: '20%'
      },
      {
        key: 'actionInterdiction',
        header: 'Action Interdiction',
        width: '20%'
      },
      {
        key: 'action',
        header: 'Action',
        width: '10%',
        valueFormatter: (value) => this.formatAction(value)
      },
      {
        key: 'effectiveDate',
        header: 'Effective Date',
        width: '15%',
        valueFormatter: (value) => this.formatDate(value)
      },
      {
        key: 'terminationDate',
        header: 'Termination Date',
        width: '15%',
        valueFormatter: (value) => this.formatDate(value)
      }
    ];
    // Total: 98%, leaving ~2% for actions column (+ CSS fixed width override)
  }

  private formatAction(action: string | undefined): string {
    if (!action) return '-';
    if (action === 'P') return 'Place';
    if (action === 'R') return 'Release';
    return action;
  }

  private formatDate(date: Date | null | undefined): string {
    if (!date) return '-';

    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = d.getFullYear();

    return `${day}-${month}-${year}`;
  }

  private getRowActions(): RowAction<InterdictionUpgradeMatrixModel>[] {
    return [
      {
        icon: 'edit',
        iconSvg: 'assets/images/icons/edit.svg',
        label: 'Edit interdiction upgrade',
        ariaLabel: 'Edit interdiction upgrade {{sourceInterdiction}}',
        color: 'default',
        action: 'edit'
      }
    ];
  }

  private loadInterdictionCodes(): void {
    this.interdictionUpgradeMatrixService.getInterdictionCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const items = response.data || [];
          this.interdictionCodes = items
            .filter((item: any) => !!item.interCode)
            .map((item: any) => ({ interCode: item.interCode, interDesc: item.interDesc || '' }));
        },
        error: (err) => {
          console.error('Error loading interdiction codes:', err);
          this.interdictionCodes = [];
        }
      });
  }

  private loadFilterData(): void {
    this.interdictionUpgradeMatrixService.getInterdictionUpgradeMatrixFilters()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          let filterData = null;
          if (response.item) {
            filterData = response.item;
          } else if (response.data && response.data.length > 0) {
            filterData = response.data[0];
          } else if (response && (response as any).sourceInterdiction) {
            filterData = response as any;
          }
          this.filterLov = filterData;
        },
        error: (err) => {
          console.error('Error loading filter data:', err);
          this.filterLov = null;
        }
      });
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.dataSource = [];
        this.tableConfig.pagination!.totalRecords = 0;
        this.tableConfig.pagination!.pageIndex = 0;
        this.searchTerm = '';
        this.appliedFilters = null;
        this.filterChips = [];
        this.requestState = { Sort: 'D' };
        this.closeSidePanel();
        this.closeFilter();
        this.loadInterdictionCodes();
        this.loadFilterData();
        this.loadData();
      });
  }

  loadData(): void {
    this.isLoading = true;
    this.hasError = false;

    const skip =
      (this.tableConfig.pagination?.pageIndex || 0) *
      (this.tableConfig.pagination?.pageSize || 25);

    const take = this.tableConfig.pagination?.pageSize || 25;

    this.interdictionUpgradeMatrixService
      .getInterdictionUpgradeMatrix(take, skip, this.requestState)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: { data: InterdictionUpgradeMatrixModel[]; totalRecords: number }) => {
          this.dataSource = response.data;
          this.tableConfig.pagination!.totalRecords = response.totalRecords;
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('Error loading interdiction upgrade data:', error);
          // Show empty table with "No records found" message instead of error state
          this.dataSource = [];
          this.tableConfig.pagination!.totalRecords = 0;
          this.tableConfig.emptyMessage = 'No records found';
          this.isLoading = false;
        }
      });
  }

  onSearch(searchText: string): void {
    // Update searchTerm and requestState
    this.searchTerm = searchText;
    this.requestState.SearchKeyword = searchText?.trim() || undefined;

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.updateEmptyMessage();
    this.loadData();
  }

  onSearchCleared(): void {
    // Clear search
    this.searchTerm = '';
    this.requestState.SearchKeyword = undefined;

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.updateEmptyMessage();
    this.loadData();
  }

  onPageChange(event: TablePageEvent): void {
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = event.pageIndex;
      this.tableConfig.pagination.pageSize = event.pageSize;
    }
    this.loadData();
  }

  onSortChange(event: TableSortEvent): void {
    this.tableConfig.sortConfig!.column = event.column;
    this.tableConfig.sortConfig!.direction = event.direction;

    this.requestState.Sort =
      event.direction === 'default' ? undefined : event.direction;

    // Reset to first page when sorting changes to sort entire dataset
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  onRowAction(event: TableRowActionEvent<InterdictionUpgradeMatrixModel>): void {
    switch (event.action) {
      case 'edit':
        this.editRecord(event.row);
        break;
    }
  }

  createRecord(): void {
    this.sidePanelMode = 'add';
    this.sidePanelData = null;
    this.sidePanelOpen = true;
  }

  editRecord(record: InterdictionUpgradeMatrixModel): void {
    this.sidePanelMode = 'edit';
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

  onModeChange(newMode: 'add' | 'edit'): void {
    this.sidePanelMode = newMode;
    if (newMode === 'add') {
      this.sidePanelData = null;
    }
  }

  openFilter(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
      this.isFilterOpen = false;
      return;
    }

    this.isFilterOpen = true;

    const positionStrategy: FlexibleConnectedPositionStrategy =
      this.overlay.position()
        .flexibleConnectedTo(this.tableCard)
        .withPositions([
          {
            originX: 'start',
            originY: 'top',
            overlayX: 'start',
            overlayY: 'top',
            offsetX: 0,
            offsetY: 56
          }
        ])
        .withPush(true)
        .withViewportMargin(16)
        .withFlexibleDimensions(false)
        .withGrowAfterOpen(false);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      scrollStrategy: this.overlay.scrollStrategies.block(),
      width: '320px',
      minWidth: '320px',
      maxWidth: '320px'
    });

    const portal = new ComponentPortal(InterdictionUpgradeFilterPanel);
    const componentRef = this.overlayRef.attach(portal);

    componentRef.instance.currentFilters = this.appliedFilters;
    componentRef.instance.filterLov = this.filterLov;
    componentRef.instance.interdictionCodes = this.interdictionCodes;
    componentRef.instance.populateFilterOptions();

    componentRef.instance.apply
      .pipe(takeUntil(this.destroy$))
      .subscribe(filters => {
        this.applyFilters(filters);
        this.closeFilter();
      });

    componentRef.instance.close
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.closeFilter();
      });

    this.overlayRef.backdropClick()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.closeFilter();
      });
  }

  closeFilter(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
    this.isFilterOpen = false;
    // Remove focus from filter button
    if (this.filterBtn?.nativeElement) {
      this.filterBtn.nativeElement.blur();
    }
  }

  applyFilters(filters: InterdictionUpgradeMatrixFilterValue): void {
    this.appliedFilters = filters;

    this.filterChips = InterdictionUpgradeMatrixFilterChipsUtils.convertFiltersToChips(filters);

    this.requestState = {
      ...this.requestState,
      SourceInterdiction: filters.sourceInterdiction || undefined,
      ExistingInterdiction: filters.existingInterdiction || undefined,
      ActionInterdiction: filters.actionInterdiction || undefined,
      Action: filters.action || undefined
    };

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.updateEmptyMessage();
    this.loadData();
  }

  onRemoveFilterChip(chipKey: string): void {
    this.appliedFilters = InterdictionUpgradeMatrixFilterChipsUtils.removeFilterByChipKey(
      this.appliedFilters,
      chipKey
    );

    this.filterChips = InterdictionUpgradeMatrixFilterChipsUtils.convertFiltersToChips(this.appliedFilters);

    this.updateRequestStateFromFilters();

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.updateEmptyMessage();
    this.loadData();
  }

  hasActiveFilters(): boolean {
    return InterdictionUpgradeMatrixFilterChipsUtils.hasActiveFilters(this.appliedFilters);
  }

  clearAllFilters(): void {
    this.appliedFilters = null;
    this.filterChips = [];

    const { SourceInterdiction, ExistingInterdiction, ActionInterdiction, Action, ...rest } = this.requestState;
    this.requestState = rest;

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.updateEmptyMessage();
    this.loadData();
  }

  /**
   * Update empty message based on active search/filters
   */
  private updateEmptyMessage(): void {
    const hasSearch = !!this.requestState.SearchKeyword;
    const hasFilters = this.hasActiveFilters();

    if (hasSearch || hasFilters) {
      this.tableConfig.emptyMessage = 'No records found';
    } else {
      this.tableConfig.emptyMessage = 'No interdiction upgrades available to display';
    }
  }

  private updateRequestStateFromFilters(): void {
    if (!this.appliedFilters) {
      const { SourceInterdiction, ExistingInterdiction, ActionInterdiction, Action, ...rest } = this.requestState;
      this.requestState = rest;
      return;
    }

    this.requestState = {
      ...this.requestState,
      SourceInterdiction: this.appliedFilters.sourceInterdiction || undefined,
      ExistingInterdiction: this.appliedFilters.existingInterdiction || undefined,
      ActionInterdiction: this.appliedFilters.actionInterdiction || undefined,
      Action: this.appliedFilters.action || undefined
    };
  }

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

    // Alt+F: Toggle filter
    if (event.altKey && event.key.toLowerCase() === 'f') {
      event.preventDefault();
      this.openFilter();
    }

    // Escape: Close filter panel or side panel
    if (event.key === 'Escape') {
      if (this.overlayRef) {
        event.preventDefault();
        this.closeFilter();
      } else if (this.sidePanelOpen) {
        event.preventDefault();
        this.closeSidePanel();
      }
    }
  }
}
