import { Component, OnInit, OnDestroy, effect } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import moment from 'moment';

import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, MatPaginatorIntl, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { SnackbarService } from '@shared/services/snackbar.service';

import { TerritoryModel, TerritoryParamsDto, TerritoryFilterValue, LookupItem } from './models/territory.model';
import { TerritoryService } from './services/territory.service';
import { TerritoryFilterPanel } from './territory-filter-panel/territory-filter-panel';
import { AddEditTerritory } from './add-edit-territory/add-edit-territory';
import { buildTerritoryFilterChips } from './utils/filter-chips.utils';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { CdkOverlayOrigin, OverlayModule } from '@angular/cdk/overlay';
import { HeaderService } from '@shared/services/header.service';

/**
 * Custom MatPaginatorIntl to change "Items per page" to "Rows per page"
 */
export function getTerritoryPaginatorIntl(): MatPaginatorIntl {
  const paginatorIntl = new MatPaginatorIntl();
  paginatorIntl.itemsPerPageLabel = 'Rows per page:';
  return paginatorIntl;
}

@Component({
  selector: 'app-territory-management',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    OverlayModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    FilterChips,
    TerritoryFilterPanel,
    AddEditTerritory,
    DatePipe
  ],
  providers: [
    { provide: MatPaginatorIntl, useFactory: getTerritoryPaginatorIntl }
  ],
  templateUrl: './territory-management.html',
  styleUrls: ['./territory-management.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed,void', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)'))
    ])
  ]
})
export class TerritoryManagementComponent implements OnInit, OnDestroy {
  // Page header
  headerConfig!: PageHeaderConfig;

  // Search
  searchConfig: SearchBarConfig = {
    placeholder: 'Search by Short Name or Description',
    minLength: 2,
    ariaLabel: 'Search territories',
    debounceTime: 300,
    searchOnEnterOnly: true,
    alwaysShowTooltip: true
  };

  // Table
  displayedColumns: string[] = [
    'expand', 'territoryId', 'territoryShortName', 'territoryName',
    'territoryGroup', 'territoryType', 'effDate', 'termDate', 'actions'
  ];
  dataSource: TerritoryModel[] = [];
  expandedRows = new Set<TerritoryModel>();
  allExpanded = false;
  isLoading = false;

  // Pagination
  pageSize = 25;
  pageIndex = 0;
  totalRecords = 0;
  pageSizeOptions = [10, 25, 50, 100];

  // Sorting
  sortColumn = 'territoryId';
  sortDirection: 'A' | 'D' | undefined = undefined;

  // Filter
  isFilterOpen = false;
  currentFilters: TerritoryFilterValue = {
    showTerminated: false,
    territoryGroup: null,
    territoryType: null,
    effDatePeriod: null,
    effDate: null,
    termDatePeriod: null,
    termDate: null
  };
  filterChips: FilterChip[] = [];
  searchText = '';

  // Lookups
  groups: LookupItem[] = [];
  types: LookupItem[] = [];

  // Side panel
  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  sidePanelData: TerritoryModel | null = null;

  // Track selected/edited row
  selectedRowId: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private territoryService: TerritoryService,
    private snackbarService: SnackbarService,
    private headerService: HeaderService,
    private pageHeaderService: PageHeaderService
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
    this.loadFilterOptions();
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupHeaderConfig(): void {
    this.headerConfig = {
      breadcrumbs: [
        { label: 'Home', link: '/home' },
        { label: 'Create and Maintain Territories', link: null }
      ],
      title: '',
      subtitle: '',
      actions: [
        {
          label: 'ADD NEW TERRITORY',
          icon: 'add',
          color: 'accent',
          ariaLabel: 'Add new territory',
          onClick: () => this.openAddPanel()
        }
      ]
    };
  }

  private loadFilterOptions(): void {
    this.territoryService.getFilterOptions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (options) => {
          this.groups = options.groups;
          this.types = options.types;
        },
        error: () => {
          this.snackbarService.showError('Failed to load filter options.');
        }
      });
  }

  loadData(expandRowId?: string | null): void {
    this.isLoading = true;
    const skip = this.pageIndex * this.pageSize;

    const chapterId = this.headerService.getCurrentChapterId();

    const params: TerritoryParamsDto = {
      searchText: this.searchText || undefined,
      territoryGroup: this.currentFilters.territoryGroup || undefined,
      territoryType: this.currentFilters.territoryType || undefined,
      showTerminated: this.currentFilters.showTerminated ? 'Yes' : 'No',
      effDate: this.currentFilters.effDate
        ? moment(this.currentFilters.effDate).format('YYYY-MM-DDTHH:mm:ss') + 'Z'
        : undefined,
      effDatePeriod: this.currentFilters.effDatePeriod || undefined,
      termDate: this.currentFilters.termDate
        ? moment(this.currentFilters.termDate).format('YYYY-MM-DDTHH:mm:ss') + 'Z'
        : undefined,
      termDatePeriod: this.currentFilters.termDatePeriod || undefined,
      sort: this.sortDirection || undefined,
      sortColumn: this.sortDirection ? this.sortColumn : undefined,
      chapterId: chapterId || undefined
    };

    this.territoryService.getTerritories(this.pageSize, skip, params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dataSource = response.data;
          this.totalRecords = response.totalRecords;
          this.isLoading = false;
          this.expandedRows.clear();
          this.allExpanded = false;

          if (expandRowId) {
            const editedRow = this.dataSource.find(r => r.territoryId === expandRowId);
            if (editedRow) {
              this.expandedRows.add(editedRow);
              this.selectedRowId = editedRow.territoryId;
              this.updateAllExpandedState();
            }
          }
        },
        error: (error) => {
          // Handle 404 as empty result (no data found), not as an error
          if (error.status === 404) {
            this.dataSource = [];
            this.totalRecords = 0;
            this.isLoading = false;
            this.expandedRows.clear();
            this.allExpanded = false;
          } else {
            this.snackbarService.showError('Failed to load territories.');
            this.isLoading = false;
          }
        }
      });
  }

  // Search
  onSearch(searchText: string): void {
    this.searchText = searchText;
    this.pageIndex = 0;
    this.loadData();
  }

  onSearchCleared(): void {
    this.searchText = '';
    this.pageIndex = 0;
    this.loadData();
  }

  // Sort
  onSort(): void {
    if (this.sortDirection === undefined) {
      this.sortDirection = 'D';
    } else if (this.sortDirection === 'D') {
      this.sortDirection = 'A';
    } else {
      this.sortDirection = 'D';
    }
    this.pageIndex = 0;
    this.loadData();
  }

  getSortIcon(): string {
    if (this.sortDirection === 'A') {
      return 'arrow_upward';
    } else if (this.sortDirection === 'D') {
      return 'arrow_downward';
    } else {
      return 'unfold_more';
    }
  }

  // Pagination
  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    this.loadData();
  }

  // Expandable row
  toggleRow(row: TerritoryModel): void {
    if (this.expandedRows.has(row)) {
      this.expandedRows.delete(row);
    } else {
      this.expandedRows.add(row);
    }
    this.updateAllExpandedState();
  }

  isExpanded(row: TerritoryModel): boolean {
    return this.expandedRows.has(row);
  }

  toggleExpandAll(): void {
    if (this.allExpanded) {
      this.expandedRows.clear();
      this.allExpanded = false;
    } else {
      this.dataSource.forEach(row => this.expandedRows.add(row));
      this.allExpanded = true;
    }
  }

  private updateAllExpandedState(): void {
    this.allExpanded = this.dataSource.length > 0 && this.expandedRows.size === this.dataSource.length;
  }

  // Filter
  toggleFilter(): void {
    this.isFilterOpen = !this.isFilterOpen;
  }

  onFilterApply(filters: TerritoryFilterValue): void {
    this.currentFilters = filters;
    this.filterChips = buildTerritoryFilterChips(filters);
    this.isFilterOpen = false;
    this.pageIndex = 0;
    this.loadData();
  }

  onFilterClose(): void {
    this.isFilterOpen = false;
  }

  removeFilterChip(chipKey: string): void {
    switch (chipKey) {
      case 'showTerminated':
        this.currentFilters = { ...this.currentFilters, showTerminated: false };
        break;
      case 'territoryGroup':
        this.currentFilters = { ...this.currentFilters, territoryGroup: null };
        break;
      case 'territoryType':
        this.currentFilters = { ...this.currentFilters, territoryType: null };
        break;
      case 'effDate':
        this.currentFilters = { ...this.currentFilters, effDate: null, effDatePeriod: null };
        break;
      case 'termDate':
        this.currentFilters = { ...this.currentFilters, termDate: null, termDatePeriod: null };
        break;
    }
    this.filterChips = buildTerritoryFilterChips(this.currentFilters);
    this.pageIndex = 0;
    this.loadData();
  }

  clearAllFilters(): void {
    this.currentFilters = {
      showTerminated: false,
      territoryGroup: null,
      territoryType: null,
      effDatePeriod: null,
      effDate: null,
      termDatePeriod: null,
      termDate: null
    };
    this.filterChips = [];
    this.pageIndex = 0;
    this.loadData();
  }

  // Side panel
  openAddPanel(): void {
    this.sidePanelMode = 'add';
    this.sidePanelData = null;
    this.sidePanelOpen = true;
  }

  openEditPanel(row: TerritoryModel): void {
    this.sidePanelMode = 'edit';
    this.sidePanelData = row;
    this.sidePanelOpen = true;
    this.selectedRowId = row.territoryId ?? null;
  }

  closeSidePanel(): void {
    this.sidePanelOpen = false;
    this.sidePanelData = null;
    this.selectedRowId = null;
  }

  onSaveSuccess(): void {
    this.loadData(this.selectedRowId);
  }

  isSelectedRow(row: TerritoryModel): boolean {
    return this.selectedRowId !== null && row.territoryId === this.selectedRowId;
  }

  onModeChange(newMode: 'add' | 'edit'): void {
    this.sidePanelMode = newMode;
    if (newMode === 'add') {
      this.sidePanelData = null;
      this.selectedRowId = null;
    }
  }
}
