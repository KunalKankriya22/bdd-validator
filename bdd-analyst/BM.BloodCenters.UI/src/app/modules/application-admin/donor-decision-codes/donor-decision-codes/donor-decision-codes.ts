import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil } from 'rxjs';
import { DatePipe } from '@angular/common';

import { DonorDecisionCodesService } from '../services/donor-decision-codes.service';
import {
  DonorDecisionCodeModel,
  DonorDecisionCodeParamsDto,
  DonorDecisionCodeFilterValue
} from '../models/donor-decision-codes.model';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
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

import { DonorDecisionCodesFilterPanel } from '../donor-decision-codes-filter-panel/donor-decision-codes-filter-panel';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { FilterChipsUtils } from '../utils/filter-chips.utils';
import { AddEditDonorDecisionCode } from '../add-edit-donor-decision-code/add-edit-donor-decision-code';

@Component({
  selector: 'app-donor-decision-codes',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    DataTable,
    FilterChips,
    DatePipe,
    AddEditDonorDecisionCode
  ],
  templateUrl: './donor-decision-codes.html',
  styleUrls: ['./donor-decision-codes.scss']
})
export class DonorDecisionCodes implements OnInit, OnDestroy {
  @ViewChild(SearchBar) searchBarComponent!: SearchBar;
  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef<HTMLElement>;
  @ViewChild('filterBtn', { read: ElementRef }) filterBtn!: ElementRef<HTMLElement>;

  // Validation constants
  readonly VALIDATION = {
    LIMITS: {
      SEARCH_MIN_LENGTH: 1,
      DEFAULT_PAGE_SIZE: 25,
      DESCRIPTION_TRUNCATE_LENGTH: 50
    }
  };

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

  tableConfig: DataTableConfig<DonorDecisionCodeModel> = {
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
      column: 'barcode',
      direction: 'default'
    },
    stickyHeader: true,
    stickyActionsColumn: true,
    emptyMessage: '',
    loadingMessage: '',
    showPagination: true
  };

  appliedFilters: DonorDecisionCodeFilterValue | null = null;
  filterChips: FilterChip[] = [];

  dataSource: DonorDecisionCodeModel[] = [];
  requestState: DonorDecisionCodeParamsDto = {};

  isLoading = false;
  hasError = false;
  errorMessage = '';
  searchText = '';

  // Side Panel State
  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  sidePanelData: DonorDecisionCodeModel | null = null;
  editingRow: DonorDecisionCodeModel | null = null;

  // Filter State
  isFilterOpen = false;

  private destroy$ = new Subject<void>();
  private overlayRef: OverlayRef | null = null;

  constructor(
    private donorDecisionCodesService: DonorDecisionCodesService,
    private overlay: Overlay,
    private pageHeaderService: PageHeaderService,
    private headerService: HeaderService
  ) {
    this.initializeConfigurations();

    // Bind header data from menu-item API response
    effect(() => {
      const menuItem = this.pageHeaderService.getCurrentMenuItem();
      if (menuItem) {
        // Subtitle priority: remarks (if not empty) > subtitle
        const subtitle = menuItem.remarks?.trim() || menuItem.subtitle?.trim();

        this.headerConfig = {
          ...this.headerConfig,
          title: menuItem.label,
          subtitle: subtitle,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: menuItem.label, link: null }
          ]
        };
      }
    });
  }

  ngOnInit(): void {
    this.subscribeToChapterChanges();
    this.loadTableData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.overlayRef) {
      this.overlayRef.dispose();
    }
  }

  /**
   * Subscribe to chapter change events from header
   * Reloads table data and resets state when chapter changes
   */
  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Reset search and filters
        this.searchText = '';
        if (this.searchBarComponent) {
          this.searchBarComponent.clearSearch();
        }
        this.appliedFilters = null;
        this.filterChips = [];
        this.requestState = {};

        // Close side panel if open
        if (this.sidePanelOpen) {
          this.closeSidePanel();
        }

        // Close filter panel if open
        if (this.overlayRef) {
          this.closeFilterOverlay();
        }

        // Reset pagination
        if (this.tableConfig.pagination) {
          this.tableConfig.pagination.pageIndex = 0;
        }

        // Reload table data for new chapter
        this.loadTableData();
      });
  }

  private initializeConfigurations(): void {
    // Initial header config - title, subtitle, and breadcrumbs will be populated by effect from menu-item API
    this.headerConfig = {
      breadcrumbs: [],
      actions: [{
        label: 'ADD BARCODE MAPPING',
        icon: 'add',
        color: 'accent',
        ariaLabel: 'Add new barcode mapping',
        onClick: () => this.createRecord()
      }]
    };

    this.searchConfig = {
      placeholder: 'Search by Barcode or Description',
      minLength: this.VALIDATION.LIMITS.SEARCH_MIN_LENGTH,
      ariaLabel: 'Search donor decision codes by barcode or description',
      searchOnEnterOnly: true
    };

    this.tableConfig = {
      columns: this.getTableColumns(),
      rowActions: this.getRowActions(),
      pagination: {
        pageSize: this.VALIDATION.LIMITS.DEFAULT_PAGE_SIZE,
        pageIndex: 0,
        totalRecords: 0,
        pageSizeOptions: [10, 25, 50, 100],
        showFirstLastButtons: true
      },
      sortConfig: {
        column: 'barCodeValue',
        direction: 'default'
      },
      stickyHeader: true,
      stickyActionsColumn: true,
      emptyMessage: 'No donor decision codes available to display',
      loadingMessage: 'Loading donor decision codes data...',
      noDataIcon: 'edit',
      showPagination: true,
      enableRowHighlight: false
    };
  }

  private getTableColumns(): TableColumn<DonorDecisionCodeModel>[] {
    return [
      {
        key: 'barCodeValue',
        header: 'Barcode',
        sortable: true,
        width: '120px'
      },
      {
        key: 'donorDecisionCode',
        header: 'Donor Decision Code',
        sortable: false,
        width: '180px'
      },
      {
        key: 'displayCode',
        header: 'Description',
        truncate: true,
        truncateLength: this.VALIDATION.LIMITS.DESCRIPTION_TRUNCATE_LENGTH
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

  private getRowActions(): RowAction<DonorDecisionCodeModel>[] {
    return [
      {
        icon: 'edit',
        iconSvg: 'assets/images/icons/edit.svg',
        label: 'Edit donor decision code',
        ariaLabel: 'Edit donor decision code',
        color: 'default',
        action: 'edit'
      }
    ];
  }

  private formatDate(date: Date | null): string {
    if (!date) return '-';

    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = d.getFullYear();

    return `${day}-${month}-${year}`;
  }

  private formatDateForAPI(date: Date | null): string {
    if (!date) return '';

    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  loadTableData(): void {
    this.isLoading = true;
    this.hasError = false;

    const skip =
      (this.tableConfig.pagination?.pageIndex || 0) *
      (this.tableConfig.pagination?.pageSize || 25);

    const take = this.tableConfig.pagination?.pageSize || 25;

    this.donorDecisionCodesService
      .getDonorDecisionCodes(take, skip, this.requestState)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: response => {
          this.dataSource = response.data;

          this.tableConfig.pagination!.totalRecords = response.totalRecords;

          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading donor decision codes data:', error);
          this.hasError = true;
          this.isLoading = false;
          this.errorMessage = 'Failed to load donor decision codes data. Please try again.';
        }
      });
  }

  onSearch(searchText: string): void {
    this.requestState.searchKeyword = searchText || undefined;

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadTableData();
  }

  onPageChange(event: TablePageEvent): void {
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = event.pageIndex;
      this.tableConfig.pagination.pageSize = event.pageSize;
    }
    this.loadTableData();
  }

  /**
   * Map frontend column keys to API column names
   */
  private mapColumnToAPIName(column: string): string {
    const columnMap: { [key: string]: string } = {
      'barCodeValue': 'BarCodeValue',
      'donorDecisionCode': 'DonorDecisionCode',
      'displayCode': 'DisplayCode',
      'effDate': 'EffDate',
      'termDate': 'TermDate',
      'lastModifiedDate': 'LastModifiedDate'
    };
    return columnMap[column] || column;
  }

  onSortChange(event: TableSortEvent): void {
    this.tableConfig.sortConfig!.column = event.column;
    this.tableConfig.sortConfig!.direction = event.direction;

    if (event.direction === 'default') {
      this.requestState.sort = undefined;
      this.requestState.sortColumn = undefined;
    } else {
      this.requestState.sort = event.direction; // 'A' or 'D'
      this.requestState.sortColumn = this.mapColumnToAPIName(event.column);
    }

    this.loadTableData();
  }

  onRowAction(event: TableRowActionEvent<DonorDecisionCodeModel>): void {
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

  editRecord(record: DonorDecisionCodeModel): void {
    this.sidePanelMode = 'edit';

    // Fetch the latest data from the API using the GET by barcode endpoint
    this.donorDecisionCodesService
      .getDonorDecisionCodeByBarcode(record.barCodeValue)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.sidePanelData = data;
          this.editingRow = record;
          this.sidePanelOpen = true;
        },
        error: (error) => {
          console.error('Error fetching donor decision code details:', error);
          this.hasError = true;
          this.errorMessage = 'Failed to load donor decision code details. Please try again.';

          // Fallback to using the table data if the API call fails
          this.sidePanelData = record;
          this.editingRow = record;
          this.sidePanelOpen = true;
        }
      });
  }

  closeSidePanel(): void {
    this.sidePanelOpen = false;
    this.sidePanelData = null;
    this.editingRow = null;
  }

  onSaveSuccess(): void {
    this.loadTableData();
  }

  /**
   * Helper method to close and clean up the filter overlay
   */
  private closeFilterOverlay(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
    this.isFilterOpen = false;
  }

  openFilter(): void {
    if (this.overlayRef) {
      this.closeFilterOverlay();
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
      .withPush(true)
      .withViewportMargin(24)
      .withFlexibleDimensions(true)
      .withGrowAfterOpen(false);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      scrollStrategy: this.overlay.scrollStrategies.block(),
      panelClass: 'filter-panel-overlay',
      width: '336px',
      minWidth: '336px',
      maxWidth: '336px',
      maxHeight: '80vh'
    });

    const portal = new ComponentPortal(DonorDecisionCodesFilterPanel);
    const componentRef = this.overlayRef.attach(portal);

    componentRef.instance.currentFilters = this.appliedFilters;

    componentRef.instance.apply
      .pipe(takeUntil(this.destroy$))
      .subscribe(filters => {
        this.applyFilters(filters);
        this.closeFilterOverlay();
      });

    componentRef.instance.close
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.closeFilterOverlay();
      });

    this.overlayRef.backdropClick()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.closeFilterOverlay();
      });
  }

  applyFilters(filters: DonorDecisionCodeFilterValue): void {
    this.appliedFilters = filters;

    this.filterChips = FilterChipsUtils.convertFiltersToChips(
      filters,
      (date: Date | null) => this.formatDate(date)
    );

    // Ensure date and period are only included when both are set
    const hasEffectiveDate = filters.effectiveDate && filters.effectiveDatePeriod;
    const hasTerminationDate = filters.terminationDate && filters.terminationDatePeriod;

    this.requestState = {
      ...this.requestState,
      barcode: filters.barcode || undefined,
      donorDecisionCode: filters.donorDecisionCode || undefined,
      effectiveDatePeriod: hasEffectiveDate ? (filters.effectiveDatePeriod?.toUpperCase() || undefined) : undefined,
      effectiveDate: hasEffectiveDate ? this.formatDateForAPI(filters.effectiveDate) : undefined,
      terminationDatePeriod: hasTerminationDate ? (filters.terminationDatePeriod?.toUpperCase() || undefined) : undefined,
      terminationDate: hasTerminationDate ? this.formatDateForAPI(filters.terminationDate) : undefined
    };

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadTableData();
  }

  onRemoveFilterChip(chipKey: string): void {
    this.appliedFilters = FilterChipsUtils.removeFilterByChipKey(this.appliedFilters, chipKey);

    this.filterChips = FilterChipsUtils.convertFiltersToChips(
      this.appliedFilters,
      (date: Date | null) => this.formatDate(date)
    );

    this.updateRequestStateFromFilters();

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadTableData();
  }

  hasActiveFilters(): boolean {
    return FilterChipsUtils.hasActiveFilters(this.appliedFilters);
  }

  clearAllFilters(): void {
    this.appliedFilters = null;
    this.filterChips = [];

    const { barcode, donorDecisionCode, effectiveDatePeriod, effectiveDate, terminationDatePeriod, terminationDate, ...rest } = this.requestState;
    this.requestState = rest;

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadTableData();
  }

  private updateRequestStateFromFilters(): void {
    if (!this.appliedFilters) {
      const { barcode, donorDecisionCode, effectiveDatePeriod, effectiveDate, terminationDatePeriod, terminationDate, ...rest } = this.requestState;
      this.requestState = rest;
      return;
    }

    // Ensure date and period are only included when both are set
    const hasEffectiveDate = this.appliedFilters.effectiveDate && this.appliedFilters.effectiveDatePeriod;
    const hasTerminationDate = this.appliedFilters.terminationDate && this.appliedFilters.terminationDatePeriod;

    this.requestState = {
      ...this.requestState,
      barcode: this.appliedFilters.barcode || undefined,
      donorDecisionCode: this.appliedFilters.donorDecisionCode || undefined,
      effectiveDatePeriod: hasEffectiveDate ? (this.appliedFilters.effectiveDatePeriod?.toUpperCase() || undefined) : undefined,
      effectiveDate: hasEffectiveDate ? this.formatDateForAPI(this.appliedFilters.effectiveDate) : undefined,
      terminationDatePeriod: hasTerminationDate ? (this.appliedFilters.terminationDatePeriod?.toUpperCase() || undefined) : undefined,
      terminationDate: hasTerminationDate ? this.formatDateForAPI(this.appliedFilters.terminationDate) : undefined
    };
  }

  onModeChange(newMode: 'add' | 'edit'): void {
    this.sidePanelMode = newMode;
    if (newMode === 'add') {
      this.sidePanelData = null;
    }
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
      this.closeFilterOverlay();
    }

    // Escape: Close side panel if open
    if (event.key === 'Escape' && this.sidePanelOpen) {
      event.preventDefault();
      this.closeSidePanel();
    }
  }
}
