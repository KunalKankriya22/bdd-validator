import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef, effect, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil } from 'rxjs';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';

import { BoxCapacityService } from './services/box-capacity.service';
import {
  BoxCapacityModel,
  BoxCapacityParamsDto,
  BoxCapacityFilterValue
} from './models/box-capacity.model';

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
import { BoxCapacityFilterChipsUtils } from './utils/filter-chips.utils';
import { BoxCapacityFilterPanel } from './box-capacity-filter-panel/box-capacity-filter-panel';
import { AddEditBoxCapacity } from './add-edit-box-capacity/add-edit-box-capacity';

@Component({
  selector: 'app-box-capacity',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    DataTable,
    FilterChips,
    AddEditBoxCapacity
  ],
  templateUrl: './box-capacity.html',
  styleUrls: ['./box-capacity.scss']
})
export class BoxCapacityComponent implements OnInit, OnDestroy {
  @ViewChild(SearchBar) searchBarComponent!: SearchBar;
  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef<HTMLElement>;
  @ViewChild('filterBtn', { read: ElementRef }) filterBtn!: ElementRef<HTMLElement>;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
    actions: []
  };

  searchConfig: SearchBarConfig = {
    placeholder: '',
    minLength: 3,
    ariaLabel: ''
  };

  tableConfig: DataTableConfig<BoxCapacityModel> = {
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
      column: 'boxType',
      direction: 'default'
    },
    stickyHeader: true,
    stickyActionsColumn: true,
    emptyMessage: '',
    loadingMessage: '',
    showPagination: true
  };

  appliedFilters: BoxCapacityFilterValue | null = null;
  filterChips: FilterChip[] = [];

  dataSource: BoxCapacityModel[] = [];
  requestState: BoxCapacityParamsDto = {};

  isLoading = false;
  hasError = false;
  errorMessage = '';
  searchText = '';

  // Side Panel State
  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  sidePanelData: BoxCapacityModel | null = null;

  // Filter Panel State
  isFilterOpen = false;

  private destroy$ = new Subject<void>();
  private overlayRef: OverlayRef | null = null;
  currentYear: number = new Date().getFullYear();

  // Default title (fallback if API doesn't return it)
  private readonly defaultTitle = 'Box Capacity';

  constructor(
    private boxCapacityService: BoxCapacityService,
    private router: Router,
    private overlay: Overlay,
    private pageHeaderService: PageHeaderService,
    private cdr: ChangeDetectorRef,
    private headerService: HeaderService
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
    delete this.requestState.searchKeyword;
    if (this.searchBarComponent) {
      this.searchBarComponent.searchText = '';
    }

    // Clear filters
    this.appliedFilters = null;
    this.filterChips = [];
    const {
      boxType,
      productType,
      capacity,
      capacityRange,
      effectiveDate,
      effectiveDatePeriod,
      terminationDate,
      terminationDatePeriod,
      ...rest
    } = this.requestState;
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
      this.tableConfig.sortConfig.column = 'boxType';
      this.tableConfig.sortConfig.direction = 'default';
    }

    // Clear table data and reload for new chapter
    this.dataSource = [];
    this.hasError = false;
    this.loadData();
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
        label: 'ADD NEW BOX CAPACITY',
        icon: 'add',
        color: 'accent',
        ariaLabel: 'Create new box capacity record',
        onClick: () => this.createRecord()
      }]
    };

    this.searchConfig = {
      placeholder: 'Search by box type or description',
      minLength: 2,
      ariaLabel: 'Search by box type or description',
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
        column: 'boxType',
        direction: 'default'
      },
      stickyHeader: true,
      stickyActionsColumn: true,
      emptyMessage: 'No box capacity records available to display',
      loadingMessage: 'Loading box capacity data...',
      showPagination: true
    };
  }

  private getTableColumns(): TableColumn<BoxCapacityModel>[] {
    return [
      {
        key: 'boxType',
        header: 'Box Type',
        sortable: true,
        width: '120px'
      },
      {
        key: 'boxDescription',
        header: 'Description',
        width: '150px'
      },
      {
        key: 'inventoryProdType',
        header: 'Inventory Product Type',
        width: '160px'
      },
      {
        key: 'prodDescription',
        header: 'Description',
        width: '180px'
      },
      {
        key: 'capacity',
        header: 'Capacity',
        width: '100px'
      },
      {
        key: 'effectiveDate',
        header: 'Effective Date',
        width: '140px',
        valueFormatter: (value) => this.formatDate(value)
      },
      {
        key: 'terminationDate',
        header: 'Termination Date',
        width: '140px',
        valueFormatter: (value) => this.formatDate(value)
      },
      {
        key: 'lastModificationDate',
        header: 'Modification Date',
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

  private getRowActions(): RowAction<BoxCapacityModel>[] {
    return [
      {
        icon: 'edit',
        iconSvg: 'assets/images/icons/edit.svg',
        label: 'Edit box capacity',
        ariaLabel: 'Edit box capacity {{boxType}}',
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

    this.boxCapacityService
      .getBoxCapacity(take, skip, this.requestState)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: { data: BoxCapacityModel[]; totalRecords: number }) => {
          // Create new array reference to ensure Angular change detection picks up the update
          this.dataSource = [...response.data];
          this.tableConfig.pagination!.totalRecords = response.totalRecords;
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('Error loading box capacity data:', error);
          this.hasError = true;
          this.isLoading = false;
          this.errorMessage = 'Failed to load box capacity data. Please try again.';
        }
      });
  }

  onSearch(searchText: string): void {
    this.requestState.searchKeyword = searchText || undefined;

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

    this.requestState.sort =
      event.direction === 'default' ? undefined : event.direction;

    this.loadData();
  }

  onRowAction(event: TableRowActionEvent<BoxCapacityModel>): void {
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

  editRecord(record: BoxCapacityModel): void {
    this.sidePanelMode = 'edit';
    this.sidePanelData = record;
    this.sidePanelOpen = true;
  }

  closeSidePanel(): void {
    this.sidePanelOpen = false;
    this.sidePanelData = null;
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

    const portal = new ComponentPortal(BoxCapacityFilterPanel);
    const componentRef = this.overlayRef.attach(portal);

    componentRef.instance.currentFilters = this.appliedFilters;

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

  applyFilters(filters: BoxCapacityFilterValue): void {
    this.appliedFilters = filters;

    this.filterChips = BoxCapacityFilterChipsUtils.convertFiltersToChips(filters);

    // Map filter values to backend parameter names
    this.requestState = {
      ...this.requestState,
      boxType: filters.boxType || undefined,
      productType: filters.inventoryProductType || undefined,
      capacity: filters.capacity !== null ? filters.capacity : undefined,
      capacityRange: filters.capacityRange || undefined,
      effectiveDate: filters.effectiveDate ? this.toISOStringWithoutTimezone(filters.effectiveDate) : undefined,
      effectiveDatePeriod: filters.effectiveDatePeriod || undefined,
      terminationDate: filters.terminationDate ? this.toISOStringWithoutTimezone(filters.terminationDate) : undefined,
      terminationDatePeriod: filters.terminationDatePeriod || undefined
    };

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  /**
   * Convert Date to ISO string without timezone shift
   * Preserves the local date by using UTC at noon
   */
  private toISOStringWithoutTimezone(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T12:00:00.000Z`;
  }

  onRemoveFilterChip(chipKey: string): void {
    this.appliedFilters = BoxCapacityFilterChipsUtils.removeFilterByChipKey(
      this.appliedFilters,
      chipKey
    );

    this.filterChips = BoxCapacityFilterChipsUtils.convertFiltersToChips(this.appliedFilters);

    this.updateRequestStateFromFilters();

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  hasActiveFilters(): boolean {
    return BoxCapacityFilterChipsUtils.hasActiveFilters(this.appliedFilters);
  }

  clearAllFilters(): void {
    this.appliedFilters = null;
    this.filterChips = [];

    // Remove filter parameters
    const {
      boxType,
      productType,
      capacity,
      capacityRange,
      effectiveDate,
      effectiveDatePeriod,
      terminationDate,
      terminationDatePeriod,
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
      // Remove filter parameters
      const {
        boxType,
        productType,
        capacity,
        capacityRange,
        effectiveDate,
        effectiveDatePeriod,
        terminationDate,
        terminationDatePeriod,
        ...rest
      } = this.requestState;
      this.requestState = rest;
      return;
    }

    // Map filter values to backend parameter names
    this.requestState = {
      ...this.requestState,
      boxType: this.appliedFilters.boxType || undefined,
      productType: this.appliedFilters.inventoryProductType || undefined,
      capacity: this.appliedFilters.capacity !== null ? this.appliedFilters.capacity : undefined,
      capacityRange: this.appliedFilters.capacityRange || undefined,
      effectiveDate: this.appliedFilters.effectiveDate ? this.toISOStringWithoutTimezone(this.appliedFilters.effectiveDate) : undefined,
      effectiveDatePeriod: this.appliedFilters.effectiveDatePeriod || undefined,
      terminationDate: this.appliedFilters.terminationDate ? this.toISOStringWithoutTimezone(this.appliedFilters.terminationDate) : undefined,
      terminationDatePeriod: this.appliedFilters.terminationDatePeriod || undefined
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
      this.closeFilterPanel();
    }

    // Escape: Close side panel if open
    if (event.key === 'Escape' && this.sidePanelOpen) {
      event.preventDefault();
      this.closeSidePanel();
    }
  }
}
