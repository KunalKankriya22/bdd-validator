import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { OverlayModule } from '@angular/cdk/overlay';
import { Subject, takeUntil } from 'rxjs';

import { DefineMaxDonationsService } from './services/define-max-donations.service';
import {
  DefineMaxDonationsModel,
  DefineMaxDonationsParamsDto
} from './models/define-max-donations.model';

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
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { DefineMaxDonationsFilterPanel, DefineMaxDonationsFilterFormValue } from './define-max-donations-filter-panel/define-max-donations-filter-panel';
import { DefineMaxDonationsFilterChipsUtils } from './utils/filter-chips.utils';
import { AddEditMaxDonations } from './add-edit-max-donations/add-edit-max-donations';

@Component({
  selector: 'app-define-max-donations',
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
    DefineMaxDonationsFilterPanel,
    AddEditMaxDonations
  ],
  templateUrl: './define-max-donations.html',
  styleUrls: ['./define-max-donations.scss']
})
export class DefineMaxDonationsComponent implements OnInit, OnDestroy {
  @ViewChild(SearchBar) searchBarComponent!: SearchBar;
  @ViewChild(DataTable) dataTableComponent!: DataTable<DefineMaxDonationsModel>;
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
    minLength: 2,
    ariaLabel: '',
    searchOnEnterOnly: true
  };

  tableConfig: DataTableConfig<DefineMaxDonationsModel> = {
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
      column: 'donationType',
      direction: 'default'
    },
    stickyHeader: true,
    stickyActionsColumn: true,
    emptyMessage: '',
    loadingMessage: '',
    showPagination: true
  };

  appliedFilters: DefineMaxDonationsFilterFormValue | null = null;
  filterChips: FilterChip[] = [];

  dataSource: DefineMaxDonationsModel[] = [];
  requestState: DefineMaxDonationsParamsDto = {};

  isLoading = false;
  hasError = false;
  errorMessage = '';
  searchText = '';

  // Side Panel State
  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  sidePanelData: DefineMaxDonationsModel | null = null;

  // Filter Panel State
  isFilterOpen = false;

  private destroy$ = new Subject<void>();

  // Pagination constants
  private static readonly PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
  private static readonly DEFAULT_PAGE_SIZE = 25;

  constructor(
    private defineMaxDonationsService: DefineMaxDonationsService,
    private pageHeaderService: PageHeaderService
  ) {
    this.initializeConfigurations();

    // Update header config from menu-items API response
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          breadcrumbs: [
            {
              label: 'Home',
              link: '/home'
            },
            {
              label: pageData.title,
              link: null
            }
          ],
          title: pageData.title,
          subtitle: pageData.subtitle,
          actions: [{
            label: 'ADD CONFIGURATION',
            icon: 'add',
            color: 'accent',
            ariaLabel: 'Create new max donation configuration',
            onClick: () => this.createRecord()
          }]
        };
      }
    });
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
          label: 'Define Max Donations',
          link: null
        }
      ],
      title: 'Define Max Donations',
      subtitle: '',
      actions: [{
        label: 'ADD CONFIGURATION',
        icon: 'add',
        color: 'accent',
        ariaLabel: 'Create new max donation configuration',
        onClick: () => this.createRecord()
      }]
    };

    this.searchConfig = {
      placeholder: 'Search by Donation Type or Procedure Group',
      minLength: 2,
      ariaLabel: 'Search by Donation Type or Procedure Group',
      searchOnEnterOnly: true,
      alwaysShowTooltip: true
    };

    this.tableConfig = {
      columns: this.getTableColumns(),
      rowActions: this.getRowActions(),
      pagination: {
        pageSize: DefineMaxDonationsComponent.DEFAULT_PAGE_SIZE,
        pageIndex: 0,
        totalRecords: 0,
        pageSizeOptions: [...DefineMaxDonationsComponent.PAGE_SIZE_OPTIONS],
        showFirstLastButtons: true
      },
      sortConfig: {
        column: 'donationType',
        direction: 'default'
      },
      stickyHeader: true,
      stickyActionsColumn: true,
      emptyMessage: 'No max donation configurations available to display',
      loadingMessage: 'Loading max donation data...',
      showPagination: true
    };
  }

  private getTableColumns(): TableColumn<DefineMaxDonationsModel>[] {
    return [
      {
        key: 'donationType',
        header: 'Donation Type',
        sortable: true,
        width: '120px'
      },
      {
        key: 'donationDescription',
        header: 'Donation Description',
        width: '200px'
      },
      {
        key: 'procedureGroup',
        header: 'Procedure Group',
        width: '150px'
      },
      {
        key: 'procedureDescription',
        header: 'Procedure Description',
        width: '200px'
      },
      {
        key: 'maxDonations',
        header: 'Maximum Donation',
        width: '140px'
      },
      {
        key: 'interval',
        header: 'Interval (Days)',
        width: '130px'
      },
      {
        key: 'effDate',
        header: 'Effective Date',
        width: '140px',
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

  private formatDate(date: Date | string | null | undefined): string {
    if (!date) return '-';

    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = d.getFullYear();

    return `${day}-${month}-${year}`;
  }

  private getRowActions(): RowAction<DefineMaxDonationsModel>[] {
    return [
      {
        icon: 'edit',
        iconSvg: 'assets/images/icons/edit.svg',
        label: 'Edit max donation configuration',
        ariaLabel: 'Edit max donation for {{donationType}} - {{procedureGroup}}',
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
      (this.tableConfig.pagination?.pageSize || DefineMaxDonationsComponent.DEFAULT_PAGE_SIZE);

    const take = this.tableConfig.pagination?.pageSize || DefineMaxDonationsComponent.DEFAULT_PAGE_SIZE;

    this.defineMaxDonationsService
      .getDefineMaxDonations(take, skip, this.requestState)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: { data: DefineMaxDonationsModel[]; totalRecords: number }) => {
          this.dataSource = response.data;
          this.tableConfig.pagination!.totalRecords = response.totalRecords;
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('Error loading max donation data:', error);
          this.hasError = true;
          this.isLoading = false;
          this.errorMessage = 'Failed to load max donation data. Please try again.';
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

    // Handle sort direction - event.direction is 'A' | 'D' | 'default'
    if (event.direction === 'default') {
      this.requestState.sort = undefined;
    } else {
      // Send 'A' or 'D' directly to match the SQL query parameter
      this.requestState.sort = event.direction;
    }

    this.loadData();
  }

  onRowAction(event: TableRowActionEvent<DefineMaxDonationsModel>): void {
    // Highlight the row when action is clicked
    if (this.dataTableComponent) {
      this.dataTableComponent.activeRow = event.row;
    }

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

  editRecord(record: DefineMaxDonationsModel): void {
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
    // Remove focus from filter button
    if (this.filterBtn?.nativeElement) {
      this.filterBtn.nativeElement.blur();
    }
  }

  applyFilters(filters: DefineMaxDonationsFilterFormValue): void {
    this.appliedFilters = filters;
    this.filterChips = DefineMaxDonationsFilterChipsUtils.convertFiltersToChips(filters);

    // Update request state with filter values
    if (filters.donationType) {
      this.requestState.donationType = filters.donationType;
    } else {
      delete this.requestState.donationType;
    }

    // Handle effective date with period
    if (filters.effectiveDate && filters.periodType1) {
      this.requestState.effectiveDate = this.toISOStringWithoutTimezone(filters.effectiveDate);
      this.requestState.effectivePeriod = filters.periodType1;
    } else {
      delete this.requestState.effectiveDate;
      delete this.requestState.effectivePeriod;
    }

    // Handle termination date with period
    if (filters.terminationDate && filters.periodType2) {
      this.requestState.terminationDate = this.toISOStringWithoutTimezone(filters.terminationDate);
      this.requestState.terminationPeriod = filters.periodType2;
    } else {
      delete this.requestState.terminationDate;
      delete this.requestState.terminationPeriod;
    }

    // Reset to first page when applying filters
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.closeFilter();
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

  removeFilterChip(chipKey: string): void {
    this.appliedFilters = DefineMaxDonationsFilterChipsUtils.removeFilterByChipKey(
      this.appliedFilters,
      chipKey
    );

    this.filterChips = DefineMaxDonationsFilterChipsUtils.convertFiltersToChips(
      this.appliedFilters
    );

    // Update request state
    switch (chipKey) {
      case 'donationType':
        delete this.requestState.donationType;
        break;
      case 'effectiveDate':
        delete this.requestState.effectiveDate;
        delete this.requestState.effectivePeriod;
        break;
      case 'terminationDate':
        delete this.requestState.terminationDate;
        delete this.requestState.terminationPeriod;
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
    delete this.requestState.donationType;
    delete this.requestState.effectiveDate;
    delete this.requestState.effectivePeriod;
    delete this.requestState.terminationDate;
    delete this.requestState.terminationPeriod;

    // Reset to first page
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  get hasActiveFilters(): boolean {
    return DefineMaxDonationsFilterChipsUtils.hasActiveFilters(this.appliedFilters);
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
