import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil } from 'rxjs';
import moment from 'moment';

import { DefineDurationBetweenProceduresService } from './services/define-duration-between-procedures.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import {
  DefineDurationBetweenProceduresModel,
  DefineDurationBetweenProceduresParamsDto,
  DefineDurationBetweenProceduresFilterValue
} from './models/define-duration-between-procedures.model';

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

import {
  Overlay,
  OverlayRef,
  FlexibleConnectedPositionStrategy
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';

import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { DefineDurationFilterChipsUtils } from './utils/filter-chips.utils';
import { DefineDurationFilterPanel } from './define-duration-filter-panel/define-duration-filter-panel';
import { AddEditDefineDuration } from './add-edit-define-duration/add-edit-define-duration';
import { ValidOptionsReference } from './valid-options-reference/valid-options-reference';

@Component({
  selector: 'app-define-duration-between-procedures',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    DataTable,
    FilterChips,
    AddEditDefineDuration,
    ValidOptionsReference
  ],
  templateUrl: './define-duration-between-procedures.html',
  styleUrls: ['./define-duration-between-procedures.scss']
})
export class DefineDurationBetweenProceduresComponent implements OnInit, OnDestroy {
  @ViewChild(SearchBar) searchBarComponent!: SearchBar;
  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef<HTMLElement>;
  @ViewChild('filterBtn', { read: ElementRef }) filterBtn!: ElementRef<HTMLElement>;

  private pageHeaderService = inject(PageHeaderService);

  private _ = effect(() => {
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

  tableConfig: DataTableConfig<DefineDurationBetweenProceduresModel> = {
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
      column: 'currDonationType',
      direction: 'default'
    },
    stickyHeader: true,
    stickyActionsColumn: false,
    emptyMessage: '',
    loadingMessage: '',
    showPagination: true
  };

  appliedFilters: DefineDurationBetweenProceduresFilterValue | null = null;
  filterChips: FilterChip[] = [];

  dataSource: DefineDurationBetweenProceduresModel[] = [];
  requestState: DefineDurationBetweenProceduresParamsDto = {
    activeOnly: true
  };

  isLoading = false;
  hasError = false;
  errorMessage = '';
  searchText = '';

  // Filter Panel State
  isFilterOpen = false;

  // Side Panel State
  isSidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  sidePanelData: DefineDurationBetweenProceduresModel | null = null;

  // Reference Panel State
  isReferencePanelOpen = false;

  private destroy$ = new Subject<void>();
  private overlayRef: OverlayRef | null = null;
  currentYear: number = new Date().getFullYear();

  constructor(
    private defineDurationService: DefineDurationBetweenProceduresService,
    private overlay: Overlay
  ) {
    this.initializeConfigurations();
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
          label: 'Define Duration Between Procedures',
          link: null
        }
      ],
      title: 'Define Duration Between Procedures',
      subtitle: '',
      actions: [
        {
          label: 'ADD RULE',
          icon: 'add',
          color: 'accent',
          ariaLabel: 'Create new duration rule',
          onClick: () => this.createRecord()
        }
      ]
    };

    this.searchConfig = {
      placeholder: 'Search Donation Type or Procedure',
      minLength: 2,
      ariaLabel: 'Search duration rules by donation type, procedure code, or description',
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
        column: 'currDonationType',
        direction: 'default'
      },
      stickyHeader: true,
      stickyActionsColumn: false,
      emptyMessage: 'No duration rules available to display',
      loadingMessage: 'Loading duration rules data...',
      showPagination: true
    };
  }

  private getTableColumns(): TableColumn<DefineDurationBetweenProceduresModel>[] {
    return [
      {
        key: 'currDonationType',
        header: 'Current Donation Type',
        sortable: true,
        width: '140px'
      },
      {
        key: 'currDonationTypeDescription',
        header: 'Donation Description',
        width: '170px'
      },
      {
        key: 'procedureCode',
        header: 'Current Procedure',
        sortable: false,
        width: '140px'
      },
      {
        key: 'procedureCodeDescription',
        header: 'Procedure Description',
        width: '170px'
      },
      {
        key: 'prevProcedureCode',
        header: 'Previous Procedure',
        sortable: false,
        width: '140px'
      },
      {
        key: 'prevProcedureCodeDescription',
        header: 'Procedure Description',
        width: '170px'
      },
      {
        key: 'daysBetween',
        header: 'Days Between',
        sortable: false,
        width: '120px',
        cellClass: 'text-center',
        headerClass: 'text-center'
      },
      {
        key: 'effectiveDate',
        header: 'Effective Date',
        width: '140px',
        valueFormatter: (value) => this.formatDate(value)
      },
      {
        key: 'terminationDate',
        header: 'Termination Date',
        width: '140px',
        valueFormatter: (value) => this.formatDate(value)
      }
    ];
  }

  private formatDate(date: Date | null | undefined): string {
    if (!date) return '-';

    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = d.getFullYear();

    return `${day}-${month}-${year}`;
  }

  private getRowActions(): RowAction<DefineDurationBetweenProceduresModel>[] {
    return [
      {
        icon: 'edit',
        iconSvg: 'assets/images/icons/edit.svg',
        label: 'Edit duration rule',
        ariaLabel: 'Edit duration rule {{procedureCode}}',
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

    this.defineDurationService
      .getDefineDurationBetweenProcedures(take, skip, this.requestState)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: { data: DefineDurationBetweenProceduresModel[]; totalRecords: number }) => {
          this.dataSource = response.data;
          this.tableConfig.pagination!.totalRecords = response.totalRecords;
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('Error loading duration rules data:', error);

          // Check if this is a 404 "no data found" response (not a real error)
          if (error?.status === 404 && error?.error?.data && Array.isArray(error.error.data) && error.error.data.length === 0) {
            // Treat as empty result, not an error
            this.dataSource = [];
            this.tableConfig.pagination!.totalRecords = 0;
            this.hasError = false;
            this.isLoading = false;
          } else {
            // Actual error
            this.hasError = true;
            this.isLoading = false;
            this.errorMessage = 'Failed to load duration rules data. Please try again.';
          }
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

    this.requestState.sort =
      event.direction === 'default' ? undefined : event.direction;

    this.loadData();
  }

  onRowAction(event: TableRowActionEvent<DefineDurationBetweenProceduresModel>): void {
    switch (event.action) {
      case 'edit':
        this.editRecord(event.row);
        break;
    }
  }

  createRecord(): void {
    this.sidePanelMode = 'add';
    this.sidePanelData = null;
    this.isSidePanelOpen = true;
  }

  editRecord(record: DefineDurationBetweenProceduresModel): void {
    this.sidePanelMode = 'edit';
    this.sidePanelData = record;
    this.isSidePanelOpen = true;
  }

  onSidePanelClose(): void {
    this.isSidePanelOpen = false;
    this.sidePanelData = null;
  }

  onSidePanelSave(result: any): void {
    this.loadData();
  }

  openReferencePanel(): void {
    this.isReferencePanelOpen = true;
  }

  onReferencePanelClose(): void {
    this.isReferencePanelOpen = false;
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

    const portal = new ComponentPortal(DefineDurationFilterPanel);
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
        }
      });

    componentRef.instance.close
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.overlayRef) {
          this.overlayRef.dispose();
          this.overlayRef = null;
          this.isFilterOpen = false;
        }
      });

    this.overlayRef.backdropClick()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.overlayRef) {
          this.overlayRef.dispose();
          this.overlayRef = null;
          this.isFilterOpen = false;
        }
      });
  }

  applyFilters(filters: DefineDurationBetweenProceduresFilterValue): void {
    this.appliedFilters = filters;

    this.filterChips = DefineDurationFilterChipsUtils.convertFiltersToChips(filters);

    // Map period + date to API fields
    let effectiveDateFrom: string | undefined;
    let effectiveDateTo: string | undefined;
    let terminationDateFrom: string | undefined;
    let terminationDateTo: string | undefined;

    if (filters.effectiveDate) {
      const dateStr = moment(filters.effectiveDate).format('YYYY-MM-DD');
      if (filters.effectiveDatePeriod === 'AFTER') {
        effectiveDateFrom = dateStr;
      } else if (filters.effectiveDatePeriod === 'BEFORE') {
        effectiveDateTo = dateStr;
      }
    }

    if (filters.terminationDate) {
      const dateStr = moment(filters.terminationDate).format('YYYY-MM-DD');
      if (filters.terminationDatePeriod === 'AFTER') {
        terminationDateFrom = dateStr;
      } else if (filters.terminationDatePeriod === 'BEFORE') {
        terminationDateTo = dateStr;
      }
    }

    this.requestState = {
      ...this.requestState,
      currDonationType: filters.currDonationType || undefined,
      procedureCode: filters.procedureCode || undefined,
      activeOnly: filters.activeOnly,
      effectiveDateFrom,
      effectiveDateTo,
      terminationDateFrom,
      terminationDateTo
    };

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  onRemoveFilterChip(chipKey: string): void {
    this.appliedFilters = DefineDurationFilterChipsUtils.removeFilterByChipKey(
      this.appliedFilters,
      chipKey
    );

    this.filterChips = DefineDurationFilterChipsUtils.convertFiltersToChips(this.appliedFilters);

    this.updateRequestStateFromFilters();

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  hasActiveFilters(): boolean {
    return DefineDurationFilterChipsUtils.hasActiveFilters(this.appliedFilters);
  }

  clearAllFilters(): void {
    this.appliedFilters = null;
    this.filterChips = [];

    const {
      currDonationType,
      procedureCode,
      effectiveDateFrom,
      effectiveDateTo,
      terminationDateFrom,
      terminationDateTo,
      ...rest
    } = this.requestState;
    this.requestState = { ...rest, activeOnly: true };

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  private updateRequestStateFromFilters(): void {
    if (!this.appliedFilters) {
      const {
        currDonationType,
        procedureCode,
        effectiveDateFrom,
        effectiveDateTo,
        terminationDateFrom,
        terminationDateTo,
        ...rest
      } = this.requestState;
      this.requestState = { ...rest, activeOnly: true };
      return;
    }

    // Map period + date to API fields
    let effectiveDateFrom: string | undefined;
    let effectiveDateTo: string | undefined;
    let terminationDateFrom: string | undefined;
    let terminationDateTo: string | undefined;

    if (this.appliedFilters.effectiveDate) {
      const dateStr = moment(this.appliedFilters.effectiveDate).format('YYYY-MM-DD');
      if (this.appliedFilters.effectiveDatePeriod === 'AFTER') {
        effectiveDateFrom = dateStr;
      } else if (this.appliedFilters.effectiveDatePeriod === 'BEFORE') {
        effectiveDateTo = dateStr;
      }
    }

    if (this.appliedFilters.terminationDate) {
      const dateStr = moment(this.appliedFilters.terminationDate).format('YYYY-MM-DD');
      if (this.appliedFilters.terminationDatePeriod === 'AFTER') {
        terminationDateFrom = dateStr;
      } else if (this.appliedFilters.terminationDatePeriod === 'BEFORE') {
        terminationDateTo = dateStr;
      }
    }

    this.requestState = {
      ...this.requestState,
      currDonationType: this.appliedFilters.currDonationType || undefined,
      procedureCode: this.appliedFilters.procedureCode || undefined,
      activeOnly: this.appliedFilters.activeOnly,
      effectiveDateFrom,
      effectiveDateTo,
      terminationDateFrom,
      terminationDateTo
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
    }
  }
}
