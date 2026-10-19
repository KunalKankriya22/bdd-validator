import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';

import { CityStateZipQueryService } from './services/city-state-zip-query.service';
import {
  CityStateZipQueryModel,
  CityStateZipFilterValue,
  CityStateZipQueryParams
} from './models/city-state-zip-query.model';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TableColumn,
  TablePageEvent,
  TableSortEvent,
  TableRowActionEvent
} from '@shared/interfaces/data-table.interface';

import {
  Overlay,
  OverlayRef,
  FlexibleConnectedPositionStrategy
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';

import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { CityStateZipFilterChipsUtils } from './utils/filter-chips.utils';
import { CityStateZipFilterPanel } from './city-state-zip-filter-panel/city-state-zip-filter-panel';
import { NewZipCodeDialog } from '@shared/components/new-zip-code/new-zip-code';

@Component({
  selector: 'app-city-state-zip-query',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    DataTable,
    FilterChips
  ],
  templateUrl: './city-state-zip-query.html',
  styleUrls: ['./city-state-zip-query.scss']
})
export class CityStateZipQueryComponent implements OnInit, OnDestroy {
  private readonly service = inject(CityStateZipQueryService);
  private readonly overlay = inject(Overlay);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly dialog = inject(MatDialog);

  @ViewChild(SearchBar) searchBarComponent!: SearchBar;
  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef<HTMLElement>;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
    actions: []
  };

  searchConfig: SearchBarConfig = {
    placeholder: '',
    minLength: 2,
    ariaLabel: ''
  };

  tableConfig: DataTableConfig<CityStateZipQueryModel> = {
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
      column: '',
      direction: 'default'
    },
    stickyHeader: true,
    stickyActionsColumn: false,
    emptyMessage: '',
    loadingMessage: '',
    showPagination: true
  };

  appliedFilters: CityStateZipFilterValue | null = null;
  filterChips: FilterChip[] = [];

  dataSource: CityStateZipQueryModel[] = [];
  requestState: CityStateZipQueryParams = {};

  isLoading = false;
  hasError = false;
  errorMessage = '';

  isFilterOpen = false;

  private destroy$ = new Subject<void>();
  private overlayClose$ = new Subject<void>();
  private overlayRef: OverlayRef | null = null;

  constructor() {
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
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.overlayClose$.complete();

    if (this.overlayRef) {
      this.overlayRef.dispose();
    }
  }

  private closeOverlay(): void {
    this.overlayClose$.next();
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
    this.isFilterOpen = false;
  }

  private initializeConfigurations(): void {
    this.headerConfig = {
      breadcrumbs: [
        { label: 'Home', link: '/home' },
        { label: 'City, State, and Zip Query', link: null }
      ],
      title: 'City, State, and Zip Query',
      subtitle: 'Search, view, and manage city, state, ZIP code, and county records in the system.',
      actions: [
        {
          label: 'ADD NEW ZIP',
          icon: 'add',
          onClick: () => this.openAddDialog(),
          color: 'primary'
        }
      ]
    };

    this.searchConfig = {
      placeholder: 'Search',
      minLength: 2,
      ariaLabel: 'Search city, state, zip, or county',
      alwaysShowTooltip: false,
      searchOnEnterOnly: true
    };

    this.tableConfig = {
      columns: this.getTableColumns(),
      rowActions: [
        {
          action: 'edit',
          icon: 'edit',
          ariaLabel: 'Edit city/state/zip record'
        }
      ],
      pagination: {
        pageSize: 25,
        pageIndex: 0,
        totalRecords: 0,
        pageSizeOptions: [10, 25, 50, 100],
        showFirstLastButtons: true
      },
      sortConfig: {
        column: '',
        direction: 'default'
      },
      stickyHeader: true,
      stickyActionsColumn: true,
      emptyMessage: 'No city, state, and zip records found.',
      loadingMessage: 'Loading city, state, and zip records...',
      showPagination: true
    };
  }

  private getTableColumns(): TableColumn<CityStateZipQueryModel>[] {
    return [
      {
        key: 'city',
        header: 'City',
        sortable: false,
        width: '385px'
      },
      {
        key: 'zip',
        header: 'Zip Code',
        sortable: false,
        width: '206px'
      },
      {
        key: 'state',
        header: 'State',
        sortable: false,
        width: '209px'
      },
      {
        key: 'county',
        header: 'County',
        sortable: false,
        width: '275px'
      },
      {
        key: 'commonlyUsedFlag',
        header: 'Used Flag',
        sortable: false,
        width: '212px',
        valueFormatter: (value) => value || '-'
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

    // Map sort direction from 'A'/'D' to 'ASC'/'DESC'
    const sortOrder = this.tableConfig.sortConfig?.direction === 'A' ? 'ASC' :
                      this.tableConfig.sortConfig?.direction === 'D' ? 'DESC' : undefined;

    const params: CityStateZipQueryParams = {
      ...this.requestState,
      sortColumn: this.tableConfig.sortConfig?.column,
      sortOrder
    };

    this.service
      .query(take, skip, params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dataSource = response.data;
          this.tableConfig.pagination!.totalRecords = response.totalRecords;
          this.isLoading = false;
        },
        error: () => {
          this.hasError = true;
          this.isLoading = false;
          this.errorMessage = 'Failed to load city, state, and zip records.';
        }
      });
  }

  onSearch(searchText: string): void {
    const trimmed = (searchText || '').trim();
    if (trimmed === '') {
      this.requestState.searchKeyword = undefined;
    } else {
      this.requestState.searchKeyword = trimmed;
    }
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
    this.loadData();
  }

  onRowAction(event: TableRowActionEvent<CityStateZipQueryModel>): void {
    if (event.action === 'edit') {
      this.openEditDialog(event.row);
    }
  }

  openEditDialog(record: CityStateZipQueryModel): void {
    const dialogRef = this.dialog.open(NewZipCodeDialog, {
      width: '900px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      position: { bottom: '0px', right: '0px' },
      panelClass: 'new-zip-code-panel',
      autoFocus: false,
      data: { title: 'Edit Zip Code', record },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.action === 'save') {
        this.loadData();
      }
    });
  }

  openFilter(): void {
    if (this.overlayRef) {
      this.closeOverlay();
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

    const portal = new ComponentPortal(CityStateZipFilterPanel);
    const componentRef = this.overlayRef.attach(portal);

    componentRef.instance.currentFilters = this.appliedFilters;

    componentRef.instance.apply
      .pipe(takeUntil(this.overlayClose$))
      .subscribe(filters => {
        this.applyFilters(filters);
        this.closeOverlay();
      });

    componentRef.instance.close
      .pipe(takeUntil(this.overlayClose$))
      .subscribe(() => {
        this.closeOverlay();
      });

    this.overlayRef.backdropClick()
      .pipe(takeUntil(this.overlayClose$))
      .subscribe(() => {
        this.closeOverlay();
      });
  }

  applyFilters(filters: CityStateZipFilterValue): void {
    this.appliedFilters = filters;
    this.filterChips = CityStateZipFilterChipsUtils.convertFiltersToChips(filters);

    this.requestState = {
      ...this.requestState,
      city: filters.city || undefined,
      zip: filters.zip || undefined,
      county: filters.county || undefined,
      state: filters.state || undefined
    };

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  onRemoveFilterChip(chipKey: string): void {
    this.appliedFilters = CityStateZipFilterChipsUtils.removeFilterByChipKey(
      this.appliedFilters,
      chipKey
    );

    this.filterChips = CityStateZipFilterChipsUtils.convertFiltersToChips(this.appliedFilters);
    this.updateRequestStateFromFilters();

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  hasActiveFilters(): boolean {
    return CityStateZipFilterChipsUtils.hasActiveFilters(this.appliedFilters);
  }

  clearAllFilters(): void {
    this.appliedFilters = null;
    this.filterChips = [];

    const { city, zip, county, state, ...rest } = this.requestState;
    this.requestState = rest;

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }
    this.loadData();
  }

  private updateRequestStateFromFilters(): void {
    if (!this.appliedFilters) {
      const { city, zip, county, state, ...rest } = this.requestState;
      this.requestState = rest;
      return;
    }

    this.requestState = {
      ...this.requestState,
      city: this.appliedFilters.city || undefined,
      zip: this.appliedFilters.zip || undefined,
      county: this.appliedFilters.county || undefined,
      state: this.appliedFilters.state || undefined
    };
  }

  openAddDialog(): void {
    const dialogRef = this.dialog.open(NewZipCodeDialog, {
      width: '900px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      position: { bottom: '0px', right: '0px' },
      panelClass: 'new-zip-code-panel',
      autoFocus: false,
      data: { title: 'Add New Zip Code' },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.action === 'save') {
        this.loadData();
      }
    });
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent): void {
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
      this.closeOverlay();
    }
  }
}
