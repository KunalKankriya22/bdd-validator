import { Component, OnInit, ViewChild, inject, effect, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { ViewInterdictionCodeService } from '../services/view-interdiction-codes.service';
import { AppliedFilters, InterdictionCodeApiResponse } from '../interfaces/view-interdiction-code.interface';
import { Router } from '@angular/router';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { FilterInterdictionCodes } from '../filter-interdiction-codes/filter-interdiction-codes';
import { AddInterdictionCodes } from '../add-interdiction-codes/add-interdiction-codes';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { ROUTES } from '../../../../core/constants/route.constants';
import { DataTable } from '@shared/components/data-table/data-table';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import {
  DataTableConfig,
  TableColumn,
  RowAction,
  TablePageEvent,
  TableSortEvent,
  TableRowActionEvent
} from '@shared/interfaces/data-table.interface';
import { MenuService } from '@shared/services/menu.service';
import { HeaderService } from '@shared/services/header.service';
import { ROUTE_REGISTRY } from '../../../../core/constants/route-registry';
import { RouteKey } from '../../../../core/constants/route-keys';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-interdiction-codes',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    PageHeaderWithBreadcrumb,
    MatDialogModule,
    MatSidenavModule,
    AddInterdictionCodes,
    FilterChips,
    DataTable,
    SearchBar
  ],
  templateUrl: './view-interdiction-codes.html',
  styleUrls: ['./view-interdiction-codes.scss']
})



export class ViewInterdictionCodesComponent implements OnInit, OnDestroy {
  @ViewChild('drawer') drawer!: MatSidenav;
  @ViewChild(DataTable) dataTableComponent!: DataTable<InterdictionCodeApiResponse>;
  @ViewChild(SearchBar) searchBarComponent!: SearchBar;

  private menuService = inject(MenuService);
  private headerService = inject(HeaderService);
  private destroy$ = new Subject<void>();

  searchConfig: SearchBarConfig = {
    placeholder: 'Search by Interdiction Code or Description',
    minLength: 1,
    ariaLabel: 'Search interdiction codes by code or description',
    searchOnEnterOnly: true,
    alwaysShowTooltip: true
  };

  tableConfig: DataTableConfig<InterdictionCodeApiResponse> = {
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
      column: 'interCode',
      direction: 'default'
    },
    sortIconMap: {
      ascending: 'arrow_upward',
      descending: 'arrow_downward',
      default: 'unfold_more'
    },
    stickyHeader: true,
    stickyActionsColumn: true,
    emptyMessage: 'No interdiction codes available to display',
    loadingMessage: 'Loading interdiction codes...',
    showPagination: true,
    enableRowHighlight: false
  };

  dataSource: InterdictionCodeApiResponse[] = [];
  selectedTabIndex = 1;
  currentSearchText = '';

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
    actions: []
  };

  appliedFilters: AppliedFilters = {};
  filterChips: FilterChip[] = [];

  isDrawerOpen = false;
  drawerMode: 'add' | 'edit' = 'add';
  drawerData: any = null;
  isLoading = false;
  private filterDialogRef: any = null;

  constructor(
    private interdictionCodeService: ViewInterdictionCodeService,
    private router: Router,
    private dialog: MatDialog
  ) {
    this.initializeHeaderConfig();
    this.initializeTableConfig();

    effect(() => {
      const menuItems = this.menuService.getMenuItemsSignal()();

      if (menuItems.length > 0) {
        // Try to find by ViewInterdictionCodes route first
        let menuItem = this.menuService.findMenuItemByPath(
          ROUTE_REGISTRY[RouteKey.ViewInterdictionCodes].path
        );

        // If not found, try DonorInterdictionCodes route (shared menu entry for both Donor and Lab tabs)
        if (!menuItem) {
          menuItem = this.menuService.findMenuItemByPath(
            ROUTE_REGISTRY[RouteKey.DonorInterdictionCodes].path
          );
        }

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
    const navState = history.state as { openLabAddMode?: 'add' | 'edit'; fromTabNavigation?: boolean };

    if (!navState?.fromTabNavigation && !navState?.openLabAddMode) {
      this.router.navigate([ROUTE_REGISTRY[RouteKey.DonorInterdictionCodes].path]);
      return;
    }

    this.subscribeToChapterChanges();
    this.updateFilterChips();
    this.loadData();

    if (navState?.openLabAddMode === 'add') {
      // delay to ensure view + drawer are ready
      setTimeout(() => {
        this.openAddEditDrawer('add');
      });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeHeaderConfig(): void {
    this.headerConfig = {
      breadcrumbs: [],
      title: '',
      subtitle: '',
      actions: [{
        label: 'ADD NEW CODE',
        icon: 'add',
        color: 'accent',
        ariaLabel: 'Add New Code',
        onClick: () => this.openAddEditDrawer('add')
      }]
    };
  }

  /**
   * Subscribe to chapter change events from header
   * Empty subscription as this screen only contains tables
   */
  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Empty subscription - no dropdown data to reload
      });
  }

  private initializeTableConfig(): void {
    this.tableConfig.columns = this.getTableColumns();
    this.tableConfig.rowActions = this.getRowActions();
    this.updateEmptyMessage();
  }

  private updateEmptyMessage(): void {
    const hasFilters = !!(
      this.appliedFilters?.type ||
      this.appliedFilters?.system ||
      this.appliedFilters?.effDate ||
      this.appliedFilters?.termDate
    );
    const hasSearch = !!this.currentSearchText.trim();

    if (hasSearch || hasFilters) {
      this.tableConfig.emptyMessage = 'No results found. Please adjust your search or filter criteria.';
    } else {
      this.tableConfig.emptyMessage = 'No interdiction codes available to display';
    }
  }

  private getTableColumns(): TableColumn<InterdictionCodeApiResponse>[] {
    return [
      {
        key: 'interCode',
        header: 'Code',
        sortable: true,
        width: '120px'
      },
      {
        key: 'interType',
        header: 'Type',
        width: '100px',
        valueFormatter: (value) => this.getInterTypeLabel(value)
      },
      {
        key: 'systemInterCode',
        header: 'System Code',
        width: '140px'
      },
      {
        key: 'systemInterFlag',
        header: 'System',
        width: '100px',
        valueFormatter: (value) => value === 'Y' ? 'Yes' : 'No'
      },
      {
        key: 'interDesc',
        header: 'Description',
        width: '250px'
      },
      {
        key: 'effDate',
        header: 'Effective Date',
        width: '150px',
        valueFormatter: (value) => value ? DateFieldValidationUtility.formatDateForUI(new Date(value)).toUpperCase() || '-' : '-'
      },
      {
        key: 'termDate',
        header: 'Termination Date',
        width: '150px',
        valueFormatter: (value) => value ? DateFieldValidationUtility.formatDateForUI(new Date(value)).toUpperCase() || '-' : '-'
      },
      {
        key: 'lastModifiedDate',
        header: 'Modification Date',
        width: '170px',
        valueFormatter: (value) => this.formatDate(value)
      }
    ];
  }

  private formatDate(date: Date | string | null | undefined): string {
    if (!date) return '-';

    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = d.getFullYear();

    return `${day}-${month}-${year}`;
  }

  private getRowActions(): RowAction<InterdictionCodeApiResponse>[] {
    return [
      {
        icon: 'edit',
        label: 'Edit interdiction code',
        ariaLabel: 'Edit interdiction code {{code}}',
        color: 'default',
        action: 'edit'
      }
    ];
  }

  loadData(): void {
    this.isLoading = true;

    const skip = (this.tableConfig.pagination?.pageIndex || 0) * (this.tableConfig.pagination?.pageSize || 25);
    const take = this.tableConfig.pagination?.pageSize || 25;

    // Convert sort direction from 'A'/'D'/'default' to 'asc'/'desc'/''
    let sortOrder: 'asc' | 'desc' | '' = '';
    if (this.tableConfig.sortConfig?.direction === 'A') {
      sortOrder = 'asc';
    } else if (this.tableConfig.sortConfig?.direction === 'D') {
      sortOrder = 'desc';
    }

    const payload = {
      take,
      skip,
      searchText: this.currentSearchText,

      sortColumn: this.tableConfig.sortConfig?.column || '',
      sortOrder,

      // Filters
      interType: this.appliedFilters?.type || '',
      systemInterFlag: this.appliedFilters?.system || '',

      periodEffDate: this.appliedFilters?.effPeriod || '',
      effectiveDate: this.appliedFilters?.effDate
        ? DateFieldValidationUtility.serializeDateForApi(this.appliedFilters.effDate) || ''
        : '',

      periodTermDate: this.appliedFilters?.termPeriod || '',
      terminationDate: this.appliedFilters?.termDate
        ? DateFieldValidationUtility.serializeDateForApi(this.appliedFilters.termDate) || ''
        : ''
    };

    this.interdictionCodeService
      .getInterdictionCodes(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.dataSource = res.data;
          if (this.tableConfig.pagination) {
            this.tableConfig.pagination.totalRecords = res.totalCount;
          }
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
        }
      });
  }

  onSearch(searchText: string): void {
    this.currentSearchText = searchText || '';
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }
    this.updateEmptyMessage();
    this.loadData();
  }

  onSearchCleared(): void {
    this.currentSearchText = '';
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
    if (this.tableConfig.sortConfig) {
      this.tableConfig.sortConfig.column = event.column;
      this.tableConfig.sortConfig.direction = event.direction;
    }
    this.loadData();
  }

  onRowAction(event: TableRowActionEvent<InterdictionCodeApiResponse>): void {
    // Highlight the row when action is clicked
    if (this.dataTableComponent) {
      this.dataTableComponent.activeRow = event.row;
    }

    switch (event.action) {
      case 'edit':
        this.openAddEditDrawer('edit', event.row);
        break;
    }
  }

  onTabChange(index: number): void {
    this.selectedTabIndex = index;

    // Close filter dialog if open when switching tabs
    if (this.filterDialogRef) {
      this.filterDialogRef.close();
      this.filterDialogRef = null;
    }

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    if (index === 0) {
      // Donor tab
      this.router.navigate([
        '/application-administration/donor-restricted/donor-interdiction-codes'
      ]);
    } else if (index === 1) {
      // Lab tab
      this.router.navigate([
        '/application-administration/lab-restricted/lab-interdiction-codes'
      ], { state: { fromTabNavigation: true } });
    }

    // Optional: only call if data belongs to this page
    this.loadData();
  }


  onFilter(event: MouseEvent): void {
    // Close existing dialog if open
    if (this.filterDialogRef) {
      this.filterDialogRef.close();
    }

    const spacing = 8;
    const button = event.currentTarget as HTMLElement;
    const rect = button.getBoundingClientRect();

    this.filterDialogRef = this.dialog.open(FilterInterdictionCodes, {
      width: '340px',
      panelClass: 'error-filter-dialog',
      disableClose: false,
      hasBackdrop: true,
      backdropClass: 'transparent-backdrop',
      autoFocus: false,
      position: {
        top: `${rect.bottom + spacing}px`,
        left: `${rect.left - 20}px`
      },
      data: {
        type: this.appliedFilters.type,
        system: this.appliedFilters.system,
        effectivePeriod: this.appliedFilters.effPeriod,
        effectiveDate: this.appliedFilters.effDate,
        terminationPeriod: this.appliedFilters.termPeriod,
        terminationDate: this.appliedFilters.termDate
      }
    });

    this.filterDialogRef.afterClosed().subscribe((result: any) => {
      this.filterDialogRef = null;
      button.blur();
      if (result === null) {
        // Clear all
        this.appliedFilters = {};
        this.updateFilterChips();
        if (this.tableConfig.pagination) {
          this.tableConfig.pagination.pageIndex = 0;
        }
        this.updateEmptyMessage();
        this.loadData();
      } else if (result) {
        // Map the filter dialog result to AppliedFilters format
        this.appliedFilters = {
          type: result.type || '',
          system: result.system || '',
          effPeriod: result.effectivePeriod || '',
          effDate: result.effectiveDate || null,
          termPeriod: result.terminationPeriod || '',
          termDate: result.terminationDate || null
        };
        this.updateFilterChips();
        if (this.tableConfig.pagination) {
          this.tableConfig.pagination.pageIndex = 0;
        }
        this.updateEmptyMessage();
        this.loadData();
      }
    });
  }

  getInterTypeLabel(type: string): string {
    switch (type) {
      case 'H': return 'HOLD';
      case 'B': return 'BIO';
      case 'N': return 'NFT';
      case 'I': return 'INITIAL';
      default: return type;
    }
  }

  goHome(): void {
    this.router.navigate(['/home']);
  }

  updateFilterChips(): void {
    const chips: FilterChip[] = [];

    if (this.appliedFilters?.type) {
      chips.push({
        key: 'type',
        label: `Type: ${this.getInterTypeLabel(this.appliedFilters.type)}`,
        value: this.appliedFilters.type
      });
    }

    if (this.appliedFilters?.system) {
      chips.push({
        key: 'system',
        label: `System: ${this.appliedFilters.system === 'Y' ? 'Yes' : 'No'}`,
        value: this.appliedFilters.system
      });
    }

    if (this.appliedFilters?.effDate && this.appliedFilters?.effPeriod) {
      const operator = this.appliedFilters.effPeriod === 'After' ? '≥' : '≤';
      chips.push({
        key: 'effDate',
        label: `Effective Date ${operator} ${DateFieldValidationUtility.formatDateForUI(this.appliedFilters.effDate)}`,
        value: this.appliedFilters.effDate
      });
    }

    if (this.appliedFilters?.termDate && this.appliedFilters?.termPeriod) {
      const operator = this.appliedFilters.termPeriod === 'After' ? '≥' : '≤';
      chips.push({
        key: 'termDate',
        label: `Termination Date ${operator} ${DateFieldValidationUtility.formatDateForUI(this.appliedFilters.termDate)}`,
        value: this.appliedFilters.termDate
      });
    }

    this.filterChips = chips;
  }

  clearAllFilters(): void {
    this.appliedFilters = {};
    this.updateFilterChips();
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }
    this.updateEmptyMessage();
    this.loadData();
  }

  removeFilter(key: string): void {
    switch (key) {
      case 'type':
        delete this.appliedFilters.type;
        break;
      case 'system':
        delete this.appliedFilters.system;
        break;
      case 'effDate':
        delete this.appliedFilters.effDate;
        delete this.appliedFilters.effPeriod;
        break;
      case 'termDate':
        delete this.appliedFilters.termDate;
        delete this.appliedFilters.termPeriod;
        break;
    }

    this.updateFilterChips();
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }
    this.updateEmptyMessage();
    this.loadData();
  }

  openAddEditDrawer(mode: 'add' | 'edit', rowData?: any): void {
    if (mode === 'add' && this.dataTableComponent) {
      this.dataTableComponent.activeRow = null;
    }
    this.drawerMode = mode;
    this.drawerData = rowData;
    this.isDrawerOpen = true;
  }

  closeDrawer(): void {
    this.isDrawerOpen = false;
    this.drawerData = null;
    // Clear row selection when closing the drawer
    if (this.dataTableComponent) {
      this.dataTableComponent.activeRow = null;
    }
  }

  onDrawerSaved(): void {
    this.closeDrawer();
    this.loadData();
  }

}
