import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';
import { DatePipe } from '@angular/common';

import { AssignUserInterdictionClassService } from '../services/assign-user-interdiction-class.service';
import {
  AssignUserInterdictionClassModel,
  AssignUserInterdictionClassParamsDto,
  AssignUserInterdictionClassFilterValue
} from '../models/assign-user-interdiction-class.model';

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

import {
  Overlay,
  OverlayRef,
  FlexibleConnectedPositionStrategy
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';

import { AssignUserInterdictionFilterPanel } from '../assign-user-interdiction-filter-panel/assign-user-interdiction-filter-panel';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { FilterChipsUtils } from '../utils/filter-chips.utils';
import { AddEditUserInterdictionClass, AddEditUserInterdictionClassDialogData } from '../add-edit-user-interdiction-class/add-edit-user-interdiction-class';

@Component({
  selector: 'app-assign-user-interdiction-class-table',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    DataTable,
    FilterChips,
    DatePipe,
    MatDialogModule
  ],
  templateUrl: './assign-user-interdiction-class.html',
  styleUrls: ['./assign-user-interdiction-class.scss']
})
export class AssignUserInterdictionClass implements OnInit, OnDestroy {
  @ViewChild(SearchBar) searchBarComponent!: SearchBar;
  @ViewChild(DataTable) dataTableComponent!: DataTable<AssignUserInterdictionClassModel>;
  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef<HTMLElement>;
  @ViewChild('filterBtn', { read: ElementRef }) filterBtn!: ElementRef<HTMLElement>;

  // Validation constants
  readonly VALIDATION = {
    LIMITS: {
      SEARCH_MIN_LENGTH: 2,
      DEFAULT_PAGE_SIZE: 25,
      DESCRIPTION_TRUNCATE_LENGTH: 50
    }
  };

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    actions: []
  };

  searchConfig: SearchBarConfig = {
    placeholder: '',
    minLength: 2,
    ariaLabel: '',
    searchOnEnterOnly: true
  };

  tableConfig: DataTableConfig<AssignUserInterdictionClassModel> = {
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
      column: 'userId',
      direction: 'default'
    },
    stickyHeader: true,
    stickyActionsColumn: true,
    emptyMessage: '',
    loadingMessage: '',
    showPagination: true
  };

  appliedFilters: AssignUserInterdictionClassFilterValue | null = null;
  filterChips: FilterChip[] = [];

  dataSource: AssignUserInterdictionClassModel[] = [];
  requestState: AssignUserInterdictionClassParamsDto = {};

  isLoading = false;
  hasError = false;
  errorMessage = '';
  searchText = '';
  isFilterPanelOpen = false;

  private destroy$ = new Subject<void>();
  private overlayRef: OverlayRef | null = null;

  currentYear: number = new Date().getFullYear();

  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly headerService = inject(HeaderService);

  constructor(
    private assignUserInterdictionClassService: AssignUserInterdictionClassService,
    private router: Router,
    private overlay: Overlay,
    private dialog: MatDialog
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
    this.loadTableData();
    this.subscribeToChapterChanges();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.appliedFilters = null;
        this.filterChips = [];
        this.searchText = '';
        this.requestState = {};
        if (this.searchBarComponent) {
          this.searchBarComponent.clearSearch();
        }
        if (this.tableConfig.pagination) {
          this.tableConfig.pagination.pageIndex = 0;
        }
        if (this.tableConfig.sortConfig) {
          this.tableConfig.sortConfig.column = 'userId';
          this.tableConfig.sortConfig.direction = 'default';
        }
        this.loadTableData();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.overlayRef) {
      this.overlayRef.dispose();
    }
  }

  private initializeConfigurations(): void {
    this.headerConfig = {
      breadcrumbs: [
        {
          label: 'Home',
          link: '/home'
        },
        {
          label: 'Assign User Interdiction Class',
          link: null
        }
      ],
      actions: [{
        label: 'ASSIGN USER INTERDICTION CLASS',
        icon: 'add',
        color: 'accent',
        ariaLabel: 'Assign new user interdiction class',
        onClick: () => this.createRecord()
      }]
    };

    this.searchConfig = {
      placeholder: 'Search by User ID, Name, or Interdiction Class',
      minLength: this.VALIDATION.LIMITS.SEARCH_MIN_LENGTH,
      ariaLabel: 'Search user interdiction classes by User ID, Name, or Interdiction Class',
      searchOnEnterOnly: true,
      alwaysShowTooltip: true
    };

    this.tableConfig = {
      columns: this.getTableColumns(),
      rowActions: this.getRowActions(),
      pagination: {
        pageSize: this.VALIDATION.LIMITS.DEFAULT_PAGE_SIZE,
        pageIndex: 0,
        totalRecords: 0,
        pageSizeOptions: [10, 25, 50, 100],
        showFirstLastButtons: true
      },
      sortConfig: {
        column: 'userId',
        direction: 'default'
      },
      stickyHeader: true,
      stickyActionsColumn: true,
      emptyMessage: 'No user interdiction classes available to display',
      loadingMessage: 'Loading user interdiction class data...',
      showPagination: true
    };
  }

  private getTableColumns(): TableColumn<AssignUserInterdictionClassModel>[] {
    return [
      {
        key: 'userId',
        header: 'User ID',
        sortable: true,
        width: '120px'
      },
      {
        key: 'userName',
        header: 'Name',
        width: '200px'
      },
      {
        key: 'interClass',
        header: 'Interdiction Class',
        width: '150px'
      },
      {
        key: 'interClassDesc',
        header: 'Description',
        truncate: true,
        truncateLength: this.VALIDATION.LIMITS.DESCRIPTION_TRUNCATE_LENGTH
      },
      {
        key: 'effectiveDate',
        header: 'Effective Date',
        width: '150px',
        valueFormatter: (value) => this.formatDate(value)
      },
      {
        key: 'terminationDate',
        header: 'Termination Date',
        width: '150px',
        valueFormatter: (value) => this.formatDate(value)
      },
      {
        key: 'lastModifiedDate',
        header: 'Modification Date',
        width: '150px',
        valueFormatter: (value) => this.formatDate(value)
      }
    ];
  }

  private getRowActions(): RowAction<AssignUserInterdictionClassModel>[] {
    return [
      {
        icon: 'edit',
        iconSvg: 'assets/images/icons/edit.svg',
        label: 'Edit user interdiction class',
        ariaLabel: 'Edit user interdiction class',
        color: 'default',
        action: 'edit'
      }
    ];
  }

  private formatDate(date: Date | null): string {
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
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  loadTableData(): void {
    this.isLoading = true;
    this.hasError = false;

    const skip =
      (this.tableConfig.pagination?.pageIndex || 0) *
      (this.tableConfig.pagination?.pageSize || 25);

    const take = this.tableConfig.pagination?.pageSize || 25;

    this.assignUserInterdictionClassService
      .getAssignUserInterdictionClass(take, skip, this.requestState)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: response => {
          this.dataSource = response.data;

          this.tableConfig.pagination!.totalRecords = response.totalRecords;

          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading assign user interdiction class data:', error);
          this.hasError = true;
          this.isLoading = false;
          this.errorMessage = 'Failed to load user interdiction class data. Please try again.';
        }
      });
  }

  onSearch(searchText: string): void {
    this.requestState.searchText = searchText || undefined;

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadTableData();
  }

  onPageChange(event: TablePageEvent): void {
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = event.pageIndex;
      this.tableConfig.pagination.pageSize = event.pageSize;
    }
    this.loadTableData();
  }

  /**
   * Map frontend column keys to API column names
   */
  private mapColumnToAPIName(column: string): string {
    const columnMap: { [key: string]: string } = {
      'userId': 'UserId',
      'userName': 'UserName',
      'interClass': 'InterClass',
      'interClassDesc': 'InterClassDesc',
      'effectiveDate': 'EffectiveDate',
      'terminationDate': 'TerminationDate',
      'lastModifiedDate': 'LastModifiedDate'
    };
    return columnMap[column] || column;
  }

  onSortChange(event: TableSortEvent): void {
    this.tableConfig.sortConfig!.column = event.column;
    this.tableConfig.sortConfig!.direction = event.direction;

    if (event.direction === 'default') {
      this.requestState.sort = undefined;
      this.requestState.sortColumn = undefined;
    } else {
      this.requestState.sort = event.direction; // 'A' or 'D'
      this.requestState.sortColumn = this.mapColumnToAPIName(event.column);
    }

    this.loadTableData();
  }

  onRowAction(event: TableRowActionEvent<AssignUserInterdictionClassModel>): void {
    switch (event.action) {
      case 'edit':
        if (this.dataTableComponent) {
          this.dataTableComponent.activeRow = event.row;
        }
        this.editRecord(event.row);
        break;
    }
  }

  createRecord(): void {
    this.openSidePanel('add', null);
  }

  editRecord(record: AssignUserInterdictionClassModel): void {
    this.openSidePanel('edit', record);
  }

  private openSidePanel(mode: 'add' | 'edit', data: AssignUserInterdictionClassModel | null): void {
    const dialogRef = this.dialog.open(AddEditUserInterdictionClass, {
      width: '754px',
      maxWidth: '100vw',
      disableClose: true,
      position: { right: '0', top: '64px' },
      panelClass: 'right-side-drawer',
      enterAnimationDuration: '0ms',  
      exitAnimationDuration: '0ms', 
      data: { mode, data } as AddEditUserInterdictionClassDialogData
    });

    dialogRef.componentInstance.saveSuccess
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadTableData();
      });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.dataTableComponent) {
          this.dataTableComponent.activeRow = null;
        }
      });
  }

  openFilter(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
      this.isFilterPanelOpen = false;
      return;
    }

    this.isFilterPanelOpen = true;

    const positionStrategy: FlexibleConnectedPositionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(this.filterBtn)
      .withPositions([
        {
          originX: 'start',
          originY: 'bottom',
          overlayX: 'start',
          overlayY: 'top',
          offsetY: 8
        }
      ])
      .withPush(false)
      .withViewportMargin(16);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      panelClass: 'filter-panel-overlay'
    });

    const portal = new ComponentPortal(AssignUserInterdictionFilterPanel);
    const componentRef = this.overlayRef.attach(portal);

    componentRef.instance.currentFilters = this.appliedFilters;

    componentRef.instance.apply
      .pipe(takeUntil(this.destroy$))
      .subscribe(filters => {
        this.applyFilters(filters);
        if (this.overlayRef) {
          this.overlayRef.dispose();
          this.overlayRef = null;
          this.isFilterPanelOpen = false;
        }
      });

    componentRef.instance.close
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.overlayRef) {
          this.overlayRef.dispose();
          this.overlayRef = null;
          this.isFilterPanelOpen = false;
        }
      });

    this.overlayRef.backdropClick()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.overlayRef) {
          this.overlayRef.dispose();
          this.overlayRef = null;
          this.isFilterPanelOpen = false;
        }
      });
  }

  applyFilters(filters: AssignUserInterdictionClassFilterValue): void {
    this.appliedFilters = filters;

    this.filterChips = FilterChipsUtils.convertFiltersToChips(
      filters,
      (date: Date | null) => this.formatDate(date)
    );

    this.requestState = {
      ...this.requestState,
      interClass: filters.interClass || undefined,
      effectiveDatePeriod: filters.effectiveDatePeriod || undefined,
      effectiveDate: filters.effectiveDate ? this.formatDateForAPI(filters.effectiveDate) : undefined,
      terminationDatePeriod: filters.terminationDatePeriod || undefined,
      terminationDate: filters.terminationDate ? this.formatDateForAPI(filters.terminationDate) : undefined
    };

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadTableData();
  }

  onRemoveFilterChip(chipKey: string): void {
    this.appliedFilters = FilterChipsUtils.removeFilterByChipKey(this.appliedFilters, chipKey);

    this.filterChips = FilterChipsUtils.convertFiltersToChips(
      this.appliedFilters,
      (date: Date | null) => this.formatDate(date)
    );

    this.updateRequestStateFromFilters();

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadTableData();
  }

  hasActiveFilters(): boolean {
    return FilterChipsUtils.hasActiveFilters(this.appliedFilters);
  }

  clearAllFilters(): void {
    this.appliedFilters = null;
    this.filterChips = [];

    const { interClass, effectiveDatePeriod, effectiveDate, terminationDatePeriod, terminationDate, ...rest } = this.requestState;
    this.requestState = rest;

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadTableData();
  }

  private updateRequestStateFromFilters(): void {
    if (!this.appliedFilters) {
      const { interClass, effectiveDatePeriod, effectiveDate, terminationDatePeriod, terminationDate, ...rest } = this.requestState;
      this.requestState = rest;
      return;
    }

    this.requestState = {
      ...this.requestState,
      interClass: this.appliedFilters.interClass || undefined,
      effectiveDatePeriod: this.appliedFilters.effectiveDatePeriod || undefined,
      effectiveDate: this.appliedFilters.effectiveDate ? this.formatDateForAPI(this.appliedFilters.effectiveDate) : undefined,
      terminationDatePeriod: this.appliedFilters.terminationDatePeriod || undefined,
      terminationDate: this.appliedFilters.terminationDate ? this.formatDateForAPI(this.appliedFilters.terminationDate) : undefined
    };
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

    // Alt+F: Open filter
    if (event.altKey && event.key.toLowerCase() === 'f') {
      event.preventDefault();
      this.openFilter();
    }

    // Escape: Close filter panel if open
    if (event.key === 'Escape' && this.overlayRef) {
      event.preventDefault();
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
  }
}
