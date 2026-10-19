import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil } from 'rxjs';

import { DefineProcedureExclusionsService } from './services/define-procedure-exclusions.service';
import {
  DefineProcedureExclusionsModel,
  DefineProcedureExclusionsParamsDto,
  DefineProcedureExclusionsFilterValue
} from './models/define-procedure-exclusions.model';

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
  FlexibleConnectedPositionStrategy,
  OverlayModule
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';

import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { ProcedureExclusionsFilterChipsUtils } from './utils/filter-chips.utils';
import { ProcedureExclusionsFilterPanel } from './procedure-exclusions-filter-panel/procedure-exclusions-filter-panel';
import { AddEditProcedureExclusion } from './add-edit-procedure-exclusion/add-edit-procedure-exclusion';

@Component({
  selector: 'app-define-procedure-exclusions',
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
    AddEditProcedureExclusion
  ],
  templateUrl: './define-procedure-exclusions.html',
  styleUrls: ['./define-procedure-exclusions.scss']
})
export class DefineProcedureExclusionsComponent implements OnInit, OnDestroy {
  @ViewChild(SearchBar) searchBarComponent!: SearchBar;
  @ViewChild(DataTable) dataTableComponent!: DataTable<DefineProcedureExclusionsModel>;
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

  tableConfig: DataTableConfig<DefineProcedureExclusionsModel> = {
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

  appliedFilters: DefineProcedureExclusionsFilterValue | null = null;
  filterChips: FilterChip[] = [];

  dataSource: DefineProcedureExclusionsModel[] = [];
  requestState: DefineProcedureExclusionsParamsDto = {};

  isLoading = false;
  hasError = false;
  errorMessage = '';
  searchText = '';

  // Side Panel State
  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  sidePanelData: DefineProcedureExclusionsModel | null = null;

  // Filter Panel State
  isFilterOpen = false;

  private destroy$ = new Subject<void>();
  private overlayRef: OverlayRef | null = null;
  currentYear: number = new Date().getFullYear();

  constructor(
    private defineProcedureExclusionsService: DefineProcedureExclusionsService,
    private overlay: Overlay,
    private pageHeaderService: PageHeaderService,
    private headerService: HeaderService
  ) {
    this.initializeConfigurations();

    // Update header config from menu-items API response
    effect(() => {
      const menuItem = this.pageHeaderService.getCurrentMenuItem();
      if (menuItem) {
        const subtitle = menuItem.remarks?.trim() || menuItem.subtitle?.trim();
        this.headerConfig = {
          ...this.headerConfig,
          breadcrumbs: [
            {
              label: 'Home',
              link: '/home'
            },
            {
              label: menuItem.label,
              link: null
            }
          ],
          title: menuItem.label,
          subtitle: subtitle || ''
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
        this.closeSidePanel();
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
          this.tableConfig.sortConfig.direction = 'default';
        }
        if (this.overlayRef) {
          this.overlayRef.dispose();
          this.overlayRef = null;
          this.isFilterOpen = false;
        }
        this.loadData();
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
          link: '/'
        },
        {
          label: 'Application Administration',
          link: null
        },
        {
          label: 'Define Procedure Exclusions',
          link: null
        }
      ],
      title: 'Define Procedure Exclusions',
      subtitle: '',
      actions: [{
        label: 'ADD PROCEDURE EXCLUSION',
        icon: 'add',
        color: 'accent',
        ariaLabel: 'Create new procedure exclusion',
        onClick: () => this.createRecord()
      }]
    };

    this.searchConfig = {
      placeholder: 'Search by Donation Type or Description',
      minLength: 1,
      ariaLabel: 'Search by Donation Type or Description',
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
        column: 'donationType',
        direction: 'default'
      },
      stickyHeader: true,
      stickyActionsColumn: true,
      emptyMessage: 'No procedure exclusions available to display',
      loadingMessage: 'Loading procedure exclusion data...',
      showPagination: true
    };
  }

  private getTableColumns(): TableColumn<DefineProcedureExclusionsModel>[] {
    return [
      {
        key: 'donationType',
        header: 'Donation Type',
        sortable: true,
        width: '120px'
      },
      {
        key: 'donationTypeDesc',
        header: 'Description',
        width: '200px'
      },
      {
        key: 'procedure',
        header: 'Procedure',
        width: '120px'
      },
      {
        key: 'procedureDesc',
        header: 'Description',
        width: '200px'
      },
      {
        key: 'interdiction',
        header: 'Interdiction',
        width: '120px'
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

  private getRowActions(): RowAction<DefineProcedureExclusionsModel>[] {
    return [
      {
        icon: 'edit',
        iconSvg: 'assets/images/icons/edit.svg',
        label: 'Edit procedure exclusion',
        ariaLabel: 'Edit procedure exclusion',
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
    const requestParams: DefineProcedureExclusionsParamsDto = {
      ...this.requestState
    };

    this.defineProcedureExclusionsService
      .getDefineProcedureExclusions(take, skip, requestParams)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: { data: DefineProcedureExclusionsModel[]; totalRecords: number }) => {
          this.dataSource = response.data;
          this.tableConfig.pagination!.totalRecords = response.totalRecords;
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('Error loading procedure exclusion data:', error);
          this.hasError = true;
          this.isLoading = false;
          this.errorMessage = 'Failed to load procedure exclusion data. Please try again.';
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
      // Map column key to API sort parameter
      this.requestState.sort = this.mapColumnToSortParam(event.column, event.direction);
    }

    this.loadData();
  }

  /**
   * Map column key and direction to API sort parameter
   * Only supports Donation Type column sorting with 'A' (ascending) or 'D' (descending)
   */
  private mapColumnToSortParam(column: string, direction: 'A' | 'D'): string {
    return direction;
  }

  onRowAction(event: TableRowActionEvent<DefineProcedureExclusionsModel>): void {
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

  editRecord(record: DefineProcedureExclusionsModel): void {
    this.sidePanelMode = 'edit';
    this.sidePanelData = record;
    this.sidePanelOpen = true;
  }

  closeSidePanel(): void {
    this.sidePanelOpen = false;
    this.sidePanelData = null;
    if (this.dataTableComponent) {
      this.dataTableComponent.activeRow = null;
    }
  }

  onSaveSuccess(): void {
    this.sidePanelOpen = false;
    this.loadData();
  }

  onModeChange(newMode: 'add' | 'edit'): void {
    this.sidePanelMode = newMode;
    if (newMode === 'add') {
      this.sidePanelData = null;
    }
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
      .flexibleConnectedTo(this.tableCard)
      .withPositions([
        {
          originX: 'start',
          originY: 'top',
          overlayX: 'start',
          overlayY: 'top',
          offsetX: 0,
          offsetY: 56
        }
      ])
      .withPush(true);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      scrollStrategy: this.overlay.scrollStrategies.block()
    });

    const portal = new ComponentPortal(ProcedureExclusionsFilterPanel);
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
          if (this.filterBtn?.nativeElement) {
            this.filterBtn.nativeElement.blur();
          }
        }
      });
  }

  applyFilters(filters: DefineProcedureExclusionsFilterValue): void {
    this.appliedFilters = filters;

    this.filterChips = ProcedureExclusionsFilterChipsUtils.convertFiltersToChips(filters);

    // Map filter values to backend parameter names
    this.requestState = {
      searchKeyword: this.requestState.searchKeyword,
      donationType: filters.donationType || undefined,
      procedureCode: filters.procedureCode || undefined,
      interdictionCode: filters.interdictionCode || undefined,
      sort: this.requestState.sort
    };

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  onRemoveFilterChip(chipKey: string): void {
    this.appliedFilters = ProcedureExclusionsFilterChipsUtils.removeFilterByChipKey(
      this.appliedFilters,
      chipKey
    );

    this.filterChips = ProcedureExclusionsFilterChipsUtils.convertFiltersToChips(this.appliedFilters);

    this.updateRequestStateFromFilters();

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  hasActiveFilters(): boolean {
    return ProcedureExclusionsFilterChipsUtils.hasActiveFilters(this.appliedFilters);
  }

  clearAllFilters(): void {
    this.appliedFilters = null;
    this.filterChips = [];

    // Reset to only searchKeyword and sort
    this.requestState = {
      searchKeyword: this.requestState.searchKeyword,
      sort: this.requestState.sort
    };

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  private updateRequestStateFromFilters(): void {
    if (!this.appliedFilters) {
      // Reset to only searchKeyword and sort
      this.requestState = {
        searchKeyword: this.requestState.searchKeyword,
        sort: this.requestState.sort
      };
      return;
    }

    // Map filter values to backend parameter names
    this.requestState = {
      searchKeyword: this.requestState.searchKeyword,
      donationType: this.appliedFilters.donationType || undefined,
      procedureCode: this.appliedFilters.procedureCode || undefined,
      interdictionCode: this.appliedFilters.interdictionCode || undefined,
      sort: this.requestState.sort
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
      this.isFilterOpen = false;
      if (this.filterBtn?.nativeElement) {
        this.filterBtn.nativeElement.blur();
      }
    }

    // Escape: Close side panel if open
    if (event.key === 'Escape' && this.sidePanelOpen) {
      event.preventDefault();
      this.closeSidePanel();
    }
  }
}
