import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef, effect, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil } from 'rxjs';

import { PoolCompatibilityMatrixService } from '../services/pool-compatibility-matrix.service';
import {
  PoolCompatibilityMatrixModel,
  PoolCompatibilityMatrixParamsDto,
  PoolCompatibilityMatrixFilterValue
} from '../models/pool-compatibility-matrix.model';
import { VALIDATION_POOL_COMPATIBILITY_MATRIX } from 'src/app/core/constants/validation.constants';

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
import { PoolCompatibilityMatrixFilterPanel } from '../pool-compatibility-matrix-filter-panel/pool-compatibility-matrix-filter-panel';
import { AddEditPoolCompatibilityMatrix } from '../add-edit-pool-compatibility-matrix/add-edit-pool-compatibility-matrix';

import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { PoolCompatibilityMatrixFilterChipsUtils } from '../utils/pool-compatibility-matrix-filter-chips.utils';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-pool-compatibility-matrix-table',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    DataTable,
    FilterChips,
    AddEditPoolCompatibilityMatrix
  ],
  templateUrl: './pool-compatibility-matrix-table.html',
  styleUrls: ['./pool-compatibility-matrix-table.scss']
})
export class PoolCompatibilityMatrixTable implements OnInit, OnDestroy {
  @ViewChild(SearchBar) searchBarComponent!: SearchBar;
  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef<HTMLElement>;
  @ViewChild('filterBtn', { read: ElementRef }) filterBtn!: ElementRef<HTMLElement>;

  readonly VALIDATION = VALIDATION_POOL_COMPATIBILITY_MATRIX.POOL_COMPATIBILITY_MATRIX_TABLE;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
    actions: []
  };

  searchConfig: SearchBarConfig = {
    placeholder: '',
    minLength: 0,
    ariaLabel: '',
    searchOnEnterOnly: true
  };

  tableConfig: DataTableConfig<PoolCompatibilityMatrixModel> = {
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
      column: 'inventoryProductType',
      direction: 'default'
    },
    stickyHeader: true,
    stickyActionsColumn: true,
    emptyMessage: '',
    loadingMessage: '',
    showPagination: true
  };

  appliedFilters: PoolCompatibilityMatrixFilterValue | null = null;
  filterChips: FilterChip[] = [];

  dataSource: PoolCompatibilityMatrixModel[] = [];
  requestState: PoolCompatibilityMatrixParamsDto = {};

  isLoading = false;
  hasError = false;
  errorMessage = '';
  searchText = '';

  // Side Panel State
  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  sidePanelData: PoolCompatibilityMatrixModel | null = null;
  editingRow: PoolCompatibilityMatrixModel | null = null;

  // Filter Panel State
  isFilterOpen = false;

  private destroy$ = new Subject<void>();
  private overlayRef: OverlayRef | null = null;

  constructor(
    private poolCompatibilityMatrixService: PoolCompatibilityMatrixService,
    private overlay: Overlay,
    private dialog: MatDialog,
    private pageHeaderService: PageHeaderService,
    private headerService: HeaderService,
    private cdr: ChangeDetectorRef
  ) {
    this.initializeConfigurations();

    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          ...this.headerConfig,
          subtitle: pageData.subtitle || ''
        };
      }
    });
  }

  ngOnInit(): void {
    this.loadPoolCompatibilityMatrixData();
    this.subscribeToChapterChanges();
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
          label: 'Pool Matrix',
          link: null
        }
      ],
      title: 'Pool Matrix',
      subtitle: '',
      actions: [
        {
          label: 'ADD NEW RECORD',
          icon: 'add',
          color: 'accent',
          ariaLabel: 'Add new pool compatibility record',
          onClick: () => this.createRecord()
        }
      ]
    };

    this.searchConfig = {
      placeholder: 'Search by work option',
      minLength: 0,
      ariaLabel: 'Search by work option',
      searchOnEnterOnly: true
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
        column: 'workOption',
        direction: 'default'
      },
      stickyHeader: true,
      stickyActionsColumn: true,
      emptyMessage: 'No Pool Compatibility Records Available To Display',
      noDataIcon: 'inbox',
      loadingMessage: 'Loading pool compatibility matrix data...',
      showPagination: true
    };
  }

  private getTableColumns(): TableColumn<PoolCompatibilityMatrixModel>[] {
    return [
      {
        key: 'workOption',
        header: 'Work Option',
        sortable: true,
        width: '120px'
      },
      {
        key: 'workOptionDescription',
        header: 'Description',
        sortable: false,
        width: '200px'
      },
      {
        key: 'inventoryProductType',
        header: 'Inventory Product Type',
        sortable: false,
        width: '180px'
      },
      {
        key: 'finishedInventoryProductType',
        header: 'Finished Inventory Product Type',
        sortable: false,
        width: '180px'
      },
      {
        key: 'effectiveDate',
        header: 'Effective Date',
        width: '140px',
        valueFormatter: (value) => value ? this.formatDateDisplay(new Date(value)) : '-'
      },
      {
        key: 'terminationDate',
        header: 'Termination Date',
        width: '150px',
        valueFormatter: (value) => value ? this.formatDateDisplay(new Date(value)) : '-'
      },
      {
        key: 'lastModifiedDate',
        header: 'Modification date',
        width: '140px',
        valueFormatter: (value) => value ? this.formatDateDisplay(new Date(value)) : '-'
      }
    ];
  }

  private getRowActions(): RowAction<PoolCompatibilityMatrixModel>[] {
    return [
      {
        icon: 'edit',
        iconSvg: 'assets/images/icons/edit.svg',
        label: 'Edit Pool Compatibility Record',
        ariaLabel: 'Edit pool compatibility record for {{inventoryProductType}}',
        color: 'default',
        action: 'edit'
      }
    ];
  }

  loadPoolCompatibilityMatrixData(): void {
    this.isLoading = true;
    this.hasError = false;

    const skip =
      (this.tableConfig.pagination?.pageIndex || 0) *
      (this.tableConfig.pagination?.pageSize || 25);

    const take = this.tableConfig.pagination?.pageSize || 25;

    this.poolCompatibilityMatrixService
      .getPoolCompatibilityMatrix(take, skip, this.requestState)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: response => {
          this.dataSource = response.data;
          this.tableConfig = {
            ...this.tableConfig,
            pagination: {
              ...this.tableConfig.pagination!,
              totalRecords: response.totalRecords
            }
          };
          this.isLoading = false;
        },
        error: () => {
          this.hasError = true;
          this.isLoading = false;
          this.errorMessage = this.VALIDATION.MESSAGES.LOAD_ERROR;
        }
      });
  }

  onSearch(searchText: string): void {
    this.searchText = searchText;
    this.requestState.searchItem = searchText || undefined;

    this.tableConfig = {
      ...this.tableConfig,
      pagination: {
        ...this.tableConfig.pagination!,
        pageIndex: 0
      }
    };

    this.loadPoolCompatibilityMatrixData();
  }

  onPageChange(event: TablePageEvent): void {
    this.tableConfig = {
      ...this.tableConfig,
      pagination: {
        ...this.tableConfig.pagination!,
        pageIndex: event.pageIndex,
        pageSize: event.pageSize
      }
    };
    this.loadPoolCompatibilityMatrixData();
  }

  onSortChange(event: TableSortEvent): void {
    this.tableConfig.sortConfig!.column = event.column;
    this.tableConfig.sortConfig!.direction = event.direction;

    this.requestState.sortOrder =
      event.direction === 'default' ? undefined : event.direction;

    this.loadPoolCompatibilityMatrixData();
  }

  onRowAction(event: TableRowActionEvent<PoolCompatibilityMatrixModel>): void {
    if (event.action === 'edit') {
      this.editRecord(event.row);
    }
  }

  createRecord(): void {
    this.sidePanelMode = 'add';
    this.sidePanelData = null;
    this.editingRow = null;
    this.sidePanelOpen = true;
  }

  editRecord(record: PoolCompatibilityMatrixModel): void {
    this.sidePanelMode = 'edit';
    this.sidePanelData = record;
    this.editingRow = record;
    this.sidePanelOpen = true;
  }

  closeSidePanel(): void {
    this.sidePanelOpen = false;
    this.sidePanelData = null;
    this.editingRow = null;
  }

  closeFilterPanel(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
      this.isFilterOpen = false;
    }
    if (this.filterBtn?.nativeElement) {
      (this.filterBtn.nativeElement as HTMLElement).blur();
    }
    this.cdr.markForCheck();
  }

  onSaveSuccess(): void {
    this.loadPoolCompatibilityMatrixData();
  }

  onModeChange(newMode: 'add' | 'edit'): void {
    this.sidePanelMode = newMode;
    if (newMode === 'add') {
      this.sidePanelData = null;
      this.editingRow = null;
    }
  }

  openFilter(): void {
    if (this.overlayRef) {
      this.closeFilterPanel();
      return;
    }

    this.isFilterOpen = true;

    const positionStrategy: FlexibleConnectedPositionStrategy =
      this.overlay.position()
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
        .withPush(true)
        .withViewportMargin(16)
        .withFlexibleDimensions(false)
        .withGrowAfterOpen(false);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      scrollStrategy: this.overlay.scrollStrategies.block(),
      width: '320px',
      minWidth: '320px',
      maxWidth: '320px'
    });

    const portal = new ComponentPortal(PoolCompatibilityMatrixFilterPanel);
    const componentRef = this.overlayRef.attach(portal);

    componentRef.instance.currentFilters = this.appliedFilters;

    componentRef.instance.apply
      .pipe(takeUntil(this.destroy$))
      .subscribe(filters => {
        this.applyFilters(filters);
        this.closeFilterPanel();
      });

    componentRef.instance.close
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.closeFilterPanel();
      });

    this.overlayRef.backdropClick()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.closeFilterPanel();
      });
  }

  applyFilters(filters: PoolCompatibilityMatrixFilterValue): void {
    this.appliedFilters = filters;

    this.filterChips = PoolCompatibilityMatrixFilterChipsUtils.convertFiltersToChips(filters);

    this.requestState = {
      ...this.requestState,
      inventoryProductType: filters.inventoryProductType || undefined,
      finishedInventoryProductType: filters.finishedInventoryProductType || undefined,
      effectiveDateFrom: filters.effectiveDateFrom || undefined,
      effectiveDateTo: filters.effectiveDateTo || undefined,
      terminationDateFrom: filters.terminationDateFrom || undefined,
      terminationDateTo: filters.terminationDateTo || undefined
    };

    this.tableConfig = {
      ...this.tableConfig,
      pagination: {
        ...this.tableConfig.pagination!,
        pageIndex: 0
      }
    };

    this.loadPoolCompatibilityMatrixData();
  }

  onRemoveFilterChip(chipKey: string): void {
    this.appliedFilters = PoolCompatibilityMatrixFilterChipsUtils.removeFilterByChipKey(
      this.appliedFilters,
      chipKey
    );

    this.filterChips = PoolCompatibilityMatrixFilterChipsUtils.convertFiltersToChips(this.appliedFilters);

    this.updateRequestStateFromFilters();

    this.tableConfig = {
      ...this.tableConfig,
      pagination: {
        ...this.tableConfig.pagination!,
        pageIndex: 0
      }
    };

    this.loadPoolCompatibilityMatrixData();
  }

  hasActiveFilters(): boolean {
    return PoolCompatibilityMatrixFilterChipsUtils.hasActiveFilters(this.appliedFilters);
  }

  clearAllFilters(): void {
    this.appliedFilters = null;
    this.filterChips = [];

    const { inventoryProductType, finishedInventoryProductType, effectiveDateFrom, effectiveDateTo, terminationDateFrom, terminationDateTo, ...rest } = this.requestState;
    this.requestState = rest;

    this.tableConfig = {
      ...this.tableConfig,
      pagination: {
        ...this.tableConfig.pagination!,
        pageIndex: 0
      }
    };

    this.loadPoolCompatibilityMatrixData();
  }

  private updateRequestStateFromFilters(): void {
    if (!this.appliedFilters) {
      const { inventoryProductType, finishedInventoryProductType, effectiveDateFrom, effectiveDateTo, terminationDateFrom, terminationDateTo, ...rest } = this.requestState;
      this.requestState = rest;
      return;
    }

    this.requestState = {
      ...this.requestState,
      inventoryProductType: this.appliedFilters.inventoryProductType || undefined,
      finishedInventoryProductType: this.appliedFilters.finishedInventoryProductType || undefined,
      effectiveDateFrom: this.appliedFilters.effectiveDateFrom || undefined,
      effectiveDateTo: this.appliedFilters.effectiveDateTo || undefined,
      terminationDateFrom: this.appliedFilters.terminationDateFrom || undefined,
      terminationDateTo: this.appliedFilters.terminationDateTo || undefined
    };
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
      this.closeFilterPanel();
    }

    // Escape: Close side panel if open
    if (event.key === 'Escape' && this.sidePanelOpen) {
      event.preventDefault();
      this.closeSidePanel();
    }
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.searchText = '';
        if (this.searchBarComponent) {
          this.searchBarComponent.clearSearch();
        }

        this.appliedFilters = null;
        this.filterChips = [];
        this.requestState = {};

        this.tableConfig = {
          ...this.tableConfig,
          pagination: {
            ...this.tableConfig.pagination!,
            pageIndex: 0
          }
        };

        this.loadPoolCompatibilityMatrixData();
      });
  }

  private formatDateDisplay(date: Date): string {
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const day = String(date.getDate()).padStart(2, '0');
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }
}
