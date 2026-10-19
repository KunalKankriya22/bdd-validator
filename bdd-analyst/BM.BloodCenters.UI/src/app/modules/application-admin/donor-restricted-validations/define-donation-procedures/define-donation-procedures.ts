import { Component, OnInit, OnDestroy, HostListener, ViewChild, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { OverlayModule } from '@angular/cdk/overlay';
import { Subject, takeUntil } from 'rxjs';

import { DefineDonationProceduresService } from './services/define-donation-procedures.service';
import {
  DefineDonationProceduresModel,
  DefineDonationProceduresParamsDto,
  LookUp
} from './models/define-donation-procedures.model';
import { AddEditDonationProcedureComponent } from './add-edit-donation-procedure/add-edit-donation-procedure';

import {
  DefineDonationProceduresFilterPanel,
  DefineDonationProceduresFilterFormValue
} from './define-donation-procedures-filter-panel/define-donation-procedures-filter-panel';

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
import { DefineDonationProceduresFilterChipsUtils } from './utils/filter-chips.utils';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { MenuService } from '@shared/services/menu.service';
import { HeaderService } from '@shared/services/header.service';
import { ROUTE_REGISTRY } from '../../../../core/constants/route-registry';
import { RouteKey } from '../../../../core/constants/route-keys';
import { ROUTES } from '../../../../core/constants/route.constants';

@Component({
  selector: 'app-define-donation-procedures',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    OverlayModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    DataTable,
    FilterChips,
    DefineDonationProceduresFilterPanel,
    AddEditDonationProcedureComponent
  ],
  templateUrl: './define-donation-procedures.html',
  styleUrls: ['./define-donation-procedures.scss']
})
export class DefineDonationProceduresComponent implements OnInit, OnDestroy {
  @ViewChild(SearchBar) searchBarComponent!: SearchBar;
  @ViewChild(DataTable) dataTableComponent!: DataTable<DefineDonationProceduresModel>;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
    actions: []
  };

  searchConfig: SearchBarConfig = {
    placeholder: '',
    minLength: 0,
    ariaLabel: ''
  };

  tableConfig: DataTableConfig<DefineDonationProceduresModel> = {
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

  dataSource: DefineDonationProceduresModel[] = [];
  requestState: DefineDonationProceduresParamsDto = {};

  isLoading = false;
  hasError = false;
  errorMessage = '';

  // Filter State
  appliedFilters: DefineDonationProceduresFilterFormValue | null = null;
  filterChips: FilterChip[] = [];
  donationTypes: LookUp[] = [];
  procedureCodes: LookUp[] = [];

  // Filter Panel State
  isFilterOpen = false;
  sidePanelOpen = false;

  private destroy$ = new Subject<void>();
  private menuService = inject(MenuService);

  constructor(
    private defineDonationProceduresService: DefineDonationProceduresService,
    private dialog: MatDialog,
    private headerService: HeaderService
  ) {
    this.initializeConfigurations();

    effect(() => {
      const menuItems = this.menuService.getMenuItemsSignal()();

      if (menuItems.length > 0) {
        const basePath = ROUTE_REGISTRY[RouteKey.DefineDonationProcedures].path;
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
    this.loadFilterDropdownValues();
    this.loadData();
    this.subscribeToChapterChanges();
  }

  private loadFilterDropdownValues(): void {
    this.defineDonationProceduresService
      .getFilterDropdownValues()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.donationTypes = response.donationTypes || [];
          this.procedureCodes = response.procedureCodes || [];
        },
        error: (error) => {
          console.error('Error loading filter dropdown values:', error);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Subscribe to chapter change events from header
   * Empty subscription as this screen only contains tables
   */
  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Empty subscription - no dropdown data to reload
      });
  }

  private initializeConfigurations(): void {
    this.headerConfig = {
      breadcrumbs: [],
      title: '',
      subtitle: '',
      actions: [{
        label: 'ADD DONATION PROCEDURE',
        icon: 'add',
        color: 'accent',
        ariaLabel: 'Create new donation procedure',
        onClick: () => this.createRecord()
      }]
    };

    this.searchConfig = {
      placeholder: 'Search donation type or procedure code',
      minLength: 0,
      ariaLabel: 'Search donation procedures by donation type or procedure code',
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
      stickyActionsColumn: true,
      emptyMessage: 'No Define Donation Procedures data found',
      noDataIcon: 'edit',
      loadingMessage: 'Loading donation procedure data...',
      showPagination: true,
      enableRowHighlight: false
    };
  }

  private getTableColumns(): TableColumn<DefineDonationProceduresModel>[] {
    return [
      {
        key: 'donationType',
        header: 'Donation Type',
        sortable: true,
        width: '100px'
      },
      {
        key: 'donationTypeDescription',
        header: 'Donation Type Description',
        width: '250px'
      },
      {
        key: 'procedureCode',
        header: 'Procedure Code',
        sortable: false,
        width: '100px'
      },
      {
        key: 'procedureCodeDescription',
        header: 'Procedure Description',
        width: '250px'
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

  private formatDate(date: Date | string | null | undefined): string {
    if (!date) return '-';

    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = d.getFullYear();

    return `${day}-${month}-${year}`;
  }

  private getRowActions(): RowAction<DefineDonationProceduresModel>[] {
    return [
      {
        icon: 'edit',
        iconSvg: 'assets/images/icons/edit.svg',
        label: 'Edit donation procedure',
        ariaLabel: 'Edit donation procedure {{donationType}} - {{procedureCode}}',
        color: 'default',
        action: 'edit'
      }
    ];
  }

  loadData(): void {
    this.isLoading = true;
    this.hasError = false;
    this.updateEmptyMessage();

    const skip =
      (this.tableConfig.pagination?.pageIndex || 0) *
      (this.tableConfig.pagination?.pageSize || 25);

    const take = this.tableConfig.pagination?.pageSize || 25;

    this.defineDonationProceduresService
      .getDefineDonationProcedures(take, skip, this.requestState)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: { data: DefineDonationProceduresModel[]; totalRecords: number }) => {
          this.dataSource = response.data;
          this.tableConfig.pagination!.totalRecords = response.totalRecords;
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('Error loading donation procedure data:', error);
          this.dataSource = [];
          this.tableConfig.pagination!.totalRecords = 0;
          this.isLoading = false;
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

    if (event.direction === 'default') {
      this.requestState.sort = undefined;
    } else {
      this.requestState.sort = event.direction;
    }

    this.loadData();
  }

  onRowAction(event: TableRowActionEvent<DefineDonationProceduresModel>): void {
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
    this.sidePanelOpen = true;
    this.dialog.open(AddEditDonationProcedureComponent, {
      panelClass: 'add-edit-donation-procedure-right-dialog',
      backdropClass: 'cdk-overlay-dark-backdrop',
      width: '742px',
      maxWidth: '100vw',
      height: '100vh',
      position: {
        right: '0'
      },
      autoFocus: false,
      disableClose: true,
      data: {
        mode: 'add',
        data: null
      }
    }).afterClosed().subscribe(result => {
      this.sidePanelOpen = false;
      // Clear row selection when closing the dialog
      if (this.dataTableComponent) {
        this.dataTableComponent.activeRow = null;
      }
      if (result) {
        this.loadData();
      }
    });
  }

  editRecord(record: DefineDonationProceduresModel): void {
    this.sidePanelOpen = true;
    this.dialog.open(AddEditDonationProcedureComponent, {
      panelClass: 'add-edit-donation-procedure-right-dialog',
      backdropClass: 'cdk-overlay-dark-backdrop',
      width: '742px',
      maxWidth: '100vw',
      height: '100vh',
      position: {
        right: '0'
      },
      autoFocus: false,
      disableClose: true,
      data: {
        mode: 'edit',
        data: record
      }
    }).afterClosed().subscribe(result => {
      this.sidePanelOpen = false;
      // Clear row selection when closing the dialog
      if (this.dataTableComponent) {
        this.dataTableComponent.activeRow = null;
      }
      if (result) {
        this.loadData();
      }
    });
  }

  toggleFilter(): void {
    this.isFilterOpen = !this.isFilterOpen;
  }

  closeFilter(): void {
    this.isFilterOpen = false;
  }

  applyFilters(filters: DefineDonationProceduresFilterFormValue): void {
    this.appliedFilters = filters;
    this.filterChips = DefineDonationProceduresFilterChipsUtils.convertFiltersToChips(filters);

    // Update request state with filter values
    if (filters.donationType) {
      this.requestState.donationType = filters.donationType;
    } else {
      delete this.requestState.donationType;
    }

    if (filters.procedureCode) {
      this.requestState.procedureCode = filters.procedureCode;
    } else {
      delete this.requestState.procedureCode;
    }

    if (filters.effectiveDate && filters.effectiveDatePeriod) {
      this.requestState.effectiveDate = DateFieldValidationUtility.serializeDateForApi(filters.effectiveDate) || '';
      this.requestState.effectiveDatePeriod = filters.effectiveDatePeriod;
    } else {
      delete this.requestState.effectiveDate;
      delete this.requestState.effectiveDatePeriod;
    }

    if (filters.terminationDate && filters.terminationDatePeriod) {
      this.requestState.terminationDate = DateFieldValidationUtility.serializeDateForApi(filters.terminationDate) || '';
      this.requestState.terminationDatePeriod = filters.terminationDatePeriod;
    } else {
      delete this.requestState.terminationDate;
      delete this.requestState.terminationDatePeriod;
    }

    // Reset to first page when applying filters
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.closeFilter();
    this.loadData();
  }

  removeFilterChip(chipKey: string): void {
    this.appliedFilters = DefineDonationProceduresFilterChipsUtils.removeFilterByChipKey(
      this.appliedFilters,
      chipKey
    );

    this.filterChips = DefineDonationProceduresFilterChipsUtils.convertFiltersToChips(
      this.appliedFilters
    );

    // Update request state
    switch (chipKey) {
      case 'donationType':
        delete this.requestState.donationType;
        break;
      case 'procedureCode':
        delete this.requestState.procedureCode;
        break;
      case 'effectiveDate':
        delete this.requestState.effectiveDate;
        delete this.requestState.effectiveDatePeriod;
        break;
      case 'terminationDate':
        delete this.requestState.terminationDate;
        delete this.requestState.terminationDatePeriod;
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
    delete this.requestState.procedureCode;
    delete this.requestState.effectiveDate;
    delete this.requestState.effectiveDatePeriod;
    delete this.requestState.terminationDate;
    delete this.requestState.terminationDatePeriod;

    // Reset to first page
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  get hasActiveFilters(): boolean {
    return DefineDonationProceduresFilterChipsUtils.hasActiveFilters(this.appliedFilters);
  }

  private updateEmptyMessage(): void {
    this.tableConfig.emptyMessage = 'No Define Donation Procedures data found';
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

    // Escape: Close filter if open
    if (event.key === 'Escape' && this.isFilterOpen) {
      event.preventDefault();
      this.closeFilter();
    }
  }
}
