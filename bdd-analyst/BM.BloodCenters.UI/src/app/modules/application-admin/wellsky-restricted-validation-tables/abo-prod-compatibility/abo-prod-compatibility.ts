import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef, ChangeDetectorRef, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil } from 'rxjs';

import { ABOProdCompatibilityService } from './services/abo-prod-compatibility.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import {
  ABOProdCompatibilityModel,
  ABOProdCompatibilityParamsDto,
  ABOProdCompatibilityFilterValue
} from './models/abo-prod-compatibility.model';

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
import { ABOProdCompatibilityFilterChipsUtils } from './utils/filter-chips.utils';
import { ABOProdCompatibilityFilterPanel } from './abo-prod-compatibility-filter-panel/abo-prod-compatibility-filter-panel';
import { AddEditABOProdCompatibility } from './add-edit-abo-prod-compatibility/add-edit-abo-prod-compatibility';

@Component({
  selector: 'app-abo-prod-compatibility',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    DataTable,
    FilterChips,
    AddEditABOProdCompatibility
  ],
  templateUrl: './abo-prod-compatibility.html',
  styleUrls: ['./abo-prod-compatibility.scss']
})
export class ABOProdCompatibilityComponent implements OnInit, OnDestroy {
  @ViewChild(SearchBar) searchBarComponent!: SearchBar;
  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef<HTMLElement>;
  @ViewChild('filterBtn', { read: ElementRef }) filterBtn!: ElementRef<HTMLElement>;

  // Inject PageHeaderService
  private pageHeaderService = inject(PageHeaderService);

  // Effect to update header config when page data changes from DB
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
    breadcrumbs: [
      { label: 'Home', link: '/home' }
    ],
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

  tableConfig: DataTableConfig<ABOProdCompatibilityModel> = {
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
      column: 'requestedABO',
      direction: 'default'
    },
    stickyHeader: true,
    stickyActionsColumn: true,
    emptyMessage: '',
    loadingMessage: '',
    showPagination: true
  };

  appliedFilters: ABOProdCompatibilityFilterValue | null = null;
  filterChips: FilterChip[] = [];

  dataSource: ABOProdCompatibilityModel[] = [];
  requestState: ABOProdCompatibilityParamsDto = {};

  isLoading = false;
  hasError = false;
  errorMessage = '';
  searchText = '';

  // Side Panel State
  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  sidePanelData: ABOProdCompatibilityModel | null = null;

  // Filter Panel State
  isFilterOpen = false;

  private destroy$ = new Subject<void>();
  private overlayRef: OverlayRef | null = null;
  currentYear: number = new Date().getFullYear();

  constructor(
    private aboProdCompatibilityService: ABOProdCompatibilityService,
    private router: Router,
    private overlay: Overlay,
    private cdr: ChangeDetectorRef,
    private headerService: HeaderService
  ) {
    this.initializeConfigurations();
  }

  ngOnInit(): void {
    this.subscribeToChapterChanges();
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.overlayRef) {
      this.overlayRef.dispose();
    }
  }

  /**
   * Subscribe to chapter changes to reset UI state and reload data.
   * Called once in ngOnInit to ensure data consistency when user switches chapters.
   */
  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Reset search
        this.searchText = '';
        if (this.searchBarComponent) {
          this.searchBarComponent.clearSearch();
        }

        // Reset filters
        this.appliedFilters = null;
        this.filterChips = [];
        this.requestState = {};

        // Close filter overlay if open
        if (this.overlayRef) {
          this.overlayRef.dispose();
          this.overlayRef = null;
          this.isFilterOpen = false;
        }

        // Close side panel if open
        this.sidePanelOpen = false;
        this.sidePanelMode = 'add';
        this.sidePanelData = null;

        // Reset sorting to default
        this.tableConfig.sortConfig = {
          column: 'productType',
          direction: 'default'
        };

        // Reset pagination
        if (this.tableConfig.pagination) {
          this.tableConfig.pagination.pageIndex = 0;
          this.tableConfig.pagination.totalRecords = 0;
        }

        // Clear data
        this.dataSource = [];
        this.hasError = false;

        // Reload data for new chapter
        this.loadData();
      });
  }

  private initializeConfigurations(): void {
    // Header config - title and subtitle are populated by PageHeaderService from DB
    this.headerConfig = {
      ...this.headerConfig,
      actions: [{
        label: 'ADD NEW RECORD',
        icon: 'add',
        color: 'accent',
        ariaLabel: 'Add new ABO-Prod-compatibility record',
        onClick: () => this.createRecord()
      }]
    };

    this.searchConfig = {
      placeholder: 'Search by Requested ABO, Compatible ABO',
      minLength: 2,
      ariaLabel: 'Search by Requested ABO, Compatible ABO',
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
        column: 'requestABODisplay',
        direction: 'default'
      },
      stickyHeader: true,
      stickyActionsColumn: true,
      emptyMessage: 'No ABO/Product Compatibility records available to display',
      loadingMessage: 'Loading ABO-Prod-compatibility data...',
      showPagination: true
    };
  }

  private getTableColumns(): TableColumn<ABOProdCompatibilityModel>[] {
    const columns = [
      {
        key: 'productType',
        header: 'Inventory Product Type',
        sortable: false,
        width: '180px'
      },
      {
        key: 'productDescription',
        header: 'Description',
        width: '250px'
      },
      {
        key: 'requestABODisplay',
        header: 'Requested ABO',
        sortable: true,
        width: '180px'
      },
      {
        key: 'compatibleABODisplay',
        header: 'Compatible ABO',
        width: '180px'
      },
      {
        key: 'effectiveDate',
        header: 'Effective Date',
        width: '160px',
        valueFormatter: (value: Date | null | undefined) => this.formatDate(value)
      },
      {
        key: 'terminationDate',
        header: 'Termination Date',
        width: '160px',
        valueFormatter: (value: Date | null | undefined) => this.formatDate(value)
      },
      {
        key: 'modificationDate',
        header: 'Modification Date',
        width: '180px',
        valueFormatter: (value: Date | null | undefined) => this.formatDate(value)
      }
    ];
    return columns;
  }

  private formatDate(date: Date | null | undefined): string {
    if (!date) return '-';

    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = d.getFullYear();

    return `${day}-${month}-${year}`;
  }

  private getRowActions(): RowAction<ABOProdCompatibilityModel>[] {
    return [
      {
        icon: 'edit',
        iconSvg: 'assets/images/icons/edit.svg',
        label: '',
        ariaLabel: '',
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
      (this.tableConfig.pagination?.pageSize || 10);

    const take = this.tableConfig.pagination?.pageSize || 10;

    this.aboProdCompatibilityService
      .getABOProdCompatibility(take, skip, this.requestState)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: { data: ABOProdCompatibilityModel[]; totalRecords: number }) => {
          this.dataSource = response.data;
          this.tableConfig.pagination!.totalRecords = response.totalRecords;
          this.isLoading = false;
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error loading ABO-Prod-compatibility data:', error);
          this.hasError = true;
          this.isLoading = false;
          this.errorMessage = 'Failed to load ABO-Prod-compatibility data. Please try again.';
        }
      });
  }

  onSearch(searchText: string): void {
    this.requestState.SearchKeyword = searchText || undefined;

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

    this.requestState.Sort =
      event.direction === 'default' ? undefined : event.direction;

    this.loadData();
  }

  onRowAction(event: TableRowActionEvent<ABOProdCompatibilityModel>): void {
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

  editRecord(record: ABOProdCompatibilityModel): void {
    this.sidePanelMode = 'edit';
    this.sidePanelData = record;
    this.sidePanelOpen = true;
  }

  closeSidePanel(): void {
    this.sidePanelOpen = false;
    this.sidePanelData = null;
  }

  onSaveSuccess(): void {
    this.loadData();
  }

  onModeChange(newMode: 'add' | 'edit'): void {
    this.sidePanelMode = newMode;
    if (newMode === 'add') {
      this.sidePanelData = null;
    }
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

  openFilter(): void {
    if (this.overlayRef) {
      this.closeFilterPanel();
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

    const portal = new ComponentPortal(ABOProdCompatibilityFilterPanel);
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

  applyFilters(filters: ABOProdCompatibilityFilterValue): void {
    this.appliedFilters = filters;

    this.filterChips = ABOProdCompatibilityFilterChipsUtils.convertFiltersToChips(filters);

    this.requestState = {
      ...this.requestState,
      InventoryProductType: filters.inventoryProductType || undefined,
      EffectiveDateAfter: filters.effectiveDateAfter || undefined,
      EffectiveDateBefore: filters.effectiveDateBefore || undefined,
      TerminationDateAfter: filters.terminationDateAfter || undefined,
      TerminationDateBefore: filters.terminationDateBefore || undefined
    };

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  onRemoveFilterChip(chipKey: string): void {
    this.appliedFilters = ABOProdCompatibilityFilterChipsUtils.removeFilterByChipKey(
      this.appliedFilters,
      chipKey
    );

    this.filterChips = ABOProdCompatibilityFilterChipsUtils.convertFiltersToChips(this.appliedFilters);

    this.updateRequestStateFromFilters();

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  hasActiveFilters(): boolean {
    return ABOProdCompatibilityFilterChipsUtils.hasActiveFilters(this.appliedFilters);
  }

  clearAllFilters(): void {
    this.appliedFilters = null;
    this.filterChips = [];

    const { InventoryProductType, EffectiveDateAfter, EffectiveDateBefore, TerminationDateAfter, TerminationDateBefore, ...rest } = this.requestState;
    this.requestState = rest;

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  private updateRequestStateFromFilters(): void {
    if (!this.appliedFilters) {
      const { InventoryProductType, EffectiveDateAfter, EffectiveDateBefore, TerminationDateAfter, TerminationDateBefore, ...rest } = this.requestState;
      this.requestState = rest;
      return;
    }

    this.requestState = {
      ...this.requestState,
      InventoryProductType: this.appliedFilters.inventoryProductType || undefined,
      EffectiveDateAfter: this.appliedFilters.effectiveDateAfter || undefined,
      EffectiveDateBefore: this.appliedFilters.effectiveDateBefore || undefined,
      TerminationDateAfter: this.appliedFilters.terminationDateAfter || undefined,
      TerminationDateBefore: this.appliedFilters.terminationDateBefore || undefined
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
      this.closeFilterPanel();
    }

    // Escape: Close side panel if open
    if (event.key === 'Escape' && this.sidePanelOpen) {
      event.preventDefault();
      this.closeSidePanel();
    }
  }
}
