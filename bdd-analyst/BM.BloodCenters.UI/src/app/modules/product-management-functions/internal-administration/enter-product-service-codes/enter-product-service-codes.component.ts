import { Component, OnInit, OnDestroy, ViewChild, ElementRef, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil, filter } from 'rxjs';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { ComponentPortal } from '@angular/cdk/portal';

import { EnterProductServiceCodesApiService } from './services/enter-product-service-codes-api.service';
import { LoggingService } from '@shared/services/logging.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { MenuService } from '@shared/services/menu.service';

import {
  ProductServiceCodeDto,
  ProductServiceCodeQueryDto,
  FilterValue,
  ProductCodeLOV,
  InventoryProductTypeLOV,
  ProductionProductTypeLOV,
  ServiceCodeLOV
} from './models/enter-product-service-codes.model';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TableColumn,
  TablePageEvent,
  TableSortEvent,
  RowAction,
  TableRowActionEvent
} from '@shared/interfaces/data-table.interface';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';

import { EnterProductServiceCodesFilterPanel } from './enter-product-service-codes-filter-panel/enter-product-service-codes-filter-panel';
import { EditProductServiceCodeDialog } from './edit-product-service-code-dialog/edit-product-service-code-dialog';
import { EnterProductServiceCodesFilterChipsUtils } from './utils/filter-chips.utils';

import { ROUTE_REGISTRY } from 'src/app/core/constants/route-registry';
import { RouteKey } from 'src/app/core/constants/route-keys';
import moment from 'moment';

@Component({
  selector: 'app-enter-product-service-codes',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    DataTable,
    FilterChips,
    EditProductServiceCodeDialog
  ],
  templateUrl: './enter-product-service-codes.component.html',
  styleUrls: ['./enter-product-service-codes.component.scss']
})
export class EnterProductServiceCodesComponent implements OnInit, OnDestroy {
  // Unique ID generation for accessibility
  private static nextId = 0;
  readonly componentId = `enter-product-service-codes-${EnterProductServiceCodesComponent.nextId++}`;
  readonly elementId = (name: string) => `${this.componentId}-${name}`;

  @ViewChild(SearchBar) searchBarComponent!: SearchBar;
  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef<HTMLElement>;
  @ViewChild('filterBtn', { read: ElementRef }) filterBtn!: ElementRef<HTMLElement>;
  @ViewChild('controlsSection', { read: ElementRef }) controlsSection!: ElementRef<HTMLElement>;

  private service = inject(EnterProductServiceCodesApiService);
  private overlay = inject(Overlay);
  private loggingService = inject(LoggingService);
  private snackbarService = inject(SnackbarService);
  private headerService = inject(HeaderService);
  private pageHeaderService = inject(PageHeaderService);
  private menuService = inject(MenuService);
  private liveAnnouncer = inject(LiveAnnouncer);

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
    actions: []
  };

  searchConfig: SearchBarConfig = {
    placeholder: 'Search by product code or product type',
    minLength: 2,
    searchOnEnterOnly: true,
    ariaLabel: 'Search by product code or product type'
  };

  tableConfig: DataTableConfig<ProductServiceCodeDto> = {
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
      column: 'productCode',
      direction: 'default'
    },
    stickyHeader: true,
    stickyActionsColumn: true,
    emptyMessage: 'No product service codes found',
    noDataIcon: 'edit',
    loadingMessage: 'Loading product service codes...',
    showPagination: true
  };

  dataSource: ProductServiceCodeDto[] = [];
  private allData: ProductServiceCodeDto[] = [];
  appliedFilters: FilterValue | null = null;
  filterChips: FilterChip[] = [];

  // LOV options
  productCodeOptions: ProductCodeLOV[] = [];
  inventoryProductTypeOptions: InventoryProductTypeLOV[] = [];
  productionProductTypeOptions: ProductionProductTypeLOV[] = [];
  serviceCodeOptions: ServiceCodeLOV[] = [];

  // State
  private serverTotalRecords = 0;
  isLoading = false;
  hasError = false;
  errorMessage = '';
  searchTerm = '';
  isFilterOpen = false;

  // Side panel state
  sidePanelOpen = false;
  sidePanelData: ProductServiceCodeDto | null = null;

  // Filter panel overlay
  private overlayRef: OverlayRef | null = null;
  private destroy$ = new Subject<void>();

  constructor() {
    this.initializeTableConfig();

    // Update page header when menu data is loaded
    effect(() => {
      const menuItems = this.menuService.getMenuItemsSignal()();

      if (menuItems.length > 0) {
        const basePath = ROUTE_REGISTRY[RouteKey.EnterProductServiceCodes]?.path;
        const menuItem = basePath ? this.menuService.findMenuItemByPath(basePath) : null;

        if (menuItem) {
          this.headerConfig = {
            ...this.headerConfig,
            breadcrumbs: [
              { label: 'Home', link: '/home' },
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
    this.loadData();
    this.subscribeToChapterChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.closeFilterPanel();
  }

  private initializeTableConfig(): void {
    const columns: TableColumn<ProductServiceCodeDto>[] = [
      {
        key: 'productCode',
        header: 'Product Code',
        sortable: true,
        width: '120px'
      },
      {
        key: 'productDesc',
        header: 'Description',
        sortable: false,
        width: 'auto'
      },
      {
        key: 'productType',
        header: 'Product Type',
        sortable: false,
        width: '120px'
      },
      {
        key: 'invProductType',
        header: 'Inventory Type',
        sortable: false,
        width: '120px'
      },
      {
        key: 'outOfStateFlag',
        header: 'Out-of-State',
        sortable: false,
        width: '120px',
        valueFormatter: (value: string, row: ProductServiceCodeDto) => row.outOfStateFlag === 'Y' ? 'Yes' : 'No'
      },
      {
        key: 'returnable',
        header: 'Returnable',
        sortable: false,
        width: '120px',
        valueFormatter: (value: string, row: ProductServiceCodeDto) => row.returnable === 'Y' ? 'Yes' : 'No'
      },
      {
        key: 'stdPrice',
        header: 'Price',
        sortable: false,
        width: '100px',
        valueFormatter: (value: number | null, row: ProductServiceCodeDto) => row.stdPrice != null ? '$' + row.stdPrice.toFixed(2) : '-'
      },
      {
        key: 'serviceCode',
        header: 'Service Code',
        sortable: false,
        width: '120px'
      }
    ];

    const rowActions: RowAction<ProductServiceCodeDto>[] = [
      {
        icon: 'edit',
        iconSvg: 'assets/images/icons/edit.svg',
        label: 'Edit product service code',
        ariaLabel: 'Edit product {{productCode}}',
        color: 'default',
        action: 'edit'
      }
    ];

    this.tableConfig = {
      ...this.tableConfig,
      columns,
      rowActions
    };
  }

  private extractFilterOptionsFromData(data: ProductServiceCodeDto[]): void {
    const productCodeMap = new Map<string, string>();
    const invProductTypeMap = new Map<string, string>();
    const productTypeSet = new Set<string>();
    const serviceCodeSet = new Set<string>();

    data.forEach((row) => {
      if (row.productCode) {
        productCodeMap.set(row.productCode, row.productDesc || '');
      }
      if (row.invProductType) {
        invProductTypeMap.set(row.invProductType, row.invProductType);
      }
      if (row.productType) {
        productTypeSet.add(row.productType);
      }
      if (row.serviceCode) {
        serviceCodeSet.add(row.serviceCode);
      }
    });

    this.productCodeOptions = Array.from(productCodeMap, ([productCode, productDesc]) => ({ productCode, productDesc }));
    this.inventoryProductTypeOptions = Array.from(invProductTypeMap, ([productType]) => ({ productType, productTypeDesc: productType }));
    this.productionProductTypeOptions = Array.from(productTypeSet, (productType) => ({ productType }));
    this.serviceCodeOptions = Array.from(serviceCodeSet, (serviceCode) => ({ serviceCode }));
  }

  loadData(): void {
    this.isLoading = true;
    this.hasError = false;

    const direction = this.tableConfig.sortConfig?.direction;
    const query: ProductServiceCodeQueryDto = {
      sortColumn: 'ProductCode',
      sortOrder: direction === 'D' ? 'DESC' : 'ASC'
    };

    if (this.searchTerm) {
      query.searchKeyword = this.searchTerm;
    }

    const pageSize = this.tableConfig.pagination!.pageSize;
    const pageIndex = this.tableConfig.pagination!.pageIndex;
    const skip = pageIndex * pageSize;

    this.service
      .getProductServiceCodes(query, pageSize, skip)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.allData = response.data;
          this.dataSource = response.data;
          this.serverTotalRecords = response.total;
          this.extractFilterOptionsFromData(response.data);

          // Update pagination with server's total count
          this.tableConfig = {
            ...this.tableConfig,
            pagination: {
              ...this.tableConfig.pagination!,
              totalRecords: response.total
            }
          };

          this.applyClientFilters();
          this.isLoading = false;
        },
        error: (error) => {
          this.isLoading = false;
          this.hasError = true;
          this.errorMessage = 'Failed to load product service codes. Please try again.';
          this.loggingService.error('Failed to load product service codes', error);
          this.snackbarService.showError('Failed to load product service codes');
        }
      });
  }

  private applyClientFilters(): void {
    let filtered = [...this.allData];

    if (this.appliedFilters) {
      if (this.appliedFilters.productCode) {
        filtered = filtered.filter(row => row.productCode === this.appliedFilters!.productCode);
      }
      if (this.appliedFilters.invProductType) {
        filtered = filtered.filter(row => row.invProductType === this.appliedFilters!.invProductType);
      }
      if (this.appliedFilters.productType) {
        filtered = filtered.filter(row => row.productType === this.appliedFilters!.productType);
      }
      if (this.appliedFilters.serviceCode) {
        filtered = filtered.filter(row => row.serviceCode === this.appliedFilters!.serviceCode);
      }
    }

    this.dataSource = filtered;
    const hasActiveFilters = this.appliedFilters &&
      Object.keys(this.appliedFilters).some(key => this.appliedFilters![key as keyof FilterValue]);
    const totalRecords = hasActiveFilters ? filtered.length : this.serverTotalRecords;
    this.tableConfig = {
      ...this.tableConfig,
      pagination: {
        ...this.tableConfig.pagination!,
        totalRecords
      }
    };

    if (hasActiveFilters) {
      this.liveAnnouncer.announce(`${filtered.length} results found after filtering`);
    }
  }

  onSearch(searchTerm: string): void {
    this.searchTerm = searchTerm;
    this.updatePagination({ pageIndex: 0 });
    this.loadData();
  }


  onPageChange(event: TablePageEvent): void {
    this.updatePagination({ pageSize: event.pageSize, pageIndex: event.pageIndex });
    this.loadData();
  }

  onSortChange(event: TableSortEvent): void {
    const currentDirection = this.tableConfig.sortConfig?.direction;
    let nextDirection: 'A' | 'D' | 'default';

    if (currentDirection === 'default') {
      nextDirection = 'A';
    } else if (currentDirection === 'A') {
      nextDirection = 'D';
    } else {
      nextDirection = 'default';
    }

    this.tableConfig = {
      ...this.tableConfig,
      sortConfig: { column: event.column, direction: nextDirection },
      pagination: { ...this.tableConfig.pagination!, pageIndex: 0 }
    };
    this.loadData();
  }

  private updatePagination(changes: Partial<typeof this.tableConfig.pagination>): void {
    this.tableConfig = {
      ...this.tableConfig,
      pagination: { ...this.tableConfig.pagination!, ...changes }
    };
  }

  onRowAction(event: TableRowActionEvent<ProductServiceCodeDto>): void {
    if (event.action === 'edit') {
      this.editRecord(event.row);
    }
  }

  openFilterPanel(): void {
    if (this.overlayRef) {
      this.closeFilterPanel();
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

    const filterPanelPortal = new ComponentPortal(EnterProductServiceCodesFilterPanel);
    const componentRef = this.overlayRef.attach(filterPanelPortal);

    // Pass data to filter panel
    componentRef.instance.currentFilters = this.appliedFilters;
    componentRef.instance.productCodeOptions = this.productCodeOptions;
    componentRef.instance.inventoryProductTypeOptions = this.inventoryProductTypeOptions;
    componentRef.instance.productionProductTypeOptions = this.productionProductTypeOptions;
    componentRef.instance.serviceCodeOptions = this.serviceCodeOptions;

    // Handle filter panel events
    componentRef.instance.apply.pipe(takeUntil(this.destroy$)).subscribe((filters: FilterValue) => {
      this.applyFilters(filters);
      this.closeFilterPanel();
    });

    componentRef.instance.close.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.closeFilterPanel();
    });

    // Close on backdrop click
    this.overlayRef.backdropClick().pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.closeFilterPanel();
    });

    // Close on Escape key
    this.overlayRef.keydownEvents().pipe(
      takeUntil(this.destroy$),
      filter((event: KeyboardEvent) => event.key === 'Escape')
    ).subscribe(() => {
      this.closeFilterPanel();
    });
  }

  private closeFilterPanel(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
    this.isFilterOpen = false;
    if (this.filterBtn?.nativeElement) {
      this.filterBtn.nativeElement.focus();
    }
  }

  private applyFilters(filters: FilterValue): void {
    this.appliedFilters = filters;
    this.updateFilterChips();
    this.updatePagination({ pageIndex: 0 });
    this.applyClientFilters();
  }

  private updateFilterChips(): void {
    if (!this.appliedFilters || Object.keys(this.appliedFilters).length === 0) {
      this.filterChips = [];
      return;
    }

    this.filterChips = EnterProductServiceCodesFilterChipsUtils.createFilterChips(
      this.appliedFilters,
      this.productCodeOptions,
      this.inventoryProductTypeOptions,
      this.productionProductTypeOptions,
      this.serviceCodeOptions
    );
  }

  onRemoveFilterChip(chipKey: string): void {
    if (!this.appliedFilters) {
      return;
    }

    this.appliedFilters = EnterProductServiceCodesFilterChipsUtils.removeFilter(
      this.appliedFilters,
      chipKey
    );

    this.updateFilterChips();
    this.updatePagination({ pageIndex: 0 });
    this.applyClientFilters();
  }

  onClearAllFilters(): void {
    this.appliedFilters = EnterProductServiceCodesFilterChipsUtils.clearAllFilters();
    this.updateFilterChips();
    this.updatePagination({ pageIndex: 0 });
    this.applyClientFilters();
  }

  editRecord(row: ProductServiceCodeDto): void {
    this.sidePanelData = row;
    this.sidePanelOpen = true;
  }

  closeSidePanel(): void {
    this.sidePanelOpen = false;
    this.sidePanelData = null;
  }

  onSaveSuccess(): void {
    this.loadData();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Reset state on chapter change
        this.appliedFilters = null;
        this.filterChips = [];
        this.searchTerm = '';
        this.updatePagination({ pageIndex: 0 });
        this.loadData();
      });
  }
}
