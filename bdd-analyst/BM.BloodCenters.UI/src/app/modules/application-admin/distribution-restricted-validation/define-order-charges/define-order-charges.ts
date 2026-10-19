import { Component, OnInit, OnDestroy, ViewChild, ElementRef, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { Overlay, OverlayRef, FlexibleConnectedPositionStrategy } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TablePageEvent, TableSortEvent, TableRowActionEvent } from '@shared/interfaces/data-table.interface';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { MenuService } from '@shared/services/menu.service';
import { HeaderService } from '@shared/services/header.service';
import { ROUTE_REGISTRY } from '../../../../core/constants/route-registry';
import { RouteKey } from '../../../../core/constants/route-keys';
import { ROUTES } from '../../../../core/constants/route.constants';
import { DefineOrderChargesService } from './services/define-order-charges.service';
import { OrderChargeModel, OrderChargesFilterFormValue, OrderChargesRequestParams } from './models/define-order-charges.model';
import { DefineOrderChargesFilterPanel } from './define-order-charges-filter-panel/define-order-charges-filter-panel';
import { AddEditOrderCharges } from './add-edit-order-charges/add-edit-order-charges';
import { DefineOrderChargesFilterChipsUtils } from './utils/filter-chips.utils';

@Component({
  selector: 'app-define-order-charges',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatSnackBarModule,
    MatTooltipModule,
    DataTable,
    PageHeaderWithBreadcrumb,
    FilterChips,
    SearchBar,
    DefineOrderChargesFilterPanel,
    AddEditOrderCharges
  ],
  templateUrl: './define-order-charges.html',
  styleUrls: ['./define-order-charges.scss']
})
export class DefineOrderChargesComponent implements OnInit, OnDestroy {
  private service = inject(DefineOrderChargesService);
  private snackBar = inject(MatSnackBar);
  private overlay = inject(Overlay);
  private menuService = inject(MenuService);
  private headerService = inject(HeaderService);

  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef;
  @ViewChild('filterBtn', { read: ElementRef }) filterBtn!: ElementRef;
  @ViewChild(DataTable) dataTable!: DataTable<OrderChargeModel>;

  // Component state
  dataSource: OrderChargeModel[] = [];
  isLoading = false;
  hasError = false;
  errorMessage = '';
  searchText = '';

  // Side panel state (add/edit)
  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  sidePanelData: OrderChargeModel | null = null;

  // Filter state
  isFilterOpen = false;
  appliedFilters: OrderChargesFilterFormValue | null = null;
  filterChips: FilterChip[] = [];
  private overlayRef: OverlayRef | null = null;

  // Request params
  requestState: OrderChargesRequestParams = {};

  // Configurations
  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
    actions: [{
      label: 'ADD NEW CHARGE',
      icon: 'add',
      color: 'accent',
      ariaLabel: 'Add new order charge',
      onClick: () => this.createRecord(),
      disabled: false  // Will be updated dynamically
    }]
  };

  tableConfig: DataTableConfig<OrderChargeModel> = {
    columns: [
      { key: 'serviceCode', header: 'Service Code', sortable: true, width: '140px' },
      { key: 'serviceCodeDescription', header: 'Service Code Description', sortable: false, width: '220px' },
      { key: 'charge', header: 'Charge', sortable: false, width: '110px' },
      { key: 'modifyCharge', header: 'Modify Charge', sortable: false, width: '90px' },
      { key: 'chargeType', header: 'Charge Type', sortable: false, width: '90px' },
      {
        key: 'shipmentCharge',
        header: 'Shipment Charge',
        sortable: false,
        width: '100px',
        valueFormatter: (value) => {
          const map: Record<string, string> = { 'Y': 'Yes', 'N': 'No', 'S': 'Default', 'B': 'Box' };
          return map[value as string] || value;
        }
      },
      { key: 'orderNumber', header: 'Order Number Required', sortable: false, width: '130px' },
      { key: 'serviceCodeDuplicate', header: 'Service Code', sortable: false, width: '117px', valueFormatter: (value, row) => row.serviceCode },
      { key: 'effectiveDate', header: 'Effective Date', sortable: false, width: '135px' },
      { key: 'targetDate', header: 'Termination Date', sortable: false, width: '140px' }
    ],
    rowActions: [
      {
        action: 'edit',
        icon: 'edit',
        ariaLabel: 'Edit order charge'
      }
    ],
    pagination: {
      pageSize: 25,
      pageIndex: 0,
      pageSizeOptions: [10, 25, 50, 100],
      totalRecords: 0,
      showFirstLastButtons: true
    },
    sortConfig: {
      column: 'serviceCode',
      direction: 'default'
    },
    stickyHeader: true,
    stickyActionsColumn: true,
    emptyMessage: 'No order charges available to display',
    noDataIcon: 'edit',
    loadingMessage: 'Loading order charges data...',
    showPagination: true,
    enableRowHighlight: false
  };

  searchConfig: SearchBarConfig = {
    placeholder: 'Search by service code or description',
    minLength: 0,
    ariaLabel: 'Search order charges by service code or description',
    debounceTime: 300,
    searchOnEnterOnly: false
  };

  private destroy$ = new Subject<void>();
  private filterOverlaySub$ = new Subject<void>();

  constructor() {
    effect(() => {
      const menuItems = this.menuService.getMenuItemsSignal()();

      if (menuItems.length > 0) {
        const basePath = ROUTE_REGISTRY[RouteKey.DefineOrderCharges].path;
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
    this.loadData();
    this.subscribeToChapterChanges();
  }

  ngOnDestroy(): void {
    this.closeFilterOverlay();
    this.filterOverlaySub$.next();
    this.filterOverlaySub$.complete();
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Subscribe to chapter changes and reload data
   */
  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.clearAllFilters();
        this.loadData();
      });
  }

  /**
   * Load order charges data
   */
  loadData(): void {
    this.isLoading = true;
    this.hasError = false;

    const skip = (this.tableConfig.pagination?.pageIndex || 0) * (this.tableConfig.pagination?.pageSize || 25);
    const take = this.tableConfig.pagination?.pageSize || 25;

    this.service.getOrderCharges(take, skip, this.requestState)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dataSource = response.data;
          this.tableConfig.pagination!.totalRecords = response.totalRecords;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading order charges:', error);
          this.dataSource = [];
          this.hasError = true;
          this.isLoading = false;
          this.errorMessage = 'Failed to load order charges data. Please try again.';
        }
      });
  }

  /**
   * Open add panel
   */
  createRecord(): void {
    this.sidePanelMode = 'add';
    this.sidePanelData = null;
    this.sidePanelOpen = true;
    if (this.dataTable) this.dataTable.activeRow = null;
    this.updateAddButtonState();
  }

  /**
   * Open edit panel
   */
  editRecord(record: OrderChargeModel): void {
    this.sidePanelMode = 'edit';
    this.sidePanelData = record;
    this.sidePanelOpen = true;
    if (this.dataTable) this.dataTable.activeRow = record;
    this.updateAddButtonState();
  }

  /**
   * Close side panel
   */
  closeSidePanel(): void {
    this.sidePanelOpen = false;
    this.sidePanelData = null;
    if (this.dataTable) this.dataTable.activeRow = null;
    this.updateAddButtonState();
  }

  private updateAddButtonState(): void {
    if (this.headerConfig.actions && this.headerConfig.actions.length > 0) {
      this.headerConfig.actions[0].disabled = false;
    }
  }

  /**
   * Handle successful save
   */
  onSaveSuccess(): void {
    this.loadData();
  }

  /**
   * Open filter panel overlay
   */
  openFilter(): void {
    if (this.isFilterOpen) {
      this.closeFilter();
      return;
    }
    if (!this.filterBtn) return;

    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(this.filterBtn)
      .withPositions([
        {
          originX: 'start',
          originY: 'bottom',
          overlayX: 'start',
          overlayY: 'top'
        }
      ]);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      scrollStrategy: this.overlay.scrollStrategies.reposition()
    });

    const portal = new ComponentPortal(DefineOrderChargesFilterPanel);
    const componentRef = this.overlayRef.attach(portal);

    componentRef.instance.currentFilters = this.appliedFilters;
    componentRef.instance.apply
      .pipe(takeUntil(this.filterOverlaySub$))
      .subscribe((filters: OrderChargesFilterFormValue) => {
        this.applyFilters(filters);
      });
    componentRef.instance.close
      .pipe(takeUntil(this.filterOverlaySub$))
      .subscribe(() => {
        this.closeFilter();
      });

    this.overlayRef.backdropClick()
      .pipe(takeUntil(this.filterOverlaySub$))
      .subscribe(() => {
        this.closeFilter();
      });

    this.isFilterOpen = true;
  }

  /**
   * Close filter panel
   */
  closeFilter(): void {
    this.closeFilterOverlay();
    this.isFilterOpen = false;
    if (this.filterBtn?.nativeElement) {
      this.filterBtn.nativeElement.blur();
    }
  }

  /**
   * Close filter overlay
   */
  private closeFilterOverlay(): void {
    this.filterOverlaySub$.next();
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
  }

  /**
   * Apply filters
   */
  applyFilters(filters: OrderChargesFilterFormValue): void {
    this.appliedFilters = filters;
    this.filterChips = DefineOrderChargesFilterChipsUtils.convertFiltersToChips(filters)
      .map(chip => ({
        ...chip,
        label: chip.label
          .replace(/After:\s*/g, '≥ ')
          .replace(/Before:\s*/g, '≤ ')
      }));

    // Update request state - map filter values to API params based on period
    this.requestState = {
      ...this.requestState,
      filterServiceCode: filters.serviceCode || undefined,
      filterEffectiveDateAfter: filters.effectiveDatePeriod === 'AFTER' ? filters.effectiveDate || undefined : undefined,
      filterEffectiveDateBefore: filters.effectiveDatePeriod === 'BEFORE' ? filters.effectiveDate || undefined : undefined,
      filterTermDateAfter: filters.terminationDatePeriod === 'AFTER' ? filters.terminationDate || undefined : undefined,
      filterTermDateBefore: filters.terminationDatePeriod === 'BEFORE' ? filters.terminationDate || undefined : undefined
    };

    // Reset to first page
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.closeFilter();
    this.loadData();
  }

  /**
   * Remove a filter chip
   */
  removeFilterChip(chipKey: string): void {
    this.appliedFilters = DefineOrderChargesFilterChipsUtils.removeFilterByChipKey(this.appliedFilters, chipKey);
    if (this.appliedFilters) {
      this.applyFilters(this.appliedFilters);
    } else {
      this.clearAllFilters();
    }
  }

  /**
   * Clear all filters
   */
  clearAllFilters(): void {
    this.appliedFilters = null;
    this.filterChips = [];
    delete this.requestState.filterServiceCode;
    delete this.requestState.filterEffectiveDateAfter;
    delete this.requestState.filterEffectiveDateBefore;
    delete this.requestState.filterTermDateAfter;
    delete this.requestState.filterTermDateBefore;

    // Reset to first page
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  /**
   * Handle search
   */
  onSearch(searchText: string): void {
    this.searchText = searchText;
    this.requestState.searchKeyword = searchText || undefined;

    // Reset to first page
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  /**
   * Handle search cleared
   */
  onSearchCleared(): void {
    this.searchText = '';
    this.requestState.searchKeyword = undefined;

    // Reset to first page
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  /**
   * Handle page change
   */
  onPageChange(event: TablePageEvent): void {
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = event.pageIndex;
      this.tableConfig.pagination.pageSize = event.pageSize;
    }
    this.loadData();
  }

  /**
   * Handle sort change
   */
  onSortChange(event: TableSortEvent): void {
    this.tableConfig.sortConfig!.column = event.column;
    this.tableConfig.sortConfig!.direction = event.direction;

    if (event.direction === 'default') {
      this.requestState.sortColumn = undefined;
      this.requestState.sortOrder = undefined;
    } else {
      this.requestState.sortColumn = event.column;
      this.requestState.sortOrder = event.direction === 'A' ? 'ASC' : 'DESC';
    }

    this.loadData();
  }

  /**
   * Handle row action
   */
  onRowAction(event: TableRowActionEvent<OrderChargeModel>): void {
    if (event.action === 'edit') {
      this.editRecord(event.row);
    }
  }

  /**
   * Check if filters are active
   */
  get hasActiveFilters(): boolean {
    return DefineOrderChargesFilterChipsUtils.hasActiveFilters(this.appliedFilters);
  }

}
