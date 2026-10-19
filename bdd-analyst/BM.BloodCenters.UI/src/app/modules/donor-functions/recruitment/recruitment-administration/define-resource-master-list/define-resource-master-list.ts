import { Component, OnInit, OnDestroy, HostListener, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { OverlayModule } from '@angular/cdk/overlay';
import { Subject, takeUntil } from 'rxjs';

import { DefineResourceMasterListService } from './services/define-resource-master-list.service';
import {
  DefineResourceMasterListModel,
  DefineResourceMasterListParamsDto,
  DefineResourceMasterListFilterValue
} from './models/define-resource-master-list.model';

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
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { DefineResourceMasterListFilterPanel } from './define-resource-master-list-filter-panel/define-resource-master-list-filter-panel';
import { DefineResourceMasterListFilterChipsUtils } from './utils/filter-chips.utils';
import { AddEditResourceCode } from './add-edit-resource-code/add-edit-resource-code';

@Component({
  selector: 'app-define-resource-master-list',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    OverlayModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    DataTable,
    FilterChips,
    DefineResourceMasterListFilterPanel,
    AddEditResourceCode
  ],
  templateUrl: './define-resource-master-list.html',
  styleUrls: ['./define-resource-master-list.scss']
})
export class DefineResourceMasterListComponent implements OnInit, OnDestroy {
  @ViewChild(SearchBar) searchBarComponent!: SearchBar;

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

  tableConfig: DataTableConfig<DefineResourceMasterListModel> = {
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
      column: 'resourceCode',
      direction: 'default'
    },
    stickyHeader: true,
    stickyActionsColumn: true,
    emptyMessage: '',
    loadingMessage: '',
    showPagination: true
  };

  appliedFilters: DefineResourceMasterListFilterValue | null = null;
  filterChips: FilterChip[] = [];

  dataSource: DefineResourceMasterListModel[] = [];
  requestState: DefineResourceMasterListParamsDto = {};

  isLoading = false;
  hasError = false;
  errorMessage = '';
  searchText = '';

  // Side Panel State
  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  sidePanelData: DefineResourceMasterListModel | null = null;

  // Filter Panel State
  isFilterOpen = false;

  private destroy$ = new Subject<void>();
  currentYear: number = new Date().getFullYear();

  constructor(
    private defineResourceMasterListService: DefineResourceMasterListService
  ) {
    this.initializeConfigurations();
  }

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeConfigurations(): void {
    this.headerConfig = {
      breadcrumbs: [
        {
          label: 'Home',
          link: '/'
        },
        {
          label: 'Define Resource Master List',
          link: null
        }
      ],
      title: 'Define Resource Master List',
      subtitle: 'Configure operational resources available for recruitment scheduling.',
      actions: [{
        label: 'ADD NEW RESOURCE CODE',
        icon: 'add',
        color: 'accent',
        ariaLabel: 'Create new resource code',
        onClick: () => this.createRecord()
      }]
    };

    this.searchConfig = {
      placeholder: 'Search by Code or Description',
      minLength: 3,
      ariaLabel: 'Search resource codes by code or description'
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
        column: 'resourceCode',
        direction: 'default'
      },
      stickyHeader: true,
      stickyActionsColumn: true,
      emptyMessage: 'No resource codes available to display',
      loadingMessage: 'Loading resource code data...',
      showPagination: true
    };
  }

  private getTableColumns(): TableColumn<DefineResourceMasterListModel>[] {
    return [
      {
        key: 'resourceCode',
        header: 'Resource Code',
        sortable: true,
        width: '150px'
      },
      {
        key: 'resourceDesc',
        header: 'Description',
        width: '200px'
      },
      {
        key: 'resourceType',
        header: 'Type',
        width: '120px'
      },
      {
        key: 'sortSeq',
        header: 'Sequence',
        width: '100px'
      },
      {
        key: 'criticalInd',
        header: 'Critical',
        width: '100px',
        valueFormatter: (value) => this.formatYesNo(value)
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
      }
    ];
  }

  private formatYesNo(value: string | undefined): string {
    if (!value) return '-';
    return value.toUpperCase() === 'Y' ? 'Yes' : 'No';
  }

  private formatDate(date: Date | string | null | undefined): string {
    if (!date) return '-';

    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = d.getFullYear();

    return `${day}-${month}-${year}`;
  }

  private getRowActions(): RowAction<DefineResourceMasterListModel>[] {
    return [
      {
        icon: 'edit',
        iconSvg: 'assets/images/icons/edit.svg',
        label: 'Edit resource code',
        ariaLabel: 'Edit resource code {{resourceCode}}',
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

    this.defineResourceMasterListService
      .getDefineResourceMasterList(take, skip, this.requestState)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: { data: DefineResourceMasterListModel[]; totalRecords: number }) => {
          this.dataSource = response.data;
          this.tableConfig.pagination!.totalRecords = response.totalRecords;
          this.isLoading = false;
        },
        error: () => {
          this.hasError = true;
          this.isLoading = false;
          this.errorMessage = 'Failed to load resource master list data. Please try again.';
        }
      });
  }

  onSearch(searchText: string): void {
    this.requestState.searchText = searchText || undefined;

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

    if (event.direction === 'default') {
      this.requestState.sort = undefined;
    } else {
      this.requestState.sort = event.direction;
    }

    this.loadData();
  }

  onRowAction(event: TableRowActionEvent<DefineResourceMasterListModel>): void {
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

  editRecord(record: DefineResourceMasterListModel): void {
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

  toggleFilter(): void {
    this.isFilterOpen = !this.isFilterOpen;
  }

  closeFilter(): void {
    this.isFilterOpen = false;
  }

  applyFilters(filters: DefineResourceMasterListFilterValue): void {
    this.appliedFilters = filters;
    this.filterChips = DefineResourceMasterListFilterChipsUtils.convertFiltersToChips(filters);

    // Update request state with filter values
    // Convert "Yes"/"No" to "Y"/"N" for showTermination
    if (filters.showTermination) {
      this.requestState.showTerminated = filters.showTermination === 'Yes' ? 'Y' : 'N';
    } else {
      delete this.requestState.showTerminated;
    }

    // Convert "Yes"/"No" to "Y"/"N" for critical, handle "Both" option
    if (filters.critical && filters.critical !== 'Both (Yes & No)') {
      this.requestState.criticalInd = filters.critical === 'Yes' ? 'Y' : 'N';
    } else {
      delete this.requestState.criticalInd;
    }

    // Handle effective date with period
    if (filters.effectiveDate && filters.periodType1) {
      this.requestState.effDate = this.formatDateForAPI(filters.effectiveDate);
      this.requestState.effDatePeriod = filters.periodType1;
    } else {
      delete this.requestState.effDate;
      delete this.requestState.effDatePeriod;
    }

    // Handle termination date with period
    if (filters.terminationDate && filters.periodType2) {
      this.requestState.termDate = this.formatDateForAPI(filters.terminationDate);
      this.requestState.termDatePeriod = filters.periodType2;
    } else {
      delete this.requestState.termDate;
      delete this.requestState.termDatePeriod;
    }

    // Reset to first page when applying filters
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.closeFilter();
    this.loadData();
  }

  /**
   * Format date for API (ISO datetime string format)
   */
  private formatDateForAPI(date: Date): string {
    const d = new Date(date);
    return d.toISOString();
  }

  removeFilterChip(chipKey: string): void {
    this.appliedFilters = DefineResourceMasterListFilterChipsUtils.removeFilterByChipKey(
      this.appliedFilters,
      chipKey
    );

    this.filterChips = DefineResourceMasterListFilterChipsUtils.convertFiltersToChips(
      this.appliedFilters
    );

    // Update request state
    switch (chipKey) {
      case 'critical':
        delete this.requestState.criticalInd;
        break;
      case 'showTermination':
        delete this.requestState.showTerminated;
        break;
      case 'effectiveDate':
        delete this.requestState.effDate;
        delete this.requestState.effDatePeriod;
        break;
      case 'terminationDate':
        delete this.requestState.termDate;
        delete this.requestState.termDatePeriod;
        break;
    }

    // Reset to first page when removing filters
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  clearAllFilters(): void {
    this.appliedFilters = null;
    this.filterChips = [];

    // Clear all filter-related request state
    delete this.requestState.criticalInd;
    delete this.requestState.showTerminated;
    delete this.requestState.effDate;
    delete this.requestState.effDatePeriod;
    delete this.requestState.termDate;
    delete this.requestState.termDatePeriod;

    // Reset to first page
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  get hasActiveFilters(): boolean {
    return DefineResourceMasterListFilterChipsUtils.hasActiveFilters(this.appliedFilters);
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

    // Alt+F: Toggle filter panel
    if (event.altKey && event.key.toLowerCase() === 'f') {
      event.preventDefault();
      this.toggleFilter();
    }

    // Escape: Close side panel or filter if open
    if (event.key === 'Escape') {
      if (this.sidePanelOpen) {
        event.preventDefault();
        this.closeSidePanel();
      } else if (this.isFilterOpen) {
        event.preventDefault();
        this.closeFilter();
      }
    }
  }
}
