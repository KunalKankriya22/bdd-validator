import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';

import { RegistrationHoldsMappingService } from './services/registration-holds-mapping.service';
import {
  RegistrationHoldsMappingModel,
  RegistrationHoldsMappingParamsDto,
  RegistrationHoldsMappingFilterValue
} from './models/registration-holds-mapping.model';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { DataTable } from '@shared/components/data-table/data-table';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import moment from 'moment';
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
  OverlayRef
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';

import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { AddEditRegistrationHolds } from './add-edit-registration-holds/add-edit-registration-holds';
import { RegistrationHoldsFilterPanel } from './registration-holds-filter-panel/registration-holds-filter-panel';

@Component({
  selector: 'app-registration-holds-mapping',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    DataTable,
    FilterChips,
    RegistrationHoldsFilterPanel
  ],
  templateUrl: './registration-holds-mapping.html',
  styleUrls: ['./registration-holds-mapping.scss']
})
export class RegistrationHoldsMappingComponent implements OnInit, OnDestroy {
  @ViewChild(SearchBar) searchBarComponent!: SearchBar;
  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef<HTMLElement>;
  @ViewChild('filterBtn', { read: ElementRef }) filterBtn!: ElementRef<HTMLElement>;
  @ViewChild('controlsSection', { read: ElementRef }) controlsSection!: ElementRef<HTMLElement>;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    actions: []
  };

  searchConfig: SearchBarConfig = {
    placeholder: '',
    minLength: 3,
    ariaLabel: ''
  };

  tableConfig: DataTableConfig<RegistrationHoldsMappingModel> = {
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
      column: 'interdictionReason',
      direction: 'A'
    },
    stickyHeader: true,
    stickyActionsColumn: true,
    enableRowHighlight: true,
    emptyMessage: '',
    loadingMessage: '',
    showPagination: true
  };

  appliedFilters: RegistrationHoldsMappingFilterValue | null = null;
  filterChips: FilterChip[] = [];

  dataSource: RegistrationHoldsMappingModel[] = [];
  requestState: RegistrationHoldsMappingParamsDto = {};

  isLoading = false;
  hasError = false;
  errorMessage = '';
  searchText = '';

  // Filter Panel State
  isFilterOpen = false;

  // Row highlight state - tracks the currently editing row
  editingRow: RegistrationHoldsMappingModel | null = null;

  private destroy$ = new Subject<void>();
  private overlayRef: OverlayRef | null = null;
  currentYear: number = new Date().getFullYear();

  constructor(
    private registrationHoldsMappingService: RegistrationHoldsMappingService,
    private router: Router,
    private overlay: Overlay,
    private dialog: MatDialog,
    private headerService: HeaderService,
    private pageHeaderService: PageHeaderService
  ) {
    this.initializeConfigurations();

    // Bind header data from menu-item API response
    effect(() => {
      const menuItem = this.pageHeaderService.getCurrentMenuItem();
      if (menuItem) {
        // Subtitle priority: remarks (if not empty) > subtitle
        const subtitle = menuItem.remarks?.trim() || menuItem.subtitle?.trim();

        this.headerConfig = {
          ...this.headerConfig,
          title: menuItem.label,
          subtitle: subtitle,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: menuItem.label, link: null }
          ]
        };
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

    if (this.overlayRef) {
      this.overlayRef.dispose();
    }
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Reset to first page and reload data when chapter changes
        if (this.tableConfig.pagination) {
          this.tableConfig.pagination.pageIndex = 0;
        }
        this.loadData();
      });
  }

  private initializeConfigurations(): void {
    // Initial header config - title, subtitle, and breadcrumbs will be populated by effect from menu-item API
    this.headerConfig = {
      breadcrumbs: [],
      actions: [{
        label: 'ADD NEW RECORD',
        icon: 'add',
        color: 'accent',
        ariaLabel: 'Add new registration hold mapping record',
        onClick: () => this.createRecord()
      }]
    };

    this.searchConfig = {
      placeholder: 'Search by code or interdiction reason',
      minLength: 2,
      ariaLabel: 'Search by code or interdiction reason',
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
        column: 'code',
        direction: 'A'
      },
      stickyHeader: true,
      stickyActionsColumn: true,
      noDataIcon: 'edit',
      emptyMessage: 'No Registration Holds Mapping Found',
      emptySubMessage: 'Try adjusting your search or filter criteria.',
      loadingMessage: 'Loading registration holds data...',
      showPagination: true
    };

    // Set initial sort state
    this.requestState.Sort = 'asc';
    this.requestState.SortColumn = 'code';
  }

  private getTableColumns(): TableColumn<RegistrationHoldsMappingModel>[] {
    return [
      {
        key: 'interdictionReason',
        header: 'Interdiction Reason',
        width: '180px'
      },
      {
        key: 'code',
        header: 'Code',
        sortable: true,
        width: '120px'
      },
      {
        key: 'description',
        header: 'Description',
        width: 'auto'
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
      }
    ];
  }

  private formatDate(date: Date | null | undefined): string {
    if (!date) return '-';
    return DateFieldValidationUtility.formatDateForUI(moment.utc(date)).toUpperCase();
  }

  private getDatePeriodSymbol(period: string): string {
    return period.toLowerCase() === 'before' ? '≤' : '≥';
  }

  private getRowActions(): RowAction<RegistrationHoldsMappingModel>[] {
    return [
      {
        icon: 'edit',
        iconSvg: 'assets/images/icons/edit.svg',
        label: 'Edit registration hold mapping',
        ariaLabel: 'Edit registration hold mapping {{code}}',
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

    this.registrationHoldsMappingService
      .getRegistrationHoldsMapping(take, skip, this.requestState)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: { data: RegistrationHoldsMappingModel[]; totalRecords: number }) => {
          this.dataSource = response.data;
          this.tableConfig.pagination!.totalRecords = response.totalRecords;
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('Error loading registration holds data:', error);
          this.hasError = true;
          this.isLoading = false;
          this.errorMessage = 'Failed to load registration holds data. Please try again.';
        }
      });
  }

  onSearch(searchText: string): void {
    // Clear or set search keyword
    if (searchText && searchText.trim().length > 0) {
      this.requestState.SearchKeyword = searchText.trim();
    } else {
      delete this.requestState.SearchKeyword;
    }

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
    this.tableConfig.sortConfig!.column = event.column;
    this.tableConfig.sortConfig!.direction = event.direction;

    // Map 'A'/'D' to 'asc'/'desc' for backend API
    let sortOrder: 'asc' | 'desc' | undefined;
    if (event.direction === 'A') {
      sortOrder = 'asc';
    } else if (event.direction === 'D') {
      sortOrder = 'desc';
    } else {
      sortOrder = undefined;
    }

    this.requestState.Sort = sortOrder;
    this.requestState.SortColumn = sortOrder ? event.column : undefined;

    this.loadData();
  }

  onRowAction(event: TableRowActionEvent<RegistrationHoldsMappingModel>): void {
    switch (event.action) {
      case 'edit':
        this.editRecord(event.row);
        break;
    }
  }

  createRecord(): void {
    // Remove focus from the add button before opening dialog
    (document.activeElement as HTMLElement)?.blur();

    const dialogRef = this.dialog.open(AddEditRegistrationHolds, {
      width: '700px',
      height: 'calc(100vh - 64px)',
      maxHeight: 'calc(100vh - 64px)',
      disableClose: true,
      position: { right: '0', top: '64px' },
      panelClass: 'registration-holds-drawer',
      hasBackdrop: true,
      backdropClass: 'registration-holds-backdrop',
      data: { mode: 'add' }
    });

    dialogRef.afterClosed().subscribe(result => {
      // Remove focus from any active element to prevent highlight
      (document.activeElement as HTMLElement)?.blur();
      if (result) this.loadData();
    });
  }

  editRecord(record: RegistrationHoldsMappingModel): void {
    // Remove focus from the edit button before opening dialog
    (document.activeElement as HTMLElement)?.blur();

    // Set the editing row to highlight it in the table
    this.editingRow = record;

    const dialogRef = this.dialog.open(AddEditRegistrationHolds, {
      width: '700px',
      height: 'calc(100vh - 64px)',
      maxHeight: 'calc(100vh - 64px)',
      disableClose: true,
      position: { right: '0', top: '64px' },
      panelClass: 'registration-holds-drawer',
      hasBackdrop: true,
      backdropClass: 'registration-holds-backdrop',
      data: { mode: 'edit', record }
    });

    dialogRef.afterClosed().subscribe(result => {
      // Clear the highlighted row when dialog closes
      this.editingRow = null;
      // Remove focus from any active element to prevent highlight
      (document.activeElement as HTMLElement)?.blur();
      if (result) this.loadData();
    });
  }

  openFilter(): void {
    if (this.overlayRef) {
      this.closeFilter();
      return;
    }

    this.isFilterOpen = true;

    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(this.controlsSection.nativeElement)
      .withPositions([
        {
          originX: 'start',
          originY: 'bottom',
          overlayX: 'start',
          overlayY: 'top',
          offsetY: 0
        }
      ]);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop'
    });

    const filterPortal = new ComponentPortal(RegistrationHoldsFilterPanel);
    const filterPanelRef = this.overlayRef.attach(filterPortal);

    // Pass current filters to the panel
    filterPanelRef.instance.currentFilters = this.appliedFilters;

    // Subscribe to apply event
    filterPanelRef.instance.apply.subscribe((filters: RegistrationHoldsMappingFilterValue) => {
      this.applyFilters(filters);
      this.closeFilter();
    });

    // Subscribe to close event
    filterPanelRef.instance.close.subscribe(() => {
      this.closeFilter();
    });

    // Close on backdrop click
    this.overlayRef.backdropClick().subscribe(() => {
      this.closeFilter();
    });
  }

  private closeFilter(): void {
    this.overlayRef?.dispose();
    this.overlayRef = null;
    this.isFilterOpen = false;
    // Remove focus from filter button
    if (this.filterBtn?.nativeElement) {
      this.filterBtn.nativeElement.blur();
    }
  }

  applyFilters(filters: RegistrationHoldsMappingFilterValue): void {
    this.appliedFilters = filters;

    // Clear previous filter values
    delete this.requestState.EffectiveDate;
    delete this.requestState.EffectiveDatePeriod;
    delete this.requestState.TerminationDate;
    delete this.requestState.TerminationDatePeriod;

    // Map filter values to backend parameters with operators
    if (filters.effectiveDate && filters.effectiveDatePeriod) {
      this.requestState.EffectiveDate = String(filters.effectiveDate);
      this.requestState.EffectiveDatePeriod = filters.effectiveDatePeriod.toUpperCase();
    }

    if (filters.terminationDate && filters.terminationDatePeriod) {
      this.requestState.TerminationDate = String(filters.terminationDate);
      this.requestState.TerminationDatePeriod = filters.terminationDatePeriod.toUpperCase();
    }

    // Update filter chips
    this.filterChips = [];
    if (filters.effectiveDate && filters.effectiveDatePeriod) {
      const symbol = this.getDatePeriodSymbol(filters.effectiveDatePeriod);
      this.filterChips.push({
        key: 'effectiveDate',
        label: `Effective Date ${symbol} ${DateFieldValidationUtility.formatDateForUI(moment.utc(String(filters.effectiveDate)))}`,
        value: filters.effectiveDate
      });
    }
    if (filters.terminationDate && filters.terminationDatePeriod) {
      const symbol = this.getDatePeriodSymbol(filters.terminationDatePeriod);
      this.filterChips.push({
        key: 'terminationDate',
        label: `Termination Date ${symbol} ${DateFieldValidationUtility.formatDateForUI(moment.utc(String(filters.terminationDate)))}`,
        value: filters.terminationDate
      });
    }

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  onRemoveFilterChip(chipKey: string): void {
    if (!this.appliedFilters) return;

    // Remove the filter from appliedFilters
    if (chipKey === 'effectiveDate') {
      this.appliedFilters.effectiveDate = null;
      this.appliedFilters.effectiveDatePeriod = null;
      delete this.requestState.EffectiveDate;
      delete this.requestState.EffectiveDatePeriod;
    } else if (chipKey === 'terminationDate') {
      this.appliedFilters.terminationDate = null;
      this.appliedFilters.terminationDatePeriod = null;
      delete this.requestState.TerminationDate;
      delete this.requestState.TerminationDatePeriod;
    }

    // Update filter chips
    this.filterChips = this.filterChips.filter(chip => chip.key !== chipKey);

    // Reset pagination
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  hasActiveFilters(): boolean {
    return this.appliedFilters !== null && Object.keys(this.appliedFilters).length > 0;
  }

  clearAllFilters(): void {
    this.appliedFilters = null;
    this.filterChips = [];

    // Remove filter parameters
    delete this.requestState.EffectiveDate;
    delete this.requestState.EffectiveDatePeriod;
    delete this.requestState.TerminationDate;
    delete this.requestState.TerminationDatePeriod;

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
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
      this.closeFilter();
    }

    // Note: Modal does NOT close on ESC key (disableClose: true behavior like System Parameter)
    // Modal only closes via Cancel/Save buttons
  }
}
