import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { OverlayModule } from '@angular/cdk/overlay';
import { Subject, forkJoin, takeUntil } from 'rxjs';

import { AssociateLetterToInterdictionService } from './services/associate-letter-to-interdiction.service';
import {
  AssociateLetterToInterdictionModel,
  AssociateLetterToInterdictionSearchRequest,
  AssociateLetterToInterdictionFilterValue,
  AssociateLetterToInterdictionFilterRequest,
  InterdictionDropdown,
  DonationTypeDropdown,
  FilterLetterDropdown
} from './models/associate-letter-to-interdiction.model';

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
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { AssociateLetterToInterdictionFilterPanel } from './associate-letter-to-interdiction-filter-panel/associate-letter-to-interdiction-filter-panel';
import { AssociateLetterToInterdictionFilterChipsUtils } from './utils/filter-chips.utils';
import { AddEditAssociateLetter } from './add-edit-associate-letter/add-edit-associate-letter';

@Component({
  selector: 'app-associate-letter-to-interdiction',
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
    AssociateLetterToInterdictionFilterPanel,
    AddEditAssociateLetter
  ],
  templateUrl: './associate-letter-to-interdiction.html',
  styleUrls: ['./associate-letter-to-interdiction.scss']
})
export class AssociateLetterToInterdiction implements OnInit, OnDestroy {
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

  tableConfig: DataTableConfig<AssociateLetterToInterdictionModel> = {
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
    stickyHeader: true,
    stickyActionsColumn: true,
    emptyMessage: '',
    loadingMessage: '',
    showPagination: true
  };

  appliedFilters: AssociateLetterToInterdictionFilterValue | null = null;
  filterChips: FilterChip[] = [];

  filterInterdictionOptions: InterdictionDropdown[] = [];
  filterDonationTypeOptions: DonationTypeDropdown[] = [];
  filterLetterOptions: FilterLetterDropdown[] = [];

  dataSource: AssociateLetterToInterdictionModel[] = [];
  requestState: AssociateLetterToInterdictionSearchRequest = {};

  isLoading = false;
  hasError = false;
  searchText = '';

  isFilterOpen = false;

  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  sidePanelData: AssociateLetterToInterdictionModel | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private service: AssociateLetterToInterdictionService,
    private pageHeaderService: PageHeaderService,
    private headerService: HeaderService
  ) {
    this.initializeConfigurations();

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
    this.loadData();
    this.loadFilterOptions();
    this.subscribeToChapterChanges();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.appliedFilters = null;
        this.filterChips = [];
        this.isFilterOpen = false;
        this.searchText = '';
        this.requestState = {};
        this.sidePanelOpen = false;
        this.sidePanelData = null;

        if (this.searchBarComponent) {
          this.searchBarComponent.searchText = '';
        }

        this.loadData();
        this.loadFilterOptions();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeConfigurations(): void {
    this.headerConfig = {
      breadcrumbs: [
        { label: 'Home', link: '/home' }
      ],
      title: '',
      subtitle: 'Manage interdiction rules and associated letter configurations.',
      actions: [{
        label: 'LINK LETTER',
        color: 'accent',
        ariaLabel: 'Link a new letter to interdiction',
        onClick: () => this.createRecord()
      }]
    };

    this.searchConfig = {
      placeholder: 'Search by code or donation type',
      minLength: 2,
      ariaLabel: 'Search associate letter to interdiction by code or donation type',
      searchOnEnterOnly: true,
      alwaysShowTooltip: true
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
        column: 'interCode',
        direction: 'default'
      },
      stickyHeader: true,
      stickyActionsColumn: true,
      emptyMessage: 'No Records Available To Display',
      noDataIcon: 'edit',
      loadingMessage: 'Loading data...',
      showPagination: true
    };
  }

  private getTableColumns(): TableColumn<AssociateLetterToInterdictionModel>[] {
    return [
      {
        key: 'interCode',
        header: 'Interdiction Code',
        sortable: true,
        width: '140px'
      },
      {
        key: 'interDesc',
        header: 'Interdiction Description',
        sortable: false,
        width: '250px'
      },
      {
        key: 'donationType',
        header: 'Donation Type',
        sortable: true,
        width: '120px'
      },
      {
        key: 'donationDesc',
        header: 'Donation Description',
        sortable: false,
        width: '180px'
      },
      {
        key: 'letterId',
        header: 'Letter Code',
        sortable: true,
        width: '110px'
      },
      {
        key: 'effDate',
        header: 'Effective Date',
        sortable: false,
        width: '140px',
        valueFormatter: (value) => this.formatDate(value)
      },
      {
        key: 'termDate',
        header: 'Termination Date',
        sortable: false,
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

  private getRowActions(): RowAction<AssociateLetterToInterdictionModel>[] {
    return [
      {
        icon: 'edit',
        iconSvg: 'assets/images/icons/edit.svg',
        label: 'Edit rule',
        ariaLabel: 'Edit rule {{interCode}}',
        color: 'default',
        action: 'edit'
      }
    ];
  }

  private loadFilterOptions(): void {
    const filterRequest: AssociateLetterToInterdictionFilterRequest = {
      interCode: null,
      donationType: null,
      letterId: null
    };

    forkJoin({
      interdictions: this.service.getFilterInterdictionsDropdown(filterRequest),
      donationTypes: this.service.getFilterDonationTypesDropdown(filterRequest),
      letters: this.service.getFilterLettersDropdown(filterRequest)
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (result) => {
        this.filterInterdictionOptions = result.interdictions;
        this.filterDonationTypeOptions = result.donationTypes;
        this.filterLetterOptions = result.letters;
      },
      error: (error) => {
        console.error('Error loading filter options:', error);
      }
    });
  }

  loadData(): void {
    this.isLoading = true;
    this.hasError = false;

    const hasActiveFilters = this.appliedFilters && (
      this.appliedFilters.interCode ||
      this.appliedFilters.donationType ||
      this.appliedFilters.letterId
    );
    if (hasActiveFilters || this.searchText) {
      this.tableConfig.emptyMessage = 'No records found';
      this.tableConfig.noDataIcon = 'inbox';
    } else {
      this.tableConfig.emptyMessage = 'No Records Available To Display';
      this.tableConfig.noDataIcon = 'edit';
    }

    const skip =
      (this.tableConfig.pagination?.pageIndex || 0) *
      (this.tableConfig.pagination?.pageSize || 10);
    const take = this.tableConfig.pagination?.pageSize || 10;

    const request: AssociateLetterToInterdictionSearchRequest = {
      ...this.requestState,
      take,
      skip
    };

    this.service
      .search(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dataSource = response.data;
          if (this.tableConfig.pagination) {
            this.tableConfig.pagination.totalRecords = response.totalRecords;
          }
          this.isLoading = false;
        },
        error: () => {
          this.hasError = true;
          this.isLoading = false;
          this.dataSource = [];
        }
      });
  }

  onSearch(searchKeyword: string): void {
    this.searchText = searchKeyword;
    this.requestState.searchKeyword = searchKeyword || undefined;

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
    if (this.tableConfig.sortConfig) {
      this.tableConfig.sortConfig.column = event.column;
      this.tableConfig.sortConfig.direction = event.direction;
    }

    this.requestState.sortColumn = event.column;
    if (event.direction === 'A') {
      this.requestState.sortOrder = 'ASC';
    } else if (event.direction === 'D') {
      this.requestState.sortOrder = 'DESC';
    } else {
      this.requestState.sortOrder = null;
      this.requestState.sortColumn = null;
    }

    this.loadData();
  }

  onRowAction(event: TableRowActionEvent<AssociateLetterToInterdictionModel>): void {
    if (event.action === 'edit') {
      this.editRecord(event.row);
    }
  }

  createRecord(): void {
    this.sidePanelMode = 'add';
    this.sidePanelData = null;
    this.sidePanelOpen = true;
  }

  editRecord(record: AssociateLetterToInterdictionModel): void {
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

  toggleFilterPanel(): void {
    this.isFilterOpen = !this.isFilterOpen;
  }

  closeFilterPanel(): void {
    this.isFilterOpen = false;
    if (this.filterBtn?.nativeElement) {
      this.filterBtn.nativeElement.blur();
    }
  }

  applyFilters(filters: AssociateLetterToInterdictionFilterValue): void {
    this.appliedFilters = filters;
    this.filterChips = AssociateLetterToInterdictionFilterChipsUtils.convertFiltersToChips(filters);

    this.requestState.interCode = filters.interCode || undefined;
    this.requestState.donationType = filters.donationType || undefined;
    this.requestState.letterId = filters.letterId || undefined;

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.closeFilterPanel();
    this.loadData();
  }

  removeFilterChip(chipKey: string): void {
    const updatedFilters = AssociateLetterToInterdictionFilterChipsUtils.removeFilterByChipKey(
      this.appliedFilters,
      chipKey
    );

    if (updatedFilters) {
      this.applyFilters(updatedFilters);
    } else {
      this.clearAllFilters();
    }
  }

  clearAllFilters(): void {
    this.appliedFilters = null;
    this.filterChips = [];
    this.requestState = {
      searchKeyword: this.requestState.searchKeyword
    };

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent): void {
    if (event.altKey && event.key.toLowerCase() === 'c') {
      event.preventDefault();
      this.createRecord();
    }

    if (event.altKey && event.key.toLowerCase() === 's') {
      event.preventDefault();
      this.searchBarComponent?.focus();
    }

    if (event.altKey && event.key.toLowerCase() === 'f') {
      event.preventDefault();
      this.toggleFilterPanel();
    }

    if (event.key === 'Escape') {
      if (this.sidePanelOpen) {
        event.preventDefault();
        this.closeSidePanel();
      } else if (this.isFilterOpen) {
        event.preventDefault();
        this.closeFilterPanel();
      }
    }
  }
}
