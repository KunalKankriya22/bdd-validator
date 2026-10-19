import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil } from 'rxjs';
import { MatPaginatorIntl } from '@angular/material/paginator';

import { DonorInterdictionOverrideService } from './services/donor-interdiction-override.service';
import {
  DonorInterdictionOverrideModel,
  DonorInterdictionOverrideSearchParamsDto,
  DonorInterdictionOverrideFilterValue
} from './models/donor-interdiction-override.model';

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
  TableRowActionEvent,
} from '@shared/interfaces/data-table.interface';

import {
  Overlay,
  OverlayRef,
  FlexibleConnectedPositionStrategy
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';

import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { DonorInterdictionOverrideFilterChipsUtils } from './utils/filter-chips.utils';
import { DonorInterdictionOverrideFilterPanel } from './donor-interdiction-override-filter-panel/donor-interdiction-override-filter-panel';
import { AddEditDonorInterdictionOverride } from './add-edit-donor-interdiction-override/add-edit-donor-interdiction-override';
import { HeaderService } from '@shared/services/header.service';

/**
 * Custom MatPaginatorIntl to change "Items per page" to "Rows per page"
 */
export function getDonorInterdictionOverridePaginatorIntl(): MatPaginatorIntl {
  const paginatorIntl = new MatPaginatorIntl();
  paginatorIntl.itemsPerPageLabel = 'Rows per page:';
  return paginatorIntl;
}

@Component({
  selector: 'app-donor-interdiction-override',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    DataTable,
    FilterChips,
    AddEditDonorInterdictionOverride
  ],
  providers: [
    { provide: MatPaginatorIntl, useFactory: getDonorInterdictionOverridePaginatorIntl }
  ],
  templateUrl: './donor-interdiction-override.html',
  styleUrls: ['./donor-interdiction-override.scss']
})
export class DonorInterdictionOverrideComponent implements OnInit, OnDestroy {
  @ViewChild(SearchBar) searchBarComponent!: SearchBar;
  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef<HTMLElement>;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
    actions: []
  };

  searchConfig: SearchBarConfig = {
    placeholder: '',
    minLength: 0,
    debounceTime: 1000,
    ariaLabel: ''
  };

  tableConfig: DataTableConfig<DonorInterdictionOverrideModel> = {
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
      column: 'donorDecisionCode',
      direction: 'A'
    },
    stickyHeader: true,
    stickyActionsColumn: false,
    emptyMessage: '',
    loadingMessage: '',
    showPagination: true
  };

  appliedFilters: DonorInterdictionOverrideFilterValue | null = null;
  filterChips: FilterChip[] = [];

  dataSource: DonorInterdictionOverrideModel[] = [];
  requestState: DonorInterdictionOverrideSearchParamsDto = {};

  isLoading = false;
  hasError = false;
  errorMessage = '';
  searchText = '';

  // Side Panel State
  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  sidePanelData: DonorInterdictionOverrideModel | null = null;

  // Filter Panel State
  isFilterOpen = false;

  private destroy$ = new Subject<void>();
  private overlayRef: OverlayRef | null = null;

  constructor(
    private overrideService: DonorInterdictionOverrideService,
    private overlay: Overlay,
    private pageHeaderService: PageHeaderService,
    private headerService: HeaderService
  ) {
    this.initializeConfigurations();

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
    // Set initial sort state (API expects ASC/DESC)
    this.requestState.sort = 'ASC';
    this.loadData();
    this.subscribeToChapterChanges();
  }

  /**
   * Subscribe to chapter change events from header
   * When chapter changes, reload the grid data
   */
  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Reset to first page and reload data for new chapter
        if (this.tableConfig.pagination) {
          this.tableConfig.pagination.pageIndex = 0;
        }
        this.loadData();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.overlayRef) {
      this.overlayRef.dispose();
    }
  }

  private initializeConfigurations(): void {
    this.headerConfig = {
      breadcrumbs: [
        { label: 'Home', link: '/home' },
        { label: 'Donor Interdiction Override: Tech 1', link: null }
      ],
      actions: [{
        label: 'ADD NEW OVERRIDE',
        icon: 'add',
        color: 'accent',
        ariaLabel: 'Create new donor interdiction override',
        onClick: () => this.createRecord()
      }]
    };

    this.searchConfig = {
      placeholder: 'Search by Interdiction or Description',
      minLength: 0,
      debounceTime: 1000,
      ariaLabel: 'Search donor interdiction overrides',
      searchOnEnterOnly: true
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
        column: 'donorDecisionCode',
        direction: 'default'
      },
      stickyHeader: true,
      stickyActionsColumn: false,
      emptyMessage: 'No donor interdiction overrides available to display',
      loadingMessage: 'Loading donor interdiction override data...',
      showPagination: true
    };
  }

  private getTableColumns(): TableColumn<DonorInterdictionOverrideModel>[] {
    return [
      {
        key: 'donorDecisionCode',
        header: 'Cue',
        sortable: true,
        width: '200px',
        valueFormatter: (_value, row) => {
          const code = row?.donorDecisionCode || '';
          const desc = row?.decisionDesc || '';
          return desc ? `${code} - ${desc}` : code;
        }
      },
      {
        key: 'productType',
        header: 'Inventory Product Type',
        width: '130px'
      },
      {
        key: 'productTypeDesc',
        header: 'Inventory Product Type Description',
        width: '200px'
      },
      {
        key: 'attributeGroup',
        header: 'Attribute Group',
        width: '135px'
      },
      {
        key: 'attributeCode',
        header: 'Attribute Code',
        width: '140px'
      },
      {
        key: 'interCode',
        header: 'Donor Interdiction',
        width: '120px'
      },
      {
        key: 'interDesc',
        header: 'Donor Interdiction Description',
        width: '180px'
      },
      {
        key: 'interType',
        header: 'Type',
        width: '80px'
      },
      {
        key: 'overrideDesc',
        header: 'Override Description',
        width: '180px'
      },
      {
        key: 'effDate',
        header: 'Effective Date',
        width: '130px',
        valueFormatter: (value) => this.formatDate(value)
      },
      {
        key: 'termDate',
        header: 'Termination Date',
        width: '140px',
        valueFormatter: (value) => this.formatDate(value)
      }
    ];
  }

  private formatDate(date: Date | null | undefined): string {
    if (!date) return '-';

    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = d.getFullYear();

    return `${day}-${month}-${year}`;
  }

  private getRowActions(): RowAction<DonorInterdictionOverrideModel>[] {
    return [
      {
        icon: 'edit',
        iconSvg: 'assets/images/icons/edit.svg',
        label: 'Edit override',
        ariaLabel: 'Edit override {{donorDecisionCode}}',
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

    this.overrideService
      .getDonorInterdictionOverrides(take, skip, this.requestState)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: { data: DonorInterdictionOverrideModel[]; totalRecords: number }) => {
          this.dataSource = response.data;
          this.tableConfig.pagination!.totalRecords = response.totalRecords;
          this.isLoading = false;
        },
        error: (error: any) => {
          this.hasError = true;
          this.isLoading = false;
          this.errorMessage = 'Failed to load donor interdiction override data. Please try again.';
        }
      });
  }

  /**
   * Handles (search) event from SearchBar.
   * Triggers automatically as user types (with 1-second debounce from SearchBar component)
   */
  onSearchEvent(searchText: string): void {
    const trimmed = (searchText || '').trim();

    // Clear search and reload all data if search is empty
    if (trimmed === '') {
      this.requestState.searchKeyword = undefined;
      if (this.tableConfig.pagination) {
        this.tableConfig.pagination.pageIndex = 0;
      }
      this.loadData();
      return;
    }

    // Perform search with any text (no minimum length)
    this.requestState.searchKeyword = trimmed;
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }
    this.loadData();
  }

  /**
   * Handles Enter key press on the search bar.
   */
  onEnterSearch(): void {
    // Enter key now just triggers the same search logic
    const text = this.searchBarComponent?.searchText?.trim() || '';
    this.onSearchEvent(text);
  }

  onPageChange(event: TablePageEvent): void {
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = event.pageIndex;
      this.tableConfig.pagination.pageSize = event.pageSize;
    }
    this.loadData();
  }

  onSortChange(event: TableSortEvent): void {
    // Implement 3-state sort cycle: A → D → default → A
    // The shared data-table only toggles between A and D,
    // so we intercept to add the 'default' (unsorted) state.
    let newDirection = event.direction;

    if (this.tableConfig.sortConfig!.column === event.column &&
        this.tableConfig.sortConfig!.direction === 'D' &&
        event.direction === 'A') {
      // Was D, shared component cycled to A — override to default instead
      newDirection = 'default';
    }

    this.tableConfig.sortConfig!.column = event.column;
    this.tableConfig.sortConfig!.direction = newDirection;

    // Convert internal direction ('A'/'D'/'default') to API format ('ASC'/'DESC'/undefined)
    if (newDirection === 'default') {
      this.requestState.sort = undefined;
    } else if (newDirection === 'A') {
      this.requestState.sort = 'ASC';
    } else if (newDirection === 'D') {
      this.requestState.sort = 'DESC';
    }

    this.loadData();
  }

  onRowAction(event: TableRowActionEvent<DonorInterdictionOverrideModel>): void {
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

  editRecord(record: DonorInterdictionOverrideModel): void {
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

    const portal = new ComponentPortal(DonorInterdictionOverrideFilterPanel);
    const componentRef = this.overlayRef.attach(portal);

    componentRef.instance.currentFilters = this.appliedFilters;

    componentRef.instance.apply
      .pipe(takeUntil(this.destroy$))
      .subscribe(filters => {
        this.applyFilters(filters);
        if (this.overlayRef) {
          this.overlayRef.dispose();
          this.overlayRef = null;
          this.isFilterOpen = false;
        }
      });

    componentRef.instance.close
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.overlayRef) {
          this.overlayRef.dispose();
          this.overlayRef = null;
          this.isFilterOpen = false;
        }
      });

    this.overlayRef.backdropClick()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.overlayRef) {
          this.overlayRef.dispose();
          this.overlayRef = null;
          this.isFilterOpen = false;
        }
      });
  }

  /**
   * Convert filter panel's period+date format to API's before/after format
   */
  private convertDateFilters(filters: DonorInterdictionOverrideFilterValue): {
    effectiveDateBefore?: string;
    effectiveDateAfter?: string;
    terminationDateBefore?: string;
    terminationDateAfter?: string;
  } {
    const result: {
      effectiveDateBefore?: string;
      effectiveDateAfter?: string;
      terminationDateBefore?: string;
      terminationDateAfter?: string;
    } = {};

    // Convert effective date
    if (filters.effectiveDate && filters.effectiveDatePeriod) {
      if (filters.effectiveDatePeriod === 'before') {
        result.effectiveDateBefore = filters.effectiveDate;
      } else if (filters.effectiveDatePeriod === 'after') {
        result.effectiveDateAfter = filters.effectiveDate;
      }
    }

    // Convert termination date
    if (filters.terminationDate && filters.terminationDatePeriod) {
      if (filters.terminationDatePeriod === 'before') {
        result.terminationDateBefore = filters.terminationDate;
      } else if (filters.terminationDatePeriod === 'after') {
        result.terminationDateAfter = filters.terminationDate;
      }
    }

    return result;
  }

  applyFilters(filters: DonorInterdictionOverrideFilterValue): void {
    this.appliedFilters = filters;

    this.filterChips = DonorInterdictionOverrideFilterChipsUtils.convertFiltersToChips(filters);

    // Convert period+date format to before/after format for API
    const dateFilters = this.convertDateFilters(filters);

    this.requestState = {
      ...this.requestState,
      donorDecisionCode: filters.donorDecisionCode || undefined,
      interType: filters.interType || undefined,
      effectiveDateBefore: dateFilters.effectiveDateBefore,
      effectiveDateAfter: dateFilters.effectiveDateAfter,
      terminationDateBefore: dateFilters.terminationDateBefore,
      terminationDateAfter: dateFilters.terminationDateAfter
    };

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  onRemoveFilterChip(chipKey: string): void {
    this.appliedFilters = DonorInterdictionOverrideFilterChipsUtils.removeFilterByChipKey(
      this.appliedFilters,
      chipKey
    );

    this.filterChips = DonorInterdictionOverrideFilterChipsUtils.convertFiltersToChips(this.appliedFilters);

    this.updateRequestStateFromFilters();

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  hasActiveFilters(): boolean {
    return DonorInterdictionOverrideFilterChipsUtils.hasActiveFilters(this.appliedFilters);
  }

  clearAllFilters(): void {
    this.appliedFilters = null;
    this.filterChips = [];

    const {
      donorDecisionCode,
      interType,
      effectiveDateBefore,
      effectiveDateAfter,
      terminationDateBefore,
      terminationDateAfter,
      ...rest
    } = this.requestState;
    this.requestState = rest;

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  private updateRequestStateFromFilters(): void {
    if (!this.appliedFilters) {
      const {
        donorDecisionCode,
        interType,
        effectiveDateBefore,
        effectiveDateAfter,
        terminationDateBefore,
        terminationDateAfter,
        ...rest
      } = this.requestState;
      this.requestState = rest;
      return;
    }

    // Convert period+date format to before/after format for API
    const dateFilters = this.convertDateFilters(this.appliedFilters);

    this.requestState = {
      ...this.requestState,
      donorDecisionCode: this.appliedFilters.donorDecisionCode || undefined,
      interType: this.appliedFilters.interType || undefined,
      effectiveDateBefore: dateFilters.effectiveDateBefore,
      effectiveDateAfter: dateFilters.effectiveDateAfter,
      terminationDateBefore: dateFilters.terminationDateBefore,
      terminationDateAfter: dateFilters.terminationDateAfter
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
      this.searchBarComponent?.focus();
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
