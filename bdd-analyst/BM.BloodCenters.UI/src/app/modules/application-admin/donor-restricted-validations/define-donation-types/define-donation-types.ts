import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { OverlayModule } from '@angular/cdk/overlay';
import { Subject, takeUntil } from 'rxjs';
import moment from 'moment';

import { DefineDonationTypesService } from './services/define-donation-types.service';
import {
  DefineDonationTypesModel,
  DefineDonationTypesParamsDto
} from './models/define-donation-types.model';
import { HeaderService } from '@shared/services/header.service';

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
import { DefineDonationTypesFilterPanel, DefineDonationTypesFilterFormValue } from './define-donation-types-filter-panel/define-donation-types-filter-panel';
import { DefineDonationTypesFilterChipsUtils } from './utils/filter-chips.utils';
import { AddEditDonationType } from './add-edit-donation-type/add-edit-donation-type';

@Component({
  selector: 'app-define-donation-types',
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
    DefineDonationTypesFilterPanel,
    AddEditDonationType
  ],
  templateUrl: './define-donation-types.html',
  styleUrls: ['./define-donation-types.scss']
})
export class DefineDonationTypesComponent implements OnInit, OnDestroy {
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
    minLength: 2,
    ariaLabel: '',
    searchOnEnterOnly: true
  };

  tableConfig: DataTableConfig<DefineDonationTypesModel> = {
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
    stickyActionsColumn: false,
    emptyMessage: '',
    loadingMessage: '',
    showPagination: true
  };

  appliedFilters: DefineDonationTypesFilterFormValue | null = null;
  filterChips: FilterChip[] = [];

  dataSource: DefineDonationTypesModel[] = [];
  requestState: DefineDonationTypesParamsDto = {};
  donationTypeCodes: string[] = [];
  sequences: number[] = [];

  isLoading = false;
  hasError = false;
  errorMessage = '';
  searchText = '';

  // Side Panel State
  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  sidePanelData: DefineDonationTypesModel | null = null;

  // Filter Panel State
  isFilterOpen = false;

  private destroy$ = new Subject<void>();
  currentYear: number = new Date().getFullYear();

  constructor(
    private defineDonationTypesService: DefineDonationTypesService,
    private headerService: HeaderService,
    private pageHeaderService: PageHeaderService
  ) {
    this.initializeConfigurations();
  }

  ngOnInit(): void {
    this.loadDropdownOptions();
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
      });
  }

  private loadDropdownOptions(): void {
    this.defineDonationTypesService.getDonationTypeFilters()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (filters) => {
          this.donationTypeCodes = filters.donationTypeCodes;
          this.sequences = filters.sequences;
        },
        error: (error) => {
          console.error('Error loading donation type filters:', error);
        }
      });
  }

  private initializeConfigurations(): void {
    const pageTitle = this.pageHeaderService.getTitle() || 'Define Donation Types';
    this.headerConfig = {
      breadcrumbs: [
        { label: 'Home', link: '/home' },
        { label: pageTitle }
      ],
      actions: [{
        label: 'ADD DONATION TYPE',
        icon: 'add',
        color: 'accent',
        ariaLabel: 'Create new donation type',
        onClick: () => this.createRecord()
      }]
    };

    this.searchConfig = {
      placeholder: 'Search donation type code or description',
      minLength: 2,
      ariaLabel: 'Search donation types by code or description',
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
        column: 'donationType',
        direction: 'default'
      },
      stickyHeader: true,
      stickyActionsColumn: false,
      emptyMessage: 'No donation types available to display',
      loadingMessage: 'Loading donation type data...',
      showPagination: true
    };
  }

  private getTableColumns(): TableColumn<DefineDonationTypesModel>[] {
    return [
      {
        key: 'donationType',
        header: 'Donation Type Code',
        sortable: true,
        width: '150px'
      },
      {
        key: 'description',
        header: 'Donation Type Description',
        width: '250px'
      },
      {
        key: 'sortSequence',
        header: 'Sequence',
        width: '120px'
      },
      {
        key: 'testNeededFlag',
        header: 'Testing Required',
        width: '150px',
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

  private getRowActions(): RowAction<DefineDonationTypesModel>[] {
    return [
      {
        icon: 'edit',
        iconSvg: 'assets/images/icons/edit.svg',
        label: 'Edit donation type',
        ariaLabel: 'Edit donation type {{donationType}}',
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
      (this.tableConfig.pagination?.pageSize || 25);

    const take = this.tableConfig.pagination?.pageSize || 25;

    this.defineDonationTypesService
      .getDefineDonationTypes(take, skip, this.requestState)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: { data: DefineDonationTypesModel[]; totalRecords: number }) => {
          this.dataSource = response.data;
          this.tableConfig.pagination!.totalRecords = response.totalRecords;
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('Error loading donation type data:', error);
          this.hasError = true;
          this.isLoading = false;
          this.errorMessage = 'Failed to load donation type data. Please try again.';
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

  onRowAction(event: TableRowActionEvent<DefineDonationTypesModel>): void {
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

  editRecord(record: DefineDonationTypesModel): void {
    this.sidePanelMode = 'edit';
    this.sidePanelData = record;
    this.sidePanelOpen = true;
  }

  onRowClick(row: DefineDonationTypesModel): void {
    if (this.sidePanelOpen) {
      this.editRecord(row);
    }
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

  applyFilters(filters: DefineDonationTypesFilterFormValue): void {
    this.appliedFilters = filters;
    this.filterChips = DefineDonationTypesFilterChipsUtils.convertFiltersToChips(filters);

    // Update request state with filter values
    if (filters.donationTypeCode) {
      this.requestState.donationType = filters.donationTypeCode;
    } else {
      delete this.requestState.donationType;
    }

    if (filters.sequence !== null && filters.sequence !== undefined) {
      this.requestState.sortSequence = filters.sequence;
    } else {
      delete this.requestState.sortSequence;
    }

    // Handle effective date with period
    if (filters.effectiveDate && filters.effectiveDatePeriod) {
      this.requestState.effectiveDate = moment(filters.effectiveDate).format('YYYY-MM-DD');
      this.requestState.effectivePeriod = filters.effectiveDatePeriod;
    } else {
      delete this.requestState.effectiveDate;
      delete this.requestState.effectivePeriod;
    }

    // Handle termination date with period
    if (filters.terminationDate && filters.terminationDatePeriod) {
      this.requestState.terminationDate = moment(filters.terminationDate).format('YYYY-MM-DD');
      this.requestState.terminationPeriod = filters.terminationDatePeriod;
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
    this.appliedFilters = DefineDonationTypesFilterChipsUtils.removeFilterByChipKey(
      this.appliedFilters,
      chipKey
    );

    this.filterChips = DefineDonationTypesFilterChipsUtils.convertFiltersToChips(
      this.appliedFilters
    );

    // Update request state
    switch (chipKey) {
      case 'donationTypeCode':
        delete this.requestState.donationType;
        break;
      case 'sequence':
        delete this.requestState.sortSequence;
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
    delete this.requestState.sortSequence;
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
    return DefineDonationTypesFilterChipsUtils.hasActiveFilters(this.appliedFilters);
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
