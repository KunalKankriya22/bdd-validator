import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef, effect, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil } from 'rxjs';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';

import { ReturnReasonsService } from './services/return-reasons.service';
import {
  ReturnReasonsModel,
  ReturnReasonsParamsDto,
  ReturnReasonsFilterValue
} from './models/return-reasons.model';

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
import { ReturnReasonsFilterChipsUtils } from './utils/filter-chips.utils';
import { ReturnReasonsFilterPanel } from './return-reasons-filter-panel/return-reasons-filter-panel';
import { AddEditReturnReasons } from './add-edit-return-reasons/add-edit-return-reasons';

@Component({
  selector: 'app-return-reasons',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    DataTable,
    FilterChips,
    AddEditReturnReasons
  ],
  templateUrl: './return-reasons.html',
  styleUrls: ['./return-reasons.scss']
})
export class ReturnReasonsComponent implements OnInit, OnDestroy {
  @ViewChild(SearchBar) searchBarComponent!: SearchBar;
  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef<HTMLElement>;
  @ViewChild('filterBtn', { read: ElementRef }) filterBtn?: ElementRef<HTMLButtonElement>;
  @ViewChild('tableWrapper', { read: ElementRef }) tableWrapper?: ElementRef<HTMLElement>;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
    actions: []
  };

  searchConfig: SearchBarConfig = {
    placeholder: '',
    minLength: 1,
    ariaLabel: ''
  };

  tableConfig: DataTableConfig<ReturnReasonsModel> = {
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
      column: 'code',
      direction: 'A'
    },
    stickyHeader: true,
    stickyActionsColumn: true,
    emptyMessage: '',
    loadingMessage: '',
    showPagination: true
  };

  appliedFilters: ReturnReasonsFilterValue | null = null;
  filterChips: FilterChip[] = [];
  uniqueLocationTypes: string[] = [];

  dataSource: ReturnReasonsModel[] = [];
  requestState: ReturnReasonsParamsDto = {
    Sort: 'A'  // Initial sort by reason code ascending
  };

  isLoading = false;
  hasError = false;
  errorMessage = '';
  searchText = '';

  // Side Panel State
  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  sidePanelData: ReturnReasonsModel | null = null;

  isFilterOpen = false;

  private destroy$ = new Subject<void>();
  private overlayRef: OverlayRef | null = null;
  private savedScrollPosition = 0;

  // Default title (fallback if API doesn't return it)
  private readonly defaultTitle = 'Return Reasons';

  constructor(
    private returnReasonsService: ReturnReasonsService,
    private router: Router,
    private overlay: Overlay,
    private pageHeaderService: PageHeaderService,
    private headerService: HeaderService,
    private cdr: ChangeDetectorRef
  ) {
    this.initializeConfigurations();

    // Watch for page header data from API and update header config dynamically
    // Use API values directly (including null/empty subtitle)
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          ...this.headerConfig,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title || this.defaultTitle, link: null }
          ],
          title: pageData.title || this.defaultTitle,
          subtitle: pageData.subtitle || ''  // Use API subtitle directly, empty string if null
        };
      }
    });
  }

  ngOnInit(): void {
    // Set the current chapter ID in requestState for filtering
    this.requestState.ChapterId = this.headerService.getCurrentChapterId() || undefined;
    this.loadData();
    this.loadFilterOptions();
    this.subscribeToChapterChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.overlayRef) {
      this.overlayRef.dispose();
    }
  }

  /**
   * Subscribe to chapter change events from HeaderService
   * When chapter changes, reset the page state and reload data
   */
  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.handleChapterChange();
      });
  }

  /**
   * Handle chapter change event
   * Resets all filters, search, pagination, and reloads data for new chapter
   */
  private handleChapterChange(): void {
    // Clear search
    delete this.requestState.SearchKeyword;
    if (this.searchBarComponent) {
      this.searchBarComponent.searchText = '';
    }

    // Clear filters
    this.appliedFilters = null;
    this.filterChips = [];
    const { LocationType, CrNcr, Enforce, EffectiveDate, EffectiveDatePeriod, TerminationDate, TerminationDatePeriod, ...rest } = this.requestState;
    this.requestState = rest;

    // Close side panel if open
    if (this.sidePanelOpen) {
      this.sidePanelOpen = false;
      this.sidePanelData = null;
    }

    // Close filter panel if open
    if (this.isFilterOpen) {
      this.closeFilterPanel();
    }

    // Reset pagination
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
      this.tableConfig.pagination.totalRecords = 0;
    }

    // Reset sort to default
    if (this.tableConfig.sortConfig) {
      this.tableConfig.sortConfig.column = 'code';
      this.tableConfig.sortConfig.direction = 'default';
    }

    // Update chapter ID in request state
    this.requestState.ChapterId = this.headerService.getCurrentChapterId() || undefined;

    // Clear table data and reload for new chapter
    this.dataSource = [];
    this.hasError = false;
    this.uniqueLocationTypes = [];
    this.loadData();
    this.loadFilterOptions();
  }

  private initializeConfigurations(): void {
    this.headerConfig = {
      breadcrumbs: [
        {
          label: 'Home',
          link: '/home'
        },
        {
          label: this.defaultTitle,
          link: null
        }
      ],
      title: this.defaultTitle,
      subtitle: '',  // Will be populated from API
      actions: [{
        label: 'ADD NEW RECORD',
        icon: 'add',
        color: 'accent',
        ariaLabel: 'Add new return reasons record',
        onClick: () => this.createRecord()
      }]
    };

    this.searchConfig = {
      placeholder: 'Search by reason codes or description',
      minLength: 1,
      ariaLabel: 'Search return reasons by reason codes or description',
      searchOnEnterOnly: true,
      alwaysShowTooltip: true
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
        column: 'code',
        direction: 'default'
      },
      stickyHeader: true,
      stickyActionsColumn: true,
      emptyMessage: 'No Return Reason Codes Found',
      loadingMessage: 'Loading return reasons data...',
      showPagination: true
    };
  }

  private getTableColumns(): TableColumn<ReturnReasonsModel>[] {
    return [
      {
        key: 'code',
        header: 'Reason Code',
        sortable: true,
        width: '120px'
      },
      {
        key: 'codeDesc',
        header: 'Description',
        width: '200px'
      },
      {
        key: 'locationType',
        header: 'Location Type',
        width: '150px'
      },
      {
        key: 'crNcr',
        header: 'Credit',
        width: '100px',
        valueFormatter: (value) => this.formatYesNo(value)
      },
      {
        key: 'enforce',
        header: 'Enforce Policy',
        width: '120px',
        valueFormatter: (value) => this.formatYesNo(value)
      },
      {
        key: 'feeCode1',
        header: 'Fee 1',
        width: '100px'
      },
      {
        key: 'feeCode2',
        header: 'Fee 2',
        width: '100px'
      },
      {
        key: 'effDate',
        header: 'Effective Date',
        width: '150px',
        valueFormatter: (value) => this.formatDate(value)
      },
      {
        key: 'termDate',
        header: 'Termination Date',
        width: '150px',
        valueFormatter: (value) => this.formatDate(value)
      },
      {
        key: 'lastModifiedDate',
        header: 'Modification Date',
        width: '150px',
        valueFormatter: (value) => this.formatDate(value)
      }
    ];
  }

  private formatBoolean(value: boolean | undefined): string {
    if (value === undefined || value === null) return '-';
    return value ? 'Yes' : 'No';
  }

  private formatYesNo(value: string | undefined): string {
    if (!value) return '-';
    return value === 'Y' ? 'Yes' : value === 'N' ? 'No' : value;
  }

  private formatDate(date: Date | null | undefined): string {
    if (!date) return '-';

    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = d.getFullYear();

    return `${day}-${month}-${year}`;
  }

  /**
   * Format date to YYYY-MM-DD (date only, no time/timezone)
   * Matches DriveLocation pattern
   */
  private formatDateOnly(date: any): string | null {
    if (!date) return null;
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return null;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private formatStatus(status: string | undefined): string {
    if (!status) return '-';
    return status;
  }

  private getRowActions(): RowAction<ReturnReasonsModel>[] {
    return [
      {
        icon: 'edit',
        iconSvg: 'assets/images/icons/edit.svg',
        label: 'Edit return reasons',
        ariaLabel: 'Edit return reasons {{code}}',
        color: 'default',
        action: 'edit'
      }
    ];
  }

  loadData(): void {
    this.isLoading = true;
    this.hasError = false;

    const skip =
      (this.tableConfig.pagination?.pageIndex || 0) *
      (this.tableConfig.pagination?.pageSize || 10);

    const take = this.tableConfig.pagination?.pageSize || 10;

    this.returnReasonsService
      .getReturnReasons(take, skip, this.requestState)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: { data: ReturnReasonsModel[]; totalRecords: number }) => {
          // Create new array reference to ensure Angular change detection picks up the update
          this.dataSource = [...response.data];
          this.tableConfig.pagination!.totalRecords = response.totalRecords;
          this.isLoading = false;
        },
        error: (error: any) => {
          this.hasError = true;
          this.isLoading = false;
          this.errorMessage = 'Failed to load return reasons data. Please try again.';
        }
      });
  }

  loadFilterOptions(): void {
    /**
     * Load initial data to populate filter dropdown options.
     *
     * Uses the main table API with larger page size to get unique location types.
     * This replaces the separate location-types endpoint call.
     */
    const params: ReturnReasonsParamsDto = {
      Sort: 'A',  // Sort by reason code ascending
      ChapterId: this.headerService.getCurrentChapterId() || undefined
    };

    this.returnReasonsService
      .getReturnReasons(100, 0, params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.extractUniqueLocationTypes(response.data);
        },
        error: (error) => {
          console.error('Error loading filter options:', error);
          this.uniqueLocationTypes = [];
        }
      });
  }

  private extractUniqueLocationTypes(data: ReturnReasonsModel[]): void {
    const locationTypeSet = new Set<string>();
    data.forEach(item => {
      if (item.locationType) {
        locationTypeSet.add(item.locationType);
      }
    });
    this.uniqueLocationTypes = Array.from(locationTypeSet).sort();
  }

  onSearch(searchText: string): void {
    this.requestState.SearchKeyword = searchText || undefined;

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

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

    this.loadData();
  }

  onRowAction(event: TableRowActionEvent<ReturnReasonsModel>): void {
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

  editRecord(record: ReturnReasonsModel): void {
    if (!record.chapterId || !record.code) {
      return;
    }

    // Save current scroll position before opening panel
    this.saveScrollPosition();

    this.isLoading = true;

    this.returnReasonsService.getReturnReasonById(record.chapterId, record.code)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          this.sidePanelMode = 'edit';
          const apiData = response.item || response.data?.[0] || null;

          // Find the matching row in dataSource to maintain reference equality for highlighting
          const matchingRow = apiData
            ? this.dataSource.find(
                row => row.chapterId === apiData.chapterId && row.code === apiData.code
              )
            : undefined;
          this.sidePanelData = matchingRow || apiData;
          this.sidePanelOpen = true;

          // Restore scroll position after view updates
          this.restoreScrollPosition();
        },
        error: (error) => {
          this.isLoading = false;
        }
      });
  }

  closeSidePanel(): void {
    this.sidePanelOpen = false;
    this.sidePanelData = null;

    // Restore scroll position when closing panel
    this.restoreScrollPosition();
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

  closeFilterPanel(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
      this.isFilterOpen = false;
    }

    if (this.filterBtn?.nativeElement) {
      (this.filterBtn.nativeElement as HTMLElement).blur();
    }
    this.cdr.markForCheck();
  }

  openFilter(): void {
    if (this.overlayRef) {
      this.closeFilterPanel();
      return;
    }

    this.isFilterOpen = true;

    const positionStrategy: FlexibleConnectedPositionStrategy = this.overlay
      .position()
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
      .withPush(true);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      scrollStrategy: this.overlay.scrollStrategies.block()
    });

    const portal = new ComponentPortal(ReturnReasonsFilterPanel);
    const componentRef = this.overlayRef.attach(portal);

    componentRef.instance.currentFilters = this.appliedFilters;
    componentRef.instance.locationTypeOptions = this.uniqueLocationTypes;

    componentRef.instance.apply
      .pipe(takeUntil(this.destroy$))
      .subscribe(filters => {
        this.applyFilters(filters);
        this.closeFilterPanel();
      });

    componentRef.instance.close
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.closeFilterPanel();
      });

    this.overlayRef.backdropClick()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.closeFilterPanel();
      });
  }

  applyFilters(filters: ReturnReasonsFilterValue): void {
    this.appliedFilters = filters;

    this.filterChips = ReturnReasonsFilterChipsUtils.convertFiltersToChips(filters);

    // Remove old filter properties to ensure clean state
    const { LocationType, CrNcr, Enforce, EffectiveDate, EffectiveDatePeriod, TerminationDate, TerminationDatePeriod, ...rest } = this.requestState;

    // Build new request state with only active filters (matching DriveLocation pattern)
    this.requestState = {
      ...rest,
      ...(filters.locationType ? { LocationType: filters.locationType } : {}),
      ...(filters.crNcr ? { CrNcr: filters.crNcr === 'Yes' ? 'Y' : 'N' } : {}),
      ...(filters.enforce ? { Enforce: filters.enforce === 'Yes' ? 'Y' : 'N' } : {})
    };

    // Add date filters if present
    if (filters.effectiveDate) {
      const formattedDate = this.formatDateOnly(filters.effectiveDate);
      
      if (formattedDate) {
        this.requestState.EffectiveDate = formattedDate;
      }
    }
    if (filters.effectiveDatePeriod) {      
      this.requestState.EffectiveDatePeriod = filters.effectiveDatePeriod;
    }
    if (filters.terminationDate) {
      const formattedDate = this.formatDateOnly(filters.terminationDate);     
      if (formattedDate) {
        this.requestState.TerminationDate = formattedDate;
      }
    }
    if (filters.terminationDatePeriod) {      
      this.requestState.TerminationDatePeriod = filters.terminationDatePeriod;
    }
   
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  onRemoveFilterChip(chipKey: string): void {
    this.appliedFilters = ReturnReasonsFilterChipsUtils.removeFilterByChipKey(
      this.appliedFilters,
      chipKey
    );

    this.filterChips = ReturnReasonsFilterChipsUtils.convertFiltersToChips(this.appliedFilters);

    this.updateRequestStateFromFilters();

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  hasActiveFilters(): boolean {
    return ReturnReasonsFilterChipsUtils.hasActiveFilters(this.appliedFilters);
  }

  clearAllFilters(): void {
    this.appliedFilters = null;
    this.filterChips = [];

    const { LocationType, CrNcr, Enforce, EffectiveDate, EffectiveDatePeriod, TerminationDate, TerminationDatePeriod, ...rest } = this.requestState;
    this.requestState = rest;

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  private updateRequestStateFromFilters(): void {
    if (!this.appliedFilters) {
      const { LocationType, CrNcr, Enforce, EffectiveDate, EffectiveDatePeriod, TerminationDate, TerminationDatePeriod, ...rest } = this.requestState;
      this.requestState = rest;
      return;
    }

    // Remove old filter properties to ensure clean state
    const { LocationType, CrNcr, Enforce, EffectiveDate, EffectiveDatePeriod, TerminationDate, TerminationDatePeriod, ...rest } = this.requestState;

    // Build new request state with only active filters
    this.requestState = {
      ...rest,
      ...(this.appliedFilters.locationType ? { LocationType: this.appliedFilters.locationType } : {}),
      ...(this.appliedFilters.crNcr ? { CrNcr: this.appliedFilters.crNcr === 'Yes' ? 'Y' : 'N' } : {}),
      ...(this.appliedFilters.enforce ? { Enforce: this.appliedFilters.enforce === 'Yes' ? 'Y' : 'N' } : {})
    };

    // Add date filters if present
    if (this.appliedFilters.effectiveDate) {
      const formattedDate = this.formatDateOnly(this.appliedFilters.effectiveDate);
      if (formattedDate) {
        this.requestState.EffectiveDate = formattedDate;
      }
    }
    if (this.appliedFilters.effectiveDatePeriod) {
      this.requestState.EffectiveDatePeriod = this.appliedFilters.effectiveDatePeriod;
    }
    if (this.appliedFilters.terminationDate) {
      const formattedDate = this.formatDateOnly(this.appliedFilters.terminationDate);
      if (formattedDate) {
        this.requestState.TerminationDate = formattedDate;
      }
    }
    if (this.appliedFilters.terminationDatePeriod) {
      this.requestState.TerminationDatePeriod = this.appliedFilters.terminationDatePeriod;
    }
  }

  private saveScrollPosition(): void {
    const scrollContainer = this.tableWrapper?.nativeElement?.querySelector('.data-table-scroll-wrapper') as HTMLElement;
    if (scrollContainer) {
      this.savedScrollPosition = scrollContainer.scrollTop;
    }
  }

  private restoreScrollPosition(): void {
    setTimeout(() => {
      const scrollContainer = this.tableWrapper?.nativeElement?.querySelector('.data-table-scroll-wrapper') as HTMLElement;
      if (scrollContainer && this.savedScrollPosition > 0) {
        scrollContainer.scrollTop = this.savedScrollPosition;
      }
    }, 100);
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent): void {
    if (event.altKey && event.key.toLowerCase() === 'c') {
      event.preventDefault();
      this.createRecord();
    }

    if (event.altKey && event.key.toLowerCase() === 's') {
      event.preventDefault();
      this.searchBarComponent?.focus();
    }

    if (event.altKey && event.key.toLowerCase() === 'f') {
      event.preventDefault();
      this.openFilter();
    }

    if (event.key === 'Escape' && this.overlayRef) {
      event.preventDefault();
      this.closeFilterPanel();
    }

    if (event.key === 'Escape' && this.sidePanelOpen) {
      event.preventDefault();
      this.closeSidePanel();
    }
  }
}
