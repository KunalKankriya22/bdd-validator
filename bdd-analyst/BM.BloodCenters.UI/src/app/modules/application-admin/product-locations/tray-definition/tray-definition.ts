import { Component, OnInit, OnDestroy, ViewChild, ElementRef, TemplateRef, effect, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { Subject, takeUntil } from 'rxjs';
import { HeaderService } from '@shared/services/header.service';
import { MenuService } from '@shared/services/menu.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { RouteKey } from '../../../../core/constants/route-keys';
import { ROUTE_REGISTRY } from '../../../../core/constants/route-registry';
import { ROUTES } from '../../../../core/constants/route.constants';

import { TrayDefinitionService } from './services/tray-definition.service';
import {
  TrayDto,
  TrayQueryDto,
  TrayDefinitionFilterValue,
  TrayStatusLovDto
} from './models/tray-definition.model';

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
import { FocusTrapFactory, FocusTrap } from '@angular/cdk/a11y';

import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { TrayDefinitionFilterChipsUtils } from './utils/filter-chips.utils';
import { TrayDefinitionFilterPanel } from './tray-definition-filter-panel/tray-definition-filter-panel';
import { AddEditTrayDefinition } from './add-edit-tray-definition/add-edit-tray-definition';
import moment from 'moment';

@Component({
  selector: 'app-tray-definition',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatBadgeModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    DataTable,
    FilterChips,
    AddEditTrayDefinition
  ],
  templateUrl: './tray-definition.html',
  styleUrls: ['./tray-definition.scss']
})
export class TrayDefinitionComponent implements OnInit, OnDestroy {
  private readonly trayDefinitionService = inject(TrayDefinitionService);
  private readonly router = inject(Router);
  private readonly overlay = inject(Overlay);
  private readonly focusTrapFactory = inject(FocusTrapFactory);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly headerService = inject(HeaderService);
  private readonly menuService = inject(MenuService);
  private readonly snackbarService = inject(SnackbarService);

  @ViewChild(SearchBar) searchBarComponent!: SearchBar;
  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef<HTMLElement>;
  @ViewChild('filterBtn', { read: ElementRef }) filterBtn!: ElementRef<HTMLElement>;
  @ViewChild('addNewBtn', { read: ElementRef }) addNewBtn!: ElementRef<HTMLElement>;
  @ViewChild('statusCellTemplate', { static: true }) statusCellTemplate!: TemplateRef<any>;
  @ViewChild(AddEditTrayDefinition, { read: ElementRef }) addEditPanelEl!: ElementRef<HTMLElement>;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: ROUTES.HOME }
    ],
    title: '',
    subtitle: '',
    actions: []
  };

  searchConfig: SearchBarConfig = {
    placeholder: 'Search by Tray Number or Description',
    minLength: 1,
    ariaLabel: 'Search trays by tray number or description',
    searchOnEnterOnly: true
  };

  tableConfig: DataTableConfig<TrayDto> = {
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
      column: 'trayNumber',
      direction: 'default'
    },
    stickyHeader: true,
    stickyActionsColumn: true,
    emptyMessage: 'No tray definitions found',
    loadingMessage: 'Loading tray definitions...',
    showPagination: true
  };

  appliedFilters: TrayDefinitionFilterValue | null = null;
  filterChips: FilterChip[] = [];

  dataSource: TrayDto[] = [];
  requestState: TrayQueryDto = {};

  isLoading = false;
  hasError = false;
  errorMessage = '';
  searchText = '';

  // Side Panel State
  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  sidePanelData: TrayDto | null = null;

  // Filter Panel State
  isFilterOpen = false;

  private sidePanelTriggerEl: HTMLElement | null = null;

  // Status LOV for displaying descriptions
  statusDescriptionMap = new Map<string, string>();

  private destroy$ = new Subject<void>();
  private overlayRef: OverlayRef | null = null;
  private filterFocusTrap: FocusTrap | null = null;

  constructor() {
    this.initializeConfigurations();

    // Watch for menu items and update header config dynamically from menu data
    effect(() => {
      const menuItems = this.menuService.getMenuItemsSignal()();
      if (menuItems.length > 0) {
        const basePath = ROUTE_REGISTRY[RouteKey.TrayDefinition].path;
        const menuItem = this.menuService.findMenuItemByPath(basePath);
        if (menuItem) {
          this.headerConfig = {
            ...this.headerConfig,
            breadcrumbs: [
              { label: 'Home', link: ROUTES.HOME },
              { label: menuItem.label, link: null }
            ],
            title: menuItem.label,
            subtitle: menuItem.remarks || menuItem.subtitle || ''
          };
        }
      }
    });
  }

  ngOnInit(): void {
    // Assign the status cell template to render HTML badges
    // Since statusCellTemplate is static: true, it's available here
    const statusCol = this.tableConfig.columns.find(c => c.key === 'trayStatus');
    if (statusCol && this.statusCellTemplate) {
      statusCol.cellTemplate = this.statusCellTemplate;
    }

    this.loadStatusOptions();
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
      trayNumber,
      trayStatus,
      effectiveDateFrom,
      effectiveDateTo,
      terminationDateFrom,
      terminationDateTo,
      ...rest
    } = this.requestState;
    this.requestState = rest;

    // Reset pagination
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    // Reload status options and data for new chapter
    this.loadStatusOptions();
    this.loadData();
  }

  private initializeConfigurations(): void {
    // Initialize table columns
    this.tableConfig.columns = this.getTableColumns();
    this.tableConfig.rowActions = this.getRowActions();
  }

  private getTableColumns(): TableColumn<TrayDto>[] {
    return [
      {
        key: 'trayNumber',
        header: 'Tray Number',
        sortable: false,
        width: '120px',
        valueFormatter: (_value: any, row: TrayDto) => row.trayNumber || ''
      },
      {
        key: 'trayDescription',
        header: 'Description',
        sortable: false,
        width: '200px',
        valueFormatter: (_value: any, row: TrayDto) => row.trayDescription || ''
      },
      {
        key: 'itemCount',
        header: 'Item/Count',
        sortable: false,
        width: '100px',
        valueFormatter: (_value: any, row: TrayDto) => row.itemCount?.toString() || '0'
      },
      {
        key: 'trayStatus',
        header: 'Status',
        sortable: false,
        width: '140px'
        // cellTemplate is assigned in ngAfterViewInit
      },
      {
        key: 'productType',
        header: 'Product',
        sortable: false,
        width: '150px',
        valueFormatter: (_value: any, row: TrayDto) => row.productType || 'N/A'
      },
      {
        key: 'effectiveDate',
        header: 'Effective Date',
        sortable: false,
        width: '140px',
        valueFormatter: (_value: any, row: TrayDto) => this.formatDate(row.effectiveDate)
      },
      {
        key: 'termDate',
        header: 'Termination Date',
        sortable: false,
        width: '160px',
        valueFormatter: (_value: any, row: TrayDto) => this.formatDate(row.termDate)
      },
      {
        key: 'lastModifiedDate',
        header: 'Last Modified',
        sortable: false,
        width: '160px',
        valueFormatter: (_value: any, row: TrayDto) => this.formatDate(row.lastModifiedDate)
      }
    ];
  }

  private getRowActions(): RowAction<TrayDto>[] {
    return [
      {
        icon: 'edit',
        label: 'Edit',
        action: 'edit',
        ariaLabel: 'Edit tray'
      }
    ];
  }

  private formatDate(date: Date | string | null): string {
    if (!date) return '';
    return moment(date).format('DD-MMM-YYYY').toUpperCase();
  }

  /**
   * Load tray status options to display descriptions in the table
   */
  private loadStatusOptions(): void {
    this.trayDefinitionService.getTrayStatusLov()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (options: TrayStatusLovDto[]) => {
          this.statusDescriptionMap.clear();
          options.forEach(opt => {
            this.statusDescriptionMap.set(opt.code, opt.description);
          });
        },
        error: (error) => {
          console.error('Error loading tray status options:', error);
        }
      });
  }

  /**
   * Get status description from code
   */
  getStatusDescription(code: string): string {
    return this.statusDescriptionMap.get(code) || code;
  }

  loadData(): void {
    const { pageSize = 25, pageIndex = 0 } = this.tableConfig.pagination || {};
    const skip = pageIndex * pageSize;

    // Build filter parameters
    const filters: TrayQueryDto = {
      ...this.requestState
    };

    this.isLoading = true;
    this.hasError = false;

    this.trayDefinitionService.getAllTrays(pageSize, skip, filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dataSource = response.data;
          if (this.tableConfig.pagination) {
            this.tableConfig.pagination.totalRecords = response.totalRecords;
          }
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.hasError = true;
          const errorCode = error.errorCode || '';
          const errorMsg = error.message || 'Failed to load tray definitions';
          this.errorMessage = errorCode ? `Error ${errorCode}: ${errorMsg}` : errorMsg;
          this.isLoading = false;
          this.snackbarService.showError(this.errorMessage);
          this.cdr.detectChanges();
        }
      });
  }

  onSearch(searchText: string): void {
    this.searchText = searchText;

    if (searchText && searchText.trim().length > 0) {
      this.requestState.searchKeyword = searchText.trim();
    } else {
      delete this.requestState.searchKeyword;
    }

    // Reset to first page on search
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  onPageChange(event: TablePageEvent): void {
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageSize = event.pageSize;
      this.tableConfig.pagination.pageIndex = event.pageIndex;
    }
    this.loadData();
  }

  onSort(event: TableSortEvent): void {
    this.requestState.sortColumn = event.column;
    this.requestState.sortOrder = event.direction === 'A' ? 'asc' : 'desc';

    this.loadData();
  }

  onRowAction(event: TableRowActionEvent<TrayDto>): void {
    if (event.action === 'edit') {
      this.openEditPanel(event.row);
    }
  }

  onAddNew(): void {
    this.sidePanelTriggerEl = this.addNewBtn?.nativeElement ?? null;
    this.sidePanelMode = 'add';
    this.sidePanelData = null;
    this.sidePanelOpen = true;
    this.focusSidePanel();
  }

  openEditPanel(tray: TrayDto): void {
    this.sidePanelTriggerEl = document.activeElement as HTMLElement ?? null;
    this.sidePanelMode = 'edit';
    this.sidePanelData = tray;
    this.sidePanelOpen = true;
    this.focusSidePanel();
  }

  private focusSidePanel(): void {
    setTimeout(() => {
      const first = this.addEditPanelEl?.nativeElement?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      first?.focus();
    }, 50);
  }

  onSidePanelClose(): void {
    this.sidePanelOpen = false;
    this.sidePanelData = null;
    setTimeout(() => this.sidePanelTriggerEl?.focus(), 50);
    this.sidePanelTriggerEl = null;
  }

  onSaveSuccess(): void {
    this.loadData(); // Reload the table data
  }

  onOpenFilter(): void {
    if (this.isFilterOpen) {
      this.closeFilterPanel();
      return;
    }

    this.isFilterOpen = true;

    // Create overlay config with position strategy
    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(this.filterBtn)
      .withPositions([
        {
          originX: 'start',
          originY: 'bottom',
          overlayX: 'start',
          overlayY: 'top',
          offsetY: 8
        },
        {
          originX: 'start',
          originY: 'top',
          overlayX: 'start',
          overlayY: 'bottom',
          offsetY: -8
        }
      ])
      .withFlexibleDimensions(false)
      .withPush(false);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      scrollStrategy: this.overlay.scrollStrategies.reposition()
    });

    const filterPortal = new ComponentPortal(TrayDefinitionFilterPanel);
    const componentRef = this.overlayRef.attach(filterPortal);

    // Accessibility: create focus trap inside the overlay panel
    const nativeEl = componentRef.location.nativeElement as HTMLElement;
    this.filterFocusTrap = this.focusTrapFactory.create(nativeEl);
    this.filterFocusTrap.focusInitialElementWhenReady();

    // Pass current filters to the panel
    componentRef.instance.currentFilters = this.appliedFilters;

    // Subscribe to apply event
    componentRef.instance.apply
      .pipe(takeUntil(this.destroy$))
      .subscribe((filters: TrayDefinitionFilterValue) => {
        this.applyFilters(filters);
        this.closeFilterPanel();
      });

    // Subscribe to close event
    componentRef.instance.close
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.closeFilterPanel();
      });

    // Close on backdrop click
    this.overlayRef.backdropClick()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.closeFilterPanel();
      });
  }

  private closeFilterPanel(): void {
    if (this.filterFocusTrap) {
      this.filterFocusTrap.destroy();
      this.filterFocusTrap = null;
    }
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
    this.isFilterOpen = false;
    // Return focus to the filter button after panel closes
    setTimeout(() => this.filterBtn?.nativeElement?.focus(), 50);
  }

  private applyFilters(filters: TrayDefinitionFilterValue): void {
    this.appliedFilters = filters;

    // Convert filters to request params
    if (filters.trayStatus) {
      this.requestState.trayStatus = filters.trayStatus;
    } else {
      delete this.requestState.trayStatus;
    }

    // Effective Date with Period
    if (filters.effectiveDate) {
      const formattedDate = moment(filters.effectiveDate).format('YYYY-MM-DD');
      if (filters.effectiveDatePeriod === 'Before') {
        this.requestState.effectiveDateTo = formattedDate;
        delete this.requestState.effectiveDateFrom;
      } else {
        this.requestState.effectiveDateFrom = formattedDate;
        delete this.requestState.effectiveDateTo;
      }
    } else {
      delete this.requestState.effectiveDateFrom;
      delete this.requestState.effectiveDateTo;
    }

    // Termination Date with Period
    if (filters.terminationDate) {
      const formattedDate = moment(filters.terminationDate).format('YYYY-MM-DD');
      if (filters.terminationDatePeriod === 'Before') {
        this.requestState.terminationDateTo = formattedDate;
        delete this.requestState.terminationDateFrom;
      } else {
        this.requestState.terminationDateFrom = formattedDate;
        delete this.requestState.terminationDateTo;
      }
    } else {
      delete this.requestState.terminationDateFrom;
      delete this.requestState.terminationDateTo;
    }

    // Update filter chips
    this.filterChips = TrayDefinitionFilterChipsUtils.convertFiltersToChips(filters);

    // Reset to first page and reload
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  onRemoveFilterChip(chipKey: string): void {
    this.appliedFilters = TrayDefinitionFilterChipsUtils.removeFilterByChipKey(
      this.appliedFilters,
      chipKey
    );

    if (!this.appliedFilters) {
      this.clearFilters();
    } else {
      this.applyFilters(this.appliedFilters);
    }
  }

  onClearFilters(): void {
    this.clearFilters();
  }

  private clearFilters(): void {
    this.appliedFilters = null;
    this.filterChips = [];

    // Remove filter params from request state
    const {
      trayStatus,
      effectiveDateFrom,
      effectiveDateTo,
      terminationDateFrom,
      terminationDateTo,
      ...rest
    } = this.requestState;

    this.requestState = rest;

    // Reset to first page and reload
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }
}
