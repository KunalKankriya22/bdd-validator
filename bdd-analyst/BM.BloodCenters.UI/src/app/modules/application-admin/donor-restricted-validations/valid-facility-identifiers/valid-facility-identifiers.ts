import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { OverlayModule } from '@angular/cdk/overlay';
import { Subject, takeUntil } from 'rxjs';

import { ValidFacilityIdentifiersService } from './services/valid-facility-identifiers.service';
import {
  ValidFacilityIdentifiersModel,
  ValidFacilityIdentifiersParamsDto,
  ValidFacilityIdentifiersFilterValue
} from './models/valid-facility-identifiers.model';

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
import { ValidFacilityIdentifiersFilterPanel } from './valid-facility-identifiers-filter-panel/valid-facility-identifiers-filter-panel';
import { ValidFacilityIdentifiersFilterChipsUtils } from './utils/filter-chips.utils';
import { AddEditFacilityIdentifier, AddEditFacilityIdentifierDialogData } from './add-edit-facility-identifier/add-edit-facility-identifier';

@Component({
  selector: 'app-valid-facility-identifiers',
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
    ValidFacilityIdentifiersFilterPanel
  ],
  templateUrl: './valid-facility-identifiers.html',
  styleUrls: ['./valid-facility-identifiers.scss']
})
export class ValidFacilityIdentifiersComponent implements OnInit, OnDestroy {
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

  tableConfig: DataTableConfig<ValidFacilityIdentifiersModel> = {
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
      column: 'chapterId',
      direction: 'default'
    },
    stickyHeader: true,
    stickyActionsColumn: true,
    emptyMessage: '',
    loadingMessage: '',
    showPagination: true
  };

  appliedFilters: ValidFacilityIdentifiersFilterValue | null = null;
  filterChips: FilterChip[] = [];

  dataSource: ValidFacilityIdentifiersModel[] = [];
  requestState: ValidFacilityIdentifiersParamsDto = {};

  isLoading = false;
  hasError = false;
  searchText = '';

  // Filter Panel State
  isFilterOpen = false;

  // Dialog State
  isDialogOpen = false;
  editingRow: ValidFacilityIdentifiersModel | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private validFacilityIdentifiersService: ValidFacilityIdentifiersService,
    private dialog: MatDialog,
    private pageHeaderService: PageHeaderService,
    private headerService: HeaderService
  ) {
    this.initializeConfigurations();

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
    this.loadData();
    this.subscribeToChapterChanges();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Reset filters and search
        this.appliedFilters = null;
        this.filterChips = [];
        this.isFilterOpen = false;
        this.searchText = '';
        this.requestState = {};
        this.editingRow = null;
        this.isDialogOpen = false;

        // Reset search bar
        if (this.searchBarComponent) {
          this.searchBarComponent.searchText = '';
        }

        // Reload data for new chapter
        this.loadData();
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
      subtitle: '',
      actions: [{
        label: 'ADD FACILITY IDENTIFICATION CODE',
        icon: 'add',
        color: 'accent',
        ariaLabel: 'Create new facility identifier',
        onClick: () => this.createRecord()
      }]
    };

    this.searchConfig = {
      placeholder: 'Search by FIN Code and Chapter ID',
      minLength: 2,
      ariaLabel: 'Search facility identifiers by FIN Code and Chapter ID',
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
        column: 'chapterId',
        direction: 'default'
      },
      stickyHeader: true,
      stickyActionsColumn: true,
      emptyMessage: 'No Facility Identifiers Available To Display',
      noDataIcon: 'edit',
      loadingMessage: 'Loading facility identifier data...',
      showPagination: true
    };
  }

  private getTableColumns(): TableColumn<ValidFacilityIdentifiersModel>[] {
    return [
      {
        key: 'chapterId',
        header: 'Chapter ID',
        sortable: true,
        width: '150px'
      },
      {
        key: 'facilityIdentifier',
        header: 'FIN Code',
        sortable: false,
        width: '180px'
      },
      {
        key: 'effDate',
        header: 'Effective Date',
        sortable: false,
        width: '150px',
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

  private formatDateForAPI(date: Date | null): string {
    if (!date) return '';

    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private getRowActions(): RowAction<ValidFacilityIdentifiersModel>[] {
    return [
      {
        icon: 'edit',
        iconSvg: 'assets/images/icons/edit.svg',
        label: 'Edit facility identifier',
        ariaLabel: 'Edit facility identifier {{chapterId}}',
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

    this.validFacilityIdentifiersService
      .getValidFacilityIdentifiers(take, skip, this.requestState)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dataSource = response.data;
          if (this.tableConfig.pagination) {
            this.tableConfig.pagination.totalRecords = response.totalRecords;
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading facility identifiers:', error);
          this.hasError = true;
          this.isLoading = false;
          this.dataSource = [];
        }
      });
  }

  onSearch(searchKeyword: string): void {
    this.searchText = searchKeyword;
    this.requestState.searchKeyword = searchKeyword || undefined;

    // Reset to first page when searching
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

    // Map sort direction to API format
    if (event.direction === 'A' || event.direction === 'D') {
      this.requestState.sort = event.direction;
    } else {
      delete this.requestState.sort;
    }

    this.loadData();
  }

  onRowAction(event: TableRowActionEvent<ValidFacilityIdentifiersModel>): void {
    if (event.action === 'edit') {
      this.editRecord(event.row);
    }
  }

  createRecord(): void {
    const dialogData: AddEditFacilityIdentifierDialogData = {
      mode: 'add'
    };

    this.isDialogOpen = true; // Track dialog state

    const dialogRef = this.dialog.open(AddEditFacilityIdentifier, {
      width: '600px', // Fixed width instead of percentage
      height: '100vh',
      maxWidth: '100vw',
      maxHeight: '100vh',
      disableClose: true,
      position: { right: '0', top: '0' },
      panelClass: 'add-edit-facility-identifier-drawer',
      hasBackdrop: false, // Disable backdrop since we're using layout
      autoFocus: false, // Disable auto-focus on dialog open
      data: dialogData
    });

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(result => {
      this.isDialogOpen = false;
      this.editingRow = null;
      if (result?.success) {
        this.loadData();
      }
    });
  }

  editRecord(record: ValidFacilityIdentifiersModel): void {
    const dialogData: AddEditFacilityIdentifierDialogData = {
      mode: 'edit',
      data: record
    };

    this.isDialogOpen = true;
    this.editingRow = record;

    const dialogRef = this.dialog.open(AddEditFacilityIdentifier, {
      width: '600px', // Fixed width instead of percentage
      height: '100vh',
      maxWidth: '100vw',
      maxHeight: '100vh',
      disableClose: true,
      position: { right: '0', top: '0' },
      panelClass: 'add-edit-facility-identifier-drawer',
      hasBackdrop: false, // Disable backdrop since we're using layout
      autoFocus: false, // Disable auto-focus on dialog open
      data: dialogData
    });

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(result => {
      this.isDialogOpen = false;
      this.editingRow = null;
      if (result?.success) {
        this.loadData();
      }
    });
  }

  toggleFilterPanel(): void {
    this.isFilterOpen = !this.isFilterOpen;
  }

  closeFilterPanel(): void {
    this.isFilterOpen = false;
    // Remove focus from filter button
    if (this.filterBtn?.nativeElement) {
      this.filterBtn.nativeElement.blur();
    }
  }

  applyFilters(filters: ValidFacilityIdentifiersFilterValue): void {
    this.appliedFilters = filters;
    this.filterChips = ValidFacilityIdentifiersFilterChipsUtils.convertFiltersToChips(filters);

    // Build request state from filters
    this.requestState.chapterId = filters.chapterId || undefined;

    if (filters.effectiveDate && filters.effectivePeriod) {
      this.requestState.effectiveDate = this.formatDateForAPI(filters.effectiveDate);
      this.requestState.effectivePeriod = filters.effectivePeriod;
    } else {
      delete this.requestState.effectiveDate;
      delete this.requestState.effectivePeriod;
    }

    if (filters.terminationDate && filters.terminationPeriod) {
      this.requestState.terminationDate = this.formatDateForAPI(filters.terminationDate);
      this.requestState.terminationPeriod = filters.terminationPeriod;
    } else {
      delete this.requestState.terminationDate;
      delete this.requestState.terminationPeriod;
    }

    // Reset to first page when filtering
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.closeFilterPanel();
    this.loadData();
  }

  removeFilterChip(chipKey: string): void {
    const updatedFilters = ValidFacilityIdentifiersFilterChipsUtils.removeFilterByChipKey(
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

    // Reset to first page
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  // Keyboard shortcuts
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
      this.toggleFilterPanel();
    }

    // Escape: Close filter if open
    if (event.key === 'Escape') {
      if (this.isFilterOpen) {
        event.preventDefault();
        this.closeFilterPanel();
      }
    }
  }
}
