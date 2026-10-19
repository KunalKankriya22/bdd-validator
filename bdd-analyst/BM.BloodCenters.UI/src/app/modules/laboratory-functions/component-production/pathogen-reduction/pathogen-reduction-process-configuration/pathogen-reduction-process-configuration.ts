import { Component, OnInit, OnDestroy, HostListener, ViewChild, ChangeDetectorRef, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';

import {
  PathogenReductionProcessConfiguration,
  PathogenReductionProcessConfigurationFilter
} from './models/pathogen-reduction-process-configuration.model';
import { PathogenReductionProcessConfigurationService } from './services/pathogen-reduction-process-configuration.service';
import { SnackbarService } from '@shared/services/snackbar.service';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TableColumn,
  TablePageEvent,
  TableSortEvent,
  TableRowActionEvent
} from '@shared/interfaces/data-table.interface';

import { AddEditPathogenReductionProcessConfiguration } from './add-edit-pathogen-reduction-process-configuration/add-edit-pathogen-reduction-process-configuration';
import { HeaderService } from '@shared/services/header.service';
import { MenuService } from '@shared/services/menu.service';
import { ROUTE_REGISTRY } from '@core/constants/route-registry';
import { RouteKey } from '@core/constants/route-keys';
import { ROUTES } from '@core/constants/route.constants';

@Component({
  selector: 'app-pathogen-reduction-process-configuration',
  standalone: true,
  imports: [
    CommonModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    DataTable,
    AddEditPathogenReductionProcessConfiguration
  ],
  templateUrl: './pathogen-reduction-process-configuration.html',
  styleUrls: ['./pathogen-reduction-process-configuration.scss']
})
export class PathogenReductionProcessConfigurationComponent implements OnInit, OnDestroy {
  @ViewChild(SearchBar) searchBarComponent!: SearchBar;
  @ViewChild(DataTable) dataTableComponent!: DataTable<PathogenReductionProcessConfiguration>;

  private readonly cdr = inject(ChangeDetectorRef);
  private readonly configService = inject(PathogenReductionProcessConfigurationService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly headerService = inject(HeaderService);
  private readonly menuService = inject(MenuService);

  private destroy$ = new Subject<void>();

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [{ label: 'Home', link: ROUTES.HOME }],
    title: '',
    subtitle: '',
    actions: [
      {
        label: 'ADD NEW',
        icon: 'add',
        onClick: () => this.openAddDrawer(),
        color: 'primary',
        matButton: 'raised'
      }
    ]
  };

  searchConfig: SearchBarConfig = {
    placeholder: 'Search by Vol Type Set',
    minLength: 1,
    ariaLabel: 'Search pathogen reduction configurations',
    searchOnEnterOnly: true
  };

  tableConfig: DataTableConfig<PathogenReductionProcessConfiguration> = {
    columns: this.getTableColumns(),
    rowActions: [
      {
        icon: 'edit',
        label: 'Edit configuration',
        ariaLabel: 'Edit configuration',
        color: 'default',
        action: 'edit'
      }
    ],
    pagination: {
      pageSize: 25,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50, 100],
      showFirstLastButtons: true
    },
    sortConfig: {
      column: 'volumeTypeSet',
      direction: 'default'
    },
    stickyHeader: true,
    stickyActionsColumn: true,
    emptyMessage: 'No pathogen reduction configurations found',
    loadingMessage: 'Loading configurations...',
    showPagination: true
  };

  dataSource: PathogenReductionProcessConfiguration[] = [];
  requestState: PathogenReductionProcessConfigurationFilter = {};

  isLoading = false;
  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  sidePanelData: PathogenReductionProcessConfiguration | null = null;

  constructor() {
    effect(() => {
      const menuItems = this.menuService.getMenuItemsSignal()();
      if (menuItems.length > 0) {
        const basePath = ROUTE_REGISTRY[RouteKey.PathogenReductionProcessConfiguration].path;
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
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.closeSidePanel();
        this.loadData();
      });
  }

  private getTableColumns(): TableColumn<PathogenReductionProcessConfiguration>[] {
    return [
      { key: 'volumeTypeSet', header: 'Vol Type Set', width: '130px', sortable: true },
      { key: 'volumeTypeSetDesc', header: 'Description', width: '180px' },
      { key: 'suspensionType', header: 'Suspension Type', width: '140px', valueFormatter: (v) => v || '–' },
      { key: 'equipType', header: 'Equipment Type', width: '140px', valueFormatter: (v) => v || '–' },
      { key: 'minVol', header: 'Min Volume', width: '110px', valueFormatter: (v) => v != null ? String(v) : '–' },
      { key: 'maxVol', header: 'Max Volume', width: '110px', valueFormatter: (v) => v != null ? String(v) : '–' },
      { key: 'finalMaxNoBags', header: 'Max Bags', width: '100px', valueFormatter: (v) => v != null ? String(v) : '–' },
      { key: 'effDate', header: 'Effective Date', width: '140px', valueFormatter: (v) => this.formatDate(v) },
      { key: 'termDate', header: 'Termination Date', width: '150px', valueFormatter: (v) => this.formatDate(v) }
    ];
  }

  private formatDate(date: Date | string | null | undefined): string {
    if (!date) return '–';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }

  loadData(): void {
    this.isLoading = true;

    const skip = this.tableConfig.pagination!.pageIndex * this.tableConfig.pagination!.pageSize;
    const take = this.tableConfig.pagination!.pageSize;

    this.configService.getConfigurations(take, skip, this.requestState)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dataSource = [...(response.data || [])];
          this.tableConfig.pagination!.totalRecords = response.totalRecords || 0;
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.isLoading = false;
          const errorResponse = error.error?.errorResponse;
          const errorMessage = errorResponse
            ? `Error ${errorResponse.errorCode}: ${errorResponse.error}`
            : (error.error?.message || error.message || 'Failed to load configurations');
          this.snackbarService.showError(errorMessage);
          this.cdr.detectChanges();
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
    if (event.direction === 'default') {
      this.requestState.sort = undefined;
    } else {
      const dir = event.direction === 'A' ? 'asc' : 'desc';
      this.requestState.sort = `${event.column}_${dir}`;
    }

    if (this.tableConfig.sortConfig) {
      this.tableConfig.sortConfig.column = event.column;
      this.tableConfig.sortConfig.direction = event.direction;
    }

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  onRowAction(event: TableRowActionEvent<PathogenReductionProcessConfiguration>): void {
    if (event.action === 'edit') {
      this.openEditDrawer(event.row);
    }
  }

  openAddDrawer(): void {
    this.sidePanelMode = 'add';
    this.sidePanelData = null;
    this.sidePanelOpen = true;
    if (this.dataTableComponent) {
      this.dataTableComponent.activeRow = null;
    }
    this.cdr.detectChanges();
  }

  openEditDrawer(row: PathogenReductionProcessConfiguration): void {
    this.sidePanelMode = 'edit';
    this.sidePanelData = row;
    this.sidePanelOpen = true;
    if (this.dataTableComponent) {
      this.dataTableComponent.activeRow = row;
    }
    this.cdr.detectChanges();
  }

  closeSidePanel(): void {
    this.sidePanelOpen = false;
    this.sidePanelData = null;
    if (this.dataTableComponent) {
      this.dataTableComponent.activeRow = null;
    }
    this.cdr.detectChanges();
  }

  onSaved(): void {
    this.loadData();
    if (this.sidePanelMode === 'edit') {
      this.closeSidePanel();
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent): void {
    if (event.altKey && event.key.toLowerCase() === 's') {
      event.preventDefault();
      this.searchBarComponent?.focus();
    }
    if (event.key === 'Escape' && this.sidePanelOpen) {
      this.closeSidePanel();
    }
  }
}
