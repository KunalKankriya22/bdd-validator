import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';

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
import { Filter } from '../filter/filter';
import { AddEditEligibleCellLoss } from '../add-edit-eligible-cell-loss/add-edit-eligible-cell-loss';
import { EligiblePlasmaCellLossService } from '../services/eligible-plasma-cell-loss.service';
import {
  EligiblePlasmaCellLossRecord,
  CellTypeOption,
  StatusOption,
  PaginatedResponse
} from '../models/eligible-plasma-cell-loss.model';
import { PageHeaderService } from '@shared/services/page-header.service';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import moment from 'moment';

export interface EligibleCellPlasmaLossModel {
  cellType?: string;
  description?: string;
  minWeight?: number | null;
  maxWeight?: number | null;
  auditKey?: string;
  maxLoss?: number;
  period?: number;
  effectiveDate?: string | null;
  terminationDate?: string | null;
}

export interface EligibleCellPlasmaLossFilterValue {
  cellType?: string | null;
  status?: string;
}

@Component({
  selector: 'app-define-eligible-cell-plasma-loss',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    DataTable,
    FilterChips,
    AddEditEligibleCellLoss
  ],
  templateUrl: './define-eligible-cell-plasma-loss.html',
  styleUrls: ['./define-eligible-cell-plasma-loss.scss']
})
export class DefineEligibleCellPlasmaLoss implements OnInit, OnDestroy {
  @ViewChild(SearchBar) searchBarComponent!: SearchBar;
  @ViewChild(DataTable) dataTableComponent!: DataTable<EligibleCellPlasmaLossModel>;
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
    minLength: 3,
    ariaLabel: ''
  };

  tableConfig: DataTableConfig<EligibleCellPlasmaLossModel> = {
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
      column: 'cellType',
      direction: 'default'
    },
    stickyHeader: true,
    stickyActionsColumn: true,
    emptyMessage: '',
    loadingMessage: '',
    showPagination: true
  };

  appliedFilters: EligibleCellPlasmaLossFilterValue = {
    cellType: null,
    status: 'active'
  };
  filterChips: FilterChip[] = [];

  // Filter options from API
  cellTypeOptions: CellTypeOption[] = [];
  statusOptions: StatusOption[] = [];

  dataSource: EligibleCellPlasmaLossModel[] = [];

  isLoading = false;
  hasError = false;
  errorMessage = '';
  searchText = '';

  // Side Panel State
  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  sidePanelData: EligibleCellPlasmaLossModel | null = null;

  // Filter Panel State
  isFilterOpen = false;

  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<string>();
  private overlayRef: OverlayRef | null = null;
  currentYear: number = new Date().getFullYear();

  constructor(
    private router: Router,
    private overlay: Overlay,
    private snackBar: MatSnackBar,
    private eligiblePlasmaCellLossService: EligiblePlasmaCellLossService,
    private pageHeaderService: PageHeaderService
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
    this.loadFilterOptions();
    this.setupSearchDebounce();
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
        { label: 'Home', link: '/home' }
      ],
      title: '',
      subtitle: '',
      actions: [{
        label: 'ADD ELIGIBLE CELL LOSS',
        icon: 'add',
        color: 'accent',
        ariaLabel: 'Create new eligible cell plasma loss record',
        onClick: () => this.createRecord()
      }]
    };

    this.searchConfig = {
      placeholder: 'Search by Cell Type or Description',
      minLength: 2,
      ariaLabel: 'Search eligible cell plasma loss records',
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
        column: 'cellType',
        direction: 'default'
      },
      stickyHeader: true,
      stickyActionsColumn: true,
      emptyMessage: 'No eligible cell plasma loss records available to display',
      loadingMessage: 'Loading eligible cell plasma loss data...',
      showPagination: true
    };
  }

  private getTableColumns(): TableColumn<EligibleCellPlasmaLossModel>[] {
    return [
      {
        key: 'cellType',
        header: 'Cell Type',
        sortable: true,
        width: '120px'
      },
      {
        key: 'description',
        header: 'Description',
        width: '130px'
      },
      {
        key: 'minWeight',
        header: 'Min Weight',
        width: '95px',
        valueFormatter: (value) => value !== null ? value : '-'
      },
      {
        key: 'maxWeight',
        header: 'Max Weight',
        width: '95px',
        valueFormatter: (value) => value !== null ? value : '-'
      },
      {
        key: 'maxLoss',
        header: 'Max Loss (in mL)',
        width: '155px'
      },
      {
        key: 'period',
        header: 'Period (in Days)',
        width: '125px'
      },
      {
        key: 'effectiveDate',
        header: 'Effective Date',
        width: '125px',
        valueFormatter: (value) => value ? DateFieldValidationUtility.formatDateForUI(moment(value)) : '-'
      },
      {
        key: 'terminationDate',
        header: 'Termination Date',
        width: '165px',
        valueFormatter: (value) => value ? DateFieldValidationUtility.formatDateForUI(moment(value)) : '-'
      }
    ];
  }

  private getRowActions(): RowAction<EligibleCellPlasmaLossModel>[] {
    return [
      {
        icon: 'edit',
        iconSvg: 'assets/images/icons/edit.svg',
        label: 'Edit record',
        ariaLabel: 'Edit {{cellType}} record',
        color: 'default',
        action: 'edit'
      }
    ];
  }

  private loadFilterOptions(): void {
    this.eligiblePlasmaCellLossService.getFilterOptions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (options) => {
          this.cellTypeOptions = options.cellTypes;
          this.statusOptions = options.statusOptions;
        },
        error: () => {
          this.snackBar.open('Failed to load filter options. Please refresh the page.', 'Close', {
            duration: 5000, horizontalPosition: 'end', verticalPosition: 'top'
          });
        }
      });
  }

  private setupSearchDebounce(): void {
    this.searchSubject$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(searchText => {
      this.searchText = searchText;
      this.loadData();
    });
  }

  loadData(): void {
    this.isLoading = true;
    this.hasError = false;

    const skip =
      (this.tableConfig.pagination?.pageIndex || 0) *
      (this.tableConfig.pagination?.pageSize || 25);

    const take = this.tableConfig.pagination?.pageSize || 25;

    const params = {
      cellType: this.appliedFilters.cellType || null,
      status: this.appliedFilters.status || 'active',
      searchText: this.searchText || null,
      sort: this.getSortParam(),
      skip: skip,
      take: take
    };

    this.eligiblePlasmaCellLossService.getRecords(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (Array.isArray(response)) {
            this.dataSource = response.map(record => ({
              cellType: record.cellType,
              description: record.description,
              minWeight: record.minWeight,
              maxWeight: record.maxWeight,
              auditKey: record.auditKey,
              maxLoss: record.maxLoss,
              period: record.period,
              effectiveDate: record.effectiveDate,
              terminationDate: record.terminationDate
            }));
            this.tableConfig.pagination!.totalRecords = response.length;
          } else if (response && response.records) {
            const paginatedResponse = response as PaginatedResponse<EligiblePlasmaCellLossRecord>;

            this.dataSource = paginatedResponse.records.map(record => ({
              cellType: record.cellType,
              description: record.description,
              minWeight: record.minWeight,
              maxWeight: record.maxWeight,
              auditKey: record.auditKey,
              maxLoss: record.maxLoss,
              period: record.period,
              effectiveDate: record.effectiveDate,
              terminationDate: record.terminationDate
            }));
            this.tableConfig.pagination!.totalRecords = paginatedResponse.totalCount;
          } else {
            this.dataSource = [];
            this.tableConfig.pagination!.totalRecords = 0;
          }
          this.isLoading = false;
        },
        error: () => {
          this.hasError = true;
          this.errorMessage = 'Failed to load records. Please try again.';
          this.isLoading = false;
        }
      });
  }

  private getSortParam(): string | null {
    if (!this.tableConfig.sortConfig?.column || this.tableConfig.sortConfig.direction === 'default') {
      return null;
    }

    const column = this.tableConfig.sortConfig.column;
    const direction = this.tableConfig.sortConfig.direction === 'A' ? 'asc' : 'desc';

    const columnMap: { [key: string]: string } = {
      'cellType': 'cellType',
      'minWeight': 'fromWeight',
      'maxWeight': 'toWeight',
      'maxLoss': 'maximumLoss',
      'effectiveDate': 'effDate'
    };

    const backendColumn = columnMap[column] || column;
    return `${backendColumn}:${direction}`;
  }

  onSearch(searchText: string): void {
    this.searchSubject$.next(searchText);
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
    this.loadData();
  }

  onRowAction(event: TableRowActionEvent<EligibleCellPlasmaLossModel>): void {
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

  editRecord(record: EligibleCellPlasmaLossModel): void {
    this.isLoading = true;

    this.eligiblePlasmaCellLossService
      .getRecordByAuditKey(record.auditKey!)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: latestRecord => {
          this.isLoading = false;
          this.sidePanelMode = 'edit';
          this.sidePanelData = latestRecord;
          this.sidePanelOpen = true;
        },
        error: () => {
          this.isLoading = false;
          this.hasError = true;
          this.errorMessage = `Failed to load data for record ${record.cellType}. Please try again.`;
        }
      });
  }

  closeSidePanel(): void {
    this.sidePanelOpen = false;
    this.sidePanelData = null;
  }

  onSaveSuccess(): void {
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }
    this.loadData();
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

    const portal = new ComponentPortal(Filter);
    const componentRef = this.overlayRef.attach(portal);

    componentRef.instance.currentFilters = this.appliedFilters;
    componentRef.instance.cellTypeOptions = this.cellTypeOptions;

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

  applyFilters(filters: EligibleCellPlasmaLossFilterValue): void {
    this.appliedFilters = filters;

    this.filterChips = [];

    if (filters.cellType) {
      const cellTypeLabel = this.cellTypeOptions.find(opt => opt.value === filters.cellType)?.label || filters.cellType;
      this.filterChips.push({
        key: 'cellType',
        label: `Cell Type: ${cellTypeLabel}`,
        value: filters.cellType
      });
    }

    if (filters.status && filters.status === 'all') {
      this.filterChips.push({
        key: 'status',
        label: 'Show All Records',
        value: 'all'
      });
    }

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  onRemoveFilterChip(chipKey: string): void {
    const updatedFilters = { ...this.appliedFilters };

    if (chipKey === 'cellType') {
      updatedFilters.cellType = null;
    } else if (chipKey === 'status') {
      updatedFilters.status = 'active';
    }

    this.applyFilters(updatedFilters);
  }

  hasActiveFilters(): boolean {
    return this.filterChips.length > 0;
  }

  clearAllFilters(): void {
    this.appliedFilters = {
      cellType: null,
      status: 'active'
    };
    this.filterChips = [];

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
      this.openFilter();
    }

    if (event.key === 'Escape' && this.overlayRef) {
      event.preventDefault();
      this.overlayRef.dispose();
      this.overlayRef = null;
      this.isFilterOpen = false;
      if (this.filterBtn?.nativeElement) {
        this.filterBtn.nativeElement.blur();
      }
    } else if (event.key === 'Escape' && this.sidePanelOpen) {
      event.preventDefault();
      this.closeSidePanel();
    }
  }
}
