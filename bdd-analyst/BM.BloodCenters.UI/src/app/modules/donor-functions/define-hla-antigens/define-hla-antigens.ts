import { Component, OnInit, OnDestroy, ViewChild, ElementRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { OverlayModule } from '@angular/cdk/overlay';
import { Subject, takeUntil } from 'rxjs';
import moment from 'moment';

import { HlaAntigensService } from './services/hla-antigens.service';
import {
  HlaAntigenModel,
  HlaAntigenParamsDto,
  HlaAntigenFilterValue,
  AddEditAntigenDialogData,
  LocusCodeModel
} from './models/hla-antigens.model';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TableColumn,
  TablePageEvent,
  TableSortEvent,
  TableRowActionEvent,
  RowAction
} from '@shared/interfaces/data-table.interface';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { HlaAntigensFilterPanel } from './filter-panel/hla-antigens-filter-panel';
import { HlaAntigenFilterChipsUtils } from './utils/filter-chips.utils';
import { AddEditAntigenDialog } from './add-edit-antigen-dialog/add-edit-antigen-dialog';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';

@Component({
  selector: 'app-define-hla-antigens',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    OverlayModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    DataTable,
    FilterChips,
    HlaAntigensFilterPanel
  ],
  templateUrl: './define-hla-antigens.html',
  styleUrls: ['./define-hla-antigens.scss']
})
export class DefineHLAAntigensComponent implements OnInit, OnDestroy {
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
    minLength: 1,
    ariaLabel: '',
    searchOnEnterOnly: true
  };

  tableConfig: DataTableConfig<HlaAntigenModel> = {
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
      column: 'locus',
      direction: 'default'
    },
    stickyHeader: true,
    stickyActionsColumn: true,
    emptyMessage: '',
    loadingMessage: '',
    showPagination: true
  };

  appliedFilters: HlaAntigenFilterValue | null = null;
  filterChips: FilterChip[] = [];

  dataSource: HlaAntigenModel[] = [];
  requestState: HlaAntigenParamsDto = {};

  isLoading = false;
  hasError = false;
  searchText = '';

  // Filter Panel State
  isFilterOpen = false;

  // Dialog State
  isDialogOpen = false;

  // Pre-loaded locus codes for dialog
  private cachedLocusCodes: LocusCodeModel[] = [];

  private destroy$ = new Subject<void>();

  /**
   * Check if search and filter should be disabled
   * Only disable during loading or error states
   * Keep enabled even when no data - users need to modify filters
   */
  get isSearchAndFilterDisabled(): boolean {
    return this.isLoading || this.hasError;
  }

  constructor(
    private hlaAntigensService: HlaAntigensService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private pageHeaderService: PageHeaderService,
    private headerService: HeaderService,
    private router: Router
  ) {
    this.initializeConfigurations();

    // Update header config from menu-items API response
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        const navigation = this.router.getCurrentNavigation();
        const state = navigation?.extras?.state || window.history.state;
        const breadcrumbs = state?.['fromDonorDetailQuery']
          ? [
              { label: 'Home', link: '/home' },
              { label: 'Donor Detail Query', link: '/donor-functions/donor-profile/donor-detail-query' },
              { label: pageData.title, link: null }
            ]
          : [
              { label: 'Home', link: '/home' },
              { label: pageData.title, link: null }
            ];
        this.headerConfig = {
          ...this.headerConfig,
          breadcrumbs,
          title: pageData.title,
          subtitle: pageData.subtitle || ''
        };
      }
    });
  }

  ngOnInit(): void {
    this.loadData();
    this.preloadLocusCodes();
    this.subscribeToChapterChanges();
  }

  private preloadLocusCodes(): void {
    this.hlaAntigensService.getLocusCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (codes) => this.cachedLocusCodes = codes,
        error: () => this.cachedLocusCodes = []
      });
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
        this.isDialogOpen = false;

        // Reset search bar
        if (this.searchBarComponent) {
          this.searchBarComponent.searchText = '';
        }

        // Reload data and locus codes for new chapter
        this.loadData();
        this.preloadLocusCodes();
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
        label: 'ADD NEW ANTIGEN',
        icon: 'add',
        color: 'accent',
        ariaLabel: 'Create new HLA antigen',
        onClick: () => this.createRecord()
      }]
    };

    this.searchConfig = {
      placeholder: 'Search by locus or description',
      minLength: 1,
      ariaLabel: 'Search HLA antigens by locus or description',
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
        column: 'locus',
        direction: 'default'
      },
      stickyHeader: true,
      stickyActionsColumn: true,
      emptyMessage: 'No HLA Antigens data found',
      noDataIcon: 'edit',
      loadingMessage: 'Loading HLA antigens data...',
      showPagination: true
    };
  }

  private getTableColumns(): TableColumn<HlaAntigenModel>[] {
    return [
      {
        key: 'locus',
        header: 'Locus',
        sortable: true,
        width: '120px'
      },
      {
        key: 'locusDescription',
        header: 'Description',
        sortable: false,
        width: '220px'
      },
      {
        key: 'epitopeId',
        header: 'Antigen',
        sortable: false,
        width: '150px'
      },
      {
        key: 'epitopeSuperI',
        header: 'Associated Antigen',
        sortable: false,
        width: '180px',
        valueFormatter: (value) => value || '-'
      },
      {
        key: 'effDate',
        header: 'Effective Date',
        sortable: false,
        width: '160px',
        valueFormatter: (value) => this.formatDate(value)
      },
      {
        key: 'termDate',
        header: 'Termination Date',
        sortable: false,
        width: '160px',
        valueFormatter: (value) => this.formatDate(value)
      }
    ];
  }

  private getRowActions(): RowAction<HlaAntigenModel>[] {
    return [
      {
        icon: 'edit',
        iconSvg: 'assets/images/icons/edit.svg',
        label: 'Edit antigen',
        ariaLabel: 'Edit antigen',
        color: 'default',
        action: 'edit'
      }
    ];
  }

  private formatDate(date: Date | string | null | undefined): string {
    if (!date) return '-';
    return moment(date).format('DD-MMM-YYYY').toUpperCase();
  }

  /**
   * Load data from API
   */
  loadData(): void {
    this.isLoading = true;
    this.hasError = false;

    const pageSize = this.tableConfig.pagination?.pageSize || 25;
    const pageIndex = this.tableConfig.pagination?.pageIndex || 0;
    const skip = pageIndex * pageSize;

    // Build request params
    const params: HlaAntigenParamsDto = {
      ...this.requestState
    };

    this.hlaAntigensService.getHlaAntigens(pageSize, skip, params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dataSource = response.data;
          if (this.tableConfig.pagination) {
            this.tableConfig.pagination.totalRecords = response.total;
          }
          this.isLoading = false;
        },
        error: (error) => {
          this.hasError = true;
          this.isLoading = false;
          this.showError('Failed to load HLA antigens data');
        }
      });
  }

  /**
   * Handle search
   */
  onSearch(searchText: string): void {
    this.searchText = searchText;
    this.requestState.searchKeyword = searchText || undefined;

    // Reset to first page when searching
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }
    this.loadData();
  }

  /**
   * Handle pagination
   */
  onPageChange(event: TablePageEvent): void {
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = event.pageIndex;
      this.tableConfig.pagination.pageSize = event.pageSize;
    }
    this.loadData();
  }

  /**
   * Handle sorting
   */
  onSortChange(event: TableSortEvent): void {
    if (this.tableConfig.sortConfig) {
      this.tableConfig.sortConfig.column = event.column;
      this.tableConfig.sortConfig.direction = event.direction;
    }

    // Map sort direction to API format (A -> ASC, D -> DESC)
    if (event.direction === 'A' || event.direction === 'D') {
      this.requestState.sortOrder = event.direction === 'A' ? 'ASC' : 'DESC';
      this.requestState.sortColumn = event.column;
    } else {
      delete this.requestState.sortOrder;
      delete this.requestState.sortColumn;
    }

    this.loadData();
  }

  /**
   * Toggle filter panel
   */
  toggleFilter(): void {
    this.isFilterOpen = !this.isFilterOpen;
  }

  /**
   * Apply filters
   */
  onApplyFilters(filters: HlaAntigenFilterValue): void {
    this.appliedFilters = filters;
    this.filterChips = HlaAntigenFilterChipsUtils.convertFiltersToChips(filters);

    // Convert filter values to API params (convert moment dates to ISO format)
    // Preserve searchKeyword when applying filters
    this.requestState = {
      searchKeyword: this.requestState.searchKeyword,
      epitopeId: filters.antigen || undefined,
      epitopeSuperI: filters.associatedAntigen || undefined,
      effectivePeriod: filters.effectiveDatePeriod || undefined,
      effectiveDate: filters.effectiveDate
        ? DateFieldValidationUtility.serializeDateForApi(filters.effectiveDate)
        : undefined,
      terminationPeriod: filters.terminationDatePeriod || undefined,
      terminationDate: filters.terminationDate
        ? DateFieldValidationUtility.serializeDateForApi(filters.terminationDate)
        : undefined
    };

    // Reset to first page when filtering
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.isFilterOpen = false;
    this.loadData();
  }

  /**
   * Remove specific filter chip
   */
  onRemoveFilterChip(chipKey: string): void {
    this.appliedFilters = HlaAntigenFilterChipsUtils.removeFilterByChipKey(this.appliedFilters, chipKey);
    this.filterChips = HlaAntigenFilterChipsUtils.convertFiltersToChips(this.appliedFilters);

    // Update request state
    this.onApplyFilters(this.appliedFilters || {
      antigen: null,
      associatedAntigen: null,
      effectiveDatePeriod: null,
      effectiveDate: null,
      terminationDatePeriod: null,
      terminationDate: null
    });
  }

  /**
   * Clear all filters
   */
  onClearAllFilters(): void {
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

  /**
   * Create new record
   */
  createRecord(): void {
    if (this.isDialogOpen) {
      return;
    }

    this.isDialogOpen = true;
    const dialogRef = this.dialog.open(AddEditAntigenDialog, {
      width: '742px',
      height: '100vh',
      maxWidth: '100vw',
      maxHeight: '100vh',
      disableClose: true,
      position: { right: '0', top: '0' },
      panelClass: 'add-edit-antigen-drawer',
      hasBackdrop: false,
      autoFocus: false,
      data: {
        mode: 'add',
        locusOptions: this.cachedLocusCodes
      } as AddEditAntigenDialogData
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        this.isDialogOpen = false;
        if (result && result.action === 'save') {
          this.loadData();
        }
      });
  }

  /**
   * Handle row action events from the data table
   */
  onRowAction(event: TableRowActionEvent<HlaAntigenModel>): void {
    if (event.action === 'edit') {
      this.editRecord(event.row);
    }
  }

  /**
   * Edit existing record
   */
  editRecord(row: HlaAntigenModel): void {
    if (this.isDialogOpen) {
      return;
    }

    this.isDialogOpen = true;
    const dialogRef = this.dialog.open(AddEditAntigenDialog, {
      width: '742px',
      height: '100vh',
      maxWidth: '100vw',
      maxHeight: '100vh',
      disableClose: true,
      position: { right: '0', top: '0' },
      panelClass: 'add-edit-antigen-drawer',
      hasBackdrop: false,
      autoFocus: false,
      data: {
        mode: 'edit',
        locus: row.locus,
        locusDescription: row.locusDescription,
        epitopeId: row.epitopeId,
        epitopeSuperI: row.epitopeSuperI,
        effDate: row.effDate,
        termDate: row.termDate,
        locusOptions: this.cachedLocusCodes
      } as AddEditAntigenDialogData
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        this.isDialogOpen = false;
        if (result && result.action === 'save') {
          this.loadData();
        }
      });
  }

  /**
   * Show error message
   */
  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }
}
