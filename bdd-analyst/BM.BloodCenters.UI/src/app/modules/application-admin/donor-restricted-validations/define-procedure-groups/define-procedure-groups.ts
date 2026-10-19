import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';

import { DefineProcedureGroupsService } from './services/define-procedure-groups.service';
import {
  DefineProcedureGroupsModel,
  DefineProcedureGroupsParamsDto,
  DefineProcedureGroupsFilterValue
} from './models/define-procedure-groups.model';

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

import {
  Overlay,
  OverlayRef,
  FlexibleConnectedPositionStrategy,
  OverlayModule
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';

import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { ProcedureGroupsFilterChipsUtils } from './utils/filter-chips.utils';
import { ProcedureGroupsFilterPanel } from './procedure-groups-filter-panel/procedure-groups-filter-panel';
import { AddEditProcedureGroup, ProcedureGroupDialogData } from './add-edit-procedure-group/add-edit-procedure-group';

@Component({
  selector: 'app-define-procedure-groups',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    OverlayModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    DataTable,
    FilterChips
  ],
  templateUrl: './define-procedure-groups.html',
  styleUrls: ['./define-procedure-groups.scss']
})
export class DefineProcedureGroupsComponent implements OnInit, OnDestroy {
  @ViewChild(SearchBar) searchBarComponent!: SearchBar;
  @ViewChild(DataTable) dataTableComponent!: DataTable<DefineProcedureGroupsModel>;
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

  tableConfig: DataTableConfig<DefineProcedureGroupsModel> = {
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
      column: 'procedureGroup',
      direction: 'default'
    },
    stickyHeader: true,
    stickyActionsColumn: true,
    emptyMessage: '',
    loadingMessage: '',
    showPagination: true
  };

  appliedFilters: DefineProcedureGroupsFilterValue | null = null;
  filterChips: FilterChip[] = [];

  dataSource: DefineProcedureGroupsModel[] = [];
  requestState: DefineProcedureGroupsParamsDto = {};

  isLoading = false;
  hasError = false;
  errorMessage = '';
  searchText = '';

  // Filter Panel State
  isFilterOpen = false;

  private destroy$ = new Subject<void>();
  private overlayRef: OverlayRef | null = null;
  currentYear: number = new Date().getFullYear();

  constructor(
    private defineProcedureGroupsService: DefineProcedureGroupsService,
    private router: Router,
    private overlay: Overlay,
    private pageHeaderService: PageHeaderService,
    private dialog: MatDialog
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
            label: 'ADD PROCEDURE GROUP MAPPING',
            icon: 'add',
            color: 'accent',
            ariaLabel: 'Create new procedure group mapping',
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
          label: 'Define Procedure Groups',
          link: null
        }
      ],
      title: 'Define Procedure Groups',
      subtitle: '',
      actions: [{
        label: 'ADD PROCEDURE GROUP MAPPING',
        icon: 'add',
        color: 'accent',
        ariaLabel: 'Create new procedure group mapping',
        onClick: () => this.createRecord()
      }]
    };

    this.searchConfig = {
      placeholder: 'Search by Procedure Code or Procedure Code Description',
      minLength: 2,
      ariaLabel: 'Search by Procedure Code or Procedure Code Description',
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
        column: 'procedureGroup',
        direction: 'default'
      },
      stickyHeader: true,
      stickyActionsColumn: true,
      emptyMessage: 'No Define Procedure Groups Found.',
      loadingMessage: 'Loading procedure group data...',
      showPagination: true
    };
  }

  private getTableColumns(): TableColumn<DefineProcedureGroupsModel>[] {
    return [
      {
        key: 'procedureGroup',
        header: 'Procedure Group',
        sortable: true,
        width: '150px'
      },
      {
        key: 'groupDescription',
        header: 'Procedure Group Description',
        width: '200px'
      },
      {
        key: 'eligCreditCount',
        header: 'Donation Credits',
        width: '120px'
      },
      {
        key: 'procedureCode',
        header: 'Procedure Code',
        width: '150px'
      },
      {
        key: 'procedureDescription',
        header: 'Procedure Code Description',
        width: '250px'
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

  private formatDate(date: Date | string | null | undefined): string {
    if (!date) return '-';

    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = d.getFullYear();

    return `${day}-${month}-${year}`;
  }

  private getRowActions(): RowAction<DefineProcedureGroupsModel>[] {
    return [
      {
        icon: 'edit',
        iconSvg: 'assets/images/icons/edit.svg',
        label: 'Edit procedure group',
        ariaLabel: 'Edit procedure group {{procedureGroup}}',
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

    // Prepare request with required API parameters
    const requestParams: DefineProcedureGroupsParamsDto = {
      ...this.requestState,
      includeTerminated: true // Include terminated records by default
    };

    // Set eligCreditCount to 0 only if no specific credit filter is applied (0 means all entries)
    if (requestParams.eligCreditCount === undefined) {
      requestParams.eligCreditCount = 0;
      this.requestState.eligCreditCount = 0;
    }

    this.defineProcedureGroupsService
      .getDefineProcedureGroups(take, skip, requestParams)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: { data: DefineProcedureGroupsModel[]; totalRecords: number }) => {
          this.dataSource = response.data;
          this.tableConfig.pagination!.totalRecords = response.totalRecords;
          this.isLoading = false;
          this.hasError = false;
        },
        error: (error: any) => {
          console.error('Error loading procedure group data:', error);
          this.dataSource = [];
          this.tableConfig.pagination!.totalRecords = 0;
          this.isLoading = false;
          this.hasError = false; // Don't show error state, let table show empty state
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
      // Map sort direction to API format: PROCEDURE_GROUP_ASC or PROCEDURE_GROUP_DESC
      this.requestState.sort = event.direction === 'A'
        ? 'PROCEDURE_GROUP_ASC'
        : 'PROCEDURE_GROUP_DESC';
    }

    this.loadData();
  }

  onRowAction(event: TableRowActionEvent<DefineProcedureGroupsModel>): void {
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
    this.openProcedureGroupDialog('add', null);
  }

  editRecord(record: DefineProcedureGroupsModel): void {
    this.openProcedureGroupDialog('edit', record);
  }

  private openProcedureGroupDialog(mode: 'add' | 'edit', data: DefineProcedureGroupsModel | null): void {
    const dialogRef = this.dialog.open<AddEditProcedureGroup, ProcedureGroupDialogData>(AddEditProcedureGroup, {
      width: '660px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      data: { mode, data },
      panelClass: 'code-dialog-panel-right',
      position: { right: '0', top: '64px' },
      disableClose: false,
      hasBackdrop: true
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result?.saved) {
          this.loadData();
        }
      });
  }

  openFilter(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
      this.isFilterOpen = false;
      return;
    }

    this.isFilterOpen = true;

    const positionStrategy: FlexibleConnectedPositionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(this.filterBtn)
      .withPositions([
        {
          originX: 'start',
          originY: 'bottom',
          overlayX: 'start',
          overlayY: 'top',
          offsetX: 0,
          offsetY: 8
        }
      ])
      .withPush(true);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      scrollStrategy: this.overlay.scrollStrategies.block()
    });

    const portal = new ComponentPortal(ProcedureGroupsFilterPanel);
    const componentRef = this.overlayRef.attach(portal);

    componentRef.instance.currentFilters = this.appliedFilters;

    componentRef.instance.apply
      .pipe(takeUntil(this.destroy$))
      .subscribe(filters => {
        this.applyFilters(filters);
        if (this.overlayRef) {
          this.overlayRef.dispose();
          this.overlayRef = null;
          this.isFilterOpen = false;
          // Remove focus from filter button
          if (this.filterBtn?.nativeElement) {
            this.filterBtn.nativeElement.blur();
          }
        }
      });

    componentRef.instance.close
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.overlayRef) {
          this.overlayRef.dispose();
          this.overlayRef = null;
          this.isFilterOpen = false;
          // Remove focus from filter button
          if (this.filterBtn?.nativeElement) {
            this.filterBtn.nativeElement.blur();
          }
        }
      });

    this.overlayRef.backdropClick()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.overlayRef) {
          this.overlayRef.dispose();
          this.overlayRef = null;
          this.isFilterOpen = false;
          // Remove focus from filter button
          if (this.filterBtn?.nativeElement) {
            this.filterBtn.nativeElement.blur();
          }
        }
      });
  }

  applyFilters(filters: DefineProcedureGroupsFilterValue): void {
    this.appliedFilters = filters;

    this.filterChips = ProcedureGroupsFilterChipsUtils.convertFiltersToChips(filters);

    // Map filter values to backend parameter names
    this.requestState = {
      ...this.requestState,
      procedureGroup: filters.procedureGroupCode || undefined,
      procedureCode: filters.procedureCode || undefined,
      eligCreditCount: filters.donationCredits !== null && filters.donationCredits !== undefined
        ? filters.donationCredits
        : undefined
    };

    // Handle effective date period filter
    if (filters.effectiveDatePeriod && filters.effectiveDate) {
      const effectiveDate = new Date(filters.effectiveDate);
      const dateStr = effectiveDate.toISOString();

      if (filters.effectiveDatePeriod === 'After') {
        this.requestState.effectiveDateAfter = dateStr;
        this.requestState.effectiveDateBefore = undefined;
      } else if (filters.effectiveDatePeriod === 'Before') {
        this.requestState.effectiveDateBefore = dateStr;
        this.requestState.effectiveDateAfter = undefined;
      }
    } else {
      this.requestState.effectiveDateAfter = undefined;
      this.requestState.effectiveDateBefore = undefined;
    }

    // Handle termination date period filter
    if (filters.terminationDatePeriod && filters.terminationDate) {
      const terminationDate = new Date(filters.terminationDate);
      const dateStr = terminationDate.toISOString();

      if (filters.terminationDatePeriod === 'After') {
        this.requestState.terminationDateAfter = dateStr;
        this.requestState.terminationDateBefore = undefined;
      } else if (filters.terminationDatePeriod === 'Before') {
        this.requestState.terminationDateBefore = dateStr;
        this.requestState.terminationDateAfter = undefined;
      }
    } else {
      this.requestState.terminationDateAfter = undefined;
      this.requestState.terminationDateBefore = undefined;
    }

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  onRemoveFilterChip(chipKey: string): void {
    this.appliedFilters = ProcedureGroupsFilterChipsUtils.removeFilterByChipKey(
      this.appliedFilters,
      chipKey
    );

    this.filterChips = ProcedureGroupsFilterChipsUtils.convertFiltersToChips(this.appliedFilters);

    this.updateRequestStateFromFilters();

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  hasActiveFilters(): boolean {
    return ProcedureGroupsFilterChipsUtils.hasActiveFilters(this.appliedFilters);
  }

  clearAllFilters(): void {
    this.appliedFilters = null;
    this.filterChips = [];

    // Remove filter parameters
    const { procedureGroup, procedureCode, eligCreditCount, effectiveDateAfter, effectiveDateBefore, terminationDateAfter, terminationDateBefore, ...rest } = this.requestState;
    this.requestState = rest;

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  private updateRequestStateFromFilters(): void {
    if (!this.appliedFilters) {
      const { procedureGroup, procedureCode, eligCreditCount, effectiveDateAfter, effectiveDateBefore, terminationDateAfter, terminationDateBefore, ...rest } = this.requestState;
      this.requestState = rest;
      return;
    }

    // Map filter values to backend parameter names
    this.requestState = {
      ...this.requestState,
      procedureGroup: this.appliedFilters.procedureGroupCode || undefined,
      procedureCode: this.appliedFilters.procedureCode || undefined,
      eligCreditCount: this.appliedFilters.donationCredits !== null && this.appliedFilters.donationCredits !== undefined
        ? this.appliedFilters.donationCredits
        : undefined
    };

    // Handle effective date period filter
    if (this.appliedFilters.effectiveDatePeriod && this.appliedFilters.effectiveDate) {
      const effectiveDate = new Date(this.appliedFilters.effectiveDate);
      const dateStr = effectiveDate.toISOString();

      if (this.appliedFilters.effectiveDatePeriod === 'After') {
        this.requestState.effectiveDateAfter = dateStr;
        this.requestState.effectiveDateBefore = undefined;
      } else if (this.appliedFilters.effectiveDatePeriod === 'Before') {
        this.requestState.effectiveDateBefore = dateStr;
        this.requestState.effectiveDateAfter = undefined;
      }
    } else {
      this.requestState.effectiveDateAfter = undefined;
      this.requestState.effectiveDateBefore = undefined;
    }

    // Handle termination date period filter
    if (this.appliedFilters.terminationDatePeriod && this.appliedFilters.terminationDate) {
      const terminationDate = new Date(this.appliedFilters.terminationDate);
      const dateStr = terminationDate.toISOString();

      if (this.appliedFilters.terminationDatePeriod === 'After') {
        this.requestState.terminationDateAfter = dateStr;
        this.requestState.terminationDateBefore = undefined;
      } else if (this.appliedFilters.terminationDatePeriod === 'Before') {
        this.requestState.terminationDateBefore = dateStr;
        this.requestState.terminationDateAfter = undefined;
      }
    } else {
      this.requestState.terminationDateAfter = undefined;
      this.requestState.terminationDateBefore = undefined;
    }

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
      this.isFilterOpen = false;
      // Remove focus from filter button
      if (this.filterBtn?.nativeElement) {
        this.filterBtn.nativeElement.blur();
      }
    }
  }
}
